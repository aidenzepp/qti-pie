/**
 * A resource's type as an optional part (the boundary class, option B): the host writes a
 * `ResourceTyped`, and a `TypedHref` for its href, exactly where the type spells a handle, and
 * `NamedHref`'s (path, type) pairs are exactly the typed hrefs'; the law oracle's verdict and the
 * laws it finds broken over each case of reading 93's box are the stated ones, the import's rows,
 * judged on the host, are refused under the same rule, and a type that spells nothing breaks AL1
 * alone.
 *
 * Oracle: the specification as a checker, spec readings 67 (a resource's `type` is its version's
 * enumeration, an `xs:string` restriction whose whitespace is preserved, XSD 1.1 Part 2 §4.3.6) and
 * 93 (a document has one type, so one path under two document types is refused), and the law
 * oracle's verdict on each case.
 */
import { randomUUID } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeSpec, specOf } from "#pantry/test/fixtures.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { resourceTypeCases } from "#pantry/test/resource-type-cases.ts";

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The timeout, in milliseconds, that each of this file's tests states: a hang guard, never a
 * budget. Measured 2026-11-07: 2.8 s at a load average of 85 to 93, its slowest test.
 */
const testTimeoutMs = 120_000;

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/package.ts, a resource's type",
  (it) => {
    for (const { broken, edits, label, named, resources, typed, verdict } of resourceTypeCases) {
      it.effect(
        `writes a type only where it spells a handle, and judges ${label} by reading 93`,
        () =>
          Effect.gen(function* resourceTypeCase() {
            const simple = specOf("simple");
            const dir = yield* materializeSpec({
              ...simple,
              edits: [...simple.edits, ...edits],
              name: `resource-types-${label.replaceAll(/[^\da-z]+/giu, "-")}`,
            });
            const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
            const minted = new Set<string>();
            const { inputs } = yield* readProgram(dir, (): NodeId => {
              const id: NodeId = randomUUID();
              minted.add(id);

              return id;
            });
            const host = hostVerdictOf(inputs, minted);

            assert.deepStrictEqual(verdictOf(judgment), verdict, Formatter.format(judgment));
            assert.sameMembers(
              judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
              [...broken],
              "the laws broken",
            );
            assert.strictEqual(
              Arr.isReadonlyArrayNonEmpty(host.brokenLaws)
                ? Option.getOrUndefined(ruleOfLaws(host.brokenLaws))
                : undefined,
              verdict.verdict === "accepted" ? undefined : verdict.rule,
              "the import's rows, judged on the host, refused under the same rule",
            );

            assert.strictEqual(inputs.Resource.size, resources, "a Resource a resource");
            assert.strictEqual(inputs.ResourceTyped.size, typed, "a ResourceTyped a typed one");
            assert.strictEqual(inputs.TypedHref.size, typed, "a TypedHref a typed href");
            assert.sameDeepMembers(
              [...inputs.NamedHref.values()].map(({ path, type }) => [path, type]),
              named.map(([path, type]) => [path, type]),
              "NamedHref's pairs are the typed hrefs'",
            );
          }),
        testTimeoutMs,
      );
    }
  },
);
