/**
 * The select-then-place protocol in each engine's page: its key map, its state machine and its
 * announcements, over a recording live region and plain tokens and targets, with the change hook
 * writing the placements through the hidden-input wire under a root built by hand.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { server } from "vite-plus/test/browser/context";
import type { LiveRegion } from "#plate/runtime/contract.dom.ts";
import { actionFor, announcements, createSelectPlace } from "#plate/runtime/select-place.dom.ts";
import type { Placement } from "#plate/runtime/select-place.dom.ts";
import { readHidden, writeHidden } from "#plate/runtime/wire.dom.ts";

/**
 * A token of the test: a choice of a Gap Match.
 */
interface Token {
  readonly identifier: string;
  readonly label: string;
}

/**
 * A target of the test: a gap.
 */
interface Target {
  readonly identifier: string;
  readonly label: string;
}

/**
 * The test's two tokens.
 */
const [winter, summer] = [
  { identifier: "W", label: "winter" },
  { identifier: "S", label: "summer" },
] as const satisfies readonly Token[];

/**
 * The test's three gaps.
 */
const [gap1, gap2, gap3] = [
  { identifier: "G1", label: "Gap 1" },
  { identifier: "G2", label: "Gap 2" },
  { identifier: "G3", label: "Gap 3" },
] as const satisfies readonly Target[];

/**
 * The test's gaps in arrow-key order.
 */
const gaps: readonly Target[] = [gap1, gap2, gap3];

/**
 * A live region that keeps every announcement, in order.
 */
interface Recorder extends LiveRegion {
  readonly heard: string[];
}

/**
 * Make a live region that records what it is told.
 *
 * @returns The recorder.
 */
const recorder = (): Recorder => {
  const heard: string[] = [];

  return {
    announce: (text) => {
      heard.push(text);
    },
    heard,
  };
};

/**
 * Write a placement as a Gap Match response value: the token's identifier, then the gap's.
 *
 * @param placement The placement.
 * @returns The `directedPair` text.
 */
const pairOf = ({ target, token }: Placement<Token, Target>): string =>
  `${token.identifier} ${target.identifier}`;

/**
 * Start a machine over the test's gaps, each holding one token, writing its placements as hidden
 * inputs under a fresh root.
 *
 * @returns The machine, its recorder and the root.
 */
const started = () => {
  const live = recorder();
  const root = document.createElement("fieldset");
  const machine = createSelectPlace<Token, Target>({
    capacity: () => 1,
    live,
    onChange: (placements) => {
      writeHidden(root, "q1.RESPONSE", placements.map(pairOf));
    },
    targetLabel: (gap) => gap.label,
    targets: gaps,
    tokenLabel: (token) => token.label,
  });

  return { live, machine, root };
};

describe(server.browser, () => {
  describe("the select-then-place key map", () => {
    it("picks up with Space or Enter, moves with the arrows, Home and End, places, cancels with Escape and returns with Delete or Backspace", () => {
      assert.strictEqual(actionFor("source", " "), "pickUp");
      assert.strictEqual(actionFor("source", "Enter"), "pickUp");
      assert.strictEqual(actionFor("holding", "ArrowRight"), "next");
      assert.strictEqual(actionFor("holding", "ArrowDown"), "next");
      assert.strictEqual(actionFor("holding", "ArrowLeft"), "previous");
      assert.strictEqual(actionFor("holding", "ArrowUp"), "previous");
      assert.strictEqual(actionFor("holding", "Home"), "first");
      assert.strictEqual(actionFor("holding", "End"), "last");
      assert.strictEqual(actionFor("holding", "Enter"), "place");
      assert.strictEqual(actionFor("holding", " "), "place");
      assert.strictEqual(actionFor("holding", "Escape"), "cancel");
      assert.strictEqual(actionFor("placed", "Delete"), "return");
      assert.strictEqual(actionFor("placed", "Backspace"), "return");
    });

    it("leaves every other key to the page", () => {
      assert.isUndefined(actionFor("source", "Escape"));
      assert.isUndefined(actionFor("source", "ArrowRight"));
      assert.isUndefined(actionFor("placed", "Enter"));
      assert.isUndefined(actionFor("holding", "Tab"));
      assert.isUndefined(actionFor("holding", "toString"));
    });
  });

  describe("the select-then-place machine", () => {
    it("picks a token up and announces how to place it", () => {
      const { live, machine } = started();
      const state = machine.pickUp(winter);

      assert.deepStrictEqual(state, {
        cursor: undefined,
        phase: "holding",
        placements: [],
        token: winter,
      });
      assert.deepStrictEqual(live.heard, [
        "Picked up winter. Use the arrow keys to choose a target, Enter to place, Escape to cancel.",
      ]);
    });

    it("moves through the targets, wrapping at both ends, and announces each with its position", () => {
      const { live, machine } = started();

      machine.pickUp(winter);
      live.heard.length = 0;

      const cursors = [
        machine.move("next"),
        machine.move("next"),
        machine.move("next"),
        machine.move("next"),
        machine.move("previous"),
        machine.move("previous"),
        machine.move("last"),
        machine.move("first"),
      ].map((state) => (state.phase === "holding" ? state.cursor : undefined));

      assert.deepStrictEqual(cursors, [0, 1, 2, 0, 2, 1, 2, 0]);
      assert.deepStrictEqual(live.heard, [
        "Gap 1, 1 of 3.",
        "Gap 2, 2 of 3.",
        "Gap 3, 3 of 3.",
        "Gap 1, 1 of 3.",
        "Gap 3, 3 of 3.",
        "Gap 2, 2 of 3.",
        "Gap 3, 3 of 3.",
        "Gap 1, 1 of 3.",
      ]);
    });

    it("moves to the last target on previous before any move", () => {
      const { machine } = started();

      machine.pickUp(winter);

      const state = machine.move("previous");

      assert.strictEqual(state.phase === "holding" ? state.cursor : undefined, 2);
    });

    it("places the held token, announces it, and writes the placements through the change hook", () => {
      const { live, machine, root } = started();

      machine.pickUp(winter);
      machine.move("next");
      machine.move("next");

      const state = machine.place();

      assert.deepStrictEqual(state, {
        phase: "idle",
        placements: [{ target: gap2, token: winter }],
      });
      assert.strictEqual(live.heard.at(-1), "winter placed in Gap 2.");
      assert.deepStrictEqual(readHidden(root, "q1.RESPONSE"), ["W G2"]);
    });

    it("cancels with Escape: the token is back in the source and the placements are unchanged", () => {
      const { live, machine, root } = started();

      machine.pickUp(winter);
      machine.move("first");
      machine.place();
      machine.pickUp(summer);
      machine.move("last");

      const action = actionFor("holding", "Escape");
      const state = action === "cancel" ? machine.cancel() : machine.state();

      assert.deepStrictEqual(state, {
        phase: "idle",
        placements: [{ target: gap1, token: winter }],
      });
      assert.strictEqual(live.heard.at(-1), "Cancelled. summer is back in the source.");
      assert.deepStrictEqual(readHidden(root, "q1.RESPONSE"), ["W G1"]);
    });

    it("refuses a full target, announcing it, and keeps the token held", () => {
      const { live, machine, root } = started();

      machine.pickUp(winter);
      machine.move("first");
      machine.place();
      machine.pickUp(summer);
      machine.move("first");

      const state = machine.place();

      assert.deepStrictEqual(state, {
        cursor: 0,
        phase: "holding",
        placements: [{ target: gap1, token: winter }],
        token: summer,
      });
      assert.strictEqual(live.heard.at(-1), "Gap 1 is full.");
      assert.deepStrictEqual(readHidden(root, "q1.RESPONSE"), ["W G1"]);
    });

    it("returns a placed token to the source, announcing it, and rewrites the placements", () => {
      const { live, machine, root } = started();

      machine.pickUp(winter);
      machine.move("first");
      machine.place();
      machine.pickUp(summer);
      machine.move("last");
      machine.place();

      const state = machine.returnToSource({ target: gap1, token: winter });

      assert.deepStrictEqual(state, {
        phase: "idle",
        placements: [{ target: gap3, token: summer }],
      });
      assert.strictEqual(live.heard.at(-1), "winter returned to the source.");
      assert.deepStrictEqual(readHidden(root, "q1.RESPONSE"), ["S G3"]);
    });

    it("changes nothing and announces nothing for a step its state does not admit", () => {
      const { live, machine, root } = started();
      const idle = machine.state();

      assert.strictEqual(machine.move("next"), idle);
      assert.strictEqual(machine.place(), idle);
      assert.strictEqual(machine.cancel(), idle);
      assert.strictEqual(machine.returnToSource({ target: gap1, token: winter }), idle);
      assert.deepStrictEqual(live.heard, []);

      machine.pickUp(winter);

      const held = machine.state();

      assert.strictEqual(machine.place(), held);
      assert.deepStrictEqual(readHidden(root, "q1.RESPONSE"), []);
    });

    it("starts from given placements, which count against capacity", () => {
      const live = recorder();
      const machine = createSelectPlace<Token, Target>({
        capacity: () => 1,
        live,
        placements: [{ target: gap1, token: winter }],
        targetLabel: (gap) => gap.label,
        targets: gaps,
        tokenLabel: (token) => token.label,
      });

      machine.pickUp(summer);
      machine.move("first");
      machine.place();

      assert.strictEqual(live.heard.at(-1), announcements.full("Gap 1"));
    });
  });

  describe("the select-then-place announcements", () => {
    it("say each step in English", () => {
      assert.strictEqual(
        announcements.pickedUp("winter"),
        "Picked up winter. Use the arrow keys to choose a target, Enter to place, Escape to cancel.",
      );
      assert.strictEqual(announcements.placed("winter", "Gap 2"), "winter placed in Gap 2.");
      assert.strictEqual(
        announcements.cancelled("winter"),
        "Cancelled. winter is back in the source.",
      );
      assert.strictEqual(announcements.full("Gap 1"), "Gap 1 is full.");
      assert.strictEqual(announcements.returned("winter"), "winter returned to the source.");
      assert.strictEqual(announcements.moved("Gap 2", 2, 3), "Gap 2, 2 of 3.");
    });
  });
});
