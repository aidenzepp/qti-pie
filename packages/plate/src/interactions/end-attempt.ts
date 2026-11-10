/**
 * End Attempt (Q-4): its model, its parts, its connect function, its rule for counting an attempt
 * and its response validation, on the module shape of the contract.
 *
 * {@link renderEndAttempt} emits this structure: a `qti-end-attempt-interaction` Root, a phrasing
 * container that stands inside the author's sentence, holding one native `button type="submit"`,
 * the Control, whose text is the author's `title`. The Control carries `name` (the entry name the
 * host gave the response) and `value="true"`, so pressing it posts the response `true` through the
 * host's form and ends the attempt; no script is involved, and the module has no runtime. A
 * submission by any other means posts no entry for the response, which decodes to `false` through
 * {@link InteractionModule.absentValue}, whatever default value the response declares: the
 * information model sets the response to `false` whenever the attempt ends another way, and
 * ignores its default value. The module renders no `form`; the host composes one around the item.
 *
 * That response, set by how the attempt ended, is not a candidate response for the skip judgement
 * under `allow-skipping="false"`: `skipped` in `#plate/session/submit.ts` leaves out a response
 * whose posting carries an `absent` value (issue ei-02b).
 *
 * - **Binding.** A response of cardinality `single` and base type `boolean`; any other binding is the
 *   notice naming the one it breaks, as for the four shipped kinds.
 * - **Name.** The button's own text, `title`, names it, so the renderer numbers no name for it among
 *   the answers' Controls (Q10) and the author's `aria-label` and `aria-labelledby` are not
 *   written: a name that left the visible text out would break WCAG 2.5.3. A `title` that is blank
 *   gives the button no text, so then the author's `aria-label` and `aria-labelledby` name it, else
 *   the renderer does: "End attempt".
 * - **Target size.** The button is in the author's sentence, which WCAG 2.5.8 (Minimum) excepts under
 *   its Inline exception; the stylesheet gives it 24px at the least where it stands alone.
 * - **Modes.** The Control is `disabled` in review and solution and when the author finished the
 *   item. The Root carries `data-count-attempt` with the value read, a hint for the host.
 *
 * **`count-attempt` is a boolean** (reading 27 of `docs/spec-readings.md`). The information model's
 * description of the attribute on `qti-end-attempt-interaction` reads as a count of attempts, but
 * its type is boolean in both the XSD and the information model's own attribute table, and the type
 * is followed. Its meaning is carried at the stated default (G-928, an operator ruling the pull
 * request proposes): `true`, or absent, counts the attempt and ends it, as any submission does; any
 * other value, `false`, leaves `numAttempts` unchanged for the attempt the candidate ended through
 * this button. A submission without the button counts as any submission does, whatever
 * `count-attempt` says. {@link InteractionModule.countsAttempt} carries the rule to the engine
 * through the hubs, so `runAttempt` names no kind.
 *
 * {@link validateEndAttempt} checks a value the caller decoded, in tier (a) only: an entry the
 * button cannot have posted. The messages are English and live here, a stated limit that a later
 * pass centralises.
 *
 * @module
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Root_EndAttemptInteraction
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import { text, when } from "#plate/emit/node.ts";
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
  TextProps,
} from "#plate/interactions/contract.ts";
import type { Locale } from "#plate/messages.ts";
import { nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, ValidationMessage } from "#plate/payload.ts";

/**
 * The owner of every End Attempt part in the part table.
 */
const owner = "end-attempt-interaction";

/**
 * End Attempt's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-4";

/**
 * The QTI element End Attempt is read from.
 */
const element = "qti-end-attempt-interaction";

/**
 * An End Attempt part.
 */
type EndAttemptPart = "control" | "root";

/**
 * An End Attempt as the model holds it: the fields every module's node shares, and its own.
 */
export interface EndAttemptInteraction extends ModuleInteraction<"end-attempt"> {
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `count-attempt`, true when absent: whether the attempt the candidate ends through the button
   * counts, at the stated default (G-928).
   */
  readonly countAttempt: boolean;
  /**
   * `title`, as written: the text the button shows.
   */
  readonly title: string;
}

/**
 * The JSON form of {@link EndAttemptInteraction} in a redacted body: its encoded side, which holds
 * no path.
 */
export interface EndAttemptJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly class: string;
  readonly countAttempt: boolean;
  readonly kind: "end-attempt";
  readonly path?: unknown;
  readonly response: string;
  readonly title: string;
}

/**
 * How a Control is named when its `title` gives it no text: the author's names, which name it
 * instead.
 */
export interface EndAttemptName {
  /**
   * The author's `aria-label`, none when blank or absent.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, as written.
   */
  readonly ariaLabelledby: Option.Option<string>;
}

/**
 * An End Attempt as the page may know it: what the module's `redact` copies of the model node and
 * reads of the view.
 */
export interface EndAttemptPayload {
  readonly autofocus: boolean;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `count-attempt`, which the Root carries as `data-count-attempt`.
   */
  readonly countAttempt: boolean;
  /**
   * The name the Control posts under.
   */
  readonly formName: string;
  readonly name: EndAttemptName;
  readonly response: string;
  /**
   * The text the Control shows.
   */
  readonly title: string;
}

/**
 * The attributes of every part of one End Attempt, and the text of its Control, computed once by
 * {@link connect}.
 */
interface EndAttemptConnected extends Connected {
  readonly control: TextProps;
  readonly root: Attributes;
}

/**
 * The rows of the End Attempt parts.
 *
 * The Control is a native submit button. Its `type`, `name` and `value` are the interaction's, in
 * `merged`, so a replacement stays the button that posts `true` under the response's entry name;
 * `disabled` is merged too, so a replacement cannot enable what plate disabled or disable what it
 * left enabled on its own element. The Root is a phrasing container, so it stands in a sentence.
 */
const parts = {
  control: {
    defaults: {},
    element: "button",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "disabled",
      "aria-label",
      "aria-labelledby",
      "aria-describedby",
      "autofocus",
    ],
    tagClass: "button",
  },
  root: {
    defaults: {},
    element: "qti-end-attempt-interaction",
    listOwner: false,
    merged: ["class", "data-count-attempt"],
    tagClass: "phrasing-container",
  },
} as const satisfies { readonly [Q in EndAttemptPart]: PartSpec };

/**
 * The row of every End Attempt part, which no placement changes.
 */
const rows = {
  control: partRow({ owner, parts }, "control"),
  root: partRow({ owner, parts }, "root"),
} as const satisfies { readonly [Q in EndAttemptPart]: PartRow };

/**
 * The messages of one locale: the renderer's own name for a button with no text, and what a
 * refused entry asks of the candidate.
 */
interface Words {
  /**
   * The name of a button whose `title` gives no text and whose author named it none.
   */
  readonly endAttempt: string;
  /**
   * The entry did not come from the button: press it again.
   */
  readonly notRecognised: (label: string) => string;
}

/**
 * The messages, by locale: English, written here (rule 11 of the handbook).
 */
const words = {
  en: {
    endAttempt: "End attempt",
    notRecognised: (label) => `The ${label} button was not recognised. Press it again.`,
  },
} as const satisfies Readonly<Record<Locale, Words>>;

/**
 * The value the response takes when the attempt ends any way but through the button: a single
 * boolean `false`.
 */
const notPressed: Value = {
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: false }],
};

/**
 * Tell whether a submission's value of the response is the button's `true`.
 *
 * @param posted The submission's responses, by identifier.
 * @param response The identifier of the End Attempt's response.
 * @returns Whether the response holds a boolean `true`; false for `false`, NULL and a response the
 *   submission did not set.
 */
const endedThroughButton = (posted: Readonly<Record<string, Value>>, response: string): boolean =>
  posted[response]?.values.some((single) => single.baseType === "boolean" && single.value) ?? false;

/**
 * Give the Control's naming attributes (Q10).
 *
 * A `title` with text names the Control, so none is written. A `title` that is blank leaves the
 * Control no text, so the author's `aria-label` and `aria-labelledby` name it, the ids scoped by
 * the instance; with neither, the renderer does: "End attempt".
 *
 * @param interaction The End Attempt's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @param locale The locale of the renderer's own text.
 * @returns The Control's `aria-label` and `aria-labelledby`, none when its text names it.
 */
const controlName = (
  interaction: EndAttemptPayload,
  instance: string,
  locale: Locale,
): Attributes => {
  if (trimXmlSpace(interaction.title) !== "") {
    return {};
  }

  const labelledby = interaction.name.ariaLabelledby.pipe(
    Option.flatMap((ids) => authoredIdrefs(instance, ids)),
  );
  if (Option.isNone(interaction.name.ariaLabel) && Option.isNone(labelledby)) {
    return { "aria-label": words[locale].endAttempt };
  }

  return {
    ...Option.match(interaction.name.ariaLabel, {
      onNone: () => ({}),
      onSome: (label) => ({ "aria-label": label }),
    }),
    ...Option.match(labelledby, {
      onNone: () => ({}),
      onSome: (ids) => ({ "aria-labelledby": ids }),
    }),
  };
};

/**
 * Compute every attribute of every part of one End Attempt, and the Control's text: the connect
 * function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, and `data-count-attempt` with the value read.
 * - Control: a submit `button`; its id, the payload's `formName` as `name`, `value="true"`;
 *   `disabled` when finished or not editable (review and solution); its name ({@link controlName})
 *   when its text gives none; `aria-describedby` → the message ids when the response was refused;
 *   and `autofocus` when the payload says. Its text is the `title`. No `aria-invalid` is written:
 *   ARIA does not support it on a `button`.
 *
 * @param interaction The End Attempt's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode, `finished`
 *   and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part, and the Control's text.
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#attr-button-type
 */
const connect = (
  interaction: EndAttemptPayload,
  payload: Payload,
  locale: Locale,
): EndAttemptConnected => {
  const { instance } = payload;
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);

  return {
    control: {
      props: {
        ...controlName(interaction, instance, locale),
        ...when(messageIds.length > 0, { "aria-describedby": messageIds.join(" ") }),
        ...when(interaction.autofocus, { autofocus: true }),
        "data-slot": rows.control.slot,
        ...when(payload.finished || payload.mode !== "answering", { disabled: true }),
        id: scopedId(instance, interaction.response, "control"),
        name: interaction.formName,
        type: "submit",
        value: "true",
      },
      text: interaction.title,
    },
    root: {
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-count-attempt": String(interaction.countAttempt),
      "data-mode": payload.mode,
      ...when(payload.finished, { "data-disabled": true }),
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Render an End Attempt: a `qti-end-attempt-interaction` Root holding the submit button, its text
 * the `title`.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Root writes no `form`: the host composes the form that posts the button's entry.
 *
 * @param interaction The End Attempt's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode and
 *   `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The End Attempt Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 */
const renderEndAttempt = (
  interaction: EndAttemptPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  Result.gen(function* endAttemptRoot() {
    const props = connect(interaction, payload, state.locale);
    const place = (part: EndAttemptPart, attributes: Attributes, children: readonly Node[]) =>
      applyPart(
        rows[part],
        attributes,
        children,
        Option.getOrUndefined(state.parts.replacementFor(owner, part)),
      );
    const control = yield* place(
      "control",
      props.control.props,
      props.control.text === "" ? [] : [text(props.control.text)],
    );

    return yield* place("root", props.root, [control]);
  });

/**
 * Check an End Attempt's response, which the caller decoded, in tier (a) alone.
 *
 * The caller decodes the posted entry with `decode`, under the entry name its form gave the
 * Control, the End Attempt's binding (a single `boolean`) and the posting's options, and passes
 * the value, or the {@link Malformed} `decode` gave. The button posts `true` alone, so an entry
 * `decode` refused, whatever its reason (`boolean`, `single-many`, `file`, `character`), did not
 * come from the button; the message names it and asks the candidate to press it again. A decoded
 * value, `true` or `false`, and NULL, which a host that decodes without the posting's options gets
 * for no entry, are every one the page can have posted, so they give none.
 *
 * @param interaction The End Attempt.
 * @param input The decoded value, or why the entry did not decode.
 * @param configuration The configuration, which gives the locale.
 * @returns One message when the entry did not decode, none otherwise.
 */
export const validateEndAttempt = (
  interaction: EndAttemptInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  if (!(input instanceof Malformed)) {
    return [];
  }

  const { locale } = configuration;
  const title = trimXmlSpace(interaction.title);

  return [
    {
      response: interaction.response,
      text: words[locale].notRecognised(title === "" ? words[locale].endAttempt : title),
    },
  ];
};

/**
 * The End Attempt module.
 */
export const endAttemptModule: InteractionModule<
  "end-attempt",
  EndAttemptInteraction,
  EndAttemptPayload,
  EndAttemptPart,
  EndAttemptJson
> = {
  /**
   * A single boolean `false`: a submission without the button's entry sets the response to
   * `false`, whatever its default value, since the information model sets an End Attempt's
   * response to false whenever the attempt ends another way and ignores its default value.
   */
  absentValue: () => notPressed,
  /**
   * The response End Attempt binds: one, posted as `true` or `false`, with no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  connect,
  /**
   * No content: End Attempt has no Prompt and no children, so the emitter writes none through
   * `emitNodes`.
   */
  content: () => [],
  /**
   * One Control: the button.
   */
  controls: () => 1,
  /**
   * Whether the submission counts an attempt, at the stated default for `count-attempt` (G-928):
   * false only when `count-attempt` is false and the submission set the response to the button's
   * `true`, so the attempt the candidate ended through this button is not counted; true otherwise,
   * for a submission without the button and for `count-attempt` true or absent.
   */
  countsAttempt: (interaction, posted) =>
    interaction.countAttempt || !endedThroughButton(posted, interaction.response),
  element,
  feature,
  implemented: true,
  kind: "end-attempt",
  /**
   * The NULL of End Attempt's own binding: a single boolean, holding none.
   */
  nullValue: () => nullOf("boolean", "single"),
  owner,
  /**
   * Read a `qti-end-attempt-interaction` into its model node, or its notice.
   *
   * The response must be declared; it must be single and a `boolean`, else the notice names the
   * cardinality or the base type it breaks, as the shipped kinds' do. `title` is required, and
   * kept as written. `count-attempt` reads as `xs:boolean` and is true when absent, the stated
   * default (G-928).
   */
  parse: (source, { notice, path, read }) =>
    Result.gen(function* readEndAttempt() {
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

      if (written("base-type") !== "boolean") {
        return yield* notice(`base-type="${written("base-type")}"`);
      }

      const title = yield* read.requiredValue(source, "title");

      read.markElement(source);

      const countAttempt = yield* read.xsBoolean(source, "count-attempt", true);
      const interaction: EndAttemptInteraction = {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        countAttempt,
        kind: "end-attempt",
        path,
        response: read.identifierOf(response.value),
        title,
      };

      return interaction;
    }),
  parts,
  /**
   * The JSON form of the model node: every field and no path.
   */
  payloadSchema: ({ NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      class: Schema.String,
      countAttempt: Schema.Boolean,
      kind: Schema.Literal("end-attempt"),
      path: NoPath,
      response: Schema.String,
      title: Schema.String,
    }),
  /**
   * Copy the model node into its payload node: the Control's name posted under the host's entry
   * name, and the author's names, which name the Control only when its `title` gives it no text.
   */
  redact: (interaction, kit) => ({
    autofocus: kit.autofocus,
    class: interaction.class,
    countAttempt: interaction.countAttempt,
    formName: kit.formName(interaction.response),
    name: {
      ariaLabel: interaction.ariaLabel.pipe(Option.filter((label) => trimXmlSpace(label) !== "")),
      ariaLabelledby: interaction.ariaLabelledby,
    },
    response: interaction.response,
    title: interaction.title,
  }),
  /**
   * No region: End Attempt holds no content.
   */
  regions: () => [],
  render: renderEndAttempt,
  /**
   * The node itself, as it has no region.
   */
  replaceRegions: (interaction) => interaction,
  /**
   * The value End Attempt shows for a stored response: the stored value itself, of which the button
   * shows nothing.
   */
  restore: (_interaction, stored) => stored,
  /**
   * No order: End Attempt has no choices to shuffle.
   */
  sequence: () => Option.none(),
  /**
   * The value End Attempt shows for the correct response: the correct value itself, of which the
   * button shows nothing.
   */
  solution: (_interaction, correct) => correct,
  /**
   * Never: the button's own text, its `title`, names it, so the renderer numbers no name for it
   * among the Controls it names (Q10), whatever the author named.
   */
  unnamed: () => false,
  validate: validateEndAttempt,
};
