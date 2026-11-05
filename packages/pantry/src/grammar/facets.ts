/**
 * Each vocabulary's share of the grammar: the facts the generators read about a vocabulary's kinds,
 * stated as data and kept out of the generators, so that every generator is a function of the
 * vocabulary list it composes (plan §1.1, R4 of the W1 to W4 review).
 *
 * A vocabulary's facets are its interactions; its ancestry blocks; its content-model edits and
 * count laws; its barrings and last-slot rules; its expression arities and response bindings; its
 * package relations; and its references. Each fact belongs to the vocabulary of the parent kind it
 * is stated under, or of the kind it is about. A vocabulary with no fact of a facet states it
 * empty, so every vocabulary states every facet.
 *
 * A class a law reads is projected from the XSDs' IR (the content models and attribute declarations
 * of `src/vocab/inventory/`), never listed by hand: the interactions, the expression kinds and
 * their arities, the resource types and the references. What the XSDs do not state is a spec
 * reading, stated here with its source.
 */
import { Array as Arr, Option, pipe } from "effect";
import type { AncestryFacet, Block } from "#pantry/grammar/ancestry.ts";
import type { ChildFacet } from "#pantry/grammar/children.ts";
import type { ContentFacet } from "#pantry/grammar/content.ts";
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
  content: { edits: [], models: [] },
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
      {
        attribute: "shape",
        kind: "qti-associable-hotspot",
        parents: ["qti-graphic-associate-interaction", "qti-graphic-gap-match-interaction"],
        source:
          "information model §5.7, AssociableHotspot: 'The default hotspot, if defined, must appear last'",
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
  },
};

/**
 * Where a restated MathML model comes from: spec reading 2 and the MathML 3 RelaxNG line it reads,
 * once per version.
 *
 * @param line - The line of `mathml3-content.rnc` (https://www.w3.org/Math/RelaxNG/mathml3/).
 * @param section - The Recommendation's section whose syntax table and prose state the same.
 * @returns The source, once per version.
 */
const relaxNg = (line: number, section: string): Sources =>
  cited(
    `spec reading 2: MathML 3 RelaxNG, mathml3-content.rnc line ${String(line)}; MathML 3 ${section}`,
  );

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
 * `bvar = element bvar {CommonAtt, ((ci | semantics-ci) & degree?)}` (line 23): one annotated
 * variable and at most one degree, in either order, which the XSD's trang translation widens to
 * `(ci | semantics | degree)*` (`mathml3-content.xsd` lines 46-57). Restated as the interleave's
 * language, `(ci | semantics) degree? | degree (ci | semantics)`, which Unique Particle Attribution
 * keeps deterministic: the first child chooses the branch.
 */
const bvarModel = (() => {
  const sources = relaxNg(
    23,
    "§4.2.6.2 Bound Variables (Content: `(ci | semantics-ci), degree? | degree?, (ci | semantics-ci)`)",
  );
  const variable = mathParticle(["m:ci", "m:semantics"], 1, Option.some(1), sources);

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
  const sources = relaxNg(60, "§4.4.1.9 Piecewise declaration");

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
 * MathML's facets: spec reading 2's two content models the MathML 3 RelaxNG schema states as
 * interleaves (`&`), which an XSD cannot, restated whole (`content.ts`, the `restate` edit).
 */
export const mathml: Facets = {
  ...noFacets,
  content: {
    edits: [
      { _tag: "restate", parent: "m:bvar", particle: bvarModel, source: "spec reading 2" },
      {
        _tag: "restate",
        parent: "m:piecewise",
        particle: piecewiseModel,
        source: "spec reading 2",
      },
    ],
    models: [],
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
  },
};
