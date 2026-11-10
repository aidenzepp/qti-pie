/**
 * The pronunciation lexicon reader (A-35): {@link readLexicon} reads a PLS 1.0 document, a
 * resource file the host passes in, into the {@link Lexicon} whose aliases `speechPlan` applies
 * to the spoken text.
 *
 * It reads tolerantly: the root must be `lexicon` in the PLS namespace, and nothing else is
 * validated against the Recommendation's schema, so a lexicon of another `version` or with no
 * `alphabet` reads. Only a document that cannot be read at all fails, with {@link InvalidLexicon}
 * saying why.
 *
 * It runs on the server, beside `readPnp`: it reads through crust's adapter, and a browser module
 * never imports it.
 *
 * @module
 */
import { Effect, Option, Schema } from "effect";
import { readSource } from "#plate/document/read.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { xmlNamespace } from "#plate/document/source.ts";
import type { Lexicon, LexiconEntry } from "#plate/speech/plan.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The namespace of PLS 1.0, the Pronunciation Lexicon Specification.
 *
 * @see https://www.w3.org/TR/pronunciation-lexicon/
 */
export const plsNamespace = "http://www.w3.org/2005/01/pronunciation-lexicon";

/**
 * A document `readLexicon` cannot read into a lexicon: its bytes are not readable XML
 * (`unreadable`), or its root is not a PLS `lexicon` (`not-a-lexicon`). `detail` says what was
 * found.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class InvalidLexicon extends Schema.TaggedError<InvalidLexicon>()("InvalidLexicon", {
  detail: Schema.String,
  reason: Schema.Literals(["unreadable", "not-a-lexicon"]),
}) {
  /**
   * The reason, what was found, and what to change.
   */
  override get message(): string {
    return `The pronunciation lexicon cannot be read (${this.reason}): ${this.detail}. Pass the bytes of one PLS 1.0 document, whose root is lexicon in the namespace ${plsNamespace}.`;
  }
}

/**
 * The location every lexicon is read under, since `readLexicon` takes bytes alone.
 */
const location = "lexicon";

/**
 * Name an element as `{namespace}local`, as a refusal's detail spells it.
 *
 * @param element The element.
 * @returns Its full name.
 */
const fullName = (element: SourceElement): string => `{${element.namespace}}${element.local}`;

/**
 * List an element's PLS children of one local name.
 *
 * @param element The element.
 * @param local The local name.
 * @returns The children so named, in order.
 */
const childrenNamed = (element: SourceElement, local: string): readonly SourceElement[] =>
  element.children.flatMap((child) =>
    child.kind === "element" && child.namespace === plsNamespace && child.local === local
      ? [child]
      : [],
  );

/**
 * Read an element's text: its text children joined and trimmed.
 *
 * @param element The element.
 * @returns The text.
 */
const textOf = (element: SourceElement): string =>
  element.children
    .map((child) => (child.kind === "text" ? child.text : ""))
    .join("")
    .trim();

/**
 * Read an attribute of an element in no namespace, or in the namespace given.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @param namespace The attribute's namespace, none by default.
 * @returns The value, trimmed, none without the attribute.
 */
const attributeOf = (
  element: SourceElement,
  local: string,
  namespace = "",
): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find(
      (attribute) => attribute.local === local && attribute.namespace === namespace,
    ),
  ).pipe(Option.map((attribute) => attribute.value.trim()));

/**
 * Read a lexeme into an entry: its non-empty graphemes and the alias spoken for them, the one
 * marked `prefer="true"` or else the first (PLS 1.0 §4.7). A lexeme with no alias, or with no
 * grapheme, gives no entry.
 *
 * @param lexeme The `lexeme` element.
 * @returns The entry, none for a lexeme the plan cannot apply.
 */
const entryOf = (lexeme: SourceElement): Option.Option<LexiconEntry> => {
  const graphemes = childrenNamed(lexeme, "grapheme")
    .map(textOf)
    .filter((grapheme) => grapheme !== "");
  const aliases = childrenNamed(lexeme, "alias");
  const preferred = aliases.find((candidate) =>
    Option.contains(attributeOf(candidate, "prefer"), "true"),
  );

  return graphemes.length === 0
    ? Option.none()
    : Option.fromNullishOr(preferred ?? aliases[0]).pipe(
        Option.map((chosen) => ({ alias: textOf(chosen), graphemes })),
      );
};

/**
 * Turn the reader's refusal into `unreadable`, with the reader's reason.
 *
 * @param refusal The adapter's refusal.
 * @returns The `InvalidLexicon`.
 */
const unreadable = (refusal: Refusal): InvalidLexicon => {
  const facts = Object.values(refusal.detail).join("; ");
  const where =
    refusal.location.kind === "position"
      ? ` at line ${refusal.location.line}, column ${refusal.location.column}`
      : "";

  return new InvalidLexicon({
    detail: `the bytes are not readable XML (${refusal.rule}${where}): ${facts}`,
    reason: "unreadable",
  });
};

/**
 * Read a PLS 1.0 document into the lexicon the speech plan applies (A-35).
 *
 * The root is `lexicon` in the PLS namespace; its `alphabet` and `xml:lang` are kept as written.
 * Each `lexeme` with a `grapheme` and an `alias` is an entry; a lexeme with only `phoneme`
 * children gives none, since the plan substitutes text for a plain-text engine. Nothing is
 * validated against the Recommendation's schema.
 *
 * @param bytes The document's bytes.
 * @returns The lexicon; {@link InvalidLexicon} when the bytes are not readable XML (`unreadable`,
 *   with the reader's reason) or the root is not a PLS `lexicon` (`not-a-lexicon`, naming the root
 *   found).
 */
export const readLexicon = Effect.fn("plate.readLexicon")(function* readLexicon(
  bytes: Uint8Array,
): Effect.fn.Return<Lexicon, InvalidLexicon> {
  const source = yield* readSource(location, bytes).pipe(Effect.mapError(unreadable));
  const { root } = source;

  if (root.namespace !== plsNamespace || root.local !== "lexicon") {
    return yield* new InvalidLexicon({
      detail: `the root element is ${fullName(root)}, not lexicon in the PLS namespace`,
      reason: "not-a-lexicon",
    });
  }

  const entries = childrenNamed(root, "lexeme").flatMap((lexeme) =>
    Option.toArray(entryOf(lexeme)),
  );

  yield* Effect.annotateCurrentSpan({
    "lexicon.entries": entries.length,
    "lexicon.lexemes": childrenNamed(root, "lexeme").length,
  });

  return {
    alphabet: attributeOf(root, "alphabet"),
    entries,
    lang: attributeOf(root, "lang", xmlNamespace),
  };
});
