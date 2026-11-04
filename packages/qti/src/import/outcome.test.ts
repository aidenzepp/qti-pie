/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the declaration and value-set column the rows under test carry; the shape here is the typed-or-record choice, not a structure. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { outcomeRows } from "#qti/import/outcome.ts";
import { Rows, UnmodeledVocabulary } from "#qti/import/tree.ts";
import {
  Declaration,
  OutcomeDeclarationArm,
  ResponseDeclarationArm,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { ManifestIdentifier, PackagePath } from "#qti/schema/contracts.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import { OutcomeDocument } from "#qti/schema/outcome.ts";
import { Edge, Node, TreeRoot } from "#qti/schema/node.ts";
import * as value from "#qti/schema/value.ts";
import { materialize } from "#qti/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * The one row of a list that must hold exactly one.
 */
const only = <T>(list: readonly T[]): T => {
  assert.strictEqual(list.length, 1);

  return Option.getOrThrow(Option.fromNullishOr(list[0]));
};

const packageId = "33333333-3333-4333-8333-333333333333";

/**
 * Read `testoutcome01.xml` of the `outcome` fixture after `edit` turns its text into the text under
 * test.
 */
const readOutcome = (edit: (text: string) => string = (text) => text) =>
  Effect.gen(function* readOutcomeFile() {
    const fs = yield* FileSystem.FileSystem;
    const directory = yield* materialize("outcome");
    const bytes = yield* fs.readFile(path.join(directory, "testoutcome01.xml"));
    const text = new TextDecoder().decode(bytes);

    return yield* readXml(new TextEncoder().encode(edit(text)));
  });

/**
 * The outcome rows of a decoded document, for the resource `Outcome_01` the `outcome` fixture
 * lists.
 */
const outcomeOf = (doc: Effect.Success<ReturnType<typeof readOutcome>>) =>
  outcomeRows(
    {
      doc,
      packageId,
      path: "testoutcome01.xml",
      resource: "Outcome_01",
      resourceLomHasGeneral: false,
      resourceType: "imsqti_outcomes_xmlv3p0",
      version: "3.0.0",
    },
    Rows.empty(),
  );

layer(NodeServices.layer, { excludeTestServices: true })("import/outcome.ts", (suite) => {
  suite.effect(
    "testoutcome01.xml yields the document, its declaration and the identifier twice",
    () =>
      Effect.gen(function* outcomeDocument() {
        const { documentId, rows } = yield* outcomeOf(yield* readOutcome());

        assert.deepStrictEqual(Rows.of(rows, Document), [
          {
            id: documentId,
            package: packageId,
            path: PackagePath("testoutcome01.xml"),
            resource: ManifestIdentifier("Outcome_01"),
            resourceType: "imsqti_outcomes_xmlv3p0",
            root: "outcomes",
            version: "3.0.0",
          },
        ]);
        assert.deepStrictEqual(Rows.of(rows, TreeRoot), [{ node: documentId, tree: documentId }]);

        // testoutcome01.xml line 5: identifier="SCORE" cardinality="single" base-type="float".
        assert.deepStrictEqual(Rows.of(rows, Declaration), [
          {
            document: documentId,
            id: documentId,
            identifier: "SCORE",
            kind: "outcome",
            shape: "typed",
          },
        ]);
        assert.deepStrictEqual(Rows.of(rows, OutcomeDeclarationArm), [{ id: documentId }]);
        assert.deepStrictEqual(Rows.of(rows, ResponseDeclarationArm), []);
        assert.deepStrictEqual(Rows.of(rows, TypedDeclaration), [
          {
            baseType: "float",
            cardinality: "single",
            document: documentId,
            id: documentId,
            identifier: "SCORE",
            kind: "outcome",
          },
        ]);

        const identifiers = Rows.of(rows, DocumentIdentifier);
        assert.deepStrictEqual(identifiers, [
          {
            document: documentId,
            package: packageId,
            resource: ManifestIdentifier("Outcome_01"),
            root: "outcomes",
            value: "SCORE",
          },
        ]);
        assert.deepStrictEqual(Rows.of(rows, DocumentTitle), []);

        const documents = Rows.of(rows, OutcomeDocument);
        assert.strictEqual(documents.length, 1);
        assert.deepStrictEqual(only(documents), {
          declaration: documentId,
          document: documentId,
          identifier: only(identifiers).value,
        });
      }),
  );

  suite.effect("the default value is a float arm row holding the literal 0.0", () =>
    Effect.gen(function* outcomeDefault() {
      const { documentId, rows } = yield* outcomeOf(yield* readOutcome());

      // testoutcome01.xml lines 6 to 8: <qti-default-value><qti-value>0.0</qti-value>.
      const set = only(Rows.of(rows, value.ValueSet));
      assert.deepStrictEqual(set, {
        declaration: documentId,
        id: set.id,
        role: "default",
        shape: "typed",
      });

      const declared = only(Rows.of(rows, value.DeclaredValue));
      const edge = only(Rows.of(rows, Edge).filter((candidate) => candidate.child === declared.id));
      assert.strictEqual(edge.parent, set.id);
      assert.deepStrictEqual(declared, {
        baseType: "float",
        id: declared.id,
        position: edge.position,
        shape: "typed",
        valueSet: set.id,
      });
      assert.deepStrictEqual<unknown>(Rows.of(rows, value.relations.DeclaredValueFloat), [
        { id: declared.id, value: "0.0" },
      ]);
    }),
  );

  suite.effect("a copy whose root is qti-response-declaration is unmodeled vocabulary", () =>
    Effect.gen(function* responseRoot() {
      const doc = yield* readOutcome((text) =>
        text.replaceAll("qti-outcome-declaration", "qti-response-declaration"),
      );
      const refusal = yield* Effect.flip(outcomeOf(doc));
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.name, "qti-response-declaration");
    }),
  );

  suite.effect("an outcome declaration carrying a qti-match-table writes it", () =>
    Effect.gen(function* matchTable() {
      const doc = yield* readOutcome((text) =>
        text.replace(
          "</qti-outcome-declaration>",
          `<qti-match-table default-value="9"><qti-match-table-entry source-value="1" target-value="1.5"/></qti-match-table></qti-outcome-declaration>`,
        ),
      );
      const { documentId, rows } = yield* outcomeOf(doc);

      const nodes = Rows.of(rows, Node);
      const table = only(nodes.filter((node) => node.kind === "qti-match-table"));
      only(nodes.filter((node) => node.kind === "qti-match-table-entry"));

      const edge = only(Rows.of(rows, Edge).filter((candidate) => candidate.child === table.id));
      assert.strictEqual(edge.parent, documentId);
    }),
  );
});
