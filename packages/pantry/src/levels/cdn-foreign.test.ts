/**
 * The single-CDN level's foreign-markup rule (`#pantry/levels/cdn-foreign.ts`):
 *
 * - **Its laws**, with no database: the `Cdn` level states a `CdnForeign` check over each of the
 *   rule's derived relations, the attributes of an uninterpreted open class and the foreign
 *   elements, and every law it adds is a check over a relation of its own, so it states no law of
 *   `Qti` that `Qti` does not.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Cdn` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`, so the
 *   rule's checks are known to compile however `lawsOf` reads them.
 * - **What it selects**, #55's case (`src/qti/cdn.test.ts` at `b340be09`), every kind and every
 *   attribute name exhausted: exactly the three foreign element kinds and the three open classes
 *   but `data-*`.
 */
import { lawsOf } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { foreignElementKinds, uninterpretedClasses } from "#pantry/levels/cdn-foreign.ts";
import { qti } from "#pantry/qti/schema.ts";
import { grizzleCheck, writtenCdnConfig } from "#pantry/test/grizzle-check.ts";
import { addedLaws } from "#pantry/test/level-laws.ts";

/**
 * The origin the level is built for.
 */
const origin = "https://cdn.example.com/";

/**
 * The derived relations the foreign-markup rule judges: the attributes of an uninterpreted open
 * class, and the foreign elements.
 */
const foreignRelations = ["CdnForeignAttribute", "CdnForeignElement"] as const;

/**
 * How long reading the level's laws may take: `lawsOf` compiles `Qti`'s law model and the level's.
 * Measured 2026-11-10: 245.9 s at a load average of 64.72 to 95.91.
 * Measured 2026-11-10: 66.6 s at a load average of 66.91 to 104.00.
 */
const lawsTimeoutMs = 600_000;

/**
 * How long grizzle's check of the installation may take: it compiles every statement of `Qti` and
 * of the level, and every program of the author's login.
 * Measured 2026-11-10: 167.5 s at a load average of 64.72 to 95.91.
 * Measured 2026-11-10: 41.4 s at a load average of 66.91 to 104.00.
 */
const compileTimeoutMs = 360_000;

describe("levels/cdn-foreign.ts", () => {
  it(
    "states a CdnForeign check over each derived relation of the rule at the Cdn level, and no law over a Qti relation",
    () => {
      // Oracle: spec U12 done_when, "lawsOf lists the four checks at level Cdn and no new Qti
      // law"; GOAL G4, a level only adds laws.
      const base = qti();
      const level = singleCdn(base, { origin });
      const baseLaws = lawsOf(base);
      const levelLaws = lawsOf(level);
      const added = addedLaws(levelLaws, baseLaws);
      // A level's record holds every relation of every level of it; a live derived relation is no
      // whole entry (`wholeEntriesOf`), so the record is what names the level's own.
      const baseNames = new Set(Object.keys(base.relations));
      const ownNames = new Set(Object.keys(level.relations).filter((name) => !baseNames.has(name)));

      assert.deepStrictEqual(
        added
          .flatMap((law) =>
            law.kind === "check" && law.name === "CdnForeign" ? [law.relation] : [],
          )
          .toSorted(),
        [...foreignRelations],
      );
      assert.deepStrictEqual(addedLaws(baseLaws, levelLaws), [], "a Qti law the level drops");
      for (const law of added) {
        assert.isTrue(
          law.kind === "check" && ownNames.has(law.relation),
          `${Formatter.format(law)} is a law the level states over no relation of its own`,
        );
      }
    },
    lawsTimeoutMs,
  );

  it.effect(
    "grizzle check compiles an installation holding the Cdn level: no statement of it does not compile",
    () =>
      Effect.scoped(
        Effect.gen(function* compiles() {
          const config = yield* writtenCdnConfig("cdn-foreign-compile", origin);
          const { code, output } = yield* grizzleCheck(config);
          const lines = output.split("\n");

          // Oracle: grizzle's `compileSchema` and program compilation, as `grizzle check` runs
          // them over the installation. Drift against the committed snapshot passes, as in
          // `src/test/compile.test.ts`. Bound: the one installation; residual none.
          assert.isTrue(
            code === 0 || code === 1,
            `grizzle check exited ${String(code)}:\n${output}`,
          );
          assert.isTrue(
            lines.some((line) => line.startsWith("Cdn: ")),
            `grizzle check printed no Cdn line:\n${output}`,
          );
          assert.deepStrictEqual(
            lines.filter((line) => line.includes("does not compile")),
            [],
          );
        }),
      ),
    compileTimeoutMs,
  );
});

/**
 * Every element kind and every attribute name, each one handle the case judges.
 */
const handles = [
  ...grammar.kinds.nodeKind.handles.map((handle) => ({ _tag: "kind" as const, handle })),
  ...grammar.kinds.attributeName.handles.map((handle) => ({ _tag: "name" as const, handle })),
];

describe("levels/cdn-foreign.ts, what it selects", () => {
  it.effect(
    "selects a node exactly when it is a foreign element, and an attribute exactly when its name is the foreign, no-namespace or own-namespace class: every kind and every attribute name, exhausted",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every NodeKind and every AttributeName handle",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace([
              "kind admitted",
              "kind refused",
              "name admitted",
              "name refused",
            ] as const),
            generator: (source) =>
              source.draw(
                element(
                  Arr.isReadonlyArrayNonEmpty(handles)
                    ? handles
                    : assert.fail("no kind or name to draw from"),
                ),
              ),
            limit: handles.length,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "#55's uninterpretable markup: the three foreign element kinds and the three open attribute classes but data-*",
            },
            suite: "levels/cdn-foreign/selects",
          },
          (handle, c) =>
            Effect.sync(() => {
              const refused =
                handle._tag === "kind"
                  ? ["foreign-element", "no-namespace-element", "own-namespace-element"].includes(
                      handle.handle,
                    )
                  : ["foreign", "no-namespace", "own-namespace"].includes(handle.handle);
              const selected =
                handle._tag === "kind"
                  ? foreignElementKinds.some((kind) => kind === handle.handle)
                  : uninterpretedClasses.some((name) => name === handle.handle);

              assert.strictEqual(selected, refused, handle.handle);
              c.note(`${handle._tag} ${selected ? "refused" : "admitted"}`);
            }),
        ),
      ),
  );
});
