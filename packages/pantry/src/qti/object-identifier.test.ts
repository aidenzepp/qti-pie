/**
 * The identifier a program keys a test by, beside its package: {@link ObjectIdentifier}'s
 * `identifier`, the collapsed `identifier` of a test's or an item's root, a {@link keyText} (spec
 * readings 94, 133 and 148).
 *
 * A key over a text whose type bounds no bytes, or an index a program's access path earns over one,
 * is refused by grizzle (`UnrepresentableKey`), so a program over `Qti` that keys a test by its
 * package and its identifier, as a ledger that addresses a test by the two does, reads the
 * identifier from a bounded field. The root's own `Attribute.lexical` is unbounded.
 * `ObjectIdentifier` holds the root's value, held to the attribute both ways by containment and
 * split by `E1_derived` (`#pantry/qti/metadata.ts`), the one representation of a root's identifier,
 * as `TestToken` is of a test part's, a section's and an item ref's (`#pantry/qti/tests.ts`).
 */
import { CompileError, keyTextBytes, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { Attribute } from "#pantry/qti/attributes.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { ObjectIdentifier } from "#pantry/qti/metadata.ts";
import { objectKinds } from "#pantry/vocab/terms/metadata.ts";
import { itemKind, testKind } from "#pantry/vocab/terms/tests.ts";

describe("qti/metadata.ts ObjectIdentifier, the root identifier a program keys by", () => {
  it("copies the identifier of a test's root, as of an item's", () => {
    // Oracle: the ASI XSD, `AssessmentTestDType` and `AssessmentItemDType` each requiring an
    // `identifier` (spec reading 148): `ObjectIdentifier`'s source selection reads exactly the
    // roots of these kinds. Bound: the two root kinds; a plant that drops the test's kind fails.
    assert.sameMembers([...objectKinds], [itemKind, testKind]);
  });

  it("holds the identifier in a text a key holds beside a package, where the attribute's own text is UnrepresentableKey", () => {
    // Oracle: grizzle's own representability rule, `keyTextBytes(fields)`, the measure that
    // refuses a key or an index over its fields as `UnrepresentableKey` (public/text.ts of the
    // vendored engine). Bound: the key `(package, identifier)` beside one more text, over the
    // copy's type and over the attribute's, the plant a program keyed on before the copy.
    assert.strictEqual(
      keyTextBytes([uuid, ObjectIdentifier.fields.identifier]),
      keyTextBytes([uuid, keyText]),
    );

    const unbounded = Result.try({
      catch: (error) => error,
      try: () => keyTextBytes([uuid, Attribute.fields.lexical]),
    });
    assert.isTrue(
      Result.isFailure(unbounded) &&
        unbounded.failure instanceof CompileError &&
        unbounded.failure.reason._tag === "UnrepresentableKey",
      "a key over the attribute's own text is refused as UnrepresentableKey",
    );
  });
});
