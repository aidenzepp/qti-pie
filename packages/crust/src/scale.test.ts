/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the encoder is given. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { canonicalize } from "#crust/canonical.ts";
import { encode } from "#crust/encode.ts";
import { readXml } from "#crust/read.ts";
import type { ReadOptions } from "#crust/read.ts";
import type { Child, Element, XmlDocument } from "#crust/tree.ts";
import { writeXml } from "#crust/write.ts";

/**
 * The depth of the deep trees and the width of the wide one: 100,000 elements on one path, and
 * 100,000 children under one parent. A recursive walk overflows Node's default stack within a few
 * thousand levels, so these bounds sit two orders of magnitude past it.
 */
const DEPTH = 100_000;

const WIDTH = 100_000;

/**
 * The read these tests make: no element depth refused, so the trees above the reader's default of
 * 256 are read whole.
 */
const unbounded: ReadOptions = { elementDepth: Number.POSITIVE_INFINITY };

/**
 * The timeout, in milliseconds, for each scale test. The slowest, the namespaced deep round trip,
 * reads 100,000 levels twice; in three runs of the full crust suite on 2026-11-05 (Node 26.13.0,
 * load averages 41 to 46) it took 8,690, 10,181 and 11,784 ms, and every other scale test under
 * 3 s. Measured 2026-11-07: 23.4 s at a load average of 70 to 74, and 16.7 s at 63 to 73. The
 * hang guard is over twice the slowest, rounded up to the next 10,000. Raise it only on a new
 * measurement recorded here, never to make a run pass.
 */
const SCALE_TIMEOUT_MS = 50_000;

/**
 * A childless element `qname` in no namespace with no attributes.
 *
 * @param qname - The element's name.
 * @param children - Its children.
 * @returns The element.
 */
const element = (qname: string, children: readonly Child[]): Element => ({
  attributes: [],
  children,
  kind: "element",
  local: qname,
  namespace: "",
  prefix: "",
  qname,
});

/**
 * A document holding only `root`.
 *
 * @param root - The root element.
 * @returns The document.
 */
const bare = (root: Element): XmlDocument => ({
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  prolog: [],
  root,
});

/**
 * A chain of `depth` elements `a`, each the only child of the one above, with `bottom` as the
 * deepest one's children, built from the bottom up.
 *
 * @param depth - The number of elements.
 * @param bottom - The deepest element's children.
 * @returns The top of the chain.
 */
const chain = (depth: number, bottom: readonly Child[]): Element => {
  let top = element("a", bottom);
  for (let level = 1; level < depth; level += 1) {
    top = element("a", [top]);
  }

  return top;
};

/**
 * Each element on the path of first children from `root` down, in that order.
 *
 * @param root - The top of the path.
 * @returns The elements on it, `root` first.
 */
const firstChildPath = (root: Element): readonly Element[] => {
  const path = [root];
  for (let [child] = root.children; child?.kind === "element"; [child] = child.children) {
    path.push(child);
  }

  return path;
};

/**
 * The index of the first character at which `left` and `right` differ, or -1 when they are equal,
 * so a mismatch in a megabyte of output reports where it is rather than the whole text.
 *
 * @param left - One text.
 * @param right - The other.
 * @returns The first differing index, or -1.
 */
const firstDifference = (left: string, right: string): number => {
  const shared = Math.min(left.length, right.length);
  for (let index = 0; index < shared; index += 1) {
    if (left[index] !== right[index]) {
      return index;
    }
  }

  return left.length === right.length ? -1 : shared;
};

/**
 * The text of UTF-8 bytes.
 *
 * @param bytes - The bytes.
 * @returns Their text.
 */
const text = (bytes: Uint8Array): string => new TextDecoder("utf-8", { fatal: true }).decode(bytes);

describe(`every walk is iterative: depth ${DEPTH} and width ${WIDTH}`, () => {
  it.effect(
    `encode, writeXml and canonicalize write a chain ${DEPTH} deep in their documented forms, and readXml reads it back to the same bytes`,
    () =>
      Effect.gen(function* deepChain() {
        const doc = bare(chain(DEPTH, []));
        const written = `${"<a>".repeat(DEPTH - 1)}<a/>${"</a>".repeat(DEPTH - 1)}`;
        const bytes = yield* encode(doc, "UTF-8");

        assert.strictEqual(firstDifference(text(bytes), written), -1);
        assert.strictEqual(firstDifference(yield* writeXml(doc, { threshold: 0x7f }), written), -1);
        assert.strictEqual(
          firstDifference(text(canonicalize(doc)), `${"<a>".repeat(DEPTH)}${"</a>".repeat(DEPTH)}`),
          -1,
        );

        const read = yield* readXml(bytes, unbounded);

        assert.strictEqual(firstChildPath(read.root).length, DEPTH);
        assert.strictEqual(firstDifference(text(yield* encode(read, "UTF-8")), written), -1);
      }),
    SCALE_TIMEOUT_MS,
  );

  it.effect(
    `encode, writeXml and canonicalize write ${WIDTH} children of one parent in their documented forms, and readXml reads them back to the same bytes`,
    () =>
      Effect.gen(function* wideParent() {
        const doc = bare(
          element(
            "r",
            Array.from({ length: WIDTH }, () => element("a", [])),
          ),
        );
        const written = `<r>${"<a/>".repeat(WIDTH)}</r>`;
        const bytes = yield* encode(doc, "UTF-8");

        assert.strictEqual(firstDifference(text(bytes), written), -1);
        assert.strictEqual(firstDifference(yield* writeXml(doc, { threshold: 0x7f }), written), -1);
        assert.strictEqual(
          firstDifference(text(canonicalize(doc)), `<r>${"<a></a>".repeat(WIDTH)}</r>`),
          -1,
        );

        const read = yield* readXml(bytes, unbounded);

        assert.strictEqual(read.root.children.length, WIDTH);
        assert.strictEqual(firstDifference(text(yield* encode(read, "UTF-8")), written), -1);
      }),
    SCALE_TIMEOUT_MS,
  );

  it.effect(
    `readXml resolves namespaces, applies the ATTLIST and restores undeclared references at every level of a document ${DEPTH} deep, and the round trip is a fixed point`,
    () =>
      Effect.gen(function* deepNamespaced() {
        const source = `<!DOCTYPE a SYSTEM "a.dtd" [<!ATTLIST p:a d CDATA "v">]><a xmlns="urn:x" xmlns:p="urn:p">${'<p:a xml:lang="en" r="&u;">'.repeat(DEPTH - 1)}&u;${"</p:a>".repeat(DEPTH - 1)}</a>`;
        const read = yield* readXml(new TextEncoder().encode(source), unbounded);
        const [top, ...inner] = firstChildPath(read.root);
        const wrong = inner.filter(
          (level) =>
            level.namespace !== "urn:p" ||
            level.local !== "a" ||
            level.attributes
              .map((attribute) => `${attribute.namespace} ${attribute.qname}=${attribute.value}`)
              .join(" ") !== "http://www.w3.org/XML/1998/namespace xml:lang=en  r=&u;  d=v" ||
            level.attributes[1]?.references.length !== 1,
        ).length;

        assert.strictEqual(top?.namespace, "urn:x");
        assert.strictEqual(inner.length, DEPTH - 1);
        assert.strictEqual(wrong, 0);
        assert.deepStrictEqual(inner.at(-1)?.children, [{ kind: "entityRef", name: "u" }]);

        const once = yield* encode(read, "UTF-8");
        const twice = yield* encode(yield* readXml(once, unbounded), "UTF-8");

        assert.strictEqual(firstDifference(text(twice), text(once)), -1);
      }),
    SCALE_TIMEOUT_MS,
  );

  it.effect(
    `encode finds an unwritable construct at the bottom of a chain ${DEPTH} deep and at the end of ${WIDTH} children`,
    () =>
      Effect.gen(function* deepFailure() {
        const unwritable: Child = { kind: "comment", text: "é" };
        const failure = { codePoint: 0xe9, threshold: 0x7f, where: "comment" };
        const deep = yield* Effect.flip(encode(bare(chain(DEPTH, [unwritable])), "US-ASCII"));
        const wide = yield* Effect.flip(
          encode(
            bare(
              element("r", [...Array.from({ length: WIDTH }, () => element("a", [])), unwritable]),
            ),
            "US-ASCII",
          ),
        );

        assert.deepStrictEqual(
          { codePoint: deep.codePoint, threshold: deep.threshold, where: deep.where },
          failure,
        );
        assert.deepStrictEqual(
          { codePoint: wide.codePoint, threshold: wide.threshold, where: wide.where },
          failure,
        );
      }),
    SCALE_TIMEOUT_MS,
  );
});
