/**
 * The content grammar's work, counted: the composition builds each content model's automaton once
 * and states each content relation once, keyed by automaton, with exactly the rows `install.ts`
 * installs, so no family's rows are expanded, checked and regrouped into models on the way (W3).
 *
 * The guard counts work, not time, so a loaded machine cannot pass or fail it. It wraps the two
 * functions the content grammar's work goes through, `automatonOf` and the closed-relation
 * constructor, before any module of the composition loads (`vi.doMock`, then the composition's
 * first import), and reads their calls after `install.ts` has composed production's grammar.
 */
import { assert, describe, it, vi } from "@effect/vitest";
import { Effect } from "effect";
import type * as Closed from "#pantry/grammar/closed.ts";
import type * as Sequencing from "#pantry/vocab/sequencing.ts";

/**
 * What the composition did: the rows each `closed` call stated, by relation name in call order, and
 * the automata `automatonOf` built.
 */
interface Work {
  automata: number;
  readonly stated: Map<string, number[]>;
}

/**
 * The work this file's one composition does, filled by the wrapped functions.
 */
const work: Work = { automata: 0, stated: new Map() };

/**
 * The content grammar's relations as `install.ts` declares them, each stated by the generator one
 * to one.
 */
const contentRelations = [
  "ContentModelOf",
  "ModelPositions",
  "Follow",
  "Last",
  "SharedModelOf",
  "SharedPositions",
  "Symbol",
] as const;

// Wrap the closed-relation constructor and `automatonOf` with counters before the composition's
// first module loads, so every call the composition makes is counted.
vi.doMock("#pantry/grammar/closed.ts", async (importOriginal) => {
  const original = await importOriginal<typeof Closed>();
  const closed: typeof original.closed = (relation) => {
    work.stated.set(relation.name, [
      ...(work.stated.get(relation.name) ?? []),
      relation.rows.length,
    ]);

    return original.closed(relation);
  };

  return { ...original, closed };
});

vi.doMock("#pantry/vocab/sequencing.ts", async (importOriginal) => {
  const original = await importOriginal<typeof Sequencing>();
  const automatonOf: typeof original.automatonOf = (...input) => {
    work.automata += 1;

    return original.automatonOf(...input);
  };

  return { ...original, automatonOf };
});

/**
 * The vocabulary list and `composed()`, loaded after the counters.
 */
const compose = await import("#pantry/grammar/compose.ts");

/**
 * `install.ts`, whose load composes production's grammar once and declares its relations.
 */
const install = await import("#pantry/grammar/install.ts");

describe("the content grammar's work", () => {
  it.effect(
    "states each content relation once, with exactly the rows install.ts installs",
    () =>
      Effect.sync(() => {
        assert.deepStrictEqual(
          Object.fromEntries(contentRelations.map((name) => [name, work.stated.get(name)])),
          Object.fromEntries(contentRelations.map((name) => [name, [install[name].rows.length]])),
        );
      }),
    600_000,
  );

  it.effect(
    "builds one automaton per content model that holds a particle, once per process, and each distinct one is a ContentModel handle",
    () =>
      Effect.gen(function* automataOnce() {
        const withParticle = compose.vocabularies
          .flatMap((entry) => [...entry.models, ...entry.facets.content.models])
          .filter(({ content }) => content._tag === "element-only" || content._tag === "mixed");
        const built = work.automata;

        assert.strictEqual(built, withParticle.length);
        // A second read of production's grammar is the first composition's result (`composed()`
        // is memoized by its list), so it builds no automaton again.
        yield* Effect.fromResult(compose.composed());
        assert.strictEqual(work.automata, built);
        // Each family reads one of the distinct automata, fewer than the models that build them.
        assert.isAtMost(install.ContentModel.handles.length, built + 1);
        assert.strictEqual(
          new Set(install.ContentModelOf.rows.map(({ model }) => model)).size,
          install.ContentModel.handles.length,
        );
      }),
    600_000,
  );
});
