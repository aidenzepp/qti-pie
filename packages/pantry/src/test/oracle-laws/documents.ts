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
 * - **The laws the oracle declares here** ({@link addedLawNames}): `Adaptive feedback` (§5.49,
 *   §5.52), `Max strings required` (§5.48.6), `Dependency target` (IMS Content Packaging 1.2) and
 *   `XML production` (XML 1.0's productions over the stored texts), each with the schema's rule and
 *   source (`#pantry/import/refusal.ts` `lawTable`), word for word.
 */
import { Option } from "effect";
import { rowOf, step } from "#pantry/grammar/ancestry.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import {
  ancestorsOf,
  breachAt,
  collapsedOf,
  elementsOf,
  valueOf,
} from "#pantry/test/oracle-laws/rows.ts";
import type { LawBreach, PackageRows, Row, Rows } from "#pantry/test/oracle-laws/rows.ts";
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
 * The laws the schema states (`#pantry/import/refusal.ts` `lawTable`) that the law oracle had not
 * declared, which this module declares and produces: each joins the oracle's `LawName`, its rule
 * its `oracleRules`, and its rule, source and explanation the oracle's tables, through
 * `#pantry/test/oracle-laws.ts`.
 */
export const addedLawNames = [
  "Adaptive feedback",
  "Dependency target",
  "Max strings required",
  "XML production",
] as const;

/**
 * A law of {@link addedLawNames}.
 */
export type AddedLaw = (typeof addedLawNames)[number];

/**
 * The rules {@link addedLawNames} name that the oracle's `oracleRules` did not hold.
 */
export const addedRules = ["adaptive-feedback", "max-strings-required"] as const;

/**
 * The rule each added law's refusal is named by, the schema's (`lawTable`).
 */
export const addedLawRules = {
  "Adaptive feedback": "adaptive-feedback",
  "Dependency target": "idref-target",
  "Max strings required": "max-strings-required",
  "XML production": "well-formedness",
} as const satisfies Readonly<Record<AddedLaw, string>>;

/**
 * The source each added law states, the schema's (`lawTable`), word for word.
 */
export const addedLawSources = {
  "Adaptive feedback":
    "https://www.imsglobal.org/spec/qti/v3p0/info#Data_FeedbackBlock (§5.49, FeedbackBlock, and §5.52, FeedbackInline: 'A feedback element that forms part of a Non-adaptive Item must not contain an interaction object, either directly or indirectly'), plan §1.7 O3 (Q5.09): a non-adaptive item binds no response variable whose interaction stands inside feedback, select(BoundVariable, response, adaptive = false) contained in the interactions outside every feedback flag",
  "Dependency target":
    'IMS Content Packaging 1.2: a dependency\'s identifierref names a resource of its manifest, contained(on(Dependency, "package", "ref"), on(Resource, "package", "identifier")) (Q5.06)',
  "Max strings required":
    "https://www.imsglobal.org/spec/qti/v3p0/info#DataCharacteristic_ExtendedTextInteraction.Attr_max-strings (§5.48.6: 'The max-strings characteristic is required when the interaction is bound to a response variable that is a container'): an extended text interaction bound to a multiple or ordered response writes max-strings, select(BindingDeclaration, response-identifier, extended text, multiple or ordered)(node, kind) contained in select(CountBound, maxWritten)(node, kind) (interactions.ts, Q5.09)",
  "XML production":
    "XML 1.0 §2.2 Char, §2.5 Comment, §2.6 PI, §2.8 doctypedecl and VersionNum, §4.3.3 EncName, and Namespaces in XML 1.0 §3 NCName: a stored text outside its production is no well-formed XML, which crust's reader refuses before any row exists, so only an importer defect reaches the law",
} as const satisfies Readonly<Record<AddedLaw, string>>;

/**
 * Read one key field of a breach.
 *
 * @param keys - The breach's keys.
 * @param name - The field's name.
 * @returns Its text, empty when the keys do not hold it.
 */
const field = (keys: Readonly<Record<string, string>>, name: string): string => keys[name] ?? "";

/**
 * Explain a breach of each added law from its keys.
 */
export const addedExplainers = {
  "Adaptive feedback": (keys: Readonly<Record<string, string>>) =>
    `${field(keys, "kind")} binds ${field(keys, "identifier")} inside feedback, which a non-adaptive item's feedback may not hold`,
  "Dependency target": (keys: Readonly<Record<string, string>>) =>
    `a dependency names ${field(keys, "identifier")}, which no resource of its manifest is`,
  "Max strings required": (keys: Readonly<Record<string, string>>) =>
    `the extended text interaction binds the ${field(keys, "cardinality")} response ${field(keys, "identifier")} and writes no max-strings`,
  "XML production": (keys: Readonly<Record<string, string>>) =>
    `the stored ${field(keys, "production")} ${JSON.stringify(field(keys, "value"))} is outside its XML production`,
} as const satisfies Readonly<
  Record<AddedLaw, (keys: Readonly<Record<string, string>>, grammar: ComposedGrammar) => string>
>;

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
 * Order two scale attributes where both are written: `NaN` ordered against nothing, and a form
 * outside {@link doubleForm} read as the bound that holds the order.
 *
 * @param left - The lower attribute, none where unwritten.
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
 * both are written, `NaN` ordered against nothing, a form outside {@link doubleForm} not judged.
 *
 * @param rows - The document.
 * @param node - The declaration.
 * @returns The breach, none where the range holds.
 */
const masteryRangeOf = (rows: Rows, node: Row): readonly Breach[] => {
  const mastery = valueOf(rows, node.id, "mastery-value");
  const low = valueOf(rows, node.id, "normal-minimum");
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
 * @param rows - The document.
 * @param set - The value set.
 * @param cardinality - Its declaration's cardinality.
 * @param baseType - Its declaration's base type, `none` where it writes none.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const valueSetLawsOf = (
  rows: Rows,
  set: Row,
  cardinality: string,
  baseType: string,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const values = elementsOf(rows, set.id);
  const fields = values.filter(({ id }) => Option.isSome(valueOf(rows, id, "field-identifier")));
  const counted =
    (cardinality !== "single" || set.elementChildren === 1n) &&
    (cardinality === "record"
      ? BigInt(fields.length) === set.elementChildren
      : fields.length === 0);
  const named = Map.groupBy(fields, ({ id }) =>
    Option.getOrElse(collapsedOf(rows, id, "field-identifier"), () => ""),
  );

  return [
    ...(counted
      ? []
      : [
          breachAt(rows, set, "Value cardinality", {
            cardinality,
            fields: String(fields.length),
            values: String(set.elementChildren),
          }),
        ]),
    ...[...named].flatMap(([identifier, held]) =>
      held.slice(1).map((value) => breachAt(rows, value, "Record field key", { identifier })),
    ),
    ...values.flatMap((value): readonly Breach[] => {
      if (value.kind !== "qti-value") {
        return [];
      }

      const typed =
        baseType === "none"
          ? Option.getOrElse(collapsedOf(rows, value.id, "base-type"), () => "none")
          : baseType;

      return typedValueHolds(grammar, typed, value.stringValue)
        ? []
        : [breachAt(rows, value, "Typed value", { baseType: typed, text: value.stringValue })];
    }),
  ];
};

/**
 * Judge one declaration element by the O2 laws: its identifier, its typing, and each of its value
 * sets and values.
 *
 * @param rows - The document.
 * @param node - The declaration.
 * @param sessionVariables - The built-in session variables, which must not be declared.
 * @param grammar - The composed grammar.
 * @returns The breaches.
 */
const declarationLawsOf = (
  rows: Rows,
  node: Row,
  sessionVariables: ReadonlySet<string>,
  grammar: ComposedGrammar,
): readonly Breach[] => {
  const written = {
    cardinality: collapsedOf(rows, node.id, "cardinality"),
    identifier: collapsedOf(rows, node.id, "identifier"),
  };
  // A declaration that writes no identifier or no cardinality is refused by AL3
  // ("required-attribute") alone: an absent attribute is no empty one, and these laws do not read
  // the `single` the schema holds an unwritten cardinality as.
  if (Option.isNone(written.identifier) || Option.isNone(written.cardinality)) {
    return [];
  }

  const identifier = written.identifier.value;
  const cardinality = written.cardinality.value;
  const baseType = Option.getOrElse(collapsedOf(rows, node.id, "base-type"), () => "none");
  const keys = { baseType, cardinality, identifier };
  const reserved = reservedBaseTypes.get(identifier);
  const reservedBroken =
    (node.kind === "qti-outcome-declaration" && reserved !== undefined && baseType !== reserved) ||
    (identifier === "QTI_CONTEXT" &&
      (node.kind !== "qti-context-declaration" || cardinality !== "record"));
  const baseBroken = (cardinality === "record") !== (baseType === "none");
  const sets = elementsOf(rows, node.id).filter(({ kind }) => valueSetKinds.has(kind));

  return [
    ...(sessionVariables.has(identifier)
      ? [breachAt(rows, node, "Declaration not reserved", { identifier })]
      : []),
    ...(reservedBroken ? [breachAt(rows, node, "Reserved type", keys)] : []),
    ...(baseBroken ? [breachAt(rows, node, "Declaration base type", keys)] : []),
    ...sets.flatMap((set) => valueSetLawsOf(rows, set, cardinality, baseType, grammar)),
    ...(node.kind === "qti-outcome-declaration" ? masteryRangeOf(rows, node) : []),
  ];
};

/**
 * An `xs:boolean` lexical form that is true, its whitespace collapsed: `true` or `1`.
 */
const truePattern = /^[\t\n\r ]*(?:true|1)[\t\n\r ]*$/u;

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
const interactionLawsOf = (rows: Rows, grammar: ComposedGrammar): readonly Breach[] => {
  const root = Option.getOrUndefined(rows.root);
  if (root?.kind !== "qti-assessment-item") {
    return [];
  }

  const interactions = new Set(grammar.kinds.interaction.rows.map(({ kind }) => kind));
  const feedback = rowOf(grammar.ancestry.enters, "qti-feedback-block");
  const adaptive = Option.exists(valueOf(rows, root.id, "adaptive"), (lexical) =>
    truePattern.test(lexical),
  );
  const declared = new Map(
    rows.members.flatMap((node) =>
      grammar.references.declarationKind.has(node.kind)
        ? Option.toArray(collapsedOf(rows, node.id, "identifier")).map(
            (identifier) => [identifier, node] as const,
          )
        : [],
    ),
  );

  return rows.members.flatMap((node): readonly Breach[] => {
    if (!interactions.has(node.kind)) {
      return [];
    }

    return Option.toArray(collapsedOf(rows, node.id, "response-identifier")).flatMap(
      (identifier) => {
        const declaration = declared.get(identifier);
        // The cardinality as written, which max-strings judges only where it spells a container
        // (the orchestrator's ruling of 2026-11-06: an absent attribute is no empty one).
        const cardinality =
          declaration === undefined
            ? ""
            : Option.getOrElse(valueOf(rows, declaration.id, "cardinality"), () => "");
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
 * and no leading space; §2.8 a doctype's text; §4.3.3 an encoding name; §2.8 a version number;
 * Namespaces in XML 1.0 §3 an entity's name, an NCName.
 */
const productions = {
  char: new RegExp(`^[${xmlChar}]*$`, "u"),
  comment: new RegExp(`^(?:[${charNoDash}]|-[${charNoDash}])*$`, "u"),
  doctype: new RegExp(`^<!DOCTYPE[ \\t\\n\\r][${xmlChar}]*>$`, "u"),
  encoding: /^(?:[A-Za-z][A-Za-z0-9._-]*)?$/u,
  piData: new RegExp(`^(?:(?!\\?>)[^\\t\\n\\r ](?:(?!\\?>)[${xmlChar}])*)?$`, "u"),
  version: /^(?:none|1\.[0-9]+)$/u,
} as const;

/**
 * Judge `XML production` over a document's stored texts: each in its production, which crust's
 * reader refuses any text outside, so rows the folds did not write are the only ones that break it.
 *
 * @param rows - The document.
 * @returns The breaches.
 */
const productionLawsOf = (rows: Rows): readonly Breach[] => {
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
    ...checked(folded.document.node, "encoding", productions.encoding, folded.document.encoding),
    ...checked(folded.document.node, "version", productions.version, folded.document.xmlVersion),
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
  rows: Rows,
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
 * The resource types whose documents a LOM record names by identifier and title (QTI 3.0 Metadata
 * §2.7.1): an item's and a test's.
 */
const namedTypes: ReadonlyMap<string, string> = new Map([
  ["imsqti_item_xmlv3p0", "qti-assessment-item"],
  ["imsqti_test_xmlv3p0", "qti-assessment-test"],
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
 * Judge `lom-title` over a package (QTI 3.0 Metadata §2.7.1.2): every record of an item's or a
 * test's resource, a `lom:lom` of the resource's own `cp:metadata` (spec reading 62; a `cp:file`'s
 * record describes the file: "The scope of Metadata is the parent container class only", IMS
 * Content Packaging 1.2 §6.7), whose general category has a title holds a title string whose value
 * is the
 * document's `title`, in the document's language: a string whose `language` is the root's
 * `xml:lang`, without regard to case, or one with no `language`, or any string where the root
 * states no `xml:lang` (an empty or blank one states none, XML 1.0 §2.12).
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

    const type = Option.getOrElse(collapsedOf(manifest, resource.id, "type"), () => "");
    const rootKind = namedTypes.get(type);
    const href = valueOf(manifest, resource.id, "href");
    const document = input.documents.find(
      (listed) =>
        Option.exists(href, (written) => listed.path === written.replace(/[?#].*$/su, "")) &&
        Option.exists(listed.rows.root, ({ kind }) => kind === rootKind),
    );
    const root = document === undefined ? undefined : Option.getOrUndefined(document.rows.root);
    if (document === undefined || root === undefined) {
      return [];
    }

    const title = replaced(Option.getOrElse(valueOf(document.rows, root.id, "title"), () => ""));
    const lang = folded(
      Option.getOrElse(collapsedOf(document.rows, root.id, "xml:lang"), () => ""),
    );

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
          const language = folded(
            Option.getOrElse(valueOf(manifest, string.id, "language"), () => ""),
          );

          return (
            replaced(string.stringValue) === title &&
            (lang === "" || language === "" || language === lang)
          );
        });

        return titles.length === 0 || names
          ? []
          : [
              breachAt(manifest, lom, "LomObjectTitle", {
                strings: JSON.stringify(strings.map(({ stringValue }) => stringValue)),
                title,
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
const dependencyLawsOf = (manifest: Rows): readonly Breach[] => {
  const resources = new Set(
    manifest.members.flatMap((node) =>
      node.kind === "cp:resource"
        ? Option.toArray(collapsedOf(manifest, node.id, "identifier"))
        : [],
    ),
  );

  return manifest.members.flatMap((node) =>
    node.kind === "cp:dependency"
      ? Option.toArray(collapsedOf(manifest, node.id, "identifierref"))
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
