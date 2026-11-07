/**
 * The catalog overlays' free tests: their statements are composed into `Qti`, each check is named
 * by an oracle law, and the oracle judges the two catalog laws of spec reading R9-a (information
 * model §5.26.1 and §5.27.2) over packages whose catalogs repeat a support or a default.
 *
 * The database tests judge the laws through PostgreSQL, and the builder's tests
 * (`#pantry/import/overlays/catalog.test.ts`) its rows.
 */
import type { Statement } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { catalogLaws, catalogLawsByName, catalogRelations } from "#pantry/qti/catalog.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { lawNames, ruleOf } from "#pantry/test/oracle.ts";
import { base, breachesOf, edit, item, judged, shown } from "#pantry/test/probe.ts";

/**
 * A catalog info whose catalogs are the given markup, placed between the item's body and its
 * response processing, where the XSD puts it.
 *
 * @param catalogs - The `qti-catalog` children.
 * @returns The `qti-catalog-info`.
 */
const catalogInfo = (catalogs: string): string =>
  `<qti-catalog-info>${catalogs}</qti-catalog-info>`;

/**
 * The breaches of one law of the base item with a catalog info after its body.
 *
 * @param law - The law.
 * @param catalogs - The catalog info's `qti-catalog` children.
 * @returns The law's breaches' `node` keys, sorted.
 */
const breachesOfLaw = (law: "Card default entry" | "Card support", catalogs: string) =>
  Effect.gen(function* judgedCatalog() {
    const text = edit(item, "</qti-item-body>", `</qti-item-body>${catalogInfo(catalogs)}`);
    const breaches = breachesOf(yield* judged({ ...base, "item.xml": text }));

    return {
      keys: breaches.filter((breach) => breach.law === law).map(({ keys }) => keys["node"] ?? ""),
      shown: shown(breaches),
    };
  });

/**
 * A catalog of cards, each a card of the given support.
 *
 * @param id - The catalog's id.
 * @param supports - Each card's `support` attribute value, as written.
 * @returns The catalog.
 */
const catalogOf = (id: string, ...supports: readonly string[]): string =>
  `<qti-catalog id="${id}">${supports
    .map((support) => `<qti-card support="${support}"><qti-html-content/></qti-card>`)
    .join("")}</qti-catalog>`;

/**
 * A catalog of one card whose entries carry the given `default` values.
 *
 * @param defaults - Each entry's `default`, as written; `undefined` writes none.
 * @returns The catalog.
 */
const entriesOf = (...defaults: readonly (string | undefined)[]): string =>
  `<qti-catalog id="C"><qti-card support="spoken">${defaults
    .map(
      (value) =>
        `<qti-card-entry${value === undefined ? "" : ` default="${value}"`}><qti-html-content/></qti-card-entry>`,
    )
    .join("")}</qti-card></qti-catalog>`;

describe("qti/catalog.ts, declared", () => {
  it("is composed into Qti: each overlay a member under its name, every statement once", () => {
    // Oracle: grizzle's schema builder, which built `Qti` from these statements when
    // `#pantry/qti/schema.ts` loaded and refuses a statement over a relation it does not hold.
    for (const relation of Object.values(catalogRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }

    const statements: readonly Statement[] = Qti.statements;
    assert.strictEqual(new Set(catalogLaws).size, catalogLaws.length);
    for (const statement of catalogLaws) {
      assert.strictEqual(statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = catalogLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.strictEqual(ruleOf(law), "derived", name);
      }
    }

    assert.deepStrictEqual([...new Set(named)], ["E1 derived"]);
    assert.deepStrictEqual(Object.keys(catalogLawsByName), [
      "Card default entry",
      "Card support",
      "DocumentId key",
      "E1 derived",
    ]);
    assert.strictEqual(ruleOf("Card support"), "card-support");
    assert.strictEqual(ruleOf("Card default entry"), "card-default");
  });
});

describe("test/oracle.ts, Card support", () => {
  // Oracle: the specification as a checker, the information model's Card (§5.26.1: "Use only one
  // card for any particular named support in a catalog") with the support compared by its
  // collapsed value (spec reading R9-a).
  it.effect("breaks once at the second card of one support in one catalog", () =>
    Effect.gen(function* twice() {
      const { keys, shown: all } = yield* breachesOfLaw(
        "Card support",
        catalogOf("C", "spoken", "spoken"),
      );

      assert.strictEqual(keys.length, 1, all);
    }),
  );

  it.effect("breaks a support beside the same support padded with whitespace, once collapsed", () =>
    Effect.gen(function* padded() {
      const { keys, shown: all } = yield* breachesOfLaw(
        "Card support",
        catalogOf("C", "spoken", " spoken "),
      );

      assert.strictEqual(keys.length, 1, all);
    }),
  );

  it.effect("breaks once for each card past the first of a support", () =>
    Effect.gen(function* thrice() {
      const { keys, shown: all } = yield* breachesOfLaw(
        "Card support",
        catalogOf("C", "spoken", "braille", "spoken", "spoken"),
      );

      assert.strictEqual(keys.length, 2, all);
    }),
  );

  it.effect("breaks nothing for distinct supports, one card, or one support in two catalogs", () =>
    Effect.gen(function* distinct() {
      for (const catalogs of [
        catalogOf("C", "spoken", "braille"),
        catalogOf("C", "spoken"),
        `${catalogOf("A", "spoken")}${catalogOf("B", "spoken")}`,
      ]) {
        const { keys, shown: all } = yield* breachesOfLaw("Card support", catalogs);

        assert.deepStrictEqual(keys, [], all);
      }
    }),
  );
});

describe("test/oracle.ts, Card default entry", () => {
  // Oracle: the specification as a checker, the information model's CardEntry (§5.27.2: "Only one
  // of the CardEntry instances can have a default designation"), an entry designating where its
  // collapsed default is true or 1 (spec reading R9-a).
  it.effect("breaks once at the second entry designated by true and 1", () =>
    Effect.gen(function* trueAndOne() {
      const { keys, shown: all } = yield* breachesOfLaw(
        "Card default entry",
        entriesOf("true", "1"),
      );

      assert.strictEqual(keys.length, 1, all);
    }),
  );

  it.effect("breaks two entries designated by true and by true padded with whitespace", () =>
    Effect.gen(function* padded() {
      const { keys, shown: all } = yield* breachesOfLaw(
        "Card default entry",
        entriesOf("true", " true "),
      );

      assert.strictEqual(keys.length, 1, all);
    }),
  );

  it.effect("breaks nothing for one designated entry beside false, 0 or no default", () =>
    Effect.gen(function* one() {
      for (const defaults of [
        ["true"],
        ["true", "false"],
        ["1", "0", undefined],
        [undefined, undefined],
        ["false", "false"],
      ] as const) {
        const { keys, shown: all } = yield* breachesOfLaw(
          "Card default entry",
          entriesOf(...defaults),
        );

        assert.deepStrictEqual(keys, [], all);
      }
    }),
  );

  it.effect("judges the designated entries of each card alone", () =>
    Effect.gen(function* twoCards() {
      const { keys, shown: all } = yield* breachesOfLaw(
        "Card default entry",
        `<qti-catalog id="C"><qti-card support="spoken"><qti-card-entry default="true"/></qti-card><qti-card support="braille"><qti-card-entry default="true"/></qti-card></qti-catalog>`,
      );

      assert.deepStrictEqual(keys, [], all);
    }),
  );
});
