import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { commentName, decodeComment } from "#plate/form/comment.ts";
import { entryName, partition } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { intentName } from "#plate/form/intent.ts";

/**
 * The instance the entries below are posted for, a bare UUID as `render` draws one.
 */
const instance = "3f2b8c1e-5a6d-4e7f-9b0a-1c2d3e4f5a6b";

/**
 * Another item's instance.
 */
const otherInstance = "0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";

describe("commentName", () => {
  it("[W0-BG] names the entry <instance>.comment", () => {
    assert.strictEqual(commentName(instance), `${instance}.comment`);
    assert.strictEqual(commentName("_r_1_"), "_r_1_.comment");
  });
});

describe("decodeComment", () => {
  it("[W0-BG] reads one entry of its name, and none for two entries or none", () => {
    assert.deepStrictEqual(
      decodeComment([[commentName(instance), "x"]], instance),
      Option.some("x"),
    );
    assert.deepStrictEqual(
      decodeComment(
        [
          [commentName(instance), "x"],
          [commentName(instance), "y"],
        ],
        instance,
      ),
      Option.none(),
    );
    assert.deepStrictEqual(decodeComment([], instance), Option.none());
  });

  it("[W0-BG] keeps the text as posted, a blank or an empty one included", () => {
    for (const text of ["", "  ", " A note\nover two lines "]) {
      assert.deepStrictEqual(
        decodeComment([[commentName(instance), text]], instance),
        Option.some(text),
      );
    }
  });

  it("[W0-BG] ignores an entry of another name, another instance's or a file's", () => {
    const others: readonly Entry[] = [
      ["csrf-token", "abc"],
      [intentName(instance), "next"],
      [entryName(instance, "RESPONSE"), "A"],
      [commentName(otherInstance), "not mine"],
      [`${commentName(instance)}s`, "longer"],
    ];

    assert.deepStrictEqual(decodeComment(others, instance), Option.none());
    assert.deepStrictEqual(
      decodeComment([...others, [commentName(instance), "mine"]], instance),
      Option.some("mine"),
    );
    assert.deepStrictEqual(
      decodeComment([...others, [commentName(instance), new Blob(["not text"])]], instance),
      Option.none(),
    );
  });
});

describe("the comment's entry among a form's entries", () => {
  it("[W0-BG] falls in the owner the intent's entry does", () => {
    const comment: Entry = [commentName(instance), "x"];
    const intent: Entry = [intentName(instance), "next"];
    const owned = partition([comment, intent], instance);

    assert.deepStrictEqual(owned.own, [comment, intent]);
    assert.deepStrictEqual(owned.foreign, []);
    assert.deepStrictEqual(owned.host, []);

    const elsewhere = partition([comment, intent], otherInstance);

    assert.deepStrictEqual(elsewhere.own, []);
    assert.deepStrictEqual(elsewhere.foreign, [comment, intent]);
  });
});
