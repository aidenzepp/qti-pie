/**
 * Criterion 7 in Node: one item with one seed gives the same template values, the same HTML and
 * the same outcomes on every run (`GOAL.md` criterion 7, H4).
 *
 * The item is `src/test/determinism.ts`'s hand-built fixture, which the page tests drive through
 * the same browser entries. Here it also runs through the Schema side (`open`, `begin`, `score`,
 * `restore`), which a page cannot load.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { sin } from "#plate/engine/math.ts";
import {
  drawBelow,
  drawFloat,
  drawStream,
  responseLabel,
  templateLabel,
} from "#plate/engine/random.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import { redact, render } from "#plate/render.ts";
import { restore } from "#plate/restore.ts";
import { score } from "#plate/score.ts";
import {
  determinismConfiguration,
  determinismInstance,
  determinismItem,
  determinismLocation,
  determinismResponses,
  determinismSeed,
  determinismXml,
  observe,
  otherSeed,
  pinned,
  startRecord,
} from "#plate/test/determinism.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The runs each fresh record is driven through.
 */
const runs = [1, 2, 3] as const;

/**
 * Open the fixture's document, which `check` must accept.
 *
 * @returns The accepted item.
 */
const opened = Effect.fnUntraced(function* opened() {
  const verdict = yield* open(determinismLocation, new TextEncoder().encode(determinismXml));

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${determinismLocation} is ${verdict.verdict}, not accepted`),
  );
});

/**
 * Render an accepted item from a record under the fixture's configuration and instance.
 *
 * @param accepted The accepted item.
 * @param record The record whose template and outcome values `redact` reads.
 * @param values The values the controls show, none by default.
 * @returns The HTML.
 */
const renderedFrom = (
  accepted: Accepted,
  record: ItemRecord,
  values: ItemRecord["responses"] = {},
): string =>
  Result.getOrThrow(
    render(redact(accepted, record), determinismConfiguration, {
      instance: determinismInstance,
      values,
    }),
  ).html;

describe("criterion 7 in Node: the determinism fixture", () => {
  it("[I-5] gives the pinned template values, HTML and outcomes on three runs from each of two fresh records", () => {
    const records = [Result.getOrThrow(startRecord()), Result.getOrThrow(startRecord())] as const;

    assert.notStrictEqual(records[0], records[1]);
    assert.deepStrictEqual(records[0], records[1]);

    for (const [index, record] of records.entries()) {
      for (const run of runs) {
        assert.deepStrictEqual(
          Result.getOrThrow(observe(record)),
          pinned,
          `record ${index + 1}, run ${run}`,
        );
      }
    }
  });

  it("[I-5] gives other template values, and other HTML, under another seed", () => {
    const other = Result.getOrThrow(startRecord(otherSeed));

    for (const drawn of ["N", "X", "S", "M"]) {
      assert.notDeepEqual(other.templates[drawn], pinned.templates[drawn], drawn);
    }

    assert.notStrictEqual(Result.getOrThrow(observe(other)).html, pinned.html);
  });

  it("[I-5] ran its template processing: no template value is its declared default", () => {
    const { templates } = Result.getOrThrow(startRecord());

    assert.deepStrictEqual(
      Object.keys(templates).toSorted(),
      [...determinismItem.templates.keys()].toSorted(),
    );

    for (const [name, declaration] of determinismItem.templates) {
      assert.notDeepEqual(
        templates[name],
        Option.getOrElse(declaration.defaultValue, () =>
          nullOf(declaration.baseType, declaration.cardinality),
        ),
        name,
      );
    }
  });

  it("[I-5] replays the pinned values from the documented draws: one restart, the qti-and operand after a false one drawn, no draw in the branch not taken", () => {
    const draw = drawStream(
      determinismSeed,
      templateLabel(determinismInstance, determinismItem.identifier),
    );
    const firstN = 1n + drawBelow(draw, 9n);
    const n = 1n + drawBelow(draw, 9n);
    const x = drawFloat(draw) * 10;
    const andOperand = drawBelow(draw, 100n);
    const m = 100n + drawBelow(draw, 100n);
    const drawn =
      1n + drawBelow(drawStream(determinismSeed, responseLabel(determinismInstance, 1)), 6n);

    assert.isBelow(Number(firstN), 5, "the first pass fails N >= 5, so the run restarts");
    assert.notStrictEqual(m, 100n + andOperand, "M had the qti-and stopped at its false operand");
    assert.deepStrictEqual(
      [pinned.templates["N"], pinned.templates["X"], pinned.templates["S"], pinned.templates["M"]],
      [integer(n), float(x), float(sin(x)), integer(m)],
    );
    assert.deepStrictEqual(pinned.outcomes["DRAWN"], integer(drawn));
  });

  it("[I-5] loads in a page: its value imports keep to the browser modules' allowlist", () => {
    assert.deepStrictEqual(checkAllowlist(sourceModules(), ["src/test/determinism.ts"]), []);
  });

  it.effect("[I-5] is the model open builds from its source", () =>
    Effect.gen(function* buildsTheFixture() {
      const accepted = yield* opened();

      assert.deepStrictEqual(accepted.item, determinismItem);
    }),
  );

  it.effect(
    "[I-5] begin starts the pinned record: restored, it renders the pinned HTML, and score's record holds the pinned outcomes",
    () =>
      Effect.gen(function* beginsThePinnedRecord() {
        const accepted = yield* opened();
        const begun = yield* Effect.fromResult(
          begin(accepted, { instance: determinismInstance, seed: determinismSeed }),
        );
        const scored = yield* Effect.fromResult(score(accepted, determinismResponses, begun));
        const before = yield* Effect.fromResult(restore(accepted, begun));
        const after = yield* Effect.fromResult(restore(accepted, scored));

        assert.deepStrictEqual(before.record.templates, pinned.templates);
        assert.strictEqual(renderedFrom(accepted, before.record), pinned.html);
        assert.deepStrictEqual(after.record.outcomes, pinned.outcomes);
      }),
  );

  it.effect(
    "[I-5] renders byte-equal HTML from restore over begin's record and over score's record, given the same values (H4)",
    () =>
      Effect.gen(function* rendersRestoredAlike() {
        const accepted = yield* opened();
        const begun = yield* Effect.fromResult(
          begin(accepted, { instance: determinismInstance, seed: determinismSeed }),
        );
        const before = yield* Effect.fromResult(restore(accepted, begun));
        const after = yield* Effect.fromResult(
          restore(accepted, yield* Effect.fromResult(score(accepted, determinismResponses, begun))),
        );

        assert.deepStrictEqual(after.values, determinismResponses);
        assert.strictEqual(
          renderedFrom(accepted, before.record, after.values),
          renderedFrom(accepted, after.record, after.values),
        );
      }),
  );
});
