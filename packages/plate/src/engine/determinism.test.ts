/**
 * Criterion 7 in Node: one item with one seed gives the same template values, the same HTML and
 * the same outcomes on every run, one test with one seed gives the same outcomes from each run of
 * its outcome processing, and one item ref with one seed gives the same template defaults, and the
 * same template values from them (`GOAL.md` criterion 7, H4).
 *
 * The items and the test are `src/test/determinism.ts`'s hand-built fixture, which the page tests
 * drive through the same browser entries. Here the item also runs through the Schema side (`open`,
 * `begin`, `score`, `restore`), which a page cannot load.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import { runAttempt } from "#plate/engine/attempt.ts";
import { sin } from "#plate/engine/math.ts";
import {
  defaultLabel,
  drawBelow,
  drawFloat,
  drawStream,
  outcomeLabel,
  responseLabel,
  templateLabel,
} from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import { redact, render } from "#plate/render.ts";
import { restore } from "#plate/restore.ts";
import { score } from "#plate/score.ts";
import type { Responses } from "#plate/session/session.ts";
import {
  determinismConfiguration,
  determinismInstance,
  determinismItem,
  determinismLocation,
  determinismResponses,
  determinismScope,
  determinismSeed,
  determinismXml,
  observe,
  observeDefaults,
  observeOutcomes,
  otherSeed,
  pickerInstance,
  pickerItem,
  pickerScope,
  pinned,
  pinnedDefaultDraws,
  pinnedOutcomeDraws,
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
const renderedFrom = (accepted: Accepted, record: ItemRecord, values: Responses = {}): string =>
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

/**
 * The fixture item's pinned `SCORE`, which the fixture test reads as `ITEM1.SCORE`.
 */
const itemScore = 0.27261476873917745;

/**
 * What one run of the fixture test draws, replayed: `DRAWN`, `BONUS`, and the value `BONUS` would
 * take had the branch not taken drawn first.
 */
interface Replayed {
  readonly bonus: bigint;
  readonly drawn: bigint;
  readonly skipped: bigint;
}

/**
 * The draws one run of the fixture test takes, in order, replayed from a stream apart from the
 * evaluator: `DRAWN` from 1 to 100, then `BONUS` from 100 to 199 in the branch taken.
 *
 * @param draw The run's stream.
 * @returns What the run draws.
 */
const replayed = (draw: Draw): Replayed => {
  const drawn = 1n + drawBelow(draw, 100n);
  const bonus = 100n + drawBelow(draw, 100n);
  const skipped = 100n + drawBelow(draw, 100n);

  return { bonus, drawn, skipped };
};

describe("criterion 7 in Node: the determinism fixture's test", () => {
  it("gives the pinned outcome draws of runs 1 and 2 on two fresh starts", () => {
    const starts = [
      Result.getOrThrow(observeOutcomes()),
      Result.getOrThrow(observeOutcomes()),
    ] as const;

    assert.notStrictEqual(starts[0], starts[1]);

    for (const [index, start] of starts.entries()) {
      assert.deepStrictEqual(start, pinnedOutcomeDraws, `start ${index + 1}`);
    }

    assert.notDeepEqual(
      pinnedOutcomeDraws[0],
      pinnedOutcomeDraws[1],
      "run 2 draws apart from run 1",
    );
  });

  it("gives other outcome draws under another seed", () => {
    const other = Result.getOrThrow(observeOutcomes(otherSeed));

    for (const [index, outcomes] of other.entries()) {
      for (const drawn of ["DRAWN", "BONUS"]) {
        assert.notDeepEqual(
          outcomes[drawn],
          pinnedOutcomeDraws[index]?.[drawn],
          `run ${index + 1}, ${drawn}`,
        );
      }
    }
  });

  it("replays the pinned outcome draws from the stream each run's label keys by the seed, not the default key's: DRAWN, then BONUS in the branch taken, no draw in the branch not taken", () => {
    const fallback = replayed(drawStream("", ""));

    for (const [index, outcomes] of pinnedOutcomeDraws.entries()) {
      const run = index + 1;
      const { bonus, drawn, skipped } = replayed(
        drawStream(determinismSeed, outcomeLabel(determinismInstance, run)),
      );

      assert.deepStrictEqual(
        [outcomes["DRAWN"], outcomes["BONUS"], outcomes["TOTAL"]],
        [integer(drawn), integer(bonus), float(itemScore + Number(bonus))],
        `run ${run}`,
      );
      assert.notStrictEqual(bonus, skipped, `run ${run}: BONUS had the branch not taken drawn`);
      assert.notDeepEqual(
        [outcomes["DRAWN"], outcomes["BONUS"]],
        [integer(fallback.drawn), integer(fallback.bonus)],
        `run ${run}: drawn on the default key`,
      );
    }
  });

  it("reads its outcome draws' ITEM1 from the fixture item's record after the pinned attempt", () => {
    const after = Result.getOrThrow(
      runAttempt(determinismItem, Result.getOrThrow(startRecord()), determinismResponses),
    );
    const [scoped] = determinismScope.items;

    assert.deepStrictEqual(pinned.outcomes["SCORE"], float(itemScore));
    assert.deepStrictEqual(scoped?.record, {
      correct: after.correct,
      defaults: after.defaults,
      outcomes: after.outcomes,
      responses: after.responses,
      templates: after.templates,
    });
    assert.strictEqual(scoped?.numAttempts, after.numAttempts);
  });
});

/**
 * The defaults the picker item declares for `LOW` and `HIGH`, which the item ref's replace.
 */
const declaredBounds = [integer(1n), integer(2n)] as const;

/**
 * The draws the picker item ref's template defaults take, in document order, replayed from a
 * stream apart from the evaluator: `LOW` from 1 to 9, then `HIGH` from 10 to 99.
 *
 * @param draw The item ref's stream.
 * @returns `LOW` and `HIGH`.
 */
const replayedBounds = (draw: Draw): readonly [bigint, bigint] => {
  const low = 1n + drawBelow(draw, 9n);
  const high = 10n + drawBelow(draw, 90n);

  return [low, high];
};

describe("criterion 7 in Node: the determinism fixture's template defaults", () => {
  it("gives the pinned template default draws, and the template values from them, on two fresh starts", () => {
    const starts = [
      Result.getOrThrow(observeDefaults()),
      Result.getOrThrow(observeDefaults()),
    ] as const;

    assert.notStrictEqual(starts[0], starts[1]);

    for (const [index, start] of starts.entries()) {
      assert.deepStrictEqual(start, pinnedDefaultDraws, `start ${index + 1}`);
    }
  });

  it("gives other template default draws, and other template values, under another seed", () => {
    const other = Result.getOrThrow(observeDefaults(otherSeed));

    for (const drawn of ["LOW", "HIGH"]) {
      assert.notDeepEqual(other.defaults[drawn], pinnedDefaultDraws.defaults[drawn], drawn);
    }

    for (const drawn of ["LOW", "HIGH", "PICK", "SPAN"]) {
      assert.notDeepEqual(other.templates[drawn], pinnedDefaultDraws.templates[drawn], drawn);
    }
  });

  it("replays the pinned template default draws from the stream defaultLabel keys by the seed, not the default key's: LOW, then HIGH, from one stream, then PICK from the item's own between them", () => {
    const [low, high] = replayedBounds(
      drawStream(determinismSeed, defaultLabel(determinismInstance, 1)),
    );
    const [fallbackLow, fallbackHigh] = replayedBounds(drawStream("", ""));
    const pick =
      low +
      drawBelow(
        drawStream(determinismSeed, templateLabel(pickerInstance, pickerItem.identifier)),
        high - low + 1n,
      );

    assert.deepStrictEqual(pinnedDefaultDraws.defaults, { HIGH: integer(high), LOW: integer(low) });
    assert.notDeepEqual([low, high], [fallbackLow, fallbackHigh], "drawn on the default key");
    assert.deepStrictEqual(pinnedDefaultDraws.templates, {
      HIGH: integer(high),
      LOW: integer(low),
      PICK: integer(pick),
      SPAN: integer(high - low),
    });
    assert.notDeepEqual(
      [integer(low), integer(high)],
      [...declaredBounds],
      "the item's template processing read its declared defaults",
    );
  });

  it("evaluates its template default draws over a scope whose PICKER record is the one fresh starts for the item", () => {
    const record = fresh(pickerItem, pickerInstance);
    const [scoped] = pickerScope.items;

    assert.deepStrictEqual(scoped?.record, {
      correct: record.correct,
      defaults: record.defaults,
      outcomes: record.outcomes,
      responses: record.responses,
      templates: record.templates,
    });
    assert.strictEqual(scoped?.numAttempts, record.numAttempts);
    assert.deepStrictEqual(scoped?.declarations.templates, pickerItem.templates);
  });
});
