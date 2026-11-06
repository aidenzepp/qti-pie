import { randomUUID } from "node:crypto";
import { readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Result, Schema } from "effect";
import { corpusDocuments } from "#plate/document/corpus.ts";
import { features } from "#plate/ledger/features.ts";
import { PassRecord, SessionNote, passes, sessionNotes } from "#plate/ledger/passes.ts";
import { writeWalkCorpus } from "#scripts/walk-corpus.ts";

/**
 * The scratch folder this run's walk corpus is written to, under the package's git-ignored
 * `work/`. Its name is new for each run, so two runs at once never share or remove each other's
 * files.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `passes-test-${randomUUID()}`,
);

/**
 * Reading every corpus member (about 800) to derive the walk corpus runs in seconds here; the bound
 * leaves room for a slow machine without letting a hung run stall the suite.
 */
const walkTimeoutMs = 600_000;

/**
 * The walk corpus written into {@link scratch}, once for the file, so an item the record names can
 * be looked up among the probes the session walks.
 */
const written = Effect.runSync(
  Effect.cached(
    writeWalkCorpus.pipe(
      Effect.provide(
        ConfigProvider.layerAdd(ConfigProvider.fromUnknown({ PLATE_WALK_CORPUS_DIR: scratch }), {
          asPrimary: true,
        }),
      ),
    ),
  ),
);

/**
 * The note the record gives each check the first sitting did not run.
 */
const notRun = "not run in the first sitting (2026-11-05)";

/**
 * The step-1 items in the order the session lists them: BG007, BG010, BG011, the shuffled Choice
 * with a Prompt, the walk corpus's pattern-mask Text Entry, Item_QTI3_WritingPostcard_02 and the
 * walk corpus's container essay.
 */
const stepOne = [
  "QTI3_BPIG_Examples/items/BG007.xml",
  "QTI3_BPIG_Examples/items/BG010.xml",
  "QTI3_BeginnersGuide_Examples/items/BG011.xml",
  "qtiv3-examples/packaging/items/choice_fixed.xml",
  "pattern.xml",
  "qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_WritingPostcard_02/extended_text_qti3.xml",
  "ordered.xml",
];

/**
 * Read the `pattern-mask` a walk-corpus probe carries, as written.
 *
 * @param item The probe's path under the walk directory.
 * @returns The attribute's value; the test fails when the probe carries none.
 */
const patternOf = (item: string): string => {
  const found = /pattern-mask="(?<value>[^"]*)"/u.exec(
    readFileSync(path.join(scratch, item), "utf-8"),
  );
  assert.isDefined(found?.groups?.["value"], item);

  return found?.groups?.["value"] ?? "";
};

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("ledger/passes.ts", () => {
  it("every entry and every session note decodes, with no field left empty", () => {
    for (const entry of passes) {
      assert.isTrue(Result.isSuccess(Schema.decodeUnknownResult(PassRecord)(entry)), entry.item);

      const fields = {
        browser: entry.browser,
        browserVersion: entry.browserVersion,
        date: entry.date,
        item: entry.item,
        macosVersion: entry.macosVersion,
        notes: entry.notes,
        owner: entry.owner,
        reader: entry.reader,
        readerVersion: entry.readerVersion,
      };
      for (const [field, value] of Object.entries(fields)) {
        assert.isNotEmpty(value, `${entry.item}: ${field}`);
      }
    }
    for (const note of sessionNotes) {
      assert.isTrue(Result.isSuccess(Schema.decodeUnknownResult(SessionNote)(note)), note.text);
      assert.isNotEmpty(note.text);
    }
  });

  it("every entry names the first sitting: Safari on this Mac, the operator, its date, JavaScript on", () => {
    assert.lengthOf(passes, 22);
    for (const entry of passes) {
      assert.deepStrictEqual(
        [entry.browser, entry.browserVersion, entry.macosVersion, entry.owner],
        ["Safari", "27.2", "27.2 (26B123)", "operator"],
        entry.item,
      );
      assert.strictEqual(entry.date, "2026-11-05", entry.item);
      assert.isFalse(Number.isNaN(Date.parse(entry.date)), entry.item);
      assert.strictEqual(entry.javascript, "on", entry.item);
    }
  });

  it("the entries count 3 passed, 1 failed, 16 not-observed and 2 unavailable", () => {
    const counts = new Map<string, number>();
    for (const entry of passes) {
      counts.set(entry.result, (counts.get(entry.result) ?? 0) + 1);
    }

    assert.deepStrictEqual(Object.fromEntries(counts), {
      failed: 1,
      "not-observed": 16,
      passed: 3,
      unavailable: 2,
    });
  });

  it("the sitting's step-1 entries hold the record's results and notes, under VoiceOver", () => {
    const observed = passes.filter(
      (entry) => entry.result === "passed" || entry.result === "failed",
    );

    assert.deepStrictEqual(
      observed.map((entry) => [
        entry.kind,
        entry.item,
        entry.kind === "screen-reader-pass" ? entry.interactions : [],
        entry.result,
      ]),
      [
        ["screen-reader-pass", "QTI3_BPIG_Examples/items/BG007.xml", ["Q-2"], "passed"],
        ["screen-reader-pass", "QTI3_BPIG_Examples/items/BG010.xml", ["Q-20"], "passed"],
        ["screen-reader-pass", "QTI3_BeginnersGuide_Examples/items/BG011.xml", ["Q-5"], "passed"],
        ["screen-reader-pass", "QTI3_BeginnersGuide_Examples/items/BG011.xml", ["Q-5"], "failed"],
      ],
    );
    for (const entry of observed) {
      assert.deepStrictEqual(
        [entry.reader, entry.readerVersion],
        ["VoiceOver", "as shipped with macOS 27.2"],
      );
    }
    assert.include(observed[0]?.notes, '"False, radio button, 2 of 2, list 2 items"');
    assert.include(observed[0]?.notes, "Group name not reported.");
    assert.include(observed[1]?.notes, '"Answer, edit text"');
    assert.include(observed[2]?.notes, '"Answer, text entry area"');
    assert.include(observed[3]?.notes, "Status region: FAILED");
    assert.include(observed[3]?.notes, "hears the result last, not first");
  });

  it("every check the sitting did not run is open, not-observed, with the record's note", () => {
    const open = passes.filter((entry) => entry.result === "not-observed");
    const screenReader = open.filter((entry) => entry.kind === "screen-reader-pass");
    const keyboard = open.filter(
      (entry) => entry.kind === "manual-check" && entry.check === "keyboard-walk-through",
    );
    const walkThrough = open.filter(
      (entry) => entry.kind === "manual-check" && entry.check === "M1 walk-through",
    );

    for (const entry of open) {
      assert.strictEqual(entry.notes, notRun, entry.item);
    }
    assert.deepStrictEqual(
      screenReader.map((entry) => entry.item),
      stepOne.slice(3),
    );
    assert.deepStrictEqual(keyboard.map((entry) => entry.item).slice(0, stepOne.length), stepOne);
    assert.lengthOf(keyboard, stepOne.length + 3);
    assert.deepStrictEqual(
      walkThrough.map((entry) => entry.item),
      ["dev playground"],
    );
  });

  it("each OD-14 (e) entry holds its control's result, and one whose control did not run is not-observed", () => {
    const proofs = passes.flatMap((entry) =>
      entry.kind === "manual-check" && entry.check === "OD-14 (e)"
        ? [[entry.item, entry.control, entry.result]]
        : [],
    );

    assert.deepStrictEqual(proofs, [["od14/od14-probe.xml", "did-not-run", "not-observed"]]);
  });

  it("NVDA and JAWS are recorded unavailable on this machine", () => {
    const unavailable = passes.filter((entry) => entry.kind === "unavailable-reader");

    assert.deepStrictEqual(
      unavailable.map((entry) => [entry.reader, entry.item, entry.result]),
      [
        ["NVDA", "none", "unavailable"],
        ["JAWS", "none", "unavailable"],
      ],
    );
  });

  it("each interaction ID is an interaction row of the features file", () => {
    const interactions = new Set(features.filter((row) => row.family === "Q").map((row) => row.id));

    for (const entry of passes) {
      if (entry.kind === "screen-reader-pass") {
        assert.isNotEmpty(entry.interactions, entry.item);
        for (const id of entry.interactions) {
          assert.isTrue(interactions.has(id), `${entry.item}: ${id}`);
        }
      }
    }
  });

  it.effect(
    "each item is a corpus document or a walk-corpus probe, but the M1 walk-through's and an unavailable reader's",
    () =>
      Effect.gen(function* itemsExist() {
        const started = performance.now();
        const walk = yield* written;
        const documents = new Set([...(yield* corpusDocuments), ...walk.items]);

        for (const entry of passes) {
          if (entry.kind === "unavailable-reader") {
            assert.strictEqual(entry.item, "none", entry.reader);
          } else if (entry.kind === "manual-check" && entry.check === "M1 walk-through") {
            assert.strictEqual(entry.item, "dev playground");
          } else {
            assert.isTrue(documents.has(entry.item), entry.item);
          }
        }
        // The time the corpus walk took, for the seat's report.
        yield* Effect.logInfo(
          `passes: ${String(documents.size)} documents and probes, ${String(Math.round(performance.now() - started))} ms`,
        );
      }),
    { tags: ["corpus"], timeout: walkTimeoutMs },
  );

  it.effect(
    "step 2's derived probes take one probe for each distinct pattern the walk corpus derives",
    () =>
      Effect.gen(function* onePerPattern() {
        const walk = yield* written;
        const derived = passes
          .filter(
            (entry) =>
              entry.kind === "manual-check" &&
              entry.check === "keyboard-walk-through" &&
              entry.item.startsWith("derived/"),
          )
          .map((entry) => patternOf(entry.item));

        assert.strictEqual(new Set(derived).size, derived.length);
        assert.sameMembers(derived, [
          ...new Set(walk.derived.map((probe) => patternOf(probe.item))),
        ]);
      }),
    { tags: ["corpus"], timeout: walkTimeoutMs },
  );

  it("the first sitting's record stays as written: its last note still says the operator will do the rest later", () => {
    assert.deepStrictEqual(
      sessionNotes.map((note) => [note.date, note.owner]),
      [
        ["2026-11-05", "operator"],
        ["2026-11-05", "operator"],
        ["2026-11-05", "operator"],
      ],
    );
    assert.isTrue(
      sessionNotes.at(-1)?.text.endsWith("The operator will do the rest in a later sitting."),
    );
  });

  it("the session notes hold the odd group near Submit and the Theme heading", () => {
    assert.isTrue(
      sessionNotes.some(
        (note) =>
          note.date === "2026-11-05" &&
          note.owner === "operator" &&
          note.text.includes('"play, and 3 more items, and 1 more item, group"'),
      ),
    );
  });
});
