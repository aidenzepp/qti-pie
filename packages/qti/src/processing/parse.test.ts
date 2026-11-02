import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import { UnmodeledVocabulary } from "#qti/import/tree.ts";
import type {
  ExpressionNode,
  IncludeNode,
  Language,
  ProcessingAst,
  RuleNode,
} from "#qti/processing/ast.ts";
import {
  encVariableString,
  literalOrRef,
  parseProcessing,
  patternOrRef,
} from "#qti/processing/parse.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * The four committed trees, relative to `packages/qti`, where the tests run.
 */
const validDirectory = "src/processing/fixtures/valid";

const asiNamespace = 'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"';

/**
 * The 64 expression kinds of section 3.3 table A, by name.
 */
const tableA = [
  "qti-and",
  "qti-any-n",
  "qti-base-value",
  "qti-container-size",
  "qti-contains",
  "qti-correct",
  "qti-custom-operator",
  "qti-default",
  "qti-delete",
  "qti-divide",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-field-value",
  "qti-gcd",
  "qti-gt",
  "qti-gte",
  "qti-index",
  "qti-inside",
  "qti-integer-divide",
  "qti-integer-modulus",
  "qti-integer-to-float",
  "qti-is-null",
  "qti-lcm",
  "qti-lt",
  "qti-lte",
  "qti-map-response",
  "qti-map-response-point",
  "qti-match",
  "qti-math-constant",
  "qti-math-operator",
  "qti-max",
  "qti-member",
  "qti-min",
  "qti-multiple",
  "qti-not",
  "qti-null",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-or",
  "qti-ordered",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-pattern-match",
  "qti-power",
  "qti-product",
  "qti-random",
  "qti-random-float",
  "qti-random-integer",
  "qti-repeat",
  "qti-round",
  "qti-round-to",
  "qti-stats-operator",
  "qti-string-match",
  "qti-substring",
  "qti-subtract",
  "qti-sum",
  "qti-test-variables",
  "qti-truncate",
  "qti-variable",
];

/**
 * The 26 rule and processing kinds of section 3.3 table B, by name, grouped as the table is.
 */
const tableB = [
  "qti-response-processing",
  "qti-response-condition",
  "qti-response-if",
  "qti-response-else-if",
  "qti-response-else",
  "qti-set-outcome-value",
  "qti-lookup-outcome-value",
  "qti-exit-response",
  "qti-response-processing-fragment",
  "qti-outcome-processing",
  "qti-outcome-condition",
  "qti-outcome-if",
  "qti-outcome-else-if",
  "qti-outcome-else",
  "qti-exit-test",
  "qti-outcome-processing-fragment",
  "qti-template-processing",
  "qti-template-condition",
  "qti-template-if",
  "qti-template-else-if",
  "qti-template-else",
  "qti-set-template-value",
  "qti-set-default-value",
  "qti-set-correct-response",
  "qti-template-constraint",
  "qti-exit-template",
];

/**
 * The two XInclude kinds.
 */
const xInclude = ["xi:include", "xi:fallback"];

type ProcessingNode = ExpressionNode | IncludeNode | RuleNode;

/**
 * The nodes directly under a node: an expression's operands, a rule's branches, rules and
 * expression, nothing under an include.
 */
const childrenOf = (node: ProcessingNode): readonly ProcessingNode[] => {
  if ("operands" in node) {
    return node.operands;
  }

  if ("branches" in node) {
    return [...node.branches, ...node.rules, ...Option.toArray(node.expression)];
  }

  return [];
};

/**
 * Every node under the top-level rules, each before its descendants, in document order.
 */
const allNodes = (ast: ProcessingAst): readonly ProcessingNode[] => {
  const nodes: ProcessingNode[] = [];
  const visit = (node: ProcessingNode): void => {
    nodes.push(node);
    for (const child of childrenOf(node)) {
      visit(child);
    }
  };
  for (const rule of ast.rules) {
    visit(rule);
  }

  return nodes;
};

/**
 * The names of the kinds a parse classified: the root's own, every node's and the `xi:fallback` an
 * include's element holds.
 */
const census = (ast: ProcessingAst): ReadonlySet<string> => {
  const found = new Set<string>([ast.root.local]);
  for (const node of allNodes(ast)) {
    found.add(node.element.local === "include" ? "xi:include" : node.kind);
    if (
      node.element.local === "include" &&
      node.element.children.some((child) => child.kind === "element" && child.local === "fallback")
    ) {
      found.add("xi:fallback");
    }
  }

  return found;
};

const elementChild = (parent: Element, local: string): Element => {
  const found = parent.children.find(
    (child): child is Element => child.kind === "element" && child.local === local,
  );
  if (found === undefined) {
    return assert.fail(`${parent.qname} holds ${local}`);
  }

  return found;
};

/**
 * The rule at `index` among the top-level rules, which must not be an include.
 */
const ruleAt = (ast: ProcessingAst, index: number): RuleNode => {
  const node = ast.rules[index];
  if (node === undefined || node.kind === "xi:include") {
    return assert.fail(`rule ${index} is a rule`);
  }

  return node;
};

/**
 * The expression a rule holds.
 */
const expressionOf = (rule: RuleNode): ExpressionNode =>
  Option.getOrElse(rule.expression, () => assert.fail(`${rule.element.qname} holds an expression`));

/**
 * The first top-level rule's expression.
 */
const firstExpression = (ast: ProcessingAst): ExpressionNode => expressionOf(ruleAt(ast, 0));

/**
 * The text of an element's children, a text run as its value and any other child as its kind.
 */
const childSummary = (element: Element): readonly string[] =>
  element.children.map((child) => (child.kind === "text" ? child.value : child.kind));

const language = (name: string): Language => {
  if (name === "outcome") {
    return "outcome";
  }

  return name === "template" ? "template" : "response";
};

/**
 * Read a fixture and parse its processing element: the root for `outcome`, else the item's
 * `qti-<language>-processing` child.
 */
const parseFixture = (name: string) =>
  Effect.gen(function* parseFixtureFile() {
    const fs = yield* FileSystem.FileSystem;
    const document = yield* readXml(yield* fs.readFile(path.join(validDirectory, `${name}.xml`)));
    const kindOfRoot = name === "response-mapped" ? "response" : name;
    const root =
      name === "outcome"
        ? document.root
        : elementChild(document.root, `qti-${kindOfRoot}-processing`);

    return yield* parseProcessing(root, language(kindOfRoot));
  });

/**
 * Parse a processing tree written as a string, `body` standing under a `qti-response-processing`
 * root.
 */
const parseBody = (body: string) =>
  Effect.gen(function* parseBodyText() {
    const text = `<qti-response-processing ${asiNamespace}>${body}</qti-response-processing>`;
    const document = yield* readXml(new TextEncoder().encode(text));

    return yield* parseProcessing(document.root, "response");
  });

/**
 * Run a parse that must refuse and give the refusal, which must be `UnmodeledVocabulary`.
 */
const refusalOf = (parse: ReturnType<typeof parseBody>) =>
  Effect.gen(function* refusalOfParse() {
    const refusal = yield* Effect.flip(parse);
    if (!(refusal instanceof UnmodeledVocabulary)) {
      return assert.fail(`expected UnmodeledVocabulary, got ${refusal._tag}`);
    }

    return refusal;
  });

describe("encVariableString and the recognizers", () => {
  it("admits a braced NCName and refuses the rest", () => {
    const pattern = new RegExp(encVariableString, "u");
    assert.isTrue(pattern.test("{P}"));
    assert.isFalse(pattern.test("P"));
    assert.isFalse(pattern.test("{P"));
    assert.isFalse(pattern.test("a{2}"));
    assert.isFalse(pattern.test("{}"));
    assert.isFalse(pattern.test("{1P}"));
  });

  it("reads a number as its collapsed literal and a bare NCName as a reference", () => {
    assert.deepStrictEqual(literalOrRef("3"), { _tag: "literal", value: "3" });
    assert.deepStrictEqual(literalOrRef(" 3"), { _tag: "literal", value: "3" });
    assert.deepStrictEqual(literalOrRef("-3"), { _tag: "literal", value: "-3" });
    assert.deepStrictEqual(literalOrRef("0.5"), { _tag: "literal", value: "0.5" });
    assert.deepStrictEqual(literalOrRef("1e3"), { _tag: "literal", value: "1e3" });
    assert.deepStrictEqual(literalOrRef("N"), { _tag: "ref", identifier: "N" });
    assert.deepStrictEqual(literalOrRef("my-var.1"), { _tag: "ref", identifier: "my-var.1" });
  });

  it("keeps a padded NCName and any other text a literal as read", () => {
    assert.deepStrictEqual(literalOrRef(" N "), { _tag: "literal", value: " N " });
    assert.deepStrictEqual(literalOrRef("3 N"), { _tag: "literal", value: "3 N" });
    assert.deepStrictEqual(literalOrRef("{N}"), { _tag: "literal", value: "{N}" });
    assert.deepStrictEqual(literalOrRef(""), { _tag: "literal", value: "" });
  });

  it("reads a braced pattern as a reference and any other pattern as a literal as read", () => {
    assert.deepStrictEqual(patternOrRef("{P}"), { _tag: "ref", identifier: "P" });
    assert.deepStrictEqual(patternOrRef("a{2}"), { _tag: "literal", value: "a{2}" });
    assert.deepStrictEqual(patternOrRef(" {P}"), { _tag: "literal", value: " {P}" });
    assert.deepStrictEqual(patternOrRef("P"), { _tag: "literal", value: "P" });
  });
});

layer(NodeServices.layer, { excludeTestServices: true })("processing/parse.ts", (suite) => {
  suite.effect("classifies, over the four fixtures, exactly the 92 kinds of the vocabulary", () =>
    Effect.gen(function* unionOfKinds() {
      const union = new Set<string>();
      for (const name of ["response", "response-mapped", "outcome", "template"]) {
        for (const kind of census(yield* parseFixture(name))) {
          union.add(kind);
        }
      }

      assert.deepStrictEqual([...union].toSorted(), [...tableA, ...tableB, ...xInclude].toSorted());
    }),
  );

  suite.effect("response.xml's census holds only M3 kinds and the two XInclude kinds", () =>
    Effect.gen(function* responseCensus() {
      const found = census(yield* parseFixture("response"));
      const allowed = new Set([...tableA, ...tableB, ...xInclude]);
      assert.deepStrictEqual(
        [...found].filter((kind) => !allowed.has(kind)),
        [],
      );
      assert.isTrue(found.has("xi:include"));
      assert.isTrue(found.has("xi:fallback"));
      assert.isTrue(found.has("qti-response-processing"));
      assert.isFalse(found.has("qti-outcome-processing"));
    }),
  );

  suite.effect("reads the figures and pattern attributes of response.xml", () =>
    Effect.gen(function* responseAttributes() {
      const nodes = allNodes(yield* parseFixture("response"));
      assert.deepStrictEqual(
        nodes.flatMap((node) => node.attributes.get("figures")?.processed ?? []),
        ["COUNT", "3", "2"],
      );
      assert.deepStrictEqual(
        nodes.flatMap((node) => node.attributes.get("pattern")?.processed ?? []),
        ["[a-z]+", "{NOTE}"],
      );
    }),
  );

  suite.effect("gives a node the index path of its place among its parent's element children", () =>
    Effect.gen(function* positions() {
      const ast = yield* parseFixture("response");
      // The root's element children: eight qti-set-outcome-value, a condition, a fragment.
      assert.strictEqual(ast.rules.length, 10);

      const first = ruleAt(ast, 0);
      assert.strictEqual(first.element.local, "qti-set-outcome-value");
      assert.deepStrictEqual(first.position.path, [0]);

      const condition = ruleAt(ast, 8);
      assert.strictEqual(condition.element.local, "qti-response-condition");
      assert.deepStrictEqual(condition.position.path, [8]);
      assert.deepStrictEqual(
        condition.branches.map((branch) => [branch.element.local, branch.position.path]),
        [
          ["qti-response-if", [8, 0]],
          ["qti-response-else-if", [8, 1]],
          ["qti-response-else-if", [8, 2]],
          ["qti-response-else", [8, 3]],
        ],
      );

      const [ifBranch] = condition.branches;
      assert.isDefined(ifBranch);

      const guard = expressionOf(ifBranch);
      assert.strictEqual(guard.element.local, "qti-variable");
      assert.deepStrictEqual(guard.position.path, [8, 0, 0]);
      assert.deepStrictEqual(
        ifBranch.rules.map((rule) => [rule.element.local, rule.position.path]),
        [
          ["qti-set-outcome-value", [8, 0, 1]],
          ["qti-exit-response", [8, 0, 2]],
        ],
      );

      const flag = firstExpression(ast);
      assert.strictEqual(flag.element.local, "qti-and");
      assert.deepStrictEqual(flag.position.path, [0, 0]);
      assert.strictEqual(flag.operands[0]?.element.local, "qti-match");
      assert.deepStrictEqual(flag.operands[0]?.position.path, [0, 0, 0]);
    }),
  );

  suite.effect("parses the xi:include of response.xml as data with its href and fallback", () =>
    Effect.gen(function* include() {
      const ast = yield* parseFixture("response");
      const fragment = ruleAt(ast, 9);
      assert.strictEqual(fragment.element.local, "qti-response-processing-fragment");

      const included = fragment.rules.find((rule) => rule.element.local === "include");
      assert.isDefined(included);
      assert.strictEqual(included.kind, "xi:include");
      assert.isFalse("branches" in included);
      if (included.kind !== "xi:include") {
        assert.fail("the nested include is not an IncludeNode");
      }

      assert.deepStrictEqual(included.position.path, [9, 1]);
      assert.strictEqual(included.attributes.get("href")?.processed, "shared-rules.xml");
      assert.strictEqual(included.attributes.get("parse")?.processed, "xml");

      const fallback = elementChild(included.element, "fallback");
      assert.strictEqual(fallback.qname, "xi:fallback");
      assert.deepStrictEqual(childSummary(fallback), ["fallback"]);
      assert.deepStrictEqual(childSummary(Option.getOrThrow(included.fallback)), ["fallback"]);
    }),
  );

  suite.effect("parses an xi:include among the top-level rules as an IncludeNode", () =>
    Effect.gen(function* topLevelInclude() {
      const ast = yield* parseBody(
        `<xi:include xmlns:xi="http://www.w3.org/2001/XInclude" href=" a.xml " accept-language=" en "><xi:fallback>fallback</xi:fallback></xi:include><qti-exit-response/>`,
      );
      const [included] = ast.rules;
      assert.isDefined(included);
      assert.strictEqual(included.kind, "xi:include");
      assert.deepStrictEqual(included.position.path, [0]);
      assert.deepStrictEqual(included.attributes.get("href"), {
        lexical: " a.xml ",
        processed: "a.xml",
        whiteSpace: "collapse",
      });
      assert.deepStrictEqual(included.attributes.get("accept-language"), {
        lexical: " en ",
        processed: " en ",
        whiteSpace: "preserve",
      });
      if (included.kind !== "xi:include") {
        assert.fail("an include");
      }

      assert.deepStrictEqual(childSummary(Option.getOrThrow(included.fallback)), ["fallback"]);
      assert.deepStrictEqual(ruleAt(ast, 1).position.path, [1]);
    }),
  );

  suite.effect("reads each attribute under its whiteSpace class, lexical and processed", () =>
    Effect.gen(function* classes() {
      const ast = yield* parseBody(
        `<qti-set-outcome-value identifier=" X ">
           <qti-equal tolerance=" 0.5   1 " include-lower-bound=" true " tolerance-mode="absolute">
             <qti-inside shape="poly" coords="1,2&#9;3,4&#10;5,6"><qti-null/></qti-inside>
             <qti-null/>
           </qti-equal>
         </qti-set-outcome-value>`,
      );
      assert.deepStrictEqual(ruleAt(ast, 0).attributes.get("identifier"), {
        lexical: " X ",
        processed: "X",
        whiteSpace: "collapse",
      });

      const equal = firstExpression(ast);
      assert.deepStrictEqual(equal.attributes.get("tolerance"), {
        lexical: " 0.5   1 ",
        processed: "0.5 1",
        whiteSpace: "collapse",
      });
      assert.strictEqual(equal.attributes.get("include-lower-bound")?.processed, "true");
      assert.strictEqual(equal.attributes.get("tolerance-mode")?.whiteSpace, "preserve");

      const [inside] = equal.operands;
      assert.isDefined(inside);
      assert.strictEqual(inside.attributes.get("shape")?.whiteSpace, "preserve");
      assert.strictEqual(inside.attributes.get("coords")?.whiteSpace, "replace");
      assert.strictEqual(inside.attributes.get("coords")?.processed, "1,2 3,4 5,6");
    }),
  );

  suite.effect("keeps a qti-base-value's text and entity text as read, and skips comments", () =>
    Effect.gen(function* baseValue() {
      const ast = yield* parseBody(
        `<qti-set-outcome-value identifier="S"><qti-base-value base-type="string"> a<!--c--><?pi x?>b &amp; </qti-base-value></qti-set-outcome-value>`,
      );
      const value = firstExpression(ast);
      assert.strictEqual(value.element.local, "qti-base-value");
      assert.deepStrictEqual(value.text, Option.some(" ab & "));
      assert.deepStrictEqual(value.operands, []);

      const other = yield* parseBody(
        `<qti-set-outcome-value identifier="S"><qti-null/></qti-set-outcome-value>`,
      );
      assert.deepStrictEqual(firstExpression(other).text, Option.none());
    }),
  );

  suite.effect("refuses an element outside the vocabulary under a rule host, naming it", () =>
    Effect.gen(function* foreignElement() {
      const refusal = yield* refusalOf(parseBody(`<qti-foo/>`));
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "element");
      assert.strictEqual(refusal.name, "qti-foo");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-response-processing"));
    }),
  );

  suite.effect("refuses a non-expression element under an expression, naming it", () =>
    Effect.gen(function* ruleUnderExpression() {
      const refusal = yield* refusalOf(
        parseBody(
          `<qti-set-outcome-value identifier="S"><qti-not><qti-exit-response/></qti-not></qti-set-outcome-value>`,
        ),
      );
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.name, "qti-exit-response");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-not"));
    }),
  );

  suite.effect("refuses a second expression under a holder and a child a leaf cannot take", () =>
    Effect.gen(function* contentModel() {
      const second = yield* refusalOf(
        parseBody(
          `<qti-set-outcome-value identifier="S"><qti-null/><qti-null/></qti-set-outcome-value>`,
        ),
      );
      assert.strictEqual(second.name, "qti-null");
      assert.deepStrictEqual(second.parent, Option.some("qti-set-outcome-value"));

      const leaf = yield* refusalOf(
        parseBody(`<qti-exit-response><qti-null/></qti-exit-response>`),
      );
      assert.strictEqual(leaf.name, "qti-null");
      assert.deepStrictEqual(leaf.parent, Option.some("qti-exit-response"));
    }),
  );

  suite.effect("refuses an element in the wrong namespace and an attribute outside the kind", () =>
    Effect.gen(function* strays() {
      const elementRefusal = yield* refusalOf(
        parseBody(`<qti-set-outcome-value xmlns="urn:other" identifier="S"/>`),
      );
      assert.instanceOf(elementRefusal, UnmodeledVocabulary);
      assert.strictEqual(elementRefusal.kind, "element");

      const attributeRefusal = yield* refusalOf(
        parseBody(
          `<qti-set-outcome-value identifier="S" bogus="1"><qti-null/></qti-set-outcome-value>`,
        ),
      );
      assert.instanceOf(attributeRefusal, UnmodeledVocabulary);
      assert.strictEqual(attributeRefusal.kind, "attribute");
      assert.strictEqual(attributeRefusal.name, "bogus");
      assert.deepStrictEqual(attributeRefusal.parent, Option.some("qti-set-outcome-value"));

      const ofAnotherKind = yield* refusalOf(
        parseBody(
          `<qti-set-outcome-value identifier="S" figures="3"><qti-null/></qti-set-outcome-value>`,
        ),
      );
      assert.strictEqual(ofAnotherKind.name, "figures");
    }),
  );

  suite.effect("admits xsi:schemaLocation and namespace declarations on any element", () =>
    Effect.gen(function* declarations() {
      const ast = yield* parseBody(
        `<qti-exit-response xmlns:x="urn:x" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="a b"/>`,
      );
      assert.strictEqual(ast.rules.length, 1);
      assert.strictEqual(ruleAt(ast, 0).element.local, "qti-exit-response");
    }),
  );
});
