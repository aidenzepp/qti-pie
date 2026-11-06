import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { pageHeaders, pageHtml } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import {
  openDirectory,
  packageAssetBase,
  packageCache,
  packageHref,
  packageIds,
  routePackages,
  testField,
} from "#plate/dev/packages.ts";
import type { PackageEntry, PackageSource } from "#plate/dev/packages.ts";
import { createHandler } from "#plate/dev/page.ts";
import { emptyTheme } from "#plate/dev/theme.ts";
import { corpusRoot } from "#plate/document/corpus.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import type { PackageVerdict } from "#plate/package/open.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

/**
 * The origin every request is made against; the route never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The packages these tests read, by id: two corpus packages, the one accepted and the other
 * refused for its one resource's type, a refused corpus package with a listed image, and the
 * fixture package.
 */
const ids = {
  begGuide: "BegGuide_March2025",
  bpig: "BPIG_22April",
  fixture: "m2",
  lti: "lti",
} as const;

/**
 * The locations of the corpus's two packages whose zips are both named `items.zip`.
 */
const itemsPackages = [
  "qtiv2p2-examples/items/items.zip.d",
  "qtiv3-examples/packaging/items/items.zip.d",
] as const;

/**
 * How many zips the pinned corpus holds, each extracted into a `*.zip.d` directory.
 */
const corpusZips = 29;

/**
 * Opening every package of the corpus takes a few seconds here; the bound leaves room for a slow
 * disk and a busy machine without letting a hung read stall the run.
 */
const corpusTimeoutMs = 120_000;

/**
 * The package cache every test of this file shares, so each package is opened once for the file.
 */
const cache = Effect.runSync(packageCache());

/**
 * The stylesheets every page links in its head, in order: plate's, the playground's, the theme's.
 */
const sheetOrder = ["/styles.css", "/playground.css", "/theme.css"];

/**
 * The verdicts that accept a package.
 */
const accepting: readonly string[] = ["accepted", "accepted-with-unsupported"];

/**
 * One answer of the route, as the playground's handler sends it: its response and its body.
 */
interface Answer {
  readonly body: Uint8Array;
  readonly html: string;
  readonly response: Response;
}

/**
 * Write a route's outcome as the playground's handler does: a response as it is, and a page through
 * the frame with the theme box returning to the page's own target, the flag off, and the page
 * headers with the page's own headers (a 405's `Allow`) beside them.
 *
 * @param outcome The route's page or response.
 * @param target The request's path and query.
 * @returns The response.
 */
const answerOf = (outcome: Page | Response, target: string): Response =>
  outcome instanceof Response
    ? outcome
    : new Response(
        pageHtml(outcome, { appearance: { dark: false, theme: emptyTheme }, back: target }),
        { headers: { ...pageHeaders, ...outcome.headers }, status: outcome.status },
      );

/**
 * Read a response's body as bytes and as text.
 *
 * @param response The response.
 * @returns The response and its body.
 */
const bodyOf = (response: Response) =>
  Effect.promise(async (): Promise<Answer> => {
    const body = new Uint8Array(await response.arrayBuffer());

    return { body, html: new TextDecoder().decode(body), response };
  });

/**
 * Send a request for a target to the route over {@link cache}.
 *
 * @param target The path and query.
 * @param method The method, GET when absent.
 * @returns The answer.
 */
const request = (target: string, method = "GET") =>
  routePackages(cache, new Request(`${origin}${target}`, { method })).pipe(
    Effect.flatMap((outcome) => bodyOf(answerOf(outcome, target))),
  );

/**
 * Give the target of a package's file.
 *
 * @param id The package's id.
 * @param file The file's path, as the request writes it.
 * @returns `/packages/<id>/files/<file>`.
 */
const fileTarget = (id: string, file: string): string => `${packageHref(id)}/files/${file}`;

/**
 * Give every element of a tree, in document order.
 *
 * @param nodes The roots.
 * @returns The elements.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the text of nodes, as a reader reads it, with whitespace collapsed.
 *
 * @param nodes The nodes.
 * @returns Their text.
 */
const textOf = (nodes: readonly Node[]): string =>
  nodes
    .map((node) => (node.kind === "text" ? node.text : textOf(node.children)))
    .join("")
    .replaceAll(/\s+/gu, " ")
    .trim();

/**
 * Give the elements of a page that a predicate picks, in document order.
 *
 * @param html The page.
 * @param picks The predicate.
 * @returns The elements it picks.
 */
const findAll = (html: string, picks: (element: Element) => boolean): readonly Element[] =>
  elementsOf(parseHtml(html)).filter(picks);

/**
 * Find the listing's row of a package: the row whose header links to the package's page.
 *
 * @param html The listing.
 * @param id The package's id.
 * @returns The row; the test fails when there is none.
 */
const rowOf = (html: string, id: string): Element => {
  const row = findAll(html, (element) => element.tag === "tr").find((candidate) =>
    elementsOf(candidate.children).some(
      (element) => element.tag === "a" && element.attrs["href"] === packageHref(id),
    ),
  );
  assert.isDefined(row, id);

  return row;
};

/**
 * Find a package in the cache; the test fails when there is none.
 *
 * @param id The package's id.
 * @returns The package with its verdict.
 */
const entryOf = (id: string) =>
  cache.packageOf(id).pipe(
    Effect.map((entry) => {
      assert.isTrue(Option.isSome(entry), id);

      return Option.getOrThrow(entry);
    }),
  );

/**
 * An element as parse5's document parser gives it.
 */
type Parsed = DefaultTreeAdapterTypes.Element;

/**
 * Give the element children of a parse5 parent.
 *
 * @param parent The parent.
 * @returns Its children that are elements, in order.
 */
const childElements = (parent: DefaultTreeAdapterTypes.ParentNode): readonly Parsed[] =>
  parent.childNodes.filter((node): node is Parsed => defaultTreeAdapter.isElementNode(node));

/**
 * Find the one child of a parse5 parent with a tag.
 *
 * @param parent The parent.
 * @param tag The child's tag.
 * @returns The child; the test fails when there is none.
 */
const childOf = (parent: DefaultTreeAdapterTypes.ParentNode, tag: string): Parsed => {
  const found = childElements(parent).find((element) => element.tagName === tag);
  assert.isDefined(found, tag);

  return found;
};

/**
 * Read one attribute of a parse5 element.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, or `undefined` when the element has none.
 */
const attributeOf = (element: Parsed, name: string): string | undefined =>
  element.attrs.find((attribute) => attribute.name === name)?.value;

/**
 * Assert that a page was written through the frame: its head links the three sheets in order, its
 * `main` ends with the theme box, and its policy holds `frame-src 'self'`.
 *
 * @param answer The page's answer.
 */
const assertFramed = (answer: Answer): void => {
  const root = childOf(parse(answer.html), "html");
  const head = childOf(root, "head");
  const main = childOf(childOf(root, "body"), "main");
  const box = childElements(main).at(-1);

  assert.deepStrictEqual(
    childElements(head).flatMap((element) =>
      element.tagName === "link" && attributeOf(element, "rel") === "stylesheet"
        ? [attributeOf(element, "href") ?? ""]
        : [],
    ),
    sheetOrder,
  );
  assert.isDefined(box);
  assert.strictEqual(box.tagName, "form");
  assert.strictEqual(attributeOf(box, "action"), "/theme");
  assert.include(answer.response.headers.get("content-security-policy") ?? "", "frame-src 'self'");
  assert.strictEqual(answer.response.headers.get("content-type"), "text/html; charset=utf-8");
};

/**
 * Give a response's headers besides its type, sorted by name.
 *
 * @param response The response.
 * @returns Each header's name and value.
 */
const headersBesidesType = (response: Response): readonly (readonly [string, string])[] =>
  [...response.headers]
    .filter(([name]) => name !== "content-type")
    .toSorted(([a], [b]) => (a < b ? -1 : 1));

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`, holding the crafted
 * corpus root and a folder beside it. Its name is new for each run, so two runs at once never share
 * or remove each other's files.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `packages-test-${randomUUID()}`,
);

/**
 * The crafted corpus root: the package `htmlitem`, whose item document is named `items/q.html`,
 * the package `evil`, which holds `foo\secret.png` beside a link `foo` to the folder outside, and
 * a link `linked` to the folder outside, which holds the directory `hidden.zip.d`.
 */
const craftedRoot = path.join(scratch, "corpus");

/**
 * The folder beside the crafted corpus root that `evil`'s link `foo` points at.
 */
const outsideRoot = path.join(scratch, "outside");

/**
 * The bytes of `secret.png` in {@link outsideRoot}, which no package route may answer with.
 */
const outsideBytes = "OUTSIDE-SECRET-BYTES";

/**
 * The bytes `evil` holds in its file named `foo\secret.png`, the file `openPackage` judged as
 * `foo/secret.png`.
 */
const heldBytes = "HELD-BYTES";

/**
 * Write a 3.0.0 manifest whose one resource is an item with its document at `href`, listing it and
 * the given other files.
 *
 * @param href The item document's path.
 * @param others The other files the resource lists.
 * @returns The manifest's text.
 */
const craftedManifest = (href: string, ...others: readonly string[]): string =>
  `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="Q" type="imsqti_item_xmlv3p0" href="${href}">${[href, ...others].map((file) => `<file href="${file}"/>`).join("")}</resource></resources></manifest>`;

/**
 * An item whose one response declaration holds a correct response, `A`: what a host must never
 * serve raw.
 */
const craftedItem =
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="q" title="q" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>A</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><p>q</p></qti-item-body></qti-assessment-item>';

/**
 * The package cache over the crafted corpus root, which only {@link craftedRequest} reads.
 */
const crafted = Effect.runSync(packageCache());

/**
 * Run an effect with the crafted corpus root as `PLATE_CORPUS_DIR`.
 *
 * @param effect The effect.
 * @returns The effect under that setting.
 */
const inCrafted = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  effect.pipe(
    Effect.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: craftedRoot })),
    ),
  );

/**
 * Send a GET for a target to the route over the crafted packages.
 *
 * @param target The path.
 * @returns The answer.
 */
const craftedRequest = (target: string) =>
  inCrafted(routePackages(crafted, new Request(`${origin}${target}`))).pipe(
    Effect.flatMap((outcome) => bodyOf(answerOf(outcome, target))),
  );

beforeAll(() => {
  const evil = path.join(craftedRoot, "evil.zip.d");
  const htmlItem = path.join(craftedRoot, "htmlitem.zip.d");
  mkdirSync(evil, { recursive: true });
  mkdirSync(path.join(htmlItem, "items"), { recursive: true });
  mkdirSync(outsideRoot, { recursive: true });
  writeFileSync(path.join(outsideRoot, "secret.png"), outsideBytes);
  writeFileSync(path.join(evil, "imsmanifest.xml"), craftedManifest("item.xml", "foo/secret.png"));
  writeFileSync(path.join(evil, "item.xml"), craftedItem);
  writeFileSync(path.join(evil, "foo\\secret.png"), heldBytes);
  symlinkSync(path.join("..", "..", "outside"), path.join(evil, "foo"));
  mkdirSync(path.join(outsideRoot, "hidden.zip.d"));
  writeFileSync(
    path.join(outsideRoot, "hidden.zip.d", "imsmanifest.xml"),
    craftedManifest("item.xml"),
  );
  symlinkSync(path.join("..", "outside"), path.join(craftedRoot, "linked"));
  writeFileSync(path.join(htmlItem, "imsmanifest.xml"), craftedManifest("items/q.html"));
  writeFileSync(path.join(htmlItem, "items", "q.html"), craftedItem);
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

/**
 * An unchecked verdict with no resources, which costs nothing to give.
 *
 * @param source The package.
 * @returns The verdict.
 */
const uncheckedOf = (source: PackageSource): PackageVerdict => ({
  location: source.location,
  resources: [],
  verdict: "unchecked",
});

describe("dev/packages.ts", () => {
  describe("packageIds", () => {
    it("a package is named by its zip's name, and packages whose zips share a name by their locations", () => {
      assert.deepStrictEqual(
        packageIds([
          "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d",
          ...itemsPackages,
          "fixtures/m2",
        ]),
        [ids.begGuide, ...itemsPackages, ids.fixture],
      );
    });
  });

  describe("routePackages", () => {
    it.effect(
      "the listing gives every package its verdict: BegGuide_March2025 an accepting one, lti a refusal, the fixture an accepting one",
      () =>
        Effect.gen(function* listing() {
          const answer = yield* request("/packages");
          const packages = yield* cache.packages;
          const rows = findAll(answer.html, (element) => element.tag === "tr").slice(1);

          assert.strictEqual(answer.response.status, 200);
          assert.lengthOf(rows, corpusZips + 1);
          assert.lengthOf(packages, corpusZips + 1);
          assert.include(accepting, rowOf(answer.html, ids.begGuide).attrs["data-verdict"]);
          assert.strictEqual(rowOf(answer.html, ids.lti).attrs["data-verdict"], "refused");
          assert.include(accepting, rowOf(answer.html, ids.fixture).attrs["data-verdict"]);
          assert.strictEqual(packages.at(-1)?.location, "fixtures/m2");
          for (const entry of packages) {
            const row = rowOf(answer.html, entry.id);

            assert.strictEqual(row.attrs["data-verdict"], entry.verdict.verdict);
            assert.include(textOf([row]), entry.location);
          }
          for (const location of itemsPackages) {
            assert.strictEqual(rowOf(answer.html, location).attrs["data-verdict"], "refused");
          }
          assert.isTrue(Option.isNone(yield* cache.packageOf("items")));
        }),
      { tags: ["corpus"], timeout: corpusTimeoutMs },
    );

    it.effect(
      "an accepted package's page lists each resource with its document's verdict, and starts each test from a Start button posting its path to /packages/<id>/tests",
      () =>
        Effect.gen(function* acceptedPage() {
          const entry = yield* entryOf(ids.begGuide);
          const answer = yield* request(packageHref(ids.begGuide));
          const [form, ...otherForms] = findAll(
            answer.html,
            (element) => element.tag === "form" && element.attrs["action"] !== "/theme",
          );
          const buttons = findAll(answer.html, (element) => element.tag === "button").filter(
            (button) => button.attrs["name"] === testField,
          );
          const resources = findAll(
            answer.html,
            (element) =>
              element.tag === "li" &&
              element.children[0]?.kind === "element" &&
              element.children[0].tag === "code",
          ).filter((item) => elementsOf(item.children).some((child) => child.tag === "ul"));

          assert.strictEqual(answer.response.status, 200);
          assert.isDefined(form);
          assert.lengthOf(otherForms, 0);
          assert.strictEqual(form.attrs["action"], "/packages/BegGuide_March2025/tests");
          assert.strictEqual(form.attrs["method"], "post");
          assert.deepStrictEqual(
            buttons.map((button) => [
              button.attrs["type"],
              button.attrs["value"],
              textOf([button]),
            ]),
            [["submit", "BGtest.xml", "Start: Beginners Guide Example Test"]],
          );
          assert.deepStrictEqual(
            resources.map((item) => textOf(item.children.slice(0, 1))),
            entry.verdict.resources.map((resource) => resource.identifier),
          );
          for (const [index, resource] of entry.verdict.resources.entries()) {
            assert.strictEqual(
              resources[index]?.attrs["data-verdict"],
              resource.verdict.pipe(
                Option.map((verdict) => verdict.verdict),
                Option.getOrUndefined,
              ),
            );
          }
        }),
      { tags: ["corpus"], timeout: corpusTimeoutMs },
    );

    it.effect(
      "a refused package's page lists every refusal by its rule and starts no test",
      () =>
        Effect.gen(function* refusedPage() {
          const entry = yield* entryOf(ids.lti);
          const answer = yield* request(packageHref(ids.lti));
          const rules = findAll(answer.html, (element) => element.attrs["data-rule"] !== undefined);

          assert.strictEqual(answer.response.status, 200);
          assert.strictEqual(entry.verdict.verdict, "refused");
          assert.deepStrictEqual(
            rules.map((element) => element.attrs["data-rule"]),
            entry.verdict.verdict === "refused"
              ? entry.verdict.refusals.map((refusal) => refusal.rule)
              : [],
          );
          assert.lengthOf(
            findAll(answer.html, (element) => element.attrs["name"] === testField),
            0,
          );
          assert.include(answer.html, "No test starts: the package is refused.");
        }),
      { tags: ["corpus"] },
    );

    it.effect(
      "a listed file is served with the headers of an /assets/ response besides its type, and an unlisted path, ..%2Fx, a listed XML document, the manifest and a refused package's file are 404",
      () =>
        Effect.gen(function* files() {
          const crows = "items/resources/crows.jpg";
          const served = yield* request(fileTarget(ids.begGuide, crows));
          const based = yield* request(
            `${packageAssetBase(ids.begGuide, "items/BG011.xml")}resources/crows.jpg`,
          );
          const bytes = yield* Effect.promise(() =>
            readFile(
              path.join(
                Effect.runSync(corpusRoot),
                "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d",
                crows,
              ),
            ),
          );
          const playground = createHandler();
          yield* Effect.promise(() =>
            playground(
              new Request(`${origin}/item?path=QTI3_BeginnersGuide_Examples/items/BG011.xml`),
            ),
          );

          const asset = yield* Effect.promise(() =>
            playground(
              new Request(
                `${origin}/assets/QTI3_BeginnersGuide_Examples/items/resources/crows.jpg`,
              ),
            ),
          );
          const refused = [
            fileTarget(ids.begGuide, "items/resources/missing.jpg"),
            fileTarget(ids.begGuide, "..%2Fx"),
            fileTarget(ids.begGuide, "items/..%2F..%2Fitems/resources/crows.jpg"),
            fileTarget(ids.begGuide, "items%2Fresources%2Fcrows.jpg"),
            fileTarget(ids.begGuide, "items%5Cresources%5Ccrows.jpg"),
            fileTarget(ids.begGuide, "items/BG007.xml"),
            fileTarget(ids.begGuide, "imsmanifest.xml"),
            fileTarget(ids.bpig, "items/images/plane.png"),
            fileTarget("no-such-package", crows),
            `${packageHref(ids.begGuide)}/files/`,
          ];

          assert.strictEqual(served.response.status, 200);
          assert.strictEqual(served.response.headers.get("content-type"), "image/jpeg");
          assert.deepStrictEqual(served.body, new Uint8Array(bytes));
          assert.strictEqual(asset.status, 200);
          assert.deepStrictEqual(headersBesidesType(served.response), headersBesidesType(asset));
          assert.strictEqual(based.response.status, 200);
          assert.deepStrictEqual(based.body, served.body);
          assert.strictEqual((yield* entryOf(ids.bpig)).verdict.verdict, "refused");
          for (const target of refused) {
            assert.strictEqual((yield* request(target)).response.status, 404, target);
          }
        }),
      { tags: ["corpus"], timeout: corpusTimeoutMs },
    );

    it.effect(
      "an item document named *.html is accepted but not a file the package lists, so the files route answers 404 for it",
      () =>
        Effect.gen(function* htmlItem() {
          const entry = Option.getOrThrow(yield* inCrafted(crafted.packageOf("htmlitem")));
          const answer = yield* craftedRequest(fileTarget("htmlitem", "items/q.html"));

          assert.include(accepting, entry.verdict.verdict);
          assert.isFalse(
            "accepted" in entry.verdict && entry.verdict.accepted.files.has("items/q.html"),
          );
          assert.strictEqual(answer.response.status, 404);
          assert.notInclude(answer.html, "qti-correct-response");
        }),
    );

    it.effect(
      "a listed file is read under the key openPackage judged: foo\\secret.png beside a link foo to a folder outside answers the held bytes, never the outside file",
      () =>
        Effect.gen(function* escape() {
          const entry = Option.getOrThrow(yield* inCrafted(crafted.packageOf("evil")));
          const answer = yield* craftedRequest(fileTarget("evil", "foo/secret.png"));
          const outside = yield* Effect.promise(() =>
            readFile(path.join(craftedRoot, "evil.zip.d", "foo", "secret.png"), "utf-8"),
          );

          assert.include(accepting, entry.verdict.verdict);
          assert.isTrue(
            "accepted" in entry.verdict && entry.verdict.accepted.files.has("foo/secret.png"),
          );
          assert.strictEqual(outside, outsideBytes);
          assert.strictEqual(answer.response.status, 200);
          assert.strictEqual(answer.html, heldBytes);
        }),
    );

    it.effect(
      "the packages are found without following links: a *.zip.d under a linked directory, or under a link inside a package, is not a package",
      () =>
        Effect.gen(function* unlinked() {
          const listed = yield* inCrafted(
            Effect.flatMap(
              packageCache((source) => Effect.succeed(uncheckedOf(source))),
              (found) => found.packages,
            ),
          );

          assert.deepStrictEqual(
            listed.map((entry) => entry.location),
            ["evil.zip.d", "htmlitem.zip.d", "fixtures/m2"],
          );
        }),
    );

    it.effect(
      "every page links the three sheets, ends main with the theme box and carries frame-src 'self'",
      () =>
        Effect.gen(function* framed() {
          const pages = [
            yield* request("/packages"),
            yield* request(packageHref(ids.begGuide)),
            yield* request(packageHref(ids.lti)),
            yield* request(packageHref(ids.fixture)),
            yield* request(fileTarget(ids.begGuide, "..%2Fx")),
            yield* request("/packages", "POST"),
          ];

          assert.deepStrictEqual(
            pages.map((answer) => answer.response.status),
            [200, 200, 200, 200, 404, 405],
          );
          for (const answer of pages) {
            assertFramed(answer);
          }
        }),
      { tags: ["corpus"], timeout: corpusTimeoutMs },
    );

    it.effect(
      "another method is 405 on the package routes, with Allow naming GET, and a path beside them, an unknown id and an id that does not decode are 404",
      () =>
        Effect.gen(function* refusals() {
          const refusedMethods = [
            yield* request("/packages", "POST"),
            yield* request(packageHref(ids.fixture), "PUT"),
            yield* request(fileTarget(ids.fixture, "test.xml"), "DELETE"),
          ];
          const missing = [
            "/packages/",
            "/packagesx",
            `${packageHref(ids.fixture)}/`,
            `${packageHref(ids.fixture)}/files`,
            `${packageHref(ids.fixture)}/tests`,
            packageHref("no-such-package"),
            "/packages/%E0%A4%A",
          ];

          for (const answer of refusedMethods) {
            assert.strictEqual(answer.response.status, 405);
            assert.strictEqual(answer.response.headers.get("allow"), "GET");
          }
          for (const target of missing) {
            assert.strictEqual((yield* request(target)).response.status, 404, target);
          }
        }),
      { tags: ["corpus"] },
    );

    it.effect(
      "each package is opened once, however often the listing and its page ask for it",
      () =>
        Effect.gen(function* opens() {
          const counts = new Map<string, number>();
          const counted = yield* packageCache((source) =>
            Effect.sync(() => {
              counts.set(source.id, (counts.get(source.id) ?? 0) + 1);

              return uncheckedOf(source);
            }),
          );
          const listed: readonly PackageEntry[] = yield* counted.packages;
          yield* counted.packages;
          yield* counted.packageOf(ids.begGuide);
          yield* routePackages(counted, new Request(`${origin}${packageHref(ids.begGuide)}`));
          yield* routePackages(counted, new Request(`${origin}/packages`));

          assert.lengthOf(listed, corpusZips + 1);
          assert.deepStrictEqual(
            [...counts.values()],
            listed.map(() => 1),
          );
        }),
      { tags: ["corpus"] },
    );

    it.effect(
      "the default opener reads a package's directory whole and gives openPackage's verdict",
      () =>
        Effect.gen(function* fixture() {
          const entry = yield* entryOf(ids.fixture);
          const verdict = yield* openDirectory(entry);

          assert.include(accepting, verdict.verdict);
          assert.strictEqual(verdict.location, "fixtures/m2");
          assert.deepStrictEqual(
            verdict.resources.map((resource) => resource.identifier),
            [
              "m2-test",
              "p1-single-choice",
              "p1-text-entry",
              "p1-multiple-choice",
              "p2-extended-text",
              "p2-choice",
            ],
          );
        }),
      { tags: ["corpus"] },
    );
  });
});
