/**
 * An item ref's target, item and declarations against the law oracle (lane NIL, the audit's A13
 * to A22 and NS3): every
 * package the item-ref-declarations generator (`#pantry/test/gen/item-ref-declarations.ts`) draws,
 * exhausted in a small box and sampled by a swarm beyond it, is judged two ways, and the import's
 * rows are held to the ruling that a missing value is a row of its own relation, never a sentinel.
 *
 * - **The law oracle** (`#pantry/test/oracle.ts`) judges the package's documents as written: its
 *   `Item ref target`, `Template default target`, `Template default type`, `Variable mapping
 *   source` and `Variable mapping target` breaches, each by the name its element writes.
 * - **The schema's laws, restated on the host** over the import's rows (`readProgram`): the existence
 *   of each template default's `TemplateDefaultTarget` and each mapping's
 *   `MappingSourceDeclaration`, but a mapping's under an LTI item ref, which with a reading through
 *   it is accepted unchecked (reading 110, its `MappingItemRefType`), their containments into
 *   `ItemRefDocument` and `Declaration`, their CHECKs, a mapped reading's declaration (its
 *   mapping's source's), `VariableMapping`'s key and session check, and what each item ref names:
 *   its `ItemRefHref`, and its `ItemRefTarget` and `ItemRefDocument`, each a row only where the
 *   package holds it. Each law carries the name `src/import/refusal.ts` gives the schema's
 *   statement of it ({@link hostLaws}, held to `statedLaws` by the first test).
 *
 * The two must name the same breaches, but one residual the schema states on purpose: the declared
 * half of `Variable mapping target` is judged on a mapping's `MappingSourceDeclaration`, so a
 * mapping whose source its item declares nothing under, which `Variable mapping source` refuses
 * anyway, is not judged for its target. No package is accepted by one and refused by the other. And
 * every rule the host's laws refuse under is a rule the oracle predicts, so a package the oracle
 * refuses for one cause is refused under that cause's rule alone. No row holds the nil uuid, no
 * target a `none` type, and no family member lacks its owner (`#pantry/test/family-owners.ts`).
 */
import type { Addition, Law, LawSide } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as plainIt, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import type { Case } from "@grizzle/testing/explore";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { grammar, ResourceTypeLexical } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawOfCheck } from "#pantry/import/refusal.ts";
import type { NodeMember, PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import { ValueBaseOf, ValueCardinalityOf } from "#pantry/qti/expression-types.ts";
import type {
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
} from "#pantry/qti/declarations.ts";
import type {
  Expression,
  MappingSourceDeclaration,
  Reading,
  ReadingDeclaration,
  TemplateDefaultTarget,
} from "#pantry/qti/expressions.ts";
import type { VariableMapping } from "#pantry/qti/tests.ts";
import { orphansOf } from "#pantry/test/family-owners.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import {
  declaredKinds,
  itemRefPackageEntries,
  itemRefPackageLiteral,
  smallItemRefPackage,
  sourceName,
  swarmedItemRefPackage,
} from "#pantry/test/gen/item-ref-declarations.ts";
import type { ItemRefPackage, Named } from "#pantry/test/gen/item-ref-declarations.ts";
import { judge, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { itemResourceType, linkResourceTypes } from "#pantry/vocab/terms/tests.ts";
import { schemaRuleOfLaw, statedLaws } from "#pantry/test/law-namer.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 35.7 s at a load average of 87 to
 * 98, its slowest test then. The restatement test, which compiles Qti's law model to pair each
 * statement with its laws and so ran past the free project's 60 s, states it too: it ran 86.8 s on
 * 695e408e on 2026-11-08 beside other suites, at a load average sampled at 57 to 65 around the run
 * but not through it. It owes a re-measure through a run at a load average of 60 or more.
 */
const testTimeoutMs = 1_200_000;

/**
 * The oracle's tables over the installed grammar, built once.
 */
const laws = lawsOf(grammar);

/**
 * The lexical forms of a resource's `type` that spell a `ResourceType` handle, each as written
 * (`ResourceTypeLexical`'s), which a resource of an unread type's `type` is none of.
 */
const spelledResourceTypes: ReadonlySet<string> = new Set(
  ResourceTypeLexical.rows.map(({ lexical }) => lexical),
);

/**
 * The nil uuid, which no row of the three relations may hold.
 */
const nil = "00000000-0000-0000-0000-000000000000";

/**
 * The laws this file compares, by the oracle's names.
 */
const comparedLaws: ReadonlySet<LawName> = new Set([
  "Item ref target",
  "Template default target",
  "Template default type",
  "Variable mapping source",
  "Variable mapping target",
]);

/**
 * The session variables a mapping's target may not name (information model §4.5.1), as
 * `VariableMapping`'s check lists them.
 */
const sessionVariables: ReadonlySet<string> = new Set([
  "completionStatus",
  "numAttempts",
  "duration",
]);

/**
 * The resource types of an LTI link, under whose item ref a mapping, and a reading through it, is
 * accepted unchecked (spec reading 110).
 */
const linkTypes: ReadonlySet<string> = new Set(linkResourceTypes);

/**
 * The silent expression bases `Template_default_type` lets through.
 */
const silentBases: ReadonlySet<string> = new Set(["any", "unknown"]);

/**
 * One breach a host law finds: its law's name and the name the element writes.
 */
interface HostBreach {
  readonly law: LawName | "E1 derived";
  readonly name: string;
}

/**
 * A side of a statement this file restates: its relation, then the fields its terms read. A key is
 * its fields as a set, and a containment its two sides' fields paired in order, the pairs a set:
 * a law is the pairs it holds, whatever order its statement writes them in, so the restatement
 * follows the schema when a statement reorders its terms.
 */
type RestatedSide = readonly [relation: string, ...fields: string[]];

/**
 * A statement of the schema this file restates, by the law it states: a check by its name, a key
 * by its side, a containment by its two sides. A side's selection is no part of it: the host reads
 * each statement over the rows its selection admits.
 */
type Restated =
  | { readonly from: RestatedSide; readonly kind: "contained"; readonly to: RestatedSide }
  | { readonly kind: "check"; readonly name: string }
  | { readonly kind: "key"; readonly side: RestatedSide };

/**
 * Read a law side's fields, where each of its terms is a field.
 *
 * @param side - A side of a law the schema states.
 * @returns Its fields in order, none where a term is a `pred` one, which no restated side holds.
 */
const fieldsOf = (side: LawSide): Option.Option<readonly string[]> =>
  Option.all(
    side.terms.map((term) =>
      term.kind === "field" ? Option.some(term.field) : Option.none<string>(),
    ),
  );

/**
 * Whether two lists hold one set of texts, each once.
 *
 * @param left - One list.
 * @param right - The other.
 * @returns Whether they are one set.
 */
const sameSet = (left: readonly string[], right: readonly string[]): boolean => {
  const held = new Set(right);

  return (
    left.length === right.length && held.size === right.length && left.every((at) => held.has(at))
  );
};

/**
 * Pair two sides' fields in order, each pair one text.
 *
 * @param from - The source's fields.
 * @param to - The target's fields.
 * @returns The pairs.
 */
const pairsOf = (from: readonly string[], to: readonly string[]): readonly string[] =>
  Arr.zip(from, to).map(([source, target]) => `${source}\u001F${target}`);

/**
 * Whether a law the schema states is a restated statement's: a check by its name, a key by its
 * relation and its fields as a set, a containment by its two relations and its pairs as a set
 * ({@link RestatedSide}).
 *
 * @param law - The law, as grizzle's `lawsOf` names it.
 * @param restated - The restated statement.
 * @returns Whether it is.
 */
const restates = (law: Law, restated: Restated): boolean => {
  if (restated.kind === "check") {
    return law.kind === "check" && law.name === restated.name;
  }

  if (restated.kind === "key") {
    const [relation, ...fields] = restated.side;

    return (
      law.kind === "key" &&
      law.side.relation === relation &&
      Option.exists(fieldsOf(law.side), (held) => sameSet(held, fields))
    );
  }

  const [fromRelation, ...fromFields] = restated.from;
  const [toRelation, ...toFields] = restated.to;

  return (
    law.kind === "contained" &&
    law.from.relation === fromRelation &&
    law.to.relation === toRelation &&
    Option.exists(Option.all([fieldsOf(law.from), fieldsOf(law.to)]), ([from, to]) =>
      sameSet(pairsOf(from, to), pairsOf(fromFields, toFields)),
    )
  );
};

/**
 * The schema's statements this file restates, each with the law name the host gives its breaches.
 */
const hostLaws: readonly (readonly [Restated, LawName | "E1 derived"])[] = [
  [{ kind: "check", name: "Item_ref_target" }, "Item ref target"],
  [
    { from: ["Attribute", "node"], kind: "contained", to: ["ItemRefHref", "node"] },
    "Item ref target",
  ],
  [
    {
      from: ["ItemRefHref", "package", "path"],
      kind: "contained",
      to: ["UnreadTypeHref", "package", "path"],
    },
    "Item ref target",
  ],
  [
    {
      from: ["ItemRefTarget", "node", "package", "path"],
      kind: "contained",
      to: ["ItemRefDocument", "node", "package", "path"],
    },
    "Item ref target",
  ],
  [
    {
      from: ["ItemRefDocument", "document", "package", "path"],
      kind: "contained",
      to: ["Document", "node", "package", "path"],
    },
    "Item ref target",
  ],
  [
    { from: ["TemplateDefault", "node"], kind: "contained", to: ["TemplateDefaultTarget", "node"] },
    "Template default target",
  ],
  [
    {
      from: ["TemplateDefaultTarget", "itemRef", "itemDocument"],
      kind: "contained",
      to: ["ItemRefDocument", "node", "document"],
    },
    "Template default target",
  ],
  [
    {
      from: [
        "TemplateDefaultTarget",
        "declaration",
        "itemDocument",
        "template",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ],
      kind: "contained",
      to: [
        "DeclarationIdentifier",
        "node",
        "document",
        "identifier",
        "declarationKind",
        "cardinalities",
        "baseTypes",
      ],
    },
    "Template default target",
  ],
  [{ kind: "check", name: "Template_default_target" }, "Template default target"],
  [{ kind: "check", name: "Template_default_type" }, "Template default type"],
  [
    {
      from: ["TemplateDefaultTarget", "node"],
      kind: "contained",
      to: ["TemplateDefaultCardinality", "node"],
    },
    "E1 derived",
  ],
  [
    {
      from: ["TemplateDefaultCardinality", "node", "declaration", "heldCardinality"],
      kind: "contained",
      to: ["TemplateDefaultTarget", "node", "declaration", "heldCardinality"],
    },
    "E1 derived",
  ],
  [
    {
      from: ["TemplateDefaultCardinality", "declaration", "declCardinality"],
      kind: "contained",
      to: ["DeclarationCardinality", "node", "cardinality"],
    },
    "E1 derived",
  ],
  [
    {
      from: ["TemplateDefaultTarget", "node", "heldBase", "heldCardinality"],
      kind: "contained",
      to: ["Expression", "parent", "baseType", "cardinality"],
    },
    "E1 derived",
  ],
  [
    {
      from: ["TemplateDefaultTarget", "node", "itemRef", "template"],
      kind: "contained",
      to: ["TemplateDefault", "node", "itemRef", "template"],
    },
    "E1 derived",
  ],
  [
    {
      from: ["VariableMapping", "node", "parent"],
      kind: "contained",
      to: ["MappingItemRef", "node", "itemRef"],
    },
    "Item ref target",
  ],
  [
    {
      from: ["MappingItemRef", "node", "itemRef"],
      kind: "contained",
      to: ["VariableMapping", "node", "parent"],
    },
    "Item ref target",
  ],
  [
    {
      from: ["MappingItemRefType", "node", "itemRef"],
      kind: "contained",
      to: ["MappingItemRef", "node", "itemRef"],
    },
    "Item ref target",
  ],
  [
    {
      from: ["MappingItemRefType", "itemRef", "type"],
      kind: "contained",
      to: ["ItemRefTarget", "node", "type"],
    },
    "Item ref target",
  ],
  [
    {
      from: ["MappingItemRef", "node"],
      kind: "contained",
      to: ["MappingSourceDeclaration", "node"],
    },
    "Variable mapping source",
  ],
  [
    {
      from: ["MappingItemRefType", "node"],
      kind: "contained",
      to: ["MappingSourceDeclaration", "node"],
    },
    "Variable mapping source",
  ],
  [
    {
      from: ["MappingSourceDeclaration", "itemRef", "itemDocument"],
      kind: "contained",
      to: ["ItemRefDocument", "node", "document"],
    },
    "Variable mapping source",
  ],
  [
    {
      from: [
        "MappingSourceDeclaration",
        "declaration",
        "itemDocument",
        "source",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ],
      kind: "contained",
      to: [
        "DeclarationIdentifier",
        "node",
        "document",
        "identifier",
        "declarationKind",
        "cardinalities",
        "baseTypes",
      ],
    },
    "Variable mapping source",
  ],
  [{ kind: "check", name: "Variable_mapping_source" }, "Variable mapping source"],
  [{ kind: "check", name: "Variable_mapping_target" }, "Variable mapping target"],
  [
    { kind: "key", side: ["MappingSourceDeclaration", "itemRef", "target"] },
    "Variable mapping target",
  ],
  [{ kind: "key", side: ["VariableMapping", "parent", "target"] }, "Variable mapping target"],
  [
    {
      from: ["Reading", "assembly", "node", "attribute", "form", "split", "named"],
      kind: "contained",
      to: ["ReadingDeclaration", "assembly", "node", "attribute", "form", "split", "named"],
    },
    "Variable mapping source",
  ],
  [
    {
      from: [
        "ReadingDeclaration",
        "named",
        "variable",
        "declaration",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ],
      kind: "contained",
      to: [
        "MappingSourceDeclaration",
        "itemRef",
        "target",
        "declaration",
        "declarationKind",
        "declCardinalities",
        "declBaseTypes",
      ],
    },
    "E1 derived",
  ],
];

/**
 * A base type's expression-typing value, as `ValueBaseOf` maps it.
 *
 * @param baseType - The declaration's base type.
 * @returns The value.
 */
const valueBaseOf = (baseType: string): string =>
  ValueBaseOf.rows.find((row) => row.baseType === baseType)?.value ?? "unknown";

/**
 * A cardinality's expression-typing value, as `ValueCardinalityOf` maps it.
 *
 * @param cardinality - The declaration's cardinality.
 * @returns The value.
 */
const valueCardinalityOf = (cardinality: string): string =>
  ValueCardinalityOf.rows.find((row) => row.cardinality === cardinality)?.value ?? "unknown";

/**
 * The import's rows a host law reads, gathered once per package.
 */
interface HostRows {
  readonly baseTypes: ReadonlyMap<string, Addition<typeof DeclarationBaseType>>;
  readonly cardinalities: ReadonlyMap<string, Addition<typeof DeclarationCardinality>>;
  readonly declarations: readonly Addition<typeof DeclarationIdentifier>[];
  readonly documentOf: ReadonlyMap<string, string>;
  readonly expressions: readonly Addition<typeof Expression>[];
  readonly inputs: PackageInputs;
  readonly mappings: readonly Addition<typeof VariableMapping>[];
  readonly sources: readonly Addition<typeof MappingSourceDeclaration>[];
}

/**
 * A breach where a law fails, none where it holds.
 *
 * @param holds - Whether the law holds.
 * @param law - The law's name.
 * @param name - The name its element writes.
 * @returns The breach, or none.
 */
const unless = (holds: boolean, law: HostBreach["law"], name: string): readonly HostBreach[] =>
  holds ? [] : [{ law, name }];

/**
 * Whether a declaration row's declaration is a named declaration of its item under the name it
 * reads, with its kind and counts (`declarationIdentifierRef`).
 *
 * @param rows - The rows.
 * @param row - The declaration row.
 * @param identifier - The name it reads.
 * @returns Whether it is.
 */
const declares = (
  rows: HostRows,
  row: Addition<typeof MappingSourceDeclaration> | Addition<typeof TemplateDefaultTarget>,
  identifier: string,
): boolean =>
  rows.declarations.some(
    (d) =>
      d.node === row.declaration &&
      d.document === row.itemDocument &&
      d.identifier === identifier &&
      d.declarationKind === row.declarationKind &&
      d.baseTypes === row.declBaseTypes &&
      d.cardinalities === row.declCardinalities,
  );

/**
 * Whether a template default's expression fits its template's type (`Template_default_type`): its
 * base type the declaration's `DeclarationBaseType`'s, `unknown` where it has none, a record's;
 * and its cardinality its `TemplateDefaultCardinality`'s, where the declaration has one (spec
 * reading 159).
 *
 * @param rows - The rows.
 * @param target - The template default's target.
 * @returns Whether it fits.
 */
const fitsHeld = (rows: HostRows, target: Addition<typeof TemplateDefaultTarget>): boolean => {
  const typed = rows.baseTypes.get(target.declaration);
  const declaredBase =
    target.declBaseTypes === 1n && typed !== undefined ? valueBaseOf(typed.baseType) : "unknown";
  const cardinality = rows.inputs.TemplateDefaultCardinality.get(target.node);

  return (
    (target.heldBase === declaredBase ||
      silentBases.has(target.heldBase) ||
      declaredBase === "unknown") &&
    (cardinality === undefined ||
      cardinality.heldCardinality === valueCardinalityOf(cardinality.declCardinality) ||
      cardinality.heldCardinality === "unknown")
  );
};

/**
 * Whether a template default's target has its cardinality row exactly where its declaration has a
 * cardinality, copied from the target and the declaration (`E1_derived`, spec reading 159).
 *
 * @param rows - The rows.
 * @param target - The template default's target.
 * @returns Whether it does.
 */
const cardinalityHeld = (
  rows: HostRows,
  target: Addition<typeof TemplateDefaultTarget>,
): boolean => {
  const cardinality = rows.inputs.TemplateDefaultCardinality.get(target.node);

  return cardinality === undefined
    ? target.declCardinalities === 0n
    : cardinality.declaration === target.declaration &&
        cardinality.heldCardinality === target.heldCardinality &&
        rows.cardinalities.get(cardinality.declaration)?.cardinality ===
          cardinality.declCardinality;
};

/**
 * The breaches of one template default's target: its copy, its item and declaration, its kind,
 * its type, and its held type's copy.
 *
 * @param rows - The rows.
 * @param target - The target.
 * @returns The breaches.
 */
const targetBreaches = (
  rows: HostRows,
  target: Addition<typeof TemplateDefaultTarget>,
): readonly HostBreach[] => {
  const name = target.template;
  const referrer = rows.inputs.TemplateDefault.get(target.node);

  return [
    ...unless(
      referrer?.itemRef === target.itemRef && referrer.template === target.template,
      "E1 derived",
      name,
    ),
    ...unless(
      rows.documentOf.get(target.itemRef) === target.itemDocument && declares(rows, target, name),
      "Template default target",
      name,
    ),
    ...unless(
      target.declarationKind === "qti-template-declaration",
      "Template default target",
      name,
    ),
    ...unless(fitsHeld(rows, target), "Template default type", name),
    ...unless(cardinalityHeld(rows, target), "E1 derived", name),
    ...unless(
      rows.expressions.some(
        (e) =>
          e.parent === target.node &&
          e.baseType === target.heldBase &&
          e.cardinality === target.heldCardinality,
      ),
      "E1 derived",
      name,
    ),
  ];
};

/**
 * The breaches of one mapping's source declaration: its copy, its item and declaration, its kind,
 * and the declared half of its target's law, where its item declares its target.
 *
 * @param rows - The rows.
 * @param source - The source declaration.
 * @returns The breaches.
 */
const sourceBreaches = (
  rows: HostRows,
  source: Addition<typeof MappingSourceDeclaration>,
): readonly HostBreach[] => {
  const mapping = rows.inputs.VariableMapping.get(source.node);
  const targetDeclared = rows.declarations.some(
    ({ document, identifier }) => document === source.itemDocument && identifier === source.target,
  );

  return [
    ...unless(
      mapping?.parent === source.itemRef &&
        mapping.source === source.source &&
        mapping.target === source.target,
      "E1 derived",
      source.source,
    ),
    ...unless(
      rows.documentOf.get(source.itemRef) === source.itemDocument &&
        declares(rows, source, source.source),
      "Variable mapping source",
      source.source,
    ),
    ...unless(
      source.declarationKind === "qti-outcome-declaration",
      "Variable mapping source",
      source.source,
    ),
    ...unless(
      !targetDeclared || source.target === source.source,
      "Variable mapping target",
      source.target,
    ),
  ];
};

/**
 * The breaches of the keys over each item ref's targets: `VariableMapping`'s and
 * `MappingSourceDeclaration`'s, each once per name two rows share.
 *
 * @param rows - The rows.
 * @returns The breaches.
 */
const keyBreaches = (rows: HostRows): readonly HostBreach[] =>
  [
    Map.groupBy(rows.mappings, ({ parent, target }) => JSON.stringify([parent, target])),
    Map.groupBy(rows.sources, ({ itemRef, target }) => JSON.stringify([itemRef, target])),
  ].flatMap((groups) =>
    [...groups.values()].flatMap((held) =>
      held.length > 1
        ? [{ law: "Variable mapping target" as const, name: held[0]?.target ?? "" }]
        : [],
    ),
  );

/**
 * The setters, whose prefixed readings resolve nothing (spec reading 112).
 */
const setters: ReadonlySet<string> = new Set([
  "qti-lookup-outcome-value",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
]);

/**
 * Whether a reading resolves (spec readings 48 and 88): it reads a variable a source names, a
 * setter's only unsplit, and, numbered, through an item ref a replacement can repeat, at a number
 * of at least 1.
 *
 * @param reading - The reading.
 * @returns Whether it resolves.
 */
const readingResolves = (reading: Addition<typeof Reading>): boolean =>
  reading.form !== "name" &&
  reading.source !== "none" &&
  (reading.form === "unsplit" || !setters.has(reading.kind)) &&
  (reading.form !== "numbered" ||
    (reading.replaced && /^[0-9]*[1-9][0-9]*$/u.test(reading.number)));

/**
 * The key a reading's declaration row copies of its reading: the reading's key and the item ref it
 * reads through.
 *
 * @param row - The reading or its declaration row.
 * @returns The key's text.
 */
const readingKeyOf = (
  row: Addition<typeof Reading> | Addition<typeof ReadingDeclaration>,
): string =>
  JSON.stringify([row.assembly, row.node, row.attribute, row.form, String(row.split), row.named]);

/**
 * The breaches of each resolving mapped reading's declaration, its mapping's source's, a row of its
 * own: one through a mapping whose source its item declares nothing under has none, which
 * "Variable mapping source" refuses, and a declaration row is its mapping's source's.
 *
 * @param rows - The rows.
 * @returns The breaches.
 */
const readingBreaches = (rows: HostRows): readonly HostBreach[] => {
  const declared = new Set([...rows.inputs.ReadingDeclaration.values()].map(readingKeyOf));

  return [
    ...[...rows.inputs.Reading.values()]
      // A reading through an LTI item ref is `link`, never `mapped` (spec reading 110), so it asks
      // for no declaration.
      .filter((reading) => reading.source === "mapped" && readingResolves(reading))
      .flatMap((reading) => {
        const mapping = rows.mappings.find(
          ({ parent, target }) => parent === reading.named && target === reading.variable,
        );

        return unless(
          declared.has(readingKeyOf(reading)),
          "Variable mapping source",
          mapping?.source ?? reading.variable,
        );
      }),
    ...[...rows.inputs.ReadingDeclaration.values()]
      .filter(({ source }) => source === "mapped")
      .flatMap((declaration) =>
        // A containment holds where any row of its target matches, so two mappings of one target,
        // which the key over (itemRef, target) refuses on its own, leave the reading's copy to either.
        unless(
          rows.sources.some(
            (source) =>
              source.itemRef === declaration.named &&
              source.target === declaration.variable &&
              source.declaration === declaration.declaration &&
              source.declarationKind === declaration.declarationKind &&
              source.declBaseTypes === declaration.declBaseTypes &&
              source.declCardinalities === declaration.declCardinalities,
          ),
          "E1 derived",
          declaration.variable,
        ),
      ),
  ];
};

/**
 * The breaches of the laws over what each item ref names (B2, B3, "Item ref target"): each item ref
 * that writes an href has its href's row, and its target, of the item type or an LTI type, named by
 * a resource of the package, unless a resource of an unread type names its path, where it may have
 * none (decision 454); and each of the item type has its document, whose root is an item, and no
 * other has one. Each is named by the empty name, as the oracle keys the law by its path alone.
 *
 * @param inputs - The import's rows.
 * @returns The breaches.
 */
const itemRefBreaches = (inputs: PackageInputs): readonly HostBreach[] => {
  const law = "Item ref target";
  const targets = [...inputs.ItemRefTarget.values()];
  const documents = [...inputs.ItemRefDocument.values()];
  const itemTypes: ReadonlySet<string> = new Set([itemResourceType, ...linkResourceTypes]);
  // The item refs that write an href, each read through its href's `Reference`, the attribute's
  // copy both ways.
  const hrefs = [...inputs.Reference.values()].filter(
    ({ kind, name }) => kind === "qti-assessment-item-ref" && name === "href",
  );
  // The (path, type) pairs the package's resources name: each resource's href beside its type's
  // code, where it has both.
  const named = [...inputs.ResourceHref.values()].flatMap(({ node, package: held, path }) =>
    Option.toArray(Option.fromUndefinedOr(inputs.ResourceTyped.get(node))).map(({ type }) => ({
      package: held,
      path,
      type,
    })),
  );

  // The hrefs of the package's resources of an unread type (decision 454), as the query
  // `UnreadTypeHref` reads them: a resource's href beside its `type` as written, where that form is
  // nonempty and spells no `ResourceType` handle.
  const nodes = (node: NodeMember): readonly NodeMember[] => [
    node,
    ...node.children.flatMap(nodes),
  ];
  const unreadTypes = new Set(
    [...inputs.Node.values()]
      .flatMap(nodes)
      .filter(
        ({ attributes, kind }) =>
          kind === "cp:resource" &&
          attributes.some(
            ({ lexical, name }) =>
              name === "type" && lexical !== "" && !spelledResourceTypes.has(lexical),
          ),
      )
      .map(({ id }) => id),
  );
  const unreadPaths = [...inputs.ResourceHref.values()].filter(({ node }) => unreadTypes.has(node));

  return [
    ...hrefs.flatMap(({ node }) => unless(inputs.ItemRefHref.has(node), law, "")),
    ...[...inputs.ItemRefHref.values()].flatMap((href) =>
      unless(
        inputs.ItemRefTarget.has(href.node) ||
          unreadPaths.some(
            ({ package: held, path }) => held === href.package && path === href.path,
          ),
        law,
        "",
      ),
    ),
    ...targets.flatMap((target) => [
      ...unless(itemTypes.has(target.type), law, ""),
      ...unless(
        named.some(
          ({ package: held, path, type }) =>
            held === target.package && path === target.path && type === target.type,
        ),
        law,
        "",
      ),
      ...unless(
        target.type !== itemResourceType ||
          documents.some(
            ({ node, package: held, path }) =>
              node === target.node && held === target.package && path === target.path,
          ),
        law,
        "",
      ),
    ]),
    ...documents.flatMap((document) => [
      ...unless(inputs.ItemRefTarget.get(document.node)?.type === itemResourceType, law, ""),
      ...unless(
        [...inputs.Document.values()].some(
          ({ node, package: held, path, rootKind }) =>
            node === document.document &&
            held === document.package &&
            path === document.path &&
            rootKind === "qti-assessment-item",
        ),
        law,
        "",
      ),
    ]),
  ];
};

/**
 * Judge the import's rows by the schema's laws over an item ref's declarations, restated on the
 * host, each breach named by its law and the name its element writes.
 *
 * @param inputs - The import's rows.
 * @returns The breaches.
 */
const hostBreaches = (inputs: PackageInputs): readonly HostBreach[] => {
  const rows: HostRows = {
    baseTypes: inputs.DeclarationBaseType,
    cardinalities: inputs.DeclarationCardinality,
    declarations: [...inputs.DeclarationIdentifier.values()],
    documentOf: new Map(
      [...inputs.ItemRefDocument.values()].map(({ document, node }) => [node, document]),
    ),
    expressions: [...inputs.Expression.values()].filter(
      ({ parentKind }) => parentKind === "qti-template-default",
    ),
    inputs,
    mappings: [...inputs.VariableMapping.values()],
    sources: [...inputs.MappingSourceDeclaration.values()],
  };

  return [
    ...[...inputs.TemplateDefault.values()].flatMap((templateDefault) =>
      unless(
        inputs.TemplateDefaultTarget.has(templateDefault.node),
        "Template default target",
        templateDefault.template,
      ),
    ),
    ...[...inputs.TemplateDefaultTarget.values()].flatMap((target) => targetBreaches(rows, target)),
    // A mapping's item ref and what that names hang on the item ref's target, so they are refused
    // with it under "Item ref target", by the empty name the oracle keys that law by: each mapping
    // has its item ref, and a type row only where the item ref has a target, its type copied.
    ...rows.mappings.flatMap((mapping) => {
      const itemRef = inputs.MappingItemRef.get(mapping.node);
      const typed = inputs.MappingItemRefType.get(mapping.node);
      const target = inputs.ItemRefTarget.get(mapping.parent);

      return unless(
        itemRef?.itemRef === mapping.parent &&
          (typed === undefined ||
            (typed.itemRef === mapping.parent && typed.type === target?.type)),
        "Item ref target",
        "",
      );
    }),
    ...rows.mappings.flatMap((mapping) => [
      ...unless(
        linkTypes.has(inputs.MappingItemRefType.get(mapping.node)?.type ?? "") ||
          inputs.MappingSourceDeclaration.has(mapping.node),
        "Variable mapping source",
        mapping.source,
      ),
      ...unless(!sessionVariables.has(mapping.target), "Variable mapping target", mapping.target),
    ]),
    ...rows.sources.flatMap((source) => sourceBreaches(rows, source)),
    ...keyBreaches(rows),
    ...readingBreaches(rows),
    ...itemRefBreaches(inputs),
  ];
};

/**
 * The names an oracle breach of a compared law writes: a template default's template, a mapping's
 * source, or a mapping's target.
 *
 * @param keys - The breach's keys.
 * @returns The name.
 */
const breachName = (keys: Readonly<Record<string, string>>): string =>
  keys["template"] ?? keys["source"] ?? keys["target"] ?? "";

/**
 * The breaches the schema leaves to another law on purpose: the declared half of `Variable mapping
 * target` over a mapping whose source its item declares nothing under, judged on the mapping's
 * `MappingSourceDeclaration`, which such a mapping has none of.
 *
 * @param input - The package.
 * @returns Each such breach's text.
 */
const residualOf = (input: ItemRefPackage): ReadonlySet<string> =>
  new Set(
    input.target === "item"
      ? input.mappings.flatMap((mapping) =>
          mapping.source === "U" && mapping.target === "X" ? ["Variable mapping target X"] : [],
        )
      : [],
  );

/**
 * Whether the item declares a name under a kind other than the one its element needs.
 *
 * @param name - The name.
 * @param wanted - The kind its element needs.
 * @returns Whether it does.
 */
const wrongKind = (name: Named, wanted: string): boolean => {
  const kind = declaredKinds[name];

  return kind !== undefined && kind !== wanted;
};

/**
 * A situation a search must reach.
 */
type Situation =
  | "accepted"
  | "lti link"
  | "missing file"
  | "other type"
  | "stray file"
  | "read through a mapping"
  | "refused for one cause"
  | "refused"
  | "undeclared"
  | "unlisted path"
  | "wrong kind";

/**
 * Name the situations one package reaches.
 *
 * @param input - The package.
 * @param rules - The rules the oracle refuses it under.
 * @returns Its situations.
 */
const situationsOf = (input: ItemRefPackage, rules: ReadonlySet<string>): readonly Situation[] => {
  const names: readonly Named[] = [
    ...input.defaults.map(({ template }) => template),
    ...input.mappings.map(({ source }) => source),
  ];

  return [
    ...(input.target === "lti" ? ["lti link" as const] : []),
    ...(input.target === "missing" ? ["missing file" as const] : []),
    ...(input.target === "unlisted" ? ["unlisted path" as const] : []),
    ...(input.target === "other" ? ["other type" as const] : []),
    ...(input.target === "stray" ? ["stray file" as const] : []),
    ...(names.includes("U") ? ["undeclared" as const] : []),
    ...(input.defaults.some(({ template }) => wrongKind(template, "qti-template-declaration")) ||
    input.mappings.some(({ source }) => wrongKind(source, "qti-outcome-declaration"))
      ? ["wrong kind" as const]
      : []),
    ...(input.mappings.some(({ read }) => read) ? ["read through a mapping" as const] : []),
    ...(rules.size === 0 ? ["accepted" as const] : ["refused" as const]),
    ...(rules.size === 1 ? ["refused for one cause" as const] : []),
  ];
};

/**
 * Whether the item ref's item declares a name, under any kind: where it does, the element that
 * names it has its declaration row, so the row's CHECKs judge a wrong kind.
 *
 * @param input - The package.
 * @param name - The name.
 * @returns Whether it does.
 */
const resolves = (input: ItemRefPackage, name: Named): boolean =>
  input.target === "item" && declaredKinds[name] !== undefined;

/**
 * Hold the import's rows to the ruling: no row of the three relations holds the nil uuid or stands
 * for an unwritten attribute, and each declaration row exists exactly where the item declares its
 * name.
 *
 * @param input - The package.
 * @param inputs - The import's rows.
 * @param literal - The package's literal, for the messages.
 */
const assertNoSentinel = (input: ItemRefPackage, inputs: PackageInputs, literal: string): void => {
  const nilFields = [
    ...[...inputs.TemplateDefaultTarget.values()].flatMap((row) => Object.values(row)),
    ...[...inputs.MappingSourceDeclaration.values()].flatMap((row) => Object.values(row)),
    ...[...inputs.TemplateDefault.values()].flatMap((row) => Object.values(row)),
  ].filter((value) => value === nil);

  assert.deepStrictEqual(nilFields, [], `${literal}: a row holds the nil uuid`);
  assert.deepStrictEqual(
    [...inputs.ItemRefDocument.values()]
      .flatMap((row) => Object.values(row))
      .filter((value) => value === nil),
    [],
    `${literal}: an item ref's item holds the nil uuid`,
  );
  assert.isFalse(
    [...inputs.MappingItemRef.values(), ...inputs.MappingItemRefType.values()].some((row) =>
      Object.values<unknown>(row).includes("none"),
    ),
    `${literal}: a mapping's item ref names a resource the package lacks`,
  );
  assert.deepStrictEqual(orphansOf(inputs), [], `${literal}: a family member has no owner`);
  assert.isFalse(
    [...inputs.TemplateDefault.values()].some(({ lexical }) => lexical === ""),
    `${literal}: a template default's row stands for an unwritten template-identifier`,
  );
  assert.deepStrictEqual(
    [...inputs.TemplateDefaultTarget.values()].map(({ template }) => template).toSorted(),
    input.defaults
      .filter(({ template }) => resolves(input, template))
      .map(({ template }) => template)
      .toSorted(),
    `${literal}: a template default's target row exists exactly where its item declares its template, of any kind, so its CHECKs judge a wrong kind`,
  );
  assert.deepStrictEqual(
    [...inputs.MappingSourceDeclaration.values()].map(({ source }) => source).toSorted(),
    input.mappings
      .filter(({ source }) => resolves(input, source))
      .map(({ source }) => sourceName(source))
      .toSorted(),
    `${literal}: a mapping's source row exists exactly where its item declares its source, of any kind, so its CHECK judges a wrong kind`,
  );
};

/**
 * Judge one package both ways, and its rows for sentinels.
 *
 * @param input - The package.
 * @param c - The search's case.
 * @returns Nothing; fails the case on a disagreement.
 */
const judged = (input: ItemRefPackage, c: Case<Situation>) =>
  Effect.gen(function* judgeBoth() {
    const literal = itemRefPackageLiteral(input);
    const dir = yield* scopedPackage(itemRefPackageEntries(input));
    const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
    const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
    const rules = new Set(breaches.map(({ law }) => ruleOf(law)));
    const { inputs } = yield* readProgram(dir);
    const host = hostBreaches(inputs);
    const residual = residualOf(input);
    const hosted = new Set(host.map(({ law, name }) => `${law} ${name}`));
    const predicted = new Set(
      breaches
        .filter(({ law }) => comparedLaws.has(law))
        .map(({ keys, law }) => `${law} ${breachName(keys)}`),
    );

    c.noteAll(situationsOf(input, rules));
    assert.strictEqual(judgment._tag, "Judged", `${literal}: the codec refuses it`);
    assert.deepStrictEqual(
      host.filter(({ law }) => law === "E1 derived"),
      [],
      `${literal}: a copy or a lookup the import writes breaks its own law`,
    );
    // The host names every breach the oracle names, but the residual, which another of the
    // mapping's breaches stands for; and none the oracle does not name.
    assert.deepStrictEqual(
      [...hosted].toSorted(),
      [...predicted].filter((text) => hosted.has(text) || !residual.has(text)).toSorted(),
      `${literal}: the schema's laws over the import's rows and the oracle name different breaches`,
    );
    for (const { law } of host) {
      if (law !== "E1 derived") {
        assert.isTrue(
          rules.has(ruleOf(law)),
          `${literal}: the rows are refused under ${ruleOf(law)}, which the oracle does not predict (${[...rules].join(", ")})`,
        );
      }
    }

    assertNoSentinel(input, inputs, literal);
  }).pipe(Effect.scoped);

describe("an item ref's declarations: the schema's restatement", { timeout: testTimeoutMs }, () => {
  plainIt("names each restated law as refusal.ts names the schema's statement of it", () => {
    // Oracle: `refusal.ts`'s naming of the laws the schema states (`schemaRuleOfLaw`), against the rule
    // each host law's name keeps (`ruleOf`). A check is named by its name; any other restated
    // statement is each law of `statedLaws` it reads as. Bound: every law the host restates.
    for (const [restated, name] of hostLaws) {
      const expected = name === "E1 derived" ? "derived" : ruleOf(name);
      const rules =
        restated.kind === "check"
          ? [Option.map(lawOfCheck(restated.name), (law) => lawTable[law].rule)]
          : statedLaws().flatMap(([law]) =>
              restates(law, restated) ? [schemaRuleOfLaw(law)] : [],
            );

      assert.isNotEmpty(rules, `${Formatter.format(restated)}: no law the schema states`);
      for (const rule of rules) {
        assert.deepStrictEqual(rule, Option.some(expected), Formatter.format(restated));
      }
    }
  });
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "an item ref's declarations: the import's rows against the law oracle",
  (it) => {
    it.effect(
      "every package of the small box gets the oracle's breaches from its import rows, and no row holds a sentinel",
      (ctx) =>
        // Oracle: the law oracle's four laws over the package as written, against the schema's
        // laws restated over the import's rows. Bound: each of six item ref targets with no
        // element, one template default of each of eight shapes, or one mapping of each of 32:
        // 246 packages.
        searched(
          ctx,
          exhaust(
            {
              box: "6 item ref targets × (no element + 8 template defaults + 32 mappings)",
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<Situation>([
                "accepted",
                "lti link",
                "missing file",
                "other type",
                "stray file",
                "read through a mapping",
                "refused",
                "refused for one cause",
                "undeclared",
                "unlisted path",
                "wrong kind",
              ]),
              generator: smallItemRefPackage,
              limit: 300,
              literal: itemRefPackageLiteral,
              oracle: { kind: "second-implementation", name: "the law oracle's item ref laws" },
              suite: "pantry/test/item-ref-declarations-box",
            },
            judged,
          ),
        ),
      { timeout: testTimeoutMs },
    );

    it.effect(
      "every sampled package, drawn by its own swarm, gets the oracle's breaches from its import rows",
      (ctx) =>
        // Oracle: as the box's. Bound: up to three template defaults and three mappings, each
        // case under its own swarm of eleven features; 200 runs.
        searched(
          ctx,
          explore(
            {
              caseHang: Duration.seconds(30),
              concurrency: 1,
              coverage: required<Situation>(
                ["accepted", "refused", "read through a mapping", "undeclared", "wrong kind"],
                { cases: 60, sense: notesOnly },
              ),
              draw: drawn(swarmedItemRefPackage),
              kept: [],
              literal: ({ input }) => itemRefPackageLiteral(input),
              oracle: { kind: "second-implementation", name: "the law oracle's item ref laws" },
              runs: 200,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/test/item-ref-declarations-swarm",
            },
            ({ input }, c) => judged(input, c),
          ),
        ),
      { timeout: testTimeoutMs },
    );
  },
);
