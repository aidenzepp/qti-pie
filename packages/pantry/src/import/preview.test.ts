/**
 * The dry run (`#pantry/import/preview.ts`): what an import would write, counted without the
 * database, and the refusals the reader and the codec give without it.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { inject } from "vitest";
import { previewPackage } from "#pantry/import/preview.ts";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { flatten } from "#pantry/model/xdm.ts";
import { materialize, materializeSpec } from "#pantry/test/fixtures.ts";

const fixtures = inject("fixtures");

layer(NodeServices.layer, { excludeTestServices: true })("previewPackage", (suite) => {
  suite.effect(
    "counts every row the accepted corpus packages would write, and says the database judged none",
    () =>
      // Oracle: a second implementation of the count: each document's rows as `flatten` writes
      // them (its nodes, attributes, declarations, open names and entity references), the record's
      // entries, the IDREF pieces of the nested inserts (an attribute's and an identity text's),
      // each assembly's instances, and each flat input's keyed set, over the three accepted corpus
      // packages.
      Effect.gen(function* counts() {
        const dirs = [
          fixtures.simple,
          yield* materialize("sharedMedia"),
          yield* materializeSpec({
            edits: [],
            member: "qtiv3-examples/packaging/svg/svg.zip",
            name: "svg",
          }),
        ];
        for (const dir of dirs) {
          const program = yield* readProgram(dir);
          const flats = program.documents.map(({ ids, listed }) => flatten(listed.tree, ids.idOf));
          const { Instance: instances, Node: roots, Package: records, ...flat } = program.inputs;
          const nested = [...roots.values()].flatMap((root) => {
            const stack: NodeMember[] = [root];
            const pieces: number[] = [];
            for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
              pieces.push(...node.attributes.map(({ idrefs }) => idrefs.length));
              stack.push(...node.children);
            }

            return pieces;
          });
          const instanceStack: InstanceMember[] = [...instances.values()];
          let instanceRows = 0;
          for (
            let instance = instanceStack.pop();
            instance !== undefined;
            instance = instanceStack.pop()
          ) {
            instanceRows += 1;
            instanceStack.push(...instance.children);
          }

          const textIdrefs = [...program.inputs.IdentityText.values()].reduce(
            (sum, { idrefs }) => sum + idrefs.length,
            0,
          );
          const byRelation = new Map<string, number>([
            ["Attribute", flats.reduce((sum, rows) => sum + rows.attributes.length, 0)],
            [
              "AttributeEntity",
              flats.reduce((sum, rows) => sum + rows.attributeEntities.length, 0),
            ],
            ["Entry", program.files.length],
            ["Idref", nested.reduce((sum, n) => sum + n, 0)],
            ["Instance", instanceRows],
            ["Namespace", flats.reduce((sum, rows) => sum + rows.namespaces.length, 0)],
            ["Node", flats.reduce((sum, rows) => sum + rows.nodes.length, 0)],
            ["OpenAttributeName", flats.reduce((sum, rows) => sum + rows.openNames.length, 0)],
            ["Package", records.size],
            ["TextIdref", textIdrefs],
            ...Object.entries(flat).map(([relation, rows]) => [relation, rows.size] as const),
          ]);
          const preview = yield* previewPackage(dir);

          assert.isFalse(preview.databaseChecked);
          assert.strictEqual(
            preview.rows,
            [...byRelation.values()].reduce((sum, n) => sum + n, 0),
            dir,
          );
          assert.strictEqual(
            preview.relations,
            [...byRelation.values()].filter((n) => n > 0).length,
            dir,
          );
        }
      }),
  );

  suite.effect("refuses a package the codec refuses as an ImportRefused naming its rule", () =>
    // Oracle: the specification as a checker, the codec's rule (`not-qti3`, spec reading 80): the
    // published PCI sample declares a schema version the roster does not hold, and no database is
    // needed to say so.
    Effect.gen(function* refused() {
      const error = yield* Effect.flip(previewPackage(fixtures.sample_pci));

      assert.instanceOf(error, ImportRefused);
      assert.strictEqual(error instanceof ImportRefused ? error.rule : undefined, "not-qti3");
    }),
  );
});
