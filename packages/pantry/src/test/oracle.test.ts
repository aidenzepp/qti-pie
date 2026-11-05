import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { inject } from "vitest";
import { composed } from "#pantry/grammar/compose.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedAttribute, FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import {
  contentLaws,
  documentBreaches,
  explain,
  facetsBroken,
  judge,
  lawNames,
  lawsOf,
  ruleOf,
  shownBreach,
  verdictOf,
} from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * The fixtures the global setup materializes; `simple` is one the importer accepts today.
 */
const fixtures = inject("fixtures");

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item and test element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write a manifest that lists its resources under one schema version.
 *
 * @param resources - The `resource` elements, as written.
 * @param version - The `schemaversion` it declares.
 * @returns The manifest's text.
 */
const manifestOf = (resources: string, version = "3.0.1"): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion></metadata>
  <organizations/>
  <resources>${resources}</resources>
</manifest>`;

/**
 * The one resource of the base package: the item `item.xml`.
 */
const itemResource = `<resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>`;

/**
 * The base item: one choice interaction bound to an identifier response, scored by matching it.
 */
const item = `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <p id="intro">Pick one.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * The base test: one part, one section selecting from its one item reference.
 */
const test = `<qti-assessment-test xmlns="${asi}" identifier="T" title="Test">
  <qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">
    <qti-assessment-section identifier="S" title="Section" visible="true">
      <qti-selection select="1"/>
      <qti-assessment-item-ref identifier="I" href="item.xml"/>
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`;

/**
 * Build a package from its files' texts, each encoded as UTF-8, as `readPackage` returns one.
 *
 * @param files - Each file's text by path; `imsmanifest.xml` is the manifest.
 * @returns The entries, sorted by path.
 */
const packageOf = (files: Readonly<Record<string, string>>): readonly PackageFile[] =>
  Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));

/**
 * The base package: the manifest and the base item.
 */
const base = { "imsmanifest.xml": manifestOf(itemResource), "item.xml": item };

/**
 * Judge a package built from its files' texts.
 *
 * @param files - Each file's text by path.
 * @returns The judgment.
 */
const judged = (files: Readonly<Record<string, string>>) => judge(packageOf(files), grammar, laws);

/**
 * Read the breaches of a judgment the codec did not refuse.
 *
 * @param judgment - The judgment.
 * @returns Its breaches.
 */
const breachesOf = (judgment: Judgment): readonly Breach[] =>
  judgment._tag === "Judged"
    ? judgment.breaches
    : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);

/**
 * Write a judgment's breaches as `law: rule` lines, for an assertion's message.
 *
 * @param breaches - The breaches.
 * @returns One line per breach.
 */
const shown = (breaches: readonly Breach[]): string =>
  breaches.map((breach) => shownBreach(breach, grammar)).join("\n");

/**
 * Replace one passage of a text, failing when the text does not hold it, so a case never tests an
 * edit that did not happen.
 *
 * @param text - The text.
 * @param passage - The passage to replace.
 * @param replacement - What replaces it.
 * @returns The edited text.
 */
const edit = (text: string, passage: string, replacement: string): string => {
  assert.include(text, passage, "the edit's passage is in the text");

  return text.replace(passage, replacement);
};

/**
 * Edit the base item.
 *
 * @param passage - The passage to replace.
 * @param replacement - What replaces it.
 * @returns The base package with the item edited.
 */
const withItem = (passage: string, replacement: string) => ({
  ...base,
  "item.xml": edit(item, passage, replacement),
});

/**
 * One package that breaks one law: the law it breaks and the rule that law keeps.
 */
interface LawCase {
  readonly files: Readonly<Record<string, string>>;
  readonly law: LawName;
  readonly name: string;
  readonly rule: OracleRule;
}

/**
 * The packages that break each law the oracle reads from documents, one case per law.
 */
const lawCases: readonly LawCase[] = [
  {
    files: {
      ...base,
      "item.xml": edit(
        edit(
          item,
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
          "",
        ),
        "<qti-response-processing>",
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-response-processing>`,
      ),
    },
    law: "N5 Follow",
    name: "an outcome declaration after the item body",
    rule: "ordering",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<qti-hottext-interaction response-identifier="RESPONSE"><p>Type <qti-text-entry-interaction response-identifier="RESPONSE"/></p></qti-hottext-interaction>`,
    ),
    law: "N6 ancestry",
    name: "a text entry inside a hottext interaction",
    rule: "ancestry-ban",
  },
  {
    files: withItem(
      `<qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>`,
      "",
    ),
    law: "N7 Last",
    name: "a choice interaction without a choice",
    rule: "child-set",
  },
  {
    files: withItem(
      `<qti-correct-response><qti-value>A</qti-value></qti-correct-response>`,
      `<qti-correct-response><qti-value>A</qti-value></qti-correct-response><qti-correct-response><qti-value>B</qti-value></qti-correct-response>`,
    ),
    law: "N5 Follow",
    name: "a response declaration with two correct responses",
    rule: "ordering",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p><qti-match-interaction response-identifier="RESPONSE" max-associations="1"><qti-simple-match-set><qti-simple-associable-choice identifier="M" match-max="1">M</qti-simple-associable-choice></qti-simple-match-set></qti-match-interaction>`,
    ),
    law: "N7 Counted",
    name: "a match interaction with one match set",
    rule: "child-set",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p><table><colgroup span="2"><col/></colgroup><tr><td>x</td></tr></table>`,
    ),
    law: "N7 barred by",
    name: "a column group with a span and a column",
    rule: "child-set",
  },
  {
    files: withItem(
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      `<qti-outcome-declaration identifier="SCORE" base-type="float"/>`,
    ),
    law: "AL3 required",
    name: "an outcome declaration without a cardinality",
    rule: "required-attribute",
  },
  {
    files: withItem(`max-choices="1"`, `max-choices="one"`),
    law: "value domain",
    name: "a count that is no integer",
    rule: "attribute-lexical",
  },
  {
    files: withItem(`<p id="intro">`, `<p id="intro" aria-labelledby="nowhere">`),
    law: "Idref target",
    name: "an IDREF naming no id",
    rule: "idref-target",
  },
];

/**
 * The packages that break each overlay and package law, one case per law.
 */
const overlayCases: readonly LawCase[] = [
  {
    files: withItem(
      `<qti-simple-choice identifier="B">B</qti-simple-choice>`,
      `<qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction><p id="intro">Twice.</p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="C">C</qti-simple-choice>`,
    ),
    law: "DocumentId key",
    name: "two elements with one id",
    rule: "document-key",
  },
  {
    files: withItem(
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
    ),
    law: "Declaration key",
    name: "two declarations of one variable",
    rule: "declaration-key",
  },
  {
    files: withItem(
      `response-identifier="RESPONSE" max-choices="1"`,
      `response-identifier="NOWHERE" max-choices="1"`,
    ),
    law: "Binding declared",
    name: "an interaction bound to no response",
    rule: "binding-declared",
  },
  {
    files: withItem(
      `cardinality="single" base-type="identifier"`,
      `cardinality="single" base-type="float"`,
    ),
    law: "BindingFit",
    name: "a choice interaction bound to a float",
    rule: "binding-fit",
  },
  {
    files: withItem(`max-choices="1"`, `max-choices="1" min-choices="2"`),
    law: "Choice bounds",
    name: "a minimum above the maximum",
    rule: "choice-bounds",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick <qti-feedback-inline outcome-identifier="NOWHERE" identifier="F" show-hide="show">well</qti-feedback-inline>.</p>`,
    ),
    law: "Feedback reference",
    name: "feedback naming no outcome",
    rule: "feedback-ref",
  },
  {
    files: withItem(
      `<qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/>`,
      `<qti-variable identifier="RESPONSE"/>`,
    ),
    law: "Arity",
    name: "a match of one operand",
    rule: "P2",
  },
  {
    files: withItem(`<qti-correct identifier="RESPONSE"/>`, `<qti-correct identifier="NOWHERE"/>`),
    law: "Variable declared",
    name: "processing naming no variable",
    rule: "P8",
  },
  {
    files: withItem(
      `base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>`,
      `base-type="file">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response><qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>`,
    ),
    law: "MappableBaseType",
    name: "a mapping of files",
    rule: "mapping-base-type",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(
        edit(itemResource, `type="imsqti_item_xmlv3p0"`, `type="imsqti_item_xmlv9"`),
      ),
    },
    law: "ResourceTypeOf",
    name: "a resource type no version admits",
    rule: "resource-type",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(
        edit(itemResource, `type="imsqti_item_xmlv3p0"`, `type="imsqti_test_xmlv3p0"`),
      ),
    },
    law: "RootOfType",
    name: "an item listed as a test",
    rule: "root-type-reverse",
  },
  {
    files: { ...base, "notes.txt": "unlisted" },
    law: "File listed",
    name: "an entry no file lists",
    rule: "file-listed",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(edit(itemResource, `<file href="item.xml"/>`, "")),
    },
    law: "Href listed",
    name: "a resource href none of its files lists",
    rule: "href-listed",
  },
  {
    files: {
      "imsmanifest.xml": manifestOf(itemResource),
    },
    law: "Document entry",
    name: "a listed document that is no entry",
    rule: "entry-kind",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(edit(itemResource, `identifier="R"`, `identifier="M"`)),
    },
    law: "Manifest id space",
    name: "a resource named as its manifest",
    rule: "manifest-id-space",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(
        edit(
          itemResource,
          `<file href="item.xml"/>`,
          `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><identifier><catalog>c</catalog><entry>other</entry></identifier></general></lom></metadata><file href="item.xml"/>`,
        ),
      ),
    },
    law: "LomObjectIdentifier",
    name: "a record naming another item",
    rule: "lom-identifier",
  },
  {
    files: {
      "imsmanifest.xml": manifestOf(
        `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
      ),
      "item.xml": item,
      "test.xml": edit(test, `select="1"`, `select="3"`),
    },
    law: "Selection bound",
    name: "a section selecting more than it holds",
    rule: "selection-bound",
  },
];

describe("the base packages", () => {
  it.effect("an item and its manifest break no law", () =>
    Effect.gen(function* baseItem() {
      const judgment = yield* judged(base);
      const breaches = breachesOf(judgment);

      assert.deepStrictEqual(breaches, [], shown(breaches));
      assert.deepStrictEqual(judgment._tag === "Judged" ? judgment.documents : [], [
        "imsmanifest.xml",
        "item.xml",
      ]);
    }),
  );

  it.effect("a test, its item and their manifest break no law", () =>
    Effect.gen(function* baseTest() {
      const breaches = breachesOf(
        yield* judged({
          "imsmanifest.xml": manifestOf(
            `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
          ),
          "item.xml": item,
          "test.xml": test,
        }),
      );

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }),
  );
});

/**
 * Replace the base item's choice interaction with a hotspot interaction over an image.
 *
 * @param choices - The interaction's hotspot choices, as written.
 * @returns The base package with the item edited.
 */
const hotspots = (choices: string) =>
  withItem(
    `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`,
    `<qti-hotspot-interaction response-identifier="RESPONSE" max-choices="1"><object data="a.png" type="image/png"/>${choices}</qti-hotspot-interaction>`,
  );

describe("each law, on a package that breaks it", () => {
  for (const { files, law, name, rule } of [...lawCases, ...overlayCases]) {
    it.effect(`${law} refuses ${name} under ${rule}`, () =>
      Effect.gen(function* breaks() {
        const breaches = breachesOf(yield* judged(files));

        assert.isTrue(
          breaches.some((breach) => breach.law === law && ruleOf(breach.law) === rule),
          shown(breaches),
        );
      }),
    );
  }

  it.effect(
    "two data-* names on a kind that admits the class break no law: AL1 admits the class, and AL2 masks it",
    () =>
      Effect.gen(function* openMask() {
        const breaches = breachesOf(
          yield* judged(withItem(`<p id="intro">`, `<p id="intro" data-a="1" data-b="2">`)),
        );

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
  );

  it.effect("the default hotspot law reads the last slot as stated, whitespace included", () =>
    Effect.gen(function* defaultHotspot() {
      const last = breachesOf(
        yield* judged(
          hotspots(
            `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default"/>`,
          ),
        ),
      );
      const spaced = breachesOf(
        yield* judged(
          hotspots(
            `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default"/>\n`,
          ),
        ),
      );
      const first = breachesOf(
        yield* judged(
          hotspots(
            `<qti-hotspot-choice identifier="B" shape="default"/><qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/>`,
          ),
        ),
      );

      assert.isFalse(
        last.some(({ law }) => law === "default hotspot last slot"),
        shown(last),
      );
      assert.isTrue(
        spaced.some(({ law }) => law === "default hotspot last slot"),
        shown(spaced),
      );
      assert.isTrue(
        first.some(
          ({ law }) => law === "default hotspot last slot" && ruleOf(law) === "hotspot-default",
        ),
        shown(first),
      );
    }),
  );
});

describe("open names and attribute entity references", () => {
  it.effect("two data-* names and an entity reference in an attribute value break no law", () =>
    Effect.gen(function* openRows() {
      const files = withItem(`<p id="intro">`, `<p id="intro" data-a="1" data-b="&org;">`);
      const judgment = yield* judged({
        ...files,
        "item.xml": `<!DOCTYPE qti-assessment-item SYSTEM "qti.dtd">\n${files["item.xml"]}`,
      });
      const breaches = breachesOf(judgment);
      const xml = yield* Effect.orDie(
        readXml(
          new TextEncoder().encode(
            `<!DOCTYPE p SYSTEM "qti.dtd"><p xmlns="${asi}" data-b="&org;"/>`,
          ),
        ),
      );

      assert.deepStrictEqual(breaches, [], shown(breaches));
      assert.isTrue(
        xml.root.attributes.some(({ references }) => references.length > 0),
        "crust keeps an undeclared reference unexpanded, so the item holds an AttributeEntity row",
      );
    }),
  );
});

/**
 * Shred, fold and judge one document under 3.0.0, as the oracle judges a document its package
 * lists, without the manifest's version decode.
 *
 * @param text - The document's text.
 * @returns The laws its rows break, once each.
 */
const documentLaws = (text: string) =>
  Effect.gen(function* judgedDocument() {
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
    const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));
    const rows = yield* Effect.orDie(
      Effect.fromResult(
        fold(
          tree,
          (index): NodeId => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
          foldGrammarOf(grammar),
        ),
      ),
    );

    return [...new Set(documentBreaches("imsmanifest.xml", rows, laws).map(({ law }) => law))];
  });

/**
 * A manifest whose `schemaversion` is written as given.
 *
 * @param schemaversion - The element as written.
 * @returns The manifest's text.
 */
const versionedManifest = (schemaversion: string): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="m"><metadata><schema>QTI Package</schema>${schemaversion}</metadata><organizations/><resources/></manifest>`;

describe("TextDomain, on each simple-content element's string value", () => {
  it.effect("an empty or blank schemaversion breaks its domain, and 3.0.0 does not", () =>
    Effect.gen(function* schemaversion() {
      assert.include(yield* documentLaws(versionedManifest("<schemaversion/>")), "TextDomain");
      assert.include(
        yield* documentLaws(versionedManifest("<schemaversion>   </schemaversion>")),
        "TextDomain",
      );
      assert.notInclude(
        yield* documentLaws(versionedManifest("<schemaversion>3.0.0</schemaversion>")),
        "TextDomain",
      );
    }),
  );

  it.effect("an empty drd:hazard breaks its union domain", () =>
    Effect.gen(function* hazard() {
      const breaches = breachesOf(
        yield* judged({
          ...base,
          "imsmanifest.xml": manifestOf(
            edit(
              itemResource,
              `<file href="item.xml"/>`,
              `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><hazard xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0"/></general></lom></metadata><file href="item.xml"/>`,
            ),
          ),
        }),
      );

      assert.isTrue(
        breaches.some(({ keys, law }) => law === "TextDomain" && keys["kind"] === "drd:hazard"),
        shown(breaches),
      );
    }),
  );
});

/**
 * The base package, its item resource carrying a LOM record whose general identifier entry is as
 * given.
 *
 * @param entry - The entry's text.
 * @returns The package's files.
 */
const itemRecord = (entry: string) => ({
  ...base,
  "imsmanifest.xml": manifestOf(
    edit(
      itemResource,
      `<file href="item.xml"/>`,
      `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><identifier><catalog>c</catalog><entry>${entry}</entry></identifier></general></lom></metadata><file href="item.xml"/>`,
    ),
  ),
});

/**
 * A package of the base item and test, the test resource carrying a LOM record whose general
 * identifier entry is as given.
 *
 * @param entry - The entry's text.
 * @returns The package's files.
 */
const testRecordOf = (entry: string) => ({
  "imsmanifest.xml": manifestOf(
    `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><identifier><catalog>c</catalog><entry>${entry}</entry></identifier></general></lom></metadata><file href="test.xml"/></resource>`,
  ),
  "item.xml": item,
  "test.xml": test,
});

describe("the LOM record of a test", () => {
  it.effect(
    "names the test document: a matching entry breaks no law, another entry breaks it",
    () =>
      Effect.gen(function* testRecord() {
        const named = breachesOf(yield* judged(testRecordOf(" T ")));
        const other = breachesOf(yield* judged(testRecordOf("other")));

        assert.deepStrictEqual(named, [], shown(named));
        assert.isTrue(
          other.some(({ law }) => law === "LomObjectIdentifier"),
          shown(other),
        );
      }),
  );
});

describe("the LOM record of an item", () => {
  it.effect("an entry that names the item with whitespace around it names it", () =>
    Effect.gen(function* padded() {
      const named = breachesOf(yield* judged(itemRecord("\n    item\n  ")));
      const other = breachesOf(yield* judged(itemRecord("\n    other\n  ")));

      assert.deepStrictEqual(named, [], shown(named));
      assert.isTrue(
        other.some(({ law }) => law === "LomObjectIdentifier"),
        shown(other),
      );
    }),
  );
});

describe("the codec's refusals", () => {
  it.effect("a manifest of another schema version is not-qti3", () =>
    Effect.gen(function* notQti3() {
      const judgment = yield* judged({
        ...base,
        "imsmanifest.xml": manifestOf(itemResource, "2.2"),
      });

      assert.deepStrictEqual(verdictOf(judgment), { rule: "not-qti3", verdict: "refused" });
    }),
  );

  it.effect(
    "a choice outside its interaction is unmodeled-vocabulary: its parent admits no foreign element in its namespace",
    () =>
      Effect.gen(function* outside() {
        const judgment = yield* judged(
          withItem(
            "<qti-item-body>",
            '<qti-item-body><qti-simple-choice identifier="X">X</qti-simple-choice>',
          ),
        );

        assert.deepStrictEqual(verdictOf(judgment), {
          rule: "unmodeled-vocabulary",
          verdict: "refused",
        });
      }),
  );

  it.effect("an element no vocabulary names is unmodeled-vocabulary", () =>
    Effect.gen(function* unmodeled() {
      const judgment = yield* judged(withItem("<qti-item-body>", "<qti-item-body><nowhere/>"));

      assert.deepStrictEqual(verdictOf(judgment), {
        rule: "unmodeled-vocabulary",
        verdict: "refused",
      });
    }),
  );

  it.effect(
    "a data-* name on a kind whose type admits no undeclared attribute is attribute-admission, before any row exists",
    () =>
      Effect.gen(function* closedKind() {
        const judgment = yield* judged(
          withItem(
            `<qti-outcome-declaration identifier="SCORE"`,
            `<qti-outcome-declaration data-a="1" identifier="SCORE"`,
          ),
        );

        assert.strictEqual(judgment._tag, "CodecRefusal");
        assert.deepStrictEqual(verdictOf(judgment), {
          rule: "attribute-admission",
          verdict: "refused",
        });
      }),
  );

  it.effect("a document that is not well-formed is well-formedness", () =>
    Effect.gen(function* malformed() {
      const judgment = yield* judged({ ...base, "item.xml": "<qti-assessment-item>" });

      assert.deepStrictEqual(verdictOf(judgment), { rule: "well-formedness", verdict: "refused" });
    }),
  );
});

describe("the content references", () => {
  it("every attribute ContentReference reads names the rule its refusal keeps", () => {
    const unruled = [
      ...new Set(
        grammar.references.contentReference.rows
          .filter(({ attribute }) => !contentLaws.has(attribute))
          .map(({ attribute, kind }) => `${kind}@${attribute}`),
      ),
    ];

    assert.isAbove(grammar.references.contentReference.rows.length, 0, "the relation has rows");
    assert.deepStrictEqual(unruled, []);
  });
});

/**
 * A double domain bounded by one residual facet at 1.0, every form matching its pattern.
 *
 * @param facet - The facet.
 * @returns The domain.
 */
const bounded = (facet: "maxExclusive" | "maxInclusive" | "minExclusive" | "minInclusive") => ({
  facets: [{ facet, value: "1.0" }],
  handle: facet,
  identity: Option.none(),
  pattern: "^.*$",
  primitive: "double" as const,
});

/**
 * Decide whether some breach is a value-domain breach whose explanation names a facet.
 *
 * @param breaches - The breaches.
 * @param name - The facet's name.
 * @returns Whether one is.
 */
const facet = (breaches: readonly Breach[], name: string): boolean =>
  breaches.some(
    ({ keys, law }) =>
      law === "value domain" &&
      ruleOf(law) === "attribute-lexical" &&
      explain(law, keys, grammar).includes(name),
  );

/**
 * Decide whether a form breaks a one-facet double domain's bound.
 *
 * @param bound - The facet.
 * @param form - The lexical form.
 * @returns Whether the form's value lies outside it.
 */
const boundBroken = (
  bound: "maxExclusive" | "maxInclusive" | "minExclusive" | "minInclusive",
  form: string,
): boolean => facetsBroken(bounded(bound), form).length > 0;

describe("the residual facets of a value domain", () => {
  it("each bound kind refuses the values outside it, and NaN fails every bound", () => {
    assert.deepStrictEqual(
      ["0", "1", "1E0", " 2 ", "INF", "-INF", "NaN"].map((form) => [
        boundBroken("minInclusive", form),
        boundBroken("minExclusive", form),
        boundBroken("maxInclusive", form),
        boundBroken("maxExclusive", form),
      ]),
      [
        [true, true, false, false],
        [false, true, false, true],
        [false, true, false, true],
        [false, false, true, true],
        [false, false, true, true],
        [true, true, false, false],
        [true, true, true, true],
      ],
    );
  });

  it.effect("a double below its minInclusive or at its minExclusive breaks its value domain", () =>
    Effect.gen(function* doubles() {
      const minInclusive = breachesOf(
        yield* judged(
          withItem(
            `<p id="intro">Pick one.</p>`,
            `<p id="intro">Pick one.</p><qti-slider-interaction response-identifier="RESPONSE" lower-bound="-1" upper-bound="10"/>`,
          ),
        ),
      );
      const minExclusive = breachesOf(
        yield* judged(
          withItem(
            `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
            `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="0"/>`,
          ),
        ),
      );
      assert.isTrue(facet(minInclusive, "minInclusive"), shown(minInclusive));
      assert.isTrue(facet(minExclusive, "minExclusive"), shown(minExclusive));
    }),
  );
});

describe("explain", () => {
  it("is total over every law: each names its rule and explains a breach with no keys", () => {
    for (const law of lawNames) {
      assert.isString(ruleOf(law), law);
      assert.isString(explain(law, {}, grammar), law);
    }

    assert.strictEqual(new Set(lawNames).size, lawNames.length, "each law is named once");
  });

  it.effect("a Follow breach lists what its parent's content model admits next", () =>
    Effect.gen(function* follow() {
      const breaches = breachesOf(
        yield* judged(
          withItem(
            `<qti-correct-response><qti-value>A</qti-value></qti-correct-response>`,
            `<qti-correct-response><qti-value>A</qti-value></qti-correct-response><qti-correct-response><qti-value>B</qti-value></qti-correct-response>`,
          ),
        ),
      );
      const found = breaches.find(({ law }) => law === "N5 Follow");

      assert.isDefined(found, shown(breaches));
      assert.include(
        found === undefined ? "" : explain(found.law, found.keys, grammar),
        "qti-mapping",
        "the declaration's model admits a mapping after its correct response",
      );
    }),
  );
});

describe("verdictOf", () => {
  it("accepts a package no law refuses, and names the first breach's rule otherwise", () => {
    const breach: Breach = { document: "", keys: {}, law: "N5 Follow" };

    assert.deepStrictEqual(verdictOf({ _tag: "Judged", breaches: [], documents: [] }), {
      verdict: "accepted",
    });
    assert.deepStrictEqual(
      verdictOf({
        _tag: "Judged",
        breaches: [breach, { ...breach, law: "N5 admitted" }],
        documents: [],
      }),
      { rule: "ordering", verdict: "refused" },
    );
  });
});

/**
 * Shred and fold the base item, as the oracle does.
 *
 * @returns Its folded rows.
 */
const foldedItem = Effect.gen(function* foldedItem() {
  const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(item)));
  const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));

  return yield* Effect.orDie(
    Effect.fromResult(
      fold(
        tree,
        (index): NodeId => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
        foldGrammarOf(grammar),
      ),
    ),
  );
});

/**
 * Replace the node rows that a test tampers with, keeping every other row.
 *
 * @param rows - The folded rows.
 * @param change - The replacement of a node row, or the row itself to keep it.
 * @returns The rows with the node rows changed.
 */
const tamperNodes = (
  rows: FoldedRows<Composed>,
  change: (node: FoldedNode<Composed>, index: number) => FoldedNode<Composed>,
): FoldedRows<Composed> => ({ ...rows, nodes: rows.nodes.map(change) });

/**
 * Replace the attribute rows that a test tampers with, keeping every other row.
 *
 * @param rows - The folded rows.
 * @param change - The replacement of an attribute row, or the row itself to keep it.
 * @returns The rows with the attribute rows changed.
 */
const tamperAttributes = (
  rows: FoldedRows<Composed>,
  change: (attribute: FoldedAttribute<Composed>, index: number) => FoldedAttribute<Composed>,
): FoldedRows<Composed> => ({ ...rows, attributes: rows.attributes.map(change) });

/**
 * Name the laws a document's rows break.
 *
 * @param rows - The rows.
 * @returns The laws, once each.
 */
const lawsBroken = (rows: FoldedRows<Composed>): readonly string[] => [
  ...new Set(documentBreaches("item.xml", rows, laws).map(({ law }) => law)),
];

/**
 * Decide whether an attribute row is the base item's response declaration's `identifier`, the row
 * the AL1 mutations rewrite.
 *
 * @param attribute - The row.
 * @returns Whether it is that row.
 */
const declared = (attribute: FoldedAttribute<Composed>): boolean =>
  attribute.kind === "qti-response-declaration" && attribute.name === "identifier";

/**
 * Move a node row under another, at the slot after the other's last child.
 *
 * @param node - The node row.
 * @param parent - Its new parent's row.
 * @returns The node row with its parent and slot changed.
 */
const under = (node: FoldedNode<Composed>, parent: FoldedNode<Composed>): FoldedNode<Composed> => ({
  ...node,
  at: parent.children,
  parent: parent.id,
});

/**
 * Decide whether a node row is a child of its document node.
 *
 * @param rows - The document's rows.
 * @param node - The node row.
 * @returns Whether its parent is the document node.
 */
const topLevel = (rows: FoldedRows<Composed>, node: FoldedNode<Composed>): boolean =>
  node.start > 0n && node.parent === rows.document.node;

/**
 * Change one node row of a document, the first that a test selects.
 *
 * @param rows - The rows.
 * @param select - Whether a row is the one to change.
 * @param change - Its replacement.
 * @returns The rows with that row changed.
 */
const tamperFirst = (
  rows: FoldedRows<Composed>,
  select: (node: FoldedNode<Composed>) => boolean,
  change: (node: FoldedNode<Composed>) => FoldedNode<Composed>,
): FoldedRows<Composed> => {
  const target = rows.nodes.find(select);

  return tamperNodes(rows, (node) => (node === target ? change(node) : node));
};

/**
 * Whether a node row is a leaf below the document node.
 *
 * @param node - The row.
 * @returns Whether it has no children.
 */
const leaf = (node: FoldedNode<Composed>): boolean => node.start > 0n && node.children === 0n;

/**
 * Whether a node row is a later sibling below the document node.
 *
 * @param node - The row.
 * @returns Whether it has a predecessor.
 */
const later = (node: FoldedNode<Composed>): boolean => node.start > 0n && node.at > 0n;

/**
 * Whether a node row is a parent below the document node.
 *
 * @param node - The row.
 * @returns Whether it has children.
 */
const parentOf = (node: FoldedNode<Composed>): boolean => node.children > 0n && node.start > 0n;

/**
 * The URIs a namespace class is judged against an ASI parent or element: none, the ASI namespace
 * itself, and another.
 */
const uris = ["", asi, "urn:other"] as const;

describe("the foreign namespace classes, every class against every URI", () => {
  it.effect("a foreign element's class breaks its law exactly off the diagonal", () =>
    Effect.gen(function* elementClass() {
      const rows = yield* foldedItem;
      const target = rows.nodes.find((node) => node.kind === "p");
      const kinds = ["no-namespace-element", "own-namespace-element", "foreign-element"] as const;

      assert.isDefined(target, "the item holds a p under its body");
      for (const [row, kind] of kinds.entries()) {
        for (const [column, uri] of uris.entries()) {
          const tampered: FoldedRows<Composed> = {
            ...tamperNodes(rows, (node) => (node === target ? { ...node, kind } : node)),
            openElementNames: [
              ...rows.openElementNames,
              { local: "x", namespace: uri, node: target?.id ?? rows.document.node },
            ],
          };

          assert.strictEqual(
            lawsBroken(tampered).includes("Foreign element class"),
            row !== column,
            `${kind} with the namespace ${JSON.stringify(uri)}`,
          );
        }
      }
    }),
  );

  it.effect("an open attribute's class breaks its law exactly off the diagonal", () =>
    Effect.gen(function* attributeClass() {
      const rows = yield* foldedItem;
      const target = rows.attributes.find(
        (attribute) => attribute.kind === "qti-assessment-item" && attribute.name === "title",
      );
      const classes = ["no-namespace", "own-namespace", "foreign"] as const;

      assert.isDefined(target, "the item carries a title");
      for (const [row, name] of classes.entries()) {
        for (const [column, uri] of uris.entries()) {
          const tampered: FoldedRows<Composed> = {
            ...tamperAttributes(rows, (attribute) =>
              attribute === target ? { ...attribute, name } : attribute,
            ),
            openNames: [
              ...rows.openNames,
              {
                attribute: target?.id ?? rows.document.node,
                local: "a",
                prefix: uri === "" ? "" : "p",
                uri,
              },
            ],
          };

          assert.strictEqual(
            lawsBroken(tampered).includes("Foreign attribute class"),
            row !== column,
            `${name} with the namespace ${JSON.stringify(uri)}`,
          );
        }
      }
    }),
  );
});

describe("the tree laws, on the named corruptions of trees.md §7", () => {
  it.effect("each corruption is refused by the law its variant names, and the tree by none", () =>
    Effect.gen(function* corruptions() {
      const rows = yield* foldedItem;
      const startOf = rows.nodes.find(later)?.start ?? 0n;
      const named = {
        childOutsideParent: tamperFirst(rows, parentOf, (node) => ({
          ...node,
          end: node.end + 1n,
        })),
        gapBetweenSiblings: tamperFirst(rows, later, (node) => ({
          ...node,
          start: node.start + 1n,
        })),
        overlappingSiblings: tamperFirst(rows, later, (node) => ({
          ...node,
          start: node.start - 1n,
        })),
        secondRoot: tamperFirst(rows, later, (node) => ({ ...node, parent: node.id })),
        startTaken: tamperFirst(
          rows,
          (node) => node.start > startOf,
          (node) => ({ ...node, start: startOf }),
        ),
        wrongSize: tamperFirst(rows, leaf, (node) => ({ ...node, end: node.end + 1n })),
      };

      for (const law of [
        "T1 document order",
        "T2 root",
        "T3 first child",
        "T4 next sibling",
        "T5 last child",
        "T6 non-empty and leaf",
      ]) {
        assert.notInclude(lawsBroken(rows), law, "the folded tree breaks no tree law");
      }

      assert.include(lawsBroken(named.childOutsideParent), "T5 last child", "childOutsideParent");
      assert.include(lawsBroken(named.gapBetweenSiblings), "T4 next sibling", "gapBetweenSiblings");
      assert.include(
        lawsBroken(named.overlappingSiblings),
        "T4 next sibling",
        "overlappingSiblings",
      );
      assert.include(lawsBroken(named.secondRoot), "T2 root", "secondRoot");
      assert.include(lawsBroken(named.startTaken), "T1 document order", "startTaken");
      assert.include(lawsBroken(named.wrongSize), "T6 non-empty and leaf", "wrongSize");
    }),
  );
});

describe("the fold laws, on rows the folds did not write", () => {
  it.effect("the base item's folded rows break no law", () =>
    Effect.gen(function* untouched() {
      const rows = yield* foldedItem;

      assert.deepStrictEqual(lawsBroken(rows), []);
    }),
  );

  it.effect(
    "N1: the document node's parentAncestry is empty and its nearestKind its own kind",
    () =>
      Effect.gen(function* sentinel() {
        const rows = yield* foldedItem;
        const flagged = tamperNodes(rows, (node) =>
          node.start === 0n ? { ...node, parentAncestry: new Set(["int"]) } : node,
        );
        const misnamed = tamperNodes(rows, (node) =>
          node.start === 0n ? { ...node, nearestKind: "qti-assessment-item" } : node,
        );
        const moved = tamperNodes(rows, (node) => (node.start === 0n ? { ...node, at: 1n } : node));

        assert.include(lawsBroken(flagged), "N1 sentinel");
        assert.include(lawsBroken(misnamed), "N1 sentinel");
        assert.include(lawsBroken(moved), "N1 sentinel", "the document node sits at slot 0");
      }),
  );

  it.effect("the Node key: a second row with one id is refused, and distinct ids are not", () =>
    Effect.gen(function* nodeKey() {
      const rows = yield* foldedItem;
      const [, second] = rows.nodes;
      const twice = tamperNodes(rows, (node, index) =>
        second !== undefined && index === 2 ? { ...node, id: second.id } : node,
      );

      assert.isDefined(second, "the item has a second node");
      assert.notInclude(lawsBroken(rows), "Node key");
      assert.include(lawsBroken(twice), "Node key");
    }),
  );

  it.effect(
    "T3: a two-node cycle of parent links ends, breaking the first-child law and its new parents' mirrors",
    () =>
      Effect.gen(function* cycle() {
        const rows = yield* foldedItem;
        const [a, b] = rows.nodes.filter(
          (node) => !topLevel(rows, node) && node.start > 0n && laws.elements.has(node.kind),
        );
        const tampered = tamperNodes(rows, (node) => {
          if (a !== undefined && b !== undefined && node.id === a.id) {
            return under(node, b);
          }

          return a !== undefined && b !== undefined && node.id === b.id ? under(node, a) : node;
        });
        const broken = lawsBroken(tampered);

        assert.isDefined(b, "the item has two elements below its root");
        assert.include(broken, "T3 first child");
        assert.include(broken, "N2 mirrors", "each sits past its new parent's last slot");
      }),
  );

  it.effect("T3: a copy of the parent's kind that is not the parent's", () =>
    Effect.gen(function* rank() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node, index) =>
        index === 2 ? { ...node, parentKind: "qti-item-body" } : node,
      );

      assert.include(lawsBroken(tampered), "T3 first child");
    }),
  );

  it.effect("every fold's first slot is its monoid's identity", () =>
    Effect.gen(function* identity() {
      const rows = yield* foldedItem;
      const first = (change: (node: FoldedNode<Composed>) => FoldedNode<Composed>) =>
        lawsBroken(tamperNodes(rows, (node) => (topLevel(rows, node) ? change(node) : node)));
      const attrs = tamperAttributes(rows, (attribute) =>
        attribute.at === 0n ? { ...attribute, attrsWas: new Set([0]) } : attribute,
      );

      assert.include(
        first((node) => ({ ...node, was: 1 })),
        "N5 first slot",
        "was",
      );
      assert.include(
        first((node) => ({ ...node, elementsWas: 1n })),
        "N5 first slot",
        "elementsWas",
      );
      assert.include(lawsBroken(attrs), "N5 first slot", "attrsWas");
      assert.include(lawsBroken(attrs), "AL2 fold");
    }),
  );

  it.effect("E1: a string value that is not its children's characters", () =>
    Effect.gen(function* stringValue() {
      const rows = yield* foldedItem;
      const tampered = tamperFirst(
        rows,
        (node) => node.stringValue !== "",
        (node) => ({ ...node, stringValue: `${node.stringValue}x` }),
      );

      assert.notInclude(lawsBroken(rows), "E1 derived");
      assert.include(lawsBroken(tampered), "E1 derived");
    }),
  );

  it.effect("N5: a child its parent does not admit", () =>
    Effect.gen(function* unadmitted() {
      const rows = yield* foldedItem;
      const tampered = tamperFirst(
        rows,
        (node) => node.kind === "p",
        (node) => ({ ...node, kind: "qti-simple-choice" }),
      );

      assert.include(lawsBroken(tampered), "N5 admitted");
    }),
  );

  it.effect("N5: a copy of the predecessor's state that is not its state", () =>
    Effect.gen(function* predecessor() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node) =>
        node.at === 1n &&
        rows.nodes.some((parent) => parent.id === node.parent && topLevel(rows, parent))
          ? { ...node, was: 9 }
          : node,
      );

      assert.include(lawsBroken(tampered), "N5 fold");
    }),
  );

  it.effect("N7: an end value that is not the last child's fold", () =>
    Effect.gen(function* lastSlot() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node) =>
        topLevel(rows, node) ? { ...node, childState: node.childState + 1 } : node,
      );

      assert.include(lawsBroken(tampered), "N7 last slot");
    }),
  );

  it.effect("N8: a nearest interaction that is not the parent's", () =>
    Effect.gen(function* nearest() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node) =>
        node.kind === "qti-simple-choice" ? { ...node, nearest: node.id } : node,
      );

      assert.include(lawsBroken(tampered), "N8 nearest");
    }),
  );

  it.effect("AL2: a closed name held twice on one element", () =>
    Effect.gen(function* distinct() {
      const rows = yield* foldedItem;
      const [first] = rows.attributes;
      const tampered = tamperAttributes(rows, (attribute) =>
        first !== undefined && attribute.node === first.node && attribute.at === 1n
          ? { ...attribute, name: first.name }
          : attribute,
      );

      assert.include(lawsBroken(tampered), "AL2 distinct");
    }),
  );

  it.effect("AL1: a cell AttributeAdmission does not hold, on rows shred did not write", () =>
    Effect.gen(function* admission() {
      const rows = yield* foldedItem;
      const renamed = tamperAttributes(rows, (attribute) =>
        declared(attribute) ? { ...attribute, name: "href" } : attribute,
      );
      const opened = tamperAttributes(rows, (attribute) =>
        declared(attribute) ? { ...attribute, name: "data-*" } : attribute,
      );

      assert.include(lawsBroken(renamed), "AL1 admission");
      assert.include(lawsBroken(opened), "AL1 admission");
    }),
  );
});

describe("the fixtures the importer accepts today", () => {
  it.effect("simple breaks no law", () =>
    Effect.gen(function* simple() {
      const files = yield* readPackage(fixtures.simple);
      const breaches = breachesOf(yield* judge(files, grammar, laws));

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});

/**
 * Reading 14, restated by the operator on 2026-11-05: a text-entry interaction's
 * `response-identifier` and `string-identifier` are `xs:IDREF`s, and a response declaration's
 * `identifier` is an `xs:ID`, as the XSD types them.
 */
const textEntryItem = (stringIdentifier: string) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one. <qti-text-entry-interaction response-identifier="TYPED" string-identifier="${stringIdentifier}"/></p>`,
  );

const typedDeclarations = `<qti-response-declaration identifier="TYPED" cardinality="single" base-type="string"/><qti-response-declaration identifier="SPELLED" cardinality="single" base-type="string"/>`;

const withDeclarations = (files: Readonly<Record<string, string>>) => ({
  ...files,
  "item.xml": edit(
    files["item.xml"] ?? "",
    `<qti-outcome-declaration identifier="SCORE"`,
    `${typedDeclarations}<qti-outcome-declaration identifier="SCORE"`,
  ),
});

describe("reading 14: text-entry references are IDREFs, response identifiers IDs", () => {
  it.effect("references that name response declarations break no reference or id law", () =>
    Effect.gen(function* resolved() {
      const breaches = breachesOf(yield* judged(withDeclarations(textEntryItem("SPELLED"))));

      assert.deepStrictEqual(
        breaches.filter(
          ({ law }) => ruleOf(law) === "idref-target" || ruleOf(law) === "document-key",
        ),
        [],
        shown(breaches),
      );
    }),
  );

  it.effect("a string-identifier naming no id breaks Idref target", () =>
    Effect.gen(function* dangling() {
      const breaches = breachesOf(yield* judged(withDeclarations(textEntryItem("NOWHERE"))));

      assert.include(
        breaches.map(({ law }) => `${law} ${ruleOf(law)}`),
        "Idref target idref-target",
        shown(breaches),
      );
    }),
  );

  it.effect("an element id equal to a response identifier is a duplicate id", () =>
    Effect.gen(function* duplicate() {
      const breaches = breachesOf(yield* judged(withItem(`<p id="intro">`, `<p id="RESPONSE">`)));

      assert.include(
        breaches.map(({ law }) => ruleOf(law)),
        "document-key",
        shown(breaches),
      );
    }),
  );
});
