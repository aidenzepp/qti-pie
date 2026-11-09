/**
 * The packages of an item whose response processing includes a response rules fragment, for the
 * oracle's box (`#pantry/qti/placed-types.oracle.test.ts`) and the database's
 * (`#pantry/import/placed-types.db.test.ts`): a fragment's references are typed in the item that
 * includes it (spec reading 117), a map response by its declaration's mapping ("Mapped response",
 * reading 166) and a variable reference that is a whole condition by its declaration's type
 * ("Condition type", P21). Genetic repair round 4's inventory (research aeced65a, classes O18 and
 * O38) found the import accepting both.
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * The text every XML file of the cases opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';

/**
 * The assessment items namespace declaration, which an item and a fragment root each write.
 */
const asi = 'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"';

/**
 * The manifest that lists the item, and with `fragment` the rules fragment it includes.
 *
 * @param fragment - Whether the manifest lists rules.xml.
 * @returns The manifest's text.
 */
const manifestOf = (fragment: boolean): string =>
  `${declaration}<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R1" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>${fragment ? '<resource identifier="R2" type="imsqti_fragment_xmlv3p0" href="rules.xml"><file href="rules.xml"/></resource>' : ""}</resources></manifest>`;

/**
 * The item whose one response, RESPONSE, a choice interaction sets, its response processing's
 * content `rules`.
 *
 * @param mapping - The response declaration's mapping as written, empty for none.
 * @param rules - The response processing's content.
 * @returns The item's text.
 */
const itemOf = (mapping: string, rules: string): string =>
  `${declaration}<qti-assessment-item ${asi} xmlns:xi="http://www.w3.org/2001/XInclude" identifier="i1" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>A</qti-value></qti-correct-response>${mapping}</qti-response-declaration><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">a</qti-simple-choice><qti-simple-choice identifier="B">b</qti-simple-choice></qti-choice-interaction></qti-item-body><qti-response-processing>${rules}</qti-response-processing></qti-assessment-item>`;

/**
 * The response condition that sets SCORE to 1 where `condition` holds, its root declaring the
 * namespace as `attributes` give it.
 *
 * @param condition - The response if's condition.
 * @param attributes - The condition's attributes as written, empty for none.
 * @returns The condition's text.
 */
const conditionOf = (condition: string, attributes: string): string =>
  `<qti-response-condition${attributes}><qti-response-if>${condition}<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>`;

/**
 * A condition that RESPONSE's mapped value exceeds 0.
 */
export const mapped =
  '<qti-gt><qti-map-response identifier="RESPONSE"/><qti-base-value base-type="float">0</qti-base-value></qti-gt>';

/**
 * A condition that is RESPONSE itself, an identifier single, which is no boolean.
 */
export const bare = '<qti-variable identifier="RESPONSE"/>';

/**
 * A condition that RESPONSE matches its correct value, a boolean single.
 */
export const matched =
  '<qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>';

/**
 * A mapping of RESPONSE: A maps to 1.
 */
export const mapping =
  '<qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>';

/**
 * The package of the files given, each path's text encoded as UTF-8.
 *
 * @param files - Each file's text, by its path.
 * @returns The package.
 */
const packageOf = (files: Readonly<Record<string, string>>): PackageEntries =>
  new Map(
    Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

/**
 * The package whose item includes the rules fragment that tests `condition`, its response declaring
 * `withMapping`.
 *
 * @param withMapping - The response declaration's mapping as written, empty for none.
 * @param condition - The fragment's condition.
 * @returns The package.
 */
export const includingOf = (withMapping: string, condition: string): PackageEntries =>
  packageOf({
    "imsmanifest.xml": manifestOf(true),
    "item.xml": itemOf(withMapping, '<xi:include href="rules.xml"/>'),
    "rules.xml": `${declaration}${conditionOf(condition, ` ${asi}`)}`,
  });

/**
 * The package whose item tests `condition` in its own response processing, its response declaring
 * no mapping.
 *
 * @param condition - The condition.
 * @returns The package.
 */
export const inlineOf = (condition: string): PackageEntries =>
  packageOf({
    "imsmanifest.xml": manifestOf(false),
    "item.xml": itemOf("", conditionOf(condition, "")),
  });
