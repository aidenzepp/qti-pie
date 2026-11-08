/**
 * A declaration whose identifier names nothing is still a declaration (spec reading 157): its
 * `identifier` unwritten, empty, whitespace alone or no NCName (reading 152) leaves it no name, so
 * AL3 or its value domain refuses it alone, and nothing references it by name, while its row, its
 * values, its mapping and its map keys are written and judged as any other declaration's. The
 * import wrote no `Declaration` row for it before, so "Declaration overlay"'s copy of its
 * cardinality and "Mapping overlay"'s copy of each map key broke beside the value domain the law
 * oracle alone raised, and a map key past the key-text bound, a repeated key or one outside its
 * base type went unjudged on the import's rows where the oracle named "Key text bound", "Map key"
 * or "Typed attribute value"; the oracle in turn read two such declarations as one name and raised
 * "Declaration key", and judged none of the laws over a nameless declaration's type and values.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`), and never the two this
 * reading closed, wherever `known` records them for another cause.
 *
 * Bound: an item with one response declaration that holds a correct response and a mapping, its
 * identifier each of {@link identifiers}, its mapping each of {@link mappings}, alone or beside an
 * outcome declaration that writes the same identifier: 7 × 5 × 2 = 70 packages, exhausted.
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
import {
  judgeOne,
  recordsClassOf,
  sameSignature,
  shownDisagreement,
  shownSignature,
} from "#pantry/test/gen/genetic/judge.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
import { fixed, known } from "#pantry/test/gen/genetic/known.ts";
import { keyTextBytes } from "#pantry/qti/limits.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The classes this reading closed, `fixed`'s entries for an identifier that names nothing, which
 * no case may show whatever `known` records.
 */
const closed: readonly Signature[] = [
  {
    kind: "import-only-law",
    law: {
      from: {
        relation: "Node",
        selection: {
          conjuncts: [
            {
              arg: { field: "kind", kind: "field" },
              kind: "in",
              values: [
                "qti-context-declaration",
                "qti-outcome-declaration",
                "qti-response-declaration",
                "qti-template-declaration",
              ],
            },
          ],
        },
        terms: [{ field: "id", kind: "field" }],
      },
      kind: "contained",
      to: {
        relation: "Declaration",
        selection: { conjuncts: [] },
        terms: [{ field: "node", kind: "field" }],
      },
    },
  },
  {
    kind: "import-only-law",
    law: {
      from: {
        relation: "Attribute",
        selection: {
          conjuncts: [
            {
              kind: "compare",
              left: { field: "kind", kind: "field" },
              op: "eq",
              right: { kind: "literal", type: undefined, value: "qti-map-entry" },
            },
            {
              kind: "compare",
              left: { field: "name", kind: "field" },
              op: "eq",
              right: { kind: "literal", type: undefined, value: "map-key" },
            },
          ],
        },
        terms: [
          { field: "node", kind: "field" },
          { field: "lexical", kind: "field" },
        ],
      },
      kind: "contained",
      to: {
        relation: "MapKey",
        selection: { conjuncts: [] },
        terms: [
          { field: "node", kind: "field" },
          { field: "key", kind: "field" },
        ],
      },
    },
  },
];

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside, but for the classes it guards.
 */
const recorded: readonly Signature[] = known.flatMap(({ signature }) =>
  closed.some((shut) => sameSignature(shut, signature)) ? [] : [signature],
);

/**
 * What an identifier of the box is: none written, one that is no NCName once collapsed, or a name.
 */
type Naming = "a name" | "no NCName" | "unwritten";

/**
 * The identifiers the declaration writes: none; the empty one; whitespace alone; one that starts
 * with a digit; two names; `٠a`, whose first character is a digit in the `Letter` tables
 * `xs:NCName` reads; and a name, the control.
 */
const identifiers: readonly { readonly attribute: string; readonly naming: Naming }[] = [
  { attribute: "", naming: "unwritten" },
  ...["", "  ", "1a", "a b", "٠a"].map((value) => ({
    attribute: ` identifier="${value}"`,
    naming: "no NCName" as const,
  })),
  { attribute: ' identifier="RESPONSE"', naming: "a name" },
];

/**
 * A key past the key-text bound: one more ASCII character than `keyText` holds.
 */
const longKey = "q".repeat(keyTextBytes + 1);

/**
 * The mappings the declaration holds, each with its cardinality and base type and what the law
 * oracle judges of it: one lawful key; a key written twice ("Map key"); a key past the key-text
 * bound ("Key text bound"); a key outside its base type ("Typed attribute value", beside its
 * correct response's "Typed value"); and a record's mapping ("MappableBaseType").
 */
const mappings: readonly {
  readonly keys: readonly string[];
  readonly name: string;
  readonly typing: string;
}[] = [
  { keys: ["A"], name: "lawful", typing: ' cardinality="single" base-type="identifier"' },
  { keys: ["A", "A"], name: "repeated", typing: ' cardinality="single" base-type="identifier"' },
  {
    keys: [longKey],
    name: "past the bound",
    typing: ' cardinality="single" base-type="identifier"',
  },
  {
    keys: ["A"],
    name: "outside its base type",
    typing: ' cardinality="single" base-type="integer"',
  },
  { keys: ["A"], name: "of a record", typing: ' cardinality="record"' },
];

/**
 * Every case: an identifier, a mapping, and whether an outcome declaration writes the identifier
 * too.
 */
const cases = identifiers.flatMap((identifier) =>
  mappings.flatMap((mapping) => [false, true].map((twin) => ({ identifier, mapping, twin }))),
);

/**
 * A case of the box.
 */
type Case = (typeof cases)[number];

/**
 * Write a case's package: its item and the manifest that lists it.
 *
 * @param drawn - The case.
 * @returns Its entries.
 */
const packageOf = ({ identifier, mapping, twin }: Case): PackageEntries => {
  const entries = mapping.keys
    .map((key) => `<qti-map-entry map-key="${key}" mapped-value="1"/>`)
    .join("");
  const outcome = twin
    ? `<qti-outcome-declaration${identifier.attribute} cardinality="single" base-type="float"/>`
    : "";
  const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration${identifier.attribute}${mapping.typing}><qti-correct-response><qti-value${mapping.typing.includes("record") ? ' field-identifier="f" base-type="identifier"' : ""}>A</qti-value></qti-correct-response><qti-mapping default-value="0">${entries}</qti-mapping></qti-response-declaration>${outcome}</qti-assessment-item>`;
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`;

  return new Map([
    ["imsmanifest.xml", new TextEncoder().encode(manifest)],
    ["item.xml", new TextEncoder().encode(item)],
  ]);
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "a declaration whose identifier names nothing",
  (it) => {
    it.effect(
      "keeps its row, its mapping and its map keys, and is judged alike on the import's rows and in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* unnamedDeclarationRuns() {
            const directory = yield* scratchDirectory("unnamed-declarations-");
            const bench = { directory, grammar, laws };
            assert.deepStrictEqual(
              closed.flatMap((signature) =>
                fixed.some((entry) => sameSignature(entry.signature, signature))
                  ? []
                  : [shownSignature(signature)],
              ),
              [],
              "fixed records each class this reading closed",
            );

            return yield* exhaust(
              {
                box: "an item's response declaration with a correct response and a mapping, its identifier unwritten, no NCName or a name, its mapping lawful, repeating a key, past the key-text bound, outside its base type or a record's, alone or beside an outcome of its identifier",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Naming | "beside its twin">([
                  "a name",
                  "beside its twin",
                  "no NCName",
                  "unwritten",
                ]),
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const held = cases[at];

                  return held === undefined
                    ? String(at)
                    : `${held.identifier.attribute || "no identifier"} ${held.mapping.name}${held.twin ? " beside its twin" : ""}`;
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/unnamed-declarations",
              },
              (at: number, c) =>
                Effect.gen(function* unnamedDeclarationCase() {
                  const held = cases[at];
                  assert.isDefined(held, `no case ${String(at)}`);
                  if (held === undefined) {
                    return;
                  }

                  c.note(held.identifier.naming);
                  if (held.twin) {
                    c.note("beside its twin");
                  }

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(held)), bench, at);

                  assert.deepStrictEqual(
                    judged.disagreements
                      .filter((disagreement) => !recordsClassOf(recorded, disagreement))
                      .map(shownDisagreement),
                    [],
                    `${held.identifier.attribute || "no identifier"}, ${held.mapping.name}${held.twin ? ", beside its twin" : ""}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
