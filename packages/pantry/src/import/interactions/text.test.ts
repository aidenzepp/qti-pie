/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the declaration and binding rows name; it is no structure. */
import { createHash } from "node:crypto";
import type { Uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import {
  attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
} from "#pantry/import/interactions.ts";
import type { DeclaredVariable, InteractionContext } from "#pantry/import/interactions.ts";
import { textRows } from "#pantry/import/interactions/text.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { ItemRefusal, Rows } from "#pantry/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#pantry/import/tree.ts";
import {
  ChoiceCount,
  ChoiceIdentifier,
  ExpectedLength,
  ExpectedLines,
  StringCount,
} from "#pantry/schema/contracts.ts";
import { ChoiceTemplateRef } from "#pantry/schema/choices.ts";
import { InteractionBinding, RecordBinding, TypedBinding } from "#pantry/schema/interaction.ts";
import {
  DeclaredExtendedTextBase,
  DeclaredExtendedTextFormat,
  DeclaredExtendedTextMinStrings,
  DeclaredInlineChoiceFixed,
  DeclaredInlineChoiceMinChoices,
  DeclaredInlineChoiceRequired,
  DeclaredInlineChoiceShowHide,
  DeclaredInlineChoiceShuffle,
  DeclaredTextEntryBase,
  ExtendedTextExpectedLength,
  ExtendedTextExpectedLines,
  ExtendedTextInteraction,
  ExtendedTextMaxStrings,
  ExtendedTextPatternMask,
  ExtendedTextPatternmaskMessage,
  ExtendedTextPlaceholderText,
  InlineChoice,
  InlineChoiceInteraction,
  InlineChoiceMinSelectionsMessage,
  InlineChoicePrompt,
  QtiLabel,
  StringBinding,
  TextEntryExpectedLength,
  TextEntryFormat,
  TextEntryInteraction,
  TextEntryPatternMask,
  TextEntryPatternmaskMessage,
  TextEntryPlaceholderText,
} from "#pantry/schema/interactions/text.ts";
import { AttributeLexical } from "#pantry/schema/node.ts";
import type { NodeKindHandle } from "#pantry/schema/node.ts";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";

/**
 * A well-formed UUID derived from a readable label, so a fixture names its nodes and declarations
 * and the rows still carry the `Uuid` the schema asks for.
 */
const uuidOf = (label: string): Uuid => {
  const hex = createHash("sha1").update(label).digest("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

const documentId = "11111111-1111-4111-8111-111111111111";

const attribute = (local: string, value: string): Attribute => ({
  local,
  namespace: "",
  prefix: "",
  qname: local,
  references: [],
  value,
});

const element = (
  local: string,
  attributes: readonly (readonly [string, string])[] = [],
  children: readonly Element[] = [],
): Element => ({
  attributes: attributes.map(([name, value]) => attribute(name, value)),
  children,
  kind: "element",
  local,
  namespace: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  prefix: "",
  qname: local,
});

/**
 * The node index of a tree, each element's id its kind and position:
 * `qti-text-entry-interaction-1`.
 */
const indexed = (entries: readonly (readonly [Element, NodeKindHandle])[]): NodeIndex =>
  new Map<Element, IndexedNode>(
    entries.map(([found, kind], position) => [
      found,
      { ancestry: "root", id: uuidOf(`${kind}-${position}`), kind },
    ]),
  );

const stringSingle: DeclaredVariable = {
  baseType: Option.some("string"),
  cardinality: Option.some("single"),
  id: uuidOf("decl-response"),
  shape: "typed",
};

const stringSecond: DeclaredVariable = { ...stringSingle, id: uuidOf("decl-str") };

const identifierSingle: DeclaredVariable = {
  baseType: Option.some("identifier"),
  cardinality: Option.some("single"),
  id: uuidOf("decl-choice"),
  shape: "typed",
};

const recordVariable: DeclaredVariable = {
  baseType: Option.none(),
  cardinality: Option.none(),
  id: uuidOf("decl-record"),
  shape: "record",
};

const shared: InteractionContext["shared"] = {
  attributes: attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
};

/**
 * The context of a tree whose root holds `elements`, with the kinds `entries` index.
 */
const contextOf = (
  elements: readonly Element[],
  entries: readonly (readonly [Element, NodeKindHandle])[],
  declarations: readonly (readonly [string, DeclaredVariable])[],
): InteractionContext => {
  const body = element("qti-item-body", [], elements);
  const root = element("qti-assessment-item", [], [body]);

  return {
    declarations: new Map(declarations),
    documentId,
    item: { adaptive: "false" },
    nodes: indexed([[root, "qti-assessment-item"], [body, "qti-item-body"], ...entries]),
    root,
    shared,
  };
};

const run = (ctx: InteractionContext) => textRows(ctx, Rows.empty());

const entry = (attributes: readonly (readonly [string, string])[]) =>
  element("qti-text-entry-interaction", attributes);

const extended = (attributes: readonly (readonly [string, string])[]) =>
  element("qti-extended-text-interaction", attributes);

const textEntryId = uuidOf("qti-text-entry-interaction-2");

describe("textRows: text-entry", () => {
  it.effect("writes the arm with base 10, no marker, and a string single binding", () =>
    Effect.gen(function* check() {
      const found = entry([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf([found], [[found, "qti-text-entry-interaction"]], [["RESPONSE", stringSingle]]),
      );

      assert.deepStrictEqual(Rows.of(rows, TextEntryInteraction), [
        { base: "10", id: textEntryId, responseIdentifier: "RESPONSE", rootKind: "item" },
      ]);
      assert.strictEqual(Rows.of(rows, DeclaredTextEntryBase).length, 0);
      assert.deepStrictEqual(Rows.of(rows, InteractionBinding), [
        {
          adaptive: "false",
          ancestry: "root",
          document: documentId,
          interactionKind: "qti-text-entry-interaction",
          node: textEntryId,
          responseIdentifier: "RESPONSE",
          shape: "typed",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TypedBinding), [
        {
          baseType: "string",
          cardinality: "single",
          document: documentId,
          interactionKind: "qti-text-entry-interaction",
          maxCount: 1n,
          node: textEntryId,
          responseIdentifier: "RESPONSE",
        },
      ]);
      assert.strictEqual(Rows.of(rows, StringBinding).length, 0);
    }),
  );

  it.effect("writes one StringBinding when string-identifier is written", () =>
    Effect.gen(function* check() {
      const found = entry([
        ["response-identifier", "RESPONSE"],
        ["string-identifier", "STR"],
      ]);
      const rows = yield* run(
        contextOf(
          [found],
          [[found, "qti-text-entry-interaction"]],
          [
            ["RESPONSE", stringSingle],
            ["STR", stringSecond],
          ],
        ),
      );

      assert.deepStrictEqual(Rows.of(rows, StringBinding), [
        { document: documentId, identifier: "STR", node: textEntryId },
      ]);
    }),
  );

  it.effect("writes a RecordBinding for a record declaration", () =>
    Effect.gen(function* check() {
      const found = entry([["response-identifier", "REC"]]);
      const rows = yield* run(
        contextOf([found], [[found, "qti-text-entry-interaction"]], [["REC", recordVariable]]),
      );

      assert.deepStrictEqual(Rows.of(rows, RecordBinding), [
        { interactionKind: "qti-text-entry-interaction", node: textEntryId },
      ]);
      assert.strictEqual(Rows.of(rows, TypedBinding).length, 0);
    }),
  );

  it.effect("writes base, its marker, and the optionals the source wrote", () =>
    Effect.gen(function* check() {
      const found = entry([
        ["response-identifier", "RESPONSE"],
        ["base", " 16 "],
        ["expected-length", "20"],
        ["pattern-mask", "[a-z]+"],
        ["placeholder-text", "type here"],
        ["format", "plain"],
        ["data-patternmask-message", "letters"],
      ]);
      const rows = yield* run(
        contextOf([found], [[found, "qti-text-entry-interaction"]], [["RESPONSE", stringSingle]]),
      );

      assert.deepStrictEqual(
        Rows.of(rows, TextEntryInteraction).map((row) => row.base),
        ["16"],
      );
      assert.deepStrictEqual(Rows.of(rows, DeclaredTextEntryBase), [{ node: textEntryId }]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        { attribute: "base", kind: "qti-text-entry-interaction", node: textEntryId, value: " 16 " },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TextEntryExpectedLength), [
        { node: textEntryId, value: ExpectedLength("20") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TextEntryPatternMask), [
        { node: textEntryId, value: "[a-z]+" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TextEntryPlaceholderText), [
        { node: textEntryId, value: "type here" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TextEntryFormat), [
        { node: textEntryId, value: "plain" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TextEntryPatternmaskMessage), [
        { node: textEntryId, value: "letters" },
      ]);
    }),
  );

  it.effect("writes no optional row for an attribute the source omitted", () =>
    Effect.gen(function* check() {
      const found = entry([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf([found], [[found, "qti-text-entry-interaction"]], [["RESPONSE", stringSingle]]),
      );

      for (const relation of [
        TextEntryExpectedLength,
        TextEntryPatternMask,
        TextEntryPlaceholderText,
        TextEntryFormat,
        TextEntryPatternmaskMessage,
      ]) {
        assert.strictEqual(Rows.of(rows, relation).length, 0, relation.name);
      }
    }),
  );

  it.effect("refuses a response-identifier no declaration names", () =>
    Effect.gen(function* check() {
      const found = entry([["response-identifier", "MISSING"]]);
      const exit = yield* Effect.exit(
        run(contextOf([found], [[found, "qti-text-entry-interaction"]], [])),
      );

      assert.isTrue(Exit.isFailure(exit));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      assert.isTrue(Option.isSome(failure) && failure.value instanceof ItemRefusal);
      assert.strictEqual(
        Option.isSome(failure) && failure.value instanceof ItemRefusal
          ? failure.value.rule
          : "none",
        "binding-declared",
      );
    }),
  );
});

describe("textRows: extended-text", () => {
  const extendedId = uuidOf("qti-extended-text-interaction-2");

  it.effect("defaults base, format and min-strings, with no marker", () =>
    Effect.gen(function* check() {
      const found = extended([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf(
          [found],
          [[found, "qti-extended-text-interaction"]],
          [["RESPONSE", stringSingle]],
        ),
      );

      assert.deepStrictEqual(Rows.of(rows, ExtendedTextInteraction), [
        {
          base: "10",
          format: "plain",
          id: extendedId,
          minStrings: StringCount("0"),
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      for (const marker of [
        DeclaredExtendedTextBase,
        DeclaredExtendedTextFormat,
        DeclaredExtendedTextMinStrings,
      ]) {
        assert.strictEqual(Rows.of(rows, marker).length, 0, marker.name);
      }
      assert.deepStrictEqual(
        Rows.of(rows, TypedBinding).map((row) => [row.baseType, row.cardinality, row.maxCount]),
        [["string", "single", 1n]],
      );
    }),
  );

  it.effect("writes format xhtml with its marker", () =>
    Effect.gen(function* check() {
      const found = extended([
        ["response-identifier", "RESPONSE"],
        ["format", "xhtml"],
      ]);
      const rows = yield* run(
        contextOf(
          [found],
          [[found, "qti-extended-text-interaction"]],
          [["RESPONSE", stringSingle]],
        ),
      );

      assert.deepStrictEqual(
        Rows.of(rows, ExtendedTextInteraction).map((row) => row.format),
        ["xhtml"],
      );
      assert.deepStrictEqual(Rows.of(rows, DeclaredExtendedTextFormat), [{ node: extendedId }]);
    }),
  );

  it.effect("writes the other markers and the optionals the source wrote", () =>
    Effect.gen(function* check() {
      const found = extended([
        ["response-identifier", "RESPONSE"],
        ["string-identifier", "STR"],
        ["base", "2"],
        ["min-strings", "1"],
        ["max-strings", "3"],
        ["expected-length", "40"],
        ["expected-lines", "5"],
        ["pattern-mask", ".*"],
        ["placeholder-text", "write"],
        ["data-patternmask-message", "any"],
      ]);
      const rows = yield* run(
        contextOf(
          [found],
          [[found, "qti-extended-text-interaction"]],
          [
            ["RESPONSE", stringSingle],
            ["STR", stringSecond],
          ],
        ),
      );

      assert.deepStrictEqual(Rows.of(rows, DeclaredExtendedTextBase), [{ node: extendedId }]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredExtendedTextMinStrings), [{ node: extendedId }]);
      assert.deepStrictEqual(
        Rows.of(rows, ExtendedTextInteraction).map((row) => [row.base, row.minStrings]),
        [["2", "1"]],
      );
      assert.deepStrictEqual(Rows.of(rows, ExtendedTextMaxStrings), [
        { node: extendedId, value: StringCount("3") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ExtendedTextExpectedLength), [
        { node: extendedId, value: ExpectedLength("40") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ExtendedTextExpectedLines), [
        { node: extendedId, value: ExpectedLines("5") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ExtendedTextPatternMask), [
        { node: extendedId, value: ".*" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ExtendedTextPlaceholderText), [
        { node: extendedId, value: "write" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, ExtendedTextPatternmaskMessage), [
        { node: extendedId, value: "any" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, StringBinding), [
        { document: documentId, identifier: "STR", node: extendedId },
      ]);
    }),
  );

  it.effect("keeps a multiple string variable's cardinality and a maxCount of 1", () =>
    Effect.gen(function* check() {
      const found = extended([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf(
          [found],
          [[found, "qti-extended-text-interaction"]],
          [["RESPONSE", { ...stringSingle, cardinality: Option.some("multiple") }]],
        ),
      );

      assert.deepStrictEqual(
        Rows.of(rows, TypedBinding).map((row) => [row.cardinality, row.maxCount]),
        [["multiple", 1n]],
      );
    }),
  );
});

describe("textRows: inline-choice", () => {
  const first = element("qti-inline-choice", [["identifier", "A"]]);
  const second = element("qti-inline-choice", [
    ["identifier", "B"],
    ["fixed", "true"],
    ["template-identifier", "TPL"],
  ]);
  const label = element("qti-label");
  const interaction = (attributes: readonly (readonly [string, string])[]) =>
    element("qti-inline-choice-interaction", attributes, [label, first, second]);
  const interactionId = uuidOf("qti-inline-choice-interaction-2");

  const entriesOf = (found: Element): readonly (readonly [Element, NodeKindHandle])[] => [
    [found, "qti-inline-choice-interaction"],
    [label, "qti-label"],
    [first, "qti-inline-choice"],
    [second, "qti-inline-choice"],
  ];

  const template: DeclaredVariable = { ...identifierSingle, id: uuidOf("decl-template") };

  it.effect("writes a choice's show-hide and marks the one the source wrote", () =>
    Effect.gen(function* showHide() {
      const hidden = element("qti-inline-choice", [
        ["identifier", "A"],
        ["show-hide", "hide"],
      ]);
      const shown = element("qti-inline-choice", [["identifier", "B"]]);
      const found = element(
        "qti-inline-choice-interaction",
        [["response-identifier", "RESPONSE"]],
        [hidden, shown],
      );
      const rows = yield* run(
        contextOf(
          [found],
          [
            [found, "qti-inline-choice-interaction"],
            [hidden, "qti-inline-choice"],
            [shown, "qti-inline-choice"],
          ],
          [["RESPONSE", identifierSingle]],
        ),
      );

      assert.deepStrictEqual(
        Rows.of(rows, InlineChoice).map((row) => [row.identifier, row.showHide]),
        [
          ["A", "hide"],
          ["B", "show"],
        ],
      );
      assert.deepStrictEqual(Rows.of(rows, DeclaredInlineChoiceShowHide), [
        { node: Rows.of(rows, InlineChoice)[0]?.id ?? uuidOf("missing") },
      ]);
    }),
  );

  it.effect("writes the interaction with its defaults, no marker, and a maxCount 1 binding", () =>
    Effect.gen(function* check() {
      const found = interaction([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf([found], entriesOf(found), [
          ["RESPONSE", identifierSingle],
          ["TPL", template],
        ]),
      );

      assert.deepStrictEqual(Rows.of(rows, InlineChoiceInteraction), [
        {
          id: interactionId,
          minChoices: ChoiceCount("0"),
          required: "false",
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          shuffle: "false",
        },
      ]);
      for (const marker of [
        DeclaredInlineChoiceShuffle,
        DeclaredInlineChoiceRequired,
        DeclaredInlineChoiceMinChoices,
      ]) {
        assert.strictEqual(Rows.of(rows, marker).length, 0, marker.name);
      }
      assert.deepStrictEqual(
        Rows.of(rows, TypedBinding).map((row) => [row.baseType, row.cardinality, row.maxCount]),
        [["identifier", "single", 1n]],
      );
      assert.strictEqual(Rows.of(rows, InlineChoicePrompt).length, 0);
      assert.strictEqual(Rows.of(rows, InlineChoiceMinSelectionsMessage).length, 0);
    }),
  );

  it.effect("writes two InlineChoice rows owned by the interaction's node", () =>
    Effect.gen(function* check() {
      const found = interaction([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf([found], entriesOf(found), [
          ["RESPONSE", identifierSingle],
          ["TPL", template],
        ]),
      );

      assert.deepStrictEqual(Rows.of(rows, InlineChoice), [
        {
          fixed: "false",
          id: uuidOf("qti-inline-choice-4"),
          identifier: ChoiceIdentifier("A"),
          interaction: interactionId,
          showHide: "show",
        },
        {
          fixed: "true",
          id: uuidOf("qti-inline-choice-5"),
          identifier: ChoiceIdentifier("B"),
          interaction: interactionId,
          showHide: "show",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredInlineChoiceFixed), [
        { node: uuidOf("qti-inline-choice-5") },
      ]);
      assert.deepStrictEqual(Rows.of(rows, QtiLabel), [{ id: uuidOf("qti-label-3") }]);
    }),
  );

  it.effect("writes the template reference of a choice that names one", () =>
    Effect.gen(function* check() {
      const found = interaction([["response-identifier", "RESPONSE"]]);
      const rows = yield* run(
        contextOf([found], entriesOf(found), [
          ["RESPONSE", identifierSingle],
          ["TPL", template],
        ]),
      );

      assert.deepStrictEqual(Rows.of(rows, ChoiceTemplateRef), [
        {
          baseType: "identifier",
          cardinality: "single",
          document: documentId,
          identifier: "TPL",
          node: uuidOf("qti-inline-choice-5"),
        },
      ]);
    }),
  );

  it.effect("refuses a template-identifier no typed declaration names", () =>
    Effect.gen(function* check() {
      const found = interaction([["response-identifier", "RESPONSE"]]);
      const exit = yield* Effect.exit(
        run(contextOf([found], entriesOf(found), [["RESPONSE", identifierSingle]])),
      );

      assert.isTrue(Exit.isFailure(exit));
    }),
  );

  it.effect("writes the markers, the prompt and the message the source wrote", () =>
    Effect.gen(function* check() {
      const found = interaction([
        ["response-identifier", "RESPONSE"],
        ["shuffle", "true"],
        ["required", "1"],
        ["min-choices", "1"],
        ["data-prompt", "Pick\tone"],
        ["data-min-selections-message", "choose"],
      ]);
      const rows = yield* run(
        contextOf([found], entriesOf(found), [
          ["RESPONSE", identifierSingle],
          ["TPL", template],
        ]),
      );

      assert.deepStrictEqual(
        Rows.of(rows, InlineChoiceInteraction).map((row) => [
          row.shuffle,
          row.required,
          row.minChoices,
        ]),
        [["true", "1", "1"]],
      );
      for (const marker of [
        DeclaredInlineChoiceShuffle,
        DeclaredInlineChoiceRequired,
        DeclaredInlineChoiceMinChoices,
      ]) {
        assert.deepStrictEqual(Rows.of(rows, marker), [{ node: interactionId }], marker.name);
      }
      assert.deepStrictEqual(Rows.of(rows, InlineChoicePrompt), [
        { node: interactionId, value: "Pick one" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
        {
          attribute: "data-prompt",
          kind: "qti-inline-choice-interaction",
          node: interactionId,
          value: "Pick\tone",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, InlineChoiceMinSelectionsMessage), [
        { node: interactionId, value: "choose" },
      ]);
    }),
  );
});

describe("textRows: other kinds", () => {
  it.effect("leaves the rows alone when the tree holds no text interaction", () =>
    Effect.gen(function* check() {
      const paragraph = element("p");
      const rows = yield* run(contextOf([paragraph], [[paragraph, "p"]], []));

      assert.strictEqual(rows.size, 0);
    }),
  );

  it.effect("writes the rows of every text interaction in the tree", () =>
    Effect.gen(function* check() {
      const one = element("qti-text-entry-interaction", [["response-identifier", "ONE"]]);
      const two = element("qti-extended-text-interaction", [["response-identifier", "TWO"]]);
      const rows = yield* run(
        contextOf(
          [one, two],
          [
            [one, "qti-text-entry-interaction"],
            [two, "qti-extended-text-interaction"],
          ],
          [
            ["ONE", stringSingle],
            ["TWO", stringSingle],
          ],
        ),
      );

      assert.strictEqual(Rows.of(rows, TextEntryInteraction).length, 1);
      assert.strictEqual(Rows.of(rows, ExtendedTextInteraction).length, 1);
      assert.strictEqual(Rows.of(rows, InteractionBinding).length, 2);
    }),
  );
});

const importRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ImportRefused ? failure.value.rule : "";
};

const choice = (attributes: readonly (readonly [string, string])[]) =>
  element("qti-inline-choice", [["identifier", "A"], ...attributes]);

describe("textRows: a flag or format outside its roster", () => {
  const inline = (
    attributes: readonly (readonly [string, string])[],
    child: Element = choice([]),
  ) => {
    const found = element(
      "qti-inline-choice-interaction",
      [["response-identifier", "RESPONSE"], ...attributes],
      [child],
    );

    return contextOf(
      [found],
      [
        [found, "qti-inline-choice-interaction"],
        [child, "qti-inline-choice"],
      ],
      [["RESPONSE", identifierSingle]],
    );
  };
  const refused: readonly (readonly [string, InteractionContext])[] = [
    [
      'format of "rich" on an extended text interaction',
      (() => {
        const found = extended([
          ["response-identifier", "RESPONSE"],
          ["format", "rich"],
        ]);

        return contextOf(
          [found],
          [[found, "qti-extended-text-interaction"]],
          [["RESPONSE", stringSingle]],
        );
      })(),
    ],
    ["required of yes on an inline choice interaction", inline([["required", "yes"]])],
    ["shuffle of yes on an inline choice interaction", inline([["shuffle", "yes"]])],
    ["fixed of yes on an inline choice", inline([], choice([["fixed", "yes"]]))],
    ["show-hide of visible on an inline choice", inline([], choice([["show-hide", "visible"]]))],
  ];

  for (const [name, ctx] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(run(ctx));

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }

  it.effect("admits the xs:boolean spelling 1 and the format preformatted", () =>
    Effect.gen(function* admitted() {
      const found = extended([
        ["response-identifier", "RESPONSE"],
        ["format", "preformatted"],
      ]);
      const rows = yield* run(
        contextOf(
          [found],
          [[found, "qti-extended-text-interaction"]],
          [["RESPONSE", stringSingle]],
        ),
      );
      const flagged = yield* run(inline([["shuffle", "1"]], choice([["fixed", "0"]])));

      assert.deepStrictEqual(
        Rows.of(rows, ExtendedTextInteraction).map((row) => row.format),
        ["preformatted"],
      );
      assert.deepStrictEqual(
        Rows.of(flagged, InlineChoiceInteraction).map((row) => row.shuffle),
        ["1"],
      );
      assert.deepStrictEqual(
        Rows.of(flagged, InlineChoice).map((row) => row.fixed),
        ["0"],
      );
    }),
  );
});
