/**
 * The host judge's model of a schema's members (`modelledRelations` of
 * `#pantry/test/host-judge.ts`): every member it can read neither as a stored relation nor as a
 * kind it reads elsewhere fails loudly, by name, rather than vanishing with its laws unjudged.
 *
 * Oracle: the rule as a table, over the schema's own members and three planted ones: a stored
 * relation whose heading is no record, a relation of no primary key, and a member of a kind the
 * host does not know.
 *
 * And the laws it judges (`judgedLaws` of `#pantry/test/host-judge.ts`), and each containment a
 * test reads from one relation (`containmentsOf`), are named as the refusal names an outcome's
 * (`lawNameOf` of `#pantry/import/refusal.ts`, by grizzle's `sameLaw`), so a test that names the
 * laws a package's rows break names each by its law, never by its shape. A law whose sides'
 * selections were left out was no law `sameLaw` knows, so every containment and key over a
 * selection went unnamed (6caa20ef).
 *
 * And both host judges, this one and the genetic search's (`evaluatedLaws` of
 * `#pantry/test/gen/genetic/host-laws.ts`), read every containment and key `Qti` states, whatever
 * kind of statement states it, so a law never drops out of either judge with its statement's kind:
 * an `alternatives`, which holds no side, states its containments only as its laws.
 */
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { lawNameOf, statedLaws } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { evaluatedLaws } from "#pantry/test/gen/genetic/host-laws.ts";
import { judgedLaws, modelledRelations } from "#pantry/test/host-judge.ts";
import { containmentsOf } from "#pantry/test/judged-laws.ts";

/**
 * The timeout, in milliseconds, of this file's tests that compile Qti's law model: a hang guard,
 * never a budget. Measured 2026-11-08: 79 s at a load average of 74 to 80, its slowest test.
 */
const testTimeoutMs = 300_000;

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

  it(
    "names every law it judges as a refusal names an outcome's law",
    () => {
      // Oracle: the refusal's own naming, grizzle's sameLaw against the laws lawsOf states. Bound:
      // every law of Qti the host judges.
      const unnamed = judgedLaws(Qti).flatMap(({ law }) =>
        Option.isNone(lawNameOf(law)) ? [Formatter.format(law)] : [],
      );

      assert.deepStrictEqual(unnamed, [], "laws the refusal names none of");
    },
    testTimeoutMs,
  );

  it(
    "names every containment a test reads from a relation as a refusal names an outcome's law",
    () => {
      // Oracle: the refusal's own naming, as above. Bound: every containment Qti states, read from
      // each of its relations.
      const unnamed = Object.keys(Qti.relations).flatMap((from) =>
        containmentsOf(Qti, from).flatMap(({ law }) =>
          Option.isNone(lawNameOf(law)) ? [Formatter.format(law)] : [],
        ),
      );

      assert.deepStrictEqual(unnamed, [], "containments the refusal names none of");
    },
    testTimeoutMs,
  );

  it(
    "judges every containment and key Qti states, in both host judges, whatever statement states it",
    () => {
      // Oracle: the laws Qti states, as the refusal names them (`statedLaws`, from grizzle's
      // `lawsOf`). Bound: every containment and key of every statement of Qti, an alternatives'
      // among them.
      const stated = statedLaws().flatMap(([law]) =>
        law.kind === "contained" || law.kind === "key" ? [Formatter.format(law)] : [],
      );
      const judges = [
        ["the host judge", judgedLaws(Qti).map(({ law }) => law)],
        ["the genetic search", evaluatedLaws],
      ] as const;

      for (const [judge, laws] of judges) {
        const held = new Set(laws.map((law) => Formatter.format(law)));

        assert.deepStrictEqual(
          stated.filter((law) => !held.has(law)),
          [],
          `laws Qti states that ${judge} judges not`,
        );
      }
    },
    testTimeoutMs,
  );

  it("fails by name on each member it cannot read", () => {
    for (const member of planted) {
      assert.throws(() => {
        modelledRelations([...Object.values(Qti.relations), member]);
      }, member.name);
    }
  });
});
