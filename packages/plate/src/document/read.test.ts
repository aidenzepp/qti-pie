import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import {
  attr,
  el,
  entity,
  qtiNamespace,
  text,
  xmlnsNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";

/**
 * Encode a hand-built document as the bytes a host would hand the reader.
 *
 * @param xml The document's text.
 * @returns The text's UTF-8 bytes.
 */
const bytesOf = (xml: string): Uint8Array => new TextEncoder().encode(xml);

describe("document/read.ts", () => {
  it.effect(
    "CAT/test.xml is refused by the reader at its first undeclared entity, nbsp",
    () =>
      Effect.gen(function* undeclaredEntity() {
        const location = "qtiv3-examples/CAT/test.xml";
        const refusal = yield* Effect.flip(readSource(location, yield* readCorpusFile(location)));

        assert.strictEqual(refusal.rule, "reader-refused");
        assert.strictEqual(Option.getOrUndefined(refusal.readerRule), "undeclared-entity");
        assert.deepStrictEqual(refusal.location, { kind: "document" });
        assert.strictEqual(refusal.document, location);
        assert.include(refusal.detail["detail"], '"nbsp"');
      }),
    { tags: ["corpus"] },
  );

  it.effect("a mismatched end tag is refused as not well-formed at a line and column", () =>
    Effect.gen(function* notWellFormed() {
      const refusal = yield* Effect.flip(readSource("hand-built.xml", bytesOf("<a><b></a>")));

      assert.strictEqual(refusal.rule, "not-well-formed");
      assert.strictEqual(refusal.location.kind, "position");
      assert.strictEqual(refusal.location.kind === "position" ? refusal.location.line : 0, 1);
      assert.isTrue(Option.isNone(refusal.readerRule));
      assert.property(refusal.detail, "message");
    }),
  );

  it.effect(
    "BG007 reads to a QTI root that keeps its xmlns:xsi declaration",
    () =>
      Effect.gen(function* bg007() {
        const location = "QTI3_BPIG_Examples/items/BG007.xml";
        const source = yield* readSource(location, yield* readCorpusFile(location));

        assert.strictEqual(source.location, location);
        assert.strictEqual(source.root.local, "qti-assessment-item");
        assert.strictEqual(source.root.namespace, qtiNamespace);
        assert.deepInclude(source.root.attributes, attr("xsi", xsiNamespace, xmlnsNamespace));
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "text and CDATA become text, an undeclared entity stays one, and comments and PIs go",
    () =>
      Effect.gen(function* mapping() {
        const source = yield* readSource(
          "hand-built.xml",
          bytesOf(
            '<!DOCTYPE a SYSTEM "a.dtd"><a xmlns:q="urn:q" q:x="1 &e; 2"><?p d?>t<![CDATA[<c>]]><!--k-->&e;<b/></a>',
          ),
        );

        assert.deepStrictEqual(
          source.root,
          el(
            "a",
            [attr("q", "urn:q", xmlnsNamespace), attr("x", "1 &e; 2", "urn:q", ["e"])],
            [text("t"), text("<c>"), entity("e"), el("b", [], [], "")],
            "",
          ),
        );
      }),
  );
});
