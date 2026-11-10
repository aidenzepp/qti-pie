import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, doc, el, text, xincludeNamespace } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { configure, open, openPackage, redact, render, score, startTest } from "#plate/index.ts";
import type { Accepted, PackageTest, PackageVerdict, Responses } from "#plate/index.ts";
import { includeDepthLimit, performIncludes } from "#plate/package/include.ts";
import type { IncludeInput, ReferenceCensus } from "#plate/package/include.ts";

/**
 * The fixture package's directory, which is also the location `openPackage` is given, so each
 * document's location is `fixtures/m3f/include/<path>`.
 */
const location = "fixtures/m3f/include";

/**
 * The fixture package's directory on disk.
 */
const fixtureDirectory = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "fixtures",
  "m3f",
  "include",
);

/**
 * The path of the fixture's including item inside the package.
 */
const itemPath = "items/choice.xml";

/**
 * The path of the fixture's test document inside the package.
 */
const testPath = "tests/test.xml";

/**
 * The path of the fragment the item's first include names, a `p`.
 */
const promptPath = "fragments/prompt.xml";

/**
 * The element path of the item's first include in its document, where its refusals point.
 */
const firstIncludePath = `qti-assessment-item/qti-item-body/{${xincludeNamespace}}include[1]`;

/**
 * The text the prompt fragment holds, which the merged item shows where the include stood.
 */
const promptText = "The keeper trims the wick before dusk.";

/**
 * The item's first include as the fixture writes it.
 */
const promptInclude = '<xi:include href="../fragments/prompt.xml"/>';

/**
 * The item's second include as the fixture writes it.
 */
const interactionInclude = '<xi:include href="../fragments/interaction.xml"/>';

/**
 * The namespace declarations a fragment written by a test carries: QTI's as the default, XInclude's
 * as `xi`.
 */
const fragmentNamespaces =
  'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"';

/**
 * The session instance every walk starts with.
 */
const instance = "sitting";

/**
 * The time every walk starts its session at.
 */
const startedAt = new Date("2026-11-10T10:00:00.000Z");

/**
 * The responses every score posts: the choice `A`, the correct response of every fixture item.
 */
const answer: Responses = {
  RESPONSE: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: "A" }],
  },
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
 * One edit of a fixture file before the package is opened: the text to find in the file at `file`,
 * which must occur there, and what to write in its place.
 */
interface Edit {
  readonly file: string;
  readonly from: string;
  readonly to: string;
}

/**
 * What a variant of the fixture changes: edits to its files, and files added to it, each its text.
 */
interface Variant {
  readonly added?: Readonly<Record<string, string>>;
  readonly edits?: readonly Edit[];
}

/**
 * Give the fixture's files with a variant applied; the test fails when an edit's text is not in
 * its file, so a reworded fixture cannot silently leave a variant unbuilt.
 *
 * @param variant The variant.
 * @returns The files.
 */
const variantFiles = Effect.fnUntraced(function* variantFiles(variant: Variant) {
  const files = new Map(yield* filesOf(fixtureDirectory));
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  for (const { file, from, to } of variant.edits ?? []) {
    const held = decoder.decode(files.get(file) ?? assert.fail(`the fixture has no ${file}`));

    assert.include(held, from, `${file} holds the text the variant replaces`);
    files.set(file, encoder.encode(held.replace(from, to)));
  }

  for (const [file, content] of Object.entries(variant.added ?? {})) {
    files.set(file, encoder.encode(content));
  }

  return files;
});

/**
 * Open the fixture package, with a variant applied to its files first.
 *
 * @param variant The variant, none by default.
 * @returns The verdict on the package.
 */
const openFixture = Effect.fnUntraced(function* openFixture(variant: Variant = {}) {
  return yield* openPackage(location, yield* variantFiles(variant));
});

/**
 * Write the sentence a refused verdict's refusals make, for a failure's message.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule, document and detail, or an empty text.
 */
const describeVerdict = (verdict: PackageVerdict): string =>
  verdict.verdict === "refused"
    ? `: ${verdict.refusals
        .map(
          (refusal) => `${refusal.rule} at ${refusal.document} ${JSON.stringify(refusal.detail)}`,
        )
        .join(", ")}`
    : "";

/**
 * Take an accepting verdict's contents; the test fails when the package does not accept.
 *
 * @param verdict The package verdict.
 * @returns The accepted package.
 */
const acceptedOf = (verdict: PackageVerdict) =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? verdict.accepted
    : assert.fail(`the package is ${verdict.verdict}, not accepted${describeVerdict(verdict)}`);

/**
 * Take the fixture's including item from an accepting verdict.
 *
 * @param verdict The package verdict.
 * @returns The accepted item.
 */
const itemOf = (verdict: PackageVerdict): Accepted =>
  acceptedOf(verdict).items.get(`${location}/${itemPath}`) ??
  assert.fail(`the package delivers no item at ${itemPath}`);

/**
 * Take the fixture's test from an accepting verdict.
 *
 * @param verdict The package verdict.
 * @returns The test with its items.
 */
const testOf = (verdict: PackageVerdict): PackageTest =>
  acceptedOf(verdict).tests.get(`${location}/${testPath}`) ??
  assert.fail(`the package delivers no test at ${testPath}`);

/**
 * The refusals of a verdict, none when it does not refuse.
 *
 * @param verdict The package verdict.
 * @returns The refusals.
 */
const refusalsOf = (verdict: PackageVerdict) =>
  verdict.verdict === "refused" ? verdict.refusals : [];

/**
 * Render an accepted item in answering mode.
 *
 * @param item The item.
 * @returns The HTML.
 */
const rendered = Effect.fnUntraced(function* rendered(item: Accepted) {
  const configuration = yield* configure({});

  return Result.getOrElse(render(redact(item), configuration, { instance }), (failure) =>
    assert.fail(`render failed: ${failure.message}`),
  ).html;
});

/**
 * Score an accepted item with {@link answer} and give its `SCORE`.
 *
 * @param item The item.
 * @returns The values of `SCORE`.
 */
const scored = (item: Accepted): readonly unknown[] =>
  Result.getOrElse(score(item, answer), (failure) =>
    assert.fail(`score failed: ${failure.message}`),
  ).outcomes["SCORE"]?.values.map((single) => single.value) ?? [];

/**
 * Write the files of a chain of fragments, `fragments/chain-1.xml` down to
 * `fragments/chain-<n>.xml`, each a `div` including the next and the last a `div` of text, with the
 * manifest entry listing them.
 *
 * @param length How many fragments the chain has.
 * @returns The files and the manifest's resource for them.
 */
const chainOf = (length: number) => {
  const files: Record<string, string> = {};
  for (let link = 1; link <= length; link += 1) {
    const content =
      link === length ? "The end of the chain." : `<xi:include href="chain-${link + 1}.xml"/>`;
    files[`fragments/chain-${link}.xml`] = `<div ${fragmentNamespaces}>${content}</div>`;
  }

  const listed = Object.keys(files)
    .map((file) => `<file href="${file}"/>`)
    .join("");

  return {
    files,
    resource: `<resource identifier="fragment-chain" type="imsqti_fragment_xmlv3p0" href="fragments/chain-1.xml">${listed}</resource>`,
  };
};

/**
 * The edit that adds a resource to the manifest, before its last resource ends.
 *
 * @param resource The resource's XML.
 * @returns The edit.
 */
const listing = (resource: string): Edit => ({
  file: "imsmanifest.xml",
  from: "</resources>",
  to: `${resource}</resources>`,
});

/**
 * The edit that makes the item's first include name a path the package lacks, with or without a
 * fallback.
 *
 * @param fallback Whether the include holds an `xi:fallback` with a `p`.
 * @returns The edit.
 */
const missingPrompt = (fallback: boolean): Edit => ({
  file: itemPath,
  from: promptInclude,
  to: fallback
    ? '<xi:include href="../fragments/absent.xml"><xi:fallback><p>The fallback stands in.</p></xi:fallback></xi:include>'
    : '<xi:include href="../fragments/absent.xml"/>',
});

/**
 * The edit that makes the item's first include name a resource outside the package, with or
 * without a fallback.
 *
 * @param fallback Whether the include holds an `xi:fallback` with a `p`.
 * @returns The edit.
 */
const externalPrompt = (fallback: boolean): Edit => ({
  file: itemPath,
  from: promptInclude,
  to: fallback
    ? '<xi:include href="https://example.org/prompt.xml"><xi:fallback><p>The fallback stands in.</p></xi:fallback></xi:include>'
    : '<xi:include href="https://example.org/prompt.xml"/>',
});

/**
 * The census a hand-built document's references are rewritten by: `img@src` and `source@srcset`,
 * as the package reader's names them, and no text.
 */
const census: ReferenceCensus = {
  attributesOf: (element) => {
    switch (element.local) {
      case "img": {
        return [{ local: "src", space: "collapse", srcset: false }];
      }
      case "source": {
        return [{ local: "srcset", space: "replace", srcset: true }];
      }
      default: {
        return [];
      }
    }
  },
  textOf: () => Option.none(),
};

/**
 * Construct an `xi:include` of an `href`.
 *
 * @param href The `href`.
 * @param children The include's children, none by default.
 * @returns The include.
 */
const include = (href: string, children: readonly SourceChild[] = []): SourceElement =>
  el("include", [attr("href", href)], children, xincludeNamespace);

/**
 * Perform the includes of a hand-built document against hand-built sources, under the package's
 * limits.
 *
 * @param document The document.
 * @param documentPath Its path in the package.
 * @param sources The package's sources by path.
 * @returns What performing gives.
 */
const performed = (
  document: SourceDocument,
  documentPath: string,
  sources: ReadonlyMap<string, SourceDocument>,
) => {
  const input: IncludeInput = {
    census,
    document,
    limits: { bytes: 4 * 1024 * 1024, placements: 2048 },
    location: "package",
    path: documentPath,
    placed: { bytes: 0, placements: 0 },
    sizeOf: () => 10,
    sources: new Map([...sources].map(([at, source]) => [at, Result.succeed(source)] as const)),
  };

  return performIncludes(input);
};

/**
 * The element children of an element.
 *
 * @param element The element.
 * @returns Its children that are elements.
 */
const elementsOf = (element: SourceElement): readonly SourceElement[] =>
  element.children.filter((child): child is SourceElement => child.kind === "element");

/**
 * Give an element's attribute value, as written.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns The value, or the failure of the test.
 */
const valueOf = (element: SourceElement, local: string): string =>
  element.attributes.find((attribute) => attribute.local === local)?.value ??
  assert.fail(`${element.local} has no ${local}`);

describe("an item that includes fragments", () => {
  it.effect(
    "[I-12] an item including a fragment is accepted and delivered as the merged item",
    () =>
      Effect.gen(function* merged() {
        const verdict = yield* openFixture();

        assert.strictEqual(verdict.verdict, "accepted", describeVerdict(verdict));

        const item = itemOf(verdict);
        const nodes = item.item.body.filter((node) => node.kind !== "text");

        assert.strictEqual(nodes.length, 2);
        assert.strictEqual(nodes[0]?.kind, "element");
        assert.strictEqual(nodes[0]?.kind === "element" ? nodes[0].tag : "", "p");
        assert.deepStrictEqual(nodes[0]?.kind === "element" ? nodes[0].children : [], [
          { kind: "text", text: promptText },
        ]);
        assert.strictEqual(nodes[1]?.kind, "choice");
      }),
  );

  it.effect(
    "[I-12] an included interaction binds the item's response and scores as written inline",
    () =>
      Effect.gen(function* scores() {
        const included = itemOf(yield* openFixture());
        const inline = itemOf(
          yield* openFixture({
            edits: [
              {
                file: itemPath,
                from: promptInclude,
                to: `<p>${promptText}</p>`,
              },
              {
                file: itemPath,
                from: interactionInclude,
                to: '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1"><qti-prompt>What does the keeper trim before dusk?</qti-prompt><qti-simple-choice identifier="A">The wick</qti-simple-choice><qti-simple-choice identifier="B">The anchor chain</qti-simple-choice></qti-choice-interaction>',
              },
            ],
          }),
        );

        assert.deepStrictEqual(scored(included), [1]);
        assert.deepStrictEqual(scored(included), scored(inline));
      }),
  );

  it.effect("[I-12] the merged item renders the fragment's content in place", () =>
    Effect.gen(function* renders() {
      const html = yield* rendered(itemOf(yield* openFixture()));

      assert.include(html, promptText);
      assert.include(html, "What does the keeper trim before dusk?");
      assert.include(html, 'type="radio"');
      assert.isBelow(html.indexOf(promptText), html.indexOf('type="radio"'));
    }),
  );

  it.effect(
    "[I-12] a fragment in a sub-folder has its image reference rewritten so the included item renders the image",
    () =>
      Effect.gen(function* figure() {
        // The fragment is two folders deep and the item one, so a reference resolved against the
        // wrong base names a path outside the package, and the render drops it.
        const verdict = yield* openFixture({
          added: {
            "fragments/deep/figure.xml": `<p ${fragmentNamespaces}><img src="../../items/media/lamp.png" alt="The lamp, lit"/></p>`,
            // The package holds the image's bytes; plate reads nothing of them.
            "items/media/lamp.png": "PNG",
          },
          edits: [
            {
              file: itemPath,
              from: promptInclude,
              to: '<xi:include href="../fragments/deep/figure.xml"/>',
            },
            listing(
              '<resource identifier="fragment-figure" type="imsqti_fragment_xmlv3p0" href="fragments/deep/figure.xml"><file href="fragments/deep/figure.xml"/><file href="items/media/lamp.png"/></resource>',
            ),
          ],
        });

        assert.strictEqual(verdict.verdict, "accepted", describeVerdict(verdict));

        const html = yield* rendered(itemOf(verdict));

        assert.include(html, 'src="media/lamp.png"');
        assert.notInclude(html, "../");
      }),
  );

  it.effect("[I-12] a missing fragment with a fallback uses the fallback's children", () =>
    Effect.gen(function* fallsBack() {
      const verdict = yield* openFixture({ edits: [missingPrompt(true)] });

      assert.strictEqual(verdict.verdict, "accepted", describeVerdict(verdict));

      const nodes = itemOf(verdict).item.body.filter((node) => node.kind !== "text");

      assert.strictEqual(nodes[0]?.kind === "element" ? nodes[0].tag : "", "p");
      assert.deepStrictEqual(nodes[0]?.kind === "element" ? nodes[0].children : [], [
        { kind: "text", text: "The fallback stands in." },
      ]);
      assert.strictEqual(nodes[1]?.kind, "choice");
    }),
  );

  it.effect(
    "[I-12] a missing fragment without a fallback is refused package-file-missing with check include",
    () =>
      Effect.gen(function* missing() {
        const verdict = yield* openFixture({ edits: [missingPrompt(false)] });

        assert.strictEqual(verdict.verdict, "refused");

        const refusal = refusalsOf(verdict).find((one) => one.rule === "package-file-missing");

        assert.isDefined(refusal);
        assert.strictEqual(refusal?.document, `${location}/${itemPath}`);
        assert.deepStrictEqual(refusal?.location, { kind: "path", path: firstIncludePath });
        assert.strictEqual(refusal?.detail["check"], "include");
        assert.strictEqual(refusal?.detail["href"], "../fragments/absent.xml");
        assert.strictEqual(refusal?.detail["path"], "fragments/absent.xml");
      }),
  );

  it.effect(
    "[I-12] an include whose href leaves the package is refused package-path-outside with check include unless it has a fallback",
    () =>
      Effect.gen(function* external() {
        const refused = yield* openFixture({ edits: [externalPrompt(false)] });

        assert.strictEqual(refused.verdict, "refused");

        const refusal = refusalsOf(refused).find((one) => one.rule === "package-path-outside");

        assert.isDefined(refusal);
        assert.strictEqual(refusal?.document, `${location}/${itemPath}`);
        assert.deepStrictEqual(refusal?.location, { kind: "path", path: firstIncludePath });
        assert.strictEqual(refusal?.detail["check"], "include");
        assert.strictEqual(refusal?.detail["href"], "https://example.org/prompt.xml");

        const accepted = yield* openFixture({ edits: [externalPrompt(true)] });

        assert.strictEqual(accepted.verdict, "accepted", describeVerdict(accepted));
      }),
  );

  it.effect(
    "[I-12] an include chain that returns to a document on it is refused inclusion-cycle",
    () =>
      Effect.gen(function* cycle() {
        const verdict = yield* openFixture({
          added: {
            "fragments/hop.xml": `<div ${fragmentNamespaces}><xi:include href="prompt.xml"/></div>`,
            [promptPath]: `<div ${fragmentNamespaces}><xi:include href="hop.xml"/></div>`,
          },
          edits: [
            listing(
              '<resource identifier="fragment-hop" type="imsqti_fragment_xmlv3p0" href="fragments/hop.xml"><file href="fragments/hop.xml"/></resource>',
            ),
          ],
        });

        assert.strictEqual(verdict.verdict, "refused");

        const refusal = refusalsOf(verdict).find((one) => one.rule === "inclusion-cycle");

        assert.isDefined(refusal);
        assert.strictEqual(refusal?.document, `${location}/fragments/hop.xml`);
        assert.deepStrictEqual(refusal?.location, {
          kind: "path",
          path: `div/{${xincludeNamespace}}include`,
        });
        assert.strictEqual(
          refusal?.detail["chain"],
          `${itemPath} ${promptPath} fragments/hop.xml ${promptPath}`,
        );
        assert.strictEqual(refusal?.detail["href"], "prompt.xml");
      }),
  );

  it.effect(
    "[I-12] an include chain deeper than 8 is refused assembly-limit with bound depth",
    () =>
      Effect.gen(function* depth() {
        const tooDeep = chainOf(includeDepthLimit + 1);
        const refused = yield* openFixture({
          added: tooDeep.files,
          edits: [
            {
              file: itemPath,
              from: promptInclude,
              to: '<xi:include href="../fragments/chain-1.xml"/>',
            },
            listing(tooDeep.resource),
          ],
        });

        assert.strictEqual(refused.verdict, "refused");

        const refusal = refusalsOf(refused).find((one) => one.rule === "assembly-limit");

        assert.isDefined(refusal);
        assert.strictEqual(refusal?.document, location);
        assert.deepStrictEqual(refusal?.detail, { bound: "depth", limit: "8", reached: "9" });

        const deep = chainOf(includeDepthLimit);
        const accepted = yield* openFixture({
          added: deep.files,
          edits: [
            {
              file: itemPath,
              from: promptInclude,
              to: '<xi:include href="../fragments/chain-1.xml"/>',
            },
            listing(deep.resource),
          ],
        });

        assert.strictEqual(accepted.verdict, "accepted", describeVerdict(accepted));
        assert.include(yield* rendered(itemOf(accepted)), "The end of the chain.");
      }),
  );

  it.effect(
    "[I-12] an include with an xpointer is not performed and leaves its document unchecked",
    () =>
      Effect.gen(function* pointed() {
        const verdict = yield* openFixture({
          edits: [
            {
              file: itemPath,
              from: promptInclude,
              to: '<xi:include href="../fragments/prompt.xml" xpointer="element(/1)"/>',
            },
          ],
        });

        assert.strictEqual(verdict.verdict, "unchecked", describeVerdict(verdict));
      }),
  );

  it.effect("[I-12] an include inside a qti-custom-interaction's markup is kept as written", () =>
    Effect.gen(function* custom() {
      const verdict = yield* openFixture({
        edits: [
          {
            file: itemPath,
            from: interactionInclude,
            to: `<qti-custom-interaction response-identifier="RESPONSE">${interactionInclude}</qti-custom-interaction>`,
          },
        ],
      });

      assert.strictEqual(verdict.verdict, "unchecked", describeVerdict(verdict));

      // The same, over a hand-built item: the include stays and nothing is merged there.
      const fragment = doc("items/f.xml", el("p", [], [text("merged")]));
      const item = doc(
        "items/i.xml",
        el(
          "qti-assessment-item",
          [],
          [
            el(
              "qti-item-body",
              [],
              [el("qti-custom-interaction", [], [include("f.xml")]), include("f.xml")],
            ),
          ],
        ),
      );
      const result = performed(item, "items/i.xml", new Map([["items/f.xml", fragment]]));

      assert.isTrue(Result.isSuccess(result));

      const included = Result.getOrThrow(result);
      const [body] = elementsOf(included.document.root);
      const [kept, spliced] = body === undefined ? [] : elementsOf(body);

      assert.strictEqual(included.performed, 1);
      assert.strictEqual(kept?.local, "qti-custom-interaction");
      assert.strictEqual(elementsOf(kept ?? el("none"))[0]?.namespace, xincludeNamespace);
      assert.strictEqual(spliced?.local, "p");
    }),
  );

  it.effect("[I-12] an item opened alone through open still leaves an include unchecked", () =>
    Effect.gen(function* alone() {
      const files = yield* filesOf(fixtureDirectory);
      const verdict = yield* open(
        `${location}/${itemPath}`,
        files.get(itemPath) ?? assert.fail(`the fixture has no ${itemPath}`),
      );

      assert.strictEqual(verdict.verdict, "unchecked");
    }),
  );
});

describe("a test that includes a fragment", () => {
  it.effect("[S-6] a section including an item ref fragment delivers that item ref's item", () =>
    Effect.gen(function* walks() {
      const configuration = yield* configure({});
      const verdict = yield* openFixture();

      assert.strictEqual(verdict.verdict, "accepted", describeVerdict(verdict));

      const delivery = testOf(verdict);

      assert.deepStrictEqual([...delivery.items.keys()], ["first", "second"]);
      assert.strictEqual(delivery.items.get("second")?.document, `${location}/items/second.xml`);

      const session = Result.getOrElse(
        startTest(delivery.test, delivery.items, configuration, { instance, now: startedAt }),
        (failure) => assert.fail(`startTest refused: ${failure.message}`),
      );

      assert.deepStrictEqual(
        session.items.map((item) => item.ref),
        ["first", "second"],
      );
    }),
  );
});

describe("the splice of a fragment", () => {
  it.effect(
    "[I-12] a fragment spliced into its own directory keeps its references as written",
    () =>
      Effect.sync(() => {
        const fragment = doc(
          "items/f.xml",
          el("p", [], [el("img", [attr("src", " ./media/a%20b.png?v=1 "), attr("alt", "")])]),
        );
        const item = doc(
          "items/i.xml",
          el("qti-assessment-item", [], [el("qti-item-body", [], [include("f.xml")])]),
        );
        const result = performed(item, "items/i.xml", new Map([["items/f.xml", fragment]]));
        const [body] = elementsOf(Result.getOrThrow(result).document.root);
        const [p] = body === undefined ? [] : elementsOf(body);
        const [img] = p === undefined ? [] : elementsOf(p);

        assert.strictEqual(valueOf(img ?? el("none"), "src"), " ./media/a%20b.png?v=1 ");
      }),
  );

  it.effect(
    "[I-12] a fragment spliced from another directory has each census reference rewritten to the same file",
    () =>
      Effect.sync(() => {
        const fragment = doc(
          "fragments/deep/f.xml",
          el(
            "div",
            [],
            [
              el("img", [attr("src", "../../items/media/a b.png#top")]),
              el("img", [attr("src", "https://example.org/x.png")]),
              el("img", [attr("src", "#anchor")]),
              el("img", [attr("src", "/rooted.png")]),
              el("source", [attr("srcset", "pic.png 1x, ../../items/media/pic@2x.png 2x")]),
              el("img", [attr("src", "../../../outside.png")]),
            ],
          ),
        );
        const item = doc(
          "items/i.xml",
          el(
            "qti-assessment-item",
            [],
            [el("qti-item-body", [], [include("../fragments/deep/f.xml")])],
          ),
        );
        const result = performed(
          item,
          "items/i.xml",
          new Map([["fragments/deep/f.xml", fragment]]),
        );
        const [body] = elementsOf(Result.getOrThrow(result).document.root);
        const [div] = body === undefined ? [] : elementsOf(body);
        const children = div === undefined ? [] : elementsOf(div);

        assert.deepStrictEqual(
          children.map((child) => child.attributes[0]?.value),
          [
            "media/a%20b.png#top",
            "https://example.org/x.png",
            "#anchor",
            "/rooted.png",
            "../fragments/deep/pic.png 1x,media/pic@2x.png 2x",
            "../../../outside.png",
          ],
        );
      }),
  );

  it.effect(
    "[I-12] a fragment's own include is performed in turn and each counts one placement",
    () =>
      Effect.sync(() => {
        const inner = doc("fragments/inner.xml", el("p", [], [text("inner")]));
        const outer = doc("fragments/outer.xml", el("div", [], [include("inner.xml")]));
        const item = doc(
          "items/i.xml",
          el(
            "qti-assessment-item",
            [],
            [el("qti-item-body", [], [include("../fragments/outer.xml")])],
          ),
        );
        const result = performed(
          item,
          "items/i.xml",
          new Map([
            ["fragments/inner.xml", inner],
            ["fragments/outer.xml", outer],
          ]),
        );
        const included = Result.getOrThrow(result);
        const [body] = elementsOf(included.document.root);
        const [div] = body === undefined ? [] : elementsOf(body);
        const [p] = div === undefined ? [] : elementsOf(div);

        assert.strictEqual(p?.local, "p");
        assert.deepStrictEqual(included.placed, { bytes: 20, placements: 2 });
        assert.strictEqual(included.performed, 2);
      }),
  );

  it.effect("[I-12] a document with no include is given back itself", () =>
    Effect.sync(() => {
      const item = doc(
        "items/i.xml",
        el("qti-assessment-item", [], [el("qti-item-body", [], [el("p", [], [text("plain")])])]),
      );
      const included = Result.getOrThrow(performed(item, "items/i.xml", new Map()));

      assert.strictEqual(included.document, item);
      assert.strictEqual(included.performed, 0);
    }),
  );
});
