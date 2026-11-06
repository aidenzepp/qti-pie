import { assert, describe, it } from "@effect/vitest";

import { NamespacePolicy, ProcessContents, SchemaSet } from "#pantry/schema/content/rosters.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as foreign from "#pantry/schema/kinds/foreign.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { AttributeName, NodeKind, RootKind } from "#pantry/schema/node.ts";
import { ForeignElement } from "#pantry/schema/foreign.ts";
import { nodeArms } from "#pantry/schema/qti.ts";

const predecessors = [generic, asi, html, cp, lom, qmd, cpx, drd, csmd, ud, xi] as const;

const kindHandles: readonly string[] = NodeKind.handles;

const attributeHandles: readonly string[] = AttributeName.handles;

const xlinkNames = [
  "xlink:type",
  "xlink:href",
  "xlink:role",
  "xlink:arcrole",
  "xlink:title",
  "xlink:show",
  "xlink:actuate",
  "xlink:label",
  "xlink:from",
  "xlink:to",
] as const;

describe("the foreign vocabulary", () => {
  it("makes foreign a NodeKind handle after every handle of the eleven earlier vocabularies", () => {
    assert.deepStrictEqual(foreign.kinds, ["foreign"]);

    const index = kindHandles.indexOf("foreign");
    assert.isAtLeast(index, 0);
    for (const vocabulary of predecessors) {
      for (const kind of vocabulary.kinds) {
        assert.isBelow(kindHandles.indexOf(kind), index, kind);
      }
    }
    assert.strictEqual(kindHandles.filter((kind) => kind === "foreign").length, 1);
  });

  it("registers foreign with no local name, so no element is read as it", () => {
    assert.strictEqual(foreign.registry.foreign.local, "");
    assert.strictEqual(foreign.registry.foreign.namespace, "");
    assert.isTrue(foreign.registry.foreign.parent._tag === "None");
    assert.deepStrictEqual(foreign.registry.foreign.attributes, [
      ...xlinkNames,
      "xml:space",
      "xml:id",
    ]);
  });

  it("lists each of the twelve names once in AttributeName, xml:space and xml:id right after xml:base", () => {
    const base = attributeHandles.indexOf("xml:base");
    assert.isAtLeast(base, 0);
    assert.strictEqual(attributeHandles[base + 1], "xml:space");
    assert.strictEqual(attributeHandles[base + 2], "xml:id");
    assert.strictEqual(asi.attributes.indexOf("xml:space"), asi.attributes.indexOf("xml:base") + 1);
    assert.strictEqual(asi.attributes.indexOf("xml:id"), asi.attributes.indexOf("xml:base") + 2);
    assert.deepStrictEqual(foreign.attributes, xlinkNames);
    for (const name of [...xlinkNames, "xml:space", "xml:id"]) {
      assert.strictEqual(attributeHandles.filter((handle) => handle === name).length, 1, name);
    }
  });

  it("admits mixed content and foreign content under foreign, in both versions", () => {
    const children = ["text", "ws", "comment", "pi", "entityRef", "foreign"];
    assert.strictEqual(foreign.admission.length, 12);
    for (const version of ["3.0.0", "3.0.1"]) {
      assert.deepStrictEqual(
        foreign.admission
          .filter((row) => row.version === version)
          .map((row) => row.child)
          .toSorted(),
        children.toSorted(),
      );
    }
    assert.isTrue(foreign.admission.every((row) => row.parent === "foreign"));
  });

  it("holds the three QTI wildcard rosters in order", () => {
    assert.deepStrictEqual(NamespacePolicy.handles, ["any", "other", "otherOrLocal"]);
    assert.deepStrictEqual(ProcessContents.handles, ["lax", "strict", "skip"]);
    assert.deepStrictEqual(SchemaSet.handles, ["asi", "manifest", "lom", "usagedata"]);
  });

  it("gives foreign the ForeignElement arm, with every field it will ever have", () => {
    assert.strictEqual(nodeArms.foreign, ForeignElement);
    assert.deepStrictEqual(Object.keys(ForeignElement.fields).toSorted(), [
      "id",
      "local",
      "namespace",
      "parentKind",
      "prefix",
      "rootKind",
      "schemaSet",
    ]);
    assert.deepStrictEqual([...ForeignElement.primaryKey], ["id"]);
    assert.isTrue(RootKind.handles.length > 0);
  });
});
