import path from "node:path";
import { NodeChildProcessSpawner, NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element, int, map, oneOf, string } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Context, Duration, Effect, Formatter, Layer, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import { composed, coveredBy } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind, openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  admitsWord,
  constraintAdmits,
  foreignNamespace,
  instanceOf,
  minimalWord,
  probeValueOf,
  qualified,
  spellings,
  tagged,
  wordWith,
  writable,
} from "#pantry/test/gen/vocab.ts";
import type { Letter, MatchScope } from "#pantry/test/gen/vocab.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import {
  classOf,
  probePrefixes,
  probeTargetsOf,
  probeWorldOf,
  rootNameOf,
  validate,
} from "#pantry/test/gen/xmllint.ts";
import type { ProbeWorld, ValidityError } from "#pantry/test/gen/xmllint.ts";
import { attributeDeclarations, attributeWildcards } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import type {
  AttributeWildcard,
  ContentType,
  NamespaceConstraint,
  Particle,
  VocabularyRoster,
} from "#pantry/vocab/inventory/types.ts";
import { globalKinds, vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";
import {
  asiNamespace,
  mathmlNamespace,
  namespaceClassOf,
  ssmlNamespace,
  xmlNamespace,
  xsiNamespace,
} from "#pantry/vocab/namespaces.ts";
import { dataName, foreignRoots, openClassOf } from "#pantry/vocab/open.ts";

/**
 * The package folder, `packages/pantry`.
 */
const packageRoot = path.resolve(import.meta.dirname, "../..");

/**
 * How long one search case may run: every case reads precomputed verdicts or classifies one name.
 */
const caseHang = Duration.minutes(1);

/**
 * The names `xml.xsd` declares and those XML Schema declares in its instance namespace: the names a
 * schema processor knows in each, never an open name (fin.md, D2's refinement).
 */
const declaredIn: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  [xmlNamespace, new Set(["lang", "space", "base", "id"])],
  [xsiNamespace, new Set(["type", "nil", "schemaLocation", "noNamespaceSchemaLocation"])],
]);

/**
 * What spec reading 13, D2 and XML Schema Part 1, 3.2.7, say an attribute name no closed handle
 * names is, by its namespace and spelling and its element's namespace: written out as their
 * decision table, apart from `openClassOf`.
 *
 * @param namespace - The attribute's namespace, `""` for none.
 * @param local - Its local name.
 * @param host - The element it is on: its namespace, and whether it is foreign.
 * @returns The class's handle, or the refusal's reason.
 */
const specified = (
  namespace: string,
  local: string,
  host: { readonly foreign: boolean; readonly namespace: string },
): string => {
  if (declaredIn.get(namespace)?.has(local) === true) {
    return "refused declared";
  }

  if (namespace !== "") {
    return namespace === host.namespace ? "own-namespace" : "foreign";
  }

  if (host.foreign || !local.startsWith("data-")) {
    return "no-namespace";
  }

  return /^data-[a-z0-9_.-]+$/u.test(local) ? "data-*" : "refused data-name";
};

/**
 * The letters a plain local name of the classification box is spelled in: cases, a digit,
 * punctuation and a non-ASCII letter, none of them `d`, so no plain name begins `data-`.
 */
const plainLetters = ["a", "Z", "0", "-", "_", ".", "é", "x"] as const;

/**
 * The letters after `data-` in the box: those reading 13's pattern admits (`a`, `0`, `-`, `_`,
 * `.`) and those it refuses (`Z`, `é`).
 */
const dataLetters = ["a", "Z", "0", "-", "_", ".", "é"] as const;

/**
 * The names `xml.xsd` and XML Schema's instance namespace declare, and `data` itself.
 */
const declaredLocals = [
  "lang",
  "space",
  "base",
  "id",
  "type",
  "nil",
  "schemaLocation",
  "data",
] as const;

/**
 * The longest plain local name of the box: two letters, since no plain name begins `data-` or is a
 * declared name, so a longer one meets no rule a shorter one does not, and the box stays within the
 * test's default budget at the machine's load.
 */
const plainMax = 2;

/**
 * The longest suffix after `data-` in the box.
 */
const dataMax = 2;

/**
 * A local name of the box: a plain one of 1 to {@link plainMax} letters, `data-` and 0 to
 * {@link dataMax} more, or a declared name.
 */
const localName: Gen<string> = oneOf([
  string(element(plainLetters), { max: plainMax, min: 1 }),
  map(string(element(dataLetters), { max: dataMax, min: 0 }), (suffix) => `data-${suffix}`),
  element(declaredLocals),
]);

/**
 * An attribute name's namespace: none, the XML or instance namespace, or another.
 */
const namespaces = ["", xmlNamespace, xsiNamespace, "urn:v", asiNamespace] as const;

/**
 * The namespaces of the element an attribute is on.
 */
const hosts = [asiNamespace, mathmlNamespace, "urn:v"] as const;

/**
 * How many local names the classification box holds: the plain names of each length, the `data-`
 * names of each suffix length, and the declared names. A case is one under each namespace, on an
 * element of each host namespace, foreign or not.
 */
const classificationBox =
  Arr.reduce(
    Arr.makeBy(plainMax, (at) => plainLetters.length ** (at + 1)),
    0,
    (sum, count) => sum + count,
  ) +
  Arr.reduce(
    Arr.makeBy(dataMax + 1, (at) => dataLetters.length ** at),
    0,
    (sum, count) => sum + count,
  ) +
  declaredLocals.length;

/**
 * Every class and refusal the classification box reaches.
 */
const classifications = [
  "no-namespace",
  "own-namespace",
  "foreign",
  "data-*",
  "refused declared",
  "refused data-name",
] as const;

describe("vocab/open.ts", () => {
  it.effect(
    "classifies every name by its namespace, its spelling and its element's namespace, as reading 13 and D2 say",
    (ctx) =>
      // Oracle: the specification as a checker, reading 13's, D2's and XML Schema Part 1 3.2.7's
      // decision table (`specified`), written apart from `openClassOf`.
      // Bound: exhaustive over the box, every local name of 1 to 2 plain letters, `data-` and 0 to 2
      // more, and each declared name, under each of 5 namespaces, on each of 3 host namespaces,
      // foreign or not: 137 names, 4,110 cases.
      Effect.gen(function* classification() {
        const exhausted = yield* searched(
          ctx,
          exhaust(
            {
              caseHang,
              coverage: requiredInSpace<(typeof classifications)[number]>(classifications),
              generator: (source) => ({
                foreign: source.draw(element([false, true])),
                host: source.draw(element(hosts)),
                local: source.draw(localName),
                namespace: source.draw(element(namespaces)),
              }),
              limit: classificationBox * namespaces.length * hosts.length * 2,
              literal: Formatter.format,
              suite: "vocab/open-class-of",
            },
            ({ foreign, host, local, namespace }, c) =>
              Effect.sync(() => {
                const read = Result.match(
                  openClassOf(
                    { local, namespace, prefix: namespace === "" ? "" : "v", qname: local },
                    { foreign, local: "e", namespace: host },
                  ),
                  {
                    onFailure: (refused) => `refused ${refused.reason}`,
                    onSuccess: (name) => name._tag,
                  },
                );
                for (const situation of classifications.filter((held) => held === read)) {
                  c.note(situation);
                }

                assert.strictEqual(read, specified(namespace, local, { foreign, namespace: host }));
                assert.strictEqual(
                  namespace === "" && !foreign && dataName.test(local),
                  read === "data-*",
                );
              }),
          ),
        );

        assert.strictEqual(
          exhausted.cases,
          classificationBox * namespaces.length * hosts.length * 2,
          "the box holds each local name under each namespace and host once",
        );
      }),
  );

  it("names an open class by a handle no kind declares, so the distinctness mask masks only them", () => {
    const declared = new Set(attributeDeclarations.map(({ name }) => name));
    const byKind = Map.groupBy(attributeDeclarations, ({ kind }) => kind);

    assert.deepStrictEqual(
      openClasses.filter((open) => declared.has(open)),
      [],
      "an open class's handle spells a declared attribute's name",
    );

    for (const [kind, rows] of byKind) {
      const names = new Set(rows.map(({ name }) => name));

      for (const local of [...spellings["data-valid"], ...spellings["undeclared-local"], "data"]) {
        if (!names.has(local)) {
          Result.match(
            openClassOf(
              { local, namespace: "", prefix: "", qname: local },
              { foreign: false, local: kind, namespace: asiNamespace },
            ),
            {
              onFailure: () => null,
              onSuccess: ({ _tag }) => {
                assert.include(openClasses, _tag, `${kind} ${local}`);
                assert.isFalse(
                  names.has(_tag),
                  `${kind} ${local} is read as ${_tag}, a name ${kind} declares`,
                );
              },
            },
          );
        }
      }
    }
  });
});

/**
 * Why the cache-gated suite cannot run here.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, of the hook that runs the XSD oracle over both versions' probes.
 * Measured on 2026-11-05 on a 10-CPU M2 Max at a load average near 12: 25 to 35 s. The budget is
 * four times that.
 */
const hookTimeoutMs = 160_000;

/**
 * One attribute candidate of the admission suite: its namespace, local name and class.
 */
interface Candidate {
  readonly class: string;
  readonly local: string;
  readonly namespace: string;
}

/**
 * The attribute candidates every kind's probe carries, one per class and spelling: the box the
 * admission suite exhausts. `xsi:type`, whose verdict turns on its value (reading 47), and
 * `xsi:nil`, which no pinned element's declaration makes nillable, are judged apart.
 *
 * @param own - The kind's namespace.
 * @returns The candidates, each spelling writable as an attribute.
 */
const candidatesFor = (own: string): readonly Candidate[] => [
  ...spellings["data-valid"].map((local) => ({ class: "data-valid", local, namespace: "" })),
  ...spellings["data-invalid"]
    .filter(writable)
    .map((local) => ({ class: "data-invalid", local, namespace: "" })),
  ...spellings["undeclared-local"].map((local) => ({
    class: "undeclared-local",
    local,
    namespace: "",
  })),
  { class: "own-namespace", local: "zz", namespace: own },
  { class: "foreign-namespace", local: "zz", namespace: foreignNamespace },
  ...spellings["xml-declared"].map((local) => ({
    class: "xml-declared",
    local,
    namespace: xmlNamespace,
  })),
  { class: "xml-undeclared", local: "zz", namespace: xmlNamespace },
  { class: "xsi-declared", local: "schemaLocation", namespace: xsiNamespace },
  { class: "xsi-declared", local: "noNamespaceSchemaLocation", namespace: xsiNamespace },
  { class: "xsi-undeclared", local: "zz", namespace: xsiNamespace },
];

/**
 * The handle a candidate spells when it names a closed attribute: its local name in no namespace,
 * `xml:` or `xsi:` before it in those namespaces.
 *
 * @param candidate - The candidate.
 * @returns The handle, `None` for a name in another namespace.
 */
const handleOf = ({ local, namespace }: Candidate): Option.Option<string> => {
  if (namespace === "") {
    return Option.some(local);
  }

  if (namespace === xmlNamespace) {
    return Option.some(`xml:${local}`);
  }

  return namespace === xsiNamespace ? Option.some(`xsi:${local}`) : Option.none();
};

/**
 * How the vocabulary reads one attribute candidate on a kind: under a closed handle the kind
 * declares; as an `xsi:` attribute every element kind admits (reading 47); as an `xml:` name a
 * wildcard lets through closed; or as an open name (`openClassOf`) where the kind's wildcard admits
 * the candidate's namespace and lets it through unvalidated.
 *
 * @param candidate - The candidate.
 * @param declared - The handles the kind declares.
 * @param wildcard - The kind's attribute wildcard, `None` for none.
 * @param own - The kind's namespace.
 * @returns Whether the vocabulary admits it.
 */
const vocabularyAdmits = (
  candidate: Candidate,
  declared: ReadonlySet<string>,
  wildcard: Option.Option<{
    readonly namespace: "##any" | "##local" | "##other";
    readonly processing: string;
  }>,
  own: string,
): boolean => {
  const handle = handleOf(candidate);

  if (Option.exists(handle, (name) => declared.has(name))) {
    return true;
  }

  if (
    candidate.namespace === xsiNamespace &&
    declaredIn.get(xsiNamespace)?.has(candidate.local) === true
  ) {
    return true;
  }

  if (
    candidate.namespace === xmlNamespace &&
    declaredIn.get(xmlNamespace)?.has(candidate.local) === true
  ) {
    return Option.isSome(wildcard);
  }

  const open = openClassOf(
    { local: candidate.local, namespace: candidate.namespace, prefix: "v", qname: candidate.local },
    { foreign: false, local: "e", namespace: own },
  );

  return (
    Result.isSuccess(open) &&
    Option.exists(
      wildcard,
      ({ namespace, processing }) =>
        processing !== "strict" && constraintAdmits(namespace, own, candidate.namespace),
    )
  );
};

/**
 * Write a candidate's qualified name on a probe.
 *
 * @param candidate - The candidate.
 * @returns `prefix:local`, or `local` in no namespace.
 */
const writtenName = ({ local, namespace }: Candidate): string => {
  if (namespace === "") {
    return local;
  }

  // The `xml` prefix is bound without a declaration; every other namespace by the batch's.
  return `${namespace === xmlNamespace ? "xml" : (probePrefixes.get(namespace) ?? "x")}:${local}`;
};

/**
 * The name a validity error gives an attribute, for a candidate: its local name in no namespace,
 * else its Clark name.
 *
 * @param candidate - The candidate.
 * @returns The name.
 */
const reportedName = ({ local, namespace }: Candidate): string =>
  namespace === "" ? local : `{${namespace}}${local}`;

/**
 * One judged attribute candidate.
 */
interface JudgedAttribute {
  readonly candidate: Candidate;
  readonly errors: readonly ValidityError[];
  readonly kind: string;
  readonly underOtherLax: boolean;
  readonly vocabulary: boolean;
  readonly version: SchemaVersion;
}

/**
 * The rulings that set an XSD verdict aside, each named by the spec reading that makes it.
 *
 * - Reading 13: a no-namespace name that begins `data-` and breaks its pattern is refused, though a
 *   wildcard that admits no-namespace names lets XML Schema admit it.
 * - The oracle's departure, where the specification wins: libxml2 2.9.13 writes the union an
 *   extension makes of its base's `##any` wildcard and an attribute group's `##other` wildcard into
 *   the group's own wildcard, so every other type that references the group admits a name in no
 *   namespace or in the target namespace too, which XML Schema 1.0 Part 1, 3.10.4, clauses 2.2 and
 *   2.3, refuse: each type's complete wildcard is its own (3.4.2). The ASI XSDs'
 *   `extensionNamespaceLax.Attr` is such a group. Reduced: a group `G` of `##other` `lax`, a type
 *   `Ext` extending a `##any` base with `G`, and a type `Plain` with `G` alone; an element of
 *   `Plain` admits `zz` and `t:zz`, and does not once `Ext` is removed.
 *
 * @param judged - The candidate.
 * @param xsd - Xmllint's verdict.
 * @returns The ruling, or `None` when no ruling sets the verdict aside.
 */
const rulingOf = (judged: JudgedAttribute, xsd: boolean): Option.Option<string> => {
  if (judged.underOtherLax && xsd && !judged.vocabulary) {
    return Option.some("libxml2 departs from XML Schema 1.0, 3.10.4, clauses 2.2 and 2.3");
  }

  return judged.candidate.class === "data-invalid" && xsd && !judged.vocabulary
    ? Option.some("spec reading 13")
    : Option.none();
};

/**
 * One element candidate under a kind's element wildcard: the letter it stands as, its class, and
 * whether the vocabulary admits it and reads it as its kind (validated) or as a foreign element.
 */
interface JudgedElement {
  readonly class: string;
  readonly errors: readonly ValidityError[];
  readonly kind: string;
  readonly reading: "foreign" | "kind" | "refused";
  readonly version: SchemaVersion;
}

/**
 * The rosters, read as rosters rather than as the leaf's literal tuples.
 */
const rosters: readonly VocabularyRoster[] = vocabularies;

/**
 * The element classes the wildcard suite tries, with a letter for each: a foreign element in a
 * namespace no schema declares, one in no namespace, a global and a local kind of the parent's own
 * namespace and of another, and a QTI document root (reading 6). No kind whose element name the
 * parent's model names is a candidate: an element particle of that name could take it, whatever its
 * type, so it would not stand in the wildcard.
 *
 * @param globals - The kinds declared globally in the version.
 * @param world - The probe world.
 * @param own - The parent's namespace.
 * @param named - The element names the parent's model names, as `{namespace}local`.
 * @returns Each class with its letter.
 */
const elementCandidatesOf = (
  globals: ReadonlySet<string>,
  world: ProbeWorld,
  own: string,
  named: ReadonlySet<string>,
): readonly (readonly [string, Letter])[] => {
  const kindIn = (namespace: string, global: boolean): Option.Option<Letter> =>
    Option.map(
      Arr.findFirst(
        rosters.flatMap((roster) => (roster.namespace === namespace ? roster.kinds : [])),
        ({ handle }) =>
          globals.has(handle) === global &&
          !foreignRoots.has(handle) &&
          !Option.exists(world.elementOf(handle), ({ local, namespace: held }) =>
            named.has(`{${held}}${local}`),
          ) &&
          Option.isSome(world.modelOf(handle)),
      ),
      ({ handle }): Letter => ({ _tag: "kind", kind: handle }),
    );
  const other = own === mathmlNamespace ? ssmlNamespace : mathmlNamespace;

  return [
    ["foreign", { _tag: "foreign", namespace: foreignNamespace }],
    ["no-namespace", { _tag: "foreign", namespace: "" }],
    ...Option.toArray(kindIn(own, true)).map((letter) => ["own-global", letter] as const),
    ...Option.toArray(kindIn(own, false)).map((letter) => ["own-local", letter] as const),
    ...Option.toArray(kindIn(other, true)).map((letter) => ["other-global", letter] as const),
    ["qti-root", { _tag: "kind", kind: "qti-assessment-item" }],
  ];
};

/**
 * The marker letter a word holds where a candidate goes: a foreign element in a namespace no letter
 * of a generated word is in.
 */
const marker: Letter = { _tag: "foreign", namespace: "urn:candidate" };

/**
 * The element particles and wildcards of a tree, in tree order, the places `targetsOf` and
 * `wordWith` number, each with whether it may occur: no bound of 0 on it or on a group around it.
 *
 * @param particle - The tree.
 * @param possible - Whether the tree itself may occur.
 * @returns Its leaves.
 */
const placesOf = (
  particle: Particle,
  possible = true,
): readonly {
  readonly leaf: Extract<Particle, { readonly _tag: "any" | "element" }>;
  readonly possible: boolean;
}[] => {
  const here = possible && !Option.contains(particle.occurs.max, 0);

  return particle._tag === "group"
    ? particle.particles.flatMap((inner) => placesOf(inner, here))
    : [{ leaf: particle, possible: here }];
};

/**
 * The element names a particle's element particles name, as `{namespace}local`.
 *
 * @param particle - The particle.
 * @param world - The probe world, which names each kind's element.
 * @returns The names.
 */
const namedIn = (particle: Particle, world: ProbeWorld): ReadonlySet<string> =>
  new Set(
    placesOf(particle).flatMap(({ leaf }) =>
      leaf._tag === "element"
        ? leaf.kinds.flatMap((kind) =>
            Option.toArray(world.elementOf(kind)).map(
              ({ local, namespace }) => `{${namespace}}${local}`,
            ),
          )
        : [],
    ),
  );

/**
 * How the vocabulary reads an element a wildcard's namespaces admit or do not, by the wildcard's
 * processing (D2's ruling): refused outside its namespaces; under `skip` foreign; under `lax` as
 * its kind when a global declaration names it, but reading 6's roots, and foreign otherwise; under
 * `strict` as its kind, or refused.
 *
 * @param admitted - Whether the wildcard's namespaces admit the element's.
 * @param processing - The wildcard's processing.
 * @param global - Whether a global declaration names the element, reading 6's roots aside.
 * @returns The reading.
 */
const readingUnder = (
  admitted: boolean,
  processing: string,
  global: boolean,
): JudgedElement["reading"] => {
  if (!admitted) {
    return "refused";
  }

  if (processing === "skip") {
    return "foreign";
  }

  if (global) {
    return "kind";
  }

  return processing === "strict" ? "refused" : "foreign";
};

/**
 * Pose one version's attribute and element questions.
 *
 * @param version - The version.
 * @returns The judged candidates.
 */
const judgeVersion = Effect.fn("test.judgeOpenNames")(function* judgeVersion(
  version: SchemaVersion,
) {
  const { driver, targets } = yield* probeTargetsOf(version);
  const world = probeWorldOf(version, {
    attributes: attributeDeclarations,
    models: contentModels,
    vocabularies,
  });
  const declared = Map.groupBy(
    attributeDeclarations.filter((row) => row.versions.includes(version)),
    (row) => row.kind,
  );
  const wildcards = new Map(
    attributeWildcards.flatMap((row) =>
      row.versions.includes(version) ? [[row.kind, row] as const] : [],
    ),
  );
  const globals = new Set(
    globalKinds.flatMap(({ kind, versions }) => (versions.includes(version) ? [kind] : [])),
  );
  const attributeProbes: string[] = [];
  const elementProbes: string[] = [];
  const attributeCases: Omit<JudgedAttribute, "errors">[][] = [];
  const elementCases: Omit<JudgedElement, "errors">[] = [];

  for (const [kind, target] of targets) {
    const own = Option.match(world.elementOf(kind), {
      onNone: () => "",
      onSome: ({ namespace }) => namespace,
    });
    const names = new Set((declared.get(kind) ?? []).map(({ name }) => name));
    const required = world.requiredOf(kind).map(({ name }) => [name, probeValueOf(name)] as const);
    const wildcard = Option.fromNullishOr(wildcards.get(kind));
    const candidates = candidatesFor(own).filter(
      (candidate) =>
        !Option.exists(
          handleOf(candidate),
          (name) => names.has(name) && candidate.namespace === "",
        ),
    );

    attributeProbes.push(
      tagged(
        rootNameOf(world, target),
        [
          ...required,
          ...candidates.map(
            (candidate) =>
              [writtenName(candidate), candidate.local === "space" ? "default" : "x"] as const,
          ),
        ],
        "",
      ),
    );
    attributeCases.push(
      candidates.map((candidate) => ({
        candidate,
        kind,
        underOtherLax:
          (candidate.namespace === "" || candidate.namespace === own) &&
          Option.exists(
            wildcard,
            ({ namespace, processing }) => namespace === "##other" && processing === "lax",
          ),
        version,
        vocabulary: vocabularyAdmits(candidate, names, wildcard, own),
      })),
    );

    const content = world.modelOf(kind);
    const scope: MatchScope = {
      kindNamespace: (letter) => Option.map(world.elementOf(letter), (found) => found.namespace),
      own,
    };

    if (
      Option.isSome(content) &&
      (content.value._tag === "element-only" || content.value._tag === "mixed")
    ) {
      const { particle } = content.value;

      for (const [place, { leaf, possible }] of placesOf(particle).entries()) {
        if (leaf._tag !== "any" || !possible) {
          continue;
        }

        const word = wordWith(particle, { letter: marker, place }, world.cost);

        if (Option.isNone(word)) {
          continue;
        }

        for (const [kindOfCandidate, letter] of elementCandidatesOf(
          globals,
          world,
          own,
          namedIn(particle, world),
        )) {
          const namespace =
            letter._tag === "foreign"
              ? letter.namespace
              : Option.match(world.elementOf(letter.kind), {
                  onNone: () => "",
                  onSome: (found) => found.namespace,
                });
          // The model, not the one wildcard, decides: another wildcard beside it may take the
          // candidate, as XInclude's `##local` does what its `##other` refuses. The candidate is
          // read by the processing of the first wildcard whose namespaces admit it.
          const admitted = admitsWord(
            content.value,
            scope,
            word.value.map((held) => (held === marker ? letter : held)),
          );
          const reader = Arr.findFirst(
            placesOf(particle),
            (other) =>
              other.possible &&
              other.leaf._tag === "any" &&
              constraintAdmits(other.leaf.namespace, own, namespace),
          );
          const processing = Option.match(reader, {
            onNone: () => leaf.processing,
            onSome: (other) =>
              other.leaf._tag === "any" ? other.leaf.processing : leaf.processing,
          });
          const global =
            letter._tag === "kind" && globals.has(letter.kind) && !foreignRoots.has(letter.kind);
          const reading = readingUnder(admitted, processing, global);
          const candidateText =
            letter._tag === "foreign"
              ? instanceOf(world, letter)
              : Option.match(world.elementOf(letter.kind), {
                  onNone: () => "",
                  onSome: ({ local, namespace: held }) =>
                    tagged(
                      qualified(world, held, local),
                      world
                        .requiredOf(letter.kind)
                        .map(({ name }) => [name, probeValueOf(name)] as const),
                      [
                        ...Option.match(world.modelOf(letter.kind), {
                          onNone: () => [],
                          onSome: (inner) =>
                            inner._tag === "element-only" || inner._tag === "mixed"
                              ? minimalWord(inner.particle, world.cost).map((child) =>
                                  instanceOf(world, child),
                                )
                              : [],
                        }),
                        "<zz/>",
                      ].join(""),
                    ),
                });
          const children = word.value
            .map((held) => (held === marker ? candidateText : instanceOf(world, held)))
            .join("");

          elementProbes.push(tagged(rootNameOf(world, target), required, children));
          elementCases.push({ class: kindOfCandidate, kind, reading, version });
        }
      }
    }
  }

  // Every attribute probe stands before every element probe, so each case's errors are at its
  // list's index, the element cases' after all the attribute cases'.
  const errors = yield* validate(`${packageRoot}/work/vocab-open-oracle/${version}`, driver, [
    ...attributeProbes,
    ...elementProbes,
  ]);
  const attributes = attributeCases.flatMap((cases, at) =>
    cases.map((judged): JudgedAttribute => ({ ...judged, errors: errors[at] ?? [] })),
  );
  const elements = elementCases.map((judged, at): JudgedElement => ({
    ...judged,
    errors: errors[attributeCases.length + at] ?? [],
  }));

  return { attributes, elements };
});

/**
 * Whether a validity error names the `<zz/>` a candidate's instance holds to show it was checked.
 *
 * @param named - The element the error names.
 * @returns Whether it is that marker.
 */
const isMarker = (named: string): boolean => named === "zz" || named.endsWith("}zz");

/**
 * What the validator says of an element candidate: refused when it stands where it may not, read
 * as its kind when its content was checked (the `<zz/>` inside it was refused), and as foreign
 * otherwise.
 *
 * @param judged - The candidate.
 * @returns The XSDs' reading.
 */
const xsdReading = (judged: JudgedElement): JudgedElement["reading"] => {
  const classes = judged.errors.map((found) => [classOf(found), found.element] as const);

  if (
    classes.some(
      ([found, named]) =>
        (found === "element-unexpected" || found === "element-strict") && !isMarker(named),
    )
  ) {
    return "refused";
  }

  return classes.some(([, named]) => isMarker(named)) ? "kind" : "foreign";
};

/**
 * Both versions' judged candidates, read once.
 */
class Judgements extends Context.Service<
  Judgements,
  { readonly attributes: readonly JudgedAttribute[]; readonly elements: readonly JudgedElement[] }
>()("vocab/open.test/Judgements") {}

/**
 * Judge both versions.
 */
const JudgementsLayer = Layer.effect(
  Judgements,
  Effect.gen(function* judgeAll() {
    const attributes: JudgedAttribute[][] = [];
    const elements: JudgedElement[][] = [];

    for (const version of schemaVersions) {
      const judged = yield* judgeVersion(version);

      attributes.push([...judged.attributes]);
      elements.push([...judged.elements]);
    }

    return Judgements.of({ attributes: attributes.flat(), elements: elements.flat() });
  }),
).pipe(
  Layer.provide(
    Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto, NodeChildProcessSpawner.layer),
  ),
  Layer.provide(NodeServices.layer),
);

if (Option.isSome(absence)) {
  it("holds open-name admission against the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))(
  "vocab/open.ts against xmllint over the pinned XSDs",
  () => {
    layer(JudgementsLayer, { timeout: hookTimeoutMs })("from the cache", (cached) => {
      cached.effect(
        "admits exactly the attributes XML Schema admits, by namespace class, but reading 13",
        (ctx) =>
          Effect.gen(function* attributes() {
            const judged = yield* Judgements;
            const byKind = [
              ...Map.groupBy(
                judged.attributes,
                ({ kind, version }) => `${version} ${kind}`,
              ).values(),
            ];

            return yield* searched(
              ctx,
              exhaust(
                {
                  caseHang,
                  coverage: requiredInSpace<"admitted" | "refused" | "ruled">([
                    "admitted",
                    "refused",
                    "ruled",
                  ]),
                  generator: int(0, byKind.length - 1),
                  limit: byKind.length,
                  literal: Formatter.format,
                  suite: "vocab/open-attributes-xmllint",
                },
                (index, c) =>
                  Effect.sync(() => {
                    const disagreements = Arr.getUnsafe(byKind, index).flatMap((probe) => {
                      const xsd = !probe.errors.some(
                        (found) =>
                          (classOf(found) === "attribute-not-allowed" ||
                            classOf(found) === "attribute-strict") &&
                          Option.contains(found.attribute, reportedName(probe.candidate)),
                      );

                      if (xsd === probe.vocabulary) {
                        c.note(xsd ? "admitted" : "refused");

                        return [];
                      }

                      const ruling = rulingOf(probe, xsd);

                      if (Option.isSome(ruling)) {
                        c.note("ruled");

                        return [];
                      }

                      return [
                        `${probe.version} ${probe.kind} ${writtenName(probe.candidate)} (${probe.candidate.class}): the vocabulary ${probe.vocabulary ? "admits" : "refuses"} it, XML Schema ${xsd ? "admits" : "refuses"} it`,
                      ];
                    });

                    assert.strictEqual(
                      disagreements.slice(0, 12).join("\n"),
                      "",
                      `${disagreements.length} disagreements`,
                    );
                  }),
              ),
            );
          }),
        hookTimeoutMs,
      );

      cached.effect(
        "reads each element wildcard's elements as processContents does, but reading 6",
        (ctx) =>
          Effect.gen(function* elements() {
            const judged = yield* Judgements;
            const byKind = [
              ...Map.groupBy(judged.elements, ({ kind, version }) => `${version} ${kind}`).values(),
            ];

            return yield* searched(
              ctx,
              exhaust(
                {
                  caseHang,
                  coverage: requiredInSpace<"foreign" | "kind" | "refused" | "ruled">([
                    "foreign",
                    "kind",
                    "refused",
                    "ruled",
                  ]),
                  generator: int(0, byKind.length - 1),
                  limit: byKind.length,
                  literal: Formatter.format,
                  suite: "vocab/open-elements-xmllint",
                },
                (index, c) =>
                  Effect.sync(() => {
                    const disagreements = Arr.getUnsafe(byKind, index).flatMap((probe) => {
                      const xsd = xsdReading(probe);

                      if (xsd === probe.reading) {
                        c.note(xsd);

                        return [];
                      }

                      if (probe.class === "qti-root") {
                        c.note("ruled");

                        return [];
                      }

                      return [
                        `${probe.version} ${probe.kind} ${probe.class}: the vocabulary reads it ${probe.reading}, XML Schema ${xsd} (${Formatter.format(probe.errors)})`,
                      ];
                    });

                    assert.strictEqual(
                      disagreements.slice(0, 12).join("\n"),
                      "",
                      `${disagreements.length} disagreements`,
                    );
                  }),
              ),
            );
          }),
        hookTimeoutMs,
      );
    });
  },
);

/**
 * The names of the namespaces a namespace-class cell tries.
 */
type NamespaceLabel = "absent" | "other" | "target" | "xml";

/**
 * The namespaces each namespace-class cell tries against a wildcard's target namespace, each
 * named: the target itself, none, one no schema declares, and the XML namespace, which no pinned
 * schema document but `xml.xsd` has as its target, and `xml.xsd` holds no wildcard.
 *
 * @param target - The wildcard's target namespace, its kind's namespace.
 * @returns Each namespace with its name.
 */
const namespacesAgainst = (target: string): readonly (readonly [NamespaceLabel, string])[] => [
  ["target", target],
  ["absent", ""],
  ["other", foreignNamespace],
  ["xml", xmlNamespace],
];

/**
 * The situations the namespace-class suite must reach: every namespace constraint the pinned XSDs
 * write, against each namespace a cell tries.
 */
const classSituations = [
  "##any target",
  "##any absent",
  "##any other",
  "##any xml",
  "##other target",
  "##other absent",
  "##other other",
  "##other xml",
  "##local target",
  "##local absent",
  "##local other",
  "##local xml",
] as const satisfies readonly `${NamespaceConstraint} ${NamespaceLabel}`[];

/**
 * The namespace of every kind, by its roster.
 */
const namespaceOfKind: ReadonlyMap<string, string> = new Map(
  rosters.flatMap(({ kinds, namespace }) =>
    kinds.map(({ handle }) => [handle, namespace] as const),
  ),
);

/**
 * The element wildcards of a model that may occur, each with its namespace constraint and
 * processing.
 *
 * @param content - The model.
 * @returns The wildcards, in tree order.
 */
const wildcardsIn = (
  content: ContentType,
): readonly Extract<Particle, { readonly _tag: "any" }>[] =>
  content._tag === "element-only" || content._tag === "mixed"
    ? placesOf(content.particle).flatMap(({ leaf, possible }) =>
        possible && leaf._tag === "any" ? [leaf] : [],
      )
    : [];

/**
 * The model `xs:anyType` gives a foreign element: its attribute and element wildcards, `##any` and
 * `lax` (XML Schema 1.0 Part 1, §3.4.7).
 */
const anyTypeWildcard = { namespace: "##any", processing: "lax" } as const;

/**
 * One cell of the namespace-class suite: a kind of a version, the wildcards its content and its
 * attributes hold, and its namespace, each wildcard's target namespace.
 */
interface ClassCell {
  readonly attributes: readonly (typeof anyTypeWildcard | AttributeWildcard)[];
  readonly elements: readonly (
    | typeof anyTypeWildcard
    | Extract<Particle, { readonly _tag: "any" }>
  )[];
  readonly kind: string;
  readonly own: string;
  readonly version: SchemaVersion;
}

/**
 * The kinds whose element wildcard a spec reading restates, and the wildcard it reads in place of
 * the XSD's: spec reading 102 (upstream's 61), `qti-ordering`'s extension slot `##any` where the
 * XSD writes `##other` (information model §5.98.3; `facets.ts`, `orderingModel`).
 */
const restatedWildcards: ReadonlyMap<string, readonly (typeof anyTypeWildcard)[]> = new Map([
  ["qti-ordering", [anyTypeWildcard]],
]);

/**
 * Every cell: each kind of each version a model states, with its element and attribute wildcards,
 * and each foreign kind, whose wildcards are `xs:anyType`'s and whose namespace, a foreign
 * element's own, is one no schema declares. A kind of {@link restatedWildcards} holds the
 * reading's wildcard in place of the XSD's.
 */
const classCells: readonly ClassCell[] = [
  ...contentModels.flatMap(({ content, kind, versions }) =>
    versions.map((version) => ({
      attributes: attributeWildcards.filter(
        (row) => row.kind === kind && row.versions.includes(version),
      ),
      elements: restatedWildcards.get(kind) ?? wildcardsIn(content),
      kind,
      own: namespaceOfKind.get(kind) ?? "",
      version,
    })),
  ),
  ...schemaVersions.flatMap((version) =>
    Object.values(foreignKinds).map((kind) => ({
      attributes: [anyTypeWildcard],
      elements: [anyTypeWildcard],
      kind,
      own: "urn:foreign-host",
      version,
    })),
  ),
];

describe("vocab/open.ts namespace classes against XML Schema 1.0, 3.10.4", () => {
  it.effect(
    "admits a foreign element or an open attribute of a namespace exactly where a wildcard does",
    (ctx) =>
      Effect.gen(function* classes() {
        const grammar = yield* Effect.fromResult(composed());
        const covered = coveredBy(grammar.kinds);
        // Q8's case 131: an ASI-namespace element, `{…imsqtiasi_v3p0}widget`, under a `##other`
        // wildcard of an ASI kind in 3.0.0, which xmllint refuses as outside the wildcard.
        const case131 = classCells.filter(
          ({ elements, own, version }) =>
            own === asiNamespace &&
            version === "3.0.0" &&
            elements.some(({ namespace }) => namespace === "##other"),
        );

        assert.isAbove(case131.length, 0);
        assert.deepStrictEqual(
          case131.filter(({ kind, version }) =>
            Option.isSome(
              grammar.admission.lookup({
                child: foreignKinds[namespaceClassOf(asiNamespace, asiNamespace)],
                parent: kind,
                version,
              }),
            ),
          ),
          [],
        );

        return yield* searched(
          ctx,
          exhaust(
            {
              caseHang,
              coverage: requiredInSpace<(typeof classSituations)[number]>(classSituations),
              generator: int(0, classCells.length - 1),
              limit: classCells.length,
              literal: Formatter.format,
              suite: "vocab/open-namespace-classes",
            },
            (index, c) =>
              Effect.sync(() => {
                const { attributes, elements, kind, own, version } = Arr.getUnsafe(
                  classCells,
                  index,
                );
                const wrong = namespacesAgainst(own).flatMap(([label, namespace]) => {
                  const foreign = foreignKinds[namespaceClassOf(namespace, own)];
                  // Every processing admits an undeclared element its constraint admits; a
                  // `strict` one only with an xsi:type its document's schema set resolves (spec
                  // reading 72), so `StrictlyHeld` marks a foreign kind only strict wildcards admit.
                  // No wildcard admits one in MathML's namespace: MathML content stands only inside
                  // m:math, and the RelaxNG's anyElement excludes MathML's own (spec reading 2).
                  const admitting = elements.filter(
                    ({ namespace: constraint }) =>
                      namespace !== mathmlNamespace && constraintAdmits(constraint, own, namespace),
                  );
                  const elementSpecified = admitting.length > 0;
                  const strictSpecified =
                    elementSpecified &&
                    admitting.every(({ processing }) => processing === "strict");
                  const elementRead = Option.isSome(
                    grammar.admission.lookup({ child: foreign, parent: kind, version }),
                  );
                  const strictRead = Option.isSome(
                    grammar.content.strictlyHeld.lookup({ child: foreign, parent: kind, version }),
                  );
                  const attribute = Result.getOrThrow(
                    openClassOf(
                      {
                        local: "zz",
                        namespace,
                        prefix: namespace === "" ? "" : "p",
                        qname: namespace === "" ? "zz" : "p:zz",
                      },
                      { foreign: isForeignKind(kind), local: kind, namespace: own },
                    ),
                  )._tag;
                  // On an element the Schematron's extension rules cover, spec reading 81 admits no
                  // attribute its XSD does not declare but a `data-` one, whatever its wildcard
                  // admits, and the drawn name is no `data-` name.
                  const attributeSpecified =
                    !covered(version, kind) &&
                    attributes.some(
                      ({ namespace: constraint, processing }) =>
                        processing !== "strict" && constraintAdmits(constraint, own, namespace),
                    );
                  const attributeRead = Option.isSome(
                    grammar.attributes.admission.lookup({ kind, name: attribute, version }),
                  );

                  for (const { namespace: constraint } of [...elements, ...attributes]) {
                    c.note(`${constraint} ${label}`);
                  }

                  return [
                    ...(elementRead === elementSpecified
                      ? []
                      : [
                          `${version} ${kind}: a foreign element in the ${label} namespace (${foreign}) is ${elementRead ? "admitted" : "refused"}, and its element wildcards ${elementSpecified ? "admit" : "refuse"} it`,
                        ]),
                    ...(strictRead === strictSpecified
                      ? []
                      : [
                          `${version} ${kind}: a foreign element in the ${label} namespace (${foreign}) is ${strictRead ? "" : "not "}strictly held, and its element wildcards are ${strictSpecified ? "" : "not "}all strict`,
                        ]),
                    ...(attributeRead === attributeSpecified
                      ? []
                      : [
                          `${version} ${kind}: an undeclared attribute in the ${label} namespace (${attribute}) is ${attributeRead ? "admitted" : "refused"}, and its attribute wildcard ${attributeSpecified ? "admits" : "refuses"} it`,
                        ]),
                  ];
                });

                assert.strictEqual(wrong.join("\n"), "");
              }),
          ),
        );
      }),
    hookTimeoutMs,
  );
});

describe("XLink's global attributes (C30)", () => {
  it.effect(
    "are admitted, with xlink.xsd's types, on exactly the kinds whose lax or strict attribute wildcard admits another namespace and whose documents the content-packaging set assesses, and on the foreign kinds: every admission row of every kind, both versions",
    () =>
      // Oracle: XML Schema 1.0 Part 1, §3.10.4 and §3.4.4 clause 3.2, over the leaf's attribute
      // wildcards, with spec reading 72's schema sets read directly: only the content-packaging
      // set imports xlink.xsd (`cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd` line 10), and a foreign
      // element, assessed against `xs:anyType`'s lax `##any`, stands in documents of every set.
      // Bound: every (version, kind) the attribute grammar admits a name on.
      Effect.gen(function* xlinkHosts() {
        const grammar = yield* Effect.fromResult(composed());
        const covered = coveredBy(grammar.kinds);
        const inCpSet = new Set(["cp", "cpx", "csmd", "drd", "lom", "qmd"]);
        const vocabularyOf = new Map<string, string>(
          vocabularies.map(({ name, namespace }) => [namespace, name] as const),
        );
        const expected = new Set<string>();
        for (const { kind, namespace, processing, versions } of attributeWildcards) {
          const own = Option.match(grammar.kinds.elementName.lookup({ kind }), {
            onNone: () => "",
            onSome: (name) => name.namespace,
          });
          if (
            grammar.kinds.nodeKind.has(kind) &&
            namespace !== "##local" &&
            processing !== "skip" &&
            inCpSet.has(vocabularyOf.get(own) ?? "")
          ) {
            for (const version of versions.filter((held) => !covered(held, kind))) {
              expected.add(`${version} ${kind}`);
            }
          }
        }

        for (const version of schemaVersions) {
          for (const kind of Object.values(foreignKinds)) {
            expected.add(`${version} ${kind}`);
          }
        }

        const admitted = Map.groupBy(
          grammar.attributes.admission.rows.filter(({ name }) => name.startsWith("xlink:")),
          ({ kind, version }): string => `${version} ${kind}`,
        );

        assert.deepStrictEqual(new Set(admitted.keys()), expected);
        assert.deepStrictEqual(
          [...admitted.values()].filter((rows) => rows.length !== 10).map((rows) => rows.length),
          [],
        );
      }),
    hookTimeoutMs,
  );
});
