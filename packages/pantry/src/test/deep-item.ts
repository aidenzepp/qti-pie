/**
 * A package of one item whose body nests divs as deep as a test asks: QTI 3.0's XSD lets a `div`
 * hold a `div` without end, so the item is valid at every depth, and its text stands `divs` + 2
 * elements deep, under the item and its body.
 */

/**
 * The path of the item in its package.
 */
export const deepItemPath = "item.xml";

/**
 * The package's manifest: one item resource, at {@link deepItemPath}.
 */
export const deepManifest: Uint8Array = new TextEncoder().encode(
  `<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="m"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="deep" type="imsqti_item_xmlv3p0" href="${deepItemPath}"><file href="${deepItemPath}"/></resource></resources></manifest>`,
);

/**
 * An item whose body nests `divs` divs, the innermost holding text.
 *
 * @param divs - The divs in the chain, at least 1.
 * @returns The item's bytes.
 */
export const deepItem = (divs: number): Uint8Array =>
  new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8"?><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="deep" title="deep" adaptive="false" time-dependent="false"><qti-item-body>${"<div>".repeat(divs)}deep${"</div>".repeat(divs)}</qti-item-body></qti-assessment-item>`,
  );
