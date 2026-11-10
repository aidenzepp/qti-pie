import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import {
  advance,
  configure,
  current,
  itemRefs,
  open,
  openPackage,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Intent,
  PackageTest,
  PackageVerdict,
  Responses,
  TestSession,
  Value,
} from "#plate/index.ts";

/**
 * A fixture package of the tests below: where `openPackage` is told it lives, which is the prefix
 * of each document's location, and where its files stand on disk.
 */
interface Fixture {
  readonly directory: string;
  readonly location: string;
}

/**
 * The fixture whose section documents stand a folder deeper than its test: the test at
 * `tests/test.xml`, the section documents at `sections/lamp/`, and every item at `items/`.
 */
const deep: Fixture = {
  directory: path.resolve(import.meta.dirname, "..", "..", "fixtures", "m3f", "section-refs-deep"),
  location: "fixtures/m3f/section-refs-deep",
};

/**
 * The fixture of the first section-ref issue, whose section documents stand as deep as its test.
 */
const landed: Fixture = {
  directory: path.resolve(import.meta.dirname, "..", "..", "fixtures", "m3f", "section-refs"),
  location: "fixtures/m3f/section-refs",
};

/**
 * The path of both fixtures' test document inside the package.
 */
const testPath = "tests/test.xml";

/**
 * The location `openPackage` gives the generated packages, so the test of each is at
 * `generated/tests/test.xml`.
 */
const generatedLocation = "generated";

/**
 * The generated packages, as the fixtures are: they have no directory on disk.
 */
const generated: Fixture = { directory: "", location: generatedLocation };

/**
 * The namespace of QTI 3.0's assessment content, which each generated document declares.
 */
const qtiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every walk starts its session at.
 */
const startedAt = new Date("2026-11-10T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

/**
 * The responses every step posts: the choice `A`, the correct response of every fixture item.
 */
const answer: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
};

/**
 * Read every file under a directory, keyed by its path from the directory with `/` separators, as
 * a host unzips a package.
 *
 * @param root The directory.
 * @returns The files.
 */
const filesOf = Effect.fnUntraced(function* filesOf(root: string) {
  const entries = yield* Effect.tryPromise(() =>
    readdir(root, { recursive: true, withFileTypes: true }),
  );
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    );
  const contents = yield* Effect.all(
    paths.map((file) => Effect.tryPromise(() => readFile(path.join(root, file)))),
  );

  return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()] as const));
});

/**
 * One edit of a fixture file before the package is opened: the text to find in the file at `file`,
 * which must occur there, and what to write in its place.
 */
interface Edit {
  readonly file: string;
  readonly from: string;
  readonly to: string;
}

/**
 * Give a fixture's files with some edits applied, each to the text of one file; the test fails
 * when an edit's text is not in its file, so a reworded fixture cannot silently leave a variant
 * unbuilt.
 *
 * @param fixture The fixture.
 * @param edits The edits.
 * @returns The files.
 */
const variant = Effect.fnUntraced(function* variant(fixture: Fixture, edits: readonly Edit[]) {
  const files = new Map(yield* filesOf(fixture.directory));
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  for (const { file, from, to } of edits) {
    const text = decoder.decode(files.get(file) ?? assert.fail(`the fixture has no ${file}`));

    assert.include(text, from, `${file} holds the text the variant replaces`);
    files.set(file, encoder.encode(text.replace(from, to)));
  }

  return files;
});

/**
 * Open a fixture package, with some edits applied to its files first.
 *
 * @param fixture The fixture.
 * @param edits The edits, none by default.
 * @returns The verdict on the package.
 */
const openFixture = Effect.fnUntraced(function* openFixture(
  fixture: Fixture,
  edits: readonly Edit[] = [],
) {
  return yield* openPackage(fixture.location, yield* variant(fixture, edits));
});

/**
 * Take the test at {@link testPath} from an accepting verdict; the test fails when the package
 * does not accept or holds no test there.
 *
 * @param verdict The package verdict.
 * @param fixture The fixture the package was opened from.
 * @returns The test with its items.
 */
const testOf = (verdict: PackageVerdict, fixture: Fixture): PackageTest => {
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(
      `the package is ${verdict.verdict}, not accepted${
        verdict.verdict === "refused"
          ? `: ${verdict.refusals.map((refusal) => `${refusal.rule} at ${refusal.document}`).join(", ")}`
          : ""
      }`,
    );
  }

  return (
    verdict.accepted.tests.get(`${fixture.location}/${testPath}`) ??
    assert.fail(`the package delivers no test at ${testPath}`)
  );
};

/**
 * The rule and `check` of each refusal of a verdict, none when it does not refuse.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule and check, the check `undefined` when it has none.
 */
const rulesOf = (verdict: PackageVerdict): readonly (readonly [string, string | undefined])[] =>
  verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) => [refusal.rule, refusal.detail["check"]] as const)
    : [];

/**
 * A test and the items it delivers, as a host passes them to `startTest` and `advance`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Start a session of a delivery, failing the test when `startTest` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const started = (given: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance, now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Advance a session with an intent and {@link answer}, failing the test when `advance` refuses.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @param intent The intent.
 * @param seconds When it happens, in seconds after {@link startedAt}.
 * @returns The session after the intent.
 */
const advanced = (
  given: Delivery,
  configuration: Configuration,
  session: TestSession,
  intent: Intent,
  seconds: number,
): TestSession =>
  Result.getOrElse(
    advance(given.test, given.items, session, { intent, responses: answer }, configuration, {
      now: after(seconds),
    }),
    (failure) => assert.fail(`advance refused ${intent.kind}: ${failure.message}`),
  );

/**
 * Read the ref of the item a session shows now, failing the test when it shows the summary or
 * `current` fails.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param session The session.
 * @returns The current item's ref.
 */
const shown = (given: Delivery, configuration: Configuration, session: TestSession): string => {
  const view = Result.getOrElse(current(given.test, session, configuration), (failure) =>
    assert.fail(`current failed: ${failure.message}`),
  );

  return view.kind === "item" ? view.ref : assert.fail("current shows the summary, not an item");
};

/**
 * The edits that declare a float outcome `TOTAL` in the deep fixture's test and set it from the
 * `SCORE` of `a-item`, an item ref the test places through `sections/lamp/a.xml`.
 */
const totalOfAItem: readonly Edit[] = [
  {
    file: testPath,
    from: 'identifier="section-refs-deep-test" title="Tide tables">',
    to: 'identifier="section-refs-deep-test" title="Tide tables"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"><qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration>',
  },
  {
    file: testPath,
    from: "</qti-test-part>",
    to: '</qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="TOTAL"><qti-variable identifier="a-item.SCORE"/></qti-set-outcome-value></qti-outcome-processing>',
  },
];

/**
 * Write a section document of a generated package.
 *
 * @param identifier The section's identifier.
 * @param body The section's children, as text.
 * @returns The document's text.
 */
const sectionXml = (identifier: string, body: string): string =>
  `<qti-assessment-section xmlns="${qtiNamespace}" identifier="${identifier}" title="${identifier}" visible="true">${body}</qti-assessment-section>`;

/**
 * Write a section ref.
 *
 * @param identifier The ref's identifier.
 * @param href Its `href`.
 * @returns The element's text.
 */
const sectionRefXml = (identifier: string, href: string): string =>
  `<qti-assessment-section-ref identifier="${identifier}" href="${href}"/>`;

/**
 * Write the manifest of a generated package: the test at `tests/test.xml`, the section documents
 * at `sections/<name>`, each depending on the next, and the items `items/own.xml` and
 * `items/last.xml`.
 *
 * @param sections The section documents' names, in the order they are listed.
 * @returns The manifest's text.
 */
const manifestXml = (sections: readonly string[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="generated">',
    "<metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>",
    "<organizations/>",
    "<resources>",
    `<resource identifier="test" type="imsqti_test_xmlv3p0" href="${testPath}"><file href="${testPath}"/><dependency identifierref="item-own"/></resource>`,
    ...sections.map(
      (name) =>
        `<resource identifier="section-${name}" type="imsqti_section_xmlv3p0" href="sections/${name}"><file href="sections/${name}"/><dependency identifierref="item-last"/></resource>`,
    ),
    '<resource identifier="item-own" type="imsqti_item_xmlv3p0" href="items/own.xml"><file href="items/own.xml"/></resource>',
    '<resource identifier="item-last" type="imsqti_item_xmlv3p0" href="items/last.xml"><file href="items/last.xml"/></resource>',
    "</resources>",
    "</manifest>",
  ].join("");

/**
 * Generate a package whose test holds its own item ref `own`, then some section refs, and whose
 * section documents are given: the files `openPackage` is handed, with the items taken from the
 * deep fixture's.
 *
 * @param refs The section refs the test's one section holds after `own`, as text.
 * @param sections Each section document's name, under `sections/`, with its text.
 * @returns The package's files.
 */
const generatedFiles = Effect.fnUntraced(function* generatedFiles(
  refs: string,
  sections: readonly (readonly [name: string, text: string])[],
) {
  const encoder = new TextEncoder();
  const items = yield* filesOf(path.join(deep.directory, "items"));
  const item = items.get("one.xml") ?? assert.fail("the deep fixture has no items/one.xml");
  const test = `<qti-assessment-test xmlns="${qtiNamespace}" identifier="generated-test" title="Generated"><qti-test-part identifier="P1" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S0" title="Own" visible="true"><qti-assessment-item-ref identifier="own" href="../items/own.xml"/>${refs}</qti-assessment-section></qti-test-part></qti-assessment-test>`;

  return new Map<string, Uint8Array>([
    ["imsmanifest.xml", encoder.encode(manifestXml(sections.map(([name]) => name)))],
    [testPath, encoder.encode(test)],
    ["items/own.xml", item],
    ["items/last.xml", item],
    ...sections.map(([name, text]) => [`sections/${name}`, encoder.encode(text)] as const),
  ]);
});

/**
 * Open a generated package, with its refs and section documents as given.
 *
 * @param refs The test's section refs, as text.
 * @param sections The section documents.
 * @returns The verdict on the package.
 */
const openGenerated = Effect.fnUntraced(function* openGenerated(
  refs: string,
  sections: readonly (readonly [name: string, text: string])[],
) {
  return yield* openPackage(generatedLocation, yield* generatedFiles(refs, sections));
});

/**
 * Generate the sections of a chain: `s1.xml` to `s<length>.xml`, each placing the next the number
 * of times given, the last holding the item ref `last`.
 *
 * @param length How many documents the chain has.
 * @param times How many times each document places the next.
 * @returns The section documents.
 */
const chainOf = (length: number, times: number): readonly (readonly [string, string])[] =>
  Array.from({ length }, (_, index) => {
    const number = index + 1;
    const body =
      number === length
        ? '<qti-assessment-item-ref identifier="last" href="../items/last.xml"/>'
        : Array.from({ length: times }, (_each, place) =>
            sectionRefXml(`R${number}-${place + 1}`, `s${number + 1}.xml`),
          ).join("");

    return [`s${number}.xml`, sectionXml(`S${number}`, body)] as const;
  });

/**
 * Write the section refs of a test that places `sections/big.xml` some number of times.
 *
 * @param times How many times.
 * @returns The refs, as text.
 */
const placedBig = (times: number): string =>
  Array.from({ length: times }, (_, index) =>
    sectionRefXml(`R${index + 1}`, "../sections/big.xml"),
  ).join("");

/**
 * Take the refusal a delivery limit gave a package: the test fails when the package does not
 * refuse, or refuses any other way.
 *
 * @param verdict The package verdict.
 * @returns The one refusal.
 */
const deliveryRefusal = (verdict: PackageVerdict) => {
  if (verdict.verdict !== "refused") {
    return assert.fail(`the package is ${verdict.verdict}, not refused`);
  }

  const [refusal, ...others] = verdict.refusals;

  assert.deepStrictEqual(others, [], "the delivery limit is the package's only refusal");

  return refusal ?? assert.fail("a refused package has a refusal");
};

/**
 * The value of a float outcome of one.
 */
const one: Value = {
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value: 1 }],
};

describe("a package test that places section documents deeper than the test", () => {
  it.effect(
    "[S-9] [P-2] a test placing section documents deeper than itself starts with the package's items",
    () =>
      Effect.gen(function* deeper() {
        const configuration = yield* configure({});
        const verdict = yield* openFixture(deep);
        const delivery = testOf(verdict, deep);

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual([...delivery.items.keys()], ["own", "a-item", "b-item"]);
        assert.deepStrictEqual(
          [...delivery.items.values()].map((item) => item.document),
          [
            `${deep.location}/items/one.xml`,
            `${deep.location}/items/two.xml`,
            `${deep.location}/items/three.xml`,
          ],
        );

        const session = Result.getOrElse(
          startTest(delivery.test, delivery.items, configuration, { instance, now: startedAt }),
          (failure) => assert.fail(`startTest refused: ${failure.message}`),
        );

        assert.deepStrictEqual(
          session.items.map((item) => item.ref),
          ["own", "a-item", "b-item"],
        );
      }),
  );

  it.effect("[S-9] the test document's own item ref keeps its href as written", () =>
    Effect.gen(function* own() {
      const { test } = testOf(yield* openFixture(deep), deep);

      assert.deepStrictEqual(
        itemRefs(test).find((entry) => entry.identifier === "own"),
        { href: "../items/one.xml", identifier: "own" },
      );
    }),
  );

  it.effect(
    "[S-9] outcome processing that reads a placed item ref's variable is delivered unmarked and runs",
    () =>
      Effect.gen(function* unmarked() {
        const configuration = yield* configure({});
        const verdict = yield* openFixture(deep, totalOfAItem);
        const delivery = testOf(verdict, deep);

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual(delivery.test.unsupported, []);
        assert.deepStrictEqual(delivery.test.test.unsupported, []);
        assert.strictEqual(delivery.test.test.outcomeProcessing.kind, "runs");

        const session = started(delivery, configuration);
        const pastOwn = advanced(delivery, configuration, session, { kind: "next" }, 10);

        assert.strictEqual(shown(delivery, configuration, pastOwn), "a-item");

        const pastA = advanced(delivery, configuration, pastOwn, { kind: "next" }, 20);

        assert.strictEqual(shown(delivery, configuration, pastA), "b-item");
        assert.deepStrictEqual(pastA.outcomes["TOTAL"], one);
      }),
  );

  it.effect(
    "[S-9] a test opened alone still marks a read through a section document's item ref",
    () =>
      Effect.gen(function* alone() {
        const files = yield* variant(deep, totalOfAItem);
        const verdict = yield* open(
          `${deep.location}/${testPath}`,
          files.get(testPath) ?? assert.fail(`the fixture has no ${testPath}`),
        );

        assert.strictEqual(verdict.verdict, "accepted-with-unsupported");

        const features =
          verdict.verdict === "accepted-with-unsupported" && verdict.kind === "test"
            ? verdict.accepted.unsupported.map((feature) => feature.feature)
            : assert.fail("the test document alone is not an accepted test");

        assert.include(features, "variable:a-item.SCORE");
        assert.include(features, "qti-assessment-section-ref");
      }),
  );
});

describe("a package test whose assembly passes a limit of the delivery", () => {
  it.effect(
    "[S-9] [P-2] an assembled test deeper than the depth limit refuses the package assembly-limit, check delivery-depth",
    () =>
      Effect.gen(function* tooDeep() {
        const verdict = yield* openGenerated(
          sectionRefXml("R0", "../sections/s1.xml"),
          chainOf(300, 1),
        );
        const refusal = deliveryRefusal(verdict);

        assert.strictEqual(refusal.rule, "assembly-limit");
        assert.strictEqual(refusal.detail["check"], "delivery-depth");
        assert.strictEqual(refusal.detail["limit"], "256");
        assert.strictEqual(refusal.document, `${generatedLocation}/${testPath}`);
        assert.deepStrictEqual(refusal.location, { kind: "document" });
      }),
  );

  it.effect(
    "[S-9] [P-2] more instances than the instance limit refuses assembly-limit, check delivery-instances",
    () =>
      Effect.gen(function* tooMany() {
        const verdict = yield* openGenerated(
          sectionRefXml("R0", "../sections/s1.xml"),
          chainOf(12, 2),
        );
        const refusal = deliveryRefusal(verdict);

        assert.strictEqual(refusal.rule, "assembly-limit");
        assert.strictEqual(refusal.detail["check"], "delivery-instances");
        assert.strictEqual(refusal.detail["limit"], "2048");
        assert.strictEqual(refusal.document, `${generatedLocation}/${testPath}`);
      }),
  );

  it.effect(
    "[S-9] more copied elements than the element limit refuses assembly-limit, check delivery-size",
    () =>
      Effect.gen(function* tooBig() {
        const filler = "<p/>".repeat(16_384);
        const big = sectionXml(
          "BIG",
          `<qti-rubric-block view="candidate"><qti-content-body>${filler}</qti-content-body></qti-rubric-block><qti-assessment-item-ref identifier="last" href="../items/last.xml"/>`,
        );
        const refused = yield* openGenerated(placedBig(16), [["big.xml", big]]);
        const refusal = deliveryRefusal(refused);

        assert.strictEqual(refusal.rule, "assembly-limit");
        assert.strictEqual(refusal.detail["check"], "delivery-size");
        assert.strictEqual(refusal.detail["limit"], "262144");
        assert.strictEqual(refusal.document, `${generatedLocation}/${testPath}`);

        // The same document placed 15 times holds fewer elements than the limit.
        const within = yield* openGenerated(placedBig(15), [["big.xml", big]]);

        assert.deepStrictEqual([...testOf(within, generated).items.keys()], ["own", "last"]);
      }),
  );

  it.effect(
    "[S-9] [P-2] a chain of section documents within every limit is delivered assembled",
    () =>
      Effect.gen(function* withinLimits() {
        const verdict = yield* openGenerated(
          sectionRefXml("R0", "../sections/s1.xml"),
          chainOf(40, 1),
        );

        assert.strictEqual(verdict.verdict, "accepted");
        assert.deepStrictEqual([...testOf(verdict, generated).items.keys()], ["own", "last"]);
      }),
  );
});

describe("a package test within the limits of the delivery", () => {
  it.effect("[S-9] [P-2] the landed fixture still delivers its five items", () =>
    Effect.gen(function* landedItems() {
      const configuration = yield* configure({});
      const delivery = testOf(yield* openFixture(landed), landed);
      const session = started(delivery, configuration);

      assert.deepStrictEqual(
        session.items.map((item) => item.ref),
        ["own", "a-item", "b-item", "a-item", "b-item"],
      );
    }),
  );

  it.effect("[S-9] a cycle and an external section ref are still the judging's refusals", () =>
    Effect.gen(function* judging() {
      const cycle = yield* openFixture(deep, [
        {
          file: "sections/lamp/b.xml",
          from: '<qti-assessment-item-ref identifier="b-item" href="../../items/three.xml"/>',
          to: '<qti-assessment-item-ref identifier="b-item" href="../../items/three.xml"/><qti-assessment-section-ref identifier="RA" href="a.xml"/>',
        },
      ]);
      const external = yield* openFixture(deep, [
        {
          file: testPath,
          from: '<qti-assessment-section-ref identifier="RA" href="../sections/lamp/a.xml"/>',
          to: '<qti-assessment-section-ref identifier="RA" href="https://example.org/s.xml"/>',
        },
      ]);

      assert.strictEqual(cycle.verdict, "refused");
      assert.include(
        rulesOf(cycle).map(([rule]) => rule),
        "inclusion-cycle",
      );
      assert.strictEqual(external.verdict, "refused");
      assert.deepInclude(rulesOf(external), ["package-path-outside", "remote-section"]);
      for (const [, check] of [...rulesOf(cycle), ...rulesOf(external)]) {
        assert.notMatch(check ?? "", /^delivery-/u);
      }
    }),
  );
});
