/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */
/**
 * `Order`: content order as data (fin.md §17, P5).
 *
 * Every admitted (version, parent, child) carries an interval of ranks [lo, hi]. A child's state
 * is `GREATEST(was, lo)`, `was` being its predecessor's state (0 for the first child), and the
 * law is `was <= hi`. A kind its parent ranks has lo = hi = its rank, and every other kind,
 * whitespace included, has [0, ∞], so it neither moves the state nor is held by it. `Order`'s key
 * set is the admission relation, so the one constant replaces both `Admission` and the ordering
 * guards.
 *
 * The rank rules are today's, ported exactly (D3): the five `ordering` guards and P30. Where a
 * rule is not a sequence of ranks, or two rules on one parent interleave, the generator says so in
 * its report instead of hiding the difference.
 */
import { Array as Arr, Option, Order, Result, Schema } from "effect";
import { closed, dictionary } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, Field } from "#pantry/grammar/closed.ts";
import { expressionKinds } from "#pantry/schema/kinds/asi.ts";
import { kinds as drdKinds } from "#pantry/schema/kinds/drd.ts";

/**
 * The ranks a child holds under its parent. `lo` is the state the child raises its successors to,
 * and `hi` the highest predecessor state it admits.
 */
export interface Interval {
  readonly hi: number;
  readonly lo: number;
}

/**
 * The `hi` of a kind outside its parent's sequence: the largest `int2`, the type of the derived
 * `Node.hi`. No state exceeds the highest rank, so this bound bounds nothing, a null object rather
 * than an absence.
 */
export const unbounded = 32_767;

/**
 * The interval of every kind its parent does not rank, whitespace and comments included: it
 * neither raises the state nor is held by it.
 */
export const unranked: Interval = { hi: unbounded, lo: 0 };

/**
 * Where a rank rule comes from: the guard that states it today (`content`, `item`, `manifest` and
 * `usage` are the four `ordering` guards, `P30` the processing guard), or the XSD sequence that
 * settles two guard rules that interleave on one parent.
 */
export type Source = "content" | "item" | "manifest" | "P30" | "usage" | "xsd";

/**
 * Where a rule binds: its source, the parent kinds it ranks children under, and the schema
 * versions it holds in, stated once (P4).
 */
interface Binding {
  readonly parents: readonly string[];
  readonly source: Source;
  readonly versions: readonly string[];
}

/**
 * The ranks of a sequence, in order: the kinds of one inner array share a rank.
 */
type Ranks = readonly (readonly string[])[];

/**
 * A sequence the parent's children follow: the kinds of each rank come before those of the next,
 * and a kind no rank names is outside the sequence. This is the guards' rank scan, which skips the
 * kinds it does not list.
 */
export interface Sequence extends Binding {
  readonly _tag: "Sequence";
  readonly ranks: Ranks;
}

/**
 * A sequence that leads every other element: the ranked kinds come first, in rank order, and every
 * element child no rank names takes the rank after the last. Character data, comments and
 * instructions stay outside it.
 */
export interface Leading extends Binding {
  readonly _tag: "Leading";
  readonly ranks: Ranks;
}

/**
 * A kind that, when the parent holds it, is the parent's first element child.
 *
 * As ranks this is the kind, then every other element. That also refuses the kind again after
 * another element, which the guard admits, so each parent where no other rule refuses it is
 * reported.
 */
export interface First extends Binding {
  readonly _tag: "First";
  readonly kind: string;
}

/**
 * A kind that is the parent's last element child when one of its attributes holds a value. Order
 * is keyed by kinds, so it states no such rule; each parent it binds is reported.
 */
export interface LastWhere extends Binding {
  readonly _tag: "LastWhere";
  readonly attribute: string;
  readonly kind: string;
  readonly value: string;
}

/**
 * A rank rule of `Order`.
 */
export type Rule = First | LastWhere | Leading | Sequence;

/**
 * A rule that gives kinds ranks.
 */
type RankRule = First | Leading | Sequence;

/**
 * The schema versions every rule but the `table` ones holds in.
 */
const both = ["3.0.0", "3.0.1"] as const;

/**
 * Construct a sequence rule.
 *
 * @param source - The guard that states it.
 * @param parents - The parent kinds it binds.
 * @param versions - The versions it holds in.
 * @param ranks - The kinds of each rank, in order.
 * @returns The rule.
 */
const sequence = (
  source: Source,
  parents: readonly string[],
  versions: readonly string[],
  ranks: Ranks,
): Sequence => ({ _tag: "Sequence", parents, ranks, source, versions });

/**
 * Construct a leading rule.
 *
 * @param source - The guard that states it.
 * @param parents - The parent kinds it binds.
 * @param ranks - The kinds of each rank, in order, ahead of every other element.
 * @returns The rule, in both versions.
 */
const leading = (source: Source, parents: readonly string[], ranks: Ranks): Leading => ({
  _tag: "Leading",
  parents,
  ranks,
  source,
  versions: both,
});

/**
 * Construct a rank of one kind for each kind of a list, in list order.
 *
 * @param kinds - The kinds, in sequence order.
 * @returns One rank per kind.
 */
const each = (kinds: readonly string[]): Ranks => kinds.map((kind) => [kind]);

/**
 * The interactions whose first element child is their `qti-prompt` (spec 3.7), as the content
 * guard lists them.
 */
const promptHosts = [
  "qti-associate-interaction",
  "qti-choice-interaction",
  "qti-drawing-interaction",
  "qti-extended-text-interaction",
  "qti-gap-match-interaction",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-graphic-order-interaction",
  "qti-hotspot-interaction",
  "qti-hottext-interaction",
  "qti-match-interaction",
  "qti-media-interaction",
  "qti-order-interaction",
  "qti-select-point-interaction",
  "qti-slider-interaction",
  "qti-upload-interaction",
];

/**
 * The containers whose body is `qti-stylesheet*, qti-content-body, qti-catalog-info?`, each beside
 * the one content-body kind it admits. The content guard ranks any kind named `qti-content-body…`
 * second, and each host admits exactly one.
 */
const bodyHosts = [
  ["qti-feedback-block", "qti-content-body.feedback"],
  ["qti-feedback-block.template", "qti-content-body.template"],
  ["qti-modal-feedback", "qti-content-body.modal"],
  ["qti-rubric-block", "qti-content-body.rubric"],
  ["qti-template-block", "qti-content-body.template"],
  ["qti-template-block.rubric", "qti-content-body.rubricTemplate"],
] as const;

/**
 * The processing branches whose expression comes before their rules.
 */
const branches = [
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-response-else-if",
  "qti-response-if",
  "qti-template-else-if",
  "qti-template-if",
];

/**
 * The rank rules `Order` is built from: the five ordering guards and P30, ported exactly, and the
 * one XSD sequence that settles where two of them interleave.
 *
 * - `content` is `orderingOf` in `import/guards/content.ts`: `table` per version, `details`,
 *   `picture`, the body hosts, the prompt hosts, `qti-gap-match-interaction`, and the default
 *   hotspot that ends its interaction.
 * - `item` is `itemOrder` in `import/guards/item.ts`.
 * - `manifest` is the four sequences of `ordering` in `import/guards/manifest.ts`.
 * - `usage` is `ordering` in `import/guards/usage.ts`: a statistic's target objects before its value
 *   or mapping, one rule per statistic kind, since each admits only one of the two.
 * - `P30` is `sequences` and `expressionFirst` in `import/guards/processing.ts`.
 * - `xsd` ranks `qti-assessment-item`'s children, which `item` and P30's two sequences rank
 *   separately: no one rank order refuses exactly what those three refuse, so this one follows the
 *   order of `AssessmentItemDType`'s sequence over the kinds they name.
 */
export const rules: readonly Rule[] = [
  sequence(
    "content",
    ["table"],
    ["3.0.0"],
    each(["caption", "col", "colgroup", "thead", "tfoot", "tbody", "tr"]),
  ),
  sequence(
    "content",
    ["table"],
    ["3.0.1"],
    [["caption"], ["col"], ["colgroup"], ["thead"], ["tbody", "tr"], ["tfoot"]],
  ),
  { _tag: "First", kind: "summary", parents: ["details"], source: "content", versions: both },
  sequence("content", ["picture"], both, each(["source", "img"])),
  ...bodyHosts.map(([host, body]) =>
    sequence("content", [host], both, each(["qti-stylesheet", body, "qti-catalog-info"])),
  ),
  { _tag: "First", kind: "qti-prompt", parents: promptHosts, source: "content", versions: both },
  leading(
    "content",
    ["qti-gap-match-interaction"],
    [["qti-prompt"], ["qti-gap-img", "qti-gap-text"]],
  ),
  {
    _tag: "LastWhere",
    attribute: "shape",
    kind: "qti-hotspot-choice",
    parents: ["qti-graphic-order-interaction", "qti-hotspot-interaction"],
    source: "content",
    value: "default",
    versions: both,
  },
  sequence(
    "item",
    ["qti-assessment-item"],
    both,
    each([
      "qti-response-declaration",
      "qti-outcome-declaration",
      "qti-item-body",
      "qti-response-processing",
    ]),
  ),
  sequence(
    "manifest",
    ["cp:resource"],
    both,
    each(["cp:metadata.resource", "cp:file", "cp:dependency", "cpx:variant"]),
  ),
  sequence(
    "manifest",
    ["qmd:qtiMetadata"],
    both,
    each([
      "qmd:itemTemplate",
      "qmd:timeDependent",
      "qmd:composite",
      "qmd:interactionType",
      "qmd:portableCustomInteractionContext",
      "qmd:feedbackType",
      "qmd:solutionAvailable",
      "qmd:scoringMode",
      "qmd:toolName",
      "qmd:toolVersion",
      "qmd:toolVendor",
    ]),
  ),
  sequence(
    "manifest",
    ["drd:accessForAllResource"],
    both,
    each(drdKinds.filter((kind) => kind !== "drd:accessForAllResource")),
  ),
  sequence(
    "manifest",
    ["csmd:labelledGUID"],
    both,
    each(["csmd:label", "csmd:caseItemURI", "csmd:GUID"]),
  ),
  sequence("usage", ["ud:ordinaryStatistic"], both, each(["ud:targetObject", "ud:value"])),
  sequence("usage", ["ud:categorizedStatistic"], both, each(["ud:targetObject", "ud:mapping"])),
  ...["outcome", "response", "template"].map((language) =>
    sequence(
      "P30",
      [`qti-${language}-condition`],
      both,
      each([`qti-${language}-if`, `qti-${language}-else-if`, `qti-${language}-else`]),
    ),
  ),
  sequence(
    "P30",
    ["qti-assessment-item"],
    both,
    each(["qti-template-declaration", "qti-template-processing"]),
  ),
  sequence(
    "P30",
    ["qti-assessment-item"],
    both,
    each(["qti-response-processing", "qti-modal-feedback"]),
  ),
  leading("P30", [...branches, "qti-custom-operator"], [expressionKinds]),
  sequence(
    "xsd",
    ["qti-assessment-item"],
    both,
    each([
      "qti-response-declaration",
      "qti-outcome-declaration",
      "qti-template-declaration",
      "qti-template-processing",
      "qti-item-body",
      "qti-response-processing",
      "qti-modal-feedback",
    ]),
  ),
];

/**
 * What `Order` is generated from: the rosters its key ranges over, the admission relation that is
 * its key set, and which kinds are elements.
 */
export interface Grammar<Version extends string, Kind extends string> {
  /**
   * The admitted (version, parent, child) triples. Each one is a row of `Order`.
   */
  readonly admission: readonly {
    readonly child: Kind;
    readonly parent: Kind;
    readonly version: Version;
  }[];
  /**
   * The kinds that are elements. The rest (text, whitespace, comments, instructions, entity
   * references) no rule ranks.
   */
  readonly elements: ReadonlySet<Kind>;
  /**
   * The `NodeKind` roster, in code order.
   */
  readonly kinds: readonly Kind[];
  /**
   * The `SchemaVersion` roster, in code order.
   */
  readonly versions: readonly Version[];
}

/**
 * The key of `Order`: (version, parent, child), the version the most significant digit.
 */
export type OrderKey<Version extends string, Kind extends string> = readonly [
  Field<"version", Version>,
  Field<"parent", Kind>,
  Field<"child", Kind>,
];

/**
 * The payload of `Order`: the child's interval, coded by the intervals the rows hold, in (lo, hi)
 * order (fin.md §17, an open-typed payload).
 */
export type OrderPayload = readonly [Field<"interval", Interval>];

/**
 * A pair of children of one parent: `later` after `earlier` is out of order.
 */
export type Pair<Kind extends string> = readonly [earlier: Kind, later: Kind];

/**
 * A parent whose `Order` intervals refuse pairs of children that no guard refuses, because the
 * guards' rules for it interleave and no rank order expresses them. The pairs are the ones its
 * settling sequence adds.
 */
export interface Tightened<Version extends string, Kind extends string> {
  readonly _tag: "Tightened";
  readonly pairs: readonly Pair<Kind>[];
  readonly parent: Kind;
  readonly version: Version;
}

/**
 * A parent whose guard puts `kind` first and whose intervals rank it before every other element.
 * They agree while the parent holds `kind` at most once; a second `kind` after another element is
 * refused by the intervals and admitted by the guard.
 */
export interface FirstChild<Version extends string, Kind extends string> {
  readonly _tag: "FirstChild";
  readonly kind: Kind;
  readonly parent: Kind;
  readonly version: Version;
}

/**
 * A parent whose guard places `kind` by the value of one of its attributes, which `Order`, keyed by
 * kinds, does not carry.
 */
export interface ByAttribute<Version extends string, Kind extends string> {
  readonly _tag: "ByAttribute";
  readonly attribute: string;
  readonly kind: Kind;
  readonly parent: Kind;
  readonly value: string;
  readonly version: Version;
}

/**
 * A (version, parent) whose sequence no ranks express exactly: the monotonicity report's entry.
 */
export type Inexact<Version extends string, Kind extends string> =
  | ByAttribute<Version, Kind>
  | FirstChild<Version, Kind>
  | Tightened<Version, Kind>;

/**
 * `Order` and its monotonicity report.
 */
export interface Ordering<Version extends string, Kind extends string> {
  readonly order: Closed<OrderKey<Version, Kind>, OrderPayload>;
  /**
   * Each (version, parent) whose intervals do not state its rules exactly, in admission order.
   */
  readonly report: readonly Inexact<Version, Kind>[];
}

/**
 * A rule that names a schema version the roster does not hold.
 */
export class UnknownVersion extends Schema.TaggedError<UnknownVersion>()("UnknownVersion", {
  source: Schema.String,
  version: Schema.String,
}) {
  /**
   * The rule, the version, and the repair.
   */
  override get message(): string {
    return `A ${this.source} rule of Order holds in schema version ${this.version}, which the SchemaVersion roster does not hold. Correct the version, or add it to the roster.`;
  }
}

/**
 * A rule that ranks a kind its parent admits in none of the rule's versions, so the rank binds no
 * row of `Order`.
 */
export class RankNotAdmitted extends Schema.TaggedError<RankNotAdmitted>()("RankNotAdmitted", {
  kind: Schema.String,
  parent: Schema.String,
  source: Schema.String,
}) {
  /**
   * The rule, the parent and kind, and the repair.
   */
  override get message(): string {
    return `A ${this.source} rule of Order places ${this.kind} under ${this.parent}, which admits ${this.kind} in none of the rule's versions. Correct the kind or the parent, or admit ${this.kind} under ${this.parent}.`;
  }
}

/**
 * A sequence that names one kind in two of its ranks, so the kind has no single rank.
 */
export class RankedTwice extends Schema.TaggedError<RankedTwice>()("RankedTwice", {
  kind: Schema.String,
  source: Schema.String,
}) {
  /**
   * The rule, the kind, and the repair.
   */
  override get message(): string {
    return `A ${this.source} rule of Order names ${this.kind} in two of its ranks, so ${this.kind} has no single rank. Name it in one rank.`;
  }
}

/**
 * Several rules on one parent that no one of them expresses: each refuses a pair the others admit,
 * so no interval per kind refuses exactly what they refuse together.
 */
export class Interleaved extends Schema.TaggedError<Interleaved>()("Interleaved", {
  parent: Schema.String,
  sources: Schema.String,
  version: Schema.String,
}) {
  /**
   * The parent, the rules' sources, and the repair.
   */
  override get message(): string {
    return `Order cannot rank the children of ${this.parent} in ${this.version}: its ${this.sources} rules interleave, and no one of them refuses every pair the others refuse. State one sequence for ${this.parent} that refuses each of those pairs, as an xsd rule in the parent's XSD order.`;
  }
}

/**
 * The ways the rules have no `Order`.
 */
export type OrderError = Interleaved | RankNotAdmitted | RankedTwice | UnknownVersion;

/**
 * One parent and its admitted children in one version.
 */
interface Family<Version extends string, Kind extends string> {
  readonly children: readonly Kind[];
  readonly parent: Kind;
  readonly version: Version;
}

/**
 * Pairs of children, each under its (earlier, later) key: the child relation a rule refuses.
 */
type Pairs<Kind extends string> = ReadonlyMap<string, Pair<Kind>>;

/**
 * Join a tuple of handles into one map key.
 *
 * @param handles - The handles, in order.
 * @returns A key no other tuple of handles shares.
 */
const keyOf = (...handles: readonly string[]): string => handles.join("\u0000");

/**
 * Narrow a rule to one that ranks kinds.
 *
 * @param rule - A rule.
 * @returns Whether the rule gives kinds ranks.
 */
const isRankRule = (rule: Rule): rule is RankRule => rule._tag !== "LastWhere";

/**
 * Find the rank of a kind among ranks, or the rank after the last for an element no rank names.
 *
 * @param ranks - The leading ranks.
 * @param elements - The kinds that are elements.
 * @param kind - The child's kind.
 * @returns The rank, or none for a kind that is not an element.
 */
const leadingRank = (ranks: Ranks, elements: ReadonlySet<string>, kind: string) =>
  Arr.findFirstIndex(ranks, (rank) => rank.includes(kind)).pipe(
    Option.orElse(() => Option.liftPredicate(ranks.length, () => elements.has(kind))),
  );

/**
 * Find a child's rank under a rule.
 *
 * @param rule - The rule.
 * @param elements - The kinds that are elements.
 * @param kind - The child's kind.
 * @returns The rank, or none when the rule leaves the kind outside its sequence.
 */
const rankOf = (
  rule: RankRule,
  elements: ReadonlySet<string>,
  kind: string,
): Option.Option<number> =>
  rule._tag === "Sequence"
    ? Arr.findFirstIndex(rule.ranks, (rank) => rank.includes(kind))
    : leadingRank(rule._tag === "First" ? [[rule.kind]] : rule.ranks, elements, kind);

/**
 * Collect the pairs of a family's children a rule refuses: every child of a higher rank before one
 * of a lower rank.
 *
 * @param rule - The rule.
 * @param elements - The kinds that are elements.
 * @param children - The kinds the parent admits.
 * @returns The refused pairs, in children order.
 */
const pairsOf = <Kind extends string>(
  rule: RankRule,
  elements: ReadonlySet<string>,
  children: readonly Kind[],
): Pairs<Kind> => {
  const ranked = children.flatMap((child) =>
    Option.match(rankOf(rule, elements, child), {
      onNone: () => [],
      onSome: (rank) => [{ child, rank }],
    }),
  );

  return new Map(
    ranked.flatMap((earlier) =>
      ranked
        .filter((later) => earlier.rank > later.rank)
        .map((later): [string, Pair<Kind>] => [
          keyOf(earlier.child, later.child),
          [earlier.child, later.child],
        ]),
    ),
  );
};

/**
 * Join pair relations.
 *
 * @param relations - The relations.
 * @returns Every pair any of them holds.
 */
const unionOf = <Kind extends string>(relations: readonly Pairs<Kind>[]): Pairs<Kind> =>
  new Map(relations.flatMap((relation) => [...relation]));

/**
 * Check that a relation holds every pair of another.
 *
 * @param outer - The relation that may hold the other.
 * @param inner - The relation whose pairs it must hold.
 * @returns Whether every pair of `inner` is in `outer`.
 */
const holds = <Kind extends string>(outer: Pairs<Kind>, inner: Pairs<Kind>): boolean =>
  [...inner.keys()].every((key) => outer.has(key));

/**
 * How one family is ranked: the rule whose ranks its intervals take, none when no rule ranks it,
 * and its report entries.
 */
interface Ranked<Version extends string, Kind extends string> {
  readonly findings: readonly Inexact<Version, Kind>[];
  readonly rule: Option.Option<RankRule>;
}

/**
 * Settle a family's rules: the one rule whose ranks refuse every pair any of its rules refuses, and
 * what its intervals state differently from today's guards.
 *
 * @param family - The parent and its admitted children in one version.
 * @param bound - The rules that bind the family.
 * @param elements - The kinds that are elements.
 * @returns The rule whose ranks the family's intervals take, none when no rule ranks it, and the
 *   report entries; or the failure when no one rule expresses the others.
 */
const settle = <Version extends string, Kind extends string>(
  family: Family<Version, Kind>,
  bound: readonly Rule[],
  elements: ReadonlySet<string>,
): Result.Result<Ranked<Version, Kind>, Interleaved> => {
  const { children, parent, version } = family;
  const ranking = bound.filter(isRankRule);
  const relations = ranking.map((rule) => ({ pairs: pairsOf(rule, elements, children), rule }));
  const all = unionOf(relations.map(({ pairs }) => pairs));
  const guards = relations.filter(({ rule }) => rule.source !== "xsd");
  const pairwise = unionOf(
    guards.filter(({ rule }) => rule._tag !== "First").map(({ pairs }) => pairs),
  );
  const attributes = bound.flatMap((rule): readonly ByAttribute<Version, Kind>[] =>
    rule._tag === "LastWhere"
      ? children
          .filter((child) => child === rule.kind)
          .map((kind) => ({
            _tag: "ByAttribute",
            attribute: rule.attribute,
            kind,
            parent,
            value: rule.value,
            version,
          }))
      : [],
  );
  const firsts = guards.flatMap(({ pairs, rule }): readonly FirstChild<Version, Kind>[] =>
    rule._tag === "First" && !holds(pairwise, pairs)
      ? children
          .filter((child) => child === rule.kind)
          .map((kind) => ({ _tag: "FirstChild", kind, parent, version }))
      : [],
  );

  if (relations.length === 0) {
    return Result.succeed({ findings: attributes, rule: Option.none() });
  }

  return Arr.findFirst(relations, ({ pairs }) => holds(pairs, all)).pipe(
    Option.match({
      onNone: () =>
        Result.fail(
          new Interleaved({
            parent,
            sources: [...new Set(ranking.map((rule) => rule.source))].join(", "),
            version,
          }),
        ),
      onSome: ({ pairs, rule }) => {
        const added = [...pairs].filter(([key]) => !guards.some((guard) => guard.pairs.has(key)));
        const tightened: readonly Tightened<Version, Kind>[] =
          added.length === 0
            ? []
            : [{ _tag: "Tightened", pairs: added.map(([, pair]) => pair), parent, version }];

        return Result.succeed({
          findings: [...tightened, ...firsts, ...attributes],
          rule: Option.some(rule),
        });
      },
    }),
  );
};

/**
 * List the kinds a rule names.
 *
 * @param rule - The rule.
 * @returns The kinds of its ranks, or its one kind.
 */
const namedBy = (rule: Rule): readonly string[] =>
  rule._tag === "First" || rule._tag === "LastWhere" ? [rule.kind] : rule.ranks.flat();

/**
 * Find why a rule binds nothing it names: a version outside the roster, a kind named in two ranks,
 * or a kind one of its parents admits in none of the rule's versions.
 *
 * @param rule - The rule.
 * @param versions - The `SchemaVersion` roster.
 * @param admitted - The admitted (version, parent, child) triples, by key.
 * @returns The first failure, or none for a rule every name of which binds a row.
 */
const flawOf = (
  rule: Rule,
  versions: readonly string[],
  admitted: ReadonlySet<string>,
): Option.Option<RankNotAdmitted | RankedTwice | UnknownVersion> => {
  const { parents, source } = rule;
  const named = namedBy(rule);

  return Arr.findFirst(rule.versions, (version) => !versions.includes(version)).pipe(
    Option.map(
      (version): RankNotAdmitted | RankedTwice | UnknownVersion =>
        new UnknownVersion({ source, version }),
    ),
    Option.orElse(() =>
      Arr.findFirst(named, (kind, at) => named.indexOf(kind) !== at).pipe(
        Option.map((kind) => new RankedTwice({ kind, source })),
      ),
    ),
    Option.orElse(() =>
      Arr.head(
        parents.flatMap((parent) =>
          named
            .filter(
              (kind) =>
                !rule.versions.some((version) => admitted.has(keyOf(version, parent, kind))),
            )
            .map((kind) => new RankNotAdmitted({ kind, parent, source })),
        ),
      ),
    ),
  );
};

/**
 * Find the interval of a rank, constructing it on first use, so that every row of one rank holds
 * the same interval: a code space numbers its values by identity.
 *
 * @param table - The intervals constructed so far, by rank; the new one is added to it.
 * @param rank - The rank.
 * @returns The interval [rank, rank].
 */
const internRank = (table: Map<number, Interval>, rank: number): Interval => {
  const known = table.get(rank);
  if (known !== undefined) {
    return known;
  }

  const interval = { hi: rank, lo: rank };
  table.set(rank, interval);

  return interval;
};

/**
 * The order of intervals in `Order`'s payload code space: by `lo`, then by `hi`.
 */
const byBounds: Order.Order<Interval> = Order.combine(
  Order.mapInput(Order.Number, (interval: Interval) => interval.lo),
  Order.mapInput(Order.Number, (interval: Interval) => interval.hi),
);

/**
 * Generate `Order` from the admission relation and rank rules.
 *
 * Each admitted triple is one row. Under a parent its rules rank, a ranked child's interval is
 * [rank, rank] and every other child's is {@link unranked}. When several rules bind one parent, the
 * one whose ranks refuse every pair any of them refuses gives the ranks. The width follows from the
 * number of distinct intervals, the ranks and [0, ∞]: 4 bits while no parent has more than 14
 * ranks. `drd:accessForAllResource`'s sequence has 17, and an exact port needs a distinct interval
 * for each, so today's cell is 5 bits.
 *
 * @param grammar - The rosters, the admission relation and the element kinds.
 * @param rankRules - The rank rules, {@link rules} for today's.
 * @returns `Order` and its monotonicity report, or why the rules or rows have no constant.
 */
export const orderOf = <const Version extends string, const Kind extends string>(
  grammar: Grammar<Version, Kind>,
  rankRules: readonly Rule[],
): Result.Result<Ordering<Version, Kind>, ClosedRelationError | OrderError> =>
  Result.gen(function* generateOrder() {
    const { admission, elements, kinds, versions } = grammar;
    const admitted = new Set(admission.map((row) => keyOf(row.version, row.parent, row.child)));
    yield* Arr.findFirst(rankRules, (rule) => flawOf(rule, versions, admitted)).pipe(
      Option.match({ onNone: () => Result.void, onSome: Result.fail }),
    );

    const families = Object.values(
      Arr.groupBy(admission, (row) => keyOf(row.version, row.parent)),
    ).map((rows): Family<Version, Kind> => ({
      children: rows.map((row) => row.child),
      parent: Arr.headNonEmpty(rows).parent,
      version: Arr.headNonEmpty(rows).version,
    }));
    const settled = yield* Result.all(
      families.map((family) =>
        Result.map(
          settle(
            family,
            rankRules.filter(
              (rule) =>
                rule.versions.includes(family.version) && rule.parents.includes(family.parent),
            ),
            elements,
          ),
          (ranked) => ({ family, ranked }),
        ),
      ),
    );
    const intervals = new Map<number, Interval>();
    const rows = settled.flatMap(({ family, ranked }) =>
      family.children.map((child) => ({
        child,
        interval: ranked.rule.pipe(
          Option.flatMap((rule) => rankOf(rule, elements, child)),
          Option.match({ onNone: () => unranked, onSome: (rank) => internRank(intervals, rank) }),
        ),
        parent: family.parent,
        version: family.version,
      })),
    );
    const key: OrderKey<Version, Kind> = [
      { name: "version", values: versions },
      { name: "parent", values: kinds },
      { name: "child", values: kinds },
    ];
    const payload: OrderPayload = [
      {
        name: "interval",
        values: dictionary(
          rows.map((row) => row.interval),
          byBounds,
        ),
      },
    ];
    const order = yield* closed({ key, name: "Order", payload, rows });

    return { order, report: settled.flatMap(({ ranked }) => ranked.findings) };
  });

/**
 * Fold one child into its parent's order state, as `Node.state` and `Node.hi` do (N5).
 *
 * @param was - The state of the child's predecessor, 0 for the first child.
 * @param interval - The child's interval in `Order`.
 * @returns The child's state, `GREATEST(was, lo)`, or none when `was` exceeds `hi`: the child is
 *   out of order.
 */
export const step = (was: number, interval: Interval): Option.Option<number> =>
  Option.liftPredicate(Math.max(was, interval.lo), () => was <= interval.hi);
