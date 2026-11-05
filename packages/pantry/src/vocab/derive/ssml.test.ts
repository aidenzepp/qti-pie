import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { ssmlSchemaOf } from "#pantry/vocab/derive/ssml.ts";

/**
 * Parse an XSD written out in a test, as crust reads the pinned files.
 *
 * @param text - The schema document.
 * @returns Its tree.
 */
const xsd = (text: string) => readXml(new TextEncoder().encode(text));

/**
 * A no-namespace schema like SSML's: one element `a` of type `a`, with two optional attributes and
 * a lax wildcard for attributes of other namespaces.
 */
const chameleon = `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:element name="a" type="a"/>
  <xsd:complexType name="a" mixed="true">
    <xsd:attribute name="x" type="xsd:token"/>
    <xsd:attribute name="y" type="xsd:string"/>
    <xsd:anyAttribute namespace="##other" processContents="lax"/>
  </xsd:complexType>
</xsd:schema>`;

/**
 * A core profile like SSML's: it redefines {@link chameleon} into `urn:t` with the given
 * redefinition of `a`.
 *
 * @param location - The `schemaLocation` the redefine names.
 * @param redefinition - The `xsd:complexType` it holds.
 * @returns The schema document.
 */
const core = (location: string, redefinition: string): string =>
  `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="urn:t" targetNamespace="urn:t" elementFormDefault="qualified">
  <xsd:redefine schemaLocation="${location}">${redefinition}</xsd:redefine>
</xsd:schema>`;

/**
 * A redefinition of `a` that makes `x` required and keeps the wildcard.
 */
const requiringX = `<xsd:complexType name="a" mixed="true">
  <xsd:complexContent>
    <xsd:restriction base="a">
      <xsd:attribute name="x" type="xsd:token" use="required"/>
      <xsd:anyAttribute namespace="##other" processContents="lax"/>
    </xsd:restriction>
  </xsd:complexContent>
</xsd:complexType>`;

/**
 * Read the SSML schema from two schema texts, failing the test when either is not well-formed.
 *
 * @param base - The no-namespace schema.
 * @param including - The core profile.
 * @returns The reading.
 */
const readPair = Effect.fn("test.readPair")(function* readPair(base: string, including: string) {
  return ssmlSchemaOf(yield* xsd(base), yield* xsd(including));
});

describe("vocab/derive/ssml.ts reading rules", () => {
  it.effect(
    "reads the no-namespace file into the core's namespace, its redefinition kept apart",
    () =>
      Effect.gen(function* redefinition() {
        const read = yield* readPair(chameleon, core("synthesis-nonamespace.xsd", requiringX));
        const ssml = Result.getOrElse(read, (failure) => assert.fail(failure.message));

        assert.strictEqual(ssml.schema.targetNamespace, "urn:t");
        assert.deepStrictEqual([...ssml.redefined], ["a"]);
        assert.deepStrictEqual([...ssml.schema.complexTypes.keys()], ["a", "a#redefined"]);
      }),
  );

  it.effect("refuses a core that redefines another file", () =>
    Effect.gen(function* otherFile() {
      const read = yield* readPair(chameleon, core("other.xsd", requiringX));

      assert.include(
        Result.match(read, { onFailure: (error) => error.message, onSuccess: () => "" }),
        "the core redefines other.xsd, not synthesis-nonamespace.xsd",
      );
    }),
  );

  it.effect("refuses a redefinition that is no restriction of the type it redefines", () =>
    Effect.gen(function* extension() {
      const read = yield* readPair(
        chameleon,
        core(
          "synthesis-nonamespace.xsd",
          '<xsd:complexType name="a"><xsd:complexContent><xsd:extension base="a"/></xsd:complexContent></xsd:complexType>',
        ),
      );

      assert.include(
        Result.match(read, { onFailure: (error) => error.message, onSuccess: () => "" }),
        "the redefinition of a is not a complexContent restriction of a",
      );
    }),
  );
});
