/**
 * The three `xsi` attributes in every tree (`xsi:type`, `xsi:nil`,
 * `xsi:noNamespaceSchemaLocation`): the walk of `treeRows` admits them on any element, writes their
 * rows as written, and runs the `xsi.ts` judgment over the tree before it returns. Every case reads
 * a tree from an inline literal with `readXml`; the processing cases go through `itemRows`. A type
 * name is read from the tables of `seed/xsi.ts` by property, never pinned. No database.
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
import { ForeignAttribute } from "#pantry/schema/foreign.ts";
import { NoNamespaceSchemaLocation, XsiNil, XsiType } from "#pantry/schema/node.ts";
import type { TypeKey } from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  declaredChild,
  declaredRoot,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";

const asiNamespace = typeNamespaces.asi;

const xsNamespace = typeNamespaces.xs;

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

/**
 * The shortest path of element names from the root to `target`, found by walking the content
 * models.
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
  let type = declaredRoot.filter(inBlock).find((row) => row.local === first)?.type;

  for (const local of rest) {
    const parent = type;
    type = declaredChild
      .filter(inBlock)
      .find(
        (candidate) =>
          parent !== undefined &&
          keyOf(candidate.parent) === keyOf(parent) &&
          candidate.local === local,
      )?.type;
  }

  return type ?? assert.fail(`no declaration at ${path.join("/")}`);
};

/**
 * Every type the derivation reaches from `start`, itself first.
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

const typeOrFail = (type: TypeKey | undefined, what: string): TypeKey =>
  type ?? assert.fail(`the tables hold no ${what}`);

const promptType = declaredAt([
  "qti-assessment-item",
  "qti-item-body",
  "qti-choice-interaction",
  "qti-prompt",
]);

const nullDeclared = declaredAt(pathTo("qti-null"));

const nullDerived = derivedFrom(nullDeclared);

/**
 * A type derived from `qti-null`'s declared type with no required attribute use.
 */
const bareType = typeOrFail(
  nullDerived.find((type) => usesOf(type).every((use) => !use.required)),
  "type derived from qti-null's with no required use",
);

/**
 * A type derived from `qti-null`'s declared type with a required attribute use.
 */
const requiringType = typeOrFail(
  nullDerived.find((type) => usesOf(type).some((use) => use.required)),
  "type derived from qti-null's with a required use",
);

const baseValueType = declaredAt(pathTo("qti-base-value"));

const itemOf = (inner: string, rootAttributes = ""): string =>
  `<qti-assessment-item ${declarations} identifier="i" title="t" adaptive="false" time-dependent="false" ${rootAttributes}>${inner}</qti-assessment-item>`;

/**
 * An item whose choice interaction's prompt carries `attributes`.
 */
const promptItem = (attributes: string, rootAttributes = ""): string =>
  itemOf(
    `<qti-item-body><qti-choice-interaction response-identifier="R" max-choices="1"><qti-prompt ${attributes}>P</qti-prompt><qti-simple-choice identifier="A">a</qti-simple-choice></qti-choice-interaction></qti-item-body>`,
    rootAttributes,
  );

/**
 * An item whose response processing holds a `qti-custom-operator` that carries `attributes` and
 * `inner`.
 */
const operatorItem = (inner: string, attributes = ""): string =>
  itemOf(
    `<qti-outcome-declaration identifier="S" cardinality="single" base-type="integer"/><qti-response-processing><qti-set-outcome-value identifier="S"><qti-custom-operator ${attributes}>${inner}</qti-custom-operator></qti-set-outcome-value></qti-response-processing>`,
  );

/**
 * An item whose response processing sets an outcome to `expression`.
 */
const expressionItem = (expression: string): string =>
  itemOf(
    `<qti-outcome-declaration identifier="S" cardinality="single" base-type="integer"/><qti-response-processing><qti-set-outcome-value identifier="S">${expression}</qti-set-outcome-value></qti-response-processing>`,
  );

const treeOf = (xml: string) =>
  Effect.gen(function* tree() {
    const doc = yield* readXml(new TextEncoder().encode(xml));

    return yield* treeRows(doc, inputOf(doc.charset), Rows.empty());
  });

const refusalOf = (xml: string) =>
  Effect.gen(function* refusal() {
    const exit = yield* Effect.exit(treeOf(xml));
    const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

    return Option.getOrThrow(failure);
  });

/**
 * The rule `xml` is refused under; the walk's own `UnmodeledVocabulary` is a test failure.
 */
const ruleOf = (xml: string) =>
  refusalOf(xml).pipe(
    Effect.map((refusal) => {
      assert.instanceOf(refusal, ImportRefused);

      return refusal.rule;
    }),
  );

const accepted = (xml: string) => treeOf(xml).pipe(Effect.asVoid);

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

const itemRule = (xml: string) =>
  Effect.gen(function* rule() {
    const exit = yield* Effect.exit(itemTree(xml));
    const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
    const refusal = Option.getOrThrow(failure);
    assert.instanceOf(refusal, ImportRefused);

    return refusal.rule;
  });

describe("xsi:type on a QTI element", () => {
  it.effect("writes one XsiType row, prefix and value as written", () =>
    Effect.gen(function* promptRow() {
      const written = ref(promptType);
      const built = yield* treeOf(promptItem(`xsi:type="${written}"`));

      assert.deepStrictEqual(
        Rows.of(built.rows, XsiType).map(({ prefix, value }) => ({ prefix, value })),
        [{ prefix: "xsi", value: written }],
      );
    }),
  );

  it.effect("refuses an unbound prefix on a declared type under xsi-type", () =>
    Effect.gen(function* unbound() {
      assert.strictEqual(
        yield* ruleOf(operatorItem("", 'xsi:type="x:T"')),
        "xsi-type" satisfies Rule,
      );
    }),
  );

  it.effect("passes the declared type of a qti-base-value and writes its row", () =>
    Effect.gen(function* baseValue() {
      const written = ref(baseValueType);
      const built = yield* itemTree(
        expressionItem(
          `<qti-base-value base-type="integer" xsi:type="${written}">1</qti-base-value>`,
        ),
      );

      assert.deepStrictEqual(
        Rows.of(built.rows, XsiType).map(({ prefix, value }) => ({ prefix, value })),
        [{ prefix: "xsi", value: written }],
      );
    }),
  );

  it.effect("writes the row of a type derived from qti-null's with no required use", () =>
    Effect.gen(function* derived() {
      const written = ref(bareType);
      const built = yield* itemTree(expressionItem(`<qti-null xsi:type="${written}"/>`));

      assert.deepStrictEqual(
        Rows.of(built.rows, XsiType).map(({ value }) => value),
        [written],
      );
    }),
  );

  it.effect("refuses a type derived from qti-null's with a required use under xsi-type", () =>
    Effect.gen(function* required() {
      assert.strictEqual(
        yield* itemRule(expressionItem(`<qti-null xsi:type="${ref(requiringType)}"/>`)),
        "xsi-type" satisfies Rule,
      );
    }),
  );
});

describe("xsi:nil", () => {
  it.effect("is refused xsi-nil on qti-custom-operator", () =>
    Effect.gen(function* nilOnOperator() {
      assert.strictEqual(
        yield* ruleOf(operatorItem("", 'xsi:nil="true"')),
        "xsi-nil" satisfies Rule,
      );
    }),
  );

  it.effect("writes an XsiNil row of kind foreign for a foreign element", () =>
    Effect.gen(function* nilOnForeign() {
      const built = yield* treeOf(operatorItem('<ma:ext xsi:nil="true"/>'));

      assert.deepStrictEqual(
        Rows.of(built.rows, XsiNil).map(({ kind, prefix, value }) => ({ kind, prefix, value })),
        [{ kind: "foreign", prefix: "xsi", value: "true" }],
      );
    }),
  );
});

describe("xsi:noNamespaceSchemaLocation", () => {
  it.effect("writes its row on the item root", () =>
    Effect.gen(function* rootLocation() {
      const built = yield* treeOf(promptItem("", 'xsi:noNamespaceSchemaLocation="schema.xsd"'));

      assert.deepStrictEqual(
        Rows.of(built.rows, NoNamespaceSchemaLocation).map(({ prefix, value }) => ({
          prefix,
          value,
        })),
        [{ prefix: "xsi", value: "schema.xsd" }],
      );
    }),
  );
});

describe("xsi:type on foreign content", () => {
  it.effect(
    "lax/22: an unresolved type on a foreign element is accepted and written as written",
    () =>
      Effect.gen(function* lax22() {
        const built = yield* treeOf(operatorItem('<ma:foo xsi:type="ma:T"/>'));

        assert.deepStrictEqual(
          Rows.of(built.rows, XsiType).map(({ prefix, value }) => ({ prefix, value })),
          [{ prefix: "xsi", value: "ma:T" }],
        );
      }),
  );

  it.effect("reading 60: refuses a simple type with an attribute, a child or xml:lang", () =>
    Effect.gen(function* simpleRefused() {
      for (const element of [
        '<ma:ext xsi:type="xs:string" foo="1">x</ma:ext>',
        '<ma:ext xsi:type="xs:string"><ma:c/></ma:ext>',
        '<ma:ext xsi:type="xs:string" xml:lang="en">x</ma:ext>',
      ]) {
        assert.strictEqual(
          yield* ruleOf(operatorItem(element)),
          "xsi-type" satisfies Rule,
          element,
        );
      }
    }),
  );

  it.effect("reading 60: accepts xsi:nil=false with text, anyType and an unresolved type", () =>
    Effect.gen(function* simpleAccepted() {
      for (const element of [
        '<ma:ext xsi:type="xs:string" xsi:nil="false">x</ma:ext>',
        '<ma:ext xsi:type="xs:anyType" foo="1"><ma:c/></ma:ext>',
        '<ma:ext xsi:type="ma:T" foo="1"><ma:c/></ma:ext>',
      ]) {
        yield* accepted(operatorItem(element));
      }
    }),
  );
});

describe("xsi:foo", () => {
  it.effect("is still UnmodeledVocabulary on qti-prompt", () =>
    Effect.gen(function* fooOnPrompt() {
      const refusal = yield* refusalOf(promptItem('xsi:foo="1"'));

      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.name, "xsi:foo");
    }),
  );

  it.effect("is a ForeignAttribute on qti-custom-operator", () =>
    Effect.gen(function* fooOnOperator() {
      const built = yield* treeOf(operatorItem("", 'xsi:foo="1"'));

      assert.deepStrictEqual(
        Rows.of(built.rows, ForeignAttribute).map(({ local, namespace, value }) => ({
          local,
          namespace,
          value,
        })),
        [{ local: "foo", namespace: xsiNamespace, value: "1" }],
      );
    }),
  );
});

describe("the XsiNilUndeclared check", () => {
  it("maps to xsi-nil", () => {
    const law: ImportLaw = { kind: "check", name: "XsiNilUndeclared", relation: "XsiNil" };

    assert.strictEqual(ruleOfLaw(law), "xsi-nil");
    assert.isTrue(isMappedLaw(law));
  });
});
