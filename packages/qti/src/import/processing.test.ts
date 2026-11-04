/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute `qti-inside` names, the region kind, not a structure. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { ProcessingGuardRefusal, processingGuards } from "#qti/import/guards/processing.ts";
import { itemRows } from "#qti/import/item.ts";
import { documentRows, readRows } from "#qti/import/package.ts";
import { ProcessingRefused, processingRows } from "#qti/import/processing.ts";
import type { ProcessingInput } from "#qti/import/processing.ts";
import { ImportRefused, ruleOfError } from "#qti/import/refusal.ts";
import { rptemplateRows } from "#qti/import/rptemplate.ts";
import { Rows, treeRows } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import type { Language } from "#qti/processing/ast.ts";
import { emptyEnvironment, environmentOf, withDeclarations } from "#qti/processing/env.ts";
import type { DeclarationEntry, Environment, Mode } from "#qti/processing/env.ts";
import { corpusPackage, materializeProcessing } from "#qti/processing/fixtures.ts";
import {
  CustomOperatorClassName,
  CustomOperatorDefinitionUri,
  ExpressionCoords,
  ExpressionIntegerOrVariable,
  ManifestIdentifier,
  PackagePath,
  RecordFieldIdentifier,
  VariableReference,
  XIncludeUri,
} from "#qti/schema/contracts.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#qti/schema/document.ts";
import * as expression from "#qti/schema/expression.ts";
import * as attributed from "#qti/schema/expression-attributes.ts";
import { expressionKinds } from "#qti/schema/kinds/asi.ts";
import { AttributeLexical, AttributeSpelling, Edge, TextNode } from "#qti/schema/node.ts";
import type { NodeKindHandle, RootKindHandle } from "#qti/schema/node.ts";
import * as processing from "#qti/schema/processing.ts";
import * as ruleSchema from "#qti/schema/rule.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * The committed processing fixtures, relative to `packages/qti`, where the tests run.
 */
const fixtures = "src/processing/fixtures";

const asiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Every element of a subtree, the root included, in document order.
 */
const elementsOf = (element: Element): readonly Element[] => [
  element,
  ...element.children.flatMap((child) => (child.kind === "element" ? elementsOf(child) : [])),
];

/**
 * The value of an attribute an element carries, as read.
 */
const attributeOf = (element: Element, name: string): string | undefined =>
  element.attributes.find((a) => a.namespace === "" && a.local === name)?.value;

/**
 * Whether an element is a response or outcome processing root.
 */
const isProcessingRoot = (element: Element): boolean =>
  /^qti-(?:response|outcome)-processing$/u.test(element.local);

/**
 * The `qti-*-processing` element of a document: its root, or the first child of the root that is
 * one.
 */
const processingElement = (doc: XmlDocument, local?: string): Element => {
  if (local !== undefined) {
    return (
      elementsOf(doc.root).find((element) => element.local === local) ??
      assert.fail(`the document has no ${local}`)
    );
  }

  if (isProcessingRoot(doc.root)) {
    return doc.root;
  }

  const found = doc.root.children.find((c) => c.kind === "element" && isProcessingRoot(c));

  return found?.kind === "element" ? found : assert.fail("the document has no processing root");
};

/**
 * A tree read, its tree rows written, and the processing input over it.
 */
interface Prepared {
  readonly doc: XmlDocument;
  readonly input: ProcessingInput;
  readonly nodes: NodeIndex;
  readonly rows: Rows;
}

/**
 * Write the tree rows of a decoded document and build the input of `processingRows` over its
 * processing root.
 */
const prepare = (
  doc: XmlDocument,
  options: {
    readonly env?: Environment;
    readonly language: Language;
    readonly mode: Mode;
    readonly root?: string;
    readonly rootKind: RootKindHandle;
  },
) =>
  Effect.gen(function* prepareDocument() {
    const tree = crypto.randomUUID();
    const built = yield* treeRows(
      doc,
      {
        charset: doc.charset,
        id: tree,
        kind: "document",
        root: options.rootKind,
        version: "3.0.0",
      },
      Rows.empty(),
    );
    const input: ProcessingInput = {
      document: tree,
      env: options.env ?? environmentOf(doc, options.mode),
      language: options.language,
      mode: options.mode,
      nodes: built.nodes,
      root: processingElement(doc, options.root),
      rootKind: options.rootKind,
      tree,
      version: "3.0.0",
    };
    const prepared: Prepared = { doc, input, nodes: built.nodes, rows: built.rows };

    return prepared;
  });

/**
 * Read a fixture and prepare it.
 */
const prepareFixture = (directory: string, name: string, options: Parameters<typeof prepare>[1]) =>
  Effect.gen(function* prepareFixtureFile() {
    const fs = yield* FileSystem.FileSystem;
    const doc = yield* readXml(yield* fs.readFile(path.join(fixtures, directory, `${name}.xml`)));

    return yield* prepare(doc, options);
  });

/**
 * Prepare a processing tree written as a string, under an item-shaped `qti-response-processing`.
 */
const prepareBody = (body: string, options: Parameters<typeof prepare>[1], attributes = "") =>
  Effect.gen(function* prepareBodyText() {
    const text = `<qti-response-processing xmlns="${asiNamespace}"${attributes}>${body}</qti-response-processing>`;

    return yield* prepare(yield* readXml(new TextEncoder().encode(text)), options);
  });

/**
 * A `qti-equal-rounded` whose `figures` is the text given, prepared for the writer.
 */
const equalRoundedOver = (figures: string) =>
  prepareBody(
    `<qti-set-outcome-value identifier="SCORE"><qti-equal-rounded rounding-mode="decimalPlaces" figures="${figures}"><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-equal-rounded></qti-set-outcome-value>`,
    { language: "response", mode: "test", rootKind: "item" },
  );

const itemOptions = { language: "response", mode: "item", rootKind: "item" } as const;

/**
 * Order two values by their text, for sets of rows that are arrays.
 */
const byText = (a: readonly string[], b: readonly string[]): number =>
  a.join("|").localeCompare(b.join("|"));

/**
 * The identity of an operand or edge row: the child and its position.
 */
const key = (row: { readonly child: string; readonly position: bigint }): string =>
  `${row.child}@${row.position}`;

/**
 * The ids of an arm's rows, sorted: every arm of the expression modules is keyed by `id`.
 */
const armIds = (rows: Rows, relation: AnyRelation): readonly string[] =>
  Rows.of(rows, relation)
    .flatMap((row) => Object.entries(row).filter(([name]) => name === "id"))
    .map(([, id]) => String(id))
    .toSorted();

/**
 * The rows of one relation.
 */
const of = <R extends AnyRelation>(rows: Rows, relation: R): readonly Fact<R>[] =>
  Rows.of(rows, relation);

/**
 * The ids of the rows of a relation keyed by `id`, sorted.
 */
const idsOfRows = (rows: readonly { readonly id: string }[]) => rows.map((r) => r.id).toSorted();

/**
 * The ids of the elements of the processing root whose local name is one of `kinds`, sorted.
 */
const idsOfKinds = (prepared: Prepared, kinds: readonly string[]) =>
  elementsOf(prepared.input.root)
    .filter((element) => kinds.includes(element.local))
    .map(
      (element) => prepared.nodes.get(element)?.id ?? assert.fail(`${element.local} has no node`),
    )
    .toSorted();

/**
 * The id of the `index`th element of a kind under the processing root, in document order.
 */
const idAt = (prepared: Prepared, kind: string, index = 0): string => {
  const element = elementsOf(prepared.input.root).filter((e) => e.local === kind)[index];

  return (
    (element === undefined ? undefined : prepared.nodes.get(element)?.id) ??
    assert.fail(`no ${kind} at ${index}`)
  );
};

/**
 * Run `processingRows` over a prepared document.
 */
const processed = (prepared: Prepared) => processingRows(prepared.input, prepared.rows);

/**
 * The first rule a refused run names, with the rows it never returned.
 */
const refusal = (prepared: Prepared) =>
  Effect.gen(function* refusedRun() {
    const failure = yield* Effect.flip(processed(prepared));
    assert.instanceOf(failure, ProcessingRefused);

    return failure;
  });

const seededMin = new Map(operatorArity.map((entry) => [entry.kind, entry.min]));

const seededMax = new Map(operatorArityMax.map((entry) => [entry.kind, entry.max]));

/**
 * The thin and attributed expression arms: each kind's relation, keyed by `NodeKind` handle.
 */
const expressionArms: ReadonlyMap<string, AnyRelation> = new Map(
  Object.entries({ ...expression.arms, ...attributed.arms }),
);

/**
 * A declaration entry of a single float outcome named `identifier`.
 */
const outcomeOf = (identifier: string, baseType: "boolean" | "float" | "integer") => {
  const entry: DeclarationEntry = {
    areaMapping: false,
    identifier,
    interpolationTable: false,
    kind: "outcome",
    mapping: false,
    matchTable: false,
    mathVariable: false,
    paramVariable: false,
    type: { baseType, cardinality: "single" },
  };

  return entry;
};

/**
 * A value-setting rule holding one expression of `kind` with the given attributes.
 */
const ruleOf = (kind: string, attributes: readonly (readonly [string, string])[]): string =>
  `<qti-set-outcome-value identifier="O"><${kind}${attributes
    .map(([name, value]) => ` ${name}="${value}"`)
    .join("")}/></qti-set-outcome-value>`;

/**
 * The rule kinds that hold exactly one expression, by processing language: each is a holder of a
 * `RuleOperand` row, an `else` is not.
 */
const responseHolders = [
  "qti-set-outcome-value",
  "qti-lookup-outcome-value",
  "qti-response-if",
  "qti-response-else-if",
] as const;

const outcomeHolders = [
  "qti-set-outcome-value",
  "qti-lookup-outcome-value",
  "qti-outcome-if",
  "qti-outcome-else-if",
] as const;

const templateHolders = [
  "qti-set-template-value",
  "qti-set-default-value",
  "qti-set-correct-response",
  "qti-template-constraint",
  "qti-template-if",
  "qti-template-else-if",
] as const;

/**
 * The node id of an element.
 */
const nodeIdOf = (prepared: Prepared, element: Element): string =>
  prepared.nodes.get(element)?.id ?? assert.fail(`${element.local} has no node`);

/**
 * The first element of a kind under the processing root.
 */
const elementOf = (prepared: Prepared, kind: string): Element =>
  elementsOf(prepared.input.root).find((element) => element.local === kind) ??
  assert.fail(`no ${kind}`);

/**
 * The node id of the element an element hangs under.
 */
const conditionIdOf = (prepared: Prepared, element: Element): string => {
  const parent = elementsOf(prepared.input.root).find((candidate) =>
    candidate.children.includes(element),
  );

  return parent === undefined
    ? assert.fail(`${element.local} has no parent`)
    : nodeIdOf(prepared, parent);
};

/**
 * The `RuleOperand` rows the document's own shape asks for, in the order the tests compare them:
 * each holder's first element child is its expression, at its index among the holder's children.
 */
const holderRows = (prepared: Prepared, holders: readonly string[]): readonly string[] =>
  elementsOf(prepared.input.root)
    .filter((element) => holders.includes(element.local))
    .map((holder) => {
      const expressionElement =
        holder.children.find((child) => child.kind === "element") ?? assert.fail(holder.local);

      return `${nodeIdOf(prepared, expressionElement)}@${holder.children.indexOf(expressionElement)}:${nodeIdOf(prepared, holder)}:${prepared.nodes.get(holder)?.kind}`;
    })
    .toSorted();

layer(NodeServices.layer, { excludeTestServices: true })("import/processing.ts", (suite) => {
  suite.effect("writes one Expression row per expression element with the seeded arity", () =>
    Effect.gen(function* expressionRowsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const expected = idsOfKinds(prepared, expressionKinds);
      const written = of(built, processing.Expression);
      assert.deepStrictEqual(idsOfRows(written), expected);
      assert.isAbove(expected.length, 100);
      for (const element of elementsOf(prepared.input.root)) {
        const node = prepared.nodes.get(element);
        if (node === undefined || !expressionKinds.some((kind) => kind === element.local)) {
          continue;
        }

        const row = written.find((candidate) => candidate.id === node.id);
        if (row === undefined) {
          assert.fail(`${node.kind} has no Expression row`);
        }

        assert.strictEqual(row.kind, node.kind);
        assert.strictEqual(row.document, prepared.input.tree);
        assert.strictEqual(row.min, seededMin.get(node.kind));
        assert.strictEqual(row.bounded, seededMax.has(node.kind) ? "bounded" : "unbounded");
      }
    }),
  );

  suite.effect("writes an ExpressionMax row for each bounded expression and for no other", () =>
    Effect.gen(function* maxRowsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const bounded = expressionKinds.filter((kind) => seededMax.has(kind));
      const unbounded = expressionKinds.filter((kind) => !seededMax.has(kind));
      const written = of(built, processing.ExpressionMax);
      assert.deepStrictEqual(idsOfRows(written), idsOfKinds(prepared, bounded));
      for (const row of written) {
        assert.strictEqual(row.max, seededMax.get(row.kind));
      }

      const unboundedIds = new Set(idsOfKinds(prepared, unbounded));
      assert.isTrue(unboundedIds.size > 0, "response.xml holds an unbounded expression");
      assert.isFalse(written.some((row) => unboundedIds.has(row.id)));
    }),
  );

  suite.effect("writes one Operand row per expression-under-expression edge", () =>
    Effect.gen(function* operandRowsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const expressions = new Set(idsOfKinds(prepared, expressionKinds));
      const edges = of(built, Edge).filter(
        (edge) => expressions.has(edge.child) && expressions.has(edge.parent),
      );
      const whitespaceUnderExpressions = of(built, Edge).filter(
        (edge) => edge.childKind === "ws" && expressions.has(edge.parent),
      );
      assert.isAbove(edges.length, 100);
      assert.isAbove(whitespaceUnderExpressions.length, 0);

      assert.deepStrictEqual(
        of(built, processing.Operand)
          .map((row) => `${key(row)}:${row.expression}`)
          .toSorted(),
        edges.map((edge) => `${key(edge)}:${edge.parent}`).toSorted(),
      );

      const whitespace = new Set(whitespaceUnderExpressions.map((edge) => edge.child));
      assert.isFalse(of(built, processing.Operand).some((row) => whitespace.has(row.child)));
    }),
  );

  suite.effect("writes one arm row per expression element of each kind", () =>
    Effect.gen(function* armRowsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const kinds = [...expressionArms.keys()].filter((kind) => kind !== "qti-base-value");
      assert.strictEqual(kinds.length, 63);
      for (const kind of kinds) {
        const relation = expressionArms.get(kind) ?? assert.fail(kind);
        assert.deepStrictEqual(armIds(built, relation), idsOfKinds(prepared, [kind]), kind);
      }

      assert.deepStrictEqual(
        idsOfRows(of(built, processing.Literal)),
        idsOfKinds(prepared, ["qti-base-value"]),
      );
    }),
  );

  suite.effect("writes each literal in the arm of its base type with its text as read", () =>
    Effect.gen(function* literalRowsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const literalArms = new Map<string, readonly { id: string; value: string }[]>([
        ["boolean", of(built, processing.relations.LiteralBoolean)],
        ["directedPair", of(built, processing.relations.LiteralDirectedPair)],
        ["duration", of(built, processing.relations.LiteralDuration)],
        ["file", of(built, processing.relations.LiteralFile)],
        ["float", of(built, processing.relations.LiteralFloat)],
        ["identifier", of(built, processing.relations.LiteralIdentifier)],
        ["integer", of(built, processing.relations.LiteralInteger)],
        ["pair", of(built, processing.relations.LiteralPair)],
        ["point", of(built, processing.relations.LiteralPoint)],
        ["string", of(built, processing.relations.LiteralString)],
        ["uri", of(built, processing.relations.LiteralUri)],
      ]);
      const literals = elementsOf(prepared.input.root).filter((e) => e.local === "qti-base-value");
      for (const element of literals) {
        const id = prepared.nodes.get(element)?.id ?? assert.fail("literal without a node");
        const baseType = attributeOf(element, "base-type") ?? assert.fail("literal without type");
        const row = of(built, processing.Literal).find((candidate) => candidate.id === id);
        assert.strictEqual(row?.baseType, baseType);

        const arm = (literalArms.get(baseType) ?? assert.fail(baseType)).find(
          (candidate) => candidate.id === id,
        );
        assert.deepStrictEqual(
          arm?.value,
          element.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
        );
      }
    }),
  );

  suite.effect("keeps the attributes of equal, equal-rounded and the random kinds", () =>
    Effect.gen(function* attributeRowsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const plain = idAt(prepared, "qti-equal", 0);
      const toleranced = idAt(prepared, "qti-equal", 1);
      const equals = of(built, attributed.Equal);
      assert.deepStrictEqual(
        equals.find((row) => row.id === plain),
        { id: plain, includeLowerBound: "true", includeUpperBound: "true", toleranceMode: "exact" },
      );
      assert.deepStrictEqual(
        equals.find((row) => row.id === toleranced),
        {
          id: toleranced,
          includeLowerBound: "true",
          includeUpperBound: "false",
          toleranceMode: "absolute",
        },
      );
      assert.deepStrictEqual(of(built, attributed.DeclaredToleranceMode), [{ node: toleranced }]);
      assert.deepStrictEqual(of(built, attributed.DeclaredIncludeLowerBound), [
        { node: toleranced },
      ]);
      assert.deepStrictEqual(of(built, attributed.DeclaredIncludeUpperBound), [
        { node: toleranced },
      ]);
      assert.deepStrictEqual(of(built, attributed.EqualTolerance), [
        { node: toleranced, toleranceMode: "absolute", value: "0.5 1" },
      ]);

      const byReference = idAt(prepared, "qti-equal-rounded", 0);
      const byNumber = idAt(prepared, "qti-equal-rounded", 1);
      const rounded = of(built, attributed.EqualRounded);
      assert.deepStrictEqual(
        rounded.find((row) => row.id === byReference),
        {
          figuresKind: "ref",
          figuresValue: 0n,
          id: byReference,
          roundingMode: "decimalPlaces",
        },
      );
      assert.deepStrictEqual(of(built, attributed.EqualRoundedFiguresRef), [
        { identifier: VariableReference("COUNT"), node: byReference },
      ]);
      assert.deepStrictEqual(
        rounded.find((row) => row.id === byNumber),
        {
          figuresKind: "literal",
          figuresValue: 3n,
          id: byNumber,
          roundingMode: "significantFigures",
        },
      );
      assert.deepStrictEqual(of(built, attributed.DeclaredRoundingMode), [{ node: byReference }]);

      const integer = idAt(prepared, "qti-random-integer");
      assert.deepStrictEqual(of(built, attributed.RandomInteger), [
        { id: integer, max: ExpressionIntegerOrVariable("10") },
      ]);
      assert.deepStrictEqual(of(built, attributed.RandomIntegerMin), [
        { node: integer, value: ExpressionIntegerOrVariable("0") },
      ]);
      assert.deepStrictEqual(of(built, attributed.RandomIntegerStep), [
        { node: integer, value: ExpressionIntegerOrVariable("2") },
      ]);

      const float = idAt(prepared, "qti-random-float");
      assert.deepStrictEqual(of(built, attributed.RandomFloat), [{ id: float, max: "1" }]);
      assert.deepStrictEqual(of(built, attributed.RandomFloatMin), [{ node: float, value: "0" }]);

      const anyN = idAt(prepared, "qti-any-n");
      assert.deepStrictEqual(of(built, attributed.AnyN), [
        {
          id: anyN,
          max: ExpressionIntegerOrVariable("COUNT"),
          min: ExpressionIntegerOrVariable("1"),
        },
      ]);
    }),
  );

  suite.effect("keeps the attributes of the remaining attributed kinds", () =>
    Effect.gen(function* remainingAttributesOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const id = (kind: string, index = 0) => idAt(prepared, kind, index);
      assert.deepStrictEqual(of(built, attributed.Inside), [
        { coords: ExpressionCoords("0,0,10,10"), id: id("qti-inside"), shape: "rect" },
      ]);
      assert.deepStrictEqual(of(built, attributed.StringMatch), [
        { caseSensitive: "true", id: id("qti-string-match"), substring: "false" },
      ]);
      assert.deepStrictEqual(of(built, attributed.DeclaredSubstring), [
        { node: id("qti-string-match") },
      ]);
      assert.deepStrictEqual(of(built, attributed.Substring), [
        { caseSensitive: "false", id: id("qti-substring") },
      ]);
      assert.deepStrictEqual(
        of(built, attributed.PatternMatch)
          .map((row) => row.pattern)
          .toSorted(),
        ["[a-z]+", "{NOTE}"],
      );
      assert.deepStrictEqual(
        of(built, attributed.MathConstant)
          .map((row) => row.name)
          .toSorted(),
        ["e", "pi"],
      );
      assert.deepStrictEqual(
        of(built, attributed.MathOperator)
          .map((row) => row.name)
          .toSorted(),
        ["ln", "signum"],
      );
      assert.deepStrictEqual(of(built, attributed.StatsOperator), [
        { id: id("qti-stats-operator"), name: "mean" },
      ]);
      assert.deepStrictEqual(of(built, attributed.RoundTo), [
        {
          figuresKind: "literal",
          figuresValue: 2n,
          id: id("qti-round-to"),
          roundingMode: "decimalPlaces",
        },
      ]);
      assert.deepStrictEqual(of(built, attributed.Index), [
        { id: id("qti-index"), nKind: "literal", nValue: 1n },
      ]);
      assert.deepStrictEqual(of(built, attributed.Repeat), [
        {
          id: id("qti-repeat"),
          numberRepeatsKind: "literal",
          numberRepeatsValue: 2n,
        },
      ]);
      assert.deepStrictEqual(of(built, attributed.FieldValue), [
        { fieldIdentifier: RecordFieldIdentifier("level"), id: id("qti-field-value") },
      ]);
      assert.deepStrictEqual(of(built, attributed.CustomOperatorClass), [
        { node: id("qti-custom-operator"), value: CustomOperatorClassName("com.example.Operator") },
      ]);
      assert.deepStrictEqual(of(built, attributed.CustomOperatorDefinition), [
        {
          node: id("qti-custom-operator"),
          value: CustomOperatorDefinitionUri("https://example.org/operators/custom"),
        },
      ]);
      assert.deepStrictEqual(of(built, AttributeLexical), []);
    }),
  );

  suite.effect("gives every referring expression and rule its VariableRef and arm", () =>
    Effect.gen(function* referencesOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const declarations = new Map(
        prepared.doc.root.children.flatMap((child) =>
          child.kind === "element" && attributeOf(child, "identifier") !== undefined
            ? [
                [
                  attributeOf(child, "identifier") ?? "",
                  child.local === "qti-response-declaration" ? "response" : "outcome",
                ] as const,
              ]
            : [],
        ),
      );
      const referrers = [
        "qti-variable",
        "qti-default",
        "qti-correct",
        "qti-map-response",
        "qti-map-response-point",
        "qti-set-outcome-value",
      ];
      const all = elementsOf(prepared.input.root).filter((e) => referrers.includes(e.local));
      assert.isAbove(all.length, 40);
      assert.deepStrictEqual(
        idsOfRows(of(built, processing.VariableRef)),
        idsOfKinds(prepared, referrers),
      );

      const declared = of(built, processing.DeclaredRef);
      const builtIn = of(built, processing.BuiltInRef);
      for (const element of all) {
        const node = prepared.nodes.get(element) ?? assert.fail("referrer without a node");
        const identifier = attributeOf(element, "identifier") ?? "";
        const kind = declarations.get(identifier);
        const ref = of(built, processing.VariableRef).find((row) => row.id === node.id);
        if (ref === undefined) {
          assert.fail(`${identifier} has no VariableRef`);
        }

        if (kind === undefined) {
          const row = builtIn.find((candidate) => candidate.id === node.id);
          assert.strictEqual(ref.kind, "builtIn", identifier);
          assert.deepStrictEqual(row, { id: node.id, name: identifier, referrerKind: node.kind });
        } else {
          const row = declared.find((candidate) => candidate.id === node.id);
          assert.strictEqual(ref.kind, "declared", identifier);
          assert.deepStrictEqual(row, {
            declarationKind: kind,
            document: prepared.input.document,
            id: node.id,
            identifier,
            referrerKind: node.kind,
          });
        }

        assert.strictEqual(ref.document, prepared.input.tree);
      }

      const completion = builtIn.filter((row) => row.name === "completionStatus");
      assert.deepStrictEqual(
        completion.map((row) => row.referrerKind),
        ["qti-set-outcome-value", "qti-set-outcome-value"],
      );
      assert.deepStrictEqual(
        builtIn.filter((row) => row.name === "QTI_CONTEXT").map((row) => row.referrerKind),
        ["qti-variable"],
      );
    }),
  );

  suite.effect("keeps the lexical form of the four padded attributes and no other", () =>
    Effect.gen(function* paddedAttributes() {
      const prepared = yield* prepareFixture("guards", "padded-processing", itemOptions);
      const built = yield* processed(prepared);
      const id = (kind: string) => idAt(prepared, kind);
      assert.deepStrictEqual(
        of(built, AttributeLexical)
          .map((row) => [row.kind, row.attribute, row.value])
          .toSorted(byText),
        [
          ["qti-correct", "identifier", " R "],
          ["qti-equal", "tolerance", "0.5  1"],
          ["qti-equal-rounded", "figures", " 3"],
          ["qti-string-match", "case-sensitive", " true"],
        ].toSorted(byText),
      );
      for (const row of of(built, AttributeLexical)) {
        assert.strictEqual(
          row.node,
          id(row.kind),
          `the lexical row of ${row.kind} names that node`,
        );
      }

      assert.deepStrictEqual(
        of(built, processing.DeclaredRef).filter((r) => r.id === id("qti-correct")),
        [
          {
            declarationKind: "response",
            document: prepared.input.document,
            id: id("qti-correct"),
            identifier: "R",
            referrerKind: "qti-correct",
          },
        ],
      );
      assert.deepStrictEqual(of(built, attributed.EqualTolerance), [
        { node: id("qti-equal"), toleranceMode: "absolute", value: "0.5 1" },
      ]);
      assert.deepStrictEqual(of(built, attributed.StringMatch), [
        { caseSensitive: "true", id: id("qti-string-match"), substring: "false" },
      ]);
      assert.deepStrictEqual(of(built, attributed.EqualRounded), [
        {
          figuresKind: "literal",
          figuresValue: 3n,
          id: id("qti-equal-rounded"),
          roundingMode: "significantFigures",
        },
      ]);
      assert.deepStrictEqual(of(built, attributed.PatternMatch), [
        { id: id("qti-pattern-match"), pattern: " a" },
      ]);
    }),
  );

  suite.effect("keeps a plus-signed figures as its number, its spelling and no reference", () =>
    Effect.gen(function* plusSigned() {
      const prepared = yield* equalRoundedOver("+3");
      const built = yield* processed(prepared);
      const node = idAt(prepared, "qti-equal-rounded");
      assert.deepStrictEqual(of(built, attributed.EqualRounded), [
        { figuresKind: "literal", figuresValue: 3n, id: node, roundingMode: "decimalPlaces" },
      ]);
      assert.deepStrictEqual(of(built, attributed.EqualRoundedFiguresRef), []);
      assert.deepStrictEqual(
        of(built, AttributeSpelling).map((row) => [row.node, row.attribute, row.value]),
        [[node, "figures", "+3"]],
      );
    }),
  );

  suite.effect("keeps a figures that names a variable as one reference row and the number 0", () =>
    Effect.gen(function* digits() {
      const prepared = yield* equalRoundedOver("digits");
      const built = yield* processed(prepared);
      const node = idAt(prepared, "qti-equal-rounded");
      assert.deepStrictEqual(of(built, attributed.EqualRounded), [
        { figuresKind: "ref", figuresValue: 0n, id: node, roundingMode: "decimalPlaces" },
      ]);
      assert.deepStrictEqual(of(built, attributed.EqualRoundedFiguresRef), [
        { identifier: VariableReference("digits"), node },
      ]);
      assert.deepStrictEqual(of(built, AttributeSpelling), []);
    }),
  );

  suite.effect("refuses a figures that is neither an integer nor a variable before any row", () =>
    Effect.gen(function* notAnInteger() {
      const prepared = yield* equalRoundedOver("3x");
      const failure = yield* Effect.flip(processed(prepared));
      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "attribute-lexical");
    }),
  );

  suite.effect("refuses a qti-index n and a qti-repeat number-repeats that is no integer", () =>
    Effect.gen(function* notAnIntegerCount() {
      for (const body of [
        `<qti-index n="2.5"><qti-variable identifier="RESPONSE"/></qti-index>`,
        `<qti-repeat number-repeats="2.5"><qti-base-value base-type="integer">1</qti-base-value></qti-repeat>`,
      ]) {
        const prepared = yield* prepareBody(
          `<qti-set-outcome-value identifier="SCORE">${body}</qti-set-outcome-value>`,
          { language: "response", mode: "test", rootKind: "item" },
        );
        const failure = yield* Effect.flip(processed(prepared));
        assert.instanceOf(failure, ImportRefused);
        assert.strictEqual(failure.rule, "P6");
      }
    }),
  );

  suite.effect("refuses a padded reference in a mixed union as a literal that is no integer", () =>
    Effect.gen(function* paddedReference() {
      const prepared = yield* prepareBody(
        `<qti-set-outcome-value identifier="SCORE"><qti-equal-rounded rounding-mode="decimalPlaces" figures=" COUNT "><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-equal-rounded></qti-set-outcome-value>`,
        { language: "response", mode: "test", rootKind: "item" },
      );
      const failure = yield* Effect.flip(processed(prepared));
      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "attribute-lexical");
    }),
  );

  suite.effect(
    "refuses a closed attribute outside its roster under P6 before any row is written",
    () =>
      Effect.gen(function* outsideRoster() {
        const floats =
          '<qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value>';
        const cases: readonly (readonly [string, string])[] = [
          [
            "tolerance-mode approximate",
            `<qti-equal tolerance-mode="approximate">${floats}</qti-equal>`,
          ],
          [
            "equal-rounded rounding-mode",
            `<qti-equal-rounded rounding-mode="places" figures="2">${floats}</qti-equal-rounded>`,
          ],
          [
            "round-to rounding-mode",
            '<qti-round-to rounding-mode="places" figures="2"><qti-base-value base-type="float">1.5</qti-base-value></qti-round-to>',
          ],
          [
            "inside shape",
            '<qti-inside shape="square" coords="0,0,5,5"><qti-base-value base-type="point">1 1</qti-base-value></qti-inside>',
          ],
          ["math-constant name", '<qti-math-constant name="tau"/>'],
          [
            "math-operator name",
            '<qti-math-operator name="sign"><qti-base-value base-type="float">1</qti-base-value></qti-math-operator>',
          ],
          [
            "stats-operator name",
            '<qti-stats-operator name="median"><qti-variable identifier="LIST"/></qti-stats-operator>',
          ],
          [
            "test-variables base-type with padding",
            '<qti-sum><qti-test-variables variable-identifier="SCORE" base-type=" integer "/></qti-sum>',
          ],
        ];
        for (const [name, operator] of cases) {
          const prepared = yield* prepareBody(
            `<qti-set-outcome-value identifier="SCORE">${operator}</qti-set-outcome-value>`,
            { language: "outcome", mode: "test", rootKind: "test" },
          );
          const failure = yield* Effect.flip(processed(prepared));
          assert.instanceOf(failure, ImportRefused, name);
          assert.strictEqual(failure.rule, "P6", name);
        }
      }),
  );

  suite.effect("refuses an xs:boolean attribute outside its roster under attribute-lexical", () =>
    Effect.gen(function* outsideBoolean() {
      const floats =
        '<qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value>';
      const strings =
        '<qti-base-value base-type="string">a</qti-base-value><qti-base-value base-type="string">b</qti-base-value>';
      const cases: readonly (readonly [string, string])[] = [
        [
          "include-lower-bound",
          `<qti-equal tolerance-mode="exact" include-lower-bound="yes">${floats}</qti-equal>`,
        ],
        [
          "include-upper-bound",
          `<qti-equal tolerance-mode="exact" include-upper-bound="no">${floats}</qti-equal>`,
        ],
        [
          "string-match case-sensitive",
          `<qti-string-match case-sensitive="yes">${strings}</qti-string-match>`,
        ],
        [
          "string-match substring",
          `<qti-string-match case-sensitive="true" substring="maybe">${strings}</qti-string-match>`,
        ],
        [
          "substring case-sensitive",
          `<qti-substring case-sensitive="yes">${strings}</qti-substring>`,
        ],
      ];
      for (const [name, operator] of cases) {
        const prepared = yield* prepareBody(
          `<qti-set-outcome-value identifier="SCORE">${operator}</qti-set-outcome-value>`,
          { language: "outcome", mode: "test", rootKind: "test" },
        );
        const failure = yield* Effect.flip(processed(prepared));
        assert.instanceOf(failure, ImportRefused, name);
        assert.strictEqual(failure.rule, "attribute-lexical", name);
      }
    }),
  );

  suite.effect("refuses an xi:include parse outside xml and text under P6", () =>
    Effect.gen(function* outsideParse() {
      const prepared = yield* prepareBody(
        '<xi:include href="shared-rules.xml" parse="binary"/>',
        itemOptions,
        ' xmlns:xi="http://www.w3.org/2001/XInclude"',
      );
      const failure = yield* Effect.flip(processed(prepared));
      assert.instanceOf(failure, ImportRefused);
      assert.strictEqual(failure.rule, "P6");
    }),
  );

  suite.effect(
    "refuses a tolerance-mode that is padded, as the importer case the lease case was",
    () =>
      Effect.gen(function* paddedMode() {
        const prepared = yield* prepareBody(
          '<qti-set-outcome-value identifier="SCORE"><qti-equal tolerance-mode=" exact"><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-equal></qti-set-outcome-value>',
          { language: "outcome", mode: "test", rootKind: "test" },
        );
        const failure = yield* Effect.flip(processed(prepared));
        assert.instanceOf(failure, ImportRefused);
        assert.strictEqual(failure.rule, "P6");
      }),
  );

  suite.effect("refuses a missing identifier naming P5 before any row", () =>
    Effect.gen(function* missingIdentifier() {
      const prepared = yield* prepareFixture("guards", "missing-identifier", itemOptions);
      const failure = yield* refusal(prepared);
      assert.strictEqual(failure.rule, "P5");
      assert.include(failure.detail, "qti-correct");
      assert.include(failure.detail, "identifier");
    }),
  );

  suite.effect("refuses an undeclared reference in item mode naming P8", () =>
    Effect.gen(function* undeclaredReference() {
      const prepared = yield* prepareFixture("broken", "undeclared-reference", itemOptions);
      const failure = yield* refusal(prepared);
      assert.strictEqual(failure.rule, "P8");
      assert.include(failure.detail, "qti-variable");
    }),
  );

  suite.effect("refuses each required attribute that is absent naming P5", () =>
    Effect.gen(function* requiredAttributes() {
      const required: readonly (readonly [string, readonly (readonly [string, string])[]])[] = [
        ["qti-correct", [["identifier", "R"]]],
        ["qti-default", [["identifier", "R"]]],
        ["qti-variable", [["identifier", "R"]]],
        ["qti-map-response", [["identifier", "R"]]],
        ["qti-map-response-point", [["identifier", "R"]]],
        ["qti-base-value", [["base-type", "integer"]]],
        [
          "qti-any-n",
          [
            ["min", "1"],
            ["max", "2"],
          ],
        ],
        ["qti-random-integer", [["max", "2"]]],
        ["qti-random-float", [["max", "2"]]],
        ["qti-equal-rounded", [["figures", "2"]]],
        [
          "qti-round-to",
          [
            ["figures", "2"],
            ["rounding-mode", "decimalPlaces"],
          ],
        ],
        ["qti-index", [["n", "1"]]],
        ["qti-repeat", [["number-repeats", "1"]]],
        ["qti-field-value", [["field-identifier", "f"]]],
        [
          "qti-inside",
          [
            ["shape", "rect"],
            ["coords", "0,0,1,1"],
          ],
        ],
        ["qti-math-constant", [["name", "pi"]]],
        ["qti-math-operator", [["name", "ln"]]],
        ["qti-stats-operator", [["name", "mean"]]],
        ["qti-pattern-match", [["pattern", "a"]]],
        ["qti-substring", [["case-sensitive", "true"]]],
        ["qti-string-match", [["case-sensitive", "true"]]],
        ["qti-outcome-minimum", [["outcome-identifier", "O"]]],
        ["qti-outcome-maximum", [["outcome-identifier", "O"]]],
        ["qti-test-variables", [["variable-identifier", "O"]]],
      ];
      for (const [kind, attributes] of required) {
        for (const [omitted] of attributes) {
          const prepared = yield* prepareBody(
            ruleOf(
              kind,
              attributes.filter(([name]) => name !== omitted),
            ),
            { language: "outcome", mode: "test", rootKind: "item" },
          );
          const failure = yield* refusal(prepared);
          assert.strictEqual(failure.rule, "P5", `${kind} without ${omitted}`);
          assert.include(failure.detail, kind);
          assert.include(failure.detail, omitted);
        }
      }
    }),
  );

  suite.effect("refuses a rule that names no variable naming P5", () =>
    Effect.gen(function* ruleWithoutIdentifier() {
      const prepared = yield* prepareBody(
        `<qti-set-outcome-value><qti-null/></qti-set-outcome-value>`,
        itemOptions,
      );
      const failure = yield* refusal(prepared);
      assert.strictEqual(failure.rule, "P5");
      assert.include(failure.detail, "qti-set-outcome-value");
    }),
  );

  suite.effect("refuses a type error through the checker, naming its rule", () =>
    Effect.gen(function* checkedRule() {
      const prepared = yield* prepareFixture("broken", "p21-sum-as-condition", itemOptions);
      const failure = yield* refusal(prepared);
      assert.strictEqual(failure.rule, "P21");
    }),
  );

  suite.effect("writes the outcome-only kinds of outcome.xml under a test environment", () =>
    Effect.gen(function* outcomeKinds() {
      const env = withDeclarations(emptyEnvironment("test"), [
        outcomeOf("TOTAL", "float"),
        outcomeOf("MAXTOTAL", "float"),
        outcomeOf("COUNT", "integer"),
        outcomeOf("PASSED", "boolean"),
      ]);
      const prepared = yield* prepareFixture("valid", "outcome", {
        env,
        language: "outcome",
        mode: "test",
        rootKind: "test",
      });
      const built = yield* processed(prepared);
      const maximum = idAt(prepared, "qti-outcome-maximum");
      const minimum = idAt(prepared, "qti-outcome-minimum");
      assert.deepStrictEqual(
        of(built, attributed.OutcomeMinMax)
          .map((row) => [row.id, row.kind, row.outcomeIdentifier])
          .toSorted(byText),
        [
          [maximum, "qti-outcome-maximum", "SCORE"],
          [minimum, "qti-outcome-minimum", "SCORE"],
        ].toSorted(byText),
      );
      assert.deepStrictEqual(of(built, attributed.OutcomeMaximumArm), [{ id: maximum }]);
      assert.deepStrictEqual(of(built, attributed.OutcomeMinimumArm), [{ id: minimum }]);

      const valuesOf = (name: string, except = "") =>
        elementsOf(prepared.input.root)
          .filter((element) => element.local !== except)
          .flatMap((element) => attributeOf(element, name) ?? [])
          .toSorted();
      const nodesWith = (name: string) =>
        elementsOf(prepared.input.root)
          .filter((element) => attributeOf(element, name) !== undefined)
          .map((element) => prepared.nodes.get(element)?.id ?? assert.fail("no node"))
          .toSorted();
      assert.deepStrictEqual(
        of(built, attributed.ExpressionWeightIdentifier)
          .map((row) => row.node)
          .toSorted(),
        nodesWith("weight-identifier"),
      );

      const testVariables = idAt(prepared, "qti-test-variables");
      assert.deepStrictEqual(of(built, attributed.TestVariables), [
        { id: testVariables, variableIdentifier: VariableReference("SCORE") },
      ]);
      assert.deepStrictEqual(of(built, attributed.TestVariablesBaseType), [
        { node: testVariables, value: "float" },
      ]);
      assert.deepStrictEqual(
        of(built, expression.ExpressionSectionIdentifier)
          .map((row) => row.value)
          .toSorted(),
        valuesOf("section-identifier"),
      );
      assert.deepStrictEqual(
        of(built, expression.ExpressionIncludeCategory)
          .map((row) => row.value)
          .toSorted(),
        valuesOf("include-category"),
      );
      assert.deepStrictEqual(
        of(built, expression.ExpressionExcludeCategory)
          .map((row) => row.value)
          .toSorted(),
        valuesOf("exclude-category"),
      );
      assert.deepStrictEqual(
        idsOfRows(of(built, expression.NumberCorrect)),
        idsOfKinds(prepared, ["qti-number-correct"]),
      );
    }),
  );

  suite.effect("writes TemplateParameterRef rows for names a template document leaves open", () =>
    Effect.gen(function* templateParameters() {
      const prepared = yield* prepareBody(
        `<qti-set-outcome-value identifier="SCORE"><qti-variable identifier="RESPONSE"/></qti-set-outcome-value>`,
        {
          env: emptyEnvironment("template"),
          language: "response",
          mode: "template",
          rootKind: "rptemplate",
        },
      );
      const built = yield* processed(prepared);
      const variable = idAt(prepared, "qti-variable");
      const rule = idAt(prepared, "qti-set-outcome-value");
      assert.deepStrictEqual(
        of(built, processing.TemplateParameterRef)
          .map((row) => row)
          .toSorted((a, b) => a.identifier.localeCompare(b.identifier)),
        [
          {
            document: prepared.input.tree,
            id: variable,
            identifier: "RESPONSE",
            referrerKind: "qti-variable",
            rootKind: "rptemplate",
          },
          {
            document: prepared.input.tree,
            id: rule,
            identifier: "SCORE",
            referrerKind: "qti-set-outcome-value",
            rootKind: "rptemplate",
          },
        ],
      );
      assert.deepStrictEqual(
        of(built, processing.VariableRef)
          .map((row) => row.kind)
          .toSorted(),
        ["templateParameter", "templateParameter"],
      );
      assert.deepStrictEqual(of(built, processing.DeclaredRef), []);
    }),
  );

  suite.effect("leaves the rows it was given in place and adds to them", () =>
    Effect.gen(function* keepsRows() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const before = of(prepared.rows, Edge).length;
      const built = yield* processed(prepared);
      assert.strictEqual(of(built, Edge).length, before);
      assert.strictEqual(of(prepared.rows, processing.Expression).length, 0);
    }),
  );

  suite.effect("keeps node kinds consistent with the node index", () =>
    Effect.gen(function* kindsAgree() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const kinds: ReadonlyMap<string, NodeKindHandle> = new Map(
        [...prepared.nodes.values()].map((entry) => [entry.id, entry.kind]),
      );
      for (const row of of(built, processing.DeclaredRef)) {
        assert.strictEqual(kinds.get(row.id), row.referrerKind);
      }

      for (const row of of(built, processing.Expression)) {
        assert.strictEqual(kinds.get(row.id), row.kind);
      }
    }),
  );
  suite.effect("writes one RuleOperand row per single-expression holder, none for an else", () =>
    Effect.gen(function* ruleOperandsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const expected = holderRows(prepared, responseHolders);
      assert.isAbove(expected.length, 14);
      assert.deepStrictEqual(
        of(built, ruleSchema.RuleOperand)
          .map((row) => `${key(row)}:${row.rule}:${row.ruleKind}`)
          .toSorted(),
        expected,
      );

      const elses = new Set(idsOfKinds(prepared, ["qti-response-else"]));
      assert.strictEqual(elses.size, 1);
      assert.isFalse(of(built, ruleSchema.RuleOperand).some((row) => elses.has(row.rule)));
    }),
  );

  suite.effect("writes the thin arm of each rule kind and a condition's branch arms", () =>
    Effect.gen(function* ruleArmsOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const thin = [
        ["qti-exit-response", ruleSchema.ExitResponse],
        ["qti-response-condition", ruleSchema.ResponseConditionArm],
        ["qti-response-else-if", ruleSchema.ResponseElseIfArm],
        ["qti-response-processing-fragment", ruleSchema.ResponseProcessingFragment],
        ["qti-set-outcome-value", ruleSchema.SetOutcomeValue],
      ] as const;
      for (const [kind, relation] of thin) {
        const ids = idsOfKinds(prepared, [kind]);
        assert.isAbove(ids.length, 0, kind);
        assert.deepStrictEqual(armIds(built, relation), ids, kind);
      }

      const branches = [
        ["qti-response-if", ruleSchema.ResponseIfArm],
        ["qti-response-else", ruleSchema.ResponseElseArm],
      ] as const;
      for (const [kind, relation] of branches) {
        const expected = elementsOf(prepared.input.root)
          .filter((element) => element.local === kind)
          .map((element) => `${nodeIdOf(prepared, element)}<${conditionIdOf(prepared, element)}`)
          .toSorted();
        assert.isAbove(expected.length, 0, kind);
        assert.deepStrictEqual(
          of(built, relation)
            .map((row) => `${row.id}<${row.condition}`)
            .toSorted(),
          expected,
          kind,
        );
      }

      assert.deepStrictEqual(of(built, ruleSchema.TemplateIfArm), []);
      assert.deepStrictEqual(of(built, ruleSchema.OutcomeIfArm), []);
    }),
  );

  suite.effect("writes the XInclude row, its attributes and its Fallback", () =>
    Effect.gen(function* xIncludeOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const include = idAt(prepared, "include");
      const fallback = idAt(prepared, "fallback");
      assert.deepStrictEqual(of(built, ruleSchema.XInclude), [{ id: include }]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeHref), [
        { node: include, value: XIncludeUri("shared-rules.xml") },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeParse), [
        { node: include, value: "xml" },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeXpointer), []);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeEncoding), []);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeAccept), []);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeAcceptLanguage), []);
      assert.deepStrictEqual(of(built, ruleSchema.Fallback), [{ id: fallback }]);

      const texts = new Map(of(built, TextNode).map((row) => [row.id, row.value]));
      const under = of(built, Edge)
        .filter((edge) => edge.parent === fallback)
        .map((edge) => texts.get(edge.child));
      assert.deepStrictEqual(under, ["fallback"]);
    }),
  );

  suite.effect("keeps the lexical form of a padded include href and the four strings as read", () =>
    Effect.gen(function* paddedInclude() {
      const prepared = yield* prepareBody(
        `<xi:include href=" rules.xml " parse=" text " xpointer=" p " encoding=" e " accept=" a " accept-language=" l " xmlns:xi="http://www.w3.org/2001/XInclude"/>`,
        itemOptions,
      );
      const built = yield* processed(prepared);
      const include = idAt(prepared, "include");
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeHref), [
        { node: include, value: XIncludeUri("rules.xml") },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeParse), [
        { node: include, value: "text" },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeXpointer), [
        { node: include, value: " p " },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeEncoding), [
        { node: include, value: " e " },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeAccept), [
        { node: include, value: " a " },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.XIncludeAcceptLanguage), [
        { node: include, value: " l " },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.Fallback), []);
      assert.deepStrictEqual(
        of(built, AttributeLexical)
          .map((row) => [row.attribute, row.value])
          .toSorted(byText),
        [
          ["href", " rules.xml "],
          ["parse", " text "],
        ],
      );
    }),
  );

  suite.effect("writes the outcome rules, conditions and the root's arm of outcome.xml", () =>
    Effect.gen(function* outcomeRules() {
      const env = withDeclarations(emptyEnvironment("test"), [
        outcomeOf("TOTAL", "float"),
        outcomeOf("MAXTOTAL", "float"),
        outcomeOf("COUNT", "integer"),
        outcomeOf("PASSED", "boolean"),
      ]);
      const prepared = yield* prepareFixture("valid", "outcome", {
        env,
        language: "outcome",
        mode: "test",
        rootKind: "test",
      });
      const built = yield* processed(prepared);
      const root = nodeIdOf(prepared, prepared.input.root);
      assert.deepStrictEqual(of(built, ruleSchema.OutcomeProcessing), [{ id: root }]);

      const thin = [
        ["qti-exit-test", ruleSchema.ExitTest],
        ["qti-outcome-condition", ruleSchema.OutcomeConditionArm],
        ["qti-outcome-else-if", ruleSchema.OutcomeElseIfArm],
        ["qti-outcome-processing-fragment", ruleSchema.OutcomeProcessingFragment],
        ["qti-set-outcome-value", ruleSchema.SetOutcomeValue],
      ] as const;
      for (const [kind, relation] of thin) {
        const ids = idsOfKinds(prepared, [kind]);
        assert.isAbove(ids.length, 0, kind);
        assert.deepStrictEqual(armIds(built, relation), ids, kind);
      }

      const branch = (element: Element) =>
        `${nodeIdOf(prepared, element)}<${conditionIdOf(prepared, element)}`;
      const locals = (kind: string) =>
        elementsOf(prepared.input.root).filter((element) => element.local === kind);
      assert.deepStrictEqual(
        of(built, ruleSchema.OutcomeIfArm)
          .map((row) => `${row.id}<${row.condition}`)
          .toSorted(),
        locals("qti-outcome-if").map(branch).toSorted(),
      );
      assert.deepStrictEqual(
        of(built, ruleSchema.OutcomeElseArm)
          .map((row) => `${row.id}<${row.condition}`)
          .toSorted(),
        locals("qti-outcome-else").map(branch).toSorted(),
      );
      assert.deepStrictEqual(
        of(built, ruleSchema.RuleOperand)
          .map((row) => `${key(row)}:${row.rule}:${row.ruleKind}`)
          .toSorted(),
        holderRows(prepared, outcomeHolders),
      );
      assert.deepStrictEqual(of(built, ruleSchema.TemplateProcessing), []);
    }),
  );

  suite.effect("writes the template rules and the item a template processing hangs under", () =>
    Effect.gen(function* templateRules() {
      const text = `<qti-assessment-item xmlns="${asiNamespace}" identifier="t" title="t" adaptive="false" time-dependent="false"><qti-template-processing><qti-set-template-value identifier="N"><qti-random-integer min="5" max="10"/></qti-set-template-value><qti-template-condition><qti-template-if><qti-gt><qti-variable identifier="N"/><qti-variable identifier="M"/></qti-gt><qti-exit-template/></qti-template-if><qti-template-else-if><qti-gt><qti-variable identifier="M"/><qti-variable identifier="N"/></qti-gt><qti-set-correct-response identifier="N"><qti-variable identifier="M"/></qti-set-correct-response></qti-template-else-if><qti-template-else><qti-set-default-value identifier="M"><qti-variable identifier="N"/></qti-set-default-value></qti-template-else></qti-template-condition><qti-template-constraint><qti-gt><qti-variable identifier="N"/><qti-variable identifier="M"/></qti-gt></qti-template-constraint></qti-template-processing></qti-assessment-item>`;
      const prepared = yield* prepare(yield* readXml(new TextEncoder().encode(text)), {
        env: withDeclarations(emptyEnvironment("template"), [
          { ...outcomeOf("N", "integer"), kind: "template" },
          { ...outcomeOf("M", "integer"), kind: "template" },
        ]),
        language: "template",
        mode: "template",
        root: "qti-template-processing",
        rootKind: "item",
      });
      const built = yield* processed(prepared);
      const root = nodeIdOf(prepared, prepared.input.root);
      const item = nodeIdOf(prepared, prepared.doc.root);
      assert.deepStrictEqual(of(built, ruleSchema.TemplateProcessing), [{ id: root, item }]);

      const thin = [
        ["qti-exit-template", ruleSchema.ExitTemplate],
        ["qti-set-correct-response", ruleSchema.SetCorrectResponse],
        ["qti-set-default-value", ruleSchema.SetDefaultValue],
        ["qti-set-template-value", ruleSchema.SetTemplateValue],
        ["qti-template-condition", ruleSchema.TemplateConditionArm],
        ["qti-template-constraint", ruleSchema.TemplateConstraint],
        ["qti-template-else-if", ruleSchema.TemplateElseIfArm],
      ] as const;
      for (const [kind, relation] of thin) {
        const ids = idsOfKinds(prepared, [kind]);
        assert.isAbove(ids.length, 0, kind);
        assert.deepStrictEqual(armIds(built, relation), ids, kind);
      }

      const condition = conditionIdOf(prepared, elementOf(prepared, "qti-template-if"));
      assert.deepStrictEqual(of(built, ruleSchema.TemplateIfArm), [
        { condition, id: idAt(prepared, "qti-template-if") },
      ]);
      assert.deepStrictEqual(of(built, ruleSchema.TemplateElseArm), [
        { condition, id: idAt(prepared, "qti-template-else") },
      ]);
      assert.deepStrictEqual(
        of(built, ruleSchema.RuleOperand)
          .map((row) => `${key(row)}:${row.rule}:${row.ruleKind}`)
          .toSorted(),
        holderRows(prepared, templateHolders),
      );
    }),
  );

  suite.effect("writes no rule row for a tree it refuses", () =>
    Effect.gen(function* refusedWritesNothing() {
      const prepared = yield* prepareBody(
        `<qti-set-outcome-value identifier="NOPE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>`,
        itemOptions,
      );
      const failure = yield* refusal(prepared);
      assert.strictEqual(failure.rule, "P8");
      assert.deepStrictEqual(of(prepared.rows, ruleSchema.RuleOperand), []);
    }),
  );
});

/**
 * The first rule a guard run refuses with, none when every guard passes.
 */
const guardRefusal = (rows: Rows) =>
  Effect.gen(function* guardRun() {
    const failure = yield* Effect.flip(processingGuards(rows));
    assert.instanceOf(failure, ProcessingGuardRefusal);

    return failure.rule;
  });

/**
 * The rows with one relation's rows replaced.
 */
const withRows = <R extends AnyRelation>(
  rows: Rows,
  relation: R,
  facts: readonly Fact<R>[],
): Rows => new Map(rows).set(relation, facts);

layer(NodeServices.layer, { excludeTestServices: true })("import/guards/processing.ts", (suite) => {
  const templateOptions = {
    language: "template",
    mode: "template",
    root: "qti-template-processing",
    rootKind: "item",
  } as const;

  suite.effect("P28 refuses a template processing with no rule", () =>
    Effect.gen(function* emptyTemplateProcessing() {
      const fs = yield* FileSystem.FileSystem;
      const source = new TextDecoder().decode(
        yield* fs.readFile(path.join(fixtures, "guards", "empty-template-processing.xml")),
      );
      // The declarations and the body are vocabulary M3 does not model yet; the rule under test is
      // the empty `qti-template-processing` that stays.
      const stripped = source
        .replaceAll(
          /<qti-(?:context|outcome|response|template)-declaration\b[\s\S]*?(?:\/>|<\/qti-\w+-declaration>)/gu,
          "",
        )
        .replace(/<qti-item-body>[\s\S]*<\/qti-item-body>/u, "");
      assert.include(stripped, "<qti-template-processing/>");
      assert.notInclude(stripped, "declaration");

      const prepared = yield* prepare(
        yield* readXml(new TextEncoder().encode(stripped)),
        templateOptions,
      );
      const built = yield* processed(prepared);
      assert.strictEqual(yield* guardRefusal(built), "P28");
    }),
  );

  suite.effect("P30 refuses an else that precedes its if", () =>
    Effect.gen(function* elseBeforeIf() {
      const prepared = yield* prepareFixture("guards", "else-before-if", itemOptions);
      const built = yield* processed(prepared);
      assert.strictEqual(yield* guardRefusal(built), "P30");
    }),
  );

  suite.effect("P31 refuses an expression edge with no operand row", () =>
    Effect.gen(function* edgeWithoutOperand() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const operands = of(built, processing.Operand);
      assert.isAbove(operands.length, 0);
      assert.strictEqual(
        yield* guardRefusal(withRows(built, processing.Operand, operands.slice(1))),
        "P31",
      );

      const holders = of(built, ruleSchema.RuleOperand);
      assert.isAbove(holders.length, 0);
      assert.strictEqual(
        yield* guardRefusal(withRows(built, ruleSchema.RuleOperand, holders.slice(1))),
        "P31",
      );
    }),
  );

  suite.effect("P32 refuses a copy that disagrees with its source", () =>
    Effect.gen(function* copyDisagrees() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const literals = of(built, processing.relations.LiteralBoolean);
      assert.isAbove(literals.length, 0);
      assert.strictEqual(
        yield* guardRefusal(
          withRows(
            built,
            processing.relations.LiteralBoolean,
            literals.map((row) => ({ ...row, value: row.value === "true" ? "false" : "true" })),
          ),
        ),
        "P32",
      );

      const expressions = of(built, processing.Expression);
      assert.strictEqual(
        yield* guardRefusal(
          withRows(
            built,
            processing.Expression,
            expressions.map((row) => ({ ...row, min: row.min + 1n })),
          ),
        ),
        "P32",
      );
    }),
  );

  suite.effect("P32 refuses an identifier literal that keeps its padding", () =>
    Effect.gen(function* untrimmedLiteral() {
      const prepared = yield* prepareBody(
        '<qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier"> completed </qti-base-value></qti-set-outcome-value>',
        itemOptions,
      );
      const built = yield* processed(prepared);
      const literals = of(built, processing.relations.LiteralIdentifier);
      assert.deepStrictEqual(
        literals.map((row) => row.value),
        ["completed"],
      );
      assert.strictEqual(
        yield* guardRefusal(
          withRows(
            built,
            processing.relations.LiteralIdentifier,
            // SAFETY: the brand only marks the column's type; the guard under test reads the text.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion
            literals.map((row) => ({ ...row, value: " completed " as typeof row.value })),
          ),
        ),
        "P32",
      );
    }),
  );

  suite.effect("passes the rows of response.xml and padded-processing.xml", () =>
    Effect.gen(function* soundRows() {
      for (const name of ["response", "padded-processing"] as const) {
        const prepared = yield* prepareFixture(
          name === "response" ? "valid" : "guards",
          name,
          itemOptions,
        );
        yield* processingGuards(yield* processed(prepared));
      }
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("import/rptemplate.ts", (suite) => {
  const packageId = crypto.randomUUID();

  suite.effect("writes the document, the processing root and the parameter references", () =>
    Effect.gen(function* templateDocument() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* corpusPackage("ccPackage");
      const doc = yield* readXml(yield* fs.readFile(path.join(dir, "rptemplates/CC2_match.xml")));
      const built = yield* rptemplateRows(
        {
          doc,
          packageId,
          path: "rptemplates/CC2_match.xml",
          resource: "CC2_match",
          resourceType: "imsqti_rptemplate_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const rootId = built.nodes.get(doc.root)?.id ?? assert.fail("the root has no node");

      const documents = of(built.rows, Document);
      assert.strictEqual(documents.length, 1);
      assert.deepStrictEqual(documents[0], {
        id: built.documentId,
        package: packageId,
        path: PackagePath("rptemplates/CC2_match.xml"),
        resource: ManifestIdentifier("CC2_match"),
        resourceType: "imsqti_rptemplate_xmlv3p0",
        root: "rptemplate",
        version: "3.0.0",
      });
      assert.strictEqual(built.documentId, rootId);
      assert.deepStrictEqual(of(built.rows, DocumentIdentifier), []);
      assert.deepStrictEqual(of(built.rows, DocumentTitle), []);
      assert.deepStrictEqual(of(built.rows, processing.ResponseProcessing), [
        { id: rootId, rootKind: "rptemplate" },
      ]);
      assert.deepStrictEqual(of(built.rows, processing.ResponseProcessingItem), []);

      const parameters = of(built.rows, processing.TemplateParameterRef);
      assert.deepStrictEqual([...new Set(parameters.map((row) => row.identifier))].toSorted(), [
        "RESPONSE",
        "SCORE",
      ]);
      for (const row of parameters) {
        assert.strictEqual(row.rootKind, "rptemplate");
        assert.strictEqual(row.document, built.documentId);
      }
    }),
  );

  suite.effect("refuses a root that is not a response processing", () =>
    Effect.gen(function* wrongRoot() {
      const doc = yield* readXml(
        new TextEncoder().encode(`<qti-outcome-processing xmlns="${asiNamespace}"/>`),
      );
      const failure = yield* Effect.flip(
        rptemplateRows(
          {
            doc,
            packageId,
            path: "t.xml",
            resource: "t",
            resourceType: "imsqti_rptemplate_xmlv3p0",
            version: "3.0.0",
          },
          Rows.empty(),
        ),
      );
      assert.strictEqual(failure._tag, "UnmodeledVocabulary");
    }),
  );

  suite.effect("dispatches a document by the root kind its resource type maps to", () =>
    Effect.gen(function* dispatch() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* corpusPackage("ccPackage");
      const doc = yield* readXml(yield* fs.readFile(path.join(dir, "rptemplates/CC2_match.xml")));
      const input = (resourceType: string) => ({
        doc,
        packageId,
        path: "rptemplates/CC2_match.xml",
        resource: "CC2_match",
        resourceLomHasGeneral: false,
        resourceType,
        version: "3.0.0" as const,
      });

      const routed = yield* documentRows(input("imsqti_rptemplate_xmlv3p0"), Rows.empty());
      assert.deepStrictEqual(
        of(routed.rows, Document).map((row) => row.root),
        ["rptemplate"],
      );
      assert.isAbove(of(routed.rows, processing.TemplateParameterRef).length, 0);

      const refused = yield* Effect.flip(documentRows(input("imsqti_item_xmlv3p0"), Rows.empty()));
      assert.strictEqual(refused._tag, "UnmodeledVocabulary");
    }),
  );

  suite.effect("writes the processing rows of an item's response processing", () =>
    Effect.gen(function* itemProcessing() {
      const fs = yield* FileSystem.FileSystem;
      const doc = yield* readXml(yield* fs.readFile(path.join(fixtures, "valid", "response.xml")));
      const built = yield* itemRows(
        {
          doc,
          packageId,
          path: "response.xml",
          resource: "response",
          resourceLomHasGeneral: false,
          resourceType: "imsqti_item_xmlv3p0",
          version: "3.0.0",
        },
        Rows.empty(),
      );
      const element = processingElement(doc);
      const nodeId = built.nodes.get(element)?.id ?? assert.fail("no node");
      assert.deepStrictEqual(of(built.rows, processing.ResponseProcessingItem), [
        { id: nodeId, item: built.documentId },
      ]);
      assert.isAbove(of(built.rows, processing.Expression).length, 100);
      assert.isAbove(of(built.rows, ruleSchema.relations.RuleOperand).length, 0);
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })("import/package.ts readRows", (suite) => {
  suite.effect("refuses an else before its if with P30", () =>
    Effect.gen(function* elseBeforeIf() {
      const dir = yield* materializeProcessing("else-before-if");
      const failure = yield* Effect.flip(readRows(dir));

      assert.strictEqual(
        failure._tag === "PlatformError" ? "PlatformError" : ruleOfError(failure).rule,
        "P30",
      );
    }),
  );

  suite.effect("reads the processing-item and rptemplates packages", () =>
    Effect.gen(function* realPackages() {
      for (const name of ["processing-item", "rptemplates"] as const) {
        const read = yield* readRows(yield* materializeProcessing(name));

        assert.isAbove(read.rows.size, 0);
      }
    }),
  );

  suite.effect("reads the padded-literal package with its identifier trimmed", () =>
    Effect.gen(function* paddedLiteral() {
      const read = yield* readRows(yield* materializeProcessing("padded-literal"));

      const values = Rows.of(read.rows, processing.relations.LiteralIdentifier).map((row) =>
        String(row.value),
      );

      assert.include(values, "ChoiceA");
      for (const value of values) {
        assert.strictEqual(value, value.trim());
      }
    }),
  );

  suite.effect("refuses a boolean qti-base-value outside true and false under P7", () =>
    Effect.gen(function* outsideLiteral() {
      for (const spelling of ["yes", "1", "TRUE"]) {
        const prepared = yield* prepareBody(
          `<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="boolean">${spelling}</qti-base-value></qti-set-outcome-value>`,
          { language: "outcome", mode: "test", rootKind: "test" },
        );
        const failure = yield* Effect.flip(processed(prepared));

        assert.instanceOf(failure, ImportRefused, spelling);
        assert.strictEqual(failure.rule, "P7", spelling);
      }
    }),
  );

  suite.effect("writes a boolean qti-base-value of true or false in its arm", () =>
    Effect.gen(function* insideLiteral() {
      const prepared = yield* prepareBody(
        '<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="boolean">false</qti-base-value></qti-set-outcome-value>',
        { language: "outcome", mode: "test", rootKind: "test" },
      );
      const built = yield* processed(prepared);

      assert.deepStrictEqual(
        of(built, processing.relations.LiteralBoolean).map((row) => row.value),
        ["false"],
      );
    }),
  );

  suite.effect("reads a padded boolean qti-base-value as its handle", () =>
    Effect.gen(function* paddedBoolean() {
      const prepared = yield* prepareBody(
        '<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="boolean"> true </qti-base-value></qti-set-outcome-value>',
        { language: "outcome", mode: "test", rootKind: "test" },
      );
      const built = yield* processed(prepared);

      assert.deepStrictEqual(
        of(built, processing.relations.LiteralBoolean).map((row) => row.value),
        ["true"],
      );
    }),
  );

  suite.effect("reads a padded identifier qti-base-value trimmed and a string one as written", () =>
    Effect.gen(function* paddedLiterals() {
      const identifiers = [
        [" completed ", "completed"],
        ["\n    ChoiceA\n  ", "ChoiceA"],
      ];
      for (const [written, read] of identifiers) {
        const prepared = yield* prepareBody(
          `<qti-set-outcome-value identifier="completionStatus"><qti-base-value base-type="identifier">${written}</qti-base-value></qti-set-outcome-value>`,
          itemOptions,
        );
        const built = yield* processed(prepared);

        assert.deepStrictEqual(
          of(built, processing.relations.LiteralIdentifier).map((row) => String(row.value)),
          [read],
        );
      }

      const prepared = yield* prepareBody(
        '<qti-set-outcome-value identifier="SCORE"><qti-string-match case-sensitive="true"><qti-base-value base-type="string"> a </qti-base-value><qti-base-value base-type="string">a</qti-base-value></qti-string-match></qti-set-outcome-value>',
        { language: "outcome", mode: "test", rootKind: "test" },
      );
      const built = yield* processed(prepared);

      assert.deepStrictEqual(
        of(built, processing.relations.LiteralString)
          .map((row) => row.value)
          .toSorted(),
        [" a ", "a"],
      );
    }),
  );
});
