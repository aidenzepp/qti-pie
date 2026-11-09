import {
  accumulated,
  Bits,
  bits,
  check,
  closed,
  closedId,
  Compute,
  constraintNameOf,
  contained,
  counted,
  drawn,
  fin,
  fold,
  generated,
  key,
  lawsByStatement,
  lexical,
  Monoid,
  mirrors,
  natural,
  on,
  ordered,
  pg,
  pred,
  relation,
  sameLaw,
  schema,
  select,
  str,
  tree,
  uuid,
} from "@bjornpagen/grizzle";
import type { Law, LawSide, RegexText } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, pipe, Result, Schema } from "effect";
import { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import { composed } from "#pantry/grammar/compose.ts";
import {
  checkNameOf,
  contractNames,
  explain,
  generatedNames,
  ImportRefused,
  ImportRule,
  keyNames,
  lawNameOf,
  limitRules,
  owedRules,
  patternNameIn,
  patternTypeOf,
  refusalOf,
  ruleOfError,
  ruleOfLaw,
  rulesOf,
  schemaLawsOf,
  statedLaws,
  textLaws,
} from "#pantry/import/refusal.ts";
import { readerOrigin } from "#pantry/package/refusal-origin.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { lawTable, precedence } from "#pantry/vocab/laws.ts";
import { beginsWith, mergedAxes } from "#pantry/test/merged-axes.ts";
import type { Axis } from "#pantry/test/merged-axes.ts";
import type { LawName, ReadRefusal, Rule } from "#pantry/import/refusal.ts";
import {
  NotQti3,
  notQti3Reasons,
  UnmodeledVocabulary,
  unmodeledReasons,
} from "#pantry/model/shred.ts";
import { PackageReadError } from "#pantry/package/read.ts";
import { ZipRefusal } from "#pantry/package/zip.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 29.2 s at a load average of 70 to
 * 74, its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The composed grammar of production, whose rows `install.ts` installs: the constants an
 * explanation reads.
 */
const grammar = Result.getOrThrow(composed());

/**
 * A scratch schema, in the shapes `node.ts` and `attributes.ts` state, built with grizzle's own
 * constructors: a tree with its parent copy, predecessor copy, last slot, `Follow` step and two
 * count folds, an ordered family with its owner copy and `or` fold, and a counted family whose
 * owner copy rides its owner axis; its laws as grizzle's `lawsOf` lists them, and the law
 * of each statement an axis carries, by the statement's name.
 *
 * `grizzle generate` compiled this schema at 4016b69, with no database, and its foreign keys carry
 * exactly: the tree's owner axis (parent, ‹n›, document, parentKind, parentNearest, ‹ps›, version);
 * its predecessor axis (pred(at), elementsWas, start, was, the hidden count fold's before); its
 * last axis (pred(children), elementChildren, end, lastState, countedChildren); the attribute
 * family's owner axis (‹n›, document, kind), predecessor axis (pred(at), attrsWas) and last axis
 * (pred(attributes), attrs); and the counted family's owner axis (‹n›, the containment into
 * `Binding.node`).
 */
const scratch = (() => {
  const Kind = closed("Kind", ["document", "e", "text"]);
  const Version = closed("Version", ["v"]);
  const Pos = closed("Pos", ["0", "1", "2"]);
  const Slot = closed("Slot", ["0", "1"]);
  const Name = closed("Name", ["x", "data-*"]);
  const Follow = closed.relation(
    "Follow",
    { from: closedId(Pos), parent: closedId(Kind), to: closedId(Pos), version: closedId(Version) },
    ["version", "parent", "from", "to"],
    [{ from: "0", parent: "document", to: "1", version: "v" }],
  );
  const nil = "00000000-0000-0000-0000-000000000000";
  const Node = relation(
    "Node",
    {
      at: drawn(natural),
      attributes: drawn(natural),
      attrs: accumulated(bits(Slot), Bits.of(Slot, [])),
      children: drawn(natural),
      countedChildren: accumulated(natural, 0n),
      document: uuid,
      elementChildren: accumulated(natural, 0n),
      elements: accumulated(natural, 0n),
      elementsWas: accumulated(natural, 0n),
      end: drawn(natural),
      id: uuid,
      kind: closedId(Kind),
      lastState: accumulated(closedId(Pos), "0"),
      nearest: uuid,
      parent: uuid,
      parentKind: accumulated(closedId(Kind), "document"),
      parentNearest: accumulated(uuid, nil),
      start: drawn(natural),
      state: closedId(Pos),
      version: closedId(Version),
      was: accumulated(closedId(Pos), "0"),
    },
    ["id"],
  );
  const Attribute = relation(
    "Attribute",
    {
      at: drawn(natural),
      attrsAfter: accumulated(bits(Slot), Bits.of(Slot, [])),
      attrsWas: accumulated(bits(Slot), Bits.of(Slot, [])),
      document: accumulated(uuid, nil),
      kind: accumulated(closedId(Kind), "document"),
      name: closedId(Name),
      node: uuid,
      slot: bits(Slot),
    },
    ["node", "at"],
  );
  const Binding = relation("Binding", { choices: drawn(natural), node: uuid }, ["node"]);
  const Choice = relation(
    "Choice",
    { identifier: str.regex("^[a-z]{1,8}$"), interaction: uuid, node: uuid },
    ["node"],
  );
  const members = select(Node, (n) => n.gt(n.start, 0n));
  const nodeTree = tree(on(Node, "parent", "at"), fin(Node, "children"), { root: "document" });
  const attributeFamily = ordered(on(Attribute, "node", "at"), fin(Node, "attributes"));
  const choiceFamily = counted(on(Choice, "interaction"), fin(Binding, "choices"));
  const parentCopy = contained(
    on(members, "parent", "version", "parentKind", "parentNearest"),
    on(Node, "id", "version", "kind", "nearest"),
  );
  const followStep = contained(
    on(members, "version", "parentKind", "was", "state"),
    on(Follow, "version", "parent", "from", "to"),
  );
  const predecessorCopy = contained(
    on(members, "parent", pred("at"), "was"),
    on(members, "parent", "at", "state"),
  );
  const lastSlot = contained(
    on(Node, "id", pred("children"), "lastState"),
    on(members, "parent", "at", "state"),
  );
  const elementCount = fold(
    nodeTree,
    Monoid.count,
    on(members, "parent", "elementsWas", "elements"),
    on(Node, "id", "elementChildren"),
  );
  const countedCount = fold(
    nodeTree,
    Monoid.count,
    on(
      select(Node, (n) => n.and(n.gt(n.start, 0n), n.eq(n.state, "2"))),
      "parent",
    ),
    on(Node, "id", "countedChildren"),
  );
  const attributeOwner = contained(
    on(Attribute, "node", "kind", "document"),
    on(Node, "id", "kind", "document"),
  );
  const attrsFold = fold(
    attributeFamily,
    Monoid.or,
    on(
      select(Attribute, (a) => Compute.not(Compute.in(a.name, ["data-*"]))),
      "node",
      "slot",
      "attrsWas",
      "attrsAfter",
    ),
    on(Node, "id", "attrs"),
  );
  const choiceOwner = contained(on(Choice, "interaction"), on(Binding, "node"));
  const relations = { Attribute, Binding, Choice, Follow, Kind, Name, Node, Pos, Slot, Version };
  const built = schema("Scratch", relations, [
    nodeTree,
    parentCopy,
    followStep,
    predecessorCopy,
    lastSlot,
    elementCount,
    countedCount,
    check("N1_sentinel", Node, (n) => n.or(n.gt(n.start, 0n), n.eq(n.state, "0"))),
    attributeFamily,
    attributeOwner,
    attrsFold,
    choiceFamily,
    choiceOwner,
    mirrors(on(Choice, "node"), on(Node, "id")),
    key(on(Choice, "interaction", "identifier")),
  ]);
  const lawsOfStatement = lawsByStatement(built);
  const lawOf = (statement: (typeof built.statements)[number]): Law =>
    pipe(
      Arr.head(lawsOfStatement(statement)),
      Option.getOrThrowWith(() => new Error("a scratch statement grizzle states no law of")),
    );

  return {
    laws: schemaLawsOf(built),
    named: {
      attributeFamily: lawOf(attributeFamily),
      attributeOwner: lawOf(attributeOwner),
      attrsFold: lawOf(attrsFold),
      choiceFamily: lawOf(choiceFamily),
      choiceOwner: lawOf(choiceOwner),
      countedCount: lawOf(countedCount),
      elementCount: lawOf(elementCount),
      lastSlot: lawOf(lastSlot),
      nodeTree: lawOf(nodeTree),
      parentCopy: lawOf(parentCopy),
      predecessorCopy: lawOf(predecessorCopy),
    },
  };
})();

/**
 * Whether a law side reads the relation and the terms of `expected`, whatever its selection: a
 * containment Qti states over a selection of its relation reads it so.
 *
 * @param side - A side of a law Qti states.
 * @param expected - The side, as {@link sideOf} builds it.
 * @returns Whether it reads it.
 */
const readsAs = (side: LawSide, expected: LawSide): boolean =>
  side.relation === expected.relation &&
  side.terms.length === expected.terms.length &&
  side.terms.every((term, at) => {
    const held = expected.terms[at];

    return held !== undefined && term.kind === held.kind && term.field === held.field;
  });

/**
 * Build a law side over every fact, as an outcome names one.
 *
 * @param name - The relation.
 * @param terms - Its terms: a field's name, or `pred:field`.
 * @returns The side.
 */
const sideOf = (name: string, ...terms: readonly [string, ...string[]]): LawSide => {
  const read = pipe(
    terms,
    Arr.map((t): LawSide["terms"][number] =>
      t.startsWith("pred:") ? { field: t.slice(5), kind: "pred" } : { field: t, kind: "field" },
    ),
  );

  return { relation: name, selection: { conjuncts: [] }, terms: read };
};

/**
 * Collect the laws of {@link statedLaws} named `name` that `where` holds of.
 *
 * @param name - The law's name.
 * @param where - Which of its laws, every one by default.
 * @returns The laws.
 */
const statedNamed = (
  name: keyof typeof lawTable,
  where: (law: Law) => boolean = () => true,
): readonly Law[] =>
  statedLaws().flatMap(([law, owner]) => (owner === name && where(law) ? [law] : []));

/**
 * Whether a law is a family's, of either order.
 *
 * @param law - The law.
 * @returns Whether it is.
 */
const isFamily = (law: Law): boolean => law.kind === "family";

/**
 * Whether a law is a fold.
 *
 * @param law - The law.
 * @returns Whether it is.
 */
const isFold = (law: Law): boolean => law.kind === "fold";

/**
 * Whether a law is the family over the slots `owner.count`.
 *
 * @param owner - The owner relation.
 * @param count - Its count.
 * @returns The test.
 */
const familyOver =
  (owner: string, count: string) =>
  (law: Law): boolean =>
    law.kind === "family" && law.slots.owner === owner && law.slots.count === count;

/**
 * Whether a law is a fold over the family of the slots `owner.count`.
 *
 * @param owner - The owner relation.
 * @param count - Its count.
 * @returns The test.
 */
const foldOver =
  (owner: string, count: string) =>
  (law: Law): boolean =>
    law.kind === "fold" && law.family.owner === owner && law.family.count === count;

/**
 * Whether a law is a containment into `target`.
 *
 * @param target - The target relation.
 * @returns The test.
 */
const containedInto =
  (target: string) =>
  (law: Law): boolean =>
    law.kind === "contained" && law.to.relation === target;

/**
 * Whether a law is a containment from `source` whose terms begin with `fields`, each a field.
 *
 * @param source - The source relation.
 * @param fields - The fields its terms begin with.
 * @returns The test.
 */
const containedFrom =
  (source: string, ...fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "contained" &&
    law.from.relation === source &&
    beginsWith(
      law.from,
      fields.map((field) => ({ field, kind: "field" as const })),
    );

/**
 * The rules of each tier of the spec's order, from QTI's own rules to the representation's (the
 * plan's §1.3 to §1.7): a refusal that names laws of several tiers names one of the most specific
 * tier's.
 */
const tiers: readonly (readonly Rule[])[] = [
  [
    "document-key",
    "idref-target",
    "label-tool",
    "document-lang",
    "declaration-key",
    "declaration-reserved",
    "reserved-type",
    "declaration-type",
    "value-cardinality",
    "typed-copy",
    "mastery-range",
    "binding-declared",
    "binding-fit",
    "record-binding-fit",
    "binding-unique",
    "choice-bounds",
    "choice-identifier-distinct",
    "hotspot-default",
    "feedback-ref",
    "template-ref",
    "printed-variable-ref",
    "context-variable-ref",
    "pci-module-source",
    "slider-bounds",
    "max-strings-required",
    "aria-value-range",
    "adaptive-feedback",
    "P2",
    "P8",
    "prefixed-ref",
    "variable-kind",
    "P20",
    "P21",
    "P22",
    "P23",
    "P24",
    "P25",
    "P26",
    "P27",
    "P29",
    "mapping-base-type",
    "lookup-cardinality",
    "map-key-unique",
    "lom-identifier",
    "lom-title",
    "selection-bounds",
    "selection-required",
    "structure-identifier",
    "test-name-key",
    "section-identifier-target",
    "branch-target",
    "branch-forward",
    "stimulus-ref-key",
    "variable-mapping-target",
    "variable-mapping-source",
    "template-default-target",
    "item-ref-target",
    "stimulus-ref-target",
    "include-target",
    "include-root",
    "inclusion-cycle",
    "entry-kind",
    "root-type-reverse",
    "file-listed",
    "file-exists",
    "href-listed",
    "self-dependency",
    "manifest-id-space",
  ],
  ["math-arity", "ssml-fragment", "include-href"],
  [
    "xsi-type",
    "required-attribute",
    "attribute-count",
    "attribute-lexical",
    "text-copy",
    "attribute-admission",
  ],
  ["ancestry-ban", "owner-copy", "ordering", "child-set", "union-count", "admission"],
  ["cdn-data", "cdn-origin", "cdn-style", "cdn-foreign"],
  [
    "key-text-bound",
    "href-form",
    "fragment-context",
    "well-formedness",
    "unmodeled-vocabulary",
    "derived",
    "reachability",
  ],
];

/**
 * Read the tier of a rule: its place in {@link tiers}.
 *
 * @param rule - The rule.
 * @returns Its tier, from 0, or the number of tiers for a rule of none.
 */
const tierOf = (rule: Rule): number => {
  const at = tiers.findIndex((tier) => tier.includes(rule));

  return at === -1 ? tiers.length : at;
};

/**
 * Read the rule of each law of a set by its name, straight from the table.
 *
 * @param laws - The laws.
 * @returns Their rules, one per law the table owns, repeats and order kept.
 */
const lawRules = (laws: readonly Law[]): readonly (typeof precedence)[number][] =>
  laws.flatMap((law) => Option.toArray(Option.map(lawNameOf(law), (name) => lawTable[name].rule)));

/**
 * Write rules as one text, so two listings compare by a string's equality.
 *
 * @param named - The rules.
 * @returns Them, space separated.
 */
const listed = (named: readonly string[]): string => named.join(" ");

/**
 * Check the rules of one set of laws one native object carries: every rule of its laws, each once
 * and no other, most specific first by the precedence, whatever the laws' order or repeats, and
 * the first of the most specific tier among them. No law is singled out: a refusal carries them
 * all.
 *
 * @param laws - The laws, in any order, with any repeats.
 */
const assertRules = (laws: Arr.NonEmptyReadonlyArray<Law>): void => {
  const rules = rulesOf(laws);
  const expected = Arr.dedupe(lawRules(laws)).toSorted(
    (a, b) => precedence.indexOf(a) - precedence.indexOf(b),
  );
  const reversed = rulesOf(Arr.reverse(laws));
  // A repeat is a drawn law again, the same value, so the set keeps each value once.
  const once = rulesOf(Arr.dedupeWith(laws, (a, b) => a === b));
  const [first] = rules;
  if (
    first !== undefined &&
    listed(rules) === listed(expected) &&
    listed(reversed) === listed(rules) &&
    listed(once) === listed(rules) &&
    tierOf(first) === Math.min(...rules.map(tierOf))
  ) {
    return;
  }

  const identities = laws.map((law) => Formatter.format(law)).join(" & ");
  assert.isNotEmpty(rules, identities);
  assert.deepStrictEqual(rules, expected, identities);
  assert.deepStrictEqual(reversed, rules, identities);
  assert.deepStrictEqual(once, rules, identities);
  if (first !== undefined) {
    assert.strictEqual(tierOf(first), Math.min(...rules.map(tierOf)), identities);
  }
};

/**
 * The axes {@link plannedAxes} names, the features the precedence's exhaustion must reach.
 */
const axisLabels = [
  "Node owner",
  "Node predecessor",
  "Node last",
  "Attribute owner",
  "Attribute predecessor and last",
  "OpenAttributeName owner",
  "Idref owner",
  "Idref predecessor and last",
  "Namespace",
  "Choice",
] as const;

/**
 * One of {@link axisLabels}.
 */
type AxisLabel = (typeof axisLabels)[number];

/**
 * Hold a list of laws nonempty, failing the suite where a planned group lost its laws.
 *
 * @param what - What the laws are, for the failure.
 * @param laws - The laws.
 * @returns The laws.
 */
const nonEmpty = <A>(what: string, laws: readonly A[]): Arr.NonEmptyReadonlyArray<A> =>
  Arr.isReadonlyArrayNonEmpty(laws) ? laws : assert.fail(`${what}: no stated law`);

/**
 * Build a planned axis from groups of stated laws, with the rule the spec's order names for it.
 *
 * @param label - The axis.
 * @param rule - Its rule.
 * @param groups - Its laws, by group.
 * @returns The axis.
 */
const plannedAxis = (
  label: AxisLabel,
  rule: Rule,
  ...groups: readonly (readonly Law[])[]
): Axis & { readonly label: AxisLabel; readonly rule: Rule } => ({
  label,
  laws: nonEmpty(label, groups.flat()),
  rule,
});

/**
 * The merged axes of the schema's families as `node.ts`, `chardata.ts` and `attributes.ts` state
 * them, each with the rule its refusal names under the spec's order: a content-order law over the
 * tree's own, and an attribute law over its family's.
 */
const plannedAxes = nonEmpty("the planned axes", [
  plannedAxis("Node owner", "reachability", statedNamed("N2 tree"), statedNamed("T3 first child")),
  plannedAxis(
    "Node predecessor",
    "ordering",
    statedNamed("N2 tree"),
    statedNamed("N5 fold"),
    statedNamed("N7 Counted"),
    statedNamed("N7 barred by"),
    statedNamed("E1 derived", foldOver("Node", "children")),
  ),
  plannedAxis(
    "Node last",
    "ordering",
    statedNamed("N2 tree"),
    statedNamed("N7 last slot"),
    statedNamed("N5 fold", isFold),
    statedNamed("N7 Counted"),
    statedNamed("N7 barred by"),
    statedNamed("E1 derived", foldOver("Node", "children")),
  ),
  plannedAxis(
    "Attribute owner",
    "attribute-admission",
    statedNamed("AL2 count", isFamily),
    statedNamed("AL1 owner", containedFrom("Attribute", "node", "kind")),
  ),
  plannedAxis(
    "Attribute predecessor and last",
    "attribute-admission",
    statedNamed("AL2 count", isFamily),
    statedNamed("AL2 fold"),
  ),
  plannedAxis(
    "OpenAttributeName owner",
    "attribute-admission",
    statedNamed("AL4 open names", isFamily),
    statedNamed("AL1 owner", containedFrom("OpenAttributeName")),
  ),
  plannedAxis(
    "Idref owner",
    "attribute-admission",
    statedNamed("E1 derived", familyOver("Attribute", "idrefs")),
    statedNamed("AL1 owner", containedFrom("Idref")),
  ),
  plannedAxis(
    "Idref predecessor and last",
    "derived",
    statedNamed("E1 derived", familyOver("Attribute", "idrefs")),
    statedNamed("E1 derived", foldOver("Attribute", "idrefs")),
  ),
  plannedAxis("Namespace", "reachability", statedNamed("Namespace family", isFamily)),
  plannedAxis(
    "Choice",
    "owner-copy",
    statedNamed("N8 nearest", familyOver("Interaction", "choices")),
  ),
]);

/**
 * The laws one refusal may name together across the tiers: a law of each tier, a family law of
 * the QTI tier among them, so a set drawn from it meets every pair of tiers.
 */
const crossTier = nonEmpty("the cross-tier laws", [
  ...statedNamed("Binding declared", containedInto("Declaration")),
  ...statedNamed("Choice bounds"),
  { kind: "check", name: checkNameOf("MathML arity"), relation: "Node" } satisfies Law,
  ...statedNamed("AL1 owner", containedFrom("Attribute", "node", "kind")),
  { kind: "check", name: checkNameOf("N5 Follow"), relation: "Node" } satisfies Law,
  ...statedNamed("N7 last slot"),
  ...statedNamed("N2 tree"),
  ...statedNamed("E1 derived", foldOver("Node", "children")),
]);

describe("the law table", () => {
  it.effect(
    "ranks every rule a law keeps once, and owes each rule no law keeps yet to the slice that states it",
    (ctx) =>
      Effect.gen(function* ranks() {
        const owned: ReadonlySet<Rule> = new Set(Object.values(lawTable).map(({ rule }) => rule));
        const owed: readonly Rule[] = Object.keys(owedRules).filter((rule): rule is Rule =>
          Schema.is(ImportRule)(rule),
        );

        assert.strictEqual(new Set(precedence).size, precedence.length, "a rule ranks twice");
        assert.deepStrictEqual(
          [...owned, ...owed].toSorted(),
          [...precedence].toSorted(),
          "the precedence is exactly the owned and the owed rules",
        );
        assert.deepStrictEqual(
          owed.filter((rule) => owned.has(rule)),
          [],
          "an owed rule has a law",
        );
        for (const rule of precedence) {
          assert.isTrue(Schema.is(ImportRule)(rule), rule);
        }

        for (const rule of limitRules) {
          assert.include(precedence, rule, "a limit's rule ranks among the laws'");
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            Object.entries<string>(owedRules)
              .map(([rule, slice]) => `${rule} (${slice})`)
              .join(", "),
            "rules with no law yet",
          ),
        );
      }),
  );
});

/**
 * Write a set of laws as one value to compare: each law's text, sorted. An axis's laws are a set,
 * the laws one `some` refusal names together, and `lawsOf` lists them in its canonical order, not
 * as the schema declares them.
 *
 * @param laws - The laws.
 * @returns Their texts, sorted.
 */
const asSet = (laws: readonly Law[]): readonly string[] =>
  laws.map((law) => Formatter.format(law)).toSorted();

describe("the merged axes and the laws no row states", () => {
  it("reads every merged axis of the scratch schema as grizzle generates its foreign key", () => {
    const axes = mergedAxes(scratch.laws);
    const {
      attributeFamily,
      attributeOwner,
      attrsFold,
      choiceFamily,
      choiceOwner,
      countedCount,
      elementCount,
      lastSlot,
      nodeTree,
      parentCopy,
      predecessorCopy,
    } = scratch.named;

    assert.deepStrictEqual(
      Object.fromEntries(axes.map(({ label, laws }) => [label, asSet(laws)])),
      {
        "Attribute last": asSet([attributeFamily, attrsFold]),
        "Attribute owner": asSet([attributeFamily, attributeOwner]),
        "Attribute predecessor": asSet([attributeFamily, attrsFold]),
        "Choice owner": asSet([choiceFamily, choiceOwner]),
        "Choice predecessor and last": asSet([choiceFamily]),
        "Node last": asSet([nodeTree, lastSlot, elementCount, countedCount]),
        "Node owner": asSet([nodeTree, parentCopy]),
        "Node predecessor": asSet([nodeTree, predecessorCopy, elementCount, countedCount]),
      },
    );
  });

  it("names no rule for laws no row states, and still carries each law as the outcome names it", () => {
    // Oracle: the outcome itself, read back field by field: its decision, the law's display text
    // with no name or rule, no source, the witness's kind, and no rule.
    const law: Law = { from: sideOf("Nowhere", "x"), kind: "contained", to: sideOf("Node", "id") };
    const refused = refusalOf({ kind: "every", laws: [law] }, { kind: "unreported" }, grammar);

    assert.deepStrictEqual(refused.rules, []);
    assert.deepStrictEqual(refused.origin, {
      _tag: "Database",
      kind: "every",
      laws: [{ text: Formatter.format(law) }],
      sources: [],
      witness: "unreported",
    });
    assert.isTrue(
      refused.message.startsWith(
        "The package was refused under laws no rule of the law table names: ",
      ),
      refused.message,
    );
    assert.isTrue(Option.isNone(ruleOfLaw(law)));
  });

  it(
    "gives a check its installed name only where Qti states it, so a refusal by a CDN install's check prints with its name and rule and no installed name",
    () => {
      // Oracle: grizzle's `constraintNameOf(Qti, law)` for the check Qti states, AL1's admission on
      // Attribute, and the law table's name and rule for both. A CDN install's stored level states
      // `CDN_origin` (`#pantry/qti/cdn.ts`), which the default Qti does not, so a refusal read
      // against Qti names a check it lacks: the refusal still carries its text, its name and its
      // rule, and no installed name, where grizzle would throw for it.
      const stated = {
        kind: "check",
        name: checkNameOf("AL1 admission"),
        relation: "Attribute",
      } as const;
      const cdn = {
        kind: "check",
        name: checkNameOf("CDN origin"),
        relation: "Attribute",
      } as const;
      const refused = refusalOf(
        { kind: "every", laws: [stated, cdn] },
        { kind: "unreported" },
        grammar,
      );

      assert.strictEqual(refused.origin._tag, "Database");
      assert.deepStrictEqual(refused.origin._tag === "Database" ? refused.origin.laws : [], [
        {
          installed: constraintNameOf(Qti, stated),
          name: "AL1 admission",
          rule: lawTable["AL1 admission"].rule,
          text: Formatter.format(stated),
        },
        {
          name: "CDN origin",
          rule: lawTable["CDN origin"].rule,
          text: Formatter.format(cdn),
        },
      ]);
    },
    testTimeoutMs,
  );
});

/**
 * One set of laws a native object carries: its axis and the laws, in drawn order, with repeats.
 */
interface Carried {
  readonly axis: string;
  readonly laws: Arr.NonEmptyReadonlyArray<Law>;
}

/**
 * Every nonempty sequence of at most `max` of one axis's laws, repeats allowed: each order and
 * repeat of each subset.
 *
 * @param axes - The axes, the first the simplest.
 * @param max - The longest sequence.
 * @returns The generator.
 */
const carriedOf =
  (axes: Arr.NonEmptyReadonlyArray<Axis>, max: number): Gen<Carried> =>
  (source) => {
    const axis = source.draw(element(axes));
    const laws = source.draw(array(element(axis.laws), { max, min: 1 }));
    const [first, ...rest] = laws;

    return { axis: axis.label, laws: first === undefined ? axis.laws : [first, ...rest] };
  };

/**
 * Write a drawn set of laws as an exhaustion reports it.
 *
 * @param carried - The set.
 * @returns Its axis and its laws, as grizzle names them.
 */
const carriedText = ({ axis, laws }: Carried): string =>
  `${axis}: ${laws.map((law) => Formatter.format(law)).join(" & ")}`;

/**
 * Each adjacent pair of {@link precedence}, the rule a refusal names first and the one after it,
 * with the reading or source that orders them: the spec's tiers (the precedence's own comment, the
 * plan's §1.3 to §1.7) between tiers, and within one the dependency or the section order that puts
 * the one before the other. A data mutant of the precedence, two rules swapped, breaks its pair
 * here, where no differential can see it: no one cause breaks both rules of a pair such as
 * `binding-declared` and `binding-fit`, since BindingFit reads the declaration Binding declared
 * proves exists.
 */
const precedencePairs: readonly (readonly [Rule, Rule, string])[] = [
  [
    "document-key",
    "idref-target",
    "reading 101: an IDREF names an ID, and an ID two elements purport is the cause an unresolved reference follows from",
  ],
  [
    "idref-target",
    "table-headers",
    "reading 126: a cell's headers are IDREFs held to a th of its own table, Idref target's narrower case",
  ],
  [
    "table-headers",
    "label-tool",
    "O1 (plan §1.7): references before a label's tools (reading 128)",
  ],
  [
    "label-tool",
    "card-support",
    "O1 (phase-9-n §4.1): the catalog's rules join the identity tier after label-tool (reading R9-a)",
  ],
  [
    "card-support",
    "card-default",
    "reading R9-a: a card's support (§5.26.1) before the entries it holds (§5.27.2), section order and containment",
  ],
  [
    "card-default",
    "document-lang",
    "O1 (phase-9-n §4.1): the catalog's rules before the document's language (R26), an element's own identity first",
  ],
  ["document-lang", "declaration-key", "the tiers: O1 before O2 (plan §1.7)"],
  [
    "declaration-key",
    "declaration-reserved",
    "O2 (plan §1.7): one declaration per identifier before what the identifier may be (reading 72)",
  ],
  [
    "declaration-reserved",
    "reserved-type",
    "reading 72: a reserved name is refused before a reserved variable's type is judged",
  ],
  [
    "reserved-type",
    "declaration-type",
    "O2: a built-in variable's fixed type before a declared variable's (§5.42)",
  ],
  [
    "declaration-type",
    "value-cardinality",
    "O2: a declaration's type before its values' count (§5.42, §5.125)",
  ],
  ["value-cardinality", "typed-copy", "O2: a value set's count before each value's lexical form"],
  [
    "typed-copy",
    "mastery-range",
    "O2: each value's form before the range its number is read in (§5.107)",
  ],
  ["mastery-range", "binding-declared", "the tiers: O2 before O3 (plan §1.7)"],
  [
    "binding-declared",
    "binding-fit",
    "readings 75 and 92: BindingFit reads the declaration Binding declared proves exists, so the undeclared binding is the cause",
  ],
  [
    "binding-fit",
    "record-binding-fit",
    "reading 92: a record response's fit is the record arm of the same binding, read after its base type and cardinality",
  ],
  [
    "record-binding-fit",
    "binding-unique",
    "reading 92: a binding's fit before the variable's one binding",
  ],
  ["binding-unique", "choice-bounds", "O3 (plan §1.7): bindings before choice counts (reading 18)"],
  [
    "choice-bounds",
    "choice-identifier-distinct",
    "O3: a choice's count before its identifiers (reading 104)",
  ],
  [
    "choice-identifier-distinct",
    "hotspot-default",
    "O3: the choices' identifiers before a default hotspot's place (reading 80)",
  ],
  [
    "hotspot-default",
    "feedback-ref",
    "O3: an interaction's own content before the references it makes (§2.4)",
  ],
  [
    "feedback-ref",
    "template-ref",
    "O3's references in the plan's order: feedback (§5.49), then template (§5.169)",
  ],
  [
    "template-ref",
    "printed-variable-ref",
    "O3's references in the plan's order: template, then printed variable (§7.30)",
  ],
  [
    "printed-variable-ref",
    "context-variable-ref",
    "O3's references in the plan's order: printed variable, then context variable (§5.39)",
  ],
  [
    "context-variable-ref",
    "pci-module-source",
    "O3: references before a PCI's module source (R10-a)",
  ],
  [
    "pci-module-source",
    "slider-bounds",
    "O3: a PCI's module source before an interaction's numeric bounds (§5.137)",
  ],
  [
    "slider-bounds",
    "max-strings-required",
    "O3: a slider's bounds before an extended text's string count (reading 92's cardinality kinds)",
  ],
  ["max-strings-required", "aria-value-range", "O3: QTI's counts before ARIA's range (reading 91)"],
  [
    "aria-value-range",
    "adaptive-feedback",
    "O3: an attribute's own range (reading 48) before the item's adaptive flag (Q5.09)",
  ],
  ["adaptive-feedback", "source-srcset", "the tiers: O3 before the HTML content (plan §1.7)"],
  ["source-srcset", "source-src", "reading 124: a picture's source, then a media element's"],
  ["source-src", "track-srclang", "readings 124, then 125"],
  ["track-srclang", "q-punctuation", "readings 125, then 127"],
  ["q-punctuation", "P2", "the tiers: the HTML content before O4 (plan §1.7)"],
  ["P2", "P8", "O4: an operator's arity (P2, §2.11.3) before the variables it reads (P8)"],
  ["P8", "P10", "O4: a variable's declaration before a rounding operator's figures (reading 119)"],
  ["P10", "P36", "readings 119, then 121: the rounding figures before the tolerance"],
  [
    "P36",
    "prefixed-ref",
    "O4: an operator's own attributes before a test-level reference's reading (readings 48 and 88)",
  ],
  [
    "prefixed-ref",
    "variable-kind",
    "readings 48 and 88: which variable a reference names before what kind it is",
  ],
  ["variable-kind", "P20", "O4: a reference's kind before the old checker's rules (Q5.10)"],
  ["P20", "P21", "the old processing checker's numbering (Q5.10)"],
  ["P21", "P22", "the old processing checker's numbering (Q5.10)"],
  ["P22", "P23", "the old processing checker's numbering (Q5.10)"],
  ["P23", "P24", "the old processing checker's numbering (Q5.10)"],
  ["P24", "P25", "the old processing checker's numbering (Q5.10)"],
  ["P25", "P26", "the old processing checker's numbering (Q5.10)"],
  ["P26", "P27", "the old processing checker's numbering (Q5.10)"],
  ["P27", "P29", "the old processing checker's numbering (Q5.10)"],
  ["P29", "mapping-base-type", "the tiers: O4 before O5 (plan §1.7)"],
  [
    "mapping-base-type",
    "lookup-cardinality",
    "O5 (plan §1.7): a mapping's base type (§5.5) before a lookup table's cardinality",
  ],
  ["lookup-cardinality", "map-key-unique", "O5: a table's declaration before its keys"],
  ["map-key-unique", "lom-identifier", "the tiers: O5 before O6 (plan §1.7)"],
  ["lom-identifier", "lom-title", "reading 62: the record's identifier before its title"],
  ["lom-title", "lom-learning-resource-type", "O6: readings 62, then 122"],
  ["lom-learning-resource-type", "selection-bounds", "the tiers: O6 before O7 (plan §1.7)"],
  [
    "selection-bounds",
    "selection-required",
    "reading 79: a selection's bound before its required parts (§4.2.2)",
  ],
  [
    "selection-required",
    "structure-identifier",
    "O7: a section's selection before its names (reading 86)",
  ],
  [
    "structure-identifier",
    "test-name-key",
    "reading 86: one document's names before the assembly's",
  ],
  [
    "test-name-key",
    "section-identifier-target",
    "O7: the assembly's names before what a section-identifier names (A61)",
  ],
  [
    "section-identifier-target",
    "branch-target",
    "O7: a named section before a branch rule's target (reading 87)",
  ],
  [
    "branch-target",
    "branch-forward",
    "reading 87: a branch rule names a target before the target must stand ahead of it",
  ],
  [
    "branch-forward",
    "stimulus-ref-key",
    "O7: branch rules before an item ref's stimulus refs (§7.6.2)",
  ],
  [
    "stimulus-ref-key",
    "variable-mapping-target",
    "O7: an item ref's stimulus refs before its variable mappings (reading 97)",
  ],
  [
    "variable-mapping-target",
    "variable-mapping-source",
    "reading 97: a mapping's target before its source (A34)",
  ],
  [
    "variable-mapping-source",
    "template-default-target",
    "O7: an item ref's mappings before its template defaults (A37)",
  ],
  [
    "template-default-target",
    "item-ref-target",
    "O7: what an item ref sets before what it names (B2, B3)",
  ],
  [
    "item-ref-target",
    "stimulus-ref-target",
    "O7: an item ref's target before a stimulus ref's (B5)",
  ],
  ["stimulus-ref-target", "include-target", "O7: refs before includes (reading 115)"],
  [
    "include-target",
    "include-root",
    "reading 115: an include names a document before its root is judged (reading 114)",
  ],
  [
    "include-root",
    "inclusion-cycle",
    "readings 114, then 85: an include's target before the chain it closes",
  ],
  ["inclusion-cycle", "entry-kind", "the tiers: O7 before packaging's P1 to P4 (plan §1.6)"],
  [
    "entry-kind",
    "root-type-reverse",
    "reading 93 and package.ts's P3: a path's listing before the type of the root it lists, so a path listed under two document types is named for its listing, the cause (Decided 2026-11-07 by the coordinator, under the operator's standing ruling of 2026-11-05, from seat OL (0b4d8ec9)). Since reading 162 the path is typed by the listing its root bears out, so both laws break only where its root fits neither type; there PostgreSQL's immediate RootOfType check reports root-type-reverse before the deferred Document entry key, and the import names that, a stated limit of package.ts's rule, while the law oracle names entry-kind by this order",
  ],
  [
    "root-type-reverse",
    "file-listed",
    "readings 93, then 33: a listed document's root type before the files a resource lists",
  ],
  ["file-listed", "file-exists", "P2: a listed file before the file it names exists"],
  ["file-exists", "href-listed", "P3: a file's existence before a resource's href among its files"],
  ["href-listed", "self-dependency", "P4: hrefs before dependencies (IMS Content Packaging 1.2)"],
  ["self-dependency", "manifest-id-space", "P4: a dependency before the manifest's identifiers"],
  ["manifest-id-space", "math-arity", "the tiers: packaging before the embedded languages"],
  [
    "math-arity",
    "ssml-fragment",
    "the embedded languages: reading 2 (MathML), then reading 3 (SSML)",
  ],
  [
    "ssml-fragment",
    "include-href",
    "the embedded languages: SSML, then XInclude's href (reading 85)",
  ],
  ["include-href", "xsi-type", "the tiers: the embedded languages before XML Schema's assessment"],
  [
    "xsi-type",
    "required-attribute",
    "XML Schema's assessment: an element's governing type (reading 47) before the attributes it requires (AL3)",
  ],
  [
    "required-attribute",
    "attribute-count",
    "AL3's required attributes before AL5's count (readings 41 and 43)",
  ],
  ["attribute-count", "attribute-lexical", "an attribute's count before its value's lexical form"],
  ["attribute-lexical", "text-copy", "an attribute's form before an element's text (TextDomain)"],
  [
    "text-copy",
    "attribute-admission",
    "a governed value before whether its attribute is admitted at all (AL1), the assessment's most general",
  ],
  [
    "attribute-admission",
    "ancestry-ban",
    "the tiers: XML Schema's assessment before the content model",
  ],
  [
    "ancestry-ban",
    "owner-copy",
    "the content model: the ancestry bans (N6), then the nearest interaction (N8)",
  ],
  [
    "owner-copy",
    "ordering",
    "the content model: the nearest interaction before the automaton's order (N5 Follow)",
  ],
  [
    "ordering",
    "child-set",
    "a content-order law over a family law: the automaton's order before the counts it relaxes (N7)",
  ],
  [
    "child-set",
    "union-count",
    "the content model: the counts the automaton relaxes, then a union's count",
  ],
  [
    "union-count",
    "admission",
    "the content model: the family's end before admission, the most general (N5 admitted)",
  ],
  [
    "admission",
    "cdn-data",
    "the tiers: the content model before a single-CDN install's policy, so content that is not valid QTI is named by the rule that says so",
  ],
  [
    "cdn-data",
    "cdn-origin",
    "the install's policy: a data: address is the cause its address off the origin follows from (cdn.ts)",
  ],
  [
    "cdn-origin",
    "cdn-style",
    "the install's policy: an address the player fetches before a style that fetches, which no fetched field is (cdn.ts)",
  ],
  [
    "cdn-style",
    "cdn-foreign",
    "the install's policy: markup it reads before markup pantry cannot read (cdn.ts)",
  ],
  [
    "cdn-foreign",
    "key-text-bound",
    "the tiers: a single-CDN install's policy before the document layer",
  ],
  [
    "key-text-bound",
    "href-form",
    "the document layer: its stated limits first, in limitRules' order, the key-text bound (reading 133) before the href form (reading 102)",
  ],
  [
    "href-form",
    "fragment-context",
    "limitRules' order: the href form (reading 102), then the fragment's one context (reading 117)",
  ],
  [
    "fragment-context",
    "remote-section",
    "limitRules' order: the fragment's one context (reading 117), then the remote section ref (reading 170)",
  ],
  [
    "remote-section",
    "namespace-name",
    "the document layer: its stated limits before its laws, the first a namespace name (reading 131)",
  ],
  [
    "namespace-name",
    "well-formedness",
    "the document layer: foreign names before the reader's productions (XML 1.0)",
  ],
  [
    "well-formedness",
    "unmodeled-vocabulary",
    "the document layer: a production's breach before a name no vocabulary models",
  ],
  ["unmodeled-vocabulary", "derived", "the document layer: names before the derived fields (E1)"],
  [
    "derived",
    "reachability",
    "the document layer: the derived fields before the tree itself (N2), the most general",
  ],
];

describe("the rules of the laws one native object carries, in the precedence's order", () => {
  it("holds each adjacent pair of the precedence to the reading or source that orders it", () => {
    // Oracle: the readings and the plan's tiers, pair by pair (precedencePairs). Bound: every
    // adjacent pair of the 103 rules, so a swap of any two neighbours, or a rule moved or added,
    // breaks a pair, and the message names it.
    assert.deepStrictEqual(
      precedencePairs.map(([earlier, later]) => `${earlier} before ${later}`),
      precedence.slice(1).map((later, at) => `${precedence[at] ?? ""} before ${later}`),
      "the precedence's order, pair by pair against the reading that orders each",
    );
    assert.isTrue(precedencePairs.every((pair) => pair[2].length > 0));
  });

  it("lists each planned axis's rules with the one the spec's order names first", () => {
    for (const { label, laws, rule } of plannedAxes) {
      assert.isAbove(laws.length, 0, label);
      assert.deepStrictEqual(Arr.head(rulesOf(laws)), Option.some(rule), label);
    }
  });

  it.effect(
    "lists the rules of every sequence of at most 4 of each planned axis's laws, any order and repeats, each once, most specific first",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every nonempty sequence of at most 4 laws, repeats allowed, of each of the 10 planned axes (at most 6 laws each)",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<AxisLabel>(axisLabels),
            generator: carriedOf(plannedAxes, 4),
            limit: 20_000,
            literal: carriedText,
            oracle: {
              kind: "specification",
              name: "the plan's tiers (§1.3 to §1.7): a QTI rule over a tree law, a content-order law over a family law",
            },
            suite: "import/refusal/precedence-axes",
          },
          (carried, c) =>
            Effect.sync(() => {
              const label = axisLabels.find((known) => known === carried.axis);
              if (label !== undefined) {
                c.note(label);
              }

              assertRules(carried.laws);
            }),
        ),
      ),
  );

  it.effect(
    "lists the rules of every sequence of at most 3 laws across the tiers each once, most specific first",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every nonempty sequence of at most 3 of 8 laws spanning the five tiers, repeats allowed",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"cross-tier">(["cross-tier"]),
            generator: carriedOf([{ label: "cross-tier", laws: crossTier }], 3),
            limit: 1000,
            literal: carriedText,
            oracle: {
              kind: "specification",
              name: "the plan's tiers (§1.3 to §1.7): a QTI rule over a tree law, a content-order law over a family law",
            },
            suite: "import/refusal/precedence-tiers",
          },
          (carried, c) =>
            Effect.sync(() => {
              c.note("cross-tier");
              assertRules(carried.laws);
            }),
        ),
      ),
  );
});

/**
 * One state of a content model: its version, its kind and the state.
 */
interface ModelState {
  readonly parent: string;
  readonly state: string;
  readonly version: string;
}

/**
 * Each family's content model, by `version parent`, read from `ContentModelOf`'s rows directly.
 */
const modelOf: ReadonlyMap<string, string> = new Map(
  grammar.content.contentModelOf.rows.map(
    ({ model, parent, version }) => [`${version} ${parent}`, model] as const,
  ),
);

/**
 * Every state of every family whose content model `Follow` or `Last` holds, keyed once each: the
 * model's states, read in each family of it.
 */
const modelStates: Arr.NonEmptyReadonlyArray<ModelState> = (() => {
  const states = new Map<string, Set<string>>();
  const add = (model: string, state: string): void => {
    states.set(model, (states.get(model) ?? new Set()).add(state));
  };
  for (const { from, model } of grammar.content.follow.rows) {
    add(model, from);
  }

  for (const { model, position } of grammar.content.last.rows) {
    add(model, position);
  }

  return nonEmpty(
    "the content models' states",
    grammar.content.contentModelOf.rows.flatMap(({ model, parent, version }) =>
      [...(states.get(model) ?? [])].map((state) => ({ parent, state, version })),
    ),
  );
})();

/**
 * Every content model `Follow` or `Last` holds, with its states in the first family that has it:
 * the exhaustion's space, one case per model. `Follow` and `Last` are keyed by the model, so a
 * model's states and the positions they allow are its every family's, and one family of each model
 * is the small scope (115 models where `ContentModelOf` has 1,288 families); the kinds an
 * explanation lists at each position are read in that family.
 */
const models: Arr.NonEmptyReadonlyArray<Arr.NonEmptyReadonlyArray<ModelState>> = (() => {
  const first = new Map<string, Arr.NonEmptyReadonlyArray<ModelState>>();
  for (const states of Map.groupBy(
    modelStates,
    ({ parent, version }) => `${version} ${parent}`,
  ).values()) {
    const family = nonEmpty("a model's states", states);
    const [{ parent, version }] = family;
    const model = modelOf.get(`${version} ${parent}`) ?? "";
    if (!first.has(model)) {
      first.set(model, family);
    }
  }

  return nonEmpty("the content models", [...first.values()]);
})();

/**
 * The positions `Follow` holds after each state of each model, read from its rows directly, keyed
 * `model state`.
 */
const followed: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const next = new Map<string, Set<string>>();
  for (const { from, model, to } of grammar.content.follow.rows) {
    const at = `${model} ${from}`;
    next.set(at, new Set([...(next.get(at) ?? []), to]));
  }

  return next;
})();

/**
 * The kinds at each position of each family, read from the rows directly, keyed `version parent
 * position`: those `Admission` gives the position, and those `Symbol` gives it in the family's
 * shared model (`SharedModelOf`), each family's read once here so that no case reads a relation.
 */
const positionKinds: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const kinds = new Map<string, Set<string>>();
  const add = (at: string, kind: string): void => {
    kinds.set(at, (kinds.get(at) ?? new Set()).add(kind));
  };
  for (const { child, parent, position, version } of grammar.admission.rows) {
    add(`${version} ${parent} ${position}`, child);
  }

  const symbols = Map.groupBy(grammar.content.symbol.rows, ({ model }) => model);
  for (const { model, parent, version } of grammar.content.sharedModelOf.rows) {
    for (const { kind, position } of symbols.get(model) ?? []) {
      add(`${version} ${parent} ${position}`, kind);
    }
  }

  return kinds;
})();

/**
 * Read the kinds at a position of a family's model.
 *
 * @param state - The family.
 * @param position - The position.
 * @returns The kinds, as a set.
 */
const kindsAt = (state: ModelState, position: string): ReadonlySet<string> =>
  positionKinds.get(`${state.version} ${state.parent} ${position}`) ?? new Set();

describe("the explanation of a content-order refusal", () => {
  const follow: readonly Law[] = [
    { kind: "check", name: checkNameOf("N5 Follow"), relation: "Node" },
  ];
  const last: readonly Law[] = [{ kind: "check", name: checkNameOf("N7 Last"), relation: "Node" }];

  it.effect(
    "names exactly the positions Follow allows after every state of every model, for N5's step and N7's end",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: `every state of every content model Follow or Last holds, in one family of each (${String(models.length)} models)`,
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<"allows next" | "allows nothing">([
              "allows next",
              "allows nothing",
            ]),
            generator: element<Arr.NonEmptyReadonlyArray<ModelState>>(models),
            limit: models.length,
            literal: ([{ parent, version }]) => `${version} ${parent}`,
            oracle: { kind: "second-implementation", name: "Follow's rows grouped directly" },
            suite: "import/refusal/explain-follow",
          },
          (states, c) =>
            Effect.sync(() => {
              for (const state of states) {
                const expected = followed.get(
                  `${modelOf.get(`${state.version} ${state.parent}`) ?? ""} ${state.state}`,
                );
                c.note(expected === undefined ? "allows nothing" : "allows next");

                const rows = [
                  {
                    laws: follow,
                    values: {
                      kind: "x",
                      parentKind: state.parent,
                      version: state.version,
                      was: state.state,
                    },
                  },
                  {
                    laws: last,
                    values: { kind: state.parent, lastState: state.state, version: state.version },
                  },
                ];
                for (const { laws, values } of rows) {
                  const [first, ...rest] = laws;
                  if (first === undefined) {
                    assert.fail("no content-order law is stated");
                  }

                  const at = `${state.version} ${state.parent} ${state.state}`;
                  const explained = explain(
                    [first, ...rest],
                    { kind: "row", relation: "Node", values },
                    grammar,
                  );
                  const next = Option.getOrElse(explained.next, () => []);
                  const sources = new Set(explained.sources);
                  const positions = next.map(({ position }) => position);

                  assert.isTrue(Option.isSome(explained.next), at);
                  assert.strictEqual(
                    positions.join(" "),
                    [...(expected ?? [])].toSorted((a, b) => Number(a) - Number(b)).join(" "),
                    at,
                  );
                  for (const { kinds, position, source } of next) {
                    const sourceText = Option.getOrElse(source, () => "");

                    assert.strictEqual(
                      kinds.toSorted().join(" "),
                      [...kindsAt(state, position)].toSorted().join(" "),
                      `${at} ${position}`,
                    );
                    assert.isTrue(sources.has(sourceText), `${at} ${position}: ${sourceText}`);
                  }

                  assert.isTrue(
                    sources.has(lawTable[Option.getOrThrow(lawNameOf(first))].source),
                    at,
                  );
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

describe("the refusals made before the database", () => {
  it("names each reader, container and codec refusal by the rule the law oracle states for it", () => {
    const cases: readonly (readonly [ReadRefusal, Rule])[] = [
      ...(["element", "attribute"] as const).flatMap((kind) =>
        unmodeledReasons.map(
          (reason) =>
            [
              new UnmodeledVocabulary({ kind, name: "x", parent: Option.none(), reason }),
              reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary",
            ] as const,
        ),
      ),
      ...notQti3Reasons.map(
        (reason) =>
          [new NotQti3({ expected: "3.0.0", found: Option.none(), reason }), "not-qti3"] as const,
      ),
      [new PackageReadError({ dir: "d", path: "p", rule: "manifest-root" }), "manifest-root"],
      [new PackageReadError({ dir: "d", path: "p", rule: "entry-path" }), "href-path"],
      ...(["manifest-root", "href-path", "zip-format"] as const).map(
        (rule) => [new ZipRefusal({ entry: "e", feature: "f", rule }), rule] as const,
      ),
      ...(
        [
          "decode",
          "unsupported-encoding",
          "encoding-mismatch",
          "nul",
          "undeclared-entity",
          "entity-cycle",
          "entity-expansion",
        ] as const
      ).map((rule) => [new ReaderRefusal({ detail: "d", rule }), "reader-refusal"] as const),
      [new WellFormednessError({ column: 1, line: 1, message: "m" }), "well-formedness"],
    ];

    for (const [error, rule] of cases) {
      assert.deepStrictEqual(ruleOfError(error).rules, [rule], error._tag);
    }

    const refused = new ImportRefused({ detail: "x", origin: readerOrigin, rules: ["admission"] });
    assert.strictEqual(ruleOfError(refused), refused);
  });
});

/**
 * The pattern law of a field of the small schema of the per-field test, `Club`'s, of `^[a-z]*$`.
 *
 * @param field - The field.
 * @returns Its law.
 */
const clubLaw = (field: string): Extract<Law, { readonly kind: "pattern" }> => ({
  field,
  kind: "pattern",
  patterns: [{ flags: "u", source: "^[a-z]*$" }],
  relation: "Club",
});

/**
 * The pattern law `Qti` states of one field, as {@link statedLaws} names it.
 *
 * @param owner - The field's relation.
 * @param field - The field.
 * @returns Its law; a field with none fails the test, naming it.
 */
const statedPatternLaw = (
  owner: string,
  field: string,
): Extract<Law, { readonly kind: "pattern" }> =>
  pipe(
    Arr.findFirst(
      statedLaws().flatMap(([law]) => (law.kind === "pattern" ? [law] : [])),
      (law) => law.relation === owner && law.field === field,
    ),
    Option.getOrThrowWith(() => new Error(`${owner}.${field} states no pattern law`)),
  );

/**
 * The keys a table names more than once, for a census's message.
 *
 * @param rows - The table's rows, each a key and its law's name.
 * @returns Each repeated key, once.
 */
const repeatedIn = (rows: readonly (readonly [string, LawName])[]): readonly string[] => {
  const keys = rows.map(([named]) => named);

  return Arr.dedupe(keys.filter((named, at) => keys.indexOf(named) !== at));
};

describe("the pattern laws, one per field", () => {
  it("names each law grizzle states by its field's own type's row, a generated field's included, and none whose field's type no row holds", () => {
    // Oracle: grizzle's pattern laws (`lawsOf`), one pattern law per stored field whose pattern states
    // one, by relation name and declared field order, a tautology's field none. Live: two types of
    // one pattern under two names, a generated field of one of them, a tautology's field, which
    // states no law, so no row names it. Wild: a field whose type no row holds.
    const code = str.regex("^[a-z]*$");
    const alias = str.regex("^[a-z]*$");
    const plain = str.regex("^.*$", "su");
    const Club = relation.generated(
      "Club",
      { alias, code, id: uuid, name: plain },
      ["id"],
      (r) => ({ joined: generated(code, Compute.concat(r.code, r.alias)) }),
    );
    const club = schema("Club", { Club }, []);
    const laws = schemaLawsOf(club).flatMap((law) => (law.kind === "pattern" ? [law] : []));
    const namesBy = (rows: readonly (readonly [RegexText<string>, LawName])[]) =>
      laws.map((law) => [law, patternNameIn(club.relations, new Map(rows), law)] as const);

    assert.deepStrictEqual(
      namesBy([
        [code, "Key text bound"],
        [alias, "XML production"],
      ]),
      [
        [clubLaw("alias"), Option.some<LawName>("XML production")],
        [clubLaw("code"), Option.some<LawName>("Key text bound")],
        [clubLaw("joined"), Option.some<LawName>("Key text bound")],
      ],
    );
    assert.deepStrictEqual(namesBy([[code, "Key text bound"]]), [
      [clubLaw("alias"), Option.none<LawName>()],
      [clubLaw("code"), Option.some<LawName>("Key text bound")],
      [clubLaw("joined"), Option.some<LawName>("Key text bound")],
    ]);
  });

  it(
    "names two fields of one pattern apart: Node.chars an XML production, OpenElementName.namespace a key text's bound",
    () => {
      // Oracle: grizzle's per-field pattern law, its relation and field beside the patterns the
      // field spells (changeset.ts's Law), and the classes of `textLaws`: a node's characters
      // and a foreign namespace name are both `Char*`, but only the name is bounded, so a refusal
      // of the one is crust's production and of the other the stated limit.
      const chars = statedPatternLaw("Node", "chars");
      const namespace = statedPatternLaw("OpenElementName", "namespace");

      assert.deepStrictEqual(
        chars.patterns,
        namespace.patterns,
        "the two fields spell one pattern",
      );
      assert.isFalse(sameLaw(chars, namespace));
      assert.deepStrictEqual(
        [lawNameOf(chars), lawNameOf(namespace)],
        [Option.some("XML production"), Option.some("Key text bound")],
      );
    },
    testTimeoutMs,
  );
});

describe("the census of the composed Qti schema", () => {
  it.effect(
    "names every law Qti states, and lists every merged axis's rules each once, most specific first",
    (ctx) =>
      // Oracle: grizzle's laws (`lawsOf`), every law an outcome over Qti can name: each primary
      // key, each statement's laws, each contract, each pattern law and each generated field's law.
      Effect.gen(function* census() {
        const laws = schemaLawsOf(Qti);
        const unowned = laws
          .filter((law) => Option.isNone(lawNameOf(law)))
          .map((law) => Formatter.format(law));

        assert.deepStrictEqual(unowned, [], "laws Qti states that no row of the table owns");

        const axes = mergedAxes(laws);
        for (const { laws: carried } of axes) {
          assertRules(carried);
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${String(laws.length)} laws, ${String(axes.length)} merged axes`,
            "the census",
          ),
        );
      }),
    testTimeoutMs,
  );

  it(
    "names in each table only what Qti states, each once: a stored relation, a generated field, a contract, a pattern law's field's type",
    () => {
      // Oracle: grizzle's laws (`lawsOf`): each primary key's relation, each generated field's
      // relation and field, each contract's name, and each pattern law's field's type, read from
      // the schema's own descriptor. A row the schema no longer states, a key named twice, and a
      // text type that types no field with a pattern law each fail here.
      const laws = schemaLawsOf(Qti);
      const held = {
        contract: new Set(laws.flatMap((law) => (law.kind === "contract" ? [law.contract] : []))),
        generated: new Set(
          laws.flatMap((law) => (law.kind === "generated" ? [`${law.relation}.${law.field}`] : [])),
        ),
        primaryKey: new Set(
          laws.flatMap((law) => (law.kind === "primaryKey" ? [law.relation] : [])),
        ),
      };
      const typed: ReadonlySet<unknown> = new Set(
        laws.flatMap((law) =>
          law.kind === "pattern" ? Option.toArray(patternTypeOf(Qti.relations, law)) : [],
        ),
      );

      for (const [table, named, stated] of [
        ["keyNames", keyNames, held.primaryKey],
        ["generatedNames", generatedNames, held.generated],
        ["contractNames", contractNames, held.contract],
      ] as const) {
        assert.deepStrictEqual(repeatedIn(named), [], `${table}: keys named twice`);
        assert.deepStrictEqual(
          named.flatMap(([row]) => (stated.has(row) ? [] : [row])),
          [],
          `${table}: rows that name no law Qti states`,
        );
      }
      assert.deepStrictEqual(
        [...textLaws.keys()]
          .filter((type) => !typed.has(type))
          .map((type) => Formatter.format(type.patterns)),
        [],
        "rows of textLaws that type no field with a pattern law",
      );
    },
    testTimeoutMs,
  );

  it(
    "refuses a site that names no document by its kind's law: an include under include-target, a section ref under entry-kind",
    () => {
      // Oracle: the specification as a checker, reading 115 and information model §7.5: an
      // include whose path an entry holds but that names no document the manifest lists, or that
      // writes no href that names a path of the package, breaks "Include target", the oracle's law
      // for includes alone; a section ref whose path names no section document breaks "Document
      // entry" on its path, its SitePath, which every section ref has; and a site whose path no
      // entry holds breaks "File exists", its SitePath's check, which gates both. Each is a law Qti
      // states, under its own rule, so a dangling site of either kind is refused under one rule.
      const stated = schemaLawsOf(Qti);
      const kinds: readonly (readonly [LawSide, LawSide, Rule])[] = [
        [sideOf("SitePath", "node"), sideOf("SiteTarget", "node"), "include-target"],
        [sideOf("Site", "node", "kind"), sideOf("SitePath", "node", "kind"), "include-target"],
        [sideOf("SitePath", "package", "path"), sideOf("Entry", "package", "path"), "file-exists"],
        [
          sideOf("SitePath", "package", "path"),
          sideOf("TestDocument", "package", "path"),
          "entry-kind",
        ],
        [sideOf("Site", "node"), sideOf("SitePath", "node"), "entry-kind"],
      ];

      for (const [from, to, rule] of kinds) {
        const shown = Formatter.format({ from, to });
        const laws = stated.filter(
          (law) => law.kind === "contained" && readsAs(law.from, from) && readsAs(law.to, to),
        );

        assert.isNotEmpty(laws, `${shown}: no containment Qti states`);
        for (const law of laws) {
          assert.deepStrictEqual(ruleOfLaw(law), Option.some(rule), shown);
        }
      }
    },
    testTimeoutMs,
  );

  it("names no generated field no row owns, so a field Qti gains without one fails the census", () => {
    // Oracle: grizzle's laws (`lawsOf`) of a schema of one generated field no row of
    // `generatedNames` names: its law is listed, and named none, never another law's name.
    const Planted = relation.generated(
      "Planted",
      { form: lexical(pg.bigint), node: uuid },
      ["node"],
      (r) => ({ value: generated(pg.bigint, Compute.cast(r.form, pg.bigint)) }),
    );
    const raised = schemaLawsOf(schema("Planted", { Planted }, [])).filter(
      (law) => law.kind === "generated",
    );

    assert.deepStrictEqual(raised, [{ field: "value", kind: "generated", relation: "Planted" }]);
    assert.deepStrictEqual(raised.map(lawNameOf), [Option.none()]);
  });
});
