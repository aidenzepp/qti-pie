import { assert, describe, it } from "@effect/vitest";

import * as rosters from "#pantry/schema/content/rosters.ts";
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { Qti } from "#pantry/schema/qti.ts";
import type { Family } from "#pantry/schema/mathml/values.ts";
import { families } from "#pantry/schema/mathml/values.ts";

/**
 * Convert a lower-kebab handle or an XSD element name to PascalCase, splitting on `-` and `.`.
 *
 * @param text - The handle or local name.
 * @returns The PascalCase spelling, as spec 4.5 forms relation and arm names.
 */
const pascal = (text: string): string =>
  text
    .split(/[-.]/u)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join("");

/**
 * Find a family by handle, failing the test when the handle names none.
 *
 * @param handle - The `MathmlValueType` handle.
 * @returns The family.
 */
const familyOf = (handle: string): Family => {
  const found = families.find((family) => family.handle === handle);

  if (found === undefined) {
    return assert.fail(`${handle} is a family`);
  }

  return found;
};

/**
 * Find the family a pair belongs to, failing the test unless exactly one family holds it.
 *
 * @param kind - The kind handle.
 * @param attribute - The attribute name.
 * @returns The handle of the one family that routes the pair.
 */
const homeOf = (kind: string, attribute: string): string => {
  const homes = families.filter((family) =>
    family.pairs.some(([k, a]) => k === kind && a === attribute),
  );

  if (homes.length !== 1 || homes[0] === undefined) {
    return assert.fail(`${kind}/@${attribute} has one home, found ${homes.length}`);
  }

  return homes[0].handle;
};

/**
 * Join a pair into one key.
 *
 * @param kind - The kind handle.
 * @param attribute - The attribute name.
 * @returns The `kind/@attribute` key.
 */
const pairKey = (kind: string, attribute: string): string => `${kind}/@${attribute}`;

/**
 * The pairs the inventory declares that a family routes: every declared pair but `id`, `xref` and
 * the required `m:maction/@actiontype`, which are in no family.
 */
const leafPairs: readonly string[] = Object.entries(mathmlInventory).flatMap(([kind, entry]) =>
  entry.attributes
    .filter(
      (attribute) =>
        attribute.name !== "id" && attribute.name !== "xref" && attribute.use !== "required",
    )
    .map((attribute) => pairKey(kind, attribute.name)),
);

/**
 * Every name `Qti` declares as a relation, which includes the rosters it holds, and every name
 * `content/rosters.ts` exports. Once the MathML additions join them, this holds those additions
 * too, so the collision check subtracts the names MathML itself declares.
 */
const declaredNames: ReadonlySet<string> = new Set([
  ...Object.keys(Qti.relations),
  ...Object.keys(rosters),
]);

/**
 * The enumeration families, whose columns a roster types.
 */
const rosterFamilies = families.filter((family) => family.class === "roster");

/**
 * The families a new contract types: the contract-class families but the two that reuse phase 13's
 * `HyperlinkUri` and `EmbedSourceUri`.
 */
const newContractFamilies = families.filter(
  (family) =>
    family.class === "contract" &&
    family.valueType !== "HyperlinkUri" &&
    family.valueType !== "EmbedSourceUri",
);

/**
 * Count the families of a class.
 *
 * @param name - The class.
 * @returns How many families have it.
 */
const count = (name: Family["class"]): number =>
  families.filter((family) => family.class === name).length;

describe("the MathML attribute families", () => {
  it("are 67, each with a unique lower-kebab handle of at most 63 bytes", () => {
    assert.strictEqual(families.length, 67);
    assert.strictEqual(new Set(families.map((family) => family.handle)).size, 67);

    for (const { handle } of families) {
      assert.match(handle, /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u);
      assert.isAtMost(new TextEncoder().encode(handle).length, 63);
    }
  });

  it("split into 25 rosters, 26 patterns, 15 contracts and one tautology", () => {
    assert.deepStrictEqual(
      [count("roster"), count("pattern"), count("contract"), count("tautology")],
      [25, 26, 15, 1],
    );
    assert.strictEqual(families.find((f) => f.class === "tautology")?.valueType, "xsString");
  });

  it("name the relation Mathml plus the PascalCase handle, and the value type by class", () => {
    for (const family of families) {
      const name = pascal(family.handle);

      assert.strictEqual(family.relation, `Mathml${name}`);

      if (family.class === "roster") {
        assert.strictEqual(family.valueType, `Mathml${name}Value`);
      } else if (family.class === "pattern") {
        assert.strictEqual(family.valueType, `mathml${name}`);
      }
    }
  });

  it("route 1,484 pairs, each leaf pair but id, xref and actiontype exactly once", () => {
    const routed = families.flatMap((family) =>
      family.pairs.map(([kind, attribute]) => pairKey(kind, attribute)),
    );

    assert.strictEqual(routed.length, 1484);
    assert.strictEqual(new Set(routed).size, 1484);
    assert.deepStrictEqual(routed.toSorted(), leafPairs.toSorted());
    assert.isTrue(
      families.every((family) =>
        family.pairs.every(
          ([kind, attribute]) => !["id", "xref"].includes(attribute) && kind !== "",
        ),
      ),
    );
    assert.isFalse(routed.includes(pairKey("m:maction", "actiontype")));
  });

  /**
   * "Existing" means the names the schema had without MathML: the declared names minus the ones
   * this case's `added` list declares, so the check keeps failing for a real collision once the
   * rosters (p6-11) and the arms (p6-21) join `Qti.relations`.
   */
  it("keep the arm, relation, roster and contract names pairwise distinct from the existing names", () => {
    const arms = Object.keys(mathmlInventory).map((handle) => `Mathml${pascal(handle.slice(2))}`);
    const rosterNames = [...rosterFamilies.map((family) => family.valueType), "MathmlValueType"];
    const contractNames = [
      ...newContractFamilies.map((family) => family.valueType),
      "MathmlCbytesValue",
    ];

    assert.strictEqual(arms.length, 194);
    assert.strictEqual(rosterNames.length, 26);
    assert.strictEqual(contractNames.length, 14);

    const added = [
      ...families.map((family) => family.relation),
      ...rosterNames,
      ...contractNames,
      ...arms,
    ];

    assert.strictEqual(new Set(added).size, added.length);

    for (const name of rosterNames) {
      assert.isTrue(declaredNames.has(name), `${name} is declared by rosters.ts`);
    }

    const addedNames = new Set(added);
    const existingNames = new Set([...declaredNames].filter((name) => !addedNames.has(name)));

    for (const name of added) {
      assert.isFalse(existingNames.has(name), `${name} is not an existing declared name`);
    }
  });

  it("give the three widths three families", () => {
    const widths = [
      homeOf("m:mspace", "width"),
      homeOf("m:mpadded", "width"),
      homeOf("m:mtable", "width"),
    ];

    assert.deepStrictEqual(widths, ["length", "mpadded-length", "table-width"]);
    assert.strictEqual(new Set(widths).size, 3);
  });

  it("keep cn/@base and interval/@closure out of the tautology", () => {
    assert.strictEqual(homeOf("m:cn", "base"), "base");
    assert.strictEqual(homeOf("m:interval", "closure"), "closure");
    assert.strictEqual(familyOf("base").class, "contract");
    assert.strictEqual(familyOf("closure").class, "roster");
    assert.notStrictEqual(familyOf("string").class, "contract");
    assert.isFalse(familyOf("string").pairs.some(([k, a]) => pairKey(k, a) === "m:cn/@base"));
    assert.isFalse(
      familyOf("string").pairs.some(([k, a]) => pairKey(k, a) === "m:interval/@closure"),
    );
  });

  it("share embed-source between mglyph/@src and math/@altimg, and keep share/@src apart", () => {
    const embed = homeOf("m:mglyph", "src");

    assert.strictEqual(embed, "embed-source");
    assert.strictEqual(homeOf("m:math", "altimg"), embed);
    assert.strictEqual(familyOf(embed).valueType, "EmbedSourceUri");
    assert.strictEqual(homeOf("m:share", "src"), "src");
    assert.notStrictEqual(homeOf("m:share", "src"), embed);
    assert.strictEqual(familyOf("href").valueType, "HyperlinkUri");
  });

  it("type the twelve true false attributes as boolean", () => {
    const attributes = [
      "accent",
      "accentunder",
      "bevelled",
      "displaystyle",
      "equalcolumns",
      "equalrows",
      "fence",
      "largeop",
      "movablelimits",
      "separator",
      "stretchy",
      "symmetric",
    ];
    const boolean = familyOf("boolean");

    assert.deepStrictEqual(
      [...new Set(boolean.pairs.map(([, attribute]) => attribute))].toSorted(),
      attributes,
    );
    assert.strictEqual(boolean.class, "roster");
    assert.strictEqual(boolean.pairs.length, 39);
  });

  it("split the table spans from the other positive integers", () => {
    assert.strictEqual(homeOf("m:mtd", "rowspan"), "span");
    assert.strictEqual(homeOf("m:mtd", "columnspan"), "span");
    assert.strictEqual(familyOf("span").valueType, "MathmlSpanValue");
    assert.strictEqual(homeOf("m:maction", "selection"), "selection");
  });
});
