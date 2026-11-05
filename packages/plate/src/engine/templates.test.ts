import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { decode, entryName, isPosted, open, score } from "#plate/index.ts";
import type { Accepted, Value } from "#plate/index.ts";
import type {
  AreaMapping,
  BodyNode,
  ChoiceInteraction,
  Item,
  ResponseDeclaration,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { format } from "#plate/model/values.ts";

/**
 * Each case opens one corpus item and scores it at most three times, which takes well under a
 * second here; the bound leaves room for a slow machine without letting a hung read stall the
 * suite.
 */
const corpusTimeoutMs = 60_000;

/**
 * The response every built-in template scores.
 */
const response = "RESPONSE";

/**
 * The instance token the text responses post under.
 */
const instance = "witness";

/**
 * The `ccPackage` items whose processing is the `CC2_match` template, by corpus path.
 */
const cc2MatchItems = [
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_102010.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_102012.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_102013.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_104045.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_104047.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_104048.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_104049.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_104051.xml",
] as const;

/**
 * The `ccPackage` items whose processing is the `CC2_map_response` template, by corpus path.
 */
const cc2MapResponseItems = [
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_102011.xml",
  "qtiv3-examples/packaging/ccPackage/testitems/QUE_102015.xml",
] as const;

/**
 * The point items whose processing is the `map_response_point` template, which the engine runs, by
 * corpus path.
 */
const pointItems = [
  "QTI3_BPIG_Examples/BPIG_22April.zip.d/items/position-object-1.xml",
  "QTI3_BPIG_Examples/BPIG_22April.zip.d/items/select-point-item_1.xml",
  "QTI3_BPIG_Examples/items/position-object-1.xml",
  "QTI3_BPIG_Examples/items/select-point-item_1.xml",
  "qtiv3-examples/packaging/items/items.zip.d/position_object.xml",
  "qtiv3-examples/packaging/items/items.zip.d/select_point.xml",
  "qtiv3-examples/packaging/items/position_object.xml",
  "qtiv3-examples/packaging/items/select_point.xml",
] as const;

/**
 * The point items whose inline processing maps a point through `qti-inside`, outside M1's engine,
 * by corpus path.
 */
const insideItems = [
  "qtiv3-examples/packaging/BBQsTest/BBQsTest.zip.d/id-992e8bd3c9ac/hotspot-maximum.xml",
  "qtiv3-examples/packaging/BBQsTest/id-992e8bd3c9ac/hotspot-maximum.xml",
] as const;

/**
 * Open a corpus item as a host opens a document it read from storage, and require an accepting
 * verdict.
 *
 * @param location The item's path under the corpus root, which `open` takes as its location.
 * @returns The accepting verdict.
 */
const openAccepted = Effect.fnUntraced(function* openAccepted(location: string) {
  const verdict = yield* open(location, yield* readCorpusFile(location));
  if (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") {
    return verdict;
  }

  return assert.fail(`${location} is ${verdict.verdict}, not accepted`);
});

/**
 * Report whether a feature the verdict names is about the response processing: a template the
 * engine does not run (`template="…"`), a variable it does not hold (`variable:…`), or an
 * expression or any other processing feature, each of which sits at or under the processing
 * element.
 *
 * @param feature The feature.
 * @returns Whether it names the processing.
 */
const namesProcessing = (feature: UnsupportedFeature): boolean =>
  feature.feature.startsWith("template=") ||
  feature.feature.startsWith("variable:") ||
  feature.path.split("/").includes("qti-response-processing");

/**
 * Give an item's declaration of the response the templates score.
 *
 * @param item The item.
 * @returns The declaration.
 */
const declarationOf = (item: Item): ResponseDeclaration =>
  Option.getOrElse(Option.fromUndefinedOr(item.responses.get(response)), () =>
    assert.fail(`${item.document} holds no ${response} declaration`),
  );

/**
 * Score one attempt from a fresh record and give the outcomes of the record it returns.
 *
 * @param accepted The item.
 * @param responses The responses, none for no response.
 * @returns The outcomes after the attempt.
 */
const outcomesAfter = (
  accepted: Accepted,
  responses: Readonly<Record<string, Value>>,
): ItemRecord["outcomes"] =>
  Result.match(Result.flatMap(score(accepted, responses), decodeRecord), {
    onFailure: (error) =>
      assert.fail(`${accepted.document}: scoring failed: ${error._tag}: ${error.message}`),
    onSuccess: (record) => record.outcomes,
  });

/**
 * Read a value as a single number.
 *
 * @param value The value, absent when the variable is not held.
 * @param what What the value is, for the failure.
 * @returns The number its single integer or float holds.
 */
const numberOf = (value: Value | undefined, what: string): number => {
  const [single] = value?.values ?? [];
  if (
    value?.cardinality === "single" &&
    value.values.length === 1 &&
    (single?.baseType === "float" || single?.baseType === "integer")
  ) {
    return Number(single.value);
  }

  return assert.fail(`${what} is not a single number`);
};

/**
 * Read a value as a single identifier.
 *
 * @param value The value, absent when the variable is not held.
 * @param what What the value is, for the failure.
 * @returns The identifier.
 */
const identifierOf = (value: Value | undefined, what: string): string => {
  const [single] = value?.values ?? [];
  if (value?.cardinality === "single" && value.values.length === 1 && single !== undefined) {
    return single.baseType === "identifier"
      ? single.value
      : assert.fail(`${what} is a ${single.baseType}, not an identifier`);
  }

  return assert.fail(`${what} is not a single identifier`);
};

/**
 * Collect the Choice interactions in body nodes, in document order.
 *
 * @param nodes The body nodes.
 * @returns The interactions.
 */
const choicesIn = (nodes: readonly BodyNode[]): readonly ChoiceInteraction[] =>
  nodes.flatMap((node): readonly ChoiceInteraction[] => {
    if (node.kind === "choice") {
      return [node];
    }

    return node.kind === "element" ? choicesIn(node.children) : [];
  });

/**
 * Clamp a mapped sum by an area mapping's bounds, as `qti-map-response-point` does.
 *
 * @param mapping The area mapping.
 * @param sum The sum.
 * @returns The sum within `lower-bound` and `upper-bound`.
 */
const clamped = (mapping: AreaMapping, sum: number): number =>
  Math.min(
    Option.getOrElse(mapping.upperBound, () => Number.POSITIVE_INFINITY),
    Math.max(
      Option.getOrElse(mapping.lowerBound, () => Number.NEGATIVE_INFINITY),
      sum,
    ),
  );

/**
 * Give a point no area of a mapping holds: both coordinates one past the sum of every coordinate's
 * magnitude, which lies beyond each circle's and ellipse's rightmost point and each rectangle's and
 * polygon's largest x. A `default` area holds every point, so a mapping with one has no such point.
 *
 * @param mapping The area mapping.
 * @returns The point.
 */
const pointOutside = (mapping: AreaMapping): readonly [bigint, bigint] => {
  assert.isFalse(
    mapping.entries.some((entry) => entry.shape === "default"),
    "a default area holds every point",
  );
  let magnitude = 0;
  for (const entry of mapping.entries) {
    for (const coordinate of entry.coords) {
      magnitude += Math.abs(coordinate);
    }
  }
  const beyond = BigInt(Math.ceil(magnitude)) + 1n;

  return [beyond, beyond];
};

describe("the built-in templates over named corpus items", () => {
  for (const location of cc2MatchItems) {
    it.effect(
      `[I-9b] ${location} (CC2_match) scores its correct response 1, a choice outside it 0 and no response 0`,
      () =>
        Effect.gen(function* cc2Match() {
          const verdict = yield* openAccepted(location);
          const { item, unsupported } = verdict.accepted;
          const declaration = declarationOf(item);
          const correct = Option.getOrElse(declaration.correct, () =>
            assert.fail(`${location} declares no correct response`),
          );
          const interaction = choicesIn(item.body).find((choice) => choice.response === response);
          const outside =
            interaction?.choices.find(
              (choice) =>
                !correct.values.some(
                  (single) =>
                    single.baseType === "identifier" && single.value === choice.identifier,
                ),
            ) ?? assert.fail(`${location} presents no choice outside its correct response`);

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
          assert.isTrue(
            unsupported.some(
              (feature) => feature.feature === "qti-modal-feedback" && feature.shown === "mark",
            ),
            "a CC2_match item holds qti-modal-feedback as a mark",
          );
          assert.isTrue(
            unsupported.some(
              (feature) => feature.feature === "qti-feedback-inline" && feature.shown === "notice",
            ),
            "a CC2_match item holds qti-feedback-inline as a notice",
          );
          assert.deepStrictEqual(unsupported.filter(namesProcessing), []);
          assert.isTrue(Option.isSome(item.processing));
          assert.strictEqual(
            numberOf(outcomesAfter(verdict.accepted, { [response]: correct })["SCORE"], "SCORE"),
            1,
          );
          assert.strictEqual(
            numberOf(
              outcomesAfter(verdict.accepted, {
                [response]: {
                  baseType: "identifier",
                  cardinality: declaration.cardinality,
                  values: [{ baseType: "identifier", value: outside.identifier }],
                },
              })["SCORE"],
              "SCORE",
            ),
            0,
          );
          assert.strictEqual(numberOf(outcomesAfter(verdict.accepted, {})["SCORE"], "SCORE"), 0);
        }),
      corpusTimeoutMs,
    );
  }

  for (const location of cc2MapResponseItems) {
    it.effect(
      `[I-9b] ${location} (CC2_map_response) maps its first key's text, a text no key matches and no response, setting FEEDBACK against MAXSCORE`,
      () =>
        Effect.gen(function* cc2MapResponse() {
          const verdict = yield* openAccepted(location);
          const { item, unsupported } = verdict.accepted;
          const declaration = declarationOf(item);
          const mapping = Option.getOrElse(declaration.mapping, () =>
            assert.fail(`${location} declares no mapping`),
          );
          const first = mapping.entries[0] ?? assert.fail(`${location}'s mapping has no entry`);
          const maximum = numberOf(
            Option.getOrUndefined(
              Option.flatMap(
                Option.fromUndefinedOr(item.outcomes.get("MAXSCORE")),
                (outcome) => outcome.defaultValue,
              ),
            ),
            "MAXSCORE's default",
          );
          const keys = mapping.entries.map((entry) => format(entry.key));
          const { cardinality } = declaration;
          const baseType = isPosted(declaration.baseType)
            ? declaration.baseType
            : assert.fail(
                `${location}'s ${response} is a ${declaration.baseType}, which no text posts`,
              );
          const name = entryName(instance, response);
          const posted = (text: string): Value =>
            Result.getOrElse(decode([[name, text]], { baseType, cardinality, name }), (malformed) =>
              assert.fail(`${location}: the text ${text} does not decode: ${malformed.message}`),
            );
          const matched = outcomesAfter(verdict.accepted, {
            [response]: posted(format(first.key)),
          });
          // Longer than every key, so it equals none of them, case folded or not.
          const unmatched = outcomesAfter(verdict.accepted, {
            [response]: posted(`${keys.join(" ")} (no key)`),
          });
          const none = outcomesAfter(verdict.accepted, {});

          assert.strictEqual(verdict.verdict, "accepted-with-unsupported");
          assert.isTrue(
            unsupported.some(
              (feature) => feature.feature === "qti-modal-feedback" && feature.shown === "mark",
            ),
            "a CC2_map_response item holds qti-modal-feedback as a mark",
          );
          assert.deepStrictEqual(unsupported.filter(namesProcessing), []);
          assert.isTrue(Option.isSome(item.processing));
          assert.isTrue(Option.isNone(declaration.correct));

          assert.strictEqual(numberOf(matched["SCORE"], "SCORE"), first.value);
          assert.strictEqual(
            identifierOf(matched["FEEDBACK"], "FEEDBACK"),
            first.value === maximum ? "correct" : "incorrect",
          );
          assert.strictEqual(numberOf(unmatched["SCORE"], "SCORE"), mapping.defaultValue);
          assert.strictEqual(identifierOf(unmatched["FEEDBACK"], "FEEDBACK"), "incorrect");
          assert.strictEqual(numberOf(none["SCORE"], "SCORE"), 0);
          assert.strictEqual(identifierOf(none["FEEDBACK"], "FEEDBACK"), "incorrect");
        }),
      corpusTimeoutMs,
    );
  }

  for (const location of pointItems) {
    it.effect(
      `[I-9b] ${location} (map_response_point) scores its correct response at its areas' sum, no response 0 and a point in no area the default`,
      () =>
        Effect.gen(function* mapResponsePoint() {
          const verdict = yield* openAccepted(location);
          const { item } = verdict.accepted;
          const declaration = declarationOf(item);
          const correct = Option.getOrElse(declaration.correct, () =>
            assert.fail(`${location} declares no correct response`),
          );
          const mapping = Option.getOrElse(declaration.areaMapping, () =>
            assert.fail(`${location} declares no area mapping`),
          );
          let sum = 0;
          for (const entry of mapping.entries) {
            sum += entry.mappedValue;
          }
          const outside: Value = {
            baseType: "point",
            cardinality: declaration.cardinality,
            values: [{ baseType: "point", value: pointOutside(mapping) }],
          };

          assert.isTrue(Option.isSome(item.processing));
          assert.strictEqual(
            numberOf(outcomesAfter(verdict.accepted, { [response]: correct })["SCORE"], "SCORE"),
            clamped(mapping, sum),
          );
          assert.strictEqual(numberOf(outcomesAfter(verdict.accepted, {})["SCORE"], "SCORE"), 0);
          assert.strictEqual(
            numberOf(outcomesAfter(verdict.accepted, { [response]: outside })["SCORE"], "SCORE"),
            clamped(mapping, mapping.defaultValue),
          );
        }),
      corpusTimeoutMs,
    );
  }

  for (const location of insideItems) {
    it.effect(
      `${location} is accepted with its qti-inside processing marked and not run`,
      () =>
        Effect.gen(function* inside() {
          const { accepted } = yield* openAccepted(location);

          assert.isTrue(Option.isNone(accepted.item.processing));
          assert.isTrue(
            accepted.unsupported.some(
              (feature) => feature.feature === "qti-inside" && feature.shown === "mark",
            ),
            "qti-inside is a mark",
          );
        }),
      corpusTimeoutMs,
    );
  }
});
