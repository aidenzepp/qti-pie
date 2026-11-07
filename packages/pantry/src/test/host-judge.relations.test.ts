/**
 * The host judge's model of a schema's members (`modelledRelations` of
 * `#pantry/test/host-judge.ts`): every member it can read neither as a stored relation nor as a
 * kind it reads elsewhere fails loudly, by name, rather than vanishing with its laws unjudged.
 *
 * Oracle: the rule as a table, over the schema's own members and three planted ones: a stored
 * relation whose heading is no record, a relation of no primary key, and a member of a kind the
 * host does not know.
 */
import { assert, describe, it } from "@effect/vitest";
import { Qti } from "#pantry/qti/schema.ts";
import { modelledRelations } from "#pantry/test/host-judge.ts";

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

  it("fails by name on each member it cannot read", () => {
    for (const member of planted) {
      assert.throws(() => {
        modelledRelations([...Object.values(Qti.relations), member]);
      }, member.name);
    }
  });
});
