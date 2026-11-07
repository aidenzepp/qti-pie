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
 */
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";

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
 * One known disagreement, or one a fix closed: its owner, the fix, and its package's files.
 */
export interface Known extends Owned {
  readonly files: readonly KnownFile[];
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
  "import-only-law: Declaration overlay, contained Attribute(node, lexical) in Declaration(node, cardinalityLexical)":
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
      fix: "a declaration whose identifier names nothing (empty, whitespace alone, or no NCName: spec reading 152, lane NIL's B10) has no Declaration row, but Declaration overlay's forward copies of its cardinality and base type demand one of every declaration that writes them; the declaration's name wants a row of its own (as RecordFieldName), so the copies hold without a name and the value domain refuses it alone",
      owner: "unassigned, found by FIX-NCNAME",
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
    fix: "an ID-typed attribute whose value is no NCName, a response or context declaration's empty identifier or one with whitespace inside, still gets a DocumentId row, which E1_derived refuses beside its value domain: an ID that names nothing wants no DocumentId row (spec reading 152's reading, applied to the identity overlay)",
    owner: "unassigned, found by FIX-NCNAME",
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
    fix: 'a read attribute whose collapsed value holds whitespace inside (max-choices="1 2", a reference "a b") gets an InteractionAttribute row whose value E1_derived holds to no whitespace, beside its value domain: the copy and its atomic split cannot both hold, so such a value wants a representation of its own',
    owner: "unassigned, found by FIX-NCNAME",
  },
  "import-only-law: E1 derived, contained Declaration(document, identifier, node, declarationKind, baseType, cardinality) in VariableLookup(document, name, declaration, declarationKind, baseType, cardinality)":
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
      fix: "two declarations of one identifier: the oracle raises the VariableLookup containment that breaks beside Declaration key, so precedence sees it",
      owner: "OL",
    },
  "import-only-law: E1 derived, contained Expression(parent, baseType, cardinality) in VariableRef(node, heldBase, heldCardinality)":
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
      fix: "a setter or a lookup whose identifier names no variable (unwritten, or no NCName: spec reading 152) has no VariableRef row, but its one expression's type is copied into that row; the held type wants a row of its own, keyed by the setter, so an expression under a setter that names nothing is refused by AL3 or its value domain alone",
      owner: "unassigned, found by FIX-NCNAME",
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
    fix: "(6) the absence defaults: an absent required attribute writes no row, never an empty or default value",
    owner: "NIL",
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
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-declaration identifier="" cardinality="single" base-type="identifier"><qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping></qti-response-declaration></qti-assessment-item>`,
      ],
    ],
    fix: "a response declaration with no Declaration row (its identifier names nothing) writes no MapKey rows for its mapping's keys, which the mapping overlay's copy demands of every map key; the copy wants to hold over the declarations that have rows",
    owner: "unassigned, found by FIX-NCNAME",
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
    fix: "N8: the oracle states the choice law the schema does, every choice in a choice interaction, so a qti-gap outside every qti-gap-match-interaction breaks N8 beside N6 on both sides",
    owner: "OL",
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
    fix: "(6) the absence defaults: an absent required attribute writes no row, never an empty or default value",
    owner: "NIL",
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
    fix: "(6) the absence defaults: an absent required attribute writes no row, never an empty or default value",
    owner: "NIL",
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
  "dangling-uuid: MappingLookup.declaration": {
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
  "dangling-uuid: MappingSource.declaration": {
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
  "dangling-uuid: PlacedVariableRef.declaration": {
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
  "dangling-uuid: SectionTemplateRef.declaration": {
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
  "dangling-uuid: TemplateRef.declaration": {
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
    fix: "NS2: a content reference that names no declaration has no declaration row, its *RefDeclaration relation's, never the nil uuid, so its law refuses it by that row's absence",
    owner: "NIL",
  },
  "dangling-uuid: VariableRef.declaration": {
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
  "import-only-law: Binding cardinality, contained BindingDeclaration(node) in CountBound(node)": {
    files: [
      [
        "choice.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><qti-response-declaration identifier="RESPONSE"/><qti-item-body>
        
        
        <qti-choice-interaction response-identifier="RESPONSE" max-choices="1abc">
            
            
            
            
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
    fix: "B11: a declaration whose cardinality spells nothing has no row, so no binding of it writes a BindingDeclaration or a CountBound row",
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
  "import-only-law: Declaration base type, check Declaration_base_type on Declaration": {
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
  "import-only-law: Declaration overlay, contained Value(node, baseType) in RecordField(node, baseType)":
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
  "import-only-law: Document entry, contained Site(package, path) in TestDocument(package, path)": {
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
    fix: "25d16460 (SitePath) writes a site's href as a row of its own, gated on its entry, and removes the containment this class broke, so no package can show it",
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
  "import-only-law: E1 derived, check E1_derived on Declaration": {
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
  "import-only-law: E1 derived, contained Attribute(node, lexical) in AssessmentObject(node, identifierLexical)":
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
  "import-only-law: E1 derived, contained Attribute(node, lexical) in AssessmentObject(node, title)":
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
  "import-only-law: E1 derived, contained LomObjectIdentifier(document, identifier) in AssessmentObject(document, identifier)":
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
  "import-only-law: Key text bound, a text past LomString.language, LomStringLanguage.language, LomTitleString.language, LomTitleString.languageTag's bound":
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
  "import-only-law: Key text bound, a text past Node.stringPiece's bound": {
    files: [
      [
        "imsmanifest.xml",
        "xml",
        `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" xmlns:cpx="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2"><metadata><schemaversion>3.0.1</schemaversion><imsmd:lom><imsmd:metaMetadata><imsmd:language>Ké語é𝔸xéxééé語é語𝔸語𝔸語é𝔸ééx語語xx語𝔸x語éééxéé語éxx𝔸𝔸𝔸x語x語𝔸𝔸語語xé語語é𝔸語éxé語xxx語é語𝔸é𝔸語語𝔸語𝔸x語語x語𝔸éé𝔸é語xééxxé𝔸𝔸éé語é語語𝔸é𝔸xéx語é𝔸x語𝔸é語𝔸xé語語é語é語語𝔸éxxéx𝔸éé𝔸x𝔸é𝔸語𝔸x𝔸𝔸語語é語語語xéxéé𝔸𝔸語é語𝔸𝔸éé𝔸é語xxxé𝔸éx𝔸語語語𝔸xéx𝔸é語xé𝔸x語語é𝔸éxx𝔸𝔸語x語語𝔸語éx語語𝔸語xx語𝔸語語xéé𝔸éxxééxéééxé𝔸é𝔸x𝔸語𝔸語x語x𝔸xé語é𝔸é語xéx語x語xé𝔸é語é語x𝔸xéx語éx𝔸é語ééx語語𝔸éx語𝔸𝔸xé𝔸x語語éx𝔸x𝔸éxxé𝔸é語語x𝔸𝔸𝔸𝔸𝔸𝔸x𝔸éé語éééx𝔸語語x語語𝔸xxxé語語𝔸𝔸xx語𝔸語𝔸x語𝔸x𝔸語x𝔸éxx語𝔸𝔸𝔸語x語éé𝔸xé𝔸語x語語語𝔸𝔸é𝔸é𝔸語語ééé語x𝔸éé語éx𝔸éxéé語𝔸x𝔸𝔸x語éx語xé𝔸語語𝔸xéxxé語xéx語é語語xxé語x語éxé𝔸xx𝔸語𝔸𝔸𝔸語é𝔸𝔸𝔸x語𝔸𝔸𝔸𝔸𝔸x𝔸語𝔸éxéé語x語x𝔸é𝔸𝔸é語𝔸é語é語x𝔸xé語éé𝔸xéé語x語éx語語語語éé𝔸xé語語語𝔸𝔸𝔸éx𝔸é𝔸語xé語x𝔸𝔸x𝔸𝔸語xé𝔸𝔸𝔸𝔸𝔸xx𝔸𝔸𝔸𝔸x𝔸語x𝔸é𝔸語語𝔸𝔸é語𝔸語語語𝔸𝔸語éé語x𝔸éx𝔸x語éx語𝔸é𝔸𝔸𝔸é語語x語x語xééé𝔸語𝔸é𝔸x𝔸語ééxx𝔸é𝔸語𝔸𝔸𝔸語語𝔸語éxé語𝔸𝔸𝔸éé語x語語éé𝔸語𝔸語𝔸éé語𝔸語éxxx語語xx語é𝔸x語é語éxé語éxxééx語𝔸語𝔸語𝔸𝔸語𝔸𝔸é𝔸xéé語𝔸𝔸xé𝔸語éx語語𝔸語𝔸éx𝔸語xéxé𝔸x語𝔸x𝔸𝔸é𝔸ééx語語x𝔸ééééxé𝔸xxx語ééx語xx語𝔸𝔸x𝔸語𝔸語x語x語é語xéx語𝔸語語éxxé語xéx語語x𝔸x語𝔸ééé語é𝔸語語é𝔸𝔸é𝔸語語é𝔸𝔸xé𝔸xxéx𝔸語éx語𝔸𝔸語𝔸𝔸𝔸éé語x𝔸éxx語語x語𝔸x𝔸語x𝔸é語𝔸é𝔸𝔸𝔸é𝔸x語xxx𝔸語xé語xééééé語xx𝔸xé𝔸𝔸𝔸éxééééé𝔸xx語x語語語x𝔸語x𝔸x語語語𝔸éx𝔸𝔸語x語𝔸𝔸x𝔸語𝔸𝔸語é𝔸語x語語xé語語語éx𝔸é語é語xééxx𝔸𝔸éx語xxéééé𝔸x語xx語語𝔸é語xé𝔸é語語éx𝔸語x𝔸éé𝔸ééé語x語é𝔸語é𝔸xééé語xé𝔸𝔸語x語語ééé𝔸é語𝔸𝔸é𝔸é語éx𝔸x語éé𝔸𝔸語é語é語語語語é語é𝔸é𝔸éxé語𝔸語é語x</imsmd:language></imsmd:metaMetadata></imsmd:lom></metadata><resources><resource><cpx:variant/></resource></resources></manifest>`,
      ],
    ],
    fix: "the variant class: the 3.0.1 profile forbids cpx:variant (its maxOccurs is 0), and the oracle's fold now refuses the node, drops its subtree and folds the rest, so it judges every document's rows and precedence picks among every breach",
    owner: "VD",
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
  "import-only-law: Reserved type, check Reserved_type on Declaration": {
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
  "import-only-law: Test overlay, contained Site(node, package, path) in ReferencePath(node, package, path)":
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
      fix: "25d16460 (SitePath) writes a site's href as a row of its own, gated on its entry, and removes the containment this class broke, so no package can show it",
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
} satisfies Entries;
