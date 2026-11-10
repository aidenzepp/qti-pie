/**
 * The oracle's quotation law (spec reading 127) over whole packages, and its E1 over the ends it
 * reads: a package whose item puts a quotation mark beside or inside a `q` is refused
 * `q-punctuation`, a package whose mark is an apostrophe is accepted, and a node whose `first` or
 * `last` is not its own characters' end breaks "E1 derived".
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, explain, judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The manifest of a package of one item, `item.xml`, in 3.0.1.
 */
const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources>
</manifest>`;

/**
 * Write an item whose body is the given content, with the one response it declares.
 *
 * @param body - The item body's content.
 * @returns The item's text.
 */
const itemOf = (body: string): string =>
  `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false" adaptive="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * Build the package of one item from its body, each file encoded as UTF-8, as `readEntries`
 * returns one.
 *
 * @param body - The item body's content.
 * @returns The entries, sorted by path.
 */
const packageOf = (body: string): readonly PackageFile[] =>
  [
    { path: "imsmanifest.xml", text: manifest },
    { path: "item.xml", text: itemOf(body) },
  ].map(({ path, text }): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

describe("the oracle's quotation law, over a package", () => {
  it.effect(
    "refuses a quotation mark before, after or inside a q under q-punctuation, and accepts an apostrophe beside one",
    () =>
      // Oracle: the specification as a checker, §5.111 as reading 127 reads it: quotation
      // punctuation "must not appear immediately before, after, or inside q tags", and ’ is an
      // apostrophe, which quotes nothing.
      // Bound: the slice's three named packages and the plain one.
      Effect.gen(function* packages() {
        const cases = [
          { body: `<p>say "<q>x</q>"</p>`, rule: "q-punctuation" },
          { body: `<p><q>“x”</q></p>`, rule: "q-punctuation" },
          { body: `<p>l’<q>x</q></p>`, rule: undefined },
          { body: `<p>say <q>x</q> now</p>`, rule: undefined },
        ] as const;
        for (const { body, rule } of cases) {
          const verdict = verdictOf(yield* judge(packageOf(body), grammar, laws));

          assert.deepStrictEqual(
            verdict,
            rule === undefined ? { verdict: "accepted" } : { rule, verdict: "refused" },
            body,
          );
        }
      }),
  );

  it("explains a breach by its mark and its place", () => {
    // Oracle: the specification as a checker, the explanation's text for the keys the law writes.
    const shown = explain("Quotation punctuation", { mark: '"', position: "before it" }, grammar);

    assert.include(shown, `"\\""`);
    assert.include(shown, "before it");
    assert.include(shown, "the user agent draws");
  });
});

describe("the oracle's E1 over a node's ends", () => {
  it.effect("breaks E1 derived where a node's first or last is not its own characters' end", () =>
    // Oracle: the specification as a checker, reading 127's ends: a text node's `first` and
    // `last` are the first and last code points of its characters, which the fold writes and E1
    // reads independently from the text rows.
    // Bound: a text's first, its last, and an element given a character it does not hold.
    Effect.gen(function* ends() {
      const document = yield* Effect.orDie(
        readXml(new TextEncoder().encode(itemOf(`<p>say 😀</p>`))),
      );
      const tree = yield* Effect.orDie(shred(document, "3.0.1", shredGrammarOf(grammar)));
      const rows = yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
      const text = rows.nodes.findIndex(({ kind }) => kind === "text");
      const paragraph = rows.nodes.findIndex(({ kind }) => kind === "p");

      assert.deepStrictEqual(
        [rows.nodes[text]?.first, rows.nodes[text]?.last],
        ["s", "😀"],
        "the fold writes the text's ends, the last a surrogate pair",
      );
      assert.deepStrictEqual(documentBreaches("item.xml", rows, laws), []);

      for (const [at, edit] of [
        [text, { first: "a" }],
        [text, { last: "\uDE00" }],
        [paragraph, { first: "p" }],
      ] as const) {
        const corrupted = {
          ...rows,
          nodes: rows.nodes.map((node, index) => (index === at ? { ...node, ...edit } : node)),
        };
        const broken = documentBreaches("item.xml", corrupted, laws).filter(
          ({ law }) => law === "E1 derived",
        );

        assert.lengthOf(broken, 1, JSON.stringify(edit));
        assert.include(explain("E1 derived", broken[0]?.keys ?? {}, grammar), "first and last");
      }
    }),
  );
});
