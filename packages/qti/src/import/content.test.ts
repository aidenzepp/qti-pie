/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the declaration column the variables under test carry; the shape here is the typed-or-record choice, not a structure. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option, Predicate } from "effect";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { contentRows } from "#qti/import/content.ts";
import type { DeclaredVariable } from "#qti/import/interactions.ts";
import { ItemRefusal, Rows, treeRows } from "#qti/import/tree.ts";
import {
  ContextDeclarationArm,
  Declaration,
  DeclaredMathVariable,
  DeclaredParamVariable,
  RecordDeclaration,
  TemplateDeclarationArm,
  TypedDeclaration,
} from "#qti/schema/declaration.ts";
import { ContextDeclarationId, DocumentId } from "#qti/schema/document.ts";
import {
  ContentBodyFeedback,
  ContentBodyModal,
  ContentBodyRubric,
  ContentBodyRubricTemplate,
  ContentBodyTemplate,
  DeclaredFeedbackBlockShowHide,
  DeclaredFeedbackInlineShowHide,
  DeclaredTemplateFeedbackBlockShowHide,
  FeedbackBlock,
  FeedbackInline,
  FeedbackOutcomeRef,
  ModalFeedback,
  ModalFeedbackTitle,
  TemplateFeedbackBlock,
} from "#qti/schema/feedback.ts";
import { AttributeLexical, Node } from "#qti/schema/node.ts";
import { nodeArms } from "#qti/schema/qti.ts";
import type { SchemaVersionHandle } from "#qti/schema/node.ts";
import {
  CatalogInfo,
  CompanionMaterialsInfo,
  RubricBlock,
  Stylesheet,
  StylesheetMedia,
  StylesheetTitle,
} from "#qti/schema/rubric.ts";
import {
  DeclaredPrintedVariableBase,
  DeclaredPrintedVariableDelimiter,
  DeclaredPrintedVariableMappingIndicator,
  DeclaredPrintedVariablePowerForm,
  DeclaredRubricTemplateBlockShowHide,
  DeclaredRubricTemplateInlineShowHide,
  DeclaredTemplateBlockShowHide,
  DeclaredTemplateInlineShowHide,
  PrintedVariable,
  PrintedVariableField,
  PrintedVariableFormat,
  PrintedVariableIndex,
  PrintedVariableRef,
  PrintedVariableVarRef,
  RubricTemplateBlock,
  RubricTemplateInline,
  TemplateBlock,
  TemplateContentRef,
  TemplateInline,
} from "#qti/schema/template.ts";
import * as values from "#qti/schema/value.ts";
import { readXml } from "#qti/xml/read.ts";

const documentId = "11111111-1111-4111-8111-111111111111";

const itemNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const typed = (
  id: string,
  baseType: "identifier" | "integer" | "float",
  cardinality: "single" | "multiple",
): DeclaredVariable => ({
  baseType: Option.some(baseType),
  cardinality: Option.some(cardinality),
  id,
  shape: "typed",
});

/**
 * The outcomes the tests declare: `FEEDBACK` an identifier, `VAR` an integer and `SCORE` a float.
 */
const outcomes: ReadonlyMap<string, DeclaredVariable> = new Map([
  ["FEEDBACK", typed("decl-feedback", "identifier", "single")],
  ["SCORE", typed("decl-score", "float", "single")],
  ["VAR", typed("decl-var", "integer", "single")],
]);

const outcomeElements = `<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="VAR" cardinality="single" base-type="integer"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`;

interface Item {
  readonly body?: string;
  readonly head?: string;
  readonly tail?: string;
  readonly version?: SchemaVersionHandle;
}

/**
 * Read a hand-written item whose declarations, body and trailing elements are given, and run the
 * builder over it with the outcomes above declared.
 */
const built = (item: Item, declarations: ReadonlyMap<string, DeclaredVariable> = outcomes) =>
  Effect.gen(function* run() {
    const text = `<qti-assessment-item xmlns="${itemNamespace}" identifier="hand" title="Hand" time-dependent="false">${outcomeElements}${item.head ?? ""}<qti-item-body>${item.body ?? ""}</qti-item-body>${item.tail ?? ""}</qti-assessment-item>`;
    const doc = yield* readXml(new TextEncoder().encode(text));
    const tree = yield* treeRows(
      doc,
      {
        charset: doc.charset,
        id: documentId,
        kind: "document",
        root: "item",
        version: item.version ?? "3.0.1",
      },
      Rows.empty(),
    );

    return {
      nodes: tree.nodes,
      rows: yield* contentRows(doc.root, tree.nodes, documentId, declarations, tree.rows),
    };
  });

/**
 * The id of a row found through an optional lookup, empty when the lookup found nothing.
 */
const idOf = (row: { readonly id: string } | undefined): string => row?.id ?? "";

/**
 * One node of each feedback and template kind: `fa` a feedback block, `ft` a template feedback
 * block, `tb` a template block, `rb` a rubric template block, `ti` a template inline and `ri` a
 * rubric template inline.
 */
const sixKinds = `<qti-rubric-block use="instructions" view="candidate"><qti-content-body><qti-template-block template-identifier="T" identifier="rb" show-hide="hide"><qti-content-body><p>r</p></qti-content-body></qti-template-block><qti-template-inline template-identifier="T" identifier="ri" show-hide="hide">i</qti-template-inline></qti-content-body></qti-rubric-block><qti-feedback-block outcome-identifier="FEEDBACK" identifier="fa"><qti-content-body><p>a</p></qti-content-body></qti-feedback-block><qti-template-block template-identifier="T" identifier="tb"><qti-content-body><qti-feedback-block outcome-identifier="FEEDBACK" identifier="ft" show-hide="hide"><qti-content-body><p>t</p></qti-content-body></qti-feedback-block></qti-content-body></qti-template-block><p><qti-template-inline template-identifier="T" identifier="ti">x</qti-template-inline></p>`;

const sixKindsHead = `<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/>`;

/**
 * The arm each of the six kind handles has under its own `mirrors` law from `Node`.
 */
const armOfKind: ReadonlyMap<string, AnyRelation> = new Map(Object.entries(nodeArms));

const sixHandles = [
  "qti-feedback-block",
  "qti-feedback-block.template",
  "qti-template-block",
  "qti-template-block.rubric",
  "qti-template-inline",
  "qti-template-inline.rubric",
] as const;

const modal = `<qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="show" identifier="m1"><qti-content-body><p>Well done</p></qti-content-body></qti-modal-feedback>`;

describe("contentRows", () => {
  it.effect(
    "writes a modal feedback with its version, a ref per feedback and the printed variables",
    () =>
      Effect.gen(function* run() {
        const { rows } = yield* built({
          body: `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="a"><qti-content-body><p>Right</p></qti-content-body></qti-feedback-block><p><qti-printed-variable identifier="VAR" base="VAR"/><qti-printed-variable identifier="VAR" base="16"/></p>`,
          tail: modal,
        });
        const modals = Rows.of(rows, ModalFeedback);

        assert.strictEqual(modals.length, 1);
        assert.strictEqual(modals[0]?.version, "3.0.1");
        assert.strictEqual(modals[0]?.outcomeIdentifier, "FEEDBACK");
        assert.strictEqual(modals[0]?.identifier, "m1");
        assert.strictEqual(modals[0]?.showHide, "show");

        const refs = Rows.of(rows, FeedbackOutcomeRef);

        assert.strictEqual(refs.length, 2);
        assert.deepStrictEqual(
          new Set(refs.map((ref) => ref.node)),
          new Set([Rows.of(rows, FeedbackBlock)[0]?.id, modals[0]?.id]),
        );
        for (const ref of refs) {
          assert.strictEqual(ref.document, documentId);
          assert.strictEqual(ref.identifier, "FEEDBACK");
          assert.strictEqual(ref.baseType, "identifier");
          assert.strictEqual(ref.cardinality, "single");
        }

        const printed = Rows.of(rows, PrintedVariable);
        const bases = new Map(printed.map((row) => [row.base, row]));

        assert.strictEqual(printed.length, 2);
        assert.deepStrictEqual(
          [...bases.keys()].toSorted((a, b) => a.localeCompare(b)),
          ["16", "VAR"],
        );

        const varRefs = Rows.of(rows, PrintedVariableVarRef);

        assert.strictEqual(varRefs.length, 1);
        assert.deepStrictEqual(varRefs[0], {
          attribute: "base",
          baseType: "integer",
          cardinality: "single",
          document: documentId,
          identifier: "VAR",
          kind: "outcome",
          node: idOf(bases.get("VAR")),
        });
        assert.strictEqual(Rows.of(rows, PrintedVariableRef).length, 2);
      }),
  );

  it.effect(
    "stores a padded integer base collapsed with its lexical form, and a name as read",
    () =>
      Effect.gen(function* run() {
        const { rows } = yield* built({
          body: `<p><qti-printed-variable identifier="VAR" base=" 16 "/></p>`,
        });
        const [printed] = Rows.of(rows, PrintedVariable);

        assert.strictEqual(printed?.base, "16");
        assert.deepStrictEqual(
          Rows.of(rows, AttributeLexical).filter((row) => row.attribute === "base"),
          [{ attribute: "base", kind: "qti-printed-variable", node: idOf(printed), value: " 16 " }],
        );
        assert.strictEqual(Rows.of(rows, PrintedVariableVarRef).length, 0);
      }),
  );

  it.effect("writes the printed variable's defaults, its markers and its optional values", () =>
    Effect.gen(function* run() {
      const plain = yield* built({ body: `<p><qti-printed-variable identifier="SCORE"/></p>` });
      const [row] = Rows.of(plain.rows, PrintedVariable);

      assert.deepStrictEqual(
        [row?.base, row?.delimiter, row?.mappingIndicator, row?.powerForm],
        ["10", ";", "=", "false"],
      );
      for (const marker of [
        DeclaredPrintedVariableBase,
        DeclaredPrintedVariableDelimiter,
        DeclaredPrintedVariableMappingIndicator,
        DeclaredPrintedVariablePowerForm,
        PrintedVariableFormat,
        PrintedVariableIndex,
        PrintedVariableField,
      ]) {
        assert.strictEqual(Rows.of(plain.rows, marker).length, 0);
      }

      const full = yield* built({
        body: `<p><qti-printed-variable identifier="SCORE" base="2" delimiter="," mapping-indicator=":" power-form="true" format="%.2f" index="VAR" field="x"/></p>`,
      });
      const [written] = Rows.of(full.rows, PrintedVariable);

      assert.deepStrictEqual(
        [written?.base, written?.delimiter, written?.mappingIndicator, written?.powerForm],
        ["2", ",", ":", "true"],
      );
      for (const marker of [
        DeclaredPrintedVariableBase,
        DeclaredPrintedVariableDelimiter,
        DeclaredPrintedVariableMappingIndicator,
        DeclaredPrintedVariablePowerForm,
      ]) {
        assert.deepStrictEqual(Rows.of(full.rows, marker), [{ node: idOf(written) }]);
      }

      assert.deepStrictEqual(Rows.of(full.rows, PrintedVariableFormat), [
        { node: idOf(written), value: "%.2f" },
      ]);
      assert.deepStrictEqual(Rows.of(full.rows, PrintedVariableIndex), [
        { node: idOf(written), value: "VAR" },
      ]);
      assert.deepStrictEqual(Rows.of(full.rows, PrintedVariableField), [
        { node: idOf(written), value: "x" },
      ]);
      assert.deepStrictEqual(
        Rows.of(full.rows, PrintedVariableVarRef).map((ref) => [ref.attribute, ref.identifier]),
        [["index", "VAR"]],
      );
      assert.deepStrictEqual(Rows.of(full.rows, PrintedVariableRef), [
        { document: documentId, identifier: "SCORE", kind: "outcome", node: idOf(written) },
      ]);
    }),
  );

  it.effect("refuses a printed variable whose base names no variable of the item", () =>
    Effect.gen(function* run() {
      const exit = yield* Effect.exit(
        built({ body: `<p><qti-printed-variable identifier="SCORE" base="MISSING"/></p>` }),
      );

      assert.isTrue(Exit.isFailure(exit));
      assert.isTrue(
        Exit.isFailure(exit) &&
          Option.exists(Exit.findErrorOption(exit), (e) => e instanceof ItemRefusal),
      );
    }),
  );

  it.effect("refuses a feedback whose outcome the item does not declare", () =>
    Effect.gen(function* run() {
      const exit = yield* Effect.exit(
        built({
          body: `<qti-feedback-block outcome-identifier="NOPE" identifier="a"><p>x</p></qti-feedback-block>`,
        }),
      );

      assert.isTrue(
        Exit.isFailure(exit) &&
          Option.exists(Exit.findErrorOption(exit), (e) => e instanceof ItemRefusal),
      );
    }),
  );

  it.effect("defaults a feedback's show-hide to show and marks the one written", () =>
    Effect.gen(function* run() {
      const { rows } = yield* built({
        body: `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="a"><p>x</p></qti-feedback-block><qti-feedback-block outcome-identifier="FEEDBACK" identifier="b" show-hide="hide"><p>y</p></qti-feedback-block><p><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="c">z</qti-feedback-inline><qti-feedback-inline outcome-identifier="FEEDBACK" identifier="d" show-hide="hide">w</qti-feedback-inline></p>`,
      });
      const blocks = new Map(Rows.of(rows, FeedbackBlock).map((row) => [row.identifier, row]));
      const inlines = new Map(Rows.of(rows, FeedbackInline).map((row) => [row.identifier, row]));

      assert.strictEqual(blocks.get("a")?.showHide, "show");
      assert.strictEqual(blocks.get("b")?.showHide, "hide");
      assert.strictEqual(inlines.get("c")?.showHide, "show");
      assert.strictEqual(inlines.get("d")?.showHide, "hide");
      assert.deepStrictEqual(Rows.of(rows, DeclaredFeedbackBlockShowHide), [
        { node: idOf(blocks.get("b")) },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredFeedbackInlineShowHide), [
        { node: idOf(inlines.get("d")) },
      ]);
      assert.strictEqual(Rows.of(rows, FeedbackOutcomeRef).length, 4);
    }),
  );

  it.effect("writes a modal feedback's title where written and the content body arms by kind", () =>
    Effect.gen(function* run() {
      const titled = yield* built({
        body: `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="a"><qti-content-body><p>x</p></qti-content-body></qti-feedback-block>`,
        tail: `<qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="hide" identifier="m2" title="Hint"><qti-content-body><p>x</p></qti-content-body></qti-modal-feedback>`,
      });
      const [modalRow] = Rows.of(titled.rows, ModalFeedback);

      assert.strictEqual(modalRow?.showHide, "hide");
      assert.deepStrictEqual(Rows.of(titled.rows, ModalFeedbackTitle), [
        { node: idOf(modalRow), value: "Hint" },
      ]);
      assert.strictEqual(Rows.of(titled.rows, ContentBodyModal).length, 1);
      assert.strictEqual(Rows.of(titled.rows, ContentBodyFeedback).length, 1);

      const untitled = yield* built({ tail: modal });

      assert.strictEqual(Rows.of(untitled.rows, ModalFeedbackTitle).length, 0);
    }),
  );

  it.effect("writes template blocks and inlines with a ref to their template declaration", () =>
    Effect.gen(function* run() {
      const { rows } = yield* built({
        body: `<qti-template-block template-identifier="T" identifier="b1" show-hide="hide"><p>x</p></qti-template-block><qti-template-block template-identifier="T" identifier="b2"><p>y</p></qti-template-block><p><qti-template-inline template-identifier="U" identifier="i1">z</qti-template-inline></p>`,
        head: `<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/><qti-template-declaration identifier="U" cardinality="multiple" base-type="identifier"/>`,
      });
      const blocks = new Map(Rows.of(rows, TemplateBlock).map((row) => [row.identifier, row]));
      const [inline] = Rows.of(rows, TemplateInline);

      assert.strictEqual(blocks.get("b1")?.showHide, "hide");
      assert.strictEqual(blocks.get("b2")?.showHide, "show");
      assert.strictEqual(blocks.get("b1")?.templateIdentifier, "T");
      assert.strictEqual(inline?.showHide, "show");
      assert.deepStrictEqual(Rows.of(rows, DeclaredTemplateBlockShowHide), [
        { node: idOf(blocks.get("b1")) },
      ]);

      const refs = new Map(Rows.of(rows, TemplateContentRef).map((ref) => [ref.node, ref]));

      assert.strictEqual(refs.size, 3);
      assert.deepStrictEqual(refs.get(inline?.id ?? ""), {
        baseType: "identifier",
        cardinality: "multiple",
        document: documentId,
        identifier: "U",
        node: idOf(inline),
      });
      assert.strictEqual(refs.get(blocks.get("b2")?.id ?? "")?.cardinality, "single");
    }),
  );

  it.effect("refuses a template block that names no template declaration", () =>
    Effect.gen(function* run() {
      const exit = yield* Effect.exit(
        built({
          body: `<qti-template-block template-identifier="NOPE" identifier="b"><p>x</p></qti-template-block>`,
        }),
      );

      assert.isTrue(
        Exit.isFailure(exit) &&
          Option.exists(Exit.findErrorOption(exit), (e) => e instanceof ItemRefusal),
      );
    }),
  );

  it.effect(
    "writes a template declaration with its arm, markers, typed row and default value",
    () =>
      Effect.gen(function* run() {
        const { rows } = yield* built({
          head: `<qti-template-declaration identifier="T" cardinality="multiple" base-type="integer" math-variable="true"><qti-default-value><qti-value>3</qti-value><qti-value>4</qti-value></qti-default-value></qti-template-declaration><qti-template-declaration identifier="R" cardinality="record"/>`,
        });
        const declarations = new Map(
          Rows.of(rows, Declaration).map((row) => [row.identifier, row]),
        );
        const t = declarations.get("T");
        const record = declarations.get("R");

        assert.strictEqual(t?.kind, "template");
        assert.strictEqual(t?.shape, "typed");
        assert.strictEqual(t?.document, documentId);
        assert.strictEqual(record?.shape, "record");
        assert.deepStrictEqual(
          Rows.of(rows, TemplateDeclarationArm)
            .map((arm) => arm.id)
            .toSorted((a, b) => a.localeCompare(b)),
          [t?.id ?? "", record?.id ?? ""].toSorted((a, b) => a.localeCompare(b)),
        );

        const arm = Rows.of(rows, TemplateDeclarationArm).find((row) => row.id === idOf(t));

        assert.strictEqual(arm?.mathVariable, "true");
        assert.strictEqual(arm?.paramVariable, "false");
        assert.deepStrictEqual(Rows.of(rows, DeclaredMathVariable), [{ node: idOf(t) }]);
        assert.strictEqual(Rows.of(rows, DeclaredParamVariable).length, 0);
        assert.deepStrictEqual(Rows.of(rows, TypedDeclaration), [
          {
            baseType: "integer",
            cardinality: "multiple",
            document: documentId,
            id: idOf(t),
            identifier: "T",
            kind: "template",
          },
        ]);
        assert.deepStrictEqual(Rows.of(rows, RecordDeclaration), [{ id: idOf(record) }]);

        const [set] = Rows.of(rows, values.ValueSet);

        assert.strictEqual(set?.role, "default");
        assert.strictEqual(set?.declaration, idOf(t));
        assert.strictEqual(Rows.of(rows, values.DefaultValueArm).length, 1);
        assert.strictEqual(Rows.of(rows, values.TypedValueSet)[0]?.baseType, "integer");

        const stored = Rows.of(rows, values.DeclaredValue).toSorted((a, b) =>
          Number(a.position - b.position),
        );

        const valueOf = new Map(
          Rows.of(rows, values.relations.DeclaredValueInteger).map((row) => [row.id, row.value]),
        );

        assert.deepStrictEqual(
          stored.map((row) => [row.valueSet, row.baseType]),
          [
            [idOf(set), "integer"],
            [idOf(set), "integer"],
          ],
        );
        assert.deepStrictEqual(
          stored.map((row) => valueOf.get(row.id)),
          ["3", "4"],
        );
      }),
  );

  it.effect("writes a context declaration with its holder rows in 3.0.0 and none in 3.0.1", () =>
    Effect.gen(function* run() {
      const head = `<qti-context-declaration identifier="CTX" cardinality="single" base-type="string"/>`;
      const old = yield* built({ head, version: "3.0.0" });
      const declaration = Rows.of(old.rows, Declaration).find((row) => row.identifier === "CTX");
      const [arm] = Rows.of(old.rows, ContextDeclarationArm);

      assert.strictEqual(declaration?.kind, "context");
      assert.deepStrictEqual(arm, { id: idOf(declaration), version: "3.0.0" });
      assert.deepStrictEqual(
        Rows.of(old.rows, DocumentId).filter((row) => row.holder === "contextDeclaration"),
        [{ document: documentId, holder: "contextDeclaration", id: "CTX" }],
      );
      assert.deepStrictEqual(Rows.of(old.rows, ContextDeclarationId), [
        { document: documentId, id: "CTX", node: idOf(declaration) },
      ]);
      assert.deepStrictEqual(
        Rows.of(old.rows, TypedDeclaration).filter((row) => row.kind === "context").length,
        1,
      );

      const current = yield* built({ head });
      const [newer] = Rows.of(current.rows, ContextDeclarationArm);

      assert.strictEqual(newer?.version, "3.0.1");
      assert.strictEqual(Rows.of(current.rows, ContextDeclarationId).length, 0);
      assert.strictEqual(
        Rows.of(current.rows, DocumentId).filter((row) => row.holder === "contextDeclaration")
          .length,
        0,
      );
    }),
  );

  it.effect("writes a rubric block, a stylesheet and the two hooks", () =>
    Effect.gen(function* run() {
      const { rows } = yield* built({
        body: `<qti-rubric-block use="scoring" view=" scorer   proctor "><qti-content-body><p>x</p></qti-content-body></qti-rubric-block>`,
        tail: `<qti-stylesheet href=" a.css " type="text/css" media="screen" title="Main"/><qti-stylesheet href="b.css" type="text/css"/><qti-catalog-info/><qti-companion-materials-info/>`,
      });
      const [rubric] = Rows.of(rows, RubricBlock);

      assert.strictEqual(rubric?.use, "scoring");
      assert.strictEqual(rubric?.view, "scorer proctor");
      assert.deepStrictEqual(
        Rows.of(rows, AttributeLexical).filter((row) => row.node === idOf(rubric)),
        [
          {
            attribute: "view",
            kind: "qti-rubric-block",
            node: idOf(rubric),
            value: " scorer   proctor ",
          },
        ],
      );
      assert.strictEqual(Rows.of(rows, ContentBodyRubric).length, 1);

      const sheets = new Map(Rows.of(rows, Stylesheet).map((row) => [row.href, row]));

      assert.deepStrictEqual(
        [...sheets.keys()].toSorted((a, b) => a.localeCompare(b)),
        ["a.css", "b.css"],
      );
      assert.strictEqual(sheets.get("a.css")?.type, "text/css");
      assert.deepStrictEqual(Rows.of(rows, StylesheetMedia), [
        { node: idOf(sheets.get("a.css")), value: "screen" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, StylesheetTitle), [
        { node: idOf(sheets.get("a.css")), value: "Main" },
      ]);
      assert.strictEqual(Rows.of(rows, CatalogInfo).length, 1);
      assert.strictEqual(Rows.of(rows, CompanionMaterialsInfo).length, 1);
    }),
  );

  it.effect("refuses a qti-stylesheet with no href", () =>
    Effect.gen(function* run() {
      const error = yield* Effect.flip(built({ tail: `<qti-stylesheet type="text/css"/>` }));

      assert.instanceOf(error, ItemRefusal);
      assert.strictEqual(error.rule, "required-attribute");
    }),
  );

  it.effect("writes the rubric and template content bodies by their dotted kind", () =>
    Effect.gen(function* run() {
      const { rows } = yield* built({
        body: `<qti-rubric-block use="instructions" view="candidate"><qti-content-body><qti-template-block template-identifier="T" identifier="x"><qti-content-body><p>x</p></qti-content-body></qti-template-block></qti-content-body></qti-rubric-block><qti-template-block template-identifier="T" identifier="y"><qti-content-body><p>y</p></qti-content-body></qti-template-block>`,
        head: `<qti-template-declaration identifier="T" cardinality="single" base-type="identifier"/>`,
      });

      assert.strictEqual(Rows.of(rows, ContentBodyRubric).length, 1);
      assert.strictEqual(Rows.of(rows, ContentBodyRubricTemplate).length, 1);
      assert.strictEqual(Rows.of(rows, ContentBodyTemplate).length, 1);
      assert.deepStrictEqual(
        Rows.of(rows, TemplateBlock)
          .map((row) => row.identifier)
          .toSorted((a, b) => a.localeCompare(b)),
        ["y"],
      );
      assert.deepStrictEqual(
        Rows.of(rows, RubricTemplateBlock).map((row) => row.identifier),
        ["x"],
      );
    }),
  );

  it.effect("writes each feedback and template kind's own arm and marker", () =>
    Effect.gen(function* run() {
      const { rows } = yield* built({ body: sixKinds, head: sixKindsHead });
      const identifiers = (relation: AnyRelation) =>
        Rows.of(rows, relation).flatMap((row) =>
          Predicate.hasProperty(row, "identifier") ? [String(row.identifier)] : [],
        );
      const idByIdentifier = new Map(
        [
          FeedbackBlock,
          TemplateFeedbackBlock,
          TemplateBlock,
          RubricTemplateBlock,
          TemplateInline,
          RubricTemplateInline,
        ]
          .flatMap((relation) => Rows.of(rows, relation))
          .map((row) => [row.identifier, row.id]),
      );

      assert.deepStrictEqual(identifiers(FeedbackBlock), ["fa"]);
      assert.deepStrictEqual(identifiers(TemplateFeedbackBlock), ["ft"]);
      assert.deepStrictEqual(identifiers(TemplateBlock), ["tb"]);
      assert.deepStrictEqual(identifiers(RubricTemplateBlock), ["rb"]);
      assert.deepStrictEqual(identifiers(TemplateInline), ["ti"]);
      assert.deepStrictEqual(identifiers(RubricTemplateInline), ["ri"]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredTemplateFeedbackBlockShowHide), [
        { node: idByIdentifier.get("ft") ?? "" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredRubricTemplateBlockShowHide), [
        { node: idByIdentifier.get("rb") ?? "" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, DeclaredRubricTemplateInlineShowHide), [
        { node: idByIdentifier.get("ri") ?? "" },
      ]);
      // None: the fixture's `qti-feedback-block` `fa`, its only plain feedback block, writes no `show-hide`.
      assert.deepStrictEqual(Rows.of(rows, DeclaredFeedbackBlockShowHide), []);
      assert.deepStrictEqual(Rows.of(rows, DeclaredTemplateBlockShowHide), []);
      assert.deepStrictEqual(Rows.of(rows, DeclaredTemplateInlineShowHide), []);
      assert.strictEqual(Rows.of(rows, FeedbackOutcomeRef).length, 2);
      assert.strictEqual(Rows.of(rows, TemplateContentRef).length, 4);
    }),
  );

  it.effect("puts each feedback and template node's row in the arm its kind's Node law names", () =>
    Effect.gen(function* run() {
      const { rows } = yield* built({ body: sixKinds, head: sixKindsHead });
      const arms = sixHandles.map((handle) => armOfKind.get(handle));
      const idsOf = (relation: AnyRelation | undefined): readonly string[] =>
        relation === undefined
          ? []
          : Rows.of(rows, relation).flatMap((row) =>
              Predicate.hasProperty(row, "id") ? [String(row.id)] : [],
            );
      const nodes = Rows.of(rows, Node).filter((row) =>
        sixHandles.some((handle) => handle === row.kind),
      );

      assert.strictEqual(nodes.length, 6);
      for (const node of nodes) {
        const own = armOfKind.get(node.kind);

        assert.isDefined(own, node.kind);
        assert.deepStrictEqual(
          idsOf(own).filter((id) => id === node.id),
          [node.id],
          node.kind,
        );
        for (const other of arms.filter((arm) => arm !== own)) {
          assert.deepStrictEqual(
            idsOf(other).filter((id) => id === node.id),
            [],
            node.kind,
          );
        }
      }
    }),
  );
});
