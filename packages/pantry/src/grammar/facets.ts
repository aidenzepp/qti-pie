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
import { foreignKinds, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { PackageFacet, ResourceTypes, RootOf } from "#pantry/grammar/package.ts";
import { asiReferences, noReferences } from "#pantry/grammar/references.ts";
import type { ReferenceFacet } from "#pantry/grammar/references.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import { contentModels } from "#pantry/vocab/inventory/models.ts";
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
 * The template kinds, block and inline, each of an item's body and of its rubric block's content.
 */
const templateKinds = [
  "qti-template-block",
  "qti-template-block.rubric",
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
 * `type` in each version's content-packaging XSD (3.0.0 lists 19 and 3.0.1 lists 20, sharing 18),
 * one statement per type with the versions it holds in, in the order the versions first list them,
 * which is the `ResourceType` roster's code order.
 *
 * @param declarations - The attribute declarations.
 * @returns The statements.
 */
const resourceTypesIn = (
  declarations: readonly AttributeDeclaration[],
): readonly ResourceTypes[] => {
  const versionsOf = new Map<string, SchemaVersion[]>();
  for (const { domain, kind, name, versions } of declarations) {
    if (kind === resourceType.kind && name === resourceType.name && domain._tag === "atomic") {
      for (const { facet, value } of domain.facets) {
        if (facet === "enumeration") {
          versionsOf.set(value, [...new Set([...(versionsOf.get(value) ?? []), ...versions])]);
        }
      }
    }
  }

  return [...versionsOf].map(([type, versions]) => ({ types: [type], versions }));
};

/**
 * The ASI vocabulary's facets, its HTML and its test, PCI, catalog and stimulus kinds included, the
 * one namespace they share:
 *
 * - Its 22 interactions, and the expression kinds' arities, both projected from the IR;
 * - The ancestry blocks of an item's content, and a test's rubric block and feedback entering `test`,
 *   under which no template sits (spec reading 25);
 * - Spec reading 26, a section holds at least one part;
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
      { flags: ["tmpl"], kinds: templateKinds },
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
    // Spec reading 71: only a hotspot choice's default must appear last. The AssociableHotspot
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
      {
        _tag: "require",
        kind: "qti-assessment-item-ref",
        parent: "qti-assessment-section",
        source: "spec reading 26",
      },
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
 * The LOM vocabulary's facets: its package root. The LOM binding's XSD repeats each element of a
 * category in an unbounded choice (`imsmd_loose_v1p3p2.xsd:984`, `AggregationLevel.Type`, and its
 * siblings), and no source caps those repeats, so the automaton holds the binding's model as it is.
 */
export const lom: Facets = {
  ...noFacets,
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
 * SSML's facets: spec reading 40, `meta`, `metadata` and `lexicon` before every other SSML element
 * of `speak` and before its text that is not whitespace. The XSD's sequence orders the elements;
 * the restated model orders the text too, at one text position Unique Particle Attribution keeps
 * unique (`content.ts`, the `first` edit).
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
    ],
    models: [],
    roots: [],
  },
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
 * A model's qualifiers and their arguments as the RelaxNG states them, with `interval` among the
 * qualifiers: `DomainQ = (domainofapplication|condition|interval|(lowlimit,uplimit?))*`
 * (`mathml3-content.rnc` line 41), the XSD's `DomainQ` without `interval` ("Ambiguous content model
 * altered (interval)", `mathml3-content.xsd` line 92), then any content expressions.
 *
 * An interval is a content expression too, so it is a qualifier when a qualifier follows it and an
 * argument otherwise: `(interval | qualifier)*, (other, interval*)*`, `other` a content expression
 * that is no interval, which ends the qualifiers. Each step is one position, so Unique Particle
 * Attribution keeps it deterministic, and its language is the RelaxNG's.
 *
 * @param sources - Where the model comes from.
 * @param extra - The qualifiers beyond `DomainQ` the model admits: `apply`'s `degree`,
 *   `momentabout` and `logbase` (`Qualifier`, line 47), none for the constructors.
 * @param arguments_ - How the arguments end the model: any number, or, for `lambda`, at most the
 *   one other, which its ending completes.
 * @returns The qualifiers' and the arguments' particles.
 */
const qualified = (
  sources: Sources,
  extra: readonly string[],
  arguments_: "many" | "one",
): readonly Particle[] => {
  const once = Option.some(1);
  const interval = mathParticle(["m:interval"], 1, once, sources);
  const other = mathParticle(nonIntervals, 1, once, sources);

  return [
    anyNumber(
      mathGroup(
        "choice",
        sources,
        interval,
        mathParticle(["m:domainofapplication"], 1, once, sources),
        mathParticle(["m:condition"], 1, once, sources),
        mathGroup(
          "sequence",
          sources,
          mathParticle(["m:lowlimit"], 1, once, sources),
          mathParticle(["m:uplimit"], 0, once, sources),
        ),
        ...extra.map((kind) => mathParticle([kind], 1, once, sources)),
      ),
    ),
    arguments_ === "many"
      ? anyNumber(mathGroup("sequence", sources, other, anyNumber(interval)))
      : { ...other, occurs: { max: once, min: 0 } },
  ];
};

/**
 * The bound variables a model opens with, any number (`BvarQ = bvar*`,
 * `mathml3-strict-content.rnc` line 38).
 *
 * @param sources - Where the model comes from.
 * @returns The particle.
 */
const boundVariables = (sources: Sources): Particle =>
  mathParticle(["m:bvar"], 0, Option.none(), sources);

/**
 * `apply.content = ContExp+ | (ContExp, BvarQ, Qualifier*, ContExp*)` (`mathml3-content.rnc` line
 * 29), `bind.content` the same (line 31), with `Qualifier = DomainQ|degree|momentabout|logbase`
 * (line 47): `ContExp, bvar*, (interval | qualifier)*, (other, interval*)*` ({@link qualified}).
 * The first alternative is the second's with no bound variable and no qualifier.
 *
 * @param line - The line of the kind's model.
 * @returns The restated model.
 */
const applyModel = (line: number): Particle => {
  const sources = relaxNg(
    "mathml3-content.rnc",
    line,
    "§4.2.5 Function Application and §4.3.3 Qualifiers",
  );

  return mathGroup(
    "sequence",
    sources,
    mathParticle(contentExpressions, 1, Option.some(1), sources),
    boundVariables(sources),
    ...qualified(sources, ["m:degree", "m:momentabout", "m:logbase"], "many"),
  );
};

/**
 * `lambda = element lambda {CommonAtt, DefEncAtt, BvarQ, DomainQ, ContExp}` (`mathml3-content.rnc`
 * line 103): `bvar*, (interval | qualifier)*, other?`, which {@link lambdaEnding} ends with a
 * content expression. The RelaxNG's language, `bvar* (interval | qualifier)* (interval | other)`,
 * has no deterministic expression (`content.ts`, `endedBy`).
 */
const lambdaModel = (() => {
  const sources = relaxNg("mathml3-content.rnc", 103, "§4.4.1.3 Lambda");

  return mathGroup("sequence", sources, boundVariables(sources), ...qualified(sources, [], "one"));
})();

/**
 * `lambda`'s last child is its body, a content expression (`mathml3-content.rnc` line 103).
 */
const lambdaEnding = relaxNgCite("mathml3-content.rnc", 103, "§4.4.1.3 Lambda");

/**
 * The constructors' model, `bvar*, DomainQ, ContExp*` (`vector`, `matrix` and `matrixrow`,
 * `mathml3-content.rnc` lines 325-327), and `set` and `list`'s `BvarQ*, DomainQ*, ContExp*` (lines
 * 230 and 231), the same language: `bvar*, (interval | qualifier)*, (other, interval*)*`
 * ({@link qualified}).
 *
 * @param line - The line of the kind's model.
 * @param section - The Recommendation's section of the kind.
 * @returns The restated model.
 */
const constructorModel = (line: number, section: string): Particle => {
  const sources = relaxNg("mathml3-content.rnc", line, section);

  return mathGroup("sequence", sources, boundVariables(sources), ...qualified(sources, [], "many"));
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
        particle: applyModel(29),
        source: relaxNgCite("mathml3-content.rnc", 29, "§4.2.5 Function Application"),
      },
      {
        _tag: "restate",
        parent: "m:bind",
        particle: applyModel(31),
        source: relaxNgCite("mathml3-content.rnc", 31, "§4.2.6.1 Bindings"),
      },
      {
        _tag: "restate",
        parent: "m:lambda",
        particle: lambdaModel,
        source: lambdaEnding,
      },
      { _tag: "ends", kinds: contentExpressions, parent: "m:lambda", source: lambdaEnding },
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
]);

/**
 * The root element kind of a package's manifest, which no resource type lists.
 */
export const manifestRoot = "cp:manifest";

/**
 * The element kinds a document's root may be in production's composition: the manifest's root,
 * then each root kind a vocabulary's package facet names, once, in facet order.
 */
export const documentRoots: readonly [string, ...string[]] = [
  manifestRoot,
  ...new Set(
    [asi, lom, ud]
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
