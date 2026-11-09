/**
 * The closed relations a law reads at a key the grammar may give no value, each holding a row only
 * where it gives one (grizzle's README, "Closed relations": `C.has(k…)` is false at a key no row
 * holds, so a rule says what holds where a key is absent with it, never with a row that stands for
 * the absence):
 *
 * - `CountedOf` and `BarredOf`, (version, parent) → the one position of a family whose count is a law
 *   beside its automaton, or that an attribute bars (C25);
 * - `SharedModelOf`, (version, parent) → the shared model of a family a kind names at several
 *   positions (C4);
 * - `ValueIdentity`, domain → its identity type, `xs:ID`, `xs:IDREF` or `xs:IDREFS`;
 * - `TextDomain`, (version, governor) → the domain an element under the governor reads its text in,
 *   where the governor has simple content.
 *
 * Each was total through a named null object until `C.has` (grizzle 587adb46): `uncounted`,
 * `unbarred`, `SharedModel`'s `none`, `Identity`'s `none`, and `xs:anySimpleType` for a governor of
 * no simple content. Over every key of each, present and absent:
 *
 * - The installed relation holds a row exactly where the law oracle's tables (`lawsOf` of
 *   `#pantry/test/oracle.ts`) give the key a value, and that value, so a null-object row planted
 *   back fails it at every key it stands at;
 * - The laws that read one judge a row as the law oracle does, evaluated over the predicates grizzle
 *   keeps for them (`#pantry/test/key-copies.ts`), the closed reads `C.has` and `C.at` against the
 *   installed rows: N7 barred by over every family and every carrying and barring of it; N7 Counted
 *   over every family with no `CountedOf` row, whatever its count (its bounds are a `between`,
 *   which the host judge reads as unknown); and the TextDomain check over every (version, kind,
 *   governs) `GoverningOf` holds, whatever text it holds.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { openDomain, textDomainOf } from "#pantry/grammar/attributes.ts";
import { int8Max } from "#pantry/grammar/closed.ts";
import {
  BarredOf,
  CountedOf,
  GoverningOf,
  grammar,
  nonElementKinds,
  SharedModelOf,
  TextDomain,
  ValueDomain,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { Qti } from "#pantry/qti/own.ts";
import type { Datum } from "#pantry/test/predicates.ts";
import { checkValueOf } from "#pantry/test/key-copies.ts";
import { lawsOf } from "#pantry/test/oracle.ts";

/**
 * How long one case may run before the search stops it as hung: a family's or a triple's handful
 * of reads.
 */
const caseHang = Duration.minutes(1);

/**
 * The law oracle's tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * A closed relation this file judges.
 */
type Judged = "BarredOf" | "CountedOf" | "SharedModelOf" | "TextDomain" | "ValueIdentity";

/**
 * Index a closed relation's rows by their key, each row's payload written as one text.
 *
 * @param rows - The relation's rows.
 * @param key - Its key fields, in key order.
 * @param payload - Its payload fields, in the order the text writes them.
 * @returns Each row's payload text, by its key's values, space separated.
 */
const payloadAt = <Row extends Readonly<Record<string, unknown>>>(
  rows: readonly Row[],
  key: readonly (keyof Row & string)[],
  payload: readonly (keyof Row & string)[],
): ReadonlyMap<string, string> =>
  new Map(
    rows.map((row) => [
      key.map((field) => String(row[field])).join(" "),
      payload.map((field) => String(row[field])).join(" "),
    ]),
  );

/**
 * The installed rows of each judged relation, by key.
 */
const installed: Readonly<Record<Judged, ReadonlyMap<string, string>>> = {
  BarredOf: payloadAt(BarredOf.rows, ["version", "parent"], ["position", "slot"]),
  CountedOf: payloadAt(CountedOf.rows, ["version", "parent"], ["position", "min", "max"]),
  SharedModelOf: payloadAt(SharedModelOf.rows, ["version", "parent"], ["model"]),
  TextDomain: payloadAt(TextDomain.rows, ["version", "governor"], ["domain"]),
  ValueIdentity: payloadAt(ValueIdentity.rows, ["domain"], ["identity"]),
};

/**
 * Every (version, parent) family: the product of the `SchemaVersion` and `NodeKind` rosters.
 */
const families = grammar.kinds.versions.handles.flatMap((version) =>
  grammar.kinds.nodeKind.handles.map((parent) => ({ parent, version })),
);

/**
 * The kinds that are no element, as a set.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The families a kind names at several positions, keyed `version parent`: those where `Admission`
 * places an element kind at position 0, its cell for a kind several positions name.
 */
const sharedFamilies: ReadonlySet<string> = new Set(
  grammar.admission.rows
    .filter(({ child, position }) => position === "0" && !nonElements.has(child))
    .map(({ parent, version }) => `${version} ${parent}`),
);

/**
 * Read the one count of a family `CountedOf` states, from the law oracle's `Counted` bounds: every
 * bound but a cap at one (spec reading 130), which `Capped` states.
 *
 * @param version - The family's version.
 * @param parent - Its parent kind.
 * @returns Its position, least and most, as `CountedOf`'s payload writes them; none where the
 *   family has no such count.
 */
const countedOf = (version: (typeof families)[number]["version"], parent: string) => {
  const counts = laws
    .counted(version, parent)
    .filter(({ max, min }) => !(min === 0 && max === 1))
    .map(
      ({ max, min, position }) =>
        `${String(position)} ${String(min)} ${String(Number.isFinite(max) ? BigInt(max) : int8Max)}`,
    );
  assert.isAtMost(counts.length, 1, `${version} ${parent}: the oracle states several counts`);

  return Arr.head(counts);
};

/**
 * What bars a family's children: the position, and the slot of the attribute whose presence bars
 * them.
 */
interface Barring {
  readonly position: string;
  readonly slot: string;
}

/**
 * Read the barring of a family, from the law oracle's grammar: the position `ChildBarredBy` bars,
 * and the slot of its attribute under the parent's own governor.
 *
 * @param version - The family's version.
 * @param parent - Its parent kind.
 * @returns The barring; none where nothing bars the family, or the parent admits no such attribute.
 */
const barringOf = (
  version: (typeof families)[number]["version"],
  parent: string,
): Option.Option<Barring> =>
  Option.flatMap(laws.grammar.barredBy.lookup({ parent, version }), ({ name, position }) =>
    Option.map(
      laws.grammar.attributes.admission.lookup({ kind: parent, name, version }),
      (cell) => ({ position, slot: cell.position }),
    ),
  );

/**
 * Read a family's shared model: the oracle grammar's `SharedModelOf` model of a family a kind names
 * at several positions ({@link sharedFamilies}), none for any other.
 *
 * @param version - The family's version.
 * @param parent - Its parent kind.
 * @returns The model; none where no kind of the family names several positions.
 */
const sharedModelOf = (version: (typeof families)[number]["version"], parent: string) =>
  sharedFamilies.has(`${version} ${parent}`)
    ? Option.some(
        Option.match(laws.grammar.content.sharedModelOf.lookup({ parent, version }), {
          onNone: () => "a shared family of no generated model",
          onSome: ({ model }) => model,
        }),
      )
    : Option.none();

/**
 * One key of a judged relation, with the value the installed rows and the law oracle give it.
 */
interface Keyed {
  readonly key: string;
  readonly oracle: Option.Option<string>;
  readonly relation: Judged;
}

/**
 * Every key of every judged relation: each family under `CountedOf`, `BarredOf` and
 * `SharedModelOf`; each `ValueDomain` handle; and the (version, governor) `TextDomain` reads for
 * each (version, kind, governs) `GoverningOf` holds, the oracle reading its text's domain from the
 * triple as it reads a node's (`textDomainOf` of the attribute grammar).
 */
const keyed: readonly Keyed[] = [
  ...families.flatMap(({ parent, version }): readonly Keyed[] => [
    { key: `${version} ${parent}`, oracle: countedOf(version, parent), relation: "CountedOf" },
    {
      key: `${version} ${parent}`,
      oracle: Option.map(barringOf(version, parent), ({ position, slot }) => `${position} ${slot}`),
      relation: "BarredOf",
    },
    {
      key: `${version} ${parent}`,
      oracle: sharedModelOf(version, parent),
      relation: "SharedModelOf",
    },
  ]),
  ...ValueDomain.handles.map((domain): Keyed => ({
    key: domain,
    oracle: Option.flatMap(
      Option.fromUndefinedOr(laws.domains.get(domain)),
      ({ domain: held }) => held.identity,
    ),
    relation: "ValueIdentity",
  })),
  ...GoverningOf.rows.map(({ governor, governs, kind, version }): Keyed => ({
    key: `${version} ${governor}`,
    oracle: textDomainOf(laws.grammar.attributes, { governs: Option.some(governs), kind, version }),
    relation: "TextDomain",
  })),
];

/**
 * What the key search notes: each relation at a key it holds and at one it does not.
 */
type KeySituation = `${Judged} ${"absent" | "present"}`;

/**
 * Read a check `Qti` states over `Node`, as the host judge evaluates its predicate.
 *
 * @param name - The check's name.
 * @returns The predicate's value over a row: true, false, or undefined for unknown.
 * @throws {Error} When `Qti` states no such check, or one the host judge does not read.
 */
const nodeCheck = (name: string) =>
  Option.getOrThrowWith(
    checkValueOf(Qti.statements, "Node", name),
    () => new Error(`Qti states no check ${name} on Node that the host judge reads.`),
  );

/**
 * N7 barred by, as the host judge evaluates it.
 */
const n7BarredBy = nodeCheck("N7_barred_by");

/**
 * N7 Counted, as the host judge evaluates it.
 */
const n7Counted = nodeCheck("N7_Counted");

/**
 * The TextDomain check, as the host judge evaluates it.
 */
const textDomainCheck = nodeCheck("TextDomain");

/**
 * The slots a family's element may carry in the law search: none, slot 0 (the slot the old
 * `unbarred` row named), slot 1, and the barring attribute's slot where one bars the family.
 *
 * @param barring - The family's barring, as {@link barringOf} reads it.
 * @returns The sets of slots.
 */
const carryings = (barring: Option.Option<Barring>): readonly ReadonlySet<string>[] => [
  new Set<string>(),
  new Set(["0"]),
  new Set(["1"]),
  ...Option.match(barring, { onNone: () => [], onSome: ({ slot }) => [new Set([slot])] }),
];

/**
 * The texts the TextDomain check is judged over at each triple: one no domain but a string's admits
 * among them, and none holding a line terminator, which grizzle's `str.regex` and the oracle's
 * compiled pattern may read apart.
 */
const texts = ["", "x", "1", "true", " 1 ", "-0.5", "2026-11-07", "P1D", "a b", "#x"];

/**
 * The value domains that check nothing, by the oracle's reading (`checkedTextOf` of
 * `#pantry/test/oracle.ts`): those whose pattern is `xs:anySimpleType`'s and that bound no value.
 */
const uncheckedDomains: ReadonlySet<string> = new Set(
  [...laws.domains].flatMap(([handle, { domain }]) =>
    domain.pattern === laws.domains.get(openDomain.handle)?.domain.pattern &&
    Option.isNone(domain.bound)
      ? [handle]
      : [],
  ),
);

/**
 * Decide, as the law oracle does, whether an element's text breaks TextDomain: its text domain is
 * an empty one, or a domain that checks it and whose pattern it misses. An element whose governor
 * has no simple content reads its text in no domain, and breaks nothing.
 *
 * @param domain - The element's text domain, none where its governor has no simple content.
 * @param text - Its string value.
 * @returns Whether it breaks the law.
 */
const textBreaks = (domain: Option.Option<string>, text: string): boolean =>
  Option.exists(domain, (held) => {
    if (laws.grammar.attributes.emptyDomains.includes(held)) {
      return true;
    }

    const compiled = laws.domains.get(held);

    return compiled !== undefined && !uncheckedDomains.has(held) && !compiled.regex.test(text);
  });

/**
 * One case of the law search: a family, under N7 barred by and N7 Counted, or a `GoverningOf`
 * triple, under the TextDomain check.
 */
type LawCase =
  | { readonly family: (typeof families)[number]; readonly kind: "family" }
  | { readonly kind: "triple"; readonly triple: (typeof GoverningOf.rows)[number] };

/**
 * Every case of the law search.
 */
const lawCases: readonly LawCase[] = [
  ...families.map((family): LawCase => ({ family, kind: "family" })),
  ...GoverningOf.rows.map((triple): LawCase => ({ kind: "triple", triple })),
];

/**
 * What the law search notes: each law at a key its relation holds and at one it does not, and each
 * verdict it reaches there.
 */
type LawSituation =
  | `N7 barred by ${"at a barred family" | "at an unbarred family"} ${"held" | "refused"}`
  | "N7 Counted at an uncounted family"
  | `TextDomain ${"at a governor of simple content" | "at a governor of none"} ${"held" | "refused"}`;

describe("the closed relations read at a key the grammar may give no value", () => {
  it.effect(
    "hold a row exactly at each key the law oracle gives a value, that value, and none for an absent one, every key of each exhausted",
    (ctx) =>
      // Oracle: the law oracle's tables over the composed grammar (`lawsOf`): `Counted`'s bounds,
      // `ChildBarredBy`, `Admission`'s position-0 element cells, each domain's identity type and
      // the text domain of each (version, kind, governs).
      // Bound: every key of the five relations, the families twice each and every GoverningOf
      // triple's governor.
      searched(
        ctx,
        exhaust(
          {
            box: `every key of CountedOf, BarredOf, SharedModelOf, ValueIdentity and TextDomain, ${String(keyed.length)}`,
            caseHang,
            coverage: requiredInSpace<KeySituation>([
              "CountedOf present",
              "CountedOf absent",
              "BarredOf present",
              "BarredOf absent",
              "SharedModelOf present",
              "SharedModelOf absent",
              "ValueIdentity present",
              "ValueIdentity absent",
              "TextDomain present",
              "TextDomain absent",
            ]),
            generator: int(0, keyed.length - 1),
            limit: keyed.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the law oracle's tables (lawsOf)" },
            suite: "test/closed-has/keys",
          },
          (index, c) =>
            Effect.sync(() => {
              const { key, oracle, relation } = Arr.getUnsafe(keyed, index);
              c.note(`${relation} ${Option.isSome(oracle) ? "present" : "absent"}`);
              assert.deepStrictEqual(
                Option.fromUndefinedOr(installed[relation].get(key)),
                oracle,
                `${relation} at (${key})`,
              );
            }),
        ),
      ),
  );

  it.effect(
    "judge a row at a key present or absent as the law oracle does: N7 barred by and N7 Counted over every family, the TextDomain check over every GoverningOf triple",
    (ctx) =>
      // Oracle: the law oracle's N7 barred by (a family `ChildBarredBy` bars breaks where its
      // element carries the barring attribute and holds a child at the barred position), N7
      // Counted (a family with no count holds of any) and TextDomain (`checkedTextOf` and
      // `emptyTextOf`), each over the oracle's tables.
      // Bound: every family, each with every carrying of {@link carryings} and 0 or 2 barred
      // children and counted children; every GoverningOf triple with every text of {@link texts}.
      searched(
        ctx,
        exhaust(
          {
            box: `every family and every GoverningOf triple, ${String(lawCases.length)}`,
            caseHang,
            coverage: requiredInSpace<LawSituation>([
              "N7 barred by at a barred family held",
              "N7 barred by at a barred family refused",
              "N7 barred by at an unbarred family held",
              "N7 Counted at an uncounted family",
              "TextDomain at a governor of simple content held",
              "TextDomain at a governor of simple content refused",
              "TextDomain at a governor of none held",
            ]),
            generator: int(0, lawCases.length - 1),
            limit: lawCases.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "the law oracle's N7 and TextDomain" },
            suite: "test/closed-has/laws",
          },
          (index, c) =>
            Effect.sync(() => {
              const held = Arr.getUnsafe(lawCases, index);
              if (held.kind === "family") {
                const { parent, version } = held.family;
                const barring = barringOf(version, parent);
                const counted = countedOf(version, parent);
                const at = Option.isSome(barring) ? "at a barred family" : "at an unbarred family";
                for (const attrs of carryings(barring)) {
                  for (const children of [0n, 2n]) {
                    const row = {
                      attrs,
                      barredChildren: children,
                      countedChildren: children,
                      kind: parent,
                      version,
                    } satisfies Readonly<Record<string, Datum>>;
                    const breaks = Option.exists(
                      barring,
                      ({ slot }) => attrs.has(slot) && children > 0n,
                    );
                    c.note(`N7 barred by ${at} ${breaks ? "refused" : "held"}`);
                    assert.strictEqual(
                      n7BarredBy(row),
                      !breaks,
                      `N7 barred by over ${Formatter.format(row)}`,
                    );
                    if (Option.isNone(counted)) {
                      c.note("N7 Counted at an uncounted family");
                      assert.strictEqual(
                        n7Counted(row),
                        true,
                        `N7 Counted over ${Formatter.format(row)}`,
                      );
                    }
                  }
                }
              } else {
                const { governor, governs, kind, version } = held.triple;
                const domain = textDomainOf(laws.grammar.attributes, {
                  governs: Option.some(governs),
                  kind,
                  version,
                });
                const at = Option.isSome(domain)
                  ? "at a governor of simple content"
                  : "at a governor of none";
                for (const stringValue of texts) {
                  const row = { governor, stringValue, version };
                  const breaks = textBreaks(domain, stringValue);
                  c.note(`TextDomain ${at} ${breaks ? "refused" : "held"}`);
                  assert.strictEqual(
                    textDomainCheck(row),
                    !breaks,
                    `TextDomain over ${Formatter.format(row)}`,
                  );
                }
              }
            }),
        ),
      ),
  );
});
