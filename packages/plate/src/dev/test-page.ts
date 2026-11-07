/**
 * The dev playground's test sessions: a package page's Start button posts to
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
 * Submit part and End part are confirmed first: their post saves the responses with `go` to the
 * current item, a save that stays, and sends the browser to `/sessions/<sid>/confirm`, which lists
 * the part's unanswered and unsubmitted items with a Confirm button that posts the intent and a
 * Return button back to the item. A confirmed part's end sends the browser to the next part's
 * first item, whose Status says "Part submitted" and takes focus, or to the summary.
 *
 * One URL per session: the browser's Back re-requests it and shows the item the stored session
 * makes current, so only the test's own Previous moves back. Every page carries the frame's
 * headers, which say `no-store`, and the form carries `autocomplete="off"`, so a browser restores
 * no Choice control's checked state over what the store holds.
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
import { encodeSession } from "#plate/codec/session.ts";
import type { InvalidSession } from "#plate/codec/session.ts";
import type { Configuration } from "#plate/configuration.ts";
import { page, pageHeaders, slot } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { testField, testIn } from "#plate/dev/packages.ts";
import type { PackageCache, PackagesFailure } from "#plate/dev/packages.ts";
import { entriesOf, postOf, valuesOf } from "#plate/dev/post.ts";
import type { Post } from "#plate/dev/post.ts";
import {
  failurePage,
  home,
  itemAssetBase,
  itemOf,
  notePage,
  sessionHref,
  sittingOf,
} from "#plate/dev/sitting.ts";
import type { Sitting } from "#plate/dev/sitting.ts";
import { summaryPage } from "#plate/dev/review-page.ts";
import { newSessionId } from "#plate/dev/store.ts";
import type { SessionStore } from "#plate/dev/store.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import type { PartOf, PartOverrides } from "#plate/emit/parts.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { decodeIntent, encodeIntent, intentName } from "#plate/form/intent.ts";
import { message, numeral } from "#plate/messages.ts";
import { navigationState, renderNavigation } from "#plate/navigation.ts";
import type { NavigationState } from "#plate/navigation.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import { redact, render, renderStatus } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { checkResponses } from "#plate/responses.ts";
import { advance } from "#plate/session/advance.ts";
import type { AdvanceFailure, IntentRefused } from "#plate/session/advance.ts";
import type { UnknownItemRef } from "#plate/session/control.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import type { Intent, Step } from "#plate/session/session.ts";
import { current, startTest } from "#plate/session/start.ts";
import type { ItemNotInSession, ItemView } from "#plate/session/start.ts";

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
 * page or its confirm page, by the session's id; each id still percent-encoded.
 */
type Target =
  | { readonly id: string; readonly kind: "confirm" }
  | { readonly id: string; readonly kind: "session" }
  | { readonly id: string; readonly kind: "start" };

/**
 * What one session page shows of its item besides the item: the state its title names, the Status
 * part's input when the page answers a refused post or follows a part's end, and `render`'s view
 * options.
 */
interface Shown {
  readonly options: Pick<Options, "messages" | "posted" | "values">;
  readonly state: "answering" | "notAccepted" | "partSubmitted";
  readonly status: Option.Option<StatusInput>;
}

/**
 * An intent that ends the current part: the session form's post of it saves and goes to the
 * confirm page, and only the confirm page's Confirm carries it out.
 */
type PartIntent = Extract<Intent, { readonly kind: "end-part" | "submit-part" }>;

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
 * The query parameter, and its one value, by which the 303 after a confirmed part's end asks the
 * session page for the Status that says the part is submitted.
 */
const notice = { name: "notice", partSubmitted: "part-submitted" } as const;

/**
 * Read a request's path as a session route's target.
 *
 * @param pathname The request's path.
 * @returns `/packages/<id>/tests` as a Start post, `/sessions/<sid>` as a session's page and
 *   `/sessions/<sid>/confirm` as its confirm page, each with a non-empty id; none for any other
 *   path.
 */
const targetOf = (pathname: string): Option.Option<Target> => {
  const [root, base, id, view, ...rest] = pathname.split("/");
  if (root !== "" || id === undefined || id === "" || rest.length > 0) {
    return Option.none();
  }

  if (base === "packages" && view === "tests") {
    return Option.some({ id, kind: "start" });
  }

  if (base !== "sessions") {
    return Option.none();
  }

  if (view === undefined) {
    return Option.some({ id, kind: "session" });
  }

  return view === "confirm" ? Option.some({ id, kind: "confirm" }) : Option.none();
};

/**
 * Say whether a path is one of the session routes, so the playground dispatches it to
 * {@link routeSessions}: a package's Start post, before the package routes, which answer that path
 * 404, and a session's page, after the review routes, which own the paths below it.
 *
 * @param pathname The request's path.
 * @returns Whether the path is `/packages/<id>/tests`, `/sessions/<sid>` or
 *   `/sessions/<sid>/confirm`, whatever the ids hold.
 */
export const sessionPath = (pathname: string): boolean => Option.isSome(targetOf(pathname));

/**
 * Give the path of a session's confirm page.
 *
 * @param id The session id.
 * @returns `/sessions/<sid>/confirm`.
 */
const confirmHref = (id: string): string => `${sessionHref(id)}/confirm`;

/**
 * Construct the 303 that sends a browser to a page after a post the playground took, with the page
 * headers, so the page's address is the one the browser shows and re-requests.
 *
 * @param location The page's path.
 * @returns The redirect.
 */
const seeOther = (location: string): Response =>
  new Response(null, { headers: { ...pageHeaders, location }, status: 303 });

/**
 * Construct the 303 that sends a browser to a session's page.
 *
 * @param id The session id.
 * @returns The redirect.
 */
const seeSession = (id: string): Response => seeOther(sessionHref(id));

/**
 * Construct the 404 page every refused session path answers with.
 *
 * @returns The 404 page.
 */
const notFound = (): Page =>
  notePage(404, "Not found", "No package test, or no session, is at this address.");

/**
 * Construct the page a post whose body is not a form answers with.
 *
 * @returns The 400 page.
 */
const notAForm = (): Page =>
  notePage(400, "Not a form post", "The post's body is not a form; post the page's own form.");

/**
 * Construct the page a post that carries no intent the session reads answers with.
 *
 * @param instance The session's instance, the store's id.
 * @returns The 400 page.
 */
const noIntent = (instance: string): Page =>
  notePage(
    400,
    "No intent",
    `The post carries no intent the session reads under ${intentName(instance)}: none, more than one, or a value no button of the session's page posts. Post the page's form with one of its buttons.`,
  );

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
 * Construct the playground's replacement for every navigation button: its own submit button, named
 * for the session's intent and posting the intent the button is handed. The swap keeps everything
 * plate computed, `disabled` and `aria-current` included.
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
 * Give the title a session page carries: `{state}: Item n of N, {test title}`.
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
 * order, as the item page's form does: a browser opens that page at the region. The form carries
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
      const item = yield* render(redact(document), view.configuration, {
        ...shown.options,
        assetBase: itemAssetBase(sitting, document),
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
 * Compose the page of a post refused for its responses: the Status part headed "Not accepted"
 * with the messages, first in reading order and without `autofocus`, and the item with the
 * strings posted, or its saved values when the refused post carried none, and its invalid
 * Controls, the first of which takes the page's one `autofocus`, as the item page's
 * `refusedPage` does.
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param refused The post's strings and the messages that refuse it.
 * @param refused.messages The messages, each naming the response it concerns.
 * @param refused.posted The strings posted for each response; none for a confirm page's post,
 *   which carries no response.
 * @returns The page.
 */
const refusedPage = (
  sitting: Sitting,
  view: ItemView,
  refused: {
    readonly messages: readonly ValidationMessage[];
    readonly posted: Option.Option<Post["posted"]>;
  },
): Page =>
  itemPage(sitting, view, {
    options: {
      messages: refused.messages,
      values: view.values,
      ...Option.match(refused.posted, { onNone: () => ({}), onSome: (posted) => ({ posted }) }),
    },
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
 * buttons do not offer reaches, or a confirmed part submission refused for an item the candidate
 * cannot be taken back to, whose message names that item.
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
 * one.
 *
 * A refused intent changes nothing, so the post's values are not saved; they stay in the item's
 * Controls, so the next post carries them again. A closed item posts nothing, so it shows the
 * values the session holds, as does a confirm page's post, which carries no response.
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param refused The post and the refusal.
 * @param refused.post The post; none for a confirm page's post.
 * @param refused.refusal The refusal.
 * @returns The page.
 */
const intentRefusedPage = (
  sitting: Sitting,
  view: ItemView,
  refused: { readonly post: Option.Option<Post>; readonly refusal: IntentRefused },
): Page =>
  itemPage(sitting, view, {
    options: {
      values: view.disabled
        ? view.values
        : {
            ...view.values,
            ...Option.match(refused.post, { onNone: () => ({}), onSome: valuesOf }),
          },
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
 * @param post The post; none for a confirm page's post.
 * @param failure What `advance`, or the store's encoding after it, failed with.
 * @returns The page.
 */
const advanceRefused = (
  sitting: Sitting,
  view: ItemView,
  post: Option.Option<Post>,
  failure: AdvanceFailure | InvalidSession,
): Page => {
  const posted = post.pipe(Option.map((carried) => carried.posted));
  if (failure._tag === "ResponsesRefused") {
    return refusedPage(sitting, view, { messages: failure.messages, posted });
  }

  if (failure._tag === "IntentRefused") {
    return failure.rule === "responses-invalid"
      ? refusedPage(sitting, view, { messages: failure.messages, posted })
      : intentRefusedPage(sitting, view, { post, refusal: failure });
  }

  return failurePage(failure);
};

/**
 * Say whether an intent ends the current part.
 *
 * @param intent The intent.
 * @returns Whether it is `submit-part` or `end-part`.
 */
const isPartIntent = (intent: Intent): intent is PartIntent =>
  intent.kind === "end-part" || intent.kind === "submit-part";

/**
 * Give the intent that ends the current part, when the session takes one now: `submit-part` in a
 * simultaneous part, `end-part` in a nonlinear, individual one, as `allowedIntents` lists them.
 *
 * @param sitting The session and its test.
 * @returns The intent, or none when the session takes neither; a failure of `allowedIntents` for
 *   a session that does not fit its test.
 */
const partIntentNow = (
  sitting: Sitting,
): Result.Result<Option.Option<PartIntent>, ItemNotInSession | UnknownItemRef> =>
  Result.map(allowedIntents(sitting.test.test, sitting.session), (allowed) =>
    Option.fromUndefinedOr(allowed.find(isPartIntent)),
  );

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
 * After a confirmed part's end, the item, the next part's first, comes with the Status part
 * headed "Part submitted" with `autofocus`, the page's one: the form the browser posted named the
 * Status region of an item of the part that ended, which this page does not hold, so the region's
 * `autofocus` is what focuses it.
 *
 * @param playground The playground.
 * @param sitting The session and its test.
 * @param partSubmitted Whether the request follows a confirmed part's end.
 * @returns The page.
 */
const sessionPage = (
  playground: SessionPlayground,
  sitting: Sitting,
  partSubmitted: boolean,
): Page => {
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
        state: partSubmitted ? "partSubmitted" : "answering",
        status: partSubmitted
          ? Option.some({
              autofocus: true,
              heading: "partSubmitted",
              instance: shown.success.instance,
            })
          : Option.none(),
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
 * Submit part and End part, when the session takes them now, are not carried out here: the post's
 * responses are saved with `go` to the current item, a save that stays, and the browser is sent to
 * the confirm page, whose Confirm carries the intent out. Posted when the session does not take
 * them, they go to `advance`, which refuses them on the item.
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
    return noIntent(session.instance);
  }

  const document = itemOf(sitting, view.ref);
  if (Result.isFailure(document)) {
    return failurePage(document.failure);
  }

  const post = postOf(document.success, view.instance, entries.value, view.record);
  if (post.malformed.size > 0) {
    const messages = checkResponses(document.success, post.decoded, view.configuration).filter(
      (said) => post.malformed.has(said.response),
    );

    return refusedPage(sitting, view, { messages, posted: Option.some(post.posted) });
  }

  const ending = isPartIntent(intent.value)
    ? partIntentNow(sitting)
    : Result.succeed(Option.none());
  if (Result.isFailure(ending)) {
    return failurePage(ending.failure);
  }

  const confirming = Option.exists(ending.success, (offered) => offered.kind === intent.value.kind);
  const carried: Intent = confirming
    ? { kind: "go", sequenceIndex: view.sequenceIndex }
    : intent.value;
  const step: Step = view.disabled
    ? { intent: carried }
    : { intent: carried, responses: valuesOf(post) };
  const now = DateTime.toDateUtc(yield* DateTime.now);

  return Result.match(
    Result.flatMap(
      advance(test.test, test.items, session, step, configuration, { now }),
      encodeSession,
    ),
    {
      onFailure: (failure) => advanceRefused(sitting, view, Option.some(post), failure),
      onSuccess: (stored): Page | Response => {
        playground.sessions.set(sitting.id, { ...sitting.entry, session: stored });

        return confirming ? seeOther(confirmHref(sitting.id)) : seeSession(sitting.id);
      },
    },
  );
});

/**
 * Compose a confirm page: its title as its heading, the part's unanswered and unsubmitted items,
 * each as `Item n` with its state in words, then a form whose Confirm posts the intent and whose
 * Return posts `go` to the current item, which the confirm route answers by sending the browser
 * back to the session's page.
 *
 * The form posts to the confirm page with the same fragment as the session form, the Status
 * region of the current item, which a refused Confirm's page holds; it is named by the heading.
 * Every item of the part that is neither submitted nor closed is listed: in a part that submits
 * its items together that is every open one, and in a part that submits each on its own an item
 * the part's end leaves unscored. The list is left out when there is none.
 *
 * @param sitting The session and its test.
 * @param view The current item.
 * @param state The navigation, whose items give each item's state.
 * @param intent The intent the page confirms.
 * @returns The page.
 */
const confirmationPage = (
  sitting: Sitting,
  view: ItemView,
  state: NavigationState,
  intent: PartIntent,
): Page => {
  const { locale } = view.configuration;
  const title = message(locale, "confirmTitle", {
    intent: message(locale, intent.kind === "submit-part" ? "submitPart" : "endPart"),
    test: sitting.test.test.test.title.trim(),
  });
  const pending = state.items.filter(
    (item) => item.state === "answered" || item.state === "not-answered",
  );
  /**
   * Construct one of the form's submit buttons, named for the session's intent.
   *
   * @param posted The intent the button posts.
   * @param label The key of the button's text.
   * @returns The button.
   */
  const button = (posted: Intent, label: "confirm" | "return"): Element =>
    h(
      "button",
      { name: intentName(sitting.session.instance), type: "submit", value: encodeIntent(posted) },
      [text(message(locale, label))],
    );

  return page(200, locale, title, [
    h("h1", { id: titleId }, [text(title)]),
    ...(pending.length === 0
      ? []
      : [
          h("h2", {}, [text(message(locale, "confirmList"))]),
          h(
            "ul",
            {},
            pending.map((item) =>
              h("li", {}, [
                text(
                  message(locale, "itemState", {
                    item: message(locale, "item", { n: numeral(locale, item.sequenceIndex) }),
                    state: message(
                      locale,
                      item.state === "answered" ? "itemAnswered" : "itemNotAnswered",
                    ),
                  }),
                ),
              ]),
            ),
          ),
        ]),
    h(
      "form",
      {
        action: `${confirmHref(sitting.id)}#${scopedId(view.instance, "status")}`,
        "aria-labelledby": titleId,
        autocomplete: "off",
        method: "post",
        novalidate: true,
      },
      [
        button(intent, "confirm"),
        button({ kind: "go", sequenceIndex: view.sequenceIndex }, "return"),
      ],
    ),
    home,
  ]);
};

/**
 * Answer a session's confirm page: the page for the intent that ends the current part, while the
 * session takes one; otherwise, a closed test included, a 303 to the session's page.
 *
 * @param playground The playground.
 * @param sitting The session and its test.
 * @returns The page, or the redirect.
 */
const confirmPage = (playground: SessionPlayground, sitting: Sitting): Page | Response => {
  const shown = current(sitting.test.test, sitting.session, playground.configuration);
  if (Result.isFailure(shown)) {
    return failurePage(shown.failure);
  }

  const view = shown.success;
  if (view.kind === "summary") {
    return seeSession(sitting.id);
  }

  return Result.match(navigationState(sitting.test.test, sitting.session), {
    onFailure: failurePage,
    onSuccess: (state) =>
      Option.match(Option.fromUndefinedOr(state.allowed.find(isPartIntent)), {
        onNone: () => seeSession(sitting.id),
        onSome: (intent) => confirmationPage(sitting, view, state, intent),
      }),
  });
};

/**
 * Answer a confirmed part submission that `score` refused for another item's responses: take the
 * candidate to that item, so the page marks its responses and its form posts them, and answer
 * with its refused page. The move is an intent of its own, `go` to the item, stored as any
 * accepted move is; the refused submission changed nothing.
 *
 * Where the part does not take that move, as in a linear part, the refusal is answered on the
 * current item with its message, which names the item, and no Control of the current item is
 * marked.
 *
 * @param playground The playground.
 * @param sitting The session and its test.
 * @param view The current item.
 * @param refusal The refusal, `responses-invalid` naming another item.
 * @param target The sequence index of the item it names.
 * @param now The time of the move.
 * @returns The page.
 */
const refusedElsewhere = (
  playground: SessionPlayground,
  sitting: Sitting,
  view: ItemView,
  refusal: IntentRefused,
  target: number,
  now: Date,
): Page => {
  /**
   * Answer the refusal on the current item, where the move to the item it names cannot be made.
   *
   * @returns The current item's page, its Status holding the refusal's message.
   */
  const onCurrent = (): Page => intentRefusedPage(sitting, view, { post: Option.none(), refusal });

  return Result.match(
    Result.gen(function* moveToRefused() {
      const moved = yield* advance(
        sitting.test.test,
        sitting.test.items,
        sitting.session,
        { intent: { kind: "go", sequenceIndex: target } },
        playground.configuration,
        { now },
      );
      const stored = yield* encodeSession(moved);
      const shown = yield* current(sitting.test.test, moved, playground.configuration);

      return { moved, shown, stored };
    }),
    {
      onFailure: onCurrent,
      onSuccess: ({ moved, shown, stored }) => {
        // A move keeps the test open, so the summary is never current after one.
        if (shown.kind === "summary") {
          return onCurrent();
        }

        playground.sessions.set(sitting.id, { ...sitting.entry, session: stored });

        return refusedPage({ ...sitting, session: moved }, shown, {
          messages: refusal.messages,
          posted: Option.none(),
        });
      },
    },
  );
};

/**
 * Carry out a confirm page's post: Confirm, which posts the intent that ends the current part,
 * goes to `advance`, and its success is stored and answered with a 303 to the session's page,
 * asking for the "Part submitted" Status unless the test has closed; Return, and any other intent,
 * sends the browser back to the session's page and changes nothing.
 *
 * The responses were saved before the confirm page, so the post carries none. A refusal is
 * answered on the current item as the session form's is, except that a `submit-part` refused for
 * another item's responses is answered on that item ({@link refusedElsewhere}). A post that is not
 * a form, or carries no intent `decodeIntent` reads, is a 400; a post to a closed test goes back to
 * the session's page.
 *
 * @param playground The playground.
 * @param request The post.
 * @param sitting The session and its test.
 * @returns The redirect, or the page that answers instead.
 */
const confirmPost = Effect.fn("playground.session.confirm")(function* confirmPost(
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

  const view = shown.success;
  if (view.kind === "summary") {
    return seeSession(sitting.id);
  }

  const entries = yield* entriesOf(request);
  if (Option.isNone(entries)) {
    return notAForm();
  }

  const intent = decodeIntent(entries.value, session.instance);
  if (Option.isNone(intent)) {
    return noIntent(session.instance);
  }

  const ending = partIntentNow(sitting);
  if (Result.isFailure(ending)) {
    return failurePage(ending.failure);
  }

  if (
    !Option.exists(
      ending.success,
      (offered) => encodeIntent(offered) === encodeIntent(intent.value),
    )
  ) {
    return seeSession(sitting.id);
  }

  const now = DateTime.toDateUtc(yield* DateTime.now);
  const advanced = advance(
    test.test,
    test.items,
    session,
    { intent: intent.value },
    configuration,
    {
      now,
    },
  );
  if (Result.isFailure(advanced)) {
    const { failure } = advanced;
    const elsewhere =
      failure._tag === "IntentRefused" && failure.rule === "responses-invalid"
        ? failure.sequenceIndex.pipe(Option.filter((index) => index !== view.sequenceIndex))
        : Option.none();

    return failure._tag === "IntentRefused" && Option.isSome(elsewhere)
      ? refusedElsewhere(playground, sitting, view, failure, elsewhere.value, now)
      : advanceRefused(sitting, view, Option.none(), failure);
  }

  const stored = encodeSession(advanced.success);
  if (Result.isFailure(stored)) {
    return failurePage(stored.failure);
  }

  playground.sessions.set(sitting.id, { ...sitting.entry, session: stored.success });

  return advanced.success.status === "closed"
    ? seeSession(sitting.id)
    : seeOther(`${sessionHref(sitting.id)}?${notice.name}=${notice.partSubmitted}`);
});

/**
 * Route one request for the playground's test sessions: `POST /packages/<id>/tests`, which starts
 * a session of the test a Start button names; `GET` and `POST /sessions/<sid>`, a session's page
 * and its form's posts; and `GET` and `POST /sessions/<sid>/confirm`, the confirm page before a
 * part's end and its Confirm and Return. Another method there is a 405 whose `Allow` names the
 * methods the path takes; any other path, an unknown package or session, and an id that does not
 * decode are 404s.
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
      notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`, {
        allow: allowed.join(", "),
      }),
    );
  }

  if (kind === "start") {
    return startSession(playground, request, id);
  }

  /**
   * Answer a request for a stored session's page or its confirm page, by the request's method.
   *
   * @param found The session and its test.
   * @returns The page, or the redirect a post the session took answers with.
   */
  const answer = (found: Sitting): Effect.Effect<Page | Response> => {
    if (kind === "confirm") {
      return request.method === "GET"
        ? Effect.succeed(confirmPage(playground, found))
        : confirmPost(playground, request, found);
    }

    return request.method === "GET"
      ? Effect.succeed(
          sessionPage(
            playground,
            found,
            url.searchParams.get(notice.name) === notice.partSubmitted,
          ),
        )
      : postSession(playground, request, found);
  };

  return sittingOf(playground, id, notFound()).pipe(
    Effect.flatMap((sitting) =>
      Result.match(sitting, {
        onFailure: (answered) => Effect.succeed<Page | Response>(answered),
        onSuccess: answer,
      }),
    ),
    Effect.withSpan("playground.session.page"),
  );
};
