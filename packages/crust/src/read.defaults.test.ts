/**
 * Attribute defaults as `readXml` reads them, held to a model of XML 1.0 written from the
 * specification: section 3.3.3's normalization of a default's value, and section 4.1's
 * well-formedness constraint "Entity Declared", which binds a reference in a default exactly as it
 * binds one in the body.
 *
 * The model (`modelOf`) reads a default as units, one per character its value holds and one per
 * reference no declaration supplies, and normalizes the units directly, never through the reader's
 * pieces. Each example below also records libxml2's verdict on its document (`xmllint --noout`,
 * libxml2 2.9.13): exit 0 for every document the reader accepts, exit 1 for every one it refuses,
 * but one. Beside an external subset, a default that names an entity the internal subset declares
 * after it breaks section 4.1's validity constraint, and the reader refuses it as it refuses the
 * well-formedness one; libxml2 reports it as "Entity 'e' not defined", a warning without
 * `--valid`.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { readXml } from "#crust/read.ts";
import type { Attribute, XmlDocument } from "#crust/tree.ts";
import { writeXml } from "#crust/write.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 18.1 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * Read a document's text as UTF-8.
 *
 * @param text - The document.
 * @returns The tree, or the reader's failure.
 */
const read = (text: string) => readXml(new TextEncoder().encode(text));

/**
 * Hold a tree to its round trip: written and read again, it is the same tree.
 *
 * @param document - The tree.
 * @param what - The case, for the failure.
 * @returns Nothing; fails the case when the trip changes the tree.
 */
const roundTrips = (document: XmlDocument, what: string) =>
  Effect.gen(function* roundTrip() {
    const again = yield* read(yield* writeXml(document));

    assert.deepStrictEqual(again.root, document.root, what);
  });

/**
 * The rule of a refusal, or `accepted`.
 *
 * @param text - The document.
 * @returns What the reader did with it.
 */
const verdictOf = (text: string) =>
  read(text).pipe(
    Effect.match({
      onFailure: (refusal) => (refusal._tag === "ReaderRefusal" ? refusal.rule : refusal._tag),
      onSuccess: () => "accepted",
    }),
  );

describe("an attribute default's references", () => {
  it.effect(
    "are text where the default writes & as &amp; or &#38;, directly or through an entity",
    () =>
      Effect.gen(function* ampersandsAreText() {
        // xmllint: exit 0, each value x&y; with no reference.
        for (const subset of [
          '<!ATTLIST r a CDATA "x&amp;y;">',
          '<!ATTLIST r a CDATA "x&#38;y;">',
          '<!ENTITY e "x&#38;#38;y;"><!ATTLIST r a CDATA "&e;">',
          '<!ENTITY e "x&#38;amp;y;"><!ATTLIST r a CDATA "&e;">',
        ]) {
          const document = yield* read(`<!DOCTYPE r [${subset}]><r/>`);

          assert.deepStrictEqual(
            document.root.attributes,
            [{ local: "a", namespace: "", prefix: "", qname: "a", references: [], value: "x&y;" }],
            subset,
          );
          yield* roundTrips(document, subset);
        }
      }),
  );

  it.effect(
    "are refused when no declaration can exist, no external subset or standalone yes, whether the default is used or not, and when the internal subset declares the entity after the default",
    () =>
      Effect.gen(function* undeclaredRefused() {
        // xmllint: exit 1, "Entity 'u' not defined", for every one.
        for (const text of [
          '<!DOCTYPE r [<!ATTLIST r a CDATA "&u;">]><r/>',
          '<!DOCTYPE r [<!ATTLIST r a CDATA "&u;">]><r a="x"/>',
          '<!DOCTYPE s [<!ATTLIST r a CDATA "&u;">]><s/>',
          '<!DOCTYPE r [<!ATTLIST r a CDATA "x"><!ATTLIST r a CDATA "&u;">]><r/>',
          '<!DOCTYPE r [<!ATTLIST r a CDATA #FIXED "&u;">]><r/>',
          '<!DOCTYPE r [<!ENTITY e "&u;"><!ATTLIST r a CDATA "&e;">]><r/>',
          '<!DOCTYPE r [<!ATTLIST r a CDATA "&e;"><!ENTITY e "x">]><r/>',
          '<?xml version="1.0" standalone="yes"?><!DOCTYPE r SYSTEM "r.dtd" [<!ATTLIST r a CDATA "&u;">]><r/>',
          // xmllint: exit 0, warning "Entity 'e' not defined"; the declaration follows the use.
          '<!DOCTYPE r SYSTEM "r.dtd" [<!ATTLIST r a CDATA "&e;"><!ENTITY e "x">]><r/>',
          '<!DOCTYPE r SYSTEM "r.dtd" [<!ATTLIST r a CDATA "&e;"><!ENTITY e SYSTEM "e.ent">]><r/>',
        ]) {
          assert.strictEqual(yield* verdictOf(text), "undeclared-entity", text);
        }
      }),
  );

  it.effect(
    "are kept as references where an external subset may declare them, and the tree round-trips",
    () =>
      Effect.gen(function* undeclaredKept() {
        // xmllint: exit 0, warning "Entity 'u' not defined", value "xy".
        const text = '<!DOCTYPE r SYSTEM "r.dtd" [<!ATTLIST r a CDATA "x&u;y">]><r/>';
        const document = yield* read(text);

        assert.deepStrictEqual(document.root.attributes, [
          {
            local: "a",
            namespace: "",
            prefix: "",
            qname: "a",
            references: [{ name: "u", offset: 1 }],
            value: "x&u;y",
          },
        ]);
        yield* roundTrips(document, text);
      }),
  );

  it.effect(
    "never read a default's private use character as the stand-in of a body reference",
    () =>
      Effect.gen(function* standInsApart() {
        // The body's undeclared u takes the first free private use character, U+E000, which the
        // default holds by a character reference; xmllint: exit 0.
        const document = yield* read(
          '<!DOCTYPE r SYSTEM "r.dtd" [<!ATTLIST r a CDATA "&#xE000;">]><r>&u;</r>',
        );

        assert.deepStrictEqual(document.root.attributes, [
          { local: "a", namespace: "", prefix: "", qname: "a", references: [], value: "" },
        ]);
        assert.deepStrictEqual(document.root.children, [{ kind: "entityRef", name: "u" }]);
      }),
  );
});

describe("a non-CDATA attribute's value", () => {
  it.effect(
    "keeps the tab and the no-break space a character reference wrote at its ends, written or defaulted",
    () =>
      Effect.gen(function* keepsOtherSpaces() {
        // xmllint --c14n: a="&#x9;x" and a="&#xA0;x" as UTF-8; section 3.3.3 removes only U+0020.
        for (const [subset, body, value] of [
          ["<!ATTLIST r a NMTOKENS #IMPLIED>", '<r a="&#9;x "/>', "\tx"],
          ["<!ATTLIST r a NMTOKENS #IMPLIED>", '<r a=" &#xA0;x"/>', " x"],
          ['<!ATTLIST r a NMTOKENS "&#9;x ">', "<r/>", "\tx"],
          ['<!ATTLIST r a NMTOKENS " &#xA0;x">', "<r/>", " x"],
        ] as const) {
          const document = yield* read(`<!DOCTYPE r [${subset}]>${body}`);

          assert.strictEqual(document.root.attributes[0]?.value, value, `${subset}${body}`);
        }
      }),
  );
});

/**
 * The tokens a box default is written with: a letter, a space and a semicolon, so text can spell
 * `&a;` once an ampersand stands before it; an ampersand by entity (by character reference it is
 * the examples' case); a tab by character reference; a reference to an entity no declaration
 * supplies; and one to `f`, which the internal subset declares after the default.
 */
const TOKENS = ["a", " ", ";", "&amp;", "&#9;", "&u;", "&f;"] as const;

/**
 * A box default's token.
 */
type Token = (typeof TOKENS)[number];

/**
 * The attribute types a box default is declared under: `CDATA`, whose value keeps its spaces, and
 * one tokenized type, whose value section 3.3.3's second step collapses.
 */
const TYPES = ["CDATA", "NMTOKENS"] as const;

/**
 * Where a box default is declared: an internal subset alone, beside an external subset, or beside
 * one in a `standalone="yes"` document.
 */
const CONTEXTS = ["internal", "external", "standalone"] as const;

/**
 * One box case: a default of up to four tokens, its type and where it is declared.
 */
interface BoxCase {
  readonly context: (typeof CONTEXTS)[number];
  readonly tokens: readonly Token[];
  readonly type: (typeof TYPES)[number];
}

/**
 * Draw a box case.
 */
const boxCase: Gen<BoxCase> = (source) => ({
  context: source.draw(element(CONTEXTS)),
  tokens: source.draw(array(element(TOKENS), { max: 4, min: 0 })),
  type: source.draw(element(TYPES)),
});

/**
 * How many box cases there are: every list of 0 to 4 of the 7 tokens, under each type and context.
 */
const BOX_CASES = (1 + 7 + 49 + 343 + 2401) * TYPES.length * CONTEXTS.length;

/**
 * Write a box case's document: the root `r` lacks the attribute, so the default applies, and the
 * subset declares `f` after the default.
 *
 * @param box - The case.
 * @returns The document's text.
 */
const textOf = (box: BoxCase): string => {
  const attlist = `<!ATTLIST r a ${box.type} "${box.tokens.join("")}"><!ENTITY f "later">`;

  return {
    external: `<!DOCTYPE r SYSTEM "r.dtd" [${attlist}]><r/>`,
    internal: `<!DOCTYPE r [${attlist}]><r/>`,
    standalone: `<?xml version="1.0" standalone="yes"?><!DOCTYPE r SYSTEM "r.dtd" [${attlist}]><r/>`,
  }[box.context];
};

/**
 * One unit of a default's value in the model: a character, or a reference the default keeps.
 */
type Unit =
  | { readonly character: string; readonly kind: "character" }
  | { readonly kind: "reference"; readonly name: "f" | "u" };

/**
 * A character unit.
 *
 * @param character - The character.
 * @returns The unit.
 */
const characterUnit = (character: string): Unit => ({ character, kind: "character" });

/**
 * Whether a unit is the space U+0020, the one character section 3.3.3's second step collapses.
 *
 * @param unit - The unit, if any.
 * @returns Whether it is a space.
 */
const isSpace = (unit: Unit | undefined): boolean =>
  unit?.kind === "character" && unit.character === " ";

/**
 * The units a token contributes (sections 4.6 and 4.1: a predefined entity and a character
 * reference are characters, an entity no earlier declaration supplies a reference).
 */
const UNITS: Readonly<Record<Token, readonly Unit[]>> = {
  " ": [characterUnit(" ")],
  "&#9;": [characterUnit("\t")],
  "&amp;": [characterUnit("&")],
  "&f;": [{ kind: "reference", name: "f" }],
  "&u;": [{ kind: "reference", name: "u" }],
  ";": [characterUnit(";")],
  a: [characterUnit("a")],
};

/**
 * What the model predicts of a box case: refused under `undeclared-entity` when it references `f`,
 * which the subset declares after it, or `u` where no declaration of `u` can exist; else the
 * default's value and references.
 *
 * Section 3.3.3's second step, for the tokenized type, removes each space (U+0020) that follows a
 * space and the spaces at either end; a reference is no space.
 *
 * @param box - The case.
 * @returns The predicted attribute's value and references, or `refused`.
 */
const modelOf = (box: BoxCase): Pick<Attribute, "references" | "value"> | "refused" => {
  if (box.tokens.includes("&f;") || (box.context !== "external" && box.tokens.includes("&u;"))) {
    return "refused";
  }

  const units = box.tokens.flatMap((token) => UNITS[token]);
  const spaced =
    box.type === "CDATA"
      ? units
      : units.filter((unit, at) => !isSpace(unit) || !isSpace(units[at - 1]));
  const trimmed =
    box.type === "CDATA"
      ? spaced
      : spaced.slice(isSpace(spaced[0]) ? 1 : 0, isSpace(spaced.at(-1)) ? -1 : spaced.length);
  const references: Attribute["references"][number][] = [];
  let value = "";
  for (const unit of trimmed) {
    if (unit.kind === "character") {
      value += unit.character;
    } else {
      references.push({ name: unit.name, offset: value.length });
      value += `&${unit.name};`;
    }
  }

  return { references, value };
};

/**
 * What a box case exercises.
 */
const SITUATIONS = [
  "refused",
  "refused beside an external subset",
  "kept reference",
  "ampersand as text",
  "collapsed",
  "tab kept",
  "empty value",
] as const;

/**
 * A box situation.
 */
type Situation = (typeof SITUATIONS)[number];

/**
 * Name the situations a box case reaches, from the model's prediction.
 *
 * @param box - The case.
 * @param model - The model's prediction for it.
 * @returns Its situations.
 */
const situationsOf = (
  box: BoxCase,
  model: Pick<Attribute, "references" | "value"> | "refused",
): readonly Situation[] =>
  model === "refused"
    ? [
        "refused",
        ...(box.context === "external" ? (["refused beside an external subset"] as const) : []),
      ]
    : [
        ...(model.references.length > 0 ? ["kept reference" as const] : []),
        ...(model.value.includes("&") &&
        model.references.length < (model.value.match(/&/gu) ?? []).length
          ? ["ampersand as text" as const]
          : []),
        ...(box.type !== "CDATA" && box.tokens.includes(" ") ? ["collapsed" as const] : []),
        ...(model.value.includes("\t") ? ["tab kept" as const] : []),
        ...(model.value === "" ? ["empty value" as const] : []),
      ];

describe("every short attribute default", () => {
  it.effect(
    "reads as section 3.3.3 normalizes it and section 4.1 admits it, and its tree round-trips",
    (ctx) =>
      // Oracle: the model of sections 3.3.3 and 4.1 (`modelOf`). Bound: every default of 0 to 4
      // of the 7 tokens, under both types and all three contexts; residual: longer defaults,
      // declared entities and other references, which pantry's xmllint differential draws
      // (`src/xml/attribute-defaults.test.ts`).
      searched(
        ctx,
        exhaust(
          {
            box: "every default of 0 to 4 tokens over a letter, a space, a semicolon, &amp;, &#9;, an undeclared &u; and a later-declared &f;, under CDATA and NMTOKENS, in an internal subset alone, beside an external subset, and in a standalone document",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<Situation>(SITUATIONS),
            generator: boxCase,
            limit: BOX_CASES,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "a model of XML 1.0 sections 3.3.3 and 4.1 over the default's units",
            },
            suite: "crust/read/attribute-defaults",
          },
          (box, c) =>
            Effect.gen(function* holdsToModel() {
              const text = textOf(box);
              const model = modelOf(box);
              c.noteAll(situationsOf(box, model));

              if (model === "refused") {
                assert.strictEqual(yield* verdictOf(text), "undeclared-entity", text);

                return;
              }

              const document = yield* read(text);

              assert.deepStrictEqual(
                document.root.attributes,
                [{ local: "a", namespace: "", prefix: "", qname: "a", ...model }],
                text,
              );
              yield* roundTrips(document, text);
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, BOX_CASES);
          }),
        ),
      ),
    testTimeoutMs,
  );
});
