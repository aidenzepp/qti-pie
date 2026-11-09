import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, Result } from "effect";
import { closed, faultOf, idField, roster as rosterOf } from "#pantry/grammar/closed.ts";
import type { Roster } from "#pantry/grammar/closed.ts";
import {
  fixedKinds,
  generate,
  isForeignKind,
  openClasses,
  resolution,
} from "#pantry/grammar/kinds.ts";
import type { KindByNameUnder, KindOf, Vocabulary } from "#pantry/grammar/kinds.ts";
import { namespaceNameOf } from "#pantry/vocab/namespaces.ts";

/**
 * The search budget of every exploration here; each states its own coverage.
 */
const budget = {
  caseHang: Duration.minutes(1),
  concurrency: 1,
  kept: [],
  literal: Formatter.format,
  shrink: completeShrink,
  steerEvery: 16,
} as const;

/**
 * One drawn kind: its handle, its element's local name (empty for character data), and the parents
 * that admit it, under which its name resolves to it.
 */
interface DrawnKind {
  readonly handle: string;
  readonly local: string;
  readonly parents: readonly string[];
}

/**
 * Draw a toy vocabulary list: up to three vocabularies of up to three kinds each, local names drawn
 * from a three-letter alphabet so that names collide, each kind admitted under parents drawn from
 * the document node, the earlier kinds and one no vocabulary declares, attribute names that may
 * repeat across vocabularies or spell an open class, interactions drawn from the kinds or from
 * outside them, and the document layer's names, one of which a vocabulary may list too.
 */
const drawnList: Gen<{
  readonly attributes: readonly (readonly string[])[];
  readonly interactions: readonly string[];
  readonly kinds: readonly (readonly DrawnKind[])[];
  readonly layer: readonly string[];
}> = (source) => {
  let next = 0;
  const kinds: DrawnKind[][] = source
    .draw(
      array(
        (inner) =>
          inner.draw(
            array(
              (leaf) => {
                next += 1;
                const handle = `k${next}`;
                const local = leaf.draw(element(["a", "b", "c", ""] as const));
                const parents = ["document", "k1", "k2", "nowhere"].filter(
                  (above) => leaf.choose(0, above === "nowhere" ? 5 : 1) === 1,
                );

                return { handle, local, parents };
              },
              { max: 3, min: 0 },
            ),
          ),
        { max: 3, min: 1 },
      ),
    )
    .map((vocabulary) => [...vocabulary]);
  const twice = source.choose(0, 5) === 0;
  const attributes = kinds.map(() =>
    source.draw(
      array(element(["id", "class", "no-namespace", "title"] as const), { max: 2, min: 0 }),
    ),
  );
  const interactions = source.draw(
    array(element(["k1", "k2", "k3", "outside"] as const), { max: 2, min: 0 }),
  );
  const layer = source.draw(
    array(element(["xsi:type", "xml:lang", "id"] as const), { max: 2, min: 0 }),
  );

  return {
    attributes,
    interactions,
    kinds: twice && kinds[0] !== undefined ? [...kinds, kinds[0]] : kinds,
    layer,
  };
};

/**
 * What a model case reaches: each refusal the model predicts, or a generated grammar; and the
 * situations the generator is built to put in front of it, a local name two kinds share, a kind of
 * character data, an attribute name that spells an open class, a vocabulary listed twice and a
 * document layer name a vocabulary lists too.
 */
type KindsFeature =
  | "KeyCollision"
  | "OutsideCodeSpace"
  | "RepeatedValue"
  | "character data"
  | "generated"
  | "layer name shared"
  | "open-class spelling"
  | "shared local"
  | "vocabulary twice";

/**
 * Every feature a model case must reach.
 */
const kindsFeatures = [
  "KeyCollision",
  "OutsideCodeSpace",
  "RepeatedValue",
  "character data",
  "generated",
  "layer name shared",
  "open-class spelling",
  "shared local",
  "vocabulary twice",
] as const satisfies readonly KindsFeature[];

describe("the kinds generator against a naive model", () => {
  it.effect(
    "refuses exactly what the model refuses, and otherwise codes, sets and resolves as the model does",
    (ctx) =>
      // Bound: up to 3 vocabularies of up to 3 kinds over 3 local names, 2 attribute names each,
      // 2 interactions and 2 document layer names.
      searched(
        ctx,
        explore(
          {
            ...budget,
            coverage: required<KindsFeature>(kindsFeatures, { cases: 300, sense: notesOnly }),
            draw: drawn(drawnList),
            oracle: {
              kind: "second-implementation",
              name: "a naive model of the rosters, the element set and the resolution",
            },
            runs: 600,
            suite: "grammar/kinds/model",
          },
          (list, c) =>
            Effect.sync(() => {
              const vocabularies: readonly Vocabulary[] = list.kinds.map((kinds, at) => ({
                attributes: [...new Set(list.attributes[at])],
                kinds: kinds.map(({ handle, local }) => ({ handle, local })),
                namespace: namespaceNameOf("urn:toy"),
              }));
              const all = list.kinds.flat();
              const handles = all.map(({ handle }) => handle);
              const elements = all.filter(({ local }) => local !== "");
              const names = [
                ...openClasses,
                ...new Set([...list.layer, ...list.attributes.flat()]),
              ];
              // The model: each reason a roster or relation has no constant.
              const reasons = new Set<KindsFeature>();
              if (
                new Set(handles).size !== handles.length ||
                new Set(names).size !== names.length
              ) {
                reasons.add("RepeatedValue");
              }

              const named = elements.flatMap(({ local, parents }) =>
                parents.map((above) => `${local} ${above}`),
              );
              if (
                new Set(named).size !== named.length ||
                new Set(list.interactions).size !== list.interactions.length
              ) {
                reasons.add("KeyCollision");
              }

              const roster = new Set([...fixedKinds, ...handles]);
              if (
                elements.some(({ parents }) => parents.some((above) => !roster.has(above))) ||
                list.interactions.some((kind) => !roster.has(kind))
              ) {
                reasons.add("OutsideCodeSpace");
              }

              c.noteAll(reasons.size > 0 ? reasons : ["generated"]);

              const locals = elements.map(({ local }) => local);
              if (new Set(locals).size < locals.length) {
                c.note("shared local");
              }

              if (all.some(({ local }) => local === "")) {
                c.note("character data");
              }

              if (
                list.attributes.flat().some((name) => openClasses.some((open) => open === name))
              ) {
                c.note("open-class spelling");
              }

              if (new Set(list.kinds).size < list.kinds.length) {
                c.note("vocabulary twice");
              }

              if (list.layer.some((name) => list.attributes.flat().includes(name))) {
                c.note("layer name shared");
              }

              const result = Result.flatMap(
                generate({ interactions: list.interactions, layer: list.layer, vocabularies }),
                (rosters) =>
                  resolution(
                    rosters,
                    all.flatMap(({ handle, parents }) =>
                      parents.map((parent) => ({ child: handle, parent })),
                    ),
                  ),
              );
              // A roster's refusal is the generator's; a row outside its code space or a key stated
              // twice is a fault of the rows, which the generator states and `faultOf` finds.
              const outcome = Result.match(result, {
                onFailure: ({ _tag }) => _tag,
                onSuccess: (kinds) =>
                  Option.match(Arr.findFirst([kinds.interaction, kinds.byName], faultOf), {
                    onNone: () => "generated",
                    onSome: ({ _tag }) => _tag,
                  }),
              });
              if (reasons.size > 0) {
                assert.include([...reasons], outcome);
              } else {
                assert.strictEqual(outcome, "generated");
                if (Result.isSuccess(result)) {
                  const kinds = result.success;
                  assert.deepStrictEqual(kinds.nodeKind.handles, [...fixedKinds, ...handles]);
                  assert.deepStrictEqual(kinds.attributeName.handles, names);
                  assert.deepStrictEqual(
                    kinds.isElement.rows.map(({ kind }) => kind),
                    [...fixedKinds.filter(isForeignKind), ...elements.map(({ handle }) => handle)],
                  );
                  for (const local of ["a", "b", "c", "d"]) {
                    for (const parent of ["document", ...handles]) {
                      const under = elements.find(
                        (kind) => kind.local === local && kind.parents.includes(parent),
                      );
                      assert.deepStrictEqual(
                        kinds.resolve("urn:toy", local, parent),
                        Option.map(Option.fromNullishOr(under), ({ handle }) => handle),
                        `${local} under ${parent}`,
                      );
                    }
                  }
                }
              }
            }),
        ),
      ),
  );
});

describe("KindByNameUnder's kind payload", () => {
  it("ranges over the NodeKind roster, so a relation whose kind payload is any string is not one", () => {
    const vocabularies = [
      {
        attributes: [],
        kinds: [{ handle: "k1", local: "a" }],
        namespace: namespaceNameOf("urn:toy"),
      },
    ] as const;
    const rosters = Result.getOrThrow(generate({ interactions: [], layer: [], vocabularies }));
    const anyKind: Roster<string> = rosters.nodeKind;
    const relationOver = <K extends string>(kinds: Roster<K>, kind: K) =>
      closed({
        key: [
          idField("namespace", Result.getOrThrow(rosterOf("Namespace", ["urn:toy"]))),
          idField("local", Result.getOrThrow(rosterOf("LocalName", ["a"]))),
          idField("parent", anyKind),
        ],
        name: "KindByNameUnder",
        payload: [idField("kind", kinds)],
        rows: [{ kind, local: "a", namespace: "urn:toy", parent: "document" }],
      });
    const narrow: KindByNameUnder<KindOf<typeof vocabularies>> = relationOver(
      rosters.nodeKind,
      "k1",
    );
    // @ts-expect-error -- A kind payload over every string holds kinds outside NodeKind, which
    // `resolve` would have to filter out; the type refuses the relation instead.
    const widened: KindByNameUnder<KindOf<typeof vocabularies>> = relationOver(anyKind, "k1");

    assert.deepStrictEqual(
      [narrow, widened].map((relation) =>
        Option.map(
          relation.lookup({ local: "a", namespace: "urn:toy", parent: "document" }),
          ({ kind }) => kind,
        ),
      ),
      [Option.some("k1"), Option.some("k1")],
    );
    assert.deepStrictEqual(
      Result.getOrThrow(resolution(rosters, [{ child: "k1", parent: "document" }])).resolve(
        "urn:toy",
        "a",
        "document",
      ),
      Option.some("k1"),
    );
  });
});
