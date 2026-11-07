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
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";

const fixtures = inject("fixtures");

/**
 * Count the members a keyed set's rows nest, together.
 *
 * @param rows - The keyed set.
 * @param size - How many members one row nests.
 * @returns Their number.
 */
const sumOf = <A>(rows: ReadonlyMap<string, A>, size: (row: A) => number): number =>
  [...rows.values()].reduce((sum, row) => sum + size(row), 0);

layer(NodeServices.layer, { excludeTestServices: true })("previewPackage", (suite) => {
  suite.effect(
    "counts every row the accepted corpus packages and the every-relation package would write, and says the database judged none",
    () =>
      // Oracle: a second implementation of the count: each document's rows as `flatten` writes
      // them (its nodes, attributes, declarations, open names and entity references), the record's
      // entries, the members the nested inserts hold (an attribute's IDREF pieces and typed double,
      // a text's typed double, an identity text's IDREF pieces, a cell's header tokens, a table
      // cell's leaves, a tolerance's values, an assembled reference's segments), each assembly's
      // instances at every depth, and each flat input's keyed set, over the three accepted corpus
      // packages and the every-relation package, which writes a row of every stored relation and
      // nests instances under its assemblies.
      Effect.gen(function* counts() {
        const dirs = [
          fixtures.simple,
          yield* materialize("sharedMedia"),
          yield* materializeSpec({
            edits: [],
            member: "qtiv3-examples/packaging/svg/svg.zip",
            name: "svg",
          }),
          yield* scopedPackage(everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 })),
        ];
        for (const dir of dirs) {
          const program = yield* readProgram(dir);
          const flats = program.documents.map(({ ids, listed }) => flatten(listed.tree, ids.idOf));
          const { Instance: instances, Node: roots, Package: records, ...flat } = program.inputs;
          const members = { DoubleValue: 0, Idref: 0, TextDoubleValue: 0 };
          const stack: NodeMember[] = [...roots.values()];
          for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
            members.TextDoubleValue += node.doubleValue.length;
            for (const { doubleValue, idrefs } of node.attributes) {
              members.DoubleValue += doubleValue.length;
              members.Idref += idrefs.length;
            }

            stack.push(...node.children);
          }

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

          const byRelation = new Map<string, number>([
            ["Attribute", flats.reduce((sum, rows) => sum + rows.attributes.length, 0)],
            [
              "AttributeEntity",
              flats.reduce((sum, rows) => sum + rows.attributeEntities.length, 0),
            ],
            ["CellLeaf", sumOf(flat.MathCell, ({ leaves }) => leaves.length)],
            ["Entry", program.files.length],
            ["DoubleValue", members.DoubleValue],
            ["HeaderToken", sumOf(flat.CellHeaders, ({ tokens }) => tokens.length)],
            ["Idref", members.Idref],
            ["Instance", instanceRows],
            ["Namespace", flats.reduce((sum, rows) => sum + rows.namespaces.length, 0)],
            ["Node", flats.reduce((sum, rows) => sum + rows.nodes.length, 0)],
            ["OpenAttributeName", flats.reduce((sum, rows) => sum + rows.openNames.length, 0)],
            ["Package", records.size],
            ["ReferenceSegment", sumOf(flat.AssembledReference, ({ segments }) => segments.length)],
            ["TextDoubleValue", members.TextDoubleValue],
            ["TextIdref", sumOf(flat.IdentityText, ({ idrefs }) => idrefs.length)],
            ["ToleranceToken", sumOf(flat.Tolerance, ({ tokens }) => tokens.length)],
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
      }).pipe(Effect.scoped),
  );

  suite.effect("refuses a package the codec refuses as an ImportRefused naming its rule", () =>
    // Oracle: the specification as a checker, the codec's rule (`not-qti3`, spec reading 89): the
    // published PCI sample declares a schema version the roster does not hold, and no database is
    // needed to say so.
    Effect.gen(function* refused() {
      const error = yield* Effect.flip(previewPackage(fixtures.sample_pci));

      assert.instanceOf(error, ImportRefused);
      assert.strictEqual(error instanceof ImportRefused ? error.rule : undefined, "not-qti3");
    }),
  );
});
