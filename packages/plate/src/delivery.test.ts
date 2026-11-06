import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { corpusRoot } from "#plate/document/corpus.ts";
import {
  advance,
  configure,
  current,
  decode,
  decodeIntent,
  decodeSession,
  encodeIntent,
  encodeRedacted,
  encodeSession,
  entryName,
  h,
  intentName,
  itemRefs,
  itemView,
  navigationState,
  openPackage,
  partition,
  permits,
  postings,
  redact,
  render,
  renderNavigation,
  restore,
  results,
  score,
  solution,
  startTest,
} from "#plate/index.ts";
import type {
  Accepted,
  AcceptedPackage,
  AcceptedTest,
  Attributes,
  Configuration,
  Element,
  Entry,
  Intent,
  ItemView,
  Node,
  PackageVerdict,
  PartOverrides,
  Redacted,
  Responses,
  Step,
  TestSession,
  Value,
} from "#plate/index.ts";
import { attribute, checkTree, inputType } from "#plate/test/accessibility.ts";
import { keyboardWalk, tabOrder } from "#plate/test/keyboard.ts";
import type { Key } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * A session walks a package read from disk and validates its results with xmllint, which takes
 * about a second here; the bound leaves room for a slow machine without letting a hung read or a
 * hung xmllint stall the suite.
 */
const sessionTimeoutMs = 60_000;

/**
 * The session instance every sitting here starts with. It is a UUID, as a host draws one, so
 * `partition` reads an entry named for another item of the session, or for the session's intent,
 * as another instance's.
 */
const instance = "4c7e1a2b-9d3f-4e8a-b6c5-0f1e2d3c4b5a";

/**
 * The seed the host's configuration carries, which a session keeps.
 */
const hostSeed = 3;

/**
 * The seed a host that restores a session passes instead, so a restored page that read the host's
 * seed rather than the stored one would present fixture P1's shuffled Choice in another order.
 */
const otherSeed = 5;

/**
 * When every sitting starts.
 */
const startedAt = Date.parse("2026-11-05T09:00:00.000Z");

/**
 * The time between two transitions of a sitting, in milliseconds.
 */
const tick = 10_000;

/**
 * The Results Reporting XSD under the oracle's cache.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * The package directory, `packages/plate`.
 */
const packageDirectory = fileURLToPath(new URL("../", import.meta.resolve("#plate/index.ts")));

/**
 * The location the fixture package is opened under, its directory relative to the package.
 */
const fixtureLocation = "fixtures/m2";

/**
 * The corpus packages the witness opens, each the directory its zip was extracted into.
 */
const corpusPackages = {
  begGuide: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d",
  case: "qtiv3-examples/packaging/CASE/CASE.zip.d",
  lti: "qtiv3-examples/packaging/lti/lti.zip.d",
  minFiles: "qtiv3-examples/packaging/test_package_minfiles/test_package_minfiles.zip.d",
  pciItems: "qtiv3-examples/packaging/pci/pci_item_examples.zip.d",
  samplePci: "qtiv3-examples/PCI/sample_pci.zip.d",
  testWithLti: "qtiv3-examples/packaging/testWithLti/testWithLti.zip.d",
} as const;

/**
 * The fields of a redacted item's JSON that would hold what the page must not know: a response's
 * correct response, mapping, area mapping and default, and the item's outcome declarations and
 * response processing. None appears at any depth.
 */
const hiddenKeys: ReadonlySet<string> = new Set([
  "areaMapping",
  "correct",
  "defaultValue",
  "mapping",
  "outcomes",
  "processing",
]);

/**
 * Matches a text of three characters (code points) or more, the shortest secret the check looks
 * for: a shorter value occurs in unrelated text by chance too often to say anything.
 */
const longEnough = /.{3}/su;

/**
 * Unwrap a result the walk requires to succeed.
 *
 * @param result The result.
 * @param what What produced it, for the failure's message.
 * @returns Its success.
 */
const ok = <A, E extends Error>(result: Result.Result<A, E>, what: string): A =>
  Result.getOrElse(result, (failure) => assert.fail(`${what}: ${failure.message}`));

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
 * Open a corpus package from the cache.
 *
 * @param directory The package's directory under the corpus root, also its location.
 * @returns The verdict on the package.
 */
const openCorpusPackage = Effect.fnUntraced(function* openCorpusPackage(directory: string) {
  return yield* openPackage(directory, yield* filesOf(path.join(yield* corpusRoot, directory)));
});

/**
 * Open the M2 fixture package, under {@link fixtureLocation}.
 *
 * @returns The verdict on the package.
 */
const openFixture = Effect.fnUntraced(function* openFixture() {
  return yield* openPackage(
    fixtureLocation,
    yield* filesOf(path.join(packageDirectory, fixtureLocation)),
  );
});

/**
 * Take the accepted package of an accepting verdict; the test fails when it does not accept.
 *
 * @param verdict The package verdict.
 * @returns The accepted package.
 */
const acceptedOf = (verdict: PackageVerdict): AcceptedPackage =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? verdict.accepted
    : assert.fail(`${verdict.location} is ${verdict.verdict}, not accepted`);

/**
 * Give the rules of a package verdict's refusals, each with the document's path in the package,
 * in order; none when it does not refuse.
 *
 * @param verdict The package verdict.
 * @returns Each refusal's rule and the path of its document, `.` for the package itself.
 */
const refusalsOf = (verdict: PackageVerdict): readonly (readonly [string, string])[] =>
  verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) => [
        refusal.rule,
        refusal.document === verdict.location
          ? "."
          : refusal.document.slice(verdict.location.length + 1),
      ])
    : [];

/**
 * Give the verdict on the document of one resource of a package.
 *
 * @param verdict The package verdict.
 * @param identifier The resource's identifier.
 * @returns The document's verdict, `none` when the resource has none.
 */
const documentVerdict = (verdict: PackageVerdict, identifier: string): string => {
  const resource =
    verdict.resources.find((entry) => entry.identifier === identifier) ??
    assert.fail(`${verdict.location} lists no resource ${identifier}`);

  return Option.match(resource.verdict, {
    onNone: () => "none",
    onSome: (document) => document.verdict,
  });
};

/**
 * What a host delivers a test with: the test, its items keyed by item ref, and its configuration.
 */
interface Delivery {
  readonly configuration: Configuration;
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Take one test of an accepted package, with the host's configuration.
 *
 * @param verdict The package verdict.
 * @param testPath The test document's path in the package.
 * @param configuration The host's configuration.
 * @returns The delivery.
 */
const deliveryOf = (
  verdict: PackageVerdict,
  testPath: string,
  configuration: Configuration,
): Delivery => {
  const held = acceptedOf(verdict).tests.get(`${verdict.location}/${testPath}`);

  return held === undefined
    ? assert.fail(`${verdict.location} holds no test ${testPath}`)
    : { configuration, items: held.items, test: held.test };
};

/**
 * The navigation parts that are buttons: each is swapped for the host's submit button.
 */
const navigationButtons = ["previous", "next", "itemButton", "submit", "end"] as const;

/**
 * Make one navigation button the host's submit button, named for the session's intent and posting
 * the intent plate handed it, as the playground swaps them (rule `9af3809b`).
 *
 * @param props The attributes plate computed for the button.
 * @param children The button's label.
 * @returns The submit button.
 */
const submitting = (props: Attributes, children: readonly Node[]): Element =>
  h(
    "button",
    { name: intentName(instance), type: "submit", value: props["data-intent"] ?? "" },
    children,
  );

/**
 * The part overrides that swap every navigation button for {@link submitting}.
 */
const submitButtons: PartOverrides = {
  "test-navigation": Object.fromEntries(navigationButtons.map((part) => [part, submitting])),
};

/**
 * Parse an HTML fragment into its single root element.
 *
 * @param html The fragment.
 * @returns Its root element.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);
  assert.lengthOf(rest, 0, "the fragment has one root");

  return root?.kind === "element" ? root : assert.fail("the fragment's root is not an element");
};

/**
 * List the elements of a tree in document order, each before its descendants.
 *
 * @param nodes The tree's nodes.
 * @returns Every element they hold.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Wrap a page's content in the host's composition: a `div` that gives the language, around the
 * host's native form when the page posts.
 *
 * @param content The page's HTML.
 * @param form Whether the content sits in the host's form.
 * @returns The page's HTML.
 */
const pageHtml = (content: string, form: boolean): string =>
  form
    ? `<div lang="en"><form action="/session" method="post" novalidate>${content}</form></div>`
    : `<div lang="en">${content}</div>`;

/**
 * Check a page against the static accessibility rules, as every page state is checked: `checkTree`
 * finds nothing, the navigation swapped for submit buttons included (the focus order: after the
 * item's controls, Previous, the items, Next, Submit, End).
 *
 * @param html The page's HTML.
 * @param state The page state, for the failure's message.
 * @returns The page's root.
 */
const checked = (html: string, state: string): Element => {
  const page = rootOf(html);

  assert.deepStrictEqual(checkTree(page, { baseLevel: 2 }), [], `checkTree passes on ${state}`);

  return page;
};

/**
 * Give the text a single value holds: an identifier's, a string's or a URI's, nothing for the other
 * base types, whose values are numbers or pairs.
 *
 * @param single The value.
 * @returns Its text, or nothing.
 */
const textOf = (single: Value["values"][number]): readonly string[] =>
  single.baseType === "identifier" || single.baseType === "string" || single.baseType === "uri"
    ? [single.value]
    : [];

/**
 * Give the text values some values hold.
 *
 * @param values The values, by response identifier.
 * @returns Their text values.
 */
const textsOf = (values: Responses): readonly string[] =>
  Object.values(values).flatMap((value) => value.values.flatMap(textOf));

/**
 * Give what an item holds that its page must not know, as text: each correct response, mapping
 * key and response default, and each outcome default, of three characters or more.
 *
 * @param accepted The item.
 * @returns The secrets.
 */
const secretsOf = (accepted: Accepted): readonly string[] => {
  const responses = [...accepted.item.responses.values()];
  const outcomes = [...accepted.item.outcomes.values()];
  const secrets = [
    ...responses.flatMap((declaration) => [
      ...Option.toArray(declaration.correct),
      ...Option.toArray(declaration.defaultValue),
    ]),
    ...outcomes.flatMap((declaration) => Option.toArray(declaration.defaultValue)),
  ].flatMap((value) => textsOf({ value }));
  const keys = responses.flatMap((declaration) =>
    Option.match(declaration.mapping, {
      onNone: () => [],
      onSome: (mapping) => mapping.entries.flatMap(({ key }) => textOf(key)),
    }),
  );

  return [...new Set([...secrets, ...keys])].filter((secret) => longEnough.test(secret));
};

/**
 * Check criterion 1 on one render: `redact`'s output holds no hidden field at any depth, and the
 * HTML holds a secret of the item only as a Control's value the render was handed, so a correct
 * response reaches a page only as the author's `values`, in a solution render or as the
 * candidate's own answer.
 *
 * A secret the redacted item itself holds, such as a choice identifier that is also the correct
 * response, is part of the item's body, so it is not looked for.
 *
 * @param accepted The item.
 * @param html The render's HTML.
 * @param shown The values the render was handed.
 * @param state The render's state, for the failure's message.
 */
const assertNoAnswer = (accepted: Accepted, html: string, shown: Responses, state: string) => {
  // A key is written `"<key>":` in JSON text, which a string value cannot hold, since it escapes
  // its quotes.
  const visible = JSON.stringify(ok(encodeRedacted(redact(accepted)), "encodeRedacted"));
  const leaked = [...hiddenKeys].filter((key) => visible.includes(`"${key}":`));

  assert.deepStrictEqual(leaked, [], `${state}: redact's output holds no hidden field`);

  const values = new Set(textsOf(shown));
  const secrets = secretsOf(accepted).filter((secret) => !visible.includes(secret));
  const elements = elementsOf(parseHtml(html));
  const places = elements.flatMap((element) => [
    ...Object.entries(element.attrs).flatMap(([name, value]) =>
      value === true ? [] : [{ isValue: name === "value", text: value }],
    ),
    ...element.children.flatMap((child) =>
      child.kind === "text" ? [{ isValue: element.tag === "textarea", text: child.text }] : [],
    ),
  ]);

  for (const secret of secrets) {
    const misplaced = places.filter(
      (place) => place.text.includes(secret) && !(place.isValue && values.has(place.text)),
    );

    assert.deepStrictEqual(misplaced, [], `${state}: ${secret} appears only as a value handed in`);
  }
};

/**
 * An item of a delivery, and its redaction, the one input `render` takes.
 */
interface Opened {
  readonly accepted: Accepted;
  readonly redacted: Redacted;
}

/**
 * The item a view shows, and its redaction.
 *
 * @param delivery The delivery.
 * @param view The view.
 * @returns The accepted item and its redaction.
 */
const itemOf = (delivery: Delivery, view: ItemView): Opened => {
  const accepted =
    delivery.items.get(view.ref) ?? assert.fail(`the delivery holds no item for ${view.ref}`);

  return { accepted, redacted: redact(accepted) };
};

/**
 * Render an item of a session as `ItemView` says a host renders it, in answering mode, and check
 * criterion 1 on the render.
 *
 * @param delivery The delivery.
 * @param view The item's view.
 * @param state The page state, for a failure's message.
 * @returns The render's HTML.
 */
const answeringHtml = (delivery: Delivery, view: ItemView, state: string): string => {
  const { accepted, redacted } = itemOf(delivery, view);
  const { html } = ok(
    render(redacted, view.configuration, {
      disabled: view.disabled,
      instance: view.instance,
      values: view.values,
    }),
    `render ${view.ref}`,
  );

  assertNoAnswer(accepted, html, view.values, `${state}, answering`);

  return html;
};

/**
 * The page a host composes for a session now: the current item and the navigation, or, once the
 * test has closed, the navigation alone.
 */
interface SessionPage {
  /**
   * The page's HTML with plate's plain-button navigation, which posts nothing.
   */
  readonly plain: string;
  /**
   * The page's HTML with every navigation button swapped for the host's submit button.
   */
  readonly swapped: string;
  /**
   * The item `current` shows, none once the test has closed.
   */
  readonly view: Option.Option<ItemView>;
}

/**
 * Compose a session's page as a host does: `current` with the host's configuration, the item
 * rendered with the view's configuration and instance, and `renderNavigation` over
 * `navigationState`, once unswapped and once swapped for the host's submit buttons.
 *
 * @param delivery The delivery.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param state The page state, for a failure's message.
 * @returns The page.
 */
const sessionPage = (
  delivery: Delivery,
  session: TestSession,
  configuration: Configuration,
  state: string,
): SessionPage => {
  const shown = ok(current(delivery.test, session, configuration), "current");
  const navigation = ok(navigationState(delivery.test, session), "navigationState");
  const view = shown.kind === "item" ? Option.some(shown) : Option.none();
  const item = Option.match(view, {
    onNone: () => "",
    onSome: (itemShown) => answeringHtml(delivery, itemShown, state),
  });
  const locale = Option.match(view, {
    onNone: () => configuration,
    onSome: (itemShown) => itemShown.configuration,
  });
  const plain = ok(renderNavigation(navigation, locale), "renderNavigation");
  const swapped = ok(renderNavigation(navigation, locale, { parts: submitButtons }), "swapped");

  return {
    plain: pageHtml(`${item}${plain}`, true),
    swapped: pageHtml(`${item}${swapped}`, true),
    view,
  };
};

/**
 * Tell whether a radio or checkbox is checked.
 *
 * @param control The control.
 * @returns Whether it carries `checked`.
 */
const isChecked = (control: Element): boolean => attribute(control, "checked") !== undefined;

/**
 * What a candidate gives one response: the choices to select, by identifier, or the text to type.
 */
type Answer = { readonly choose: readonly string[] } | { readonly type: string };

/**
 * Give the keys that, with focus on a stop, give its response the answer: Space or arrows on a
 * radio group, Space on a checkbox whose state must change, the text typed into an empty text
 * control, and nothing at a stop no answer names.
 *
 * @param page The page.
 * @param stop The focused stop.
 * @param answers The answers, keyed by the entry name their Controls post under.
 * @returns The keys.
 */
const answerAt = (
  page: Element,
  stop: Element,
  answers: ReadonlyMap<string, Answer>,
): readonly Key[] => {
  const name = attribute(stop, "name") ?? "";
  const answer = answers.get(name);
  if (answer === undefined) {
    return [];
  }

  if ("type" in answer) {
    const held = stop.tag === "textarea" ? "" : (attribute(stop, "value") ?? "");

    assert.strictEqual(held, "", `${name} is empty before the candidate types`);

    return [{ type: answer.type }];
  }

  if (inputType(stop) === "checkbox") {
    return answer.choose.includes(attribute(stop, "value") ?? "") === isChecked(stop)
      ? []
      : ["Space"];
  }

  const group = elementsOf([page]).filter((control) => attribute(control, "name") === name);
  const target = group.findIndex((control) => attribute(control, "value") === answer.choose[0]);
  const from = group.findIndex(isChecked);

  assert.isAtLeast(target, 0, `${name} presents ${answer.choose.join(", ")}`);
  if (from === -1) {
    return target === 0 ? ["Space"] : Array.from({ length: target }, (): Key => "ArrowDown");
  }

  return Array.from(
    { length: (target - from + group.length) % group.length },
    (): Key => "ArrowDown",
  );
};

/**
 * Walk a page by keys: Tab from before the first stop through every stop in turn, answering at
 * each, to the submit button `pressed` picks, and Enter there. The page holds no `autofocus`, so
 * focus starts on nothing.
 *
 * The walk does not post the submitter's own entry, so it is added as the browser adds it: the
 * pressed button's name and value.
 *
 * @param page The page.
 * @param answers The answers, keyed by the entry name their Controls post under.
 * @param pressed Picks the submit button to press.
 * @returns The entries the form posts.
 */
const post = (
  page: Element,
  answers: ReadonlyMap<string, Answer>,
  pressed: (button: Element) => boolean,
): readonly Entry[] => {
  const stops = tabOrder(page);
  const target = stops.findIndex(
    (stop) => (attribute(stop, "type") ?? "submit") === "submit" && pressed(stop),
  );
  const button = stops[target] ?? assert.fail("the button to press is not an enabled stop");

  assert.isTrue(
    elementsOf([page]).every((element) => attribute(element, "autofocus") === undefined),
    "the page holds no autofocus",
  );

  const keys: readonly Key[] = [
    ...stops
      .slice(0, target)
      .flatMap((stop): readonly Key[] => ["Tab", ...answerAt(page, stop, answers)]),
    "Tab",
    "Enter",
  ];
  const entries = Option.getOrElse(keyboardWalk(page, keys), () =>
    assert.fail("the keys never submit the form"),
  );
  const submitter = attribute(button, "name");

  return submitter === undefined
    ? entries
    : [...entries, [submitter, attribute(button, "value") ?? ""] as const];
};

/**
 * Decode the responses a post carries for one item instance: its own entries, partitioned by the
 * instance, each response decoded through `postings`.
 *
 * @param redacted The item.
 * @param itemInstance The item instance.
 * @param entries The posted entries.
 * @returns Each posted response's value.
 */
const responsesOf = (
  redacted: Redacted,
  itemInstance: string,
  entries: readonly Entry[],
): Responses => {
  const { own } = partition(entries, itemInstance);

  return Object.fromEntries(
    postings(redacted, itemInstance).map(({ binding, identifier, options }) => [
      identifier,
      ok(decode(own, binding, options), `decode ${identifier}`),
    ]),
  );
};

/**
 * A test session as a host keeps it between requests, with the delivery it runs on and how many
 * transitions it has made, which sets the clock.
 */
interface Sitting {
  readonly delivery: Delivery;
  readonly session: TestSession;
  readonly transitions: number;
}

/**
 * Check that a session restores from its stored form alone: written, sent through JSON, decoded
 * against its test, and composed with a host configuration whose seed differs from the one the
 * session started with, it gives the session and its page byte for byte; each item's stored record
 * restores its responses.
 *
 * @param delivery The delivery.
 * @param session The session.
 * @param state The page state, for a failure's message.
 */
const assertRestores = (delivery: Delivery, session: TestSession, state: string) => {
  const stored = ok(encodeSession(session), "encodeSession");
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- A host keeps the session as JSON text, so it goes through JSON's own writer and reader; a structured clone would carry values JSON cannot.
  const handedBack: unknown = JSON.parse(JSON.stringify(stored));
  const restored = ok(decodeSession(handedBack, delivery.test), "decodeSession");
  const reseeded: Configuration = { ...delivery.configuration, seed: otherSeed };
  const before = sessionPage(delivery, session, delivery.configuration, state);
  const after = sessionPage(delivery, restored, reseeded, `${state}, restored`);

  assert.deepStrictEqual(restored, session, `${state}: the stored session decodes to itself`);
  assert.strictEqual(after.swapped, before.swapped, `${state}: the restored page is byte-equal`);
  assert.strictEqual(after.plain, before.plain, `${state}: the restored navigation is byte-equal`);
  for (const [index, item] of stored.items.entries()) {
    assert.deepStrictEqual(
      ok(restore(item.record), "restore").values,
      session.items[index]?.record.responses,
      `${state}: item ${String(index + 1)}'s stored record restores its responses`,
    );
  }
};

/**
 * Check one state of a session: its page passes `checkTree` with the navigation unswapped and
 * swapped, criterion 1 holds on its item, it restores from its stored form, and each item whose
 * attempt the last transition processed renders, after the attempt, with criterion 1 holding and
 * `checkTree` passing.
 *
 * @param delivery The delivery.
 * @param before The session before the transition, the same session at the start.
 * @param after The session now.
 * @param state The page state, for a failure's message.
 */
const inspect = (delivery: Delivery, before: TestSession, after: TestSession, state: string) => {
  const shown = sessionPage(delivery, after, delivery.configuration, state);

  checked(shown.plain, `${state}, unswapped`);
  checked(shown.swapped, `${state}, swapped`);
  assertRestores(delivery, after, state);
  for (const item of after.items) {
    const was = before.items[item.sequenceIndex - 1]?.record.numAttempts ?? 0;
    if (item.record.numAttempts > was) {
      const view = ok(
        itemView(delivery.test, after, delivery.configuration, item.sequenceIndex),
        "itemView",
      );
      const attempt = `${state}, item ${String(item.sequenceIndex)} after its attempt`;

      checked(pageHtml(answeringHtml(delivery, view, attempt), true), attempt);
    }
  }
};

/**
 * Start a session of a delivery and check its first page.
 *
 * @param delivery The delivery.
 * @returns The sitting.
 */
const begin = (delivery: Delivery): Sitting => {
  const session = ok(
    startTest(delivery.test, delivery.items, delivery.configuration, {
      instance,
      now: new Date(startedAt),
    }),
    "startTest",
  );

  inspect(delivery, session, session, "the first page");

  return { delivery, session, transitions: 0 };
};

/**
 * Take one step of a sitting as a candidate does: compose the current item's page, walk it by keys
 * answering each named response, press the navigation button that posts `intent`, decode the
 * intent and the item's responses from what the form posted, and carry the step out with
 * `advance`; then check the state it leads to.
 *
 * @param sitting The sitting.
 * @param intent The intent of the button the candidate presses.
 * @param answers The answers to give the current item, by response identifier.
 * @returns The sitting after the step.
 */
const step = (
  sitting: Sitting,
  intent: Intent,
  answers: Readonly<Record<string, Answer>> = {},
): Sitting => {
  const { delivery, session } = sitting;
  const state = `step ${String(sitting.transitions + 1)} (${encodeIntent(intent)})`;
  const shown = sessionPage(delivery, session, delivery.configuration, state);
  const view = Option.getOrElse(shown.view, () => assert.fail(`${state}: the test has closed`));
  const { redacted } = itemOf(delivery, view);
  const named = new Map(
    Object.entries(answers).map(([response, answer]) => [
      entryName(view.instance, response),
      answer,
    ]),
  );
  const entries = post(
    rootOf(shown.swapped),
    named,
    (button) => attribute(button, "value") === encodeIntent(intent),
  );
  const posted = Option.getOrElse(decodeIntent(entries, session.instance), () =>
    assert.fail(`${state}: the post carries no intent`),
  );

  assert.deepStrictEqual(posted, intent, `${state}: the pressed button posts its intent`);

  const carried: Step = view.disabled
    ? { intent: posted }
    : { intent: posted, responses: responsesOf(redacted, view.instance, entries) };
  const transitions = sitting.transitions + 1;
  const after = ok(
    advance(delivery.test, delivery.items, session, carried, delivery.configuration, {
      now: new Date(startedAt + tick * transitions),
    }),
    `${state}: advance`,
  );

  inspect(delivery, session, after, state);

  return { delivery, session: after, transitions };
};

/**
 * Give an item's `SCORE` as its record holds it.
 *
 * @param session The session.
 * @param sequenceIndex The item's sequence index.
 * @returns The score's values, none when the item declares no `SCORE` or it is NULL.
 */
const scoreOf = (session: TestSession, sequenceIndex: number): readonly unknown[] =>
  session.items[sequenceIndex - 1]?.record.outcomes["SCORE"]?.values.map(
    (single) => single.value,
  ) ?? [];

/**
 * Check a closed session's review and solution: each item renders in review when it permits review
 * and in solution when it permits its solution, criterion 1 holds on each render, and each passes
 * `checkTree`. Review shows the responses `restore` gives back from the item's stored record, and
 * solution the correct responses `solution` gives.
 *
 * @param delivery The delivery.
 * @param session The session, closed.
 * @returns Each item's permissions, in sequence.
 */
const assertClosedPages = (delivery: Delivery, session: TestSession) => {
  const shown = ok(current(delivery.test, session, delivery.configuration), "current");
  const stored = ok(encodeSession(session), "encodeSession");

  assert.strictEqual(shown.kind, "summary", "the closed session shows its summary");

  return session.items.map((item) => {
    const allowed = ok(permits(delivery.test, session, item.sequenceIndex), "permits");
    const view = ok(
      itemView(delivery.test, session, delivery.configuration, item.sequenceIndex),
      "itemView",
    );
    const { accepted, redacted } = itemOf(delivery, view);
    const record =
      stored.items[item.sequenceIndex - 1]?.record ?? assert.fail("the stored session lacks it");
    const { values } = ok(restore(record), "restore");
    const label = `item ${String(item.sequenceIndex)}`;

    assert.deepStrictEqual(values, view.values, `${label}: restore gives the values it shows`);
    if (allowed.review) {
      const { html } = ok(
        render(redacted, view.configuration, { instance: view.instance, mode: "review", values }),
        "render review",
      );

      assertNoAnswer(accepted, html, values, `${label} in review`);
      checked(pageHtml(html, false), `${label} in review`);
    }

    if (allowed.solution) {
      const correct = solution(accepted);
      const { html } = ok(
        render(redacted, view.configuration, {
          instance: view.instance,
          mode: "solution",
          values: correct,
        }),
        "render solution",
      );

      assertNoAnswer(accepted, html, correct, `${label} in solution`);
      checked(pageHtml(html, false), `${label} in solution`);
    }

    return allowed;
  });
};

/**
 * One variable of a result, as the witness reads it: its attributes and its values, unescaped.
 */
interface ReportedVariable {
  readonly attributes: Readonly<Record<string, string>>;
  readonly values: readonly string[];
}

/**
 * One `itemResult` or `testResult`: its attributes and its variables by identifier.
 */
interface ReportedResult {
  readonly attributes: Readonly<Record<string, string>>;
  readonly variables: ReadonlyMap<string, ReportedVariable>;
}

/**
 * Read an XML text back from its escaped form.
 *
 * @param text The text, as the writer escaped it.
 * @returns The text.
 */
const unescaped = (text: string): string =>
  text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");

/**
 * Read the attributes of a start tag.
 *
 * @param tag The text between the element's name and the end of its start tag.
 * @returns The attributes.
 */
const attributesOf = (tag: string): Readonly<Record<string, string>> =>
  Object.fromEntries(
    Array.from(tag.matchAll(/(?<name>[\w:-]+)="(?<value>[^"]*)"/gu), (match) => [
      match.groups?.["name"] ?? "",
      unescaped(match.groups?.["value"] ?? ""),
    ]),
  );

/**
 * Read the results a document writes, by element name: each `itemResult` and the `testResult`, with
 * their response and outcome variables.
 *
 * @param xml The `assessmentResult` document.
 * @param element `itemResult` or `testResult`.
 * @returns The results, in document order.
 */
const resultsIn = (xml: string, element: "itemResult" | "testResult"): readonly ReportedResult[] =>
  Array.from(
    xml.matchAll(
      new RegExp(`<${element}\\b(?<tag>[^>]*?)(?:/>|>(?<body>[\\s\\S]*?)</${element}>)`, "gu"),
    ),
    (match) => ({
      attributes: attributesOf(match.groups?.["tag"] ?? ""),
      variables: new Map(
        Array.from(
          (match.groups?.["body"] ?? "").matchAll(
            /<(?<kind>responseVariable|outcomeVariable)\b(?<tag>[^>]*?)(?:\/>|>(?<body>[\s\S]*?)<\/\k<kind>>)/gu,
          ),
          (variable) => {
            const attributes = attributesOf(variable.groups?.["tag"] ?? "");

            return [
              attributes["identifier"] ?? "",
              {
                attributes,
                values: Array.from(
                  (variable.groups?.["body"] ?? "").matchAll(/<value>(?<text>[^<]*)<\/value>/gu),
                  (value) => unescaped(value.groups?.["text"] ?? ""),
                ),
              },
            ] as const;
          },
        ),
      ),
    }),
  );

/**
 * The digits a result writes an integer in, exactly (reading 45).
 */
const integerForm = /^(?:0|-?[1-9]\d*)$/u;

/**
 * The form a result writes a double in, as the shortest round trip: a finite decimal with an
 * optional exponent, `INF`, `-INF` or `NaN`.
 */
const doubleForm = /^(?:-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?|INF|-INF|NaN)$/u;

/**
 * Write a completed session's results, check them against the Results XSD with the oracle, and
 * check the value forms the XSD cannot: each built-in in its form, each item's responses and
 * `SCORE` as given.
 *
 * @param sitting The completed sitting.
 * @param expected Each item's responses and score as the result writes them, by item ref.
 * @returns Each item result, by item ref.
 */
const assertResults = Effect.fnUntraced(function* assertResults(
  sitting: Sitting,
  expected: Readonly<
    Record<string, { readonly response: readonly string[]; readonly score: readonly string[] }>
  >,
) {
  const { delivery, session } = sitting;
  const xml = ok(
    results({
      context: {
        sessions: [{ identifier: `s-${instance}`, sourceId: "http://localhost:5190/" }],
      },
      items: delivery.items,
      kind: "test",
      session: ok(encodeSession(session), "encodeSession"),
      test: delivery.test,
    }),
    "results",
  );
  const verdict = yield* validateAgainst(resultsXsd, xml);

  assert.isTrue(verdict.valid, verdict.messages.join("\n"));

  const [test, ...more] = resultsIn(xml, "testResult");
  assert.lengthOf(more, 0, "one testResult");
  assert.strictEqual(test?.attributes["identifier"], delivery.test.test.identifier);
  assert.match(test?.variables.get("duration")?.values[0] ?? "", doubleForm, "the test's duration");

  const items = new Map(
    resultsIn(xml, "itemResult").map(
      (item) => [item.attributes["identifier"] ?? "", item] as const,
    ),
  );

  assert.deepStrictEqual(
    [...items.keys()],
    session.items.map((item) => item.ref),
  );
  for (const [ref, want] of Object.entries(expected)) {
    const item = items.get(ref) ?? assert.fail(`no itemResult for ${ref}`);

    assert.match(
      item.variables.get("numAttempts")?.values[0] ?? "",
      integerForm,
      `${ref}: numAttempts`,
    );
    assert.match(item.variables.get("duration")?.values[0] ?? "", doubleForm, `${ref}: duration`);
    assert.include(
      ["completed", "incomplete", "not_attempted", "unknown"],
      item.variables.get("completionStatus")?.values[0],
      `${ref}: completionStatus`,
    );
    assert.sameOrderedMembers(
      [...(item.variables.get("RESPONSE")?.values ?? [])],
      [...want.response],
      `${ref}: RESPONSE`,
    );
    assert.deepStrictEqual(item.variables.get("SCORE")?.values ?? [], want.score, `${ref}: SCORE`);
  }

  return items;
});

/**
 * One step of a script: the intent of the button the candidate presses, and the answers they give
 * the current item first, by response identifier.
 */
type Script = readonly (readonly [Intent, Readonly<Record<string, Answer>>])[];

/**
 * Start a session of a delivery and take a script's steps in turn.
 *
 * @param delivery The delivery.
 * @param script The steps.
 * @returns The sitting at the start and after each step.
 */
const walk = (delivery: Delivery, script: Script): readonly Sitting[] => {
  let sitting = begin(delivery);
  const taken = [sitting];
  for (const [intent, answers] of script) {
    sitting = step(sitting, intent, answers);
    taken.push(sitting);
  }

  return taken;
};

/**
 * Give where a walk stood after each step: the sequence index of the item shown, or `closed`.
 *
 * @param sittings The sittings a walk took.
 * @returns After each step, the item shown or `closed`.
 */
const placesOf = (sittings: readonly Sitting[]): readonly (number | "closed")[] =>
  sittings
    .slice(1)
    .map(({ session }) => (session.status === "closed" ? "closed" : session.position + 1));

/**
 * The last sitting of a walk.
 *
 * @param sittings The sittings a walk took.
 * @returns The last.
 */
const lastOf = (sittings: readonly Sitting[]): Sitting =>
  sittings.at(-1) ?? assert.fail("the walk took no sitting");

/**
 * Give the values a page's Controls of one response post, in the order the page presents them.
 *
 * @param sitting The sitting, whose page shows the item.
 * @param response The response identifier.
 * @returns The Controls' values.
 */
const presentedOf = (sitting: Sitting, response: string): readonly string[] => {
  const { delivery, session } = sitting;
  const shown = sessionPage(delivery, session, delivery.configuration, "a presented order");
  const view = Option.getOrElse(shown.view, () => assert.fail("the test has closed"));
  const name = entryName(view.instance, response);

  return elementsOf([rootOf(shown.swapped)]).flatMap((control) =>
    attribute(control, "name") === name ? [attribute(control, "value") ?? ""] : [],
  );
};

/**
 * The intents the scripts press most.
 */
const next: Intent = { kind: "next" };

const previous: Intent = { kind: "previous" };

const submitItem: Intent = { kind: "submit-item" };

const submitPart: Intent = { kind: "submit-part" };

describe("the M2 witness: the packages a test is delivered from", () => {
  it.effect(
    "[P-1] [P-4] openPackage gives each package its verdict: the fixture and BegGuide_March2025 accepted, CASE accepted with unsupported features, and test_package_minfiles, lti, testWithLti, sample_pci and pci_item_examples refused by their rules",
    () =>
      Effect.gen(function* verdicts() {
        const fixture = yield* openFixture();
        const fixtureTest = acceptedOf(fixture).tests.get(`${fixtureLocation}/test.xml`);

        assert.strictEqual(fixture.verdict, "accepted");
        assert.deepStrictEqual(
          itemRefs(fixtureTest?.test ?? assert.fail("the fixture holds no test.xml")).map(
            (entry) => entry.identifier,
          ),
          [
            "p1-single-choice",
            "p1-text-entry",
            "p1-multiple-choice",
            "p2-extended-text",
            "p2-choice",
          ],
        );

        const begGuide = yield* openCorpusPackage(corpusPackages.begGuide);
        const bgTest = acceptedOf(begGuide).tests.get(`${corpusPackages.begGuide}/BGtest.xml`);

        assert.strictEqual(begGuide.verdict, "accepted");
        assert.lengthOf([...(bgTest?.items.keys() ?? [])], 6, "BGtest.xml resolves six items");

        const caseVerdict = yield* openCorpusPackage(corpusPackages.case);

        assert.strictEqual(caseVerdict.verdict, "accepted-with-unsupported");
        assert.isTrue(
          acceptedOf(caseVerdict).tests.has(`${corpusPackages.case}/testitems/-TX_G06SAMP_000.xml`),
        );

        const minFiles = yield* openCorpusPackage(corpusPackages.minFiles);

        // Its adaptive item sets `completion_status`, which it never declares and which is not the
        // built-in `completionStatus` (info.txt:8488), so the package is refused for that item while
        // its test and its hotspot item are accepted with their unsupported features marked.
        assert.deepStrictEqual(refusalsOf(minFiles), [
          ["undeclared-variable", "example/adaptive.xml"],
          ["undeclared-variable", "example/adaptive.xml"],
        ]);
        assert.deepStrictEqual(
          ["RTEST-02", "hotspot", "adaptiveTemplate"].map((identifier) =>
            documentVerdict(minFiles, identifier),
          ),
          ["accepted-with-unsupported", "accepted-with-unsupported", "refused"],
        );

        for (const directory of [corpusPackages.lti, corpusPackages.testWithLti]) {
          const lti = yield* openCorpusPackage(directory);

          assert.isNotEmpty(refusalsOf(lti), `${directory} is refused`);
          if (lti.verdict === "refused") {
            for (const refusal of lti.refusals) {
              assert.strictEqual(refusal.rule, "attribute-type", directory);
              assert.strictEqual(refusal.detail["value"], "imslti_xmlv1p1", directory);
              assert.strictEqual(refusal.detail["schemaversion"], "3.0.0", directory);
            }
          }
        }

        assert.deepStrictEqual(refusalsOf(yield* openCorpusPackage(corpusPackages.samplePci)), [
          ["not-qti3-package", "imsmanifest.xml"],
        ]);

        const pciRules = refusalsOf(yield* openCorpusPackage(corpusPackages.pciItems)).map(
          ([rule]) => rule,
        );

        assert.includeMembers(pciRules, ["package-file-unlisted", "package-file-missing"]);
      }),
    sessionTimeoutMs,
  );
});

describe("the M2 witness: a full session per mode combination, walked by keys through a test-built form; after every transition the session restores byte for byte from its stored form under another seed, and every page shows no answer and passes checkTree, its navigation unswapped and swapped; the completed session's review, solution and results", () => {
  it.effect(
    "[T-4] [T-7] [T-14] [S-0] [S-7] [keyboard] BGtest.xml, nonlinear and individual: each item answered by keys and submitted alone, Previous and an item button move between items, End part closes the test, and the scores are 1, 1, 1, 0, 1 and 0",
    () =>
      Effect.gen(function* begGuideSession() {
        const configuration = yield* configure({ seed: hostSeed });
        const delivery = deliveryOf(
          yield* openCorpusPackage(corpusPackages.begGuide),
          "BGtest.xml",
          configuration,
        );
        const essay = "Tea & toast,\nthen the walk";
        const sittings = walk(delivery, [
          [submitItem, { RESPONSE: { choose: ["A"] } }],
          [next, {}],
          [submitItem, { RESPONSE: { choose: ["true"] } }],
          [previous, {}],
          [{ kind: "go", sequenceIndex: 3 }, {}],
          [submitItem, { RESPONSE: { choose: ["A", "C", "D"] } }],
          [next, {}],
          [submitItem, { RESPONSE: { type: essay } }],
          [next, {}],
          [submitItem, { RESPONSE: { type: "York" } }],
          [next, {}],
          [submitItem, { RESPONSE: { type: "A crow" } }],
          [{ kind: "end-part" }, {}],
        ]);
        const { session } = lastOf(sittings);

        assert.deepStrictEqual(placesOf(sittings), [1, 2, 2, 1, 3, 3, 4, 4, 5, 5, 6, 6, "closed"]);
        assert.deepStrictEqual(
          session.items.map((item) => scoreOf(session, item.sequenceIndex)),
          [[1], [1], [1], [0], [1], [0]],
        );
        assert.deepStrictEqual(
          assertClosedPages(delivery, session).map((allowed) => allowed.review),
          [true, true, true, true, true, true],
        );
        yield* assertResults(lastOf(sittings), {
          beginnersguide007: { response: ["true"], score: ["1"] },
          beginnersguide008: { response: ["A", "C", "D"], score: ["1"] },
          beginnersguide009: { response: [essay], score: ["0"] },
          beginnersguide010: { response: ["York"], score: ["1"] },
          beginnersguide011: { response: ["A crow"], score: ["0"] },
          firstexample: { response: ["A"], score: ["1"] },
        });
      }),
    sessionTimeoutMs,
  );
  it.effect(
    "[T-4] [T-7] [T-14] [S-0] [S-7] [keyboard] CASE, linear and individual with max-attempts 2: a wrong first attempt scores 0 and leaves the item open, the second scores 1, Next submits each later item, the last Next closes the test, and the scores are 1, 1 and 1",
    () =>
      Effect.gen(function* caseSession() {
        const configuration = yield* configure({ seed: hostSeed });
        const delivery = deliveryOf(
          yield* openCorpusPackage(corpusPackages.case),
          "testitems/-TX_G06SAMP_000.xml",
          configuration,
        );
        const sittings = walk(delivery, [
          [submitItem, { RESPONSE: { choose: ["A_0"] } }],
          [submitItem, { RESPONSE: { choose: ["A_2"] } }],
          [next, {}],
          [next, { RESPONSE: { choose: ["A_1"] } }],
          [next, { RESPONSE: { choose: ["A_3"] } }],
        ]);
        const first = sittings[1] ?? assert.fail("the walk took no first step");
        const { session } = lastOf(sittings);

        assert.deepStrictEqual(placesOf(sittings), [1, 1, 2, 3, "closed"]);
        assert.deepStrictEqual(scoreOf(first.session, 1), [0], "the wrong first attempt scores 0");
        assert.isFalse(
          ok(itemView(delivery.test, first.session, configuration, 1), "itemView").disabled,
          "one attempt of two leaves the item open",
        );
        assert.deepStrictEqual(
          session.items.map((item) => [
            item.record.numAttempts,
            scoreOf(session, item.sequenceIndex),
          ]),
          [
            [2, [1]],
            [1, [1]],
            [1, [1]],
          ],
        );
        assertClosedPages(delivery, session);
        yield* assertResults(lastOf(sittings), {
          "res_-TX_G06SAMP_001": { response: ["A_2"], score: ["1"] },
          "res_-TX_G06SAMP_004": { response: ["A_1"], score: ["1"] },
          "res_-TX_G06SAMP_005": { response: ["A_3"], score: ["1"] },
        });
      }),
    sessionTimeoutMs,
  );

  it.effect(
    "[T-4] [T-7] [T-11] [T-14] [S-0] [S-7] [keyboard] the fixture's two parts, P1 nonlinear and simultaneous then P2 linear and simultaneous: answers saved by Next, Previous and an item button, each part submitted whole, the shuffled Choice restored in its order, and the scores are 1, 1, 2, none and 1",
    () =>
      Effect.gen(function* fixtureSession() {
        const configuration = yield* configure({ seed: hostSeed });
        const delivery = deliveryOf(yield* openFixture(), "test.xml", configuration);
        const essay = "I added each pair twice, once in each order.";
        const sittings = walk(delivery, [
          [next, { RESPONSE: { choose: ["B"] } }],
          [previous, { RESPONSE: { type: "Seven" } }],
          [{ kind: "go", sequenceIndex: 3 }, {}],
          [submitPart, { RESPONSE: { choose: ["A", "C"] } }],
          [next, { RESPONSE: { type: essay } }],
          [submitPart, { RESPONSE: { choose: ["A"] } }],
        ]);
        const onShuffled = sittings[3] ?? assert.fail("the walk never reached item 3");
        const presented = presentedOf(onShuffled, "RESPONSE");
        const { session } = lastOf(sittings);

        assert.deepStrictEqual(placesOf(sittings), [2, 1, 3, 4, 5, "closed"]);
        assert.deepStrictEqual(presented, ["C", "B", "A", "D"], "the host's seed shuffles it");
        assert.deepStrictEqual(
          session.parts.map((part) => [part.identifier, part.status]),
          [
            ["P1", "ended"],
            ["P2", "ended"],
          ],
        );
        assert.deepStrictEqual(
          session.items.map((item) => scoreOf(session, item.sequenceIndex)),
          [[1], [1], [2], [], [1]],
        );
        assert.deepStrictEqual(
          assertClosedPages(delivery, session).slice(0, 3),
          [
            { review: true, solution: true },
            { review: true, solution: true },
            { review: true, solution: true },
          ],
          "P1 allows review and shows its solutions",
        );

        const items = yield* assertResults(lastOf(sittings), {
          "p1-multiple-choice": { response: ["C", "A"], score: ["2"] },
          "p1-single-choice": { response: ["B"], score: ["1"] },
          "p1-text-entry": { response: ["Seven"], score: ["1"] },
          "p2-choice": { response: ["A"], score: ["1"] },
          "p2-extended-text": { response: [essay], score: [] },
        });

        assert.strictEqual(
          items.get("p1-multiple-choice")?.variables.get("RESPONSE")?.attributes["choiceSequence"],
          presented.join(" "),
          "the result names the order the candidate saw",
        );
      }),
    sessionTimeoutMs,
  );
});

describe("the M2 witness: OD-2, two item instances in one form", () => {
  it.effect(
    "[keyboard] OD-2: two items of one session share a test-built form, and partition keeps each item's entries apart, so each decodes and scores its own",
    () =>
      Effect.gen(function* twoInstances() {
        const configuration = yield* configure({ seed: hostSeed });
        const delivery = deliveryOf(yield* openFixture(), "test.xml", configuration);
        const { session } = begin(delivery);
        const first = ok(itemView(delivery.test, session, configuration, 1), "itemView");
        const second = ok(itemView(delivery.test, session, configuration, 2), "itemView");

        const page = checked(
          pageHtml(
            `${answeringHtml(delivery, first, "two items")}${answeringHtml(delivery, second, "two items")}<button type="submit">Save both</button>`,
            true,
          ),
          "two items in one form",
        );
        const choice = entryName(first.instance, "RESPONSE");
        const text = entryName(second.instance, "RESPONSE");
        const entries = post(
          page,
          new Map<string, Answer>([
            [choice, { choose: ["B"] }],
            [text, { type: "seven" }],
          ]),
          (button) => attribute(button, "name") === undefined,
        );

        assert.deepStrictEqual(partition(entries, first.instance), {
          foreign: [[text, "seven"]],
          host: [],
          own: [[choice, "B"]],
        });
        assert.deepStrictEqual(partition(entries, second.instance), {
          foreign: [[choice, "B"]],
          host: [],
          own: [[text, "seven"]],
        });
        for (const view of [first, second]) {
          const { accepted, redacted } = itemOf(delivery, view);
          const record = ok(
            score(accepted, responsesOf(redacted, view.instance, entries)),
            `score ${view.ref}`,
          );

          assert.deepStrictEqual(
            record.outcomes["SCORE"]?.values.map((single) => single.value),
            [1],
            `${view.ref} scores its own response`,
          );
        }
      }),
    sessionTimeoutMs,
  );
});
