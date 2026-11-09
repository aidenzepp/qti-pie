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
 * The known disagreements.
 */
const knownDisagreements: readonly Known[] = [
  {
    class: "content",
    detail:
      /^Foreign simple content at \/lom:lom\[\d+\]\/foreign-element\[\d+\]\/\S+: a foreign element governed by the simple type xs:\w+ holds an element child/u,
    direction: "oracle-only",
    owner: "GEN-B, fixing forward with a libxml2 record",
    why: "JAN's run (TEST_SEED=2990697775): under a LOM root's lax wildcard, an element whose xsi:type resolves to no type of the document's schema set is laxly assessed and its children in turn (reading 60), so a descendant whose xsi:type names xs:Name and that holds an element child is invalid; libxml2 2.9.13 skips the subtree of an element whose type is absent (xmlschemas.c xmlSchemaValidateElem: XML_SCHEMAV_CVC_TYPE_1, then skipDepth), so xmllint never sees it",
  },
  {
    class: "text-value",
    detail: /^TextDomain at \/lom:lom\[\d+\]\/foreign-element\[\d+\]\/\S+: .* is outside xs:\w+/su,
    direction: "oracle-only",
    owner: "GEN-B, fixing forward with a libxml2 record",
    why: "CRUST's run (TEST_SEED=2420825299): the same skip, below a foreign element whose xsi:type names no type at all; its no-namespace child's xsi:type names xs:unsignedShort, which its text is not",
  },
];

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
 * refuses (reading 60: the children are assessed laxly in turn) and libxml2 never assesses; each
 * shows a known disagreement until its libxml2 record lands.
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
 * The last three are drawn seeds of rotating streams, each reduced to its one difference. The empty
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
