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
import { composed } from "#pantry/grammar/compose.ts";
import { foreignKinds, isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import { assemble } from "#pantry/model/assemble.ts";
import { namesOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { NotQti3, shred, UnmodeledVocabulary, versionOf } from "#pantry/model/shred.ts";
import { toXmlDocument, unshred } from "#pantry/model/unshred.ts";
import { flatten } from "#pantry/model/xdm.ts";
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
import { xmlnsNamespace, xsiNamespace } from "#pantry/vocab/namespaces.ts";
import { OracleLayer, xmllintC14n } from "#pantry/xml/oracle.ts";

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
                ...situations,
              ],
              { cases: 400, sense: notesOnly },
            ),
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
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
    // over a sample of the round trips above; documents with unexpanded entity references, which
    // xmllint refuses without their declarations, are set aside.
    // Bound: 30 generated trees.
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
          draw: drawn(documents),
          kept: [],
          literal: Formatter.format,
          runs: 30,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "model/unshred-shred-xmllint",
        },
        ({ document }, c) =>
          Effect.gen(function* xmllintRoundTrip() {
            const features = featuresOf(document);
            yield* c.assume(!features.has("entityRef") && !features.has("doctype"));
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
      // malformed `data-` name, a namespace read through an entity, and a document not in XML 1.x.
      // Bound: the generator's drawn bounds, one name added to a valid tree a case.
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

              const variant = c.draw(element(unmodeled));
              c.note(variant);

              const target = c.draw(element(owners));
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
                  yield* c.assume(
                    !shredGrammar.admitsChild(version, owner.kind, "foreign-element"),
                  );

                  const edited = editElement(document, target, (at) => ({
                    ...at,
                    children: [
                      {
                        _tag: "foreign-element",
                        attributes: [],
                        children: [],
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
                case "unadmitted attribute": {
                  yield* c.assume(!shredGrammar.admitted(version, owner.kind, "foreign"));

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
    "resolves an xsi:type against the bindings in scope, refuses one that names no type, and leaves a foreign element's unread, every value of the box",
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

              const handle = `{${namespace}}${parts["local"] ?? ""}`;

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

  it.effect(
    "leaves the xsi:type of a foreign element under a lax wildcard unread (readings 50 and 60)",
    () =>
      Effect.gen(function* laxType() {
        const lom = "http://ltsc.ieee.org/xsd/LOM";
        const bytes = new TextEncoder().encode(
          `<lom xmlns="${lom}" xmlns:xsi="${xsiNamespace}"><zz:x xmlns:zz="urn:z" xsi:type="q:Unbound"/></lom>`,
        );
        const tree = yield* reread(bytes, "3.0.1");
        const [child] = tree.root.children;

        assert.strictEqual(child?._tag, foreignKinds.other);
        assert.strictEqual(tree.root.governs, grammar.xsi.declaredType("3.0.1", "lom:lom"));
      }),
  );
});
