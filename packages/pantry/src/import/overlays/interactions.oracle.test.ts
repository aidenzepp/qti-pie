/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The O3 overlay rows against a second reading of the same tree: a direct walk of the XDM document,
 * numbering its nodes in document order as the tree's rows are numbered and taking each choice's
 * nearest interaction from its ancestors, the oracle's table of XSD defaults for the counts, and
 * reading 104's set of the names choices, hottexts and declarations use. The walk shares no code
 * with the builder, which reads the tree's flat rows (`flatten`).
 */
import type { Addition } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import {
  ChoiceBound,
  grammar,
  interactionKinds,
  nonElementKinds,
} from "#pantry/grammar/install.ts";
import { isForeignKind, openClasses } from "#pantry/grammar/kinds.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { pieces, rowsOf, sectionRowsOf } from "#pantry/import/overlays/interactions.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import type { InteractionIds, InteractionRows } from "#pantry/import/overlays/interactions.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName as closedNamed } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  NodeId,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import type { Declaration } from "#pantry/qti/declarations.ts";
import { choiceKinds, hottextInteraction, hottextKind } from "#pantry/qti/interactions.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { integerOf } from "#pantry/test/oracle-view.ts";

/**
 * The ids every case writes its rows under: each node's by its number, in the context of a
 * document no site names.
 */
const ids: InteractionIds = { context: ownContext(idOf(0)), idOf };

/**
 * The kinds the choice generator places: three interactions whose choices sit at different depths
 * (an order interaction's are its children, a gap match's gaps sit anywhere in its text, a hottext
 * interaction's hottexts anywhere in its content), their choices, a hottext, and a `span` to nest
 * them in.
 */
const specKinds = [
  "qti-order-interaction",
  "qti-gap-match-interaction",
  "qti-hottext-interaction",
  "qti-simple-choice",
  "qti-gap",
  "qti-gap-text",
  "qti-hottext",
  "span",
] as const satisfies readonly XdmClosedElement<Composed>["kind"][];

/**
 * One generated element: its kind, whether its name attribute is written with outer whitespace,
 * whether it leaves its name attribute out (an interaction's `response-identifier`, B6), and its
 * children.
 */
interface Spec {
  readonly children: readonly Spec[];
  readonly kind: (typeof specKinds)[number];
  readonly padded: boolean;
  readonly unnamed: boolean;
}

/**
 * The deepest a generated element sits below the item body.
 */
const maxDepth = 3;

/**
 * Generate an element at a depth below the item body, and its children, up to {@link maxDepth}.
 *
 * @param depth - Its depth.
 * @returns The generator.
 */
const specGen =
  (depth: number): Gen<Spec> =>
  (source) => ({
    children: depth >= maxDepth ? [] : source.draw(array(specGen(depth + 1), { max: 2, min: 0 })),
    kind: source.draw(element(specKinds)),
    padded: source.draw(element([false, true])),
    unnamed: source.draw(element([false, false, false, true])),
  });

/**
 * The generated item bodies: 1 to 3 elements, each with up to 2 children, to depth
 * {@link maxDepth}.
 */
const bodies: Gen<readonly Spec[]> = array(specGen(0), { max: 3, min: 1 });

/**
 * Whether a kind is an interaction.
 *
 * @param kind - The kind.
 * @returns Whether it is.
 */
const isInteraction = (kind: string): boolean =>
  interactionKinds.some((interaction) => interaction === kind);

/**
 * Whether a kind is a choice: a `Choice` row's kind.
 *
 * @param kind - The kind.
 * @returns Whether it is.
 */
const isChoice = (kind: string): boolean => choiceKinds.some((choice) => choice === kind);

/**
 * An element with closed attributes.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes' names and lexical forms, in order.
 * @param children - Its children.
 * @returns The element.
 */
const elementOf = (
  kind: XdmClosedElement<Composed>["kind"],
  attributes: readonly (readonly [ClosedName<Composed>, string])[],
  children: readonly XdmChild<Composed>[],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.map(([handle, lexical]) => ({
    lexical,
    name: closedNamed(handle),
    references: [],
  })),
  children,
  governs: "none",
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * Write a generated element's name attribute: an interaction's `response-identifier`, a choice's
 * or a hottext's `identifier`, a `span`'s none; padded with outer whitespace where drawn.
 *
 * @param spec - The element.
 * @param index - Its number among the generated elements, which names it.
 * @returns Its attributes.
 */
const attributesOf = (
  spec: Spec,
  index: number,
): readonly (readonly [ClosedName<Composed>, string])[] => {
  const name = spec.padded ? ` N${String(index)}\n` : `N${String(index)}`;
  if (isInteraction(spec.kind)) {
    return spec.unnamed ? [] : [["response-identifier", name]];
  }

  return spec.kind === "span" ? [] : [["identifier", name]];
};

/**
 * Write generated elements as the tree shred would give: whitespace before each element, so
 * character data shares the numbering.
 *
 * @param body - The item body's elements.
 * @returns The tree.
 */
const treeOf = (body: readonly Spec[]): XdmDocument<Composed> => {
  let index = 0;
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };
  const write = (spec: Spec): XdmChild<Composed> => {
    index += 1;
    const attributes = attributesOf(spec, index);

    return elementOf(
      spec.kind,
      attributes,
      spec.children.flatMap((child) => [ws, write(child)]),
    );
  };

  return {
    _tag: "document",
    charset: "UTF-8",
    declaration: Option.none(),
    doctype: Option.none(),
    epilog: [],
    exportCharset: "UTF-8",
    prolog: [],
    root: elementOf(
      "qti-assessment-item",
      [["identifier", "item"]],
      [
        elementOf(
          "qti-item-body",
          [],
          body.flatMap((spec) => [ws, write(spec)]),
        ),
      ],
    ),
    version: "3.0.1",
  };
};

/**
 * One element as the walk reads it: its id and its parent's, its kind, its name collapsed, and its
 * nearest interaction with that interaction's kind (the document node's where none is above it).
 */
interface Walked {
  readonly id: NodeId;
  readonly kind: string;
  readonly name: string | undefined;
  readonly nearest: NodeId;
  readonly nearestKind: string;
  readonly parent: NodeId;
}

/**
 * Walk a generated tree: number its nodes in document order, from the document node's 0, and give
 * each element the interaction its ancestors hold nearest, as N8 defines it.
 *
 * @param doc - The tree.
 * @returns Each element below the item body, in document order.
 */
const walk = (doc: XdmDocument<Composed>): readonly Walked[] => {
  const document = idOf(0);
  let next = 1;
  const walked: Walked[] = [];
  const visit = (
    node: XdmChild<Composed>,
    parent: NodeId,
    nearest: { readonly id: NodeId; readonly kind: string },
  ): void => {
    const id = idOf(next);
    next += 1;
    if (node._tag !== "element") {
      return;
    }

    const name = node.attributes[0]?.lexical.trim();
    walked.push({
      id,
      kind: node.kind,
      name,
      nearest: nearest.id,
      nearestKind: nearest.kind,
      parent,
    });

    const below = isInteraction(node.kind) ? { id, kind: node.kind } : nearest;
    for (const child of node.children) {
      visit(child, id, below);
    }
  };
  visit(doc.root, document, { id: document, kind: "document" });

  return walked;
};

/**
 * A situation the choice search must reach.
 */
type ChoiceSituation =
  | "choice deep in its interaction"
  | "choice outside any interaction"
  | "choice of an interaction with no response identifier"
  | "interaction in an interaction"
  | "hottext of a hottext interaction"
  | "hottext of another"
  | "padded name";

/**
 * Name the situations a walked tree holds.
 *
 * @param walked - The walk.
 * @param body - The generated elements.
 * @returns The situations.
 */
const situationsOf = (walked: readonly Walked[], body: readonly Spec[]) => {
  const padded = (specs: readonly Spec[]): boolean =>
    specs.some((spec) => spec.padded || padded(spec.children));
  const situations: [ChoiceSituation, boolean][] = [
    [
      "choice deep in its interaction",
      walked.some(
        (node) =>
          isChoice(node.kind) && node.nearestKind !== "document" && node.parent !== node.nearest,
      ),
    ],
    [
      "choice outside any interaction",
      walked.some((node) => isChoice(node.kind) && node.nearestKind === "document"),
    ],
    [
      "choice of an interaction with no response identifier",
      walked.some(
        (node) =>
          isChoice(node.kind) &&
          walked.some(({ id, name }) => id === node.nearest && name === undefined),
      ),
    ],
    [
      "interaction in an interaction",
      walked.some((node) => isInteraction(node.kind) && isInteraction(node.nearestKind)),
    ],
    [
      "hottext of a hottext interaction",
      walked.some((node) => node.kind === hottextKind && node.nearestKind === hottextInteraction),
    ],
    [
      "hottext of another",
      walked.some((node) => node.kind === hottextKind && node.nearestKind !== hottextInteraction),
    ],
    ["padded name", padded(body)],
  ];

  return situations.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

describe("import/overlays/interactions.ts, choices", () => {
  it.effect(
    "writes a Choice row for every choice, its ChoiceInteraction only where an interaction encloses it, an Interaction for every interaction, and counts each interaction's choices as the walk does",
    (ctx) =>
      // Oracle: a second implementation, a direct walk of the XDM tree that numbers its nodes in
      // document order and carries each element's nearest interaction down from its ancestors (N8),
      // against the builder's read of the tree's flat rows.
      // Bound: item bodies of 1 to 3 elements, each with up to 2 children, to depth 3, over 3
      // interaction kinds, 3 choice kinds, the hottext and a span, 300 runs.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required<ChoiceSituation>(
              [
                "choice deep in its interaction",
                "choice outside any interaction",
                "choice of an interaction with no response identifier",
                "interaction in an interaction",
                "hottext of a hottext interaction",
                "hottext of another",
                "padded name",
              ],
              { cases: 200, sense: notesOnly },
            ),
            draw: drawn(bodies),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "a direct walk of the XDM tree" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "pantry/import/overlays-interactions-choices",
          },
          (body, c) =>
            Effect.sync(() => {
              const doc = treeOf(body);
              const walked = walk(doc);
              c.noteAll(situationsOf(walked, body));

              const rows = rowsOf(doc, ids);
              const choices = walked.filter(({ kind }) => isChoice(kind));
              assert.sameMembers(
                [...rows.Choice.keys()],
                choices.map(({ id }) => id),
              );
              for (const choice of choices) {
                const row = rows.Choice.get(choice.id);
                assert.strictEqual(row?.nearest, choice.nearest, choice.id);
                assert.strictEqual(row?.identifier, choice.name, choice.id);
                assert.strictEqual(row?.kind, choice.kind, choice.id);
              }

              // A choice's interaction is a row only where an interaction encloses it: no stand-in.
              const owned = choices.filter(({ nearestKind }) => isInteraction(nearestKind));
              assert.sameMembers(
                [...rows.ChoiceInteraction.keys()],
                owned.map(({ id }) => id),
              );
              for (const choice of owned) {
                assert.strictEqual(
                  rows.ChoiceInteraction.get(choice.id)?.interaction,
                  choice.nearest,
                  choice.id,
                );
              }

              const hottexts = walked.filter(({ kind }) => kind === hottextKind);
              assert.sameMembers(
                [...rows.Hottext.keys()],
                hottexts.map(({ id }) => id),
              );
              for (const hottext of hottexts) {
                const row = rows.Hottext.get(hottext.id);
                assert.strictEqual(row?.nearest, hottext.nearest, hottext.id);
                assert.strictEqual(row?.nearestKind, hottext.nearestKind, hottext.id);
              }

              // Every interaction owns its choices, its response identifier written or not (B6).
              const interactions = walked.filter(({ kind }) => isInteraction(kind));
              assert.sameMembers(
                [...rows.Interaction.keys()],
                interactions.map(({ id }) => id),
              );
              assert.sameMembers(
                [...rows.Binding.keys()],
                interactions.filter(({ name }) => name !== undefined).map(({ id }) => id),
              );
              for (const interaction of interactions) {
                assert.strictEqual(
                  [...rows.BindingName.values()].find(
                    ({ attribute, node }) =>
                      node === interaction.id && attribute === "response-identifier",
                  )?.identifier,
                  interaction.name,
                );
                assert.strictEqual(rows.Interaction.get(interaction.id)?.kind, interaction.kind);
                assert.strictEqual(
                  rows.CountBound.get(interaction.id)?.choices,
                  BigInt(choices.filter(({ nearest }) => nearest === interaction.id).length),
                  interaction.id,
                );
              }
            }),
        ),
      ),
  );
});

/**
 * The characters the pieces box draws from: each of XML's whitespace characters but one, and two
 * letters.
 */
const alphabet = [" ", "\t", "\n", "a", "b"] as const;

/**
 * Every text of at most 4 characters over {@link alphabet}: the pieces box.
 */
const texts: Gen<string> = (source) =>
  source.draw(array(element(alphabet), { max: 4, min: 0 })).join("");

/**
 * Whether a character is XML whitespace.
 *
 * @param character - The character.
 * @returns Whether it is.
 */
const isWhitespace = (character: string): boolean => [" ", "\t", "\n", "\r"].includes(character);

/**
 * A situation the pieces box must reach.
 */
type PieceSituation =
  | "all whitespace"
  | "empty"
  | "inner whitespace"
  | "outer whitespace"
  | "plain";

describe("import/overlays/interactions.ts, pieces", () => {
  it.effect(
    "splits every lexical form into outer whitespace and its collapsed value, the one split E1_derived admits",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema Part 2 §4.3.6's collapse of an atomic
      // value's outer whitespace, read character by character, and the round trip
      // lead ‖ value ‖ trail = lexical.
      // Bound: every text of at most 4 characters over 3 whitespace characters and 2 letters, 781.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of at most 4 characters over space, tab, line feed, a and b",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<PieceSituation>([
              "all whitespace",
              "empty",
              "inner whitespace",
              "outer whitespace",
              "plain",
            ]),
            generator: texts,
            limit: 800,
            literal: JSON.stringify,
            oracle: { kind: "specification", name: "XML Schema Part 2 §4.3.6, collapse" },
            suite: "pantry/import/overlays-interactions-pieces",
          },
          (text: string, c) =>
            Effect.sync(() => {
              const characters = text.split("");
              const first = characters.findIndex((character) => !isWhitespace(character));
              const last = characters.findLastIndex((character) => !isWhitespace(character));
              const expected = first === -1 ? "" : characters.slice(first, last + 1).join("");
              const situation = (): PieceSituation => {
                if (text === "") {
                  return "empty";
                }

                if (first === -1) {
                  return "all whitespace";
                }

                if (expected.length < text.length) {
                  return "outer whitespace";
                }

                return expected.split("").some(isWhitespace) ? "inner whitespace" : "plain";
              };
              c.note(situation());

              const { lead, trail, value } = pieces(text);
              assert.strictEqual(`${lead}${value}${trail}`, text);
              assert.strictEqual(value, expected);
              assert.isTrue(`${lead}${trail}`.split("").every(isWhitespace));
              assert.isTrue(value !== "" || trail === "");
            }),
        ),
      ),
  );
});

/**
 * The defaults the oracle reads an unwritten count by, keyed `version kind name`.
 */
const oracleDefaults = lawsOf(grammar).defaults;

/**
 * Decide whether a kind is an element's a vocabulary names: no fixed kind and no foreign class.
 *
 * @param kind - The kind.
 * @returns Whether it is.
 */
const isElementKind = (kind: string): kind is XdmClosedElement<Composed>["kind"] =>
  !nonElementKinds.some((fixed) => fixed === kind) && !isForeignKind(kind);

/**
 * Decide whether an attribute name is a closed name, no open class.
 *
 * @param name - The name.
 * @returns Whether it is.
 */
const isClosedName = (name: string): name is ClosedName<Composed> =>
  !openClasses.some((open) => open === name);

/**
 * Take an attribute name as a closed name, failing the test on an open class.
 *
 * @param name - The name.
 * @returns The closed name.
 */
const closedName = (name: string): ClosedName<Composed> =>
  isClosedName(name) ? name : assert.fail(`${name} is an open class, which counts nothing`);

/**
 * The kinds whose counts `ChoiceBound` pairs, as element kinds, nonempty.
 */
const boundElementKinds = (() => {
  const kinds = ChoiceBound.rows.map(({ kind }) => kind).filter(isElementKind);

  return Arr.isReadonlyArrayNonEmpty(kinds)
    ? kinds
    : assert.fail("ChoiceBound holds no element kind");
})();

/**
 * One count case: a `ChoiceBound` kind, and each count's lexical form or none.
 */
interface CountCase {
  readonly kind: (typeof boundElementKinds)[number];
  readonly max: string | undefined;
  readonly min: string | undefined;
}

/**
 * Every count case: each `ChoiceBound` kind, its least unwritten, written, padded or written as no
 * count, and its most unwritten, written, signed or written as no count (GEN-A's
 * `max-choices="1abc"`, and a negative).
 */
const countCases: Gen<CountCase> = (source) => ({
  kind: source.draw(element(boundElementKinds)),
  max: source.draw(element([undefined, "3", "+2", "1abc", "-1"])),
  min: source.draw(element([undefined, "2", " 0 ", "x"])),
});

/**
 * A situation the count box must reach.
 */
type CountSituation =
  | "defaulted most"
  | "least written as no count"
  | "most written as no count"
  | "padded least"
  | "unwritten most without default"
  | "written";

/**
 * Read the XSD default of a count, as the oracle's table holds it.
 *
 * @param kind - The element's kind.
 * @param name - The count's attribute.
 * @returns The default's lexical form, none where the XSD gives none.
 */
const defaultOf = (kind: string, name: string): string | undefined =>
  oracleDefaults.get(`3.0.1 ${kind} ${name}`);

/**
 * Name the situations a count case is in.
 *
 * @param input - The case.
 * @param max - The kind's most count's attribute.
 * @returns The situations.
 */
const countSituationsOf = (input: CountCase, max: string): readonly CountSituation[] => {
  const situations: [CountSituation, boolean][] = [
    ["padded least", input.min === " 0 "],
    ["defaulted most", input.max === undefined && defaultOf(input.kind, max) !== undefined],
    [
      "unwritten most without default",
      input.max === undefined && defaultOf(input.kind, max) === undefined,
    ],
    ["written", input.max !== undefined && input.min !== undefined],
    ["least written as no count", input.min === "x"],
    ["most written as no count", input.max === "1abc" || input.max === "-1"],
  ];

  return situations.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * Write a count case as an item whose one element is of the case's kind, carrying the counts the
 * case writes.
 *
 * @param input - The case.
 * @param names - The kind's least and most attributes.
 * @param names.max - The most's.
 * @param names.min - The least's.
 * @returns The tree.
 */
const countTreeOf = (
  input: CountCase,
  names: { readonly max: ClosedName<Composed>; readonly min: ClosedName<Composed> },
): XdmDocument<Composed> => ({
  ...treeOf([]),
  root: elementOf(
    "qti-assessment-item",
    [["identifier", "item"]],
    [
      elementOf(
        input.kind,
        [
          ...(input.min === undefined ? [] : [[names.min, input.min] as const]),
          ...(input.max === undefined ? [] : [[names.max, input.max] as const]),
        ],
        [],
      ),
    ],
  ),
});

/**
 * Read one count of a case as the law oracle does: its collapsed form where written, else its XSD
 * default, and its value by the oracle's own map (`integerOf`), where that is an
 * `xs:nonNegativeInteger`'s.
 *
 * @param written - The count's lexical form, none where unwritten.
 * @param fallback - Its XSD default, none where the XSD gives none.
 * @returns The form and its integer, or none where the count has no value.
 */
const oracleCountOf = (written: string | undefined, fallback: string | undefined) => {
  const form = written === undefined ? fallback : written.trim();

  return Option.getOrUndefined(
    Option.flatMap(Option.fromUndefinedOr(form), (lexical) =>
      integerOf(lexical).pipe(
        Option.filter((integer) => integer >= 0n),
        Option.map((integer) => ({ form: lexical, integer })),
      ),
    ),
  );
};

describe("import/overlays/interactions.ts, counts", () => {
  it.effect(
    "gives each count a row of its own exactly where it has a value, written as a count or its XSD default, as the oracle reads it",
    (ctx) =>
      // Oracle: the oracle's own table of the declared attributes' XSD defaults
      // (`#pantry/test/oracle.ts` lawsOf, from the inventory leaf), and its reading of a count:
      // its own map of an integer's form (`integerOf`), a value only where it is a nonNegativeInteger's
      // (lane NIL's audit, B8; GEN-A's max-choices="1abc").
      // Bound: every ChoiceBound kind, with its least unwritten, written, padded or no count and
      // its most unwritten, written, signed or no count, 18 × 4 × 5 = 360 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every ChoiceBound kind with its least unwritten, written, padded or no count and its most unwritten, written, signed or no count",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<CountSituation>([
              "defaulted most",
              "least written as no count",
              "most written as no count",
              "padded least",
              "unwritten most without default",
              "written",
            ]),
            generator: countCases,
            limit: 400,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the XSDs' attribute defaults and the oracle's reading of a count",
            },
            suite: "pantry/import/overlays-interactions-counts",
          },
          (input: CountCase, c) =>
            Effect.sync(() => {
              const bound = ChoiceBound.rows.find(({ kind }) => kind === input.kind);
              const min = closedName(bound?.min ?? "");
              const max = closedName(bound?.max ?? "");
              c.noteAll(countSituationsOf(input, max));

              const rows = rowsOf(countTreeOf(input, { max, min }), ids);
              const least = oracleCountOf(input.min, defaultOf(input.kind, min));
              const most = oracleCountOf(input.max, defaultOf(input.kind, max));
              const [counted] = rows.CountBound.values();
              const [leastRow] = rows.LeastCount.values();
              const [mostRow] = rows.MostCount.values();
              const [range] = rows.CountRange.values();

              assert.deepStrictEqual(
                [counted?.minWritten, counted?.maxWritten],
                [input.min !== undefined, input.max !== undefined],
                input.kind,
              );
              assert.deepStrictEqual(
                leastRow === undefined ? undefined : [leastRow.least, leastRow.leastValue],
                least === undefined ? undefined : [least.form, least.integer],
                `${input.kind}'s least ${String(input.min)}`,
              );
              assert.deepStrictEqual(
                mostRow === undefined ? undefined : [mostRow.most, mostRow.mostValue],
                most === undefined ? undefined : [most.form, most.integer],
                `${input.kind}'s most ${String(input.max)}`,
              );
              assert.deepStrictEqual(
                range === undefined ? undefined : [range.leastValue, range.mostValue],
                least === undefined || most === undefined
                  ? undefined
                  : [least.integer, most.integer],
                `${input.kind}'s range`,
              );
            }),
        ),
      ),
  );
});

/**
 * The test document of the section box, the assembly every placement sits in.
 */
const testDocument = idOf(1000);

/**
 * The section documents of the section box, each with the references it makes.
 */
const sectionDocuments = [
  {
    document: idOf(2000),
    names: [
      { attribute: "outcome-identifier", identifier: "SCORED", kind: "qti-feedback-block" },
      { attribute: "identifier", identifier: "UNDECLARED", kind: "qti-printed-variable" },
    ],
  },
  {
    document: idOf(3000),
    names: [
      {
        attribute: "outcome-identifier",
        identifier: "completionStatus",
        kind: "qti-feedback-inline",
      },
    ],
  },
  { document: idOf(4000), names: [] },
] as const;

/**
 * One placement of the section box: the section document it places, by its index, and its own
 * placements.
 */
interface Placement {
  readonly children: readonly Placement[];
  readonly section: 0 | 1 | 2;
}

/**
 * The placements a test of the section box holds: up to 2, each with up to 1 placement inside.
 */
const placements: Gen<readonly Placement[]> = array(
  (source) => ({
    children: source.draw(
      array((inner) => ({ children: [], section: inner.draw(element([0, 1, 2] as const)) }), {
        max: 1,
        min: 0,
      }),
    ),
    section: source.draw(element([0, 1, 2] as const)),
  }),
  { max: 2, min: 0 },
);

/**
 * Write the section box's assembly: the test's root instance and its placements' instances, each
 * numbered by the walk.
 *
 * @param tree - The placements.
 * @returns The root instance and each section instance with the document it places.
 */
const assemblyOf = (tree: readonly Placement[]) => {
  let next = 5000;
  const placed: { readonly document: NodeId; readonly id: NodeId }[] = [];
  const fields = (
    id: NodeId,
    document: NodeId,
    rootKind: "qti-assessment-section" | "qti-assessment-test",
  ) => ({
    assemblyKind: "qti-assessment-test" as const,
    document,
    id,
    mixes: false,
    part: testDocument,
    replaced: false,
    rootKind,
    site: id,
    siteLooseChain: false,
    siteMixes: false,
    sitePart: testDocument,
    siteReplaced: false,
    siteStart: 0n,
  });
  const member = (placement: Placement): InstanceMember => {
    next += 1;
    const id = idOf(next);
    const { document } = sectionDocuments[placement.section];
    placed.push({ document, id });

    return {
      ...fields(id, document, "qti-assessment-section"),
      children: placement.children.map(member),
    };
  };
  const root: InstanceRoot = {
    ...fields(testDocument, testDocument, "qti-assessment-test"),
    assembly: testDocument,
    children: tree.map(member),
  };

  return { placed, root };
};

/**
 * The declaration of the section box's test: an outcome `SCORED`, a single identifier.
 */
const scored: Addition<typeof Declaration> = {
  baseType: "identifier",
  cardinality: "single",
  cardinalityLexical: "single",
  declarationKind: "qti-outcome-declaration",
  document: testDocument,
  identifier: "SCORED",
  identifierLead: "",
  identifierLexical: "SCORED",
  identifierTrail: "",
  kind: "qti-outcome-declaration",
  nearest: testDocument,
  node: idOf(1001),
  parent: idOf(1000),
  start: 2n,
  version: "3.0.1",
};

describe("import/overlays/interactions.ts, section references", () => {
  it.effect(
    "places every section instance under its test and resolves each of its document's references once there",
    (ctx) =>
      // Oracle: a second implementation, the box's own list of placements and of each section
      // document's references, resolved by hand: SCORED to the test's declaration, completionStatus
      // to the built-in, which names no declaration, and UNDECLARED to none (port audit A45; lane
      // NIL's NS2: no declaration row, never the nil uuid).
      // Bound: every test of up to 2 placements of 3 section documents, each with up to 1
      // placement inside, 1 + 3·4 + (3·4)² = 157 trees.
      searched(
        ctx,
        exhaust(
          {
            box: "every test of up to 2 placements of 3 section documents, each with up to 1 placement inside",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"nested" | "none" | "repeated">([
              "nested",
              "none",
              "repeated",
            ]),
            generator: placements,
            limit: 200,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the box's placements resolved by hand",
            },
            suite: "pantry/import/overlays-interactions-sections",
          },
          (tree: readonly Placement[], c) =>
            Effect.sync(() => {
              const { placed, root } = assemblyOf(tree);
              const sections = new Set(placed.map(({ document }) => document));
              c.noteAll([
                ...(placed.length === 0 ? ["none" as const] : []),
                ...(tree.some(({ children }) => children.length > 0) ? ["nested" as const] : []),
                ...(sections.size < placed.length ? ["repeated" as const] : []),
              ]);

              const named = sectionDocuments.flatMap(({ document, names }) =>
                names.map((name, at) => ({
                  ...name,
                  document,
                  node: idOf(Number.parseInt(document.slice(-4), 16) + at + 1),
                })),
              );
              const rows = sectionRowsOf({
                contexts: [],
                declarations: [scored],
                feedbacks: named.filter(({ attribute }) => attribute === "outcome-identifier"),
                instances: [root],
                prints: named.filter(({ attribute }) => attribute !== "outcome-identifier"),
                templates: [],
              });
              const resolved = [
                ...rows.SectionFeedbackRef.values(),
                ...rows.SectionPrintedRef.values(),
              ];

              assert.sameMembers(
                [...rows.SectionScope.keys()],
                placed.map(({ id }) => id),
              );

              const expected = placed.flatMap(({ document, id }) =>
                (
                  sectionDocuments.find((section) => section.document === document)?.names ?? []
                ).map(({ identifier }) => `${id} ${identifier}`),
              );
              assert.sameMembers(
                resolved.map(({ identifier, instance }) => `${instance} ${identifier}`),
                expected,
              );
              for (const row of rows.SectionPrintedRef.values()) {
                assert.notStrictEqual(row.attribute, "outcome-identifier");
              }

              for (const row of resolved) {
                assert.strictEqual(row.assembly, testDocument);
              }

              assert.sameMembers(
                [
                  ...rows.SectionFeedbackRefDeclaration.values(),
                  ...rows.SectionPrintedRefDeclaration.values(),
                ].map(
                  ({ declaration, declarationKind, identifier, instance }) =>
                    `${instance} ${identifier} ${declaration} ${declarationKind}`,
                ),
                resolved
                  .filter(({ identifier }) => identifier === "SCORED")
                  .map(
                    ({ identifier, instance }) =>
                      `${instance} ${identifier} ${scored.node} qti-outcome-declaration`,
                  ),
              );
            }),
        ),
      ),
  );
});

/**
 * One choice or hottext of the choice-name box: its kind and its `identifier` as written.
 */
interface NameMark {
  readonly kind: "qti-gap-text" | "qti-hottext" | "qti-simple-choice";
  readonly name: " A" | "A" | "B";
}

/**
 * One case of the choice-name box: an item's response declarations, each with its `identifier` as
 * written or none, and the choices and hottexts of its body.
 */
interface NameCase {
  readonly declarations: readonly (" B\n" | "A" | undefined)[];
  readonly marks: readonly NameMark[];
}

/**
 * The choice-name box: 0 to 2 declarations, each named `A`, ` B` padded or nothing, and 0 to 2
 * choices and hottexts, each a simple choice, a gap text or a hottext named `A`, ` A` padded or
 * `B`.
 */
const nameCases: Gen<NameCase> = (source) => ({
  declarations: source.draw(array(element(["A", " B\n", undefined] as const), { max: 2, min: 0 })),
  marks: source.draw(
    array(
      (inner) => ({
        kind: inner.draw(element(["qti-simple-choice", "qti-gap-text", "qti-hottext"] as const)),
        name: inner.draw(element(["A", " A", "B"] as const)),
      }),
      { max: 2, min: 0 },
    ),
  ),
});

/**
 * Write a choice-name case as the tree shred would give: the item's declarations, then its body of
 * choices and hottexts.
 *
 * @param input - The case.
 * @returns The tree.
 */
const nameTreeOf = (input: NameCase): XdmDocument<Composed> => {
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };

  return {
    _tag: "document",
    charset: "UTF-8",
    declaration: Option.none(),
    doctype: Option.none(),
    epilog: [],
    exportCharset: "UTF-8",
    prolog: [],
    root: elementOf(
      "qti-assessment-item",
      [["identifier", "item"]],
      [
        ...input.declarations.flatMap((name) => [
          ws,
          elementOf(
            "qti-response-declaration",
            [
              ...(name === undefined ? [] : [["identifier", name] as const]),
              ["cardinality", "single"],
              ["base-type", "identifier"],
            ],
            [],
          ),
        ]),
        ws,
        elementOf(
          "qti-item-body",
          [],
          input.marks.flatMap(({ kind, name }) => [
            ws,
            elementOf(kind, [["identifier", name]], []),
          ]),
        ),
      ],
    ),
    version: "3.0.1",
  };
};

/**
 * A situation the choice-name box must reach.
 */
type NameSituation =
  | "choice named as a declaration"
  | "declaration without identifier"
  | "hottext named as a declaration"
  | "no choice"
  | "one name twice among choices"
  | "padded name";

describe("import/overlays/interactions.ts, choice names", () => {
  it.effect(
    "writes one ChoiceVariableName row per identifier a choice, a hottext or a declaration of the document bears, and no other",
    (ctx) =>
      // Oracle: the specification as a checker, reading 104's projection read off the tree: the set
      // of every choice's and hottext's identifier and every declaration's, each collapsed (XML
      // Schema Part 2 §4.3.6), under the document node and the item's root kind. A declaration
      // without one has no Declaration row and names nothing (lane NIL's audit, B10), so AL3
      // refuses it alone.
      // Bound: 0 to 2 declarations over 3 names by 0 to 2 marks over 3 kinds and 3 names,
      // 13 × 91 = 1,183.
      searched(
        ctx,
        exhaust(
          {
            box: "0 to 2 declarations named A, padded B or nothing, by 0 to 2 simple choices, gap texts or hottexts named A, padded A or B",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<NameSituation>([
              "choice named as a declaration",
              "declaration without identifier",
              "hottext named as a declaration",
              "no choice",
              "one name twice among choices",
              "padded name",
            ]),
            generator: nameCases,
            limit: 1200,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "reading 104's projection, read off the tree" },
            suite: "pantry/import/overlays-interactions-choice-names",
          },
          (input: NameCase, c) =>
            Effect.sync(() => {
              const declared = input.declarations.flatMap((name) =>
                name === undefined ? [] : [name.trim()],
              );
              const marked = input.marks.map(({ kind, name }) => ({ kind, name: name.trim() }));
              c.noteAll(
                (
                  [
                    [
                      "choice named as a declaration",
                      marked.some(
                        ({ kind, name }) => kind !== "qti-hottext" && declared.includes(name),
                      ),
                    ],
                    ["declaration without identifier", input.declarations.includes(undefined)],
                    [
                      "hottext named as a declaration",
                      marked.some(
                        ({ kind, name }) => kind === "qti-hottext" && declared.includes(name),
                      ),
                    ],
                    ["no choice", marked.length === 0],
                    [
                      "one name twice among choices",
                      new Set(marked.map(({ name }) => name)).size < marked.length,
                    ],
                    [
                      "padded name",
                      [...input.declarations, ...input.marks.map(({ name }) => name)].some(
                        (name) => name !== undefined && name !== name.trim(),
                      ),
                    ],
                  ] as const
                ).flatMap(([situation, holds]) => (holds ? [situation] : [])),
              );

              const document = idOf(0);
              const expected = [...new Set([...marked.map(({ name }) => name), ...declared])];
              const rows = rowsOf(nameTreeOf(input), ids).ChoiceVariableName;

              assert.sameMembers(
                [...rows.keys()],
                expected.map((name) => JSON.stringify([document, name])),
              );
              for (const name of expected) {
                assert.deepStrictEqual(rows.get(JSON.stringify([document, name])), {
                  document,
                  identifier: name,
                  rootKind: "qti-assessment-item",
                });
              }
            }),
        ),
      ),
  );
});

/**
 * The declarations the reference box may write, each by its identifier: an outcome, a template
 * variable and a response, each of one type.
 */
const referencedDeclarations = [
  { baseType: "identifier", identifier: "OUT", kind: "qti-outcome-declaration" },
  { baseType: "integer", identifier: "TPL", kind: "qti-template-declaration" },
  { baseType: "identifier", identifier: "RSP", kind: "qti-response-declaration" },
] as const;

/**
 * The references the reference box makes, each by its element and attribute, with the declaration
 * kinds the information model lets it name, written out by hand from the specification: a
 * feedback's outcome (§5.49.1: "The identifier of an outcome variable"), a template element's
 * template variable (§5.145.1: "The identifier of a template variable") and a printed variable's
 * variable (§7.30.6: "The outcome variable or template variable must have been defined").
 */
const referenceKinds = [
  {
    attribute: "outcome-identifier",
    kind: "qti-feedback-inline",
    names: ["qti-outcome-declaration"],
  },
  {
    attribute: "template-identifier",
    kind: "qti-template-inline",
    names: ["qti-template-declaration"],
  },
  {
    attribute: "identifier",
    kind: "qti-printed-variable",
    names: ["qti-outcome-declaration", "qti-template-declaration"],
  },
] as const;

/**
 * The built-in variables of an item (information model §2.2.2), which stand as a declaration but
 * have none: a reference to one names no declaration.
 */
const itemBuiltIns: ReadonlySet<string> = new Set([
  "QTI_CONTEXT",
  "completionStatus",
  "duration",
  "numAttempts",
]);

/**
 * One case of the reference box: the declarations the item writes, the reference its body makes,
 * and the name it makes it to.
 */
interface ReferenceCase {
  readonly declared: readonly (typeof referencedDeclarations)[number][];
  readonly name: "OUT" | "RSP" | "TPL" | "UNDECLARED" | "completionStatus" | "numAttempts";
  readonly reference: (typeof referenceKinds)[number];
}

/**
 * The reference box: every subset of the three declarations, each of the three references, and
 * each of six names, a declaration's of each kind, one no declaration holds, and two built-ins.
 */
const referenceCases: Gen<ReferenceCase> = (source) => ({
  declared: referencedDeclarations.filter(() => source.draw(element([false, true]))),
  name: source.draw(
    element(["OUT", "TPL", "RSP", "UNDECLARED", "completionStatus", "numAttempts"] as const),
  ),
  reference: source.draw(element(referenceKinds)),
});

/**
 * Write a reference case as the tree shred would give: the item's declarations, each with its
 * `identifier` first, then a body holding the one reference, its attribute first.
 *
 * @param input - The case.
 * @returns The tree.
 */
const referenceTreeOf = (input: ReferenceCase): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "UTF-8",
  prolog: [],
  root: elementOf(
    "qti-assessment-item",
    [["identifier", "item"]],
    [
      ...input.declared.map(({ baseType, identifier, kind }) =>
        elementOf(
          kind,
          [
            ["identifier", identifier],
            ["cardinality", "single"],
            ["base-type", baseType],
          ],
          [],
        ),
      ),
      elementOf(
        "qti-item-body",
        [],
        [elementOf(input.reference.kind, [[input.reference.attribute, input.name]], [])],
      ),
    ],
  ),
  version: "3.0.1",
});

/**
 * Read the rows of the relation a reference of the box writes, and of its declarations.
 *
 * @param rows - The document's rows.
 * @param kind - The reference's element.
 * @returns The two relations' rows.
 */
const referenceRelationOf = (rows: InteractionRows, kind: ReferenceCase["reference"]["kind"]) => {
  switch (kind) {
    case "qti-feedback-inline": {
      return { declarations: rows.FeedbackRefDeclaration, references: rows.FeedbackRef };
    }
    case "qti-printed-variable": {
      return {
        declarations: rows.PrintedVariableRefDeclaration,
        references: rows.PrintedVariableRef,
      };
    }
    case "qti-template-inline": {
      return { declarations: rows.TemplateRefDeclaration, references: rows.TemplateRef };
    }
    default: {
      return kind satisfies never;
    }
  }
};

/**
 * A situation the reference box must reach.
 */
type ReferenceSituation =
  | "a built-in"
  | "a declaration of a kind it may not name"
  | "a declaration it may name"
  | "a name no declaration holds";

/**
 * Name the situation of a reference case.
 *
 * @param input - What the case's name is.
 * @param input.allowed - Whether a declaration the reference may name holds it.
 * @param input.builtIn - Whether it is a built-in variable's.
 * @param input.held - Whether any declaration holds it.
 * @returns The situation.
 */
const referenceSituationOf = (input: {
  readonly allowed: boolean;
  readonly builtIn: boolean;
  readonly held: boolean;
}): ReferenceSituation => {
  if (input.builtIn) {
    return "a built-in";
  }

  if (input.allowed) {
    return "a declaration it may name";
  }

  return input.held ? "a declaration of a kind it may not name" : "a name no declaration holds";
};

describe("import/overlays/interactions.ts, content reference declarations", () => {
  it.effect(
    "writes each content reference, and its declaration row exactly where the name is a declaration's of a kind the reference may name and no built-in's",
    (ctx) =>
      // Oracle: the specification as a checker, written by hand: the declaration kinds each
      // reference may name (§5.49.1, §5.145.1, §7.30.6) and the item's built-in variables
      // (§2.2.2), read off the box's own declarations. A reference that names no declaration it
      // may name has no declaration row, and its law refuses it (lane NIL's NS2: a missing value
      // is a row of its own relation, never the nil uuid).
      // Bound: 8 subsets of 3 declarations by 3 references by 6 names, 144.
      searched(
        ctx,
        exhaust(
          {
            box: "every subset of an outcome, a template and a response declaration, by a feedback's, a template inline's or a printed variable's reference to one of them, an undeclared name, completionStatus or numAttempts",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<ReferenceSituation>([
              "a built-in",
              "a declaration of a kind it may not name",
              "a declaration it may name",
              "a name no declaration holds",
            ]),
            generator: referenceCases,
            limit: 200,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the information model's content references and built-in variables, by hand",
            },
            suite: "pantry/import/overlays-interactions-reference-declarations",
          },
          (input: ReferenceCase, c) =>
            Effect.sync(() => {
              const doc = referenceTreeOf(input);
              const walked = walk(doc);
              const named = walked.find(({ kind }) => kind === input.reference.kind);
              const holds = walked.filter(
                ({ kind, name }) => name === input.name && kind !== input.reference.kind,
              );
              const allowed = holds.find(({ kind }) =>
                input.reference.names.some((held) => held === kind),
              );
              const builtIn = itemBuiltIns.has(input.name);
              const declaration = builtIn ? undefined : allowed;
              c.note(
                referenceSituationOf({
                  allowed: allowed !== undefined,
                  builtIn,
                  held: holds.length > 0,
                }),
              );

              const rows = rowsOf(doc, ids);
              const key = JSON.stringify([named?.id, input.reference.attribute]);
              const relation = referenceRelationOf(rows, input.reference.kind);
              const reference = {
                attribute: input.reference.attribute,
                document: idOf(0),
                identifier: input.name,
                kind: input.reference.kind,
                node: named?.id,
              };

              assert.deepStrictEqual([...relation.references], [[key, reference]]);
              assert.deepStrictEqual(
                [...relation.declarations],
                declaration === undefined
                  ? []
                  : [
                      [
                        key,
                        {
                          ...reference,
                          baseType: referencedDeclarations.find(
                            ({ kind }) => kind === declaration.kind,
                          )?.baseType,
                          cardinality: "single",
                          declaration: declaration.id,
                          declarationKind: declaration.kind,
                        },
                      ],
                    ],
                Formatter.format(input),
              );
            }),
        ),
      ),
  );
});
