import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { composed, vocabularies } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { contentModelOf, contentEnds, contentStep } from "#pantry/grammar/content.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { breachesOf, judged as judgedPackage, shown, withItem } from "#pantry/test/probe.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * Judge a family of child kinds by the installed automaton, as the database does: each child steps
 * from its predecessor's state (0 for the first), and the last state must be one `Last` holds.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds, in order.
 * @returns Whether the family's content is the model's.
 */
const accepts = (
  composedGrammar: Pick<ComposedGrammar, "admission" | "content">,
  version: SchemaVersion,
  parent: string,
  children: readonly string[],
): boolean => {
  const positionOf = (key: {
    readonly child: string;
    readonly parent: string;
    readonly version: SchemaVersion;
  }) => Option.map(composedGrammar.admission.lookup(key), ({ position }) => Number(position));
  let state = 0;
  for (const child of children) {
    const next = contentStep(
      composedGrammar.content,
      positionOf,
      { child, parent, version },
      state,
    );
    if (Option.isNone(next)) {
      return false;
    }

    state = next.value;
  }

  return contentEnds(composedGrammar.content, version, parent, state);
};

/**
 * The kinds whose model is `empty`, each with its version list, read from the composed models,
 * split by whether the kind's namespace is MathML's.
 *
 * @param composedGrammar - The grammar.
 * @returns The empty kinds in MathML's namespace and the empty kinds outside it.
 */
const emptyKinds = (composedGrammar: ComposedGrammar) => {
  const namespaceOf = (kind: string) =>
    Option.getOrElse(
      Option.map(composedGrammar.kinds.elementName.lookup({ kind }), ({ namespace }) => namespace),
      () => "",
    );
  const empty = vocabularies
    .flatMap((vocabulary) => [...vocabulary.models, ...vocabulary.facets.content.models])
    .filter(({ content }) => content._tag === "empty")
    .map(({ kind, versions }) => ({ kind, namespace: namespaceOf(kind), versions }));

  return {
    mathml: empty.filter(({ namespace }) => namespace === mathmlNamespace),
    other: empty.filter(({ namespace }) => namespace !== "" && namespace !== mathmlNamespace),
  };
};

describe("spec reading 2: whitespace in a MathML element whose content is empty", () => {
  it.effect(
    "admits whitespace and not text under every MathML kind of empty content, in every version",
    () =>
      // Oracle: MathML 3's RelaxNG matches a whitespace-only text against `empty` (§2); decision
      // 321 (5). Bound: each MathML kind whose model is empty, in each version that holds its
      // family, read through the installed rows as `content.test.ts` reads them.
      Effect.gen(function* mathmlEmpty() {
        const composedGrammar = yield* grammar;
        const { mathml } = emptyKinds(composedGrammar);
        const wrong: string[] = [];
        let compared = 0;
        for (const { kind } of mathml) {
          for (const version of schemaVersions) {
            if (Option.isNone(contentModelOf(composedGrammar.content, { parent: kind, version }))) {
              continue;
            }

            compared += 1;
            if (!accepts(composedGrammar, version, kind, ["ws"])) {
              wrong.push(`${version} ${kind} refuses ws`);
            }

            if (accepts(composedGrammar, version, kind, ["text"])) {
              wrong.push(`${version} ${kind} admits text`);
            }
          }
        }

        assert.isAbove(mathml.length, 0);
        assert.isAbove(compared, 0);
        assert.deepStrictEqual(wrong, []);
      }),
  );

  it.effect("refuses whitespace under the kinds of empty content outside MathML", () =>
    // Oracle: XML Schema Part 1 §3.4.4, an empty content type admits comments and processing
    // instructions alone. Bound: each non-MathML kind whose model is empty.
    Effect.gen(function* otherEmpty() {
      const composedGrammar = yield* grammar;
      const { other } = emptyKinds(composedGrammar);
      const wrong: string[] = [];
      let compared = 0;
      for (const { kind } of other) {
        for (const version of schemaVersions) {
          if (Option.isNone(contentModelOf(composedGrammar.content, { parent: kind, version }))) {
            continue;
          }

          compared += 1;
          if (accepts(composedGrammar, version, kind, ["ws"])) {
            wrong.push(`${version} ${kind} admits ws`);
          }
        }
      }

      assert.isAbove(compared, 0);
      assert.deepStrictEqual(wrong, []);
    }),
  );
});

/**
 * A package whose item holds one math formula after its paragraph.
 *
 * @param formula - The content markup, written in the `m:` prefix.
 * @returns The package's files.
 */
const withFormula = (formula: string) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one.</p><p><m:math xmlns:m="http://www.w3.org/1998/Math/MathML">${formula}</m:math></p>`,
  );

describe("spec reading 2: the law oracle on an empty MathML element", () => {
  it.effect("accepts whitespace in an mspace", () =>
    // Oracle: MathML 3's RelaxNG (§2), as the law oracle judges a whole package. Bound: the base
    // item with one `mspace` holding a space.
    Effect.gen(function* spaceInMspace() {
      const breaches = breachesOf(yield* judgedPackage(withFormula("<m:mspace> </m:mspace>")));

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }),
  );

  it.effect("refuses text in an mspace", () =>
    // Oracle: the same schema admits whitespace only; "x" is text. Bound: the base item with one
    // `mspace` holding "x".
    Effect.gen(function* textInMspace() {
      const breaches = breachesOf(yield* judgedPackage(withFormula("<m:mspace>x</m:mspace>")));

      assert.isAbove(breaches.length, 0);
    }),
  );
});
