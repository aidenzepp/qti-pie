/**
 * The reader held to three tables of XML 1.0 that crust states as data, each case drawn from the
 * table as the specification prints it: the attribute types of section 3.3.1 and the normalization
 * section 3.3.3 gives each, the five predefined entities of section 4.6 in every place a reference
 * reads one, and the comments production [15] admits in the internal subset.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Result } from "effect";
import { readXml } from "#crust/read.ts";
import { caseHang, GENERATED_TIMEOUT_MS } from "#crust/test/trees.ts";
import type { XmlDocument } from "#crust/tree.ts";

/**
 * Read a document's text.
 *
 * @param text - The document.
 * @returns The tree, or the refusal.
 */
const read = (text: string) => Effect.result(readXml(new TextEncoder().encode(text)));

/**
 * The attribute types of XML 1.0 section 3.3.1, as printed: [55] StringType, [56] TokenizedType,
 * [58] NotationType and [59] Enumeration, each declared with what its declaration needs after the
 * keyword; and keywords the productions do not hold, which are refused: a type in the wrong case,
 * SGML's declared values that XML left out (ISO 8879 section 11.3.3: NAME, NAMES, NUMBER, NUMBERS,
 * NUTOKEN and NUTOKENS), and a type XML Schema has.
 */
const ATTRIBUTE_TYPES = {
  CDATA: { declared: "CDATA", normalized: false },
  ENTITIES: { declared: "ENTITIES", normalized: true },
  ENTITY: { declared: "ENTITY", normalized: true },
  ID: { declared: "ID", normalized: true },
  IDREF: { declared: "IDREF", normalized: true },
  IDREFS: { declared: "IDREFS", normalized: true },
  "IDREFX, no type": { declared: "IDREFX", normalized: undefined },
  "NAME, SGML's": { declared: "NAME", normalized: undefined },
  "NAMES, SGML's": { declared: "NAMES", normalized: undefined },
  NMTOKEN: { declared: "NMTOKEN", normalized: true },
  NMTOKENS: { declared: "NMTOKENS", normalized: true },
  NOTATION: { declared: "NOTATION (x)", normalized: true },
  "NUMBER, SGML's": { declared: "NUMBER", normalized: undefined },
  "NUMBERS, SGML's": { declared: "NUMBERS", normalized: undefined },
  "NUTOKEN, SGML's": { declared: "NUTOKEN", normalized: undefined },
  "NUTOKENS, SGML's": { declared: "NUTOKENS", normalized: undefined },
  "STRING, XML Schema's": { declared: "STRING", normalized: undefined },
  "an enumeration": { declared: "(x|y)", normalized: true },
  "cdata, in the wrong case": { declared: "cdata", normalized: undefined },
} as const satisfies Readonly<
  Record<string, { readonly declared: string; readonly normalized: boolean | undefined }>
>;

/**
 * One type of {@link ATTRIBUTE_TYPES}.
 */
type AttributeType = keyof typeof ATTRIBUTE_TYPES;

/**
 * The types, in a list.
 */
const TYPE_LIST = [
  "CDATA",
  "ENTITIES",
  "ENTITY",
  "ID",
  "IDREF",
  "IDREFS",
  "NMTOKEN",
  "NMTOKENS",
  "NOTATION",
  "an enumeration",
  "cdata, in the wrong case",
  "IDREFX, no type",
  "NAME, SGML's",
  "NAMES, SGML's",
  "NUMBER, SGML's",
  "NUMBERS, SGML's",
  "NUTOKEN, SGML's",
  "NUTOKENS, SGML's",
  "STRING, XML Schema's",
] as const satisfies readonly AttributeType[];

/**
 * The default values a declaration gives: spaces around and between two tokens, one token, none,
 * and a leading space.
 */
const DEFAULT_VALUES = ["  x  y  ", "x", "", " x"] as const;

/**
 * Normalize a default value as section 3.3.3 says for a type other than CDATA: "discarding any
 * leading and trailing space (#x20) characters, and by replacing sequences of space (#x20)
 * characters by a single space (#x20) character".
 *
 * @param value - The value, CDATA-normalized.
 * @returns The value, further normalized.
 */
const tokenized = (value: string): string =>
  value
    .split(" ")
    .filter((token) => token !== "")
    .join(" ");

/**
 * The value the root holds for its attribute `a`, or `undefined` when it holds none.
 *
 * @param document - The tree.
 * @returns The value.
 */
const valueOfA = (document: XmlDocument): string | undefined =>
  document.root.attributes.find(({ qname }) => qname === "a")?.value;

/**
 * One case of the attribute-type box.
 */
interface Typed {
  readonly type: AttributeType;
  readonly value: (typeof DEFAULT_VALUES)[number];
}

/**
 * Every type under every default value.
 */
const typed: Gen<Typed> = (source) => ({
  type: source.draw(element(TYPE_LIST)),
  value: source.draw(element(DEFAULT_VALUES)),
});

/**
 * The five predefined entities of section 4.6 and the character each stands for.
 */
const PREDEFINED = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"' } as const;

/**
 * One predefined entity's name.
 */
type Predefined = keyof typeof PREDEFINED;

/**
 * The predefined entities, in a list.
 */
const PREDEFINED_LIST = [
  "amp",
  "apos",
  "gt",
  "lt",
  "quot",
] as const satisfies readonly Predefined[];

/**
 * The places a reference to a predefined entity is read, each a document that puts `&name;` there
 * and reads back the character it stood for: content, an attribute value, an attribute-list
 * default, and an entity's value that content then references.
 */
const REFERENCE_PLACES = {
  "an attribute value": {
    document: (name: Predefined) => `<r a="&${name};"/>`,
    read: valueOfA,
  },
  "an attribute-list default": {
    document: (name: Predefined) => `<!DOCTYPE r [<!ATTLIST r a CDATA "&${name};">]><r/>`,
    read: valueOfA,
  },
  "an entity's value, referenced in content": {
    document: (name: Predefined) => `<!DOCTYPE r [<!ENTITY e "&${name};">]><r>&e;</r>`,
    read: (document: XmlDocument) =>
      document.root.children.map((child) => (child.kind === "text" ? child.value : "?")).join(""),
  },
  content: {
    document: (name: Predefined) => `<r>&${name};</r>`,
    read: (document: XmlDocument) =>
      document.root.children.map((child) => (child.kind === "text" ? child.value : "?")).join(""),
  },
} as const;

/**
 * One place of {@link REFERENCE_PLACES}.
 */
type ReferencePlace = keyof typeof REFERENCE_PLACES;

/**
 * The places, in a list.
 */
const REFERENCE_PLACE_LIST = [
  "an attribute value",
  "an attribute-list default",
  "an entity's value, referenced in content",
  "content",
] as const satisfies readonly ReferencePlace[];

/**
 * One case of the predefined-entity box.
 */
interface Referenced {
  readonly name: Predefined;
  readonly place: ReferencePlace;
}

/**
 * Every predefined entity in every place.
 */
const referenced: Gen<Referenced> = (source) => ({
  name: source.draw(element(PREDEFINED_LIST)),
  place: source.draw(element(REFERENCE_PLACE_LIST)),
});

/**
 * The comments production [15] admits: `'<!--' ((Char - '-') | ('-' (Char - '-')))* '-->'`, a
 * hyphen always followed by another character, so the body holds no `--` and does not end with a
 * hyphen.
 */
const comment = /^(?:[^-]|-[^-])*$/u;

/**
 * The most characters a comment body of the box holds.
 */
const LONGEST_COMMENT = 4;

/**
 * Every comment body of up to {@link LONGEST_COMMENT} characters over a hyphen and a letter.
 */
const commentBody: Gen<readonly ("-" | "a")[]> = array(element(["-", "a"] as const), {
  max: LONGEST_COMMENT,
  min: 0,
});

describe("the reader holds XML 1.0's tables as the specification prints them", () => {
  it.effect(
    `normalizes every attribute type's default as section 3.3.3 says, and refuses a keyword section 3.3.1 does not hold, exhausted: ${String(TYPE_LIST.length * DEFAULT_VALUES.length)} documents`,
    (ctx) =>
      // Oracle: the specification as a checker, section 3.3.1's [54] to [59] for the types and
      // section 3.3.3's normalization for each, transcribed above.
      searched(
        ctx,
        exhaust(
          {
            box: "every attribute type of section 3.3.1 and nine keywords it does not hold, under 4 default values",
            caseHang,
            coverage: requiredInSpace<"kept" | "normalized" | "refused">([
              "kept",
              "normalized",
              "refused",
            ]),
            generator: typed,
            limit: TYPE_LIST.length * DEFAULT_VALUES.length,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "XML 1.0 sections 3.3.1 and 3.3.3" },
            suite: "crust/dtd/attribute-types",
          },
          ({ type, value }, c) =>
            Effect.gen(function* normalizesAsTyped() {
              const { declared, normalized } = ATTRIBUTE_TYPES[type];
              const text = `<!DOCTYPE r [<!ATTLIST r a ${declared} "${value}">]><r/>`;
              const result = yield* read(text);
              if (normalized === undefined) {
                c.note("refused");
                assert.isTrue(Result.isFailure(result), text);

                return;
              }

              c.note(normalized ? "normalized" : "kept");
              assert.strictEqual(
                Result.isSuccess(result) ? valueOfA(result.success) : "refused",
                normalized ? tokenized(value) : value,
                text,
              );
            }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `reads every predefined entity of section 4.6 as its character in every place a reference is read, exhausted: ${String(PREDEFINED_LIST.length * REFERENCE_PLACE_LIST.length)} documents`,
    (ctx) =>
      // Oracle: section 4.6's table of the five entities, transcribed above, read in content, in an
      // attribute value, in a default (section 3.3.3, "an entity reference ... is replaced") and in
      // an entity's value, which bypasses it until the entity is used (section 4.4.7).
      searched(
        ctx,
        exhaust(
          {
            box: "the 5 predefined entities in 4 places",
            caseHang,
            coverage: requiredInSpace<Predefined>(["amp", "apos", "gt", "lt", "quot"]),
            generator: referenced,
            limit: PREDEFINED_LIST.length * REFERENCE_PLACE_LIST.length,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "XML 1.0 section 4.6" },
            suite: "crust/dtd/predefined",
          },
          ({ name, place }, c) =>
            Effect.gen(function* readsTheCharacter() {
              c.note(name);

              const { document, read: readBack } = REFERENCE_PLACES[place];
              const text = document(name);
              const result = yield* read(text);

              assert.strictEqual(
                Result.isSuccess(result) ? readBack(result.success) : "refused",
                PREDEFINED[name],
                text,
              );
            }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `admits in the internal subset exactly the comments production [15] admits, exhausted: ${String(2 ** (LONGEST_COMMENT + 1) - 1)} bodies`,
    (ctx) =>
      // Oracle: production [15] Comment, transcribed as a pattern over the body. Bound: every body
      // of 0 to 4 characters over a hyphen and a letter.
      searched(
        ctx,
        exhaust(
          {
            box: "every comment body of 0 to 4 characters over - and a",
            caseHang,
            coverage: requiredInSpace<"admitted" | "refused">(["admitted", "refused"]),
            generator: commentBody,
            limit: 2 ** (LONGEST_COMMENT + 1) - 1,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "XML 1.0 production [15] Comment" },
            suite: "crust/dtd/comments",
          },
          (characters, c) =>
            Effect.gen(function* admitsTheComment() {
              const body = characters.join("");
              const expected = comment.test(body);
              c.note(expected ? "admitted" : "refused");

              const text = `<!DOCTYPE r [<!--${body}-->]><r/>`;

              assert.strictEqual(Result.isSuccess(yield* read(text)), expected, text);
            }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );
});
