/**
 * The packages of nine known classes of upstream's genetic repair round 4 (`284e13ab`'s
 * `test/gen/genetic/known.ts`; decisions 449, 463 and 467, issues #65 and #68), for the database's
 * box (`#pantry/import/record-naming.db.test.ts`). Each class turns on the document a resource's
 * LOM record names, which on Qti only rules over queries read (`#pantry/qti/queries.ts`:
 * `namingRecords`, read by `lom-identifier` and `lom-title`), and the host's judge leaves every
 * rule over a query unknown (`#pantry/test/gen/genetic/host-laws.ts`), so the genetic differential
 * never shows one of them and only PostgreSQL judges them.
 *
 * Each package is upstream's, file for file, keyed by its class's signature as upstream's known
 * table keys it; {@link encodedHrefMistitled} is issue #65's class with nothing else broken.
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * One file of a package: its path, and its text, or its bytes in base64 where it is no XML, as
 * upstream's known table writes it.
 */
type UpstreamFile = readonly [path: string, form: "b64" | "xml", content: string];

/**
 * Build a package from its files.
 *
 * @param files - The files.
 * @returns The package, each XML file's text encoded as UTF-8 and each other file's bytes decoded
 *   from base64.
 */
const packageOf = (files: readonly UpstreamFile[]): PackageEntries =>
  new Map(
    files.map(([path, form, content]) => [
      path,
      form === "xml" ? new TextEncoder().encode(content) : Uint8Array.fromBase64(content),
    ]),
  );

/**
 * The nine classes' packages, each keyed by its class's signature in upstream's known table: E1
 * derived over `GeneralObject` and `LomObject`, two relations Qti does not have (two packages);
 * `LomObjectIdentifier` (two) and `LomObjectTitle` (three), each under the stated limit its key
 * names (spec reading 1); the law oracle alone raising `LomObjectTitle`; and the import naming
 * `lom-identifier` where the law oracle names `root-type-reverse`.
 */
export const upstreamPackages = {
  "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record, document) (under a record file whose root is a cp:manifest)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"/>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/><resource type="resourcemetadata/xml" href="meta/choice.xml"/></resources></manifest>',
      ],
      [
        "meta/choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general/></imsmd:lom></metadata></resource></resources></manifest>',
      ],
    ]),
  "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record, document) (under xml:base on a cp:resource)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general/></imsmd:lom></metadata></resource></resources></manifest>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource xml:base="sub/"/><resource type="resourcemetadata/xml" href="%63hoice.xml"/></resources></manifest>',
      ],
    ]),
  "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in LomObjectIdentifier(record) (under a record file whose root is a cp:manifest)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/><resource type="resourcemetadata/xml" href="meta/choice.xml"/></resources></manifest>',
      ],
      [
        "meta/choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>',
      ],
    ]),
  "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in LomObjectIdentifier(record) (under xml:base on a cp:resource)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource xml:base="sub/"/><resource type="resourcemetadata/xml" href="%63hoice.xml"/></resources></manifest>',
      ],
    ]),
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under a record file whose root is a cp:manifest)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/><resource type="resourcemetadata/xml" href="meta/choice.xml"/></resources></manifest>',
      ],
      [
        "meta/choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>',
      ],
    ]),
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under a resource href the oracle reads unresolved (#65))":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"/>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="%63hoice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>',
      ],
    ]),
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under xml:base on a cp:resource)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<lom xmlns="http://ltsc.ieee.org/xsd/LOM"/>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="../choice.xml" xml:base="passages/"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>',
      ],
    ]),
  "lone-refusal: RootOfType named lom-identifier, witness unreported (under a record file whose root is a cp:manifest)":
    packageOf([
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="choice" title="Unattended Luggage" time-dependent="false"/>',
      ],
      [
        "images/sign.png",
        "b64",
        "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",
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><file href="choice.xml"/><file href="images/sign.png"/></resource><resource identifier="choice-meta" type="resourcemetadata/xml" href="meta/choice.xml"><file href="meta/choice.xml"/></resource></resources></manifest>',
      ],
      [
        "meta/choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata><file href="images/sign.png"/></resource></resources></manifest>',
      ],
    ]),
  "oracle-only-law: LomObjectTitle": packageOf([
    [
      "imsmanifest.xml",
      "xml",
      '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="meta/choice.xml" xml:base="sub/"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource><resource type="resourcemetadata/xml" href="meta/choice.xml"/></resources></manifest>',
    ],
    [
      "meta/choice.xml",
      "xml",
      '<?xml version="1.0" encoding="UTF-8"?>\n<lom xmlns="http://ltsc.ieee.org/xsd/LOM"/>',
    ],
  ]),
};

/**
 * A class of {@link upstreamPackages}, by its signature.
 */
export type UpstreamClass = keyof typeof upstreamPackages;

/**
 * Issue #65's class with its law alone: the item resource's `href` percent-encodes the item's path
 * (`%63hoice.xml`, which names `choice.xml`, RFC 3986 §2.1) and its own record's general title is
 * another than the item's, while the resource lists the item's file and the item's root is an item.
 * Upstream's package of the class also breaks laws that can fail first, among them "RootOfType"
 * (its `choice.xml` is a `cp:manifest`) and "Href listed" (its resource lists no file), and
 * PostgreSQL names only the first constraint that fails, so this package is the one whose refusal
 * shows that the title law reads the document the decoded `href` names (QTI 3.0 Metadata §2.7.1.2).
 */
export const encodedHrefMistitled = packageOf([
  [
    "choice.xml",
    "xml",
    '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="choice" title="Unattended Luggage" time-dependent="false"/>',
  ],
  [
    "imsmanifest.xml",
    "xml",
    '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="%63hoice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:title><imsmd:string>Something else</imsmd:string></imsmd:title></imsmd:general></imsmd:lom></metadata><file href="choice.xml"/></resource></resources></manifest>',
  ],
]);
