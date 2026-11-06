import { assert, describe, it } from "@effect/vitest";
import type { Uuid } from "@bjornpagen/grizzle";

import { shareFinding } from "#pantry/import/guards/mathml-share.ts";
import { judgedLater } from "#pantry/import/judged.ts";
import { Rows } from "#pantry/import/tree.ts";
import { HtmlId } from "#pantry/schema/document.ts";
import { MathmlSrc } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

/**
 * A test id.
 *
 * @param hex - The last twelve hex digits.
 * @returns The id.
 */
const idOf = (hex: string): Uuid => `00000000-0000-4000-8000-${hex.padStart(12, "0")}`;

const tree = idOf("1");

/**
 * One element of a test tree: its row number, kind and parent, with the `id` and `src` it carries.
 */
interface Spec {
  readonly at: string;
  readonly id?: string;
  readonly kind: "m:apply" | "m:cn" | "m:math" | "m:plus" | "m:share";
  readonly parent?: string;
  readonly src?: string;
  readonly tree?: Uuid;
}

/**
 * The rows of a tree of MathML elements: its nodes, its edges in the order the specs list the
 * children, its `id` rows and its `m:share` `src` rows.
 *
 * @param specs - The elements, parents before their children.
 * @returns The rows.
 */
const rowsOf = (specs: readonly Spec[]): Rows => {
  const kinds = new Map(specs.map((spec) => [spec.at, spec.kind]));
  const base = Rows.add(
    Rows.empty(),
    Node,
    specs.map((spec) => ({
      ancestry: "root" as const,
      id: idOf(spec.at),
      kind: spec.kind,
      prefix: "m",
      rootKind: "item" as const,
      tree: spec.tree ?? tree,
      version: "3.0.1" as const,
    })),
  );
  const edged = Rows.add(
    base,
    Edge,
    specs.flatMap((spec, position) =>
      spec.parent === undefined
        ? []
        : [
            {
              child: idOf(spec.at),
              childAncestry: "root" as const,
              childKind: spec.kind,
              parent: idOf(spec.parent),
              parentAncestry: "root" as const,
              parentKind: kinds.get(spec.parent) ?? "m:math",
              position: BigInt(position),
              tree: spec.tree ?? tree,
              version: "3.0.1" as const,
            },
          ],
    ),
  );
  const named = Rows.add(
    edged,
    HtmlId,
    specs.flatMap((spec) =>
      spec.id === undefined
        ? []
        : [
            {
              attribute: "id" as const,
              document: spec.tree ?? tree,
              id: spec.id,
              kind: spec.kind,
              node: idOf(spec.at),
            },
          ],
    ),
  );

  return Rows.add(
    named,
    MathmlSrc,
    specs.flatMap((spec) =>
      spec.src === undefined
        ? []
        : [
            {
              attribute: "src" as const,
              kind: spec.kind,
              node: idOf(spec.at),
              value: judgedLater(spec.src),
            },
          ],
    ),
  );
};

const math: Spec = { at: "10", kind: "m:math" };

describe("shareFinding, C16", () => {
  it("refuses a share whose src names no id of the document (probe 27)", () => {
    const rows = rowsOf([
      math,
      { at: "11", kind: "m:apply", parent: "10" },
      { at: "12", kind: "m:share", parent: "11", src: "#nowhere" },
    ]);
    const error = shareFinding(rows);
    assert.strictEqual(error?._tag, "ImportRefused");
    assert.strictEqual(error?.rule, "document-key");
  });

  it("refuses a src that is not a same-document fragment", () => {
    for (const src of ["#", "b", "other.xml#b", "http://example.test/#b", ""]) {
      const rows = rowsOf([
        { at: "10", id: "b", kind: "m:math" },
        { at: "12", kind: "m:share", parent: "10", src },
      ]);
      assert.strictEqual(shareFinding(rows)?.rule, "document-key", src);
    }
  });

  it("refuses a fragment that names an id of another document", () => {
    const rows = rowsOf([
      math,
      { at: "12", kind: "m:share", parent: "10", src: "#b" },
      { at: "20", id: "b", kind: "m:math", tree: idOf("2") },
    ]);
    assert.strictEqual(shareFinding(rows)?.rule, "document-key");
  });

  it("passes a share whose src names an acyclic element", () => {
    const rows = rowsOf([
      math,
      { at: "11", id: "b", kind: "m:apply", parent: "10" },
      { at: "12", kind: "m:plus", parent: "11" },
      { at: "13", kind: "m:share", parent: "10", src: "#b" },
    ]);
    assert.strictEqual(shareFinding(rows), undefined);
  });

  it("passes two shares of one element, and a share with no src", () => {
    const rows = rowsOf([
      math,
      { at: "11", id: "b", kind: "m:cn", parent: "10" },
      { at: "12", kind: "m:share", parent: "10", src: "#b" },
      { at: "13", kind: "m:share", parent: "10", src: "#b" },
      { at: "14", kind: "m:share", parent: "10" },
    ]);
    assert.strictEqual(shareFinding(rows), undefined);
  });
});

describe("shareFinding, C17", () => {
  it("refuses an apply that contains a share of itself (probe 26)", () => {
    const rows = rowsOf([
      math,
      { at: "11", id: "a", kind: "m:apply", parent: "10" },
      { at: "12", kind: "m:plus", parent: "11" },
      { at: "13", kind: "m:share", parent: "11", src: "#a" },
      { at: "14", kind: "m:cn", parent: "11" },
    ]);
    const error = shareFinding(rows);
    assert.strictEqual(error?._tag, "ImportRefused");
    assert.strictEqual(error?.rule, "document-key");
  });

  it("refuses a share of itself", () => {
    const rows = rowsOf([math, { at: "11", id: "s", kind: "m:share", parent: "10", src: "#s" }]);
    assert.strictEqual(shareFinding(rows)?.rule, "document-key");
  });

  it("refuses two elements that share each other", () => {
    const rows = rowsOf([
      math,
      { at: "11", id: "a", kind: "m:apply", parent: "10" },
      { at: "12", kind: "m:share", parent: "11", src: "#b" },
      { at: "13", id: "b", kind: "m:apply", parent: "10" },
      { at: "14", kind: "m:share", parent: "13", src: "#a" },
    ]);
    assert.strictEqual(shareFinding(rows)?.rule, "document-key");
  });

  it("passes a share of an element beside it", () => {
    const rows = rowsOf([
      math,
      { at: "11", id: "a", kind: "m:apply", parent: "10" },
      { at: "12", kind: "m:share", parent: "10", src: "#a" },
    ]);
    assert.strictEqual(shareFinding(rows), undefined);
  });
});
