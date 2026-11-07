import { isDeepStrictEqual } from "node:util";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option, Predicate, Result, Schema } from "effect";
import { RedactedSchema } from "#plate/codec/redacted.ts";
import { configure, encodeRedacted, open, redact } from "#plate/index.ts";
import type { Accepted, Configuration, RedactedJson } from "#plate/index.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  Expression,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Item,
  ResponseDeclaration,
  Rule,
  SimpleChoice,
  TemplateVisibility,
} from "#plate/model/item.ts";
import type { ItemRecord, RedactRecord } from "#plate/model/record.ts";
import { format } from "#plate/model/values.ts";
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
 * The keys no redacted item's JSON holds at any depth, whatever the field sits under.
 */
const hiddenKeys: ReadonlySet<string> = new Set([
  ...hiddenItemFields,
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
 * One place in a redacted body, as the item and the values decide it: a node the item writes,
 * which the page sees as written, its descendants decided again; or a printed variable, which the
 * page sees as the one text node it prints, as nothing, or as its notice.
 */
type Slot =
  | { readonly kind: "node"; readonly node: BodyNode }
  | { readonly kind: "printed"; readonly path: string };

/**
 * Give the places the page may see for a run of the item's body nodes: a printed variable is a
 * printed place; a template block or inline is its content's places where the values show it,
 * nothing where they hide it, and its notice where they cannot say; any other node is itself.
 *
 * @param nodes The item's body nodes.
 * @param values The values `redact` showed the item by.
 * @returns The places, in document order.
 */
const slotsOf = (
  nodes: readonly BodyNode[],
  values: Option.Option<RedactRecord>,
): readonly Slot[] =>
  nodes.flatMap((node): readonly Slot[] => {
    if (node.kind === "printed-variable") {
      return [{ kind: "printed", path: node.path }];
    }

    if (node.kind === "template-block" || node.kind === "template-inline") {
      return Option.match(decided(values, node.templateVisibility, node.identifier), {
        onNone: (): readonly Slot[] => [
          {
            kind: "node",
            node: { feature: `qti-${node.kind}`, kind: "unsupported", path: node.path },
          },
        ],
        onSome: (shown) => (shown ? slotsOf(node.content, values) : []),
      });
    }

    return [{ kind: "node", node }];
  });

/**
 * Report whether a run of redacted body nodes fills the places the item gives, in order: each
 * written node by a node that {@link nodeFits} it, and each printed place by one text node, by
 * nothing, or by the printed variable's notice. Every way a printed place may be filled is tried,
 * so a printed value equal to the text after it is matched either way.
 *
 * @param slots The places, from {@link slotsOf}.
 * @param nodes The redacted nodes.
 * @param values The values `redact` showed the item by.
 * @returns Whether the nodes fill the places and hold nothing more.
 */
const fits = (
  slots: readonly Slot[],
  nodes: readonly BodyNode[],
  values: Option.Option<RedactRecord>,
): boolean => {
  const [slot, ...later] = slots;
  const [node, ...after] = nodes;
  if (slot === undefined) {
    return node === undefined;
  }

  if (slot.kind === "printed") {
    const printed =
      node !== undefined &&
      (node.kind === "text" ||
        isDeepStrictEqual(node, {
          feature: "qti-printed-variable",
          kind: "unsupported",
          path: slot.path,
        }));

    return (printed && fits(later, after, values)) || fits(later, nodes, values);
  }

  return (
    node !== undefined &&
    // oxlint-disable-next-line eslint/no-use-before-define -- `fits` and `nodeFits` are mutually recursive, as an element's children are body nodes; the call runs only after both are defined.
    nodeFits(slot.node, node, values) &&
    fits(later, after, values)
  );
};

/**
 * Report whether a redacted Prompt or Label fills the item's: both absent, or both present and
 * the redacted nodes {@link fits} the item's.
 *
 * @param written The item's lead.
 * @param shown The redacted lead.
 * @param values The values `redact` showed the item by.
 * @returns Whether the redacted lead fits.
 */
const leadFits = (
  written: Option.Option<readonly BodyNode[]>,
  shown: Option.Option<readonly BodyNode[]>,
  values: Option.Option<RedactRecord>,
): boolean =>
  Option.match(written, {
    onNone: () => Option.isNone(shown),
    onSome: (nodes) =>
      Option.exists(shown, (redacted) => fits(slotsOf(nodes, values), redacted, values)),
  });

/**
 * Report whether an interaction's redacted choices are the item's choices the values show, in
 * order: each with the item's identifier and `fixed`, content that {@link fits} the item's, and no
 * template visibility. A choice with no template visibility is always shown, and one the values
 * hide or cannot decide is absent.
 *
 * @param written The item's choices.
 * @param shown The redacted choices.
 * @param values The values `redact` showed the item by.
 * @returns Whether the redacted choices fit.
 */
const choicesFit = (
  written: readonly SimpleChoice[],
  shown: readonly SimpleChoice[],
  values: Option.Option<RedactRecord>,
): boolean => {
  const visible = written.filter((choice) =>
    Option.match(choice.templateVisibility, {
      onNone: () => true,
      onSome: (visibility) =>
        Option.getOrElse(decided(values, visibility, choice.identifier), () => false),
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
        fits(slotsOf(choice.content, values), page.content, values)
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
 * @param values The values `redact` showed the item by.
 * @returns Whether the redacted node fits.
 */
const interactionFits = (
  written: ChoiceInteraction | ExtendedTextInteraction | InlineChoiceInteraction,
  shown: BodyNode,
  values: Option.Option<RedactRecord>,
): boolean => {
  if (written.kind === "choice") {
    return (
      shown.kind === "choice" &&
      isDeepStrictEqual({ ...written, choices: shown.choices, prompt: shown.prompt }, shown) &&
      leadFits(written.prompt, shown.prompt, values) &&
      choicesFit(written.choices, shown.choices, values)
    );
  }

  if (written.kind === "inline-choice") {
    return (
      shown.kind === "inline-choice" &&
      isDeepStrictEqual({ ...written, choices: shown.choices, label: shown.label }, shown) &&
      leadFits(written.label, shown.label, values) &&
      choicesFit(written.choices, shown.choices, values)
    );
  }

  return (
    shown.kind === "extended-text" &&
    isDeepStrictEqual({ ...written, prompt: shown.prompt }, shown) &&
    leadFits(written.prompt, shown.prompt, values)
  );
};

/**
 * Report whether a redacted node is the item's node as the page may see it: every field as the
 * item writes it, and its children, Prompt, Label or choices fitting the item's again. No
 * redacted node is a printed variable or a template block or inline: {@link slotsOf} gives none
 * as a written node.
 *
 * @param written The item's node.
 * @param shown The redacted node.
 * @param values The values `redact` showed the item by.
 * @returns Whether the redacted node fits.
 */
const nodeFits = (
  written: BodyNode,
  shown: BodyNode,
  values: Option.Option<RedactRecord>,
): boolean => {
  switch (written.kind) {
    case "element": {
      return (
        shown.kind === "element" &&
        isDeepStrictEqual({ ...written, children: shown.children }, shown) &&
        fits(slotsOf(written.children, values), shown.children, values)
      );
    }
    case "choice":
    case "extended-text":
    case "inline-choice": {
      return interactionFits(written, shown, values);
    }
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
 * The notices a redaction adds in a withheld part's place, beside the item's own: a printed
 * variable's, a template block's, a template inline's, and the one for withheld choices.
 */
const templateNotices = [
  "qti-printed-variable",
  "qti-template-block",
  "qti-template-inline",
  "template-identifier",
] as const;

/**
 * Report whether redacted fields are the item's as the page may see them (P7§4.9): the document,
 * identifier, `lang`, title and response bindings as the item holds them; a body that
 * {@link fits} the item's, so a template value shows only as a printed variable's text, and no
 * hidden template content, template visibility, template-set correct response or default, seed
 * or template rule shows at all; and notices that name only features.
 *
 * @param item The item.
 * @param fields The redacted fields, as `redact` gave them or as the JSON decodes.
 * @param values The values `redact` showed the item by.
 * @returns Whether the fields hold nothing the item's body does not show.
 */
const fieldsFit = (
  item: Item,
  fields: RedactedFields,
  values: Option.Option<RedactRecord>,
): boolean => {
  const notices = new Set<string>([
    ...item.unsupported.map((entry) => entry.feature),
    ...templateNotices,
  ]);

  return (
    isDeepStrictEqual(
      {
        body: fields.body,
        document: item.document,
        identifier: item.identifier,
        lang: item.lang,
        notices: fields.notices,
        responses: Array.from(item.responses.values(), ({ baseType, cardinality, identifier }) => ({
          baseType,
          cardinality,
          identifier,
        })),
        title: item.title,
      },
      { ...fields },
    ) &&
    fits(slotsOf(item.body, values), fields.body, values) &&
    fields.notices.every((notice) => notices.has(notice))
  );
};

/**
 * Check a templated item's redaction against the exclusion set (P7§4.9): its redacted fields, and
 * its JSON as decoded, each {@link fieldsFit} the item.
 *
 * @param subject The item, its redaction and its JSON.
 * @returns Each problem, naming the item and its record state; empty when both fit. A JSON that
 *   does not decode is {@link keyProblems}' to report.
 */
const templateProblems = (subject: Subject): readonly string[] => [
  ...(fieldsFit(subject.item, subject.redacted, subject.record)
    ? []
    : [
        `${subject.location}: the redacted fields hold more than the item's body shows, or not as it writes it`,
      ]),
  ...Result.match(decodeStrictly(subject.json), {
    onFailure: () => [],
    onSuccess: (fields) =>
      fieldsFit(subject.item, fields, subject.record)
        ? []
        : [
            `${subject.location}: the JSON holds more than the item's body shows, or not as it writes it`,
          ],
  }),
];

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

describe("the template sweep over the corpus", () => {
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
        const [honest] = subjects;
        if (honest === undefined) {
          assert.fail("the template control has no record state");
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
        for (const forged of [hiddenShown, choiceShown, visibilityKept]) {
          assert.deepStrictEqual(templateProblems(forged), [
            `${inRecord}: the redacted fields hold more than the item's body shows, or not as it writes it`,
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
