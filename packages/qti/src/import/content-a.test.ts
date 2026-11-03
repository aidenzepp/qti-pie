import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer, Predicate } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { exportPackage } from "#qti/export/package.ts";
import { readTree, treesOf } from "#qti/export/read.ts";
import { changeSetOf, importPackage, readRows, retrySchedule } from "#qti/import/package.ts";
import { ruleOfLaw } from "#qti/import/refusal.ts";
import type { ImportLaw, Rule } from "#qti/import/refusal.ts";
import { Rows } from "#qti/import/tree.ts";
import { ChoiceTemplateRef } from "#qti/schema/choices.ts";
import {
  DeclaredFeedbackBlockShowHide,
  FeedbackBlock,
  DeclaredTemplateFeedbackBlockShowHide,
  TemplateFeedbackBlock,
} from "#qti/schema/feedback.ts";
import { Declaration, RecordDeclaration, TypedDeclaration } from "#qti/schema/declaration.ts";
import {
  BindingFit,
  ChoiceInteraction,
  GapMatchBinding,
  InteractionBinding,
  RecordBinding,
  RecordBindingFit,
  SimpleChoice,
  TypedBinding,
} from "#qti/schema/interaction.ts";
import {
  AssociableHotspot,
  AssociateInteraction,
  DeclaredAssociateMaxAssociations,
  DeclaredAssociateMinAssociations,
  GraphicAssociateInteraction,
  MatchInteraction,
  SimpleAssociableChoice,
  SimpleAssociableChoiceMatchMin,
  SimpleMatchSet,
} from "#qti/schema/interactions/associate.ts";
import {
  Gap,
  GapMatchInteraction,
  GapMatchMaxAssociations,
  GapMatchMinAssociations,
  GraphicGapMatchInteraction,
  GraphicGapMatchMaxAssociations,
  GraphicGapMatchMinAssociations,
} from "#qti/schema/interactions/gap.ts";
import {
  Hottext,
  HottextOwner,
  SelectPointInteraction,
  SelectPointMaxChoices,
} from "#qti/schema/interactions/hot.ts";
import {
  OrderInteraction,
  OrderMaxChoices,
  OrderMaxChoicesN,
  OrderMinChoices,
  OrderMinChoicesN,
} from "#qti/schema/interactions/order.ts";
import { MediaInteraction, MediaMaxPlays, MediaMinPlays } from "#qti/schema/interactions/other.ts";
import {
  ExtendedTextInteraction,
  StringBinding,
  TextEntryInteraction,
} from "#qti/schema/interactions/text.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import {
  DeclaredRubricTemplateBlockShowHide,
  DeclaredRubricTemplateInlineShowHide,
  RubricTemplateBlock,
  RubricTemplateInline,
  TemplateBlock,
  TemplateInline,
} from "#qti/schema/template.ts";
import { Edge, Node } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { Coords, CoordsDefault, CoordsRect } from "#qti/schema/shapes.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { rowsOf } from "#qti/test/rows.ts";
import { fixtureRowsLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The 20 positives of phase 2's fixtures a: the 19 cut items of `p2-51`, one per interaction that
 * has a pure corpus item, and `end-attempt`, the hand-written item of the one interaction that has
 * none (spec 3.6).
 */
const positives = [
  "cut-associate",
  "cut-choice",
  "cut-drawing",
  "cut-extended-text",
  "cut-gap-match",
  "cut-graphic-associate",
  "cut-graphic-gap-match",
  "cut-graphic-order",
  "cut-hotspot",
  "cut-hottext",
  "cut-inline-choice",
  "cut-match",
  "cut-media",
  "cut-order",
  "cut-position-object",
  "cut-select-point",
  "cut-slider",
  "cut-text-entry",
  "cut-upload",
  "end-attempt",
] as const satisfies readonly FixtureName[];

/**
 * The four cut items that carry `Coords` rows, the witness of N1: a hotspot-bearing element writes
 * one `Coords` row of its own node kind under each of the three selected bindings of `p2-15`.
 */
const hotspotBearing = [
  "cut-graphic-associate",
  "cut-graphic-gap-match",
  "cut-graphic-order",
  "cut-hotspot",
] as const satisfies readonly FixtureName[];

/**
 * Import a fixture, export it to `work/export/<name>/` and compare the export with the fixture.
 *
 * @param name - The fixture to round-trip.
 * @returns The package id the import answered and the comparison report, whose rendering is also
 *   left beside the export in `work/export/<name>.report.txt`.
 */
const roundTrip = (name: FixtureName) =>
  Effect.gen(function* roundTripFixture() {
    const fs = yield* FileSystem.FileSystem;
    const source = yield* materialize(name);
    const exported = `${workDirectory}/export/${name}`;
    const id = yield* importPackage(source);

    yield* fs.remove(exported, { force: true, recursive: true });
    yield* fs.makeDirectory(exported, { recursive: true });
    yield* exportPackage(id, exported);

    const report = yield* comparePackage(source, exported);

    yield* fs.writeFileString(`${exported}.report.txt`, `${renderReport(report)}\n`);

    return { id, report };
  });

/**
 * The `Coords` rows an imported package holds, from every tree it has.
 *
 * @param id - The package id `importPackage` answered.
 * @returns The rows, each a node, the kind of its owner, a shape and a value.
 */
const coordsOf = (id: string) =>
  Effect.gen(function* coordsOfPackage() {
    const trees = yield* treesOf(id);
    const read = yield* Effect.all(trees.map((tree) => readTree(id, tree)));

    return read.flatMap((rows) => Rows.of(rows, Coords));
  });

/**
 * The cut items the negatives alter, each by the importer's in-memory rows for it.
 */
const negativeFixtures = [
  "cut-associate",
  "cut-choice",
  "cut-extended-text",
  "cut-gap-match",
  "cut-graphic-associate",
  "cut-graphic-gap-match",
  "cut-hottext",
  "cut-match",
  "cut-media",
  "cut-order",
  "cut-select-point",
  "cut-text-entry",
] as const satisfies readonly FixtureName[];

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows for one cut item, a mutable copy per relation, which an alteration edits in
 * place before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * One side of a containment or capacity law as grizzle reports it.
 */
interface Side {
  readonly fields: readonly string[];
  readonly relation: string;
  readonly selection: readonly { readonly field: string; readonly value: string }[];
}

/**
 * The bounds of a capacity as grizzle reports them: a count, `"*"` for no limit, or a `ref` to a
 * field of the target.
 */
interface Within {
  readonly high: bigint | "*";
  readonly low: bigint | { readonly ref: string };
}

/**
 * The laws this file names, in the shape of the `law` of an `invariant-rejected` outcome.
 */
type Law =
  | { readonly fields: readonly string[]; readonly kind: "key"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string }
  | { readonly from: Side; readonly kind: "contained"; readonly to: Side }
  | {
      readonly from: Side;
      readonly kind: "capacity";
      readonly target: Side;
      readonly weight: { readonly kind: "count" };
      readonly within: Within;
    };

const side = (
  relation: AnyRelation,
  fields: readonly string[],
  selection: Side["selection"] = [],
): Side => ({ fields, relation: relation.name, selection });

const containedLaw = (from: Side, to: Side): Law => ({ from, kind: "contained", to });

const keyLaw = (relation: AnyRelation, fields: readonly string[]): Law => ({
  fields,
  kind: "key",
  relation: relation.name,
});

const checkLaw = (relation: AnyRelation, name: string): Law => ({
  kind: "check",
  name,
  relation: relation.name,
});

const patternLaw = (source: string): Law => ({ flags: "u", kind: "pattern", source });

const capacityLaw = (target: Side, from: Side, within: Within): Law => ({
  from,
  kind: "capacity",
  target,
  weight: { kind: "count" },
  within,
});

/**
 * The rows of every negative's fixture, read once for the suite.
 */
class FixtureRows extends Context.Service<FixtureRows, ReadonlyMap<FixtureName, Rows>>()(
  "content-a.test/FixtureRows",
) {}

const FixtureRowsLayer = Layer.effect(
  FixtureRows,
  Effect.gen(function* readFixtureRows() {
    const entries = yield* Effect.all(
      negativeFixtures.map((name) =>
        Effect.gen(function* readOne() {
          const { rows } = yield* readRows(yield* materialize(name));

          return [name, rows] as const;
        }),
      ),
    );

    return new Map(entries);
  }),
).pipe(Layer.provide(NodeServices.layer));

/**
 * A row from the entries of an importer fact, whose fields are all text or bigints.
 */
const rowOf = (entries: readonly (readonly [string, unknown])[]) =>
  Object.fromEntries(
    entries.map(([field, value]): [string, string | bigint] => [
      field,
      Predicate.isString(value) || Predicate.isBigInt(value)
        ? value
        : assert.fail(`${field} is neither text nor a bigint`),
    ]),
  );

const draftOf = (rows: Rows): Draft =>
  new Map(
    [...rows].map(([relation, facts]) => [
      relation,
      facts.map((fact) => rowOf(Object.entries(fact))),
    ]),
  );

/**
 * The editable rows of `relation`, an empty list when the draft has none.
 */
const of = (draft: Draft, relation: AnyRelation): Row[] => {
  const found = draft.get(relation);
  if (found !== undefined) {
    return found;
  }

  const created: Row[] = [];
  draft.set(relation, created);

  return created;
};

const text = (row: Row, field: string): string => {
  const value = row[field];

  return Predicate.isString(value) ? value : assert.fail(`${field} is not text`);
};

/**
 * The first row of `relation` that `matches`, which the fixture has by construction.
 */
const find = (draft: Draft, relation: AnyRelation, matches: (row: Row) => boolean = () => true) => {
  const found = of(draft, relation).find(matches);
  assert.isDefined(found, relation.name);

  return found ?? {};
};

/**
 * The first node of `kind`.
 */
const nodeOf = (draft: Draft, kind: string): Row =>
  find(draft, Node, (row) => text(row, "kind") === kind);

/**
 * The row of `relation` whose `field` is `value`.
 */
const where = (draft: Draft, relation: AnyRelation, field: string, value: string): Row =>
  find(draft, relation, (row) => text(row, field) === value);

/**
 * Remove the node `root`, every node under it, and every row of any relation that names one of
 * them: its edges, its arm and its side rows.
 */
const removeSubtree = (draft: Draft, root: string): void => {
  const doomed = new Set([root]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const edge of of(draft, Edge)) {
      if (doomed.has(text(edge, "parent")) && !doomed.has(text(edge, "child"))) {
        doomed.add(text(edge, "child"));
        grew = true;
      }
    }
  }

  for (const [relation, facts] of draft) {
    draft.set(
      relation,
      facts.filter(
        (fact) => !Object.values(fact).some((v) => Predicate.isString(v) && doomed.has(v)),
      ),
    );
  }
};

/**
 * Remove every child of the node `parent`, with what each owns.
 */
const removeChildren = (draft: Draft, parent: string): void => {
  for (const edge of of(draft, Edge).filter((row) => text(row, "parent") === parent)) {
    removeSubtree(draft, text(edge, "child"));
  }
};

/**
 * Remove `relation`'s rows that `matches`.
 */
const removeRows = (draft: Draft, relation: AnyRelation, matches: (row: Row) => boolean): void => {
  draft.set(
    relation,
    of(draft, relation).filter((row) => !matches(row)),
  );
};

/**
 * Give `relation`'s row for `node` the value `value`: the existing row's value, or a new row.
 */
const setValue = (draft: Draft, relation: AnyRelation, node: string, value: string | bigint) => {
  const found = of(draft, relation).find((row) => text(row, "node") === node);
  if (found === undefined) {
    of(draft, relation).push({ node, value });
  } else {
    found["value"] = value;
  }
};

/**
 * Write a marker row of `relation` for `node`, once.
 */
const mark = (draft: Draft, relation: AnyRelation, node: string): void => {
  if (!of(draft, relation).some((row) => text(row, "node") === node)) {
    of(draft, relation).push({ node });
  }
};

/**
 * Give the response variable `identifier` the shape of `typed`, in every copy the schema holds of
 * it: its declaration, its binding and its value sets, which the variable's children are removed
 * to avoid.
 */
const retypeResponse = (
  draft: Draft,
  identifier: string,
  typed: { readonly baseType?: string; readonly cardinality?: string },
): void => {
  const declaration = where(draft, TypedDeclaration, "identifier", identifier);
  removeChildren(draft, text(declaration, "id"));

  const binding = where(draft, TypedBinding, "responseIdentifier", identifier);
  for (const row of [declaration, binding]) {
    if (typed.baseType !== undefined) {
      row["baseType"] = typed.baseType;
    }

    if (typed.cardinality !== undefined) {
      row["cardinality"] = typed.cardinality;
    }
  }
};

/**
 * Give an association-bearing interaction `max-associations` 1 and `min-associations` 2, in its
 * typed columns and, where `lexical` names them, in the lexical rows beside them.
 */
const invertAssociations = (
  draft: Draft,
  arm: AnyRelation,
  lexical?: { readonly max: AnyRelation; readonly min: AnyRelation },
): void => {
  const row = find(draft, arm);
  const id = text(row, "id");

  row["maxAssociationsN"] = 1n;
  row["minAssociationsN"] = 2n;
  if (lexical !== undefined) {
    setValue(draft, lexical.max, id, "1");
    setValue(draft, lexical.min, id, "2");
  }
};

/**
 * Apply the draft through the author role.
 */
const apply = (draft: Draft) =>
  Effect.gen(function* applyDraft() {
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db
      .apply(changeSetOf(draft), {})
      .pipe(Effect.retry({ schedule: retrySchedule, while: (e) => e._tag === "TransientFailure" }));
  });

/**
 * One alteration of a cut item's rows, the laws it may break and the rule the roster names for it.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly fixture: FixtureName;
  readonly laws: readonly Law[];
  readonly name: string;
  readonly rule: Rule;
}

const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      retypeResponse(draft, "RESPONSE", { baseType: "identifier" });
    },
    fixture: "cut-select-point",
    laws: [
      containedLaw(
        side(TypedBinding, ["interactionKind", "baseType", "cardinality"]),
        side(BindingFit, ["interactionKind", "baseType", "cardinality"]),
      ),
    ],
    name: "a select-point binding of an identifier is refused by the containment into BindingFit",
    rule: "binding-fit",
  },
  {
    alter: (draft) => {
      const point = find(draft, SelectPointInteraction);
      const id = text(point, "id");
      point["maxChoicesN"] = 0n;
      where(draft, TypedBinding, "node", id)["maxCount"] = 0n;
      setValue(draft, SelectPointMaxChoices, id, "0");
    },
    fixture: "cut-select-point",
    laws: [checkLaw(TypedBinding, "BindingMax")],
    name: "a single point binding with a maxCount of 0 is refused by the BindingMax check",
    rule: "binding-max",
  },
  {
    alter: (draft) => {
      retypeResponse(draft, "RESPONSE", { cardinality: "single" });

      const gap = nodeOf(draft, "qti-gap-match-interaction");
      where(draft, TypedBinding, "node", text(gap, "id"))["maxCount"] = 1n;
      where(draft, GapMatchBinding, "node", text(gap, "id"))["cardinality"] = "single";
    },
    fixture: "cut-gap-match",
    laws: [
      capacityLaw(
        side(GapMatchBinding, ["node"], [{ field: "cardinality", value: "single" }]),
        side(Gap, ["interaction"]),
        { high: 1n, low: 0n },
      ),
    ],
    name: "a single-cardinality gap-match binding over two gaps is refused by the capacity",
    rule: "gap-multiple",
  },
  {
    alter: (draft) => {
      const id = text(find(draft, ChoiceInteraction), "id");
      const declaration = where(draft, Declaration, "identifier", "RESPONSE");

      removeChildren(draft, text(declaration, "id"));
      declaration["shape"] = "record";
      removeRows(draft, TypedDeclaration, (row) => text(row, "identifier") === "RESPONSE");
      of(draft, RecordDeclaration).push({ id: text(declaration, "id") });
      where(draft, InteractionBinding, "node", id)["shape"] = "record";
      removeRows(draft, TypedBinding, (row) => text(row, "node") === id);
      of(draft, RecordBinding).push({ interactionKind: "qti-choice-interaction", node: id });
    },
    fixture: "cut-choice",
    laws: [
      containedLaw(
        side(RecordBinding, ["interactionKind"]),
        side(RecordBindingFit, ["interactionKind"]),
      ),
    ],
    name: "a record binding on a choice interaction is refused by the containment into RecordBindingFit",
    rule: "record-binding-fit",
  },
  {
    alter: (draft) => {
      const order = find(draft, OrderInteraction);
      const id = text(order, "id");

      order["maxBound"] = "bounded";
      order["maxChoicesN"] = 2n;
      order["minChoicesN"] = 3n;
      setValue(draft, OrderMaxChoices, id, "2");
      setValue(draft, OrderMinChoices, id, "3");
      setValue(draft, OrderMaxChoicesN, id, 2n);
      setValue(draft, OrderMinChoicesN, id, 3n);
    },
    fixture: "cut-order",
    laws: [checkLaw(OrderInteraction, "OrderChoiceBounds")],
    name: "an order interaction with min-choices 3 and max-choices 2 is refused by the OrderChoiceBounds check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      const id = text(find(draft, AssociateInteraction), "id");

      find(draft, AssociateInteraction)["maxAssociationsN"] = 1n;
      find(draft, AssociateInteraction)["minAssociationsN"] = 2n;
      where(draft, TypedBinding, "node", id)["maxCount"] = 1n;
      mark(draft, DeclaredAssociateMaxAssociations, id);
      mark(draft, DeclaredAssociateMinAssociations, id);
    },
    fixture: "cut-associate",
    laws: [checkLaw(AssociateInteraction, "AssociateBounds")],
    name: "an associate interaction with max-associations 1 and min-associations 2 is refused by the AssociateBounds check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      const media = find(draft, MediaInteraction);
      const id = text(media, "id");

      media["maxPlaysN"] = 1n;
      media["minPlaysN"] = 2n;
      setValue(draft, MediaMaxPlays, id, "1");
      setValue(draft, MediaMinPlays, id, "2");
    },
    fixture: "cut-media",
    laws: [checkLaw(MediaInteraction, "MediaPlays")],
    name: "a media interaction with max-plays 1 and min-plays 2 is refused by the MediaPlays check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      const choice = find(draft, SimpleAssociableChoice);

      choice["matchMaxN"] = 1n;
      choice["matchMinN"] = 2n;
      mark(draft, SimpleAssociableChoiceMatchMin, text(choice, "id"));
    },
    fixture: "cut-associate",
    laws: [checkLaw(SimpleAssociableChoice, "SimpleAssociableChoiceBounds")],
    name: "a simple associable choice with match-max 1 and match-min 2 is refused by its bounds check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      const id = text(find(draft, OrderInteraction), "id");

      setValue(draft, OrderMinChoices, id, "0");
      setValue(draft, OrderMinChoicesN, id, 0n);
    },
    fixture: "cut-order",
    laws: [patternLaw(patterns.positiveInteger)],
    name: "an order interaction with min-choices 0 is refused by the positiveInteger pattern",
    rule: "attribute-lexical",
  },
  {
    alter: (draft) => {
      const order = find(draft, OrderInteraction);
      const id = text(order, "id");
      const last = of(draft, SimpleChoice).at(2);

      removeSubtree(draft, text(last ?? {}, "id"));
      order["maxBound"] = "bounded";
      order["maxChoicesN"] = 3n;
      setValue(draft, OrderMaxChoices, id, "3");
      setValue(draft, OrderMaxChoicesN, id, 3n);
    },
    fixture: "cut-order",
    laws: [
      capacityLaw(
        side(OrderInteraction, ["id"], [{ field: "maxBound", value: "bounded" }]),
        side(SimpleChoice, ["interaction"]),
        { high: "*", low: { ref: "maxChoicesN" } },
      ),
    ],
    name: "a bounded order interaction with max-choices 3 over two choices is refused by the capacity on maxChoicesN",
    rule: "order-choice-count",
  },
  {
    alter: (draft) => {
      const order = find(draft, OrderInteraction);
      const id = text(order, "id");
      const last = of(draft, SimpleChoice).at(2);

      removeSubtree(draft, text(last ?? {}, "id"));
      // The bound is `bounded` and `maxChoicesN` keeps the fixture's value, so the maximum's capacity holds: a maximum of 3 over two choices would fire it too, and only the minimum's is to be broken.
      order["maxBound"] = "bounded";
      order["minChoicesN"] = 3n;
      setValue(draft, OrderMinChoices, id, "3");
      setValue(draft, OrderMinChoicesN, id, 3n);
    },
    fixture: "cut-order",
    laws: [
      capacityLaw(
        side(OrderInteraction, ["id"], [{ field: "maxBound", value: "bounded" }]),
        side(SimpleChoice, ["interaction"]),
        { high: "*", low: { ref: "minChoicesN" } },
      ),
    ],
    name: "a bounded order interaction with min-choices 3 over two choices is refused by the capacity on minChoicesN",
    rule: "order-choice-count",
  },
  {
    alter: (draft) => {
      const [first, second] = of(draft, SimpleAssociableChoice);

      (second ?? {})["identifier"] = text(first ?? {}, "identifier");
    },
    fixture: "cut-associate",
    laws: [keyLaw(SimpleAssociableChoice, ["interaction", "identifier"])],
    name: "two simple associable choices with one identifier are refused by the key on (interaction, identifier)",
    rule: "choice-key",
  },
  {
    alter: (draft) => {
      const [first, second] = of(draft, Gap);

      (second ?? {})["identifier"] = text(first ?? {}, "identifier");
    },
    fixture: "cut-gap-match",
    laws: [keyLaw(Gap, ["interaction", "identifier"])],
    name: "two gaps with one identifier are refused by the key on (interaction, identifier)",
    rule: "choice-key",
  },
  {
    alter: (draft) => {
      const [first, second] = of(draft, HottextOwner);
      const identifier = text(first ?? {}, "identifier");

      (second ?? {})["identifier"] = identifier;
      where(draft, Hottext, "id", text(second ?? {}, "node"))["identifier"] = identifier;
    },
    fixture: "cut-hottext",
    laws: [keyLaw(HottextOwner, ["interaction", "identifier"])],
    name: "two owned hottexts with one identifier are refused by the key on (interaction, identifier)",
    rule: "choice-key",
  },
  {
    alter: (draft) => {
      const feedback = where(draft, TypedDeclaration, "identifier", "FEEDBACK");

      of(draft, ChoiceTemplateRef).push({
        baseType: "identifier",
        cardinality: "single",
        document: text(feedback, "document"),
        identifier: "FEEDBACK",
        node: text(find(draft, ExtendedTextInteraction), "id"),
      });
    },
    fixture: "cut-extended-text",
    laws: [
      containedLaw(
        side(ChoiceTemplateRef, ["document", "identifier"]),
        side(Declaration, ["document", "identifier"], [{ field: "kind", value: "template" }]),
      ),
    ],
    name: "a choice template reference naming an outcome is refused by the containment into the template declarations",
    rule: "template-ref",
  },
  {
    alter: (draft) => {
      const score = where(draft, TypedDeclaration, "identifier", "SCORE");

      of(draft, StringBinding).push({
        document: text(score, "document"),
        identifier: "SCORE",
        node: text(find(draft, TextEntryInteraction), "id"),
      });
    },
    fixture: "cut-text-entry",
    laws: [
      containedLaw(
        side(StringBinding, ["document", "identifier"]),
        side(Declaration, ["document", "identifier"], [{ field: "kind", value: "response" }]),
      ),
    ],
    name: "a string binding naming an outcome is refused by the containment into the response declarations",
    rule: "string-binding",
  },
  {
    alter: (draft) => {
      const response = where(draft, TypedDeclaration, "identifier", "RESPONSE");
      const document = text(response, "document");

      for (const node of [find(draft, TextEntryInteraction), nodeOf(draft, "qti-item-body")]) {
        of(draft, StringBinding).push({
          document,
          identifier: "RESPONSE",
          node: text(node, "id"),
        });
      }
    },
    fixture: "cut-text-entry",
    laws: [keyLaw(StringBinding, ["document", "identifier"])],
    name: "two string bindings with one identifier are refused by the key on (document, identifier)",
    rule: "string-binding",
  },
  {
    alter: (draft) => {
      removeSubtree(draft, text(find(draft, SimpleMatchSet), "id"));
    },
    fixture: "cut-match",
    laws: [
      capacityLaw(
        side(MatchInteraction, ["id"]),
        side(Edge, ["parent"], [{ field: "childKind", value: "qti-simple-match-set" }]),
        { high: 2n, low: 2n },
      ),
    ],
    name: "a match interaction with one simple match set is refused by the capacity",
    rule: "match-sets",
  },
  {
    alter: (draft) => {
      const hotspot = find(draft, AssociableHotspot);
      const id = text(hotspot, "id");
      const coords = where(draft, Coords, "node", id);

      hotspot["shape"] = "default";
      coords["shape"] = "default";
      removeRows(draft, CoordsRect, (row) => text(row, "node") === id);
      of(draft, CoordsDefault).push({ node: id, value: text(coords, "value") });
    },
    fixture: "cut-graphic-gap-match",
    laws: [checkLaw(AssociableHotspot, "NoDefaultHotspotInGraphicGapMatch")],
    name: "a default associable hotspot under a graphic-gap-match is refused by its check",
    rule: "hotspot-default",
  },
  {
    alter: (draft) => {
      const id = text(find(draft, AssociableHotspot), "id");

      where(draft, Coords, "node", id)["value"] = "11,122,64";
      where(draft, CoordsRect, "node", id)["value"] = "11,122,64";
    },
    fixture: "cut-graphic-gap-match",
    laws: [patternLaw(patterns.coordsRect)],
    name: "a rect with three coordinate tokens is refused by the coordsRect pattern",
    rule: "attribute-lexical",
  },
  {
    alter: (draft) => {
      const id = text(find(draft, AssociableHotspot), "id");

      where(draft, Coords, "node", id)["ownerKind"] = "qti-hotspot-choice";
    },
    fixture: "cut-graphic-gap-match",
    laws: [containedLaw(side(Coords, ["node", "ownerKind"]), side(Node, ["id", "kind"]))],
    name: "a Coords row owned by a hotspot choice on an associable hotspot's node is refused by the containment into Node",
    rule: "coords-owner",
  },
  {
    alter: (draft) => {
      invertAssociations(draft, MatchInteraction);
    },
    fixture: "cut-match",
    laws: [checkLaw(MatchInteraction, "MatchBounds")],
    name: "a match interaction with max-associations 1 and min-associations 2 is refused by the MatchBounds check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      invertAssociations(draft, GraphicAssociateInteraction);
    },
    fixture: "cut-graphic-associate",
    laws: [checkLaw(GraphicAssociateInteraction, "GraphicAssociateBounds")],
    name: "a graphic-associate interaction with max-associations 1 and min-associations 2 is refused by the GraphicAssociateBounds check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      invertAssociations(draft, GapMatchInteraction, {
        max: GapMatchMaxAssociations,
        min: GapMatchMinAssociations,
      });
    },
    fixture: "cut-gap-match",
    laws: [checkLaw(GapMatchInteraction, "GapMatchBounds")],
    name: "a gap-match interaction with max-associations 1 and min-associations 2 is refused by the GapMatchBounds check",
    rule: "choice-bounds",
  },
  {
    alter: (draft) => {
      invertAssociations(draft, GraphicGapMatchInteraction, {
        max: GraphicGapMatchMaxAssociations,
        min: GraphicGapMatchMinAssociations,
      });
    },
    fixture: "cut-graphic-gap-match",
    laws: [checkLaw(GraphicGapMatchInteraction, "GraphicGapMatchBounds")],
    name: "a graphic-gap-match interaction with max-associations 1 and min-associations 2 is refused by the GraphicGapMatchBounds check",
    rule: "choice-bounds",
  },
];

describe.skipIf(!hasLease)(
  "import/content-a.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the 20 positives round-trip through the database", (it) => {
      for (const name of positives) {
        it.effect(`${name} imports, exports and compares all equal`, () =>
          Effect.gen(function* positiveRoundTrip() {
            const { report } = yield* roundTrip(name);

            assert.isAbove(report.length, 1, "a package is at least a manifest and an item");
            assert.strictEqual(
              report.filter(
                (item) =>
                  item.outcome.kind !== "canonical-equal" && item.outcome.kind !== "byte-identical",
              ).length,
              0,
              renderReport(report),
            );
            assert.isTrue(renderReport(report).endsWith("\nall equal"), renderReport(report));
          }),
        );
      }

      for (const name of hotspotBearing) {
        it.effect(`${name} carries Coords rows of one owner kind`, () =>
          Effect.gen(function* coordsWitness() {
            const fs = yield* FileSystem.FileSystem;
            const { id } = yield* roundTrip(name);
            const coords = yield* coordsOf(id);
            const kinds = [...new Set(coords.map((row) => row.ownerKind))];
            const line = `${name}: ${coords.length} Coords rows, owner kind ${kinds.join(", ")}`;

            yield* fs.writeFileString(`${workDirectory}/export/${name}.coords.txt`, `${line}\n`);
            yield* Effect.log(line);

            assert.isAbove(coords.length, 0, line);
            assert.strictEqual(kinds.length, 1, line);
          }),
        );
      }
    });
  },
);

/**
 * The identifiers of the rows of an arm an imported package holds, sorted.
 *
 * @param id - The package id `importPackage` answered.
 * @param arm - An arm that carries an `identifier` column.
 * @returns The identifiers.
 */
const identifiersOf = (
  id: string,
  arm:
    | typeof FeedbackBlock
    | typeof RubricTemplateBlock
    | typeof RubricTemplateInline
    | typeof TemplateBlock
    | typeof TemplateFeedbackBlock
    | typeof TemplateInline,
) => Effect.map(rowsOf(id, arm), (rows) => rows.map((row) => row.identifier).toSorted());

/**
 * Assert that a round trip compares all equal.
 *
 * @param report - The comparison report.
 */
const assertAllEqual = (report: Effect.Success<ReturnType<typeof roundTrip>>["report"]) => {
  assert.isAbove(report.length, 1, "a package is at least a manifest and an item");
  assert.strictEqual(
    report.filter(
      (item) => item.outcome.kind !== "canonical-equal" && item.outcome.kind !== "byte-identical",
    ).length,
    0,
    renderReport(report),
  );
  assert.isTrue(renderReport(report).endsWith("\nall equal"), renderReport(report));
};

describe.skipIf(!hasLease)(
  "import/content-a.test.ts, the feedback and template kinds, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the six feedback and template kinds each import into their own arm", (it) => {
      it.effect(
        "feedback-block-kinds imports, exports and compares all equal, each kind in its own arm",
        () =>
          Effect.gen(function* feedbackKinds() {
            const { id, report } = yield* roundTrip("feedback-block-kinds");

            assertAllEqual(report);

            assert.deepStrictEqual(yield* identifiersOf(id, FeedbackBlock), ["fa"]);
            assert.deepStrictEqual(yield* identifiersOf(id, TemplateFeedbackBlock), ["ft"]);
            assert.deepStrictEqual(yield* identifiersOf(id, TemplateBlock), ["tb"]);
            assert.strictEqual(
              (yield* rowsOf(id, DeclaredTemplateFeedbackBlockShowHide)).length,
              1,
            );
            // None: the fixture's `qti-feedback-block` `fa` writes no `show-hide`; only `ft` in the template block does.
            assert.strictEqual((yield* rowsOf(id, DeclaredFeedbackBlockShowHide)).length, 0);
          }),
      );

      it.effect(
        "rubric-template-kinds imports, exports and compares all equal, each kind in its own arm",
        () =>
          Effect.gen(function* rubricKinds() {
            const { id, report } = yield* roundTrip("rubric-template-kinds");

            assertAllEqual(report);

            assert.deepStrictEqual(yield* identifiersOf(id, RubricTemplateBlock), ["rb"]);
            assert.deepStrictEqual(yield* identifiersOf(id, RubricTemplateInline), ["ri"]);
            assert.deepStrictEqual(yield* identifiersOf(id, TemplateInline), ["ti"]);
            assert.strictEqual((yield* rowsOf(id, DeclaredRubricTemplateBlockShowHide)).length, 1);
            assert.strictEqual((yield* rowsOf(id, DeclaredRubricTemplateInlineShowHide)).length, 1);
          }),
      );
    });
  },
);

/**
 * One alteration of a cut item's rows that the database admits.
 */
interface Admitted {
  readonly alter: (draft: Draft) => void;
  readonly fixture: FixtureName;
  readonly name: string;
}

const admitted: readonly Admitted[] = [
  {
    // Bin 3 of the spec's 4.11: a hottext outside every interaction has no `HottextOwner` row, so two of them may share an identifier. The alteration leaves two hottexts of the cut item unowned and gives them one identifier.
    alter: (draft) => {
      const owners = of(draft, HottextOwner);
      const third = owners.at(2);
      const fourth = owners.at(3);
      const identifier = text(third ?? {}, "identifier");

      removeRows(draft, HottextOwner, (row) => row === third || row === fourth);
      where(draft, Hottext, "id", text(fourth ?? {}, "node"))["identifier"] = identifier;
    },
    fixture: "cut-hottext",
    name: "two unowned hottexts with one identifier are admitted",
  },
];

describe.skipIf(!hasLease)(
  "import/content-a.test.ts, the negatives, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, FixtureRowsLayer), {
      excludeTestServices: true,
      timeout: fixtureRowsLayerHookTimeoutMs,
    })("interactions, choices and bindings are refused by the database", (it) => {
      for (const negative of negatives) {
        it.effect(negative.name, () =>
          Effect.gen(function* refused() {
            const fixtures = yield* FixtureRows;
            const rows = fixtures.get(negative.fixture);
            assert.isDefined(rows, negative.fixture);

            const draft = draftOf(rows ?? Rows.empty());
            negative.alter(draft);

            const outcome = yield* apply(draft);

            assert.strictEqual(outcome.kind, "invariant-rejected");
            if (outcome.kind === "invariant-rejected") {
              const reported: unknown = outcome.law;
              const named = negative.laws.find((law) => isDeepStrictEqual(reported, law));
              assert.deepStrictEqual(reported, named ?? negative.laws[0]);
              assert.strictEqual(ruleOfLaw(outcome.law satisfies ImportLaw), negative.rule);
            }
          }),
        );
      }

      for (const name of negativeFixtures.filter((fixture) => fixture !== "cut-hottext")) {
        it.effect(
          `the unaltered rows of ${name} are accepted, so each refusal above is its alteration's`,
          () =>
            Effect.gen(function* unaltered() {
              const rows = (yield* FixtureRows).get(name);
              assert.isDefined(rows, name);

              const outcome = yield* apply(draftOf(rows ?? Rows.empty()));

              assert.strictEqual(outcome.kind, "accepted");
            }),
        );
      }

      for (const positive of admitted) {
        it.effect(positive.name, () =>
          Effect.gen(function* admit() {
            const rows = (yield* FixtureRows).get(positive.fixture);
            assert.isDefined(rows, positive.fixture);

            const draft = draftOf(rows ?? Rows.empty());
            positive.alter(draft);

            const outcome = yield* apply(draft);

            assert.strictEqual(outcome.kind, "accepted");
          }),
        );
      }
    });
  },
);
