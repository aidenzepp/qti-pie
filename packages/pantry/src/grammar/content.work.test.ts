/**
 * The content grammar's work, counted: the composition builds each content model's automaton once
 * and states each content relation once, keyed by automaton, with exactly the rows `install.ts`
 * installs, so no family's rows are expanded, checked and regrouped into models on the way (W3).
 *
 * The guard counts work, not time, so a loaded machine cannot pass or fail it. It wraps the
 * functions the content grammar's work goes through, the three parts of an automaton
 * (`outlineOf`, `structureOf` and `positionsOf`) and the closed-relation constructor, before any
 * module of the composition loads (`vi.doMock`, then the composition's first import), and reads
 * their calls after `install.ts` has composed production's grammar.
 */
import { assert, describe, it, vi } from "@effect/vitest";
import { Effect } from "effect";
import type * as Closed from "#pantry/grammar/closed.ts";
import type * as Sequencing from "#pantry/vocab/sequencing.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 0 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * What the composition did: the rows each `closed` call stated, by relation name in call order, the
 * key of each outline `outlineOf` read, the follow-set structures `structureOf` built, and the
 * models `positionsOf` numbered.
 */
interface Work {
  readonly outlines: string[];
  positions: number;
  readonly stated: Map<string, number[]>;
  structures: number;
}

/**
 * The work this file's one composition does, filled by the wrapped functions.
 */
const work: Work = { outlines: [], positions: 0, stated: new Map(), structures: 0 };

/**
 * The content grammar's relations as `install.ts` declares them, each stated by the generator one
 * to one.
 */
const contentRelations = [
  "ContentModelOf",
  "ModelPositions",
  "FollowSetOf",
  "FollowMember",
  "SharedModelOf",
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
  const outlineOf: typeof original.outlineOf = (...input) => {
    const outline = original.outlineOf(...input);
    work.outlines.push(outline.key);

    return outline;
  };
  const structureOf: typeof original.structureOf = (...input) => {
    work.structures += 1;

    return original.structureOf(...input);
  };
  const positionsOf: typeof original.positionsOf = (...input) => {
    work.positions += 1;

    return original.positionsOf(...input);
  };

  return { ...original, outlineOf, positionsOf, structureOf };
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
    testTimeoutMs,
  );

  it.effect(
    "builds one automaton per content model that holds a particle, its structure once per distinct outline, once per process, and each distinct one is a ContentModel handle",
    () =>
      Effect.gen(function* automataOnce() {
        const withParticle = compose.vocabularies
          .flatMap((entry) => [...entry.models, ...entry.facets.content.models])
          .filter(({ content }) => content._tag === "element-only" || content._tag === "mixed");
        const built = work.positions;
        const distinct = new Set(work.outlines).size;

        // Each model's automaton is its own positions over its outline's one structure: an outline
        // read and positions numbered per model, and a structure built per distinct outline
        // (`installContent`), fewer than the models.
        assert.strictEqual(work.outlines.length, withParticle.length);
        assert.strictEqual(built, withParticle.length);
        assert.strictEqual(work.structures, distinct);
        assert.isBelow(distinct, built);
        // A second read of production's grammar is the one composition `compose.ts` made as it
        // loaded (`composed()`), so it builds no automaton again.
        yield* Effect.fromResult(compose.composed());
        assert.deepStrictEqual(
          [work.outlines.length, work.positions, work.structures],
          [withParticle.length, built, distinct],
        );
        // Each family reads one of the distinct automata, fewer than the models that build them.
        assert.isAtMost(install.ContentModel.handles.length, built + 1);
        assert.strictEqual(
          new Set(install.ContentModelOf.rows.map(({ model }) => model)).size,
          install.ContentModel.handles.length,
        );
      }),
    testTimeoutMs,
  );
});
