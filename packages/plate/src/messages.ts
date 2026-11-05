/**
 * The locales the renderer writes its own text in.
 *
 * The configuration's `locale` admits exactly these, so every locale a host can pick has a catalog.
 */
export const locales = ["en"] as const;

/**
 * A locale the renderer writes its own text in.
 */
export type Locale = (typeof locales)[number];

/**
 * The English catalog: every string the renderer writes into an item, keyed by the role it plays.
 *
 * A `{name}` in a text is a placeholder that {@link message} fills. The status headings reuse the
 * three after-submit states (`notAccepted`, `scored`, `responseRecorded`), so a heading names a
 * state as the title does. This catalog is the source of the keys and of each key's placeholders;
 * any other locale's catalog has the same keys and placeholders.
 */
const en = {
  answer: "Answer",
  answerOf: "Answer {n} of {count}",
  answering: "Answering",
  atLeast: "Select at least {n}.",
  atMost: "Select at most {n}.",
  malformedFile: "Enter text, not a file.",
  malformedNumber: "Enter a number.",
  malformedSingleMany: "Enter one answer.",
  notAccepted: "Not accepted",
  notice: "Not supported here: {feature}",
  responseRecorded: "Response recorded",
  score: "Score: {score}",
  scored: "Scored",
  submit: "Submit",
  title: "{state}: {title}",
  unknownChoice: "Choose one of the listed options.",
} as const;

/**
 * The key of a string the renderer writes.
 */
export type MessageKey = keyof typeof en;

/**
 * The names of the `{name}` placeholders in a catalog text, as a union, or `never` when it has
 * none.
 */
type Placeholders<Text extends string> = Text extends `${string}{${infer Name}}${infer Rest}`
  ? Name | Placeholders<Rest>
  : never;

/**
 * The values {@link message} fills a key's placeholders with, one per placeholder.
 *
 * Each value is text as the candidate reads it: a number arrives already formatted for the locale,
 * and `notice`'s `feature` is the feature key in QTI's own spelling (an element name,
 * `pattern-mask`, `format="xhtml"`).
 */
export type MessageParams<Key extends MessageKey> = Readonly<
  Record<Placeholders<(typeof en)[Key]>, string>
>;

/**
 * The arguments {@link message} takes after the key: the params, required exactly when the key's
 * text has a placeholder, so no `{name}` reaches the page unfilled.
 */
type MessageArguments<Key extends MessageKey> = [Placeholders<(typeof en)[Key]>] extends [never]
  ? [params?: MessageParams<Key>]
  : [params: MessageParams<Key>];

/**
 * The text of every key in each locale.
 */
const catalogs: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = { en };

/**
 * A `{name}` placeholder in a catalog text; its one group is the name.
 */
const placeholder = /\{(?<name>[A-Za-z]+)\}/gu;

/**
 * Write the renderer's text for a key in a locale.
 *
 * A placeholder without a value, which only a call around the parameter types can leave, stays as
 * written rather than becoming empty.
 *
 * @example
 *   message("en", "answerOf", { count: "2", n: "1" }); // "Answer 1 of 2"
 *
 * @param locale The locale to write in.
 * @param key The string to write.
 * @param params The values of the key's `{name}` placeholders.
 * @returns The key's text in `locale`, with every placeholder filled.
 */
export const message = <Key extends MessageKey>(
  locale: Locale,
  key: Key,
  ...[params]: MessageArguments<Key>
): string => {
  const values: Readonly<Record<string, string>> = params ?? {};

  return catalogs[locale][key].replaceAll(
    placeholder,
    (whole, name: string) => values[name] ?? whole,
  );
};
