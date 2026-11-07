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
import { Array as Arr, Duration, Effect, FileSystem, Formatter, Option, Result } from "effect";
import { int8Max } from "#pantry/grammar/closed.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { contentEnds, contentModelOf, contentStep } from "#pantry/grammar/content.ts";
import { fragmentRoots } from "#pantry/grammar/facets.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { checkCache, sourcePaths, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type {
  ContentModel,
  Particle as ModelParticle,
  Source,
} from "#pantry/vocab/inventory/types.ts";
import { asiNamespace, vocabularyNamespaces } from "#pantry/vocab/namespaces.ts";
import type { NamespaceClass } from "#pantry/vocab/namespaces.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";
import {
  acceptorOf,
  resolverOf,
  elementsOf,
  loadXsd,
  nameKey,
  toyFacets,
  toyGrammar,
  toySources,
  toyVocabulary,
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
  Validated,
  XsdName,
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
 * Whether a family's counted positions hold their bounds: `Counted`'s law, beside the automaton.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version.
 * @param parent - The parent's kind.
 * @param children - The children's kinds.
 * @returns Whether every counted position's count lies in its bounds.
 */
const countsHold = (
  composedGrammar: Pick<ComposedGrammar, "admission" | "content">,
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
 * One at-most-one assert of the loose LOM binding's embedded Schematron: the kind of its rule's
 * context, the kind it caps there, and its line in `lom/imsmd_loose_v1p3p2.xsd`.
 */
interface SchematronCap {
  readonly child: string;
  readonly line: number;
  readonly parent: string;
}

/**
 * Read the loose LOM binding's Schematron from the binding's own text, apart from every reader and
 * from the facets (spec reading 130): each rule's context, an absolute path from `lom:lom`,
 * resolved step by step to the kind of its last step, and each assert `count(lom:X) = 0 or
 * count(lom:X) = 1` as the kind `X` names there. A rule whose path resolves to no kind, an assert
 * of another form and an assert whose element resolves to no kind are each reported as unread.
 *
 * @param composedGrammar - The grammar whose kinds the names resolve to.
 * @returns The caps, and each line read as neither.
 */
const schematronCaps = (composedGrammar: ComposedGrammar) =>
  Effect.gen(function* readSchematron() {
    const fs = yield* FileSystem.FileSystem;
    const directory = yield* xsdDirectory;
    const text = yield* fs.readFileString(`${directory}/lom/imsmd_loose_v1p3p2.xsd`);
    const resolve = resolverOf(composedGrammar.kinds);
    const lom = vocabularyNamespaces.lom.namespace;
    const caps: SchematronCap[] = [];
    const unread: string[] = [];
    let context: Option.Option<string> = Option.none();
    for (const [index, line] of text.split("\n").entries()) {
      const rule = /<sch:rule\b[^>]*\bcontext="(?<path>[^"]*)"/u.exec(line)?.groups?.["path"];
      const test = /<sch:assert\b[^>]*\btest="(?<test>[^"]*)"/u.exec(line)?.groups?.["test"];
      if (rule !== undefined) {
        context = Option.some("document");
        for (const step of rule.split("/")) {
          context = context.pipe(
            Option.flatMap((held) =>
              step.startsWith("lom:") ? resolve(lom, step.slice(4), held) : Option.none(),
            ),
          );
        }

        if (Option.isNone(context)) {
          unread.push(`line ${String(index + 1)}: ${rule}`);
        }
      } else if (test !== undefined) {
        const name = /^count\(lom:(?<name>[A-Za-z]+)\) = 0 or count\(lom:\k<name>\) = 1$/u.exec(
          test,
        )?.groups?.["name"];
        const capped = Option.all({ name: Option.fromNullishOr(name), parent: context }).pipe(
          Option.flatMap((held) =>
            Option.map(resolve(lom, held.name, held.parent), (child) => ({
              child,
              parent: held.parent,
            })),
          ),
        );
        if (Option.isSome(capped)) {
          caps.push({ ...capped.value, line: index + 1 });
        } else {
          unread.push(`line ${String(index + 1)}: ${test}`);
        }
      }
    }

    return { caps, unread };
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
 * those a wildcard admits among them: spec reading 81 admits under a wildcard only the global
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

/**
 * One place spec reading 96 records, where libxml2 widens a sequence: an element particle and the
 * repeated wildcard right after it, and the element particle before them, if any.
 */
interface Widened {
  readonly before: Option.Option<Extract<Particle, { readonly _tag: "element" }>>;
  readonly element: Extract<Particle, { readonly _tag: "element" }>;
  readonly wildcard: Extract<Particle, { readonly _tag: "any" }>;
}

/**
 * A particle as libxml2 reads it, and each place it widens the XSD's.
 */
interface Widening {
  readonly particle: Particle;
  readonly widened: readonly Widened[];
}

/**
 * Restate a particle as libxml2 2.9.13's `xmllint` reads it, by spec reading 96. That reading sets
 * the verdict aside as a defect of the oracle.
 *
 * - The defect: in a sequence, take an element particle with no substitution group that repeats
 *   without bound from at most one occurrence, followed by a wildcard that may repeat. libxml2 ends
 *   the element in a state that repeats it (`xmlschemas.c` line 12791), and starts the wildcard in
 *   that same state, which its repeat returns to (lines 12852 and 12924). So after a child the
 *   wildcard holds, the element is admitted again.
 * - The restatement: `E*, W*` becomes `(E | W)*`. An `E` of one or more keeps its first `E`, and a
 *   `W` of one or more keeps its last `W`.
 * - A sequence that occurs exactly once adds no state of its own in libxml2, so its particles are
 *   read in place, as the group reference `grpStrict.any` is. Any other group ends in a state of
 *   its own and widens nothing across its bounds.
 *
 * @param particle - The XSD's particle.
 * @returns The restated particle, and each place it widens.
 */
const libxmlWidened = (particle: Particle): Widening => {
  const widened: Widened[] = [];
  const once = { max: 1, min: 1 } as const;
  const walk = (node: Particle): Particle => {
    switch (node._tag) {
      case "element":
      case "any": {
        return node;
      }
      case "all":
      case "choice": {
        return { ...node, particles: node.particles.map(walk) };
      }
      case "sequence": {
        const inPlace = (child: Particle): readonly Particle[] =>
          child._tag === "sequence" && child.occurs.min === 1 && child.occurs.max === 1
            ? child.particles.flatMap(inPlace)
            : [walk(child)];
        const parts = node.particles.flatMap(inPlace);
        const restated: Particle[] = [];
        for (let at = 0; at < parts.length; at += 1) {
          const here = parts[at];
          const next = parts[at + 1];
          const before = parts[at - 1];
          if (
            here?._tag === "element" &&
            here.members.length === 1 &&
            here.occurs.max === Number.POSITIVE_INFINITY &&
            here.occurs.min <= 1 &&
            next?._tag === "any" &&
            next.occurs.max > 1
          ) {
            widened.push({
              before: before?._tag === "element" ? Option.some(before) : Option.none(),
              element: here,
              wildcard: next,
            });
            restated.push({
              _tag: "sequence",
              occurs: once,
              particles: [
                ...(here.occurs.min === 1 ? [{ ...here, occurs: once }] : []),
                {
                  _tag: "choice",
                  occurs: { max: Number.POSITIVE_INFINITY, min: 0 },
                  particles: [
                    { ...here, occurs: once },
                    { ...next, occurs: once },
                  ],
                },
                ...(next.occurs.min >= 1 ? [{ ...next, occurs: once }] : []),
              ],
            });
            at += 1;
          } else if (here !== undefined) {
            restated.push(here);
          }
        }

        return { ...node, particles: restated };
      }
      default: {
        return node satisfies never;
      }
    }
  };

  return { particle: walk(particle), widened };
};

/**
 * A model's language as acceptors over child kinds: the XSD's, and libxml2's by spec reading 96.
 */
interface Languages {
  readonly libxml: (kinds: readonly string[]) => boolean;
  readonly xsd: (kinds: readonly string[]) => boolean;
}

/**
 * The XSD's language of a model and libxml2's, by spec reading 96 ({@link libxmlWidened}), as
 * acceptors over child kinds. A wildcard stands for the admitted kinds no element particle names,
 * as in `acceptorOf`.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version the model's rows are read in.
 * @param parent - The model's kind.
 * @param particle - The model's particle, by the tests' reader.
 * @returns The two acceptors.
 */
const languagesOf = (
  composedGrammar: ComposedGrammar,
  version: SchemaVersion,
  parent: string,
  particle: Particle,
): Languages => {
  const { admission, kinds } = composedGrammar;
  const resolve = (members: readonly { readonly name: XsdName }[]) =>
    members.flatMap((member) =>
      Option.toArray(resolverOf(kinds)(member.name.namespace, member.name.local, parent)),
    );
  const named = new Set(elementsOf(particle).flatMap(({ members }) => resolve(members)));
  const byWildcard = admission.rows
    .filter(
      (row) =>
        row.version === version &&
        row.parent === parent &&
        Option.isSome(kinds.isElement.lookup({ kind: row.child })) &&
        !named.has(row.child),
    )
    .map(({ child }) => child);

  return {
    libxml: acceptorOf(libxmlWidened(particle).particle, resolve, byWildcard),
    xsd: acceptorOf(particle, resolve, byWildcard),
  };
};

/**
 * Whether spec reading 96 explains a family xmllint accepts: libxml2's widened sequence accepts it
 * and the XSD's own refuses it, so libxml2 admits an element again after a child of the repeated
 * wildcard that follows it.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version the rows are read in.
 * @param readings - The parent's contents, by the tests' reader; the first is the probed one.
 * @param probe - The family.
 * @returns Whether the reading rules it.
 */
const widenedOnly = (
  composedGrammar: ComposedGrammar,
  version: SchemaVersion,
  readings: readonly Content[] | undefined,
  probe: KindProbe,
): boolean =>
  Option.exists(
    Option.flatMap(Option.fromNullishOr(readings?.[0]), ({ particle }) => particle),
    (particle) => {
      const { libxml, xsd } = languagesOf(composedGrammar, version, probe.parentKind, particle);

      return libxml(probe.kinds) && !xsd(probe.kinds);
    },
  );

/**
 * Whether spec reading 61 rules a family the grammar accepts and xmllint refuses:
 * a family of `qti-ordering`, whose extension slot the reading widens from the XSD's `##other` to
 * `##any` (information model §5.98.3), that holds a child in QTI's own namespace or in none, which
 * `##other` refuses and `##any` admits.
 *
 * @param composedGrammar - The grammar.
 * @param probe - The family.
 * @returns Whether the reading rules it.
 */
const reading61 = (composedGrammar: ComposedGrammar, probe: KindProbe): boolean =>
  probe.parentKind === "qti-ordering" &&
  probe.kinds.some((kind) =>
    Option.match(composedGrammar.kinds.elementName.lookup({ kind }), {
      onNone: () => kind === foreignKinds.own || kind === foreignKinds.absent,
      onSome: ({ namespace }) => namespace === asiNamespace || namespace === "",
    }),
  );

/**
 * Classify the grammar's verdict on a foreign element's probe against xmllint's: they agree,
 * reading 61 rules their difference ({@link reading61}), or they disagree.
 *
 * @param composedGrammar - The grammar.
 * @param probe - The family.
 * @param expected - The grammar's verdict.
 * @param verdict - What xmllint said of it.
 * @returns The ruling.
 */
const foreignRuling = (
  composedGrammar: ComposedGrammar,
  probe: KindProbe,
  expected: boolean,
  verdict: Validated | undefined,
): "agrees" | "disagrees" | "reading 61" => {
  if (verdict !== undefined && verdict.refused !== expected) {
    return "agrees";
  }

  return expected && verdict?.refused === true && reading61(composedGrammar, probe)
    ? "reading 61"
    : "disagrees";
};

/**
 * Classify the grammar's verdict on an xmllint probe against xmllint's: they agree, a spec reading
 * rules their difference, or they disagree. Reading 96 rules a family the grammar refuses and
 * xmllint accepts: one only libxml2's widened sequence accepts ({@link widenedOnly}). Spec reading
 * 61 rules a family the grammar accepts and xmllint refuses: one of `qti-ordering` holding a child
 * of QTI's namespace or none ({@link reading61}). Spec reading 118 rules a family of `xi:include`
 * holding two fallbacks, which XInclude 1.0 §3.1 refuses and `XInclude.xsd` admits.
 *
 * @param input - The probe and both verdicts.
 * @param input.expected - The grammar's verdict.
 * @param input.grammar - The grammar.
 * @param input.probe - The family.
 * @param input.readings - The parent's contents, by the tests' reader.
 * @param input.verdict - What xmllint said of it.
 * @param input.version - The version the rows are read in.
 * @returns The ruling.
 */
const xmllintRuling = (input: {
  readonly expected: boolean;
  readonly grammar: ComposedGrammar;
  readonly probe: KindProbe;
  readonly readings: readonly Content[] | undefined;
  readonly verdict: Validated | undefined;
  readonly version: SchemaVersion;
}): "agrees" | "disagrees" | "reading 61" | "reading 118" | "reading 96" => {
  const { expected, probe, verdict } = input;
  if (verdict !== undefined && verdict.refused !== expected) {
    return "agrees";
  }

  if (
    !expected &&
    verdict?.refused === false &&
    probe.parentKind === "xi:include" &&
    probe.kinds.filter((kind) => kind === "xi:fallback").length > 1
  ) {
    return "reading 118";
  }

  if (expected && verdict?.refused === true && reading61(input.grammar, probe)) {
    return "reading 61";
  }

  if (expected || verdict?.refused !== false) {
    return "disagrees";
  }

  return widenedOnly(input.grammar, input.version, input.readings, probe)
    ? "reading 96"
    : "disagrees";
};

/**
 * Whether a spec reading narrows the XSD to refuse a family it accepts. Reading 44: an SSML `token`
 * or `w` holds no `voice` (SSML 1.1 §3.1.8.2), where `tokenType` admits one. Reading 118: an
 * include holds at most one fallback (XInclude 1.0 §3.1), where its XSD admits any number, so an
 * include's family that holds two.
 *
 * @param parent - The family's parent.
 * @param children - The family.
 * @returns Whether a reading narrows it.
 */
const narrowedByReading = (parent: string, children: readonly string[]): boolean =>
  ((parent === "ssml:token" || parent === "ssml:w") && children.includes("ssml:voice")) ||
  (parent === "xi:include" && children.filter((child) => child === "xi:fallback").length > 1);

describe.skipIf(!cached)("the content automata against the XSD", () => {
  it.effect(
    "accept exactly the child sequences the independent reading's automaton accepts, every model with one content: every sequence of at most 3 children (4 over an alphabet of at most 4) over at most 4 kinds it names, one only its wildcard admits and one it refuses, drawn from the run seed",
    (ctx) =>
      // Oracle: a second implementation, the tests' own automaton of each XSD particle
      // (`acceptorOf`), with spec readings 2, 44 and 118 ruled where they narrow the XSD.
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
                const narrowed = xsd && !installed && narrowedByReading(parent, children);
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
                } else if (narrowed) {
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
            `${models} models (${drawnFrom} naming more than ${namedBound} kinds, whose ${namedBound} the run seed drew), ${compared} sequences, ${ruled} ruled by readings 2, 44 and 118; ${skipped} kinds skipped for holding more than one content`,
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
      // the two count laws beside it, Counted and OperatorArity. Where the grammar and the XSD's
      // own order refuse a family that libxml2's widened sequence accepts, its verdict is spec
      // reading 96's to set aside, and is counted as ruled; where the grammar accepts a family of
      // `qti-ordering` the XSD's `##other` refuses, reading 61 widens the slot to
      // `##any`, and the family is counted as widened.
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
        let ruled = 0;
        let skipped = 0;
        let widened = 0;
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
            const ruling = xmllintRuling({
              expected,
              grammar: composedGrammar,
              probe,
              readings: contents.get(probe.parentKind),
              verdict,
              version,
            });
            ruled += ruling === "reading 96" || ruling === "reading 118" ? 1 : 0;
            widened += ruling === "reading 61" ? 1 : 0;
            if (ruling === "disagrees") {
              failures.push(
                `${version} ${probe.parentKind} [${probe.kinds.join(", ")}]: the grammar ${expected ? "accepts" : "refuses"}, xmllint ${verdict?.refused === true ? "refuses" : "accepts"}${(verdict?.messages.length ?? 0) > 0 ? `: ${verdict?.messages[0] ?? ""}` : ""}`,
              );
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${probed} probes, ${ruled} ruled by readings 96 and 118 and ${widened} by reading 61; ${skipped} kinds skipped for holding more than one content`,
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
      // reading 81, §3.10.4 clause 2). `qti-ordering`'s slot is reading 61's `##any`,
      // where xmllint reads the XSD's `##other`: an element of QTI's namespace or none there is
      // accepted by the grammar and refused by xmllint, and counted as widened.
      Effect.gen(function* foreignAtWildcards() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const failures: string[] = [];
        let probed = 0;
        let models = 0;
        let unprobed = 0;
        let widened = 0;
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
            const ruling = foreignRuling(composedGrammar, probe, expected, verdict);
            widened += ruling === "reading 61" ? 1 : 0;
            if (ruling === "disagrees") {
              failures.push(
                `${root} ${probe.parentKind} [${probe.kinds.join(", ")}]: the grammar ${expected ? "accepts" : "refuses"}, xmllint ${verdict?.refused === true ? "refuses" : "accepts"}${(verdict?.messages.length ?? 0) > 0 ? `: ${verdict?.messages[0] ?? ""}` : ""}`,
              );
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${models} models with a wildcard, ${probed} probes, ${widened} ruled by reading 61, ${unprobed} models with no global element or named type to probe`,
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
 * external metadata (LOM's `lom`) and §6.5's usage data (`usageData`); and the root of §6.2's
 * `imsqti_fragment_xmlv3p0`, "QTI 3 inclusion (XInclude)", any kind an include stands for (spec
 * reading 114), which `include.test.ts` proves against each parent's automaton.
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
  ...fragmentRoots.map(({ root }) => root),
]);

/**
 * The document node's children a differential draws over: the doctype, two root kinds, an element
 * that is no root, and whitespace and a comment, which stand anywhere.
 */
const documentChildren = [
  "doctype",
  "qti-assessment-item",
  "cp:manifest",
  "qti-prompt",
  "ws",
  "comment",
] as const;

/**
 * Find a model's counted group: a group whose bound a position automaton relaxes, its least at
 * least 2 or its greatest finite and at least 2, at its top or inside sequences that occur once.
 *
 * @param particle - The model's particle, as the tests' reader reads it.
 * @returns The group, or none for a model with none there.
 */
const countedGroupOf = (particle: Particle): Option.Option<Particle> => {
  if (particle._tag === "element" || particle._tag === "any") {
    return Option.none();
  }

  const { max, min } = particle.occurs;
  if (min >= 2 || (max >= 2 && Number.isFinite(max))) {
    return Option.some(particle);
  }

  return particle._tag === "sequence" && min === 1 && max === 1
    ? Arr.findFirst(particle.particles, (member) => Option.isSome(countedGroupOf(member))).pipe(
        Option.flatMap(countedGroupOf),
      )
    : Option.none();
};

/**
 * Build the probes of one operator whose model is a counted group: every family of at most 3
 * children over two operands the group names and one element kind the operator does not admit,
 * under the operator's named type. A model with no counted group, more than one content or a type
 * outside QTI's namespace has none.
 *
 * @param input - The operator and what probing it reads.
 * @param input.grammar - The grammar.
 * @param input.parent - The operator's kind.
 * @param input.readings - Its contents, as the reader walked them.
 * @param input.resolve - The composition's resolution.
 * @param input.version - The schema's version.
 * @returns The probes.
 */
const countedGroupProbes = (input: {
  readonly grammar: ComposedGrammar;
  readonly parent: string;
  readonly readings: readonly Content[];
  readonly resolve: (namespace: string, local: string, parent: string) => Option.Option<string>;
  readonly version: SchemaVersion;
}): readonly KindProbe[] => {
  const { admission, kinds } = input.grammar;
  const { parent, resolve, version } = input;
  const [reading, ...others] = input.readings;
  if (reading === undefined || others.length > 0 || !reading.type.startsWith(`{${asiNamespace}}`)) {
    return [];
  }

  return reading.particle.pipe(Option.flatMap(countedGroupOf), Option.toArray).flatMap((held) => {
    const operands = [
      ...new Set(
        elementsOf(held)
          .flatMap(({ members }) => members)
          .flatMap((member) =>
            Option.toArray(resolve(member.name.namespace, member.name.local, parent)),
          ),
      ),
    ].slice(0, 2);
    const unadmitted = Arr.findFirst(
      kinds.nodeKind.handles,
      (kind) =>
        !isForeignKind(kind) &&
        Option.isSome(kinds.elementName.lookup({ kind })) &&
        Option.isNone(admission.lookup({ child: kind, parent, version })),
    );
    const type = {
      local: reading.type.slice(reading.type.indexOf("}") + 1),
      namespace: asiNamespace,
    };

    return sequencesOf([...operands, ...Option.toArray(unadmitted)], 3).map((word): KindProbe => ({
      children: word.map((kind) => childOf(input.grammar, kind)),
      kinds: word,
      parent: { _tag: "type", type },
      parentKind: parent,
      type: Option.none(),
    }));
  });
};

/**
 * Whether OperatorArity holds a group's relaxed bound: the operator's `OperatorArity` is exactly
 * the group's (min, max), and each repeat of the group is one element child, every member one
 * element particle exactly once and the group a choice or of one member, so the count of element
 * children is the group's repeat count.
 *
 * @param composedGrammar - The grammar.
 * @param parent - The operator's kind.
 * @param group - The group, as the tests' reader reads it.
 * @returns Whether the Arity law states the group's bound.
 */
const arityStates = (
  composedGrammar: ComposedGrammar,
  parent: string,
  group: Extract<Particle, { readonly particles: readonly Particle[] }>,
): boolean => {
  const { max, min } = group.occurs;
  const exact = Option.exists(
    composedGrammar.operatorArity.lookup({ kind: parent }),
    (row) => row.min === BigInt(min) && row.max === (Number.isFinite(max) ? BigInt(max) : int8Max),
  );

  return (
    exact &&
    (group._tag === "choice" || group.particles.length === 1) &&
    group.particles.every(
      (member) => member._tag === "element" && member.occurs.min === 1 && member.occurs.max === 1,
    )
  );
};

describe.skipIf(!cached)("the occurrence bounds the automata relax", () => {
  it.effect(
    "are laws beside them: an element particle's in Counted, a group's in OperatorArity at exactly its bound, and Counted holds those and the LOM binding's Schematron caps, nothing else",
    () =>
      // Oracle: the tests' own reading of the XSDs, and of the LOM binding's embedded Schematron
      // from its text. A position automaton holds a particle's bound exactly when its least is 0
      // or 1 and its greatest 1 or unbounded (Brüggemann-Klein and Wood); every other bound is a
      // count, which Counted states for one particle's children and OperatorArity for a whole
      // content's, and which only holds as a total where no enclosing group may repeat or be
      // absent. A group's bound is OperatorArity's (min, max) exactly, and each of its repeats one
      // element child. Each Schematron assert caps its element at one in its context's family
      // (spec reading 130), Counted's 0 to 1 at the element's position, in both versions.
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
                if (
                  enclosed ||
                  !arities.has(parent) ||
                  !arityStates(composedGrammar, parent, particle)
                ) {
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

        const schematron = yield* schematronCaps(composedGrammar);
        for (const { child, parent } of schematron.caps) {
          for (const version of schemaVersions) {
            counted(version, parent, child, 0, 1);
          }
        }

        assert.deepStrictEqual(schematron.unread, []);
        assert.strictEqual(schematron.caps.length, 94);
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
  it.effect(
    "agree with xmllint on every operator whose content is a counted group of operands, the automaton's 1..n and Arity's count together: every family of at most 3 children over two of its operands and one element kind it does not admit, in both versions",
    (ctx) =>
      // Oracle: libxml2's schema validator over the pinned ASI XSDs, against the automaton with
      // OperatorArity beside it (`arityHolds`): the automaton relaxes the group's 2..2 to 1..n
      // (Q5.10's finding: `qti-contains` with one operand), and the Arity law holds the count.
      // Bound: every family of 0 to 3 children over two operands the group names and one element
      // kind the operator does not admit, the named invalid variant, under every operator whose
      // model is a counted group, in both versions.
      Effect.gen(function* countedGroups() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const failures: string[] = [];
        let probed = 0;
        let operators = 0;
        for (const [root, version] of schemas.slice(0, 2)) {
          const { set } = yield* loadXsd(root);
          const resolve = resolverOf(kinds);
          const { contents } = xsdContents(set, resolve);
          const probes = [...contents].flatMap(([parent, readings]) =>
            countedGroupProbes({ grammar: composedGrammar, parent, readings, resolve, version }),
          );
          operators += new Set(probes.map(({ parentKind }) => parentKind)).size;

          const verdicts = yield* Effect.scoped(validateContents(root, asiNamespace, probes));
          for (const [index, probe] of probes.entries()) {
            probed += 1;
            const expected =
              accepts(composedGrammar, version, probe.parentKind, probe.kinds) &&
              countsHold(composedGrammar, version, probe.parentKind, probe.kinds) &&
              arityHolds(composedGrammar, probe.parentKind, probe.kinds);
            const verdict = verdicts[index];
            if (verdict === undefined || verdict.refused === expected) {
              failures.push(
                `${version} ${probe.parentKind} [${probe.kinds.join(", ")}]: the grammar ${expected ? "accepts" : "refuses"}, xmllint ${verdict?.refused === true ? "refuses" : "accepts"}${(verdict?.messages.length ?? 0) > 0 ? `: ${verdict?.messages[0] ?? ""}` : ""}`,
              );
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${operators} counted-group operators over both versions, ${probed} families`,
            "xmllint",
          ),
        );
        assert.isAbove(operators, 0);
        assert.deepStrictEqual(failures.slice(0, 40), []);
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

        // A model's rows are its families', each family's sourced to its own particles: every
        // position a family's model names in `Follow`, `Last` or `Symbol`.
        const followed = Map.groupBy(content.follow.rows, ({ model }) => model);
        const ended = Map.groupBy(content.last.rows, ({ model }) => model);
        const shared = Map.groupBy(content.symbol.rows, ({ model }) => model);
        const sharedOf = new Map(
          content.sharedModelOf.rows.map(({ model, parent, version }) => [
            `${version} ${parent}`,
            model,
          ]),
        );
        for (const { model, parent, version } of content.contentModelOf.rows) {
          const named = [
            ["Follow", new Set((followed.get(model) ?? []).map(({ to }) => to))],
            ["Last", new Set((ended.get(model) ?? []).map(({ position }) => position))],
            [
              "Symbol",
              new Set(
                (shared.get(sharedOf.get(`${version} ${parent}`) ?? "") ?? []).map(
                  ({ position }) => position,
                ),
              ),
            ],
          ] as const;
          for (const [relation, positions] of named) {
            for (const position of positions) {
              yield* check(relation, version, content.sourceOf({ parent, position, version }));
            }
          }
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

describe.skipIf(!cached)("spec reading 130 in the LOM binding", () => {
  it.effect(
    "caps exactly what the binding bounds to one inside an unbounded choice: its Schematron's 94 asserts are those 82 (parent, kind) pairs",
    () =>
      // Oracle: the tests' own reading of the binding's XSD, against its Schematron read from its
      // text. The binding's header says "The strict multiplicity of elements has been imposed"
      // (`imsmd_loose_v1p3p2.xsd` lines 18-21): each element of a category keeps its LOM
      // multiplicity as its particle's bound inside the category's unbounded choice, which the
      // Schematron enforces as a total (lines 85-92). So the asserts are exactly those particles.
      Effect.gen(function* capsAreBounds() {
        const composedGrammar = yield* grammar;
        const resolve = resolverOf(composedGrammar.kinds);
        const { set } = yield* loadXsd("lom/imsmd_loose_v1p3p2.xsd");
        const { contents } = xsdContents(set, resolve);
        const bounded = new Set<string>();
        for (const [parent, readings] of contents) {
          const walk = (particle: Particle, repeated: boolean): void => {
            if (particle._tag === "element") {
              if (repeated && particle.occurs.max === 1) {
                for (const { name } of particle.members) {
                  for (const kind of Option.toArray(resolve(name.namespace, name.local, parent))) {
                    bounded.add(`${parent} ${kind}`);
                  }
                }
              }
            } else if (particle._tag !== "any") {
              for (const child of particle.particles) {
                walk(child, repeated || particle.occurs.max > 1);
              }
            }
          };
          for (const particle of readings.flatMap((reading) => Option.toArray(reading.particle))) {
            walk(particle, false);
          }
        }

        const schematron = yield* schematronCaps(composedGrammar);

        assert.deepStrictEqual(schematron.unread, []);
        assert.strictEqual(schematron.caps.length, 94);
        assert.deepStrictEqual(
          new Set(schematron.caps.map(({ child, parent }) => `${parent} ${child}`)),
          bounded,
        );
        assert.strictEqual(bounded.size, 82);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );

  it.effect(
    "follows the binding's unbounded choices and its Schematron's caps: every LOM model, every kind it names, once, twice and three times, in both versions",
    () =>
      // Oracle: the tests' own reading of the LOM binding, which writes each category as an
      // unbounded choice of its elements (`imsmd_loose_v1p3p2.xsd:984`, `AggregationLevel.Type`,
      // and its siblings), and its Schematron read from its text: a family the binding's acceptor
      // accepts is the grammar's too, but for a capped kind repeated, which spec reading 130
      // refuses. Each capped pair is met once alone, accepted, and repeated, refused.
      Effect.gen(function* lomRepeats() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const { set } = yield* loadXsd("lom/imsmd_loose_v1p3p2.xsd");
        const resolve = resolverOf(kinds);
        const { contents } = xsdContents(set, resolve);
        const schematron = yield* schematronCaps(composedGrammar);
        const capped = new Set(schematron.caps.map(({ child, parent }) => `${parent} ${child}`));
        const met = new Set<string>();
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
              for (const children of [[kind], [kind, kind], [kind, kind, kind]]) {
                for (const version of schemaVersions) {
                  compared += 1;
                  const cap = capped.has(`${parent} ${kind}`);
                  if (cap) {
                    met.add(`${parent} ${kind}`);
                  }

                  const expected = acceptor(children) && (children.length === 1 || !cap);
                  const verdict =
                    accepts(composedGrammar, version, parent, children) &&
                    countsHold(composedGrammar, version, parent, children);
                  if (verdict !== expected) {
                    disagreements.push(
                      `${version} ${parent} [${children.join(", ")}]: the grammar ${verdict ? "accepts" : "refuses"}, the binding ${expected ? "accepts" : "refuses"}`,
                    );
                  }
                }
              }
            }
          }
        }

        assert.isAbove(compared, 0);
        assert.deepStrictEqual(disagreements.slice(0, 20), []);
        assert.deepStrictEqual(met, capped, "every capped pair is probed");
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

/**
 * A toy element particle of the kinds it names, once.
 *
 * @param kinds - The kinds.
 * @returns The particle.
 */
const toyElement = (...kinds: readonly [string, ...string[]]): ModelParticle => ({
  _tag: "element",
  kinds,
  occurs: { max: Option.some(1), min: 1 },
  sources: toySources(schemaVersions),
});

/**
 * A toy group of particles.
 *
 * @param compositor - Its compositor.
 * @param repeated - Whether it occurs any number of times, or exactly once.
 * @param particles - Its particles.
 * @returns The group.
 */
const toyGroup = (
  compositor: "choice" | "sequence",
  repeated: boolean,
  ...particles: readonly ModelParticle[]
): ModelParticle => ({
  _tag: "group",
  compositor,
  occurs: repeated ? { max: Option.none(), min: 0 } : { max: Option.some(1), min: 1 },
  particles,
  sources: toySources(schemaVersions),
});

/**
 * The toy kind `p`'s model, element-only, in every version.
 *
 * @param particle - Its particle.
 * @returns The model.
 */
const toyModel = (particle: ModelParticle): ContentModel => ({
  content: { _tag: "element-only", particle },
  kind: "p",
  sources: toySources(schemaVersions),
  type: Option.none(),
  versions: schemaVersions,
});

/**
 * Compose a toy vocabulary of `p` over `a`, `b` and `c`, its model capped at some kinds.
 *
 * @param model - The model of `p`.
 * @param capped - The kinds it caps at one.
 * @returns The grammar, or the composition's refusal.
 */
const cappedToy = (model: ContentModel, capped: readonly string[]) =>
  toyGrammar([
    {
      ...toyVocabulary({
        admission: [],
        attributes: [],
        data: ["ws", "comment", "pi"],
        facets: toyFacets({
          content: {
            edits: capped.map((kind) => ({
              _tag: "cap" as const,
              kind,
              parent: "p",
              source: "a toy cap",
            })),
            models: [],
            roots: [],
          },
        }),
        kinds: ["p", "a", "b", "c"],
      }),
      models: [model],
    },
  ]);

/**
 * Compose the toy with one cap, and name the composition's refusal, `composed` where there is none.
 *
 * @param model - The model of `p`.
 * @param capped - The kind it caps.
 * @returns The refusal's tag.
 */
const refusal = (model: ContentModel, capped: string): string =>
  Result.match(cappedToy(model, [capped]), {
    onFailure: (error) => error._tag,
    onSuccess: () => "composed",
  });

describe("the cap edit, which spec reading 130's LOM caps read (content.ts, cappedBy)", () => {
  it.effect(
    "holds a capped kind to one child of its family, beside the automaton, every family of at most 4 over 3 kinds, each cap of 1 or 2 kinds",
    () =>
      // Oracle: the edit's contract, a family holds at most one child of each capped kind and
      // any number of the others. Bound: `(a | b | c)*`, every family of at most 4 children,
      // capped at each nonempty set of at most two of the three kinds.
      Effect.gen(function* everyFamily() {
        const wrong: string[] = [];
        const model = toyModel(
          toyGroup(
            "sequence",
            false,
            toyGroup("choice", true, toyElement("a"), toyElement("b"), toyElement("c")),
          ),
        );
        for (const capped of [["a"], ["b"], ["c"], ["a", "b"], ["a", "c"], ["b", "c"]]) {
          const toy = yield* Effect.fromResult(cappedToy(model, capped));
          for (const children of sequencesOf(["a", "b", "c"], 4)) {
            const expected = capped.every(
              (kind) => children.filter((child) => child === kind).length <= 1,
            );
            for (const version of schemaVersions) {
              const verdict =
                accepts(toy, version, "p", children) && countsHold(toy, version, "p", children);
              if (verdict !== expected) {
                wrong.push(
                  `[${capped.join(" ")}] ${version} [${children.join(" ")}]: ${String(verdict)}`,
                );
              }
            }
          }

          assert.strictEqual(
            toy.content.counted.rows.length,
            capped.length * schemaVersions.length,
          );
        }

        assert.deepStrictEqual(wrong, []);
      }),
  );

  it("refuses a cap of a kind its model names at two positions or beside another kind, and one of a kind it names nowhere", () => {
    // Oracle: the edit's contract, a cap counts one position, which names the kind alone.
    const shared = toyModel(
      toyGroup("sequence", false, toyGroup("choice", true, toyElement("a", "b"), toyElement("c"))),
    );
    const twice = toyModel(
      toyGroup(
        "sequence",
        false,
        toyElement("a"),
        toyGroup("choice", true, toyElement("b"), toyElement("a")),
      ),
    );
    const without = toyModel(
      toyGroup("sequence", false, toyGroup("choice", true, toyElement("a"), toyElement("b"))),
    );

    assert.strictEqual(refusal(shared, "a"), "UncountedCap");
    assert.strictEqual(refusal(twice, "a"), "UncountedCap");
    assert.strictEqual(refusal(without, "c"), "UnreadEdit");
    assert.strictEqual(refusal(shared, "c"), "composed");
    assert.strictEqual(refusal(twice, "b"), "composed");
  });
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
        // Each model's automaton, which every family of it reads (`ContentModelOf`).
        const families = new Map<
          string,
          { readonly ends: Set<string>; readonly edges: Map<string, Set<string>> }
        >();
        const familyOf = (model: string) => {
          const held = families.get(model) ?? {
            edges: new Map<string, Set<string>>(),
            ends: new Set<string>(),
          };
          families.set(model, held);

          return held;
        };
        for (const { from, model, to } of content.follow.rows) {
          const { edges } = familyOf(model);
          edges.set(from, (edges.get(from) ?? new Set()).add(to));
        }

        for (const { model, position } of content.last.rows) {
          familyOf(model).ends.add(position);
        }

        const modelOf = new Map(
          content.contentModelOf.rows.map(({ model, parent, version }) => [
            `${version} ${parent}`,
            model,
          ]),
        );
        const sharedAt = Map.groupBy(content.symbol.rows, ({ model }) => model);
        const named = [
          ...content.follow.rows.flatMap(({ from, model, to }) => [
            { model, position: from },
            { model, position: to },
          ]),
          ...content.last.rows,
          ...admission.rows
            .filter(({ position }) => position !== "0")
            .map(({ parent, position, version }) => ({
              model: modelOf.get(`${version} ${parent}`) ?? "",
              position,
            })),
          ...content.sharedModelOf.rows.flatMap(({ model: shared, parent, version }) =>
            (sharedAt.get(shared) ?? []).map(({ position }) => ({
              model: modelOf.get(`${version} ${parent}`) ?? "",
              position,
            })),
          ),
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

        for (const { model: key, position } of named) {
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
              box: "every family of at most 4 children over ssml:meta, ssml:p, a foreign element, text and white space: 781 families",
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
              generator: array(
                element(["ssml:meta", "ssml:p", foreignKinds.other, "text", "ws"] as const),
                { max: 4, min: 0 },
              ),
              limit: 1000,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "the XSD's ssml:speak model by the tests' reader and acceptor, and spec reading 40 as a checker over the text",
              },
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

describe.skipIf(!cached)("spec reading 44 in ssml:token and ssml:w", () => {
  it.effect(
    "accepts exactly what the XSD's tokenType accepts with no voice, its ##other wildcard kept: every family of at most 3 children over voice, prosody, audio, a foreign element and text, in both versions",
    () =>
      // Oracle: the XSD's own `tokenType` over the elements, by the tests' reader, and spec
      // reading 44 turned into a checker: SSML 1.1 §3.1.8.2 lists `token`'s elements without
      // `voice`, and §2.2.3 admits an element of another namespace, which the wildcard keeps.
      Effect.gen(function* readingFortyFour() {
        const composedGrammar = yield* grammar;
        const { kinds } = composedGrammar;
        const { set } = yield* loadXsd("imsqti_asiv3p0p1_v1p0.xsd");
        const { contents } = xsdContents(set, resolverOf(kinds));
        const disagreements: string[] = [];
        let compared = 0;
        for (const parent of ["ssml:token", "ssml:w"]) {
          const [model] = (contents.get(parent) ?? []).flatMap(({ particle }) =>
            Option.toArray(particle),
          );
          // `tokenType` names SSML's global elements by reference, and the composition resolves a
          // name by the parents that admit it, so each is resolved under `ssml:speak`, which
          // admits every one of them, `voice` included, where the reading's `token` does not.
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
          const tokenType = Option.match(Option.fromNullishOr(model), {
            onNone: () => () => false,
            onSome: (particle) => acceptorOf(particle, resolve, [foreignKinds.other]),
          });
          for (const children of sequencesOf(
            ["ssml:voice", "ssml:prosody", "ssml:audio", foreignKinds.other, "text"],
            3,
          )) {
            const elements = children.filter((child) => child !== "text");
            const expected = tokenType(elements) && !elements.includes("ssml:voice");
            for (const version of schemaVersions) {
              compared += 1;
              const verdict =
                accepts(composedGrammar, version, parent, children) &&
                countsHold(composedGrammar, version, parent, children);
              if (verdict !== expected) {
                disagreements.push(
                  `${version} ${parent} [${children.join(", ")}]: the grammar ${verdict ? "accepts" : "refuses"}, the reading ${expected ? "accepts" : "refuses"}`,
                );
              }
            }
          }

          assert.isTrue(tokenType(["ssml:voice"]), `the XSD's ${parent} admits voice`);
        }

        assert.strictEqual(compared, 2 * 2 * (1 + 5 + 25 + 125));
        assert.deepStrictEqual(disagreements.slice(0, 20), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xsdTimeout,
  );
});

/**
 * The pinned schema sets spec reading 96's census walks, every set a pinned document is assessed
 * against (spec reading 81), each with the version its rows are read in and, for a set whose
 * widened places are probed, its target namespace.
 */
const widenedSchemas: readonly {
  readonly root: SourcePath;
  readonly target: Option.Option<string>;
  readonly version: SchemaVersion;
}[] = [
  {
    root: "imsqti_asiv3p0_v1p0.xsd",
    target: Option.some("http://www.imsglobal.org/xsd/imsqtiasi_v3p0"),
    version: "3.0.0",
  },
  {
    root: "imsqti_asiv3p0p1_v1p0.xsd",
    target: Option.some("http://www.imsglobal.org/xsd/imsqtiasi_v3p0"),
    version: "3.0.1",
  },
  {
    root: "imsqtiv3p0_imscpv1p2_v1p0.xsd",
    target: Option.some("http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"),
    version: "3.0.0",
  },
  {
    root: "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
    target: Option.some("http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"),
    version: "3.0.1",
  },
  { root: "imsqti_metadatav3p0_v1p0.xsd", target: Option.none(), version: "3.0.1" },
  { root: "usagedata/imsqti_usagedatav3p0_v1p0.xsd", target: Option.none(), version: "3.0.1" },
];

/**
 * Every place libxml2's sequence construction widens a model the walks of the pinned schema sets
 * reach, as `version parent element`: spec reading 96's census, a set. A new pin that adds one
 * fails the reading's test until the reading names it.
 *
 * The DRD's 3.0.1 model is the fourth place, and no walk reaches it: a 3.0.1 manifest gives
 * `cpx:variant`, the only particle that leads to the DRD, no occurrence. Its element stands only
 * under a wildcard. So the test checks that the grammar installs it as it installs the 3.0.0 model
 * the walk does reach ({@link unwalkedTwin}).
 */
const widenedPlaces: readonly string[] = [
  "3.0.0 drd:accessForAllResource drd:isPartialAdaptationOf",
  "3.0.0 qti-companion-materials-info qti-physical-material",
  "3.0.1 qti-companion-materials-info qti-physical-material",
];

/**
 * The widened model no walk reaches in one version, and the version whose walk reaches it.
 */
const unwalkedTwin = {
  kind: "drd:accessForAllResource",
  reached: "3.0.0",
  unwalked: "3.0.1",
} as const;

/**
 * Write a family's installed automaton and admissions in one version, as a set of rows, so that two
 * versions compare as sets.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version.
 * @param parent - The family's kind.
 * @returns The rows, each as text, sorted.
 */
const automatonRowsOf = (
  composedGrammar: ComposedGrammar,
  version: SchemaVersion,
  parent: string,
): readonly string[] =>
  [
    ...Option.toArray(contentModelOf(composedGrammar.content, { parent, version })).flatMap(
      (model) => [
        ...composedGrammar.content.follow.rows
          .filter((row) => row.model === model)
          .map(({ from, to }) => `follow ${from} ${to}`),
        ...composedGrammar.content.last.rows
          .filter((row) => row.model === model)
          .map(({ position }) => `last ${position}`),
      ],
    ),
    ...composedGrammar.admission.rows
      .filter((row) => row.version === version && row.parent === parent)
      .map(({ child, position }) => `admits ${child} at ${position}`),
  ].toSorted();

/**
 * One family spec reading 96's test probes: the probe, the version its rows are read in, and the
 * XSD's verdict and libxml2's, by the reading.
 */
type WidenedProbe = KindProbe & {
  readonly libxml: boolean;
  readonly version: SchemaVersion;
  readonly xsd: boolean;
};

/**
 * Write each place libxml2 widens a kind's models as `version parent element`, over every content
 * the kind holds.
 *
 * @param version - The version the rows are read in.
 * @param parent - The kind.
 * @param readings - Its contents, as the tests' reader walked them.
 * @param resolve - The composition's resolution.
 * @returns The places.
 */
const placesOf = (
  version: SchemaVersion,
  parent: string,
  readings: readonly Content[],
  resolve: (namespace: string, local: string, parent: string) => Option.Option<string>,
): readonly string[] =>
  readings
    .flatMap(({ particle }) => Option.toArray(particle))
    .flatMap((particle) => libxmlWidened(particle).widened)
    .map(
      ({ element: widened }) =>
        `${version} ${parent} ${widened.members.flatMap(({ name }) => Option.toArray(resolve(name.namespace, name.local, parent))).join("|")}`,
    );

/**
 * Draw spec reading 96's families of one model: at each place libxml2 widens it, every sequence of
 * at most 3 children over the element particle before the place, its element, and the first kind,
 * in lexical order, that the grammar admits, no element particle names and the schema set declares
 * globally, so that xmllint assesses it against its declaration. The parent is its named type in
 * the target namespace, or, for a type of another namespace, the global element the set declares.
 *
 * @param input - The model and what probing it reads.
 * @param input.grammar - The grammar.
 * @param input.parent - The model's kind.
 * @param input.reading - Its one content, by the tests' reader.
 * @param input.set - The schema set.
 * @param input.target - The target namespace of a type probe.
 * @param input.version - The version its rows are read in.
 * @returns The families, none for a model libxml2 does not widen.
 */
const widenedProbesOf = (input: {
  readonly grammar: ComposedGrammar;
  readonly parent: string;
  readonly reading: Content;
  readonly set: XsdSet;
  readonly target: string;
  readonly version: SchemaVersion;
}): readonly WidenedProbe[] => {
  const { grammar: composedGrammar, parent, reading, set, version } = input;
  const { kinds } = composedGrammar;
  const resolve = resolverOf(kinds);
  const kindOf = (particle: Widened["element"]): readonly string[] =>
    particle.members.flatMap(({ name }) =>
      Option.toArray(resolve(name.namespace, name.local, parent)),
    );

  return Option.toArray(reading.particle).flatMap((particle) => {
    const named = new Set(elementsOf(particle).flatMap(kindOf));
    const held = composedGrammar.admission.rows
      .filter(
        (row) =>
          row.version === version &&
          row.parent === parent &&
          !isForeignKind(row.child) &&
          !named.has(row.child) &&
          Option.exists(kinds.elementName.lookup({ kind: row.child }), (written) =>
            set.elements.has(nameKey(written)),
          ),
      )
      .map(({ child }) => child)
      .toSorted();
    // A wrapper in the target namespace can name only that namespace's types, so a model whose
    // type is another's is probed as the global element its schema declares.
    const name = Option.getOrUndefined(kinds.elementName.lookup({ kind: parent }));
    const probe: KindProbe["parent"] =
      !reading.type.startsWith(`{${input.target}}`) &&
      name !== undefined &&
      set.elements.has(nameKey(name))
        ? { _tag: "global", name }
        : {
            _tag: "type",
            type: {
              local: reading.type.slice(reading.type.indexOf("}") + 1),
              namespace: input.target,
            },
          };
    const { libxml, xsd } = languagesOf(composedGrammar, version, parent, particle);

    return libxmlWidened(particle).widened.flatMap((place) => {
      const letters = [
        ...Option.match(place.before, { onNone: () => [], onSome: kindOf }),
        ...kindOf(place.element),
        ...held.slice(0, 1),
      ];
      assert.lengthOf(letters, Option.isSome(place.before) ? 3 : 2, parent);

      return sequencesOf(letters, 3).map((children): WidenedProbe => ({
        children: children.map((kind) => childOf(composedGrammar, kind)),
        kinds: children,
        libxml: libxml(children),
        parent: probe,
        parentKind: parent,
        type: Option.none(),
        version,
        xsd: xsd(children),
      }));
    });
  });
};

/**
 * Judge one of spec reading 96's families: the grammar must give the XSD's verdict, and xmllint the
 * reading's record of libxml2's.
 *
 * @param composedGrammar - The grammar.
 * @param root - The schema set's root file.
 * @param probe - The family.
 * @param verdict - What xmllint said of it.
 * @returns Each disagreement, as a line.
 */
const widenedFailures = (
  composedGrammar: ComposedGrammar,
  root: SourcePath,
  probe: WidenedProbe,
  verdict: Validated | undefined,
): readonly string[] => {
  const installed =
    accepts(composedGrammar, probe.version, probe.parentKind, probe.kinds) &&
    countsHold(composedGrammar, probe.version, probe.parentKind, probe.kinds) &&
    arityHolds(composedGrammar, probe.parentKind, probe.kinds);
  const family = `${root} ${probe.parentKind} [${probe.kinds.join(", ")}]`;
  const said = verdict?.refused === true ? "refuses" : "accepts";
  const message = verdict?.messages[0] ?? "";

  return [
    ...(installed === probe.xsd
      ? []
      : [
          `${family}: the grammar ${installed ? "accepts" : "refuses"} and the XSD ${probe.xsd ? "accepts" : "refuses"}`,
        ]),
    ...(verdict !== undefined && verdict.refused !== probe.libxml
      ? []
      : [
          `${family}: xmllint ${said} and reading 96's record of it ${probe.libxml ? "accepts" : "refuses"}${message === "" ? "" : `: ${message}`}`,
        ]),
  ];
};

/**
 * The children spec reading 61 admits in `qti-ordering`'s extension slot, one of
 * each kind of child: a QTI element no declaration names (`own-namespace-element`), an element in
 * no namespace, one of another namespace, an HTML, a MathML, an SSML and an XInclude global, read
 * as their kinds, and a QTI root, which spec reading 6 keeps foreign.
 */
const orderingChildren = [
  foreignKinds.own,
  foreignKinds.absent,
  foreignKinds.other,
  "div",
  "m:math",
  "ssml:speak",
  "xi:include",
] as const;

describe("spec reading 61, qti-ordering's extension slot", () => {
  it.effect(
    "admits any element of any namespace in any number and order, character data apart, and qti-selection's slot keeps refusing QTI's namespace and none: every family of at most 3 children over one of each kind of child, in both versions",
    () =>
      // Oracle: reading 61's model as a checker, `sequence(any ##any lax 0..n)`: every element
      // child admitted, in any order and number, and no text, the content being element-only;
      // `qti-selection` keeps the XSD's `##other` (information model §5.129.4).
      // Bound: every family of 0 to 3 children over the seven kinds of child above and `text`, the
      // named invalid variant, under both parents, in both versions.
      Effect.gen(function* reading61Slot() {
        const composedGrammar = yield* grammar;
        const wrong: string[] = [];
        let families = 0;
        for (const version of schemaVersions) {
          for (const children of sequencesOf([...orderingChildren, "text"], 3)) {
            families += 1;
            const ordering = !children.includes("text");
            const selection =
              ordering &&
              !children.some(
                (kind) =>
                  kind === foreignKinds.own || kind === foreignKinds.absent || kind === "div",
              );
            if (accepts(composedGrammar, version, "qti-ordering", children) !== ordering) {
              wrong.push(`${version} qti-ordering [${children.join(", ")}]`);
            }

            if (accepts(composedGrammar, version, "qti-selection", children) !== selection) {
              wrong.push(`${version} qti-selection [${children.join(", ")}]`);
            }
          }
        }

        assert.isAbove(families, 0);
        assert.deepStrictEqual(wrong.slice(0, 40), []);
      }),
    xsdTimeout,
  );
});

describe.skipIf(!cached)("spec reading 96, a repeated wildcard keeps its sequence's order", () => {
  it.effect(
    "refuses the element before a repeated wildcard after a child the wildcard holds, as the XSD does, where xmllint accepts it and nothing else: every family of at most 3 children over that element, the one before it and a declared kind the wildcard admits, in each widened place of the pinned schema sets",
    (ctx) =>
      // Oracle: the XSD's sequence, by the tests' own reader and acceptor (XML Schema 1.0 Part 1,
      // §3.8.4, Element Sequence Valid), for the grammar. libxml2's schema validator for the
      // reading's record of it: the same particle widened as `libxmlWidened` says, so xmllint
      // accepting anything beyond that, or no longer accepting it, fails here.
      // Bound: the census of every widened place the walks of the pinned schema sets reach
      // (`widenedSchemas`), then every sequence of at most 3 children over 3 kinds a place, 40
      // families, 3 places; exhaustive, so no residual.
      Effect.gen(function* readingEightyEight() {
        const composedGrammar = yield* grammar;
        const resolve = resolverOf(composedGrammar.kinds);
        const found = new Set<string>();
        const failures: string[] = [];
        let probed = 0;
        let ruled = 0;
        for (const { root, target: probedIn, version } of widenedSchemas) {
          const { set } = yield* loadXsd(root);
          const { contents } = xsdContents(set, resolve);
          for (const [parent, readings] of contents) {
            for (const place of placesOf(version, parent, readings, resolve)) {
              found.add(place);
            }
          }

          for (const target of Option.toArray(probedIn)) {
            // Only a kind with one content has one model to probe.
            const probes = [...contents].flatMap(([parent, readings]) => {
              const [reading, ...others] = readings;

              return reading === undefined || others.length > 0
                ? []
                : widenedProbesOf({
                    grammar: composedGrammar,
                    parent,
                    reading,
                    set,
                    target,
                    version,
                  });
            });
            const verdicts =
              probes.length === 0
                ? []
                : yield* Effect.scoped(validateContents(root, target, probes));
            for (const [index, probe] of probes.entries()) {
              const verdict = verdicts[index];
              probed += 1;
              ruled += verdict?.refused === false && !probe.xsd ? 1 : 0;
              failures.push(...widenedFailures(composedGrammar, root, probe, verdict));
            }
          }
        }

        yield* Effect.promise(() =>
          ctx.annotate(
            `${found.size} widened places, ${probed} families, ${ruled} that xmllint accepts and the XSD refuses`,
            "bound",
          ),
        );
        assert.deepStrictEqual([...found].toSorted(), widenedPlaces, "reading 96's census");
        assert.deepStrictEqual(
          automatonRowsOf(composedGrammar, unwalkedTwin.unwalked, unwalkedTwin.kind),
          automatonRowsOf(composedGrammar, unwalkedTwin.reached, unwalkedTwin.kind),
          "the DRD's 3.0.1 model, which no walk reaches, is installed as its 3.0.0 model",
        );
        assert.deepStrictEqual(failures.slice(0, 40), []);
        assert.isAbove(ruled, 0, "xmllint no longer widens these sequences: revisit reading 96");
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
            box: "every family of at most 4 children over the doctype, two root kinds, an element that is no root, white space and a comment: 1,555 families",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
            generator: array(element(documentChildren), { max: 4, min: 0 }),
            limit: 2000,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML 1.0's document production as R5 states it, over the guide's stated roots",
            },
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
