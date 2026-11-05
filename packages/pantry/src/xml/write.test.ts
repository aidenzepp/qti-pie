import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option } from "effect";
import { materialize } from "#pantry/test/fixtures.ts";
import { EncodeError } from "@qti-pie/crust/errors.ts";
import { OracleLayer } from "#pantry/xml/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { writeXml } from "@qti-pie/crust/write.ts";

/**
 * What every test here runs on: the process spawner `xmllintC14n` needs and the file system and
 * path services that spawner and the fixture materializer need.
 */
const TestLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory `materialize("simple")` returned, set once by `beforeAll`.
 */
let simple = "";

beforeAll(() =>
  Effect.gen(function* materializeSimple() {
    simple = yield* materialize("simple");
  }).pipe(Effect.provide(TestLayer)),
);

/**
 * Make an attribute with no namespace and no recorded references.
 */
const attribute = (name: string, value: string): Attribute => ({
  local: name,
  namespace: "",
  prefix: "",
  qname: name,
  references: [],
  value,
});

/**
 * Make an element in no namespace.
 */
const element = (
  name: string,
  attributes: readonly Attribute[],
  children: readonly Child[],
): Element => ({
  attributes,
  children,
  kind: "element",
  local: name,
  namespace: "",
  prefix: "",
  qname: name,
});

/**
 * Wrap a root element in a document with no declaration, doctype, prolog or epilog.
 */
const documentOf = (root: Element): XmlDocument => ({
  charset: "utf-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  prolog: [],
  root,
});

/**
 * Write `root` as a bare document and fail the test on an `EncodeError`.
 */
const written = (root: Element, threshold?: number) =>
  writeXml(documentOf(root), threshold === undefined ? undefined : { threshold });

/**
 * Write `root` and return the `EncodeError` it fails with.
 */
const refused = (root: Element, threshold: number) =>
  Effect.flip(writeXml(documentOf(root), { threshold }));

/**
 * Read a file, write the tree back, read the written text again, and return both trees and the
 * text.
 */
const roundTrip = Effect.fn("write.test.roundTrip")(function* roundTrip(path: string) {
  const fs = yield* FileSystem.FileSystem;
  const first = yield* readXml(yield* fs.readFile(path));
  const text = yield* writeXml(first);
  const second = yield* readXml(new TextEncoder().encode(text));

  return { first, second, text };
});

/**
 * Assert that `choice.xml` of a fixture reads back deep-equal after a write.
 */
const readsBack = (name: "simple" | "doctype" | "external") =>
  Effect.gen(function* readBack() {
    const directory = name === "simple" ? simple : yield* materialize(name);
    const { first, second } = yield* roundTrip(`${directory}/choice.xml`);

    assert.deepStrictEqual(second, first);
  });

layer(TestLayer)("xml/write.ts", (it) => {
  for (const name of ["external"] as const) {
    it.effect(`the ${name} fixture's choice.xml reads back deep-equal after a write`, () =>
      readsBack(name),
    );
  }

  it.effect("the external fixture writes &undeclared; exactly twice, text and attribute", () =>
    Effect.gen(function* undeclared() {
      const directory = yield* materialize("external");
      const { text } = yield* roundTrip(`${directory}/choice.xml`);

      assert.strictEqual(text.split("&undeclared;").length - 1, 2);
    }),
  );

  it.effect(
    "the declaration is written with only the fields present, then the doctype and prolog",
    () =>
      Effect.gen(function* prologText() {
        const text = yield* writeXml({
          ...documentOf(element("a", [], [])),
          declaration: Option.some({
            encoding: Option.none(),
            standalone: Option.some("yes"),
            version: "1.0",
          }),
          doctype: Option.some("<!DOCTYPE a>"),
          epilog: [{ data: "d", kind: "pi", target: "t" }],
          prolog: [{ kind: "comment", text: " c " }],
        });

        assert.strictEqual(
          text,
          '<?xml version="1.0" standalone="yes"?>\n<!DOCTYPE a>\n<!-- c -->\n<a/>\n<?t d?>',
        );
      }),
  );

  it.effect("an element writes <x/> without children and keeps attribute order", () =>
    Effect.gen(function* empty() {
      assert.strictEqual(
        yield* written(element("a", [attribute("z", "1"), attribute("b", "2")], [])),
        '<a z="1" b="2"/>',
      );
    }),
  );

  it.effect('attribute values escape & < " TAB LF CR and keep recorded references raw', () =>
    Effect.gen(function* attributes() {
      const text = yield* written(
        element(
          "a",
          [
            attribute("p", 'a&b<c"d\te\nf\rg'),
            { ...attribute("q", "x&r;y"), references: [{ name: "r", offset: 1 }] },
          ],
          [],
        ),
      );

      assert.strictEqual(text, '<a p="a&amp;b&lt;c&quot;d&#x9;e&#xA;f&#xD;g" q="x&r;y"/>');
    }),
  );

  it.effect(
    "text escapes &, <, the > of ]]> and CR; CDATA, comments, PIs and references are literal",
    () =>
      Effect.gen(function* children() {
        const text = yield* written(
          element(
            "a",
            [],
            [
              { cdata: false, kind: "text", value: "a&b<c>d]]>e\r" },
              { cdata: true, kind: "text", value: "<raw & text>" },
              { kind: "comment", text: "note" },
              { data: "data", kind: "pi", target: "t" },
              { kind: "entityRef", name: "undeclared" },
            ],
          ),
        );

        assert.strictEqual(
          text,
          "<a>a&amp;b&lt;c>d]]&gt;e&#xD;<![CDATA[<raw & text>]]><!--note--><?t data?>&undeclared;</a>",
        );
      }),
  );

  it.effect(
    "above the threshold a text run and an attribute value take a character reference",
    () =>
      Effect.gen(function* references() {
        const text = yield* written(
          element(
            "a",
            [attribute("p", "x€y")],
            [{ cdata: false, kind: "text", value: "\u{1F600}!" }],
          ),
          0xff,
        );

        assert.strictEqual(text, '<a p="x&#x20AC;y">&#x1F600;!</a>');
      }),
  );

  it.effect("a CDATA run is closed around a reference and an empty section is omitted", () =>
    Effect.gen(function* cdata() {
      const middle = yield* written(
        element("a", [], [{ cdata: true, kind: "text", value: "ab€cd" }]),
        0x7f,
      );
      const edges = yield* written(
        element("a", [], [{ cdata: true, kind: "text", value: "€€x€" }]),
        0x7f,
      );
      const only = yield* written(
        element("a", [], [{ cdata: true, kind: "text", value: "€" }]),
        0x7f,
      );

      assert.strictEqual(middle, "<a><![CDATA[ab]]>&#x20AC;<![CDATA[cd]]></a>");
      assert.strictEqual(edges, "<a>&#x20AC;&#x20AC;<![CDATA[x]]>&#x20AC;</a>");
      assert.strictEqual(only, "<a>&#x20AC;</a>");
    }),
  );

  it.effect("a CR in a CDATA run is written as a reference and reads back", () =>
    Effect.gen(function* carriageReturn() {
      const text = yield* written(element("a", [], [{ cdata: true, kind: "text", value: "a\rb" }]));
      const read = yield* readXml(new TextEncoder().encode(text));

      assert.strictEqual(text, "<a><![CDATA[a]]>&#xD;<![CDATA[b]]></a>");
      assert.strictEqual(
        read.root.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
        "a\rb",
      );
    }),
  );

  it.effect("a CDATA run at or below the threshold is untouched", () =>
    Effect.gen(function* untouched() {
      assert.strictEqual(
        yield* written(element("a", [], [{ cdata: true, kind: "text", value: "ÿ" }]), 0xff),
        "<a><![CDATA[ÿ]]></a>",
      );
    }),
  );

  it.effect(
    "a code point above the threshold in a name, comment, PI or reference name is refused",
    () =>
      Effect.gen(function* refusals() {
        const cases: readonly (readonly [Element, EncodeError["where"]])[] = [
          [element("€", [], []), "name"],
          [element("a", [attribute("€", "v")], []), "name"],
          [element("a", [], [{ kind: "comment", text: "€" }]), "comment"],
          [element("a", [], [{ data: "€", kind: "pi", target: "t" }]), "pi"],
          [element("a", [], [{ data: "d", kind: "pi", target: "€" }]), "pi"],
          [element("a", [], [{ kind: "entityRef", name: "€" }]), "name"],
          [
            element(
              "a",
              [{ ...attribute("p", "&€;"), references: [{ name: "€", offset: 0 }] }],
              [],
            ),
            "name",
          ],
        ];

        for (const [root, where] of cases) {
          const failure = yield* refused(root, 0x7f);

          assert.instanceOf(failure, EncodeError);
          assert.deepStrictEqual(
            { codePoint: failure.codePoint, threshold: failure.threshold, where: failure.where },
            { codePoint: 0x20_ac, threshold: 0x7f, where },
          );
        }
      }),
  );

  it.effect("a code point above the threshold in the doctype is refused", () =>
    Effect.gen(function* doctype() {
      const doc: XmlDocument = {
        ...documentOf(element("a", [], [])),
        doctype: Option.some('<!DOCTYPE a [<!ENTITY e "\u20AC">]>'),
      };
      const failure = yield* Effect.flip(writeXml(doc, { threshold: 0xff }));

      assert.instanceOf(failure, EncodeError);
      assert.deepStrictEqual(
        { codePoint: failure.codePoint, threshold: failure.threshold, where: failure.where },
        { codePoint: 0x20_ac, threshold: 0xff, where: "doctype" },
      );
      assert.strictEqual(yield* writeXml(doc), '<!DOCTYPE a [<!ENTITY e "\u20AC">]>\n<a/>');
    }),
  );

  it.effect("the same constructs are written whole when no threshold is given", () =>
    Effect.gen(function* unbounded() {
      assert.strictEqual(
        yield* written(element("€", [], [{ kind: "comment", text: "€" }])),
        "<€><!--€--></€>",
      );
    }),
  );
});
