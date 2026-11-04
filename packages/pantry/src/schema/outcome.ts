/**
 * The outcome document: a QTI document whose root is a `qti-outcome-declaration`, with the
 * declaration it is and the identifier its root carries.
 *
 * This module is a leaf that imports `declaration.ts` and `document.ts`, which `document.ts`
 * itself cannot, because `declaration.ts` imports it.
 */
import { contained, mirrors, on, relation, select, str, uuid } from "@bjornpagen/grizzle";
import { Declaration, OutcomeDeclarationArm } from "#qti/schema/declaration.ts";
import { Document, DocumentIdentifier } from "#qti/schema/document.ts";
import { TreeRoot } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

/**
 * An outcome document: its id is its tree's, `declaration` the root declaration and `identifier`
 * the identifier both carry.
 */
export const OutcomeDocument = relation(
  "OutcomeDocument",
  { declaration: uuid, document: uuid, identifier: ncName },
  ["document"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = { OutcomeDocument };

/**
 * The statements over `OutcomeDocument`: the declaration is the root of the document's tree, is a
 * declaration of the document with the same identifier, and is an outcome declaration; the
 * identifier is the document's; and every document whose root is `outcomes` has one.
 */
export const rules = [
  contained(on(OutcomeDocument, "document", "declaration"), on(TreeRoot, "tree", "node")),
  contained(
    on(OutcomeDocument, "declaration", "document", "identifier"),
    on(Declaration, "id", "document", "identifier"),
  ),
  contained(on(OutcomeDocument, "declaration"), on(OutcomeDeclarationArm, "id")),
  contained(
    on(OutcomeDocument, "document", "identifier"),
    on(DocumentIdentifier, "document", "value"),
  ),
  mirrors(on(select(Document, { root: "outcomes" }), "id"), on(OutcomeDocument, "document")),
] as const;

/**
 * The element arms of this module, none: an outcome document is keyed by its document.
 */
export const arms = {};
