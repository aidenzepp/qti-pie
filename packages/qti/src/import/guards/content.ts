/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The content guards: the facts about the M1 content rows that no single relation can state,
 * judged over the rows an import built before any of them is written.
 *
 * The ordering and union-count classes read only the `Edge` rows: the children of each parent in
 * position order, by kind, under the schema version the edge carries. The copy, owner,
 * conditioned-optional, same-table and `q` classes read the rows the passes wrote beside them
 * (spec 4.11, bin 2).
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import { collapse, replace, Rows } from "#qti/import/tree.ts";
import type { WhiteSpace } from "#qti/import/tree.ts";
import { IdrefAttribute } from "#qti/schema/content/rosters.ts";
import { entryOf } from "#qti/schema/content/xsd-inventory.ts";
import { typedValues } from "#qti/schema/attribute-homes.ts";
import * as shared from "#qti/schema/attributes.ts";
import {
  AriaLabel,
  AriaValuemax,
  AriaValuemin,
  AttributeIdref,
  HeadersTarget,
  NodeLabel,
  NodeLang,
  NodeXmlLang,
} from "#qti/schema/attributes.ts";
import {
  DeclarationMasteryValue,
  DeclarationNormalMaximum,
  DeclarationNormalMinimum,
} from "#qti/schema/declaration.ts";
import { Document, HtmlId } from "#qti/schema/document.ts";
import { AType } from "#qti/schema/html/text.ts";
import {
  AudioSrc,
  ObjectElement,
  ParamType,
  Source,
  SourceSrcset,
  SourceType,
  Track,
  VideoPoster,
  VideoSrc,
} from "#qti/schema/html/media.ts";
import { ChoiceInteraction, TypedBinding } from "#qti/schema/interaction.ts";
import {
  AssociableHotspot,
  AssociableHotspotMatchMin,
  AssociateInteraction,
  AssociateMaxAssociations,
  AssociateMinAssociations,
  GraphicAssociateInteraction,
  GraphicAssociateMaxAssociations,
  GraphicAssociateMinAssociations,
  MatchInteraction,
  MatchMaxAssociations,
  MatchMinAssociations,
  SimpleAssociableChoice,
  SimpleAssociableChoiceMatchMin,
} from "#qti/schema/interactions/associate.ts";
import {
  Gap,
  GapImg,
  GapImgLeft,
  GapImgMatchMin,
  GapImgTop,
  GapMatchInteraction,
  GapMatchMaxAssociations,
  GapMatchMinAssociations,
  GapText,
  GapTextMatchMin,
  GraphicGapMatchInteraction,
  GraphicGapMatchMaxAssociations,
  GraphicGapMatchMinAssociations,
} from "#qti/schema/interactions/gap.ts";
import {
  Hottext,
  HottextInteraction,
  HottextMaxChoices,
  HottextMinChoices,
  HottextOwner,
  HotspotChoice,
  HotspotInteraction,
  HotspotMaxChoices,
  HotspotMinChoices,
  PositionObjectInteraction,
  PositionObjectMaxChoices,
  PositionObjectMinChoices,
  SelectPointInteraction,
  SelectPointMaxChoices,
  SelectPointMinChoices,
} from "#qti/schema/interactions/hot.ts";
import {
  GraphicOrderInteraction,
  GraphicOrderMaxChoices,
  GraphicOrderMaxChoicesN,
  GraphicOrderMinChoices,
  GraphicOrderMinChoicesN,
  OrderInteraction,
  OrderMaxChoices,
  OrderMaxChoicesN,
  OrderMinChoices,
  OrderMinChoicesN,
} from "#qti/schema/interactions/order.ts";
import {
  MediaCoords,
  MediaInteraction,
  MediaMaxPlays,
  MediaMinPlays,
} from "#qti/schema/interactions/other.ts";
import {
  ExtendedTextInteraction,
  ExtendedTextMaxStrings,
  StringBinding,
  TextEntryInteraction,
} from "#qti/schema/interactions/text.ts";
import { AssessmentItemLabel } from "#qti/schema/item.ts";
import { DocumentLang, ResourceLomGeneral, ResourceLomLanguageSet } from "#qti/schema/lang.ts";
import { LomLanguage, ResourceLom } from "#qti/schema/metadata.ts";
import {
  AttributeLexical,
  Edge,
  EntityReference,
  Node,
  TextNode,
  vocabularies,
  Ws,
} from "#qti/schema/node.ts";
import type { SchemaVersionHandle } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import {
  Coords,
  CoordsCircle,
  CoordsDefault,
  CoordsEllipse,
  CoordsPoly,
  CoordsRect,
} from "#qti/schema/shapes.ts";
import {
  PrintedVariable,
  PrintedVariableIndex,
  PrintedVariableVarRef,
} from "#qti/schema/template.ts";

/**
 * A content guard refused the rows.
 *
 * `rule` names the guard and `detail` the first parent that broke it. The union holds every
 * rule of the bin 2 classes of spec 4.11, so the guards added after this one need no edit of it.
 */
export class ContentGuardRefusal extends Schema.TaggedError<ContentGuardRefusal>()(
  "ContentGuardRefusal",
  {
    detail: Schema.String,
    rule: Schema.Literals([
      "ordering",
      "union-count",
      "typed-copy",
      "idref-copy",
      "varref-copy",
      "lang-set-copy",
      "owner-copy",
      "max-strings-required",
      "aria-value-range",
      "mastery-range",
      "string-identifier-distinct",
      "same-table-headers",
      "q-punctuation",
      "bcp47-syntax",
    ]),
  },
) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The content rows break the ${this.rule} guard: ${this.detail}`;
  }
}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = ContentGuardRefusal | undefined;

const refuse = (rule: ContentGuardRefusal["rule"], detail: string): ContentGuardRefusal =>
  new ContentGuardRefusal({ detail, rule });

/**
 * The kinds that are elements: the registries' generic kinds (text, comments and the like) have no
 * local name, and the structural models of spec 3.7 are over elements alone.
 */
const elementKinds: ReadonlySet<string> = new Set(
  vocabularies.flatMap((vocabulary) =>
    Object.entries<{ readonly local: string }>(vocabulary.registry)
      .filter(([, row]) => row.local !== "")
      .map(([kind]) => kind),
  ),
);

/**
 * One parent and the element children under it: the kinds in position order, beside the child ids.
 */
interface Family {
  readonly children: readonly { readonly id: string; readonly kind: string }[];
  readonly kind: string;
  readonly parent: string;
  readonly version: SchemaVersionHandle;
}

const familiesOf = (rows: Rows): readonly Family[] => {
  const ordered = Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position));
  const edges = Map.groupBy(ordered, (edge) => edge.parent);

  return Rows.of(rows, Node).map((node) => ({
    children: (edges.get(node.id) ?? [])
      .filter((edge) => elementKinds.has(edge.childKind))
      .map((edge) => ({ id: edge.child, kind: edge.childKind })),
    kind: node.kind,
    parent: node.id,
    version: node.version,
  }));
};

const names = (family: Family): string => family.children.map((child) => child.kind).join(", ");

const describe = (family: Family): string =>
  `${family.kind} ${family.parent} (${family.version}) holds ${names(family) || "no element"}`;

/**
 * The 3.0.1 `table` sequence: `caption?, col*, colgroup*, thead?, (tbody* | tr+), tfoot?`, each
 * kind's place in it; `tbody` and `tr` share one, because which of the two a table holds is the
 * union count's.
 */
const tableOrderOne: ReadonlyMap<string, number> = new Map([
  ["caption", 0],
  ["col", 1],
  ["colgroup", 2],
  ["thead", 3],
  ["tbody", 4],
  ["tr", 4],
  ["tfoot", 5],
]);

/**
 * The 3.0.0 `table` sequence: `caption?, col*, colgroup*, thead?, tfoot?, tbody*, tr*`.
 */
const tableOrderZero: ReadonlyMap<string, number> = new Map([
  ["caption", 0],
  ["col", 1],
  ["colgroup", 2],
  ["thead", 3],
  ["tfoot", 4],
  ["tbody", 5],
  ["tr", 6],
]);

/**
 * The containers whose body is `qti-stylesheet*, qti-content-body, qti-catalog-info?`: the
 * feedback, template, rubric and modal hosts.
 */
const bodyHosts: ReadonlySet<string> = new Set([
  "qti-feedback-block",
  "qti-feedback-block.template",
  "qti-modal-feedback",
  "qti-rubric-block",
  "qti-template-block",
  "qti-template-block.rubric",
]);

const bodyOrder = (kind: string): number | undefined => {
  if (kind === "qti-stylesheet") {
    return 0;
  }

  if (kind.startsWith("qti-content-body")) {
    return 1;
  }

  return kind === "qti-catalog-info" ? 2 : undefined;
};

/**
 * The interactions that admit a leading `qti-prompt` (spec 3.7).
 */
const promptHosts: ReadonlySet<string> = new Set([
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
]);

const pictureOrder: ReadonlyMap<string, number> = new Map([
  ["source", 0],
  ["img", 1],
]);

const gapKinds: ReadonlySet<string> = new Set(["qti-gap-img", "qti-gap-text"]);

const gapMatchOrder = (kind: string): number => {
  if (kind === "qti-prompt") {
    return 0;
  }

  return gapKinds.has(kind) ? 1 : 2;
};

/**
 * The first child whose rank is lower than the one before it, with that earlier child, or nothing
 * when the children are in order. A child with no rank is not part of the sequence.
 */
const outOfOrder = (
  family: Family,
  rank: (kind: string) => number | undefined,
): readonly [earlier: string, later: string] | undefined => {
  let top: { readonly kind: string; readonly rank: number } | undefined;
  for (const child of family.children) {
    const place = rank(child.kind);
    if (place === undefined) {
      continue;
    }

    if (top !== undefined && place < top.rank) {
      return [top.kind, child.kind];
    }

    if (top === undefined || place > top.rank) {
      top = { kind: child.kind, rank: place };
    }
  }

  return undefined;
};

/**
 * The ordering a family's kind states, as the pair that breaks it and the sentence naming it.
 */
const orderingOf = (family: Family, defaults: ReadonlySet<string>): string | undefined => {
  const { children, kind } = family;
  const kinds = children.map((child) => child.kind);
  const [first] = kinds;
  const broken = (
    rank: (name: string) => number | undefined,
    model: string,
  ): string | undefined => {
    const pair = outOfOrder(family, rank);

    return pair === undefined ? undefined : `${pair[1]} follows ${pair[0]}; the order is ${model}`;
  };

  if (kind === "table") {
    const order = family.version === "3.0.0" ? tableOrderZero : tableOrderOne;

    return broken(
      (name) => order.get(name),
      family.version === "3.0.0"
        ? "caption, col, colgroup, thead, tfoot, tbody, tr"
        : "caption, col, colgroup, thead, tbody or tr, tfoot",
    );
  }

  if (kind === "details") {
    return kinds.includes("summary") && first !== "summary"
      ? `summary comes after ${first ?? "nothing"}; it is the first child`
      : undefined;
  }

  if (kind === "picture") {
    return broken((name) => pictureOrder.get(name), "source, img");
  }

  if (bodyHosts.has(kind)) {
    return broken(bodyOrder, "qti-stylesheet, qti-content-body, qti-catalog-info");
  }

  if (promptHosts.has(kind) && kinds.includes("qti-prompt") && first !== "qti-prompt") {
    return `qti-prompt comes after ${first ?? "nothing"}; it is the first child`;
  }

  if (kind === "qti-gap-match-interaction") {
    return broken(gapMatchOrder, "qti-prompt, the gap texts and images, then block content");
  }

  const last = children.at(-1);
  const strayDefault = children.find(
    (child, index) => defaults.has(child.id) && index !== children.length - 1,
  );
  if (strayDefault !== undefined && last !== undefined) {
    return `the default hotspot ${strayDefault.id} is followed by ${last.kind}; it is the last child`;
  }

  return undefined;
};

/**
 * `ordering`: the children of each parent follow the XSD sequence of the parent's kind in the
 * document's schema version, and the version rules of `table` (spec 3.7, goal 3.5).
 *
 * `dl`'s `(dt+ | dd+)*` is any run of `dt` and `dd` children, which `Admission` already confines,
 * so it has no order to break.
 */
const ordering = (families: readonly Family[], defaults: ReadonlySet<string>): Finding => {
  for (const family of families) {
    const broken = orderingOf(family, defaults);
    if (broken !== undefined) {
      return refuse("ordering", `${describe(family)}, and ${broken}.`);
    }
  }

  return undefined;
};

const count = (family: Family, members: ReadonlySet<string>): number =>
  family.children.filter((child) => members.has(child.kind)).length;

const stageKinds: ReadonlySet<string> = new Set(["img", "object", "picture"]);

const mediaKinds: ReadonlySet<string> = new Set(["audio", "object", "video"]);

const cellKinds: ReadonlySet<string> = new Set(["td", "th"]);

/**
 * The parents that hold exactly one `(object | img | picture)`.
 */
const stageHosts: ReadonlySet<string> = new Set([
  "qti-drawing-interaction",
  "qti-gap-img",
  "qti-graphic-associate-interaction",
  "qti-graphic-gap-match-interaction",
  "qti-graphic-order-interaction",
  "qti-hotspot-interaction",
  "qti-position-object-interaction",
  "qti-position-object-stage",
  "qti-select-point-interaction",
]);

/**
 * The union count a family's kind states, as the sentence naming what is wrong.
 */
const unionOf = (family: Family): string | undefined => {
  const { kind } = family;
  if (stageHosts.has(kind) && count(family, stageKinds) !== 1) {
    return `${count(family, stageKinds)} of object, img and picture where exactly one is required`;
  }

  if (kind === "qti-media-interaction" && count(family, mediaKinds) !== 1) {
    return `${count(family, mediaKinds)} of object, audio and video where exactly one is required`;
  }

  if (
    (kind === "qti-gap-match-interaction" || kind === "qti-graphic-gap-match-interaction") &&
    count(family, gapKinds) === 0
  ) {
    return "no qti-gap-text or qti-gap-img where at least one is required";
  }

  if (kind === "tr" && count(family, cellKinds) === 0) {
    return "no td or th where at least one is required";
  }

  if (
    kind === "table" &&
    family.version === "3.0.1" &&
    family.children.some((child) => child.kind === "tbody") &&
    family.children.some((child) => child.kind === "tr")
  ) {
    return "both tbody and tr children where 3.0.1 admits one of them";
  }

  return undefined;
};

/**
 * `union-count`: the count over a union of kinds a parent's model states (spec 3.7, 4.11).
 * `(tbody* | tr+)` is exclusive in a 3.0.1 `table` only.
 */
const unionCount = (families: readonly Family[]): Finding => {
  for (const family of families) {
    const broken = unionOf(family);
    if (broken !== undefined) {
      return refuse(
        "union-count",
        `${family.kind} ${family.parent} (${family.version}) has ${broken}.`,
      );
    }
  }

  return undefined;
};

/**
 * The lookups the guards after `union-count` share: each node by id, each child's parent and each
 * parent's edges in position order.
 */
interface Index {
  readonly children: ReadonlyMap<string, readonly Fact<typeof Edge>[]>;
  readonly nodes: ReadonlyMap<string, Fact<typeof Node>>;
  readonly parents: ReadonlyMap<string, Fact<typeof Edge>>;
}

const indexOf = (rows: Rows): Index => {
  const edges = Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position));

  return {
    children: Map.groupBy(edges, (edge) => edge.parent),
    nodes: new Map(Rows.of(rows, Node).map((node) => [node.id, node])),
    parents: new Map(edges.map((edge) => [edge.child, edge])),
  };
};

/**
 * The nearest ancestor of `id` whose kind `matches`, `undefined` when none of its ancestors does.
 */
const nearestAbove = (
  index: Index,
  id: string,
  matches: (kind: string) => boolean,
): string | undefined => {
  const seen = new Set<string>();
  let current = index.parents.get(id);
  while (current !== undefined && !seen.has(current.parent)) {
    if (matches(current.parentKind)) {
      return current.parent;
    }

    seen.add(current.parent);
    current = index.parents.get(current.parent);
  }

  return undefined;
};

const quoted = (text: string): string => JSON.stringify(text);

/**
 * The shape of every shared-attribute relation's row: the node it belongs to and the typed value.
 */
const NodeValue = Schema.Struct({ node: Schema.String, value: Schema.String });

const isNodeValue = Schema.is(NodeValue);

/**
 * The value of each node's row of a relation shaped `(node, value)`.
 */
const valuesOfRelation = (rows: Rows, relation: AnyRelation): ReadonlyMap<string, string> =>
  new Map((rows.get(relation) ?? []).filter(isNodeValue).map((row) => [row.node, row.value]));

/**
 * The non-negative integer a lexical form writes, 0 for a form that is no natural number, as the
 * importer reads it.
 */
const naturalOf = (lexical: string): bigint =>
  /^\+?[0-9]+$/u.test(lexical) ? BigInt(lexical) : 0n;

/**
 * One typed `<attr>N` column of a row: what it holds, the attribute as the source wrote it (none
 * when it omitted the attribute) and the value the schema defaults the omitted attribute to.
 */
interface Count {
  readonly actual: bigint;
  readonly column: string;
  readonly fallback: bigint;
  readonly id: string;
  readonly owner: string;
  readonly written: string | undefined;
}

type Written = ReadonlyMap<string, string>;

const written = (facts: readonly { readonly node: string; readonly value: string }[]): Written =>
  new Map(facts.map((fact) => [fact.node, fact.value]));

const choiceBounds = (
  owner: string,
  facts: readonly {
    readonly id: string;
    readonly maxChoicesN: bigint;
    readonly minChoicesN: bigint;
  }[],
  lexical: { readonly max: Written; readonly maxFallback: bigint; readonly min: Written },
): readonly Count[] =>
  facts.flatMap((fact) => [
    {
      actual: fact.maxChoicesN,
      column: "maxChoicesN",
      fallback: lexical.maxFallback,
      id: fact.id,
      owner,
      written: lexical.max.get(fact.id),
    },
    {
      actual: fact.minChoicesN,
      column: "minChoicesN",
      fallback: 0n,
      id: fact.id,
      owner,
      written: lexical.min.get(fact.id),
    },
  ]);

const associationBounds = (
  owner: string,
  facts: readonly {
    readonly id: string;
    readonly maxAssociationsN: bigint;
    readonly minAssociationsN: bigint;
  }[],
  lexical: { readonly max: Written; readonly min: Written },
): readonly Count[] =>
  facts.flatMap((fact) => [
    {
      actual: fact.maxAssociationsN,
      column: "maxAssociationsN",
      fallback: 1n,
      id: fact.id,
      owner,
      written: lexical.max.get(fact.id),
    },
    {
      actual: fact.minAssociationsN,
      column: "minAssociationsN",
      fallback: 0n,
      id: fact.id,
      owner,
      written: lexical.min.get(fact.id),
    },
  ]);

/**
 * A choice's or hotspot's match bounds: `matchMax` is the attribute on the row, and `match-min`
 * has a relation of its own where the schema writes one.
 */
const matchBounds = (
  owner: string,
  facts: readonly {
    readonly id: string;
    readonly matchMax: string;
    readonly matchMaxN: bigint;
    readonly matchMinN: bigint;
  }[],
  min?: Written,
): readonly Count[] =>
  facts.flatMap((fact) => [
    {
      actual: fact.matchMaxN,
      column: "matchMaxN",
      fallback: 0n,
      id: fact.id,
      owner,
      written: fact.matchMax,
    },
    ...(min === undefined
      ? []
      : [
          {
            actual: fact.matchMinN,
            column: "matchMinN",
            fallback: 0n,
            id: fact.id,
            owner,
            written: min.get(fact.id),
          },
        ]),
  ]);

/**
 * Every typed count of the interactions and their choices (spec 3.9, 4.5) with its source. A count
 * whose attribute has no lexical relation of its own is not here.
 */
const countsOf = (rows: Rows): readonly Count[] => {
  const of = (relation: AnyRelation): Written => valuesOfRelation(rows, relation);
  const choice = Rows.of(rows, ChoiceInteraction);

  return [
    ...choiceBounds("ChoiceInteraction", choice, {
      max: new Map(choice.map((fact) => [fact.id, fact.maxChoices])),
      maxFallback: 1n,
      min: new Map(choice.map((fact) => [fact.id, fact.minChoices])),
    }),
    ...choiceBounds("HottextInteraction", Rows.of(rows, HottextInteraction), {
      max: of(HottextMaxChoices),
      maxFallback: 1n,
      min: of(HottextMinChoices),
    }),
    ...choiceBounds("HotspotInteraction", Rows.of(rows, HotspotInteraction), {
      max: of(HotspotMaxChoices),
      maxFallback: 1n,
      min: of(HotspotMinChoices),
    }),
    ...choiceBounds("SelectPointInteraction", Rows.of(rows, SelectPointInteraction), {
      max: of(SelectPointMaxChoices),
      maxFallback: 0n,
      min: of(SelectPointMinChoices),
    }),
    ...choiceBounds("PositionObjectInteraction", Rows.of(rows, PositionObjectInteraction), {
      max: of(PositionObjectMaxChoices),
      maxFallback: 1n,
      min: of(PositionObjectMinChoices),
    }),
    ...choiceBounds("OrderInteraction", Rows.of(rows, OrderInteraction), {
      max: of(OrderMaxChoices),
      maxFallback: 0n,
      min: of(OrderMinChoices),
    }),
    ...choiceBounds("GraphicOrderInteraction", Rows.of(rows, GraphicOrderInteraction), {
      max: of(GraphicOrderMaxChoices),
      maxFallback: 0n,
      min: of(GraphicOrderMinChoices),
    }),
    ...associationBounds("AssociateInteraction", Rows.of(rows, AssociateInteraction), {
      max: of(AssociateMaxAssociations),
      min: of(AssociateMinAssociations),
    }),
    ...associationBounds("MatchInteraction", Rows.of(rows, MatchInteraction), {
      max: of(MatchMaxAssociations),
      min: of(MatchMinAssociations),
    }),
    ...associationBounds(
      "GraphicAssociateInteraction",
      Rows.of(rows, GraphicAssociateInteraction),
      {
        max: of(GraphicAssociateMaxAssociations),
        min: of(GraphicAssociateMinAssociations),
      },
    ),
    ...associationBounds("GapMatchInteraction", Rows.of(rows, GapMatchInteraction), {
      max: of(GapMatchMaxAssociations),
      min: of(GapMatchMinAssociations),
    }),
    ...associationBounds("GraphicGapMatchInteraction", Rows.of(rows, GraphicGapMatchInteraction), {
      max: of(GraphicGapMatchMaxAssociations),
      min: of(GraphicGapMatchMinAssociations),
    }),
    ...Rows.of(rows, MediaInteraction).flatMap((fact): readonly Count[] => [
      {
        actual: fact.maxPlaysN,
        column: "maxPlaysN",
        fallback: 0n,
        id: fact.id,
        owner: "MediaInteraction",
        written: of(MediaMaxPlays).get(fact.id),
      },
      {
        actual: fact.minPlaysN,
        column: "minPlaysN",
        fallback: 0n,
        id: fact.id,
        owner: "MediaInteraction",
        written: of(MediaMinPlays).get(fact.id),
      },
    ]),
    ...matchBounds(
      "SimpleAssociableChoice",
      Rows.of(rows, SimpleAssociableChoice),
      of(SimpleAssociableChoiceMatchMin),
    ),
    ...matchBounds(
      "AssociableHotspot",
      Rows.of(rows, AssociableHotspot),
      of(AssociableHotspotMatchMin),
    ),
    ...matchBounds("GapText", Rows.of(rows, GapText), of(GapTextMatchMin)),
    ...matchBounds("GapImg", Rows.of(rows, GapImg), of(GapImgMatchMin)),
  ];
};

const countCopy = (rows: Rows): Finding => {
  const found = countsOf(rows).find(
    (entry) =>
      entry.actual !== (entry.written === undefined ? entry.fallback : naturalOf(entry.written)),
  );
  if (found === undefined) {
    return undefined;
  }

  const expected = found.written === undefined ? found.fallback : naturalOf(found.written);

  return refuse(
    "typed-copy",
    `${found.owner} ${found.id} holds ${found.column} ${found.actual}; ${
      found.written === undefined
        ? "the attribute is omitted, which reads"
        : `${quoted(found.written)} reads`
    } ${expected}.`,
  );
};

/**
 * The integer each node's row holds.
 */
const copiesOf = (
  facts: readonly { readonly node: string; readonly value: bigint }[],
): ReadonlyMap<string, bigint> => new Map(facts.map((fact) => [fact.node, fact.value]));

/**
 * The optional typed copy of an optional count: its lexical rows beside the rows holding the
 * integer, which are written exactly when the attribute is.
 */
const optionalCopy = (rows: Rows): Finding => {
  const pairs: readonly {
    readonly copies: ReadonlyMap<string, bigint>;
    readonly lexical: Written;
    readonly name: string;
  }[] = [
    {
      copies: copiesOf(Rows.of(rows, OrderMaxChoicesN)),
      lexical: written(Rows.of(rows, OrderMaxChoices)),
      name: "OrderMaxChoicesN",
    },
    {
      copies: copiesOf(Rows.of(rows, OrderMinChoicesN)),
      lexical: written(Rows.of(rows, OrderMinChoices)),
      name: "OrderMinChoicesN",
    },
    {
      copies: copiesOf(Rows.of(rows, GraphicOrderMaxChoicesN)),
      lexical: written(Rows.of(rows, GraphicOrderMaxChoices)),
      name: "GraphicOrderMaxChoicesN",
    },
    {
      copies: copiesOf(Rows.of(rows, GraphicOrderMinChoicesN)),
      lexical: written(Rows.of(rows, GraphicOrderMinChoices)),
      name: "GraphicOrderMinChoicesN",
    },
  ];
  for (const { copies, lexical, name } of pairs) {
    for (const [node, text] of lexical) {
      if (copies.get(node) !== naturalOf(text)) {
        return refuse(
          "typed-copy",
          `${name} ${node} holds ${copies.get(node)?.toString() ?? "no row"}; the attribute ${quoted(text)} reads ${naturalOf(text)}.`,
        );
      }
    }

    const stray = [...copies.keys()].find((node) => !lexical.has(node));
    if (stray !== undefined) {
      return refuse(
        "typed-copy",
        `${name} ${stray} is written for a node that wrote no attribute.`,
      );
    }
  }

  return undefined;
};

/**
 * `maxBound` is `bounded` exactly when `max-choices` is not 0.
 */
const maxBoundCopy = (rows: Rows): Finding => {
  const arms = [
    ...Rows.of(rows, OrderInteraction).map((row) => ({ name: "OrderInteraction", row })),
    ...Rows.of(rows, GraphicOrderInteraction).map((row) => ({
      name: "GraphicOrderInteraction",
      row,
    })),
  ];
  for (const { name, row } of arms) {
    const expected = row.maxChoicesN === 0n ? "unlimited" : "bounded";
    if (row.maxBound !== expected) {
      return refuse(
        "typed-copy",
        `${name} ${row.id} holds maxBound ${row.maxBound} beside maxChoicesN ${row.maxChoicesN}; it is ${expected}.`,
      );
    }
  }

  return undefined;
};

/**
 * The count each typed binding's `maxCount` copies, by interaction kind and node.
 */
const bindingCounts = (rows: Rows): ReadonlyMap<string, ReadonlyMap<string, bigint>> =>
  new Map([
    [
      "qti-associate-interaction",
      new Map(Rows.of(rows, AssociateInteraction).map((row) => [row.id, row.maxAssociationsN])),
    ],
    [
      "qti-gap-match-interaction",
      new Map(Rows.of(rows, GapMatchInteraction).map((row) => [row.id, row.maxAssociationsN])),
    ],
    [
      "qti-graphic-associate-interaction",
      new Map(
        Rows.of(rows, GraphicAssociateInteraction).map((row) => [row.id, row.maxAssociationsN]),
      ),
    ],
    [
      "qti-hotspot-interaction",
      new Map(Rows.of(rows, HotspotInteraction).map((row) => [row.id, row.maxChoicesN])),
    ],
    [
      "qti-hottext-interaction",
      new Map(Rows.of(rows, HottextInteraction).map((row) => [row.id, row.maxChoicesN])),
    ],
    [
      "qti-match-interaction",
      new Map(Rows.of(rows, MatchInteraction).map((row) => [row.id, row.maxAssociationsN])),
    ],
    [
      "qti-position-object-interaction",
      new Map(Rows.of(rows, PositionObjectInteraction).map((row) => [row.id, row.maxChoicesN])),
    ],
    [
      "qti-select-point-interaction",
      new Map(Rows.of(rows, SelectPointInteraction).map((row) => [row.id, row.maxChoicesN])),
    ],
  ]);

/**
 * `typed-copy` of each typed binding's `maxCount`: the interaction's own count, for the kinds
 * whose count is one (the choice interaction's is `itemGuards`').
 */
const bindingCopy = (rows: Rows): Finding => {
  const counts = bindingCounts(rows);
  for (const binding of Rows.of(rows, TypedBinding)) {
    const expected = counts.get(binding.interactionKind)?.get(binding.node);
    if (expected !== undefined && expected !== binding.maxCount) {
      return refuse(
        "typed-copy",
        `TypedBinding ${binding.node} holds maxCount ${binding.maxCount}; its ${binding.interactionKind} holds a count of ${expected}.`,
      );
    }
  }

  return undefined;
};

/**
 * A `replace`-class column: the relation it is in, the node it belongs to and the value.
 */
interface ReplaceColumn {
  readonly name: string;
  readonly owner: string;
  readonly value: string;
}

const onNode = (
  name: string,
  facts: readonly { readonly node: string; readonly value: string }[],
): readonly ReplaceColumn[] => facts.map((fact) => ({ name, owner: fact.node, value: fact.value }));

/**
 * Every `replace`-class column of the M1 and HTML relations (spec 3.9): the columns whose value
 * the importer has passed through `replace`.
 */
const replaceColumns = (rows: Rows): readonly ReplaceColumn[] => [
  ...onNode("AType", Rows.of(rows, AType)),
  ...onNode("AriaLabel", Rows.of(rows, AriaLabel)),
  ...onNode("AssessmentItemLabel", Rows.of(rows, AssessmentItemLabel)),
  ...onNode("AudioSrc", Rows.of(rows, AudioSrc)),
  ...onNode("Coords", Rows.of(rows, Coords)),
  ...onNode("CoordsCircle", Rows.of(rows, CoordsCircle)),
  ...onNode("CoordsDefault", Rows.of(rows, CoordsDefault)),
  ...onNode("CoordsEllipse", Rows.of(rows, CoordsEllipse)),
  ...onNode("CoordsPoly", Rows.of(rows, CoordsPoly)),
  ...onNode("CoordsRect", Rows.of(rows, CoordsRect)),
  ...onNode("GapImgLeft", Rows.of(rows, GapImgLeft)),
  ...onNode("GapImgTop", Rows.of(rows, GapImgTop)),
  ...onNode("MediaCoords", Rows.of(rows, MediaCoords)),
  ...onNode("NodeLabel", Rows.of(rows, NodeLabel)),
  ...onNode("NodeLang", Rows.of(rows, NodeLang)),
  ...onNode("ParamType", Rows.of(rows, ParamType)),
  ...onNode("SourceSrcset", Rows.of(rows, SourceSrcset)),
  ...onNode("SourceType", Rows.of(rows, SourceType)),
  ...onNode("VideoPoster", Rows.of(rows, VideoPoster)),
  ...onNode("VideoSrc", Rows.of(rows, VideoSrc)),
  ...Rows.of(rows, ObjectElement).map((row) => ({
    name: "Object.type",
    owner: row.id,
    value: row.type,
  })),
  ...Rows.of(rows, Source).map((row) => ({ name: "Source.src", owner: row.id, value: row.src })),
  ...Rows.of(rows, Track).map((row) => ({ name: "Track.src", owner: row.id, value: row.src })),
];

const replaceClass = (rows: Rows): Finding => {
  const found = replaceColumns(rows).find((column) => replace(column.value) !== column.value);

  return found === undefined
    ? undefined
    : refuse(
        "typed-copy",
        `${found.name} ${found.owner} holds ${quoted(found.value)}; a replace-class value holds no tab, line feed or carriage return.`,
      );
};

/**
 * The whitespace class of the families when the inventory names no class for the kind.
 */
const familyClass: ReadonlyMap<string, WhiteSpace> = new Map([
  ["class", "collapse"],
  ["data-catalog-idref", "collapse"],
  ["data-qti-suppress-tts", "preserve"],
  ["dir", "preserve"],
  ["id", "collapse"],
  ["label", "replace"],
  ["lang", "replace"],
  ["xml:base", "collapse"],
  ["xml:lang", "collapse"],
]);

/**
 * The whitespace class of `attribute` on `kind`: the inventory's, the family's for a kind the
 * inventory does not hold, `undefined` when neither names one.
 */
const classOf = (kind: string, attribute: string): WhiteSpace | undefined => {
  const declared = Option.getOrUndefined(entryOf(kind))?.attributes.find(
    (candidate) => candidate.name === attribute,
  );
  if (declared !== undefined && declared.whiteSpace !== "union") {
    return declared.whiteSpace;
  }

  return familyClass.get(attribute);
};

const processed = (value: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(value);
  }

  return whiteSpace === "replace" ? replace(value) : value;
};

/**
 * The relation of each shared attribute that holds its typed value: the families, `role` and the
 * `aria-*` attributes, by attribute name.
 */
const familyRelations: ReadonlyMap<string, AnyRelation> = new Map([
  ["class", shared.NodeClass],
  ["data-catalog-idref", shared.NodeCatalogIdref],
  ["label", shared.NodeLabel],
  ["lang", shared.NodeLang],
  ["xml:base", shared.NodeXmlBase],
  ["xml:lang", shared.NodeXmlLang],
  ...Object.entries(shared.relations)
    .filter(([key]) => key.startsWith("Aria"))
    .map(([key, relation]): [string, AnyRelation] => [
      key === "AriaRole" ? "role" : `aria-${key.slice("Aria".length).toLowerCase()}`,
      relation,
    ]),
]);

/**
 * The typed value of each shared attribute by node: attribute name to node to value.
 */
const familyValues = (rows: Rows): ReadonlyMap<string, Written> =>
  new Map(
    [...familyRelations].map(([attribute, relation]) => [
      attribute,
      valuesOfRelation(rows, relation),
    ]),
  );

/**
 * `typed-copy` of the lexical rows: each `AttributeLexical` row differs from the value its class
 * makes of it and, where a typed column holds the attribute, processes to that column. The column
 * is the family relation's or, for any other attribute, the one the renderer reads
 * (`typedValues`), so one table says where each attribute's typed value lives.
 *
 * An empty `headers` is carried by a lexical row of `""` because no token row can, so the form
 * does not differ there.
 */
const lexicalCopy = (rows: Rows): Finding => {
  const typed = familyValues(rows);
  const value = typedValues(rows);
  for (const row of Rows.of(rows, AttributeLexical)) {
    const whiteSpace = classOf(row.kind, row.attribute);
    if (whiteSpace === undefined || (row.attribute === "headers" && row.value === "")) {
      continue;
    }

    const expected = processed(row.value, whiteSpace);
    if (expected === row.value) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${quoted(row.value)} of ${row.kind} ${row.node} equals its ${whiteSpace}-class value; a lexical row exists only where processing changed the value.`,
      );
    }

    const column =
      typed.get(row.attribute)?.get(row.node) ?? value(row.node, row.kind, row.attribute);
    if (column !== undefined && column !== expected) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${quoted(row.value)} of ${row.kind} ${row.node} processes to ${quoted(expected)}, and its column holds ${quoted(column)}.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy` of `xml:lang` (final review, N7): a typed `""` is admitted only when the source
 * wrote `""`, because `xml.xsd`'s union admits the empty string and no whitespace-only value, and
 * a lexical row beside the `""` means the source wrote one.
 */
const emptyXmlLang = (rows: Rows): Finding => {
  const lexical = new Set(
    Rows.of(rows, AttributeLexical)
      .filter((row) => row.attribute === "xml:lang")
      .map((row) => row.node),
  );
  const found = Rows.of(rows, NodeXmlLang).find((row) => row.value === "" && lexical.has(row.node));

  return found === undefined
    ? undefined
    : refuse(
        "typed-copy",
        `NodeXmlLang ${found.node} is empty beside a lexical xml:lang of white space only, which xml.xsd's union does not admit.`,
      );
};

/**
 * `typed-copy`: phase-1's class over this phase's columns (spec 4.11, bin 2).
 */
const typedCopy = (rows: Rows): Finding =>
  countCopy(rows) ??
  optionalCopy(rows) ??
  maxBoundCopy(rows) ??
  bindingCopy(rows) ??
  replaceClass(rows) ??
  lexicalCopy(rows) ??
  emptyXmlLang(rows);

/**
 * The tokens of a collapsed `IDREFS` value, none for the empty value.
 */
const tokensOf = (collapsed: string): readonly string[] =>
  collapsed === "" ? [] : collapsed.split(" ");

/**
 * What identifies one `AttributeIdref` row besides its attribute: the document, node, position
 * and target a `HeadersTarget` row copies.
 */
interface Reference {
  readonly document: string;
  readonly node: string;
  readonly position: bigint;
  readonly target: string;
}

const referenceKey = (row: Reference): string =>
  `${row.document} ${row.node} ${row.position} ${row.target}`;

/**
 * `HeadersTarget` rows exist exactly for the `headers` rows of `AttributeIdref`.
 */
const headersCopy = (rows: Rows): Finding => {
  const targets = new Set(Rows.of(rows, HeadersTarget).map(referenceKey));
  const references = new Set(
    Rows.of(rows, AttributeIdref)
      .filter((row) => row.attribute === "headers")
      .map(referenceKey),
  );
  const missing = [...references].find((key) => !targets.has(key));
  if (missing !== undefined) {
    return refuse("idref-copy", `The headers reference ${missing} has no HeadersTarget row.`);
  }

  const stray = [...targets].find((key) => !references.has(key));

  return stray === undefined
    ? undefined
    : refuse("idref-copy", `The HeadersTarget row ${stray} copies no headers reference.`);
};

/**
 * `idref-copy`: the `AttributeIdref` rows of a node and attribute are the tokens of the collapsed
 * value in order, from position 0, and `HeadersTarget` holds the `headers` rows and no other.
 *
 * The value is the typed column's where one holds the attribute, else, for `headers`, the lexical
 * row's when the source wrote a form that differs from the collapsed one.
 */
const idrefCopy = (rows: Rows): Finding => {
  const groups = Map.groupBy(
    Rows.of(rows, AttributeIdref).toSorted((a, b) => Number(a.position - b.position)),
    (row) => `${row.node} ${row.attribute}`,
  );
  const typed = familyValues(rows);
  const expectations = new Map<string, readonly string[]>();
  for (const attribute of IdrefAttribute.handles) {
    const holders =
      attribute === "headers"
        ? Rows.of(rows, AttributeLexical)
            .filter((row) => row.attribute === "headers")
            .map((row): [string, string] => [row.node, collapse(row.value)])
        : [...(typed.get(attribute) ?? [])];
    for (const [node, value] of holders) {
      expectations.set(`${node} ${attribute}`, tokensOf(value));
    }
  }

  for (const [key, expected] of expectations) {
    const actual = (groups.get(key) ?? []).map((row) => row.target);
    if (actual.join(" ") !== expected.join(" ")) {
      return refuse(
        "idref-copy",
        `The identifier references of ${key} are ${quoted(actual.join(" "))}; its value ${quoted(expected.join(" "))} has those tokens in order.`,
      );
    }
  }

  for (const [key, group] of groups) {
    const ordered = group.every((row, index) => row.position === BigInt(index));
    const headers = group.every((row) => row.attribute === "headers");
    if (!ordered || (!headers && !expectations.has(key))) {
      return refuse(
        "idref-copy",
        `The identifier references of ${key} ${ordered ? "belong to no attribute row" : "do not count from position 0 without a gap"}.`,
      );
    }
  }

  return headersCopy(rows);
};

const integerPattern = new RegExp(patterns.xsInteger, "u");

const variablePattern = new RegExp(patterns.integerOrVariableString, "u");

/**
 * `varref-copy`: a `PrintedVariableVarRef` row exists exactly for a `base` or `index` whose value
 * is a variable name and not an integer, and names that variable.
 */
const varrefCopy = (rows: Rows): Finding => {
  const spellings: readonly {
    readonly attribute: string;
    readonly node: string;
    readonly value: string;
  }[] = [
    ...Rows.of(rows, PrintedVariable).map((row) => ({
      attribute: "base",
      node: row.id,
      value: row.base,
    })),
    ...Rows.of(rows, PrintedVariableIndex).map((row) => ({
      attribute: "index",
      node: row.node,
      value: row.value,
    })),
  ];
  const named = new Map(
    spellings
      .filter(({ value }) => !integerPattern.test(value) && variablePattern.test(value))
      .map(({ attribute, node, value }) => [`${node} ${attribute}`, value]),
  );
  const references = new Map(
    Rows.of(rows, PrintedVariableVarRef).map((row) => [
      `${row.node} ${row.attribute}`,
      row.identifier,
    ]),
  );
  for (const [key, identifier] of named) {
    if (references.get(key) !== identifier) {
      return refuse(
        "varref-copy",
        `The printed variable ${key} names the variable ${quoted(identifier)}, and its PrintedVariableVarRef row holds ${quoted(references.get(key) ?? "no row")}.`,
      );
    }
  }

  const stray = [...references.keys()].find((key) => !named.has(key));

  return stray === undefined
    ? undefined
    : refuse(
        "varref-copy",
        `The printed variable ${stray} has a PrintedVariableVarRef row beside an integer or absent spelling.`,
      );
};

const languages = (values: readonly { readonly value: string }[]): ReadonlySet<string> =>
  new Set(values.map((row) => row.value));

const sentence = (set: ReadonlySet<string>): string =>
  [...set].map((value) => quoted(value)).join(", ") || "none";

const lomLanguageSet = (rows: Rows, index: Index): Finding => {
  const present = Map.groupBy(Rows.of(rows, ResourceLomLanguageSet), (row) => row.lom);
  const general = Map.groupBy(
    Rows.of(rows, LomLanguage).filter(
      (row) => row.owner === "resource" && index.parents.get(row.id)?.parentKind === "lom:general",
    ),
    (row) => row.lom,
  );
  const loms = new Set([...Rows.of(rows, ResourceLom).map((row) => row.lom), ...present.keys()]);
  for (const lom of loms) {
    const expected = languages(general.get(lom) ?? []);
    const actual = languages(present.get(lom) ?? []);
    if (expected.size !== actual.size || [...expected].some((value) => !actual.has(value))) {
      return refuse(
        "lang-set-copy",
        `The LOM record ${lom} has general languages ${sentence(expected)}, and its ResourceLomLanguageSet holds ${sentence(actual)}.`,
      );
    }
  }

  return undefined;
};

/**
 * `lang-set-copy`: a document's `DocumentLang` rows are the distinct `xml:lang` values of its
 * nodes, each flagged `yes` exactly when the resource's LOM has a `general`, and a resource's
 * `ResourceLomLanguageSet` is the languages of its record's `general`.
 */
const langSetCopy = (rows: Rows, index: Index): Finding => {
  const carried = Map.groupBy(Rows.of(rows, NodeXmlLang), (row) => row.tree);
  const declared = Map.groupBy(Rows.of(rows, DocumentLang), (row) => row.document);
  const documents = new Set([
    ...Rows.of(rows, Document)
      .filter((document) => document.root === "item")
      .map((document) => document.id),
    ...declared.keys(),
  ]);
  for (const document of documents) {
    const expected = languages(carried.get(document) ?? []);
    const actual = languages(declared.get(document) ?? []);
    if (expected.size !== actual.size || [...expected].some((value) => !actual.has(value))) {
      return refuse(
        "lang-set-copy",
        `Document ${document} carries ${sentence(expected)}, and its DocumentLang rows hold ${sentence(actual)}.`,
      );
    }
  }

  const general = new Set(
    Rows.of(rows, ResourceLomGeneral).map((row) => `${row.package} ${row.resource}`),
  );
  for (const row of Rows.of(rows, DocumentLang)) {
    const expected = general.has(`${row.package} ${row.resource}`) ? "yes" : "no";
    if (row.lomGeneral !== expected) {
      return refuse(
        "lang-set-copy",
        `DocumentLang ${row.document} ${quoted(row.value)} holds lomGeneral ${row.lomGeneral}; its resource's LOM ${expected === "yes" ? "has a" : "has no"} general category.`,
      );
    }
  }

  return lomLanguageSet(rows, index);
};

const isInteraction = (kind: string): boolean => kind.endsWith("-interaction");

/**
 * `owner-copy`: `Gap.interaction` names the nearest enclosing gap-match interaction, and a
 * `HottextOwner` row exists exactly for a hottext whose nearest enclosing interaction is a
 * hottext interaction and names it and the hottext's identifier.
 */
const ownerCopy = (rows: Rows, index: Index): Finding => {
  for (const gap of Rows.of(rows, Gap)) {
    const owner = nearestAbove(index, gap.id, (kind) => kind === "qti-gap-match-interaction");
    if (owner !== gap.interaction) {
      return refuse(
        "owner-copy",
        `Gap ${gap.id} names the interaction ${gap.interaction}; its nearest enclosing gap-match interaction is ${owner ?? "none"}.`,
      );
    }
  }

  const owners = new Map(Rows.of(rows, HottextOwner).map((row) => [row.node, row]));
  for (const text of Rows.of(rows, Hottext)) {
    const nearest = nearestAbove(index, text.id, isInteraction);
    const owner =
      nearest !== undefined && index.nodes.get(nearest)?.kind === "qti-hottext-interaction"
        ? nearest
        : undefined;
    const row = owners.get(text.id);
    if (row?.interaction !== owner || (row !== undefined && row.identifier !== text.identifier)) {
      return refuse(
        "owner-copy",
        `Hottext ${text.id} has ${row === undefined ? "no HottextOwner row" : `a HottextOwner row naming ${row.interaction}`}; its nearest enclosing interaction is ${nearest ?? "none"}${owner === undefined ? ", which is not a hottext interaction, so it has no owner row" : ""}.`,
      );
    }
  }

  const known = new Set(Rows.of(rows, Hottext).map((row) => row.id));
  const stray = [...owners.keys()].find((node) => !known.has(node));

  return stray === undefined
    ? undefined
    : refuse("owner-copy", `HottextOwner names the node ${stray}, which is no hottext.`);
};

/**
 * `max-strings-required` (goal 4.12): an extended-text interaction bound to a `multiple` or
 * `ordered` response carries `max-strings`.
 */
const maxStringsRequired = (rows: Rows): Finding => {
  const present = new Set(Rows.of(rows, ExtendedTextMaxStrings).map((row) => row.node));
  const found = Rows.of(rows, TypedBinding).find(
    (binding) =>
      binding.interactionKind === "qti-extended-text-interaction" &&
      binding.cardinality !== "single" &&
      !present.has(binding.node),
  );

  return found === undefined
    ? undefined
    : refuse(
        "max-strings-required",
        `The extended-text interaction ${found.node} is bound to the ${found.cardinality} response ${found.responseIdentifier} and has no max-strings.`,
      );
};

/**
 * A decimal's value scaled to `places` fraction digits, which orders two decimals exactly.
 */
const scaled = (decimal: string, places: number): bigint => {
  const negative = decimal.startsWith("-");
  const unsigned = decimal.startsWith("-") || decimal.startsWith("+") ? decimal.slice(1) : decimal;
  const [whole = "", fraction = ""] = unsigned.split(".");
  const magnitude = BigInt(`${whole}${fraction.padEnd(places, "0")}` || "0");

  return negative ? -magnitude : magnitude;
};

const placesOf = (decimal: string): number => decimal.split(".")[1]?.length ?? 0;

/**
 * `aria-value-range`: `aria-valuemax` is not below `aria-valuemin` where a node has both.
 */
const ariaValueRange = (rows: Rows): Finding => {
  const minimums = written(Rows.of(rows, AriaValuemin));
  for (const maximum of Rows.of(rows, AriaValuemax)) {
    const minimum = minimums.get(maximum.node);
    if (minimum === undefined) {
      continue;
    }

    const places = Math.max(placesOf(minimum), placesOf(maximum.value));
    if (scaled(maximum.value, places) < scaled(minimum, places)) {
      return refuse(
        "aria-value-range",
        `Node ${maximum.node} has aria-valuemax ${maximum.value} below aria-valuemin ${minimum}.`,
      );
    }
  }

  return undefined;
};

const doubleOf = (text: string): number => {
  if (text === "INF") {
    return Number.POSITIVE_INFINITY;
  }

  return text === "-INF" ? Number.NEGATIVE_INFINITY : Number(text);
};

const byDeclaration = (
  facts: readonly { readonly declaration: string; readonly value: string }[],
): Written => new Map(facts.map((fact) => [fact.declaration, fact.value]));

/**
 * `mastery-range` (R14): `normal-minimum <= mastery-value <= normal-maximum` where the pairs
 * are present. A value that is `NaN` orders against nothing.
 */
const masteryRange = (rows: Rows): Finding => {
  const minimums = byDeclaration(Rows.of(rows, DeclarationNormalMinimum));
  const maximums = byDeclaration(Rows.of(rows, DeclarationNormalMaximum));
  for (const [declaration, mastery] of byDeclaration(Rows.of(rows, DeclarationMasteryValue))) {
    const minimum = minimums.get(declaration);
    const maximum = maximums.get(declaration);
    if (minimum !== undefined && doubleOf(minimum) > doubleOf(mastery)) {
      return refuse(
        "mastery-range",
        `Outcome ${declaration} has mastery-value ${mastery} below normal-minimum ${minimum}.`,
      );
    }

    if (maximum !== undefined && doubleOf(mastery) > doubleOf(maximum)) {
      return refuse(
        "mastery-range",
        `Outcome ${declaration} has mastery-value ${mastery} above normal-maximum ${maximum}.`,
      );
    }
  }

  return undefined;
};

/**
 * `string-identifier-distinct`: an interaction's `string-identifier` differs from its
 * `response-identifier`.
 */
const stringIdentifierDistinct = (rows: Rows): Finding => {
  const responses = new Map([
    ...Rows.of(rows, TextEntryInteraction).map((row): [string, string] => [
      row.id,
      row.responseIdentifier,
    ]),
    ...Rows.of(rows, ExtendedTextInteraction).map((row): [string, string] => [
      row.id,
      row.responseIdentifier,
    ]),
  ]);
  const found = Rows.of(rows, StringBinding).find(
    (binding) => responses.get(binding.node) === binding.identifier,
  );

  return found === undefined
    ? undefined
    : refuse(
        "string-identifier-distinct",
        `The interaction ${found.node} names ${found.identifier} as both its response-identifier and its string-identifier.`,
      );
};

/**
 * `same-table-headers` (rule 13): each `headers` target that names an element of the document is
 * in the same table as the cell naming it.
 */
const sameTableHeaders = (rows: Rows, index: Index): Finding => {
  const elements = new Map(
    Rows.of(rows, HtmlId).map((row) => [`${row.document} ${row.id}`, row.node]),
  );
  const tableOf = (id: string): string | undefined =>
    nearestAbove(index, id, (kind) => kind === "table");
  for (const reference of Rows.of(rows, HeadersTarget)) {
    const target = elements.get(`${reference.document} ${reference.target}`);
    if (target !== undefined && tableOf(target) !== tableOf(reference.node)) {
      return refuse(
        "same-table-headers",
        `The cell ${reference.node} names the header ${reference.target}, which is in table ${tableOf(target) ?? "none"}; the cell is in table ${tableOf(reference.node) ?? "none"}.`,
      );
    }
  }

  return undefined;
};

/**
 * The quotation punctuation of rule 15: the straight quotes, the curly and low quotes and the
 * guillemets.
 */
const quotationMarks: ReadonlySet<string> = new Set([
  '"',
  "'",
  "«",
  "»",
  "‘",
  "’",
  "‚",
  "‛",
  "“",
  "”",
  "„",
  "‟",
  "‹",
  "›",
]);

/**
 * The two predefined entities that spell a quote.
 */
const quoteEntities: ReadonlyMap<string, string> = new Map([
  ["apos", "'"],
  ["quot", '"'],
]);

/**
 * The characters each text-bearing node stands for. An entity reference other than the two quote
 * entities is not text this rule can judge, and stands for its own spelling.
 */
const textPieces = (rows: Rows): ReadonlyMap<string, string> =>
  new Map([
    ...Rows.of(rows, TextNode).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, Ws).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, EntityReference).map((row): [string, string] => [
      row.id,
      quoteEntities.get(row.name) ?? `&${row.name};`,
    ]),
  ]);

/**
 * `q-punctuation` (rule 15): no quotation punctuation immediately before, after or inside a `q`.
 */
const qPunctuation = (rows: Rows, index: Index): Finding => {
  const pieces = textPieces(rows);
  const edge = (id: string | undefined, end: "first" | "last"): string | undefined => {
    const text = id === undefined ? undefined : pieces.get(id);

    return end === "first" ? text?.at(0) : text?.at(-1);
  };
  for (const node of Rows.of(rows, Node).filter((row) => row.kind === "q")) {
    const parent = index.parents.get(node.id);
    const siblings = (parent === undefined ? [] : (index.children.get(parent.parent) ?? [])).map(
      (sibling) => sibling.child,
    );
    const at = siblings.indexOf(node.id);
    const inside = (index.children.get(node.id) ?? []).map((child) => child.child);
    const adjacent: readonly (readonly [string, string | undefined])[] = [
      ["before", edge(siblings[at - 1], "last")],
      ["after", edge(siblings[at + 1], "first")],
      ["at its start", edge(inside[0], "first")],
      ["at its end", edge(inside.at(-1), "last")],
    ];
    const mark = adjacent.find(
      ([, character]) => character !== undefined && quotationMarks.has(character),
    );
    if (mark !== undefined) {
      return refuse(
        "q-punctuation",
        `The q ${node.id} has the quotation mark ${quoted(mark[1] ?? "")} ${mark[0]}; the browser draws the quotes.`,
      );
    }
  }

  return undefined;
};

/**
 * Run the content guards over the rows an import built.
 *
 * Reads rows only; writes nothing. `bcp47-syntax` has no guard: `p2-01` built the full `bcp47`
 * pattern without the `xs:language` fallback, so `NodeLang`, `NodeXmlLang` and `DocumentLang`
 * refuse a malformed tag at commit and the rule name stays declared for the importer's map.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link ContentGuardRefusal}
 *   otherwise, in the order ordering, union-count, typed-copy, idref-copy, varref-copy,
 *   lang-set-copy, owner-copy, max-strings-required, aria-value-range, mastery-range,
 *   string-identifier-distinct, same-table-headers, q-punctuation.
 */
export const contentGuards = Effect.fn("contentGuards")(function* contentGuards(
  rows: Rows,
): Effect.fn.Return<void, ContentGuardRefusal> {
  const families = familiesOf(rows);
  const defaults: ReadonlySet<string> = new Set(
    Rows.of(rows, HotspotChoice)
      .filter((choice) => choice.shape === "default")
      .map((choice) => choice.id),
  );
  const index = indexOf(rows);
  const finding =
    ordering(families, defaults) ??
    unionCount(families) ??
    typedCopy(rows) ??
    idrefCopy(rows) ??
    varrefCopy(rows) ??
    langSetCopy(rows, index) ??
    ownerCopy(rows, index) ??
    maxStringsRequired(rows) ??
    ariaValueRange(rows) ??
    masteryRange(rows) ??
    stringIdentifierDistinct(rows) ??
    sameTableHeaders(rows, index) ??
    qPunctuation(rows, index);
  if (finding !== undefined) {
    yield* finding;
  }
});
