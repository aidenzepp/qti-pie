/**
 * The test layer's overlay builders' free tests: the rows `rowsOf` and `assembledRowsOf` write
 * restate the documents, as a direct walk of each XDM tree reads them, and the laws over those
 * rows, restated on the host, refuse exactly what the specification refuses.
 *
 * - **Parts** (C15): each section's `SectionMember` rows are its direct part children, and its
 *   selection's counts are theirs.
 * - **Pieces**: a lexical form's split restates it, its value collapsed.
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
import { Duration, Effect, Formatter, Option } from "effect";
import { assembledRowsOf, keyOf, piecesOf, rowsOf } from "#pantry/import/overlays/tests.ts";
import type { AssembledRows, InstanceMember, TestRows } from "#pantry/import/overlays/tests.ts";
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
import type { BranchResolution } from "#pantry/qti/tests.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";

/**
 * An element's attributes, as (name, lexical) pairs in order.
 */
type Attributes = readonly (readonly [ClosedName<Composed>, string])[];

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
  attributes: Attributes = [],
  children: readonly XdmChild<Composed>[] = [],
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes: attributes.map(([handle, lexical]) => ({
    lexical,
    name: closedName(handle),
    references: [],
  })),
  children,
  governs: "none",
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
 * Read the rows of a package's documents, each under its own ids, every site's target found
 * among them by path.
 *
 * @param documents - The documents by path, in order.
 * @returns Each document's rows, in the same order.
 */
const rowsOfPackage = (
  documents: readonly (readonly [string, XdmDocument<Composed>])[],
): readonly TestRows[] => {
  const nodes = new Map(documents.map(([path], n) => [path, idsOf(n)(0)] as const));

  return documents.map(([path, doc], n) =>
    rowsOf(doc, {
      documentAt: (at) => Option.fromNullishOr(nodes.get(at)),
      idOf: idsOf(n),
      package: packageId,
      path,
    }),
  );
};

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

/**
 * An item whose body holds one `xi:include` with the attributes given.
 *
 * @param attributes - The include's attributes.
 * @returns The item.
 */
const itemWithInclude = (attributes: Attributes): XdmDocument<Composed> =>
  documentOf(
    el(
      "qti-assessment-item",
      [["identifier", "I"]],
      [el("qti-item-body", [], [el("xi:include", attributes)])],
    ),
  );

/**
 * Read the rows of an item holding one include beside a listed section document, `s.xml`.
 *
 * @param include - The item.
 * @returns The item's rows.
 */
const includeRowsOf = (include: XdmDocument<Composed>): TestRows | undefined =>
  rowsOfPackage([
    ["t.xml", include],
    ["s.xml", documentOf(el("qti-assessment-section", [["identifier", "S"]]))],
  ])[0];

describe("import/overlays/tests.ts, includes", () => {
  it("writes an include whose href resolves outside the package a site marked external, with no target and no Inclusion, so nothing fetches it", () => {
    // Oracle: reading 115 and the href scopes of readings 35 and 102: a scheme, a leading `/` and
    // a path that climbs above the package root are outside the package; such an include is
    // stored as written and never resolved, so it names no document of the package.
    for (const href of ["https://example.org/f.xml", "/s.xml", "../s.xml"]) {
      const rows = includeRowsOf(itemWithInclude([["href", href]]));
      const sites = [...(rows?.Site.values() ?? [])];

      assert.deepStrictEqual(
        sites.map(({ external, kind }) => [kind, external]),
        [["xi:include", true]],
        href,
      );
      assert.strictEqual(rows?.SiteTarget.size, 0, href);
      assert.strictEqual(rows?.Inclusion.size, 0, href);
    }
  });

  it("marks an include whose href stays in the package not external: a listed document is its target, and a missing entry and an absent href leave it none, which Include target refuses", () => {
    // Oracle: reading 115: an in-package include names a document the manifest lists, or the
    // package is refused under "Include target"; an include with no href names none.
    const cases: readonly (readonly [string, Attributes, number])[] = [
      ["listed document", [["href", "s.xml"]], 1],
      ["missing entry", [["href", "gone/s.xml"]], 0],
      ["absent href", [], 0],
    ];

    for (const [label, attributes, targets] of cases) {
      const rows = includeRowsOf(itemWithInclude(attributes));
      const sites = [...(rows?.Site.values() ?? [])];

      assert.deepStrictEqual(
        sites.map(({ external, kind }) => [kind, external]),
        [["xi:include", false]],
        label,
      );
      assert.strictEqual(rows?.SiteTarget.size, targets, label);
      assert.strictEqual(rows?.Inclusion.size, targets, label);
    }
  });

  it("writes no site for an include under a parent whose model gives no Include, as under qti-custom-operator", () => {
    // Oracle: reading 114: only a parent whose content model holds an explicit include particle
    // reads an include as Include; `qti-custom-operator`'s lax content (operator-foreign-content's
    // shape) holds the include as written, so it is no site and needs no target.
    for (const href of ["part.xml", "https://example.org/f.xml"]) {
      const operator = el("qti-custom-operator", [], [el("xi:include", [["href", href]])]);
      const rows = includeRowsOf(
        documentOf(
          el(
            "qti-assessment-item",
            [["identifier", "I"]],
            [
              el(
                "qti-response-processing",
                [],
                [el("qti-response-condition", [], [el("qti-response-if", [], [operator])])],
              ),
            ],
          ),
        ),
      );

      assert.strictEqual(rows?.Site.size, 0, href);
      assert.strictEqual(rows?.SiteTarget.size, 0, href);
      assert.strictEqual(rows?.Inclusion.size, 0, href);
    }
  });
});

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
 * The kinds a rule of an item ref or a section branches to.
 */
const sectionTargets: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
]);

/**
 * State `Branch_target` on the host: the target's kind, part and replacement, and an instance that
 * holds the rule's, reached through its child `via`.
 *
 * @param b - The resolution.
 * @param instanceStart - Its instance's start.
 * @returns Whether the law accepts it.
 */
const targetAccepts = (b: Addition<typeof BranchResolution>, instanceStart: bigint): boolean => {
  const kind =
    b.ownerKind === "qti-test-part"
      ? b.targetKind === "qti-test-part"
      : sectionTargets.has(b.targetKind) && b.targetPart === b.ownerPart;
  const replaceable = b.targetKind === "qti-assessment-item-ref" && b.targetReplaced;
  const above = b.targetInstanceStart <= instanceStart && instanceStart < b.targetInstanceEnd;
  const through =
    b.targetInstance === b.instance
      ? b.via === b.instance
      : b.viaParent === b.targetInstance && b.viaStart <= instanceStart && instanceStart < b.viaEnd;

  return kind && !replaceable && above && through;
};

/**
 * State `Branch_forward` on the host: the target after the source's end, or the two unnested under
 * a common element whose order is drawn.
 *
 * @param b - The resolution.
 * @returns Whether the law accepts it.
 */
const forwardAccepts = (b: Addition<typeof BranchResolution>): boolean => {
  const same = b.targetInstance === b.instance;
  const point = same ? b.ownerStart : b.viaSiteStart;
  const holds = (start: bigint, end: bigint) => start <= point && point < end;
  const forward = same ? b.targetStart >= b.ownerEnd : b.targetStart > b.viaSiteStart;
  const nested =
    holds(b.targetStart, b.targetEnd) ||
    (same && b.ownerStart <= b.targetStart && b.targetStart < b.ownerEnd);
  const shuffled =
    holds(b.commonStart, b.commonEnd) &&
    b.branchParent === b.common &&
    b.branchStart <= b.targetStart &&
    b.targetStart < b.branchEnd &&
    !holds(b.branchStart, b.branchEnd) &&
    b.commonMixes;

  return forward || (b.ownerKind !== "qti-test-part" && !nested && shuffled);
};

/**
 * State `Branch_target` and `Branch_forward` on the host, over a resolution's fields, as
 * `#pantry/qti/tests.ts` states them.
 *
 * @param b - The resolution, as its writer writes it.
 * @param instanceStart - Its instance's start in the tree's pre-order, which grizzle copies onto
 *   it.
 * @returns Whether both laws accept it.
 */
const lawAccepts = (b: Addition<typeof BranchResolution>, instanceStart: bigint): boolean =>
  targetAccepts(b, instanceStart) && forwardAccepts(b);

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
  for (const resolution of assembled.BranchResolution.values()) {
    const target = intervals.get(resolution.targetInstance);
    const via = intervals.get(resolution.via);
    assert.strictEqual(resolution.targetInstanceStart, target?.start);
    assert.strictEqual(resolution.targetInstanceEnd, target?.end);
    assert.strictEqual(resolution.viaStart, via?.start);
    assert.strictEqual(resolution.viaEnd, via?.end);
    assert.isTrue(
      lawAccepts(resolution, intervals.get(resolution.instance)?.start ?? -1n),
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
                assert.deepStrictEqual(
                  [...rows.Site.values()].map((site) => [
                    site.path,
                    rows.SiteTarget.get(site.node)?.target,
                  ]),
                  [...rows.Site.values()].map((site) => [site.path, listed.get(site.path)]),
                  "each site's target, none where its href names no listed document",
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
 * Judge a jump case by reading 87's bullets, over the case's own structure: a reserved exit; a
 * test part's rule naming a later test part; or a rule of an item ref or section naming an item
 * ref, section or section ref of its own part after its end, never an item ref a replacement can
 * repeat, the order exempt where the section holding both shuffles them and neither holds the
 * other.
 *
 * @param jump - The case.
 * @returns Whether the rule is valid.
 */
const readingAccepts = (jump: JumpCase): boolean => {
  if (exits.some((exit) => exit === jump.target)) {
    return true;
  }

  const order = ["P1", "S", "I1", "I2", "P2", "S2", "I3"];
  const partOf = (name: string) => (isPart(name) ? name : ancestors(name).find(isPart));
  const { target } = jump;
  if (!order.includes(target)) {
    return false;
  }

  if (isPart(jump.owner)) {
    return isPart(target) && order.indexOf(target) > order.indexOf(jump.owner);
  }

  if (isPart(target) || partOf(target) !== partOf(jump.owner)) {
    return false;
  }

  if (target.startsWith("I") && jump.replaced && ancestors(target).includes("S")) {
    return false;
  }

  const nested =
    target === jump.owner ||
    ancestors(target).includes(jump.owner) ||
    ancestors(jump.owner).includes(target);
  if (nested) {
    return false;
  }

  const ownerEnd = Math.max(
    order.indexOf(jump.owner),
    ...order
      .filter((name) => ancestors(name).includes(jump.owner))
      .map((name) => order.indexOf(name)),
  );
  const common = ancestors(target).find((name) => ancestors(jump.owner).includes(name));

  return order.indexOf(target) > ownerEnd || (common === "S" && jump.shuffle);
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
              const expected = readingAccepts(jump);
              const resolutions = [...assembled.BranchResolution.values()];
              if (exits.some((exit) => exit === jump.target)) {
                c.note("exit");
                assert.deepStrictEqual(resolutions, [], "an exit resolves nothing");

                return;
              }

              assert.strictEqual(resolutions.length, 1);

              const [resolution] = resolutions;
              assert.isDefined(resolution);
              if (resolution === undefined) {
                return;
              }

              const name = (instance: string, node: string) =>
                assembled.InstanceName.get(keyOf([instance, node]));
              const resolved = name(resolution.targetInstance, resolution.targetNode) !== undefined;
              const accepted = resolved && lawAccepts(resolution, 0n);
              c.note(accepted ? "accepted" : "refused");
              if (accepted && jump.owner === "I2" && jump.target === "I1") {
                c.note("shuffled backward");
              }

              assert.strictEqual(accepted, expected, Formatter.format(jump));
              if (resolved) {
                const target = name(resolution.targetInstance, resolution.targetNode);
                assert.strictEqual(target?.start, resolution.targetStart);
                assert.strictEqual(target?.kind, resolution.targetKind);
                assert.strictEqual(target?.identifier, resolution.target);
                assert.strictEqual(
                  name(resolution.instance, resolution.owner)?.end,
                  resolution.ownerEnd,
                );
                assert.strictEqual(
                  name(resolution.targetInstance, resolution.common)?.mixes,
                  resolution.commonMixes,
                );
              }
            }),
        ),
      ),
  );
});
