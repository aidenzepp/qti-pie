/* oxlint-disable unicorn/text-encoding-identifier-case -- The generated documents carry the charset label crust's reader reports, `UTF-8`. */
/**
 * The O2 overlay rows against a second reading of the same tree: a direct walk of the XDM
 * document, numbering its nodes in document order as the tree's rows are numbered and collecting
 * each overlay's row from its element, its attributes and its children. The walk shares no code
 * with the builder, which reads the tree's flat rows (`flatten`).
 *
 * The codes are checked against the closed relations themselves: every `base-type` and
 * `cardinality` a fixture or a corpus document writes reads back, through `BaseTypeLexical` and
 * `CardinalityLexical`, as the lexical form the builder copied (C17).
 */
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Layer, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import {
  BaseTypeLexical,
  CardinalityLexical,
  grammar,
  interactionKinds,
} from "#pantry/grammar/install.ts";
import { piecesOf, rowsOf } from "#pantry/import/overlays/declarations.ts";
import type { DeclarationRows, DocumentIds } from "#pantry/import/overlays/declarations.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import { closedName, documentFamily } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  NodeId,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
  XdmElement,
} from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { declarationKinds, valueSetKinds } from "#pantry/qti/declarations.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { settings } from "#pantry/test/settings.ts";

/**
 * The file system and processes the fixtures' materializer and `readPackage` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The ids every case writes its rows under: each node's by its number.
 */
const ids: DocumentIds = { idOf };

/**
 * One overlay's expected rows: its relation and its rows by node id.
 */
type Expected = { readonly [Relation in keyof DeclarationRows]: Map<string, object> };

/**
 * The overlay relations the builder writes rows of.
 */
const relationNames = [
  "Declaration",
  "OutcomeRange",
  "RecordField",
  "Value",
  "ValueSet",
] as const satisfies readonly (keyof DeclarationRows)[];

/**
 * The kinds that declare a variable, and those that hold a declaration's values.
 */
const declaring: ReadonlySet<string> = new Set(declarationKinds);

/**
 * The kinds that hold a declaration's values.
 */
const holding: ReadonlySet<string> = new Set(valueSetKinds);

/**
 * The base types a lexical form spells: `BaseTypeLexical`'s rows, read as the closed relation
 * states them.
 */
const spelledBaseTypes: ReadonlyMap<string, string> = new Map(
  BaseTypeLexical.rows.map(({ code, lexical }) => [lexical, code] as const),
);

/**
 * The cardinalities a lexical form spells, by `CardinalityLexical`'s rows.
 */
const spelledCardinalities: ReadonlyMap<string, string> = new Map(
  CardinalityLexical.rows.map(({ code, lexical }) => [lexical, code] as const),
);

/**
 * The text of a whitespace-collapsing identifier, its outer XML whitespace removed.
 *
 * @param lexical - The lexical form.
 * @returns The collapsed form.
 */
const collapse = (lexical: string): string => {
  const space = new Set(["\t", "\n", "\r", " "]);
  let from = 0;
  let to = lexical.length;
  while (from < to && space.has(lexical.charAt(from))) {
    from += 1;
  }

  while (to > from && space.has(lexical.charAt(to - 1))) {
    to -= 1;
  }

  return lexical.slice(from, to);
};

/**
 * What the walk carries down from an element to its children: its id, kind and nearest
 * interaction, and the declaration or value set it is, if either.
 */
interface Parent {
  readonly declaration: Option.Option<WalkedDeclaration>;
  readonly id: NodeId;
  readonly kind: string;
  readonly nearest: NodeId;
  readonly set: Option.Option<WalkedSet>;
}

/**
 * The fields of a declaration its value sets copy.
 */
interface WalkedDeclaration {
  readonly baseType: string;
  readonly cardinality: string;
  readonly declarationKind: string;
  readonly identifier: string;
}

/**
 * The fields of a value set its values read.
 */
interface WalkedSet {
  readonly baseType: string;
  readonly cardinality: string;
}

/**
 * An element as the walk meets it: its node's tuple, its attributes, its children and its element
 * rank among its siblings.
 */
interface Met {
  readonly child: XdmElement<Composed>;
  readonly rank: bigint;
  readonly tuple: {
    readonly document: NodeId;
    readonly kind: string;
    readonly nearest: NodeId;
    readonly node: NodeId;
    readonly parent: NodeId;
    readonly start: bigint;
    readonly version: string;
  };
  readonly valueOf: (name: string) => string | undefined;
}

/**
 * Write an identifier's pieces as the walk reads them: the collapsed name, and what lies before and
 * after it in the lexical form.
 *
 * @param lexical - The lexical form.
 * @returns The lead, the name and the trail.
 */
const walkedPieces = (lexical: string) => {
  const name = collapse(lexical);
  const offset = lexical.indexOf(name);

  return {
    lead: name === "" ? lexical : lexical.slice(0, offset),
    name,
    trail: name === "" ? "" : lexical.slice(offset + name.length),
  };
};

/**
 * Collect a declaration's expected rows, and its outcome range's.
 *
 * @param expected - The rows so far.
 * @param met - The declaration's element.
 * @returns What its value sets copy.
 */
const walkDeclaration = (expected: Expected, { tuple, valueOf }: Met): WalkedDeclaration => {
  const identifierLexical = valueOf("identifier") ?? "";
  const baseTypeLexical = valueOf("base-type") ?? "";
  const cardinalityLexical = valueOf("cardinality") ?? "";
  const { lead, name, trail } = walkedPieces(identifierLexical);
  const row = {
    ...tuple,
    baseType: spelledBaseTypes.get(baseTypeLexical) ?? "none",
    baseTypeLexical,
    cardinality: spelledCardinalities.get(cardinalityLexical) ?? "single",
    cardinalityLexical,
    declarationKind: tuple.kind,
    identifier: name,
    identifierLead: lead,
    identifierLexical,
    identifierTrail: trail,
  };
  expected.Declaration.set(tuple.node, row);

  const [masteryValue, normalMaximum, normalMinimum] = [
    "mastery-value",
    "normal-maximum",
    "normal-minimum",
  ].map(valueOf);
  if (
    tuple.kind === "qti-outcome-declaration" &&
    [masteryValue, normalMaximum, normalMinimum].some((value) => value !== undefined)
  ) {
    expected.OutcomeRange.set(tuple.node, {
      masteryValue: masteryValue ?? "",
      node: tuple.node,
      normalMaximum: normalMaximum ?? "",
      normalMinimum: normalMinimum ?? "",
    });
  }

  return row;
};

/**
 * Collect a value set's expected row.
 *
 * @param expected - The rows so far.
 * @param met - The set's element.
 * @param owner - Its declaration.
 * @returns What its values read.
 */
const walkSet = (expected: Expected, { child, rank, tuple }: Met, owner: WalkedDeclaration) => {
  const row = {
    ...tuple,
    baseType: owner.baseType,
    cardinality: owner.cardinality,
    declarationKind: owner.declarationKind,
    elementChildren: BigInt(child.children.filter(({ _tag }) => _tag === "element").length),
    elements: rank,
    identifier: owner.identifier,
  };
  expected.ValueSet.set(tuple.node, row);

  return row;
};

/**
 * Read a value's text: its children's characters in order, a text's and whitespace's own, an
 * entity reference's `&name;`, nothing of a comment or an instruction.
 *
 * @param child - The value's element.
 * @returns The text.
 */
const textOf = (child: Met["child"]): string =>
  child.children
    .map((grandchild) => {
      if (grandchild._tag === "text" || grandchild._tag === "ws") {
        return grandchild.value;
      }

      return grandchild._tag === "entityRef" ? `&${grandchild.name};` : "";
    })
    .join("");

/**
 * Collect a value's expected row, and its field's where it is one.
 *
 * @param expected - The rows so far.
 * @param met - The value's element.
 * @param owner - Its set.
 */
const walkValue = (expected: Expected, { child, tuple, valueOf }: Met, owner: WalkedSet): void => {
  const fieldIdentifier = valueOf("field-identifier");
  const fieldBaseType = valueOf("base-type");
  const ownBaseType = spelledBaseTypes.get(fieldBaseType ?? "") ?? "none";
  expected.Value.set(tuple.node, {
    ...tuple,
    baseType: owner.baseType === "none" ? ownBaseType : owner.baseType,
    setBaseType: owner.baseType,
    text: textOf(child),
  });
  if (
    owner.cardinality === "record" ||
    fieldIdentifier !== undefined ||
    fieldBaseType !== undefined
  ) {
    const { lead, name, trail } = walkedPieces(fieldIdentifier ?? "");
    expected.RecordField.set(tuple.node, {
      ...tuple,
      baseType: ownBaseType,
      baseTypeLexical: fieldBaseType ?? "",
      identifier: name,
      identifierLead: lead,
      identifierLexical: fieldIdentifier ?? "",
      identifierTrail: trail,
    });
  }
};

/**
 * Walk a document's tree in document order and collect the overlay rows it implies: each
 * declaration with its node's tuple and attributes, each value set of a declaration, each value of
 * a value set with its text, each record field, and each outcome's scale.
 *
 * @param doc - The document's tree.
 * @returns Every overlay's expected rows.
 */
const walk = (doc: XdmDocument<Composed>): Expected => {
  const expected: Expected = {
    Declaration: new Map(),
    OutcomeRange: new Map(),
    RecordField: new Map(),
    Value: new Map(),
    ValueSet: new Map(),
  };
  const document = ids.idOf(0);
  const interactions = new Set<string>(interactionKinds);
  let next = 1;
  const visit = (
    child: XdmChild<Composed> | XdmDocument<Composed>["root"],
    parent: Parent,
    rank: bigint,
  ): void => {
    const id = ids.idOf(next);
    const start = BigInt(next);
    next += 1;
    if (child._tag !== "element" && !("attributes" in child)) {
      return;
    }

    const kind = child._tag === "element" ? child.kind : child._tag;
    const nearest = interactions.has(parent.kind) ? parent.id : parent.nearest;
    const met: Met = {
      child,
      rank,
      tuple: { document, kind, nearest, node: id, parent: parent.id, start, version: doc.version },
      valueOf: (name) =>
        child.attributes.find(
          (attribute) => attribute.name._tag === "closed" && attribute.name.handle === name,
        )?.lexical,
    };
    const declaration = declaring.has(kind)
      ? Option.some(walkDeclaration(expected, met))
      : Option.none<WalkedDeclaration>();
    const set =
      holding.has(kind) && Option.isSome(parent.declaration)
        ? Option.some(walkSet(expected, met, parent.declaration.value))
        : Option.none<WalkedSet>();
    if (kind === "qti-value" && Option.isSome(parent.set)) {
      walkValue(expected, met, parent.set.value);
    }

    let elementRank = 0n;
    for (const grandchild of child.children) {
      elementRank += grandchild._tag === "element" ? 1n : 0n;
      visit(grandchild, { declaration, id, kind, nearest, set }, elementRank);
    }
  };

  let rank = 0n;
  for (const child of documentFamily(doc)) {
    if (child._tag === "element") {
      rank += 1n;
      visit(
        child,
        {
          declaration: Option.none(),
          id: document,
          kind: "document",
          nearest: document,
          set: Option.none(),
        },
        rank,
      );
    } else {
      next += 1;
    }
  }

  return expected;
};

/**
 * List a keyed set's entries in key order, so two sets compare as sets.
 *
 * @param map - The keyed set.
 * @returns Its entries, sorted by key.
 */
const sortedEntries = (map: ReadonlyMap<string, object>): readonly (readonly [string, object])[] =>
  [...map].toSorted(([left], [right]) => left.localeCompare(right));

/**
 * Compare the builder's keyed sets with the walk's: every relation's keys and rows alike.
 *
 * @param rows - The builder's rows.
 * @param expected - The walk's.
 * @param label - The case, for a failure's message.
 */
const assertRows = (rows: DeclarationRows, expected: Expected, label: string): void => {
  for (const relation of relationNames) {
    assert.deepStrictEqual(
      sortedEntries(rows[relation]),
      sortedEntries(expected[relation]),
      `${label} ${relation}`,
    );
  }
};

/**
 * An element with closed attributes.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes' names and lexical forms, in order; an absent one is left out.
 * @param children - Its children.
 * @returns The element.
 */
const elementOf = (
  kind: XdmClosedElement<Composed>["kind"],
  attributes: readonly (readonly [ClosedName<Composed>, string | undefined])[],
  children: readonly XdmChild<Composed>[],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.flatMap(([handle, lexical]) =>
    lexical === undefined ? [] : [{ lexical, name: closedName(handle), references: [] }],
  ),
  children,
  governs: "none",
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * One generated value: its text's pieces, and the field attributes it writes.
 */
interface ValueCase {
  readonly baseType: string | undefined;
  readonly field: string | undefined;
  readonly pieces: readonly XdmChild<Composed>[];
}

/**
 * The declaration kinds the generator writes, as element kinds: `declarationKinds`, which a test
 * below holds equal to this list.
 */
const generatedKinds = [
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-template-declaration",
  "qti-context-declaration",
] as const satisfies readonly XdmClosedElement<Composed>["kind"][];

/**
 * One generated declaration: its kind, its attributes, and its value sets.
 */
interface DeclarationCase {
  readonly baseType: string | undefined;
  readonly cardinality: string;
  readonly identifier: string;
  readonly kind: (typeof generatedKinds)[number];
  readonly mastery: string | undefined;
  readonly minimum: string | undefined;
  readonly sets: readonly {
    readonly kind: "qti-correct-response" | "qti-default-value";
    readonly values: readonly ValueCase[];
  }[];
}

/**
 * The pieces a value's text is written in: text, whitespace and a comment, so a text in two nodes
 * and one a comment splits are drawn.
 */
const piece: Gen<XdmChild<Composed>> = element<XdmChild<Composed>>([
  { _tag: "text", value: "1" },
  { _tag: "ws", value: " " },
  { _tag: "comment", value: "c" },
  { _tag: "text", value: "x" },
]);

/**
 * The generated documents: an item of up to 3 declarations, each of any declaration kind, an
 * identifier with or without outer whitespace (named variant `padded`), a base type that is
 * written, unwritten (`no-base-type`) or names no handle (`unknown-base-type`), any cardinality
 * (`record`), an outcome's scale, and up to 2 value sets of up to 3 values, each text in up to 3
 * pieces (`split-text`) and a field identifier or base type written or not
 * (`field-outside-record`).
 */
const declarationsGen: Gen<readonly DeclarationCase[]> = array(
  (source) => ({
    baseType: source.draw(element(["float", "identifier", "bogus", undefined] as const)),
    cardinality: source.draw(element(["single", "multiple", "record"] as const)),
    identifier: source.draw(element(["A", " B", "C\n", "\tD "] as const)),
    kind: source.draw(element(generatedKinds)),
    mastery: source.draw(element(["0.5", undefined] as const)),
    minimum: source.draw(element(["0", undefined] as const)),
    sets: source.draw(
      array(
        (inner) => ({
          kind: inner.draw(element(["qti-default-value", "qti-correct-response"] as const)),
          values: inner.draw(
            array(
              (deep) => ({
                baseType: deep.draw(element(["integer", undefined] as const)),
                field: deep.draw(element(["f", " g", undefined] as const)),
                pieces: deep.draw(array(piece, { max: 3, min: 0 })),
              }),
              { max: 3, min: 1 },
            ),
          ),
        }),
        { max: 2, min: 0 },
      ),
    ),
  }),
  { max: 3, min: 0 },
);

/**
 * A situation a generated document reaches, each a named variant the builder must hold.
 */
type Situation =
  | "field-outside-record"
  | "no-base-type"
  | "outcome-range"
  | "padded"
  | "record"
  | "split-text"
  | "unknown-base-type";

/**
 * Name the situations one generated document reaches.
 *
 * @param input - The declarations.
 * @returns Its situations.
 */
const situationsOf = (input: readonly DeclarationCase[]): readonly Situation[] => {
  const values = input.flatMap(({ sets }) => sets.flatMap(({ values: held }) => held));
  const reached: [Situation, boolean][] = [
    ["padded", input.some(({ identifier }) => identifier !== identifier.trim())],
    ["no-base-type", input.some(({ baseType }) => baseType === undefined)],
    ["unknown-base-type", input.some(({ baseType }) => baseType === "bogus")],
    ["record", input.some(({ cardinality, sets }) => cardinality === "record" && sets.length > 0)],
    ["split-text", values.some(({ pieces }) => pieces.length > 1)],
    [
      "field-outside-record",
      input.some(
        ({ cardinality, sets }) =>
          cardinality !== "record" &&
          sets.some(({ values: held }) => held.some(({ field }) => field !== undefined)),
      ),
    ],
    [
      "outcome-range",
      input.some(
        ({ kind, mastery, minimum }) =>
          kind === "qti-outcome-declaration" && (mastery !== undefined || minimum !== undefined),
      ),
    ],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * Write generated declarations as the tree shred would give: an item holding each declaration,
 * whitespace before each declaration, value set and value, so character data shares the numbering
 * and no count of element children is a count of children.
 *
 * @param input - The declarations.
 * @returns The tree.
 */
const treeOf = (input: readonly DeclarationCase[]): XdmDocument<Composed> => {
  const ws: XdmChild<Composed> = { _tag: "ws", value: "\n" };
  const declarations = input.map(
    ({ baseType, cardinality, identifier, kind, mastery, minimum, sets }) =>
      elementOf(
        kind,
        [
          ["identifier", identifier],
          ["cardinality", cardinality],
          ["base-type", baseType],
          ...(kind === "qti-outcome-declaration"
            ? ([
                ["mastery-value", mastery],
                ["normal-minimum", minimum],
              ] as const)
            : []),
        ],
        sets.flatMap(({ kind: setKind, values }) => [
          ws,
          elementOf(
            setKind,
            [],
            values.flatMap(({ baseType: own, field, pieces }) => [
              ws,
              elementOf(
                "qti-value",
                [
                  ["field-identifier", field],
                  ["base-type", own],
                ],
                pieces,
              ),
            ]),
          ),
        ]),
      ),
  );

  return {
    _tag: "document",
    charset: "UTF-8",
    declaration: Option.none(),
    doctype: Option.none(),
    epilog: [],
    exportCharset: "UTF-8",
    prolog: [{ _tag: "comment", value: " item " }],
    root: elementOf(
      "qti-assessment-item",
      [["identifier", "item"]],
      declarations.flatMap((declaration) => [ws, declaration]),
    ),
    version: "3.0.1",
  };
};

describe("import/overlays/declarations.ts", () => {
  it("generates every declaration kind and no other", () => {
    // Oracle: install.ts's declaration kinds, the `DeclarationKind` roster as `NodeKind` handles.
    assert.sameMembers([...generatedKinds], [...declarationKinds]);
  });

  it.effect("writes each overlay's rows as the walk of the document's tree names them", (ctx) =>
    // Oracle: a second implementation, a direct walk of the XDM document that numbers its nodes in
    // document order and reads each element's attributes and children, against the builder's read
    // of the tree's flat rows; the codes against `BaseTypeLexical` and `CardinalityLexical`.
    // Bound: up to 3 declarations of 4 kinds, 4 identifiers, 4 base types and 3 cardinalities, each
    // with up to 2 value sets of 1 to 3 values of up to 3 text pieces, 300 runs.
    searched(
      ctx,
      explore(
        {
          caseHang: Duration.seconds(10),
          concurrency: 1,
          coverage: required<Situation>(
            [
              "padded",
              "no-base-type",
              "unknown-base-type",
              "record",
              "split-text",
              "field-outside-record",
              "outcome-range",
            ],
            { cases: 200, sense: notesOnly },
          ),
          draw: drawn(declarationsGen),
          kept: [],
          literal: Formatter.format,
          oracle: { kind: "second-implementation", name: "a direct walk of the XDM tree" },
          runs: 300,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/import/overlays-declarations",
        },
        (input, c) =>
          Effect.sync(() => {
            c.noteAll(situationsOf(input));

            const doc = treeOf(input);
            assertRows(rowsOf(doc, ids), walk(doc), "generated");
          }),
      ),
    ),
  );

  it.effect(
    "splits an identifier into pieces that concatenate to it, the name holding no whitespace",
    (ctx) =>
      // Oracle: a universal one, the round trip: lead ‖ name ‖ trail is the lexical form, and the
      // name is the lexical form collapsed (XML Schema Part 2, §4.3.6).
      // Bound: every lexical form of a lead and a trail of at most 2 of 3 whitespace characters
      // around one of 4 names (one empty, one all whitespace), 13 × 13 × 4 = 676 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "a lead and a trail of at most 2 of space, tab and line feed around 4 names",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"padded" | "bare" | "empty">(["padded", "bare", "empty"]),
            generator: (source) => ({
              lead: source
                .draw(array(element([" ", "\t", "\n"] as const), { max: 2, min: 0 }))
                .join(""),
              name: source.draw(element(["A", "a.b-c", "", "x"] as const)),
              trail: source
                .draw(array(element([" ", "\t", "\n"] as const), { max: 2, min: 0 }))
                .join(""),
            }),
            limit: 1000,
            literal: Formatter.format,
            oracle: { kind: "universal", name: "the round trip lead ‖ name ‖ trail" },
            suite: "pantry/import/overlays-declarations-pieces",
          },
          ({ lead, name, trail }, c) =>
            Effect.sync(() => {
              const lexical = `${lead}${name}${trail}`;
              const pieces = piecesOf(lexical);
              if (name === "") {
                c.note("empty");
              } else {
                c.note(lead === "" && trail === "" ? "bare" : "padded");
              }

              assert.strictEqual(`${pieces.lead}${pieces.name}${pieces.trail}`, lexical);
              assert.strictEqual(pieces.name, name);
              assert.match(pieces.lead, /^[\t\n\r ]*$/u);
              assert.match(pieces.trail, /^[\t\n\r ]*$/u);
            }),
        ),
      ),
  );
});

/**
 * Read a manifest's schema version from its tree: the text of `metadata/schemaversion`.
 *
 * @param manifest - The manifest as crust read it.
 * @returns The version it declares, none when it declares none.
 */
const declaredVersion = (manifest: XmlDocument): Option.Option<string> =>
  Option.fromNullishOr(
    manifest.root.children
      .flatMap((child) => (child.kind === "element" && child.local === "metadata" ? [child] : []))
      .flatMap((metadata) =>
        metadata.children.flatMap((child) =>
          child.kind === "element" && child.local === "schemaversion" ? [child] : [],
        ),
      )
      .map((found) =>
        found.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
      .at(0),
  );

/**
 * Read a package's documents and build each one's overlay rows: every XML entry that shreds under
 * the manifest's schema version.
 *
 * @param dir - The package directory or zip.
 * @returns Each shredded document's tree and rows.
 */
const documentsOf = (dir: string) =>
  Effect.gen(function* packageDocuments() {
    const files = yield* readPackage(dir);
    const manifest = files.find(({ kind }) => kind === "manifest");
    if (manifest === undefined) {
      return [];
    }

    const version = versionOf(
      grammar.kinds.versions.handles,
      declaredVersion(yield* readXml(manifest.bytes)),
    );
    if (Result.isFailure(version)) {
      return [];
    }

    const documents: { readonly path: string; readonly tree: XdmDocument<Composed> }[] = [];
    for (const file of files.filter(({ kind, path }) => kind === "file" && path.endsWith(".xml"))) {
      const xml = yield* Effect.option(readXml(file.bytes));
      const tree = Option.isSome(xml)
        ? yield* Effect.option(shred(xml.value, version.success, shredGrammarOf(grammar)))
        : Option.none();
      if (Option.isSome(tree)) {
        documents.push({ path: file.path, tree: tree.value });
      }
    }

    return documents;
  });

/**
 * Check a document's codes against the closed relations, and its rows against the walk.
 *
 * @param path - The document's path, for a failure's message.
 * @param tree - The document.
 * @returns The number of declarations it holds.
 */
const checkDocument = (path: string, tree: XdmDocument<Composed>): number => {
  const rows = rowsOf(tree, ids);
  assertRows(rows, walk(tree), path);
  for (const declaration of rows.Declaration.values()) {
    const at = `${path} ${declaration.identifierLexical}`;
    assert.strictEqual(
      CardinalityLexical.rows.find(({ code }) => code === declaration.cardinality)?.lexical,
      declaration.cardinalityLexical,
      `${at} cardinality`,
    );
    assert.strictEqual(
      BaseTypeLexical.rows.find(({ code }) => code === declaration.baseType)?.lexical ?? "",
      declaration.baseTypeLexical,
      `${at} base-type`,
    );
  }

  for (const field of rows.RecordField.values()) {
    assert.strictEqual(
      BaseTypeLexical.rows.find(({ code }) => code === field.baseType)?.lexical ?? "",
      field.baseTypeLexical,
      `${path} field base-type`,
    );
  }

  return rows.Declaration.size;
};

layer(TestLayer, { excludeTestServices: true })(
  "import/overlays/declarations.ts, fixtures",
  (suite) => {
    suite.effect.skipIf(!settings.corpusRequested)(
      "codes every base-type and cardinality the corpus writes as the handle whose Lexical row is its lexical form",
      () =>
        // Oracle: the closed relations, as above, over every document of the 1EdTech corpus.
        // Bound: every corpus zip's XML documents that shred (GR8DES_CORPUS=1).
        Effect.gen(function* corpusCodes() {
          let declared = 0;
          for (const { dir, name } of yield* materializeCorpus()) {
            for (const { path, tree } of yield* documentsOf(dir)) {
              declared += checkDocument(`${name}/${path}`, tree);
            }
          }

          assert.isAtLeast(declared, 100);
        }),
    );
  },
);
