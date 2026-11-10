/**
 * The key-text bounds against grizzle's own representability rule, `keyTextBytes(fields)`, which
 * measures a key's B-tree entry as the schema's compilation does: each bound is the UTF-8 bytes it
 * leaves beside its widest key's other fields. That each index of the composed `Qti` holds its
 * bounded text representably is the compilation's own proof, never restated here: grizzle refuses
 * an index whose entry can pass PostgreSQL's limit (`UnrepresentableKey`, `laws/model/plan.ts`
 * `plannedEntry` of the vendored engine) wherever it compiles `Qti`.
 */
import { keyTextBytes, str, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { OpenLocal } from "#pantry/qti/attributes.ts";
import {
  keyTextBytes as keyTextBound,
  localNameBytes,
  namespaceBytes,
  prefixBytes,
  utf8Length,
  widestTextKey,
} from "#pantry/qti/limits.ts";

/**
 * Any text, line ends included: the language a probe of a byte bound cuts.
 */
const anyText = str.regex("^.*$", "su");

describe("qti/limits.ts", () => {
  it("states each bound as the UTF-8 bytes grizzle's keyTextBytes leaves beside its widest key's other fields", () => {
    // Oracle: grizzle's own rule (`keyTextBytes`, public/text.ts of the vendored engine), the
    // measure the schema's compilation refuses an entry by, read over each kind's widest key: the
    // key text beside `widestTextKey`, the namespace name beside a uuid and the local name's own
    // type, `OpenAttributeName(node, uri, local)`, and the prefix beside a uuid, `Namespace(node,
    // prefix)`; the local name and the namespace name share their entry evenly.
    assert.strictEqual(keyTextBound, keyTextBytes(widestTextKey));
    assert.strictEqual(namespaceBytes, keyTextBytes([uuid, OpenLocal]));
    assert.strictEqual(prefixBytes, keyTextBytes([uuid]));
    assert.isAtLeast(namespaceBytes, localNameBytes);
    assert.isBelow(
      keyTextBytes([uuid, str.bytes(localNameBytes + 1, anyText)]),
      localNameBytes + 1,
    );
    assert.deepStrictEqual(
      { keyTextBound, localNameBytes, namespaceBytes, prefixBytes },
      { keyTextBound: 2587, localNameBytes: 1329, namespaceBytes: 1329, prefixBytes: 2665 },
    );
  });

  it("counts a text's bytes as UTF-8 does: one to four bytes a code point", () => {
    // Oracle: the specification as a checker, RFC 3629 §3's table of byte sequences.
    // Bound: the first and last code point of each of the four lengths.
    for (const [text, bytes] of [
      ["\u{0}", 1],
      ["\u{7F}", 1],
      ["\u{80}", 2],
      ["\u{7FF}", 2],
      ["\u{800}", 3],
      ["\u{FFFF}", 3],
      ["\u{10000}", 4],
      ["\u{10FFFF}", 4],
    ] as const) {
      assert.strictEqual(utf8Length(text), bytes, text);
    }
  });
});
