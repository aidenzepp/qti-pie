import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { score } from "#plate/index.ts";
import type { Accepted } from "#plate/index.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Mapping,
  MapEntry,
  ResponseDeclaration,
  SimpleChoice,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import { format, trimXmlSpace } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { acceptedOf, openCorpus } from "#plate/test/sweep.ts";
import { templatePrefixes } from "#plate/vocabulary.ts";

/**
 * Opening the corpus (about 800 members) and scoring each templated item three times runs in
 * seconds here; the bound leaves room for a slow machine without letting a hung run stall the
 * suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The six built-in response-processing templates the scoring sweep covers, whichever of them the
 * engine runs today.
 */
const builtInTemplates = [
  "match_correct",
  "map_response",
  "map_response_point",
  "CC2_match",
  "CC2_match_basic",
  "CC2_map_response",
] as const;

/**
 * One of the six built-in templates.
 */
type BuiltIn = (typeof builtInTemplates)[number];

/**
 * The response every built-in template scores, and the outcome it sets.
 */
const response = "RESPONSE";

/**
 * A run of XML whitespace, which an `xs:anyURI` value collapses to one space.
 */
const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * The relative tolerance two float scores are equal within, so a sum the engine adds in another
 * order than the sweep still meets it.
 */
const floatTolerance = 1e-9;

/**
 * A single number a score is: the value of a single integer or float.
 */
type Numeric = Extract<Single, { readonly baseType: "float" | "integer" }>;

/**
 * An interaction a response can be bound to that renders.
 */
type Bound =
  | ChoiceInteraction
  | ExtendedTextInteraction
  | InlineChoiceInteraction
  | TextEntryInteraction;

/**
 * An item the sweep scores: an accepted item whose processing runs by a built-in template and
 * whose `RESPONSE` declares a correct response and is bound to one interaction that renders.
 */
interface Scored {
  readonly accepted: Accepted;
  readonly correct: Value;
  readonly declaration: ResponseDeclaration;
  readonly interaction: Bound;
  readonly kind: "scored";
  readonly location: string;
  readonly template: BuiltIn;
}

/**
 * An item processed by a built-in template that the sweep cannot score, with every reason.
 */
interface Skipped {
  readonly kind: "skipped";
  readonly location: string;
  readonly reasons: readonly string[];
  readonly template: BuiltIn;
}

/**
 * Give the built-in template a document's response processing runs by: its `template` URI, after
 * `xs:anyURI` whitespace collapsing, is one of the template prefixes followed by a built-in's
 * name, with or without `.xml`, and it holds no inline rules, which take precedence.
 *
 * @param source The document.
 * @returns The template, or none when the document has no such processing.
 */
const builtInOf = (source: SourceDocument): Option.Option<BuiltIn> => {
  const processing = source.root.children.find(
    (child): child is SourceElement =>
      child.kind === "element" &&
      child.namespace === qtiNamespace &&
      child.local === "qti-response-processing",
  );
  if (processing === undefined || processing.children.some((child) => child.kind === "element")) {
    return Option.none();
  }

  const uri = processing.attributes.find(
    (attribute) => attribute.namespace === "" && attribute.local === "template",
  );
  if (uri === undefined) {
    return Option.none();
  }

  const collapsed = trimXmlSpace(uri.value).replaceAll(xmlWhitespaceRun, " ");
  const prefix = templatePrefixes.find((candidate) => collapsed.startsWith(candidate));
  const rest = prefix === undefined ? "" : collapsed.slice(prefix.length);

  return Option.fromUndefinedOr(
    builtInTemplates.find((name) => rest === name || rest === `${name}.xml`),
  );
};

/**
 * Collect the interactions an item renders, in document order: those in its body and its body
 * elements. An interaction inside a Prompt or a choice's content is not counted.
 *
 * @param nodes The body nodes.
 * @returns The interactions.
 */
const interactionsOf = (nodes: readonly BodyNode[]): readonly Bound[] =>
  nodes.flatMap((node): readonly Bound[] => {
    switch (node.kind) {
      case "element": {
        return interactionsOf(node.children);
      }
      case "choice":
      case "extended-text":
      case "inline-choice":
      case "text-entry": {
        return [node];
      }
      case "text":
      case "unsupported": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Decide whether the sweep scores an accepted item its built-in template processes.
 *
 * @param location The item's corpus path.
 * @param accepted The accepted item.
 * @param template The template its processing names.
 * @returns The item to score, or the item skipped with every reason.
 */
const classify = (location: string, accepted: Accepted, template: BuiltIn): Scored | Skipped => {
  const { item } = accepted;
  const declaration = Option.fromUndefinedOr(item.responses.get(response));
  const bound = interactionsOf(item.body).filter(
    (interaction) => interaction.response === response,
  );
  const [interaction] = bound;
  const reasons = [
    ...(Option.isNone(declaration) ? [`${response} is not a response the model holds`] : []),
    ...(Option.isSome(declaration) && Option.isNone(declaration.value.correct)
      ? [`${response} declares no correct response`]
      : []),
    ...(Option.isNone(item.processing) ? ["the engine does not run its response processing"] : []),
    ...(bound.length === 0 ? [`${response} is bound to no interaction that renders`] : []),
    ...(bound.length > 1 ? [`${response} is bound to ${bound.length} interactions`] : []),
  ];

  if (
    reasons.length > 0 ||
    Option.isNone(declaration) ||
    Option.isNone(declaration.value.correct) ||
    interaction === undefined
  ) {
    return { kind: "skipped", location, reasons, template };
  }

  return {
    accepted,
    correct: declaration.value.correct.value,
    declaration: declaration.value,
    interaction,
    kind: "scored",
    location,
    template,
  };
};

/**
 * Every accepted corpus item whose processing runs by a built-in template, scored or skipped, in
 * the set's order. It runs once per test file, as `openCorpus` does.
 */
const templated = Effect.runSync(
  Effect.cached(
    Effect.gen(function* templatedItems() {
      const entries: (Scored | Skipped)[] = [];
      for (const member of yield* openCorpus) {
        const accepted = acceptedOf(member);
        if (Option.isSome(accepted)) {
          const template = builtInOf(yield* readSource(member.location, member.bytes));
          if (Option.isSome(template)) {
            entries.push(classify(member.location, accepted.value, template.value));
          }
        }
      }

      return entries;
    }),
  ),
);

/**
 * The items the sweep scores.
 */
const scoredItems = templated.pipe(
  Effect.map((entries) => entries.filter((entry): entry is Scored => entry.kind === "scored")),
);

/**
 * Report whether two single values are the same value: the same base type and the same lexical
 * form.
 *
 * @param left One value.
 * @param right The other.
 * @returns Whether they are equal.
 */
const sameSingle = (left: Single, right: Single): boolean =>
  left.baseType === right.baseType && format(left) === format(right);

/**
 * Fold a string's case for a case-insensitive comparison.
 *
 * @param text The string.
 * @returns Its folded form.
 */
const folded = (text: string): string => text.toUpperCase().toLowerCase();

/**
 * Report whether a map entry's key matches a response value: with case folded for a string key
 * that is not `case-sensitive`, exactly for every other key.
 *
 * @param entry The map entry.
 * @param single The response value.
 * @returns Whether the entry maps it.
 */
const keyMatches = (entry: MapEntry, single: Single): boolean =>
  !entry.caseSensitive && entry.key.baseType === "string" && single.baseType === "string"
    ? folded(entry.key.value) === folded(single.value)
    : sameSingle(entry.key, single);

/**
 * Give the value a mapping maps one response value to: the first matching entry's value in
 * document order (the engine's placeholder for map-entry ties), else the default.
 *
 * @param mapping The mapping.
 * @param single The response value.
 * @returns The mapped value.
 */
const mappedOf = (mapping: Mapping, single: Single): number =>
  mapping.entries.find((entry) => keyMatches(entry, single))?.value ?? mapping.defaultValue;

/**
 * Report whether a response value matches at most one map key, so scoring it meets no map-entry
 * tie (P1§12 Q5).
 *
 * @param mapping The response's mapping, none when it has none.
 * @param single The response value.
 * @returns Whether it matches no key or one.
 */
const untied = (mapping: Option.Option<Mapping>, single: Single): boolean =>
  Option.match(mapping, {
    onNone: () => true,
    onSome: ({ entries }) => entries.filter((entry) => keyMatches(entry, single)).length <= 1,
  });

/**
 * Clamp a mapped sum by a mapping's bounds.
 *
 * @param mapping The mapping.
 * @param sum The sum.
 * @returns The sum within `lower-bound` and `upper-bound`.
 */
const clamped = (mapping: Mapping, sum: number): number =>
  Math.min(
    Option.getOrElse(mapping.upperBound, () => Number.POSITIVE_INFINITY),
    Math.max(
      Option.getOrElse(mapping.lowerBound, () => Number.NEGATIVE_INFINITY),
      sum,
    ),
  );

/**
 * Give the value a mapping maps each of an interaction's choices to, in their order.
 *
 * @param mapping The response's mapping.
 * @param choices The choices.
 * @returns Each choice's mapped value.
 */
const choiceValues = (mapping: Mapping, choices: readonly SimpleChoice[]): readonly number[] =>
  choices.map((choice) => mappedOf(mapping, { baseType: "identifier", value: choice.identifier }));

/**
 * Give the largest score a mapping gives a response the interaction admits (Q17): for a single
 * Choice or an Inline Choice, its choices' largest mapped value; for a multiple Choice, the sum of
 * its choices' largest positive mapped values, as many as `max-choices` allows; for a single text
 * response, the largest mapped value or the default. The bounds then clamp it.
 *
 * @param mapping The response's mapping.
 * @param scored The item, with its response's declaration and interaction.
 * @returns The maximum, or why the sweep cannot give one.
 */
const mappingMaximum = (mapping: Mapping, scored: Scored): Result.Result<number, string> => {
  const { declaration, interaction } = scored;
  switch (interaction.kind) {
    case "choice": {
      const values = choiceValues(mapping, interaction.choices);
      if (interaction.cardinality === "single") {
        return Result.succeed(clamped(mapping, Math.max(...values)));
      }

      const positive = values.filter((value) => value > 0).toSorted((left, right) => right - left);
      const taken =
        interaction.maxChoices > 0n ? positive.slice(0, Number(interaction.maxChoices)) : positive;
      let sum = 0;
      for (const value of taken) {
        sum += value;
      }

      return Result.succeed(clamped(mapping, sum));
    }
    case "inline-choice": {
      return Result.succeed(
        clamped(mapping, Math.max(...choiceValues(mapping, interaction.choices))),
      );
    }
    case "extended-text":
    case "text-entry": {
      return declaration.cardinality === "single"
        ? Result.succeed(
            clamped(
              mapping,
              Math.max(mapping.defaultValue, ...mapping.entries.map((entry) => entry.value)),
            ),
          )
        : Result.fail(`the sweep gives no maximum for a ${declaration.cardinality} text response`);
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Read an outcome's value as a single number.
 *
 * @param value The outcome's value.
 * @returns Its single integer or float, or none for any other value.
 */
const numericOf = (value: Value): Option.Option<Numeric> => {
  const [single] = value.values;

  return value.cardinality === "single" &&
    value.values.length === 1 &&
    (single?.baseType === "float" || single?.baseType === "integer")
    ? Option.some(single)
    : Option.none();
};

/**
 * Read one of an item's outcomes at the value an attempt starts from, as a single number.
 *
 * @param scored The item.
 * @param outcome The outcome's identifier.
 * @returns Its default, else 0 for a single integer or float, or why that is not a single number.
 */
const startingNumber = (scored: Scored, outcome: string): Result.Result<Numeric, string> => {
  const starting = Option.fromUndefinedOr(outcomeDefaults(scored.accepted.item)[outcome]);

  return Result.fromOption(
    starting.pipe(Option.flatMap(numericOf)),
    () => `${outcome} does not start as a single number`,
  );
};

/**
 * Give the maximum a template scores an item at (Q17): 1 for `match_correct` and `CC2_match`;
 * `MAXSCORE`'s default for `CC2_match_basic`; for the mapping templates, the mapping's maximum.
 *
 * @param scored The item.
 * @returns The maximum, or why the sweep cannot give one.
 */
const maximumOf = (scored: Scored): Result.Result<Numeric, string> => {
  const { declaration, template } = scored;
  switch (template) {
    case "match_correct":
    case "CC2_match": {
      return Result.succeed({ baseType: "float", value: 1 });
    }
    case "CC2_match_basic": {
      return startingNumber(scored, "MAXSCORE");
    }
    case "map_response":
    case "CC2_map_response": {
      return Option.match(declaration.mapping, {
        onNone: () => Result.fail(`${response} declares no mapping`),
        onSome: (mapping) =>
          Result.map(mappingMaximum(mapping, scored), (value): Numeric => ({
            baseType: "float",
            value,
          })),
      });
    }
    case "map_response_point": {
      return Result.fail("a point response is bound to no interaction plate renders");
    }
    default: {
      return template satisfies never;
    }
  }
};

/**
 * Give the score a template gives no response (its NULL result): `SCORE`'s starting value for
 * `CC2_match_basic`, which sets no score then, and 0 for every other template.
 *
 * @param scored The item.
 * @returns The NULL result, or why it is not a single number.
 */
const nullResultOf = (scored: Scored): Result.Result<Numeric, string> =>
  scored.template === "CC2_match_basic"
    ? startingNumber(scored, "SCORE")
    : Result.succeed({ baseType: "float", value: 0 });

/**
 * Build a value of the response's declared base type and cardinality.
 *
 * @param declaration The response's declaration.
 * @param values Its values.
 * @returns The value.
 */
const valueOf = (declaration: ResponseDeclaration, values: readonly Single[]): Value => ({
  baseType: declaration.baseType,
  cardinality: declaration.cardinality,
  values,
});

/**
 * Give the `n`th candidate text value of a base type, so some candidate equals no key and no
 * correct value.
 *
 * @param baseType The text response's base type.
 * @param index The candidate's index.
 * @returns The candidate.
 */
const textCandidate = (baseType: TextEntryInteraction["baseType"], index: number): Single => {
  switch (baseType) {
    case "float": {
      return { baseType, value: index };
    }
    case "integer": {
      return { baseType, value: BigInt(index) };
    }
    case "string": {
      return { baseType, value: `plate sweep ${index}` };
    }
    default: {
      return baseType satisfies never;
    }
  }
};

/**
 * Give a presented choice outside the correct response that matches at most one map key.
 *
 * @param scored The item, with its correct response and declaration.
 * @param choices The interaction's choices.
 * @returns The choice's identifier, or why none qualifies.
 */
const outsideChoice = (
  scored: Scored,
  choices: readonly SimpleChoice[],
): Result.Result<Single, string> => {
  const { correct, declaration } = scored;
  const outside = choices
    .map((choice): Single => ({ baseType: "identifier", value: choice.identifier }))
    .find(
      (single) =>
        !correct.values.some((value) => sameSingle(value, single)) &&
        untied(declaration.mapping, single),
    );

  return outside === undefined
    ? Result.fail("every presented choice is in the correct response or ties map keys")
    : Result.succeed(outside);
};

/**
 * Construct a wrong text response: a value no key and no correct value equals.
 *
 * @param scored The item, with its correct response and declaration.
 * @param baseType The text response's base type.
 * @returns The wrong response, or why none can be constructed.
 */
const wrongText = (
  scored: Scored,
  baseType: TextEntryInteraction["baseType"],
): Result.Result<Value, string> => {
  const { correct, declaration } = scored;
  const keys = Option.match(declaration.mapping, {
    onNone: () => [],
    onSome: ({ entries }) => entries.map((entry) => entry.key),
  });
  const taken = [...keys, ...correct.values];
  for (let index = 0; index <= taken.length; index += 1) {
    const candidate = textCandidate(baseType, index);
    if (
      !taken.some((value) =>
        value.baseType === "string" && candidate.baseType === "string"
          ? folded(value.value) === folded(candidate.value)
          : sameSingle(value, candidate),
      )
    ) {
      return Result.succeed(valueOf(declaration, [candidate]));
    }
  }

  return Result.fail("every candidate text value equals a key or a correct value");
};

/**
 * Construct a wrong response (Q17): a presented choice outside the correct response for a single
 * Choice or an Inline Choice; the correct set with its last choice swapped for one outside it for
 * a multiple Choice; for text, a value no key and no correct value equals. A choice brought in
 * matches at most one map key.
 *
 * @param scored The item.
 * @returns The wrong response, or why none can be constructed.
 */
const wrongOf = (scored: Scored): Result.Result<Value, string> => {
  const { correct, declaration, interaction } = scored;
  switch (interaction.kind) {
    case "choice": {
      return Result.map(outsideChoice(scored, interaction.choices), (outside) =>
        valueOf(
          declaration,
          interaction.cardinality === "single"
            ? [outside]
            : [...correct.values.slice(0, -1), outside],
        ),
      );
    }
    case "inline-choice": {
      return Result.map(outsideChoice(scored, interaction.choices), (outside) =>
        valueOf(declaration, [outside]),
      );
    }
    case "extended-text":
    case "text-entry": {
      return wrongText(scored, interaction.baseType);
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Score one attempt from a fresh record and read `SCORE` from the record it returns.
 *
 * @param scored The item.
 * @param responses The responses, none for no response.
 * @returns `SCORE` as a single number, or what failed.
 */
const scoreOf = (
  scored: Scored,
  responses: Readonly<Record<string, Value>>,
): Result.Result<Numeric, string> =>
  Result.gen(function* scoreOnce() {
    const stored = yield* Result.mapError(
      score(scored.accepted, responses),
      (error) => `score failed: ${error._tag}: ${error.message}`,
    );
    const record = yield* Result.mapError(
      decodeRecord(stored),
      (error) => `the record does not decode: ${error.message}`,
    );

    return yield* Result.fromOption(
      Option.flatMap(Option.fromUndefinedOr(record.outcomes["SCORE"]), numericOf),
      () => "SCORE is not a single number",
    );
  });

/**
 * Read a single number as a float.
 *
 * @param single The number.
 * @returns Its value as a float.
 */
const asFloat = (single: Numeric): number =>
  single.baseType === "integer" ? Number(single.value) : single.value;

/**
 * Order two scores: exactly when both are integers, else as floats equal within
 * {@link floatTolerance} of the larger.
 *
 * @param left One score.
 * @param right The other.
 * @returns -1, 0 or 1 as `left` is below, at or above `right`.
 */
const compare = (left: Numeric, right: Numeric): -1 | 0 | 1 => {
  if (left.baseType === "integer" && right.baseType === "integer") {
    if (left.value === right.value) {
      return 0;
    }

    return left.value < right.value ? -1 : 1;
  }

  const [low, high] = [asFloat(left), asFloat(right)];
  if (Math.abs(low - high) <= floatTolerance * Math.max(1, Math.abs(low), Math.abs(high))) {
    return 0;
  }

  return low < high ? -1 : 1;
};

/**
 * Collect the problems one check finds in every scored item, naming the item and its template.
 *
 * @param items The scored items.
 * @param problemsOf The check, giving what fails for one item, or why it cannot run.
 * @returns Every problem, empty when every item holds.
 */
const sweepProblems = (
  items: readonly Scored[],
  problemsOf: (scored: Scored) => Result.Result<Option.Option<string>, string>,
): readonly string[] =>
  items.flatMap((scored) => {
    const where = `${scored.location} (${scored.template})`;

    return Result.match(problemsOf(scored), {
      onFailure: (reason) => [`${where}: ${reason}`],
      onSuccess: (problem) =>
        Option.match(problem, { onNone: () => [], onSome: (text) => [`${where}: ${text}`] }),
    });
  });

describe("the scoring sweep over the corpus", () => {
  it.effect(
    "[I-9b] each item a built-in template scores scores its correct response at the template's maximum",
    () =>
      Effect.gen(function* correctAtMaximum() {
        const items = yield* scoredItems;
        const problems = sweepProblems(items, (scored) =>
          Result.gen(function* correctScore() {
            const maximum = yield* maximumOf(scored);
            const got = yield* scoreOf(scored, { [response]: scored.correct });

            return compare(got, maximum) === 0
              ? Option.none()
              : Option.some(
                  `the correct response scores ${got.value}, the maximum is ${maximum.value}`,
                );
          }),
        );

        assert.isNotEmpty(items, "no corpus item is scored by a built-in template");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9b] each item a built-in template scores scores a constructed wrong response below the maximum",
    () =>
      Effect.gen(function* wrongBelowMaximum() {
        const problems = sweepProblems(yield* scoredItems, (scored) =>
          Result.gen(function* wrongScore() {
            const maximum = yield* maximumOf(scored);
            const wrong = yield* wrongOf(scored);
            const got = yield* scoreOf(scored, { [response]: wrong });

            return compare(got, maximum) === -1
              ? Option.none()
              : Option.some(
                  `the wrong response ${JSON.stringify(wrong.values.map((single) => String(single.value)))} scores ${got.value}, not below the maximum ${maximum.value}`,
                );
          }),
        );

        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9b] each item a built-in template scores gives no response the template's NULL result",
    () =>
      Effect.gen(function* noResponse() {
        const problems = sweepProblems(yield* scoredItems, (scored) =>
          Result.gen(function* nullScore() {
            const expected = yield* nullResultOf(scored);
            const got = yield* scoreOf(scored, {});

            return compare(got, expected) === 0
              ? Option.none()
              : Option.some(
                  `no response scores ${got.value}, the NULL result is ${expected.value}`,
                );
          }),
        );

        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[Q-12] each item a built-in template scores through an Inline Choice scores its correct response at the maximum and a wrong one below it",
    () =>
      Effect.gen(function* inlineChoiceScores() {
        const items = (yield* scoredItems).filter(
          (scored) => scored.interaction.kind === "inline-choice",
        );
        const problems = sweepProblems(items, (scored) =>
          Result.gen(function* inlineChoiceScore() {
            const maximum = yield* maximumOf(scored);
            const right = yield* scoreOf(scored, { [response]: scored.correct });
            const wrong = yield* wrongOf(scored);
            const below = yield* scoreOf(scored, { [response]: wrong });

            return compare(right, maximum) === 0 && compare(below, maximum) === -1
              ? Option.none()
              : Option.some(
                  `the correct response scores ${right.value} and the wrong one ${below.value}, the maximum is ${maximum.value}`,
                );
          }),
        );

        assert.isNotEmpty(
          items,
          "no corpus item a built-in template scores binds its response to an Inline Choice",
        );
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );
});
