/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { NodeChildProcessSpawner } from "@effect/platform-node";
import { Array as Arr, Config, Effect, Option, Schema, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

/**
 * The oracle refused a file: `xmllint` ran and exited non-zero.
 *
 * `exitCode` is its exit status and `stderr` is everything it wrote to standard error, which names
 * the file and what is wrong with it (a path that does not exist, text that is not well-formed).
 */
export class OracleError extends Schema.TaggedError<OracleError>()("OracleError", {
  exitCode: Schema.Int,
  stderr: Schema.String,
}) {
  /**
   * The exit status and what `xmllint` said, in one line.
   */
  override get message(): string {
    return `xmllint exited ${this.exitCode}: ${this.stderr.trim()}`;
  }
}

/**
 * The oracle did not start: no `xmllint` runs as `executable`, the path `XMLLINT` names or, when it
 * names none, `xmllint` on `PATH`.
 *
 * `reason` is what the platform said when the process could not be started.
 */
export class OracleUnavailable extends Schema.TaggedError<OracleUnavailable>()(
  "OracleUnavailable",
  { executable: Schema.String, reason: Schema.String },
) {
  /**
   * Which executable did not start, why, and how to supply one.
   */
  override get message(): string {
    return `xmllint did not start as ${this.executable} (${this.reason}); put libxml2's xmllint on PATH, or set XMLLINT to its path`;
  }
}

/**
 * The layer that provides the `ChildProcessSpawner` {@link xmllintC14n} needs, for tests.
 *
 * It requires `FileSystem` and `Path`, which `@effect/platform-node` supplies as `NodeFileSystem`
 * and `NodePath`.
 */
export const OracleLayer = NodeChildProcessSpawner.layer;

/**
 * The `xmllint` executable: `XMLLINT` when set, else `xmllint` on `PATH`.
 *
 * Any libxml2 build is the oracle, so no machine's install path is the default. Measured over all
 * 1,023 corpus and fixture files, libxml2 2.9.13 (macOS's `/usr/bin/xmllint`) and 2.13.9 write the
 * same `--c14n` bytes wherever both succeed. They differ only in the exit code of a failing run (1
 * under 2.9.13, 4 under 2.13.9) and on one fixture, `external`, whose DOCTYPE names a DTD that
 * cannot be resolved: 2.9.13 refuses it. The comparison never sends that fixture to `xmllint`,
 * because it holds an entity reference.
 */
const xmllintPath = Config.String("XMLLINT").pipe(Config.withDefault("xmllint"));

/**
 * How one `xmllint` run ended: its exit status, what it wrote to standard output as bytes, and what
 * it wrote to standard error.
 */
export interface XmllintRun {
  readonly code: ChildProcessSpawner.ExitCode;
  readonly stderr: string;
  readonly stdout: Uint8Array;
}

/**
 * Run `xmllint` once and collect how it ended: every oracle of this module and of the tests runs
 * libxml2 through it.
 *
 * Standard input is closed and `env` is laid over this process's environment. An executable that
 * does not start is an {@link OracleUnavailable}, which names it; a process whose output cannot be
 * read, or a `XMLLINT` setting that cannot be read, is a defect, because it says nothing about the
 * files.
 *
 * @param args - The arguments after the executable.
 * @param env - Variables to set for the run, such as `XML_CATALOG_FILES`.
 * @returns The run's exit status and output, whatever the status.
 */
export const xmllintRun = Effect.fn("oracle.xmllintRun")(function* xmllintRun(
  args: readonly string[],
  env: Readonly<Record<string, string>> = {},
): Effect.fn.Return<XmllintRun, OracleUnavailable, ChildProcessSpawner.ChildProcessSpawner> {
  const xmllint = yield* Effect.orDie(xmllintPath);
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collectRun() {
      const handle = yield* spawner
        .spawn(ChildProcess.make(xmllint, args, { env, extendEnv: true, stdin: "ignore" }))
        .pipe(
          Effect.mapError(
            (error) => new OracleUnavailable({ executable: xmllint, reason: error.message }),
          ),
        );

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkUint8Array(handle.stdout),
        },
        { concurrency: "unbounded" },
      ).pipe(Effect.orDie);
    }),
  );
});

/**
 * Canonicalize a file with `xmllint --c14n --nonet` and return what it wrote to standard output.
 *
 * `xmllint` is the oracle the canonicalizer is compared against, so its bytes are returned
 * untouched and the file is never fetched around: `--nonet` forbids network access, and standard
 * input is closed. An executable that does not start is an {@link OracleUnavailable}, which names
 * it. A process whose output cannot be read, or a `XMLLINT` setting that cannot be read, is a
 * defect rather than an {@link OracleError}, because it says nothing about the file.
 *
 * @param path - The XML file to canonicalize.
 * @returns The canonical form's bytes, an {@link OracleError} when `xmllint` exits non-zero, or an
 *   {@link OracleUnavailable} when it does not start.
 */
export const xmllintC14n = Effect.fn("oracle.xmllintC14n")(function* xmllintC14n(
  path: string,
): Effect.fn.Return<
  Uint8Array,
  OracleError | OracleUnavailable,
  ChildProcessSpawner.ChildProcessSpawner
> {
  const result = yield* xmllintRun(["--c14n", "--nonet", path]);

  if (result.code !== ChildProcessSpawner.ExitCode(0)) {
    return yield* new OracleError({ exitCode: result.code, stderr: result.stderr });
  }

  return result.stdout;
});

/**
 * The validity oracle's report holds a line it cannot read: a line before any file's first
 * message, or a file it was asked to judge that has no verdict, such as a path that does not
 * exist.
 *
 * `line` is the line, or the path that has no verdict, and `stderr` the whole report, so a schema
 * diagnostic (an import the catalog does not map, which `--nonet` refuses) shows in full.
 */
export class OracleUnreadable extends Schema.TaggedError<OracleUnreadable>()("OracleUnreadable", {
  line: Schema.String,
  stderr: Schema.String,
}) {
  /**
   * The line the oracle could not attribute, and what to check.
   */
  override get message(): string {
    return `xmllint's report holds a line no judged file owns: ${this.line}. Check that every path exists and that the catalog maps every schema location the schema imports.`;
  }
}

/**
 * One message `xmllint` wrote about a judged file.
 *
 * - `line` is the file's line the message names.
 * - `source` is `schema` for a schema validity error or warning, and `parser` for anything the parser
 *   said: a well-formedness or namespace error, its context lines appended.
 * - `element` is the element a schema message is on, as `{namespace}local` (`local` when it has no
 *   namespace), and `attribute` the attribute it names; both are none for a parser message.
 * - `text` is the message proper, after `Element '…', attribute '…': ` for a schema message. A
 *   message whose value holds a line break goes on over the report's following lines, which are
 *   appended to it.
 * - `level` is `warning` for a message libxml2 writes as a warning, which judges nothing, and `error`
 *   for every other.
 */
export interface XsdMessage {
  readonly attribute: Option.Option<string>;
  readonly element: Option.Option<string>;
  readonly level: "error" | "warning";
  readonly line: number;
  readonly source: "parser" | "schema";
  readonly text: string;
}

/**
 * The validity oracle's verdict on one file: valid against the schema, or invalid with every
 * message `xmllint` wrote about it. A file that is not well-formed is invalid, its messages the
 * parser's. `warnings` are the messages a valid file drew, which do not affect its validity.
 */
export type XsdVerdict =
  | { readonly _tag: "Valid"; readonly warnings: readonly XsdMessage[] }
  | { readonly _tag: "Invalid"; readonly messages: readonly XsdMessage[] };

/**
 * A schema message's shape after `file:line: `: an optional `element NAME: `, then `Schemas
 * validity error : ` or `warning`, `Element 'QNAME'`, an optional `, attribute 'NAME'`, and the
 * message.
 *
 * Libxml2 2.12 and earlier write the `element NAME: ` prefix for every error on an element node;
 * from 2.13 `xmlFormatError` leaves it out for a schema validity error (`domain !=
 * XML_FROM_SCHEMASV`), so the `Element 'QNAME'` that follows is the message's one element either
 * way, and the prefix is optional.
 *
 * @see {@link https://gitlab.gnome.org/GNOME/libxml2/-/blob/v2.13.0/error.c#L450-452 | libxml2 2.13.0, error.c, xmlFormatError}
 * @see {@link https://gitlab.gnome.org/GNOME/libxml2/-/blob/v2.12.0/error.c#L289-290 | libxml2 2.12.0, error.c, xmlReportError}
 */
const schemaMessage =
  /^(?:element [^:]+: )?Schemas validity (?<level>error|warning) : Element '(?<element>[^']+)'(?:, attribute '(?<attribute>[^']+)')?: (?<text>.*)$/su;

/**
 * A parser message libxml2 writes as a warning: `warning: ` itself, or a domain's warning, as
 * `namespace warning : `, after an optional `element NAME: `.
 */
const parserWarning = /^(?:element [^:]+: )?(?:warning: |[A-Za-z][\w -]* warning : )/u;

/**
 * The most files one `xmllint` process is given, so its argument list stays far below the
 * platform's limit (`ARG_MAX`, 1 MiB on macOS) whatever the paths' lengths; a longer list runs as
 * several processes, one after another, each compiling the schema again.
 */
const filesPerProcess = 1000;

/**
 * Read one judged file's message.
 *
 * @param line - The line the message names.
 * @param body - What follows `file:line: `.
 * @returns The message, a schema message's element and attribute read out of it.
 */
const messageOf = (line: number, body: string): XsdMessage => {
  const groups = schemaMessage.exec(body)?.groups;

  return groups === undefined
    ? {
        attribute: Option.none(),
        element: Option.none(),
        level: parserWarning.test(body) ? "warning" : "error",
        line,
        source: "parser",
        text: body,
      }
    : {
        attribute: Option.fromNullishOr(groups["attribute"]),
        element: Option.fromNullishOr(groups["element"]),
        level: groups["level"] === "warning" ? "warning" : "error",
        line,
        source: "schema",
        text: groups["text"] ?? "",
      };
};

/**
 * A judged file's message line: the file, the line it names, and what follows. The file is the
 * shortest prefix followed by `:digits: `, so a path must not itself hold `:digits: `.
 */
const messageLine = /^(?<path>.+?):(?<line>\d+): (?<body>.*)$/su;

/**
 * A judged file's status line: the file, then whether it validates.
 */
const statusLine = /^(?<path>.+) (?<status>validates|fails to validate)$/u;

/**
 * Read one process's report into each file's verdict.
 *
 * Every line is a file's message (`file:line: …`), a file's status (`file validates` or `file
 * fails to validate`), or the continuation of the message before it: a parser error's context
 * lines, or a value that holds a line break. A file with no status is invalid when it drew a
 * message (it is not well-formed, so it was never validated).
 *
 * @param paths - The files the process judged.
 * @param report - Everything it wrote.
 * @returns Each file's verdict, in `paths` order; an {@link OracleUnreadable} for a line before any
 *   message, or for a file with neither a status nor a message.
 */
export const verdictsOf = (
  paths: readonly string[],
  report: string,
): Effect.Effect<readonly XsdVerdict[], OracleUnreadable> =>
  Effect.gen(function* readReport() {
    const judged = new Set(paths);
    const messages = new Map<string, XsdMessage[]>();
    const status = new Map<string, boolean>();
    let last: XsdMessage[] | undefined;

    for (const line of report.split("\n")) {
      const stated = statusLine.exec(line)?.groups;
      const said = messageLine.exec(line)?.groups;

      if (stated !== undefined && judged.has(stated["path"] ?? "")) {
        status.set(stated["path"] ?? "", stated["status"] === "validates");
        last = undefined;
      } else if (said !== undefined && judged.has(said["path"] ?? "")) {
        const path = said["path"] ?? "";
        const list = messages.get(path) ?? [];

        list.push(messageOf(Number(said["line"]), said["body"] ?? ""));
        messages.set(path, list);
        last = list;
      } else if (last === undefined) {
        if (line.trim() !== "") {
          return yield* new OracleUnreadable({ line, stderr: report });
        }
      } else {
        const held = last.pop();

        if (held !== undefined) {
          last.push({ ...held, text: `${held.text}\n${line}` });
        }
      }
    }

    const unjudged = paths.find((path) => !status.has(path) && !messages.has(path));
    if (unjudged !== undefined) {
      return yield* new OracleUnreadable({ line: unjudged, stderr: report });
    }

    return paths.map((path): XsdVerdict => {
      const held = messages.get(path) ?? [];

      return status.get(path) === true
        ? { _tag: "Valid", warnings: held }
        : { _tag: "Invalid", messages: held };
    });
  });

/**
 * Validate files against a schema with `xmllint --nonet`, libxml2's own validator, and return each
 * file's verdict: an XML Schema (`--schema`) unless `input.language` is `relax-ng` (`--relaxng`).
 *
 * Libxml2 judges the files in one process (one compile of the schema) per thousand files.
 * `--nonet` forbids every network fetch, so each `schemaLocation` the schema reaches resolves
 * through `catalog` (an OASIS XML catalog, passed as `XML_CATALOG_FILES`) to a file on disk, or is
 * not read at all, which the report shows and this refuses rather than judge against a partial
 * schema. An instance's own `xsi:schemaLocation` hints are not read: the argument names the schema.
 *
 * Exit status 0, 1 (a file not well-formed or not found) and 3 (a file invalid) are reports; any
 * other is an {@link OracleError}, the schema not compiling (5) among them. A process whose output
 * cannot be read, or a `XMLLINT` setting that cannot be read, is a defect, as for
 * {@link xmllintRun}.
 *
 * @param input - What to validate.
 * @param input.schema - The schema document to validate against.
 * @param input.catalog - The XML catalog that maps the schema's imports onto files, if it has any.
 * @param input.language - The schema's language, `xsd` unless given.
 * @param input.paths - The files to judge.
 * @returns Each file's verdict, in `paths` order; an {@link OracleError} when `xmllint` exits with a
 *   status that is not a report, an {@link OracleUnreadable} when its report holds a line no file
 *   owns or a file has no verdict, or an {@link OracleUnavailable} when it does not start.
 */
export const xmllintValidate = Effect.fn("oracle.xmllintValidate")(
  function* xmllintValidate(input: {
    readonly catalog?: string;
    readonly language?: "relax-ng" | "xsd";
    readonly paths: readonly string[];
    readonly schema: string;
  }): Effect.fn.Return<
    readonly XsdVerdict[],
    OracleError | OracleUnavailable | OracleUnreadable,
    ChildProcessSpawner.ChildProcessSpawner
  > {
    yield* Effect.annotateCurrentSpan({ files: input.paths.length, schema: input.schema });

    const mode = input.language === "relax-ng" ? "--relaxng" : "--schema";
    const env: Readonly<Record<string, string>> =
      input.catalog === undefined ? {} : { XML_CATALOG_FILES: input.catalog };
    const chunks = yield* Effect.forEach(Arr.chunksOf(input.paths, filesPerProcess), (chunk) =>
      Effect.gen(function* validateChunk() {
        const result = yield* xmllintRun(["--nonet", "--noout", mode, input.schema, ...chunk], env);
        const report = `${new TextDecoder().decode(result.stdout)}${result.stderr}`;

        if (![0, 1, 3].some((code) => result.code === ChildProcessSpawner.ExitCode(code))) {
          return yield* new OracleError({ exitCode: result.code, stderr: report });
        }

        return yield* verdictsOf(chunk, report);
      }),
    );

    return chunks.flat();
  },
);
