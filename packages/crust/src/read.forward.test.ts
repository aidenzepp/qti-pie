/**
 * A default that references a general entity, read in each of the four places XML 1.0 section 4.1
 * can put a document and with the entity declared before the attribute-list declaration or after
 * it.
 *
 * WFC Entity Declared binds a document with no external subset whose internal subset references no
 * parameter entity, and one that says `standalone="yes"`; VC Entity Declared binds every other.
 * Both say "the declaration of a general entity MUST precede" a reference in a default. So a
 * forward reference is refused everywhere: inside the WFC's scope the document is not well-formed,
 * and outside it the document is not valid and the specification leaves the default's value
 * undetermined, since a reader taking the subset in order has not seen the entity, and neither
 * section 4.4 nor 5.1 fixes what a reader that does not validate supplies (libxml2 2.9.13 supplies
 * the empty string). A backward reference is expanded everywhere.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { ReaderRefusal } from "#crust/errors.ts";
import { readXml } from "#crust/read.ts";

/**
 * The places section 4.1 distinguishes, each with whether WFC Entity Declared binds it.
 */
const scopes = [
  { inScope: true, name: "internal subset alone", prefix: "", system: "", within: "" },
  {
    inScope: false,
    name: "internal subset with a parameter-entity reference",
    prefix: "",
    system: "",
    within: '<!ENTITY % p ""> %p; ',
  },
  { inScope: false, name: "external subset", prefix: "", system: ' SYSTEM "r.dtd"', within: "" },
  {
    inScope: true,
    name: "standalone beside an external subset",
    prefix: '<?xml version="1.0" standalone="yes"?>',
    system: ' SYSTEM "r.dtd"',
    within: "",
  },
] as const;

/**
 * Where the entity's declaration stands: before the attribute-list declaration or after it.
 */
const directions = ["backward", "forward"] as const;

/**
 * One case of the box: a place and a direction.
 */
interface Case {
  readonly direction: (typeof directions)[number];
  readonly scope: (typeof scopes)[number];
}

/**
 * The box's generator: every place by every direction.
 */
const caseOf: Gen<Case> = (source) => ({
  direction: source.draw(element(directions)),
  scope: source.draw(element(scopes)),
});

/**
 * Write a case's document: the entity `e` with text `x`, and a default of attribute `a` on `r`
 * that references it.
 *
 * @param box - The case.
 * @returns The document's text.
 */
const textOf = ({ direction, scope }: Case): string => {
  const entity = '<!ENTITY e "x">';
  const list = '<!ATTLIST r a CDATA "&e;">';
  const declarations = direction === "backward" ? `${entity}${list}` : `${list}${entity}`;

  return `${scope.prefix}<!DOCTYPE r${scope.system} [${scope.within}${declarations}]><r/>`;
};

/**
 * The situations the box must reach: each refusal's reason and the expansion.
 */
const SITUATIONS = ["refused, not well-formed", "refused, undetermined", "expanded"] as const;

/**
 * One situation.
 */
type Situation = (typeof SITUATIONS)[number];

describe("a default's reference to an entity declared before or after it", () => {
  it.effect(
    "is refused forward in every place section 4.1 names, for the reason that place gives, and expanded backward",
    (ctx) =>
      // Oracle: section 4.1's two constraints as written. Bound: the 4 places by the 2
      // directions, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "4 places of section 4.1 by a forward or backward reference",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<Situation>(SITUATIONS),
            generator: caseOf,
            limit: 8,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML 1.0 section 4.1, WFC and VC Entity Declared",
            },
            suite: "crust/read/forward-default",
          },
          (box, c) =>
            Effect.gen(function* holdsToSection41() {
              const text = textOf(box);
              const read = yield* Effect.result(readXml(new TextEncoder().encode(text)));
              if (box.direction === "backward") {
                c.note("expanded");
                assert.isTrue(read._tag === "Success", text);
                assert.deepStrictEqual(
                  read._tag === "Success"
                    ? read.success.root.attributes.map(({ value }) => value)
                    : [],
                  ["x"],
                  text,
                );

                return;
              }

              c.note(box.scope.inScope ? "refused, not well-formed" : "refused, undetermined");

              const failure = read._tag === "Failure" ? read.failure : undefined;
              assert.instanceOf(failure, ReaderRefusal, text);
              assert.strictEqual(
                failure instanceof ReaderRefusal && failure.rule,
                "undeclared-entity",
                text,
              );
              assert.include(
                failure instanceof ReaderRefusal ? failure.detail : "",
                box.scope.inScope
                  ? "so the document is not well-formed"
                  : "leaves the default's value undetermined",
                text,
              );
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, 8);
          }),
        ),
      ),
  );
});
