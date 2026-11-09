/**
 * The copy-backs restated over a wider keyed selection (LP-3, the one-way rule), checked against
 * the containments into the narrower selections they replace, over every attribute row of the kind
 * each copies.
 *
 * Each of these overlays' way back to its attribute was a containment into a selection of
 * `Attribute` with a key of its own over `node`, which a wider key already implied: an element
 * holds at most one ID-typed attribute (`idAttributes` of `#pantry/qti/identity.ts`, whose key
 * holds `namingIdAttributes` too). Each is now stated into a target whose conditions are the wider
 * selection's and whose key is the wider selection's, the target fixing what the narrower selection
 * read beyond it to a value outside its terms (grizzle's fixed target, `#fixedTarget` of
 * `laws/model/plan.ts:1394-1444` at `3cc8fbd`):
 *
 * - **ManifestId:** `ManifestId(node) ⊆ manifestIdentifiers(node)`, the `cp:manifest` `identifier`s
 *   of the manifest (type `none`), is now `ManifestId(node) ⊆ manifestIdAttributes("cp:manifest")
 *   (node)`, the ID-typed attributes whose kind is `cp:manifest` and whose document is the
 *   manifest, held by `idAttributes`' key;
 * - **ResourceId:** the same over `cp:resource`;
 * - **TableHeader:** `TableHeader(node) ⊆ headerIds(node)`, each `th`'s `id` that is an ID value, is
 *   now `TableHeader(node) ⊆ namingIdAttributesOf("th")(node)`, held by `idAttributes`' key.
 *
 * A containment from a row at a node holds where some attribute at that node is in its target, so
 * the two laws are one exactly where the narrower selection holds an attribute row if and only if
 * the restated target does. No fixed field names the attribute: the kind's one ID-typed attribute
 * is the copied one, which this search proves. A row of another kind fails both laws, the old by
 * its kind and the new by the kind its target fixes, so the box is the kind's rows: each (version,
 * governs) `GoverningOf` gives the kind, each name the governor's attribute model admits, every
 * document type, and a value of each verdict of the ID-value pattern, the one thing either
 * selection reads of the lexical form. The restated laws are read from the schema's own statements
 * (`#pantry/test/judged-laws.ts` `containmentsOf`), each target's selection, its fixed fields
 * included, evaluated as the statement holds it; the replaced ones are restated over plain rows.
 */
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Option } from "effect";
import {
  AttributeModelOf,
  AttributeSlotOf,
  DocumentType,
  GoverningOf,
} from "#pantry/grammar/install.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { containmentsOf } from "#pantry/test/judged-laws.ts";
import type { Containment } from "#pantry/test/host-judge.ts";

/**
 * One attribute row of the box, as both laws read it: its element's version, kind, governing type
 * and governor and its document's type, its name, and its lexical form with whether that form is an
 * ID value.
 */
type AttributeCase = Readonly<{
  documentType: (typeof DocumentType.handles)[number];
  governor: string;
  governs: string;
  idValue: boolean;
  kind: string;
  lexical: string;
  name: string;
  version: string;
}>;

/**
 * A situation the box must reach: the copied attribute, another attribute of the kind, the copied
 * attribute outside the manifest, and the copied attribute whose value is no ID value.
 */
type Situation =
  | "another attribute of the kind"
  | "the copied attribute"
  | "the copied attribute outside the manifest"
  | "the copied attribute with no ID value";

/**
 * One restated copy-back: the relation it copies back from, the kind and name of the attribute it
 * copies, the selection it replaced restated over a plain row, and the situations its box reaches.
 */
interface CopyBack {
  readonly from: "ManifestId" | "ResourceId" | "TableHeader";
  readonly kind: "cp:manifest" | "cp:resource" | "th";
  readonly name: "id" | "identifier";
  readonly replaced: (row: AttributeCase) => boolean;
  readonly situations: Arr.NonEmptyReadonlyArray<Situation>;
}

/**
 * The manifest's selections, `attributesOf` of `#pantry/qti/package.ts`: one name on one kind, in
 * the manifest, the one document of type `manifest`.
 *
 * @param kind - The element's kind.
 * @returns The copy-back.
 */
const manifestCopyBack = (kind: "cp:manifest" | "cp:resource"): CopyBack => ({
  from: kind === "cp:manifest" ? "ManifestId" : "ResourceId",
  kind,
  name: "identifier",
  replaced: (row) =>
    row.kind === kind && row.name === "identifier" && row.documentType === "manifest",
  situations: [
    "the copied attribute",
    "another attribute of the kind",
    "the copied attribute outside the manifest",
  ],
});

/**
 * The three copy-backs: `headerIds` of `#pantry/qti/html.ts` is a `th`'s `id` whose value is an ID
 * value, in any document.
 */
const copyBacks: readonly CopyBack[] = [
  manifestCopyBack("cp:manifest"),
  manifestCopyBack("cp:resource"),
  {
    from: "TableHeader",
    kind: "th",
    name: "id",
    replaced: (row) => row.kind === "th" && row.name === "id" && row.idValue,
    situations: [
      "the copied attribute",
      "another attribute of the kind",
      "the copied attribute with no ID value",
    ],
  },
];

/**
 * A lexical form of each verdict of the ID-value pattern (`namingPattern` of
 * `#pantry/qti/identity.ts`): an NCName with whitespace around it, which is one once collapsed, and
 * a form with whitespace inside, which is none.
 */
const lexicals = [
  { idValue: true, lexical: " h1 " },
  { idValue: false, lexical: "h 1" },
] as const;

/**
 * Every attribute row of one kind the grammar admits, under every document type and with a value
 * of each verdict: each `GoverningOf` row of the kind, each name its governor's attribute model
 * admits (`AttributeModelOf`, `AttributeSlotOf`).
 *
 * @param kind - The element's kind.
 * @returns The rows.
 */
const rowsOf = (kind: string): readonly AttributeCase[] =>
  GoverningOf.rows
    .filter((governing) => governing.kind === kind)
    .flatMap(({ governor, governs, version }) =>
      AttributeModelOf.rows
        .filter((model) => model.version === version && model.governor === governor)
        .flatMap(({ model }) => AttributeSlotOf.rows.filter((slot) => slot.model === model))
        .flatMap(({ name }) =>
          DocumentType.handles.flatMap((documentType) =>
            lexicals.map(({ idValue, lexical }) => ({
              documentType,
              governor,
              governs,
              idValue,
              kind,
              lexical,
              name,
              version,
            })),
          ),
        ),
    );

/**
 * Read the restated copy-back from the schema: its one containment from the relation into
 * `Attribute`, whose source pairs `node` with `node` alone, so the law holds at a node exactly
 * where some attribute row there is in its target's selection, the fields it fixes included.
 *
 * @param from - The relation it copies back from.
 * @returns The containment.
 */
const restatedOf = (from: CopyBack["from"]): Containment => {
  const laws = containmentsOf(Qti, from).filter(({ to }) => to === "Attribute");
  assert.lengthOf(laws, 1, `${from}: its containments into Attribute`);

  const law = Option.getOrThrow(Arr.head(laws));
  assert.deepStrictEqual(
    Arr.zip(law.fromFields, law.toFields),
    [["node", "node"]],
    `${from}: the fields its source pairs`,
  );

  return law;
};

/**
 * Read the fields a containment's target fixes to a value, from its law as grizzle names it: each
 * conjunct of the target's selection that equates a field with a literal, in grizzle's canonical
 * form, the field first and the literal second (README, "Errors and outcomes").
 *
 * @param law - The containment's law.
 * @returns Each fixed field's value, by the field.
 */
const fixedOf = (law: Law): ReadonlyMap<string, unknown> =>
  new Map(
    law.kind === "contained"
      ? law.to.selection.conjuncts.flatMap((conjunct) =>
          conjunct.kind === "compare" &&
          conjunct.op === "eq" &&
          conjunct.left.kind === "field" &&
          conjunct.right.kind === "literal"
            ? [[conjunct.left.field, conjunct.right.value] as const]
            : [],
        )
      : [],
  );

/**
 * Name the situations one row reaches under a copy-back.
 *
 * @param copyBack - The copy-back.
 * @param row - The row.
 * @returns Its situations.
 */
const situationsOf = (copyBack: CopyBack, row: AttributeCase): readonly Situation[] => {
  const copied = row.name === copyBack.name;
  const reached: readonly (readonly [Situation, boolean])[] = [
    ["the copied attribute", copyBack.replaced(row)],
    ["another attribute of the kind", !copied],
    ["the copied attribute outside the manifest", copied && row.documentType !== "manifest"],
    ["the copied attribute with no ID value", copied && !row.idValue],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

describe("qti/identity.ts, the copy-backs restated over the ID-typed attributes", () => {
  for (const copyBack of copyBacks) {
    it.effect(
      `holds ${copyBack.from} back to its ${copyBack.kind}'s ${copyBack.name} exactly as the containment into the narrower selection did`,
      (ctx) => {
        const law = restatedOf(copyBack.from);
        assert.strictEqual(
          fixedOf(law.law).get("kind"),
          copyBack.kind,
          `${copyBack.from}: the kind its target fixes`,
        );

        // Oracle: a specification, the containment into the narrower selection the restated law
        // replaced, restated over plain rows.
        // Bound: every attribute row of the copied kind the grammar admits, under every document
        // type, with a lexical form of each verdict of the ID-value pattern.
        return Arr.match(rowsOf(copyBack.kind), {
          onEmpty: () =>
            Effect.die(
              new Error(
                `The grammar admits no attribute of ${copyBack.kind}, so the search has no row to judge ${copyBack.from}'s copy-back by. Check the GoverningOf, AttributeModelOf and AttributeSlotOf rows of the kind.`,
              ),
            ),
          onNonEmpty: (rows) =>
            searched(
              ctx,
              exhaust(
                {
                  box: `every attribute row of ${copyBack.kind} the grammar admits, under every document type, with a lexical form of each ID-value verdict`,
                  caseHang: Duration.seconds(5),
                  coverage: requiredInSpace<Situation>(copyBack.situations),
                  generator: element<AttributeCase>(rows),
                  limit: rows.length,
                  literal: (row) => JSON.stringify(row),
                  oracle: {
                    kind: "specification",
                    name: `the containment of ${copyBack.from} in its ${copyBack.kind}'s ${copyBack.name}`,
                  },
                  suite: `pantry/qti/identity-copy-back-${copyBack.from}`,
                },
                (row, c) =>
                  Effect.sync(() => {
                    c.noteAll(situationsOf(copyBack, row));

                    assert.strictEqual(
                      law.targeted(row),
                      copyBack.replaced(row),
                      JSON.stringify(row),
                    );
                  }),
              ),
            ),
        });
      },
      120_000,
    );
  }
});
