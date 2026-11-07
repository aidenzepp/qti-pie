/**
 * The producers of the law oracle's laws over the declarations (O2), the LOM title (O6), and the
 * laws the schema states that the oracle had not declared (lane OL): each stated on the host from
 * its source and the schema's statement of it.
 *
 * - **The declarations** (`src/qti/declarations.ts` `declarationLaws`): `Declaration not reserved`
 *   (reading 72), `Reserved type` (§2.2.2.1, §2.2.2.3), `Declaration base type` (§4.5.3), `Value
 *   cardinality` and `Record field key` (§8.16, §7.46), `Typed value` (§7.46, §8.13) and `Mastery
 *   range` (reading 9), over each declaration element, its value sets and their values.
 * - **The LOM title** (`src/qti/metadata.ts` `lom-title`, QTI 3.0 Metadata §2.7.1.2): a record that
 *   names a document and has a general title holds a title string with the document's title, in its
 *   language.
 * - **The laws the oracle declares here** ({@link addedLaws}): `Adaptive feedback` (§5.49, §5.52),
 *   `Max strings required` (§5.48.6), `Dependency target` (IMS Content Packaging 1.2) and `XML
 *   production` (XML 1.0's productions over the stored texts), each under the law catalog's name,
 *   whose rule and source it keeps (`#pantry/vocab/laws.ts` `lawTable`).
 */
import { Option } from "effect";
import { rowOf, step } from "#pantry/grammar/ancestry.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { booleanOf } from "#pantry/grammar/domains.ts";
import {
  ancestorsOf,
  breachAt,
  elementsOf,
  field,
  typedOr,
  typedValueOf,
  valueOf,
} from "#pantry/test/oracle-view.ts";
import type { LawBreach, PackageRows, Row, View } from "#pantry/test/oracle-view.ts";
import type { OracleLaw } from "#pantry/test/oracle.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { ncNameForm, typedValueHolds } from "#pantry/test/oracle-laws/typed.ts";

/**
 * The laws this module produces.
 */
export const documentLaws = [
  "Declaration not reserved",
  "Reserved type",
  "Declaration base type",
  "Value cardinality",
  "Record field key",
  "Typed value",
  "Mastery range",
  "LomObjectTitle",
  "Adaptive feedback",
  "Max strings required",
  "Dependency target",
  "XML production",
] as const;

/**
 * A law of {@link documentLaws}.
 */
export type DocumentLaw = (typeof documentLaws)[number];

/**
 * A breach of one of this module's laws.
 */
type Breach = LawBreach<DocumentLaw>;

/**
 * The laws of the catalog (`#pantry/vocab/laws.ts` `lawTable`) that the law oracle had not
 * declared, which this module declares and produces, each with its explanation from a breach's
 * keys. The oracle merges them with its own (`#pantry/test/oracle.ts` `oracleLaws`).
 */
export const addedLaws = {
  "Adaptive feedback": {
    explain: (keys) =>
      `${field(keys, "kind")} binds ${field(keys, "identifier")} inside feedback, which a non-adaptive item's feedback may not hold`,
  },
  "Dependency target": {
    explain: (keys) =>
      `a dependency names ${field(keys, "identifier")}, which no resource of its manifest is`,
  },
  "Max strings required": {
    explain: (keys) =>
      `the extended text interaction binds the ${field(keys, "cardinality")} response ${field(keys, "identifier")} and writes no max-strings`,
  },
  "XML production": {
    explain: (keys) =>
      `the stored ${field(keys, "production")} ${JSON.stringify(field(keys, "value"))} is outside its XML production`,
  },
} as const satisfies Readonly<Record<string, OracleLaw>>;

/**
 * The kinds that hold a declaration's values: its default and its correct response (information
 * model §5.41, §5.35).
 */
const valueSetKinds: ReadonlySet<string> = new Set(["qti-default-value", "qti-correct-response"]);

/**
 * The outcome names the specification types (§2.2.2.3, Outcomes Variable: "SCORE MUST be a
 * float", "MAXSCORE MUST be a float", "PASSED MUST be a boolean").
 */
const reservedBaseTypes: ReadonlyMap<string, string> = new Map([
  ["MAXSCORE", "float"],
  ["PASSED", "boolean"],
  ["SCORE", "float"],
]);

/**
 * The lexical form of an `xs:double` that PostgreSQL's double precision reads exactly, as grizzle
 * states it (`lexicalForm(pg["double precision"])`): XML Schema's, at most 15 significant digits
 * and an exponent of at most 293, no outer whitespace. A mastery value or a normal bound outside it
 * is not judged, a recorded limit (reading 9).
 */
const doubleForm =
  /^(?:[+-]?(?:0*(?:0|[1-9][0-9]{0,14})(?:\.(?:[0-9]{15}0*|[0-9]{0,14}))?|\.(?:[0-9]{15}0*|[0-9]{1,14}))(?:[eE][+-]?0*(?:0|[1-9][0-9]?|1[0-9]{2}|2[0-8][0-9]|29[0-2]|293))?|-?INF|NaN)$/u;

/**
 * Read a scale attribute as a double for an order that sets aside what it cannot read: its value
 * where it is in {@link doubleForm}, the bound that holds the order otherwise.
 *
 * @param lexical - The attribute's lexical form.
 * @param otherwise - The value an unread form stands as.
 * @returns The value.
 */
const scaleOf = (lexical: string, otherwise: number): number => {
  if (!doubleForm.test(lexical)) {
    return otherwise;
  }

  if (lexical.endsWith("INF")) {
    return lexical.startsWith("-") ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }

  return Number(lexical);
};

/**
 * The normal minimum of an outcome declaration that writes no `normal-minimum`, by its document's
 * version (reading 149): QTI 3.0.1's information model gives it "Default = "0.0"" and says "It is
 * set to 0 by default" (§4.5.8), and its ASI XSD declares it `default="0.0"`. QTI 3.0's §4.5.8 and
 * XSD state no default, so a 3.0.0 declaration that writes none has no normal minimum.
 */
const normalMinimumByDefault: ReadonlyMap<string, string> = new Map([["3.0.1", "0.0"]]);

/**
 * Order two scale values where both are present: `NaN` ordered against nothing, and a form
 * outside {@link doubleForm} read as the bound that holds the order.
 *
 * @param left - The lower value, none where absent.
 * @param right - The upper one.
 * @returns Whether the order holds or is not judged.
 */
const below = (left: Option.Option<string>, right: Option.Option<string>): boolean =>
  Option.isNone(left) ||
  Option.isNone(right) ||
  left.value === "NaN" ||
  right.value === "NaN" ||
  scaleOf(left.value, Number.NEGATIVE_INFINITY) <= scaleOf(right.value, Number.POSITIVE_INFINITY);

/**
 * Judge `Mastery_range` over an outcome declaration's scale (reading 9, the Schematron's RULE
 * SPECIFIC CLASS OUTCOMEDEC 1): its mastery value lies in its normal range, each pair judged where
 * both are present, `NaN` ordered against nothing, a form outside {@link doubleForm} not judged.
 * Its normal minimum is the one it writes, or else its version's default (reading 149,
 * {@link normalMinimumByDefault}).
 *
 * @param rows - The document.
 * @param node - The declaration.
 * @returns The breach, none where the range holds.
 */
const masteryRangeOf = (rows: View, node: Row): readonly Breach[] => {
  const mastery = valueOf(rows, node.id, "mastery-value");
  const low = Option.orElse(valueOf(rows, node.id, "normal-minimum"), () =>
    Option.fromUndefinedOr(normalMinimumByDefault.get(node.version)),
  );
  const high = valueOf(rows, node.id, "normal-maximum");

  return below(low, mastery) && below(mastery, high)
    ? []
    : [
        breachAt(rows, node, "Mastery range", {
          masteryValue: Option.getOrElse(mastery, () => ""),
          normalMaximum: Option.getOrElse(high, () => ""),
          normalMinimum: Option.getOrElse(low, () => ""),
        }),
      ];
};

/**
 * Judge one value set by the O2 laws: `Value_cardinality` over its count and its fields, `Record
 * field key` over its fields' identifiers, and `Typed_value` over each value's text.
 *
 * A value writes a `field-identifier` and a `base-type` both, as a record's field, or neither
 * (§7.46.1, §7.46.2: each "is only used for" a record's field), whatever its declaration's
 * cardinality, and its fields' names are distinct whatever it is; the rest reads the cardinality,
 * so a set of a declaration whose cardinality is unwritten or spells nothing is judged by no more
 * (spec reading 158).
 *
 * @param rows - The document.
 * @param set - The value set.
 * @param cardinality - Its declaration's cardinality, none where it has none.
 * @param baseType - Its declaration's base type, none where it has none.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const valueSetLawsOf = (
  rows: View,
  set: Row,
  cardinality: Option.Option<string>,
  baseType: Option.Option<string>,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const values = elementsOf(rows, set.id);
  const fields = values.filter(({ id }) => Option.isSome(valueOf(rows, id, "field-identifier")));
  const baseTyped = values.filter(({ id }) => Option.isSome(valueOf(rows, id, "base-type")));
  // A record's value is a field, with its field-identifier and its base-type both, and any other
  // variable's value carries neither (§7.46.1, §7.46.2: each is "only used for" a record's field).
  const whole = fields.filter(({ id }) => Option.isSome(valueOf(rows, id, "base-type")));
  const paired = whole.length === fields.length && whole.length === baseTyped.length;
  const counted = Option.match(cardinality, {
    onNone: () => paired,
    onSome: (held) =>
      (held !== "single" || set.elementChildren === 1n) &&
      (held === "record"
        ? BigInt(whole.length) === set.elementChildren
        : fields.length === 0 && baseTyped.length === 0),
  });
  const named = Map.groupBy(
    fields.flatMap((value) =>
      Option.toArray(typedOr(rows, value.id, "field-identifier", "")).map((identifier) => ({
        identifier,
        value,
      })),
    ),
    ({ identifier }) => identifier,
  );

  return [
    ...(counted
      ? []
      : [
          breachAt(rows, set, "Value cardinality", {
            ...Option.match(cardinality, {
              onNone: () => ({}),
              onSome: (held) => ({ cardinality: held }),
            }),
            fields: String(fields.length),
            typed: String(baseTyped.length),
            values: String(set.elementChildren),
          }),
        ]),
    ...[...named].flatMap(([identifier, held]) =>
      held.slice(1).map(({ value }) => breachAt(rows, value, "Record field key", { identifier })),
    ),
    ...values.flatMap((value): readonly Breach[] => {
      if (value.kind !== "qti-value") {
        return [];
      }

      // §7.46: "The base-type is defined by the 'base-type' attribute of the declaration except in
      // the case of variables with record cardinality": a record's value is a field, read in its
      // own base type, and any other value in its declaration's. A type or a cardinality that is
      // unwritten, or outside its domain, types nothing: the declaration's own law or that domain
      // refuses it alone (the ruling of 2026-11-06; lane NIL's audit, B11 and B12; spec reading
      // 158).
      const typed = cardinality.pipe(
        Option.flatMap((held) =>
          held === "record" ? typedValueOf(rows, value.id, "base-type") : baseType,
        ),
      );

      return Option.match(typed, {
        onNone: () => [],
        onSome: (held) =>
          typedValueHolds(grammar, held, value.stringValue)
            ? []
            : [breachAt(rows, value, "Typed value", { baseType: held, text: value.stringValue })],
      });
    }),
  ];
};

/**
 * Judge one declaration element by the O2 laws: its name, where it has one, its typing, where it
 * has a cardinality, each of its value sets and values, and an outcome's scale.
 *
 * @param rows - The document.
 * @param node - The declaration.
 * @param sessionVariables - The built-in session variables, which must not be declared.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const declarationLawsOf = (
  rows: View,
  node: Row,
  sessionVariables: ReadonlySet<string>,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  // A declaration whose identifier or cardinality is unwritten, or whose identifier, cardinality
  // or base type lies outside its value domain, is refused by AL3 ("required-attribute") or that
  // domain ("attribute-lexical") alone: an absent attribute is no empty one, and the laws that read
  // the attribute do not read it, while every other law judges the declaration as any other (lane
  // NIL's audit, B11; spec readings 157 and 158). Each is read as its type reads it, and
  // `base-type` and `cardinality` enumerate a restriction of `xs:string`, whose whiteSpace is
  // `preserve`, so a padded form lies outside its domain.
  const cardinality = typedValueOf(rows, node.id, "cardinality");
  const baseType = typedValueOf(rows, node.id, "base-type");
  const identifier = typedValueOf(rows, node.id, "identifier");
  const keys = {
    ...Option.match(baseType, { onNone: () => ({}), onSome: (held) => ({ baseType: held }) }),
    ...Option.match(identifier, { onNone: () => ({}), onSome: (held) => ({ identifier: held }) }),
    ...Option.match(cardinality, { onNone: () => ({}), onSome: (held) => ({ cardinality: held }) }),
  };
  // A typed name (SCORE, MAXSCORE, PASSED) is no record, its whole value judged by its cardinality
  // alone, where it has one, and has its type where it has a base type; QTI_CONTEXT is declared as
  // the context record. A record has no base type, and every variable of another cardinality
  // writes one (tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3): one that writes none is Declaration
  // base type's (lane NIL's audit, B12), and one that writes a form spelling nothing its value
  // domain's alone.
  const isRecord = cardinality.pipe(Option.map((held) => held === "record"));
  const reservedBroken = Option.exists(identifier, (name) => {
    const reserved = reservedBaseTypes.get(name);

    return (
      (node.kind === "qti-outcome-declaration" &&
        reserved !== undefined &&
        (Option.contains(isRecord, true) ||
          Option.exists(baseType, (held) => held !== reserved))) ||
      (name === "QTI_CONTEXT" &&
        (node.kind !== "qti-context-declaration" || Option.contains(isRecord, false)))
    );
  });
  const writesBaseType = Option.isSome(valueOf(rows, node.id, "base-type"));
  const baseBroken = Option.exists(isRecord, (record) =>
    record ? Option.isSome(baseType) : !writesBaseType,
  );
  const sets = elementsOf(rows, node.id).filter(({ kind }) => valueSetKinds.has(kind));

  return [
    ...Option.toArray(identifier).flatMap((name) =>
      sessionVariables.has(name)
        ? [breachAt(rows, node, "Declaration not reserved", { identifier: name })]
        : [],
    ),
    ...(reservedBroken ? [breachAt(rows, node, "Reserved type", keys)] : []),
    ...(baseBroken ? [breachAt(rows, node, "Declaration base type", keys)] : []),
    ...sets.flatMap((set) => valueSetLawsOf(rows, set, cardinality, baseType, grammar)),
    ...(node.kind === "qti-outcome-declaration" ? masteryRangeOf(rows, node) : []),
  ];
};

/**
 * Judge the interaction laws the oracle declares here over an item: `Adaptive feedback`, an
 * interaction of a non-adaptive item that binds a response variable stands under no feedback
 * element (§5.49, §5.52), and `Max strings required`, an extended text interaction bound to a
 * multiple or ordered response writes `max-strings` (§5.48.6).
 *
 * @param rows - The document, an item's rows merged with what it includes.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const interactionLawsOf = (rows: View, grammar: ComposedGrammar): readonly Breach[] => {
  const root = Option.getOrUndefined(rows.root);
  if (root?.kind !== "qti-assessment-item") {
    return [];
  }

  const interactions = new Set(grammar.kinds.interaction.rows.map(({ kind }) => kind));
  const feedback = rowOf(grammar.ancestry.enters, "qti-feedback-block");
  const adaptive = Option.contains(
    Option.flatMap(valueOf(rows, root.id, "adaptive"), booleanOf),
    true,
  );
  const declared = new Map(
    rows.members.flatMap((node) =>
      grammar.references.declarationKind.has(node.kind)
        ? Option.toArray(typedValueOf(rows, node.id, "identifier")).map(
            (identifier) => [identifier, node] as const,
          )
        : [],
    ),
  );

  return rows.members.flatMap((node): readonly Breach[] => {
    if (!interactions.has(node.kind)) {
      return [];
    }

    return Option.toArray(typedValueOf(rows, node.id, "response-identifier")).flatMap(
      (identifier) => {
        const declaration = declared.get(identifier);
        // The cardinality as its type reads it, which max-strings judges only where it is a
        // container (the orchestrator's ruling of 2026-11-06: an absent attribute is no empty one).
        const cardinality =
          declaration === undefined
            ? ""
            : Option.getOrElse(typedValueOf(rows, declaration.id, "cardinality"), () => "");
        const inFeedback = [...step(grammar.ancestry, node.parentAncestry, node.kind)].some(
          (flag) => feedback.has(flag),
        );

        return [
          ...(!adaptive && inFeedback
            ? [breachAt(rows, node, "Adaptive feedback", { identifier })]
            : []),
          ...(node.kind === "qti-extended-text-interaction" &&
          declaration?.kind === "qti-response-declaration" &&
          (cardinality === "multiple" || cardinality === "ordered") &&
          Option.isNone(valueOf(rows, node.id, "max-strings"))
            ? [breachAt(rows, node, "Max strings required", { cardinality, identifier })]
            : []),
        ];
      },
    );
  });
};

/**
 * XML 1.0's `Char` (§2.2), as a class body.
 */
const xmlChar = "\\t\\n\\r\\u{20}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * `Char` but the hyphen, a comment's characters between hyphens.
 */
const charNoDash =
  "\\t\\n\\r\\u{20}-\\u{2C}\\u{2E}-\\u{D7FF}\\u{E000}-\\u{FFFD}\\u{10000}-\\u{10FFFF}";

/**
 * Each stored text's XML production, as the schema's text types state it
 * (`#pantry/qti/chardata.ts`, `#pantry/qti/attributes.ts`): XML 1.0 §2.2 `Char*` for a text, a
 * whitespace run and an attribute's lexical form; §2.5 a comment's text, no `--` and no final `-`;
 * §2.6 a processing instruction's target, an NCName but `xml` in any case, and its data, no `?>`
 * and no leading space; §2.8 a doctype's text; §4.3.3 an encoding name, where a declaration writes
 * one; §2.8 a version number, where a document writes a declaration; Namespaces in XML 1.0 §3 an
 * entity's name, an NCName.
 */
const productions = {
  char: new RegExp(`^[${xmlChar}]*$`, "u"),
  comment: new RegExp(`^(?:[${charNoDash}]|-[${charNoDash}])*$`, "u"),
  doctype: new RegExp(`^<!DOCTYPE[ \\t\\n\\r][${xmlChar}]*>$`, "u"),
  encoding: /^[A-Za-z][A-Za-z0-9._-]*$/u,
  piData: new RegExp(`^(?:(?!\\?>)[^\\t\\n\\r ](?:(?!\\?>)[${xmlChar}])*)?$`, "u"),
  version: /^1\.[0-9]+$/u,
} as const;

/**
 * Judge `XML production` over a document's stored texts: each in its production, which crust's
 * reader refuses any text outside, so rows the folds did not write are the only ones that break it.
 *
 * @param rows - The document.
 * @returns The breaches.
 */
const productionLawsOf = (rows: View): readonly Breach[] => {
  const { rows: folded } = rows;
  const at = (node: NodeId, production: string, value: string): readonly Breach[] => {
    const held = rows.byId.get(node);

    return held === undefined
      ? []
      : [breachAt(rows, held, "XML production", { production, value })];
  };
  const checked = (
    node: NodeId,
    production: string,
    pattern: RegExp,
    value: string,
  ): readonly Breach[] => (pattern.test(value) ? [] : at(node, production, value));

  return [
    ...[...folded.texts, ...folded.whitespace].flatMap(({ node, value }) =>
      checked(node, "text", productions.char, value),
    ),
    ...folded.attributes.flatMap(({ lexical, node }) =>
      checked(node, "attribute value", productions.char, lexical),
    ),
    ...folded.comments.flatMap(({ node, value }) =>
      checked(node, "comment", productions.comment, value),
    ),
    ...folded.doctypes.flatMap(({ node, value }) =>
      checked(node, "doctype", productions.doctype, value),
    ),
    ...folded.pis.flatMap(({ data, node, target }) => [
      ...(ncNameForm.test(target) && !/^xml$/iu.test(target)
        ? []
        : at(node, "processing instruction target", target)),
      ...checked(node, "processing instruction data", productions.piData, data),
    ]),
    ...folded.entityRefs.flatMap(({ name, node }) =>
      ncNameForm.test(name) ? [] : at(node, "entity name", name),
    ),
    ...folded.xmlDecls.flatMap(({ node, version }) =>
      checked(node, "version", productions.version, version),
    ),
    ...folded.encodingDecls.flatMap(({ encoding, node }) =>
      checked(node, "encoding", productions.encoding, encoding),
    ),
  ];
};

/**
 * Judge one folded document by the laws of this module it states alone: the declarations, the
 * interaction laws the oracle declares here, and the usage statistics' dates.
 *
 * @param rows - The document.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
export const documentDocumentBreaches = (
  rows: View,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const sessionVariables = new Set(
    grammar.references.builtIn.rows
      .filter(({ declaration }) => declaration !== "qti-context-declaration")
      .map(({ variable }) => variable),
  );

  return [
    ...rows.members.flatMap((node) =>
      grammar.references.declarationKind.has(node.kind)
        ? declarationLawsOf(rows, node, sessionVariables, grammar)
        : [],
    ),
    ...interactionLawsOf(rows, grammar),
    ...productionLawsOf(rows),
  ];
};

/**
 * The resource types whose LOM record names its document by identifier and title (QTI 3.0 Metadata
 * §2.7.1; reading 62): an item's and a test's, as the implementation guide's LOM profile says "the
 * test or item identifier should be present as an identifier in the LOM metadata", a
 * recommendation the operator rules binding.
 */
export const lomNamedTypes: ReadonlySet<string> = new Set([
  "imsqti_item_xmlv3p0",
  "imsqti_test_xmlv3p0",
]);

/**
 * The roots of an assessment object, "the associated item, test or object bank" whose identifier a
 * record's entry matches and whose title its string matches (QTI 3.0 Metadata §2.7.1.1 and
 * §2.7.1.2): an item's and a test's. The object is the document the record's resource names
 * (reading 93), whatever type the resource is listed under, which `RootOfType` judges on its own;
 * a document of any other root is no object, so no entry and no title string matches it.
 */
export const objectRoots: ReadonlySet<string> = new Set([
  "qti-assessment-item",
  "qti-assessment-test",
]);

/**
 * Read a title as `xs:normalizedString`'s value space reads it: each tab, line feed and carriage
 * return a space (XML Schema 1.0 Part 2, §4.3.6, whiteSpace `replace`).
 *
 * @param text - The text.
 * @returns Its value.
 */
const replaced = (text: string): string => text.replaceAll(/[\t\n\r]/gu, " ");

/**
 * Fold a language tag's ASCII capitals to small letters (RFC 5646 §2.1.1).
 *
 * @param tag - The tag.
 * @returns The folded tag.
 */
const folded = (tag: string): string =>
  tag.replaceAll(/[A-Z]/gu, (capital) => capital.toLowerCase());

/**
 * Read a language as `lom-title` compares it: its tag folded, or none where it states none. The
 * empty text states none, "just as if xml:lang had not been specified" (XML 1.0 §2.12), and a LOM
 * string's empty `language` is read alike.
 *
 * @param form - The language's form, none where none is read.
 * @returns The folded tag, none where it states no language.
 */
const statedLanguage = (form: Option.Option<string>): Option.Option<string> =>
  form.pipe(
    Option.map(folded),
    Option.filter((tag) => tag !== ""),
  );

/**
 * Judge `lom-title` over a package (QTI 3.0 Metadata §2.7.1.2): every record of an item's or a
 * test's resource, a `lom:lom` of the resource's own `cp:metadata` (spec reading 62; a `cp:file`'s
 * record describes the file: "The scope of Metadata is the parent container class only", IMS
 * Content Packaging 1.2 §6.7), whose general category has a title holds a title string whose value
 * is its object's `title`, in the object's language: a string whose `language` is the root's
 * `xml:lang`, without regard to case, or one with no `language`, or any string where the root
 * states no language. The root's language is its `xml:lang`'s value as its type reads it, and it
 * states none where it writes none, where the value is empty (XML 1.0 §2.12), and where AL1
 * refuses the attribute, outside its value domain or on a root that does not admit it, so that no
 * value is read (spec reading 151): the title is then judged without a language. The object is the
 * document the resource's href names where its root is an item or a test ({@link objectRoots}),
 * whatever the resource's type; a document of another root is no object, and a record with a
 * title breaks the law; so does one whose object writes no `title`, which no string matches.
 *
 * @param input - The package.
 * @returns The breaches, each at the record.
 */
const lomTitleLawsOf = (input: PackageRows): readonly Breach[] => {
  const { manifest } = input;

  return manifest.members.flatMap((resource): readonly Breach[] => {
    if (resource.kind !== "cp:resource") {
      return [];
    }

    const type = Option.getOrElse(typedValueOf(manifest, resource.id, "type"), () => "");
    const href = valueOf(manifest, resource.id, "href");
    const document = input.documents.find((listed) =>
      Option.exists(href, (written) => listed.path === written.replace(/[?#].*$/su, "")),
    );
    const root = document === undefined ? undefined : Option.getOrUndefined(document.rows.root);
    if (!lomNamedTypes.has(type) || document === undefined || root === undefined) {
      return [];
    }

    // The object's title and language; a root of no object has neither, and no string names it.
    // A root that writes no `title` has no value for a string to match (QTI 3.0 Metadata
    // §2.7.1.2: "The title must have a value that matches the value of the title attribute of the
    // associated item, test or object bank"), so no string names it either. An `xml:lang` AL1
    // refuses has no value to read, so it states no language, as an unwritten one states none
    // (spec reading 151).
    const object = objectRoots.has(root.kind);
    const title = Option.map(valueOf(document.rows, root.id, "title"), replaced);
    const lang = statedLanguage(typedValueOf(document.rows, root.id, "xml:lang"));

    return manifest.members
      .filter((lom) => {
        const [metadata, owner] = ancestorsOf(manifest, lom);

        return (
          lom.kind === "lom:lom" &&
          metadata?.kind === "cp:metadata.resource" &&
          owner?.id === resource.id
        );
      })
      .flatMap((lom): readonly Breach[] => {
        const strings = manifest.members.filter((string) => {
          const [titleNode, general] = ancestorsOf(manifest, string);

          return (
            string.kind === "lom:string" &&
            titleNode?.kind === "lom:title" &&
            general?.kind === "lom:general" &&
            ancestorsOf(manifest, general).some(({ id }) => id === lom.id)
          );
        });
        const titles = manifest.members.filter(
          (held) =>
            held.kind === "lom:title" &&
            ancestorsOf(manifest, held)[0]?.kind === "lom:general" &&
            ancestorsOf(manifest, held).some(({ id }) => id === lom.id),
        );
        const names = strings.some((string) => {
          const language = statedLanguage(valueOf(manifest, string.id, "language"));

          return (
            object &&
            Option.exists(title, (value) => value === replaced(string.stringValue)) &&
            (Option.isNone(lang) || Option.isNone(language) || language.value === lang.value)
          );
        });

        return titles.length === 0 || names
          ? []
          : [
              breachAt(manifest, lom, "LomObjectTitle", {
                strings: JSON.stringify(strings.map(({ stringValue }) => stringValue)),
                ...Option.match(title, {
                  onNone: () => ({}),
                  onSome: (value) => ({ title: value }),
                }),
              }),
            ];
      });
  });
};

/**
 * Judge `Dependency target` over a manifest (IMS Content Packaging 1.2): every dependency's
 * `identifierref` names a resource of its manifest, compared collapsed.
 *
 * @param manifest - The manifest.
 * @returns The breaches.
 */
const dependencyLawsOf = (manifest: View): readonly Breach[] => {
  const resources = new Set(
    manifest.members.flatMap((node) =>
      node.kind === "cp:resource"
        ? Option.toArray(typedValueOf(manifest, node.id, "identifier"))
        : [],
    ),
  );

  return manifest.members.flatMap((node) =>
    node.kind === "cp:dependency"
      ? Option.toArray(typedValueOf(manifest, node.id, "identifierref"))
          .filter((identifier) => !resources.has(identifier))
          .map((identifier) => breachAt(manifest, node, "Dependency target", { identifier }))
      : [],
  );
};

/**
 * Judge a package by the laws of this module over more than one document: the LOM title and the
 * manifest's dependencies.
 *
 * @param input - The package.
 * @param _grammar - The composed grammar.
 * @returns The breaches.
 */
export const documentPackageBreaches = (
  input: PackageRows,
  _grammar: ComposedGrammar,
): readonly Breach[] => [...lomTitleLawsOf(input), ...dependencyLawsOf(input.manifest)];
