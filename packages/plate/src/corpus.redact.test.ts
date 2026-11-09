import { isDeepStrictEqual } from "node:util";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option, Predicate, Result, Schema } from "effect";
import { RedactedSchema } from "#plate/codec/redacted.ts";
import { configure, encodeRedacted, open, redact } from "#plate/index.ts";
import type { Accepted, Configuration, RedactedJson } from "#plate/index.ts";
import { formatPrinted } from "#plate/engine/format.ts";
import { integerOf } from "#plate/engine/numbers.ts";
import { own } from "#plate/engine/refs.ts";
import type { IntegerOrRef } from "#plate/model/expression.ts";
import type {
  BodyElement,
  BodyNode,
  BodyText,
  ChoiceInteraction,
  Expression,
  ExtendedTextInteraction,
  FeedbackVisibility,
  InlineChoiceInteraction,
  Item,
  ModalFeedback,
  PrintedVariable,
  ResponseDeclaration,
  Rule,
  SimpleChoice,
  TemplateDeclaration,
  TemplateVisibility,
} from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import type { ItemRecord, RedactRecord } from "#plate/model/record.ts";
import { format } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { templateShows } from "#plate/payload.ts";
import type { RedactedFields } from "#plate/payload.ts";
import {
  acceptedOf,
  noRecord,
  openCorpus,
  recordStates,
  templated,
  threeStates,
} from "#plate/test/sweep.ts";
import type { Member, RecordState, RenderState } from "#plate/test/sweep.ts";

/**
 * Opening the corpus (about 800 members) and rendering every accepted item in three states runs
 * in seconds here; the bound leaves room for a slow machine without letting a hung run stall the
 * suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The fields of a response declaration that hold what the page must not know: its correct
 * response, its mapping, its area mapping and its default value.
 */
const hiddenResponseFields = [
  "areaMapping",
  "correct",
  "defaultValue",
  "mapping",
] as const satisfies readonly (keyof ResponseDeclaration)[];

/**
 * The fields of an item that hold what the page must not know: its outcome declarations, its
 * response processing, its template declarations and its template rules.
 */
const hiddenItemFields = [
  "outcomes",
  "processing",
  "templateProcessing",
  "templates",
] as const satisfies readonly (keyof Item)[];

/**
 * The fields of a record that hold what the page must not know: the seed, the template values, the
 * correct responses and defaults template processing set, and the outcome values.
 */
const hiddenRecordFields = [
  "correct",
  "defaults",
  "outcomes",
  "seed",
  "templates",
] as const satisfies readonly (keyof ItemRecord)[];

/**
 * The fields that give a template block, a template inline or a choice its template visibility.
 */
const hiddenVisibilityFields = [
  "showHide",
  "templateIdentifier",
  "templateVisibility",
] as const satisfies readonly (keyof SimpleChoice | keyof TemplateVisibility)[];

/**
 * The field that names where a body node sits in its source document, which could tell the page
 * that hidden template content exists and where (review P2-6): the JSON form holds no path.
 */
const hiddenNodeFields = ["path"] as const satisfies readonly (keyof Exclude<BodyNode, BodyText>)[];

/**
 * The keys no redacted item's JSON holds at any depth, whatever the field sits under.
 */
const hiddenKeys: ReadonlySet<string> = new Set([
  ...hiddenItemFields,
  ...hiddenNodeFields,
  ...hiddenRecordFields,
  ...hiddenResponseFields,
  ...hiddenVisibilityFields,
]);

/**
 * Matches a text of three characters (code points) or more, the shortest secret the sweep looks
 * for: a shorter value occurs in unrelated text by chance too often to say anything.
 */
const longEnough = /.{3}/su;

/**
 * Where an item holds a secret.
 */
type SecretOrigin =
  | "area-map entry"
  | "correct response"
  | "mapping key"
  | "processing base value"
  | "processing inside coords"
  | "processing pattern";

/**
 * A value the item holds and its page must not see, with where the item holds it.
 */
interface Secret {
  readonly origin: SecretOrigin;
  readonly text: string;
}

/**
 * One rendered item as the sweep checks it: what the page receives, and what the item's source
 * shows of itself.
 */
interface Subject {
  /**
   * The item's body as its source writes it, from `qti-item-body`'s start tag to its end tag;
   * empty when the source has none.
   */
  readonly bodySource: string;
  readonly item: Item;
  /**
   * What `encodeRedacted(redact(…))` gave for the item.
   */
  readonly json: RedactedJson;
  /**
   * The member's corpus-relative path, with the record state in parentheses when the sweep passed
   * one, as every problem names the subject.
   */
  readonly location: string;
  /**
   * The record `redact` showed the item by, none when it passed none.
   */
  readonly record: Option.Option<ItemRecord>;
  /**
   * What `redact(…)` gave for the item.
   */
  readonly redacted: RedactedFields;
  /**
   * The name of the record state, `no record` when the sweep passed none.
   */
  readonly state: string;
  /**
   * The item's three render states.
   */
  readonly states: readonly RenderState[];
}

/**
 * The start of `qti-item-body`'s start tag, with or without a namespace prefix.
 */
const bodyStart = /<(?:[^\s/<>:]+:)?qti-item-body[\s/>]/u;

/**
 * Give the part of a document's source that writes its item body: from the first `qti-item-body`
 * start tag to the end of the last tag that names `qti-item-body`, its end tag, or the start tag
 * itself when it closes itself.
 *
 * @param bytes The document's bytes.
 * @returns The body's source text, or the empty string when the source holds no body.
 */
const bodySourceOf = (bytes: Uint8Array): string => {
  const text = new TextDecoder().decode(bytes);
  const start = text.search(bodyStart);
  if (start === -1) {
    return "";
  }

  const last = text.lastIndexOf("qti-item-body");

  return text.slice(start, text.indexOf(">", last) + 1);
};

/**
 * Give the spellings a text may take in markup: as it reads, and escaped as a serialiser writes
 * it in text or in an attribute value of either quote.
 *
 * @param text The text as it reads.
 * @returns Its distinct spellings.
 */
const spellingsOf = (text: string): readonly string[] => {
  const inText = text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

  return [
    ...new Set([
      text,
      inText,
      inText.replaceAll('"', "&quot;"),
      inText.replaceAll("'", "&apos;"),
      inText.replaceAll('"', "&quot;").replaceAll("'", "&apos;"),
    ]),
  ];
};

/**
 * Report whether some spelling of a text occurs in markup.
 *
 * @param markup The markup, source XML or rendered HTML.
 * @param text The text as it reads.
 * @returns Whether the markup holds it, as it reads or escaped.
 */
const occursIn = (markup: string, text: string): boolean =>
  spellingsOf(text).some((spelling) => markup.includes(spelling));

/**
 * Give the attribute literals an expression holds itself that may give the answer away: a
 * `qti-base-value`'s values, a `qti-inside`'s `coords`, joined as an area-map entry's are, and a
 * `qti-pattern-match`'s literal `pattern` (one that names a variable gives nothing away itself).
 *
 * @param expression The expression.
 * @returns The literals as candidates, in written order; none for any other kind.
 */
const ownCandidatesOf = (expression: Expression): readonly Secret[] => {
  if (expression.kind === "base-value") {
    return expression.value.values.map((single) => ({
      origin: "processing base value",
      text: format(single),
    }));
  }

  if (expression.kind === "inside") {
    return [{ origin: "processing inside coords", text: expression.coords.join(",") }];
  }

  return expression.kind === "pattern-match" && expression.pattern._tag === "literal"
    ? [{ origin: "processing pattern", text: expression.pattern.value }]
    : [];
};

/**
 * Collect the attribute literals an expression and its sub-expressions hold at any depth that may
 * give the answer away ({@link ownCandidatesOf}).
 *
 * Sub-expressions sit in `operands`, as in every expression the model holds, so an expression kind
 * the engine gains later is walked without a change here.
 *
 * @param expression The expression.
 * @returns The literals as candidates, in document order.
 */
const expressionCandidatesOf = (expression: Expression): readonly Secret[] => [
  ...ownCandidatesOf(expression),
  ...expression.operands.flatMap((operand) => expressionCandidatesOf(operand)),
];

/**
 * Collect every attribute literal the expressions of a run of response rules hold that may give
 * the answer away ({@link expressionCandidatesOf}), at any depth: a lookup's expression as a
 * set's, and nothing of an exit.
 *
 * @param rules The rules, the item's response processing or a branch of it.
 * @returns The literals as candidates, in document order.
 */
const processingCandidatesOf = (rules: readonly Rule[]): readonly Secret[] =>
  rules.flatMap((rule) => {
    if (rule.kind === "condition") {
      return [
        ...rule.branches.flatMap((branch) => [
          ...expressionCandidatesOf(branch.when),
          ...processingCandidatesOf(branch.then),
        ]),
        ...processingCandidatesOf(Option.getOrElse(rule.otherwise, () => [])),
      ];
    }

    return rule.kind === "exit" ? [] : expressionCandidatesOf(rule.expression);
  });

/**
 * List the values an item holds that its page must not see, before any is judged a secret: the
 * lexical form of each correct response value, mapping key and processing base value, each
 * area-map entry's and processing `qti-inside`'s `coords`, and each processing
 * `qti-pattern-match`'s literal `pattern`.
 *
 * @param item The item.
 * @returns Each candidate, with where the item holds it.
 */
const candidatesOf = (item: Item): readonly Secret[] => [
  ...[...item.responses.values()].flatMap((declaration): readonly Secret[] => [
    ...Option.match(declaration.correct, {
      onNone: () => [],
      onSome: (value) =>
        value.values.map((single) => ({
          origin: "correct response" as const,
          text: format(single),
        })),
    }),
    ...Option.match(declaration.mapping, {
      onNone: () => [],
      onSome: (mapping) =>
        mapping.entries.map((entry) => ({
          origin: "mapping key" as const,
          text: format(entry.key),
        })),
    }),
    ...Option.match(declaration.areaMapping, {
      onNone: () => [],
      onSome: (areaMapping) =>
        areaMapping.entries.map((entry) => ({
          origin: "area-map entry" as const,
          text: entry.coords.join(","),
        })),
    }),
  ]),
  ...Option.match(item.processing, {
    onNone: () => [],
    onSome: processingCandidatesOf,
  }),
];

/**
 * Give an item's secrets (Q16): each candidate three characters or longer that occurs nowhere in
 * its body source or its title, once per text.
 *
 * @param subject The item, with its body source.
 * @returns The secrets, each with the first place the item holds it.
 */
const secretsOf = (subject: Subject): readonly Secret[] => {
  const seen = new Set<string>();

  return candidatesOf(subject.item).filter((candidate) => {
    const secret =
      longEnough.test(candidate.text) &&
      !seen.has(candidate.text) &&
      !occursIn(subject.bodySource, candidate.text) &&
      !subject.item.title.includes(candidate.text);
    seen.add(candidate.text);

    return secret;
  });
};

/**
 * The keys and the strings of a JSON value, at any depth.
 */
interface JsonText {
  readonly keys: readonly string[];
  readonly strings: readonly string[];
}

/**
 * Collect every key and every string of a JSON value, at any depth.
 *
 * @param json The JSON form.
 * @returns Its keys and its strings, in no particular order.
 */
const textOfJson = (json: RedactedJson): JsonText => {
  const keys: string[] = [];
  const strings: string[] = [];
  const pending: unknown[] = [json];

  while (pending.length > 0) {
    const next = pending.pop();

    if (Predicate.isString(next)) {
      strings.push(next);
    } else if (Array.isArray(next)) {
      for (const element of next) {
        pending.push(element);
      }
    } else if (Predicate.isObject(next)) {
      for (const [key, value] of Object.entries(next)) {
        keys.push(key);
        pending.push(value);
      }
    }
  }

  return { keys, strings };
};

/**
 * Decode a redacted item's JSON against {@link RedactedSchema}, refusing any key that is not a field
 * of the struct it sits in.
 *
 * @param json The JSON form.
 * @returns The decoded fields, or the Schema's error naming the first key or value that does not
 *   fit.
 */
const decodeStrictly = Schema.decodeResult(RedactedSchema, { onExcessProperty: "error" });

/**
 * List the keys of a JSON form, at any depth, that name a hidden field.
 *
 * @param json The JSON form.
 * @returns Each such key, once per occurrence.
 */
const hiddenKeysOf = (json: RedactedJson): readonly string[] =>
  textOfJson(json).keys.filter((key) => hiddenKeys.has(key));

/**
 * Check a redacted item's JSON against the allowlist: every key at every depth is a field of
 * {@link RedactedSchema} where it sits, and no key names a hidden field.
 *
 * @param subject The item and its JSON.
 * @returns Each problem, naming the item; empty when the JSON holds.
 */
const keyProblems = (subject: Subject): readonly string[] => [
  ...Result.match(decodeStrictly(subject.json), {
    onFailure: (error) => [
      `${subject.location}: the JSON is not RedactedSchema's form with every key a field: ${error.message}`,
    ],
    onSuccess: () => [],
  }),
  ...hiddenKeysOf(subject.json).map(
    (key) => `${subject.location}: the JSON holds the hidden key ${JSON.stringify(key)}`,
  ),
];

/**
 * Check that none of an item's secrets reaches its page: no string of its JSON and no HTML of its
 * three states holds one.
 *
 * @param subject The item, its JSON and its states.
 * @param secrets The item's secrets.
 * @returns Each leak, naming the item, the secret and where it showed; empty when none leaks.
 */
const leakProblems = (subject: Subject, secrets: readonly Secret[]): readonly string[] => {
  const { strings } = textOfJson(subject.json);

  return secrets.flatMap((secret) => {
    const named = `${subject.location}: the ${secret.origin} ${JSON.stringify(secret.text)}`;

    return [
      ...(strings.some((text) => text.includes(secret.text)) ? [`${named} is in the JSON`] : []),
      ...subject.states.flatMap((state) =>
        occursIn(state.html, secret.text) ? [`${named} is in the HTML of ${state.name}`] : [],
      ),
    ];
  });
};

/**
 * Make the subject the sweep checks of one member: its accepted item, redacted by a record or by
 * none, encoded and rendered in its three states.
 *
 * @param member The opened member.
 * @param configuration The configuration every state renders with.
 * @param state The record `redact` shows the item by, and the state's name; with none, the item is
 *   redacted with no record and its location named alone.
 * @returns None when the member is not an accepted item that renders; otherwise the subject, or
 *   a problem when `encodeRedacted` refused the redaction.
 */
const subjectOf = (
  member: Member,
  configuration: Configuration,
  state?: RecordState,
): Option.Option<Result.Result<Subject, string>> => {
  const { name, record } = state ?? noRecord;
  const location = state === undefined ? member.location : `${member.location} (${name})`;

  return Option.flatMap(acceptedOf(member), (accepted: Accepted) =>
    Option.map(
      Result.getSuccess(threeStates(accepted, configuration, Option.getOrUndefined(record))),
      (states) => {
        const redacted = redact(accepted, Option.getOrUndefined(record));

        return Result.match(encodeRedacted(redacted), {
          onFailure: (error) =>
            Result.fail(`${location}: encodeRedacted refused: ${error.message}`),
          onSuccess: (json) =>
            Result.succeed({
              bodySource: bodySourceOf(member.bytes),
              item: accepted.item,
              json,
              location,
              record,
              redacted,
              state: name,
              states,
            }),
        });
      },
    ),
  );
};

/**
 * Every corpus member that is an accepted item and renders, made into the subject the sweep
 * checks, with a problem for each one whose redaction `encodeRedacted` refused.
 */
const corpusSubjects = Effect.gen(function* corpusSubjects() {
  const members = yield* openCorpus;
  const configuration = yield* configure({});
  const made = members.flatMap((member) => Option.toArray(subjectOf(member, configuration)));

  return {
    problems: made.flatMap((result) => (Result.isFailure(result) ? [result.failure] : [])),
    subjects: made.flatMap((result) => (Result.isSuccess(result) ? [result.success] : [])),
  };
});

/**
 * Every templated corpus item (one whose template processing runs) made into the subjects the
 * template sweep checks: one per record state, a record `begin` started under each sweep seed and
 * no record, with a problem for each item whose record could not be begun or whose redaction
 * `encodeRedacted` refused.
 */
const templatedSubjects = Effect.gen(function* templatedSubjects() {
  const members = yield* openCorpus;
  const configuration = yield* configure({});
  const swept = members.filter((member) => Option.exists(acceptedOf(member), templated));
  const made = swept.flatMap((member) =>
    Option.toArray(acceptedOf(member)).flatMap((accepted) =>
      Result.match(recordStates(accepted), {
        onFailure: (error) => [
          Result.fail(`${member.location}: no record could be begun: ${error.message}`),
        ],
        onSuccess: (states) =>
          states.flatMap((state) => Option.toArray(subjectOf(member, configuration, state))),
      }),
    ),
  );

  return {
    files: swept.length,
    problems: made.flatMap((result) => (Result.isFailure(result) ? [result.failure] : [])),
    subjects: made.flatMap((result) => (Result.isSuccess(result) ? [result.success] : [])),
  };
});

/**
 * Decide whether the page sees a part with a template visibility, from the values the redaction
 * reads: some true when they show it, some false when they hide it, none when there are no values
 * or they hold no value of its template variable, so the part is withheld.
 *
 * @param values The values `redact` showed the item by, none when it had none.
 * @param visibility The part's `template-identifier` and `show-hide`.
 * @param identifier The part's `identifier`.
 * @returns Whether the part is shown, or none when it is withheld.
 */
const decided = (
  values: Option.Option<RedactRecord>,
  visibility: TemplateVisibility,
  identifier: string,
): Option.Option<boolean> =>
  values.pipe(
    Option.flatMap((record) =>
      Object.hasOwn(record.templates, visibility.templateIdentifier)
        ? Option.some(templateShows(visibility, identifier, record.templates))
        : Option.none(),
    ),
  );

/**
 * Give the outcome values an item's feedback reads, decided from the item and the values alone:
 * none with no values; the record's own outcomes once response processing has run in the attempt
 * it shows (`attempt` `submitted`); and before it has, each declared outcome's starting value,
 * the default template processing set for it where it set one, since before response processing
 * the page is the body "displayed to the candidate at the start of each attempt", "with the
 * visibility of any integrated feedback determined by the default values of the outcome variables"
 * (the information model's ItemSessionControl `allow-review`, section 7.19.3).
 *
 * @param item The item, whose outcome declarations give the starting values.
 * @param values The values `redact` showed the item by, none when it had none.
 * @returns The outcome values, or none when there are no values.
 */
const feedbackValuesOf = (
  item: Item,
  values: Option.Option<RedactRecord>,
): Option.Option<RedactRecord["outcomes"]> =>
  values.pipe(
    Option.map((record) =>
      record.attempt === "submitted"
        ? record.outcomes
        : {
            ...outcomeDefaults(item),
            ...Object.fromEntries(
              Object.entries(record.defaults).filter(([identifier]) =>
                item.outcomes.has(identifier),
              ),
            ),
          },
    ),
  );

/**
 * Decide whether the page sees a feedback block, inline or modal feedback, from the outcome values
 * its feedback reads: the outcome's value matches the element's identifier when it holds a single
 * of base type identifier equal to it, as the value or one of its members, and `show` shows the
 * element exactly when it matches, `hide` exactly when it does not (the information model's
 * FeedbackBlock `show-hide`, section 5.49.3, FeedbackInline 5.52.3 and ModalFeedback 5.93.2).
 * Some true when they show it, some false when they hide it, none when there are no values or
 * they hold no value of its outcome, so the element is withheld.
 *
 * @param feedback The outcome values ({@link feedbackValuesOf}).
 * @param visibility The element's `outcome-identifier` and `show-hide`.
 * @param identifier The element's `identifier`.
 * @returns Whether the element is shown, or none when it is withheld.
 */
const feedbackDecided = (
  feedback: Option.Option<RedactRecord["outcomes"]>,
  visibility: FeedbackVisibility,
  identifier: string,
): Option.Option<boolean> =>
  feedback.pipe(
    Option.flatMap((outcomes) => own(outcomes, visibility.outcomeIdentifier)),
    Option.map(
      (value) =>
        value.values.some(
          (single) => single.baseType === "identifier" && single.value === identifier,
        ) ===
        (visibility.showHide === "show"),
    ),
  );

/**
 * What the sweep decides a redacted body from: the values `redact` showed the item by, the outcome
 * values its feedback reads, and the item's template declarations, which say which `param` stands
 * in for a template variable.
 */
interface Showing {
  /**
   * The outcome values the item's feedback reads ({@link feedbackValuesOf}), none when the
   * redaction has no values.
   */
  readonly feedback: Option.Option<RedactRecord["outcomes"]>;
  readonly templates: Item["templates"];
  /**
   * The values `redact` showed the item by: the record, or none with no record. The template sweep
   * checks only items whose template processing runs, which have no values without their record
   * (H3).
   */
  readonly values: Option.Option<RedactRecord>;
}

/**
 * The feature a printed variable's notice names.
 */
const printedNotice = "qti-printed-variable";

/**
 * The feature a withheld `param`'s notice names.
 */
const parameterNotice = "param";

/**
 * The feature the notices name once when the values withhold any choice: the attribute that gives
 * a choice its template visibility. A withheld choice is absent from its interaction, so no body
 * node carries it.
 */
const choiceNotice = "template-identifier";

/**
 * Give the value the values hold for a variable a printed variable names: its template value, else
 * its outcome value, read from their own keys only.
 *
 * @param record The values.
 * @param identifier The variable's identifier.
 * @returns The value, or none when the values hold none by that name.
 */
const heldValue = (record: RedactRecord, identifier: string): Option.Option<Value> =>
  Option.orElse(own(record.templates, identifier), () => own(record.outcomes, identifier));

/**
 * Resolve a printed variable's `base` or `index`: a literal as written, or the integer the values
 * hold for the variable it names. A named variable that is NULL or not a single integer is refused
 * on a checked item (`printed-variable-ref`), so its formatter default applies.
 *
 * @param written The attribute's value.
 * @param record The values.
 * @returns Some integer, or some none for the formatter's default; none when the values hold no
 *   value by the name it gives.
 */
const resolvedInteger = (
  written: IntegerOrRef,
  record: RedactRecord,
): Option.Option<Option.Option<bigint>> =>
  written._tag === "literal"
    ? Option.some(Option.some(written.value))
    : Option.map(heldValue(record, written.identifier), integerOf);

/**
 * Give what the page sees in a printed variable's place, decided from the values alone: with none,
 * its notice (H3); with values, one text node of what `formatPrinted` writes for the value they
 * hold for its variable under its `format`, `base`, `index`, `power-form` and `delimiter`, nothing
 * when that text is empty (a NULL value prints nothing) or past the formatter's bound (which
 * `redact` records, so `render` fails), and its notice when they hold no value of its variable or
 * of a name its `base` or `index` gives.
 *
 * @param node The printed variable.
 * @param values The values `redact` showed the item by.
 * @returns The nodes the page sees in its place: none, one text node or its notice.
 */
const printedSlots = (
  node: PrintedVariable,
  values: Option.Option<RedactRecord>,
): readonly BodyNode[] => {
  const resolved = values.pipe(
    Option.flatMap((record) =>
      Option.all({
        base: resolvedInteger(node.base, record),
        index: Option.match(node.index, {
          onNone: () => Option.some(Option.none<bigint>()),
          onSome: (index) => resolvedInteger(index, record),
        }),
        value: heldValue(record, node.identifier),
      }),
    ),
  );

  return Option.match(resolved, {
    onNone: (): readonly BodyNode[] => [
      { feature: printedNotice, kind: "unsupported", path: node.path },
    ],
    onSome: ({ base, index, value }): readonly BodyNode[] => {
      const text = Option.getOrElse(
        formatPrinted(value, {
          ...Option.match(base, { onNone: () => ({}), onSome: (radix) => ({ base: radix }) }),
          delimiter: node.delimiter,
          ...Option.match(node.format, {
            onNone: () => ({}),
            onSome: (code) => ({ format: code }),
          }),
          ...Option.match(index, { onNone: () => ({}), onSome: (member) => ({ index: member }) }),
          mappingIndicator: node.mappingIndicator,
          powerForm: node.powerForm,
        }),
        () => "",
      );

      return text === "" ? [] : [{ kind: "text", text }];
    },
  });
};

/**
 * Give the template variable a body element stands in for as a parameter: the declaration a
 * `param`'s `value` names, when it is declared `param-variable="true"` (the information model's
 * Param `value`, `info.txt:69978`).
 *
 * @param templates The item's template declarations.
 * @param node The body element.
 * @returns The declaration, or none for any other element.
 */
const parameterOf = (
  templates: Item["templates"],
  node: BodyElement,
): Option.Option<TemplateDeclaration> =>
  node.tag === "param"
    ? Option.fromUndefinedOr(node.attributes.find((attribute) => attribute.name === "value")).pipe(
        Option.flatMap(({ value }) => Option.fromUndefinedOr(templates.get(value))),
        Option.filter((declaration) => declaration.paramVariable),
      )
    : Option.none();

/**
 * Give the value a parameter passes for a template value, as the information model's Param
 * `value` converts it (`info.txt:69978`): an integer by `%i` and a float by `%G`.
 *
 * @param value The template value.
 * @returns The text the parameter passes, empty past the formatter's bound (which `redact`
 *   records, so `render` fails).
 */
const parameterText = (value: Value): string =>
  Option.getOrElse(
    formatPrinted(value, { format: value.baseType === "float" ? "%G" : "%i" }),
    () => "",
  );

/**
 * Give what the page sees in a body element's place: the element as written; a `param` standing
 * in for a template variable with the value the values hold for it in place of its name; or, when
 * they hold none, the `param`'s notice.
 *
 * @param node The body element.
 * @param showing The values and the item's template declarations.
 * @returns The one node the page sees in its place.
 */
const elementSlot = (node: BodyElement, showing: Showing): BodyNode =>
  Option.match(parameterOf(showing.templates, node), {
    onNone: (): BodyNode => node,
    onSome: (declaration) =>
      Option.match(
        showing.values.pipe(
          Option.flatMap((record) => own(record.templates, declaration.identifier)),
        ),
        {
          onNone: (): BodyNode => ({
            feature: parameterNotice,
            kind: "unsupported",
            path: node.path,
          }),
          onSome: (value): BodyNode => ({
            ...node,
            attributes: node.attributes.map((attribute) =>
              attribute.name === "value"
                ? { ...attribute, value: parameterText(value) }
                : attribute,
            ),
          }),
        },
      ),
  });

/**
 * Give the nodes the page must see for a run of the item's body nodes, each decided from the
 * values, never from `redact`'s output: a printed variable as {@link printedSlots} decides it; a
 * template block or inline as its content's nodes where the values show it, nothing where they
 * hide it, and its notice where they cannot say; a feedback block or inline the same way by the
 * outcome values its feedback reads ({@link feedbackDecided}); a body element as
 * {@link elementSlot} gives it;
 * any other node as itself. A written node's descendants are decided again where it is matched.
 *
 * @param nodes The item's body nodes.
 * @param showing The values and the item's template declarations.
 * @returns The nodes, in document order.
 */
const slotsOf = (nodes: readonly BodyNode[], showing: Showing): readonly BodyNode[] =>
  nodes.flatMap((node): readonly BodyNode[] => {
    if (node.kind === "printed-variable") {
      return printedSlots(node, showing.values);
    }

    if (node.kind === "template-block" || node.kind === "template-inline") {
      return Option.match(decided(showing.values, node.templateVisibility, node.identifier), {
        onNone: (): readonly BodyNode[] => [
          { feature: `qti-${node.kind}`, kind: "unsupported", path: node.path },
        ],
        onSome: (shown) => (shown ? slotsOf(node.content, showing) : []),
      });
    }

    if (node.kind === "feedback-block" || node.kind === "feedback-inline") {
      return Option.match(
        feedbackDecided(showing.feedback, node.feedbackVisibility, node.identifier),
        {
          onNone: (): readonly BodyNode[] => [
            { feature: `qti-${node.kind}`, kind: "unsupported", path: node.path },
          ],
          onSome: (shown) => (shown ? slotsOf(node.content, showing) : []),
        },
      );
    }

    return [node.kind === "element" ? elementSlot(node, showing) : node];
  });

/**
 * Report whether a run of redacted body nodes is exactly the nodes the item gives, in order: as
 * many, each {@link nodeFits} the one in its place.
 *
 * @param slots The nodes the page must see, from {@link slotsOf}.
 * @param nodes The redacted nodes.
 * @param showing The values and the item's template declarations.
 * @returns Whether the nodes fill the places and hold nothing more.
 */
const fits = (slots: readonly BodyNode[], nodes: readonly BodyNode[], showing: Showing): boolean =>
  slots.length === nodes.length &&
  slots.every((written, index) => {
    const shown = nodes[index];

    // oxlint-disable-next-line eslint/no-use-before-define -- `fits` and `nodeFits` are mutually recursive, as an element's children are body nodes; the call runs only after both are defined.
    return shown !== undefined && nodeFits(written, shown, showing);
  });

/**
 * Report whether a redacted Prompt or Label fills the item's: both absent, or both present and
 * the redacted nodes {@link fits} the item's.
 *
 * @param written The item's lead.
 * @param shown The redacted lead.
 * @param showing The values and the item's template declarations.
 * @returns Whether the redacted lead fits.
 */
const leadFits = (
  written: Option.Option<readonly BodyNode[]>,
  shown: Option.Option<readonly BodyNode[]>,
  showing: Showing,
): boolean =>
  Option.match(written, {
    onNone: () => Option.isNone(shown),
    onSome: (nodes) =>
      Option.exists(shown, (redacted) => fits(slotsOf(nodes, showing), redacted, showing)),
  });

/**
 * Report whether an interaction's redacted choices are the item's choices the values show, in
 * order: each with the item's identifier and `fixed`, content that {@link fits} the item's, and no
 * template visibility. A choice with no template visibility is always shown, and one the values
 * hide or cannot decide is absent.
 *
 * @param written The item's choices.
 * @param shown The redacted choices.
 * @param showing The values and the item's template declarations.
 * @returns Whether the redacted choices fit.
 */
const choicesFit = (
  written: readonly SimpleChoice[],
  shown: readonly SimpleChoice[],
  showing: Showing,
): boolean => {
  const visible = written.filter((choice) =>
    Option.match(choice.templateVisibility, {
      onNone: () => true,
      onSome: (visibility) =>
        Option.getOrElse(decided(showing.values, visibility, choice.identifier), () => false),
    }),
  );

  return (
    visible.length === shown.length &&
    visible.every((choice, index) => {
      const page = shown[index];

      return (
        page !== undefined &&
        isDeepStrictEqual(
          { ...choice, content: page.content, templateVisibility: Option.none() },
          page,
        ) &&
        fits(slotsOf(choice.content, showing), page.content, showing)
      );
    })
  );
};

/**
 * Report whether a redacted interaction is the item's as the page may see it: every field as the
 * item writes it, and its Prompt, Label or choices fitting the item's again.
 *
 * @param written The item's interaction.
 * @param shown The redacted node.
 * @param showing The values and the item's template declarations.
 * @returns Whether the redacted node fits.
 */
const interactionFits = (
  written: ChoiceInteraction | ExtendedTextInteraction | InlineChoiceInteraction,
  shown: BodyNode,
  showing: Showing,
): boolean => {
  if (written.kind === "choice") {
    return (
      shown.kind === "choice" &&
      isDeepStrictEqual({ ...written, choices: shown.choices, prompt: shown.prompt }, shown) &&
      leadFits(written.prompt, shown.prompt, showing) &&
      choicesFit(written.choices, shown.choices, showing)
    );
  }

  if (written.kind === "inline-choice") {
    return (
      shown.kind === "inline-choice" &&
      isDeepStrictEqual({ ...written, choices: shown.choices, label: shown.label }, shown) &&
      leadFits(written.label, shown.label, showing) &&
      choicesFit(written.choices, shown.choices, showing)
    );
  }

  return (
    shown.kind === "extended-text" &&
    isDeepStrictEqual({ ...written, prompt: shown.prompt }, shown) &&
    leadFits(written.prompt, shown.prompt, showing)
  );
};

/**
 * Report whether a redacted node is the node the page must see: every field as {@link slotsOf}
 * gives it, and its children, Prompt, Label or choices fitting the item's again. No node
 * {@link slotsOf} gives is a printed variable, a template block or inline or a feedback block or
 * inline.
 *
 * @param written The node the page must see.
 * @param shown The redacted node.
 * @param showing The values and the item's template declarations.
 * @returns Whether the redacted node fits.
 */
const nodeFits = (written: BodyNode, shown: BodyNode, showing: Showing): boolean => {
  switch (written.kind) {
    case "element": {
      return (
        shown.kind === "element" &&
        isDeepStrictEqual({ ...written, children: shown.children }, shown) &&
        fits(slotsOf(written.children, showing), shown.children, showing)
      );
    }
    case "choice":
    case "extended-text":
    case "inline-choice": {
      return interactionFits(written, shown, showing);
    }
    case "feedback-block":
    case "feedback-inline":
    case "printed-variable":
    case "template-block":
    case "template-inline": {
      return false;
    }
    case "text":
    case "text-entry":
    case "unsupported": {
      return isDeepStrictEqual(written, shown);
    }
    default: {
      return written satisfies never;
    }
  }
};

/**
 * Decide whether a path lies at or below one of the paths given: equals one, or starts with one
 * and a `/`.
 *
 * @param path The path.
 * @param above The paths.
 * @returns Whether `path` is one of `above` or lies inside one.
 */
const beneath = (path: string, above: ReadonlySet<string>): boolean =>
  [...above].some((top) => path === top || path.startsWith(`${top}/`));

/**
 * The feature a withheld modal feedback's notice names: its element's name.
 */
const modalNotice = "qti-modal-feedback";

/**
 * Decide whether the page sees a modal feedback: never before response processing has run, since
 * modal feedback "is shown to the candidate directly following response processing" (the
 * information model's ModalFeedback, section 5.93), so not with no values nor under a record whose
 * `attempt` is `none`; once it has, as {@link feedbackDecided} decides any feedback element.
 *
 * @param values The values `redact` showed the item by.
 * @param feedback The outcome values its feedback reads ({@link feedbackValuesOf}).
 * @param modal The modal feedback.
 * @returns Whether it is shown, or none when it is withheld.
 */
const modalDecided = (
  values: Option.Option<RedactRecord>,
  feedback: Option.Option<RedactRecord["outcomes"]>,
  modal: ModalFeedback,
): Option.Option<boolean> =>
  Option.exists(values, (record) => record.attempt === "submitted")
    ? feedbackDecided(feedback, modal.feedbackVisibility, modal.identifier)
    : Option.some(false);

/**
 * What one body node gives the notices, decided from the values alone: the notice it gives in its
 * own place when the page sees it, whether the page does not see what it holds, and the runs of
 * nodes it holds, each with whether the page sees it where the node is seen.
 */
interface NoticeStep {
  readonly hides: boolean;
  readonly notice: Option.Option<string>;
  readonly runs: readonly (readonly [readonly BodyNode[], boolean])[];
}

/**
 * The step of a node that gives no notice and holds nothing.
 */
const quietStep: NoticeStep = { hides: false, notice: Option.none(), runs: [] };

/**
 * Give a Choice's or an Inline Choice's step: its Prompt or Label, seen where it is; each choice's
 * content, seen where the values show the choice; and `template-identifier` when they cannot
 * decide some choice, which is then absent.
 *
 * @param node The Choice or Inline Choice.
 * @param values The values `redact` showed the item by.
 * @returns The interaction's step.
 */
const choicesStep = (
  node: ChoiceInteraction | InlineChoiceInteraction,
  values: Option.Option<RedactRecord>,
): NoticeStep => {
  const shown = node.choices.map((choice) =>
    Option.match(choice.templateVisibility, {
      onNone: () => Option.some(true),
      onSome: (visibility) => decided(values, visibility, choice.identifier),
    }),
  );

  return {
    hides: false,
    notice: shown.some(Option.isNone) ? Option.some(choiceNotice) : Option.none(),
    runs: [
      [Option.getOrElse(node.kind === "choice" ? node.prompt : node.label, () => []), true],
      ...node.choices.map(
        (choice, index) =>
          [choice.content, Option.getOrElse(shown[index] ?? Option.none(), () => false)] as const,
      ),
    ],
  };
};

/**
 * Give one body node's step: a `param` the values withhold gives `param` and hides its children; a
 * printed variable {@link printedSlots} shows as its notice gives `qti-printed-variable`; a
 * template block or inline hides its content unless the values show it, and gives its notice when
 * they cannot decide it; a feedback block or inline does the same by the outcome values its
 * feedback reads; a Choice or an Inline Choice is {@link choicesStep}'s; any other node gives
 * nothing and hides nothing.
 *
 * @param item The item, whose template declarations say which `param` stands in for a variable.
 * @param values The values `redact` showed the item by.
 * @param feedback The outcome values its feedback reads ({@link feedbackValuesOf}).
 * @param node The body node.
 * @returns The node's step.
 */
const noticeStep = (
  item: Item,
  values: Option.Option<RedactRecord>,
  feedback: Option.Option<RedactRecord["outcomes"]>,
  node: BodyNode,
): NoticeStep => {
  switch (node.kind) {
    case "element": {
      const withheld = Option.exists(
        parameterOf(item.templates, node),
        (declaration) =>
          !Option.exists(values, (record) =>
            Object.hasOwn(record.templates, declaration.identifier),
          ),
      );

      return {
        hides: withheld,
        notice: withheld ? Option.some(parameterNotice) : Option.none(),
        runs: [[node.children, !withheld]],
      };
    }
    case "printed-variable": {
      return printedSlots(node, values).some((slot) => slot.kind === "unsupported")
        ? { ...quietStep, notice: Option.some(printedNotice) }
        : quietStep;
    }
    case "template-block":
    case "template-inline": {
      const shown = decided(values, node.templateVisibility, node.identifier);
      const visible = Option.getOrElse(shown, () => false);

      return {
        hides: !visible,
        notice: Option.isNone(shown) ? Option.some(`qti-${node.kind}`) : Option.none(),
        runs: [[node.content, visible]],
      };
    }
    case "feedback-block":
    case "feedback-inline": {
      const shown = feedbackDecided(feedback, node.feedbackVisibility, node.identifier);
      const visible = Option.getOrElse(shown, () => false);

      return {
        hides: !visible,
        notice: Option.isNone(shown) ? Option.some(`qti-${node.kind}`) : Option.none(),
        runs: [[node.content, visible]],
      };
    }
    case "choice":
    case "inline-choice": {
      return choicesStep(node, values);
    }
    case "extended-text": {
      return { ...quietStep, runs: [[Option.getOrElse(node.prompt, () => []), true]] };
    }
    case "text":
    case "text-entry":
    case "unsupported": {
      return quietStep;
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Give the notices a redaction must name, decided from the item and the values alone, never from
 * `redact`'s output: each notice-shown feature the item lists outside content the values hide or
 * withhold, and each notice the values give in a part's place on content the page sees. Content
 * the page does not see is a template block or inline the values hide or cannot decide, a `param`
 * they withhold, a choice they hide or cannot decide, and everything inside one; a listed feature
 * at or below the path of any node in it is not named. The values give `qti-printed-variable` for
 * each printed variable {@link printedSlots} shows as its notice, `qti-template-block` or
 * `qti-template-inline` for each one they cannot decide, `param` for each `param` they withhold,
 * and `template-identifier` once when they cannot decide some choice ({@link noticeStep}). A
 * feedback block or inline is decided as a template block is, by the outcome values its feedback
 * reads, and gives `qti-feedback-block` or `qti-feedback-inline` when they cannot decide it. A
 * modal feedback's content is seen only where {@link modalDecided} shows it, and one it cannot
 * decide gives `qti-modal-feedback`.
 *
 * @param item The item, with the paths its source gives (never the JSON form's, which holds none).
 * @param values The values `redact` showed the item by.
 * @returns The notices, as a multiset: the listed ones in the item's order, then the given ones in
 *   document order.
 */
const noticesOf = (item: Item, values: Option.Option<RedactRecord>): readonly string[] => {
  const unseen = new Set<string>();
  const given: string[] = [];
  const feedback = feedbackValuesOf(item, values);
  const walk = (nodes: readonly BodyNode[], seen: boolean): void => {
    for (const node of nodes) {
      const step = noticeStep(item, values, feedback, node);
      if (node.kind !== "text" && (step.hides || !seen)) {
        unseen.add(node.path);
      }

      const notice = Option.getOrUndefined(step.notice);
      if (seen && notice !== undefined && !(notice === choiceNotice && given.includes(notice))) {
        given.push(notice);
      }

      for (const [run, visible] of step.runs) {
        walk(run, seen && visible);
      }
    }
  };
  walk(item.body, true);
  for (const modal of item.modalFeedback ?? []) {
    const shown = modalDecided(values, feedback, modal);
    if (Option.isNone(shown)) {
      given.push(modalNotice);
    }

    if (!Option.getOrElse(shown, () => false)) {
      unseen.add(modal.path);
    }

    walk(
      modal.content,
      Option.getOrElse(shown, () => false),
    );
  }

  return [
    ...item.unsupported
      .filter((entry) => entry.shown === "notice" && !beneath(entry.path, unseen))
      .map((entry) => entry.feature),
    ...given,
  ];
};

/**
 * Decide whether the page sees a template or feedback block's or inline's content: where the
 * values show it, never where they hide or withhold it.
 *
 * @param node The block or inline.
 * @param showing The values and the outcome values its feedback reads.
 * @returns Whether its content is seen where the block or inline is.
 */
const contentShown = (
  node: Extract<
    BodyNode,
    { readonly kind: "feedback-block" | "feedback-inline" | "template-block" | "template-inline" }
  >,
  showing: Showing,
): boolean =>
  Option.getOrElse(
    "feedbackVisibility" in node
      ? feedbackDecided(showing.feedback, node.feedbackVisibility, node.identifier)
      : decided(showing.values, node.templateVisibility, node.identifier),
    () => false,
  );

/**
 * Give the responses only content the page does not see binds, decided from the values alone:
 * each response a template or feedback block or inline the values hide or withhold binds, or one
 * inside content the page does not see, by its source content (`responses`, interactions shown as
 * notices included), and each rendered interaction's there, less every response a rendered
 * interaction on content the page sees binds. An interaction in hidden feedback "must also be
 * hidden. The candidate must not be able to set or update the value of the associated response
 * variables" (the information model's FeedbackBlock, section 5.49), as one in hidden template
 * content is, so the redaction lists none of them among its responses.
 *
 * @param body The item's body.
 * @param showing The values, the outcome values its feedback reads and its template declarations.
 * @returns The hidden-only responses.
 */
const hiddenOnlyOf = (body: readonly BodyNode[], showing: Showing): ReadonlySet<string> => {
  const unseen = new Set<string>();
  const seenBound = new Set<string>();
  const walk = (nodes: readonly BodyNode[], seen: boolean): void => {
    for (const node of nodes) {
      switch (node.kind) {
        case "element": {
          walk(node.children, seen);
          break;
        }
        case "choice":
        case "extended-text":
        case "inline-choice":
        case "text-entry": {
          (seen ? seenBound : unseen).add(node.response);
          break;
        }
        case "feedback-block":
        case "feedback-inline":
        case "template-block":
        case "template-inline": {
          const visible = seen && contentShown(node, showing);
          if (!visible) {
            for (const response of node.responses) {
              unseen.add(response);
            }
          }

          walk(node.content, visible);
          break;
        }
        case "printed-variable":
        case "text":
        case "unsupported": {
          break;
        }
        default: {
          node satisfies never;
        }
      }
    }
  };
  walk(body, true);

  return new Set([...unseen].filter((response) => !seenBound.has(response)));
};

/**
 * Report whether redacted fields are the item's as the page may see them (P7§4.9): the document,
 * identifier, `lang` and title as the item holds them; a body that
 * {@link fits} the nodes {@link slotsOf} decides, so a template value shows only as the text a
 * printed variable prints from the values, and no hidden template content, template visibility,
 * template-set correct response or default, seed or template rule shows at all; the response
 * bindings but the hidden-only ones ({@link hiddenOnlyOf}); each modal feedback
 * {@link modalDecided} shows, its content fitting the item's as the body does, a withheld one as
 * its notice with no title, and no other; no record of a
 * text past its bound, since no corpus item prints one; and notices that are, as a multiset, the
 * ones {@link noticesOf} decides.
 *
 * @param item The item.
 * @param fields The redacted fields, as `redact` gave them or as the JSON decodes.
 * @param values The values `redact` showed the item by.
 * @param notices The notices the fields must name, from {@link noticesOf}.
 * @returns Whether the fields hold nothing the item's body does not show.
 */
const fieldsFit = (
  item: Item,
  fields: RedactedFields,
  values: Option.Option<RedactRecord>,
  notices: readonly string[],
): boolean => {
  const showing: Showing = {
    feedback: feedbackValuesOf(item, values),
    templates: item.templates,
    values,
  };
  const hiddenOnly = hiddenOnlyOf(item.body, showing);
  const modal = (item.modalFeedback ?? []).flatMap((feedback) =>
    Option.match(modalDecided(values, showing.feedback, feedback), {
      onNone: () => [
        {
          content: [
            { feature: modalNotice, kind: "unsupported", path: feedback.path } satisfies BodyNode,
          ],
          title: Option.none<string>(),
        },
      ],
      onSome: (shown) =>
        shown ? [{ content: slotsOf(feedback.content, showing), title: feedback.title }] : [],
    }),
  );

  return (
    isDeepStrictEqual(
      {
        body: fields.body,
        document: item.document,
        identifier: item.identifier,
        lang: item.lang,
        modalFeedback: fields.modalFeedback,
        notices: fields.notices,
        responses: [...item.responses.values()].flatMap(({ baseType, cardinality, identifier }) =>
          hiddenOnly.has(identifier) ? [] : [{ baseType, cardinality, identifier }],
        ),
        title: item.title,
        unprinted: Option.none(),
      },
      { ...fields },
    ) &&
    fits(slotsOf(item.body, showing), fields.body, showing) &&
    modal.length === fields.modalFeedback.length &&
    modal.every((expected, index) => {
      const shown = fields.modalFeedback[index];

      return (
        shown !== undefined &&
        isDeepStrictEqual(expected.title, shown.title) &&
        fits(expected.content, shown.content, showing)
      );
    }) &&
    isDeepStrictEqual(fields.notices.toSorted(), notices.toSorted())
  );
};

/**
 * Give body nodes with every path `""`, at any depth: an element's children, a Prompt, a Label, a
 * choice's content and a template or feedback block's or inline's content included, as the redacted
 * JSON decodes them, since it holds no path (review P2-6).
 *
 * @param nodes The body nodes, with their paths.
 * @returns The same nodes, each path `""`.
 */
const withoutPaths = (nodes: readonly BodyNode[]): readonly BodyNode[] =>
  nodes.map((node): BodyNode => {
    switch (node.kind) {
      case "element": {
        return { ...node, children: withoutPaths(node.children), path: "" };
      }
      case "choice": {
        return {
          ...node,
          choices: node.choices.map((simple) => ({
            ...simple,
            content: withoutPaths(simple.content),
          })),
          path: "",
          prompt: node.prompt.pipe(Option.map((prompt) => withoutPaths(prompt))),
        };
      }
      case "inline-choice": {
        return {
          ...node,
          choices: node.choices.map((simple) => ({
            ...simple,
            content: withoutPaths(simple.content),
          })),
          label: node.label.pipe(Option.map((label) => withoutPaths(label))),
          path: "",
        };
      }
      case "extended-text": {
        return {
          ...node,
          path: "",
          prompt: node.prompt.pipe(Option.map((prompt) => withoutPaths(prompt))),
        };
      }
      case "feedback-block":
      case "feedback-inline":
      case "template-block":
      case "template-inline": {
        return { ...node, content: withoutPaths(node.content), path: "" };
      }
      case "printed-variable":
      case "text-entry":
      case "unsupported": {
        return { ...node, path: "" };
      }
      case "text": {
        return node;
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Check a templated item's redaction against the exclusion set (P7§4.9): its redacted fields
 * {@link fieldsFit} the item, and its JSON as decoded, which holds no path, fits the item with
 * every path `""`. Both name the notices {@link noticesOf} decides from the item with its paths.
 *
 * @param subject The item, its redaction and its JSON.
 * @returns Each problem, naming the item and its record state; empty when both fit. A JSON that
 *   does not decode is {@link keyProblems}' to report.
 */
const templateProblems = (subject: Subject): readonly string[] => {
  const notices = noticesOf(subject.item, subject.record);

  return [
    ...(fieldsFit(subject.item, subject.redacted, subject.record, notices)
      ? []
      : [
          `${subject.location}: the redacted fields hold more than the item's body shows, or not as it writes it`,
        ]),
    ...Result.match(decodeStrictly(subject.json), {
      onFailure: () => [],
      onSuccess: (fields) =>
        fieldsFit(
          {
            ...subject.item,
            body: withoutPaths(subject.item.body),
            modalFeedback: (subject.item.modalFeedback ?? []).map((feedback) => ({
              ...feedback,
              content: withoutPaths(feedback.content),
              path: "",
            })),
          },
          fields,
          subject.record,
          notices,
        )
          ? []
          : [
              `${subject.location}: the JSON holds more than the item's body shows, or not as it writes it`,
            ],
    }),
  ];
};

/**
 * A template block, a template inline or a choice with a template visibility, with the content its
 * visibility decides.
 */
interface TemplatePart {
  readonly content: readonly BodyNode[];
  readonly identifier: string;
  /**
   * The part as an exclusion names it: its kind and where it sits.
   */
  readonly name: string;
  readonly visibility: TemplateVisibility;
}

/**
 * Collect the template parts of an interaction's choices, at any depth: each choice with a
 * template visibility, then the parts its content holds.
 *
 * @param choices The choices.
 * @param path The interaction's path, which names each choice's part.
 * @returns The parts, in document order.
 */
const choicePartsOf = (choices: readonly SimpleChoice[], path: string): readonly TemplatePart[] =>
  choices.flatMap((choice) => [
    ...Option.match(choice.templateVisibility, {
      onNone: () => [],
      onSome: (visibility): readonly TemplatePart[] => [
        {
          content: choice.content,
          identifier: choice.identifier,
          name: `the choice ${choice.identifier} at ${path}`,
          visibility,
        },
      ],
    }),
    // oxlint-disable-next-line eslint/no-use-before-define -- `choicePartsOf` and `templatePartsOf` are mutually recursive, as a choice's content holds body nodes; the call runs only after both are defined.
    ...templatePartsOf(choice.content),
  ]);

/**
 * Collect every template part of a run of body nodes, at any depth.
 *
 * @param nodes The body nodes.
 * @returns The parts, in document order.
 */
const templatePartsOf = (nodes: readonly BodyNode[]): readonly TemplatePart[] =>
  nodes.flatMap((node): readonly TemplatePart[] => {
    switch (node.kind) {
      case "element": {
        return templatePartsOf(node.children);
      }
      case "template-block":
      case "template-inline": {
        return [
          {
            content: node.content,
            identifier: node.identifier,
            name: `the ${node.kind} at ${node.path}`,
            visibility: node.templateVisibility,
          },
          ...templatePartsOf(node.content),
        ];
      }
      case "choice": {
        return [
          ...Option.toArray(node.prompt).flatMap((lead) => templatePartsOf(lead)),
          ...choicePartsOf(node.choices, node.path),
        ];
      }
      case "inline-choice": {
        return [
          ...Option.toArray(node.label).flatMap((lead) => templatePartsOf(lead)),
          ...choicePartsOf(node.choices, node.path),
        ];
      }
      case "extended-text": {
        return Option.toArray(node.prompt).flatMap((lead) => templatePartsOf(lead));
      }
      case "feedback-block":
      case "feedback-inline": {
        return templatePartsOf(node.content);
      }
      case "printed-variable":
      case "text":
      case "text-entry":
      case "unsupported": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * One thing a templated item or its record holds that its page must not see (P7§4.9), named.
 */
interface Exclusion {
  readonly kind:
    | "hidden template content"
    | "seed"
    | "template rules"
    | "template value"
    | "template visibility"
    | "template-set correct response"
    | "template-set default";
  readonly name: string;
}

/**
 * List what a templated subject must not show (P7§4.9): its template rules; each template part's
 * visibility; each part's content the values hide or cannot decide; and, under a record, its seed,
 * each template value (which shows only as a printed variable's text) and each correct response
 * and default template processing set.
 *
 * @param subject The item and its record.
 * @returns The exclusions, the sweep's check of each being {@link templateProblems} and
 *   {@link keyProblems}.
 */
const exclusionsOf = (subject: Subject): readonly Exclusion[] => {
  const parts = templatePartsOf(subject.item.body);

  return [
    ...Option.match(subject.item.templateProcessing, {
      onNone: () => [],
      onSome: (rules): readonly Exclusion[] => [
        { kind: "template rules", name: `${rules.length} rules` },
      ],
    }),
    ...parts.map((part): Exclusion => ({ kind: "template visibility", name: part.name })),
    ...parts
      .filter(
        (part) =>
          part.content.length > 0 &&
          !Option.getOrElse(decided(subject.record, part.visibility, part.identifier), () => false),
      )
      .map((part): Exclusion => ({ kind: "hidden template content", name: part.name })),
    ...Option.match(subject.record, {
      onNone: () => [],
      onSome: (record): readonly Exclusion[] => [
        { kind: "seed", name: record.seed },
        ...Object.keys(record.templates).map((name): Exclusion => ({
          kind: "template value",
          name,
        })),
        ...Object.keys(record.correct).map((name): Exclusion => ({
          kind: "template-set correct response",
          name,
        })),
        ...Object.keys(record.defaults).map((name): Exclusion => ({
          kind: "template-set default",
          name,
        })),
      ],
    }),
  ];
};

/**
 * A node of the body in the JSON form.
 */
type BodyNodeJson = RedactedJson["body"][number];

/**
 * The negative control's correct response, which its body never writes.
 */
const controlSecret = "zebra-77";

/**
 * The negative control's location.
 */
const controlLocation = "control.xml";

/**
 * The negative control, built by hand: a Text Entry whose correct response is
 * {@link controlSecret}, which neither its body nor its title writes.
 */
const controlBytes = new TextEncoder().encode(
  `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="control" title="Name the animal" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"><qti-correct-response><qti-value>${controlSecret}</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><p>Name the animal: <qti-text-entry-interaction response-identifier="RESPONSE"/></p></qti-item-body></qti-assessment-item>`,
);

/**
 * Forge a body in the JSON form: every Text Entry, at any depth, gains a `correct` key holding
 * {@link controlSecret}.
 *
 * @param nodes The honest body nodes.
 * @returns The forged nodes.
 */
const forgeBody = (nodes: readonly BodyNodeJson[]): readonly BodyNodeJson[] =>
  nodes.map((node): BodyNodeJson => {
    if (node.kind === "element") {
      return { ...node, children: forgeBody(node.children) };
    }

    if (node.kind === "text-entry") {
      const forged = { ...node, correct: [controlSecret] };

      return forged;
    }

    return node;
  });

describe("the allowlist sweep over the corpus", () => {
  it.effect(
    "every key of each rendered item's redacted JSON is a field of RedactedSchema, and none is a hidden field",
    () =>
      Effect.gen(function* everyKey() {
        const { problems, subjects } = yield* corpusSubjects;

        assert.isNotEmpty(subjects, "no corpus item renders");
        assert.deepStrictEqual([...problems, ...subjects.flatMap(keyProblems)], []);
      }),
    { tags: ["corpus"], timeout: sweepTimeoutMs },
  );

  it.effect(
    "no rendered item's secrets appear in its redacted JSON or in the HTML of its three states",
    () =>
      Effect.gen(function* noSecret() {
        const { problems, subjects } = yield* corpusSubjects;
        const checked = subjects.map((subject) => [subject, secretsOf(subject)] as const);
        const withSecrets = checked.filter(([, secrets]) => secrets.length > 0);
        const secretCount = withSecrets.flatMap(([, secrets]) => secrets).length;

        assert.isAbove(withSecrets.length, 0, "no rendered item has a secret to look for");
        assert.isAbove(secretCount, 0, "no secret was checked");
        assert.deepStrictEqual(
          [...problems, ...checked.flatMap(([subject, secrets]) => leakProblems(subject, secrets))],
          [],
        );
      }),
    { tags: ["corpus"], timeout: sweepTimeoutMs },
  );

  it.effect(
    "a forged JSON or HTML that holds a hand-built item's correct response is caught, and the honest one is not",
    () =>
      Effect.gen(function* negativeControl() {
        const verdict = yield* open(controlLocation, controlBytes);
        const member: Member = {
          bytes: controlBytes,
          location: controlLocation,
          verdict: Exit.succeed(verdict),
        };
        const made = subjectOf(member, yield* configure({}));
        if (Option.isNone(made) || Result.isFailure(made.value)) {
          assert.fail(`the control item does not render: ${verdict.verdict}`);
        }

        const honest = made.value.success;
        const secrets = secretsOf(honest);
        const forgedJson: Subject = {
          ...honest,
          json: {
            ...honest.json,
            body: forgeBody(honest.json.body),
            responses: honest.json.responses.map((response) => ({
              ...response,
              correct: [controlSecret],
            })),
          },
        };
        const forgedHtml: Subject = {
          ...honest,
          states: honest.states.map((state) => {
            const end = state.html.lastIndexOf("</");

            return {
              ...state,
              html: `${state.html.slice(0, end)}${controlSecret}${state.html.slice(end)}`,
            };
          }),
        };

        assert.deepStrictEqual(secrets, [{ origin: "correct response", text: controlSecret }]);
        assert.deepStrictEqual(keyProblems(honest), []);
        assert.deepStrictEqual(leakProblems(honest, secrets), []);
        assert.isTrue(Result.isFailure(decodeStrictly(forgedJson.json)));
        assert.deepStrictEqual(hiddenKeysOf(forgedJson.json), ["correct", "correct"]);
        assert.deepStrictEqual(leakProblems(forgedJson, secrets), [
          `${controlLocation}: the correct response "${controlSecret}" is in the JSON`,
        ]);
        assert.deepStrictEqual(
          leakProblems(forgedHtml, secrets),
          honest.states.map(
            (state) =>
              `${controlLocation}: the correct response "${controlSecret}" is in the HTML of ${state.name}`,
          ),
        );
      }),
  );
});

/**
 * The template control's location.
 */
const templateControlLocation = "template-control.xml";

/**
 * The template control, built by hand: template processing sets `SHOWN` to `A` and `NUMBER` to
 * 123; the body prints `NUMBER`, holds a template inline `SHOWN` shows (`A`) and one it hides
 * (`B`), and a Choice whose choices `A` and `B` the same variable shows and hides.
 */
const templateControlBytes = new TextEncoder().encode(
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="template-control" title="Pick the shown one" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-template-declaration identifier="SHOWN" cardinality="single" base-type="identifier"/><qti-template-declaration identifier="NUMBER" cardinality="single" base-type="integer"/><qti-template-processing><qti-set-template-value identifier="SHOWN"><qti-base-value base-type="identifier">A</qti-base-value></qti-set-template-value><qti-set-template-value identifier="NUMBER"><qti-base-value base-type="integer">123</qti-base-value></qti-set-template-value></qti-template-processing><qti-item-body><p>Number <qti-printed-variable identifier="NUMBER"/>: <qti-template-inline template-identifier="SHOWN" show-hide="show" identifier="A">shown words</qti-template-inline><qti-template-inline template-identifier="SHOWN" show-hide="show" identifier="B">hidden words</qti-template-inline></p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A" template-identifier="SHOWN" show-hide="show">Alpha</qti-simple-choice><qti-simple-choice identifier="B" template-identifier="SHOWN" show-hide="show">Beta</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>',
);

/**
 * Forge a redacted body: each node, at any depth, as `edit` gives it.
 *
 * @param nodes The honest body nodes.
 * @param edit The forgery of one node, its children already forged.
 * @returns The forged nodes.
 */
const forgeNodes = (
  nodes: readonly BodyNode[],
  edit: (node: BodyNode) => BodyNode,
): readonly BodyNode[] =>
  nodes.map((node) =>
    edit(node.kind === "element" ? { ...node, children: forgeNodes(node.children, edit) } : node),
  );

/**
 * Forge a subject's redacted fields: each body node as `edit` gives it.
 *
 * @param subject The honest subject.
 * @param edit The forgery of one node.
 * @returns The subject with the forged fields, its JSON the honest one.
 */
const forgeFields = (subject: Subject, edit: (node: BodyNode) => BodyNode): Subject => ({
  ...subject,
  redacted: { ...subject.redacted, body: forgeNodes(subject.redacted.body, edit) },
});

/**
 * Forge a template control's paragraph: the one child `chosen` picks, the printed variable's text
 * or its notice, becomes a text node of `text`.
 *
 * @param node One body node; any but the paragraph is left as it is.
 * @param chosen Picks the child to replace.
 * @param text The text the forgery prints there.
 * @returns The node, forged where it is the paragraph.
 */
const printedFilled = (
  node: BodyNode,
  chosen: (child: BodyNode) => boolean,
  text: string,
): BodyNode =>
  node.kind === "element" && node.tag === "p"
    ? {
        ...node,
        children: node.children.map((child): BodyNode =>
          chosen(child) ? { kind: "text", text } : child,
        ),
      }
    : node;

describe("the template sweep over the corpus", () => {
  it.effect(
    "[I-5] no accepted corpus item records a printed variable or param-variable parameter past its bound, with no record or under a sweep seed, so none fails render for it",
    () =>
      Effect.gen(function* noUnprinted() {
        const members = yield* openCorpus;
        const redactions = members.flatMap((member) =>
          Option.toArray(acceptedOf(member)).flatMap((accepted) =>
            (templated(accepted)
              ? Result.getOrElse(recordStates(accepted), (): readonly RecordState[] => [noRecord])
              : [noRecord]
            ).map((state) => ({
              location: `${member.location} (${state.name})`,
              unprinted: redact(accepted, Option.getOrUndefined(state.record)).unprinted,
            })),
          ),
        );

        assert.isNotEmpty(redactions, "no corpus item is accepted");
        assert.deepStrictEqual(
          redactions.flatMap(({ location, unprinted }) =>
            Option.isSome(unprinted) ? [location] : [],
          ),
          [],
        );
      }),
    { tags: ["corpus"], timeout: sweepTimeoutMs },
  );
  it.effect(
    "[I-5] every templated corpus item, redacted under two seeds and with no record, shows a template value only as a printed variable's text, and no hidden template content, template-set correct response or default, seed, template rule or template visibility, nor any of the core set",
    () =>
      Effect.gen(function* templateSweep() {
        const { files, problems, subjects } = yield* templatedSubjects;
        const swept: Record<string, number> = {};
        for (const subject of subjects) {
          swept[subject.state] = (swept[subject.state] ?? 0) + 1;
        }
        const exclusions = subjects.flatMap(exclusionsOf);

        assert.isAbove(files, 0, "no accepted corpus item has template processing");
        assert.deepStrictEqual(swept, {
          "no record": files,
          'seed "1"': files,
          'seed "2"': files,
        });
        assert.isNotEmpty(exclusions, "no templated item holds anything its page must not see");
        assert.isTrue(
          exclusions.some((exclusion) => exclusion.kind === "template visibility"),
          "no templated item has a template block, inline or choice with a template visibility",
        );
        assert.deepStrictEqual(
          [
            ...problems,
            ...subjects.flatMap((subject) => [
              ...keyProblems(subject),
              ...leakProblems(subject, secretsOf(subject)),
              ...templateProblems(subject),
            ]),
          ],
          [],
        );
      }),
    { tags: ["corpus"], timeout: sweepTimeoutMs },
  );

  it.effect(
    "[I-5] a forged redaction of a hand-built templated item that shows hidden template content, a hidden choice, a template visibility or the seed is caught, and the honest one is not",
    () =>
      Effect.gen(function* templateControl() {
        const verdict = yield* open(templateControlLocation, templateControlBytes);
        const member: Member = {
          bytes: templateControlBytes,
          location: templateControlLocation,
          verdict: Exit.succeed(verdict),
        };
        const accepted = Option.getOrElse(acceptedOf(member), () =>
          assert.fail(`the template control is ${verdict.verdict}`),
        );
        const configuration = yield* configure({});
        const subjects = Result.getOrThrow(recordStates(accepted)).map((state) => {
          const made = subjectOf(member, configuration, state);
          if (Option.isNone(made) || Result.isFailure(made.value)) {
            assert.fail(`the template control does not render under ${state.name}`);
          }

          return made.value.success;
        });
        const [honest, , unrecorded] = subjects;
        if (honest === undefined || unrecorded === undefined) {
          assert.fail("the template control lacks a record state");
        }

        const hiddenShown = forgeFields(honest, (node) =>
          node.kind === "element" && node.tag === "p"
            ? { ...node, children: [...node.children, { kind: "text", text: "hidden words" }] }
            : node,
        );
        const choiceShown = forgeFields(honest, (node) =>
          node.kind === "choice"
            ? {
                ...node,
                choices: [
                  ...node.choices,
                  {
                    content: [{ kind: "text", text: "Beta" }],
                    fixed: false,
                    identifier: "B",
                    templateVisibility: Option.none(),
                  },
                ],
              }
            : node,
        );
        const visibilityKept = forgeFields(honest, (node) =>
          node.kind === "choice"
            ? {
                ...node,
                choices: node.choices.map((choice) => ({
                  ...choice,
                  templateVisibility: Option.some({
                    showHide: "show" as const,
                    templateIdentifier: "SHOWN",
                  }),
                })),
              }
            : node,
        );
        const otherValue = forgeFields(honest, (node) =>
          printedFilled(node, (child) => child.kind === "text" && child.text === "123", "A"),
        );
        const valueForNotice = forgeFields(unrecorded, (node) =>
          printedFilled(
            node,
            (child) => child.kind === "unsupported" && child.feature === printedNotice,
            "123",
          ),
        );
        const noticeDropped: Subject = {
          ...unrecorded,
          redacted: {
            ...unrecorded.redacted,
            notices: unrecorded.redacted.notices.filter((notice) => notice !== choiceNotice),
          },
        };
        const forgedBody = honest.json.body.map((node): BodyNodeJson => {
          if (node.kind !== "choice") {
            return node;
          }

          const forged = {
            ...node,
            choices: node.choices.map((choice) => {
              const kept = {
                ...choice,
                templateVisibility: { showHide: "show", templateIdentifier: "SHOWN" },
              };

              return kept;
            }),
          };

          return forged;
        });
        const withSeed = { ...honest.json, body: forgedBody, seed: "1" };
        const forgedJson: Subject = { ...honest, json: withSeed };
        const inRecord = `${templateControlLocation} (seed "1")`;

        assert.deepStrictEqual(
          subjects.map((subject) => subject.state),
          ['seed "1"', 'seed "2"', "no record"],
        );
        assert.isFalse(isDeepStrictEqual(otherValue.redacted, honest.redacted));
        assert.isFalse(isDeepStrictEqual(valueForNotice.redacted, unrecorded.redacted));
        assert.isFalse(isDeepStrictEqual(noticeDropped.redacted, unrecorded.redacted));
        assert.deepStrictEqual(
          subjects.flatMap((subject) => [...keyProblems(subject), ...templateProblems(subject)]),
          [],
        );
        assert.deepStrictEqual(
          exclusionsOf(honest).map((exclusion) => exclusion.kind),
          [
            "template rules",
            "template visibility",
            "template visibility",
            "template visibility",
            "template visibility",
            "hidden template content",
            "hidden template content",
            "seed",
            "template value",
            "template value",
          ],
        );
        for (const forged of [hiddenShown, choiceShown, visibilityKept, otherValue]) {
          assert.deepStrictEqual(templateProblems(forged), [
            `${inRecord}: the redacted fields hold more than the item's body shows, or not as it writes it`,
          ]);
        }
        for (const forged of [valueForNotice, noticeDropped]) {
          assert.deepStrictEqual(templateProblems(forged), [
            `${templateControlLocation} (no record): the redacted fields hold more than the item's body shows, or not as it writes it`,
          ]);
        }
        assert.isTrue(Result.isFailure(decodeStrictly(forgedJson.json)));
        assert.deepStrictEqual(hiddenKeysOf(forgedJson.json), [
          "seed",
          "templateVisibility",
          "showHide",
          "templateIdentifier",
        ]);
      }),
  );
});
