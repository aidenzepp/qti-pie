/**
 * Spec reading 137 on the lease: the database reads no attribute's order either. A package the
 * import accepts in the order it is read it accepts with every element's attributes and namespace
 * declarations in another order, and exports each family back in the order written; a package it
 * refuses it refuses under the same rule, one of the law oracle's.
 *
 * Each case is a package of `#pantry/test/gen/attribute-order.ts`, drawn under its own swarm and
 * imported twice, as read and reordered. The free tier holds the oracle to the same relation
 * (`attribute-order.oracle.test.ts`) and the export's path without the database
 * (`attribute-order.export.test.ts`).
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Layer, Option, Result } from "effect";
import { describe } from "vitest";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { exportEntries } from "#pantry/export/package.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { importPackage } from "#pantry/import/package.ts";
import { names } from "#pantry/model/names.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import {
  elementsOf,
  exportOrderOf,
  filesOf,
  movedIn,
  orderCase,
  readCase,
  reordered,
  writtenOf,
} from "#pantry/test/gen/attribute-order.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * How long the search may run: each case imports its package twice and exports what it accepts,
 * a few seconds a case on the lease.
 */
const orderTimeoutMs = 900_000;

/**
 * What an import of a package did: accepted under the id it answered, or refused under rules.
 */
type Imported =
  | { readonly id: Uuid; readonly verdict: "accepted" }
  | { readonly rules: readonly string[]; readonly verdict: "refused" };

/**
 * Import a package's files on the lease.
 *
 * @param files - The package's files.
 * @returns What the import did; a failure that is no refusal fails the test.
 */
const importedOf = Effect.fn("test.attributeOrder.imported")(function* importedOf(
  files: readonly PackageFile[],
) {
  const dir = yield* scopedPackage(new Map(files.map(({ bytes, path }) => [path, bytes])));
  const outcome = yield* Effect.result(importPackage(dir));
  if (Result.isSuccess(outcome)) {
    return { id: outcome.success, verdict: "accepted" } satisfies Imported;
  }

  const refused = outcome.failure;
  if (!(refused instanceof ImportRefused)) {
    return yield* Effect.die(refused);
  }

  return { rules: refused.rules, verdict: "refused" } satisfies Imported;
});

/**
 * Write what an import did without the id it drew.
 *
 * @param imported - What the import did.
 * @returns Its verdict and, for a refusal, its rules.
 */
const verdictOf = (imported: Imported) =>
  imported.verdict === "accepted"
    ? { verdict: imported.verdict }
    : { rules: imported.rules, verdict: imported.verdict };

/**
 * Hold an accepted package's export to the order its source writes: every XML entry exported
 * with each element's declarations, then its attributes, each in the order the source writes
 * them, and canonically equal to the source.
 *
 * @param id - The package's id.
 * @param sources - Each XML entry's source tree, by path.
 * @returns Completes once every entry is checked; fails the test on the first that differs.
 */
const exportHolds = Effect.fn("test.attributeOrder.exportHolds")(function* exportHolds(
  id: Uuid,
  sources: ReadonlyMap<string, XmlDocument>,
) {
  const entries = yield* exportEntries(id);
  for (const [path, source] of sources) {
    const entry = entries.find((exported) => exported.path === path);

    assert.isDefined(entry, `${path} is exported`);

    const written = yield* Effect.orDie(readXml(entry?.bytes ?? new Uint8Array()));
    const read = elementsOf(source.root);
    const back = elementsOf(written.root);

    assert.strictEqual(back.length, read.length, `${path}: the export writes every element`);
    for (const [at, element] of read.entries()) {
      assert.deepStrictEqual(
        back[at]?.attributes.map(writtenOf),
        exportOrderOf(element),
        `${path}: element ${String(at)}, ${element.qname}`,
      );
    }

    assert.deepStrictEqual(canonicalize(written), canonicalize(source), `${path}: canonically`);
  }
});

/**
 * The situations the search must reach: each verdict, and an element its order moved.
 */
type Situation = "accepted" | "refused" | "moved";

/**
 * The cases the search is checked over.
 */
const cases = orderCase(grammar);

describe.skipIf(!hasLease)(
  "test/attribute-order.db.test.ts, on the lease",
  { timeout: orderTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("spec reading 137, attribute order, in the database", (it) => {
      it.effect(
        "gives every generated package the verdict and the rule it gives it read in order, and exports an accepted one in the order written, whatever order each element's attributes and declarations are written in",
        (ctx) =>
          // Oracle: PostgreSQL as the judge, under the metamorphic relation import ∘ reorder =
          // import, and the law oracle's rules for a refusal; for an accepted package, the round
          // trip export ∘ import = id with each family in its order, up to Canonical XML.
          // Bound: the generators' drawn bounds, every element of every XML entry reordered a case.
          searched(
            ctx,
            explore(
              {
                caseHang: Duration.minutes(5),
                concurrency: 1,
                coverage: required<Situation>(["accepted", "refused", "moved"], {
                  cases: 24,
                  sense: notesOnly,
                }),
                draw: drawn(cases),
                kept: [],
                literal: Formatter.format,
                oracle: {
                  kind: "postgresql",
                  name: "import ∘ reorder = import, its rule one of the law oracle's",
                },
                runs: 16,
                shrink: completeShrink,
                steerEvery: 4,
                suite: "pantry/test/attribute-order-db",
              },
              (orderedCase, c) =>
                Effect.gen(function* invariant() {
                  const entries = yield* readCase(orderedCase, names);
                  const moved = new Map<string, XmlDocument>();
                  const read = yield* Effect.orDie(filesOf(entries, (tree) => tree));
                  const written = yield* Effect.orDie(
                    filesOf(entries, (tree, path) => {
                      const order = c.draw(reordered(orderedCase.swarm, tree));
                      moved.set(path, order);

                      return order;
                    }),
                  );
                  const before = yield* importedOf(read);
                  const after = yield* importedOf(written);

                  c.note(before.verdict);
                  if (
                    entries.some(({ path, tree }) => {
                      const order = moved.get(path);

                      return (
                        Option.isSome(tree) && order !== undefined && movedIn(tree.value, order)
                      );
                    })
                  ) {
                    c.note("moved");
                  }

                  assert.deepStrictEqual(verdictOf(after), verdictOf(before));
                  if (after.verdict === "refused") {
                    const predicted = yield* oracleVerdict(written);

                    assert.isTrue(
                      predicted.kind === "refused" &&
                        after.rules.some((rule) => predicted.rules.has(rule)),
                      `refused under ${after.rules.join(", ")}, and the oracle predicts ${JSON.stringify(predicted.kind === "refused" ? [...predicted.rules] : predicted.kind)}`,
                    );
                  } else {
                    yield* exportHolds(
                      after.id,
                      new Map(
                        yield* Effect.forEach(
                          written.filter(({ path }) => moved.has(path)),
                          ({ bytes, path }) =>
                            Effect.map(
                              Effect.orDie(readXml(bytes)),
                              (tree) => [path, tree] as const,
                            ),
                          { concurrency: 1 },
                        ),
                      ),
                    );
                  }
                }).pipe(Effect.scoped),
            ),
          ),
      );
    });
  },
);
