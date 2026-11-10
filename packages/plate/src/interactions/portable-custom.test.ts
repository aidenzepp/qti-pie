import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option, Result, Schema } from "effect";
import { encodeRedacted } from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { entryName } from "#plate/form/encoding.ts";
import { fresh } from "#plate/model/record.ts";
import { encodeRecord } from "#plate/codec/record.ts";
import { readSource } from "#plate/document/read.ts";
import { buildItem } from "#plate/model/item.ts";
import { acceptForTest, acceptedItem } from "#plate/validate/verdict.ts";
import { openPackage } from "#plate/package/open.ts";
import { postings } from "#plate/payload.ts";
import type { RenderMode } from "#plate/payload.ts";
import { redact, render } from "#plate/render.ts";
import { restore } from "#plate/restore.ts";
import { solution } from "#plate/solution.ts";
import { open } from "#plate/validate/open.ts";
import type { Accepted } from "#plate/validate/verdict.ts";
import { checkTree, textOf } from "#plate/test/accessibility.ts";
import { parseHtml, roundTrips } from "#plate/test/round-trip.ts";
import { acceptedOf, openCorpus } from "#plate/test/sweep.ts";

/**
 * The package directory, `packages/plate`.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * The fresh PCI item fixture: a press counter bound to a single integer response, with a Prompt,
 * a printed variable, a hidden template inline and one `template` in its markup.
 */
const fixtureItem = "fixtures/pci/items/pci.xml";

/**
 * The fresh PCI fixture package, which the frame host (issue pci-04) loads.
 */
const fixturePackage = "fixtures/pci/package";

/**
 * The item instance every render here passes.
 */
const instance = "pci";

/**
 * The response the fixture's PCI binds.
 */
const response = "RESPONSE";

/**
 * The type identifier the fixture's PCI writes.
 */
const typeIdentifier = "urn:qti-pie:pci:counter";

/**
 * The entry name the fixture's response travels under in {@link instance}.
 */
const name = entryName(instance, response);

/**
 * The `data-slot` markers of the module's parts, derived as `partRow` derives them.
 */
const slots = {
  markup: "portable-custom-interaction-markup",
  notice: "portable-custom-interaction-notice",
  prompt: "portable-custom-interaction-prompt",
  root: "portable-custom-interaction",
  template: "portable-custom-interaction-template",
} as const;

/**
 * The item's Notice part marker, which no part of the module carries.
 */
const itemNotice = rowFor("item", "notice").slot;

/**
 * Opening the corpus takes seconds; the bound leaves room for a slow machine.
 */
const corpusTimeoutMs = 600_000;

/**
 * Read a file of the package as bytes.
 *
 * @param file The file's path from the package directory.
 * @returns Its bytes.
 */
const bytesOf = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(packageDirectory, file)));

/**
 * Open an item document under a location and give its accepted item, failing the test when it is
 * not accepted.
 *
 * @param location The location the verdict carries.
 * @param bytes The document's bytes.
 * @returns The accepted item.
 */
const acceptedFrom = (location: string, bytes: Uint8Array) =>
  Effect.map(open(location, bytes), (verdict) =>
    Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`${location} is ${verdict.verdict}: ${JSON.stringify(verdict)}`),
    ),
  );

/**
 * Open the fixture item.
 *
 * @returns The accepted item.
 */
const fixture = Effect.flatMap(bytesOf(fixtureItem), (bytes) => acceptedFrom(fixtureItem, bytes));

/**
 * Open the fixture item with its text changed.
 *
 * @param change The change to its text.
 * @returns The accepted item.
 */
const variant = (change: (text: string) => string) =>
  Effect.flatMap(bytesOf(fixtureItem), (bytes) =>
    acceptedFrom(fixtureItem, new TextEncoder().encode(change(new TextDecoder().decode(bytes)))),
  );

/**
 * Render an accepted item in one mode and parse its HTML into the item Root.
 *
 * @param accepted The item.
 * @param configuration The configuration.
 * @param mode The render mode, `answering` by default.
 * @returns The HTML and its one root element.
 */
const rendered = (
  accepted: Accepted,
  configuration: Configuration,
  mode: RenderMode = "answering",
): { readonly html: string; readonly root: Element } => {
  const redacted = redact(accepted, undefined, configuration);
  const result = render(redacted, configuration, { instance, mode });
  if (Result.isFailure(result)) {
    return assert.fail(`render failed: ${result.failure._tag}: ${result.failure.message}`);
  }

  const { html } = result.success;
  const [root, ...rest] = parseHtml(html);

  return root?.kind === "element" && rest.length === 0
    ? { html, root }
    : assert.fail("the HTML is not exactly one element");
};

/**
 * List an element and every element below it, in document order.
 *
 * @param node The subtree's root.
 * @returns The elements.
 */
const elementsIn = (node: Node): readonly Element[] =>
  node.kind === "element" ? [node, ...node.children.flatMap(elementsIn)] : [];

/**
 * Find the elements of a tree that carry one `data-slot` marker.
 *
 * @param tree The tree.
 * @param slot The marker.
 * @returns The elements, in document order.
 */
const slotted = (tree: Element, slot: string): readonly Element[] =>
  elementsIn(tree).filter((element) => element.attrs["data-slot"] === slot);

/**
 * Give the one element of a tree that carries a marker, failing the test otherwise.
 *
 * @param tree The tree.
 * @param slot The marker.
 * @returns The element.
 */
const only = (tree: Element, slot: string): Element => {
  const found = slotted(tree, slot);
  const [first] = found;

  return found.length === 1 && first !== undefined
    ? first
    : assert.fail(`the tree holds ${found.length} ${slot} parts, not one`);
};

/**
 * The configuration the Root's `data-pci-configuration` writes, as the frame host reads it.
 */
const ConfigurationSchema = Schema.Struct({
  contextVariables: Schema.Array(Schema.String),
  module: Schema.optionalKey(Schema.String),
  modules: Schema.optionalKey(
    Schema.Struct({
      modules: Schema.Array(
        Schema.Struct({
          fallbackPath: Schema.optionalKey(Schema.String),
          id: Schema.String,
          primaryPath: Schema.optionalKey(Schema.String),
        }),
      ),
      primaryConfiguration: Schema.optionalKey(Schema.String),
      secondaryConfiguration: Schema.optionalKey(Schema.String),
    }),
  ),
  properties: Schema.Record(Schema.String, Schema.String),
  responseIdentifier: Schema.String,
  templateVariables: Schema.Array(Schema.String),
});

/**
 * Read the one JSON attribute of the Root, `data-pci-configuration`.
 *
 * @param root The PCI Root.
 * @returns The configuration it carries, parsed and checked.
 */
const configurationOf = (root: Element): typeof ConfigurationSchema.Type => {
  const written = root.attrs["data-pci-configuration"];
  if (written === undefined || written === true) {
    return assert.fail("the Root carries no data-pci-configuration");
  }

  const decoded = Schema.decodeUnknownResult(ConfigurationSchema)(JSON.parse(written));

  return Result.isSuccess(decoded)
    ? decoded.success
    : assert.fail(`the configuration does not decode: ${decoded.failure.message}`);
};

/**
 * Read every file under a directory, keyed by its path from the directory with `/` separators, as
 * a host unzips a package.
 *
 * @param root The directory.
 * @returns The files.
 */
const filesOf = Effect.fnUntraced(function* filesOf(root: string) {
  const entries = yield* Effect.tryPromise(() =>
    readdir(root, { recursive: true, withFileTypes: true }),
  );
  const paths = entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(root, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"),
    );
  const contents = yield* Effect.all(
    paths.map((file) => Effect.tryPromise(() => readFile(path.join(root, file)))),
  );

  return new Map(paths.map((file, index) => [file, contents[index] ?? new Uint8Array()] as const));
});

/**
 * The corpus's QTI 3 PCI item writing `fallback-configuration`, which `open` refuses at that
 * attribute (reading: "A PCI's secondary module configuration is `secondary-configuration`").
 */
const fallbackMember = "qtiv3-examples/packaging/pci/src/fractions_deps_2.xml";

/**
 * Count the `qti-portable-custom-interaction` elements a member's text opens.
 *
 * @param bytes The member's bytes.
 * @returns The count.
 */
const pciCountIn = (bytes: Uint8Array): number =>
  new TextDecoder().decode(bytes).split("<qti-portable-custom-interaction").length - 1;

describe("the Portable Custom Interaction module", () => {
  it.effect("[Q-16] open accepts the fixture and its verdict lists no unsupported part", () =>
    Effect.gen(function* opens() {
      const bytes = yield* bytesOf(fixtureItem);
      const verdict = yield* open(fixtureItem, bytes);
      const accepted = acceptedItem(verdict);

      assert.isTrue(Option.isSome(accepted), verdict.verdict);

      const unsupported = accepted.pipe(
        Option.map((item) => item.unsupported),
        Option.getOrElse(() => []),
      );

      // No part of the PCI is a notice. The marks that stay are E3's: `open` secures the document
      // before the model is built and drops each attribute only a wildcard admits, the PCI's
      // `data-*` among them, so the properties reach the module only from an unsecured source.
      assert.deepStrictEqual(
        unsupported.filter((entry) => entry.shown === "notice"),
        [],
        JSON.stringify(unsupported),
      );
      assert.deepStrictEqual(
        unsupported.filter((entry) => entry.feature === "qti-portable-custom-interaction"),
        [],
      );
      assert.deepStrictEqual(
        unsupported.map((entry) => entry.feature),
        ["attribute:data-max-count", "attribute:data-start_value-2"],
      );
    }),
  );

  it.effect(
    "[Q-16] render emits the root with its type, status and entry name, the prompt, the markup and the notice",
    () =>
      Effect.gen(function* renders() {
        const configuration = yield* configure({});
        const { root } = rendered(yield* fixture, configuration);
        const pci = only(root, slots.root);
        const prompt = only(root, slots.prompt);
        const notice = only(root, slots.notice);

        assert.strictEqual(pci.tag, "qti-portable-custom-interaction");
        assert.strictEqual(pci.attrs["data-pci-type"], typeIdentifier);
        assert.strictEqual(pci.attrs["data-pci-status"], "interacting");
        assert.strictEqual(pci.attrs["data-entry-name"], name);
        assert.strictEqual(pci.attrs["data-mode"], "answering");
        assert.strictEqual(textOf(prompt), "Press the button three times.");
        assert.lengthOf(slotted(root, slots.markup), 1);
        assert.include(textOf(notice), "script");
        assert.lengthOf(slotted(root, itemNotice), 0);
        assert.strictEqual(pci.attrs["aria-labelledby"], prompt.attrs["id"]);
        assert.strictEqual(pci.attrs["role"], "group");
      }),
  );

  it.effect(
    "[Q-16] the configuration attribute holds dataset-named properties, the variable identifiers and the module facts",
    () =>
      Effect.gen(function* configured() {
        const configuration = yield* configure({});
        // The model is built from the source as written: `open` secures a document first, and its
        // E3 drops every attribute only a wildcard admits, the PCI's `data-*` among them, so the
        // properties reach the module only through `buildItem` today.
        const source = yield* readSource(fixtureItem, yield* bytesOf(fixtureItem));
        const built = acceptForTest(yield* Effect.fromResult(buildItem(source)));
        const { root } = rendered(built, configuration);
        const written = configurationOf(only(root, slots.root));

        assert.deepStrictEqual(written, {
          contextVariables: [],
          module: "counter",
          properties: { maxCount: "5", "start_value-2": "1" },
          responseIdentifier: response,
          templateVariables: ["START"],
        });

        const opened = configurationOf(
          only(rendered(yield* fixture, configuration).root, slots.root),
        );

        assert.deepStrictEqual(opened.templateVariables, ["START"]);
        assert.strictEqual(opened.module, "counter");
      }),
  );

  it.effect(
    "[Q-16] the markup is transformed: a printed variable shows its value, feedback and template content follow the item's state",
    () =>
      Effect.gen(function* transformed() {
        const configuration = yield* configure({});
        const { root } = rendered(yield* fixture, configuration);
        const markup = only(root, slots.markup);

        assert.include(textOf(markup), "The count starts at 7.");
        assert.include(textOf(markup), "Each press adds one.");
        assert.notInclude(textOf(markup), "a hint only a template value shows");
        assert.deepStrictEqual(
          elementsIn(markup).filter((element) => element.tag.startsWith("qti-")),
          [],
        );

        const shown = rendered(
          yield* variant((text) =>
            text.replace("<qti-value>NONE</qti-value>", "<qti-value>SHOWN</qti-value>"),
          ),
          configuration,
        );

        assert.include(
          textOf(only(shown.root, slots.markup)),
          "Each press adds one (a hint only a template value shows).",
        );

        const feedback = rendered(
          yield* variant((text) =>
            text
              .replace(
                "<qti-item-body>",
                '<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/><qti-item-body>',
              )
              .replace(
                "<template>",
                '<qti-feedback-block outcome-identifier="FEEDBACK" identifier="F" show-hide="show"><qti-content-body><p>Well done.</p></qti-content-body></qti-feedback-block><template>',
              ),
          ),
          configuration,
        );

        // The body walk resolves feedback as it resolves it today, as its notice.
        assert.notInclude(textOf(only(feedback.root, slots.markup)), "Well done.");
        assert.lengthOf(slotted(only(feedback.root, slots.markup), itemNotice), 1);
      }),
  );

  it.effect("[Q-16] each template is copied inert as an HTML template", () =>
    Effect.gen(function* templates() {
      const configuration = yield* configure({});
      const { html, root } = rendered(yield* fixture, configuration);
      const template = only(root, slots.template);
      const value = elementsIn(template).find(
        (element) => element.attrs["class"] === "counter-value",
      );

      assert.strictEqual(template.tag, "template");
      assert.strictEqual(value?.tag, "span");
      assert.strictEqual(textOf(value ?? template), "0");
      assert.match(html, /<template [^>]*>\s*<div class="counter-face">/u);
      assert.isTrue(
        slotted(root, slots.markup).some((markup) => elementsIn(markup).includes(template)),
        "the template sits in the markup, the element the PCI is handed",
      );
      // An inert template's content is not part of the document's live content: the parser keeps
      // it in the template's `content` fragment, which the round-trip reader reads back.
      assert.isTrue(roundTrips(root));
    }),
  );

  it.effect("[Q-16] an empty qti-interaction-markup renders an empty markup part", () =>
    Effect.gen(function* emptyMarkup() {
      const configuration = yield* configure({});
      const accepted = yield* variant((text) =>
        text.replace(
          /<qti-interaction-markup>[\s\S]*<\/qti-interaction-markup>/u,
          "<qti-interaction-markup/>",
        ),
      );
      const { root } = rendered(accepted, configuration);
      const markup = only(root, slots.markup);

      assert.deepStrictEqual(markup.children, []);
      assert.lengthOf(slotted(root, slots.template), 0);
      assert.lengthOf(slotted(root, slots.notice), 1);
    }),
  );

  it.effect("[Q-16] the status follows the render mode", () =>
    Effect.gen(function* status() {
      const configuration = yield* configure({});
      const accepted = yield* fixture;

      for (const [mode, expected] of [
        ["answering", "interacting"],
        ["review", "review"],
        ["solution", "solution"],
      ] as const) {
        const { root } = rendered(accepted, configuration, mode);

        assert.strictEqual(only(root, slots.root).attrs["data-pci-status"], expected, mode);
        assert.strictEqual(only(root, slots.root).attrs["data-mode"], mode, mode);
      }
    }),
  );

  it.effect("[Q-16] postings binds the declared response", () =>
    Effect.gen(function* binds() {
      const configuration = yield* configure({});
      const redacted = redact(yield* fixture, undefined, configuration);

      assert.deepStrictEqual(
        postings(redacted, instance).map(({ binding, identifier, options }) => ({
          binding,
          identifier,
          options,
        })),
        [
          {
            binding: { baseType: "integer", cardinality: "single", name },
            identifier: response,
            options: { base: 10 },
          },
        ],
      );
    }),
  );

  it.effect("[Q-16] the fixture package opens and its item renders with the modules it names", () =>
    Effect.gen(function* packaged() {
      const configuration = yield* configure({});
      const files = yield* filesOf(path.join(packageDirectory, fixturePackage));
      const verdict = yield* openPackage(fixturePackage, files);

      if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
        assert.fail(`the package is ${verdict.verdict}: ${JSON.stringify(verdict)}`);
      }

      assert.isTrue(files.has("modules/counter.js"));
      assert.isTrue(files.has("modules/module_resolution.js"));

      const [item, ...others] = [...verdict.accepted.items.values()];

      assert.isDefined(item);
      assert.deepStrictEqual(others, []);
      if (item === undefined) {
        return;
      }

      const { root } = rendered(item, configuration);
      const written = configurationOf(only(root, slots.root));

      assert.strictEqual(written.module, "counter");
      assert.deepStrictEqual(written.modules, {
        modules: [{ id: "counter", primaryPath: "../modules/counter" }],
        primaryConfiguration: "../modules/module_resolution.js",
      });
      assert.strictEqual(written.responseIdentifier, response);
    }),
  );

  it.effect(
    "[Q-16] the example corpus's QTI 3 PCI items: the ones open accepts render the root and the notice; the one writing fallback-configuration stays refused",
    () =>
      Effect.gen(function* corpus() {
        const configuration = yield* configure({});
        const members = yield* openCorpus;
        const pciMembers = members.filter((member) => pciCountIn(member.bytes) > 0);
        const acceptedMembers = pciMembers.flatMap((member) =>
          Option.toArray(Option.map(acceptedOf(member), (accepted) => ({ accepted, member }))),
        );

        assert.isNotEmpty(acceptedMembers, "no accepted corpus item holds a PCI");

        for (const { accepted, member } of acceptedMembers) {
          const { location } = member;
          const pciCount = pciCountIn(member.bytes);
          const { root } = rendered(accepted, configuration);

          assert.lengthOf(slotted(root, slots.root), pciCount, location);
          assert.lengthOf(slotted(root, slots.notice), pciCount, location);
          assert.lengthOf(slotted(root, slots.markup), pciCount, location);
          for (const pci of slotted(root, slots.root)) {
            assert.isString(pci.attrs["data-pci-type"], location);
            assert.strictEqual(pci.attrs["data-pci-status"], "interacting", location);
          }
          assert.deepStrictEqual(
            accepted.unsupported.filter(
              (entry) => entry.feature === "qti-portable-custom-interaction",
            ),
            [],
            location,
          );
        }

        const refused = pciMembers.find((member) => member.location === fallbackMember);

        assert.isDefined(refused);
        assert.deepStrictEqual(
          Exit.match(refused?.verdict ?? Exit.fail("missing"), {
            onFailure: () => [],
            onSuccess: (verdict) =>
              verdict.verdict === "refused"
                ? verdict.refusals
                    .filter((refusal) => refusal.rule === "unknown-attribute")
                    .map((refusal) =>
                      refusal.location.kind === "path"
                        ? refusal.location.path
                        : refusal.location.kind,
                    )
                : [`verdict ${verdict.verdict}`],
          }),
          [
            "qti-assessment-item/qti-item-body/div/qti-portable-custom-interaction[1]/qti-interaction-modules/@fallback-configuration",
          ],
        );
      }),
    corpusTimeoutMs,
  );

  it.effect("[Q-16] passes checkTree at base level 2, and its HTML round-trips", () =>
    Effect.gen(function* accessible() {
      const configuration = yield* configure({});
      const accepted = yield* fixture;

      for (const mode of ["answering", "review", "solution"] as const) {
        const { root } = rendered(accepted, configuration, mode);

        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), [], mode);
        assert.isTrue(roundTrips(root), mode);
      }
    }),
  );

  it.effect("[Q-16] redact's copy holds no correct response and no template value", () =>
    Effect.gen(function* redacted() {
      const configuration = yield* configure({});
      const accepted = yield* fixture;
      const copy = redact(accepted, undefined, configuration);
      const json = yield* Effect.fromResult(encodeRedacted(copy));
      const text = JSON.stringify(json);
      for (const hidden of ["correct", "defaultValue", "values", "outcomes", "processing"]) {
        assert.notInclude(text, `"${hidden}":`, hidden);
      }
      assert.notInclude(text, '"3"');
      assert.notInclude(text, "match_correct");
      assert.include(text, "The count starts at ");

      // The hubs reach the module's restore and solution through the bound response.
      assert.deepStrictEqual(solution(accepted), {
        [response]: {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 3n }],
        },
      });

      const stored = yield* Effect.fromResult(
        encodeRecord({
          ...fresh(accepted.item, instance),
          responses: {
            [response]: {
              baseType: "integer",
              cardinality: "single",
              values: [{ baseType: "integer", value: 2n }],
            },
          },
        }),
      );
      const restored = yield* Effect.fromResult(restore(accepted, stored));

      assert.deepStrictEqual(restored.values[response], {
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: 2n }],
      });
    }),
  );
});
