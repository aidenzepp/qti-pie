import { createHash } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Config, Effect, FileSystem, Option, Result } from "effect";
import { renderText, UnknownEntity } from "#pantry/test/spec-cache/render.ts";
import { specDocuments } from "#pantry/test/spec-sections.ts";

/**
 * The metadata binding's entry in {@link specDocuments}: its text pin is the one the recorded
 * command reproduces as it stands.
 */
const metadataBinding = specDocuments.find(({ text }) => text === "qti-md-bind/index.txt");

/**
 * The metadata binding's cached HTML, or `None` when the cache under `HOME` does not hold it.
 */
const metadataHtml = await Effect.runPromise(
  Effect.gen(function* readMetadataHtml() {
    const home = yield* Config.NonEmptyString("HOME");
    const fs = yield* FileSystem.FileSystem;
    const file = `${home}/.cache/gr8des/${metadataBinding?.html ?? ""}`;

    return (yield* fs.exists(file)) ? Option.some(yield* fs.readFileString(file)) : Option.none();
  }).pipe(Effect.provide(NodeServices.layer)),
);

/**
 * Render an HTML string that holds only entities of the table.
 *
 * @param html - The HTML.
 * @returns Its rendering, or the empty string when it fails, which the caller's assertion reports.
 */
const rendered = (html: string): string => Result.getOrElse(renderText(html), () => "");

describe("test/spec-cache/render.ts, the line-keeping tag strip", () => {
  it("turns each tag into one space and each run of spaces and tabs into one, and keeps a line with no tag", () => {
    assert.strictEqual(rendered("<p>a</p>\tb  \t c\nplain  line \n"), " a b c\nplain line \n");
    assert.strictEqual(rendered("no tag, one space each\n"), "no tag, one space each\n");
  });

  it("decodes the entities after the tags are gone, and decimal and hex character references", () => {
    assert.strictEqual(rendered("&lt;b&gt;x&lt;/b&gt;"), "<b>x</b>");
    assert.strictEqual(rendered("it&#39;s&#xa0;&#XA7;1"), "it's §1");
    assert.strictEqual(rendered("&amp;lt; &quot;&apos;&copy;&laquo;&raquo;"), "&lt; \"'©«»");
  });

  it("keeps the line count of a document whose tags each stand on one line", () => {
    const lines = Array.from(
      { length: 40 },
      (_, index) => `<td class="c${index}">cell &gt; ${index}</td>`,
    );

    assert.strictEqual(rendered(lines.join("\n")).split("\n").length, 40);
  });

  it("fails on a named entity outside the table, naming it and its offset", () => {
    const result = renderText("<p>a&nbsp;b</p>");

    const failure = Result.isFailure(result) ? result.failure : undefined;

    assert.instanceOf(failure, UnknownEntity);
    assert.deepStrictEqual(
      failure instanceof UnknownEntity
        ? { entity: failure.entity, offset: failure.offset }
        : undefined,
      { entity: "&nbsp;", offset: 4 },
    );
  });

  it("fails on a character reference to a control character", () => {
    const result = renderText("a&#10;b");

    assert.strictEqual(Result.isFailure(result) ? result.failure._tag : undefined, "UnknownEntity");
  });

  it("leaves an entity inside a tag to the tag, and an ampersand that starts no reference as it is", () => {
    assert.strictEqual(rendered('<a href="?x=1&nbsp;y">R & D</a>'), " R & D ");
  });
});

describe.skipIf(Option.isNone(metadataHtml))(
  "test/spec-cache/render.ts, against the cached metadata binding",
  () => {
    it("renders the metadata binding's HTML to the bytes of its pinned text", () => {
      const html = Option.getOrElse(metadataHtml, () => "");
      const text = Result.getOrElse(renderText(html), () => "");

      assert.strictEqual(
        createHash("sha256").update(html).digest("hex"),
        metadataBinding?.htmlSha256,
      );
      assert.strictEqual(
        createHash("sha256").update(text).digest("hex"),
        metadataBinding?.textSha256,
      );
    });
  },
);
