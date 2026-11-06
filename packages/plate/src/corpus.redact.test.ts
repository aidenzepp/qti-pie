import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option, Predicate, Result, Schema } from "effect";
import { RedactedSchema } from "#plate/codec/redacted.ts";
import { configure, encodeRedacted, open, redact } from "#plate/index.ts";
import type { Accepted, Configuration, RedactedJson } from "#plate/index.ts";
import type { Expression, Item, ResponseDeclaration, Rule } from "#plate/model/item.ts";
import { format } from "#plate/model/values.ts";
import type { Single } from "#plate/model/values.ts";
import { acceptedOf, openCorpus, threeStates } from "#plate/test/sweep.ts";
import type { Member, RenderState } from "#plate/test/sweep.ts";

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
 * The fields of an item that hold what the page must not know: its outcome declarations and its
 * response processing.
 */
const hiddenItemFields = ["outcomes", "processing"] as const satisfies readonly (keyof Item)[];

/**
 * The keys no redacted item's JSON holds at any depth, whatever the field sits under.
 */
const hiddenKeys: ReadonlySet<string> = new Set([...hiddenItemFields, ...hiddenResponseFields]);

/**
 * Matches a text of three characters (code points) or more, the shortest secret the sweep looks
 * for: a shorter value occurs in unrelated text by chance too often to say anything.
 */
const longEnough = /.{3}/su;

/**
 * Where an item holds a secret.
 */
type SecretOrigin = "area-map entry" | "correct response" | "mapping key" | "processing base value";

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
  readonly location: string;
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
 * Collect the values an expression's `qti-base-value` expressions hold, the expression's own and
 * its sub-expressions' at any depth.
 *
 * Sub-expressions sit in `operands`, as in every expression the model holds, so an expression kind
 * the engine gains later is walked without a change here.
 *
 * @param expression The expression.
 * @returns The base values' single values, in document order.
 */
const expressionValuesOf = (expression: Expression): readonly Single[] =>
  expression.kind === "base-value"
    ? expression.value.values
    : expression.operands.flatMap((operand) => expressionValuesOf(operand));

/**
 * Collect every value the `qti-base-value` expressions of a run of response rules hold, at any
 * depth.
 *
 * @param rules The rules, the item's response processing or a branch of it.
 * @returns The base values' single values, in document order.
 */
const baseValuesOf = (rules: readonly Rule[]): readonly Single[] =>
  rules.flatMap((rule) =>
    rule.kind === "condition"
      ? [
          ...rule.branches.flatMap((branch) => [
            ...expressionValuesOf(branch.when),
            ...baseValuesOf(branch.then),
          ]),
          ...baseValuesOf(Option.getOrElse(rule.otherwise, () => [])),
        ]
      : expressionValuesOf(rule.expression),
  );

/**
 * List the values an item holds that its page must not see, before any is judged a secret: the
 * lexical form of each correct response value, mapping key and processing base value, and each
 * area-map entry's `coords`.
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
    onSome: (rules) =>
      baseValuesOf(rules).map((single) => ({
        origin: "processing base value" as const,
        text: format(single),
      })),
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
 * Make the subject the sweep checks of one member: its accepted item, encoded and rendered in its
 * three states.
 *
 * @param member The opened member.
 * @param configuration The configuration every state renders with.
 * @returns None when the member is not an accepted item that renders; otherwise the subject, or
 *   a problem when `encodeRedacted` refused the redaction.
 */
const subjectOf = (
  member: Member,
  configuration: Configuration,
): Option.Option<Result.Result<Subject, string>> =>
  Option.flatMap(acceptedOf(member), (accepted: Accepted) =>
    Option.map(Result.getSuccess(threeStates(accepted, configuration)), (states) =>
      Result.match(encodeRedacted(redact(accepted)), {
        onFailure: (error) =>
          Result.fail(`${member.location}: encodeRedacted refused: ${error.message}`),
        onSuccess: (json) =>
          Result.succeed({
            bodySource: bodySourceOf(member.bytes),
            item: accepted.item,
            json,
            location: member.location,
            states,
          }),
      }),
    ),
  );

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
