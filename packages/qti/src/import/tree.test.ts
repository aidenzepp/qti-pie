/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`) the declarations under test carry. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, it, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import { inject } from "vitest";
import {
  AttributeLexical,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeMisc,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
} from "#qti/schema/node.ts";
import { materialize } from "#qti/test/fixtures.ts";
import {
  collapse,
  kindOf,
  replace,
  Rows,
  treeRows,
  typedAttribute,
  UnmodeledVocabulary,
} from "#qti/import/tree.ts";
import type { TreeInput } from "#qti/import/tree.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element } from "#qti/xml/tree.ts";

const treeId = "11111111-1111-4111-8111-111111111111";

/**
 * The input of an item document whose charset is the one the reader decoded it under.
 */
const itemInput = (charset: string): TreeInput => ({
  charset,
  id: treeId,
  kind: "document",
  root: "item",
  version: "3.0.0",
});

/**
 * Read `choice.xml` of a materialized fixture directory, after replacing the first occurrence of
 * `search` with `replacement` when an edit is given.
 */
const readChoice = (directory: string, edit?: readonly [search: string, replacement: string]) =>
  Effect.gen(function* readChoiceFile() {
    const fs = yield* FileSystem.FileSystem;
    const bytes = yield* fs.readFile(path.join(directory, "choice.xml"));
    if (edit === undefined) {
      return yield* readXml(bytes);
    }

    const text = new TextDecoder().decode(bytes);
    assert.isTrue(text.includes(edit[0]), `choice.xml holds ${edit[0]}`);

    return yield* readXml(new TextEncoder().encode(text.replace(edit[0], edit[1])));
  });

layer(NodeServices.layer, { excludeTestServices: true })("import/tree.ts", (suite) => {
  suite.effect("choice.xml yields one Tree row and the prolog fidelity rows", () =>
    Effect.gen(function* choiceRows() {
      const doc = yield* readChoice(inject("fixtures").simple);
      const { rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());

      assert.deepStrictEqual(Rows.of(rows, Tree), [
        { charset: "UTF-8", id: treeId, kind: "document", root: "item", version: "3.0.0" },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TreeMisc), [
        {
          kind: "comment",
          placement: "prolog",
          position: 0n,
          text: " This example adapted from the PET Handbook, copyright University of Cambridge ESOL Examinations ",
          tree: treeId,
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TreeXmlVersion), [{ tree: treeId, value: "1.0" }]);
      assert.deepStrictEqual(Rows.of(rows, TreeXmlEncoding), [{ tree: treeId, value: "UTF-8" }]);
      assert.deepStrictEqual(Rows.of(rows, TreeXmlStandalone), []);
      assert.deepStrictEqual(Rows.of(rows, TreeDoctype), []);
      assert.deepStrictEqual(Rows.of(rows, TreeExportCharset), []);
    }),
  );

  suite.effect("the windows-1252 fixture yields a TreeExportCharset row of UTF-8", () =>
    Effect.gen(function* windows1252() {
      const doc = yield* readChoice(yield* materialize("windows-1252"));
      const { rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());

      assert.deepStrictEqual(
        Rows.of(rows, Tree).map((row) => row.charset),
        ["windows-1252"],
      );
      assert.deepStrictEqual(Rows.of(rows, TreeExportCharset), [{ label: "UTF-8", tree: treeId }]);
    }),
  );

  suite.effect("the doctype fixture yields a TreeDoctype row holding the DOCTYPE text whole", () =>
    Effect.gen(function* doctype() {
      const doc = yield* readChoice(yield* materialize("doctype"));
      const { rows } = yield* treeRows(doc, itemInput(doc.charset), Rows.empty());
      const text = Option.getOrThrow(doc.doctype);

      assert.isTrue(text.startsWith("<!DOCTYPE qti-assessment-item"));
      assert.deepStrictEqual(Rows.of(rows, TreeDoctype), [{ text, tree: treeId }]);
    }),
  );

  suite.effect("an element outside the registries is refused by name", () =>
    Effect.gen(function* unmodeledElement() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        "<qti-prompt>",
        "<div>x</div><qti-prompt>",
      ]);
      const exit = yield* Effect.exit(treeRows(doc, itemInput(doc.charset), Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      const refusal = Option.getOrThrow(failure);
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "element");
      assert.strictEqual(refusal.name, "div");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-choice-interaction"));
    }),
  );

  suite.effect("an attribute outside the registry is refused by name", () =>
    Effect.gen(function* unmodeledAttribute() {
      const doc = yield* readChoice(inject("fixtures").simple, [
        "<qti-assessment-item ",
        '<qti-assessment-item class="x" ',
      ]);
      const exit = yield* Effect.exit(treeRows(doc, itemInput(doc.charset), Rows.empty()));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      const refusal = Option.getOrThrow(failure);
      assert.instanceOf(refusal, UnmodeledVocabulary);
      assert.strictEqual(refusal.kind, "attribute");
      assert.strictEqual(refusal.name, "class");
      assert.deepStrictEqual(refusal.parent, Option.some("qti-assessment-item"));
    }),
  );
});

it("replace turns tab, line feed and carriage return into spaces", () => {
  assert.strictEqual(replace("a\tb\nc\rd\r\ne"), "a b c d  e");
});

it("collapse replaces, trims and joins runs of spaces", () => {
  assert.strictEqual(collapse(" \ta \n\r b\t "), "a b");
});

const node = "22222222-2222-4222-8222-222222222222";

it("typedAttribute on a padded collapse value returns it collapsed with one AttributeLexical row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "adaptive",
    " true ",
    "collapse",
  );

  assert.strictEqual(result.value, "true");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), [
    { attribute: "adaptive", kind: "qti-assessment-item", node, value: " true " },
  ]);
});

it("typedAttribute on an already collapsed value appends no row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "adaptive",
    "true",
    "collapse",
  );

  assert.strictEqual(result.value, "true");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), []);
});

it("typedAttribute on a replace value holding a tab returns it replaced with one row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "title",
    "Unattended\tLuggage",
    "replace",
  );

  assert.strictEqual(result.value, "Unattended Luggage");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), [
    { attribute: "title", kind: "qti-assessment-item", node, value: "Unattended\tLuggage" },
  ]);
});

it("typedAttribute on a replace value without a tab, line feed or carriage return appends no row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "title",
    "Unattended  Luggage",
    "replace",
  );

  assert.strictEqual(result.value, "Unattended  Luggage");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), []);
});

it("typedAttribute on a preserve value is returned unchanged with no row", () => {
  const result = typedAttribute(
    Rows.empty(),
    node,
    "qti-assessment-item",
    "title",
    "a\tb",
    "preserve",
  );

  assert.strictEqual(result.value, "a\tb");
  assert.deepStrictEqual(Rows.of(result.rows, AttributeLexical), []);
});

/**
 * An attribute-free, childless element in `namespace`.
 */
const bare = (namespace: string, local: string): Element => ({
  attributes: [],
  children: [],
  kind: "element",
  local,
  namespace,
  prefix: "",
  qname: local,
});

const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

const lomNamespace = "http://ltsc.ieee.org/xsd/LOM";

it("kindOf resolves a dotted handle by the parent's kind", () => {
  const metadata = bare(cpNamespace, "metadata");
  const duration = bare(lomNamespace, "duration");

  assert.deepStrictEqual(
    kindOf(metadata, Option.some("cp:manifest")),
    Option.some("cp:metadata.manifest"),
  );
  assert.deepStrictEqual(
    kindOf(metadata, Option.some("cp:resource")),
    Option.some("cp:metadata.resource"),
  );
  assert.deepStrictEqual(kindOf(metadata, Option.some("cp:resources")), Option.none());
  assert.deepStrictEqual(kindOf(metadata, Option.none()), Option.none());
  assert.deepStrictEqual(kindOf(duration, Option.some("lom:general")), Option.some("lom:duration"));
  assert.deepStrictEqual(
    kindOf(duration, Option.some("lom:duration")),
    Option.some("lom:duration.string"),
  );
});
