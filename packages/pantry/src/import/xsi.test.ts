/**
 * The `xsi:type`, `xsi:nil` and `xsi:noNamespaceSchemaLocation` judge of `xsi.ts`. Each case reads
 * a document from an inline literal with `readXml` and judges it with the asi 3.0.1 tables. A type
 * of XML Schema's own is named, since the Recommendation names it; a type of a schema document is
 * found by property from the tables of `seed/xsi.ts`, so a table that moves a name moves no case.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result, Schema } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { ImportRule } from "#pantry/import/refusal.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { validValue } from "#pantry/import/xsi-types.ts";
import { declaredTypes, judgeTree, judgeXsi } from "#pantry/import/xsi.ts";
import type { ProcessMode } from "#pantry/import/xsi.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type { TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
  declaredRoot,
  typeAttributeWildcard,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";

const asiNamespace = typeNamespaces.asi;

const xsNamespace = typeNamespaces.xs;

const xmlNamespace = typeNamespaces.xml;

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

const set: SchemaSetHandle = "asi";

const version: SchemaVersionHandle = "3.0.1";

/**
 * The namespace declarations every document of this file carries on its root: the asi namespace as
 * the default and as `qti`, XML Schema's, the instance namespace and a namespace nothing declares.
 */
const declarations = `xmlns="${asiNamespace}" xmlns:qti="${asiNamespace}" xmlns:xs="${xsNamespace}" xmlns:xsi="${xsiNamespace}" xmlns:ma="urn:test:ma"`;

const inBlock = (row: { readonly set: SchemaSetHandle; readonly version: SchemaVersionHandle }) =>
  row.set === set && row.version === version;

const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

const xs = (local: string): TypeKey => ({ local, namespace: xsNamespace });

/**
 * A type as `xsi:type` writes it in the documents of this file.
 */
const ref = (type: TypeKey): string =>
  "anonymous" in type
    ? "anonymous"
    : `${type.namespace === xsNamespace ? "xs" : "qti"}:${type.local}`;

const elementOf = (xml: string) =>
  readXml(new TextEncoder().encode(xml)).pipe(Effect.map((document) => document.root));

const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * The first element named `local` in document order.
 */
const find = (element: Element, local: string): Element | undefined => {
  if (element.local === local) {
    return element;
  }

  for (const child of elementChildren(element)) {
    const found = find(child, local);

    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};

const must = (element: Element, local: string): Element => {
  const found = find(element, local);

  if (found === undefined) {
    return assert.fail(`no element ${local}`);
  }

  return found;
};

/**
 * Every type name the derivation reaches from `start`, itself first.
 */
const lineage = (start: TypeKey): readonly TypeKey[] => {
  const found: TypeKey[] = [start];

  for (const current of found) {
    for (const row of typeDerivation.filter(inBlock)) {
      if (keyOf(row.type) === keyOf(current) && !found.some((t) => keyOf(t) === keyOf(row.base))) {
        found.push(row.base);
      }
    }
  }

  return found;
};

/**
 * The elements from the root to `target`, found by walking the content models, shortest first.
 */
const pathTo = (target: string): readonly string[] => {
  const root = declaredRoot.filter(inBlock).find((row) => row.local === "qti-assessment-item");

  if (root === undefined) {
    return assert.fail("no qti-assessment-item root");
  }

  const seen = new Set<string>([keyOf(root.type)]);
  let level = [{ path: [root.local], type: root.type }];

  while (level.length > 0) {
    const next: typeof level = [];

    for (const node of level) {
      for (const row of declaredChild.filter(inBlock)) {
        if (keyOf(row.parent) !== keyOf(node.type)) {
          continue;
        }

        const path = [...node.path, row.local];

        if (row.local === target) {
          return path;
        }

        if (!seen.has(keyOf(row.type))) {
          seen.add(keyOf(row.type));
          next.push({ path, type: row.type });
        }
      }
    }

    level = next;
  }

  return assert.fail(`no path to ${target}`);
};

/**
 * The type the tables declare for the last element of `path`, by walking them.
 */
const declaredAt = (path: readonly string[]): TypeKey => {
  const [first = "", ...rest] = path;
  const root = declaredRoot.filter(inBlock).find((row) => row.local === first);
  let type = root?.type;

  for (const local of rest) {
    const parent = type;
    const row = declaredChild
      .filter(inBlock)
      .find(
        (candidate) =>
          parent !== undefined &&
          keyOf(candidate.parent) === keyOf(parent) &&
          candidate.local === local,
      );

    type = row?.type;
  }

  return type ?? assert.fail(`no declaration at ${path.join("/")}`);
};

/**
 * `inner` wrapped in the elements of `parents`, the first carrying the declarations and
 * `rootAttributes`.
 */
const nest = (parents: readonly string[], inner: string, rootAttributes = ""): string => {
  let accumulated = inner;

  for (const [index, name] of [...parents.entries()].toReversed()) {
    const attributes = index === 0 ? ` ${declarations} ${rootAttributes}` : "";

    accumulated = `<${name}${attributes}>${accumulated}</${name}>`;
  }

  return accumulated;
};

/**
 * A document that holds `leaf` where the content models put the element `target`.
 */
const docAt = (target: string, leaf: string, rootAttributes = ""): string =>
  nest(pathTo(target).slice(0, -1), leaf, rootAttributes);

const kindOf = (element: Element): string =>
  element.namespace === asiNamespace ? element.local : "foreign";

/**
 * The process mode of every element of a document: `lax` below a `qti-custom-operator`, `none`
 * elsewhere.
 */
const operatorHosts = (root: Element): ((element: Element) => ProcessMode) => {
  const modes = new Map<Element, ProcessMode>();
  const visit = (element: Element, mode: ProcessMode): void => {
    modes.set(element, mode);

    for (const child of elementChildren(element)) {
      visit(child, mode === "none" && element.local === "qti-custom-operator" ? "lax" : mode);
    }
  };

  visit(root, "none");

  return (element) => modes.get(element) ?? "none";
};

const everywhere = (mode: ProcessMode) => (): (() => ProcessMode) => () => mode;

/**
 * The tree judgment of `xml`, `operatorHosts` giving the modes unless `modes` does.
 */
const judged = (
  xml: string,
  modes: (root: Element) => (element: Element) => ProcessMode = operatorHosts,
) =>
  elementOf(xml).pipe(
    Effect.map((root) => ({ result: judgeTree(root, set, version, kindOf, modes(root)), root })),
  );

const refusalOf = (result: Result.Result<unknown, ImportRefused>): ImportRefused | undefined =>
  Result.isFailure(result) ? result.failure : undefined;

/**
 * `"accepted"` or the rule the tree was refused under.
 */
const verdict = (xml: string, modes?: (root: Element) => (element: Element) => ProcessMode) =>
  judged(xml, modes).pipe(Effect.map(({ result }) => refusalOf(result)?.rule ?? "accepted"));

/**
 * The rows the judgment returns for the first element named `local`.
 */
const rowsFor = (xml: string, local: string) =>
  judged(xml).pipe(
    Effect.map(({ result, root }) => {
      if (Result.isFailure(result)) {
        return assert.fail(`refused under ${result.failure.rule}: ${result.failure.detail}`);
      }

      return result.success.get(must(root, local));
    }),
  );

/**
 * The attribute uses a type holds.
 */
const usesOf = (type: TypeKey) =>
  attributeUse.filter((row) => inBlock(row) && keyOf(row.type) === keyOf(type));

const wildcardOf = (type: TypeKey) =>
  typeAttributeWildcard.find((row) => inBlock(row) && keyOf(row.type) === keyOf(type));

/**
 * Every complex type derived from `declared`.
 */
const derivedFrom = (declared: TypeKey): readonly TypeKey[] =>
  typeDerivation
    .filter(
      (row) =>
        inBlock(row) &&
        row.variety === "complex" &&
        keyOf(row.type) !== keyOf(declared) &&
        lineage(row.type).some((ancestor) => keyOf(ancestor) === keyOf(declared)),
    )
    .map((row) => row.type);

const noIds: ReadonlySet<string> = new Set<string>();

/**
 * A lexical value in `type`'s value space, or one outside it, found from a list of candidates.
 */
const sampleOf = (
  type: TypeKey,
  inside: boolean,
  ids: ReadonlySet<string> = noIds,
): string | undefined => {
  const candidates = inside
    ? ["1", "a", "true", "1.5", "en", "held"]
    : ["x y", "-1x", "!", "x", "", "2147483648x"];

  return candidates.find(
    (candidate) => (validValue(candidate, type, set, version, ids)._tag === "None") === inside,
  );
};

const sample = (type: TypeKey, inside: boolean): string =>
  sampleOf(type, inside) ??
  assert.fail(`no ${inside ? "valid" : "invalid"} sample for ${keyOf(type)}`);

const emptyDeclared = declaredAt(pathTo("qti-null"));

const emptyDerived = derivedFrom(emptyDeclared);

/**
 * An unqualified attribute use of `type`.
 */
const plainUses = (type: TypeKey) => usesOf(type).filter((use) => use.namespace === "");

const bareType = emptyDerived.find((type) => usesOf(type).every((use) => !use.required));

const requiringType = emptyDerived.find((type) => usesOf(type).some((use) => use.required));

/**
 * A type with exactly two uses, both required and unqualified, and no attribute wildcard.
 */
const twoUsesType = emptyDerived.find(
  (type) =>
    wildcardOf(type) === undefined &&
    usesOf(type).length === 2 &&
    plainUses(type).length === 2 &&
    usesOf(type).every((use) => use.required),
);

const isIdType = (type: TypeKey): boolean =>
  lineage(type).some((ancestor) => keyOf(ancestor) === keyOf(xs("ID")));

/**
 * A type with a `##any` `lax` attribute wildcard, no required use, an `xml:lang` use, an `id` use
 * of an ID type and an IDREF use.
 */
const wildcardType = emptyDerived.find((type) => {
  const wildcard = wildcardOf(type);
  const uses = usesOf(type);

  return (
    wildcard?.namespaces === "##any" &&
    wildcard.process === "lax" &&
    uses.every((use) => !use.required) &&
    uses.some((use) => use.namespace === xmlNamespace && use.local === "lang") &&
    uses.some((use) => use.namespace === "" && use.local === "id" && isIdType(use.attributeType)) &&
    uses.some((use) => use.namespace === "" && keyOf(use.attributeType) === keyOf(xs("IDREF")))
  );
});

const idrefUse = (type: TypeKey) =>
  usesOf(type).find(
    (use) => use.namespace === "" && keyOf(use.attributeType) === keyOf(xs("IDREF")),
  );

const typeOrFail = (type: TypeKey | undefined, what: string): TypeKey =>
  type ?? assert.fail(`the tables hold no ${what}`);

/**
 * `qti-null` carrying `xsi:type` of `type` and `attributes`, in the response processing.
 */
const nullDoc = (type: TypeKey, attributes = "", rootAttributes = ""): string =>
  docAt("qti-null", `<qti-null xsi:type="${ref(type)}" ${attributes}/>`, rootAttributes);

describe("the roster", () => {
  it("names xsi-type and xsi-nil", () => {
    assert.isTrue(Schema.is(ImportRule)("xsi-type"));
    assert.isTrue(Schema.is(ImportRule)("xsi-nil"));
  });
});

describe("declaredTypes", () => {
  it.effect("gives the root its global declaration and a child its particle's type", () =>
    Effect.gen(function* rootAndChild() {
      const path = pathTo("qti-prompt");
      const root = yield* elementOf(docAt("qti-prompt", "<qti-prompt/>"));
      const declared = declaredTypes(root, set, version, kindOf);
      const prompt = must(root, "qti-prompt");

      assert.strictEqual(
        keyOf(declared.get(root) ?? xs("none")),
        keyOf(declaredAt(path.slice(0, 1))),
      );
      assert.strictEqual(keyOf(declared.get(prompt) ?? xs("none")), keyOf(declaredAt(path)));
      assert.notStrictEqual(keyOf(declaredAt(path)), keyOf(declaredAt(path.slice(0, 1))));
    }),
  );

  it.effect("tells the same element under two parents apart", () =>
    Effect.gen(function* twoParents() {
      const feedback = [
        "qti-assessment-item",
        "qti-item-body",
        "qti-template-block",
        "qti-content-body",
        "qti-feedback-block",
        "qti-content-body",
      ];
      const rubric = [
        "qti-assessment-item",
        "qti-item-body",
        "qti-rubric-block",
        "qti-content-body",
        "qti-template-block",
        "qti-content-body",
      ];
      const innermost: (TypeKey | undefined)[] = [];

      for (const path of [feedback, rubric]) {
        const root = yield* elementOf(nest(path.slice(0, -1), `<${path.at(-1) ?? ""}/>`));
        const declared = declaredTypes(root, set, version, kindOf);
        let element = root;

        for (const [index, local] of path.entries()) {
          element = index === 0 ? root : must(element, local);

          const found = declared.get(element);

          assert.isDefined(found, path.slice(0, index + 1).join("/"));
          assert.strictEqual(
            keyOf(found ?? xs("none")),
            keyOf(declaredAt(path.slice(0, index + 1))),
          );
        }

        innermost.push(declared.get(element));
      }

      assert.notStrictEqual(keyOf(innermost[0] ?? xs("none")), keyOf(innermost[1] ?? xs("none")));
    }),
  );

  it.effect("gives a foreign element none and a typed global its global declaration", () =>
    Effect.gen(function* wildcardContent() {
      const root = yield* elementOf(
        docAt(
          "qti-custom-operator",
          "<qti-custom-operator><ma:ext/><qti-assessment-item/></qti-custom-operator>",
        ),
      );
      const declared = declaredTypes(root, set, version, kindOf);
      const operator = must(root, "qti-custom-operator");
      const global = must(operator, "qti-assessment-item");

      assert.isTrue(declared.has(operator));
      assert.isFalse(declared.has(must(operator, "ext")));
      assert.strictEqual(
        keyOf(declared.get(global) ?? xs("none")),
        keyOf(declaredAt(["qti-assessment-item"])),
      );
    }),
  );

  it.effect("gives an opaque global none: a foreign element a registry also declares", () =>
    Effect.gen(function* opaque() {
      const root = yield* elementOf(
        docAt(
          "qti-custom-operator",
          "<qti-custom-operator><qti-assessment-item/></qti-custom-operator>",
        ),
      );
      const operator = must(root, "qti-custom-operator");
      const declared = declaredTypes(root, set, version, (element) =>
        element === must(operator, "qti-assessment-item") ? "foreign" : kindOf(element),
      );

      assert.isFalse(declared.has(must(operator, "qti-assessment-item")));
    }),
  );
});

/**
 * A document with a `qti-minimum-length` of `xsi:type` `type` and text `value`.
 */
const lengthDoc = (type: string, value: string): string =>
  docAt(
    "qti-minimum-length",
    `<qti-minimum-length xsi:type="${type}">${value}</qti-minimum-length>`,
  );

/**
 * A document with a `qti-description` of `xsi:type` `type` and text `value`.
 */
const descriptionDoc = (type: string, value: string): string =>
  docAt("qti-description", `<qti-description xsi:type="${type}">${value}</qti-description>`);

/**
 * A `qti-description` of `xsi:type` `type` and text `value`, inside its companion materials.
 */
const describing = (type: string, value: string): string =>
  `<qti-companion-materials-info><qti-calculator><qti-description xsi:type="${type}">${value}</qti-description></qti-calculator></qti-companion-materials-info>`;

/**
 * An item whose root holds `body`.
 */
const itemDoc = (body: string, rootAttributes = ""): string =>
  nest(["qti-assessment-item"], body, rootAttributes);

const itemBody = (id: string): string => `<qti-item-body id="${id}"/>`;

describe("xsi:type on a QTI element", () => {
  it.effect("accepts the declared type, writing the row as written", () =>
    Effect.gen(function* declaredType() {
      const type = declaredAt(pathTo("qti-prompt"));
      const xml = docAt("qti-prompt", `<qti-prompt xsi:type=" ${ref(type)} "/>`);
      const found = yield* rowsFor(xml, "qti-prompt");

      assert.deepStrictEqual(found?.rows, [
        { local: "type", prefix: "xsi", value: ` ${ref(type)} ` },
      ]);
      assert.deepStrictEqual(found?.added, []);
      assert.strictEqual(found?.kind, "qti-prompt");
    }),
  );

  it.effect(
    "accepts a prefix an element declares itself, and an unprefixed name in the default namespace",
    () =>
      Effect.gen(function* boundHere() {
        const type = declaredAt(pathTo("qti-prompt"));

        assert.strictEqual(
          yield* verdict(
            docAt(
              "qti-prompt",
              `<qti-prompt xmlns:q2="${asiNamespace}" xsi:type="q2:${"local" in type ? type.local : ""}"/>`,
            ),
          ),
          "accepted",
        );
        assert.strictEqual(
          yield* verdict(
            docAt("qti-prompt", `<qti-prompt xsi:type="${"local" in type ? type.local : ""}"/>`),
          ),
          "accepted",
        );
      }),
  );

  it.effect(
    "refuses an unrelated resolved type, an unresolved one, an unbound prefix and a non-QName",
    () =>
      Effect.gen(function* refusals() {
        const type = declaredAt(pathTo("qti-prompt"));
        const name = "local" in type ? type.local : "";
        const unrelated = ref(emptyDeclared);

        assert.isFalse(lineage(emptyDeclared).some((ancestor) => keyOf(ancestor) === keyOf(type)));

        for (const value of [unrelated, "qti:NoSuchDType", `zz:${name}`, "1x"]) {
          assert.strictEqual(
            yield* verdict(docAt("qti-prompt", `<qti-prompt xsi:type="${value}"/>`)),
            "xsi-type",
            value,
          );
        }
      }),
  );

  it.effect("accepts a type derived from an empty declared type that needs no attribute", () =>
    Effect.gen(function* derivedBare() {
      const type = typeOrFail(bareType, "derived type with no required use");
      const found = yield* rowsFor(nullDoc(type), "qti-null");

      assert.strictEqual(found?.rows.length, 1);
      assert.deepStrictEqual(found?.added, []);
      assert.strictEqual(found?.kind, "qti-null");
    }),
  );

  it.effect("refuses a derived type whose required attribute the bare element lacks", () =>
    Effect.gen(function* derivedRequired() {
      const type = typeOrFail(requiringType, "derived type with a required use");

      assert.strictEqual(yield* verdict(nullDoc(type)), "xsi-type");
    }),
  );

  it.effect("judges the value of an integer element against the type it names", () =>
    Effect.gen(function* integerValue() {
      assert.strictEqual(yield* verdict(lengthDoc("xs:positiveInteger", "3")), "accepted");
      assert.strictEqual(yield* verdict(lengthDoc("xs:positiveInteger", "0")), "xsi-type");
      assert.strictEqual(yield* verdict(lengthDoc("xs:byte", "200")), "xsi-type");
      assert.strictEqual(yield* verdict(lengthDoc("xs:byte", "100")), "accepted");
    }),
  );

  it.effect("judges the value of a string element against the type it names", () =>
    Effect.gen(function* stringValue() {
      const coords = typeDerivation.find(
        (row) =>
          inBlock(row) &&
          "local" in row.type &&
          row.type.local === "CoordsDType" &&
          lineage(row.type).some((ancestor) => keyOf(ancestor) === keyOf(xs("normalizedString"))),
      );
      const coordsName = coords === undefined ? "" : ref(coords.type);

      assert.isDefined(coords);
      assert.strictEqual(yield* verdict(descriptionDoc("xs:NCName", "abc")), "accepted");
      assert.strictEqual(yield* verdict(descriptionDoc("xs:NCName", "a b")), "xsi-type");
      assert.strictEqual(yield* verdict(descriptionDoc(coordsName, "1,2,3")), "accepted");
      assert.strictEqual(yield* verdict(descriptionDoc(coordsName, "x")), "xsi-type");
      assert.strictEqual(yield* verdict(descriptionDoc("xs:string", "abc")), "xsi-type");
    }),
  );

  it.effect("judges xs:ID and xs:IDREF against the document's ID values", () =>
    Effect.gen(function* identifiers() {
      assert.strictEqual(yield* verdict(itemDoc(describing("xs:ID", "fresh"))), "accepted");
      assert.strictEqual(
        yield* verdict(itemDoc(itemBody("held") + describing("xs:ID", "held"))),
        "xsi-type",
      );
      assert.strictEqual(
        yield* verdict(itemDoc(describing("xs:ID", "held"), 'xml:id="held"')),
        "xsi-type",
      );
      assert.strictEqual(
        yield* verdict(itemDoc(itemBody("held") + describing("xs:IDREF", "held"))),
        "accepted",
      );
      assert.strictEqual(
        yield* verdict(itemDoc(itemBody("held") + describing("xs:IDREF", "gone"))),
        "xsi-type",
      );
      assert.strictEqual(
        yield* verdict(itemDoc(describing("xs:ID", "twice") + describing("xs:ID", "twice"))),
        "xsi-type",
      );
    }),
  );

  it.effect("refuses every xsi:type on an element declared with an anonymous type", () =>
    Effect.gen(function* anonymous() {
      assert.isTrue("anonymous" in declaredAt(pathTo("qti-calculator-type")));

      for (const type of ["xs:string", "xs:anyType", ref(emptyDeclared)]) {
        assert.strictEqual(
          yield* verdict(
            docAt(
              "qti-calculator-type",
              `<qti-calculator-type xsi:type="${type}">x</qti-calculator-type>`,
            ),
          ),
          "xsi-type",
          type,
        );
      }
    }),
  );
});

/**
 * A document with `content` as the only child of a `qti-custom-operator`, a lax wildcard host.
 */
const operatorDoc = (content: string): string =>
  docAt("qti-custom-operator", `<qti-custom-operator>${content}</qti-custom-operator>`);

describe("xsi:type on foreign content under lax", () => {
  it.effect("accepts a value that resolves to no type, writing its row as written", () =>
    Effect.gen(function* unresolved() {
      for (const value of ["ma:T", "1x", "zz:T", " ma:T "]) {
        const found = yield* rowsFor(operatorDoc(`<ma:ext xsi:type="${value}"/>`), "ext");

        assert.deepStrictEqual(found?.rows, [{ local: "type", prefix: "xsi", value }], value);
        assert.strictEqual(found?.kind, "foreign");
      }
    }),
  );

  it.effect("accepts xs:anyType and validates a simple type", () =>
    Effect.gen(function* simpleTypes() {
      const ext = (type: string, value: string, extra = "") =>
        operatorDoc(`<ma:ext xsi:type="${type}" ${extra}>${value}</ma:ext>`);

      assert.strictEqual(yield* verdict(ext("xs:anyType", "x")), "accepted");
      assert.strictEqual(yield* verdict(ext("xs:integer", "12")), "accepted");
      assert.strictEqual(yield* verdict(ext("xs:integer", "abc")), "xsi-type");
      assert.strictEqual(
        yield* verdict(operatorDoc('<ma:ext xsi:type="xs:string"><ma:c/></ma:ext>')),
        "xsi-type",
      );
      assert.strictEqual(yield* verdict(ext("xs:string", "x", 'foo="1"')), "xsi-type");
    }),
  );

  it.effect("accepts a named complex type unchecked (L-1)", () =>
    Effect.gen(function* complex() {
      const declared = declaredAt(pathTo("qti-prompt"));

      assert.strictEqual(
        yield* verdict(operatorDoc(`<ma:ext xsi:type="${ref(declared)}" foo="1"><ma:c/></ma:ext>`)),
        "accepted",
      );
    }),
  );

  it.effect("judges a prefix bound on the foreign element itself", () =>
    Effect.gen(function* boundOnElement() {
      assert.strictEqual(
        yield* verdict(
          operatorDoc(`<ma:ext xmlns:i="${xsNamespace}" xsi:type="i:integer">abc</ma:ext>`),
        ),
        "xsi-type",
      );
    }),
  );

  it.effect("refuses an unresolved value under a strict wildcard", () =>
    Effect.gen(function* strict() {
      const modes = everywhere("strict");

      assert.strictEqual(
        yield* verdict(operatorDoc('<ma:ext xsi:type="ma:T"/>'), modes),
        "xsi-type",
      );
      assert.strictEqual(
        yield* verdict(operatorDoc('<ma:ext xsi:type="xs:anyType"/>'), modes),
        "accepted",
      );
    }),
  );
});

describe("xsi:nil", () => {
  it.effect("is refused on an element with a declared type", () =>
    Effect.gen(function* declaredNil() {
      assert.strictEqual(
        yield* verdict(docAt("qti-custom-operator", '<qti-custom-operator xsi:nil="true"/>')),
        "xsi-nil",
      );
    }),
  );

  it.effect("is accepted as written on a foreign element when it is a boolean", () =>
    Effect.gen(function* foreignNil() {
      const found = yield* rowsFor(operatorDoc('<ma:ext xsi:nil=" true "/>'), "ext");

      assert.deepStrictEqual(found?.rows, [{ local: "nil", prefix: "xsi", value: " true " }]);

      for (const value of ["true", "false", "1", "0"]) {
        assert.strictEqual(yield* verdict(operatorDoc(`<ma:ext xsi:nil="${value}"/>`)), "accepted");
      }
    }),
  );

  it.effect("is refused as attribute-lexical when it is not a boolean", () =>
    Effect.gen(function* badNil() {
      assert.strictEqual(
        yield* verdict(operatorDoc('<ma:ext xsi:nil="maybe"/>')),
        "attribute-lexical",
      );
    }),
  );
});

describe("xsi:noNamespaceSchemaLocation", () => {
  it.effect("is accepted on the root when it is a URI reference", () =>
    Effect.gen(function* location() {
      const xml = nest(["qti-assessment-item"], "", 'xsi:noNamespaceSchemaLocation="schema.xsd"');
      const found = yield* rowsFor(xml, "qti-assessment-item");

      assert.deepStrictEqual(found?.rows, [
        { local: "noNamespaceSchemaLocation", prefix: "xsi", value: "schema.xsd" },
      ]);
    }),
  );

  it.effect("is refused as attribute-lexical when it is not a URI reference", () =>
    Effect.gen(function* badLocation() {
      const xml = nest(["qti-assessment-item"], "", 'xsi:noNamespaceSchemaLocation="%zz"');

      assert.strictEqual(yield* verdict(xml), "attribute-lexical");
    }),
  );
});

describe("a process mode of skip", () => {
  it.effect("assesses nothing, and still returns the rows as written", () =>
    Effect.gen(function* skipped() {
      const xml = operatorDoc(
        '<ma:ext xsi:type="xs:integer" xsi:nil="maybe" xsi:noNamespaceSchemaLocation="%zz">abc</ma:ext>',
      );
      const { result, root } = yield* judged(xml, everywhere("skip"));

      assert.isTrue(Result.isSuccess(result));
      assert.strictEqual(
        Result.isSuccess(result) ? result.success.get(must(root, "ext"))?.rows.length : 0,
        3,
      );
    }),
  );

  it.effect("judges one element directly", () =>
    Effect.gen(function* direct() {
      const element = yield* elementOf(
        `<e xmlns:xsi="${xsiNamespace}" xsi:type="no:T" xsi:nil="x"/>`,
      );
      const result = judgeXsi(element, undefined, "skip", new Map(), noIds, set, version);

      assert.isTrue(Result.isSuccess(result));
      assert.isTrue(
        Result.isFailure(judgeXsi(element, undefined, "lax", new Map(), noIds, set, version)),
      );
    }),
  );
});

describe("the attributes a derived xsi:type adds", () => {
  it.effect("returns one row for each attribute use the type admits, as written", () =>
    Effect.gen(function* twoUses() {
      const type = typeOrFail(twoUsesType, "type with two required uses and no wildcard");
      const attributes = usesOf(type).map(
        (use) => `${use.local}="${sample(use.attributeType, true)}"`,
      );
      const found = yield* rowsFor(nullDoc(type, attributes.join(" ")), "qti-null");

      assert.deepStrictEqual(
        found?.added.map((row) => row.local),
        usesOf(type).map((use) => use.local),
      );
      assert.deepStrictEqual(
        found?.added.map((row) => [row.namespace, row.prefix]),
        usesOf(type).map(() => ["", ""]),
      );
    }),
  );

  it.effect("refuses a value that is invalid for the use's type", () =>
    Effect.gen(function* invalidValue() {
      const type = typeOrFail(twoUsesType, "type with two required uses and no wildcard");
      const uses = usesOf(type);
      const index = uses.findIndex((use) => sampleOf(use.attributeType, false) !== undefined);
      const attributes = uses.map(
        (use, position) => `${use.local}="${sample(use.attributeType, position !== index)}"`,
      );

      assert.isAtLeast(index, 0);
      assert.strictEqual(yield* verdict(nullDoc(type, attributes.join(" "))), "xsi-type");
    }),
  );

  it.effect("returns no row for an attribute the type does not declare", () =>
    Effect.gen(function* undeclared() {
      const type = typeOrFail(twoUsesType, "type with two required uses and no wildcard");
      const attributes = usesOf(type).map(
        (use) => `${use.local}="${sample(use.attributeType, true)}"`,
      );
      const found = yield* rowsFor(nullDoc(type, `${attributes.join(" ")} foo="1"`), "qti-null");

      assert.isFalse(found?.added.some((row) => row.local === "foo"));
      assert.strictEqual(found?.added.length, 2);
    }),
  );

  it.effect("returns the attributes a wildcard admits, the xsi ones included", () =>
    Effect.gen(function* wildcard() {
      const type = typeOrFail(wildcardType, "type with an any lax wildcard");
      const found = yield* rowsFor(
        nullDoc(type, `xml:lang="en" data-foo="1" i:foo="2" xmlns:i="${xsiNamespace}"`),
        "qti-null",
      );
      const named = found?.added.map((row) => `${row.prefix}:${row.local}`);

      assert.deepStrictEqual(named, ["xml:lang", ":data-foo", "i:foo"]);
      assert.deepStrictEqual(
        found?.added.map((row) => row.namespace),
        [xmlNamespace, "", xsiNamespace],
      );
    }),
  );

  it.effect("refuses an added id another element's id holds", () =>
    Effect.gen(function* duplicateId() {
      const type = typeOrFail(wildcardType, "type with an any lax wildcard");
      const doc = (id: string) =>
        nest(
          ["qti-assessment-item"],
          `<qti-item-body id="${id}"/>${docAt(
            "qti-null",
            `<qti-null xsi:type="${ref(type)}" id="fresh"/>`,
          )
            .replace(/^<qti-assessment-item[^>]*>/u, "<qti-response-processing>")
            .replace(/<\/qti-assessment-item>$/u, "</qti-response-processing>")}`,
        );

      assert.strictEqual(yield* verdict(doc("other")), "accepted");
      assert.strictEqual(yield* verdict(doc("fresh")), "xsi-type");
    }),
  );

  it.effect("judges an added IDREF against the document's IDs", () =>
    Effect.gen(function* addedIdref() {
      const type = typeOrFail(wildcardType, "type with an any lax wildcard");
      const use = idrefUse(type);
      const name = use?.local ?? assert.fail("no IDREF use");

      assert.strictEqual(yield* verdict(nullDoc(type, `${name}="gone"`)), "xsi-type");
      assert.strictEqual(
        yield* verdict(nullDoc(type, `${name}="held"`, 'xml:id="held"')),
        "accepted",
      );
    }),
  );

  it.effect("judges xsi:foo on foreign content against the type its xsi:type names", () =>
    Effect.gen(function* foreignFoo() {
      const declared = declaredAt(pathTo("qti-prompt"));

      assert.strictEqual(
        yield* verdict(operatorDoc('<ma:ext xsi:type="xs:integer" xsi:foo="1">12</ma:ext>')),
        "xsi-type",
      );
      assert.strictEqual(
        yield* verdict(operatorDoc(`<ma:ext xsi:type="${ref(declared)}" xsi:foo="1"/>`)),
        "accepted",
      );
      assert.strictEqual(yield* verdict(operatorDoc('<ma:ext xsi:foo="1"/>')), "accepted");
    }),
  );
});
