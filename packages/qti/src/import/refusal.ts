/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The names a refused import carries, and the maps from what refused it to one of them.
 *
 * What refuses a package is one of three things: a guard that judged the rows before any write, the
 * reader that could not read the input, or grizzle's `invariant-rejected` outcome naming the law of
 * the schema that the apply broke. {@link ruleOfError} maps the first two and {@link ruleOfLaw} the
 * third, so a caller and a test see one closed roster, {@link ImportRule}, whichever refused.
 */
import { Match, Schema } from "effect";
import type { GuardRefusal } from "#qti/import/guards/tree.ts";
import type { ItemGuardRefusal } from "#qti/import/guards/item.ts";
import type { ManifestGuardRefusal } from "#qti/import/guards/manifest.ts";
import type { NotQti3 } from "#qti/import/manifest.ts";
import type { ItemRefusal, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { PackageReadError } from "#qti/package/read.ts";
import * as patterns from "#qti/schema/patterns.ts";
import type { ReaderRefusal, WellFormednessError } from "#qti/xml/errors.ts";

/**
 * Every name a refused import may carry: the rules the schema holds at commit, the guards that run
 * before the apply and the reader's refusals.
 */
export const ImportRule = Schema.Literals([
  "admission",
  "edge-parent",
  "schema-version",
  "resource-type",
  "resource-root",
  "manifest-identifier",
  "resource-identifier",
  "file-exists",
  "href-path",
  "dependency-target",
  "document-key",
  "root-identifier",
  "root-title",
  "declaration-key",
  "declaration-reserved",
  "value-base-type",
  "value-single",
  "value-present",
  "value-lexical",
  "value-set-role",
  "binding-key",
  "binding-declared",
  "binding-fit",
  "binding-max",
  "binding-exists",
  "choice-present",
  "choice-parent",
  "choice-bounds",
  "choice-key",
  "prompt-single",
  "body-single",
  "processing-single",
  "processing-item",
  "processing-root",
  "manifest-children",
  "schema-single",
  "resource-metadata-single",
  "resource-file-present",
  "lom-general-single",
  "lom-title-single",
  "lom-identifier",
  "lom-title",
  "qti-metadata-single",
  "qti-metadata-child-single",
  "tool-string-length",
  "uri-syntax",
  "attribute-lexical",
  "text-copy",
  "typed-copy",
  "template-derivation",
  "ordering",
  "reachability",
  "body-empty",
  "file-listed",
  "href-listed",
  "manifest-root",
  "manifest-id-space",
  "not-qti3",
  "unmodeled-vocabulary",
  "well-formedness",
  "reader-refusal",
]);

/**
 * One name of the roster.
 */
export type Rule = typeof ImportRule.Type;

/**
 * The package was refused under one rule of the roster.
 *
 * `detail` says what broke it. `law` is the schema's law as grizzle reported it, present when the
 * database refused the apply.
 */
export class ImportRefused extends Schema.TaggedError<ImportRefused>()("ImportRefused", {
  detail: Schema.String,
  law: Schema.optional(Schema.Unknown),
  rule: ImportRule,
}) {
  /**
   * What was refused and by which rule, in one sentence.
   */
  override get message(): string {
    return `The package was refused under the ${this.rule} rule: ${this.detail}`;
  }
}

/**
 * One side of a containment, mirrors or capacity law: a relation and the fields it names.
 */
interface LawSide {
  readonly fields: readonly string[];
  readonly relation: string;
}

/**
 * A law as grizzle reports it in an `invariant-rejected` outcome (the engine's `Law`), the parts
 * this module reads. A `pattern` law carries the regex and no relation: grizzle reports one law for
 * every spelling of one language.
 */
export type ImportLaw =
  | { readonly fields: readonly string[]; readonly kind: "key"; readonly relation: string }
  | { readonly fields: readonly string[]; readonly kind: "primaryKey"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly from: LawSide; readonly kind: "contained"; readonly to: LawSide }
  | { readonly from: LawSide; readonly kind: "mirrors"; readonly to: LawSide }
  | { readonly from: LawSide; readonly kind: "coverage"; readonly to: LawSide }
  | { readonly field: string; readonly kind: "alternatives"; readonly relation: string }
  | { readonly from: LawSide; readonly kind: "capacity"; readonly target: LawSide }
  | { readonly contract: string; readonly kind: "contract" }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string };

/**
 * The rule a law maps to, and whether the schema's statement was recognized.
 */
interface Mapped {
  readonly mapped: boolean;
  readonly rule: Rule;
}

const named = (rule: Rule): Mapped => ({ mapped: true, rule });

/**
 * The nearest rule for a law no row of the map names, by the kind of the law alone. It is a sort,
 * not a claim: the caller keeps the law verbatim in the refusal.
 */
const nearest = (law: ImportLaw): Mapped => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return { mapped: false, rule: "document-key" };
  }

  if (law.kind === "check" || law.kind === "capacity") {
    return { mapped: false, rule: "binding-max" };
  }

  if (law.kind === "pattern" || law.kind === "contract") {
    return { mapped: false, rule: "value-lexical" };
  }

  return { mapped: false, rule: "admission" };
};

/**
 * The rule of a key, by the relation and the fields it constrains.
 */
const keyRules = new Map<string, Rule>([
  ["Declaration.(document,identifier)", "declaration-key"],
  ["DocumentIdentifier.(package,resource)", "root-identifier"],
  ["DocumentTitle.(package,resource)", "root-title"],
  ["Edge.(child)", "edge-parent"],
  ["InteractionBinding.(document,responseIdentifier)", "binding-key"],
  ["ItemBody.(item)", "body-single"],
  ["LomGeneral.(lom)", "lom-general-single"],
  ["LomGeneralTitle.(lom)", "lom-title-single"],
  ["LomObjectIdentifier.(lom)", "lom-identifier"],
  ["LomObjectTitle.(lom)", "lom-title"],
  ["Manifest.(id)", "manifest-identifier"],
  ["ManifestMetadata.(manifest)", "manifest-children"],
  ["ManifestSchema.(metadata)", "schema-single"],
  ["ManifestSchemaVersion.(metadata)", "schema-single"],
  ["Organizations.(manifest)", "manifest-children"],
  ["Package.(id)", "manifest-identifier"],
  ["Prompt.(parent)", "prompt-single"],
  ["QtiMetadata.(resource)", "qti-metadata-single"],
  ["Resource.(package,identifier)", "resource-identifier"],
  ["ResourceMetadata.(resource)", "resource-metadata-single"],
  ["Resources.(manifest)", "manifest-children"],
  ["ResponseProcessingItem.(item)", "processing-single"],
  ["SimpleChoice.(interaction,identifier)", "choice-key"],
  ["TypedDeclaration.(document,identifier)", "declaration-key"],
  ["ValueSet.(declaration,role)", "value-set-role"],
]);

const keyRule = (relation: string, fields: readonly string[]): Rule | undefined => {
  const rule = keyRules.get(`${relation}.(${fields.join(",")})`);
  if (rule !== undefined) {
    return rule;
  }

  if (relation === "AttributeLexical") {
    return "attribute-lexical";
  }

  if (relation === "Document") {
    return "document-key";
  }

  return relation.startsWith("Qmd") && fields.length === 1
    ? "qti-metadata-child-single"
    : undefined;
};

/**
 * The rule of a row check, by its name in the schema.
 */
const checkRules = new Map<string, Rule>([
  ["BindingMax", "binding-max"],
  ["ChoiceBounds", "choice-bounds"],
  ["DeclarationNotReserved", "declaration-reserved"],
  ["DependencyNotSelf", "dependency-target"],
  ["ProcessingRoot", "processing-root"],
]);

/**
 * The rule of a capacity, by the relation it bounds and the one that fills it, as
 * `bounded<filler>`.
 */
const capacityRules = new Map<string, Rule>([
  ["ChoiceInteraction<SimpleChoice", "choice-present"],
  ["Document<DocumentIdentifier", "root-identifier"],
  ["Document<DocumentTitle", "root-title"],
  ["ManifestMetadata<ManifestSchema", "schema-single"],
  ["ManifestMetadata<ManifestSchemaVersion", "schema-single"],
  ["Package<ManifestMetadata", "manifest-children"],
  ["Package<Organizations", "manifest-children"],
  ["Package<Resources", "manifest-children"],
  ["Resource<File", "resource-file-present"],
  ["ResourceLomIdentified<LomIdentifier", "lom-identifier"],
  ["ResourceLomIdentified<LomObjectIdentifier", "lom-identifier"],
  ["ResourceLomTitled<LomGeneralTitle", "lom-title-single"],
  ["ResourceLomTitled<LomObjectTitle", "lom-title"],
  ["TypedValueSet<DeclaredValue", "value-single"],
  ["ValueSet<DeclaredValue", "value-present"],
]);

/**
 * The rule of a containment, by the relation it leaves and the one it enters, as `from>to`.
 */
const containedRules = new Map<string, Rule>([
  ["ChoiceInteraction>InteractionBinding", "binding-exists"],
  ["DeclaredValue>TypedValueSet", "value-base-type"],
  ["Dependency>Resource", "dependency-target"],
  ["Document>PackageEntry", "file-exists"],
  ["Edge>Admission", "admission"],
  ["File>PackageEntry", "file-exists"],
  ["FileContent>PackageEntry", "file-exists"],
  ["InteractionBinding>Declaration", "binding-declared"],
  ["ResponseProcessing>TreeRoot", "processing-root"],
  ["SimpleChoice>ChoiceInteraction", "choice-parent"],
  ["SimpleChoice>Edge", "choice-parent"],
  ["TypedBinding>BindingFit", "binding-fit"],
]);

const containedRule = (from: LawSide, to: LawSide): Rule | undefined => {
  if (from.relation === "LomObjectIdentifier") {
    return "lom-identifier";
  }

  if (from.relation === "LomObjectTitle") {
    return "lom-title";
  }

  const rule = containedRules.get(`${from.relation}>${to.relation}`);
  if (rule !== undefined) {
    return rule;
  }

  if (to.relation === "ResourceTypeOf") {
    return "resource-type";
  }

  if (to.relation === "RootOfType") {
    return "resource-root";
  }

  return to.relation === "Package" && to.fields.includes("schemaversion")
    ? "schema-version"
    : undefined;
};

/**
 * The rule of a pattern, by its regex source. grizzle reports one pattern law for every column
 * that spells the same language, so a source names every column that uses it: `anyUri` is also the
 * `Uri` value arm's, and `hrefInPackage` is the pattern of every path column.
 */
const patternRules = new Map<string, Rule>([
  [patterns.anyUri, "uri-syntax"],
  [patterns.booleanLiteral, "value-lexical"],
  [patterns.hrefInPackage, "href-path"],
  [patterns.ncName, "value-lexical"],
  [patterns.pair, "value-lexical"],
  [patterns.point, "value-lexical"],
  [patterns.toolString, "tool-string-length"],
  [patterns.uncollapsed, "attribute-lexical"],
  [patterns.xsDouble, "value-lexical"],
  [patterns.xsInteger, "value-lexical"],
]);

const some = (rule: Rule | undefined): Mapped | undefined =>
  rule === undefined ? undefined : named(rule);

const recognized = (law: ImportLaw): Mapped | undefined => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return some(keyRule(law.relation, law.fields));
  }

  if (law.kind === "check") {
    return some(checkRules.get(law.name));
  }

  if (law.kind === "capacity") {
    return some(capacityRules.get(`${law.target.relation}<${law.from.relation}`));
  }

  if (law.kind === "contained") {
    return some(containedRule(law.from, law.to));
  }

  if (law.kind === "mirrors") {
    const between = new Set([law.from.relation, law.to.relation]);

    return between.has("ResponseProcessing") && between.has("ResponseProcessingItem")
      ? named("processing-item")
      : undefined;
  }

  if (law.kind === "pattern") {
    return some(patternRules.get(law.source)) ?? { mapped: false, rule: "value-lexical" };
  }

  return undefined;
};

const classify = (law: ImportLaw): Mapped => recognized(law) ?? nearest(law);

/**
 * The rule of the roster a schema law maps to.
 *
 * A law is matched by its kind and the relations and fields it names, against the statements `Qti`
 * declares. A law no row names falls to the nearest rule by kind; {@link refusalOfLaw} keeps such a
 * law verbatim in `detail`, and `isMappedLaw` tells the two apart.
 *
 * @param law - The `law` of an `invariant-rejected` outcome.
 * @returns The rule the law breaks.
 */
export const ruleOfLaw = (law: ImportLaw): Rule => classify(law).rule;

/**
 * Whether {@link ruleOfLaw} recognized the law, not merely sorted it.
 *
 * @param law - The `law` of an `invariant-rejected` outcome.
 * @returns False when the law fell to the nearest rule; a test reports it as a finding.
 */
export const isMappedLaw = (law: ImportLaw): boolean => classify(law).mapped;

const sideText = (side: LawSide): string => `${side.relation}(${side.fields.join(", ")})`;

const lawText = (law: ImportLaw): string => {
  if (law.kind === "key" || law.kind === "primaryKey") {
    return `${law.kind === "key" ? "key" : "primary key"} ${law.relation}.(${law.fields.join(", ")})`;
  }

  if (law.kind === "check") {
    return `check ${law.relation}.${law.name}`;
  }

  if (law.kind === "contained" || law.kind === "mirrors" || law.kind === "coverage") {
    return `${law.kind} ${sideText(law.from)} into ${sideText(law.to)}`;
  }

  if (law.kind === "capacity") {
    return `capacity of ${sideText(law.target)} by ${sideText(law.from)}`;
  }

  if (law.kind === "alternatives") {
    return `alternatives ${law.relation}.${law.field}`;
  }

  if (law.kind === "contract") {
    return `contract ${law.contract}`;
  }

  return `pattern ${law.source} (flags ${law.flags})`;
};

/**
 * The witness of an `invariant-rejected` outcome, as grizzle's `Witness` states it.
 */
export type ImportWitness =
  | { readonly kind: "key"; readonly relation: string; readonly values: object }
  | { readonly kind: "unreported" | "withheld" };

const witnessText = (witness: ImportWitness): string =>
  witness.kind === "key"
    ? `, witness ${witness.relation} ${Object.entries(witness.values)
        .map(([field, value]) => `${field}=${String(value)}`)
        .join(" ")}`
    : "";

/**
 * The refusal of an `invariant-rejected` outcome.
 *
 * `detail` names the law as the schema states it, and the witness row's key when grizzle gives one;
 * a law no row of the map names says so, under the nearest rule. The law itself rides in `law`.
 *
 * @param law - The `law` of the outcome.
 * @param witness - The `witness` of the outcome, when the caller has it; only a key witness is
 *   named.
 * @returns The refusal naming the rule.
 */
export const refusalOfLaw = (law: ImportLaw, witness?: ImportWitness): ImportRefused => {
  const { mapped, rule } = classify(law);
  const unmapped = mapped ? "" : "no rule names this law, so it is filed under the nearest: ";

  return new ImportRefused({
    detail: `${unmapped}${lawText(law)}${witness === undefined ? "" : witnessText(witness)}`,
    law,
    rule,
  });
};

/**
 * Every error that refuses an import before the database does.
 */
export type ReadRefusal =
  | GuardRefusal
  | ItemGuardRefusal
  | ItemRefusal
  | ManifestGuardRefusal
  | NotQti3
  | PackageReadError
  | ReaderRefusal
  | UnmodeledVocabulary
  | WellFormednessError;

/**
 * The refusal of an error a guard or the reader raised.
 *
 * A guard's `rule` is the rule of the same name; `PackageReadError` maps by its own rule, a missing
 * manifest to `manifest-root` and an entry path outside the package to `href-path` (R8's pattern
 * law names the same cause); `ItemRefusal` is `binding-declared` or `typed-copy`.
 *
 * @param e - The error raised.
 * @returns The refusal naming its rule.
 */
export const ruleOfError = (e: ReadRefusal): ImportRefused =>
  Match.value(e).pipe(
    Match.tagsExhaustive({
      GuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ItemGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ItemRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      ManifestGuardRefusal: (g) => new ImportRefused({ detail: g.detail, rule: g.rule }),
      NotQti3: (g) => new ImportRefused({ detail: g.detail, rule: "not-qti3" }),
      PackageReadError: (g) =>
        new ImportRefused({
          detail: g.message,
          rule: g.rule === "manifest-root" ? "manifest-root" : "href-path",
        }),
      ReaderRefusal: (g) =>
        new ImportRefused({ detail: `${g.rule}: ${g.detail}`, rule: "reader-refusal" }),
      UnmodeledVocabulary: (g) =>
        new ImportRefused({
          detail: `${g.kind} ${g.name}${g.parent._tag === "Some" ? ` in ${g.parent.value}` : ""} has no model yet`,
          rule: "unmodeled-vocabulary",
        }),
      WellFormednessError: (g) =>
        new ImportRefused({
          detail: `${g.message} at line ${g.line}, column ${g.column}`,
          rule: "well-formedness",
        }),
    }),
  );

if (import.meta.main) {
  process.stdout.write(`ImportRule: ${ImportRule.members.length} names\n`);
}
