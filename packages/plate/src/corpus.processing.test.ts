import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { score } from "#plate/index.ts";
import type { Accepted } from "#plate/index.ts";
import { expressionKinds, isUnlanded } from "#plate/model/expression.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { acceptedOf, openCorpus } from "#plate/test/sweep.ts";

/**
 * Opening the corpus (about 800 members) and scoring each item with inline response processing
 * twice runs in seconds here; the bound leaves room for a slow machine without letting a hung run
 * stall the suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The element marks of the kinds a later stage of this plan owns: `qti-<kind>` for each kind whose
 * rule the registry still holds as unlanded. `src/model/expression.test.ts`'s roster pins that set
 * to its 14 kinds by owner, so the sweep allows exactly those, and a kind that lands stops being
 * allowed here with no edit.
 */
const laterKindMarks: ReadonlySet<string> = new Set(
  expressionKinds.filter((kind) => isUnlanded(kindRules[kind])).map((kind) => `qti-${kind}`),
);

/**
 * The marks of an element the model reads but does not run (9.21's `qti-custom-operator` aside):
 * an unresolved `xi:include`, a `%` coordinate, and a `pattern` outside XML Schema's regular
 * expressions. Each stops the processing that holds it.
 */
const unrunMarks: ReadonlySet<string> = new Set(["area-coords-percent", "pattern", "xi:include"]);

/**
 * The mark of `qti-custom-operator`, whose processing still runs with the operator's value NULL
 * (9.21), so it is the one allowed mark that leaves the processing running.
 */
const customOperatorMark = "qti-custom-operator";

/**
 * The prefix of a mark that names a variable the engine holds no value of.
 */
const variablePrefix = "variable:";

/**
 * The built-in context variable, which a context declaration need not declare.
 */
const builtInContext = "QTI_CONTEXT";

/**
 * The built-in variable an item may read and the engine holds no value of.
 */
const builtInDuration = "duration";

/**
 * The base types of a response the model does not hold.
 */
const unheldBaseTypes: ReadonlySet<string> = new Set(["duration", "file"]);

/**
 * The outcome property 3 orders.
 */
const scoreOutcome = "SCORE";

/**
 * The items property 3 lets score their correct responses below `{}`, each with its reason. It is
 * empty: an entry needs the Mind's acceptance before it is added.
 */
const orderExceptions: ReadonlyMap<string, string> = new Map<string, string>();

/**
 * One accepted corpus item whose root's `qti-response-processing` has element children, as the
 * source scan found it.
 */
interface Swept {
  readonly accepted: Accepted;
  readonly location: string;
  /**
   * Whether the root has a `qti-template-processing` child, which excuses the item from properties
   * 1 to 3 until M3.b-2's P7T-11 runs template processing.
   */
  readonly templated: boolean;
  /**
   * The identifiers a `variable:<id>` mark may name: each template and context variable the root
   * declares, `QTI_CONTEXT`, the built-in `duration`, and each response the root declares with a
   * base type of `duration` or `file` or a cardinality of `record` that the model does not hold.
   */
  readonly unheld: ReadonlySet<string>;
}

/**
 * Give the children of an element in the QTI namespace with a local name.
 *
 * @param element The element.
 * @param local The children's local name.
 * @returns The children, in document order.
 */
const qtiChildren = (element: SourceElement, local: string): readonly SourceElement[] =>
  element.children.filter(
    (child): child is SourceElement =>
      child.kind === "element" && child.namespace === qtiNamespace && child.local === local,
  );

/**
 * Read an unprefixed attribute of an element, its XML whitespace trimmed.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns Its value, or none when the element has no such attribute.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<string> =>
  Option.map(
    Option.fromUndefinedOr(
      element.attributes.find(
        (attribute) => attribute.namespace === "" && attribute.local === local,
      ),
    ),
    (attribute) => trimXmlSpace(attribute.value),
  );

/**
 * Report whether a document's root has inline response processing: a `qti-response-processing`
 * child that has an element child of its own.
 *
 * @param source The document.
 * @returns Whether its response processing is written inline.
 */
const isInline = (source: SourceDocument): boolean =>
  qtiChildren(source.root, "qti-response-processing").some((processing) =>
    processing.children.some((child) => child.kind === "element"),
  );

/**
 * Give the identifiers an element's declarations of one kind declare.
 *
 * @param root The item's root.
 * @param local The declarations' local name, such as `qti-template-declaration`.
 * @returns Each declaration's identifier, in document order.
 */
const identifiersOf = (root: SourceElement, local: string): readonly string[] =>
  qtiChildren(root, local).flatMap((declaration) =>
    Option.toArray(attributeOf(declaration, "identifier")),
  );

/**
 * Give the identifiers a `variable:<id>` mark may name in an item (property 1, group (c)), read
 * from its source's declarations and the responses its model holds.
 *
 * @param source The item's source.
 * @param accepted The accepted item.
 * @returns The identifiers.
 */
const unheldOf = (source: SourceDocument, accepted: Accepted): ReadonlySet<string> => {
  const { root } = source;
  const unheldResponses = qtiChildren(root, "qti-response-declaration").flatMap((declaration) => {
    const baseType = Option.getOrElse(attributeOf(declaration, "base-type"), () => "");
    const cardinality = Option.getOrElse(attributeOf(declaration, "cardinality"), () => "");

    return unheldBaseTypes.has(baseType) || cardinality === "record"
      ? Option.toArray(attributeOf(declaration, "identifier")).filter(
          (identifier) => !accepted.item.responses.has(identifier),
        )
      : [];
  });

  return new Set([
    ...identifiersOf(root, "qti-template-declaration"),
    ...identifiersOf(root, "qti-context-declaration"),
    builtInContext,
    builtInDuration,
    ...unheldResponses,
  ]);
};

/**
 * Every accepted corpus item whose root's `qti-response-processing` has element children, in the
 * corpus set's order. The set is found by scanning each item's source, never by its model, so an
 * item the model reads wrongly is still swept. It runs once per test file, as `openCorpus` does.
 */
const sweptItems = Effect.runSync(
  Effect.cached(
    Effect.gen(function* sweptItems() {
      const swept: Swept[] = [];
      for (const member of yield* openCorpus) {
        const accepted = acceptedOf(member);
        if (Option.isSome(accepted)) {
          const source = yield* readSource(member.location, member.bytes);
          if (isInline(source)) {
            swept.push({
              accepted: accepted.value,
              location: member.location,
              templated: qtiChildren(source.root, "qti-template-processing").length > 0,
              unheld: unheldOf(source, accepted.value),
            });
          }
        }
      }

      return swept;
    }),
  ),
);

/**
 * Report whether a mark sits on the root's response processing or an element inside it.
 *
 * @param path The mark's path.
 * @returns Whether its second step is `qti-response-processing`.
 */
const atProcessing = (path: string): boolean =>
  path.split("/")[1]?.replace(/\[\d+\]$/u, "") === "qti-response-processing";

/**
 * Give the marks an item carries on its response processing.
 *
 * @param swept The item.
 * @returns Each mark's feature and path, in document order.
 */
const processingMarks = (swept: Swept): readonly { feature: string; path: string }[] =>
  swept.accepted.item.unsupported.filter((mark) => atProcessing(mark.path));

/**
 * Report whether property 1 allows a mark on an item's response processing: a later stage's kind,
 * a mark of an element read but not run, `qti-custom-operator`, or a variable the engine holds no
 * value of.
 *
 * @param swept The item.
 * @param feature The mark's feature.
 * @returns Whether one of the three groups holds it.
 */
const isAllowed = (swept: Swept, feature: string): boolean =>
  laterKindMarks.has(feature) ||
  unrunMarks.has(feature) ||
  feature === customOperatorMark ||
  (feature.startsWith(variablePrefix) && swept.unheld.has(feature.slice(variablePrefix.length)));

/**
 * Report whether property 1 excuses an item from running: it has template processing, or it
 * carries an allowed mark that stops its processing (every allowed mark but
 * `qti-custom-operator`).
 *
 * @param swept The item.
 * @returns Whether the item is excused.
 */
const isExcused = (swept: Swept): boolean =>
  swept.templated ||
  processingMarks(swept).some(
    (mark) => mark.feature !== customOperatorMark && isAllowed(swept, mark.feature),
  );

/**
 * Give the responses an item declares a correct response for, each at that response.
 *
 * @param accepted The item.
 * @returns The correct responses, by response identifier.
 */
const correctResponsesOf = (accepted: Accepted): Readonly<Record<string, Value>> =>
  Object.fromEntries(
    [...accepted.item.responses].flatMap(([identifier, declaration]) =>
      Option.match(declaration.correct, {
        onNone: () => [],
        onSome: (correct) => [[identifier, correct] as const],
      }),
    ),
  );

/**
 * A single number a score is: the value of a single integer or float.
 */
type Numeric = Extract<Single, { readonly baseType: "float" | "integer" }>;

/**
 * Score one attempt of an item from a fresh record and read an outcome as a single number.
 *
 * @param accepted The item.
 * @param responses The responses, `{}` for none.
 * @returns The outcome's value, or what failed: the scoring, the record, or the value's form.
 */
const scoreOf = (
  accepted: Accepted,
  responses: Readonly<Record<string, Value>>,
): Result.Result<Numeric, string> =>
  Result.gen(function* scoreOnce() {
    const stored = yield* Result.mapError(
      score(accepted, responses),
      (error) => `scoring failed with ${error._tag}`,
    );
    const record = yield* Result.mapError(
      decodeRecord(stored),
      (error) => `the record does not decode: ${error.message}`,
    );
    const value = Option.fromUndefinedOr(record.outcomes[scoreOutcome]);
    const [single] = Option.match(value, { onNone: () => [], onSome: (found) => found.values });

    return Option.isSome(value) &&
      value.value.cardinality === "single" &&
      (single?.baseType === "float" || single?.baseType === "integer")
      ? single
      : yield* Result.fail(`${scoreOutcome} is not a single number`);
  });

/**
 * Report whether one score is at least another of the same base type, exactly.
 *
 * @param left The score that should be the greater or equal.
 * @param right The other.
 * @returns Whether `left` is at least `right`; false for two scores of different base types.
 */
const atLeast = (left: Numeric, right: Numeric): boolean => {
  if (left.baseType === "integer" && right.baseType === "integer") {
    return left.value >= right.value;
  }

  return left.baseType === "float" && right.baseType === "float" && left.value >= right.value;
};

/**
 * Report whether property 3 orders an item: its processing runs, every response the model holds
 * declares a correct response, and its `SCORE` is declared a single integer or float.
 *
 * @param swept The item.
 * @returns Whether the item's correct responses must score at least what `{}` scores.
 */
const isOrdered = (swept: Swept): boolean => {
  const { item } = swept.accepted;
  const declared = Option.fromUndefinedOr(item.outcomes.get(scoreOutcome));

  return (
    Option.isSome(item.processing) &&
    [...item.responses.values()].every((declaration) => Option.isSome(declaration.correct)) &&
    Option.isSome(declared) &&
    declared.value.cardinality === "single" &&
    (declared.value.baseType === "float" || declared.value.baseType === "integer")
  );
};

describe("the inline response processing sweep over the corpus", { tags: ["corpus"] }, () => {
  it.effect(
    "[I-9a] marks each item's inline processing only with a kind a later stage owns, an element read but not run, or a variable the engine holds no value of",
    () =>
      Effect.gen(function* everyMarkExcused() {
        const problems = (yield* sweptItems)
          .filter((swept) => !swept.templated)
          .flatMap((swept) =>
            processingMarks(swept)
              .filter((mark) => !isAllowed(swept, mark.feature))
              .map(
                (mark) =>
                  `${swept.location}: the mark ${mark.feature} at ${mark.path} is in none of the three groups`,
              ),
          );

        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9a] scores each item whose inline processing runs with no response and with its declared correct responses, with no failure",
    () =>
      Effect.gen(function* everyRunScores() {
        const problems = (yield* sweptItems)
          .filter((swept) => !swept.templated && Option.isSome(swept.accepted.item.processing))
          .flatMap((swept) =>
            [
              ["no response", {}] as const,
              ["its correct responses", correctResponsesOf(swept.accepted)] as const,
            ].flatMap(([what, responses]) =>
              Result.match(score(swept.accepted, responses), {
                onFailure: (error) => [`${swept.location}: ${what} fails with ${error._tag}`],
                onSuccess: () => [],
              }),
            ),
          );

        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9a] scores each item's declared correct responses at least what no response scores, where every response declares one and SCORE is a single number",
    () =>
      Effect.gen(function* correctAtLeastEmpty() {
        const ordered = (yield* sweptItems).filter((swept) => !swept.templated && isOrdered(swept));
        const problems = ordered
          .filter((swept) => !orderExceptions.has(swept.location))
          .flatMap((swept) =>
            Result.match(
              Result.gen(function* order() {
                const empty = yield* scoreOf(swept.accepted, {});
                const correct = yield* scoreOf(swept.accepted, correctResponsesOf(swept.accepted));

                return atLeast(correct, empty)
                  ? Option.none()
                  : Option.some(
                      `the correct responses score ${String(correct.value)}, below ${String(empty.value)} for no response`,
                    );
              }),
              {
                onFailure: (reason) => [`${swept.location}: ${reason}`],
                onSuccess: (problem) =>
                  Option.match(problem, {
                    onNone: () => [],
                    onSome: (text) => [`${swept.location}: ${text}`],
                  }),
              },
            ),
          );

        assert.isNotEmpty(ordered, "no item's correct responses are ordered against no response");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[I-9a] sweeps a set that is not empty, and every item in it runs but those property 1 excuses",
    () =>
      Effect.gen(function* notVacuous() {
        const swept = yield* sweptItems;
        const running = swept.filter((item) => Option.isSome(item.accepted.item.processing));
        const excused = swept.filter(isExcused);

        assert.isNotEmpty(swept, "the source scan found no accepted item with inline processing");
        assert.isAtLeast(
          running.length,
          swept.length - excused.length,
          `${String(running.length)} of ${String(swept.length)} run, and ${String(excused.length)} are excused`,
        );
      }),
    sweepTimeoutMs,
  );
});
