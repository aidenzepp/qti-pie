/**
 * A declaration whose cardinality or base type spells nothing is still a declaration (spec reading
 * 158): a `cardinality` or a `base-type` that is unwritten, empty, padded or no code of its
 * enumeration is only the absence of its typed row, `DeclarationCardinality` or
 * `DeclarationBaseType`, so AL3 or its value domain refuses it alone, while the declaration's row,
 * its values, its mapping and its map keys are written and judged by every law that does not read
 * the missing attribute. The import wrote no `Declaration` row for it before, so "Declaration
 * overlay"'s copy of its cardinality and "Mapping overlay"'s copy of each map key broke beside the
 * value domain the law oracle alone raised, and the oracle in turn judged nothing of such a
 * declaration but its map keys.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`), and never the two this
 * reading closed.
 *
 * Bound: an item with one response declaration, its cardinality each of {@link cardinalities}, its
 * base type each of {@link baseTypes}, and its children each of {@link contents}: 7 × 7 × 5 = 245
 * packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement, signatureOf } from "#pantry/test/gen/genetic/judge.ts";
import { fixed, known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The classes this reading closed, `fixed`'s entries for a declaration that keeps its rows whatever
 * its attributes spell, which no case may show.
 */
const closed: ReadonlySet<string> = new Set([
  "import-only-law: Declaration overlay, contained Node(id) in Declaration(node)",
  "import-only-law: Mapping overlay, contained Attribute(node, lexical) in MapKey(node, key)",
]);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside, but for the classes it guards.
 */
const recorded: ReadonlySet<string> = new Set(
  Object.keys(known).filter((signature) => !closed.has(signature)),
);

/**
 * What an attribute of the box is: unwritten, written as no code of its enumeration, or a code.
 */
type Typing = "a code" | "no code" | "unwritten";

/**
 * One value of an attribute the box writes: its text in the start tag, none where it is unwritten,
 * and what it is.
 */
interface Written {
  readonly attribute: string;
  readonly typing: Typing;
}

/**
 * Write an attribute's values: none, then each that spells no code, then each code.
 *
 * @param name - The attribute's name.
 * @param none - The values that spell no code.
 * @param codes - The codes.
 * @returns The values.
 */
const writtenOf = (
  name: string,
  none: readonly string[],
  codes: readonly string[],
): readonly Written[] => [
  { attribute: "", typing: "unwritten" },
  ...none.map((value) => ({ attribute: ` ${name}="${value}"`, typing: "no code" as const })),
  ...codes.map((value) => ({ attribute: ` ${name}="${value}"`, typing: "a code" as const })),
];

/**
 * The cardinalities the declaration writes: none; the empty one, `many` and a padded `single`,
 * which spell no code, since the enumeration restricts `xs:string`; and `single`, `multiple` and
 * `record`.
 */
const cardinalities = writtenOf(
  "cardinality",
  ["", "many", "single "],
  ["single", "multiple", "record"],
);

/**
 * The base types the declaration writes: none; the empty one, `bogus` and a padded `identifier`,
 * which spell no code; `identifier` and `integer`, which a mapping takes; and `file`, which it does
 * not (`MappableBaseType`).
 */
const baseTypes = writtenOf(
  "base-type",
  ["", "bogus", "identifier "],
  ["identifier", "integer", "file"],
);

/**
 * Write a mapping of some keys.
 *
 * @param keys - Its entries' keys.
 * @returns The mapping.
 */
const mappingOf = (keys: readonly string[]): string =>
  `<qti-mapping default-value="0">${keys.map((key) => `<qti-map-entry map-key="${key}" mapped-value="1"/>`).join("")}</qti-mapping>`;

/**
 * The children the declaration holds: none; a mapping with one key; one with a key written twice
 * ("Map key"); one with two forms of one integer, distinct as text, one value as an integer ("Map
 * key" where the declaration is an integer); and a correct response with one value beside a
 * mapping, which `Value cardinality` and `Typed value` read beside the declaration's cardinality
 * and base type.
 */
const contents: readonly { readonly children: string; readonly name: string }[] = [
  { children: "", name: "no children" },
  { children: mappingOf(["A"]), name: "a mapping" },
  { children: mappingOf(["A", "A"]), name: "a mapping repeating a key" },
  { children: mappingOf(["1", "01"]), name: "a mapping of one integer twice" },
  {
    children: `<qti-correct-response><qti-value>A</qti-value></qti-correct-response>${mappingOf(["A"])}`,
    name: "a correct response and a mapping",
  },
];

/**
 * Every case: a cardinality, a base type and the declaration's children.
 */
const cases = cardinalities.flatMap((cardinality) =>
  baseTypes.flatMap((baseType) => contents.map((content) => ({ baseType, cardinality, content }))),
);

/**
 * A case of the box.
 */
type Case = (typeof cases)[number];

/**
 * Name a case.
 *
 * @param drawn - The case.
 * @returns Its name.
 */
const nameOf = ({ baseType, cardinality, content }: Case): string =>
  `${cardinality.attribute.trim() || "no cardinality"} ${baseType.attribute.trim() || "no base-type"}, ${content.name}`;

/**
 * Write a case's package: its item and the manifest that lists it.
 *
 * @param drawn - The case.
 * @returns Its entries.
 */
const packageOf = ({ baseType, cardinality, content }: Case): PackageEntries => {
  const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE"${cardinality.attribute}${baseType.attribute}>${content.children}</qti-response-declaration></qti-assessment-item>`;
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`;

  return new Map([
    ["imsmanifest.xml", new TextEncoder().encode(manifest)],
    ["item.xml", new TextEncoder().encode(item)],
  ]);
};

/**
 * A feature a case notes: its cardinality's typing and its base type's.
 */
type Noted = `base type ${Typing}` | `cardinality ${Typing}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "a declaration whose cardinality or base type spells nothing",
  (it) => {
    it.effect(
      "keeps its row, its values, its mapping and its map keys, and is judged alike on the import's rows and in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* untypedDeclarationRuns() {
            const directory = yield* scratchDirectory("untyped-declarations-");
            const bench = { directory, grammar, laws };
            assert.deepStrictEqual(
              [...closed].filter((signature) => !(signature in fixed)),
              [],
              "fixed records each class this reading closed",
            );

            return yield* exhaust(
              {
                box: "an item's response declaration, its cardinality and its base type each unwritten, spelling no code or a code, holding nothing, a mapping of one key, of a repeated key or of one integer twice, or a correct response and a mapping",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Noted>([
                  "base type a code",
                  "base type no code",
                  "base type unwritten",
                  "cardinality a code",
                  "cardinality no code",
                  "cardinality unwritten",
                ]),
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const held = cases[at];

                  return held === undefined ? String(at) : nameOf(held);
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/untyped-declarations",
              },
              (at: number, c) =>
                Effect.gen(function* untypedDeclarationCase() {
                  const held = cases[at];
                  assert.isDefined(held, `no case ${String(at)}`);
                  if (held === undefined) {
                    return;
                  }

                  c.note(`cardinality ${held.cardinality.typing}`);
                  c.note(`base type ${held.baseType.typing}`);

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(held)), bench, at);

                  assert.deepStrictEqual(
                    judged.disagreements
                      .filter((disagreement) => !recorded.has(signatureOf(disagreement)))
                      .map(shownDisagreement),
                    [],
                    `${nameOf(held)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
