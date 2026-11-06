import { assert } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf, shownBreach } from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
export const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
export const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item and test element.
 */
export const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write a manifest that lists its resources under one schema version.
 *
 * @param resources - The `resource` elements, as written.
 * @param version - The `schemaversion` it declares.
 * @returns The manifest's text.
 */
export const manifestOf = (resources: string, version = "3.0.1"): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion></metadata>
  <organizations/>
  <resources>${resources}</resources>
</manifest>`;

/**
 * The one resource of the base package: the item `item.xml`.
 */
export const itemResource = `<resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>`;

/**
 * The base item: one choice interaction bound to an identifier response, scored by matching it.
 */
export const item = `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">
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
  </qti-item-body>
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
 * The base test: one part, one section selecting from its one item reference.
 */
export const test = `<qti-assessment-test xmlns="${asi}" identifier="T" title="Test">
  <qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">
    <qti-assessment-section identifier="S" title="Section" visible="true">
      <qti-selection select="1"/>
      <qti-assessment-item-ref identifier="I" href="item.xml"/>
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`;

/**
 * Build a package from its files' texts, each encoded as UTF-8, as `readPackage` returns one.
 *
 * @param files - Each file's text by path; `imsmanifest.xml` is the manifest.
 * @returns The entries, sorted by path.
 */
export const packageOf = (files: Readonly<Record<string, string>>): readonly PackageFile[] =>
  Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));

/**
 * The base package: the manifest and the base item.
 */
export const base = { "imsmanifest.xml": manifestOf(itemResource), "item.xml": item };

/**
 * Judge a package built from its files' texts.
 *
 * @param files - Each file's text by path.
 * @returns The judgment.
 */
export const judged = (files: Readonly<Record<string, string>>) =>
  judge(packageOf(files), grammar, laws);

/**
 * Read the breaches of a judgment the codec did not refuse.
 *
 * @param judgment - The judgment.
 * @returns Its breaches.
 */
export const breachesOf = (judgment: Judgment): readonly Breach[] =>
  judgment._tag === "Judged"
    ? judgment.breaches
    : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);

/**
 * Write a judgment's breaches as `law: rule` lines, for an assertion's message.
 *
 * @param breaches - The breaches.
 * @returns One line per breach.
 */
export const shown = (breaches: readonly Breach[]): string =>
  breaches.map((breach) => shownBreach(breach, grammar)).join("\n");

/**
 * Replace one passage of a text, failing when the text does not hold it, so a case never tests an
 * edit that did not happen.
 *
 * @param text - The text.
 * @param passage - The passage to replace.
 * @param replacement - What replaces it.
 * @returns The edited text.
 */
export const edit = (text: string, passage: string, replacement: string): string => {
  assert.include(text, passage, "the edit's passage is in the text");

  return text.replace(passage, replacement);
};

/**
 * Edit the base item.
 *
 * @param passage - The passage to replace.
 * @param replacement - What replaces it.
 * @returns The base package with the item edited.
 */
export const withItem = (passage: string, replacement: string) => ({
  ...base,
  "item.xml": edit(item, passage, replacement),
});

/**
 * Judge the base item edited, and decide whether a law refuses it.
 *
 * @param law - The law.
 * @param edits - Each passage of the base item and its replacement, applied in order.
 * @returns Whether a breach of the law is among the judgment's, with every breach for a message.
 */
export const refusedBy = (law: LawName, ...edits: readonly (readonly [string, string])[]) =>
  Effect.gen(function* refused() {
    let text = item;
    for (const [passage, replacement] of edits) {
      text = edit(text, passage, replacement);
    }

    const files = { ...base, "item.xml": text };
    const breaches = breachesOf(yield* judged(files));

    return { breaches: shown(breaches), held: breaches.some((breach) => breach.law === law) };
  });
