import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { ChoiceInteraction, InlineChoiceInteraction, Item } from "#plate/model/item.ts";
import type { ItemRef, Section, Test } from "#plate/model/test.ts";
import { openPackage } from "#plate/package/open.ts";
import { fileLocation, manifestFile } from "#plate/package/store.ts";
import { open } from "#plate/validate/open.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import { acceptedItem, unsupportedFeatures } from "#plate/validate/verdict.ts";
import type { Verdict } from "#plate/validate/verdict.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * Open a file of the example corpus under its corpus-relative location, as a host opens a document
 * it read from storage.
 *
 * @param location The file's path under the corpus root, which the verdict carries as its document.
 * @returns The verdict on the file.
 */
const openCorpusFile = (location: string) =>
  readCorpusFile(location).pipe(Effect.flatMap((bytes) => open(location, bytes)));

/**
 * Read the refusals of a verdict, none when it is not `refused`.
 *
 * @param verdict The verdict.
 * @returns Its refusals in order.
 */
const refusalsOf = (verdict: Verdict): readonly Refusal[] =>
  verdict.verdict === "refused" ? verdict.refusals : [];

/**
 * How many entries a large flat document repeats: past the roughly 120,000 arguments V8 takes in
 * one call, so a spread of them into a call's arguments overflows the stack.
 */
const large = 200_000;

/**
 * A large flat document takes this long at most, in milliseconds; each opens in about 2 s here.
 */
const largeTimeout = 60_000;

/**
 * Write an item document as bytes, as a host reads one from storage.
 *
 * @param head The declarations before the body.
 * @param body The content of `qti-item-body`.
 * @returns The document's UTF-8 bytes.
 */
const itemBytes = (head: string, body: string): Uint8Array =>
  new TextEncoder().encode(
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false">${head}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  );

describe("validate/open.ts", () => {
  it.effect(
    "fractions_deps_2.xml is refused, fallback-configuration among its refusals with the suggestion secondary-configuration",
    () =>
      Effect.gen(function* fractions() {
        const location = "qtiv3-examples/packaging/pci/src/fractions_deps_2.xml";
        const verdict = yield* openCorpusFile(location);
        const path =
          "qti-assessment-item/qti-item-body/div/qti-portable-custom-interaction[1]/qti-interaction-modules/@fallback-configuration";
        const matching = refusalsOf(verdict).filter(
          (refusal) =>
            refusal.rule === "unknown-attribute" &&
            refusal.location.kind === "path" &&
            refusal.location.path === path,
        );

        assert.strictEqual(verdict.verdict, "refused");
        assert.strictEqual(verdict.document, location);
        assert.lengthOf(matching, 1);
        assert.deepStrictEqual(matching[0]?.suggestion, Option.some("secondary-configuration"));
        assert.strictEqual(matching[0]?.document, location);
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "CAT/test.xml is refused with the reader's refusal as its only one",
    () =>
      Effect.gen(function* cat() {
        const location = "qtiv3-examples/CAT/test.xml";
        const verdict = yield* openCorpusFile(location);

        assert.strictEqual(verdict.verdict, "refused");
        assert.strictEqual(verdict.document, location);
        assert.deepStrictEqual(
          refusalsOf(verdict).map((refusal) => refusal.rule),
          ["reader-refused"],
        );
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "BG007 is accepted, the positive control",
    () =>
      Effect.gen(function* bg007() {
        const location = "QTI3_BPIG_Examples/items/BG007.xml";
        const verdict = yield* openCorpusFile(location);

        assert.strictEqual(verdict.verdict, "accepted");
        assert.strictEqual(verdict.document, location);
      }),
    { tags: ["corpus"] },
  );

  describe("a large flat document", () => {
    it.effect(
      "a body of 200,000 hr elements is accepted",
      () =>
        Effect.gen(function* manyChildren() {
          const verdict = yield* open("large.xml", itemBytes("", "<hr/>".repeat(large)));

          assert.strictEqual(verdict.verdict, "accepted");
        }),
      largeTimeout,
    );

    it.effect(
      "a declaration with 200,000 undeclared attributes is refused, one unknown-attribute each",
      () =>
        Effect.gen(function* manyAttributes() {
          const attributes = Array.from({ length: large }, (_, index) => ` a${index}="x"`).join("");
          const head = `<qti-outcome-declaration identifier="O" cardinality="single" base-type="float"${attributes}/>`;
          const verdict = yield* open("large.xml", itemBytes(head, "<p>x</p>"));
          const refusals = refusalsOf(verdict);
          const paths = new Set(
            refusals.map((refusal) =>
              refusal.location.kind === "path" ? refusal.location.path : "",
            ),
          );

          assert.strictEqual(verdict.verdict, "refused");
          assert.lengthOf(refusals, large);
          assert.isTrue(refusals.every((refusal) => refusal.rule === "unknown-attribute"));
          assert.strictEqual(paths.size, large);
        }),
      largeTimeout,
    );

    it.effect(
      "a video holding 200,000 sources with javascript URLs is accepted with unsupported features",
      () =>
        Effect.gen(function* manySources() {
          const sources = '<source src="javascript:x"/>'.repeat(large);
          const body = `<video controls="controls">${sources}</video>`;
          const verdict = yield* open("large.xml", itemBytes("", body));

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
        }),
      largeTimeout,
    );
  });
});

/**
 * Encode a hand-built document's text as bytes, as a host reads one from storage.
 *
 * @param text The document's text.
 * @returns Its UTF-8 bytes.
 */
const bytesOf = (text: string): Uint8Array => new TextEncoder().encode(text);

/**
 * Each lexical form of `xs:boolean` a case writes an attribute in, as attribute text, beside the
 * value XSD reads it as (XML Schema Part 2, 3.3.2.1): the four literals, then a `1` and a `0` in
 * outer XML whitespace. The last is written as character references, because the reader
 * normalizes a literal tab or line break in an attribute value to a space.
 */
const booleanForms = [
  { value: true, written: "true" },
  { value: false, written: "false" },
  { value: true, written: "1" },
  { value: false, written: "0" },
  { value: true, written: " 1 " },
  { value: false, written: "&#10;0&#9;" },
] as const;

/**
 * The control each attribute is also written in: outside `xs:boolean`'s lexical space, so the
 * structural validator refuses it.
 */
const outsideBoolean = "yes";

/**
 * Write an item document that declares an identifier response `RESPONSE` and a float outcome `F`.
 *
 * @param root The root's `adaptive` and `time-dependent`, as written.
 * @param body The content of `qti-item-body`.
 * @param processing What follows the body, as written.
 * @returns The item's text.
 */
const booleanItem = (root: string, body: string, processing = ""): string =>
  `<qti-assessment-item xmlns="${qtiNamespace}" identifier="I1" title="I1" ${root}><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="F" cardinality="single" base-type="float"/><qti-item-body>${body}</qti-item-body>${processing}</qti-assessment-item>`;

/**
 * An item root that is neither adaptive nor time dependent.
 */
const plainRoot = 'adaptive="false" time-dependent="false"';

/**
 * Write a `qti-choice-interaction` on `RESPONSE` holding the choices `A` and `B`.
 *
 * @param interaction The interaction's further attributes, as written.
 * @param choice Choice `A`'s further attributes, as written.
 * @returns The interaction's text.
 */
const choiceXml = (interaction: string, choice: string): string =>
  `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1" ${interaction}><qti-simple-choice identifier="A" ${choice}>A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction>`;

/**
 * Write a paragraph holding a `qti-inline-choice-interaction` on `RESPONSE` with the choices `A`
 * and `B`.
 *
 * @param interaction The interaction's further attributes, as written.
 * @returns The paragraph's text.
 */
const inlineChoiceXml = (interaction: string): string =>
  `<p><qti-inline-choice-interaction response-identifier="RESPONSE" ${interaction}><qti-inline-choice identifier="A">A</qti-inline-choice><qti-inline-choice identifier="B">B</qti-inline-choice></qti-inline-choice-interaction></p>`;

/**
 * Response processing that sets `F` to the built-in `duration`, which only a time-dependent item
 * has.
 */
const durationProcessing =
  '<qti-response-processing><qti-set-outcome-value identifier="F"><qti-variable identifier="duration"/></qti-set-outcome-value></qti-response-processing>';

/**
 * Write a test of one part `P` and one section `S` that holds the item ref `I1`.
 *
 * @param section The section's attributes, its `visible` included, as written.
 * @param ref The item ref's further attributes, as written.
 * @param inner What the section holds before the item ref, as written.
 * @returns The test's text.
 */
const booleanTest = (section: string, ref = "", inner = ""): string =>
  `<qti-assessment-test xmlns="${qtiNamespace}" identifier="T" title="T"><qti-test-part identifier="P" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" ${section}>${inner}<qti-assessment-item-ref identifier="I1" href="i1.xml" ${ref}/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * Name a verdict that accepts no document a case reads a field of: `refused` with its rules, else
 * the verdict.
 *
 * @param verdict The verdict.
 * @returns Its name, which no field's value equals.
 */
const unreadable = (verdict: Verdict): string =>
  verdict.verdict === "refused"
    ? `refused ${verdict.refusals.map((refusal) => refusal.rule).join(", ")}`
    : verdict.verdict;

/**
 * Read a field of the item a verdict accepts.
 *
 * @param read The field's reader.
 * @returns The reader of a verdict: the field, or {@link unreadable}'s name of the verdict.
 */
const itemField =
  (read: (item: Item) => boolean | undefined) =>
  (verdict: Verdict): boolean | string | undefined =>
    Option.match(acceptedItem(verdict), {
      onNone: () => unreadable(verdict),
      onSome: (accepted) => read(accepted.item),
    });

/**
 * Read a field of the test a verdict accepts.
 *
 * @param read The field's reader.
 * @returns The reader of a verdict: the field, or {@link unreadable}'s name of the verdict.
 */
const testField =
  (read: (test: Test) => boolean | undefined) =>
  (verdict: Verdict): boolean | string | undefined =>
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? read(verdict.accepted.test)
      : unreadable(verdict);

/**
 * Find the item body's `qti-choice-interaction`.
 *
 * @param item The item.
 * @returns The interaction, if the body holds one at its top.
 */
const choiceOf = (item: Item): ChoiceInteraction | undefined =>
  item.body.find((node): node is ChoiceInteraction => node.kind === "choice");

/**
 * Find the `qti-inline-choice-interaction` in a paragraph of the item body.
 *
 * @param item The item.
 * @returns The interaction, if a top-level element of the body holds one.
 */
const inlineChoiceOf = (item: Item): InlineChoiceInteraction | undefined =>
  item.body
    .flatMap((node) => (node.kind === "element" ? node.children : []))
    .find((node): node is InlineChoiceInteraction => node.kind === "inline-choice");

/**
 * Find {@link booleanTest}'s section `S`.
 *
 * @param test The test.
 * @returns The first part's first section.
 */
const sectionOf = (test: Test): Section | undefined => test.parts[0]?.children[0];

/**
 * Find {@link booleanTest}'s item ref `I1`.
 *
 * @param test The test.
 * @returns The first item ref of section `S`.
 */
const itemRefOf = (test: Test): ItemRef | undefined =>
  sectionOf(test)?.children.find((child): child is ItemRef => child.kind === "item-ref");

/**
 * What a verdict says, for an attribute whose value decides the verdict rather than a model field:
 * the verdict, the features it marks, and each refusal's rule and detail.
 */
interface Judgement {
  readonly marks: readonly string[];
  readonly refusals: readonly {
    readonly detail: Refusal["detail"];
    readonly rule: Refusal["rule"];
  }[];
  readonly verdict: Verdict["verdict"];
}

/**
 * What a case reads of a verdict: a model field's value, the name {@link unreadable} gives a
 * verdict with no field to read, or the verdict's {@link Judgement}.
 */
type BooleanReading = boolean | Judgement | string | undefined;

/**
 * Judge a verdict.
 *
 * @param verdict The verdict.
 * @returns Its judgement.
 */
const judged = (verdict: Verdict): Judgement => ({
  marks: unsupportedFeatures(verdict).map(({ feature }) => feature),
  refusals: refusalsOf(verdict).map(({ detail, rule }) => ({ detail, rule })),
  verdict: verdict.verdict,
});

/**
 * The judgement of a time-dependent item that reads `duration`: accepted, the read marked, because
 * the engine holds no item duration.
 */
const timedRead: Judgement = {
  marks: ["variable:duration"],
  refusals: [],
  verdict: "accepted-with-unsupported",
};

/**
 * The judgement of an item that is not time dependent and reads `duration`: refused, pantry's
 * `item-duration`.
 */
const untimedRead: Judgement = {
  marks: [],
  refusals: [
    {
      detail: { check: "untimed-duration", element: "qti-variable", identifier: "duration" },
      rule: "undeclared-variable",
    },
  ],
  verdict: "refused",
};

/**
 * One place an `xs:boolean` attribute is written, and what each of its values must give.
 */
interface BooleanPlacement {
  /**
   * The attribute's name, as the control's refusal names it.
   */
  readonly attribute: string;
  /**
   * The document that writes the attribute in a given form.
   */
  readonly document: (written: string) => string;
  /**
   * The local name of the element that carries it, as the control's refusal names it.
   */
  readonly element: string;
  /**
   * What {@link BooleanPlacement.read} must give for a form XSD reads as the given value.
   */
  readonly expected: (value: boolean) => BooleanReading;
  /**
   * What a case reads of the verdict.
   */
  readonly read: (verdict: Verdict) => BooleanReading;
  /**
   * The rest of the case's title.
   */
  readonly title: string;
}

/**
 * A model field's expectation: the value the form reads as.
 *
 * @param value The value.
 * @returns The same value.
 */
const fieldIs = (value: boolean): boolean => value;

/**
 * The eight `xs:boolean` attributes of round 9h's H1, in each element plate reads them on, and
 * `with-replacement` in the element plate marks and does not read.
 */
const booleanPlacements: readonly BooleanPlacement[] = [
  {
    attribute: "time-dependent",
    document: (written) =>
      booleanItem(
        `adaptive="false" time-dependent="${written}"`,
        choiceXml("", ""),
        durationProcessing,
      ),
    element: "qti-assessment-item",
    expected: (value) => (value ? timedRead : untimedRead),
    read: judged,
    title:
      "time-dependent on an item whose response processing reads duration marks variable:duration when true and is refused untimed-duration when false",
  },
  {
    attribute: "adaptive",
    document: (written) => booleanItem(`adaptive="${written}" time-dependent="false"`, "<p>x</p>"),
    element: "qti-assessment-item",
    expected: (value) => ({
      marks: value ? ['adaptive="true"'] : [],
      refusals: [],
      verdict: value ? "accepted-with-unsupported" : "accepted",
    }),
    read: judged,
    title: "adaptive on an item marks adaptive when true and is accepted unmarked when false",
  },
  {
    attribute: "shuffle",
    document: (written) => booleanItem(plainRoot, choiceXml(`shuffle="${written}"`, "")),
    element: "qti-choice-interaction",
    expected: fieldIs,
    read: itemField((item) => choiceOf(item)?.shuffle),
    title: "shuffle on a qti-choice-interaction is the interaction's shuffle",
  },
  {
    attribute: "shuffle",
    document: (written) => booleanItem(plainRoot, inlineChoiceXml(`shuffle="${written}"`)),
    element: "qti-inline-choice-interaction",
    expected: fieldIs,
    read: itemField((item) => inlineChoiceOf(item)?.shuffle),
    title: "shuffle on a qti-inline-choice-interaction is the interaction's shuffle",
  },
  {
    attribute: "required",
    document: (written) => booleanItem(plainRoot, inlineChoiceXml(`required="${written}"`)),
    element: "qti-inline-choice-interaction",
    expected: fieldIs,
    read: itemField((item) => inlineChoiceOf(item)?.required),
    title: "required on a qti-inline-choice-interaction is the interaction's required",
  },
  {
    attribute: "required",
    document: (written) => booleanTest('visible="true"', `required="${written}"`),
    element: "qti-assessment-item-ref",
    expected: fieldIs,
    read: testField((test) => itemRefOf(test)?.required),
    title: "required on a qti-assessment-item-ref is the item ref's required",
  },
  {
    attribute: "required",
    document: (written) => booleanTest(`visible="true" required="${written}"`),
    element: "qti-assessment-section",
    expected: fieldIs,
    read: testField((test) => sectionOf(test)?.required),
    title: "required on a qti-assessment-section is the section's required",
  },
  {
    attribute: "fixed",
    document: (written) => booleanItem(plainRoot, choiceXml("", `fixed="${written}"`)),
    element: "qti-simple-choice",
    expected: fieldIs,
    read: itemField((item) => choiceOf(item)?.choices[0]?.fixed),
    title: "fixed on a qti-simple-choice is the choice's fixed",
  },
  {
    attribute: "fixed",
    document: (written) => booleanTest('visible="true"', `fixed="${written}"`),
    element: "qti-assessment-item-ref",
    expected: fieldIs,
    read: testField((test) => itemRefOf(test)?.fixed),
    title: "fixed on a qti-assessment-item-ref is the item ref's fixed",
  },
  {
    attribute: "fixed",
    document: (written) => booleanTest(`visible="true" fixed="${written}"`),
    element: "qti-assessment-section",
    expected: fieldIs,
    read: testField((test) => sectionOf(test)?.fixed),
    title: "fixed on a qti-assessment-section is the section's fixed",
  },
  {
    attribute: "visible",
    document: (written) => booleanTest(`visible="${written}"`),
    element: "qti-assessment-section",
    expected: fieldIs,
    read: testField((test) => sectionOf(test)?.visible),
    title: "visible on a qti-assessment-section is the section's visible",
  },
  {
    attribute: "keep-together",
    document: (written) => booleanTest(`visible="true" keep-together="${written}"`),
    element: "qti-assessment-section",
    expected: fieldIs,
    read: testField((test) => sectionOf(test)?.keepTogether),
    title: "keep-together on a qti-assessment-section is the section's keepTogether",
  },
  {
    attribute: "with-replacement",
    document: (written) =>
      booleanTest(
        'visible="true"',
        "",
        `<qti-selection select="1" with-replacement="${written}"/>`,
      ),
    element: "qti-selection",
    expected: () => ({
      marks: ["qti-selection"],
      refusals: [],
      verdict: "accepted-with-unsupported",
    }),
    read: judged,
    title:
      "with-replacement on a qti-selection, whose value plate does not read, is accepted-with-unsupported and marked qti-selection in every form",
  },
];

/**
 * The location every hand-built package in these tests carries.
 */
const packageLocation = "package.zip";

/**
 * A 3.0.0 manifest listing the test `test.xml` and the item `i1.xml`.
 */
const durationManifest = `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="T" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource><resource identifier="I1" type="imsqti_item_xmlv3p0" href="i1.xml"><file href="i1.xml"/></resource></resources></manifest>`;

/**
 * A test whose outcome processing sets its float outcome `D` to `I1.duration`, the duration of its
 * item ref `I1`.
 */
const durationTest = `<qti-assessment-test xmlns="${qtiNamespace}" identifier="T" title="T"><qti-outcome-declaration identifier="D" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true"><qti-assessment-item-ref identifier="I1" href="i1.xml"/></qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="D"><qti-variable identifier="I1.duration"/></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`;

/**
 * The package of {@link durationTest} and its item `I1`, whose `time-dependent` is written in a
 * given form.
 *
 * @param written The item's `time-dependent`, as written.
 * @returns The package's files.
 */
const durationPackage = (written: string): ReadonlyMap<string, Uint8Array> =>
  new Map([
    [manifestFile, bytesOf(durationManifest)],
    [
      "i1.xml",
      bytesOf(booleanItem(`adaptive="false" time-dependent="${written}"`, choiceXml("", ""))),
    ],
    ["test.xml", bytesOf(durationTest)],
  ]);

describe("every xs:boolean attribute plate reads", () => {
  for (const placement of booleanPlacements) {
    it.effect(
      `four boolean forms: ${placement.title}, and ${outsideBoolean} is refused attribute-type`,
      () =>
        Effect.gen(function* fourForms() {
          const location = `${placement.attribute}.xml`;
          const read = yield* Effect.all(
            booleanForms.map(({ written }) =>
              open(location, bytesOf(placement.document(written))).pipe(Effect.map(placement.read)),
            ),
          );
          const control = yield* open(location, bytesOf(placement.document(outsideBoolean)));

          assert.deepStrictEqual(
            read,
            booleanForms.map(({ value }) => placement.expected(value)),
          );
          assert.deepStrictEqual(
            refusalsOf(control).map(({ detail, rule }) => ({ detail, rule })),
            [
              {
                detail: {
                  attribute: placement.attribute,
                  element: placement.element,
                  expected: "boolean",
                  value: outsideBoolean,
                },
                rule: "attribute-type",
              },
            ],
          );
        }),
    );
  }

  it.effect(
    'boolean attribute through the package: a test that reads I1.duration is accepted-with-unsupported when I1 is time-dependent="1", and refused untimed-duration at the test when it is "0"',
    () =>
      Effect.gen(function* throughPackage() {
        const timed = yield* openPackage(packageLocation, durationPackage("1"));
        const untimed = yield* openPackage(packageLocation, durationPackage("0"));

        assert.strictEqual(timed.verdict, "accepted-with-unsupported");
        assert.deepStrictEqual(
          untimed.verdict === "refused"
            ? untimed.refusals.map(({ detail, document, location, rule }) => ({
                detail,
                document,
                location,
                rule,
              }))
            : untimed.verdict,
          [
            {
              detail: {
                check: "untimed-duration",
                element: "qti-variable",
                identifier: "I1.duration",
              },
              document: fileLocation(packageLocation, "test.xml"),
              location: {
                kind: "path",
                path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-variable/@identifier",
              },
              rule: "undeclared-variable",
            },
          ],
        );
      }),
  );
});
