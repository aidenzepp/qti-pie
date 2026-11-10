/**
 * The host-side rendering of test content: the nodes the test-feature modules present beside an
 * item, each rendered through its module's `render` with the host's reader of package files and the
 * instance of the item they are shown with, and joined under one `div`.
 *
 * Issue `m5-06` fills the test-level stylesheet module, which renders a `<style>` for each item
 * view confined to that item's Root: the host passes the item's instance to the item's `render` and
 * to {@link renderTestContent}, and the module reads `kit.instance` and `kit.files`. Plate reads no
 * file itself. This is a browser module: it value-imports from `effect` only `Option` and
 * `Result`.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { defaultView } from "#plate/content/contract.ts";
import { h } from "#plate/emit/node.ts";
import type { Element } from "#plate/emit/node.ts";
import { resolveOverrides, scopedId } from "#plate/emit/parts.ts";
import type { PartOverrides, UnknownPart } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import type { MarkupRefused } from "#plate/emit/serialise.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { checkInstance } from "#plate/form/encoding.ts";
import type { EmitState } from "#plate/payload.ts";
import { InvalidInstance } from "#plate/render.ts";
import type { Rendered } from "#plate/render.ts";
import { drawInstance } from "#plate/seed.ts";
import { noSupports } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";
import { TestFeatureNotImplemented } from "#plate/test-features/contract.ts";
import type { TestContent, TestContentRenderKit } from "#plate/test-features/contract.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
import type { OutcomeView } from "#plate/vocabulary.ts";

/**
 * Throw for the kit's `nodes`, which the issue that lands the test-content seam (`gate-bf`) fills:
 * no module of the table calls it, since every stub's `render` throws before it reads the kit.
 *
 * @returns Nothing: it always throws.
 * @throws {TestFeatureNotImplemented} Always, naming `TestContentRenderKit.nodes`.
 */
const nodesNotImplemented = (): never => {
  throw new TestFeatureNotImplemented({
    feature: "TestContentRenderKit.nodes",
    issue: "gate-bf",
  });
};

/**
 * The reader of package files a render uses when the host passed none: it holds no file, so every
 * path reads as none.
 *
 * @returns None.
 */
const noFiles: TestContentRenderKit["files"] = () => Option.none();

/**
 * Check an instance token the host passed.
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
 * Render the test content a session view carries, beside the item it is shown with, as HTML.
 *
 * It takes the instance from `options.instance` as given or draws a lowercase UUID, resolves the
 * overrides once, and renders each entry through its module's `render` with a kit that carries the
 * host's `files` (every path reads as none when the host passed none), the instance, the supports
 * and the view. The entries' elements stay in order under one `div` whose `data-slot` is
 * `test-content` and whose id is `scopedId(instance, "test-content")`. The host passes the item's
 * instance to the item's `render` and to this function, so a module that confines a rule to the
 * item's Root, `#<scopedId(instance, "item")>`, names the Root the host renders beside it. Plate
 * reads no file: `files` is called, never implemented, here.
 *
 * @param content The nodes the modules presented, in table order.
 * @param configuration The configuration, which gives the locale, the heading level and the asset
 *   base.
 * @param options The host's inputs, none by default.
 * @param options.assetBase The asset base, which overrides the configuration's.
 * @param options.files The host's reader of package-relative paths, none when the host holds no
 *   such file; every path reads as none when absent.
 * @param options.instance The instance token of the item the content is shown with, drawn as a
 *   lowercase UUID when absent.
 * @param options.parts The part overrides, none by default.
 * @param options.supports The supports the host enabled, `noSupports` when absent.
 * @param options.view The view the content is shown to, the candidate's when absent.
 * @returns The HTML and the instance it used, or {@link InvalidInstance} for a token that breaks a
 *   requirement, {@link UnknownPart} for an override the part table lacks, {@link PartSwapRefused}
 *   for a replacement that breaks the swap invariant, or {@link MarkupRefused} for markup the
 *   serialiser cannot write.
 */
export const renderTestContent = (
  content: readonly TestContent[],
  configuration: Configuration,
  options: {
    readonly assetBase?: string;
    readonly files?: (path: string) => Option.Option<string>;
    readonly instance?: string;
    readonly parts?: PartOverrides;
    readonly supports?: Supports;
    readonly view?: OutcomeView;
  } = {},
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
    const kit: TestContentRenderKit = {
      files: options.files ?? noFiles,
      instance,
      nodes: nodesNotImplemented,
      supports: state.supports ?? noSupports,
      view: state.view ?? defaultView,
    };
    const table: TestFeatureTable = testFeatures;
    const elements: readonly Element[] = yield* Result.all(
      content.flatMap((entry) =>
        table
          .filter((module) => module.key === entry.key)
          .map((module) => module.render(entry.node, state, kit)),
      ),
    );
    const root = h(
      "div",
      { "data-slot": "test-content", id: scopedId(instance, "test-content") },
      elements,
    );

    return { html: yield* toHtml(root), instance };
  });
