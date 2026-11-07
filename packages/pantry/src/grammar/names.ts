/**
 * The closed relations of the names a foreign element may hold, as patterns its open text is
 * matched against (C8, C15 and C36 of `docs/research/up.md`):
 *
 * - `KindByNameUnder`: (version, parent) → names, the expanded names of the element kinds a parent
 *   admits, which no foreign element under it may hold, since a name a parent admits resolves to
 *   its kind (XML Schema 1.0 Part 1, §3.3.2 and §3.10.4; `kinds.ts`, `resolution`).
 * - `TypeAvailable`: type → namespaces, the namespaces of the vocabularies under whose elements an
 *   `xsi:type` may name the type, so its document's schema set holds it (spec readings 60 and 81;
 *   `open.ts`, `typeAvailable`).
 *
 * A foreign element keeps its namespace and local name as open text (`OpenElementName`), and a
 * closed relation's key is closed ids only (grizzle's README, "Closed relations"), so neither
 * relation is keyed by a name: each key is the closed ids a law has (the version, the parent's
 * kind, the governing type), and the payload is a pattern of grizzle's pattern grammar, which a law
 * reads through `Compute.matches(text, R.at(field, key…))`. Each pattern matches its finite set of
 * texts and nothing else: its alternatives are literals, anchored at both ends.
 */
import { Array as Arr, Option, Order } from "effect";
import type { Result } from "effect";
import { closed, idField, valueField } from "#pantry/grammar/closed.ts";
import type {
  Closed,
  ClosedRelationError,
  IdField,
  Roster,
  ValueField,
} from "#pantry/grammar/closed.ts";
import { isForeignKind } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

/**
 * Spell a text as a literal of grizzle's pattern grammar, ECMAScript's under the `u` flag: each
 * syntax character and `/` behind a backslash, the only identity escapes that grammar admits
 * (ECMA-262 22.2.1, IdentityEscape[+UnicodeMode]), every other character itself.
 *
 * @param text - The text.
 * @returns The literal, which matches the text and nothing else.
 */
export const patternLiteral = (text: string): string =>
  text.replaceAll(/[\^$\\.*+?()[\]{}|/]/gu, String.raw`\$&`);

/**
 * The pattern of a set no text is in that a law matches here: the empty text, which no expanded
 * name `namespace}local` and no namespace of a vocabulary is.
 */
export const noText = "^$";

/**
 * The pattern of every text: an empty match at the start of any text, which `Compute.matches`
 * finds, since it asks whether the text holds a match.
 */
export const everyText = "^";

/**
 * The pattern of a finite set of texts: their literals as one alternation, anchored at both ends,
 * or {@link noText} for the empty set.
 *
 * @param texts - The texts, a repeat read once.
 * @returns The pattern, its alternatives sorted, so one set has one spelling.
 */
export const textsPattern = (texts: Iterable<string>): string => {
  const held = [...new Set(texts)].toSorted();

  return held.length === 0 ? noText : `^(?:${held.map(patternLiteral).join("|")})$`;
};

/**
 * Spell an element's expanded name as one text, `namespace}local`: the subject a law matches
 * `KindByNameUnder`'s pattern against, as `Compute.concat(Compute.concat(namespace, "}"), local)`,
 * since grizzle's `concat` takes a literal only second. A local name is an NCName, which holds no
 * `}`, so the text's last `}` ends the namespace and one text spells one name: James Clark's
 * `{namespace}local` without its opening brace.
 *
 * @param name - The element's namespace name, empty for none, and its local name.
 * @param name.local - The local name.
 * @param name.namespace - The namespace name.
 * @returns The text.
 */
export const expandedText = ({
  local,
  namespace,
}: {
  readonly local: string;
  readonly namespace: string;
}): string => `${namespace}}${local}`;

/**
 * The pattern of a finite set of expanded names, as {@link expandedText} spells them: each
 * namespace's local names grouped behind it, `^(?:ns\}(?:a|b)|…)$`, or {@link noText} for none.
 *
 * @param names - The names, a repeat read once.
 * @returns The pattern, which matches exactly the names' texts.
 */
export const expandedNamesPattern = (
  names: Iterable<{ readonly local: string; readonly namespace: string }>,
): string => {
  const byNamespace = new Map<string, Set<string>>();
  for (const { local, namespace } of names) {
    byNamespace.getOrInsertComputed(namespace, () => new Set()).add(local);
  }

  if (byNamespace.size === 0) {
    return noText;
  }

  const groups = [...byNamespace]
    .toSorted(([left], [right]) => Order.String(left, right))
    .map(
      ([namespace, locals]) =>
        `${patternLiteral(namespace)}\\}(?:${[...locals].toSorted().map(patternLiteral).join("|")})`,
    );

  return `^(?:${groups.join("|")})$`;
};

/**
 * `KindByNameUnder` as a closed relation: (version, parent) → names.
 */
export type NamesUnder = Closed<
  readonly [IdField<"version", SchemaVersion>, IdField<"parent", string>],
  readonly [ValueField<"names", string>]
>;

/**
 * Generate `KindByNameUnder`: for each (version, parent) whose content admits a foreign element,
 * the pattern of the expanded names of the element kinds it admits there.
 *
 * Only a parent that admits a foreign kind may hold a foreign element (N5), so the relation is
 * total over the parents a foreign element's row may name and holds no other.
 *
 * @param input - The admitted triples and the kinds' names.
 * @param input.admitted - Each (version, parent, child) the content grammar admits.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.nameOf - A kind's expanded name, none for a kind that is no element of a
 *   vocabulary.
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relation, or the reason it has no constant.
 */
export const namesUnder = (input: {
  readonly admitted: readonly {
    readonly child: string;
    readonly parent: string;
    readonly version: SchemaVersion;
  }[];
  readonly kinds: Roster<string>;
  readonly nameOf: (
    kind: string,
  ) => Option.Option<{ readonly local: string; readonly namespace: string }>;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<NamesUnder, ClosedRelationError> => {
  const families = Object.values(
    Arr.groupBy(input.admitted, ({ parent, version }) => `${version} ${parent}`),
  );
  const rows = families.flatMap(([first, ...rest]) => {
    const admitted = [first, ...rest];

    return admitted.some(({ child }) => isForeignKind(child))
      ? [
          {
            names: expandedNamesPattern(
              admitted.flatMap(({ child }) => Option.toArray(input.nameOf(child))),
            ),
            parent: first.parent,
            version: first.version,
          },
        ]
      : [];
  });

  return closed({
    key: [idField("version", input.versions), idField("parent", input.kinds)],
    name: "KindByNameUnder",
    payload: [
      valueField(
        "names",
        rows.map(({ names }) => names),
      ),
    ],
    rows,
  });
};

/**
 * `TypeAvailable` as a closed relation: type → namespaces.
 */
export type TypesAvailable = Closed<
  readonly [IdField<"type", string>],
  readonly [ValueField<"namespaces", string>]
>;

/**
 * Generate `TypeAvailable`, total over the `TypeName` roster: for each type, the pattern of the
 * vocabulary namespaces under whose elements an `xsi:type` may name it; {@link everyText} for the
 * null type and for a type of XML Schema's own namespace, which every schema set holds.
 *
 * An element of a namespace no vocabulary has stands in documents of every set, so it may name a
 * type of every vocabulary: a law reads that half through {@link vocabularyNamespacesPattern},
 * which no such namespace matches.
 *
 * @param input - The types and the rule they are available by.
 * @param input.available - Whether an element of the first namespace may name a type of the
 *   second (`open.ts`, `typeAvailable`).
 * @param input.everywhere - Whether a type handle is available under every namespace: the null
 *   type, and a type of XML Schema's namespace.
 * @param input.namespaceOf - A type's namespace.
 * @param input.types - The `TypeName` roster.
 * @param input.vocabularies - The vocabularies' namespaces.
 * @returns The relation, or the reason it has no constant.
 */
export const typesAvailable = (input: {
  readonly available: (parent: string, type: string) => boolean;
  readonly everywhere: (type: string) => boolean;
  readonly namespaceOf: (type: string) => string;
  readonly types: Roster<string>;
  readonly vocabularies: readonly string[];
}): Result.Result<TypesAvailable, ClosedRelationError> => {
  // A type's pattern is its namespace's, so each namespace's is spelled once.
  const byNamespace = new Map<string, string>();
  const patternOf = (namespace: string): string => {
    const known = byNamespace.get(namespace);
    if (known !== undefined) {
      return known;
    }

    const pattern = textsPattern(
      input.vocabularies.filter((parent) => input.available(parent, namespace)),
    );
    byNamespace.set(namespace, pattern);

    return pattern;
  };
  const rows = input.types.handles.map((type) => ({
    namespaces: input.everywhere(type) ? everyText : patternOf(input.namespaceOf(type)),
    type,
  }));

  return closed({
    key: [idField("type", input.types)],
    name: "TypeAvailable",
    payload: [
      valueField(
        "namespaces",
        rows.map(({ namespaces }) => namespaces),
      ),
    ],
    rows,
  });
};

/**
 * The pattern of every vocabulary's namespace.
 *
 * @param vocabularies - The vocabularies' namespaces.
 * @returns The pattern, which no other namespace and no empty one matches.
 */
export const vocabularyNamespacesPattern = (vocabularies: readonly string[]): string =>
  textsPattern(vocabularies);

/**
 * `HeldRootsUnder` as a closed relation: (version, parent) → names.
 */
export type HeldRootsUnder = NamesUnder;

/**
 * Generate `HeldRootsUnder`: for each (version, parent) that holds a foreign element only under
 * `strict` wildcards (`StrictlyHeld`), the pattern of the expanded names of spec reading 6's roots
 * (`foreignRoots` of `open.ts`) such a wildcard holds there: a root whose namespace's foreign class
 * the parent holds strictly, and whose global declaration the schema set of the parent's documents
 * holds, so the wildcard assesses it against that declaration though no kind of the parent reads it
 * (C13 of `docs/research/up.md`: `cp:manifest` under `drd:accessForAllResource`). Every other
 * strictly held family's pattern is {@link noText}.
 *
 * @param input - The strictly held families and the roots' names.
 * @param input.classOf - The foreign kind of an element of a namespace under a parent of another,
 *   by namespace class (`foreignKinds`).
 * @param input.held - Each (version, parent, foreign kind) only strict wildcards admit.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.namespaceOf - A kind's namespace, empty for a kind of no vocabulary.
 * @param input.reads - Whether a wildcard of the first namespace's kind finds the second
 *   namespace's globals in its documents' schema set (`open.ts`, `wildcardReads`).
 * @param input.roots - Each root and the versions it is declared globally in.
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relation, or the reason it has no constant.
 */
export const heldRootsUnder = (input: {
  readonly classOf: (namespace: string, parent: string) => string;
  readonly held: readonly {
    readonly child: string;
    readonly parent: string;
    readonly version: SchemaVersion;
  }[];
  readonly kinds: Roster<string>;
  readonly namespaceOf: (kind: string) => string;
  readonly reads: (parent: string, child: string) => boolean;
  readonly roots: readonly {
    readonly kind: string;
    readonly local: string;
    readonly namespace: string;
    readonly versions: readonly SchemaVersion[];
  }[];
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<HeldRootsUnder, ClosedRelationError> => {
  const families = Object.values(
    Arr.groupBy(input.held, ({ parent, version }) => `${version} ${parent}`),
  );
  const rows = families.flatMap(([first, ...rest]) => {
    const own = input.namespaceOf(first.parent);
    const classes = new Set([first, ...rest].map(({ child }) => child));

    return [
      {
        names: expandedNamesPattern(
          input.roots.filter(
            ({ namespace, versions }) =>
              versions.includes(first.version) &&
              classes.has(input.classOf(namespace, own)) &&
              input.reads(own, namespace),
          ),
        ),
        parent: first.parent,
        version: first.version,
      },
    ];
  });

  return closed({
    key: [idField("version", input.versions), idField("parent", input.kinds)],
    name: "HeldRootsUnder",
    payload: [
      valueField(
        "names",
        rows.map(({ names }) => names),
      ),
    ],
    rows,
  });
};
