/**
 * The bin 1 rules of MathML (spec 4.12, Acceptance criterion 3), by direct ChangeSet (spec MA14).
 * It runs on a lease only; without one every case is skipped.
 *
 * Each negative alters the rows `readRows` builds for `math-solution`, a p6-36 positive, in one
 * place, applies them as the author login and asserts `invariant-rejected` naming the law grizzle
 * reports and the rule `ruleOfLaw` gives it. Where two laws can fire on one alteration (the
 * firing-order class: which law names a write can depend on the rows present), the case lists both
 * and the one reported is logged. The controls beside them hold the same alteration with its fault
 * removed and commit, and the unaltered rows commit last, so each refusal is its alteration's.
 *
 * Two cases are not refusals by a law: a false `MathmlCbytes` value commits (the importer's
 * `text-copy` guard is a bin 2 rule, so the database admits a false copy), and a write to the
 * seeded `MathmlAttributeType` is refused before any SQL, because no role writes it.
 */
import { inspect, isDeepStrictEqual } from "node:util";
import { Db } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Context, Effect, Layer, Predicate } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { changeSetOf, readRows, retrySchedule } from "#pantry/import/package.ts";
import { isMappedLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, Rule } from "#pantry/import/refusal.ts";
import type { Rows } from "#pantry/import/tree.ts";
import { AttributeIdref, NodeClass, NodeDir } from "#pantry/schema/attributes.ts";
import { DocumentId, HtmlId } from "#pantry/schema/document.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import {
  MathmlBvar,
  MathmlMmultiscripts,
  MathmlPiecewise,
  arms,
} from "#pantry/schema/mathml/arms.ts";
import {
  MathmlAttributeType,
  MathmlBase,
  MathmlClass,
  MathmlClosure,
  MathmlColor,
  MathmlDisplay,
  MathmlLength,
  MathmlMpaddedLength,
  MathmlSpan,
  contentArms,
} from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node, TextNode } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";
import { FLAGS, handleOf, KindEnters, stepOf } from "#pantry/schema/seed/ancestry.ts";
import type { Flag } from "#pantry/schema/seed/ancestry.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * A row as a test edits it: every field of the schema is text or a bigint.
 */
type Row = Record<string, string | bigint>;

/**
 * The importer's rows for the base fixture, a mutable copy per relation, which an alteration edits
 * in place before the rows are applied.
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
 * The laws this file names, in the shape of the `law` of an `invariant-rejected` outcome.
 */
type Law =
  | { readonly fields: readonly string[]; readonly kind: "key"; readonly relation: string }
  | { readonly fields: readonly string[]; readonly kind: "primaryKey"; readonly relation: string }
  | { readonly kind: "check"; readonly name: string; readonly relation: string }
  | { readonly contract: string; readonly kind: "contract" }
  | { readonly flags: "su" | "u"; readonly kind: "pattern"; readonly source: string }
  | { readonly from: Side; readonly kind: "contained"; readonly to: Side }
  | {
      readonly from: Side;
      readonly kind: "capacity";
      readonly target: Side;
      readonly weight: { readonly kind: "count" };
      readonly within: { readonly high: bigint | "*"; readonly low: bigint };
    };

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

const contractLaw = (contract: string): Law => ({ contract, kind: "contract" });

const capacityLaw = (target: Side, from: Side, low: bigint, high: bigint | "*"): Law => ({
  from,
  kind: "capacity",
  target,
  weight: { kind: "count" },
  within: { high, low },
});

/**
 * The base fixture: a p6-36 positive with a `div`, a `p`, `m:math`, `m:mi`, `m:mo` and `m:mtd`.
 */
const base = "math-solution";

/**
 * The rows of the base fixture, read once for the suite.
 */
class BaseRows extends Context.Service<BaseRows, Rows>()("rules.mathml.test/BaseRows") {}

const BaseRowsLayer = Layer.effect(
  BaseRows,
  Effect.gen(function* readBaseRows() {
    const { rows } = yield* readRows(yield* materialize(base));

    return rows;
  }),
).pipe(Layer.provide(NodeServices.layer));

const uuidText = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

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

/**
 * An editable copy of `rows` under fresh ids, so that a draft that commits leaves no row the next
 * draft's keys collide with.
 */
const draftOf = (rows: Rows): Draft => {
  const fresh = new Map<string, string>();
  for (const facts of rows.values()) {
    for (const fact of facts) {
      for (const value of Object.values(fact)) {
        if (Predicate.isString(value) && uuidText.test(value) && !fresh.has(value)) {
          fresh.set(value, crypto.randomUUID());
        }
      }
    }
  }

  return new Map(
    [...rows].map(([relation, facts]) => [
      relation,
      facts.map((fact) =>
        rowOf(
          Object.entries(fact).map(([field, value]) => [
            field,
            Predicate.isString(value) ? (fresh.get(value) ?? value) : value,
          ]),
        ),
      ),
    ]),
  );
};

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
 * A node of the draft as an edge names it.
 */
interface Placed {
  readonly ancestry: string;
  readonly id: string;
  readonly kind: string;
}

/**
 * The first node of `kind`, placed.
 */
const placed = (draft: Draft, kind: string): Placed => {
  const row = find(draft, Node, (node) => text(node, "kind") === kind);

  return { ancestry: text(row, "ancestry"), id: text(row, "id"), kind };
};

/**
 * The arm relation of `kind`: a MathML kind's own arm, or the text node's.
 */
const armOf = (kind: string): AnyRelation => {
  if (kind === "text") {
    return TextNode;
  }

  const found: AnyRelation | undefined = Object.entries({ ...arms, ...contentArms }).find(
    ([handle]) => handle === kind,
  )?.[1];
  assert.isDefined(found, `no arm for ${kind}`);

  return found ?? TextNode;
};

/**
 * The ancestry a child of `parent` takes: the walk's step (`stepOf`, which the importer calls too)
 * from the parent's own ancestry across the parent's kind. Inside a formula that is `math`, since
 * `m:math` enters and absorbs `math`.
 */
const childAncestryOf = (parent: Placed): string => {
  const held = FLAGS.filter((flag: Flag) => parent.ancestry.split(".").includes(flag));

  return handleOf(stepOf(held, parent.kind, KindEnters));
};

/**
 * Add a node of `kind` as the last child of `parent`, with the edge into it and its arm row `row`.
 * The child takes the ancestry the walk gives it (`childAncestryOf`). Positions start at 1000,
 * clear of the fixture's own.
 *
 * @returns The new node, placed.
 */
const attach = (draft: Draft, parent: Placed, kind: string, row: Row = {}): Placed => {
  const like = find(draft, Node, (node) => text(node, "id") === parent.id);
  const id = crypto.randomUUID();
  const child = { ancestry: childAncestryOf(parent), id, kind };

  of(draft, Node).push({ ...like, ancestry: child.ancestry, id, kind });
  of(draft, armOf(kind)).push({ ...row, id });
  of(draft, Edge).push({
    child: id,
    childAncestry: child.ancestry,
    childKind: kind,
    parent: parent.id,
    parentAncestry: parent.ancestry,
    parentKind: parent.kind,
    position: BigInt(1000 + of(draft, Edge).length),
    tree: text(like, "tree"),
    version: text(like, "version"),
  });

  return child;
};

/**
 * The document tree of the draft: the tree of its first `m:math`.
 */
const documentOf = (draft: Draft): string =>
  text(
    find(draft, Node, (node) => text(node, "kind") === "m:math"),
    "tree",
  );

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
 * One alteration of the base rows, the laws that may refuse it, and the rule the roster names for
 * each. `laws` lists every law that can fire on the alteration (decision 133, findings row 30); the
 * one grizzle reports is asserted to be one of them and to give the rule listed with it.
 */
interface Negative {
  readonly alter: (draft: Draft) => void;
  readonly laws: readonly (readonly [Law, Rule])[];
  readonly name: string;
}

/**
 * One alteration with its fault removed, which commits.
 */
interface Control {
  readonly alter: (draft: Draft) => void;
  readonly name: string;
}

const edgeAdmission = containedLaw(side(Edge, ["version", "parentKind", "childKind"]), {
  fields: ["version", "parent", "child"],
  relation: "Admission",
  selection: [],
});

/**
 * The containment of an edge's `(parentAncestry, parentKind, childAncestry)` into `AncestryStep`.
 * An edge into a kind the parent does not admit can break it beside `Admission` (decision 133: both
 * laws can name the one refusal, and which one grizzle reports can depend on the rows present).
 */
const edgeAncestryStep = containedLaw(
  side(Edge, ["parentAncestry", "parentKind", "childAncestry"]),
  {
    fields: ["ancestry", "kind", "next"],
    relation: "AncestryStep",
    selection: [],
  },
);

/**
 * The containment of a family's `(kind, attribute)` into the matrix rows of its own type.
 */
const familyMatrix = (family: AnyRelation, type: string): Law =>
  containedLaw(side(family, ["kind", "attribute"]), {
    fields: ["kind", "attribute"],
    relation: MathmlAttributeType.name,
    selection: [{ field: "type", value: type }],
  });

/**
 * The containment of an idref's `(document, target)` into the document's ids.
 */
const idrefTarget = containedLaw(side(AttributeIdref, ["document", "target"]), {
  fields: ["document", "id"],
  relation: DocumentId.name,
  selection: [],
});

/**
 * A node of `kind` as the last child of the first `m:math`.
 */
const underMath = (draft: Draft, kind: string): Placed =>
  attach(draft, placed(draft, "m:math"), kind);

/**
 * An `m:mmultiscripts` with `prescripts` `m:mprescripts` children.
 */
const multiscripts = (draft: Draft, prescripts: number): void => {
  const holder = underMath(draft, "m:mmultiscripts");

  for (let at = 0; at < prescripts; at += 1) {
    attach(draft, holder, "m:mprescripts");
  }
};

/**
 * An `m:bvar` in an `m:apply` with `degrees` `m:degree` children.
 */
const bvar = (draft: Draft, degrees: number): void => {
  const holder = attach(draft, underMath(draft, "m:apply"), "m:bvar");

  for (let at = 0; at < degrees; at += 1) {
    attach(draft, holder, "m:degree");
  }
};

/**
 * An `m:piecewise` with `otherwise` `m:otherwise` children.
 */
const piecewise = (draft: Draft, otherwise: number): void => {
  const holder = underMath(draft, "m:piecewise");

  for (let at = 0; at < otherwise; at += 1) {
    attach(draft, holder, "m:otherwise");
  }
};

/**
 * Two `HtmlId` rows, with their `DocumentId` rows, of one value: a `div`'s and the first
 * `m:math`'s.
 */
const sharedId = (draft: Draft): void => {
  const document = documentOf(draft);
  const division = placed(draft, "div");
  const math = placed(draft, "m:math");

  for (const holder of [division, math]) {
    of(draft, HtmlId).push({
      attribute: "id",
      document,
      id: "shared",
      kind: holder.kind,
      node: holder.id,
    });
    of(draft, DocumentId).push({ document, holder: "htmlId", id: "shared" });
  }
};

/**
 * A law as text for the log.
 */
const lawText = (law: ImportLaw): string => inspect(law, { breakLength: Infinity, depth: null });

/**
 * One alteration that a closed roster refuses: the codec of a `closedId` column admits only the
 * roster's handles, so the value never reaches the database and no law reports it.
 */
interface Roster {
  readonly alter: (draft: Draft) => void;
  readonly name: string;
  readonly slot: string;
}

const rosters: readonly Roster[] = [
  {
    alter: (draft) => {
      of(draft, MathmlDisplay).push({
        attribute: "display",
        kind: "m:math",
        node: placed(draft, "m:math").id,
        value: "center",
      });
    },
    name: "an off-roster display is refused by its closed roster before any SQL",
    slot: "member:0:insert:array:MathmlDisplay.value",
  },
  {
    alter: (draft) => {
      of(draft, MathmlClosure).push({
        attribute: "closure",
        kind: "m:interval",
        node: underMath(draft, "m:interval").id,
        value: "half",
      });
    },
    name: "an off-roster closure is refused by its closed roster before any SQL",
    slot: "member:0:insert:array:MathmlClosure.value",
  },
];

const negatives: readonly Negative[] = [
  {
    alter: (draft) => {
      attach(draft, placed(draft, "p"), "m:mi");
    },
    laws: [[edgeAdmission, "admission"]],
    name: "an m:mi under a p is refused by Admission (only m:math hooks MathML into QTI content)",
  },
  {
    alter: (draft) => {
      const fraction = underMath(draft, "m:mfrac");

      attach(draft, fraction, "text", { value: "x" });
    },
    laws: [
      [edgeAdmission, "admission"],
      [edgeAncestryStep, "ancestry-step"],
    ],
    name: "a text node under an m:mfrac is refused by Admission (text only in mixed kinds)",
  },
  {
    alter: (draft) => {
      const padded = underMath(draft, "m:mpadded");

      of(draft, MathmlLength).push({
        attribute: "width",
        kind: "m:mpadded",
        node: padded.id,
        value: "1em",
      });
    },
    laws: [[familyMatrix(MathmlLength, "length"), "attribute-admission"]],
    name: "a MathmlLength row for (m:mpadded, width) is refused by the containment into the matrix",
  },
  {
    alter: (draft) => {
      of(draft, MathmlColor).push({
        attribute: "mathcolor",
        kind: "p",
        node: placed(draft, "p").id,
        value: "red",
      });
    },
    laws: [[familyMatrix(MathmlColor, "color"), "attribute-admission"]],
    name: "a MathML family row for a p node is refused by the containment into the matrix",
  },
  {
    alter: (draft) => {
      of(draft, NodeClass).push({
        attribute: "class",
        kind: "m:mo",
        node: placed(draft, "m:mo").id,
        value: "a",
      });
    },
    laws: [[checkLaw(NodeClass, "NodeClassNotMathml"), "attribute-admission"]],
    name: "a NodeClass row for an m:mo node is refused by NodeClassNotMathml",
  },
  {
    alter: (draft) => {
      of(draft, NodeDir).push({
        attribute: "dir",
        kind: "m:mi",
        node: placed(draft, "m:mi").id,
        value: "ltr",
      });
    },
    laws: [[checkLaw(NodeDir, "NodeDirNotMathml"), "attribute-admission"]],
    name: "a NodeDir row for an m:mi node is refused by NodeDirNotMathml",
  },
  {
    alter: (draft) => {
      multiscripts(draft, 2);
    },
    laws: [
      [
        capacityLaw(
          side(MathmlMmultiscripts, ["id"]),
          side(Edge, ["parent"], [{ field: "childKind", value: "m:mprescripts" }]),
          0n,
          1n,
        ),
        "union-count",
      ],
    ],
    name: "two m:mprescripts edges under one m:mmultiscripts are refused by the capacity",
  },
  {
    alter: (draft) => {
      bvar(draft, 2);
    },
    laws: [
      [
        capacityLaw(
          side(MathmlBvar, ["id"]),
          side(Edge, ["parent"], [{ field: "childKind", value: "m:degree" }]),
          0n,
          1n,
        ),
        "union-count",
      ],
    ],
    name: "two m:degree edges under one m:bvar are refused by the capacity",
  },
  {
    alter: (draft) => {
      piecewise(draft, 2);
    },
    laws: [
      [
        capacityLaw(
          side(MathmlPiecewise, ["id"]),
          side(Edge, ["parent"], [{ field: "childKind", value: "m:otherwise" }]),
          0n,
          1n,
        ),
        "union-count",
      ],
    ],
    name: "two m:otherwise edges under one m:piecewise are refused by the capacity",
  },
  {
    alter: sharedId,
    laws: [
      [{ fields: ["document", "id"], kind: "primaryKey", relation: "DocumentId" }, "document-key"],
      [{ fields: ["document", "id"], kind: "primaryKey", relation: "HtmlId" }, "document-key"],
    ],
    name: "an m:math HtmlId equal to a div's is refused by the document's id key",
  },
  {
    alter: (draft) => {
      of(draft, AttributeIdref).push({
        attribute: "xref",
        document: documentOf(draft),
        node: placed(draft, "m:mi").id,
        position: 0n,
        target: "nowhere",
      });
    },
    laws: [[idrefTarget, "idref-target"]],
    name: "an xref naming no id is refused by the containment into DocumentId",
  },
  {
    alter: (draft) => {
      of(draft, MathmlColor).push({
        attribute: "mathcolor",
        kind: "m:mi",
        node: placed(draft, "m:mi").id,
        value: "#12",
      });
    },
    laws: [[patternLaw(patterns.mathmlColor), "attribute-lexical"]],
    name: "a bad mathcolor is refused by the color pattern",
  },
  {
    alter: (draft) => {
      const number = underMath(draft, "m:cn");

      of(draft, MathmlBase).push({
        attribute: "base",
        kind: "m:cn",
        node: number.id,
        value: "abc",
      });
    },
    laws: [[contractLaw("MathmlBaseValue"), "attribute-lexical"]],
    name: "a cn base of abc is refused by the MathmlBaseValue contract",
  },
  {
    alter: (draft) => {
      of(draft, MathmlSpan).push({
        attribute: "rowspan",
        kind: "m:mtd",
        node: placed(draft, "m:mtd").id,
        value: "+2",
      });
    },
    laws: [[contractLaw("MathmlSpanValue"), "attribute-lexical"]],
    name: "a MathmlSpan value of +2 is refused by the MathmlSpanValue contract (A1)",
  },
];

/**
 * The same alterations without their faults, each of which commits.
 */
const controls: readonly Control[] = [
  {
    alter: (draft) => {
      multiscripts(draft, 1);
    },
    name: "one m:mprescripts under an m:mmultiscripts commits",
  },
  {
    alter: (draft) => {
      bvar(draft, 1);
    },
    name: "one m:degree under an m:bvar commits",
  },
  {
    alter: (draft) => {
      piecewise(draft, 1);
    },
    name: "one m:otherwise under an m:piecewise commits",
  },
  {
    alter: (draft) => {
      const padded = underMath(draft, "m:mpadded");

      of(draft, MathmlMpaddedLength).push({
        attribute: "width",
        kind: "m:mpadded",
        node: padded.id,
        value: "1em",
      });
    },
    name: "a MathmlMpaddedLength row for (m:mpadded, width) commits",
  },
  {
    alter: (draft) => {
      of(draft, MathmlClass).push({
        attribute: "class",
        kind: "m:mo",
        node: placed(draft, "m:mo").id,
        value: "a",
      });
    },
    name: "a MathmlClass row for an m:mo node commits",
  },
  {
    alter: (draft) => {
      of(draft, MathmlDisplay).push({
        attribute: "display",
        kind: "m:math",
        node: placed(draft, "m:math").id,
        value: "block",
      });
    },
    name: "a display of block commits",
  },
  {
    alter: (draft) => {
      of(draft, MathmlColor).push({
        attribute: "mathcolor",
        kind: "m:mi",
        node: placed(draft, "m:mi").id,
        value: "red",
      });
    },
    name: "a mathcolor of red commits",
  },
  {
    alter: (draft) => {
      of(draft, MathmlBase).push({
        attribute: "base",
        kind: "m:cn",
        node: underMath(draft, "m:cn").id,
        value: "10",
      });
    },
    name: "a cn base of 10 commits",
  },
  {
    alter: (draft) => {
      of(draft, MathmlSpan).push({
        attribute: "rowspan",
        kind: "m:mtd",
        node: placed(draft, "m:mtd").id,
        value: "2",
      });
    },
    name: "a MathmlSpan value of 2 commits",
  },
  {
    alter: (draft) => {
      const bytes = attach(draft, placed(draft, "m:math"), "m:cbytes", { value: "QUJD" });

      attach(draft, bytes, "text", { value: "AAAA" });
    },
    name: "a false MathmlCbytes value commits: text-copy is the importer's guard, not a law",
  },
];

describe.skipIf(!hasLease)(
  "schema/rules.mathml.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, BaseRowsLayer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("the bin 1 rules of MathML, by direct ChangeSet", (it) => {
      for (const negative of negatives) {
        it.effect(negative.name, () =>
          Effect.gen(function* refused() {
            const draft = draftOf(yield* BaseRows);
            negative.alter(draft);

            const outcome = yield* apply(draft);

            assert.strictEqual(outcome.kind, "invariant-rejected");
            if (outcome.kind === "invariant-rejected") {
              const reported: unknown = outcome.law;
              const law: ImportLaw = outcome.law;
              const named = negative.laws.find(([candidate]) =>
                isDeepStrictEqual(reported, candidate),
              );

              yield* Effect.log(`${negative.name}: ${lawText(law)} -> ${ruleOfLaw(law)}`);

              const [expected, rule] = named ?? negative.laws[0] ?? assert.fail(negative.name);
              assert.deepStrictEqual(reported, expected);
              assert.strictEqual(ruleOfLaw(law), rule);
              assert.isTrue(
                isMappedLaw(law),
                `${negative.name}: ruleOfLaw sorts this law by its kind alone`,
              );
            }
          }),
        );
      }

      for (const control of controls) {
        it.effect(control.name, () =>
          Effect.gen(function* committed() {
            const draft = draftOf(yield* BaseRows);
            control.alter(draft);

            assert.strictEqual((yield* apply(draft)).kind, "accepted");
          }),
        );
      }

      for (const roster of rosters) {
        it.effect(roster.name, () =>
          Effect.gen(function* rosterRefused() {
            const draft = draftOf(yield* BaseRows);
            roster.alter(draft);

            const failure = yield* Effect.flip(apply(draft));

            yield* Effect.log(`${roster.name}: ${failure._tag}`);

            assert.strictEqual(failure._tag, "EncodingFailure");
            if (failure._tag === "EncodingFailure") {
              assert.strictEqual(failure.reason._tag, "enumHandle");
              assert.strictEqual(failure.place._tag, "Slot");
              if (failure.place._tag === "Slot") {
                assert.strictEqual(failure.place.name, roster.slot);
              }
            }
          }),
        );
      }

      it.effect(
        "a MathmlAttributeType write by the author login is refused: no role writes it",
        () =>
          Effect.gen(function* readOnly() {
            const draft = draftOf(yield* BaseRows);
            of(draft, MathmlAttributeType).push({
              attribute: "width",
              kind: "m:mpadded",
              type: "length",
            });

            const failure = yield* Effect.flip(apply(draft));

            assert.strictEqual(failure._tag, "ExecutionFailure");
            if (failure._tag === "ExecutionFailure" && failure.reason._tag === "CompileError") {
              const { reason } = failure.reason;

              assert.strictEqual(reason._tag, "OutsideRole");
              if (reason._tag === "OutsideRole") {
                assert.strictEqual(reason.role, "author");
                assert.deepStrictEqual(reason.access, {
                  kind: "write",
                  relation: MathmlAttributeType.name,
                });
              }
            } else {
              assert.fail(
                `the write was refused by ${inspect(failure, { depth: 4 })}, not as outside the role`,
              );
            }
          }),
      );

      it.effect("the unaltered rows are accepted, so each refusal above is its alteration's", () =>
        Effect.gen(function* accepted() {
          assert.strictEqual((yield* apply(draftOf(yield* BaseRows))).kind, "accepted");
        }),
      );
    });
  },
);
