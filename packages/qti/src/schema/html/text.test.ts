import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import * as contracts from "#qti/schema/contracts.ts";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as text from "#qti/schema/html/text.ts";

/**
 * The 46 handles of spec 4.8's V04 column.
 */
const handles = [
  ..."a abbr acronym address article aside b bdi bdo big blockquote cite code dd dfn div dt em footer".split(
    " ",
  ),
  ..."h1 h2 h3 h4 h5 h6 header i kbd label li nav pre q rb rp rt samp section small span strong".split(
    " ",
  ),
  ..."sub summary sup tt var".split(" "),
];

/**
 * The optional-attribute relations, each with its arm and the pattern of its value.
 */
const optional = [
  ["AType", "A", patterns.mimeType],
  ["BdoTitle", "Bdo", patterns.xsString],
  ["BlockquoteCite", "Blockquote", patterns.anyUri],
  ["QCite", "Q", patterns.anyUri],
] as const;

/**
 * A relation that is the source of one of this module's containments.
 */
type Source = (typeof text.rules)[number]["left"]["source"];

/**
 * The containments `rules` declares from `source`, each as the source fields, the target relation
 * and the target fields.
 */
const containments = (rules: typeof text.rules, source: Source) =>
  rules.flatMap((rule) =>
    rule.kind === "contained" && rule.left.source === source
      ? [[[...rule.left.fields], rule.right.source, [...rule.right.fields]] as const]
      : [],
  );

/**
 * The source of a column's base pattern, whether the column is a bare pattern or a contract over
 * one.
 */
const sourceOf = (
  field:
    | { readonly pattern: { readonly source: string } }
    | { readonly base: { readonly pattern: { readonly source: string } } },
): string => ("base" in field ? field.base.pattern.source : field.pattern.source);

describe("html/text", () => {
  it("keys 46 arms by the V04 handles", () => {
    assert.strictEqual(handles.length, 46);
    assert.deepStrictEqual(Object.keys(text.arms).toSorted(), handles.toSorted());
  });

  it("names every handle a NodeKind and gives its arm a single id key", () => {
    for (const [handle, arm] of Object.entries(text.arms)) {
      assert.include(node.relations.NodeKind.handles, handle);
      assert.deepStrictEqual([...arm.primaryKey], ["id"]);
    }
  });

  it("gives each arm exactly the own attributes the inventory lists", () => {
    for (const [handle, arm] of Object.entries(text.arms)) {
      const entry = entryOf(handle);

      assert.isTrue(Option.isSome(entry), handle);

      const own = Option.getOrThrow(entry).attributes.filter((a) => a.family === "own");
      const required = own.filter((a) => a.use === "required").map((a) => a.name);
      assert.deepStrictEqual(Object.keys(arm.fields), ["id", ...required].toSorted(), handle);
    }
  });

  it("gives A a collapsed anyUri href", () => {
    const { fields } = text.relations.A;
    assert.deepStrictEqual(Object.keys(fields), ["href", "id"]);
    assert.strictEqual(fields.href.base.pattern.source, patterns.anyUri);
  });

  it("holds an optional attribute as a node-keyed row contained into its arm", () => {
    for (const [name, arm, pattern] of optional) {
      const relation = text.relations[name];
      assert.deepStrictEqual([...relation.primaryKey], ["node"], name);
      assert.deepStrictEqual(Object.keys(relation.fields), ["node", "value"], name);
      assert.strictEqual(sourceOf(relation.fields.value), pattern, name);
      assert.deepStrictEqual(containments(text.rules, relation), [
        [["node"], text.relations[arm], ["id"]],
      ]);
    }
  });

  it("builds a probe schema over node.relations and text.relations", () => {
    const probe = schema("HtmlTextProbe", { ...node.relations, ...text.relations }, [
      ...node.rules,
      ...text.rules,
    ]);
    for (const name of Object.keys(text.relations)) {
      assert.property(probe.relations, name);
    }
    assert.strictEqual(Object.keys(text.relations).length, 46 + optional.length);
  });
});

describe("contracts (html/text)", () => {
  it("types A.href HyperlinkUri", () => {
    assert.strictEqual(text.A.fields.href.name, contracts.HyperlinkUri.name);
  });
  it("types BlockquoteCite.value CitationUri", () => {
    assert.strictEqual(text.BlockquoteCite.fields.value.name, contracts.CitationUri.name);
  });
  it("types QCite.value CitationUri", () => {
    assert.strictEqual(text.QCite.fields.value.name, contracts.CitationUri.name);
  });
  it("types AType.value ContentMediaType", () => {
    assert.strictEqual(text.AType.fields.value.name, contracts.ContentMediaType.name);
  });
});
