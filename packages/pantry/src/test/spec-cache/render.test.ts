import { createHash } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Config, Effect, FileSystem, Option, Result } from "effect";
import { renderText, UnknownEntity } from "#pantry/test/spec-cache/render.ts";
import { specDocuments } from "#pantry/test/spec-sections.ts";
import type { SpecDocument } from "#pantry/test/spec-sections.ts";

/**
 * Read a specification's HTML from the cache under `HOME`.
 *
 * @param document - The specification's entry in {@link specDocuments}, or `undefined` when the
 *   table does not list it.
 * @returns Its cached HTML, or `None` when the cache does not hold it.
 */
const cachedHtml = (document: SpecDocument | undefined): Promise<Option.Option<string>> =>
  Effect.runPromise(
    Effect.gen(function* readCachedHtml() {
      const home = yield* Config.NonEmptyString("HOME");
      const fs = yield* FileSystem.FileSystem;
      const file = `${home}/.cache/gr8des/${document?.html ?? ""}`;

      return (yield* fs.exists(file)) ? Option.some(yield* fs.readFileString(file)) : Option.none();
    }).pipe(Effect.provide(NodeServices.layer)),
  );

/**
 * The metadata binding's entry in {@link specDocuments}.
 */
const metadataBinding = specDocuments.find(({ text }) => text === "qti-md-bind/index.txt");

/**
 * The metadata binding's cached HTML, or `None` when the cache under `HOME` does not hold it.
 */
const metadataHtml = await cachedHtml(metadataBinding);

/**
 * The Data-SSML information model and binding's entry in {@link specDocuments}, the one cached
 * document that writes `&nbsp;`.
 */
const dataSsml = specDocuments.find(({ text }) => text === "datassml/infobind.txt");

/**
 * The Data-SSML document's cached HTML, or `None` when the cache under `HOME` does not hold it.
 */
const dataSsmlHtml = await cachedHtml(dataSsml);

/**
 * Render an HTML string that holds only entities of the table.
 *
 * @param html - The HTML.
 * @returns Its rendering, or the empty string when it fails, which the caller's assertion reports.
 */
const rendered = (html: string): string => Result.getOrElse(renderText(html), () => "");

/**
 * Render an HTML string that holds a reference the renderer refuses.
 *
 * @param html - The HTML.
 * @returns The reference it refuses and where it stands, or `undefined` when it renders.
 */
const refused = (
  html: string,
): { readonly entity: string; readonly offset: number } | undefined => {
  const result = renderText(html);

  return Result.isFailure(result)
    ? { entity: result.failure.entity, offset: result.failure.offset }
    : undefined;
};

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
    const result = renderText("<p>a&hellip;b</p>");

    const failure = Result.isFailure(result) ? result.failure : undefined;

    assert.instanceOf(failure, UnknownEntity);
    assert.deepStrictEqual(
      failure instanceof UnknownEntity
        ? { entity: failure.entity, offset: failure.offset }
        : undefined,
      { entity: "&hellip;", offset: 4 },
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

describe("test/spec-cache/render.ts, the bytes of the recorded Python command", () => {
  it("[113-1] decodes the references before it collapses blanks, so a reference to a space joins its run", () => {
    assert.strictEqual(rendered("a &#32; b"), "a b");
    assert.strictEqual(rendered("a &#x20; b"), "a b");
    assert.strictEqual(rendered("a&#32;&#32;&#32;b"), "a b");
    assert.strictEqual(rendered("<i>a</i>&#32;<b>b</b>"), " a b ");
  });

  it("[113-1] renders a reference to a noncharacter as nothing", () => {
    assert.strictEqual(rendered("a &#xFFFE; b"), "a b");
    assert.strictEqual(rendered("a &#x10FFFE; b"), "a b");
    assert.strictEqual(rendered("a &#65535; b"), "a b");
    assert.strictEqual(rendered("a&#xFDD0;b&#xFDEF;c"), "abc");
  });

  it("[113-1] drops each of the 66 noncharacters and keeps the code points beside them", () => {
    const noncharacters = [
      ...Array.from({ length: 32 }, (_, index) => 0xfd_d0 + index),
      ...Array.from({ length: 17 }, (_, plane) => [
        plane * 0x1_00_00 + 0xff_fe,
        plane * 0x1_00_00 + 0xff_ff,
      ]).flat(),
    ];

    assert.strictEqual(noncharacters.length, 66);

    for (const codePoint of noncharacters) {
      assert.strictEqual(rendered(`a&#x${codePoint.toString(16)};b`), "ab");
    }

    for (const codePoint of [0xfd_cf, 0xfd_f0, 0xff_fd, 0xe0_00, 0x1_00_00, 0x10_ff_fd]) {
      assert.strictEqual(
        rendered(`a&#x${codePoint.toString(16)};b`),
        `a${String.fromCodePoint(codePoint)}b`,
      );
    }
  });

  it("fails on a surrogate and on a value past U+10FFFF, where the refusal stands", () => {
    assert.deepStrictEqual(refused("a&#xD800;b"), { entity: "&#xD800;", offset: 1 });
    assert.deepStrictEqual(refused("a&#xDFFF;b"), { entity: "&#xDFFF;", offset: 1 });
    assert.deepStrictEqual(refused("<p>a&#x110000;b</p>"), { entity: "&#x110000;", offset: 4 });
  });

  it("[113-1] decodes a legacy named reference written without its semicolon", () => {
    assert.strictEqual(rendered("a &amp b"), "a & b");
    assert.strictEqual(rendered("a &nbsp b"), "a \u{A0} b");
    assert.strictEqual(rendered("a &amp; b"), "a & b");
    assert.strictEqual(rendered("<p>a&nbsp;b</p>"), " a\u{A0}b ");
  });

  it("decodes each legacy name of the table with its semicolon, without it and at the end of the text", () => {
    const legacy = [
      ["amp", "&"],
      ["copy", "©"],
      ["gt", ">"],
      ["laquo", "«"],
      ["lt", "<"],
      ["nbsp", "\u{A0}"],
      ["quot", '"'],
      ["raquo", "»"],
    ] as const;

    for (const [name, character] of legacy) {
      assert.strictEqual(rendered(`a&${name}; b`), `a${character} b`);
      assert.strictEqual(rendered(`a&${name} b`), `a${character} b`);
      assert.strictEqual(rendered(`a&${name}`), `a${character}`);
    }
  });

  it("leaves apos, which is not a legacy name, as it is without its semicolon", () => {
    assert.strictEqual(rendered("a &apos b"), "a &apos b");
    assert.strictEqual(rendered("a &apos; b"), "a ' b");
    assert.strictEqual(rendered("&apo b &aposs"), "&apo b &aposs");
  });

  it("takes the longest legacy name that a run of name characters starts with", () => {
    assert.strictEqual(rendered("&ampx"), "&x");
    assert.strictEqual(rendered("&copyright"), "©right");
    assert.strictEqual(rendered("&ltr &quotes"), '<r "es');
    assert.strictEqual(rendered("&amp-x;"), "&-x;");
    assert.strictEqual(rendered("&nbsp."), "\u{A0}.");
    assert.strictEqual(rendered("&amp&lt;"), "&<");
    assert.strictEqual(rendered("&amp;lt;"), "&lt;");
    assert.strictEqual(rendered(`&amp${"x".repeat(40)}`), `&${"x".repeat(40)}`);
  });

  it("ends a name at a tag, which the strip removes first", () => {
    assert.strictEqual(rendered("&amp<b>x</b>"), "& x ");
    assert.strictEqual(rendered("<b>x</b>&amp<b>y</b>"), " x & y ");
  });

  it("decodes a numeric reference written without its semicolon", () => {
    assert.strictEqual(rendered("&#32 b"), " b");
    assert.strictEqual(rendered("a&#65 b"), "aA b");
    assert.strictEqual(rendered("a &#x41 b"), "a A b");
    assert.strictEqual(rendered("a&#x41b"), "a\u{41B}");
    assert.strictEqual(rendered("a &#38 b"), "a & b");
  });

  it("leaves an ampersand that no reference and no legacy name starts as it is", () => {
    for (const text of [
      "AT&T",
      "R&D",
      "&foo b",
      "&1abc;",
      "a & b",
      "a&;b",
      "&#;",
      "&#xyz;",
      "&am b",
      "&a",
      "a&",
      `&${"x".repeat(40)}`,
    ]) {
      assert.strictEqual(rendered(text), text);
    }

    assert.strictEqual(rendered("&&amp;"), "&&");
  });

  it("fails on a legacy name the table does not hold, with or without its semicolon", () => {
    assert.deepStrictEqual(refused("a &reg b"), { entity: "&reg", offset: 2 });
    assert.deepStrictEqual(refused("a &AMP b"), { entity: "&AMP", offset: 2 });
    assert.deepStrictEqual(refused("&notin b"), { entity: "&notin", offset: 0 });
    assert.deepStrictEqual(refused("<p>a&reg;b</p>"), { entity: "&reg;", offset: 4 });
    assert.deepStrictEqual(refused("&ampfoo;"), { entity: "&ampfoo;", offset: 0 });
    assert.deepStrictEqual(refused("a &foo; b"), { entity: "&foo;", offset: 2 });
  });

  it("fails on a control character written without its semicolon", () => {
    assert.deepStrictEqual(refused("a&#10 b"), { entity: "&#10", offset: 1 });
    assert.deepStrictEqual(refused("a&#x80 b"), { entity: "&#x80", offset: 1 });
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

describe.skipIf(Option.isNone(dataSsmlHtml))(
  "test/spec-cache/render.ts, against the cached Data-SSML document",
  () => {
    it("[113-3] renders the Data-SSML HTML, which writes &nbsp;, to the bytes of its pinned text", () => {
      const html = Option.getOrElse(dataSsmlHtml, () => "");
      const text = Result.getOrElse(renderText(html), () => "");

      assert.strictEqual(createHash("sha256").update(html).digest("hex"), dataSsml?.htmlSha256);
      assert.strictEqual(createHash("sha256").update(text).digest("hex"), dataSsml?.textSha256);
    });
  },
);
