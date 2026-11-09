import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage, requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import { indexed, roster } from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import {
  expandedText,
  heldRootsUnder,
  patternLiteral,
  textsPattern,
  vocabularyNamespacesPattern,
} from "#pantry/grammar/names.ts";
import { expandedNameOf } from "#pantry/grammar/xsi.ts";
import { globalKinds } from "#pantry/vocab/inventory/vocabularies.ts";
import {
  namespaceClassOf,
  namespaceNameOf,
  vocabularyNamespaces,
  xsNamespace,
} from "#pantry/vocab/namespaces.ts";
import { foreignRoots, schemaSets } from "#pantry/vocab/open.ts";
import { admittedOf } from "#pantry/test/indexes.ts";

/**
 * The composed grammar of production. It is composed once, when the module loads.
 */
const grammar = await Effect.runPromise(Effect.fromResult(composed()));

/**
 * How long one exhaustive search here may take: each walks a few hundred cases of rows the module
 * already holds, each a few hundred regex tests, in well under a second, so a minute only bounds a
 * hang.
 */
const caseHang = Duration.minutes(1);

/**
 * How long each search may run: about ten times the slowest, a few seconds, measured on
 * 2026-11-06 at a load average of about 25.
 * Measured 2026-11-07: 1.2 s at a load average of 63 to 73.
 */
const searchTimeout = 120_000;

/**
 * Whether a pattern of grizzle's grammar matches a text, as `Compute.matches` reads it: some match
 * of the pattern, under ECMAScript's `u` flag, is in the text.
 *
 * @param pattern - The pattern.
 * @param text - The text.
 * @returns Whether it matches.
 */
const matches = (pattern: string, text: string): boolean => new RegExp(pattern, "u").test(text);

/**
 * Every text over an alphabet of every character the pattern grammar gives a meaning to, and an
 * ordinary letter, a digit and `-`, up to two characters long: the box {@link patternLiteral}'s
 * law is exhausted in.
 */
const literalBox: readonly string[] = (() => {
  const alphabet = [
    "^",
    "$",
    "\\",
    ".",
    "*",
    "+",
    "?",
    "(",
    ")",
    "[",
    "]",
    "{",
    "}",
    "|",
    "/",
    "a",
    "0",
    "-",
  ];
  const ones = alphabet;
  const twos = alphabet.flatMap((first) => alphabet.map((second) => `${first}${second}`));

  return ["", ...ones, ...twos];
})();

describe("patternLiteral", () => {
  it.effect(
    "matches its text exactly and no other, anchored, over every text of at most 2 characters of the grammar's syntax characters, a letter, a digit and -",
    (ctx) =>
      // Oracle: ECMAScript's RegExp under the u flag, the grammar grizzle's patterns are read in,
      // against string equality.
      // Bound: every text of at most 2 characters over 18 characters, each against every other.
      searched(
        ctx,
        exhaust(
          {
            box: `every text of at most 2 characters over 18, ${literalBox.length} texts, each against all`,
            caseHang,
            coverage: requiredInSpace<"empty" | "syntax">(["empty", "syntax"]),
            generator: int(0, literalBox.length - 1),
            limit: literalBox.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "string equality" },
            suite: "grammar/names/literal",
          },
          (index, c) =>
            Effect.sync(() => {
              const text = Arr.getUnsafe(literalBox, index);
              c.note(text === "" ? "empty" : "syntax");

              const pattern = `^${patternLiteral(text)}$`;
              const mismatched = literalBox.filter(
                (other) => matches(pattern, other) !== (other === text),
              );

              assert.deepStrictEqual(mismatched, [], pattern);
            }),
        ),
      ),
    searchTimeout,
  );
});

/**
 * Each (version, parent) family whose content admits a foreign element, with the expanded names of
 * the element kinds it admits there: the oracle's own reading of the admission maps, spelled out,
 * and `ElementName`.
 */
const foreignHosts: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const hosts = new Map<string, Set<string>>();
  const foreign = new Set<string>();
  for (const { child, parent, version } of admittedOf(
    grammar.content.contentModelOf,
    grammar.content.admissionIn,
  )) {
    const at = `${version} ${parent}`;
    const names = hosts.get(at) ?? new Set<string>();
    for (const name of Option.toArray(grammar.kinds.elementName.lookup({ kind: child }))) {
      names.add(expandedText(name));
    }

    hosts.set(at, names);
    if (isForeignKind(child)) {
      foreign.add(at);
    }
  }

  return new Map([...hosts].filter(([at]) => foreign.has(at)));
})();

/**
 * Every element kind's expanded name, the names a pattern is tried on.
 */
const everyName: readonly string[] = [
  ...new Set(grammar.kinds.elementName.rows.map((name) => expandedText(name))),
];

describe("KindByNameUnder", () => {
  it.effect(
    "matches exactly the expanded names its parent admits: every family's pattern against every element kind's name, each admitted local under another namespace, and each admitted name extended by a letter",
    (ctx) =>
      // Oracle: the admission relation and ElementName read directly, as a set of texts, with
      // ECMAScript's RegExp under the u flag as the pattern's reading.
      // Bound: every row (each family that admits a foreign element), against every element
      // kind's name; the named invalid variants are a name the parent does not admit, an admitted
      // local under a namespace it is not admitted in, and an admitted name with a letter added.
      searched(
        ctx,
        exhaust(
          {
            box: `every KindByNameUnder row, ${grammar.kindByNameUnder.rows.length}, against all ${everyName.length} element names`,
            caseHang,
            coverage: noCoverage,
            generator: int(0, grammar.kindByNameUnder.rows.length - 1),
            limit: grammar.kindByNameUnder.rows.length,
            literal: Formatter.format,
            oracle: { kind: "second-implementation", name: "Admission and ElementName as texts" },
            suite: "grammar/names/kind-by-name-under",
          },
          (index) =>
            Effect.sync(() => {
              const { names, parent, version } = Arr.getUnsafe(grammar.kindByNameUnder.rows, index);
              const admitted = foreignHosts.get(`${version} ${parent}`) ?? new Set<string>();
              const elsewhere = [...admitted].map((name) =>
                name.replace(/^[^}]*\}/u, "urn:example:other}"),
              );
              const extended = [...admitted].map((name) => `${name}x`);
              const wrong = [
                ...everyName.filter((name) => matches(names, name) !== admitted.has(name)),
                ...[...elsewhere, ...extended].filter(
                  (name) => !admitted.has(name) && matches(names, name),
                ),
              ];

              assert.deepStrictEqual(wrong, [], `${version} ${parent}`);
            }),
        ),
      ),
    searchTimeout,
  );
});

/**
 * Each vocabulary's name, by its namespace.
 */
const vocabularyOf: ReadonlyMap<string, string> = new Map(
  Object.entries(vocabularyNamespaces).map(([name, { namespace }]) => [namespace, name] as const),
);

/**
 * Whether an element of a namespace may name a type of another in its `xsi:type`, read off spec
 * reading 81's schema sets alone: a type of XML Schema's namespace everywhere; else where a set
 * lists the type's vocabulary and the element's, or the element's namespace is no vocabulary's.
 *
 * @param parent - The element's namespace.
 * @param type - The type's namespace.
 * @returns Whether its document's schema set holds the type.
 */
const availableBySets = (parent: string, type: string): boolean => {
  if (type === xsNamespace) {
    return true;
  }

  const held = vocabularyOf.get(parent);
  const other = vocabularyOf.get(type);

  return Object.values(schemaSets).some(
    (set: readonly string[]) =>
      other !== undefined && set.includes(other) && (held === undefined || set.includes(held)),
  );
};

/**
 * The parent namespaces a type's pattern is tried under: every vocabulary's, XML Schema's, none,
 * and one no vocabulary has.
 */
const parentNamespaces: readonly string[] = [
  ...Object.values(vocabularyNamespaces).map(({ namespace }) => namespace),
  xsNamespace,
  "",
  "urn:example:other",
];

describe("TypeAvailable", () => {
  it.effect(
    "with the vocabulary namespaces, admits a type under exactly the parent namespaces whose schema sets hold it: every type under every vocabulary's namespace, XML Schema's, none and another",
    (ctx) =>
      // Oracle: spec reading 81's schema sets (`schemaSets`), read directly.
      // Bound: every TypeName handle, against every parent namespace listed.
      searched(
        ctx,
        exhaust(
          {
            box: `every TypeName handle, ${grammar.typeAvailable.rows.length}, under ${parentNamespaces.length} namespaces`,
            caseHang,
            coverage: requiredInSpace<"vocabulary" | "xs">(["vocabulary", "xs"]),
            generator: int(0, grammar.typeAvailable.rows.length - 1),
            limit: grammar.typeAvailable.rows.length,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "spec reading 81's schema sets" },
            suite: "grammar/names/type-available",
          },
          (index, c) =>
            Effect.sync(() => {
              const { namespaces, type } = Arr.getUnsafe(grammar.typeAvailable.rows, index);
              const typeNamespace = Option.match(expandedNameOf(type), {
                onNone: () => "",
                onSome: ({ namespace }) => namespace,
              });
              const vocabularyType = typeNamespace === xsNamespace ? "xs" : "vocabulary";

              c.note(vocabularyType);

              const vocabularies = vocabularyNamespacesPattern(
                Object.values(vocabularyNamespaces).map(({ namespace }) => namespace),
              );
              const wrong = parentNamespaces.filter(
                (parent) =>
                  (matches(namespaces, parent) || !matches(vocabularies, parent)) !==
                  availableBySets(parent, typeNamespace),
              );

              assert.deepStrictEqual(wrong, [], type);
            }),
        ),
      ),
    searchTimeout,
  );

  it("names every vocabulary's namespace, and no other text, in the vocabulary pattern", () => {
    // Oracle: the vocabularies' namespaces as a set of texts.
    const namespaces: readonly string[] = Object.values(vocabularyNamespaces).map(
      ({ namespace }) => namespace,
    );
    const pattern = vocabularyNamespacesPattern(namespaces);

    assert.deepStrictEqual(
      [...namespaces, xsNamespace, "", "urn:example:other", `${namespaces[0] ?? ""}x`].filter(
        (text) => matches(pattern, text) !== namespaces.includes(text),
      ),
      [],
    );
    assert.strictEqual(textsPattern([]), "^$");
    assert.isFalse(matches(textsPattern([]), expandedText({ local: "a", namespace: "" })));
  });
});

describe("HeldRootsUnder", () => {
  it("is keyed by the strictly held families, and names exactly the reading-6 roots their strict wildcards find in their documents' schema sets", () => {
    // Oracle: StrictlyHeld, spec reading 6's roots (`foreignRoots`), the global kinds and spec
    // reading 81's schema sets (`schemaSets`), each read directly; the expanded names as texts.
    // Bound: every strictly held family, against every root of each version.
    const held = Map.groupBy(
      grammar.content.strictlyHeld.rows,
      ({ parent, version }): string => `${version} ${parent}`,
    );
    const namespaceOf = (kind: string): string =>
      Option.match(grammar.kinds.elementName.lookup({ kind }), {
        onNone: () => "",
        onSome: ({ namespace }) => namespace,
      });
    const wrong: string[] = [];
    for (const { names, parent, version } of grammar.heldRootsUnder.rows) {
      const classes = new Set((held.get(`${version} ${parent}`) ?? []).map(({ child }) => child));
      const own = namespaceOf(parent);
      for (const { kind, versions } of globalKinds) {
        if (foreignRoots.has(kind) && versions.includes(version)) {
          const namespace = namespaceOf(kind);
          const expected =
            classes.has(
              foreignKinds[namespaceClassOf(namespaceNameOf(namespace), namespaceNameOf(own))],
            ) &&
            Object.values(schemaSets).some(
              (set: readonly string[]) =>
                set.includes(vocabularyOf.get(namespace) ?? "") &&
                set.includes(vocabularyOf.get(own) ?? ""),
            );
          const text = expandedText({ local: kind.slice(kind.indexOf(":") + 1), namespace });
          if (matches(names, text) !== expected) {
            wrong.push(`${version} ${parent} ${kind}`);
          }
        }
      }
    }

    assert.deepStrictEqual(
      new Set(grammar.heldRootsUnder.rows.map(({ parent, version }) => `${version} ${parent}`)),
      new Set(held.keys()),
    );
    assert.deepStrictEqual(wrong, []);
    assert.isTrue(
      grammar.heldRootsUnder.rows.some(
        ({ names, parent }) => parent === "drd:accessForAllResource" && names !== "^$",
      ),
    );
  });

  it("names a root under a strictly held family only in the versions that declare it, over every version set of two roots", () => {
    // Oracle: a naive model, a root is held in a version exactly when its versions include it.
    // Bound: two roots, each declared in every subset of the two versions, 16 rosters, exhausted;
    // one strictly held family in each version, whose wildcard reads every namespace.
    const subsets: readonly (readonly SchemaVersion[])[] = [
      [],
      ["3.0.0"],
      ["3.0.1"],
      ["3.0.0", "3.0.1"],
    ];
    const versions = roster("SchemaVersion", schemaVersions);
    const kinds = roster("NodeKind", ["host", "foreign-element"]);
    const wrong: string[] = [];
    for (const first of subsets) {
      for (const second of subsets) {
        const roots = [
          { kind: "a:r", local: "r", namespace: "urn:a", versions: first },
          { kind: "b:s", local: "s", namespace: "urn:b", versions: second },
        ];
        const relation = heldRootsUnder({
          classOf: () => "foreign-element",
          held: schemaVersions.map((version) => ({
            child: "foreign-element",
            parent: "host",
            version,
          })),
          kinds,
          namespaceOf: () => namespaceNameOf("urn:host"),
          reads: () => true,
          roots,
          versions,
        });
        for (const version of schemaVersions) {
          const names = Option.getOrElse(
            Option.map(indexed(relation).lookup({ parent: "host", version }), (row) => row.names),
            () => "(none)",
          );
          for (const { local, namespace, versions: declared } of roots) {
            const text = expandedText({ local, namespace });
            if (matches(names, text) !== declared.includes(version)) {
              wrong.push(`${version}: ${text} declared in {${declared.join(", ")}}, ${names}`);
            }
          }

          if (matches(names, expandedText({ local: "s", namespace: "urn:a" }))) {
            wrong.push(`${version}: a name no root has, ${names}`);
          }
        }
      }
    }

    assert.deepStrictEqual(wrong, []);
  });
});
