import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { contentModules } from "#plate/content/modules.ts";
import type { AnyContentModule } from "#plate/content/modules.ts";
import {
  colorThemes,
  fontSizeFactors,
  fontSizePoints,
  letterSpacings,
  lineHeights,
  rootHook,
  wordSpacings,
} from "#plate/content/root.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { partForSlot, rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { isPosted } from "#plate/form/encoding.ts";
import {
  acceptedItem,
  checkResponses,
  configure,
  decode,
  entryName,
  navigationState,
  noSupports,
  open,
  redact,
  render,
  renderStatus,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Configuration,
  Entry,
  Options,
  Redacted,
  Supports,
  TimeState,
  ValidationMessage,
  Verdict,
} from "#plate/index.ts";
import { isModuleKind } from "#plate/interactions/contract.ts";
import type { InteractionKind } from "#plate/interactions/contract.ts";
import { modules } from "#plate/model/interactions.ts";
import type { ItemRecord, RedactRecord } from "#plate/model/record.ts";
import { renderNavigation } from "#plate/navigation.ts";
import type { NavigationOptions, NavigationState } from "#plate/navigation.ts";
import { compounds, scanSheet } from "#plate/test/css.ts";
import type { AttributeTest, Compound, Sheet } from "#plate/test/css.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { hasStub, stubBaseType, stubCardinality, stubKind } from "#plate/test/stub-kind.ts";
import { styledClasses } from "#plate/vocabulary.ts";
import type { ClassOwner } from "#plate/vocabulary.ts";
import { genericFontFaces } from "#plate/supports.ts";
import type { FontSize, TextPreferences } from "#plate/supports.ts";

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
 * Read the text of the nodes, at any depth.
 *
 * @param nodes The nodes.
 * @returns Their text in document order, joined with no separator.
 */
const textOf = (nodes: readonly Node[]): string =>
  nodes.map((node) => (node.kind === "text" ? node.text : textOf(node.children))).join("");

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
 * The owners of the interaction modules, read from the table of modules. The witness renders the
 * four shipped kinds and the chrome; each module's markup is witnessed by its own tests, which
 * render its fixture, so a compound that names a module's part by marker counts as named.
 */
const moduleOwners: ReadonlySet<string> = new Set(
  Object.values(modules).map((module) => module.owner),
);

/**
 * Tell whether a compound names a part of an interaction module by its marker: a `data-slot` test
 * for `=` whose value `partForSlot` finds under an owner of the table of modules.
 *
 * @param compound The compound.
 * @returns Whether it names a module's part.
 */
const namesModulePart = (compound: Compound): boolean =>
  compound.attributes.some(
    (test) =>
      test.name === "data-slot" &&
      Option.contains(test.operator, "=") &&
      Option.exists(test.value, (slot) =>
        Option.exists(partForSlot(slot), ({ interaction }) => moduleOwners.has(interaction)),
      ),
  );

/**
 * The select-then-place state attributes, which the runtime's select-then-place driver
 * (`#plate/runtime/select-place-driver.dom.ts`) writes on any kind's tokens and targets after the
 * SSR, which never writes them: `aria-pressed` on a token, `data-cursor` on the target the arrow
 * keys have reached, and `aria-disabled` on a token or target a move refuses. No emitted markup
 * carries them, so a compound that tests one is witnessed by the driver's own tests, not here.
 */
const selectPlaceStates: ReadonlySet<string> = new Set([
  "aria-disabled",
  "aria-pressed",
  "data-cursor",
]);

/**
 * Tell whether a compound names a select-then-place state: an attribute test on one of the
 * {@link selectPlaceStates}.
 *
 * @param compound The compound.
 * @returns Whether it tests a state the driver writes at run time.
 */
const namesSelectPlaceState = (compound: Compound): boolean =>
  compound.attributes.some((test) => selectPlaceStates.has(test.name));

/**
 * Find the compounds of a sheet that no element of the trees has.
 *
 * Every compound of every selector counts, descending into the selectors of `:where`, `:is` and
 * `:has` and skipping `:not`'s. Combinators, pseudo-classes and pseudo-elements are not matched,
 * and a compound that names nothing else (`:where(…)` itself, a bare `::before`) matches, as does
 * one that names a part of an interaction module ({@link namesModulePart}) or a select-then-place
 * state the runtime writes ({@link namesSelectPlaceState}).
 *
 * @param sheet The scanned sheet.
 * @param trees The markup the sheet styles.
 * @returns Each compound no element has, with its rule's selector, in sheet order.
 */
const unmatched = (sheet: Sheet, trees: readonly Node[]): readonly SheetCompound[] => {
  const elements = elementsOf(trees);

  return matchable(sheet).filter(
    ({ compound }) =>
      !namesModulePart(compound) &&
      !namesSelectPlaceState(compound) &&
      !elements.some((element) => has(element, compound)),
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

  it.effect(
    "does not report a compound that tests a select-then-place state, which the runtime writes after the SSR, and reports another attribute no element has",
    () =>
      Effect.gen(function* selectPlaceState() {
        const choice = rowFor("choice-interaction", "choice").slot;
        const states = yield* scanSheet(
          `:where([data-slot="${choice}"] [aria-pressed="true"]) { color: red }\n:where([data-cursor]) { color: red }\n:where([aria-disabled="true"]) { color: red }`,
        );
        const other = yield* scanSheet('[aria-grabbed="true"] { color: red }');

        assert.deepStrictEqual(unmatched(states, [choiceList()]), []);
        assert.deepStrictEqual(
          unmatched(other, [choiceList()]).map((entry) => entry.compound.attributes[0]?.name),
          ["aria-grabbed"],
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
 * @param declarations The item's `qti-response-declaration` elements, and any outcome declaration
 *   of its own, which stand before the `SCORE` declaration.
 * @param body The content of its `qti-item-body`.
 * @param around The item-level content that stands before the body (`before`, such as
 *   `qti-companion-materials-info`) and after the response processing (`after`, such as
 *   `qti-modal-feedback`), none by default.
 * @returns The document as UTF-8 bytes, as a host reads it from storage.
 */
const itemBytes = (
  identifier: string,
  declarations: string,
  body: string,
  around: { readonly after?: string; readonly before?: string } = {},
): Uint8Array =>
  new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
 identifier="${identifier}" title="${identifier}" time-dependent="false" xml:lang="en-US">
 ${declarations}
 <qti-outcome-declaration base-type="float" cardinality="single" identifier="SCORE">
  <qti-default-value>
   <qti-value>0</qti-value>
  </qti-default-value>
 </qti-outcome-declaration>
 ${around.before ?? ""}
 <qti-item-body>
  ${body}
 </qti-item-body>
 <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>
 ${around.after ?? ""}
</qti-assessment-item>`);

/**
 * One hand-written item, the kinds of the interactions it holds, and what its refused answer posts.
 */
interface Authored {
  readonly bytes: Uint8Array;
  /**
   * The content elements the item holds, by local name, in its body or beside it, each the
   * element of a content module (`#plate/content/modules.ts`), which {@link expectedVerdict}
   * reads the verdict `open` gives the item from beside {@link Authored.kinds}; none when it
   * holds none.
   */
  readonly content?: readonly string[];
  /**
   * The kind of each interaction the body holds, which {@link expectedVerdict} reads the verdict
   * `open` gives the item from.
   */
  readonly kinds: readonly InteractionKind[];
  /**
   * The document's location, which `open` takes.
   */
  readonly location: string;
  /**
   * The entries a refused answer posts, by response identifier; empty when the item has none.
   */
  readonly posted: Readonly<Record<string, readonly string[]>>;
  /**
   * The record of one processed attempt the item is redacted with, so what shows only after an
   * attempt, such as feedback, is in the markup; none redacts the item as it reads with no record.
   */
  readonly record?: RedactRecord;
}

/**
 * Find the content module that reads an element, from the table of content modules.
 *
 * @param element An element's local name, as {@link Authored.content} names it.
 * @returns The module whose `element` it is; the test fails when none reads it.
 */
const contentModuleOf = (element: string): AnyContentModule =>
  contentModules.find((module) => module.element === element) ??
  assert.fail(`no content module reads ${element}`);

/**
 * Read the verdict `open` gives an authored item from the table of modules: `accepted` while every
 * interaction it holds is one plate renders, `accepted-with-unsupported` while one is of a kind
 * whose module is a stub, which its `parse` shows as a notice. A content element reads the same
 * way: a stub content module marks its element, so the verdict is `accepted-with-unsupported` while
 * the module of any element the item holds is one. A module lands by setting `implemented: true`
 * and editing nothing shared, so no row writes its verdict: the row names its kinds and content
 * elements, and the tables say which of them render today.
 *
 * @param item The authored item.
 * @returns The verdict `open` gives it.
 */
const expectedVerdict = (item: Authored): "accepted" | "accepted-with-unsupported" =>
  item.kinds.some((kind) => isModuleKind(kind) && !modules[kind].implemented) ||
  (item.content ?? []).some((element) => !contentModuleOf(element).implemented)
    ? "accepted-with-unsupported"
    : "accepted";

/**
 * The declarations of the content witness items: the `RESPONSE` the `match_correct` template
 * requires, and the `FEEDBACK` outcome the feedback elements read.
 */
const contentDeclarations = `<qti-response-declaration base-type="identifier" cardinality="single" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>spider</qti-value>
  </qti-correct-response>
 </qti-response-declaration>
 <qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK"/>`;

/**
 * The record of one attempt processed on a content witness item, as `score` leaves it: the answer
 * `spider` scored 1, and `FEEDBACK` at `correct`, the value its feedback elements show on, so
 * feedback that shows after an attempt is in the redacted item.
 *
 * @param location The item's location.
 * @param identifier The item's identifier.
 * @returns The record, whose `numAttempts` is 1.
 */
const attempted = (location: string, identifier: string): ItemRecord => ({
  attempt: "submitted",
  correct: {},
  defaults: {},
  document: location,
  instance,
  item: identifier,
  kind: "item",
  notices: [],
  numAttempts: 1,
  outcomes: {
    FEEDBACK: {
      baseType: "identifier",
      cardinality: "single",
      values: [{ baseType: "identifier", value: "correct" }],
    },
    SCORE: { baseType: "float", cardinality: "single", values: [{ baseType: "float", value: 1 }] },
  },
  records: {},
  responses: {
    RESPONSE: {
      baseType: "identifier",
      cardinality: "single",
      values: [{ baseType: "identifier", value: "spider" }],
    },
  },
  seed: "",
  templates: {},
});

/**
 * A correct-response value of each base type a row of `stubDeclarations` gives, which the stub
 * witness writes under its declaration. The stub's element is never read for its choices, so the
 * identifiers name nothing.
 */
const correctOf: Readonly<Record<typeof stubBaseType, string>> = {
  directedPair: "a b",
  identifier: "a",
  pair: "a b",
  point: "120 80",
};

/**
 * The stub witness: an item of the stub kind `#plate/test/stub-kind.ts` derives from the table of
 * modules, which plate shows as an item Notice, so the stylesheet's compounds that name one keep an
 * element to match after Order lands and its row's verdict turns `accepted`. Its element, its
 * declaration and its name all come from that file, so the row follows the stub kind with no edit.
 * The declaration is the one the stub kind's row of `stubDeclarations` gives, so the bare element
 * binds. The correct response is one value of its base type, the shape the `match_correct` template
 * requires of every declaration: `correctOf` holds a value per base type, and a base type a later
 * row adds fails to compile here until it has one. {@link authored} includes the row only while
 * {@link hasStub}: when no stub remains, no authored item can show an item Notice, and the
 * `[Q-12]` compound test finds no element for the stylesheet's Notice compounds, which whoever
 * lands the last core settles.
 */
const stubWitness: Authored = {
  bytes: itemBytes(
    `witness-${stubKind}`,
    `<qti-response-declaration base-type="${stubBaseType}" cardinality="${stubCardinality}" identifier="RESPONSE">
  <qti-correct-response>
   <qti-value>${correctOf[stubBaseType]}</qti-value>
  </qti-correct-response>
 </qti-response-declaration>`,
    `<p>Mark where the spider waits on its web.</p>
  <${modules[stubKind].element} response-identifier="RESPONSE"/>`,
  ),
  kinds: [stubKind],
  location: `witness/${stubKind}.xml`,
  posted: {},
};

/**
 * The items the witness renders: both Choice cardinalities, prompt shapes and orientations, a Text
 * Entry inside a `p`, an Extended Text with a prompt, an Inline Choice with a Label and one
 * without, and, while a bare stub remains, one interaction whose module is a stub, so the
 * stylesheet's Notice rules keep an element to match until the last stub lands. Each interaction
 * carries every class the stylesheet styles for it, and a body element every body class.
 * Then one item for each content slot (a modal feedback, a feedback block with a feedback inline,
 * companion materials, an image with its alt text, a rubric block), each redacted with the record
 * of one attempt, so the markup of a content module that lands is in the witness with no row added
 * here. The `rubric` slot is witnessed through the item's rubric block. The test-level slots
 * `test-feedback` and `test-stylesheet` have no item row: a test's feedback and its stylesheet
 * reach the page through the test's session, which an item cannot stand for.
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
    kinds: ["choice"],
    location: "witness/choice-single.xml",
    posted: { RESPONSE: ["spider", "ant"] },
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
    kinds: ["choice"],
    location: "witness/choice-multiple.xml",
    posted: { RESPONSE: ["spider", "scorpion", "ant"] },
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
    kinds: ["text-entry", "extended-text"],
    location: "witness/text.xml",
    posted: { ESSAY: ["It spins silk.", "It spins again."], RESPONSE: ["eight"] },
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
    kinds: ["inline-choice"],
    location: "witness/inline-choice.xml",
    posted: { RESPONSE: ["ten"] },
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
    kinds: ["order"],
    location: "witness/order.xml",
    posted: {},
  },
  ...(hasStub ? [stubWitness] : []),
  {
    bytes: itemBytes(
      "witness-modal-feedback",
      contentDeclarations,
      "<p>Which animal spins this web?</p>",
      {
        after: `<qti-modal-feedback outcome-identifier="FEEDBACK" identifier="correct" show-hide="show" title="Result">
   <qti-content-body>
    <p>Well done: a spider.</p>
   </qti-content-body>
  </qti-modal-feedback>`,
      },
    ),
    content: ["qti-modal-feedback"],
    kinds: [],
    location: "witness/modal-feedback.xml",
    posted: {},
    record: attempted("witness/modal-feedback.xml", "witness-modal-feedback"),
  },
  {
    bytes: itemBytes(
      "witness-feedback",
      contentDeclarations,
      `<p>That web belongs to a <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">spider</qti-feedback-inline>.</p>
  <qti-feedback-block outcome-identifier="FEEDBACK" identifier="correct" show-hide="show">
   <qti-content-body>
    <p>A spider has eight legs.</p>
   </qti-content-body>
  </qti-feedback-block>`,
    ),
    content: ["qti-feedback-block", "qti-feedback-inline"],
    kinds: [],
    location: "witness/feedback.xml",
    posted: {},
    record: attempted("witness/feedback.xml", "witness-feedback"),
  },
  {
    bytes: itemBytes(
      "witness-companion-materials",
      contentDeclarations,
      "<p>Count the legs, using the calculator if you wish.</p>",
      {
        before: `<qti-companion-materials-info>
   <qti-calculator>
    <qti-calculator-type>basic</qti-calculator-type>
    <qti-description>A four-function calculator</qti-description>
   </qti-calculator>
  </qti-companion-materials-info>`,
      },
    ),
    content: ["qti-companion-materials-info"],
    kinds: [],
    location: "witness/companion-materials.xml",
    posted: {},
    record: attempted("witness/companion-materials.xml", "witness-companion-materials"),
  },
  {
    /*
     * The alt-text slot's item has an image with its `alt` and holds no content element: no content
     * module reads the alt text a catalog card may give it before issue m5-11 lands, so the item's
     * verdict is `accepted` and its markup is the image as the body walk copies it.
     */
    bytes: itemBytes(
      "witness-alt-text",
      contentDeclarations,
      `<p><img src="web.png" alt="A garden spider waits at the centre of its web"/></p>`,
    ),
    content: [],
    kinds: [],
    location: "witness/alt-text.xml",
    posted: {},
    record: attempted("witness/alt-text.xml", "witness-alt-text"),
  },
  {
    bytes: itemBytes(
      "witness-rubric",
      contentDeclarations,
      `<p>Name the animal that spins this web.</p>
  <qti-rubric-block view="candidate">
   <qti-content-body>
    <p>Answer with one word.</p>
   </qti-content-body>
  </qti-rubric-block>`,
    ),
    content: ["qti-rubric-block"],
    kinds: [],
    location: "witness/rubric.xml",
    posted: {},
    record: attempted("witness/rubric.xml", "witness-rubric"),
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
  // A record response, which no item here declares, has no base type, so it is left out.
  const responses = Object.fromEntries(
    redacted.responses.flatMap((response) =>
      response.cardinality !== "record" &&
      Object.hasOwn(posted, response.identifier) &&
      isPosted(response.baseType)
        ? [
            [
              response.identifier,
              Result.merge(
                decode(entries, {
                  baseType: response.baseType,
                  cardinality: response.cardinality,
                  name: entryName(instance, response.identifier),
                }),
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
 * @param supports The supports the host enabled, which the redaction and every render take;
 *   `noSupports` by default.
 * @returns The renders' trees, and the refused answer's messages.
 */
const rendersOf = Effect.fnUntraced(function* rendersOf(
  item: Authored,
  configuration: Configuration,
  supports: Supports = noSupports,
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

  assert.strictEqual(verdict.verdict, expectedVerdict(item), item.location);

  const redacted = redact(verdict.accepted, item.record, undefined, { supports });
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
    Result.all(states.map((options) => render(redacted, configuration, { ...options, supports }))),
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
 * Open an authored item and require an accepted item, as a host hands one to `startTest`.
 *
 * @param item The hand-written item.
 * @returns The accepted item.
 */
const acceptedOf = Effect.fnUntraced(function* acceptedOf(item: Authored) {
  const verdict: Verdict = yield* open(item.location, item.bytes);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${item.location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * The authored Choice the test-level and support-driven witnesses deliver: the single-cardinality
 * Choice, whose row stands first in {@link authored}.
 */
const choiceItem: Authored = authored[0] ?? assert.fail("no authored Choice item");

/**
 * The identifier of {@link choiceItem}'s ref in {@link timedTestBytes}, which keys the items
 * `startTest` takes.
 */
const timedRef = "timed-choice";

/**
 * The seconds the timed test's part allows, its `max-time`.
 */
const maxTime = 600;

/**
 * A QTI 3.0 test of one linear, individual part that allows {@link maxTime} seconds and holds one
 * item ref to {@link choiceItem}: the smallest test on which a time limit is in force, so the
 * navigation emits its `time` part (the time-limits module's styles block, issue m3f-01).
 */
const timedTestBytes: Uint8Array = new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
 identifier="witness-timed" title="witness-timed">
 <qti-test-part identifier="P1" navigation-mode="linear" submission-mode="individual">
  <qti-time-limits max-time="${maxTime}"/>
  <qti-assessment-section identifier="S1" title="Timed" visible="true">
   <qti-assessment-item-ref identifier="${timedRef}" href="choice-single.xml"/>
  </qti-assessment-section>
 </qti-test-part>
</qti-assessment-test>`);

/**
 * When the timed test's session starts.
 */
const startedAt = new Date("2026-11-10T09:00:00.000Z");

/**
 * The time in force on the timed test at its start, as the time-limits module reads it once issue
 * m3f-01 lands: the part's whole `max-time` left, no `min-time`, and late submission not allowed.
 *
 * The module's stub reads no time, so a session of the timed test carries none until then; this
 * value stands in for it, so the `time` part is emitted and its styles block has markup to match
 * ({@link timedNavigationTrees}). Once the module reads the session's own time, that wins.
 */
const witnessTime: TimeState = {
  allowLateSubmission: false,
  minTimeLeft: Option.none(),
  timeLeft: Option.some(maxTime),
};

/**
 * Open the timed test and require an accepted test: `accepted-with-unsupported` while the
 * time-limits module is a stub, which `parse` shows as a notice, `accepted` once it lands.
 *
 * @returns The accepted test.
 */
const timedTest = Effect.gen(function* timedTest() {
  const location = "witness/timed.xml";
  const verdict: Verdict = yield* open(location, timedTestBytes);

  return (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
    ? verdict.accepted
    : assert.fail(`${location} is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
});

/**
 * Render the navigation of a just-started session of the timed test, so the Root holds the `time`
 * part: the test-level witness of the time-limits module's styles block.
 *
 * The session is started and read through the session functions a host uses, `startTest` and
 * `navigationState`; only the time in force is supplied ({@link witnessTime}) while the session
 * carries none.
 *
 * @param configuration The configuration, which the session and the render take.
 * @returns The navigation Root's trees, the `time` part among them.
 */
const timedNavigationTrees = Effect.fnUntraced(function* timedNavigationTrees(
  configuration: Configuration,
) {
  const test: AcceptedTest = yield* timedTest;
  const items = new Map([[timedRef, yield* acceptedOf(choiceItem)]]);
  const session = yield* Effect.fromResult(
    startTest(test, items, configuration, { instance, now: startedAt }),
  );
  const state = yield* Effect.fromResult(navigationState(test, session));
  const timed = { ...state, time: state.time ?? witnessTime };
  const trees = yield* Effect.fromResult(renderNavigation(timed, configuration)).pipe(
    Effect.map(parseHtml),
  );

  assert.isTrue(
    elementsOf(trees).some((element) =>
      Option.contains(attribute(element, "data-slot"), rowFor("test-navigation", "time").slot),
    ),
    "the timed navigation emits the time part",
  );

  return trees;
});

/**
 * The supports of a candidate with answer masking on (A-8), every other support off.
 */
const masking: Supports = { ...noSupports, answerMasking: true };

/**
 * Open and render {@link choiceItem} with answer masking on, as a host does for a candidate who
 * has it: the support-driven witness of the answer-masking styles block (issue m4-05), whose
 * mask parts the Choice emits under `supports.answerMasking` once that issue lands; until then its
 * markup is the unmasked Choice's. The redaction takes the same supports as the render, as the
 * render contract asks.
 *
 * @param configuration The configuration.
 * @returns The render's trees.
 */
const maskedTrees = Effect.fnUntraced(function* maskedTrees(configuration: Configuration) {
  const redacted = redact(yield* acceptedOf(choiceItem), undefined, configuration, {
    supports: masking,
  });
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { instance, supports: masking }),
  );

  return parseHtml(rendered.html);
});

/**
 * The supports of a candidate with a magnification of 1.5 (the display preference whose marker the
 * Root hook writes), every other support off.
 */
const magnifying: Supports = {
  ...noSupports,
  display: { ...noSupports.display, magnification: Option.some(1.5) },
};

/**
 * Render {@link choiceItem} in every state with a magnification on, as a host does for a candidate
 * who has one: the support-driven witness of the Root's `data-magnification` marker (issues m3e-09b
 * and m5-12), which the Root hook writes under `supports.display.magnification` once it lands; the
 * hook is a stub until then, and the Root is the one the chrome writes. The redaction takes the
 * same supports as the render, as the render contract asks.
 *
 * @param configuration The configuration.
 * @returns The renders' trees.
 */
const magnifiedTrees = Effect.fnUntraced(function* magnifiedTrees(configuration: Configuration) {
  const { trees } = yield* rendersOf(choiceItem, configuration, magnifying);

  return trees;
});

/**
 * The text preferences with nothing set, which each display witness changes in one place.
 */
const noText: TextPreferences = {
  colorTheme: Option.none(),
  fontNames: [],
  fontSize: Option.none(),
  genericFontFace: Option.none(),
  letterSpacing: Option.none(),
  lineHeight: Option.none(),
  lineSpacing: Option.none(),
  uniformFontSizing: false,
  wordSpacing: Option.none(),
  wordWrapping: false,
};

/**
 * Take a scale's value for a witness, the scale starting again when the witness is past its end.
 *
 * @param values The scale.
 * @param index The witness's index.
 * @returns The value at the index, wrapped.
 */
const cycled = <T>(values: readonly T[], index: number): Option.Option<T> =>
  Option.fromNullishOr(values[index % values.length]);

/**
 * The supports of the display witnesses: one candidate per index, each holding the next value of
 * every scale the Root hook writes ({@link fontSizeFactors} then {@link fontSizePoints},
 * {@link lineHeights}, {@link letterSpacings}, {@link wordSpacings}, each generic family and each
 * of {@link colorThemes}, a scale shorter than the longest starting again), the first with inverted
 * polarity and a single column on. So every value the display block keys on is on some Root, in as
 * many candidates as the longest scale has values.
 */
const displaySupports: readonly Supports[] = ((): readonly Supports[] => {
  const sizes: readonly FontSize[] = [
    ...fontSizeFactors.map((value): FontSize => ({ kind: "factor", value })),
    ...fontSizePoints.map((value): FontSize => ({ kind: "points", value })),
  ];
  const count = Math.max(
    sizes.length,
    lineHeights.length,
    letterSpacings.length,
    wordSpacings.length,
    genericFontFaces.length,
    colorThemes.length,
  );

  return Array.from({ length: count }, (_, index) => ({
    ...noSupports,
    display: {
      ...noSupports.display,
      invertDisplayPolarity: index === 0,
      layoutSingleColumn: index === 0,
      text: Option.some({
        ...noText,
        colorTheme: cycled(colorThemes, index),
        fontSize: cycled(sizes, index),
        genericFontFace: cycled(genericFontFaces, index),
        letterSpacing: cycled(letterSpacings, index),
        lineHeight: cycled(lineHeights, index),
        wordSpacing: cycled(wordSpacings, index),
      }),
    },
  }));
})();

/**
 * Render {@link choiceItem} once for each of {@link displaySupports}, as a host does for a
 * candidate with display preferences: the support-driven witness of the display block (issue
 * m5-12), whose rules key on the Root's data attributes, which the Root hook writes under
 * `supports.display`. The redaction takes the same supports as the render, as the render contract
 * asks.
 *
 * @param configuration The configuration.
 * @returns The renders' trees.
 */
const displayTrees = Effect.fnUntraced(function* displayTrees(configuration: Configuration) {
  const accepted = yield* acceptedOf(choiceItem);
  const rendered = yield* Effect.fromResult(
    Result.all(
      displaySupports.map((supports) =>
        render(redact(accepted, undefined, configuration, { supports }), configuration, {
          instance,
          supports,
        }),
      ),
    ),
  );

  return rendered.flatMap((entry) => parseHtml(entry.html));
});

/**
 * Read and scan the stylesheet through the package's own import alias.
 */
const readSheet = Effect.tryPromise(() =>
  readFile(new URL(import.meta.resolve("#plate/styles.css")), "utf-8"),
).pipe(Effect.flatMap(scanSheet));

/**
 * Render every markup the sheet styles: each authored item in every state, both Status headings,
 * the navigation, the navigation of a timed test, a Choice with answer masking on, a Choice with a
 * magnification on and a Choice for each of the display witnesses.
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
      ...(yield* timedNavigationTrees(configuration)),
      ...(yield* maskedTrees(configuration)),
      ...(yield* magnifiedTrees(configuration)),
      ...(yield* displayTrees(configuration)),
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
  it("holds an item of each verdict the table of modules gives, a stub's for as long as the table holds a stub", () => {
    const expected = new Set(authored.map(expectedVerdict));

    assert.isTrue(expected.has("accepted"));
    assert.strictEqual(
      expected.has("accepted-with-unsupported"),
      Object.values(modules).some((module) => !module.implemented) ||
        contentModules.some((module) => !module.implemented),
      "an item of a stub kind or content element is authored while a table of modules holds a stub",
    );
  });

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

  it.effect(
    "[W0-CONTENT-PARTS] a witness item per content slot renders, with a record of one attempt, to the verdict its modules give",
    () =>
      Effect.gen(function* contentSlots() {
        const configuration = yield* configure({});
        const witnessed = authored.filter((item) => item.record !== undefined);

        assert.deepStrictEqual(
          witnessed.map((item) => item.location),
          [
            "witness/modal-feedback.xml",
            "witness/feedback.xml",
            "witness/companion-materials.xml",
            "witness/alt-text.xml",
            "witness/rubric.xml",
          ],
        );
        assert.deepStrictEqual(
          new Set(witnessed.flatMap((item) => item.content ?? [])),
          new Set([
            "qti-companion-materials-info",
            "qti-feedback-block",
            "qti-feedback-inline",
            "qti-modal-feedback",
            "qti-rubric-block",
          ]),
        );

        for (const item of witnessed) {
          const { trees } = yield* rendersOf(item, configuration);
          const notices = elementsOf(trees)
            .filter((element) =>
              Option.contains(attribute(element, "data-slot"), rowFor("item", "notice").slot),
            )
            .map((element) => textOf(element.children));

          for (const element of item.content ?? []) {
            const module = contentModuleOf(element);

            assert.strictEqual(
              notices.some((notice) => notice.includes(element)),
              module.placement === "body" && !module.implemented,
              `${item.location}: ${element} shows its Notice while it is a body-placed stub`,
            );
          }
        }
      }),
  );

  it.effect("[W0-CONTENT-PARTS] a supports-driven Root witness renders with a magnification", () =>
    Effect.gen(function* magnifiedRoot() {
      const trees = yield* magnifiedTrees(yield* configure({}));
      const roots = elementsOf(trees).filter((element) =>
        Option.contains(attribute(element, "data-slot"), rowFor("item", "root").slot),
      );

      assert.isNotEmpty(roots);
      for (const root of roots) {
        assert.strictEqual(
          Option.isSome(attribute(root, "data-magnification")),
          rootHook.implemented,
          "the Root carries data-magnification as the Root hook is implemented",
        );
      }
    }),
  );
});
