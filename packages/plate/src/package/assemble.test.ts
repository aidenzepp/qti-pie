import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import {
  assembleTest,
  assemblyDepthLimit,
  assemblyInstanceLimit,
} from "#plate/package/assemble.ts";
import type { AssembledTest, AssemblyInput } from "#plate/package/assemble.ts";
import { attr, doc, el, walk } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";

/**
 * Write an item ref of a hand-built test or section document.
 *
 * @param identifier The item ref's identifier.
 * @param href Its `href`.
 * @returns The element.
 */
const itemRef = (identifier: string, href: string): SourceElement =>
  el("qti-assessment-item-ref", [attr("identifier", identifier), attr("href", href)]);

/**
 * Write a section ref of a hand-built test or section document.
 *
 * @param identifier The section ref's identifier.
 * @param href Its `href`.
 * @returns The element.
 */
const sectionRef = (identifier: string, href: string): SourceElement =>
  el("qti-assessment-section-ref", [attr("identifier", identifier), attr("href", href)]);

/**
 * List the walk of a document as `<path> <identifier>` lines, the identifier left out of an element
 * that writes none, so a test compares a whole document's shape at once.
 *
 * @param document The document.
 * @returns The lines, in document order.
 */
const outlineOf = (document: SourceDocument): readonly string[] =>
  Array.from(walk(document), ({ element, path }) => {
    const identifier = element.attributes.find((attribute) => attribute.local === "identifier");

    return identifier === undefined ? path : `${path} ${identifier.value}`;
  });

/**
 * The hand-built counterpart of the fixture `fixtures/m3f/section-refs`: the test's one part holds
 * the section `S0` with the item ref `own`, then two section refs to `sections/a.xml`; `a.xml`
 * holds the item ref `a-item` and a section ref to `sections/b.xml`; `b.xml` holds the item ref
 * `b-item`.
 */
const own = itemRef("own", "../items/one.xml");

const refA1 = sectionRef("RA1", "../sections/a.xml");

const refA2 = sectionRef("RA2", "../sections/a.xml");

const aItem = itemRef("a-item", "../items/two.xml");

const refB = sectionRef("RB", "b.xml");

const bItem = itemRef("b-item", "../items/three.xml");

const sectionA = el(
  "qti-assessment-section",
  [attr("identifier", "A"), attr("title", "A"), attr("visible", "true")],
  [aItem, refB],
);

const sectionB = el(
  "qti-assessment-section",
  [attr("identifier", "B"), attr("title", "B"), attr("visible", "true")],
  [bItem],
);

const test = doc(
  "package.zip/tests/test.xml",
  el(
    "qti-assessment-test",
    [attr("identifier", "T"), attr("title", "T")],
    [
      el(
        "qti-test-part",
        [
          attr("identifier", "P1"),
          attr("navigation-mode", "linear"),
          attr("submission-mode", "individual"),
        ],
        [
          el(
            "qti-assessment-section",
            [attr("identifier", "S0"), attr("title", "S0"), attr("visible", "true")],
            [own, refA1, refA2],
          ),
        ],
      ),
    ],
  ),
);

const documents = new Map<string, SourceDocument>([
  ["sections/a.xml", doc("package.zip/sections/a.xml", sectionA)],
  ["sections/b.xml", doc("package.zip/sections/b.xml", sectionB)],
]);

/**
 * The assembly's input over the hand-built documents, as the package's judging would hand it: every
 * section ref with the path it places, and every item ref with the item it names.
 */
const input: AssemblyInput = {
  documents,
  itemRefs: [
    { element: own, identifier: "own", link: false, path: "items/one.xml" },
    { element: aItem, identifier: "a-item", link: false, path: "items/two.xml" },
    { element: bItem, identifier: "b-item", link: false, path: "items/three.xml" },
  ],
  sectionRefs: [
    { element: refA1, path: "sections/a.xml" },
    { element: refA2, path: "sections/a.xml" },
    { element: refB, path: "sections/b.xml" },
  ],
  test,
};

/**
 * The path of the test's one part.
 */
const part = "qti-assessment-test/qti-test-part";

/**
 * Assemble a test the limits admit, failing the test when the assembly gives none.
 *
 * @param given The assembly's input.
 * @returns The assembled test.
 */
const assembledOf = (given: AssemblyInput): AssembledTest =>
  Option.getOrElse(assembleTest(given), () =>
    assert.fail("the assembly gave none, though the document is within its limits"),
  );

/**
 * Build a chain of section documents `sections/s<n>.xml`, each holding an item ref and, but
 * the last, one section ref to the next, or two of them.
 *
 * @param length How many documents the chain holds.
 * @param twice Whether each document places the next twice.
 * @returns The test that places `s0`, with the documents and the refs the judging would give.
 */
const chain = (length: number, twice: boolean): AssemblyInput => {
  const chained = new Map<string, SourceDocument>();
  const refs: AssemblyInput["sectionRefs"][number][] = [];
  const items: AssemblyInput["itemRefs"][number][] = [];
  for (let index = 0; index < length; index += 1) {
    const item = itemRef(`I${index}`, "../items/a.xml");
    items.push({ element: item, identifier: `I${index}`, link: false, path: "items/a.xml" });

    const next =
      index + 1 < length
        ? Array.from({ length: twice ? 2 : 1 }, (_, copy) =>
            sectionRef(`R${index + 1}-${copy}`, `s${index + 1}.xml`),
          )
        : [];
    for (const ref of next) {
      refs.push({ element: ref, path: `sections/s${index + 1}.xml` });
    }

    chained.set(
      `sections/s${index}.xml`,
      doc(
        `package.zip/sections/s${index}.xml`,
        el(
          "qti-assessment-section",
          [attr("identifier", `X${index}`), attr("title", `X${index}`), attr("visible", "true")],
          [item, ...next],
        ),
      ),
    );
  }

  const first = sectionRef("R0", "../sections/s0.xml");
  refs.push({ element: first, path: "sections/s0.xml" });

  return {
    documents: chained,
    itemRefs: items,
    sectionRefs: refs,
    test: doc(
      test.location,
      el(
        "qti-assessment-test",
        [attr("identifier", "T"), attr("title", "T")],
        [
          el(
            "qti-test-part",
            [
              attr("identifier", "P1"),
              attr("navigation-mode", "linear"),
              attr("submission-mode", "individual"),
            ],
            [first],
          ),
        ],
      ),
    ),
  };
};

describe("assembleTest", () => {
  it("[S-9] the assembled document of the fixture replaces each ref by its section root and keeps every other element in place", () => {
    const before = [outlineOf(test), ...[...documents.values()].map(outlineOf)];

    const assembled = assembledOf(input);

    assert.strictEqual(assembled.document.location, test.location);
    assert.deepStrictEqual(outlineOf(assembled.document), [
      "qti-assessment-test T",
      `${part} P1`,
      `${part}/qti-assessment-section S0`,
      `${part}/qti-assessment-section/qti-assessment-item-ref own`,
      `${part}/qti-assessment-section/qti-assessment-section[1] A`,
      `${part}/qti-assessment-section/qti-assessment-section[1]/qti-assessment-item-ref a-item`,
      `${part}/qti-assessment-section/qti-assessment-section[1]/qti-assessment-section B`,
      `${part}/qti-assessment-section/qti-assessment-section[1]/qti-assessment-section/qti-assessment-item-ref b-item`,
      `${part}/qti-assessment-section/qti-assessment-section[2] A`,
      `${part}/qti-assessment-section/qti-assessment-section[2]/qti-assessment-item-ref a-item`,
      `${part}/qti-assessment-section/qti-assessment-section[2]/qti-assessment-section B`,
      `${part}/qti-assessment-section/qti-assessment-section[2]/qti-assessment-section/qti-assessment-item-ref b-item`,
    ]);
    // The input documents are plain immutable data: the assembly copies, and never mutates one.
    assert.deepStrictEqual([outlineOf(test), ...[...documents.values()].map(outlineOf)], before);

    // Each placement is its own copy, so a path keyed by element names one placement.
    const placed = Array.from(walk(assembled.document), ({ element }) => element);
    assert.strictEqual(new Set(placed).size, placed.length);
    // The test, its part, `S0`, `A`, `B` and `B`'s item ref are open at once at the deepest.
    assert.strictEqual(assembled.depth, 6);
  });

  it("[S-9] the assembly gives every item ref of the assembled test its item, keyed by identifier, each identifier once", () => {
    const assembled = assembledOf(input);

    assert.deepStrictEqual(
      [...assembled.items],
      [
        ["own", "items/one.xml"],
        ["a-item", "items/two.xml"],
        ["b-item", "items/three.xml"],
      ],
    );
    assert.deepStrictEqual(assembled.links, []);
  });

  it("[S-9] the assembly maps each path of the test document to its path in the assembled document, and lists an LTI link's item ref at its assembled path", () => {
    const link = itemRef("L", "../links/l.xml");
    const linked = doc(
      test.location,
      el(
        "qti-assessment-test",
        [attr("identifier", "T"), attr("title", "T")],
        [
          el(
            "qti-test-part",
            [
              attr("identifier", "P1"),
              attr("navigation-mode", "linear"),
              attr("submission-mode", "individual"),
            ],
            [
              el(
                "qti-assessment-section",
                [attr("identifier", "S0"), attr("title", "S0"), attr("visible", "true")],
                [link],
              ),
              refA1,
            ],
          ),
        ],
      ),
    );

    const assembled = assembledOf({
      ...input,
      itemRefs: [
        ...input.itemRefs,
        { element: link, identifier: "L", link: true, path: "links/l.xml" },
      ],
      test: linked,
    });

    // The placed section stands beside `S0` in the part, so `S0` gains a sibling index.
    assert.deepStrictEqual(
      [...assembled.paths],
      [
        ["qti-assessment-test", "qti-assessment-test"],
        [part, part],
        [`${part}/qti-assessment-section`, `${part}/qti-assessment-section[1]`],
        [
          `${part}/qti-assessment-section/qti-assessment-item-ref`,
          `${part}/qti-assessment-section[1]/qti-assessment-item-ref`,
        ],
      ],
    );
    assert.deepStrictEqual(assembled.links, [
      { identifier: "L", path: `${part}/qti-assessment-section[1]/qti-assessment-item-ref` },
    ]);
    assert.deepStrictEqual(outlineOf(assembled.document).slice(0, 5), [
      "qti-assessment-test T",
      `${part} P1`,
      `${part}/qti-assessment-section[1] S0`,
      `${part}/qti-assessment-section[1]/qti-assessment-item-ref L`,
      `${part}/qti-assessment-section[2] A`,
    ]);
    assert.deepStrictEqual(
      [...assembled.items],
      [
        ["a-item", "items/two.xml"],
        ["b-item", "items/three.xml"],
      ],
    );
  });

  it("[S-9] a section ref that names no document given, or one on its own chain, is kept as written and places nothing", () => {
    const loop = sectionRef("RA", "a.xml");
    const looping = new Map<string, SourceDocument>([
      ["sections/a.xml", doc("package.zip/sections/a.xml", sectionA)],
      [
        "sections/b.xml",
        doc(
          "package.zip/sections/b.xml",
          el(
            "qti-assessment-section",
            [attr("identifier", "B"), attr("title", "B"), attr("visible", "true")],
            [bItem, loop],
          ),
        ),
      ],
    ]);
    const unread = sectionRef("RX", "../sections/x.xml");

    const assembled = assembledOf({
      ...input,
      documents: looping,
      sectionRefs: [
        ...input.sectionRefs,
        { element: loop, path: "sections/a.xml" },
        { element: unread, path: "sections/x.xml" },
      ],
      test: doc(
        test.location,
        el(
          "qti-assessment-test",
          [attr("identifier", "T"), attr("title", "T")],
          [
            el(
              "qti-test-part",
              [
                attr("identifier", "P1"),
                attr("navigation-mode", "linear"),
                attr("submission-mode", "individual"),
              ],
              [
                el(
                  "qti-assessment-section",
                  [attr("identifier", "S0"), attr("title", "S0"), attr("visible", "true")],
                  [refA1, unread],
                ),
              ],
            ),
          ],
        ),
      ),
    });

    assert.deepStrictEqual(outlineOf(assembled.document), [
      "qti-assessment-test T",
      `${part} P1`,
      `${part}/qti-assessment-section S0`,
      `${part}/qti-assessment-section/qti-assessment-section A`,
      `${part}/qti-assessment-section/qti-assessment-section/qti-assessment-item-ref a-item`,
      `${part}/qti-assessment-section/qti-assessment-section/qti-assessment-section B`,
      `${part}/qti-assessment-section/qti-assessment-section/qti-assessment-section/qti-assessment-item-ref b-item`,
      `${part}/qti-assessment-section/qti-assessment-section/qti-assessment-section/qti-assessment-section-ref RA`,
      `${part}/qti-assessment-section/qti-assessment-section-ref RX`,
    ]);
  });

  it("[S-9] the assembly gives none past its depth limit or its instance limit, and the one within both", () => {
    // The test, its part and the chain's sections are open at once at the chain's last item ref.
    const deepest = assembledOf(chain(assemblyDepthLimit - 3, false));
    assert.strictEqual(deepest.depth, assemblyDepthLimit);
    assert.isTrue(Option.isNone(assembleTest(chain(assemblyDepthLimit - 2, false))));
    // Eleven documents each placing the next twice are 2^11 - 1 = 2,047 instances, within the
    // limit of 2,048; twelve pass it long before the copy would write all 4,095 of them.
    assert.strictEqual(assemblyInstanceLimit, 2048);

    const widest = assembledOf(chain(11, true));
    assert.strictEqual(widest.items.size, 11);
    assert.isTrue(Option.isNone(assembleTest(chain(12, true))));
  });
});
