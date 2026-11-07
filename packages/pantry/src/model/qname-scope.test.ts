/**
 * The codec reads every value of a QName type, an attribute's or an element's text, with the
 * namespace bindings in scope where it stands (shred's `prefix-unbound`), from the value's domain
 * alone: no attribute or element is named, and one check reads both.
 *
 * Oracle: the specification turned into a checker. XML Schema 1.0 Part 2, §3.2.18: "The mapping
 * between literals in the lexical space and values in the value space of QName requires a
 * namespace declaration to be in scope for the context in which QName is used", so a QName whose
 * prefix nothing in scope binds has no value, and a list of QNames none when any of its items has
 * none; an unprefixed QName always has one, and `xml` is bound by definition (Namespaces in XML
 * 1.0, §3). Each case states the prefixes it declares, and where, and its verdict follows from
 * that table, never from the code under test.
 *
 * Bound: every site of a QName domain the grammar holds, exhausted: each (version, kind, attribute)
 * it admits under one, but `xsi:type`, which the codec reads before any attribute
 * (`type-unresolved`); each (version, kind) whose text is one (`TextDomain`); and each (version,
 * type) whose text is one (`TypeText`), on a foreign element that type's `xsi:type` governs. Each
 * is read against every case of {@link cases}: a prefix bound on the element, bound on its root,
 * bound nowhere, `xml`, unprefixed, and, for a list, one item of several unbound. The element
 * stands at the end of the shortest chain of admitted kinds from a document root, which shred reads
 * without asking for any other attribute or child. Kept from the lexical box: SSML `token`'s
 * `role="a:b"` with no binding of `a`, refused in both versions (GEN-B, 2026-11-07).
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";

import { schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { expandedNameOf } from "#pantry/grammar/xsi.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { xsiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The composed grammar.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The grammar shred reads through.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * One case: the value, the prefixes the element itself declares and those its root declares, and
 * whether the value has a value by §3.2.18, stated by the case, not computed.
 */
interface Case {
  readonly name: string;
  readonly onElement: readonly string[];
  readonly onRoot: readonly string[];
  readonly resolves: boolean;
  readonly value: string;
}

/**
 * The cases every QName attribute is read with; `list` cases only for a list of QNames.
 */
const cases: readonly (Case & { readonly list: boolean })[] = [
  { list: false, name: "unprefixed", onElement: [], onRoot: [], resolves: true, value: "a" },
  {
    list: false,
    name: "bound on the element",
    onElement: ["p"],
    onRoot: [],
    resolves: true,
    value: "p:a",
  },
  {
    list: false,
    name: "bound on the root",
    onElement: [],
    onRoot: ["p"],
    resolves: true,
    value: "p:a",
  },
  {
    list: false,
    name: "bound nowhere (kept: a:b)",
    onElement: [],
    onRoot: [],
    resolves: false,
    value: "a:b",
  },
  {
    list: false,
    name: "another prefix bound",
    onElement: ["q"],
    onRoot: [],
    resolves: false,
    value: "p:a",
  },
  {
    list: false,
    name: "xml, bound by definition",
    onElement: [],
    onRoot: [],
    resolves: true,
    value: "xml:a",
  },
  {
    list: false,
    name: "padded and unbound",
    onElement: [],
    onRoot: [],
    resolves: false,
    value: " p:a\t",
  },
  {
    list: true,
    name: "every item bound",
    onElement: ["p"],
    onRoot: ["q"],
    resolves: true,
    value: "p:a q:b c",
  },
  {
    list: true,
    name: "one item unbound",
    onElement: ["p"],
    onRoot: [],
    resolves: false,
    value: "p:a q:b",
  },
  {
    list: true,
    name: "the last of three unbound",
    onElement: [],
    onRoot: ["p"],
    resolves: false,
    value: "a p:b r:c",
  },
];

/**
 * The namespace a test prefix is bound to.
 *
 * @param prefix - The prefix.
 * @returns A namespace no vocabulary uses.
 */
const namespaceOf = (prefix: string): string => `urn:qname-scope:${prefix}`;

/**
 * Find the shortest chain of admitted kinds from a document root to a kind in a version: each
 * kind's parent in breadth-first order over `Admission`, closed kinds only.
 *
 * @param version - The version.
 * @param target - The kind.
 * @returns The kinds from the root to the target, none where no chain reaches it.
 */
const chainTo = (version: SchemaVersion, target: string): Option.Option<readonly string[]> => {
  const rows = grammar.admission.rows.filter((row) => row.version === version);
  const named = (kind: string) => Option.isSome(grammar.kinds.elementName.lookup({ kind }));
  const parents = new Map<string, string>();
  let frontier = rows
    .filter((row) => row.parent === "document" && named(row.child))
    .map(({ child }) => child);
  for (const root of frontier) {
    parents.set(root, "document");
  }

  while (frontier.length > 0 && !parents.has(target)) {
    const next: string[] = [];
    for (const row of rows) {
      if (frontier.includes(row.parent) && !parents.has(row.child) && named(row.child)) {
        parents.set(row.child, row.parent);
        next.push(row.child);
      }
    }

    frontier = next;
  }

  if (!parents.has(target)) {
    return Option.none();
  }

  const chain = [target];
  for (let at = parents.get(target); at !== undefined && at !== "document"; at = parents.get(at)) {
    chain.unshift(at);
  }

  return Option.some(chain);
};

/**
 * Write namespace declarations of test prefixes.
 *
 * @param prefixes - The prefixes.
 * @returns The declarations, each with its leading space.
 */
const declare = (prefixes: readonly string[]): string =>
  prefixes.map((prefix) => ` xmlns:${prefix}="${namespaceOf(prefix)}"`).join("");

/**
 * Where a site's value stands: an attribute of the chain's last element, that element's text, or
 * the text of a foreign element under it that a type governs, by its `xsi:type`.
 */
type Site =
  | { readonly _tag: "attribute"; readonly name: string }
  | { readonly _tag: "text" }
  | { readonly _tag: "typed"; readonly local: string; readonly namespace: string };

/**
 * The namespace of the foreign element a `typed` site writes, which no vocabulary uses.
 */
const foreignNamespace = "urn:qname-scope:foreign";

/**
 * Write the declaration a prefixed attribute name needs, none for `xml` and an unprefixed name.
 *
 * @param attribute - The attribute's handle.
 * @returns The declaration, with its leading space.
 */
const attributeDeclaration = (attribute: string): string => {
  const prefix = attribute.includes(":") ? attribute.slice(0, attribute.indexOf(":")) : "";
  const namespace = {
    xlink: "http://www.w3.org/1999/xlink",
    xsi: xsiNamespace,
  }[prefix];

  return namespace === undefined ? "" : ` xmlns:${prefix}="${namespace}"`;
};

/**
 * Write the document a case reads: the chain's elements, each in its namespace under a prefix of
 * its own, the root declaring `onRoot`, and the value at its site, beside the declarations
 * `onElement` lists: on the chain's last element for an attribute or its text, on the foreign
 * element for a governed text.
 *
 * @param chain - The kinds from the root to the site's element, or to the foreign element's parent.
 * @param site - Where the value stands.
 * @param drawn - The case.
 * @returns The document's text.
 */
const documentOf = (chain: readonly string[], site: Site, drawn: Case): string => {
  const value = drawn.value.replaceAll("\t", "&#9;");
  const last = chain.length - 1;
  const opened = chain.map((kind, at) => {
    const { local, namespace } = Option.getOrThrow(grammar.kinds.elementName.lookup({ kind }));
    const own = namespace === "" ? "" : ` xmlns:n${String(at)}="${namespace}"`;
    const root = at === 0 ? declare(drawn.onRoot) : "";
    const carried =
      at === last && site._tag === "attribute"
        ? `${declare(drawn.onElement)}${attributeDeclaration(site.name)} ${site.name}="${value}"`
        : "";
    const element = at === last && site._tag === "text" ? declare(drawn.onElement) : "";

    return {
      name: namespace === "" ? local : `n${String(at)}:${local}`,
      start: `${own}${root}${carried}${element}`,
    };
  });
  const inner = ((): string => {
    switch (site._tag) {
      case "attribute": {
        return "";
      }
      case "text": {
        return value;
      }
      case "typed": {
        return `<f:x xmlns:f="${foreignNamespace}" xmlns:xsi="${xsiNamespace}" xmlns:t="${site.namespace}"${declare(drawn.onElement)} xsi:type="t:${site.local}">${value}</f:x>`;
      }
      default: {
        return site satisfies never;
      }
    }
  })();

  return [
    ...opened.map(({ name, start: written }) => `<${name}${written}>`),
    inner,
    ...opened.toReversed().map(({ name }) => `</${name}>`),
  ].join("");
};

/**
 * One site the bound reads: where it stands in a version, the chain it stands at the end of, and
 * whether its domain is a list of QNames.
 */
interface Placed {
  readonly chain: Option.Option<readonly string[]>;
  readonly list: boolean;
  readonly name: string;
  readonly site: Site;
  readonly version: SchemaVersion;
}

/**
 * The parents a foreign element in {@link foreignNamespace} may stand under in a version: the kinds
 * whose content admits the `other` namespace class's foreign kind.
 *
 * @param version - The version.
 * @returns The parents' kinds.
 */
const foreignHosts = (version: SchemaVersion): readonly string[] =>
  grammar.admission.rows
    .filter((row) => row.version === version && row.child === "foreign-element")
    .map(({ parent }) => parent);

/**
 * Whether a closed row's version is one of the schema versions, as every row's is.
 *
 * @param version - The row's version.
 * @returns Whether it is.
 */
const isVersion = (version: string): version is SchemaVersion =>
  schemaVersions.some((held) => held === version);

/**
 * Every site of a QName domain the grammar holds, in both versions.
 *
 * @param qualified - The QName domains, by handle, with whether each is a list.
 * @returns The sites.
 */
const sitesOf = (qualified: ReadonlyMap<string, boolean>): readonly Placed[] => [
  ...grammar.attributes.admission.rows
    .flatMap((row) => (isVersion(row.version) ? [{ ...row, version: row.version }] : []))
    .filter((row) => qualified.has(row.domain) && row.name !== "xsi:type")
    .map((row): Placed => ({
      chain: chainTo(row.version, row.kind),
      list: qualified.get(row.domain) === true,
      name: `${row.kind}@${row.name}`,
      site: { _tag: "attribute", name: row.name },
      version: row.version,
    })),
  ...grammar.attributes.text.rows
    .flatMap((row) => (isVersion(row.version) ? [{ ...row, version: row.version }] : []))
    .filter((row) => qualified.has(row.domain))
    .map((row): Placed => ({
      chain: chainTo(row.version, row.kind),
      list: qualified.get(row.domain) === true,
      name: `${row.kind} text`,
      site: { _tag: "text" },
      version: row.version,
    })),
  ...grammar.attributes.typeText.rows
    .flatMap((row) => (isVersion(row.version) ? [{ ...row, version: row.version }] : []))
    .filter((row) => qualified.has(row.domain))
    .flatMap((row) =>
      Option.toArray(expandedNameOf(row.governs)).map((type): Placed => ({
        chain: Option.firstSomeOf(
          foreignHosts(row.version).map((host) => chainTo(row.version, host)),
        ),
        list: qualified.get(row.domain) === true,
        name: `xsi:type ${row.governs} text`,
        site: { _tag: "typed", ...type },
        version: row.version,
      })),
    ),
];

describe("the codec's QName values", () => {
  it.effect(
    "refuse a value exactly where §3.2.18 gives one of its QNames no value, at every QName site the grammar holds, attribute and text alike",
    () =>
      Effect.gen(function* readEveryCase() {
        const qualified = new Map(
          grammar.attributes.domains.flatMap(({ handle, qualified: held }) =>
            Option.toArray(held).map((how) => [handle, how === "QNames"] as const),
          ),
        );
        const sites = sitesOf(qualified);
        const unplaced: string[] = [];
        const wrong: string[] = [];
        const read = new Set<Site["_tag"]>();

        for (const { chain, list, name, site, version } of sites) {
          if (Option.isNone(chain)) {
            unplaced.push(`${version} ${name}`);
          } else {
            for (const drawn of cases.filter((held) => list || !held.list)) {
              const text = documentOf(chain.value, site, drawn);
              const document = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
              const outcome = yield* Effect.result(shred(document, version, shredGrammar));
              const refused =
                Result.isFailure(outcome) &&
                outcome.failure._tag === "UnmodeledVocabulary" &&
                outcome.failure.reason === "prefix-unbound";
              read.add(site._tag);
              if (refused === drawn.resolves || (Result.isFailure(outcome) && !refused)) {
                wrong.push(
                  `${version} ${name} ${drawn.name} ${JSON.stringify(drawn.value)}: ${
                    Result.isFailure(outcome) ? outcome.failure.message : "read"
                  }`,
                );
              }
            }
          }
        }

        assert.deepStrictEqual(
          [...read].toSorted(),
          ["attribute", "typed"],
          "an attribute and a governed text of a QName type were read; no kind's own text is one",
        );
        assert.deepStrictEqual(unplaced, [], "every QName site stands in a document");
        assert.deepStrictEqual(
          wrong,
          [],
          "the codec refuses exactly the values §3.2.18 gives none",
        );
      }),
    { timeout: 120_000 },
  );
});
