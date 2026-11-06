import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { isPosted } from "#plate/form/encoding.ts";
import {
  checkResponses,
  configure,
  decode,
  entryName,
  open,
  redact,
  render,
  renderStatus,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Entry,
  Options,
  Redacted,
  ValidationMessage,
  Verdict,
} from "#plate/index.ts";
import { renderNavigation } from "#plate/navigation.ts";
import type { NavigationOptions, NavigationState } from "#plate/navigation.ts";
import { compounds, scanSheet } from "#plate/test/css.ts";
import type { AttributeTest, Compound, Sheet } from "#plate/test/css.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { styledClasses } from "#plate/vocabulary.ts";
import type { ClassOwner } from "#plate/vocabulary.ts";

/**
 * A compound of a sheet, with the selector it was read from.
 */
interface SheetCompound {
  readonly compound: Compound;
  /**
   * The rule's selector, as the sheet holds it, that the compound sits in at some depth.
   */
  readonly selector: string;
}

/**
 * The pseudo-classes whose selectors the witness descends into. `:not`'s are skipped: a rule may
 * name there what no element has.
 */
const descended: ReadonlySet<string> = new Set(["has", "is", "where"]);

/**
 * Read every element of the trees, at any depth.
 *
 * @param trees The trees.
 * @returns Each element, in document order; text nodes dropped.
 */
const elementsOf = (trees: readonly Node[]): readonly Element[] =>
  trees.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read a selector's compounds at any depth outside `:not`: unlike `compoundsDeep` in
 * `#plate/test/css.ts`, it skips `:not`'s selectors, which may name what no element has.
 *
 * @param selector One selector.
 * @returns Its top-level compounds, each followed by the compounds of the selectors of its
 *   `:where`, `:is` and `:has`, recursively; never those of `:not`.
 */
const compoundsOutsideNot = (selector: string): readonly Compound[] =>
  compounds(selector).flatMap((compound) => [
    compound,
    ...compound.pseudoClasses
      .filter((pseudoClass) => descended.has(pseudoClass.name))
      .flatMap((pseudoClass) => pseudoClass.selectors.flatMap(compoundsOutsideNot)),
  ]);

/**
 * Read an attribute of an element as text.
 *
 * @param element The element.
 * @param name The attribute's name, in any case.
 * @returns The value, the empty string for a boolean attribute present, or none when absent.
 */
const attribute = (element: Element, name: string): Option.Option<string> => {
  const key = name.toLowerCase();
  if (!Object.hasOwn(element.attrs, key)) {
    return Option.none();
  }

  return Option.fromNullishOr(element.attrs[key]).pipe(
    Option.map((value) => (value === true ? "" : value)),
  );
};

/**
 * Test one attribute test against an element.
 *
 * Only presence and `=` without a case flag are matched; any other operator, or a flag, never
 * passes, so its compound is reported.
 *
 * @param element The element.
 * @param test The attribute test.
 * @returns Whether the element passes the test.
 */
const passes = (element: Element, test: AttributeTest): boolean =>
  Option.match(attribute(element, test.name), {
    onNone: () => false,
    onSome: (value) =>
      Option.isNone(test.operator) ||
      (Option.contains(test.operator, "=") &&
        Option.isNone(test.flag) &&
        Option.contains(test.value, value)),
  });

/**
 * Test whether a compound holds anything the witness matches: a type, a class, an ID or an
 * attribute test.
 *
 * @param compound The compound.
 * @returns Whether some element must have what the compound names.
 */
const namesSomething = (compound: Compound): boolean =>
  Option.isSome(compound.type) ||
  compound.classes.length > 0 ||
  compound.ids.length > 0 ||
  compound.attributes.length > 0;

/**
 * Test whether an element has what a compound names; pseudo-classes and pseudo-elements are not
 * matched.
 *
 * @param element The element.
 * @param compound The compound.
 * @returns Whether the element has the compound's type (any, for `*`), every class, every ID and
 *   passes every attribute test.
 */
const has = (element: Element, compound: Compound): boolean => {
  const classes = new Set(
    Option.getOrElse(attribute(element, "class"), () => "")
      .split(/\s+/u)
      .filter((name) => name !== ""),
  );
  const id = attribute(element, "id");

  return (
    Option.match(compound.type, {
      onNone: () => true,
      onSome: (type) => type === "*" || type.toLowerCase() === element.tag,
    }) &&
    compound.classes.every((name) => classes.has(name)) &&
    compound.ids.every((name) => Option.contains(id, name)) &&
    compound.attributes.every((test) => passes(element, test))
  );
};

/**
 * Read the compounds of a sheet the witness matches: every compound of every selector, descending
 * into the selectors of `:where`, `:is` and `:has` and skipping `:not`'s, that names a type, a
 * class, an ID or an attribute test.
 *
 * @param sheet The scanned sheet.
 * @returns Each such compound with its rule's selector, in sheet order.
 */
const matchable = (sheet: Sheet): readonly SheetCompound[] =>
  sheet.rules.flatMap((rule) =>
    rule.selectors.flatMap((selector) =>
      compoundsOutsideNot(selector)
        .filter(namesSomething)
        .map((compound) => ({ compound, selector })),
    ),
  );

/**
 * Find the compounds of a sheet that no element of the trees has.
 *
 * Every compound of every selector counts, descending into the selectors of `:where`, `:is` and
 * `:has` and skipping `:not`'s. Combinators, pseudo-classes and pseudo-elements are not matched,
 * and a compound that names nothing else (`:where(…)` itself, a bare `::before`) matches.
 *
 * @param sheet The scanned sheet.
 * @param trees The markup the sheet styles.
 * @returns Each compound no element has, with its rule's selector, in sheet order.
 */
const unmatched = (sheet: Sheet, trees: readonly Node[]): readonly SheetCompound[] => {
  const elements = elementsOf(trees);

  return matchable(sheet).filter(
    ({ compound }) => !elements.some((element) => has(element, compound)),
  );
};

/**
 * An attribute selector on a marker no part carries, the negative control's.
 */
const nonexistent = '[data-slot="choice-interaction-nonexistent"]';

/**
 * A Choice list holding one choice, built only through the part table's markers.
 *
 * @returns The list's `ul`, holding one `li`.
 */
const choiceList = (): Element =>
  h("ul", { "data-slot": rowFor("choice-interaction", "choices").slot }, [
    h("li", { "data-slot": rowFor("choice-interaction", "choice").slot }, [text("A")]),
  ]);

describe("unmatched", () => {
  it.effect("reports a compound no element has, with its selector (the negative control)", () =>
    Effect.gen(function* negativeControl() {
      const sheet = yield* scanSheet(`${nonexistent} { color: red }`);
      const found = unmatched(sheet, [choiceList()]);

      assert.deepStrictEqual(
        found.map((entry) => entry.selector),
        [nonexistent],
      );
      assert.deepStrictEqual(found[0]?.compound.attributes, [
        {
          flag: Option.none(),
          name: "data-slot",
          operator: Option.some("="),
          value: Option.some("choice-interaction-nonexistent"),
        },
      ]);
    }),
  );

  it.effect("finds an element for each compound inside :where() (the positive control)", () =>
    Effect.gen(function* positiveControl() {
      const choice = rowFor("choice-interaction", "choice").slot;
      const selector = `:where(li[data-slot="${choice}"]:hover)`;
      const sheet = yield* scanSheet(`${selector} { color: red }`);

      assert.deepStrictEqual(unmatched(sheet, [choiceList()]), []);

      const bare = unmatched(sheet, [h("ul", {})]);
      assert.deepStrictEqual(
        bare.map((entry) => entry.selector),
        [selector],
      );
      assert.deepStrictEqual(bare[0]?.compound.type, Option.some("li"));
    }),
  );

  it.effect("does not report a compound inside :not() that no element has", () =>
    Effect.gen(function* insideNot() {
      const sheet = yield* scanSheet(`li:not(${nonexistent}, .qti-absent) { color: red }`);

      assert.deepStrictEqual(unmatched(sheet, [choiceList()]), []);
    }),
  );

  it.effect("matches classes split on white space and reports a class no element has", () =>
    Effect.gen(function* classes() {
      const tree = h("p", { class: " qti-underline\n\tqti-align-center " });
      const held = yield* scanSheet("p.qti-align-center.qti-underline { color: red }");
      const missing = yield* scanSheet(".qti-underline.qti-italic { color: red }");

      assert.deepStrictEqual(unmatched(held, [tree]), []);
      assert.deepStrictEqual(
        unmatched(missing, [tree]).map((entry) => entry.compound.classes),
        [["qti-underline", "qti-italic"]],
      );
    }),
  );

  it.effect("reports an attribute test whose operator is not =", () =>
    Effect.gen(function* otherOperator() {
      const sheet = yield* scanSheet('[data-slot^="choice-interaction"] { color: red }');

      assert.deepStrictEqual(
        unmatched(sheet, [choiceList()]).map((entry) => entry.compound.attributes[0]?.operator),
        [Option.some("^=")],
      );
    }),
  );
});

/**
 * The instance token every render here passes, as an author with a stable token would.
 */
const instance = "q1";

/**
 * Write the classes the stylesheet styles for one owner as a `class` attribute's value.
 *
 * @param owner The interaction, or the item body.
 * @returns Every class of `styledClasses[owner]`, separated by spaces.
 */
const classesOf = (owner: ClassOwner): string => styledClasses[owner].join(" ");

/**
 * Write a QTI 3.0 item in the corpus's `BG007.xml` shape: its response declarations, a `SCORE`
 * outcome, its body and the `match_correct` template.
 *
 * @param identifier The item's identifier, also its title.
 * @param declarations The item's `qti-response-declaration` elements.
 * @param body The content of its `qti-item-body`.
 * @returns The document as UTF-8 bytes, as a host reads it from storage.
 */
const itemBytes = (identifier: string, declarations: string, body: string): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
 identifier="${identifier}" title="${identifier}" time-dependent="false" xml:lang="en-US">
 ${declarations}
 <qti-outcome-declaration base-type="float" cardinality="single" identifier="SCORE">
  <qti-default-value>
   <qti-value>0</qti-value>
  </qti-default-value>
 </qti-outcome-declaration>
 <qti-item-body>
  ${body}
 </qti-item-body>
 <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
</qti-assessment-item>`);

/**
 * One hand-written item, the verdict `open` gives it, and what its refused answer posts.
 */
interface Authored {
  readonly bytes: Uint8Array;
  /**
   * The document's location, which `open` takes.
   */
  readonly location: string;
  /**
   * The entries a refused answer posts, by response identifier; empty when the item has none.
   */
  readonly posted: Readonly<Record<string, readonly string[]>>;
  readonly verdict: "accepted" | "accepted-with-unsupported";
}

/**
 * The items the witness renders: both Choice cardinalities, prompt shapes and orientations, a Text
 * Entry inside a `p`, an Extended Text with a prompt, an Inline Choice with a Label and one
 * without, and an interaction plate does not render. Each interaction carries every class the
 * stylesheet styles for it, and a body element every body class.
 */
const authored: readonly Authored[] = [
  {
    bytes: itemBytes(
      "witness-choice-single",
      `<qti-response-declaration base-type="identifier" cardinality="single" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>spider</qti-value>
  </qti-correct-response>
 </qti-response-declaration>`,
      `<p class="${classesOf("body")}">Spiders and insects differ in their legs.</p>
  <qti-choice-interaction class="${classesOf("choice-interaction")}" max-choices="1"
   orientation="horizontal" response-identifier="RESPONSE">
   <qti-prompt>Which has eight legs?</qti-prompt>
   <qti-simple-choice identifier="spider">A spider</qti-simple-choice>
   <qti-simple-choice identifier="ant">An ant</qti-simple-choice>
  </qti-choice-interaction>`,
    ),
    location: "witness/choice-single.xml",
    posted: { RESPONSE: ["spider", "ant"] },
    verdict: "accepted",
  },
  {
    bytes: itemBytes(
      "witness-choice-multiple",
      `<qti-response-declaration base-type="identifier" cardinality="multiple" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>spider</qti-value>
   <qti-value>scorpion</qti-value>
  </qti-correct-response>
 </qti-response-declaration>`,
      `<div class="${classesOf("body")}">
   <p>Some animals have eight legs.</p>
  </div>
  <qti-choice-interaction class="${classesOf("choice-interaction")}" max-choices="2"
   orientation="vertical" response-identifier="RESPONSE">
   <qti-prompt>
    <p>Which two have eight legs?</p>
   </qti-prompt>
   <qti-simple-choice identifier="spider">A spider</qti-simple-choice>
   <qti-simple-choice identifier="scorpion">A scorpion</qti-simple-choice>
   <qti-simple-choice identifier="ant">An ant</qti-simple-choice>
  </qti-choice-interaction>`,
    ),
    location: "witness/choice-multiple.xml",
    posted: { RESPONSE: ["spider", "scorpion", "ant"] },
    verdict: "accepted",
  },
  {
    bytes: itemBytes(
      "witness-text",
      `<qti-response-declaration base-type="integer" cardinality="single" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>8</qti-value>
  </qti-correct-response>
 </qti-response-declaration>
 <qti-response-declaration base-type="string" cardinality="single" identifier="ESSAY"/>`,
      `<p>A spider has <qti-text-entry-interaction class="${classesOf("text-entry-interaction")}"
   response-identifier="RESPONSE"/> legs.</p>
  <qti-extended-text-interaction class="${classesOf("extended-text-interaction")}"
   response-identifier="ESSAY">
   <qti-prompt>Describe how a spider spins its web.</qti-prompt>
  </qti-extended-text-interaction>`,
    ),
    location: "witness/text.xml",
    posted: { ESSAY: ["It spins silk.", "It spins again."], RESPONSE: ["eight"] },
    verdict: "accepted",
  },
  {
    bytes: itemBytes(
      "witness-inline-choice",
      `<qti-response-declaration base-type="identifier" cardinality="single" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>eight</qti-value>
  </qti-correct-response>
 </qti-response-declaration>
 <qti-response-declaration base-type="identifier" cardinality="single" identifier="COLOUR"/>`,
      `<p>A spider has <qti-inline-choice-interaction
   class="${classesOf("inline-choice-interaction")}" response-identifier="RESPONSE">
   <qti-inline-choice identifier="six">six</qti-inline-choice>
   <qti-inline-choice identifier="eight">eight</qti-inline-choice>
  </qti-inline-choice-interaction> legs.</p>
  <p>A garden spider is often <qti-inline-choice-interaction data-prompt="Pick a colour"
   response-identifier="COLOUR">
   <qti-label>Colour</qti-label>
   <qti-inline-choice identifier="brown">brown</qti-inline-choice>
   <qti-inline-choice identifier="green">green</qti-inline-choice>
  </qti-inline-choice-interaction>.</p>`,
    ),
    location: "witness/inline-choice.xml",
    posted: { RESPONSE: ["ten"] },
    verdict: "accepted",
  },
  {
    bytes: itemBytes(
      "witness-order",
      `<qti-response-declaration base-type="identifier" cardinality="ordered" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>egg</qti-value>
   <qti-value>spiderling</qti-value>
   <qti-value>adult</qti-value>
  </qti-correct-response>
 </qti-response-declaration>`,
      `<qti-order-interaction response-identifier="RESPONSE">
   <qti-simple-choice identifier="adult">Adult</qti-simple-choice>
   <qti-simple-choice identifier="egg">Egg</qti-simple-choice>
   <qti-simple-choice identifier="spiderling">Spiderling</qti-simple-choice>
  </qti-order-interaction>`,
    ),
    location: "witness/order.xml",
    posted: {},
    verdict: "accepted-with-unsupported",
  },
];

/**
 * Validate an item's refused answer as an author's flow does: decode each posted response under
 * its entry name, then check the responses.
 *
 * @param accepted The document `open` accepted.
 * @param redacted Its redacted item, which gives each response's binding.
 * @param posted The entries the answer posts, by response identifier.
 * @param configuration The configuration.
 * @returns The messages `checkResponses` gives, in document order.
 */
const refusalsOf = (
  accepted: Accepted,
  redacted: Redacted,
  posted: Readonly<Record<string, readonly string[]>>,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const entries: readonly Entry[] = Object.entries(posted).flatMap(([response, values]) =>
    values.map((value): Entry => [entryName(instance, response), value]),
  );
  const responses = Object.fromEntries(
    redacted.responses.flatMap(({ baseType, cardinality, identifier }) =>
      Object.hasOwn(posted, identifier) && isPosted(baseType)
        ? [
            [
              identifier,
              Result.merge(
                decode(entries, { baseType, cardinality, name: entryName(instance, identifier) }),
              ),
            ] as const,
          ]
        : [],
    ),
  );

  return checkResponses(accepted, responses, configuration);
};

/**
 * Open an item and render it as an author would: with no inputs, with every control disabled, in
 * review and in solution, and, when it has one, with its refused answer's messages and posted
 * entries.
 *
 * @param item The hand-written item.
 * @param configuration The configuration.
 * @returns The renders' trees, and the refused answer's messages.
 */
const rendersOf = Effect.fnUntraced(function* rendersOf(
  item: Authored,
  configuration: Configuration,
) {
  const verdict: Verdict = yield* open(item.location, item.bytes);
  if (
    (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") ||
    verdict.kind !== "item"
  ) {
    return assert.fail(
      `${item.location} is ${verdict.verdict} of kind ${verdict.kind}, not an accepted item`,
    );
  }

  assert.strictEqual(verdict.verdict, item.verdict, item.location);

  const redacted = redact(verdict.accepted);
  const messages = refusalsOf(verdict.accepted, redacted, item.posted, configuration);
  assert.deepStrictEqual(
    [...new Set(messages.map((entry) => entry.response))].toSorted(),
    Object.keys(item.posted).toSorted(),
    `${item.location}: the refused answer gives a message for each posted response`,
  );

  const states: readonly Options[] = [
    { instance },
    { disabled: true, instance },
    { instance, mode: "review" },
    { instance, mode: "solution" },
    ...(messages.length > 0 ? [{ instance, messages, posted: item.posted }] : []),
  ];
  const rendered = yield* Effect.fromResult(
    Result.all(states.map((options) => render(redacted, configuration, options))),
  );

  return { messages, trees: rendered.flatMap((entry) => parseHtml(entry.html)) };
});

/**
 * A host's replacement that makes a navigation button its own submit button, posting the intent
 * plate computed for it (rule `9af3809b`).
 *
 * @param props The attributes plate computed for the button.
 * @param children The button's label.
 * @returns A submit button named `s-1.intent` whose value is `props["data-intent"]`.
 */
const submitting = (props: Attributes, children: readonly Node[]): Element =>
  h("button", { name: "s-1.intent", type: "submit", value: props["data-intent"] ?? "" }, children);

/**
 * The navigation parts that are buttons, each of which a host may swap for its own.
 */
const buttonParts = [
  "previous",
  "next",
  "itemButton",
  "submit",
  "end",
] as const satisfies readonly PartOf<"test-navigation">[];

/**
 * Every navigation button swapped for a host's submit button.
 */
const submitSwap: NavigationOptions = {
  parts: { "test-navigation": Object.fromEntries(buttonParts.map((part) => [part, submitting])) },
};

/**
 * A navigation of a nonlinear, individual part of two items, at the first, which is current: the
 * Root holds every part, and Previous, which the session does not take there, is disabled.
 */
const navigation: NavigationState = {
  allowed: [
    { kind: "next" },
    { kind: "go", sequenceIndex: 1 },
    { kind: "go", sequenceIndex: 2 },
    { kind: "submit-item" },
    { kind: "end-part" },
  ],
  count: 2,
  items: [
    { current: true, sequenceIndex: 1, state: "answered" },
    { current: false, sequenceIndex: 2, state: "not-answered" },
  ],
  navigation: "nonlinear",
  position: 1,
  submission: "individual",
};

/**
 * Render {@link navigation} as `renderNavigation` does, in its default order: Previous, the item
 * list, Next, Submit, then End.
 *
 * @param configuration The configuration, which gives the locale.
 * @param options The part overrides, none by default.
 * @returns The navigation Root's trees.
 */
const navigationTrees = (configuration: Configuration, options: NavigationOptions = {}) =>
  Effect.fromResult(renderNavigation(navigation, configuration, options)).pipe(
    Effect.map(parseHtml),
  );

/**
 * Read and scan the stylesheet through the package's own import alias.
 */
const readSheet = Effect.tryPromise(() =>
  readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
).pipe(Effect.flatMap(scanSheet));

/**
 * Render every markup the sheet styles: each authored item in every state, both Status headings,
 * and the navigation.
 *
 * @param configuration The configuration.
 * @returns The trees, and the refused answers' messages.
 */
const markupOf = Effect.fnUntraced(function* markupOf(configuration: Configuration) {
  const renders = yield* Effect.all(authored.map((item) => rendersOf(item, configuration)));
  const messages = renders.flatMap((entry) => entry.messages);
  const status = yield* Effect.fromResult(
    Result.all([
      renderStatus({ heading: "scored", instance, score: "1" }, configuration),
      renderStatus({ heading: "notAccepted", instance, messages }, configuration),
    ]),
  );

  return {
    messages,
    trees: [
      ...renders.flatMap((entry) => entry.trees),
      ...status.flatMap((entry) => parseHtml(entry.html)),
      ...(yield* navigationTrees(configuration)),
    ],
  };
});

/**
 * A state M2's markup carries that the sheet styles: a part, by its marker, and an attribute the
 * part carries in that state.
 */
interface PartState {
  readonly name: string;
  readonly slot: string;
  /**
   * The attribute's value in the state; none for a boolean attribute.
   */
  readonly value: Option.Option<string>;
}

/**
 * The states the sheet styles: the current item's button, a Choice Root and an Inline Choice Root
 * in review and in solution, and a readonly text Control.
 */
const partStates: readonly PartState[] = [
  {
    name: "aria-current",
    slot: rowFor("test-navigation", "itemButton").slot,
    value: Option.some("step"),
  },
  {
    name: "data-mode",
    slot: rowFor("choice-interaction", "root").slot,
    value: Option.some("review"),
  },
  {
    name: "data-mode",
    slot: rowFor("choice-interaction", "root").slot,
    value: Option.some("solution"),
  },
  {
    name: "data-mode",
    slot: rowFor("inline-choice-interaction", "root").slot,
    value: Option.some("review"),
  },
  {
    name: "data-mode",
    slot: rowFor("inline-choice-interaction", "root").slot,
    value: Option.some("solution"),
  },
  {
    name: "readonly",
    slot: rowFor("text-entry-interaction", "control").slot,
    value: Option.none(),
  },
  {
    name: "readonly",
    slot: rowFor("extended-text-interaction", "control").slot,
    value: Option.none(),
  },
];

/**
 * Find the states no element of the trees carries, and those whose elements no compound of the
 * sheet reaches by the state's attribute.
 *
 * @param sheet The scanned sheet.
 * @param trees The markup.
 * @returns Each such state, as `<marker> <attribute>[="<value>"]: no element` or `: no rule`.
 */
const unstyledStates = (sheet: Sheet, trees: readonly Node[]): readonly string[] => {
  const elements = elementsOf(trees);
  const held = matchable(sheet).map((entry) => entry.compound);

  return partStates.flatMap((state) => {
    const label = `${state.slot} ${state.name}${Option.match(state.value, {
      onNone: () => "",
      onSome: (value) => `="${value}"`,
    })}`;
    const carriers = elements.filter(
      (element) =>
        Option.contains(attribute(element, "data-slot"), state.slot) &&
        Option.exists(
          attribute(element, state.name),
          (value) => Option.isNone(state.value) || Option.contains(state.value, value),
        ),
    );
    const reached = carriers.filter((element) =>
      held.some(
        (compound) =>
          has(element, compound) && compound.attributes.some((test) => test.name === state.name),
      ),
    );

    if (carriers.length === 0) {
      return [`${label}: no element`];
    }

    return reached.length < carriers.length ? [`${label}: no rule`] : [];
  });
};

/**
 * Read the places, in a sheet's matchable compounds, of the compounds an element has.
 *
 * @param held The sheet's matchable compounds.
 * @param element The element.
 * @returns The index of each compound the element has, ascending.
 */
const heldBy = (held: readonly SheetCompound[], element: Element): readonly number[] =>
  held.flatMap((entry, index) => (has(element, entry.compound) ? [index] : []));

/**
 * Read the buttons of some trees.
 *
 * @param trees The trees.
 * @returns Each `button` element, in document order.
 */
const buttonsOf = (trees: readonly Node[]): readonly Element[] =>
  elementsOf(trees).filter((element) => element.tag === "button");

describe("styles.css over emitted markup", () => {
  it.effect(
    "[Q-12] every compound of every selector names something the emitted markup holds",
    () =>
      Effect.gen(function* witness() {
        const { messages, trees } = yield* markupOf(yield* configure({}));
        const sheet = yield* readSheet;

        assert.isNotEmpty(messages);
        assert.isAbove(matchable(sheet).length, 0);
        assert.deepStrictEqual(unmatched(sheet, trees), []);
      }),
  );

  it.effect(
    "[Q-12] reaches each state the markup carries: the current item, a Choice and an Inline Choice in review and solution, a readonly text Control",
    () =>
      Effect.gen(function* states() {
        const { trees } = yield* markupOf(yield* configure({}));
        const sheet = yield* readSheet;

        assert.deepStrictEqual(unstyledStates(sheet, trees), []);
      }),
  );

  it.effect(
    "styles a navigation button a host swaps to type=submit as the default one, its focus ring included",
    () =>
      Effect.gen(function* swapped() {
        const configuration = yield* configure({});
        const held = matchable(yield* readSheet);
        const plain = buttonsOf(yield* navigationTrees(configuration));
        const submits = buttonsOf(yield* navigationTrees(configuration, submitSwap));
        const focusing = (indexes: readonly number[]) =>
          indexes.some((index) =>
            Option.exists(Option.fromUndefinedOr(held[index]), (entry) =>
              entry.compound.pseudoClasses.some(
                (pseudoClass) => pseudoClass.name === "focus-visible",
              ),
            ),
          );

        assert.lengthOf(plain, 4 + navigation.items.length);
        assert.lengthOf(submits, plain.length);
        for (const [index, button] of plain.entries()) {
          const submit = submits[index] ?? assert.fail(`no swapped button at ${index}`);
          const slot = Option.getOrElse(attribute(button, "data-slot"), () => "");

          assert.isTrue(Option.contains(attribute(submit, "type"), "submit"), slot);
          assert.deepStrictEqual(heldBy(held, submit), heldBy(held, button), slot);
          assert.isTrue(focusing(heldBy(held, button)), `${slot}: a :focus-visible rule`);
        }

        const next = rowFor("test-navigation", "next").slot;
        const typed = matchable(
          yield* scanSheet(`:where([data-slot="${next}"][type="button"]) { opacity: 0.5 }`),
        );
        const [plainNext, submitNext] = [plain, submits].map((buttons) =>
          buttons.find((button) => Option.contains(attribute(button, "data-slot"), next)),
        );

        assert.notDeepEqual(
          heldBy(typed, plainNext ?? assert.fail("no Next")),
          heldBy(typed, submitNext ?? assert.fail("no swapped Next")),
          "the negative control: a rule keyed on type misses the swapped button",
        );
      }),
  );
});
