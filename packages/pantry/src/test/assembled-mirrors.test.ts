/**
 * Every law of the schema the host can judge, held over the rows the import writes for the
 * every-relation package: each containment and each half of a `mirrors`, each key and each check,
 * read from the statements grizzle keeps (`#pantry/test/key-copies.ts` `judgedLaws`), over the rows
 * as the database holds them, every value grizzle fills that the statements give restored
 * (`#pantry/test/host-judge.ts`). The law oracle accepts the package, so no law may break.
 *
 * Its assembled documents are a test, a section, two items with includes, a fragment of content
 * and a fragment of response rules (spec readings 5 and 117). A fragment an item's include splices
 * heads no assembly of its own (`#pantry/qti/tests.ts` `splicingParents`), so its IDREFs resolve
 * among the item's IDs alone, and the heads are mirrored with the assemblies' roots both ways.
 *
 * A law the host cannot judge reads a value it does not restore, and {@link unjudged} names each
 * such value with why. That list is exact: a value the host comes to hold fails the test until its
 * entry is removed, and a law skipped for a value the list does not name fails it until the value
 * is named.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Predicate } from "effect";
import { lawIdentity } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import type { HostRow, HostRows } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/locate.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 14.2 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * A term of a selection or a check the host's evaluator does not read.
 *
 * @param term - The term's kind.
 * @returns Why a law that holds one is not judged.
 */
const unreadTerm = (term: string): string =>
  `its predicate holds a Compute.${term} term, which the host's evaluator does not read`;

/**
 * Why a tree root's copy along the tree's axis is absent: grizzle writes its start value there,
 * which it keeps in the field's builder and exports no reader of.
 */
const rootCopy =
  "a tree root's copy along its own axis is the field's start value, which grizzle keeps in the field's builder and exports no reader of";

/**
 * Every value the host does not restore that a law over the every-relation package's rows reads,
 * as `Relation.field` or `Relation: a <kind> term`, with why.
 */
const unjudged = {
  "AriaRange: a when term": unreadTerm("when"),
  "AssembledReference: a base term": unreadTerm("base"),
  "Expression.leadCardinalities":
    "a Monoid.or fold over Operand.cardinalityBit, a field PostgreSQL generates",
  "Expression.operandBaseTypes":
    "a Monoid.or fold over Operand.baseTypeBit, a field PostgreSQL generates",
  "Expression.operandCardinalities":
    "a Monoid.or fold over Operand.cardinalityBit, a field PostgreSQL generates",
  "Expression.tailBaseTypes":
    "a Monoid.or fold over Operand.baseTypeBit, a field PostgreSQL generates",
  "Expression.tailCardinalities":
    "a Monoid.or fold over Operand.cardinalityBit, a field PostgreSQL generates",
  "Expression: a between term": unreadTerm("between"),
  "Idref: a base term": unreadTerm("base"),
  "LeastCount: a base term": unreadTerm("base"),
  "LeastCount: a when term": unreadTerm("when"),
  "MapKeyFloat: a cast term": unreadTerm("cast"),
  "MostCount: a base term": unreadTerm("base"),
  "MostCount: a when term": unreadTerm("when"),
  "Node.elements":
    "a tree root's running value of the element fold, the start value grizzle keeps in the field's builder",
  "Node.lastState": "a copy along a last axis, `pred(children)`, which the host does not restore",
  "Node.parentAncestry": rootCopy,
  "Node.parentGoverns": rootCopy,
  "Node.parentKind": rootCopy,
  "Node.parentNearest": rootCopy,
  "Node.parentNearestKind": rootCopy,
  "Node.parentParentKind": rootCopy,
  "Node.was": "a copy along a predecessor axis, `pred(at)`, which the host does not restore",
  "Node: a between term": unreadTerm("between"),
  "OpenElementName: a literal term": "its predicate holds a literal of no datum's type",
  "OutcomeRange: a when term": unreadTerm("when"),
  "Quotation: a base term": unreadTerm("base"),
  "Reference: a base term": unreadTerm("base"),
  "Rounding: a when term": unreadTerm("when"),
  "SectionSelection.select": "a field PostgreSQL generates, a cast of `selectForm`",
  "SectionSelection: a base term": unreadTerm("base"),
  "Slider: a when term": unreadTerm("when"),
} satisfies Readonly<Record<string, string>>;

/**
 * The laws the test must judge: both halves of the heads' mirror with the roots, the count that
 * places every assembled document, and both halves of `ReferenceDocument`'s mirror.
 */
const required = [
  "contained Document(node) in Instance(document)",
  "contained Instance(document) in Document(node)",
  "check Inclusion_cycle",
  "contained ReferenceDocument(document) in TestDocument(node)",
  "contained TestDocument(node) in ReferenceDocument(document)",
] as const;

/**
 * The paths of the documents a package's rows name, by document node.
 *
 * @param rows - The rows.
 * @returns Each document's path.
 */
const pathsOf = (rows: HostRows): ReadonlyMap<string, string> =>
  new Map(
    (rows.get("Document") ?? []).flatMap((row) => {
      const { node, path } = row;

      return Predicate.isString(node) && Predicate.isString(path) ? [[node, path] as const] : [];
    }),
  );

/**
 * A row with each document node it holds written as its document's path, so a breach names the
 * documents it is in.
 *
 * @param paths - Each document's path, by its node.
 * @param row - The row.
 * @returns The row, its document nodes replaced.
 */
const namedIn = (paths: ReadonlyMap<string, string>, row: HostRow): HostRow =>
  Object.fromEntries(
    Object.entries(row).map(([field, value]) => [
      field,
      Predicate.isString(value) ? (paths.get(value) ?? value) : value,
    ]),
  );

/**
 * The rows with one more assembly's root: a writer that makes a document a head it is not.
 *
 * @param rows - The rows.
 * @param document - The planted head's document node.
 * @returns The rows, the root among them.
 */
const withRoot = (rows: HostRows, document: string): HostRows => {
  const root: HostRow = { assembly: document, document, id: document, parent: document, start: 0n };

  return new Map([...rows, ["Instance", [...(rows.get("Instance") ?? []), root]]]);
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "every law the host can judge over the every-relation package",
  (it) => {
    it.effect(
      "holds every law the host can judge over the every-relation package's rows, names each one it cannot by its absent value, and refuses a fragment made a head",
      () =>
        // Oracle: the schema's own statements over the rows the import writes, each law as the
        // database states it, and the law oracle's verdict on the package.
        // Bound: the every-relation package, every relation of it written, and every containment,
        // mirrors, key and check of Qti.
        Effect.scoped(
          Effect.gen(function* everyLawHolds() {
            const dir = yield* scopedPackage(
              everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
            );
            const verdict = yield* oracleVerdict(yield* readPackage(dir));
            const program = yield* readProgram(dir);
            const rows = hostRowsOf(program.inputs);
            const laws = judgedLaws(Qti.statements);
            const judgment = judge(rows, laws);
            const paths = pathsOf(rows);

            assert.deepStrictEqual(verdict, { kind: "accepted" });
            assert.deepStrictEqual(
              judgment.broken.map(
                ({ law, rows: breaking }) =>
                  `${lawIdentity(law)}: ${Formatter.format(breaking.map((row) => namedIn(paths, row)))}`,
              ),
              [],
              "a law the import's rows break",
            );

            const judged = new Set(judgment.judged.map(lawIdentity));
            assert.deepStrictEqual(
              required.filter((identity) => !judged.has(identity)),
              [],
              "a law the test must judge went unjudged",
            );

            const absent = new Map<string, string[]>();
            for (const { absent: values, law } of judgment.skipped) {
              for (const value of values) {
                absent.set(value, [...(absent.get(value) ?? []), lawIdentity(law)]);
              }
            }

            assert.deepStrictEqual(
              [...absent].flatMap(([value, skipped]) =>
                Object.hasOwn(unjudged, value) ? [] : [`${value}, read by ${skipped.join("; ")}`],
              ),
              [],
              "a value no entry of the unjudged list names: restore it in host-judge.ts, or name it with why",
            );
            assert.deepStrictEqual(
              Object.keys(unjudged).filter((value) => !absent.has(value)),
              [],
              "an entry of the unjudged list the host now judges: remove it",
            );

            // The planted heads: every assembled document a head, as the import made them before
            // reading 117's splice, gives the two fragments the items splice an assembly each, and
            // the roots' mirror with the heads refuses exactly those.
            const heads = (rows.get("TestDocument") ?? []).flatMap(({ node }) =>
              Predicate.isString(node) ? [node] : [],
            );
            const rooted = new Set(
              (rows.get("Instance") ?? []).flatMap(({ document, start }) =>
                start === 0n && Predicate.isString(document) ? [document] : [],
              ),
            );
            let planted: HostRows = rows;
            for (const node of heads.filter((held) => !rooted.has(held))) {
              planted = withRoot(planted, node);
            }

            const refused = judge(planted, laws).broken.find(
              ({ law }) => lawIdentity(law) === "contained Instance(document) in Document(node)",
            );
            assert.deepStrictEqual(
              (refused?.rows ?? [])
                .map(
                  ({ document }) => paths.get(Predicate.isString(document) ? document : "") ?? "",
                )
                .toSorted((left, right) => left.localeCompare(right)),
              ["items/fragment.xml", "items/rules.xml"],
              "the planted heads the roots' mirror refuses",
            );
          }),
        ),
      testTimeoutMs,
    );
  },
);
