/**
 * Slider (Q-19): its model, its parts, its connect function and its response validation, on the
 * module shape of the contract.
 *
 * {@link renderSlider} emits this structure: a `qti-slider-interaction` Root holding the Prompt,
 * when there is one, then the Control, a native `input type="range"` over the bounds, with the two
 * bounds' visible labels at its ends and, when `step-label` asks and the steps can be listed, a
 * `datalist` of them that the Control names through `list`. A slider has no runtime: the native
 * control is its whole behaviour, so the browser's own keyboard map (arrows, Page Up and Down,
 * Home and End) and its pointer travel are the ways to set it, each a single click or key press.
 *
 * - **Binding.** A response of cardinality `single` and base type `integer` or `float`; any other
 *   binding is the notice naming the one it breaks, as for the four shipped kinds. Under an
 *   `integer` binding the lower bound rounds down and the upper bound up to integers, and with no
 *   `step` the step is 1; under a `float` binding the bounds are as written and with no `step` the
 *   Control is `step="any"`. A `step` of 0 constrains nothing, so it reads as none.
 * - **Starting position.** A slider has no initial position of its own. The Control starts at the
 *   value the view shows for the response (the restored value, or the default a record starts
 *   with), else at the lower bound, and every value the Control posts counts, a value it posts
 *   untouched included: the information model's own workaround for a slider with no NULL. `value`
 *   is always written, because a range with none starts at its midpoint.
 * - **Step labels.** `step-label="true"` lists each step in a `datalist` when there are at most 21.
 *   Past that, or with no step to list, the request is one the page cannot honour and the item's
 *   verdict marks it (`step-label`); no datalist is written.
 * - **Orientation and reverse.** Both are hints, carried on the Root as `data-orientation` and
 *   `data-reverse`. A vertical slider has its low bound at the bottom unless `reverse` is true, a
 *   horizontal one at the left unless it is; the Control gives that by `dir="rtl"`, which a
 *   browser's range honours natively (in Chromium and WebKit a range in a vertical writing mode
 *   puts its low end at the top, and `rtl` turns it to the bottom), and the bounds' labels and the
 *   Control stand in the order the page shows them, so the reading order is the visual order. The
 *   stylesheet draws a vertical one with `writing-mode` and reads no `reverse`: the Control's own
 *   `dir` is the one reversal, so a host's stylesheet needs no rule for it.
 * - **Name.** The Prompt names the Control; with none, the author's `aria-label` or
 *   `aria-labelledby`, else the renderer's "Answer". The Control's `aria-describedby` names the two
 *   bounds, and the messages of a refused answer.
 * - **Modes.** A range has no `readonly`, so the Control is `disabled` in review and solution and
 *   when the author finished the item, as an Inline Choice's `select` is. There is no live value
 *   readout: one would go stale without script.
 *
 * {@link validateSlider} checks a value the caller decoded in tier (a) only: below the lower bound,
 * above the upper bound, or off the steps counted from the lower bound. The messages are English
 * and live here, a stated limit that a later pass centralises.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  Connected,
  InteractionModule,
  ModuleInteraction,
  PartSpec,
  ReaderKit,
  TextProps,
} from "#plate/interactions/contract.ts";
import { malformedMessage } from "#plate/interactions/pattern.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import type {
  EmitState,
  Payload,
  PayloadNode,
  UnnamedPosition,
  ValidationMessage,
} from "#plate/payload.ts";

/**
 * The owner of every Slider part in the part table.
 */
const owner = "slider-interaction";

/**
 * Slider's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-19";

/**
 * The QTI element Slider is read from.
 */
const element = "qti-slider-interaction";

/**
 * The base types a slider's response may have: the two numeric ones.
 */
type SliderBaseType = "float" | "integer";

/**
 * The orientations `orientation` names.
 */
type Orientation = "horizontal" | "vertical";

/**
 * A Slider part.
 */
type SliderPart = "control" | "lowerBound" | "prompt" | "root" | "steps" | "upperBound";

/**
 * The most steps `step-label` lists. Past it the ticks would crowd the Control, so the request is
 * left undrawn and marked.
 */
const mostLabelledSteps = 21;

/**
 * How far a step count may fall short of a whole number, as a fraction of a step, before it is
 * counted as short: the error a double's own rounding leaves in `(upper - lower) / step`.
 */
const stepTolerance = 1e-9;

/**
 * A decimal number as a Control's `value` may hold it: the digits of an `xs:double` without `INF`
 * and `NaN`, which a range's value would read as no number at all.
 */
const decimalNumber = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[Ee][+-]?\d+)?$/u;

/**
 * A Slider as the model holds it: the fields every module's node shares, and the slider's own.
 */
export interface SliderInteraction extends ModuleInteraction<"slider"> {
  /**
   * The base type of the response it binds, which decides how its bounds and step read.
   */
  readonly baseType: SliderBaseType;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `lower-bound`, as written.
   */
  readonly lowerBound: number;
  /**
   * `orientation`, a hint, none when the author wrote none.
   */
  readonly orientation: Option.Option<Orientation>;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * `reverse`, a hint, false when absent.
   */
  readonly reverse: boolean;
  /**
   * `step`, as written, none when absent.
   */
  readonly step: Option.Option<number>;
  /**
   * `step-label`, false when absent.
   */
  readonly stepLabel: boolean;
  /**
   * `upper-bound`, as written.
   */
  readonly upperBound: number;
}

/**
 * The JSON form of {@link SliderInteraction} in a redacted body: its encoded side, which holds no
 * path.
 */
export interface SliderJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly baseType: SliderBaseType;
  readonly class: string;
  readonly kind: "slider";
  readonly lowerBound: number;
  readonly orientation?: Orientation;
  readonly path?: unknown;
  readonly prompt?: SchemaKit["BodyNodes"]["Encoded"];
  readonly response: string;
  readonly reverse: boolean;
  readonly step?: number;
  readonly stepLabel: boolean;
  readonly upperBound: number;
}

/**
 * How a Control is named, from the payload: the author's names, and where the renderer's own name
 * stands when the Control has no name.
 */
export interface SliderName {
  /**
   * The author's `aria-label`, none when blank or absent.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, as written.
   */
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * Set exactly when the renderer names the Control: it has no Prompt and the author named none.
   */
  readonly unnamed: Option.Option<UnnamedPosition>;
}

/**
 * A Slider as the page may know it: what the module's `redact` copies of the model node and reads
 * of the view, with the range already worked out, so the render needs no more.
 */
export interface SliderPayload {
  readonly autofocus: boolean;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name the Control posts under.
   */
  readonly formName: string;
  /**
   * The Control's `min`: the lower bound, rounded down under an `integer` binding.
   */
  readonly lower: number;
  /**
   * Whether the low bound stands last in the order the page shows, which sets the Control's `dir`
   * and the order of the bounds' labels.
   */
  readonly minLast: boolean;
  readonly name: SliderName;
  readonly orientation: Option.Option<Orientation>;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  readonly response: string;
  readonly reverse: boolean;
  /**
   * The Control's `value`: the number the view shows, else the lower bound.
   */
  readonly start: string;
  /**
   * The Control's `step`, none for `step="any"`.
   */
  readonly step: Option.Option<number>;
  /**
   * The steps the datalist lists, none when it is not drawn.
   */
  readonly steps: readonly number[];
  /**
   * The Control's `max`: the upper bound, rounded up under an `integer` binding.
   */
  readonly upper: number;
}

/**
 * The attributes of every part of one Slider, computed once by {@link connect}.
 */
interface SliderConnected extends Connected {
  readonly control: Attributes;
  readonly lowerBound: TextProps;
  readonly options: readonly Attributes[];
  readonly prompt: Attributes;
  readonly root: Attributes;
  readonly steps: Attributes;
  readonly upperBound: TextProps;
}

/**
 * The rows of the Slider parts.
 *
 * The Control is a native input whose `type` I1 writes back, so a replacement stays a range; its
 * `min`, `max`, `step`, `value`, `name` and `list` are the interaction's, as is the `dir` that
 * draws a reversed range. The datalist takes any element, since no tag class names a datalist, and
 * keeps its `id` the Control's `list` names.
 */
const parts = {
  control: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "min",
      "max",
      "step",
      "list",
      "dir",
      "disabled",
      "autocomplete",
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "aria-invalid",
      "autofocus",
    ],
    tagClass: "native-input",
  },
  lowerBound: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: ["id"],
    tagClass: "phrasing-container",
  },
  prompt: {
    defaults: {},
    element: "qti-prompt",
    listOwner: false,
    merged: ["id"],
    tagClass: "prompt",
  },
  root: {
    defaults: {},
    element: "qti-slider-interaction",
    listOwner: false,
    merged: ["class", "data-orientation", "data-reverse"],
    tagClass: "flow-container",
  },
  steps: {
    defaults: {},
    element: "datalist",
    listOwner: false,
    merged: ["id"],
    tagClass: "any",
  },
  upperBound: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: ["id"],
    tagClass: "phrasing-container",
  },
} as const satisfies { readonly [Q in SliderPart]: PartSpec };

/**
 * The row of every Slider part, which no placement changes.
 */
const rows = {
  control: partRow({ owner, parts }, "control"),
  lowerBound: partRow({ owner, parts }, "lowerBound"),
  prompt: partRow({ owner, parts }, "prompt"),
  root: partRow({ owner, parts }, "root"),
  steps: partRow({ owner, parts }, "steps"),
  upperBound: partRow({ owner, parts }, "upperBound"),
} as const satisfies { readonly [Q in SliderPart]: PartRow };

/**
 * What the Control ranges over: its bounds and its step, none for `step="any"`.
 */
interface Range {
  readonly lower: number;
  readonly step: Option.Option<number>;
  readonly upper: number;
}

/**
 * Work out the range of a Slider from its bounds and step as written.
 *
 * An `integer` binding rounds the lower bound down and the upper bound up, and steps by 1 when it
 * has no step; a `float` binding keeps the bounds, and has no step to count by when it has none. A
 * step that is not above 0 constrains nothing, so it counts as none.
 *
 * @param interaction The Slider's binding, bounds and step.
 * @returns The range the Control and the validation share.
 */
const rangeOf = (
  interaction: Pick<SliderInteraction, "baseType" | "lowerBound" | "step" | "upperBound">,
): Range => {
  const written = interaction.step.pipe(Option.filter((step) => step > 0));

  return interaction.baseType === "integer"
    ? {
        lower: Math.floor(interaction.lowerBound),
        step: Option.orElse(written, () => Option.some(1)),
        upper: Math.ceil(interaction.upperBound),
      }
    : { lower: interaction.lowerBound, step: written, upper: interaction.upperBound };
};

/**
 * List the steps of a range that `step-label` can label: each stop from the lower bound by the
 * step, when there is a step and there are at most {@link mostLabelledSteps} of them.
 *
 * @param range The range.
 * @returns The stops, none when they cannot be listed.
 */
const stepsOf = (range: Range): readonly number[] =>
  Option.match(range.step, {
    onNone: () => [],
    onSome: (step) => {
      const count = Math.floor((range.upper - range.lower) / step + stepTolerance) + 1;

      return count >= 1 && count <= mostLabelledSteps
        ? Array.from({ length: count }, (_, index) =>
            Number((range.lower + index * step).toPrecision(12)),
          )
        : [];
    },
  });

/**
 * Pick the text the Control starts at: the first of the candidates that is a decimal number, as a
 * range's `value` reads it, else the lower bound.
 *
 * @param candidates The numbers the view gives, in order: the strings a refused post sent, or the
 *   values it shows.
 * @param lower The Control's `min`.
 * @returns The `value` to write.
 */
const startOf = (candidates: readonly string[], lower: number): string =>
  Option.match(
    Option.fromUndefinedOr(
      candidates.map(trimXmlSpace).find((candidate) => decimalNumber.test(candidate)),
    ),
    { onNone: () => String(lower), onSome: (found) => String(Number(found)) },
  );

/**
 * Give the Control's naming attributes (Q10).
 *
 * The Prompt names it. With none, the author's `aria-label` and `aria-labelledby` do, the ids
 * scoped by the instance; with neither, the renderer does: "Answer", or "Answer n of count" when
 * the item holds more than one Control the renderer names.
 *
 * @param interaction The Slider's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @param locale The locale of the renderer's own text.
 * @param promptId The Prompt's id.
 * @returns The Control's `aria-label` or `aria-labelledby`.
 */
const controlName = (
  interaction: SliderPayload,
  instance: string,
  locale: Locale,
  promptId: string,
): Attributes => {
  if (Option.isSome(interaction.prompt)) {
    return { "aria-labelledby": promptId };
  }

  return Option.match(interaction.name.unnamed, {
    onNone: () => ({
      ...Option.match(interaction.name.ariaLabel, {
        onNone: () => ({}),
        onSome: (label) => ({ "aria-label": label }),
      }),
      ...Option.match(
        interaction.name.ariaLabelledby.pipe(
          Option.flatMap((ids) => authoredIdrefs(instance, ids)),
        ),
        { onNone: () => ({}), onSome: (ids) => ({ "aria-labelledby": ids }) },
      ),
    }),
    onSome: (position) => ({
      "aria-label":
        position.count > 1
          ? message(locale, "answerOf", { count: String(position.count), n: String(position.n) })
          : message(locale, "answer"),
    }),
  });
};

/**
 * Compute every attribute of every part of one Slider: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, and the hints `data-orientation` and `data-reverse`.
 * - Prompt: the marker and its id, which the Control's `aria-labelledby` names.
 * - Control: a range `input`; its id, the payload's `formName`, `min`, `max`, `step` (`any` for none)
 *   and the `value` it starts at; `list` → the datalist's id when one is drawn; `dir="rtl"` when
 *   the low bound stands last; `disabled` when finished or not editable (review and solution);
 *   `autocomplete="off"`, so the browser offers no remembered answer; its name
 *   ({@link controlName}); `aria-describedby` → the two bounds' ids and, when the answer was
 *   refused, the message ids; `aria-invalid` then too; and `autofocus` when the payload says.
 * - Lower and upper bound: the marker, an id, and the bound's number as text.
 * - Steps: the marker and the id the Control's `list` names, and one option per step.
 *
 * @param interaction The Slider's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode, `finished`
 *   and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part, and the attributes of each step's option.
 * @see https://html.spec.whatwg.org/multipage/input.html#range-state-(type=range)
 */
const connect = (interaction: SliderPayload, payload: Payload, locale: Locale): SliderConnected => {
  const { instance } = payload;
  const id = (part: string) => scopedId(instance, interaction.response, part);
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);

  return {
    control: {
      ...controlName(interaction, instance, locale, id("prompt")),
      "aria-describedby": [id("lower-bound"), id("upper-bound"), ...messageIds].join(" "),
      ...when(messageIds.length > 0, { "aria-invalid": "true" }),
      ...when(interaction.autofocus, { autofocus: true }),
      autocomplete: "off",
      "data-slot": rows.control.slot,
      ...when(interaction.minLast, { dir: "rtl" }),
      ...when(payload.finished || payload.mode !== "answering", { disabled: true }),
      id: id("control"),
      ...when(interaction.steps.length > 0, { list: id("steps") }),
      max: String(interaction.upper),
      min: String(interaction.lower),
      name: interaction.formName,
      step: Option.match(interaction.step, { onNone: () => "any", onSome: String }),
      type: "range",
      value: interaction.start,
    },
    lowerBound: {
      props: { "data-slot": rows.lowerBound.slot, id: id("lower-bound") },
      text: String(interaction.lower),
    },
    options: interaction.steps.map((step) => ({ value: String(step) })),
    prompt: { "data-slot": rows.prompt.slot, id: id("prompt") },
    root: {
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-mode": payload.mode,
      ...when(payload.finished, { "data-disabled": true }),
      ...Option.match(interaction.orientation, {
        onNone: () => ({}),
        onSome: (orientation) => ({ "data-orientation": orientation }),
      }),
      ...when(interaction.reverse, { "data-reverse": true }),
      "data-slot": rows.root.slot,
    },
    steps: { "data-slot": rows.steps.slot, id: id("steps") },
    upperBound: {
      props: { "data-slot": rows.upperBound.slot, id: id("upper-bound") },
      text: String(interaction.upper),
    },
  };
};

/**
 * Render a Slider: a `qti-slider-interaction` Root holding the Prompt, when there is one, then the
 * Control between its two bounds' labels, in the order the page shows them, then the datalist when
 * the steps are drawn.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt's content goes through {@link emitNodes}, as the body's does.
 *
 * @param interaction The Slider's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode and
 *   `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Slider Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 * @throws {NestedInteractionDefect} When the Prompt holds an interaction, which QTI admits nowhere
 *   there ({@link nestedInteraction}).
 */
const renderSlider = (
  interaction: SliderPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  Result.gen(function* sliderRoot() {
    const props = connect(interaction, payload, state.locale);
    const place = (part: SliderPart, attributes: Attributes, children: readonly Node[]) =>
      applyPart(
        rows[part],
        attributes,
        children,
        Option.getOrUndefined(state.parts.replacementFor(owner, part)),
      );

    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitNodes(content, payload, state, nestedInteraction(owner)), (nodes) =>
            place("prompt", props.prompt, nodes),
          ),
        ),
      ),
    );
    const lower = yield* place("lowerBound", props.lowerBound.props, [text(props.lowerBound.text)]);
    const control = yield* place("control", props.control, []);
    const upper = yield* place("upperBound", props.upperBound.props, [text(props.upperBound.text)]);
    const steps = yield* Result.transposeOption(
      interaction.steps.length === 0
        ? Option.none()
        : Option.some(
            place(
              "steps",
              props.steps,
              props.options.map((option) => h("option", option)),
            ),
          ),
    );

    return yield* place("root", props.root, [
      ...Option.toArray(prompt),
      ...(interaction.minLast ? [upper, control, lower] : [lower, control, upper]),
      ...Option.toArray(steps),
    ]);
  });

/**
 * The messages of one locale: what tier (a) says of a value outside the range.
 */
interface Words {
  /**
   * The value is above the upper bound.
   */
  readonly above: (bound: string) => string;
  /**
   * The value is below the lower bound.
   */
  readonly below: (bound: string) => string;
  /**
   * The value is between the bounds but off the steps counted from the lower bound.
   */
  readonly offStep: (step: string, from: string) => string;
}

/**
 * The messages, by locale: English, written here (rule 11 of the handbook).
 */
const words = {
  en: {
    above: (bound) => `Choose a value of at most ${bound}.`,
    below: (bound) => `Choose a value of at least ${bound}.`,
    offStep: (step, from) => `Choose a value in steps of ${step} from ${from}.`,
  },
} as const satisfies Readonly<Record<Locale, Words>>;

/**
 * Give the number a single value holds, none for a value no slider takes.
 *
 * @param single One value of the response.
 * @returns Its number, an integer as a `Number`, none for another base type.
 */
const numberOf = (single: Single): Option.Option<number> => {
  if (single.baseType === "integer") {
    return Option.some(Number(single.value));
  }

  return single.baseType === "float" ? Option.some(single.value) : Option.none();
};

/**
 * Judge one number against a range.
 *
 * @param range The range.
 * @param value The number.
 * @param locale The locale of the message.
 * @returns The message for the first rule it breaks: below the lower bound, above the upper bound,
 *   then off the steps; none when it keeps all three.
 */
const judge = (range: Range, value: number, locale: Locale): Option.Option<string> => {
  const say = words[locale];

  if (value < range.lower) {
    return Option.some(say.below(String(range.lower)));
  }

  if (value > range.upper) {
    return Option.some(say.above(String(range.upper)));
  }

  return range.step.pipe(
    Option.filter((step) => {
      const steps = (value - range.lower) / step;

      return Math.abs(steps - Math.round(steps)) > stepTolerance * Math.max(1, Math.abs(steps));
    }),
    Option.map((step) => say.offStep(String(step), String(range.lower))),
  );
};

/**
 * Check a Slider's response, which the caller decoded, in tier (a) alone.
 *
 * The caller decodes the posted entry with `decode`, under the entry name its form gave the
 * Control, the Slider's binding (a single `integer` or `float`), and passes the value, or the
 * {@link Malformed} `decode` gave. So the entry name stays the caller's, while the messages stay
 * here.
 *
 * - A {@link Malformed} input, by its reason ({@link malformedMessage}): `malformedNumber` for text
 *   that is no number, `malformedFile` for a file, `malformedSingleMany` for a second entry.
 * - A decoded value outside the range ({@link rangeOf}): below the lower bound, above the upper
 *   bound, or off the steps counted from the lower bound, each message naming the bound or the
 *   step. A value that breaks two rules gets the first.
 *
 * NULL, which no Control posts, gives none, and `validateResponses` adds no check: every value the
 * Control posts counts.
 *
 * @param interaction The Slider.
 * @param input The decoded value, or why the entry did not decode.
 * @param configuration The configuration, which gives the locale.
 * @returns One message per problem, none when the response is accepted.
 */
export const validateSlider = (
  interaction: SliderInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;

  if (input instanceof Malformed) {
    return [
      {
        response: interaction.response,
        text: malformedMessage(
          { baseType: interaction.baseType, patternMaskMessage: Option.none() },
          input.reason,
          locale,
        ),
      },
    ];
  }

  const range = rangeOf(interaction);

  return input.values.flatMap((single) =>
    Option.toArray(Option.flatMap(numberOf(single), (value) => judge(range, value, locale))).map(
      (wording) => ({ response: interaction.response, text: wording }),
    ),
  );
};

/**
 * Read an attribute's refusal at its path in the document, for the readers that take one.
 */
type Refuse = Parameters<ReaderKit["doubleAttribute"]>[2];

/**
 * The Slider module.
 */
export const sliderModule: InteractionModule<
  "slider",
  SliderInteraction,
  SliderPayload,
  SliderPart,
  SliderJson
> = {
  /**
   * The response Slider binds: one, posted as a decimal number.
   */
  bindings: (interaction) => [{ base: Option.some(10), response: interaction.response }],
  connect,
  /**
   * The Prompt's nodes, which the render writes as content through `emitNodes`.
   */
  content: (interaction) => Option.getOrElse(interaction.prompt, () => []),
  /**
   * One Control: the range.
   */
  controls: () => 1,
  element,
  feature,
  implemented: true,
  kind: "slider",
  /**
   * The NULL of Slider's own binding: a single value of its base type, holding none.
   */
  nullValue: (interaction) => nullOf(interaction.baseType, "single"),
  owner,
  /**
   * Read a `qti-slider-interaction` into its model node, or its notice.
   *
   * The response must be declared; it must be single and an `integer` or a `float`, else the notice
   * names the cardinality or the base type it breaks, as the shipped kinds' do; and its bounds and
   * step must be finite numbers, else the notice names the one that is not. `lower-bound` and
   * `upper-bound` are required, `step` is optional, `step-label` and `reverse` read as `xs:boolean`
   * and default to false. A `step-label` that {@link stepsOf} cannot list is marked on the
   * verdict.
   */
  parse: (source, { notice, path, read }) =>
    Result.gen(function* readSlider() {
      const response = yield* read.requiredAttribute(source, "response-identifier");
      const declaration = read.bound;
      if (Option.isNone(declaration)) {
        return yield* Result.fail(
          read.refusal("undeclared-response", attributePath(path, response), {
            response: read.identifierOf(response.value),
          }),
        );
      }

      const written = (name: string) =>
        Option.getOrElse(read.valueOf(declaration.value.element, name), () => "");
      if (written("cardinality") !== "single") {
        return yield* notice(`cardinality="${written("cardinality")}"`);
      }

      const baseType = written("base-type");
      if (baseType !== "integer" && baseType !== "float") {
        return yield* notice(`base-type="${baseType}"`);
      }

      const refuse: Refuse = (attribute, rule, detail) =>
        read.refusal(rule, attributePath(path, attribute), detail);
      const bound = (name: "lower-bound" | "upper-bound") =>
        Result.flatMap(read.doubleAttribute(source, name, refuse), (value) =>
          Result.fromOption(value, () =>
            read.refusal("missing-attribute", path, {
              attribute: name,
              element: read.nameOf(source),
            }),
          ),
        );
      const lowerBound = yield* bound("lower-bound");
      const upperBound = yield* bound("upper-bound");
      const step = yield* read.doubleAttribute(source, "step", refuse);
      const unbounded = (
        [
          ["lower-bound", Option.some(lowerBound)],
          ["upper-bound", Option.some(upperBound)],
          ["step", step],
        ] as const
      ).find(([, candidate]) => Option.exists(candidate, (value) => !Number.isFinite(value)));
      if (unbounded !== undefined) {
        return yield* notice(
          `${unbounded[0]}="${Option.getOrElse(read.valueOf(source, unbounded[0]), () => "")}"`,
        );
      }

      read.markElement(source);

      const stepLabel = yield* read.xsBoolean(source, "step-label", false);
      const reverse = yield* read.xsBoolean(source, "reverse", false);
      const orientation = yield* read.enumerated(source, "orientation", ["horizontal", "vertical"]);
      const interaction: SliderInteraction = {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        baseType,
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        kind: "slider",
        lowerBound,
        orientation,
        path,
        prompt: yield* read.content(source, "qti-prompt"),
        response: read.identifierOf(response.value),
        reverse,
        step,
        stepLabel,
        upperBound,
      };
      if (stepLabel && stepsOf(rangeOf(interaction)).length === 0) {
        read.mark(source, "step-label");
      }

      return interaction;
    }),
  parts,
  /**
   * The JSON form of the model node: every field, the Prompt as body nodes, and no path.
   */
  payloadSchema: ({ BodyNodes, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      baseType: Schema.Literals(["float", "integer"]),
      class: Schema.String,
      kind: Schema.Literal("slider"),
      lowerBound: Schema.Finite,
      orientation: Schema.OptionFromOptionalKey(Schema.Literals(["horizontal", "vertical"])),
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      reverse: Schema.Boolean,
      step: Schema.OptionFromOptionalKey(Schema.Finite),
      stepLabel: Schema.Boolean,
      upperBound: Schema.Finite,
    }),
  /**
   * Copy the model node into its payload node: the Prompt through the kit, the range worked out,
   * the Control's name posted under the host's entry name, and the number it starts at, which is
   * the posted number when the view restores a refused post, else the value it shows, else the
   * lower bound.
   */
  redact: (interaction, kit) => {
    const range = rangeOf(interaction);

    return {
      autofocus: kit.autofocus,
      class: interaction.class,
      formName: kit.formName(interaction.response),
      lower: range.lower,
      minLast: Option.contains(interaction.orientation, "vertical") !== interaction.reverse,
      name: {
        ariaLabel: interaction.ariaLabel.pipe(Option.filter((label) => trimXmlSpace(label) !== "")),
        ariaLabelledby: interaction.ariaLabelledby,
        unnamed: kit.unnamed,
      },
      orientation: interaction.orientation,
      prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
      response: interaction.response,
      reverse: interaction.reverse,
      start: startOf(
        Option.getOrElse(kit.posted(interaction.response), () =>
          kit.shown(interaction.response).map(format),
        ),
        range.lower,
      ),
      step: range.step,
      steps: interaction.stepLabel ? stepsOf(range) : [],
      upper: range.upper,
    };
  },
  /**
   * The Prompt, the one content a Slider holds.
   */
  regions: (interaction) =>
    Option.match(interaction.prompt, {
      onNone: () => [],
      onSome: (nodes) => [
        { choice: Option.none(), nodes, part: "prompt" as const, written: "nodes" as const },
      ],
    }),
  render: renderSlider,
  /**
   * The Prompt replaced by the content given for it, the one region there is.
   */
  replaceRegions: (interaction, contents) => ({
    ...interaction,
    prompt: interaction.prompt.pipe(Option.map((nodes) => contents[0] ?? nodes)),
  }),
  /**
   * The value Slider shows for a stored response: the stored value itself, which the Control starts
   * at, a browser keeping it within the range and on its steps.
   */
  restore: (_interaction, stored) => stored,
  /**
   * No order: a slider has no choices to shuffle.
   */
  sequence: () => Option.none(),
  /**
   * The value Slider shows for the correct response: the correct value itself.
   */
  solution: (_interaction, correct) => correct,
  /**
   * Whether the renderer names the Control: when the author named it no more than the Prompt does,
   * and there is no Prompt.
   */
  unnamed: (interaction, unauthored) => unauthored && Option.isNone(interaction.prompt),
  validate: validateSlider,
};
