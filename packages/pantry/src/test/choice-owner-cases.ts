/**
 * The choices and their interactions, as packages (lane NIL's audit, B5 and B6): every case an
 * item whose interactions hold their choices, each interaction with or without its
 * `response-identifier`, and maybe a fragment holding a gap, placed in a gap-match, in the body, or
 * nowhere.
 *
 * A choice's interaction is its nearest (N8). Before `Interaction` and `ChoiceInteraction`, it was
 * a field of `Choice`, the counted family's group key under `Binding`, which held a document node
 * where no interaction enclosed the choice, and named no owner where the interaction wrote no
 * `response-identifier`. grizzle refuses such an insert on the host, before any statement, so a gap
 * outside a gap-match was refused under no rule of the schema, where the oracle names N6 ancestry,
 * and an interaction with no `response-identifier` likewise, where it names AL3 (a missing value is
 * a row of its own relation, never a sentinel).
 *
 * Each case says what the law oracle names it by ({@link expectedRules}); `src/test/choice-
 * owner.oracle.test.ts` holds the oracle and the importer's rows to it, and `src/import/
 * choice-owner.db.test.ts` the database.
 */
import { Array as Arr } from "effect";
import { array, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { swarm, swarmChoice, weightOf } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * The interactions a case writes, each holding the choices its content model admits.
 */
export const interactionKinds = [
  "choice",
  "order",
  "associate",
  "gapMatch",
  "inlineChoice",
] as const;

/**
 * An interaction of a case.
 */
export type InteractionKind = (typeof interactionKinds)[number];

/**
 * Where a case places its gap fragment, a `p` holding one `qti-gap`: in a gap-match of its own
 * (lawful), in the item body, or in no include at all. `none` writes no fragment.
 */
export const gapPlacements = ["none", "gapMatch", "body", "unplaced"] as const;

/**
 * A gap fragment's placement.
 */
export type GapPlacement = (typeof gapPlacements)[number];

/**
 * One interaction of a case: its kind, and whether it writes its `response-identifier`.
 */
export interface CaseInteraction {
  readonly kind: InteractionKind;
  readonly named: boolean;
}

/**
 * A case: its interactions, in order, and its gap fragment's placement.
 */
export interface ChoiceOwnerCase {
  readonly gap: GapPlacement;
  readonly interactions: readonly CaseInteraction[];
}

/**
 * The ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XInclude namespace.
 */
const xi = "http://www.w3.org/2001/XInclude";

/**
 * The manifest of a case: its item, and its fragment where it writes one.
 *
 * @param fragment - Whether the case writes a fragment.
 * @returns The manifest's text.
 */
const manifestOf = (fragment: boolean): string => {
  const item = `<resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>`;
  const part = fragment
    ? `<resource identifier="F" type="imsqti_fragment_xmlv3p0" href="f.xml"><file href="f.xml"/></resource>`
    : "";

  return `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources>${item}${part}</resources></manifest>`;
};

/**
 * The fragment a case's gap stands in: a `p` holding one gap.
 */
const gapFragment = `<p xmlns="${asi}">a <qti-gap identifier="GF"/> b</p>`;

/**
 * The response declaration an interaction of each kind binds, by its identifier: a type its
 * interaction fits.
 */
const declarationOf = (kind: InteractionKind, identifier: string): string => {
  const typed = {
    associate: `cardinality="multiple" base-type="pair"`,
    choice: `cardinality="single" base-type="identifier"`,
    gapMatch: `cardinality="multiple" base-type="directedPair"`,
    inlineChoice: `cardinality="single" base-type="identifier"`,
    order: `cardinality="ordered" base-type="identifier"`,
  }[kind];

  return `<qti-response-declaration identifier="${identifier}" ${typed}/>`;
};

/**
 * Each interaction kind's markup, given its `response-identifier` attribute (empty where unnamed)
 * and a choice's name of a letter, which its place among the case's interactions suffixes, so no
 * two choices of a kind share an identifier.
 */
const markupOf: Readonly<
  Record<InteractionKind, (binds: string, c: (letter: string) => string) => string>
> = {
  associate: (binds, c) =>
    `<qti-associate-interaction${binds} max-associations="1"><qti-simple-associable-choice identifier="${c("A")}" match-max="1">a</qti-simple-associable-choice><qti-simple-associable-choice identifier="${c("B")}" match-max="1">b</qti-simple-associable-choice></qti-associate-interaction>`,
  choice: (binds, c) =>
    `<qti-choice-interaction${binds} max-choices="1"><qti-simple-choice identifier="${c("A")}">a</qti-simple-choice><qti-simple-choice identifier="${c("B")}">b</qti-simple-choice></qti-choice-interaction>`,
  gapMatch: (binds, c) =>
    `<qti-gap-match-interaction${binds} max-associations="1"><qti-gap-text identifier="${c("W")}" match-max="1">w</qti-gap-text><p>x <qti-gap identifier="${c("G")}"/></p></qti-gap-match-interaction>`,
  inlineChoice: (binds, c) =>
    `<p>pick <qti-inline-choice-interaction${binds}><qti-inline-choice identifier="${c("A")}">a</qti-inline-choice><qti-inline-choice identifier="${c("B")}">b</qti-inline-choice></qti-inline-choice-interaction></p>`,
  order: (binds, c) =>
    `<qti-order-interaction${binds}><qti-simple-choice identifier="${c("A")}">a</qti-simple-choice><qti-simple-choice identifier="${c("B")}">b</qti-simple-choice></qti-order-interaction>`,
};

/**
 * An interaction's markup.
 *
 * @param kind - The interaction's kind.
 * @param at - Its place among the case's interactions, which names its response and its choices.
 * @param named - Whether it writes its `response-identifier`.
 * @returns The markup.
 */
const interactionOf = (kind: InteractionKind, at: number, named: boolean): string =>
  markupOf[kind](
    named ? ` response-identifier="R${String(at)}"` : "",
    (letter) => `${letter}${String(at)}`,
  );

/**
 * The include that places a case's gap fragment.
 */
const include = `<xi:include href="f.xml"/>`;

/**
 * The markup each gap placement adds to the item body: a gap-match of its own, `RG`, named, that
 * includes the fragment beside a gap text; a `div` that includes it; or nothing, for a fragment
 * listed and never included, and for no fragment.
 */
const hostOf: Readonly<Record<GapPlacement, readonly string[]>> = {
  body: [`<div>${include}</div>`],
  gapMatch: [
    `<qti-gap-match-interaction response-identifier="RG" max-associations="1"><qti-gap-text identifier="WG" match-max="1">w</qti-gap-text><p>y</p>${include}</qti-gap-match-interaction>`,
  ],
  none: [],
  unplaced: [],
};

/**
 * Write a case's package.
 *
 * - The item declares one response per interaction, `R0` onward, bound only where the interaction is
 *   named.
 * - A gap placed in a gap-match is placed in one of its own, `RG`, named, beside a gap text, so the
 *   gap-match's choices are its own gap text and the fragment's gap: two.
 * - A gap placed in the body is included in a `div`; an unplaced one is listed and never included.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
export const choiceOwnerPackage = (drawn: ChoiceOwnerCase): PackageEntries => {
  const encoder = new TextEncoder();
  const host = hostOf[drawn.gap];
  const declarations = [
    ...drawn.interactions.map(({ kind }, at) => declarationOf(kind, `R${String(at)}`)),
    ...(drawn.gap === "gapMatch" ? [declarationOf("gapMatch", "RG")] : []),
  ];
  const body = [
    ...drawn.interactions.map(({ kind, named }, at) => interactionOf(kind, at, named)),
    ...host,
  ];
  const item = `<qti-assessment-item xmlns="${asi}" xmlns:xi="${xi}" identifier="I" title="Item" time-dependent="false">${declarations.join("")}<qti-item-body>${body.join("")}</qti-item-body></qti-assessment-item>`;
  const fragment = drawn.gap !== "none";

  return new Map([
    ...(fragment ? [["f.xml", encoder.encode(gapFragment)] as const] : []),
    ["imsmanifest.xml", encoder.encode(manifestOf(fragment))],
    ["item.xml", encoder.encode(item)],
  ]);
};

/**
 * The rules the law oracle names a case by, sorted; none for a case it accepts:
 *
 * - `required-attribute`, AL3, where an interaction writes no `response-identifier`;
 * - `ancestry-ban`, N6, where the gap stands outside every gap-match: in the body, or in a fragment
 *   no include places, whose context holds no flag.
 *
 * @param drawn - The case.
 * @returns The rules.
 */
export const expectedRules = (drawn: ChoiceOwnerCase): readonly string[] =>
  [
    ...(drawn.interactions.some(({ named }) => !named) ? ["required-attribute"] : []),
    ...(drawn.gap === "body" || drawn.gap === "unplaced" ? ["ancestry-ban"] : []),
  ].toSorted();

/**
 * The small scope: one interaction of each kind, named or not, under each gap placement.
 */
export const smallScope: readonly ChoiceOwnerCase[] = interactionKinds.flatMap((kind) =>
  [true, false].flatMap((named) =>
    gapPlacements.map((gap) => ({ gap, interactions: [{ kind, named }] })),
  ),
);

/**
 * The features a drawn case's swarm weighs: each interaction kind, an unnamed interaction, and each
 * gap placement.
 */
export const caseFeatures = [...interactionKinds, "unnamed", ...gapPlacements] as const;

/**
 * A feature of a drawn case.
 */
export type CaseFeature = (typeof caseFeatures)[number];

/**
 * Draw a case under a swarm: one to four interactions of the kinds it weighs, each unnamed as often
 * as it weighs `unnamed`, and a gap placement it weighs.
 *
 * @param drawn - The swarm.
 * @returns The generator.
 */
const caseUnder =
  (drawn: Swarm<CaseFeature>): Gen<ChoiceOwnerCase> =>
  (source) => {
    const unnamed = weightOf(drawn, "unnamed");
    const interactions = source.draw(
      array(
        (inner) => ({
          kind: inner.draw(swarmChoice(drawn, interactionKinds)),
          named: unnamed === 0 || inner.draw(int(0, 3)) >= unnamed,
        }),
        { max: 4, min: 1 },
      ),
    );

    return { gap: source.draw(swarmChoice(drawn, gapPlacements)), interactions };
  };

/**
 * The drawn cases: a swarm over {@link caseFeatures}, then a case under it.
 */
export const drawnCases: Gen<ChoiceOwnerCase> = (source) =>
  source.draw(caseUnder(source.draw(swarm(Arr.make(...caseFeatures)))));

/**
 * Show a case.
 *
 * @param drawn - The case.
 * @returns Its interactions, each unnamed one starred, and its gap placement.
 */
export const shownCase = (drawn: ChoiceOwnerCase): string =>
  `${drawn.interactions.map(({ kind, named }) => (named ? kind : `${kind}*`)).join(",")} gap:${drawn.gap}`;
