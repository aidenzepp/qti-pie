/**
 * An item ref's href, written or not, under a path whose identifiers are written or not (spec
 * readings 147 and 155): an item ref that writes no href names nothing, so AL3 alone refuses it,
 * with no `ItemRefTarget` or `ReferencePath` row demanded of it and no `NameLookup` type copied
 * from one; and an item ref's laws over its href and its mappings judge it whether or not it, its
 * sections or its test part write an identifier. The schema once demanded a target and a resolved
 * href of every item ref, so one with no href broke "Item ref target" and "Test overlay" beside
 * AL3, and the law oracle once judged an item ref's laws through its name, so one that writes no
 * identifier escaped "Item ref target" and the mapping laws the schema judged it by.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows any disagreement.
 *
 * Bound: a test whose part holds two nested sections around one item ref, each of the four
 * identifiers written or not, the href unwritten or naming the package's item, a path no entry
 * holds, or an external URI, and the item ref with or without a mapping whose source the item
 * declares nothing under: 128 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, of the exhaustion: a hang guard, never a budget. Measured
 * 2026-11-07: 8.8 s at a load average of 21 to 22, its slowest run.
 */
const testTimeoutMs = 600_000;

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The namespace of every QTI 3.0 document of the box.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The elements on the item ref's path whose identifier a case writes or not, root side first.
 */
const named = ["part", "outer section", "inner section", "item ref"] as const;

/**
 * An element of {@link named}.
 */
type Named = (typeof named)[number];

/**
 * What a case's item ref's href is: unwritten, the package's item, a path no entry holds, or an
 * external URI.
 */
const hrefKinds = ["unwritten", "item", "unlisted", "external"] as const;

/**
 * An element of {@link hrefKinds}.
 */
type Href = (typeof hrefKinds)[number];

/**
 * The href each of {@link hrefKinds} writes, none for an unwritten one.
 */
const hrefOf: Readonly<Record<Href, Option.Option<string>>> = {
  external: Option.some("https://example.org/item.xml"),
  item: Option.some("item.xml"),
  unlisted: Option.some("unlisted.xml"),
  unwritten: Option.none(),
};

/**
 * One case of the box: the elements that write their identifier, the href, and whether the item
 * ref holds a mapping whose source the item declares nothing under.
 */
interface ItemRefCase {
  readonly href: Href;
  readonly mapped: boolean;
  readonly written: ReadonlySet<Named>;
}

/**
 * List every subset of some elements.
 *
 * @param elements - The elements.
 * @returns Each subset, in the elements' order.
 */
const subsetsOf = ([first, ...rest]: readonly Named[]): readonly (readonly Named[])[] =>
  first === undefined ? [[]] : subsetsOf(rest).flatMap((subset) => [subset, [first, ...subset]]);

/**
 * Every case of the box: each subset of {@link named}, each href and each mapping choice.
 */
const cases: readonly ItemRefCase[] = subsetsOf(named).flatMap((written) =>
  hrefKinds.flatMap((href) =>
    [false, true].map((mapped) => ({ href, mapped, written: new Set(written) })),
  ),
);

/**
 * Write a case as text.
 *
 * @param input - The case.
 * @returns Its text.
 */
const literalOf = (input: ItemRefCase): string =>
  `identifiers {${[...input.written].join(", ")}}, href ${input.href}${input.mapped ? ", mapped" : ""}`;

/**
 * The manifest of every case: the test and the item, each a resource listing its own file.
 */
const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="T" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/><dependency identifierref="I"/></resource><resource identifier="I" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`;

/**
 * The item of every case, which declares one outcome.
 */
const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" identifier="i" title="I" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/></qti-assessment-item>`;

/**
 * Write a case's package.
 *
 * @param input - The case.
 * @returns Its entries.
 */
const packageOf = (input: ItemRefCase): PackageEntries => {
  const identifier = (element: Named, value: string): string =>
    input.written.has(element) ? ` identifier="${value}"` : "";
  const href = Option.match(hrefOf[input.href], {
    onNone: () => "",
    onSome: (value) => ` href="${value}"`,
  });
  const ref = `<qti-assessment-item-ref${identifier("item ref", "r")}${href}`;
  const itemRef = input.mapped
    ? `${ref}><qti-variable-mapping source-identifier="UNDECLARED" target-identifier="MAPPED"/></qti-assessment-item-ref>`
    : `${ref}/>`;
  const test = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="${asi}" identifier="t" title="T"><qti-test-part${identifier("part", "p")} navigation-mode="linear" submission-mode="individual"><qti-assessment-section${identifier("outer section", "s1")} title="S1" visible="true"><qti-assessment-section${identifier("inner section", "s2")} title="S2" visible="true">${itemRef}</qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>`;
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifest)],
    ["item.xml", text.encode(item)],
    ["test.xml", text.encode(test)],
  ]);
};

/**
 * A situation the box must reach.
 */
type Situation =
  | "href external"
  | "href names nothing"
  | "href unwritten"
  | "item ref unnamed, href names nothing"
  | "item ref unnamed, mapped"
  | "path unnamed, href unwritten";

layer(NodeServices.layer, { excludeTestServices: true })("an item ref's href", (it) => {
  it.effect(
    "is refused by AL3 alone where unwritten, and judged named or not, on the import's rows as in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* itemRefHrefRuns() {
          const directory = yield* scratchDirectory("item-ref-href-");
          const bench = { directory, grammar, laws };

          return yield* exhaust(
            {
              box: "a test whose part holds two nested sections around one item ref, each identifier written or not, its href unwritten or naming the item, nothing or an external URI, with or without an undeclared mapping",
              caseHang: Duration.minutes(5),
              coverage: requiredInSpace<Situation>([
                "href unwritten",
                "href names nothing",
                "href external",
                "path unnamed, href unwritten",
                "item ref unnamed, href names nothing",
                "item ref unnamed, mapped",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) =>
                Option.match(Option.fromUndefinedOr(cases[at]), {
                  onNone: () => String(at),
                  onSome: literalOf,
                }),
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host",
              },
              suite: "pantry/item-ref-href",
            },
            (at, c) =>
              Effect.gen(function* itemRefHrefCase() {
                const input = cases[at];
                assert.isDefined(input, `no case ${String(at)}`);
                if (input === undefined) {
                  return;
                }

                const pathUnnamed = named.some(
                  (element) => element !== "item ref" && !input.written.has(element),
                );
                const refUnnamed = !input.written.has("item ref");
                if (input.href === "unwritten") {
                  c.note("href unwritten");
                  if (pathUnnamed) {
                    c.note("path unnamed, href unwritten");
                  }
                }

                if (input.href === "unlisted") {
                  c.note("href names nothing");
                  if (refUnnamed) {
                    c.note("item ref unnamed, href names nothing");
                  }
                }

                if (input.href === "external") {
                  c.note("href external");
                }

                if (refUnnamed && input.mapped) {
                  c.note("item ref unnamed, mapped");
                }

                const judged = yield* judgeOne(yield* genomeOf(packageOf(input)), bench, at);

                assert.deepStrictEqual(
                  judged.disagreements.map(shownDisagreement),
                  [],
                  `${literalOf(input)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                );
              }),
          );
        }).pipe(Effect.scoped),
      ),
    testTimeoutMs,
  );
});
