import { assert, describe, it } from "@effect/vitest";
import { isMappedLaw, ruleOfLaw } from "#qti/import/refusal.ts";
import type { ImportLaw } from "#qti/import/refusal.ts";

const contained = (
  from: string,
  fromFields: readonly string[],
  to: string,
  toFields: readonly string[],
  selection: readonly { readonly field: string; readonly value: string }[] = [],
): ImportLaw => ({
  from: { fields: fromFields, relation: from, selection: [] },
  kind: "contained",
  to: { fields: toFields, relation: to, selection },
});

describe("the content rules of a containment", () => {
  it("names an idref target missing from DocumentId idref-target", () => {
    const law = contained("AttributeIdref", ["document", "target"], "DocumentId", [
      "document",
      "id",
    ]);

    assert.strictEqual(ruleOfLaw(law), "idref-target");
    assert.isTrue(isMappedLaw(law));
  });

  it("names a headers target that is no th idref-target", () => {
    const law = contained(
      "HeadersTarget",
      ["document", "target"],
      "HtmlId",
      ["document", "id"],
      [{ field: "kind", value: "th" }],
    );

    assert.strictEqual(ruleOfLaw(law), "idref-target");
    assert.isTrue(isMappedLaw(law));
  });

  it("keeps the headers copy into AttributeIdref idref-copy", () => {
    const law = contained(
      "HeadersTarget",
      ["node", "attribute", "position", "target"],
      "AttributeIdref",
      ["node", "attribute", "position", "target"],
    );

    assert.strictEqual(ruleOfLaw(law), "idref-copy");
    assert.isTrue(isMappedLaw(law));
  });

  it("names the idref row's document copy idref-target", () => {
    const law = contained("AttributeIdref", ["node", "document"], "Node", ["id", "tree"]);

    assert.strictEqual(ruleOfLaw(law), "idref-target");
    assert.isTrue(isMappedLaw(law));
  });

  it("keeps a reference's document copy under its reference rule", () => {
    const law = contained("ChoiceTemplateRef", ["node", "document"], "Node", ["id", "tree"]);

    assert.strictEqual(ruleOfLaw(law), "template-ref");
    assert.isTrue(isMappedLaw(law));
  });

  it("names each id holder's document copy document-key", () => {
    const laws: readonly (readonly [string, ImportLaw])[] = [
      ["HtmlId", contained("HtmlId", ["node", "document", "kind"], "Node", ["id", "tree", "kind"])],
      ...["ItemBodyId", "PrintedVariableId", "ContextDeclarationId"].map(
        (holder): readonly [string, ImportLaw] => [
          holder,
          contained(holder, ["node", "document"], "Node", ["id", "tree"]),
        ],
      ),
    ];

    for (const [holder, law] of laws) {
      assert.strictEqual(ruleOfLaw(law), "document-key", holder);
      assert.isTrue(isMappedLaw(law), holder);
    }
  });

  it("keeps a 3.0.0 context declaration's holder containment context-id", () => {
    const law = contained(
      "ContextDeclarationArm",
      ["id"],
      "ContextDeclarationId",
      ["node"],
      [{ field: "version", value: "3.0.0" }],
    );

    assert.strictEqual(ruleOfLaw(law), "context-id");
    assert.isTrue(isMappedLaw(law));
  });

  it("leaves a containment between unnamed relations to the admission fallback", () => {
    const law = contained("Unnamed", ["id"], "Elsewhere", ["id"]);

    assert.strictEqual(ruleOfLaw(law), "admission");
    assert.isFalse(isMappedLaw(law));
  });
});
