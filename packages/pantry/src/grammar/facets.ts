/**
 * Each vocabulary's share of the grammar: the facts the generators read about a vocabulary's kinds,
 * stated as data and kept out of the generators, so that every generator is a function of the
 * vocabulary list it composes (plan §1.1, R4 of the W1 to W4 review).
 *
 * A vocabulary's facets are its interactions; its ancestry blocks; its content-model edits, count
 * laws and namespace roots; its barrings and last-slot rules; its expression arities and response
 * bindings; its package relations; and its references. Each fact belongs to the vocabulary of the
 * parent kind it is stated under, or of the kind it is about. A vocabulary with no fact of a facet
 * states it empty, so every vocabulary states every facet.
 *
 * A class a law reads is projected from the XSDs' IR (the content models and attribute declarations
 * of `src/vocab/inventory/`), never listed by hand: the interactions, the expression kinds and
 * their arities, the resource types and the references. What the XSDs do not state is a spec
 * reading, stated here with its source.
 */
import { Array as Arr, Option, pipe } from "effect";
import type { AncestryFacet, Block } from "#pantry/grammar/ancestry.ts";
import type { ChildFacet } from "#pantry/grammar/children.ts";
import type { ContentFacet, ModelEdit } from "#pantry/grammar/content.ts";
import { aritiesOf } from "#pantry/grammar/expression.ts";
import type { ExpressionFacet } from "#pantry/grammar/expression.ts";
import { fragmentRootsOf, fragmentType, includeAlternativesOf } from "#pantry/grammar/include.ts";
import { foreignKinds, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { PackageFacet, RootOf } from "#pantry/grammar/package.ts";
import {
  asiReferences,
  mathmlReferences,
  noReferences,
  ssmlReferences,
  xiReferences,
} from "#pantry/grammar/references.ts";
import type { ReferenceFacet } from "#pantry/grammar/references.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
import { vocabularies as rosters } from "#pantry/vocab/inventory/vocabularies.ts";
import type {
  AttributeDeclaration,
  ContentModel,
  Particle,
  Source,
  Sources,
} from "#pantry/vocab/inventory/types.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * Everything the generators read about one vocabulary.
 */
export interface Facets {
  readonly ancestry: AncestryFacet;
  readonly children: ChildFacet;
  readonly content: ContentFacet;
  readonly expression: ExpressionFacet;
  /**
   * The vocabulary's interaction kinds: the `Interaction` set's rows. Each enters `int` and carries
   * the interaction bans.
   */
  readonly interactions: readonly string[];
  readonly package: PackageFacet;
  readonly references: ReferenceFacet;
}

/**
 * The facets of a vocabulary that states none.
 */
export const noFacets: Facets = {
  ancestry: { banning: [], entering: [], needing: [] },
  children: { barrings: [], lastWhere: [] },
  content: { edits: [], models: [], roots: [] },
  expression: { arities: [], recordFits: [], typedFits: [] },
  interactions: [],
  package: { resourceTypes: [], roots: [] },
  references: noReferences,
};

/**
 * Where a model no XSD states comes from, in each schema version: the specification it reads.
 *
 * @param cite - The specification, its section included.
 * @returns The source, once per version.
 */
const cited = (cite: string): Sources =>
  pipe(
    schemaVersions,
    Arr.map((): Source => ({ _tag: "spec", cite })),
  );

/**
 * The document node's source: XML's document production, as review R5 reads it.
 */
const documentSource = cited("XML 1.0 §2.1 document, read by review R5");

/**
 * The foreign kinds' source: the ur-type every undeclared element is assessed laxly against.
 */
const foreignSource = cited("XML Schema 1.0 Part 1 §3.4.7 xs:anyType");

/**
 * One element particle of the document node's model, occurring between its bounds.
 *
 * @param kinds - The kinds it names.
 * @param min - Its least count.
 * @param max - Its greatest count, none for unbounded.
 * @returns The particle.
 */
const particle = (
  kinds: readonly [string, ...string[]],
  min: number,
  max: Option.Option<number>,
): Particle => ({
  _tag: "element",
  kinds,
  occurs: { max, min },
  sources: documentSource,
});

/**
 * The template block kinds, of an item's body and of its rubric block's content: the kinds under
 * which no interaction sits at any depth (spec reading 143). The information model says "A
 * qti-template-block must not contain any interactions, either directly or indirectly" (§5.145,
 * TemplateBlock, in both versions), stricter than the class tables and the XSD, which reach an
 * interaction through the HTML of its content body. It says no such thing of a template inline,
 * whose own content holds no interaction (§5.155 and §6.27, InlineStaticGroup; the XSD's
 * `TemplateInlineDType`), which the content model refuses, and whose HTML may hold one (§5.64,
 * HTMLText, of `inlineGroup`, §6.26), as the XSD's `HTMLTextDType` does.
 */
const templateBlockKinds = ["qti-template-block", "qti-template-block.rubric"] as const;

/**
 * The template kinds, block and inline, each of an item's body and of its rubric block's content.
 */
const templateKinds = [
  ...templateBlockKinds,
  "qti-template-inline",
  "qti-template-inline.rubric",
] as const;

/**
 * The attribute every interaction declares and no other kind does: the response variable it is
 * bound to (information model, the `Interaction` class's `responseIdentifier`). The ASI XSDs
 * declare `response-identifier`, required, on exactly the 22 interaction kinds.
 */
const interactionAttribute = "response-identifier";

/**
 * Read the interaction kinds from the attribute declarations: every kind that declares
 * {@link interactionAttribute}, once, in declaration order.
 *
 * @param declarations - The attribute declarations.
 * @returns The interactions.
 */
const interactionsIn = (declarations: readonly AttributeDeclaration[]): readonly string[] => [
  ...new Set(
    declarations.filter(({ name }) => name === interactionAttribute).map(({ kind }) => kind),
  ),
];

/**
 * The operator whose operands are every expression: `qti-and` takes one or more sub-expressions
 * of any kind (information model, `And`), so the kinds its content model names are the expression
 * kinds, the 64 `OperatorArity` holds.
 */
const anyExpression = "qti-and";

/**
 * Read the expression kinds from the content models: the kinds {@link anyExpression}'s model names.
 *
 * @param models - The content-model IR.
 * @returns The expression kinds.
 */
const expressionsIn = (models: readonly ContentModel[]): ReadonlySet<string> => {
  const named = (node: Particle): readonly string[] => {
    switch (node._tag) {
      case "element": {
        return node.kinds;
      }
      case "any": {
        return [];
      }
      case "group": {
        return node.particles.flatMap(named);
      }
      default: {
        return node satisfies never;
      }
    }
  };

  return new Set(
    models
      .filter(({ kind }) => kind === anyExpression)
      .flatMap(({ content }) =>
        content._tag === "element-only" || content._tag === "mixed" ? named(content.particle) : [],
      ),
  );
};

/**
 * The resource the content package's `type` attribute is declared on.
 */
const resourceType = { kind: "cp:resource", name: "type" } as const;

/**
 * Read the resource types from the attribute declarations: the enumeration of `cp:resource`'s
 * `type` in either version's content-packaging XSD (3.0.0 lists 19 and 3.0.1 lists 20, sharing
 * 18), each once, in the order the versions first list them, which is the `ResourceType` roster's
 * code order. Which version admits which is the attribute's value domain's (spec reading 67).
 *
 * @param declarations - The attribute declarations.
 * @returns The types.
 */
const resourceTypesIn = (declarations: readonly AttributeDeclaration[]): readonly string[] => [
  ...new Set(
    declarations.flatMap(({ domain, kind, name }) =>
      kind === resourceType.kind && name === resourceType.name && domain._tag === "atomic"
        ? domain.facets.flatMap(({ facet, value }) => (facet === "enumeration" ? [value] : []))
        : [],
    ),
  ),
];

/**
 * Where `qti-ordering`'s restated model comes from: spec reading 61
 * (`aidenzepp/qti-pie`, 8e573eca), which the information model's §5.98.3 states and the XSD's own
 * mapping of the same sentence elsewhere writes.
 */
const orderingSource =
  "spec reading 61: information model §5.98.3, 'may be new tags and reused QTI ASI tags', as the XSD writes the same sentence at §5.36.2 and §5.144.1 (##any)";

/**
 * `qti-ordering`'s content, as spec reading 61 restates it: any number of elements
 * of any namespace, assessed laxly, `sequence(any ##any lax 0..n)`.
 *
 * The XSD writes `##other` (`imsqti_asiv3p0p1_v1p0.xsd` lines 29976 and 24031), which refuses an
 * element in QTI's own namespace or in none. The information model says the extension's child tags
 * "may be new tags and reused QTI ASI tags" (§5.98.3, `info.txt` line 36355), and the XSD's own
 * mapping of that sentence elsewhere is `##any`: the custom interaction's (§5.36.2, line 22937, XSD
 * line 26364) and the template's (§5.144.1, line 44649, XSD line 32555); where the information
 * model says "must be new tags" it writes `##other` (§5.33.6, §5.37.5 and §5.129.4). The
 * information model outranks the XSD, so the slot is `##any`: a QTI element there is kept as
 * extension content, a foreign element of its own namespace (a QTI root stays foreign by spec
 * reading 6), an HTML, MathML, SSML or XInclude global is read as its kind, and an element in no
 * namespace is admitted too, which "any set of child tags" allows. `qti-selection`'s slot keeps the
 * XSD's `##other` (§5.129.4: "must be new tags i.e. not reused QTI ASI tags").
 */
const orderingModel: Particle = {
  _tag: "group",
  compositor: "sequence",
  occurs: { max: Option.some(1), min: 1 },
  particles: [
    {
      _tag: "any",
      namespace: "##any",
      occurs: { max: Option.none(), min: 0 },
      processing: "lax",
      sources: cited(orderingSource),
    },
  ],
  sources: cited(orderingSource),
};

/**
 * The ASI vocabulary's facets, its HTML and its test, PCI, catalog and stimulus kinds included, the
 * one namespace they share:
 *
 * - Its 22 interactions, and the expression kinds' arities, both projected from the IR;
 * - The ancestry blocks of an item's content, and a test's rubric block and feedback entering `test`,
 *   under which no template sits (spec reading 25);
 * - Spec reading 61, `qti-ordering`'s extension slot admits any namespace ({@link orderingModel});
 * - HTML's `colgroup` with `span` holding no `col`, and the default hotspot that ends its
 *   interaction;
 * - The response bindings, the package roots and the references.
 */
export const asi: Facets = {
  ancestry: {
    banning: [
      { flags: ["rubric"], kinds: ["qti-rubric-block"] },
      { flags: ["htx"], kinds: ["qti-hottext"] },
      { flags: ["test"], kinds: templateKinds },
    ],
    entering: [
      { flags: ["gap"], kinds: ["qti-gap-match-interaction"] },
      {
        flags: ["choice"],
        kinds: [
          "qti-prompt",
          "qti-simple-choice",
          "qti-simple-associable-choice",
          "qti-inline-choice",
          "qti-label",
          "qti-gap-text",
          "qti-gap-img",
        ],
      },
      { flags: ["htx"], kinds: ["qti-hottext"] },
      { flags: ["rubric"], kinds: ["qti-rubric-block"] },
      { flags: ["tmpl"], kinds: templateBlockKinds },
      { flags: ["modal"], kinds: ["qti-modal-feedback"] },
      {
        flags: ["fb"],
        kinds: ["qti-feedback-block", "qti-feedback-block.template", "qti-feedback-inline"],
      },
      { flags: ["test"], kinds: ["qti-rubric-block.test", "qti-test-feedback"] },
    ] satisfies readonly Block[],
    needing: [{ flags: ["gap"], kinds: ["qti-gap"] }],
  },
  children: {
    barrings: [
      {
        kinds: ["col"],
        name: "span",
        parents: ["colgroup"],
        source: "HTML, colgroup",
        versions: schemaVersions,
      },
    ],
    // Spec reading 80: only a hotspot choice's default must appear last. The AssociableHotspot
    // class and the graphic associate interaction's hotspots (§5.7, §5.59.4) state no such rule, so
    // a `qti-associable-hotspot` default stands anywhere; the graphic gap match interaction's ban on
    // any default (§5.60.9) is a law of its own.
    lastWhere: [
      {
        attribute: "shape",
        kind: "qti-hotspot-choice",
        parents: ["qti-graphic-order-interaction", "qti-hotspot-interaction"],
        source:
          "information model §5.67, HotspotChoice, and §5.68.6: 'The default hotspot, if defined, must appear last'",
        value: "default",
        versions: schemaVersions,
      },
    ],
  },
  content: {
    edits: [
      { _tag: "restate", parent: "qti-ordering", particle: orderingModel, source: orderingSource },
    ],
    models: [],
    roots: [],
  },
  expression: {
    arities: aritiesOf(contentModels, expressionsIn(contentModels)),
    recordFits: ["qti-extended-text-interaction", "qti-text-entry-interaction"],
    typedFits: [
      {
        baseTypes: ["pair"],
        cardinalities: ["single", "multiple"],
        kind: "qti-associate-interaction",
      },
      {
        baseTypes: ["identifier"],
        cardinalities: ["single", "multiple"],
        kind: "qti-choice-interaction",
      },
      { baseTypes: ["file"], cardinalities: ["single"], kind: "qti-drawing-interaction" },
      { baseTypes: ["boolean"], cardinalities: ["single"], kind: "qti-end-attempt-interaction" },
      {
        baseTypes: ["string", "integer", "float"],
        cardinalities: ["single", "multiple", "ordered"],
        kind: "qti-extended-text-interaction",
      },
      {
        baseTypes: ["directedPair"],
        cardinalities: ["single", "multiple"],
        kind: "qti-gap-match-interaction",
      },
      {
        baseTypes: ["pair"],
        cardinalities: ["single", "multiple"],
        kind: "qti-graphic-associate-interaction",
      },
      {
        baseTypes: ["directedPair"],
        cardinalities: ["multiple"],
        kind: "qti-graphic-gap-match-interaction",
      },
      {
        baseTypes: ["identifier"],
        cardinalities: ["ordered"],
        kind: "qti-graphic-order-interaction",
      },
      {
        baseTypes: ["identifier"],
        cardinalities: ["single", "multiple"],
        kind: "qti-hotspot-interaction",
      },
      {
        baseTypes: ["identifier"],
        cardinalities: ["single", "multiple"],
        kind: "qti-hottext-interaction",
      },
      {
        baseTypes: ["identifier"],
        cardinalities: ["single"],
        kind: "qti-inline-choice-interaction",
      },
      {
        baseTypes: ["directedPair"],
        cardinalities: ["single", "multiple"],
        kind: "qti-match-interaction",
      },
      { baseTypes: ["integer"], cardinalities: ["single"], kind: "qti-media-interaction" },
      { baseTypes: ["identifier"], cardinalities: ["ordered"], kind: "qti-order-interaction" },
      {
        baseTypes: ["point"],
        cardinalities: ["single", "multiple"],
        kind: "qti-position-object-interaction",
      },
      {
        baseTypes: ["point"],
        cardinalities: ["single", "multiple"],
        kind: "qti-select-point-interaction",
      },
      {
        baseTypes: ["integer", "float"],
        cardinalities: ["single"],
        kind: "qti-slider-interaction",
      },
      {
        baseTypes: ["string", "integer", "float"],
        cardinalities: ["single"],
        kind: "qti-text-entry-interaction",
      },
      { baseTypes: ["file"], cardinalities: ["single"], kind: "qti-upload-interaction" },
    ],
  },
  interactions: interactionsIn(attributeDeclarations),
  package: {
    resourceTypes: [],
    roots: [
      { root: "qti-assessment-item", type: "imsqti_item_xmlv3p0" },
      { root: "qti-assessment-test", type: "imsqti_test_xmlv3p0" },
      { root: "qti-assessment-section", type: "imsqti_section_xmlv3p0" },
      { root: "qti-assessment-stimulus", type: "imsqti_stimulus_xmlv3p0" },
      { root: "qti-response-processing", type: "imsqti_rptemplate_xmlv3p0" },
      { root: "qti-outcome-declaration", type: "imsqti_outcomes_xmlv3p0" },
      { root: "qti-response-processing", type: "imsqti_resprocessing_xmlv3p0" },
    ],
  },
  references: asiReferences,
};

/**
 * The content-packaging vocabulary's facets: its resource types, projected from the IR.
 */
export const cp: Facets = {
  ...noFacets,
  package: { resourceTypes: resourceTypesIn(attributeDeclarations), roots: [] },
};

/**
 * Cite the loose LOM binding's Schematron for one capped kind (spec reading 130): the lines of the
 * at-most-one asserts that cap it, one for each Schematron context it stands in.
 *
 * @param lines - The asserts' lines in `imsmd_loose_v1p3p2.xsd`.
 * @returns The citation.
 */
const lomCapSource = (lines: readonly [number, ...number[]]): string =>
  `spec reading 130: the loose LOM binding's Schematron, imsmd_loose_v1p3p2.xsd ${lines.length === 1 ? "line" : "lines"} ${lines.map(String).join(", ")}, count = 0 or 1`;

/**
 * The loose LOM binding's 94 at-most-one asserts (spec reading 130), by the kind of each
 * Schematron rule's context: each asserted element as its kind there, with the lines of the asserts
 * that cap it. They are 82 (parent, kind) pairs: `lom:contribute` and `lom:role` stand in two
 * contexts, and `lom:date` and `lom:identifier` in three, and each context asserts the same caps of
 * the kind, so a cap holds wherever the kind stands.
 *
 * Each assert is `count(lom:X) = 0 or count(lom:X) = 1` over a rule whose context is an absolute
 * path from `lom:lom` (lines 93 to 911), and each caps exactly an element the binding's XSD
 * declares `maxOccurs="1"` inside its type's unbounded choice. The three local names the binding
 * declares with two types are named by the type they hold in the context: `duration` is
 * `lom:duration` (`Duration.Type`, line 1583) in `lom:technical`, and `lom:duration.string` in a
 * duration; `entry` is `lom:entry.langString` in `lom:taxon`; `source` is `lom:source.langString`
 * in `lom:taxonPath` (`src/vocab/derive/naming.ts`).
 */
const lomCaps: readonly (readonly [string, readonly (readonly [string, number, ...number[]])[]])[] =
  [
    [
      "lom:aggregationLevel",
      [
        ["lom:source", 103],
        ["lom:value", 107],
      ],
    ],
    [
      "lom:annotation",
      [
        ["lom:entity", 122],
        ["lom:date", 126],
        ["lom:description", 130],
      ],
    ],
    [
      "lom:classification",
      [
        ["lom:purpose", 145],
        ["lom:description", 149],
      ],
    ],
    [
      "lom:context",
      [
        ["lom:source", 164],
        ["lom:value", 168],
      ],
    ],
    [
      "lom:contribute",
      [
        ["lom:role", 183, 202],
        ["lom:date", 187, 206],
      ],
    ],
    [
      "lom:copyrightAndOtherRestrictions",
      [
        ["lom:source", 221],
        ["lom:value", 225],
      ],
    ],
    [
      "lom:cost",
      [
        ["lom:source", 240],
        ["lom:value", 244],
      ],
    ],
    [
      "lom:date",
      [
        ["lom:dateTime", 259, 271, 283],
        ["lom:description", 263, 275, 287],
      ],
    ],
    [
      "lom:difficulty",
      [
        ["lom:source", 302],
        ["lom:value", 306],
      ],
    ],
    [
      "lom:duration",
      [
        ["lom:duration.string", 333],
        ["lom:description", 337],
      ],
    ],
    [
      "lom:educational",
      [
        ["lom:interactivityType", 352],
        ["lom:interactivityLevel", 356],
        ["lom:semanticDensity", 360],
        ["lom:difficulty", 364],
        ["lom:typicalLearningTime", 368],
        ["lom:description", 372],
      ],
    ],
    [
      "lom:general",
      [
        ["lom:title", 387],
        ["lom:structure", 391],
        ["lom:aggregationLevel", 395],
      ],
    ],
    [
      "lom:identifier",
      [
        ["lom:catalog", 410, 422, 434],
        ["lom:entry", 414, 426, 438],
      ],
    ],
    [
      "lom:intendedEndUserRole",
      [
        ["lom:source", 453],
        ["lom:value", 457],
      ],
    ],
    [
      "lom:interactivityLevel",
      [
        ["lom:source", 472],
        ["lom:value", 476],
      ],
    ],
    [
      "lom:interactivityType",
      [
        ["lom:source", 491],
        ["lom:value", 495],
      ],
    ],
    [
      "lom:kind",
      [
        ["lom:source", 510],
        ["lom:value", 514],
      ],
    ],
    [
      "lom:learningResourceType",
      [
        ["lom:source", 529],
        ["lom:value", 533],
      ],
    ],
    [
      "lom:lifeCycle",
      [
        ["lom:version", 548],
        ["lom:status", 552],
      ],
    ],
    [
      "lom:lom",
      [
        ["lom:general", 567],
        ["lom:lifeCycle", 571],
        ["lom:metaMetadata", 575],
        ["lom:technical", 579],
        ["lom:rights", 583],
      ],
    ],
    ["lom:metaMetadata", [["lom:language", 598]]],
    [
      "lom:name",
      [
        ["lom:source", 613],
        ["lom:value", 617],
      ],
    ],
    [
      "lom:orComposite",
      [
        ["lom:type", 632],
        ["lom:name", 636],
        ["lom:minimumVersion", 640],
        ["lom:maximumVersion", 644],
      ],
    ],
    [
      "lom:purpose",
      [
        ["lom:source", 659],
        ["lom:value", 663],
      ],
    ],
    [
      "lom:relation",
      [
        ["lom:kind", 678],
        ["lom:resource", 682],
      ],
    ],
    [
      "lom:rights",
      [
        ["lom:cost", 719],
        ["lom:copyrightAndOtherRestrictions", 723],
        ["lom:description", 727],
      ],
    ],
    [
      "lom:role",
      [
        ["lom:source", 742, 761],
        ["lom:value", 746, 765],
      ],
    ],
    [
      "lom:semanticDensity",
      [
        ["lom:source", 780],
        ["lom:value", 784],
      ],
    ],
    [
      "lom:status",
      [
        ["lom:source", 799],
        ["lom:value", 803],
      ],
    ],
    [
      "lom:structure",
      [
        ["lom:source", 818],
        ["lom:value", 822],
      ],
    ],
    [
      "lom:taxon",
      [
        ["lom:id", 837],
        ["lom:entry.langString", 841],
      ],
    ],
    ["lom:taxonPath", [["lom:source.langString", 856]]],
    [
      "lom:technical",
      [
        ["lom:size", 871],
        ["lom:installationRemarks", 875],
        ["lom:otherPlatformRequirements", 879],
        ["lom:duration", 883],
      ],
    ],
    [
      "lom:type",
      [
        ["lom:source", 898],
        ["lom:value", 902],
      ],
    ],
    [
      "lom:typicalLearningTime",
      [
        ["lom:duration.string", 321],
        ["lom:description", 325],
      ],
    ],
  ];

/**
 * The LOM vocabulary's facets: its package root, and spec reading 130's caps ({@link lomCaps}). The
 * binding's XSD repeats each element of a category in an unbounded choice
 * (`imsmd_loose_v1p3p2.xsd:984`, `AggregationLevel.Type`, and its siblings), so the automaton holds
 * its model as it is, and admits any number of each element. The binding's header says "The strict
 * multiplicity of elements has been imposed" (lines 18-21), and its embedded Schematron "ensure[s]
 * that the number of entries in an unordered complexType of an element obey the multiplicity
 * constraints" (lines 85-92), so each element it caps stands at most once, a count `Counted` holds
 * beside the automaton.
 */
export const lom: Facets = {
  ...noFacets,
  content: {
    edits: lomCaps.flatMap(([parent, caps]) =>
      caps.map(([kind, ...lines]): ModelEdit => ({
        _tag: "cap",
        kind,
        parent,
        source: lomCapSource(lines),
      })),
    ),
    models: [],
    roots: [],
  },
  package: { resourceTypes: [], roots: [{ root: "lom:lom", type: "resourcemetadata/xml" }] },
};

/**
 * The usage-data vocabulary's facets: its package root.
 */
export const ud: Facets = {
  ...noFacets,
  package: { resourceTypes: [], roots: [{ root: "ud:usageData", type: "qtiusagedata/xml" }] },
};

/**
 * Where spec reading 44 restates `tokenType` from: the SSML 1.1 Recommendation, which defines the
 * language, and whose list of `token`'s elements the XSD widens with `voice`.
 */
const tokenSource =
  "spec reading 44: SSML 1.1 §3.1.8.2, 'The token element can only contain text to be rendered and the following elements: audio, break, emphasis, mark, phoneme, prosody, say-as, sub', and 'The w element is an alias for the token element'";

/**
 * Restate a model as its XSD states it, less every element particle that names one kind alone: a
 * group that held such a particle takes the reading as its source, and every other particle keeps
 * the XSD's.
 *
 * @param model - The XSD's model.
 * @param kind - The kind the reading removes.
 * @param sources - The reading's source, once per version.
 * @returns The restated model.
 */
const withoutKind = (model: Particle, kind: string, sources: Sources): Particle => {
  if (model._tag !== "group") {
    return model;
  }

  const kept = model.particles.filter(
    (held) => !(held._tag === "element" && held.kinds.length === 1 && held.kinds[0] === kind),
  );

  return {
    ...model,
    particles: kept.map((held) => withoutKind(held, kind, sources)),
    sources: kept.length < model.particles.length ? sources : model.sources,
  };
};

/**
 * Spec reading 44's restatements of `ssml:token` and its alias `ssml:w`: the XSD's `tokenType`
 * less its `voice` (`ssml/synthesis-nonamespace.xsd` lines 541-552). The choice keeps its `##other`
 * lax wildcard, since SSML 1.1 §2.2.3 admits other namespaces: "Language-specific (i.e. non-SSML)
 * elements and attributes may be inserted into SSML using an appropriate namespace".
 */
const tokenEdits: readonly ModelEdit[] = contentModels.flatMap((model): readonly ModelEdit[] =>
  (model.kind === "ssml:token" || model.kind === "ssml:w") && model.content._tag === "mixed"
    ? [
        {
          _tag: "restate",
          parent: model.kind,
          particle: withoutKind(model.content.particle, "ssml:voice", cited(tokenSource)),
          source: tokenSource,
        },
      ]
    : [],
);

/**
 * SSML's facets: spec reading 40, `meta`, `metadata` and `lexicon` before every other SSML element
 * of `speak` and before its text that is not whitespace, and spec reading 44, no `voice` in a
 * `token` or a `w` ({@link tokenEdits}). The XSD's sequence orders the elements; the restated model
 * orders the text too, at one text position Unique Particle Attribution keeps unique (`content.ts`,
 * the `first` edit). Its file references are spec reading 103's.
 */
export const ssml: Facets = {
  ...noFacets,
  content: {
    edits: [
      {
        _tag: "first",
        kinds: ["ssml:meta", "ssml:metadata", "ssml:lexicon"],
        parent: "ssml:speak",
        source: "spec reading 40",
      },
      ...tokenEdits,
    ],
    models: [],
    roots: [],
  },
  references: ssmlReferences,
};

/**
 * Cite a MathML rule spec reading 2 states: the MathML 3 RelaxNG file and line it reads, and the
 * Recommendation's section that says the same.
 *
 * @param file - The RelaxNG file, of https://www.w3.org/Math/RelaxNG/mathml3/.
 * @param line - Its line.
 * @param section - The Recommendation's section whose syntax table or prose states the same.
 * @returns The citation.
 */
const relaxNgCite = (file: string, line: number, section: string): string =>
  `spec reading 2: MathML 3 RelaxNG, ${file} line ${String(line)}; MathML 3 ${section}`;

/**
 * Where a restated MathML model comes from, once per version ({@link relaxNgCite}).
 *
 * @param file - The RelaxNG file.
 * @param line - Its line.
 * @param section - The Recommendation's section that states the same.
 * @returns The source, once per version.
 */
const relaxNg = (file: string, line: number, section: string): Sources =>
  cited(relaxNgCite(file, line, section));

/**
 * One element particle of a restated MathML model.
 *
 * @param kinds - The kinds it names.
 * @param min - Its least count.
 * @param max - Its greatest count, none for unbounded.
 * @param sources - Where it comes from.
 * @returns The particle.
 */
const mathParticle = (
  kinds: readonly [string, ...string[]],
  min: number,
  max: Option.Option<number>,
  sources: Sources,
): Particle => ({ _tag: "element", kinds, occurs: { max, min }, sources });

/**
 * A group of a restated MathML model, occurring once.
 *
 * @param compositor - Its compositor.
 * @param sources - Where it comes from.
 * @param particles - Its particles.
 * @returns The group.
 */
const mathGroup = (
  compositor: "choice" | "sequence",
  sources: Sources,
  ...particles: readonly Particle[]
): Particle => ({
  _tag: "group",
  compositor,
  occurs: { max: Option.some(1), min: 1 },
  particles,
  sources,
});

/**
 * Occur a restated particle any number of times, none included.
 *
 * @param held - The particle.
 * @returns It, occurring `0..n`.
 */
const anyNumber = (held: Particle): Particle => ({
  ...held,
  occurs: { max: Option.none(), min: 0 },
});

/**
 * The kinds a model's element particles name, each once, in document order.
 *
 * @param node - The model's particle.
 * @returns The kinds.
 */
const kindsIn = (node: Particle): readonly string[] => {
  switch (node._tag) {
    case "element": {
      return node.kinds;
    }
    case "any": {
      return [];
    }
    case "group": {
      return [...new Set(node.particles.flatMap(kindsIn))];
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Hold kinds a reading needs at least one of, or fail as the defect a reading over no kind is.
 *
 * @param kinds - The kinds.
 * @param defect - What it means that there are none.
 * @returns The kinds, at least one.
 */
const someKinds = (kinds: readonly string[], defect: string): readonly [string, ...string[]] =>
  Option.getOrThrowWith(
    Arr.isReadonlyArrayNonEmpty(kinds) ? Option.some(kinds) : Option.none(),
    () => new Error(defect),
  );

/**
 * Read a class the MathML XSD states as the one group a kind's model holds, as its kinds.
 *
 * @param kind - The kind whose model is the class.
 * @param name - The class's name, for the defect a missing model is.
 * @returns The kinds, each once, in document order.
 */
const classOf = (kind: string, name: string): readonly [string, ...string[]] =>
  someKinds(
    [
      ...new Set(
        contentModels
          .filter((model) => model.kind === kind)
          .flatMap(({ content }) =>
            content._tag === "element-only" || content._tag === "mixed"
              ? kindsIn(content.particle)
              : [],
          ),
      ),
    ],
    `The MathML XSD gives ${kind} no model naming ${name}, which reading 2 reads.`,
  );

/**
 * The content expressions the RelaxNG names, `ContExp` (`mathml3-strict-content.rnc` line 14): the
 * XSD's group, as `m:condition`'s model holds it (`mathml3-strict-content.xsd` line 6), and
 * `semantics-contexp`, which the RelaxNG names first and the XSD drops ("Ambiguous content model
 * altered (ContExp)", line 8), the kind `m:semantics.contexp`.
 */
const contentExpressions: readonly [string, ...string[]] = [
  ...classOf("m:condition", "ContExp"),
  "m:semantics.contexp",
];

/**
 * The content expressions but `interval`, which the RelaxNG's `DomainQ` names as well
 * (`mathml3-content.rnc` line 41): an argument that ends a model's qualifiers.
 */
const nonIntervals = someKinds(
  contentExpressions.filter((kind) => kind !== "m:interval"),
  "The MathML content expressions hold no kind but m:interval.",
);

/**
 * The math expressions, MathML's `MathExpression`, as `m:mrow`'s model names them
 * (`mathml3-strict-content.xsd` line 179): the content and presentation expressions and
 * `m:semantics`, whose first child is any math expression. That `semantics` is the widest of the
 * three, so where a math expression stands, the element is read as it, and `m:semantics.contexp`
 * is not named beside it.
 */
const mathExpressions = classOf("m:mrow", "MathExpression");

/**
 * `bvar = element bvar {CommonAtt, ((ci | semantics-ci) & degree?)}` (`mathml3-content.rnc` line
 * 23): one annotated variable and at most one degree, in either order, which the XSD's trang
 * translation widens to `(ci | semantics-ci | degree)*` (`mathml3-content.xsd` lines 46-57).
 * Restated as the interleave's language, `(ci | semantics-ci) degree? | degree (ci |
 * semantics-ci)`, which Unique Particle Attribution keeps deterministic: the first child chooses
 * the branch. A bound variable's `semantics-ci` is the kind `m:semantics.ci`.
 */
const bvarModel = (() => {
  const sources = relaxNg(
    "mathml3-content.rnc",
    23,
    "§4.2.6.2 Bound Variables (Content: `(ci | semantics-ci), degree? | degree?, (ci | semantics-ci)`)",
  );
  const variable = mathParticle(["m:ci", "m:semantics.ci"], 1, Option.some(1), sources);

  return mathGroup(
    "choice",
    sources,
    mathGroup(
      "sequence",
      sources,
      variable,
      mathParticle(["m:degree"], 0, Option.some(1), sources),
    ),
    mathGroup(
      "sequence",
      sources,
      mathParticle(["m:degree"], 1, Option.some(1), sources),
      variable,
    ),
  );
})();

/**
 * `piecewise = element piecewise {CommonAtt, DefEncAtt, (piece* & otherwise?)}` (line 60): any
 * pieces and at most one otherwise, anywhere among them (§4.4.1.9: "zero or more piece elements,
 * and optionally one otherwise element"), which the XSD widens to `(piece | otherwise)*`
 * (`mathml3-content.xsd` lines 158-167). Restated as `piece* (otherwise piece*)?`.
 */
const piecewiseModel = (() => {
  const sources = relaxNg("mathml3-content.rnc", 60, "§4.4.1.9 Piecewise declaration");

  return mathGroup("sequence", sources, mathParticle(["m:piece"], 0, Option.none(), sources), {
    ...mathGroup(
      "sequence",
      sources,
      mathParticle(["m:otherwise"], 1, Option.some(1), sources),
      mathParticle(["m:piece"], 0, Option.none(), sources),
    ),
    occurs: { max: Option.some(1), min: 0 },
  });
})();

/**
 * A model's bound variables, qualifiers and arguments as the RelaxNG states them (`DomainQ =
 * (domainofapplication|condition|interval|(lowlimit,uplimit?))*`, `mathml3-content.rnc` line 41,
 * the XSD's `DomainQ` without `interval`, "Ambiguous content model altered (interval)",
 * `mathml3-content.xsd` line 92), narrowed by the Recommendation's prose, which the RelaxNG does
 * not say (§4.3.3):
 *
 * - §4.3.3, "In all cases, if more than one qualifier is present, they appear in the order bvar,
 *   lowlimit, uplimit, interval, condition, domainofapplication, degree, momentabout, logbase":
 *   they stand in the order `bvar*`, `(lowlimit, uplimit?)*`, `interval*`, `condition*`,
 *   `domainofapplication*`, then `extra` (`degree`, `momentabout`, `logbase`), each kind's run in
 *   its place;
 * - §4.3.3.1, "condition qualifiers always contain instances of the bound variable, and thus require
 *   a preceding bvar": a `condition` stands only after a `bvar`;
 * - §4.2.6.1, "This is followed by a non-empty list of bvar elements": a `bind` needs one.
 *
 * An interval is a content expression too, so it is a qualifier when a qualifier follows it and an
 * argument otherwise. Before the later qualifiers the `interval*` run takes every interval that
 * precedes the arguments, and the arguments `(other, interval*)*` open with `other`, a content
 * expression that is no interval, which ends the qualifiers. Once a later qualifier has stood, no
 * qualifier follows an interval, and the arguments `(interval | other)*` take it. Each step is one
 * position, so Unique Particle Attribution keeps it deterministic.
 *
 * @param sources - Where the model comes from.
 * @param extra - The qualifiers beyond `DomainQ` the model admits: `apply`'s `degree`,
 *   `momentabout` and `logbase` (`Qualifier`, line 47), none for the constructors.
 * @param arguments_ - How the arguments end the model: any number, or, for `lambda`, at most the
 *   one other, which its ending completes.
 * @param binding - Whether the model's `bvar` run may be empty: `bind` needs one. Without one the
 *   model has no `condition`.
 * @returns The model's particle after its leading content expression, if it has one.
 */
const qualified = (
  sources: Sources,
  extra: readonly string[],
  arguments_: "many" | "one",
  binding: "optional" | "required",
): Particle => {
  const once = Option.some(1);
  const interval = mathParticle(["m:interval"], 1, once, sources);
  const other = mathParticle(nonIntervals, 1, once, sources);
  const run = (kind: string, min: 0 | 1): Particle =>
    mathParticle([kind], min, Option.none(), sources);
  const limits = anyNumber(
    mathGroup(
      "sequence",
      sources,
      mathParticle(["m:lowlimit"], 1, once, sources),
      mathParticle(["m:uplimit"], 0, once, sources),
    ),
  );
  const intervals = run("m:interval", 0);
  const arguments1 =
    arguments_ === "many"
      ? anyNumber(mathGroup("sequence", sources, other, anyNumber(interval)))
      : { ...other, occurs: { max: once, min: 0 } };
  const arguments2 =
    arguments_ === "many"
      ? anyNumber(mathGroup("choice", sources, interval, other))
      : { ...mathGroup("choice", sources, interval, other), occurs: { max: once, min: 0 } };
  const after = (kinds: readonly string[]): Particle =>
    mathGroup(
      "choice",
      sources,
      arguments1,
      ...kinds.map((first, at) =>
        mathGroup(
          "sequence",
          sources,
          run(first, 1),
          ...kinds.slice(at + 1).map((kind) => run(kind, 0)),
          arguments2,
        ),
      ),
    );
  const bound = (kinds: readonly string[], min: 0 | 1): Particle =>
    mathGroup(
      "sequence",
      sources,
      ...(min === 1 ? [mathParticle(["m:bvar"], 1, Option.none(), sources)] : []),
      limits,
      intervals,
      after(kinds),
    );
  const later = ["m:domainofapplication", ...extra];

  return binding === "required"
    ? bound(["m:condition", ...later], 1)
    : mathGroup("choice", sources, bound(["m:condition", ...later], 1), bound(later, 0));
};

/**
 * `apply.content = ContExp+ | (ContExp, BvarQ, Qualifier*, ContExp*)` (`mathml3-content.rnc` line
 * 29), `bind.content` the same (line 31), with `Qualifier = DomainQ|degree|momentabout|logbase`
 * (line 47): `ContExp`, then {@link qualified}'s qualifiers and arguments in the Recommendation's
 * order. The first alternative is the second's with no bound variable and no qualifier. A `bind`
 * holds at least one `bvar` (§4.2.6.1).
 *
 * @param line - The line of the kind's model.
 * @param binding - Whether the kind's `bvar` run may be empty.
 * @returns The restated model.
 */
const applyModel = (line: number, binding: "optional" | "required"): Particle => {
  const sources = relaxNg(
    "mathml3-content.rnc",
    line,
    "§4.2.5 Function Application and §4.3.3 Qualifiers",
  );

  return mathGroup(
    "sequence",
    sources,
    mathParticle(contentExpressions, 1, Option.some(1), sources),
    qualified(sources, ["m:degree", "m:momentabout", "m:logbase"], "many", binding),
  );
};

/**
 * `lambda = element lambda {CommonAtt, DefEncAtt, BvarQ, DomainQ, ContExp}` (`mathml3-content.rnc`
 * line 103): {@link qualified}'s bound variables and qualifiers, then `other?`, which
 * {@link lambdaEnding} ends with a content expression. The RelaxNG's language, `bvar*
 * (interval | qualifier)* (interval | other)` in the Recommendation's order, has no deterministic
 * expression (`content.ts`, `endedBy`).
 */
const lambdaModel = (() => {
  const sources = relaxNg("mathml3-content.rnc", 103, "§4.4.1.3 Lambda");

  return mathGroup("sequence", sources, qualified(sources, [], "one", "optional"));
})();

/**
 * `lambda`'s last child is its body, a content expression (`mathml3-content.rnc` line 103).
 */
const lambdaEnding = relaxNgCite("mathml3-content.rnc", 103, "§4.4.1.3 Lambda");

/**
 * Where the rule that `mscarries` is not last comes from: the RelaxNG's `mstack` and `mlongdiv`
 * (`mathml3-presentation.rnc` lines 494 and 504) and MathML 3 §3.6.5.1, "It is an error for
 * mscarries to be the last element of an mstack or mlongdiv element", which the RelaxNG does not
 * say.
 */
const mscarriesEnding =
  "spec reading 2: MathML 3 RelaxNG, mathml3-presentation.rnc lines 494 and 504; MathML 3 §3.6.5.1 Carries, Borrows, and Crossouts (mscarries is not the last element)";

/**
 * The kinds that may end an `mstack` or an `mlongdiv`: each kind the parent's model names but
 * `m:mscarries`.
 *
 * @param parent - The kind of `mstack` or `mlongdiv`.
 * @returns The kinds.
 */
const beforeCarries = (parent: string): readonly [string, ...string[]] =>
  someKinds(
    classOf(parent, "MstackExpression").filter((kind) => kind !== "m:mscarries"),
    `The MathML XSD gives ${parent} no model naming a kind but m:mscarries.`,
  );

/**
 * `mstack = element mstack {..., MstackExpression*}` (`mathml3-presentation.rnc` line 494) without
 * a final `mscarries`: no child, or any children the last of which is not an `mscarries`. Restated
 * as `(mscarries* other)*`, which Unique Particle Attribution keeps deterministic. An `ends` edit
 * would state the same language but for the empty family, which an ending refuses (`content.ts`,
 * `endedBy` clears `nullable`), and an empty `mstack` is the RelaxNG's.
 */
const mstackModel = anyNumber(
  mathGroup(
    "sequence",
    cited(mscarriesEnding),
    mathParticle(["m:mscarries"], 0, Option.none(), cited(mscarriesEnding)),
    mathParticle(beforeCarries("m:mstack"), 1, Option.some(1), cited(mscarriesEnding)),
  ),
);

/**
 * The constructors' model, `bvar*, DomainQ, ContExp*` (`vector`, `matrix` and `matrixrow`,
 * `mathml3-content.rnc` lines 325-327), and `set` and `list`'s `BvarQ*, DomainQ*, ContExp*` (lines
 * 230 and 231), the same language: {@link qualified}'s bound variables, qualifiers and arguments.
 *
 * @param line - The line of the kind's model.
 * @param section - The Recommendation's section of the kind.
 * @returns The restated model.
 */
const constructorModel = (line: number, section: string): Particle => {
  const sources = relaxNg("mathml3-content.rnc", line, section);

  return mathGroup("sequence", sources, qualified(sources, [], "many", "optional"));
};

/**
 * `annotation-xml.model = (MathExpression|anyElement)*` (`mathml3-common.rnc` line 59), with
 * `anyElement = element (* - m:*) {...}` (line 61): any number of math expressions and of elements
 * in any namespace but MathML's, and no text. The XSD alters it to one lax element of any namespace
 * ("content model altered for libxml (annotation-xml)", `mathml3-common.xsd` line 42), so it holds
 * exactly one child, and that child may be any MathML element.
 *
 * Restated as `(MathExpression | ##other | ##local)*`: the namespaces of the XSD's own `anyElement`
 * group (lines 46-51), lax as spec reading 30 reads the XSD's wildcard, so a QTI element directly
 * inside is read by its global declaration. A MathML element that is no math expression (`m:bvar`,
 * `m:math`, an undeclared `m:` name) is refused. That no MathML element stands anywhere inside
 * such an element is the root and ancestry rule of {@link mathml}.
 */
const annotationXmlModel = (() => {
  const sources = relaxNg("mathml3-common.rnc", 59, "§5.2.3 The annotation-xml element");
  const lax = (namespace: "##local" | "##other"): Particle => ({
    _tag: "any",
    namespace,
    occurs: { max: Option.some(1), min: 1 },
    processing: "lax",
    sources: relaxNg("mathml3-common.rnc", 61, "§5.2.3 The annotation-xml element"),
  });

  return anyNumber(
    mathGroup(
      "choice",
      sources,
      mathParticle(mathExpressions, 1, Option.some(1), sources),
      lax("##other"),
      lax("##local"),
    ),
  );
})();

/**
 * The models whose content expressions the RelaxNG reads as `ContExp`, `semantics-contexp` among
 * them, and the XSD reads without it, each with its line in the RelaxNG, the restated models aside:
 * `semantics-contexp` itself (`mathml3-strict-content.rnc` line 23), `cerror` (line 50), and in
 * `mathml3-content.rnc` the qualifiers (lines 42 to 50), `piece` (62), `otherwise` (64), `reln`
 * (70), `fn` (71), `declare` (72) and `interval` (84). A spec reading admits `m:semantics.contexp`
 * beside `m:ci` in each.
 */
const contentExpressionParents: readonly (readonly [kind: string, file: string, line: number])[] = [
  ["m:semantics.contexp", "mathml3-strict-content.rnc", 23],
  ["m:cerror", "mathml3-strict-content.rnc", 50],
  ["m:domainofapplication", "mathml3-content.rnc", 42],
  ["m:condition", "mathml3-content.rnc", 43],
  ["m:uplimit", "mathml3-content.rnc", 44],
  ["m:lowlimit", "mathml3-content.rnc", 45],
  ["m:degree", "mathml3-content.rnc", 48],
  ["m:momentabout", "mathml3-content.rnc", 49],
  ["m:logbase", "mathml3-content.rnc", 50],
  ["m:piece", "mathml3-content.rnc", 62],
  ["m:otherwise", "mathml3-content.rnc", 64],
  ["m:reln", "mathml3-content.rnc", 70],
  ["m:fn", "mathml3-content.rnc", 71],
  ["m:declare", "mathml3-content.rnc", 72],
  ["m:interval", "mathml3-content.rnc", 84],
];

/**
 * MathML's facets, spec reading 2, where the MathML 3 RelaxNG schema and the Recommendation's prose
 * state a rule the XSD does not:
 *
 * - The models restated whole: the two interleaves (`&`) an XSD cannot state, `m:bvar` and
 *   `m:piecewise`; the models whose qualifiers hold `interval`, `m:apply`, `m:bind`, `m:lambda`,
 *   `m:set`, `m:list`, `m:vector`, `m:matrix` and `m:matrixrow`, `m:lambda` ended by a content
 *   expression; and `m:annotation-xml`'s `(MathExpression|anyElement)*`.
 * - `semantics-contexp` among the content expressions, `m:semantics.contexp` beside `m:ci`.
 * - MathML's one root: a wildcard admits `m:math` of MathML's kinds and no other (the RelaxNG's
 *   `start = math`, `mathml3-common.rnc` line 15; §2.2, "All other MathML content must be contained
 *   in a math element").
 * - No `m:math` inside another: `m:math` enters `math` and may not sit under it (§2.2: "it is an
 *   error for one math element to contain another"). With the root rule, no MathML element stands
 *   inside an element `annotation-xml` admits by `anyElement`, whose content the RelaxNG bars from
 *   MathML (line 61).
 *
 * Its file references are spec reading 103's (`mathmlCensus` of `references.ts`).
 */
export const mathml: Facets = {
  ...noFacets,
  ancestry: {
    banning: [{ flags: ["math"], kinds: ["m:math"] }],
    entering: [{ flags: ["math"], kinds: ["m:math"] }],
    needing: [],
  },
  content: {
    edits: [
      {
        _tag: "restate",
        parent: "m:bvar",
        particle: bvarModel,
        source: relaxNgCite("mathml3-content.rnc", 23, "§4.2.6.2 Bound Variables"),
      },
      {
        _tag: "restate",
        parent: "m:piecewise",
        particle: piecewiseModel,
        source: relaxNgCite("mathml3-content.rnc", 60, "§4.4.1.9 Piecewise declaration"),
      },
      {
        _tag: "restate",
        parent: "m:apply",
        particle: applyModel(29, "optional"),
        source: relaxNgCite("mathml3-content.rnc", 29, "§4.2.5 Function Application"),
      },
      {
        _tag: "restate",
        parent: "m:bind",
        particle: applyModel(31, "required"),
        source: relaxNgCite("mathml3-content.rnc", 31, "§4.2.6.1 Bindings"),
      },
      {
        _tag: "restate",
        parent: "m:lambda",
        particle: lambdaModel,
        source: lambdaEnding,
      },
      { _tag: "ends", kinds: contentExpressions, parent: "m:lambda", source: lambdaEnding },
      {
        _tag: "restate",
        parent: "m:mstack",
        particle: mstackModel,
        source: mscarriesEnding,
      },
      {
        _tag: "ends",
        kinds: beforeCarries("m:mlongdiv"),
        parent: "m:mlongdiv",
        source: mscarriesEnding,
      },
      ...(
        [
          ["m:set", 230, "§4.4.5.1 Set"],
          ["m:list", 231, "§4.4.5.2 List"],
          ["m:vector", 325, "§4.4.9.1 Vector"],
          ["m:matrix", 326, "§4.4.9.2 Matrix"],
          ["m:matrixrow", 327, "§4.4.9.3 Matrix row"],
        ] as const
      ).map(([parent, line, section]): ModelEdit => ({
        _tag: "restate",
        parent,
        particle: constructorModel(line, section),
        source: relaxNgCite("mathml3-content.rnc", line, section),
      })),
      {
        _tag: "restate",
        parent: "m:annotation-xml",
        particle: annotationXmlModel,
        source: relaxNgCite("mathml3-common.rnc", 59, "§5.2.3 The annotation-xml element"),
      },
      ...contentExpressionParents.map(([parent, file, line]): ModelEdit => ({
        _tag: "beside",
        kind: "m:semantics.contexp",
        parent,
        source: relaxNgCite(file, line, "§4.2.8 Attribution via semantics"),
        with: "m:ci",
      })),
    ],
    models: [],
    roots: [
      {
        kinds: ["m:math"],
        namespace: mathmlNamespace,
        source: relaxNgCite("mathml3-common.rnc", 15, "§2.2 The Top-Level <math> Element"),
      },
    ],
  },
  references: mathmlReferences,
};

/**
 * Each kind's expanded name and local name, from the vocabularies' rosters: the names a fragment's
 * root is read by.
 */
const kindNames: ReadonlyMap<string, { readonly local: string; readonly name: string }> = new Map(
  rosters.flatMap(({ kinds, namespace }) =>
    kinds.map(({ handle, local }) => [handle, { local, name: `${namespace}}${local}` }] as const),
  ),
);

/**
 * The kinds an included fragment's document may have as its root (spec readings 85, 114 and
 * 116): every kind an include stands for somewhere, but a context-split kind, under the fragment
 * resource type of the implementation guide's §6.2.
 */
export const fragmentRoots: readonly RootOf[] = fragmentRootsOf(
  includeAlternativesOf(contentModels),
  (kind) => kindNames.get(kind)?.name ?? kind,
  (kind) => kindNames.get(kind)?.local ?? kind,
).map((root) => ({ root, type: fragmentType }));

/**
 * Where spec reading 118 restates an include's content from: XInclude's own text, which the XSD
 * makes wider.
 */
const includeSource =
  "spec reading 118: XInclude 1.0 Second Edition §3.1, 'The children property of the xi:include element may include a single xi:fallback element; the appearance of more than one xi:fallback element ... is a fatal error'";

/**
 * Any number of elements an include ignores: of another namespace than XInclude's, or of none, each
 * assessed laxly, as `XInclude.xsd`'s `includeType` writes them.
 *
 * @returns The particle.
 */
const ignoredContent = (): Particle => ({
  _tag: "group",
  compositor: "choice",
  occurs: { max: Option.none(), min: 0 },
  particles: (["##other", "##local"] as const).map((namespace): Particle => ({
    _tag: "any",
    namespace,
    occurs: { max: Option.some(1), min: 1 },
    processing: "lax",
    sources: cited(includeSource),
  })),
  sources: cited(includeSource),
});

/**
 * `xi:include`'s content, as spec reading 118 restates it: the elements it ignores, and at most one
 * `xi:fallback` among them, where `XInclude.xsd`'s `includeType` admits any number (XInclude 1.0
 * Second Edition, §3.1). The XSD's text and its other children stay as they are.
 */
const includeModel: Particle = {
  _tag: "group",
  compositor: "sequence",
  occurs: { max: Option.some(1), min: 1 },
  particles: [
    ignoredContent(),
    {
      _tag: "group",
      compositor: "sequence",
      occurs: { max: Option.some(1), min: 0 },
      particles: [
        {
          _tag: "element",
          kinds: ["xi:fallback"],
          occurs: { max: Option.some(1), min: 1 },
          sources: cited(includeSource),
        },
        ignoredContent(),
      ],
      sources: cited(includeSource),
    },
  ],
  sources: cited(includeSource),
};

/**
 * XInclude's facets: its file reference, spec reading 103's; the roots of the fragments it
 * includes, which a fragment resource lists (spec reading 114); and spec reading 118's one
 * fallback an include may hold ({@link includeModel}).
 */
export const xi: Facets = {
  ...noFacets,
  content: {
    edits: [
      { _tag: "restate", parent: "xi:include", particle: includeModel, source: includeSource },
    ],
    models: [],
    roots: [],
  },
  package: { resourceTypes: [], roots: fragmentRoots },
  references: xiReferences,
};

/**
 * The facets of each vocabulary `src/vocab/inventory/vocabularies.ts` declares, by its name. A
 * vocabulary not named here states none.
 */
export const vocabularyFacets = new Map([
  ["asi", asi],
  ["cp", cp],
  ["lom", lom],
  ["mathml", mathml],
  ["ssml", ssml],
  ["ud", ud],
  ["xi", xi],
]);

/**
 * The root element kind of a package's manifest, which no resource type lists.
 */
export const manifestRoot = "cp:manifest";

/**
 * The element kinds a document's root may be in production's composition: the manifest's root,
 * then each root kind a vocabulary's package facet names, once, in facet order, an included
 * fragment's last (spec reading 114).
 */
export const documentRoots: readonly [string, ...string[]] = [
  manifestRoot,
  ...new Set(
    [asi, lom, ud, xi]
      .flatMap((facets: Facets): readonly RootOf[] => facets.package.roots)
      .map(({ root }) => root),
  ),
];

/**
 * The document layer's facets: the document node's content model (fin.md §12, entry 8, review R5),
 * which no XSD declares: at most one doctype, then exactly one root element, with comments,
 * processing instructions and whitespace anywhere around them.
 */
export const documentLayer: Facets = {
  ...noFacets,
  content: {
    edits: [],
    models: [
      {
        content: {
          _tag: "element-only",
          particle: {
            _tag: "group",
            compositor: "sequence",
            occurs: { max: Option.some(1), min: 1 },
            particles: [
              particle(["doctype"], 0, Option.some(1)),
              {
                _tag: "group",
                compositor: "choice",
                occurs: { max: Option.some(1), min: 1 },
                particles: documentRoots.map((root) => particle([root], 1, Option.some(1))),
                sources: documentSource,
              },
            ],
            sources: documentSource,
          },
        },
        kind: "document",
        sources: documentSource,
        // The document node is no element, so it has no declared type.
        type: Option.none(),
        versions: schemaVersions,
      },
    ],
    roots: [],
  },
};

/**
 * The open vocabulary's facets: the foreign kinds' content model, which no XSD declares. An element
 * a `lax` wildcard admits with no declaration is assessed laxly, against `xs:anyType` (XML Schema
 * Part 1 §3.4.7, §3.10.4 clause 1), whose content is mixed and `##any` `lax`: its children with a
 * global declaration are assessed by it, and the rest are foreign in turn (spec readings 30 and
 * 57).
 */
export const openVocabulary: Facets = {
  ...noFacets,
  content: {
    edits: [],
    models: Object.values(foreignKinds).map((kind): ContentModel => ({
      content: {
        _tag: "mixed",
        particle: {
          _tag: "group",
          compositor: "sequence",
          occurs: { max: Option.some(1), min: 1 },
          particles: [
            {
              _tag: "any",
              namespace: "##any",
              occurs: { max: Option.none(), min: 0 },
              processing: "lax",
              sources: foreignSource,
            },
          ],
          sources: foreignSource,
        },
      },
      kind,
      sources: foreignSource,
      // A foreign element has no declaration: it is assessed laxly, so no declared type binds it.
      type: Option.none(),
      versions: schemaVersions,
    })),
    roots: [],
  },
};
