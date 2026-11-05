import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Equal, FileSystem, Option } from "effect";
import { alsoUnder, generate, interactions, openClasses } from "#pantry/grammar/kinds.ts";
import type { KindOf, NameOf, Vocabulary } from "#pantry/grammar/kinds.ts";
import { kindOf } from "#pantry/import/tree.ts";
import type { FixedKind } from "#pantry/model/xdm.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";
import { AttributeName, NodeKind, vocabularies } from "#pantry/schema/node.ts";
import type { NodeKindHandle } from "#pantry/schema/node.ts";
import { interactionKinds, KindEnters } from "#pantry/schema/seed/ancestry.ts";
import { fixtureNames, materialize, materializePackage } from "#pantry/test/fixtures.ts";
import type { NamedPackage } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The relations today's eleven vocabularies generate, in `node.ts`'s composition order.
 */
const today = Effect.fromResult(generate({ alsoUnder, interactions, vocabularies }));

/**
 * A `NodeKind` handle of today's composition.
 */
type Kind = KindOf<typeof vocabularies>;

/**
 * The kinds the XDM fixes whatever the vocabulary: the document node and the six kinds of character
 * data. None is an element.
 */
const fixedKinds = [
  "document",
  "doctype",
  "text",
  "ws",
  "comment",
  "pi",
  "entityRef",
] as const satisfies readonly FixedKind[];

/**
 * The IMS QTI 3.0 ASI namespace, which the QTI and HTML kinds are written in.
 */
const asiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The IEEE LOM namespace.
 */
const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

/**
 * The IMS Content Packaging namespace of QTI 3.0 manifests.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * Whether a handle type kept its literals: `true` for a union of string literals, `false` once it
 * widened to `string`.
 */
type Literal<Handle extends string> = string extends Handle ? false : true;

/**
 * Construct a bare element of a name, for `kindOf`, which reads only the element's namespace and
 * local name.
 *
 * @param namespace - The element's namespace name.
 * @param local - The element's local name.
 * @returns An element with that name and no attributes or children.
 */
const element = (namespace: string, local: string): Element => ({
  attributes: [],
  children: [],
  kind: "element",
  local,
  namespace,
  prefix: "",
  qname: local,
});

/**
 * Construct a registry row of an element, plain when `parent` is none and dotted when it names the
 * parent kind.
 *
 * @param local - The element's local name.
 * @param parent - The parent kind of a dotted handle.
 * @returns The row, in a toy namespace.
 */
const rowOf = (local: string, parent: Option.Option<string>): RegistryRow => ({
  attributes: [],
  local,
  namespace: "urn:toy",
  parent,
});

/**
 * A toy vocabulary of two elements, `a` and `b`, introducing the attribute `id`.
 */
const toyA = {
  attributes: ["id"],
  kinds: ["a", "b"],
  registry: { a: rowOf("a", Option.none()), b: rowOf("b", Option.none()) },
} as const satisfies Vocabulary;

/**
 * A toy vocabulary of one element, `c`, introducing `class` and sharing `id` with {@link toyA}.
 */
const toyB = {
  attributes: ["id", "class"],
  kinds: ["c"],
  registry: { c: rowOf("c", Option.none()) },
} as const satisfies Vocabulary;

/**
 * Generate a toy vocabulary list's relations, with no further parents and no interactions.
 *
 * @param list - The vocabularies, in composition order.
 * @returns The relations, or the reason one has no constant.
 */
const toy = <const V extends readonly Vocabulary[]>(list: V) =>
  Effect.fromResult(generate({ alsoUnder: new Map(), interactions: [], vocabularies: list }));

/**
 * The packages beside `fixtureNames` that the fixtures module materializes by name.
 */
const namedPackages = [
  "metaData",
  "lti",
  "CAT_Test01_Adaptive_EchoAdapt",
  "sample_pci",
  "usageData",
] as const satisfies readonly NamedPackage[];

/**
 * The elements a walk compared, and those whose kinds disagreed.
 */
interface Compared {
  readonly disagreements: readonly string[];
  readonly elements: number;
}

describe("the rosters", () => {
  it.effect("NodeKind is document and doctype, then today's 363 kinds: 365 handles, 54 bytes", () =>
    Effect.gen(function* nodeKindRoster() {
      const { nodeKind } = yield* today;

      assert.deepStrictEqual(nodeKind.key[0].values, ["document", "doctype", ...NodeKind.handles]);
      assert.strictEqual(nodeKind.rows.length, 365);
      assert.strictEqual(nodeKind.cells, 365);
      assert.strictEqual(nodeKind.width, 1);
      assert.strictEqual(nodeKind.bytes, 54);
    }),
  );

  it.effect(
    "AttributeName is the open classes and xsi:schemaLocation, then today's 221 names: 225 handles",
    () =>
      Effect.gen(function* attributeNameRoster() {
        const { attributeName } = yield* today;

        assert.deepStrictEqual(attributeName.key[0].values, [
          "data-*",
          "foreign",
          "lax",
          "xsi:schemaLocation",
          ...AttributeName.handles,
        ]);
        assert.strictEqual(attributeName.cells, 225);
        assert.strictEqual(attributeName.bytes, 37);
      }),
  );

  it.effect("the handle types are the rosters' literal unions", () =>
    Effect.gen(function* literalHandles() {
      const { nodeKind, resolve } = yield* today;
      const kindsAreLiteral: Literal<Kind> = true;
      const namesAreLiteral: Literal<NameOf<typeof vocabularies>> = true;
      const root: Option.Option<Kind> = resolve(asiNamespace, "qti-assessment-item", "document");

      assert.isTrue(kindsAreLiteral && namesAreLiteral);
      assert.deepStrictEqual(root, Option.some("qti-assessment-item"));
      assert.include(nodeKind.key[0].values, "qti-choice-interaction");
    }),
  );

  it.effect("a name two vocabularies introduce is one handle, at its first", () =>
    Effect.gen(function* sharedName() {
      const { attributeName, nodeKind } = yield* toy([toyA, toyB]);

      assert.deepStrictEqual(attributeName.key[0].values, [
        ...openClasses,
        "xsi:schemaLocation",
        "id",
        "class",
      ]);
      assert.deepStrictEqual(nodeKind.key[0].values, ["document", "doctype", "a", "b", "c"]);
    }),
  );

  it.effect("a vocabulary appended to the list leaves every earlier code where it was", () =>
    Effect.gen(function* appendOnly() {
      const shorter = yield* toy([toyA]);
      const longer = yield* toy([toyA, toyB]);

      assert.deepStrictEqual(longer.nodeKind.key[0].values.slice(0, shorter.nodeKind.cells), [
        ...shorter.nodeKind.key[0].values,
      ]);
      assert.deepStrictEqual(
        longer.attributeName.key[0].values.slice(0, shorter.attributeName.cells),
        [...shorter.attributeName.key[0].values],
      );
    }),
  );
});

describe("the kind sets", () => {
  it.effect("IsElement holds every kind but the seven the XDM fixes: 358 of 365 bits", () =>
    Effect.gen(function* elements() {
      const { isElement, nodeKind } = yield* today;
      const fixed: ReadonlySet<string> = new Set(fixedKinds);

      assert.deepStrictEqual(
        isElement.rows.map((row) => row.kind),
        nodeKind.key[0].values.filter((kind) => !fixed.has(kind)),
      );
      assert.strictEqual(isElement.rows.length, 358);
      assert.strictEqual(isElement.cells, 365);
    }),
  );

  it.effect("Interaction holds the 20 kinds that enter int today", () =>
    Effect.gen(function* interactionSet() {
      const { interaction } = yield* today;
      const enteringInt = Object.entries(KindEnters)
        .filter(([, flags]) => flags.includes("int"))
        .map(([kind]) => kind);

      assert.sameMembers(
        interaction.rows.map((row) => row.kind),
        enteringInt,
      );
      assert.sameMembers([...interactions], [...interactionKinds]);
      assert.strictEqual(interaction.rows.length, 20);
      assert.isTrue(Option.isSome(interaction.lookup({ kind: "qti-slider-interaction" })));
      assert.isTrue(Option.isNone(interaction.lookup({ kind: "qti-prompt" })));
    }),
  );

  it.effect("refuses an interaction listed twice, or one outside NodeKind", () =>
    Effect.gen(function* strayInteraction() {
      const widened: readonly Vocabulary[] = [toyA];
      const twice = yield* Effect.flip(
        Effect.fromResult(
          generate({ alsoUnder: new Map(), interactions: ["a", "a"], vocabularies: [toyA] }),
        ),
      );
      const outside = yield* Effect.flip(
        Effect.fromResult(
          generate({
            alsoUnder: new Map(),
            interactions: ["qti-choice-interaction"],
            vocabularies: widened,
          }),
        ),
      );

      assert.include(twice.message, "Interaction states two rows at (kind a)");
      assert.include(outside.message, "Interaction has a row whose kind is qti-choice-interaction");
    }),
  );
});

describe("element names", () => {
  it.effect("every element kind is written with its registry row's name", () =>
    Effect.gen(function* names() {
      const { elementName, isElement } = yield* today;
      const registry = new Map(
        vocabularies.flatMap((vocabulary) => Object.entries<RegistryRow>(vocabulary.registry)),
      );

      assert.deepStrictEqual(
        isElement.rows.map(({ kind }) =>
          elementName
            .lookup({ kind })
            .pipe(Option.map(({ local, namespace }) => ({ local, namespace }))),
        ),
        isElement.rows.map(({ kind }) =>
          Option.fromNullishOr(registry.get(kind)).pipe(
            Option.map(({ local, namespace }) => ({ local, namespace })),
          ),
        ),
      );
      assert.isTrue(Option.isNone(elementName.lookup({ kind: "document" })));
      assert.isTrue(Option.isNone(elementName.lookup({ kind: "text" })));
    }),
  );

  it.effect(
    "a dotted kind is its name's kind under each parent it names, a plain one elsewhere",
    () =>
      Effect.gen(function* dotted() {
        const { resolve } = yield* today;
        const cases = [
          [asiNamespace, "qti-content-body", "qti-feedback-block", "qti-content-body.feedback"],
          [asiNamespace, "qti-content-body", "qti-modal-feedback", "qti-content-body.modal"],
          [asiNamespace, "qti-content-body", "qti-template-block", "qti-content-body.template"],
          [
            asiNamespace,
            "qti-feedback-block",
            "qti-content-body.template",
            "qti-feedback-block.template",
          ],
          [asiNamespace, "qti-feedback-block", "qti-item-body", "qti-feedback-block"],
          [cpNamespace, "metadata", "cp:resource", "cp:metadata.resource"],
          [lomNamespace, "duration", "lom:duration", "lom:duration.string"],
          [lomNamespace, "duration", "lom:typicalLearningTime", "lom:duration.string"],
          [lomNamespace, "duration", "lom:educational", "lom:duration"],
        ] as const satisfies readonly (readonly [string, string, Kind, Kind])[];

        assert.deepStrictEqual(
          cases.map(([namespace, local, parent]) => resolve(namespace, local, parent)),
          cases.map((row) => Option.some(row[3])),
        );
      }),
  );

  it.effect("a name no vocabulary holds, or a dotted name outside its parents, is no kind", () =>
    Effect.gen(function* unnamed() {
      const { resolve } = yield* today;

      assert.isTrue(Option.isNone(resolve(asiNamespace, "qti-no-such-element", "document")));
      assert.isTrue(Option.isNone(resolve("urn:elsewhere", "qti-item-body", "document")));
      assert.isTrue(Option.isNone(resolve("", "qti-item-body", "document")));
      assert.isTrue(Option.isNone(resolve(cpNamespace, "metadata", "cp:organizations")));
    }),
  );

  it.effect(
    "resolution agrees with kindOf for every element name under every kind and at the root",
    () =>
      Effect.gen(function* exhaustive() {
        const { resolve } = yield* today;
        const names = [
          ...new Map(
            vocabularies
              .flatMap((vocabulary) => Object.values<RegistryRow>(vocabulary.registry))
              .filter((row) => row.local !== "")
              .map((row) => [`{${row.namespace}}${row.local}`, row] as const),
          ).values(),
          rowOf("qti-no-such-element", Option.none()),
          { ...rowOf("qti-item-body", Option.none()), namespace: "urn:elsewhere" },
        ];
        const parents = [
          Option.none<NodeKindHandle>(),
          ...NodeKind.handles.map((handle) => Option.some(handle)),
        ];
        const disagreements = names.flatMap(({ local, namespace }) =>
          parents
            .filter(
              (parent) =>
                !Equal.equals(
                  resolve(
                    namespace,
                    local,
                    Option.getOrElse(parent, () => "document" as const),
                  ),
                  kindOf(element(namespace, local), parent),
                ),
            )
            .map((parent) => `{${namespace}}${local} under ${String(Option.getOrNull(parent))}`),
        );

        assert.strictEqual(names.length * parents.length, 126_672);
        assert.deepStrictEqual(disagreements, []);
      }),
  );
});

describe("the refusals", () => {
  it.effect("refuses a kind two vocabularies declare", () =>
    Effect.gen(function* repeatedKind() {
      const failure = yield* Effect.flip(toy([toyA, toyA]));

      assert.strictEqual(failure._tag, "RepeatedValue");
      assert.include(failure.message, "NodeKind's field kind lists a twice");
    }),
  );

  it.effect("refuses an attribute name spelled as an open class", () =>
    Effect.gen(function* openClassName() {
      const failure = yield* Effect.flip(toy([{ ...toyA, attributes: ["lax"] }]));

      assert.strictEqual(failure._tag, "RepeatedValue");
      assert.include(failure.message, "AttributeName's field name lists lax twice");
    }),
  );

  it.effect("refuses two kinds that one element name stands for anywhere", () =>
    Effect.gen(function* twoPlain() {
      const failure = yield* Effect.flip(
        toy([
          { ...toyA, registry: { a: rowOf("x", Option.none()), b: rowOf("x", Option.none()) } },
        ]),
      );

      assert.strictEqual(failure._tag, "KeyCollision");
      assert.include(failure.message, "KindByName states two rows at (namespace urn:toy, local x)");
    }),
  );

  it.effect("refuses two kinds that one element name stands for under one parent", () =>
    Effect.gen(function* twoDotted() {
      const failure = yield* Effect.flip(
        toy([
          {
            ...toyA,
            registry: { a: rowOf("x", Option.some("b")), b: rowOf("x", Option.some("b")) },
          },
        ]),
      );

      assert.strictEqual(failure._tag, "KeyCollision");
      assert.include(
        failure.message,
        "KindByNameUnder states two rows at (namespace urn:toy, local x, parent b)",
      );
    }),
  );

  it.effect("refuses a dotted kind under a parent no vocabulary declares", () =>
    Effect.gen(function* strayParent() {
      const failure = yield* Effect.flip(
        toy([{ ...toyA, registry: { ...toyA.registry, b: rowOf("b", Option.some("nowhere")) } }]),
      );

      assert.strictEqual(failure._tag, "OutsideCodeSpace");
      assert.include(failure.message, "KindByNameUnder has a row whose parent is nowhere");
    }),
  );
});

/**
 * Compare `kindOf` and the generated resolution on every element of a document, walking from its
 * root with `kindOf`'s kinds as the parents, as the importer's walk does.
 *
 * @param resolve - The generated resolution.
 * @param root - The document's root element.
 * @returns How many elements were compared, and each one whose kinds disagree.
 */
const compareTree = (
  resolve: (namespace: string, local: string, parent: Kind) => Option.Option<Kind>,
  root: Element,
): Compared => {
  const disagreements: string[] = [];
  let elements = 0;
  const pending: (readonly [Element, Option.Option<NodeKindHandle>])[] = [[root, Option.none()]];

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [here, parent] = next;
    const expected = kindOf(here, parent);
    elements += 1;

    if (
      !Equal.equals(
        resolve(
          here.namespace,
          here.local,
          Option.getOrElse(parent, () => "document" as const),
        ),
        expected,
      )
    ) {
      disagreements.push(`${here.qname} under ${String(Option.getOrNull(parent))}`);
    }

    if (Option.isSome(expected)) {
      for (const child of here.children) {
        if (child.kind === "element") {
          pending.push([child, expected]);
        }
      }
    }
  }

  return { disagreements, elements };
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "kind resolution on the fixtures",
  (suite) => {
    suite.effect(
      "agrees with kindOf on every element of every XML file of every fixture",
      () =>
        Effect.gen(function* everyFixture() {
          const fs = yield* FileSystem.FileSystem;
          const { resolve } = yield* today;
          const directories = [
            ...(yield* Effect.all(fixtureNames.map((name) => materialize(name)))),
            ...(yield* Effect.all(namedPackages.map((name) => materializePackage(name)))),
          ];
          const compared = yield* Effect.all(
            directories.map((directory) =>
              Effect.gen(function* fixtureFiles() {
                const files = (yield* fs.readDirectory(directory, { recursive: true }))
                  .filter((file) => file.endsWith(".xml"))
                  .toSorted();

                return yield* Effect.all(
                  files.map((file) =>
                    fs.readFile(path.join(directory, file)).pipe(
                      Effect.flatMap(readXml),
                      Effect.map((document) => ({
                        file: `${directory}/${file}`,
                        ...compareTree(resolve, document.root),
                      })),
                    ),
                  ),
                );
              }),
            ),
          );
          const walked = compared.flat();

          assert.isAbove(walked.length, 0);
          assert.isAbove(
            walked.reduce((sum, { elements }) => sum + elements, 0),
            0,
          );
          assert.deepStrictEqual(
            walked.flatMap(({ disagreements, file }) =>
              disagreements.map((disagreement) => `${file}: ${disagreement}`),
            ),
            [],
          );
        }),
      { timeout: 300_000 },
    );
  },
);
