/**
 * The render functions an author calls: {@link redact}, then {@link render} for the item and
 * {@link renderStatus} for the Status part, each a plain function that returns a `Result`.
 *
 * The library ends at parts and pure functions (rule `a9d04969`): `render` writes the item Root
 * around its body and nothing else, so the form, its submit control, where the Status part goes
 * and every step of a flow are the author's. Its one input that is not a function of its
 * arguments is the instance a render draws when the author passes none. This is a browser module:
 * it value-imports from `effect` only `Option`, `Array`, `pipe`, `Data` and `Result`.
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { emitBody } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { emitItem, emitStatus } from "#plate/emit/item.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import type { PartOverrides, Resolved, UnknownPart } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { checkInstance } from "#plate/form/encoding.ts";
import type { InstanceRequirement } from "#plate/form/encoding.ts";
import { renderChoice } from "#plate/interactions/choice.ts";
import { renderExtendedText } from "#plate/interactions/extended-text.ts";
import { renderTextEntry } from "#plate/interactions/text-entry.ts";
import type { Value } from "#plate/model/values.ts";
import { payload, redactItem } from "#plate/payload.ts";
import type { EmitState, Payload, Redacted, ValidationMessage, View } from "#plate/payload.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The author's inputs to one {@link render}, each optional.
 *
 * `parts` replaces parts through the swap invariant. `instance` is the instance token (see
 * {@link checkInstance}), drawn as a lowercase UUID when absent. `assetBase` overrides the
 * configuration's. `names`, `values` and `posted` are keyed by response identifier: the name a
 * response's controls post under (`entryName(instance, response)` when absent), the value they show
 * (NULL when absent), and the strings a refused post sent, which the controls show instead of
 * `values` when `messages` is not empty. `messages` are a refused post's validation messages: each
 * marks its response's controls invalid, and the first invalid Control takes `autofocus`.
 * `disabled` disables every control.
 */
export interface Options {
  readonly assetBase?: string;
  readonly disabled?: boolean;
  readonly instance?: string;
  readonly messages?: readonly ValidationMessage[];
  readonly names?: Readonly<Record<string, string>>;
  readonly parts?: PartOverrides;
  readonly posted?: Readonly<Record<string, readonly string[]>>;
  readonly values?: Readonly<Record<string, Value>>;
}

/**
 * What {@link render} and {@link renderStatus} return: the part's HTML.
 */
export interface Rendered {
  readonly html: string;
}

/**
 * Where an instance token was passed: `render`'s `options.instance` or `renderStatus`'s
 * `input.instance`.
 */
type InstanceSource = "input.instance" | "options.instance";

/**
 * What each {@link InstanceRequirement} says a broken token holds.
 */
const breaches: Readonly<Record<InstanceRequirement, (token: string) => string>> = {
  characters: (token) =>
    `holds ${JSON.stringify(/[^\w.:-]/u.exec(token)?.[0] ?? "")}, which is not an ASCII letter, a digit, "_", ".", ":" or "-"`,
  "id-boundary": (token) =>
    token.endsWith("-")
      ? `ends in "-", so its ids can equal another instance's`
      : `holds "--", so its ids can equal another instance's`,
  "non-empty": () => "is empty",
};

/**
 * What to pass instead, by where the token was passed.
 */
const instanceRemedies: Readonly<Record<InstanceSource, string>> = {
  "input.instance":
    'Pass the token the item was rendered with: ASCII letters, digits, "_", ".", ":" and "-", not ending in "-" and holding no "--"',
  "options.instance":
    'Omit instance to draw a UUID, or pass a token of ASCII letters, digits, "_", ".", ":" and "-" that does not end in "-" and holds no "--"',
};

/**
 * An instance token that breaks a requirement {@link checkInstance} checks: a developer error,
 * returned through a `Result`, never thrown.
 *
 * `requirement` is the first requirement the token breaks, and `source` says where it was passed.
 */
export class InvalidInstance extends Data.TaggedError("InvalidInstance")<{
  readonly requirement: InstanceRequirement;
  readonly source: InstanceSource;
  readonly token: string;
}> {
  /**
   * The token, what it breaks, and what to pass instead.
   */
  override get message(): string {
    return `The instance token ${JSON.stringify(this.token)} in ${this.source} ${breaches[this.requirement](this.token)}. ${instanceRemedies[this.source]}.`;
  }
}

/**
 * Check an instance token where it was passed.
 *
 * @param token The token.
 * @param source Where the author passed it.
 * @returns The token, or {@link InvalidInstance} naming the first requirement it breaks.
 */
const checkedInstance = (
  token: string,
  source: InstanceSource,
): Result.Result<string, InvalidInstance> =>
  Option.match(checkInstance(token), {
    onNone: () => Result.succeed(token),
    onSome: (requirement) => Result.fail(new InvalidInstance({ requirement, source, token })),
  });

/**
 * Copy an accepted document's item into the form the page may know: its body, title and language,
 * without its correct responses, mappings, defaults or processing.
 *
 * It takes only `check`'s `Accepted` (rule `723e580c`), so a hand-built item, which may hold a
 * `javascript:` href or an `onclick` that `check` would strip, never reaches {@link render}.
 *
 * @param document The document `check` accepted.
 * @returns The redacted item, the one input {@link render} takes.
 */
export const redact = (document: Accepted): Redacted => redactItem(document.item);

/**
 * Give a record keyed by response identifier as the map a view holds.
 *
 * @param record The author's record, none when absent.
 * @returns Its entries as a map, empty when absent.
 */
const mapOf = <A>(record: Readonly<Record<string, A>> = {}): ReadonlyMap<string, A> =>
  new Map(Object.entries(record));

/**
 * Build the view of one render from the author's options.
 *
 * @param instance The checked or drawn instance token.
 * @param configuration The configuration, which gives the locale.
 * @param options The author's options.
 * @returns The view `payload` reads.
 */
const viewOf = (instance: string, configuration: Configuration, options: Options): View => ({
  finished: options.disabled ?? false,
  instance,
  locale: configuration.locale,
  messages: options.messages ?? [],
  names: mapOf(options.names),
  posted: Option.map(Option.fromUndefinedOr(options.posted), mapOf),
  values: mapOf(options.values),
});

/**
 * Build the emit state of one render.
 *
 * @param configuration The configuration, which gives the locale, the heading level and the asset
 *   base.
 * @param parts The resolved part overrides.
 * @param assetBase The author's asset base, which overrides the configuration's.
 * @returns The emit state.
 */
const stateOf = (configuration: Configuration, parts: Resolved, assetBase?: string): EmitState => ({
  assetBase: assetBase ?? configuration.assetBase,
  headingLevel: configuration.headingLevel,
  locale: configuration.locale,
  parts,
});

/**
 * Construct the render function each interaction of a body is handed to, dispatching on its kind.
 *
 * @param built The render's payload.
 * @param state The render's emit state.
 * @returns The function that renders one interaction through its module.
 */
const interactionRenderer =
  (built: Payload, state: EmitState): RenderInteraction =>
  (interaction) => {
    switch (interaction.kind) {
      case "choice": {
        return renderChoice(interaction, built, state);
      }
      case "extended-text": {
        return renderExtendedText(interaction, built, state);
      }
      case "text-entry": {
        return renderTextEntry(interaction, built, state);
      }
      default: {
        return interaction satisfies never;
      }
    }
  };

/**
 * Render an item: the item Root around its body, as HTML.
 *
 * It resolves the overrides once, takes the instance from `options.instance` or draws a lowercase
 * UUID (`crypto.randomUUID()`, never derived from the seed), builds the payload from the redacted
 * item and the options, and emits the body and the Root. It writes no form, submit control, title
 * or record. Given the same instance and inputs, it gives the same HTML.
 *
 * @example
 *   const rendered = render(redact(accepted), configuration, { instance: "q1" });
 *   // Result.succeed({ html: '<qti-assessment-item id="q1-item" …>…</qti-assessment-item>' })
 *
 * @param item The item `redact` gave.
 * @param configuration The configuration, which gives the locale, the heading level and the asset
 *   base.
 * @param options The author's inputs, none by default.
 * @returns The Root's HTML, or {@link UnknownPart} for an override the part table lacks,
 *   {@link InvalidInstance} for an instance token that breaks a requirement, or
 *   {@link PartSwapRefused} for a replacement that breaks the swap invariant.
 */
export const render = (
  item: Redacted,
  configuration: Configuration,
  options: Options = {},
): Result.Result<Rendered, InvalidInstance | PartSwapRefused | UnknownPart> =>
  Result.gen(function* renderItem() {
    const parts = yield* resolveOverrides(options.parts);
    const instance = yield* options.instance === undefined
      ? Result.succeed(crypto.randomUUID())
      : checkedInstance(options.instance, "options.instance");
    const state = stateOf(configuration, parts, options.assetBase);
    const built = payload(item, viewOf(instance, configuration, options));
    const body = yield* emitBody(built, state, interactionRenderer(built, state));
    const root = yield* emitItem(built, state, body);

    return { html: toHtml(root) };
  });

/**
 * Render the Status part: the status region, its heading and what it shows, as HTML.
 *
 * It checks `input.instance`, which must be the token the item was rendered with, then emits the
 * region through the same part overrides `render` takes. It places the region nowhere and moves
 * no focus.
 *
 * @example
 *   renderStatus({ heading: "scored", instance: "q1", score: "1" }, configuration);
 *   // Result.succeed({ html: '<section id="q1-status" role="status" …>…</section>' })
 *
 * @param input The author's Status input.
 * @param configuration The configuration, which gives the locale and the heading level.
 * @param options The part overrides, none by default.
 * @returns The region's HTML, or {@link InvalidInstance} for an `input.instance` that breaks a
 *   requirement, {@link UnknownPart} for an override the part table lacks, or
 *   {@link PartSwapRefused} for a replacement that breaks the swap invariant.
 */
export const renderStatus = (
  input: StatusInput,
  configuration: Configuration,
  options: Pick<Options, "parts"> = {},
): Result.Result<Rendered, InvalidInstance | PartSwapRefused | UnknownPart> =>
  Result.gen(function* renderStatusRegion() {
    yield* checkedInstance(input.instance, "input.instance");

    const parts = yield* resolveOverrides(options.parts);
    const region = yield* emitStatus(input, stateOf(configuration, parts));

    return { html: toHtml(region) };
  });
