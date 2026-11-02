/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The content guards: the facts about the M1 content rows that no single relation can state,
 * judged over the rows an import built before any of them is written.
 *
 * This module holds the ordering and union-count classes (spec 4.11, bin 2). Both read only the
 * `Edge` rows: the children of each parent in position order, by kind, under the schema version
 * the edge carries.
 */
import { Effect, Schema } from "effect";
import { Rows } from "#qti/import/tree.ts";
import { HotspotChoice } from "#qti/schema/interactions/hot.ts";
import { Edge, Node, vocabularies } from "#qti/schema/node.ts";
import type { SchemaVersionHandle } from "#qti/schema/node.ts";

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
 * Run the content guards over the rows an import built.
 *
 * Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link ContentGuardRefusal}
 *   otherwise, in the order ordering, union-count.
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

  for (const finding of [ordering(families, defaults), unionCount(families)]) {
    if (finding !== undefined) {
      yield* finding;
    }
  }
});
