/**
 * A catalog reference over each assembly (spec readings 117 and R9-a): a `data-catalog-idref` names
 * a `qti-catalog` of the document it is judged in, and a fragment an item includes is judged in the
 * item it is spliced into, so a fragment's reference may name its item's catalog, and a fragment
 * two items include is judged once for each. The law oracle judges the spliced item
 * (`#pantry/test/oracle.ts`); the import's rows are judged by the schema's own laws on the host
 * (`#pantry/test/host-judge.ts`), and the two verdicts must be one.
 *
 * The cases are the audit's `ccat` inputs (F2), built here, a fragment two items include whose
 * catalog only one of them holds, and a test and the section document it places, each naming a
 * catalog in the other's rubric: a test's assembly places its section documents whole, so its
 * reference may name theirs, as "Idref target" may, and a section document's assembly does not
 * place its test.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Option } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { readEntries } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { asi, manifestOf } from "#pantry/test/probe.ts";
import { schemaRulesOf } from "#pantry/test/law-namer.ts";

/**
 * Every law the host judges, read once.
 */
const laws = judgedLaws(Qti);

/**
 * An item that includes `fragment.xml`, with its own markup before the include and, where it holds
 * one, a catalog `C` after its body.
 *
 * @param spec - The item.
 * @param spec.identifier - Its `identifier`.
 * @param spec.before - Markup placed before the include, in the body.
 * @param spec.catalog - Whether it writes a `qti-catalog` with the id `C`.
 * @returns The item's text.
 */
const itemOf = ({
  before,
  catalog,
  identifier,
}: {
  readonly before: string;
  readonly catalog: boolean;
  readonly identifier: string;
}): string => `<qti-assessment-item xmlns:xi="http://www.w3.org/2001/XInclude" xmlns="${asi}" identifier="${identifier}" title="Item" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <p id="intro">Pick one.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  ${before}<xi:include href="fragment.xml"/></qti-item-body>${catalog ? `<qti-catalog-info><qti-catalog id="C"><qti-card support="spoken"><qti-html-content/></qti-card></qti-catalog></qti-catalog-info>` : ""}
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * A fragment: one paragraph holding the given attribute.
 *
 * @param attribute - The paragraph's attribute, as written.
 * @returns The fragment's text.
 */
const fragmentOf = (attribute: string): string => `<div xmlns="${asi}"><p ${attribute}>x</p></div>`;

/**
 * The resource of an item that depends on the fragment.
 *
 * @param identifier - The resource's identifier.
 * @param href - The item's path.
 * @returns The `resource` element.
 */
const itemResourceOf = (identifier: string, href: string): string =>
  `<resource identifier="${identifier}" type="imsqti_item_xmlv3p0" href="${href}"><file href="${href}"/><dependency identifierref="F"/></resource>`;

/**
 * The fragment's resource.
 */
const fragmentResource = `<resource identifier="F" type="imsqti_fragment_xmlv3p0" href="fragment.xml"><file href="fragment.xml"/></resource>`;

/**
 * A package's files as entries.
 *
 * @param files - Each path's text.
 * @returns The entries.
 */
const entriesOf = (files: Readonly<Record<string, string>>): PackageEntries =>
  new Map(Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)]));

/**
 * A package of one item that includes the fragment.
 *
 * @param spec - The package.
 * @param spec.before - Markup the item places before the include.
 * @param spec.catalog - Whether the item holds the catalog.
 * @param spec.fragment - The fragment's paragraph attribute.
 * @returns The package's files.
 */
const onePackage = ({
  before,
  catalog,
  fragment,
}: {
  readonly before: string;
  readonly catalog: boolean;
  readonly fragment: string;
}) =>
  entriesOf({
    "fragment.xml": fragmentOf(fragment),
    "imsmanifest.xml": manifestOf(`${itemResourceOf("R", "item.xml")}${fragmentResource}`),
    "item.xml": itemOf({ before, catalog, identifier: "item" }),
  });

/**
 * A rubric block holding a paragraph with the given attribute and, where it holds one, a catalog
 * `C`.
 *
 * @param spec - The rubric.
 * @param spec.attribute - The paragraph's attribute, as written.
 * @param spec.catalog - Whether it writes a `qti-catalog` with the id `C`.
 * @returns The `qti-rubric-block` element.
 */
const rubricOf = ({
  attribute,
  catalog,
}: {
  readonly attribute: string;
  readonly catalog: boolean;
}): string =>
  `<qti-rubric-block use="instructions" view="candidate"><qti-content-body><p ${attribute}>Rubric.</p></qti-content-body>${catalog ? `<qti-catalog-info><qti-catalog id="C"><qti-card support="spoken"><qti-html-content/></qti-card></qti-catalog></qti-catalog-info>` : ""}</qti-rubric-block>`;

/**
 * Replace the one occurrence of a text in an entry of a package.
 *
 * @param entries - The package's entries.
 * @param path - The entry.
 * @param search - The text, which must occur exactly once.
 * @param replacement - Its replacement.
 * @returns The entries, that entry edited.
 */
const replaced = (
  entries: PackageEntries,
  path: string,
  search: string,
  replacement: string,
): PackageEntries => {
  const text = new TextDecoder().decode(entries.get(path));
  assert.lengthOf(text.split(search), 2, `${path}: ${search}`);

  return new Map([
    ...entries,
    [path, new TextEncoder().encode(text.replace(search, () => replacement))],
  ]);
};

/**
 * A package of a test and the section document it places, each with a rubric: the test's in its
 * first section, after its ordering, the section document's before its item ref.
 *
 * @param spec - The package.
 * @param spec.section - The section document's rubric.
 * @param spec.test - The test's rubric.
 * @returns The package's entries.
 */
const testPackage = ({
  section,
  test,
}: {
  readonly section: Parameters<typeof rubricOf>[0];
  readonly test: Parameters<typeof rubricOf>[0];
}): PackageEntries =>
  replaced(
    replaced(
      everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
      "test.xml",
      '<qti-ordering shuffle="true"/>\n',
      `<qti-ordering shuffle="true"/>\n      ${rubricOf(test)}\n`,
    ),
    "section.xml",
    '  <qti-assessment-item-ref identifier="placedItem"',
    `  ${rubricOf(section)}\n  <qti-assessment-item-ref identifier="placedItem"`,
  );

/**
 * One case: a package and the rule both judges must give, or `accepted`.
 */
interface CatalogCase {
  readonly expected: string;
  readonly files: PackageEntries;
  readonly name: string;
}

const cases: readonly CatalogCase[] = [
  {
    expected: "accepted",
    files: onePackage({ before: "", catalog: true, fragment: 'data-catalog-idref="C"' }),
    name: "a fragment's reference names its item's catalog",
  },
  {
    expected: "accepted",
    files: onePackage({
      before: '<p data-catalog-idref="C">b</p>',
      catalog: true,
      fragment: "",
    }),
    name: "an item's reference names its own catalog, and its fragment writes none",
  },
  {
    expected: "accepted",
    files: onePackage({ before: "", catalog: true, fragment: 'aria-labelledby="intro"' }),
    name: "a fragment's IDREF names its item's id",
  },
  {
    expected: "idref-target",
    files: onePackage({ before: "", catalog: true, fragment: 'data-catalog-idref="Z"' }),
    name: "a fragment's reference names no catalog of its item",
  },
  {
    expected: "idref-target",
    files: entriesOf({
      "fragment.xml": fragmentOf('data-catalog-idref="C"'),
      "imsmanifest.xml": manifestOf(
        `${itemResourceOf("R", "item.xml")}${itemResourceOf("R2", "item2.xml")}${fragmentResource}`,
      ),
      "item.xml": itemOf({ before: "", catalog: true, identifier: "item" }),
      "item2.xml": itemOf({ before: "", catalog: false, identifier: "item2" }),
    }),
    name: "a fragment two items include, one holding the catalog and one not",
  },
  {
    expected: "accepted",
    files: entriesOf({
      "fragment.xml": fragmentOf('data-catalog-idref="C"'),
      "imsmanifest.xml": manifestOf(
        `${itemResourceOf("R", "item.xml")}${itemResourceOf("R2", "item2.xml")}${fragmentResource}`,
      ),
      "item.xml": itemOf({ before: "", catalog: true, identifier: "item" }),
      "item2.xml": itemOf({ before: "", catalog: true, identifier: "item2" }),
    }),
    name: "a fragment two items include, both holding the catalog",
  },
  {
    expected: "accepted",
    files: testPackage({
      section: { attribute: "", catalog: true },
      test: { attribute: 'data-catalog-idref="C"', catalog: false },
    }),
    name: "a test's reference names the catalog of a section document it places",
  },
  {
    expected: "idref-target",
    files: testPackage({
      section: { attribute: 'data-catalog-idref="C"', catalog: false },
      test: { attribute: "", catalog: true },
    }),
    name: "a section document's reference names the catalog of the test that places it",
  },
  {
    expected: "idref-target",
    files: testPackage({
      section: { attribute: "", catalog: true },
      test: { attribute: 'data-catalog-idref="Z"', catalog: false },
    }),
    name: "a test's reference names no catalog of the test or of a section document it places",
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a catalog reference over each assembly",
  (it) => {
    it.effect(
      "gives the verdict of the law oracle and of the import's rows alike, and the one each case names",
      () =>
        Effect.gen(function* everyCase() {
          for (const { expected, files, name } of cases) {
            yield* Effect.scoped(
              Effect.gen(function* oneCase() {
                const dir = yield* scopedPackage(files);
                const verdict = yield* oracleVerdict(yield* readEntries(dir));
                const program = yield* readProgram(dir);
                const { broken } = judge(hostRowsOf(program.inputs), laws);
                const [first, ...rest] = broken.map(({ law }) => law);
                const rule =
                  first === undefined
                    ? "accepted"
                    : Option.getOrElse(Arr.head(schemaRulesOf([first, ...rest])), () => "unnamed");
                const rules = verdict.kind === "accepted" ? new Set(["accepted"]) : verdict.rules;
                const shown = `${name}: the import's rows give ${rule} (${broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law"}), the oracle ${Formatter.format([...rules])}`;
                assert.isTrue(rules.has(rule), shown);
                assert.strictEqual(rule, expected, shown);
              }),
            );
          }
        }),
    );
  },
);
