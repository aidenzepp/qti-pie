/**
 * Structural validation: whether a document's elements, attributes and text are those the QTI XSD
 * admits, as the generated {@link Tables} record them.
 *
 * {@link checkStructure} walks the document once from its root, into every QTI-namespace element
 * the tables admit, and returns every refusal it finds in document order, never stopping at the
 * first, so the verdict can collect them beside the prose rules'. Apart from the readings below, it
 * never refuses what the XSD admits (reading 1): namespace declarations, `xsi:schemaLocation` and
 * `xsi:noNamespaceSchemaLocation`, whitespace between elements, entity references and whatever a
 * wildcard matches all pass. Given the tables of other namespaces, such as a content package
 * manifest's, it walks their elements too, each by its own namespace's tables and by the same
 * rules, reading `##other` against that namespace; the readings stay QTI's. An element in a
 * namespace it holds no tables for that its parent's table names, such as MathML, is kept and not
 * walked, and so is what a `strict` or `skip` element wildcard admits. What a `lax` element
 * wildcard admits is walked as XML Schema assesses it (rule `5b8ee08b`): a global QTI element is
 * checked by its table, a nested QTI root, or a global element of another namespace's tables, is
 * kept as foreign content (reading 6), foreign content whose `xsi:type` names a complex type the
 * tables define is kept unchecked (reading 50), foreign content whose `xsi:type` names a simple
 * type, built in or in the tables, has its attributes and element children refused and its text
 * accepted unchecked (reading 60), and any other element is passed over while its children are
 * admitted laxly in turn. On every element it walks it judges `xsi:type` and `xsi:nil` as XML
 * Schema judges them (reading 47), and no attribute wildcard admits either: a type is valid when it
 * names the element's declared type or a type derived from it, and `xsi:nil` never is, because no
 * table records a nillable element. After a valid `xsi:type` naming a type of the tables, that
 * type's own table governs the element's attributes, text and children in place of its name's
 * (AD-9); {@link governingTables} gives the table that governs each element the walk checks.
 *
 * Over the XSD's rules it applies the shared readings that set the XSD aside where the walk can see
 * them, each a row of {@link readingRows}: attributes narrowed or retyped, `data-*` names,
 * placements, child counts and the range of the count attributes. The XSD's own order and counts of
 * children are not checked.
 *
 * @module
 */
import { Option, Result } from "effect";
import {
  attributePath,
  qtiNamespace,
  walk,
  xmlNamespace,
  xmlnsNamespace,
  xsdNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import {
  decimalLexical,
  doubleLexical,
  integerLexical,
  isNcName,
  parseLexical,
} from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { patternEquivalents } from "#plate/validate/xsd.ts";
import { greatestCount, leastCount } from "#plate/vocabulary.ts";
import type {
  AttributeType,
  BuiltinName,
  ChildName,
  ContentTable,
  ElementTable,
  Tables,
  TypeEntry,
  Wildcard,
} from "#plate/validate/xsd.ts";

/**
 * An attribute name QTI 3.0's schema spells differently from a name authors write: the element it
 * belongs to, the name as written, the name to write instead, and the reading that settles it.
 */
interface Misspelling {
  readonly element: string;
  readonly reading: string;
  readonly schema: string;
  readonly written: string;
}

/**
 * The table of misspellings (spec §4.6), which gives an `unknown-attribute` refusal its
 * suggestion.
 *
 * A name with no row is refused with no suggestion, and its wording says to remove the attribute.
 */
const misspellings: readonly Misspelling[] = [
  // Reading 11 (spec-readings.md:86): a PCI's fallback module configuration is the schema's
  // `secondary-configuration`; the name `fallback-configuration` appears in QTI 3.0's prose only.
  {
    element: "qti-interaction-modules",
    reading: "11",
    schema: "secondary-configuration",
    written: "fallback-configuration",
  },
];

/**
 * Where one of reading 7's typed-value attributes takes its base type: the `base-type` of the
 * enclosing response or outcome declaration, or `float` for one that is always an XSD double.
 */
type BaseTypeSource = "float" | "qti-outcome-declaration" | "qti-response-declaration";

/**
 * The typed-value attributes reading 7 lists that an item can carry, each on its own element,
 * with where each takes its base type (spec-readings.md:36-55).
 *
 * Outer XML whitespace in one of these is `padded-attribute`, except in a value of base type
 * `string`, whose whitespace is part of the value. Every other attribute is read as its XSD type
 * reads it, collapsed unless it is a string, and never refused for padding: `normal-maximum`, a
 * slider's `lower-bound` and a `title` among them. Reading 7's usage-data attributes, on
 * `ud:mapping` and `ud:mapEntry`, never sit in an item.
 */
const typedValueAttributes: ReadonlyMap<string, ReadonlyMap<string, BaseTypeSource>> = new Map<
  string,
  ReadonlyMap<string, BaseTypeSource>
>([
  ["qti-area-map-entry", new Map([["mapped-value", "float"]])],
  [
    "qti-area-mapping",
    new Map([
      ["default-value", "float"],
      ["lower-bound", "float"],
      ["upper-bound", "float"],
    ]),
  ],
  ["qti-interpolation-table", new Map([["default-value", "qti-outcome-declaration"]])],
  [
    "qti-interpolation-table-entry",
    new Map([
      ["source-value", "float"],
      ["target-value", "qti-outcome-declaration"],
    ]),
  ],
  [
    "qti-map-entry",
    new Map([
      ["map-key", "qti-response-declaration"],
      ["mapped-value", "float"],
    ]),
  ],
  [
    "qti-mapping",
    new Map([
      ["default-value", "float"],
      ["lower-bound", "float"],
      ["upper-bound", "float"],
    ]),
  ],
  ["qti-match-table", new Map([["default-value", "qti-outcome-declaration"]])],
  ["qti-match-table-entry", new Map([["target-value", "qti-outcome-declaration"]])],
]);

/**
 * A run of XML whitespace: space, tab, carriage return or line feed, and no other character.
 */
const xmlSpaceRun = /[\t\n\r ]+/gu;

/**
 * XML whitespace at the start or the end of a value.
 */
const outerXmlSpace = /^[\t\n\r ]|[\t\n\r ]$/u;

/**
 * A character other than XML whitespace.
 */
const nonXmlSpace = /[^\t\n\r ]/u;

/**
 * Collapse a value's XML whitespace, as XSD's `whiteSpace="collapse"` does: each run becomes one
 * space, and a space at either end is removed.
 *
 * @param value The value as written.
 * @returns The collapsed value.
 */
const collapse = (value: string): string => {
  const single = value.replaceAll(xmlSpaceRun, " ");
  const start = single.startsWith(" ") ? 1 : 0;
  const end = single.endsWith(" ") && single.length > start ? single.length - 1 : single.length;

  return single.slice(start, end);
};

/**
 * Apply a built-in's whitespace facet to a value: `string` keeps it, `normalizedString` replaces
 * each tab and line break with a space, and every other built-in collapses it.
 *
 * @param name The built-in the value is read as.
 * @param value The value as written.
 * @returns The value the built-in's lexical check reads.
 */
const whitespaced = (name: BuiltinName, value: string): string => {
  if (name === "string") {
    return value;
  }

  return name === "normalizedString" ? value.replaceAll(/[\t\n\r]/gu, " ") : collapse(value);
};

/**
 * The least value of `xs:int`, -2^31.
 */
const leastInt = -2_147_483_648n;

/**
 * The greatest value of `xs:int`, 2^31 - 1.
 */
const greatestInt = 2_147_483_647n;

/**
 * The lexical check of each built-in: whether a value, after its whitespace facet, is in the
 * built-in's lexical space.
 *
 * An integer kind's range is compared exactly as a `bigint`, never through a `Number`. `anyURI`,
 * `anyType` and the two string types admit any text.
 */
const lexicalChecks = {
  NCName: isNcName,
  anyType: () => true,
  anyURI: () => true,
  boolean: (value: string) =>
    value === "true" || value === "false" || value === "1" || value === "0",
  decimal: (value: string) => decimalLexical.test(value),
  double: (value: string) => doubleLexical.test(value),
  int: (value: string) =>
    integerLexical.test(value) && BigInt(value) >= leastInt && BigInt(value) <= greatestInt,
  integer: (value: string) => integerLexical.test(value),
  nonNegativeInteger: (value: string) => integerLexical.test(value) && BigInt(value) >= 0n,
  normalizedString: () => true,
  string: () => true,
} satisfies Record<BuiltinName, (value: string) => boolean>;

/**
 * The number an `xs:double` lexical form names, read by the value model's {@link parseLexical}, so
 * the walk and the value model cannot read one form two ways.
 *
 * A form beyond the largest finite double names the largest finite double of its sign, the closest
 * value of the value space (XML Schema Part 2 §3.2.5); only `INF` and `-INF` name the infinities.
 *
 * @param lexical The lexical form.
 * @returns The number it names, or none when the text is outside the lexical space.
 */
const doubleValue = (lexical: string): Option.Option<number> =>
  Option.flatMap(Result.getSuccess(parseLexical("float", lexical)), (single) =>
    single.baseType === "float" ? Option.some(single.value) : Option.none(),
  );

/**
 * Count the digits after a decimal lexical form's point.
 *
 * @param lexical A value {@link decimalLexical} admits.
 * @returns The number of fraction digits, 0 when it has no point.
 */
const fractionDigits = (lexical: string): number => lexical.split(".")[1]?.length ?? 0;

/**
 * Read a decimal lexical form as an exact integer scaled by a power of ten.
 *
 * @param lexical A value {@link decimalLexical} admits.
 * @param places The number of fraction digits to scale by, at least the value's own.
 * @returns The value times 10^`places`.
 */
const scaledDecimal = (lexical: string, places: number): bigint => {
  const [whole = "", fraction = ""] = lexical.replace(/^[+-]/u, "").split(".");
  const magnitude = BigInt(`0${whole}${fraction.padEnd(places, "0")}`);

  return lexical.startsWith("-") ? -magnitude : magnitude;
};

/**
 * Report whether a value meets a `minInclusive` bound.
 *
 * A decimal or an integer kind compares exactly, digit for digit; a double compares the numbers
 * {@link doubleValue} reads, so `NaN` meets no bound. A bound outside the built-in's lexical space,
 * or a bound on a built-in that is not a number, is met by nothing.
 *
 * @param name The built-in the value is read as.
 * @param value The value, already in the built-in's lexical space.
 * @param bound The bound's lexical form.
 * @returns Whether the value is at least the bound.
 */
const meetsBound = (name: BuiltinName, value: string, bound: string): boolean => {
  if (name === "double") {
    const read = doubleValue(value);
    const least = doubleValue(bound);

    return Option.isSome(read) && Option.isSome(least) && read.value >= least.value;
  }

  if (name === "decimal" || name === "int" || name === "integer" || name === "nonNegativeInteger") {
    const places = Math.max(fractionDigits(value), fractionDigits(bound));

    return (
      decimalLexical.test(bound) && scaledDecimal(value, places) >= scaledDecimal(bound, places)
    );
  }

  return false;
};

/**
 * A reading that narrows an attribute: on the named elements, or on every element whose table
 * declares it, a value the XSD's own type admits must also satisfy `holds`, which reads the value
 * collapsed, or it is `attribute-type` with `expected` as the values the reading admits.
 */
interface NarrowedAttribute {
  readonly attribute: string;
  readonly elements: "declaring" | readonly string[];
  readonly expected: string;
  readonly holds: (lexical: string) => boolean;
  readonly kind: "narrowed-attribute";
  readonly reading: string;
}

/**
 * A reading that retypes an attribute on one element: the XSD's type no longer applies, so its
 * `attribute-type` check is skipped here, and a prose rule reads the value instead.
 */
interface RetypedAttribute {
  readonly attribute: string;
  readonly element: string;
  readonly kind: "retyped-attribute";
  readonly reading: string;
}

/**
 * A reading that refuses attribute names a wildcard would admit: a name in no namespace that starts
 * with `prefix` and does not match `pattern` is `unknown-attribute`.
 */
interface AttributeName {
  readonly kind: "attribute-name";
  readonly pattern: RegExp;
  readonly prefix: string;
  readonly reading: string;
}

/**
 * A reading that places elements the XSD admits more widely: in a document whose root `roots`
 * accepts, each of `elements` must have `container` as its parent, or as an ancestor, or it is
 * `misplaced-element`. `requires` says where it must sit, for the wording.
 */
interface Placement {
  readonly container: string;
  readonly elements: readonly string[];
  readonly kind: "placement";
  readonly reading: string;
  readonly requires: string;
  readonly roots: (root: SourceElement) => boolean;
  readonly within: "ancestor" | "parent";
}

/**
 * A child count the XSD does not hold: when `applies` accepts the parent of one of `elements`, the
 * number of its child elements that `counted` names (`any` for every child element, else QTI local
 * names) must not be one `refuses` rejects, or it is `child-count`. `child` and `required` name the
 * children and the count for the wording, and `source` is the reading or the specification line
 * that sets it.
 */
interface ChildCount {
  readonly applies: (parent: Option.Option<SourceElement>) => boolean;
  readonly child: string;
  readonly counted: "any" | readonly string[];
  readonly elements: readonly string[];
  readonly kind: "child-count";
  readonly refuses: (count: number) => boolean;
  readonly required: "at least one" | "exactly one";
  readonly source: string;
}

/**
 * A range the XSD leaves unbounded: each of `attributes`, in no namespace, on an element whose
 * table declares it, whose value the XSD's own type admits and that is an integer after collapse,
 * must lie from `least` to `greatest`, compared exactly, or it is `count-range`. A value that is
 * not an integer, such as `figures`' variable form, is not compared.
 */
interface CountRange {
  readonly attributes: readonly string[];
  readonly greatest: bigint;
  readonly kind: "count-range";
  readonly least: bigint;
  readonly reading: string;
}

/**
 * One reading applied over the XSD's rules.
 */
type ReadingRow =
  | AttributeName
  | ChildCount
  | CountRange
  | NarrowedAttribute
  | Placement
  | RetypedAttribute;

/**
 * Accept every parent, for a child count that holds wherever its element sits, and every root, for
 * a placement that holds in every document.
 *
 * @returns Always true.
 */
const anywhere = (): boolean => true;

/**
 * Report whether a document's root is neither a QTI test nor a QTI section, whose misplaced
 * outcome-only expressions the test prose rules refuse as `expression-placement` (reading 23), so
 * that the structural walk does not refuse them a second time.
 *
 * @param root The document's root.
 * @returns Whether the root is anything but a `qti-assessment-test` or a `qti-assessment-section`.
 */
const outsideTests = (root: SourceElement): boolean =>
  root.namespace !== qtiNamespace ||
  (root.local !== "qti-assessment-test" && root.local !== "qti-assessment-section");

/**
 * The declarations whose `qti-default-value` and `qti-correct-response` hold their values.
 */
const declarations: ReadonlySet<string> = new Set([
  "qti-outcome-declaration",
  "qti-response-declaration",
  "qti-template-declaration",
]);

/**
 * Report whether a parent is a declaration whose `cardinality` is `single`, compared exactly as
 * written: the XSD types it as an enumeration of `xs:string`, with no whitespace facet.
 *
 * @param parent The parent of a value container.
 * @returns Whether its values are one value.
 */
const isSingleDeclaration = (parent: Option.Option<SourceElement>): boolean =>
  Option.exists(
    parent,
    (declaration) =>
      declaration.namespace === qtiNamespace &&
      declarations.has(declaration.local) &&
      declaration.attributes.some(
        (attribute) =>
          attribute.namespace === "" &&
          attribute.local === "cardinality" &&
          attribute.value === "single",
      ),
  );

/**
 * The shared readings this module applies over the XSD's rules, one row each (spec §4.13).
 *
 * Every refusal a row gives carries the row's reading in its detail, as `reading`, which the
 * verdict's wording cites; a `child-count` refusal carries `source`, a reading or a specification
 * line, instead.
 */
const readingRows: readonly ReadingRow[] = [
  // Reading 8 (spec-readings.md:65): a match table entry's `target-value` is a value of the
  // enclosing outcome's base type, not one of the base-type names the XSD enumerates. The prose
  // rules' `value-type` reads it; its padding stays reading 7's.
  {
    attribute: "target-value",
    element: "qti-match-table-entry",
    kind: "retyped-attribute",
    reading: "8",
  },
  // Reading 13 (spec-readings.md:96): a `data-*` name is `data-[a-z0-9_.-]+`, in no namespace,
  // even where an attribute wildcard would admit any name.
  { kind: "attribute-name", pattern: /^data-[a-z0-9_.-]+$/u, prefix: "data-", reading: "13" },
  // Reading 16 (spec-readings.md:116): `normal-maximum` is greater than 0, where the XSD's
  // `NonNegativeDoubleDType` admits 0. It compares the number, so `0`, `0.0`, `-0` and `0e0` all fail.
  {
    attribute: "normal-maximum",
    elements: ["qti-outcome-declaration"],
    expected: "a double greater than 0",
    holds: (lexical) => Option.exists(doubleValue(lexical), (read) => read > 0),
    kind: "narrowed-attribute",
    reading: "16",
  },
  // Reading 17 (spec-readings.md:120): a `view` list holds at least one view, where the XSD's list
  // admits none.
  {
    attribute: "view",
    elements: "declaring",
    expected: "a list of at least one view",
    holds: (lexical) => lexical !== "",
    kind: "narrowed-attribute",
    reading: "17",
  },
  // Reading 18 (spec-readings.md:123): an order or graphic-order interaction's `min-choices` is at
  // least 1, where the XSD admits 0. `max-choices="0"` means unlimited, and no count is compared.
  {
    attribute: "min-choices",
    elements: ["qti-graphic-order-interaction", "qti-order-interaction"],
    expected: "an integer at least 1",
    holds: (lexical) => integerLexical.test(lexical) && BigInt(lexical) >= 1n,
    kind: "narrowed-attribute",
    reading: "18",
  },
  // Reading 20 (spec-readings.md:132): a PCI holds exactly one `qti-interaction-markup`, which may
  // be empty.
  {
    applies: anywhere,
    child: "qti-interaction-markup",
    counted: ["qti-interaction-markup"],
    elements: ["qti-portable-custom-interaction"],
    kind: "child-count",
    refuses: (count) => count !== 1,
    required: "exactly one",
    source: "reading 20",
  },
  // Reading 21 (spec-readings.md:137): a `qti-repeat` holds at least one operand, any child
  // element.
  {
    applies: anywhere,
    child: "operand",
    counted: "any",
    elements: ["qti-repeat"],
    kind: "child-count",
    refuses: (count) => count === 0,
    required: "at least one",
    source: "reading 21",
  },
  // Reading 22 (spec-readings.md:141): a `qti-template-constraint` is a direct child of
  // `qti-template-processing`, where the XSD also admits it in the template conditions' branches.
  {
    container: "qti-template-processing",
    elements: ["qti-template-constraint"],
    kind: "placement",
    reading: "22",
    requires: "a direct child of qti-template-processing",
    roots: anywhere,
    within: "parent",
  },
  // Reading 23 (spec-readings.md:145): the eight outcome-only expressions sit inside outcome
  // processing, so in an item, which holds none, every one is misplaced. In a test or a section the
  // test prose rules refuse a misplaced one as `expression-placement`, once.
  {
    container: "qti-outcome-processing",
    elements: [
      "qti-number-correct",
      "qti-number-incorrect",
      "qti-number-presented",
      "qti-number-responded",
      "qti-number-selected",
      "qti-outcome-maximum",
      "qti-outcome-minimum",
      "qti-test-variables",
    ],
    kind: "placement",
    reading: "23",
    requires: "inside qti-outcome-processing",
    roots: outsideTests,
    within: "ancestor",
  },
  // Reading 31 (spec-readings.md:187; `CardDType`, XSD:26089-26104): a card holds at least one of
  // an HTML content node, file hrefs or card entries.
  {
    applies: anywhere,
    child: "qti-html-content or qti-file-href or qti-card-entry",
    counted: ["qti-card-entry", "qti-file-href", "qti-html-content"],
    elements: ["qti-card"],
    kind: "child-count",
    refuses: (count) => count === 0,
    required: "at least one",
    source: "reading 31",
  },
  // Reading 31 again: each card entry holds at least one of an HTML content node or file hrefs.
  {
    applies: anywhere,
    child: "qti-html-content or qti-file-href",
    counted: ["qti-file-href", "qti-html-content"],
    elements: ["qti-card-entry"],
    kind: "child-count",
    refuses: (count) => count === 0,
    required: "at least one",
    source: "reading 31",
  },
  // Reading 38 (spec-readings.md:222): a `qti-gap` sits inside a gap-match interaction, which also
  // refuses one in a graphic gap-match interaction's gap text. Where the reading is silent
  // (hottext, a gap text holding gaps), nothing is refused.
  {
    container: "qti-gap-match-interaction",
    elements: ["qti-gap"],
    kind: "placement",
    reading: "38",
    requires: "inside a qti-gap-match-interaction",
    roots: anywhere,
    within: "ancestor",
  },
  // Reading 46 (spec-readings.md:267): a count attribute holds a signed 64-bit integer, read
  // exactly: the eight interaction counts, `xs:nonNegativeInteger` in the XSD, and `figures` on
  // `qti-round-to` and `qti-equal-rounded`, an `xs:integer` or a template variable's name.
  {
    attributes: [
      "figures",
      "match-max",
      "match-min",
      "max-associations",
      "max-choices",
      "max-plays",
      "min-associations",
      "min-choices",
      "min-plays",
    ],
    greatest: greatestCount,
    kind: "count-range",
    least: leastCount,
    reading: "46",
  },
  // Single cardinality is "a single value" (info.txt:73049, the information model's
  // `CardinalityEnum`), so the default or correct value of a single declaration holds one
  // `qti-value`, where the XSD admits one or more. Only more than one is refused here: none is the
  // XSD's own minimum, which the walk leaves unchecked as it leaves every XSD count.
  {
    applies: isSingleDeclaration,
    child: "qti-value",
    counted: ["qti-value"],
    elements: ["qti-correct-response", "qti-default-value"],
    kind: "child-count",
    refuses: (count) => count > 1,
    required: "exactly one",
    source: "info.txt:73049",
  },
];

/**
 * Keep the rows of {@link readingRows} of one kind.
 *
 * @param kind The rows' kind.
 * @returns Those rows, in the table's order.
 */
const rowsOf = <K extends ReadingRow["kind"]>(
  kind: K,
): readonly Extract<ReadingRow, { kind: K }>[] =>
  readingRows.filter((row): row is Extract<ReadingRow, { kind: K }> => row.kind === kind);

/**
 * The rows that narrow an attribute.
 */
const narrowedAttributes = rowsOf("narrowed-attribute");

/**
 * The rows that retype an attribute.
 */
const retypedAttributes = rowsOf("retyped-attribute");

/**
 * The rows that refuse attribute names.
 */
const attributeNames = rowsOf("attribute-name");

/**
 * The rows that place elements.
 */
const placements = rowsOf("placement");

/**
 * The rows that count children.
 */
const childCounts = rowsOf("child-count");

/**
 * The rows that bound counts.
 */
const countRanges = rowsOf("count-range");

/**
 * Report whether an attribute's type admits a value.
 *
 * A built-in, an enumeration and a pattern apply their built-in's whitespace first. A list
 * collapses the value and checks each item, an empty list included. A union admits what any member
 * admits, each member applying its own whitespace. A pattern is checked through its JavaScript
 * equivalent in {@link patternEquivalents}, and a pattern with none admits nothing.
 *
 * @param type The attribute's type.
 * @param value The value as written.
 * @returns Whether the value is in the type.
 */
const admits = (type: AttributeType, value: string): boolean => {
  switch (type.kind) {
    case "builtin": {
      const lexical = whitespaced(type.name, value);

      return (
        lexicalChecks[type.name](lexical) &&
        (type.minInclusive === undefined || meetsBound(type.name, lexical, type.minInclusive))
      );
    }
    case "enumeration": {
      return type.values.includes(whitespaced(type.base, value));
    }
    case "list": {
      const items = collapse(value);

      return items === "" || items.split(" ").every((item) => admits(type.item, item));
    }
    case "pattern": {
      const lexical = whitespaced(type.base, value);
      const equivalent = patternEquivalents.get(type.pattern);

      return equivalent !== undefined && lexicalChecks[type.base](lexical) && equivalent(lexical);
    }
    case "union": {
      return type.members.some((member) => admits(member, value));
    }
    default: {
      return type satisfies never;
    }
  }
};

/**
 * Describe the values an attribute's type admits, for the wording of an `attribute-type`
 * refusal.
 *
 * @param type The attribute's type.
 * @returns A phrase such as `nonNegativeInteger`, `one of single, multiple` or `a list of NCName`.
 */
const describeType = (type: AttributeType): string => {
  switch (type.kind) {
    case "builtin": {
      return type.minInclusive === undefined
        ? type.name
        : `${type.name} at least ${type.minInclusive}`;
    }
    case "enumeration": {
      return `one of ${type.values.join(", ")}`;
    }
    case "list": {
      return `a list of ${describeType(type.item)}`;
    }
    case "pattern": {
      return `${type.base} matching ${type.pattern}`;
    }
    case "union": {
      return type.members.map(describeType).join(" or ");
    }
    default: {
      return type satisfies never;
    }
  }
};

/**
 * Report whether a wildcard admits a namespace.
 *
 * `##any` admits every namespace and none. `##other` admits any namespace but the target namespace
 * of the schema that wrote the wildcard, QTI's for QTI's tables, and never none. A list admits its
 * namespaces, `""` standing for none.
 *
 * @param wildcard The element's `xs:any` or `xs:anyAttribute`.
 * @param namespace The namespace of the element or attribute, `""` for none.
 * @param target The namespace of the tables the wildcard is in.
 * @returns Whether the wildcard matches it.
 */
const wildcardAdmits = (wildcard: Wildcard, namespace: string, target: string): boolean => {
  if (wildcard.namespace === "##any") {
    return true;
  }

  if (wildcard.namespace === "##other") {
    return namespace !== "" && namespace !== target;
  }

  return wildcard.namespace.includes(namespace);
};

/**
 * Name an element as a refusal's detail does: its local name in the QTI namespace and
 * `{<namespace>}<local>` otherwise, as its path step spells it.
 *
 * @param element The element.
 * @returns Its name.
 */
const elementName = (element: SourceElement): string =>
  element.namespace === qtiNamespace ? element.local : `{${element.namespace}}${element.local}`;

/**
 * Name an attribute as a refusal's detail does, as its path step spells it without the `@`: its
 * local name in no namespace, `xml:<local>` in the XML namespace and `{<namespace>}<local>`
 * otherwise.
 *
 * @param attribute The attribute's name parts.
 * @returns Its name.
 */
export const attributeName = (attribute: Pick<SourceAttribute, "local" | "namespace">): string => {
  if (attribute.namespace === "") {
    return attribute.local;
  }

  return attribute.namespace === xmlNamespace
    ? `xml:${attribute.local}`
    : `{${attribute.namespace}}${attribute.local}`;
};

/**
 * Report whether an attribute is one the XSD admits on every element without declaring it: a
 * namespace declaration, which the shared reader returns as an attribute, `xsi:schemaLocation` or
 * `xsi:noNamespaceSchemaLocation`.
 *
 * `xsi:type` and `xsi:nil` are not allowances: {@link checkInstance} judges them on every element
 * the walk checks.
 *
 * @param attribute The attribute.
 * @returns Whether it is always allowed.
 */
export const isAllowance = (attribute: SourceAttribute): boolean =>
  attribute.namespace === xmlnsNamespace ||
  (attribute.namespace === xsiNamespace &&
    (attribute.local === "schemaLocation" || attribute.local === "noNamespaceSchemaLocation"));

/**
 * Report whether an attribute is `xsi:type` or `xsi:nil`, which {@link checkInstance} judges and
 * the attribute loop passes over.
 *
 * @param attribute The attribute.
 * @returns Whether it is one of the two.
 */
export const isInstanceAttribute = (attribute: SourceAttribute): boolean =>
  attribute.namespace === xsiNamespace && (attribute.local === "type" || attribute.local === "nil");

/**
 * Look up an element's table, only among the tables' own keys.
 *
 * @param tables The tables.
 * @param local The element's local name in the tables' namespace.
 * @returns Its table, or none when the tables declare no element of that name.
 */
export const tableOf = (tables: Tables, local: string): Option.Option<ElementTable> =>
  Object.hasOwn(tables.elements, local)
    ? Option.fromUndefinedOr(tables.elements[local])
    : Option.none();

/**
 * The tables the walk checks by, keyed by namespace URI: QTI's tables under QTI's namespace, and
 * each other namespace's tables under its own.
 */
type Schemas = ReadonlyMap<string, Tables>;

/**
 * Gather the tables the walk checks by.
 *
 * @param tables QTI's tables.
 * @param others The tables of other namespaces, keyed by namespace URI. An entry for QTI's
 *   namespace is set aside: `tables` are QTI's.
 * @returns The tables by namespace.
 */
const schemasOf = (tables: Tables, others: ReadonlyMap<string, Tables> = new Map()): Schemas =>
  new Map<string, Tables>([...others, [qtiNamespace, tables]]);

/**
 * Look up an element's table among the tables of its namespace.
 *
 * @param schemas The tables by namespace.
 * @param element The element.
 * @returns Its table, or none when the walk holds no tables for its namespace or they declare no
 *   element of its local name.
 */
const elementTableOf = (schemas: Schemas, element: SourceElement): Option.Option<ElementTable> =>
  Option.flatMap(Option.fromUndefinedOr(schemas.get(element.namespace)), (owner) =>
    tableOf(owner, element.local),
  );

/**
 * Look up a named type's entry among the tables of its namespace, only among their own keys.
 *
 * @param schemas The tables by namespace.
 * @param type The type's name.
 * @returns Its entry, or none when the walk holds no tables for its namespace or they define no
 *   type of its local name.
 */
const typeEntryOf = (schemas: Schemas, type: ChildName): Option.Option<TypeEntry> => {
  const owner = schemas.get(type.namespace);

  return owner !== undefined && Object.hasOwn(owner.types, type.local)
    ? Option.fromUndefinedOr(owner.types[type.local])
    : Option.none();
};

/**
 * The table that governs an element the walk checks, with the namespace of the tables it comes
 * from, against which its `##other` wildcards are read.
 */
interface Governed {
  readonly namespace: string;
  readonly table: ContentTable;
}

/**
 * The base of each XML Schema built-in type, by local name, so that a derivation is followed
 * through the built-ins as it is through QTI's types.
 *
 * Each derived built-in restricts the base XML Schema Part 2 names for it (section 3.3). The
 * primitives and the three list types have `anySimpleType` as their base (Part 2, section 4.1.1),
 * and its base is `anyType` (Part 1, section 3.14.7), which has none.
 */
const builtinBases: ReadonlyMap<string, string> = new Map([
  ["anySimpleType", "anyType"],
  ["anyURI", "anySimpleType"],
  ["base64Binary", "anySimpleType"],
  ["boolean", "anySimpleType"],
  ["byte", "short"],
  ["date", "anySimpleType"],
  ["dateTime", "anySimpleType"],
  ["decimal", "anySimpleType"],
  ["double", "anySimpleType"],
  ["duration", "anySimpleType"],
  ["ENTITIES", "anySimpleType"],
  ["ENTITY", "NCName"],
  ["float", "anySimpleType"],
  ["gDay", "anySimpleType"],
  ["gMonth", "anySimpleType"],
  ["gMonthDay", "anySimpleType"],
  ["gYear", "anySimpleType"],
  ["gYearMonth", "anySimpleType"],
  ["hexBinary", "anySimpleType"],
  ["ID", "NCName"],
  ["IDREF", "NCName"],
  ["IDREFS", "anySimpleType"],
  ["int", "long"],
  ["integer", "decimal"],
  ["language", "token"],
  ["long", "integer"],
  ["Name", "token"],
  ["NCName", "Name"],
  ["negativeInteger", "nonPositiveInteger"],
  ["NMTOKEN", "token"],
  ["NMTOKENS", "anySimpleType"],
  ["nonNegativeInteger", "integer"],
  ["nonPositiveInteger", "integer"],
  ["normalizedString", "string"],
  ["NOTATION", "anySimpleType"],
  ["positiveInteger", "nonNegativeInteger"],
  ["QName", "anySimpleType"],
  ["short", "int"],
  ["string", "anySimpleType"],
  ["time", "anySimpleType"],
  ["token", "normalizedString"],
  ["unsignedByte", "unsignedShort"],
  ["unsignedInt", "unsignedLong"],
  ["unsignedLong", "nonNegativeInteger"],
  ["unsignedShort", "unsignedInt"],
]);

/**
 * Find the base of a named type: through the `types` of its namespace's tables for one of QTI's
 * or another namespace the walk holds tables for, `anySimpleType` for a union, and through
 * {@link builtinBases} for one of XML Schema's.
 *
 * @param type The type's name.
 * @param schemas The tables by namespace.
 * @returns Its base, or none for `anyType` and for a name that resolves to no type.
 */
const baseOf = (type: ChildName, schemas: Schemas): Option.Option<ChildName> => {
  if (type.namespace === xsdNamespace) {
    const base = builtinBases.get(type.local);

    return base === undefined
      ? Option.none()
      : Option.some({ local: base, namespace: xsdNamespace });
  }

  return Option.map(typeEntryOf(schemas, type), (entry) =>
    "base" in entry ? entry.base : { local: "anySimpleType", namespace: xsdNamespace },
  );
};

/**
 * Report whether a type is one of the declared types or derived from one of them, through any
 * chain of extensions and restrictions (XML Schema Part 1, section 3.3.4, clause 4.3). The XSD
 * blocks no derivation, so every chain counts.
 *
 * @param type The type's name.
 * @param declared The types the element is declared with.
 * @param schemas The tables by namespace.
 * @returns Whether `type` is validly derived from one of `declared`.
 */
const derivesFrom = (
  type: ChildName,
  declared: readonly ChildName[],
  schemas: Schemas,
): boolean => {
  const seen = new Set<string>();
  for (
    let current = Option.some(type);
    Option.isSome(current);
    current = baseOf(current.value, schemas)
  ) {
    const { local, namespace } = current.value;
    const key = `{${namespace}}${local}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    if (declared.some((name) => name.namespace === namespace && name.local === local)) {
      return true;
    }
  }

  return false;
};

/**
 * Find the namespace a prefix is bound to at an element, from the declarations on it and on its
 * ancestors, the nearest first.
 *
 * `xml` and `xmlns` are bound by definition. The empty prefix stands for the default namespace,
 * which is no namespace, `""`, when no declaration is in scope. The reader gives a default
 * declaration the local name `xmlns` and a prefixed one its prefix.
 *
 * @param prefix The prefix, `""` for none.
 * @param element The element the name is written on.
 * @param parents Each walked element's parent.
 * @returns The namespace, or none when the prefix is bound to nothing.
 */
const boundNamespace = (
  prefix: string,
  element: SourceElement,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): Option.Option<string> => {
  if (prefix === "xml") {
    return Option.some(xmlNamespace);
  }

  if (prefix === "xmlns") {
    return Option.some(xmlnsNamespace);
  }

  const local = prefix === "" ? "xmlns" : prefix;
  for (
    let current: SourceElement | undefined = element;
    current !== undefined;
    current = parents.get(current)
  ) {
    const declaration = current.attributes.find(
      (attribute) => attribute.namespace === xmlnsNamespace && attribute.local === local,
    );
    if (declaration !== undefined) {
      return prefix === "" || declaration.value !== ""
        ? Option.some(declaration.value)
        : Option.none();
    }
  }

  return prefix === "" ? Option.some("") : Option.none();
};

/**
 * Resolve a QName written on an element: collapse its whitespace, as `xs:QName` does, and bind its
 * prefix through the declarations in scope.
 *
 * @param value The QName as written.
 * @param element The element it is written on.
 * @param parents Each walked element's parent.
 * @returns The name it stands for, or none when it is not a QName or its prefix is bound to
 *   nothing.
 */
const resolveQName = (
  value: string,
  element: SourceElement,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): Option.Option<ChildName> => {
  const lexical = collapse(value);
  const colon = lexical.indexOf(":");
  const prefix = colon === -1 ? "" : lexical.slice(0, colon);
  const local = lexical.slice(colon + 1);
  if ((colon !== -1 && !isNcName(prefix)) || !isNcName(local)) {
    return Option.none();
  }

  return Option.map(boundNamespace(prefix, element, parents), (namespace) => ({
    local,
    namespace,
  }));
};

/**
 * Name a type as a refusal's detail does: its local name in the QTI namespace and
 * `{<namespace>}<local>` otherwise, as {@link elementName} names an element.
 *
 * @param type The type's name.
 * @returns Its name.
 */
const typeName = (type: ChildName): string =>
  type.namespace === qtiNamespace ? type.local : `{${type.namespace}}${type.local}`;

/**
 * Describe the values an element's `xsi:type` may take, for the wording of its `attribute-type`
 * refusal.
 *
 * @param table The element's table.
 * @returns A phrase naming the element's declared types.
 */
const describeInstanceTypes = (table: ElementTable): string => {
  const [first, ...others] = table.types.map(typeName);
  if (first === undefined) {
    return "a named type derived from the element's anonymous type, and the XSD has none";
  }

  return others.length === 0
    ? `a QName naming ${first} or a type derived from it`
    : `a QName naming one of ${[first, ...others].join(", ")} or a type derived from one of them`;
};

/**
 * The QTI roots reading 6 keeps as foreign content when lax wildcard content holds one: the item,
 * test, section and stimulus roots and the two processing roots, by local name.
 */
const nestedRoots: ReadonlySet<string> = new Set([
  "qti-assessment-item",
  "qti-assessment-section",
  "qti-assessment-stimulus",
  "qti-assessment-test",
  "qti-outcome-processing",
  "qti-response-processing",
]);

/**
 * Find the nearest QTI-namespace ancestor of an element with a given local name.
 *
 * @param element The element.
 * @param local The ancestor's local name.
 * @param parents Each walked element's parent.
 * @returns The ancestor, or none when no ancestor has that name.
 */
const enclosing = (
  element: SourceElement,
  local: string,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): Option.Option<SourceElement> => {
  for (let current = parents.get(element); current !== undefined; current = parents.get(current)) {
    if (current.namespace === qtiNamespace && current.local === local) {
      return Option.some(current);
    }
  }

  return Option.none();
};

/**
 * Report whether a value is padded where reading 7 refuses padding.
 *
 * The attribute must be one of {@link typedValueAttributes} on its element, its value must start or
 * end with XML whitespace, and its base type must not be `string`. A missing declaration, or one
 * with no `base-type`, is not a string.
 *
 * @param element The attribute's element.
 * @param attribute The attribute.
 * @param parents Each walked element's parent.
 * @returns Whether the attribute is `padded-attribute`.
 */
const isPadded = (
  element: SourceElement,
  attribute: SourceAttribute,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): boolean => {
  const source =
    element.namespace === qtiNamespace && attribute.namespace === ""
      ? typedValueAttributes.get(element.local)?.get(attribute.local)
      : undefined;
  if (source === undefined || !outerXmlSpace.test(attribute.value)) {
    return false;
  }

  if (source === "float") {
    return true;
  }

  const baseType = Option.flatMap(enclosing(element, source, parents), (declaration) =>
    Option.fromUndefinedOr(
      declaration.attributes.find(
        (candidate) => candidate.namespace === "" && candidate.local === "base-type",
      ),
    ),
  );

  return Option.match(baseType, {
    onNone: () => true,
    onSome: (written) => collapse(written.value) !== "string",
  });
};

/**
 * Construct a structural refusal located at an element or attribute path.
 *
 * @param source The document refused.
 * @param rule The rule it breaks.
 * @param path The element or attribute path.
 * @param detail The facts the verdict's wording needs.
 * @param suggestion The name the table of misspellings suggests, if any.
 * @returns The refusal.
 */
const refuse = (
  source: SourceDocument,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
  suggestion: Option.Option<string> = Option.none(),
): Refusal =>
  new Refusal({
    detail,
    document: source.location,
    location: { kind: "path", path },
    readerRule: Option.none(),
    rule,
    suggestion,
  });

/**
 * Find the {@link readingRows} row that refuses an attribute's name, if any. The readings are
 * QTI's, so an element in another namespace has none.
 *
 * @param element The attribute's element.
 * @param attribute The attribute.
 * @returns The row whose prefix the name starts with and whose pattern it does not match.
 */
const misnamed = (
  element: SourceElement,
  attribute: SourceAttribute,
): Option.Option<AttributeName> =>
  Option.fromUndefinedOr(
    attributeNames.find(
      (row) =>
        element.namespace === qtiNamespace &&
        attribute.namespace === "" &&
        attribute.local.startsWith(row.prefix) &&
        !row.pattern.test(attribute.local),
    ),
  );

/**
 * Check one attribute the element's table does not declare.
 *
 * When the element's attribute wildcard matches its namespace it is allowed, unless a reading
 * refuses its name: then it is `unknown-attribute`, suggesting the name in lower case when that
 * name passes. Otherwise it is `unknown-attribute`, with the misspelling table's suggestion when a
 * row matches.
 *
 * @param source The document.
 * @param element The attribute's element.
 * @param path The element's path.
 * @param governed The table that governs the element, with its tables' namespace.
 * @param attribute The undeclared attribute.
 * @returns The refusal, or none when the wildcard admits the attribute and no reading refuses
 *   its name.
 */
const checkUndeclared = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  governed: Governed,
  attribute: SourceAttribute,
): Option.Option<Refusal> => {
  const detail = { attribute: attributeName(attribute), element: elementName(element) };
  const wildcard = governed.table.anyAttribute;
  if (wildcard !== undefined && wildcardAdmits(wildcard, attribute.namespace, governed.namespace)) {
    return Option.map(misnamed(element, attribute), (row) =>
      refuse(
        source,
        "unknown-attribute",
        attributePath(path, attribute),
        { ...detail, reading: row.reading },
        Option.liftPredicate(attribute.local.toLowerCase(), (lower) => row.pattern.test(lower)),
      ),
    );
  }

  const row = misspellings.find(
    (candidate) =>
      element.namespace === qtiNamespace &&
      candidate.element === element.local &&
      attribute.namespace === "" &&
      candidate.written === attribute.local,
  );

  return Option.some(
    row === undefined
      ? refuse(source, "unknown-attribute", attributePath(path, attribute), detail)
      : refuse(
          source,
          "unknown-attribute",
          attributePath(path, attribute),
          { ...detail, reading: row.reading },
          Option.some(row.schema),
        ),
  );
};

/**
 * Check a declared attribute's value: against the XSD's type, unless a reading retypes it, and then
 * against the readings that narrow it and the count ranges. The readings are QTI's, so an
 * attribute of an element in another namespace is checked against its type alone.
 *
 * @param source The document.
 * @param element The attribute's element.
 * @param path The element's path.
 * @param type The attribute's type, as its declaration gives it.
 * @param attribute The attribute, whose value holds no unexpanded entity reference.
 * @returns Its `attribute-type` and `count-range` refusals.
 */
const checkValue = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  type: AttributeType,
  attribute: SourceAttribute,
): readonly Refusal[] => {
  const name = attributeName(attribute);
  const local = attribute.namespace === "" && element.namespace === qtiNamespace;
  const retyped = retypedAttributes.some(
    (row) => local && row.element === element.local && row.attribute === attribute.local,
  );
  if (retyped) {
    return [];
  }

  const at = attributePath(path, attribute);
  const detail = { attribute: name, element: elementName(element), value: attribute.value };
  if (!admits(type, attribute.value)) {
    return [refuse(source, "attribute-type", at, { ...detail, expected: describeType(type) })];
  }

  const lexical = collapse(attribute.value);
  const narrowed = narrowedAttributes
    .filter(
      (row) =>
        local &&
        row.attribute === attribute.local &&
        (row.elements === "declaring" || row.elements.includes(element.local)) &&
        !row.holds(lexical),
    )
    .map((row) =>
      refuse(source, "attribute-type", at, {
        ...detail,
        expected: row.expected,
        reading: row.reading,
      }),
    );
  const ranged = countRanges
    .filter(
      (row) =>
        local &&
        row.attributes.includes(attribute.local) &&
        integerLexical.test(lexical) &&
        (BigInt(lexical) < row.least || BigInt(lexical) > row.greatest),
    )
    .map((row) =>
      refuse(source, "count-range", at, {
        attribute: name,
        greatest: row.greatest.toString(),
        least: row.least.toString(),
        lexical,
        reading: row.reading,
      }),
    );

  return [...narrowed, ...ranged];
};

/**
 * Report whether an element sits where a placement row requires.
 *
 * @param row The placement.
 * @param element The element, one of the row's.
 * @param parents Each walked element's parent.
 * @returns Whether its parent, or one of its ancestors, is the row's container.
 */
const isPlaced = (
  row: Placement,
  element: SourceElement,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): boolean => {
  if (row.within === "ancestor") {
    return Option.isSome(enclosing(element, row.container, parents));
  }

  const parent = parents.get(element);

  return parent?.namespace === qtiNamespace && parent.local === row.container;
};

/**
 * Count the child elements of an element that a child-count row names; text is not a child.
 *
 * @param row The child count.
 * @param element The element.
 * @returns How many of its child elements the row counts.
 */
const countChildren = (row: ChildCount, element: SourceElement): number =>
  element.children.filter(
    (child) =>
      child.kind === "element" &&
      (row.counted === "any" ||
        (child.namespace === qtiNamespace && row.counted.includes(child.local))),
  ).length;

/**
 * Check one element against the placement rows that name it.
 *
 * @param source The document.
 * @param element The element.
 * @param path The element's path.
 * @param parents Each walked element's parent.
 * @returns Its `misplaced-element` refusals.
 */
const checkPlacement = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): readonly Refusal[] =>
  placements
    .filter(
      (row) =>
        element.namespace === qtiNamespace &&
        row.elements.includes(element.local) &&
        row.roots(source.root) &&
        !isPlaced(row, element, parents),
    )
    .map((row) =>
      refuse(source, "misplaced-element", path, {
        element: elementName(element),
        reading: row.reading,
        requires: row.requires,
      }),
    );

/**
 * Check one element against the child-count rows that name it.
 *
 * @param source The document.
 * @param element The element.
 * @param path The element's path.
 * @param parents Each walked element's parent.
 * @returns Its `child-count` refusals.
 */
const checkChildCounts = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): readonly Refusal[] => {
  const parent = Option.fromUndefinedOr(parents.get(element));

  return childCounts
    .filter(
      (row) =>
        element.namespace === qtiNamespace &&
        row.elements.includes(element.local) &&
        row.applies(parent) &&
        row.refuses(countChildren(row, element)),
    )
    .map((row) =>
      refuse(source, "child-count", path, {
        child: row.child,
        element: elementName(element),
        required: row.required,
        source: row.source,
      }),
    );
};

/**
 * Judge an element's `xsi:type` and `xsi:nil` as XML Schema judges them (reading 47).
 *
 * No declaration names either, and no attribute wildcard takes either (XML Schema Part 1, section
 * 3.4.4, clause 3), so they are judged here, never by {@link checkUndeclared}. `xsi:type` is valid
 * when its value, a QName, names one of the types the element's table lists in `types`, or a type
 * derived from one of them (section 3.3.4, clause 4); otherwise, its prefix bound to nothing
 * included, it is `attribute-type`. For a name declared with several types, a type valid for any
 * one of them is valid. A value holding an unexpanded entity reference is unknown and not judged.
 * The walk does not check the element's content against the named type, so `xs:ENTITY`, whose
 * content would have to name an unparsed entity the reader does not see, is admitted unverified
 * where it derives from the declared type (reading 50). No table records a nillable element: the
 * XSD declares none, and table generation refuses a schema that does. So `xsi:nil` is
 * `unknown-attribute` whatever its value (section 3.3.4, clause 3).
 *
 * @param source The document.
 * @param element The element.
 * @param path The element's path.
 * @param table The table of the element's name, which lists the types it is declared with.
 * @param parents Each walked element's parent, for the namespace declarations in scope.
 * @param schemas The tables by namespace, for the derivations of their types.
 * @returns The refusals of the two attributes, in document order.
 */
const checkInstance = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  table: ElementTable,
  parents: ReadonlyMap<SourceElement, SourceElement>,
  schemas: Schemas,
): readonly Refusal[] =>
  element.attributes.filter(isInstanceAttribute).flatMap((attribute) => {
    const at = attributePath(path, attribute);
    const detail = { attribute: attributeName(attribute), element: elementName(element) };
    if (attribute.local === "nil") {
      return [refuse(source, "unknown-attribute", at, { ...detail, reading: "47" })];
    }

    const valid =
      attribute.references.length > 0 ||
      Option.exists(resolveQName(attribute.value, element, parents), (type) =>
        derivesFrom(type, table.types, schemas),
      );

    return valid
      ? []
      : [
          refuse(source, "attribute-type", at, {
            ...detail,
            expected: describeInstanceTypes(table),
            reading: "47",
            value: attribute.value,
          }),
        ];
  });

/**
 * Find the entry of the type an element's valid `xsi:type` names, in QTI's tables or another
 * namespace's, whose table then governs the element in place of its name's (AD-9, XML Schema Part
 * 1, section 3.3.4, clause 4.3).
 *
 * The type is valid as {@link checkInstance} judges it: its QName resolves through the declarations
 * in scope and names one of the types the element's name is declared with, or a type derived from
 * one of them. For a name declared with several types, the named type's own table governs, not the
 * union of the name's. A type of XML Schema's, which adds no attribute or child, leaves the name's
 * table in force, and so does an invalid type, an absent one, or one whose value holds an
 * unexpanded entity reference and is unknown.
 *
 * @param element The element.
 * @param table The table of the element's name.
 * @param parents Each walked element's parent, for the namespace declarations in scope.
 * @param schemas The tables by namespace.
 * @returns The named type's entry with its namespace, or none when the name's table governs.
 */
const namedType = (
  element: SourceElement,
  table: ElementTable,
  parents: ReadonlyMap<SourceElement, SourceElement>,
  schemas: Schemas,
): Option.Option<Governed> => {
  const written = element.attributes.find(
    (attribute) => attribute.namespace === xsiNamespace && attribute.local === "type",
  );
  if (written === undefined || written.references.length > 0) {
    return Option.none();
  }

  return Option.flatMap(resolveQName(written.value, element, parents), (type) =>
    derivesFrom(type, table.types, schemas)
      ? Option.map(typeEntryOf(schemas, type), (entry) => ({
          namespace: type.namespace,
          table: entry,
        }))
      : Option.none(),
  );
};

/**
 * Check the attributes and the text of one element the walk admitted.
 *
 * A required attribute that is absent is `missing-attribute` at the element. `xsi:type` and
 * `xsi:nil` go to {@link checkInstance}, before any other attribute. A declared attribute
 * goes to {@link checkValue} and is checked for `padded-attribute`, unless its value holds an
 * unexpanded entity reference, whose value is unknown. An undeclared one goes to
 * {@link checkUndeclared}. Non-whitespace text in an element whose table admits none is
 * `text-not-allowed`. The placement and child-count rows go to {@link checkPlacement} and
 * {@link checkChildCounts}. The attributes and the text are checked by the table that governs the
 * element, and its `xsi:type` by the types its name is declared with. The readings' rows name QTI's
 * elements and attributes only.
 *
 * @param source The document.
 * @param element The element.
 * @param path The element's path.
 * @param name The table of the element's name.
 * @param governed The table that governs the element, its name's or a valid `xsi:type`'s, with its
 *   tables' namespace.
 * @param parents Each walked element's parent, for the declaration a padded value reads and the
 *   namespace declarations in scope.
 * @param schemas The tables by namespace, for the derivations an `xsi:type` follows.
 * @returns The element's refusals: its placement, missing attributes, its `xsi:type` and `xsi:nil`,
 *   then each other attribute's in document order, then its text, then its child counts.
 */
const checkElement = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  name: ElementTable,
  governed: Governed,
  parents: ReadonlyMap<SourceElement, SourceElement>,
  schemas: Schemas,
): readonly Refusal[] => {
  const { table } = governed;
  const refusals: Refusal[] = [...checkPlacement(source, element, path, parents)];
  const label = elementName(element);
  const declared = table.attributes.filter((declaration) => declaration.use !== "prohibited");

  for (const declaration of declared) {
    const present = element.attributes.some(
      (attribute) =>
        attribute.namespace === declaration.namespace && attribute.local === declaration.local,
    );
    if (declaration.use === "required" && !present) {
      refusals.push(
        refuse(source, "missing-attribute", path, {
          attribute: attributeName(declaration),
          element: label,
        }),
      );
    }
  }

  refusals.push(...checkInstance(source, element, path, name, parents, schemas));
  for (const attribute of element.attributes) {
    if (isAllowance(attribute) || isInstanceAttribute(attribute)) {
      continue;
    }

    const declaration = declared.find(
      (candidate) =>
        candidate.namespace === attribute.namespace && candidate.local === attribute.local,
    );
    if (declaration === undefined) {
      refusals.push(...Option.toArray(checkUndeclared(source, element, path, governed, attribute)));
      continue;
    }

    if (attribute.references.length > 0) {
      continue;
    }

    refusals.push(...checkValue(source, element, path, declaration.type, attribute));
    if (isPadded(element, attribute, parents)) {
      refusals.push(
        refuse(source, "padded-attribute", attributePath(path, attribute), {
          attribute: attributeName(attribute),
          element: label,
          reading: "7",
          value: attribute.value,
        }),
      );
    }
  }

  const holdsText = element.children.some(
    (child) => child.kind === "text" && nonXmlSpace.test(child.text),
  );
  if (holdsText && !table.text) {
    refusals.push(refuse(source, "text-not-allowed", path, { element: label }));
  }

  return [...refusals, ...checkChildCounts(source, element, path, parents)];
};

/**
 * Check the attributes of an element a simple type governs in lax wildcard content (reading 60).
 *
 * Such an element may hold no attribute but `xsi:type`, `xsi:nil`, `xsi:schemaLocation` and
 * `xsi:noNamespaceSchemaLocation` (XML Schema Part 1, section 3.3.4, Element Locally Valid (Type),
 * clause 3.1.1), so each other attribute is `unknown-attribute`, `xml:lang` included. A namespace
 * declaration, which the shared reader returns as an attribute, is not one. Its element children
 * are refused by the walk, and its text is accepted unchecked.
 *
 * @param source The document.
 * @param element The element.
 * @param path The element's path.
 * @returns Its attributes' refusals, in document order.
 */
const checkSimplyTyped = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
): readonly Refusal[] =>
  element.attributes
    .filter((attribute) => !isAllowance(attribute) && !isInstanceAttribute(attribute))
    .map((attribute) =>
      refuse(source, "unknown-attribute", attributePath(path, attribute), {
        attribute: attributeName(attribute),
        element: elementName(element),
        reading: "60",
      }),
    );

/**
 * How the walk treats one element: check it against its name's table, refuse it as
 * `unknown-element` (citing the reading that refuses it, if any), pass over it and admit its
 * children laxly, check it as an element a simple type governs (reading 60), or pass over it and
 * its subtree.
 */
type Admission =
  | { readonly kind: "check"; readonly table: ElementTable }
  | { readonly kind: "unknown"; readonly reading: Option.Option<string> }
  | { readonly kind: "lax" }
  | { readonly kind: "simple" }
  | { readonly kind: "pass" };

/**
 * Report whether a named type is a simple type: one of XML Schema's built-in simple types, or a
 * type in the `types` of QTI's tables or another namespace's that is a union or restricts a simple
 * type (XML Schema Part 1, section 3.14). An extension is a complex type with simple content, and a
 * restriction of `xs:anyType` or of a complex type is complex, so neither is simple, nor is a name
 * that resolves to no type.
 *
 * @param type The type's name.
 * @param schemas The tables by namespace.
 * @returns Whether `type` names a simple type.
 */
const isSimpleType = (type: ChildName, schemas: Schemas): boolean => {
  const seen = new Set<string>();
  let current = type;
  while (current.namespace !== xsdNamespace) {
    const key = `{${current.namespace}}${current.local}`;
    const entry = Option.getOrUndefined(typeEntryOf(schemas, current));
    if (entry === undefined || entry.derivation === "extension" || seen.has(key)) {
      return false;
    }

    if (entry.derivation === "union") {
      return true;
    }

    seen.add(key);
    current = entry.base;
  }

  return builtinBases.has(current.local);
};

/**
 * Decide how lax assessment treats an element no global QTI declaration checks, by its `xsi:type`
 * (XML Schema Part 1, section 3.3.4, Schema-Validity Assessment (Element), clause 1.2).
 *
 * An `xsi:type` that resolves governs the element. Under a simple type, built in or in the `types`
 * of the tables the walk holds, the element may hold no attribute but the four `xsi:` ones and no
 * element child (section 3.3.4, Element Locally Valid (Type), clause 3.1), which the walk checks,
 * while its text is accepted unchecked (reading 60). Under a complex type in those `types` it is
 * kept unchecked with everything below it, and so is an element whose `xsi:type` holds an
 * unexpanded entity reference, whose type is unknown (reading 50). An absent `xsi:type`,
 * `xs:anyType`, and a name that resolves to no type leave the element laxly assessed, against the
 * ur-type definition, which is the lax walk itself.
 *
 * @param element The element.
 * @param parents Each walked element's parent, for the namespace declarations in scope.
 * @param schemas The tables by namespace.
 * @returns `simple` under a simple type, `pass` under a complex or unknown one, and `lax`
 *   otherwise.
 */
const admitByInstanceType = (
  element: SourceElement,
  parents: ReadonlyMap<SourceElement, SourceElement>,
  schemas: Schemas,
): Admission => {
  const written = element.attributes.find(
    (attribute) => attribute.namespace === xsiNamespace && attribute.local === "type",
  );
  if (written === undefined) {
    return { kind: "lax" };
  }

  if (written.references.length > 0) {
    return { kind: "pass" };
  }

  return Option.match(resolveQName(written.value, element, parents), {
    onNone: (): Admission => ({ kind: "lax" }),
    onSome: (type): Admission => {
      if (isSimpleType(type, schemas)) {
        return { kind: "simple" };
      }

      return Option.isSome(typeEntryOf(schemas, type)) ? { kind: "pass" } : { kind: "lax" };
    },
  });
};

/**
 * Decide how the walk treats an element in lax wildcard content, as XML Schema assesses an element
 * a `lax` wildcard matches (Part 1, section 3.10.4, and section 3.3.4, Schema-Validity Assessment
 * (Element)): by its declaration where one is found, and laxly otherwise.
 *
 * A QTI root reading 6 names is passed over with everything below it, as foreign content, and so is
 * an element another namespace's tables declare globally. Any other QTI-namespace element whose
 * name is declared globally is checked by its table, its children following that table (rule
 * `5b8ee08b`). Any other element, one declared only locally or an element of a namespace the walk
 * holds no tables for, is governed by its `xsi:type` where that resolves, as
 * {@link admitByInstanceType} decides: under a simple type its attributes and element children are
 * refused and its text accepted unchecked (reading 60), and under a complex type it is passed over
 * with everything below it (reading 50). Without such a type it is passed over, and each of its
 * children admitted laxly in turn.
 *
 * @param element The element.
 * @param parents Each walked element's parent, for the namespace declarations in scope.
 * @param schemas The tables by namespace.
 * @returns How to treat the element.
 */
const admitLaxly = (
  element: SourceElement,
  parents: ReadonlyMap<SourceElement, SourceElement>,
  schemas: Schemas,
): Admission => {
  const table = elementTableOf(schemas, element);
  if (element.namespace === qtiNamespace) {
    if (nestedRoots.has(element.local)) {
      return { kind: "pass" };
    }

    if (Option.isSome(table) && table.value.global) {
      return { kind: "check", table: table.value };
    }
  } else if (Option.exists(table, (declared) => declared.global)) {
    return { kind: "pass" };
  }

  return admitByInstanceType(element, parents, schemas);
};

/**
 * Decide how the walk treats an element, from the table that governs its parent.
 *
 * An element is tabled when its namespace is QTI's or one whose tables the walk holds. The root is
 * checked when it is tabled and its tables declare its name, and refused when they do not; a root
 * in a namespace the walk holds no tables for is the verdict's `not-qti-root`, so it is passed
 * over. A child of an element a simple type governs in lax wildcard content is refused, citing
 * reading 60. A child of any other element the walk did not check is passed over, unless the walk
 * passed over the parent laxly: then it is admitted laxly, by {@link admitLaxly}. A child its
 * parent's table names is checked when it is tabled and has a table, refused when it is tabled and
 * has none, and passed over in any other namespace. A child only the parent's element wildcard
 * matches, `##other` read against the namespace of the parent's tables, is admitted laxly when the
 * wildcard is `lax`, and passed over with everything below it when it is `strict` or `skip`. Any
 * other child is refused.
 *
 * @param element The element.
 * @param parent Its parent, none for the root.
 * @param checked The table that governs each element the walk has checked so far, with its
 *   tables' namespace.
 * @param laxed Each element the walk has passed over so far while admitting its children laxly.
 * @param simple Each element the walk has found so far that a simple type governs in lax wildcard
 *   content.
 * @param parents Each walked element's parent, for the namespace declarations in scope.
 * @param schemas The tables by namespace.
 * @returns How to treat the element.
 */
const admit = (
  element: SourceElement,
  parent: Option.Option<SourceElement>,
  checked: ReadonlyMap<SourceElement, Governed>,
  laxed: ReadonlySet<SourceElement>,
  simple: ReadonlySet<SourceElement>,
  parents: ReadonlyMap<SourceElement, SourceElement>,
  schemas: Schemas,
): Admission => {
  /**
   * Admit a tabled element by its own table: checked when its namespace's tables declare its local
   * name, otherwise unknown, and passed over when the element is not tabled.
   *
   * @returns The element's admission.
   */
  const byTable = (): Admission => {
    if (!schemas.has(element.namespace)) {
      return { kind: "pass" };
    }

    return Option.match(elementTableOf(schemas, element), {
      onNone: () => ({ kind: "unknown", reading: Option.none() }),
      onSome: (table) => ({ kind: "check", table }),
    });
  };

  if (Option.isNone(parent)) {
    return byTable();
  }

  if (simple.has(parent.value)) {
    return { kind: "unknown", reading: Option.some("60") };
  }

  const governed = checked.get(parent.value);
  if (governed === undefined) {
    return laxed.has(parent.value) ? admitLaxly(element, parents, schemas) : { kind: "pass" };
  }

  const named = governed.table.children.some(
    (child) => child.namespace === element.namespace && child.local === element.local,
  );
  if (named) {
    return byTable();
  }

  const wildcard = governed.table.anyElement;
  if (wildcard === undefined || !wildcardAdmits(wildcard, element.namespace, governed.namespace)) {
    return { kind: "unknown", reading: Option.none() };
  }

  return wildcard.process === "lax" ? admitLaxly(element, parents, schemas) : { kind: "pass" };
};

/**
 * One element the walk checks or refuses, in document order: checked by the table that governs it,
 * checked as an element a simple type governs in lax wildcard content (reading 60), or refused as
 * `unknown-element`, citing the reading that refuses it, if any.
 */
type Step =
  | {
      readonly governed: Governed;
      readonly kind: "check";
      readonly name: ElementTable;
      readonly visit: Visit;
    }
  | { readonly kind: "simple"; readonly visit: Visit }
  | { readonly kind: "unknown"; readonly reading: Option.Option<string>; readonly visit: Visit };

/**
 * The walk of a document: each element it checks or refuses, the table that governs each element
 * it checks with its tables' namespace, and each element's parent.
 */
interface Walked {
  readonly governing: ReadonlyMap<SourceElement, Governed>;
  readonly parents: ReadonlyMap<SourceElement, SourceElement>;
  readonly steps: readonly Step[];
}

/**
 * Walk a document once from its root, deciding how each element is treated and, for each element
 * it checks, which table governs it: its name's, or the table of the type a valid `xsi:type` names.
 * An element's children are admitted by the table that governs it, laxly when the walk passed over
 * it in lax wildcard content, and as `unknown-element` when a simple type governs it there
 * (reading 60).
 *
 * @param source The document.
 * @param schemas The tables by namespace.
 * @returns The walk.
 */
const walkTables = (source: SourceDocument, schemas: Schemas): Walked => {
  const parents = new Map<SourceElement, SourceElement>();
  const governing = new Map<SourceElement, Governed>();
  const laxed = new Set<SourceElement>();
  const simple = new Set<SourceElement>();
  const steps: Step[] = [];

  for (const visit of walk(source)) {
    const { element, parent } = visit;
    if (Option.isSome(parent)) {
      parents.set(element, parent.value);
    }

    const admission = admit(element, parent, governing, laxed, simple, parents, schemas);
    if (admission.kind === "lax") {
      laxed.add(element);
    } else if (admission.kind === "simple") {
      simple.add(element);
      steps.push({ kind: "simple", visit });
    } else if (admission.kind === "unknown") {
      steps.push({ kind: "unknown", reading: admission.reading, visit });
    } else if (admission.kind === "check") {
      const name = admission.table;
      const governed = Option.getOrElse(
        namedType(element, name, parents, schemas),
        (): Governed => ({ namespace: element.namespace, table: name }),
      );
      governing.set(element, governed);
      steps.push({ governed, kind: "check", name, visit });
    }
  }

  return { governing, parents, steps };
};

/**
 * Give each element the structural walk checks with the table that governs it (AD-9).
 *
 * That is the element's name's table, or, after a valid `xsi:type` naming a type of QTI's tables
 * or of another namespace's, that type's own entry in their `types`: for a name declared with
 * several types, the named type's table, not the union. A type of XML Schema's leaves the name's
 * table in force. The elements the walk checks in lax wildcard content, and the elements of the
 * namespaces `others` holds, are among them. An element the walk passes over or refuses has no
 * entry. {@link checkStructure} walks by the same tables, so the two cannot drift.
 *
 * @param source The document, as the reader adapter built it.
 * @param tables The tables generated from the QTI XSD.
 * @param others The tables of other namespaces, keyed by namespace URI, by which the walk checks
 *   those namespaces' elements as it checks QTI's; none by default. An entry for QTI's namespace is
 *   set aside.
 * @returns The table that governs each checked element, keyed by the element; each value is the
 *   element's table or the type's entry itself, never a copy.
 */
export const governingTables = (
  source: SourceDocument,
  tables: Tables,
  others?: ReadonlyMap<string, Tables>,
): ReadonlyMap<SourceElement, ContentTable> =>
  new Map(
    Array.from(walkTables(source, schemasOf(tables, others)).governing, ([element, governed]) => [
      element,
      governed.table,
    ]),
  );

/**
 * Check a document against the XSD's tables, every structural rule at once.
 *
 * The walk starts at the root and enters every QTI-namespace element the tables admit, lax wildcard
 * content included, and every element of a namespace `others` holds, which it checks by that
 * namespace's tables by the same rules, `xsi:type`, `xsi:nil` and lax wildcard content among them.
 * It refuses `unknown-element`, `unknown-attribute`, `missing-attribute`, `attribute-type`,
 * `padded-attribute` and `text-not-allowed`, and the readings' `misplaced-element`, `child-count`
 * and `count-range`, each at the path of the element or attribute at fault. The readings are QTI's
 * and apply to QTI's elements only. Each element is checked by the table {@link governingTables}
 * gives it, except one a simple type governs in lax wildcard content, whose attributes and element
 * children are refused and whose text is not checked (reading 60). It does not enter an element it
 * refuses as unknown, and does enter a misplaced one. A document whose root is outside QTI's
 * namespace and every namespace of `others` yields nothing here: that is the verdict's
 * `not-qti-root`.
 *
 * @param source The document, as the reader adapter built it.
 * @param tables The tables generated from the QTI XSD.
 * @param others The tables of other namespaces, keyed by namespace URI; none by default, which
 *   checks QTI's elements alone. An entry for QTI's namespace is set aside.
 * @returns Every refusal, in document order; empty when the document's structure is valid.
 */
export const checkStructure = (
  source: SourceDocument,
  tables: Tables,
  others?: ReadonlyMap<string, Tables>,
): readonly Refusal[] => {
  const schemas = schemasOf(tables, others);
  const { parents, steps } = walkTables(source, schemas);

  return steps.flatMap((step): readonly Refusal[] => {
    const { element, parent, path } = step.visit;
    if (step.kind === "check") {
      return checkElement(source, element, path, step.name, step.governed, parents, schemas);
    }

    if (step.kind === "simple") {
      return checkSimplyTyped(source, element, path);
    }

    const named = Option.match(parent, {
      onNone: () => ({ element: elementName(element) }),
      onSome: (container) => ({ element: elementName(element), parent: elementName(container) }),
    });
    const detail = Option.match(step.reading, {
      onNone: () => named,
      onSome: (reading) => ({ ...named, reading }),
    });

    return [refuse(source, "unknown-element", path, detail)];
  });
};
