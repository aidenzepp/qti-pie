/**
 * The host judge's model of a schema's members (`modelledRelations` of
 * `#pantry/test/host-judge.ts`): every member it can read neither as a stored relation nor as a
 * kind it reads elsewhere fails loudly, by name, rather than vanishing with its laws unjudged.
 *
 * Oracle: the rule as a table, over the schema's own members and three planted ones: a stored
 * relation whose heading is no record, a relation of no primary key, and a member of a kind the
 * host does not know.
 *
 * And the laws it judges (`judgedLaws` of `#pantry/test/judged-laws.ts`), and each containment a
 * test reads from one relation (`containmentsOf`), are named as the refusal names an outcome's
 * (`lawNameOf` of `#pantry/import/refusal.ts`, by grizzle's `sameLaw`), so a test that names the
 * laws a package's rows break names each by its law, never by its shape. A law whose sides'
 * selections were left out was no law `sameLaw` knows, so every containment and key over a
 * selection went unnamed (6caa20ef).
 *
 * And it judges a check as PostgreSQL holds it, `CHECK ((…) IS TRUE)`: a predicate unknown over
 * values the row holds breaks the check, and one unknown for a value the host lacks leaves it
 * unjudged, named by that value (decision 442).
 */
import { assert, describe, it } from "@effect/vitest";
import { Formatter, Option } from "effect";
import { lawNameOf } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { judge, modelledRelations } from "#pantry/test/host-judge.ts";
import type { HostRow } from "#pantry/test/host-judge.ts";
import { containmentsOf, judgedLaws } from "#pantry/test/judged-laws.ts";

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

  it("names every containment a test reads from a relation as a refusal names an outcome's law", () => {
    // Oracle: the refusal's own naming, as above. Bound: every containment Qti states, read from
    // each of its relations.
    const unnamed = Object.keys(Qti.relations).flatMap((from) =>
      containmentsOf(Qti, from).flatMap(({ law }) =>
        Option.isNone(lawNameOf(law)) ? [Formatter.format(law)] : [],
      ),
    );

    assert.deepStrictEqual(unnamed, [], "containments the refusal names none of");
  });

  it("fails by name on each member it cannot read", () => {
    for (const member of planted) {
      assert.throws(() => {
        modelledRelations([...Object.values(Qti.relations), member]);
      }, member.name);
    }
  });

  it("breaks a check whose predicate is unknown over values the row holds, as IS TRUE does", () => {
    // Oracle: PostgreSQL's CHECK, which grizzle emits as `CHECK ((…) IS TRUE)`, refuses a row whose
    // predicate is NULL. Bound: one planted check, unknown on every row, over one row that holds
    // every value it reads, and its control, the same check reading a value the row lacks.
    const stated = judgedLaws(Qti).find(({ kind }) => kind === "check");
    assert.isDefined(stated, "Qti states a check the host judges");
    if (stated === undefined || stated.kind !== "check") {
      return;
    }

    const unknown = {
      ...stated,
      reads: ["held"],
      unread: [],
      // Unknown on the planted row, which holds `held`; false on any other.
      value: (row: HostRow) => (row["held"] === "x" ? undefined : false),
    };
    const rows = new Map([[stated.relation, [{ held: "x" }]]]);
    const judged = judge(rows, [unknown]);
    const lacking = judge(rows, [{ ...unknown, reads: ["lacked"] }]);

    assert.deepStrictEqual(
      judged.broken.map(({ law }) => law),
      [stated.law],
      "an unknown predicate over held values breaks its check",
    );
    assert.deepStrictEqual(
      lacking.skipped.map(({ absent }) => absent),
      [[`${stated.relation}.lacked`]],
      "an unknown predicate for a lacked value leaves its check unjudged, named by the value",
    );
  });
});
