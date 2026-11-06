/**
 * The day-one probe of the MathML statement forms (phase 6, slice `p6-1`).
 *
 * Spec 4.5 and 4.8 rest on statement forms that nothing on trunk exercises yet. This file builds
 * probe schemas of its own, never composed into `Qti`, and records grizzle's verdict on five forms
 * at the vendored trunk commit `a1d5af1`. A verdict is an observation, not a requirement: each
 * case asserts what grizzle does, so a later change of verdict fails the case and sends the slices
 * that wait on it back to the Mind.
 *
 * `schema(...)` runs no recognizer: it admitted a statement that `grizzle check` then refused (the
 * negative control, below). So each verdict has two parts. The cases here assert the first, that
 * `schema(...)` builds the form. The second, whether grizzle compiles the built schema, was read
 * by running `grizzle check` offline over a throwaway `grizzle.config.ts` with no logins, one
 * config per form, over the same shapes as below. The compile refusals come from
 * `packages/engine/src/laws/model/plan.ts`, which only the compile reaches.
 *
 * Verdicts:
 *
 * 1. Form (a), admitted and compiled. A containment into a one-selector target on its key,
 *    `contained(on(FamilyLike, "kind", "attribute"), on(select(MatrixLike, { type: "boolean" }),
 *    "kind", "attribute"))`: the projection `(kind, attribute)` is `MatrixLike`'s key, so the
 *    selected target is keyed. `grizzle check` printed no compile refusal: it reached the drift
 *    check and printed `ProbeA: the schemas or their logins differ from snapshot.json (an
 *    ungenerated change); run grizzle generate`, as it does for the plain-containment control.
 *    Gates `p6-15` (spec 4.5's family law): escalation P-1 does not fire.
 * 2. Form (b), admitted and compiled. `contained(on(MatrixLike, "kind", "attribute"), on(AdmitLike,
 *    "kind", "attribute"))` and `contained(on(FamilyLike, "node", "kind"), on(NodeLike, "id",
 *    "kind"))` both build and compile (same `check` output as 1). Gates `p6-21`.
 * 3. Form (c), admitted and compiled, both spellings. A row check that a family's `kind` is none of
 *    183 handles builds as `row.not(row.in(row.kind, handles))` and as `row.and(...handles.map(
 *    (handle) => row.ne(row.kind, handle)))`. Gates `p6-22`: either spelling builds, so it uses the
 *    first, one membership test over the roster instead of 183 comparisons.
 * 4. Form (d), the control, admitted and compiled. `capacity(on(ArmLike, "id"), { from:
 *    on(select(EdgeLike, { childKind: "mi" }), "parent"), within: within(0n, 1n) })`, the form
 *    `src/schema/html/structure.ts:350-353` uses.
 * 5. Form (e), the fallback for (a), admitted and compiled. `FamilyLike2` carries a `type` column, a
 *    check `row.eq(row.type, "boolean")` and `contained(on(FamilyLike2, "kind", "attribute",
 *    "type"), on(MatrixLike, "kind", "attribute", "type"))`, onto a superkey of `MatrixLike`'s key.
 *    Not needed, since (a) is admitted.
 * 6. The negative control, admitted by `schema(...)` and refused at compile. `contained(on(
 *    FamilyLike, "kind"), on(select(MatrixLike, { type: "boolean" }), "kind"))`, whose projection
 *    holds no key of `MatrixLike`, is refused by `grizzle check`, verbatim: `ProbeNeg: the schema
 *    or a login's workload does not compile: the schema does not compile: UnsupportedLawFamily at
 *    contained FamilyLike(kind) in MatrixLike(kind) selected at FamilyLike.contained
 *    (.../grizzle.config.ts:5:38): a containment into a selected target into a projection that
 *    contains a key of MatrixLike; (kind) contains none, and a containment into an unkeyed
 *    projection is not admitted; fix the schema or workload it names, then run grizzle generate`.
 *    So the compile does refuse what it should, and the silence in 1 to 5 is a verdict.
 */
import {
  capacity,
  check,
  closed,
  closedId,
  contained,
  on,
  relation,
  schema,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * The 183 synthetic handles beside the three real ones: the width of MathML's kind roster that a
 * family must exclude.
 */
const synthetic = Array.from({ length: 183 }, (_, index) => `synthetic${index}`);

const ProbeKind = closed("ProbeKind", ["math", "mi", "mrow", ...synthetic]);

const ProbeAttribute = closed("ProbeAttribute", ["display", "mathvariant"]);

const ProbeType = closed("ProbeType", ["boolean", "length"]);

const text = str.regex(patterns.xsString, patterns.xsStringFlags);

const MatrixLike = relation(
  "MatrixLike",
  {
    attribute: closedId(ProbeAttribute),
    kind: closedId(ProbeKind),
    type: closedId(ProbeType),
  },
  ["kind", "attribute"],
);

const AdmitLike = relation(
  "AdmitLike",
  { attribute: closedId(ProbeAttribute), kind: closedId(ProbeKind) },
  ["kind", "attribute"],
);

const NodeLike = relation("NodeLike", { id: uuid, kind: closedId(ProbeKind) }, ["id"]);

const FamilyLike = relation(
  "FamilyLike",
  { attribute: closedId(ProbeAttribute), kind: closedId(ProbeKind), node: uuid, value: text },
  ["node", "attribute"],
);

const FamilyLike2 = relation(
  "FamilyLike2",
  {
    attribute: closedId(ProbeAttribute),
    kind: closedId(ProbeKind),
    node: uuid,
    type: closedId(ProbeType),
    value: text,
  },
  ["node", "attribute"],
);

const EdgeLike = relation(
  "EdgeLike",
  { child: uuid, childKind: closedId(ProbeKind), parent: uuid },
  ["child"],
);

const ArmLike = relation("ArmLike", { id: uuid }, ["id"]);

describe("MathML statement-form probe", () => {
  it.effect("case a: a containment into a one-selector target on its key is admitted", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeMathmlA", { FamilyLike, MatrixLike, ProbeAttribute, ProbeKind, ProbeType }, [
          contained(
            on(FamilyLike, "kind", "attribute"),
            on(select(MatrixLike, { type: "boolean" }), "kind", "attribute"),
          ),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("case b: a key-to-key and a node-kind containment are admitted", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema(
          "ProbeMathmlB",
          { AdmitLike, FamilyLike, MatrixLike, NodeLike, ProbeAttribute, ProbeKind, ProbeType },
          [
            contained(on(MatrixLike, "kind", "attribute"), on(AdmitLike, "kind", "attribute")),
            contained(on(FamilyLike, "node", "kind"), on(NodeLike, "id", "kind")),
          ],
        ),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("case c: a kind excluded by membership and by a conjunction are both admitted", () =>
    Effect.gen(function* probe() {
      const byMembership = yield* Effect.try(() =>
        schema("ProbeMathmlCIn", { FamilyLike, ProbeAttribute, ProbeKind }, [
          check("FamilyKindNotSynthetic", FamilyLike, (row) =>
            row.not(row.in(row.kind, synthetic)),
          ),
        ]),
      );
      const byConjunction = yield* Effect.try(() =>
        schema("ProbeMathmlCNe", { FamilyLike, ProbeAttribute, ProbeKind }, [
          check("FamilyKindNotSynthetic", FamilyLike, (row) =>
            row.and(...synthetic.map((handle) => row.ne(row.kind, handle))),
          ),
        ]),
      );
      assert.isDefined(byMembership);
      assert.isDefined(byConjunction);
    }),
  );

  it.effect("case d: the control, a capacity from a selected edge, is admitted", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeMathmlD", { ArmLike, EdgeLike, ProbeKind }, [
          capacity(on(ArmLike, "id"), {
            from: on(select(EdgeLike, { childKind: "mi" }), "parent"),
            within: within(0n, 1n),
          }),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("case e: the fallback, a typed family onto a superkey of the matrix, is admitted", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeMathmlE", { FamilyLike2, MatrixLike, ProbeAttribute, ProbeKind, ProbeType }, [
          check("FamilyType", FamilyLike2, (row) => row.eq(row.type, "boolean")),
          contained(
            on(FamilyLike2, "kind", "attribute", "type"),
            on(MatrixLike, "kind", "attribute", "type"),
          ),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("case f: schema() admits the unkeyed selected containment that compile refuses", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeMathmlNeg", { FamilyLike, MatrixLike, ProbeAttribute, ProbeKind, ProbeType }, [
          contained(on(FamilyLike, "kind"), on(select(MatrixLike, { type: "boolean" }), "kind")),
        ]),
      );
      assert.isDefined(built);
    }),
  );
});
