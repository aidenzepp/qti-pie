import { statSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Result, Schema } from "effect";
import committed from "#plate/validate/securing-tables.generated.json" with { type: "json" };
import { securingTables } from "#plate/validate/securing-tables.ts";
import {
  expandSecuringTables,
  projectSecuringTables,
  SecuringTablesFile,
} from "#plate/validate/securing.ts";
import { tables } from "#plate/validate/tables.ts";
import type { SecuringTables, Tables, Wildcard } from "#plate/validate/xsd.ts";

/**
 * Decode a securing tables file as {@link SecuringTablesFile}, refusing a key that Schema does not
 * name, so a stray field fails as a wrong value does.
 */
const decodeExactly = Schema.decodeUnknownResult(SecuringTablesFile, { onExcessProperty: "error" });

/**
 * Keep a table's element wildcard as a field, or no field when it has none.
 *
 * @param table The table.
 * @param table.anyElement Its element wildcard, if any.
 * @returns The wildcard as a field, or no field.
 */
const wildcardOf = ({
  anyElement,
}: {
  readonly anyElement?: Wildcard;
}): { readonly anyElement?: Wildcard } => (anyElement === undefined ? {} : { anyElement });

/**
 * View the full tables as securing reads them, written apart from `projectSecuringTables` and
 * `expandSecuringTables` so the two are checked against it: each element's and type's declared
 * attributes, each by its name and `use`, and the fields the structural walk reads.
 *
 * @param full The full tables.
 * @returns Their securing view.
 */
const securingView = (full: Tables): SecuringTables => ({
  elements: Object.fromEntries(
    Object.entries(full.elements).map(([name, table]) => [
      name,
      {
        ...wildcardOf(table),
        attributes: table.attributes.map(({ local, namespace, use }) => ({
          local,
          namespace,
          use,
        })),
        children: table.children,
        global: table.global,
        types: table.types,
      },
    ]),
  ),
  types: Object.fromEntries(
    Object.entries(full.types).map(([name, entry]) => [
      name,
      entry.derivation === "union"
        ? {
            ...wildcardOf(entry),
            attributes: entry.attributes.map(({ local, namespace, use }) => ({
              local,
              namespace,
              use,
            })),
            children: entry.children,
            derivation: entry.derivation,
          }
        : {
            ...wildcardOf(entry),
            attributes: entry.attributes.map(({ local, namespace, use }) => ({
              local,
              namespace,
              use,
            })),
            base: entry.base,
            children: entry.children,
            derivation: entry.derivation,
          },
    ]),
  ),
});

/**
 * The full tables with `div`'s last declared attribute taken away, a projection source that has
 * drifted from the committed tables.
 *
 * @returns The drifted tables.
 */
const driftedTables = (): Tables => {
  const { div } = tables.elements;
  assert.isDefined(div, "the tables hold div");

  return {
    ...tables,
    elements: { ...tables.elements, div: { ...div, attributes: div.attributes.slice(0, -1) } },
  };
};

/**
 * Give the size of a file beside this test.
 *
 * @param file The file's name.
 * @returns Its size in bytes.
 */
const size = (file: string): number => statSync(new URL(file, import.meta.url)).size;

describe("validate/securing.ts", () => {
  it("the committed file decodes as SecuringTablesFile, with no key it does not name, to itself", () => {
    // `securing-tables.ts` asserts this type without a decode at load, so this case is the file's
    // one check of its shape.
    assert.deepStrictEqual<unknown>(Result.getOrUndefined(decodeExactly(committed)), committed);

    // The plant: a field the Schema does not name, on every element row, fails it.
    const stray = {
      ...committed,
      elements: Object.fromEntries(
        Object.entries(committed.elements).map(([name, row]) => [name, { ...row, stray: true }]),
      ),
    };
    assert.isTrue(Result.isFailure(decodeExactly(stray)));
  });

  it("the committed file is the projection of the committed full tables", () => {
    assert.deepStrictEqual<unknown>(committed, projectSecuringTables(tables));

    // The plant: the projection of tables that drifted by one attribute is another file.
    assert.notDeepEqual<unknown>(committed, projectSecuringTables(driftedTables()));
  });

  it("the securing tables hold exactly the full tables' declared attributes and walk fields", () => {
    assert.deepStrictEqual(securingTables, securingView(tables));

    // The plant: a file whose div row names another attribute list expands to other tables.
    const file = projectSecuringTables(tables);
    const { div } = file.elements;
    assert.isDefined(div, "the file holds div");

    const misnamed = {
      ...file,
      elements: { ...file.elements, div: { ...div, attributes: div.attributes === 0 ? 1 : 0 } },
    };
    assert.notDeepEqual(expandSecuringTables(misnamed), securingView(tables));
  });

  it("is under 3% of the full tables' size, the reason a serving host loads it in their place", () => {
    assert.isBelow(size("securing-tables.generated.json") / size("tables.generated.json"), 0.03);
  });
});
