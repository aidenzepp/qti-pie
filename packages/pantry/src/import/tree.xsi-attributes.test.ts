/**
 * The attributes a derived `xsi:type` adds to its element, in every tree: the walk of `treeRows`
 * admits the ones the `xsi.ts` judgment returns as added, stores them as `XsiTypeAttribute` rows as
 * written, and no other relation holds them; the processing parser passes over the attributes of an
 * element that carries `xsi:type` for the walk to judge. Every case reads a tree from an inline
 * literal with `readXml`; the processing cases go through `itemRows`. A type is read from the
 * tables of `seed/xsi.ts` by property, never pinned by name. No database.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { itemRows } from "#pantry/import/item.ts";
import { ImportRefused, isMappedLaw, ruleOfLaw } from "#pantry/import/refusal.ts";
import type { ImportLaw, Rule } from "#pantry/import/refusal.ts";
import { Rows, treeRows, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { TreeInput } from "#pantry/import/tree.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import { NodeXmlLang } from "#pantry/schema/attributes.ts";
import { XsiTypeAttribute } from "#pantry/schema/node.ts";
import type { TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
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

const declarations = `xmlns="${asiNamespace}" xmlns:qti="${asiNamespace}" xmlns:xs="${xsNamespace}" xmlns:xsi="${xsiNamespace}" xmlns:ma="urn:test:ma"`;

const treeId = "11111111-1111-4111-8111-111111111111";

const inputOf = (charset: string): TreeInput => ({
  charset,
  id: treeId,
  kind: "document",
  root: "item",
  version,
});

const inBlock = (row: { readonly set: SchemaSetHandle; readonly version: SchemaVersionHandle }) =>
  row.set === set && row.version === version;

const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * A type as `xsi:type` writes it in the documents of this file.
 */
const ref = (type: TypeKey): string =>
  "anonymous" in type
    ? "anonymous"
    : `${type.namespace === xsNamespace ? "xs" : "qti"}:${type.local}`;

const declaredOf = (local: string): TypeKey =>
  declaredChild.filter(inBlock).find((row) => row.local === local)?.type ??
  assert.fail(`the tables declare no ${local}`);

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

const usesOf = (type: TypeKey) =>
  attributeUse.filter((row) => inBlock(row) && keyOf(row.type) === keyOf(type));

const wildcardOf = (type: TypeKey) =>
  typeAttributeWildcard.find((row) => inBlock(row) && keyOf(row.type) === keyOf(type));

const typeOrFail = (type: TypeKey | undefined, what: string): TypeKey =>
  type ?? assert.fail(`the tables hold no ${what}`);

const nullDerived = derivedFrom(declaredOf("qti-null"));

const exitDerived = derivedFrom(declaredOf("qti-exit-response"));

/**
 * A type derived from `qti-null`'s declared type with no attribute wildcard whose required uses
 * are `map-key` and `mapped-value`.
 */
const entryType = typeOrFail(
  nullDerived.find((type) => {
    const required = usesOf(type)
      .filter((use) => use.required)
      .map((use) => use.local)
      .toSorted();

    return (
      wildcardOf(type) === undefined &&
      required.length === 2 &&
      required[0] === "map-key" &&
      required[1] === "mapped-value"
    );
  }),
  "type derived from qti-null's with the required uses map-key and mapped-value",
);

/**
 * A type derived from `qti-exit-response`'s declared type with a `##any` `lax` attribute wildcard,
 * an `xml:lang` use and an `id` use, and no required use.
 */
const wildcardType = typeOrFail(
  exitDerived.find((type) => {
    const wildcard = wildcardOf(type);
    const uses = usesOf(type);

    return (
      wildcard?.process === "lax" &&
      wildcard.namespaces === "##any" &&
      uses.every((use) => !use.required) &&
      uses.some((use) => use.namespace === xmlNamespace && use.local === "lang") &&
      uses.some((use) => use.namespace === "" && use.local === "id")
    );
  }),
  "type derived from qti-exit-response's with a ##any lax wildcard and xml:lang and id uses",
);

/**
 * The type `qti-null` is declared with.
 */
const nullDeclared = declaredOf("qti-null");

const itemOf = (inner: string): string =>
  `<qti-assessment-item ${declarations} identifier="i" title="t" adaptive="false" time-dependent="false">${inner}</qti-assessment-item>`;

/**
 * An item whose response processing sets an outcome to `expression`.
 */
const expressionItem = (expression: string): string =>
  itemOf(
    `<qti-outcome-declaration identifier="S" cardinality="single" base-type="integer"/><qti-response-processing><qti-set-outcome-value identifier="S">${expression}</qti-set-outcome-value></qti-response-processing>`,
  );

/**
 * An item whose response processing holds `rule`, after an item body carrying `body`'s attributes.
 */
const ruleItem = (rule: string, bodyAttributes = ""): string =>
  itemOf(
    `<qti-item-body ${bodyAttributes}/><qti-response-processing>${rule}</qti-response-processing>`,
  );

/**
 * An item whose response processing holds a `qti-custom-operator` with `inner`.
 */
const operatorItem = (inner: string): string =>
  expressionItem(`<qti-custom-operator>${inner}</qti-custom-operator>`);

const entry = (attributes: string, written = ref(entryType)): string =>
  expressionItem(`<qti-null xsi:type="${written}" ${attributes}/>`);

const treeOf = (xml: string) =>
  Effect.gen(function* tree() {
    const doc = yield* readXml(new TextEncoder().encode(xml));

    return yield* treeRows(doc, inputOf(doc.charset), Rows.empty());
  });

const itemTree = (xml: string) =>
  Effect.gen(function* item() {
    const doc = yield* readXml(new TextEncoder().encode(xml));

    return yield* itemRows(
      {
        doc,
        packageId: crypto.randomUUID(),
        path: "x.xml",
        resource: "x",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_item_xmlv3p0",
        version,
      },
      Rows.empty(),
    );
  });

const failureOf = <A, E>(effect: Effect.Effect<A, E>) =>
  Effect.gen(function* failure() {
    const exit = yield* Effect.exit(effect);

    return Option.getOrThrow(Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none());
  });

/**
 * The rule the tree walk refuses `xml` under; an `UnmodeledVocabulary` is a failure.
 */
const treeRule = (xml: string) =>
  failureOf(treeOf(xml)).pipe(
    Effect.map((refusal) => {
      assert.instanceOf(refusal, ImportRefused);

      return refusal.rule;
    }),
  );

const itemRule = (xml: string) =>
  failureOf(itemTree(xml)).pipe(
    Effect.map((refusal) => {
      assert.instanceOf(refusal, ImportRefused);

      return refusal.rule;
    }),
  );

/**
 * The name `xml` is refused as unmodeled vocabulary for, through `treeRows` and `itemRows`.
 */
const unmodeledName = (build: (xml: string) => Effect.Effect<unknown, unknown>, xml: string) =>
  failureOf(build(xml)).pipe(
    Effect.map((refusal) => {
      assert.instanceOf(refusal, UnmodeledVocabulary);

      return refusal.name;
    }),
  );

/**
 * The `XsiTypeAttribute` rows of `rows`, as written.
 */
const storedOf = (rows: Rows) =>
  Rows.of(rows, XsiTypeAttribute).map(({ kind, local, namespace, prefix, value }) => ({
    kind,
    local,
    namespace,
    prefix,
    value,
  }));

/**
 * Whether a relation other than `XsiTypeAttribute` holds a fact with the value `name`.
 */
const heldElsewhere = (rows: Rows, name: string): boolean =>
  [...rows].some(
    ([relation, facts]) =>
      relation !== XsiTypeAttribute && facts.some((fact) => Object.values(fact).includes(name)),
  );

describe("the attributes a derived xsi:type adds", () => {
  it.effect("are stored as XsiTypeAttribute rows through itemRows, and held nowhere else", () =>
    Effect.gen(function* stored() {
      const built = yield* itemTree(entry('map-key="a" mapped-value="1"'));

      assert.deepStrictEqual(storedOf(built.rows), [
        { kind: "qti-null", local: "map-key", namespace: "", prefix: "", value: "a" },
        { kind: "qti-null", local: "mapped-value", namespace: "", prefix: "", value: "1" },
      ]);
      assert.isFalse(heldElsewhere(built.rows, "map-key"));
      assert.isFalse(heldElsewhere(built.rows, "mapped-value"));
    }),
  );

  it.effect("are stored through treeRows too", () =>
    Effect.gen(function* stored() {
      const built = yield* treeOf(entry('map-key="a" mapped-value="1"'));

      assert.deepStrictEqual(
        storedOf(built.rows).map(({ local, value }) => ({ local, value })),
        [
          { local: "map-key", value: "a" },
          { local: "mapped-value", value: "1" },
        ],
      );
    }),
  );

  it.effect("are refused xsi-type when a value is not valid for its use", () =>
    Effect.gen(function* invalid() {
      assert.strictEqual(
        yield* itemRule(entry('map-key="a" mapped-value="x"')),
        "xsi-type" satisfies Rule,
      );
      assert.strictEqual(
        yield* treeRule(entry('map-key="a" mapped-value="x"')),
        "xsi-type" satisfies Rule,
      );
    }),
  );

  it.effect("leave an attribute the type does not declare refused as unmodeled", () =>
    Effect.gen(function* undeclared() {
      const xml = entry('map-key="a" mapped-value="1" foo="1"');

      assert.strictEqual(yield* unmodeledName(itemTree, xml), "foo");
      assert.strictEqual(yield* unmodeledName(treeOf, xml), "foo");
    }),
  );

  it.effect("are refused as unmodeled with no xsi:type, and with the declared type", () =>
    Effect.gen(function* undeclared() {
      for (const xml of [
        expressionItem('<qti-null map-key="a"/>'),
        expressionItem(`<qti-null xsi:type="${ref(nullDeclared)}" map-key="a"/>`),
      ]) {
        assert.strictEqual(yield* unmodeledName(itemTree, xml), "map-key");
        assert.strictEqual(yield* unmodeledName(treeOf, xml), "map-key");
      }
    }),
  );

  it.effect("reading 60: a simple type adds none, so the attribute stays refused xsi-type", () =>
    Effect.gen(function* simple() {
      assert.strictEqual(
        yield* treeRule(operatorItem('<ma:ext xsi:type="xs:string" foo="1">x</ma:ext>')),
        "xsi-type" satisfies Rule,
      );
    }),
  );
});

const exitWith = (attributes: string) =>
  ruleItem(`<qti-exit-response xsi:type="${ref(wildcardType)}" ${attributes}/>`);

describe("a derived type with a ##any lax attribute wildcard", () => {
  it.effect("stores xml:lang, data-foo and xsi:foo as rows and writes no NodeXmlLang", () =>
    Effect.gen(function* wildcard() {
      const xml = exitWith('xml:lang="en" data-foo="1" xsi:foo="1"');
      const expected = [
        {
          kind: "qti-exit-response",
          local: "lang",
          namespace: xmlNamespace,
          prefix: "xml",
          value: "en",
        },
        {
          kind: "qti-exit-response",
          local: "data-foo",
          namespace: "",
          prefix: "",
          value: "1",
        },
        {
          kind: "qti-exit-response",
          local: "foo",
          namespace: xsiNamespace,
          prefix: "xsi",
          value: "1",
        },
      ];

      for (const build of [treeOf, itemTree]) {
        const built = yield* build(xml);

        assert.deepStrictEqual(storedOf(built.rows), expected);
        assert.lengthOf(Rows.of(built.rows, NodeXmlLang), 0);
        assert.isFalse(heldElsewhere(built.rows, "data-foo"));
      }
    }),
  );

  it.effect("refuses an added id another element's id holds under xsi-type", () =>
    Effect.gen(function* duplicate() {
      const xml = ruleItem(
        `<qti-exit-response xsi:type="${ref(wildcardType)}" id="dup"/>`,
        'id="dup"',
      );

      assert.strictEqual(yield* treeRule(xml), "xsi-type" satisfies Rule);
    }),
  );
});

const side = (relation: string, fields: readonly string[]) => ({
  fields,
  relation,
  selection: [],
});

describe("the XsiTypeAttribute laws", () => {
  it("maps the containment into XsiType to xsi-type", () => {
    const law: ImportLaw = {
      from: side("XsiTypeAttribute", ["node"]),
      kind: "contained",
      to: side("XsiType", ["node"]),
    };

    assert.strictEqual(ruleOfLaw(law), "xsi-type");
    assert.isTrue(isMappedLaw(law));
  });

  it("maps the prefix check to xsi-type", () => {
    const law: ImportLaw = {
      kind: "check",
      name: "XsiTypeAttributePrefix",
      relation: "XsiTypeAttribute",
    };

    assert.strictEqual(ruleOfLaw(law), "xsi-type");
    assert.isTrue(isMappedLaw(law));
  });
});
