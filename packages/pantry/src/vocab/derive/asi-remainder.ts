/**
 * The deriver of the ASI remainder: the 51 elements of the ASI XSD that the eleven composed
 * vocabularies hold no kind for, read into 61 kinds. It prints
 * `src/vocab/inventory/asi-remainder.ts`, and reads the facts `src/vocab/asi-remainder.ts` states
 * beside that leaf, which the leaf's entries cannot hold: which kinds hold character data, which
 * hold only wildcard content, which host resolves a multi-type element to which handle, and what
 * the 3.0.1 XSD adds over 3.0.0.
 *
 * Run it from `packages/pantry` as `node src/vocab/derive/asi-remainder.ts`; it reads only the
 * files `sources.ts` pins, from the shared cache, and touches no database. The leaf is regenerated
 * with:
 *
 * ```sh
 * node src/vocab/derive/asi-remainder.ts > src/vocab/inventory/asi-remainder.ts
 * pnpm exec vp fmt src/vocab/inventory/asi-remainder.ts
 * ```
 *
 * It reads by `derive.ts`'s rules, through {@link entryOf}, and adds three of its own:
 *
 * - An element whose type is simple (a built-in, a top-level `xs:simpleType`, or an anonymous one)
 *   has no attributes and no element children, and its entry names that type: for an anonymous
 *   type, the base of its restriction, as an attribute row names an inline type.
 * - A host resolves a reference to an element of several types by the type its content model declares
 *   the element with. The content model is read as `derive.ts` reads it (its base type's particles
 *   ahead of its own for an extension, its own alone for a restriction, none for `simpleContent`),
 *   to each element declaration with its `type`.
 * - A kind's content is `simple` when its type is simple or has `simpleContent`, `mixed` when its
 *   type is mixed, `element` when it references an element or may hold a wildcard's, and `empty`
 *   otherwise.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import { Array as Arr, Console, Effect, Equal, Layer, Option, Order, Result } from "effect";
import { Command } from "effect/cli";
import { Digest } from "effect/crypto";
import type { Element } from "@qti-pie/crust/tree.ts";
import {
  attributeOf,
  elementsOf,
  entriesOf,
  entryOf,
  firstXs,
  isXs,
  leaves,
  loadSchema,
  renderLeaf,
  requireAttribute,
  requireComponent,
  resolve,
  soleTypeOf,
  vocabularies,
  XsdReadingError,
} from "#pantry/vocab/derive/derive.ts";
import type {
  AttributeRow,
  Entry,
  KindSpec,
  LeafSpec,
  XsdSchema,
} from "#pantry/vocab/derive/derive.ts";

/**
 * The XML Schema namespace, which every built-in simple type is in.
 */
const XS = "http://www.w3.org/2001/XMLSchema";

/**
 * Refuse a construct the reading rules do not cover.
 *
 * @param detail - The construct and what about it is not read.
 * @returns The failure.
 */
const refuse = (detail: string): Result.Result<never, XsdReadingError> =>
  Result.fail(new XsdReadingError({ detail }));

/**
 * The remainder's kinds as the deriver reads them: the handles that are an element of exactly one
 * named type, and the handles whose type the spec names.
 *
 * `typed` holds the kinds of the three remainder elements with several types (`qti-file-href` and
 * the two increments), the test vocabulary's kinds of two ASI elements whose other types are
 * `derive.ts`'s (`qti-rubric-block`, `qti-content-body`), and `qti-calculator-type`, whose one
 * declaration has an anonymous restriction of `xs:string`, so its entry names `xs:string`.
 *
 * A dotted handle's qualifier names its type in lower camel case, shortened as `derive.ts`'s are
 * (`qti-content-body.rubric` is `RubricBlockContentBodyDType`): the increments' types before
 * `ValueDType` (`radialSI`, `siLinear`), `card` for `FileHrefCardDType`, `test` for
 * `TestRubricBlockDType`, and `testFeedback` and `testRubric` for the two test content bodies, as
 * the SSML vocabulary also names them.
 */
export const remainder = {
  plain: [
    "qti-adaptive-engine-ref",
    "qti-adaptive-selection",
    "qti-adaptive-settings-ref",
    "qti-assessment-item-ref",
    "qti-assessment-section",
    "qti-assessment-section-ref",
    "qti-assessment-stimulus",
    "qti-assessment-stimulus-ref",
    "qti-assessment-test",
    "qti-branch-rule",
    "qti-calculator",
    "qti-calculator-info",
    "qti-card",
    "qti-card-entry",
    "qti-catalog",
    "qti-context-variable",
    "qti-custom-interaction",
    "qti-description",
    "qti-digital-material",
    "qti-html-content",
    "qti-increment-si",
    "qti-increment-us",
    "qti-interaction-markup",
    "qti-interaction-module",
    "qti-interaction-modules",
    "qti-item-session-control",
    "qti-metadata-ref",
    "qti-minimum-length",
    "qti-ordering",
    "qti-physical-material",
    "qti-portable-custom-interaction",
    "qti-pre-condition",
    "qti-protractor",
    "qti-resource-icon",
    "qti-rule",
    "qti-rule-system-si",
    "qti-rule-system-us",
    "qti-selection",
    "qti-stimulus-body",
    "qti-template-default",
    "qti-template-variable",
    "qti-test-feedback",
    "qti-test-part",
    "qti-time-limits",
    "qti-usagedata-ref",
    "qti-variable-mapping",
    "qti-weight",
  ],
  typed: {
    "qti-calculator-type": { element: "qti-calculator-type", type: "xs:string" },
    "qti-content-body.testFeedback": {
      element: "qti-content-body",
      type: "TestFeedbackFlowContentBodyDType",
    },
    "qti-content-body.testRubric": {
      element: "qti-content-body",
      type: "TestRubricBlockContentBodyDType",
    },
    "qti-file-href": { element: "qti-file-href", type: "FileHrefDType" },
    "qti-file-href.card": { element: "qti-file-href", type: "FileHrefCardDType" },
    "qti-major-increment.radialSI": {
      element: "qti-major-increment",
      type: "RadialSIValueDType",
    },
    "qti-major-increment.radialUS": {
      element: "qti-major-increment",
      type: "RadialUSValueDType",
    },
    "qti-major-increment.siLinear": {
      element: "qti-major-increment",
      type: "SILinearValueDType",
    },
    "qti-major-increment.usLinear": {
      element: "qti-major-increment",
      type: "USLinearValueDType",
    },
    "qti-minor-increment.radialSI": {
      element: "qti-minor-increment",
      type: "RadialSIValueDType",
    },
    "qti-minor-increment.radialUS": {
      element: "qti-minor-increment",
      type: "RadialUSValueDType",
    },
    "qti-minor-increment.siLinear": {
      element: "qti-minor-increment",
      type: "SILinearValueDType",
    },
    "qti-minor-increment.usLinear": {
      element: "qti-minor-increment",
      type: "USLinearValueDType",
    },
    "qti-rubric-block.test": { element: "qti-rubric-block", type: "TestRubricBlockDType" },
  },
} as const;

/**
 * Every remainder kind with its element and type: a plain handle's type is its element's sole
 * declared type, and a typed handle's is the one {@link remainder} names.
 *
 * @param schema - An ASI schema.
 * @returns The kinds, in handle order.
 */
export const kindSpecsOf = (
  schema: XsdSchema,
): Result.Result<readonly KindSpec[], XsdReadingError> =>
  Result.gen(function* kindSpecsOfBody() {
    const specs: KindSpec[] = [];

    for (const handle of remainder.plain) {
      specs.push({ element: handle, handle, type: yield* soleTypeOf(schema, handle) });
    }

    for (const [handle, { element, type }] of Object.entries(remainder.typed)) {
      specs.push({ element, handle, type });
    }

    return Arr.sort(
      specs,
      Order.mapInput(Order.String, (spec: KindSpec) => spec.handle),
    );
  });

/**
 * A type as an element declaration names it: a complex type of the document, or a simple type.
 */
type Declared =
  | { readonly _tag: "Complex"; readonly definition: Element }
  | { readonly _tag: "Simple" };

/**
 * Classify the type a kind's element is declared with.
 *
 * @param schema - The schema the type is written in.
 * @param type - The type's name, or for an anonymous type the base of its restriction.
 * @returns `Complex` with the definition for a top-level complex type of the document, `Simple` for
 *   a built-in or a top-level simple type, or an {@link XsdReadingError} for a name that is
 *   neither.
 */
const declaredOf = (schema: XsdSchema, type: string): Result.Result<Declared, XsdReadingError> =>
  Result.gen(function* declaredOfBody() {
    const name = yield* resolve(schema, type);

    if (name.namespace === XS) {
      return { _tag: "Simple" } as const;
    }

    const complex = Option.fromNullishOr(
      name.namespace === schema.targetNamespace ? schema.complexTypes.get(name.local) : undefined,
    );

    if (Option.isSome(complex)) {
      return { _tag: "Complex", definition: complex.value } as const;
    }

    yield* requireComponent(schema, schema.simpleTypes, "simpleType", type);

    return { _tag: "Simple" } as const;
  });

/**
 * Read one remainder kind's entry: by {@link entryOf} for a complex type, and as an element with no
 * attributes and no children for a simple one.
 *
 * @param schema - An ASI schema.
 * @param kind - The kind.
 * @returns The entry.
 */
const remainderEntryOf = (
  schema: XsdSchema,
  kind: KindSpec,
): Result.Result<Entry, XsdReadingError> =>
  Result.gen(function* remainderEntryOfBody() {
    const declared = yield* declaredOf(schema, kind.type);

    if (declared._tag === "Complex") {
      return yield* entryOf(schema, kind);
    }

    return { ...kind, attributes: [], choices: [], mixed: false, references: [], wildcard: false };
  });

/**
 * Read the remainder's inventory entries.
 *
 * @param schema - An ASI schema: 3.0.1 for the leaf, 3.0.0 to compare.
 * @returns The 61 entries, in handle order.
 */
export const remainderEntriesOf = (
  schema: XsdSchema,
): Result.Result<readonly Entry[], XsdReadingError> =>
  Result.gen(function* remainderEntriesOfBody() {
    const entries: Entry[] = [];

    for (const kind of yield* kindSpecsOf(schema)) {
      entries.push(yield* remainderEntryOf(schema, kind));
    }

    return entries;
  });

/**
 * One element declaration or reference a content model holds, with the type the declaration
 * names: `None` for a reference and for an anonymous type.
 */
interface Declaration {
  readonly name: string;
  readonly type: Option.Option<string>;
}

/**
 * Whether an element is a compositor or a group reference: a particle that holds particles.
 *
 * @param node - The element.
 * @returns Whether it is an `xs:sequence`, `xs:choice`, `xs:all` or `xs:group`.
 */
const holdsParticles = (node: Element): boolean =>
  ["sequence", "choice", "all", "group"].some((local) => isXs(node, local));

/**
 * Read consecutive particles to the element declarations they hold.
 *
 * @param schema - The schema the particles are in.
 * @param particles - The particles, in order.
 * @returns The declarations, in order; a wildcard or an annotation holds none.
 */
const declarationsIn = (
  schema: XsdSchema,
  particles: readonly Element[],
): Result.Result<readonly Declaration[], XsdReadingError> =>
  Result.gen(function* declarationsInBody() {
    const found: Declaration[] = [];

    for (const particle of particles) {
      if (isXs(particle, "element")) {
        const name = yield* Option.match(
          Option.orElse(attributeOf(particle, "name"), () => attributeOf(particle, "ref")),
          {
            onNone: () => refuse("an xs:element has neither a name nor a ref"),
            onSome: (value) => Result.succeed(value),
          },
        );

        found.push({ name, type: attributeOf(particle, "type") });
      } else if (isXs(particle, "group")) {
        const group = yield* requireComponent(
          schema,
          schema.groups,
          "group",
          yield* requireAttribute(particle, "ref"),
        );

        found.push(...(yield* declarationsIn(schema, elementsOf(group))));
      } else if (holdsParticles(particle)) {
        found.push(...(yield* declarationsIn(schema, elementsOf(particle))));
      }
    }

    return found;
  });

/**
 * Read a complex type's content to the element declarations it holds.
 *
 * @param schema - The schema the type is in.
 * @param complexType - The `xs:complexType` element.
 * @returns The declarations, its base type's first for an extension; none for `simpleContent`.
 */
const declarationsOf = (
  schema: XsdSchema,
  complexType: Element,
): Result.Result<readonly Declaration[], XsdReadingError> =>
  Result.gen(function* declarationsOfBody() {
    const content = firstXs(complexType, "complexContent");

    if (Option.isNone(content)) {
      return yield* declarationsIn(schema, elementsOf(complexType).filter(holdsParticles));
    }

    const step = yield* Option.match(
      Arr.findFirst(elementsOf(content.value), (child) =>
        ["extension", "restriction"].some((local) => isXs(child, local)),
      ),
      {
        onNone: () => refuse("an xs:complexContent holds neither xs:extension nor xs:restriction"),
        onSome: (found) => Result.succeed(found),
      },
    );
    const base = yield* resolve(schema, yield* requireAttribute(step, "base"));
    const inherited = Option.fromNullishOr(
      isXs(step, "extension") && base.namespace === schema.targetNamespace
        ? schema.complexTypes.get(base.local)
        : undefined,
    );

    return [
      ...(Option.isSome(inherited) ? yield* declarationsOf(schema, inherited.value) : []),
      ...(yield* declarationsIn(schema, elementsOf(step).filter(holdsParticles))),
    ];
  });

/**
 * What a kind's content admits beside its element children, as the XSD states it.
 *
 * `simple`: character data of a simple type, and no element; `mixed`: character data between its
 * elements; `element`: elements only, which may all be the wildcard's; `empty`: nothing.
 */
export type Content = "empty" | "simple" | "element" | "mixed";

/**
 * Read a kind's content class.
 *
 * @param schema - An ASI schema.
 * @param entry - The kind's entry, read from the same schema.
 * @returns Its class, by the rule of the module comment.
 */
export const contentOf = (
  schema: XsdSchema,
  entry: Entry,
): Result.Result<Content, XsdReadingError> =>
  Result.map(declaredOf(schema, entry.type), (declared) => {
    if (
      declared._tag === "Simple" ||
      Option.isSome(firstXs(declared.definition, "simpleContent"))
    ) {
      return "simple";
    }

    if (entry.mixed) {
      return "mixed";
    }

    return entry.references.length > 0 || entry.wildcard ? "element" : "empty";
  });

/**
 * One element reference a host resolves to a handle other than the element's own name.
 */
export interface TypedChild {
  readonly element: string;
  readonly handle: string;
  readonly host: string;
}

/**
 * The kinds whose handle names an element and one of its types: `derive.ts`'s ASI kinds and the
 * remainder's, as handle and spec.
 */
const typedKinds = [...Object.entries(vocabularies.asi.typed), ...Object.entries(remainder.typed)];

/**
 * Whether a schema declares an element with several named types.
 *
 * @param schema - The schema.
 * @param element - The element name.
 * @returns Whether its declarations name two or more types.
 */
const hasSeveralTypes = (schema: XsdSchema, element: string): boolean =>
  (schema.declarations.get(element) ?? []).length > 1;

/**
 * Read hosts' references to elements of several types, each resolved to the handle of the type the
 * host declares it with.
 *
 * The handles are the remainder's and `derive.ts`'s ASI kinds; a reference that resolves to its
 * element's own name, such as `qti-feedback-block` under `qti-interaction-markup`, is left out.
 *
 * @param schema - An ASI schema.
 * @param entries - The hosts' entries, read from the same schema.
 * @returns The resolutions, in host and then reference order; an {@link XsdReadingError} when a
 *   host references such an element without declaring its type, or with a type no kind has.
 */
export const typedChildrenOf = (
  schema: XsdSchema,
  entries: readonly Entry[],
): Result.Result<readonly TypedChild[], XsdReadingError> =>
  Result.gen(function* typedChildrenOfBody() {
    const found: TypedChild[] = [];

    for (const entry of entries) {
      const declared = yield* declaredOf(schema, entry.type);
      const declarations =
        declared._tag === "Complex" ? yield* declarationsOf(schema, declared.definition) : [];

      for (const end of declarations) {
        if (hasSeveralTypes(schema, end.name)) {
          const type = yield* Option.match(end.type, {
            onNone: () =>
              refuse(`${entry.handle} references ${end.name}, which has several types, by ref`),
            onSome: (value) => Result.succeed(value),
          });
          const handle = yield* Option.match(
            Arr.findFirst(
              typedKinds,
              ([, spec]) => spec.element === end.name && spec.type === type,
            ),
            {
              onNone: () =>
                refuse(`no kind is ${end.name} of type ${type}, which ${entry.handle} declares`),
              onSome: ([name]) => Result.succeed(name),
            },
          );

          if (handle !== end.name) {
            found.push({ element: end.name, handle, host: entry.handle });
          }
        }
      }
    }

    return Arr.dedupeWith(
      found,
      (left, right) => left.host === right.host && left.element === right.element,
    );
  });

/**
 * What one version of the ASI XSD says about the rows the remainder owns.
 *
 * `attributes` holds each remainder kind's attribute rows in entry order, each name once.
 * `children` holds each host's references the remainder admits, a typed reference as the handle
 * its host resolves it to and any other as the XSD spells it: all of a remainder host's, and an
 * existing host's that resolve to a remainder kind.
 */
export interface Reading {
  readonly attributes: ReadonlyMap<string, readonly AttributeRow[]>;
  readonly children: ReadonlyMap<string, readonly string[]>;
}

/**
 * Read what one version's XSD says about the rows the remainder owns.
 *
 * @param schema - An ASI schema.
 * @returns Its reading, the existing hosts first, in `derive.ts`'s leaf order.
 */
export const readingOf = (schema: XsdSchema): Result.Result<Reading, XsdReadingError> =>
  Result.gen(function* readingOfBody() {
    const entries = yield* remainderEntriesOf(schema);
    const existing: Entry[] = [];

    for (const leaf of leaves) {
      existing.push(...(yield* entriesOf(schema, leaf)));
    }

    const typed = new Map(
      (yield* typedChildrenOf(schema, [...existing, ...entries])).map(
        ({ element, handle, host }) => [`${host}|${element}`, handle] as const,
      ),
    );
    const handles: ReadonlySet<string> = new Set(entries.map((entry) => entry.handle));
    const resolved = (entry: Entry): readonly string[] =>
      Arr.dedupe(
        entry.references.map((ref) => typed.get(`${entry.handle}|${ref.name}`) ?? ref.name),
      );

    return {
      attributes: new Map(
        entries.map((entry) => [
          entry.handle,
          Arr.dedupeWith(entry.attributes, (left, right) => left.name === right.name),
        ]),
      ),
      children: new Map([
        ...existing.flatMap((entry) => {
          const owned = resolved(entry).filter((name) => handles.has(name));

          return owned.length === 0 ? [] : [[entry.handle, owned] as const];
        }),
        ...entries.map((entry) => [entry.handle, resolved(entry)] as const),
      ]),
    };
  });

/**
 * The names one map holds that another lacks, by key.
 *
 * @param later - The map whose names are kept.
 * @param earlier - The map they are missing from.
 * @returns Each key with the names `later` holds under it and `earlier` does not, in `later`'s
 *   order, keys with none left out.
 */
const beyond = (
  later: ReadonlyMap<string, readonly string[]>,
  earlier: ReadonlyMap<string, readonly string[]>,
): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...later].flatMap(([key, names]) => {
      const held = new Set(earlier.get(key));
      const added = names.filter((name) => !held.has(name));

      return added.length === 0 ? [] : [[key, added] as const];
    }),
  );

/**
 * The attribute names of a reading, by kind.
 *
 * @param reading - The reading.
 * @returns Each kind's attribute names, in entry order.
 */
const namesOf = (reading: Reading): ReadonlyMap<string, readonly string[]> =>
  new Map(
    [...reading.attributes].map(([kind, rows]) => [kind, rows.map((row) => row.name)] as const),
  );

/**
 * What a later version's reading changes in an earlier one's: names it adds, names it drops, and
 * attributes of one name whose rows differ.
 *
 * `changed` holds, by kind, the earlier version's row of each attribute both versions declare with
 * different rows.
 */
export interface Difference {
  readonly added: {
    readonly attributes: ReadonlyMap<string, readonly string[]>;
    readonly children: ReadonlyMap<string, readonly string[]>;
  };
  readonly changed: ReadonlyMap<string, readonly AttributeRow[]>;
  readonly dropped: {
    readonly attributes: ReadonlyMap<string, readonly string[]>;
    readonly children: ReadonlyMap<string, readonly string[]>;
  };
}

/**
 * Compare two versions' readings.
 *
 * @param earlier - The 3.0.0 reading.
 * @param later - The 3.0.1 reading.
 * @returns What `later` changes in `earlier`.
 */
export const differenceOf = (earlier: Reading, later: Reading): Difference => ({
  added: {
    attributes: beyond(namesOf(later), namesOf(earlier)),
    children: beyond(later.children, earlier.children),
  },
  changed: new Map(
    [...earlier.attributes].flatMap(([kind, rows]) => {
      const now = new Map((later.attributes.get(kind) ?? []).map((row) => [row.name, row]));
      const differing = rows.filter((row) =>
        Option.exists(Option.fromNullishOr(now.get(row.name)), (next) => !Equal.equals(next, row)),
      );

      return differing.length === 0 ? [] : [[kind, differing] as const];
    }),
  ),
  dropped: {
    attributes: beyond(namesOf(earlier), namesOf(later)),
    children: beyond(earlier.children, later.children),
  },
});

/**
 * What the remainder leaf says about itself.
 */
export const remainderLeafSpec: LeafSpec = {
  command: "node src/vocab/derive/asi-remainder.ts",
  exportName: "asiRemainderInventory",
  label: "ASI remainder",
  largerGroups:
    "the SSML elements and the flow content sets, which carry `0..n` or `1..n`, and the 64 expressions under `qti-branch-rule`, `qti-pre-condition` and `qti-template-default`, which carry `1..1`",
  notes: [
    [
      "The remainder is the 51 ASI elements the eleven composed vocabularies hold no kind for: the test structure (20), the companion materials (17), the portable custom interaction (6), the catalog (4), the stimulus (3) and `qti-custom-interaction`. Their 61 kinds add the dotted kinds of the elements with several types, and the test vocabulary's kinds of `qti-rubric-block` and `qti-content-body`.",
    ],
    [
      "The entries are read from the 3.0.1 XSD. An entry cannot say whether a kind with neither element children nor mixed content holds character data, a wildcard or nothing, nor what 3.0.0 lacks; `src/vocab/asi-remainder.ts` states both, and `src/vocab/derive/asi-remainder.test.ts` checks them against the XSDs.",
    ],
  ],
  sources: ["imsqti_asiv3p0p1_v1p0.xsd"],
  test: "src/vocab/derive/asi-remainder.test.ts",
};

/**
 * Derive the remainder leaf's text from the 3.0.1 XSD.
 *
 * @returns The module text, without a final line break, which `vp fmt` turns into the committed
 *   leaf.
 */
export const deriveRemainder = Effect.fn("vocab.deriveRemainder")(function* deriveRemainder() {
  const schema = yield* loadSchema("imsqti_asiv3p0p1_v1p0.xsd");

  return renderLeaf(remainderLeafSpec, yield* Effect.fromResult(remainderEntriesOf(schema)));
});

/**
 * The command line: it prints the remainder leaf to standard output.
 */
const command = Command.make(
  "asi-remainder",
  {},
  Effect.fn("vocab.deriveRemainderCommand")(function* deriveRemainderCommand() {
    yield* Console.log(yield* deriveRemainder());
  }),
).pipe(
  Command.withDescription(
    "Print the ASI remainder's inventory leaf, read from the pinned ASI 3.0.1 XSD in ~/.cache/gr8des/qti3/xsd.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
    ),
  );
}
