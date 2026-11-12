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
 * refused.
 *
 * A law the host cannot judge reads a value it does not restore, and {@link unjudged} names each
 * such value with why. That list is exact: a value the host comes to hold fails the test until its
 * entry is removed, and a law skipped for a value the list does not name fails it until the value
 * is named.
 */
import type { Law, LawSide } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { readEntries } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard.
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
  "OpenAttribute: a literal term":
    "its predicate holds a literal of no datum's type, a Bits set over AttributeName",
  "OpenElementName: a literal term": "its predicate holds a literal of no datum's type",
  "Quotation: a base term": unreadTerm("base"),
  "Reference: a base term": unreadTerm("base"),
  "SectionSelection: a base term": unreadTerm("base"),
  "ShareFragment: a charLength function term":
    "its predicate calls Compute.charLength, a function the host's evaluator does not compute",
  "TextReference: a base term": unreadTerm("base"),
} satisfies Readonly<Record<string, string>>;

/**
 * Whether a law side reads exactly `relation`'s fields `fields`, in order.
 *
 * @param side - The side.
 * @param relation - The relation.
 * @param fields - The fields.
 * @returns Whether it does.
 */
const readsFields = (side: LawSide, relation: string, fields: readonly string[]): boolean =>
  side.relation === relation &&
  side.terms.length === fields.length &&
  side.terms.every((term, at) => term.kind === "field" && term.field === fields[at]);

/**
 * The test that a law is the containment of some fields of a relation in as many of another.
 *
 * @param from - The source relation and its fields.
 * @param to - The target relation and its fields.
 * @returns The test.
 */
const containedAs =
  (from: readonly [string, readonly string[]], to: readonly [string, readonly string[]]) =>
  (law: Law): boolean =>
    law.kind === "contained" && readsFields(law.from, ...from) && readsFields(law.to, ...to);

/**
 * A document's key, `(package, path)`, the fields `ReferenceDocument`'s mirror pairs.
 */
const documentKey = ["package", "path"] as const;

/**
 * The laws the test must judge, each with its label: both halves of `ReferenceDocument`'s mirror.
 */
const required: readonly (readonly [string, (law: Law) => boolean])[] = [
  [
    "ReferenceDocument(package, path) in Document(package, path)",
    containedAs(["ReferenceDocument", documentKey], ["Document", documentKey]),
  ],
  [
    "Document(package, path) in ReferenceDocument(package, path)",
    containedAs(["Document", documentKey], ["ReferenceDocument", documentKey]),
  ],
];

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
            const verdict = yield* oracleVerdict(yield* readEntries(dir));
            const program = yield* readProgram(dir);
            const rows = hostRowsOf(program.inputs);
            const laws = judgedLaws(Qti);
            const judgment = judge(rows, laws);

            assert.deepStrictEqual(verdict, { kind: "accepted" });
            assert.deepStrictEqual(
              judgment.broken.map(
                ({ law, rows: breaking }) =>
                  `${Formatter.format(law)}: ${Formatter.format(breaking)}`,
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
