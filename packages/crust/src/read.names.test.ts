/**
 * The reader held to the name productions Namespaces in XML asks of every name a document gives:
 * a QName for an element type or attribute name, in a tag and in the DOCTYPE, ELEMENT and ATTLIST
 * declarations that name one (section 5, [12] to [21]), and an NCName for every other name XML 1.0
 * requires, an entity's, a notation's and a processing instruction target (section 7). The oracle
 * is the specification as a checker, its two tables transcribed here: which production each place
 * asks, and which names each production admits.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Result } from "effect";
import { readXml } from "#crust/read.ts";
import { caseHang, GENERATED_TIMEOUT_MS } from "#crust/test/trees.ts";

/**
 * The names a place is given, each an XML Name, with whether Namespaces in XML's [4] NCName and [7]
 * QName admit it: an NCName has no colon, and a QName is an NCName, or two joined by one colon.
 */
const NAMES = {
  ":b": { ncname: false, qname: false },
  "a:-b": { ncname: false, qname: false },
  "a:1b": { ncname: false, qname: false },
  "a:b": { ncname: false, qname: true },
  "a:b:c": { ncname: false, qname: false },
  "a:é": { ncname: false, qname: true },
  b: { ncname: true, qname: true },
  "b:": { ncname: false, qname: false },
  "é:b": { ncname: false, qname: true },
} as const satisfies Readonly<Record<string, { ncname: boolean; qname: boolean }>>;

/**
 * One name of {@link NAMES}.
 */
type Name = keyof typeof NAMES;

/**
 * The names, in a list.
 */
const NAME_LIST = [
  ":b",
  "a:-b",
  "a:1b",
  "a:b",
  "a:b:c",
  "a:é",
  "b",
  "b:",
  "é:b",
] as const satisfies readonly Name[];

/**
 * The declaration a tag gives a name's prefix, so the name is judged by its production alone: the
 * part before its first colon, when that part is a name of its own.
 *
 * @param name - The name.
 * @returns ` xmlns:prefix="urn:a"`, or nothing for a name with no prefix to declare.
 */
const declaring = (name: string): string => {
  const [prefix = ""] = name.split(":");

  return name.includes(":") && prefix !== "" ? ` xmlns:${prefix}="urn:a"` : "";
};

/**
 * The places a name stands, each with the production Namespaces in XML asks there and a document
 * that puts the name in it, the rest of the document well-formed. A name in a tag has its prefix
 * declared, so Prefix Declared does not decide the case.
 */
const PLACES = {
  "ATTLIST attribute name ([21] AttDef)": {
    document: (name: string) => `<!DOCTYPE r [<!ATTLIST r ${name} CDATA #IMPLIED>]><r/>`,
    production: "qname",
  },
  "ATTLIST element name ([20] AttlistDecl)": {
    document: (name: string) => `<!DOCTYPE r [<!ATTLIST ${name} a CDATA #IMPLIED>]><r/>`,
    production: "qname",
  },
  "DOCTYPE name ([16] doctypedecl)": {
    document: (name: string) => `<!DOCTYPE ${name}><r/>`,
    production: "qname",
  },
  "ELEMENT content model name ([18] cp)": {
    document: (name: string) => `<!DOCTYPE r [<!ELEMENT r (${name})*>]><r/>`,
    production: "qname",
  },
  "ELEMENT name ([17] elementdecl)": {
    document: (name: string) => `<!DOCTYPE r [<!ELEMENT ${name} EMPTY>]><r/>`,
    production: "qname",
  },
  "NDATA notation name": {
    document: (name: string) =>
      `<!DOCTYPE r [<!NOTATION n SYSTEM "n"><!ENTITY e SYSTEM "e" NDATA ${name}>]><r/>`,
    production: "ncname",
  },
  "NOTATION declaration name": {
    document: (name: string) => `<!DOCTYPE r [<!NOTATION ${name} SYSTEM "n">]><r/>`,
    production: "ncname",
  },
  "NOTATION type name": {
    document: (name: string) => `<!DOCTYPE r [<!ATTLIST r a NOTATION (${name}) #IMPLIED>]><r/>`,
    production: "ncname",
  },
  "attribute name in a tag ([15] Attribute)": {
    document: (name: string) => `<r${declaring(name)} ${name}="v"/>`,
    production: "qname",
  },
  "element name in a tag ([12] STag)": {
    document: (name: string) => `<${name}${declaring(name)}/>`,
    production: "qname",
  },
  "entity reference in a default": {
    document: (name: string) => `<!DOCTYPE r SYSTEM "x" [<!ATTLIST r a CDATA "&${name};">]><r/>`,
    production: "ncname",
  },
  "entity reference in an attribute value": {
    document: (name: string) => `<!DOCTYPE r SYSTEM "x"><r a="&${name};"/>`,
    production: "ncname",
  },
  "entity reference in an entity value": {
    document: (name: string) => `<!DOCTYPE r [<!ENTITY e "&${name};">]><r/>`,
    production: "ncname",
  },
  "entity reference in content": {
    document: (name: string) => `<!DOCTYPE r SYSTEM "x"><r>&${name};</r>`,
    production: "ncname",
  },
  "general entity name": {
    document: (name: string) => `<!DOCTYPE r [<!ENTITY ${name} "x">]><r/>`,
    production: "ncname",
  },
  "parameter entity name": {
    document: (name: string) => `<!DOCTYPE r [<!ENTITY % ${name} "">]><r/>`,
    production: "ncname",
  },
  "parameter entity reference": {
    document: (name: string) => `<!DOCTYPE r [%${name};]><r/>`,
    production: "ncname",
  },
  "processing instruction target in content": {
    document: (name: string) => `<r><?${name} x?></r>`,
    production: "ncname",
  },
  "processing instruction target in the internal subset": {
    document: (name: string) => `<!DOCTYPE r [<?${name} x?>]><r/>`,
    production: "ncname",
  },
} as const satisfies Readonly<
  Record<string, { document: (name: string) => string; production: "ncname" | "qname" }>
>;

/**
 * One place of {@link PLACES}.
 */
type Place = keyof typeof PLACES;

/**
 * The places, in a list.
 */
const PLACE_LIST = [
  "ATTLIST attribute name ([21] AttDef)",
  "ATTLIST element name ([20] AttlistDecl)",
  "DOCTYPE name ([16] doctypedecl)",
  "ELEMENT content model name ([18] cp)",
  "ELEMENT name ([17] elementdecl)",
  "NDATA notation name",
  "NOTATION declaration name",
  "NOTATION type name",
  "attribute name in a tag ([15] Attribute)",
  "element name in a tag ([12] STag)",
  "entity reference in a default",
  "entity reference in an attribute value",
  "entity reference in an entity value",
  "entity reference in content",
  "general entity name",
  "parameter entity name",
  "parameter entity reference",
  "processing instruction target in content",
  "processing instruction target in the internal subset",
] as const satisfies readonly Place[];

/**
 * One case: a name in a place.
 */
interface Named {
  readonly name: Name;
  readonly place: Place;
}

/**
 * Every case: each name in each place.
 */
const named: Gen<Named> = (source) => ({
  name: source.draw(element(NAME_LIST)),
  place: source.draw(element(PLACE_LIST)),
});

/**
 * The size of {@link named}'s box.
 */
const NAMED = NAME_LIST.length * PLACE_LIST.length;

describe("the reader holds every name to the production Namespaces in XML asks where it stands", () => {
  it.effect(
    `for every name of ${String(NAME_LIST.length)} in every place of ${String(PLACE_LIST.length)}, exhausted: ${String(NAMED)} documents`,
    (ctx) =>
      // Oracle: Namespaces in XML 1.0 (Third Edition) as a checker: section 5's [12] to [21] and
      // section 7 for which production each place asks, [4] NCName and [7] QName for which names
      // each admits, both transcribed above.
      searched(
        ctx,
        exhaust(
          {
            box: "every name of 9 in every place of 19, its production each place's",
            caseHang,
            coverage: requiredInSpace<"admitted" | "refused" | "ncname" | "qname">([
              "admitted",
              "refused",
              "ncname",
              "qname",
            ]),
            generator: named,
            limit: NAMED,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "Namespaces in XML 1.0 (Third Edition) sections 5 and 7, [4] NCName and [7] QName",
            },
            suite: "crust/read/names",
          },
          ({ name, place }, c) =>
            Effect.gen(function* holdsTheName() {
              const { document, production } = PLACES[place];
              const expected = NAMES[name][production];
              c.note(production);
              c.note(expected ? "admitted" : "refused");

              const text = document(name);
              const read = yield* Effect.result(readXml(new TextEncoder().encode(text)));

              assert.strictEqual(Result.isSuccess(read), expected, `${place}: ${text}`);
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, NAMED);
          }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );
});
