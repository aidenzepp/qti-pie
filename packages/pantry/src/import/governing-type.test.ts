/**
 * The import's governing types, written with no handle standing for an absent one (FOCUS.md,
 * fallback class 1): an element's named governing type is a row of its own, an `ElementType` for an
 * element of a vocabulary kind and an `OpenElementType` for a foreign one, written exactly where
 * shred's tree gives the element a type, and every node's `governor`, the one its attributes and
 * text are read under, is the attribute grammar's: the `Governor` of its (version, kind, type), its
 * kind's own where none governs it.
 *
 * Oracle: a second implementation, the attribute grammar's `governorOf` over the composed grammar
 * (`#pantry/grammar/attributes.ts`), where the import reads the installed `GoverningOf`
 * (`#pantry/import/fold.ts` `governorOf`); and the tree's own governing types, which shred wrote.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option } from "effect";
import { governorOf } from "#pantry/grammar/attributes.ts";
import { grammar, openElementClasses, TypeName } from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { documentRowsOf, rootInsertOf } from "#pantry/import/write.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import { flatten } from "#pantry/model/xdm.ts";
import { caseHang, idOf, xdmDocument } from "#pantry/test/gen/xdm.ts";

/**
 * What a node is to its governing type: no element, a vocabulary element of a named type or of
 * none, a foreign element its `xsi:type` gives a type or none, and an element a type governs in
 * place of its kind.
 */
type GoverningSituation =
  | "a node that is no element"
  | "a vocabulary element of a named type"
  | "a vocabulary element of no named type"
  | "a foreign element of a type"
  | "a foreign element of no type"
  | "an element its type governs";

/**
 * The foreign element kinds, whose type is an `OpenElementType`.
 */
const foreignKinds: ReadonlySet<string> = new Set(openElementClasses);

/**
 * The element kinds, a vocabulary's and the foreign ones (`IsElement`).
 */
const elementKinds: ReadonlySet<string> = new Set(
  grammar.kinds.isElement.rows.map(({ kind }) => kind),
);

/**
 * Read each node's governor from a document's nested insert.
 *
 * @param root - The document node's insert, its tree nested.
 * @returns Each node's governor, by its id.
 */
const governorsOf = (root: NodeMember): ReadonlyMap<string, string> => {
  const governors = new Map<string, string>();
  const stack: NodeMember[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    governors.set(next.id, next.governor);
    stack.push(...next.children);
  }

  return governors;
};

describe("the import's governing types", () => {
  it("name no type `none`: the TypeName roster holds the pinned named types alone", () => {
    assert.notInclude(TypeName.handles, "none");
  });

  it.effect(
    "write each element's named type as a row of its own, exactly where shred gives it one, and each node's governor as the attribute grammar reads it",
    (ctx) =>
      // Oracle: a second implementation, the attribute grammar's `governorOf` (its kind's own where
      // it gives none), against the import's read of the installed `GoverningOf`; and the tree's
      // governing types, which shred wrote, against the type rows the document layer writes.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree, 200 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<GoverningSituation>(
              [
                "a node that is no element",
                "a vocabulary element of a named type",
                "a foreign element of a type",
                "a foreign element of no type",
                "an element its type governs",
              ],
              { cases: 200, sense: notesOnly },
            ),
            draw: drawn(xdmDocument(grammar)),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the attribute grammar's governorOf, and the tree's governing types",
            },
            runs: 200,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/governing-type",
          },
          (generated, c) =>
            Effect.sync(() => {
              const { document } = generated;

              const context = ownContext(idOf(0));
              const governors = governorsOf(
                rootInsertOf(document, { context, documentType: "imsqti_item_xmlv3p0", idOf }),
              );
              const layer = documentRowsOf(
                { documentType: "imsqti_item_xmlv3p0", path: "item.xml", tree: document },
                { assembled: false, context, idOf, package: idOf(0xff_ff_ff) },
              );
              const { nodes } = flatten(document, idOf);
              for (const node of nodes) {
                const foreign = foreignKinds.has(node.kind);
                const element = Option.fromNullishOr(layer.ElementType.get(node.id));
                const open = Option.fromNullishOr(layer.OpenElementType.get(node.id));
                const governor = Option.match(governorOf(grammar.attributes, node), {
                  onNone: () => node.kind,
                  onSome: (held) => held,
                });
                const label = `${node.kind} ${Formatter.format(node.governs)}`;

                assert.deepStrictEqual(
                  element.pipe(Option.map(({ type }) => type)),
                  foreign ? Option.none() : node.governs,
                  label,
                );
                assert.deepStrictEqual(
                  open.pipe(Option.map(({ type }) => type)),
                  foreign ? node.governs : Option.none(),
                  label,
                );
                assert.strictEqual(governors.get(node.id), governor, label);
                for (const row of [...Option.toArray(element), ...Option.toArray(open)]) {
                  assert.strictEqual(row.governor, governor, label);
                  assert.include(TypeName.handles, row.type, label);
                }

                if (foreign) {
                  c.note(
                    Option.isSome(node.governs)
                      ? "a foreign element of a type"
                      : "a foreign element of no type",
                  );
                } else if (elementKinds.has(node.kind)) {
                  c.note(
                    Option.isSome(node.governs)
                      ? "a vocabulary element of a named type"
                      : "a vocabulary element of no named type",
                  );
                } else {
                  c.note("a node that is no element");
                }

                if (governor !== node.kind) {
                  c.note("an element its type governs");
                }
              }

              assert.strictEqual(
                layer.ElementType.size + layer.OpenElementType.size,
                nodes.filter(({ governs }) => Option.isSome(governs)).length,
              );
            }),
        ),
      ),
  );
});
