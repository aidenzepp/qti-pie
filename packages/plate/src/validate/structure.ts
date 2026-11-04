/**
 * Structural validation: whether a document's elements, attributes and text are those the QTI XSD
 * admits, as the generated {@link Tables} record them.
 *
 * {@link checkStructure} walks the document once from its root, into every QTI-namespace element
 * the tables admit, and returns every refusal it finds in document order, never stopping at the
 * first, so the verdict can collect them beside the prose rules'. It never refuses what the XSD
 * admits (reading 1): namespace declarations, `xsi:schemaLocation`, whitespace between elements,
 * entity references and whatever a wildcard matches all pass. An element a wildcard admits, and an
 * element in another namespace such as MathML, is kept and not walked. Order and counts of
 * children are not checked; the readings that narrow or move what the XSD admits are applied over
 * these rules, not by them.
 *
 * @module
 */
import { Option } from "effect";
import {
  attributePath,
  qtiNamespace,
  walk,
  xmlNamespace,
  xmlnsNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { isNcName } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { patternEquivalents } from "#plate/validate/xsd.ts";
import type {
  AttributeType,
  BuiltinName,
  ElementTable,
  Tables,
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
 * The lexical space of `xs:integer`: an optional sign and ASCII digits, as many as written.
 *
 * @see https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#integer
 */
const integerLexical = /^[+-]?[0-9]+$/u;

/**
 * The lexical space of `xs:decimal`: an optional sign and digits with at most one decimal point,
 * at least one digit in all.
 *
 * @see https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#decimal
 */
const decimalLexical = /^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/u;

/**
 * The lexical space of `xs:double` in XML Schema 1.0: a decimal with an optional exponent, `INF`,
 * `-INF` or `NaN`.
 *
 * @see https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#double
 */
const doubleLexical = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|-?INF|NaN)$/u;

/**
 * The least value of `xs:int`, -2^31.
 */
const intLeast = -2_147_483_648n;

/**
 * The greatest value of `xs:int`, 2^31 - 1.
 */
const intGreatest = 2_147_483_647n;

/**
 * Report whether a value is in a built-in's lexical space, after its whitespace facet.
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
    integerLexical.test(value) && BigInt(value) >= intLeast && BigInt(value) <= intGreatest,
  integer: (value: string) => integerLexical.test(value),
  nonNegativeInteger: (value: string) => integerLexical.test(value) && BigInt(value) >= 0n,
  normalizedString: () => true,
  string: () => true,
} satisfies Record<BuiltinName, (value: string) => boolean>;

/**
 * Read an `xs:double` lexical form as a number, the infinities and NaN by name.
 *
 * @param lexical A value {@link doubleLexical} admits.
 * @returns The number it names.
 */
const readDouble = (lexical: string): number => {
  if (lexical === "INF") {
    return Number.POSITIVE_INFINITY;
  }

  return lexical === "-INF" ? Number.NEGATIVE_INFINITY : Number(lexical);
};

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
 * A decimal or an integer kind compares exactly, digit for digit; a double compares as a number,
 * so `NaN` meets no bound. A bound outside the built-in's lexical space, or a bound on a built-in
 * that is not a number, is met by nothing.
 *
 * @param name The built-in the value is read as.
 * @param value The value, already in the built-in's lexical space.
 * @param bound The bound's lexical form.
 * @returns Whether the value is at least the bound.
 */
const meetsBound = (name: BuiltinName, value: string, bound: string): boolean => {
  if (name === "double") {
    return doubleLexical.test(bound) && readDouble(value) >= readDouble(bound);
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
 * `##any` admits every namespace and none. `##other` admits any namespace but QTI's, the XSD's
 * target namespace, and never none. A list admits its namespaces, `""` standing for none.
 *
 * @param wildcard The element's `xs:any` or `xs:anyAttribute`.
 * @param namespace The namespace of the element or attribute, `""` for none.
 * @returns Whether the wildcard matches it.
 */
const wildcardAdmits = (wildcard: Wildcard, namespace: string): boolean => {
  if (wildcard.namespace === "##any") {
    return true;
  }

  if (wildcard.namespace === "##other") {
    return namespace !== "" && namespace !== qtiNamespace;
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
const attributeName = (attribute: Pick<SourceAttribute, "local" | "namespace">): string => {
  if (attribute.namespace === "") {
    return attribute.local;
  }

  return attribute.namespace === xmlNamespace
    ? `xml:${attribute.local}`
    : `{${attribute.namespace}}${attribute.local}`;
};

/**
 * Report whether an attribute is one the XSD admits on every element without declaring it: a
 * namespace declaration, which the shared reader returns as an attribute, or `xsi:schemaLocation`.
 *
 * @param attribute The attribute.
 * @returns Whether it is always allowed.
 */
const isAllowance = (attribute: SourceAttribute): boolean =>
  attribute.namespace === xmlnsNamespace ||
  (attribute.namespace === xsiNamespace && attribute.local === "schemaLocation");

/**
 * Look up an element's table, only among the tables' own keys.
 *
 * @param tables The tables.
 * @param local The element's local name in the QTI namespace.
 * @returns Its table, or none when the XSD declares no element of that name.
 */
const tableOf = (tables: Tables, local: string): Option.Option<ElementTable> =>
  Object.hasOwn(tables.elements, local)
    ? Option.fromUndefinedOr(tables.elements[local])
    : Option.none();

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
 * Check one attribute the element's table does not declare: allowed when the element's attribute
 * wildcard matches its namespace, and otherwise `unknown-attribute`, with the misspelling table's
 * suggestion when a row matches.
 *
 * @param source The document.
 * @param element The attribute's element.
 * @param path The element's path.
 * @param table The element's table.
 * @param attribute The undeclared attribute.
 * @returns The refusal, or none when the wildcard admits the attribute.
 */
const checkUndeclared = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  table: ElementTable,
  attribute: SourceAttribute,
): Option.Option<Refusal> => {
  if (table.anyAttribute !== undefined && wildcardAdmits(table.anyAttribute, attribute.namespace)) {
    return Option.none();
  }

  const detail = { attribute: attributeName(attribute), element: elementName(element) };
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
 * Check the attributes and the text of one element the walk admitted.
 *
 * A required attribute that is absent is `missing-attribute` at the element. A declared attribute
 * is checked for `attribute-type` and `padded-attribute`, unless its value holds an unexpanded
 * entity reference, whose value is unknown. An undeclared one goes to {@link checkUndeclared}.
 * Non-whitespace text in an element whose table admits none is `text-not-allowed`.
 *
 * @param source The document.
 * @param element The element.
 * @param path The element's path.
 * @param table The element's table.
 * @param parents Each walked element's parent, for the declaration a padded value reads.
 * @returns The element's refusals: missing attributes, then each attribute's in document order,
 *   then its text.
 */
const checkElement = (
  source: SourceDocument,
  element: SourceElement,
  path: string,
  table: ElementTable,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): readonly Refusal[] => {
  const refusals: Refusal[] = [];
  const name = elementName(element);
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
          element: name,
        }),
      );
    }
  }

  for (const attribute of element.attributes) {
    if (isAllowance(attribute)) {
      continue;
    }

    const declaration = declared.find(
      (candidate) =>
        candidate.namespace === attribute.namespace && candidate.local === attribute.local,
    );
    if (declaration === undefined) {
      refusals.push(...Option.toArray(checkUndeclared(source, element, path, table, attribute)));
      continue;
    }

    if (attribute.references.length > 0) {
      continue;
    }

    const detail = { attribute: attributeName(attribute), element: name, value: attribute.value };
    if (!admits(declaration.type, attribute.value)) {
      refusals.push(
        refuse(source, "attribute-type", attributePath(path, attribute), {
          ...detail,
          expected: describeType(declaration.type),
        }),
      );
    }

    if (isPadded(element, attribute, parents)) {
      refusals.push(
        refuse(source, "padded-attribute", attributePath(path, attribute), {
          ...detail,
          reading: "7",
        }),
      );
    }
  }

  const holdsText = element.children.some(
    (child) => child.kind === "text" && nonXmlSpace.test(child.text),
  );
  if (holdsText && !table.text) {
    refusals.push(refuse(source, "text-not-allowed", path, { element: name }));
  }

  return refusals;
};

/**
 * How the walk treats one element: check it against its table, refuse it as `unknown-element`, or
 * pass over it and its subtree.
 */
type Admission =
  | { readonly kind: "check"; readonly table: ElementTable }
  | { readonly kind: "unknown" }
  | { readonly kind: "pass" };

/**
 * Decide how the walk treats an element, from its parent's table.
 *
 * The root is checked when it is a QTI-namespace element with a table; a root in another namespace
 * is the verdict's `not-qti-root`, so it is passed over. A child of an element the walk did not
 * check is passed over. A child its parent's table names is checked when it is in the QTI namespace
 * and has a table, refused when it is in the QTI namespace and has none, and passed over in any
 * other namespace. A child only the parent's element wildcard matches is passed over (reading 6).
 * Any other child is refused.
 *
 * @param element The element.
 * @param parent Its parent, none for the root.
 * @param checked The table of each element the walk has checked so far.
 * @param tables The tables.
 * @returns How to treat the element.
 */
const admit = (
  element: SourceElement,
  parent: Option.Option<SourceElement>,
  checked: ReadonlyMap<SourceElement, ElementTable>,
  tables: Tables,
): Admission => {
  const byTable = (): Admission =>
    Option.match(tableOf(tables, element.local), {
      onNone: () => ({ kind: "unknown" }),
      onSome: (table) => ({ kind: "check", table }),
    });

  if (Option.isNone(parent)) {
    return element.namespace === qtiNamespace ? byTable() : { kind: "pass" };
  }

  const parentTable = checked.get(parent.value);
  if (parentTable === undefined) {
    return { kind: "pass" };
  }

  const named = parentTable.children.some(
    (child) => child.namespace === element.namespace && child.local === element.local,
  );
  if (named) {
    return element.namespace === qtiNamespace ? byTable() : { kind: "pass" };
  }

  const wildcard = parentTable.anyElement;

  return wildcard !== undefined && wildcardAdmits(wildcard, element.namespace)
    ? { kind: "pass" }
    : { kind: "unknown" };
};

/**
 * Check a document against the XSD's tables, every structural rule at once.
 *
 * The walk starts at the root and enters every QTI-namespace element the tables admit. It refuses
 * `unknown-element`, `unknown-attribute`, `missing-attribute`, `attribute-type`,
 * `padded-attribute` and `text-not-allowed`, each at the path of the element or attribute at fault,
 * and does not enter an element it refuses. A document whose root is outside the QTI namespace
 * yields nothing here: that is the verdict's `not-qti-root`.
 *
 * @param source The document, as the reader adapter built it.
 * @param tables The tables generated from the QTI XSD.
 * @returns Every refusal, in document order; empty when the document's structure is valid.
 */
export const checkStructure = (source: SourceDocument, tables: Tables): readonly Refusal[] => {
  const refusals: Refusal[] = [];
  const parents = new Map<SourceElement, SourceElement>();
  const checked = new Map<SourceElement, ElementTable>();

  for (const { element, parent, path } of walk(source)) {
    if (Option.isSome(parent)) {
      parents.set(element, parent.value);
    }

    const admission = admit(element, parent, checked, tables);
    if (admission.kind === "unknown") {
      const detail = Option.match(parent, {
        onNone: () => ({ element: elementName(element) }),
        onSome: (container) => ({ element: elementName(element), parent: elementName(container) }),
      });
      refusals.push(refuse(source, "unknown-element", path, detail));
    } else if (admission.kind === "check") {
      checked.set(element, admission.table);
      refusals.push(...checkElement(source, element, path, admission.table, parents));
    }
  }

  return refusals;
};
