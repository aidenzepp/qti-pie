/**
 * The walk corpus: writes the probe items the operator's session walks in the dev playground, and
 * prints how to serve them.
 *
 * From the repository root:
 *
 * ```sh
 * node packages/plate/scripts/walk-corpus.ts
 * ```
 *
 * It writes to `PLATE_WALK_CORPUS_DIR`, read from the package directory when relative, and
 * `work/walk-corpus` in the package when it is not set:
 *
 * - `od14/od14-probe.xml`, the OD-14 (e) probe: an item embedding `od14-probe.html` and
 *   `od14-probe.svg`, beside it, by package-relative `object@data`. Each of the two documents holds
 *   a script that writes "SCRIPT RAN" into itself and sets `top.location.hash` to `#od14-escaped`,
 *   and a link to `#od14-escaped` with `target="_top"`. Opened directly, they are the control.
 * - `pattern.xml`, a Text Entry with a `pattern-mask` and a `data-patternmask-message`.
 * - `ordered.xml`, an Extended Text bound to an `ordered` response, with `max-strings="3"` and a
 *   Prompt.
 * - `inline.xml`, two Inline Choices in two sentences of the renderer's own text: one with a
 *   `qti-label`, a `data-prompt`, `required`, the author's too-few message, a width class and a
 *   shuffle whose last choice is fixed, and one with none of those. In each, the options and the
 *   Placeholder start with different letters, so a test can type ahead to any of them.
 * - `derived/<corpus path without .xml>/<response>.xml`, one item per corpus text interaction that
 *   carries `pattern-mask`: the response's base type and cardinality, and the interaction's
 *   `pattern-mask`, `data-patternmask-message`, `expected-length` and `format` as written, under a
 *   plain-text Prompt that names the source. The corpus is read through the document reader and
 *   never through `open`, which leaves those documents `unchecked`.
 *
 * It overwrites those files and removes nothing. Then it prints the `serve` command with
 * `PLATE_CORPUS_DIR` set to the folder, and the `file://` addresses of the two control documents.
 * The files are scratch: the folder is git-ignored.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Config, Console, Effect, Option, Result, Schema } from "effect";
import { corpusDocuments, readCorpusFile } from "#plate/document/corpus.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace, walk } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";

/**
 * The package directory, `packages/plate`, which a relative walk directory is read from.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..");

/**
 * The folder the walk corpus is written to: `PLATE_WALK_CORPUS_DIR`, read from the package
 * directory when relative, and `work/walk-corpus` in the package when it is not set.
 */
const walkDirectory = Config.NonEmptyString("PLATE_WALK_CORPUS_DIR").pipe(
  Config.withDefault(path.join("work", "walk-corpus")),
  Config.map((directory) => path.resolve(packageDirectory, directory)),
);

/**
 * The OD-14 (e) probe item, relative to the walk directory. The two documents it embeds sit
 * beside it.
 */
const od14Item = "od14/od14-probe.xml";

/**
 * The session's pattern item, relative to the walk directory.
 */
const patternItem = "pattern.xml";

/**
 * The ordered Extended Text item, relative to the walk directory.
 */
const orderedItem = "ordered.xml";

/**
 * The Inline Choice item, relative to the walk directory.
 */
const inlineItem = "inline.xml";

/**
 * The text interactions a derived probe copies.
 */
const textInteractions: ReadonlySet<string> = new Set([
  "qti-extended-text-interaction",
  "qti-text-entry-interaction",
]);

/**
 * The attributes a derived probe copies from its interaction as written, each when present.
 */
const copiedAttributes = [
  "pattern-mask",
  "data-patternmask-message",
  "expected-length",
  "format",
] as const;

/**
 * A corpus text interaction that carries `pattern-mask` could not become a probe: its document
 * declares no response it binds with a base type and a cardinality.
 */
export class ProbeUnderivable extends Schema.TaggedError<ProbeUnderivable>()("ProbeUnderivable", {
  document: Schema.String,
  response: Schema.String,
}) {
  /**
   * The interaction's document and response, and what to check.
   */
  override get message(): string {
    return `Cannot derive a probe from ${this.document}: its pattern-mask interaction binds ${this.response}, which no qti-response-declaration with a base-type and a cardinality declares. Check that PLATE_CORPUS_DIR, or HOME, names the 1EdTech QTI 3 examples, whose every such response is declared.`;
  }
}

/**
 * A file of the walk corpus could not be written.
 */
export class ProbeUnwritable extends Schema.TaggedError<ProbeUnwritable>()("ProbeUnwritable", {
  detail: Schema.String,
  path: Schema.String,
}) {
  /**
   * The file, why, and what to change.
   */
  override get message(): string {
    return `Cannot write ${this.path}: ${this.detail}. Set PLATE_WALK_CORPUS_DIR to a folder this user can write.`;
  }
}

/**
 * One derived probe: the corpus interaction it copies and the item written for it.
 */
export interface DerivedProbe {
  /**
   * The interaction's corpus document, corpus-relative.
   */
  readonly document: string;
  /**
   * The probe item, relative to the walk directory.
   */
  readonly item: string;
  /**
   * The response identifier the interaction binds.
   */
  readonly response: string;
}

/**
 * What one run wrote.
 */
export interface WalkCorpus {
  /**
   * The OD-14 (e) control documents, absolute: the HTML page, then the SVG image.
   */
  readonly controls: readonly string[];
  /**
   * The derived probes, in the corpus document set's order and then document order.
   */
  readonly derived: readonly DerivedProbe[];
  /**
   * The walk directory, absolute.
   */
  readonly directory: string;
  /**
   * Every probe item, relative to the walk directory: the OD-14 (e) probe, the pattern item, the
   * ordered Extended Text, the Inline Choice item, then the derived probes.
   */
  readonly items: readonly string[];
  /**
   * The OD-14 (e) probe item, relative to the walk directory.
   */
  readonly od14: string;
}

/**
 * A corpus interaction a probe is derived from, with what the probe copies.
 */
interface Derivation {
  /**
   * The copied attributes present on the interaction, by name, with their values as written.
   */
  readonly attributes: readonly (readonly [string, string])[];
  /**
   * The response declaration's `base-type`, as written.
   */
  readonly baseType: string;
  /**
   * The response declaration's `cardinality`, as written.
   */
  readonly cardinality: string;
  /**
   * The interaction's corpus document, corpus-relative.
   */
  readonly document: string;
  /**
   * The interaction's local name.
   */
  readonly interaction: string;
  /**
   * The response identifier the interaction binds.
   */
  readonly response: string;
}

/**
 * Escape text for an XML attribute value or element content, keeping tabs and line breaks as
 * character references so an attribute value reads back exactly.
 *
 * @param value The text.
 * @returns The text with `&`, `<`, `>`, `"`, tab, line feed and carriage return escaped.
 */
const escapeXml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#9;")
    .replaceAll("\n", "&#10;")
    .replaceAll("\r", "&#13;");

/**
 * Write a whole item.
 *
 * @param identifier The item's identifier.
 * @param title The item's title, as plain text.
 * @param declarations The response declarations, each one line of XML.
 * @param body The item body's content, each one line of XML.
 * @returns The item document.
 */
const itemDocument = (
  identifier: string,
  title: string,
  declarations: readonly string[],
  body: readonly string[],
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<qti-assessment-item xmlns="${qtiNamespace}" identifier="${identifier}" title="${escapeXml(title)}" adaptive="false" time-dependent="false" xml:lang="en">`,
    ...declarations.map((line) => `  ${line}`),
    "  <qti-item-body>",
    ...body.map((line) => `    ${line}`),
    "  </qti-item-body>",
    "</qti-assessment-item>",
    "",
  ].join("\n");

/**
 * The OD-14 (e) documents' script: it writes "SCRIPT RAN" into its own document, then sets the top
 * page's fragment.
 */
const od14Script = [
  'document.getElementById("od14-status").textContent = "SCRIPT RAN";',
  'top.location.hash = "#od14-escaped";',
];

/**
 * The OD-14 (e) HTML document.
 */
const od14Html = [
  "<!doctype html>",
  '<html lang="en">',
  "  <head>",
  '    <meta charset="utf-8">',
  "    <title>OD-14 (e) probe, HTML</title>",
  "  </head>",
  "  <body>",
  '    <p id="od14-status">The script has not run.</p>',
  '    <p><a href="#od14-escaped" target="_top">Go to #od14-escaped in the top page</a></p>',
  "    <script>",
  ...od14Script.map((line) => `      ${line}`),
  "    </script>",
  "  </body>",
  "</html>",
  "",
].join("\n");

/**
 * The OD-14 (e) SVG document.
 */
const od14Svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120">',
  "  <title>OD-14 (e) probe, SVG</title>",
  '  <text id="od14-status" x="10" y="30">The script has not run.</text>',
  '  <a href="#od14-escaped" target="_top"><text x="10" y="80">Go to #od14-escaped in the top page</text></a>',
  "  <script>",
  ...od14Script.map((line) => `    ${line}`),
  "  </script>",
  "</svg>",
  "",
].join("\n");

/**
 * The OD-14 (e) probe item, which embeds both documents by package-relative `object@data`.
 */
const od14Probe = itemDocument(
  "walk-od14",
  "Walk probe: OD-14 (e)",
  [],
  [
    "<p>Two embedded documents follow, an HTML page and an SVG image. Each holds a script that writes SCRIPT RAN into itself and sets this page's address to end in #od14-escaped, and a link to #od14-escaped that targets the top page.</p>",
    '<p><object data="od14-probe.html" type="text/html" width="320" height="120">The HTML probe is not shown.</object></p>',
    '<p><object data="od14-probe.svg" type="image/svg+xml" width="320" height="120">The SVG probe is not shown.</object></p>',
  ],
);

/**
 * The session's pattern item: a Text Entry whose `pattern-mask` admits one to four digits, with
 * the author's message.
 */
const patternProbe = itemDocument(
  "walk-pattern",
  "Walk probe: pattern mask",
  ['<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>'],
  [
    '<p>Type a number of one to four digits: <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="4" pattern-mask="[0-9]{1,4}" data-patternmask-message="Enter one to four digits and nothing else."/></p>',
  ],
);

/**
 * The ordered Extended Text item: up to three strings, in order, under a Prompt.
 */
const orderedProbe = itemDocument(
  "walk-ordered",
  "Walk probe: ordered Extended Text",
  ['<qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="string"/>'],
  [
    '<qti-extended-text-interaction response-identifier="RESPONSE" max-strings="3">',
    "  <qti-prompt>Name up to three planets, the one nearest the sun first.</qti-prompt>",
    "</qti-extended-text-interaction>",
  ],
);

/**
 * The Inline Choice item, the renderer's own text: nothing in it comes from a corpus item. The
 * first sentence's Inline Choice has a `qti-label`, a `data-prompt`, `required`, the author's
 * too-few message, a width class and a shuffle whose last choice is fixed, and its correct
 * response is JUPITER; the second's has none of those, so its Placeholder is the locale's and no
 * Label names it. In each, the initials of the options and of the Placeholder differ (C, M, J, V
 * and N; S, Z, T and O), so a test can type ahead to any of them.
 */
const inlineProbe = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  `<qti-assessment-item xmlns="${qtiNamespace}" identifier="inline" title="Inline choice probe" adaptive="false" time-dependent="false" xml:lang="en">`,
  '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>JUPITER</qti-value></qti-correct-response></qti-response-declaration>',
  '  <qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier"/>',
  '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  "  <qti-item-body>",
  '    <p>The largest planet in the solar system is <qti-inline-choice-interaction response-identifier="RESPONSE" shuffle="true" required="true" class="qti-input-width-10" data-prompt="Choose a planet" data-min-selections-message="Pick a planet first."><qti-label>Planet</qti-label><qti-inline-choice identifier="MARS">Mars</qti-inline-choice><qti-inline-choice identifier="JUPITER">Jupiter</qti-inline-choice><qti-inline-choice identifier="VENUS">Venus</qti-inline-choice><qti-inline-choice identifier="NONE" fixed="true">None of these</qti-inline-choice></qti-inline-choice-interaction>.</p>',
  '    <p>Water freezes at <qti-inline-choice-interaction response-identifier="RESPONSE2"><qti-inline-choice identifier="ZERO">zero</qti-inline-choice><qti-inline-choice identifier="TEN">ten</qti-inline-choice><qti-inline-choice identifier="HUNDRED">one hundred</qti-inline-choice></qti-inline-choice-interaction> degrees Celsius.</p>',
  "  </qti-item-body>",
  '  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>',
  "</qti-assessment-item>",
  "",
].join("\n");

/**
 * Read an attribute in no namespace.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns Its value as written, or none when the element does not carry it.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    element.attributes.find((each) => each.namespace === "" && each.local === local)?.value,
  );

/**
 * Find the root's declaration of a response, with its base type and cardinality.
 *
 * @param source The document.
 * @param response The response identifier.
 * @returns The base type and cardinality, or none when no declaration of the response has both.
 */
const declarationOf = (
  source: SourceDocument,
  response: string,
): Option.Option<{ readonly baseType: string; readonly cardinality: string }> => {
  const declaration = source.root.children.find(
    (child): child is SourceElement =>
      child.kind === "element" &&
      child.namespace === qtiNamespace &&
      child.local === "qti-response-declaration" &&
      Option.contains(attributeOf(child, "identifier"), response),
  );

  return declaration === undefined
    ? Option.none()
    : Option.all({
        baseType: attributeOf(declaration, "base-type"),
        cardinality: attributeOf(declaration, "cardinality"),
      });
};

/**
 * Find a document's text interactions that carry `pattern-mask`, in document order, with what a
 * probe copies.
 *
 * @param source The document.
 * @returns The derivations; {@link ProbeUnderivable} when an interaction's response has no
 *   declaration with a base type and a cardinality.
 */
const derivationsOf = Effect.fnUntraced(function* derivationsOf(
  source: SourceDocument,
): Effect.fn.Return<readonly Derivation[], ProbeUnderivable> {
  const found: Derivation[] = [];

  for (const { element } of walk(source)) {
    if (
      element.namespace !== qtiNamespace ||
      !textInteractions.has(element.local) ||
      Option.isNone(attributeOf(element, "pattern-mask"))
    ) {
      continue;
    }

    const response = Option.getOrElse(attributeOf(element, "response-identifier"), () => "");
    const declaration = declarationOf(source, response);
    if (Option.isNone(declaration)) {
      return yield* new ProbeUnderivable({ document: source.location, response });
    }

    found.push({
      attributes: copiedAttributes.flatMap((name) =>
        Option.match(attributeOf(element, name), {
          onNone: () => [],
          onSome: (value) => [[name, value] as const],
        }),
      ),
      baseType: declaration.value.baseType,
      cardinality: declaration.value.cardinality,
      document: source.location,
      interaction: element.local,
      response,
    });
  }

  return found;
});

/**
 * Read one corpus member and find its derivations. A member the reader cannot build a tree from
 * holds none.
 *
 * @param document The member's corpus-relative path.
 * @returns The member's derivations.
 */
const memberDerivations = Effect.fnUntraced(function* memberDerivations(
  document: string,
): Effect.fn.Return<
  readonly Derivation[],
  CorpusFileUnreadable | CorpusMissing | Config.ConfigError | ProbeUnderivable
> {
  const bytes = yield* readCorpusFile(document);
  const source = yield* Effect.result(readSource(document, bytes));

  return Result.isFailure(source) ? [] : yield* derivationsOf(source.success);
});

/**
 * Give a derived probe's item path: its corpus document's path without `.xml`, then the response
 * identifier, under `derived/`.
 *
 * @param derivation The derivation.
 * @returns The item's path relative to the walk directory.
 */
const derivedPath = (derivation: Derivation): string =>
  `derived/${derivation.document.replace(/\.xml$/u, "")}/${derivation.response}.xml`;

/**
 * Write a derived probe's item: the response's declaration, and the interaction with its copied
 * attributes under a plain-text Prompt naming the source. An Extended Text holds the Prompt as its
 * `qti-prompt`; a Text Entry, which has none, follows it in one paragraph.
 *
 * @param derivation The derivation.
 * @param index The probe's 1-based position, which its identifier carries.
 * @returns The item document.
 */
const derivedDocument = (derivation: Derivation, index: number): string => {
  const prompt = escapeXml(`Derived from ${derivation.document}, response ${derivation.response}.`);
  const attributes = [
    ["response-identifier", derivation.response] as const,
    ...derivation.attributes,
  ]
    .map(([name, value]) => `${name}="${escapeXml(value)}"`)
    .join(" ");
  const body =
    derivation.interaction === "qti-extended-text-interaction"
      ? [
          `<qti-extended-text-interaction ${attributes}>`,
          `  <qti-prompt>${prompt}</qti-prompt>`,
          "</qti-extended-text-interaction>",
        ]
      : [`<p>${prompt} <qti-text-entry-interaction ${attributes}/></p>`];

  return itemDocument(
    `walk-derived-${String(index)}`,
    `Walk probe: ${derivation.document}, ${derivation.response}`,
    [
      `<qti-response-declaration identifier="${escapeXml(derivation.response)}" cardinality="${escapeXml(derivation.cardinality)}" base-type="${escapeXml(derivation.baseType)}"/>`,
    ],
    body,
  );
};

/**
 * Write one file, creating its folder.
 *
 * @param file The file's absolute path.
 * @param text Its content.
 * @returns An effect that writes it; {@link ProbeUnwritable} when it cannot.
 */
const writeText = (file: string, text: string): Effect.Effect<void, ProbeUnwritable> =>
  Effect.tryPromise({
    catch: (cause) =>
      new ProbeUnwritable({
        detail: cause instanceof Error ? cause.message : String(cause),
        path: file,
      }),
    try: async () => {
      await mkdir(path.dirname(file), { recursive: true });
      await writeFile(file, text);
    },
  });

/**
 * Write the walk corpus: the OD-14 (e) probe and its two documents, the pattern item, the ordered
 * Extended Text, the Inline Choice item, and one derived probe per corpus text interaction that
 * carries `pattern-mask`.
 *
 * Fails with {@link ProbeUnderivable} or {@link ProbeUnwritable}, with `CorpusMissing` or
 * `CorpusFileUnreadable` when the corpus cannot be read, and with a `ConfigError` when neither
 * `PLATE_CORPUS_DIR` nor `HOME` is set.
 */
export const writeWalkCorpus: Effect.Effect<
  WalkCorpus,
  CorpusFileUnreadable | CorpusMissing | Config.ConfigError | ProbeUnderivable | ProbeUnwritable
> = Effect.gen(function* writeWalkCorpus() {
  const directory = yield* walkDirectory;
  const documents = yield* corpusDocuments;
  const derivations = (yield* Effect.forEach(documents, memberDerivations, {
    concurrency: 8,
  })).flat();
  const derived = derivations.map((derivation): DerivedProbe => ({
    document: derivation.document,
    item: derivedPath(derivation),
    response: derivation.response,
  }));
  const od14Folder = path.join(directory, path.dirname(od14Item));
  const od14HtmlFile = path.join(od14Folder, "od14-probe.html");
  const od14SvgFile = path.join(od14Folder, "od14-probe.svg");
  const files: readonly (readonly [string, string])[] = [
    [path.join(directory, od14Item), od14Probe],
    [od14HtmlFile, od14Html],
    [od14SvgFile, od14Svg],
    [path.join(directory, patternItem), patternProbe],
    [path.join(directory, orderedItem), orderedProbe],
    [path.join(directory, inlineItem), inlineProbe],
    ...derivations.map(
      (derivation, index) =>
        [
          path.join(directory, derivedPath(derivation)),
          derivedDocument(derivation, index + 1),
        ] as const,
    ),
  ];

  yield* Effect.forEach(files, ([file, text]) => writeText(file, text), { discard: true });

  return {
    controls: [od14HtmlFile, od14SvgFile],
    derived,
    directory,
    items: [od14Item, patternItem, orderedItem, inlineItem, ...derived.map((probe) => probe.item)],
    od14: od14Item,
  };
}).pipe(Effect.withSpan("writeWalkCorpus"));

/**
 * Quote a path for a POSIX shell.
 *
 * @param value The path.
 * @returns The path in single quotes, each single quote in it written as `'\''`.
 */
const shellQuote = (value: string): string => `'${value.replaceAll("'", "'\\''")}'`;

/**
 * The text the command prints after a run: what it wrote, the `serve` command with
 * `PLATE_CORPUS_DIR` set to the walk directory, and the `file://` addresses of the two control
 * documents.
 *
 * @param written What the run wrote.
 * @returns The text, one line per fact.
 */
export const instructions = (written: WalkCorpus): string =>
  [
    `Wrote ${String(written.items.length)} probe items under ${written.directory}: the OD-14 (e) probe, the pattern item, the ordered Extended Text, the Inline Choice item and ${String(written.derived.length)} derived probes.`,
    "",
    "Serve them in the dev playground, from the repository root:",
    "",
    `  PLATE_CORPUS_DIR=${shellQuote(written.directory)} pnpm --filter @qti-pie/plate serve`,
    "",
    "The OD-14 (e) control documents, to open directly in the browser:",
    "",
    ...written.controls.map((control) => `  ${pathToFileURL(control).href}`),
  ].join("\n");

/**
 * Write the walk corpus and print the instructions.
 */
const program = writeWalkCorpus.pipe(
  Effect.flatMap((written) => Console.log(instructions(written))),
);

if (import.meta.main) {
  await Effect.runPromise(
    program.pipe(
      Effect.catch((error) =>
        Console.error(error.message).pipe(
          Effect.andThen(
            Effect.sync(() => {
              process.exitCode = 1;
            }),
          ),
        ),
      ),
    ),
  );
}
