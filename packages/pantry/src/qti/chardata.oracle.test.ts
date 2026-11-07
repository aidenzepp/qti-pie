/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents spell the XML encoding labels (`UTF-8`) as crust's reader reports them. */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element, int, map } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { keep, swarm } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child } from "@qti-pie/crust/tree.ts";
import {
  AttributeSlot,
  Flag,
  grammar,
  HeldRootsUnder,
  KindByNameUnder,
  KindNamespace,
  NodeKind,
  nonElementKinds,
  Position,
  ResourceType,
  SchemaVersion,
  StrictlyHeld,
  TypeAvailable,
  TypeName,
  vocabularyNamespacePattern,
} from "#pantry/grammar/install.ts";
import { foreignKinds, isForeignKind } from "#pantry/grammar/kinds.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { documentFamily, flatten } from "#pantry/model/xdm.ts";
import type { XdmChild, XdmDocument } from "#pantry/model/xdm.ts";
import type { Composed } from "#pantry/model/composed.ts";
import {
  chardataLaws,
  Comment,
  Doctype,
  Document,
  EntryPath,
  entityRefChars,
  Namespace,
  OpenElementName,
  Pi,
  textChars,
  whitespaceChars,
  XmlStandalone,
} from "#pantry/qti/chardata.ts";
import { keyTextBytes, namespaceBytes, prefixBytes, utf8Length } from "#pantry/qti/limits.ts";
import { Node, nodeTree } from "#pantry/qti/node.ts";
import { caseHang, featuresOf, idOf, searchTimeout, xdmDocument } from "#pantry/test/gen/xdm.ts";
import type { XdmFeature } from "#pantry/test/gen/xdm.ts";
import { lawNames } from "#pantry/test/oracle.ts";
import { isUriReference } from "#pantry/test/uri-reference.ts";
import { mathmlNamespace, namespaceClassOf } from "#pantry/vocab/namespaces.ts";

/**
 * A text field's pattern compiled as grizzle reads it: `str.regex`'s grammar is ECMAScript's under
 * the field's own flags, so JavaScript's `RegExp` decides exactly the language PostgreSQL's CHECK
 * holds the column to.
 *
 * @param field - The field.
 * @param field.desc - Its description, the pattern's source and flags.
 * @returns The compiled pattern.
 */
const patternOf = (field: { readonly desc: { readonly flags: string; readonly source: string } }) =>
  new RegExp(field.desc.source, field.desc.flags);

/**
 * The patterns of `Node.chars` by kind that the arm checks match, under `Compute.matches`'s flags,
 * `u`.
 */
const charsPatterns = {
  entityRef: new RegExp(entityRefChars, "u"),
  text: new RegExp(textChars, "u"),
  ws: new RegExp(whitespaceChars, "u"),
} as const;

/**
 * The trees the rows property draws: the one generator's, over production's composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The features a search over generated trees must reach: every kind of node the document layer
 * stores a row or characters for, a foreign element, and a namespace declaration.
 */
const reached = required<XdmFeature>(
  ["wildcard", "text", "ws", "comment", "pi", "entityRef", "namespace", "doctype"],
  { cases: 300, sense: notesOnly },
);

/**
 * Count a tree's nodes by kind, walking the tree itself: an independent count, which reads none of
 * the rows `flatten` writes.
 *
 * @param document - The tree.
 * @returns How many nodes of each kind it holds, the document node included.
 */
const kindsIn = (document: XdmDocument<Composed>): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>([["document", 1]]);
  const add = (kind: string) => counts.set(kind, (counts.get(kind) ?? 0) + 1);
  const stack: XdmChild<Composed>[] = [];
  for (const child of documentFamily(document)) {
    if (child._tag === "element") {
      stack.push(child);
    } else {
      add(child._tag);
    }
  }

  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    add(next._tag === "element" ? next.kind : next._tag);
    if ("children" in next) {
      stack.push(...next.children);
    }
  }

  return counts;
};

/**
 * Key a list of rows by a key of each, refusing a repeat: rows-first's keyed set, where two rows of
 * one key are the key law's breach.
 *
 * @param rows - The rows.
 * @param keyOf - The text of a row's key.
 * @returns The rows by key; the test fails on a repeated key.
 */
const keyed = <R>(rows: readonly R[], keyOf: (row: R) => string): ReadonlyMap<string, R> => {
  const byKey = new Map<string, R>();
  for (const row of rows) {
    const at = keyOf(row);
    assert.isFalse(byKey.has(at), `two rows hold the key ${at}`);
    byKey.set(at, row);
  }

  return byKey;
};

/**
 * The kinds that are no element, as a set of handles.
 */
const nonElements: ReadonlySet<string> = new Set<string>(nonElementKinds);

/**
 * The namespace an element of each kind is written in, `KindNamespace`'s rows as installed.
 */
const kindNamespace: ReadonlyMap<string, string> = new Map(
  KindNamespace.rows.map(({ kind, namespace }) => [kind, namespace]),
);

/**
 * `KindByNameUnder`'s patterns as installed, by `<version> <parent>`, each compiled under
 * `Compute.matches`'s flags, `u`, so JavaScript's `RegExp` decides what PostgreSQL's `~` does.
 */
const namesUnder: ReadonlyMap<string, RegExp> = new Map(
  KindByNameUnder.rows.map(({ names, parent, version }) => [
    `${version} ${parent}`,
    new RegExp(names, "u"),
  ]),
);

/**
 * `TypeAvailable`'s patterns as installed, by type.
 */
const typesAvailable: ReadonlyMap<string, RegExp> = new Map(
  TypeAvailable.rows.map(({ namespaces, type }) => [type, new RegExp(namespaces, "u")]),
);

/**
 * `StrictlyHeld`'s rows as installed, each `<version> <parent> <child>`.
 */
const strictlyHeld: ReadonlySet<string> = new Set(
  StrictlyHeld.rows.map(({ child, parent, version }) => `${version} ${parent} ${child}`),
);

/**
 * `HeldRootsUnder`'s patterns as installed, by `<version> <parent>`.
 */
const heldRootsUnder: ReadonlyMap<string, RegExp> = new Map(
  HeldRootsUnder.rows.map(({ names, parent, version }) => [
    `${version} ${parent}`,
    new RegExp(names, "u"),
  ]),
);

/**
 * The pattern of every vocabulary's namespace, as `XsiType_available` reads it.
 */
const vocabularies = new RegExp(vocabularyNamespacePattern, "u");

/**
 * A foreign element's name row with the fields of its node the checks read.
 */
interface ForeignRow {
  readonly governs: string;
  readonly kind: string;
  readonly local: string;
  readonly namespace: string;
  readonly parentKind: string;
  readonly parentNamespace: string;
  readonly prefix: string;
  readonly version: string;
}

/**
 * Decide whether a foreign element's row meets `OpenElementName`'s `Foreign_element_class`: its
 * namespace is its class's against its parent's, and a parent of a kind is read in that kind's.
 *
 * @param row - The element's name row and its node's fields.
 * @returns Whether it meets the check.
 */
const classHolds = (row: ForeignRow): boolean => {
  const own = row.namespace !== "" && row.namespace === row.parentNamespace;
  const other = row.namespace !== "" && row.namespace !== row.parentNamespace;
  const classed =
    (row.kind === "no-namespace-element" && row.namespace === "") ||
    (row.kind === "own-namespace-element" && own) ||
    (row.kind === "foreign-element" && other);

  return (
    classed &&
    (isForeignKind(row.parentKind) || row.parentNamespace === kindNamespace.get(row.parentKind))
  );
};

/**
 * Decide whether a foreign element's row meets `Strictly_held`: it is no strictly held kind, it has
 * a governing type, or its expanded name is a root `HeldRootsUnder` names under its parent.
 *
 * @param row - The element's name row and its node's fields.
 * @returns Whether it meets the check.
 */
const heldHolds = (row: ForeignRow): boolean =>
  !isForeignKind(row.kind) ||
  !strictlyHeld.has(`${row.version} ${row.parentKind} ${row.kind}`) ||
  row.governs !== "none" ||
  heldRootsUnder.get(`${row.version} ${row.parentKind}`)?.test(`${row.namespace}}${row.local}`) ===
    true;

/**
 * Judge a foreign element by the checks `chardata.ts` states over its row and its node, each term
 * read as PostgreSQL reads it: a closed read of a key no row holds is null, which a CHECK's
 * `IS TRUE` refuses, and a pattern is matched as `RegExp` under the `u` flag.
 *
 * @param row - The element's name row and its node's fields.
 * @returns The checks it breaks, each `<relation>.<name>`, in the order `chardataLaws` states them.
 */
const brokenChecks = (row: ForeignRow): readonly string[] => {
  const names = namesUnder.get(`${row.version} ${row.parentKind}`);
  const types = typesAvailable.get(row.governs);
  const typed =
    types !== undefined &&
    (types.test(row.parentNamespace) || !vocabularies.test(row.parentNamespace));

  return [
    ...(classHolds(row) ? [] : ["OpenElementName.Foreign_element_class"]),
    ...(row.kind !== "no-namespace-element" || row.prefix === ""
      ? []
      : ["Node.Foreign_element_class"]),
    ...(names !== undefined && !names.test(`${row.namespace}}${row.local}`)
      ? []
      : ["OpenElementName.OpenElementName_canonical"]),
    ...(typed ? [] : ["OpenElementName.XsiType_available"]),
    ...(heldHolds(row) ? [] : ["OpenElementName.Strictly_held"]),
  ];
};

/**
 * The XML productions each `Comment`, `Pi` and text field restates, read off crust's reader: a
 * value is admitted when the reader reads a document that writes it and gives the value back
 * unchanged.
 */
type Production = "comment" | "piTarget" | "piData" | "characters" | "entityName";

/**
 * Read a document through crust's reader and give back its root element's children, none when the
 * reader refuses it.
 *
 * @param xml - The document's text.
 * @returns The root's children, or none.
 */
const rootChildrenOf = (xml: string): Option.Option<readonly Child[]> =>
  Result.match(Effect.runSync(Effect.result(readXml(new TextEncoder().encode(xml)))), {
    onFailure: () => Option.none(),
    onSuccess: (read) => Option.some(read.root.children),
  });

/**
 * Write a run of characters as an element's content, escaping what markup would read: `&`, `<`, `>`
 * and the carriage return, which line-end handling would otherwise rewrite.
 *
 * @param value - The characters.
 * @returns Their escaped spelling.
 */
const escaped = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r", "&#13;");

/**
 * Decide whether crust's reader reads a document's root as holding one child, and that child as
 * expected.
 *
 * @param xml - The document's text.
 * @param holds - Whether the one child is the one expected.
 * @returns Whether the reader reads the document and its root holds that one child.
 */
const readsOnly = (xml: string, holds: (child: Child) => boolean): boolean =>
  Option.exists(rootChildrenOf(xml), (children) => children.length === 1 && children.every(holds));

/**
 * Decide with crust's reader whether a value is what an XML production admits, by writing it where
 * the production stands and reading it back.
 *
 * - `comment`: `<!--value-->`, read back as that comment;
 * - `piTarget`: `<?value d?>`, read back as an instruction of that target;
 * - `piData`: `<?t value?>`, read back as that data;
 * - `characters`: the escaped value as content, read back as that text;
 * - `entityName`: `&value;` under an external subset, read back as a reference of that name.
 *
 * @param production - The production.
 * @param value - The value.
 * @returns Whether the reader reads it back as written.
 */
const readsBack = (production: Production, value: string): boolean => {
  switch (production) {
    case "comment": {
      return readsOnly(`<r><!--${value}--></r>`, (c) => c.kind === "comment" && c.text === value);
    }
    case "piTarget": {
      return readsOnly(`<r><?${value} d?></r>`, (c) => c.kind === "pi" && c.target === value);
    }
    case "piData": {
      return readsOnly(`<r><?t ${value}?></r>`, (c) => c.kind === "pi" && c.data === value);
    }
    case "characters": {
      return readsOnly(`<r>${escaped(value)}</r>`, (c) => c.kind === "text" && c.value === value);
    }
    case "entityName": {
      return readsOnly(
        `<!DOCTYPE r SYSTEM "r.dtd"><r>&${value};</r>`,
        (c) => c.kind === "entityRef" && c.name === value,
      );
    }
    default: {
      return production satisfies never;
    }
  }
};

/**
 * One case of the productions box: a production and a value of at most its length, over its
 * alphabet.
 */
interface ProductionCase {
  readonly production: Production;
  readonly value: string;
}

/**
 * A box of values: the characters a value is drawn from and its greatest length.
 */
interface Box {
  readonly alphabet: readonly [string, ...string[]];
  readonly max: number;
}

/**
 * Each production's box: an alphabet of the characters that decide it and the longest value drawn.
 * Every alphabet holds a plain letter, and each the delimiters and boundary characters of its
 * production: `-` and `>` for a comment, `?`, `>` and a space for instruction data, the letters of
 * `xml`, a digit, `-`, `.` and `:` for a target, XML whitespace, `<`, `&`, U+0001 and U+FFFE, which
 * are no `Char`, for text.
 */
const boxes: Readonly<Record<Production, Box>> = {
  characters: { alphabet: ["a", " ", "\t", "\n", "\r", "<", "&", "\u{1}", "\u{FFFE}"], max: 3 },
  comment: { alphabet: ["a", "-", ">", " "], max: 5 },
  entityName: { alphabet: ["a", "1", "-", ".", "\u{B7}"], max: 3 },
  piData: { alphabet: ["a", "?", ">", " "], max: 5 },
  piTarget: { alphabet: ["x", "X", "m", "M", "l", "L", "a", "1", "-", ":"], max: 4 },
};

/**
 * The number of cases a box holds: every value from length 0 to its bound over its alphabet.
 *
 * @param box - The box.
 * @param box.alphabet - Its alphabet.
 * @param box.max - Its longest value.
 * @returns The count.
 */
const boxSize = ({ alphabet, max }: Box): number =>
  Array.from({ length: max + 1 }, (_, length) => alphabet.length ** length).reduce(
    (sum, cases) => sum + cases,
    0,
  );

/**
 * The productions box as one generator: a production, a length within its bound, and that many
 * characters of its alphabet, so the enumeration visits every value of every box once.
 */
const productionCases: Gen<ProductionCase> = (source) => {
  const production = source.draw(
    element(["comment", "piTarget", "piData", "characters", "entityName"] as const),
  );
  const { alphabet, max } = boxes[production];
  const length = source.draw(int(0, max));
  const characters = source.draw(array(element(alphabet), { max: length, min: length }));

  return { production, value: characters.join("") };
};

/**
 * How long an exhaustive box may run: the productions box's 14,817 cases each read one small
 * document through crust's reader, and the bounds box's 300 match texts of up to 649 code points
 * against patterns of counted repetitions, which JavaScript's backtracking engine tries split by
 * split.
 * Measured 2026-11-07: 9.6 s at a load average of 63 to 73, the slowest box.
 */
const boxTimeout = 120_000;

/**
 * One case of the bounds box: a text of a length at or around a bound, its first character and the
 * character every later one repeats.
 */
interface BoundCase {
  readonly fill: string;
  readonly first: string;
  readonly length: number;
}

/**
 * Write the code-point counts at which a text of one-byte or four-byte characters straddles a byte
 * bound: each side of the bound over one byte a character and over four.
 *
 * @param bytes - The bound, in UTF-8 bytes.
 * @returns The counts.
 */
const straddling = (bytes: number): readonly number[] =>
  [1, 4].flatMap((width) => {
    const edge = Math.floor(bytes / width);

    return [edge - 1, edge, edge + 1];
  });

/**
 * The lengths the bounds box draws, in code points: the short ones, and each side of the byte
 * bounds of a prefix (`prefixBytes`), of a foreign namespace (`namespaceBytes`) and of a path
 * (`keyTextBytes`), over one-byte and four-byte characters.
 */
const boundLengths: readonly [number, ...number[]] = [
  0,
  ...new Set([
    1,
    2,
    ...straddling(prefixBytes),
    ...straddling(namespaceBytes),
    ...straddling(keyTextBytes),
  ]),
];

/**
 * The characters the bounds box draws: a letter, the path separator, a character of four UTF-8
 * bytes, a line feed, and U+0001, which is no XML `Char`.
 */
const boundCharacters = ["a", "/", "\u{1F600}", "\n", "\u{1}"] as const;

/**
 * The bounds box as one generator: every length of {@link boundLengths} with every first and
 * every later character of {@link boundCharacters}.
 */
const boundCases: Gen<BoundCase> = (source) => ({
  fill: source.draw(element(boundCharacters)),
  first: source.draw(element(boundCharacters)),
  length: source.draw(element(boundLengths)),
});

/**
 * Whether a character is an XML 1.0 `Char`.
 *
 * @param character - One code point.
 * @returns Whether it is.
 */
const isXmlChar = (character: string): boolean => {
  const code = character.codePointAt(0) ?? 0;

  return (
    code === 0x9 ||
    code === 0xa ||
    code === 0xd ||
    (code >= 0x20 && code <= 0xd7_ff) ||
    (code >= 0xe0_00 && code <= 0xff_fd) ||
    (code >= 0x1_00_00 && code <= 0x10_ff_ff)
  );
};

/**
 * Whether one of the box's characters may stand anywhere in an NCName: the letter, and U+1F600,
 * which XML 1.0's `NameStartChar` holds in `[#x10000-#xEFFFF]`; not `/`, a line feed or U+0001.
 *
 * @param character - One of the box's characters.
 * @returns Whether it is an NCName character, the first included.
 */
const isBoxNameChar = (character: string): boolean =>
  character === "a" || character === "\u{1F600}";

/**
 * Whether a value holds a character that is not XML whitespace.
 *
 * @param value - The value.
 * @returns Whether it does.
 */
const holdsNonSpace = (value: string): boolean => {
  for (const character of value) {
    if (!" \t\n\r".includes(character)) {
      return true;
    }
  }

  return false;
};

/**
 * The namespace of QTI 3's assessment vocabulary, `qti-ordering`'s own.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write a test whose one section orders the given children.
 *
 * @param children - `qti-ordering`'s content as written.
 * @returns The test's text.
 */
const orderingTest = (children: string): string =>
  `<qti-assessment-test xmlns="${asi}" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true"><qti-ordering shuffle="true">${children}</qti-ordering><qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * The reading 61 box's variants: the slot's lawful children, four rows each wrong in one field,
 * and the foreign row moved under a strict slot (C13, C44): with no type, and as the root
 * `cp:manifest` under `drd:accessForAllResource`, whose set declares it.
 */
const orderingVariants = [
  "the slot's lawful children",
  "an element in no namespace written with a prefix",
  "a QTI-named element whose name the slot admits",
  "a foreign element governed by a type of another schema set",
  "an own-namespace element stored in no namespace",
  "a foreign element only a strict slot holds, with no type",
  "a held root its set declares, with no type",
] as const;

/**
 * A variant of the reading 61 box.
 */
type OrderingVariant = (typeof orderingVariants)[number];

/**
 * The reading 61 box: each version under each variant.
 */
const orderingCases: readonly [
  { readonly variant: OrderingVariant; readonly version: (typeof SchemaVersion.handles)[number] },
  ...{
    readonly variant: OrderingVariant;
    readonly version: (typeof SchemaVersion.handles)[number];
  }[],
] = (() => {
  const [first, ...rest] = SchemaVersion.handles.flatMap((version) =>
    orderingVariants.map((variant) => ({ variant, version })),
  );
  if (first === undefined) {
    throw new Error("The installed SchemaVersion roster is empty, so reading 61 has no case.");
  }

  return [first, ...rest];
})();

/**
 * A type no element under a QTI parent may name: the first of `TypeAvailable`'s types whose
 * namespaces leave QTI's own out, a type of the content-packaging set.
 */
const otherSetType =
  TypeAvailable.rows.find(({ namespaces }) => !new RegExp(namespaces, "u").test(asi))?.type ??
  assert.fail("TypeAvailable holds no type outside QTI's schema set");

describe("qti/chardata.ts", () => {
  it("builds a scratch schema of Node and the document layer, and names every check by an oracle law, once on each relation it holds of", () => {
    // Oracle: the specification as a checker, the oracle's law names (`src/test/oracle.ts`), each
    // spelled with underscores for its spaces, since a check's name is an identifier.
    const scratch = schema(
      "QtiChardataProbe",
      {
        AttributeSlot,
        Comment,
        Doctype,
        Document,
        Flag,
        HeldRootsUnder,
        KindByNameUnder,
        KindNamespace,
        Namespace,
        Node,
        NodeKind,
        OpenElementName,
        Pi,
        Position,
        ResourceType,
        SchemaVersion,
        StrictlyHeld,
        TypeAvailable,
        TypeName,
        XmlStandalone,
      },
      [nodeTree, ...chardataLaws],
    );
    const checks = chardataLaws.flatMap((law) =>
      law.kind === "check" ? [{ name: law.name, relation: law.relation.name }] : [],
    );
    const named = new Set<string>(lawNames);
    const placed = checks.map(({ name, relation }) => `${relation}.${name}`);

    assert.strictEqual(scratch.statements.length, chardataLaws.length + 1);
    assert.deepStrictEqual(
      checks.filter(({ name }) => !named.has(name.replaceAll("_", " "))),
      [],
    );
    assert.strictEqual(new Set(placed).size, placed.length);
    assert.includeMembers(placed, [
      "Node.Foreign_element_class",
      "OpenElementName.Foreign_element_class",
      "OpenElementName.OpenElementName_canonical",
      "OpenElementName.Strictly_held",
      "OpenElementName.XsiType_available",
    ]);
  });

  it.effect(
    "writes each arm's rows from a generated document as a keyed set: one row per node of its kind, none for any other, every value its field's pattern admits",
    (ctx) =>
      // Oracle: a second implementation, a direct count of each kind over the tree itself, with
      // rows-first's keyed set (no key repeats); the patterns judged by JavaScript's RegExp, which
      // reads `str.regex`'s ECMAScript grammar as grizzle does; the foreign class by
      // `namespaceClassOf` over `KindNamespace`'s installed rows (XML Schema 1.0 Part 1 §3.10.4);
      // and every foreign check of `chardataLaws` (`brokenChecks`) over the installed
      // `KindByNameUnder` and `TypeAvailable` patterns.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree, 300 runs.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "a direct count of each kind over the tree, and the fields' patterns as RegExp",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "qti/chardata-rows",
          },
          ({ document }, c) =>
            Effect.sync(() => {
              c.noteAll(featuresOf(document));

              const rows = flatten(document, idOf);
              const counts = kindsIn(document);
              const kindOf = new Map<string, string>(rows.nodes.map(({ id, kind }) => [id, kind]));
              const ofKind = (kind: string, held: ReadonlyMap<string, unknown>) => {
                assert.strictEqual(held.size, counts.get(kind) ?? 0, `${kind} rows`);
                for (const node of held.keys()) {
                  assert.strictEqual(kindOf.get(node), kind, `the row of ${node}`);
                }
              };

              const comments = keyed(rows.comments, ({ node }) => node);
              const pis = keyed(rows.pis, ({ node }) => node);
              const doctypes = keyed(rows.doctypes, ({ node }) => node);
              ofKind("comment", comments);
              ofKind("pi", pis);
              ofKind("doctype", doctypes);
              for (const { value } of comments.values()) {
                assert.match(value, patternOf(Comment.fields.value));
              }
              for (const { data, target } of pis.values()) {
                assert.match(data, patternOf(Pi.fields.data));
                assert.match(target, patternOf(Pi.fields.target));
              }
              for (const { value } of doctypes.values()) {
                assert.match(value, patternOf(Doctype.fields.value));
              }

              const chars = keyed(
                [
                  ...rows.texts.map(({ node, value }) => ({ chars: value, node })),
                  ...rows.whitespace.map(({ node, value }) => ({ chars: value, node })),
                  ...rows.entityRefs.map(({ name, node }) => ({ chars: `&${name};`, node })),
                ],
                ({ node }) => node,
              );
              for (const kind of ["text", "ws", "entityRef"] as const) {
                const held = new Map([...chars].filter(([node]) => kindOf.get(node) === kind));
                ofKind(kind, held);
                for (const { chars: written } of held.values()) {
                  assert.match(written, charsPatterns[kind]);
                }
              }

              const { document: row } = rows;
              assert.strictEqual(kindOf.get(row.node), "document");
              assert.match(row.charset, patternOf(Document.fields.charset));
              assert.match(row.exportCharset, patternOf(Document.fields.exportCharset));
              assert.match(row.encoding, patternOf(Document.fields.encoding));
              assert.match(row.xmlVersion, patternOf(Document.fields.xmlVersion));
              assert.include(XmlStandalone.handles, row.standalone);
              assert.isTrue(
                row.xmlVersion !== "none" || (row.encoding === "" && row.standalone === "none"),
                "no declaration writes no encoding and no standalone",
              );

              const roots = rows.nodes.filter(
                ({ id, kind, parent }) =>
                  id !== row.node && kindOf.get(parent) === "document" && !nonElements.has(kind),
              );
              assert.deepStrictEqual(
                roots.map(({ kind }) => kind),
                [document.root.kind],
              );

              const declarations = keyed(rows.namespaces, ({ at, node }) => `${node} ${at}`);
              keyed(rows.namespaces, ({ node, prefix }) => `${node} ${prefix}`);
              for (const { prefix, uri } of declarations.values()) {
                assert.match(prefix, patternOf(Namespace.fields.prefix));
                assert.match(uri, patternOf(Namespace.fields.uri));
              }

              const names = keyed(rows.openElementNames, ({ node }) => node);
              const foreign = rows.nodes.filter(({ kind }) => isForeignKind(kind));
              assert.deepStrictEqual(
                foreign.map(({ id }) => id).toSorted(),
                [...names.keys()].toSorted(),
              );

              const parentOf = new Map<string, string>(
                rows.nodes.map(({ id, parent }) => [id, parent]),
              );
              const byId = new Map(rows.nodes.map((held) => [held.id, held] as const));
              for (const { local, namespace, node } of names.values()) {
                assert.match(local, patternOf(OpenElementName.fields.local));
                assert.match(namespace, patternOf(OpenElementName.fields.namespace));
                assert.notStrictEqual(namespace, mathmlNamespace);

                const parent = parentOf.get(node) ?? node;
                const parentKind = kindOf.get(parent) ?? "document";
                const parentNamespace = isForeignKind(parentKind)
                  ? names.get(parent)?.namespace
                  : kindNamespace.get(parentKind);
                assert.isDefined(parentNamespace, `the namespace of ${node}'s parent`);
                assert.strictEqual(
                  foreignKinds[namespaceClassOf(namespace, parentNamespace ?? "")],
                  kindOf.get(node),
                );

                const held = byId.get(node);
                assert.isDefined(held);
                assert.deepStrictEqual(
                  brokenChecks({
                    governs: held.governs,
                    kind: held.kind,
                    local,
                    namespace,
                    parentKind,
                    parentNamespace: parentNamespace ?? "",
                    prefix: held.prefix,
                    version: held.version,
                  }),
                  [],
                  `${node}: {${namespace}}${local} under ${parentKind}`,
                );
              }
            }),
        ),
      ),
    { timeout: searchTimeout },
  );

  it.effect(
    "admits exactly what XML's productions admit: a comment, an instruction's target and data, character data split into text and whitespace, and an entity reference's name",
    (ctx) =>
      // Oracle: a second implementation, crust's reader reading a document that writes each value,
      // which holds Namespaces in XML 1.0 §7 (no colon in an entity name or a target) too.
      // Bound: exhaustive over each production's box (`boxes`): every value of length 0 to 5 over 4
      // characters for a comment and instruction data, 0 to 4 over 10 for a target, 0 to 3 over 9
      // for character data and over 5 for an entity name.
      Effect.gen(function* productions() {
        const limit = Object.values(boxes).reduce((sum, box) => sum + boxSize(box), 0);
        const exhausted = yield* searched(
          ctx,
          exhaust(
            {
              box: "each production's alphabet and length bound (boxes)",
              caseHang,
              coverage: requiredInSpace<`${Production} ${"admitted" | "refused"}`>([
                "comment admitted",
                "comment refused",
                "piTarget admitted",
                "piTarget refused",
                "piData admitted",
                "piData refused",
                "characters admitted",
                "characters refused",
                "entityName admitted",
                "entityName refused",
              ]),
              generator: productionCases,
              limit,
              literal: Formatter.format,
              oracle: { kind: "second-implementation", name: "crust's reader" },
              suite: "qti/chardata-productions",
            },
            ({ production, value }, c) =>
              Effect.sync(() => {
                const xml = readsBack(production, value);
                c.note(`${production} ${xml ? "admitted" : "refused"}`);
                switch (production) {
                  case "comment": {
                    assert.strictEqual(patternOf(Comment.fields.value).test(value), xml);
                    break;
                  }
                  case "piTarget": {
                    assert.strictEqual(patternOf(Pi.fields.target).test(value), xml);
                    break;
                  }
                  case "piData": {
                    assert.strictEqual(patternOf(Pi.fields.data).test(value), xml);
                    break;
                  }
                  case "characters": {
                    assert.strictEqual(charsPatterns.text.test(value), xml && holdsNonSpace(value));
                    assert.strictEqual(
                      charsPatterns.ws.test(value),
                      xml && value !== "" && !holdsNonSpace(value),
                    );
                    break;
                  }
                  case "entityName": {
                    assert.strictEqual(charsPatterns.entityRef.test(`&${value};`), xml);
                    break;
                  }
                  default: {
                    production satisfies never;
                  }
                }
              }),
          ),
        );

        assert.strictEqual(exhausted.cases, limit);
      }),
    { timeout: boxTimeout },
  );

  it.effect(
    "bounds each keyed text field by UTF-8 bytes, as its key's B-tree entry needs, and admits every value of its language within the bound",
    (ctx) =>
      // Oracle: the specification as a checker, each field's contract counted in UTF-8 bytes, which
      // grizzle's `str.bytes` checks beside the pattern: `EntryPath` 1 code point and at most
      // `keyTextBytes` bytes of any character but a leading "/"; a foreign namespace XML `Char`s of
      // at most `namespaceBytes`; a namespace prefix empty or an NCName of at most `prefixBytes`.
      // Bound: exhaustive over the lengths each side of the three bounds over one-byte and
      // four-byte characters, × 5 first characters × 5 later characters.
      Effect.gen(function* bounds() {
        const limit = boundLengths.length * boundCharacters.length ** 2;
        const exhausted = yield* searched(
          ctx,
          exhaust(
            {
              box: "lengths 0, 1, 2 and each side of prefixBytes, namespaceBytes and keyTextBytes over one-byte and four-byte characters, over 5 characters",
              caseHang,
              coverage: requiredInSpace<"path admitted" | "path refused">([
                "path admitted",
                "path refused",
              ]),
              generator: boundCases,
              limit,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "each field's length and characters" },
              suite: "qti/chardata-bounds",
            },
            ({ fill, first, length }, c) =>
              Effect.sync(() => {
                const characters =
                  length === 0 ? [] : [first, ...Array.from({ length: length - 1 }, () => fill)];
                const value = characters.join("");
                const bytes = utf8Length(value);
                const path = length >= 1 && bytes <= keyTextBytes && first !== "/";
                c.note(path ? "path admitted" : "path refused");

                assert.strictEqual(
                  patternOf(EntryPath).test(value) && bytes <= keyTextBytes,
                  path,
                  "path",
                );
                assert.strictEqual(
                  patternOf(OpenElementName.fields.namespace).test(value) &&
                    bytes <= namespaceBytes,
                  bytes <= namespaceBytes && characters.every(isXmlChar),
                  "foreign namespace",
                );
                assert.strictEqual(
                  patternOf(Namespace.fields.prefix).test(value) && bytes <= prefixBytes,
                  length === 0 || (bytes <= prefixBytes && characters.every(isBoxNameChar)),
                  "prefix",
                );
              }),
          ),
        );

        assert.strictEqual(exhausted.cases, limit);
      }),
    { timeout: boxTimeout },
  );

  it("refuses a colon in an entity reference's name at the reader and in its row, as Namespaces in XML 1.0 §7 does", () => {
    // Oracle: the specification as a checker, Namespaces in XML 1.0 §7: "No entity names ... contain
    // any colons". crust's reader refuses `&a:b;` under an external subset as not well-formed, as it
    // holds every entity name to NCName (`@qti-pie/crust/names.ts`); the arm's pattern refuses it
    // too, for a row a direct write could hold.
    assert.isFalse(readsBack("entityName", "a:b"));
    assert.isFalse(charsPatterns.entityRef.test("&a:b;"));
  });

  it.effect(
    "holds the foreign element checks of every QTI-named, no-namespace and foreign element in qti-ordering (upstream's spec reading 61) and of a held root under a strict slot (C13), and breaks the one check each wrong variant names",
    (ctx) =>
      // Oracle: the specification as a checker: upstream's spec reading 61 (`qti-ordering`'s
      // `##any lax` slot, `facets.ts`) admits each child below, shred reads each as its class, and
      // `brokenChecks` judges its row by the checks over the installed patterns: an element in no
      // namespace has no prefix (Namespaces in XML 1.0 §5, §6.2), a name the slot admits is its
      // kind's (XML Schema 1.0 Part 1 §3.3.4 clause 1.1.1), and an `xsi:type` names a type of
      // the document's schema set (reading 81), and a strictly held element has a type unless it is
      // a root its set declares (§3.10.4 clause 2; reading 6). Each other variant edits one field of
      // a lawful row, or moves the foreign row under a strict slot.
      // Bound: each version, the four foreign children of `qti-ordering` written once each, the
      // four wrong variants of its own-namespace, no-namespace and foreign rows, and the two
      // strict-slot variants of its foreign row.
      Effect.gen(function* ordering() {
        const exhausted = yield* searched(
          ctx,
          exhaust(
            {
              box: "each version, the slot's four foreign children, and six variants",
              caseHang: "60 seconds",
              coverage: requiredInSpace<OrderingVariant>([...orderingVariants]),
              generator: element(orderingCases),
              limit: orderingCases.length,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "upstream's spec reading 61, brokenChecks" },
              suite: "qti/chardata-reading-61",
            },
            ({ variant, version }, c) =>
              Effect.gen(function* orderingCase() {
                c.note(variant);

                const read = yield* Effect.orDie(
                  readXml(
                    new TextEncoder().encode(
                      orderingTest(
                        `<qti-variable/><qti-foo/><foo xmlns=""/><f:x xmlns:f="urn:f"/>`,
                      ),
                    ),
                  ),
                );
                const tree = yield* Effect.orDie(shred(read, version, shredGrammarOf(grammar)));
                const rows = flatten(tree, idOf);
                const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
                const lawful = rows.openElementNames.flatMap(({ local, namespace, node }) => {
                  const held = byId.get(node);
                  const parent = held === undefined ? undefined : byId.get(held.parent);

                  return held === undefined || parent === undefined
                    ? []
                    : [
                        {
                          governs: held.governs,
                          kind: held.kind,
                          local,
                          namespace,
                          parentKind: parent.kind,
                          parentNamespace: kindNamespace.get(parent.kind) ?? "",
                          prefix: held.prefix,
                          version: held.version,
                        },
                      ];
                });

                assert.deepStrictEqual(
                  lawful.map(({ kind, parentKind }) => `${kind} ${parentKind}`),
                  [
                    "own-namespace-element qti-ordering",
                    "own-namespace-element qti-ordering",
                    "no-namespace-element qti-ordering",
                    "foreign-element qti-ordering",
                  ],
                );

                const [own, , none, other] = lawful;
                assert.isDefined(own);
                assert.isDefined(none);
                assert.isDefined(other);

                const judged = {
                  "a QTI-named element whose name the slot admits": {
                    broken: ["OpenElementName.OpenElementName_canonical"],
                    row: { ...own, local: "div" },
                  },
                  "a foreign element governed by a type of another schema set": {
                    broken: ["OpenElementName.XsiType_available"],
                    row: { ...other, governs: otherSetType },
                  },
                  "a foreign element only a strict slot holds, with no type": {
                    broken: ["OpenElementName.Strictly_held"],
                    row: { ...other, parentKind: "qti-companion-materials-info" },
                  },
                  "a held root its set declares, with no type": {
                    broken: [],
                    row: {
                      ...other,
                      local: "manifest",
                      namespace: kindNamespace.get("cp:manifest") ?? "",
                      parentKind: "drd:accessForAllResource",
                      parentNamespace: kindNamespace.get("drd:accessForAllResource") ?? "",
                    },
                  },
                  "an element in no namespace written with a prefix": {
                    broken: ["Node.Foreign_element_class"],
                    row: { ...none, prefix: "p" },
                  },
                  "an own-namespace element stored in no namespace": {
                    broken: ["OpenElementName.Foreign_element_class"],
                    row: { ...own, namespace: "" },
                  },
                  "the slot's lawful children": { broken: [], row: undefined },
                } as const satisfies Readonly<
                  Record<
                    OrderingVariant,
                    { readonly broken: readonly string[]; readonly row: ForeignRow | undefined }
                  >
                >;
                const { broken, row } = judged[variant];

                for (const held of row === undefined ? lawful : [row]) {
                  assert.deepStrictEqual(brokenChecks(held), [...broken], variant);
                }
              }),
          ),
        );

        assert.strictEqual(exhausted.cases, orderingCases.length);
      }),
  );
});

/**
 * One named namespace name: what it is, the text, and whether it is an RFC 3986 `URI-reference`.
 */
type NamedUri = readonly [name: string, uri: string, admitted: boolean];

/**
 * A namespace name `NamespaceUri`'s pattern must judge as the specification does, by name: each
 * input, what it is, and whether it is an RFC 3986 `URI-reference`, read off Appendix A by hand.
 * The oracle's recogniser is held to the same list, so neither side is judged by the other alone.
 */
const namedUris: readonly [NamedUri, ...NamedUri[]] = [
  ["the empty string, an unprefixed undeclaration's value", "", true],
  ["a URN", "urn:x:y", true],
  ["an http URI with a query and a fragment", "http://a/b?c#d", true],
  ["a relative path, deprecated by §2.2 and still a URI reference", "a/b", true],
  ["an IPv6 loopback", "http://[::1]/", true],
  ["the QTI 3 ASI namespace", "http://www.imsglobal.org/xsd/imsqtiasi_v3p0", true],
  ["an unclosed IP literal", "http://[bad", false],
  ["a space", "a b", false],
  ["a percent sign with no two hex digits after it", "%zz", false],
  ["a port that is not digits", "http://h:x/", false],
  ["IPvFuture, its v a capital (RFC 5234 §2.3)", "http://[V1.x]/", true],
  ["IPvFuture with nothing after its dot", "http://[v1.]", false],
  ["an IPv4-mapped IPv6 address", "http://[::ffff:1.2.3.4]", true],
  ["eight IPv6 groups", "http://[1:2:3:4:5:6:7:8]", true],
  ["nine IPv6 groups", "http://[1:2:3:4:5:6:7:8:9]", false],
  ["seven groups after ::", "http://[::1:2:3:4:5:6:7]", true],
  ["eight groups after ::", "http://[::1:2:3:4:5:6:7:8]", false],
  ["two ::", "http://[1::2::3]", false],
  ["a five-digit group", "http://[12345::]", false],
  ["an IPv4 address in brackets", "http://[1.2.3.4]", false],
  [
    "a zone identifier, which RFC 6874 adds and RFC 3986 does not",
    "http://[fe80::1%25eth0]",
    false,
  ],
  ["an octet past 255, a reg-name", "http://1.2.3.256/", true],
  ["a colon in a relative reference's first segment", ":a", false],
  ["a scheme and nothing more", "a:", true],
  ["a scheme that starts with a digit", "1a:b", false],
  ["a dot segment before a colon", "./a:b", true],
  ["an empty fragment", "#", true],
  ["an empty query", "?", true],
  ["two fragments", "http://h#a#b", false],
  ["a second @", "http://u@@h", false],
  ["userinfo of colons", "//a:b:c@h", true],
  ["an empty host and an empty port", "//:", true],
  ["a bracket in a path", "http://h/[", false],
  ["a character beyond ASCII, as an IRI holds", "http://\u{4F8B}.jp/", false],
  ["leading whitespace, which attribute-value normalization keeps", " urn:x", false],
  ["a tab", "urn:\tx", false],
  ["a lowercase percent-encoding", "urn:%7e", true],
];

/**
 * The characters the namespace character box draws: a letter, a digit, and every delimiter whose
 * place the grammar fixes, with a space, which no URI reference holds.
 */
const uriCharacters = ["a", "1", ".", ":", "/", "?", "#", "%", "@", "[", "]", " "] as const;

/**
 * The pieces the IP literal box draws, each a run of an IPv6, IPv4 or IPvFuture address, or a
 * character none of them holds.
 */
const ipPieces = ["1:1:1:", "1:", "1", "::", ":", "1.2.3.4", ".", "v1.x", "g"] as const;

/**
 * The features a swarm weighs in one namespace name: each part of `URI-reference`, each kind of
 * host, a percent-encoding, a mutation that edits the result, and a case drawn by name.
 */
const uriFeatures = [
  "scheme",
  "authority",
  "userinfo",
  "ipv6",
  "ipvFuture",
  "ipv4",
  "port",
  "path",
  "query",
  "fragment",
  "percent",
  "mutation",
  "named",
] as const;

/**
 * A feature of {@link uriFeatures}.
 */
type UriFeature = (typeof uriFeatures)[number];

/**
 * The characters a mutation writes: the delimiters, the hex letters' neighbours, a space, a tab
 * and a character beyond ASCII.
 */
const hostile = [
  " ",
  "%",
  "[",
  "]",
  "#",
  "?",
  ":",
  "@",
  "/",
  ".",
  "v",
  "V",
  "g",
  "\t",
  "\u{E9}",
] as const;

/**
 * Draw one character of `pchar`, or under the swarm's `percent` a percent-encoding, whole or cut.
 *
 * @param on - The case's swarm.
 * @returns The generator.
 */
const pcharOf =
  (on: Swarm<UriFeature>): Gen<string> =>
  (source) =>
    source.draw(keep(on, "percent"))
      ? source.draw(element(["%41", "%7e", "%2", "%G0"] as const))
      : source.draw(
          element([
            "a",
            "Z",
            "0",
            "-",
            ".",
            "_",
            "~",
            "!",
            "$",
            "&",
            "'",
            "(",
            ")",
            "*",
            "+",
            ",",
            ";",
            "=",
            ":",
            "@",
          ] as const),
        );

/**
 * Draw one IPv6 address of 0 to 9 groups, with or without a `::` at a drawn place and an IPv4
 * tail, so both the grammar's nine forms and their near misses appear.
 *
 * @returns The generator.
 */
const ipv6Of: Gen<string> = (source) => {
  const groups = source.draw(
    array(element(["1", "ab", "ffff", "12345"] as const), { max: 9, min: 0 }),
  );
  const elision = source.draw(int(-1, groups.length));
  const tail = source.draw(element(["", "1.2.3.4", "1.2.3"] as const));
  const written = [...groups, ...(tail === "" ? [] : [tail])];

  return elision < 0
    ? written.join(":")
    : `${written.slice(0, elision).join(":")}::${written.slice(elision).join(":")}`;
};

/**
 * Draw a namespace name under a swarm: a URI reference built from Appendix A's parts the swarm
 * keeps, or a named case, then perhaps edited by a mutation, so the search crosses the boundary
 * between the language and its neighbours from both sides.
 *
 * @param on - The case's swarm.
 * @returns The generator.
 */
const uriOf =
  (on: Swarm<UriFeature>): Gen<string> =>
  (source) => {
    const segment = (): string => source.draw(array(pcharOf(on), { max: 3, min: 0 })).join("");
    const host = (): string => {
      if (source.draw(keep(on, "ipv6"))) {
        return `[${source.draw(ipv6Of)}]`;
      }

      if (source.draw(keep(on, "ipvFuture"))) {
        return `[${source.draw(element(["v1.", "V1f.", "v."] as const))}${segment()}]`;
      }

      return source.draw(keep(on, "ipv4"))
        ? source.draw(array(int(0, 300), { max: 5, min: 3 })).join(".")
        : segment();
    };
    const built = source.draw(keep(on, "named"))
      ? source.draw(element(namedUris))[1]
      : [
          source.draw(keep(on, "scheme"))
            ? `${source.draw(element(["urn", "http", "a+b.c-d", "1x", ""] as const))}:`
            : "",
          source.draw(keep(on, "authority"))
            ? `//${source.draw(keep(on, "userinfo")) ? `${segment()}@` : ""}${host()}${source.draw(keep(on, "port")) ? `:${source.draw(element(["", "80", "8x"] as const))}` : ""}`
            : "",
          source.draw(keep(on, "path"))
            ? source.draw(array(map(int(0, 0), segment), { max: 3, min: 1 })).join("/")
            : "",
          source.draw(keep(on, "query")) ? `?${segment()}` : "",
          source.draw(keep(on, "fragment")) ? `#${segment()}` : "",
        ].join("");
    const edits = source.draw(keep(on, "mutation")) ? source.draw(int(1, 2)) : 0;
    let text = built;
    for (let edit = 0; edit < edits; edit += 1) {
      const at = source.draw(int(0, text.length));
      const kind = source.draw(element(["insert", "replace", "delete"] as const));
      const written = kind === "delete" ? "" : source.draw(element(hostile));
      text = `${text.slice(0, at)}${written}${text.slice(kind === "insert" ? at : at + 1)}`;
    }

    return text;
  };

/**
 * A situation the namespace name search must reach.
 */
type UriSituation =
  | "admitted"
  | "refused"
  | "IPv6 admitted"
  | "IPv6 refused"
  | "IPvFuture admitted"
  | "mutated and admitted"
  | "mutated and refused";

describe("qti/chardata.ts, a namespace name is an RFC 3986 URI reference (reading 131)", () => {
  it("judges each named input as RFC 3986's grammar does, the pattern and the oracle's recogniser alike", () => {
    // Oracle: the specification as a checker, RFC 3986 Appendix A read by hand for each input
    // (Namespaces in XML 1.0 §3: "either a URI reference … or an empty string").
    for (const [name, uri, admitted] of namedUris) {
      assert.strictEqual(patternOf(Namespace.fields.uri).test(uri), admitted, name);
      assert.strictEqual(isUriReference(uri), admitted, `the recogniser: ${name}`);
    }
  });

  it.effect(
    "admits exactly the URI references among every text of at most 4 characters over a letter, a digit, a space and the delimiters",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's recogniser of RFC 3986 Appendix A
      // (`#pantry/test/uri-reference.ts`), a grammar run as ABNF reads it, not a regular
      // expression.
      // Bound: every text of 0 to 4 characters over 12, 22,621.
      Effect.gen(function* uriCharacterBox() {
        const limit = [0, 1, 2, 3, 4].reduce(
          (sum, length) => sum + uriCharacters.length ** length,
          0,
        );
        const pattern = patternOf(Namespace.fields.uri);
        const exhausted = yield* searched(
          ctx,
          exhaust(
            {
              box: "every text of at most 4 characters over a, 1, ., :, /, ?, #, %, @, [, ] and space",
              caseHang,
              coverage: requiredInSpace<"admitted" | "refused">(["admitted", "refused"]),
              generator: array(element(uriCharacters), { max: 4, min: 0 }),
              limit,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle's recogniser of RFC 3986 Appendix A",
              },
              suite: "qti/chardata-namespace-characters",
            },
            (characters, c) =>
              Effect.sync(() => {
                const uri = characters.join("");
                const admitted = isUriReference(uri);
                c.note(admitted ? "admitted" : "refused");

                assert.strictEqual(pattern.test(uri), admitted, JSON.stringify(uri));
              }),
          ),
        );

        assert.strictEqual(exhausted.cases, limit);
      }),
    { timeout: boxTimeout },
  );

  it.effect(
    "admits exactly the URI references among every IP literal of at most 4 pieces of IPv6, IPv4 and IPvFuture addresses",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's recogniser of RFC 3986 Appendix A.
      // Bound: every `//[…]` of 0 to 4 pieces over 9, 7,381.
      Effect.gen(function* ipLiteralBox() {
        const limit = [0, 1, 2, 3, 4].reduce((sum, length) => sum + ipPieces.length ** length, 0);
        const pattern = patternOf(Namespace.fields.uri);
        const exhausted = yield* searched(
          ctx,
          exhaust(
            {
              box: "every //[…] of at most 4 pieces over 1:1:1:, 1:, 1, ::, :, 1.2.3.4, ., v1.x and g",
              caseHang,
              coverage: requiredInSpace<"admitted" | "refused">(["admitted", "refused"]),
              generator: array(element(ipPieces), { max: 4, min: 0 }),
              limit,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle's recogniser of RFC 3986 Appendix A",
              },
              suite: "qti/chardata-namespace-ip-literals",
            },
            (pieces, c) =>
              Effect.sync(() => {
                const uri = `//[${pieces.join("")}]`;
                const admitted = isUriReference(uri);
                c.note(admitted ? "admitted" : "refused");

                assert.strictEqual(pattern.test(uri), admitted, uri);
              }),
          ),
        );

        assert.strictEqual(exhausted.cases, limit);
      }),
    { timeout: boxTimeout },
  );

  it.effect(
    "admits exactly the URI references among namespace names drawn by a swarm over Appendix A's parts, near misses and named cases",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's recogniser of RFC 3986 Appendix A.
      // Bound: the generator's own bounds, 3 characters a segment, 9 IPv6 groups, 2 edits, 1,000
      // runs.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<UriSituation>(
              [
                "admitted",
                "refused",
                "IPv6 admitted",
                "IPv6 refused",
                "IPvFuture admitted",
                "mutated and admitted",
                "mutated and refused",
              ],
              { cases: 600, sense: notesOnly },
            ),
            draw: drawn((source) => {
              const on = source.draw(swarm(uriFeatures));

              return { swarm: on, uri: source.draw(uriOf(on)) };
            }),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's recogniser of RFC 3986 Appendix A",
            },
            runs: 1000,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "qti/chardata-namespace-swarm",
          },
          ({ swarm: on, uri }, c) =>
            Effect.sync(() => {
              const admitted = isUriReference(uri);
              const verdict = admitted ? "admitted" : "refused";
              c.note(verdict);
              if (on.ipv6 !== undefined && uri.includes("[")) {
                c.note(admitted ? "IPv6 admitted" : "IPv6 refused");
              }

              if (admitted && /\[[Vv]/u.test(uri)) {
                c.note("IPvFuture admitted");
              }

              if (on.mutation !== undefined) {
                c.note(`mutated and ${verdict}`);
              }

              assert.strictEqual(
                patternOf(Namespace.fields.uri).test(uri),
                admitted,
                JSON.stringify(uri),
              );
            }),
        ),
      ),
    { timeout: searchTimeout },
  );
});
