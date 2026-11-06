/**
 * The dev playground's test sessions (spec P4-25): a package page's Start button posts to
 * `/packages/<id>/tests`, which starts a session of that test and stores it, and each session has
 * one page, `/sessions/<sid>`, which shows the current item in the playground's own form and takes
 * the form's posts.
 *
 * The library builds no form and no flow (rule `a9d04969`), so this module composes them, as an
 * example host would. The session page holds `render(redact(item))` with the current item's
 * instance, configuration, values and disabled state, then the playground's Save button, then
 * `renderNavigation` with each navigation button swapped for the playground's own submit button
 * (rule `9af3809b`), so every step is a native post with no script. A post is decoded through the
 * current item's own bindings, its intent through `decodeIntent`, and carried out with `advance`;
 * what `advance` accepts is stored and answered with a 303 back to the page, and what it refuses is
 * answered on the item it was posted from. A closed test's page is the summary `summaryPage`
 * builds. The store holds each session only in its stored form, so every request decodes it
 * against its test, as a host that keeps sessions elsewhere would.
 *
 * One URL per session: the browser's Back re-requests it and shows the item the stored session
 * makes current, so only the test's own Previous moves back. Every page carries the frame's
 * headers, which say `no-store`, and the form carries `autocomplete="off"`, so a browser restores
 * no Choice control's checked state over what the store holds (spec §4.7).
 *
 * The route returns the frame's {@link Page} for every HTML answer, so the playground's handler
 * writes it with the stylesheets, the theme box and the page headers, and a `Response` only for a
 * redirect. Every page is built through `h`, so a test's and an item's titles are escaped.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
import { DateTime, Effect, Option, Result } from "effect";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import type { InvalidSession } from "#plate/codec/session.ts";
import type { Configuration } from "#plate/configuration.ts";
import { page, pageHeaders, slot } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { packageAssetBase, packageIds, testField } from "#plate/dev/packages.ts";
import type { PackageCache, PackageEntry, PackagesFailure } from "#plate/dev/packages.ts";
import { summaryPage } from "#plate/dev/review-page.ts";
import { newSessionId } from "#plate/dev/store.ts";
import type { SessionEntry, SessionStore } from "#plate/dev/store.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import type { PartOf, PartOverrides } from "#plate/emit/parts.ts";
import { decode, entryName, isPosted, Malformed, partition } from "#plate/form/encoding.ts";
import type { Binding, DecodeOptions, Entry } from "#plate/form/encoding.ts";
import { decodeIntent, encodeIntent, intentName } from "#plate/form/intent.ts";
import { message, numeral } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Value } from "#plate/model/values.ts";
import { navigationState, renderNavigation } from "#plate/navigation.ts";
import type { NavigationState } from "#plate/navigation.ts";
import type { PackageTest } from "#plate/package/open.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import { redact, render, renderStatus } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { checkResponses } from "#plate/responses.ts";
import { advance } from "#plate/session/advance.ts";
import type { AdvanceFailure, IntentRefused } from "#plate/session/advance.ts";
import type { Responses, Step, TestSession } from "#plate/session/session.ts";
import { current, startTest } from "#plate/session/start.ts";
import type { ItemView } from "#plate/session/start.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * What the session pages read and write: the playground's configuration, its packages and its
 * sessions.
 *
 * `configuration` is the playground's decoded configuration: every session starts and advances
 * with it, and `current` writes each item's session control into it. It is the configuration the
 * review routes read, so one object serves both.
 */
export interface SessionPlayground {
  readonly configuration: Configuration;
  readonly packages: PackageCache;
  readonly sessions: SessionStore;
}

/**
 * One request the session routes take: a package's Start post, by the package's id, or a session's
 * page, by its id; each id still percent-encoded.
 */
type Target =
  | { readonly id: string; readonly kind: "session" }
  | { readonly id: string; readonly kind: "start" };

/**
 * One stored session with everything its page reads: its id, its store entry, its package, its
 * test with the items it was started with, and the session decoded against that test.
 */
interface Sitting {
  readonly entry: SessionEntry;
  readonly id: string;
  readonly package: PackageEntry;
  readonly session: TestSession;
  readonly test: PackageTest;
}

/**
 * What one session page shows of its item besides the item: the state its title names, the Status
 * part's input when the page answers a refused post, and `render`'s view options.
 */
interface Shown {
  readonly options: Pick<Options, "messages" | "posted" | "values">;
  readonly state: "answering" | "notAccepted";
  readonly status: Option.Option<StatusInput>;
}

/**
 * How one response travels through the session form: its identifier, its binding under the item
 * instance's entry name, and the number base its Controls post in.
 */
interface Posting {
  readonly binding: Binding;
  readonly options: DecodeOptions;
  readonly response: string;
}

/**
 * What one post carries for the current item: each posted response decoded, the strings posted
 * for each, and the responses whose entries do not decode.
 */
interface Post {
  readonly decoded: Readonly<Record<string, Malformed | Value>>;
  readonly malformed: ReadonlySet<string>;
  readonly posted: Readonly<Record<string, readonly string[]>>;
}

/**
 * The navigation parts that are buttons: each is swapped for the playground's submit button.
 */
const navigationButtons = [
  "previous",
  "next",
  "itemButton",
  "submit",
  "end",
] as const satisfies readonly PartOf<"test-navigation">[];

/**
 * The id of a session page's heading, which names the session form.
 */
const titleId = "playground-title";

/**
 * The segment a refusal that concerns no single response is keyed under among the Status part's
 * messages, so its message's id is `<item instance>-intent-message-0`. The page renders the item
 * with no messages then, so no Control's `aria-describedby` names it and no Control is marked
 * invalid.
 */
const intentSegment = "intent";

/**
 * Read a request's path as a session route's target.
 *
 * @param pathname The request's path.
 * @returns `/packages/<id>/tests` as a Start post and `/sessions/<sid>` as a session's page, each
 *   with a non-empty id; none for any other path.
 */
const targetOf = (pathname: string): Option.Option<Target> => {
  const [root, base, id, view, ...rest] = pathname.split("/");
  if (root !== "" || id === undefined || id === "" || rest.length > 0) {
    return Option.none();
  }

  if (base === "packages" && view === "tests") {
    return Option.some({ id, kind: "start" });
  }

  return base === "sessions" && view === undefined
    ? Option.some({ id, kind: "session" })
    : Option.none();
};

/**
 * Say whether a path is one of the session routes, so the playground dispatches it to
 * {@link routeSessions}: a package's Start post, before the package routes, which answer that path
 * 404, and a session's page, after the review routes, which own the paths below it.
 *
 * @param pathname The request's path.
 * @returns Whether the path is `/packages/<id>/tests` or `/sessions/<sid>`, whatever the ids hold.
 */
export const sessionPath = (pathname: string): boolean => Option.isSome(targetOf(pathname));

/**
 * Give the path of a session's page, its id percent-encoded as one segment.
 *
 * @param id The session id.
 * @returns `/sessions/<sid>`.
 */
const sessionHref = (id: string): string => `/sessions/${encodeURIComponent(id)}`;

/**
 * Construct the 303 that sends a browser to a session's page after a post the page took, with the
 * page headers, so the page's address is the one the browser shows and re-requests.
 *
 * @param id The session id.
 * @returns The redirect.
 */
const seeSession = (id: string): Response =>
  new Response(null, { headers: { ...pageHeaders, location: sessionHref(id) }, status: 303 });

/**
 * The links at the end of every session page.
 */
const home: Element = h("p", {}, [
  h("a", { href: "/packages" }, [text("All packages")]),
  text(" · "),
  h("a", { href: "/" }, [text("All documents")]),
]);

/**
 * Construct a page that says one thing: a 404, a refused method or post, or a developer error.
 *
 * @param status The status code.
 * @param title The page's title and heading.
 * @param said What the page says, a developer error's message included.
 * @returns The page.
 */
const notePage = (status: number, title: string, said: string): Page =>
  page(status, "en", title, [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), home]);

/**
 * Construct the 404 page every refused session path answers with.
 *
 * @returns The 404 page.
 */
const notFound = (): Page =>
  notePage(404, "Not found", "No package test, or no session, is at this address.");

/**
 * Construct the page of a developer error: a failure the playground's own code or state caused,
 * reported with its message.
 *
 * @param error The failure.
 * @returns The 500 page.
 */
const failurePage = (error: { readonly message: string }): Page =>
  notePage(500, "Playground error", error.message);

/**
 * Construct the page a post whose body is not a form answers with.
 *
 * @returns The 400 page.
 */
const notAForm = (): Page =>
  notePage(400, "Not a form post", "The post's body is not a form; post the page's own form.");

/**
 * Read a post's body as form entries.
 *
 * @param request The post.
 * @returns The entries in posted order, or none when the body is not a form.
 */
const entriesOf = Effect.fnUntraced(function* entriesOf(
  request: Request,
): Effect.fn.Return<Option.Option<readonly Entry[]>> {
  const form = yield* Effect.result(
    // oxlint-disable-next-line typescript/no-deprecated -- The deprecation warns against parsing an untrusted server's multipart response; this is a post to the playground's own form, read on 127.0.0.1, and scripts/serve.ts caps its body at 1 MiB before the handler sees it.
    Effect.tryPromise(() => request.formData()),
  );

  return Result.isFailure(form)
    ? Option.none()
    : Option.some(Array.from(form.success, ([name, value]): Entry => [name, value]));
});

/**
 * Read the one text value posted under a name.
 *
 * @param entries The posted entries.
 * @param name The field's name.
 * @returns Its first value, or none when it is absent or a file.
 */
const fieldOf = (entries: readonly Entry[], name: string): Option.Option<string> =>
  Option.flatMap(Option.fromUndefinedOr(entries.find(([entry]) => entry === name)), ([, value]) =>
    value instanceof Blob ? Option.none() : Option.some(value),
  );

/**
 * Find the package at a location among the playground's packages, opening only the package whose
 * id that location gives.
 *
 * A package's id is its directory's name without `.zip.d`, or its whole location when another
 * package shares that name ({@link packageIds}), so the package is one of the two ids tried, and
 * the one whose location matches.
 *
 * @param packages The packages.
 * @param location The package's location, as `openPackage` names it.
 * @returns The package, or none when no package is at the location.
 */
const packageAt = Effect.fnUntraced(function* packageAt(
  packages: PackageCache,
  location: string,
): Effect.fn.Return<Option.Option<PackageEntry>, PackagesFailure> {
  for (const id of new Set([...packageIds([location]), location])) {
    const found = yield* packages.packageOf(id);
    if (Option.isSome(found) && found.value.location === location) {
      return found;
    }
  }

  return Option.none();
});

/**
 * Give the test at a path in a package.
 *
 * @param entry The package.
 * @param href The test's path from the package's root.
 * @returns The test with its items, or none when the package is not accepted or holds no test
 *   there.
 */
const testIn = (entry: PackageEntry, href: string): Option.Option<PackageTest> => {
  const { verdict } = entry;

  return verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? Option.fromUndefinedOr(verdict.accepted.tests.get(`${entry.location}/${href}`))
    : Option.none();
};

/**
 * Read a stored session with its package and test: the entry the store holds under the id, the
 * package at its location, the test at its href in that package, and the session decoded against
 * that test.
 *
 * An id the store does not hold is a 404. A package, test or session that does not fit the entry
 * is the playground's own fault, a developer error.
 *
 * @param playground The playground.
 * @param encoded The session id, as the request wrote it.
 * @returns The sitting, or the page that answers instead.
 */
const sittingOf = Effect.fnUntraced(function* sittingOf(
  playground: SessionPlayground,
  encoded: string,
): Effect.fn.Return<Result.Result<Sitting, Page>, PackagesFailure> {
  const decoded = Result.try(() => decodeURIComponent(encoded));
  const held = Result.isSuccess(decoded) ? playground.sessions.get(decoded.success) : Option.none();
  if (Result.isFailure(decoded) || Option.isNone(held)) {
    return Result.fail(notFound());
  }

  const id = decoded.success;
  const entry = held.value;
  const found = yield* packageAt(playground.packages, entry.packageLocation);
  if (Option.isNone(found)) {
    return Result.fail(
      failurePage({
        message: `Session ${id} names the package at ${entry.packageLocation}, which is not among the playground's packages. Start the session again from its package's page.`,
      }),
    );
  }

  const test = testIn(found.value, entry.testHref);
  if (Option.isNone(test)) {
    return Result.fail(
      failurePage({
        message: `Session ${id} names the test ${entry.testHref}, which the package at ${entry.packageLocation} does not hold as an accepted test (the package is ${found.value.verdict.verdict}). Start the session again from its package's page.`,
      }),
    );
  }

  return Result.mapBoth(decodeSession(entry.session, test.value.test), {
    onFailure: failurePage,
    onSuccess: (session): Sitting => ({
      entry,
      id,
      package: found.value,
      session,
      test: test.value,
    }),
  });
});

/**
 * Give the accepted item a session item delivers.
 *
 * @param sitting The session and its test.
 * @param ref The item ref's identifier.
 * @returns The item, or the developer error of a test that has no item for the ref.
 */
const itemOf = (sitting: Sitting, ref: string): Result.Result<Accepted, { message: string }> =>
  Result.fromOption(Option.fromUndefinedOr(sitting.test.items.get(ref)), () => ({
    message: `The test ${sitting.test.test.test.title.trim()} has no item for its item ref ${ref}. Restore the package at ${sitting.package.location}.`,
  }));

/**
 * Construct the playground's replacement for every navigation button: its own submit button,
 * named for the session's intent and posting the intent the button is handed (spec §4.10's
 * recipe). The swap keeps everything plate computed, `disabled` and `aria-current` included.
 *
 * @param instance The session's instance, the store's id.
 * @returns The part overrides.
 */
const submitButtons = (instance: string): PartOverrides => {
  /**
   * Make one navigation button the playground's submit button.
   *
   * @param props The attributes plate computed for the button.
   * @param children The button's label.
   * @returns A submit button named `intentName(instance)` whose value is its `data-intent`.
   */
  const submitting = (props: Attributes, children: readonly Node[]): Element =>
    h(
      "button",
      { name: intentName(instance), type: "submit", value: props["data-intent"] ?? "" },
      children,
    );

  return {
    "test-navigation": Object.fromEntries(navigationButtons.map((part) => [part, submitting])),
  };
};

/**
 * Construct the playground's Save button: a submit button that posts `go` to the current item, so
 * a press saves the responses and stays on the item. It stands before the navigation, so it is the
 * form's first submit button, the one HTML's implicit submission posts when Enter is pressed in a
 * text field: Enter saves and never moves the candidate. It is disabled exactly when the session
 * does not take that intent, as a navigation button is.
 *
 * @param state The navigation, whose allowed intents decide `disabled`.
 * @param view The current item.
 * @param instance The session's instance, the store's id.
 * @returns The button.
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
 */
const saveButton = (state: NavigationState, view: ItemView, instance: string): Element => {
  const value = encodeIntent({ kind: "go", sequenceIndex: view.sequenceIndex });

  return h(
    "button",
    {
      name: intentName(instance),
      type: "submit",
      value,
      ...when(!state.allowed.some((intent) => encodeIntent(intent) === value), {
        disabled: true,
      }),
    },
    [text("Save")],
  );
};

/**
 * Give the title a session page carries: `{state}: Item n of N, {test title}` (spec §4.11).
 *
 * @param view The current item, whose configuration gives the locale.
 * @param state The page's state.
 * @param testTitle The test's title.
 * @returns The title.
 */
const itemTitle = (view: ItemView, state: Shown["state"], testTitle: string): string => {
  const { locale } = view.configuration;
  const item = message(locale, "itemOf", {
    count: numeral(locale, view.count),
    n: numeral(locale, view.sequenceIndex),
  });

  return message(locale, "title", {
    state: message(locale, state),
    title: `${item}, ${testTitle}`,
  });
};

/**
 * Compose a session page for the current item: the test's title, the Status part when the page
 * answers a refused post, then the playground's form around the item, the Save button and the
 * navigation, then the links home.
 *
 * The form posts to the session's page with, as its fragment, the id of the Status region the
 * current item's instance gives, which the page answering a refused post holds first in reading
 * order, as phase 3's item form does: a browser opens that page at the region. The form carries
 * `autocomplete="off"`, so a browser restores no checked Choice control over the stored values,
 * and `novalidate`, so every check is the server's; it is named by the page's heading. The item is
 * rendered with the current item's instance, configuration and disabled state, and the navigation
 * in the default order of its part's modes.
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param shown What the page shows besides the item.
 * @returns The page, or a developer error's page when a part cannot be rendered.
 */
const itemPage = (sitting: Sitting, view: ItemView, shown: Shown): Page => {
  const testTitle = sitting.test.test.test.title.trim();

  return Result.match(
    Result.gen(function* composeSession() {
      const document = yield* itemOf(sitting, view.ref);
      const state = yield* navigationState(sitting.test.test, sitting.session);
      const navigation = yield* renderNavigation(state, view.configuration, {
        parts: submitButtons(sitting.session.instance),
      });
      const status = yield* Option.match(shown.status, {
        onNone: () => Result.succeed<readonly string[]>([]),
        onSome: (input) =>
          Result.map(renderStatus(input, view.configuration), (rendered) => [rendered.html]),
      });
      // A package item's document is `<package location>/<path from the package's root>`.
      const documentPath = document.document.slice(sitting.package.location.length + 1);
      const item = yield* render(redact(document), view.configuration, {
        ...shown.options,
        assetBase: packageAssetBase(sitting.package.id, documentPath),
        disabled: view.disabled,
        instance: view.instance,
      });
      const form = h(
        "form",
        {
          action: `${sessionHref(sitting.id)}#${scopedId(view.instance, "status")}`,
          "aria-labelledby": titleId,
          autocomplete: "off",
          method: "post",
          novalidate: true,
        },
        [
          slot(status.length),
          saveButton(state, view, sitting.session.instance),
          slot(status.length + 1),
        ],
      );

      return page(
        200,
        view.configuration.locale,
        itemTitle(view, shown.state, testTitle),
        [
          h("h1", { id: titleId }, [text(testTitle)]),
          ...status.map((_, index) => slot(index)),
          form,
          home,
        ],
        [...status, item.html, navigation],
      );
    }),
    { onFailure: failurePage, onSuccess: (composed) => composed },
  );
};

/**
 * Collect the postings of an item's interactions in document order, one per response: the
 * response's declared base type and cardinality under the entry name `render` gives its Controls
 * for the instance, and the number base a Text Entry or an Extended Text posts in, 10 for a
 * Choice.
 *
 * A response with no declaration, or of a base type no interaction posts, is left out, so the
 * post carries nothing for it and the item shows its record's value.
 *
 * @param document The accepted item.
 * @param instance The item instance.
 * @returns The postings.
 */
const postingsOf = (document: Accepted, instance: string): readonly Posting[] => {
  const seen = new Set<string>();

  return interactionsIn(document.item.body).flatMap((interaction): readonly Posting[] => {
    const { response } = interaction;
    const declaration = document.item.responses.get(response);
    if (seen.has(response) || declaration === undefined || !isPosted(declaration.baseType)) {
      return [];
    }

    seen.add(response);

    return [
      {
        binding: {
          baseType: declaration.baseType,
          cardinality: declaration.cardinality,
          name: entryName(instance, response),
        },
        options: { base: interaction.kind === "choice" ? 10 : interaction.base },
        response,
      },
    ];
  });
};

/**
 * Read what a post carries for the current item: its own entries, partitioned by the item's
 * instance, each response decoded through the item's bindings, with the strings posted for it.
 *
 * @param document The accepted item.
 * @param instance The item instance.
 * @param entries The posted entries.
 * @returns The post.
 */
const postOf = (document: Accepted, instance: string, entries: readonly Entry[]): Post => {
  const { own } = partition(entries, instance);
  const postings = postingsOf(document, instance);
  const decoded = Object.fromEntries(
    postings.map(({ binding, options, response }) => [
      response,
      Result.merge(decode(own, binding, options)),
    ]),
  );

  return {
    decoded,
    malformed: new Set(
      Object.entries(decoded).flatMap(([response, value]) =>
        value instanceof Malformed ? [response] : [],
      ),
    ),
    posted: Object.fromEntries(
      postings.map(({ binding, response }) => [
        response,
        own.flatMap(([name, value]) =>
          name !== binding.name || value instanceof Blob ? [] : [value],
        ),
      ]),
    ),
  };
};

/**
 * Give the values a post carries that decode.
 *
 * @param post The post.
 * @returns Each decoded value, by response.
 */
const valuesOf = (post: Post): Responses =>
  Object.fromEntries(
    Object.entries(post.decoded).flatMap(([response, value]) =>
      value instanceof Malformed ? [] : [[response, value] as const],
    ),
  );

/**
 * Compose the page of a post refused for its responses: the Status part headed "Not accepted"
 * with the messages, first in reading order and without `autofocus`, and the item with the
 * strings posted and its invalid Controls, the first of which takes the page's one `autofocus`
 * (spec §4.11, phase 3's `refusedPage`).
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param refused The post and the messages that refuse it.
 * @param refused.messages The messages, each naming the response it concerns.
 * @param refused.post The post.
 * @returns The page.
 */
const refusedPage = (
  sitting: Sitting,
  view: ItemView,
  refused: { readonly messages: readonly ValidationMessage[]; readonly post: Post },
): Page =>
  itemPage(sitting, view, {
    options: { messages: refused.messages, posted: refused.post.posted, values: view.values },
    state: "notAccepted",
    status: Option.some({
      heading: "notAccepted",
      instance: view.instance,
      messages: refused.messages,
    }),
  });

/**
 * Give the words that say why an intent was refused, for a refusal that concerns no single
 * response: the locale's words for `skipping-not-allowed` and `end-of-part`, the two rules it
 * words, and the refusal's own message for the rest, which only a post of an intent the page's
 * buttons do not offer reaches.
 *
 * @param configuration The configuration, which gives the locale.
 * @param refusal The refusal.
 * @returns The message.
 */
const refusalText = (configuration: Configuration, refusal: IntentRefused): string => {
  if (refusal.rule === "end-of-part") {
    return message(configuration.locale, "endOfPart");
  }

  return refusal.rule === "skipping-not-allowed"
    ? message(configuration.locale, "skippingNotAllowed")
    : refusal.message;
};

/**
 * Compose the page of an intent refused for a reason that concerns no single Control, such as
 * `skipping-not-allowed` or `end-of-part`: the item, with the values the post carried, and the
 * Status part headed "Not accepted" holding the refusal's message, with `autofocus`, the page's
 * one (spec §4.11).
 *
 * A refused intent changes nothing, so the post's values are not saved; they stay in the item's
 * Controls, so the next post carries them again. A closed item posts nothing, so it shows the
 * values the session holds.
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param refused The post and the refusal.
 * @param refused.post The post.
 * @param refused.refusal The refusal.
 * @returns The page.
 */
const intentRefusedPage = (
  sitting: Sitting,
  view: ItemView,
  refused: { readonly post: Post; readonly refusal: IntentRefused },
): Page =>
  itemPage(sitting, view, {
    options: {
      values: view.disabled ? view.values : { ...view.values, ...valuesOf(refused.post) },
    },
    state: "notAccepted",
    status: Option.some({
      autofocus: true,
      heading: "notAccepted",
      instance: view.instance,
      messages: [
        {
          response: intentSegment,
          text: refusalText(view.configuration, refused.refusal),
        },
      ],
    }),
  });

/**
 * Answer a post `advance` refused: a refusal of the responses on the refused post's page, any
 * other refusal of the intent with its message in the Status, and every other failure, which the
 * playground's own state or code causes, on a developer error's page.
 *
 * `score`'s `ResponsesRefused` (tier (a), such as an over-ticked Choice) and `IntentRefused` with
 * `responses-invalid` (tier (b), under `validate-responses`) refuse the responses. The post is
 * decoded through the item's own bindings, so `score`'s `InvalidResponses` is a developer error
 * here, not a candidate's, as an `EngineFailure` is.
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param post The post.
 * @param failure What `advance`, or the store's encoding after it, failed with.
 * @returns The page.
 */
const advanceRefused = (
  sitting: Sitting,
  view: ItemView,
  post: Post,
  failure: AdvanceFailure | InvalidSession,
): Page => {
  if (failure._tag === "ResponsesRefused") {
    return refusedPage(sitting, view, { messages: failure.messages, post });
  }

  if (failure._tag === "IntentRefused") {
    return failure.rule === "responses-invalid"
      ? refusedPage(sitting, view, { messages: failure.messages, post })
      : intentRefusedPage(sitting, view, { post, refusal: failure });
  }

  return failurePage(failure);
};

/**
 * Start a session from a package page's Start post: `startTest` with the playground's
 * configuration, a new store id as the instance and the time now, stored with the package's
 * location and the test's path, then a 303 to the session's page.
 *
 * An id no package has, and a test path the accepted package does not hold, are 404s; a post that
 * is not a form, or names no test, is a 400. A test `startTest` cannot deliver is a developer
 * error.
 *
 * @param playground The playground.
 * @param request The post.
 * @param encoded The package's id, as the request wrote it.
 * @returns The redirect, or the page that answers instead.
 */
const startSession = Effect.fn("playground.session.start")(function* startSession(
  playground: SessionPlayground,
  request: Request,
  encoded: string,
): Effect.fn.Return<Page | Response, PackagesFailure> {
  const decoded = Result.try(() => decodeURIComponent(encoded));
  const found = Result.isSuccess(decoded)
    ? yield* playground.packages.packageOf(decoded.success)
    : Option.none();
  if (Option.isNone(found)) {
    return notFound();
  }

  const entries = yield* entriesOf(request);
  if (Option.isNone(entries)) {
    return notAForm();
  }

  const href = fieldOf(entries.value, testField);
  if (Option.isNone(href)) {
    return notePage(
      400,
      "No test named",
      `The post names no test in its ${testField} field; press a Start button on the package's page.`,
    );
  }

  const test = testIn(found.value, href.value);
  if (Option.isNone(test)) {
    return notFound();
  }

  const id = newSessionId();
  const now = DateTime.toDateUtc(yield* DateTime.now);
  const stored = Result.flatMap(
    startTest(test.value.test, test.value.items, playground.configuration, { instance: id, now }),
    encodeSession,
  );
  if (Result.isFailure(stored)) {
    return failurePage(stored.failure);
  }

  playground.sessions.set(id, {
    packageLocation: found.value.location,
    session: stored.success,
    testHref: href.value,
  });

  return seeSession(id);
});

/**
 * Answer a session's page: the current item while the test is open, the summary once it has
 * closed.
 *
 * @param playground The playground.
 * @param sitting The session and its test.
 * @returns The page.
 */
const sessionPage = (playground: SessionPlayground, sitting: Sitting): Page => {
  const shown = current(sitting.test.test, sitting.session, playground.configuration);
  if (Result.isFailure(shown)) {
    return failurePage(shown.failure);
  }

  return shown.success.kind === "summary"
    ? summaryPage(
        sitting.id,
        sitting.test.test,
        sitting.session,
        shown.success,
        playground.configuration,
      )
    : itemPage(sitting, shown.success, {
        options: { values: shown.success.values },
        state: "answering",
        status: Option.none(),
      });
};

/**
 * Carry out a post of the session form: decode the current item's responses and the intent, then
 * `advance` the session and store it, answering with a 303 back to its page; a refusal is answered
 * on the item it was posted from, and the store keeps the session as it was.
 *
 * Only the current item's entries are read, through its own bindings; a response that does not
 * decode is refused with its item's message, as a refused post is, before anything is saved. A
 * closed item posts nothing, so its post carries no responses and the session keeps its own. A
 * post to a closed test goes back to the page, which shows the summary. A post that is not a form,
 * or carries no intent `decodeIntent` reads, is a 400.
 *
 * @param playground The playground.
 * @param request The post.
 * @param sitting The session and its test.
 * @returns The redirect, or the page that answers instead.
 */
const postSession = Effect.fn("playground.session.post")(function* postSession(
  playground: SessionPlayground,
  request: Request,
  sitting: Sitting,
): Effect.fn.Return<Page | Response> {
  const { configuration } = playground;
  const { session, test } = sitting;
  const shown = current(test.test, session, configuration);
  if (Result.isFailure(shown)) {
    return failurePage(shown.failure);
  }

  if (shown.success.kind === "summary") {
    return seeSession(sitting.id);
  }

  const view = shown.success;
  const entries = yield* entriesOf(request);
  if (Option.isNone(entries)) {
    return notAForm();
  }

  const intent = decodeIntent(entries.value, session.instance);
  if (Option.isNone(intent)) {
    return notePage(
      400,
      "No intent",
      `The post carries no intent the session reads under ${intentName(session.instance)}: none, more than one, or a value no button of the session's page posts. Post the page's form with one of its buttons.`,
    );
  }

  const document = itemOf(sitting, view.ref);
  if (Result.isFailure(document)) {
    return failurePage(document.failure);
  }

  const post = postOf(document.success, view.instance, entries.value);
  if (post.malformed.size > 0) {
    const messages = checkResponses(document.success, post.decoded, view.configuration).filter(
      (said) => post.malformed.has(said.response),
    );

    return refusedPage(sitting, view, { messages, post });
  }

  const step: Step = view.disabled
    ? { intent: intent.value }
    : { intent: intent.value, responses: valuesOf(post) };
  const now = DateTime.toDateUtc(yield* DateTime.now);

  return Result.match(
    Result.flatMap(
      advance(test.test, test.items, session, step, configuration, { now }),
      encodeSession,
    ),
    {
      onFailure: (failure) => advanceRefused(sitting, view, post, failure),
      onSuccess: (stored): Page | Response => {
        playground.sessions.set(sitting.id, { ...sitting.entry, session: stored });

        return seeSession(sitting.id);
      },
    },
  );
});

/**
 * Route one request for the playground's test sessions: `POST /packages/<id>/tests`, which starts
 * a session of the test a Start button names, and `GET` and `POST /sessions/<sid>`, a session's
 * page and its form's posts. Another method there is a 405; any other path, an unknown package or
 * session, and an id that does not decode are 404s.
 *
 * @example
 *   const outcome = await Effect.runPromise(
 *     routeSessions(
 *       { configuration, packages: cache, sessions: store },
 *       new Request(`http://127.0.0.1:5190/sessions/${sid}`),
 *     ),
 *   );
 *   // the session's current item, which the playground writes with its frame
 *
 * @param playground The configuration, the packages and the sessions.
 * @param request The request.
 * @returns The page to answer with, or the 303 a post the session took answers with.
 */
export const routeSessions = (
  playground: SessionPlayground,
  request: Request,
): Effect.Effect<Page | Response, PackagesFailure> => {
  const url = new URL(request.url);
  const target = targetOf(url.pathname);
  if (Option.isNone(target)) {
    return Effect.succeed(notFound());
  }

  const { id, kind } = target.value;
  const allowed = kind === "start" ? ["POST"] : ["GET", "POST"];
  if (!allowed.includes(request.method)) {
    return Effect.succeed(
      notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`),
    );
  }

  if (kind === "start") {
    return startSession(playground, request, id);
  }

  return sittingOf(playground, id).pipe(
    Effect.flatMap((sitting) =>
      Result.match(sitting, {
        onFailure: (answered) => Effect.succeed<Page | Response>(answered),
        onSuccess: (found) =>
          request.method === "GET"
            ? Effect.succeed<Page | Response>(sessionPage(playground, found))
            : postSession(playground, request, found),
      }),
    ),
    Effect.withSpan("playground.session.page"),
  );
};
