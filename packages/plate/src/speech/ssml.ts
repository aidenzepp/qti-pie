/**
 * The validity of an inline SSML `speak` fragment (A-3a): {@link checkSpeak} judges one fragment
 * against the seven SSML readings of `docs/spec-readings.md` (3, 39 to 44) and names each problem
 * by a stable {@link SpeakRule} and the path of the element at issue.
 *
 * "The document" of SSML's rules is each `speak` fragment (reading 3): an item may hold several,
 * and a name defined in one does not resolve in another, so the checks take one fragment at a
 * time and nothing here reads the item around it. An SSML element outside any `speak` belongs to
 * no fragment, and no rule here applies to it.
 *
 * A server module, read by the verdict (a later gate unit wires it); the browser runtime never
 * loads it.
 *
 * @module
 */
import { Option } from "effect";
import type { SourceAttribute, SourceChild, SourceElement, Visit } from "#plate/document/source.ts";
import { doc, ssmlNamespace, walk, xmlNamespace } from "#plate/document/source.ts";

/**
 * The rule a {@link SpeakProblem} breaks, one per reading:
 *
 * - `version`: `speak/@version` is not `1.1` (reading 39).
 * - `order`: a `meta`, `metadata` or `lexicon` comes after another SSML child of `speak` or after
 *   text that is not whitespace (reading 40).
 * - `meta`: a `meta` has both or neither of `name` and `http-equiv` (reading 41).
 * - `languages`: a `voice/@languages` holds a value that is not a language range, `und`, `zxx` or an
 *   asterisk (reading 42).
 * - `attribute`: a `voice` or `prosody` has no attribute that survives fragment removal (reading 43).
 * - `token-voice`: a `token` or `w` holds a `voice` (reading 44).
 * - `mark`: `speak`'s `startmark` or `endmark` names no mark defined exactly once in the fragment,
 *   names compared collapsed (reading 3).
 */
export type SpeakRule =
  | "attribute"
  | "languages"
  | "mark"
  | "meta"
  | "order"
  | "token-voice"
  | "version";

/**
 * One way a `speak` fragment fails an SSML reading: the {@link SpeakRule} it breaks, the `path` of
 * the element at issue from the fragment's root (`{<namespace>}<local>` steps, as the source view
 * spells an element outside QTI's namespace, with a 1-based `[n]` where siblings share a name),
 * and a `detail` that says what was found.
 */
export interface SpeakProblem {
  readonly detail: string;
  readonly path: string;
  readonly rule: SpeakRule;
}

/**
 * The version a `speak` must declare (SSML 1.1 §3.1.1).
 */
const requiredVersion = "1.1";

/**
 * The elements that come before everything else in `speak` (reading 40).
 */
const leading: ReadonlySet<string> = new Set(["lexicon", "meta", "metadata"]);

/**
 * The elements that must carry an attribute that survives fragment removal (reading 43).
 */
const attributed: ReadonlySet<string> = new Set(["prosody", "voice"]);

/**
 * The elements that hold no `voice` (reading 44): `w` is an alias of `token`.
 */
const tokens: ReadonlySet<string> = new Set(["token", "w"]);

/**
 * The language subtags a `voice/@languages` refuses (reading 42), compared without regard to case.
 */
const refusedLanguages: ReadonlySet<string> = new Set(["und", "zxx"]);

/**
 * An extended language range (RFC 4647 §2.2) less the `*` subtag the schema refuses: one to eight
 * letters, then subtags of one to eight letters or digits.
 */
const languageRange = /^[A-Za-z]{1,8}(?:-[A-Za-z0-9]{1,8})*$/u;

/**
 * XML whitespace, which separates the items of an NMTOKENS and collapses in a token.
 */
const xmlWhitespace = /[\t\n\r ]+/u;

/**
 * Report whether a child is an element.
 *
 * @param child A child of a source element.
 * @returns Whether `child` is an element.
 */
const isElement = (child: SourceChild): child is SourceElement => child.kind === "element";

/**
 * Report whether an element is an SSML element of one local name.
 *
 * @param element The element.
 * @param local The local name.
 * @returns Whether it is in the SSML namespace with that name.
 */
const isSsml = (element: SourceElement, local?: string): boolean =>
  element.namespace === ssmlNamespace && (local === undefined || element.local === local);

/**
 * Read an attribute of an element in no namespace.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns The value as written, none without the attribute.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((attribute) => attribute.local === local && attribute.namespace === ""),
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * Collapse a token's whitespace as XML Schema's `collapse` does, so two spellings of one
 * `xsd:token` compare equal (reading 3).
 *
 * @param value The value as written.
 * @returns The value with leading and trailing whitespace removed and each run of whitespace one
 *   space.
 */
const collapsed = (value: string): string => value.trim().split(xmlWhitespace).join(" ");

/**
 * Report whether an attribute survives SSML's fragment removal (SSML 1.1 §2.2.1): an SSML
 * attribute, which is one in no namespace on an SSML element, or `xml:lang` or `xml:base`.
 *
 * @param attribute The attribute.
 * @returns Whether it survives.
 */
const survives = (attribute: SourceAttribute): boolean =>
  attribute.namespace === "" ||
  (attribute.namespace === xmlNamespace &&
    (attribute.local === "lang" || attribute.local === "base"));

/**
 * Report whether one item of a `voice/@languages` is valid: `language` or `language:accent`, each
 * an extended language range without `*`, whose primary subtag is neither `und` nor `zxx`.
 *
 * @param item The item, one whitespace-separated token of the value.
 * @returns Whether it is valid.
 */
const isLanguageItem = (item: string): boolean => {
  const parts = item.split(":");

  return (
    parts.length <= 2 &&
    parts.every(
      (part) =>
        languageRange.test(part) &&
        !refusedLanguages.has((part.split("-")[0] ?? part).toLowerCase()),
    )
  );
};

/**
 * Report whether a `voice/@languages` value is valid (reading 42): the empty string, or a
 * whitespace-separated list of valid items.
 *
 * @param value The value as written.
 * @returns Whether it is valid.
 */
const isLanguages = (value: string): boolean =>
  value.trim() === "" || value.trim().split(xmlWhitespace).every(isLanguageItem);

/**
 * Check `speak`'s own attributes: `version` (reading 39), and `startmark` and `endmark` against
 * the marks the fragment defines (reading 3).
 *
 * @param visit The visit of the fragment's root.
 * @param marks How many times each collapsed mark name is defined in the fragment.
 * @returns The problems, `version` first.
 */
const checkRoot = (visit: Visit, marks: ReadonlyMap<string, number>): readonly SpeakProblem[] => {
  const version = attributeOf(visit.element, "version");
  const versionProblems: readonly SpeakProblem[] = Option.contains(version, requiredVersion)
    ? []
    : [
        {
          detail: Option.match(version, {
            onNone: () => "speak has no version attribute; SSML 1.1 requires version 1.1",
            onSome: (found) => `speak has version ${found}; SSML 1.1 requires version 1.1`,
          }),
          path: visit.path,
          rule: "version",
        },
      ];
  const markProblems = ["startmark", "endmark"].flatMap((local): readonly SpeakProblem[] =>
    Option.match(attributeOf(visit.element, local), {
      onNone: () => [],
      onSome: (value) => {
        const name = collapsed(value);
        const defined = marks.get(name) ?? 0;

        return defined === 1
          ? []
          : [
              {
                detail:
                  defined === 0
                    ? `${local} names the mark ${name}, which this speak fragment does not define`
                    : `${local} names the mark ${name}, which this speak fragment defines ${defined} times`,
                path: visit.path,
                rule: "mark",
              },
            ];
      },
    }),
  );

  return [...versionProblems, ...markProblems];
};

/**
 * Check the order of `speak`'s children (reading 40): a `meta`, `metadata` or `lexicon` after
 * another SSML child, or after text that is not whitespace, is out of order. A child in another
 * namespace is removed before judging (SSML 1.1 §2.2.1), so it starts the content no more than
 * whitespace does; an entity reference is text that is not whitespace.
 *
 * @param speak The fragment's root.
 * @returns The leading elements that come after other content.
 */
const outOfOrder = (speak: SourceElement): ReadonlySet<SourceElement> => {
  const late = new Set<SourceElement>();
  let started = false;

  for (const child of speak.children) {
    if (isElement(child)) {
      if (isSsml(child) && leading.has(child.local)) {
        if (started) {
          late.add(child);
        }
      } else if (isSsml(child)) {
        started = true;
      }
    } else if (child.kind === "entity" || child.text.trim() !== "") {
      started = true;
    }
  }

  return late;
};

/**
 * Check one element of the fragment below its root: `meta` (reading 41), `voice/@languages`
 * (reading 42), the attributes of `voice` and `prosody` (reading 43), and a `voice` in a `token`
 * or `w` (reading 44).
 *
 * @param visit The visit.
 * @param late The leading elements that come after other content of `speak` (reading 40).
 * @returns The element's problems, in rule order.
 */
const checkElement = (visit: Visit, late: ReadonlySet<SourceElement>): readonly SpeakProblem[] => {
  const { element, parent, path } = visit;

  if (!isSsml(element)) {
    return [];
  }

  const problems: SpeakProblem[] = [];

  if (late.has(element)) {
    problems.push({
      detail: `${element.local} comes after other content of speak; meta, metadata and lexicon come before everything else`,
      path,
      rule: "order",
    });
  }

  if (element.local === "meta") {
    const name = attributeOf(element, "name");
    const httpEquiv = attributeOf(element, "http-equiv");

    if (Option.isSome(name) === Option.isSome(httpEquiv)) {
      problems.push({
        detail: Option.isSome(name)
          ? "meta has both name and http-equiv; it takes exactly one of them"
          : "meta has neither name nor http-equiv; it takes exactly one of them",
        path,
        rule: "meta",
      });
    }
  }

  if (element.local === "voice") {
    const languages = attributeOf(element, "languages");

    if (Option.isSome(languages) && !isLanguages(languages.value)) {
      problems.push({
        detail: `voice has languages "${languages.value}"; each item is a language range or language:accent, and und, zxx and * are refused`,
        path,
        rule: "languages",
      });
    }
  }

  if (attributed.has(element.local) && !element.attributes.some(survives)) {
    problems.push({
      detail: `${element.local} has no attribute that survives fragment removal; it needs an SSML attribute, xml:lang or xml:base`,
      path,
      rule: "attribute",
    });
  }

  if (
    element.local === "voice" &&
    Option.isSome(parent) &&
    isSsml(parent.value) &&
    tokens.has(parent.value.local)
  ) {
    problems.push({
      detail: `voice is a child of ${parent.value.local}, which holds no voice`,
      path,
      rule: "token-voice",
    });
  }

  return problems;
};

/**
 * Check one `speak` fragment against the SSML readings (A-3a).
 *
 * The fragment is `speak` and everything under it; a nested `speak`, which SSML does not admit,
 * is read as content of the fragment and not as one of its own. Problems come in document order
 * of the element at issue, the root's `version` and `mark` problems first, and an element that
 * breaks several rules gives one problem per rule. An SSML element outside any `speak` is checked
 * by no rule here: `speechPlan` reads it into the plan as it is.
 *
 * @param speak The fragment's root, a `speak` element in the SSML namespace.
 * @returns The problems, empty when the fragment conforms.
 */
export const checkSpeak = (speak: SourceElement): readonly SpeakProblem[] => {
  const visits = [...walk(doc("speak", speak))];
  const [root, ...rest] = visits;
  const marks = new Map<string, number>();

  for (const visit of visits) {
    const name = isSsml(visit.element, "mark")
      ? attributeOf(visit.element, "name")
      : Option.none<string>();

    if (Option.isSome(name)) {
      const key = collapsed(name.value);

      marks.set(key, (marks.get(key) ?? 0) + 1);
    }
  }

  const late = outOfOrder(speak);

  return [
    ...(root === undefined ? [] : checkRoot(root, marks)),
    ...rest.flatMap((visit) => checkElement(visit, late)),
  ];
};
