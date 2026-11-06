/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { createHash } from "node:crypto";
import path from "node:path";
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Config, Console, Effect, FileSystem, Match, Schema } from "effect";
import type { PlatformError } from "effect";
import type { ChildProcessSpawner } from "effect/process";
import { materialize, materializeCorpus } from "#pantry/test/fixtures.ts";
import type { ExamplesError } from "#pantry/test/fixtures.ts";

/**
 * The corpus packages the processing tests read, by the zip's file name without `.zip`.
 */
export type CorpusPackageName = "ccPackage" | "maxfiles" | "svg";

/**
 * A corpus package the examples tarball does not hold, named so the failure says which one.
 */
export class CorpusPackageMissing extends Schema.TaggedError<CorpusPackageMissing>()(
  "CorpusPackageMissing",
  { available: Schema.Array(Schema.String), name: Schema.String },
) {
  /**
   * The package asked for and the ones the corpus holds, in one line.
   */
  override get message(): string {
    return `no corpus package named ${this.name}; the corpus holds ${this.available.join(", ")}`;
  }
}

type Needs = FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner;

type SourceError = PlatformError.PlatformError | ExamplesError;

/**
 * Find a corpus package's directory through phase-1's content-addressed materializer.
 *
 * The first call of a worktree extracts all 28 zips of the examples tarball; later calls find them
 * in place.
 *
 * @param name - The package, named by its zip's file name without `.zip`.
 * @returns The package's directory under the fixtures root.
 */
export const corpusPackage = (
  name: CorpusPackageName,
): Effect.Effect<string, SourceError | CorpusPackageMissing, Needs> =>
  Effect.gen(function* findPackage() {
    const packages = yield* materializeCorpus();
    const found = packages.find((entry) => entry.name === name);

    return found === undefined
      ? yield* new CorpusPackageMissing({ available: packages.map((entry) => entry.name), name })
      : found.dir;
  });

/**
 * The five template documents of the corpus, each a package and the path inside it.
 */
const templateFiles = [
  ["ccPackage", "rptemplates/CC2_map_response.xml"],
  ["ccPackage", "rptemplates/CC2_match_basic.xml"],
  ["ccPackage", "rptemplates/CC2_match.xml"],
  ["maxfiles", "rptemplates/map_response.xml"],
  ["maxfiles", "rptemplates/match_correct.xml"],
] as const;

/**
 * The version of this module's own derivation code, one of the inputs of every derived package's
 * hash.
 *
 * A fix-forward that changes what any derived directory holds bumps it, so the corrected
 * directories appear beside the old ones under new names.
 */
export const PROCESSING_FIXTURES_VERSION = "1" as const;

/**
 * An edit of a derived package, as plain data so it is part of the package's hash.
 *
 * Paths name files inside the package; `file`, `withFile` and `fromFile` of the hand-written
 * documents are relative to `src/test/fixtures/processing/`.
 *
 * - `replaceProcessing` replaces the `qti-response-processing` element of the package's `file` with
 *   the one of the hand-written `withFile`.
 * - `addFile` copies `fromPath` of the materialized corpus package `fromPkg` to `path`.
 * - `addResource` appends a `resource` with one `file` of the same `href` to `imsmanifest.xml`.
 * - `addDeclarations` adds to the package's `file` each variable declaration of the hand-written
 *   `fromFile` that `file` does not declare yet, after the last declaration of its kind or an
 *   earlier one in the schema's order (context, response, outcome, template), else before the first
 *   declaration or the item body.
 * - `addTemplateProcessing` adds the `qti-template-processing` element of the hand-written `fromFile`
 *   to the package's `file`, before its item body.
 * - `replaceFile` writes the hand-written `fromFile` as the package's `path`.
 * - `replaceText` replaces the one occurrence of `search` in the package's `file`.
 * - `nameItem` sets the `identifier` and `title` attributes of the package's `file`'s one
 *   `qti-assessment-item` start tag, so a hand-written item is named as the manifest's LOM names
 *   it.
 */
export type ProcessingEdit =
  | { readonly _tag: "replaceProcessing"; readonly file: string; readonly withFile: string }
  | {
      readonly _tag: "addFile";
      readonly fromPath: string;
      readonly fromPkg: CorpusPackageName;
      readonly path: string;
    }
  | {
      readonly _tag: "addResource";
      readonly href: string;
      readonly identifier: string;
      readonly type: string;
    }
  | { readonly _tag: "addDeclarations"; readonly file: string; readonly fromFile: string }
  | { readonly _tag: "addTemplateProcessing"; readonly file: string; readonly fromFile: string }
  | { readonly _tag: "replaceFile"; readonly fromFile: string; readonly path: string }
  | {
      readonly _tag: "replaceText";
      readonly file: string;
      readonly replacement: string;
      readonly search: string;
    }
  | {
      readonly _tag: "nameItem";
      readonly file: string;
      readonly identifier: string;
      readonly title: string;
    };

/**
 * A derived package's whole definition: its name, the phase-1 package it starts from and the edits
 * applied to a copy of it.
 */
export interface ProcessingFixtureSpec {
  readonly base: "simple";
  readonly edits: readonly ProcessingEdit[];
  readonly name: string;
}

/**
 * The failure of an edit that does not apply to the package it names, with the reason.
 */
export class ProcessingFixtureError extends Schema.TaggedError<ProcessingFixtureError>()(
  "ProcessingFixtureError",
  { detail: Schema.String, fixture: Schema.String },
) {
  /**
   * The package and why its edit failed, in one line.
   */
  override get message(): string {
    return `processing fixture ${this.fixture}: ${this.detail}`;
  }
}

/**
 * The 29 hand-broken documents of `fixtures/broken/`, each a package named by its file's stem.
 */
const brokenNames = [
  "p20-float-into-integer-outcome",
  "p21-sum-as-condition",
  "p22-lookup-without-table",
  "p22-string-into-lookup",
  "p23-and-string-operand",
  "p23-contains-singles",
  "p23-divide-multiple",
  "p23-duration-lt-integers",
  "p23-field-value-single",
  "p23-gcd-floats",
  "p23-gt-strings",
  "p23-index-single",
  "p23-inside-integer",
  "p23-integer-divide-floats",
  "p23-match-duration-pair",
  "p23-member-multiple-first",
  "p23-multiple-two-base-types",
  "p23-stats-operator-single",
  "p23-substring-integers",
  "p23-sum-record",
  "p24-figures-float-variable",
  "p25-number-correct-in-response",
  "p25-number-correct-in-template",
  "p26-template-reads-context",
  "p26-template-reads-response",
  "p27-map-response-unmapped",
  "p29-test-variables-weight-integer",
  "p49-custom-operator-unresolved",
  "undeclared-reference",
] as const;

/**
 * The four guard documents of `fixtures/guards/`, each a package named by its file's stem.
 */
const guardNames = [
  "else-before-if",
  "empty-template-processing",
  "missing-identifier",
  "padded-processing",
] as const;

/**
 * The packages M3 derives: the two round-trip packages, the template-item package, one package per
 * broken and guard document, and the padded reference the importer refuses and the padded literal
 * it admits.
 */
export const processingFixtureNames = [
  "processing-item",
  "rptemplates",
  "template-item",
  ...brokenNames,
  ...guardNames,
  "padded-reference",
  "padded-literal",
] as const;

/**
 * One of {@link processingFixtureNames}.
 */
export type ProcessingFixtureName = (typeof processingFixtureNames)[number];

const brokenSet: ReadonlySet<string> = new Set(brokenNames);

/**
 * The edit that makes a package of one hand-written document: `simple` with `choice.xml` replaced
 * by the document as it stands.
 *
 * An outcome-processing document (`p29-test-variables-weight-integer`) keeps its own root: the
 * package is refused before the root matters, or under a test root that M0 refuses as unmodeled,
 * and the test that imports it asserts the refusal it gets.
 *
 * @param name - A broken or guard package's name.
 * @returns The one `replaceFile` edit.
 */
const handWritten = (name: string): ProcessingEdit => ({
  _tag: "replaceFile",
  fromFile: `${brokenSet.has(name) ? "broken" : "guards"}/${name}.xml`,
  path: "choice.xml",
});

/**
 * `simple` with `choice.xml` replaced by `valid/response.xml`, the package the two padded
 * documents start from.
 */
const responseItem: ProcessingEdit = {
  _tag: "replaceFile",
  fromFile: "valid/response.xml",
  path: "choice.xml",
};

/**
 * The edit that names a hand-written item as `simple`'s manifest names it: the identifier and title
 * of the LOM of the resource whose `href` is `choice.xml`.
 */
const simpleItemName: ProcessingEdit = {
  _tag: "nameItem",
  file: "choice.xml",
  identifier: "choice",
  title: "Unattended Luggage",
};

/**
 * The edits that give a package the file `response.xml`'s `xi:include` names:
 * `include/shared-rules.xml` written at the package root as `shared-rules.xml`, and listed as a
 * `file` of `choice.xml`'s resource (R6: a referenced in-package file is described in the
 * manifest). The `xi:fallback` does not lift that rule. The manifest's lines end `\r\n`, as
 * `simple`'s do.
 */
const sharedRulesEdits: readonly ProcessingEdit[] = [
  { _tag: "replaceFile", fromFile: "include/shared-rules.xml", path: "shared-rules.xml" },
  {
    _tag: "replaceText",
    file: "imsmanifest.xml",
    replacement: '<file href="images/sign.png"/>\r\n            <file href="shared-rules.xml"/>',
    search: '<file href="images/sign.png"/>',
  },
];

/**
 * `processing-item`'s edits: `simple` with `choice.xml`'s processing replaced by `response.xml`'s
 * rules, the declarations and the `xi` namespace those rules need added, and the file their
 * `xi:include` names ({@link sharedRulesEdits}).
 */
const processingItemEdits: readonly ProcessingEdit[] = [
  {
    _tag: "replaceText",
    file: "choice.xml",
    replacement:
      '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"',
    search: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
  },
  { _tag: "addDeclarations", file: "choice.xml", fromFile: "valid/response.xml" },
  { _tag: "replaceProcessing", file: "choice.xml", withFile: "valid/response.xml" },
  ...sharedRulesEdits,
];

/**
 * `rptemplates`' edits: the five template documents of the corpus under `rptemplates/`, each
 * copied in and listed as an `imsqti_rptemplate_xmlv3p0` resource. They touch no file
 * {@link processingItemEdits} edits.
 */
const templateResourceEdits: readonly ProcessingEdit[] = templateFiles.flatMap(
  ([fromPkg, fromPath]): readonly ProcessingEdit[] => [
    { _tag: "addFile", fromPath, fromPkg, path: fromPath },
    {
      _tag: "addResource",
      href: fromPath,
      identifier: `rptemplate-${path.basename(fromPath, ".xml")}`,
      type: "imsqti_rptemplate_xmlv3p0",
    },
  ],
);

/**
 * Define a derived package by name.
 *
 * - `processing-item`: `simple` with `choice.xml`'s processing replaced by `response.xml`'s rules,
 *   and the declarations and the `xi` namespace those rules need added, and `shared-rules.xml` (the
 *   file the rules' `xi:include` names) written and listed in the manifest; the body kinds are
 *   unchanged.
 * - `template-item`: `simple` with the declarations, template processing and response processing of
 *   `template.xml` and `response-mapped.xml` added. `RESPONSE` keeps `simple`'s identifier type and
 *   gains the mapping of `response-mapped.xml`, so the template's integer correct response is
 *   written to a new integer response `TOTAL` instead.
 * - `rptemplates`: `simple` plus the five template documents of the corpus under `rptemplates/`, each
 *   listed as an `imsqti_rptemplate_xmlv3p0` resource.
 * - `padded-reference`: `response.xml` with `figures=" COUNT "` on a `qti-equal-rounded`, and
 *   `shared-rules.xml` written and listed, refused under `attribute-lexical` (decision 123).
 * - `padded-literal`: `response.xml` with an identifier `qti-base-value` written on its own line
 *   between indentation, as the corpus's six are, and `shared-rules.xml` written and listed;
 *   admitted with its literal trimmed (decision 157).
 * - Every other name: `simple` with `choice.xml` replaced by the document of that name.
 *
 * @param name - One of {@link processingFixtureNames}.
 * @returns The package's spec.
 */
export const specOfProcessing = (name: ProcessingFixtureName): ProcessingFixtureSpec => {
  if (name === "processing-item") {
    return { base: "simple", edits: processingItemEdits, name };
  }

  if (name === "template-item") {
    return {
      base: "simple",
      edits: [
        {
          _tag: "replaceText",
          file: "choice.xml",
          replacement: [
            "        </qti-correct-response>",
            '        <qti-mapping default-value="0">',
            '            <qti-map-entry map-key="ChoiceA" mapped-value="2"/>',
            '            <qti-map-entry map-key="ChoiceB" mapped-value="1"/>',
            "        </qti-mapping>",
            "    </qti-response-declaration>",
            '    <qti-response-declaration identifier="TOTAL" cardinality="single" base-type="integer"/>',
          ].join("\r\n"),
          search: "        </qti-correct-response>\r\n    </qti-response-declaration>",
        },
        { _tag: "addDeclarations", file: "choice.xml", fromFile: "valid/template.xml" },
        { _tag: "addDeclarations", file: "choice.xml", fromFile: "valid/response-mapped.xml" },
        { _tag: "addTemplateProcessing", file: "choice.xml", fromFile: "valid/template.xml" },
        {
          _tag: "replaceText",
          file: "choice.xml",
          replacement: '<qti-set-correct-response identifier="TOTAL">',
          search: '<qti-set-correct-response identifier="RESPONSE">',
        },
        { _tag: "replaceProcessing", file: "choice.xml", withFile: "valid/response-mapped.xml" },
      ],
      name,
    };
  }

  if (name === "rptemplates") {
    return { base: "simple", edits: templateResourceEdits, name };
  }

  if (name === "padded-reference") {
    return {
      base: "simple",
      edits: [
        responseItem,
        simpleItemName,
        ...sharedRulesEdits,
        {
          _tag: "replaceText",
          file: "choice.xml",
          replacement: 'figures=" COUNT "',
          search: 'figures="COUNT"',
        },
      ],
      name,
    };
  }

  if (name === "padded-literal") {
    return {
      base: "simple",
      edits: [
        responseItem,
        simpleItemName,
        ...sharedRulesEdits,
        {
          _tag: "replaceText",
          file: "choice.xml",
          replacement:
            '<qti-member>\n                    <qti-base-value base-type="identifier">\n                        ChoiceA\n                    </qti-base-value>',
          search:
            '<qti-member>\n                    <qti-base-value base-type="identifier">ChoiceA</qti-base-value>',
        },
      ],
      name,
    };
  }

  return {
    base: "simple",
    edits:
      name === "p29-test-variables-weight-integer"
        ? [handWritten(name)]
        : [handWritten(name), simpleItemName],
    name,
  };
};

/**
 * The root every fixture directory lives under, read through the key phase-1's materializer reads.
 */
const fixturesRoot = Config.NonEmptyString("GR8DES_QTI_FIXTURES").pipe(
  Config.withDefault("work/fixtures"),
);

/**
 * The directory of the hand-written documents, `src/test/fixtures/processing/`.
 */
const handWrittenRoot = path.resolve(import.meta.dirname, "fixtures", "processing");

/**
 * Build the failure of an edit that does not apply.
 *
 * @param fixture - The package's name.
 * @param detail - Why the edit failed.
 * @returns The failure to put in the error channel.
 */
const refusal = (fixture: string, detail: string): ProcessingFixtureError =>
  new ProcessingFixtureError({ detail, fixture });

type Failure = SourceError | CorpusPackageMissing | ProcessingFixtureError;

/**
 * Read the bytes an edit copies or splices in, so they are part of the package's hash.
 *
 * @param edit - One edit of a spec.
 * @returns The source file's bytes, or none for an edit that reads nothing outside the package.
 */
const sourceOf = (edit: ProcessingEdit): Effect.Effect<Uint8Array | undefined, Failure, Needs> =>
  Effect.gen(function* readSource() {
    const fs = yield* FileSystem.FileSystem;

    return yield* Match.value(edit).pipe(
      Match.tag("replaceProcessing", (found) =>
        fs.readFile(path.join(handWrittenRoot, found.withFile)),
      ),
      Match.tag("addDeclarations", "addTemplateProcessing", (found) =>
        fs.readFile(path.join(handWrittenRoot, found.fromFile)),
      ),
      Match.tag("replaceFile", (found) => fs.readFile(path.join(handWrittenRoot, found.fromFile))),
      Match.tag("addFile", (found) =>
        corpusPackage(found.fromPkg).pipe(
          Effect.flatMap((dir) => fs.readFile(path.join(dir, found.fromPath))),
        ),
      ),
      Match.tag("addResource", "replaceText", "nameItem", () =>
        Effect.sync((): undefined => undefined),
      ),
      Match.exhaustive,
    );
  });

/**
 * Name a derived package's directory: the hash of its name, base, edits, module version and the
 * bytes of every file its edits read, so a changed hand-written document is a new directory.
 *
 * @param spec - The package's spec.
 * @param base - The materialized base package's directory, itself named by its own hash.
 * @param sources - The bytes {@link sourceOf} read for each edit, in edit order.
 * @returns The 12 hex digits that go into the directory name.
 */
const hash12Of = (
  spec: ProcessingFixtureSpec,
  base: string,
  sources: readonly (Uint8Array | undefined)[],
): string => {
  const hash = createHash("sha256").update(
    JSON.stringify([
      spec.name,
      spec.base,
      path.basename(base),
      spec.edits,
      PROCESSING_FIXTURES_VERSION,
    ]),
  );

  for (const source of sources) {
    hash.update(source === undefined ? "-" : createHash("sha256").update(source).digest("hex"));
  }

  return hash.digest("hex").slice(0, 12);
};

/**
 * Find a file's line terminator, so text inserted into it ends its lines the same way.
 *
 * @param text - A file's text.
 * @returns `\r\n` when the text has one, else `\n`.
 */
const terminatorOf = (text: string): string => (text.includes("\r\n") ? "\r\n" : "\n");

/**
 * Convert every line terminator of a text to one terminator.
 *
 * @param text - Text with `\n` or `\r\n` terminators.
 * @param terminator - The terminator to write.
 * @returns The text with only that terminator.
 */
const withTerminator = (text: string, terminator: string): string =>
  text.replaceAll("\r\n", "\n").replaceAll("\n", terminator);

const processingElement =
  /<qti-response-processing(?:\s[^>]*?)?\/>|<qti-response-processing(?:\s[^>]*)?>[\s\S]*?<\/qti-response-processing>/u;

const templateProcessingElement =
  /<qti-template-processing(?:\s[^>]*?)?\/>|<qti-template-processing(?:\s[^>]*)?>[\s\S]*?<\/qti-template-processing>/u;

const declarationOpening = /<qti-(?<kind>response|outcome|template|context)-declaration\b[^>]*>/gu;

/**
 * The schema's order of the declaration kinds in an item: context, response, outcome, template.
 */
const declarationRank = { context: 0, outcome: 2, response: 1, template: 3 } as const;

const isDeclarationKind = (kind: string): kind is keyof typeof declarationRank =>
  kind in declarationRank;

interface Declaration {
  readonly end: number;
  readonly identifier: string;
  readonly kind: keyof typeof declarationRank;
  readonly start: number;
  readonly text: string;
}

/**
 * Take the variable declarations of a document, each as its source text, position and identifier.
 *
 * @param text - A QTI item document.
 * @returns Each top-level declaration element, in document order.
 */
const declarationsOf = (text: string): readonly Declaration[] => {
  const found: Declaration[] = [];

  for (const opening of text.matchAll(declarationOpening)) {
    const kind = opening.groups?.["kind"];

    if (kind === undefined || !isDeclarationKind(kind)) {
      continue;
    }

    const end = opening[0].endsWith("/>")
      ? opening.index + opening[0].length
      : text.indexOf(`</qti-${kind}-declaration>`, opening.index) +
        `</qti-${kind}-declaration>`.length;
    const identifier = /\sidentifier="(?<id>[^"]*)"/u.exec(opening[0])?.groups?.["id"] ?? "";

    found.push({
      end,
      identifier,
      kind,
      start: opening.index,
      text: text.slice(opening.index, end),
    });
  }

  return found;
};

/**
 * Insert text on its own lines before the line a marker starts on.
 *
 * @param text - The file's text.
 * @param marker - A string that starts an element on its line.
 * @param insertion - Whole lines, ended with the file's terminator.
 * @returns The text with the lines inserted, or `undefined` when the marker does not occur.
 */
const insertBefore = (text: string, marker: string, insertion: string): string | undefined => {
  const at = text.indexOf(marker);

  if (at === -1) {
    return undefined;
  }

  const lineStart = text.lastIndexOf("\n", at) + 1;

  return `${text.slice(0, lineStart)}${insertion}${text.slice(lineStart)}`;
};

/**
 * Add one declaration where the schema puts its kind: after the last declaration of its kind or an
 * earlier one, else before the first declaration, else before the item body.
 *
 * @param text - The file's text.
 * @param entry - The declaration to add.
 * @param terminator - The file's line terminator.
 * @returns The text with the declaration added, or `undefined` when there is no place for it.
 */
const addDeclaration = (
  text: string,
  entry: Declaration,
  terminator: string,
): string | undefined => {
  const line = `    ${withTerminator(entry.text, terminator)}`;
  const present = declarationsOf(text);
  const before = present.findLast(
    (other) => declarationRank[other.kind] <= declarationRank[entry.kind],
  );

  if (before !== undefined) {
    return `${text.slice(0, before.end)}${terminator}${line}${text.slice(before.end)}`;
  }

  return insertBefore(text, present[0]?.text ?? "<qti-item-body", `${line}${terminator}`);
};

/**
 * Set one attribute of a start tag, keeping the quotes' place.
 *
 * @param source - The start tag, or `undefined` when an earlier step found none.
 * @param name - The attribute's name.
 * @param value - Its new value.
 * @returns The tag with the attribute set, or `undefined` when there is no tag or it lacks the
 *   attribute.
 */
const setAttribute = (
  source: string | undefined,
  name: string,
  value: string,
): string | undefined => {
  const attribute = new RegExp(`(\\s${name}=)(?:"[^"]*"|'[^']*')`, "u");

  return source !== undefined && attribute.test(source)
    ? source.replace(attribute, (_, head: string) => `${head}"${value}"`)
    : undefined;
};

/**
 * Set the `identifier` and `title` of the one `qti-assessment-item` start tag of a document.
 *
 * @param text - The document.
 * @param identifier - The item's new identifier.
 * @param title - The item's new title.
 * @returns The document, or `undefined` when it has no such start tag or the tag lacks either
 *   attribute.
 */
const nameItemTag = (text: string, identifier: string, title: string): string | undefined => {
  const tag = /<qti-assessment-item\b[^>]*>/u.exec(text)?.[0];
  const named = setAttribute(setAttribute(tag, "identifier", identifier), "title", title);

  return tag === undefined || named === undefined ? undefined : text.replace(tag, () => named);
};

/**
 * Apply one edit to a package directory.
 *
 * @param fixture - The package's name, for the failure message.
 * @param pkg - The package directory under construction.
 * @param edit - The edit.
 * @returns Completes once the edit's file is written; fails when the edit does not apply.
 */
const applyEdit = (
  fixture: string,
  pkg: string,
  edit: ProcessingEdit,
): Effect.Effect<void, Failure, Needs> =>
  Effect.gen(function* apply() {
    const fs = yield* FileSystem.FileSystem;

    /**
     * Rewrite one file of the package through a text function that answers `undefined` when it
     * does not apply.
     */
    const rewrite = Effect.fn("fixtures.rewrite")(function* rewrite(
      file: string,
      change: (text: string) => string | undefined,
      problem: string,
    ) {
      const text = yield* fs.readFileString(path.join(pkg, file));
      const changed = change(text);

      yield* changed === undefined
        ? Effect.fail(refusal(fixture, `${edit._tag} on ${file}: ${problem}`))
        : fs.writeFileString(path.join(pkg, file), changed);
    });

    yield* Match.value(edit).pipe(
      Match.tag("replaceFile", (found) =>
        Effect.gen(function* replaceFile() {
          yield* fs.makeDirectory(path.dirname(path.join(pkg, found.path)), { recursive: true });
          yield* fs.writeFile(
            path.join(pkg, found.path),
            yield* fs.readFile(path.join(handWrittenRoot, found.fromFile)),
          );
        }),
      ),
      Match.tag("addFile", (found) =>
        Effect.gen(function* addFile() {
          yield* fs.makeDirectory(path.dirname(path.join(pkg, found.path)), { recursive: true });
          yield* fs.copyFile(
            path.join(yield* corpusPackage(found.fromPkg), found.fromPath),
            path.join(pkg, found.path),
          );
        }),
      ),
      Match.tag("replaceProcessing", (found) =>
        Effect.gen(function* replaceProcessing() {
          const source = yield* fs.readFileString(path.join(handWrittenRoot, found.withFile));
          const rules = processingElement.exec(source)?.[0];

          yield* rewrite(
            found.file,
            (text) =>
              rules !== undefined && processingElement.test(text)
                ? text.replace(processingElement, () => withTerminator(rules, terminatorOf(text)))
                : undefined,
            `${found.withFile} or this file has no qti-response-processing element`,
          );
        }),
      ),
      Match.tag("addDeclarations", (found) =>
        Effect.gen(function* addDeclarations() {
          const source = yield* fs.readFileString(path.join(handWrittenRoot, found.fromFile));

          yield* rewrite(
            found.file,
            (text) => {
              const declared = new Set(declarationsOf(text).map((entry) => entry.identifier));
              const terminator = terminatorOf(text);
              let changed: string | undefined = text;

              for (const entry of declarationsOf(source)) {
                if (!declared.has(entry.identifier) && changed !== undefined) {
                  changed = addDeclaration(changed, entry, terminator);
                }
              }

              return changed;
            },
            "no qti-item-body to put the declarations before",
          );
        }),
      ),
      Match.tag("addTemplateProcessing", (found) =>
        Effect.gen(function* addTemplateProcessing() {
          const source = yield* fs.readFileString(path.join(handWrittenRoot, found.fromFile));
          const element = templateProcessingElement.exec(source)?.[0];

          yield* rewrite(
            found.file,
            (text) =>
              element === undefined || templateProcessingElement.test(text)
                ? undefined
                : insertBefore(
                    text,
                    "<qti-item-body",
                    `    ${withTerminator(element, terminatorOf(text))}${terminatorOf(text)}`,
                  ),
            `${found.fromFile} has no qti-template-processing element, this file already has one, or it has no qti-item-body`,
          );
        }),
      ),
      Match.tag("addResource", (found) =>
        rewrite(
          "imsmanifest.xml",
          (text) => {
            const terminator = terminatorOf(text);

            return insertBefore(
              text,
              "</resources>",
              `        <resource identifier="${found.identifier}" type="${found.type}" href="${found.href}">${terminator}            <file href="${found.href}"/>${terminator}        </resource>${terminator}`,
            );
          },
          "no resources element to append to",
        ),
      ),
      Match.tag("replaceText", (found) =>
        rewrite(
          found.file,
          (text) =>
            text.split(found.search).length === 2
              ? text.replace(found.search, () => found.replacement)
              : undefined,
          `${JSON.stringify(found.search)} does not occur exactly once`,
        ),
      ),
      Match.tag("nameItem", (found) =>
        rewrite(
          found.file,
          (text) => nameItemTag(text, found.identifier, found.title),
          "no qti-assessment-item start tag with an identifier and a title attribute",
        ),
      ),
      Match.exhaustive,
    );
  });

/**
 * Return a derived package's directory, making it first when it is absent.
 *
 * The package is a copy of `materialize("simple")` with the spec's edits applied, built in a fresh
 * `<root>/.tmp-<random>/` and `rename`d into `<root>/<name>-<hash12>` the way phase-1's
 * materializer does it: a present target is returned untouched; the loser of two concurrent builds
 * sees its `rename` fail, finds the target present and returns it (macOS answers `ENOTEMPTY`, which
 * reaches Effect as reason `Unknown`, so the failure is not told apart by its reason). Nothing
 * under the root is written outside `.tmp-*`, and there is no marker, lock or sweeper.
 *
 * @param name - One of {@link processingFixtureNames}.
 * @returns The directory `<root>/<name>-<hash12>`.
 */
export const materializeProcessing = Effect.fn("fixtures.materializeProcessing")(
  function* materializeProcessing(name: ProcessingFixtureName) {
    const fs = yield* FileSystem.FileSystem;
    const root = yield* Effect.orDie(fixturesRoot);
    const spec = specOfProcessing(name);
    const base = yield* materialize(spec.base);
    const sources = yield* Effect.forEach(spec.edits, (edit) => sourceOf(edit), { concurrency: 4 });
    const target = `${root}/${name}-${hash12Of(spec, base, sources)}`;

    if (yield* fs.exists(target)) {
      return target;
    }

    yield* fs.makeDirectory(root, { recursive: true });
    yield* Effect.gen(function* buildAndRename() {
      const tmp = yield* fs.makeTempDirectoryScoped({ directory: root, prefix: ".tmp-" });

      yield* fs.copy(base, `${tmp}/pkg`);

      for (const edit of spec.edits) {
        yield* applyEdit(name, `${tmp}/pkg`, edit);
      }

      yield* fs
        .rename(`${tmp}/pkg`, target)
        .pipe(
          Effect.catch((error) =>
            fs
              .exists(target)
              .pipe(Effect.flatMap((present) => (present ? Effect.void : Effect.fail(error)))),
          ),
        );
    }).pipe(Effect.scoped);

    return target;
  },
);

if (import.meta.main) {
  const main = Effect.forEach(
    processingFixtureNames,
    (name) =>
      materializeProcessing(name).pipe(Effect.flatMap((dir) => Console.log(`${name}: ${dir}`))),
    { discard: true },
  ).pipe(Effect.provide(NodeServices.layer));

  NodeRuntime.runMain(main);
}
