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
 * The host's judge is a fast pre-filter (`#pantry/test/gen/genetic/host-laws.ts`, the owner's Q4
 * ruling): a class it reports becomes an entry only once its package reproduces it on PostgreSQL.
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";

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
 * One known disagreement, or one a fix closed: its class, its owner, the fix, and its package's
 * files.
 */
export interface Known extends Owned {
  readonly files: readonly KnownFile[];
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
export const known: readonly Known[] = [];

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
    signature: { field: "itemDocument", kind: "dangling-uuid", relation: "NameLookup" },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "GeneralObject",
          selection: { conjuncts: [] },
          terms: [
            { field: "record", kind: "field" },
            { field: "document", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "LomObject",
          selection: { conjuncts: [] },
          terms: [
            { field: "record", kind: "field" },
            { field: "document", kind: "field" },
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
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="../choice.xml"><metadata><imsmd:lom/></metadata></resource></resources></manifest>`,
      ],
    ],
    fix: "NS6: a record names a document only where its resource's href names one (LomResource.named, by targetAt), so a record whose href names none writes no LomObject, LomObjectIdentifier, LomObjectTitle or GeneralObject, and Document entry alone refuses the href",
    owner: "FIX-GENOBJ",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomObject",
          selection: { conjuncts: [] },
          terms: [
            { field: "package", kind: "field" },
            { field: "path", kind: "field" },
            { field: "document", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "Document",
          selection: { conjuncts: [] },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomObjectIdentifier",
          selection: { conjuncts: [] },
          terms: [
            { field: "document", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ObjectIdentifier",
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomResource",
          selection: { conjuncts: [] },
          terms: [{ field: "node", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "Resource",
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "NameLookup",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "found", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: true },
              },
              {
                kind: "compare",
                left: { field: "kind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "qti-assessment-item-ref" },
              },
              {
                kind: "compare",
                left: { field: "resourceType", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "none" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "resourceType", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "ItemRefTarget",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "type", kind: "field" },
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
          selection: { conjuncts: [] },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomEntry",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "holderKind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "lom:general" },
              },
              {
                kind: "compare",
                left: { field: "named", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "none" },
              },
            ],
          },
          terms: [{ field: "holderParent", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "LomObjectIdentifier",
          selection: { conjuncts: [] },
          terms: [{ field: "record", kind: "field" }],
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
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="stimulus.xml"><metadata><imsmd:lom><imsmd:general><imsmd:identifier><imsmd:entry>choice</imsmd:entry></imsmd:identifier></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`,
      ],
    ],
    fix: "NS6: a record names a document only where its resource's href names one (LomResource.named, by targetAt), so a record whose href names none writes no LomObject, LomObjectIdentifier, LomObjectTitle or GeneralObject, and Document entry alone refuses the href",
    owner: "FIX-GENOBJ",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomObjectIdentifier",
          selection: { conjuncts: [] },
          terms: [
            { field: "entry", kind: "field" },
            { field: "general", kind: "field" },
            { field: "record", kind: "field" },
            { field: "identifier", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "LomEntry",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "holderKind", kind: "field" },
                op: "eq",
                right: { kind: "literal", type: undefined, value: "lom:general" },
              },
            ],
          },
          terms: [
            { field: "node", kind: "field" },
            { field: "holder", kind: "field" },
            { field: "holderParent", kind: "field" },
            { field: "token", kind: "field" },
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
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_test_xmlv3p0" href="example.xml"><metadata><imsmd:lom><imsmd:general><imsmd:title/></imsmd:general></imsmd:lom></metadata></resource></resources></manifest>`,
      ],
    ],
    fix: "NS6: a record names a document only where its resource's href names one (LomResource.named, by targetAt), so a record whose href names none writes no LomObject, LomObjectIdentifier, LomObjectTitle or GeneralObject, and Document entry alone refuses the href",
    owner: "FIX-GENOBJ",
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomObjectTitle",
          selection: { conjuncts: [] },
          terms: [
            { field: "string", kind: "field" },
            { field: "record", kind: "field" },
            { field: "title", kind: "field" },
          ],
        },
        kind: "contained",
        to: {
          relation: "LomTitleString",
          selection: { conjuncts: [] },
          terms: [
            { field: "node", kind: "field" },
            { field: "record", kind: "field" },
            { field: "textValue", kind: "field" },
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
    signature: {
      kind: "import-only-law",
      law: {
        from: {
          relation: "LomTitle",
          selection: {
            conjuncts: [
              {
                kind: "compare",
                left: { field: "named", kind: "field" },
                op: "ne",
                right: { kind: "literal", type: undefined, value: "none" },
              },
            ],
          },
          terms: [{ field: "record", kind: "field" }],
        },
        kind: "contained",
        to: {
          relation: "LomObjectTitle",
          selection: { conjuncts: [] },
          terms: [{ field: "record", kind: "field" }],
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
    fix: "spec reading 163: a section is invisible only where its own visible flag, a row of its own, reads false, so one that writes no visible is never loose and AL3 alone refuses it, never an unwritten visible read as false (the Section.visible the old class named)",
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
    fix: "spec reading 163: a section is invisible only where its own visible flag, a row of its own, reads false, so one that writes no visible is never loose and AL3 alone refuses it, never an unwritten visible read as false (the Section.visible the old class named)",
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
    signature: { kind: "oracle-only-law", law: "LomObjectIdentifier" },
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
];
