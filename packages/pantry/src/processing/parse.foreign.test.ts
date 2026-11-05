import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { UnmodeledVocabulary } from "#pantry/import/tree.ts";
import type { ExpressionNode, IncludeNode, RuleNode } from "#pantry/processing/ast.ts";
import { parseProcessing } from "#pantry/processing/parse.ts";
import { readXml } from "@qti-pie/crust/read.ts";

const asiNamespace = 'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"';

const xIncludeNamespaces =
  'xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:ma="http://mathassess.qtitools.org/xsd/mathassess"';

const xsiDeclaration = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';

/**
 * Parse a processing tree written as a string, `body` standing under a `qti-response-processing`
 * root that declares the prefixes the cases use.
 */
const parseBody = (body: string) =>
  Effect.gen(function* parseBodyText() {
    const text = `<qti-response-processing ${asiNamespace} ${xIncludeNamespaces} ${xsiDeclaration}>${body}</qti-response-processing>`;
    const document = yield* readXml(new TextEncoder().encode(text));

    return yield* parseProcessing(document.root, "response");
  });

const refusalOf = (parse: ReturnType<typeof parseBody>) =>
  Effect.gen(function* refusalOfParse() {
    const refusal = yield* Effect.flip(parse);
    if (!(refusal instanceof UnmodeledVocabulary)) {
      return assert.fail(`expected UnmodeledVocabulary, got ${refusal._tag}`);
    }

    return refusal;
  });

/**
 * The expression that the first statement of a parsed tree holds, which the cases wrap in a
 * `qti-set-outcome-value`.
 */
const expressionOf = (rules: readonly (IncludeNode | RuleNode)[]): ExpressionNode => {
  const [first] = rules;
  if (first?.kind !== "qti-set-outcome-value") {
    return assert.fail("expected a qti-set-outcome-value");
  }

  if (Option.isNone(first.expression)) {
    return assert.fail("expected an expression");
  }

  return first.expression.value;
};

const customOperator = (attributes: string, children: string) =>
  parseBody(
    `<qti-set-outcome-value identifier="S"><qti-custom-operator ${attributes}>${children}</qti-custom-operator></qti-set-outcome-value>`,
  );

const includeIn = (include: string) => parseBody(include);

describe("processing/parse.ts, wildcard content", () => {
  it.effect("passes a foreign attribute over on qti-custom-operator", () =>
    Effect.gen(function* foreignAttribute() {
      const ast = yield* customOperator(
        'class="org.example.Op" ma:syntax="text/x-maxima"',
        "<qti-null/>",
      );
      const operator = expressionOf(ast.rules);
      assert.strictEqual(operator.kind, "qti-custom-operator");
      assert.strictEqual(operator.operands.length, 1);
      assert.isFalse(operator.attributes.has("ma:syntax"));
      assert.isFalse(operator.attributes.has("syntax"));
      assert.isTrue(operator.attributes.has("class"));
    }),
  );

  it.effect("passes xsi:foo over and still refuses the three declared xsi names", () =>
    Effect.gen(function* xsiNames() {
      const passed = yield* customOperator('xsi:foo="1"', "<qti-null/>");
      assert.strictEqual(expressionOf(passed.rules).attributes.size, 0);

      for (const name of ["type", "nil", "noNamespaceSchemaLocation"]) {
        const refusal = yield* refusalOf(customOperator(`xsi:${name}="x:T"`, "<qti-null/>"));
        assert.strictEqual(refusal.kind, "attribute");
        assert.strictEqual(refusal.name, `xsi:${name}`);
      }
    }),
  );

  it.effect("still refuses an unqualified attribute outside the kind", () =>
    Effect.gen(function* unqualified() {
      const refusal = yield* refusalOf(customOperator('foo="x"', "<qti-null/>"));
      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "foo");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-custom-operator"));
    }),
  );

  it.effect("skips a foreign element after the operand and keeps the one operand", () =>
    Effect.gen(function* foreignChild() {
      const ast = yield* customOperator(
        'class="org.example.Op"',
        '<qti-null/><ma:extension kind="x"/>',
      );
      const operator = expressionOf(ast.rules);
      assert.strictEqual(operator.operands.length, 1);
      assert.strictEqual(operator.operands[0]?.kind, "qti-null");
    }),
  );

  it.effect("skips a qti element that is no expression, wherever it stands", () =>
    Effect.gen(function* qtiChild() {
      const ast = yield* customOperator("", "<qti-foo/><qti-null/>");
      assert.strictEqual(expressionOf(ast.rules).operands.length, 1);
    }),
  );

  it.effect("passes a foreign attribute and child over on xi:include and its xi:fallback", () =>
    Effect.gen(function* include() {
      const ast = yield* includeIn(
        '<xi:include href="a" ma:k="v"><ma:x/><xi:fallback ma:f="1"/><qti-y/></xi:include>',
      );
      const [node] = ast.rules;
      if (node?.kind !== "xi:include") {
        return assert.fail("expected an xi:include");
      }

      assert.isFalse(node.attributes.has("ma:k"));
      assert.isTrue(Option.isSome(node.fallback));

      return node;
    }),
  );

  it.effect("refuses an include inside an include, naming the inner one", () =>
    Effect.gen(function* nested() {
      const refusal = yield* refusalOf(
        includeIn('<xi:include href="a"><xi:include href="b"/></xi:include>'),
      );
      assert.strictEqual(refusal.kind, "element");
      assert.strictEqual(refusal.name, "xi:include");
      assert.deepStrictEqual(refusal.parent, Option.some("xi:include"));
    }),
  );

  it.effect("refuses a second xi:fallback", () =>
    Effect.gen(function* secondFallback() {
      const refusal = yield* refusalOf(
        includeIn('<xi:include href="a"><xi:fallback/><xi:fallback/></xi:include>'),
      );
      assert.strictEqual(refusal.name, "xi:fallback");
    }),
  );

  it.effect("refuses foreign content on a host that has no wildcard", () =>
    Effect.gen(function* otherHosts() {
      const attribute = yield* refusalOf(
        parseBody(
          '<qti-set-outcome-value identifier="S" ma:k="v"><qti-null/></qti-set-outcome-value>',
        ),
      );
      assert.strictEqual(attribute.kind, "attribute");
      assert.strictEqual(attribute.name, "ma:k");

      const element = yield* refusalOf(
        parseBody(
          '<qti-set-outcome-value identifier="S"><qti-not><ma:x/></qti-not></qti-set-outcome-value>',
        ),
      );
      assert.strictEqual(element.kind, "element");
      assert.strictEqual(element.name, "ma:x");
    }),
  );
});
