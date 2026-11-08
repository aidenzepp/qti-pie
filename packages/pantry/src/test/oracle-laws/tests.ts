/**
 * The producers of the law oracle's laws over the tests and sections (O7, lane OL): each law the
 * oracle declared and never raised, stated on the host from its source in the oracle's
 * `lawSources` and the schema's statement of it in `src/qti/tests.ts` and `src/qti/expressions.ts`,
 * over the assembled test `#pantry/test/oracle-laws/assembly.ts` builds.
 *
 * - **One document** (`tests.ts` `testOverlayLaws`): `Structure identifier`, the key `(document,
 *   identifier)` over its names (reading 86); `Selection required`, a section selects at least its
 *   required parts (§4.2.2); `Stimulus ref key`, no two stimulus refs of one item share an
 *   identifier (§7.6.2); `Variable mapping target`, the key `(item ref, target)` and no session
 *   variable as a target (reading 97).
 * - **The items an item ref names** (`itemRefLaws`, `MappingSourceDeclaration`,
 *   `TemplateDefaultTarget`): `Item ref target`, its href names an item or an LTI link of the
 *   package (B2, B3); `Variable mapping source`, a mapping's source is an outcome its item declares
 *   (A34); the declared half of `Variable mapping target`, no target is another variable its item
 *   declares (reading 97); `Template default target`, a template default names a template its item
 *   declares (A37).
 * - **The assembly** (`testNameLaws`, `branchLaws`, the readings of `expressions.ts`): `Test name
 *   key`, no two written elements of one test's assembly share an identifier (reading 86); `Branch
 *   target` and `Branch forward` over each instance's resolution of each branch rule (reading 87);
 *   `Section identifier target`, a `section-identifier` names one section or section ref the test
 *   places once (A61); `Prefixed reference`, exactly one reading of a variable reference a test's
 *   processing makes resolves, through a name the test places once (readings 48 and 88, M3), with
 *   `Variable declared` for an unprefixed one that resolves nowhere (P8 on `Reading`); a braced one
 *   (a string attribute's) that resolves nowhere is a string value, with two readings still refused
 *   (reading R15-k); `Mapped response`, a prefixed map response or map response point of a response
 *   reads a mapping or an area mapping its declaration holds (reading 163, §7.22 and §7.23); and
 *   the content references, each resolving in the test's declarations or its built-ins (A43 to A45:
 *   `Feedback reference`, `Feedback outcome type`, `Printed variable reference`, `Template
 *   reference`, `Context variable reference`), with a section document's feedback naming a built-in
 *   variable judged by the type its name has (`Feedback outcome type`). Each is judged over every
 *   document the test places and every fragment those documents splice in place (spec reading
 *   117).
 */
import { Option, Result } from "effect";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { booleanOf, compile, patternFlags } from "#pantry/grammar/domains.ts";
import { builtinDomainOf } from "#pantry/vocab/derive/domains.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import {
  assemblyOf,
  holds,
  itemRefDocument,
  itemRefTargetOf,
  itemResourceType,
  isLinkType,
  placedName,
  testDocumentsOf,
  testKinds,
} from "#pantry/test/oracle-laws/assembly.ts";
import { declarationKindsOf } from "#pantry/test/oracle-laws/expressions.ts";
import type {
  Instance,
  Name,
  PlacedName,
  Rule,
  TestDocument,
} from "#pantry/test/oracle-laws/assembly.ts";
import {
  breachAt,
  collapsed,
  contentLawOf,
  elementsOf,
  pathOf,
  typedOr,
  typedValueOf,
  valueOf,
} from "#pantry/test/oracle-view.ts";
import type { LawBreach, ListedRows, PackageRows, Row, View } from "#pantry/test/oracle-view.ts";

/**
 * The laws this module produces.
 */
export const testLaws = [
  "Structure identifier",
  "Test name key",
  "Selection required",
  "Branch target",
  "Branch forward",
  "Stimulus ref key",
  "Variable mapping target",
  "Item ref target",
  "Section identifier target",
  "Template default target",
  "Variable mapping source",
  "Prefixed reference",
  "Variable declared",
  "Variable kind",
  "Mapped response",
  "Context variable reference",
  "Feedback reference",
  "Feedback outcome type",
  "Printed variable reference",
  "Template reference",
] as const;

/**
 * A law of {@link testLaws}.
 */
export type TestLaw = (typeof testLaws)[number];

/**
 * The item built-ins a variable mapping's target may not name (information model §2.2.2, §4.5.1:
 * "The identifiers of the built-in session variables are reserved").
 */
const sessionVariables: ReadonlySet<string> = new Set([
  "completionStatus",
  "numAttempts",
  "duration",
]);

/**
 * The processing kinds whose `identifier` names the variable they set (information model §5.87.1,
 * §6.32.3, §6.50.1, §6.50.4, §6.50.5), which only an unsplit reading of their own document's
 * declarations resolves (reading 112).
 */
const setterKinds: ReadonlySet<string> = new Set([
  "qti-lookup-outcome-value",
  "qti-set-correct-response",
  "qti-set-default-value",
  "qti-set-outcome-value",
  "qti-set-template-value",
]);

/**
 * The kinds whose `duration` a part's or a section's prefix names (information model §2.2.2: "time
 * spent on test parts or sections are treated as built-in response variables declared within each
 * respective scope"; a section ref names its placement as a section does, reading 86).
 */
const durationScopes: ReadonlySet<string> = new Set([
  testKinds.part,
  testKinds.section,
  testKinds.sectionRef,
]);

/**
 * The positive instance numbers of reading 88: all digits, not all zeros.
 */
const positiveNumber = /^[0-9]*[1-9][0-9]*$/u;

/**
 * A name piece of all digits: an instance number's form (reading 88).
 */
const digitsOnly = /^[0-9]+$/u;

/**
 * An integer's lexical form after the `collapse` class: what a selection's `select` names.
 */
const integerForm = /^[+-]?[0-9]+$/u;

/**
 * An NCName, `xs:NCName` as the value domains compile it: the form of a bare variable reference
 * once collapsed (Namespaces in XML 1.0, §3).
 */
const ncName = new RegExp(
  Result.getOrThrowWith(
    Result.flatMap(builtinDomainOf("NCName"), (domain) => compile(domain, "exact")),
    (unread) => unread,
  ).pattern,
  patternFlags,
);

/**
 * A breach of one of this module's laws at a node.
 */
type Breach = LawBreach<TestLaw>;

/**
 * One item ref of a document, and how a breach of its laws names it: by the identifier it writes,
 * or by its place where it writes none. Its laws over its href and its children judge it either
 * way, since an item ref that names nothing (reading 147) still names its item (spec reading 155).
 */
interface ItemRef {
  readonly itemRef: string;
  readonly node: Row;
}

/**
 * List a test or section document's item refs, named or not, in document order.
 *
 * @param document - The document.
 * @returns Its item refs.
 */
const itemRefsOf = (document: TestDocument): readonly ItemRef[] => {
  const { rows } = document.listed;

  return rows.members
    .filter(({ kind }) => kind === testKinds.itemRef)
    .map((node) => ({
      itemRef: Option.match(Option.fromUndefinedOr(document.namesByNode.get(node.id)), {
        onNone: () => pathOf(rows, node.id),
        onSome: ({ identifier }) => identifier,
      }),
      node,
    }));
};

/**
 * The declarations of a document by collapsed identifier: each declaration element's kind.
 *
 * @param rows - The document.
 * @param grammar - The composed grammar, whose declaration kinds it reads.
 * @returns Each declared identifier's declaration kinds, in document order.
 */
const declarationsOf = (
  rows: View,
  grammar: ComposedGrammar,
): ReadonlyMap<string, readonly string[]> => {
  const declared = new Map<string, string[]>();
  for (const node of rows.members) {
    if (grammar.references.declarationKind.has(node.kind)) {
      for (const identifier of Option.toArray(typedValueOf(rows, node.id, "identifier"))) {
        declared.set(identifier, [...(declared.get(identifier) ?? []), node.kind]);
      }
    }
  }

  return declared;
};

/**
 * The table each table reader reads in its response's declaration: a map response's mapping and a
 * map response point's area mapping (information model §7.22 and §7.23).
 */
const readTables: ReadonlyMap<string, string> = new Map([
  ["qti-map-response", "qti-mapping"],
  ["qti-map-response-point", "qti-area-mapping"],
]);

/**
 * Read the tables a document's declaration of a name holds, the first declaration of the name as
 * {@link declarationsOf} reads it: its child elements' kinds.
 *
 * @param rows - The document.
 * @param grammar - The composed grammar, whose declaration kinds it reads.
 * @param identifier - The name.
 * @returns The kinds of its declaration's children, none where it declares no such name.
 */
const tablesIn = (rows: View, grammar: ComposedGrammar, identifier: string): readonly string[] =>
  Option.match(
    Option.fromNullishOr(
      rows.members.find(
        (node) =>
          grammar.references.declarationKind.has(node.kind) &&
          Option.contains(typedValueOf(rows, node.id, "identifier"), identifier),
      ),
    ),
    {
      onNone: () => [],
      onSome: (declaration) => elementsOf(rows, declaration.id).map(({ kind }) => kind),
    },
  );

/**
 * Judge one test or section document's own laws: its names' key, its sections' parts and
 * selections, and every item ref's mappings' keys, named or not.
 *
 * @param document - The document.
 * @returns The breaches.
 */
const documentLawsOf = (document: TestDocument): readonly Breach[] => {
  const { rows } = document.listed;
  const byIdentifier = Map.groupBy(document.names, ({ identifier }) => identifier);
  const structure = [...byIdentifier].flatMap(([identifier, held]) =>
    held.slice(1).map((name) =>
      breachAt(rows, name.node, "Structure identifier", {
        identifier,
        other: held[0]?.node.kind ?? "",
      }),
    ),
  );
  const sections = [...document.sections.values()].flatMap((section): readonly Breach[] => {
    const required = section.parts.filter(
      ({ id, kind }) =>
        (kind === testKinds.itemRef || kind === testKinds.section) &&
        Option.contains(Option.flatMap(valueOf(rows, id, "required"), booleanOf), true),
    ).length;
    const bound = section.selection.pipe(
      Option.flatMap((selection) =>
        Option.map(
          typedValueOf(rows, selection.id, "select").pipe(
            Option.filter((form) => integerForm.test(form)),
          ),
          (form) => ({ select: BigInt(form), selection }),
        ),
      ),
    );

    const selected = Option.match(bound, {
      onNone: () => [],
      onSome: ({ select, selection }) =>
        BigInt(required) <= select
          ? []
          : [
              breachAt(rows, selection, "Selection required", {
                required: String(required),
                select: String(select),
              }),
            ],
    });

    return selected;
  });
  const mappings = itemRefsOf(document).flatMap(({ itemRef, node }): readonly Breach[] => {
    const targets = elementsOf(rows, node.id)
      .filter(({ kind }) => kind === "qti-variable-mapping")
      .flatMap((mapping) =>
        Option.toArray(typedOr(rows, mapping.id, "target-identifier", "")).map((target) => ({
          mapping,
          target,
        })),
      );
    const byTarget = Map.groupBy(targets, ({ target }) => target);

    return [
      ...[...byTarget].flatMap(([target, held]) =>
        held
          .slice(1)
          .map(({ mapping }) =>
            breachAt(rows, mapping, "Variable mapping target", { itemRef, target }),
          ),
      ),
      ...targets
        .filter(({ target }) => sessionVariables.has(target))
        .map(({ mapping, target }) =>
          breachAt(rows, mapping, "Variable mapping target", { itemRef, target }),
        ),
    ];
  });

  return [...structure, ...sections, ...mappings];
};

/**
 * Judge each stimulus ref key of one listed document: no two of its stimulus refs share an
 * identifier, compared collapsed (§7.6.2: "each reference must have a unique identifier").
 *
 * @param listed - The document.
 * @returns The breaches.
 */
const stimulusRefKeyOf = (listed: ListedRows): readonly Breach[] => {
  const { rows } = listed;
  const refs = rows.members.flatMap((node) =>
    node.kind === "qti-assessment-stimulus-ref"
      ? Option.toArray(typedValueOf(rows, node.id, "identifier")).map((identifier) => ({
          identifier,
          node,
        }))
      : [],
  );

  return [...Map.groupBy(refs, ({ identifier }) => identifier)].flatMap(([identifier, held]) =>
    held.slice(1).map(({ node }) => breachAt(rows, node, "Stimulus ref key", { identifier })),
  );
};

/**
 * Judge what each item ref of a test or section document names, whether or not it writes an
 * identifier: its href, where it writes one, names an item or an LTI link of the package (B2, B3),
 * and one that writes none names nothing, which AL3 alone refuses (spec reading 155); each variable
 * mapping's source an outcome its item declares and its target no other variable of it (A34,
 * reading 97); and each template default's template a template its item declares (A37).
 *
 * @param input - The package.
 * @param document - The document.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const itemRefLawsOf = (
  input: PackageRows,
  document: TestDocument,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const { rows } = document.listed;

  return itemRefsOf(document).flatMap(({ itemRef, node }): readonly Breach[] => {
    const target = itemRefTargetOf(input, document.listed, node);
    const item = itemRefDocument(input, document.listed, node);
    // The href names an LTI link, or an item document the package holds: an item resource's
    // href whose file is missing, or whose root is no item, names no item (§5.6.5).
    const named = Option.match(target, {
      onNone: () => [],
      onSome: ({ path, type }) =>
        Option.exists(type, isLinkType) || Option.isSome(item)
          ? []
          : [breachAt(rows, node, "Item ref target", { path })],
    });
    // An item ref that names an LTI link names no item: a mapping under it is accepted unchecked
    // (reading 110), as the schema's `heldMappings` leaves out a mapping whose `MappingItemRefType`
    // names an LTI link.
    const linked = Option.exists(target, ({ type }) => Option.exists(type, isLinkType));
    const declared = item.pipe(Option.map((listed) => declarationsOf(listed.rows, grammar)));
    const kindsOf = (name: string): readonly string[] =>
      Option.match(declared, { onNone: () => [], onSome: (held) => held.get(name) ?? [] });
    const children = elementsOf(rows, node.id);
    const mappings = children
      .filter(({ kind }) => kind === "qti-variable-mapping")
      .flatMap((mapping): readonly Breach[] => {
        const source = Option.getOrElse(
          typedValueOf(rows, mapping.id, "source-identifier"),
          () => "",
        );
        const mapped = Option.getOrElse(
          typedValueOf(rows, mapping.id, "target-identifier"),
          () => "",
        );
        const sourced =
          linked || kindsOf(source).includes("qti-outcome-declaration")
            ? []
            : [breachAt(rows, mapping, "Variable mapping source", { itemRef, source })];
        const shadowed =
          kindsOf(mapped).length > 0 && mapped !== source
            ? [
                breachAt(rows, mapping, "Variable mapping target", {
                  itemRef,
                  target: mapped,
                }),
              ]
            : [];

        return [...sourced, ...shadowed];
      });
    const defaults = children
      .filter(({ kind }) => kind === "qti-template-default")
      .flatMap((templated): readonly Breach[] => {
        const template = Option.getOrElse(
          typedValueOf(rows, templated.id, "template-identifier"),
          () => "",
        );

        return kindsOf(template).includes("qti-template-declaration")
          ? []
          : [
              breachAt(rows, templated, "Template default target", {
                itemRef,
                template,
              }),
            ];
      });

    return [...named, ...mappings, ...defaults];
  });
};

/**
 * A test's assembly as its names and references read it: its instances, each placed name by
 * instance, and its written elements by identifier with the instances that place each.
 */
interface Assembled {
  readonly instances: readonly Instance[];
  readonly test: TestDocument;
  /**
   * Each written element, once however often it is placed (`AssembledName`), by identifier, with
   * its placed names.
   */
  readonly written: ReadonlyMap<string, readonly (readonly PlacedName[])[]>;
}

/**
 * Collect a test's assembly's names.
 *
 * @param test - The test.
 * @param instances - Its assembly.
 * @returns The assembly with its written elements.
 */
const assembledOf = (test: TestDocument, instances: readonly Instance[]): Assembled => {
  const byElement = new Map<NodeId, PlacedName[]>();
  for (const instance of instances) {
    for (const name of instance.document.names) {
      byElement.set(name.node.id, [
        ...(byElement.get(name.node.id) ?? []),
        placedName(instance, name),
      ]);
    }
  }

  const written = new Map<string, (readonly PlacedName[])[]>();
  for (const placed of byElement.values()) {
    const identifier = placed[0]?.name.identifier ?? "";
    written.set(identifier, [...(written.get(identifier) ?? []), placed]);
  }

  return { instances, test, written };
};

/**
 * Judge reading 86's key over a test's assembly: no two written elements share an identifier, a
 * section document placed twice naming each of its elements once.
 *
 * @param assembled - The test's assembly.
 * @returns The breaches, each at the element past the first.
 */
const testNameKeyOf = (assembled: Assembled): readonly Breach[] =>
  [...assembled.written].flatMap(([identifier, elements]) => {
    const first = elements[0]?.[0];

    return elements.slice(1).flatMap((placed) =>
      Option.toArray(Option.fromNullishOr(placed[0])).map(({ instance, name }) =>
        breachAt(instance.document.listed.rows, name.node, "Test name key", {
          identifier,
          other: first?.name.node.kind ?? "",
          test: assembled.test.listed.path,
        }),
      ),
    );
  });

/**
 * Whether a name's interval in its document holds a point of that document.
 *
 * @param name - The name.
 * @param point - The point, a node's start.
 * @returns Whether `start ≤ point < end`.
 */
const holdsPoint = (name: Name, point: bigint): boolean =>
  name.node.start <= point && point < name.node.end;

/**
 * Resolve a branch rule of an instance as reading 87 resolves it: its owner as the instance places
 * it, and its target, the written element its identifier names in an instance that holds the
 * rule's, the first in pre-order where several do.
 *
 * @param assembled - The test's assembly.
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @returns The owner's name and the target as placed, none where no instance holding the rule's
 *   places an element of the target's identifier.
 */
const resolutionOf = (
  assembled: Assembled,
  instance: Instance,
  rule: Rule,
): Option.Option<{ readonly owner: Name; readonly target: PlacedName }> => {
  const owner = instance.document.namesByNode.get(rule.owner.id);
  const target = (assembled.written.get(rule.target) ?? [])
    .flat()
    .toSorted((left, right) => left.instance.start - right.instance.start)
    .find((placed) => holds(placed.instance, instance));

  return owner === undefined || target === undefined
    ? Option.none()
    : Option.some({ owner, target });
};

/**
 * Judge `Branch_target` over a resolution: a test part's rule names a test part, any other's an
 * item ref, section or section ref of its own test part, never an item ref a selection with
 * replacement can repeat (information model §5.23, §5.98).
 *
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @param owner - Its owner's name.
 * @param target - Its target as placed.
 * @returns Whether the law holds.
 */
const targetHolds = (instance: Instance, rule: Rule, owner: Name, target: PlacedName): boolean => {
  const { kind } = target.name.node;
  const kindHolds =
    rule.owner.kind === testKinds.part
      ? kind === testKinds.part
      : kind !== testKinds.part && target.part === placedName(instance, owner).part;

  return kindHolds && !(kind === testKinds.itemRef && target.replaced);
};

/**
 * Judge `Branch_forward` over a resolution: the target lies at or after the owner's end in the
 * owner's instance, or after the site the rule's instance descends through in an instance above;
 * or, for a rule of no test part, the two do not nest and the nearest name holding both draws its
 * children's order at delivery, the target under a child of it that does not hold the source
 * (reading 87; information model §5.98).
 *
 * @param instance - The rule's instance.
 * @param rule - The rule.
 * @param owner - Its owner's name.
 * @param placed - Its target as placed.
 * @returns Whether the law holds.
 */
const forwardHolds = (instance: Instance, rule: Rule, owner: Name, placed: PlacedName): boolean => {
  // The child of the target's instance the rule's instance descends through, and the source's
  // point in the target's document: the owner's start, or that child's site's.
  let via = instance;
  while (via.parent !== undefined && via.parent !== placed.instance) {
    via = via.parent;
  }

  const same = placed.instance === instance;
  const point = same ? owner.node.start : via.siteStart;
  const target = placed.name;
  const forward = same ? target.node.start >= owner.node.end : target.node.start > point;
  const nested =
    holdsPoint(target, point) ||
    (same && owner.node.start <= target.node.start && target.node.start < owner.node.end);
  // The nearest name above the target in its document that holds the source's point, and its
  // child on the way down to the target.
  const named = placed.instance.document.namesByNode;
  let branch = target;
  let common = named.get(branch.parent);
  while (common !== undefined && !holdsPoint(common, point)) {
    branch = common;
    common = named.get(branch.parent);
  }

  const shuffled =
    common !== undefined && !holdsPoint(branch, point) && placedName(placed.instance, common).mixes;

  return forward || (rule.owner.kind !== testKinds.part && !nested && shuffled);
};

/**
 * Judge reading 87 over each branch rule of each instance of a test's assembly, as `Branch_target`
 * and `Branch_forward` judge its resolution (`tests.ts` `branchLaws`): a rule that resolves to
 * no element an instance holding its own places breaks `Branch target`, and so does one whose
 * target {@link targetHolds} refuses; one {@link forwardHolds} refuses breaks `Branch forward`.
 *
 * @param assembled - The test's assembly.
 * @returns The breaches.
 */
const branchLawsOf = (assembled: Assembled): readonly Breach[] =>
  assembled.instances.flatMap((instance) =>
    instance.document.rules.flatMap((rule): readonly Breach[] => {
      const { rows } = instance.document.listed;
      const keys = {
        instance: String(instance.start),
        owner: Option.getOrElse(typedValueOf(rows, rule.owner.id, "identifier"), () => ""),
        target: rule.target,
        test: assembled.test.listed.path,
      };

      return Option.match(resolutionOf(assembled, instance, rule), {
        onNone: () => [breachAt(rows, rule.node, "Branch target", keys)],
        onSome: ({ owner, target }) => {
          if (!targetHolds(instance, rule, owner, target)) {
            return [breachAt(rows, rule.node, "Branch target", keys)];
          }

          return forwardHolds(instance, rule, owner, target)
            ? []
            : [breachAt(rows, rule.node, "Branch forward", keys)];
        },
      });
    }),
  );

/**
 * What a test's assembly holds under one name (`NameLookup`): the written element with that
 * identifier, its kind, how many instances place it, whether a replacement can repeat it in one of
 * them, and, for an item ref, the type of what it names and its item.
 */
interface Looked {
  readonly item: Option.Option<ListedRows>;
  readonly kind: string;
  readonly node: Row;
  readonly placements: number;
  readonly referrer: ListedRows;
  readonly replaced: boolean;
  readonly type: Option.Option<string>;
}

/**
 * Look a name up in a test's assembly.
 *
 * @param input - The package.
 * @param assembled - The test's assembly.
 * @param name - The name.
 * @returns What it names, none where the assembly holds no element of that identifier.
 */
const lookUp = (input: PackageRows, assembled: Assembled, name: string): Option.Option<Looked> =>
  Option.map(
    Option.fromNullishOr(assembled.written.get(name)?.[0]?.[0]),
    ({ instance, name: held, replaced }): Looked => {
      const referrer = instance.document.listed;
      const { node } = held;
      const isItemRef = node.kind === testKinds.itemRef;

      return {
        item: isItemRef ? itemRefDocument(input, referrer, node) : Option.none(),
        kind: node.kind,
        node,
        placements: assembled.written.get(name)?.[0]?.length ?? 0,
        referrer,
        replaced,
        type: isItemRef
          ? Option.flatMap(itemRefTargetOf(input, referrer, node), ({ type }) => type)
          : Option.none(),
      };
    },
  );

/**
 * One reading of a test-level variable reference (`Reading`, readings 48 and 88): its form, the
 * scope it reads, the variable, and how it resolves.
 */
interface Read {
  /**
   * The declaration kind its variable is, or stands as for a built-in or a mapped variable; `none`
   * where it names none.
   */
  readonly declarationKind: string;
  readonly form: "numbered" | "split" | "unsplit";
  /**
   * The kinds of its variable's declaration's children, `qti-mapping` and `qti-area-mapping` among
   * them: only an item's declared variable has any.
   */
  readonly tables: readonly string[];
  readonly placements: number;
  readonly resolves: boolean;
  readonly source: "builtIn" | "declared" | "linked" | "mapped" | "none";
  readonly text: string;
}

/**
 * Name where an unsplit reading's variable comes from: the test's declarations, else its
 * built-ins.
 *
 * @param declared - Whether the test declares it.
 * @param builtIn - Whether it is a test's built-in.
 * @returns The source.
 */
const sourceOf = (declared: boolean, builtIn: boolean): Read["source"] => {
  if (declared) {
    return "declared";
  }

  return builtIn ? "builtIn" : "none";
};

/**
 * Read one test-level variable reference every way its name reads (readings 48 and 88): unsplit,
 * the test's own variable; split at each dot, a scope's variable; and numbered at a dot followed by
 * digits and a further dot, an instance of a scope.
 *
 * @param context - What the readings look up.
 * @param context.assembled - The test's assembly.
 * @param context.builtIns - The built-in variables by root kind.
 * @param context.grammar - The composed grammar.
 * @param context.input - The package.
 * @param context.testDeclared - The test's declared identifiers.
 * @param identifier - The reference's name.
 * @param kind - The referring element's kind.
 * @returns Its readings.
 */
const readingsOf = (
  context: {
    readonly assembled: Assembled;
    readonly builtIns: ReadonlyMap<string, ReadonlyMap<string, string>>;
    readonly grammar: ComposedGrammar;
    readonly input: PackageRows;
    readonly testDeclared: ReadonlyMap<string, readonly string[]>;
  },
  identifier: string,
  kind: string,
): readonly Read[] => {
  const { assembled, builtIns, grammar, input, testDeclared } = context;
  const setter = setterKinds.has(kind);
  const pieces = identifier.split(".");
  const testBuiltIns = builtIns.get(testKinds.test) ?? new Map<string, string>();
  const itemBuiltIns = builtIns.get(testKinds.item) ?? new Map<string, string>();
  const sectionBuiltIns = builtIns.get(testKinds.section) ?? new Map<string, string>();
  const unsplitSource = sourceOf(testDeclared.has(identifier), testBuiltIns.has(identifier));
  const unsplit: Read = {
    declarationKind: testDeclared.get(identifier)?.[0] ?? testBuiltIns.get(identifier) ?? "none",
    form: "unsplit",
    placements: 1,
    resolves: unsplitSource !== "none",
    source: unsplitSource,
    tables: [],
    text: identifier,
  };
  const scoped = (
    form: "numbered" | "split",
    scope: string,
    variable: string,
    number: string,
  ): Read => {
    const looked = lookUp(input, assembled, scope);
    const resolved = Option.match(looked, {
      onNone: () => ({ declarationKind: "none", source: "none" as const, tables: [] }),
      onSome: (held): Pick<Read, "declarationKind" | "source" | "tables"> => {
        if (held.kind === testKinds.itemRef && Option.exists(held.type, isLinkType)) {
          // An LTI link has no declarations to resolve a name against: a name read through it is
          // accepted unchecked, a recorded limit (reading 110).
          return { declarationKind: "none", source: "linked", tables: [] };
        }

        if (held.kind === testKinds.itemRef) {
          const declarations = Option.match(held.item, {
            onNone: () => new Map<string, readonly string[]>(),
            onSome: (item) => declarationsOf(item.rows, grammar),
          });
          const declared = Option.contains(held.type, itemResourceType)
            ? declarations.get(variable)?.[0]
            : undefined;
          const mapping = elementsOf(held.referrer.rows, held.node.id).find(
            ({ id, kind: child }) =>
              child === "qti-variable-mapping" &&
              Option.contains(typedValueOf(held.referrer.rows, id, "target-identifier"), variable),
          );
          if (declared !== undefined) {
            return {
              declarationKind: declared,
              source: "declared",
              tables: Option.match(held.item, {
                onNone: () => [],
                onSome: (item) => tablesIn(item.rows, grammar, variable),
              }),
            };
          }

          if (mapping !== undefined) {
            // A mapped name stands as its source's declaration, an outcome where it names one.
            const source = Option.getOrElse(
              typedValueOf(held.referrer.rows, mapping.id, "source-identifier"),
              () => "",
            );

            return {
              declarationKind: declarations.get(source)?.[0] ?? "qti-outcome-declaration",
              source: "mapped",
              tables: [],
            };
          }

          const builtIn = itemBuiltIns.get(variable);

          return builtIn === undefined
            ? { declarationKind: "none", source: "none", tables: [] }
            : { declarationKind: builtIn, source: "builtIn", tables: [] };
        }

        return form === "split" && durationScopes.has(held.kind) && variable === "duration"
          ? {
              declarationKind: sectionBuiltIns.get(variable) ?? "none",
              source: "builtIn",
              tables: [],
            }
          : { declarationKind: "none", source: "none", tables: [] };
      },
    });
    const { source } = resolved;
    const numbered =
      form !== "numbered" ||
      (Option.exists(looked, ({ replaced }) => replaced) && positiveNumber.test(number));

    return {
      declarationKind: resolved.declarationKind,
      form,
      placements: Option.match(looked, { onNone: () => 0, onSome: ({ placements }) => placements }),
      resolves: source !== "none" && !setter && numbered,
      source,
      tables: resolved.tables,
      text: number === "" ? `${scope} . ${variable}` : `${scope} . ${number} . ${variable}`,
    };
  };
  const splits = pieces
    .slice(1)
    .map((_, at) =>
      scoped("split", pieces.slice(0, at + 1).join("."), pieces.slice(at + 1).join("."), ""),
    );
  const numbers = pieces
    .slice(1, -1)
    .flatMap((piece, at) =>
      digitsOnly.test(piece)
        ? [
            scoped(
              "numbered",
              pieces.slice(0, at + 1).join("."),
              pieces.slice(at + 2).join("."),
              piece,
            ),
          ]
        : [],
    );

  return [unsplit, ...splits, ...numbers];
};

/**
 * Judge a section document's feedback reference to a built-in session variable as the schema's
 * `Feedback_outcome_type` judges the one `SectionFeedbackRef` resolves under each test that reaches
 * it: a built-in stands as the type its name has (`completionStatus` an identifier, `numAttempts`
 * and `duration` not). A declared outcome's type is {@link contentBreachesOf}'s, over every
 * document the test reads.
 *
 * @param assembled - The test's assembly.
 * @param grammar - The composed grammar.
 * @param rows - The section document.
 * @param node - The element.
 * @returns The breaches.
 */
const feedbackTypeOf = (
  assembled: Assembled,
  grammar: ComposedGrammar,
  rows: View,
  node: Row,
): readonly Breach[] => {
  const named = typedValueOf(rows, node.id, "outcome-identifier");
  if (
    Option.isNone(named) ||
    !grammar.references.contentReference.rows.some(
      (row) => row.kind === node.kind && row.attribute === "outcome-identifier",
    )
  ) {
    return [];
  }

  // A built-in session variable's name is declared by no test. A feedback may name only one that
  // stands as an outcome ("Feedback reference"): of the item root's rows, `completionStatus`, a
  // single identifier. Any other, `numAttempts` and `duration` among them, "Feedback reference"
  // alone refuses, as the import's rows do.
  const at = { root: "qti-assessment-item", variable: named.value };
  const baseType = Option.map(grammar.references.builtInBaseType.lookup(at), (row) => row.baseType);

  return Option.toArray(grammar.references.builtIn.lookup(at))
    .filter(
      ({ cardinality, declaration }) =>
        declaration === "qti-outcome-declaration" &&
        (!Option.contains(baseType, "identifier") ||
          (cardinality !== "single" && cardinality !== "multiple")),
    )
    .map(({ cardinality }) =>
      breachAt(rows, node, "Feedback outcome type", {
        assembly: assembled.test.listed.path,
        ...Option.match(baseType, { onNone: () => ({}), onSome: (held) => ({ baseType: held }) }),
        cardinality,
        identifier: named.value,
      }),
    );
};

/**
 * Collect the documents a test's references read, once each: every document its assembly places,
 * and every document one of them splices in place, at any depth (spec reading 117), since a
 * fragment's content is the content of the document that includes it, as XInclude's result holds
 * it.
 *
 * @param input - The package.
 * @param assembled - The test's assembly.
 * @returns The documents, in pre-order: each placed one, then what it splices.
 */
const readDocumentsOf = (input: PackageRows, assembled: Assembled): readonly ListedRows[] => {
  const byPath = new Map(
    input.documents.map((listed) => [listed.path, listed] as const).toReversed(),
  );
  const read: ListedRows[] = [];
  const seen = new Set<string>();
  const visit = (listed: ListedRows): void => {
    if (!seen.has(listed.path)) {
      seen.add(listed.path);
      read.push(listed);
      for (const path of input.spliced.get(listed.path) ?? []) {
        for (const target of Option.toArray(Option.fromNullishOr(byPath.get(path)))) {
          visit(target);
        }
      }
    }
  };
  for (const { document } of assembled.instances) {
    visit(document.listed);
  }

  return read;
};

/**
 * Read the variable a reference attribute's value names, by the reference's spelling: a bare
 * reference's collapsed value when it is an NCName, a braced reference's identifier between the
 * braces. Any other value is a literal and names nothing.
 *
 * @param lexical - The attribute's value as written.
 * @param spelling - How its value spells a name.
 * @returns The name, none for a literal.
 */
const spelledName = (lexical: string, spelling: "bare" | "braced"): Option.Option<string> =>
  spelling === "bare"
    ? Option.liftPredicate(collapsed(lexical), (name) => ncName.test(name))
    : Option.fromNullishOr(/^\{(?<name>[^{}]+)\}$/u.exec(lexical)?.groups?.["name"]);

/**
 * Judge a content reference of a document a test reads (the port audit's A43 to A45, spec readings
 * 77 and 117): a feedback element's outcome, a template element's or a choice's template variable,
 * a printed variable's name, base or index, a context variable, each naming a variable the test
 * declares of a kind its element may name (`ContentReference`), or a built-in variable of the test
 * that stands as one, never a reading through a scope: "The outcome variable or template variable
 * must have been defined" (information model §7.30.6), and a prefix names an item's variable
 * "during outcomes processing" alone (§ Variable). A feedback element's outcome is an identifier of
 * single or multiple cardinality ("Feedback outcome type").
 *
 * @param context - What the reference resolves in.
 * @param context.builtIns - The test's built-in variables, each with the declaration kind it
 *   stands as.
 * @param context.outcomes - The test's outcome declarations, by identifier.
 * @param context.testDeclared - The test's declared identifiers, each with its declaration kinds.
 * @param context.test - The test's path.
 * @param reference - The reference.
 * @param reference.attribute - The attribute it makes it by.
 * @param reference.identifier - The name it spells.
 * @param reference.node - The referring element.
 * @param reference.rows - The referring element's document.
 * @param reference.targets - The declaration kinds it may name.
 * @returns The breaches.
 */
const contentBreachesOf = (
  context: {
    readonly builtIns: ReadonlyMap<string, string>;
    readonly outcomes: ReadonlyMap<string, { readonly node: Row; readonly rows: View }>;
    readonly test: string;
    readonly testDeclared: ReadonlyMap<string, readonly string[]>;
  },
  reference: {
    readonly attribute: string;
    readonly identifier: string;
    readonly node: Row;
    readonly rows: View;
    readonly targets: ReadonlySet<string>;
  },
): readonly Breach[] => {
  const { attribute, identifier, node, rows, targets } = reference;
  const declared = (context.testDeclared.get(identifier) ?? []).some((kind) => targets.has(kind));
  const builtIn = Option.exists(Option.fromNullishOr(context.builtIns.get(identifier)), (kind) =>
    targets.has(kind),
  );
  const unresolved =
    declared || builtIn
      ? []
      : Option.toArray(contentLawOf(node.kind, attribute)).map((law) =>
          breachAt(rows, node, law, { attribute, identifier }),
        );
  const outcome = Option.fromNullishOr(
    attribute === "outcome-identifier" && declared ? context.outcomes.get(identifier) : undefined,
  );
  // The outcome's type as its type reads it, as an item's feedback reads it, each half where what
  // it reads spells something (spec readings 158 and 159): its cardinality where it has one, a
  // record's being neither single nor multiple, and its base type where it has one. One that is
  // unwritten, or written outside its value domain (empty, spelling nothing, or padded, as the
  // type's whiteSpace is `preserve`), is AL3's, Declaration base type's or that domain's alone,
  // never judged as a type the outcome does not have (the orchestrator's ruling of 2026-11-06; lane
  // NIL's audit, B11 and B12).
  const typed = outcome.pipe(
    Option.map((held) => ({
      baseType: typedValueOf(held.rows, held.node.id, "base-type"),
      cardinality: typedValueOf(held.rows, held.node.id, "cardinality"),
    })),
  );

  return [
    ...unresolved,
    ...Option.toArray(typed)
      .filter(
        ({ baseType, cardinality }) =>
          Option.exists(cardinality, (held) => held !== "single" && held !== "multiple") ||
          Option.exists(baseType, (held) => held !== "identifier"),
      )
      .map(({ baseType, cardinality }) =>
        breachAt(rows, node, "Feedback outcome type", {
          ...Option.match(baseType, { onNone: () => ({}), onSome: (held) => ({ baseType: held }) }),
          ...Option.match(cardinality, {
            onNone: () => ({}),
            onSome: (held) => ({ cardinality: held }),
          }),
          identifier,
        }),
      ),
  ];
};

/**
 * Judge each test-level reference of each document a test reads, once per test (reading 5): every
 * document its assembly places, and every fragment one of them splices (reading 117,
 * {@link readDocumentsOf}). A `section-identifier` names one section or section ref of the assembly,
 * placed once (A61); a variable reference processing makes has exactly one reading that resolves,
 * through a name the test places once (M3, readings 48 and 88), and an unprefixed one that resolves
 * nowhere names nothing (P8); and a content reference, one `ContentReference` names, resolves in
 * the test's declarations or its built-ins ({@link contentBreachesOf}).
 *
 * @param input - The package.
 * @param assembled - The test's assembly.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const referenceLawsOf = (
  input: PackageRows,
  assembled: Assembled,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const builtIns = new Map<string, Map<string, string>>();
  for (const { declaration, root, variable } of grammar.references.builtIn.rows) {
    builtIns.set(root, new Map([...(builtIns.get(root) ?? []), [variable, declaration]]));
  }

  const testRows = assembled.test.listed.rows;
  const context = {
    assembled,
    builtIns,
    grammar,
    input,
    testDeclared: declarationsOf(testRows, grammar),
  };
  const test = assembled.test.listed.path;
  const contents = {
    builtIns: builtIns.get(testKinds.test) ?? new Map<string, string>(),
    outcomes: new Map(
      testRows.members
        .filter(({ kind }) => kind === "qti-outcome-declaration")
        .flatMap((node) =>
          Option.toArray(typedValueOf(testRows, node.id, "identifier")).map(
            (identifier) => [identifier, { node, rows: testRows }] as const,
          ),
        )
        .toReversed(),
    ),
    test,
    testDeclared: context.testDeclared,
  };
  const targetsOf = (kind: string, attribute: string): ReadonlySet<string> =>
    new Set(
      grammar.references.contentReference.rows
        .filter((row) => row.kind === kind && row.attribute === attribute)
        .map(({ declaration }) => declaration),
    );

  const sectionPaths = new Set(
    assembled.instances
      .filter(({ document }) => document.rootKind === testKinds.section)
      .map(({ document }) => document.listed.path),
  );

  return readDocumentsOf(input, assembled).flatMap(({ path, rows }) =>
    rows.members.flatMap((node): readonly Breach[] => {
      const sections = Option.toArray(typedValueOf(rows, node.id, "section-identifier")).flatMap(
        (identifier) => {
          const looked = lookUp(input, assembled, identifier);
          const named = Option.exists(
            looked,
            ({ kind, placements }) =>
              (kind === testKinds.section || kind === testKinds.sectionRef) && placements === 1,
          );

          return named
            ? []
            : [breachAt(rows, node, "Section identifier target", { assembly: test, identifier })];
        },
      );
      const variables = grammar.references.variableReference.rows
        .filter(({ kind }) => kind === node.kind)
        .flatMap(({ attribute, spelling }) =>
          Option.toArray(
            Option.flatMap(valueOf(rows, node.id, attribute), (lexical) =>
              spelledName(lexical, spelling),
            ),
          ).flatMap((identifier): readonly Breach[] => {
            const targets = targetsOf(node.kind, attribute);
            if (targets.size > 0) {
              return contentBreachesOf(contents, { attribute, identifier, node, rows, targets });
            }

            if (node.kind === "qti-random-float" && /^(?:INF|NaN)$/u.test(identifier)) {
              return [];
            }

            const readings = readingsOf(context, identifier, node.kind);
            const resolving = readings.filter(({ resolves }) => resolves);
            const keys = {
              assembly: test,
              attribute,
              identifier,
              readings: resolving.map(({ text }) => text).join("; "),
              resolving: String(resolving.length),
            };
            // Reading R15-k: a braced reference, a string attribute's, that resolves nowhere is a
            // string value, so it is neither undeclared nor short of a resolving reading; two
            // resolving readings are still ambiguous.
            const braced = spelling === "braced";
            const prefixed =
              (braced
                ? resolving.length > 1
                : resolving.length !== 1 && !setterKinds.has(node.kind)) ||
              resolving.some(({ placements }) => placements !== 1);
            const undeclared =
              !braced &&
              !identifier.includes(".") &&
              readings.some(({ form, source }) => form === "unsplit" && source === "none");
            // Variable kind over the readings: a setter's name resolves, and every resolving
            // reading by `identifier` names a declaration kind its element reads or sets.
            const allowed = declarationKindsOf(node.kind);
            const misnamed =
              attribute === "identifier" &&
              allowed.length > 0 &&
              ((setterKinds.has(node.kind) && resolving.length === 0) ||
                resolving.some(
                  ({ declarationKind, source }) =>
                    source !== "linked" && !allowed.includes(declarationKind),
                ));

            // Mapped response over the prefixed readings (decisions 429 and 431, reading 163):
            // a map response's or a map response point's resolving reading of a response variable
            // reads a mapping or an area mapping its declaration holds, which a built-in has none
            // of; one of anything but a response is Variable kind's alone, and one through an LTI
            // link resolves unchecked (reading 110).
            const table = readTables.get(node.kind);
            const unmapped = resolving.filter(
              ({ declarationKind, form, source, tables }) =>
                attribute === "identifier" &&
                table !== undefined &&
                form !== "unsplit" &&
                source !== "linked" &&
                declarationKind === "qti-response-declaration" &&
                !tables.includes(table),
            );

            return [
              ...(prefixed ? [breachAt(rows, node, "Prefixed reference", keys)] : []),
              ...unmapped.map(({ declarationKind }) =>
                breachAt(rows, node, "Mapped response", {
                  declarationKind,
                  identifier,
                  kind: node.kind,
                }),
              ),
              ...(undeclared ? [breachAt(rows, node, "Variable declared", { identifier })] : []),
              ...(misnamed
                ? [
                    breachAt(rows, node, "Variable kind", {
                      allowed: allowed.join(" "),
                      declarationKind: resolving
                        .map(({ declarationKind }) => declarationKind)
                        .join(" "),
                      identifier,
                    }),
                  ]
                : []),
            ];
          }),
        );

      const feedbacks = sectionPaths.has(path)
        ? feedbackTypeOf(assembled, grammar, rows, node)
        : [];

      return [...sections, ...variables, ...feedbacks];
    }),
  );
};

/**
 * Judge one folded document by the laws of this module it states alone: none, since every law
 * here reads a document's own rows as the package lists it, not the merged rows of an include.
 *
 * @param _rows - The document.
 * @param _grammar - The composed grammar.
 * @returns No breach.
 */
export const testDocumentBreaches = (
  _rows: View,
  _grammar: ComposedGrammar,
): readonly Breach[] => [];

/**
 * Judge a package by the laws of its tests and sections: each test or section document's own
 * laws and its item refs', each listed document's stimulus refs, and each test's assembly.
 *
 * @param input - The package.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
export const testPackageBreaches = (
  input: PackageRows,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const documents = testDocumentsOf(input, grammar);
  const assemblies = [...documents.values()]
    .filter(({ rootKind }) => rootKind === testKinds.test)
    .map((test) => assembledOf(test, assemblyOf(documents, test)));

  return [
    ...[...documents.values()].flatMap((document) => [
      ...documentLawsOf(document),
      ...itemRefLawsOf(input, document, grammar),
    ]),
    ...input.documents.flatMap(stimulusRefKeyOf),
    ...assemblies.flatMap((assembled) => [
      ...testNameKeyOf(assembled),
      ...branchLawsOf(assembled),
      ...referenceLawsOf(input, assembled, grammar),
    ]),
  ];
};
