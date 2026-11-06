/**
 * The assembly generator (R87): QTI 3.0 content packages whose test places section documents
 * through section refs to any depth and carries branch rules whose targets fall anywhere in the
 * assembled test, each package drawn by a swarm over the shapes it can take, beside an independent
 * model of reading 87 that predicts the law oracle's verdict.
 *
 * A package is an {@link Assembly}: the test's parts, each a tree of sections, item refs and section
 * refs; the section documents those refs place, each a section whose refs place only later
 * documents, so every chain of placements ends and the instance tree is finite (reading 85); and
 * the branch rules, each owned by a part, a section or an item ref (a section ref holds no
 * children, `AssessmentSectionRefDType` extends `EmptyPrimitiveTypeDType`). Every identifier in a
 * package is distinct, so no other law of the test's names (readings 86, A4) is in play, and every
 * item ref names the one item, so no item law is either.
 *
 * {@link placementsOf} assembles a package as the oracle and the importer do (reading 5): the test
 * is the root instance, each section ref places an instance of its document under it, and each
 * written element is placed once per instance of its document. {@link modelVerdict} judges each
 * branch rule at each of its placements by reading 87's bullets restated over that tree, so it
 * shares no code with the law oracle (`#pantry/test/oracle.ts`) or the overlays
 * (`#pantry/import/overlays/tests.ts`).
 */
import { Array as Arr } from "effect";
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * A part of a section, or of a section document's root: an item ref, a nested section, or a
 * section ref that places a section document, by its index.
 */
export type SectionPart =
  | { readonly kind: "item"; readonly id: string }
  | { readonly kind: "ref"; readonly document: number; readonly id: string }
  | { readonly children: readonly SectionPart[]; readonly id: string; readonly kind: "section" };

/**
 * A part of a test part: a section or a section ref, the only two a test part holds.
 */
export type PartChild = Extract<SectionPart, { readonly kind: "ref" | "section" }>;

/**
 * A test part, by its identifier, and the sections and refs it holds.
 */
export interface GeneratedPart {
  readonly children: readonly PartChild[];
  readonly id: string;
}

/**
 * A section document: its root section's identifier and parts.
 */
export interface SectionDocument {
  readonly children: readonly SectionPart[];
  readonly id: string;
}

/**
 * A branch rule, by the identifier of the element that owns it and the target it names: an
 * identifier of the package, or one of the three reserved exits.
 */
export interface GeneratedRule {
  readonly owner: string;
  readonly target: string;
}

/**
 * A generated package: the test's parts, the section documents, and the branch rules.
 */
export interface Assembly {
  readonly documents: readonly SectionDocument[];
  readonly parts: readonly GeneratedPart[];
  readonly rules: readonly GeneratedRule[];
}

/**
 * The reserved targets every branch rule may name (information model §5.23.1).
 */
export const exits = ["EXIT_SECTION", "EXIT_TESTPART", "EXIT_TEST"] as const;

/**
 * The reserved targets, as a set of texts a target is looked up in.
 */
const exitTargets: ReadonlySet<string> = new Set(exits);

/**
 * An element's kind in the assembled test.
 */
type PlacedKind = "item" | "part" | "ref" | "section";

/**
 * One written element of one instance, placed in the assembled test: its identifier and kind, the
 * document that holds it (`-1` for the test), its instance, its pre-order interval
 * `[start, end)` over the whole assembled test, and its test part.
 */
export interface Placement {
  readonly document: number;
  readonly end: number;
  readonly id: string;
  readonly instance: number;
  readonly kind: PlacedKind;
  readonly part: string;
  readonly start: number;
}

/**
 * The assembled test: every placement, in pre-order, and each instance's parent (the test's
 * instance, 0, its own) and document (`-1` for the test).
 */
export interface Placed {
  readonly instances: readonly { readonly document: number; readonly parent: number }[];
  readonly placements: readonly Placement[];
}

/**
 * Assemble a package: walk the test's parts in document order, and at each section ref place a new
 * instance of its document under the ref, numbering every placed element in one pre-order.
 *
 * @param assembly - The package.
 * @returns The assembled test.
 */
export const placementsOf = (assembly: Assembly): Placed => {
  const placements: Placement[] = [];
  const instances: { document: number; parent: number }[] = [{ document: -1, parent: 0 }];
  let next = 0;
  const place = (
    id: string,
    kind: PlacedKind,
    at: { readonly document: number; readonly instance: number; readonly part: string },
    inside?: () => void,
  ): void => {
    const start = next;
    next += 1;

    const index = placements.length;
    placements.push({ ...at, end: start, id, kind, start });
    inside?.();
    placements[index] = { ...at, end: next, id, kind, start };
  };
  const walk = (
    child: SectionPart,
    at: { readonly document: number; readonly instance: number; readonly part: string },
  ): void => {
    if (child.kind === "item") {
      place(child.id, "item", at);
    } else if (child.kind === "section") {
      place(child.id, "section", at, () => {
        for (const grandchild of child.children) {
          walk(grandchild, at);
        }
      });
    } else {
      place(child.id, "ref", at, () => {
        const placed = assembly.documents[child.document];
        if (placed === undefined) {
          return;
        }

        const instance = instances.length;
        instances.push({ document: child.document, parent: at.instance });

        const inner = { document: child.document, instance, part: at.part };
        place(placed.id, "section", inner, () => {
          for (const grandchild of placed.children) {
            walk(grandchild, inner);
          }
        });
      });
    }
  };

  for (const part of assembly.parts) {
    const at = { document: -1, instance: 0, part: part.id };
    place(part.id, "part", at, () => {
      for (const child of part.children) {
        walk(child, at);
      }
    });
  }

  return { instances, placements };
};

/**
 * The instances that hold an instance: itself, its parent, and so on up to the test's.
 *
 * @param placed - The assembled test.
 * @param instance - The instance.
 * @returns Each holding instance.
 */
const holding = (placed: Placed, instance: number): ReadonlySet<number> => {
  const held = new Set<number>([instance]);
  let at = instance;
  while (at !== 0) {
    at = placed.instances[at]?.parent ?? 0;
    held.add(at);
  }

  return held;
};

/**
 * Why reading 87 refuses one placement of a branch rule: its target resolves to no element of an
 * instance that holds the rule's (unresolved), or to one of the wrong kind or test part (target),
 * or to one that is not after the source's end (forward).
 */
export type RuleFault = "forward" | "target" | "unresolved";

/**
 * Judge one placement of a branch rule by reading 87, over the assembled test: an exit is always
 * admitted; any other target names the one element placed in an instance that holds the rule's
 * (from outside a section document a ref places, nothing inside it is a target), which on a test
 * part is a later test part, and elsewhere an item ref, section or section ref of the same test
 * part that starts at or after the source's end, so neither the source, an ancestor nor a
 * descendant of it. No generated package shuffles or selects with replacement, so the bullets on
 * those never apply.
 *
 * @param placed - The assembled test.
 * @param owner - The rule's owner, as placed.
 * @param target - The rule's target.
 * @returns The fault, or none when reading 87 admits it.
 */
export const ruleFaultOf = (
  placed: Placed,
  owner: Placement,
  target: string,
): RuleFault | undefined => {
  if (exitTargets.has(target)) {
    return undefined;
  }

  const holders = holding(placed, owner.instance);
  const candidates = placed.placements.filter(
    ({ id, instance }) => id === target && holders.has(instance),
  );
  const [resolved] = candidates;
  if (resolved === undefined || candidates.length > 1) {
    return "unresolved";
  }

  const kind =
    owner.kind === "part"
      ? resolved.kind === "part"
      : resolved.kind !== "part" && resolved.part === owner.part;
  if (!kind) {
    return "target";
  }

  return resolved.start >= owner.end ? undefined : "forward";
};

/**
 * A package's verdict as reading 87 gives it: accepted when every placement of every branch rule is
 * admitted, and otherwise refused with the faults found. A rule in a section document no test
 * places has no placement and is judged nowhere.
 */
export type ModelVerdict =
  | { readonly kind: "accepted" }
  | { readonly faults: ReadonlySet<RuleFault>; readonly kind: "refused" };

/**
 * Predict a package's verdict by reading 87.
 *
 * @param assembly - The package.
 * @returns The verdict.
 */
export const modelVerdict = (assembly: Assembly): ModelVerdict => {
  const placed = placementsOf(assembly);
  const faults = new Set<RuleFault>();
  for (const rule of assembly.rules) {
    for (const owner of placed.placements.filter(({ id }) => id === rule.owner)) {
      const fault = ruleFaultOf(placed, owner, rule.target);
      if (fault !== undefined) {
        faults.add(fault);
      }
    }
  }

  return faults.size === 0 ? { kind: "accepted" } : { faults, kind: "refused" };
};

/**
 * Where a rule's target lies against its owner, at the owner's first placement: the names a
 * search's coverage requires.
 */
export type TargetClass =
  | "after"
  | "ancestor"
  | "at the end"
  | "before"
  | "exit"
  | "inside"
  | "into a placed document"
  | "its own instance"
  | "other part"
  | "outer instance, after"
  | "outer instance, before"
  | "self"
  | "unplaced";

/**
 * Whether a placement is the section ref that places its owner's instance.
 *
 * @param placed - The assembled test.
 * @param owner - The owner, as placed.
 * @param held - The placement.
 * @returns Whether it is.
 */
const placesOwner = (placed: Placed, owner: Placement, held: Placement): boolean =>
  held.kind === "ref" &&
  held.instance !== owner.instance &&
  held.start < owner.start &&
  owner.start < held.end &&
  placed.instances[owner.instance]?.parent === held.instance;

/**
 * Name where a target lies against its owner's placement.
 *
 * @param placed - The assembled test.
 * @param owner - The owner, as placed.
 * @param target - The target.
 * @returns Its class.
 */
export const classOf = (placed: Placed, owner: Placement, target: string): TargetClass => {
  if (exitTargets.has(target)) {
    return "exit";
  }

  const holders = holding(placed, owner.instance);
  const all = placed.placements.filter(({ id }) => id === target);
  const held = all.find(({ instance }) => holders.has(instance));
  if (held === undefined) {
    return all.length === 0 ? "unplaced" : "into a placed document";
  }

  if (placesOwner(placed, owner, held)) {
    return "its own instance";
  }

  if (held.part !== owner.part) {
    return "other part";
  }

  if (held.instance !== owner.instance) {
    return held.start >= owner.end ? "outer instance, after" : "outer instance, before";
  }

  if (held.start === owner.start) {
    return "self";
  }

  if (held.start < owner.start && owner.start < held.end) {
    return "ancestor";
  }

  if (owner.start < held.start && held.start < owner.end) {
    return "inside";
  }

  if (held.start === owner.end) {
    return "at the end";
  }

  return held.start > owner.end ? "after" : "before";
};

/**
 * The shapes a swarm turns on or off in one case: item refs, sections nested in sections, section
 * refs and the documents they place, refs inside placed documents (chains, so deep instance trees),
 * a second test part, a document placed twice, a document no test places, and branch rules.
 */
export const features = [
  "branch rules",
  "item refs",
  "chains",
  "nested sections",
  "second part",
  "section refs",
  "shared document",
  "unplaced document",
] as const;

/**
 * One of {@link features}.
 */
export type Feature = (typeof features)[number];

/**
 * The bounds a generated package keeps to: how many documents, children per section, nesting
 * depth and branch rules it draws at most.
 */
export interface Bounds {
  readonly children: number;
  readonly depth: number;
  readonly documents: number;
  readonly rules: number;
}

/**
 * The bounds the sampled search draws within: past the exhausted box's, to a chain of four
 * placements.
 */
export const sampledBounds: Bounds = { children: 3, depth: 3, documents: 4, rules: 3 };

/**
 * The bounds the exhausted box enumerates: one test part's shapes up to two children, one level of
 * nesting, one placed document and one rule.
 */
export const smallBounds: Bounds = { children: 2, depth: 1, documents: 1, rules: 1 };

/**
 * Every identifier a package writes, the test's and each document's, whether or not it is placed.
 *
 * @param assembly - The package.
 * @returns The identifiers, in document order.
 */
export const writtenIds = (assembly: Assembly): readonly string[] => {
  const ofPart = (child: SectionPart): readonly string[] =>
    child.kind === "section" ? [child.id, ...child.children.flatMap(ofPart)] : [child.id];

  return [
    ...assembly.parts.flatMap((part) => [part.id, ...part.children.flatMap(ofPart)]),
    ...assembly.documents.flatMap((document) => [
      document.id,
      ...document.children.flatMap(ofPart),
    ]),
  ];
};

/**
 * Draw an assembly under a swarm and within bounds. Identifiers are minted in order of drawing, so
 * each is distinct: `p` for a test part, `s` for a section, `i` for an item ref, `r` for a section
 * ref and `d` for a section document's root.
 *
 * @param drawn - The swarm: each feature on at a weight, or off.
 * @param bounds - The bounds.
 * @returns The generator.
 */
export const assemblyOf =
  (drawn: Swarm<Feature>, bounds: Bounds): Gen<Assembly> =>
  (source) => {
    let minted = 0;
    const mint = (prefix: string): string => {
      minted += 1;

      return `${prefix}${String(minted)}`;
    };
    const documentCount = keep(drawn, "section refs")(source)
      ? source.draw(int(1, bounds.documents))
      : 0;
    const documentIds = Array.from({ length: documentCount }, (_, at) => `d${String(at)}`);
    const referenced = new Set<number>();
    const refTo = (lowest: number): SectionPart | undefined => {
      if (lowest >= documentCount) {
        return undefined;
      }

      const document = source.draw(int(lowest, documentCount - 1));
      const shared = keep(drawn, "shared document")(source);
      if (referenced.has(document) && !shared) {
        return undefined;
      }

      referenced.add(document);

      return { document, id: mint("r"), kind: "ref" };
    };
    const partsOf = (depth: number, refsFrom: number): SectionPart[] => {
      const count = source.draw(int(1, bounds.children));
      const children: SectionPart[] = [];
      for (let at = 0; at < count; at += 1) {
        const arm = swarmChoice(drawn, ["item refs", "nested sections", "section refs"] as const)(
          source,
        );
        const ref = arm === "section refs" ? refTo(refsFrom) : undefined;
        if (ref !== undefined) {
          children.push(ref);
        } else if (arm === "nested sections" && depth < bounds.depth) {
          children.push({
            children: partsOf(depth + 1, refsFrom),
            id: mint("s"),
            kind: "section",
          });
        } else {
          children.push({ id: mint("i"), kind: "item" });
        }
      }

      return children;
    };
    const partChildren = (): PartChild[] => {
      const count = source.draw(int(1, bounds.children));
      const children: PartChild[] = [];
      for (let at = 0; at < count; at += 1) {
        const ref = keep(drawn, "section refs")(source) ? refTo(0) : undefined;
        children.push(
          ref?.kind === "ref"
            ? ref
            : {
                children: partsOf(1, 0),
                id: mint("s"),
                kind: "section",
              },
        );
      }

      return children;
    };
    const parts: GeneratedPart[] = [{ children: partChildren(), id: mint("p") }];
    if (keep(drawn, "second part")(source)) {
      parts.push({ children: partChildren(), id: mint("p") });
    }

    const documents = documentIds.map((id, at): SectionDocument => {
      const chained = keep(drawn, "chains")(source);

      return { children: partsOf(1, chained ? at + 1 : documentCount), id };
    });
    if (!keep(drawn, "unplaced document")(source)) {
      for (let at = 0; at < documents.length; at += 1) {
        if (!referenced.has(at) && parts[0] !== undefined) {
          referenced.add(at);
          parts[0] = {
            children: [...parts[0].children, { document: at, id: mint("r"), kind: "ref" }],
            id: parts[0].id,
          };
        }
      }
    }

    const unruled = { documents, parts, rules: [] };
    const owners = [
      ...new Set(
        placementsOf(unruled).placements.flatMap(({ id, kind }) => (kind === "ref" ? [] : [id])),
      ),
    ];
    const names: readonly string[] = [...exits, ...writtenIds(unruled)];
    const rules: GeneratedRule[] = [];
    const ruleCount = keep(drawn, "branch rules")(source) ? source.draw(int(1, bounds.rules)) : 0;
    for (let at = 0; at < ruleCount; at += 1) {
      if (Arr.isReadonlyArrayNonEmpty(owners) && Arr.isReadonlyArrayNonEmpty(names)) {
        const owner = source.draw(element(owners));
        const target = source.draw(element(names));
        if (!rules.some((rule) => rule.owner === owner)) {
          rules.push({ owner, target });
        }
      }
    }

    return { documents, parts, rules };
  };

/**
 * A package drawn by its own swarm within bounds: the swarm first, so each case explores a corner
 * where some shapes are absent and the rest combine.
 *
 * @param bounds - The bounds.
 * @returns The generator, yielding the swarm and the package.
 */
export const swarmedAssembly =
  (bounds: Bounds): Gen<{ readonly assembly: Assembly; readonly swarm: Swarm<Feature> }> =>
  (source) => {
    const drawn = source.draw(swarm(features));

    return { assembly: source.draw(assemblyOf(drawn, bounds)), swarm: drawn };
  };

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XML declaration every generated document opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * The one item every item ref names.
 */
const itemPath = "item.xml";

/**
 * The item: an identifier, a title and a body, nothing a law of its own reads.
 */
const item = [
  declaration,
  `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" adaptive="false" time-dependent="false">`,
  "  <qti-item-body><p>An item.</p></qti-item-body>",
  "</qti-assessment-item>",
  "",
].join("\n");

/**
 * A section document's path.
 *
 * @param document - Its index.
 * @returns Its path, beside the test.
 */
const documentPath = (document: number): string => `d${String(document)}.xml`;

/**
 * Write the branch rules an element owns.
 *
 * @param assembly - The package.
 * @param owner - The element's identifier.
 * @param indent - The indentation of its children.
 * @returns Each rule's line.
 */
const rulesOf = (assembly: Assembly, owner: string, indent: string): readonly string[] =>
  assembly.rules
    .filter((rule) => rule.owner === owner)
    .map(
      (rule) =>
        `${indent}<qti-branch-rule target="${rule.target}"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule>`,
    );

/**
 * Write a section part and what it holds.
 *
 * @param assembly - The package.
 * @param child - The part.
 * @param indent - Its indentation.
 * @returns Its lines.
 */
const partLines = (assembly: Assembly, child: SectionPart, indent: string): readonly string[] => {
  const inner = `${indent}  `;
  if (child.kind === "item") {
    return [
      `${indent}<qti-assessment-item-ref identifier="${child.id}" href="${itemPath}">`,
      ...rulesOf(assembly, child.id, inner),
      `${indent}</qti-assessment-item-ref>`,
    ];
  }

  if (child.kind === "ref") {
    return [
      `${indent}<qti-assessment-section-ref identifier="${child.id}" href="${documentPath(child.document)}"/>`,
    ];
  }

  return [
    `${indent}<qti-assessment-section identifier="${child.id}" title="${child.id}" visible="true">`,
    ...rulesOf(assembly, child.id, inner),
    ...child.children.flatMap((grandchild) => partLines(assembly, grandchild, inner)),
    `${indent}</qti-assessment-section>`,
  ];
};

/**
 * Write the test.
 *
 * @param assembly - The package.
 * @returns Its text.
 */
const testOf = (assembly: Assembly): string =>
  [
    declaration,
    `<qti-assessment-test xmlns="${asi}" identifier="test" title="Assembly">`,
    ...assembly.parts.flatMap((part) => [
      `  <qti-test-part identifier="${part.id}" navigation-mode="linear" submission-mode="individual">`,
      ...rulesOf(assembly, part.id, "    "),
      ...part.children.flatMap((child) => partLines(assembly, child, "    ")),
      "  </qti-test-part>",
    ]),
    "</qti-assessment-test>",
    "",
  ].join("\n");

/**
 * Write a section document.
 *
 * @param assembly - The package.
 * @param document - The document.
 * @returns Its text.
 */
const documentOf = (assembly: Assembly, document: SectionDocument): string =>
  [
    declaration,
    `<qti-assessment-section xmlns="${asi}" identifier="${document.id}" title="${document.id}" visible="true">`,
    ...rulesOf(assembly, document.id, "  "),
    ...document.children.flatMap((child) => partLines(assembly, child, "  ")),
    "</qti-assessment-section>",
    "",
  ].join("\n");

/**
 * Write the manifest: the item, each section document and the test, each listed by its resource,
 * the test depending on every other.
 *
 * @param assembly - The package.
 * @returns Its text.
 */
const manifestOf = (assembly: Assembly): string =>
  [
    declaration,
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="assembly-manifest">',
    "  <metadata>",
    "    <schema>QTI Package</schema>",
    "    <schemaversion>3.0.0</schemaversion>",
    "  </metadata>",
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="item-res" type="imsqti_item_xmlv3p0" href="${itemPath}">`,
    `      <file href="${itemPath}"/>`,
    "    </resource>",
    ...assembly.documents.flatMap((_, at) => [
      `    <resource identifier="d${String(at)}-res" type="imsqti_section_xmlv3p0" href="${documentPath(at)}">`,
      `      <file href="${documentPath(at)}"/>`,
      '      <dependency identifierref="item-res"/>',
      "    </resource>",
    ]),
    '    <resource identifier="test-res" type="imsqti_test_xmlv3p0" href="test.xml">',
    '      <file href="test.xml"/>',
    '      <dependency identifierref="item-res"/>',
    ...assembly.documents.map((_, at) => `      <dependency identifierref="d${String(at)}-res"/>`),
    "    </resource>",
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");

/**
 * Build a package's entries: the manifest, the item, the test and each section document, UTF-8.
 *
 * @param assembly - The package.
 * @returns Its entries, by path.
 */
export const assemblyPackage = (assembly: Assembly): PackageEntries => {
  const text = new TextEncoder();

  return new Map<string, Uint8Array>([
    ["imsmanifest.xml", text.encode(manifestOf(assembly))],
    [itemPath, text.encode(item)],
    ["test.xml", text.encode(testOf(assembly))],
    ...assembly.documents.map((document, at): readonly [string, Uint8Array] => [
      documentPath(at),
      text.encode(documentOf(assembly, document)),
    ]),
  ]);
};

/**
 * Write a package as one line: each part's tree, each document's, then each rule.
 *
 * @param assembly - The package.
 * @returns Its literal.
 */
export const assemblyLiteral = (assembly: Assembly): string => {
  const ofPart = (child: SectionPart): string => {
    if (child.kind === "item") {
      return child.id;
    }

    return child.kind === "ref"
      ? `${child.id}->d${String(child.document)}`
      : `${child.id}(${child.children.map(ofPart).join(" ")})`;
  };

  return [
    ...assembly.parts.map((part) => `${part.id}[${part.children.map(ofPart).join(" ")}]`),
    ...assembly.documents.map(
      (document) => `${document.id}{${document.children.map(ofPart).join(" ")}}`,
    ),
    ...assembly.rules.map((rule) => `${rule.owner}=>${rule.target}`),
  ].join(" ");
};

/**
 * An item ref of the exhausted box.
 *
 * @param id - Its identifier.
 * @returns The part.
 */
const itemRef = (id: string): SectionPart => ({ id, kind: "item" });

/**
 * A section ref of the exhausted box.
 *
 * @param id - Its identifier.
 * @param document - The document it places.
 * @returns The part.
 */
const sectionRef = (id: string, document: number): PartChild => ({ document, id, kind: "ref" });

/**
 * The outlines the exhausted box enumerates, each a test and its section documents with every
 * identifier fixed: a section of one, two and three item refs; a nested section; a document placed
 * once, beside a section, inside a section before an item ref, and twice; a chain of two
 * placements; two test parts; and a document no test places.
 */
const smallOutlines: Arr.NonEmptyReadonlyArray<Omit<Assembly, "rules">> = [
  {
    documents: [],
    parts: [{ children: [{ children: [itemRef("i1")], id: "s1", kind: "section" }], id: "p1" }],
  },
  {
    documents: [],
    parts: [
      {
        children: [{ children: [itemRef("i1"), itemRef("i2")], id: "s1", kind: "section" }],
        id: "p1",
      },
    ],
  },
  {
    documents: [],
    parts: [
      {
        children: [
          { children: [itemRef("i1"), itemRef("i2"), itemRef("i3")], id: "s1", kind: "section" },
        ],
        id: "p1",
      },
    ],
  },
  {
    documents: [],
    parts: [
      {
        children: [
          {
            children: [{ children: [itemRef("i1")], id: "s2", kind: "section" }, itemRef("i2")],
            id: "s1",
            kind: "section",
          },
        ],
        id: "p1",
      },
    ],
  },
  {
    documents: [{ children: [itemRef("i1")], id: "d0" }],
    parts: [{ children: [sectionRef("r1", 0)], id: "p1" }],
  },
  {
    documents: [{ children: [itemRef("i2")], id: "d0" }],
    parts: [
      {
        children: [{ children: [itemRef("i1")], id: "s1", kind: "section" }, sectionRef("r1", 0)],
        id: "p1",
      },
    ],
  },
  {
    documents: [{ children: [itemRef("i2"), itemRef("i3")], id: "d0" }],
    parts: [
      {
        children: [{ children: [sectionRef("r1", 0), itemRef("i1")], id: "s1", kind: "section" }],
        id: "p1",
      },
    ],
  },
  {
    documents: [{ children: [itemRef("i1")], id: "d0" }],
    parts: [{ children: [sectionRef("r1", 0), sectionRef("r2", 0)], id: "p1" }],
  },
  {
    documents: [
      { children: [sectionRef("r2", 1)], id: "d0" },
      { children: [itemRef("i1")], id: "d1" },
    ],
    parts: [{ children: [sectionRef("r1", 0)], id: "p1" }],
  },
  {
    documents: [],
    parts: [
      { children: [{ children: [itemRef("i1")], id: "s1", kind: "section" }], id: "p1" },
      { children: [{ children: [itemRef("i2")], id: "s2", kind: "section" }], id: "p2" },
    ],
  },
  {
    documents: [{ children: [itemRef("i2")], id: "d0" }],
    parts: [{ children: [{ children: [itemRef("i1")], id: "s1", kind: "section" }], id: "p1" }],
  },
];

/**
 * Every package of the exhausted box: each of {@link smallOutlines} with one branch rule, owned by
 * each element that may own one (a test part, a section or an item ref) and naming each identifier
 * the package writes or `EXIT_TEST`.
 */
export const smallAssembly: Gen<Assembly> = (source) => {
  const outline = source.draw(element(smallOutlines));
  const unruled = { ...outline, rules: [] };
  const written = writtenIds(unruled);
  const refs = new Set(
    placementsOf(unruled).placements.flatMap(({ id, kind }) => (kind === "ref" ? [id] : [])),
  );
  const owners = written.filter((id) => !refs.has(id) && !id.startsWith("r"));
  const targets: Arr.NonEmptyReadonlyArray<string> = ["EXIT_TEST", ...written];
  const owner = Arr.isReadonlyArrayNonEmpty(owners) ? source.draw(element(owners)) : "";

  return { ...outline, rules: [{ owner, target: source.draw(element(targets)) }] };
};
