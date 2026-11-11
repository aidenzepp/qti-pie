/**
 * Witnesses that {@link documentScanOf} attaches inside an application's own read as an `"array"`,
 * over the document term that read's attachment mints, and compiles through grizzle's one compile
 * (`compileServed`, the compile `grizzle generate` commits) under the committed snapshot, with no
 * database, under a level over `Qti` whose relation holds a served item, as an application's step
 * read does. The arms under a read over `Qti` are `documentScan`'s own, which `grizzle generate`
 * compiles.
 */
import {
  login,
  query,
  relation,
  role,
  schema,
  uuid,
  v,
  wholeEntriesOf,
  workload,
} from "@bjornpagen/grizzle";
import { compileServed } from "@bjornpagen/grizzle/compile";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };
import { documentScanOf } from "#pantry/export/scan.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * An application's served item: one row per sitting, naming the document it serves, as an
 * application's own relation over `Qti` holds it.
 */
const Served = relation("Served", { item: uuid, sitting: uuid }, ["sitting"]);

/**
 * A level over `Qti` holding {@link Served}, as an application stacks one with `schema.extend`.
 */
const Sittings = schema.extend(Qti, "ScanProbe", { Served }, []);

/**
 * A sitting's served item with that item's whole scan attached: the step read of an application
 * over {@link Sittings}.
 */
const servedOf = query(Sittings)
  .rule((r) => {
    const { item, sitting } = v(Served, "served");

    return r
      .match(Served, { item, sitting })
      .where(r.eq(sitting, r.param("sitting", uuid)))
      .find({ item, sitting });
  })
  .attach("document", (served) => documentScanOf(served.item), "array");

/**
 * The role an application over {@link Sittings} reads with: every relation of every level, whole.
 */
const Reader = role(Sittings, "scan_probe_reader", wholeEntriesOf(Sittings), {});

/**
 * The application's login, whose one workload holds {@link servedOf}.
 */
const ProbeApp = login(Sittings, "scan_probe_app", [Reader], {
  workload: [workload(Reader, { servedOf })],
});

describe("documentScanOf", () => {
  it.effect("compiles attached to a level's served item", () =>
    Effect.gen(function* compilesOverLevel() {
      const compiled = yield* Effect.exit(compileServed(ProbeApp, snapshot, ProbeApp.workload));

      assert.isTrue(Exit.isSuccess(compiled), String(compiled));
    }),
  );
});
