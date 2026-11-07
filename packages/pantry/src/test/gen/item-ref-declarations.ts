/**
 * The item-ref-declarations generator (lane NIL): QTI 3.0 content packages whose test holds one
 * item ref, its template defaults and its variable mappings each naming a variable the item ref's
 * item may or may not declare, so `Template default target`, `Template default type`,
 * `Variable mapping source` and `Variable mapping target` (the UP audit's A34, A37 and A38; spec
 * readings 97, 108 and 110) are judged over every way a name can resolve.
 *
 * A package is an {@link ItemRefPackage}:
 *
 * - **what the item ref names** ({@link ItemTarget}): an item the package lists, an LTI link (an
 *   `imslti_xmlv1p1` resource, which QTI 3.0.1 lists and which declares no variable), a path no
 *   resource lists, or an item resource whose file the package lacks;
 * - **its template defaults**, each naming the item's template `T`, its outcome `SCORE`, its response
 *   `R` or the undeclared `U`, with an integer or a float expression;
 * - **its variable mappings**, each naming a source of the same four (`MISSING` for none), and a
 *   target that is a fresh name, the item's other outcome `X`, the source itself, or the session
 *   variable `numAttempts`; a mapping may be read by the test's outcome processing through the item
 *   ref (`a.<target>`), so a mapped reading takes its variable from the mapping's source.
 *
 * The item declares `SCORE` and `X` (single float outcomes), `T` (a single integer template) and
 * `R` (a single identifier response); every other construct of the package is lawful, so the laws
 * in play are the four the generator aims at, the item ref's own (`Item ref target`) and the
 * packaging laws a missing or unlisted file breaks, and the typing of a mapped reading.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * What the item ref's href names.
 */
export type ItemTarget = "item" | "lti" | "missing" | "unlisted";

/**
 * Every {@link ItemTarget}.
 */
export const itemTargets: readonly [ItemTarget, ...ItemTarget[]] = [
  "item",
  "lti",
  "missing",
  "unlisted",
];

/**
 * A name a template default or a mapping's source names: the item's template, outcome or response,
 * or a name the item declares nothing under.
 */
export type Named = "R" | "SCORE" | "T" | "U";

/**
 * Every {@link Named}.
 */
export const nameds: readonly [Named, ...Named[]] = ["T", "SCORE", "R", "U"];

/**
 * The kind of declaration the item declares each name under, `undefined` for none.
 */
export const declaredKinds: Readonly<Record<Named, string | undefined>> = {
  R: "qti-response-declaration",
  SCORE: "qti-outcome-declaration",
  T: "qti-template-declaration",
  U: undefined,
};

/**
 * One template default of the item ref: the template it names and its expression's base type.
 */
export interface TemplateSpec {
  readonly held: "float" | "integer";
  readonly template: Named;
}

/**
 * A mapping's target: a fresh name, the item's other outcome, its source, or a session variable.
 */
export type TargetSpec = "M1" | "M2" | "M3" | "numAttempts" | "same" | "X";

/**
 * One variable mapping of the item ref: its source, its target, and whether the test reads the
 * target through the item ref.
 */
export interface MappingSpec {
  readonly read: boolean;
  readonly source: Named;
  readonly target: TargetSpec;
}

/**
 * One generated package.
 */
export interface ItemRefPackage {
  readonly defaults: readonly TemplateSpec[];
  readonly mappings: readonly MappingSpec[];
  readonly target: ItemTarget;
}

/**
 * The name a mapping's source is written as: `MISSING` for the undeclared name, which no template
 * default writes, so a breach's keys tell the two apart.
 *
 * @param source - The source.
 * @returns The name.
 */
export const sourceName = (source: Named): string => (source === "U" ? "MISSING" : source);

/**
 * The name a mapping's target is written as.
 *
 * @param mapping - The mapping.
 * @returns The name.
 */
export const targetName = (mapping: MappingSpec): string =>
  mapping.target === "same" ? sourceName(mapping.source) : mapping.target;

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XML declaration every generated document opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * The paths the package uses.
 */
export const paths = {
  item: "items/a.xml",
  link: "links/a.xml",
  test: "test.xml",
  unlisted: "items/unlisted.xml",
} as const;

/**
 * The item every item ref that names an item names.
 */
const itemText = [
  declaration,
  `<qti-assessment-item xmlns="${asi}" identifier="a" title="A" adaptive="false" time-dependent="false">`,
  '  <qti-response-declaration identifier="R" cardinality="single" base-type="identifier"/>',
  '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  '  <qti-outcome-declaration identifier="X" cardinality="single" base-type="float"/>',
  '  <qti-template-declaration identifier="T" cardinality="single" base-type="integer"/>',
  "  <qti-item-body><p>A.</p></qti-item-body>",
  "</qti-assessment-item>",
  "",
].join("\n");

/**
 * An LTI 1.1 basic launch link, the content of the LTI resource, which QTI reads as a file only.
 */
const linkText = [
  declaration,
  '<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0" xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0">',
  "  <blti:title>A link</blti:title>",
  "  <blti:launch_url>https://localhost/launch</blti:launch_url>",
  "</cartridge_basiclti_link>",
  "",
].join("\n");

/**
 * The path the item ref's href names, by what it names.
 */
const hrefOf: Readonly<Record<ItemTarget, string>> = {
  item: paths.item,
  lti: paths.link,
  missing: paths.item,
  unlisted: paths.unlisted,
};

/**
 * Write the test: one part, one section, the item ref with its mappings and template defaults, and
 * outcome processing that reads each mapping the package reads through the item ref.
 *
 * @param input - The package.
 * @returns Its text.
 */
const testOf = (input: ItemRefPackage): string => {
  const reads = input.mappings.filter(({ read }) => read);

  return [
    declaration,
    `<qti-assessment-test xmlns="${asi}" identifier="TEST" title="TEST">`,
    '  <qti-outcome-declaration identifier="OUT" cardinality="single" base-type="float"/>',
    '  <qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
    '    <qti-assessment-section identifier="S" title="S" visible="true">',
    `      <qti-assessment-item-ref identifier="a" href="${hrefOf[input.target]}">`,
    ...input.mappings.map(
      (mapping) =>
        `        <qti-variable-mapping source-identifier="${sourceName(mapping.source)}" target-identifier="${targetName(mapping)}"/>`,
    ),
    ...input.defaults.map(
      ({ held, template }) =>
        `        <qti-template-default template-identifier="${template}"><qti-base-value base-type="${held}">${held === "integer" ? "1" : "1.5"}</qti-base-value></qti-template-default>`,
    ),
    "      </qti-assessment-item-ref>",
    "    </qti-assessment-section>",
    "  </qti-test-part>",
    ...(reads.length === 0
      ? []
      : [
          "  <qti-outcome-processing>",
          ...reads.map(
            (mapping) =>
              `    <qti-set-outcome-value identifier="OUT"><qti-variable identifier="a.${targetName(mapping)}"/></qti-set-outcome-value>`,
          ),
          "  </qti-outcome-processing>",
        ]),
    "</qti-assessment-test>",
    "",
  ].join("\n");
};

/**
 * Write the manifest: the test, and the item, the LTI link, or the item whose file is missing, as
 * the package's target says; an unlisted target lists nothing at its path.
 *
 * @param input - The package.
 * @returns Its text.
 */
const manifestOf = (input: ItemRefPackage): string =>
  [
    declaration,
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="ITEM-REF-DECLARATIONS">',
    "  <metadata>",
    "    <schema>QTI Package</schema>",
    "    <schemaversion>3.0.1</schemaversion>",
    "  </metadata>",
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="test" type="imsqti_test_xmlv3p0" href="${paths.test}">`,
    `      <file href="${paths.test}"/>`,
    "    </resource>",
    ...(input.target === "item" || input.target === "missing"
      ? [
          `    <resource identifier="item" type="imsqti_item_xmlv3p0" href="${paths.item}">`,
          `      <file href="${paths.item}"/>`,
          "    </resource>",
        ]
      : []),
    ...(input.target === "lti"
      ? [
          `    <resource identifier="link" type="imslti_xmlv1p1" href="${paths.link}">`,
          `      <file href="${paths.link}"/>`,
          "    </resource>",
        ]
      : []),
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");

/**
 * Build a package's entries: the manifest, the test, and the item or the link where the package
 * holds one. A missing item's file is no entry, and an unlisted path is no entry either.
 *
 * @param input - The package.
 * @returns The entries, by path.
 */
export const itemRefPackageEntries = (input: ItemRefPackage): PackageEntries => {
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifestOf(input))],
    [paths.test, text.encode(testOf(input))],
    ...(input.target === "item" ? [[paths.item, text.encode(itemText)] as const] : []),
    ...(input.target === "lti" ? [[paths.link, text.encode(linkText)] as const] : []),
  ]);
};

/**
 * The package as a short literal, for a search's report.
 *
 * @param input - The package.
 * @returns The literal.
 */
export const itemRefPackageLiteral = (input: ItemRefPackage): string => JSON.stringify(input);

/**
 * Every template default a package may hold.
 */
export const templateSpecs: readonly [TemplateSpec, ...TemplateSpec[]] = [
  { held: "integer", template: "T" },
  ...nameds.flatMap((template) =>
    (["integer", "float"] as const).flatMap((held) =>
      template === "T" && held === "integer" ? [] : [{ held, template }],
    ),
  ),
];

/**
 * Every mapping a package may hold.
 */
export const mappingSpecs: readonly [MappingSpec, ...MappingSpec[]] = [
  { read: false, source: "SCORE", target: "M1" },
  ...nameds.flatMap((source) =>
    (["M1", "X", "same", "numAttempts"] as const).flatMap((target) =>
      [false, true].flatMap((read) =>
        source === "SCORE" && target === "M1" && !read ? [] : [{ read, source, target }],
      ),
    ),
  ),
];

/**
 * The small box: every item ref target with one template default, or one mapping, of every shape:
 * 4 × (8 + 32) = 160 packages, so each law is judged over every name a single element can name,
 * under every target.
 */
export const smallItemRefPackage: Gen<ItemRefPackage> = (source) => {
  const target = source.draw(element(itemTargets));
  const arm = source.draw(element(["default", "mapping"] as const));

  return arm === "default"
    ? { defaults: [source.draw(element(templateSpecs))], mappings: [], target }
    : { defaults: [], mappings: [source.draw(element(mappingSpecs))], target };
};

/**
 * The features a swarm turns on or off for one case.
 */
export const itemRefFeatures = [
  "lti link",
  "unlisted path",
  "missing file",
  "undeclared names",
  "wrong kinds",
  "reads",
  "shared targets",
  "template defaults",
  "mappings",
] as const;

/**
 * One of {@link itemRefFeatures}.
 */
export type ItemRefFeature = (typeof itemRefFeatures)[number];

/**
 * What an item ref names, by the swarm's arm that chose it.
 */
const targetsByFeature = {
  "lti link": "lti",
  mappings: "item",
  "missing file": "missing",
  "unlisted path": "unlisted",
} as const satisfies Readonly<Record<string, ItemTarget>>;

/**
 * The names of the wrong kind for a template default's template and a mapping's source: each a
 * name the item declares under another kind.
 */
const wrongKinds: Readonly<Record<"SCORE" | "T", readonly [Named, ...Named[]]>> = {
  SCORE: ["T", "R"],
  T: ["SCORE", "R"],
};

/**
 * The fresh targets of a swarm's mappings, distinct unless it shares them.
 */
const freshTargets = ["M1", "M2", "M3"] as const;

/**
 * Draw a package under a swarm: up to three template defaults and three mappings, each element's
 * names drawn under the features the swarm keeps, distinct template names and distinct sources.
 *
 * @param drawn - The swarm.
 * @returns The generator.
 */
const swarmedPackageOf =
  (drawn: Swarm<ItemRefFeature>): Gen<ItemRefPackage> =>
  (source) => {
    const itemTarget =
      targetsByFeature[
        swarmChoice(drawn, ["lti link", "unlisted path", "missing file", "mappings"] as const)(
          source,
        )
      ];
    const nameOf = (lawful: "SCORE" | "T"): Named => {
      const arm = swarmChoice(drawn, ["undeclared names", "wrong kinds", "mappings"] as const)(
        source,
      );
      if (arm === "undeclared names") {
        return "U";
      }

      return arm === "wrong kinds" ? source.draw(element(wrongKinds[lawful])) : lawful;
    };
    const defaultCount = keep(drawn, "template defaults")(source) ? source.draw(int(1, 3)) : 0;
    const defaults = Array.from({ length: defaultCount }, () => ({
      held: source.draw(element(["integer", "float"] as const)),
      template: nameOf("T"),
    })).filter(
      (spec, at, all) => all.findIndex(({ template }) => template === spec.template) === at,
    );
    const mappingCount = keep(drawn, "mappings")(source) ? source.draw(int(1, 3)) : 0;
    const mappings = freshTargets
      .slice(0, mappingCount)
      .map((fresh): MappingSpec => ({
        read: keep(drawn, "reads")(source),
        source: nameOf("SCORE"),
        target: keep(drawn, "shared targets")(source)
          ? source.draw(element(["M1", "X", "same", "numAttempts"] as const))
          : fresh,
      }))
      .filter((spec, at, all) => all.findIndex(({ source: held }) => held === spec.source) === at);

    return { defaults, mappings, target: itemTarget };
  };

/**
 * A package drawn under its own swarm over {@link itemRefFeatures}.
 */
export const swarmedItemRefPackage: Gen<{
  readonly input: ItemRefPackage;
  readonly swarm: Swarm<ItemRefFeature>;
}> = (source) => {
  const drawn = source.draw(swarm(itemRefFeatures));

  return { input: source.draw(swarmedPackageOf(drawn)), swarm: drawn };
};
