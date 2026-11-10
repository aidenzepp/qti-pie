/**
 * The host's render of the content a test shows beside its items: {@link renderTestContent} turns
 * the `content` an item view or the summary carries ({@link TestContent}) into one block of HTML,
 * each node through its module's `render`, so a host places it beside the item.
 *
 * A module's node holds body nodes, such as a rubric block's or a test feedback's. The kit the host
 * hands its `render` prints them by the session's outcomes through the item body's printer, copies
 * them into payload nodes and emits them through the body's emitter, with a render function that
 * refuses every interaction: a test's rubric and feedback hold no interactions or templates, and
 * may print variables. This is a browser module: it value-imports from `effect` only `Option` and
 * `Result`.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { defaultView } from "#plate/content/contract.ts";
import { emitNodes } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { resolveOverrides, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOverrides, UnknownPart } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import type { MarkupRefused } from "#plate/emit/serialise.ts";
import { applyPart, PartSwapRefused } from "#plate/emit/swap.ts";
import { checkInstance } from "#plate/form/encoding.ts";
import { copyBodyNodes, printNodes } from "#plate/payload.ts";
import type { EmitState, InteractionPayload, ModulePayload, Payload } from "#plate/payload.ts";
import { InvalidInstance } from "#plate/render.ts";
import type { Rendered } from "#plate/render.ts";
import { drawInstance } from "#plate/seed.ts";
import type { TestSession } from "#plate/session/session.ts";
import { noSupports } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";
import type { TestContent, TestContentRenderKit } from "#plate/test-features/contract.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
import type { OutcomeView } from "#plate/vocabulary.ts";

/**
 * The author's inputs to one {@link renderTestContent}, each optional.
 *
 * `instance` is the token that scopes the block's id (`checkInstance` says what it may hold), drawn
 * as a lowercase UUID when absent. `assetBase` overrides the configuration's, and `parts` replaces
 * the `test-content` Root through the swap invariant. `supports` and `view` are what each module's
 * `render` decides by, `noSupports` and the candidate's when absent. `outcomes` are the session's
 * outcome values, `session.outcomes`, which a printed variable in the content prints; with none, a
 * printed variable is withheld behind its notice. `features` is the table whose modules render the
 * content, the package's `testFeatures` when absent, which a host passes only when it built the
 * content from another table.
 */
export interface TestContentOptions {
  readonly assetBase?: string;
  readonly features?: TestFeatureTable;
  readonly instance?: string;
  readonly outcomes?: TestSession["outcomes"];
  readonly parts?: PartOverrides;
  readonly supports?: Supports;
  readonly view?: OutcomeView;
}

/**
 * An interaction among a test's content, refused where the content is emitted: a
 * {@link PartSwapRefused} of the `test-content` Root, returned through a `Result`, never thrown.
 *
 * A rubric and a feedback hold no interaction, so one could come only from a module that read an
 * interaction into its node. It keeps `PartSwapRefused`'s tag and fields, so a host that handles
 * the refusals of a render handles this one too, and tells it apart by its message.
 */
class InteractionInTestContent extends PartSwapRefused {
  /**
   * The interaction, and what to change.
   */
  override get message(): string {
    return `Test content holds no interaction, but a module's node held ${this.detail}. Keep interactions in the item body: a test's rubric and feedback hold none.`;
  }
}

/**
 * Build the refusal of an interaction among test content.
 *
 * @param kind The interaction's kind.
 * @param response The response it binds, none for an interaction a module parses.
 * @returns The refusal.
 */
const refusalOf = (kind: string, response?: string): InteractionInTestContent =>
  new InteractionInTestContent({
    cause: "root-not-allowed",
    detail:
      response === undefined
        ? `a ${kind} interaction`
        : `a ${kind} interaction for the response ${JSON.stringify(response)}`,
    interaction: "test-content",
    part: "root",
  });

/**
 * The render function test content is emitted through: it refuses every interaction it is handed,
 * the shipped four and a module's alike, since test content holds none.
 */
const refusingInteractions: RenderInteraction = Object.assign(
  (interaction: InteractionPayload) =>
    Result.fail<PartSwapRefused>(refusalOf(interaction.kind, interaction.response)),
  {
    modules: (interaction: ModulePayload) =>
      Result.fail<PartSwapRefused>(refusalOf(interaction.kind)),
  },
);

/**
 * Build the payload test content is emitted under: its nodes as the body, which the emitter reads
 * the heading shift from, the instance that scopes their ids, and the language the content is
 * written in. It holds no message and no notice, and nothing in it can be answered.
 *
 * @param body The payload nodes the module's body nodes were copied into.
 * @param instance The instance token.
 * @param configuration The configuration, which gives the locale.
 * @returns The payload.
 */
const payloadOf = (
  body: Payload["body"],
  instance: string,
  configuration: Configuration,
): Payload => ({
  body,
  finished: true,
  instance,
  lang: configuration.locale,
  messages: [],
  mode: "review",
  notices: [],
  title: "",
});

/**
 * Build the kit a module's `render` is handed: the emission of body nodes by the session's
 * outcomes, and the supports and the view the content is shown to.
 *
 * `nodes` prints the body nodes through the item body's printer (`printNodes`), held to the
 * configuration's output budget, with a record that holds the outcomes and no template value, so a
 * printed variable naming no outcome, and a template block or inline, are withheld behind their
 * notices. It then copies them to payload nodes and emits them as the body emits an item's, and an
 * interaction among them is refused.
 *
 * @param state The emit state.
 * @param configuration The configuration, which gives the output budget and the locale.
 * @param instance The instance token.
 * @param outcomes The session's outcome values.
 * @returns The kit.
 */
const kitOf = (
  state: EmitState,
  configuration: Configuration,
  instance: string,
  outcomes: TestSession["outcomes"],
): TestContentRenderKit => ({
  nodes: (nodes) => {
    const printed = printNodes(nodes, Option.some({ outcomes, templates: {} }), configuration);
    const copied = copyBodyNodes(printed, instance);

    return emitNodes(
      copied,
      payloadOf(copied, instance, configuration),
      state,
      refusingInteractions,
    );
  },
  supports: state.supports ?? noSupports,
  view: state.view ?? defaultView,
});

/**
 * Check an instance token where it was passed.
 *
 * @param token The token.
 * @returns The token, or {@link InvalidInstance} naming the first requirement it breaks.
 */
const checkedInstance = (token: string): Result.Result<string, InvalidInstance> =>
  Option.match(checkInstance(token), {
    onNone: () => Result.succeed(token),
    onSome: (requirement) =>
      Result.fail(new InvalidInstance({ requirement, source: "options.instance", token })),
  });

/**
 * Render the content a test shows beside an item, or beside the summary, as HTML.
 *
 * Each entry of `content` is rendered through the `render` of the module its key names, in the
 * order the entries are given, and the elements stand together under the `test-content` Root, a
 * `div` whose `id` is `scopedId(instance, "test-content")` and whose marker is `test-content`,
 * which a host places beside the item and restyles or replaces through `parts` as any part. An
 * entry whose key the table holds no module for renders nothing: it can come only from a table
 * other than the one that presented it. With no content it writes nothing, `html` is empty, and the
 * Root is not written. Like `render`, it resolves the part overrides first, then checks the
 * instance token, or draws a lowercase UUID when none is passed, and it returns the token it used.
 * A heading in the content is shifted to the configuration's `headingLevel` as an item's headings
 * are; only a configuration built by hand, with a level that is no integer, breaks it, and the tag
 * it would write is refused as {@link MarkupRefused}.
 *
 * @example
 *   const view = Result.getOrThrow(itemViews(test, session, configuration, [1]))[0];
 *   renderTestContent(view.content, configuration, { instance: "q1", outcomes: session.outcomes });
 *   // Result.succeed({ html: '<div data-slot="test-content" id="q1-test-content">…</div>', instance: "q1" })
 *
 * @param content The `content` of an item view or of the summary.
 * @param configuration The configuration, which gives the locale, the heading level, the asset base
 *   and the output budget the printed text is held to.
 * @param options The author's further inputs, none by default.
 * @returns The Root's HTML and the instance token it used, or {@link UnknownPart} for an override
 *   the part table lacks, {@link InvalidInstance} for an instance token that breaks a requirement,
 *   {@link PartSwapRefused} for a replacement that breaks the swap invariant or an interaction
 *   among the content, or {@link MarkupRefused} for a replacement holding markup the serialiser
 *   cannot write.
 */
export const renderTestContent = (
  content: readonly TestContent[],
  configuration: Configuration,
  options: TestContentOptions = {},
): Result.Result<Rendered, InvalidInstance | MarkupRefused | PartSwapRefused | UnknownPart> =>
  Result.gen(function* renderContent() {
    const parts = yield* resolveOverrides(options.parts);
    const instance = yield* options.instance === undefined
      ? Result.succeed(drawInstance())
      : checkedInstance(options.instance);
    const state: EmitState = {
      assetBase: options.assetBase ?? configuration.assetBase,
      headingLevel: configuration.headingLevel,
      locale: configuration.locale,
      parts,
      supports: options.supports ?? noSupports,
      view: options.view ?? defaultView,
    };
    const kit = kitOf(state, configuration, instance, options.outcomes ?? {});
    const features = options.features ?? testFeatures;
    const elements = yield* Result.all(
      content.flatMap(({ key, node }) => {
        const module = features.find((candidate) => candidate.key === key);

        return module === undefined ? [] : [module.render(node, state, kit)];
      }),
    );
    if (elements.length === 0) {
      return { html: "", instance };
    }

    const row = rowFor("test-content", "root");
    const root = yield* applyPart(
      row,
      { "data-slot": row.slot, id: scopedId(instance, "test-content") },
      elements,
      Option.getOrUndefined(parts.replacementFor("test-content", "root")),
    );

    return { html: yield* toHtml(root), instance };
  });
