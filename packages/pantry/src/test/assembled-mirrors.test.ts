/**
 * Every law of the schema the host can judge, held over the rows the import writes for the
 * every-relation package: each containment and each half of a `mirrors`, each key and each check,
 * read from the statements grizzle keeps (`#pantry/test/host-judge.ts` `judgedLaws`), over the
 * rows as the database holds them, every value grizzle fills that the statements give restored
 * (`#pantry/test/host-judge.ts`). The law oracle accepts the package, so no law may break.
 *
 * Its assembled documents are a test, a section, two items with includes, a fragment of content
 * and a fragment of response rules (spec readings 5 and 117). A fragment an item's include splices
 * heads no assembly of its own (`#pantry/qti/tests.ts` `splicingParents`), so its IDREFs resolve
 * among the item's IDs alone. The heads are mirrored with the assemblies' roots both ways, and
 * every document of a test or a section is one some instance places, by rules over the queries
 * `HeadDocument` and `InstanceDocument` (`#pantry/qti/queries.ts`), which the host does not judge:
 * PostgreSQL alone does, the importer's every-relation package accepted and the unplaced cycles
 * refused (`#pantry/import/inclusion-cycles.db.test.ts`).
 *
 * A law the host cannot judge reads a value it does not restore, and {@link unjudged} names each
 * such value with why. That list is exact: a value the host comes to hold fails the test until its
 * entry is removed, and a law skipped for a value the list does not name fails it until the value
 * is named.
 */
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Predicate } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import type { HostRow, HostRows } from "#pantry/test/host-judge.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

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
  "AssembledReference: a base term": unreadTerm("base"),
  "ElementType: a cond term": unreadTerm("cond"),
  "Expression: a between term": unreadTerm("between"),
  "LeastCount: a base term": unreadTerm("base"),
  "MathAction.selection":
    "a field PostgreSQL generates from the selection's lexical form (`relation.generated`, mathml-align.ts), which the host computes none of",
  "MathApply: a base term": unreadTerm("base"),
  "MathApply: a between term": unreadTerm("between"),
  "MostCount: a base term": unreadTerm("base"),
  "Node.elements":
    "a tree root's running value of the element fold, the start value grizzle keeps in the field's builder",
  "Node.parentAncestry": rootCopy,
  "Node.parentGovernor": rootCopy,
  "Node.parentKind": rootCopy,
  "Node.parentNearest": rootCopy,
  "Node.parentNearestKind": rootCopy,
  "Node.parentParentKind": rootCopy,
  "Node: a between term": unreadTerm("between"),
  "OpenAttributeName: a literal term":
    "its predicate holds a literal of no datum's type, a Bits set over AttributeName",
  "OpenElementName: a literal term": "its predicate holds a literal of no datum's type",
  "OpenElementType: a cond term": unreadTerm("cond"),
  "Quotation: a base term": unreadTerm("base"),
  "Reference: a base term": unreadTerm("base"),
  "SectionSelection: a base term": unreadTerm("base"),
  "ShareFragment: a charLength function term":
    "its predicate calls Compute.charLength, a function the host's evaluator does not compute",
  "TextReference: a base term": unreadTerm("base"),
} satisfies Readonly<Record<string, string>>;

/**
 * Whether a law side is `relation`'s one field `field`.
 *
 * @param side - The side.
 * @param relation - The relation.
 * @param field - The field.
 * @returns Whether it is.
 */
const readsOne = (side: LawSide, relation: string, field: string): boolean =>
  side.relation === relation &&
  side.terms.length === 1 &&
  side.terms.every((term) => term.kind === "field" && term.field === field);

/**
 * The test that a law is the containment of one field of a relation in one field of another.
 *
 * @param from - The source relation and its field.
 * @param to - The target relation and its field.
 * @returns The test.
 */
const containedAs =
  (from: readonly [string, string], to: readonly [string, string]) =>
  (law: Law): boolean =>
    law.kind === "contained" && readsOne(law.from, ...from) && readsOne(law.to, ...to);

/**
 * The laws the test must judge, each with its label: both halves of `ReferenceDocument`'s mirror.
 */
const required: readonly (readonly [string, (law: Law) => boolean])[] = [
  [
    "ReferenceDocument(document) in Document(node)",
    containedAs(["ReferenceDocument", "document"], ["Document", "node"]),
  ],
  [
    "Document(node) in ReferenceDocument(document)",
    containedAs(["Document", "node"], ["ReferenceDocument", "document"]),
  ],
];

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

layer(NodeServices.layer, { excludeTestServices: true })(
  "every law the host can judge over the every-relation package",
  (it) => {
    it.effect(
      "holds every law the host can judge over the every-relation package's rows, and names each one it cannot by its absent value",
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
            const laws = judgedLaws(Qti);
            const judgment = judge(rows, laws);
            const paths = pathsOf(rows);

            assert.deepStrictEqual(verdict, { kind: "accepted" });
            assert.deepStrictEqual(
              judgment.broken.map(
                ({ law, rows: breaking }) =>
                  `${Formatter.format(law)}: ${Formatter.format(breaking.map((row) => namedIn(paths, row)))}`,
              ),
              [],
              "a law the import's rows break",
            );

            assert.deepStrictEqual(
              required.flatMap(([label, is]) => (judgment.judged.some(is) ? [] : [label])),
              [],
              "a law the test must judge went unjudged",
            );

            const absent = new Map<string, string[]>();
            for (const { absent: values, law } of judgment.skipped) {
              for (const value of values) {
                absent.set(value, [...(absent.get(value) ?? []), Formatter.format(law)]);
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
          }),
        ),
      testTimeoutMs,
    );
  },
);
