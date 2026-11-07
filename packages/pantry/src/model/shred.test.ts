/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) as crust's charset table spells them. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { constant, element, int, map, oneOf, shuffled, string } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Effect, FileSystem, Formatter, Layer, Option, Result } from "effect";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { encode } from "@qti-pie/crust/encode.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";
import { admittedOf, governorOf, textDomainOf } from "#pantry/grammar/attributes.ts";
import { composed, coveredBy } from "#pantry/grammar/compose.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import { typeHandle } from "#pantry/grammar/xsi.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { foldGrammarOf, namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { NotQti3, shred, UnmodeledVocabulary, versionOf } from "#pantry/model/shred.ts";
import { documentBreaches, lawsOf } from "#pantry/test/oracle.ts";
import { toXmlDocument, unshred } from "#pantry/model/unshred.ts";
import { flatten, none } from "#pantry/model/xdm.ts";
import type { XdmAttribute, XdmChild, XdmClosedElement, XdmDocument } from "#pantry/model/xdm.ts";
import {
  caseHang,
  closedElements,
  editElement,
  featuresOf,
  idOf,
  scrambledIdOf,
  searchTimeout,
  xdmDocument,
} from "#pantry/test/gen/xdm.ts";
import type { XdmFeature } from "#pantry/test/gen/xdm.ts";
import {
  cpNamespace,
  mathmlNamespace,
  xlinkNamespace,
  qti2Namespaces,
  xmlnsNamespace,
  xsiNamespace,
} from "#pantry/vocab/namespaces.ts";
import { XsdOracleLayer } from "#pantry/test/gen/grammar.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { writeXsdOracle } from "#pantry/test/xsd-catalog.ts";
import { xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import {
  typeAttributeDeclarations,
  typeAttributeWildcards,
} from "#pantry/vocab/inventory/attributes.ts";
import { OracleLayer, xmllintC14n, xmllintValidate } from "#pantry/xml/oracle.ts";
import type { XsdVerdict } from "#pantry/xml/oracle.ts";

/**
 * The composed grammar every property draws its trees over, and reads and writes them through.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The grammar shred reads through, projected once.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The names unshred writes under, projected once.
 */
const names = namesOf(grammar);

/**
 * The trees every property is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The features xmllint cannot judge, which its suite's trees are drawn without: a doctype, whose
 * external subset `xmllint --c14n` cannot load, and so the unexpanded entity references only a
 * doctype admits.
 */
const unjudged: ReadonlySet<XdmFeature> = new Set(["doctype", "entityRef"]);

/**
 * The trees the xmllint suite is checked over: the generator's, with {@link unjudged} off, so the
 * suite constructs what xmllint can judge rather than setting the rest aside.
 */
const judged = xdmDocument(grammar, unjudged);

/**
 * The situations a round trip must reach beside the generator's features: a foreign element
 * carrying an attribute named `data-…`, which is `no-namespace` there, as PCI markup is; a foreign
 * element of each namespace class; an element of a kind below a foreign one, which a global
 * declaration names in its lax content (spec reading 57); and an attribute in its element's own
 * namespace.
 */
const situations = [
  "foreign data name",
  ...Object.values(foreignKinds),
  "kind under foreign",
  "own-namespace attribute",
] as const;

/**
 * What a round trip must reach: the generator's features and {@link situations}.
 */
type RoundTrip = XdmFeature | (typeof situations)[number];

/**
 * Find the situations of {@link situations} a tree holds.
 *
 * @param document - The tree.
 * @returns Each situation it holds, once.
 */
const situationsOf = (document: XdmDocument<Composed>): ReadonlySet<RoundTrip> => {
  const found = new Set<RoundTrip>();
  const stack: { readonly node: XdmChild<Composed>; readonly under: boolean }[] = [
    { node: document.root, under: false },
  ];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    const { node, under } = next;
    if (node._tag === "element" && under) {
      found.add("kind under foreign");
    }

    if (isForeignKind(node._tag)) {
      found.add(node._tag);
    }

    if ("attributes" in node) {
      for (const { name } of node.attributes) {
        if (name._tag === "own-namespace") {
          found.add("own-namespace attribute");
        } else if (
          isForeignKind(node._tag) &&
          name._tag === "no-namespace" &&
          name.local.startsWith("data-")
        ) {
          found.add("foreign data name");
        }
      }

      const foreign = isForeignKind(node._tag);
      stack.push(...node.children.map((child) => ({ node: child, under: foreign })));
    }
  }

  return found;
};

/**
 * Read bytes back through crust and shred, in a version.
 *
 * @param bytes - The bytes.
 * @param version - The version.
 * @returns The tree.
 */
const reread = (bytes: Uint8Array, version: Composed["version"]) =>
  Effect.flatMap(Effect.orDie(readXml(bytes)), (read) => shred(read, version, shredGrammar));

/**
 * A crust tree rewritten in forms the XDM does not record: text runs written as CDATA where their
 * text allows, runs split in two, and namespace declarations moved among the attributes.
 */
interface Rewritten {
  readonly document: XmlDocument;
  readonly erased: readonly ("cdata" | "split run" | "declarations among attributes")[];
}

/**
 * Rewrite a crust tree in forms the XDM does not record.
 *
 * @param document - The tree unshred writes.
 * @returns A generator of the rewritten tree and the forms it used.
 */
const rewritten =
  (document: XmlDocument): Gen<Rewritten> =>
  (source) => {
    const erased = new Set<Rewritten["erased"][number]>();
    const elementOf = (node: Element): Element => {
      const attributes = source.draw(
        shuffled(node.attributes, { max: node.attributes.length, min: node.attributes.length }),
      );
      const firstOther = attributes.findIndex(({ namespace }) => namespace !== xmlnsNamespace);
      if (
        attributes.slice(firstOther + 1).some(({ namespace }) => namespace === xmlnsNamespace) &&
        firstOther !== -1
      ) {
        erased.add("declarations among attributes");
      }

      const children = node.children.flatMap((child): readonly Child[] => {
        if (child.kind === "element") {
          return [elementOf(child)];
        }

        if (child.kind !== "text") {
          return [child];
        }

        const form = source.draw(element(["plain", "cdata", "split"] as const));
        if (form === "cdata" && !child.value.includes("]]>")) {
          erased.add("cdata");

          return [{ ...child, cdata: true }];
        }

        if (form === "split" && child.value.length > 1 && !child.value.includes("]")) {
          const at = source.draw(int(1, child.value.length - 1));
          erased.add("split run");

          return [
            { ...child, value: child.value.slice(0, at) },
            { ...child, value: child.value.slice(at) },
          ];
        }

        return [child];
      });

      return { ...node, attributes, children };
    };

    return { document: { ...document, root: elementOf(document.root) }, erased: [...erased] };
  };

/**
 * Write a tree as the crust tree unshred encodes.
 *
 * @param tree - The tree.
 * @returns Its crust tree.
 */
const crust = (tree: XdmDocument<Composed>): XmlDocument => toXmlDocument(tree, names);

describe("shred and unshred", { timeout: searchTimeout }, () => {
  it.effect(
    "give back every generated row set: shred ∘ unshred ∘ assemble is the identity on flatten's rows, under any ids",
    (ctx) =>
      // Oracle: a universal one, the round trip; the tree records exactly what shred reads, so the
      // rows come back field for field.
      // Bound: the generator's drawn bounds, up to 200 nodes and depth 7 a tree.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<RoundTrip>(
              [
                "element",
                "wildcard",
                "text",
                "ws",
                "comment",
                "pi",
                "entityRef",
                "attribute",
                "openName",
                "namespace",
                "doctype",
                "boundPrefix",
                ...situations,
              ],
              { cases: 400, sense: notesOnly },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "the round trip: shred ∘ unshred ∘ assemble = id on flatten's rows",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/shred-unshred-rows",
          },
          ({ document }, c) =>
            Effect.gen(function* rowRoundTrip() {
              c.noteAll(featuresOf(document));
              c.noteAll(situationsOf(document));

              const ids = c.draw(element([idOf, scrambledIdOf]));
              const rows = flatten(document, ids);
              const assembled = yield* Effect.orDie(Effect.fromResult(assemble(rows)));
              const back = yield* reread(yield* unshred(assembled, names), document.version);

              assert.deepStrictEqual(flatten(back, ids), rows);
            }),
        ),
      ),
  );

  /**
   * What the XDM does not record, which canonical XML erases too.
   */
  type Erased = "cdata" | "split run" | "declarations among attributes";

  it.effect(
    "give back every document up to canonical XML: unshred ∘ shred is the identity there, whatever CDATA, run splits and declaration order the source wrote",
    (ctx) =>
      // Oracle: a universal one, the round trip, under Canonical XML 1.0 (crust's canonicalizer),
      // which erases exactly the forms the XDM does not record.
      // Bound: the generator's drawn bounds, the source's CDATA, runs and attribute order drawn.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Erased>(["cdata", "split run", "declarations among attributes"], {
              cases: 400,
              sense: notesOnly,
            }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "universal",
              name: "the round trip unshred ∘ shred = id under Canonical XML 1.0, by crust's canonicalizer",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/unshred-shred-canonical",
          },
          ({ document }, c) =>
            Effect.gen(function* canonicalRoundTrip() {
              const source = c.draw(rewritten(toXmlDocument(document, names)));
              c.noteAll(source.erased);

              const bytes = yield* encode(source.document, "UTF-8");
              const read = yield* Effect.orDie(readXml(bytes));
              const out = yield* unshred(yield* shred(read, document.version, shredGrammar), names);

              assert.strictEqual(
                new TextDecoder().decode(canonicalize(yield* Effect.orDie(readXml(out)))),
                new TextDecoder().decode(canonicalize(read)),
              );
            }),
        ),
      ),
  );

  it.effect("give back documents xmllint canonicalizes the same, before and after", (ctx) =>
    // Oracle: a second implementation, libxml2's `xmllint --c14n`, beside crust's canonicalizer,
    // over a sample of the round trips above.
    // Bound: 30 generated trees, drawn with no doctype and so no unexpanded entity reference
    // ({@link unjudged}), which xmllint refuses without their declarations; none is discarded.
    searched(
      ctx,
      explore(
        {
          caseHang,
          concurrency: 1,
          coverage: required<XdmFeature>(["element", "wildcard", "text", "attribute", "openName"], {
            cases: 300,
            sense: notesOnly,
          }),
          draw: drawn(judged),
          kept: [],
          literal: Formatter.format,
          oracle: {
            kind: "second-implementation",
            name: "libxml2's xmllint --c14n, of the source and of its round trip",
          },
          runs: 30,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "model/unshred-shred-xmllint",
        },
        ({ document }, c) =>
          Effect.gen(function* xmllintRoundTrip() {
            const features = featuresOf(document);
            assert.isFalse(
              [...unjudged].some((feature) => features.has(feature)),
              "the generator drew a feature its swarm left off",
            );
            c.noteAll(features);

            const fs = yield* FileSystem.FileSystem;
            const scratch = path.resolve(import.meta.dirname, "..", "..", "work", "q2-c14n");
            yield* fs.makeDirectory(scratch, { recursive: true });

            const source = c.draw(rewritten(toXmlDocument(document, names)));
            const bytes = yield* encode(source.document, "UTF-8");
            const out = yield* unshred(yield* reread(bytes, document.version), names);
            const inFile = path.join(scratch, `${String(process.pid)}.in.xml`);
            const outFile = path.join(scratch, `${String(process.pid)}.out.xml`);
            yield* fs.writeFile(inFile, bytes);
            yield* fs.writeFile(outFile, out);

            const expected = yield* xmllintC14n(inFile);
            const actual = yield* xmllintC14n(outFile);

            assert.strictEqual(
              new TextDecoder().decode(actual),
              new TextDecoder().decode(expected),
            );
          }),
      ),
    ).pipe(Effect.provide(OracleLayer.pipe(Layer.provideMerge(NodeServices.layer)))),
  );
});

/**
 * The qualified name of an element of a kind, as unshred writes it.
 *
 * @param closed - The element.
 * @returns Its prefix and local name.
 */
const qnameOf = (closed: XdmClosedElement<Composed>): string => {
  const { local } = names.element(closed.kind);

  return closed.prefix === "" ? local : `${closed.prefix}:${local}`;
};

/**
 * Find an element of a kind in a tree by its number in document order.
 *
 * @param document - The tree.
 * @param target - Its number.
 * @returns The element.
 */
const elementAt = (document: XdmDocument<Composed>, target: number): XdmClosedElement<Composed> => {
  let found: Option.Option<XdmClosedElement<Composed>> = Option.none();
  editElement(document, target, (at) => {
    found = Option.some(at);

    return at;
  });

  return Option.getOrThrowWith(found, () => new Error(`no element numbered ${String(target)}`));
};

/**
 * The named ways a document has no representation, each a name the codec has no handle for.
 */
const unmodeled = [
  "unnamed element",
  "unadmitted attribute",
  "declared attribute",
  "data name",
  "namespace entity",
  "xml version",
  "mathml foreign",
  "unbound foreign type",
] as const;

/**
 * One of {@link unmodeled}.
 */
type Unmodeled = (typeof unmodeled)[number];

describe("shred's refusals", { timeout: searchTimeout }, () => {
  it.effect(
    "refuses each name it has no handle for, with its reason and where it is, and an XML version other than 1.x",
    (ctx) =>
      // Oracle: the specification as a checker: the codec refuses exactly what has no
      // representation, an element no kind names where no foreign element is admitted, an
      // attribute its kind admits under no name or class, a declared `xsi:` name its kind does not admit, a
      // malformed `data-` name, a namespace read through an entity, a document not in XML 1.x, a
      // MathML element where only a foreign one stands (MathML 3 §2.2, law "MathML foreign
      // element"), and a foreign element's xsi:type whose prefix nothing binds (spec reading 83).
      // Bound: the generator's drawn bounds, one name added to a valid tree a case, on an element
      // drawn among those the variant fits, so no case is discarded.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Unmodeled>(unmodeled, { cases: 400, sense: notesOnly }),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the codec refuses exactly what has no representation: the eight named variants, MathML 3 §2.2 and reading 83 among them",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/shred-refusals",
          },
          ({ document, model }, c) =>
            Effect.gen(function* refusals() {
              const { version } = document;
              const owners = closedElements(model);
              if (!Arr.isReadonlyArrayNonEmpty(owners)) {
                assert.fail("a generated tree has a root element");
              }

              // An unnamed element needs an owner no foreign element may sit under, and an
              // unadmitted attribute one that admits no foreign attribute: each draws its target
              // among those, and a tree that holds none draws among the other variants.
              const hostsOf = (drawnVariant: Unmodeled): readonly number[] => {
                switch (drawnVariant) {
                  case "unnamed element": {
                    return owners.filter(
                      (number) =>
                        !shredGrammar.admitsChild(
                          version,
                          elementAt(document, number).kind,
                          "foreign-element",
                        ),
                    );
                  }
                  case "unadmitted attribute": {
                    return owners.filter(
                      (number) =>
                        !shredGrammar.admitted(
                          version,
                          elementAt(document, number).kind,
                          elementAt(document, number).governs,
                          "foreign",
                        ),
                    );
                  }
                  case "mathml foreign": {
                    return owners.filter((number) => {
                      const { kind } = elementAt(document, number);

                      return (
                        !kind.startsWith("m:") &&
                        shredGrammar.admitsChild(version, kind, "foreign-element") &&
                        !shredGrammar.admitsChild(version, kind, "m:mi")
                      );
                    });
                  }
                  case "unbound foreign type": {
                    return owners.filter((number) =>
                      shredGrammar.admitsChild(
                        version,
                        elementAt(document, number).kind,
                        "foreign-element",
                      ),
                    );
                  }
                  case "declared attribute":
                  case "data name":
                  case "namespace entity":
                  case "xml version": {
                    return owners;
                  }
                  default: {
                    return drawnVariant satisfies never;
                  }
                }
              };
              const hosted = unmodeled.filter((each) => hostsOf(each).length > 0);
              const variant = c.draw(
                element(Arr.isReadonlyArrayNonEmpty(hosted) ? hosted : unmodeled),
              );
              c.note(variant);

              const hosts = hostsOf(variant);
              const target = c.draw(element(Arr.isReadonlyArrayNonEmpty(hosts) ? hosts : owners));
              const owner = elementAt(document, target);
              const withAttribute = (attribute: XdmAttribute<Composed>, declared: boolean) =>
                editElement(document, target, (at) => ({
                  ...at,
                  attributes: [attribute, ...at.attributes],
                  namespaces: declared
                    ? [...at.namespaces, { prefix: "zq", uri: "urn:zq" }]
                    : at.namespaces,
                }));
              const refusalOf = (tree: XmlDocument) =>
                Effect.flip(shred(tree, version, shredGrammar));
              switch (variant) {
                case "unnamed element": {
                  const edited = editElement(document, target, (at) => ({
                    ...at,
                    children: [
                      {
                        _tag: "foreign-element",
                        attributes: [],
                        children: [],
                        governs: none,
                        name: { local: "nope", namespace: "urn:none" },
                        namespaces: [{ prefix: "zn", uri: "urn:none" }],
                        prefix: "zn",
                      },
                      ...at.children,
                    ],
                  }));
                  const refusal = yield* refusalOf(crust(edited));

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "element",
                      name: "zn:nope",
                      parent: Option.some(qnameOf(owner)),
                      reason: "unnamed",
                    }),
                  );
                  break;
                }
                case "mathml foreign": {
                  const edited = editElement(document, target, (at) => ({
                    ...at,
                    children: [
                      {
                        _tag: "foreign-element",
                        attributes: [],
                        children: [],
                        governs: none,
                        name: { local: "mi", namespace: mathmlNamespace },
                        namespaces: [{ prefix: "zm", uri: mathmlNamespace }],
                        prefix: "zm",
                      },
                      ...at.children,
                    ],
                  }));
                  const refusal = yield* refusalOf(crust(edited));

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "element",
                      name: "zm:mi",
                      parent: Option.some(qnameOf(owner)),
                      reason: "mathml-foreign",
                    }),
                  );
                  break;
                }
                case "unbound foreign type": {
                  const edited = editElement(document, target, (at) => ({
                    ...at,
                    children: [
                      {
                        _tag: "foreign-element",
                        attributes: [
                          {
                            lexical: "zu:T",
                            name: {
                              _tag: "foreign",
                              local: "type",
                              prefix: "xsi",
                              uri: xsiNamespace,
                            },
                            references: [],
                          },
                        ],
                        children: [],
                        governs: none,
                        name: { local: "nope", namespace: "urn:none" },
                        namespaces: [
                          { prefix: "zn", uri: "urn:none" },
                          { prefix: "xsi", uri: xsiNamespace },
                        ],
                        prefix: "zn",
                      },
                      ...at.children,
                    ],
                  }));
                  const refusal = yield* refusalOf(crust(edited));

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "attribute",
                      name: "xsi:type",
                      parent: Option.some("zn:nope"),
                      reason: "type-unresolved",
                    }),
                  );
                  break;
                }
                case "unadmitted attribute": {
                  const refusal = yield* refusalOf(
                    crust(
                      withAttribute(
                        {
                          lexical: "v",
                          name: { _tag: "foreign", local: "q", prefix: "zq", uri: "urn:zq" },
                          references: [],
                        },
                        true,
                      ),
                    ),
                  );

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "attribute",
                      name: "zq:q",
                      parent: Option.some(qnameOf(owner)),
                      reason: "unadmitted",
                    }),
                  );
                  break;
                }
                case "declared attribute": {
                  // `xsi:nil` is XML Schema's own, and no element of a kind is nillable (audit A6).
                  const refusal = yield* refusalOf(
                    crust(
                      editElement(document, target, (at) => ({
                        ...at,
                        attributes: [
                          {
                            lexical: "true",
                            name: {
                              _tag: "foreign",
                              local: "nil",
                              prefix: "zs",
                              uri: xsiNamespace,
                            },
                            references: [],
                          },
                          ...at.attributes,
                        ],
                        namespaces: [...at.namespaces, { prefix: "zs", uri: xsiNamespace }],
                      })),
                    ),
                  );

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "attribute",
                      name: "zs:nil",
                      parent: Option.some(qnameOf(owner)),
                      reason: "declared",
                    }),
                  );
                  break;
                }
                case "data name": {
                  const refusal = yield* refusalOf(
                    crust(
                      withAttribute(
                        {
                          lexical: "v",
                          name: { _tag: "no-namespace", local: "data-Bad" },
                          references: [],
                        },
                        false,
                      ),
                    ),
                  );

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "attribute",
                      name: "data-Bad",
                      parent: Option.some(qnameOf(owner)),
                      reason: "data-name",
                    }),
                  );
                  break;
                }
                case "namespace entity": {
                  const tree = crust(document);
                  const refusal = yield* refusalOf({
                    ...tree,
                    root: {
                      ...tree.root,
                      attributes: [
                        {
                          local: "zq",
                          namespace: xmlnsNamespace,
                          prefix: "xmlns",
                          qname: "xmlns:zq",
                          references: [{ name: "e", offset: 0 }],
                          value: "&e;",
                        },
                        ...tree.root.attributes,
                      ],
                    },
                  });

                  assert.deepStrictEqual(
                    refusal,
                    new UnmodeledVocabulary({
                      kind: "attribute",
                      name: "xmlns:zq",
                      parent: Option.some(qnameOf(document.root)),
                      reason: "namespace-entity",
                    }),
                  );
                  break;
                }
                case "xml version": {
                  const tree = crust(document);
                  const refusal = yield* refusalOf({
                    ...tree,
                    declaration: Option.some({
                      encoding: Option.none(),
                      standalone: Option.none(),
                      version: "2.0",
                    }),
                  });

                  assert.deepStrictEqual(
                    refusal,
                    new NotQti3({
                      expected: "XML 1.x",
                      found: Option.some("2.0"),
                      reason: "xml-version",
                    }),
                  );
                  break;
                }
                default: {
                  assert.fail(`no variant ${String(variant satisfies never)}`);
                }
              }
            }),
        ),
      ),
  );

  /**
   * What a declared schema version was: one the roster holds, another string, or none.
   */
  type Declared = "held" | "other" | "none";

  it.effect(
    "decodes exactly the roster's versions, and refuses any other declaration and none as not-qti3",
    (ctx) =>
      // Oracle: the specification as a checker, the `SchemaVersion` roster.
      // Bound: every roster version, and strings of up to 6 characters over the versions' own.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Declared>(["held", "other", "none"], {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn(
              oneOf<Option.Option<string>>([
                constant(Option.none()),
                map(element(schemaVersions), Option.some),
                map(
                  string(element(["3", ".", "0", "1", " ", "2"]), { max: 6, min: 0 }),
                  Option.some,
                ),
              ]),
            ),
            kept: [],
            literal: Formatter.format,
            oracle: { kind: "specification", name: "the SchemaVersion roster" },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "model/shred-version-of",
          },
          (declared, c) =>
            Effect.sync(() => {
              const held = declared.pipe(
                Option.flatMap((value) =>
                  Option.fromNullishOr(schemaVersions.find((version) => version === value)),
                ),
              );
              if (Option.isSome(held)) {
                c.note("held");
              } else {
                c.note(Option.isSome(declared) ? "other" : "none");
              }

              assert.deepStrictEqual(
                versionOf(schemaVersions, declared),
                Option.match(held, {
                  onNone: () =>
                    Result.fail(
                      new NotQti3({
                        expected: schemaVersions.join(" or "),
                        found: declared,
                        reason: "schema-version",
                      }),
                    ),
                  onSome: (version) => Result.succeed(version),
                }),
              );
            }),
        ),
      ),
  );
});

/**
 * The ASI namespace, the namespace of `qti-assessment-item` and of its declared type.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * XML Schema's namespace, the built-in types'.
 */
const xs = "http://www.w3.org/2001/XMLSchema";

/**
 * The `xsi:type` values the box draws on a strictly assessed root: none; the declared type's name
 * unprefixed (the default namespace), under a bound prefix, padded with whitespace and under an
 * unbound prefix; a built-in under a bound prefix; a name no schema defines; and no QName at all.
 */
const typeValues = [
  Option.none(),
  Option.some("AssessmentItemDType"),
  Option.some("a:AssessmentItemDType"),
  Option.some(" \ta:AssessmentItemDType\n"),
  Option.some("q:AssessmentItemDType"),
  Option.some("xs:string"),
  Option.some("NoSuchDType"),
  Option.some("a:b:c"),
] as const;

describe("shred's governing type", () => {
  it.effect(
    "resolves an xsi:type on an element of a kind against the bindings in scope, and refuses one that names no type, every value of the box",
    () =>
      Effect.gen(function* governing() {
        // Oracle: XML Schema 1.0 Part 1 §3.3.4 clause 4 and §3.15.3 as a checker: a QName after
        // `collapse`, its prefix in scope (an unprefixed one the default namespace's), naming a
        // type of the pinned schemas; no xsi:type, the declared type.
        const scope = new Map([
          ["", asi],
          ["a", asi],
          ["xs", xs],
        ]);
        for (const value of typeValues) {
          const attribute = Option.match(value, {
            onNone: () => "",
            onSome: (held) =>
              ` xsi:type="${held.replaceAll("\t", "&#9;").replaceAll("\n", "&#10;")}"`,
          });
          const bytes = new TextEncoder().encode(
            `<qti-assessment-item xmlns="${asi}" xmlns:a="${asi}" xmlns:xs="${xs}" xmlns:xsi="${xsiNamespace}"${attribute}/>`,
          );
          const result = yield* Effect.result(reread(bytes, "3.0.1"));
          const expected = Option.match(value, {
            onNone: () => Result.succeed(grammar.xsi.declaredType("3.0.1", "qti-assessment-item")),
            onSome: (held) => {
              const parts = /^(?:(?<prefix>[^\s:]+):)?(?<local>[^\s:]+)$/u.exec(
                held.trim(),
              )?.groups;
              const namespace = scope.get(parts?.["prefix"] ?? "");
              if (parts === undefined || namespace === undefined) {
                return Result.fail("type-unresolved");
              }

              const handle = typeHandle({ local: parts["local"] ?? "", namespace });

              return grammar.xsi.typeName.has(handle)
                ? Result.succeed(handle)
                : Result.fail("type-unknown");
            },
          });
          const actual = Result.isSuccess(result)
            ? Result.succeed(result.success.root.governs)
            : Result.fail(
                result.failure instanceof UnmodeledVocabulary
                  ? result.failure.reason
                  : result.failure._tag,
              );

          assert.deepStrictEqual(
            actual,
            expected,
            Option.getOrElse(value, () => "(none)"),
          );
        }
      }),
  );

  it.effect(
    "refuses Q4's case 130, an xsi:type on cp:schemaversion that names no type, end to end",
    () =>
      Effect.gen(function* case130() {
        const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";
        const bytes = new TextEncoder().encode(
          `<manifest xmlns="${cp}" xmlns:xsi="${xsiNamespace}" identifier="m"><metadata><schema>QTI Package</schema><schemaversion xsi:type="v">3.0.1</schemaversion></metadata><organizations/><resources/></manifest>`,
        );
        const result = yield* Effect.result(reread(bytes, "3.0.1"));

        assert.isTrue(Result.isFailure(result));
        if (Result.isFailure(result)) {
          assert.instanceOf(result.failure, UnmodeledVocabulary);
          assert.strictEqual(
            result.failure instanceof UnmodeledVocabulary ? result.failure.reason : "",
            "type-unknown",
          );
        }
      }),
  );
});

/**
 * An `xsi:type` value naming a built-in, as the box's documents bind XML Schema's namespace.
 *
 * @param local - The built-in's local name.
 * @returns Its `TypeName` handle.
 */
const builtin = (local: string): string => typeHandle({ local, namespace: xs });

/**
 * The arms of spec reading 60's `lax` box: a foreign element under `qti-selection`'s `grpLax.any`
 * (`##other`, `lax`), each with the governing type XML Schema gives it and the verdict the
 * specification gives its document: `accepted`, the shred refusal's reason, or the law a simple
 * governing type breaks (`element child`, Element Locally Valid (Type) clause 3.1.2; `text`, clause
 * 3.1.3). `departs` marks an arm libxml2 refuses as "does not resolve to a type definition", with
 * its follow-on "The type definition is absent.", which reading 60 records against the reading
 * rather than counting it a defect: a name no schema of the document's set defines leaves the
 * element to lax assessment. `xs:NOTATION`'s value space is the notations the schema declares (XML
 * Schema 1.0 Part 2, §3.2.19), and no pinned XSD declares one, so its arms' texts are all outside
 * it, the empty one included (C47).
 */
const laxArms: readonly {
  readonly arm: string;
  readonly child: string;
  readonly departs?: true;
  readonly governs: string;
  readonly verdict: string;
}[] = [
  { arm: "no xsi:type", child: '<f:x f:a="1"><f:y/>t</f:x>', governs: none, verdict: "accepted" },
  {
    arm: "built-in simple, text in its domain",
    child: '<f:x xsi:type="xs:integer"> -12 </f:x>',
    governs: builtin("integer"),
    verdict: "accepted",
  },
  {
    arm: "built-in simple, text outside its domain",
    child: '<f:x xsi:type="xs:integer">1.5</f:x>',
    governs: builtin("integer"),
    verdict: "text",
  },
  {
    arm: "built-in simple, an element child",
    child: '<f:x xsi:type="xs:string">a<f:y/></f:x>',
    governs: builtin("string"),
    verdict: "element child",
  },
  {
    arm: "built-in simple, another attribute",
    child: '<f:x xsi:type="xs:string" f:a="1">a</f:x>',
    governs: builtin("string"),
    verdict: "unadmitted",
  },
  {
    arm: "built-in simple, xsi:nil beside it",
    child: '<f:x xsi:type="xs:boolean" xsi:nil="false">true</f:x>',
    governs: builtin("boolean"),
    verdict: "accepted",
  },
  {
    arm: "xs:anyType",
    child: '<f:x xsi:type="xs:anyType" f:a="1"><f:y/>t</f:x>',
    governs: builtin("anyType"),
    verdict: "accepted",
  },
  {
    arm: "simple type of the set, text in its domain",
    child: '<f:x xsi:type="q:IdentifierDType">a1</f:x>',
    governs: typeHandle({ local: "IdentifierDType", namespace: asi }),
    verdict: "accepted",
  },
  {
    arm: "simple type of the set, text outside its domain",
    child: '<f:x xsi:type="q:IdentifierDType">1a</f:x>',
    governs: typeHandle({ local: "IdentifierDType", namespace: asi }),
    verdict: "text",
  },
  {
    arm: "type of another set",
    child: '<f:x xsi:type="d:ExtensionString.Type">a<f:y/></f:x>',
    departs: true,
    governs: none,
    verdict: "accepted",
  },
  {
    arm: "unknown type",
    child: '<f:x xsi:type="f:NoSuchType">a<f:y/></f:x>',
    departs: true,
    governs: none,
    verdict: "accepted",
  },
  {
    arm: "unbound prefix",
    child: '<f:x xsi:type="zz:T">a</f:x>',
    governs: none,
    verdict: "type-unresolved",
  },
  {
    arm: "no QName",
    child: '<f:x xsi:type="a:b:c">a</f:x>',
    governs: none,
    verdict: "type-unresolved",
  },
  ...(
    [
      ["dateTime", "2024-02-29T23:59:59.5-05:00", "2023-02-29T00:00:00"],
      ["time", "00:00:00Z", "23:60:00"],
      ["duration", "-P1Y2MT3.5S", "P1YT"],
      ["gYearMonth", "2026-11", "2026-13"],
      ["gYear", "-0044", "0000"],
      ["gMonthDay", "--02-29", "--04-31"],
      ["gDay", "---31", "---32"],
      ["gMonth", "--11", "--13"],
      ["hexBinary", "0aFF", "0aF"],
    ] as const
  ).flatMap(([local, valid, invalid]) => [
    {
      arm: `xs:${local}, text in its domain`,
      child: `<f:x xsi:type="xs:${local}">${valid}</f:x>`,
      governs: builtin(local),
      verdict: "accepted",
    },
    {
      arm: `xs:${local}, text outside its domain`,
      child: `<f:x xsi:type="xs:${local}">${invalid}</f:x>`,
      governs: builtin(local),
      verdict: "text",
    },
  ]),
  ...["", "a", "q:IdentifierDType"].map((text) => ({
    arm: `xs:NOTATION, the text ${JSON.stringify(text)}`,
    child: `<f:x xsi:type="xs:NOTATION">${text}</f:x>`,
    governs: builtin("NOTATION"),
    verdict: "text",
  })),
];

/**
 * Write a test whose section's `qti-selection` holds one child in its `lax` `##other` wildcard,
 * with XML Schema's, ASI's and the DRD's namespaces bound.
 *
 * @param child - The child as written.
 * @returns The document.
 */
const laxDocument = (child: string): string =>
  `<qti-assessment-test xmlns="${asi}" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="${xs}" xmlns:q="${asi}" xmlns:d="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true"><qti-selection select="1">${child}</qti-selection><qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>\n`;

/**
 * Judge a foreign element by its governing type as spec reading 60 does: where the type is a
 * governor of its kind, a simple type, the element holds no element child and its text is in the
 * type's domain (XML Schema 1.0 Part 1, §3.3.4, Element Locally Valid (Type), clauses 3.1.2 and
 * 3.1.3), read through `Governor` and `TypeText`.
 *
 * @param node - The foreign element.
 * @param version - Its document's version.
 * @returns `accepted`, or the clause it breaks.
 */
const simpleVerdictOf = (node: XdmChild<Composed>, version: Composed["version"]): string => {
  if (!("governs" in node) || node._tag === "element") {
    return "no foreign element";
  }

  const key = { governs: node.governs, kind: node._tag, version };
  if (Option.isNone(governorOf(grammar.attributes, key))) {
    return "accepted";
  }

  if (node.children.some((child) => child._tag === "element" || isForeignKind(child._tag))) {
    return "element child";
  }

  const text = node.children
    .map((child) => (child._tag === "text" || child._tag === "ws" ? child.value : ""))
    .join("");
  const pattern = textDomainOf(grammar.attributes, key).pipe(
    Option.flatMap((handle) =>
      Option.fromNullishOr(grammar.attributes.domains.find((domain) => domain.handle === handle)),
    ),
    Option.map(({ pattern: source }) => new RegExp(source, patternFlags)),
  );

  return Option.exists(pattern, (regex) => regex.test(text)) ? "accepted" : "text";
};

/**
 * Find the `qti-selection` child of a {@link laxDocument}.
 *
 * @param tree - The document's tree.
 * @returns The child, none where the tree holds no such path.
 */
const laxChildOf = (tree: XdmDocument<Composed>): Option.Option<XdmChild<Composed>> => {
  let node: XdmChild<Composed> = tree.root;
  for (let depth = 0; depth < 4; depth += 1) {
    const next: XdmChild<Composed> | undefined = "children" in node ? node.children[0] : undefined;
    if (next === undefined) {
      return Option.none();
    }

    node = next;
  }

  return Option.some(node);
};

describe("a foreign element's governing type (spec readings 60 and 83)", () => {
  it.effect(
    "resolves every foreign xsi:type under a lax wildcard, refuses an unbound prefix, judges a simple type's attributes, children and text, and xmllint agrees but where reading 60 records libxml2's departure: every arm in both versions",
    () =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 1 §3.3.4 (Schema-Validity
      // Assessment (Element), clause 1.2; Element Locally Valid (Type), clause 3.1), §3.2.4 clause
      // 1.2 and §3.15.3 as the arms' verdicts; and libxml2 over the ASI XSD as a control, with
      // reading 60's recorded departure on the arms whose xsi:type names no type of the set.
      // Bound: the 34 arms under qti-selection's lax wildcard in the 2 versions, exhausted.
      Effect.gen(function* laxBox() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("lax-wildcard-");
        const oracle = yield* writeXsdOracle(directory);
        const cache = yield* xsdDirectory;
        const disagreements: string[] = [];
        let compared = 0;
        for (const version of schemaVersions) {
          const cases = laxArms.map((held, at) => ({
            ...held,
            file: `${directory}/${version}-${at}.xml`,
            text: laxDocument(held.child),
          }));
          for (const { file, text } of cases) {
            yield* fs.writeFileString(file, text);
          }

          const verdicts = yield* xmllintValidate({
            catalog: oracle.catalog,
            paths: cases.map(({ file }) => file),
            schema: `${cache}/${version === "3.0.0" ? "imsqti_asiv3p0_v1p0.xsd" : "imsqti_asiv3p0p1_v1p0.xsd"}`,
          });
          for (const [at, { arm, departs, governs, text, verdict }] of cases.entries()) {
            compared += 1;
            const where = `${version} ${arm}`;
            const result = yield* Effect.result(reread(new TextEncoder().encode(text), version));
            const ours = Result.match(result, {
              onFailure: (failure) =>
                failure instanceof UnmodeledVocabulary ? failure.reason : failure._tag,
              onSuccess: (tree) =>
                Option.match(laxChildOf(tree), {
                  onNone: () => "no foreign element",
                  onSome: (child) =>
                    "governs" in child && child.governs !== governs
                      ? `governed by ${child.governs}`
                      : simpleVerdictOf(child, version),
                }),
            });
            if (ours !== verdict) {
              disagreements.push(
                `${where}: shred and the grammar ${ours}, the specification ${verdict}`,
              );
            }

            const said = verdicts[at];
            const expected = verdict === "accepted" && departs !== true ? "Valid" : "Invalid";
            const departure =
              departs === true &&
              said?._tag === "Invalid" &&
              said.messages.some(({ text: message }) =>
                message.includes("does not resolve to a type definition"),
              ) &&
              said.messages.every(
                ({ text: message }) =>
                  message.includes("does not resolve to a type definition") ||
                  message === "The type definition is absent.",
              );
            if (said?._tag !== expected || (departs === true && !departure)) {
              disagreements.push(`${where}: xmllint ${Formatter.format(said)}`);
            }
          }
        }

        assert.strictEqual(compared, 2 * laxArms.length);
        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    120_000,
  );
});

/**
 * The roots of spec reading 89's box, each a local name in a namespace: QTI 2's nine namespaces,
 * where every root is refused as `not-qti3` before its name is read; QTI 3.0's ASI and usage-data
 * namespaces, where a root QTI 3 names is read; and a namespace QTI declares none of, and none,
 * where a root no vocabulary names is `unnamed`.
 */
const rootNamespaces = [
  ...qti2Namespaces,
  asi,
  "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0",
  "http://www.imsglobal.org/xsd/imslticc_v1p0",
  "",
] as const;

/**
 * The local names each namespace of {@link rootNamespaces} is tried with: QTI 2's item and usage
 * data roots, QTI 3's item and usage-data roots, and a name no vocabulary has.
 */
const rootLocals = ["assessmentItem", "usageData", "qti-assessment-item", "x"] as const;

describe("a QTI 2 root (spec reading 89)", () => {
  it.effect(
    "refuses a root in each of QTI 2's nine namespaces as not-qti3, reason root-namespace, before its name is read, and reads every other root by its name: every namespace with every local name, in both versions",
    () =>
      // Oracle: the specification as a checker, reading 89: QTI 2's XSDs' targetNamespaces, read
      // from the published files where the cache holds them, decide the refusal, before the root's
      // name or its attribute is read; any other root is read by its name, `unnamed` where none
      // resolves, and its attribute no root declares refused where its kind admits no such name.
      // Bound: the 13 namespaces by the 4 local names in the 2 versions, exhausted.
      Effect.gen(function* qti2Roots() {
        const fs = yield* FileSystem.FileSystem;
        const published = path.join(
          process.env["HOME"] ?? "",
          ".cache",
          "gr8des",
          "qd",
          "src",
          "qti22",
        );
        if (yield* fs.exists(published)) {
          const declared = new Set<string>();
          for (const file of yield* fs.readDirectory(published)) {
            const text = yield* fs.readFileString(path.join(published, file));
            for (const match of text.matchAll(/targetNamespace="(?<namespace>[^"]+)"/gu)) {
              declared.add(match.groups?.["namespace"] ?? "");
            }
          }

          assert.deepStrictEqual([...declared].toSorted(), [...qti2Namespaces].toSorted());
        }

        const disagreements: string[] = [];
        for (const version of schemaVersions) {
          for (const namespace of rootNamespaces) {
            for (const local of rootLocals) {
              const written = namespace === "" ? "" : ` xmlns="${namespace}"`;
              // A name no root admits: read before the root's namespace, it would be refused.
              const bytes = new TextEncoder().encode(`<${local}${written} zz-unread="1"/>`);
              const result = yield* Effect.result(
                Effect.flatMap(Effect.orDie(readXml(bytes)), (read) =>
                  shred(read, version, shredGrammar),
                ),
              );
              const ours = Result.match(result, {
                onFailure: (failure) =>
                  failure instanceof NotQti3
                    ? `not-qti3 ${failure.reason} ${Option.getOrElse(failure.found, () => "")}`
                    : failure.reason,
                onSuccess: () => "read",
              });
              const expected = qti2Namespaces.has(namespace)
                ? `not-qti3 root-namespace ${namespace}`
                : Option.match(shredGrammar.resolve(namespace, local, "document"), {
                    onNone: () => "unnamed",
                    onSome: (kind) =>
                      shredGrammar.admitted(
                        version,
                        kind,
                        shredGrammar.declaredType(version, kind),
                        "no-namespace",
                      )
                        ? "read"
                        : "unadmitted",
                  });
              if (ours !== expected) {
                disagreements.push(
                  `${version} {${namespace}}${local}: ${ours}, expected ${expected}`,
                );
              }
            }
          }
        }

        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.provide(NodeServices.layer)),
  );
});

/**
 * Write a response-processing template that holds one element of a governed kind: `qti-null` as
 * the expression `qti-set-outcome-value` sets, any other as a rule of its own, with ASI's
 * namespace bound to `q`.
 *
 * @param kind - The element's kind, `qti-null` or a `qti-exit-*` rule.
 * @param written - The element as written.
 * @returns The document.
 */
const governedDocument = (kind: string, written: string): string =>
  `<qti-response-processing xmlns="${asi}" xmlns:q="${asi}" xmlns:xsi="${xsiNamespace}">${
    kind === "qti-null"
      ? `<qti-set-outcome-value identifier="SCORE">${written}</qti-set-outcome-value>`
      : written
  }</qti-response-processing>\n`;

/**
 * The attribute verdicts libxml2's messages give one document: the attributes it says are
 * required but missing, and those it says are not allowed.
 */
interface AttributeVerdicts {
  readonly missing: ReadonlySet<string>;
  readonly unallowed: ReadonlySet<string>;
}

/**
 * Read libxml2's attribute verdicts from its messages.
 *
 * @param verdict - Its verdict on one document.
 * @returns The two sets of names.
 */
const attributeVerdictsOf = (verdict: XsdVerdict | undefined): AttributeVerdicts => {
  const messages = verdict?._tag === "Invalid" ? verdict.messages.map(({ text }) => text) : [];
  const named = (pattern: RegExp) =>
    new Set(
      messages.flatMap((text) =>
        Option.toArray(Option.fromNullishOr(pattern.exec(text)?.groups?.["name"])),
      ),
    );

  return {
    missing: named(/The attribute '(?<name>[^']+)' is required but missing/u),
    unallowed: named(/The attribute '(?<name>[^']+)' is not allowed/u),
  };
};

/**
 * Whether two sets of names hold the same names.
 *
 * @param left - One set.
 * @param right - The other.
 * @returns Whether each holds every name of the other.
 */
const sameNames = (left: ReadonlySet<string>, right: ReadonlySet<string>): boolean =>
  left.size === right.size && [...left].every((name) => right.has(name));

/**
 * The kinds an `xsi:type` gives the 41 attribute-only extensions of `EmptyPrimitiveTypeDType` to
 * (spec reading 84), each in a response-processing template ({@link governedDocument}).
 */
const governedKinds = ["qti-null", "qti-exit-response"] as const;

describe("an element under its governing type (spec reading 84)", () => {
  it.effect(
    "reads qti-null typed VariableDType and qti-exit-response typed TrackDType under their types: identifier and src admitted and required, and xmllint agrees on every case",
    () =>
      // Oracle: XML Schema 1.0 Part 1 §3.3.4, Element Locally Valid (Element), clause 5.2.1 (the
      // actual type definition governs), as the cases' verdicts; libxml2 over the ASI XSD as a
      // control. The required check is AL3's own: the governor's required positions against the
      // element's folded attrs.
      // Bound: the 5 cases in the 2 versions.
      Effect.gen(function* briefCases() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("governed-type-");
        const oracle = yield* writeXsdOracle(directory);
        const cache = yield* xsdDirectory;
        const cases = [
          ["qti-null", '<qti-null xsi:type="q:VariableDType" identifier="SCORE"/>', "accepted"],
          ["qti-null", '<qti-null xsi:type="q:VariableDType"/>', "missing identifier"],
          ["qti-null", '<qti-null identifier="SCORE"/>', "unadmitted"],
          ["qti-exit-response", '<qti-exit-response xsi:type="q:TrackDType"/>', "missing src"],
          [
            "qti-exit-response",
            '<qti-exit-response xsi:type="q:TrackDType" src="a.vtt"/>',
            "accepted",
          ],
        ] as const;
        const disagreements: string[] = [];
        for (const version of schemaVersions) {
          const files = cases.map((_, at) => `${directory}/${version}-${at}.xml`);
          for (const [at, [kind, written]] of cases.entries()) {
            yield* fs.writeFileString(files[at] ?? "", governedDocument(kind, written));
          }

          const verdicts = yield* xmllintValidate({
            catalog: oracle.catalog,
            paths: files,
            schema: `${cache}/${version === "3.0.0" ? "imsqti_asiv3p0_v1p0.xsd" : "imsqti_asiv3p0p1_v1p0.xsd"}`,
          });
          for (const [at, [kind, written, expected]] of cases.entries()) {
            const bytes = new TextEncoder().encode(governedDocument(kind, written));
            const result = yield* Effect.result(reread(bytes, version));
            const ours = yield* Result.match(result, {
              onFailure: (failure) =>
                Effect.succeed(
                  failure instanceof UnmodeledVocabulary ? failure.reason : failure._tag,
                ),
              onSuccess: (tree) =>
                Effect.map(
                  Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar)))),
                  (rows) => {
                    const node = rows.nodes.find((row) => row.kind === kind);
                    if (node === undefined) {
                      return "no element";
                    }

                    const missing = admittedOf(
                      grammar.attributes,
                      grammar.kinds.attributeName,
                      version,
                      kind,
                      node.governs,
                    ).filter(
                      ({ position, use }) => use === "required" && !node.attrs.has(position),
                    );

                    return missing.length === 0
                      ? "accepted"
                      : `missing ${missing.map(({ name }) => name).join(" ")}`;
                  },
                ),
            });
            const said = verdicts[at];
            const named = attributeVerdictsOf(said);
            let xmllint = `missing ${[...named.missing].join(" ")}`;
            if (said?._tag === "Valid") {
              xmllint = "accepted";
            } else if (named.unallowed.size > 0) {
              xmllint = "unadmitted";
            }

            if (ours !== expected || xmllint !== expected) {
              disagreements.push(
                `${version} ${written}: shred and AL3 ${ours}, xmllint ${xmllint}, expected ${expected}`,
              );
            }
          }
        }

        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    120_000,
  );

  it.effect(
    "requires exactly the governing type's required attributes and admits exactly its declared ones on every governor of qti-null and qti-exit-response, and xmllint agrees but where reading 90 follows the element's name: every governor in both versions",
    () =>
      // Oracle: libxml2 over the ASI XSD, a second implementation of XML Schema's §3.3.4 clause
      // 5.2.1 and Element Locally Valid (Complex Type) clauses 2 and 4: its "is required but
      // missing" and "is not allowed" names against shred's admission and AL3's required set under
      // each governor. Where the element's kind is one spec reading 90 covers, an undeclared name
      // in no namespace that the type's attribute wildcard admits is refused by the reading, which
      // follows the element's name (reading 84), and libxml2's admission of it is that reading's
      // departure from the XSD.
      // Bound: every governor of the 2 kinds in the 2 versions; each with no attribute but its
      // xsi:type, each declared name in no namespace alone, and 3 names other governors declare.
      Effect.gen(function* governedBox() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("governed-box-");
        const oracle = yield* writeXsdOracle(directory);
        const cache = yield* xsdDirectory;
        const covered = coveredBy(grammar.kinds);
        const disagreements: string[] = [];
        let governors = 0;
        for (const version of schemaVersions) {
          const cases: {
            readonly expect: string;
            readonly file: string;
            readonly kind: string;
            readonly name: string;
            readonly text: string;
            readonly type: string;
          }[] = [];
          for (const kind of governedKinds) {
            const types = grammar.attributes.governor.rows.filter(
              (row) => row.version === version && row.kind === kind,
            );
            const declaredBy = new Map(
              types.map(({ governs }) => [
                governs,
                typeAttributeDeclarations
                  .filter(({ owner, versions }) => owner === governs && versions.includes(version))
                  .map(({ name }) => name)
                  .filter((name) => !name.includes(":")),
              ]),
            );
            const everyName = [...new Set([...declaredBy.values()].flat())].toSorted();
            for (const { governs } of types) {
              governors += 1;
              const local = governs.slice(governs.indexOf("}") + 1);
              const own = declaredBy.get(governs) ?? [];
              const typed = (attribute: string) =>
                governedDocument(kind, `<${kind} xsi:type="q:${local}"${attribute}/>`);
              const push = (name: string, expect: string, attribute: string) => {
                const at = cases.length;
                cases.push({
                  expect,
                  file: `${directory}/${version}-${at}.xml`,
                  kind,
                  name,
                  text: typed(attribute),
                  type: governs,
                });
              };
              push("", "required", "");
              for (const name of [
                ...own,
                ...everyName.filter((held) => !own.includes(held)).slice(0, 3),
              ]) {
                push(name, "admission", ` ${name}="x"`);
              }
            }
          }

          for (const { file, text } of cases) {
            yield* fs.writeFileString(file, text);
          }

          const verdicts = yield* xmllintValidate({
            catalog: oracle.catalog,
            paths: cases.map(({ file }) => file),
            schema: `${cache}/${version === "3.0.0" ? "imsqti_asiv3p0_v1p0.xsd" : "imsqti_asiv3p0p1_v1p0.xsd"}`,
          });
          for (const [at, { expect, kind, name, text, type }] of cases.entries()) {
            const said = attributeVerdictsOf(verdicts[at]);
            const where = `${version} ${kind} ${type} ${name}`;
            if (expect === "required") {
              const requires = new Set(
                admittedOf(grammar.attributes, grammar.kinds.attributeName, version, kind, type)
                  .filter(({ use }) => use === "required")
                  .map(({ name: held }) => held),
              );
              if (!sameNames(requires, said.missing)) {
                disagreements.push(
                  `${where}: Required ${[...requires].join(" ")}, xmllint ${[...said.missing].join(" ")}`,
                );
              }

              continue;
            }

            const result = yield* Effect.result(reread(new TextEncoder().encode(text), version));
            const refused =
              Result.isFailure(result) &&
              result.failure instanceof UnmodeledVocabulary &&
              result.failure.reason === "unadmitted";
            const declared = typeAttributeDeclarations.some(
              ({ name: held, owner, versions }) =>
                owner === type && held === name && versions.includes(version),
            );
            const wildcardAdmits = typeAttributeWildcards.some(
              ({ namespace, owner, versions }) =>
                owner === type && versions.includes(version) && namespace !== "##other",
            );
            const departs = covered(version, kind) && !declared && wildcardAdmits;
            const agrees = departs
              ? refused && !said.unallowed.has(name)
              : refused === said.unallowed.has(name);
            if (!agrees) {
              disagreements.push(
                `${where}: shred ${refused ? "refuses" : "admits"}, xmllint ${said.unallowed.has(name) ? "refuses" : "admits"}`,
              );
            }
          }
        }

        assert.isAbove(governors, 0);
        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    300_000,
  );
});

/**
 * The ways an element no global declaration names stands under a `strict` wildcard, each a named
 * arm of spec reading 81's box: an `xsi:type` naming a built-in, `xs:anyType`, or a simple type of
 * the document's own schema set, each of which XML Schema assesses the element against (Part 1,
 * §3.3.4 clause 1.2); and an `xsi:type` naming a type of a set the document does not use, a type no
 * pinned schema defines, a QName whose prefix is unbound, or no `xsi:type` at all, each of which
 * leaves the element with no type and no declaration (§3.10.4 clause 2).
 */
const strictArms = [
  "built-in type",
  "xs:anyType",
  "type of the set",
  "type of another set",
  "unknown type",
  "unbound prefix",
  "no xsi:type",
] as const;

/**
 * An arm of {@link strictArms}.
 */
type StrictArm = (typeof strictArms)[number];

/**
 * The arms XML Schema assesses the element in, so its document is valid there.
 */
const assessedArms: ReadonlySet<StrictArm> = new Set([
  "built-in type",
  "xs:anyType",
  "type of the set",
]);

/**
 * The refusal each arm XML Schema does not assess the element in meets, by
 * `UnmodeledVocabulary`'s reason: a value that is no QName in scope is `type-unresolved`, and an
 * element no declaration and no type of its set assesses is `strict-undeclared`, an `xsi:type`
 * naming no pinned type among them (§3.3.4 clause 1.2.1.2.3).
 */
const strictRefusals: Readonly<Partial<Record<StrictArm, string>>> = {
  "no xsi:type": "strict-undeclared",
  "type of another set": "strict-undeclared",
  "unbound prefix": "type-unresolved",
  "unknown type": "strict-undeclared",
};

/**
 * The `strict` wildcards of the box: `qti-companion-materials-info` in an item, whose schema set is
 * the ASI XSD's, and a file's metadata in a manifest, whose set is the content-packaging XSD's;
 * each with a simple type of its own set and one of the other's, the root XSD of each version, and
 * the document around the wildcard's child.
 */
const strictParents = [
  {
    document: (child: string) =>
      `<qti-assessment-item xmlns="${asi}" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:q="${asi}" xmlns:d="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-companion-materials-info>${child}</qti-companion-materials-info></qti-assessment-item>\n`,
    name: "qti-companion-materials-info",
    other: "d:ExtensionString.Type",
    own: "q:IdentifierDType",
    roots: { "3.0.0": "imsqti_asiv3p0_v1p0.xsd", "3.0.1": "imsqti_asiv3p0p1_v1p0.xsd" },
  },
  {
    document: (child: string, version: Composed["version"]) =>
      `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:q="${asi}" xmlns:d="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion></metadata><organizations/><resources><resource identifier="R" type="webcontent" href="a.xml"><file href="a.xml"><metadata>${child}</metadata></file></resource></resources></manifest>\n`,
    name: "cp:file metadata",
    other: "q:IdentifierDType",
    own: "d:ExtensionString.Type",
    roots: {
      "3.0.0": "imsqtiv3p0_imscpv1p2_v1p0.xsd",
      "3.0.1": "imsqtiv3p0p1_imscpv1p2_v1p0.xsd",
    },
  },
] as const;

/**
 * Write the wildcard's child of an arm: an element `f:x` in a namespace no schema names.
 *
 * @param arm - The arm.
 * @param parent - The wildcard's parent, which gives its own set's type and the other's.
 * @returns The child as written.
 */
const strictChild = (arm: StrictArm, parent: (typeof strictParents)[number]): string => {
  switch (arm) {
    case "built-in type": {
      return `<f:x xsi:type="xs:string">a</f:x>`;
    }
    case "xs:anyType": {
      return `<f:x xsi:type="xs:anyType"><f:y/></f:x>`;
    }
    case "type of the set": {
      return `<f:x xsi:type="${parent.own}">a</f:x>`;
    }
    case "type of another set": {
      return `<f:x xsi:type="${parent.other}">a</f:x>`;
    }
    case "unknown type": {
      return `<f:x xsi:type="f:NoSuchType">a</f:x>`;
    }
    case "unbound prefix": {
      return `<f:x xsi:type="zz:T">a</f:x>`;
    }
    case "no xsi:type": {
      return `<f:x>a</f:x>`;
    }
    default: {
      return arm satisfies never;
    }
  }
};

describe("a strict wildcard's undeclared element (spec reading 81)", () => {
  it.effect(
    "stands exactly when its xsi:type names a built-in or a type of its document's schema set, and xmllint agrees wherever libxml2 reads XML Schema's clause 1.2: every arm under both strict wildcards in both versions",
    () =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 1 §3.10.1 ("there must be a
      // top-level declaration for the item available, or the item must have an xsi:type"),
      // §3.3.4 clause 1.2 and §3.10.4 clause 2, as the arms' verdicts (`assessedArms`,
      // `strictRefusals`); and libxml2 over each document's own root XSD as a control. libxml2
      // 2.9.13 refuses an undeclared element under a strict wildcard before it reads xsi:type,
      // which XML Schema assesses the element by, so on the assessed arms xmllint may refuse with
      // "demanded by the strict wildcard" alone, and that departure is recorded against the reading.
      // Bound: the 7 arms under the 2 wildcards in the 2 versions, 28 documents, exhausted.
      Effect.gen(function* strictBox() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("strict-wildcard-");
        const oracle = yield* writeXsdOracle(directory);
        const cache = yield* xsdDirectory;
        const disagreements: string[] = [];
        let compared = 0;
        for (const parent of strictParents) {
          for (const version of schemaVersions) {
            const cases = strictArms.map((arm) => ({
              arm,
              file: `${directory}/${parent.name.replaceAll(/\W/gu, "-")}-${version}-${arm.replaceAll(/\W/gu, "-")}.xml`,
              text: parent.document(strictChild(arm, parent), version),
            }));
            for (const { file, text } of cases) {
              yield* fs.writeFileString(file, text);
            }

            const verdicts = yield* xmllintValidate({
              catalog: oracle.catalog,
              paths: cases.map(({ file }) => file),
              schema: `${cache}/${parent.roots[version]}`,
            });
            for (const [at, { arm, text }] of cases.entries()) {
              compared += 1;
              const where = `${parent.name} ${version} ${arm}`;
              const result = yield* Effect.result(reread(new TextEncoder().encode(text), version));
              const reason = Result.match(result, {
                onFailure: (failure) =>
                  failure instanceof UnmodeledVocabulary ? failure.reason : failure._tag,
                onSuccess: () => "accepted",
              });
              const expected = strictRefusals[arm] ?? "accepted";
              if (reason !== expected) {
                disagreements.push(`${where}: shred ${reason}, the specification ${expected}`);
              }

              const verdict = verdicts[at];
              const departure =
                verdict?._tag === "Invalid" &&
                verdict.messages.length === 1 &&
                verdict.messages.every(({ text: said }) =>
                  said.includes("demanded by the strict wildcard"),
                );
              const agrees =
                verdict?._tag === (assessedArms.has(arm) ? "Valid" : "Invalid") ||
                (assessedArms.has(arm) && departure);
              if (!agrees) {
                disagreements.push(
                  `${where}: xmllint ${verdict?._tag ?? "gave no verdict"} ${Formatter.format(verdict)}`,
                );
              }
            }
          }
        }

        assert.strictEqual(compared, 28);
        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    120_000,
  );
});

/**
 * The roots of spec reading 6 the box tries under each `strict` `##other` wildcard: the content
 * package's manifest, valid against its declaration, and an item, each in a namespace of its own
 * and written whole, so that where a wildcard finds its declaration XML Schema assesses it valid.
 */
const heldRootArms = [
  {
    arm: "cp:manifest",
    child: (version: Composed["version"]) =>
      `<c:manifest xmlns:c="${cpNamespace}" identifier="N"><c:metadata><c:schema>QTI Package</c:schema><c:schemaversion>${version}</c:schemaversion></c:metadata><c:organizations/><c:resources/></c:manifest>`,
    vocabulary: "cp",
  },
  {
    arm: "qti-assessment-item",
    child: () =>
      `<r:qti-assessment-item xmlns:r="${asi}" identifier="i" title="t" adaptive="false" time-dependent="false"/>`,
    vocabulary: "asi",
  },
] as const;

/**
 * The three `strict` `##other` wildcards of the box, each with its own namespace's vocabulary, the
 * vocabularies its documents' schema set declares globals of (spec reading 81), and its document:
 * `qti-companion-materials-info` in an item, a file's metadata in a manifest, and
 * `drd:accessForAllResource`'s `grpStrict.any` inside that metadata.
 */
const heldRootParents = [
  {
    document: strictParents[0].document,
    name: strictParents[0].name,
    own: "asi",
    roots: strictParents[0].roots,
    set: ["asi", "mathml", "ssml", "xi"],
  },
  {
    document: strictParents[1].document,
    name: strictParents[1].name,
    own: "cp",
    roots: strictParents[1].roots,
    set: ["cp", "cpx", "csmd", "drd", "lom", "qmd"],
  },
  {
    document: (child: string, version: Composed["version"]) =>
      strictParents[1].document(
        `<d:accessForAllResource>${child}</d:accessForAllResource>`,
        version,
      ),
    name: "drd:accessForAllResource",
    own: "drd",
    roots: strictParents[1].roots,
    set: ["cp", "cpx", "csmd", "drd", "lom", "qmd"],
  },
] as const;

/**
 * The verdict XML Schema and spec reading 6 give a root under a `strict` `##other` wildcard: in
 * the wildcard's own namespace it is no element the wildcard allows (§3.10.4 clause 1), which shred
 * finds under no name (`unnamed`); where the wildcard's documents' schema set declares it, the
 * wildcard finds that declaration (§3.10.4 clause 2, §3.3.4 clause 1.1.1.3.2) and reading 6 keeps
 * the root as foreign content, unrefused; and elsewhere it has no declaration and no `xsi:type`, so
 * it is `strict-undeclared`.
 *
 * @param parent - The wildcard's parent.
 * @param root - The root.
 * @returns `accepted`, or the refusal's reason.
 */
const heldRootVerdict = (
  parent: (typeof heldRootParents)[number],
  root: (typeof heldRootArms)[number],
): string => {
  if (parent.own === root.vocabulary) {
    return "unnamed";
  }

  return parent.set.some((held) => held === root.vocabulary) ? "accepted" : "strict-undeclared";
};

/**
 * The grammar's tables the oracle judges a folded document by.
 */
const oracleLaws = lawsOf(grammar);

describe("a reading 6 root under a strict wildcard (C13)", () => {
  it.effect(
    "keeps a root the wildcard's schema set declares as foreign content with no governing type and no Strictly held breach, refuses every other, and xmllint agrees: every root under the three strict wildcards in both versions",
    () =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 1 §3.10.4 clauses 1 and 2 and
      // §3.3.4 clause 1.1.1.3.2, with reading 6 (the root is kept foreign, not refused) and reading
      // 81's schema sets, as `heldRootVerdict`; libxml2 over each document's root XSD as a control,
      // which assesses the found manifest against its declaration and refuses every other arm.
      // Bound: the 2 roots under the 3 wildcards in the 2 versions, 12 documents, exhausted.
      Effect.gen(function* heldRoots() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("held-root-");
        const oracle = yield* writeXsdOracle(directory);
        const cache = yield* xsdDirectory;
        const disagreements: string[] = [];
        let accepted = 0;
        let compared = 0;
        for (const parent of heldRootParents) {
          for (const version of schemaVersions) {
            const cases = heldRootArms.map((root) => ({
              file: `${directory}/${parent.name.replaceAll(/\W/gu, "-")}-${version}-${root.arm}.xml`,
              root,
              text: parent.document(root.child(version), version),
            }));
            for (const { file, text } of cases) {
              yield* fs.writeFileString(file, text);
            }

            const verdicts = yield* xmllintValidate({
              catalog: oracle.catalog,
              paths: cases.map(({ file }) => file),
              schema: `${cache}/${parent.roots[version]}`,
            });
            for (const [at, { root, text }] of cases.entries()) {
              compared += 1;
              const where = `${parent.name} ${version} ${root.arm}`;
              const expected = heldRootVerdict(parent, root);
              const result = yield* Effect.result(reread(new TextEncoder().encode(text), version));
              if (Result.isFailure(result)) {
                const reason =
                  result.failure instanceof UnmodeledVocabulary
                    ? result.failure.reason
                    : result.failure._tag;
                if (reason !== expected) {
                  disagreements.push(`${where}: shred ${reason}, the specification ${expected}`);
                }
              } else {
                accepted += 1;
                const rows = yield* Effect.orDie(
                  Effect.fromResult(fold(result.success, idOf, foldGrammarOf(grammar))),
                );
                const held = rows.nodes.filter(
                  (node) => node.kind === foreignKinds.other && node.parentKind === parent.name,
                );
                const breaches = documentBreaches("imsmanifest.xml", rows, oracleLaws).map(
                  ({ law }) => law,
                );
                if (
                  expected !== "accepted" ||
                  held.length !== 1 ||
                  held.some(({ governs }) => governs !== none) ||
                  breaches.length > 0
                ) {
                  disagreements.push(
                    `${where}: shred keeps ${String(held.length)} foreign roots there, the oracle breaks ${breaches.join(", ") || "nothing"}, the specification ${expected}`,
                  );
                }
              }

              const said = verdicts[at];
              if (said?._tag !== (expected === "accepted" ? "Valid" : "Invalid")) {
                disagreements.push(`${where}: xmllint ${Formatter.format(said)}`);
              }
            }
          }
        }

        assert.strictEqual(compared, 12);
        assert.strictEqual(accepted, 2);
        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(XsdOracleLayer)),
    120_000,
  );
});

/**
 * Find the attributes of the first element of a kind in a tree, in document order.
 *
 * @param tree - The tree.
 * @param kind - The element's kind.
 * @returns Its attributes; none when the tree holds no element of the kind.
 */
const attributesAt = (
  tree: XdmDocument<Composed>,
  kind: string,
): readonly XdmAttribute<Composed>[] => {
  const stack: XdmChild<Composed>[] = [tree.root];
  for (let node = stack.shift(); node !== undefined; node = stack.shift()) {
    if (node._tag === "element" && node.kind === kind) {
      return node.attributes;
    }

    if ("children" in node) {
      stack.push(...node.children);
    }
  }

  return [];
};

describe("XLink's attributes (C30, spec reading 81)", () => {
  it.effect(
    "reads xl:href on a kind of the content-packaging set as XLink's closed global under its written prefix, and on an ASI kind, whose set imports no XLink, as a foreign name: both versions",
    () =>
      // Oracle: the specification as a checker: XLink's ten globals are declared only in the
      // schema set the content-packaging extension imports them into (`cpext/` XSDs line 10,
      // reading 81), where a lax `##other` attribute wildcard validates the attribute against its
      // declaration, so it is that declaration's closed handle; the ASI XSDs import no XLink, so
      // there the same attribute has no declaration and is a foreign name (XML Schema 1.0 Part 1,
      // §3.10.4, §3.4.4 clause 3.1).
      // Bound: one manifest's lom:title and one item's qti-custom-operator, in the 2 versions.
      Effect.gen(function* xlinkNames() {
        for (const version of schemaVersions) {
          const manifest = yield* reread(
            new TextEncoder().encode(
              `<manifest xmlns="${cpNamespace}" xmlns:xl="${xlinkNamespace}" xmlns:lom="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion><lom:lom><lom:general><lom:title xl:type="simple" xl:href="a.xml"><lom:string language="en">T</lom:string></lom:title></lom:general></lom:lom></metadata><organizations/><resources/></manifest>`,
            ),
            version,
          );
          const item = yield* reread(
            new TextEncoder().encode(
              `<qti-assessment-item xmlns="${asi}" xmlns:xl="${xlinkNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-response-processing><qti-set-outcome-value identifier="SCORE"><qti-custom-operator xl:href="a.xml"><qti-base-value base-type="integer">1</qti-base-value></qti-custom-operator></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`,
            ),
            version,
          );

          assert.deepStrictEqual(
            attributesAt(manifest, "lom:title").map(({ name }) => name),
            [
              { _tag: "closed", handle: "xlink:type", prefix: "xl" },
              { _tag: "closed", handle: "xlink:href", prefix: "xl" },
            ],
            `lom:title in ${version}`,
          );
          assert.deepStrictEqual(
            attributesAt(item, "qti-custom-operator").map(({ name }) => name),
            [{ _tag: "foreign", local: "href", prefix: "xl", uri: xlinkNamespace }],
            `qti-custom-operator in ${version}`,
          );
        }
      }),
  );
});

describe("a MathML element where the parent admits none (p6n-6)", () => {
  it.effect(
    "refuses m:annotation, m:sep and m:math directly in m:annotation-xml as mathml-foreign, and a MathML name no kind takes as unnamed: both versions",
    () =>
      // Oracle: the specification as a checker: MathML 3's `annotation-xml` content is `anyElement`
      // outside MathML's own namespace, or MathML content its own models admit, so an `m:annotation`,
      // `m:sep` or `m:math` is a MathML kind `m:annotation-xml` does not admit there (a kind the
      // vocabulary reads), while `m:notanelement` is no MathML kind at all (MathML 3 RelaxNG,
      // `mathml3-common.rnc` lines 15 and 61).
      // Bound: three MathML kinds and one unnamed MathML name, in the 2 versions.
      Effect.gen(function* mathmlNotAdmitted() {
        const mathml = "http://www.w3.org/1998/Math/MathML";
        const refusalOf = (version: Composed["version"], child: string) =>
          Effect.flip(
            reread(
              new TextEncoder().encode(
                `<qti-assessment-item xmlns="${asi}" xmlns:m="${mathml}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p><m:math><m:semantics><m:mi>x</m:mi><m:annotation-xml encoding="x">${child}</m:annotation-xml></m:semantics></m:math></p></qti-item-body></qti-assessment-item>`,
              ),
              version,
            ),
          );

        for (const version of schemaVersions) {
          for (const [local, child] of [
            ["annotation", '<m:annotation encoding="text/plain">y</m:annotation>'],
            ["sep", "<m:sep/>"],
            ["math", "<m:math/>"],
          ] as const) {
            assert.deepStrictEqual(
              yield* refusalOf(version, child),
              new UnmodeledVocabulary({
                kind: "element",
                name: `m:${local}`,
                parent: Option.some("m:annotation-xml"),
                reason: "mathml-foreign",
              }),
              `m:${local} in ${version}`,
            );
          }
          assert.deepStrictEqual(
            yield* refusalOf(version, "<m:notanelement/>"),
            new UnmodeledVocabulary({
              kind: "element",
              name: "m:notanelement",
              parent: Option.some("m:annotation-xml"),
              reason: "unnamed",
            }),
            `m:notanelement in ${version}`,
          );
        }
      }),
  );
});

describe("an SSML role item whose prefix nothing binds (p7n-6.1)", () => {
  it.effect(
    "refuses an ssml:w or ssml:token role item whose prefix no declaration in scope binds as role-unresolved, and reads a bound prefix, xml:, an unprefixed item and a role on any other element: both versions",
    () =>
      // Oracle: the specification as a checker: SSML's `role` on `token` and `w` is a list of
      // `xsd:QName` (`ssml/synthesis-nonamespace.xsd` line 308), a QName's prefix must resolve in
      // the namespace declarations in scope, and `xml` is bound by definition (XML Schema 1.0 Part
      // 2, §3.2.18; Namespaces in XML 1.0, §3; spec reading 83). An unprefixed item takes the
      // default namespace and is never unbound.
      // Bound: two kinds and five role values, in the 2 versions.
      Effect.gen(function* roleItems() {
        const ssml = "http://www.w3.org/2001/10/synthesis";
        const read = (version: Composed["version"], tag: string, role: string, declaration = "") =>
          reread(
            new TextEncoder().encode(
              `<qti-assessment-item xmlns="${asi}" xmlns:ssml="${ssml}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p><ssml:speak version="1.1" xml:lang="en"${declaration}><ssml:${tag} role="${role}">x</ssml:${tag}></ssml:speak></p></qti-item-body></qti-assessment-item>`,
            ),
            version,
          );

        for (const version of schemaVersions) {
          for (const tag of ["w", "token"]) {
            assert.deepStrictEqual(
              yield* Effect.flip(read(version, tag, "x:noun")),
              new UnmodeledVocabulary({
                kind: "attribute",
                name: "role",
                parent: Option.some(`ssml:${tag}`),
                reason: "role-unresolved",
              }),
              `unbound x: on ${tag} in ${version}`,
            );
            assert.deepStrictEqual(
              yield* Effect.flip(read(version, tag, "noun y:verb")),
              new UnmodeledVocabulary({
                kind: "attribute",
                name: "role",
                parent: Option.some(`ssml:${tag}`),
                reason: "role-unresolved",
              }),
              `unbound y: after a bare item on ${tag} in ${version}`,
            );
            for (const [role, declaration] of [
              ["x:noun", ' xmlns:x="urn:x"'],
              ["noun xml:lang", ""],
              ["noun", ""],
              ["  noun \n verb  ", ""],
            ] as const) {
              yield* read(version, tag, role, declaration);
            }
          }
        }
      }),
  );
});
