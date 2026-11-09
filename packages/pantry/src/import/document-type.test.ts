/**
 * A document's type in its package, written with no handle standing for an absent resource type
 * (spec reading 167): every document's `Document.documentType`, which its nodes copy, is its role,
 * `manifest` or the type of the resource that lists it, and a document a resource lists has its
 * `ResourceDocument`, of that resource's type, which the manifest has none of.
 *
 * Oracle: the specification as a checker, IMS Content Packaging 1.2's two roles of document (the
 * Manifest object and the files a Resource describes, of the Resource's one Type), against the
 * rows the import writes for a listed document of each type.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, Formatter, Option } from "effect";
import {
  DocumentType,
  grammar,
  ResourceDocumentType,
  ResourceType,
} from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { documentRowsOf, rootInsertOf } from "#pantry/import/write.ts";
import type { XdmDocument } from "#pantry/model/xdm.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { caseHang, idOf } from "#pantry/test/gen/xdm.ts";

/**
 * The one document every case lists: an item's root and nothing in it, whose rows' type is all the
 * case reads.
 */
const document: XdmDocument<Composed> = {
  _tag: "document",
  charset: "utf-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "utf-8",
  prolog: [],
  root: {
    _tag: "element",
    attributes: [],
    children: [],
    governs: grammar.xsi.declaredType("3.0.1", "qti-assessment-item"),
    kind: "qti-assessment-item",
    namespaces: [],
    prefix: "",
  },
  version: "3.0.1",
};

describe("a document's type", () => {
  it("is the manifest's role or a resource type, and names no absent one", () => {
    assert.strictEqual(Arr.headNonEmpty(DocumentType.handles), "manifest");
    assert.notInclude(DocumentType.handles, "none");
    assert.deepStrictEqual(DocumentType.handles.slice(1), [...ResourceType.handles]);
    assert.deepStrictEqual(
      ResourceDocumentType.rows.map(({ documentType, type }) => [type, documentType]),
      DocumentType.handles.slice(1).map((type) => [type, type]),
    );
  });

  it.effect(
    "writes every document's type on its Document row and its nodes, and a resource's document its ResourceDocument, of that type, the manifest none",
    (ctx) =>
      // Oracle: IMS Content Packaging 1.2, the Manifest object beside the files a Resource
      // describes, each of its Resource's one Type (sections 6.3, 6.4.1, 6.6.2 and 6.11.13).
      // Bound: every DocumentType handle, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: `every document type, ${String(DocumentType.handles.length)}`,
            caseHang,
            coverage: requiredInSpace<"the manifest" | "a resource's document">([
              "the manifest",
              "a resource's document",
            ]),
            generator: int(0, DocumentType.handles.length - 1),
            limit: DocumentType.handles.length,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "IMS Content Packaging 1.2's roles of document",
            },
            suite: "import/document-type",
          },
          (index, c) =>
            Effect.sync(() => {
              const documentType = Arr.getUnsafe(DocumentType.handles, index);
              const manifest = documentType === "manifest";
              c.note(manifest ? "the manifest" : "a resource's document");

              const context = ownContext(idOf(0));
              const root = rootInsertOf(document, { context, documentType, idOf });
              const layer = documentRowsOf(
                { documentType, path: "doc.xml", tree: document },
                { assembled: false, context, idOf, package: idOf(0xff_ff_ff) },
              );

              assert.strictEqual(root.documentType, documentType);
              assert.deepStrictEqual(
                root.children.map((member) => member.documentType),
                [documentType],
              );
              assert.deepStrictEqual(
                [...layer.Document.values()].map((row) => row.documentType),
                [documentType],
              );
              assert.deepStrictEqual(
                [...layer.ResourceDocument.values()].map(({ documentType: held, node, type }) => [
                  node,
                  type,
                  held,
                ]),
                manifest ? [] : [[idOf(0), documentType, documentType]],
              );
            }),
        ),
      ),
  );
});
