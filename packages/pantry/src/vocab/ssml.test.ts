import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import { kindTuples, attributeTuples, vocabularies } from "#pantry/schema/node.ts";
import {
  admission,
  attributes,
  hosted,
  kinds,
  registry,
  ssmlHostRows,
  wildcards,
} from "#pantry/vocab/ssml.ts";
import type { SsmlKind } from "#pantry/vocab/ssml.ts";
import { ssmlInventory } from "#pantry/vocab/inventory/ssml.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import type { InventoryEntry, InventoryLeaf } from "#pantry/schema/content/xsd-inventory.ts";
import { admission as remainderAdmission } from "#pantry/vocab/asi-remainder.ts";
import { asiRemainderInventory } from "#pantry/vocab/inventory/asi-remainder.ts";
import { openNameOf } from "#pantry/vocab/open.ts";
import type { OpenNameRefusal, Wildcard } from "#pantry/vocab/open.ts";

/**
 * The SSML namespace, written out here so the test does not read it from the file it checks.
 */
const synthesis = "http://www.w3.org/2001/10/synthesis";

/**
 * The QTI schema versions every SSML row holds in.
 */
const versions = ["3.0.0", "3.0.1"] as const;

/**
 * Every admission row as `version|parent|child`.
 */
const admitted: ReadonlySet<string> = new Set(
  admission.map(({ child, parent, version }) => `${version}|${parent}|${child}`),
);

/**
 * The children a parent admits under a version, in row order.
 *
 * @param version - The schema version.
 * @param parent - The parent kind.
 * @returns Its admitted child kinds.
 */
const childrenOf = (version: string, parent: string): readonly string[] =>
  admission
    .filter((row) => row.version === version && row.parent === parent)
    .map((row) => row.child);

/**
 * Resolve an element to its SSML kind the way kind resolution reads it: by namespace and local
 * name among the kinds its parent admits.
 *
 * @param version - The schema version.
 * @param namespace - The element's namespace.
 * @param local - The element's local name.
 * @param parent - The parent's kind.
 * @returns The kinds that match, which is one for a resolved element and none for a refused one.
 */
const resolveKind = (
  version: string,
  namespace: string,
  local: string,
  parent: string,
): readonly SsmlKind[] =>
  kinds.filter(
    (kind) =>
      registry[kind].namespace === namespace &&
      registry[kind].local === local &&
      admitted.has(`${version}|${parent}|${kind}`),
  );

/**
 * The leaf entry of an SSML kind.
 *
 * @param kind - The kind.
 * @returns Its entry, failing the test when the leaf has none.
 */
const entryOf = (kind: SsmlKind): InventoryEntry =>
  Option.getOrElse(Option.fromNullishOr(ssmlInventory[kind]), () =>
    assert.fail(`the leaf has no entry for ${kind}`),
  );

/**
 * The hosts of the ASI remainder: catalog cards' HTML content, PCI's markup and the test
 * vocabulary's two content bodies.
 */
const remainderHosts = [
  "qti-content-body.testFeedback",
  "qti-content-body.testRubric",
  "qti-html-content",
  "qti-interaction-markup",
];

/**
 * The host kinds of a leaf's SSML rows, in row order, each once.
 *
 * @param leaf - The inventory the rows are read from.
 * @returns The parents of {@link ssmlHostRows}.
 */
const hostsIn = (leaf: InventoryLeaf): readonly string[] => [
  ...new Set(ssmlHostRows(leaf).map((row) => row.parent)),
];

/**
 * Every host kind of the SSML rows: today's composition's, then the remainder's.
 */
const hosts = [...hostsIn(inventory), ...hostsIn(asiRemainderInventory)];

/**
 * Look up the attribute wildcard {@link wildcards} states for an SSML element.
 *
 * @param element - The element's namespace and local name.
 * @returns The wildcard of the one statement that names it, or `None`.
 */
const wildcardIn = (element: {
  readonly local: string;
  readonly namespace: string;
}): Option.Option<Wildcard> =>
  Option.map(
    Option.fromNullishOr(
      wildcards.find(
        (statement) =>
          statement.namespace === element.namespace &&
          statement.elements.some((local) => local === element.local),
      ),
    ),
    (statement) => statement.wildcard,
  );

/**
 * The reason {@link openNameOf} gives for refusing an attribute.
 *
 * @param result - Its result.
 * @returns The refusal's reason, failing the test when the attribute was read as an open name.
 */
const reasonOf = (result: ReturnType<typeof openNameOf>): OpenNameRefusal =>
  Result.match(result, {
    onFailure: (refused) => refused.reason,
    onSuccess: (name) => assert.fail(`read as the open name ${JSON.stringify(name)}`),
  });

/**
 * A path from a catalog card's HTML content down to `ssml:sub`, as (parent, child) steps.
 */
const nested: readonly (readonly [string, SsmlKind])[] = [
  ["qti-html-content", "ssml:speak"],
  ["ssml:speak", "ssml:p"],
  ["ssml:p", "ssml:s"],
  ["ssml:s", "ssml:sub"],
];

describe("vocab/ssml.ts", () => {
  it("has 20 kinds, 32 new attribute names, and 12 kinds hosted under 69 kinds of 62 elements", () => {
    const elements = new Set(
      [inventory, asiRemainderInventory].flatMap((leaf) =>
        hostsIn(leaf).map((host) => leaf[host]?.element),
      ),
    );

    assert.deepStrictEqual(
      [kinds.length, attributes.length, hosted.length, hosts.length, elements.size],
      [20, 32, 12, 69, 62],
    );
    assert.strictEqual(admission.length, versions.length * (240 + 12 * 69));
    assert.strictEqual(admitted.size, admission.length, "no admission row is repeated");
  });

  it("lists the leaf's kinds, in its order, each as the prefixed element name", () => {
    assert.deepStrictEqual(Object.keys(ssmlInventory), [...kinds]);
    for (const kind of kinds) {
      assert.strictEqual(kind, `ssml:${entryOf(kind).element}`);
    }
  });

  it("registers each kind in the SSML namespace with every attribute its leaf entry declares", () => {
    for (const kind of kinds) {
      const entry = entryOf(kind);

      assert.deepStrictEqual(
        registry[kind],
        {
          attributes: [...new Set(entry.attributes.map((attribute) => attribute.name))],
          local: entry.element,
          namespace: synthesis,
          parent: Option.none(),
        },
        kind,
      );
    }
  });

  it("introduces exactly the names today's vocabularies lack, in first-appearance order", () => {
    const held = new Set<string>(attributeTuples.flat());
    const fresh = [
      ...new Set(
        kinds.flatMap((kind) => registry[kind].attributes).filter((name) => !held.has(name)),
      ),
    ];

    assert.deepStrictEqual([...attributes], fresh);
    assert.deepStrictEqual(
      [...new Set(kinds.flatMap((kind) => registry[kind].attributes))].filter((name) =>
        held.has(name),
      ),
      ["src", "xml:lang", "type", "name", "format", "version", "xml:base", "role", "required"],
    );
  });

  it("collides with no handle and no namespace and local name of today's roster", () => {
    const today = new Set<string>(kindTuples.flat());
    const names = new Set(
      vocabularies.flatMap((vocabulary) =>
        Object.values(vocabulary.registry).map(({ local, namespace }) => `${namespace}|${local}`),
      ),
    );

    assert.deepStrictEqual(
      kinds.filter((kind) => today.has(kind)),
      [],
    );
    assert.deepStrictEqual(
      kinds.filter((kind) => names.has(`${synthesis}|${registry[kind].local}`)),
      [],
    );
    for (const local of ["p", "sub", "audio"]) {
      assert.isTrue(today.has(local), `HTML has a ${local} kind of its own`);
    }
  });

  it("admits each leaf child under its SSML parent, but voice under token and w", () => {
    for (const version of versions) {
      for (const kind of kinds) {
        const entry = entryOf(kind);
        const expected = [...new Set(entry.children.map((child) => `ssml:${child.name}`))].filter(
          (child) => !((kind === "ssml:token" || kind === "ssml:w") && child === "ssml:voice"),
        );
        const content = entry.mixed
          ? ["text", "ws", "entityRef", "comment", "pi"]
          : ["ws", "comment", "pi"];

        assert.deepStrictEqual(childrenOf(version, kind), [...expected, ...content], kind);
      }

      assert.notInclude(childrenOf(version, "ssml:token"), "ssml:voice");
      assert.notInclude(childrenOf(version, "ssml:w"), "ssml:voice");
      assert.include(childrenOf(version, "ssml:token"), "ssml:prosody");
    }
  });

  it("admits the 12 hosted kinds, and only those, under every host in both versions", () => {
    for (const version of versions) {
      for (const host of hosts) {
        assert.deepStrictEqual(childrenOf(version, host).toSorted(), [...hosted].toSorted(), host);
      }
    }
  });

  it("finds 65 hosts in today's composition and the remainder's four, which it admits SSML under too", () => {
    const remainderRows = new Set(
      remainderAdmission.map(({ child, parent, version }) => `${version}|${parent}|${child}`),
    );

    assert.strictEqual(hostsIn(inventory).length, 65);
    assert.deepStrictEqual(hostsIn(asiRemainderInventory).toSorted(), remainderHosts);
    for (const version of versions) {
      for (const host of remainderHosts) {
        assert.deepStrictEqual(
          hosted.filter((child) => !remainderRows.has(`${version}|${host}|${child}`)),
          [],
          host,
        );
      }
    }
  });

  it("resolves ssml:sub in a catalog card's HTML content, directly and inside speak, p and s", () => {
    for (const version of versions) {
      assert.deepStrictEqual(resolveKind(version, synthesis, "sub", "qti-html-content"), [
        "ssml:sub",
      ]);

      for (const [parent, child] of nested) {
        assert.deepStrictEqual(
          resolveKind(version, synthesis, registry[child].local, parent),
          [child],
          `${child} under ${parent}`,
        );
      }

      assert.deepStrictEqual(resolveKind(version, synthesis, "lookup", "qti-html-content"), []);
      assert.deepStrictEqual(
        resolveKind(version, "http://www.imsglobal.org/xsd/imsqtiasi_v3p0", "sub", "p"),
        [],
      );
    }
  });

  it("states one attribute wildcard for every SSML element, as open.ts reads them", () => {
    const stated = wildcards.flatMap((statement) => statement.elements);

    assert.deepStrictEqual(stated.toSorted(), kinds.map((kind) => registry[kind].local).toSorted());
    for (const statement of wildcards) {
      assert.strictEqual(statement.namespace, synthesis);
      assert.deepStrictEqual(statement.versions, versions);
      assert.deepStrictEqual<readonly string[]>(statement.elements, statement.elements.toSorted());
    }
  });

  it("reads a foreign attribute on an SSML element as an open name through openNameOf", () => {
    const sub = { local: "sub", namespace: synthesis };
    const metadata = { local: "metadata", namespace: synthesis };
    const foreign = { local: "voice", namespace: "urn:example", prefix: "x", qname: "x:voice" };
    const unprefixed = { local: "data-voice", namespace: "", prefix: "", qname: "data-voice" };

    assert.deepStrictEqual(
      openNameOf(sub, wildcardIn(sub), foreign),
      Result.succeed({
        _tag: "foreign",
        local: "voice",
        prefix: "x",
        uri: "urn:example",
      }),
    );
    assert.deepStrictEqual(
      reasonOf(openNameOf(sub, wildcardIn(sub), unprefixed)),
      "outside-namespaces",
    );
    assert.deepStrictEqual(reasonOf(openNameOf(metadata, wildcardIn(metadata), foreign)), "strict");
  });
});
