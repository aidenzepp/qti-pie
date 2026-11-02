import { randomUUID } from "node:crypto";
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
import { ImportRefused, isMappedLaw, ruleOfLaw } from "#qti/import/refusal.ts";
import type { ImportLaw, Rule } from "#qti/import/refusal.ts";
import { Rows } from "#qti/import/tree.ts";
import {
  AriaLevel,
  AriaValuetext,
  AttributeIdref,
  HeadersTarget,
  NodeClass,
  NodeLabel,
  NodeLang,
} from "#qti/schema/attributes.ts";
import { DocumentId, HtmlId } from "#qti/schema/document.ts";
import { ContentBodyModal, FeedbackBlock, FeedbackInline } from "#qti/schema/feedback.ts";
import { VideoControls } from "#qti/schema/html/media.ts";
import { InteractionBinding } from "#qti/schema/interaction.ts";
import { Gap } from "#qti/schema/interactions/gap.ts";
import { Hottext, HottextOwner } from "#qti/schema/interactions/hot.ts";
import { TextEntryInteraction } from "#qti/schema/interactions/text.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { AttributeLexical, Edge, Node } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { RubricBlock } from "#qti/schema/rubric.ts";
import { PrintedVariableFormat } from "#qti/schema/template.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

/**
 * The directory every export is written under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The 40 positives of phase 2's fixtures b: one hand-written item per HTML kind that has an arm
 * and that the corpus never uses (spec 3.6's second census; `template` has no arm and no positive).
 * Each is `cut-choice`'s item with one minimal use of the element in its body.
 */
const positives = [
  "html-abbr",
  "html-acronym",
  "html-address",
  "html-article",
  "html-aside",
  "html-audio",
  "html-bdi",
  "html-big",
  "html-caption",
  "html-cite",
  "html-code",
  "html-col",
  "html-colgroup",
  "html-dd",
  "html-details",
  "html-dfn",
  "html-dl",
  "html-dt",
  "html-footer",
  "html-h4",
  "html-h6",
  "html-header",
  "html-kbd",
  "html-label",
  "html-nav",
  "html-ol",
  "html-param",
  "html-pre",
  "html-q",
  "html-rp",
  "html-rtc",
  "html-samp",
  "html-small",
  "html-sub",
  "html-summary",
  "html-tfoot",
  "html-th",
  "html-thead",
  "html-tt",
  "html-var",
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

describe.skipIf(!hasLease)(
  "import/content-b.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the 40 HTML positives round-trip through the database", (it) => {
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
    });
  },
);

/**
 * The fixtures whose importer rows the direct negatives alter: `cut-choice` for the attribute,
 * id, ancestry and edge laws, `cut-text-entry`, `cut-hottext` and `cut-gap-match` for the kinds
 * whose arm a childless node of the ancestry negatives copies, `html-th` for the `headers` law and
 * `controls-3-0-0` for the version-gated `controls`.
 */
const negativeBases = [
  "cut-choice",
  "cut-gap-match",
  "cut-hottext",
  "cut-text-entry",
  "controls-3-0-0",
  "html-th",
] as const satisfies readonly FixtureName[];

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows for one fixture, a mutable copy per relation, which an alteration edits in
 * place before the rows are applied.
 */
type Draft = Map<AnyRelation, Row[]>;

/**
 * One side of a containment law as grizzle reports it.
 */
interface Side {
  readonly fields: readonly string[];
  readonly relation: string;
  readonly selection: readonly { readonly field: string; readonly value: string }[];
}

/**
 * The laws this file names, in the shape of the `law` of an `invariant-rejected` outcome.
 */
type Law =
  | { readonly fields: readonly string[]; readonly kind: "key"; readonly relation: string }
  | { readonly fields: readonly string[]; readonly kind: "primaryKey"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string }
  | { readonly from: Side; readonly kind: "contained"; readonly to: Side };

const side = (
  relation: AnyRelation,
  fields: readonly string[],
  selection: Side["selection"] = [],
): Side => ({ fields, relation: relation.name, selection });

const containedLaw = (from: Side, to: Side): Law => ({ from, kind: "contained", to });

const checkLaw = (relation: AnyRelation, name: string): Law => ({
  kind: "check",
  name,
  relation: relation.name,
});

const patternLaw = (source: string): Law => ({ flags: "u", kind: "pattern", source });

/**
 * The rows of every base fixture, read once for the suite.
 */
class BaseRows extends Context.Service<BaseRows, ReadonlyMap<FixtureName, Rows>>()(
  "content-b.test/BaseRows",
) {}

const BaseRowsLayer = Layer.effect(
  BaseRows,
  Effect.gen(function* readBaseRows() {
    const entries = yield* Effect.all(
      negativeBases.map((name) =>
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
 * The document tree of the draft's item: the tree of its `qti-assessment-item`.
 */
const documentOf = (draft: Draft): string => text(nodeOf(draft, "qti-assessment-item"), "tree");

/**
 * Add a node of `kind` at `ancestry` to the item's tree, with no edge, and its arm row `arm`.
 *
 * @returns The new node's id.
 */
const addNode = (
  draft: Draft,
  kind: string,
  ancestry: string,
  arm: { readonly relation: AnyRelation; readonly row: Row },
): string => {
  const id = randomUUID();
  const like = nodeOf(draft, "qti-item-body");

  of(draft, Node).push({ ...like, ancestry, id, kind });
  of(draft, arm.relation).push({ ...arm.row, id });

  return id;
};

/**
 * Copy the arm row of the first node of `kind` as a new, childless node of `kind` at `ancestry`.
 *
 * @returns The new node's id.
 */
const copyNode = (
  draft: Draft,
  kind: string,
  ancestry: string,
  arm: AnyRelation,
  changes: Row = {},
): string => {
  const from = text(nodeOf(draft, kind), "id");
  const row = find(draft, arm, (r) => text(r, "id") === from);

  return addNode(draft, kind, ancestry, { relation: arm, row: { ...row, ...changes } });
};

/**
 * An edge from `parent` to `child` at position 0, both of the draft's tree.
 */
const edgeRow = (
  draft: Draft,
  parent: { readonly ancestry: string; readonly id: string; readonly kind: string },
  child: { readonly ancestry: string; readonly id: string; readonly kind: string },
) => {
  const like = nodeOf(draft, "qti-item-body");

  return {
    child: child.id,
    childAncestry: child.ancestry,
    childKind: child.kind,
    parent: parent.id,
    parentAncestry: parent.ancestry,
    parentKind: parent.kind,
    position: 0n,
    tree: text(like, "tree"),
    version: text(like, "version"),
  };
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
 * One alteration of an item's rows, the law that must refuse it and the rule the roster names for
 * that law.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly fixture: FixtureName;
  readonly law: Law;
  readonly name: string;
  readonly rule: Rule;
}

/**
 * The node `node` of the first row of `relation`, for an attribute row that names an existing node.
 */
const idOf = (draft: Draft, kind: string): string => text(nodeOf(draft, kind), "id");

const attributeAdmissionOf = (relation: AnyRelation) =>
  containedLaw(side(relation, ["kind", "attribute"]), {
    fields: ["kind", "attribute"],
    relation: "AttributeAdmission",
    selection: [],
  });

const ancestryBan = containedLaw(side(Node, ["ancestry", "kind"]), {
  fields: ["ancestry", "kind"],
  relation: "AncestryStep",
  selection: [],
});

const ancestryStep = containedLaw(side(Edge, ["parentAncestry", "parentKind", "childAncestry"]), {
  fields: ["ancestry", "kind", "next"],
  relation: "AncestryStep",
  selection: [],
});

const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      const body = addNode(draft, "qti-content-body.modal", "root", {
        relation: ContentBodyModal,
        row: {},
      });
      const edge = find(draft, Edge, (row) => text(row, "childKind") === "qti-choice-interaction");

      edge["parent"] = body;
      edge["parentKind"] = "qti-content-body.modal";
      edge["parentAncestry"] = "root";
      edge["position"] = 0n;
    },
    fixture: "cut-choice",
    law: containedLaw(side(Edge, ["version", "parentKind", "childKind"]), {
      fields: ["version", "parent", "child"],
      relation: "Admission",
      selection: [],
    }),
    name: "a choice interaction in a modal feedback's content body is refused by the containment into Admission",
    rule: "admission",
  },
  {
    alter: (draft) => {
      of(draft, NodeLang).push({
        attribute: "lang",
        kind: "qti-item-body",
        node: idOf(draft, "qti-item-body"),
        value: "en",
      });
    },
    fixture: "cut-choice",
    law: attributeAdmissionOf(NodeLang),
    name: "a lang on an item body is refused by the containment into AttributeAdmission",
    rule: "attribute-admission",
  },
  {
    alter: (draft) => {
      const item = nodeOf(draft, "qti-assessment-item");

      of(draft, NodeLabel).push({
        attribute: "label",
        kind: "qti-assessment-item",
        node: text(item, "id"),
        rootKind: "item",
        tree: text(item, "tree"),
        value: "x",
      });
    },
    fixture: "cut-choice",
    law: checkLaw(NodeLabel, "NodeLabelNotRoot"),
    name: "a NodeLabel row on the item root is refused by the NodeLabelNotRoot check",
    rule: "attribute-admission",
  },
  {
    alter: (draft) => {
      of(draft, AttributeLexical).push({
        attribute: "shuffle",
        kind: "p",
        node: idOf(draft, "p"),
        value: " true",
      });
    },
    fixture: "cut-choice",
    law: attributeAdmissionOf(AttributeLexical),
    name: "a lexical shuffle of a p is refused by the containment into AttributeAdmission",
    rule: "attribute-admission",
  },
  {
    alter: (draft) => {
      of(draft, AriaLevel).push({
        attribute: "aria-level",
        kind: "p",
        node: idOf(draft, "p"),
        value: "0",
      });
    },
    fixture: "cut-choice",
    law: patternLaw(patterns.positiveInteger),
    name: "an aria-level of 0 is refused by the positiveInteger pattern",
    rule: "attribute-lexical",
  },
  {
    alter: (draft) => {
      of(draft, PrintedVariableFormat).push({ node: idOf(draft, "p"), value: "%q" });
    },
    fixture: "cut-choice",
    law: patternLaw(patterns.printfFormat),
    name: "a printed variable format of %q is refused by the printfFormat pattern",
    rule: "attribute-lexical",
  },
  {
    alter: (draft) => {
      of(draft, NodeLang).push({
        attribute: "lang",
        kind: "p",
        node: idOf(draft, "p"),
        value: "en--x",
      });
    },
    fixture: "cut-choice",
    law: patternLaw(patterns.bcp47),
    name: "a lang of en--x is refused by the bcp47 pattern",
    rule: "attribute-lexical",
  },
  {
    alter: (draft) => {
      const document = documentOf(draft);
      const node = idOf(draft, "p");

      of(draft, HtmlId).push({ attribute: "id", document, id: "RESPONSE", kind: "p", node });
      of(draft, DocumentId).push({ document, holder: "htmlId", id: "RESPONSE" });
    },
    fixture: "cut-choice",
    law: { fields: ["document", "id"], kind: "primaryKey", relation: "DocumentId" },
    name: "an HtmlId and a ResponseDeclarationId of one identifier are refused by the DocumentId key",
    rule: "document-key",
  },
  {
    alter: (draft) => {
      of(draft, AttributeIdref).push({
        attribute: "aria-labelledby",
        document: documentOf(draft),
        node: idOf(draft, "p"),
        position: 0n,
        target: "nowhere",
      });
    },
    fixture: "cut-choice",
    law: containedLaw(side(AttributeIdref, ["document", "target"]), {
      fields: ["document", "id"],
      relation: "DocumentId",
      selection: [],
    }),
    name: "an idref whose target is no DocumentId is refused by the containment into DocumentId",
    rule: "admission",
  },
  {
    alter: (draft) => {
      const document = documentOf(draft);
      const cell = idOf(draft, "td");
      const reference = {
        attribute: "headers",
        document,
        node: cell,
        position: 0n,
        target: "cell-id",
      };

      of(draft, HtmlId).push({ attribute: "id", document, id: "cell-id", kind: "td", node: cell });
      of(draft, DocumentId).push({ document, holder: "htmlId", id: "cell-id" });
      of(draft, AttributeIdref).push({ ...reference });
      of(draft, HeadersTarget).push({ ...reference });
    },
    fixture: "html-th",
    law: containedLaw(side(HeadersTarget, ["document", "target"]), {
      fields: ["document", "id"],
      relation: "HtmlId",
      selection: [{ field: "kind", value: "th" }],
    }),
    name: "a headers target that is a td is refused by the containment into the th selection",
    rule: "admission",
  },
  {
    alter: (draft) => {
      copyNode(draft, "qti-text-entry-interaction", "int.choice", TextEntryInteraction);
    },
    fixture: "cut-text-entry",
    law: ancestryBan,
    name: "a childless text entry interaction at int.choice is refused by the containment into AncestryStep",
    rule: "ancestry-ban",
  },
  {
    alter: (draft) => {
      copyNode(draft, "qti-gap", "root", Gap, { identifier: "Gx" });
    },
    fixture: "cut-gap-match",
    law: ancestryBan,
    name: "a childless qti-gap at root is refused by the containment into AncestryStep",
    rule: "ancestry-ban",
  },
  {
    alter: (draft) => {
      addNode(draft, "qti-rubric-block", "rubric", {
        relation: RubricBlock,
        row: { use: "scoring", view: "candidate" },
      });
    },
    fixture: "cut-choice",
    law: ancestryBan,
    name: "a rubric block at rubric is refused by the containment into AncestryStep",
    rule: "ancestry-ban",
  },
  {
    alter: (draft) => {
      copyNode(draft, "qti-hottext", "int.htx", Hottext);
    },
    fixture: "cut-hottext",
    law: ancestryBan,
    name: "a childless hottext at int.htx is refused by the containment into AncestryStep",
    rule: "ancestry-ban",
  },
  {
    alter: (draft) => {
      copyNode(draft, "qti-text-entry-interaction", "htx", TextEntryInteraction);
    },
    fixture: "cut-text-entry",
    law: ancestryBan,
    name: "a childless text entry interaction at htx is refused by the containment into AncestryStep",
    rule: "ancestry-ban",
  },
  {
    alter: (draft) => {
      const space = find(draft, Edge, (row) => text(row, "childKind") === "ws");
      const child = find(draft, Node, (row) => text(row, "id") === text(space, "child"));

      child["ancestry"] = "fb";
      space["childAncestry"] = "fb";
    },
    fixture: "cut-choice",
    law: ancestryStep,
    name: "an edge whose child ancestry is not the step of its parent is refused by the containment into AncestryStep",
    rule: "ancestry-step",
  },
  {
    alter: (draft) => {
      find(draft, InteractionBinding)["ancestry"] = "fb";
    },
    fixture: "cut-choice",
    law: checkLaw(InteractionBinding, "AdaptiveFeedback"),
    name: "a binding in feedback of a non-adaptive item is refused by the AdaptiveFeedback check",
    rule: "adaptive-feedback",
  },
  {
    alter: (draft) => {
      const inline = addNode(draft, "qti-feedback-inline", "root", {
        relation: FeedbackInline,
        row: { identifier: "fi", outcomeIdentifier: "SCORE", showHide: "show" },
      });
      const block = addNode(draft, "qti-feedback-block", "fb", {
        relation: FeedbackBlock,
        row: { identifier: "fb", outcomeIdentifier: "SCORE", showHide: "show" },
      });

      of(draft, Edge).push(
        edgeRow(
          draft,
          { ancestry: "root", id: inline, kind: "qti-feedback-inline" },
          { ancestry: "fb", id: block, kind: "qti-feedback-block" },
        ),
      );
    },
    fixture: "cut-choice",
    law: containedLaw(side(Edge, ["version", "parentKind", "childKind"]), {
      fields: ["version", "parent", "child"],
      relation: "Admission",
      selection: [],
    }),
    name: "a feedback block in a feedback inline is refused by the containment into Admission",
    rule: "admission",
  },
  {
    // The rows of `controls-3-0-0` as the importer reads them: a video of a 3.0.0 document with `controls="controls"`, which 3.0.0's XSD spells with a boolean (goal 3.9).
    alter: () => {},
    fixture: "controls-3-0-0",
    law: checkLaw(VideoControls, "VideoControlsByVersion"),
    name: "a controls of controls in a 3.0.0 document is refused by the VideoControlsByVersion check",
    rule: "attribute-lexical",
  },
];

/**
 * The bases whose unaltered rows the database accepts, so each refusal above is its alteration's:
 * every base but `controls-3-0-0`, whose rows are the refusal.
 */
const acceptedBases = negativeBases.filter((name) => name !== "controls-3-0-0");

/**
 * The XML copies the database refuses, by `importPackage`: the fixture, the rule `refusal.ts`
 * names for the law that refuses it, and the law's kind.
 */
const copyNegatives = [
  { diverges: false, fixture: "admission-choice-in-feedback", rule: "admission" },
  // Decision 12c: the importer refuses a gap that sits in no gap-match interaction itself, under `binding-declared`, before the database is reached, so the brief's `ancestry-ban` is pinned as an expected failure and the observed rule is logged. The ban is proved by the direct ChangeSet above.
  { diverges: true, fixture: "gap-outside-gap-match", rule: "ancestry-ban" },
  { diverges: false, fixture: "controls-3-0-0", rule: "attribute-lexical" },
] as const satisfies readonly {
  readonly diverges: boolean;
  readonly fixture: FixtureName;
  readonly rule: Rule;
}[];

/**
 * The refusal an import of `fixture` fails with, or a test failure when it is accepted or fails
 * otherwise. A law that fell to the nearest rule is logged as a finding.
 */
const refusalOf = (fixture: FixtureName) =>
  Effect.gen(function* refusalOfImport() {
    const result = yield* Effect.result(importPackage(yield* materialize(fixture)));
    if (result._tag === "Success") {
      return assert.fail(`${fixture} was accepted as package ${result.success}`);
    }

    const refusal = result.failure;
    if (!(refusal instanceof ImportRefused)) {
      return assert.fail(
        `${fixture} failed with something other than a refusal: ${refusal.message}`,
      );
    }

    // SAFETY: the importer keeps the engine's law verbatim, a value of the structural mirror.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    const law = refusal.law as ImportLaw | undefined;
    if (law !== undefined && !isMappedLaw(law)) {
      yield* Effect.logWarning(
        `FINDING ${fixture}: law not mapped, filed under ${refusal.rule}`,
        law,
      );
    }

    return refusal;
  });

describe.skipIf(!hasLease)(
  "import/content-b.test.ts, the negatives, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, BaseRowsLayer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })(
      "the schema's admission, attribute, id and ancestry laws refuse by direct ChangeSet",
      (it) => {
        for (const negative of negatives) {
          it.effect(negative.name, () =>
            Effect.gen(function* refused() {
              const rows = (yield* BaseRows).get(negative.fixture);
              assert.isDefined(rows, negative.fixture);

              const draft = draftOf(rows ?? Rows.empty());
              negative.alter(draft);

              const outcome = yield* apply(draft);

              assert.strictEqual(outcome.kind, "invariant-rejected");
              if (outcome.kind === "invariant-rejected") {
                const reported: unknown = outcome.law;

                assert.deepStrictEqual(reported, negative.law);
                assert.strictEqual(ruleOfLaw(outcome.law satisfies ImportLaw), negative.rule);
                if (!isMappedLaw(outcome.law satisfies ImportLaw)) {
                  yield* Effect.log(
                    `FINDING ${negative.name}: ruleOfLaw sorts this law to ${negative.rule} by its kind alone`,
                  );
                }
              }
            }),
          );
        }

        for (const name of acceptedBases) {
          it.effect(
            `the unaltered rows of ${name} are accepted, so each refusal above is its alteration's`,
            () =>
              Effect.gen(function* unaltered() {
                const rows = (yield* BaseRows).get(name);
                assert.isDefined(rows, name);

                const outcome = yield* apply(draftOf(rows ?? Rows.empty()));

                assert.strictEqual(outcome.kind, "accepted");
              }),
          );
        }

        it.effect(
          "a controls of true in a 3.0.0 document is accepted, so the check refuses the spelling",
          () =>
            Effect.gen(function* spelled() {
              const rows = (yield* BaseRows).get("controls-3-0-0");
              assert.isDefined(rows, "controls-3-0-0");

              const draft = draftOf(rows ?? Rows.empty());
              find(draft, VideoControls)["value"] = "true";

              const outcome = yield* apply(draft);

              assert.strictEqual(outcome.kind, "accepted");
            }),
        );
      },
    );

    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the XML copies are refused by the database through importPackage", (it) => {
      for (const { diverges, fixture, rule } of copyNegatives) {
        const copyRefused = () =>
          Effect.gen(function* copyRefusedByDatabase() {
            const refusal = yield* refusalOf(fixture);

            yield* Effect.log(
              `${fixture}: refused under ${refusal.rule} (${refusal.law === undefined ? "before the database" : "by the database"}); the brief names ${rule}`,
            );

            assert.strictEqual(refusal.rule, rule, refusal.message);
            assert.isDefined(
              refusal.law,
              `${fixture} was refused before the database: ${refusal.message}`,
            );
          });

        if (diverges) {
          it.effect.fails(`${fixture} is refused under the ${rule} rule`, copyRefused);
        } else {
          it.effect(`${fixture} is refused under the ${rule} rule`, copyRefused);
        }
      }
    });
  },
);

/**
 * The rows of `relation` an imported package holds, from every tree it has.
 */
const rowsOf = <R extends AnyRelation>(id: string, relation: R) =>
  Effect.gen(function* rowsOfPackage() {
    const trees = yield* treesOf(id);
    const read = yield* Effect.all(trees.map((tree) => readTree(id, tree)));

    return read.flatMap((rows) => Rows.of(rows, relation));
  });

/**
 * Assert that a round trip of `name` compares all equal.
 */
const assertAllEqual = (report: Effect.Success<ReturnType<typeof roundTrip>>["report"]) => {
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
  "import/content-b.test.ts, the XML-copy positives, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the whiteSpace witnesses and the admitted copies round-trip", (it) => {
      // Decision 12c, blocked: phase 1's `lexicalCopy` (`src/import/guards/item.ts:472-502`) refuses every `AttributeLexical` row whose kind and attribute its `shadows` table lacks, `typed-copy` "shadows no typed column", and the table holds no M1 attribute, so the `class`, `label` and `aria-valuetext` rows are refused before the database. The expectations below are the brief's; they flip the test red once the guard judges only the attributes it shadows.
      it.effect.fails(
        "padded-m1-attributes stores one value and at most one lexical row per class",
        () =>
          Effect.gen(function* padded() {
            const { id, report } = yield* roundTrip("padded-m1-attributes");

            assertAllEqual(report);

            const classes = (yield* rowsOf(id, NodeClass)).filter((row) => row.kind === "p");
            const labels = yield* rowsOf(id, NodeLabel);
            const valuetexts = yield* rowsOf(id, AriaValuetext);
            const lexical = yield* rowsOf(id, AttributeLexical);
            const lexicalOf = (attribute: string) =>
              lexical.filter((row) => row.attribute === attribute).map((row) => row.value);

            assert.deepStrictEqual(
              classes.map((row) => row.value),
              ["a b"],
            );
            assert.deepStrictEqual(lexicalOf("class"), [" a  b "]);
            assert.deepStrictEqual(
              labels.map((row) => row.value),
              ["x y"],
            );
            assert.deepStrictEqual(lexicalOf("label"), ["x\ty"]);
            assert.deepStrictEqual(
              valuetexts.map((row) => row.value),
              ["a\tb"],
            );
            assert.deepStrictEqual(lexicalOf("aria-valuetext"), []);
          }),
      );

      // Blocked like `padded-m1-attributes`: the `p`'s lexical `class` row is refused by `lexicalCopy`.
      it.effect.fails(
        "empty-class stores an empty list for the div and for the p, with one lexical row",
        () =>
          Effect.gen(function* empty() {
            const { id, report } = yield* roundTrip("empty-class");

            assertAllEqual(report);

            const classes = yield* rowsOf(id, NodeClass);
            const lexical = (yield* rowsOf(id, AttributeLexical)).filter(
              (row) => row.attribute === "class",
            );

            assert.deepStrictEqual(classes.map((row) => `${row.kind}=${row.value}`).toSorted(), [
              "div=",
              "p=",
            ]);
            assert.deepStrictEqual(
              lexical.map((row) => `${row.kind}=${row.value}`),
              ["p=  "],
            );
          }),
      );

      it.effect("hottext-in-prompt is admitted with a Hottext row and no HottextOwner row", () =>
        Effect.gen(function* hottext() {
          const { id, report } = yield* roundTrip("hottext-in-prompt");

          assertAllEqual(report);

          assert.strictEqual((yield* rowsOf(id, Hottext)).length, 1);
          assert.strictEqual((yield* rowsOf(id, HottextOwner)).length, 0);
        }),
      );
    });
  },
);
