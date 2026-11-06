import { assert, describe, it } from "@effect/vitest";
import type { Fact } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { WildcardGuardRefusal, wildcardGuards } from "#pantry/import/guards/wildcard.ts";
import { Rows } from "#pantry/import/tree.ts";
import { NamespaceUri, XmlLocalName } from "#pantry/schema/contracts.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import { namespaces } from "#pantry/schema/seed/wildcard.ts";

const other = "http://example.org/x";

const element = (
  facts: Partial<Fact<typeof ForeignElement>> = {},
): Fact<typeof ForeignElement> => ({
  id: crypto.randomUUID(),
  local: XmlLocalName("foo"),
  namespace: NamespaceUri(other),
  parentKind: "foreign",
  prefix: facts.namespace === NamespaceUri("") ? "" : "q",
  rootKind: "item",
  schemaSet: "asi",
  ...facts,
});

const attribute = (
  facts: Partial<Fact<typeof ForeignAttribute>> = {},
): Fact<typeof ForeignAttribute> => ({
  kind: "foreign",
  local: XmlLocalName("foo"),
  namespace: NamespaceUri(other),
  node: crypto.randomUUID(),
  prefix: "q",
  process: "lax",
  rootKind: "item",
  schemaSet: "asi",
  value: "v",
  ...facts,
});

const withElement = (facts: Partial<Fact<typeof ForeignElement>>): Rows =>
  Rows.add(Rows.empty(), ForeignElement, [element(facts)]);

const withAttribute = (facts: Partial<Fact<typeof ForeignAttribute>>): Rows =>
  Rows.add(Rows.empty(), ForeignAttribute, [attribute(facts)]);

/**
 * Run the guard and return its refusal's rule, or `"passes"`.
 */
const verdict = (rows: Rows): Effect.Effect<string> =>
  wildcardGuards(rows).pipe(
    Effect.map(() => "passes"),
    Effect.catchTag("WildcardGuardRefusal", (refusal) => Effect.succeed(refusal.rule)),
  );

const assertVerdict = (rows: Rows, expected: string): Effect.Effect<void> =>
  Effect.map(verdict(rows), (actual) => {
    assert.strictEqual(actual, expected);
  });

describe("wildcardGuards", () => {
  it.effect("passes no rows", () => assertVerdict(Rows.empty(), "passes"));

  it.effect("refuses an ASI element under qti-custom-operator (W1, W2)", () =>
    Effect.gen(function* asiUnderOperator() {
      const rows = withElement({
        namespace: NamespaceUri(namespaces.asi),
        parentKind: "qti-custom-operator",
      });
      const refusal = yield* Effect.flip(wildcardGuards(rows));
      assert.instanceOf(refusal, WildcardGuardRefusal);
      assert.strictEqual(refusal._tag, "WildcardGuardRefusal");
      assert.strictEqual(refusal.rule, "wildcard-namespace");
    }),
  );

  it.effect("refuses an unqualified element under qti-custom-operator (W1, W2)", () =>
    assertVerdict(
      withElement({
        namespace: NamespaceUri(""),
        parentKind: "qti-custom-operator",
        prefix: "",
      }),
      "wildcard-namespace",
    ),
  );

  it.effect("passes another namespace under qti-custom-operator", () =>
    assertVerdict(withElement({ parentKind: "qti-custom-operator" }), "passes"),
  );

  it.effect("refuses a MathML element under foreign (RA-2)", () =>
    assertVerdict(
      withElement({ namespace: NamespaceUri(namespaces.mathml), parentKind: "foreign" }),
      "wildcard-namespace",
    ),
  );

  it.effect("passes another namespace under foreign", () =>
    assertVerdict(withElement({ parentKind: "foreign" }), "passes"),
  );

  it.effect("refuses a declared ASI element written as foreign content (W3)", () =>
    assertVerdict(
      withElement({
        local: XmlLocalName("p"),
        namespace: NamespaceUri(namespaces.asi),
        parentKind: "foreign",
      }),
      "wildcard-declared",
    ),
  );

  it.effect("passes an opaque global (W3, decision 99)", () =>
    assertVerdict(
      withElement({
        local: XmlLocalName("qti-response-processing"),
        namespace: NamespaceUri(namespaces.asi),
        parentKind: "foreign",
      }),
      "passes",
    ),
  );

  it.effect("refuses an ASI attribute on qti-custom-operator (W6)", () =>
    assertVerdict(
      withAttribute({ kind: "qti-custom-operator", namespace: NamespaceUri(namespaces.asi) }),
      "wildcard-namespace",
    ),
  );

  it.effect("passes another namespace's attribute on qti-custom-operator", () =>
    assertVerdict(withAttribute({ kind: "qti-custom-operator" }), "passes"),
  );

  it.effect("refuses xml:space under lax processing in asi (W7)", () =>
    assertVerdict(
      withAttribute({
        local: XmlLocalName("space"),
        namespace: NamespaceUri(namespaces.xml),
        prefix: "xml",
      }),
      "wildcard-declared",
    ),
  );

  it.effect("passes xml:space in the lom set, which declares no xml attribute", () =>
    assertVerdict(
      withAttribute({
        local: XmlLocalName("space"),
        namespace: NamespaceUri(namespaces.xml),
        prefix: "xml",
        schemaSet: "lom",
      }),
      "passes",
    ),
  );

  it.effect("refuses xsi:type under lax processing in asi (W7)", () =>
    assertVerdict(
      withAttribute({
        local: XmlLocalName("type"),
        namespace: NamespaceUri(namespaces.xsi),
        prefix: "xsi",
      }),
      "wildcard-declared",
    ),
  );

  it.effect("passes xsi:foo, which no schema declares (decision 227)", () =>
    assertVerdict(
      withAttribute({
        local: XmlLocalName("foo"),
        namespace: NamespaceUri(namespaces.xsi),
        prefix: "xsi",
      }),
      "passes",
    ),
  );

  it.effect("passes xml:space under skip processing (decision 108)", () =>
    assertVerdict(
      withAttribute({
        local: XmlLocalName("space"),
        namespace: NamespaceUri(namespaces.xml),
        prefix: "xml",
        process: "skip",
      }),
      "passes",
    ),
  );

  it.effect("reports the first finding in the order W1 W2, W3, W6, W7", () =>
    Effect.gen(function* firstFinding() {
      const rows = Rows.add(
        withElement({
          local: XmlLocalName("p"),
          namespace: NamespaceUri(namespaces.asi),
          parentKind: "foreign",
        }),
        ForeignAttribute,
        [attribute({ kind: "qti-custom-operator", namespace: NamespaceUri(namespaces.asi) })],
      );
      yield* assertVerdict(rows, "wildcard-declared");
    }),
  );
});
