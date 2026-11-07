/**
 * The host judge's model of a schema's members (`modelledRelations` of
 * `#pantry/test/host-judge.ts`): every member it can read neither as a stored relation nor as a
 * kind it reads elsewhere fails loudly, by name, rather than vanishing with its laws unjudged.
 *
 * Oracle: the rule as a table, over the schema's own members and three planted ones: a stored
 * relation whose heading is no record, a relation of no primary key, and a member of a kind the
 * host does not know.
 *
 * And the laws it judges (`judgedLaws` of `#pantry/test/key-copies.ts`) are named as the refusal
 * names an outcome's (`lawNameOf` of `#pantry/import/refusal.ts`, by grizzle's `sameLaw`), so a
 * test that names the laws a package's rows break names each by its law, never by its shape. A law
 * whose sides' selections were left out was no law `sameLaw` knows, so every containment and key
 * over a selection went unnamed (6caa20ef).
 */
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { lawNameOf } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { modelledRelations } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";

/**
 * The members planted beside the schema's, each one the host cannot read.
 */
const planted = [
  { heading: 5, kind: "relation", name: "PlantedHeading", primaryKey: ["id"] },
  { heading: {}, kind: "relation", name: "PlantedKey" },
  { kind: "view", name: "PlantedKind" },
] as const;

describe("the host judge's model of a schema", () => {
  it("reads every member of the schema, its stored relations by name", () => {
    const modelled = modelledRelations(Object.values(Qti.relations));

    for (const name of ["Attribute", "DoubleValue", "Node", "TextDoubleValue"]) {
      assert.isTrue(modelled.has(name), name);
    }
  });

  it("names every law it judges as a refusal names an outcome's law", () => {
    // Oracle: the refusal's own naming, grizzle's sameLaw against the laws lawsOf states. Bound:
    // every law of Qti the host judges.
    const unnamed = judgedLaws(Qti).flatMap(({ law }) =>
      Option.isNone(lawNameOf(law)) ? [Formatter.format(law)] : [],
    );

    assert.deepStrictEqual(unnamed, [], "laws the refusal names none of");
  });

  it("fails by name on each member it cannot read", () => {
    for (const member of planted) {
      assert.throws(() => {
        modelledRelations([...Object.values(Qti.relations), member]);
      }, member.name);
    }
  });
});
