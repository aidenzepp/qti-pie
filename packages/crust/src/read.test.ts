/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { readXml } from "#crust/read.ts";
import type { Child, Element, XmlDocument } from "#crust/tree.ts";
import { declared } from "#crust/test/bytes.ts";
import { withoutBuffer } from "#crust/test/without-buffer.ts";

/**
 * One child as a string: an entity reference as `&name;`, text as its value, anything else `-`.
 */
const describeChild = (child: Child): string => {
  if (child.kind === "entityRef") {
    return `&${child.name};`;
  }

  return child.kind === "text" ? child.value : "-";
};

/**
 * The qnames of the attributes of `node`, in order.
 */
const names = (node: Element): readonly string[] =>
  node.attributes.map((attribute) => attribute.qname);

/**
 * The value of the attribute `qname` of `node`.
 */
const attr = (node: Element, qname: string): string | undefined =>
  node.attributes.find((attribute) => attribute.qname === qname)?.value;

/**
 * Read one file under `fixtures/`, named relative to it.
 */
const readFixtureBytes = (relative: string) =>
  Effect.gen(function* readFixtureFile() {
    const fs = yield* FileSystem.FileSystem;

    return yield* fs.readFile(path.join(import.meta.dirname, "fixtures", relative));
  });

/**
 * Read `text` as UTF-8 bytes.
 */
const readText = (text: string) => readXml(new TextEncoder().encode(text));

layer(NodeServices.layer, { excludeTestServices: true })("read.ts", (suite) => {
  /**
   * The attribute `x` of the root that each of these files under `fixtures/dtd/` reads to.
   */
  const dtdFixtures: readonly (readonly [string, string])[] = [
    ["attr-ws.xml", "a b"],
    ["attlist-nmtokens.xml", "p q"],
    ["quote.xml", 'a"b'],
  ];

  for (const [file, expected] of dtdFixtures) {
    suite.effect(`reads dtd/${file} with x as ${JSON.stringify(expected)}`, () =>
      Effect.gen(function* readDtd() {
        const bytes = yield* readFixtureBytes(`dtd/${file}`);
        const document = yield* readXml(bytes);

        assert.strictEqual(attr(document.root, "x"), expected);
      }),
    );
  }

  suite.effect("reads a UTF-8 document without Node's Buffer", () => {
    const bytes = new TextEncoder().encode('<a x="1"/>');

    return withoutBuffer(
      Effect.gen(function* readsUtf8WithoutBuffer() {
        assert.isFalse("Buffer" in globalThis);

        const document = yield* readXml(bytes);

        assert.strictEqual(document.root.qname, "a");
        assert.strictEqual(attr(document.root, "x"), "1");
      }),
    );
  });

  suite.effect("reads an ISO-8859-1 document without Node's Buffer", () => {
    const bytes = declared("ISO-8859-1", [0xe9]);

    return withoutBuffer(
      Effect.gen(function* readsLatin1WithoutBuffer() {
        assert.isFalse("Buffer" in globalThis);

        const document = yield* readXml(bytes);

        assert.deepStrictEqual(document.root.children, [
          { cdata: false, kind: "text", value: "é" },
        ]);
      }),
    );
  });

  suite.effect("reads dtd/markup.xml with a b element under a", () =>
    Effect.gen(function* readMarkup() {
      const bytes = yield* readFixtureBytes("dtd/markup.xml");
      const document = yield* readXml(bytes);

      assert.deepStrictEqual(
        document.root.children.map((child) =>
          child.kind === "element" ? child.qname : child.kind,
        ),
        ["b"],
      );
    }),
  );

  suite.effect("refuses dtd/attr-lt.xml", () =>
    Effect.gen(function* refuseAttrLt() {
      const bytes = yield* readFixtureBytes("dtd/attr-lt.xml");
      const error = yield* Effect.flip(readXml(bytes));

      assert.strictEqual(error._tag, "WellFormednessError");
    }),
  );

  suite.effect("normalizes a non-CDATA attribute and its default, and records an entity name", () =>
    Effect.gen(function* readTypes() {
      const text =
        '<!DOCTYPE a SYSTEM "a.dtd" [<!ATTLIST a i ID " p  q " e (u|v) " u " d NMTOKENS "  m  &amp;n  &z;  " c CDATA " k  ">]><a e=" v  " c=" k  "/>';
      const { root } = yield* readText(text);

      assert.deepStrictEqual(names(root), ["e", "c", "i", "d"]);
      assert.strictEqual(attr(root, "e"), "v");
      assert.strictEqual(attr(root, "c"), " k  ");
      assert.strictEqual(attr(root, "i"), "p q");
      assert.deepStrictEqual(root.attributes[3], {
        local: "d",
        namespace: "",
        prefix: "",
        qname: "d",
        references: [{ name: "z", offset: 5 }],
        value: "m &n &z;",
      });
    }),
  );

  suite.effect("keeps CDATA, comments and processing instructions in order", () =>
    Effect.gen(function* readMixed() {
      const text =
        '<?xml version="1.0"?><!--a--><?t d?><r>x<![CDATA[<y>]]>z&amp;w<!--c--><e/></r><?u v?>';
      const document: XmlDocument = yield* readText(text);

      assert.deepStrictEqual(document.prolog, [
        { kind: "comment", text: "a" },
        { data: "d", kind: "pi", target: "t" },
      ]);
      assert.deepStrictEqual(document.epilog, [{ data: "v", kind: "pi", target: "u" }]);
      assert.deepStrictEqual(
        document.root.children.map((child) =>
          child.kind === "text" ? [child.cdata, child.value] : child.kind,
        ),
        [[false, "x"], [true, "<y>"], [false, "z&w"], "comment", "element"],
      );
    }),
  );

  suite.effect("reports the position of a well-formedness error", () =>
    Effect.gen(function* readBroken() {
      const error = yield* Effect.flip(readText("<a>\n  </b>"));

      assert.strictEqual(error._tag, "WellFormednessError");
      assert.strictEqual(error._tag === "WellFormednessError" && error.line, 2);
    }),
  );

  suite.effect("refuses an undeclared entity in a standalone document", () =>
    Effect.gen(function* refuseStandalone() {
      const text =
        '<?xml version="1.0" standalone="yes"?><!DOCTYPE a SYSTEM "a.dtd"><a>&undeclared;</a>';
      const error = yield* Effect.flip(readText(text));

      assert.strictEqual(error._tag, "ReaderRefusal");
      assert.strictEqual(error._tag === "ReaderRefusal" && error.rule, "undeclared-entity");
      assert.include(error._tag === "ReaderRefusal" ? error.detail : "", "undeclared");
    }),
  );

  suite.effect("refuses bad/07-undeclared-entity.xml under the named rule", () =>
    Effect.gen(function* refuseNbsp() {
      const bytes = yield* readFixtureBytes("bad/07-undeclared-entity.xml");
      const error = yield* Effect.flip(readXml(bytes));

      assert.strictEqual(error._tag === "ReaderRefusal" && error.rule, "undeclared-entity");
      assert.include(error._tag === "ReaderRefusal" ? error.detail : "", "nbsp");
    }),
  );

  suite.effect("keeps references inside comments and CDATA, and skips a used sentinel", () =>
    Effect.gen(function* readHidden() {
      const text =
        '<!DOCTYPE a SYSTEM "a.dtd"><a x="&p;&#xE000;&q;"><!--&n;--><![CDATA[&m;]]>\uE000&p;&#xE001;&q;&p;</a>';
      const { root } = yield* readText(text);

      assert.deepStrictEqual(root.attributes[0]?.references, [
        { name: "p", offset: 0 },
        { name: "q", offset: 4 },
      ]);
      assert.strictEqual(root.attributes[0]?.value, "&p;\uE000&q;");
      assert.deepStrictEqual(root.children.map(describeChild), [
        "-",
        "&m;",
        "\uE000",
        "&p;",
        "\uE001",
        "&q;",
        "&p;",
      ]);
    }),
  );

  suite.effect("reads a document nested 256 elements deep", () =>
    Effect.gen(function* readDeepest() {
      const { root } = yield* readText("<a>".repeat(256) + "</a>".repeat(256));

      let depth = 1;
      let node = root;
      let [child] = node.children;
      while (child?.kind === "element") {
        node = child;
        depth += 1;
        [child] = node.children;
      }

      assert.strictEqual(depth, 256);
    }),
  );

  suite.effect("refuses a document nested 257 elements deep under rule element-depth", () =>
    Effect.gen(function* refuseTooDeep() {
      const error = yield* Effect.flip(readText("<a>".repeat(257) + "</a>".repeat(257)));

      assert.strictEqual(error._tag, "ReaderRefusal");
      assert.strictEqual(error._tag === "ReaderRefusal" ? error.rule : undefined, "element-depth");
    }),
  );

  /**
   * The failure tag of each file under `fixtures/bad/`.
   */
  const refused: readonly (readonly [string, string])[] = [
    ["04-undeclared-element-prefix.xml", "WellFormednessError"],
    ["05-undeclared-attribute-prefix.xml", "WellFormednessError"],
    ["07-undeclared-entity.xml", "ReaderRefusal"],
    ["11-prefix-undeclaration.xml", "WellFormednessError"],
    ["12-duplicate-expanded-attribute.xml", "WellFormednessError"],
    ["13-xml-prefix-rebound.xml", "WellFormednessError"],
    ["17-space-before-declaration.xml", "WellFormednessError"],
    ["22-xml-namespace-as-default.xml", "WellFormednessError"],
    ["23-xmlns-prefix-declared.xml", "WellFormednessError"],
    ["24-declaration-only.xml", "WellFormednessError"],
    ["25-two-colons-in-name.xml", "WellFormednessError"],
    ["27-version-2.xml", "WellFormednessError"],
  ];

  for (const [file, tag] of refused) {
    suite.effect(`refuses bad/${file}`, () =>
      Effect.gen(function* refuseBad() {
        const bytes = yield* readFixtureBytes(`bad/${file}`);
        const error = yield* Effect.flip(readXml(bytes));

        assert.strictEqual(error._tag, tag);
      }),
    );
  }
});
