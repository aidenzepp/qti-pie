/**
 * The HTML builder's free tests: `headerPiecesOf` splits every `headers` value into exactly its
 * whitespace-separated tokens, and over documents of a known structure `rowsOf` gives each cell's
 * `headers` its nearest table, each `th`'s `id` its value and table, and each element on the way
 * up its scope, as the document's own construction says.
 *
 * The expected rows are written by hand from each document's construction, element by element, so
 * no expected row is computed by the builder's own walk. The database tests
 * (`#pantry/qti/html.db.test.ts`) judge the rows through PostgreSQL.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element, string } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { headerPiecesOf, rowsOf } from "#pantry/import/overlays/html.ts";
import type { HtmlRows } from "#pantry/import/overlays/html.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, XdmDocument } from "#pantry/model/xdm.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The ids a case writes its rows under: each node's by its number, in the context of a document no
 * site names.
 */
const ids = { context: ownContext(idOf(0)), idOf };

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The grammar shred reads each document by.
 */
const shredGrammar = shredGrammarOf(Result.getOrThrow(composed()));

/**
 * Shred an item whose body is the given markup, under 3.0.1.
 *
 * @param body - The item body's content.
 * @returns The item's tree.
 */
const itemOf = (body: string) =>
  Effect.gen(function* shredsItem() {
    const xml = yield* readXml(
      new TextEncoder().encode(
        `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
      ),
    );

    return yield* shred(xml, "3.0.1", shredGrammar);
  });

/**
 * Name each node of a tree for a row to read back by: an element that writes an `id` by that
 * `id`, the document node `#doc`, and every other node by its kind.
 *
 * @param tree - The tree.
 * @returns Each node's name, by its id.
 */
const namesOf = (tree: XdmDocument<Composed>): ReadonlyMap<NodeId, string> => {
  const rows = flatten(tree, idOf);

  return new Map([
    ...rows.nodes.map(({ id, kind }) => [id, kind] as const),
    [rows.document.node, "#doc"],
    ...rows.attributes.flatMap(({ lexical, name, node }) =>
      name === "id" ? [[node, lexical.trim()] as const] : [],
    ),
  ]);
};

/**
 * Read a document's HTML rows back by the names of their nodes: each cell's headers as `name >
 * table: tokens`, each header as `name > table: id`, and each scope as `name > table @ nearest`.
 *
 * @param tree - The tree.
 * @param rows - Its rows.
 * @returns The three keyed sets, by names, each sorted.
 */
const named = (tree: XdmDocument<Composed>, rows: HtmlRows) => {
  const names = namesOf(tree);
  const nameOf = (node: NodeId): string => names.get(node) ?? node;

  return {
    headers: [...rows.CellHeaders.values()]
      .map(
        ({ node, table, tokens }) =>
          `${nameOf(node)} > ${nameOf(table)}: ${tokens.map(({ token }) => token).join(" ")}`,
      )
      .toSorted(),
    scopes: [...rows.TableScope.values()]
      .map(({ nearest, node, table }) => `${nameOf(node)} > ${nameOf(table)} @ ${nameOf(nearest)}`)
      .toSorted(),
    tableHeaders: [...rows.TableHeader.values()]
      .map(({ id, node, table }) => `${nameOf(node)} > ${nameOf(table)}: ${id}`)
      .toSorted(),
  };
};

/**
 * The characters of the split box: two name characters, a space and a tab.
 */
const characters = ["a", "b", " ", "\t"] as const;

/**
 * Every `headers` value of at most 5 characters over {@link characters}: the split box.
 */
const values: Gen<readonly string[]> = array(element<string>(characters), { max: 5, min: 0 });

/**
 * A situation the split box must reach: a value with no token, one bare token, one padded token,
 * and several tokens.
 */
type SplitSituation = "no token" | "bare token" | "padded token" | "several tokens";

describe("import/overlays/html.ts, headerPiecesOf", () => {
  it.effect(
    "splits every value into exactly its whitespace-separated tokens, the pieces concatenating to the value, and a value of whitespace alone into none",
    (ctx) =>
      // Oracle: the specification as a checker, the information model's headers (§5.140.1: "a
      // string consisting of an unordered set of unique space-separated tokens"), the tokens read
      // as XML Schema's list type reads its items, split at XML whitespace (Part 2 §4.3.6).
      // Bound: every value of at most 5 characters over a, b, space and tab, 1,365.
      searched(
        ctx,
        exhaust(
          {
            box: "every headers value of at most 5 characters over a, b, space and tab",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<SplitSituation>([
              "no token",
              "bare token",
              "padded token",
              "several tokens",
            ]),
            generator: values,
            limit: 1500,
            literal: (chars) => JSON.stringify(chars.join("")),
            oracle: {
              kind: "specification",
              name: "the information model's headers, §5.140.1, split as an XML Schema list",
            },
            suite: "import/overlays/html-header-split",
          },
          (chars: readonly string[], c) =>
            Effect.sync(() => {
              const lexical = chars.join("");
              const expected = lexical.split(/[\t\n\r ]+/u).filter((token) => token !== "");
              const situation = (): SplitSituation => {
                if (expected.length === 0) {
                  return "no token";
                }

                if (expected.length > 1) {
                  return "several tokens";
                }

                return expected[0] === lexical ? "bare token" : "padded token";
              };
              c.note(situation());

              const pieces = headerPiecesOf(lexical);
              assert.deepStrictEqual(
                pieces.map(({ token }) => token),
                expected,
                JSON.stringify(lexical),
              );
              if (pieces.length > 0) {
                assert.strictEqual(pieces.map(({ piece }) => piece).join(""), lexical);
              }

              for (const [at, { after, before, piece, token }] of pieces.entries()) {
                assert.strictEqual(piece, `${before}${token}${after}`);
                assert.isTrue(at === 0 || before !== "", JSON.stringify(lexical));
                assert.isTrue(at === pieces.length - 1 || after === "", JSON.stringify(lexical));
              }
            }),
        ),
      ),
  );
});

/**
 * The XML whitespace a `th`'s `id` is padded by on one side: none, or one or two of space, tab,
 * line feed and carriage return.
 */
const padding: Gen<string> = string(element([" ", "\t", "\n", "\r"] as const), { max: 2, min: 0 });

/**
 * Escape a text for an attribute value written between double quotes, so the reader gives it back
 * as written: the three whitespace controls as character references, which attribute-value
 * normalization leaves alone (XML 1.0, §3.3.3).
 *
 * @param text - The text, of no `&`, `<` or `"`.
 * @returns The escaped text.
 */
const attributeText = (text: string): string =>
  text.replaceAll("\t", "&#9;").replaceAll("\n", "&#10;").replaceAll("\r", "&#13;");

/**
 * An item body of two tables, one inside a cell of the other, and a cell no table holds: `c1`
 * names a header of each table, `c2` names both from inside the inner one, and `c3` stands in a
 * custom interaction's open content, which admits a cell outside every table.
 */
const nestedBody = `<table id="outer"><tbody id="ob"><tr id="or"><th id="h1">H</th><td id="c1" headers="h1 h2"><table id="inner"><tbody id="ib"><tr id="ir"><th id="h2">I</th><td id="c2" headers=" h2  h1 ">x</td></tr></tbody></table></td></tr></tbody></table><qti-custom-interaction id="d" response-identifier="R"><td id="c3" headers="h1">y</td></qti-custom-interaction>`;

/**
 * The scopes of the interaction case, read back by names: the division's table, whose nearest is
 * the document node's, and the prompt's, whose nearest is the choice interaction `ci`.
 *
 * @param outside - The name of the document node's nearest interaction.
 * @returns The scopes as `name > table @ nearest`, sorted.
 */
const interactionScopes = (outside: string): readonly string[] =>
  [
    `h > t @ ${outside}`,
    `t > t @ ${outside}`,
    `tb > t @ ${outside}`,
    `tr > t @ ${outside}`,
    "c > u @ ci",
    "g > u @ ci",
    "u > u @ ci",
    "ub > u @ ci",
    "ur > u @ ci",
  ].toSorted();

describe("import/overlays/html.ts, rowsOf", () => {
  it.effect(
    "gives each cell's headers and each th's id its nearest table, and each element on the way up its scope",
    () =>
      // Oracle: the document's construction, written by hand: each cell's nearest table, read
      // off the markup, and the elements between it and that table, each outside every
      // interaction but `c3`, whose nearest is the custom interaction that holds it (N8).
      Effect.gen(function* nested() {
        const tree = yield* itemOf(nestedBody);
        const rows = rowsOf(tree, ids);
        const read = named(tree, rows);

        assert.deepStrictEqual(read.headers, [
          "c1 > outer: h1 h2",
          "c2 > inner: h2 h1",
          "c3 > #doc: h1",
        ]);
        assert.deepStrictEqual(read.tableHeaders, ["h1 > outer: h1", "h2 > inner: h2"]);
        assert.deepStrictEqual(
          read.scopes,
          [
            "c1 > outer",
            "c2 > inner",
            "c3 > #doc",
            "d > #doc",
            "h1 > outer",
            "h2 > inner",
            "ib > inner",
            "inner > inner",
            "ir > inner",
            "ob > outer",
            "or > outer",
            "outer > outer",
            "qti-assessment-item > #doc",
            "qti-item-body > #doc",
          ]
            .map((row) => `${row} @ ${row.startsWith("c3 ") ? "d" : "#doc"}`)
            .toSorted(),
        );
        assert.strictEqual(
          rows.CellHeaders.get([...rows.CellHeaders.values()][1]?.node ?? "")
            ?.tokens.map(({ piece }) => piece)
            .join(""),
          " h2  h1 ",
        );
      }),
  );

  it.effect(
    "gives a scope inside an interaction that interaction as its nearest, and one outside every interaction its context's",
    () =>
      // Oracle: N8 read off the markup: the prompt and its table stand inside the choice
      // interaction, whose children take it as their nearest; the division's table stands outside
      // it, so its nearest is the document node's, the context's where one is given.
      Effect.gen(function* nearest() {
        const tree = yield* itemOf(
          `<div id="d"><table id="t"><tbody id="tb"><tr id="tr"><th id="h">H</th></tr></tbody></table></div><qti-choice-interaction id="ci" response-identifier="R" max-choices="1"><qti-prompt id="pr"><table id="u"><tbody id="ub"><tr id="ur"><td id="c" headers="g">x</td><th id="g">G</th></tr></tbody></table></qti-prompt><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction>`,
        );
        const context: DocumentContext = {
          ancestry: new Set(),
          nearest: idOf(9999),
          nearestKind: "document",
        };
        const own = named(tree, rowsOf(tree, ids));
        const placed = named(tree, rowsOf(tree, { context, idOf }));

        assert.deepStrictEqual(own.scopes, interactionScopes("#doc"));
        assert.deepStrictEqual(placed.scopes, interactionScopes(idOf(9999)));
        assert.deepStrictEqual(own.headers, ["c > u: g"]);
        assert.deepStrictEqual(own.tableHeaders, ["g > u: g", "h > t: h"]);
      }),
  );

  it.effect(
    "gives a th's id without the whitespace around it, the token a headers value naming it holds, for every padding of the box",
    (ctx) =>
      // Oracle: the specification as a checker, `id` an xs:ID, whose whitespace is collapsed
      // (XML Schema Part 2, §3.3.8 and §4.3.6), so a padded id names the header its token does,
      // the token `headerPiecesOf` splits from a headers value that names it.
      // Bound: every padding of at most two of space, tab, line feed and carriage return on each
      // side, 441.
      searched(
        ctx,
        exhaust(
          {
            box: "every padding of a th's id by at most two XML whitespace characters on each side",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"bare" | "padded">(["bare", "padded"]),
            generator: (source) => ({
              after: source.draw(padding),
              before: source.draw(padding),
            }),
            limit: 500,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "xs:ID's collapsed value, XML Schema Part 2, §3.3.8",
            },
            suite: "import/overlays/html-header-id",
          },
          ({ after, before }, c) =>
            Effect.gen(function* paddedId() {
              c.note(before === "" && after === "" ? "bare" : "padded");

              const id = `${before}h${after}`;
              const tree = yield* itemOf(
                `<table><tbody><tr><th id="${attributeText(id)}">H</th><td headers="${attributeText(id)}">x</td></tr></tbody></table>`,
              );
              const rows = rowsOf(tree, ids);

              assert.deepStrictEqual(
                [...rows.TableHeader.values()].map((row) => row.id),
                ["h"],
                JSON.stringify(id),
              );
              assert.deepStrictEqual(
                [...rows.CellHeaders.values()].flatMap(({ tokens }) =>
                  tokens.map(({ token }) => token),
                ),
                ["h"],
                JSON.stringify(id),
              );
            }),
        ),
      ),
  );

  it.effect("gives a document with no table cell no row", () =>
    // Oracle: the specification as a checker: reading 126 reads table cells alone.
    Effect.gen(function* none() {
      const rows = rowsOf(yield* itemOf(`<p id="p">No table.</p>`), ids);

      assert.strictEqual(rows.CellHeaders.size + rows.TableHeader.size + rows.TableScope.size, 0);
    }),
  );
});
