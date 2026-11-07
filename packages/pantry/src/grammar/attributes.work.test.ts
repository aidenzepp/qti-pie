/**
 * The attribute grammar's domain work, counted: a composition compiles each distinct read
 * definition once, and every declaration's domain is still its leaf definition read by its spec
 * readings, compiled, for every (version, declaration).
 *
 * The guard counts work, not time, so a loaded machine cannot pass or fail it. It wraps the
 * value-domain compiler, `compile` (`#pantry/grammar/domains.ts`), and the attribute grammar's
 * `generate` before any module of the composition loads (`vi.doMock`, then the composition's first
 * import), and reads their calls after the composition. Its oracle reads each declaration alone:
 * its spec readings ({@link readingsOf}) applied to its leaf definition ({@link readDefinitionOf}),
 * told apart by text ({@link definitionText}), and compiled by the unwrapped compiler. Beside
 * production's grammar, toy declaration lists are exhausted over a small scope and searched under
 * swarm weights.
 */
import { assert, describe, it, vi } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, pipe, Result } from "effect";
import type * as Attributes from "#pantry/grammar/attributes.ts";
import type {
  AttributeGrammar,
  AttributeGrammarInput,
  Declared,
  DomainDeclaration,
} from "#pantry/grammar/attributes.ts";
import type * as Domains from "#pantry/grammar/domains.ts";
import type { CompiledDomain, Reading } from "#pantry/grammar/domains.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { Domain } from "#pantry/vocab/inventory/types.ts";

/**
 * What the wrapped functions saw: each definition `compile` compiled, with its reading, in call
 * order, and each input `generate` was given.
 */
interface Work {
  readonly compiled: { readonly definition: Domain; readonly whiteSpace: Reading }[];
  readonly inputs: AttributeGrammarInput[];
}

/**
 * The work this file's compositions do, filled by the wrapped functions.
 */
const work: Work = { compiled: [], inputs: [] };

// Wrap the compiler and the attribute grammar's generator before the composition's first module
// loads, so every compile and every generation the composition makes is seen.
vi.doMock("#pantry/grammar/domains.ts", async (importOriginal) => {
  const original = await importOriginal<typeof Domains>();
  const compile: typeof original.compile = (definition, whiteSpace) => {
    work.compiled.push({ definition, whiteSpace });

    return original.compile(definition, whiteSpace);
  };

  return { ...original, compile };
});

vi.doMock("#pantry/grammar/attributes.ts", async (importOriginal) => {
  const original = await importOriginal<typeof Attributes>();
  const generate: typeof original.generate = (input) => {
    work.inputs.push(input);

    return original.generate(input);
  };

  return { ...original, generate };
});

/**
 * The composition, the attribute grammar and the unwrapped compiler, loaded after the wrappers.
 */
const { composed } = await import("#pantry/grammar/compose.ts");

const { definitionText, generate, governorHandle, readDefinitionOf, readingsOf } =
  await import("#pantry/grammar/attributes.ts");

const { roster } = await import("#pantry/grammar/closed.ts");

const { schemaVersions } = await import("#pantry/grammar/kinds.ts");

const unwrapped = await vi.importActual<typeof Domains>("#pantry/grammar/domains.ts");

/**
 * One read of a declaration's domain in one version: the declaration as its domain is read, the
 * version, and the domain handle the grammar's row gives it there.
 */
interface DomainRead {
  readonly declared: DomainDeclaration;
  readonly handle: string;
  readonly version: SchemaVersion;
}

/**
 * Every declaration of an input as the attribute grammar reads its domain: its attributes, its
 * kinds' texts (no attribute name), its governed attributes, and its named types' texts (the type's
 * owner as the kind).
 *
 * @param input - The generator's input.
 * @returns Each declaration, with the versions it is read in.
 */
const declarationsOf = (
  input: AttributeGrammarInput,
): readonly (DomainDeclaration & { readonly versions: readonly SchemaVersion[] })[] => [
  ...input.declarations,
  ...input.texts.map((text) => ({ ...text, name: "" })),
  ...input.governed,
  ...input.typeTexts.map((typeText) => ({ ...typeText, kind: typeText.owner, name: "" })),
];

/**
 * A closed relation's domain handles by key: each row's key spelled by `keyOf`, which no two rows
 * share.
 *
 * @param rows - The relation's rows.
 * @param keyOf - Spell a row's key.
 * @returns The handles by key.
 */
const handlesBy = <Row extends { readonly domain: string }>(
  rows: readonly Row[],
  keyOf: (row: Row) => string,
): ReadonlyMap<string, string> => {
  const handles = new Map<string, string>();
  for (const row of rows) {
    const key = keyOf(row);
    assert.isFalse(handles.has(key), `one row for ${key}`);
    handles.set(key, row.domain);
  }

  return handles;
};

/**
 * Spell a row's key: its parts joined by NUL, which no handle holds.
 *
 * @param parts - The key's parts.
 * @returns The key.
 */
const key = (...parts: readonly string[]): string => parts.join("\u0000");

/**
 * The domain handle a key names, failing the test when no row holds it.
 *
 * @param handles - The handles by key.
 * @param where - The key.
 * @returns The handle.
 */
const handleAt = (handles: ReadonlyMap<string, string>, where: string): string =>
  handles.get(where) ?? assert.fail(`no row for ${where}`);

/**
 * Every (version, declaration) of an input with the domain handle the grammar gives it: an
 * attribute's `AttributeGrammar` row, a text's `TextDomain` row, a governed attribute's
 * `GovernedAttribute` row and a named type's `TypeText` row.
 *
 * @param input - The generator's input.
 * @param grammar - The grammar it generated.
 * @returns Each read.
 */
const domainReads = (input: AttributeGrammarInput, grammar: AttributeGrammar): DomainRead[] => {
  const admitted = handlesBy(grammar.admission.rows, (row) => key(row.version, row.kind, row.name));
  const texts = handlesBy(grammar.text.rows, (row) => key(row.version, row.kind));
  const governed = handlesBy(grammar.governed.rows, (row) =>
    key(row.version, row.governor, row.name),
  );
  const typeTexts = handlesBy(grammar.typeText.rows, (row) => key(row.version, row.governs));

  return input.versions.handles.flatMap((version) => [
    ...input.declarations
      .filter((declared) => declared.versions.includes(version))
      .map((declared) => ({
        declared,
        handle: handleAt(admitted, key(version, declared.kind, declared.name)),
        version,
      })),
    ...input.texts
      .filter((text) => text.versions.includes(version))
      .map((text) => ({
        declared: { ...text, name: "" },
        handle: handleAt(texts, key(version, text.kind)),
        version,
      })),
    ...input.governed
      .filter((declared) => declared.versions.includes(version))
      .map((declared) => ({
        declared,
        handle: handleAt(governed, key(version, governorHandle(declared), declared.name)),
        version,
      })),
    ...input.typeTexts
      .filter((typeText) => typeText.versions.includes(version))
      .map((typeText) => ({
        declared: { ...typeText, kind: typeText.owner, name: "" },
        handle: handleAt(typeTexts, key(version, typeText.owner)),
        version,
      })),
  ]);
};

/**
 * The compiled domain a definition text names, compiled by the unwrapped compiler once per text.
 */
type Oracle = (declared: DomainDeclaration) => {
  readonly compiled: Result.Result<CompiledDomain, Domains.CompileError>;
  readonly text: string;
};

/**
 * The oracle: a declaration's domain, read alone, its definition compiled once per distinct text.
 *
 * @returns The oracle.
 */
const oracle = (): Oracle => {
  const byText = new Map<string, Result.Result<CompiledDomain, Domains.CompileError>>();

  return (declared) => {
    const read = readDefinitionOf(declared, readingsOf(declared.kind, declared.name));
    const text = definitionText(read);
    const compiled = byText.get(text) ?? unwrapped.compile(read.definition, read.whiteSpace);
    byText.set(text, compiled);

    return { compiled, text };
  };
};

/**
 * Hold a generation's work and domains to the oracle: the definitions compiled during it are
 * exactly the distinct read definitions of its declarations, each once, and every (version,
 * declaration) names the domain its definition compiles to, or an empty domain where its lexical
 * space holds no value.
 *
 * @param input - The generator's input.
 * @param grammar - The grammar it generated.
 * @param compiled - The definitions compiled while it generated, in call order.
 * @returns The number of definitions compiled.
 */
const holdToOracle = (
  input: AttributeGrammarInput,
  grammar: AttributeGrammar,
  compiled: readonly { readonly definition: Domain; readonly whiteSpace: Reading }[],
): number => {
  const read = oracle();
  const texts = compiled.map((unit) => definitionText(unit));
  const twice = texts.filter((text, at) => texts.indexOf(text) !== at);
  assert.deepStrictEqual(
    twice.map((text) => text.slice(0, 200)),
    [],
    "no definition compiles twice",
  );
  assert.deepStrictEqual(
    new Set(texts),
    new Set(declarationsOf(input).map((declared) => read(declared).text)),
    "the definitions compiled are the declarations' distinct read definitions",
  );

  const byHandle = new Map(grammar.domains.map((domain) => [domain.handle, domain]));
  const empty = new Set(grammar.emptyDomains);
  for (const { declared, handle, version } of domainReads(input, grammar)) {
    const expected = read(declared).compiled;
    const where = `${version} ${declared.kind}@${declared.name}`;
    if (Result.isFailure(expected)) {
      assert.isTrue(unwrapped.isEmptyDefinition(expected.failure), `${where} compiles`);
      assert.isTrue(empty.has(handle), `${where} names an empty domain`);
    } else {
      const actual = byHandle.get(handle) ?? assert.fail(`${where} names no domain`);
      assert.deepStrictEqual(
        {
          facets: actual.facets,
          identity: actual.identity,
          pattern: actual.pattern,
          primitive: actual.primitive,
        },
        expected.success,
        where,
      );
    }
  }

  return texts.length;
};

describe("the attribute grammar's domain work", () => {
  it.effect(
    "composes production's grammar compiling each distinct read definition once, and every (version, declaration) names the domain its definition compiles to",
    () =>
      // Oracle: each declaration read alone (`oracle`), its definition compiled by the unwrapped
      // compiler. Bound: production's one composition, every declaration of its four lists in
      // every version; residual none.
      Effect.gen(function* productionWork() {
        const grammar = yield* Effect.fromResult(composed());
        assert.lengthOf(work.inputs, 1, "production's composition generates its attributes once");

        const input = work.inputs[0] ?? assert.fail("no attribute grammar was generated");
        const compiles = holdToOracle(input, grammar.attributes, work.compiled);

        assert.isAbove(compiles, 0);
      }),
    900_000,
  );
});

/**
 * A toy leaf definition: an atomic string type of one pattern. `same` builds a second object of the
 * same content, which a leaf never states but two compositions may.
 *
 * @param pattern - Its pattern.
 * @returns The definition.
 */
const toyLeaf = (pattern: string): Domain => ({
  _tag: "atomic",
  builtin: "string",
  facets: [{ facet: "whiteSpace", value: "preserve" }],
  patterns: [[pattern]],
  primitive: "string",
});

/**
 * The toy leaves a declaration is drawn over: two of one content as distinct objects, then one
 * that holds no language tag, so a language reading makes it empty.
 */
const toyLeaves = {
  digits: toyLeaf("[0-9]+"),
  lower: toyLeaf("[a-z]{1,8}"),
  lowerCopy: toyLeaf("[a-z]{1,8}"),
} as const;

/**
 * The toy leaves by name, in the order a swarm draws them.
 */
const toyLeafNames = ["lower", "lowerCopy", "digits"] as const;

/**
 * The (kind, attribute) pairs a toy declaration is drawn over, each read by the spec readings it
 * names: none, reading 129 everywhere (`lang`), reading 129 twice (`xml:lang` everywhere, then on
 * an item's root), reading 129 on a track (`srclang`), and reading 7, whose whitespace is exact.
 */
const toyPairs = {
  "k@a": { kind: "k", name: "a" },
  "k@lang": { kind: "k", name: "lang" },
  "qti-assessment-item@xml:lang": { kind: "qti-assessment-item", name: "xml:lang" },
  "qti-map-entry@map-key": { kind: "qti-map-entry", name: "map-key" },
  "track@lang": { kind: "track", name: "lang" },
  "track@srclang": { kind: "track", name: "srclang" },
} as const;

/**
 * The toy pairs by name, in the order a swarm draws them.
 */
const toyPairNames = [
  "k@a",
  "k@lang",
  "qti-assessment-item@xml:lang",
  "track@srclang",
  "track@lang",
  "qti-map-entry@map-key",
] as const;

/**
 * The version sets a toy declaration is read in: the first version, the last, or both.
 */
const toyVersions = {
  both: schemaVersions,
  first: [schemaVersions[0]],
  last: [schemaVersions[1]],
} as const;

/**
 * A toy declaration's draw: its (kind, attribute) pair, its leaf, and its versions.
 */
interface ToyDraw {
  readonly leaf: (typeof toyLeafNames)[number];
  readonly pair: (typeof toyPairNames)[number];
  readonly versions: keyof typeof toyVersions;
}

/**
 * The toy declarations of a list of draws, the first of each (kind, attribute) pair kept, since a
 * kind declares a name once in a version.
 *
 * @param draws - The draws.
 * @returns The declarations.
 */
const toyDeclarations = (draws: readonly ToyDraw[]): readonly Declared[] => {
  const seen = new Set<ToyDraw["pair"]>();

  return draws.flatMap(({ leaf, pair, versions }) => {
    if (seen.has(pair)) {
      return [];
    }

    seen.add(pair);

    return [
      {
        domain: toyLeaves[leaf],
        kind: toyPairs[pair].kind,
        name: toyPairs[pair].name,
        type: { inline: Option.none(), type: "Toy", whiteSpace: "preserve" },
        use: "optional",
        versions: toyVersions[versions],
      },
    ];
  });
};

/**
 * The situations a toy case can reach, each a way the grouping could compile a definition twice or
 * read a declaration under another's readings.
 */
const toySituations = [
  "a leaf two declarations share",
  "two leaves of one content",
  "one leaf under two sets of readings",
  "two readings of one declaration",
  "an exact reading",
  "an empty definition",
] as const;

/**
 * A {@link toySituations} member.
 */
type ToySituation = (typeof toySituations)[number];

/**
 * The situations a toy input reaches.
 *
 * @param declarations - The input's declarations.
 * @returns Each situation it reaches.
 */
const situationsOf = (declarations: readonly Declared[]): readonly ToySituation[] => {
  const leaves = declarations.map(({ domain }) => domain);
  const readings = declarations.map(({ kind, name }) => readingsOf(kind, name));
  const keys = readings.map((list) =>
    list.map(({ reading, whiteSpace }) => `${reading} ${whiteSpace}`).join(","),
  );
  const read = oracle();

  return [
    ...(leaves.some((leaf, at) => leaves.indexOf(leaf) !== at)
      ? (["a leaf two declarations share"] as const)
      : []),
    ...(leaves.includes(toyLeaves.lower) && leaves.includes(toyLeaves.lowerCopy)
      ? (["two leaves of one content"] as const)
      : []),
    ...(leaves.some((leaf, at) =>
      leaves.some((other, there) => other === leaf && keys[there] !== keys[at]),
    )
      ? (["one leaf under two sets of readings"] as const)
      : []),
    ...(readings.some((list) => list.length > 1)
      ? (["two readings of one declaration"] as const)
      : []),
    ...(readings.some((list) => list.some((reading) => reading.whiteSpace === "exact"))
      ? (["an exact reading"] as const)
      : []),
    ...(declarations.some((declared) => Result.isFailure(read(declared).compiled))
      ? (["an empty definition"] as const)
      : []),
  ];
};

/**
 * Generate a toy grammar from declarations, counting the definitions compiled while it generates,
 * and hold it to the oracle.
 *
 * @param declarations - The declarations.
 * @param c - The case, which notes the situations reached.
 * @param c.note - Note a situation.
 * @returns The check.
 */
const toyCase = (
  declarations: readonly Declared[],
  c: { readonly note: (situation: ToySituation) => void },
): Effect.Effect<void> =>
  Effect.sync(() => {
    for (const situation of situationsOf(declarations)) {
      c.note(situation);
    }

    const from = work.compiled.length;
    const input: AttributeGrammarInput = {
      declarations,
      governed: [],
      governors: [],
      kinds: Result.getOrThrow(
        roster("NodeKind", [...new Set(Object.values(toyPairs).map(({ kind }) => kind))]),
      ),
      names: Result.getOrThrow(
        roster("AttributeName", [...new Set(Object.values(toyPairs).map(({ name }) => name))]),
      ),
      texts: [],
      typeName: Result.getOrThrow(roster("TypeName", ["Toy"])),
      typeTexts: [],
      versions: Result.getOrThrow(roster("SchemaVersion", schemaVersions)),
    };
    const grammar = Result.getOrThrow(generate(input));
    holdToOracle(input, grammar, work.compiled.slice(from));
  });

/**
 * Draw one toy declaration: a pair and a leaf by the swarm's weights, and its versions.
 *
 * @param pairs - The case's swarm over the pairs.
 * @param leaves - The case's swarm over the leaves.
 * @returns The generator.
 */
const toyDraw =
  (
    pairs: Swarm<(typeof toyPairNames)[number]>,
    leaves: Swarm<(typeof toyLeafNames)[number]>,
  ): Gen<ToyDraw> =>
  (source) => ({
    leaf: source.draw(swarmChoice(leaves, toyLeafNames)),
    pair: source.draw(swarmChoice(pairs, toyPairNames)),
    versions: source.draw(element(["first", "last", "both"] as const)),
  });

/**
 * Draw a toy declaration list under one swarm over the pairs and one over the leaves: up to eight
 * declarations.
 */
const toyList: Gen<readonly ToyDraw[]> = (source) => {
  const pairs = source.draw(swarm(toyPairNames));
  const leaves = source.draw(swarm(toyLeafNames));

  return source.draw(array(toyDraw(pairs, leaves), { max: 8, min: 1 }));
};

/**
 * Every toy draw in the last version: each pair with each leaf.
 */
const toyChoices = pipe(
  toyPairNames,
  Arr.flatMap((pair) =>
    pipe(
      toyLeafNames,
      Arr.map((leaf): ToyDraw => ({ leaf, pair, versions: "last" })),
    ),
  ),
);

describe("the attribute grammar's domain work on toy declarations", () => {
  it.effect(
    "compiles each distinct read definition once and reads every declaration as the oracle does, on every list of one or two declarations",
    (ctx) =>
      // Oracle: each declaration read alone (`oracle`). Bound: every list of one or two of the
      // 6 pairs x 3 leaves in the last version; residual: longer lists and other versions, which
      // the search below draws.
      searched(
        ctx,
        exhaust(
          {
            box: "every list of one or two toy declarations over 6 (kind, attribute) pairs and 3 leaves",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<ToySituation>([
              "a leaf two declarations share",
              "two leaves of one content",
              "one leaf under two sets of readings",
              "two readings of one declaration",
              "an exact reading",
              "an empty definition",
            ]),
            generator: array(element(toyChoices), { max: 2, min: 1 }),
            limit: 342,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "each declaration read alone" },
            suite: "grammar/attributes/work/exhaust",
          },
          (draws, c) => toyCase(toyDeclarations(draws), c),
        ),
      ),
    900_000,
  );

  it.effect(
    "compiles each distinct read definition once and reads every declaration as the oracle does, searched: lists of up to eight declarations under swarm weights",
    (ctx) =>
      // Oracle: each declaration read alone (`oracle`). The search must reach each situation in
      // which a grouping could compile a definition twice or read one declaration under
      // another's readings.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(2),
            concurrency: 1,
            coverage: required<ToySituation>(
              [
                "a leaf two declarations share",
                "two leaves of one content",
                "one leaf under two sets of readings",
                "two readings of one declaration",
                "an exact reading",
                "an empty definition",
              ],
              { cases: 120, sense: notesOnly },
            ),
            draw: drawn(toyList),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "each declaration read alone" },
            runs: 160,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "grammar/attributes/work/search",
          },
          (draws, c) => toyCase(toyDeclarations(draws), c),
        ),
      ),
    900_000,
  );
});
