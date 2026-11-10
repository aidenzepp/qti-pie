import { assert, describe, it } from "@effect/vitest";
import { Cause, Effect, Exit, Option, Result } from "effect";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import { configure } from "#plate/index.ts";
import type { Accepted, Configuration, Element, Node, Verdict } from "#plate/index.ts";
import { message } from "#plate/messages.ts";
import { isStubbed, regionsOf } from "#plate/model/interactions.ts";
import type {
  BodyElement,
  BodyNode,
  InlineChoiceInteraction,
  Item,
  PrintedVariable,
  TemplateVisibility,
} from "#plate/model/item.ts";
import { outcomeDefaults, unrunTemplateProcessing } from "#plate/model/record.ts";
import type { RedactRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import { templateShows } from "#plate/payload.ts";
import { refusalRules } from "#plate/validate/refusal.ts";
import { attribute, checkTree, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import {
  acceptedOf,
  openCorpus,
  recordStates,
  sweepInstance,
  sweepSeeds,
  templated,
  threeStates,
} from "#plate/test/sweep.ts";
import type { Member, RecordState, RenderState } from "#plate/test/sweep.ts";

/**
 * Opening the corpus (about 800 members) and rendering every accepted item in three states, an
 * item whose template processing runs under each sweep seed's record and with none, runs in
 * seconds here; the bound leaves room for a slow machine without letting a hung run stall the
 * suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The Notice part's `data-slot` marker, read through the part table.
 */
const noticeSlot = rowFor("item", "notice").slot;

/**
 * The `data-slot` markers of an Inline Choice's Control, Placeholder and Option parts, read through
 * the part table.
 */
const inlineChoiceSlots = {
  control: rowFor("inline-choice-interaction", "control").slot,
  option: rowFor("inline-choice-interaction", "option").slot,
  placeholder: rowFor("inline-choice-interaction", "placeholder").slot,
} as const;

/**
 * The verdicts that carry an accepted document.
 */
const acceptingVerdicts: ReadonlySet<Verdict["verdict"]> = new Set([
  "accepted",
  "accepted-with-unsupported",
]);

/**
 * The kinds of place a refusal can point at.
 */
const locationKinds: ReadonlySet<string> = new Set(["document", "path", "position"]);

/**
 * List the elements of a tree in document order, the root first.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the verdicts the sweep opened, by member. A member `open` let a defect escape from has no
 * verdict and is left out here; the first test names it.
 *
 * @param members The opened members.
 * @returns Each member that has a verdict, with it.
 */
const verdictsOf = (members: readonly Member[]): readonly (readonly [Member, Verdict])[] =>
  members.flatMap((member) =>
    Exit.match(member.verdict, {
      onFailure: () => [],
      onSuccess: (verdict) => [[member, verdict] as const],
    }),
  );

/**
 * Remove each of a multiset's values once per occurrence in another.
 *
 * @param from The values, with repeats.
 * @param taken The values to remove, with repeats.
 * @returns What stays of `from`, in its order.
 */
const without = (from: readonly string[], taken: readonly string[]): readonly string[] => {
  const left = [...taken];

  return from.filter((value) => {
    const index = left.indexOf(value);
    if (index === -1) {
      return true;
    }

    left.splice(index, 1);

    return false;
  });
};

/**
 * Parse one state's HTML into its single root element.
 *
 * @param html The state's HTML.
 * @returns The root element, or none when the HTML is not exactly one element.
 */
const rootOf = (html: string): Option.Option<Element> => {
  const parsed = parseHtml(html);
  const [root] = parsed;

  return parsed.length === 1 && root?.kind === "element" ? Option.some(root) : Option.none();
};

/**
 * The feature the notices name once when a choice is withheld: the attribute that gives a choice
 * its template visibility. A withheld choice is absent from its interaction, so no body node
 * carries this notice and the HTML shows none for it; the redaction sweep
 * (`src/corpus.redact.test.ts`) checks that the redacted item's notices name it.
 */
const choiceNotice = "template-identifier";

/**
 * Give the values a redaction shows an item by, as the sweep passes them: the record state's
 * record for an item whose template processing runs, none with no record; and, for any other
 * item, rendered with no record, the values its first attempt starts with (H3): each template
 * variable at its declared default, else NULL, none where its template processing does not run,
 * and each outcome at its starting value.
 *
 * @param item The item.
 * @param state The record state, for an item whose template processing runs; none for any other.
 * @returns The values, or none for an item whose template processing runs and no record.
 */
const valuesOf = (item: Item, state: Option.Option<RecordState>): Option.Option<RedactRecord> =>
  Option.match(state, {
    onNone: () =>
      Option.some({
        outcomes: outcomeDefaults(item),
        templates: unrunTemplateProcessing(item)
          ? {}
          : Object.fromEntries(
              Array.from(item.templates, ([identifier, declaration]) => [
                identifier,
                Option.getOrElse(declaration.defaultValue, () =>
                  nullOf(declaration.baseType, declaration.cardinality),
                ),
              ]),
            ),
      }),
    onSome: (found) => found.record,
  });

/**
 * Give the variables a printed variable needs a value of: the one it prints, and any its `base` or
 * `index` names.
 *
 * @param node The printed variable.
 * @returns Their identifiers.
 */
const printedNames = (node: PrintedVariable): readonly string[] => [
  node.identifier,
  ...[node.base, ...Option.toArray(node.index)].flatMap((written) =>
    written._tag === "ref" ? [written.identifier] : [],
  ),
];

/**
 * Report whether a body element is a `param` that stands in for a template variable: its `value`
 * names a template variable declared `param-variable="true"` (the information model's Param
 * `value`, `info.txt:69978`).
 *
 * @param item The item, whose template declarations the `value` is looked up among.
 * @param node The body element.
 * @returns The template variable's identifier, or none for any other element.
 */
const parameterOf = (item: Item, node: BodyElement): Option.Option<string> =>
  node.tag === "param"
    ? Option.fromUndefinedOr(node.attributes.find((written) => written.name === "value")).pipe(
        Option.filter(({ value }) => item.templates.get(value)?.paramVariable === true),
        Option.map(({ value }) => value),
      )
    : Option.none();

/**
 * Give the notices a redaction must put in the place of the template parts on content the page
 * sees, decided from the item and the values alone, never read from `redact`: a printed variable
 * whose variable, or a variable its `base` or `index` names, the values hold no value of; a
 * template block or inline, and a `param-variable` parameter, whose template variable they hold no
 * value of; and `template-identifier` once when they hold no value of the template variable of
 * some choice with a template visibility. With no values, every such part is withheld. A part
 * inside content the page does not see (a block or inline the values hide or withhold, a withheld
 * `param`, or a choice they hide or withhold) gives none, since the page shows none of it.
 *
 * @param item The item.
 * @param values The values the item is shown by.
 * @returns The withheld parts' notices, in document order.
 */
const withheldOf = (item: Item, values: Option.Option<RedactRecord>): readonly string[] => {
  const holdsTemplate = (identifier: string): boolean =>
    Option.exists(values, (record) => Object.hasOwn(record.templates, identifier));
  const holds = (identifier: string): boolean =>
    holdsTemplate(identifier) ||
    Option.exists(values, (record) => Object.hasOwn(record.outcomes, identifier));
  const shown = (visibility: TemplateVisibility, identifier: string): Option.Option<boolean> =>
    values.pipe(
      Option.filter(() => holdsTemplate(visibility.templateIdentifier)),
      Option.map((record) => templateShows(visibility, identifier, record.templates)),
    );
  let choiceWithheld = false;
  const walk = (nodes: readonly BodyNode[]): readonly string[] =>
    nodes.flatMap((node): readonly string[] => {
      if (isStubbed(node)) {
        return regionsOf(node).flatMap((region) => walk(region.nodes));
      }

      switch (node.kind) {
        case "element": {
          return Option.match(parameterOf(item, node), {
            onNone: () => walk(node.children),
            onSome: (identifier) => (holdsTemplate(identifier) ? walk(node.children) : ["param"]),
          });
        }
        case "printed-variable": {
          return printedNames(node).every(holds) ? [] : ["qti-printed-variable"];
        }
        case "template-block":
        case "template-inline": {
          return Option.match(shown(node.templateVisibility, node.identifier), {
            onNone: () => [`qti-${node.kind}`],
            onSome: (visible) => (visible ? walk(node.content) : []),
          });
        }
        case "choice":
        case "inline-choice": {
          const lead = walk(
            Option.getOrElse(node.kind === "choice" ? node.prompt : node.label, () => []),
          );

          return [
            ...lead,
            ...node.choices.flatMap((choice): readonly string[] => {
              const visible = Option.match(choice.templateVisibility, {
                onNone: () => Option.some(true),
                onSome: (visibility) => shown(visibility, choice.identifier),
              });
              const notice = Option.isNone(visible) && !choiceWithheld ? [choiceNotice] : [];
              if (Option.isNone(visible)) {
                choiceWithheld = true;
              }

              return [
                ...notice,
                ...(Option.getOrElse(visible, () => false) ? walk(choice.content) : []),
              ];
            }),
          ];
        }
        case "extended-text": {
          return walk(Option.getOrElse(node.prompt, () => []));
        }
        case "content":
        case "text":
        case "text-entry":
        case "unsupported": {
          return [];
        }
        default: {
          return node satisfies never;
        }
      }
    });

  return walk(item.body);
};

/**
 * What can fail one render: `begin` starting a templated item's record or its decoding, or
 * `render`.
 */
type RenderFailure =
  | Result.Result.Failure<ReturnType<typeof recordStates>>
  | Result.Result.Failure<ReturnType<typeof threeStates>>;

/**
 * One accepted member's render under one record state: its three states, or the error that failed
 * them.
 */
interface Rendering {
  readonly accepted: Accepted;
  /**
   * The locale the states rendered in, which words their Notices.
   */
  readonly locale: Configuration["locale"];
  readonly location: string;
  /**
   * The record state an item whose template processing runs rendered in: `begin`'s record under a
   * sweep seed, or no record. None for any other item, which renders with no record.
   */
  readonly state: Option.Option<RecordState>;
  /**
   * The notices the redaction must give in place of the template parts the values withhold, which
   * the verdict names none of: {@link withheldOf}, decided from the item and the state, never read
   * from `redact`.
   */
  readonly withheld: readonly string[];
  readonly states: Result.Result<readonly RenderState[], RenderFailure>;
}

/**
 * The state named when `begin` cannot start a templated item's records, or one does not decode.
 */
const unbegun: RecordState = { name: "begun under the sweep seeds", record: Option.none() };

/**
 * Render an accepted item in its three states, under a record state's record where it has one.
 *
 * @param accepted The accepted item.
 * @param location Its corpus path.
 * @param configuration The configuration every state renders with.
 * @param state The record state, for an item whose template processing runs; none for any other.
 * @returns The item's render.
 */
const renderingOf = (
  accepted: Accepted,
  location: string,
  configuration: Configuration,
  state: Option.Option<RecordState>,
): Rendering => {
  const record = Option.getOrUndefined(state.pipe(Option.flatMap((found) => found.record)));

  return {
    accepted,
    locale: configuration.locale,
    location,
    state,
    states: threeStates(accepted, configuration, record),
    withheld: withheldOf(accepted.item, valuesOf(accepted.item, state)),
  };
};

/**
 * Render every accepted member in its three states: an item whose template processing runs under
 * the record `begin` starts under each sweep seed and with no record, every other item with no
 * record.
 *
 * @param members The opened members.
 * @param configuration The configuration every state renders with.
 * @returns Each accepted member's renders, in the set's order.
 */
const renderingsOf = (
  members: readonly Member[],
  configuration: Configuration,
): readonly Rendering[] =>
  members.flatMap((member) =>
    Option.match(acceptedOf(member), {
      onNone: (): readonly Rendering[] => [],
      onSome: (accepted) =>
        templated(accepted)
          ? Result.match(recordStates(accepted), {
              onFailure: (error): readonly Rendering[] => [
                {
                  accepted,
                  locale: configuration.locale,
                  location: member.location,
                  state: Option.some(unbegun),
                  states: Result.fail(error),
                  withheld: [],
                },
              ],
              onSuccess: (states) =>
                states.map((state) =>
                  renderingOf(accepted, member.location, configuration, Option.some(state)),
                ),
            })
          : [renderingOf(accepted, member.location, configuration, Option.none())],
    }),
  );

/**
 * Name a render as a failure names it: its corpus path, and its record state where it has one, so
 * the run repeats.
 *
 * @param rendering The render.
 * @returns Its name.
 */
const placeOf = (rendering: Rendering): string =>
  Option.match(rendering.state, {
    onNone: () => rendering.location,
    onSome: (state) => `${rendering.location} (${state.name})`,
  });

/**
 * Collect the problems one check finds in every state of every render, naming the member and the
 * state of each; a render that failed, or HTML that is not exactly one element, is a problem.
 *
 * @param renderings The renders.
 * @param problemsOf The check, over one state's root element.
 * @returns Every problem, empty when every state holds.
 */
const statesProblems = (
  renderings: readonly Rendering[],
  problemsOf: (rendering: Rendering, where: string, root: Element) => readonly string[],
): readonly string[] =>
  renderings.flatMap((rendering) =>
    Result.match(rendering.states, {
      onFailure: (error) => [`${placeOf(rendering)}: failed: ${error._tag}: ${error.message}`],
      onSuccess: (states) =>
        states.flatMap((state) => {
          const where = `${placeOf(rendering)}, ${state.name}`;

          return Option.match(rootOf(state.html), {
            onNone: () => [`${where}: the HTML is not exactly one element`],
            onSome: (root) => problemsOf(rendering, where, root),
          });
        }),
    }),
  );

/**
 * Check one state against the round trip and R1: its HTML round-trips, shows a notice for exactly
 * the verdict's notice-shown features and the template parts the state withholds
 * ({@link withheldOf}; a withheld choice shows none, being absent), and shows none for the features
 * the verdict marks, which render nowhere.
 *
 * @param rendering The render, with its accepted document.
 * @param where The member and state, which every problem names.
 * @param root The state's root element.
 * @returns Each problem found, empty when the state holds.
 */
const r1Problems = (rendering: Rendering, where: string, root: Element): readonly string[] => {
  const { unsupported } = rendering.accepted;
  const withheld = rendering.withheld.filter((feature) => feature !== choiceNotice);
  const featureOf = new Map(
    [...unsupported.map((entry) => entry.feature), ...withheld].map(
      (feature) => [message(rendering.locale, "notice", { feature }), feature] as const,
    ),
  );
  const shown = elementsOf([root])
    .filter((element) => element.attrs["data-slot"] === noticeSlot)
    .map((element) => {
      const text = textOf(element);

      return featureOf.get(text) ?? `(a notice no feature gives: ${JSON.stringify(text)})`;
    })
    .toSorted();
  const noticed = [
    ...unsupported.filter((entry) => entry.shown === "notice").map((entry) => entry.feature),
    ...withheld,
  ].toSorted();
  const marked = unsupported
    .filter((entry) => entry.shown === "mark")
    .map((entry) => entry.feature)
    .toSorted();
  const nowhere = without(
    unsupported.map((entry) => entry.feature),
    shown,
  ).toSorted();

  return [
    ...(roundTrips(root) ? [] : [`${where}: the HTML does not round-trip`]),
    ...(JSON.stringify(shown) === JSON.stringify(noticed)
      ? []
      : [
          `${where}: the HTML shows notices for ${JSON.stringify(shown)}, the verdict's notice-shown features are ${JSON.stringify(noticed)}`,
        ]),
    ...(JSON.stringify(nowhere) === JSON.stringify(marked)
      ? []
      : [
          `${where}: the features with no notice are ${JSON.stringify(nowhere)}, the verdict's marks are ${JSON.stringify(marked)}`,
        ]),
  ];
};

/**
 * Check one state with `checkTree` at base level 2.
 *
 * @param _rendering The render, unused.
 * @param where The member and state, which every problem names.
 * @param root The state's root element.
 * @returns The violations, as one problem, or none.
 */
const treeProblems = (_rendering: Rendering, where: string, root: Element): readonly string[] => {
  const violations = checkTree(root, { baseLevel: 2 });

  return violations.length === 0
    ? []
    : [`${where}: checkTree at base level 2 finds ${JSON.stringify(violations)}`];
};

/**
 * Collect the Inline Choices an item's body renders, in document order: those in its body and its
 * body elements. An interaction inside a Prompt or a choice's content is not counted, nor one
 * inside a template block or inline, which renders only where a template value shows it.
 *
 * @param nodes The body nodes.
 * @returns The Inline Choices.
 */
const inlineChoicesOf = (nodes: readonly BodyNode[]): readonly InlineChoiceInteraction[] =>
  nodes.flatMap((node): readonly InlineChoiceInteraction[] => {
    if (isStubbed(node)) {
      return [];
    }

    switch (node.kind) {
      case "element": {
        return inlineChoicesOf(node.children);
      }
      case "inline-choice": {
        return [node];
      }
      case "content":
      case "choice":
      case "extended-text":
      case "printed-variable":
      case "template-block":
      case "template-inline":
      case "text":
      case "text-entry":
      case "unsupported": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Check one state holds each of the item's Inline Choices as its Control: a `select` whose
 * children are `option`s, the Placeholder first with `value=""`, then one Option for each
 * choice, whatever order the choices were presented in.
 *
 * @param rendering The render, with its accepted document.
 * @param where The member and state, which every problem names.
 * @param root The state's root element.
 * @returns Each problem found, empty when the state holds.
 */
const inlineChoiceProblems = (
  rendering: Rendering,
  where: string,
  root: Element,
): readonly string[] => {
  const elements = elementsOf([root]);

  return inlineChoicesOf(rendering.accepted.item.body).flatMap((interaction) => {
    const at = `${where}: the Inline Choice bound to ${interaction.response}`;
    const id = scopedId(sweepInstance, interaction.response, "control");
    const control = elements.find((element) => element.attrs["id"] === id);
    if (
      control === undefined ||
      control.tag !== "select" ||
      control.attrs["data-slot"] !== inlineChoiceSlots.control
    ) {
      return [`${at} has no Control ${id}`];
    }

    const options = control.children.flatMap((child) =>
      child.kind === "element" && child.tag === "option" ? [child] : [],
    );
    const [placeholder, ...rest] = options;
    const values = rest.map((option) => attribute(option, "value") ?? "").toSorted();
    const identifiers = interaction.choices.map((choice) => choice.identifier).toSorted();

    return [
      ...(options.length === control.children.length
        ? []
        : [`${at}: its Control holds a child that is not an option`]),
      ...(placeholder?.attrs["data-slot"] === inlineChoiceSlots.placeholder &&
      placeholder.attrs["value"] === ""
        ? []
        : [`${at}: its Control's first option is not the Placeholder with an empty value`]),
      ...(rest.every((option) => option.attrs["data-slot"] === inlineChoiceSlots.option)
        ? []
        : [`${at}: an option after the Placeholder is not an Option`]),
      ...(JSON.stringify(values) === JSON.stringify(identifiers)
        ? []
        : [
            `${at}: its Options carry ${JSON.stringify(values)}, its choices are ${JSON.stringify(identifiers)}`,
          ]),
    ];
  });
};

describe("the verdict and render sweep over the corpus", { tags: ["corpus"] }, () => {
  it.effect(
    "every corpus member gets a verdict on its own location, and no defect escapes open",
    () =>
      Effect.gen(function* everyVerdict() {
        const members = yield* openCorpus;
        const problems = members.flatMap((member) =>
          Exit.match(member.verdict, {
            onFailure: (cause) => [`${member.location}: open failed: ${Cause.pretty(cause)}`],
            onSuccess: (verdict) =>
              verdict.document === member.location
                ? []
                : [`${member.location}: the verdict names ${verdict.document}`],
          }),
        );

        assert.isNotEmpty(members, "the corpus document set is empty");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "each refused member carries a refusal with a rule and a location, and each unchecked member a reason",
    () =>
      Effect.gen(function* refusedAndUnchecked() {
        const rules: ReadonlySet<string> = new Set(refusalRules);
        const problems = verdictsOf(yield* openCorpus).flatMap(([member, verdict]) => {
          switch (verdict.verdict) {
            case "refused": {
              if (verdict.refusals.length === 0) {
                return [`${member.location}: refused with no refusal`];
              }

              return verdict.refusals.flatMap((refusal, index) => {
                const where = `${member.location}: refusal ${index}`;

                return [
                  ...(rules.has(refusal.rule) ? [] : [`${where} names no rule: ${refusal.rule}`]),
                  ...(locationKinds.has(refusal.location.kind)
                    ? []
                    : [`${where} (${refusal.rule}) has no location`]),
                  ...(refusal.location.kind === "path" && refusal.location.path === ""
                    ? [`${where} (${refusal.rule}) has an empty path`]
                    : []),
                  ...(refusal.document === member.location
                    ? []
                    : [`${where} (${refusal.rule}) names ${refusal.document}`]),
                ];
              });
            }
            case "unchecked": {
              return verdict.reasons.length === 0
                ? [`${member.location}: unchecked with no reason`]
                : verdict.reasons.flatMap((reason) =>
                    reason.path === ""
                      ? [`${member.location}: the ${reason.reason} reason has an empty path`]
                      : [],
                  );
            }
            case "accepted":
            case "accepted-with-unsupported": {
              return [];
            }
            default: {
              return verdict satisfies never;
            }
          }
        });

        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-7] [I-8] every accepted item renders in three states whose HTML round-trips and shows exactly its notice-shown features as notices (R1)",
    () =>
      Effect.gen(function* everyRender() {
        const members = yield* openCorpus;
        const renderings = renderingsOf(members, yield* configure({}));
        const counted = verdictsOf(members).filter(
          ([, verdict]) => verdict.kind === "item" && acceptingVerdicts.has(verdict.verdict),
        );
        const rendered = new Set(renderings.map((rendering) => rendering.location));

        assert.strictEqual(
          rendered.size,
          counted.length,
          "every item's accepting verdict is rendered",
        );
        assert.deepStrictEqual(statesProblems(renderings, r1Problems), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-7] [I-8] every accepted item's three states pass checkTree at base level 2",
    () =>
      Effect.gen(function* everyTree() {
        const renderings = renderingsOf(yield* openCorpus, yield* configure({}));

        assert.deepStrictEqual(statesProblems(renderings, treeProblems), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[Q-12] each accepted item with an Inline Choice holds, in its three states, a Control whose options are its Placeholder and its choices",
    () =>
      Effect.gen(function* everyInlineChoice() {
        const renderings = renderingsOf(yield* openCorpus, yield* configure({})).filter(
          (rendering) => inlineChoicesOf(rendering.accepted.item.body).length > 0,
        );

        assert.isNotEmpty(renderings, "no accepted corpus item renders an Inline Choice");
        assert.deepStrictEqual(statesProblems(renderings, inlineChoiceProblems), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-5] each item whose template processing runs renders in three states under begin's record for each sweep seed and with no record, round-trips, shows exactly its notice-shown features as notices, passes checkTree at base level 2, and under a record shows none of its printed variables, template blocks and template inlines as a notice",
    () =>
      Effect.gen(function* templatedRenders() {
        const renderings = renderingsOf(yield* openCorpus, yield* configure({})).filter(
          (rendering) => templated(rendering.accepted),
        );
        const files = new Set(renderings.map((rendering) => rendering.location));
        const uncounted = [...files].flatMap((location) => {
          const states = renderings.filter((rendering) => rendering.location === location).length;

          return states === sweepSeeds.length + 1
            ? []
            : [`${location}: rendered in ${String(states)} record states`];
        });
        const notices = renderings.flatMap((rendering) =>
          Option.exists(rendering.state, (state) => Option.isSome(state.record)) &&
          rendering.withheld.length > 0
            ? [
                `${placeOf(rendering)}: its record withholds the parts noticed as ${JSON.stringify(rendering.withheld)}`,
              ]
            : [],
        );

        assert.isNotEmpty(files, "no accepted corpus item's template processing runs");
        assert.deepStrictEqual(
          [
            ...uncounted,
            ...notices,
            ...statesProblems(renderings, r1Problems),
            ...statesProblems(renderings, treeProblems),
          ],
          [],
        );
      }),
    sweepTimeoutMs,
  );
});
