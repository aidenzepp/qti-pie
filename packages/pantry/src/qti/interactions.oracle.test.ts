/**
 * The O3 overlays' free tests: their statements are composed into `Qti`, each check is named by an
 * oracle law, and the closed data the laws read is the grammar's: the built-in variables, the
 * content references, the last-slot rules, the count pairs and the attributes copied.
 *
 * The database tests (`interactions.db.test.ts`) judge the laws through PostgreSQL; the builder's
 * tests (`#pantry/import/overlays/interactions.oracle.test.ts`) check its rows.
 */
import type { Statement } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { inject } from "vitest";
import {
  BindingFit,
  BuiltInVariable,
  ChoiceBound,
  ContentReference,
  grammar,
  interactionKinds,
  RecordBindingFit,
  versions,
} from "#pantry/grammar/install.ts";
import {
  anyTypeKinds,
  builtIns,
  cardinalityKinds,
  choiceKinds,
  countDefault,
  hotspotKinds,
  interactionLaws,
  interactionRelations,
  readAttributes,
  references,
} from "#pantry/qti/interactions.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { readPackage } from "#pantry/package/read.ts";
import { contentLawOf, judge, lawNames, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import {
  base,
  breachesOf,
  edit,
  item,
  itemResource,
  judged,
  manifestOf,
  shown,
} from "#pantry/test/probe.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

/**
 * The fixtures the global setup materializes: `simple` among them.
 */
const fixtures = inject("fixtures");

/**
 * The law oracle's tables, derived once.
 */
const oracleLaws = lawsOf(grammar);

/**
 * The law each content reference relation states for a name that resolves to no allowed variable,
 * by the relation's key in `references`.
 */
const referenceLaws = {
  context: "Context variable reference",
  feedback: "Feedback reference",
  printed: "Printed variable reference",
  template: "Template reference",
  variable: "Printed variable reference",
} as const satisfies Readonly<Record<keyof typeof references, string>>;

/**
 * The content reference relations, by their keys in `references`.
 */
const referenceRelations = [
  "context",
  "feedback",
  "printed",
  "template",
  "variable",
] as const satisfies readonly (keyof typeof references)[];

describe("qti/interactions.ts, declared", () => {
  it("is composed into Qti: every O3 overlay a member under its name, every statement once", () => {
    // Oracle: grizzle's schema builder, which built `Qti` from these statements when
    // `#pantry/qti/schema.ts` loaded and refuses a statement over a relation it does not hold.
    for (const relation of Object.values(interactionRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }

    const statements: readonly Statement[] = Qti.statements;
    assert.strictEqual(new Set(interactionLaws).size, interactionLaws.length);
    for (const statement of interactionLaws) {
      assert.strictEqual(statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = interactionLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.isDefined(ruleOf(law), name);
      }
    }

    assert.deepStrictEqual([...new Set(named)].toSorted(), [
      "Aria value range",
      "Binding declared",
      "BindingFit",
      "Choice bounds",
      "Choice not variable",
      "Context variable reference",
      "Custom interaction version",
      "E1 derived",
      "Feedback outcome type",
      "Feedback reference",
      "Graphic gap match default hotspot",
      "PCI module source",
      "Printed variable reference",
      "Slider bounds",
      "Template reference",
      "Template variable type",
      "default hotspot last slot",
    ]);
  });
});

describe("qti/interactions.ts, the closed data its laws read", () => {
  it("types every built-in variable BuiltInVariable holds, under the declaration kind it stands as", () => {
    // Oracle: the closed relation itself, `BuiltInVariable`'s rows.
    assert.deepStrictEqual(
      builtIns.map(({ declaration, variable }) => `${variable} ${declaration}`).toSorted(),
      BuiltInVariable.rows
        .map(({ declaration, variable }) => `${variable} ${declaration}`)
        .toSorted(),
    );
  });

  it("holds every ContentReference row in exactly one reference relation, the one whose law the oracle names for it", () => {
    // Oracle: the oracle's `contentLawOf`, the law a reference by (kind, attribute) breaks.
    for (const { attribute, kind } of ContentReference.rows) {
      const holders = referenceRelations.filter(
        (relation) =>
          references[relation].attributes.some((name) => name === attribute) &&
          references[relation].kinds.some((holder) => holder === kind),
      );

      assert.strictEqual(holders.length, 1, `${kind} ${attribute}`);
      for (const relation of holders) {
        assert.isTrue(
          Option.contains(contentLawOf(kind, attribute), referenceLaws[relation]),
          `${kind} ${attribute}`,
        );
      }
    }
  });

  it("reads every LastWhere rule over a shape of a hotspot kind under interactions, so Hotspot states each", () => {
    // Oracle: the grammar's `lastWhere` rules, which the default-hotspot check is built from.
    assert.isNotEmpty(grammar.lastWhere);
    for (const { attribute, kind, parents } of grammar.lastWhere) {
      assert.strictEqual(attribute, "shape", kind);
      assert.include(hotspotKinds, kind);
      for (const parent of parents) {
        assert.include(interactionKinds, parent, kind);
      }
    }
  });

  it("holds every ChoiceBound kind an interaction or a choice, so a Binding or a Choice row brings its CountBound", () => {
    // Oracle: the grammar's interaction roster and `choiceKinds`, against `ChoiceBound`'s rows.
    for (const { kind } of ChoiceBound.rows) {
      assert.isTrue(
        interactionKinds.includes(kind) || choiceKinds.some((choice) => choice === kind),
        kind,
      );
    }
  });

  it("reads reading 92's cardinality kinds' most count with an XSD default in every version, so the law reads a known most", () => {
    // Oracle: the inventory leaf's attribute declarations, by way of `countDefault`, and
    // `ChoiceBound`'s max attributes.
    for (const kind of cardinalityKinds) {
      const bound = ChoiceBound.rows.find((row) => row.kind === kind);

      assert.isDefined(bound, kind);
      assert.include(["max-choices", "max-associations"], bound?.max, kind);
      for (const version of versions) {
        assert.isTrue(
          Option.isSome(countDefault(version, kind, bound?.max ?? "max-choices")),
          kind,
        );
      }
    }
  });

  it("copies only attributes the inventory declares on each kind they are read on", () => {
    // Oracle: the inventory leaf's attribute declarations.
    const declared = new Set(attributeDeclarations.map(({ kind, name }) => `${kind} ${name}`));
    for (const [name, kinds] of readAttributes) {
      for (const kind of kinds) {
        assert.isTrue(declared.has(`${kind} ${name}`), `${kind} ${name}`);
      }
    }
  });

  it("lets the interactions no fit relation names bind any type, and no other", () => {
    // Oracle: `BindingFit` and `RecordBindingFit`'s rows: the custom and portable custom
    // interactions bind a response of any type (information model §5.36, §5.106).
    assert.deepStrictEqual(
      [...anyTypeKinds].toSorted(),
      ["qti-custom-interaction", "qti-portable-custom-interaction"].toSorted(),
    );
    for (const kind of anyTypeKinds) {
      assert.isFalse(
        BindingFit.rows.some((row) => row.kind === kind),
        kind,
      );
      assert.isFalse(
        RecordBindingFit.rows.some((row) => row.kind === kind),
        kind,
      );
    }
  });
});

/**
 * The `simple` fixture's item, the one document the reading-104 cases edit.
 */
const simpleItem = "choice.xml";

/**
 * A second choice interaction, bound to a declared response of its own, whose one simple choice is
 * named as given: the item-wide scope's case and its control.
 *
 * @param identifier - The simple choice's identifier.
 * @returns The interaction's markup.
 */
const secondInteraction = (identifier: string): string =>
  `<qti-choice-interaction response-identifier="RESPONSE2" max-choices="1"><qti-simple-choice identifier="${identifier}">x</qti-simple-choice></qti-choice-interaction>`;

/**
 * The second interaction's response declaration.
 */
const secondDeclaration =
  '<qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier"/>';

/**
 * The reading-104 cases over the `simple` fixture's item: each edit, written as search and
 * replacement pairs applied in order, and the laws of the two it must break.
 */
const choiceNameCases: readonly {
  readonly breaks: readonly ("Choice identifier key" | "Choice not variable")[];
  readonly edits: readonly (readonly [string, string])[];
  readonly name: string;
}[] = [
  { breaks: [], edits: [], name: "the item as it is" },
  {
    breaks: ["Choice not variable"],
    edits: [['identifier="ChoiceA"', 'identifier="SCORE"']],
    name: "a choice named as the declared SCORE",
  },
  {
    breaks: ["Choice not variable"],
    edits: [['identifier="ChoiceA"', 'identifier=" RESPONSE "']],
    name: "a choice named as the declared RESPONSE, padded",
  },
  {
    breaks: ["Choice not variable"],
    edits: [['identifier="ChoiceA"', 'identifier="numAttempts"']],
    name: "a choice named as the built-in numAttempts",
  },
  {
    breaks: ["Choice identifier key"],
    edits: [['identifier="ChoiceB"', 'identifier="ChoiceA"']],
    name: "two choices of one interaction named ChoiceA",
  },
  {
    breaks: ["Choice identifier key"],
    edits: [
      ["</qti-choice-interaction>", `</qti-choice-interaction>${secondInteraction("ChoiceA")}`],
      ["<qti-item-body>", `${secondDeclaration}<qti-item-body>`],
    ],
    name: "choices of two interactions named ChoiceA",
  },
  {
    breaks: [],
    edits: [
      ["</qti-choice-interaction>", `</qti-choice-interaction>${secondInteraction("ChoiceZ")}`],
      ["<qti-item-body>", `${secondDeclaration}<qti-item-body>`],
    ],
    name: "choices of two interactions named apart",
  },
  {
    breaks: [],
    edits: [
      [
        "</qti-choice-interaction>",
        '</qti-choice-interaction><qti-hottext-interaction response-identifier="RESPONSE2" max-choices="1"><p><qti-hottext identifier="ChoiceA">x</qti-hottext></p></qti-hottext-interaction>',
      ],
      ["<qti-item-body>", `${secondDeclaration}<qti-item-body>`],
    ],
    name: "a hottext and a simple choice named ChoiceA, two classes",
  },
];

describe("qti/interactions.ts, reading 104 by the law oracle", () => {
  it.effect(
    "breaks Choice not variable and Choice identifier key exactly where reading 104 says, over edits of simple's item",
    () =>
      // Oracle: the specification as a checker, reading 104 (§5.132.1, §5.65.1, §7.16, §2.2.2): a
      // choice's identifier names one choice of its class in its document and no item variable,
      // declared or built in; each case's expected laws are read off its edit.
      // Bound: the `simple` fixture as it is and 7 edits of its item: a choice named as a declared
      // outcome, a declared response padded and a built-in, two choices of one interaction and of
      // two named alike, two interactions' choices named apart, and a hottext beside a simple
      // choice of one name.
      Effect.gen(function* choiceNames() {
        const files = yield* readPackage(fixtures.simple);
        for (const { breaks, edits, name } of choiceNameCases) {
          const edited = files.map((file) => {
            if (file.path !== simpleItem) {
              return file;
            }

            let text = new TextDecoder().decode(file.bytes);
            for (const [search, replacement] of edits) {
              assert.include(text, search, `${name}: the item holds ${search}`);
              text = text.replace(search, replacement);
            }

            return { ...file, bytes: new TextEncoder().encode(text) };
          });
          const judgment = yield* judge(edited, grammar, oracleLaws);
          assert.strictEqual(judgment._tag, "Judged", name);

          const found = judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [];
          assert.sameMembers(
            [
              ...new Set(
                found.filter(
                  (law) => law === "Choice identifier key" || law === "Choice not variable",
                ),
              ),
            ],
            [...breaks],
            name,
          );
        }
      }).pipe(Effect.provide(NodeServices.layer)),
  );
});

/**
 * The base item's choice interaction, as written, which the PCI cases replace.
 */
const choiceInteraction = `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`;

/**
 * The element form of a PCI's module: the `qti-interaction-modules` child.
 */
const moduleElement = `<qti-interaction-modules><qti-interaction-module id="m" primary-path="m.js"/></qti-interaction-modules>`;

/**
 * A portable custom interaction of the base item, with or without each form of its module.
 *
 * @param forms - Which forms it writes.
 * @param forms.attribute - Whether it writes `module`.
 * @param forms.element - Whether it writes `qti-interaction-modules`.
 * @returns The interaction's text.
 */
const pciOf = ({
  attribute,
  element,
}: {
  readonly attribute: boolean;
  readonly element: boolean;
}) =>
  `<qti-portable-custom-interaction response-identifier="RESPONSE"${attribute ? ` module="m"` : ""} custom-interaction-type-identifier="t">${element ? moduleElement : ""}<qti-interaction-markup/></qti-portable-custom-interaction>`;

/**
 * The breaches of "PCI module source" in the base item with its choice interaction replaced by a
 * PCI.
 *
 * @param forms - Which forms of its module the PCI writes.
 * @param forms.attribute - Whether it writes `module`.
 * @param forms.element - Whether it writes `qti-interaction-modules`.
 * @returns The breaches.
 */
const pciBreachesOf = (forms: { readonly attribute: boolean; readonly element: boolean }) =>
  Effect.map(
    judged({ ...base, "item.xml": edit(item, choiceInteraction, pciOf(forms)) }),
    (judgment) => breachesOf(judgment).filter(({ law }) => law === "PCI module source"),
  );

describe("qti/interactions.ts, PCI module source", () => {
  it.effect(
    "is broken once by a PCI with neither module form, and by none that writes `module`, `qti-interaction-modules` or both",
    () =>
      // Oracle: the information model's §5.106.2, "If this characteristic is provided the
      // qti-interaction-modules child attribute is not required, if omitted then the modules child
      // element is mandatory" (R10-a), read as a count of the forms each PCI writes, over the four
      // ways a PCI writes them.
      Effect.gen(function* moduleSource() {
        const neither = yield* pciBreachesOf({ attribute: false, element: false });
        assert.lengthOf(neither, 1, shown(neither));
        for (const forms of [
          { attribute: true, element: false },
          { attribute: false, element: true },
          { attribute: true, element: true },
        ]) {
          const held = yield* pciBreachesOf(forms);
          assert.lengthOf(held, 0, shown(held));
        }
      }),
  );

  it("is a check of Interaction under the rule of its own: pci-module-source", () => {
    // Oracle: the oracle's own rule table (`ruleOf`).
    assert.strictEqual(ruleOf("PCI module source"), "pci-module-source");
  });
});

/**
 * The breaches of "Custom interaction version" in the base item with its choice interaction
 * replaced by a custom interaction, under one schema version.
 *
 * @param version - The `schemaversion` the package's manifest declares.
 * @returns The breaches.
 */
const customBreachesOf = (version: string) =>
  Effect.map(
    judged({
      "imsmanifest.xml": manifestOf(itemResource, version),
      "item.xml": edit(
        item,
        choiceInteraction,
        '<qti-custom-interaction response-identifier="RESPONSE"/>',
      ),
    }),
    (judgment) => breachesOf(judgment).filter(({ law }) => law === "Custom interaction version"),
  );

describe("qti/interactions.ts, Custom interaction version", () => {
  it.effect(
    "is broken once by a custom interaction in a 3.0.0 package, and by none in a 3.0.1 one",
    () =>
      // Oracle: the information model's §5.106, "PCIs MUST be used instead of custom interactions
      // (the latter have been deprecated)" in 3.0.0, a sentence the 3.0.1 text drops (R10-b).
      Effect.gen(function* customVersion() {
        const old = yield* customBreachesOf("3.0.0");
        assert.lengthOf(old, 1, shown(old));

        const current = yield* customBreachesOf("3.0.1");
        assert.lengthOf(current, 0, shown(current));
      }),
  );

  it.effect("is not broken by a 3.0.0 package that holds no custom interaction", () =>
    Effect.gen(function* withoutCustom() {
      const breaches = breachesOf(
        yield* judged({ ...base, "imsmanifest.xml": manifestOf(itemResource, "3.0.0") }),
      ).filter(({ law }) => law === "Custom interaction version");
      assert.lengthOf(breaches, 0, shown(breaches));
    }),
  );

  it("is a check of Interaction under the rule admission", () => {
    // Oracle: the oracle's own rule table (`ruleOf`).
    assert.strictEqual(ruleOf("Custom interaction version"), "admission");
  });
});

/**
 * A portable custom interaction that reads one context variable, with the markup it holds; the
 * variable follows the markup, as the content model orders them.
 *
 * @param identifier - The context variable it names.
 * @param markup - What its `qti-interaction-markup` holds, as written.
 * @returns The interaction's text.
 */
const contextPci = (identifier: string, markup = ""): string =>
  `<qti-portable-custom-interaction response-identifier="RESPONSE" module="m" custom-interaction-type-identifier="t"><qti-interaction-modules><qti-interaction-module id="m" primary-path="m.js"/></qti-interaction-modules><qti-interaction-markup>${markup}</qti-interaction-markup><qti-context-variable identifier="${identifier}"/></qti-portable-custom-interaction>`;

/**
 * The laws a package breaches, in the base item with its choice interaction replaced.
 *
 * @param version - The `schemaversion` the package's manifest declares.
 * @param interaction - The text that replaces the choice interaction.
 * @param declarations - Text inserted before the item's first declaration.
 * @returns The distinct names of the laws breached.
 */
const lawsBreachedBy = (version: string, interaction: string, declarations = "") =>
  Effect.map(
    judged({
      "imsmanifest.xml": manifestOf(itemResource, version),
      "item.xml": edit(
        edit(item, choiceInteraction, interaction),
        "<qti-response-declaration",
        `${declarations}<qti-response-declaration`,
      ),
    }),
    (judgment) => [...new Set(breachesOf(judgment).map(({ law }) => law))],
  );

describe("qti/interactions.ts, the context variable and the markup's content", () => {
  it.effect(
    "refuses QTI_CONTEXT undeclared in a 3.0.0 item by Idref target, and admits it in 3.0.1",
    () =>
      // Oracle: the information model's §7.37 and the XSD, a 3.0.0 `qti-context-variable`'s
      // `identifier` is an `xs:IDREF` naming a context declaration, and the 3.0.1 text admits
      // `QTI_CONTEXT` as built in (goal 3.2).
      Effect.gen(function* undeclared() {
        const old = yield* lawsBreachedBy("3.0.0", contextPci("QTI_CONTEXT"));
        assert.include(old, "Idref target", old.join(", "));
        assert.strictEqual(ruleOf("Idref target"), "idref-target");

        const current = yield* lawsBreachedBy("3.0.1", contextPci("QTI_CONTEXT"));
        assert.notInclude(current, "Idref target", current.join(", "));
        assert.notInclude(current, "Context variable reference", current.join(", "));
      }),
  );

  it.effect("admits a 3.0.0 item that declares a record context QTI_CONTEXT and names it", () =>
    Effect.gen(function* declared() {
      const found = yield* lawsBreachedBy(
        "3.0.0",
        contextPci("QTI_CONTEXT"),
        '<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/>',
      );
      assert.notInclude(found, "Idref target", found.join(", "));
      assert.notInclude(found, "Context variable reference", found.join(", "));
    }),
  );

  it.effect("admits a foreign element in a markup's template", () =>
    // Oracle: reading 57 and reading 6, a `template` of the markup holds foreign content, which
    // lax processing does not assess.
    Effect.gen(function* foreignTemplate() {
      const found = yield* lawsBreachedBy(
        "3.0.0",
        contextPci(
          "QTI_CONTEXT",
          '<p>Tap</p><template><x:widget xmlns:x="urn:example:widget" size="3"/></template>',
        ),
        '<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/>',
      );
      assert.deepStrictEqual(found, [], found.join(", "));
    }),
  );

  it.effect(
    "judges a custom interaction by Binding declared, and passes over the choice interaction in its content",
    () =>
      // Oracle: reading 57: a custom interaction's content is lax, and a `qti-choice-interaction`,
      // declared only locally, has no declaration lax processing finds, so the walk passes it over
      // and "Binding declared" does not judge its response (the custom interaction's own binding is
      // judged: the control).
      Effect.gen(function* customContent() {
        const inside = yield* lawsBreachedBy(
          "3.0.1",
          `<qti-custom-interaction response-identifier="RESPONSE">${choiceInteraction.replace(
            'response-identifier="RESPONSE"',
            'response-identifier="NOWHERE"',
          )}</qti-custom-interaction>`,
        );
        assert.notInclude(inside, "Binding declared", inside.join(", "));

        const outside = yield* lawsBreachedBy(
          "3.0.1",
          '<qti-custom-interaction response-identifier="NOWHERE"/>',
        );
        assert.include(outside, "Binding declared", outside.join(", "));
      }),
  );

  it.effect("refuses a choice interaction in a div of a PCI's markup by N6 ancestry", () =>
    Effect.gen(function* nested() {
      const found = yield* lawsBreachedBy(
        "3.0.0",
        contextPci("QTI_CONTEXT", `<div>${choiceInteraction}</div>`),
        '<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/>',
      );
      assert.include(found, "N6 ancestry", found.join(", "));
      assert.strictEqual(ruleOf("N6 ancestry"), "ancestry-ban");
    }),
  );
});
