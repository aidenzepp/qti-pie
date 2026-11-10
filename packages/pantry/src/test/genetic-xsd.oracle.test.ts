/**
 * The grammar against `xmllint`, by a genetic search over documents (lane GEN-B): documents built
 * by construction from the composed grammar's content automata and attribute domains (the XDM
 * generator, `#pantry/test/gen/xdm.ts`), bred by the package search's edits and the document's own
 * named invalid cases (`#pantry/test/gen/genetic/document-xsd.ts`), each judged in both schema
 * versions by libxml2's XML Schema validator and by the law oracle
 * (`#pantry/test/xsd-differential.ts`). It replaces the drawn differential that judged 240 drawn
 * documents once each: its seeds are those draws, its edits the named variants that differential
 * applied and more, and its selection keeps every document that showed a feature no earlier one
 * had.
 *
 * Oracle: a second implementation. `xmllint` shares no code with the grammar; a difference no
 * record of `#pantry/test/xsd-differential.ts` matches is a bug in one of the two, reported with
 * its document reduced by hierarchical delta debugging and the edits that bred it.
 *
 * Seeds are rooted where `xmllint` judges: a root only an included fragment has (reading 114) has
 * no global declaration, so `xmllint` assesses nothing below it and the case compares nothing. The
 * lawful seeds come first (`#pantry/test/gen/genetic/lawful.ts`): documents built from the
 * grammar's content automata that both oracles should accept, each root model's accepting states
 * probed by a path stopped at each of its positions, and every position its models reach passed by
 * a covering document, so one edit of a lawful seed is the only cause of what it breaks, and a
 * lawful document the grammar refuses shows. The drawn seeds follow (the XDM generator's), lawful
 * in their content and attribute admission only. A seed holds no doctype and so no unexpanded
 * entity reference, since an entity declared only in an external subset no processor here reads
 * leaves no infoset to compare.
 *
 * The free suite replays, the same on every run: every lawful seed and the drawn seeds of the
 * suite's floor stream, judged as built, and the kept documents, each a reduced case a ruling or a
 * record settled, which must still show each known disagreement. A commit that touches nothing the
 * search reads judges the same documents as the one before it, so a lucky seed never turns it red.
 * `GR8DES_GENETIC=1` explores: the bred search with the long budget, its seed the run's
 * (`TEST_SEED`), rerunning with which breeds the same documents; every class it meets is reduced,
 * reported, and kept. It writes the documents under a folder of the run's own,
 * `work/genetic-xsd-*`, removed after the file.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as unit, layer } from "@effect/vitest";
import { Console, Effect, FileSystem, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { encode } from "@qti-pie/crust/encode.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { writeXml } from "@qti-pie/crust/write.ts";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import type { Stream } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { swarm } from "@grizzle/testing/swarm";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { names as documentNames } from "#pantry/model/names.ts";
import { toXmlDocument } from "#pantry/model/unshred.ts";
import { corpusFrom } from "#pantry/test/gen/genetic/corpus.ts";
import {
  documentOf,
  editedNamespaces,
  rowsOf,
  seedGenome,
  smallerXsd,
  xsdFamilyOf,
  xsdFeaturesOf,
  xsdMutationOf,
  xsdOperators,
} from "#pantry/test/gen/genetic/document-xsd.ts";
import type { XsdFeature, XsdGenome } from "#pantry/test/gen/genetic/document-xsd.ts";
import { evolve, reduce } from "#pantry/test/gen/genetic/engine.ts";
import { lawfulDocuments } from "#pantry/test/gen/genetic/lawful.ts";
import type { Breeding } from "#pantry/test/gen/genetic/mutate.ts";
import type { Budget, Judgment } from "#pantry/test/gen/genetic/engine.ts";
import { xdmDocument } from "#pantry/test/gen/xdm.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import type { Laws } from "#pantry/test/oracle.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { settings } from "#pantry/test/settings.ts";
import { compareJudgments, schemaSetOf, writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import type { Difference, XsdOracle } from "#pantry/test/xsd-catalog.ts";
import { liveReadings, stillSays } from "#pantry/test/live-readings.ts";
import {
  elementGrainDifferences,
  everyRecord,
  foreignNamesOf,
  fragmentOnlyKinds,
  generatedRecordOf,
  judgeDocument,
  reasonText,
  validated,
} from "#pantry/test/xsd-differential.ts";
import type { Recorded } from "#pantry/test/xsd-differential.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 0.2 s at a load average of 68 to 97,
 * its slowest test.
 */
const testTimeoutMs = 120_000;

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
 * The folder the bred documents are written to for `xmllint`, the run's own.
 */
const scratchRoot = fileScratchDirectory("genetic-xsd-");

/**
 * The folder the oracle's driver schemas and catalog are written to, the run's own.
 */
const oracleRoot = fileScratchDirectory("genetic-xsd-oracle-");

/**
 * How many drawn seeds of the floor stream the free suite judges beside the lawful ones.
 */
const fixedDrawn = 64;

/**
 * The exploration's budget under `GR8DES_GENETIC=1`: every lawful seed, 96 drawn seeds and 25
 * generations of 96. `initial` counts the drawn seeds; the run judges the lawful ones beside them.
 */
const budget: Budget = { candidates: 2400, edits: 4, generation: 96, initial: 96 };

/**
 * The most reduction proposals one finding is judged on, how many go to `xmllint` at once, how many
 * findings are reduced, and until when in the test's run, in milliseconds from its start; the rest
 * are reported as bred. A batch is one `xmllint` process per schema set, so three batches reduce a
 * finding.
 */
const reduction = { batch: 60, findings: 8, tries: 180, until: 6_000_000 } as const;

/**
 * The replay's timeout, in milliseconds: the grammar, the seeds and the kept documents, judged once
 * each in both versions, a hang guard. Measured 2026-11-07: 165.1 s at a load average of 87.8 to
 * 92.1, the replay of 214 seeds and 8 kept documents; this is over three times that.
 */
const replayTimeoutMs = 600_000;

/**
 * The exploration's timeout under `GR8DES_GENETIC=1`, in milliseconds: two hours, its reductions
 * until {@link reduction}'s `until`. The long run measures it.
 */
const exploreTimeoutMs = 7_200_000;

/**
 * One disagreement: a difference no record matches, in the version it was judged in.
 */
interface Disagreement {
  readonly difference: Difference;
  readonly version: SchemaVersion;
}

/**
 * Key a disagreement by its class: its direction, class and rule, and its detail with line
 * numbers, node indexes and quoted values left out, so one bug's documents share one key.
 *
 * @param disagreement - The disagreement.
 * @returns The key.
 */
const signatureOf = ({ difference }: Disagreement): string =>
  [
    difference.direction,
    difference.class,
    difference.rule,
    [
      ...new Set(
        difference.detail.split(" | ").map((message) =>
          message
            .replaceAll(/line \d+/gu, "line #")
            .replaceAll(/\[\d+\]/gu, "")
            .replaceAll(/'[^']*'/gu, "'…'")
            .replaceAll(/"(?:[^"\\]|\\.)*"/gu, '"…"'),
        ),
      ),
    ]
      .toSorted()
      .join(" | "),
  ].join(" ");

/**
 * Count, by its reason, each record the judged differences matched, for the report.
 */
const matchedCounts = new Map<string, number>();

/**
 * A known disagreement: a defect a lane owns and whose fix is queued, recorded so main stays green
 * until the fix lands, and checked every run so the record cannot outlive it. The search reports a
 * difference it matches without failing; the kept documents must still show each one, or the
 * record is stale and fails; the owner's fix deletes the record in the same commit.
 */
interface Known {
  readonly class: Difference["class"];
  readonly detail: RegExp;
  readonly direction: Difference["direction"];
  /**
   * The lane whose queued commit fixes it, and where that commit stands in the queue.
   */
  readonly owner: string;
  readonly why: string;
}

/**
 * The known disagreements, none at present.
 */
const knownDisagreements: readonly Known[] = [];

/**
 * Find the known disagreement a difference is.
 *
 * @param difference - The difference.
 * @returns The entry, or undefined for none.
 */
const knownOf = (difference: Difference): Known | undefined =>
  knownDisagreements.find(
    (entry) =>
      entry.direction === difference.direction &&
      entry.class === difference.class &&
      entry.detail.test(difference.detail),
  );

/**
 * Count, by its owner, each known disagreement the judged differences matched, for the report and
 * the stale check.
 */
const knownCounts = new Map<Known, number>();

/**
 * Judge documents in some versions with both oracles: each written once, `xmllint` run once per
 * version and root schema set, the law oracle on each document in each version, and every
 * difference classified.
 *
 * @param input - What to judge.
 * @param input.genomes - The documents.
 * @param input.grammar - The composed grammar.
 * @param input.laws - Its law tables.
 * @param input.oracle - What `writeXsdOracle` wrote.
 * @param input.versions - The versions each is judged in.
 * @param input.folder - The folder the documents are written to.
 * @returns One judgment per document, in order.
 */
const judgeAll = Effect.fn("test.geneticXsd.judgeAll")(function* judgeAll(input: {
  readonly folder: string;
  readonly genomes: readonly XsdGenome[];
  readonly grammar: ComposedGrammar;
  readonly laws: Laws;
  readonly oracle: XsdOracle;
  readonly versions: readonly SchemaVersion[];
}) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.makeDirectory(input.folder, { recursive: true });

  const written = yield* Effect.forEach(
    input.genomes,
    (genome, at) =>
      Effect.gen(function* writeCandidate() {
        const file = `${input.folder}/c${String(at)}.xml`;
        const bytes = yield* Effect.option(encode(documentOf(genome), "utf-8"));
        if (Option.isSome(bytes)) {
          yield* fs.writeFile(file, bytes.value);
        }

        return { bytes, file, genome };
      }),
    { concurrency: 1 },
  );
  const writable = written.flatMap(({ bytes, file, genome }) =>
    Option.isSome(bytes) ? [{ bytes: bytes.value, file, genome }] : [],
  );
  const verdicts = yield* Effect.forEach(
    input.versions,
    (version) =>
      writable.length === 0 ? Effect.succeed([]) : validated(input.oracle, version, writable),
    { concurrency: "unbounded" },
  );

  return yield* Effect.forEach(
    written,
    ({ bytes, file, genome }) =>
      Effect.gen(function* judgeCandidate() {
        if (Option.isNone(bytes)) {
          return {
            disagreements: [],
            features: new Set<XsdFeature>(["verdict:unwritable"]),
          } satisfies Judgment<XsdFeature, Disagreement>;
        }

        const slot = writable.findIndex((held) => held.file === file);
        const { root } = documentOf(genome);
        const edited = editedNamespaces(genome.seed, root);
        const features = new Set<XsdFeature>();
        const disagreements: Disagreement[] = [];
        for (const [index, version] of input.versions.entries()) {
          const xsd =
            verdicts[index]?.[slot] ?? (yield* Effect.die(new Error(`no verdict for ${file}`)));
          const law = yield* judgeDocument({
            bytes: bytes.value,
            grammar: input.grammar,
            laws: input.laws,
            path: file,
            version,
          });
          const comparison = compareJudgments(xsd, law);
          const rows = yield* rowsOf(bytes.value, version, input.grammar);
          // The law oracle names a foreign element by its foreign kind; the element grain reads
          // their expanded names from the rows' OpenElementName.
          const foreign = new Set(
            Option.match(rows, {
              onNone: () => [],
              onSome: ({ openElementNames }) =>
                openElementNames.map(({ local, namespace }) =>
                  namespace === "" ? local : `{${namespace}}${local}`,
                ),
            }),
          );
          const differences = [
            ...comparison.differences,
            ...elementGrainDifferences(xsd, law, comparison, input.grammar, foreign),
          ];
          // The classes read the document's names and schema set, which only a difference needs.
          if (differences.length > 0) {
            const names = yield* foreignNamesOf(bytes.value, version, input.grammar);
            const set = yield* schemaSetOf(version, root.namespace).pipe(
              Effect.orElseSucceed(() => new Set<string>()),
            );
            for (const difference of differences) {
              const record: Recorded | undefined = generatedRecordOf(difference, {
                document: { path: file, zip: "bred" },
                edited,
                grammar: input.grammar,
                names,
                root,
                set,
                stopped: law.stopped,
                version,
              });
              const known = record === undefined ? knownOf(difference) : undefined;
              if (known !== undefined) {
                knownCounts.set(known, (knownCounts.get(known) ?? 0) + 1);
              } else if (record === undefined) {
                disagreements.push({ difference, version });
              } else {
                const reason = reasonText(record.reason).slice(0, 60);
                matchedCounts.set(reason, (matchedCounts.get(reason) ?? 0) + 1);
              }
            }
          }

          for (const feature of xsdFeaturesOf({
            comparison,
            edits: genome.edits,
            law,
            rows,
            version,
            xsd,
          })) {
            features.add(feature);
          }
        }

        return { disagreements, features } satisfies Judgment<XsdFeature, Disagreement>;
      }),
    { concurrency: 1 },
  );
});

/**
 * The documents the replay judges as written: the reduced cases a ruling or a record settled, each
 * of which both oracles must judge alike from then on. The template inline's and the template
 * block's are VD's ruling of 2026-11-07 (spec reading 143: an interaction a template inline's
 * HTML holds is valid; only a template block refuses one at any depth, §5.145). The padded
 * `xsi:type`'s is libxml2's on both sides (`paddedTypeRecord`, `paddedTypeLaw`): a lawful-seed run
 * bred it from a drawn seed, `xsitype:ENTITY ` on a lax foreign element. The item lacking its
 * required attributes beside a nested item of its name is VD's run's (TEST_SEED=3143817330, drawn
 * seed #5, no edit): both oracles refuse the root, and the element grain read xmllint's messages on
 * the root as the nested item's. The two stimuli holding an item in a math element's lax content
 * are TD-B's run's (TEST_SEED=2298271331, drawn seed #32, unedited and with two missing required
 * children): xmllint refuses the nested item's attributes and its text, which reading 6 keeps
 * foreign, and the element grain named every such message "(foreign)", so reading 6's record could
 * not see it stood within a nested root. The two LOM roots are JAN's run's (TEST_SEED=2990697775)
 * and CRUST's (TEST_SEED=2420825299): below an element laxly assessed with an xsi:type that names
 * no type of the set, a descendant typed by a built-in simple type it breaks, which the law oracle
 * refuses (reading 60: the children are assessed laxly in turn) and libxml2 never assesses, after
 * cvc-type clause 1 (`skippedContentRecord`).
 *
 * The six after the template block's are the shapes Aiden's runs of the free suite met (PR #46,
 * comment 6701102861), each a document's only kind of fault. A blank media URL is refused under
 * reading 124, or 125 for a track's `src`, where the XSD's `URLDType` admits it; its srcset value
 * is TEST_SEED=505's drawn seed #12's. A template variable and a context variable that nothing
 * declares, `é`, are refused beyond the XSD, which resolves neither name (the `template-ref` and
 * `context-variable-ref` records). A 3.0.0 manifest's `xsi:type` naming `cp:ResourcesDType`, which
 * only 3.0.1 declares, resolves to no type in 3.0.0, which the codec refuses as `type-unknown` and
 * xmllint as a QName that resolves to no type definition, since 55a6e428; and a section holding
 * only a branch rule is valid in both oracles since reading 26's rule was withdrawn (7858a46c). At
 * Aiden's head (1ee51d8d) the law oracle refused the manifest under `xsi-type`, a class xmllint's
 * refusal does not share, and the section under `child-set`, where xmllint accepts it.
 *
 * The next is TEST_SEED=101's drawn seed #60, unedited, reduced to its one context declaration:
 * one that writes no identifier and no cardinality, whose default value's second value writes a
 * `base-type` spelling nothing and no `field-identifier`. Both oracles refuse the missing
 * attributes and the base type's form, and the law oracle refuses Value cardinality beyond the XSD,
 * since a value writes both or neither whatever its declaration's cardinality spells (reading 158);
 * the search had no record of the rule (`value-cardinality` in `generatedRecorded`), and the law's
 * explanation named the absent cardinality `""`.
 *
 * The next three are drawn seeds of rotating streams, each reduced to its one difference. The empty
 * tolerance is TEST_SEED=555's drawn seed #59's, a `qti-equal` with `tolerance=""`: xmllint accepts
 * it, since the XSD's list of a union of xs:string and xs:double admits an empty list, and the law
 * oracle refuses it under `P36`, as reading 121 reads every tolerance as one or two values; the
 * search had no record of the rule. The target-value's line end is TEST_SEED=3003's drawn seed
 * #38's: xmllint refuses a match table entry's `target-value` of `a`, a line end and `b` as no
 * base-type name, which reading 8 sets aside, and reading 8's record read the value with a `.` that
 * stops at a line end. The empty `xs:ENTITIES` element is TEST_SEED=65535's drawn seed #33's: the
 * law oracle refuses it, a list of no item where the type's minLength is 1, and libxml2 accepts it,
 * as it does a blank `xs:NMTOKENS` or `xs:IDREFS` element (`blankListRecord`), whose pattern named
 * those two types alone.
 *
 * The next is the genetic repair's R-X1: an interaction in a modal feedback's content body, which
 * the law oracle refuses under N6 (§5.93: the content of a modal feedback contains no interaction)
 * and xmllint accepts, as the XSD does not state the ban; its `specification` record sits beside
 * the template block's.
 *
 * The next two are the genetic repair's R-X2b and R-X2: `xsi:nil` on a division, an element no
 * declaration makes nillable. With `xsi:nil="false"` libxml2 says "The element is not
 * 'nillable'." (cvc-elt.3.1), which agrees with the law oracle's `attribute-allowed` once the
 * catalog classes it so. With `xsi:nil=""` libxml2 reports only the value, which is no
 * `xs:boolean`, and never cvc-elt.3.1, while the law oracle refuses the value and the attribute's
 * presence both; its `libxml2` record is `nilValueRecord`.
 *
 * The next two are the genetic repair's R-X3b and R-X3: two interactions of an item that bind one
 * response variable, two text entry interactions in one paragraph and a text entry interaction
 * beside a custom interaction. The law oracle refuses the second binding under Binding unique
 * (reading 92, §2.2.2.2: a response variable is bound to one interaction only), which reading 172
 * widened to every interaction kind, and xmllint accepts both, as the XSD resolves no binding;
 * their `beyond` record sits beside reading 75's.
 *
 * The next four are the genetic repair's R-X4 and R-X5, each beside its control, below an element
 * of an XInclude's content whose `xsi:type` names `xs:ENTITIES`. Once that element holds an element
 * child, libxml2 refuses it under cvc-type clause 3.1.2 and assesses nothing more of it: neither
 * the text `<` after the child, which the law oracle refuses as no `xs:ENTITIES`, nor an `h2`
 * within the child whose `aria-level` is no integer (`skippedContentRecord`). Without the child
 * both refuse the text, and without the `xsi:type` both refuse the `aria-level`. The record
 * matches only at places a document's rows show libxml2 skipped, and the replay reports no
 * difference a record matches, so these controls show the two agree there, not that the record
 * stays narrow.
 *
 * The next four are the LOM xml:id class gr-lom-1 found with seed 1281456798, two causes each of
 * which the law oracle's "DocumentId key" refuses and xmllint accepts. The first two are an
 * external LOM file holding one `xml:id` twice, padded and plain: the loose LOM binding's set
 * declares no `xml:id`, so XML Schema keys nothing there, while the grammar types it as a
 * manifest's set does (reading 81's limit, `outsideSet`). The last two are a section's selection
 * whose two foreign elements hold `v` and its padded form, and one padded form twice: the ASI set
 * declares `xml:id`, and libxml2 keys it by its raw value at parse time (`paddedIdRecord`). With
 * `v` twice there both refuse, which gr-lom-1's controls showed and the replay cannot: it reports
 * no agreement.
 *
 * The next six are genetic repair round 4's X1, X2 and X3a, each a reading that refuses more than
 * the XSD. The two context declarations sharing an identifier, in a test and in an item, are
 * reading 74's: a context's identifier is unique among its document's IDs, which 3.0.0's XSD types
 * `xs:ID` and 3.0.1's `IdentifierDType`, so they differ in 3.0.1 alone. The three sources without
 * their attribute are reading 124's: a source in a video or an audio carries `src`, and one in a
 * picture `srcset`, where the XSD makes both optional; reading 124's earlier records held only a
 * blank value. The stylesheet's type opening with a space is reading 135's: a MIME type is two
 * RFC 2045 tokens, where the XSD's `MimeTypeDType` pattern admits a space.
 *
 * The last eight are genetic repair round 4's X3b, X4a, X4b and X5: the search's reduced document
 * of each, verbatim, beside the trace's reduction of it to its cause (X3b, X4a, X4b) or a plain
 * item that shows it in both versions (X5). An SSML speak whose version is no `1.1`, in an
 * include's content or in a paragraph, is reading 39's: SSML 1.1 says the version is `1.1`, where
 * QTI's XSD types it `xs:NMTOKEN`. Whitespace in a MathML `exists` beside text in a nested item, in
 * one include, is two recorded classes in one difference, reading 2's whitespace and reading 6's
 * nested root (`nestedRootBesideMath`). A truncate whose `xsi:type` admits one expression and holds
 * two, beneath a no-namespace element of an include, is reading 50's limit: the law oracle accepts
 * a laxly held element whose `xsi:type` names a complex type without checking it against the type,
 * and xmllint checks it (`laxComplexType`). An interaction beneath a hottext through SSML and HTML
 * wrappers is the specification's (§5.65: a hottext holds no nested interaction), a ban the XSD
 * loses beneath a foreign element's lax wildcard; the reduced stimulus holds a custom interaction,
 * which only 3.0.1 admits, so the item's text entry interaction shows it in 3.0.0 too.
 */
const keptDocuments: readonly { readonly name: string; readonly text: string }[] = [
  {
    name: "an interaction in a template inline's span",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="string"/><qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/><qti-item-body><p><qti-template-inline template-identifier="T" identifier="x"><span><qti-text-entry-interaction response-identifier="R"/></span></qti-template-inline></p></qti-item-body></qti-assessment-item>',
  },
  {
    name: "an xsi:type padded with a trailing space, on a foreign element a lax wildcard holds",
    text: '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-selection xmlns:n="urn:n"><config xmlns="urn:w" xmlns:o="urn:w"><widget xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns="" xmlns:xsitype="http://www.w3.org/2001/XMLSchema" zs:type="xsitype:ENTITY "/></config></qti-selection></qti-assessment-section>',
  },
  {
    name: "an item lacking its required attributes, beside a nested item of its name in a modal feedback's SSML",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-outcome-declaration identifier="O" cardinality="single" base-type="identifier"/><qti-modal-feedback outcome-identifier="O" show-hide="show" identifier="F"><qti-content-body><s xmlns="http://www.w3.org/2001/10/synthesis"><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" title="t"/></s></qti-content-body></qti-modal-feedback></qti-assessment-item>',
  },
  {
    name: "an item nested in a stimulus's math element, lacking its required attributes",
    text: '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!--&é-->\n<?t dd?>\n<qti-assessment-stimulus xmlns:xsitype="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" zs:type="xsitype:AssessmentStimulusDType" tool-name="v&amp;&quot;"><a:qti-stimulus-body xmlns:n="urn:n" xmlns:a="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><nav data-a-b=" &amp;é&quot;" data-x="]]>&#x9;"><h5 data-y.z="" aria-invalid="" aria-activedescendant=" \'&#x9;" aria-label="v&amp;&#xD;" data-a-b=""><sub data-y.z="&quot;" data-q_1="&lt;&#x9;&#xD;é">&#xD;&amp;&amp;</sub></h5>&amp;<include xmlns:x="urn:x" xmlns:y="urn:y" xmlns="http://www.w3.org/2001/XInclude" xml:space="&lt;&#xD;é" xml:base="&lt;]]>&quot;" accept="&amp;\'&#xD;" y:a="&#x9;" x:a="a b&#x9;&quot; " parse="&lt;&#xA;&#x9;" x:b="">&#xD;<qti-prompt xmlns="" y:a="&lt;]]>\'é" title="&amp;a bé" data-q_1="" x:b=" v&quot;a b"><div x:b="&amp;&#x9;]]>&amp;" label="a b\' " x:a="">😀\n&lt;😀<phoneme xmlns="http://www.w3.org/2001/10/synthesis" y:a="&#xD;&#xA; \'" x:b="va b\'" x:a="&amp;\'\'"/></div><p data-a-b="\'" data-x="é]]>&#xA;" label="&quot;\'"><qti-prompt xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xl="http://www.w3.org/1999/xlink" zs:schemaLocation="a b" xl:to="]]>&#xD;" xl:href="é&amp;" xml:id=""/></p><b:mi xmlns:b="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:o="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xl="http://www.w3.org/1999/xlink" o:size="" xl:role=" " zs:schemaLocation="v" o:label="&#xA;"><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xl:role="&#x9;" xl:actuate="&#xD;" xl:type="&amp;&lt;" o:title="]]>&amp;" o:label="a b éé" zs:noNamespaceSchemaLocation="é&lt;">tt<?t?></qti-assessment-item><config xmlns="urn:w" xmlns:o="urn:w" o:title="&amp;&quot;a b" o:label="&lt;"><?t >dd?>é&amp;&amp;\t<?p-q?></config><?p-q d?d?><config xmlns:xsitype="http://www.w3.org/2001/XMLSchema" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" zs:type="xsitype:ID" zs:schemaLocation=""><?t >?></config></b:mi></qti-prompt></include></nav></a:qti-stimulus-body><!-- --></qti-assessment-stimulus>',
  },
  {
    name: "an item nested in a stimulus's math element, its text in element-only content",
    text: '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!--&é-->\n<?t dd?>\n<qti-assessment-stimulus xmlns:xsitype="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" zs:type="xsitype:AssessmentStimulusDType" tool-name="v&amp;&quot;"><a:qti-stimulus-body xmlns:n="urn:n" xmlns:a="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><nav data-a-b=" &amp;é&quot;" data-x="]]>&#x9;"><h5 data-y.z="" aria-invalid="" aria-activedescendant=" \'&#x9;" aria-label="v&amp;&#xD;" data-a-b=""><sub data-y.z="&quot;" data-q_1="&lt;&#x9;&#xD;é">&#xD;&amp;&amp;</sub></h5>&amp;<include xmlns:x="urn:x" xmlns:y="urn:y" xmlns="http://www.w3.org/2001/XInclude" xml:space="&lt;&#xD;é" xml:base="&lt;]]>&quot;" accept="&amp;\'&#xD;" y:a="&#x9;" x:a="a b&#x9;&quot; " parse="&lt;&#xA;&#x9;" x:b="">&#xD;<qti-prompt xmlns="" y:a="&lt;]]>\'é" title="&amp;a bé" data-q_1="" x:b=" v&quot;a b"><div x:b="&amp;&#x9;]]>&amp;" label="a b\' " x:a="">😀\n&lt;😀<phoneme xmlns="http://www.w3.org/2001/10/synthesis" y:a="&#xD;&#xA; \'" x:b="va b\'" x:a="&amp;\'\'"/></div><p data-a-b="\'" data-x="é]]>&#xA;" label="&quot;\'"><qti-prompt xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xl="http://www.w3.org/1999/xlink" zs:schemaLocation="a b" xl:to="]]>&#xD;" xl:href="é&amp;" xml:id=""/></p><b:mi xmlns:b="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:o="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xl="http://www.w3.org/1999/xlink" o:size="" xl:role=" " zs:schemaLocation="v" o:label="&#xA;"><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xl:role="&#x9;" xl:actuate="&#xD;" xl:type="&amp;&lt;" o:title="]]>&amp;" o:label="a b éé" zs:noNamespaceSchemaLocation="é&lt;">tt<?t?></qti-assessment-item><config xmlns="urn:w" xmlns:o="urn:w" o:title="&amp;&quot;a b" o:label="&lt;"><?t >dd?>é&amp;&amp;\t<?p-q?></config><?p-q d?d?><config xmlns:xsitype="http://www.w3.org/2001/XMLSchema" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" zs:type="xsitype:ID" zs:schemaLocation=""><?t >?></config></b:mi></qti-prompt></include></nav></a:qti-stimulus-body><qti-catalog-info xmlns:n="urn:n" zs:noNamespaceSchemaLocation="v]]>&lt;" zs:schemaLocation="&lt;&#x9;a b]]>"><qti-catalog id="" zs:schemaLocation="&quot;" zs:noNamespaceSchemaLocation=""/><!--&-c--></qti-catalog-info><!-- --></qti-assessment-stimulus>',
  },
  {
    name: "an xs:Name element holding an element, below an element whose xsi:type names no type of a LOM root's set",
    text: '<?xml version="1.0" encoding="UTF-8"?>\n<a:lom xmlns:a="http://ltsc.ieee.org/xsd/LOM" xmlns:x="urn:x" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsitype="http://ltsc.ieee.org/xsd/LOM" xmlns:n="urn:n" zs:type="xsitype:LOM.Type" x:b="" x:a="&#xD;]]>"><a:mi xmlns:a="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><a:small xmlns:xsitype="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" zs:type="xsitype:HTMLTextDType" data-ssml="]]>]]>&quot;"><a:phoneme xmlns:a="http://www.w3.org/2001/10/synthesis">&amp;&lt;<!---->\tt\n<!---->ét😀<!----> &amp;\t&#xD;<!----></a:phoneme><small xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" data-y.z="&lt;" zs:type="xsitype:HTMLTextDType" data-a-b="a b&#xD;"><a:mark xmlns:a="http://www.w3.org/2001/10/synthesis" xmlns:y="urn:y" xmlns:xsitype="http://www.w3.org/2001/10/synthesis" xml:id="&quot;&lt;" zs:noNamespaceSchemaLocation="&amp;&lt;" zs:type="xsitype:mark" y:a="&#xA;]]>&amp;" x:a=" &quot;"><b:qti-prompt xmlns:b="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">&lt;\n<a:widget xmlns:xsitype="http://www.w3.org/2001/XMLSchema" xmlns:a="urn:w" zs:type="xsitype:date">t<!-- --></a:widget><qti-prompt xmlns:xsitype="http://www.w3.org/2001/XMLSchema" zs:noNamespaceSchemaLocation="&amp;&#xD;" zs:type="xsitype:Name" zs:schemaLocation=" ">&amp;t<!--é c--><th xmlns=""/> té</qti-prompt></b:qti-prompt><b:p xmlns:xsitype="http://www.w3.org/2001/XMLSchema" xmlns:b="urn:w" zs:type="xsitype:IDREF">&lt;😀é😀&lt;</b:p></a:mark></small></a:small></a:mi></a:lom>',
  },
  {
    name: "an xs:unsignedShort element of other text, below a foreign element whose xsi:type names no type",
    text: '<lom xmlns:xl="http://www.w3.org/1999/xlink" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsitype="http://ltsc.ieee.org/xsd/LOM" xmlns:x="urn:x" xmlns:y="urn:y" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://ltsc.ieee.org/xsd/LOM"><qti-assessment-item xmlns:xsitype="urn:w" xmlns:n="urn:n" xmlns="urn:w" zs:type="xsitype:NoSuchType"><b:div xmlns:b="urn:w"><config xmlns:xsitype="http://www.w3.org/2001/XMLSchema" xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" zs:type="xsitype:unsignedShort" zs:nil=" &lt;é " zs:noNamespaceSchemaLocation="&lt;&amp;v" xsi:schemaLocation="&lt;&#xD;&lt;&#x9;">é\né</config>\né&amp;&#xD;</b:div></qti-assessment-item></lom>\n<!---c-c -->\n<!---c&é-->',
  },
  {
    name: "an interaction in a template block's paragraph",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="string"/><qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/><qti-item-body><qti-template-block template-identifier="T" identifier="x"><p><qti-text-entry-interaction response-identifier="R"/></p></qti-template-block></qti-item-body></qti-assessment-item>',
  },
  {
    name: "an audio's empty src, a video's blank src and poster, and a picture source's blank srcset",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><div><audio src=""/><video src=" " poster="&#x9;"/><picture><source srcset=" &#xA; &#xD;"/><img src="a.png" alt="a"/></picture></div></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a track's blank src",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><div><video src="v.mp4"><track src=" " srclang="en"/></video></div></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a template inline naming a template variable nothing declares",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><p><qti-template-inline template-identifier="é" identifier="x">y</qti-template-inline></p></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a PCI's context variable naming a context variable nothing declares",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="string"/><qti-item-body><qti-portable-custom-interaction response-identifier="R" module="m" custom-interaction-type-identifier="c"><qti-interaction-markup><div>x</div></qti-interaction-markup><qti-context-variable identifier="é"/></qti-portable-custom-interaction></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a manifest's resources whose xsi:type names cp:ResourcesDType, which only 3.0.1 declares",
    text: '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources xsi:type="ResourcesDType"/></manifest>',
  },
  {
    name: "a section holding only a branch rule",
    text: '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="S" title="s" visible="true"><qti-branch-rule target="EXIT_TEST"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule></qti-assessment-section>',
  },
  {
    name: "a context declaration with no cardinality, a value of whose default writes a base-type alone",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-context-declaration><qti-default-value><qti-value>a</qti-value><qti-value base-type="a b&lt;év">b</qti-value></qti-default-value></qti-context-declaration></qti-assessment-item>',
  },
  {
    name: "a qti-equal whose tolerance is empty",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-outcome-declaration identifier="O" cardinality="single" base-type="boolean"/><qti-response-processing><qti-set-outcome-value identifier="O"><qti-equal tolerance=""><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">1</qti-base-value></qti-equal></qti-set-outcome-value></qti-response-processing></qti-assessment-item>',
  },
  {
    name: "a match table entry whose target-value holds a line end",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-outcome-declaration identifier="O" cardinality="single" base-type="string"><qti-match-table><qti-match-table-entry source-value="1" target-value="a&#xA;b"/></qti-match-table></qti-outcome-declaration></qti-assessment-item>',
  },
  {
    name: "an xs:ENTITIES element holding no item, in a LOM root's lax content",
    text: '<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><widget xmlns="urn:w" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:ENTITIES"/></lom>',
  },
  {
    name: "an interaction in a modal feedback's division",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-modal-feedback outcome-identifier="FEEDBACK" identifier="f" show-hide="show"><qti-content-body><div><qti-text-entry-interaction response-identifier="R"/></div></qti-content-body></qti-modal-feedback></qti-assessment-item>',
  },
  {
    name: "a false xsi:nil on a stimulus body's division, which no declaration makes nillable",
    text: '<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="s" title="t"><qti-stimulus-body><div xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil="false"/></qti-stimulus-body></qti-assessment-stimulus>',
  },
  {
    name: "an empty xsi:nil on a stimulus body's division, which no declaration makes nillable",
    text: '<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="s" title="t"><qti-stimulus-body><div xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:nil=""/></qti-stimulus-body></qti-assessment-stimulus>',
  },
  {
    name: "two text entry interactions bound to one response variable",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="a1" cardinality="single" base-type="string"/><qti-item-body><p><qti-text-entry-interaction response-identifier="a1"/><qti-text-entry-interaction response-identifier="a1"/></p></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a text entry interaction and a custom interaction bound to one response variable",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="a1" cardinality="single" base-type="string"/><qti-item-body><p><qti-text-entry-interaction response-identifier="a1"/></p><qti-custom-interaction response-identifier="a1"/></qti-item-body></qti-assessment-item>',
  },
  {
    name: "an xs:ENTITIES element holding an element and then other text, in an XInclude's content",
    text: '<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-processing-fragment><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="f.xml"><widget xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:ENTITIES"><b/>&lt;</widget></xi:include></qti-response-processing-fragment></qti-response-processing>',
  },
  {
    name: "an xs:ENTITIES element of other text, in an XInclude's content",
    text: '<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-processing-fragment><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="f.xml"><widget xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:ENTITIES">&lt;</widget></xi:include></qti-response-processing-fragment></qti-response-processing>',
  },
  {
    name: "an h2 whose aria-level is no integer, in a stimulus body an xs:ENTITIES element of an XInclude's content holds",
    text: '<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-processing-fragment><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="f.xml"><widget xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:ENTITIES"><qti-stimulus-body xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><h2 aria-level="x"/></qti-stimulus-body></widget></xi:include></qti-response-processing-fragment></qti-response-processing>',
  },
  {
    name: "an h2 whose aria-level is no integer, in a stimulus body an untyped element of an XInclude's content holds",
    text: '<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-processing-fragment><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="f.xml"><widget xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema"><qti-stimulus-body xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><h2 aria-level="x"/></qti-stimulus-body></widget></xi:include></qti-response-processing-fragment></qti-response-processing>',
  },
  {
    name: "a padded xml:id held twice under an external LOM file's elements, whose set declares no xml:id",
    text: '<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><lifeCycle><version xml:id="&#x9;vé "/></lifeCycle><lifeCycle><version xml:id="&#x9;vé "/></lifeCycle></lom>',
  },
  {
    name: "an xml:id held twice under an external LOM file's elements, whose set declares no xml:id",
    text: '<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><lifeCycle><version xml:id="v"/></lifeCycle><lifeCycle><version xml:id="v"/></lifeCycle></lom>',
  },
  {
    name: "an xml:id and its padded form on two foreign elements of a section's selection",
    text: '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="s" title="t" visible="true"><qti-selection select="1"><w:config xmlns:w="urn:w"><w:a xml:id="v"/><w:b xml:id="&#x9;v "/></w:config></qti-selection></qti-assessment-section>',
  },
  {
    name: "a padded xml:id held twice on two foreign elements of a section's selection",
    text: '<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="s" title="t" visible="true"><qti-selection select="1"><w:config xmlns:w="urn:w"><w:a xml:id="&#x9;vé "/><w:b xml:id="&#x9;vé "/></w:config></qti-selection></qti-assessment-section>',
  },
  {
    name: "two context declarations of a test that share an identifier",
    text: '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-context-declaration identifier="a1"/><qti-context-declaration identifier="a1"/></qti-assessment-test>',
  },
  {
    name: "two context declarations of an item that share an identifier",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-context-declaration identifier="a1"/><qti-context-declaration identifier="a1"/></qti-assessment-item>',
  },
  {
    name: "a video's source with no src",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><div><video><source/></video></div></qti-item-body></qti-assessment-item>',
  },
  {
    name: "an audio's source with no src",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><div><audio><source/></audio></div></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a picture's source with no srcset",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-item-body><div><picture><source/><img src="a.png" alt="a"/></picture></div></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a modal feedback's stylesheet whose type opens with a space",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-modal-feedback><qti-stylesheet type=" text/plain"/></qti-modal-feedback></qti-assessment-item>',
  },
  {
    name: "an SSML speak whose version is no 1.1, in an include of an item's response processing",
    text: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<?p-q?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-processing><include xmlns="http://www.w3.org/2001/XInclude"><a:speak xmlns:y="urn:y" xmlns:a="http://www.w3.org/2001/10/synthesis" version="x"/></include></qti-response-processing></qti-assessment-item>',
  },
  {
    name: "an SSML speak whose version is no 1.1, in an item body's paragraph",
    text: '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i1" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p><speak xmlns="http://www.w3.org/2001/10/synthesis" version="x" xml:lang="en">hi</speak></p></qti-item-body></qti-assessment-item>',
  },
  {
    name: "a section's include holding whitespace in empty MathML elements beside text in nested items",
    text: '<?xml version="1.0"?>\n<!---->\n<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><include xmlns="http://www.w3.org/2001/XInclude"><config xmlns=""><qti-prompt><mi xmlns="urn:w">&amp;tté<math xmlns="http://www.w3.org/1998/Math/MathML"><exists><!---cé--><!--&-->\n</exists></math>éé&lt;t<mi><s xmlns="http://www.w3.org/2001/10/synthesis" xmlns:n="urn:n">&lt;&#xD;t\né<!-- c-->tt<!-- -->&lt;<!-->>-c--></s></mi></mi><a:abbr xmlns:a="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><break xmlns="http://www.w3.org/2001/10/synthesis"><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">&lt;]]&gt;<!--&>-->&lt;&amp;<!----></qti-assessment-item><config xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">&amp;é<!--><-->t>é<!-- --></config><widget xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">é&amp;<!---c>-->\t😀&amp;\n</widget><td xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:n="urn:n"/><p xmlns="urn:w" xmlns:n="urn:n">&amp;]]&gt;<!--<<c-->]]&gt;&lt;&lt;&amp;<!--<--> é\t </p><var xmlns:n="urn:n" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/><qti-assessment-item xmlns="urn:w">a b&amp;é&#xD;\t<!-- -->\n>t]]&gt;</qti-assessment-item></break><math xmlns="http://www.w3.org/1998/Math/MathML"><cn xmlns:n="urn:n">>😀&amp;😀<!---c-->&amp;&#xD;é😀&#xD;<!-- é-->> &lt;<!--c-->&amp; &#xD;</cn><csymbol>\né\n<!----></csymbol><b:mode xmlns:b="http://www.w3.org/1998/Math/MathML">&#xD;<!--&-c--></b:mode><ci>\nt<!---c-->&lt;é<!---->😀&lt;a b&lt;<!--< &--></ci><!--> --><a:mode xmlns:a="http://www.w3.org/1998/Math/MathML"><!--c<-->\t<!-- é-->&#xD;\n<!--é--></a:mode>\t&#xD;<!--é--></math><s xmlns="http://www.w3.org/2001/10/synthesis"><a:qti-assessment-item xmlns:a="urn:w" xmlns:n="urn:n">a b&lt;&amp;<!--&-->\t\tt<!-->-c>--></a:qti-assessment-item><qti-prompt xmlns="urn:w"/>t&amp;t&amp;<!----></s><a:sub xmlns:a="http://www.w3.org/2001/10/synthesis" xmlns:n="urn:n"><config xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">tt</config>&#xD;a bt<cite xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"> \t <!-- -->&lt;>&#xD;<!--c>--></cite><config xmlns="urn:w"/></a:sub></a:abbr></qti-prompt></config></include></qti-assessment-section>',
  },
  {
    name: "an include of response processing holding whitespace in a MathML exists beside text in a nested item",
    text: '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i1" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p>A.</p></qti-item-body><qti-response-processing><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="rules.xml"><config xmlns=""><math xmlns="http://www.w3.org/1998/Math/MathML"><exists>\n</exists></math><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">t</qti-assessment-item></config></xi:include><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-processing></qti-assessment-item>',
  },
  {
    name: "expressions whose xsi:type names a complex type, under a no-namespace element of a response processing's include",
    text: '<?xml version="1.0"?>\n<?p-q?>\n<?x1 ?d?dd?>\n<qti-response-processing xmlns:n="urn:n" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><include xmlns="http://www.w3.org/2001/XInclude" xml:id=" \'" href="&#xD;v"><config xmlns="" xmlns:x="urn:x" x:b="]]>&lt;v&#xD;" x:a="\'"><qti-set-outcome-value xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="]]>é"><qti-container-size xmlns:xsitype="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xsi:noNamespaceSchemaLocation="é&#xA;&lt;a b" xsi:type="xsitype:LogicSingleDType"><qti-truncate xsi:type="xsitype:LogicSingleDType" xsi:noNamespaceSchemaLocation="a b" xsi:schemaLocation=""><qti-number-presented xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>\n<qti-integer-modulus xsi:type="xsitype:LogicPairDType"><qti-lcm> <?t ?d>d?><!-- é&--></qti-lcm><!-->--></qti-integer-modulus><!--<--></qti-truncate>\t<?x1 > ?d?></qti-container-size><!----></qti-set-outcome-value></config></include></qti-response-processing>',
  },
  {
    name: "a truncate whose xsi:type admits one expression, holding two, under a no-namespace element of an include",
    text: '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i1" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p>A.</p></qti-item-body><qti-response-processing><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="rules.xml"><config xmlns="" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:q="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-truncate xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xsi:type="q:LogicSingleDType"><qti-number-presented/><qti-integer-modulus xsi:type="q:LogicPairDType"><qti-lcm/></qti-integer-modulus></qti-truncate></config></xi:include><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-processing></qti-assessment-item>',
  },
  {
    name: "an interaction under a hottext through foreign SSML and HTML wrappers",
    text: '<?xml version="1.0" standalone="yes"?>\n<?t ?d?>\n<?p-q d?>\n<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">\t\t\n<qti-stylesheet xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><!----><!--c --><!--&<--><!--c>--></qti-stylesheet><qti-stimulus-body xmlns:xsitype="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xsitype:StimulusBodyDType" data-y.z="\'&amp;" label="v"><h5 xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-text-entry-interaction response-identifier="a1"/></h5><ol data-x="&#xD;&lt;">  <li data-x=" ">t<kbd xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">éé😀&#xD;<!---->é<?x1 dd?>t&lt;&#xD; </kbd><sup data-a-b="" data-x=""><say-as xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns:y="urn:y" xmlns:x="urn:x" xmlns="http://www.w3.org/2001/10/synthesis"><sup xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsitype="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" data-x="&quot;&amp;\'&#x9;" xsi:type="xsitype:HTMLTextDType" data-q_1="é&quot;]]>&quot;">é&amp;éé<!--é--> &#xD;\t</sup><widget xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">&amp;<config xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsitype="http://www.w3.org/2001/XMLSchema" zs:type="xsitype:QName"/><qti-assessment-item xmlns="urn:w" lax-a="&lt;v" data-y.z="&quot;v">&lt;&lt;\n<template xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><widget xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsitype="http://www.w3.org/2001/XMLSchema" zs:type="xsitype:integer">\t&amp; \t<?x1?>t&lt;t</widget><mi xmlns="urn:w" xmlns:y="urn:y" xmlns:x="urn:x" y:a="" x:a="&amp;&amp;év"/></template></qti-assessment-item></widget><a xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" href="a1"><qti-hottext identifier="a1"><qti-printed-variable identifier="a1"/><speak xmlns:y="urn:y" xmlns:x="urn:x" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:xsitype="http://www.w3.org/2001/10/synthesis" y:a="&lt;&amp;év" zs:schemaLocation="" zs:type="xsitype:speak" x:a="" version="v&amp;v&#xA;">\n>é]]&gt;<h6 xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:b="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:x="urn:x" xmlns:o="urn:w" xmlns:y="urn:y" data-y.z="\'&lt;" data-a-b="&#x9;é&#xD;&quot;">\t\t&amp;<b:qti-custom-interaction xmlns:b="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><!----><b:qti-prompt xmlns:y="urn:y" xmlns:x="urn:x" xmlns:o="urn:w" xmlns:b="urn:w" x:a="&quot;&#x9;" o:zz="&quot;\' &#xA;" y:a="év&#xD;&lt;">é é</b:qti-prompt><kbd data-x="&#xD;v" data-q_1="a b]]>" data-a-b="\'&#xD;" data-y.z="\'&lt;">t&#xD;t<?p-q é>?></kbd></b:qti-custom-interaction></h6></speak></qti-hottext></a></say-as>&lt;t<label aria-hidden="é v" aria-required="&lt;&quot;&quot;v">é&lt;><?t d ?></label></sup></li></ol></qti-stimulus-body></qti-assessment-stimulus>\n<?x1 ?d?>',
  },
  {
    name: "a text entry interaction in a heading of an SSML speak in a hottext",
    text: '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="identifier"/><qti-response-declaration identifier="S" cardinality="single" base-type="string"/><qti-item-body><qti-hottext-interaction response-identifier="R"><p><qti-hottext identifier="H"><speak xmlns="http://www.w3.org/2001/10/synthesis" version="1.1" xml:lang="en"><h6 xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-text-entry-interaction response-identifier="S"/></h6></speak></qti-hottext></p></qti-hottext-interaction></qti-item-body></qti-assessment-item>',
  },
];

/**
 * Write a document genome's document as a report shows it.
 *
 * @param genome - The genome.
 * @returns Its XML text, or `(unwritable)` where crust cannot write it.
 */
const shown = (genome: XsdGenome) =>
  Effect.map(Effect.result(writeXml(documentOf(genome))), (text) =>
    Result.getOrElse(text, () => "(unwritable)"),
  );

/**
 * Write a disagreement as the replay reports it: its version, direction, class, rule and detail.
 *
 * @param disagreement - The disagreement.
 * @returns The line.
 */
const shownOf = ({ difference, version }: Disagreement): string =>
  `in ${version}: ${difference.direction} ${difference.class} ${difference.rule}: ${difference.detail.slice(0, 400)}`;

/**
 * The kept documents as genomes, read from their text.
 */
const keptGenomes = Effect.forEach(
  keptDocuments,
  ({ text }) =>
    Effect.map(Effect.orDie(readXml(new TextEncoder().encode(text))), (doc) => seedGenome(doc, {})),
  { concurrency: 1 },
);

/**
 * Whether a root kind's documents are judged: `xmllint` judges every root but one only an included
 * fragment has (reading 114).
 *
 * @param kind - The root's kind.
 * @returns Whether its documents seed the search.
 */
const judgedRoot = (kind: string): boolean => !fragmentOnlyKinds.has(kind);

/**
 * The seeds of a run: the genomes, lawful first, and each one's name by the root of its document,
 * which a finding bred from it reads back through its genome's `seed`.
 */
interface Seeds {
  readonly names: ReadonlyMap<Element, string>;
  readonly seeds: readonly XsdGenome[];
}

/**
 * Build the seed documents, rooted only at kinds whose roots `xmllint` judges: every lawful
 * document, then `count` documents of the XDM generator's, with no doctype and so no entity
 * reference, drawn on the run's own stream; each with a swarm of its own, and named, a drawn one by
 * its place.
 *
 * @param grammar - The composed grammar.
 * @param stream - The run's stream.
 * @param count - How many drawn seeds.
 * @returns The seeds.
 */
const seedsOf = (grammar: ComposedGrammar, stream: Stream, count: number): Seeds => {
  const lawful = lawfulDocuments(grammar, judgedRoot);
  const drawn = sample(
    xdmDocument(grammar, new Set(["doctype", "entityRef"]), judgedRoot),
    stream,
    count,
  ).map(({ document }, at) => ({
    doc: toXmlDocument(document, documentNames),
    name: `drawn #${String(at)}`,
  }));
  const named = [...lawful, ...drawn];
  const swarms = sample(
    swarm(xsdOperators),
    rotatingSeed(stream, floorSeed("swarm")),
    named.length,
  );
  const seeds = named.map(({ doc }, at) => seedGenome(doc, swarms[at] ?? {}));

  return {
    names: new Map(seeds.map(({ seed }, at) => [seed, named[at]?.name ?? ""])),
    seeds,
  };
};

describe.skipIf(!cached)("genetic-xsd.oracle.test.ts", () => {
  layer(TestLayer, { excludeTestServices: true })("the grammar against xmllint, bred", (it) => {
    it.effect(
      "every lawful seed, every drawn seed of the floor stream and every kept document, in both versions, has one verdict from both but for the recorded classes, and every known disagreement still shows",
      () =>
        Effect.gen(function* replayAgainstXmllint() {
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const laws = lawsOf(grammar);
          const { names: seedNames, seeds } = seedsOf(
            grammar,
            floorSeed("pantry/genetic-xsd"),
            fixedDrawn,
          );
          const oracle = yield* writeXsdOracle(oracleRoot);
          const judge = (folder: string, genomes: readonly XsdGenome[]) =>
            judgeAll({
              folder: `${scratchRoot}/${folder}`,
              genomes,
              grammar,
              laws,
              oracle,
              versions: schemaVersions,
            });
          const seedJudgments = yield* judge("seeds", seeds);
          const kept = yield* keptGenomes;
          // The kept documents run last, so the counts that follow are theirs alone.
          knownCounts.clear();

          const keptJudgments = yield* judge("kept", kept);
          const reports: string[] = [
            ...(yield* Effect.forEach(
              seedJudgments.entries(),
              ([at, { disagreements }]) =>
                Effect.gen(function* seedReports() {
                  const genome = seeds[at];
                  if (genome === undefined || disagreements.length === 0) {
                    return [];
                  }

                  const text = yield* shown(genome);

                  return disagreements.map(
                    (disagreement) =>
                      `${seedNames.get(genome.seed) ?? "a seed"} ${shownOf(disagreement)}\n  document: ${text}`,
                  );
                }),
              { concurrency: 1 },
            )).flat(),
            ...keptJudgments.flatMap(({ disagreements }, at) =>
              disagreements.map(
                (disagreement) =>
                  `kept document "${keptDocuments[at]?.name ?? ""}" ${shownOf(disagreement)}`,
              ),
            ),
            ...knownDisagreements.flatMap((entry) =>
              (knownCounts.get(entry) ?? 0) === 0
                ? [
                    `known disagreement of ${entry.owner} is stale: no kept document shows it any more, so its fix has landed and the record goes (${entry.why})`,
                  ]
                : [],
            ),
          ];
          yield* Console.log(
            [
              `genetic-xsd replay: ${String(seeds.length)} seeds (${String(seeds.length - fixedDrawn)} lawful, ${String(fixedDrawn)} drawn of the floor stream) and ${String(kept.length)} kept documents, judged in ${schemaVersions.join(" and ")}`,
              `  recorded classes matched: ${[...matchedCounts].map(([reason, count]) => `${reason}… ${String(count)}`).join("; ")}`,
              ...reports,
            ].join("\n"),
          );

          assert.deepStrictEqual(
            reports,
            [],
            "both oracles judge every replayed document alike, but for the recorded classes",
          );
        }),
      { timeout: replayTimeoutMs },
    );

    it.effect.skipIf(!settings.geneticRequested)(
      "every bred document, in both versions, has one verdict from both but for the recorded classes",
      () =>
        Effect.gen(function* breedAgainstXmllint() {
          const grammar = yield* Effect.fromResult(composed()).pipe(Effect.orDie);
          const laws = lawsOf(grammar);
          const run = yield* runOfProcess;
          const stream = rotatingSeed(run.seed, floorSeed("pantry/genetic-xsd"));
          const { names: seedNames, seeds } = seedsOf(grammar, stream, budget.initial);
          const lawful = new Set(seeds.slice(0, seeds.length - budget.initial));
          const oracle = yield* writeXsdOracle(oracleRoot);
          const breeding: Breeding = {
            corpus: corpusFrom(
              grammar,
              seeds.map(({ genome }, at) => ({ genome, name: `seed#${String(at)}` })),
            ),
            grammar,
            lastEdit: new WeakMap(),
            rewards: new Map(),
            swarm: {},
          };
          let generation = 0;
          let disagreeing = 0;
          const lawfulVerdicts = new Map<string, number>();
          const started = Date.now();
          const judge = (
            genomes: readonly XsdGenome[],
            versions: readonly SchemaVersion[] = schemaVersions,
          ) => {
            generation += 1;

            return judgeAll({
              folder: `${scratchRoot}/g${String(generation)}`,
              genomes,
              grammar,
              laws,
              oracle,
              versions,
            }).pipe(
              Effect.tap((judgments) => {
                for (const [at, { features }] of judgments.entries()) {
                  const genome = genomes[at];
                  for (const feature of genome !== undefined && lawful.has(genome)
                    ? features
                    : []) {
                    if (feature.startsWith("verdict:")) {
                      lawfulVerdicts.set(feature, (lawfulVerdicts.get(feature) ?? 0) + 1);
                    }
                  }
                }

                disagreeing += judgments.filter(
                  ({ disagreements }) => disagreements.length > 0,
                ).length;

                return Console.log(
                  `genetic-xsd: round ${String(generation)}, ${String(genomes.length)} documents in ${versions.join(" and ")}, ${String(disagreeing)} disagreeing so far, ${String(Math.round((Date.now() - started) / 1000))} s`,
                );
              }),
            );
          };

          const evolved = yield* evolve(
            {
              familyOf: xsdFamilyOf,
              judge: (genomes) => judge(genomes),
              mutate: xsdMutationOf(breeding),
              seeds,
              signatureOf,
            },
            { ...budget, initial: seeds.length },
            stream,
          );

          const found = [...evolved.found];
          yield* Console.log(
            [
              `genetic-xsd: TEST_SEED=${String(run.seed)}, budget ${JSON.stringify(budget)} beside ${String(lawful.size)} lawful seeds, ${String(evolved.evaluated)} documents judged in ${schemaVersions.join(" and ")}, population ${String(evolved.population)}, ${String(evolved.features.size)} features, ${String(evolved.found.size)} disagreement classes`,
              `  lawful seeds' verdicts: ${[...lawfulVerdicts].map(([verdict, count]) => `${verdict.slice("verdict:".length)} ${String(count)}`).join("; ")}`,
              `  residual (Good–Turing f1/n) by family: ${evolved.residual.map(({ candidates, estimate, family, observed, singletons }) => `${family} ${String(singletons)}/${String(candidates)} = ${estimate.toFixed(3)} of ${String(observed)} seen`).join("; ")}`,
              `  recorded classes matched: ${[...matchedCounts].map(([reason, count]) => `${reason}… ${String(count)}`).join("; ")}`,
              ...found.map(([signature]) => `  class: ${signature.slice(0, 300)}`),
            ].join("\n"),
          );

          const reports: string[] = [];
          for (const [at, [signature, finding]] of found.entries()) {
            const { difference, version } = finding.disagreement;
            // Reduce while the test's budget allows, so every class is reported before its timeout.
            const reducing = at < reduction.findings && Date.now() - started < reduction.until;
            const reduced = yield* reduce(
              finding.genome,
              smallerXsd,
              (genomes) =>
                Effect.map(judge(genomes, [version]), (judgments) =>
                  judgments.map(({ disagreements }) =>
                    disagreements.some((held) => signatureOf(held) === signature),
                  ),
                ),
              reducing ? reduction.tries : 0,
              reduction.batch,
            );
            const report = [
              `${difference.direction} ${difference.class} ${difference.rule} in ${version}: ${difference.detail.slice(0, 600)}`,
              `  bred from ${seedNames.get(finding.genome.seed) ?? "a seed"} by: ${finding.lineage.join(" ; ") || "(no edit)"}`,
              `  ${reducing ? `reduced in ${String(reduced.tries)} tries` : "unreduced"} to: ${yield* shown(reduced.genome)}`,
            ].join("\n");
            reports.push(report);
            yield* Console.log(
              `genetic-xsd: finding ${String(at + 1)} of ${String(found.length)}\n${report}`,
            );
          }

          assert.deepStrictEqual(
            reports,
            [],
            "both oracles judge every bred document alike, but for the recorded classes",
          );
        }),
      { timeout: exploreTimeoutMs },
    );
  });
});

describe("genetic-xsd.oracle.test.ts, the records' readings", () => {
  layer(NodeServices.layer)("docs/spec-readings.md as it stands", (it) => {
    it.effect(
      "every record that cites a reading quotes a sentence the reading still says, so a withdrawn reading's record turns stale",
      () =>
        Effect.gen(function* recordsStillRead() {
          const readings = yield* liveReadings();
          const stale = everyRecord.flatMap(({ reason }) =>
            reason._tag === "reading" && !stillSays(readings, reason.reading, reason.says)
              ? [
                  `reading ${String(reason.reading)} no longer says "${reason.says}" (${reason.why})`,
                ]
              : [],
          );

          assert.deepStrictEqual(stale, [], "every record's reading still says what it cites");
        }),
    );
  });
});

describe("genetic-xsd.oracle.test.ts, reading 129's record", () => {
  unit(
    "holds for a language value RFC 5646 refuses, as each attribute and element reads it, and never for one it admits",
    () => {
      const record = everyRecord.find(
        ({ reason }) => reason._tag === "reading" && reason.reading === 129,
      );
      const matches = ([place, attribute, value]: readonly [string, string, string]): boolean =>
        record?.detail?.test(
          `value domain at /${place}: ${attribute}: "${value}" is outside qti-assessment-item@xml:lang (reading 129) (2), whose pattern is ^x$`,
        ) ?? false;
      // RFC 5646 section 2.1's Language-Tag, one of each production; the empty value where the
      // attribute admits it; and the nearest values the RFC or the reading refuses.
      const tags = [
        "en",
        "EN-us",
        "zh-Hant-TW",
        "sl-rozaj-biske",
        "de-CH-1901",
        "en-a-bbb-x-a-ccc",
        "x-whatever",
        "i-klingon",
        "zh-min-nan",
      ];
      const admitted: readonly (readonly [string, string, string])[] = [
        ...tags.flatMap((tag) => [
          ["qti-assessment-item", "xml:lang", tag] as const,
          ["p", "xml:lang", tag] as const,
          ["track", "srclang", tag] as const,
          ["p", "lang", tag] as const,
        ]),
        ["qti-assessment-stimulus", "xml:lang", " en "],
        ["p", "xml:lang", "\\ten"],
        ["p", "xml:lang", ""],
        ["p", "lang", ""],
      ];
      const refused: readonly (readonly [string, string, string])[] = [
        ...["e", "en_US", "en-", "-en", "abcdefghi", "en-x", "en--us", "i-unknown"].flatMap(
          (value) => [
            ["qti-assessment-item", "xml:lang", value] as const,
            ["p", "xml:lang", value] as const,
            ["track", "srclang", value] as const,
            ["p", "lang", value] as const,
          ],
        ),
        ["qti-assessment-item", "xml:lang", ""],
        ["qti-assessment-stimulus", "xml:lang", " "],
        ["track", "srclang", ""],
        ["track", "srclang", "en "],
        ["p", "lang", "en "],
      ];

      assert.deepStrictEqual(
        [...admitted.filter(matches), ...refused.filter((held) => !matches(held))],
        [],
        "the record matches exactly the values reading 129 refuses",
      );
    },
  );
});

/**
 * The libxml2 control's toy schema: an attribute group G of an `##other` lax wildcard, referenced
 * by a type of its own and, when `derived`, by a type that extends a base whose wildcard is
 * `##any`.
 *
 * @param derived - Whether the extending type references G too.
 * @returns The schema's text.
 */
const widenedSchema = (derived: boolean): string =>
  [
    '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:t" xmlns="urn:t" elementFormDefault="qualified">',
    '<xs:attributeGroup name="G"><xs:anyAttribute namespace="##other" processContents="lax"/></xs:attributeGroup>',
    '<xs:attributeGroup name="H"><xs:anyAttribute namespace="##any" processContents="lax"/></xs:attributeGroup>',
    '<xs:complexType name="Base"><xs:attributeGroup ref="H"/></xs:complexType>',
    ...(derived
      ? [
          '<xs:complexType name="Derived"><xs:complexContent><xs:extension base="Base"><xs:attributeGroup ref="G"/></xs:extension></xs:complexContent></xs:complexType>',
          '<xs:element name="derived" type="Derived"/>',
        ]
      : []),
    '<xs:complexType name="Plain"><xs:attributeGroup ref="G"/></xs:complexType>',
    '<xs:element name="plain" type="Plain"/>',
    "</xs:schema>",
  ].join("\n");

/**
 * The folder the libxml2 controls write their toy schemas to, the run's own.
 */
const controlRoot = fileScratchDirectory("genetic-xsd-control-");

/**
 * The padded-type control's toy schema: an element whose content is an `##other` lax wildcard.
 */
const laxSchema = [
  '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:t" xmlns="urn:t" elementFormDefault="qualified">',
  '<xs:element name="w"><xs:complexType><xs:sequence><xs:any namespace="##other" processContents="lax" minOccurs="0" maxOccurs="unbounded"/></xs:sequence></xs:complexType></xs:element>',
  "</xs:schema>",
].join("\n");

/**
 * The padded-type control's document: a foreign element in no namespace, inside a foreign element
 * the lax wildcard holds, naming a built-in type by `xsi:type` and holding a text it refuses.
 *
 * @param type - The `xsi:type` value, `xs:` bound to XML Schema's namespace.
 * @returns The document's text.
 */
const laxTyped = (type: string): string =>
  `<w xmlns="urn:t"><config xmlns="urn:w"><widget xmlns="" xmlns:zs="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" zs:type="${type}">a b</widget></config></w>`;

describe.skipIf(!cached)("genetic-xsd.oracle.test.ts, libxml2's padded xsi:type", () => {
  layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
    it.effect(
      "a built-in type named with a trailing space resolves to no type, so the text it refuses is never assessed, and named plain refuses it",
      () =>
        Effect.gen(function* paddedType() {
          const fs = yield* FileSystem.FileSystem;
          const types = ["xs:ENTITY", "xs:ENTITY ", "xs:NCName", "xs:NCName "];

          yield* fs.makeDirectory(controlRoot, { recursive: true });
          yield* fs.writeFileString(`${controlRoot}/lax.xsd`, laxSchema);
          yield* Effect.forEach(
            types,
            (type, at) =>
              fs.writeFileString(`${controlRoot}/typed${String(at)}.xml`, laxTyped(type)),
            { concurrency: 1 },
          );

          const verdicts = yield* xmllintValidate({
            paths: types.map((_, at) => `${controlRoot}/typed${String(at)}.xml`),
            schema: `${controlRoot}/lax.xsd`,
          });

          assert.deepStrictEqual(
            verdicts.map((verdict) =>
              verdict._tag === "Invalid"
                ? verdict.messages.map(({ text }) => {
                    if (
                      text.endsWith(
                        "of the xsi:type attribute does not resolve to a type definition.",
                      )
                    ) {
                      return "no type";
                    }

                    return text.includes("is not a valid value of the atomic type")
                      ? "text refused"
                      : text;
                  })
                : [],
            ),
            [["text refused"], ["no type"], ["text refused"], ["no type"]],
            "libxml2 resolves a padded xsi:type's QName uncollapsed, and so assesses the element by no type",
          );
        }),
      { timeout: testTimeoutMs },
    );
  });
});

describe.skipIf(!cached)("genetic-xsd.oracle.test.ts, libxml2's widened ##other", () => {
  layer(TestLayer, { excludeTestServices: true })("the control", (it) => {
    it.effect(
      "an attribute group's ##other admits an attribute in no namespace once a type extending an ##any base references the group, and not alone",
      () =>
        Effect.gen(function* widenedOther() {
          const fs = yield* FileSystem.FileSystem;

          yield* fs.makeDirectory(controlRoot, { recursive: true });
          yield* fs.writeFileString(`${controlRoot}/widened.xsd`, widenedSchema(true));
          yield* fs.writeFileString(`${controlRoot}/alone.xsd`, widenedSchema(false));
          yield* fs.writeFileString(`${controlRoot}/plain.xml`, '<plain xmlns="urn:t" zz="1"/>');

          const verdicts = yield* Effect.forEach(
            ["widened", "alone"],
            (name) =>
              xmllintValidate({
                paths: [`${controlRoot}/plain.xml`],
                schema: `${controlRoot}/${name}.xsd`,
              }),
            { concurrency: 1 },
          );

          assert.deepStrictEqual(
            verdicts.map((held) => held.map(({ _tag }) => _tag)),
            [["Valid"], ["Invalid"]],
            "libxml2 admits the no-namespace attribute only where a derived type shares the group",
          );
        }),
      { timeout: testTimeoutMs },
    );
  });
});
