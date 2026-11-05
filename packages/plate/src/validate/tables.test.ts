import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace, xmlNamespace, xsdNamespace } from "#plate/document/source.ts";
import { htmlSubset } from "#plate/emit/body.ts";
import { baseTypes } from "#plate/vocabulary.ts";
import { tables, xsdPath, xsdSha256 } from "#plate/validate/tables.ts";
import type { AttributeTable, ElementTable } from "#plate/validate/xsd.ts";
import { generateTables } from "#plate/validate/xsd.ts";

/**
 * The XSD's bytes, read from the cache under `HOME`.
 */
const xsdBytes = Effect.gen(function* readXsd() {
  const path = yield* xsdPath;

  return yield* Effect.tryPromise(() => readFile(path));
});

/**
 * The table of an element the committed tables must hold.
 *
 * @param name The element's local name.
 * @returns Its table; the test fails when the tables have none.
 */
const elementNamed = (name: string): ElementTable => {
  const table = tables.elements[name];
  assert.isDefined(table, `the tables hold ${name}`);

  return table;
};

/**
 * The table of an attribute an element's table declares by name.
 *
 * @param element The element's local name.
 * @param local The attribute's local name, in no namespace.
 * @returns Its table, or nothing when the element declares no such attribute.
 */
const attributeNamed = (element: string, local: string): Option.Option<AttributeTable> =>
  Option.fromUndefinedOr(
    elementNamed(element).attributes.find(
      (attribute) => attribute.namespace === "" && attribute.local === local,
    ),
  );

/**
 * Name an attribute as the content emitter names it: its local name, `xml:` before a name in the
 * XML namespace, and the Clark name for any other namespace, so a mismatch shows it.
 *
 * @param attribute The attribute's table.
 * @returns The attribute's name.
 */
const emittedName = (attribute: AttributeTable): string => {
  if (attribute.namespace === "") {
    return attribute.local;
  }

  return attribute.namespace === xmlNamespace
    ? `xml:${attribute.local}`
    : `{${attribute.namespace}}${attribute.local}`;
};

/**
 * ARIA's name for the keyboard shortcuts attribute, which the second line also admits where the
 * XSD declares its misspelling (reading 10).
 */
const keyShortcuts = "aria-keyshortcuts";

/**
 * The XSD's misspelling of {@link keyShortcuts}.
 */
const keyShortcutsMisspelt = "aria-keyshorts";

/**
 * Parsing the full XSD and regenerating the tables nears vitest's 5 s default under load.
 */
const regenerateTimeoutMs = 60_000;

describe("validate/tables.ts", () => {
  it.effect(
    "the committed tables are what the generator builds from the cached XSD",
    () =>
      Effect.gen(function* regenerateNoDiff() {
        const source = yield* readSource("imsqti_asiv3p0p1_v1p0.xsd", yield* xsdBytes);
        const generated = yield* generateTables(source);

        assert.deepStrictEqual(tables, generated);
      }),
    regenerateTimeoutMs,
  );

  it.effect("the cached XSD is the one the tables were generated from", () =>
    Effect.gen(function* xsdDigest() {
      const bytes = yield* xsdBytes;

      assert.strictEqual(createHash("sha256").update(bytes).digest("hex"), xsdSha256);
    }),
  );

  it("qti-interaction-modules declares secondary-configuration and not fallback-configuration", () => {
    assert.isTrue(
      Option.isSome(attributeNamed("qti-interaction-modules", "secondary-configuration")),
    );
    assert.isTrue(
      Option.isNone(attributeNamed("qti-interaction-modules", "fallback-configuration")),
    );
  });

  it("qti-choice-interaction's max-choices defaults to 1", () => {
    const maxChoices = attributeNamed("qti-choice-interaction", "max-choices");

    assert.strictEqual(Option.getOrUndefined(maxChoices)?.default, "1");
  });

  it("qti-map-entry's case-sensitive defaults to false", () => {
    const caseSensitive = attributeNamed("qti-map-entry", "case-sensitive");

    assert.strictEqual(Option.getOrUndefined(caseSensitive)?.default, "false");
  });

  it("p admits any attribute through a ##any wildcard", () => {
    assert.strictEqual(elementNamed("p").anyAttribute?.namespace, "##any");
  });

  it("qti-assessment-item declares xml:lang", () => {
    const declared = elementNamed("qti-assessment-item").attributes.some(
      (attribute) => attribute.namespace === xmlNamespace && attribute.local === "lang",
    );

    assert.isTrue(declared);
  });

  it("qti-match-table-entry's target-value is the base-type enumeration, which reading 8 sets aside", () => {
    const type = Option.getOrUndefined(
      attributeNamed("qti-match-table-entry", "target-value"),
    )?.type;

    assert.strictEqual(type?.kind, "enumeration");
    assert.deepStrictEqual(
      type?.kind === "enumeration" ? type.values.toSorted() : [],
      [...baseTypes].toSorted(),
    );
  });

  it("qti-template-if admits qti-template-constraint, which reading 22 sets aside", () => {
    const admitted = elementNamed("qti-template-if").children.some(
      (child) => child.local === "qti-template-constraint",
    );

    assert.isTrue(admitted);
  });

  it("qti-content-body records the seven types it is declared with", () => {
    assert.deepStrictEqual(
      elementNamed("qti-content-body").types,
      [
        "FeedbackContentBodyDType",
        "FeedbackFlowContentBodyDType",
        "RubricBlockContentBodyDType",
        "RubricBlockTemplateBlockContentBodyDType",
        "TemplateBlockContentBodyDType",
        "TestFeedbackFlowContentBodyDType",
        "TestRubricBlockContentBodyDType",
      ].map((local) => ({ local, namespace: qtiNamespace })),
    );
  });

  it("div and qti-assessment-item are declared globally and qti-choice-interaction is not", () => {
    assert.isTrue(elementNamed("div").global);
    assert.isTrue(elementNamed("qti-assessment-item").global);
    assert.isFalse(elementNamed("qti-choice-interaction").global);
  });

  it("every base and union member in types names a key of types or an XML Schema type", () => {
    const unnamed = Object.entries(tables.types).flatMap(([name, entry]) =>
      (entry.derivation === "union" ? entry.members : [entry.base])
        .filter(
          (type) =>
            type.namespace !== xsdNamespace &&
            !(type.namespace === qtiNamespace && Object.hasOwn(tables.types, type.local)),
        )
        .map((type) => `${name}: {${type.namespace}}${type.local}`),
    );

    assert.isAbove(Object.keys(tables.types).length, 0);
    assert.deepStrictEqual(unnamed, []);
  });

  it("WeightDType extends EmptyPrimitiveTypeDType", () => {
    assert.deepStrictEqual(tables.types["WeightDType"], {
      base: { local: "EmptyPrimitiveTypeDType", namespace: qtiNamespace },
      derivation: "extension",
    });
  });

  it("ToleranceListDType is a union of xs:string and xs:double, with no base", () => {
    assert.deepStrictEqual(tables.types["ToleranceListDType"], {
      derivation: "union",
      members: [
        { local: "string", namespace: xsdNamespace },
        { local: "double", namespace: xsdNamespace },
      ],
    });
  });

  it("qti-calculator-type has an inline type, for which types holds no name", () => {
    const table = elementNamed("qti-calculator-type");

    assert.isTrue(table.anonymousType);
    assert.deepStrictEqual(table.types, []);
  });

  it("the content emitter's HTML subset is exactly the tables' elements and attributes outside qti-", () => {
    const declared = new Map(
      Object.entries(tables.elements)
        .filter(([name]) => !name.startsWith("qti-"))
        .map(([name, table]) => [name, new Set(table.attributes.map(emittedName))] as const),
    );
    const mismatches: string[] = [];

    for (const name of new Set([...declared.keys(), ...htmlSubset.keys()])) {
      const fromTables = declared.get(name);
      const admitted = htmlSubset.get(name);
      if (fromTables === undefined) {
        mismatches.push(`${name}: in htmlSubset, not declared by the tables`);
      } else if (admitted === undefined) {
        mismatches.push(`${name}: declared by the tables, not in htmlSubset`);
      } else {
        for (const attribute of fromTables) {
          if (!admitted.has(attribute)) {
            mismatches.push(`${name}/@${attribute}: declared by the tables, not in htmlSubset`);
          }
        }
        for (const attribute of admitted) {
          const readingTen =
            attribute === keyShortcuts &&
            fromTables.has(keyShortcutsMisspelt) &&
            !fromTables.has(keyShortcuts);
          if (!fromTables.has(attribute) && !readingTen) {
            mismatches.push(`${name}/@${attribute}: in htmlSubset, not declared by the tables`);
          }
        }
      }
    }

    assert.isAbove(declared.size, 0);
    assert.deepStrictEqual(mismatches, []);
  });
});
