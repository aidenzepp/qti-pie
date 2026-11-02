/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the XSD attribute `qti-inside` names, the region kind, not a structure. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { ProcessingRefused, processingRows } from "#qti/import/processing.ts";
import type { ProcessingInput } from "#qti/import/processing.ts";
import { Rows, treeRows } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import type { Language } from "#qti/processing/ast.ts";
import { emptyEnvironment, environmentOf, withDeclarations } from "#qti/processing/env.ts";
import type { DeclarationEntry, Environment, Mode } from "#qti/processing/env.ts";
import { expressionKinds } from "#qti/processing/types.ts";
import * as expression from "#qti/schema/expression.ts";
import * as attributed from "#qti/schema/expression-attributes.ts";
import { AttributeLexical, Edge } from "#qti/schema/node.ts";
import type { NodeKindHandle, RootKindHandle } from "#qti/schema/node.ts";
import * as processing from "#qti/schema/processing.ts";
import { operatorArity, operatorArityMax } from "#qti/schema/seed/operator-arity.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

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
const processingElement = (doc: XmlDocument): Element => {
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
      root: processingElement(doc),
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
          figures: "COUNT",
          figuresKind: "ref",
          figuresValue: 0n,
          id: byReference,
          roundingMode: "decimalPlaces",
        },
      );
      assert.deepStrictEqual(
        rounded.find((row) => row.id === byNumber),
        {
          figures: "3",
          figuresKind: "literal",
          figuresValue: 3n,
          id: byNumber,
          roundingMode: "significantFigures",
        },
      );
      assert.deepStrictEqual(of(built, attributed.DeclaredRoundingMode), [{ node: byReference }]);

      const integer = idAt(prepared, "qti-random-integer");
      assert.deepStrictEqual(of(built, attributed.RandomInteger), [{ id: integer, max: "10" }]);
      assert.deepStrictEqual(of(built, attributed.RandomIntegerMin), [
        { node: integer, value: "0" },
      ]);
      assert.deepStrictEqual(of(built, attributed.RandomIntegerStep), [
        { node: integer, value: "2" },
      ]);

      const float = idAt(prepared, "qti-random-float");
      assert.deepStrictEqual(of(built, attributed.RandomFloat), [{ id: float, max: "1" }]);
      assert.deepStrictEqual(of(built, attributed.RandomFloatMin), [{ node: float, value: "0" }]);

      const anyN = idAt(prepared, "qti-any-n");
      assert.deepStrictEqual(of(built, attributed.AnyN), [{ id: anyN, max: "COUNT", min: "1" }]);
    }),
  );

  suite.effect("keeps the attributes of the remaining attributed kinds", () =>
    Effect.gen(function* remainingAttributesOfResponse() {
      const prepared = yield* prepareFixture("valid", "response", itemOptions);
      const built = yield* processed(prepared);
      const id = (kind: string, index = 0) => idAt(prepared, kind, index);
      assert.deepStrictEqual(of(built, attributed.Inside), [
        { coords: "0,0,10,10", id: id("qti-inside"), shape: "rect" },
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
          figures: "2",
          figuresKind: "literal",
          figuresValue: 2n,
          id: id("qti-round-to"),
          roundingMode: "decimalPlaces",
        },
      ]);
      assert.deepStrictEqual(of(built, attributed.Index), [
        { id: id("qti-index"), n: "1", nKind: "literal", nValue: 1n },
      ]);
      assert.deepStrictEqual(of(built, attributed.Repeat), [
        {
          id: id("qti-repeat"),
          numberRepeats: "2",
          numberRepeatsKind: "literal",
          numberRepeatsValue: 2n,
        },
      ]);
      assert.deepStrictEqual(of(built, attributed.FieldValue), [
        { fieldIdentifier: "level", id: id("qti-field-value") },
      ]);
      assert.deepStrictEqual(of(built, attributed.CustomOperatorClass), [
        { node: id("qti-custom-operator"), value: "com.example.Operator" },
      ]);
      assert.deepStrictEqual(of(built, attributed.CustomOperatorDefinition), [
        { node: id("qti-custom-operator"), value: "https://example.org/operators/custom" },
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
          figures: "3",
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

  suite.effect("keeps a padded reference in a mixed union as a literal the pattern refuses", () =>
    Effect.gen(function* paddedReference() {
      const prepared = yield* prepareBody(
        `<qti-set-outcome-value identifier="SCORE"><qti-equal-rounded rounding-mode="decimalPlaces" figures=" COUNT "><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-equal-rounded></qti-set-outcome-value>`,
        { language: "response", mode: "test", rootKind: "item" },
      );
      const built = yield* processed(prepared);
      assert.deepStrictEqual(of(built, attributed.EqualRounded), [
        {
          figures: " COUNT ",
          figuresKind: "literal",
          figuresValue: 0n,
          id: idAt(prepared, "qti-equal-rounded"),
          roundingMode: "decimalPlaces",
        },
      ]);
      assert.deepStrictEqual(of(built, AttributeLexical), []);
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
        { id: testVariables, variableIdentifier: "SCORE" },
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
});
