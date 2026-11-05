import { assert, describe, it } from "@effect/vitest";
import type { Fact } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { guards } from "#pantry/import/guards.ts";
import { Rows } from "#pantry/import/tree.ts";
import { NamespaceUri, XmlLocalName } from "#pantry/schema/contracts.ts";
import { ForeignElement } from "#pantry/schema/foreign.ts";
import { namespaces } from "#pantry/schema/seed/wildcard.ts";

const underOperator = (namespace: string): Rows =>
  Rows.add(Rows.empty(), ForeignElement, [
    {
      id: crypto.randomUUID(),
      local: XmlLocalName("foo"),
      namespace: NamespaceUri(namespace),
      parentKind: "qti-custom-operator",
      prefix: "q",
      rootKind: "item",
      schemaSet: "asi",
    } satisfies Fact<typeof ForeignElement>,
  ]);

describe("guards runs the wildcard guard", () => {
  it.effect("refuses an ASI element under qti-custom-operator as wildcard-namespace", () =>
    Effect.gen(function* refused() {
      const refusal = yield* Effect.flip(guards(underOperator(namespaces.asi), []));

      assert.strictEqual(refusal._tag, "WildcardGuardRefusal");
      assert.strictEqual(
        refusal._tag === "WildcardGuardRefusal" && refusal.rule,
        "wildcard-namespace",
      );
    }),
  );

  it.effect("passes the same element in another namespace", () =>
    guards(underOperator("http://example.org/x"), []),
  );
});
