/**
 * The mutations of the law oracle's laws over the attribute laws (§1.5), the overlays the oracle
 * stated before lane OL (§1.7) and the package laws (§1.6), each drawn to break exactly its law in
 * an accepted package (`src/test/complete.oracle.test.ts`).
 */
import { duplicateDrawn, editDrawnDocument } from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation documents that declare variables: the three items and the test.
 */
const documents = ["items/item.xml", "items/item2.xml", "items/item3.xml", "test.xml"] as const;

/**
 * A declaration of an outcome or template variable written whole on one line.
 */
const declarationLine = /<qti-(?:outcome|template)-declaration identifier="[^"]+"[^>]*\/>/u;

/**
 * Each law's mutation, by law.
 */
export const overlayMutations = {
  // Declaration key: a second declaration of a declared identifier, a copy of an outcome or
  // template declaration written beside it, in a drawn document. A response or context
  // declaration's identifier is an ID (reading 14), so its copy breaks DocumentId key first.
  "Declaration key": {
    mutate: ({ entries }) =>
      editDrawnDocument(entries, documents, declarationLine, (text) =>
        duplicateDrawn(text, declarationLine),
      ),
    over: "package",
  },
} as const satisfies Readonly<Record<string, Mutation>>;
