/**
 * The test layer's overlay builders' free tests: the rows `rowsOf` and `assembledRowsOf` write
 * restate the documents, as a direct walk of each XDM tree reads them, and the laws over those
 * rows, restated on the host, refuse exactly what the specification refuses.
 *
 * - **Parts** (C15): each section's `SectionMember` rows are its direct part children, and its
 *   selection's counts are theirs.
 * - **Pieces**: a lexical form's split restates it, its value collapsed.
 * - **Selections**: a selection that writes a `select` has its row whatever the form, the form
 *   collapsed; the database, never the builder, judges whether it names an integer.
 * - **The assembly** (reading 85, 86): over every small package of a test and two section documents,
 *   the instance trees hold one child per site exactly where the inclusion graph has no cycle and
 *   no dangling site, each site has its target exactly where its href names a listed document, each
 *   child places its site's target, and the namespace key holds exactly where the test's distinct
 *   written elements have distinct identifiers.
 * - **The jumps** (reading 87): over every branch rule of a small test, the branch laws accept a rule
 *   exactly where reading 87's bullets do.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust, drawn, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, boolean, constant, element, int, oneOf } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import type { Addition } from "@bjornpagen/grizzle";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { contextsOf } from "#pantry/import/context.ts";
import { ownContext } from "#pantry/import/fold.ts";
import {
  assembledRowsOf,
  itemRefPathsOf,
  keyOf,
  piecesOf,
  rowsOf,
} from "#pantry/import/overlays/tests.ts";
import type {
  AssembledRows,
  InstanceMember,
  TestIds,
  TestRows,
} from "#pantry/import/overlays/tests.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  ClosedName,
  ElementKind,
  NodeId,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { exits, sectionParts } from "#pantry/qti/tests.ts";
import type { BranchShuffle, BranchTarget } from "#pantry/qti/tests.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { comparedPath, oracleValueOf, resolveAttribute } from "#pantry/test/resolution.ts";

/**
 * An element of a kind, with its attributes as (name, lexical) pairs and its children.
 *
 * @param kind - The kind.
 * @param attributes - The attributes, in order.
 * @param children - The children, in order.
 * @returns The element.
 */
const el = (
  kind: ElementKind<Composed>,
  attributes: readonly (readonly [ClosedName<Composed>, string])[] = [],
  children: readonly XdmChild<Composed>[] = [],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.map(([handle, lexical]) => ({
    lexical,
    name: closedName(handle),
    references: [],
  })),
  children,
  governs: Option.none(),
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * A document of one root element.
 *
 * @param root - The root.
 * @returns The document.
 */
const documentOf = (root: XdmClosedElement<Composed>): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "utf-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "utf-8",
  prolog: [],
  root,
  version: "3.0.1",
});

/**
 * The package every case's documents are written under.
 */
const packageId = "00000000-0000-4000-8000-00000000aaaa";

/**
 * Give document `n`'s node `index` an id of its own: the document's number in the uuid's fourth
 * group, so no two documents share an id.
 *
 * @param n - The document's number.
 * @returns Its ids.
 */
const idsOf =
  (n: number) =>
  (index: number): NodeId =>
    `00000000-0000-4000-${(0x80_00 + n).toString(16)}-${index.toString(16).padStart(12, "0")}`;

/**
 * The type a document is listed under, as its root's kind gives it (`RootOfType`), `none` for a
 * root no type lists, which no case writes.
 *
 * @param doc - The document.
 * @returns Its type.
 */
const listedTypeOf = (doc: XdmDocument<Composed>): TestIds["documentType"] =>
  grammar.package.rootOfType.rows.find(({ root }) => root === doc.root.kind)?.type ?? "none";

/**
 * Give each of a package's documents its ids: its own nodes' and its own context, every site's
 * target found among the documents by path, and each in an assembly as the importer's contexts
 * read it.
 *
 * @param documents - The documents by path, in order.
 * @returns Each document with its ids, in the same order.
 */
const idsOfPackage = (
  documents: readonly (readonly [string, XdmDocument<Composed>])[],
): readonly (readonly [XdmDocument<Composed>, TestIds])[] => {
  const listed = documents.map(([path, tree], n) => ({ idOf: idsOf(n), named: true, path, tree }));
  const roots = new Map(
    listed.map(({ idOf: ids, path, tree }) => [path, { node: ids(0), tree }] as const),
  );
  const rootAt = (at: string) => Option.fromNullishOr(roots.get(at));

  return contextsOf(listed).map(({ assembled, listed: { idOf: ids, path, tree } }) => [
    tree,
    {
      assembled,
      context: ownContext(ids(0)),
      documentAt: (at) => Option.map(rootAt(at), ({ node }) => node),
      documentType: listedTypeOf(tree),
      entryAt: (at) => roots.has(at),
      idOf: ids,
      package: packageId,
      path,
      targetAt: (at) =>
        Option.map(rootAt(at), ({ node, tree: target }) => ({
          context: ownContext(node),
          node,
          rootKind: target.root.kind,
        })),
    },
  ]);
};

/**
 * Read the rows of a package's documents, each under its {@link idsOfPackage} ids.
 *
 * @param documents - The documents by path, in order.
 * @returns Each document's rows, in the same order.
 */
const rowsOfPackage = (
  documents: readonly (readonly [string, XdmDocument<Composed>])[],
): readonly TestRows[] => idsOfPackage(documents).map(([tree, ids]) => rowsOf(tree, ids));

/**
 * A `qti-selection`, an `xs:int` select and maybe a `with-replacement`, both possibly padded.
 */
interface SelectionCase {
  readonly select: string;
  readonly withReplacement: Option.Option<string>;
}

/**
 * A part as the parts generator draws it.
 */
type PartCase =
  | { readonly kind: "item"; readonly required: Option.Option<string> }
  | { readonly kind: "include" }
  | { readonly kind: "ref" }
  | { readonly kind: "section"; readonly section: SectionCase };

/**
 * A section as the parts generator draws it: its selection, whether it orders, and its parts.
 */
interface SectionCase {
  readonly ordering: boolean;
  readonly parts: readonly PartCase[];
  readonly required: Option.Option<string>;
  readonly selection: Option.Option<SelectionCase>;
}

/**
 * Draw an optional value.
 *
 * @param gen - The value's generator.
 * @returns The generator of none or some value.
 */
const option =
  <A>(gen: Gen<A>): Gen<Option.Option<A>> =>
  (source) =>
    source.draw(boolean) ? Option.some(source.draw(gen)) : Option.none();

/**
 * Pad a lexical form with whitespace, as `collapse` admits.
 */
const padded =
  (core: Gen<string>): Gen<string> =>
  (source) =>
    `${source.draw(element(["", " ", "\t"]))}${source.draw(core)}${source.draw(element(["", " "]))}`;

/**
 * An `xs:boolean` form, padded.
 */
const booleanForm = padded(element(["true", "false", "1", "0"]));

/**
 * Draw a section of at most three parts, to a depth.
 *
 * @param depth - The depths left below it.
 * @returns The generator.
 */
const sectionCase =
  (depth: number): Gen<SectionCase> =>
  (source) => {
    const item: Gen<PartCase> = (s) => ({ kind: "item", required: s.draw(option(booleanForm)) });
    const nested: Gen<PartCase> = (s) => ({
      kind: "section",
      section: s.draw(sectionCase(depth - 1)),
    });
    const leaves: readonly [Gen<PartCase>, ...Gen<PartCase>[]] = [
      item,
      constant<PartCase>({ kind: "include" }),
      constant<PartCase>({ kind: "ref" }),
    ];

    return {
      ordering: source.draw(boolean),
      parts: source.draw(
        array(oneOf<PartCase>(depth > 0 ? [...leaves, nested] : leaves), { max: 3, min: 0 }),
      ),
      required: source.draw(option(booleanForm)),
      selection: source.draw(
        option((s) => ({
          select: s.draw(padded((t) => String(t.draw(int(-1, 4))))),
          withReplacement: s.draw(option(booleanForm)),
        })),
      ),
    };
  };

/**
 * Write a drawn section as an element.
 *
 * @param section - The drawn section.
 * @param name - Its identifier.
 * @returns The element.
 */
const sectionElement = (section: SectionCase, name: string): XdmClosedElement<Composed> => {
  const partElement = (part: PartCase, child: string): XdmClosedElement<Composed> => {
    if (part.kind === "item") {
      return el("qti-assessment-item-ref", [
        ["identifier", child],
        ["href", "i.xml"],
        ...Option.toArray(part.required).map((form) => ["required", form] as const),
      ]);
    }

    if (part.kind === "include") {
      return el("xi:include", [["href", "s.xml"]]);
    }

    return part.kind === "ref"
      ? el("qti-assessment-section-ref", [
          ["identifier", child],
          ["href", "s.xml"],
        ])
      : sectionElement(part.section, child);
  };

  return el(
    "qti-assessment-section",
    [
      ["identifier", name],
      ["visible", "true"],
      ...Option.toArray(section.required).map((form) => ["required", form] as const),
    ],
    [
      ...Option.toArray(section.selection).map((selection) =>
        el("qti-selection", [
          ["select", selection.select],
          ...Option.toArray(selection.withReplacement).map(
            (form) => ["with-replacement", form] as const,
          ),
        ]),
      ),
      ...(section.ordering ? [el("qti-ordering", [["shuffle", "true"]])] : []),
      ...section.parts.map((part, at) => partElement(part, `${name}.${String(at)}`)),
    ],
  );
};

/**
 * A test or section document of drawn sections, to depth 2.
 */
const partsDocuments: Gen<XdmDocument<Composed>> = (source) => {
  const sections = source.draw(array(sectionCase(2), { max: 2, min: 1 }));
  const asTest = source.draw(boolean);

  return documentOf(
    asTest
      ? el(
          "qti-assessment-test",
          [["identifier", "T"]],
          [
            el(
              "qti-test-part",
              [
                ["identifier", "P"],
                ["navigation-mode", "linear"],
                ["submission-mode", "individual"],
              ],
              sections.map((section, at) => sectionElement(section, `S${String(at)}`)),
            ),
          ],
        )
      : sectionElement(
          sections[0] ?? {
            ordering: false,
            parts: [],
            required: Option.none(),
            selection: Option.none(),
          },
          "S0",
        ),
  );
};

/**
 * Read a section's children's starts and kinds by a direct pre-order walk of the XDM tree, which
 * numbers the document node 0 and each element after its parent, as a tree's `start` does: no
 * character data is drawn, so every node is an element.
 *
 * @param doc - The document.
 * @returns Each section's start, with its parts' starts and whether each is required.
 */
const partsByWalk = (
  doc: XdmDocument<Composed>,
): ReadonlyMap<bigint, ReadonlyMap<bigint, boolean>> => {
  const found = new Map<bigint, Map<bigint, boolean>>();
  let next = 1n;
  const visit = (node: XdmClosedElement<Composed>): bigint => {
    const start = next;
    next += 1n;
    const parts = new Map<bigint, boolean>();
    for (const child of node.children) {
      if (child._tag === "element") {
        const at = visit(child);
        if (sectionParts.includes(child.kind)) {
          const form = child.attributes.find(
            (attribute) => attribute.name._tag === "closed" && attribute.name.handle === "required",
          );
          parts.set(
            at,
            form !== undefined && /^[\t\n\r ]*(?:true|1)[\t\n\r ]*$/u.test(form.lexical),
          );
        }
      }
    }
    if (node.kind === "qti-assessment-section") {
      found.set(start, parts);
    }

    return start;
  };
  visit(doc.root);

  return found;
};

/**
 * What the parts search must reach: a selection, a required part, an include and a nested section.
 */
type PartsFeature = "selection" | "required" | "include" | "nested";

describe("import/overlays/tests.ts, parts", () => {
  it.effect(
    "writes each section's SectionMember rows as its direct part children, each required as its attribute says, and its selection's counts as theirs",
    (ctx) =>
      // Oracle: a second implementation, a direct pre-order walk of the XDM tree (C15's parts:
      // the children SectionPart names), against flatten and the builder.
      // Bound: tests and section documents of 1 or 2 sections, each of at most 3 parts, to depth
      // 3, 300 cases.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(30),
            concurrency: 1,
            coverage: required<PartsFeature>(["selection", "required", "include", "nested"], {
              cases: 300,
              sense: notesOnly,
            }),
            draw: drawn(partsDocuments),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "a direct pre-order walk of the XDM tree",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "import/overlays-tests-parts",
          },
          (doc, c) =>
            Effect.sync(() => {
              const [rows] = rowsOfPackage([["t.xml", doc]]);
              assert.isDefined(rows);

              const expected = partsByWalk(doc);
              const starts = new Map(
                [...(rows?.Section.values() ?? [])].map(
                  ({ node, start }) => [node, start] as const,
                ),
              );
              const members = new Map<bigint, Map<bigint, boolean>>(
                [...starts.values()].map((start) => [start, new Map()] as const),
              );
              for (const member of rows?.SectionMember.values() ?? []) {
                const at = starts.get(member.section);
                assert.isDefined(at, "a member's section is a section");
                members.get(at ?? -1n)?.set(member.start, member.required);
                if (member.kind === "xi:include") {
                  c.note("include");
                }

                if (member.kind === "qti-assessment-section") {
                  c.note("nested");
                }

                if (member.required) {
                  c.note("required");
                }
              }

              assert.deepStrictEqual(members, expected);
              for (const selection of rows?.SectionSelection.values() ?? []) {
                c.note("selection");

                const section = [...(rows?.Section.values() ?? [])].find(
                  ({ node }) => node === selection.parent,
                );
                const parts = expected.get(section?.start ?? -1n) ?? new Map();
                assert.strictEqual(selection.members, BigInt(parts.size));
                assert.strictEqual(
                  selection.required,
                  BigInt([...parts.values()].filter(Boolean).length),
                );
              }
            }),
        ),
      ),
  );
});

/**
 * The characters a lexical form is written over in the pieces box.
 */
const piecesAlphabet = [" ", "\t", "\n", "a", "b"] as const;

/**
 * Every text of at most five characters over {@link piecesAlphabet}.
 */
const piecesTexts = array(element(piecesAlphabet), { max: 5, min: 0 });

describe("import/overlays/tests.ts, pieces", () => {
  it.effect("splits a lexical form into whitespace, its collapsed value and whitespace", (ctx) =>
    // Oracle: a universal one, the round trip `lead ‖ value ‖ trail = lexical`, with XML Schema
    // Part 2 §4.3.6's collapse as the specification of the value's ends.
    // Bound: every text of at most 5 characters over space, tab, line feed, a and b, 3,906.
    searched(
      ctx,
      exhaust(
        {
          box: "every text of at most 5 characters over space, tab, line feed, a and b",
          caseHang: Duration.seconds(10),
          coverage: requiredInSpace<"empty" | "padded" | "bare">(["empty", "padded", "bare"]),
          generator: piecesTexts,
          limit: 4000,
          literal: (characters) => JSON.stringify(characters.join("")),
          oracle: { kind: "universal", name: "the split's round trip, with collapse's ends" },
          suite: "import/overlays-tests-pieces",
        },
        (characters: readonly string[], c) =>
          Effect.sync(() => {
            const lexical = characters.join("");
            const { lead, trail, value } = piecesOf(lexical);
            if (value === "") {
              c.note("empty");
            } else {
              c.note(lexical === value ? "bare" : "padded");
            }

            assert.strictEqual(`${lead}${value}${trail}`, lexical);
            assert.match(lead, /^[\t\n\r ]*$/u);
            assert.match(trail, /^[\t\n\r ]*$/u);
            assert.isTrue(value === "" || /^\S(?:.*\S)?$/su.test(value), JSON.stringify(value));
            assert.strictEqual(value === "", /^[\t\n\r ]*$/u.test(lexical));
          }),
      ),
    ),
  );
});

/**
 * The characters a `select` is written over in the selections box: whitespace, a sign, a digit, a
 * point and a letter, so the box holds integers, bare and padded, and forms that name none.
 */
const selectAlphabet = [" ", "\t", "+", "1", ".", "a"] as const;

/**
 * A test of one part holding one section of one item ref, under a `qti-selection` that writes a
 * `select` or none.
 *
 * @param select - The `select` as written, none for a selection that writes none.
 * @returns The document.
 */
const selectionDocument = (select: Option.Option<string>): XdmDocument<Composed> =>
  documentOf(
    el(
      "qti-assessment-test",
      [["identifier", "T"]],
      [
        el(
          "qti-test-part",
          [
            ["identifier", "P"],
            ["navigation-mode", "linear"],
            ["submission-mode", "individual"],
          ],
          [
            el(
              "qti-assessment-section",
              [
                ["identifier", "S"],
                ["visible", "true"],
              ],
              [
                el(
                  "qti-selection",
                  Option.toArray(select).map((form) => ["select", form] as const),
                ),
                el("qti-assessment-item-ref", [
                  ["identifier", "I"],
                  ["href", "i.xml"],
                ]),
              ],
            ),
          ],
        ),
      ],
    ),
  );

describe("import/overlays/tests.ts, selections", () => {
  it.effect(
    "writes a SectionSelection row for every selection that writes a select, whatever the form, so the database judges the form",
    (ctx) =>
      // Oracle: a universal one, the row restating the attribute as written: one row exactly
      // where a `select` is written (AL3 refuses one that writes none), its lexical form the
      // attribute's, its form that form with XML Schema Part 2 §4.3.6's collapse taken off its
      // ends, and `lead ‖ form ‖ trail = lexical` (`E1_derived`). Whether the form names an
      // integer is `SelectForm`'s pattern law's to judge, and the attribute's value domain's, so
      // a form that names none has its row too.
      // Bound: a selection that writes no select, and every select of at most 3 characters over
      // space, tab, plus, 1, point and a, 260.
      searched(
        ctx,
        exhaust(
          {
            box: "a selection's select, unwritten or of at most 3 characters over space, tab, +, 1, . and a",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"unwritten" | "integer" | "no integer">([
              "unwritten",
              "integer",
              "no integer",
            ]),
            generator: option(array(element(selectAlphabet), { max: 3, min: 0 })),
            limit: 300,
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "the selection's row restating its select as written, with collapse's ends",
            },
            suite: "import/overlays-tests-selections",
          },
          (characters: Option.Option<readonly string[]>, c) =>
            Effect.sync(() => {
              const select = characters.pipe(Option.map((written) => written.join("")));
              const [rows] = rowsOfPackage([["t.xml", selectionDocument(select)]]);
              assert.isDefined(rows);

              const selections = [...(rows?.SectionSelection.values() ?? [])];
              Option.match(select, {
                onNone: () => {
                  c.note("unwritten");
                  assert.lengthOf(selections, 0);
                },
                onSome: (lexical) => {
                  const form = lexical.replaceAll(/^[\t\n\r ]+|[\t\n\r ]+$/gu, "");
                  // xs:integer's lexical space (XML Schema Part 2 §3.3.13.1), which `select`'s
                  // xs:int narrows: the class the builder once wrote rows for, and the class it
                  // dropped.
                  c.note(/^[+-]?[0-9]+$/u.test(form) ? "integer" : "no integer");
                  assert.lengthOf(selections, 1, JSON.stringify(lexical));
                  for (const row of selections) {
                    assert.strictEqual(row.selectLexical, lexical);
                    assert.strictEqual(row.selectForm, form);
                    assert.strictEqual(
                      `${row.selectLead}${row.selectForm}${row.selectTrail}`,
                      lexical,
                    );
                    assert.match(row.selectLead, /^[\t\n\r ]*$/u);
                    assert.match(row.selectTrail, /^[\t\n\r ]*$/u);
                  }
                },
              });
            }),
        ),
      ),
  );
});

/**
 * An identifier as the names box writes it: unwritten, bare, padded, or whitespace alone.
 */
const identifierForms: readonly [Option.Option<string>, ...Option.Option<string>[]] = [
  Option.none(),
  Option.some("a"),
  Option.some(" a\t"),
  Option.some("  "),
];

/**
 * A test and an item whose names and stimulus refs each write one of {@link identifierForms}: a
 * test part holding a section that holds an item ref and a section ref, and an item holding two
 * stimulus refs.
 *
 * @param forms - The six elements' identifiers, in document order.
 * @returns The two documents by path.
 */
const namesDocuments = (
  forms: readonly Option.Option<string>[],
): readonly (readonly [string, XdmDocument<Composed>])[] => {
  const written = (at: number): readonly (readonly [ClosedName<Composed>, string])[] =>
    Option.toArray(Option.flatten(Arr.get(forms, at))).map((form) => ["identifier", form] as const);

  return [
    [
      "t.xml",
      documentOf(
        el(
          "qti-assessment-test",
          [["identifier", "T"]],
          [
            el(
              "qti-test-part",
              [...written(0), ["navigation-mode", "linear"], ["submission-mode", "individual"]],
              [
                el(
                  "qti-assessment-section",
                  [...written(1), ["visible", "true"]],
                  [
                    el("qti-assessment-item-ref", [...written(2), ["href", "i.xml"]]),
                    el("qti-assessment-section-ref", [...written(3), ["href", "s.xml"]]),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    ],
    [
      "i.xml",
      documentOf(
        el(
          "qti-assessment-item",
          [["identifier", "I"]],
          [
            el("qti-assessment-stimulus-ref", [...written(4), ["href", "a.xml"]]),
            el("qti-assessment-stimulus-ref", [...written(5), ["href", "b.xml"]]),
          ],
        ),
      ),
    ],
  ];
};

/**
 * The kinds whose identifier a `Named` or a `StimulusRef` row holds.
 */
const identifiedKinds: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
  "qti-assessment-stimulus-ref",
  "qti-test-part",
]);

/**
 * Read each identified element's collapsed identifier by a direct pre-order walk of the XDM tree,
 * numbered as {@link partsByWalk} numbers it: none for one that writes no identifier.
 *
 * @param doc - The document.
 * @returns Each identified element's start, with its identifier collapsed, where it writes one.
 */
const identifiersByWalk = (doc: XdmDocument<Composed>): ReadonlyMap<bigint, string> => {
  const found = new Map<bigint, string>();
  let next = 1n;
  const visit = (node: XdmClosedElement<Composed>): void => {
    const start = next;
    next += 1n;
    const form = node.attributes.find(
      (attribute) => attribute.name._tag === "closed" && attribute.name.handle === "identifier",
    );
    if (form !== undefined && identifiedKinds.has(node.kind)) {
      found.set(start, form.lexical.replaceAll(/^[\t\n\r ]+|[\t\n\r ]+$/gu, ""));
    }

    for (const child of node.children) {
      if (child._tag === "element") {
        visit(child);
      }
    }
  };
  visit(doc.root);

  return found;
};

describe("import/overlays/tests.ts, names", () => {
  it.effect(
    "writes a Named or StimulusRef row exactly where its element writes an identifier, holding it collapsed",
    (ctx) =>
      // Oracle: a second implementation, a direct pre-order walk of the XDM tree, with XML Schema
      // Part 2 §4.3.6's collapse, and reading 147: an element that writes no identifier names
      // nothing, so it has no row.
      // Bound: a test of a part, a section, an item ref and a section ref, and an item of two
      // stimulus refs, each identifier unwritten, bare, padded or whitespace alone, 4,096.
      searched(
        ctx,
        exhaust(
          {
            box: "a test's four names and an item's two stimulus refs, each identifier unwritten, bare, padded or blank",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"unwritten" | "written">(["unwritten", "written"]),
            generator: array(element(identifierForms), { max: 6, min: 6 }),
            limit: 5000,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "a direct pre-order walk of the XDM tree, with collapse",
            },
            suite: "import/overlays-tests-names",
          },
          (forms: readonly Option.Option<string>[], c) =>
            Effect.sync(() => {
              for (const form of forms) {
                c.note(Option.isSome(form) ? "written" : "unwritten");
              }

              const documents = namesDocuments(forms);
              assert.deepStrictEqual(
                rowsOfPackage(documents).map(
                  (rows) =>
                    new Map(
                      [...rows.Named.values(), ...rows.StimulusRef.values()].map(
                        ({ identifier, start }) => [start, identifier] as const,
                      ),
                    ),
                ),
                documents.map(([, doc]) => identifiersByWalk(doc)),
              );
            }),
        ),
      ),
  );
});

/**
 * The paths a test of the hrefs box sits at: the package root and two directories below it.
 */
const hrefDocuments = ["t.xml", "d/t.xml", "d/e/t.xml"] as const;

/**
 * The item ref hrefs of the box: relative ones that resolve or climb out of the package, external
 * ones with a scheme, an authority or a leading slash, one with params, one padded, one
 * percent-encoded, and the empty one.
 */
const hrefForms = [
  "i.xml",
  "../i.xml",
  "../../i.xml",
  "./a/../i.xml",
  "http://h/x.xml",
  "//h/x.xml",
  "/abs.xml",
  "mailto:x",
  "i.xml?q=1#f",
  " i.xml ",
  "%69.xml",
  "",
] as const;

describe("import/overlays/tests.ts, hrefs", () => {
  it.effect(
    "compares an item ref's href by its entry path where it resolves, and by its path as written otherwise, at any directory",
    (ctx) =>
      // Oracle: a second implementation, the law oracle's own RFC 3986 resolver and its compared
      // path (`#pantry/test/resolution.ts`), with reading 102: an href that resolves is compared
      // by its entry path, and one that does not by its path as written, its params aside, as a
      // manifest href is.
      // Bound: a test at the root and two directories below it, its item ref writing each of 12
      // hrefs, 36 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "a test at t.xml, d/t.xml or d/e/t.xml whose item ref writes each of 12 hrefs",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"entry" | "as written">(["entry", "as written"]),
            generator: (source) => ({
              document: source.draw(element(hrefDocuments)),
              href: source.draw(element(hrefForms)),
            }),
            limit: 100,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's RFC 3986 resolver and its compared path",
            },
            suite: "import/overlays-tests-hrefs",
          },
          ({ document, href }, c) =>
            Effect.sync(() => {
              const resolution = resolveAttribute({
                bases: [],
                document,
                lexical: href,
                srcset: false,
                whiteSpace: "collapse",
              });
              const resolved = resolution.scope === "entry";
              c.note(resolved ? "entry" : "as written");

              const test = documentOf(
                el(
                  "qti-assessment-test",
                  [["identifier", "T"]],
                  [
                    el(
                      "qti-test-part",
                      [
                        ["identifier", "P"],
                        ["navigation-mode", "linear"],
                        ["submission-mode", "individual"],
                      ],
                      [
                        el(
                          "qti-assessment-section",
                          [
                            ["identifier", "S"],
                            ["visible", "true"],
                          ],
                          [
                            el("qti-assessment-item-ref", [
                              ["identifier", "I"],
                              ["href", href],
                            ]),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              );
              assert.deepStrictEqual(
                idsOfPackage([[document, test]]).flatMap(([tree, ids]) =>
                  itemRefPathsOf(tree, ids).map(({ path, resolved: entry }) => ({ entry, path })),
                ),
                [
                  {
                    entry: resolved,
                    path: comparedPath(resolution, oracleValueOf(href, "collapse")),
                  },
                ],
              );
            }),
        ),
      ),
  );
});

/**
 * The kinds a rule of an item ref or a section branches to.
 */
const sectionTargets: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
]);

/**
 * State `Branch_target`'s judgment of a target's name on the host: its kind and part, and no item
 * ref a replacement can repeat.
 *
 * @param b - The target.
 * @returns Whether the name is admitted.
 */
const admitted = (b: Addition<typeof BranchTarget>): boolean =>
  (b.ownerKind === "qti-test-part"
    ? b.targetKind === "qti-test-part"
    : sectionTargets.has(b.targetKind) && b.targetPart === b.ownerPart) &&
  !(b.targetKind === "qti-assessment-item-ref" && b.targetReplaced);

/**
 * State `Branch_target` on the host: the name admitted, and an instance that holds the rule's,
 * reached through its child `via`.
 *
 * @param b - The target.
 * @returns Whether the law accepts it.
 */
const targetAccepts = (b: Addition<typeof BranchTarget>): boolean => {
  const above = b.targetInstanceStart <= b.instanceStart && b.instanceStart < b.targetInstanceEnd;
  const through =
    b.targetInstance === b.instance
      ? b.via === b.instance
      : b.viaParent === b.targetInstance &&
        b.viaStart <= b.instanceStart &&
        b.instanceStart < b.viaEnd;

  return admitted(b) && above && through;
};

/**
 * State the shuffle's `Branch_forward` on the host: its common element holds the source's point,
 * its child `branch` holds the target and not that point, and the common element's order is drawn.
 *
 * @param s - The shuffle.
 * @returns Whether the law accepts it.
 */
const shuffleAccepts = (s: Addition<typeof BranchShuffle>): boolean => {
  const point = s.targetInstance === s.instance ? s.ownerStart : s.viaSiteStart;
  const holds = (start: bigint, end: bigint) => start <= point && point < end;

  return (
    holds(s.commonStart, s.commonEnd) &&
    s.branchParent === s.common &&
    s.branchStart <= s.targetStart &&
    s.targetStart < s.branchEnd &&
    !holds(s.branchStart, s.branchEnd) &&
    s.commonMixes
  );
};

/**
 * State the target's `Branch_forward` on the host: a name `Branch_target` does not admit is that
 * law's alone; any other lies after the source's end, or the two are unnested and a shuffle
 * orders them.
 *
 * @param b - The target.
 * @param shuffles - Its shuffles, as `BranchTarget.shuffles` counts them.
 * @returns Whether the law accepts it.
 */
const forwardAccepts = (b: Addition<typeof BranchTarget>, shuffles: number): boolean => {
  const same = b.targetInstance === b.instance;
  const point = same ? b.ownerStart : b.viaSiteStart;
  const holds = (start: bigint, end: bigint) => start <= point && point < end;
  const forward = same ? b.targetStart >= b.ownerEnd : b.targetStart > b.viaSiteStart;
  const nested =
    holds(b.targetStart, b.targetEnd) ||
    (same && b.ownerStart <= b.targetStart && b.targetStart < b.ownerEnd);

  return !admitted(b) || forward || (b.ownerKind !== "qti-test-part" && !nested && shuffles === 1);
};

/**
 * The rule PostgreSQL refuses one resolution under, by the laws restated on the host over its
 * target and shuffle: no target breaks the resolution's existence law, "Branch target"; a target
 * breaks `Branch_target` or `Branch_forward`, never both; a shuffle breaks its own
 * `Branch_forward`.
 *
 * @param target - The resolution's target, none where the builder wrote none.
 * @param shuffle - Its shuffle, none where the builder wrote none.
 * @returns The rule, or none where every law accepts it.
 */
const rowRule = (
  target: Addition<typeof BranchTarget> | undefined,
  shuffle: Addition<typeof BranchShuffle> | undefined,
): "branch-forward" | "branch-target" | undefined => {
  if (target === undefined) {
    assert.isUndefined(shuffle, "a shuffle without a target");

    return "branch-target";
  }

  const targeted = targetAccepts(target);
  const forwarded =
    forwardAccepts(target, shuffle === undefined ? 0 : 1) &&
    (shuffle === undefined || shuffleAccepts(shuffle));
  assert.isTrue(targeted || forwarded, "a target breaks both branch laws");
  if (!targeted) {
    return "branch-target";
  }

  return forwarded ? undefined : "branch-forward";
};

/**
 * A package of the assembly box: the sites the test's section and each of two section documents
 * hold, each naming `a.xml`, `b.xml` or the absent `z.xml`, and the identifiers of the two
 * section documents' item refs.
 */
interface AssemblyCase {
  readonly items: readonly [string, string];
  readonly sites: readonly [readonly string[], readonly string[], readonly string[]];
}

/**
 * The paths a site of the box may name.
 */
const targets = ["a.xml", "b.xml", "z.xml"] as const;

/**
 * Every package of the box: at most two sites per document, over three paths, and each section
 * document's item ref named `X` or `Y`.
 */
const assemblyCases: Gen<AssemblyCase> = (source) => {
  const sites = () => source.draw(array(element(targets), { max: 2, min: 0 }));

  return {
    items: [source.draw(element(["X", "Y"])), source.draw(element(["X", "Y"]))],
    sites: [sites(), sites(), sites()],
  };
};

/**
 * Write a box package's documents: the test `t.xml`, its part holding a section of its sites and a
 * section of one item ref `T` with a branch rule to nothing, and each section document `a.xml`,
 * `b.xml` a root section of one item ref, whose branch rule names `T`, then its sites.
 *
 * @param box - The package.
 * @returns The documents by path.
 */
const assemblyDocuments = (
  box: AssemblyCase,
): readonly (readonly [string, XdmDocument<Composed>])[] => {
  const site = (path: string, at: number, owner: string) =>
    el("qti-assessment-section-ref", [
      ["identifier", `${owner}r${String(at)}`],
      ["href", path],
    ]);
  const sectionDoc = (name: string, item: string, sites: readonly string[]) =>
    documentOf(
      el(
        "qti-assessment-section",
        [
          ["identifier", name],
          ["visible", "true"],
        ],
        [
          el(
            "qti-assessment-item-ref",
            [
              ["identifier", item],
              ["href", "i.xml"],
            ],
            [el("qti-branch-rule", [["target", "T"]])],
          ),
          ...sites.map((path, at) => site(path, at, name)),
        ],
      ),
    );

  return [
    [
      "t.xml",
      documentOf(
        el(
          "qti-assessment-test",
          [["identifier", "TT"]],
          [
            el(
              "qti-test-part",
              [
                ["identifier", "P"],
                ["navigation-mode", "linear"],
                ["submission-mode", "individual"],
              ],
              [
                el(
                  "qti-assessment-section",
                  [
                    ["identifier", "S0"],
                    ["visible", "true"],
                  ],
                  box.sites[0].map((path, at) => site(path, at, "S0")),
                ),
                el(
                  "qti-assessment-section",
                  [
                    ["identifier", "S1"],
                    ["visible", "true"],
                  ],
                  [
                    el("qti-assessment-item-ref", [
                      ["identifier", "T"],
                      ["href", "i.xml"],
                    ]),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    ],
    ["a.xml", sectionDoc("A", box.items[0], box.sites[1])],
    ["b.xml", sectionDoc("B", box.items[1], box.sites[2])],
  ];
};

/**
 * Decide whether a box package's inclusion graph has a cycle or a dangling site.
 *
 * @param box - The package.
 * @returns Whether some document's sites, followed, return to a document on their chain, or name
 *   no document.
 */
const brokenGraph = (box: AssemblyCase): boolean => {
  const edges: ReadonlyMap<string, readonly string[]> = new Map([
    ["t.xml", box.sites[0]],
    ["a.xml", box.sites[1]],
    ["b.xml", box.sites[2]],
  ]);
  const walk = (at: string, chain: readonly string[]): boolean =>
    (edges.get(at) ?? []).some(
      (next) => !edges.has(next) || chain.includes(next) || walk(next, [...chain, next]),
    );

  return [...edges.keys()].some((root) => walk(root, [root]));
};

/**
 * Visit every instance of an assembly in pre-order, with its interval in the tree's pre-order.
 *
 * @param rows - The assemblies.
 * @returns Each instance with its start, end and parent.
 */
const instancesOf = (rows: AssembledRows) => {
  const out: {
    readonly end: number;
    readonly instance: InstanceMember;
    readonly parent: NodeId | undefined;
    readonly start: number;
  }[] = [];
  for (const root of rows.Instance.values()) {
    let next = 0;
    const visit = (instance: InstanceMember, parent?: NodeId): void => {
      const start = next;
      next += 1;
      const at = out.length;
      out.push({ end: 0, instance, parent, start });
      for (const child of instance.children) {
        visit(child, instance.id);
      }
      out[at] = { end: next, instance, parent, start };
    };
    visit(root);
  }

  return out;
};

/**
 * List the identifiers a box package's section document writes: its root section's, its item
 * ref's and its sites'.
 *
 * @param name - The root section's identifier.
 * @param item - The item ref's.
 * @param sites - The sites' paths.
 * @returns The identifiers.
 */
const sectionNames = (name: string, item: string, sites: readonly string[]): readonly string[] => [
  name,
  item,
  ...sites.map((_, at) => `${name}r${String(at)}`),
];

/**
 * List the identifiers of a box package's test's distinct written elements: the test's own, and
 * each section document's its sites reach, once however often it is placed (reading 86).
 *
 * @param box - The package, whose graph has no cycle or dangling site.
 * @returns The identifiers, one per written element.
 */
const writtenOf = (box: AssemblyCase): readonly string[] => {
  const sitesOf = new Map([
    ["t.xml", box.sites[0]],
    ["a.xml", box.sites[1]],
    ["b.xml", box.sites[2]],
  ]);
  const reached = new Set<string>(["t.xml"]);
  const pending = ["t.xml"];
  for (let at = pending.pop(); at !== undefined; at = pending.pop()) {
    for (const next of sitesOf.get(at) ?? []) {
      if (!reached.has(next)) {
        reached.add(next);
        pending.push(next);
      }
    }
  }

  return [
    "P",
    "S0",
    "S1",
    "T",
    ...box.sites[0].map((_, at) => `S0r${String(at)}`),
    ...(reached.has("a.xml") ? sectionNames("A", box.items[0], box.sites[1]) : []),
    ...(reached.has("b.xml") ? sectionNames("B", box.items[1], box.sites[2]) : []),
  ];
};

/**
 * Assert that each resolution of a placed branch rule reads its instances' intervals as the tree's
 * own pre-order gives them, and that the branch laws accept it: every placed rule of the box names
 * `T`, after the site that places its document.
 *
 * @param assembled - The assemblies.
 * @param instances - Their instances, with their intervals.
 */
const assertPlacedRules = (
  assembled: AssembledRows,
  instances: ReturnType<typeof instancesOf>,
): void => {
  const intervals = new Map(
    instances.map(({ end, instance, start }) => [
      instance.id,
      { end: BigInt(end), start: BigInt(start) },
    ]),
  );
  assert.strictEqual(assembled.BranchTarget.size, assembled.BranchResolution.size);
  for (const [at, resolution] of assembled.BranchResolution) {
    const resolved = assembled.BranchTarget.get(at);
    assert.isDefined(resolved, "a placed rule naming T resolves");
    if (resolved === undefined) {
      continue;
    }

    const target = intervals.get(resolved.targetInstance);
    const via = intervals.get(resolved.via);
    assert.strictEqual(resolved.instanceStart, intervals.get(resolution.instance)?.start);
    assert.strictEqual(resolved.targetInstanceStart, target?.start);
    assert.strictEqual(resolved.targetInstanceEnd, target?.end);
    assert.strictEqual(resolved.viaStart, via?.start);
    assert.strictEqual(resolved.viaEnd, via?.end);
    assert.isUndefined(
      rowRule(resolved, assembled.BranchShuffle.get(at)),
      "a placed rule naming T after its site",
    );
  }
};

/**
 * What the assembly box must reach.
 */
type AssemblySituation =
  | "acyclic"
  | "broken"
  | "placed twice"
  | "identifiers clash"
  | "identifiers distinct";

describe("import/overlays/tests.ts, the assembly", { timeout: searchTimeout }, () => {
  it.effect(
    "holds one child per site exactly where no inclusion returns to its chain or dangles, places each site's target, keys each test's names exactly where its written elements' identifiers are distinct, and resolves a placed branch rule over the tree's own intervals",
    (ctx) =>
      // Oracle: a second implementation per property: a depth-first walk of the inclusion graph
      // (the oracle's Inclusion cycle, over every listed document); the documents a breadth-first
      // walk from the test reaches, each written element once (reading 86); and a pre-order walk
      // of the nested trees for the intervals grizzle draws.
      // Bound: every package of a test and two section documents, each with at most 2 section
      // refs over a.xml, b.xml and z.xml, and each section document's item ref named X or Y,
      // 13³ × 4 = 8,788.
      searched(
        ctx,
        exhaust(
          {
            box: "a test and two section documents, at most 2 sites each over 3 paths, item refs X or Y",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<AssemblySituation>([
              "acyclic",
              "broken",
              "placed twice",
              "identifiers clash",
              "identifiers distinct",
            ]),
            generator: assemblyCases,
            limit: 9000,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "walks of the inclusion graph, the test's reach and the nested trees",
            },
            suite: "import/overlays-tests-assembly",
          },
          (box: AssemblyCase, c) =>
            Effect.sync(() => {
              const documents = rowsOfPackage(assemblyDocuments(box));
              let counter = 0;
              const assembled = assembledRowsOf(documents, () => {
                counter += 1;

                return `00000000-0000-4000-9000-${counter.toString(16).padStart(12, "0")}`;
              });
              const byDocument = new Map(
                documents.flatMap((rows) =>
                  [...rows.TestDocument.values()].map((row) => [row.node, rows] as const),
                ),
              );
              // A site's target is the document its href names, a row only where it names one, so
              // no sentinel stands in for a missing document and "Include target" refuses the rest
              // (reading 115).
              const listed = new Map(
                documents.flatMap((rows) =>
                  [...rows.TestDocument.values()].map((row) => [row.path, row.node] as const),
                ),
              );
              for (const rows of documents) {
                const pathOf = (node: string) => rows.SitePath.get(node)?.path;
                assert.deepStrictEqual(
                  [...rows.Site.values()].map((site) => [
                    pathOf(site.node),
                    rows.SiteTarget.get(site.node)?.target,
                  ]),
                  [...rows.Site.values()].map((site) => {
                    const path = pathOf(site.node);

                    return [path, path === undefined ? undefined : listed.get(path)];
                  }),
                  "each site's target, none where its href names no listed document",
                );
                assert.deepStrictEqual(
                  [...rows.SitePath.keys()].filter((node) => !rows.Site.has(node)),
                  [],
                  "a path of no site",
                );
                assert.deepStrictEqual(
                  [...rows.SiteTarget.keys()].filter((node) => !rows.Site.has(node)),
                  [],
                  "a target of no site",
                );
              }
              const instances = instancesOf(assembled);
              const counts = instances.every(
                ({ instance }) =>
                  instance.children.length === (byDocument.get(instance.document)?.Site.size ?? -1),
              );
              const broken = brokenGraph(box);
              c.note(broken ? "broken" : "acyclic");

              assert.strictEqual(
                counts,
                !broken,
                "one child per site exactly where no cycle or dangling site",
              );

              for (const { instance } of instances) {
                const siteTargets = byDocument.get(instance.document)?.SiteTarget;
                for (const child of instance.children) {
                  assert.strictEqual(siteTargets?.get(child.site)?.target, child.document);
                }
                assert.strictEqual(
                  new Set(instance.children.map(({ site }) => site)).size,
                  instance.children.length,
                );
              }

              if (broken) {
                return;
              }

              const all = box.sites.flat();
              if (all.length > new Set(all).size) {
                c.note("placed twice");
              }

              const written = writtenOf(box);
              const distinct = new Set(written).size === written.length;
              c.note(distinct ? "identifiers distinct" : "identifiers clash");

              const test = idsOf(0)(0);
              const names = [...assembled.AssembledName.values()]
                .filter(({ assembly }) => assembly === test)
                .map(({ identifier }) => identifier);

              assert.deepStrictEqual(
                names.toSorted(),
                written.toSorted(),
                "the projection holds each written element once",
              );
              assert.strictEqual(new Set(names).size === names.length, distinct);

              assertPlacedRules(assembled, instances);
            }),
        ),
      ),
  );
});

/**
 * A branch rule of the jump box: its owner, its target, and the first section's shuffle and
 * replacement.
 */
interface JumpCase {
  readonly owner: "I1" | "I2" | "S" | "P1";
  readonly replaced: boolean;
  readonly shuffle: boolean;
  readonly target: "I1" | "I2" | "I3" | "S" | "S2" | "P1" | "P2" | "EXIT_TEST" | "Q";
}

/**
 * Every case of the jump box.
 */
const jumpCases: Gen<JumpCase> = (source) => ({
  owner: source.draw(element(["I1", "I2", "S", "P1"] as const)),
  replaced: source.draw(boolean),
  shuffle: source.draw(boolean),
  target: source.draw(
    element(["I1", "I2", "I3", "S", "S2", "P1", "P2", "EXIT_TEST", "Q"] as const),
  ),
});

/**
 * Write a jump case's test: part P1 holding section S (its ordering shuffling or not, its
 * selection with replacement or not) of item refs I1 and I2, then part P2 holding section S2 of
 * item ref I3, the owner holding the one branch rule.
 *
 * @param jump - The case.
 * @returns The test document.
 */
const jumpDocument = (jump: JumpCase): XdmDocument<Composed> => {
  const rule = (name: string) =>
    jump.owner === name ? [el("qti-branch-rule", [["target", jump.target]])] : [];
  const item = (name: string) =>
    el(
      "qti-assessment-item-ref",
      [
        ["identifier", name],
        ["href", "i.xml"],
      ],
      rule(name),
    );
  const part = (name: string, children: readonly XdmChild<Composed>[]) =>
    el(
      "qti-test-part",
      [
        ["identifier", name],
        ["navigation-mode", "linear"],
        ["submission-mode", "individual"],
      ],
      [...rule(name), ...children],
    );

  return documentOf(
    el(
      "qti-assessment-test",
      [["identifier", "T"]],
      [
        part("P1", [
          el(
            "qti-assessment-section",
            [
              ["identifier", "S"],
              ["visible", "true"],
            ],
            [
              ...rule("S"),
              el("qti-selection", [
                ["select", "2"],
                ["with-replacement", jump.replaced ? "true" : "false"],
              ]),
              el("qti-ordering", [["shuffle", jump.shuffle ? "true" : "false"]]),
              item("I1"),
              item("I2"),
            ],
          ),
        ]),
        part("P2", [
          el(
            "qti-assessment-section",
            [
              ["identifier", "S2"],
              ["visible", "true"],
            ],
            [item("I3")],
          ),
        ]),
      ],
    ),
  );
};

/**
 * Each element's parent in the jump box's test.
 */
const jumpParents: ReadonlyMap<string, string> = new Map([
  ["I1", "S"],
  ["I2", "S"],
  ["I3", "S2"],
  ["P1", "T"],
  ["P2", "T"],
  ["S", "P1"],
  ["S2", "P2"],
]);

/**
 * Read an element's ancestors in the jump box's test, nearest first.
 *
 * @param name - The element's identifier.
 * @returns Its ancestors' identifiers.
 */
const ancestors = (name: string): readonly string[] => {
  const up = jumpParents.get(name);

  return up === undefined ? [] : [up, ...ancestors(up)];
};

/**
 * Whether an element of the jump box is a test part.
 *
 * @param name - The element's identifier.
 * @returns Whether it is.
 */
const isPart = (name: string): boolean => name === "P1" || name === "P2";

/**
 * Judge a jump case by reading 87's bullets, over the case's own structure, and name the law that
 * refuses it: a reserved exit is valid; a target that names nothing, a test part's rule naming no
 * test part, or another's naming a test part, an element of another part or an item ref a
 * replacement can repeat breaks "Branch target"; a test part's rule naming no later test part, or
 * another's naming an element it nests with or one before its end that the section holding both
 * does not shuffle, breaks "Branch forward".
 *
 * @param jump - The case.
 * @returns The rule reading 87 refuses it under, or none where the rule is valid.
 */
const readingRule = (jump: JumpCase): "branch-forward" | "branch-target" | undefined => {
  if (exits.some((exit) => exit === jump.target)) {
    return undefined;
  }

  const order = ["P1", "S", "I1", "I2", "P2", "S2", "I3"];
  const partOf = (name: string) => (isPart(name) ? name : ancestors(name).find(isPart));
  const { target } = jump;
  if (!order.includes(target)) {
    return "branch-target";
  }

  if (isPart(jump.owner)) {
    if (!isPart(target)) {
      return "branch-target";
    }

    return order.indexOf(target) > order.indexOf(jump.owner) ? undefined : "branch-forward";
  }

  if (isPart(target) || partOf(target) !== partOf(jump.owner)) {
    return "branch-target";
  }

  if (target.startsWith("I") && jump.replaced && ancestors(target).includes("S")) {
    return "branch-target";
  }

  const nested =
    target === jump.owner ||
    ancestors(target).includes(jump.owner) ||
    ancestors(jump.owner).includes(target);
  if (nested) {
    return "branch-forward";
  }

  const ownerEnd = Math.max(
    order.indexOf(jump.owner),
    ...order
      .filter((name) => ancestors(name).includes(jump.owner))
      .map((name) => order.indexOf(name)),
  );
  const common = ancestors(target).find((name) => ancestors(jump.owner).includes(name));

  return order.indexOf(target) > ownerEnd || (common === "S" && jump.shuffle)
    ? undefined
    : "branch-forward";
};

describe("import/overlays/tests.ts, the jumps", () => {
  it.effect(
    "accepts a branch rule by Branch_target and Branch_forward exactly where reading 87 does, each resolution copying the rows its containments name",
    (ctx) =>
      // Oracle: the specification as a checker, reading 87's bullets over the case's structure,
      // against the laws restated on the host over the builder's resolution; and a second
      // implementation of the containments, the builder's names by key.
      // Bound: every owner of 4, target of 9, shuffle and replacement, 144.
      searched(
        ctx,
        exhaust(
          {
            box: "every owner of 4, target of 9 (an exit and a missing name among them), shuffle and replacement",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<"accepted" | "refused" | "shuffled backward" | "exit">([
              "accepted",
              "refused",
              "shuffled backward",
              "exit",
            ]),
            generator: jumpCases,
            limit: 200,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "reading 87's bullets" },
            suite: "import/overlays-tests-jumps",
          },
          (jump: JumpCase, c) =>
            Effect.sync(() => {
              const documents = rowsOfPackage([["t.xml", jumpDocument(jump)]]);
              const assembled = assembledRowsOf(documents, () => idOf(999));
              const expected = readingRule(jump);
              const resolutions = [...assembled.BranchResolution.values()];
              const resolvedTargets = [...assembled.BranchTarget.values()];
              const shuffles = [...assembled.BranchShuffle.values()];
              if (exits.some((exit) => exit === jump.target)) {
                c.note("exit");
                assert.deepStrictEqual(resolutions, [], "an exit resolves nothing");
                assert.deepStrictEqual(resolvedTargets, [], "an exit has no target");
                assert.deepStrictEqual(shuffles, [], "an exit has no shuffle");

                return;
              }

              assert.strictEqual(resolutions.length, 1);
              assert.isAtMost(resolvedTargets.length, 1);
              assert.isAtMost(shuffles.length, 1);

              const [resolution] = resolutions;
              assert.isDefined(resolution);
              if (resolution === undefined) {
                return;
              }

              const [target] = resolvedTargets;
              const [shuffle] = shuffles;
              const rule = rowRule(target, shuffle);
              c.note(rule === undefined ? "accepted" : "refused");
              if (rule === undefined && jump.owner === "I2" && jump.target === "I1") {
                c.note("shuffled backward");
              }

              assert.strictEqual(rule, expected, Formatter.format(jump));

              const name = (instance: string, node: string) =>
                assembled.InstanceName.get(keyOf([instance, node]));
              assert.strictEqual(
                name(resolution.instance, resolution.owner)?.end,
                resolution.ownerEnd,
              );
              if (target !== undefined) {
                const named = name(target.targetInstance, target.targetNode);
                assert.isDefined(named, "a target names an InstanceName");
                assert.strictEqual(named?.start, target.targetStart);
                assert.strictEqual(named?.kind, target.targetKind);
                assert.strictEqual(named?.identifier, target.target);
                assert.strictEqual(target.instance, resolution.instance);
                assert.strictEqual(target.rule, resolution.rule);
                assert.strictEqual(target.ownerEnd, resolution.ownerEnd);
              }

              if (shuffle !== undefined) {
                const common = name(shuffle.targetInstance, shuffle.common);
                const branch = name(shuffle.targetInstance, shuffle.branch);
                assert.isDefined(common, "a shuffle's common element names an InstanceName");
                assert.isDefined(branch, "a shuffle's branch names an InstanceName");
                assert.strictEqual(common?.mixes, shuffle.commonMixes);
                assert.strictEqual(branch?.start, shuffle.branchStart);
                assert.strictEqual(shuffle.targetStart, target?.targetStart);
              }
            }),
        ),
      ),
  );
});
