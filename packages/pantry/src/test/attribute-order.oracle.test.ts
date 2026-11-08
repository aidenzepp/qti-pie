/**
 * Spec reading 137 over the law oracle: no law reads the order of an element's attributes or of
 * its namespace declarations, so a package's verdict, the rule a refusal is named by and the laws
 * it breaks are the same in whatever order each element writes them.
 *
 * - **Generated packages** (`#pantry/test/gen/attribute-order.ts`), each drawn under its own swarm:
 *   the every-relation package or a generated tree, with named edits that break laws of several
 *   rules, the codec's among them, and may break one element twice. Every element of every XML
 *   entry, the manifest's included, is written in an order the swarm weighs (shuffled, reversed,
 *   rotated, or its declarations after its attributes), and the oracle's judgment of the package so
 *   written is held to its judgment of the package in the order it was read.
 * - **The small box, exhausted:** one element carrying every ordered selection of at most four of
 *   seven attribute specifications, which hold two codec refusals of two rules, two law breaches of
 *   two rules, a namespace declaration and an attribute it binds, against the same set in its
 *   canonical order.
 *
 * A judgment is compared as the oracle states it: a codec refusal by its rule and document, and a
 * judged package by its documents and the set of its breaches, each with every key but the slot of
 * the attribute it breaks at. Its verdict, `verdictOf`'s, is compared besides: accepted, or refused
 * under the rule of its codec refusal or of its first breach.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { shuffled } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option, Result } from "effect";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { namesOf } from "#pantry/model/composed.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import {
  declaresLate,
  elementsOf,
  filesOf,
  movedIn,
  orderCase,
  readCase,
  reordered,
} from "#pantry/test/gen/attribute-order.ts";
import type { CaseEntry, OrderFeature } from "#pantry/test/gen/attribute-order.ts";
import { caseHang, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { judge, lawsOf, ruleOf, verdictOf } from "#pantry/test/oracle.ts";
import type { Breach, Judgment } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case is generated over and judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The names a generated tree is written under.
 */
const names = namesOf(grammar);

/**
 * Compare two texts by their UTF-16 code units, the order a set of breaches is listed in.
 *
 * @param left - One text.
 * @param right - The other.
 * @returns A negative number, zero or a positive number as `left` sorts before, with or after
 *   `right`.
 */
const byCodeUnit = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

/**
 * Write a breach as the fact it states, without the slot of the attribute it breaks at, which is
 * where the attribute is written and so the one key an order moves: its document, its law, and its
 * other keys by name.
 *
 * @param breach - The breach.
 * @returns Its fact, as text.
 */
const factOf = ({ document, keys, law }: Breach): string =>
  JSON.stringify([
    document,
    law,
    Object.entries(keys)
      .filter(([field]) => field !== "at")
      .toSorted(([left], [right]) => byCodeUnit(left, right)),
  ]);

/**
 * What a judgment says, with no order in it: a codec refusal's rule and document, or a judged
 * package's documents and the set of its breaches' facts ({@link factOf}), listed sorted.
 *
 * @param judgment - The judgment.
 * @returns Its statement.
 */
const statementOf = (judgment: Judgment) =>
  judgment._tag === "CodecRefusal"
    ? { document: judgment.document, rule: judgment.rule }
    : {
        breaches: [...new Set(judgment.breaches.map(factOf))].toSorted(byCodeUnit),
        documents: judgment.documents,
      };

/**
 * The situations a generated case must reach: its base, its verdict, a codec refusal, an element
 * written in an order other than its own, and a namespace declaration written after an attribute.
 */
type Situation =
  | Extract<OrderFeature, "everyRelation" | "generated">
  | "accepted"
  | "refused"
  | "codec refusal"
  | "moved"
  | "declaration after an attribute";

/**
 * Name the situations of a case's orders: an element whose attributes the order moved, and one
 * that writes a declaration after an attribute.
 *
 * @param entries - The case's entries, in the order they were read.
 * @param moved - The tree each XML entry was written from, by path.
 * @returns The situations.
 */
const orderSituations = (
  entries: readonly CaseEntry[],
  moved: ReadonlyMap<string, XmlDocument>,
): readonly Situation[] => {
  const pairs = entries.flatMap(({ path, tree }) => {
    const written = moved.get(path);

    return Option.isSome(tree) && written !== undefined ? [[tree.value, written] as const] : [];
  });

  return [
    ...(pairs.some(([read, written]) => movedIn(read, written)) ? ["moved" as const] : []),
    ...(pairs.some(([, written]) => elementsOf(written.root).some(declaresLate))
      ? ["declaration after an attribute" as const]
      : []),
  ];
};

/**
 * The cases every generated property is checked over.
 */
const cases = orderCase(grammar);

describe(
  "spec reading 137, attribute order, over the law oracle",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "gives every generated package the verdict, the rule and the breaches it gives it read in order, whatever order each element's attributes and declarations are written in",
      (ctx) =>
        // Oracle: a metamorphic relation, a universal one. XML 1.0 §3.1, "the order of attribute
        // specifications in a start-tag or empty-element tag is not significant", and the Infoset's
        // two unordered sets (§2.2): the judgment of a package is a function of each element's
        // attributes and declarations as sets.
        // Bound: the generators' drawn bounds, every element of every XML entry reordered a case.
        searched(
          ctx,
          explore(
            {
              caseHang,
              concurrency: 1,
              coverage: required<Situation>(
                [
                  "everyRelation",
                  "generated",
                  "accepted",
                  "refused",
                  "codec refusal",
                  "moved",
                  "declaration after an attribute",
                ],
                { cases: 120, sense: notesOnly },
              ),
              draw: drawn(cases),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "universal",
                name: "judge ∘ reorder = judge, XML 1.0 §3.1 and the Infoset's unordered sets",
              },
              runs: 48,
              shrink: completeShrink,
              steerEvery: 8,
              suite: "pantry/test/attribute-order-oracle",
            },
            (orderedCase, c) =>
              Effect.gen(function* invariant() {
                const entries = yield* readCase(orderedCase, names);
                const moved = new Map<string, XmlDocument>();
                const read = yield* Effect.orDie(filesOf(entries, (tree) => tree));
                const written = yield* Effect.orDie(
                  filesOf(entries, (tree, path) => {
                    const order = c.draw(reordered(orderedCase.swarm, tree));
                    moved.set(path, order);

                    return order;
                  }),
                );
                const before = yield* judge(read, grammar, laws);
                const after = yield* judge(written, grammar, laws);
                const verdict = verdictOf(before);

                c.note(orderedCase.base._tag);
                c.note(verdict.verdict);
                if (before._tag === "CodecRefusal") {
                  c.note("codec refusal");
                }

                c.noteAll(orderSituations(entries, moved));

                assert.deepStrictEqual(statementOf(after), statementOf(before));
                assert.deepStrictEqual(verdictOf(after), verdict);
              }),
          ),
        ),
    );

    /**
     * The attribute specifications the small box's element carries a selection of: a valid `id`; a
     * `dir` outside its enumeration (`attribute-lexical`); an `aria-labelledby` naming no ID
     * (`idref-target`); a name no element admits (the codec's `attribute-admission`); a `data-*`
     * name QTI does not allow (the codec's `unmodeled-vocabulary`); a namespace declaration; and an
     * attribute in its namespace, which crust refuses unbound where the selection leaves the
     * declaration out.
     */
    const specifications = [
      'id="a"',
      'dir="sideways"',
      'aria-labelledby="nowhere"',
      'unadmitted="1"',
      'data-Name="1"',
      'xmlns:p="urn:example:attribute-order"',
      'p:note="1"',
    ] as const;

    /**
     * The situations the small box must reach: each verdict and each kind of refusal, two codec
     * refusals of two rules on its one element, two breaches of two rules there, and a declaration
     * written after the attribute it binds.
     */
    type BoxSituation =
      | "accepted"
      | "a law's refusal"
      | "a codec refusal"
      | "a reader refusal"
      | "two codec refusals"
      | "two rules on one element"
      | "declaration after its use";

    /**
     * Write the package of one item whose body's `div` carries specifications in an order.
     *
     * @param carried - The specifications, as positions in {@link specifications}, in their order.
     * @returns The package's files.
     */
    const boxPackage = (carried: readonly number[]): readonly PackageFile[] => {
      const manifest = [
        '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">',
        "  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>",
        "  <organizations/>",
        '  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources>',
        "</manifest>",
      ].join("\n");
      const attributes = carried.map((at) => ` ${specifications[at] ?? ""}`).join("");
      const item = [
        '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false" adaptive="false">',
        '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
        `  <qti-item-body><div${attributes}>a</div></qti-item-body>`,
        "</qti-assessment-item>",
      ].join("\n");

      return [
        { path: "imsmanifest.xml", text: manifest },
        { path: "item.xml", text: item },
      ].map(({ path, text }): PackageFile => ({
        bytes: new TextEncoder().encode(text),
        kind: path === "imsmanifest.xml" ? "manifest" : "file",
        path,
      }));
    };

    /**
     * The canonical order's judgment of each set the box draws, by its positions in order, judged
     * once.
     */
    const canonical = new Map<string, Judgment>();

    it.effect(
      "gives one element's every order of at most four of seven attribute specifications the judgment of their canonical order",
      (ctx) =>
        // Oracle: the same metamorphic relation, over the whole small space: every order of every set
        // of at most four specifications against the set in its canonical order.
        // Bound: every ordered selection of at most four of the seven, 1,100 cases.
        searched(
          ctx,
          exhaust(
            {
              box: "every ordered selection of at most 4 of the 7 specifications on one div",
              caseHang,
              coverage: requiredInSpace<BoxSituation>([
                "accepted",
                "a law's refusal",
                "a codec refusal",
                "a reader refusal",
                "two codec refusals",
                "two rules on one element",
                "declaration after its use",
              ]),
              generator: shuffled(
                specifications.map((_, at) => at),
                { max: 4, min: 0 },
              ),
              limit: 1100,
              literal: Formatter.format,
              oracle: {
                kind: "universal",
                name: "judge ∘ reorder = judge, over every order of every small set",
              },
              suite: "pantry/test/attribute-order-oracle-box",
            },
            (carried, c) =>
              Effect.gen(function* box() {
                const set = carried.toSorted((left, right) => left - right);
                const key = set.join(" ");
                const held = canonical.get(key);
                const before = held ?? (yield* judge(boxPackage(set), grammar, laws));
                const after = yield* judge(boxPackage(carried), grammar, laws);
                const verdict = verdictOf(before);

                canonical.set(key, before);

                if (verdict.verdict === "accepted") {
                  c.note("accepted");
                } else if (before._tag === "Judged") {
                  c.note("a law's refusal");
                } else {
                  c.note(
                    verdict.rule === "well-formedness" ? "a reader refusal" : "a codec refusal",
                  );
                }

                if (set.includes(3) && set.includes(4)) {
                  c.note("two codec refusals");
                }

                if (
                  before._tag === "Judged" &&
                  new Set(before.breaches.map(({ law }) => ruleOf(law))).size > 1
                ) {
                  c.note("two rules on one element");
                }

                if (carried.includes(6) && carried.indexOf(6) < carried.indexOf(5)) {
                  c.note("declaration after its use");
                }

                assert.deepStrictEqual(statementOf(after), statementOf(before), carried.join(" "));
                assert.deepStrictEqual(verdictOf(after), verdict, carried.join(" "));
              }),
          ),
        ),
    );
  },
);
