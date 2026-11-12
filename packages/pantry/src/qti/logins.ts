/**
 * The author application's login, the import's write program, and the author login's reads, plain
 * grizzle values over `Qti`: an application's grizzle config lists {@link AuthorApp} beside its own
 * logins, or puts {@link replaceWrite} and the reads ({@link authorReads}) in a workload of a role
 * of its own, a role that writes {@link authorWrites}.
 *
 * The import's write program is the replace ({@link replaceWrite}), declared with no rows: a delete
 * of each top relation's rows of one package, each selected by a query on the package's manifest
 * identifier, and an empty array for each relation an import inserts, so each insert is an array
 * member that takes a package's rows with each call (README, "Reading": `db.workload.<name>`).
 * grizzle compiles it wherever it compiles a workload: `grizzle generate`, which writes the
 * compiled login as the served file (`migrations/qti/served/author_app.json` for this package's
 * own), and `grizzle check`, which compiles it again and holds the file to it. A schema whose
 * writes cannot compile then fails there, never at the first import (R87, whose
 * `BranchResolution.instanceEnd` made every import's ChangeSet refuse once a migrated schema ran
 * it). A process serves that file and compiles nothing: it applies the served `replaceWrite`
 * member to each package's rows (`importRowsOf` of `#pantry/import/program.ts`; the W5 amendment's
 * C19).
 */
import {
  ChangeSet,
  insertableNamesOf,
  login,
  paged,
  query,
  v,
  workload,
} from "@bjornpagen/grizzle";
import { pipe, Record as Rec, Struct } from "effect";
import { documentScan, entriesOf } from "#pantry/export/scan.ts";
import type { WrittenName } from "#pantry/import/roster.ts";
import { packageFactsOf } from "#pantry/import/write.ts";
import { ManifestIdentifier } from "#pantry/qti/limits.ts";
import { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The relations {@link replaceWrite} names: each top relation of a package it deletes, and `Entry`,
 * which {@link entryDigestsOf} reads too.
 */
const {
  AreaMapping,
  AreaMappingCardinality,
  AriaElement,
  AriaRange,
  AssembledCatalog,
  AssembledId,
  AssembledLang,
  AssembledName,
  AssembledReference,
  AssessmentObject,
  Binding,
  BindingBaseType,
  BindingCardinality,
  BindingDeclaration,
  BoundVariable,
  BranchTarget,
  CardSupport,
  CatalogId,
  CatalogScope,
  CatalogTarget,
  CellHeaders,
  CnAttribute,
  CnCount,
  Comment,
  ContextRef,
  ContextRefDeclaration,
  CountBound,
  CountRange,
  DataSsml,
  DataSsmlMember,
  DataSsmlProperty,
  Declaration,
  DeclarationIdentifier,
  DeclarationName,
  DefaultEntry,
  Dependency,
  DependencyTarget,
  Doctype,
  Document,
  DocumentLang,
  ElementType,
  EncodingDecl,
  Entry,
  Expression,
  ExpressionAttribute,
  FeedbackRef,
  FeedbackRefCardinality,
  FeedbackRefDeclaration,
  FieldValue,
  FileHref,
  FragmentValue,
  Hotspot,
  IdBinding,
  IdentityText,
  Inclusion,
  Interaction,
  InteractionAttribute,
  ItemMode,
  ItemRefDocument,
  ItemRefHref,
  LabelUse,
  Literal,
  LiteralTyped,
  LomEntry,
  LomGeneral,
  LomRecord,
  LomResourceType,
  LomResourceTypeSource,
  LomString,
  LomTitle,
  LomTitleString,
  LookupTable,
  LookupTableCardinality,
  LookupValue,
  LookupValueType,
  ManifestId,
  MapKey,
  MapKeyItems,
  MapKeyType,
  Mapping,
  MappingBaseType,
  MappingCardinality,
  MappingItemRef,
  MappingSourceDeclaration,
  MasteryCeiling,
  MasteryFloor,
  MathAction,
  MathAlignScope,
  MathApply,
  MathCell,
  MathCn,
  MathDir,
  MathRank,
  Node,
  ObjectIdentifier,
  ObjectLang,
  ObjectTitle,
  OpenElementName,
  OpenElementType,
  Pi,
  PlacedBindingBaseType,
  PlacedBindingCardinality,
  PlacedBindingDeclaration,
  PlacedDocument,
  PlacedMathRank,
  PlacedVariableRefDeclaration,
  PrintedVariableRef,
  PrintedVariableRefDeclaration,
  Processing,
  ProcessingTemplate,
  Quotation,
  ReadingCardinality,
  ReadingDeclaration,
  RecordFieldName,
  Reference,
  ReferenceDocument,
  ReferencePath,
  ReferringDocument,
  Resource,
  ResourceDocument,
  ResourceFile,
  ResourceHref,
  ResourceId,
  ResourceLomLanguageSet,
  ResourceTyped,
  Rounding,
  RoundingFigures,
  RoundingMode,
  RoundingModeFigures,
  SdDecl,
  Section,
  SectionContextRefDeclaration,
  SectionFeedbackRefCardinality,
  SectionFeedbackRefDeclaration,
  SectionIdentifier,
  SectionOrdering,
  SectionPrintedRefDeclaration,
  SectionScope,
  SectionSelection,
  SectionTemplateRefCardinality,
  SectionTemplateRefDeclaration,
  ShareFragment,
  ShareTarget,
  Site,
  SitePath,
  Slider,
  SsmlScope,
  StatisticDate,
  StimulusRef,
  TableHeader,
  TableScope,
  TemplateDefault,
  TemplateDefaultCardinality,
  TemplateDefaultTarget,
  TemplateRef,
  TemplateRefCardinality,
  TemplateRefDeclaration,
  TestDocument,
  TestFlag,
  TestToken,
  TextReference,
  TextReferencePath,
  Tolerance,
  TypedValue,
  UsageBaseType,
  UsageValue,
  UsageValueBaseType,
  Value,
  ValueBaseType,
  ValueSet,
  ValueSetCardinality,
  VariableMapping,
  VariableRefCardinality,
  VariableRefDeclaration,
  VariableRefTable,
  XmlDecl,
} = Qti.relations;

/**
 * The relations a ChangeSet over `Qti` writes, the `Writes` of grizzle's `ChangeSet` type: each
 * relation its members name, and every relation a whole delete reaches through the families of the
 * relation it names.
 */
type WritesOf<C> =
  C extends ChangeSet<typeof Qti, infer _Params, infer Writes, infer _Reads> ? Writes : never;

/**
 * The relations an import writes that a ChangeSet's deletes leave as they are: each relation an
 * import writes but `Package`, which a replace keeps, that the ChangeSet does not write.
 */
type Undeleted<C> = Exclude<WrittenName, WritesOf<C> | "Package">;

/**
 * Hold a ChangeSet of deletes to reach every relation an import writes but `Package`, so the
 * replace leaves no stored row of a package that its new rows do not state: a top relation whose
 * delete is missing fails to compile here, naming the relation (`undeleted`). The deletes reach a
 * family's members through its owner, so a relation listed nowhere in the chain is reached where
 * its owner is deleted, and nowhere else.
 *
 * @param deletes - The deletes.
 * @returns The deletes.
 */
const deletingEvery = <C>(
  deletes: C & ([Undeleted<C>] extends [never] ? unknown : { readonly undeleted: Undeleted<C> }),
): C => deletes;

/**
 * The replace of one package, the import's write program: one ChangeSet step over `Qti` that
 * deletes the rows stored under the package's manifest identifier and inserts the package's rows,
 * which grizzle plans together as one set difference (README, "Writing a family": a replace is a
 * delete and an insert in one stratum). Each import applies it to its own package's rows,
 * `db.workload.replaceWrite.apply({ insert: rows.insert }, { package: rows.package })`, the rows
 * `importRowsOf` builds (`#pantry/import/program.ts`).
 *
 * - **the deletes**: one delete of each top relation of the package, each selected by a query on its
 *   `package`, in the order of the relations' names: a tree, `Node`, by its root, each document's
 *   `(package, path)`, and every other relation by its row as its caller writes it, the fields
 *   grizzle or PostgreSQL write left out. A delete of a family's owner removes every row nested
 *   under it, through every family, so no family's member is deleted on its own: `Instance`, a tree
 *   whose nodes are the members of `TestDocument.instances`, goes with its `TestDocument`.
 *   `Package` is not deleted: its one field is its identifier, so the replace's insert finds it as
 *   it is. {@link deletingEvery} holds the deletes to reach every other relation an import writes.
 * - **the inserts**: each relation an import writes (grizzle's `insertableNamesOf`) inserted once by
 *   its key with no row (`insertAll`, which types and checks each key's rows as that relation's own
 *   insert), every owner in the same stratum as its whole family (the W5 amendment's A, C19).
 *
 * A ChangeSet is canonical, its members sorted by relation, so the order of the members is no part
 * of it. Every row is keyed by the package's own identity, its manifest identifier and the paths
 * and positions in it, and every relation of `Qti` is immutable, so a fact both the stored and the
 * new rows hold is kept as it is, a stored fact the new rows lack is deleted, and a new fact the
 * stored rows lack is inserted: a fact whose key both hold with other fields is deleted and
 * inserted again, never updated. A package under an identifier no package holds is inserted whole
 * (`accepted`, no row deleted), the same package again is `no-change`, and a changed package is
 * `accepted` with the rows it deleted counted (`#pantry/import/package.ts` names it `replaced`).
 *
 * It is over the schema, so a workload of any role that writes every relation of `Qti` holds it,
 * the author role's ({@link AuthorApp}) or an application's own. An application that writes rows of
 * its own in the same transaction applies the union of this and its own ChangeSet
 * (`ChangeSet.union(replaceWrite, its own)`), through a role that writes {@link authorWrites}.
 */
// GRIZZLE-PENDING: Q2: the rowless ChangeSet builder declares these inserts by relation name with no rows.
export const replaceWrite = deletingEvery(
  ChangeSet.empty(Qti)
    .delete(
      AreaMapping,
      query(Qti).rule((r) => {
        const stored = v(AreaMapping, "stored");

        return r
          .match(AreaMapping, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AreaMappingCardinality,
      query(Qti).rule((r) => {
        const stored = v(AreaMappingCardinality, "stored");

        return r
          .match(AreaMappingCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AriaElement,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(AriaElement, "stored"), ["values"]);

        return r
          .match(AriaElement, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AriaRange,
      query(Qti).rule((r) => {
        const stored = v(AriaRange, "stored");

        return r
          .match(AriaRange, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AssembledCatalog,
      query(Qti).rule((r) => {
        const stored = v(AssembledCatalog, "stored");

        return r
          .match(AssembledCatalog, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AssembledId,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(AssembledId, "stored"), ["carriers"]);

        return r
          .match(AssembledId, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AssembledLang,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(AssembledLang, "stored"), ["carriers", "value"]);

        return r
          .match(AssembledLang, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AssembledName,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(AssembledName, "stored"), ["placements"]);

        return r
          .match(AssembledName, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AssembledReference,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(AssembledReference, "stored"), [
          "digits",
          "joined",
          "placements",
          "readings",
          "segments",
        ]);

        return r
          .match(AssembledReference, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      AssessmentObject,
      query(Qti).rule((r) => {
        const stored = v(AssessmentObject, "stored");

        return r
          .match(AssessmentObject, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Binding,
      query(Qti).rule((r) => {
        const stored = v(Binding, "stored");

        return r
          .match(Binding, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      BindingBaseType,
      query(Qti).rule((r) => {
        const stored = v(BindingBaseType, "stored");

        return r
          .match(BindingBaseType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      BindingCardinality,
      query(Qti).rule((r) => {
        const stored = v(BindingCardinality, "stored");

        return r
          .match(BindingCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      BindingDeclaration,
      query(Qti).rule((r) => {
        const stored = v(BindingDeclaration, "stored");

        return r
          .match(BindingDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      BoundVariable,
      query(Qti).rule((r) => {
        const stored = v(BoundVariable, "stored");

        return r
          .match(BoundVariable, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      BranchTarget,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(BranchTarget, "stored"), ["shuffles"]);

        return r
          .match(BranchTarget, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CardSupport,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(CardSupport, "stored"), ["support"]);

        return r
          .match(CardSupport, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CatalogId,
      query(Qti).rule((r) => {
        const stored = v(CatalogId, "stored");

        return r
          .match(CatalogId, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CatalogScope,
      query(Qti).rule((r) => {
        const stored = v(CatalogScope, "stored");

        return r
          .match(CatalogScope, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CatalogTarget,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(CatalogTarget, "stored"), ["carriers", "placements"]);

        return r
          .match(CatalogTarget, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CellHeaders,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(CellHeaders, "stored"), ["tokenText", "tokens"]);

        return r
          .match(CellHeaders, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CnAttribute,
      query(Qti).rule((r) => {
        const stored = v(CnAttribute, "stored");

        return r
          .match(CnAttribute, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CnCount,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(CnCount, "stored"), ["parts"]);

        return r
          .match(CnCount, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Comment,
      query(Qti).rule((r) => {
        const stored = v(Comment, "stored");

        return r
          .match(Comment, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ContextRef,
      query(Qti).rule((r) => {
        const stored = v(ContextRef, "stored");

        return r
          .match(ContextRef, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ContextRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(ContextRefDeclaration, "stored");

        return r
          .match(ContextRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CountBound,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(CountBound, "stored"), ["leasts", "mosts"]);

        return r
          .match(CountBound, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      CountRange,
      query(Qti).rule((r) => {
        const stored = v(CountRange, "stored");

        return r
          .match(CountRange, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DataSsml,
      query(Qti).rule((r) => {
        const stored = v(DataSsml, "stored");

        return r
          .match(DataSsml, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DataSsmlMember,
      query(Qti).rule((r) => {
        const stored = v(DataSsmlMember, "stored");

        return r
          .match(DataSsmlMember, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DataSsmlProperty,
      query(Qti).rule((r) => {
        const stored = v(DataSsmlProperty, "stored");

        return r
          .match(DataSsmlProperty, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Declaration,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Declaration, "stored"), [
          "baseTypes",
          "cardinalities",
          "masteries",
          "maximums",
          "minimums",
        ]);

        return r
          .match(Declaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DeclarationIdentifier,
      query(Qti).rule((r) => {
        const stored = v(DeclarationIdentifier, "stored");

        return r
          .match(DeclarationIdentifier, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DeclarationName,
      query(Qti).rule((r) => {
        const stored = v(DeclarationName, "stored");

        return r
          .match(DeclarationName, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DefaultEntry,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(DefaultEntry, "stored"), ["value"]);

        return r
          .match(DefaultEntry, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Dependency,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Dependency, "stored"), ["ref"]);

        return r
          .match(Dependency, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DependencyTarget,
      query(Qti).rule((r) => {
        const stored = v(DependencyTarget, "stored");

        return r
          .match(DependencyTarget, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Doctype,
      query(Qti).rule((r) => {
        const stored = v(Doctype, "stored");

        return r
          .match(Doctype, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Document,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Document, "stored"), [
          "bindings",
          "choices",
          "context",
          "hottexts",
          "idrefTargets",
          "ids",
          "langs",
          "targetedBy",
          "variables",
        ]);

        return r
          .match(Document, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      DocumentLang,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(DocumentLang, "stored"), ["carriers", "value"]);

        return r
          .match(DocumentLang, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ElementType,
      query(Qti).rule((r) => {
        const stored = v(ElementType, "stored");

        return r
          .match(ElementType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      EncodingDecl,
      query(Qti).rule((r) => {
        const stored = v(EncodingDecl, "stored");

        return r
          .match(EncodingDecl, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Entry,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Entry, "stored"), ["digest"]);

        return r
          .match(Entry, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Expression,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Expression, "stored"), [
          "leadCardinalities",
          "operandBaseTypes",
          "operandCardinalities",
          "operands",
          "tailBaseTypes",
          "tailCardinalities",
        ]);

        return r
          .match(Expression, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ExpressionAttribute,
      query(Qti).rule((r) => {
        const stored = v(ExpressionAttribute, "stored");

        return r
          .match(ExpressionAttribute, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      FeedbackRef,
      query(Qti).rule((r) => {
        const stored = v(FeedbackRef, "stored");

        return r
          .match(FeedbackRef, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      FeedbackRefCardinality,
      query(Qti).rule((r) => {
        const stored = v(FeedbackRefCardinality, "stored");

        return r
          .match(FeedbackRefCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      FeedbackRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(FeedbackRefDeclaration, "stored");

        return r
          .match(FeedbackRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      FieldValue,
      query(Qti).rule((r) => {
        const stored = v(FieldValue, "stored");

        return r
          .match(FieldValue, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      FileHref,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(FileHref, "stored"), ["files"]);

        return r
          .match(FileHref, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      FragmentValue,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(FragmentValue, "stored"), ["carriers"]);

        return r
          .match(FragmentValue, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Hotspot,
      query(Qti).rule((r) => {
        const stored = v(Hotspot, "stored");

        return r
          .match(Hotspot, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      IdBinding,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(IdBinding, "stored"), ["carriers"]);

        return r
          .match(IdBinding, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      IdentityText,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(IdentityText, "stored"), ["idrefText", "idrefs"]);

        return r
          .match(IdentityText, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Inclusion,
      query(Qti).rule((r) => {
        const stored = v(Inclusion, "stored");

        return r
          .match(Inclusion, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Interaction,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Interaction, "stored"), ["choices", "gaps", "moduleForms"]);

        return r
          .match(Interaction, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      InteractionAttribute,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(InteractionAttribute, "stored"), ["value"]);

        return r
          .match(InteractionAttribute, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ItemMode,
      query(Qti).rule((r) => {
        const stored = v(ItemMode, "stored");

        return r
          .match(ItemMode, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ItemRefDocument,
      query(Qti).rule((r) => {
        const stored = v(ItemRefDocument, "stored");

        return r
          .match(ItemRefDocument, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ItemRefHref,
      query(Qti).rule((r) => {
        const stored = v(ItemRefHref, "stored");

        return r
          .match(ItemRefHref, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LabelUse,
      query(Qti).rule((r) => {
        const stored = v(LabelUse, "stored");

        return r
          .match(LabelUse, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Literal,
      query(Qti).rule((r) => {
        const stored = v(Literal, "stored");

        return r
          .match(Literal, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LiteralTyped,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(LiteralTyped, "stored"), ["baseType"]);

        return r
          .match(LiteralTyped, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomEntry,
      query(Qti).rule((r) => {
        const stored = v(LomEntry, "stored");

        return r
          .match(LomEntry, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomGeneral,
      query(Qti).rule((r) => {
        const stored = v(LomGeneral, "stored");

        return r
          .match(LomGeneral, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomRecord,
      query(Qti).rule((r) => {
        const stored = v(LomRecord, "stored");

        return r
          .match(LomRecord, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomResourceType,
      query(Qti).rule((r) => {
        const stored = v(LomResourceType, "stored");

        return r
          .match(LomResourceType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomResourceTypeSource,
      query(Qti).rule((r) => {
        const stored = v(LomResourceTypeSource, "stored");

        return r
          .match(LomResourceTypeSource, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomString,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(LomString, "stored"), ["languages"]);

        return r
          .match(LomString, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomTitle,
      query(Qti).rule((r) => {
        const stored = v(LomTitle, "stored");

        return r
          .match(LomTitle, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LomTitleString,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(LomTitleString, "stored"), ["textValue"]);

        return r
          .match(LomTitleString, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LookupTable,
      query(Qti).rule((r) => {
        const stored = v(LookupTable, "stored");

        return r
          .match(LookupTable, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LookupTableCardinality,
      query(Qti).rule((r) => {
        const stored = v(LookupTableCardinality, "stored");

        return r
          .match(LookupTableCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LookupValue,
      query(Qti).rule((r) => {
        const stored = v(LookupValue, "stored");

        return r
          .match(LookupValue, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      LookupValueType,
      query(Qti).rule((r) => {
        const stored = v(LookupValueType, "stored");

        return r
          .match(LookupValueType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ManifestId,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ManifestId, "stored"), ["identifier"]);

        return r
          .match(ManifestId, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MapKey,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MapKey, "stored"), ["matched"]);

        return r
          .match(MapKey, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MapKeyItems,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MapKeyItems, "stored"), ["ordered", "unordered"]);

        return r
          .match(MapKeyItems, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MapKeyType,
      query(Qti).rule((r) => {
        const stored = v(MapKeyType, "stored");

        return r
          .match(MapKeyType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Mapping,
      query(Qti).rule((r) => {
        const stored = v(Mapping, "stored");

        return r
          .match(Mapping, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MappingBaseType,
      query(Qti).rule((r) => {
        const stored = v(MappingBaseType, "stored");

        return r
          .match(MappingBaseType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MappingCardinality,
      query(Qti).rule((r) => {
        const stored = v(MappingCardinality, "stored");

        return r
          .match(MappingCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MappingItemRef,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MappingItemRef, "stored"), ["types"]);

        return r
          .match(MappingItemRef, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MappingSourceDeclaration,
      query(Qti).rule((r) => {
        const stored = v(MappingSourceDeclaration, "stored");

        return r
          .match(MappingSourceDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MasteryCeiling,
      query(Qti).rule((r) => {
        const stored = v(MasteryCeiling, "stored");

        return r
          .match(MasteryCeiling, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MasteryFloor,
      query(Qti).rule((r) => {
        const stored = v(MasteryFloor, "stored");

        return r
          .match(MasteryFloor, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathAction,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MathAction, "stored"), ["selection"]);

        return r
          .match(MathAction, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathAlignScope,
      query(Qti).rule((r) => {
        const stored = v(MathAlignScope, "stored");

        return r
          .match(MathAlignScope, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathApply,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MathApply, "stored"), ["arguments", "owned"]);

        return r
          .match(MathApply, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathCell,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MathCell, "stored"), ["groups", "lastStart", "leaves"]);

        return r
          .match(MathCell, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathCn,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(MathCn, "stored"), ["parts"]);

        return r
          .match(MathCn, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathDir,
      query(Qti).rule((r) => {
        const stored = v(MathDir, "stored");

        return r
          .match(MathDir, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      MathRank,
      query(Qti).rule((r) => {
        const stored = v(MathRank, "stored");

        return r
          .match(MathRank, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Node,
      query(Qti).rule((r) => {
        const { package: owner, path } = v(Node, "stored");

        return r
          .match(Node, { package: owner, path })
          .where(r.eq(owner, r.param("package", ManifestIdentifier)))
          .find({ package: owner, path });
      }),
    )
    .delete(
      ObjectIdentifier,
      query(Qti).rule((r) => {
        const stored = v(ObjectIdentifier, "stored");

        return r
          .match(ObjectIdentifier, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ObjectLang,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ObjectLang, "stored"), ["langTag"]);

        return r
          .match(ObjectLang, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ObjectTitle,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ObjectTitle, "stored"), ["titleValue"]);

        return r
          .match(ObjectTitle, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      OpenElementName,
      query(Qti).rule((r) => {
        const stored = v(OpenElementName, "stored");

        return r
          .match(OpenElementName, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      OpenElementType,
      query(Qti).rule((r) => {
        const stored = v(OpenElementType, "stored");

        return r
          .match(OpenElementType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Pi,
      query(Qti).rule((r) => {
        const stored = v(Pi, "stored");

        return r
          .match(Pi, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PlacedBindingBaseType,
      query(Qti).rule((r) => {
        const stored = v(PlacedBindingBaseType, "stored");

        return r
          .match(PlacedBindingBaseType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PlacedBindingCardinality,
      query(Qti).rule((r) => {
        const stored = v(PlacedBindingCardinality, "stored");

        return r
          .match(PlacedBindingCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PlacedBindingDeclaration,
      query(Qti).rule((r) => {
        const stored = v(PlacedBindingDeclaration, "stored");

        return r
          .match(PlacedBindingDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PlacedDocument,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(PlacedDocument, "stored"), ["references"]);

        return r
          .match(PlacedDocument, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PlacedMathRank,
      query(Qti).rule((r) => {
        const stored = v(PlacedMathRank, "stored");

        return r
          .match(PlacedMathRank, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PlacedVariableRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(PlacedVariableRefDeclaration, "stored");

        return r
          .match(PlacedVariableRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PrintedVariableRef,
      query(Qti).rule((r) => {
        const stored = v(PrintedVariableRef, "stored");

        return r
          .match(PrintedVariableRef, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      PrintedVariableRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(PrintedVariableRefDeclaration, "stored");

        return r
          .match(PrintedVariableRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Processing,
      query(Qti).rule((r) => {
        const stored = v(Processing, "stored");

        return r
          .match(Processing, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ProcessingTemplate,
      query(Qti).rule((r) => {
        const stored = v(ProcessingTemplate, "stored");

        return r
          .match(ProcessingTemplate, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Quotation,
      query(Qti).rule((r) => {
        const stored = v(Quotation, "stored");

        return r
          .match(Quotation, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ReadingCardinality,
      query(Qti).rule((r) => {
        const stored = v(ReadingCardinality, "stored");

        return r
          .match(ReadingCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ReadingDeclaration,
      query(Qti).rule((r) => {
        const stored = v(ReadingDeclaration, "stored");

        return r
          .match(ReadingDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      RecordFieldName,
      query(Qti).rule((r) => {
        const stored = v(RecordFieldName, "stored");

        return r
          .match(RecordFieldName, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Reference,
      query(Qti).rule((r) => {
        const stored = v(Reference, "stored");

        return r
          .match(Reference, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ReferenceDocument,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ReferenceDocument, "stored"), ["references"]);

        return r
          .match(ReferenceDocument, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ReferencePath,
      query(Qti).rule((r) => {
        const stored = v(ReferencePath, "stored");

        return r
          .match(ReferencePath, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ReferringDocument,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ReferringDocument, "stored"), [
          "contexts",
          "feedbacks",
          "prints",
          "templates",
        ]);

        return r
          .match(ReferringDocument, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Resource,
      query(Qti).rule((r) => {
        const stored = v(Resource, "stored");

        return r
          .match(Resource, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ResourceDocument,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ResourceDocument, "stored"), ["documentType"]);

        return r
          .match(ResourceDocument, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ResourceFile,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ResourceFile, "stored"), ["files"]);

        return r
          .match(ResourceFile, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ResourceHref,
      query(Qti).rule((r) => {
        const stored = v(ResourceHref, "stored");

        return r
          .match(ResourceHref, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ResourceId,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ResourceId, "stored"), ["identifier"]);

        return r
          .match(ResourceId, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ResourceLomLanguageSet,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ResourceLomLanguageSet, "stored"), ["carriers"]);

        return r
          .match(ResourceLomLanguageSet, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ResourceTyped,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ResourceTyped, "stored"), ["typeLexical"]);

        return r
          .match(ResourceTyped, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Rounding,
      query(Qti).rule((r) => {
        const stored = v(Rounding, "stored");

        return r
          .match(Rounding, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      RoundingFigures,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(RoundingFigures, "stored"), ["figures"]);

        return r
          .match(RoundingFigures, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      RoundingMode,
      query(Qti).rule((r) => {
        const stored = v(RoundingMode, "stored");

        return r
          .match(RoundingMode, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      RoundingModeFigures,
      query(Qti).rule((r) => {
        const stored = v(RoundingModeFigures, "stored");

        return r
          .match(RoundingModeFigures, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SdDecl,
      query(Qti).rule((r) => {
        const stored = v(SdDecl, "stored");

        return r
          .match(SdDecl, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Section,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Section, "stored"), ["members", "required"]);

        return r
          .match(Section, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionContextRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(SectionContextRefDeclaration, "stored");

        return r
          .match(SectionContextRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionFeedbackRefCardinality,
      query(Qti).rule((r) => {
        const stored = v(SectionFeedbackRefCardinality, "stored");

        return r
          .match(SectionFeedbackRefCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionFeedbackRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(SectionFeedbackRefDeclaration, "stored");

        return r
          .match(SectionFeedbackRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionIdentifier,
      query(Qti).rule((r) => {
        const stored = v(SectionIdentifier, "stored");

        return r
          .match(SectionIdentifier, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionOrdering,
      query(Qti).rule((r) => {
        const stored = v(SectionOrdering, "stored");

        return r
          .match(SectionOrdering, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionPrintedRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(SectionPrintedRefDeclaration, "stored");

        return r
          .match(SectionPrintedRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionScope,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(SectionScope, "stored"), [
          "contexts",
          "feedbacks",
          "prints",
          "templates",
        ]);

        return r
          .match(SectionScope, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionSelection,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(SectionSelection, "stored"), ["select"]);

        return r
          .match(SectionSelection, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionTemplateRefCardinality,
      query(Qti).rule((r) => {
        const stored = v(SectionTemplateRefCardinality, "stored");

        return r
          .match(SectionTemplateRefCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SectionTemplateRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(SectionTemplateRefDeclaration, "stored");

        return r
          .match(SectionTemplateRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ShareFragment,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ShareFragment, "stored"), ["placements"]);

        return r
          .match(ShareFragment, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ShareTarget,
      query(Qti).rule((r) => {
        const stored = v(ShareTarget, "stored");

        return r
          .match(ShareTarget, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Site,
      query(Qti).rule((r) => {
        const stored = v(Site, "stored");

        return r
          .match(Site, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SitePath,
      query(Qti).rule((r) => {
        const stored = v(SitePath, "stored");

        return r
          .match(SitePath, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Slider,
      query(Qti).rule((r) => {
        const stored = v(Slider, "stored");

        return r
          .match(Slider, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      SsmlScope,
      query(Qti).rule((r) => {
        const stored = v(SsmlScope, "stored");

        return r
          .match(SsmlScope, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      StatisticDate,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(StatisticDate, "stored"), ["date"]);

        return r
          .match(StatisticDate, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      StimulusRef,
      query(Qti).rule((r) => {
        const stored = v(StimulusRef, "stored");

        return r
          .match(StimulusRef, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TableHeader,
      query(Qti).rule((r) => {
        const stored = v(TableHeader, "stored");

        return r
          .match(TableHeader, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TableScope,
      query(Qti).rule((r) => {
        const stored = v(TableScope, "stored");

        return r
          .match(TableScope, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TemplateDefault,
      query(Qti).rule((r) => {
        const stored = v(TemplateDefault, "stored");

        return r
          .match(TemplateDefault, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TemplateDefaultCardinality,
      query(Qti).rule((r) => {
        const stored = v(TemplateDefaultCardinality, "stored");

        return r
          .match(TemplateDefaultCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TemplateDefaultTarget,
      query(Qti).rule((r) => {
        const stored = v(TemplateDefaultTarget, "stored");

        return r
          .match(TemplateDefaultTarget, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TemplateRef,
      query(Qti).rule((r) => {
        const stored = v(TemplateRef, "stored");

        return r
          .match(TemplateRef, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TemplateRefCardinality,
      query(Qti).rule((r) => {
        const stored = v(TemplateRefCardinality, "stored");

        return r
          .match(TemplateRefCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TemplateRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(TemplateRefDeclaration, "stored");

        return r
          .match(TemplateRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TestDocument,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(TestDocument, "stored"), [
          "instances",
          "names",
          "rules",
          "sites",
          "targets",
        ]);

        return r
          .match(TestDocument, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TestFlag,
      query(Qti).rule((r) => {
        const stored = v(TestFlag, "stored");

        return r
          .match(TestFlag, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TestToken,
      query(Qti).rule((r) => {
        const stored = v(TestToken, "stored");

        return r
          .match(TestToken, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TextReference,
      query(Qti).rule((r) => {
        const stored = v(TextReference, "stored");

        return r
          .match(TextReference, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TextReferencePath,
      query(Qti).rule((r) => {
        const stored = v(TextReferencePath, "stored");

        return r
          .match(TextReferencePath, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Tolerance,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(Tolerance, "stored"), ["tokenText", "tokens"]);

        return r
          .match(Tolerance, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      TypedValue,
      query(Qti).rule((r) => {
        const stored = v(TypedValue, "stored");

        return r
          .match(TypedValue, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      UsageBaseType,
      query(Qti).rule((r) => {
        const stored = v(UsageBaseType, "stored");

        return r
          .match(UsageBaseType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      UsageValue,
      query(Qti).rule((r) => {
        const stored = v(UsageValue, "stored");

        return r
          .match(UsageValue, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      UsageValueBaseType,
      query(Qti).rule((r) => {
        const stored = v(UsageValueBaseType, "stored");

        return r
          .match(UsageValueBaseType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      Value,
      query(Qti).rule((r) => {
        const stored = v(Value, "stored");

        return r
          .match(Value, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ValueBaseType,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ValueBaseType, "stored"), ["baseTypeLexical"]);

        return r
          .match(ValueBaseType, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ValueSet,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(ValueSet, "stored"), ["fields"]);

        return r
          .match(ValueSet, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      ValueSetCardinality,
      query(Qti).rule((r) => {
        const stored = v(ValueSetCardinality, "stored");

        return r
          .match(ValueSetCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      VariableMapping,
      query(Qti).rule((r) => {
        const stored = v(VariableMapping, "stored");

        return r
          .match(VariableMapping, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      VariableRefCardinality,
      query(Qti).rule((r) => {
        const stored = Struct.omit(v(VariableRefCardinality, "stored"), ["cardinality"]);

        return r
          .match(VariableRefCardinality, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      VariableRefDeclaration,
      query(Qti).rule((r) => {
        const stored = v(VariableRefDeclaration, "stored");

        return r
          .match(VariableRefDeclaration, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      VariableRefTable,
      query(Qti).rule((r) => {
        const stored = v(VariableRefTable, "stored");

        return r
          .match(VariableRefTable, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    )
    .delete(
      XmlDecl,
      query(Qti).rule((r) => {
        const stored = v(XmlDecl, "stored");

        return r
          .match(XmlDecl, stored)
          .where(r.eq(stored.package, r.param("package", ManifestIdentifier)))
          .find(stored);
      }),
    ),
).insertAll(
  packageFactsOf(
    pipe(
      Struct.pick(Qti.relations, insertableNamesOf(Qti)),
      Rec.map(() => new Map<string, never>()),
    ),
  ),
);

/**
 * The digests of one package's entries: every entry's path and the SHA-256 of its bytes
 * (`Entry.digest`, which PostgreSQL computes from the bytes it stores), selected by the package's
 * manifest identifier, its parameter `package`, and read without the bytes. A set keyed by path.
 * The import reads it after a commit that got no answer, to see whether the database holds the
 * package it wrote: the `Package` row stands before and after a replace, so only the entries tell
 * the stored package from the written one (`#pantry/import/package.ts`).
 */
export const entryDigestsOf = query(Qti).rule((r) => {
  const { digest, package: owner, path } = v(Entry, "entry");

  return r
    .match(Entry, { digest, package: owner, path })
    .where(r.eq(owner, r.param("package", ManifestIdentifier)))
    .find({ digest, path });
});

/**
 * The relations the author role writes, by name ({@link Author}): every stored relation of `Qti`,
 * each inserted into and deleted from, none updated. An application whose own role over its level
 * writes content beside rows of its own, in one transaction and under one login
 * ({@link replaceWrite}), lists these in its role's write list beside its own relations.
 */
export const authorWrites = Author.write;

/**
 * The author login's reads, as its first workload holds them: the export's, one document's ordered
 * scan and a package's entries with each entry's document (`#pantry/export/scan.ts`), and
 * `packageOf`, the `Package` row by its key, its manifest identifier; and the import's,
 * {@link entryDigestsOf}, the path and digest of each of a package's entries. Each is over `Qti`,
 * so a workload of any author role holds them.
 */
export const authorReads = {
  documentScan: paged(documentScan),
  entriesOf,
  entryDigestsOf,
  packageOf: Qti.relations.Package,
} as const;

/**
 * The author application's login over `Qti`, over its author role (`#pantry/qti/roles.ts`
 * `Author`), with two workloads:
 *
 * - **the reads** ({@link authorReads}): one document's ordered scan and a package's entries with
 *   each entry's document, each compiled by `grizzle generate` into the login's served file, its
 *   access paths earning their indexes (the W5 amendment's C20); `packageOf`, the `Package` row by
 *   its manifest identifier, a key member whose handle's `get` the export reads to refuse an
 *   identifier no package has; and the digests of a package's entries, which the import reads back
 *   after a commit with no answer, so every read pantry runs is a member of the workload;
 * - **the import's write program**: {@link replaceWrite}, its deletes selected by a parameter and
 *   every insert an array member. grizzle compiles a ChangeSet from its Description, which names
 *   each delete's query and each insert and none of its rows, so this is the program every
 *   package's import applies to its rows, compiled once into the served file. Compiling it also
 *   guards the refusals of the write program itself: the schema's own compile already refuses a
 *   column or a relation no write fills, and this one refuses a write outside the author role
 *   (`OutsideRole`), a stratum no order of its statements keeps every key at
 *   (`UnorderableStratum`), and a delete that leaves a family's group partial.
 *
 * Its name is the one every earlier installation used, so a migration from scratch needs no
 * `--rename @…`. Where it is installed, its PostgreSQL role is the one grizzle's `roleNameOf` gives
 * it. A login over `Qti` is a login of any installation whose levels include `Qti`, so an
 * application that stacks a level over `Qti` (`#pantry/qti/media.ts`) lists it as it is.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/engine/src/program/names.ts#L61-L76
 */
export const AuthorApp = login(Qti, "author_app", [Author], {
  workload: [workload(Author, authorReads), workload(Author, { replaceWrite })],
});

/**
 * The author application's login, the type of {@link AuthorApp}: the type the runtime serves the
 * login's committed workload as (`#pantry/db/served.ts`), read by `import type` alone.
 */
export type AuthorAppLogin = typeof AuthorApp;
