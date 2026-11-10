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
import { ImportRefused } from "#pantry/import/refusal.ts";
import { namesOf } from "#pantry/model/composed.ts";
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
import type { CaseEntry } from "#pantry/test/gen/attribute-order.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import type { OracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { authorLayerHookTimeoutMs, hasLease } from "#pantry/test/settings.ts";

/**
 * The names a generated tree is written under.
 */
const names = namesOf(grammar);

/**
 * How long the search may run: each case imports its package twice and exports what it accepts,
 * a few seconds a case on the lease.
 */
const orderTimeoutMs = 900_000;

/**
 * What an import of a package did: accepted under the id it answered, or refused under a rule,
 * with the identity of each law the database named (none for a reader's refusal).
 */
type Imported =
  | { readonly id: Uuid; readonly verdict: "accepted" }
  | { readonly laws: readonly string[]; readonly rule: string; readonly verdict: "refused" };

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

  return {
    laws:
      refused.origin._tag === "Database" ? refused.origin.laws.map(({ identity }) => identity) : [],
    rule: refused.rule,
    verdict: "refused",
  } satisfies Imported;
});

/**
 * Write what an import did without the id it drew.
 *
 * @param imported - What the import did.
 * @returns Its verdict and, for a refusal, its rule.
 */
const verdictOf = (imported: Imported) =>
  imported.verdict === "accepted"
    ? { verdict: imported.verdict }
    : { rule: imported.rule, verdict: imported.verdict };

/**
 * The roots that write an `ObjectIdentifier` row from their `identifier`.
 */
const objectRoots: ReadonlySet<string> = new Set(["qti-assessment-item", "qti-assessment-test"]);

/**
 * The law `ObjectIdentifier`'s identifier piece breaks, as a refusal's origin names it.
 */
const objectIdentifierCheck = '{"kind":"check","relation":"ObjectIdentifier","name":"E1_derived"}';

/**
 * Decide whether a package has an item or test root whose `identifier` the `E1_derived` check on
 * `ObjectIdentifier` refuses: once the import strips its leading and trailing XML whitespace
 * (`lead` and `trail`), the piece left is empty or holds a character below `!`, so it fails
 * `identifierPattern` (`src/qti/metadata.ts`).
 *
 * @param entries - The package's entries as the case reads them.
 * @returns Whether one such root is written.
 */
const breaksObjectIdentifier = (entries: readonly CaseEntry[]): boolean =>
  entries.some(
    ({ tree }) =>
      Option.isSome(tree) &&
      objectRoots.has(tree.value.root.local) &&
      tree.value.root.attributes.some(
        ({ local, namespace, value }) =>
          namespace === "" &&
          local === "identifier" &&
          !/^[!-\uFFFD\u{10000}-\u{10FFFF}]+$/u.test(
            value.replaceAll(/^[\t\n\r ]+|[\t\n\r ]+$/gu, ""),
          ),
      ),
  );

/**
 * The one refusal this test admits under a rule the law oracle does not predict, issue #103.
 * The import writes the derived `ObjectIdentifier` row for an item identifier outside its value
 * domain, and PostgreSQL refuses that row's immediate `E1_derived` check before the attribute's own
 * `value_domain` check, so the import names `derived` where the oracle predicts
 * `attribute-lexical`. The verdict is the same. It holds at grizzle 6995af4 and at 89e94c0 alike;
 * this test first drew it in the run that moved the pin (`TEST_SEED=1234327904`, case 14). It is
 * keyed as narrowly as the case allows: the refusal names that one law and no other, a root's
 * `identifier` breaks that check ({@link breaksObjectIdentifier}), and the oracle refuses the
 * package under `attribute-lexical`, the value domain the same identifier breaks. Every other
 * refusal is still held to the oracle's rules, and `derived` is admitted nowhere else. Remove it
 * with issue #103.
 *
 * @param imported - What the import did.
 * @param predicted - What the oracle predicts.
 * @param entries - The package's entries as the case reads them.
 * @returns Whether the refusal is that known exception.
 */
const knownException = (
  imported: Imported,
  predicted: OracleVerdict,
  entries: readonly CaseEntry[],
): boolean =>
  imported.verdict === "refused" &&
  imported.rule === "derived" &&
  imported.laws.length === 1 &&
  imported.laws[0] === objectIdentifierCheck &&
  predicted.kind === "refused" &&
  predicted.rules.has("attribute-lexical") &&
  breaksObjectIdentifier(entries);

/**
 * The law on `Expression` an operand count outside its operator's breaks (rule `P2`), as a
 * refusal's origin names it.
 */
const arityCheck = '{"kind":"check","relation":"Expression","name":"Arity"}';

/**
 * The law on `Expression` an operand that does not fit its operator breaks (rule `P23`), as a
 * refusal's origin names it.
 */
const operandFitCheck = '{"kind":"check","relation":"Expression","name":"Operand_fit"}';

/**
 * The one pair of refusals this test admits under different rules, issue #104. A package with two
 * broken `Expression` rows, one breaking `Operand_fit` alone (rule `P23`) and one breaking `Arity`
 * and `Operand_fit` (rule `P2`), is refused under the rule of whichever row PostgreSQL checks
 * first, and that varies from import to import of the same bytes; the reordering does not move
 * it. This test first drew it at the re-pin to grizzle 89e94c0 (`TEST_SEED=1819136236`, case 6),
 * and it holds at 6995af4 too. It is keyed as narrowly as the case allows: both imports refuse, one
 * under `P2` and one under `P23`, each names only those two `Expression` checks and `Operand_fit`
 * among them, the `P23` side names `Operand_fit` alone, and the oracle predicts both rules. Every
 * other pair of imports must still name the same rule. Remove it with issue #104.
 *
 * @param before - What the import of the package as read did.
 * @param after - What the import of the reordered package did.
 * @param predicted - What the oracle predicts of the reordered package.
 * @returns Whether the two refusals are that known exception.
 */
const firstRuleVaries = (before: Imported, after: Imported, predicted: OracleVerdict): boolean => {
  if (before.verdict !== "refused" || after.verdict !== "refused") {
    return false;
  }

  const sides = [before, after];
  const ruled = (rule: string) => sides.find((side) => side.rule === rule);
  const p23 = ruled("P23");

  return (
    ruled("P2") !== undefined &&
    p23 !== undefined &&
    sides.every(
      ({ laws }) =>
        laws.includes(operandFitCheck) &&
        laws.every((law) => law === arityCheck || law === operandFitCheck),
    ) &&
    p23.laws.length === 1 &&
    predicted.kind === "refused" &&
    predicted.rules.has("P2") &&
    predicted.rules.has("P23")
  );
};

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

                  if (after.verdict === "refused") {
                    const predicted = yield* oracleVerdict(written);

                    // Issue #104: the one keyed pair of refusals under two rules (firstRuleVaries).
                    if (!firstRuleVaries(before, after, predicted)) {
                      assert.deepStrictEqual(verdictOf(after), verdictOf(before));
                    }

                    // Issue #103: the one keyed exception to the oracle's rules (knownException).
                    assert.isTrue(
                      (predicted.kind === "refused" && predicted.rules.has(after.rule)) ||
                        knownException(after, predicted, entries),
                      `refused under ${after.rule}, and the oracle predicts ${JSON.stringify(predicted.kind === "refused" ? [...predicted.rules] : predicted.kind)}`,
                    );
                  } else {
                    assert.deepStrictEqual(verdictOf(after), verdictOf(before));
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
