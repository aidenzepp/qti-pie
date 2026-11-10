/**
 * The React 19 host fixture (issue m3g-07, criterion 10): one Choice item rendered and scored on a
 * React 19 page that holds a shadcn theme, composed by the host from plate's public surface alone,
 * as an author with React composes it (rule `a9d04969` point 5).
 *
 * {@link ReactHost} places the item with plate's `<Item>`, and {@link CoreHost} places the HTML
 * `render` writes for the same item. The one stylesheet, `src/styles.css`, styles both, reading the
 * shadcn tokens the page's own theme sets at `:root`, and the two score alike. Both put the item in
 * the host's own `<form action={…}>` with the host's own submit button (plate renders no form and
 * no submit control), score the post with `partition`, `postings`, `decode`, `checkResponses` and
 * `score` as the plain-HTML host (`#plate/hosts/html.ts`) does, and show the result with
 * `<Status>` above the form. The form carries `autocomplete="off"`, the duty the README states for
 * a form that holds a Choice. plate sets no token: the theme is the host's.
 *
 * This is a practice composition. The page holds the accepted item and scores in the browser,
 * which the goal names as an author's choice; a secure host keeps the accepted item on its server
 * and scores there, through the helper issue m3g-06 adds, and sends the page only the redacted
 * item. The fixture imports only `#plate/index.ts`, `#plate/react/index.tsx` and `react`, so it
 * uses nothing a host outside the package could not, and the core never reaches it
 * (`src/boundary.test.ts` forbids `#plate/hosts/`).
 *
 * @module
 */
import { useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  checkResponses,
  decode,
  partition,
  postings,
  redact,
  render,
  score,
} from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  Entry,
  Options,
  Posting,
  ResponseValue,
  StatusInput,
  StoredRecord,
  ValidationMessage,
} from "#plate/index.ts";
import { Item, Status } from "#plate/react/index.tsx";

/**
 * The props both hosts take: the accepted item, the configuration every render and check reads,
 * and the instance token every render and decode names its entries with.
 */
interface HostProps {
  readonly accepted: Accepted;
  readonly configuration: Configuration;
  readonly instance: string;
}

/**
 * What the host shows for the latest post: how many it has taken, the failure it could not turn
 * into a score, what `render` shows (the posted values, or a refused post's strings and messages)
 * and what the Status part shows.
 */
interface Shown {
  readonly attempt: number;
  readonly failure: string | undefined;
  readonly options: Omit<Options, "instance" | "parts">;
  readonly status: StatusInput | undefined;
}

/**
 * What the host shows before the first post: the item as `render` writes it, and no Status part.
 */
const unanswered: Shown = { attempt: 0, failure: undefined, options: {}, status: undefined };

/**
 * Read a stored float: a JSON number, or the name a stored record writes a float JSON has no
 * number for.
 *
 * @param stored The float as the record stores it.
 * @returns The float.
 */
const floatOf = (stored: number | "-0" | "-INF" | "INF" | "NaN"): number => {
  switch (stored) {
    case "-0": {
      return -0;
    }
    case "-INF": {
      return Number.NEGATIVE_INFINITY;
    }
    case "INF": {
      return Number.POSITIVE_INFINITY;
    }
    case "NaN": {
      return Number.NaN;
    }
    default: {
      return stored;
    }
  }
};

/**
 * Write the score a stored record holds, as the candidate reads it in the locale.
 *
 * @param accepted The accepted item.
 * @param stored The record `score` returned.
 * @param locale The locale.
 * @returns The single value of `SCORE`, or none when the item has no response processing or
 *   `SCORE` is absent or NULL, which makes the page say the response was recorded.
 */
const scoreText = (
  accepted: Accepted,
  stored: StoredRecord,
  locale: string,
): string | undefined => {
  const [single] = stored.outcomes["SCORE"]?.values ?? [];
  if (accepted.item.processing._tag === "None" || single === undefined) {
    return undefined;
  }

  switch (single.baseType) {
    case "duration":
    case "float": {
      return new Intl.NumberFormat(locale).format(floatOf(single.value));
    }
    case "integer": {
      return new Intl.NumberFormat(locale).format(BigInt(single.value));
    }
    case "directedPair":
    case "pair":
    case "point": {
      return single.value.join(" ");
    }
    case "boolean":
    case "identifier":
    case "string":
    case "uri": {
      return String(single.value);
    }
    default: {
      return single satisfies never;
    }
  }
};

/**
 * Take one post of the form: decode each response the item posts, an integer in the base its
 * interaction declares, check them, then score them, as `#plate/hosts/html.ts` does for a
 * form-urlencoded body.
 *
 * @param post What the post is read against.
 * @param post.accepted The accepted item.
 * @param post.bindings The item's postings, one per response a Control posts.
 * @param post.configuration The configuration.
 * @param post.formData The form's entries, as the browser encodes them.
 * @param post.instance The instance token the entries are named for.
 * @param attempt Which post this is, counting from 1.
 * @returns What the page shows next: the item with the post's strings and the Status part's
 *   messages when the post is refused, the item with the post's values and the score when it is
 *   scored, or the failure `score` gave that is no refusal of the post.
 */
const answered = (
  post: {
    readonly accepted: Accepted;
    readonly bindings: readonly Posting[];
    readonly configuration: Configuration;
    readonly formData: FormData;
    readonly instance: string;
  },
  attempt: number,
): Shown => {
  const { accepted, bindings, configuration, formData, instance } = post;
  const { own } = partition(
    Array.from(formData, ([name, value]): Entry => [name, value]),
    instance,
  );
  const decoded = bindings.map(({ binding, identifier, options }) => ({
    identifier,
    result: decode(own, binding, options),
  }));
  const posted = Object.fromEntries(
    bindings.map(({ binding, identifier }) => [
      identifier,
      own.flatMap(([name, value]) =>
        name !== binding.name || value instanceof Blob ? [] : [value],
      ),
    ]),
  );
  /**
   * Show a refused post: the item with the post's strings and the messages, and the Status part
   * headed "Not accepted".
   *
   * @param refusals The messages that refuse the post.
   * @returns What the page shows.
   */
  const refused = (refusals: readonly ValidationMessage[]): Shown => ({
    attempt,
    failure: undefined,
    options: { messages: refusals, posted },
    status: { heading: "notAccepted", instance, messages: refusals },
  });
  const messages = checkResponses(
    accepted,
    Object.fromEntries(
      decoded.map(({ identifier, result }) => [
        identifier,
        result._tag === "Success" ? result.success : result.failure,
      ]),
    ),
    configuration,
  );
  if (messages.length > 0) {
    return refused(messages);
  }

  const values: Readonly<Record<string, ResponseValue>> = Object.fromEntries(
    decoded.flatMap(({ identifier, result }) =>
      result._tag === "Success" ? [[identifier, result.success] as const] : [],
    ),
  );
  const stored = score(accepted, values);
  if (stored._tag === "Failure") {
    return stored.failure._tag === "ResponsesRefused"
      ? refused(stored.failure.messages)
      : { attempt, failure: stored.failure.message, options: { values }, status: undefined };
  }

  const written = scoreText(accepted, stored.success, configuration.locale);

  return {
    attempt,
    failure: undefined,
    options: { values },
    status:
      written === undefined
        ? { heading: "responseRecorded", instance }
        : { heading: "scored", instance, score: written },
  };
};

/**
 * Hold what both hosts share: the redacted item, the form's action and what the page shows. The
 * page holds the accepted item, which a secure host would not; it redacts the item once and sends
 * nothing to a server, scoring each post in the browser.
 *
 * @param props The accepted item, the configuration and the instance token.
 * @param props.accepted The accepted item.
 * @param props.configuration The configuration.
 * @param props.instance The instance token.
 * @returns The redacted item, `render`'s options with the instance and the latest post's inputs,
 *   what the page shows, and the form's action, which takes the post and shows its result.
 */
const useHost = ({ accepted, configuration, instance }: HostProps) => {
  const redacted = useMemo(
    () => redact(accepted, undefined, configuration),
    [accepted, configuration],
  );
  const bindings = useMemo(() => postings(redacted, instance), [instance, redacted]);
  const [shown, show] = useState(unanswered);
  const options = useMemo(
    (): Options => ({ ...shown.options, instance }),
    [instance, shown.options],
  );
  const action = (formData: FormData): void => {
    show((before) =>
      answered({ accepted, bindings, configuration, formData, instance }, before.attempt + 1),
    );
  };

  return { action, options, redacted, shown };
};

/**
 * Lay out the page around an item the host placed: the Status part, when a post gave one, and any
 * failure as text, then the host's form around the item and the host's submit button.
 *
 * The Status part writes no `autofocus`, so the page moves focus to its region after each post, as
 * the plain-HTML host's `autofocus` does: the region is `role="status"` but is inserted with its
 * text, which screen readers do not reliably announce, and a keyboard candidate's focus stays on
 * the submit button otherwise. A layout effect moves it, so focus and the region arrive in one
 * commit. The region's id is `<instance>-status`, which `StatusInput` documents.
 *
 * @param props The page's parts.
 * @param props.action The form's action.
 * @param props.children The item, placed.
 * @param props.configuration The configuration, which gives the Status part its locale.
 * @param props.instance The instance token, which names the Status region's id.
 * @param props.shown What the page shows.
 * @returns The page.
 */
const Page = ({
  action,
  children,
  configuration,
  instance,
  shown,
}: {
  readonly action: (formData: FormData) => void;
  readonly children: ReactNode;
  readonly configuration: Configuration;
  readonly instance: string;
  readonly shown: Shown;
}): ReactNode => {
  const { failure, status } = shown;

  useLayoutEffect(() => {
    if (status !== undefined) {
      document.querySelector<HTMLElement>(`[id="${instance}-status"]`)?.focus();
    }
  }, [instance, status]);

  return (
    <>
      {status === undefined ? null : <Status configuration={configuration} input={status} />}
      {failure === undefined ? null : <p role="alert">{failure}</p>}
      <form action={action} autoComplete="off">
        {children}
        <button type="submit">Submit</button>
      </form>
    </>
  );
};

/**
 * The React host composed through plate's React API (criterion 10): the item as `<Item>`, in the
 * host's own form with the host's own submit button, scored in the page with plate's functions
 * and answered with `<Status>` above the form.
 *
 * `<Item>` projects the tree `render` builds, so its `data-slot` markers, ids and entry names are
 * `render`'s HTML's, and its controls are uncontrolled native ones that take their defaults when
 * they mount. React resets an uncontrolled form once a function action succeeds, so the item is
 * keyed by the post and remounts with the posted values as its defaults, and the reset restores
 * the candidate's answer; unkeyed, it clears the answer. A failure the post gives that is no
 * refusal of it, such as a record `score` cannot read, is shown as text. `<Item>` reports a
 * refusal of its own (an invalid instance token, an item over the output budget) as a throw, as
 * React reports a component's failure.
 *
 * @example
 *   <ReactHost accepted={accepted} configuration={configuration} instance="q1" />;
 *
 * @param props The item and what it is rendered with.
 * @param props.accepted The accepted item, which `open` and `acceptedItem` give; a page that holds
 *   it can score it, so a secure host scores on its server instead.
 * @param props.configuration The configuration every render and check reads.
 * @param props.instance The instance token the entries are named for, one `checkInstance` passes.
 * @returns The page: the Status part after a post, and the host's form around the item.
 * @throws {InvalidInstance
 *   | NotRedacted
 *   | OutputTooLarge
 *   | InvalidHeadingLevel}
 *   The first refusal `<Item>` gives.
 * @see {@link Item}
 * @see {@link Status}
 * @see https://react.dev/reference/react-dom/components/form
 */
export const ReactHost = (props: HostProps): ReactNode => {
  const { configuration, instance } = props;
  const { action, options, redacted, shown } = useHost(props);

  return (
    <Page action={action} configuration={configuration} instance={instance} shown={shown}>
      <Item
        configuration={configuration}
        key={shown.attempt}
        options={options}
        redacted={redacted}
      />
    </Page>
  );
};

/**
 * The React host composed through the core (criterion 10): the HTML `render` writes for the same
 * item, set into the host's own form with `dangerouslySetInnerHTML`, with the same submit button,
 * scoring and `<Status>` as {@link ReactHost}, so the item takes its look from the same
 * stylesheet and the same theme tokens as the React composition.
 *
 * The HTML is plate's own output for a redacted item, which escapes every author string, so
 * setting it as markup is the way a host with no framework places it. It holds no runtime
 * interaction's upgrade: a Choice needs none. When `render` refuses, the page shows the refusal's
 * message as text and no form.
 *
 * @example
 *   <CoreHost accepted={accepted} configuration={configuration} instance="q1" />;
 *
 * @param props The item and what it is rendered with.
 * @param props.accepted The accepted item, which `open` and `acceptedItem` give; a page that holds
 *   it can score it, so a secure host scores on its server instead.
 * @param props.configuration The configuration every render and check reads.
 * @param props.instance The instance token the entries are named for, one `checkInstance` passes.
 * @returns The page: the Status part after a post, and the host's form around the item's HTML, or
 *   the refusal as text.
 * @see {@link render}
 * @see {@link Status}
 */
export const CoreHost = (props: HostProps): ReactNode => {
  const { configuration, instance } = props;
  const { action, options, redacted, shown } = useHost(props);
  const rendered = useMemo(
    () => render(redacted, configuration, options),
    [configuration, options, redacted],
  );

  if (rendered._tag === "Failure") {
    return <p role="alert">{rendered.failure.message}</p>;
  }

  return (
    <Page action={action} configuration={configuration} instance={instance} shown={shown}>
      <div dangerouslySetInnerHTML={{ __html: rendered.success.html }} />
    </Page>
  );
};
