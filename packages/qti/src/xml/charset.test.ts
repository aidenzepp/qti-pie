/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML label (`UTF-8`, `US-ASCII`) and encoder-class (`utf8`) data this module's table is keyed by. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { classify, exportCharset, threshold } from "#qti/xml/charset.ts";
import type { Attribute, Child, Element, Misc, XmlDocument } from "#qti/xml/tree.ts";

/**
 * Builds an attribute in no namespace, whose name and value are the two arguments.
 */
const attribute = (qname: string, value: string): Attribute => ({
  local: qname,
  namespace: "",
  prefix: "",
  qname,
  references: [],
  value,
});

/**
 * Builds an element in no namespace with the given attributes and children.
 */
const element = (
  qname: string,
  attributes: readonly Attribute[] = [],
  children: readonly Child[] = [],
): Element => ({
  attributes,
  children,
  kind: "element",
  local: qname,
  namespace: "",
  prefix: "",
  qname,
});

/**
 * Builds a document read under `charset` around `root`, with the given prolog and epilog.
 */
const document = (
  charset: string,
  root: Element,
  around: { readonly epilog?: readonly Misc[]; readonly prolog?: readonly Misc[] } = {},
): XmlDocument => ({
  charset,
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: around.epilog ?? [],
  prolog: around.prolog ?? [],
  root,
});

/**
 * The euro sign, the first code point above the ISO-8859-1 threshold that windows-1252 can hold.
 */
const euro = "€";

/**
 * Builds a comment node holding `text`.
 */
const comment = (text: string): Misc => ({ kind: "comment", text });

describe("classify", () => {
  it.effect("puts every ISO-8859-1 alias in the latin1 class, however it is spelled", () =>
    Effect.sync(() => {
      for (const label of ["latin1", "ISO_8859-1", "iso-8859-1", "L1", "IBM819", "iso-ir-100"]) {
        assert.deepStrictEqual(classify(label), { canonical: "ISO-8859-1", class: "latin1" });
      }
    }),
  );

  it.effect("puts every US-ASCII alias in the ascii class", () =>
    Effect.sync(() => {
      for (const label of ["US-ASCII", "ascii", "ANSI_X3.4-1968", "ISO646-US", "csASCII"]) {
        assert.deepStrictEqual(classify(label), { canonical: "US-ASCII", class: "ascii" });
      }
    }),
  );

  it.effect("gives UTF-8 and each UTF-16 label their own canonical name", () =>
    Effect.sync(() => {
      assert.deepStrictEqual(classify("utf-8"), { canonical: "UTF-8", class: "utf8" });
      assert.deepStrictEqual(classify("UTF-16"), { canonical: "UTF-16", class: "utf16" });
      assert.deepStrictEqual(classify("utf-16le"), { canonical: "UTF-16LE", class: "utf16" });
      assert.deepStrictEqual(classify("UTF-16BE"), { canonical: "UTF-16BE", class: "utf16" });
    }),
  );

  it.effect("leaves every other label decode-only and keeps its spelling", () =>
    Effect.sync(() => {
      assert.deepStrictEqual(classify("windows-1252"), {
        canonical: "windows-1252",
        class: "decode-only",
      });
      assert.strictEqual(classify("ISO-8859-9").class, "decode-only");
    }),
  );
});

describe("threshold", () => {
  it.effect("is 0xFF for latin1, 0x7F for ascii and absent for every other class", () =>
    Effect.sync(() => {
      assert.deepStrictEqual(threshold("latin1"), Option.some(0xff));
      assert.deepStrictEqual(threshold("ascii"), Option.some(0x7f));
      assert.deepStrictEqual(threshold("utf8"), Option.none());
      assert.deepStrictEqual(threshold("utf16"), Option.none());
      assert.deepStrictEqual(threshold("decode-only"), Option.none());
    }),
  );
});

describe("exportCharset", () => {
  it.effect(
    "returns the read label for UTF-8, UTF-16 and ISO-8859-1 documents within threshold",
    () =>
      Effect.sync(() => {
        for (const label of ["UTF-8", "UTF-16", "ISO-8859-1"]) {
          const doc = document(label, element("item", [attribute("id", "a")]), {
            prolog: [comment(" café "), { data: "x", kind: "pi", target: "pi" }],
          });

          assert.strictEqual(exportCharset(label, doc), label);
        }
      }),
  );

  it.effect("returns the label as spelled, not its canonical name", () =>
    Effect.sync(() => {
      const doc = document("latin1", element("item"));

      assert.strictEqual(exportCharset("latin1", doc), "latin1");
    }),
  );

  it.effect("leaves a UTF-8 or UTF-16 document alone whatever characters it holds", () =>
    Effect.sync(() => {
      const doc = document("UTF-8", element("item"), { prolog: [comment(euro)] });

      assert.strictEqual(exportCharset("UTF-8", doc), "UTF-8");
      assert.strictEqual(exportCharset("UTF-16", doc), "UTF-16");
    }),
  );

  it.effect("returns UTF-8 for a windows-1252 document", () =>
    Effect.sync(() => {
      const doc = document("windows-1252", element("item"));

      assert.strictEqual(exportCharset("windows-1252", doc), "UTF-8");
    }),
  );

  it.effect("returns UTF-8 for an ISO-8859-1 document with U+20AC inside a comment", () =>
    Effect.sync(() => {
      const doc = document("ISO-8859-1", element("item"), { prolog: [comment(` ${euro} `)] });

      assert.strictEqual(exportCharset("ISO-8859-1", doc), "UTF-8");
    }),
  );

  it.effect("finds a character above the threshold in every place a reference cannot reach", () =>
    Effect.sync(() => {
      const offenders: readonly (readonly [string, XmlDocument])[] = [
        ["prolog comment", document("ISO-8859-1", element("a"), { prolog: [comment(euro)] })],
        ["epilog comment", document("ISO-8859-1", element("a"), { epilog: [comment(euro)] })],
        [
          "prolog PI target",
          document("ISO-8859-1", element("a"), {
            prolog: [{ data: "", kind: "pi", target: `p${euro}` }],
          }),
        ],
        [
          "epilog PI data",
          document("ISO-8859-1", element("a"), {
            epilog: [{ data: euro, kind: "pi", target: "p" }],
          }),
        ],
        ["root qname", document("ISO-8859-1", element(`a${euro}`))],
        ["nested qname", document("ISO-8859-1", element("a", [], [element(`b${euro}`)]))],
        [
          "attribute qname",
          document("ISO-8859-1", element("a", [], [element("b", [attribute(`c${euro}`, "")])])),
        ],
        [
          "comment child",
          document("ISO-8859-1", element("a", [], [{ kind: "comment", text: euro }])),
        ],
        [
          "PI child",
          document("ISO-8859-1", element("a", [], [{ data: euro, kind: "pi", target: "p" }])),
        ],
      ];

      for (const [where, doc] of offenders) {
        assert.strictEqual(exportCharset("ISO-8859-1", doc), "UTF-8", where);
      }
    }),
  );

  it.effect("does not inspect text runs or attribute values, which a reference can carry", () =>
    Effect.sync(() => {
      const doc = document(
        "ISO-8859-1",
        element(
          "a",
          [attribute("alt", euro)],
          [
            { cdata: true, kind: "text", value: euro },
            { kind: "entityRef", name: "e" },
          ],
        ),
      );

      assert.strictEqual(exportCharset("ISO-8859-1", doc), "ISO-8859-1");
    }),
  );

  it.effect("holds US-ASCII to 0x7F and ISO-8859-1 to 0xFF", () =>
    Effect.sync(() => {
      const accented = document("US-ASCII", element("a"), { prolog: [comment("café")] });
      const astral = document("ISO-8859-1", element("a"), { prolog: [comment("\u{1F600}")] });

      assert.strictEqual(exportCharset("US-ASCII", accented), "UTF-8");
      assert.strictEqual(exportCharset("ISO-8859-1", accented), "ISO-8859-1");
      assert.strictEqual(exportCharset("ISO-8859-1", astral), "UTF-8");
    }),
  );
});
