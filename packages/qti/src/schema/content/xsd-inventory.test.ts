import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";

import { kinds as asiKinds } from "#qti/schema/kinds/asi.ts";
import { kinds as htmlKinds } from "#qti/schema/kinds/html.ts";
import type { InventoryAttribute } from "#qti/schema/content/xsd-inventory.ts";
import { entryOf, inventory } from "#qti/schema/content/xsd-inventory.ts";
import { asiInventory } from "#qti/schema/content/inventory/asi.ts";
import { htmlInventory } from "#qti/schema/content/inventory/html.ts";

/**
 * Find a declared attribute of a kind, failing the test when the kind or attribute is absent.
 *
 * @param handle - The kind handle.
 * @param name - The attribute name.
 * @returns The attribute row.
 */
const attributeOf = (handle: string, name: string): InventoryAttribute => {
  const { attributes } = Option.getOrThrow(entryOf(handle));
  const found = attributes.find((attribute) => attribute.name === name);

  if (found === undefined) {
    return assert.fail(`${handle} declares ${name}`);
  }

  return found;
};

/**
 * Count attribute declarations by `whiteSpace` class over the given entries.
 *
 * @param entries - Inventory entries to count.
 * @returns The declaration count per class.
 */
const countByClass = (
  entries: readonly { readonly attributes: readonly InventoryAttribute[] }[],
): Record<InventoryAttribute["whiteSpace"], number> => {
  const counts = { collapse: 0, preserve: 0, replace: 0, union: 0 };

  for (const entry of entries) {
    for (const attribute of entry.attributes) {
      counts[attribute.whiteSpace] += 1;
    }
  }

  return counts;
};

describe("xsd inventory completeness", () => {
  it("holds 69 ASI and 76 HTML entries", () => {
    assert.strictEqual(Object.keys(asiInventory).length, 69);
    assert.strictEqual(Object.keys(htmlInventory).length, 76);
    assert.strictEqual(Object.keys(inventory).length, 145);
  });

  it("names every handle the kinds files hold", () => {
    for (const handle of [...asiKinds, ...htmlKinds]) {
      assert.isTrue(Option.isSome(entryOf(handle)), `${handle} has an entry`);
    }
  });

  it("keys each entry by its own handle", () => {
    for (const [handle, entry] of Object.entries(inventory)) {
      assert.strictEqual(entry.handle, handle);
    }
  });

  it("holds the twelve dotted ASI handles", () => {
    for (const handle of [
      "qti-content-body.feedback",
      "qti-content-body.modal",
      "qti-content-body.rubric",
      "qti-content-body.rubricTemplate",
      "qti-content-body.template",
      "qti-feedback-block",
      "qti-feedback-block.template",
      "qti-rubric-block",
      "qti-template-block",
      "qti-template-block.rubric",
      "qti-template-inline",
      "qti-template-inline.rubric",
    ]) {
      assert.isTrue(Option.isSome(entryOf(handle)), `${handle} has an entry`);
    }
    assert.isTrue(Option.isNone(entryOf("qti-content-body")));
    assert.isTrue(Option.isNone(entryOf("constructor")));
  });
});

describe("xsd inventory facts", () => {
  it("requires qti-end-attempt-interaction's title", () => {
    assert.strictEqual(attributeOf("qti-end-attempt-interaction", "title").use, "required");
  });

  it("requires qti-media-interaction's autostart", () => {
    assert.strictEqual(attributeOf("qti-media-interaction", "autostart").use, "required");
  });

  it("requires the slider bounds and defaults its step", () => {
    assert.strictEqual(attributeOf("qti-slider-interaction", "lower-bound").use, "required");
    assert.strictEqual(attributeOf("qti-slider-interaction", "upper-bound").use, "required");
    assert.deepStrictEqual(
      attributeOf("qti-slider-interaction", "step").default,
      Option.some("1.0"),
    );
  });

  it("holds exactly two simple match sets in a match interaction", () => {
    const { children } = Option.getOrThrow(entryOf("qti-match-interaction"));
    assert.deepStrictEqual(
      children.find((child) => child.name === "qti-simple-match-set"),
      { max: Option.some(2), min: 2, name: "qti-simple-match-set" },
    );
  });

  it("defaults select-point's max-choices to zero", () => {
    assert.deepStrictEqual(
      attributeOf("qti-select-point-interaction", "max-choices").default,
      Option.some("0"),
    );
  });

  it("requires a modal feedback's show-hide with no default", () => {
    const attribute = attributeOf("qti-modal-feedback", "show-hide");
    assert.strictEqual(attribute.use, "required");
    assert.isTrue(Option.isNone(attribute.default));
  });

  it("gives a simple associable choice no fixed or show-hide default", () => {
    assert.isTrue(Option.isNone(attributeOf("qti-simple-associable-choice", "fixed").default));
    assert.isTrue(Option.isNone(attributeOf("qti-simple-associable-choice", "show-hide").default));
  });

  it("types the response and string identifiers", () => {
    assert.strictEqual(
      attributeOf("qti-text-entry-interaction", "response-identifier").type,
      "UniqueIdentifierRefDType",
    );
    assert.strictEqual(
      attributeOf("qti-text-entry-interaction", "string-identifier").type,
      "UniqueIdentifierRefDType",
    );
    assert.strictEqual(
      attributeOf("qti-extended-text-interaction", "string-identifier").type,
      "IdentifierDType",
    );
  });
});

describe("xsd inventory whiteSpace classes", () => {
  it("classes the base families on p", () => {
    assert.strictEqual(attributeOf("p", "class").whiteSpace, "collapse");
    assert.strictEqual(attributeOf("p", "lang").whiteSpace, "replace");
    assert.strictEqual(attributeOf("p", "label").whiteSpace, "replace");
    assert.strictEqual(attributeOf("p", "dir").whiteSpace, "preserve");
  });

  it("marks the printed variable's base as a union", () => {
    assert.strictEqual(attributeOf("qti-printed-variable", "base").whiteSpace, "union");
  });

  it("assigns each attribute its family", () => {
    assert.strictEqual(attributeOf("p", "id").family, "base");
    assert.strictEqual(attributeOf("p", "role").family, "aria");
    assert.strictEqual(attributeOf("p", "aria-label").family, "aria");
    assert.strictEqual(attributeOf("qti-choice-interaction", "shuffle").family, "own");
  });

  it("reproduces the spec's declaration totals once the excluded M4 type is added", () => {
    // Phase-2 spec 3.9 prints 4254, 2071, 399 and 4 over the 140 names. Its walk also counts the 37, 18,
    // 3 and 1 declarations of TestRubricBlockDType, the test vocabulary's `qti-rubric-block`, which
    // the inventory's roster omits.
    const counts = countByClass(Object.values(inventory));
    assert.deepStrictEqual(
      {
        collapse: counts.collapse + 37,
        preserve: counts.preserve + 18,
        replace: counts.replace + 3,
        union: counts.union + 1,
      },
      { collapse: 4254, preserve: 2071, replace: 399, union: 4 },
    );
  });
});
