/**
 * The day-one probe of the wildcard statement forms (phase 11, unit W00).
 *
 * Phase 11 stores wildcard foreign content and wants four statement shapes that no relation of
 * `Qti` uses today. This file builds probe schemas of its own, never composed into `Qti`, and
 * records grizzle's verdict on each. A verdict is an observation, not a requirement: each case
 * asserts what grizzle does on the vendored commit, so a later change of verdict fails the case
 * and sends the slices that wait on it back to the Mind. Both sides of every capacity share one
 * probe `contract` for the namespace and local columns, because grizzle pairs capacity sides
 * position by position and refuses a contract column against a bare one.
 *
 * Verdicts, all admitted:
 *
 * - (a) `capacity(on(ExclusionLike, "host", "namespace"), { from: on(ForeignLike, "parentKind",
 *   "namespace"), within: within(0n, 0n) })`: an unkeyed source into a fully keyed target.
 * - (b) The same into the three-field `GlobalLike`.
 * - (c) Two row checks over two text columns: `row.or(row.ne(row.namespace, ""), row.eq(row.prefix,
 *   ""))` and the both-or-neither form, written with `row.and` inside `row.or`.
 * - (d) Two containments, each onto a superkey.
 * - (f) Decision 108's exemption: a capacity from a selected `AttributeLike` source into
 *   `GlobalLike`.
 *
 * All five gate `p11-9`. No refusal was observed, so no reason is quoted. Form (e) is not
 * re-probed: `probe.tighten.test.ts` verdict 5 settled it.
 */
import {
  capacity,
  check,
  closed,
  closedId,
  contained,
  contract,
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

const Kinds = closed("ProbeForeignKinds", ["a", "b"]);

const Sets = closed("ProbeForeignSets", ["x", "y"]);

const Processes = closed("ProbeForeignProcesses", ["lax", "strict"]);

const Namespace = contract("ProbeForeignNamespace", str.regex(patterns.anyUri));

const Local = contract("ProbeForeignLocal", str.regex(patterns.ncName));

const Prefix = str.regex(patterns.ncName);

const ForeignLike = relation(
  "ProbeForeignLike",
  {
    id: uuid,
    local: Local,
    namespace: Namespace,
    parentKind: closedId(Kinds),
    prefix: Prefix,
    rootKind: closedId(Kinds),
    schemaSet: closedId(Sets),
  },
  ["id"],
);

const ExclusionLike = relation(
  "ProbeExclusionLike",
  { host: closedId(Kinds), namespace: Namespace },
  ["host", "namespace"],
);

const GlobalLike = relation(
  "ProbeGlobalLike",
  { local: Local, namespace: Namespace, set: closedId(Sets) },
  ["set", "namespace", "local"],
);

const NodeLike = relation(
  "ProbeNodeLike",
  { id: uuid, prefix: Prefix, rootKind: closedId(Kinds) },
  ["id"],
);

const AttributeLike = relation(
  "ProbeAttributeLike",
  {
    kind: closedId(Kinds),
    local: Local,
    namespace: Namespace,
    process: closedId(Processes),
    schemaSet: closedId(Sets),
  },
  ["kind", "namespace", "local"],
);

const WildcardLike = relation(
  "ProbeWildcardLike",
  { host: closedId(Kinds), process: closedId(Processes) },
  ["host"],
);

const base = { AttributeLike, ExclusionLike, ForeignLike, GlobalLike, NodeLike, WildcardLike };

describe("wildcard statement probe", () => {
  it.effect("form a", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeFormA", { ...base, Kinds, Processes, Sets }, [
          capacity(on(ExclusionLike, "host", "namespace"), {
            from: on(ForeignLike, "parentKind", "namespace"),
            within: within(0n, 0n),
          }),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("form b", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeFormB", { ...base, Kinds, Processes, Sets }, [
          capacity(on(GlobalLike, "set", "namespace", "local"), {
            from: on(ForeignLike, "schemaSet", "namespace", "local"),
            within: within(0n, 0n),
          }),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("form c", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeFormC", { ...base, Kinds, Processes, Sets }, [
          check("NamespaceOrNoPrefix", ForeignLike, (row) =>
            row.or(row.ne(row.namespace, ""), row.eq(row.prefix, "")),
          ),
          check("BothOrNeither", ForeignLike, (row) =>
            row.or(
              row.and(row.eq(row.namespace, ""), row.eq(row.prefix, "")),
              row.and(row.ne(row.namespace, ""), row.ne(row.prefix, "")),
            ),
          ),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("form d", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeFormD", { ...base, Kinds, Processes, Sets }, [
          contained(
            on(ForeignLike, "id", "prefix", "rootKind"),
            on(NodeLike, "id", "prefix", "rootKind"),
          ),
          contained(on(AttributeLike, "kind", "process"), on(WildcardLike, "host", "process")),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("form f", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("ProbeFormF", { ...base, Kinds, Processes, Sets }, [
          capacity(on(GlobalLike, "set", "namespace", "local"), {
            from: on(select(AttributeLike, { process: "lax" }), "schemaSet", "namespace", "local"),
            within: within(0n, 0n),
          }),
        ]),
      );
      assert.isDefined(built);
    }),
  );
});
