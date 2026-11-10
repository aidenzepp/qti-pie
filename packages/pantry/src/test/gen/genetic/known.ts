/**
 * The genetic differential's known disagreements (`src/test/genetic.oracle.test.ts`): each class of
 * disagreement the search has met that a lane owns, keyed by its signature
 * (`#pantry/test/gen/genetic/judge.ts` `Signature`: its kind and grizzle's law, its selections
 * included, or the law name, the rules or the uuid field it names), with the lane that owns its
 * fix, the fix it waits on, and a package, reduced by the search, that shows it.
 *
 * The search fails on a class no entry records, and every run judges each entry's package on its
 * own and fails on an entry whose package no longer shows its class: the commit that lands an
 * owner's fix deletes the entries it closes, or moves them to {@link fixed}, whose packages must
 * never show their class again. An entry records a class, never a package: a fix that leaves the
 * class showing elsewhere keeps the entry, with a package that still shows it. A signature is a
 * class some package can show, a law the host judges or a uuid field it holds to the mint, which
 * the replay's guard holds every entry to.
 *
 * A class spec reading 1 lists as a stated limit waits on no fix: its entry's owner is the decision
 * that states it, its fix what would lift it, and it stays while the limit stands.
 *
 * The host's judge is a fast pre-filter (`#pantry/test/gen/genetic/host-laws.ts`, the owner's Q4
 * ruling): a class it reports becomes an entry only once its package reproduces it on PostgreSQL.
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
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
 * One known disagreement, or one a fix closed: its class, its owner, the fix, its package's files,
 * and, for a noise's class, the noise and salt that make its package's noised twin.
 */
export interface Known extends Owned {
  readonly files: readonly KnownFile[];
  /**
   * The noise and salt of a `noise-moved` class: such a class shows only beside its package's
   * noised twin, as the search judges it, so the check judges the twin too.
   */
  readonly noised?: { readonly noise: Noise; readonly salt: number };
  readonly signature: Signature;
}

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
 * The known disagreements.
 */
export const known: readonly Known[] = [
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
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "IdBinding",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "admitted", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
            ],
          },
          terms: [
            { field: "document", kind: "field" },
            { field: "id", kind: "field" },
          ],
        },
      },
      limit: "a forbidden ancestor",
    },
  },
  // MERGE-OPEN: the known entry for decision 449's stated limit keyed "E1 derived,
  // contained LomRecord(ownerParent, named) in LomResource(node, named)", can't be stated on Qti:
  // 660a9d64 deleted LomResource and LomRecord.named, so no law of Qti states the containment, and
  // its package (a resourcemetadata/xml resource href="test.xml" whose test.xml is
  // `<manifest><resources><resource><metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"/></metadata>
  // </resource></resources></manifest>`) shows no disagreement here. That record names no document,
  // since the query that names one (namingRecords) reads its resource's href, and the host leaves
  // rules over queries to the database. The limit's other class, the record's learning resource
  // type, still shows, as the next entry.
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomResourceType",
          selection: {
            conjuncts: [
              {
                arg: { args: [{ field: "text", kind: "field" }], fn: "collapse", kind: "compute" },
                kind: "in",
                values: ["exam", "self assessment"],
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "LomResourceTypeSource",
          selection: {
            conjuncts: [
              {
                arg: {
                  arg: {
                    args: [{ field: "text", kind: "field" }],
                    fn: "collapse",
                    kind: "compute",
                  },
                  kind: "in",
                  values: ["", "LOMv1.0"],
                },
                kind: "not",
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  // Nine of upstream's genetic repair round 4 known classes (284e13ab's known.ts; decisions 449, 463
  // and 467, issues #65 and #68) are no entries here: each is of a law Qti states only as a rule
  // over a query, which the host never judges (host-laws.ts: a statement over a derived relation is
  // unknown, never broken and never held), or of a relation Qti does not have, so the search never
  // shows one. Their packages, upstream's file for file, are #pantry/test/record-naming.ts's, and
  // the database judges each in #pantry/import/record-naming.db.test.ts:
  // - "import-only-law: E1 derived, contained GeneralObject(record, document) in LomObject(record,
  //   document)", under a record file whose root is a cp:manifest and under xml:base on a
  //   cp:resource;
  // - "import-only-law: LomObjectIdentifier, contained LomEntry(holderParent) in
  //   LomObjectIdentifier(record)", under the same two;
  // - "import-only-law: LomObjectTitle, contained LomTitle(record) in LomObjectTitle(record)", under
  //   a record file whose root is a cp:manifest, under a resource href the oracle reads unresolved
  //   (#65) and under xml:base on a cp:resource;
  // - "oracle-only-law: LomObjectTitle";
  // - "lone-refusal: RootOfType named lom-identifier, witness unreported", under a record file whose
  //   root is a cp:manifest.
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_item_xmlv3p0" href="items/item2.xml"/><resource type="imsqti_fragment_xmlv3p0" href="items/fragment.xml"/></resources></manifest>',
      ],
      [
        "items/fragment.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-portable-custom-interaction response-identifier="WIDGET2"/></div>',
      ],
      [
        "items/item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><p><qti-feedback-inline><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="fragment.xml"/></qti-feedback-inline></p></qti-item-body></qti-assessment-item>',
      ],
      [
        "items/item2.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><qti-item-body><xi:include href="fragment.xml"/></qti-item-body></qti-assessment-item>',
      ],
    ],
    fix: "a stated limit (spec reading 1): one fragment holding a portable custom interaction is placed in two items, once inside qti-feedback-inline, and Adaptive feedback's PlacedBinding containment is judged per node, not per placement (spec reading 117's fragment-context kin); Binding declared refuses it on both sides; lifted by judging a fragment's feedback context per placement",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "PlacedBinding",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "adaptive", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: false },
              },
              {
                kind: "compare",
                left: { field: "attribute", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "response-identifier" },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "Node",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: [
                  "qti-associate-interaction",
                  "qti-choice-interaction",
                  "qti-custom-interaction",
                  "qti-drawing-interaction",
                  "qti-end-attempt-interaction",
                  "qti-extended-text-interaction",
                  "qti-gap-match-interaction",
                  "qti-graphic-associate-interaction",
                  "qti-graphic-gap-match-interaction",
                  "qti-graphic-order-interaction",
                  "qti-hotspot-interaction",
                  "qti-hottext-interaction",
                  "qti-inline-choice-interaction",
                  "qti-match-interaction",
                  "qti-media-interaction",
                  "qti-order-interaction",
                  "qti-portable-custom-interaction",
                  "qti-position-object-interaction",
                  "qti-select-point-interaction",
                  "qti-slider-interaction",
                  "qti-text-entry-interaction",
                  "qti-upload-interaction",
                ],
              },
              {
                kind: "compare",
                left: {
                  args: [
                    { field: "ancestry", kind: "field" },
                    {
                      args: [{ kind: "literal", type: undefined, value: "qti-feedback-block" }],
                      kind: "closedRow",
                      relation: "Enters",
                    },
                  ],
                  fn: "disjoint",
                  kind: "compute",
                },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
            ],
          },
          terms: [{ field: "id", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref identifier="ref2"><qti-branch-rule target=""/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): an empty branch rule target still writes its BranchResolution row, which Branch target wants in BranchTarget on the import's side alone; value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "BranchResolution",
          selection: { conjuncts: [] },
          terms: [
            { field: "instance", kind: "field" },
            { field: "rule", kind: "field" },
            { field: "target", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "BranchTarget",
          selection: { conjuncts: [] },
          terms: [
            { field: "instance", kind: "field" },
            { field: "rule", kind: "field" },
            { field: "target", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-choice-interaction><qti-simple-choice identifier="Kéééxéxxxééxx𝔸x𝔸𝔸éé𝔸é語xxé𝔸𝔸語語語語𝔸語語ééxxxé語x𝔸é𝔸𝔸éé𝔸é語𝔸éé𝔸é語𝔸語𝔸語x語é語𝔸é𝔸é語xé語éxéxéé語x𝔸𝔸語𝔸語語éxééé𝔸ééx語語xx語𝔸𝔸語語éxx語é𝔸語é𝔸éxéx語x𝔸語é語語éxx語語語é語𝔸é語é語語éxéx語𝔸x語𝔸xé語xx𝔸é語xééxx語𝔸語éx𝔸é𝔸語語é語語語é語xéé𝔸é𝔸x𝔸x語語𝔸𝔸x𝔸語éé語éé語𝔸𝔸𝔸xxé𝔸語語𝔸語x𝔸𝔸𝔸x語xéééé𝔸語𝔸語x語xé𝔸𝔸éx𝔸語語𝔸語x𝔸𝔸ééx語ééx𝔸éé𝔸x語𝔸é𝔸é𝔸語éé語𝔸x語𝔸語é𝔸𝔸éx𝔸𝔸𝔸語𝔸x𝔸x語𝔸xx𝔸x語éx𝔸x𝔸xx語é𝔸x𝔸éééxé𝔸xéxé語éxx語語語é𝔸é𝔸xx𝔸語語xx𝔸x𝔸x語語語é𝔸éx語語xxé語語xé𝔸語x𝔸𝔸xé語x𝔸x𝔸𝔸𝔸xéé𝔸xéxé𝔸𝔸語x𝔸𝔸éééxé𝔸語語語é語x語語é𝔸x𝔸語語xéxxx𝔸𝔸𝔸語𝔸語𝔸𝔸𝔸é語𝔸𝔸語xx語é語語語語𝔸é語𝔸éé𝔸語𝔸𝔸é語é語𝔸語𝔸𝔸𝔸語語x𝔸𝔸語語é𝔸𝔸語xx語xx語語é𝔸é𝔸𝔸xéx語xéxx語語x𝔸𝔸語𝔸éx語x語xé語xééxx語éé𝔸𝔸語語語語é語𝔸x語x語𝔸x語x語é語xx𝔸é語語語𝔸語xx𝔸語語xéé語語éé語éx語é𝔸éx𝔸語xxéxéx𝔸xé語é語é𝔸xé𝔸xé𝔸éxx𝔸語é𝔸𝔸é𝔸𝔸x語x語xéxxé語語語é語𝔸éx語x𝔸語ééé語é語xéxéx語é𝔸𝔸xéx語語𝔸xxé語x語語語xxx𝔸é𝔸語𝔸語語é語語xx語xéxééé語x𝔸xxx𝔸語é語語é語語éé𝔸x𝔸xé語xxxéxé語𝔸éé𝔸é𝔸𝔸語𝔸語x𝔸xx𝔸x𝔸x𝔸語é𝔸𝔸語xé𝔸語xxx語語語𝔸語語𝔸xxé𝔸xxx𝔸xx語é語é𝔸é𝔸語語𝔸éx語éééééé語xx𝔸éxx𝔸語𝔸語語語éxéx𝔸語語𝔸𝔸éx𝔸é𝔸xéééx𝔸é語x𝔸ééé𝔸𝔸xéx語x𝔸語語𝔸𝔸xé語xx𝔸語𝔸éééé語éx𝔸é語𝔸xx語x語𝔸語éxéé𝔸éx𝔸xxé𝔸語é語語𝔸語語語xééééx語𝔸𝔸xé語éx𝔸x語xx語x𝔸xxéééx𝔸x語語語xxé語𝔸é語𝔸xé語𝔸éx𝔸x𝔸x語ééé𝔸ééé語語é語éxxx語x𝔸𝔸é語é𝔸語xxxé𝔸éx語éé𝔸éx語éxéé語語x𝔸xéx語é𝔸𝔸x𝔸語語x語語語𝔸語語x語𝔸𝔸éx語éxéx𝔸語xxx𝔸𝔸x𝔸xx語語語𝔸x語語x𝔸語語𝔸éx語é語語xééééx語𝔸éxé語éx𝔸x𝔸é𝔸語éxx𝔸xxééxxxxxxé𝔸x語語𝔸𝔸𝔸𝔸𝔸x𝔸é語é𝔸𝔸xxx"/><qti-simple-choice identifier="Kéééxéxxxééxx𝔸x𝔸𝔸éé𝔸é語xxé𝔸𝔸語語語語𝔸語語ééxxxé語x𝔸é𝔸𝔸éé𝔸é語𝔸éé𝔸é語𝔸語𝔸語x語é語𝔸é𝔸é語xé語éxéxéé語x𝔸𝔸語𝔸語語éxééé𝔸ééx語語xx語𝔸𝔸語語éxx語é𝔸語é𝔸éxéx語x𝔸語é語語éxx語語語é語𝔸é語é語語éxéx語𝔸x語𝔸xé語xx𝔸é語xééxx語𝔸語éx𝔸é𝔸語語é語語語é語xéé𝔸é𝔸x𝔸x語語𝔸𝔸x𝔸語éé語éé語𝔸𝔸𝔸xxé𝔸語語𝔸語x𝔸𝔸𝔸x語xéééé𝔸語𝔸語x語xé𝔸𝔸éx𝔸語語𝔸語x𝔸𝔸ééx語ééx𝔸éé𝔸x語𝔸é𝔸é𝔸語éé語𝔸x語𝔸語é𝔸𝔸éx𝔸𝔸𝔸語𝔸x𝔸x語𝔸xx𝔸x語éx𝔸x𝔸xx語é𝔸x𝔸éééxé𝔸xéxé語éxx語語語é𝔸é𝔸xx𝔸語語xx𝔸x𝔸x語語語é𝔸éx語語xxé語語xé𝔸語x𝔸𝔸xé語x𝔸x𝔸𝔸𝔸xéé𝔸xéxé𝔸𝔸語x𝔸𝔸éééxé𝔸語語語é語x語語é𝔸x𝔸語語xéxxx𝔸𝔸𝔸語𝔸語𝔸𝔸𝔸é語𝔸𝔸語xx語é語語語語𝔸é語𝔸éé𝔸語𝔸𝔸é語é語𝔸語𝔸𝔸𝔸語語x𝔸𝔸語語é𝔸𝔸語xx語xx語語é𝔸é𝔸𝔸xéx語xéxx語語x𝔸𝔸語𝔸éx語x語xé語xééxx語éé𝔸𝔸語語語語é語𝔸x語x語𝔸x語x語é語xx𝔸é語語語𝔸語xx𝔸語語xéé語語éé語éx語é𝔸éx𝔸語xxéxéx𝔸xé語é語é𝔸xé𝔸xé𝔸éxx𝔸語é𝔸𝔸é𝔸𝔸x語x語xéxxé語語語é語𝔸éx語x𝔸語ééé語é語xéxéx語é𝔸𝔸xéx語語𝔸xxé語x語語語xxx𝔸é𝔸語𝔸語語é語語xx語xéxééé語x𝔸xxx𝔸語é語語é語語éé𝔸x𝔸xé語xxxéxé語𝔸éé𝔸é𝔸𝔸語𝔸語x𝔸xx𝔸x𝔸x𝔸語é𝔸𝔸語xé𝔸語xxx語語語𝔸語語𝔸xxé𝔸xxx𝔸xx語é語é𝔸é𝔸語語𝔸éx語éééééé語xx𝔸éxx𝔸語𝔸語語語éxéx𝔸語語𝔸𝔸éx𝔸é𝔸xéééx𝔸é語x𝔸ééé𝔸𝔸xéx語x𝔸語語𝔸𝔸xé語xx𝔸語𝔸éééé語éx𝔸é語𝔸xx語x語𝔸語éxéé𝔸éx𝔸xxé𝔸語é語語𝔸語語語xééééx語𝔸𝔸xé語éx𝔸x語xx語x𝔸xxéééx𝔸x語語語xxé語𝔸é語𝔸xé語𝔸éx𝔸x𝔸x語ééé𝔸ééé語語é語éxxx語x𝔸𝔸é語é𝔸語xxxé𝔸éx語éé𝔸éx語éxéé語語x𝔸xéx語é𝔸𝔸x𝔸語語x語語語𝔸語語x語𝔸𝔸éx語éxéx𝔸語xxx𝔸𝔸x𝔸xx語語語𝔸x語語x𝔸語語𝔸éx語é語語xééééx語𝔸éxé語éx𝔸x𝔸é𝔸語éxx𝔸xxééxxxxxxé𝔸x語語𝔸𝔸𝔸𝔸𝔸x𝔸é語é𝔸𝔸xxx"/></qti-choice-interaction></qti-item-body></qti-assessment-item>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>',
      ],
    ],
    fix: "a stated limit (spec reading 1): two simple choice identifiers that share a value holding a character from U+10000 up are outside NCName by spec reading 94, and the import still keys them under Choice identifier key, while the law oracle reads each as no id; value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "Choice",
          selection: { conjuncts: [] },
          terms: [
            { field: "document", kind: "field" },
            { field: "kind", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>',
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-hottext-interaction><p><qti-hottext identifier="0"/><qti-hottext identifier="0"/></p></qti-hottext-interaction></div>',
      ],
    ],
    fix: "a stated limit (spec reading 1): two hottext identifiers outside their domain that share a value are keyed by the import under Choice identifier key (Hottext), while the law oracle reads each as no id; value domain refuses it on both sides; lifted by keying only identifiers inside their domain (decision 457 (2)'s pattern)",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "Hottext",
          selection: { conjuncts: [] },
          terms: [
            { field: "document", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "d0.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-choice-interaction><qti-simple-choice identifier="ChoiceB"/></qti-choice-interaction></qti-item-body></qti-assessment-item>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="d0.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section><qti-assessment-section-ref href="d0.xml"/><qti-assessment-section><qti-assessment-section-ref href="d0.xml"/></qti-assessment-section></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): an item document typed as a section and placed by two section refs is still read by the import as a section document, so its one choice is keyed twice under Choice identifier key (PlacedChoice), whose key is per assembly rather than per placed instance, where the law oracle reads no choice in it (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no references or choices in a document whose root its type refuses",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "PlacedChoice",
          selection: { conjuncts: [] },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "kind", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "d0.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-hottext-interaction><p><qti-hottext identifier="N2"/></p></qti-hottext-interaction></div>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="d0.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section><qti-assessment-section-ref href="d0.xml"/><qti-assessment-section><qti-assessment-section-ref href="d0.xml"/></qti-assessment-section></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a document typed as a section whose root is a div and placed by two section refs is still read by the import as a section document, so its one hottext is keyed twice under Choice identifier key (PlacedHottext), whose key is per assembly rather than per placed instance, where the law oracle reads no hottext in it (family E, decision 449's shape); RootOfType refuses it on both sides; lifted by reading no references or choices in a document whose root its type refuses",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "PlacedHottext",
          selection: { conjuncts: [] },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource identifier="00000000-0000-0000-0000-000000000000"/><resource identifier="00000000-0000-0000-0000-000000000000"/></resources></manifest>',
      ],
    ],
    fix: "a stated limit (spec reading 1): two cp:resource identifiers outside their domain that share a value are keyed by the import under DocumentId key (ResourceId), while the law oracle reads each as no id; value domain refuses it on both sides; lifted by keying only identifiers inside their domain (decision 457 (2)'s pattern)",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "ResourceId",
          selection: { conjuncts: [] },
          terms: [
            { field: "package", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier=""/>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>',
      ],
    ],
    fix: "a stated limit (spec reading 1): an empty item identifier still writes its ObjectIdentifier row, which breaks E1 derived on the import's side alone; value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "ObjectIdentifier" },
    },
  },
  {
    files: [
      [
        "example.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-if><qti-is-null><qti-sum><qti-test-variables section-identifier="K𝔸éé語x𝔸x語語x語xx𝔸𝔸xxé𝔸語𝔸é語𝔸x語é語𝔸𝔸𝔸éé語語xxéx語𝔸𝔸ééé語語𝔸é𝔸語éx𝔸𝔸x𝔸𝔸é語éxééé語é語é語𝔸é語語語語é語語ééé語x𝔸éé語é語𝔸éxé語éx語語é語éx𝔸xx𝔸語xxxx語語ééé語éx語x語語x𝔸x語xx語é𝔸𝔸𝔸𝔸éx語𝔸語𝔸𝔸𝔸é𝔸éx語語ééx𝔸x語é語x語éxéxx語𝔸éé𝔸xéé語語é𝔸𝔸éx語語語𝔸xéx𝔸é𝔸語𝔸語x𝔸語xxxéx語é語éééx𝔸é𝔸éx𝔸éxxéxxx𝔸éé語語語𝔸𝔸éx𝔸xéé𝔸xx𝔸語é語𝔸語xéx𝔸語語x語xé𝔸é語x語語語語é語x語éx語xxéx語é𝔸𝔸x𝔸𝔸語éxé𝔸é語𝔸x𝔸ééé語𝔸xxx語é𝔸𝔸語𝔸𝔸é𝔸é𝔸x語語éé𝔸語語𝔸𝔸x𝔸語𝔸éx𝔸語語𝔸é𝔸語𝔸語x語éxéxé語語xé𝔸é語é語xx𝔸x語xéx語𝔸xxxé𝔸xxxxé𝔸𝔸xxé𝔸𝔸𝔸é語語語𝔸x𝔸é𝔸語語x𝔸𝔸é𝔸éx𝔸𝔸x𝔸é𝔸x𝔸é語éx𝔸𝔸語𝔸語é𝔸語語語éé𝔸éxxxé𝔸ééé𝔸語語xéx語é語𝔸𝔸𝔸𝔸𝔸x語語𝔸語語x𝔸𝔸𝔸𝔸語x語éx語語é語𝔸x𝔸𝔸xé𝔸xx語x𝔸𝔸語éé𝔸ééx語éxéé𝔸語語xxx𝔸𝔸xxxxxéé𝔸éx𝔸é語xx語語𝔸語éx語語語é𝔸語𝔸x語é語語語é𝔸x語𝔸x𝔸x語𝔸𝔸𝔸é𝔸é𝔸x語xx𝔸語語語éé𝔸xx語𝔸xéxxx𝔸x語é𝔸x語xx𝔸𝔸éx語é語𝔸éx語éé語𝔸é𝔸xé𝔸é語é𝔸x語𝔸xééé語語語𝔸éxxxé𝔸語x𝔸éxx𝔸é𝔸x𝔸xx𝔸𝔸語𝔸é語é𝔸é𝔸𝔸語語語語é語éé𝔸éé𝔸語語語x語語xééé語𝔸語éééx𝔸語é𝔸x𝔸xé語𝔸é𝔸éx𝔸é語xxxé語éé語é語𝔸語éxéx語xéxxééé語x𝔸éxxxxéxxxx語𝔸語x語𝔸語x𝔸x語語語𝔸語𝔸éééé𝔸x語語𝔸𝔸語ééxx語語語𝔸語é語𝔸é語語xé𝔸x語xx𝔸x語é𝔸語語é𝔸𝔸語x𝔸語ééx𝔸𝔸語𝔸x𝔸é𝔸語xéé語xéx𝔸é語𝔸語語x語語𝔸語𝔸語語𝔸語語xx語xé𝔸éé𝔸é𝔸語x𝔸𝔸x𝔸語é語ééx𝔸xéxé𝔸語語語x𝔸xé語éxé𝔸xé𝔸𝔸é語ééxxx語x𝔸語語語語éxx語é語xé𝔸é語語éx𝔸語x語𝔸語éx𝔸xx𝔸語語é𝔸𝔸語𝔸語xx𝔸𝔸𝔸éé語𝔸é語x𝔸x語語𝔸é語𝔸語ééxééx𝔸x𝔸𝔸𝔸𝔸xéé語x𝔸éx語語語語𝔸éé𝔸𝔸語𝔸語𝔸é語語𝔸語語語x語é𝔸𝔸𝔸é𝔸éé𝔸𝔸x𝔸é語𝔸x𝔸𝔸𝔸語𝔸語語語éé𝔸ééé語x語語xxé語éééxéxx語éx"/></qti-sum></qti-is-null></qti-response-if></qti-response-condition>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource href="example.xml" type="imsqti_stimulus_xmlv3p0"/></resources></manifest>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a section identifier holding a character from U+10000 up is outside NCName by spec reading 94, and the import still writes its SectionIdentifier row, which breaks E1 derived; value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "SectionIdentifier" },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref><qti-template-default template-identifier="Kxé𝔸éx語𝔸𝔸𝔸é語éé𝔸éxé語xx語語𝔸語語é語ééxééééx語éxxéxx𝔸é𝔸xxx𝔸語x語𝔸語xééx語xé語語éx語é𝔸x語éxé語語éxééé語é𝔸xééxxxéé𝔸éé語語x語語𝔸xxxx𝔸𝔸𝔸é𝔸𝔸語語é語𝔸𝔸éx語語語xé語𝔸語é語xé𝔸éééé𝔸𝔸語é語語éxxx𝔸語xxxéxx𝔸語𝔸語𝔸𝔸語x語éé語é語x𝔸xx𝔸語x語éx語éxéé𝔸é語語語語é語x語xx語x語x𝔸語語xxx𝔸é語xxéx𝔸xé語x語é𝔸é語x𝔸é語éx語xé𝔸é語x𝔸𝔸𝔸語語𝔸x語語x𝔸éx語語𝔸é𝔸𝔸xx𝔸x𝔸𝔸éé語語𝔸é語𝔸𝔸x語語éx語xx𝔸語x𝔸𝔸é𝔸xéxx𝔸語xxx𝔸𝔸𝔸x語𝔸xxééxéx語語éxxé語𝔸𝔸語é𝔸éxx𝔸é𝔸𝔸é語𝔸語語語𝔸é𝔸𝔸語𝔸xxéé語語語語éé語ééééé語語x𝔸𝔸é𝔸xxé𝔸x𝔸xé語xé𝔸𝔸𝔸𝔸𝔸é語語x語𝔸é𝔸語xé𝔸xé𝔸é語é𝔸xé𝔸𝔸éééé𝔸語𝔸x𝔸語𝔸ééx語𝔸xéx𝔸語xé𝔸x𝔸語x語語éé𝔸語語𝔸𝔸𝔸é語𝔸x𝔸語語xx語語語𝔸語𝔸語é語é𝔸éxé𝔸語éx𝔸é𝔸é語語é𝔸𝔸語éx語𝔸x語xéé𝔸𝔸éé語𝔸x𝔸xé𝔸éé𝔸éx𝔸語𝔸xxéé語語語語𝔸𝔸語語xx𝔸語é語𝔸𝔸語xxx語語é𝔸éé𝔸𝔸語語語𝔸語𝔸𝔸𝔸é𝔸𝔸語éx𝔸𝔸𝔸語語xxééxxxé𝔸xéxé語é𝔸x𝔸éé語語é𝔸語語é語語𝔸é語𝔸𝔸éé𝔸語𝔸𝔸x語é𝔸𝔸x𝔸語é𝔸xé語語éx𝔸𝔸xx𝔸語𝔸é語x語x語xé語éxxéx語語𝔸語語語xé𝔸𝔸ééé語𝔸語𝔸𝔸語x語ééx𝔸𝔸é語xx𝔸é𝔸語xéé𝔸𝔸𝔸éx𝔸語x語x𝔸𝔸語x𝔸語x語𝔸éx𝔸語é𝔸語𝔸é𝔸𝔸xxxé語𝔸é語𝔸𝔸é語語xéééx𝔸éx語語語éx語éxééx語𝔸語x語x語𝔸éé𝔸語𝔸éé語𝔸𝔸ééx𝔸é語éxé𝔸é𝔸é𝔸xxé語𝔸𝔸𝔸éxéxéé𝔸語語語𝔸語é𝔸𝔸éx語xx語𝔸xéé語𝔸𝔸𝔸語𝔸xé語xx語𝔸𝔸x語語éx𝔸x語xéé𝔸𝔸𝔸語𝔸語語éé語x𝔸xé𝔸語ééxxéé𝔸é𝔸𝔸𝔸é𝔸𝔸x語語𝔸語xé𝔸語é語x語x語𝔸éé𝔸xéx𝔸語𝔸𝔸𝔸éxéé語é語x語xé𝔸é語é語語éxéx語𝔸x語語𝔸𝔸x語éxxéxx語語é語é𝔸語ééx語é𝔸ééx語語𝔸語é語xx語éé𝔸語𝔸𝔸𝔸é語xé𝔸é𝔸𝔸éé語語𝔸éxé𝔸x𝔸語𝔸x𝔸𝔸語xé𝔸語é𝔸x語𝔸𝔸x語𝔸𝔸語é𝔸語xxéé語語𝔸𝔸éx𝔸語x語語語é語éx語𝔸xé𝔸xé語x語é"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a template default's template identifier holding a character from U+10000 up is outside NCName by spec reading 94, and the import still writes its TemplateDefault row, which breaks E1 derived (family astral); value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "TemplateDefault" },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section><qti-assessment-section><qti-assessment-item-ref identifier=""/></qti-assessment-section></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): an empty assessment item ref identifier still writes its TestToken row, which breaks E1 derived on the import's side alone; value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "TestToken" },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>',
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-slider-interaction lower-bound="0"/></div>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a slider interaction writing its lower bound alone writes no Slider row, and E1 derived wants the bound's InteractionAttribute in Slider(node, lower) (NIL's \"(6) the absence defaults\"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "InteractionAttribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: ["qti-slider-interaction"],
              },
              { arg: { field: "name", kind: "field" }, kind: "in", values: ["lower-bound"] },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "value", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "Slider",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "lower", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/></resources></manifest>',
      ],
      [
        "items/item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><qti-slider-interaction upper-bound="10"/></qti-item-body></qti-assessment-item>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a slider interaction writing its upper bound alone writes no Slider row, and E1 derived wants the bound's InteractionAttribute in Slider(node, upper) (NIL's \"(6) the absence defaults\"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "InteractionAttribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: ["qti-slider-interaction"],
              },
              { arg: { field: "name", kind: "field" }, kind: "in", values: ["upper-bound"] },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "value", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "Slider",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "upper", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref><qti-template-default><qti-sum/><qti-base-value/></qti-template-default></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): two expressions under one qti-template-default, which admits one, break the import's per-parent Expression key under E1 derived beside Arity; Arity refuses it on both sides; lifted by keying only the child the content model admits",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "Expression",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "parentKind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-template-default" },
              },
            ],
          },
          terms: [{ field: "parent", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "choice.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-declaration><qti-mapping/><qti-mapping/></qti-response-declaration></qti-assessment-item>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="choice.xml"/></resources></manifest>',
      ],
    ],
    fix: "a stated limit (spec reading 1): two qti-mapping elements under one response declaration, which admits one, break the import's per-declaration Mapping key under E1 derived beside N7 Last; N7 Last refuses it on both sides; lifted by keying only the child the content model admits",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "Mapping",
          selection: { conjuncts: [] },
          terms: [{ field: "declaration", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.1</schemaversion></metadata><resources><resource xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><cpx:variant identifierref="choice_es"/></resource></resources></manifest>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a forbidden 3.0.1 cpx:variant's identifierref is still checked under Idref target though the law oracle drops the forbidden element's subtree (decision 452's kin); N5 admitted refuses it on both sides; lifted by checking only an identifierref whose every ancestor the grammar admits",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "IdrefTarget",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "assembled", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: false },
              },
            ],
          },
          terms: [
            { field: "document", kind: "field" },
            { field: "id", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "IdBinding",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "admitted", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
            ],
          },
          terms: [
            { field: "document", kind: "field" },
            { field: "id", kind: "field" },
          ],
        },
      },
      limit: "a forbidden ancestor",
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/></resources></manifest>',
      ],
      [
        "items/item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><p><m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mtable><m:mtr><m:mtd><m:maction selection="PT-1S"><m:mi/></m:maction></m:mtd></m:mtr></m:mtable></m:math></p></qti-item-body></qti-assessment-item>',
      ],
    ],
    fix: "a stated limit (spec reading 1): an m:maction selection outside its domain, such as PT-1S, is read by the import as 0, which breaks MathML maction selection, while the law oracle skips a selection that is no integer (family A); value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "MathML_maction_selection", relation: "MathAction" },
    },
  },
  {
    files: [
      [
        "d0.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-if><qti-is-null><qti-variable identifier="RESPONSE"/></qti-is-null></qti-response-if></qti-response-condition>',
      ],
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="d0.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section-ref href="d0.xml"/></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a section-typed resource whose root is qti-response-condition is still read by the import as a section document, so its variable reference breaks Prefixed reference where the law oracle reads no reference in it (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no references in a document whose root its type refuses",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "AssembledReference",
          selection: {
            conjuncts: [
              {
                arg: {
                  arg: { field: "kind", kind: "field" },
                  kind: "in",
                  values: [
                    "qti-lookup-outcome-value",
                    "qti-set-correct-response",
                    "qti-set-default-value",
                    "qti-set-outcome-value",
                    "qti-set-template-value",
                  ],
                },
                kind: "not",
              },
              {
                kind: "compare",
                left: {
                  args: [
                    { field: "kind", kind: "field" },
                    { field: "attribute", kind: "field" },
                  ],
                  field: "spelling",
                  kind: "closedAt",
                  relation: "VariableReference",
                },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "bare" },
              },
              {
                kind: "compare",
                left: { field: "role", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "variable" },
              },
            ],
          },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "Reading",
          selection: {
            conjuncts: [
              {
                args: [
                  {
                    arg: {
                      arg: { field: "kind", kind: "field" },
                      kind: "in",
                      values: [
                        "qti-lookup-outcome-value",
                        "qti-set-correct-response",
                        "qti-set-default-value",
                        "qti-set-outcome-value",
                        "qti-set-template-value",
                      ],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "form", kind: "field" },
                    op: "eq",
                    right: { kind: "literal", type: undefined, value: "unsplit" },
                  },
                ],
                kind: "or",
              },
              {
                args: [
                  {
                    args: [
                      {
                        args: [
                          { field: "number", kind: "field" },
                          { kind: "literal", type: undefined, value: "^[0-9]*[1-9][0-9]*$" },
                        ],
                        fn: "matches",
                        kind: "compute",
                      },
                      {
                        kind: "compare",
                        left: { field: "replaced", kind: "field" },
                        op: "eq",
                        right: { kind: "literal", type: undefined, value: true },
                      },
                    ],
                    kind: "and",
                  },
                  {
                    kind: "compare",
                    left: { field: "form", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "numbered" },
                  },
                ],
                kind: "or",
              },
              {
                kind: "compare",
                left: { field: "form", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "name" },
              },
              {
                kind: "compare",
                left: { field: "source", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "none" },
              },
            ],
          },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-outcome-processing><qti-set-outcome-value><qti-sum><qti-test-variables section-identifier="Kx語é語xéé𝔸xéé語é語語𝔸語éé𝔸xxx語𝔸xxé語é語語é𝔸語x𝔸語xxééé語𝔸é𝔸x𝔸語é𝔸語語x語éx𝔸語x𝔸é𝔸éxxx語語𝔸éxx𝔸𝔸𝔸x𝔸語語𝔸𝔸𝔸éxé語x𝔸xx語xxéx𝔸éxéé語語xéé𝔸xx𝔸xxx語éx語xxéx語xé語𝔸é𝔸éx𝔸𝔸𝔸𝔸é語é語𝔸éé語語𝔸語𝔸語語é𝔸éx𝔸語語語𝔸é𝔸語xxx語𝔸é𝔸𝔸é語語xx𝔸é𝔸é語語𝔸語𝔸𝔸x𝔸𝔸xx語éx語ééé𝔸語語語x𝔸語é語xx𝔸語é語語x𝔸語𝔸𝔸𝔸𝔸語語é𝔸𝔸𝔸xéééxééé語x語xxéé𝔸é𝔸xéx𝔸xéé語𝔸𝔸xé𝔸𝔸𝔸x語語é語語𝔸𝔸𝔸x語xéééx𝔸語𝔸xx語語𝔸éé𝔸語𝔸x語xé語𝔸xéx語é語語語é𝔸x語語x語éx語x𝔸éé𝔸x語xx語語x語xxxé𝔸語xé𝔸𝔸語語語語x語語x語x𝔸x𝔸éxx語語x𝔸𝔸xéxx語語語𝔸éxéxx𝔸𝔸語𝔸xxx𝔸xéx語xxxéé語x𝔸𝔸𝔸𝔸𝔸x𝔸é𝔸xé語語xx語x語x𝔸𝔸𝔸ééxéxéx語éxxé𝔸𝔸é𝔸𝔸𝔸𝔸éxx𝔸xéé𝔸語𝔸語éé𝔸éx𝔸語é𝔸𝔸語xéé𝔸xx𝔸𝔸éxéx語éxxé語éé𝔸𝔸𝔸語𝔸語éé語éé語語éé語𝔸é𝔸𝔸x語𝔸語xéé𝔸語語𝔸𝔸𝔸語語éxééx𝔸é語éxxéxx語𝔸語𝔸x語é𝔸語xx𝔸語語𝔸語語é𝔸語語語xxx𝔸𝔸𝔸x𝔸語𝔸語𝔸語x語𝔸é語語語𝔸ééé語𝔸x𝔸語éxxx𝔸x𝔸éxé𝔸éx𝔸𝔸éééxxé𝔸𝔸𝔸é𝔸𝔸xé語語éé𝔸é語éx𝔸é語x語xé𝔸語語𝔸xxééx語𝔸語語𝔸é𝔸語é𝔸é語xé語xxé語𝔸𝔸x𝔸語xééxé𝔸xxxxx語語éx𝔸𝔸x語語𝔸語𝔸xééxxx語語𝔸xxx𝔸𝔸é𝔸é語語語𝔸𝔸語語éxx語𝔸語語x𝔸ééééx𝔸語𝔸𝔸xéx𝔸éx𝔸é𝔸語語éx語𝔸éé語𝔸𝔸語éééé𝔸𝔸xéé𝔸é語語𝔸xx語語𝔸x𝔸x𝔸𝔸語é𝔸xé語x語x語éxx語é語𝔸é𝔸語é𝔸語xéé語語é語語語語x語éxxé𝔸ééx𝔸xxxx語語x語xxx語語ééxxéééxx語xxx語éxé語x語é語語語語éxx𝔸é語é語é𝔸x𝔸語éé語𝔸xxé𝔸éxxxxé𝔸é𝔸x𝔸xéxéx𝔸éxxéx語𝔸𝔸xx𝔸語é語x𝔸𝔸語xéxx𝔸x𝔸xx語語xx語語𝔸𝔸語éx𝔸𝔸xé𝔸x𝔸𝔸xx𝔸xx語語語𝔸語語語xxx𝔸éx𝔸語𝔸xé𝔸xé語x語𝔸語éx𝔸xx𝔸語語語é𝔸xé𝔸語語éx語𝔸𝔸語語𝔸語語x𝔸𝔸𝔸語é𝔸xéé語é語éxx語éééxx語𝔸語語é𝔸éé語é語x𝔸éxé語éx語語語𝔸x語xx𝔸𝔸𝔸𝔸é語é語語𝔸𝔸x𝔸xé語"/></qti-sum></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a section identifier holding a character from U+10000 up is outside NCName by spec reading 94, and the import still checks its Reading under Section identifier target; value domain refuses it on both sides; lifted by reading names from XML 1.0 Fifth Edition (spec reading 94), or by writing no row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "Section_identifier_target", relation: "Reading" },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "items/item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="N"/></qti-assessment-item>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item.xml"><qti-template-default template-identifier="N"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: 'a stated limit (spec reading 1): a template default without its expression writes no TemplateDefaultTarget row, and Template default target wants one per template default (NIL\'s "(6) the absence defaults"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written',
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "TemplateDefault",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "TemplateDefaultTarget",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "items/item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="N" base-type="integer"/></qti-assessment-item>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item.xml"><qti-template-default template-identifier="N"><qti-base-value/><qti-round-to/></qti-template-default></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a base value and a round-to under one qti-template-default naming an integer declaration, which admits one expression, also break Template default type beside Arity; Arity refuses it on both sides; lifted by typing only the child the content model admits",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "TemplateDefaultTarget",
          selection: {
            conjuncts: [
              {
                arg: {
                  arg: { field: "heldBase", kind: "field" },
                  kind: "in",
                  values: ["any", "unknown"],
                },
                kind: "not",
              },
              {
                kind: "compare",
                left: { field: "declBaseTypes", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: 1n },
              },
            ],
          },
          terms: [
            { field: "declaration", kind: "field" },
            { field: "heldBase", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "DeclarationBaseType",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "valueBase", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section visible="true"><qti-selection/></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: 'a stated limit (spec reading 1): a selection without its select attribute writes no SectionSelection row, and Test overlay wants one per node (NIL\'s "(6) the absence defaults"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written',
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Node",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-selection" },
              },
            ],
          },
          terms: [{ field: "id", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "SectionSelection",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section visible="true"><qti-assessment-item-ref><qti-variable-mapping/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: 'a stated limit (spec reading 1): a variable mapping missing either attribute writes no VariableMapping row, and Test overlay wants one per node (NIL\'s "(6) the absence defaults"); AL3 required refuses it on both sides; lifted by a law that wants the row only where the attribute is written',
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Node",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-variable-mapping" },
              },
            ],
          },
          terms: [{ field: "id", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "VariableMapping",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="section.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "section.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-condition><qti-response-else><qti-set-outcome-value identifier="SCORE"/></qti-response-else></qti-response-condition></qti-response-processing>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a section-typed resource whose root is qti-response-processing is still read by the import as a section document, so its variable reference breaks Variable declared where the law oracle reads no reference in it (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no references in a document whose root its type refuses",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "Variable_declared", relation: "Reading" },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="section.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "section.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-condition><qti-response-else><qti-set-outcome-value identifier="SCORE"/></qti-response-else></qti-response-condition></qti-response-processing>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a section-typed resource whose root is qti-response-processing is still read by the import as a section document, so its variable reference breaks Variable kind where the law oracle reads no reference in it (decision 449's shape); RootOfType refuses it on both sides; lifted by reading no references in a document whose root its type refuses",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "AssembledReference",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: [
                  "qti-lookup-outcome-value",
                  "qti-set-correct-response",
                  "qti-set-default-value",
                  "qti-set-outcome-value",
                  "qti-set-template-value",
                ],
              },
              {
                kind: "compare",
                left: { field: "role", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "variable" },
              },
            ],
          },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
            { field: "kind", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "Reading",
          selection: {
            conjuncts: [
              {
                args: [
                  {
                    arg: {
                      arg: { field: "kind", kind: "field" },
                      kind: "in",
                      values: [
                        "qti-lookup-outcome-value",
                        "qti-set-correct-response",
                        "qti-set-default-value",
                        "qti-set-outcome-value",
                        "qti-set-template-value",
                      ],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "form", kind: "field" },
                    op: "eq",
                    right: { kind: "literal", type: undefined, value: "unsplit" },
                  },
                ],
                kind: "or",
              },
              {
                args: [
                  {
                    args: [
                      {
                        args: [
                          { field: "number", kind: "field" },
                          { kind: "literal", type: undefined, value: "^[0-9]*[1-9][0-9]*$" },
                        ],
                        fn: "matches",
                        kind: "compute",
                      },
                      {
                        kind: "compare",
                        left: { field: "replaced", kind: "field" },
                        op: "eq",
                        right: { kind: "literal", type: undefined, value: true },
                      },
                    ],
                    kind: "and",
                  },
                  {
                    kind: "compare",
                    left: { field: "form", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "numbered" },
                  },
                ],
                kind: "or",
              },
              {
                kind: "compare",
                left: { field: "form", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "name" },
              },
              {
                kind: "compare",
                left: { field: "source", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "none" },
              },
            ],
          },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
            { field: "kind", kind: "field" },
          ],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "items/item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-declaration identifier="SCORE"/><qti-outcome-declaration identifier="SCORE"/></qti-assessment-item>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item.xml"><qti-variable-mapping source-identifier="SCORE" target-identifier="ITEMSCORE"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "issue #69 (decision 467): an identifier an item declares first as a response and then as an outcome is checked under Variable mapping source by its first declaration in the import and by any of its declarations in the law oracle; Declaration key refuses it on both sides; closed by both sides reading the same declaration of a duplicated name (#69)",
    owner: "decision 467",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "Variable_mapping_source", relation: "MappingSourceDeclaration" },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref href="items/item.xml"><qti-variable-mapping source-identifier="-1" target-identifier="ITEMSCORE"/></qti-assessment-item-ref></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a variable mapping source outside its domain, such as -1, is read by the law oracle as no reference, while the import still writes the mapping, whose MappingItemRefType containment in MappingSourceDeclaration breaks Variable mapping source (family A); value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "MappingItemRefType",
          selection: {
            conjuncts: [
              {
                arg: {
                  arg: { field: "type", kind: "field" },
                  kind: "in",
                  values: ["imsbasiclti_xmlv1p3", "imslti_xmlv1p1", "imsltia_xmlv1p0"],
                },
                kind: "not",
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "MappingSourceDeclaration",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>',
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="rtest01-fragment.xml"/><qti-hottext-interaction><p><qti-hottext identifier="-0"/></p></qti-hottext-interaction></div>',
      ],
    ],
    fix: "a stated limit (spec reading 1): in a fragment that includes itself the import still judges an attribute's value domain, while the law oracle reads no value domain there (decision 451's kin); Inclusion cycle refuses it on both sides; lifted by judging no value domain in a document an inclusion cycle refuses",
    owner: "decision 463",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "value_domain", relation: "Attribute" },
      limit: "an inclusion cycle",
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set03.xml"/><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>',
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<p xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>',
      ],
      [
        "rtest01/rtest01-set03.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xi="http://www.w3.org/2001/XInclude"><qti-item-body><xi:include href="rtest01-fragment.xml"><p><qti-template-inline template-identifier="Kxx𝔸xéé語語語語éééxé𝔸x𝔸ééééx𝔸𝔸語語é𝔸𝔸xxé𝔸𝔸éxx𝔸x𝔸𝔸ééé語x語é語𝔸éé𝔸語𝔸xé語xéxx語𝔸𝔸xééxxéxx𝔸𝔸𝔸éé語𝔸𝔸x語éé語é𝔸𝔸𝔸x語xé語語é𝔸語xéxx𝔸éx語語x語語ééxé語語xxx語語é𝔸xéé𝔸𝔸語語ééé𝔸é𝔸𝔸𝔸語語𝔸語xx𝔸𝔸xé語xx語語x𝔸x𝔸x語xéé語éxxééxé語𝔸éxx𝔸x語é語xx𝔸éx𝔸𝔸語x𝔸語xxéx語éxéx𝔸𝔸é語語語é語é𝔸𝔸𝔸ééx𝔸é語𝔸xx𝔸語語ééééé𝔸𝔸𝔸éé語x𝔸éx語xé𝔸語é𝔸𝔸éé語語𝔸xxé𝔸éxxx𝔸é語xéé𝔸éx𝔸xéé𝔸é𝔸éééx𝔸é語x語éxéx𝔸𝔸語x𝔸語éééé𝔸語xxé語éé語xx𝔸é語éééx𝔸𝔸𝔸ééé𝔸語x𝔸xxéx語xx語x語x語語𝔸𝔸語語xxxéx語x語𝔸x𝔸𝔸語é𝔸語𝔸語𝔸xx語語é𝔸𝔸𝔸𝔸xé𝔸é𝔸𝔸ééééé𝔸𝔸é語xééx語𝔸é語xé𝔸ééx𝔸𝔸𝔸語𝔸x𝔸語𝔸語x𝔸𝔸語xéé𝔸𝔸éxéx語𝔸𝔸éé語éx語x𝔸éxxéx語ééx語xé𝔸x𝔸x𝔸𝔸xé𝔸語語語é語éxx語𝔸𝔸語ééxéx語é𝔸é𝔸𝔸é𝔸é𝔸ééx語éx𝔸語xx𝔸語x𝔸éx𝔸é𝔸xx語語語éé𝔸語ééxxxxéx語語𝔸éé語語𝔸𝔸𝔸𝔸語𝔸ééx𝔸𝔸x𝔸x語𝔸語éx語𝔸éé𝔸xéxé𝔸語𝔸語𝔸𝔸語𝔸é語𝔸é𝔸語éxx𝔸é𝔸𝔸é𝔸𝔸x語xé𝔸xéé𝔸x𝔸𝔸xéé語語語語é語é語語xxéx𝔸éxx𝔸éx語語語語語𝔸é語𝔸xxééxéxx𝔸xx語𝔸x𝔸𝔸éééxéxx語éé𝔸語語語語xxé語xx𝔸éx語語𝔸𝔸𝔸語xxxé語𝔸𝔸ééx𝔸語𝔸xxx𝔸語語é𝔸語éxéxéxé𝔸𝔸𝔸𝔸𝔸𝔸𝔸éx𝔸xééééxx語é語x語語𝔸語x語xéx𝔸𝔸語語xx𝔸𝔸éx語x語𝔸𝔸語語é𝔸𝔸é語𝔸語x語xx𝔸éxé𝔸x𝔸𝔸𝔸x語語𝔸x𝔸x語𝔸x語語語語x語語xéxé語é語語𝔸𝔸é𝔸x𝔸x𝔸𝔸𝔸𝔸x語語語x語éé𝔸xx語xxx語xxééx𝔸é語語語é𝔸𝔸語x語𝔸語xxéééé𝔸x𝔸xé語x語é語語𝔸é語語語𝔸𝔸𝔸語語é語x𝔸語語語x𝔸𝔸𝔸𝔸語𝔸語語𝔸語x𝔸xé𝔸語𝔸é語𝔸𝔸𝔸語𝔸éé語𝔸é語𝔸é𝔸𝔸xéx語x語xx𝔸x𝔸𝔸éx𝔸x語é𝔸𝔸語語語𝔸𝔸ééé𝔸𝔸é𝔸𝔸é語語語é𝔸é語語xx語xxx𝔸𝔸𝔸𝔸𝔸é𝔸xé𝔸𝔸é語𝔸é語𝔸xé𝔸語xxxéé𝔸é𝔸x𝔸語𝔸𝔸𝔸ééx𝔸éxxé語語𝔸𝔸語é𝔸𝔸𝔸𝔸é𝔸x語é𝔸𝔸語𝔸xxééx語語x語"/></p></xi:include></qti-item-body></qti-assessment-item>',
      ],
    ],
    fix: "reading 118 decided 2026-11-09; the law oracle should assess content outside xi:fallback laxly, as the importer does (#66)",
    owner: "decision 467",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "value_domain", relation: "Attribute" },
      limit: "content outside xi:fallback (#66)",
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="assembly-manifest"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="item-res" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource><resource identifier="test-res" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource></resources></manifest>',
      ],
      [
        "item.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false"/>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="test" title="Assembly"><qti-test-part identifier="p46" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s23" title="s23" visible="true"><qti-assessment-section identifier="s8" title="s8" visible="true"><qti-assessment-section identifier="s7" title="s7" visible="true"><qti-assessment-item-ref identifier="i6" href="item.xml"><qti-branch-rule target="a:b"><qti-base-value base-type="boolean">true</qti-base-value></qti-branch-rule></qti-assessment-item-ref></qti-assessment-section></qti-assessment-section></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a branch rule target outside its domain, such as a:b, still writes its BranchResolution row, so Branch target breaks and the import names branch-target where the law oracle names attribute-lexical (family A); value domain refuses it on both sides; lifted by writing no derived row for a value outside its domain",
    owner: "decision 463",
    signature: {
      importRule: "branch-target",
      kind: "lone-refusal",
      law: "value domain",
      witness: "unreported",
    },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="items/media/pic.png"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "items/media/pic.png",
        "b64",
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
      ],
      ["test.xml", "xml", '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test/>'],
    ],
    fix: "a stated limit (spec reading 1): two documents fail the codec differently (a binary file typed as a fragment, a namespace-less root), and each side names the first in manifest order (the law oracle at src/test/oracle.ts:6710-6718, the import at src/import/program.ts:190-193), so the rule named moves with resource order; the codec refuses it on both sides; lifted by a codec precedence that names one rule whatever the order",
    noised: { noise: "resource-order", salt: 90 },
    owner: "decision 463",
    signature: { kind: "noise-moved", noise: "resource-order", side: "import" },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="items/media/pic.png"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "items/media/pic.png",
        "b64",
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
      ],
      ["test.xml", "xml", '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test/>'],
    ],
    fix: "a stated limit (spec reading 1): two documents fail the codec differently (a binary file typed as a fragment, a namespace-less root), and each side names the first in manifest order (the law oracle at src/test/oracle.ts:6710-6718, the import at src/import/program.ts:190-193), so the rule named moves with resource order; the codec refuses it on both sides; lifted by a codec precedence that names one rule whatever the order",
    noised: { noise: "resource-order", salt: 90 },
    owner: "decision 463",
    signature: { kind: "noise-moved", noise: "resource-order", side: "oracle" },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imslti_xmlv1p1" href="items/item.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-item-ref identifier="ref1" href="items/item.xml"/></qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value><qti-index n="ref1.DIGITS"/></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): an LTI resource type written in a 3.0.0 package, outside 3.0.0's domain, is read as an LTI link by the import and as no type by the law oracle, so the oracle raises Prefixed reference for a prefixed reference the import resolves through the link; value domain refuses it on both sides; lifted by both sides reading an out-of-domain resource type alike",
    owner: "decision 463",
    signature: { kind: "oracle-only-law", law: "Prefixed reference" },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_outcomes_xmlv3p0" href="testoutcome01.xml"/></resources></manifest>',
      ],
      [
        "testoutcome01.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-outcome-declaration xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-default-value><qti-value field-identifier="note"/><qti-value field-identifier="note"/></qti-default-value></qti-outcome-declaration>',
      ],
    ],
    fix: "a stated limit (spec reading 1): a default value repeating a field identifier whose values write no base type has the law oracle raise Record field key for the repeated field, while the import writes no RecordField row for such values; Value cardinality refuses it on both sides; lifted by keying only the fields the content model admits",
    owner: "decision 463",
    signature: { kind: "oracle-only-law", law: "Record field key" },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section identifier="first"/><qti-assessment-section><qti-assessment-section-ref href="test.xml"/></qti-assessment-section></qti-test-part><qti-outcome-processing><qti-set-outcome-value><qti-sum><qti-test-variables section-identifier="first"/></qti-sum></qti-set-outcome-value></qti-outcome-processing></qti-assessment-test>',
      ],
    ],
    fix: "a stated limit (spec reading 1): under a test that places itself as a section, the law oracle drops the cyclic placement's content and so loses the section a test variables reference names, raising Section identifier target, while the import still reads that section; Inclusion cycle refuses it on both sides; lifted by the import dropping that content as the law oracle does",
    owner: "decision 463",
    signature: { kind: "oracle-only-law", law: "Section identifier target" },
  },
];

/**
 * The disagreements a fix closed, each kept as a seed: the closed class's signature, the lane that
 * fixed it, the fix, and the package that showed it, which must never show it again.
 */
export const fixed: readonly Known[] = [
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "rtest01/rtest01-fragment.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-hottext-interaction><p><qti-hottext><xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href="rtest01-fragment.xml"/></qti-hottext></p></qti-hottext-interaction></div>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-selection select="K語𝔸語é𝔸語xx語語𝔸ééx𝔸é𝔸xxééx𝔸xéxé語éx𝔸é語éé語xéx𝔸x語x語éx語é𝔸xxx語語éé語é語語𝔸x𝔸𝔸xx語𝔸x𝔸x語𝔸x語é𝔸x𝔸x語é𝔸éxééé語語xéé𝔸x𝔸é𝔸é語xéééx語é𝔸é語x𝔸語𝔸語語é𝔸語語éxé語éé語éé𝔸xééx𝔸x𝔸é語𝔸𝔸𝔸x語語x語𝔸語𝔸𝔸é𝔸𝔸éé𝔸xx語語x語xé𝔸語xx𝔸𝔸éx𝔸語x語𝔸語ééx𝔸éxx𝔸x語語語é語語𝔸éé語ééx語éééx𝔸語語x𝔸éé語x𝔸𝔸語é𝔸é𝔸xx語x語xééx語éxx語xx𝔸ééééx語語xé𝔸x𝔸é𝔸éxéx語éx語x𝔸ééx語xx語x語𝔸ééé語éx語𝔸語éx語𝔸ééxéé語é𝔸éé語𝔸x語é語xxx語éxé語語語x𝔸𝔸é𝔸𝔸x語語xx語𝔸𝔸語𝔸語語𝔸é語x𝔸x𝔸x語x𝔸xxé𝔸𝔸xx𝔸語x𝔸𝔸xé𝔸xé𝔸é𝔸x𝔸語ééé𝔸語é語𝔸xéx語é𝔸𝔸éé𝔸𝔸𝔸x語éxxxx𝔸𝔸é語語𝔸語語éé𝔸x𝔸𝔸語語xé𝔸𝔸é𝔸é𝔸𝔸x𝔸𝔸éx𝔸𝔸x𝔸語𝔸xxx𝔸𝔸xééé語語語xx語ééé語éxxéx𝔸é𝔸語éx語éx語xé𝔸𝔸é𝔸語é語éxéx𝔸𝔸𝔸𝔸é語é𝔸é𝔸𝔸éé語𝔸語𝔸語𝔸語語𝔸x語xé語語éx語𝔸x語語éééééé𝔸éé語é語éxx語é語x𝔸語語x𝔸語𝔸語é語𝔸éééxéé𝔸é語é𝔸𝔸語𝔸𝔸ééxé𝔸語é𝔸𝔸éxx語語𝔸𝔸𝔸語xéé𝔸xxéééxx語𝔸x語é𝔸語x𝔸語xx𝔸x語é𝔸語語𝔸xéx𝔸𝔸語𝔸éé語xx𝔸語é𝔸é𝔸𝔸é𝔸éxxxéx𝔸é語ééé𝔸é𝔸語é語𝔸𝔸é𝔸é𝔸x語x𝔸x語𝔸語éé𝔸xx語語x語𝔸𝔸語語é𝔸ééé𝔸𝔸xx𝔸x語é語x語é語éx語é語éé語𝔸𝔸𝔸x𝔸𝔸x語ééé𝔸語𝔸𝔸éé語x語𝔸𝔸xééx𝔸xé語語é語𝔸語x語𝔸éé𝔸𝔸éé𝔸x𝔸é𝔸語語xé語𝔸x語語xx𝔸xé𝔸éxx語x語𝔸𝔸語𝔸x𝔸𝔸語語é𝔸x語𝔸語x𝔸𝔸x語x語𝔸xx語x語𝔸é𝔸éxéé𝔸語é𝔸𝔸x語éx𝔸éx𝔸𝔸x𝔸é語𝔸𝔸語x𝔸éxéx語𝔸語éé語語ééxé𝔸語語語𝔸語xé語語x𝔸x𝔸é語語語𝔸𝔸xé語x語語é𝔸𝔸é語語éé語語x𝔸語𝔸é語é語xéx語xxé語é𝔸x𝔸語x語é語語𝔸x語語語xéé語語x𝔸𝔸語語語語é𝔸語𝔸語𝔸xx𝔸𝔸x𝔸𝔸語語𝔸é語𝔸𝔸𝔸x語é語éé語xéééé語語é𝔸語𝔸x語éx語𝔸xééé語é𝔸x𝔸éx語𝔸語x𝔸語語語𝔸éx𝔸𝔸𝔸𝔸𝔸x𝔸xé語é語x語𝔸é語𝔸éé𝔸𝔸𝔸𝔸語éx語éx語𝔸éx"/></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "issue #67 (decision 467), closed by 74db65bd: the import writes a SectionSelection row whatever its select holds, and SelectForm's pattern law refuses a form that names no integer, so a non-integer select past the key-text bound is keyed and bounded on the import's side as the law oracle bounds SectionSelection.selectLexical; the inclusion cycle is incidental, and value domain refuses it on both sides",
    owner: "decision 467",
    signature: { kind: "oracle-only-law", law: "Key text bound", limit: "an inclusion cycle" },
  },
  {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_section_xmlv3p0" href="section.xml"/><resource type="imsqti_test_xmlv3p0" href="test.xml"/></resources></manifest>',
      ],
      [
        "section.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-section xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-rubric-block><qti-content-body><div><qti-portable-custom-interaction><qti-context-variable identifier="CTX"/></qti-portable-custom-interaction></div></qti-content-body></qti-rubric-block></qti-assessment-section>',
      ],
      [
        "test.xml",
        "xml",
        '<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part><qti-assessment-section><qti-assessment-section-ref href="section.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>',
      ],
    ],
    fix: "no longer shown since the merge of #96 (9cf1cc67) onto our model: a section document's context variable is written as one of its names (SectionContextName, #pantry/qti/interactions.ts) and resolved under each placement, in a rubric's portable custom interaction too, so the import's rows break Context variable reference where the law oracle raises it; N6 ancestry refuses it on both sides",
    owner: "decision 463",
    signature: { kind: "oracle-only-law", law: "Context variable reference" },
  },
  {
    files: [
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
    ],
    fix: "no longer shown on the host since the merge of #96 (9cf1cc67) onto 660a9d64's model: LomObjectTitle is stated only over queries (ListedTitle in MatchedTitle, #pantry/qti/queries.ts), which the host never judges, so neither copy's import summary names it and the renamed twin moves no host verdict; the database judges the record a record file names (#pantry/import/record-naming.db.test.ts), and RootOfType refuses both copies on both sides; it must not show again unless the host judges that law",
    noised: { noise: "path-rename", salt: 490 },
    owner: "decision 463",
    signature: { kind: "noise-moved", noise: "path-rename", side: "import" },
  },
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
    signature: { field: "copy", kind: "dangling-uuid", relation: "AssembledId" },
  },
  {
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
    signature: { field: "document", kind: "dangling-uuid", relation: "ItemRefDocument" },
  },
  {
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
    signature: {
      field: "declaration",
      kind: "dangling-uuid",
      relation: "MappingSourceDeclaration",
    },
  },
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
    signature: { field: "copy", kind: "dangling-uuid", relation: "PlacedId" },
  },
  {
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
    signature: {
      field: "declaration",
      kind: "dangling-uuid",
      relation: "PlacedVariableRefDeclaration",
    },
  },
  {
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
    signature: {
      field: "declaration",
      kind: "dangling-uuid",
      relation: "SectionTemplateRefDeclaration",
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-item-body><p><qti-template-inline template-identifier="NONE"/></p></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "NS2: a content reference that names no declaration has no declaration row, its *RefDeclaration relation's, never the nil uuid, so its law refuses it by that row's absence",
    owner: "NIL",
    signature: { field: "declaration", kind: "dangling-uuid", relation: "TemplateRefDeclaration" },
  },
  {
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
    signature: { field: "declaration", kind: "dangling-uuid", relation: "VariableRefDeclaration" },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "BindingCardinality",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: [
                  "qti-associate-interaction",
                  "qti-choice-interaction",
                  "qti-gap-match-interaction",
                  "qti-graphic-associate-interaction",
                  "qti-graphic-gap-match-interaction",
                  "qti-hotspot-interaction",
                  "qti-hottext-interaction",
                  "qti-match-interaction",
                  "qti-position-object-interaction",
                  "qti-select-point-interaction",
                ],
              },
              {
                kind: "compare",
                left: { field: "attribute", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "response-identifier" },
              },
              {
                kind: "compare",
                left: { field: "cardinality", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "single" },
              },
              {
                kind: "compare",
                left: { field: "mosts", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: 1n },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "MostCount",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "mostValue", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: 1n },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "BoundVariable",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
            { field: "kind", kind: "field" },
            { field: "document", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "BindingDeclaration",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
            { field: "kind", kind: "field" },
            { field: "document", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "PlacedBinding",
          selection: { conjuncts: [] },
          terms: [
            { field: "instance", kind: "field" },
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
            { field: "assembly", kind: "field" },
            { field: "document", kind: "field" },
            { field: "kind", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "PlacedBindingDeclaration",
          selection: { conjuncts: [] },
          terms: [
            { field: "instance", kind: "field" },
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
            { field: "assembly", kind: "field" },
            { field: "document", kind: "field" },
            { field: "kind", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    signature: { kind: "oracle-only-law", law: "LOM learning resource type" },
  },
  {
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
    signature: { kind: "oracle-only-law", law: "Template default target" },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "DeclarationCardinality",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "cardinality", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "record" },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: [
                  "qti-context-declaration",
                  "qti-outcome-declaration",
                  "qti-response-declaration",
                  "qti-template-declaration",
                ],
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "base-type" },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "DeclarationCardinality",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: [
                  "qti-context-declaration",
                  "qti-outcome-declaration",
                  "qti-response-declaration",
                  "qti-template-declaration",
                ],
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "cardinality" },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="many" base-type="identifier"/></qti-assessment-item>`,
      ],
    ],
    fix: "spec readings 157 and 158: every declaration has its Declaration row and every row below it whatever its identifier, cardinality and base type spell, each of which is a row of its own (DeclarationIdentifier, DeclarationCardinality, DeclarationBaseType), written only where it names or spells something, so AL3 or the value domain refuses one that does not alone (FIX-DECLNAME closed a nameless declaration's case, FIX-DECLCARD one whose cardinality or base type spells nothing)",
    owner: "FIX-DECLCARD",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Node",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: [
                  "qti-context-declaration",
                  "qti-outcome-declaration",
                  "qti-response-declaration",
                  "qti-template-declaration",
                ],
              },
            ],
          },
          terms: [{ field: "id", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "Declaration",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Dependency",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "DependencyTarget",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "SitePath",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "entry", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-assessment-section-ref" },
              },
            ],
          },
          terms: [
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "TestDocument",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "rootKind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-assessment-section" },
              },
            ],
          },
          terms: [
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
          ],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "SiteTarget",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-assessment-section-ref" },
              },
            ],
          },
          terms: [
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
            { field: "target", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "TestDocument",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "rootKind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-assessment-section" },
              },
            ],
          },
          terms: [
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
            { field: "node", kind: "field" },
          ],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "IdBinding",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "admitted", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
            ],
          },
          terms: [
            { field: "document", kind: "field" },
            { field: "id", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "CountBound" },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "DeclarationCardinality" },
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="single" base-type="identifier"/></qti-assessment-item>`,
      ],
    ],
    fix: "spec reading 156, reading 152's for the IDs: an ID-typed attribute or text is an ID value only where its value is an NCName (the grammar's ncNamePattern), so the import and the schema's copy sources (namingIdAttributes, idTexts, headerIds) write no DocumentId and no TableHeader for an empty identifier or one with whitespace inside, its value domain refuses it alone, and an IDREF or a cell's headers token that names it is refused under its own law, as the oracle reads idsOf and tableHeadersOf",
    owner: "FIX-IDNCNAME",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "DocumentId" },
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="R" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="R" max-choices="1 2"><qti-simple-choice identifier="A">a</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: 'the value of a read attribute is its lexical form collapsed (Compute.collapse, as on SsmlAttribute), never an outer-whitespace split whose value E1_derived held to no whitespace: a collapsed value with whitespace inside (max-choices="1 2", a reference "a b") is in the lexical space of no atomic type, and its value domain refuses it alone',
    owner: "FIX-ATOMIC",
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "E1_derived", relation: "InteractionAttribute" },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: ["qti-assessment-item", "qti-assessment-test"],
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "identifier" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "lexical", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ObjectIdentifier",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "lexical", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: ["qti-assessment-item", "qti-assessment-test"],
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "title" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "lexical", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ObjectTitle",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "title", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Expression",
          selection: {
            conjuncts: [
              {
                args: [
                  {
                    arg: {
                      arg: { field: "kind", kind: "field" },
                      kind: "in",
                      values: ["qti-base-value", "qti-math-operator", "qti-test-variables"],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "baseType", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "unknown" },
                  },
                ],
                kind: "or",
              },
            ],
          },
          terms: [
            { field: "kind", kind: "field" },
            { field: "baseType", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ResultBase",
          selection: { conjuncts: [] },
          terms: [
            { field: "kind", kind: "field" },
            { field: "base", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "IdrefTarget",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "assembled", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: false },
              },
            ],
          },
          terms: [
            { field: "document", kind: "field" },
            { field: "id", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "IdBinding",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "admitted", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
            ],
          },
          terms: [
            { field: "document", kind: "field" },
            { field: "id", kind: "field" },
          ],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        field: "languageTag",
        kind: "pattern",
        patterns: [{ flags: "su", source: "^.*$" }],
        relation: "LomString",
      },
    },
  },
  {
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
    signature: {
      importRule: "document-key",
      kind: "lone-refusal",
      law: "N5 admitted",
      witness: "unreported",
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "documentType", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "manifest" },
              },
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "cp:manifest" },
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "identifier" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "lexical", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ManifestId",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "lexical", kind: "field" },
          ],
        },
      },
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="many" base-type="identifier"><qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping></qti-response-declaration></qti-assessment-item>`,
      ],
    ],
    fix: "spec readings 157 and 158: a response declaration keeps its Declaration row whatever its identifier, cardinality and base type spell, so its mapping and each map key have their rows, judged as any other's (FIX-DECLNAME closed a nameless declaration's case, FIX-DECLCARD one whose cardinality or base type spells nothing)",
    owner: "FIX-DECLCARD",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-map-entry" },
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "map-key" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "lexical", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "MapKey",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "key", kind: "field" },
          ],
        },
      },
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p>a <qti-gap identifier="G1"/> b</p></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "N8: the oracle states the choice law the schema does, every choice that writes its identifier in an interaction, its nearest (the information model's parents of each choice class, §5.55's gap, reading 38), so a qti-gap outside every qti-gap-match-interaction breaks N8 beside N6 on both sides",
    owner: "OL",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Choice",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "ChoiceInteraction",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "Reserved_type", relation: "DeclarationName" },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "Named",
          selection: { conjuncts: [] },
          terms: [
            { field: "document", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "TemplateRef",
          selection: {
            conjuncts: [
              {
                args: [
                  {
                    arg: {
                      arg: { field: "identifier", kind: "field" },
                      kind: "in",
                      values: ["QTI_CONTEXT", "completionStatus", "duration", "numAttempts"],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "assemblyKind", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "qti-assessment-item" },
                  },
                ],
                kind: "or",
              },
              {
                args: [
                  {
                    arg: {
                      arg: { field: "identifier", kind: "field" },
                      kind: "in",
                      values: ["QTI_CONTEXT", "completionStatus", "duration", "numAttempts"],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "assemblyKind", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "qti-response-processing" },
                  },
                ],
                kind: "or",
              },
              {
                args: [
                  {
                    arg: {
                      arg: { field: "identifier", kind: "field" },
                      kind: "in",
                      values: ["QTI_CONTEXT", "duration"],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "assemblyKind", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "qti-assessment-section" },
                  },
                ],
                kind: "or",
              },
              {
                args: [
                  {
                    arg: {
                      arg: { field: "identifier", kind: "field" },
                      kind: "in",
                      values: ["QTI_CONTEXT", "duration"],
                    },
                    kind: "not",
                  },
                  {
                    kind: "compare",
                    left: { field: "assemblyKind", kind: "field" },
                    op: "ne",
                    right: { kind: "literal", type: undefined, value: "qti-assessment-test" },
                  },
                ],
                kind: "or",
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "TemplateRefDeclaration",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "attribute", kind: "field" },
          ],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        kind: "key",
        side: {
          relation: "AssembledName",
          selection: { conjuncts: [] },
          terms: [
            { field: "assembly", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
      },
    },
  },
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
<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-test-part/></qti-assessment-test>`,
      ],
    ],
    fix: "reading 147: a test part, section, section ref, item ref or stimulus ref that writes no identifier names nothing, so it writes no Named or StimulusRef row, and AL3 alone refuses it",
    owner: "FB-TESTS",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Named",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "TestToken",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "identifier" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "value", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    <qti-assessment-section identifier="s22" keep-together="false">
      <qti-assessment-section identifier="s16" visible="true">
        
        
        <qti-assessment-section identifier="s15" title="s15">
          
          
        </qti-assessment-section>
      </qti-assessment-section>
      
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`,
      ],
    ],
    fix: "spec reading 173: a section is invisible only where its own visible flag, a row of its own, reads false, so one that writes no visible is never loose and AL3 alone refuses it, never an unwritten visible read as false (the Section.visible the old class named)",
    owner: "SWEEP-VISIBLE",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Section",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "loose", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "TestFlag",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "visible" },
              },
              {
                kind: "compare",
                left: { field: "value", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: false },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
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
    <qti-assessment-section identifier="s22" keep-together="false">
      <qti-assessment-section identifier="s16" visible="true">
        
        
        <qti-assessment-section identifier="s15" title="s15">
          
          
        </qti-assessment-section>
      </qti-assessment-section>
      
    </qti-assessment-section>
  </qti-test-part>
</qti-assessment-test>`,
      ],
    ],
    fix: "spec reading 173: a section is invisible only where its own visible flag, a row of its own, reads false, so one that writes no visible is never loose and AL3 alone refuses it, never an unwritten visible read as false (the Section.visible the old class named)",
    owner: "SWEEP-VISIBLE",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Section",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "keepTogether", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: false },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "TestFlag",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "keep-together" },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "SitePath",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ReferencePath",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "href" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
          ],
        },
      },
    },
  },
  {
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
    signature: {
      kind: "import-only-law",
      law: { kind: "check", name: "value_domain", relation: "Attribute" },
    },
  },
  {
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
    fix: 'decision 454: an item ref whose path only a resource of an unread type names has an ItemRefHref and no target (the query UntargetedItemRef), contained in UnreadTypeHref, so "Item ref target" asks it for no target, as the law oracle names none; the package is R-O6, and its type="bogus" twin and m0 (type="imsqti_item_xmlv2p2", unread) showed the same class',
    owner: "genetic-repair gr-5b",
    // His key, "contained Attribute(node) in ItemRefTarget(node)", is the law this fix split: an
    // item ref's href is held to its ItemRefHref, and its ItemRefHref to its targets, which the
    // database now derives (the query ItemRefTarget). Its class, an item ref href the rows leave
    // unheld, is the href's containment in ItemRefHref.
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "Attribute",
          selection: {
            conjuncts: [
              {
                arg: { field: "kind", kind: "field" },
                kind: "in",
                values: ["qti-assessment-item-ref"],
              },
              {
                kind: "compare",
                left: { field: "name", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "href" },
              },
            ],
          },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "ItemRefHref",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
      },
    },
  },
  {
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
    signature: {
      importRule: "item-ref-target",
      kind: "lone-refusal",
      law: "AL3 required",
      witness: "unreported",
    },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p>a <qti-gap identifier="G1"/> b</p></qti-item-body></qti-assessment-item>`,
      ],
    ],
    fix: "TD-B's or-n6-missing, kept as a planted bug: the oracle's N6 reads the flags a kind needs (Needs), so a qti-gap outside every qti-gap-match-interaction breaks N6 beside N5 Follow, and N5 Follow is never the oracle's lone law here",
    owner: "GEN-A",
    signature: {
      importRule: "owner-copy",
      kind: "lone-refusal",
      law: "N5 Follow",
      witness: "unreported",
    },
  },
  {
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
    signature: {
      importRule: "attribute-lexical",
      kind: "lone-refusal",
      law: "N5 admitted",
      witness: "unreported",
    },
  },
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
    signature: {
      importRule: "binding-declared",
      kind: "lone-refusal",
      law: "N5 admitted",
      witness: "unreported",
    },
  },
  {
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
        `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`,
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
    signature: {
      importRule: "lom-identifier",
      kind: "lone-refusal",
      law: "RootOfType",
      witness: "unreported",
    },
  },
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
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><resources><resource identifier="Ké𝔸語xx𝔸語x𝔸𝔸xxééé語𝔸語x語𝔸語語x𝔸語é𝔸𝔸語𝔸語語𝔸語語語x語𝔸語語x𝔸語x𝔸éxxx𝔸xx語xxx𝔸𝔸xx語𝔸x語xéxxéé語𝔸éé𝔸語𝔸語𝔸x語𝔸éx𝔸x𝔸語xéx𝔸𝔸xxé語𝔸語éé𝔸é𝔸𝔸𝔸語𝔸𝔸é語xxx語x𝔸𝔸xé語𝔸é𝔸語éxé𝔸éé語x𝔸𝔸語éxxéxé語x𝔸xx𝔸é𝔸語語éé語𝔸𝔸𝔸𝔸é𝔸𝔸語x語語語x𝔸é語é語語xxx語x𝔸𝔸𝔸語éé語é語é語語é語語𝔸語x語x𝔸語xxé語𝔸ééx語𝔸𝔸𝔸𝔸é𝔸語語xxééxé𝔸xé語語x𝔸語xx語語𝔸é𝔸x語語é𝔸x語𝔸𝔸éé𝔸語xé語語語xx語xxé語語語é語𝔸語xé語xé語é語x語語éxééé語語𝔸語x語𝔸𝔸éx𝔸語語é𝔸xxééé𝔸語xé語xéé𝔸𝔸x𝔸𝔸é𝔸éx𝔸x語ééééx語𝔸語xé語x𝔸語語xxxéé語é語x𝔸語𝔸é𝔸語x𝔸x語𝔸語語𝔸𝔸x語x語𝔸語𝔸語𝔸𝔸é𝔸𝔸𝔸𝔸𝔸éxééx語𝔸語𝔸é語語𝔸éxx𝔸ééx語éxé語x𝔸𝔸語xé𝔸𝔸xxé語xx語𝔸語語𝔸xéx語語𝔸x語x𝔸𝔸x語𝔸é語é語語𝔸語xéxxé𝔸éx語𝔸𝔸語x𝔸éé𝔸語xé𝔸x語xx語語語𝔸𝔸語語éx語éx語éxééé𝔸é𝔸x語𝔸é𝔸x語𝔸x語ééx語𝔸𝔸éxééé𝔸x𝔸語é𝔸語xéxxx𝔸語𝔸語éxxx𝔸é語𝔸語𝔸xxéx語xéx語é語𝔸𝔸𝔸𝔸𝔸éxxxé𝔸語語é語ééxéé語xéé𝔸xx語é𝔸𝔸𝔸𝔸éxé𝔸x語éx𝔸éé𝔸x語𝔸x語ééé𝔸𝔸𝔸éé語xé語𝔸é𝔸xx語é語𝔸x語é語éé語éxé𝔸𝔸x𝔸𝔸𝔸x𝔸𝔸é𝔸é𝔸éé𝔸éé語語xx𝔸𝔸xxééé𝔸xxé𝔸éx語語éxéx語語𝔸ééx語xx𝔸語語é𝔸x語𝔸é語éxééxé𝔸x語xxx語éxééé𝔸𝔸éx𝔸é語語x𝔸語語語é語éx語𝔸𝔸x語é𝔸語xxx𝔸語xéééx語語語𝔸éxéx語é𝔸éxx語é語xé𝔸𝔸x語é語xéx語語x語𝔸𝔸語xxé𝔸語xéxx語ééxé語𝔸語ééxé語é𝔸𝔸語xxéé𝔸xx𝔸éé語語éé語𝔸𝔸x語語x語xé語x𝔸éé語𝔸é𝔸xxé語x語x語語x𝔸xxxxx𝔸語xxxx語é𝔸é語é𝔸語x語xéé𝔸𝔸xxx𝔸𝔸𝔸𝔸x𝔸語語xxéxx語é語x語𝔸x語xé語éxxxxé語語語語x語𝔸語語é𝔸𝔸ééx𝔸é𝔸éx語é語𝔸xxxx語é𝔸éééx語xx語é語é𝔸𝔸é𝔸éx語語語語x𝔸éé𝔸ééé𝔸xééé𝔸xéé語xé語語xé𝔸xé𝔸éé𝔸x語𝔸éxééé語x語x𝔸𝔸xxxx𝔸xxx𝔸𝔸𝔸𝔸𝔸é語é語é語𝔸𝔸xéé語𝔸𝔸xx𝔸語ééé語éx語語𝔸x𝔸xxx"/></resources></manifest>`,
      ],
    ],
    fix: "fix (3): a package's records are read from its manifest and its record files alone (recordDocumentTypes), and the Manifest overlay selections read the manifest's cp:* attributes alone, each by its node's and attribute's documentType (170356bd's reading)",
    owner: "GEN-A",
    signature: { kind: "oracle-only-law", law: "Key text bound" },
  },
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-template-declaration identifier="N" cardinality="0"/><qti-template-processing><qti-set-template-value identifier="N"><qti-random-integer/></qti-set-template-value></qti-template-processing></qti-assessment-item>`,
      ],
    ],
    fix: "B11: an absent or unspelled base type or cardinality is no row, never none or single",
    owner: "NIL",
    signature: { kind: "oracle-only-law", law: "Set type" },
  },
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
    signature: { kind: "oracle-only-law", law: "Template default type" },
  },
  {
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
    signature: { kind: "oracle-only-law", law: "Typed value" },
  },
  {
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
    signature: { kind: "oracle-only-law", law: "Variable declared" },
  },
  {
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
    signature: { kind: "oracle-only-law", law: "Variable mapping source" },
  },
];
