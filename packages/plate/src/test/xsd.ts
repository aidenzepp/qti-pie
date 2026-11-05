/**
 * The XSD oracle: libxml2's `xmllint` validates a document against one of the XSDs cached under
 * `~/.cache/gr8des/qti3/xsd/`, offline, through an XML catalog that maps the XSDs' purl locations
 * to that cache.
 *
 * Tests use it to show that what plate writes, and the fixtures it reads, are valid against
 * 1EdTech's own schema, which plate's generated tables only approximate. The XSDs are 1EdTech's
 * files: they stay in the cache, and the catalog is written at run time under the test's `TMPDIR`,
 * never into the repository.
 *
 * @module
 */
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Config, Effect, Schema } from "effect";
import type { Scope } from "effect";

/**
 * The verdict of one validation.
 *
 * `messages` are xmllint's own lines, its summary line included, in the order it wrote them; they
 * explain a refusal and are not a stable interface. `binary` names the xmllint that judged: the
 * file that ran and the first line it prints for `--version`, so a report can say which libxml2
 * build gave the verdict.
 */
export interface XsdResult {
  readonly valid: boolean;
  readonly messages: readonly string[];
  readonly binary: { readonly path: string; readonly version: string };
}

/**
 * The failure of a validation that found no xmllint to run.
 *
 * `setting` is the environment variable that names the binary, `value` its value (by
 * default `xmllint`, looked up on `PATH`), and `detail` why that value runs nothing.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class XmllintMissing extends Schema.TaggedError<XmllintMissing>()("XmllintMissing", {
  detail: Schema.String,
  setting: Schema.String,
  value: Schema.String,
}) {
  /**
   * The value that runs nothing, why, and the two ways to supply xmllint.
   */
  override get message(): string {
    return [
      `cannot run xmllint: ${this.setting} is "${this.value}", which ${this.detail}.`,
      `Install libxml2's xmllint on PATH, or set ${this.setting} to the path of an xmllint binary.`,
    ].join("\n");
  }
}

/**
 * The failure of a validation whose XSD xmllint could not use, so it gave no verdict on the
 * document.
 *
 * It covers an XSD that does not exist or does not compile, an import or include the catalog does
 * not reach, and any other exit xmllint documents as not being about the document. `xsd` is the
 * schema's resolved path, `exit` how xmllint ended, and `messages` its lines.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class XsdUnusable extends Schema.TaggedError<XsdUnusable>()("XsdUnusable", {
  exit: Schema.String,
  messages: Schema.Array(Schema.String),
  xsd: Schema.String,
}) {
  /**
   * The schema, how xmllint ended, its lines, and where the schema should be.
   */
  override get message(): string {
    return [
      `xmllint could not use the XSD ${this.xsd} (${this.exit}), so it judged nothing:`,
      ...this.messages,
      "Name an XSD cached under ~/.cache/gr8des/qti3/xsd/ whose imports the oracle's catalog maps.",
    ].join("\n");
  }
}

/**
 * The failure of a validation that could not write its catalog under `TMPDIR`.
 *
 * `directory` is the `TMPDIR` it wrote under, and `detail` the operating system's reason.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class CatalogUnwritable extends Schema.TaggedError<CatalogUnwritable>()(
  "CatalogUnwritable",
  { detail: Schema.String, directory: Schema.String },
) {
  /**
   * The directory, the reason, and the setting to change.
   */
  override get message(): string {
    return `cannot write the XSD oracle's catalog under ${this.directory}: ${this.detail}. Set TMPDIR to a writable directory; plate's test script sets it to work/.vp-tmp.`;
  }
}

/**
 * The environment variable that names the xmllint binary.
 */
const xmllintSetting = "PLATE_XMLLINT";

/**
 * The xmllint to run: `PLATE_XMLLINT`, by default `xmllint`. A value with a `/` is a path, resolved
 * against the working directory; any other value is a name looked up on {@link searchPath}.
 */
const xmllintValue = Config.String(xmllintSetting).pipe(Config.withDefault("xmllint"));

/**
 * The directories a bare xmllint name is looked up in, `PATH`, empty when it is unset.
 */
const searchPath = Config.String("PATH").pipe(Config.withDefault(""));

/**
 * Where the XSDs are cached, `.cache/gr8des/qti3/xsd` under `HOME`. A relative `xsdPath` given to
 * {@link validateAgainst} names a file here, and the catalog maps every purl location into it.
 */
export const xsdDirectory: Config.Config<string> = Config.String("HOME").pipe(
  Config.map((home) => path.join(home, ".cache", "gr8des", "qti3", "xsd")),
);

/**
 * The directory the catalog is written under, the test's `TMPDIR`. It has no default, because the
 * system's own temporary directory is never scratch space here.
 */
const scratchDirectory = Config.NonEmptyString("TMPDIR");

/**
 * The purl prefixes the cached XSDs import from, each with the folder under {@link xsdDirectory}
 * that holds the files it names.
 *
 * MathML's and SSML's entry files, `mathml3.xsd` and `ssmlv1p1-core.xsd`, sit at the cache's top
 * beside the QTI XSDs, while the files they include sit in `mathml/` and `ssml/`; {@link
 * cacheLayoutRewrites} sends those includes on.
 */
const purlRewrites: readonly (readonly [prefix: string, folder: string])[] = [
  ["https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/", ""],
  ["https://purl.imsglobal.org/spec/md/v1p3/schema/xsd/", "md/"],
  ["https://purl.imsglobal.org/spec/w3/1999/schema/xsd/", "w3/"],
  ["https://purl.imsglobal.org/spec/w3/2001/schema/xsd/", "w3/"],
  ["https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/", ""],
  ["https://purl.imsglobal.org/spec/ssml/v1p1/schema/xsd/", ""],
];

/**
 * File-name prefixes, relative to the cache's top, that the catalog moves into a subfolder.
 *
 * An `xs:include` or `xs:redefine` resolves, in libxml2, against the including file's rewritten
 * location, not its purl, so `mathml3.xsd`'s `mathml3-content.xsd` and `ssmlv1p1-core.xsd`'s
 * `synthesis-nonamespace.xsd` are asked for at the cache's top as `file:` URLs. These rewrites,
 * which libxml2 applies to `file:` URLs as to any other, send them to `mathml/` and `ssml/`, where
 * the cache holds them. Without them the ASI XSD does not compile.
 */
const cacheLayoutRewrites: readonly (readonly [prefix: string, folder: string])[] = [
  ["mathml3-", "mathml/"],
  ["synthesis-", "ssml/"],
];

/**
 * Escape a value for a double-quoted XML attribute.
 *
 * @param value The text.
 * @returns The text with `&`, `<` and `"` written as references.
 */
const attribute = (value: string): string =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

/**
 * Write the oracle's catalog: each prefix as a `rewriteURI` and a `rewriteSystem`, since libxml2
 * looks up a schema location through either.
 *
 * @param directory The XSD cache, {@link xsdDirectory}.
 * @returns The catalog's text.
 */
const catalogText = (directory: string): string => {
  const base = pathToFileURL(path.join(directory, path.sep)).href;
  const rewrites = [
    ...purlRewrites.map(([prefix, folder]) => [prefix, `${base}${folder}`] as const),
    ...cacheLayoutRewrites.map(
      ([prefix, folder]) => [`${base}${prefix}`, `${base}${folder}${prefix}`] as const,
    ),
  ];

  return [
    '<?xml version="1.0"?>',
    '<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">',
    ...rewrites.flatMap(([from, to]) => [
      `  <rewriteURI uriStartString="${attribute(from)}" rewritePrefix="${attribute(to)}"/>`,
      `  <rewriteSystem systemIdStartString="${attribute(from)}" rewritePrefix="${attribute(to)}"/>`,
    ]),
    "</catalog>",
    "",
  ].join("\n");
};

/**
 * Tell whether a path names an executable regular file.
 *
 * @param file The path.
 * @returns Whether it is a regular file the process may execute; `false` when it does not exist.
 */
const isExecutableFile = (file: string): Effect.Effect<boolean> =>
  Effect.tryPromise(() => stat(file)).pipe(
    Effect.flatMap((stats) =>
      stats.isFile()
        ? Effect.tryPromise(() => access(file, constants.X_OK)).pipe(Effect.as(true))
        : Effect.succeed(false),
    ),
    Effect.orElseSucceed(() => false),
  );

/**
 * An xmllint binary: the `PLATE_XMLLINT` value that named it and the file it resolved to.
 */
interface Xmllint {
  readonly value: string;
  readonly path: string;
}

/**
 * Find the xmllint {@link xmllintValue} names.
 *
 * @returns The binary; {@link XmllintMissing} when the value names no executable file, and a
 *   `ConfigError` when a setting cannot be read.
 */
const findXmllint = Effect.fnUntraced(function* findXmllint(): Effect.fn.Return<
  Xmllint,
  XmllintMissing | Config.ConfigError
> {
  const value = yield* xmllintValue;

  if (value.includes("/")) {
    const file = path.resolve(value);

    return (yield* isExecutableFile(file))
      ? { path: file, value }
      : yield* new XmllintMissing({
          detail: `names no executable file at ${file}`,
          setting: xmllintSetting,
          value,
        });
  }

  const folders = (yield* searchPath).split(path.delimiter).filter((folder) => folder !== "");

  for (const folder of folders) {
    const file = path.join(folder, value);

    if (yield* isExecutableFile(file)) {
      return { path: file, value };
    }
  }

  return yield* new XmllintMissing({
    detail: "names no executable file in any directory on PATH",
    setting: xmllintSetting,
    value,
  });
});

/**
 * One finished xmllint run: how it ended, and the lines it wrote to standard error and then
 * standard output.
 */
interface Run {
  readonly exit: string;
  readonly code: number | null;
  readonly lines: readonly string[];
}

/**
 * Leave a failed write to xmllint's standard input unreported.
 *
 * The xmllint child stops reading standard input when its schema fails to compile, so the write can
 * end in `EPIPE`; the run's exit status and lines already report that run.
 *
 * @returns Nothing.
 */
const ignoreClosedInput = (): void => {
  // The exit status reports the run.
};

/**
 * Run xmllint once and wait for it to end.
 *
 * The child is `node:child_process`'s `spawn`, which Effect lifts through `Effect.callback`: the
 * package carries no platform layer for Effect's own child-process module. Interrupting the effect
 * aborts the child through the callback's signal. The child's environment is `environment` alone,
 * so no setting of the caller's, such as another `XML_CATALOG_FILES`, reaches it.
 *
 * @param xmllint The binary {@link findXmllint} found.
 * @param args Its arguments.
 * @param environment Its whole environment.
 * @param input What it reads on standard input.
 * @returns The run; {@link XmllintMissing} when the binary cannot be started.
 */
const runXmllint = (
  xmllint: Xmllint,
  args: readonly string[],
  environment: Readonly<Record<string, string>>,
  input: string,
): Effect.Effect<Run, XmllintMissing> =>
  Effect.callback<Run, XmllintMissing>((resume, signal) => {
    const errors: string[] = [];
    const output: string[] = [];
    const child = spawn(xmllint.path, args, { env: environment, signal, stdio: "pipe" });

    child.stderr.setEncoding("utf-8").on("data", (chunk: string) => {
      errors.push(chunk);
    });
    child.stdout.setEncoding("utf-8").on("data", (chunk: string) => {
      output.push(chunk);
    });
    child.stdin.on("error", ignoreClosedInput);
    child.stdin.end(input);

    child.once("error", (cause) => {
      resume(
        Effect.fail(
          new XmllintMissing({
            detail: `resolves to ${xmllint.path}, which could not be started (${cause.message})`,
            setting: xmllintSetting,
            value: xmllint.value,
          }),
        ),
      );
    });
    child.once("close", (code, ended) => {
      resume(
        Effect.succeed({
          code,
          exit: code === null ? `ended by ${ended ?? "a signal"}` : `exit code ${code}`,
          lines: [...errors, ...output]
            .join("")
            .split("\n")
            .filter((line) => line !== ""),
        }),
      );
    });
  });

/**
 * Read the first line an xmllint prints for `--version`.
 *
 * @param xmllint The binary.
 * @returns The line, such as `xmllint: using libxml version 21309`; {@link XmllintMissing} when it
 *   cannot be started or prints no line.
 */
const xmllintVersion = Effect.fnUntraced(function* xmllintVersion(
  xmllint: Xmllint,
): Effect.fn.Return<string, XmllintMissing> {
  const run = yield* runXmllint(xmllint, ["--version"], {}, "");
  const [line] = run.lines;

  if (run.code !== 0 || line === undefined) {
    return yield* new XmllintMissing({
      detail: `resolves to ${xmllint.path}, which printed no version for --version (${run.exit}), so it is not libxml2's xmllint`,
      setting: xmllintSetting,
      value: xmllint.value,
    });
  }

  return line;
});

/**
 * Write the catalog into a fresh directory under {@link scratchDirectory}, removed when the
 * caller's scope closes, so it lives exactly as long as the run that reads it.
 *
 * @param directory The XSD cache.
 * @returns The catalog file's path; {@link CatalogUnwritable} when it cannot be written.
 */
const writeCatalog = Effect.fnUntraced(function* writeCatalog(
  directory: string,
): Effect.fn.Return<string, CatalogUnwritable | Config.ConfigError, Scope.Scope> {
  const scratch = yield* scratchDirectory;
  const unwritable = (cause: unknown) =>
    new CatalogUnwritable({
      detail: cause instanceof Error ? cause.message : String(cause),
      directory: scratch,
    });
  const folder = yield* Effect.acquireRelease(
    Effect.tryPromise({ catch: unwritable, try: () => mkdtemp(path.join(scratch, "plate-xsd-")) }),
    (made) => Effect.ignore(Effect.tryPromise(() => rm(made, { force: true, recursive: true }))),
  );
  const file = path.join(folder, "catalog.xml");

  yield* Effect.tryPromise({
    catch: unwritable,
    try: () => writeFile(file, catalogText(directory)),
  });

  return file;
});

/**
 * Validate a document against a cached XSD with xmllint, offline.
 *
 * The xmllint child runs as `--noout --nonet --schema <xsd> -`, reading the document on standard
 * input, with `XML_CATALOG_FILES` naming a catalog written for this run and nothing else in its
 * environment. Its exit status, as xmllint documents it, is 0 when the document is valid, 3 when it
 * breaks the schema and 4 when it cannot be parsed, so those are verdicts; every other status, and
 * any `Schemas parser` line (a schema that failed to compile, or an import the catalog does not
 * reach, which xmllint skips with a warning and so judges against less than the XSD), is
 * {@link XsdUnusable}, because the oracle then speaks for less than the schema.
 *
 * @param xsdPath The XSD, absolute or relative to {@link xsdDirectory}.
 * @param xml The document's text.
 * @returns The verdict, xmllint's lines and the binary that judged; {@link XmllintMissing} when no
 *   xmllint runs, {@link XsdUnusable} when it could not use the XSD, {@link CatalogUnwritable} when
 *   the catalog cannot be written, and a `ConfigError` when `HOME` or `TMPDIR` is unset.
 * @see https://gnome.pages.gitlab.gnome.org/libxml2/xmllint.html (xmllint's options and exit
 *   status)
 * @see https://gnome.pages.gitlab.gnome.org/libxml2/xmlcatalog.html (XML catalogs in libxml2)
 */
export const validateAgainst = Effect.fn("validateAgainst")(function* validateAgainst(
  xsdPath: string,
  xml: string,
): Effect.fn.Return<
  XsdResult,
  XmllintMissing | XsdUnusable | CatalogUnwritable | Config.ConfigError,
  Scope.Scope
> {
  const xmllint = yield* findXmllint();
  const version = yield* xmllintVersion(xmllint);
  const directory = yield* xsdDirectory;
  const xsd = path.resolve(directory, xsdPath);

  yield* Effect.annotateCurrentSpan({ "xsd.schema": xsd, "xsd.xmllint": xmllint.path });

  const catalog = yield* writeCatalog(directory);
  const run = yield* runXmllint(
    xmllint,
    ["--noout", "--nonet", "--schema", xsd, "-"],
    { XML_CATALOG_FILES: pathToFileURL(catalog).href },
    xml,
  );
  const schemaTrouble = run.lines.some((line) => line.includes("Schemas parser"));

  if (schemaTrouble || (run.code !== 0 && run.code !== 3 && run.code !== 4)) {
    return yield* new XsdUnusable({ exit: run.exit, messages: run.lines, xsd });
  }

  return { binary: { path: xmllint.path, version }, messages: run.lines, valid: run.code === 0 };
}, Effect.scoped);
