/**
 * The genetic differential's known disagreements (`src/test/genetic.oracle.test.ts`): each class of
 * disagreement the search has met that a lane owns, keyed by its signature
 * (`#pantry/test/gen/genetic/judge.ts` `signatureOf`), with the lane that owns its fix, the fix it
 * waits on, and a package, reduced by the search, that shows it.
 *
 * The search fails on a class no entry records, and every run judges each entry's package on its
 * own and fails on an entry whose package no longer shows its class: the commit that lands an
 * owner's fix deletes the entries it closes, or moves them to {@link fixed}, whose packages must
 * never show their class again. An entry records a class, never a package: a fix that leaves the
 * class showing elsewhere keeps the entry, with a package that still shows it.
 *
 * A class spec reading 1 lists as a stated limit waits on no fix: its entry's owner is the decision
 * that states it, its fix what would lift it, and it stays while the limit stands.
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import type { Noise } from "#pantry/test/gen/genetic/noise.ts";

/**
 * Who owns a disagreement's fix: the lane, and the fix it waits on.
 */
export interface Owned {
  readonly fix: string;
  readonly owner: string;
}

/**
 * One file of a known package: its path, and its text, or its bytes in base64 where it is no XML.
 */
type KnownFile = readonly [path: string, form: "b64" | "xml", content: string];

/**
 * One known disagreement, or one a fix closed: its owner, the fix, its package's files, and, for a
 * noise's class, the noise and salt that make its package's noised twin.
 */
export interface Known extends Owned {
  readonly files: readonly KnownFile[];
  /**
   * The noise and salt of a `noise-moved` class: such a class shows only beside its package's
   * noised twin, as the search judges it, so the check judges the twin too.
   */
  readonly noised?: { readonly noise: Noise; readonly salt: number };
}

/**
 * A table of known or fixed disagreements, each keyed by its signature.
 */
export type Entries = Readonly<Record<string, Known>>;

/**
 * A known entry's package, as the reader takes it.
 *
 * @param known - The entry.
 * @returns Its package's entries.
 */
export const knownEntries = (known: Known): PackageEntries =>
  new Map(
    known.files.map(([path, form, content]) => [
      path,
      form === "xml" ? new TextEncoder().encode(content) : Uint8Array.fromBase64(content),
    ]),
  );

/**
 * The known disagreements, keyed by signature.
 */
export const known = {
  "import-only-law: Branch target, contained BranchResolution(instance, rule, target) in BranchTarget(instance, rule, target)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref identifier="ref2"><qti-branch-rule target=""/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): an empty branch rule target still writes its BranchResolution row, which Branch target wants in BranchTarget on the import's side alone; value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
      owner: "decision 463",
    },
  'import-only-law: Choice identifier key, {"kind":"key","side":{"relation":"Choice","terms":[{"kind":"field","field":"document"},{"kind":"field","field":"kind"},{"kind":"field","field":"identifier"}],"selection":{"conjuncts":[]}}}':
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-choice-interaction><qti-simple-choice identifier="Kéééxéxxxééxx𝔸x𝔸𝔸éé𝔸é語xxé𝔸𝔸語語語語𝔸語語ééxxxé語x𝔸é𝔸𝔸éé𝔸é語𝔸éé𝔸é語𝔸語𝔸語x語é語𝔸é𝔸é語xé語éxéxéé語x𝔸𝔸語𝔸語語éxééé𝔸ééx語語xx語𝔸𝔸語語éxx語é𝔸語é𝔸éxéx語x𝔸語é語語éxx語語語é語𝔸é語é語語éxéx語𝔸x語𝔸xé語xx𝔸é語xééxx語𝔸語éx𝔸é𝔸語語é語語語é語xéé𝔸é𝔸x𝔸x語語𝔸𝔸x𝔸語éé語éé語𝔸𝔸𝔸xxé𝔸語語𝔸語x𝔸𝔸𝔸x語xéééé𝔸語𝔸語x語xé𝔸𝔸éx𝔸語語𝔸語x𝔸𝔸ééx語ééx𝔸éé𝔸x語𝔸é𝔸é𝔸語éé語𝔸x語𝔸語é𝔸𝔸éx𝔸𝔸𝔸語𝔸x𝔸x語𝔸xx𝔸x語éx𝔸x𝔸xx語é𝔸x𝔸éééxé𝔸xéxé語éxx語語語é𝔸é𝔸xx𝔸語語xx𝔸x𝔸x語語語é𝔸éx語語xxé語語xé𝔸語x𝔸𝔸xé語x𝔸x𝔸𝔸𝔸xéé𝔸xéxé𝔸𝔸語x𝔸𝔸éééxé𝔸語語語é語x語語é𝔸x𝔸語語xéxxx𝔸𝔸𝔸語𝔸語𝔸𝔸𝔸é語𝔸𝔸語xx語é語語語語𝔸é語𝔸éé𝔸語𝔸𝔸é語é語𝔸語𝔸𝔸𝔸語語x𝔸𝔸語語é𝔸𝔸語xx語xx語語é𝔸é𝔸𝔸xéx語xéxx語語x𝔸𝔸語𝔸éx語x語xé語xééxx語éé𝔸𝔸語語語語é語𝔸x語x語𝔸x語x語é語xx𝔸é語語語𝔸語xx𝔸語語xéé語語éé語éx語é𝔸éx𝔸語xxéxéx𝔸xé語é語é𝔸xé𝔸xé𝔸éxx𝔸語é𝔸𝔸é𝔸𝔸x語x語xéxxé語語語é語𝔸éx語x𝔸語ééé語é語xéxéx語é𝔸𝔸xéx語語𝔸xxé語x語語語xxx𝔸é𝔸語𝔸語語é語語xx語xéxééé語x𝔸xxx𝔸語é語語é語語éé𝔸x𝔸xé語xxxéxé語𝔸éé𝔸é𝔸𝔸語𝔸語x𝔸xx𝔸x𝔸x𝔸語é𝔸𝔸語xé𝔸語xxx語語語𝔸語語𝔸xxé𝔸xxx𝔸xx語é語é𝔸é𝔸語語𝔸éx語éééééé語xx𝔸éxx𝔸語𝔸語語語éxéx𝔸語語𝔸𝔸éx𝔸é𝔸xéééx𝔸é語x𝔸ééé𝔸𝔸xéx語x𝔸語語𝔸𝔸xé語xx𝔸語𝔸éééé語éx𝔸é語𝔸xx語x語𝔸語éxéé𝔸éx𝔸xxé𝔸語é語語𝔸語語語xééééx語𝔸𝔸xé語éx𝔸x語xx語x𝔸xxéééx𝔸x語語語xxé語𝔸é語𝔸xé語𝔸éx𝔸x𝔸x語ééé𝔸ééé語語é語éxxx語x𝔸𝔸é語é𝔸語xxxé𝔸éx語éé𝔸éx語éxéé語語x𝔸xéx語é𝔸𝔸x𝔸語語x語語語𝔸語語x語𝔸𝔸éx語éxéx𝔸語xxx𝔸𝔸x𝔸xx語語語𝔸x語語x𝔸語語𝔸éx語é語語xééééx語𝔸éxé語éx𝔸x𝔸é𝔸語éxx𝔸xxééxxxxxxé𝔸x語語𝔸𝔸𝔸𝔸𝔸x𝔸é語é𝔸𝔸xxx"/><qti-simple-choice identifier="Kéééxéxxxééxx𝔸x𝔸𝔸éé𝔸é語xxé𝔸𝔸語語語語𝔸語語ééxxxé語x𝔸é𝔸𝔸éé𝔸é語𝔸éé𝔸é語𝔸語𝔸語x語é語𝔸é𝔸é語xé語éxéxéé語x𝔸𝔸語𝔸語語éxééé𝔸ééx語語xx語𝔸𝔸語語éxx語é𝔸語é𝔸éxéx語x𝔸語é語語éxx語語語é語𝔸é語é語語éxéx語𝔸x語𝔸xé語xx𝔸é語xééxx語𝔸語éx𝔸é𝔸語語é語語語é語xéé𝔸é𝔸x𝔸x語語𝔸𝔸x𝔸語éé語éé語𝔸𝔸𝔸xxé𝔸語語𝔸語x𝔸𝔸𝔸x語xéééé𝔸語𝔸語x語xé𝔸𝔸éx𝔸語語𝔸語x𝔸𝔸ééx語ééx𝔸éé𝔸x語𝔸é𝔸é𝔸語éé語𝔸x語𝔸語é𝔸𝔸éx𝔸𝔸𝔸語𝔸x𝔸x語𝔸xx𝔸x語éx𝔸x𝔸xx語é𝔸x𝔸éééxé𝔸xéxé語éxx語語語é𝔸é𝔸xx𝔸語語xx𝔸x𝔸x語語語é𝔸éx語語xxé語語xé𝔸語x𝔸𝔸xé語x𝔸x𝔸𝔸𝔸xéé𝔸xéxé𝔸𝔸語x𝔸𝔸éééxé𝔸語語語é語x語語é𝔸x𝔸語語xéxxx𝔸𝔸𝔸語𝔸語𝔸𝔸𝔸é語𝔸𝔸語xx語é語語語語𝔸é語𝔸éé𝔸語𝔸𝔸é語é語𝔸語𝔸𝔸𝔸語語x𝔸𝔸語語é𝔸𝔸語xx語xx語語é𝔸é𝔸𝔸xéx語xéxx語語x𝔸𝔸語𝔸éx語x語xé語xééxx語éé𝔸𝔸語語語語é語𝔸x語x語𝔸x語x語é語xx𝔸é語語語𝔸語xx𝔸語語xéé語語éé語éx語é𝔸éx𝔸語xxéxéx𝔸xé語é語é𝔸xé𝔸xé𝔸éxx𝔸語é𝔸𝔸é𝔸𝔸x語x語xéxxé語語語é語𝔸éx語x𝔸語ééé語é語xéxéx語é𝔸𝔸xéx語語𝔸xxé語x語語語xxx𝔸é𝔸語𝔸語語é語語xx語xéxééé語x𝔸xxx𝔸語é語語é語語éé𝔸x𝔸xé語xxxéxé語𝔸éé𝔸é𝔸𝔸語𝔸語x𝔸xx𝔸x𝔸x𝔸語é𝔸𝔸語xé𝔸語xxx語語語𝔸語語𝔸xxé𝔸xxx𝔸xx語é語é𝔸é𝔸語語𝔸éx語éééééé語xx𝔸éxx𝔸語𝔸語語語éxéx𝔸語語𝔸𝔸éx𝔸é𝔸xéééx𝔸é語x𝔸ééé𝔸𝔸xéx語x𝔸語語𝔸𝔸xé語xx𝔸語𝔸éééé語éx𝔸é語𝔸xx語x語𝔸語éxéé𝔸éx𝔸xxé𝔸語é語語𝔸語語語xééééx語𝔸𝔸xé語éx𝔸x語xx語x𝔸xxéééx𝔸x語語語xxé語𝔸é語𝔸xé語𝔸éx𝔸x𝔸x語ééé𝔸ééé語語é語éxxx語x𝔸𝔸é語é𝔸語xxxé𝔸éx語éé𝔸éx語éxéé語語x𝔸xéx語é𝔸𝔸x𝔸語語x語語語𝔸語語x語𝔸𝔸éx語éxéx𝔸語xxx𝔸𝔸x𝔸xx語語語𝔸x語語x𝔸語語𝔸éx語é語語xééééx語𝔸éxé語éx𝔸x𝔸é𝔸語éxx𝔸xxééxxxxxxé𝔸x語語𝔸𝔸𝔸𝔸𝔸x𝔸é語é𝔸𝔸xxx"/></qti-choice-interaction></qti-item-body></qti-assessment-item>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): two simple choice identifiers that share a value holding a character from U+10000 up are outside NCName by spec reading 94, and the import still keys them under Choice identifier key, while the law oracle reads each as no id; value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
      owner: "decision 463",
    },
  'import-only-law: Choice identifier key, {"kind":"key","side":{"relation":"Hottext","terms":[{"kind":"field","field":"document"},{"kind":"field","field":"identifier"}],"selection":{"conjuncts":[]}}}':
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>`,
        ],
        [
          "rtest01/rtest01-fragment.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-hottext-interaction><p><qti-hottext identifier="0"/><qti-hottext identifier="0"/></p></qti-hottext-interaction></div>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): two hottext identifiers outside their domain that share a value are keyed by the import under Choice identifier key (Hottext), while the law oracle reads each as no id; value domain refuses it on both sides; lifted by keying only identifiers inside their domain (decision 457 (2)'s pattern)",
      owner: "decision 463",
    },
  'import-only-law: DocumentId key, {"kind":"key","side":{"relation":"IdBinding","terms":[{"kind":"field","field":"document"},{"kind":"field","field":"id"}],"selection":{"conjuncts":[{"kind":"compare","op":"eq","left":{"kind":"field","field":"admitted"},"right":{"kind":"literal","value":true,"type":undefined}}]}}}':
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2" xmlns:drd="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource identifier="v1" type="webcontent"/><resource identifier="r2" type="webcontent"><cpx:variant identifier="v0"><cpx:metadata><drd:accessForAllResource><cpx:variant identifier="v1"/></drd:accessForAllResource></cpx:metadata></cpx:variant></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): an element the grammar admits under its own parent binds its ID though an ancestor is a forbidden element whose subtree the law oracle drops, so its duplicate ID breaks DocumentId key beside the ancestor's N5 admitted, which no verdict follows; lifted by binding only an ID whose every ancestor the grammar admits",
      owner: "decision 452",
    },
  'import-only-law: DocumentId key, {"kind":"key","side":{"relation":"ResourceId","terms":[{"kind":"field","field":"package"},{"kind":"field","field":"identifier"}],"selection":{"conjuncts":[]}}}':
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="00000000-0000-0000-0000-000000000000"/><resource identifier="00000000-0000-0000-0000-000000000000"/></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): two cp:resource identifiers outside their domain that share a value are keyed by the import under DocumentId key (ResourceId), while the law oracle reads each as no id; value domain refuses it on both sides; lifted by keying only identifiers inside their domain (decision 457 (2)'s pattern)",
      owner: "decision 463",
    },
  "import-only-law: E1 derived, check E1_derived on ObjectIdentifier": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier=""/>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): an empty item identifier still writes its ObjectIdentifier row, which breaks E1 derived on the import's side alone; value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
  },
  "import-only-law: E1 derived, check E1_derived on SectionIdentifier": {
    files: [
      [
        "example.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-if><qti-is-null><qti-sum><qti-test-variables section-identifier="K𝔸éé語x𝔸x語語x語xx𝔸𝔸xxé𝔸語𝔸é語𝔸x語é語𝔸𝔸𝔸éé語語xxéx語𝔸𝔸ééé語語𝔸é𝔸語éx𝔸𝔸x𝔸𝔸é語éxééé語é語é語𝔸é語語語語é語語ééé語x𝔸éé語é語𝔸éxé語éx語語é語éx𝔸xx𝔸語xxxx語語ééé語éx語x語語x𝔸x語xx語é𝔸𝔸𝔸𝔸éx語𝔸語𝔸𝔸𝔸é𝔸éx語語ééx𝔸x語é語x語éxéxx語𝔸éé𝔸xéé語語é𝔸𝔸éx語語語𝔸xéx𝔸é𝔸語𝔸語x𝔸語xxxéx語é語éééx𝔸é𝔸éx𝔸éxxéxxx𝔸éé語語語𝔸𝔸éx𝔸xéé𝔸xx𝔸語é語𝔸語xéx𝔸語語x語xé𝔸é語x語語語語é語x語éx語xxéx語é𝔸𝔸x𝔸𝔸語éxé𝔸é語𝔸x𝔸ééé語𝔸xxx語é𝔸𝔸語𝔸𝔸é𝔸é𝔸x語語éé𝔸語語𝔸𝔸x𝔸語𝔸éx𝔸語語𝔸é𝔸語𝔸語x語éxéxé語語xé𝔸é語é語xx𝔸x語xéx語𝔸xxxé𝔸xxxxé𝔸𝔸xxé𝔸𝔸𝔸é語語語𝔸x𝔸é𝔸語語x𝔸𝔸é𝔸éx𝔸𝔸x𝔸é𝔸x𝔸é語éx𝔸𝔸語𝔸語é𝔸語語語éé𝔸éxxxé𝔸ééé𝔸語語xéx語é語𝔸𝔸𝔸𝔸𝔸x語語𝔸語語x𝔸𝔸𝔸𝔸語x語éx語語é語𝔸x𝔸𝔸xé𝔸xx語x𝔸𝔸語éé𝔸ééx語éxéé𝔸語語xxx𝔸𝔸xxxxxéé𝔸éx𝔸é語xx語語𝔸語éx語語語é𝔸語𝔸x語é語語語é𝔸x語𝔸x𝔸x語𝔸𝔸𝔸é𝔸é𝔸x語xx𝔸語語語éé𝔸xx語𝔸xéxxx𝔸x語é𝔸x語xx𝔸𝔸éx語é語𝔸éx語éé語𝔸é𝔸xé𝔸é語é𝔸x語𝔸xééé語語語𝔸éxxxé𝔸語x𝔸éxx𝔸é𝔸x𝔸xx𝔸𝔸語𝔸é語é𝔸é𝔸𝔸語語語語é語éé𝔸éé𝔸語語語x語語xééé語𝔸語éééx𝔸語é𝔸x𝔸xé語𝔸é𝔸éx𝔸é語xxxé語éé語é語𝔸語éxéx語xéxxééé語x𝔸éxxxxéxxxx語𝔸語x語𝔸語x𝔸x語語語𝔸語𝔸éééé𝔸x語語𝔸𝔸語ééxx語語語𝔸語é語𝔸é語語xé𝔸x語xx𝔸x語é𝔸語語é𝔸𝔸語x𝔸語ééx𝔸𝔸語𝔸x𝔸é𝔸語xéé語xéx𝔸é語𝔸語語x語語𝔸語𝔸語語𝔸語語xx語xé𝔸éé𝔸é𝔸語x𝔸𝔸x𝔸語é語ééx𝔸xéxé𝔸語語語x𝔸xé語éxé𝔸xé𝔸𝔸é語ééxxx語x𝔸語語語語éxx語é語xé𝔸é語語éx𝔸語x語𝔸語éx𝔸xx𝔸語語é𝔸𝔸語𝔸語xx𝔸𝔸𝔸éé語𝔸é語x𝔸x語語𝔸é語𝔸語ééxééx𝔸x𝔸𝔸𝔸𝔸xéé語x𝔸éx語語語語𝔸éé𝔸𝔸語𝔸語𝔸é語語𝔸語語語x語é𝔸𝔸𝔸é𝔸éé𝔸𝔸x𝔸é語𝔸x𝔸𝔸𝔸語𝔸語語語éé𝔸ééé語x語語xxé語éééxéxx語éx"/></qti-sum></qti-is-null></qti-response-if></qti-response-condition>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource href="example.xml" type="imsqti_stimulus_xmlv3p0"/></resources></manifest>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): a section identifier holding a character from U+10000 up is outside NCName by spec reading 94, and the import still writes its SectionIdentifier row, which breaks E1 derived; value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
    owner: "decision 463",
  },
  "import-only-law: E1 derived, check E1_derived on TestToken": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section><qti-assessment-section><qti-assessment-item-ref identifier=""/></qti-assessment-section></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): an empty assessment item ref identifier still writes its TestToken row, which breaks E1 derived on the import's side alone; value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
  },
  "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record, document) (under a record file whose root is a cp:manifest)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"/>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/><resource type="resourcemetadata/xml" href="meta/choice.xml"/></resources></manifest>`,
        ],
        [
          "meta/choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general/></imsmd:lom></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a record file whose root is a cp:manifest still has its resource-owned record read, so the record's general object breaks E1 derived where the law oracle reads no record of that file (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no record a record file's cp:resource owns",
      owner: "decision 463",
    },
  "import-only-law: E1 derived, contained InteractionAttribute(node, value) in Slider(node, lower)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>`,
        ],
        [
          "rtest01/rtest01-fragment.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-slider-interaction lower-bound="0"/></div>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a slider interaction writing its lower bound alone writes no Slider row, and E1 derived wants the bound's InteractionAttribute in Slider(node, lower) (NIL's \"(6) the absence defaults\"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written",
      owner: "decision 463",
    },
  "import-only-law: E1 derived, contained InteractionAttribute(node, value) in Slider(node, upper)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/></resources></manifest>`,
        ],
        [
          "items/item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-slider-interaction upper-bound="10"/></qti-item-body></qti-assessment-item>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a slider interaction writing its upper bound alone writes no Slider row, and E1 derived wants the bound's InteractionAttribute in Slider(node, upper) (NIL's \"(6) the absence defaults\"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written",
      owner: "decision 463",
    },
  "import-only-law: E1 derived, contained LomRecord(ownerParent, named) in LomResource(node, named)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="resourcemetadata/xml" href="test.xml"/></resources></manifest>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><resources><resource><metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"/></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a record file whose root is a cp:manifest has no LomResource, which is written for the package manifest's resources alone, while its resource-owned record is still read, so E1 derived breaks beside RootOfType, which refuses the file on both sides; lifted by reading no record a record file's cp:resource owns",
      owner: "decision 449",
    },
  "import-only-law: Idref target, contained IdrefTarget(document, id) in IdBinding(document, id) (under a forbidden ancestor)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><cpx:variant identifierref="choice_es"/></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a forbidden 3.0.1 cpx:variant's identifierref is still checked under Idref target though the law oracle drops the forbidden element's subtree (decision 452's kin); N5 admitted refuses it on both sides; lifted by checking only an identifierref whose every ancestor the grammar admits",
      owner: "decision 463",
    },
  "import-only-law: LOM learning resource type, contained LomResourceType(node) in LomResourceTypeSource(node)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="resourcemetadata/xml" href="r.xml"/></resources></manifest>`,
        ],
        [
          "r.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource><metadata><imsmd:lom><imsmd:educational><imsmd:learningResourceType><imsmd:value>exam</imsmd:value></imsmd:learningResourceType></imsmd:educational></imsmd:lom></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a record file whose root is a cp:manifest still has its resource-owned record read, so its learning resource type is judged under LOM learning resource type where the law oracle reads no record of that file; RootOfType refuses the file on both sides; lifted by reading no record a record file's cp:resource owns",
      owner: "decision 449",
    },
  "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in LomObjectIdentifier(record) (under a record file whose root is a cp:manifest)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/><resource type="resourcemetadata/xml" href="meta/choice.xml"/></resources></manifest>`,
        ],
        [
          "meta/choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a record file whose root is a cp:manifest still has its resource-owned record read, so the record's identifier breaks LomObjectIdentifier where the law oracle reads no record of that file (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no record a record file's cp:resource owns",
      owner: "decision 463",
    },
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record) (under xml:base on a cp:resource)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<lom xmlns="http://ltsc.ieee.org/xsd/LOM"/>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="../choice.xml" xml:base="passages/"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): the import and the law oracle attach a resource's LOM record differently when its cp:resource carries xml:base, so the record's title breaks LomObjectTitle on the import's side alone; Href listed refuses it on both sides; lifted by attaching a resource's record under the one href its xml:base resolves on both sides",
      owner: "decision 463",
    },
  "import-only-law: Section identifier target, check Section_identifier_target on Reading": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-outcome-processing><qti-set-outcome-value><qti-sum><qti-test-variables section-identifier="Kx語é語xéé𝔸xéé語é語語𝔸語éé𝔸xxx語𝔸xxé語é語語é𝔸語x𝔸語xxééé語𝔸é𝔸x𝔸語é𝔸語語x語éx𝔸語x𝔸é𝔸éxxx語語𝔸éxx𝔸𝔸𝔸x𝔸語語𝔸𝔸𝔸éxé語x𝔸xx語xxéx𝔸éxéé語語xéé𝔸xx𝔸xxx語éx語xxéx語xé語𝔸é𝔸éx𝔸𝔸𝔸𝔸é語é語𝔸éé語語𝔸語𝔸語語é𝔸éx𝔸語語語𝔸é𝔸語xxx語𝔸é𝔸𝔸é語語xx𝔸é𝔸é語語𝔸語𝔸𝔸x𝔸𝔸xx語éx語ééé𝔸語語語x𝔸語é語xx𝔸語é語語x𝔸語𝔸𝔸𝔸𝔸語語é𝔸𝔸𝔸xéééxééé語x語xxéé𝔸é𝔸xéx𝔸xéé語𝔸𝔸xé𝔸𝔸𝔸x語語é語語𝔸𝔸𝔸x語xéééx𝔸語𝔸xx語語𝔸éé𝔸語𝔸x語xé語𝔸xéx語é語語語é𝔸x語語x語éx語x𝔸éé𝔸x語xx語語x語xxxé𝔸語xé𝔸𝔸語語語語x語語x語x𝔸x𝔸éxx語語x𝔸𝔸xéxx語語語𝔸éxéxx𝔸𝔸語𝔸xxx𝔸xéx語xxxéé語x𝔸𝔸𝔸𝔸𝔸x𝔸é𝔸xé語語xx語x語x𝔸𝔸𝔸ééxéxéx語éxxé𝔸𝔸é𝔸𝔸𝔸𝔸éxx𝔸xéé𝔸語𝔸語éé𝔸éx𝔸語é𝔸𝔸語xéé𝔸xx𝔸𝔸éxéx語éxxé語éé𝔸𝔸𝔸語𝔸語éé語éé語語éé語𝔸é𝔸𝔸x語𝔸語xéé𝔸語語𝔸𝔸𝔸語語éxééx𝔸é語éxxéxx語𝔸語𝔸x語é𝔸語xx𝔸語語𝔸語語é𝔸語語語xxx𝔸𝔸𝔸x𝔸語𝔸語𝔸語x語𝔸é語語語𝔸ééé語𝔸x𝔸語éxxx𝔸x𝔸éxé𝔸éx𝔸𝔸éééxxé𝔸𝔸𝔸é𝔸𝔸xé語語éé𝔸é語éx𝔸é語x語xé𝔸語語𝔸xxééx語𝔸語語𝔸é𝔸語é𝔸é語xé語xxé語𝔸𝔸x𝔸語xééxé𝔸xxxxx語語éx𝔸𝔸x語語𝔸語𝔸xééxxx語語𝔸xxx𝔸𝔸é𝔸é語語語𝔸𝔸語語éxx語𝔸語語x𝔸ééééx𝔸語𝔸𝔸xéx𝔸éx𝔸é𝔸語語éx語𝔸éé語𝔸𝔸語éééé𝔸𝔸xéé𝔸é語語𝔸xx語語𝔸x𝔸x𝔸𝔸語é𝔸xé語x語x語éxx語é語𝔸é𝔸語é𝔸語xéé語語é語語語語x語éxxé𝔸ééx𝔸xxxx語語x語xxx語語ééxxéééxx語xxx語éxé語x語é語語語語éxx𝔸é語é語é𝔸x𝔸語éé語𝔸xxé𝔸éxxxxé𝔸é𝔸x𝔸xéxéx𝔸éxxéx語𝔸𝔸xx𝔸語é語x𝔸𝔸語xéxx𝔸x𝔸xx語語xx語語𝔸𝔸語éx𝔸𝔸xé𝔸x𝔸𝔸xx𝔸xx語語語𝔸語語語xxx𝔸éx𝔸語𝔸xé𝔸xé語x語𝔸語éx𝔸xx𝔸語語語é𝔸xé𝔸語語éx語𝔸𝔸語語𝔸語語x𝔸𝔸𝔸語é𝔸xéé語é語éxx語éééxx語𝔸語語é𝔸éé語é語x𝔸éxé語éx語語語𝔸x語xx𝔸𝔸𝔸𝔸é語é語語𝔸𝔸x𝔸xé語"/></qti-sum></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): a section identifier holding a character from U+10000 up is outside NCName by spec reading 94, and the import still checks its Reading under Section identifier target; value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
    owner: "decision 463",
  },
  "import-only-law: Template default target, contained TemplateDefault(node) in TemplateDefaultTarget(node)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "items/item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="N"/></qti-assessment-item>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item.xml"><qti-template-default template-identifier="N"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: 'a stated limit (spec reading 1): a template default without its expression writes no TemplateDefaultTarget row, and Template default target wants one per template default (NIL\'s "(6) the absence defaults"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written',
      owner: "decision 463",
    },
  "import-only-law: Test overlay, contained Node(id) in SectionSelection(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section visible="true"><qti-selection/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: 'a stated limit (spec reading 1): a selection without its select attribute writes no SectionSelection row, and Test overlay wants one per node (NIL\'s "(6) the absence defaults"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written',
    owner: "decision 463",
  },
  "import-only-law: Test overlay, contained Node(id) in VariableMapping(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section visible="true"><qti-assessment-item-ref><qti-variable-mapping/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: 'a stated limit (spec reading 1): a variable mapping missing either attribute writes no VariableMapping row, and Test overlay wants one per node (NIL\'s "(6) the absence defaults"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written',
    owner: "decision 463",
  },
  "import-only-law: Test overlay, contained Section(node, visible) in TestFlag(node, value)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1">
  <metadata>
    
    <schemaversion>3.0.0</schemaversion>
  </metadata>
  
  <resources>
    
    
    
    
    
    <resource type="imsqti_test_xmlv3p0" href="test.xml">
      
      
      
      
      
      
    </resource>
  </resources>
</manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  
  <qti-test-part identifier="p23">
    <qti-assessment-section identifier="s22">
      <qti-assessment-section identifier="s16" visible="true">
        
        
        <qti-assessment-section identifier="s15" title="s15">
          
          
        </qti-assessment-section>
      </qti-assessment-section>
      
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`,
      ],
    ],
    fix: "(6) the absence defaults: an absent required attribute writes no row, never an empty or default value",
    owner: "NIL",
  },
  "import-only-law: value domain, check value_domain on Attribute (under an inclusion cycle)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>`,
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="rtest01-fragment.xml"/><qti-hottext-interaction><p><qti-hottext identifier="-0"/></p></qti-hottext-interaction></div>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): in a fragment that includes itself the import still judges an attribute's value domain, while the law oracle reads no value domain there (decision 451's kin); Inclusion cycle refuses it on both sides; lifted by judging no value domain in a document an inclusion cycle refuses",
    owner: "decision 463",
  },
  "lone-refusal: RootOfType named lom-identifier, witness unreported (under a record file whose root is a cp:manifest)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="choice" title="Unattended Luggage" time-dependent="false"/>`,
        ],
        [
          "images/sign.png",
          "b64",
          "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",
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><file href="choice.xml"/><file href="images/sign.png"/></resource><resource identifier="choice-meta" type="resourcemetadata/xml" href="meta/choice.xml"><file href="meta/choice.xml"/></resource></resources></manifest>`,
        ],
        [
          "meta/choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata><file href="images/sign.png"/></resource></resources></manifest>`,
        ],
      ],
      fix: "a stated limit (spec reading 1): a record file whose root is a cp:manifest still has its resource-owned record read, so the import names lom-identifier where the law oracle names root-type-reverse (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no record a record file's cp:resource owns",
      owner: "decision 463",
    },
  "noise-moved: the import's verdict under resource-order": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="items/media/pic.png"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "items/media/pic.png",
        "b64",
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test/>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): two documents fail the codec differently (a binary file typed as a fragment, a namespace-less root), and each side names the first in manifest order (the law oracle at src/test/oracle.ts:6710-6718, the import at src/import/program.ts:190-193), so the rule named moves with resource order; the codec refuses it on both sides; lifted by a codec precedence that names one rule whatever the order",
    noised: { noise: "resource-order", salt: 90 },
    owner: "decision 463",
  },
  "noise-moved: the oracle's verdict under resource-order": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="items/media/pic.png"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "items/media/pic.png",
        "b64",
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test/>`,
      ],
    ],
    fix: "a stated limit (spec reading 1): two documents fail the codec differently (a binary file typed as a fragment, a namespace-less root), and each side names the first in manifest order (the law oracle at src/test/oracle.ts:6710-6718, the import at src/import/program.ts:190-193), so the rule named moves with resource order; the codec refuses it on both sides; lifted by a codec precedence that names one rule whatever the order",
    noised: { noise: "resource-order", salt: 90 },
    owner: "decision 463",
  },
} satisfies Entries;

/**
 * The disagreements a fix closed, each kept as a seed: keyed by the closed class's signature, with
 * the lane that fixed it, the fix, and the package that showed it, which must never show it again.
 */
export const fixed = {
  "dangling-uuid: AssembledId.copy": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="section.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "section.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"/>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "NS4: a placed ID's copy under a test's assembly is its placed document, never the nil uuid",
    owner: "NIL",
  },
  "dangling-uuid: ItemRefDocument.document": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item2.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item2.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "NS3: an item ref whose href names no item document is a row of its own relation, never the nil uuid",
    owner: "NIL",
  },
  "dangling-uuid: MappingSourceDeclaration.declaration": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1">
  <metadata>
    
    <schemaversion>3.0.0</schemaversion>
    
  </metadata>
  
  <resources>
    
    
    
    
    
    
    
    <resource type="imsqti_test_xmlv3p0" href="test.xml">
      
      
      
      
      
    </resource>
    
  </resources>
</manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test1" title="Every relation test">
  
  
  
  <qti-test-part identifier="part1" navigation-mode="linear" submission-mode="individual">
    <qti-assessment-section identifier="first" title="First" visible="true">
      <qti-assessment-item-ref identifier="ref1" href="items/item.xml">
        
        <qti-variable-mapping source-identifier="SCORE" target-identifier="ITEMSCORE"/>
        
      </qti-assessment-item-ref>
      
    </qti-assessment-section>
    
  </qti-test-part>
  
</qti-assessment-test>`,
      ],
    ],
    fix: "A17-A22: a template default, mapping source or lookup that names no declaration is a row of its own relation, never the nil uuid",
    owner: "NIL",
  },
  "dangling-uuid: NameLookup.itemDocument": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item2.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref identifier="ref3" href="items/item2.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "NS3: an item ref whose href names no item document is a row of its own relation, never the nil uuid",
    owner: "NIL",
  },
  "dangling-uuid: PlacedId.copy": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="section.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "section.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"/>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "NS4: a placed ID's copy under a test's assembly is its placed document, never the nil uuid",
    owner: "NIL",
  },
  "dangling-uuid: PlacedVariableRefDeclaration.declaration": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1">
  <metadata>
    
    <schemaversion>3.0.0</schemaversion>
    
  </metadata>
  
  <resources>
    
    
    
    <resource type="imsqti_item_xmlv3p0" href="items/item3.xml">
      
      
    </resource>
    <resource type="imsqti_fragment_xmlv3p0" href="items/rules.xml">
      
    </resource>
    
    
    
    
  </resources>
</manifest>`,
      ],
      [
        "items/item3.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude" adaptive="false" time-dependent="false">
  
  
  <qti-response-processing><xi:include href="rules.xml"/></qti-response-processing>
</qti-assessment-item>`,
      ],
      [
        "items/rules.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-response-if>
    
    <qti-set-outcome-value identifier="SCORE">
      
    </qti-set-outcome-value>
  </qti-response-if>
</qti-response-condition>`,
      ],
    ],
    fix: "NS1 (FB-EXPR): a declared reference's declaration is a row of its own, VariableRefDeclaration or PlacedVariableRefDeclaration, so one that names a built-in or nothing holds no nil uuid",
    owner: "NIL",
  },
  "dangling-uuid: SectionTemplateRefDeclaration.declaration": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <metadata>
        
        <schemaversion>3.0.0</schemaversion>
        
    </metadata>
    
    <resources>
        
        <resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set01.xml">
            
        </resource>
        
        
        <resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml">
            
        </resource>
    </resources>
</manifest>`,
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <p><qti-template-inline template-identifier="NONE">t</qti-template-inline></p>
</div>`,
      ],
      [
        "rtest01/rtest01-set01.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xi="http://www.w3.org/2001/XInclude" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd" identifier="RTEST-01-SET-01" title="Set Item" adaptive="false" time-dependent="false">
    
    
    <qti-item-body>
        
        <xi:include href="rtest01-fragment.xml" parse="xml"/>
    </qti-item-body>
    
</qti-assessment-item>`,
      ],
    ],
    fix: "NS2: a content reference that names no declaration has no declaration row, its *RefDeclaration relation's, never the nil uuid, so its law refuses it by that row's absence",
    owner: "NIL",
  },
  "dangling-uuid: TemplateRefDeclaration.declaration": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/></resources></manifest>`,
      ],
      [
        "items/item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><p><qti-template-inline template-identifier="NONE"/></p></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "NS2: a content reference that names no declaration has no declaration row, its *RefDeclaration relation's, never the nil uuid, so its law refuses it by that row's absence",
    owner: "NIL",
  },
  "dangling-uuid: VariableRefDeclaration.declaration": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-rules.xml"/></resources></manifest>`,
      ],
      [
        "rtest01/rtest01-rules.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-if><qti-set-outcome-value identifier="NOPE"/></qti-response-if></qti-response-condition>`,
      ],
    ],
    fix: "NS1 (FB-EXPR): a declared reference's declaration is a row of its own, VariableRefDeclaration or PlacedVariableRefDeclaration, so one that names a built-in or nothing holds no nil uuid",
    owner: "NIL",
  },
  "import-only-law: Binding cardinality, contained BindingCardinality(node) in MostCount(node)": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-response-declaration identifier="RESPONSE"/><qti-item-body>
        
        
        <qti-choice-interaction response-identifier="RESPONSE" max-choices="2">
            
            
            
            
        </qti-choice-interaction>
    </qti-item-body></qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <metadata>
        
        <schemaversion>3.0.0</schemaversion>
        
    </metadata>
    
    <resources>
        <resource type="imsqti_item_xmlv3p0" href="choice.xml">
            
            
            
        </resource>
    </resources>
</manifest>`,
      ],
    ],
    fix: "B11 and reading 159: a declaration whose cardinality spells nothing is read as having none, never as single, so a binding of it is declared but has no BindingCardinality row, which Binding cardinality reads",
    owner: "NIL",
  },
  "import-only-law: Binding declared, contained BoundVariable(node, attribute, kind, document, identifier) in BindingDeclaration(node, attribute, kind, document, identifier)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-choice-interaction response-identifier="RESPONSE"/></qti-item-body></qti-assessment-item>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><cpx:variant/></resource></resources></manifest>`,
        ],
      ],
      fix: "the variant class: the 3.0.1 profile forbids cpx:variant (its maxOccurs is 0), and the oracle's fold now refuses the node, drops its subtree and folds the rest, so it judges every document's rows and precedence picks among every breach",
      owner: "VD",
    },
  "import-only-law: Binding declared, contained PlacedBinding(instance, node, attribute, assembly, document, kind, identifier) in PlacedBindingDeclaration(instance, node, attribute, assembly, document, kind, identifier)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set01.xml"/><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>`,
        ],
        [
          "rtest01/rtest01-fragment.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-hottext-interaction response-identifier="RESPONSE"/></div>`,
        ],
        [
          "rtest01/rtest01-set01.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><qti-item-body><p><xi:include href="rtest01-fragment.xml"/></p></qti-item-body></qti-assessment-item>`,
        ],
      ],
      fix: "a site places its target only where it is a section ref or an include that may stand for the target's root (SiteTarget.places), so an include Include root refuses places no child instance and its fragment's interaction no PlacedBinding under the item",
      owner: "genetic-repair gr-2",
    },
  "import-only-law: Branch forward, check Branch_forward on BranchResolution": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref><qti-branch-rule target="p7"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "C6: a branch rule whose target names nothing writes no BranchTarget row, so only the resolution's existence law, Branch target, can break, and no Branch_forward",
    owner: "NIL",
  },
  "import-only-law: Declaration base type, contained DeclarationCardinality(node) in Attribute(node)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-response-declaration/></qti-assessment-item>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>`,
        ],
      ],
      fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
      owner: "NIL",
    },
  "import-only-law: Declaration overlay, contained DeclarationCardinality(node) in Attribute(node)":
    {
      files: [
        [
          "es/choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-outcome-declaration><qti-default-value><qti-value/></qti-default-value></qti-outcome-declaration></qti-assessment-item>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="es/choice.xml"/></resources></manifest>`,
        ],
      ],
      fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
      owner: "NIL",
    },
  "import-only-law: Declaration overlay, contained Node(id) in Declaration(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="many" base-type="identifier"/></qti-assessment-item>`,
      ],
    ],
    fix: "spec readings 157 and 158: every declaration has its Declaration row and every row below it whatever its identifier, cardinality and base type spell, each of which is a row of its own (DeclarationIdentifier, DeclarationCardinality, DeclarationBaseType), written only where it names or spells something, so AL3 or the value domain refuses one that does not alone (FIX-DECLNAME closed a nameless declaration's case, FIX-DECLCARD one whose cardinality or base type spells nothing)",
    owner: "FIX-DECLCARD",
  },
  "import-only-law: Dependency target, contained Dependency(node) in DependencyTarget(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource><dependency identifierref="1x"/></resource></resources></manifest>`,
      ],
    ],
    fix: "spec reading 152 and decision 457 (2): a dependency's identifierref that is no NCName once collapsed names no resource, so it writes no Dependency row and its value domain refuses it alone, where the import wrote one that no DependencyTarget could follow",
    owner: "genetic-repair-2 gr2-2",
  },
  "import-only-law: Document entry, contained SitePath(package, path) in TestDocument(package, path)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: "25d16460 (SitePath) writes a site's href as a row of its own, gated on its entry, so a section ref whose href names no entry of the package is refused by File exists alone, and Document entry reads only the paths an entry holds",
      owner: "NIL",
    },
  "import-only-law: Document entry, contained SiteTarget(package, path, target) in TestDocument(package, path, node)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="section.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "section.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"/>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: "25d16460 (SitePath) writes a site's href as a row of its own, gated on its entry, and removes the containment this class broke, so no package can show it",
      owner: "NIL",
    },
  'import-only-law: DocumentId key, {"kind":"key","side":{"relation":"IdBinding","terms":[{"kind":"field","field":"document"},{"kind":"field","field":"id"}],"selection":{"conjuncts":[]}}}':
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource><cpx:variant identifier="v1"/></resource><resource><cpx:variant identifier="v1"/></resource></resources></manifest>`,
        ],
      ],
      fix: "an element the grammar does not admit where it stands binds no ID (DocumentId.admitted, IdBinding.admitted), so a forbidden cpx:variant is refused under N5 admitted alone and DocumentId key reads only an admitted element's IDs (R2)",
      owner: "genetic-repair gr-4",
    },
  "import-only-law: E1 derived, check E1_derived on CountBound": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-item-body><qti-choice-interaction max-choices="1abc"/></qti-item-body></qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml">
            
            
            
        </resource></resources></manifest>`,
      ],
    ],
    fix: "NS5: a count written as no count has no LeastCount or MostCount row",
    owner: "NIL",
  },
  "import-only-law: E1 derived, check E1_derived on DeclarationCardinality": {
    files: [
      [
        "es/choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-outcome-declaration/></qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="es/choice.xml"/></resources></manifest>`,
      ],
    ],
    fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
    owner: "NIL",
  },
  "import-only-law: E1 derived, check E1_derived on DocumentId": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="single" base-type="identifier"/></qti-assessment-item>`,
      ],
    ],
    fix: "spec reading 156, reading 152's for the IDs: an ID-typed attribute or text is an ID value only where its value is an NCName (the grammar's ncNamePattern), so the import and the schema's copy sources (namingIdAttributes, idTexts, headerIds) write no DocumentId and no TableHeader for an empty identifier or one with whitespace inside, its value domain refuses it alone, and an IDREF or a cell's headers token that names it is refused under its own law, as the oracle reads idsOf and tableHeadersOf",
    owner: "FIX-IDNCNAME",
  },
  "import-only-law: E1 derived, check E1_derived on InteractionAttribute": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="R" max-choices="1 2"><qti-simple-choice identifier="A">a</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: 'the value of a read attribute is its lexical form collapsed (Compute.collapse, as on SsmlAttribute), never an outer-whitespace split whose value E1_derived held to no whitespace: a collapsed value with whitespace inside (max-choices="1 2", a reference "a b") is in the lexical space of no atomic type, and its value domain refuses it alone',
    owner: "FIX-ATOMIC",
  },
  "import-only-law: E1 derived, check E1_derived on RecordField": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_outcomes_xmlv3p0" href="testoutcome01.xml"/></resources></manifest>`,
      ],
      [
        "testoutcome01.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-outcome-declaration xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="SCORE" cardinality="single"><qti-default-value><qti-value base-type="integer"/></qti-default-value></qti-outcome-declaration>`,
      ],
    ],
    fix: "a RecordField row only where a value writes both a field-identifier and a base-type, so a base-type written alone is refused under Value cardinality, never an empty field identifier's E1",
    owner: "FIX-UNWRITTEN",
  },
  "import-only-law: E1 derived, contained Attribute(node, lexical) in ObjectIdentifier(node, lexical)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/></resources></manifest>`,
        ],
        [
          "item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item"/>`,
        ],
      ],
      fix: "FB-META: an assessment object's identifier and title are rows of their own (ObjectIdentifier, ObjectTitle), so a root that writes neither still has its AssessmentObject, and a record whose document writes no identifier or title has no witness row (spec reading 148)",
      owner: "FB-META",
    },
  "import-only-law: E1 derived, contained Attribute(node, lexical) in ObjectTitle(node, title)": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" title="s44"/>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>`,
      ],
    ],
    fix: "FB-META: an assessment object's identifier and title are rows of their own (ObjectIdentifier, ObjectTitle), so a root that writes neither still has its AssessmentObject, and a record whose document writes no identifier or title has no witness row (spec reading 148)",
    owner: "FB-META",
  },
  "import-only-law: E1 derived, contained DeclarationIdentifier(document, identifier, node, declarationKind, cardinalities, baseTypes) in VariableLookup(document, name, declaration, declarationKind, cardinalities, baseTypes)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata>
        
        <schemaversion>3.0.0</schemaversion>
        
    </metadata><resources>
        
        <resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set01.xml">
            
        </resource>
        
        
        
    </resources></manifest>`,
        ],
        [
          "rtest01/rtest01-set01.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <qti-response-declaration identifier="RESPONSE" cardinality="single">
        
    </qti-response-declaration><qti-response-declaration identifier="RESPONSE" cardinality="single">
        
    </qti-response-declaration>
    
    
    
</qti-assessment-item>`,
        ],
      ],
      fix: "reading 74, FIX-DUPDECL: VariableLookup forces in each name a document declares, never each declaration's node, so a second declaration of a name is one lookup row and Declaration key alone refuses it",
      owner: "OL",
    },
  "import-only-law: E1 derived, contained Expression(kind, baseType) in ResultBase(kind, base)": {
    files: [
      [
        "d0.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-assessment-item-ref><qti-branch-rule><qti-base-value/></qti-branch-rule></qti-assessment-item-ref></qti-assessment-section>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="d0.xml"/></resources></manifest>`,
      ],
    ],
    fix: "PG's Expression base type commit: an attribute-typed expression whose base-type spells no base is unknown, and ResultBase judges no such one (resultTyped), so the containment this class broke no longer reads it and its statement is another",
    owner: "PG",
  },
  "import-only-law: E1 derived, contained Expression(parent, baseType, cardinality) in HeldType(node, heldBase, heldCardinality)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
        ],
        [
          "item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-response-processing><qti-set-outcome-value identifier=""><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`,
        ],
      ],
      fix: "FIX-HELDTYPE: a setter's or a lookup's held type is a row of its own, HeldType, keyed by the setter and written only where it names a variable and holds an expression, so one whose identifier names no variable (unwritten, or no NCName: spec reading 152) is refused by AL3 or its value domain alone, and no law forces a setter's expression into HeldType",
      owner: "FIX-HELDTYPE",
    },
  "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record, document)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/></resources></manifest>`,
        ],
        [
          "item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><resources>
        <resource type="imsqti_item_xmlv3p0" href="choice.xml">
            <metadata>
                
                <imsmd:lom>
                    <imsmd:general>
                        
                        
                        
                    </imsmd:general>
                    
                    
                    
                </imsmd:lom>
            </metadata>
            
            
            
        </resource>
        
    </resources></manifest>`,
        ],
      ],
      fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
      owner: "GEN-A",
    },
  "import-only-law: E1 derived, contained LomObject(package, path, document) in Document(package, path, node)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="../choice.xml"><metadata><imsmd:lom/></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "NS6: a record names a document only where its resource's href names one (LomResource.named, by targetAt), so a record whose href names none writes no LomObject, LomObjectIdentifier, LomObjectTitle or GeneralObject, and Document entry alone refuses the href",
      owner: "FIX-GENOBJ",
    },
  "import-only-law: E1 derived, contained LomObjectIdentifier(document, identifier) in ObjectIdentifier(document, identifier)":
    {
      files: [
        [
          "choice.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"/>`,
        ],
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources>
        <resource type="imsqti_item_xmlv3p0" href="choice.xml">
            <metadata>
                
                <imsmd:lom>
                    <imsmd:general>
                        <imsmd:identifier>
                            <imsmd:entry>choice</imsmd:entry>
                        </imsmd:identifier>
                        
                        
                    </imsmd:general>
                    
                    
                    
                    
                    
                    
                    
                    
                </imsmd:lom>
            </metadata>
            
            
        </resource>
    </resources></manifest>`,
        ],
      ],
      fix: "FB-META: an assessment object's identifier and title are rows of their own (ObjectIdentifier, ObjectTitle), so a root that writes neither still has its AssessmentObject, and a record whose document writes no identifier or title has no witness row (spec reading 148)",
      owner: "FB-META",
    },
  "import-only-law: E1 derived, contained LomResource(node) in Resource(node)": {
    files: [
      [
        "example.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><resources><resource/></resources></manifest>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="qtiusagedata/xml" href="example.xml"/></resources></manifest>`,
      ],
    ],
    fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
    owner: "GEN-A",
  },
  "import-only-law: E1 derived, contained NameLookup(node, resourceType) in ItemRefTarget(node, type)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section>
        
        <qti-assessment-section>
          
          <qti-assessment-item-ref identifier="i27">
          </qti-assessment-item-ref>
        </qti-assessment-section>
        
      </qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: "(6) the absence defaults: an absent required attribute writes no row, never an empty or default value",
      owner: "NIL",
    },
  "import-only-law: Idref target, contained IdrefTarget(document, id) in IdBinding(document, id)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item2.xml"/><resource type="imsqti_fragment_xmlv3p0" href="items/fragment.xml"/><resource type="imsqti_outcomes_xmlv3p0" href="items/fragment.xml"/></resources></manifest>`,
      ],
      [
        "items/fragment.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-portable-custom-interaction><qti-context-variable identifier="CTX2"/></qti-portable-custom-interaction></div>`,
      ],
      [
        "items/item2.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><qti-context-declaration identifier="CTX2"/><qti-item-body><xi:include href="fragment.xml"/></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "NS4: the import and the law oracle read a path two resource types name once, as the first type, so the fragment is judged where item2.xml splices it, and the second type's href names no document of its type, Document entry alone (reading 93)",
    owner: "S-ORACLE",
  },
  "import-only-law: Item ref target, check Item_ref_target on ItemRefTarget": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="bogus" href="item.xml"/><resource type="webcontent" href="item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section><qti-assessment-item-ref href="item.xml"/></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "decision 454: where a resource of an unread type names an item ref's path and none of the item type or an LTI type does, the importer writes no ItemRefTarget of the other read type beside it, as the law oracle names none (main's m0 class)",
    owner: "genetic-repair gr-5b",
  },
  "import-only-law: Item ref target, contained Attribute(node) in ItemRefTarget(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="resourceextmetadata/xml " href="item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section><qti-assessment-item-ref href="item.xml"/></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: 'decision 454: an item ref whose path only a resource of an unread type names has an ItemRefHref with no ItemRefTarget, contained in UnreadTypePath, so "Item ref target" asks it for no target, as the law oracle names none; the package is R-O6, and its type="bogus" twin and m0 (type="imsqti_item_xmlv2p2", unread) showed the same class',
    owner: "genetic-repair gr-5b",
  },
  "import-only-law: Item ref target, contained Node(id) in ItemRefTarget(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1">
  <metadata>
    
    <schemaversion>3.0.0</schemaversion>
  </metadata>
  
  <resources>
    <resource>
      
    </resource>
    <resource type="imsqti_test_xmlv3p0" href="test.xml">
      
      
    </resource>
  </resources>
</manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  
</qti-assessment-item>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-test-part>
    
    <qti-assessment-section>
      <qti-assessment-section>
        
        <qti-assessment-section visible="true">
          
          <qti-assessment-item-ref identifier="i27">
          </qti-assessment-item-ref>
        </qti-assessment-section>
        
      </qti-assessment-section>
    </qti-assessment-section>
    
  </qti-test-part>
</qti-assessment-test>`,
      ],
    ],
    fix: "spec reading 155: an item ref that writes no href names nothing, so the schema demands no ItemRefTarget, ReferencePath or NameLookup type of it and AL3 alone refuses it, and the law oracle judges an item ref's laws whether or not it, its sections or its part write an identifier",
    owner: "FIX-ITEMREF",
  },
  "import-only-law: Key text bound, a text past LomString.languageTag, LomStringLanguage.language, LomStringLanguage.languageTag, LomTitleString.languageTag's bound":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource><resource identifier="X0" type="resourcemetadata/xml" href="meta/r0.xml"><file href="meta/r0.xml"/></resource></resources></manifest>`,
        ],
        [
          "item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" adaptive="false" time-dependent="false"><qti-item-body><p>x</p></qti-item-body></qti-assessment-item>`,
        ],
        [
          "meta/r0.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><title><string language="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa">Title</string></title></general></lom>`,
        ],
      ],
      fix: "fix (3), the oracle's half: a document's type is the manifest's none or the type RootOfType pairs with its root, so an external record file's lom:string language is a key text of its records, which the oracle bounds as the database does",
      owner: "GEN-A",
    },
  "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in LomObjectIdentifier(record)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/></resources></manifest>`,
        ],
        [
          "item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    
    
    <resources>
        <resource type="imsqti_item_xmlv3p0" href="choice.xml">
            <metadata>
                
                <imsmd:lom>
                    <imsmd:general>
                        <imsmd:identifier>
                            <imsmd:entry>choice</imsmd:entry>
                        </imsmd:identifier>
                        
                        
                    </imsmd:general>
                    
                    
                    
                </imsmd:lom>
            </metadata>
            
            
            
        </resource>
        
    </resources>
</manifest>`,
        ],
      ],
      fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
      owner: "GEN-A",
    },
  "import-only-law: LomObjectIdentifier, contained LomObjectIdentifier(entry, general, record, identifier) in LomEntry(node, holder, holderParent, token)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="stimulus.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry>choice</imsmd:entry></imsmd:identifier></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "NS6: a record names a document only where its resource's href names one (LomResource.named, by targetAt), so a record whose href names none writes no LomObject, LomObjectIdentifier, LomObjectTitle or GeneralObject, and Document entry alone refuses the href",
      owner: "FIX-GENOBJ",
    },
  "import-only-law: LomObjectTitle, contained LomObjectTitle(string, record, title) in LomTitleString(node, record, textValue)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="example.xml"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`,
        ],
      ],
      fix: "NS6: a record names a document only where its resource's href names one (LomResource.named, by targetAt), so a record whose href names none writes no LomObject, LomObjectIdentifier, LomObjectTitle or GeneralObject, and Document entry alone refuses the href",
      owner: "FIX-GENOBJ",
    },
  "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    
    
    <resources>
        <resource type="imsqti_item_xmlv3p0" href="choice.xml">
            <metadata>
                
                <imsmd:lom>
                    <imsmd:general>
                        
                        <imsmd:title>
                            
                        </imsmd:title>
                        
                    </imsmd:general>
                    
                    
                    
                </imsmd:lom>
            </metadata>
            
            
            
        </resource>
        
    </resources>
</manifest>`,
      ],
    ],
    fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
    owner: "GEN-A",
  },
  "import-only-law: Manifest overlay, contained Attribute(node, lexical) in ManifestId(node, identifier)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/></resources></manifest>`,
        ],
        [
          "item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"/>`,
        ],
      ],
      fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
      owner: "GEN-A",
    },
  "import-only-law: Mapping overlay, contained Attribute(node, lexical) in MapKey(node, key)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="many" base-type="identifier"><qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping></qti-response-declaration></qti-assessment-item>`,
      ],
    ],
    fix: "spec readings 157 and 158: a response declaration keeps its Declaration row whatever its identifier, cardinality and base type spell, so its mapping and each map key have their rows, judged as any other's (FIX-DECLNAME closed a nameless declaration's case, FIX-DECLCARD one whose cardinality or base type spells nothing)",
    owner: "FIX-DECLCARD",
  },
  "import-only-law: N8 nearest, contained Choice(node) in ChoiceInteraction(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p>a <qti-gap identifier="G1"/> b</p></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "N8: the oracle states the choice law the schema does, every choice that writes its identifier in an interaction, its nearest (the information model's parents of each choice class, §5.55's gap, reading 38), so a qti-gap outside every qti-gap-match-interaction breaks N8 beside N6 on both sides",
    owner: "OL",
  },
  "import-only-law: Reserved type, check Reserved_type on DeclarationName": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set02.xml"/></resources></manifest>`,
      ],
      [
        "rtest01/rtest01-set02.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-outcome-declaration identifier="SCORE"/></qti-assessment-item>`,
      ],
    ],
    fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
    owner: "NIL",
  },
  'import-only-law: Structure identifier, {"kind":"key","side":{"relation":"Named","terms":[{"kind":"field","field":"document"},{"kind":"field","field":"identifier"}],"selection":{"conjuncts":[]}}}':
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section identifier="1x"/><qti-assessment-section identifier="1x"/></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: "spec reading 152 and decision 457 (2): a test part's, section's, section ref's or item ref's identifier that is no NCName once collapsed names nothing, so it writes no Named row and its value domain refuses it alone, where the import wrote one for each and two such identifiers collided in Named's key",
      owner: "genetic-repair-2 gr2-3",
    },
  "import-only-law: Template reference, contained TemplateRef(node, attribute) in TemplateRefDeclaration(node, attribute)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/></resources></manifest>`,
        ],
        [
          "items/item.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><p><qti-template-inline template-identifier=""/></p></qti-item-body></qti-assessment-item>`,
        ],
      ],
      fix: "spec reading 152: a value names something only where it is an NCName (the grammar's ncNamePattern), so the import and the schema's reference sources write no TemplateRef for template-identifier=\"\", and its value domain refuses it alone, as the oracle reads a bare reference (oracle.ts referenced.bare)",
      owner: "FIX-NCNAME",
    },
  'import-only-law: Test name key, {"kind":"key","side":{"relation":"AssembledName","terms":[{"kind":"field","field":"assembly"},{"kind":"field","field":"identifier"}],"selection":{"conjuncts":[]}}}':
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
        ],
        [
          "test.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section identifier="1x"/><qti-assessment-section identifier="1x"/></qti-test-part></qti-assessment-test>`,
        ],
      ],
      fix: "spec reading 152 and decision 457 (2): a test part's, section's, section ref's or item ref's identifier that is no NCName once collapsed names nothing, so it writes no Named row and hence no AssembledName, and its value domain refuses it alone, where the import assembled one for each and two such identifiers collided in AssembledName's key",
      owner: "genetic-repair-2 gr2-3",
    },
  "import-only-law: Test overlay, contained Named(node, identifier) in TestToken(node, value)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part/></qti-assessment-test>`,
      ],
    ],
    fix: "reading 147: a test part, section, section ref, item ref or stimulus ref that writes no identifier names nothing, so it writes no Named or StimulusRef row, and AL3 alone refuses it",
    owner: "FB-TESTS",
  },
  "import-only-law: Test overlay, contained Node(id) in ReferencePath(node)": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part identifier="p46"><qti-assessment-section identifier="s32" visible="true"><qti-assessment-section identifier="s31" visible="true">
        
        <qti-assessment-section identifier="s28" visible="true">
          
          <qti-assessment-item-ref identifier="i27">
          </qti-assessment-item-ref>
        </qti-assessment-section>
        
      </qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "spec reading 155: an item ref that writes no href names nothing, so the schema demands no ItemRefTarget, ReferencePath or NameLookup type of it and AL3 alone refuses it, and the law oracle judges an item ref's laws whether or not it, its sections or its part write an identifier",
    owner: "FIX-ITEMREF",
  },
  "import-only-law: Test overlay, contained SitePath(node, package, path) in ReferencePath(node, package, path)":
    {
      files: [
        [
          "imsmanifest.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set03.xml"/></resources></manifest>`,
        ],
        [
          "rtest01/rtest01-set03.xml",
          "xml",
          `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xi="http://www.w3.org/2001/XInclude"><qti-item-body><xi:include/></qti-item-body></qti-assessment-item>`,
        ],
      ],
      fix: "25d16460 (SitePath) writes a site's href as a row of its own, only where the site writes one that resolves, so an include with no href has no stand-in path and Include target alone refuses it",
      owner: "NIL",
    },
  "import-only-law: value domain, check value_domain on Attribute": {
    files: [
      [
        "es/choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    
    
    <qti-item-body>
        
        <p>
            <img aria-haspopup="x"/>
        </p>
        
    </qti-item-body>
    
</qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2">
    <metadata>
        
        <schemaversion>3.0.1</schemaversion>
        
    </metadata>
    
    <resources>
        <resource>
            
            
            
            <cpx:variant identifier="v1" identifierref="choice_es">
                
            </cpx:variant>
        </resource>
        <resource type="imsqti_item_xmlv3p0" href="es/choice.xml">
            
        </resource>
    </resources>
</manifest>`,
      ],
    ],
    fix: "the variant class: the 3.0.1 profile forbids cpx:variant (its maxOccurs is 0), and the oracle's fold now refuses the node, drops its subtree and folds the rest, so it judges every document's rows and precedence picks among every breach",
    owner: "VD",
  },
  "lone-refusal: AL3 required named item-ref-target, witness unreported": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1">
  <metadata>
    <schema>QTI Package</schema>
    <schemaversion>3.0.0</schemaversion>
  </metadata>
  <organizations/>
  <resources>
    <resource>
      <file href="item.xml"/>
    </resource>
    <resource identifier="test-res" type="imsqti_test_xmlv3p0" href="test.xml">
      <file href="test.xml"/>
      
    </resource>
  </resources>
</manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item>
  
</qti-assessment-item>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">
  <qti-test-part>
    
    <qti-assessment-section identifier="s32">
      <qti-assessment-section identifier="s31">
        
        <qti-assessment-section identifier="s28" title="s28" visible="true">
          
          <qti-assessment-item-ref identifier="i27">
          </qti-assessment-item-ref>
        </qti-assessment-section>
        
      </qti-assessment-section>
    </qti-assessment-section>
    
  </qti-test-part>
</qti-assessment-test>`,
      ],
    ],
    fix: "spec reading 155: an item ref that writes no href names nothing, so the schema demands no ItemRefTarget, ReferencePath or NameLookup type of it and AL3 alone refuses it, and the law oracle judges an item ref's laws whether or not it, its sections or its part write an identifier",
    owner: "FIX-ITEMREF",
  },
  "lone-refusal: N5 Follow named owner-copy, witness unreported": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p>a <qti-gap identifier="G1"/> b</p></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "TD-B's or-n6-missing, kept as a planted bug: the oracle's N6 reads the flags a kind needs (Needs), so a qti-gap outside every qti-gap-match-interaction breaks N6 beside N5 Follow, and N5 Follow is never the oracle's lone law here",
    owner: "GEN-A",
  },
  "lone-refusal: N5 admitted named attribute-lexical, witness unreported": {
    files: [
      [
        "es/choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><p><img aria-haspopup="x"/></p></qti-item-body></qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource identifier="choice"><cpx:variant/></resource><resource identifier="choice_es" type="imsqti_item_xmlv3p0" href="es/choice.xml"><file href="es/choice.xml"/></resource></resources></manifest>`,
      ],
    ],
    fix: "the variant class: the 3.0.1 profile forbids cpx:variant (its maxOccurs is 0), and the oracle's fold now refuses the node, drops its subtree and folds the rest, so it judges every document's rows and precedence picks among every breach",
    owner: "VD",
  },
  "lone-refusal: N5 admitted named binding-declared, witness unreported": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-choice-interaction response-identifier="RESPONSE"/></qti-item-body></qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"><cpx:variant/></resource></resources></manifest>`,
      ],
    ],
    fix: "the variant class: the 3.0.1 profile forbids cpx:variant (its maxOccurs is 0), and the oracle's fold now refuses the node, drops its subtree and folds the rest, so it judges every document's rows and precedence picks among every breach",
    owner: "VD",
  },
  "lone-refusal: N5 admitted named document-key, witness unreported": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item/>`,
      ],
      [
        "es/choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item/>`,
      ],
      [
        "images/sign.png",
        "b64",
        "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",
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0"><file href="choice.xml"/><cpx:variant identifier="v1"/></resource><resource identifier="choice-twin" type="pls"><file href="images/sign.png"/><cpx:variant identifier="v1"/></resource><resource identifier="choice_es" type="imsqti_item_xmlv3p0"><file href="es/choice.xml"/></resource></resources></manifest>`,
      ],
    ],
    fix: "an element the grammar does not admit where it stands binds no ID (DocumentId.admitted, IdBinding.admitted), so a forbidden cpx:variant is refused under N5 admitted alone and DocumentId key reads only an admitted element's IDs (R2)",
    owner: "genetic-repair gr-4",
  },
  "lone-refusal: RootOfType named lom-identifier, witness unreported": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item/>`,
      ],
      [
        "es/choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0" href="choice.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry/></imsmd:identifier></imsmd:general></imsmd:lom></metadata><file href="images/sign.png"/></resource></resources></manifest>`,
      ],
      [
        "images/sign.png",
        "b64",
        "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",
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="MANIFEST-85D76736-6D19-9DC0-7C0B-57C31A9FD390"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="choice" type="imsqti_item_xmlv3p0"><file href="choice.xml"/><file href="images/sign.png"/></resource><resource identifier="choice_es" type="imsqti_item_xmlv3p0" href="es/choice.xml"><file href="es/choice.xml"/></resource></resources></manifest>`,
      ],
    ],
    fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
    owner: "GEN-A",
  },
  "oracle-only-law: Key text bound": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><resources><resource identifier="Ké𝔸語xx𝔸語x𝔸𝔸xxééé語𝔸語x語𝔸語語x𝔸語é𝔸𝔸語𝔸語語𝔸語語語x語𝔸語語x𝔸語x𝔸éxxx𝔸xx語xxx𝔸𝔸xx語𝔸x語xéxxéé語𝔸éé𝔸語𝔸語𝔸x語𝔸éx𝔸x𝔸語xéx𝔸𝔸xxé語𝔸語éé𝔸é𝔸𝔸𝔸語𝔸𝔸é語xxx語x𝔸𝔸xé語𝔸é𝔸語éxé𝔸éé語x𝔸𝔸語éxxéxé語x𝔸xx𝔸é𝔸語語éé語𝔸𝔸𝔸𝔸é𝔸𝔸語x語語語x𝔸é語é語語xxx語x𝔸𝔸𝔸語éé語é語é語語é語語𝔸語x語x𝔸語xxé語𝔸ééx語𝔸𝔸𝔸𝔸é𝔸語語xxééxé𝔸xé語語x𝔸語xx語語𝔸é𝔸x語語é𝔸x語𝔸𝔸éé𝔸語xé語語語xx語xxé語語語é語𝔸語xé語xé語é語x語語éxééé語語𝔸語x語𝔸𝔸éx𝔸語語é𝔸xxééé𝔸語xé語xéé𝔸𝔸x𝔸𝔸é𝔸éx𝔸x語ééééx語𝔸語xé語x𝔸語語xxxéé語é語x𝔸語𝔸é𝔸語x𝔸x語𝔸語語𝔸𝔸x語x語𝔸語𝔸語𝔸𝔸é𝔸𝔸𝔸𝔸𝔸éxééx語𝔸語𝔸é語語𝔸éxx𝔸ééx語éxé語x𝔸𝔸語xé𝔸𝔸xxé語xx語𝔸語語𝔸xéx語語𝔸x語x𝔸𝔸x語𝔸é語é語語𝔸語xéxxé𝔸éx語𝔸𝔸語x𝔸éé𝔸語xé𝔸x語xx語語語𝔸𝔸語語éx語éx語éxééé𝔸é𝔸x語𝔸é𝔸x語𝔸x語ééx語𝔸𝔸éxééé𝔸x𝔸語é𝔸語xéxxx𝔸語𝔸語éxxx𝔸é語𝔸語𝔸xxéx語xéx語é語𝔸𝔸𝔸𝔸𝔸éxxxé𝔸語語é語ééxéé語xéé𝔸xx語é𝔸𝔸𝔸𝔸éxé𝔸x語éx𝔸éé𝔸x語𝔸x語ééé𝔸𝔸𝔸éé語xé語𝔸é𝔸xx語é語𝔸x語é語éé語éxé𝔸𝔸x𝔸𝔸𝔸x𝔸𝔸é𝔸é𝔸éé𝔸éé語語xx𝔸𝔸xxééé𝔸xxé𝔸éx語語éxéx語語𝔸ééx語xx𝔸語語é𝔸x語𝔸é語éxééxé𝔸x語xxx語éxééé𝔸𝔸éx𝔸é語語x𝔸語語語é語éx語𝔸𝔸x語é𝔸語xxx𝔸語xéééx語語語𝔸éxéx語é𝔸éxx語é語xé𝔸𝔸x語é語xéx語語x語𝔸𝔸語xxé𝔸語xéxx語ééxé語𝔸語ééxé語é𝔸𝔸語xxéé𝔸xx𝔸éé語語éé語𝔸𝔸x語語x語xé語x𝔸éé語𝔸é𝔸xxé語x語x語語x𝔸xxxxx𝔸語xxxx語é𝔸é語é𝔸語x語xéé𝔸𝔸xxx𝔸𝔸𝔸𝔸x𝔸語語xxéxx語é語x語𝔸x語xé語éxxxxé語語語語x語𝔸語語é𝔸𝔸ééx𝔸é𝔸éx語é語𝔸xxxx語é𝔸éééx語xx語é語é𝔸𝔸é𝔸éx語語語語x𝔸éé𝔸ééé𝔸xééé𝔸xéé語xé語語xé𝔸xé𝔸éé𝔸x語𝔸éxééé語x語x𝔸𝔸xxxx𝔸xxx𝔸𝔸𝔸𝔸𝔸é語é語é語𝔸𝔸xéé語𝔸𝔸xx𝔸語ééé語éx語語𝔸x𝔸xxx"/></resources></manifest>`,
      ],
    ],
    fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
    owner: "GEN-A",
  },
  "oracle-only-law: LOM learning resource type": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><resources><resource><metadata><imsmd:lom><imsmd:educational><imsmd:learningResourceType><imsmd:value>exam</imsmd:value></imsmd:learningResourceType></imsmd:educational></imsmd:lom></metadata></resource></resources></manifest>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>`,
      ],
    ],
    fix: "the law oracle reads a learning resource type only in the records' documents, the manifest's and an external record file's, as the import's recordDocumentTypes does (170356bd's reading)",
    owner: "genetic-repair-3 gr3-2",
  },
  "oracle-only-law: LomObjectIdentifier": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" identifier="choice" title="Unattended Luggage">
    
    
    
    
</qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
    <metadata>
        
        <schemaversion>3.0.0</schemaversion>
        
    </metadata>
    
    <resources>
        <resource type="imsqti_test_xmlv3p0" href="choice.xml">
            <metadata>
                
                <imsmd:lom>
                    <imsmd:general>
                        <imsmd:identifier>
                            <imsmd:entry>choice</imsmd:entry>
                        </imsmd:identifier>
                        
                        
                    </imsmd:general>
                    
                    
                    
                </imsmd:lom>
            </metadata>
            
            
            
        </resource>
        
    </resources>
</manifest>`,
      ],
    ],
    fix: "the oracle reads a record's object as the document its resource names where its root is an item or a test, whatever the resource's type (QTI 3.0 Metadata §2.7.1.1 and §2.7.1.2)",
    owner: "JAN",
  },
  "oracle-only-law: Set type": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/></resources></manifest>`,
      ],
      [
        "items/item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="N" cardinality="0"/><qti-template-processing><qti-set-template-value identifier="N"><qti-random-integer/></qti-set-template-value></qti-template-processing></qti-assessment-item>`,
      ],
    ],
    fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
    owner: "NIL",
  },
  "oracle-only-law: Template default target": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="T" cardinality="single" base-type="float"/></qti-assessment-item>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="item.xml"><qti-template-default><qti-base-value base-type="float">1</qti-base-value></qti-template-default></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "an unwritten or unread template-identifier names nothing, so the law oracle leaves the template default to AL3, as the importer writes no row for it",
    owner: "genetic-repair gr-6",
  },
  "oracle-only-law: Template default type": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "items/item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="N" cardinality="0"/></qti-assessment-item>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item.xml"><qti-template-default template-identifier="N"><qti-base-value/></qti-template-default></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
    owner: "NIL",
  },
  "oracle-only-law: Typed value": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer "><qti-correct-response><qti-value/></qti-correct-response></qti-response-declaration></qti-assessment-item>`,
      ],
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata>
        
        <schemaversion>3.0.0</schemaversion>
        
    </metadata><resources>
        <resource type="imsqti_item_xmlv3p0" href="choice.xml">
            
            
            
            
        </resource>
        
    </resources></manifest>`,
      ],
    ],
    fix: "B11: the oracle reads a record field's base-type by its type's whitespace class (typedValueOf), as the import does",
    owner: "VD",
  },
  "oracle-only-law: Variable declared": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set01.xml"/><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-rules.xml"/></resources></manifest>`,
      ],
      [
        "rtest01/rtest01-rules.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-if><qti-set-outcome-value identifier="NOPE"/></qti-response-if></qti-response-condition>`,
      ],
      [
        "rtest01/rtest01-set01.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><qti-item-body><xi:include href="rtest01-set01.xml"/></qti-item-body><qti-response-processing><xi:include href="rtest01-rules.xml"/></qti-response-processing></qti-assessment-item>`,
      ],
    ],
    fix: "an include splices its target only where it may stand for the target's root (Inclusion.splices, IncludeRoot through Compute.singleton), so an item that includes itself in its body still heads its assembly, and its rule fragment's set-outcome-value is judged there",
    owner: "ASM",
  },
  "oracle-only-law: Variable mapping source": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>`,
      ],
      [
        "item.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="T" cardinality="single" base-type="float"/></qti-assessment-item>`,
      ],
      [
        "test.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="item.xml"><qti-variable-mapping target-identifier="X"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>`,
      ],
    ],
    fix: "an unwritten or unread source-identifier names nothing, so the law oracle leaves the variable mapping to AL3, as the importer writes no row for it",
    owner: "genetic-repair gr-6",
  },
} satisfies Entries;
