import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { score, solution } from "#plate/index.ts";
import type { Accepted, StoredRecord } from "#plate/index.ts";
import { isStubbed } from "#plate/model/interactions.ts";
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
import { format, isNull, trimXmlSpace } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { splitResponses } from "#plate/score.ts";
import { acceptedOf, begunUnder, openCorpus, sweepSeeds, templated } from "#plate/test/sweep.ts";
import { templatePrefixes } from "#plate/vocabulary.ts";

/**
 * Opening the corpus (about 800 members) and scoring each item a built-in template processes three
 * times, an item whose template processing runs once more under each sweep seed, runs in seconds
 * here; the bound leaves room for a slow machine without letting a hung run stall the suite.
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
 * whose `RESPONSE` has a correct response and is bound to one interaction that renders. An item
 * whose template processing runs is scored once under each sweep seed, over the record `begin`
 * starts under it, and its correct response is the one `solution` reads from that record.
 */
interface Scored {
  readonly accepted: Accepted;
  readonly correct: Value;
  readonly declaration: ResponseDeclaration;
  readonly interaction: Bound;
  readonly kind: "scored";
  readonly location: string;
  /**
   * The record every attempt is scored over: `begin`'s under {@link Scored.seed} for an item whose
   * template processing runs; none for any other, which `score` starts from its declared defaults.
   */
  readonly record: Option.Option<StoredRecord>;
  /**
   * The sweep seed the record was begun under, which a failure names so the run repeats; none for
   * an item whose template processing does not run.
   */
  readonly seed: Option.Option<string>;
  readonly template: BuiltIn;
}

/**
 * An item processed by a built-in template that the sweep cannot score, with every reason.
 */
interface Skipped {
  readonly kind: "skipped";
  readonly location: string;
  readonly reasons: readonly string[];
  /**
   * The sweep seed the item's record was begun under, which a failure names; none for an item
   * whose template processing does not run.
   */
  readonly seed: Option.Option<string>;
  readonly template: BuiltIn;
}

/**
 * The record an item whose template processing runs is scored over under one sweep seed: the form
 * the host stores, which `score` takes, and the correct responses `solution` reads from it.
 */
interface Begun {
  readonly correct: Readonly<Record<string, Value>>;
  readonly record: StoredRecord;
  readonly seed: string;
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
 * elements. An interaction inside a Prompt or a choice's content is not counted, nor one inside a
 * template block or inline, which renders only where a template value shows it.
 *
 * @param nodes The body nodes.
 * @returns The interactions.
 */
const interactionsOf = (nodes: readonly BodyNode[]): readonly Bound[] =>
  nodes.flatMap((node): readonly Bound[] => {
    if (isStubbed(node)) {
      return [];
    }

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
      case "content":
      case "printed-variable":
      case "template-block":
      case "template-inline":
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
 * Decide whether the sweep scores an accepted item its built-in template processes, from its
 * declared correct response, or, for an item whose template processing runs, over a record `begin`
 * started, from the correct response `solution` reads from that record.
 *
 * @param location The item's corpus path.
 * @param accepted The accepted item.
 * @param template The template its processing names.
 * @param start The record begun under a sweep seed for an item whose template processing runs;
 *   none for any other.
 * @returns The item to score, or the item skipped with every reason.
 */
const classify = (
  location: string,
  accepted: Accepted,
  template: BuiltIn,
  start: Option.Option<Begun>,
): Scored | Skipped => {
  const { item } = accepted;
  const declaration = Option.fromUndefinedOr(item.responses.get(response));
  const correct = Option.match(start, {
    onNone: () => declaration.pipe(Option.flatMap((declared) => declared.correct)),
    onSome: (started) =>
      Option.fromUndefinedOr(started.correct[response]).pipe(
        Option.filter((value) => !isNull(value)),
      ),
  });
  const seed = start.pipe(Option.map((started) => started.seed));
  const bound = interactionsOf(item.body).filter(
    (interaction) => interaction.response === response,
  );
  const [interaction] = bound;
  const reasons = [
    ...(Option.isNone(declaration) ? [`${response} is not a response the model holds`] : []),
    ...(Option.isSome(declaration) && Option.isNone(correct)
      ? [
          Option.isSome(start)
            ? `solution gives ${response} no correct response under the record`
            : `${response} declares no correct response`,
        ]
      : []),
    ...(Option.isNone(item.processing) ? ["the engine does not run its response processing"] : []),
    ...(bound.length === 0 ? [`${response} is bound to no interaction that renders`] : []),
    ...(bound.length > 1 ? [`${response} is bound to ${bound.length} interactions`] : []),
  ];

  if (
    reasons.length > 0 ||
    Option.isNone(declaration) ||
    Option.isNone(correct) ||
    interaction === undefined
  ) {
    return { kind: "skipped", location, reasons, seed, template };
  }

  return {
    accepted,
    correct: correct.value,
    declaration: declaration.value,
    interaction,
    kind: "scored",
    location,
    record: start.pipe(Option.map((started) => started.record)),
    seed,
    template,
  };
};

/**
 * Begin an item's record under a sweep seed ({@link begunUnder}) and read the item's correct
 * responses from it through `solution`, as a host would.
 *
 * @param accepted The item, whose template processing runs.
 * @param seed The sweep seed.
 * @returns The record and the correct responses it holds, or what failed.
 */
const begun = (accepted: Accepted, seed: string): Result.Result<Begun, string> =>
  Result.mapBoth(begunUnder(accepted, seed), {
    onFailure: (error) => `begin or the record's decoding failed: ${error._tag}: ${error.message}`,
    onSuccess: ({ decoded, stored }): Begun => ({
      correct: splitResponses(solution(accepted, decoded)).responses,
      record: stored,
      seed,
    }),
  });

/**
 * Give the sweep's entries for one accepted item its built-in template processes: one scored from
 * the item's declared defaults, or, for an item whose template processing runs, one over the record
 * `begin` starts under each sweep seed.
 *
 * @param location The item's corpus path.
 * @param accepted The accepted item.
 * @param template The template its processing names.
 * @returns The item's entries, each to score or skipped with every reason.
 */
const entriesOf = (
  location: string,
  accepted: Accepted,
  template: BuiltIn,
): readonly (Scored | Skipped)[] =>
  templated(accepted)
    ? sweepSeeds.map((seed) =>
        Result.match(begun(accepted, seed), {
          onFailure: (reason): Skipped => ({
            kind: "skipped",
            location,
            reasons: [reason],
            seed: Option.some(seed),
            template,
          }),
          onSuccess: (start) => classify(location, accepted, template, Option.some(start)),
        }),
      )
    : [classify(location, accepted, template, Option.none())];

/**
 * Every accepted corpus item whose processing runs by a built-in template, scored or skipped, in
 * the set's order, an item whose template processing runs once under each sweep seed. It runs once
 * per test file, as `openCorpus` does.
 */
const builtInItems = Effect.runSync(
  Effect.cached(
    Effect.gen(function* builtInItems() {
      const entries: (Scored | Skipped)[] = [];
      for (const member of yield* openCorpus) {
        const accepted = acceptedOf(member);
        if (Option.isSome(accepted)) {
          const template = builtInOf(yield* readSource(member.location, member.bytes));
          if (Option.isSome(template)) {
            entries.push(...entriesOf(member.location, accepted.value, template.value));
          }
        }
      }

      return entries;
    }),
  ),
);

/**
 * Report whether an entry is one the sweep scores.
 *
 * @param entry The entry.
 * @returns Whether it is scored rather than skipped.
 */
const isScored = (entry: Scored | Skipped): entry is Scored => entry.kind === "scored";

/**
 * The items the sweep scores.
 */
const scoredItems = builtInItems.pipe(Effect.map((entries) => entries.filter(isScored)));

/**
 * The entries of the items whose template processing runs, one per item and sweep seed, scored or
 * skipped.
 */
const templatedEntries = builtInItems.pipe(
  Effect.map((entries) => entries.filter((entry) => Option.isSome(entry.seed))),
);

/**
 * Name an entry as a failure names it: its corpus path and template, and the sweep seed its record
 * was begun under where it has one, so the run repeats.
 *
 * @param entry The entry.
 * @returns Its name.
 */
const placeOf = (entry: Scored | Skipped): string =>
  Option.match(entry.seed, {
    onNone: () => `${entry.location} (${entry.template})`,
    onSome: (seed) => `${entry.location} (${entry.template}, seed ${JSON.stringify(seed)})`,
  });

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
 * document order (the engine's rule for a value two entries match), else the default.
 *
 * @param mapping The mapping.
 * @param single The response value.
 * @returns The mapped value.
 */
const mappedOf = (mapping: Mapping, single: Single): number =>
  mapping.entries.find((entry) => keyMatches(entry, single))?.value ?? mapping.defaultValue;

/**
 * Report whether a response value matches at most one map key, so scoring it never leans on the
 * rule that a value two entries match maps by the first listed.
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
 * Score one attempt from the item's starting record, `begin`'s for an item whose template
 * processing runs and its declared defaults for any other, and read `SCORE` from the record it
 * returns.
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
      score(scored.accepted, responses, Option.getOrUndefined(scored.record)),
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
    const where = placeOf(scored);

    return Result.match(problemsOf(scored), {
      onFailure: (reason) => [`${where}: ${reason}`],
      onSuccess: (problem) =>
        Option.match(problem, { onNone: () => [], onSome: (text) => [`${where}: ${text}`] }),
    });
  });

/**
 * Check that an item scores its correct response at its template's maximum.
 *
 * @param scored The item.
 * @returns What fails, none when it holds, or why the check cannot run.
 */
const correctProblem = (scored: Scored): Result.Result<Option.Option<string>, string> =>
  Result.gen(function* correctScore() {
    const maximum = yield* maximumOf(scored);
    const got = yield* scoreOf(scored, { [response]: scored.correct });

    return compare(got, maximum) === 0
      ? Option.none()
      : Option.some(`the correct response scores ${got.value}, the maximum is ${maximum.value}`);
  });

/**
 * Check that an item scores a constructed wrong response below its template's maximum.
 *
 * @param scored The item.
 * @returns What fails, none when it holds, or why the check cannot run.
 */
const wrongProblem = (scored: Scored): Result.Result<Option.Option<string>, string> =>
  Result.gen(function* wrongScore() {
    const maximum = yield* maximumOf(scored);
    const wrong = yield* wrongOf(scored);
    const got = yield* scoreOf(scored, { [response]: wrong });

    return compare(got, maximum) === -1
      ? Option.none()
      : Option.some(
          `the wrong response ${JSON.stringify(wrong.values.map((single) => String(single.value)))} scores ${got.value}, not below the maximum ${maximum.value}`,
        );
  });

/**
 * Check that an item gives no response its template's NULL result.
 *
 * @param scored The item.
 * @returns What fails, none when it holds, or why the check cannot run.
 */
const nullProblem = (scored: Scored): Result.Result<Option.Option<string>, string> =>
  Result.gen(function* nullScore() {
    const expected = yield* nullResultOf(scored);
    const got = yield* scoreOf(scored, {});

    return compare(got, expected) === 0
      ? Option.none()
      : Option.some(`no response scores ${got.value}, the NULL result is ${expected.value}`);
  });

describe("the scoring sweep over the corpus", { tags: ["corpus"] }, () => {
  it.effect(
    "[I-9b] each item a built-in template scores scores its correct response at the template's maximum",
    () =>
      Effect.gen(function* correctAtMaximum() {
        const items = yield* scoredItems;

        assert.isNotEmpty(items, "no corpus item is scored by a built-in template");
        assert.deepStrictEqual(sweepProblems(items, correctProblem), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9b] each item a built-in template scores scores a constructed wrong response below the maximum",
    () =>
      Effect.gen(function* wrongBelowMaximum() {
        assert.deepStrictEqual(sweepProblems(yield* scoredItems, wrongProblem), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9b] each item a built-in template scores gives no response the template's NULL result",
    () =>
      Effect.gen(function* noResponse() {
        assert.deepStrictEqual(sweepProblems(yield* scoredItems, nullProblem), []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-5] each item a built-in template scores whose template processing runs is scored over begin's record under each sweep seed: the correct response solution reads from it at the maximum, a wrong one below it, and no response at the NULL result",
    () =>
      Effect.gen(function* templatedScores() {
        const entries = yield* templatedEntries;
        const items = entries.filter(isScored);
        const skipped = entries.flatMap((entry) =>
          entry.kind === "skipped"
            ? [`${placeOf(entry)}: not scored: ${entry.reasons.join("; ")}`]
            : [],
        );

        assert.isNotEmpty(
          items,
          "no corpus item a built-in template scores has template processing that runs",
        );
        assert.deepStrictEqual(
          [
            ...skipped,
            ...sweepProblems(items, correctProblem),
            ...sweepProblems(items, wrongProblem),
            ...sweepProblems(items, nullProblem),
          ],
          [],
        );
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
