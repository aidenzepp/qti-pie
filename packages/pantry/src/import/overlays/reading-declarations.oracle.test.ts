/**
 * A reference that names no declaration holds no declaration row, and every law over a declaration
 * states what holds where the row is absent (AGENTS.md's Schema intent: a value that may be missing
 * is a row of its own relation, never a sentinel). A test's reading of a built-in variable or of
 * nothing, and one through a variable mapping whose source its item declares nothing under, has no
 * `ReadingDeclaration`: "Variable kind" judges a built-in reading by the kind the built-in stands
 * as under its scope's root, and the mapping's own law refuses the rest ("Variable mapping
 * source"). A processing reference that claims no table of its declaration has no
 * `VariableRefTable`: a map response, a map response point or a lookup whose declaration holds none
 * of the tables it reads is refused by "Mapped response" or "Lookup type". Before, a reading held
 * the null-object declaration codes (its lookup document, `qti-outcome-declaration`, no
 * cardinality, no base type) where it named none, and a reference the table `none`; and the law
 * oracle stood a name mapped from an undeclared source as an outcome, a kind no declaration gave
 * it. A reading in place of a literal is judged under "Reference type" over the declaration it
 * reads (P24): a built-in is refused, and a declaration must be an outcome or a template, of the
 * literal's base type where it has one and single where it has a cardinality; the law oracle judged
 * no test-level reading under it before, where the import's rows did.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`).
 *
 * Bound: a test's outcome processing reading one of {@link names}' fourteen names by each of
 * {@link readers}' three ways, beside each of {@link mappings}' six mappings on its item ref: 252
 * packages; and an item's map response, map response point and lookup naming a declaration that
 * holds each of {@link heldTables}' five table states, a built-in variable or nothing, the lookup
 * of an integer or a float: 28 packages; 280, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, pipe } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, recordsClassOf, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside.
 */
const recorded: readonly Signature[] = known.map(({ signature }) => signature);

/**
 * The ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The item resource type.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * The names a test's outcome processing reads, each with what it names: the item ref's mapped `M`;
 * its item's declarations ({@link itemDeclarations}): a single integer outcome `O`, a response `R`,
 * a single float outcome `F`, an outcome `U` of no cardinality and no base type, and a multiple
 * integer template `T`; the test's own single float outcome `SCORE`; its item's built-ins
 * `numAttempts` (a response), `completionStatus` (an outcome) and `QTI_CONTEXT` (a context
 * variable), the section's and the test's own `duration` (a response); and a name nothing declares,
 * unprefixed and through the item ref (information model §2.2.2, §2.2.2.1, §7.48; spec readings
 * 29, 48 and 86).
 */
const names = [
  { name: "ref.M", what: "mapped" },
  { name: "ref.O", what: "declared outcome" },
  { name: "ref.R", what: "declared response" },
  { name: "ref.F", what: "declared float outcome" },
  { name: "ref.U", what: "declared untyped outcome" },
  { name: "ref.T", what: "declared multiple template" },
  { name: "SCORE", what: "the test's float outcome" },
  { name: "ref.numAttempts", what: "item built-in response" },
  { name: "ref.completionStatus", what: "item built-in outcome" },
  { name: "ref.QTI_CONTEXT", what: "item built-in context" },
  { name: "first.duration", what: "section built-in" },
  { name: "duration", what: "test built-in" },
  { name: "ref.NOPE", what: "nothing through the item ref" },
  { name: "NOPE", what: "nothing" },
] as const;

/**
 * The ways the test's outcome processing reads a name: a variable, which names a variable of any
 * kind; a correct, which names a response alone (§7.10.1); and a random integer's `max`, in place
 * of a literal, which a single integer outcome or template may stand for (P24, line 9889 of
 * `info301.txt`).
 */
const readers = [
  { expression: (name: string) => `<qti-variable identifier="${name}"/>`, reader: "variable" },
  { expression: (name: string) => `<qti-correct identifier="${name}"/>`, reader: "correct" },
  {
    expression: (name: string) => `<qti-random-integer min="0" max="${name}"/>`,
    reader: "stand-in",
  },
] as const;

/**
 * The variable mappings on the item ref: none, or `M` mapped from the item's outcome `O`, its
 * response `R`, its float outcome `F`, its template `T`, or `X`, which it declares nothing under.
 */
const mappings = ["none", "O", "R", "F", "T", "X"] as const;

/**
 * The declarations of the item a test's item ref names, in the order its content model takes them.
 */
const itemDeclarations = [
  `<qti-response-declaration identifier="R" cardinality="single" base-type="identifier"/>`,
  `<qti-outcome-declaration identifier="O" cardinality="single" base-type="integer"/>`,
  `<qti-outcome-declaration identifier="F" cardinality="single" base-type="float"/>`,
  `<qti-outcome-declaration identifier="U"/>`,
  `<qti-template-declaration identifier="T" cardinality="multiple" base-type="integer"/>`,
].join("");

/**
 * What a declaration an item's reference names holds: none of its tables, a mapping, an area
 * mapping, a match table or an interpolation table.
 */
const heldTables = [
  { held: "no table", text: "" },
  {
    held: "a mapping",
    text: `<qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>`,
  },
  {
    held: "an area mapping",
    text: `<qti-area-mapping default-value="0"><qti-area-map-entry shape="circle" coords="1,1,1" mapped-value="1"/></qti-area-mapping>`,
  },
  {
    held: "a match table",
    text: `<qti-match-table><qti-match-table-entry source-value="1" target-value="2"/></qti-match-table>`,
  },
  {
    held: "an interpolation table",
    text: `<qti-interpolation-table><qti-interpolation-table-entry source-value="1" target-value="2"/></qti-interpolation-table>`,
  },
] as const;

/**
 * The item references that claim a table: a map response, of a response's mapping; a map response
 * point, of a point response's area mapping; and a lookup, of an outcome's match or interpolation
 * table (§2.11.3.29, §2.11.3.30, §2.5.1.4), each with the declaration its `V` is.
 */
const claimers = [
  {
    declaration: `<qti-response-declaration identifier="V" cardinality="single" base-type="identifier">`,
    end: "</qti-response-declaration>",
    held: ["integer"],
    reader: "map response",
    rule: (name: string) =>
      `<qti-set-outcome-value identifier="SCORE"><qti-map-response identifier="${name}"/></qti-set-outcome-value>`,
  },
  {
    declaration: `<qti-response-declaration identifier="V" cardinality="single" base-type="point">`,
    end: "</qti-response-declaration>",
    held: ["integer"],
    reader: "map response point",
    rule: (name: string) =>
      `<qti-set-outcome-value identifier="SCORE"><qti-map-response-point identifier="${name}"/></qti-set-outcome-value>`,
  },
  {
    declaration: `<qti-outcome-declaration identifier="V" cardinality="single" base-type="float">`,
    end: "</qti-outcome-declaration>",
    held: ["integer", "float"],
    reader: "lookup",
    rule: (name: string, held: string) =>
      `<qti-lookup-outcome-value identifier="${name}"><qti-base-value base-type="${held}">1</qti-base-value></qti-lookup-outcome-value>`,
  },
] as const;

/**
 * What an item's claiming reference names: its declaration `V`, holding each table state; the
 * built-in `numAttempts`; or `NOPE`, which nothing declares.
 */
const targets = [
  ...heldTables.map(({ held, text }) => ({ name: "V", table: text, target: `V holding ${held}` })),
  { name: "numAttempts", table: "", target: "the built-in numAttempts" },
  { name: "NOPE", table: "", target: "nothing" },
] as const;

/**
 * Every case of the box: a test's reading, or an item's table claim.
 */
const cases = [
  ...names.flatMap((named) =>
    readers.flatMap((read) =>
      mappings.map((mapping) => ({ kind: "reading" as const, mapping, named, read })),
    ),
  ),
  ...claimers.flatMap((claimer) =>
    targets.flatMap((target) =>
      claimer.held.map((held) => ({ claimer, held, kind: "claim" as const, target })),
    ),
  ),
];

/**
 * A case of the box.
 */
type Case = (typeof cases)[number];

/**
 * Name a case.
 *
 * @param held - The case.
 * @returns Its name.
 */
const nameOf = (held: Case): string =>
  held.kind === "reading"
    ? `a ${held.read.reader} reading ${held.named.name} (${held.named.what}), mapping ${held.mapping}`
    : `a ${held.claimer.reader} naming ${held.target.target}${held.claimer.held.length > 1 ? `, of a ${held.held}` : ""}`;

/**
 * Write an XML document: its declaration, then its text.
 *
 * @param text - The document's root element.
 * @returns The document's bytes.
 */
const xml = (text: string): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>\n${text}\n`);

/**
 * Write a manifest listing each document once, under its resource type.
 *
 * @param resources - Each document's path and type.
 * @returns The manifest's bytes.
 */
const manifestOf = (resources: readonly (readonly [path: string, type: string])[]): Uint8Array =>
  xml(
    `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${resources
      .map(
        ([path, type], at) =>
          `<resource identifier="R${String(at)}" type="${type}" href="${path}"><file href="${path}"/></resource>`,
      )
      .join("")}</resources></manifest>`,
  );

/**
 * Write an item: its declarations, a float outcome `SCORE` among them, and its response processing.
 *
 * @param declarations - Its declarations, responses first.
 * @param processing - Its response processing's rules, or none.
 * @returns The item's bytes.
 */
const itemOf = (declarations: string, processing: string): Uint8Array =>
  xml(
    `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" adaptive="false" time-dependent="false">${declarations}<qti-item-body><p>An item.</p></qti-item-body>${processing === "" ? "" : `<qti-response-processing>${processing}</qti-response-processing>`}</qti-assessment-item>`,
  );

/**
 * Write a case's package: a test whose item ref maps the case's mapping and whose outcome
 * processing reads the case's name, over an item that declares {@link itemDeclarations}; or an
 * item whose response processing claims a table of what it names.
 *
 * @param held - The case.
 * @returns Its entries.
 */
const packageOf = (held: Case): PackageEntries => {
  if (held.kind === "claim") {
    const { claimer, target } = held;

    return new Map([
      ["imsmanifest.xml", manifestOf([["item.xml", itemType]])],
      [
        "item.xml",
        itemOf(
          `${claimer.declaration}${target.table}${claimer.end}<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
          claimer.rule(target.name, held.held),
        ),
      ],
    ]);
  }

  const mapping =
    held.mapping === "none"
      ? ""
      : `<qti-variable-mapping source-identifier="${held.mapping}" target-identifier="M"/>`;
  const test = xml(
    `<qti-assessment-test xmlns="${asi}" identifier="test" title="Test"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-test-part identifier="part" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="first" title="First" visible="true"><qti-assessment-item-ref identifier="ref" href="item.xml">${mapping}</qti-assessment-item-ref></qti-assessment-section></qti-test-part><qti-outcome-processing><qti-outcome-condition><qti-outcome-if><qti-is-null>${held.read.expression(held.named.name)}</qti-is-null><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-outcome-if></qti-outcome-condition></qti-outcome-processing></qti-assessment-test>`,
  );

  return new Map([
    [
      "imsmanifest.xml",
      manifestOf([
        ["test.xml", "imsqti_test_xmlv3p0"],
        ["item.xml", itemType],
      ]),
    ],
    ["test.xml", test],
    ["item.xml", itemOf(itemDeclarations, "")],
  ]);
};

/**
 * A feature a case notes: what its reading names and how, its mapping, or what its claim names
 * and by which reference.
 */
type Noted =
  | `claim ${(typeof claimers)[number]["reader"]}`
  | `mapping ${(typeof mappings)[number]}`
  | `named ${(typeof names)[number]["what"]}`
  | `reader ${(typeof readers)[number]["reader"]}`
  | `target ${(typeof targets)[number]["target"]}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "a reference that names no declaration, and one that claims no table",
  (it) => {
    it.effect(
      "holds no declaration row and no table claim, and is judged alike on the import's rows and in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* readingDeclarationRuns() {
            const directory = yield* scratchDirectory("reading-declarations-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "a test's variable, correct or random integer's max reading the item ref's mapped M, its item's declared O, R, F, U or T, the test's SCORE, its built-ins numAttempts, completionStatus or QTI_CONTEXT, the section's or the test's duration, or nothing, beside no mapping or one from O, R, F, T or an undeclared X; and an item's map response, map response point or lookup naming a declaration that holds no table, a mapping, an area mapping, a match table or an interpolation table, a built-in, or nothing",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Noted>(
                  pipe(
                    names,
                    Arr.map(({ what }): Noted => `named ${what}`),
                    Arr.appendAll([
                      ...readers.map(({ reader }): Noted => `reader ${reader}`),
                      ...mappings.map((mapping): Noted => `mapping ${mapping}`),
                      ...claimers.map(({ reader }): Noted => `claim ${reader}`),
                      ...targets.map(({ target }): Noted => `target ${target}`),
                    ]),
                  ),
                ),
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
                suite: "pantry/reading-declarations",
              },
              (at: number, c) =>
                Effect.gen(function* readingDeclarationCase() {
                  const held = cases[at];
                  assert.isDefined(held, `no case ${String(at)}`);
                  if (held === undefined) {
                    return;
                  }

                  if (held.kind === "reading") {
                    c.note(`named ${held.named.what}`);
                    c.note(`reader ${held.read.reader}`);
                    c.note(`mapping ${held.mapping}`);
                  } else {
                    c.note(`claim ${held.claimer.reader}`);
                    c.note(`target ${held.target.target}`);
                  }

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(held)), bench, at);

                  assert.deepStrictEqual(
                    judged.disagreements
                      .filter((disagreement) => !recordsClassOf(recorded, disagreement))
                      .map(shownDisagreement),
                    [],
                    `${nameOf(held)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
      600_000,
    );
  },
);
