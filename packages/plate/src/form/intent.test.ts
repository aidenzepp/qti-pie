import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { entryName, partition } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { decodeIntent, encodeIntent, intentName } from "#plate/form/intent.ts";
import type { Intent } from "#plate/session/session.ts";

/**
 * The test session the tests post for, a bare UUID as `render` draws one.
 */
const instance = "3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b";

/**
 * Another test session's instance.
 */
const otherInstance = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

/**
 * One intent of each kind, `go` at the first and at a later sequence index.
 */
const intents: readonly Intent[] = [
  { kind: "next" },
  { kind: "previous" },
  { kind: "go", sequenceIndex: 1 },
  { kind: "go", sequenceIndex: 12 },
  { kind: "submit-item" },
  { kind: "submit-part" },
  { kind: "end-part" },
];

/**
 * Construct the entry a form posts for an intent of {@link instance}.
 *
 * @param value The posted value.
 * @returns The entry, named for {@link instance}.
 */
const posted = (value: string | Blob): Entry => [intentName(instance), value];

describe("intentName", () => {
  it("names the entry <instance>.intent", () => {
    assert.strictEqual(intentName(instance), `${instance}.intent`);
    assert.strictEqual(intentName("_r_1_"), "_r_1_.intent");
  });
});

describe("encodeIntent", () => {
  it("writes each intent's kind, and go with its sequence index", () => {
    assert.deepStrictEqual(intents.map(encodeIntent), [
      "next",
      "previous",
      "go:1",
      "go:12",
      "submit-item",
      "submit-part",
      "end-part",
    ]);
  });
});

describe("decodeIntent", () => {
  it("reads back every intent encodeIntent writes", () => {
    for (const intent of intents) {
      assert.deepStrictEqual(
        decodeIntent([posted(encodeIntent(intent))], instance),
        Option.some(intent),
      );
    }
  });

  it("reads this session's entry among host fields and responses", () => {
    const entries: readonly Entry[] = [
      ["csrf-token", "abc"],
      [entryName(`${instance}.1`, "RESPONSE"), "choiceA"],
      posted("next"),
    ];
    assert.deepStrictEqual(decodeIntent(entries, instance), Option.some({ kind: "next" }));
  });

  it("ignores an entry of another instance", () => {
    const entries: readonly Entry[] = [[intentName(otherInstance), "next"]];
    assert.deepStrictEqual(decodeIntent(entries, instance), Option.none());
    assert.deepStrictEqual(decodeIntent(entries, otherInstance), Option.some({ kind: "next" }));
  });

  it("ignores an entry whose name only begins like this session's", () => {
    assert.deepStrictEqual(decodeIntent([["intent", "next"]], instance), Option.none());
    assert.deepStrictEqual(
      decodeIntent([[`${instance}.intents`, "next"]], instance),
      Option.none(),
    );
  });

  it("gives none when no intent is posted", () => {
    assert.deepStrictEqual(decodeIntent([], instance), Option.none());
  });

  it("gives none for a malformed value", () => {
    const malformed = [
      "",
      "Next",
      " next",
      "next ",
      "submit",
      "go",
      "go:",
      "go:0",
      "go:01",
      "go:+1",
      "go:-1",
      "go:1.5",
      "go:1e3",
      "go: 1",
      "go:9007199254740992",
      "go:1:2",
    ];
    for (const value of malformed) {
      assert.deepStrictEqual(decodeIntent([posted(value)], instance), Option.none(), value);
    }
  });

  it("reads go at the largest safe sequence index", () => {
    assert.deepStrictEqual(
      decodeIntent([posted(`go:${String(Number.MAX_SAFE_INTEGER)}`)], instance),
      Option.some({ kind: "go", sequenceIndex: Number.MAX_SAFE_INTEGER }),
    );
  });

  it("gives none for a file, and for an intent posted twice", () => {
    assert.deepStrictEqual(decodeIntent([posted(new Blob(["next"]))], instance), Option.none());
    assert.deepStrictEqual(
      decodeIntent([posted("next"), posted("previous")], instance),
      Option.none(),
    );
    assert.deepStrictEqual(decodeIntent([posted("next"), posted("next")], instance), Option.none());
  });

  it("reads the intent partition calls foreign for an item of a bare-UUID session", () => {
    const item = `${instance}.1`;
    const intent = posted(encodeIntent({ kind: "go", sequenceIndex: 2 }));
    const response: Entry = [entryName(item, "RESPONSE"), "choiceA"];

    assert.deepStrictEqual(partition([response, intent], item), {
      foreign: [intent],
      host: [],
      own: [response],
    });
    assert.deepStrictEqual(
      decodeIntent([response, intent], instance),
      Option.some({ kind: "go", sequenceIndex: 2 }),
    );
  });
});
