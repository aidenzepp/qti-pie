import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import * as template from "#pantry/schema/html/template.ts";
import * as node from "#pantry/schema/node.ts";
import { admission } from "#pantry/schema/seed/admission.ts";

describe("html/template.ts", () => {
  it("arms the template handle with the Template relation and no other", () => {
    assert.deepStrictEqual(Object.keys(template.arms), ["template"]);
    assert.strictEqual(template.arms.template, template.relations.Template);
  });

  it("gives Template the fields id and the primary key [id]", () => {
    const { Template } = template.relations;
    assert.deepStrictEqual(Object.keys(Template.fields), ["id"]);
    assert.deepStrictEqual([...Template.primaryKey], ["id"]);
  });

  it("is a handle of NodeKind that no Admission row names as a child", () => {
    assert.include(node.NodeKind.handles, "template");
    assert.deepStrictEqual(
      admission.filter((row) => row.child === "template"),
      [],
    );
  });

  it("builds in a probe schema beside the node relations", () => {
    const probe = schema("TemplateArmProbe", { ...node.relations, ...template.relations }, []);
    assert.isDefined(probe);
  });
});
