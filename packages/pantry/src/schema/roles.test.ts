import {
  alternatives,
  capacity,
  check,
  closed,
  closedId,
  contained,
  key,
  mirrors,
  mutable,
  on,
  relation,
  role,
  schema,
  select,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import type { StatementsOf } from "@bjornpagen/grizzle";
import { describe, expectTypeOf, it } from "@effect/vitest";
import type { KeptOf } from "#pantry/schema/roles.ts";

const Kind = closed("Kind", ["a", "b"]);

const Parent = relation("Parent", { id: uuid, kind: closedId(Kind) }, ["id"]);

const ArmA = relation("ArmA", { id: uuid }, ["id"]);

const ArmB = relation("ArmB", { id: uuid }, ["id"]);

const Child = relation("Child", { id: uuid, parent: uuid }, ["id"]);

const Outside = relation("Outside", { id: uuid, parent: uuid }, ["id"]);

/**
 * A schema whose statements hold one of every kind the role's kept laws read.
 */
const Small = schema("RolesProbe", { ArmA, ArmB, Child, Kind, Outside, Parent }, [
  key(Child, ["parent"]),
  mutable(Child),
  check("ChildNotParent", Child, (row) => row.ne(row.id, row.parent)),
  contained(on(Child, "parent"), on(Parent, "id")),
  contained(on(Outside, "parent"), on(Parent, "id")),
  mirrors(on(select(Parent, { kind: "a" }), "id"), on(ArmA, "id")),
  capacity(on(Parent, "id"), { from: on(Child, "parent"), within: within(0n, 1n) }),
  alternatives(Parent, "kind", Kind, { a: ArmA, b: ArmB }),
]);

/**
 * A role over the schema's own members, leaving out `Kind` and `Outside`: the alternatives law and
 * the second containment name a relation the role lacks.
 */
const SmallRole = role(Small, "small", { ArmA, ArmB, Child, Parent });

type Whole = typeof ArmA | typeof ArmB | typeof Child | typeof Parent;

describe("KeptOf", () => {
  it("keeps the laws whose relations the role holds whole, as grizzle's role does", () => {
    expectTypeOf<KeptOf<StatementsOf<typeof Small>[number], Whole>>().toEqualTypeOf<
      (typeof SmallRole.statements)[number]
    >();
  });
});
