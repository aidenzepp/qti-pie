import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element, shuffled } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { searched } from "@grizzle/testing/vitest";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import { Array as Arr, Duration, Effect, FileSystem, Formatter, Option } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { contentEnds, contentStep } from "#pantry/grammar/content.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { checkCache, sourcePaths, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { Source } from "#pantry/vocab/inventory/types.ts";
import type { NamespaceClass } from "#pantry/vocab/namespaces.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import {
  acceptorOf,
  resolverOf,
  elementsOf,
  loadXsd,
  validateContents,
  wildcardsOf,
  XsdOracleLayer,
  xsdContents,
} from "#pantry/test/gen/grammar.ts";
import type {
  Content,
  DrawnChild,
  Particle,
  ProbeDocument,
  XsdSet,
} from "#pantry/test/gen/grammar.ts";
import { relaxNgModels, semanticsContexp } from "#pantry/test/gen/relaxng.ts";
import type { MathClasses } from "#pantry/test/gen/relaxng.ts";

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
  composedGrammar: ComposedGrammar,
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
 * Whether a family's counted positions hold their bounds: `Counted`'s law, beside the automaton.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds.
 * @returns Whether every counted position's count lies in its bounds.
 */
const countsHold = (
  composedGrammar: ComposedGrammar,
  version: SchemaVersion,
  parent: string,
  children: readonly string[],
): boolean =>
  composedGrammar.content.counted.rows
    .filter((row) => row.version === version && row.parent === parent)
    .every(({ max, min, position }) => {
      const held = children.filter((child) =>
        Option.exists(
          composedGrammar.admission.lookup({ child, parent, version }),
          (row) => row.position === position,
        ),
      ).length;

      return held >= min && held <= max;
    });

/**
 * Whether a family's element count holds its parent's `OperatorArity` bounds, the law beside the
 * automaton that holds an expression's count of 2 to n (an operator taking two operands refuses
 * one).
 *
 * @param composedGrammar - The grammar.
 * @param parent - The parent's kind.
 * @param children - The children's kinds, every one an element.
 * @returns Whether the count lies in the bounds, true for a kind with no arity.
 */
const arityHolds = (
  composedGrammar: ComposedGrammar,
  parent: string,
  children: readonly string[],
): boolean =>
  Option.match(composedGrammar.operatorArity.lookup({ kind: parent }), {
    onNone: () => true,
    onSome: ({ max, min }) => BigInt(children.length) >= min && BigInt(children.length) <= max,
  });

/**
 * Whether every pinned XSD is in the cache; without them the XSD differentials are skipped.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The pinned schema sets, each in the version its rows are read in.
 */
const schemas: readonly (readonly [SourcePath, SchemaVersion])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1"],
  ["imsqtiv3p0_imscpv1p2_v1p0.xsd", "3.0.0"],
  ["imsqtiv3p0p1_imscpv1p2_v1p0.xsd", "3.0.1"],
  ["imsqti_metadatav3p0_v1p0.xsd", "3.0.1"],
];

/**
 * The pinned schema sets whose models hold every pinned `xs:any`, each with the version its rows
 * are read in and the target namespace its type probes are declared in: the ASI XSDs (which import
 * MathML, SSML and XInclude), a content-packaging XSD, and the LOM binding it imports, whose kinds'
 * types are its own namespace's.
 */
const wildcardSchemas: readonly (readonly [SourcePath, SchemaVersion, string])[] = [
  ["imsqti_asiv3p0_v1p0.xsd", "3.0.0", "http://www.imsglobal.org/xsd/imsqtiasi_v3p0"],
  ["imsqti_asiv3p0p1_v1p0.xsd", "3.0.1", "http://www.imsglobal.org/xsd/imsqtiasi_v3p0"],
  [
    "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
    "3.0.1",
    "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1",
  ],
  ["lom/imsmd_loose_v1p3p2.xsd", "3.0.1", "http://ltsc.ieee.org/xsd/LOM"],
];

/**
 * How long the differentials may take: six reads of the pinned XSDs (the two ASI ones 18 MB each,
 * 3.2 s apiece on 2026-11-05 at a load average of about 15), two `xmllint` runs over the ASI schema
 * (16 s each, the same day), and the in-process comparison. Twice the worst measured, rounded up.
 */
const xsdTimeout = 600_000;

/**
 * A draw from the run's seed: a generator's first case on the stream the run seed and a label mint,
 * so each run draws its own and `TEST_SEED` replays it (doctrine rule 7).
 */
type Seeded = <A>(label: string, generator: Gen<A>) => A;

/**
 * The run's seeded draw.
 */
const seededDraw = runOfProcess.pipe(
  Effect.map(
    (run): Seeded =>
      (label, generator) =>
        sample(generator, rotatingSeed(run.seed, floorSeed(label)), 1).at(0) ??
        assert.fail(`no case drawn for ${label}`),
  ),
);

/**
 * Some of a list, `count` of them or all when it holds fewer, in a drawn order.
 *
 * @param values - The list.
 * @param count - How many to draw.
 * @returns The generator.
 */
const someOf = (values: readonly string[], count: number): Gen<readonly string[]> =>
  shuffled(values, { max: Math.min(count, values.length), min: Math.min(count, values.length) });

/**
 * The most kinds an alphabet holds of those a model's element particles name: every one where the
 * model names at most this many, else this many drawn from the run's seed.
 */
const namedBound = 4;

/**
 * Draw the child kinds a model's differential draws its sequences over: {@link namedBound} of the
 * kinds its element particles name, one kind only its wildcard admits, and one element kind its
 * parent does not admit at all, the named invalid variant, each drawn from the run's seed.
 *
 * @param named - The kinds the element particles name, in particle order.
 * @param byWildcard - The admitted kinds no element particle names.
 * @param unadmitted - The element kinds the parent does not admit.
 * @returns The alphabet's generator.
 */
const alphabetOf =
  (
    named: readonly string[],
    byWildcard: readonly string[],
    unadmitted: readonly string[],
  ): Gen<readonly string[]> =>
  (source) => [
    ...new Set([
      ...source.draw(someOf(named, namedBound)),
      ...source.draw(someOf(byWildcard, 1)),
      ...source.draw(someOf(unadmitted, 1)),
    ]),
  ];

/**
 * Read spec reading 2's classes from a schema's own reading of the XSD: the content expressions,
 * the XSD's `ContExp` as `m:condition`'s model names it with the RelaxNG's `semantics-contexp`, and
 * the math expressions, as `m:mrow`'s model names them (`#pantry/test/gen/relaxng.ts`).
 *
 * @param contents - The schema's contents, by kind.
 * @param resolve - The grammar's name resolution under a parent.
 * @param namespaceOf - A kind's namespace, none for a kind with no element name.
 * @returns The classes.
 */
const mathClassesOf = (
  contents: ReadonlyMap<string, readonly Content[]>,
  resolve: (namespace: string, local: string, parent: string) => Option.Option<string>,
  namespaceOf: (kind: string) => Option.Option<string>,
): MathClasses => {
  const namedBy = (parent: string): readonly string[] =>
    (contents.get(parent) ?? [])
      .flatMap(({ particle }) => Option.toArray(particle))
      .flatMap(elementsOf)
      .flatMap(({ members }) => members)
      .flatMap(({ name }) => Option.toArray(resolve(name.namespace, name.local, parent)));

  return {
    // The parent's wildcard decides which outside elements stand for `anyElement`: its admitted
    // kinds the XSD does not name, which each model's test reads (`byWildcard`).
    anyElement: () => false,
    content: new Set([...namedBy("m:condition"), semanticsContexp]),
    inMathml: (kind) =>
      kind === foreignKinds.own ||
      Option.contains(namespaceOf(kind), "http://www.w3.org/1998/Math/MathML"),
    math: new Set(namedBy("m:mrow")),
  };
};

/**
 * A section's parts, of which spec reading 26 requires one.
 */
const sectionParts: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
  "xi:include",
]);

/**
 * Every sequence of at most `length` letters of an alphabet, shortest first.
 *
 * @param alphabet - The letters.
 * @param length - The longest sequence.
 * @returns The sequences.
 */
const sequencesOf = (alphabet: readonly string[], length: number): readonly (readonly string[])[] =>
  Array.from({ length: length + 1 }, (_, size) => size).flatMap((size) => {
    let words: (readonly string[])[] = [[]];
    for (let at = 0; at < size; at += 1) {
      words = words.flatMap((word) => alphabet.map((letter) => [...word, letter]));
    }

    return words;
  });

/**
 * A probe document with the kinds of its children and its parent's kind.
 */
type KindProbe = ProbeDocument & { readonly kinds: readonly string[]; readonly parentKind: string };

/**
 * Write an element kind as the child a probe document holds: its element's name, or a foreign
 * element for a kind with none.
 *
 * @param composedGrammar - The grammar.
 * @param kind - The kind.
 * @returns The child.
 */
const childOf = (composedGrammar: ComposedGrammar, kind: string): DrawnChild =>
  Option.match(composedGrammar.kinds.elementName.lookup({ kind }), {
    onNone: () => ({ _tag: "wildcard", namespace: "##other" }),
    onSome: ({ local, namespace }) => ({ _tag: "element", name: { local, namespace } }),
  });

/**
 * One schema's drawn probes: the probes, and how many kinds were skipped for holding more than one
 * content.
 */
interface DrawnProbes {
  readonly probes: readonly KindProbe[];
  readonly skipped: number;
}

/**
 * How many families a model's xmllint probe draws, and the most children each holds.
 */
const probeBound = { children: 2, families: 6 } as const;

/**
 * Draw the probes of one schema's models with a named type in the target namespace: for each,
 * {@link probeBound}'s families of the model's admitted element kinds, drawn from the run's seed.
 * A kind the walk reached with more than one distinct content (its declarations state more than
 * one type) has no one model to probe, and is counted as skipped. Every admitted kind is drawn,
 * those a wildcard admits among them: spec reading 72 admits under a wildcard only the global
 * elements the schema set declares, so xmllint judges each against the same declarations.
 *
 * @param input - The schema's contents and what probing them reads.
 * @param input.contents - Each kind's contents, as the reader walked them.
 * @param input.draw - The run's seeded draw.
 * @param input.grammar - The grammar.
 * @param input.root - The schema's root file, which labels each model's stream.
 * @param input.target - The schema's target namespace.
 * @param input.version - The schema's version.
 * @returns The probes, and how many kinds were skipped for holding more than one content.
 */
const probesOf = (input: {
  readonly contents: ReadonlyMap<string, readonly Content[]>;
  readonly draw: Seeded;
  readonly grammar: ComposedGrammar;
  readonly root: string;
  readonly target: string;
  readonly version: SchemaVersion;
}): DrawnProbes => {
  const { contents, draw, grammar: composedGrammar, target, version } = input;
  let skipped = 0;
  const probes = [...contents].flatMap(([parent, readings]): readonly KindProbe[] => {
    const [reading, ...others] = readings;
    if (others.length > 0) {
      skipped += 1;

      return [];
    }

    if (
      reading === undefined ||
      !reading.type.startsWith(`{${target}}`) ||
      Option.isNone(reading.particle)
    ) {
      return [];
    }

    const admitted = composedGrammar.admission.rows
      .filter(
        (row) =>
          row.version === version &&
          row.parent === parent &&
          !isForeignKind(row.child) &&
          Option.isSome(composedGrammar.kinds.isElement.lookup({ kind: row.child })),
      )
      .map(({ child }) => child);
    const type = { local: reading.type.slice(reading.type.indexOf("}") + 1), namespace: target };
    const families: readonly (readonly string[])[] = Arr.isReadonlyArrayNonEmpty(admitted)
      ? draw(
          `grammar/content/xmllint ${input.root} ${parent}`,
          array(array(element(admitted), { max: probeBound.children, min: 0 }), {
            max: probeBound.families,
            min: probeBound.families,
          }),
        )
      : [[]];

    return families.map((children) => ({
      children: children.map((kind) => childOf(composedGrammar, kind)),
      kinds: children,
      parent: { _tag: "type", type },
      parentKind: parent,
      type: Option.none(),
    }));
  });

  return { probes, skipped };
};

/**
 * Draw the probes of one model holding a wildcard: every family of at most two children over an
 * undeclared element of each namespace class and one kind the model names, holding at least one of
 * the undeclared elements. The parent is its global element where a schema declares one, else its
 * named type in the target namespace.
 *
 * @param input - The model and what probing it reads.
 * @param input.grammar - The grammar.
 * @param input.parent - The model's kind.
 * @param input.readings - The kind's contents, as the reader walked them.
 * @param input.resolve - The composition's resolution.
 * @param input.set - The schema set.
 * @param input.target - The target namespace of the type probes.
 * @returns The probes, none for a model with no wildcard; or none at all for a model with a
 *   wildcard and nothing to probe it as.
 */
const wildcardProbesOf = (input: {
  readonly grammar: ComposedGrammar;
  readonly parent: string;
  readonly readings: readonly Content[];
  readonly resolve: (namespace: string, local: string, parent: string) => Option.Option<string>;
  readonly set: XsdSet;
  readonly target: string;
}): Option.Option<readonly KindProbe[]> => {
  const { parent, resolve, target } = input;
  const [reading, ...others] = input.readings;
  const particle = Option.flatMap(Option.fromNullishOr(reading), (held) => held.particle);
  const wildcards = Option.match(particle, { onNone: () => [], onSome: wildcardsOf });
  if (reading === undefined || others.length > 0 || wildcards.length === 0) {
    return Option.some([]);
  }

  const name = Option.getOrUndefined(input.grammar.kinds.elementName.lookup({ kind: parent }));
  const global =
    name !== undefined &&
    input.set.elements.has(`{${name.namespace}}${name.local}`) &&
    Option.contains(resolve(name.namespace, name.local, "document"), parent);
  if (!global && !reading.type.startsWith(`{${target}}`)) {
    return Option.none();
  }

  const named = Option.match(particle, {
    onNone: (): readonly string[] => [],
    onSome: (held) =>
      elementsOf(held)
        .flatMap(({ members }) => members)
        .flatMap((member) =>
          Option.toArray(resolve(member.name.namespace, member.name.local, parent)),
        ),
  });
  const classes: readonly (readonly [NamespaceClass, string])[] = [
    ["absent", ""],
    ["own", name?.namespace ?? target],
    ["other", "urn:x-grammar-test-foreign"],
  ];
  const letters: readonly (readonly [string, DrawnChild])[] = [
    ...classes.map(([namespaceClass, namespace]): readonly [string, DrawnChild] => [
      foreignKinds[namespaceClass],
      { _tag: "element", name: { local: "undeclared", namespace } },
    ]),
    ...named
      .slice(0, 1)
      .map((kind): readonly [string, DrawnChild] => [kind, childOf(input.grammar, kind)]),
  ];
  const probe: KindProbe["parent"] =
    global && name !== undefined
      ? { _tag: "global", name }
      : {
          _tag: "type",
          type: { local: reading.type.slice(reading.type.indexOf("}") + 1), namespace: target },
        };

  return Option.some(
    sequencesOf(
      letters.map((_, index) => String(index)),
      2,
    ).flatMap((word) => {
      const drawn = word.flatMap((index) => Option.toArray(Arr.get(letters, Number(index))));

      return drawn.some(([kind]) => isForeignKind(kind))
        ? [
            {
              children: drawn.map(([, child]) => child),
              kinds: drawn.map(([kind]) => kind),
              parent: probe,
              parentKind: parent,
              type: Option.none(),
            },
          ]
        : [];
    }),
  );
};

describe.skipIf(!cached)("the content automata against the XSD", () => {
  it.effect(
    "accept exactly the child sequences the independent reading's automaton accepts, every model with one content: every sequence of at most 3 children (4 over an alphabet of at most 4) over at most 4 kinds it names, one only its wildcard admits and one it refuses, drawn from the run seed",
    (ctx) =>
      // Oracle: a second implementation, the tests' own automaton of each XSD particle
      // (`acceptorOf`), with spec readings 2 and 26 ruled where they narrow the XSD.
      // Bound: namedBound of the kinds a model names (every one where it names at most that many),
      // one kind only its wildcard admits and one element kind it does not admit, each a fresh draw
      // each run (TEST_SEED replays it); every sequence of at most 3 children over that alphabet, 4
      // where it holds at most 4 kinds. A kind with more than one content is skipped, and the count
      // reported.
      Effect.gen(function* everyModel() {
        const composedGrammar = yield* grammar;
        const { admission, kinds } = composedGrammar;
        const draw = yield* seededDraw;
        const isElement = (kind: string) => Option.isSome(kinds.isElement.lookup({ kind }));
        const disagreements: string[] = [];
        let compared = 0;
        let models = 0;
        let ruled = 0;
        let skipped = 0;
        let drawnFrom = 0;
        for (const [root, version] of schemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, (namespace, local, parent) =>
            resolverOf(kinds)(namespace, local, parent),
          );
          const classes = mathClassesOf(contents, resolverOf(kinds), (kind) =>
            Option.map(kinds.elementName.lookup({ kind }), ({ namespace }) => namespace),
          );
          for (const [parent, readings] of contents) {
            const [reading, ...others] = readings;
            skipped += others.length > 0 ? 1 : 0;
            if (reading !== undefined && others.length === 0) {
              const resolve = (
                members: readonly {
                  readonly name: { readonly local: string; readonly namespace: string };
                }[],
              ) =>
                members.flatMap((member) =>
                  Option.toArray(
                    resolverOf(kinds)(member.name.namespace, member.name.local, parent),
                  ),
                );
              const named: readonly string[] = Option.match(reading.particle, {
                onNone: (): readonly string[] => [],
                onSome: (particle) => [
                  ...new Set(elementsOf(particle).flatMap((held) => resolve(held.members))),
                ],
              });
              const admitted = admission.rows
                .filter(
                  (row) => row.version === version && row.parent === parent && isElement(row.child),
                )
                .map(({ child }) => child);
              const byWildcard = admitted.filter((child) => !named.includes(child));
              const unadmitted = kinds.nodeKind.handles.filter(
                (kind) => isElement(kind) && !admitted.includes(kind),
              );
              const oracle = Option.match(reading.particle, {
                onNone: () => (children: readonly string[]) => children.length === 0,
                onSome: (particle) => acceptorOf(particle, resolve, byWildcard),
              });
              const alphabet = draw(
                `grammar/content/alphabet ${root} ${parent}`,
                alphabetOf(named, byWildcard, unadmitted),
              );
              models += 1;
              drawnFrom += named.length > namedBound ? 1 : 0;
              for (const children of sequencesOf(alphabet, alphabet.length <= 4 ? 4 : 3)) {
                compared += 1;
                const installed = accepts(composedGrammar, version, parent, children);
                const xsd = oracle(children);
                // Spec reading 26: a section holds at least one part, where its XSD admits none. The
                // installed model refuses exactly the sequences the XSD accepts that hold no part.
                const reading26 =
                  parent === "qti-assessment-section" &&
                  xsd &&
                  !installed &&
                  !children.some((child) => sectionParts.has(child));
                // Spec reading 2: under the models it restates or edits, the MathML 3 RelaxNG
                // decides, in both directions, and where the XSD differs it is the reading's.
                const rng = relaxNgModels.get(parent);
                if (rng !== undefined) {
                  if (
                    installed !==
                    rng(children, { ...classes, anyElement: (kind) => byWildcard.includes(kind) })
                  ) {
                    disagreements.push(
                      `${root} ${version} ${parent} [${children.join(", ")}]: installed ${installed ? "accepts" : "refuses"} against the RelaxNG`,
                    );
                  } else if (installed !== xsd) {
                    ruled += 1;
                  }
                } else if (reading26) {
                  ruled += 1;
                } else if (installed !== xsd) {
                  disagreements.push(
                    `${root} ${version} ${parent} [${children.join(", ")}]: installed ${installed ? "accepts" : "refuses"}`,
                  );
                }
              }
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${models} models (${drawnFrom} naming more than ${namedBound} kinds, whose ${namedBound} the run seed drew), ${compared} sequences, ${ruled} ruled by readings 2 and 26; ${skipped} kinds skipped for holding more than one content`,
            "bound",
          ),
        );
        assert.isAbove(compared, 0);
        assert.deepStrictEqual(disagreements.slice(0, 40), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );

  it.effect(
    "agree with xmllint, counts and arities included, on every ASI model with a named type and one content: 6 families of at most 2 of its admitted element kinds a model, drawn from the run seed",
    (ctx) =>
      // Oracle: libxml2's schema validator over the pinned ASI XSDs, against the automaton with
      // the two count laws beside it, Counted and OperatorArity.
      // Bound: probeBound's families a model, a fresh draw each run (TEST_SEED replays it), over
      // the admitted kinds the ASI schema set declares; a kind with more than one content is
      // skipped, and both counts reported.
      Effect.gen(function* againstXmllint() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const draw = yield* seededDraw;
        const target = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";
        const failures: string[] = [];
        let probed = 0;
        let skipped = 0;
        for (const [root, version] of schemas.slice(0, 2)) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, (namespace, local, parent) =>
            resolverOf(kinds)(namespace, local, parent),
          );
          const drawnProbes = probesOf({
            contents,
            draw,
            grammar: composedGrammar,
            root,
            target,
            version,
          });
          const { probes } = drawnProbes;
          skipped += drawnProbes.skipped;
          const verdicts = yield* Effect.scoped(validateContents(root, target, probes));
          for (const [index, probe] of probes.entries()) {
            probed += 1;
            const expected =
              accepts(composedGrammar, version, probe.parentKind, probe.kinds) &&
              countsHold(composedGrammar, version, probe.parentKind, probe.kinds) &&
              arityHolds(composedGrammar, probe.parentKind, probe.kinds);
            const verdict = verdicts[index];
            const reading26 =
              probe.parentKind === "qti-assessment-section" &&
              !expected &&
              verdict?.refused === false &&
              !probe.kinds.some((child) => sectionParts.has(child));
            if (!reading26 && (verdict === undefined || verdict.refused === expected)) {
              failures.push(
                `${version} ${probe.parentKind} [${probe.kinds.join(", ")}]: the grammar ${expected ? "accepts" : "refuses"}, xmllint ${verdict?.refused === true ? "refuses" : "accepts"}${(verdict?.messages.length ?? 0) > 0 ? `: ${verdict?.messages[0] ?? ""}` : ""}`,
              );
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${probed} probes; ${skipped} kinds skipped for holding more than one content`,
            "xmllint",
          ),
        );
        assert.isAbove(probed, 0);
        assert.deepStrictEqual(failures.slice(0, 40), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );

  it.effect(
    "admit a foreign element at each wildcard position exactly when xmllint does, in each namespace class: every model holding an xs:any, every family of at most 2 children over an undeclared element in no namespace, the parent's and another, and one kind the model names",
    (ctx) =>
      // Oracle: libxml2's schema validator over the pinned XSDs. An undeclared element is drawn in
      // each namespace class of §3.10.1 relative to its parent, as its foreign kind: no namespace,
      // the parent's own, and one no schema names. So the XSD decides by the wildcard's namespace
      // constraint, processing and position, both where it admits the child and where it refuses.
      // A drawn element carries no xsi:type, so under a strict wildcard nothing assesses it, and
      // the grammar's verdict is the automaton's with `StrictlyHeld`'s refusal beside it (spec
      // reading 72, §3.10.4 clause 2).
      Effect.gen(function* foreignAtWildcards() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const failures: string[] = [];
        let probed = 0;
        let models = 0;
        let unprobed = 0;
        for (const [root, version, target] of wildcardSchemas) {
          const { set } = yield* loadXsd(root);
          const resolve = resolverOf(kinds);
          const { contents } = xsdContents(set, resolve);
          const probes: KindProbe[] = [];
          for (const [parent, readings] of contents) {
            const drawn = wildcardProbesOf({
              grammar: composedGrammar,
              parent,
              readings,
              resolve,
              set,
              target,
            });
            if (Option.isSome(drawn)) {
              models += drawn.value.length > 0 ? 1 : 0;
              probes.push(...drawn.value);
            } else {
              unprobed += 1;
            }
          }

          const verdicts = yield* Effect.scoped(validateContents(root, target, probes));
          for (const [index, probe] of probes.entries()) {
            probed += 1;
            const strictlyHeld = probe.kinds.some(
              (kind) =>
                isForeignKind(kind) &&
                Option.isSome(
                  composedGrammar.content.strictlyHeld.lookup({
                    child: kind,
                    parent: probe.parentKind,
                    version,
                  }),
                ),
            );
            const expected =
              accepts(composedGrammar, version, probe.parentKind, probe.kinds) &&
              countsHold(composedGrammar, version, probe.parentKind, probe.kinds) &&
              arityHolds(composedGrammar, probe.parentKind, probe.kinds) &&
              !strictlyHeld;
            const verdict = verdicts[index];
            if (verdict === undefined || verdict.refused === expected) {
              failures.push(
                `${root} ${probe.parentKind} [${probe.kinds.join(", ")}]: the grammar ${expected ? "accepts" : "refuses"}, xmllint ${verdict?.refused === true ? "refuses" : "accepts"}${(verdict?.messages.length ?? 0) > 0 ? `: ${verdict?.messages[0] ?? ""}` : ""}`,
              );
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${models} models with a wildcard, ${probed} probes, ${unprobed} models with no global element or named type to probe`,
            "xmllint",
          ),
        );
        assert.isAbove(probed, 0);
        assert.deepStrictEqual(failures.slice(0, 40), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

/**
 * The element kinds a document's root may be, read off the QTI 3.0 Best Practice and
 * Implementation Guide independently of the facets: the manifest's (§6.1.1, `imsmanifest.xml`), and
 * the root of each file a §6.2 resource type the composition reads holds, the class its
 * description names (an AssessmentTest, AssessmentSection, AssessmentItem, OutcomeDeclaration,
 * AssessmentStimulus and ResponseProcessing, the last both a template's and a resource's), §6.3's
 * external metadata (LOM's `lom`) and §6.5's usage data (`usageData`).
 */
const statedRoots: ReadonlySet<string> = new Set([
  "cp:manifest",
  "qti-assessment-test",
  "qti-assessment-section",
  "qti-assessment-item",
  "qti-outcome-declaration",
  "qti-assessment-stimulus",
  "qti-response-processing",
  "lom:lom",
  "ud:usageData",
]);

/**
 * The document node's children a differential draws over: the doctype, two root kinds, an element
 * that is no root, and whitespace and a comment, which stand anywhere.
 */
const documentChildren = [
  "doctype",
  "qti-assessment-item",
  "cp:manifest",
  "p",
  "ws",
  "comment",
] as const;

describe.skipIf(!cached)("the occurrence bounds the automata relax", () => {
  it.effect(
    "are laws beside them: an element particle's in Counted, a group's in OperatorArity, and Counted holds those, nothing else",
    () =>
      // Oracle: the tests' own reading of the XSDs. A position automaton holds a particle's bound
      // exactly when its least is 0 or 1 and its greatest 1 or unbounded (Brüggemann-Klein and
      // Wood); every other bound is a count, which Counted states for one particle's children
      // and OperatorArity for a whole content's, and which only holds as a total where no
      // enclosing group may repeat or be absent.
      Effect.gen(function* relaxed() {
        const composedGrammar = yield* grammar;
        const { admission, content, kinds, operatorArity } = composedGrammar;
        const arities = new Set(operatorArity.rows.map(({ kind }) => kind));
        const expected = new Set<string>();
        const unstatable: string[] = [];
        const counted = (
          version: SchemaVersion,
          parent: string,
          kind: string,
          min: number,
          max: number,
        ) => {
          const position = Option.match(admission.lookup({ child: kind, parent, version }), {
            onNone: () => "none",
            onSome: (row) => row.position,
          });
          expected.add(`${version} ${parent} ${position} ${min} ${max}`);
        };
        for (const [root, version] of schemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, resolverOf(kinds));
          for (const [parent, models] of contents) {
            const walk = (particle: Particle, enclosed: boolean): void => {
              const { max, min } = particle.occurs;
              const relaxes = min >= 2 || (max >= 2 && Number.isFinite(max));
              if (relaxes && particle._tag === "element" && !enclosed) {
                for (const { name } of particle.members) {
                  for (const kind of Option.toArray(
                    resolverOf(kinds)(name.namespace, name.local, parent),
                  )) {
                    counted(version, parent, kind, min, max);
                  }
                }
              } else if (relaxes && particle._tag !== "element" && particle._tag !== "any") {
                if (enclosed || !arities.has(parent)) {
                  unstatable.push(`${root} ${parent}: a ${particle._tag} of ${min}..${max}`);
                }
              } else if (relaxes) {
                unstatable.push(`${root} ${parent}: a ${particle._tag} of ${min}..${max} inside`);
              }

              if (particle._tag !== "element" && particle._tag !== "any") {
                for (const child of particle.particles) {
                  walk(child, enclosed || max > 1 || min === 0);
                }
              }
            };
            for (const particle of models.flatMap((model) => Option.toArray(model.particle))) {
              walk(particle, false);
            }
          }
        }

        assert.deepStrictEqual(unstatable, []);
        assert.deepStrictEqual(
          new Set(
            content.counted.rows.map(
              ({ max, min, parent, position, version }) =>
                `${version} ${parent} ${position} ${min} ${max}`,
            ),
          ),
          expected,
        );
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

/**
 * Whether a pinned XSD file is one of a version's: a file whose name pins 3.0.1 (`v3p0p1`), or the
 * 3.0.0 twin of such a file, belongs to that version alone; every other file to both.
 *
 * @param file - The file, as `sources.ts` names it.
 * @param version - The version.
 * @returns Whether the version reads the file.
 */
const pinnedTo = (file: string, version: SchemaVersion): boolean => {
  if (file.includes("v3p0p1")) {
    return version === "3.0.1";
  }

  const twin = file.replace("v3p0_", "v3p0p1_");

  return twin === file || !sourcePaths.some((path) => path === twin) || version === "3.0.0";
};

describe.skipIf(!cached)("the content grammar's sources", () => {
  it.effect(
    "source every Follow, Last, Symbol, Counted and Admission row: an XSD source is a line of its version's file that opens a particle or a model, and any other cites what states it",
    () =>
      // Oracle: the pinned XSD files' own text, read line by line apart from every reader, and
      // the versions their names pin. The box is every row of the five relations.
      Effect.gen(function* sources() {
        const { admission, content } = yield* grammar;
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* xsdDirectory;
        const lines = new Map<string, readonly string[]>();
        const linesOf = (file: string) =>
          Effect.gen(function* read() {
            const held = lines.get(file);
            if (held !== undefined) {
              return held;
            }

            const bytes = yield* fs.readFile(`${directory}/${file}`);
            // XInclude.xsd is published in UTF-16 with a byte-order mark.
            const text = new TextDecoder(
              bytes[0] === 0xff && bytes[1] === 0xfe ? "utf-16le" : "utf-8",
            ).decode(bytes);
            const split = text.split("\n");
            lines.set(file, split);

            return split;
          });
        // A schema document binds the XML Schema namespace to a prefix of its own (`xs:`, `xsd:`).
        const opens =
          /<(?:[\w.-]+:)?(?:all|any|choice|complexContent|complexType|element|extension|group|restriction|sequence|simpleContent)\b/u;
        const wrong: string[] = [];
        const checked = new Set<string>();
        const check = (relation: string, version: SchemaVersion, found: Option.Option<Source>) =>
          Effect.gen(function* checkSource() {
            if (Option.isNone(found)) {
              wrong.push(`${relation}: a ${version} row with no source`);

              return;
            }

            const source = found.value;
            if (source._tag === "spec") {
              if (source.cite.trim() === "") {
                wrong.push(`${relation}: a ${version} row cites nothing`);
              }

              return;
            }

            const at = `${version} ${source.file}:${String(source.line)}`;
            if (!checked.has(at)) {
              checked.add(at);

              const text = (yield* linesOf(source.file))[source.line - 1] ?? "";
              if (!opens.test(text) || !pinnedTo(source.file, version)) {
                wrong.push(`${relation} ${at}: ${text.trim()}`);
              }
            }
          });
        for (const row of admission.rows) {
          yield* check("Admission", row.version, admission.sourceOf(row));
        }

        for (const row of content.follow.rows) {
          yield* check("Follow", row.version, content.follow.sourceOf(row));
        }

        for (const row of content.last.rows) {
          yield* check("Last", row.version, content.last.sourceOf(row));
        }

        for (const row of content.symbol.rows) {
          yield* check("Symbol", row.version, content.symbol.sourceOf(row));
        }

        for (const row of content.counted.rows) {
          yield* check("Counted", row.version, content.counted.sourceOf(row));
        }

        assert.isAbove(checked.size, 0);
        assert.deepStrictEqual(wrong.slice(0, 20), []);
      }).pipe(Effect.provide(NodeServices.layer)),
    xsdTimeout,
  );
});

describe.skipIf(!cached)("the LOM binding's repeats", () => {
  it.effect(
    "are admitted past any count, as its unbounded choices state: every LOM model, every kind it names, twice and three times",
    () =>
      // Oracle: the tests' own reading of the LOM binding. It writes each category as an
      // unbounded choice of its elements (`imsmd_loose_v1p3p2.xsd:984`, `AggregationLevel.Type`,
      // and its siblings), and no source caps the repeats (1EdTech's Best Practice Guide v1.3
      // §2.3.7 states no count), so a family the binding's acceptor accepts is the grammar's too.
      Effect.gen(function* lomRepeats() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const { set } = yield* loadXsd("lom/imsmd_loose_v1p3p2.xsd");
        const resolve = resolverOf(kinds);
        const { contents } = xsdContents(set, resolve);
        const disagreements: string[] = [];
        let compared = 0;
        for (const [parent, readings] of contents) {
          for (const particle of readings.flatMap((reading) => Option.toArray(reading.particle))) {
            const named = [
              ...new Set(
                elementsOf(particle).flatMap(({ members }) =>
                  members.flatMap((member) =>
                    Option.toArray(resolve(member.name.namespace, member.name.local, parent)),
                  ),
                ),
              ),
            ];
            const acceptor = acceptorOf(
              particle,
              (members) =>
                members.flatMap((member) =>
                  Option.toArray(resolve(member.name.namespace, member.name.local, parent)),
                ),
              [],
            );
            for (const kind of named) {
              for (const children of [
                [kind, kind],
                [kind, kind, kind],
              ]) {
                compared += 1;
                const expected = acceptor(children);
                const verdict =
                  accepts(composedGrammar, "3.0.1", parent, children) &&
                  countsHold(composedGrammar, "3.0.1", parent, children);
                if (verdict !== expected) {
                  disagreements.push(
                    `${parent} [${children.join(", ")}]: the grammar ${verdict ? "accepts" : "refuses"}, the binding ${expected ? "accepts" : "refuses"}`,
                  );
                }
              }
            }
          }
        }

        assert.isAbove(compared, 0);
        assert.deepStrictEqual(disagreements.slice(0, 20), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

describe("the installed automata", () => {
  it.effect(
    "are trim: in every family each position Follow, Last or Admission names is reached from the start and reaches an end",
    () =>
      // Oracle: graph reachability over the installed rows, a second computation that shares
      // nothing with the construction. A position no family can reach, or none can leave
      // lawfully, would make an admitted kind a dead letter, which a content model never states.
      Effect.gen(function* trim() {
        const { admission, content } = yield* grammar;
        const families = new Map<
          string,
          { readonly ends: Set<string>; readonly edges: Map<string, Set<string>> }
        >();
        const familyOf = (version: string, parent: string) => {
          const key = `${version} ${parent}`;
          const held = families.get(key) ?? {
            edges: new Map<string, Set<string>>(),
            ends: new Set<string>(),
          };
          families.set(key, held);

          return held;
        };
        for (const { from, parent, to, version } of content.follow.rows) {
          const { edges } = familyOf(version, parent);
          edges.set(from, (edges.get(from) ?? new Set()).add(to));
        }

        for (const { parent, position, version } of content.last.rows) {
          familyOf(version, parent).ends.add(position);
        }

        const named = [
          ...content.follow.rows.flatMap(({ from, parent, to, version }) => [
            { parent, position: from, version },
            { parent, position: to, version },
          ]),
          ...content.last.rows,
          ...admission.rows.filter(({ position }) => position !== "0"),
          ...content.symbol.rows,
        ];
        const dead: string[] = [];
        const reachedOf = new Map<string, ReadonlySet<string>>();
        const endingOf = new Map<string, ReadonlySet<string>>();
        for (const [key, { edges, ends }] of families) {
          const reached = new Set<string>();
          const pending = ["0"];
          for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
            if (!reached.has(next)) {
              reached.add(next);
              pending.push(...(edges.get(next) ?? []));
            }
          }

          const ending = new Set(ends);
          let grew = true;
          while (grew) {
            grew = false;
            for (const [from, targets] of edges) {
              if (!ending.has(from) && [...targets].some((to) => ending.has(to))) {
                ending.add(from);
                grew = true;
              }
            }
          }

          reachedOf.set(key, reached);
          endingOf.set(key, ending);
        }

        for (const { parent, position, version } of named) {
          const key = `${version} ${parent}`;
          if (
            !(reachedOf.get(key)?.has(position) ?? false) ||
            !(endingOf.get(key)?.has(position) ?? false)
          ) {
            dead.push(`${key} ${position}`);
          }
        }

        assert.isAbove(families.size, 0);
        assert.deepStrictEqual([...new Set(dead)].slice(0, 20), []);
      }),
    60_000,
  );
});

describe.skipIf(!cached)("spec reading 40 in ssml:speak", () => {
  it.effect(
    "accepts exactly what the XSD accepts of the elements, with no meta, metadata or lexicon after non-whitespace text, every family of at most 4 children",
    (ctx) =>
      Effect.gen(function* readingForty() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const { set } = yield* loadXsd("imsqti_asiv3p0p1_v1p0.xsd");
        const { contents } = xsdContents(set, resolverOf(kinds));
        const [speak] = (contents.get("ssml:speak") ?? []).flatMap(({ particle }) =>
          Option.toArray(particle),
        );
        const resolve = (
          members: readonly {
            readonly name: { readonly local: string; readonly namespace: string };
          }[],
        ) =>
          members.flatMap((member) =>
            Option.toArray(
              resolverOf(kinds)(member.name.namespace, member.name.local, "ssml:speak"),
            ),
          );
        // The oracle: the XSD's own model over the elements, by the tests' reader, and reading 40
        // turned into a checker over the text.
        const elementsAccepted = Option.match(Option.fromNullishOr(speak), {
          onNone: () => () => false,
          onSome: (particle) => acceptorOf(particle, resolve, [foreignKinds.other]),
        });
        const leading: ReadonlySet<string> = new Set([
          "ssml:meta",
          "ssml:metadata",
          "ssml:lexicon",
        ]);

        return yield* searched(
          ctx,
          exhaust(
            {
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
              generator: array(
                element(["ssml:meta", "ssml:p", foreignKinds.other, "text", "ws"] as const),
                { max: 4, min: 0 },
              ),
              limit: 1000,
              literal: Formatter.format,
              suite: "grammar/content/reading-40",
            },
            (children, c) =>
              Effect.sync(() => {
                const elements = children.filter((child) => child !== "text" && child !== "ws");
                const firstText = children.indexOf("text");
                const expected =
                  elementsAccepted(elements) &&
                  (firstText === -1 ||
                    children.slice(firstText).every((child) => !leading.has(child)));
                const verdict =
                  accepts(composedGrammar, "3.0.1", "ssml:speak", children) &&
                  countsHold(composedGrammar, "3.0.1", "ssml:speak", children);
                c.note(verdict ? "accepted" : "refused");

                assert.strictEqual(verdict, expected, children.join(" "));
              }),
          ),
        );
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

describe("the document node's content model (R5)", () => {
  it.effect(
    "holds at most one doctype, then exactly one root, character data anywhere, every family of at most 4 children",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
            generator: array(element(documentChildren), { max: 4, min: 0 }),
            limit: 2000,
            literal: Formatter.format,
            suite: "grammar/content/document",
          },
          (children, c) =>
            Effect.gen(function* documentLaw() {
              const composedGrammar = yield* grammar;
              // The oracle: XML 1.0's document production, read as R5 states it.
              const elements = children.filter((child) => child !== "ws" && child !== "comment");
              const roots = elements.filter((child) => statedRoots.has(child));
              const doctypes = elements.filter((child) => child === "doctype");
              const expected =
                roots.length === 1 &&
                doctypes.length <= 1 &&
                elements.every((child) => child === "doctype" || statedRoots.has(child)) &&
                (doctypes.length === 0 ||
                  elements.indexOf("doctype") <
                    elements.findIndex((child) => statedRoots.has(child)));
              const verdict = accepts(composedGrammar, "3.0.1", "document", children);
              c.note(verdict ? "accepted" : "refused");

              assert.strictEqual(verdict, expected);
            }),
        ),
      ),
  );

  it.effect(
    "takes exactly the stated roots as its one element, every element kind of the composition, in both versions",
    () =>
      // Oracle: the specification as a checker, the guide's document roots (`statedRoots`), over
      // every element kind, so a root the model drops or one it adds fails.
      Effect.gen(function* everyRoot() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const elementKinds = kinds.nodeKind.handles.filter((kind) =>
          Option.isSome(kinds.isElement.lookup({ kind })),
        );
        for (const version of schemaVersions) {
          assert.deepStrictEqual(
            new Set(
              elementKinds.filter((kind) => accepts(composedGrammar, version, "document", [kind])),
            ),
            statedRoots,
            version,
          );
        }
      }),
  );
});
