/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute `qti-inside` names, the region kind, not a structure. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import type { AnyRelation, Fact, Uuid } from "@bjornpagen/grizzle";
import { ProcessingGuardRefusal, processingGuards } from "#pantry/import/guards/processing.ts";
import { itemRows } from "#pantry/import/item.ts";
import { documentRows, readRows } from "#pantry/import/package.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { ProcessingRefused, processingRows } from "#pantry/import/processing.ts";
import type { ProcessingInput, SectionTest, StructureEntry } from "#pantry/import/processing.ts";
import { packageStage } from "#pantry/import/reference.ts";
import type { StagedDocument } from "#pantry/import/reference.ts";
import { ImportRefused, ruleOfError } from "#pantry/import/refusal.ts";
import { rptemplateRows } from "#pantry/import/rptemplate.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import type { Language } from "#pantry/processing/ast.ts";
import { emptyEnvironment, environmentOf, withDeclarations } from "#pantry/processing/env.ts";
import type { DeclarationEntry, Environment, Mode } from "#pantry/processing/env.ts";
import { corpusPackage, materializeProcessing } from "#pantry/processing/fixtures.ts";
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
} from "#pantry/schema/contracts.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import { listPackage, readEntry } from "#pantry/package/read.ts";
import { ResourceLomGeneral } from "#pantry/schema/lang.ts";
import { ItemRefDocument } from "#pantry/schema/reference.ts";
import { ItemRef, TestIdentifier } from "#pantry/schema/test/structure.ts";
import * as expression from "#pantry/schema/expression.ts";
import * as attributed from "#pantry/schema/expression-attributes.ts";
import { expressionKinds } from "#pantry/schema/kinds/asi.ts";
import { AttributeLexical, AttributeSpelling, Edge, TextNode } from "#pantry/schema/node.ts";
import type { NodeKindHandle, RootKindHandle } from "#pantry/schema/node.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as ruleSchema from "#pantry/schema/rule.ts";
import { operatorArity, operatorArityMax } from "#pantry/schema/seed/operator-arity.ts";
import { materialize, materializeSpec, specOf, zipMembers } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * The committed processing fixtures, relative to `packages/pantry`, where the tests run.
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
 * A test environment that declares the outcomes the string-built bodies write and read, so that
 * the tests whose subject is something else (an attribute, a literal, a row) are not refused P8.
 * The types are `unknown`: only the declaration's existence matters to them.
 */
const outcomesDeclared = withDeclarations(
  emptyEnvironment("test"),
  ["COUNT", "LIST", "RESPONSE", "SCORE", "digits"].map((identifier): DeclarationEntry => ({
    areaMapping: false,
    identifier,
    interpolationTable: false,
    kind: "outcome",
    mapping: false,
    matchTable: false,
    mathVariable: false,
    paramVariable: false,
    type: { baseType: "unknown", cardinality: "unknown" },
  })),
);

/**
 * A `qti-equal-rounded` whose `figures` is the text given, prepared for the writer.
 */
const equalRoundedOver = (figures: string) =>
  prepareBody(
    `<qti-set-outcome-value identifier="SCORE"><qti-equal-rounded rounding-mode="decimalPlaces" figures="${figures}"><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-equal-rounded></qti-set-outcome-value>`,
    { env: outcomesDeclared, language: "response", mode: "test", rootKind: "item" },
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
const idsOfRows = (rows: readonly { readonly id: Uuid }[]) => rows.map((r) => r.id).toSorted();

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
const idAt = (prepared: Prepared, kind: string, index = 0): Uuid => {
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
const nodeIdOf = (prepared: Prepared, element: Element): Uuid =>
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
const conditionIdOf = (prepared: Prepared, element: Element): Uuid => {
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
          { env: outcomesDeclared, language: "response", mode: "test", rootKind: "item" },
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
        { env: outcomesDeclared, language: "response", mode: "test", rootKind: "item" },
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
            { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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
          { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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
          { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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
          { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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
        { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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
        { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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
        { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "test" },
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

/**
 * The package at `name`, read to rows.
 */
const rowsOfFixture = (name: FixtureName) =>
  Effect.flatMap(materialize(name), (dir) => readRows(dir));

/**
 * The package at `dir` after the package stage, without the guards: every document read and its
 * rows built, then the stage run over them, as `readRows` does before it judges the rows. The
 * package's own refusals past the stage (a LOM title that disagrees with the test's) are not
 * reached.
 */
const stagedRows = (dir: string) =>
  Effect.gen(function* packageStaged() {
    const entries = yield* listPackage(dir);
    const manifest = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
    const manifested = yield* manifestRows(dir, entries, manifest, Rows.empty());
    let { rows } = manifested;
    const documents: StagedDocument[] = [];
    for (const document of manifested.documents) {
      const doc = yield* readXml(yield* readEntry(dir, document.path));
      const built = yield* documentRows(
        {
          doc,
          packageId: manifested.packageId,
          path: document.path,
          resource: document.resource,
          resourceLomHasGeneral: Rows.of(manifested.rows, ResourceLomGeneral).some(
            (general) => general.resource === document.resource,
          ),
          resourceType: document.type,
          version: manifested.version,
        },
        rows,
      );
      ({ rows } = built);
      if ("nodes" in built) {
        documents.push({ doc, nodes: built.nodes });
      }
    }

    return yield* packageStage(rows, documents);
  });

/**
 * The document of `rows` at `path`.
 */
const documentAt = (rows: Rows, at: string) =>
  Rows.of(rows, Document).find((found) => found.path === at) ?? assert.fail(`no document at ${at}`);

/**
 * The item reference of `rows` with `identifier` in `document`.
 */
const itemRefOf = (rows: Rows, document: Uuid, identifier: string) =>
  Rows.of(rows, ItemRef).find(
    (ref) => ref.document === document && ref.identifier === identifier,
  ) ?? assert.fail(`no item reference ${identifier}`);

/**
 * The refs of the rows of a per-test relation, sorted.
 */
const idsOfRefs = (rows: readonly { readonly ref: Uuid }[]) =>
  rows.map((row) => row.ref).toSorted();

/**
 * The structure identifier of `rows` spelled `identifier`.
 */
const holderOf = (rows: Rows, identifier: string) =>
  Rows.of(rows, TestIdentifier).find((found) => found.identifier === identifier) ??
  assert.fail(`no structure identifier ${identifier}`);

/**
 * The one row of `found`.
 */
const onlyRow = <Row>(found: readonly Row[]): Row => {
  assert.strictEqual(found.length, 1);

  return found[0] ?? assert.fail("no row");
};

/**
 * The edit that spells the built-in `completionStatus` where `adaptive.xml` of
 * `test_package_minfiles` writes `completion_status` before the base value `value`, which sits
 * under the indent `tabs` in the file's CRLF text.
 */
const spell = (value: string, tabs: string) =>
  ({
    _tag: "ReplaceText",
    file: "example/adaptive.xml",
    replacement: `identifier="completionStatus">\r\n${tabs}<qti-base-value base-type="identifier">${value}<`,
    search: `identifier="completion_status">\r\n${tabs}<qti-base-value base-type="identifier">${value}<`,
  }) as const;

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/processing.ts a test document's rows",
  (suite) => {
    suite.effect("writes four declared item variable references over test_package_minfiles", () =>
      Effect.gen(function* minfiles() {
        // `adaptive.xml` sets `completion_status`, which no item declares and the built-in
        // `completionStatus` is not, so the package's own item is refused P8 before the stage; the
        // edits spell the built-in and leave everything the test reads as the corpus has it.
        const dir = yield* materializeSpec({
          edits: [spell("incomplete", "\t\t\t"), spell("completed", "\t\t\t\t\t")],
          member: zipMembers.test_package_minfiles,
          name: "test_package_minfiles",
        });
        const rows = yield* stagedRows(dir);
        const test = documentAt(rows, "example/rtest.xml");
        const refs = of(rows, processing.ItemVariableRef);

        assert.deepStrictEqual(
          refs.map((ref) => [ref.prefix, ref.variable, ref.root, ref.document]).toSorted(byText),
          ["item034", "item063", "item065", "item160"].map((prefix) => [
            prefix,
            "SCORE",
            "test",
            test.id,
          ]),
        );
        assert.deepStrictEqual(
          of(rows, processing.VariableRef)
            .filter((ref) => ref.kind === "itemVariable")
            .map((ref) => ref.id)
            .toSorted(),
          refs.map((ref) => ref.id).toSorted(),
        );

        const hubs = of(rows, processing.PrefixedVariableSource);
        assert.deepStrictEqual(idsOfRefs(hubs), refs.map((ref) => ref.id).toSorted());
        for (const hub of hubs) {
          const ref = refs.find((one) => one.id === hub.ref) ?? assert.fail("no arm");
          const itemRef = itemRefOf(rows, test.id, ref.prefix);
          const resolved = onlyRow(
            of(rows, ItemRefDocument).filter((row) => row.itemRef === itemRef.id),
          );

          assert.strictEqual(hub.test, test.id);
          assert.strictEqual(hub.document, test.id);
          assert.strictEqual(hub.refKind, "itemVariable");
          assert.strictEqual(hub.source, "declared");
          assert.strictEqual(hub.prefix, ref.prefix);
          assert.strictEqual(hub.itemRef, itemRef.id);
          assert.strictEqual(hub.itemDocument, resolved.document);
          assert.deepStrictEqual(
            of(rows, processing.PrefixedDeclared).filter((row) => row.ref === hub.ref),
            [{ itemDocument: resolved.document, ref: hub.ref, test: test.id, variable: "SCORE" }],
          );
        }

        assert.deepStrictEqual(of(rows, processing.ItemInstanceVariableRef), []);
        assert.deepStrictEqual(of(rows, processing.SectionDurationRef), []);
        assert.deepStrictEqual(of(rows, processing.PrefixedMapped), []);
        assert.deepStrictEqual(of(rows, processing.PrefixedBuiltIn), []);
      }),
    );

    suite.effect("writes test-linear's pre-condition and branch rules, each with its operand", () =>
      Effect.gen(function* linear() {
        const { rows } = yield* rowsOfFixture("test-linear");
        const operands = of(rows, ruleSchema.RuleOperand);

        assert.deepStrictEqual(operands.map((operand) => operand.ruleKind).toSorted(), [
          "qti-branch-rule",
          "qti-branch-rule",
          "qti-branch-rule",
          "qti-branch-rule",
          "qti-pre-condition",
          "qti-pre-condition",
          "qti-pre-condition",
        ]);

        const expressions = new Set(of(rows, processing.Expression).map((row) => row.id));
        for (const operand of operands) {
          assert.isTrue(expressions.has(operand.child));
        }

        assert.deepStrictEqual(
          of(rows, processing.ItemVariableRef)
            .map((ref) => `${ref.prefix}.${ref.variable}`)
            .toSorted(),
          [
            "item034.RESPONSE",
            "item034.RESPONSE",
            "item034.SCORE",
            "item347.RESPONSE",
            "item347.RESPONSE",
            "item653.SCORE",
            "switch.RESPONSE",
          ],
        );
        assert.deepStrictEqual(
          of(rows, processing.PrefixedVariableSource).map((hub) => hub.source),
          Array.from({ length: 7 }, () => "declared"),
        );
        assert.strictEqual(of(rows, processing.PrefixedDeclared).length, 7);
      }),
    );

    suite.effect("writes test-mapping's declared, built-in and instance sources", () =>
      Effect.gen(function* mapping() {
        const { rows } = yield* rowsOfFixture("test-mapping");
        const test = documentAt(rows, "rtest26.xml");
        const items = of(rows, processing.ItemVariableRef);
        const instances = of(rows, processing.ItemInstanceVariableRef);
        const hubOf = (ref: Uuid) =>
          onlyRow(of(rows, processing.PrefixedVariableSource).filter((hub) => hub.ref === ref));
        const named = (prefix: string, variable: string) =>
          items.find((ref) => ref.prefix === prefix && ref.variable === variable) ??
          assert.fail(`no ${prefix}.${variable}`);

        assert.deepStrictEqual(items.map((ref) => `${ref.prefix}|${ref.variable}`).toSorted(), [
          "I|A.B",
          "I|duration",
          "J.K|SCORE",
          "item160|SCORE",
        ]);
        assert.strictEqual(hubOf(named("item160", "SCORE").id).source, "declared");
        assert.strictEqual(hubOf(named("J.K", "SCORE").id).source, "declared");

        const nested = hubOf(named("I", "A.B").id);
        assert.strictEqual(nested.source, "declared");
        assert.deepStrictEqual(
          of(rows, processing.PrefixedDeclared)
            .filter((row) => row.ref === nested.ref)
            .map((row) => row.variable),
          ["A.B"],
        );

        const timed = hubOf(named("I", "duration").id);
        assert.strictEqual(timed.source, "builtIn");
        assert.deepStrictEqual(
          of(rows, processing.PrefixedBuiltIn)
            .filter((row) => row.ref === timed.ref)
            .map((row) => row.builtIn),
          ["duration"],
        );

        assert.deepStrictEqual(
          instances.map((ref) => [ref.prefix, String(ref.instance), ref.variable]).toSorted(byText),
          [
            ["I", "2", "SCORE"],
            ["I", "2", "SCORE"],
          ],
        );
        assert.deepStrictEqual(
          of(rows, processing.VariableRef)
            .filter((ref) => ref.kind === "itemInstanceVariable")
            .map((ref) => ref.id)
            .toSorted(),
          instances.map((ref) => ref.id).toSorted(),
        );

        const spelled = onlyRow(of(rows, processing.ItemInstanceSpelling));
        assert.strictEqual(spelled.value, "02");
        assert.isTrue(instances.some((ref) => ref.id === spelled.ref));
        for (const ref of instances) {
          assert.strictEqual(hubOf(ref.id).refKind, "itemInstanceVariable");
          assert.strictEqual(hubOf(ref.id).source, "declared");
        }

        const duration = onlyRow(of(rows, processing.SectionDurationRef));
        const part = holderOf(rows, "RTEST-26-A");
        assert.strictEqual(duration.prefix, "RTEST-26-A");
        assert.strictEqual(duration.document, test.id);
        assert.strictEqual(part.holderKind, "part");

        const target = onlyRow(of(rows, processing.SectionDurationTarget));
        assert.strictEqual(target.document, test.id);
        assert.strictEqual(target.holder, part.holder);
        assert.strictEqual(target.holderKind, "part");
        assert.strictEqual(target.prefix, "RTEST-26-A");
        assert.strictEqual(target.ref, duration.id);
        assert.strictEqual(target.refKind, "sectionDuration");
        assert.strictEqual(target.test, test.id);
        assert.deepStrictEqual(
          of(rows, processing.VariableRef)
            .filter((ref) => ref.kind === "sectionDuration")
            .map((ref) => ref.id),
          [duration.id],
        );
      }),
    );

    suite.effect("writes the section identifier target of a qti-test-variables", () =>
      Effect.gen(function* sectionIdentifier() {
        const { rows } = yield* rowsOfFixture("test-mapping");
        const test = documentAt(rows, "rtest26.xml");
        const written = onlyRow(of(rows, expression.ExpressionSectionIdentifier));
        const section = holderOf(rows, "sectionA");

        const target = onlyRow(of(rows, expression.SectionIdentifierTarget));
        assert.strictEqual(target.document, test.id);
        assert.strictEqual(target.holderKind, "section");
        assert.strictEqual(target.identifier, "sectionA");
        assert.strictEqual(target.node, written.node);
        assert.strictEqual(target.test, test.id);
        assert.strictEqual(section.holderKind, "section");
      }),
    );

    suite.effect("writes a mapped source when the item reference maps the name", () =>
      Effect.gen(function* mapped() {
        const base = specOf("test-mapping");
        const dir = yield* materializeSpec({
          ...base,
          edits: [
            ...base.edits,
            {
              _tag: "ReplaceText",
              file: "rtest26.xml",
              replacement:
                '<qti-set-outcome-value identifier="DECLARED"><qti-variable identifier="item034.SCORE"/></qti-set-outcome-value>\n    </qti-outcome-processing>',
              search: "    </qti-outcome-processing>",
            },
          ],
          name: "p5-45-mapped",
        });
        const { rows } = yield* readRows(dir);
        const test = documentAt(rows, "rtest26.xml");
        const ref = of(rows, processing.ItemVariableRef).find((row) => row.prefix === "item034");
        const itemRef = itemRefOf(rows, test.id, "item034");

        assert.strictEqual(ref?.variable, "SCORE");
        assert.deepStrictEqual(
          of(rows, processing.PrefixedVariableSource)
            .filter((hub) => hub.ref === ref?.id)
            .map((hub) => [hub.source, hub.itemRef]),
          [["mapped", itemRef.id]],
        );
        assert.deepStrictEqual(
          of(rows, processing.PrefixedMapped).filter((row) => row.ref === ref?.id),
          [{ itemRef: itemRef.id, ref: ref?.id, test: test.id, variable: "SCORE" }],
        );
        assert.deepStrictEqual(
          of(rows, processing.PrefixedDeclared).filter((row) => row.ref === ref?.id),
          [],
        );
      }),
    );

    suite.effect("refuses each negative with its rule", () =>
      Effect.gen(function* negatives() {
        const refused = [
          ["prefixed-unknown-ref", "prefixed-ref"],
          ["prefixed-undeclared-variable", "prefixed-ref"],
          ["precondition-number-correct", "P25"],
          ["test-undeclared-variable", "P8"],
          ["item-duration-not-timed", "item-duration"],
          ["template-default-type", "P20"],
        ] as const;
        for (const [name, rule] of refused) {
          const dir = yield* materialize(name);
          const failure = yield* Effect.flip(readRows(dir));

          assert.strictEqual(
            failure._tag === "PlatformError" ? "PlatformError" : ruleOfError(failure).rule,
            rule,
            name,
          );
        }
      }),
    );
  },
);

/**
 * A structure entry of a section with `identifier`, as a test's reach holds it.
 */
const sectionHolder = (identifier: string): [string, StructureEntry] => [
  identifier,
  { holder: crypto.randomUUID(), holderKind: "section", itemDocument: Option.none() },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/processing.ts a section document's rows",
  (suite) => {
    suite.effect(
      "writes one as-written arm per reference and one resolution per reaching test",
      () =>
        Effect.gen(function* sectionRows() {
          const { rows } = yield* rowsOfFixture("test-section-ref");
          const shared = documentAt(rows, "sections/shared.xml");
          const lonely = documentAt(rows, "sections/lonely.xml");
          const first = documentAt(rows, "rtest01.xml").id;
          const second = documentAt(rows, "test-b.xml").id;
          const refs = of(rows, processing.SectionVariableRef).filter(
            (ref) => ref.document === shared.id,
          );
          const refOf = (identifier: string) =>
            refs.find((ref) => ref.identifier === identifier) ?? assert.fail(identifier);
          const resolutions = (identifier: string) =>
            of(rows, processing.SectionVariableResolution)
              .filter((row) => row.ref === refOf(identifier).id)
              .toSorted((a, b) => a.test.localeCompare(b.test));
          const targets = (identifier: string) =>
            resolutions(identifier).map((row) => [row.test, row.target] as const);
          const forTests = (target: string) =>
            [first, second].toSorted().map((test) => [test, target] as const);

          assert.deepStrictEqual(refs.map((ref) => ref.identifier).toSorted(), [
            "COUNT",
            "I2.SCORE",
            "ITEMREF.SCORE",
            "PART.duration",
            "SCORE",
          ]);
          for (const ref of refs) {
            assert.strictEqual(ref.root, "section");
            assert.deepStrictEqual(
              of(rows, processing.VariableRef)
                .filter((found) => found.id === ref.id)
                .map((found) => [found.kind, found.document]),
              [["sectionVariable", shared.id]],
            );
          }

          const asWritten = new Set(refs.map((ref) => ref.id));
          for (const prefixed of [
            of(rows, processing.ItemVariableRef),
            of(rows, processing.ItemInstanceVariableRef),
            of(rows, processing.SectionDurationRef),
          ]) {
            assert.isFalse(prefixed.some((found) => asWritten.has(found.id)));
          }

          // The unprefixed `SCORE` is declared whole by both tests.
          assert.deepStrictEqual(targets("SCORE"), forTests("declared"));
          assert.deepStrictEqual(
            of(rows, processing.SectionVariableDeclared)
              .filter((row) => row.ref === refOf("SCORE").id)
              .map((row) => [row.test, row.identifier, row.declarationKind])
              .toSorted(byText),
            forTests("SCORE")
              .map(([test]) => [test, "SCORE", "outcome"])
              .toSorted(byText),
          );

          // `I2.SCORE` is declared whole by the first test and prefixed in the second.
          assert.deepStrictEqual(
            resolutions("I2.SCORE")
              .map((row) => [row.test, row.target])
              .toSorted(byText),
            [
              [first, "declared"],
              [second, "prefixed"],
            ].toSorted(byText),
          );

          const i2 = refOf("I2.SCORE").id;
          assert.deepStrictEqual(
            of(rows, processing.PrefixedVariableSource)
              .filter((hub) => hub.ref === i2)
              .map((hub) => [hub.test, hub.prefix, hub.refKind, hub.source]),
            [[second, "I2", "sectionVariable", "declared"]],
          );

          // `ITEMREF.SCORE` is prefixed in each test: one hub, one source and one thin row per test.
          const itemRef = refOf("ITEMREF.SCORE").id;
          assert.deepStrictEqual(targets("ITEMREF.SCORE"), forTests("prefixed"));

          const hubs = of(rows, processing.PrefixedVariableSource)
            .filter((hub) => hub.ref === itemRef)
            .toSorted((a, b) => a.test.localeCompare(b.test));
          assert.deepStrictEqual(
            hubs.map((hub) => [hub.test, hub.document, hub.prefix, hub.refKind, hub.source]),
            [first, second]
              .toSorted()
              .map((test) => [test, shared.id, "ITEMREF", "sectionVariable", "declared"]),
          );
          for (const hub of hubs) {
            const holder = itemRefOf(rows, hub.test, "ITEMREF");
            assert.strictEqual(hub.itemRef, holder.id);
            assert.deepStrictEqual(
              of(rows, processing.PrefixedDeclared).filter(
                (row) => row.ref === itemRef && row.test === hub.test,
              ),
              [{ itemDocument: hub.itemDocument, ref: itemRef, test: hub.test, variable: "SCORE" }],
            );
          }

          assert.deepStrictEqual(
            idsOfRefs(of(rows, processing.SectionVariablePrefixed)),
            [itemRef, itemRef, i2].toSorted(),
          );

          // `PART.duration` names the part's duration in each test.
          const duration = refOf("PART.duration").id;
          assert.deepStrictEqual(targets("PART.duration"), forTests("duration"));
          assert.deepStrictEqual(
            of(rows, processing.SectionVariableDuration)
              .filter((row) => row.ref === duration)
              .map((row) => row.test)
              .toSorted(),
            [first, second].toSorted(),
          );
          for (const target of of(rows, processing.SectionDurationTarget)) {
            assert.strictEqual(target.ref, duration);
            assert.strictEqual(target.refKind, "sectionVariable");
            assert.strictEqual(target.prefix, "PART");
            assert.strictEqual(target.holderKind, "part");
            assert.strictEqual(target.document, shared.id);
          }
          assert.strictEqual(of(rows, processing.SectionDurationTarget).length, 2);

          // The section no test reaches writes its arm alone.
          const unreached = of(rows, processing.SectionVariableRef).filter(
            (ref) => ref.document === lonely.id,
          );
          assert.deepStrictEqual(
            unreached.map((ref) => ref.identifier),
            ["ITEMREF.SCORE"],
          );

          const lonelyRef = unreached[0]?.id ?? assert.fail("no lonely reference");
          for (const family of [
            of(rows, processing.SectionVariableResolution),
            of(rows, processing.SectionVariableDeclared),
            of(rows, processing.SectionVariablePrefixed),
            of(rows, processing.SectionVariableDuration),
            of(rows, processing.PrefixedVariableSource),
            of(rows, processing.SectionDurationTarget),
          ]) {
            assert.isFalse(family.some((row) => "ref" in row && row.ref === lonelyRef));
          }
        }),
    );

    suite.effect("writes a section identifier target once per reaching test, over hand rows", () =>
      Effect.gen(function* handRows() {
        const testOf = (name: string, held: readonly string[]): SectionTest => ({
          env: outcomesDeclared,
          name,
          scope: { structure: new Map(held.map(sectionHolder)), test: crypto.randomUUID() },
        });
        const tests = [testOf("T1", ["sec"]), testOf("T2", ["sec", "other"]), testOf("T3", ["x"])];
        const prepared = yield* prepareBody(
          '<qti-set-outcome-value identifier="SCORE"><qti-sum><qti-test-variables variable-identifier="SCORE" section-identifier="sec"/></qti-sum></qti-set-outcome-value>',
          { env: outcomesDeclared, language: "outcome", mode: "test", rootKind: "section" },
        );
        const rows = yield* processed({ ...prepared, input: { ...prepared.input, tests } });
        const targets = of(rows, expression.SectionIdentifierTarget);

        assert.deepStrictEqual(
          targets.map((row) => row.test).toSorted((a, b) => a.localeCompare(b)),
          [tests[0]?.scope.test, tests[1]?.scope.test].toSorted((a, b) =>
            (a ?? "").localeCompare(b ?? ""),
          ),
        );
        assert.deepStrictEqual(
          targets.map((row) => [row.identifier, row.holderKind]),
          [
            ["sec", "section"],
            ["sec", "section"],
          ],
        );
      }),
    );

    suite.effect("refuses what the second test cannot resolve and names that test", () =>
      Effect.gen(function* unresolved() {
        // `section-unprefixed-undeclared` is first refused by the section's printed variable, a
        // binding the stage judges before processing; the third case takes the printed variable
        // out so that the pre-condition's `SCORE` is what no test declares.
        const base = specOf("section-unprefixed-undeclared");
        const unprinted = yield* materializeSpec({
          ...base,
          edits: [
            ...base.edits,
            {
              _tag: "ReplaceText",
              file: "sections/shared.xml",
              replacement: "<p>Score</p>",
              search: '<p>Score <qti-printed-variable identifier="SCORE" base="COUNT"/></p>',
            },
          ],
          name: "p5-46-unprinted",
        });
        const refused = [
          [yield* materialize("section-prefixed-unresolved"), "prefixed-ref", "TEST-B"],
          [yield* materialize("section-unprefixed-undeclared"), "binding-declared", "test-b.xml"],
          [unprinted, "P8", "TEST-B"],
        ] as const;
        for (const [dir, rule, naming] of refused) {
          const failure = yield* Effect.flip(readRows(dir));
          const { detail, rule: found } =
            failure._tag === "PlatformError" ? assert.fail(dir) : ruleOfError(failure);

          assert.strictEqual(found, rule, dir);
          assert.include(detail, naming, dir);
        }
      }),
    );
  },
);
