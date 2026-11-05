import { Effect, Option } from "effect";

import { UnmodeledVocabulary } from "#pantry/import/tree.ts";
import { collapse, replace } from "#pantry/import/whitespace.ts";
import type { WhiteSpace } from "#pantry/import/whitespace.ts";
import type {
  AttributeValue,
  ExpressionNode,
  IncludeNode,
  Language,
  LiteralOrRef,
  Position,
  ProcessingAst,
  RuleNode,
  RuleOrExpressionKind,
} from "#pantry/processing/ast.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { ncName, xsDouble, xsInteger } from "#pantry/schema/patterns.ts";
import { attributeWildcard, wildcardHost } from "#pantry/schema/seed/wildcard.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The braced reference of `qti-pattern-match`'s `pattern`: an NCName between braces, as the
 * `EncVariableStringDType` of the ASI XSD writes it.
 *
 * This is a source string in the convention of `patterns.ts`, but it is never a column pattern:
 * {@link patternOrRef} is its only user, and the typed column stores the value as read.
 */
export const encVariableString = `^\\{${ncName.slice(1, -1)}\\}$`;

const encVariableRegExp = new RegExp(encVariableString, "u");

const integerRegExp = new RegExp(xsInteger, "u");

const doubleRegExp = new RegExp(xsDouble, "u");

const ncNameRegExp = new RegExp(ncName, "u");

/**
 * Tell a literal from a reference in a mixed-union attribute (`figures`, `min`, `max`, `step`, `n`,
 * `number-repeats`).
 *
 * A value whose collapse is an integer or an `xs:double` is the collapsed literal; a value that is
 * an NCName exactly as given is the reference, so a padded name such as ` N ` is a literal that the
 * arm's pattern refuses, as `xmllint` refuses it; any other text is a literal as given.
 *
 * @param processed - The attribute's value.
 * @returns The literal or the referenced variable's identifier.
 */
export const literalOrRef = (processed: string): LiteralOrRef => {
  const collapsed = collapse(processed);
  if (integerRegExp.test(collapsed) || doubleRegExp.test(collapsed)) {
    return { _tag: "literal", value: collapsed };
  }

  if (ncNameRegExp.test(processed)) {
    return { _tag: "ref", identifier: processed };
  }

  return { _tag: "literal", value: processed };
};

/**
 * Tell a literal from a reference in `qti-pattern-match`'s `pattern`, whose class is `preserve`.
 *
 * A value that is exactly an NCName between braces is the reference to that variable; any other
 * value, `a{2}` among them, is a regular expression kept as given.
 *
 * @param value - The attribute's value as read.
 * @returns The literal pattern or the referenced variable's identifier.
 */
export const patternOrRef = (value: string): LiteralOrRef =>
  encVariableRegExp.test(value)
    ? { _tag: "ref", identifier: value.slice(1, -1) }
    : { _tag: "literal", value };

/**
 * What a rule or processing element holds, which decides the children it admits.
 *
 * - `root`: a `qti-*-processing` element, holding statements.
 * - `fragment` and `else`: statements.
 * - `if`: one guarding expression, then statements.
 * - `condition`: its `if`, `else-if` and `else` parts.
 * - `holder`: one expression.
 * - `leaf`: nothing.
 */
type RuleClass = "condition" | "else" | "fragment" | "holder" | "if" | "leaf" | "root";

/**
 * The entry of an expression kind.
 */
interface ExpressionEntry {
  readonly attributes: readonly string[];
  readonly class: "expression";
  readonly kind: RuleOrExpressionKind;
}

/**
 * The entry of a rule or processing kind.
 */
interface RuleEntry {
  readonly attributes: readonly string[];
  readonly class: RuleClass;
  readonly kind: RuleOrExpressionKind;
}

/**
 * The attribute names of each expression kind that has any, from section 3.3 table A.
 */
const expressionAttributes = {
  "qti-any-n": ["min", "max"],
  "qti-base-value": ["base-type"],
  "qti-correct": ["identifier"],
  "qti-custom-operator": ["class", "definition"],
  "qti-default": ["identifier"],
  "qti-equal": ["tolerance-mode", "tolerance", "include-lower-bound", "include-upper-bound"],
  "qti-equal-rounded": ["rounding-mode", "figures"],
  "qti-field-value": ["field-identifier"],
  "qti-index": ["n"],
  "qti-inside": ["shape", "coords"],
  "qti-map-response": ["identifier"],
  "qti-map-response-point": ["identifier"],
  "qti-math-constant": ["name"],
  "qti-math-operator": ["name"],
  "qti-number-correct": ["section-identifier", "include-category", "exclude-category"],
  "qti-number-incorrect": ["section-identifier", "include-category", "exclude-category"],
  "qti-number-presented": ["section-identifier", "include-category", "exclude-category"],
  "qti-number-responded": ["section-identifier", "include-category", "exclude-category"],
  "qti-number-selected": ["section-identifier", "include-category", "exclude-category"],
  "qti-outcome-maximum": [
    "section-identifier",
    "include-category",
    "exclude-category",
    "outcome-identifier",
    "weight-identifier",
  ],
  "qti-outcome-minimum": [
    "section-identifier",
    "include-category",
    "exclude-category",
    "outcome-identifier",
    "weight-identifier",
  ],
  "qti-pattern-match": ["pattern"],
  "qti-random-float": ["min", "max"],
  "qti-random-integer": ["min", "max", "step"],
  "qti-repeat": ["number-repeats"],
  "qti-round-to": ["rounding-mode", "figures"],
  "qti-stats-operator": ["name"],
  "qti-string-match": ["case-sensitive", "substring"],
  "qti-substring": ["case-sensitive"],
  "qti-test-variables": [
    "section-identifier",
    "include-category",
    "exclude-category",
    "variable-identifier",
    "weight-identifier",
    "base-type",
  ],
  "qti-variable": ["identifier", "weight-identifier"],
} satisfies Readonly<Record<string, readonly string[]>>;

/**
 * The 26 rule and processing kinds of section 3.3 table B, each with its class and attribute names.
 */
const ruleEntries: readonly RuleEntry[] = [
  { attributes: [], class: "leaf", kind: "qti-exit-response" },
  { attributes: [], class: "leaf", kind: "qti-exit-template" },
  { attributes: [], class: "leaf", kind: "qti-exit-test" },
  { attributes: ["identifier"], class: "holder", kind: "qti-lookup-outcome-value" },
  { attributes: [], class: "condition", kind: "qti-outcome-condition" },
  { attributes: [], class: "else", kind: "qti-outcome-else" },
  { attributes: [], class: "if", kind: "qti-outcome-else-if" },
  { attributes: [], class: "if", kind: "qti-outcome-if" },
  { attributes: [], class: "root", kind: "qti-outcome-processing" },
  { attributes: [], class: "fragment", kind: "qti-outcome-processing-fragment" },
  { attributes: [], class: "condition", kind: "qti-response-condition" },
  { attributes: [], class: "else", kind: "qti-response-else" },
  { attributes: [], class: "if", kind: "qti-response-else-if" },
  { attributes: [], class: "if", kind: "qti-response-if" },
  { attributes: ["template", "template-location"], class: "root", kind: "qti-response-processing" },
  { attributes: [], class: "fragment", kind: "qti-response-processing-fragment" },
  { attributes: ["identifier"], class: "holder", kind: "qti-set-correct-response" },
  { attributes: ["identifier"], class: "holder", kind: "qti-set-default-value" },
  { attributes: ["identifier"], class: "holder", kind: "qti-set-outcome-value" },
  { attributes: ["identifier"], class: "holder", kind: "qti-set-template-value" },
  { attributes: [], class: "condition", kind: "qti-template-condition" },
  { attributes: [], class: "holder", kind: "qti-template-constraint" },
  { attributes: [], class: "else", kind: "qti-template-else" },
  { attributes: [], class: "if", kind: "qti-template-else-if" },
  { attributes: [], class: "if", kind: "qti-template-if" },
  { attributes: [], class: "root", kind: "qti-template-processing" },
];

/**
 * What an element name is in the vocabulary: an expression or a rule with its entry, or one of the
 * two XInclude elements.
 */
type Classified =
  | { readonly _tag: "expression"; readonly entry: ExpressionEntry }
  | { readonly _tag: "fallback" }
  | { readonly _tag: "include" }
  | { readonly _tag: "rule"; readonly entry: RuleEntry };

/**
 * The ASI elements the parser classifies, by local name: the 64 expression kinds and the 26 rule
 * and processing kinds.
 */
const asiEntries: ReadonlyMap<string, Classified> = new Map<string, Classified>([
  ...asi.expressionKinds.map((kind): [string, Classified] => [
    kind,
    {
      _tag: "expression",
      entry: {
        attributes: new Map(Object.entries(expressionAttributes)).get(kind) ?? [],
        class: "expression",
        kind,
      },
    },
  ]),
  ...ruleEntries.map((entry): [string, Classified] => [entry.kind, { _tag: "rule", entry }]),
]);

/**
 * The attributes of `xi:include`: `href` and `parse` collapse, the rest preserve.
 */
const includeAttributes = ["href", "parse", "xpointer", "encoding", "accept", "accept-language"];

/**
 * The `whiteSpace` class of every attribute name the parser reads, from section 3.9: collapse for
 * the identifier names, the URIs, the booleans, the lists, `n`, `number-repeats`, XInclude's `href`
 * and `parse`, and the four mixed unions; replace for `coords`; preserve for the enumerations,
 * `pattern` and XInclude's four strings.
 */
const whiteSpaceClasses = {
  accept: "preserve",
  "accept-language": "preserve",
  "base-type": "preserve",
  "case-sensitive": "collapse",
  class: "collapse",
  coords: "replace",
  definition: "collapse",
  encoding: "preserve",
  "exclude-category": "collapse",
  "field-identifier": "collapse",
  figures: "collapse",
  href: "collapse",
  identifier: "collapse",
  "include-category": "collapse",
  "include-lower-bound": "collapse",
  "include-upper-bound": "collapse",
  max: "collapse",
  min: "collapse",
  n: "collapse",
  name: "preserve",
  "number-repeats": "collapse",
  "outcome-identifier": "collapse",
  parse: "collapse",
  pattern: "preserve",
  "rounding-mode": "preserve",
  "section-identifier": "collapse",
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute name of `qti-inside`, not a structure.
  shape: "preserve",
  step: "collapse",
  substring: "collapse",
  template: "collapse",
  "template-location": "collapse",
  tolerance: "collapse",
  "tolerance-mode": "preserve",
  "variable-identifier": "collapse",
  "weight-identifier": "collapse",
  xpointer: "preserve",
} satisfies Readonly<Record<string, WhiteSpace>>;

const whiteSpaceOf: ReadonlyMap<string, WhiteSpace> = new Map(Object.entries(whiteSpaceClasses));

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

const asiNamespace = asi.registry["qti-response-processing"].namespace;

const xIncludeNamespace = xi.registry["xi:include"].namespace;

/**
 * The kinds this parser classifies that carry a wildcard, read from the seed rows rather than
 * listed: the ones whose attribute wildcard and whose element wildcard admit foreign content.
 */
const wildcardKinds = ["qti-custom-operator", "xi:fallback", "xi:include"] as const;

const attributeWildcardHosts: ReadonlySet<string> = new Set(
  attributeWildcard.map((row) => row.host).filter((host) => wildcardKinds.some((k) => k === host)),
);

const elementWildcardHosts: ReadonlySet<string> = new Set(
  wildcardHost.map((row) => row.host).filter((host) => wildcardKinds.some((k) => k === host)),
);

/**
 * The attributes XML Schema declares in the `xsi` namespace, which every element carries and the
 * tree walk judges and stores: `xsi:schemaLocation`, `xsi:type`, `xsi:nil` and
 * `xsi:noNamespaceSchemaLocation`.
 */
const declaredXsiNames: ReadonlySet<string> = new Set([
  "nil",
  "noNamespaceSchemaLocation",
  "schemaLocation",
  "type",
]);

/**
 * The element children of `element`, in document order, each with its index among them.
 */
const elementChildren = (
  element: Element,
): readonly { readonly child: Element; readonly index: number }[] =>
  element.children
    .filter((child): child is Element => child.kind === "element")
    .map((child, index) => ({ child, index }));

/**
 * Classify an element by its namespace and local name, or none when it is outside the vocabulary.
 */
const classify = (element: Element): Option.Option<Classified> => {
  if (element.namespace === asiNamespace) {
    return Option.fromNullishOr(asiEntries.get(element.local));
  }

  if (element.namespace === xIncludeNamespace && element.local === "include") {
    return Option.some({ _tag: "include" });
  }

  if (element.namespace === xIncludeNamespace && element.local === "fallback") {
    return Option.some({ _tag: "fallback" });
  }

  return Option.none();
};

/**
 * Fail with the refusal for an element that the host does not take, naming the element and its
 * enclosing element.
 */
const refuseElement = (element: Element, parent: Element): UnmodeledVocabulary =>
  new UnmodeledVocabulary({
    kind: "element",
    name: element.qname,
    parent: Option.some(parent.qname),
  });

/**
 * The value an attribute's typed column holds under its `whiteSpace` class.
 */
const applyWhiteSpace = (lexical: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(lexical);
  }

  return whiteSpace === "replace" ? replace(lexical) : lexical;
};

/**
 * Read an element's attributes, each in both forms and under its `whiteSpace` class.
 *
 * Namespace declarations and the four `xsi` attributes XML Schema declares are admitted on every
 * element and are not attributes of the kind; any other attribute outside `allowed` is refused,
 * naming the first. On a host of an attribute wildcard, an attribute with a namespace is wildcard
 * content: it is passed over, not read, and the tree walk judges it. On an element that carries
 * `xsi:type` every attribute outside `allowed` is passed over the same way: a derived type may add
 * it, and the tree walk stores it or refuses it.
 */
const readAttributes = (
  element: Element,
  allowed: readonly string[],
  kind: string,
): Effect.Effect<ReadonlyMap<string, AttributeValue>, UnmodeledVocabulary> =>
  Effect.gen(function* readAttributeValues() {
    const read = new Map<string, AttributeValue>();
    const typed = element.attributes.some(
      (attribute) => attribute.namespace === xsiNamespace && attribute.local === "type",
    );
    for (const attribute of element.attributes) {
      if (attribute.namespace === xmlnsNamespace) {
        continue;
      }

      if (attribute.namespace === xsiNamespace && declaredXsiNames.has(attribute.local)) {
        continue;
      }

      if (attribute.namespace !== "" && attributeWildcardHosts.has(kind)) {
        continue;
      }

      const whiteSpace = whiteSpaceOf.get(attribute.local);
      const outside =
        attribute.namespace !== "" ||
        whiteSpace === undefined ||
        !allowed.includes(attribute.local);
      if (outside && typed) {
        continue;
      }

      if (outside) {
        return yield* new UnmodeledVocabulary({
          kind: "attribute",
          name: attribute.qname,
          parent: Option.some(element.qname),
        });
      }

      read.set(attribute.local, {
        lexical: attribute.value,
        processed: applyWhiteSpace(attribute.value, whiteSpace),
        whiteSpace,
      });
    }

    return read;
  });

/**
 * Concatenate an element's text, whitespace and entity-reference children as read, ignoring its
 * comments, processing instructions and element children.
 */
const textOf = (element: Element): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "entityRef" ? `&${child.name};` : "";
    })
    .join("");

const extend = (position: Position, index: number): Position => ({
  path: [...position.path, index],
});

/**
 * Parse an expression element and, recursively, its operands.
 *
 * Every element child must itself be an expression; the operand count is the importer's check, not
 * the parser's.
 */
const parseExpression = (
  element: Element,
  entry: ExpressionEntry,
  position: Position,
): Effect.Effect<ExpressionNode, UnmodeledVocabulary> =>
  Effect.gen(function* parseExpressionElement() {
    const attributes = yield* readAttributes(element, entry.attributes, entry.kind);
    const operands: ExpressionNode[] = [];
    for (const { child, index } of elementChildren(element)) {
      const classified = classify(child);
      if (Option.isNone(classified) || classified.value._tag !== "expression") {
        if (elementWildcardHosts.has(entry.kind)) {
          continue;
        }

        return yield* refuseElement(child, element);
      }

      operands.push(yield* parseExpression(child, classified.value.entry, extend(position, index)));
    }

    return {
      attributes,
      element,
      kind: entry.kind,
      operands,
      position,
      text: element.local === "qti-base-value" ? Option.some(textOf(element)) : Option.none(),
    };
  });

/**
 * Parse an `xi:include`, keeping its `xi:fallback` child as an element.
 *
 * Includes are never resolved: the node stands for the element as written, whether or not its
 * `href` names a file.
 */
const parseInclude = (
  element: Element,
  position: Position,
): Effect.Effect<IncludeNode, UnmodeledVocabulary> =>
  Effect.gen(function* parseIncludeElement() {
    const attributes = yield* readAttributes(element, includeAttributes, "xi:include");
    let fallback: Option.Option<Element> = Option.none();
    for (const { child } of elementChildren(element)) {
      const classified = classify(child);
      if (elementWildcardHosts.has("xi:include") && child.namespace !== xIncludeNamespace) {
        continue;
      }

      if (
        Option.isNone(classified) ||
        classified.value._tag !== "fallback" ||
        Option.isSome(fallback)
      ) {
        return yield* refuseElement(child, element);
      }

      yield* readAttributes(child, [], "xi:fallback");
      fallback = Option.some(child);
    }

    return { attributes, element, fallback, kind: "xi:include", position };
  });

/**
 * The classes of rule that stand as statements in a processing root, a fragment, an `else` or an
 * `if`.
 */
const statementClasses: ReadonlySet<RuleClass> = new Set<RuleClass>([
  "condition",
  "fragment",
  "holder",
  "leaf",
]);

/**
 * What a host of one class does with a child: the slot the child fills, or `none` when the host
 * does not take it.
 */
const slotOf = (host: RuleClass, child: Classified): "branch" | "expression" | "none" | "rule" => {
  if (child._tag === "fallback") {
    return "none";
  }

  if (child._tag === "expression") {
    return host === "if" || host === "holder" ? "expression" : "none";
  }

  if (host === "condition") {
    return child._tag === "rule" && (child.entry.class === "if" || child.entry.class === "else")
      ? "branch"
      : "none";
  }

  if (host === "root" || host === "fragment" || host === "else" || host === "if") {
    return child._tag === "include" || statementClasses.has(child.entry.class) ? "rule" : "none";
  }

  return "none";
};

/**
 * Parse a rule element and, recursively, the rules and expressions under it.
 *
 * The host's class decides which children it takes and where they go: an `if` takes a guarding
 * expression and then statements, a condition takes its branches, a holder takes one expression,
 * a leaf takes nothing. A child it does not take, or a second expression, is refused naming it;
 * the importer's admission rows check the rest of the content model.
 */
const parseHost = (
  element: Element,
  entry: RuleEntry,
  position: Position,
): Effect.Effect<RuleNode, UnmodeledVocabulary> =>
  Effect.gen(function* parseRuleElement() {
    const attributes = yield* readAttributes(element, entry.attributes, entry.kind);
    const branches: RuleNode[] = [];
    const statements: (IncludeNode | RuleNode)[] = [];
    let expression: Option.Option<ExpressionNode> = Option.none();
    for (const { child, index } of elementChildren(element)) {
      const classified = classify(child);
      if (Option.isNone(classified)) {
        return yield* refuseElement(child, element);
      }

      const found = classified.value;
      const slot = slotOf(entry.class, found);
      const at = extend(position, index);
      if (slot === "none" || (slot === "expression" && Option.isSome(expression))) {
        return yield* refuseElement(child, element);
      }

      if (found._tag === "include") {
        statements.push(yield* parseInclude(child, at));
      } else if (found._tag === "expression") {
        expression = Option.some(yield* parseExpression(child, found.entry, at));
      } else if (found._tag === "rule") {
        const parsed = yield* parseHost(child, found.entry, at);
        if (slot === "branch") {
          branches.push(parsed);
        } else {
          statements.push(parsed);
        }
      }
    }

    return {
      attributes,
      branches,
      element,
      expression,
      kind: entry.kind,
      position,
      rules: statements,
    };
  });

/**
 * Parse a processing root into the AST: classify every element by the section 3.3 vocabulary and
 * read every attribute under its `whiteSpace` class.
 *
 * Whitespace, comments and processing instructions between elements are skipped here; the row
 * builder keeps them through `treeRows`. An element or an attribute outside the vocabulary, or an
 * element the host's content model does not take, is `UnmodeledVocabulary` naming it. An
 * `xi:include` is parsed as data and never resolved.
 *
 * @param root - The `qti-response-processing`, `qti-outcome-processing` or
 *   `qti-template-processing` element.
 * @param language - The processing language the root is written in.
 * @returns The AST, or the refusal naming the first element or attribute outside the vocabulary.
 */
export const parseProcessing = (
  root: Element,
  language: Language,
): Effect.Effect<ProcessingAst, UnmodeledVocabulary> =>
  Effect.gen(function* parseProcessingRoot() {
    const classified = classify(root);
    if (
      Option.isNone(classified) ||
      classified.value._tag !== "rule" ||
      classified.value.entry.class !== "root"
    ) {
      return yield* new UnmodeledVocabulary({
        kind: "element",
        name: root.qname,
        parent: Option.none(),
      });
    }

    const parsed = yield* parseHost(root, classified.value.entry, { path: [] });

    return { language, root, rules: parsed.rules };
  });
