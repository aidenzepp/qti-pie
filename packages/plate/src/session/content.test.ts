import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import { redact, render } from "#plate/render.ts";
import { stub } from "#plate/test-features/contract.ts";
import type { TestFeatureModule } from "#plate/test-features/contract.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The model node of {@link landedStylesheet}: the package path its element names.
 */
interface StyleNode {
  readonly href: string;
}

/**
 * A test-level Stylesheet module as `m5-06` will land it, reduced to what the host's reader and the
 * item's instance reach: it renders the rule the host's text for its path makes under the item
 * Root's id, `#<scopedId(instance, "item")> <text>`, carried as the `data-rule` of a childless
 * `style` element, since the serialiser refuses any child of one (`RawTextChildren`).
 */
const landedStylesheet: TestFeatureModule<"qti-stylesheet", StyleNode> = {
  ...stub({
    element: "qti-stylesheet",
    feature: ["T-3"],
    issue: "m5-06",
    key: "qti-stylesheet",
    namespace: qtiNamespace,
  }),
  implemented: true,
  render: (node, _state, kit) =>
    Result.succeed(
      Option.match(kit.files(node.href), {
        onNone: () => h("span", { "data-stylesheet": "none" }),
        onSome: (css) => h("style", { "data-rule": `#${scopedId(kit.instance, "item")} ${css}` }),
      }),
    ),
};

/**
 * An item with one paragraph, which the host renders beside the test content under one instance.
 */
const itemXml = `<qti-assessment-item xmlns="${qtiNamespace}" identifier="i1" title="One" adaptive="false" time-dependent="false"><qti-item-body><p>One.</p></qti-item-body></qti-assessment-item>`;

/**
 * The host's reader of package files here: it holds the one file the landed module asks for.
 *
 * @param path A package-relative path.
 * @returns The file's text, none for any other path.
 */
const holdsStyle = (path: string): Option.Option<string> =>
  path === "style/test.css" ? Option.some("p { color: red }") : Option.none();

/**
 * Read the rules the `style` elements of a render carry, in document order.
 *
 * @param html The rendered HTML.
 * @returns Each `style` element's `data-rule`.
 */
const rulesIn = (html: string): readonly string[] =>
  [...html.matchAll(/<style data-rule="(?<rule>[^"]*)"><\/style>/gu)].map(
    ({ groups }) => groups?.["rule"] ?? "",
  );

describe("renderTestContent", () => {
  it.effect(
    "[W0-BH] hands a module's render the host's files and the item's instance, so its rule is confined to that item's Root",
    () =>
      Effect.gen(function* handsFiles() {
        vi.resetModules();
        vi.doMock("#plate/test-features/stylesheet.ts", () => ({
          stylesheetModule: landedStylesheet,
        }));

        const content = yield* Effect.promise(() => import("#plate/session/content.ts"));
        const configuration = yield* configure({});
        const opened = yield* open("items/i1.xml", new TextEncoder().encode(itemXml));
        const accepted = Option.getOrElse(acceptedItem(opened), () =>
          assert.fail(`the item is ${opened.verdict}`),
        );
        const instance = "sitting.1";
        const entries = [{ key: "qti-stylesheet", node: { href: "style/test.css" } }] as const;
        const item = yield* Effect.fromResult(
          render(redact(accepted, undefined, configuration), configuration, { instance }),
        );
        const withFile = yield* Effect.fromResult(
          content.renderTestContent(entries, configuration, { files: holdsStyle, instance }),
        );
        const without = yield* Effect.fromResult(
          content.renderTestContent(entries, configuration, { instance }),
        );
        const rootId = /^<qti-assessment-item [^>]*\bid="(?<id>[^"]*)"/u.exec(item.html)?.groups?.[
          "id"
        ];

        assert.strictEqual(rootId, scopedId(instance, "item"));
        assert.match(withFile.html, /^<div [^>]*data-slot="test-content"/u);
        assert.match(withFile.html, /^<div [^>]*id="sitting\.1-test-content"/u);
        assert.strictEqual(withFile.instance, instance);
        assert.deepStrictEqual(rulesIn(withFile.html), [`#${rootId} p { color: red }`]);
        assert.deepStrictEqual(rulesIn(without.html), []);
        assert.include(without.html, '<span data-stylesheet="none"></span>');
      }).pipe(
        Effect.ensuring(
          Effect.sync(() => {
            vi.doUnmock("#plate/test-features/stylesheet.ts");
            vi.resetModules();
          }),
        ),
      ),
  );
});
