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
 *   it is accepted unchecked (reading 110, its `MappingItemRef`), their containments into
 *   `ItemRefDocument` and `Declaration`, their CHECKs, a mapped reading's declaration (its
 *   mapping's source's), `MappingLookup`'s forced and justified rows, `VariableMapping`'s key and
 *   session check, and what each item ref names: its `ItemRefTarget` and `ItemRefDocument`, each a
 *   row only where the package holds it, and the assembly's names' copies of them. Each law carries
 *   the name `src/import/refusal.ts` gives the schema's statement of it ({@link hostLaws}, held to
 *   `lawRules` by the first test).
 *
 * The two must name the same breaches, but one residual the schema states on purpose: the declared
 * half of `Variable mapping target` is judged on a mapping's `MappingSourceDeclaration`, so a
 * mapping whose source its item declares nothing under, which `Variable mapping source` refuses
 * anyway, is not judged for its target. No package is accepted by one and refused by the other. And
 * every rule the host's laws refuse under is a rule the oracle predicts, so a package the oracle
 * refuses for one cause is refused under that cause's rule alone. No row holds the nil uuid, no
 * target a `none` type, and no family member lacks its owner (`#pantry/test/family-owners.ts`).
 */
import type { Addition } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as plainIt, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import type { Case } from "@grizzle/testing/explore";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawRules } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import { itemRefKind, itemResourceType, linkResourceTypes } from "#pantry/qti/tests.ts";
import { ValueBaseOf, ValueCardinalityOf } from "#pantry/qti/expression-types.ts";
import type { Declaration } from "#pantry/qti/declarations.ts";
import type {
  Expression,
  MappingSourceDeclaration,
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
  targetName,
} from "#pantry/test/gen/item-ref-declarations.ts";
import type { ItemRefPackage, Named } from "#pantry/test/gen/item-ref-declarations.ts";
import { judge, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 35.7 s at a load average of 87 to
 * 98, its slowest test.
 */
const testTimeoutMs = 1_200_000;

/**
 * The oracle's tables over the installed grammar, built once.
 */
const laws = lawsOf(grammar);

/**
 * The nil uuid, which no row of the four relations may hold.
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
 * The schema's statements this file restates, each by its identity as `refusal.ts` keys
 * `lawRules`, with the law name the host gives its breaches.
 */
const hostLaws: readonly (readonly [string, LawName | "E1 derived"])[] = [
  ["check Item_ref_target", "Item ref target"],
  ["contained Node(id) in ItemRefTarget(node)", "Item ref target"],
  [
    "contained ItemRefTarget(node, package, path) in ItemRefDocument(node, package, path)",
    "Item ref target",
  ],
  [
    "contained ItemRefDocument(document, package, path) in Document(node, package, path)",
    "Item ref target",
  ],
  ["contained NameLookup(node, resourceType) in ItemRefTarget(node, type)", "Item ref target"],
  [
    "contained NameLookup(node, itemDocument) in ItemRefDocument(node, document)",
    "Item ref target",
  ],
  ["contained TemplateDefault(node) in TemplateDefaultTarget(node)", "Template default target"],
  [
    "contained TemplateDefaultTarget(itemRef, itemDocument) in ItemRefDocument(node, document)",
    "Template default target",
  ],
  [
    "contained TemplateDefaultTarget(declaration, itemDocument, template, declarationKind, declBaseType, declCardinality) in Declaration(node, document, identifier, declarationKind, baseType, cardinality)",
    "Template default target",
  ],
  ["check Template_default_target", "Template default target"],
  ["check Template_default_type", "Template default type"],
  [
    "contained TemplateDefaultTarget(node, heldBase, heldCardinality) in Expression(parent, baseType, cardinality)",
    "E1 derived",
  ],
  [
    "contained TemplateDefaultTarget(node, itemRef, template) in TemplateDefault(node, itemRef, template)",
    "E1 derived",
  ],
  ["contained MappingItemRef(node) in MappingSourceDeclaration(node)", "Variable mapping source"],
  ["contained VariableMapping(node, parent) in MappingItemRef(node, itemRef)", "Item ref target"],
  ["contained MappingItemRef(node, itemRef) in VariableMapping(node, parent)", "Item ref target"],
  ["contained MappingItemRef(itemRef, type) in ItemRefTarget(node, type)", "Item ref target"],
  [
    "contained MappingSourceDeclaration(itemRef, itemDocument) in ItemRefDocument(node, document)",
    "Variable mapping source",
  ],
  [
    "contained MappingSourceDeclaration(declaration, itemDocument, source, declarationKind, declBaseType, declCardinality) in Declaration(node, document, identifier, declarationKind, baseType, cardinality)",
    "Variable mapping source",
  ],
  ["check Variable_mapping_source", "Variable mapping source"],
  ["check Variable_mapping_target", "Variable mapping target"],
  ["key MappingSourceDeclaration(itemRef, target)", "Variable mapping target"],
  ["key VariableMapping(parent, target)", "Variable mapping target"],
  [
    "contained Reading(named, variable, declaration, declarationKind, declBaseType, declCardinality) in MappingSourceDeclaration(itemRef, target, declaration, declarationKind, declBaseType, declCardinality)",
    "Variable mapping source",
  ],
  [
    "contained MappingSourceDeclaration(itemDocument, target, targetDeclared) in VariableLookup(document, name, declared)",
    "E1 derived",
  ],
  ["contained VariableMapping(parent, target) in MappingLookup(itemRef, name)", "E1 derived"],
  ["contained MappingLookup(itemRef, name) in VariableMapping(parent, target)", "E1 derived"],
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
  readonly declarations: readonly Addition<typeof Declaration>[];
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
 * Whether a declaration row's declaration is a `Declaration` of its item under the name it reads
 * (`declarationRef`).
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
      d.baseType === row.declBaseType &&
      d.cardinality === row.declCardinality,
  );

/**
 * Whether a template default's expression fits its template's type (`Template_default_type`).
 *
 * @param target - The template default's target.
 * @returns Whether it fits.
 */
const fitsHeld = (target: Addition<typeof TemplateDefaultTarget>): boolean => {
  const declaredBase = valueBaseOf(target.declBaseType);

  return (
    (target.heldBase === declaredBase ||
      silentBases.has(target.heldBase) ||
      declaredBase === "unknown") &&
    (target.heldCardinality === valueCardinalityOf(target.declCardinality) ||
      target.heldCardinality === "unknown")
  );
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
    ...unless(fitsHeld(target), "Template default type", name),
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
 * its target's lookup, and the declared half of its target's law.
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
  const lookup = [...rows.inputs.VariableLookup.values()].find(
    ({ document, name }) => document === source.itemDocument && name === source.target,
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
    ...unless(lookup?.declared === source.targetDeclared, "E1 derived", source.target),
    ...unless(
      !source.targetDeclared || source.target === source.source,
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
 * The breaches of each mapped reading's declaration, its mapping's source's.
 *
 * @param rows - The rows.
 * @returns The breaches.
 */
const readingBreaches = (rows: HostRows): readonly HostBreach[] =>
  [...rows.inputs.Reading.values()]
    .filter(
      ({ form, found, namedKind, resourceType, source }) =>
        source === "mapped" &&
        !(
          (form === "split" || form === "numbered") &&
          found &&
          namedKind === itemRefKind &&
          linkTypes.has(resourceType)
        ),
    )
    .flatMap((reading) => {
      // A containment holds where any row of its target matches, so two mappings of one target,
      // which the key over (itemRef, target) refuses on its own, leave the reading's copy to either.
      const held = rows.sources.some(
        (source) =>
          source.itemRef === reading.named &&
          source.target === reading.variable &&
          source.declaration === reading.declaration &&
          source.declarationKind === reading.declarationKind &&
          source.declBaseType === reading.declBaseType &&
          source.declCardinality === reading.declCardinality,
      );
      const mapping = rows.mappings.find(
        ({ parent, target }) => parent === reading.named && target === reading.variable,
      );

      return unless(held, "Variable mapping source", mapping?.source ?? reading.variable);
    });

/**
 * The breaches of `MappingLookup`'s forced and justified rows: each mapping's target mapped, and
 * each mapped name a mapping's.
 *
 * @param rows - The rows.
 * @returns The breaches.
 */
const lookupBreaches = (rows: HostRows): readonly HostBreach[] => {
  const lookups = [...rows.inputs.MappingLookup.values()];

  return [
    ...rows.mappings.flatMap((mapping) =>
      unless(
        lookups.some((l) => l.itemRef === mapping.parent && l.name === mapping.target && l.mapped),
        "E1 derived",
        mapping.target,
      ),
    ),
    ...lookups
      .filter(({ mapped }) => mapped)
      .flatMap((lookup) =>
        unless(
          rows.mappings.some(
            ({ parent, target }) => parent === lookup.itemRef && target === lookup.name,
          ),
          "E1 derived",
          lookup.name,
        ),
      ),
  ];
};

/**
 * The breaches of the laws over what each item ref names (B2, B3, "Item ref target"): each item
 * ref has its target, of the item type or an LTI type, named by a resource of the package; each of
 * the item type has its document, whose root is an item, and no other has one; and each found
 * item ref of the assembly's names reads its type and its item from them. Each is named by the
 * empty name, as the oracle keys the law by its path alone.
 *
 * @param inputs - The import's rows.
 * @returns The breaches.
 */
const itemRefBreaches = (inputs: PackageInputs): readonly HostBreach[] => {
  const law = "Item ref target";
  const targets = [...inputs.ItemRefTarget.values()];
  const documents = [...inputs.ItemRefDocument.values()];
  const itemTypes: ReadonlySet<string> = new Set([itemResourceType, ...linkResourceTypes]);
  const itemRefs = [...inputs.Named.values()].filter(
    ({ kind }) => kind === "qti-assessment-item-ref",
  );
  const found = [...inputs.NameLookup.values()].filter(
    ({ found: held, kind }) => held && kind === "qti-assessment-item-ref",
  );

  return [
    ...itemRefs.flatMap(({ node }) => unless(inputs.ItemRefTarget.has(node), law, "")),
    ...targets.flatMap((target) => [
      ...unless(itemTypes.has(target.type), law, ""),
      ...unless(
        [...inputs.NamedHref.values()].some(
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
    ...found.flatMap((name) => [
      ...unless(inputs.ItemRefTarget.get(name.node)?.type === name.resourceType, law, ""),
      ...unless(
        name.resourceType !== itemResourceType ||
          inputs.ItemRefDocument.get(name.node)?.document === name.itemDocument,
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
    declarations: [...inputs.Declaration.values()],
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
    // with it under "Item ref target", by the empty name the oracle keys that law by.
    ...rows.mappings.flatMap((mapping) => {
      const itemRef = inputs.MappingItemRef.get(mapping.node);
      const target = inputs.ItemRefTarget.get(mapping.parent);

      return unless(
        itemRef?.itemRef === mapping.parent && target !== undefined && itemRef.type === target.type,
        "Item ref target",
        "",
      );
    }),
    ...rows.mappings.flatMap((mapping) => [
      ...unless(
        linkTypes.has(inputs.MappingItemRef.get(mapping.node)?.type ?? "none") ||
          inputs.MappingSourceDeclaration.has(mapping.node),
        "Variable mapping source",
        mapping.source,
      ),
      ...unless(!sessionVariables.has(mapping.target), "Variable mapping target", mapping.target),
    ]),
    ...rows.sources.flatMap((source) => sourceBreaches(rows, source)),
    ...keyBreaches(rows),
    ...readingBreaches(rows),
    ...lookupBreaches(rows),
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
 * Hold the import's rows to the ruling: no row of the four relations holds the nil uuid or stands
 * for an unwritten attribute, each declaration row exists exactly where the item declares its
 * name, and each mapping is forced into its item ref's lookups.
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
    ...[...inputs.MappingLookup.values()].flatMap((row) => Object.values(row)),
  ].filter((value) => value === nil);

  assert.deepStrictEqual(nilFields, [], `${literal}: a row holds the nil uuid`);
  assert.deepStrictEqual(
    [
      ...[...inputs.ItemRefDocument.values()].flatMap((row) => Object.values(row)),
      ...[...inputs.NameLookup.values()].flatMap((row) => Object.values(row)),
    ].filter((value) => value === nil),
    [],
    `${literal}: an item ref's item or an assembly's name holds the nil uuid`,
  );
  assert.isFalse(
    [...inputs.ItemRefTarget.values()].some(({ type }) => type === "none"),
    `${literal}: an item ref's target stands for a resource the package lacks`,
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
  for (const spec of input.mappings) {
    assert.isTrue(
      [...inputs.MappingLookup.values()].some(
        ({ mapped, name }) => mapped && name === targetName(spec),
      ),
      `${literal}: the mapping of ${sourceName(spec.source)} is not forced into the lookups`,
    );
  }
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

describe("an item ref's declarations: the schema's restatement", () => {
  plainIt("names each restated law as refusal.ts names the schema's statement of it", () => {
    // Oracle: `lawRules`, the one table from a law grizzle reports to its rule, against the rule
    // each host law's name keeps (`ruleOf`). Bound: every law the host restates.
    for (const [identity, name] of hostLaws) {
      assert.strictEqual(
        lawRules.get(identity),
        name === "E1 derived" ? "derived" : ruleOf(name),
        identity,
      );
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
