/**
 * The O2 overlays' free tests: their statements build beside the document layer's, each check is
 * named by an oracle law, the reserved names are the specification's, and each base type's
 * pattern admits exactly the lexical forms the specification gives it.
 *
 * The database tests (`declarations.db.test.ts`) judge the laws through PostgreSQL; the builder's
 * tests (`#pantry/import/overlays/declarations.test.ts`) check its rows and codes.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect } from "effect";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { BaseType, BuiltIn, BuiltInVariable, ValueDomainOf } from "#pantry/grammar/install.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import {
  booleanValuePattern,
  contextVariable,
  Declaration,
  declarationLaws,
  domainValues,
  OutcomeRange,
  pairValuePattern,
  pointValuePattern,
  RecordField,
  reservedBaseTypes,
  sessionVariables,
  unjudgedBaseTypes,
  Value,
  ValueSet,
} from "#pantry/qti/declarations.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { packageLaws } from "#pantry/qti/package.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { lawNames, ruleOf } from "#pantry/test/oracle.ts";

/**
 * The O2 overlay relations, each under its own name.
 */
const overlays = { Declaration, OutcomeRange, RecordField, Value, ValueSet };

describe("qti/declarations.ts, declared", () => {
  it("builds a schema of Qti's relations and the O2 overlays with every law, each statement once", () => {
    const built = schema("DeclarationLayer", { ...Qti.relations, ...overlays }, [
      ...nodeLaws,
      ...chardataLaws,
      ...attributeLaws,
      ...packageLaws,
      ...declarationLaws,
    ]);

    for (const relation of Object.values(overlays)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(declarationLaws).size, declarationLaws.length);
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length +
        chardataLaws.length +
        attributeLaws.length +
        packageLaws.length +
        declarationLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = declarationLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.isDefined(ruleOf(law), name);
      }
    }

    assert.deepStrictEqual([...new Set(named)].toSorted(), [
      "Declaration base type",
      "Declaration not reserved",
      "E1 derived",
      "Mastery range",
      "Reserved type",
      "Typed value",
      "Value cardinality",
    ]);
    assert.include(lawNames, "Declaration key");
    assert.include(lawNames, "Record field key");
  });

  it("reserves exactly the built-in session variables, spelled exactly with no alias (spec reading 63)", () => {
    // Oracle: the specification as a checker. The information model's tables 4.5.1, 5.115.1 and
    // 5.151.1 ("They are completionStatus, numAttempts and duration") and §2.2.2.1's one built-in
    // context variable, QTI_CONTEXT, which may be declared as the record it is; reading 63 adds no
    // alias, so `completion_status` and `completion-status` name ordinary variables.
    assert.sameMembers([...sessionVariables], ["completionStatus", "duration", "numAttempts"]);
    assert.sameMembers(
      [...BuiltIn.handles],
      [...sessionVariables, contextVariable.identifier],
      "every built-in is a session variable or the context variable",
    );
    assert.deepStrictEqual(
      BuiltInVariable.rows.find(({ variable }) => variable === contextVariable.identifier)
        ?.declaration,
      contextVariable.kind,
    );
    for (const alias of ["completion_status", "completion-status", "CompletionStatus"]) {
      assert.notInclude(sessionVariables, alias, alias);
      assert.notInclude(BuiltIn.handles, alias, alias);
    }

    assert.sameDeepMembers(
      reservedBaseTypes.map(({ baseType, identifier }) => [identifier, baseType]),
      [
        ["SCORE", "float"],
        ["MAXSCORE", "float"],
        ["PASSED", "boolean"],
      ],
    );
  });
});

/**
 * The base types `Typed_value` judges by a pattern: every handle but those every text is a value
 * of, and `uri`, whose pattern is spec reading 61's (`value domain`'s, Q5.05), checked apart.
 */
const judgedBaseTypes = BaseType.handles.filter(
  (handle) => !unjudgedBaseTypes.some((unjudged) => unjudged === handle) && handle !== "uri",
);

/**
 * The pattern `Typed_value` reads a base type's text by, as a JavaScript host reads it
 * (`patternFlags`): its domain's `ValueDomainOf` pattern, or its own.
 *
 * @param baseType - The base type.
 * @returns The pattern.
 */
const patternOf = (baseType: string): RegExp => {
  const domain = domainValues.find(({ baseTypes }) =>
    baseTypes.some((handle) => handle === baseType),
  )?.domain;
  const pattern =
    domain === undefined
      ? new Map<string, string>([
          ["boolean", booleanValuePattern],
          ["directedPair", pairValuePattern],
          ["pair", pairValuePattern],
          ["point", pointValuePattern],
        ]).get(baseType)
      : ValueDomainOf.rows.find((row) => row.domain === domain)?.pattern;
  assert.isDefined(pattern, `${baseType} has a pattern`);

  return new RegExp(pattern ?? "", patternFlags);
};

/**
 * The texts of the typed-value box, each with the base types it is a value of, constructed from the
 * specification rather than read off a pattern: reading 7's outer whitespace, reading 34's
 * booleans, reading 45's unbounded integers, `xs:double`'s forms for float and duration (XML
 * Schema 1.0 writes no `+INF`), NCNames for identifiers (`true`, `INF` and `NaN` among them), and
 * the pairs and points of §8.13; then texts no base type of the box admits.
 */
const texts: readonly { readonly text: string; readonly values: readonly string[] }[] = [
  { text: "true", values: ["boolean", "identifier"] },
  { text: " false\n", values: ["boolean", "identifier"] },
  { text: "1", values: ["integer", "float", "duration"] },
  { text: "\t-12 ", values: ["integer", "float", "duration"] },
  { text: "+7", values: ["integer", "float", "duration"] },
  { text: "123456789012345678901234567890", values: ["integer", "float", "duration"] },
  { text: "1.5", values: ["float", "duration"] },
  { text: "-.5e-3", values: ["float", "duration"] },
  { text: "INF", values: ["float", "duration", "identifier"] },
  { text: " NaN ", values: ["float", "duration", "identifier"] },
  { text: "A", values: ["identifier"] },
  { text: " _a.b-c ", values: ["identifier"] },
  { text: "x y", values: ["pair", "directedPair"] },
  { text: "A\tB", values: ["pair", "directedPair"] },
  { text: "10 20", values: ["point"] },
  { text: " -1\t+2 ", values: ["point"] },
  { text: "", values: [] },
  { text: "1  2", values: [] },
  { text: "TRUE", values: ["identifier"] },
  { text: "0x1F", values: [] },
  { text: "1a", values: [] },
  { text: "a b c", values: [] },
  { text: "1.5.2", values: [] },
  { text: "+INF", values: [] },
];

/**
 * One case of the typed-value box: a judged base type and a text.
 */
interface TypedCase {
  readonly baseType: string;
  readonly text: string;
  readonly values: readonly string[];
}

/**
 * Every (base type, text) of the box.
 */
const typedCases = ((): readonly [TypedCase, ...TypedCase[]] => {
  const cases = judgedBaseTypes.flatMap((baseType) =>
    texts.map(({ text, values }): TypedCase => ({ baseType, text, values })),
  );

  return Arr.isReadonlyArrayNonEmpty(cases) ? cases : assert.fail("the typed-value box is empty");
})();

/**
 * A situation the box must reach: an admitted and a refused text, and the texts that tell
 * reading 34 and reading 45 apart from `xs:boolean` and a bounded integer.
 */
type TypedSituation = "admitted" | "refused" | "boolean 1 refused" | "long integer admitted";

describe("qti/declarations.ts, typed values", () => {
  it.effect(
    "admits a value's text exactly when the specification gives it as a lexical form of its base type",
    (ctx) =>
      // Oracle: the specification as a checker: each text's base types, constructed from readings
      // 7, 34 and 45, xs:double's lexical space and §8.13's pairs and points, against the pattern
      // `Typed_value` reads for the base type, read by a JavaScript host.
      // Bound: every judged base type but uri (8) against 24 texts, 192 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "every judged base type but uri against 24 constructed texts",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<TypedSituation>([
              "admitted",
              "refused",
              "boolean 1 refused",
              "long integer admitted",
            ]),
            generator: element<TypedCase>(typedCases),
            limit: 400,
            literal: ({ baseType, text }: TypedCase) => `${baseType} ${JSON.stringify(text)}`,
            oracle: {
              kind: "specification",
              name: "readings 7, 34 and 45, xs:double, and §8.13's base types",
            },
            suite: "qti/declarations-typed-value",
          },
          ({ baseType, text, values }: TypedCase, c) =>
            Effect.sync(() => {
              const expected = values.includes(baseType);
              const admitted = patternOf(baseType).test(text);
              c.note(admitted ? "admitted" : "refused");
              if (baseType === "boolean" && text === "1" && !admitted) {
                c.note("boolean 1 refused");
              }

              if (baseType === "integer" && text.length > 19 && admitted) {
                c.note("long integer admitted");
              }

              assert.strictEqual(admitted, expected, `${baseType} ${JSON.stringify(text)}`);
            }),
        ),
      ),
  );

  it("admits a uri's text by xs:anyURI's pattern, spec reading 61's", () => {
    // Oracle: the specification as a checker, RFC 2396 by way of reading 61: an absolute URI and a
    // relative reference are values, and a percent sign not followed by two hex digits is not.
    const uri = patternOf("uri");
    for (const text of ["http://example.com/a?b#c", "a/b.xml", " urn:x:y "]) {
      assert.isTrue(uri.test(text), text);
    }

    assert.isFalse(uri.test("%zz"), "%zz");
  });
});
