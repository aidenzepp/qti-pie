/**
 * A reference to a declaration whose cardinality spells nothing resolves to it (spec reading 159):
 * a reference by name resolves to every declaration whose identifier names something, through
 * `declarationIdentifierRef`, whatever its `cardinality` spells, so every law over the reference
 * that reads the variable's name and kind judges it as any other, while each law that reads the
 * variable's cardinality ("Feedback outcome type", "Template default type", "Reference type" and a
 * variable reference's type) reads a row of the reference's own copied from
 * `DeclarationCardinality`, which it has only where the declaration has one, and judges nothing
 * where it has none: AL3 or the declaration's value domain refuses the attribute alone (spec
 * reading 158). The import resolved a name through `DeclarationName` before, which such a
 * declaration does not have, so it wrote no row of a reference to it, breaking "E1 derived"'s
 * copy of the attribute, and resolved a test's reading, template default and variable mapping to
 * nothing, beside the AL3 or value domain the law oracle alone raised; and the oracle judged no
 * half of "Feedback outcome type" and "Template default type" of such a declaration.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`). "Choice not variable", a
 * check over counts the database draws, which the host does not judge, is held apart: the law
 * oracle's verdict against the schema's statement restated over the import's rows, its
 * declarations counted from the relation `declarationNameFamily` counts.
 *
 * Bound: a declaration `V` referred to each of {@link references}' sixteen ways, its cardinality
 * each of {@link cardinalities}, of the kind the reference may name or another, its base type the
 * one the reference reads, another or unwritten: 16 × 5 × 2 × 3 = 480 packages, exhausted; and
 * `V`, its cardinality each of five, an outcome or a template, beside a choice named `V` or `W`:
 * 20 packages.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { declarationNameFamily } from "#pantry/qti/interactions.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement, signatureOf } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside.
 */
const recorded: ReadonlySet<string> = new Set(Object.keys(known));

/**
 * A declaration kind, by the element's name between `qti-` and `-declaration`.
 */
type Kind = "context" | "outcome" | "response" | "template";

/**
 * The declaration kinds in the order an item's and a test's content model takes them.
 */
const kindOrder: readonly Kind[] = ["context", "response", "outcome", "template"];

/**
 * The ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Where a reference stands: in an item's body, its template or response processing, or a fragment
 * its body includes; or in a test, in an item ref naming the item that declares `V`, or in its
 * outcome processing, naming the item's `V` through the item ref or the test's own.
 */
interface Site {
  readonly body?: string;
  readonly fragment?: string;
  readonly itemRef?: string;
  readonly outcomeProcessing?: string;
  readonly responseProcessing?: string;
  readonly templateProcessing?: string;
  readonly testDeclares?: true;
}

/**
 * One way of referring to `V`: its name, where it stands, the declaration kind it may name and one
 * it may not (or another it may, where it may name every kind), and the base type it reads.
 */
interface Reference {
  readonly baseType: string;
  readonly name: string;
  readonly right: Kind;
  readonly site: Site;
  readonly wrong: Kind;
}

/**
 * A feedback element that shows on `V`.
 */
const feedback = `<p><qti-feedback-inline outcome-identifier="V" identifier="SHOWN" show-hide="show">Shown.</qti-feedback-inline></p>`;

/**
 * A response condition that reads an expression.
 *
 * @param expression - The expression.
 * @returns The condition.
 */
const conditionOn = (expression: string): string =>
  `<qti-response-condition><qti-response-if><qti-is-null>${expression}</qti-is-null><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>`;

/**
 * The sixteen ways the box refers to `V`: an item's feedback element, template element, printed
 * variable by its name and by its `base`, and a portable custom interaction's context variable
 * (`FeedbackRef`, `TemplateRef`, `PrintedVariableRef`, `ContextRef`); its response processing's
 * variable, outcome setter, lookup, map response and correct, and its template processing's
 * template setter (`VariableRef`, `PlacedVariableRef`); a feedback element of a fragment it
 * includes (`SectionFeedbackRef`); and a test's template default and variable mapping on its item
 * ref (`TemplateDefaultTarget`, `MappingSourceDeclaration`), its outcome processing's prefixed
 * reading of the item's `V` (`Reading`, `ReadingCardinality`), and its own `V` set unsplit
 * (`VariableLookup`).
 */
const references: readonly Reference[] = [
  {
    baseType: "identifier",
    name: "feedback",
    right: "outcome",
    site: { body: feedback },
    wrong: "template",
  },
  {
    baseType: "identifier",
    name: "template element",
    right: "template",
    site: {
      body: `<p><qti-template-inline template-identifier="V" identifier="SHOWN" show-hide="show">Shown.</qti-template-inline></p>`,
    },
    wrong: "outcome",
  },
  {
    baseType: "float",
    name: "printed variable",
    right: "outcome",
    site: { body: `<p><qti-printed-variable identifier="V"/></p>` },
    wrong: "response",
  },
  {
    baseType: "integer",
    name: "printed base",
    right: "template",
    site: { body: `<p><qti-printed-variable identifier="SCORE" base="V"/></p>` },
    wrong: "response",
  },
  {
    baseType: "integer",
    name: "context variable",
    right: "context",
    site: {
      body: `<qti-portable-custom-interaction response-identifier="WIDGET" custom-interaction-type-identifier="urn:example:portable" module="portable"><qti-interaction-markup><div>A widget.</div></qti-interaction-markup><qti-context-variable identifier="V"/></qti-portable-custom-interaction>`,
    },
    wrong: "outcome",
  },
  {
    baseType: "float",
    name: "variable",
    right: "outcome",
    site: { responseProcessing: conditionOn(`<qti-variable identifier="V"/>`) },
    wrong: "response",
  },
  {
    baseType: "float",
    name: "outcome setter",
    right: "outcome",
    site: {
      responseProcessing: `<qti-set-outcome-value identifier="V"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>`,
    },
    wrong: "response",
  },
  {
    baseType: "integer",
    name: "template setter",
    right: "template",
    site: {
      templateProcessing: `<qti-set-template-value identifier="V"><qti-base-value base-type="integer">1</qti-base-value></qti-set-template-value>`,
    },
    wrong: "outcome",
  },
  {
    baseType: "identifier",
    name: "lookup",
    right: "outcome",
    site: {
      responseProcessing: `<qti-lookup-outcome-value identifier="V"><qti-base-value base-type="integer">1</qti-base-value></qti-lookup-outcome-value>`,
    },
    wrong: "response",
  },
  {
    baseType: "identifier",
    name: "map response",
    right: "response",
    site: {
      responseProcessing: `<qti-set-outcome-value identifier="SCORE"><qti-map-response identifier="V"/></qti-set-outcome-value>`,
    },
    wrong: "outcome",
  },
  {
    baseType: "identifier",
    name: "correct",
    right: "response",
    site: { responseProcessing: conditionOn(`<qti-correct identifier="V"/>`) },
    wrong: "outcome",
  },
  {
    baseType: "identifier",
    name: "included feedback",
    right: "outcome",
    site: { body: `<xi:include href="fragment.xml"/>`, fragment: feedback },
    wrong: "template",
  },
  {
    baseType: "identifier",
    name: "template default",
    right: "template",
    site: {
      itemRef: `<qti-template-default template-identifier="V"><qti-base-value base-type="identifier">A</qti-base-value></qti-template-default>`,
    },
    wrong: "outcome",
  },
  {
    baseType: "float",
    name: "variable mapping",
    right: "outcome",
    site: { itemRef: `<qti-variable-mapping source-identifier="V" target-identifier="MAPPED"/>` },
    wrong: "response",
  },
  {
    baseType: "float",
    name: "prefixed reading",
    right: "outcome",
    site: {
      outcomeProcessing: `<qti-set-outcome-value identifier="SCORE"><qti-variable identifier="ref.V"/></qti-set-outcome-value>`,
    },
    wrong: "response",
  },
  {
    baseType: "float",
    name: "test's own",
    right: "outcome",
    site: {
      outcomeProcessing: `<qti-set-outcome-value identifier="V"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>`,
      testDeclares: true,
    },
    wrong: "context",
  },
];

/**
 * What `V`'s cardinality is: unwritten, written as no code of its enumeration, or a code.
 */
type Typing = "a code" | "no code" | "unwritten";

/**
 * The cardinalities `V` writes: none; `many`, which spells no code; and `single`, `multiple` and
 * `record`, each in its start tag.
 */
const cardinalities: readonly { readonly attribute: string; readonly typing: Typing }[] = [
  { attribute: "", typing: "unwritten" },
  { attribute: ` cardinality="many"`, typing: "no code" },
  { attribute: ` cardinality="single"`, typing: "a code" },
  { attribute: ` cardinality="multiple"`, typing: "a code" },
  { attribute: ` cardinality="record"`, typing: "a code" },
];

/**
 * The base types `V` writes, against the one the reference reads: that one, another (`float`, or
 * `identifier` for a reference that reads `float`), or none.
 */
const typings = ["read", "other", "unwritten"] as const;

/**
 * Every case: a reference, `V`'s cardinality, whether `V` is of the kind the reference may name,
 * and its base type.
 */
const cases = references.flatMap((reference) =>
  cardinalities.flatMap((cardinality) =>
    (["right", "wrong"] as const).flatMap((fit) =>
      typings.map((typing) => ({ cardinality, fit, reference, typing })),
    ),
  ),
);

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
const nameOf = ({ cardinality, fit, reference, typing }: Case): string =>
  `${reference.name}, V ${fit === "right" ? reference.right : reference.wrong}${cardinality.attribute || " no cardinality"}, base type ${typing}`;

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
 * Write declarations in the order the content model takes their kinds.
 *
 * @param declared - Each declaration's kind and text.
 * @returns The declarations.
 */
const declarationsOf = (declared: readonly (readonly [Kind, string])[]): string =>
  kindOrder
    .flatMap((kind) => declared.filter(([held]) => held === kind).map(([, text]) => text))
    .join("");

/**
 * The table `V` holds for the reference that reads one, where its kind holds it, by the reference's
 * name and the kind: a map response's mapping, a response's, and a lookup's match table, an
 * outcome's.
 */
const tables: ReadonlyMap<string, string> = new Map([
  [
    "map response response",
    `<qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>`,
  ],
  [
    "lookup outcome",
    `<qti-match-table><qti-match-table-entry source-value="1" target-value="A"/></qti-match-table>`,
  ],
]);

/**
 * Write `V`'s declaration: of the case's kind, cardinality and base type, holding the table its
 * reference reads where its kind holds one ({@link tables}).
 *
 * @param held - The case.
 * @returns Its kind and its text.
 */
const declarationOf = ({ cardinality, fit, reference, typing }: Case): readonly [Kind, string] => {
  const kind = fit === "right" ? reference.right : reference.wrong;
  const other = reference.baseType === "float" ? "identifier" : "float";
  const baseType = {
    other: ` base-type="${other}"`,
    read: ` base-type="${reference.baseType}"`,
    unwritten: "",
  }[typing];
  const table = tables.get(`${reference.name} ${kind}`) ?? "";

  return [
    kind,
    `<qti-${kind}-declaration identifier="V"${cardinality.attribute}${baseType}>${table}</qti-${kind}-declaration>`,
  ];
};

/**
 * Write an item: a string response `WIDGET`, a float outcome `SCORE`, the declarations given, and
 * the site's template processing, body and response processing.
 *
 * @param declared - Its other declarations.
 * @param site - The site.
 * @returns The item's bytes.
 */
const itemOf = (declared: readonly (readonly [Kind, string])[], site: Site): Uint8Array =>
  xml(
    `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="item" title="Item" adaptive="false" time-dependent="false">${declarationsOf(
      [
        [
          "response",
          `<qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/>`,
        ],
        [
          "outcome",
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
        ],
        ...declared,
      ],
    )}${site.templateProcessing === undefined ? "" : `<qti-template-processing>${site.templateProcessing}</qti-template-processing>`}<qti-item-body>${site.body ?? "<p>An item.</p>"}</qti-item-body>${site.responseProcessing === undefined ? "" : `<qti-response-processing>${site.responseProcessing}</qti-response-processing>`}</qti-assessment-item>`,
  );

/**
 * The item resource type.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * Write a case's package: an item that declares `V` and refers to it, with the fragment it
 * includes where it includes one; or a test whose item ref places that item, declaring `V` itself
 * where its own outcome processing sets it.
 *
 * @param held - The case.
 * @returns Its entries.
 */
const packageOf = (held: Case): PackageEntries => {
  const { site } = held.reference;
  const declared = declarationOf(held);
  const testing = site.itemRef !== undefined || site.outcomeProcessing !== undefined;
  const item = itemOf(site.testDeclares === true ? [] : [declared], site);
  if (!testing) {
    return new Map([
      [
        "imsmanifest.xml",
        manifestOf([
          ["item.xml", itemType],
          ...(site.fragment === undefined
            ? []
            : [["fragment.xml", "imsqti_fragment_xmlv3p0"] as const]),
        ]),
      ],
      ["item.xml", item],
      ...(site.fragment === undefined
        ? []
        : [["fragment.xml", xml(`<div xmlns="${asi}">${site.fragment}</div>`)] as const]),
    ]);
  }

  const test = xml(
    `<qti-assessment-test xmlns="${asi}" identifier="test" title="Test">${declarationsOf([
      [
        "outcome",
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      ],
      ...(site.testDeclares === true ? [declared] : []),
    ])}<qti-test-part identifier="part" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="first" title="First" visible="true"><qti-assessment-item-ref identifier="ref" href="item.xml">${site.itemRef ?? ""}</qti-assessment-item-ref></qti-assessment-section></qti-test-part>${site.outcomeProcessing === undefined ? "" : `<qti-outcome-processing>${site.outcomeProcessing}</qti-outcome-processing>`}</qti-assessment-test>`,
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
    ["item.xml", item],
  ]);
};

/**
 * A feature a case notes: its cardinality's typing, its reference, and whether `V` is of the kind
 * the reference may name.
 */
type Noted = `cardinality ${Typing}` | `kind ${"right" | "wrong"}` | `reference ${string}`;

/**
 * The choice cases: `V`, an outcome or a template, its cardinality each of
 * {@link cardinalities}, beside a choice of the same name or of another.
 */
const choiceCases = cardinalities.flatMap((cardinality) =>
  (["outcome", "template"] as const).flatMap((kind) =>
    (["V", "W"] as const).map((chosen) => ({ cardinality, chosen, kind })),
  ),
);

/**
 * Write a choice case's package: an item that declares `V` and an identifier response `CHOSEN`,
 * which a choice interaction binds, its one choice named `V` or `W`.
 *
 * @param held - The case.
 * @returns Its entries.
 */
const choicePackageOf = (held: (typeof choiceCases)[number]): PackageEntries =>
  new Map([
    ["imsmanifest.xml", manifestOf([["item.xml", itemType]])],
    [
      "item.xml",
      itemOf(
        [
          [
            "response",
            `<qti-response-declaration identifier="CHOSEN" cardinality="single" base-type="identifier"/>`,
          ],
          [
            held.kind,
            `<qti-${held.kind}-declaration identifier="V"${held.cardinality.attribute} base-type="identifier"/>`,
          ],
        ],
        {
          body: `<qti-choice-interaction response-identifier="CHOSEN" max-choices="1"><qti-simple-choice identifier="${held.chosen}">A</qti-simple-choice></qti-choice-interaction>`,
        },
      ),
    ],
  ]);

/**
 * The relation whose rows `ChoiceVariableName.declarations` counts, and the fields that group them
 * under their `ChoiceVariableName` row, its owner's `document` and `identifier`, as the schema
 * states `declarationNameFamily`.
 */
const declarationCount = {
  fields: declarationNameFamily.family.terms,
  relation: declarationNameFamily.family.source.name,
};

/**
 * A row of a document's name: its document and the name, which a choice's, a declaration's and a
 * `ChoiceVariableName` row's fields hold alike.
 */
interface NameRow {
  readonly document: string;
  readonly identifier: string;
}

layer(NodeServices.layer, { excludeTestServices: true })(
  "a reference to a declaration whose cardinality spells nothing",
  (it) => {
    it.effect(
      "resolves to it, is judged by no law over a cardinality, and is judged alike on the import's rows and in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* referencedCardinalityRuns() {
            const directory = yield* scratchDirectory("referenced-cardinality-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "a declaration V, its cardinality unwritten, many, single, multiple or record, of the kind its reference may name or another, its base type the one its reference reads, another or unwritten, referred to by an item's feedback, template element, printed variable, printed base, context variable, variable, outcome setter, template setter, lookup, map response, correct or included feedback, or a test's template default, variable mapping, prefixed reading or own setter",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Noted>([
                  "cardinality a code",
                  "cardinality no code",
                  "cardinality unwritten",
                  "kind right",
                  "kind wrong",
                  ...references.map(({ name }): Noted => `reference ${name}`),
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
                suite: "pantry/referenced-cardinality",
              },
              (at: number, c) =>
                Effect.gen(function* referencedCardinalityCase() {
                  const held = cases[at];
                  assert.isDefined(held, `no case ${String(at)}`);
                  if (held === undefined) {
                    return;
                  }

                  c.note(`cardinality ${held.cardinality.typing}`);
                  c.note(`kind ${held.fit}`);
                  c.note(`reference ${held.reference.name}`);

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
      600_000,
    );

    it.effect(
      "holds a choice named as a declaration to Choice not variable whatever the declaration's cardinality spells, as the law oracle does",
      () =>
        // Oracle: the law oracle's "Choice not variable" (reading 104), against the schema's
        // statement restated over the import's rows: a name a choice bears breaks it where the
        // relation `declarationNameFamily` counts holds a row of the name in the choice's
        // document, the count `ChoiceVariableName.declarations` draws; and every such row has its
        // owner, the `ChoiceVariableName` row of its name, which the family's owner axis asks of
        // the import's rows and the host does not judge.
        // Bound: V, an outcome or a template, its cardinality unwritten, many, single, multiple
        // or record, beside a choice named V or W: 20 packages.
        Effect.gen(function* choiceNames() {
          for (const held of choiceCases) {
            const label = `V ${held.kind}${held.cardinality.attribute || " no cardinality"}, a choice named ${held.chosen}`;
            const dir = yield* scopedPackage(choicePackageOf(held));
            const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
            assert.strictEqual(judgment._tag, "Judged", label);

            const oracle =
              judgment._tag === "Judged" &&
              judgment.breaches.some(({ law }) => law === "Choice not variable");
            const { inputs } = yield* readProgram(dir);
            // The relations that hold a declared name, of which the family counts one.
            const named = new Map<string, Iterable<NameRow>>([
              ["DeclarationIdentifier", inputs.DeclarationIdentifier.values()],
              ["DeclarationName", inputs.DeclarationName.values()],
            ]);
            const counted = named.get(declarationCount.relation);
            assert.isDefined(
              counted,
              `declarationNameFamily counts ${declarationCount.relation}, which holds no declared name`,
            );

            const keyOf = (row: NameRow) =>
              Formatter.format(declarationCount.fields.map((field) => row[field]));
            const declared = new Set([...(counted ?? [])].map(keyOf));
            const owners = new Set([...inputs.ChoiceVariableName.values()].map(keyOf));
            const restated = [...inputs.Choice.values()].some(({ document, identifier }) =>
              declared.has(keyOf({ document, identifier })),
            );

            assert.strictEqual(
              oracle,
              held.chosen === "V",
              `${label}: the oracle's Choice not variable`,
            );
            assert.strictEqual(
              restated,
              oracle,
              `${label}: the schema's statement over the import's rows, counting ${declarationCount.relation}`,
            );
            assert.deepStrictEqual(
              [...declared].filter((name) => !owners.has(name)),
              [],
              `${label}: each counted ${declarationCount.relation} row's ChoiceVariableName owner`,
            );
          }
        }).pipe(Effect.scoped),
    );
  },
);
