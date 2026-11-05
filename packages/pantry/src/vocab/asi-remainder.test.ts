import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import type { AdmissionRow, RegistryRow } from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import {
  added301,
  admission,
  alsoUnder,
  attributeAdmission,
  attributeless300,
  attributes,
  attributeTypes300,
  catalogKinds,
  companionKinds,
  hosts,
  interactions,
  kinds,
  pciKinds,
  registry,
  stimulusKinds,
  testKinds,
} from "#pantry/vocab/asi-remainder.ts";
import { asiRemainderInventory } from "#pantry/vocab/inventory/asi-remainder.ts";

/**
 * The eleven composed vocabularies, in composition order.
 */
const eleven = [generic, asi, html, cp, lom, qmd, cpx, drd, csmd, ud, xi] as const;

/**
 * The ASI namespace.
 */
const asiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Every registry row of the eleven, by handle.
 */
const elevenRows: ReadonlyMap<string, RegistryRow> = new Map(
  eleven.flatMap((vocabulary) => Object.entries<RegistryRow>(vocabulary.registry)),
);

/**
 * The ASI-namespace elements the eleven hold a kind for.
 */
const elevenElements: ReadonlySet<string> = new Set(
  [...elevenRows.values()]
    .filter((row) => row.namespace === asiNamespace && row.local !== "")
    .map((row) => row.local),
);

/**
 * The generic kinds: character data, comments and instructions.
 */
const genericKinds: ReadonlySet<string> = new Set(generic.kinds);

/**
 * The registry row of a remainder kind.
 *
 * @param handle - The kind.
 * @returns Its row; the test fails when the registry has none.
 */
const rowOf = (handle: string): RegistryRow =>
  Option.getOrElse(Option.fromNullishOr(registry[handle]), () =>
    assert.fail(`the registry has no row for ${handle}`),
  );

/**
 * The children one host admits under one version, in row order.
 *
 * @param rows - Admission rows.
 * @param version - The version.
 * @param parent - The host.
 * @returns The children's handles.
 */
const childrenOf = (
  rows: readonly AdmissionRow[],
  version: AdmissionRow["version"],
  parent: string,
): readonly string[] =>
  rows.filter((row) => row.version === version && row.parent === parent).map((row) => row.child);

/**
 * The elements a list of remainder kinds adds to the eleven's.
 *
 * @param group - The kinds.
 * @returns Their elements that no kind of the eleven is, each once.
 */
const newElements = (group: readonly string[]): readonly string[] => [
  ...new Set(
    group.map((handle) => rowOf(handle).local).filter((local) => !elevenElements.has(local)),
  ),
];

/**
 * The element a kind is, by its registry row or the eleven's.
 *
 * @param handle - A kind handle.
 * @returns The row's local name, or the handle for a kind outside both, as a MathML or SSML kind.
 */
const localOf = (handle: string): string =>
  (registry[handle] ?? elevenRows.get(handle))?.local ?? handle;

/**
 * The parent and child pairs one version admits.
 *
 * @param version - The version.
 * @returns Each row's pair, as `parent|child`.
 */
const pairsIn = (version: AdmissionRow["version"]): ReadonlySet<string> =>
  new Set(
    admission.filter((row) => row.version === version).map((row) => `${row.parent}|${row.child}`),
  );

/**
 * The attribute names a kind may carry under one version.
 *
 * @param version - The version.
 * @param kind - The kind.
 * @returns The names, in row order.
 */
const attributeNamesIn = (version: AdmissionRow["version"], kind: string): readonly string[] =>
  attributeAdmission
    .filter((row) => row.version === version && row.kind === kind)
    .map((row) => row.attribute);

describe("vocab/asi-remainder.ts", () => {
  it("holds 61 kinds of 51 new elements: 20 of tests, 17 companion, 6 PCI, 4 catalog, 3 stimulus, 1 custom", () => {
    assert.strictEqual(kinds.length, 61);
    assert.strictEqual(new Set(kinds).size, 61);
    assert.deepStrictEqual(
      [
        testKinds,
        companionKinds,
        pciKinds,
        catalogKinds,
        stimulusKinds,
        ["qti-custom-interaction"],
      ].map((group) => newElements(group).length),
      [20, 17, 6, 4, 3, 1],
    );
    assert.strictEqual(newElements(kinds).length, 51);
    assert.deepStrictEqual(
      kinds.filter((handle) => elevenElements.has(rowOf(handle).local)),
      ["qti-content-body.testFeedback", "qti-content-body.testRubric", "qti-rubric-block.test"],
    );

    for (const handle of kinds) {
      assert.isFalse(elevenRows.has(handle), `${handle} is a kind of the eleven`);
    }
  });

  it("has one inventory entry per kind, and a registry row in the ASI namespace from it", () => {
    assert.deepStrictEqual(Object.keys(asiRemainderInventory).toSorted(), [...kinds].toSorted());
    assert.deepStrictEqual(Object.keys(registry).toSorted(), [...kinds].toSorted());

    for (const handle of kinds) {
      const entry = asiRemainderInventory[handle];
      const row = rowOf(handle);

      assert.strictEqual(entry?.handle, handle);
      assert.strictEqual(row.local, entry?.element);
      assert.strictEqual(row.namespace, asiNamespace);
      assert.deepStrictEqual(row.attributes, [
        ...new Set((entry?.attributes ?? []).map((attribute) => attribute.name)),
      ]);
      assert.strictEqual(
        handle.includes("."),
        Object.hasOwn(hosts, handle),
        `${handle} is dotted exactly when it has hosts`,
      );
    }
  });

  it("names a dotted kind's first host as its parent and the rest in alsoUnder", () => {
    for (const handle of kinds) {
      const listed = Object.entries(hosts).find(([dotted]) => dotted === handle)?.[1] ?? [];

      assert.deepStrictEqual(rowOf(handle).parent, Option.fromNullishOr(listed[0]), handle);
      assert.deepStrictEqual(alsoUnder.get(handle) ?? [], listed.slice(1), handle);
    }

    assert.deepStrictEqual(
      rowOf("qti-rubric-block.test").parent,
      Option.some("qti-assessment-section"),
    );
    assert.deepStrictEqual(alsoUnder.get("qti-rubric-block.test"), [
      "qti-assessment-test",
      "qti-test-part",
    ]);
    assert.deepStrictEqual(rowOf("qti-file-href").parent, Option.none());
  });

  it("introduces the 30 attribute names the eleven lack, in first-appearance order by handle", () => {
    const held: ReadonlySet<string> = new Set(
      eleven.flatMap((vocabulary): readonly string[] => vocabulary.attributes),
    );
    const fresh = [
      ...new Set(
        [...kinds]
          .toSorted()
          .flatMap((handle) => rowOf(handle).attributes)
          .filter((name) => !held.has(name)),
      ),
    ];

    assert.deepStrictEqual([...attributes], fresh);
    assert.strictEqual(attributes.length, 30);
  });

  it("adds the custom and portable custom interactions to the Interaction set", () => {
    assert.deepStrictEqual(interactions, [
      "qti-custom-interaction",
      "qti-portable-custom-interaction",
    ]);
  });

  it("admits the 74 child kinds the XSD lists under qti-interaction-markup, in both versions", () => {
    for (const version of ["3.0.0", "3.0.1"] as const) {
      const elements = childrenOf(admission, version, "qti-interaction-markup").filter(
        (child) => !genericKinds.has(child),
      );

      assert.strictEqual(elements.length, 74, version);
      assert.deepStrictEqual(
        elements.filter((child) => child.includes(":")),
        [
          "m:math",
          "xi:include",
          ...["p", "s", "say-as", "phoneme", "sub", "voice", "emphasis", "break", "prosody"].map(
            (local) => `ssml:${local}`,
          ),
          "ssml:mark",
          "ssml:audio",
          "ssml:speak",
        ],
      );
      assert.includeMembers(
        [...elements],
        ["qti-printed-variable", "qti-template-block", "template", "div"],
      );
      assert.deepStrictEqual(
        childrenOf(admission, version, "qti-interaction-markup").filter((child) =>
          genericKinds.has(child),
        ),
        ["ws", "comment", "pi"],
      );
    }
  });

  it("admits every row once, and only kinds of a vocabulary as parents and children", () => {
    const triples = admission.map((row) => `${row.version}|${row.parent}|${row.child}`);
    const known = new Set<string>([...elevenRows.keys(), ...kinds]);

    assert.strictEqual(new Set(triples).size, triples.length);

    for (const row of admission) {
      assert.isTrue(known.has(row.parent), `${row.parent} is a kind`);
      assert.isTrue(
        known.has(row.child) || row.child.startsWith("m:") || row.child.startsWith("ssml:"),
        `${row.child} under ${row.parent} is a kind, a MathML kind or an SSML kind`,
      );
    }
  });

  it("resolves an element under each parent to one kind", () => {
    for (const version of ["3.0.0", "3.0.1"] as const) {
      const seen = new Map<string, string>();

      for (const row of admission.filter(
        (admitted) => admitted.version === version && !genericKinds.has(admitted.child),
      )) {
        const key = `${row.parent}|${localOf(row.child)}`;
        const earlier = seen.get(key);

        assert.isTrue(
          earlier === undefined || earlier === row.child,
          `${key}: ${earlier} and ${row.child}`,
        );
        seen.set(key, row.child);
      }
    }

    assert.deepStrictEqual(
      childrenOf(admission, "3.0.1", "qti-test-part").filter((child) =>
        child.startsWith("qti-rubric"),
      ),
      ["qti-rubric-block.test"],
    );
    assert.includeMembers(
      [...childrenOf(admission, "3.0.1", "qti-increment-us")],
      ["qti-minor-increment.radialUS", "qti-major-increment.radialUS"],
    );
    assert.includeMembers([...childrenOf(admission, "3.0.1", "qti-card")], ["qti-file-href.card"]);
    assert.includeMembers(
      [...childrenOf(admission, "3.0.1", "qti-calculator-info")],
      ["qti-file-href"],
    );
  });

  it("adds the character data each content class admits", () => {
    const character = (parent: string): readonly string[] =>
      childrenOf(admission, "3.0.1", parent).filter((child) => genericKinds.has(child));

    assert.deepStrictEqual(character("qti-assessment-test"), ["ws", "comment", "pi"]);
    assert.deepStrictEqual(character("qti-selection"), ["ws", "comment", "pi"]);
    assert.deepStrictEqual(character("qti-custom-interaction"), ["ws", "comment", "pi"]);
    assert.deepStrictEqual(character("qti-weight"), ["comment", "pi"]);
    assert.deepStrictEqual(character("qti-minimum-length"), [
      "text",
      "ws",
      "entityRef",
      "comment",
      "pi",
    ]);
    assert.deepStrictEqual(character("qti-file-href.card"), [
      "text",
      "ws",
      "entityRef",
      "comment",
      "pi",
    ]);
    assert.deepStrictEqual(character("qti-html-content"), [
      "text",
      "ws",
      "entityRef",
      "comment",
      "pi",
    ]);
    assert.deepStrictEqual(childrenOf(admission, "3.0.1", "qti-minimum-length"), [
      "text",
      "ws",
      "entityRef",
      "comment",
      "pi",
    ]);
  });

  it("admits the remainder kinds under the existing hosts whose content names them: 69 rows a version", () => {
    const remainder: ReadonlySet<string> = new Set(kinds);

    for (const version of ["3.0.0", "3.0.1"] as const) {
      const rows = admission.filter((row) => row.version === version && !remainder.has(row.parent));

      assert.strictEqual(rows.length, 69, version);

      for (const row of rows) {
        assert.isTrue(Object.hasOwn(inventory, row.parent), `${row.parent} is an inventory host`);
        assert.isTrue(remainder.has(row.child), `${row.child} is a remainder kind`);
      }
    }

    assert.includeMembers(
      [...childrenOf(admission, "3.0.0", "qti-companion-materials-info")],
      [
        "qti-calculator",
        "qti-rule",
        "qti-protractor",
        "qti-digital-material",
        "qti-physical-material",
      ],
    );
    assert.deepStrictEqual(childrenOf(admission, "3.0.0", "qti-catalog-info"), ["qti-catalog"]);
    assert.deepStrictEqual(childrenOf(admission, "3.0.1", "qti-assessment-item"), [
      "qti-assessment-stimulus-ref",
    ]);
    assert.includeMembers([...childrenOf(admission, "3.0.1", "div")], [...interactions]);
  });

  it("holds the rows 3.0.1 adds in 3.0.1 only", () => {
    const later = pairsIn("3.0.1");
    const earlier = pairsIn("3.0.0");
    const added = Object.entries(added301).flatMap(([host, children]) =>
      children.map((child) => `${host}|${child}`),
    );

    assert.deepStrictEqual(
      [...later].filter((pair) => !earlier.has(pair)).toSorted(),
      added.toSorted(),
    );
    assert.deepStrictEqual(
      [...earlier].filter((pair) => !later.has(pair)),
      [],
    );
  });

  it("states each kind's attributes by version, with 3.0.0's types", () => {
    for (const kind of kinds) {
      assert.deepStrictEqual(attributeNamesIn("3.0.1", kind), rowOf(kind).attributes, kind);
      assert.deepStrictEqual(
        attributeNamesIn("3.0.0", kind),
        attributeless300.some((bare) => bare === kind) ? [] : rowOf(kind).attributes,
        kind,
      );
    }

    assert.strictEqual(rowOf("qti-stimulus-body").attributes.length, 55);
    assert.deepStrictEqual(
      attributeAdmission
        .filter((row) => row.kind === "qti-context-variable" && row.attribute === "identifier")
        .map((row) => [row.version, row.type]),
      [
        ["3.0.0", attributeTypes300["qti-context-variable"].identifier],
        ["3.0.1", "IdentifierDType"],
      ],
    );
  });
});
