import {
  accumulated,
  Bits,
  bits,
  check,
  closed,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  fold,
  generated,
  key,
  lexical,
  Monoid,
  mirrors,
  natural,
  on,
  ordered,
  pg,
  pred,
  relation,
  select,
  str,
  tree,
  uuid,
} from "@bjornpagen/grizzle";
import type { AnySchema, Law, LawSide, Statement } from "@bjornpagen/grizzle";
import { globSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Option, pipe, Predicate, Result, Schema } from "effect";
import { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import { composed } from "#pantry/grammar/compose.ts";
import {
  checkNameOf,
  contestedIdentities,
  explain,
  ImportRefused,
  ImportRule,
  lawIdentity,
  lawNameOf,
  lawNames,
  lawOfCheck,
  lawGroups,
  lawRules,
  lawTable,
  limitRules,
  owedRules,
  precedence,
  refusalOfLaws,
  ruleOfError,
  ruleOfLaws,
  statedLaws,
} from "#pantry/import/refusal.ts";
import type { ReadRefusal, Rule } from "#pantry/import/refusal.ts";
import {
  NotQti3,
  notQti3Reasons,
  UnmodeledVocabulary,
  unmodeledReasons,
} from "#pantry/model/shred.ts";
import { PackageReadError } from "#pantry/package/read.ts";
import { ZipRefusal } from "#pantry/package/zip.ts";
import { lawNames as oracleLawNames, lawSources, ruleOf } from "#pantry/test/oracle.ts";

/**
 * The composed grammar of production, whose rows `install.ts` installs: the constants an
 * explanation reads.
 */
const grammar = Result.getOrThrow(composed());

/**
 * A term of a side as a statement value holds it: a field's name, or `pred` of one.
 */
const TermValue = Schema.Union([
  Schema.String,
  Schema.Struct({ field: Schema.String, kind: Schema.Literal("pred") }),
]);

/**
 * A relation as a statement value names it.
 */
const Named = Schema.Struct({ name: Schema.String });

/**
 * A side as a statement value holds it: its source, a relation or a selection of one, and its
 * terms. A selection's predicate is no part of the value a statement exposes.
 */
const SideValue = Schema.Struct({
  source: Schema.Union([Named, Schema.Struct({ relation: Named })]),
  terms: Schema.NonEmptyArray(TermValue),
});

/**
 * A family statement's value: `ordered`, `counted` or `tree`, its member side and its slots.
 */
const FamilyValue = Schema.Struct({
  family: SideValue,
  kind: Schema.Literals(["counted", "ordered", "tree"]),
  root: Schema.optional(Schema.String),
  slots: Schema.Struct({ count: Schema.String, owner: Named }),
});

/**
 * Every statement value a schema of this package holds, as `schema()` keeps it in `statements`.
 */
const StatementValue = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("check"), name: Schema.String, relation: Named }),
  Schema.Struct({ kind: Schema.Literal("key"), side: SideValue }),
  Schema.Struct({
    kind: Schema.Literals(["contained", "mirrors"]),
    left: SideValue,
    right: SideValue,
  }),
  FamilyValue,
  Schema.Struct({
    end: SideValue,
    family: FamilyValue,
    kind: Schema.Literal("fold"),
    monoid: Schema.Struct({
      name: Schema.Literals(["count", "sum", "or", "twos", "max", "concat"]),
    }),
    step: SideValue,
  }),
  Schema.Struct({ kind: Schema.Literal("mutable") }),
]);

type SideRead = typeof SideValue.Type;

type FamilyRead = typeof FamilyValue.Type;

/**
 * A side read from a statement: the side as a law names it, and whether its source is a selection.
 */
interface ReadSide {
  readonly law: LawSide;
  readonly selected: boolean;
}

/**
 * Read a side as a law names it, and whether it selects: the selection is no part of a law's
 * identity, but which axis end a side is depends on it.
 *
 * @param side - The side's value.
 * @returns The law side, and whether its source is a selection.
 */
const sideRead = (side: SideRead): ReadSide => {
  const selected = "relation" in side.source;
  const terms = pipe(
    side.terms,
    Arr.map((t): LawSide["terms"][number] =>
      Predicate.isString(t) ? { field: t, kind: "field" } : t,
    ),
  );

  return {
    law: {
      relation: "relation" in side.source ? side.source.relation.name : side.source.name,
      selection: { conjuncts: [] },
      terms,
    },
    selected,
  };
};

/**
 * Read a family statement's law, as grizzle's outcome names it (README, "Every rule an outcome can
 * name": `family` by its order, member and slots; `tree` by its member, slots and root).
 *
 * @param family - The family's value.
 * @returns The law.
 */
const familyLawOf = (family: FamilyRead): Law => {
  const member = sideRead(family.family).law;
  const slots = { count: family.slots.count, owner: family.slots.owner.name };

  return family.kind === "tree"
    ? { kind: "tree", member, root: family.root ?? "", slots }
    : { kind: "family", member, order: family.kind, slots };
};

/**
 * Read the laws a statement states, as an `invariant-rejected` outcome names them: a mirrors is its
 * two containments and a `mutable` states none (README, "Errors and outcomes").
 *
 * @param statement - A statement value of a schema.
 * @returns Its laws, or the refusal of a statement value no law reads.
 */
const lawsOfStatement = (statement: Statement): Result.Result<readonly Law[], string> =>
  Result.map(
    Result.mapError(Schema.decodeUnknownResult(StatementValue)(statement), String),
    (read): readonly Law[] => {
      if (read.kind === "check") {
        return [{ kind: "check", name: read.name, relation: read.relation.name }];
      }

      if (read.kind === "key") {
        return [{ kind: "key", side: sideRead(read.side).law }];
      }

      if (read.kind === "contained" || read.kind === "mirrors") {
        const left = sideRead(read.left).law;
        const right = sideRead(read.right).law;
        const there: Law = { from: left, kind: "contained", to: right };

        return read.kind === "contained"
          ? [there]
          : [there, { from: right, kind: "contained", to: left }];
      }

      if (read.kind === "fold") {
        return [
          {
            end: sideRead(read.end).law,
            family: { count: read.family.slots.count, owner: read.family.slots.owner.name },
            kind: "fold",
            monoid: read.monoid.name,
            step: sideRead(read.step).law,
          },
        ];
      }

      return "slots" in read ? [familyLawOf(read)] : [];
    },
  );

/**
 * The primary key of every stored relation of a schema, as its law.
 *
 * @param relations - The schema's `relations`.
 * @returns The laws.
 */
const primaryKeysOf = (relations: AnySchema["relations"]): readonly Law[] =>
  Object.values(relations).flatMap((value) =>
    Option.toArray(
      Option.map(
        Schema.decodeUnknownOption(
          Schema.Struct({
            kind: Schema.Literal("relation"),
            name: Schema.String,
            primaryKey: Schema.Array(Schema.String),
          }),
        )(value),
        ({ name, primaryKey }): Law => ({ fields: primaryKey, kind: "primaryKey", relation: name }),
      ),
    ),
  );

/**
 * One axis of a family and every law its foreign key carries.
 */
interface Axis {
  readonly label: string;
  readonly laws: Arr.NonEmptyReadonlyArray<Law>;
}

/**
 * Whether a side's terms begin with `prefix`, each a field or `pred` of the same field.
 *
 * @param side - The side.
 * @param prefix - The terms.
 * @returns Whether they begin it.
 */
const beginsWith = (side: LawSide, prefix: readonly LawSide["terms"][number][]): boolean =>
  prefix.every((term, at) => {
    const own = side.terms[at];

    return own !== undefined && own.kind === term.kind && own.field === term.field;
  });

/**
 * Read the axes of every family of a schema, each with the laws its foreign key carries: the
 * family's own law, every containment that rides the axis, and on the predecessor and last axes
 * every fold over the family.
 *
 * It restates grizzle's riding rule (`analysis/theory/families.ts` `axisShapes` and `ridesOf`, at
 * 4016b69): the owner axis is member `F(g…)` to owner `O(k…)`; the predecessor axis
 * `F(g…, pred(i))` to `F(g…, i)` and the last axis `O(k…, pred(n))` to `F(g…, i)` for a family
 * whose index is a field. A tree's member ends read its members, a selection, and every other end
 * reads every fact; a statement value shows a selection but not its predicate, so the reader takes
 * any selection of a tree's member for the members.
 *
 * @param statements - The schema's statement values.
 * @param relations - Its relations, for each owner's primary key.
 * @returns The axes.
 */
const mergedAxes = (
  statements: readonly Statement[],
  relations: AnySchema["relations"],
): readonly Axis[] => {
  const decoded = statements.flatMap((s) =>
    Option.toArray(Schema.decodeUnknownOption(StatementValue)(s)),
  );
  const keys = new Map(
    primaryKeysOf(relations).flatMap((law) =>
      law.kind === "primaryKey" ? [[law.relation, law.fields] as const] : [],
    ),
  );
  const containments = decoded.flatMap((read) =>
    read.kind === "contained" ? [{ left: sideRead(read.left), right: sideRead(read.right) }] : [],
  );

  return decoded.flatMap((read): readonly Axis[] => {
    if (read.kind !== "counted" && read.kind !== "ordered" && read.kind !== "tree") {
      return [];
    }

    const own = familyLawOf(read);
    const member = sideRead(read.family);
    const owner = read.slots.owner.name;
    const isTree = read.kind === "tree";
    const { terms } = member.law;
    const group = read.kind === "counted" ? [...terms] : terms.slice(0, -1);
    const index = read.kind === "counted" ? undefined : terms.at(-1);
    const ownerKey = (keys.get(owner) ?? []).map((field) => ({ field, kind: "field" as const }));
    const folds = decoded.flatMap((other): readonly Law[] =>
      other.kind === "fold" &&
      other.family.slots.owner.name === owner &&
      other.family.slots.count === read.slots.count
        ? Result.getOrElse(lawsOfStatement(other), () => [])
        : [],
    );
    const riding = (
      from: { readonly relation: string; readonly members: boolean },
      to: { readonly relation: string; readonly members: boolean },
      fromKey: readonly LawSide["terms"][number][],
      toKey: readonly LawSide["terms"][number][],
    ): readonly Law[] =>
      containments
        .filter(
          ({ left, right }) =>
            left.law.relation === from.relation &&
            right.law.relation === to.relation &&
            left.selected === (from.members && isTree) &&
            right.selected === (to.members && isTree) &&
            beginsWith(left.law, fromKey) &&
            beginsWith(right.law, toKey),
        )
        .map(({ left, right }): Law => ({ from: left.law, kind: "contained", to: right.law }));
    const ownerAxis: Axis = {
      label: `${member.law.relation} owner`,
      laws: [
        own,
        ...riding(
          { members: true, relation: member.law.relation },
          { members: false, relation: owner },
          group,
          ownerKey,
        ),
      ],
    };
    if (index === undefined) {
      return [
        ownerAxis,
        { label: `${member.law.relation} predecessor and last`, laws: [own, ...folds] },
      ];
    }

    return [
      ownerAxis,
      {
        label: `${member.law.relation} predecessor`,
        laws: [
          own,
          ...riding(
            { members: true, relation: member.law.relation },
            { members: true, relation: member.law.relation },
            [...group, { field: index.field, kind: "pred" }],
            [...group, index],
          ),
          ...folds,
        ],
      },
      {
        label: `${member.law.relation} last`,
        laws: [
          own,
          ...riding(
            { members: false, relation: owner },
            { members: true, relation: member.law.relation },
            [...ownerKey, { field: read.slots.count, kind: "pred" }],
            [...group, index],
          ),
          ...folds,
        ],
      },
    ];
  });
};

/**
 * A scratch schema's statements, in the shapes `node.ts` and `attributes.ts` state, built with
 * grizzle's own constructors: a tree with its parent copy, predecessor copy, last slot, `Follow`
 * step and two count folds, an ordered family with its owner copy and `or` fold, and a counted
 * family whose owner copy rides its owner axis.
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

  return {
    relations: { Attribute, Binding, Choice, Follow, Kind, Name, Node, Pos, Slot, Version },
    statements: [
      nodeTree,
      contained(
        on(members, "parent", "version", "parentKind", "parentNearest"),
        on(Node, "id", "version", "kind", "nearest"),
      ),
      contained(
        on(members, "version", "parentKind", "was", "state"),
        on(Follow, "version", "parent", "from", "to"),
      ),
      contained(on(members, "parent", pred("at"), "was"), on(members, "parent", "at", "state")),
      contained(
        on(Node, "id", pred("children"), "lastState"),
        on(members, "parent", "at", "state"),
      ),
      fold(
        nodeTree,
        Monoid.count,
        on(members, "parent", "elementsWas", "elements"),
        on(Node, "id", "elementChildren"),
      ),
      fold(
        nodeTree,
        Monoid.count,
        on(
          select(Node, (n) => n.and(n.gt(n.start, 0n), n.eq(n.state, "2"))),
          "parent",
        ),
        on(Node, "id", "countedChildren"),
      ),
      check("N1_sentinel", Node, (n) => n.or(n.gt(n.start, 0n), n.eq(n.state, "0"))),
      attributeFamily,
      contained(on(Attribute, "node", "kind", "document"), on(Node, "id", "kind", "document")),
      fold(
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
      ),
      choiceFamily,
      contained(on(Choice, "interaction"), on(Binding, "node")),
      mirrors(on(Choice, "node"), on(Node, "id")),
      key(on(Choice, "interaction", "identifier")),
    ],
  } as const;
})();

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
 * Read the laws a list of statement values states, failing the test on a value no law reads.
 *
 * @param statements - The values.
 * @returns The laws, in statement order.
 */
const lawsOf = (statements: readonly Statement[]) =>
  Effect.all(statements.map((statement) => Effect.fromResult(lawsOfStatement(statement)))).pipe(
    Effect.map((laws) => laws.flat()),
  );

/**
 * Collect the laws of {@link statedLaws} named `name` whose identity holds `part`.
 *
 * @param name - The law's name.
 * @param part - A part of the identity, empty for every law of the name.
 * @returns The laws.
 */
const statedNamed = (name: keyof typeof lawTable, part = ""): readonly Law[] =>
  statedLaws.flatMap(([law, owner]) =>
    owner === name && lawIdentity(law).includes(part) ? [law] : [],
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
    "slider-bounds",
    "max-strings-required",
    "aria-value-range",
    "varref-copy",
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
    "item-duration",
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
    "root-type-reverse",
    "entry-kind",
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
 * Read the rule of each law of a set by its name.
 *
 * @param laws - The laws.
 * @returns Their rules, one per law the table owns.
 */
const rulesOf = (laws: readonly Law[]): readonly Rule[] =>
  laws.flatMap((law) => Option.toArray(Option.map(lawNameOf(law), (name) => lawTable[name].rule)));

/**
 * Check one set of laws one native object carries: it resolves to exactly one rule, one of its
 * laws', of the most specific tier among them, whatever their order or repeats.
 *
 * @param laws - The laws, in any order, with any repeats.
 */
const assertResolves = (laws: Arr.NonEmptyReadonlyArray<Law>): void => {
  const identities = laws.map(lawIdentity).join(" & ");
  const rule = ruleOfLaws(laws);
  const reversed = Arr.reverse(laws);
  const once = Arr.dedupeWith(laws, (a, b) => lawIdentity(a) === lawIdentity(b));

  assert.isTrue(Option.isSome(rule), identities);
  assert.deepStrictEqual(ruleOfLaws(reversed), rule, identities);
  assert.deepStrictEqual(ruleOfLaws(once), rule, identities);
  if (Option.isSome(rule)) {
    const rules = rulesOf(laws);
    assert.include(rules, rule.value, identities);
    assert.strictEqual(tierOf(rule.value), Math.min(...rules.map(tierOf)), identities);
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
    statedNamed("E1 derived", "fold over Node.children"),
  ),
  plannedAxis(
    "Node last",
    "ordering",
    statedNamed("N2 tree"),
    statedNamed("N7 last slot"),
    statedNamed("N5 fold", "fold over"),
    statedNamed("N7 Counted"),
    statedNamed("N7 barred by"),
    statedNamed("E1 derived", "fold over Node.children"),
  ),
  plannedAxis(
    "Attribute owner",
    "attribute-admission",
    statedNamed("AL2 count", "family"),
    statedNamed("AL1 owner", "Attribute(node, kind"),
  ),
  plannedAxis(
    "Attribute predecessor and last",
    "attribute-admission",
    statedNamed("AL2 count", "family"),
    statedNamed("AL2 fold"),
  ),
  plannedAxis(
    "OpenAttributeName owner",
    "attribute-admission",
    statedNamed("AL4 open names", "family"),
    statedNamed("AL1 owner", "OpenAttributeName"),
  ),
  plannedAxis(
    "Idref owner",
    "attribute-admission",
    statedNamed("E1 derived", "family Attribute.idrefs"),
    statedNamed("AL1 owner", "Idref"),
  ),
  plannedAxis(
    "Idref predecessor and last",
    "derived",
    statedNamed("E1 derived", "family Attribute.idrefs"),
    statedNamed("E1 derived", "fold over Attribute.idrefs"),
  ),
  plannedAxis("Namespace", "reachability", statedNamed("Namespace family", "family")),
  plannedAxis(
    "Choice",
    "owner-copy",
    statedNamed("N8 nearest", "counted family Interaction.choices"),
  ),
]);

/**
 * The laws one refusal may name together across the tiers: a law of each tier, a family law of
 * the QTI tier among them, so a set drawn from it meets every pair of tiers.
 */
const crossTier = nonEmpty("the cross-tier laws", [
  ...statedNamed("Binding declared", "Declaration(declaration"),
  ...statedNamed("Choice bounds"),
  { kind: "check", name: checkNameOf("MathML arity"), relation: "Node" } satisfies Law,
  ...statedNamed("AL1 owner", "Attribute(node, kind"),
  { kind: "check", name: checkNameOf("N5 Follow"), relation: "Node" } satisfies Law,
  ...statedNamed("N7 last slot"),
  ...statedNamed("N2 tree"),
  ...statedNamed("E1 derived", "fold over Node.children"),
]);

describe("the law table", () => {
  it("keeps every law of the oracle under its name, with the oracle's rule and source", () => {
    for (const name of oracleLawNames) {
      assert.isTrue(Object.hasOwn(lawTable, name), name);

      const entry = lawTable[name];
      assert.strictEqual(entry.rule, ruleOf(name), name);
      assert.strictEqual(entry.source, lawSources[name], name);
    }
  });

  it("names every law's check by a bijection with check names, over every law of the table and the oracle", () => {
    const names = [...new Set([...lawNames, ...oracleLawNames])];
    const checks = new Set(names.map((name) => checkNameOf(name)));

    assert.strictEqual(checks.size, names.length, "two laws share a check name");
    for (const name of names) {
      assert.match(checkNameOf(name), /^[A-Za-z0-9_]+$/u, name);
      assert.deepStrictEqual(lawOfCheck(checkNameOf(name)), Option.some(name), name);
    }

    assert.isTrue(Option.isNone(lawOfCheck("No_such_law")));
  });

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

  it("states each law once, and no stated law's identity is a check's", () => {
    const identities = statedLaws.map(([law]) => lawIdentity(law));

    assert.strictEqual(new Set(identities).size, identities.length, "a law is stated twice");
    assert.deepStrictEqual(
      identities.filter((identity) => identity.startsWith("check ")),
      [],
    );
    assert.strictEqual(lawRules.size, lawNames.length + identities.length);
  });

  it.effect(
    "names every law of a group by the group's name, but the laws Q5.13 names otherwise",
    () =>
      Effect.gen(function* groups() {
        const otherwise: ReadonlyMap<string, ReadonlySet<string>> = new Map([
          [
            "E1 derived",
            new Set([
              "LomObjectIdentifier",
              "LomObjectTitle",
              "LOM learning resource type",
              "Node key",
              "DocumentId key",
              "Binding declared",
              "BindingFit",
              "RecordBindingFit",
              "Binding unique",
              "Binding cardinality",
              "Max strings required",
              "Adaptive feedback",
              "N8 nearest",
              "Choice identifier key",
              "Feedback reference",
              "Template reference",
              "Printed variable reference",
              "Context variable reference",
              "Variable reference copy",
              "Variable declared",
              "Prefixed reference",
              "Variable kind",
              "Template default target",
              "Variable mapping source",
              "Arity",
            ]),
          ],
          ["Mapping overlay", new Set(["Map key", "MappableBaseType", "DocumentId key"])],
          ["Item ref target", new Set(["E1 derived"])],
          [
            "Test overlay",
            new Set([
              "Structure identifier",
              "Document entry",
              "Selection required",
              "DocumentId key",
              "Variable mapping target",
              "Stimulus ref key",
              "Include target",
              "Include root",
              "E1 derived",
            ]),
          ],
          ["Inclusion cycle", new Set(["E1 derived", "Test overlay"])],
        ]);
        for (const [statements, name] of lawGroups) {
          for (const law of yield* lawsOf(statements)) {
            const named = lawNameOf(law);
            if (law.kind === "check" || contestedIdentities.has(lawIdentity(law))) {
              continue;
            }

            assert.isTrue(Option.isSome(named), lawIdentity(law));

            const owner = Option.getOrElse(named, () => "");
            assert.isTrue(
              owner === name || (otherwise.get(name)?.has(owner) ?? false),
              `${lawIdentity(law)}: ${owner}, in the group of ${name}`,
            );
          }
        }
      }),
  );

  it("gives every stated law alone its own name's rule", () => {
    for (const [law, name] of statedLaws) {
      assert.deepStrictEqual(ruleOfLaws([law]), Option.some(lawTable[name].rule), name);
      assert.deepStrictEqual(lawRules.get(lawIdentity(law)), lawTable[name].rule, name);
    }
  });
});

describe("a law's identity, read from a statement as the outcome names it", () => {
  it.effect(
    "reads every statement of a scratch schema as the README's outcome table names its law",
    () =>
      Effect.gen(function* identities() {
        const laws = yield* lawsOf(scratch.statements);

        assert.deepStrictEqual(laws.map(lawIdentity), [
          "tree Node.children by document",
          "contained Node(parent, version, parentKind, parentNearest) in Node(id, version, kind, nearest)",
          "contained Node(version, parentKind, was, state) in Follow(version, parent, from, to)",
          "contained Node(parent, pred(at), was) in Node(parent, at, state)",
          "contained Node(id, pred(children), lastState) in Node(parent, at, state)",
          "count fold over Node.children into Node(id, elementChildren)",
          "count fold over Node.children into Node(id, countedChildren)",
          "check N1_sentinel",
          "ordered family Node.attributes",
          "contained Attribute(node, kind, document) in Node(id, kind, document)",
          "or fold over Node.attributes into Node(id, attrs)",
          "counted family Binding.choices",
          "contained Choice(interaction) in Binding(node)",
          "contained Choice(node) in Node(id)",
          "contained Node(id) in Choice(node)",
          "key Choice(interaction, identifier)",
        ]);
        assert.deepStrictEqual(primaryKeysOf(scratch.relations).map(lawIdentity).toSorted(), [
          "primary key Attribute(node, at)",
          "primary key Binding(node)",
          "primary key Choice(node)",
          "primary key Node(id)",
        ]);
      }),
  );

  it("reads every merged axis of the scratch schema as grizzle generates its foreign key", () => {
    const axes = mergedAxes(scratch.statements, scratch.relations);

    assert.deepStrictEqual(
      Object.fromEntries(axes.map(({ label, laws }) => [label, laws.map(lawIdentity)])),
      {
        "Attribute last": [
          "ordered family Node.attributes",
          "or fold over Node.attributes into Node(id, attrs)",
        ],
        "Attribute owner": [
          "ordered family Node.attributes",
          "contained Attribute(node, kind, document) in Node(id, kind, document)",
        ],
        "Attribute predecessor": [
          "ordered family Node.attributes",
          "or fold over Node.attributes into Node(id, attrs)",
        ],
        "Choice owner": [
          "counted family Binding.choices",
          "contained Choice(interaction) in Binding(node)",
        ],
        "Choice predecessor and last": ["counted family Binding.choices"],
        "Node last": [
          "tree Node.children by document",
          "contained Node(id, pred(children), lastState) in Node(parent, at, state)",
          "count fold over Node.children into Node(id, elementChildren)",
          "count fold over Node.children into Node(id, countedChildren)",
        ],
        "Node owner": [
          "tree Node.children by document",
          "contained Node(parent, version, parentKind, parentNearest) in Node(id, version, kind, nearest)",
        ],
        "Node predecessor": [
          "tree Node.children by document",
          "contained Node(parent, pred(at), was) in Node(parent, at, state)",
          "count fold over Node.children into Node(id, elementChildren)",
          "count fold over Node.children into Node(id, countedChildren)",
        ],
      },
    );
  });

  it("keys a host-side key conflict as the database's: the key law, whatever its witness", () => {
    const law: Law = { kind: "key", side: sideOf("Namespace", "node", "prefix") };
    const witnesses = [
      { kind: "key", relation: "Namespace", values: { node: "n", prefix: "p" } },
      { kind: "unreported" },
    ] as const;

    for (const witness of witnesses) {
      const refused = refusalOfLaws([law], witness, grammar);
      assert.isTrue(Result.isSuccess(refused), witness.kind);
      if (Result.isSuccess(refused)) {
        assert.strictEqual(refused.success.rule, "reachability");
      }
    }

    const keyed = refusalOfLaws([law], witnesses[0], grammar);
    if (Result.isSuccess(keyed)) {
      assert.include(keyed.success.detail, "prefix=p");
    }
  });

  it("refuses to name a rule for laws no row states, naming each law", () => {
    const law: Law = { from: sideOf("Nowhere", "x"), kind: "contained", to: sideOf("Node", "id") };
    const refused = refusalOfLaws([law], { kind: "unreported" }, grammar);

    assert.isTrue(Result.isFailure(refused));
    if (Result.isFailure(refused)) {
      assert.deepStrictEqual(refused.failure.laws, [lawIdentity(law)]);
    }

    assert.isTrue(Option.isNone(ruleOfLaws([law])));
  });
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
 * @returns Its axis and its laws' identities.
 */
const carriedText = ({ axis, laws }: Carried): string =>
  `${axis}: ${laws.map(lawIdentity).join(" & ")}`;

describe("the precedence over the laws one native object carries", () => {
  it("resolves each planned axis whole to the rule the spec's order names", () => {
    for (const { label, laws, rule } of plannedAxes) {
      assert.isAbove(laws.length, 0, label);
      assert.deepStrictEqual(ruleOfLaws(laws), Option.some(rule), label);
    }
  });

  it.effect(
    "resolves every sequence of at most 4 of each planned axis's laws, any order and repeats, to one rule of its most specific tier",
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

              assertResolves(carried.laws);
            }),
        ),
      ),
  );

  it.effect(
    "resolves every sequence of at most 3 laws across the tiers to one rule of its most specific tier",
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
              assertResolves(carried.laws);
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
 * Every content model `Follow` or `Last` holds, with its states: the exhaustion's space, one case
 * per model.
 */
const models: Arr.NonEmptyReadonlyArray<Arr.NonEmptyReadonlyArray<ModelState>> = nonEmpty(
  "the content models",
  [...Map.groupBy(modelStates, ({ parent, version }) => `${version} ${parent}`).values()].map(
    (states) => nonEmpty("a model's states", states),
  ),
);

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
            box: `every state of every content model Follow or Last holds (${String(models.length)} models, ${String(modelStates.length)} states)`,
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<"allows next" | "allows nothing">([
              "allows next",
              "allows nothing",
            ]),
            generator: element<Arr.NonEmptyReadonlyArray<ModelState>>(models),
            limit: 2000,
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
    120_000,
  );

  it("names no positions where the witness gives no row, and every law's source", () => {
    for (const laws of [follow, last]) {
      const [first, ...rest] = laws;
      if (first === undefined) {
        assert.fail("no content-order law is stated");
      }

      const explained = explain([first, ...rest], { kind: "unreported" }, grammar);
      assert.isTrue(Option.isNone(explained.next));
      assert.include(explained.detail, "the database names no row");
      assert.include(explained.sources, lawTable[Option.getOrThrow(lawNameOf(first))].source);
    }
  });
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
          "bare-utf16",
          "nul-or-surrogate",
          "undeclared-entity",
          "entity-cycle",
          "entity-expansion",
        ] as const
      ).map((rule) => [new ReaderRefusal({ detail: "d", rule }), "reader-refusal"] as const),
      [
        new WellFormednessError({ afterSubstitution: false, column: 1, line: 1, message: "m" }),
        "well-formedness",
      ],
    ];

    for (const [error, rule] of cases) {
      assert.strictEqual(ruleOfError(error).rule, rule, error._tag);
    }

    const refused = new ImportRefused({ detail: "x", rule: "admission" });
    assert.strictEqual(ruleOfError(refused), refused);
  });
});

/**
 * The stored relations each module of `src/qti/` exports, by relation name, read from the modules
 * themselves, so the census names the module that owes a pattern's export whatever lands there.
 */
const modulesOf = Effect.gen(function* modulesOf() {
  const root = path.resolve(import.meta.dirname, "..");
  const files = globSync("qti/*.ts", { cwd: root }).filter((file) => !file.endsWith(".test.ts"));
  const Exported = Schema.Record(Schema.String, Schema.Unknown);
  const Stored = Schema.Struct({ kind: Schema.Literal("relation"), name: Schema.String });
  const owners = new Map<string, string>();
  for (const file of files.toSorted()) {
    const loaded: unknown = yield* Effect.promise(
      () => import(pathToFileURL(path.join(root, file)).href),
    );
    for (const value of Object.values(
      Option.getOrElse(Schema.decodeUnknownOption(Exported)(loaded), () => ({})),
    )) {
      for (const { name } of Option.toArray(Schema.decodeUnknownOption(Stored)(value))) {
        if (!owners.has(name)) {
          owners.set(name, `src/${file}`);
        }
      }
    }
  }

  return owners;
});

/**
 * Every text field of a schema's stored relations, with its pattern law. A field's type is read as
 * any value, as {@link generatedLaws} reads it, so a relation with a function-valued type
 * (`MapKeyFloat`'s `pg["double precision"]`) is read, and a pattern of another shape throws.
 *
 * @param relations - The schema's `relations`.
 * @returns Each relation's text fields.
 */
const patternFields = (
  relations: AnySchema["relations"],
): readonly { readonly field: string; readonly law: Law; readonly relation: string }[] => {
  const Pattern = Schema.Struct({ flags: Schema.Literals(["u", "su"]), source: Schema.String });
  const Stored = Schema.Struct({
    fields: Schema.Record(Schema.String, Schema.Unknown),
    kind: Schema.Literal("relation"),
    name: Schema.String,
  });

  return Object.values(relations).flatMap((value) =>
    Option.toArray(Schema.decodeUnknownOption(Stored)(value)).flatMap(({ fields, name }) =>
      Object.entries(fields).flatMap(([field, type]) =>
        Predicate.hasProperty(type, "pattern") && type.pattern !== undefined
          ? [
              {
                field,
                law: {
                  ...Schema.decodeUnknownSync(Pattern)(type.pattern),
                  kind: "pattern",
                } satisfies Law,
                relation: name,
              },
            ]
          : [],
      ),
    ),
  );
};

/**
 * The law of every generated field of a schema's stored relations, which grizzle names when the
 * field's column is NULL at a row (23502): it maps every generated column, whatever its term reads.
 * A field's type is read as any value, since some are functions (`pg["double precision"]` is
 * `pg.float(p)`'s), so every stored relation decodes and none drops out of the census unread.
 *
 * @param relations - The schema's `relations`.
 * @returns Each generated field's law.
 */
const generatedLaws = (relations: AnySchema["relations"]): readonly Law[] => {
  const Stored = Schema.Struct({
    fields: Schema.Record(Schema.String, Schema.Unknown),
    kind: Schema.Literal("relation"),
    name: Schema.String,
  });

  return Object.values(relations).flatMap((value) =>
    Option.toArray(Schema.decodeUnknownOption(Stored)(value)).flatMap(({ fields, name }) =>
      Object.entries(fields).flatMap(([field, type]): readonly Law[] =>
        Predicate.hasProperty(type, "writing") && type.writing === "generated"
          ? [{ field, kind: "generated", relation: name }]
          : [],
      ),
    ),
  );
};

/**
 * The generated laws of a schema's relations that no row of the table owns, by identity.
 *
 * @param relations - The schema's `relations`.
 * @returns The identities, which an outcome naming one would refuse to rule.
 */
const unownedGenerated = (relations: AnySchema["relations"]): readonly string[] =>
  generatedLaws(relations)
    .map(lawIdentity)
    .filter((identity) => !lawRules.has(identity));

/**
 * The composed `Qti` schema, loaded by the census alone: it composes every `src/qti/` module that
 * has landed, and reading it runs `install.ts`'s generators.
 */
const composedQti = Effect.promise(() => import("#pantry/qti/schema.ts")).pipe(
  Effect.map(({ Qti }) => Qti),
);

describe("the census of the composed Qti schema", () => {
  it.effect(
    "owns every statement and primary key of Qti, and resolves every merged axis of its families to one rule",
    (ctx) =>
      Effect.gen(function* census() {
        const Qti = yield* composedQti;
        const laws = [...(yield* lawsOf(Qti.statements)), ...primaryKeysOf(Qti.relations)];
        const unowned = laws.map(lawIdentity).filter((identity) => !lawRules.has(identity));

        assert.deepStrictEqual(unowned, [], "laws Qti states that no row of the table owns");

        const axes = mergedAxes(Qti.statements, Qti.relations);
        for (const { laws: carried } of axes) {
          assertResolves(carried);
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${String(laws.length)} laws, ${String(axes.length)} merged axes`,
            "the census",
          ),
        );
      }),
    120_000,
  );

  it.effect(
    "states no law of a statement's kind that Qti does not state, so a renamed field leaves no row behind",
    () =>
      // Oracle: the schema's own statements, read by this file's reader: a row of the table that
      // names a containment, key, fold or family no statement of Qti states names no law an outcome
      // can carry, and the law it meant falls to its group's name (the LOM title's two rows, stale
      // since ad1b20b5 renamed LomTitleString's text and language, and N5's and N7's containments,
      // which Qti states as checks).
      Effect.gen(function* staleRows() {
        const Qti = yield* composedQti;
        const stated = new Set((yield* lawsOf(Qti.statements)).map(lawIdentity));
        const statementKinds: ReadonlySet<string> = new Set([
          "contained",
          "family",
          "fold",
          "key",
          "tree",
        ]);

        assert.deepStrictEqual(
          statedLaws
            .filter(([law]) => statementKinds.has(law.kind) && !stated.has(lawIdentity(law)))
            .map(([law, name]) => `${name}: ${lawIdentity(law)}`),
          [],
          "rows of the table that name a law no statement of Qti states",
        );
      }),
    120_000,
  );

  it.effect(
    "owns the pattern law of every text field of Qti's stored relations, naming the module that owes an export",
    () =>
      Effect.gen(function* patterns() {
        const Qti = yield* composedQti;
        const moduleOf = yield* modulesOf;
        const unowned = patternFields(Qti.relations)
          .filter(({ law }) => !lawRules.has(lawIdentity(law)))
          .map(
            ({ field, relation: owner }) =>
              `${owner}.${field}, in ${moduleOf.get(owner) ?? "an unlisted module"}: export its text type and give its pattern a row of statedLaws`,
          );

        assert.deepStrictEqual(unowned, [], "text fields whose pattern no row of the table owns");
      }),
    120_000,
  );

  it.effect(
    "owns the law of every generated field of Qti's stored relations, and states no other generated law",
    () =>
      Effect.gen(function* generations() {
        const Qti = yield* composedQti;
        const raised = generatedLaws(Qti.relations).map(lawIdentity);
        const stated = statedLaws.flatMap(([law]) =>
          law.kind === "generated" ? [lawIdentity(law)] : [],
        );

        assert.isNotEmpty(raised, "Qti declares no generated field the census reads");
        assert.deepStrictEqual(
          unownedGenerated(Qti.relations),
          [],
          "generated fields whose law no row of the table owns",
        );
        assert.deepStrictEqual(
          stated.filter((identity) => !raised.includes(identity)),
          [],
          "generated laws the table states for no generated field of Qti",
        );
      }),
    120_000,
  );

  it.effect(
    "refuses a site that names no document by its kind's law: an include under include-target, a section ref under entry-kind",
    () =>
      // Oracle: the specification as a checker, reading 115 and information model §7.5: an
      // include whose href names no document the manifest lists breaks "Include target", the
      // oracle's law for includes alone, and a section ref whose href names no section document
      // breaks "Document entry" on its path. Each is a law Qti states, under its own rule, so a
      // dangling site of either kind is refused under one rule.
      Effect.gen(function* siteKinds() {
        const Qti = yield* composedQti;
        const stated = new Set((yield* lawsOf(Qti.statements)).map(lawIdentity));
        const kinds: readonly (readonly [Law, Rule])[] = [
          [
            { from: sideOf("Site", "node"), kind: "contained", to: sideOf("SiteTarget", "node") },
            "include-target",
          ],
          [
            {
              from: sideOf("Site", "package", "path"),
              kind: "contained",
              to: sideOf("TestDocument", "package", "path"),
            },
            "entry-kind",
          ],
        ];

        for (const [law, rule] of kinds) {
          assert.isTrue(stated.has(lawIdentity(law)), lawIdentity(law));
          assert.deepStrictEqual(ruleOfLaws([law]), Option.some(rule), lawIdentity(law));
        }
      }),
    120_000,
  );

  it("names a generated field no row owns, so a field Qti gains without one fails the census", () => {
    const Planted = relation.generated(
      "Planted",
      { form: lexical(pg.bigint), node: uuid },
      ["node"],
      (r) => ({ value: generated(pg.bigint, Compute.cast(r.form, pg.bigint)) }),
    );

    assert.deepStrictEqual(unownedGenerated({ Planted }), ["generated Planted.value"]);
  });
});
