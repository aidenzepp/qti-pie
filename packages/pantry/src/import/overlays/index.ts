/**
 * Every overlay builder's rows of one package, merged into one keyed set per relation (plan W5,
 * Q5.15; §C's `overlayRowsOf`).
 *
 * Each builder (`#pantry/import/overlays/<family>.ts`) reads one document's tree under the ids its
 * rows are written under and returns each of its relations' rows as a `ReadonlyMap` from the text
 * of a row's key to the row. The merge keeps them a set (rule 0): a key met twice with one value is
 * one row, and a key met twice with two values is a defect of the builders, reported as an
 * {@link OverlayConflict} and never overwritten.
 *
 * Five builders also read the whole package: the tests' assemblies (Q5.13), what each test reads
 * of the documents it places and what each item ref names (Q5.10's, PE's), the sections'
 * placements under each test (Q5.09), the LOM records' objects (Q5.12) and the LOM languages'
 * witnesses (Q5.07). A builder joins {@link overlayRowsOf} when its module joins the schema
 * (`#pantry/qti/schema.ts`): a ChangeSet over the author role writes only the relations the schema
 * holds.
 */
/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { Equal, Formatter, Result, Schema } from "effect";
import { placedCatalogRowsOf, rowsOf as catalogRowsOf } from "#pantry/import/overlays/catalog.ts";
import type { CatalogRows, PlacedCatalogRows } from "#pantry/import/overlays/catalog.ts";
import {
  rowsOf as declarationRowsOf,
  untypedNamesOf,
} from "#pantry/import/overlays/declarations.ts";
import type { DeclarationRows } from "#pantry/import/overlays/declarations.ts";
import {
  assembledExpressionRowsOf,
  rowsOf as expressionRowsOf,
  placedVariableRowsOf,
} from "#pantry/import/overlays/expressions.ts";
import type {
  AssembledExpressionRows,
  ExpressionRows,
  PlacedVariableRows,
} from "#pantry/import/overlays/expressions.ts";
import { rowsOf as htmlRowsOf } from "#pantry/import/overlays/html.ts";
import type { HtmlRows } from "#pantry/import/overlays/html.ts";
import {
  languageRowsOf,
  placedIdRowsOf,
  placedLanguageRowsOf,
  rowsOf as identityRowsOf,
} from "#pantry/import/overlays/identity.ts";
import type {
  IdentityRows,
  LanguageRows,
  PlacedIdRows,
  PlacedLanguageRows,
} from "#pantry/import/overlays/identity.ts";
import {
  rowsOf as interactionRowsOf,
  packageChoicesOf,
  placedBindingRowsOf,
  sectionRowsOf,
  withPackageChoices,
} from "#pantry/import/overlays/interactions.ts";
import type {
  InteractionRows,
  PlacedBindingRows,
  SectionRows,
} from "#pantry/import/overlays/interactions.ts";
import { rowsOf as mappingRowsOf } from "#pantry/import/overlays/mapping.ts";
import type { MappingRows } from "#pantry/import/overlays/mapping.ts";
import { rowsOf as metadataRowsOf, objectRowsOfPackage } from "#pantry/import/overlays/metadata.ts";
import type { MetadataRows, NamedDocument, ObjectRows } from "#pantry/import/overlays/metadata.ts";
import { mathmlRowsOf } from "#pantry/import/overlays/mathml.ts";
import type { MathmlRows } from "#pantry/import/overlays/mathml.ts";
import { placedShareRowsOf } from "#pantry/import/overlays/mathml-share.ts";
import type { PlacedShareRows } from "#pantry/import/overlays/mathml-share.ts";
import { rowsOf as operatorRowsOf } from "#pantry/import/overlays/operators.ts";
import type { OperatorRows } from "#pantry/import/overlays/operators.ts";
import {
  noPackageRows,
  rowsOf as packageRowsOf,
  referenceCensus,
  referenceRowsOf,
} from "#pantry/import/overlays/package.ts";
import type { PackageRows, ReferenceRows } from "#pantry/import/overlays/package.ts";
import { rowsOf as quotationRowsOf } from "#pantry/import/overlays/quotation.ts";
import type { QuotationRows } from "#pantry/import/overlays/quotation.ts";
import { assembledRowsOf, rowsOf as testRowsOf } from "#pantry/import/overlays/tests.ts";
import type { AssembledRows, TestRows } from "#pantry/import/overlays/tests.ts";
import type { ListedDocument, NodeIds } from "#pantry/import/write.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { overlayNames } from "#pantry/import/roster.ts";
import { manifestPath } from "#pantry/qti/package.ts";

/**
 * Every overlay's rows of a package, one keyed set per relation: each document builder's, and the
 * four a package's documents build together.
 */
export type OverlayRows = AssembledExpressionRows &
  AssembledRows &
  CatalogRows &
  DeclarationRows &
  ExpressionRows &
  HtmlRows &
  IdentityRows &
  InteractionRows &
  LanguageRows &
  MappingRows &
  MathmlRows &
  MetadataRows &
  ObjectRows &
  OperatorRows &
  PackageRows &
  PlacedBindingRows &
  PlacedCatalogRows &
  PlacedIdRows &
  PlacedLanguageRows &
  PlacedShareRows &
  PlacedVariableRows &
  QuotationRows &
  ReferenceRows &
  SectionRows &
  TestRows;

/**
 * One document's rows from every document builder.
 */
interface DocumentRows {
  readonly catalog: CatalogRows;
  readonly declarations: DeclarationRows;
  readonly expressions: ExpressionRows;
  readonly html: HtmlRows;
  readonly identity: IdentityRows;
  readonly interactions: InteractionRows;
  readonly mapping: MappingRows;
  readonly mathml: MathmlRows;
  readonly metadata: MetadataRows;
  readonly operators: OperatorRows;
  readonly package: PackageRows;
  readonly quotation: QuotationRows;
  readonly references: ReferenceRows;
  readonly tests: TestRows;
}

/**
 * Run every document builder over one document: each finds the elements its overlays describe by
 * their kind, so a document that holds none gives it no row. The manifest overlays are the
 * package manifest's alone (`noPackageRows`): `rowsOf` of `#pantry/import/overlays/package.ts`
 * reads the manifest's tree, and a `cp:*` element of another document is no part of the package,
 * so the metadata overlays read the package's records from the manifest and its record files alone
 * (`rowsOf` of `#pantry/import/overlays/metadata.ts`, by the document's type).
 *
 * @param document - The document, listed, under its ids.
 * @param document.ids - Its ids.
 * @param document.listed - The document as listed.
 * @returns Every builder's rows.
 */
const documentRowsOf = ({
  ids,
  listed: { path, tree },
}: {
  readonly ids: NodeIds;
  readonly listed: ListedDocument;
}): DocumentRows => ({
  catalog: catalogRowsOf(tree, ids),
  declarations: declarationRowsOf(tree, ids),
  expressions: expressionRowsOf(tree, ids),
  html: htmlRowsOf(tree, ids),
  identity: identityRowsOf(tree, ids),
  interactions: interactionRowsOf(tree, ids),
  mapping: mappingRowsOf(tree, ids),
  mathml: mathmlRowsOf(tree, ids),
  metadata: metadataRowsOf(tree, ids),
  operators: operatorRowsOf(tree, ids),
  package: path === manifestPath ? packageRowsOf(tree, ids) : noPackageRows,
  quotation: quotationRowsOf(tree, ids),
  references: referenceRowsOf(tree, ids, referenceCensus),
  tests: testRowsOf(tree, ids),
});

/**
 * Two rows of one relation at one key that differ: a defect of the builders, which give one fact
 * per key, never something to overwrite.
 */
export class OverlayConflict extends Schema.TaggedError<OverlayConflict>()("OverlayConflict", {
  first: Schema.String,
  key: Schema.String,
  relation: Schema.String,
  second: Schema.String,
}) {
  /**
   * The relation, the key, both rows, and the repair.
   */
  override get message(): string {
    return `Two builders give ${this.relation} two different rows at the key ${this.key}: ${this.first} and ${this.second}. A key names one fact, so correct the builder that wrote the wrong row; the importer keeps neither.`;
  }
}

/**
 * Union one relation's keyed sets: a key met in several sets with equal rows (Effect's structural
 * equality) is one row, the first set's.
 *
 * @param relation - The relation's name, for the conflict.
 * @param sets - Its keyed sets, those a part gives it, in the parts' order.
 * @returns The union; or the {@link OverlayConflict} of the first key, in the sets' order, met
 *   with two different rows.
 */
export const unionOf = <Row>(
  relation: string,
  sets: readonly (ReadonlyMap<string, Row> | undefined)[],
): Result.Result<ReadonlyMap<string, Row>, OverlayConflict> => {
  const union = new Map<string, Row>();
  for (const set of sets) {
    for (const [key, row] of set ?? []) {
      const held = union.get(key);
      if (held === undefined) {
        union.set(key, row);
      } else if (!Equal.equals(held, row)) {
        return Result.fail(
          new OverlayConflict({
            first: Formatter.format(held),
            key,
            relation,
            second: Formatter.format(row),
          }),
        );
      }
    }
  }

  return Result.succeed(union);
};

/**
 * Union every part's keyed sets, relation by relation: {@link unionOf} of each relation `names`
 * lists, in their order, so a relation no part holds is its empty set. The relations are a set of
 * keys of one record type, `OverlayRows` or the document layer's, each of which
 * `#pantry/import/roster.ts` reads from the schema, so a relation the schema gains is unioned with
 * no edit here.
 *
 * @param names - The record's relation names, each once.
 * @param parts - The builders' rows, each holding some of the relations.
 * @returns Every relation's union; or the {@link OverlayConflict} of the first relation, in
 *   `names`' order, met with two different rows at one key.
 */
export const unionsOf = <R extends { readonly [K in keyof R]: ReadonlyMap<string, unknown> }>(
  names: readonly (keyof R & string)[],
  parts: readonly Partial<R>[],
): Result.Result<R, OverlayConflict> =>
  Result.map(
    Result.all(
      Object.fromEntries(
        names.map(
          (name) =>
            [
              name,
              unionOf(
                name,
                parts.map((part) => part[name]),
              ),
            ] as const,
        ),
      ),
    ),
    // SAFETY: the record holds one union at each of `names`, the keys of `R`, each a keyed set of
    // the rows the parts give that relation, which are `R`'s rows there.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    (unions) => unions as R,
  );

/**
 * Build every overlay builder's rows of one package, unmerged: each document builder's over each
 * document, then those of the builders that read the whole package, each a part holding every
 * relation its builder writes.
 *
 * @param documents - The package's documents, each listed and under its ids.
 * @param mint - Draws a fresh uuid for each assembled instance but a root.
 * @returns The parts, in the order {@link overlayRowsOf} merges them.
 */
export const overlayPartsOf = (
  documents: readonly { readonly ids: NodeIds; readonly listed: ListedDocument }[],
  mint: () => NodeId,
): readonly Partial<OverlayRows>[] => {
  const documented = documents.map((document) => ({ document, rows: documentRowsOf(document) }));
  const choices = packageChoicesOf(documented.map(({ rows }) => rows.interactions));
  const built = documented.map(({ document, rows }) => ({
    document,
    rows: { ...rows, interactions: withPackageChoices(rows.interactions, choices) },
  }));
  const assembled = assembledRowsOf(
    built.map(({ rows }) => rows.tests),
    mint,
  );
  const referenced = assembledExpressionRowsOf(
    built.map(({ document, rows }) => ({
      expressions: rows.expressions,
      ids: document.ids,
      tests: rows.tests,
      tree: document.listed.tree,
    })),
    assembled,
    built.flatMap(({ rows }) => [...rows.package.TypedHref.values()]),
  );
  const named = new Map<string, NamedDocument>();
  for (const { document, rows } of built) {
    if (document.listed.resourceType !== "none" && !named.has(document.listed.path)) {
      named.set(document.listed.path, {
        document: document.ids.idOf(0),
        object: rows.metadata.AssessmentObject.values().next().value,
      });
    }
  }

  const manifest = built.find(({ document }) => document.listed.resourceType === "none");
  const placedIds = placedIdRowsOf({
    ids: built.flatMap(({ rows }) => [...rows.identity.DocumentId.values()]),
    instances: assembled.Instance.values(),
    targets: built.flatMap(({ rows }) => [...rows.identity.IdrefTarget.values()]),
  });

  const documentsById = new Map(
    built.map(({ document }) => [document.ids.idOf(0), document] as const),
  );
  const placedShares = placedShareRowsOf({
    ids: built.flatMap(({ rows }) => [...rows.identity.DocumentId.values()]),
    instances: assembled.Instance.values(),
    nodesOf: (document) => {
      const read = documentsById.get(document);

      return read === undefined ? [] : flatten(read.listed.tree, read.ids.idOf).nodes;
    },
    shares: built.flatMap(({ rows }) => [...rows.identity.ShareFragment.values()]),
    sites: built.flatMap(({ rows }) => [...rows.tests.Site.values()]),
  });

  return [
    ...built.flatMap(({ rows }) => [
      rows.catalog,
      rows.declarations,
      rows.expressions,
      rows.html,
      rows.identity,
      rows.interactions,
      rows.mapping,
      rows.mathml,
      rows.metadata,
      rows.operators,
      rows.package,
      rows.quotation,
      rows.references,
      rows.tests,
    ]),
    assembled,
    referenced,
    languageRowsOf(built.map(({ rows }) => rows.identity)),
    placedLanguageRowsOf(
      built.map(({ rows }) => rows.identity),
      assembled.Instance.values(),
    ),
    placedVariableRowsOf({
      declarations: built.flatMap(({ rows }) => [...rows.declarations.Declaration.values()]),
      instances: assembled.Instance.values(),
      references: built.flatMap(({ rows }) => [...rows.expressions.VariableRef.values()]),
      untyped: documents.flatMap(({ ids, listed }) => untypedNamesOf(listed.tree, ids)),
    }),
    ...(manifest === undefined
      ? []
      : [objectRowsOfPackage(manifest.document.listed.tree, manifest.document.ids, named)]),
    placedBindingRowsOf({
      adaptive: built.flatMap(({ rows }) => [...rows.interactions.ItemMode.values()]),
      choices: built.flatMap(({ rows }) => [...rows.interactions.Choice.values()]),
      declarations: built.flatMap(({ rows }) => [...rows.declarations.Declaration.values()]),
      hottexts: built.flatMap(({ rows }) => [...rows.interactions.Hottext.values()]),
      instances: assembled.Instance.values(),
      mosts: built.flatMap(({ rows }) => [...rows.interactions.MostCount.values()]),
      names: built.flatMap(({ rows }) => [...rows.interactions.BindingName.values()]),
    }),
    placedIds,
    placedShares,
    placedCatalogRowsOf({
      assembledIds: placedIds.AssembledId.values(),
      catalogs: built.flatMap(({ rows }) => [...rows.catalog.CatalogId.values()]),
      instances: assembled.Instance.values(),
      targets: built.flatMap(({ rows }) => [...rows.catalog.CatalogTarget.values()]),
    }),
    sectionRowsOf({
      contexts: built.flatMap(({ rows }) => [...rows.interactions.SectionContextName.values()]),
      declarations: built.flatMap(({ rows }) => [...rows.declarations.Declaration.values()]),
      feedbacks: built.flatMap(({ rows }) => [...rows.interactions.SectionFeedbackName.values()]),
      instances: assembled.Instance.values(),
      prints: built.flatMap(({ rows }) => [...rows.interactions.SectionPrintedName.values()]),
      templates: built.flatMap(({ rows }) => [...rows.interactions.SectionTemplateName.values()]),
    }),
  ];
};

/**
 * Build every overlay's rows of one package: each document builder over each document, under its
 * ids, then the four that read the whole package: the assemblies from every document's test rows
 * (`assembledRowsOf`), the sections' placements under each test from the declarations, the
 * assemblies and the sections' and fragments' references (`sectionRowsOf`), the LOM records'
 * objects from the manifest and each document's assessment object (`objectRowsOfPackage`), and the
 * LOM languages' witnesses from every document's identity rows (`languageRowsOf`), and in place
 * under each item's assembly (`placedLanguageRowsOf`). The results are merged into one keyed set
 * per relation by {@link unionsOf}, over the overlay relations `#pantry/import/roster.ts` reads from
 * the schema.
 *
 * @param documents - The package's documents, each listed and under its ids; the manifest is the
 *   one no resource names (resource type `none`).
 * @param mint - Draws a fresh uuid for each assembled instance but a root, whose id is its
 *   document's node.
 * @returns The rows, every relation of {@link OverlayRows} present; or the {@link OverlayConflict}
 *   of two builders that give one key two rows.
 */
export const overlayRowsOf = (
  documents: readonly { readonly ids: NodeIds; readonly listed: ListedDocument }[],
  mint: () => NodeId,
): Result.Result<OverlayRows, OverlayConflict> =>
  unionsOf<OverlayRows>(overlayNames, overlayPartsOf(documents, mint));
