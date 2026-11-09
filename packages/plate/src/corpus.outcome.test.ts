import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { packageCache, packageSuffix } from "#plate/dev/packages.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace, walk } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import {
  advance,
  allowedIntents,
  configure,
  current,
  encodeSession,
  results,
  solution,
  startTest,
} from "#plate/index.ts";
import type { Configuration, Intent, Step, TestSession, Value } from "#plate/index.ts";
import type { PackageTest } from "#plate/package/index.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * Opening every corpus package and walking each delivering test to its close runs in seconds here;
 * the bound leaves room for a slow machine and for one xmllint run per test without letting a hung
 * read or a hung xmllint stall the suite.
 */
const sweepTimeoutMs = 600_000;

/**
 * The session instance every sitting starts with.
 */
const instance = "outcome-sweep";

/**
 * The host configuration's seed, which a session keeps as its shuffle seed, so a test that selects
 * or shuffles its items takes the same items in every run.
 */
const shuffleSeed = "outcome-sweep-shuffle";

/**
 * The processing seed every sitting passes `startTest`, which keys every outcome run's draws.
 */
const processingSeed = "outcome-sweep-processing";

/**
 * When every sitting starts, in milliseconds since the epoch.
 */
const startedAt = Date.parse("2026-11-07T09:00:00.000Z");

/**
 * The time between two transitions of a sitting, in milliseconds.
 */
const tick = 10_000;

/**
 * The Results Reporting XSD under the oracle's cache.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * The move to the next item, which in a linear, individual part submits the item first.
 */
const nextIntent: Intent = { kind: "next" };

/**
 * The submission of the current item in an individual part.
 */
const submitItemIntent: Intent = { kind: "submit-item" };

/**
 * The submission of every item of a simultaneous part.
 */
const submitPartIntent: Intent = { kind: "submit-part" };

/**
 * The end of a nonlinear, individual part, from its last item.
 */
const endPartIntent: Intent = { kind: "end-part" };

/**
 * One corpus test that holds outcome processing and that plate delivers, with the session the walk
 * gave it.
 */
interface Sitting {
  /**
   * The session `answeredAndClosed` closed after submitting every item's correct responses, or why
   * the walk stopped short.
   */
  readonly closed: Result.Result<TestSession, string>;
  readonly delivered: PackageTest;
  /**
   * The test's location, `<package location>/<path>`, also its path under the corpus root.
   */
  readonly location: string;
  /**
   * The test document as read from the corpus, which the oracle reads its outcome processing from.
   */
  readonly source: SourceDocument;
  /**
   * The session `startTest` gave, every test outcome at its default.
   */
  readonly started: TestSession;
}

/**
 * Give an element's element children in the QTI namespace, in document order.
 *
 * @param element The element.
 * @returns Its QTI element children.
 */
const qtiChildren = (element: SourceElement): readonly SourceElement[] =>
  element.children.filter(
    (child): child is SourceElement => child.kind === "element" && child.namespace === qtiNamespace,
  );

/**
 * Give an element's only QTI element child with a given local name.
 *
 * @param element The element.
 * @param local The child's local name.
 * @returns The child, none when the element holds no QTI element child, more than one, or one of
 *   another name.
 */
const onlyChild = (element: SourceElement, local: string): Option.Option<SourceElement> => {
  const [child, ...rest] = qtiChildren(element);

  return child !== undefined && rest.length === 0 && child.local === local
    ? Option.some(child)
    : Option.none();
};

/**
 * Give the value of an attribute in no namespace.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns Its value, none when absent.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<string> =>
  Option.fromUndefinedOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local)
      ?.value,
  );

/**
 * Report whether a test document's root holds a QTI `qti-outcome-processing` child, read from the
 * source so that a test the model reads wrongly is still swept.
 *
 * @param source The test document.
 * @returns Whether it holds outcome processing.
 */
const holdsOutcomeProcessing = (source: SourceDocument): boolean =>
  qtiChildren(source.root).some((child) => child.local === "qti-outcome-processing");

/**
 * What the oracle computes a test outcome from: the outcome a test's only rule sets, the variable
 * a `qti-sum` over `qti-test-variables` adds up, and the base value the sum is divided by, if any.
 */
interface SummedProcessing {
  readonly divisor: Option.Option<number>;
  readonly identifier: string;
  readonly variable: string;
}

/**
 * Matches a `qti-base-value`'s text the oracle reads as a number: a decimal, with no exponent and
 * none of the special values.
 */
const decimalText = /^[+-]?\d+(?:\.\d+)?$/u;

/**
 * Give the variable a `qti-sum` adds up when its one operand is a `qti-test-variables` that names
 * the variable and nothing else: no weight, no base type, no section and no category filter.
 *
 * @param sum The `qti-sum`.
 * @returns The variable's identifier, none for any other summed.
 */
const summedVariable = (sum: SourceElement): Option.Option<string> =>
  Option.flatMap(onlyChild(sum, "qti-test-variables"), (variables) =>
    variables.attributes.length === 1
      ? attributeOf(variables, "variable-identifier")
      : Option.none(),
  );

/**
 * Give the divisor a `qti-base-value` holds when it is a float or an integer written as a decimal.
 *
 * @param base The `qti-base-value`.
 * @returns The divisor, none for any other base type or text.
 */
const divisorOf = (base: SourceElement): Option.Option<number> => {
  const written = base.children
    .map((child) => (child.kind === "text" ? child.text : ""))
    .join("")
    .trim();
  const baseType = attributeOf(base, "base-type");

  return Option.exists(baseType, (type) => type === "float" || type === "integer") &&
    decimalText.test(written)
    ? Option.some(Number(written))
    : Option.none();
};

/**
 * Read a test's outcome processing as the oracle's shape: one `qti-set-outcome-value` whose
 * expression is a `qti-sum` over `qti-test-variables`, or that sum in a `qti-divide` by a
 * `qti-base-value`, in a test that maps no item variable.
 *
 * It reads the source, not plate's model, so the oracle shares nothing with the engine but the
 * item records it sums.
 *
 * @param source The test document.
 * @returns The shape, none when the test's outcome processing has any other.
 */
const summedProcessing = (source: SourceDocument): Option.Option<SummedProcessing> => {
  const mapped = [...walk(source)].some(
    ({ element }) => element.namespace === qtiNamespace && element.local === "qti-variable-mapping",
  );
  const processing = qtiChildren(source.root).filter(
    (child) => child.local === "qti-outcome-processing",
  );
  const [only, ...more] = processing;
  if (mapped || only === undefined || more.length > 0) {
    return Option.none();
  }

  return Option.flatMap(onlyChild(only, "qti-set-outcome-value"), (rule) => {
    const identifier = attributeOf(rule, "identifier");
    const [expression, ...rest] = qtiChildren(rule);
    if (Option.isNone(identifier) || expression === undefined || rest.length > 0) {
      return Option.none();
    }

    if (expression.local === "qti-sum") {
      return Option.map(summedVariable(expression), (variable) => ({
        divisor: Option.none(),
        identifier: identifier.value,
        variable,
      }));
    }

    const [sum, base, ...beyond] = qtiChildren(expression);

    return expression.local === "qti-divide" &&
      sum?.local === "qti-sum" &&
      base?.local === "qti-base-value" &&
      beyond.length === 0
      ? Option.zipWith(summedVariable(sum), divisorOf(base), (variable, divisor) => ({
          divisor: Option.some(divisor),
          identifier: identifier.value,
          variable,
        }))
      : Option.none();
  });
};

/**
 * Compute, apart from the engine, what a summed outcome processing sets its outcome to: each
 * session item's single integer or float value of the variable, read from its record's outcomes,
 * else its responses, else its template values, NULLs skipped, added in session order, then
 * divided by the divisor when there is one.
 *
 * @param session The closed session.
 * @param summed The outcome processing the oracle reads.
 * @returns The outcome's number, none when no item holds a value of the variable, so the sum is
 *   NULL.
 */
const oracleOf = (session: TestSession, summed: SummedProcessing): Option.Option<number> => {
  const numbers = session.items.flatMap(({ record }) => {
    const held = [record.outcomes, record.responses, record.templates].find((values) =>
      Object.hasOwn(values, summed.variable),
    )?.[summed.variable];
    const [single] = held?.cardinality === "single" ? held.values : [];

    return single !== undefined && (single.baseType === "integer" || single.baseType === "float")
      ? [Number(single.value)]
      : [];
  });
  if (numbers.length === 0) {
    return Option.none();
  }

  let sum = 0;
  for (const value of numbers) {
    sum += value;
  }

  return Option.some(
    Option.match(summed.divisor, { onNone: () => sum, onSome: (divisor) => sum / divisor }),
  );
};

/**
 * Write a value as text that compares equal exactly when the values are equal: every single value
 * is a string, a boolean, a number, a `bigint` or a pair of them, each of which `String` writes
 * apart.
 *
 * @param value The value, none when the session holds none by that name.
 * @returns The text.
 */
const valueText = (value: Value | undefined): string =>
  value === undefined
    ? "none"
    : `${value.baseType} ${value.cardinality} [${value.values.map((single) => `${single.baseType}:${String(single.value)}`).join(" ")}]`;

/**
 * Write the results report of a closed session, as a host does from its stored form.
 *
 * @param delivered The test and its items.
 * @param session The closed session.
 * @returns The report's XML, or why `encodeSession` or `results` refused.
 */
const reportOf = (delivered: PackageTest, session: TestSession): Result.Result<string, string> =>
  encodeSession(session).pipe(
    Result.flatMap((stored) =>
      results({
        context: { sessions: [{ identifier: `s-${instance}`, sourceId: "https://example.org/" }] },
        items: delivered.items,
        kind: "test",
        session: stored,
        test: delivered.test,
      }),
    ),
    Result.mapError((failure) => failure.message),
  );

/**
 * Decide the step a candidate who answers every item correctly takes from where a session stands:
 * in a simultaneous part, `next` with the item's correct responses while it is taken, else
 * `submit-part` with them; in a linear, individual part, `next` with them, which submits the item
 * first; in a nonlinear, individual part, `submit-item` with them once per item, then `next` while
 * it is taken, else `end-part`.
 *
 * @param delivered The test and its items.
 * @param session The open session.
 * @param configuration The host's configuration.
 * @param submitted The sequence indexes of the items the walk has submitted with `submit-item`.
 * @returns The step, or why none can be decided.
 */
const nextStep = (
  delivered: PackageTest,
  session: TestSession,
  configuration: Configuration,
  submitted: ReadonlySet<number>,
): Result.Result<Step, string> => {
  const shown = current(delivered.test, session, configuration);
  const allowed = allowedIntents(delivered.test, session);
  if (Result.isFailure(shown)) {
    return Result.fail(`current: ${shown.failure.message}`);
  }

  if (Result.isFailure(allowed)) {
    return Result.fail(`allowedIntents: ${allowed.failure.message}`);
  }

  const view = shown.success;
  if (view.kind === "summary") {
    return Result.fail("current gives the summary of a session that is open");
  }

  const item = delivered.items.get(view.ref);
  if (item === undefined) {
    return Result.fail(`the package holds no item for the item ref ${view.ref}`);
  }

  const responses = solution(item, view.record);
  const takesNext = allowed.success.some((intent) => intent.kind === "next");
  if (view.submission === "simultaneous") {
    return Result.succeed({ intent: takesNext ? nextIntent : submitPartIntent, responses });
  }

  if (view.navigation === "linear") {
    return Result.succeed({ intent: nextIntent, responses });
  }

  if (!view.disabled && !submitted.has(view.sequenceIndex)) {
    return Result.succeed({ intent: submitItemIntent, responses });
  }

  return Result.succeed({ intent: takesNext ? nextIntent : endPartIntent });
};

/**
 * Walk a started session to its close as a candidate who answers every item with its correct
 * responses (`solution`, from the item's record), one transition per step, each a tick after the
 * last.
 *
 * Every item is visited once and the walk never goes back, so it takes at most two steps per item
 * and one per part; past that bound it stops.
 *
 * @param delivered The test and its items.
 * @param started The session `startTest` gave.
 * @param configuration The host's configuration.
 * @returns The closed session, or the step at which the walk stopped and why.
 */
const answeredAndClosed = (
  delivered: PackageTest,
  started: TestSession,
  configuration: Configuration,
): Result.Result<TestSession, string> => {
  const bound = 2 * started.items.length + started.parts.length + 1;
  const submitted = new Set<number>();
  let session = started;
  for (let taken = 1; taken <= bound && session.status === "interacting"; taken += 1) {
    const step = nextStep(delivered, session, configuration, submitted);
    if (Result.isFailure(step)) {
      return Result.fail(`step ${String(taken)}: ${step.failure}`);
    }

    const after = advance(delivered.test, delivered.items, session, step.success, configuration, {
      now: new Date(startedAt + tick * taken),
    });
    if (Result.isFailure(after)) {
      return Result.fail(
        `step ${String(taken)} (${step.success.intent.kind} at item ${String(session.position)}): ${after.failure.message}`,
      );
    }

    if (step.success.intent.kind === "submit-item") {
      submitted.add(session.position);
    }

    session = after.success;
  }

  return session.status === "closed"
    ? Result.succeed(session)
    : Result.fail(`the session is still open after ${String(bound)} steps`);
};

/**
 * Every corpus test that holds outcome processing and that plate delivers, each walked to its
 * close: every `*.zip.d` package the playground finds under the corpus root that `openPackage`
 * accepts, every test in it whose document holds `qti-outcome-processing`, and of those each one
 * `startTest` starts. The set is found by the sweep, never listed. It runs once per test file.
 */
const sittings = Effect.runSync(
  Effect.cached(
    Effect.gen(function* sittings() {
      const configuration = yield* configure({ seed: shuffleSeed });
      const packages = yield* (yield* packageCache()).packages;
      const found: Sitting[] = [];
      for (const entry of packages) {
        const { verdict } = entry;
        if (
          entry.location.endsWith(packageSuffix) &&
          (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported")
        ) {
          for (const [location, delivered] of verdict.accepted.tests) {
            const source = yield* readSource(location, yield* readCorpusFile(location));
            const started = startTest(delivered.test, delivered.items, configuration, {
              instance,
              now: new Date(startedAt),
              seed: processingSeed,
            });
            if (holdsOutcomeProcessing(source) && Result.isSuccess(started)) {
              found.push({
                closed: answeredAndClosed(delivered, started.success, configuration),
                delivered,
                location,
                source,
                started: started.success,
              });
            }
          }
        }
      }

      return found;
    }),
  ),
);

describe("outcome processing over the corpus's delivering tests", { tags: ["corpus"] }, () => {
  it.effect(
    "[T-9] a session of each delivering corpus test with outcome processing, every item submitted with its correct responses and the test closed, runs the test's outcome processing with no failure",
    () =>
      Effect.gen(function* runsWithNoFailure() {
        const swept = yield* sittings;
        const problems = swept.flatMap(({ closed, delivered, location }) => {
          const processing = delivered.test.test.outcomeProcessing.kind;

          return Result.match(closed, {
            onFailure: (failure) => [`${location}: ${failure}`],
            onSuccess: (session) => [
              ...(processing === "runs"
                ? []
                : [`${location}: its outcome processing is ${processing}, not runs`]),
              ...(session.outcomeRuns > 0 ? [] : [`${location}: no outcome run`]),
            ],
          });
        });

        assert.isAbove(swept.length, 0, "no corpus test with outcome processing is delivered");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[T-9] the results report of each closed session validates against the Results Reporting XSD",
    () =>
      Effect.gen(function* resultsValidate() {
        const swept = yield* sittings;
        const problems: string[] = [];
        for (const { closed, delivered, location } of swept) {
          const xml = closed.pipe(Result.flatMap((session) => reportOf(delivered, session)));
          if (Result.isFailure(xml)) {
            problems.push(`${location}: ${xml.failure}`);
          } else {
            const verdict = yield* validateAgainst(resultsXsd, xml.success);
            if (!verdict.valid) {
              problems.push(`${location}: ${verdict.messages.join("; ")}`);
            }
          }
        }

        assert.isAbove(swept.length, 0, "no corpus test with outcome processing is delivered");
        assert.deepStrictEqual(problems, []);
      }),
    { tags: ["results-xsd"], timeout: sweepTimeoutMs },
  );

  it.effect(
    "[T-9] [T-1] each test whose outcome processing sets one outcome from a qti-sum over qti-test-variables, divided by a base value or not, ends with that outcome as an oracle computes it from the item records",
    () =>
      Effect.gen(function* matchesTheOracle() {
        const swept = yield* sittings;
        const checked = swept.flatMap(({ closed, location, source }) =>
          Option.match(summedProcessing(source), {
            onNone: () => [],
            onSome: (summed) => [{ closed, location, summed }],
          }),
        );
        const problems = checked.flatMap(({ closed, location, summed }) =>
          Result.match(closed, {
            onFailure: (failure) => [`${location}: ${failure}`],
            onSuccess: (session) => {
              const outcome = session.outcomes[summed.identifier];
              const want = Option.toArray(oracleOf(session, summed));
              const got = outcome?.values.map((single) => Number(single.value));

              return got !== undefined &&
                got.length === want.length &&
                got.every((value, index) => value === want[index])
                ? []
                : [
                    `${location}: ${summed.identifier} is ${valueText(outcome)}, not ${JSON.stringify(want)}`,
                  ];
            },
          }),
        );

        assert.isAbove(checked.length, 0, "no delivering corpus test sums qti-test-variables");
        assert.deepStrictEqual(problems, []);
      }),
    sweepTimeoutMs,
  );

  it.effect(
    "[T-9] [T-1] the sweep is not vacuous: at least one closed session holds a test outcome other than its default",
    () =>
      Effect.gen(function* notVacuous() {
        const swept = yield* sittings;
        const moved = swept.filter(({ closed, started }) =>
          Result.match(closed, {
            onFailure: () => false,
            onSuccess: (session) =>
              Object.keys(started.outcomes).some(
                (identifier) =>
                  valueText(session.outcomes[identifier]) !==
                  valueText(started.outcomes[identifier]),
              ),
          }),
        );

        assert.isAbove(swept.length, 0, "no corpus test with outcome processing is delivered");
        assert.isAbove(moved.length, 0, "every closed session holds its test outcomes' defaults");
      }),
    sweepTimeoutMs,
  );
});
