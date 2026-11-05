import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option } from "effect";
import { defaultTreeAdapter, parse } from "parse5";
import type { DefaultTreeAdapterTypes } from "parse5";
import { groupVerdicts, openMember, verdictCache, verdictOrder } from "#plate/dev/listing.ts";
import { createHandler } from "#plate/dev/page.ts";
import type { Handler, PlaygroundSettings } from "#plate/dev/page.ts";
import { corpusDocuments, readCorpusFile } from "#plate/document/corpus.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { entryName } from "#plate/form/encoding.ts";
import type { Ledger } from "#plate/ledger/report.ts";
import { ledgerHtml } from "#plate/ledger/view.ts";
import { message } from "#plate/messages.ts";
import type { MessageKey } from "#plate/messages.ts";
import { checkTree, nameOf } from "#plate/test/accessibility.ts";
import { keyboardWalk } from "#plate/test/keyboard.ts";
import type { Key } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import type { Accepted, Verdict } from "#plate/validate/verdict.ts";

/**
 * The origin every request is made against; the handler never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The corpus paths of the documents these tests open: phase 1's three items, the refused CAT
 * test, a Choice of the Common Cartridge package scored by `CC2_match`, a QTI 2.2 item inside
 * the CAT package, and two packaged items that embed a package document by `object`, an HTML
 * page and an SVG image.
 */
const paths = {
  bg007: "QTI3_BPIG_Examples/items/BG007.xml",
  bg010: "QTI3_BPIG_Examples/items/BG010.xml",
  bg011: "QTI3_BeginnersGuide_Examples/items/BG011.xml",
  cat: "qtiv3-examples/CAT/test.xml",
  ccPackage: "qtiv3-examples/packaging/ccPackage/testitems/QUE_102010.xml",
  orkney: "qtiv3-examples/packaging/items/orkney1.xml",
  qti2: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip.d/items/i15211305971467662/qti.xml",
  svg: "qtiv3-examples/packaging/svg/svg.xml",
} as const;

/**
 * Opening every member of the corpus takes a few seconds here; the bound leaves room for a slow
 * disk without letting a hung read stall the run.
 */
const corpusTimeoutMs = 60_000;

/**
 * The verdict cache every handler of this file shares, so the corpus is opened once for the file.
 */
const verdicts = Effect.runSync(verdictCache());

/**
 * Construct a handler over the corpus that shares {@link verdicts}, with its own sessions and
 * theme.
 *
 * @param settings The configuration input, each optional.
 * @returns The handler.
 */
const playground = (settings: Pick<PlaygroundSettings, "configuration"> = {}): Handler =>
  createHandler({ ...settings, verdicts });

/**
 * The headers every page carries, exactly (rule `723e580c`); `pageHeaders` in
 * `#plate/dev/page.ts` gives the reason for each directive.
 */
const pageHeaders = {
  "cache-control": "no-store",
  "content-security-policy":
    "default-src 'none'; style-src 'self'; img-src 'self' https: http:; media-src 'self' https: http:; object-src 'self'; frame-src 'self'; script-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
} as const;

/**
 * The headers every served asset carries, exactly.
 */
const assetHeaders = {
  "content-security-policy":
    "sandbox; script-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  "x-content-type-options": "nosniff",
} as const;

/**
 * The scratch folder this file owns, under the package's git-ignored `work/`.
 */
const scratch = path.resolve(import.meta.dirname, "..", "..", "work", "page-test");

/**
 * The hand-built item whose title holds a script element, inside the scratch corpus root.
 */
const hostile = "items/hostile.xml";

/**
 * The title of {@link hostile}, as the candidate would read it.
 */
const hostileTitle = "<script>alert(1)</script>";

/**
 * The hand-built item of the scratch corpus root whose path holds a script element and whose
 * outcome default, `<script>`, is no integer, so `open` refuses it with a sentence quoting it.
 */
const scriptPath = "items/<script>.xml";

/**
 * The text of {@link scriptPath}.
 */
const scriptItem = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="script" title="script" adaptive="false" time-dependent="false">
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="integer">
    <qti-default-value><qti-value>&lt;script&gt;</qti-value></qti-default-value>
  </qti-outcome-declaration>
  <qti-item-body><p>x</p></qti-item-body>
</qti-assessment-item>
`;

/**
 * A handler over the scratch corpus root, which holds only {@link hostile} and {@link scriptPath},
 * with its own verdict cache.
 */
const scratchHandler = createHandler({
  provider: ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: scratch }),
});

/**
 * A test title holding a script element, which the ledger page shows as text.
 */
const hostileTest = "<script>alert(1)</script> is shown as text";

/**
 * The hand-built ledger the ledger page reads: at Basic a `limited` Accessibility row, a
 * `not yet supported` Items row and a covered Choice row whose proof names a test titled
 * {@link hostileTest}, and at Advanced an `excluded` Metadata row.
 */
const fixtureLedger: Ledger = {
  browserRuns: [],
  headlines: {
    advanced: { covered: 0, excluded: 1, limited: 0, "unsupported-with-notice": 0 },
    basic: { covered: 1, excluded: 0, limited: 1, "unsupported-with-notice": 1 },
    elective: { covered: 0, excluded: 0, limited: 0, "unsupported-with-notice": 0 },
    elevated: { covered: 0, excluded: 0, limited: 0, "unsupported-with-notice": 0 },
  },
  records: [],
  rows: [
    {
      family: "A",
      id: "A-1",
      level: "basic",
      name: "An accessibility feature",
      proofs: [],
      renders: true,
      source: "a member-only source",
      state: "limited",
      validates: true,
    },
    {
      family: "I",
      id: "I-7",
      level: "basic",
      name: "An item feature",
      proofs: [],
      renders: false,
      state: "unsupported-with-notice",
      validates: true,
    },
    {
      family: "Q",
      id: "Q-2",
      interaction: { composition: ["dev playground"], keyboard: [] },
      level: "basic",
      name: "Choice",
      proofs: [
        {
          documents: ["QTI3_BPIG_Examples/items/BG007.xml"],
          file: "src/dev/page.test.ts",
          kind: "fixtures",
          tests: [hostileTest],
        },
      ],
      renders: true,
      state: "covered",
      validates: true,
    },
    {
      family: "M",
      id: "M-1",
      level: "advanced",
      name: "A metadata feature",
      proofs: [],
      reason: "the goal leaves it out",
      renders: false,
      source: "the goal",
      state: "excluded",
      validates: false,
    },
  ],
};

/**
 * `PLATE_LEDGER_DIR` as the fixture handler sets it: relative, so it is read from the package
 * directory, naming the scratch folder that holds {@link fixtureLedger} as `ledger.json`.
 */
const ledgerSetting = "work/page-test/ledger";

/**
 * The scratch folder that holds no `ledger.json`.
 */
const noLedgerFolder = path.join(scratch, "no-ledger");

/**
 * The scratch folder whose `ledger.json` is JSON but no ledger.
 */
const malformedFolder = path.join(scratch, "malformed-ledger");

/**
 * Construct a handler whose ledger page reads `ledger.json` from a folder.
 *
 * @param folder `PLATE_LEDGER_DIR`.
 * @returns The handler.
 */
const ledgerHandler = (folder: string): Handler =>
  createHandler({ provider: ConfigProvider.fromUnknown({ PLATE_LEDGER_DIR: folder }) });

beforeAll(async () => {
  rmSync(scratch, { force: true, recursive: true });
  mkdirSync(path.join(scratch, "items"), { recursive: true });

  const bg007 = new TextDecoder().decode(await Effect.runPromise(readCorpusFile(paths.bg007)));
  writeFileSync(
    path.join(scratch, hostile),
    bg007.replace(
      'title="BG true false example "',
      'title="&lt;script&gt;alert(1)&lt;/script&gt;"',
    ),
  );
  writeFileSync(path.join(scratch, scriptPath), scriptItem);
  mkdirSync(path.resolve(import.meta.dirname, "..", "..", ledgerSetting), { recursive: true });
  writeFileSync(
    path.resolve(import.meta.dirname, "..", "..", ledgerSetting, "ledger.json"),
    JSON.stringify(fixtureLedger),
  );
  mkdirSync(noLedgerFolder, { recursive: true });
  mkdirSync(malformedFolder, { recursive: true });
  writeFileSync(path.join(malformedFolder, "ledger.json"), JSON.stringify({ rows: "none" }));
});

beforeAll(async () => {
  await Effect.runPromise(verdicts.verdicts);
}, corpusTimeoutMs);

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

/**
 * A response with its body read as text, and the address the request went to as a browser keeps
 * it, fragment included: the address of the page the response becomes.
 */
interface Answer {
  readonly html: string;
  readonly response: Response;
  readonly url: string;
}

/**
 * Send one request to a handler and read the body as text.
 *
 * @param handle The handler.
 * @param request The request.
 * @returns The response and its body.
 */
const send = (handle: Handler, request: Request) =>
  Effect.promise(async (): Promise<Answer> => {
    const response = await handle(request);

    return { html: await response.text(), response, url: request.url };
  });

/**
 * Send a GET for a target to a handler.
 *
 * @param handle The handler.
 * @param target The path and query.
 * @returns The response and its body.
 */
const get = (handle: Handler, target: string) => send(handle, new Request(`${origin}${target}`));

/**
 * Post entries to a form action, as a browser posts a native form.
 *
 * @param handle The handler.
 * @param action The form's `action`.
 * @param entries The entries, in order.
 * @returns The response and its body.
 */
const post = (handle: Handler, action: string, entries: readonly (readonly [string, string])[]) => {
  const form = new FormData();
  for (const [name, value] of entries) {
    form.append(name, value);
  }

  return send(handle, new Request(new URL(action, origin), { body: form, method: "POST" }));
};

/**
 * The origin the theme cases send to, the name a browser shows, so an absolute `return` on it
 * reaches the second origin check.
 */
const themeOrigin = "http://localhost:5190";

/**
 * Send a GET for a target on {@link themeOrigin} and read the body as bytes.
 *
 * @param handle The handler.
 * @param target The path and query.
 * @returns The response and its body's bytes.
 */
const bytes = (handle: Handler, target: string) =>
  Effect.promise(async () => {
    const response = await handle(new Request(`${themeOrigin}${target}`));

    return { body: new Uint8Array(await response.arrayBuffer()), response };
  });

/**
 * Post the theme box's fields to `/theme` on {@link themeOrigin}.
 *
 * @param handle The handler.
 * @param entries The fields, in order.
 * @returns The response and its body.
 */
const postTheme = (handle: Handler, entries: readonly (readonly [string, string])[]) => {
  const form = new FormData();
  for (const [name, value] of entries) {
    form.append(name, value);
  }

  return send(handle, new Request(`${themeOrigin}/theme`, { body: form, method: "POST" }));
};

/**
 * Read the stored theme's CSS from `/theme.css` on {@link themeOrigin}.
 *
 * @param handle The handler.
 * @returns The response and its body.
 */
const themeSheet = (handle: Handler) => send(handle, new Request(`${themeOrigin}/theme.css`));

/**
 * A theme the box accepts: `--primary` in both blocks and `--font-sans` in `:root`.
 */
const acceptedTheme = `:root {
  --primary: oklch(0.205 0 0);
  --font-sans: "Inter", sans-serif;
}

.dark {
  --primary: oklch(0.922 0 0);
}
`;

/**
 * Assert that a response carries every header the listing carries, its type aside.
 *
 * @param listing The `GET /` response.
 * @param response The response to check.
 */
const assertPageHeaders = (listing: Response, response: Response): void => {
  for (const [name, value] of listing.headers) {
    if (name !== "content-type") {
      assert.strictEqual(response.headers.get(name), value, name);
    }
  }
  for (const [, value] of response.headers) {
    assert.notInclude(value, "unsafe-inline");
  }
};

/**
 * Give the target of the item page for a corpus path.
 *
 * @param corpusPath The document's corpus path.
 * @returns `/item?path=…`.
 */
const itemTarget = (corpusPath: string): string =>
  `/item?${new URLSearchParams({ path: corpusPath }).toString()}`;

/**
 * Collect every element of a tree in document order, the roots included.
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
 * Find the one element of a page that a predicate picks.
 *
 * @param html The page.
 * @param picks The predicate.
 * @returns The first element it picks; the test fails when there is none.
 */
const find = (html: string, picks: (element: Element) => boolean): Element => {
  const found = elementsOf(parseHtml(html)).find(picks);
  assert.isDefined(found);

  return found;
};

/**
 * Give the item page's form `action`.
 *
 * @param html The item page.
 * @returns The action.
 */
const actionOf = (html: string): string => {
  const { action } = find(html, (element) => element.tag === "form").attrs;
  assert.isString(action);

  return String(action);
};

/**
 * Give the instance token an item page's form posts under.
 *
 * @param html The item page.
 * @returns The token its action names.
 */
const instanceOf = (html: string): string =>
  new URL(actionOf(html), origin).searchParams.get("instance") ?? "";

/**
 * The stylesheets every page links in its head, in order: plate's, the playground's, the theme's.
 */
const sheetOrder = ["/styles.css", "/playground.css", "/theme.css"];

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
 * Read one attribute of a parse5 element.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns Its value, or `undefined` when the element has none.
 */
const attributeOf = (element: Parsed, name: string): string | undefined =>
  element.attrs.find((attribute) => attribute.name === name)?.value;

/**
 * Read a page as a browser reads a document, which keeps the `html` and `head` elements that
 * `parseHtml`'s fragment reading drops.
 *
 * @param html The page.
 * @returns Its `html` element; the test fails when there is none.
 */
const documentRoot = (html: string): Parsed => {
  const [root] = childElements(parse(html));
  assert.isDefined(root);

  return root;
};

/**
 * Give the targets of the stylesheets a page's head links, in order.
 *
 * @param html The page.
 * @returns Each `link rel="stylesheet"`'s `href`.
 */
const linkedSheets = (html: string): readonly string[] => {
  const head = childElements(documentRoot(html)).find((element) => element.tagName === "head");
  assert.isDefined(head);

  return childElements(head).flatMap((element) =>
    element.tagName === "link" && attributeOf(element, "rel") === "stylesheet"
      ? [attributeOf(element, "href") ?? ""]
      : [],
  );
};

/**
 * Find a page's theme box: the form that posts to `/theme`.
 *
 * @param html The page.
 * @returns The box; the test fails when there is none.
 */
const themeBoxOf = (html: string): Element =>
  find(html, (element) => element.tag === "form" && element.attrs["action"] === "/theme");

/**
 * Find the control of a form that a field name names.
 *
 * @param form The form.
 * @param name The field's name.
 * @returns The first control with that name; the test fails when there is none.
 */
const fieldOf = (form: Element, name: string): Element => {
  const found = elementsOf(form.children).find((element) => element.attrs["name"] === name);
  assert.isDefined(found);

  return found;
};

/**
 * Assert that a control of a form has a label in that form, through its `id`.
 *
 * @param form The form.
 * @param control The control.
 */
const assertLabelled = (form: Element, control: Element): void => {
  const { id } = control.attrs;
  assert.isString(id);
  assert.isDefined(
    elementsOf(form.children).find(
      (element) => element.tag === "label" && element.attrs["for"] === id,
    ),
  );
};

/**
 * Assert that a page ends its `main` with the theme box, outside every other form: a form that
 * posts to `/theme` and holds a labelled `theme` textarea, a labelled `dark` checkbox, a hidden
 * `return` field and a submit button.
 *
 * @param html The page.
 * @returns The box.
 */
const assertThemeBox = (html: string): Element => {
  const elements = elementsOf(parseHtml(html));
  const main = elements.find((element) => element.tag === "main");
  const box = main?.children.findLast((child): child is Element => child.kind === "element");
  assert.isDefined(box);

  const textarea = fieldOf(box, "theme");
  const dark = fieldOf(box, "dark");

  assert.strictEqual(box.tag, "form");
  assert.strictEqual(box.attrs["action"], "/theme");
  assert.strictEqual(box.attrs["method"], "post");
  for (const form of elements.filter((element) => element.tag === "form" && element !== box)) {
    assert.notInclude(elementsOf(form.children), box);
  }
  assert.strictEqual(textarea.tag, "textarea");
  assertLabelled(box, textarea);
  assert.strictEqual(dark.tag, "input");
  assert.strictEqual(dark.attrs["type"], "checkbox");
  assertLabelled(box, dark);
  assert.strictEqual(fieldOf(box, "return").attrs["type"], "hidden");
  assert.isDefined(
    elementsOf(box.children).find(
      (element) => element.tag === "button" && element.attrs["type"] === "submit",
    ),
  );

  return box;
};

/**
 * Give the classes of a page's `html` element.
 *
 * @param html The page.
 * @returns Its `class` value split on whitespace, empty when it has none.
 */
const htmlClasses = (html: string): readonly string[] =>
  (attributeOf(documentRoot(html), "class") ?? "").split(/\s+/u).filter((name) => name !== "");

/**
 * Report whether a page's theme box has its Dark checkbox checked.
 *
 * @param html The page.
 * @returns Whether the `dark` control carries `checked`.
 */
const darkChecked = (html: string): boolean =>
  Object.hasOwn(fieldOf(themeBoxOf(html), "dark").attrs, "checked");

/**
 * Give the path and query a page's theme box returns to.
 *
 * @param html The page.
 * @returns The `return` field's value.
 */
const returnOf = (html: string): string | true | undefined =>
  fieldOf(themeBoxOf(html), "return").attrs["value"];

/**
 * The state a page after a submit names in its title.
 */
type State = Extract<MessageKey, "notAccepted" | "responseRecorded" | "scored">;

/**
 * Assert the rule on a page after a submit: the Status part first in the item region, its heading
 * at the base level, the fragment of the address the post went to naming that region and the
 * page's form posting with the same fragment, exactly one `autofocus` where the state puts it (the
 * region after a scored or recorded submit, the first invalid Control after a refused one), a
 * title naming the state, and no redirect.
 *
 * @param answer The page after the submit.
 * @param state The state the page must name.
 * @param title The item's title.
 */
const assertAfterSubmit = (answer: Answer, state: State, title: string): void => {
  const { html, response, url } = answer;
  const all = elementsOf(parseHtml(html));
  const region = all.find((element) => element.attrs["id"] === "playground-item");
  const [first, second] = (region?.children ?? []).filter((child) => child.kind === "element");
  const fragment = new URL(url).hash;
  const targets = all.filter((element) => `#${String(element.attrs["id"])}` === fragment);
  const focused = all.filter((element) => Object.hasOwn(element.attrs, "autofocus"));
  const titleElement = all.find((element) => element.tag === "title");

  assert.notStrictEqual(fragment, "", "the post's address names no fragment");
  assert.lengthOf(targets, 1, `no single element is ${fragment}`);
  assert.strictEqual(targets[0], first, "the fragment names no Status region first in the item");
  assert.strictEqual(new URL(actionOf(html), origin).hash, fragment);
  assert.strictEqual(first?.attrs["role"], "status");
  assert.strictEqual(second?.tag, "form");
  assert.strictEqual(
    elementsOf(first?.children ?? []).find((element) => /^h[1-6]$/u.test(element.tag))?.tag,
    "h2",
  );
  assert.lengthOf(focused, 1);
  if (state === "notAccepted") {
    assert.strictEqual(focused[0]?.attrs["aria-invalid"], "true");
    assert.strictEqual(
      focused[0],
      all.find((element) => element.attrs["aria-invalid"] === "true"),
      "autofocus is not on the first invalid Control",
    );
  } else {
    assert.strictEqual(focused[0]?.attrs["role"], "status");
    assert.strictEqual(focused[0]?.attrs["id"], first?.attrs["id"]);
  }

  assert.strictEqual(
    textOf(titleElement?.children ?? []),
    message("en", "title", { state: message("en", state), title }),
  );
  assert.isNull(response.headers.get("location"));
};

/**
 * One verdict section of the listing, as the page shows it.
 */
interface ListedSection {
  /**
   * The count its heading gives.
   */
  readonly count: number;
  /**
   * Its folder headings' text, in order.
   */
  readonly folders: readonly string[];
  /**
   * Each link's target and text, in order.
   */
  readonly links: readonly (readonly [href: string, text: string])[];
  readonly verdict: string;
}

/**
 * Read the listing's verdict sections: each `section` with its `data-verdict`, its heading's
 * `data-count`, its `h3` folder headings and its links.
 *
 * @param html The listing.
 * @returns The sections, in document order.
 */
const sectionsOf = (html: string): readonly ListedSection[] =>
  elementsOf(parseHtml(html)).flatMap((section): readonly ListedSection[] => {
    if (section.tag !== "section") {
      return [];
    }

    const inside = elementsOf(section.children);
    const heading = inside.find((element) => element.tag === "h2");

    return [
      {
        count: Number(heading?.attrs["data-count"]),
        folders: inside.flatMap((element) =>
          element.tag === "h3" ? [textOf(element.children)] : [],
        ),
        links: inside.flatMap((element) =>
          element.tag === "a"
            ? [[String(element.attrs["href"]), textOf(element.children)] as const]
            : [],
        ),
        verdict: String(section.attrs["data-verdict"]),
      },
    ];
  });

/**
 * Give the accepted document of a verdict that accepts it.
 *
 * @param verdict The verdict.
 * @returns Its accepted document; the test fails when `open` did not accept it.
 */
const acceptedOf = (verdict: Verdict): Accepted =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? verdict.accepted
    : assert.fail(`${verdict.document} is ${verdict.verdict}, not accepted`);

/**
 * Open a document in a playground, walk its item form by keys with `keyboardWalk`, and post the
 * entries the walk submits to the form's action.
 *
 * @param handle The handler.
 * @param corpusPath The document's corpus path.
 * @param keys The keys pressed, which must submit the item's form.
 * @returns The page after the submit.
 */
const walkAndPost = Effect.fnUntraced(function* walkAndPost(
  handle: Handler,
  corpusPath: string,
  keys: readonly Key[],
) {
  const opened = yield* get(handle, itemTarget(corpusPath));
  const form = find(
    opened.html,
    (element) => element.tag === "form" && String(element.attrs["action"]).startsWith("/item?"),
  );
  const entries = Option.getOrElse(keyboardWalk(form, keys), () =>
    assert.fail("the keys never submit the item's form"),
  );

  return yield* post(handle, actionOf(opened.html), entries);
});

/**
 * Run `checkTree` over a page's `main`, inside an element carrying the page's language, with its
 * headings starting at `h1`.
 *
 * @param html The page.
 * @returns Every violation, empty for a page that passes.
 */
const pageViolations = (html: string) =>
  checkTree(
    h("div", { lang: attributeOf(documentRoot(html), "lang") ?? "" }, [
      find(html, (element) => element.tag === "main"),
    ]),
    { baseLevel: 1 },
  );

describe("dev/page.ts", () => {
  it.effect(
    "the listing names every member once, under its verdict's section and its top folder, and the counts sum to the set's size",
    () =>
      Effect.gen(function* listing() {
        const members = yield* corpusDocuments;
        const known = yield* verdicts.verdicts;
        const { html, response } = yield* get(playground(), "/");
        const sections = sectionsOf(html);
        const verdictOf = new Map(known.map((verdict) => [verdict.document, verdict.verdict]));
        const listed = sections.flatMap((section) =>
          section.links.map(([href, text]) => ({ href, text, verdict: section.verdict })),
        );
        const sectionOf = (member: string) => listed.find((link) => link.text === member)?.verdict;
        const nav = find(html, (element) => element.tag === "nav");
        const main = find(html, (element) => element.tag === "main");

        assert.strictEqual(response.status, 200);
        assert.match(html, /^<!doctype html><html lang="en">/u);
        assert.strictEqual(main.children.find((child) => child.kind === "element")?.tag, "h1");
        assert.deepStrictEqual(
          elementsOf(nav.children).flatMap((element) =>
            element.tag === "a" ? [element.attrs["href"]] : [],
          ),
          ["/verdicts", "/ledger"],
        );
        assert.deepStrictEqual(
          sections.map((section) => section.verdict),
          [...verdictOrder],
        );
        assert.strictEqual(
          sections.reduce((sum, section) => sum + section.count, 0),
          members.length,
        );
        assert.deepStrictEqual(
          listed.map((link) => link.text).toSorted(),
          members.toSorted(),
          "each member once",
        );
        for (const section of sections) {
          assert.lengthOf(section.links, section.count, section.verdict);
        }
        for (const link of listed) {
          assert.strictEqual(link.href, itemTarget(link.text));
          assert.strictEqual(link.verdict, verdictOf.get(link.text), link.text);
        }
        assert.deepStrictEqual(
          sections.map((section) => section.folders),
          groupVerdicts(known).map((group) =>
            group.folders.map(({ folder }) => (folder === "." ? "Corpus root" : folder)),
          ),
        );
        assert.strictEqual(sectionOf(paths.bg007), "accepted");
        assert.strictEqual(sectionOf(paths.cat), "refused");
      }),
    corpusTimeoutMs,
  );

  it.effect(
    "every member is opened once over a handler's life: a second request opens no document again",
    () =>
      Effect.gen(function* counted() {
        const opened: string[] = [];
        const counting = yield* verdictCache((member) =>
          Effect.suspend(() => {
            opened.push(member);

            return openMember(member);
          }),
        );
        const handle = createHandler({ verdicts: counting });
        const members = yield* corpusDocuments;
        const first = yield* get(handle, "/");
        const afterFirst = [...opened];
        const second = yield* get(handle, "/");
        const item = yield* get(handle, itemTarget(paths.bg007));

        assert.strictEqual(first.response.status, 200);
        assert.deepStrictEqual(afterFirst, members);
        assert.strictEqual(second.html.length, first.html.length);
        assert.strictEqual(item.response.status, 200);
        assert.deepStrictEqual(opened, members);
      }),
    corpusTimeoutMs,
  );

  it.effect("CAT/test.xml shows its refusal and no item form", () =>
    Effect.gen(function* cat() {
      const { html, response } = yield* get(playground(), itemTarget(paths.cat));
      const elements = elementsOf(parseHtml(html));
      const rules = elements.flatMap((element) =>
        element.attrs["data-rule"] === undefined ? [] : [element.attrs["data-rule"]],
      );
      const actions = elements.flatMap((element) =>
        element.tag === "form" ? [element.attrs["action"]] : [],
      );

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(rules, ["reader-refused"]);
      assert.isTrue(actions.every((action) => action === "/theme"));
    }),
  );

  it.effect("a QTI 2 item inside a QTI 3 package opens to its refusal and no item form", () =>
    Effect.gen(function* qti2() {
      const { html, response } = yield* get(playground(), itemTarget(paths.qti2));
      const elements = elementsOf(parseHtml(html));

      assert.strictEqual(response.status, 200);
      assert.deepStrictEqual(
        elements.flatMap((element) =>
          element.attrs["data-rule"] === undefined ? [] : [element.attrs["data-rule"]],
        ),
        ["not-qti-root"],
      );
      assert.isTrue(
        elements.every((element) => element.tag !== "form" || element.attrs["action"] === "/theme"),
      );
    }),
  );

  it.effect(
    "a ccPackage item opens, and a POST of its correct response shows its CC2_match score, 1",
    () =>
      Effect.gen(function* ccPackage() {
        const handle = playground();
        const opened = yield* get(handle, itemTarget(paths.ccPackage));
        const answered = yield* post(handle, actionOf(opened.html), [
          [entryName(instanceOf(opened.html), "RESPONSE"), "true"],
        ]);
        const accepted = acceptedOf(
          Option.getOrElse(yield* verdicts.verdictOf(paths.ccPackage), () =>
            assert.fail("the ccPackage item is a member"),
          ),
        );
        const status = find(answered.html, (element) => element.attrs["role"] === "status");

        assert.strictEqual(opened.response.status, 200);
        assert.isTrue(Option.isSome(accepted.item.processing));
        assert.include(textOf(status.children), message("en", "score", { score: "1" }));
        assertAfterSubmit(answered, "scored", "Question 02");
      }),
  );

  it.effect("[Q-2] [I-9b] a BG007 open, then a POST of the true choice, shows score 1", () =>
    Effect.gen(function* scored() {
      const handle = playground();
      const opened = yield* get(handle, itemTarget(paths.bg007));
      const instance = instanceOf(opened.html);
      const answered = yield* post(handle, actionOf(opened.html), [
        [entryName(instance, "RESPONSE"), "true"],
      ]);
      const status = find(answered.html, (element) => element.attrs["role"] === "status");

      assert.strictEqual(opened.response.status, 200);
      assert.notInclude(opened.html, "autofocus");
      assert.strictEqual(
        textOf(
          elementsOf(parseHtml(opened.html)).find((element) => element.tag === "title")?.children ??
            [],
        ),
        message("en", "title", {
          state: message("en", "answering"),
          title: "BG true false example",
        }),
      );
      assert.strictEqual(answered.response.status, 200);
      assert.include(textOf(status.children), message("en", "score", { score: "1" }));
      assertAfterSubmit(answered, "scored", "BG true false example");
    }),
  );

  it.effect(
    "[Q-2] two entries for BG007's single response are refused: atMost 1, on an invalid, focused Control, with both choices kept",
    () =>
      Effect.gen(function* overTicked() {
        const handle = playground();
        const opened = yield* get(handle, itemTarget(paths.bg007));
        const name = entryName(instanceOf(opened.html), "RESPONSE");
        const refused = yield* post(handle, actionOf(opened.html), [
          [name, "true"],
          [name, "false"],
        ]);
        const said = find(
          refused.html,
          (element) =>
            element.tag === "li" &&
            textOf(element.children) === message("en", "atMost", { n: "1" }),
        );
        const id = String(said.attrs["id"]);
        const control = find(refused.html, (element) =>
          String(element.attrs["aria-describedby"] ?? "")
            .split(" ")
            .includes(id),
        );

        const kept = elementsOf(parseHtml(refused.html)).flatMap((element) =>
          element.attrs["name"] === name && Object.hasOwn(element.attrs, "checked")
            ? [element.attrs["value"]]
            : [],
        );

        assert.strictEqual(control.attrs["name"], name);
        assert.strictEqual(control.attrs["aria-invalid"], "true");
        assert.isTrue(Object.hasOwn(control.attrs, "autofocus"));
        assert.deepStrictEqual(kept, ["true", "false"]);
        assertAfterSubmit(refused, "notAccepted", "BG true false example");
      }),
  );

  it.effect("[Q-5] BG011, which has no processing, records the response", () =>
    Effect.gen(function* recorded() {
      const handle = playground();
      const opened = yield* get(handle, itemTarget(paths.bg011));
      const answered = yield* post(handle, actionOf(opened.html), [
        [entryName(instanceOf(opened.html), "RESPONSE"), "Crows clean up."],
      ]);

      assertAfterSubmit(answered, "responseRecorded", "BG media example");
    }),
  );

  it.effect(
    "with maxAttempts 1 a scored submit disables every control and the Submit; with 0 none",
    () =>
      Effect.gen(function* attempts() {
        const submitOnce = Effect.fn("submitOnce")(function* submitOnce(maxAttempts: number) {
          const handle = playground({ configuration: { maxAttempts } });
          const opened = yield* get(handle, itemTarget(paths.bg007));
          const answered = yield* post(handle, actionOf(opened.html), [
            [entryName(instanceOf(opened.html), "RESPONSE"), "false"],
          ]);
          const form = find(answered.html, (element) => element.tag === "form");

          return elementsOf(form.children).filter((element) =>
            ["button", "input", "select", "textarea"].includes(element.tag),
          );
        });
        const limited = yield* submitOnce(1);
        const unlimited = yield* submitOnce(0);

        assert.isAbove(limited.length, 2);
        assert.isTrue(limited.some((element) => element.tag === "button"));
        assert.isTrue(limited.every((element) => Object.hasOwn(element.attrs, "disabled")));
        assert.isAbove(unlimited.length, 2);
        assert.isTrue(unlimited.every((element) => !Object.hasOwn(element.attrs, "disabled")));
      }),
  );

  it.effect(
    "[Q-20] no answer reaches the page: BG010's mapping keys appear in no HTML the handler returns",
    () =>
      Effect.gen(function* allowlist() {
        const handle = playground();
        const listed = yield* get(handle, "/");
        const opened = yield* get(handle, itemTarget(paths.bg010));
        const answered = yield* post(handle, actionOf(opened.html), [
          [entryName(instanceOf(opened.html), "RESPONSE"), "London"],
        ]);

        assert.include(answered.html, "London");
        for (const page of [listed, opened, answered]) {
          assert.notMatch(page.html, /york/iu);
        }
        assertAfterSubmit(answered, "scored", "BG Missing Word example");
      }),
  );

  it.effect(
    "a document path that leaves the corpus root, or names no member, is refused with 404",
    () =>
      Effect.gen(function* traversal() {
        const handle = playground();
        const inside = yield* get(handle, itemTarget(paths.bg007));
        const parent = yield* get(handle, itemTarget(`../${paths.bg007}`));
        const climbing = yield* get(handle, itemTarget(`QTI3_BPIG_Examples/../../${paths.bg007}`));

        const image = yield* get(
          handle,
          itemTarget("QTI3_BPIG_Examples/items/images/airplane.png"),
        );
        const qti22 = yield* get(handle, itemTarget("qtiv2p2-examples/items/choice.xml"));

        assert.strictEqual(inside.response.status, 200);
        assert.strictEqual(parent.response.status, 404);
        assert.strictEqual(climbing.response.status, 404);
        assert.strictEqual(image.response.status, 404, "a file of the root outside the set");
        assert.strictEqual(qti22.response.status, 404, "a QTI 2.2 example outside the set");
      }),
  );

  it.effect(
    "an asset path holding ..%2F or %2e%2e%2f is refused with 404, where the plain path is served",
    () =>
      Effect.gen(function* assets() {
        const handle = playground();
        const airplane = "/assets/QTI3_BPIG_Examples/items/images/airplane.png";
        const before = yield* get(handle, airplane);
        yield* get(handle, itemTarget(paths.bg007));
        yield* get(handle, itemTarget(paths.bg011));

        const served = yield* get(handle, airplane);
        const crows = yield* get(
          handle,
          "/assets/QTI3_BeginnersGuide_Examples/items/resources/crows.jpg",
        );
        const encoded = yield* get(
          handle,
          "/assets/QTI3_BeginnersGuide_Examples/items/..%2F..%2FQTI3_BPIG_Examples/items/images/airplane.png",
        );
        const dotted = yield* get(
          handle,
          "/assets/QTI3_BeginnersGuide_Examples/items/%2e%2e%2f%2e%2e%2fQTI3_BPIG_Examples/items/images/airplane.png",
        );
        const document = yield* get(handle, `/assets/${paths.bg007}`);

        assert.strictEqual(before.response.status, 404);
        assert.strictEqual(served.response.status, 200);
        assert.strictEqual(served.response.headers.get("content-type"), "image/png");
        assert.strictEqual(crows.response.status, 200);
        assert.strictEqual(encoded.response.status, 404);
        assert.strictEqual(dotted.response.status, 404);
        assert.strictEqual(document.response.status, 404);
      }),
  );

  it.effect("the headers are on /, /item and /assets/*, and none allows 'unsafe-inline'", () =>
    Effect.gen(function* headers() {
      const handle = playground();
      const pages = [
        yield* get(handle, "/"),
        yield* get(handle, itemTarget(paths.bg007)),
        yield* get(handle, itemTarget(paths.cat)),
      ];
      const asset = yield* get(handle, "/assets/QTI3_BPIG_Examples/items/images/airplane.png");

      for (const page of pages) {
        for (const [name, value] of Object.entries(pageHeaders)) {
          assert.strictEqual(page.response.headers.get(name), value);
        }
        assert.strictEqual(page.response.headers.get("content-type"), "text/html; charset=utf-8");
      }
      assert.strictEqual(asset.response.status, 200);
      for (const [name, value] of Object.entries(assetHeaders)) {
        assert.strictEqual(asset.response.headers.get(name), value);
      }
      assert.isNull(asset.response.headers.get("cache-control"));
      for (const { response } of [...pages, asset]) {
        for (const [, value] of response.headers) {
          assert.notInclude(value, "unsafe-inline");
        }
      }
    }),
  );

  it.effect(
    "an item's HTML and SVG objects are allowed as nested documents (frame-src 'self'), and each document keeps the asset headers",
    () =>
      Effect.gen(function* nestedDocuments() {
        const handle = playground();
        const embeds = [
          {
            data: "/assets/qtiv3-examples/packaging/items/shared/orkney.html",
            item: paths.orkney,
            served: "text/html; charset=utf-8",
            type: "text/html",
          },
          {
            data: "/assets/qtiv3-examples/packaging/svg/rectangle.svg",
            item: paths.svg,
            served: "image/svg+xml",
            type: "image/svg+xml",
          },
        ] as const;

        for (const { data, item, served, type } of embeds) {
          const page = yield* get(handle, itemTarget(item));
          const object = find(page.html, (element) => element.tag === "object");
          const policy = page.response.headers.get("content-security-policy") ?? "";
          const directives = new Map(
            policy.split(";").map((directive) => {
              const [name = "", ...sources] = directive.trim().split(/\s+/u);

              return [name, sources] as const;
            }),
          );

          assert.strictEqual(page.response.status, 200, item);
          assert.strictEqual(policy, pageHeaders["content-security-policy"], item);
          assert.deepStrictEqual(directives.get("frame-src"), ["'self'"]);
          assert.deepStrictEqual(directives.get("object-src"), ["'self'"]);
          assert.deepStrictEqual(
            [...directives].filter(([name]) => name.startsWith("script-src")),
            [["script-src", ["'none'"]]],
          );
          assert.strictEqual(object.attrs["data"], data, item);
          assert.strictEqual(object.attrs["type"], type, item);

          const asset = yield* get(handle, new URL(data, page.url).pathname);

          assert.strictEqual(asset.response.status, 200, data);
          assert.strictEqual(asset.response.headers.get("content-type"), served, data);
          for (const [name, value] of Object.entries(assetHeaders)) {
            assert.strictEqual(asset.response.headers.get(name), value, `${data}: ${name}`);
          }
        }
      }),
  );

  it.effect("a document title that holds <script> appears escaped", () =>
    Effect.gen(function* escaped() {
      const { html, response } = yield* get(scratchHandler, itemTarget(hostile));
      const heading = find(html, (element) => element.tag === "h1");

      assert.strictEqual(response.status, 200);
      assert.notInclude(html, "<script");
      assert.include(html, "&lt;script&gt;");
      assert.strictEqual(textOf(heading.children), hostileTitle);
    }),
  );

  it.effect(
    "a path and a refusal holding <script> appear escaped on the listing and the item page",
    () =>
      Effect.gen(function* escapedPath() {
        const listed = yield* get(scratchHandler, "/");
        const opened = yield* get(scratchHandler, itemTarget(scriptPath));
        const link = find(
          listed.html,
          (element) => element.tag === "a" && element.attrs["href"] === itemTarget(scriptPath),
        );
        const refusal = find(opened.html, (element) => element.attrs["data-rule"] === "value-type");

        for (const { html, response } of [listed, opened]) {
          assert.strictEqual(response.status, 200);
          assert.notInclude(html, "<script");
          assert.include(html, "&lt;script&gt;");
        }
        assert.strictEqual(textOf(link.children), scriptPath);
        assert.include(textOf(refusal.children), "`<script>`");
        assert.deepStrictEqual(
          sectionsOf(listed.html).map((section) => section.links.map(([, text]) => text)),
          [[hostile], [], [], [scriptPath]],
        );
      }),
  );

  it.effect(
    "GET /styles.css and /playground.css serve their files as text/css, and they and /theme.css carry the page headers",
    () =>
      Effect.gen(function* sheets() {
        const handle = playground();
        const listing = yield* get(handle, "/");
        const files = [
          ["/styles.css", "#plate/styles.css"],
          ["/playground.css", "#plate/dev/playground.css"],
        ] as const;

        for (const [target, specifier] of files) {
          const served = yield* bytes(handle, target);

          assert.strictEqual(served.response.status, 200, target);
          assert.strictEqual(
            served.response.headers.get("content-type"),
            "text/css; charset=utf-8",
          );
          assert.deepStrictEqual(
            served.body,
            new Uint8Array(readFileSync(new URL(import.meta.resolve(specifier)))),
          );
          assertPageHeaders(listing.response, served.response);
        }

        const theme = yield* themeSheet(handle);
        assert.strictEqual(theme.response.status, 200);
        assert.strictEqual(theme.response.headers.get("content-type"), "text/css; charset=utf-8");
        assertPageHeaders(listing.response, theme.response);
      }),
  );

  it.effect(
    "POST /theme stores an accepted theme and answers 303 to its return; /theme.css then serves it",
    () =>
      Effect.gen(function* stored() {
        const handle = playground();
        const listing = yield* get(handle, "/");
        const before = yield* themeSheet(handle);
        const target = `/item?path=${paths.bg007}`;
        const posted = yield* postTheme(handle, [
          ["theme", acceptedTheme],
          ["dark", "on"],
          ["return", target],
        ]);
        const after = yield* themeSheet(handle);

        assert.notInclude(before.html, "--primary");
        assert.strictEqual(posted.response.status, 303);
        assert.strictEqual(posted.response.headers.get("location"), target);
        assertPageHeaders(listing.response, posted.response);
        assert.include(
          after.html,
          ':root {\n  --primary: oklch(0.205 0 0);\n  --font-sans: "Inter", sans-serif;\n}',
        );
        assert.include(after.html, ".dark {\n  --primary: oklch(0.922 0 0);\n}");
        assert.include(after.html, ".dark {\n  color-scheme: dark;\n}");
      }),
  );

  it.effect(
    "a refused theme answers 400 with its refusal escaped and the page headers, and leaves /theme.css unchanged",
    () =>
      Effect.gen(function* refused() {
        const handle = playground();
        const listing = yield* get(handle, "/");
        yield* postTheme(handle, [["theme", acceptedTheme]]);

        const before = yield* themeSheet(handle);
        const answered = yield* postTheme(handle, [
          ["theme", ":root { --x: 1 }\n<b> { --y: 2 }"],
          ["return", "/"],
        ]);
        const after = yield* themeSheet(handle);
        const cause = find(answered.html, (element) => element.attrs["data-cause"] !== undefined);

        assert.strictEqual(answered.response.status, 400);
        assert.strictEqual(
          answered.response.headers.get("content-type"),
          "text/html; charset=utf-8",
        );
        assertPageHeaders(listing.response, answered.response);
        assert.isNull(answered.response.headers.get("location"));
        assert.strictEqual(cause.attrs["data-cause"], "selector");
        assert.include(textOf(cause.children), "<b>");
        assert.include(answered.html, "&lt;b&gt;");
        assert.notInclude(answered.html, "<b>");
        assert.include(before.html, "--primary");
        assert.strictEqual(after.html, before.html);
      }),
  );

  it.effect("a return that leaves the origin, or whose path begins with //, redirects to /", () =>
    Effect.gen(function* offsite() {
      const handle = playground();
      const returns = [
        "//evil.example/",
        "/\t/evil.example",
        "/\t\\evil.example",
        "/.//evil.example",
        "/x/..//evil.example",
        "http://localhost:5190//evil.example",
      ];

      for (const value of returns) {
        const posted = yield* postTheme(handle, [
          ["theme", acceptedTheme],
          ["return", value],
        ]);

        assert.strictEqual(posted.response.status, 303, JSON.stringify(value));
        assert.strictEqual(posted.response.headers.get("location"), "/", JSON.stringify(value));
      }
    }),
  );

  it.effect("an absent or empty return redirects to /", () =>
    Effect.gen(function* fallback() {
      const handle = playground();
      const absent = yield* postTheme(handle, [["theme", acceptedTheme]]);
      const empty = yield* postTheme(handle, [
        ["theme", acceptedTheme],
        ["return", ""],
      ]);

      for (const { response } of [absent, empty]) {
        assert.strictEqual(response.status, 303);
        assert.strictEqual(response.headers.get("location"), "/");
      }
    }),
  );

  it.effect(
    "the listing and the BG007 item page link the three sheets in order and end main with the theme box, outside the item form",
    () =>
      Effect.gen(function* themeBox() {
        const handle = playground();
        const listed = yield* get(handle, "/");
        const opened = yield* get(handle, itemTarget(paths.bg007));

        for (const page of [listed, opened]) {
          assert.deepStrictEqual(linkedSheets(page.html), sheetOrder);
          assertThemeBox(page.html);
        }
        assert.match(actionOf(opened.html), /^\/item\?/u);
      }),
  );

  it.effect(
    "the 400 page of a refused theme links the three sheets and carries the box, which returns where the post would have",
    () =>
      Effect.gen(function* refusedBox() {
        const target = itemTarget(paths.bg007);
        const answered = yield* postTheme(playground(), [
          ["theme", "body { color: red }"],
          ["return", target],
        ]);

        assert.strictEqual(answered.response.status, 400);
        assert.deepStrictEqual(linkedSheets(answered.html), sheetOrder);
        assert.strictEqual(fieldOf(assertThemeBox(answered.html), "return").attrs["value"], target);
      }),
  );

  it.effect(
    "after POST /theme with dark=on the item page's html has class dark and the box's Dark is checked; with the flag off neither",
    () =>
      Effect.gen(function* dark() {
        const handle = playground();
        const before = yield* get(handle, itemTarget(paths.bg007));
        yield* postTheme(handle, [
          ["theme", acceptedTheme],
          ["dark", "on"],
        ]);

        const on = yield* get(handle, itemTarget(paths.bg007));
        yield* postTheme(handle, [["theme", acceptedTheme]]);

        const off = yield* get(handle, itemTarget(paths.bg007));
        assert.notInclude(htmlClasses(before.html), "dark");
        assert.include(htmlClasses(on.html), "dark");
        assert.isTrue(darkChecked(on.html));
        assert.notInclude(htmlClasses(off.html), "dark");
        assert.isFalse(darkChecked(off.html));
      }),
  );

  it.effect("the box's return field holds the page's own path and query", () =>
    Effect.gen(function* returnField() {
      const handle = playground();
      const listed = yield* get(handle, "/");
      const opened = yield* get(handle, itemTarget(paths.bg007));
      const action = actionOf(opened.html);
      const { pathname, search } = new URL(action, origin);
      const answered = yield* post(handle, action, [
        [entryName(instanceOf(opened.html), "RESPONSE"), "true"],
      ]);
      assert.strictEqual(returnOf(listed.html), "/");
      assert.strictEqual(returnOf(opened.html), itemTarget(paths.bg007));
      assert.strictEqual(returnOf(answered.html), `${pathname}${search}`);
    }),
  );

  it.effect(
    "each form is named by its visible heading: the item's form by the item's title, the theme box by Theme",
    () =>
      Effect.gen(function* namedForms() {
        const handle = playground();
        const listed = yield* get(handle, "/");
        const opened = yield* get(handle, itemTarget(paths.bg011));
        const answered = yield* post(handle, actionOf(opened.html), [
          [entryName(instanceOf(opened.html), "RESPONSE"), "Crows clean up."],
        ]);

        for (const [{ html }, itemForms] of [
          [listed, 0],
          [opened, 1],
          [answered, 1],
        ] as const) {
          const tree = h("div", {}, parseHtml(html));
          const forms = elementsOf([tree]).filter((element) => element.tag === "form");
          const box = forms.find((form) => form.attrs["action"] === "/theme");
          const heading = elementsOf(box?.children ?? []).find((element) => element.tag === "h2");
          const title = elementsOf([tree]).find((element) => element.tag === "h1");
          const others = forms.filter((candidate) => candidate !== box);

          assert.isDefined(box);
          assert.strictEqual(nameOf(box, tree), "Theme");
          assert.strictEqual(nameOf(box, tree), textOf(heading?.children ?? []));
          assert.lengthOf(others, itemForms);
          for (const form of others) {
            assert.strictEqual(nameOf(form, tree), "BG media example");
            assert.strictEqual(nameOf(form, tree), textOf(title?.children ?? []));
          }
        }
      }),
  );

  it.effect(
    "checkTree passes on the listing and on an item page before a submit and after a scored, a recorded and a refused one",
    () =>
      Effect.gen(function* accessibleItemPages() {
        const handle = playground();
        const listed = yield* get(handle, "/");
        const opened = yield* get(handle, itemTarget(paths.bg007));
        const name = entryName(instanceOf(opened.html), "RESPONSE");
        const scored = yield* post(handle, actionOf(opened.html), [[name, "true"]]);
        const refusing = yield* get(handle, itemTarget(paths.bg007));
        const refusedName = entryName(instanceOf(refusing.html), "RESPONSE");
        const refused = yield* post(handle, actionOf(refusing.html), [
          [refusedName, "true"],
          [refusedName, "false"],
        ]);
        const recording = yield* get(handle, itemTarget(paths.bg011));
        const recorded = yield* post(handle, actionOf(recording.html), [
          [entryName(instanceOf(recording.html), "RESPONSE"), "Crows clean up."],
        ]);

        for (const { html } of [listed, opened, scored, refused, recording, recorded]) {
          assert.deepStrictEqual(pageViolations(html), []);
        }
      }),
    corpusTimeoutMs,
  );

  it.effect("the box's textarea shows the stored theme's text, escaped", () =>
    Effect.gen(function* escapedTheme() {
      const handle = playground();
      const stored = ':root {\n  --font-sans: "A&B", serif;\n}\n';
      const posted = yield* postTheme(handle, [["theme", stored]]);
      const listed = yield* get(handle, "/");
      const textarea = fieldOf(themeBoxOf(listed.html), "theme");

      assert.strictEqual(posted.response.status, 303);
      assert.include(listed.html, "A&amp;B");
      assert.notInclude(listed.html, "A&B");
      assert.strictEqual(
        textarea.children.map((child) => (child.kind === "text" ? child.text : "")).join(""),
        stored,
      );
    }),
  );

  describe("the keyboard-only completion in the playground", () => {
    it.effect(
      "[Q-2] [keyboard] BG007 completes in the playground: its form walked by keys, posted, and scored 1",
      () =>
        Effect.gen(function* bg007() {
          const answered = yield* walkAndPost(playground(), paths.bg007, [
            "Tab",
            "Space",
            "Tab",
            "Enter",
          ]);
          const status = find(answered.html, (element) => element.attrs["role"] === "status");

          assert.include(textOf(status.children), message("en", "score", { score: "1" }));
          assertAfterSubmit(answered, "scored", "BG true false example");
        }),
    );

    it.effect(
      "[Q-20] [keyboard] BG010 completes in the playground: York typed, posted, and scored 1",
      () =>
        Effect.gen(function* bg010() {
          const answered = yield* walkAndPost(playground(), paths.bg010, [
            "Tab",
            { type: "York" },
            "Enter",
          ]);
          const status = find(answered.html, (element) => element.attrs["role"] === "status");

          assert.include(textOf(status.children), message("en", "score", { score: "1" }));
          assertAfterSubmit(answered, "scored", "BG Missing Word example");
        }),
    );

    it.effect(
      "[Q-5] [keyboard] BG011 completes in the playground: past the video, its answer typed, posted, and the response recorded",
      () =>
        Effect.gen(function* bg011() {
          const answer = "Crows eat insects.";
          const answered = yield* walkAndPost(playground(), paths.bg011, [
            "Tab",
            "Tab",
            { type: answer },
            "Tab",
            "Enter",
          ]);
          const textarea = find(answered.html, (element) => element.tag === "textarea");

          assert.include(textOf(textarea.children), answer);
          assertAfterSubmit(answered, "responseRecorded", "BG media example");
        }),
    );
  });
});

/**
 * Give the element children of a node tree's element.
 *
 * @param element The element.
 * @returns Its children that are elements, in order.
 */
const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * Give what a reader meets first in each child of an element: a table by its caption, anything
 * else by its text.
 *
 * @param element The element.
 * @returns Each child's tag and words, in order.
 */
const readingOrder = (element: Element): readonly (readonly [tag: string, words: string])[] =>
  elementChildren(element).map((child) => [
    child.tag,
    child.tag === "table"
      ? textOf(elementChildren(child).find((part) => part.tag === "caption")?.children ?? [])
      : textOf(child.children),
  ]);

/**
 * Give the row headers of a table's body: each `th`'s `scope` and text.
 *
 * @param table The table.
 * @returns Each body row's header, in order.
 */
const rowHeaders = (
  table: Element,
): readonly (readonly [scope: string | true | undefined, words: string])[] =>
  elementChildren(table)
    .filter((part) => part.tag === "tbody")
    .flatMap(elementChildren)
    .map((row) => {
      const header = elementChildren(row).find((cell) => cell.tag === "th");

      return [header?.attrs["scope"], textOf(header?.children ?? [])] as const;
    });

describe("dev/page.ts: the verdicts page and the ledger page", () => {
  it.effect(
    "/verdicts is a table with a caption, the four column headers and one row per member, in the set's order, its path the row header",
    () =>
      Effect.gen(function* verdictsPage() {
        const known = yield* verdicts.verdicts;
        const { html, response } = yield* get(playground(), "/verdicts");
        const table = find(html, (element) => element.tag === "table");
        const [caption, head, body] = elementChildren(table);

        assert.strictEqual(response.status, 200);
        assert.strictEqual(caption?.tag, "caption");
        assert.notStrictEqual(textOf(caption?.children ?? []), "");
        assert.strictEqual(head?.tag, "thead");
        assert.deepStrictEqual(
          elementsOf(head?.children ?? []).flatMap((element) =>
            element.tag === "th" ? [[element.attrs["scope"], textOf(element.children)]] : [],
          ),
          [
            ["col", "Document"],
            ["col", "Verdict"],
            ["col", "Reason"],
            ["col", "Unsupported features"],
          ],
        );
        assert.strictEqual(body?.tag, "tbody");
        assert.deepStrictEqual(
          rowHeaders(table),
          known.map((verdict) => ["row", verdict.document]),
        );
        assert.deepStrictEqual(
          elementChildren(body ?? h("tbody", {})).map((row) =>
            textOf(elementChildren(row)[1]?.children ?? []),
          ),
          known.map((verdict) => verdict.verdict),
        );
      }),
    corpusTimeoutMs,
  );

  it.effect(
    "/ledger, with PLATE_LEDGER_DIR at a fixture folder, shows the view's ledger: per level its heading and headline, then a table per family with a caption and the ID as row header",
    () =>
      Effect.gen(function* ledgerPage() {
        const { html, response } = yield* get(ledgerHandler(ledgerSetting), "/ledger");
        const article = find(html, (element) => element.tag === "article");
        const order = readingOrder(article);
        const tables = elementChildren(article).filter((child) => child.tag === "table");

        assert.strictEqual(response.status, 200);
        assert.include(html, toHtml(ledgerHtml(fixtureLedger)));
        assert.deepStrictEqual(order[0], ["h1", "Feature ledger"]);
        assert.deepStrictEqual(
          order.slice(
            2,
            order.findIndex(([tag, words]) => tag === "h2" && words === "Limited rows"),
          ),
          [
            ["h2", "Basic"],
            ["p", "1 covered, 1 limited, 0 excluded, 1 not yet supported."],
            ["table", "Basic: Accessibility (A)"],
            ["table", "Basic: Items (I)"],
            ["table", "Basic: Interactions (Q)"],
            ["h2", "Advanced"],
            ["p", "0 covered, 0 limited, 1 excluded, 0 not yet supported."],
            ["table", "Advanced: Metadata (M)"],
            ["h2", "Elevated"],
            ["p", "0 covered, 0 limited, 0 excluded, 0 not yet supported."],
            ["h2", "Elective"],
            ["p", "0 covered, 0 limited, 0 excluded, 0 not yet supported."],
          ],
        );
        assert.deepStrictEqual(tables.map(rowHeaders), [
          [["row", "A-1"]],
          [["row", "I-7"]],
          [["row", "Q-2"]],
          [["row", "M-1"]],
        ]);
      }),
  );

  it.effect(
    "/ledger with no ledger.json names the file it looked for and says to run the one command and reload",
    () =>
      Effect.gen(function* noLedger() {
        const { html, response } = yield* get(ledgerHandler(noLedgerFolder), "/ledger");
        const elements = elementsOf(parseHtml(html));
        const main = find(html, (element) => element.tag === "main");
        const command = find(html, (element) => element.tag === "code");

        assert.strictEqual(response.status, 200);
        assert.strictEqual(textOf(command.children), "pnpm --filter @qti-pie/plate ledger");
        assert.include(textOf(main.children), path.join(noLedgerFolder, "ledger.json"));
        assert.isTrue(
          elements.every((element) => element.tag !== "article" && element.tag !== "table"),
        );
      }),
  );

  it.effect(
    "/ledger with a ledger.json that is no ledger answers a developer error naming the file",
    () =>
      Effect.gen(function* malformed() {
        const { html, response } = yield* get(ledgerHandler(malformedFolder), "/ledger");
        const main = find(html, (element) => element.tag === "main");

        assert.strictEqual(response.status, 500);
        assert.include(textOf(main.children), path.join(malformedFolder, "ledger.json"));
        assert.isTrue(elementsOf(parseHtml(html)).every((element) => element.tag !== "article"));
      }),
  );

  it.effect(
    "/verdicts and /ledger carry the page headers, link the three sheets, write no style and end with the theme box",
    () =>
      Effect.gen(function* chrome() {
        const pages = [
          yield* get(playground(), "/verdicts"),
          yield* get(ledgerHandler(ledgerSetting), "/ledger"),
          yield* get(ledgerHandler(noLedgerFolder), "/ledger"),
        ];

        for (const { html, response } of pages) {
          for (const [name, value] of Object.entries(pageHeaders)) {
            assert.strictEqual(response.headers.get(name), value, name);
          }
          assert.strictEqual(response.headers.get("content-type"), "text/html; charset=utf-8");
          for (const [, value] of response.headers) {
            assert.notInclude(value, "unsafe-inline");
          }
          assert.deepStrictEqual(linkedSheets(html), sheetOrder);
          assert.isTrue(
            elementsOf(parseHtml(html)).every(
              (element) => element.tag !== "style" && !Object.hasOwn(element.attrs, "style"),
            ),
          );
          assertThemeBox(html);
        }
      }),
    corpusTimeoutMs,
  );

  it.effect("a POST to /verdicts or /ledger is refused with 405", () =>
    Effect.gen(function* refused() {
      const verdictsPost = yield* post(playground(), "/verdicts", []);
      const ledgerPost = yield* post(ledgerHandler(ledgerSetting), "/ledger", []);

      assert.strictEqual(verdictsPost.response.status, 405);
      assert.strictEqual(ledgerPost.response.status, 405);
    }),
  );

  it.effect(
    "checkTree passes on /verdicts, and on /ledger with and without a ledger",
    () =>
      Effect.gen(function* accessible() {
        const pages = [
          yield* get(playground(), "/verdicts"),
          yield* get(ledgerHandler(ledgerSetting), "/ledger"),
          yield* get(ledgerHandler(noLedgerFolder), "/ledger"),
        ];

        for (const { html } of pages) {
          assert.deepStrictEqual(pageViolations(html), []);
        }
      }),
    corpusTimeoutMs,
  );

  it.effect(
    "a path and a refusal holding <script> on /verdicts, and a test title holding <script> on /ledger, appear escaped",
    () =>
      Effect.gen(function* escapedReports() {
        const reported = yield* get(scratchHandler, "/verdicts");
        const ledgered = yield* get(ledgerHandler(ledgerSetting), "/ledger");
        const row = find(
          reported.html,
          (element) =>
            element.tag === "tr" &&
            textOf(elementChildren(element)[0]?.children ?? []) === scriptPath,
        );
        const article = find(ledgered.html, (element) => element.tag === "article");

        for (const { html, response } of [reported, ledgered]) {
          assert.strictEqual(response.status, 200);
          assert.notInclude(html, "<script");
          assert.include(html, "&lt;script&gt;");
        }
        assert.include(textOf(row.children), "`<script>`");
        assert.include(textOf(article.children), hostileTest);
      }),
  );
});
