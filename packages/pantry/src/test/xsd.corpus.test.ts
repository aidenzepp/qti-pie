/**
 * The XSD's own validator against the law oracle, on every corpus document in both schema
 * versions (slice A2).
 *
 * Oracle: a second implementation. libxml2's XML Schema validator (`xmllintValidate`) judges each
 * document against the pinned XSDs of a version, through the catalog and drivers of
 * `#pantry/test/xsd-catalog.ts`, sharing no code with the grammar; the law oracle
 * (`#pantry/test/oracle.ts`) judges the same bytes in the same version by the grammar's laws.
 * Each document is judged in both versions, whatever its package declares, so each version's XSD
 * is compared with the grammar of that version on every document. The two are compared class by
 * class (`compareJudgments`), and every difference is either recorded below ({@link recorded}),
 * each with its reason, or the test fails: a difference is a bug in one of the two oracles, a
 * spec reading that departs from the XSD on purpose, or a limit of libxml2. A record no
 * difference matches any more fails too, so the records stay the exact list of what differs.
 *
 * The comparison's contract is per document and per class, not per message: the law oracle stops
 * at the reader's, the codec's or a fold's first refusal, so what `xmllint` says beyond it is
 * counted as masked rather than as a difference.
 *
 * Gated on `GR8DES_CORPUS=1` and on the XSD cache. It writes, under `work/xsd-corpus/`:
 * `files/` (the documents), `agreement.tsv` (one row per document and version) and
 * `differences.tsv` (one row per difference, with the record that classifies it).
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Console, Effect, FileSystem, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { encode } from "@qti-pie/crust/encode.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { foldGrammarOf, namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { xdmDocument } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, explain, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import type { Laws } from "#pantry/test/oracle.ts";
import { settings } from "#pantry/test/settings.ts";
import {
  classOfLaw,
  compareJudgments,
  writeXsdOracle,
  xsdOracleDirectory,
} from "#pantry/test/xsd-catalog.ts";
import type { Comparison, Difference, LawClass, LawJudgment } from "#pantry/test/xsd-catalog.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

/**
 * The folder this test writes to, `packages/pantry/work/xsd-corpus`.
 */
const outputRoot = path.resolve(import.meta.dirname, "..", "..", "work", "xsd-corpus");

/**
 * The timeout, in milliseconds, for the one test: two `xmllint` runs over every corpus document
 * (one per version, each compiling its version's XSDs once) and the law oracle over every document
 * in both versions.
 *
 * Measured on 2026-11-05: each `xmllint` run over the 380 documents took 16.4 s of wall time at a
 * load average near 30 (3.4 s of CPU). The budget is to be set from the whole test's measured
 * time; until then it is 300 s. Raise it only on a new measurement recorded here, never to make a
 * run pass.
 */
const testTimeoutMs = 300_000;

/**
 * Whether the XSD cache holds every pin, so `xmllint` can read them.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The services the test reads and spawns with.
 */
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  OracleLayer.pipe(Layer.provide(NodeServices.layer)),
);

/**
 * Why one difference is not a defect of either oracle that is still open, or which defect it is:
 *
 * - `reading`: a spec reading (`docs/spec-readings.md`) departs from the XSD on purpose;
 * - `xmllint`: libxml2's validator does not implement an XML Schema rule the grammar states;
 * - `libxml2`: a named class of libxml2's disagreement that holds wherever it applies, counted in
 *   every run's report rather than matched to one document, and never stale;
 * - `pending`: a question of the specification's text a named seat is settling;
 * - `defect`: a defect of the grammar or the law oracle, reported to its owner, open until the
 *   owner's slice lands; when it lands the record goes stale and is deleted.
 */
type Reason =
  | { readonly _tag: "defect"; readonly owner: string; readonly why: string }
  | { readonly _tag: "libxml2"; readonly why: string }
  | { readonly _tag: "pending"; readonly who: string; readonly why: string }
  | { readonly _tag: "reading"; readonly reading: number; readonly why: string }
  | { readonly _tag: "xmllint"; readonly why: string };

/**
 * One recorded difference: what it matches (its direction and class, and optionally the oracle's
 * rule, a pattern over its detail and the documents and versions it holds in) and why.
 */
interface Recorded {
  readonly class: LawClass;
  readonly detail?: RegExp;
  readonly direction: Difference["direction"];
  readonly document?: RegExp;
  readonly reason: Reason;
  readonly rule?: string;
  readonly versions?: readonly SchemaVersion[];
}

/**
 * The classes of disagreement libxml2's validator shows wherever they apply, on corpus and
 * generated documents alike: a dangling `xs:IDREF`, which XML Schema refuses (Part 1, 3.3.4 and the
 * ID/IDREF table, cvc-id.1) and libxml2 2.9.13 never resolves under `--schema`, while it does
 * refuse a repeated `xs:ID` (the control test below). Each run counts them; none goes stale.
 */
const libxml2Records: readonly Recorded[] = [
  {
    class: "identity",
    detail: /^Idref target /u,
    direction: "oracle-only",
    reason: { _tag: "libxml2", why: "libxml2 never resolves IDREF targets under --schema" },
    rule: "idref-target",
  },
];

/**
 * Count the differences a libxml2 class accounts for.
 *
 * @param matches - The record each difference matched, `undefined` for none.
 * @returns How many matched one of {@link libxml2Records}.
 */
const libxml2Count = (matches: readonly (Recorded | undefined)[]): number =>
  matches.filter((match) => match !== undefined && libxml2Records.includes(match)).length;

/**
 * Every difference between the two oracles on the corpus, classified.
 */
const recorded: readonly Recorded[] = [
  {
    class: "content",
    detail:
      /^N7 Last at \S*qti-assessment-section\[\d+\]: qti-assessment-section holds \{(?:qti-rubric-block[^,}]*(?:, )?)*\}/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 26,
      why: "an assessment section has at least one child section or item reference; the XSD admits a section of rubric blocks alone",
    },
    rule: "child-set",
  },
  {
    class: "beyond",
    detail: /names completion_status, which nothing declares and no built-in variable is/u,
    direction: "beyond",
    reason: {
      _tag: "reading",
      reading: 63,
      why: "the built-in outcome is completionStatus, compared exactly; adaptive.xml sets completion_status, which nothing declares",
    },
    rule: "P8",
  },
];

/**
 * The differences generated documents show that no corpus document does, classified as
 * {@link recorded} classifies the corpus's. A generated run draws its own documents, so a record
 * here may match nothing in a run, and none goes stale.
 */
const generatedRecorded: readonly Recorded[] = [
  {
    class: "content",
    detail: /line \d+ [^{\s]+: This element is not expected\./u,
    direction: "xsd-only",
    reason: {
      _tag: "defect",
      owner: "Q3 (open.ts admitsNamespace) or Q1 (compose), reported 2026-11-05",
      why: "an element in no namespace is admitted under an ##other wildcard (LOM's lom, SSML's speak); XML Schema 1.0's ##other admits a namespace other than the target and never absent (Part 1, 3.10.1), so xmllint refuses it",
    },
  },
  {
    class: "content",
    detail:
      /sits under a xi:include where no position of its content model that names foreign-element follows/u,
    direction: "oracle-only",
    reason: {
      _tag: "defect",
      owner: "Q1 (the content automaton) or Q3 (the IR), reported 2026-11-05",
      why: "XInclude's includeType is (fallback | any ##other lax)*, so a foreign element is valid anywhere in xi:include; the automaton admits it at no position",
    },
  },
  {
    class: "text-value",
    detail:
      /(?:The value '[\t\n\r ]*' is not an element of the set|'[\t\n\r ]*' is not a valid value)/u,
    direction: "xsd-only",
    reason: {
      _tag: "defect",
      owner: "Q4 (the oracle's TextDomain law) and the W5 TextDomain law, reported 2026-11-05",
      why: "an element of a simple-content kind with no text, or only whitespace, has that string as its value, which its type must admit; TextDomain reads only a text child, so an empty cp:schemaversion or drd:hazard is accepted",
    },
  },
  {
    class: "content",
    detail: /^N7 Last at \S*qti-assessment-section\[\d+\]: qti-assessment-section holds \{\}/u,
    direction: "oracle-only",
    reason: {
      _tag: "reading",
      reading: 26,
      why: "an assessment section has at least one child; the XSD admits an empty one",
    },
    rule: "child-set",
  },
];

/**
 * One corpus document: the zip it is in, its path in the zip, the version its package declares,
 * its bytes, and where it was written for `xmllint`.
 */
interface CorpusDocument {
  readonly bytes: Uint8Array;
  readonly declared: string;
  readonly file: string;
  readonly path: string;
  readonly zip: string;
}

/**
 * One document's judgment in one version, compared, and the record each difference matched.
 */
interface Judged {
  readonly comparison: Comparison;
  readonly document: CorpusDocument;
  readonly matches: readonly (Recorded | undefined)[];
  readonly version: SchemaVersion;
}

/**
 * Give the node numbered `index` a uuid that spells its number, as the oracle's own ids do.
 *
 * @param index - The node's number in document order.
 * @returns The uuid.
 */
const nodeIdOf = (index: number): NodeId =>
  `00000000-0000-4000-8fff-${index.toString(16).padStart(12, "0")}`;

/**
 * The judgment of a document the reader, the codec or a fold refused: its one refusal.
 *
 * @param law - What refused it.
 * @param rule - The rule the refusal is named by.
 * @param detail - What it said.
 * @param cls - The refusal's class.
 * @returns The judgment, stopped.
 */
const stop = (law: string, rule: string, detail: string, cls: LawClass): LawJudgment => ({
  refusals: [{ class: cls, detail, law, node: "", rule }],
  stopped: true,
});

/**
 * Judge one document by the law oracle alone, in one version: crust's reader, the codec (shred),
 * the folds, then every document law (`documentBreaches`). The package laws are left out, since
 * they read a manifest's listing, which no XSD judges.
 *
 * @param input - What to judge.
 * @param input.bytes - The document's bytes.
 * @param input.grammar - The composed grammar.
 * @param input.laws - Its tables, from `lawsOf`.
 * @param input.path - Its path, which the breaches name.
 * @param input.version - The version it is read in.
 * @returns The judgment.
 */
const judgeDocument = Effect.fn("test.judgeDocument")(function* judgeDocument(input: {
  readonly bytes: Uint8Array;
  readonly grammar: ComposedGrammar;
  readonly laws: Laws;
  readonly path: string;
  readonly version: SchemaVersion;
}): Effect.fn.Return<LawJudgment> {
  const read = yield* Effect.result(readXml(input.bytes));
  if (Result.isFailure(read)) {
    const rule = read.failure._tag === "WellFormednessError" ? "well-formedness" : "reader-refusal";

    return stop("reader", rule, read.failure.message, "well-formed");
  }

  const tree = yield* Effect.result(
    shred(read.success, input.version, shredGrammarOf(input.grammar)),
  );
  if (Result.isFailure(tree)) {
    const { failure } = tree;
    if (failure._tag === "NotQti3") {
      return stop("codec", "not-qti3", failure.message, "vocabulary");
    }

    const cls = ((): LawClass => {
      if (failure.kind === "attribute") {
        return failure.reason === "namespace-entity" ? "other" : "attribute-allowed";
      }

      return Option.isNone(failure.parent) ? "vocabulary" : "content";
    })();

    return stop(
      "codec",
      failure.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary",
      failure.message,
      cls,
    );
  }

  const rows = fold(tree.success, nodeIdOf, foldGrammarOf(input.grammar));
  if (Result.isFailure(rows)) {
    return rows.failure._tag === "ChildUnadmitted"
      ? stop("N5 admitted", "admission", rows.failure.message, "content")
      : stop("AL1 admission", "attribute-admission", rows.failure.message, "attribute-allowed");
  }

  // A law that throws on rows the folds wrote is the oracle's defect on this document, reported as
  // such rather than ending the comparison of every other document.
  const breaches = yield* Effect.result(
    Effect.try({
      catch: (error) =>
        error instanceof Error
          ? `${error.message} (${(error.stack ?? "")
              .split("\n")
              .slice(1, 3)
              .map((frame) => frame.trim())
              .join("; ")})`
          : String(error),
      try: () => documentBreaches(input.path, rows.success, input.laws),
    }),
  );
  if (Result.isFailure(breaches)) {
    return stop("oracle", "internal", `a law threw: ${breaches.failure}`, "internal");
  }

  return {
    refusals: breaches.success.map((breach) => ({
      class: classOfLaw(breach.law, ruleOf(breach.law)),
      detail: explain(breach.law, breach.keys, input.grammar),
      law: breach.law,
      node: breach.keys["node"] ?? "",
      rule: ruleOf(breach.law),
    })),
    stopped: false,
  };
});

/**
 * Find the record a difference matches.
 *
 * @param document - The document.
 * @param version - The version it was judged in.
 * @param difference - The difference.
 * @returns The first record that matches it, or `undefined`.
 */
const recordOf = (
  document: CorpusDocument,
  version: SchemaVersion,
  difference: Difference,
  records: readonly Recorded[] = recorded,
): Recorded | undefined =>
  records.find(
    (record) =>
      record.direction === difference.direction &&
      record.class === difference.class &&
      (record.rule === undefined || record.rule === difference.rule) &&
      (record.detail === undefined || record.detail.test(difference.detail)) &&
      (record.document === undefined || record.document.test(`${document.zip}/${document.path}`)) &&
      (record.versions === undefined || record.versions.includes(version)),
  );

/**
 * Write a reason as one line.
 *
 * @param reason - The reason.
 * @returns Its tag, its reading or owner, and why.
 */
const reasonText = (reason: Reason): string => {
  switch (reason._tag) {
    case "defect": {
      return `defect (${reason.owner}): ${reason.why}`;
    }
    case "libxml2": {
      return `libxml2: ${reason.why}`;
    }
    case "pending": {
      return `pending (${reason.who}): ${reason.why}`;
    }
    case "reading": {
      return `reading ${String(reason.reading)}: ${reason.why}`;
    }
    case "xmllint": {
      return `xmllint: ${reason.why}`;
    }
    default: {
      return reason satisfies never;
    }
  }
};

/**
 * Write rows as TSV: a header, then one line per row, each field's tabs and line breaks spaced
 * out.
 *
 * @param header - The column names.
 * @param rows - The rows.
 * @returns The text.
 */
const tsv = (header: readonly string[], rows: readonly (readonly string[])[]): string =>
  [header, ...rows]
    .map((row) => `${row.map((field) => field.replaceAll(/[\t\r\n]+/gu, " ")).join("\t")}\n`)
    .join("");

/**
 * Read the schema version a manifest declares, for the report: the text of its first
 * `schemaversion` element.
 *
 * @param bytes - The manifest's bytes.
 * @returns The version as written, or empty when it declares none.
 */
const declaredOf = (bytes: Uint8Array): string =>
  /<(?:\w+:)?schemaversion>\s*(?<version>[^<]*?)\s*</u.exec(new TextDecoder().decode(bytes))
    ?.groups?.["version"] ?? "";

/**
 * Read every XML document of the corpus and write each where `xmllint` reads it.
 *
 * @returns The documents, in corpus order.
 */
const corpusDocuments = Effect.fn("xsd.corpusDocuments")(function* corpusDocuments() {
  const fs = yield* FileSystem.FileSystem;
  const corpus = yield* materializeCorpus();
  const documents: CorpusDocument[] = [];

  for (const entry of corpus) {
    const files = yield* readPackage(entry.dir);
    const manifest = files.find(({ kind }) => kind === "manifest");
    const declared = manifest === undefined ? "" : declaredOf(manifest.bytes);

    for (const file of files.filter(({ path: at }) => at.toLowerCase().endsWith(".xml"))) {
      const written = `${outputRoot}/files/${entry.name}/${file.path}`;

      yield* fs.makeDirectory(path.dirname(written), { recursive: true });
      yield* fs.writeFile(written, file.bytes);
      documents.push({
        bytes: file.bytes,
        declared,
        file: written,
        path: file.path,
        zip: entry.name,
      });
    }
  }

  return documents;
});

describe.skipIf(!settings.corpusRequested || !cached)("xsd.corpus.test.ts, the corpus", () => {
  layer(TestLayer, { excludeTestServices: true })("xmllint against the law oracle", (it) => {
    it.effect(
      "every corpus document's two verdicts, per class, differ only as recorded",
      () =>
        Effect.gen(function* compareCorpus() {
          const fs = yield* FileSystem.FileSystem;
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const laws = lawsOf(grammar);

          yield* fs.remove(outputRoot, { force: true, recursive: true });

          const documents = yield* corpusDocuments();
          const oracle = yield* writeXsdOracle(xsdOracleDirectory);
          const judged: Judged[] = [];

          for (const version of schemaVersions) {
            const verdicts = yield* xmllintValidate({
              catalog: oracle.catalog,
              paths: documents.map(({ file }) => file),
              schema: oracle.drivers[version],
            });

            for (const [at, document] of documents.entries()) {
              const xsd =
                verdicts[at] ??
                (yield* Effect.die(new Error(`xmllint gave no verdict for ${document.file}`)));

              const law = yield* judgeDocument({
                bytes: document.bytes,
                grammar,
                laws,
                path: document.path,
                version,
              });
              const comparison = compareJudgments(xsd, law);

              judged.push({
                comparison,
                document,
                matches: comparison.differences.map((difference) =>
                  recordOf(document, version, difference, [...recorded, ...libxml2Records]),
                ),
                version,
              });
            }
          }

          yield* fs.writeFileString(
            `${outputRoot}/agreement.tsv`,
            tsv(
              [
                "zip",
                "document",
                "declared",
                "version",
                "verdicts",
                "xmllint",
                "laws",
                "masked",
                "differences",
              ],
              judged.map(({ comparison, document, version }) => [
                document.zip,
                document.path,
                document.declared,
                version,
                comparison.verdicts,
                comparison.xsdClasses.join(" "),
                comparison.lawClasses.join(" "),
                comparison.masked.join(" "),
                String(comparison.differences.length),
              ]),
            ),
          );
          yield* fs.writeFileString(
            `${outputRoot}/differences.tsv`,
            tsv(
              ["zip", "document", "version", "direction", "class", "rule", "record", "detail"],
              judged.flatMap(({ comparison, document, matches, version }) =>
                comparison.differences.map((difference, at) => {
                  const match = matches[at];

                  return [
                    document.zip,
                    document.path,
                    version,
                    difference.direction,
                    difference.class,
                    difference.rule,
                    match === undefined ? "UNRECORDED" : reasonText(match.reason),
                    difference.detail.slice(0, 600),
                  ];
                }),
              ),
            ),
          );

          const tally = (verdicts: Comparison["verdicts"]) =>
            judged.filter(({ comparison }) => comparison.verdicts === verdicts).length;
          const unrecorded = judged.flatMap(({ comparison, document, matches, version }) =>
            comparison.differences.flatMap((difference, at) =>
              matches[at] === undefined
                ? [
                    `${document.zip}/${document.path} ${version} ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 300)}`,
                  ]
                : [],
            ),
          );
          const used = new Set(judged.flatMap(({ matches }) => matches));
          const stale = recorded.filter((record) => !used.has(record));

          yield* Console.log(
            [
              `xsd.corpus: ${String(documents.length)} documents x ${String(schemaVersions.length)} versions = ${String(judged.length)} judgments`,
              `  accepted by both ${String(tally("accepted by both"))}, refused by both ${String(tally("refused by both"))}, xmllint only ${String(tally("xmllint only"))}, laws only ${String(tally("laws only"))}`,
              `  differences ${String(judged.reduce((sum, { comparison }) => sum + comparison.differences.length, 0))}, unrecorded ${String(unrecorded.length)}, stale records ${String(stale.length)}, libxml2 ${String(libxml2Count(judged.flatMap(({ matches }) => matches)))} (${libxml2Records.map(({ reason }) => reasonText(reason)).join("; ")})`,
            ].join("\n"),
          );

          assert.deepStrictEqual(
            unrecorded,
            [],
            "every difference between the two oracles is recorded",
          );
          assert.deepStrictEqual(
            stale.map(
              ({ class: cls, direction, reason }) => `${direction} ${cls}: ${reasonText(reason)}`,
            ),
            [],
            "every record still matches a difference",
          );
        }),
      { timeout: testTimeoutMs },
    );
  });
});

/**
 * The folder the differential property writes to, `packages/pantry/work/xsd-generated`.
 */
const generatedRoot = path.resolve(import.meta.dirname, "..", "..", "work", "xsd-generated");

/**
 * The number of generated documents one run judges: each run draws its own (its stream rotates
 * with the run's seed, so different runs explore different documents), and all of them are
 * validated in one `xmllint` process per version, since one compile of the ASI XSD costs 3 s of
 * CPU.
 */
const generatedCases = 240;

/**
 * The timeout, in milliseconds, for the differential property: building the grammar, drawing and
 * writing the documents, two `xmllint` runs and the law oracle on each document. To be set from a
 * measurement; 300 s until then. Raise it only on a new measurement recorded here, never to make
 * a run pass.
 */
const generatedTimeoutMs = 300_000;

/**
 * The named invalid variants of a generated document (doctrine rule 6), each one edit of the XML
 * tree the generator's valid tree is written as, at one element the case draws:
 *
 * - `valid`: no edit;
 * - `drop-attribute`: remove one of the element's attributes;
 * - `undeclared-attribute`: add an attribute no schema declares, in no namespace;
 * - `wild-value`: give one of its attributes a value no type's lexical space is likely to hold;
 * - `drop-child`, `duplicate-child`: remove, or repeat in place, one of its element children;
 * - `swap-children`: swap two of its element children;
 * - `foreign-child`: add, as its first child, an element of a namespace no schema declares;
 * - `stray-text`: add character data as its first child.
 *
 * A variant the drawn element cannot take (no attribute to drop, fewer than two children to swap)
 * applies nothing, and the case records `none`, so the tape reads the edit actually made.
 */
const variants = [
  "valid",
  "drop-attribute",
  "undeclared-attribute",
  "wild-value",
  "drop-child",
  "duplicate-child",
  "swap-children",
  "foreign-child",
  "stray-text",
] as const;

/**
 * A variant of {@link variants}, or `none` for one the drawn element could not take.
 */
type Variant = (typeof variants)[number] | "none";

/**
 * The values `wild-value` writes.
 */
const wildValues = ["", " ", "#!", "-1", "zz zz", "9999999999999999999999"] as const;

/**
 * One generated case: the version, the XML tree, the edit made to it, and whether the tree holds
 * an unexpanded entity reference.
 */
interface GeneratedCase {
  readonly at: string;
  /**
   * Whether an entity reference stays unexpanded in the tree, in content or in an attribute's
   * value. Its entity is declared only in an external subset no processor here reads, so the
   * infoset XML Schema assesses is not the document's, and no XSD verdict exists to compare.
   */
  readonly entities: boolean;
  readonly tree: XmlDocument;
  readonly variant: Variant;
  readonly version: SchemaVersion;
}

/**
 * The elements of a tree in document order, each with its path of child indexes from the root.
 *
 * @param root - The root.
 * @returns Every element and its path.
 */
const elementsIn = (root: Element): readonly (readonly [Element, readonly number[]])[] => {
  const out: (readonly [Element, readonly number[]])[] = [];
  const visit = (node: Element, route: readonly number[]): void => {
    out.push([node, route]);
    for (const [at, child] of node.children.entries()) {
      if (child.kind === "element") {
        visit(child, [...route, at]);
      }
    }
  };
  visit(root, []);

  return out;
};

/**
 * Whether an element or anything below it holds an unexpanded entity reference.
 *
 * @param node - The element.
 * @returns Whether a child or an attribute value of it, or of a descendant, holds one.
 */
const holdsReferences = (node: Element): boolean =>
  node.attributes.some(({ references }) => references.length > 0) ||
  node.children.some(
    (child) => child.kind === "entityRef" || (child.kind === "element" && holdsReferences(child)),
  );

/**
 * Replace the element at a path.
 *
 * @param root - The root.
 * @param route - The child indexes from the root.
 * @param edit - The new element, from the old.
 * @returns The new root.
 */
const editAt = (
  root: Element,
  route: readonly number[],
  edit: (node: Element) => Element,
): Element => {
  const [head, ...rest] = route;
  if (head === undefined) {
    return edit(root);
  }

  return {
    ...root,
    children: root.children.map((child, at): Child =>
      at === head && child.kind === "element" ? editAt(child, rest, edit) : child,
    ),
  };
};

/**
 * Whether an element can take a variant: it has an attribute to drop or change, an element child
 * to drop or repeat, or two to swap. Every element takes the others.
 *
 * @param node - The element.
 * @param variant - The variant.
 * @returns Whether {@link applied} would apply it.
 */
const takes = (node: Element, variant: (typeof variants)[number]): boolean => {
  const attributes = node.attributes.filter(
    ({ namespace }) => namespace !== "http://www.w3.org/2000/xmlns/",
  ).length;
  const elements = node.children.filter((child) => child.kind === "element").length;

  switch (variant) {
    case "drop-attribute":
    case "wild-value": {
      return attributes > 0;
    }
    case "drop-child":
    case "duplicate-child": {
      return elements > 0;
    }
    case "swap-children": {
      return elements > 1;
    }
    case "foreign-child":
    case "stray-text":
    case "undeclared-attribute":
    case "valid": {
      return true;
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Apply a variant to an element, drawing what it needs.
 *
 * @param node - The element.
 * @param variant - The variant.
 * @param pick - Draws an index below a bound.
 * @returns The edited element and the variant applied, `none` when it could not be.
 */
const applied = (
  node: Element,
  variant: (typeof variants)[number],
  pick: (bound: number) => number,
): readonly [Element, Variant] => {
  const attributes = node.attributes.filter(
    ({ namespace }) => namespace !== "http://www.w3.org/2000/xmlns/",
  );
  const elements = node.children.flatMap((child, at) => (child.kind === "element" ? [at] : []));
  switch (variant) {
    case "valid": {
      return [node, "valid"];
    }
    case "drop-attribute":
    case "wild-value": {
      const target = attributes[attributes.length === 0 ? 0 : pick(attributes.length)];
      if (target === undefined) {
        return [node, "none"];
      }

      const value = wildValues[pick(wildValues.length)] ?? "";

      return [
        {
          ...node,
          attributes:
            variant === "drop-attribute"
              ? node.attributes.filter((held) => held !== target)
              : node.attributes.map((held) =>
                  held === target ? { ...held, references: [], value } : held,
                ),
        },
        variant,
      ];
    }
    case "undeclared-attribute": {
      return node.attributes.some(({ qname }) => qname === "zz-undeclared")
        ? [node, "none"]
        : [
            {
              ...node,
              attributes: [
                ...node.attributes,
                {
                  local: "zz-undeclared",
                  namespace: "",
                  prefix: "",
                  qname: "zz-undeclared",
                  references: [],
                  value: "1",
                },
              ],
            },
            variant,
          ];
    }
    case "drop-child":
    case "duplicate-child": {
      const target = elements[elements.length === 0 ? 0 : pick(elements.length)];
      if (target === undefined) {
        return [node, "none"];
      }

      return [
        {
          ...node,
          children: node.children.flatMap((child, at) => {
            if (at !== target) {
              return [child];
            }

            return variant === "drop-child" ? [] : [child, child];
          }),
        },
        variant,
      ];
    }
    case "swap-children": {
      if (elements.length < 2) {
        return [node, "none"];
      }

      const first = pick(elements.length - 1);
      const left = elements[first] ?? 0;
      const right = elements[first + 1] ?? 0;

      return [
        {
          ...node,
          children: node.children.map((child, at) => {
            if (at === left) {
              return node.children[right] ?? child;
            }

            return at === right ? (node.children[left] ?? child) : child;
          }),
        },
        variant,
      ];
    }
    case "foreign-child": {
      const foreign: Element = {
        attributes: [
          {
            local: "zz",
            namespace: "http://www.w3.org/2000/xmlns/",
            prefix: "xmlns",
            qname: "xmlns:zz",
            references: [],
            value: "urn:qti-pie:nowhere",
          },
        ],
        children: [],
        kind: "element",
        local: "stray",
        namespace: "urn:qti-pie:nowhere",
        prefix: "zz",
        qname: "zz:stray",
      };

      return [{ ...node, children: [foreign, ...node.children] }, variant];
    }
    case "stray-text": {
      return [
        { ...node, children: [{ cdata: false, kind: "text", value: "stray" }, ...node.children] },
        variant,
      ];
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Draw a generated case: a valid tree over the grammar (Q2's generator), written as XML, and one
 * named variant applied at one element of it.
 *
 * @param grammar - The composed grammar.
 * @returns The generator.
 */
const generatedCaseOf = (grammar: ComposedGrammar): Gen<GeneratedCase> => {
  const valid = xdmDocument(grammar);
  const names = namesOf(grammar);

  return (source) => {
    const generated = source.draw(valid);
    const tree = toXmlDocument(generated.document, names);
    const drawnVariant = source.draw(element(variants));
    const all = elementsIn(tree.root);
    const eligible = all.filter(([node]) => takes(node, drawnVariant));
    const elements = eligible.length === 0 ? all : eligible;
    const [target, route] = elements[source.draw(int(0, elements.length - 1))] ?? [tree.root, []];
    const [edited, variant] = applied(target, drawnVariant, (bound) =>
      source.draw(int(0, bound - 1)),
    );

    return {
      at: `/${route.join("/")} ${target.qname}`,
      entities: holdsReferences(tree.root),
      tree: { ...tree, root: editAt(tree.root, route, () => edited) },
      variant,
      version: generated.document.version,
    };
  };
};

describe.skipIf(!cached)("xsd.corpus.test.ts, generated documents", () => {
  layer(TestLayer, { excludeTestServices: true })("xmllint against the law oracle", (it) => {
    it.effect(
      "every generated document, valid or a named invalid variant, has the same verdict from both",
      () =>
        Effect.gen(function* compareGenerated() {
          const fs = yield* FileSystem.FileSystem;
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const laws = lawsOf(grammar);
          const run = yield* runOfProcess;
          const stream = rotatingSeed(run.seed, floorSeed("pantry/xsd-differential"));
          const cases = sample(generatedCaseOf(grammar), stream, generatedCases);

          yield* fs.remove(generatedRoot, { force: true, recursive: true });
          yield* fs.makeDirectory(generatedRoot, { recursive: true });

          const judgeable = cases.filter(({ entities }) => !entities);
          const written = yield* Effect.all(
            judgeable.map((drawnCase, at) =>
              Effect.gen(function* writeCase() {
                const file = `${generatedRoot}/case-${String(at)}.xml`;
                const bytes = yield* encode(drawnCase.tree, "utf-8").pipe(Effect.orDie);
                yield* fs.writeFile(file, bytes);

                return { ...drawnCase, bytes, file, index: at };
              }),
            ),
          );
          const oracle = yield* writeXsdOracle(xsdOracleDirectory);
          const lines: string[] = [];
          const unrecorded: string[] = [];
          const matched: (Recorded | undefined)[] = [];

          for (const version of schemaVersions) {
            const mine = written.filter((held) => held.version === version);
            const verdicts =
              mine.length === 0
                ? []
                : yield* xmllintValidate({
                    catalog: oracle.catalog,
                    paths: mine.map(({ file }) => file),
                    schema: oracle.drivers[version],
                  });

            for (const [at, held] of mine.entries()) {
              const xsd =
                verdicts[at] ?? (yield* Effect.die(new Error(`no verdict for ${held.file}`)));
              const law = yield* judgeDocument({
                bytes: held.bytes,
                grammar,
                laws,
                path: held.file,
                version,
              });
              const comparison = compareJudgments(xsd, law);
              const document: CorpusDocument = {
                bytes: held.bytes,
                declared: version,
                file: held.file,
                path: `case-${String(held.index)}.xml`,
                zip: "generated",
              };
              const records = comparison.differences.map((difference) =>
                recordOf(document, version, difference, [
                  ...recorded,
                  ...libxml2Records,
                  ...generatedRecorded,
                ]),
              );
              const open = comparison.differences.filter((_, slot) => records[slot] === undefined);

              matched.push(...records);

              lines.push(
                [
                  String(held.index),
                  version,
                  held.variant,
                  held.at,
                  comparison.verdicts,
                  comparison.xsdClasses.join(" "),
                  comparison.lawClasses.join(" "),
                  comparison.differences
                    .map(({ class: cls, direction }) => `${direction}:${cls}`)
                    .join(" "),
                ].join("\t"),
              );
              unrecorded.push(
                ...open.map(
                  (difference) =>
                    `case ${String(held.index)} (${version}, ${held.variant} at ${held.at}): ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 240)}`,
                ),
              );
            }
          }

          yield* fs.writeFileString(
            `${generatedRoot}/cases.tsv`,
            ["case\tversion\tvariant\tat\tverdicts\txmllint\tlaws\tdifferences", ...lines]
              .map((line) => `${line}\n`)
              .join(""),
          );
          yield* Console.log(
            `xsd.generated: TEST_SEED=${String(run.seed)}, ${String(cases.length)} cases drawn (stream pantry/xsd-differential), ${String(cases.length - judgeable.length)} left out for unexpanded entity references, ${String(judgeable.length)} judged; ${String(unrecorded.length)} unrecorded differences; libxml2 ${String(libxml2Count(matched))}; the documents are under work/xsd-generated/`,
          );

          assert.deepStrictEqual(
            unrecorded.slice(0, 100),
            [],
            "both oracles judge every generated document alike",
          );
        }),
      { timeout: generatedTimeoutMs },
    );
  });
});

/**
 * The timeout, in milliseconds, for the libxml2 control: one `xmllint` run over four small
 * documents, which compiles the 3.0.0 XSDs once. Measured on 2026-11-05 under the shared tree's
 * load: over 5 s, so the budget is 60 s. Raise it only on a new measurement recorded here.
 */
const controlTimeoutMs = 60_000;

/**
 * The folder the libxml2 control writes to, `packages/pantry/work/xsd-control`.
 */
const controlRoot = path.resolve(import.meta.dirname, "..", "..", "work", "xsd-control");

/**
 * An item with the given companion materials and item-body content, every attribute it needs.
 *
 * @param companion - The `qti-companion-materials-info` children, none for no element.
 * @param body - The item body's content.
 * @returns The item's text.
 */
const controlItem = (companion: string, body: string): string =>
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false" adaptive="false">${
    companion === ""
      ? ""
      : `<qti-companion-materials-info>${companion}</qti-companion-materials-info>`
  }<qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * `figcaption` beneath SSML's `mark`, whose content is a `##other` lax wildcard: a globally
 * declared element there is validated (Part 1, 3.10.4), so its attributes are typed.
 *
 * @param attributes - The `figcaption` elements, each as its attributes.
 * @returns The companion materials' content.
 */
const underMark = (...attributes: readonly string[]): string =>
  `<ssml:mark xmlns:ssml="http://www.w3.org/2001/10/synthesis" name="m">${attributes
    .map((held) => `<figcaption ${held}>x</figcaption>`)
    .join("")}</ssml:mark>`;

describe.skipIf(!cached)("xsd.corpus.test.ts, libxml2's identity checking", () => {
  layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
    it.effect(
      "libxml2 refuses a repeated ID in item-body content and under ssml:mark/figcaption, and accepts a dangling IDREF in both",
      () =>
        Effect.gen(function* control() {
          const fs = yield* FileSystem.FileSystem;
          const documents = {
            "body-dangling-idref": controlItem("", `<p aria-errormessage="nowhere">x</p>`),
            "body-repeated-id": controlItem("", `<p id="d1">x</p><p id="d1">y</p>`),
            "mark-dangling-idref": controlItem(
              underMark(`aria-errormessage="nowhere"`),
              "<p>x</p>",
            ),
            "mark-repeated-id": controlItem(underMark(`id="d1"`, `id="d1"`), "<p>x</p>"),
          };

          yield* fs.remove(controlRoot, { force: true, recursive: true });
          yield* fs.makeDirectory(controlRoot, { recursive: true });

          const files = Object.keys(documents).map((name) => `${controlRoot}/${name}.xml`);
          for (const [name, text] of Object.entries(documents)) {
            yield* fs.writeFileString(`${controlRoot}/${name}.xml`, text);
          }

          const oracle = yield* writeXsdOracle(xsdOracleDirectory);
          const verdicts = yield* xmllintValidate({
            catalog: oracle.catalog,
            paths: files,
            schema: oracle.drivers["3.0.0"],
          });

          assert.deepStrictEqual(
            verdicts.map(({ _tag }) => _tag),
            ["Valid", "Invalid", "Valid", "Invalid"],
            "a dangling IDREF validates and a repeated ID does not, in item-body content and under the lax wildcard alike",
          );
        }),
      { timeout: controlTimeoutMs },
    );
  });
});
