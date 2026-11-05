/**
 * The strict attribute hosts of a test document (`qti-selection` and `qti-ordering`, phase 11's
 * J5): what the importer makes of a declared global attribute, a foreign element and a foreign
 * attribute on each. Every case builds the test from an inline literal through `testRows`; no
 * database, no tarball. The case names carry the probe each one pins (3.3's `strict/a` to
 * `strict/e`), and the last cases pin decision 306: every element in `qti-ordering`'s extension
 * slot is foreign, a QTI-named one included, while `qti-selection` keeps refusing a reused ASI tag
 * (Table 5.129.4).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Uuid } from "@bjornpagen/grizzle";
import { readRows } from "#pantry/import/preview.ts";
import { wildcardGuards } from "#pantry/import/guards/wildcard.ts";
import { ruleOfError } from "#pantry/import/refusal.ts";
import { testRows } from "#pantry/import/test.ts";
import { Rows } from "#pantry/import/tree.ts";
import { NodeXmlLang } from "#pantry/schema/attributes.ts";
import { ForeignAttribute, ForeignElement } from "#pantry/schema/foreign.ts";
import { materialize } from "#pantry/test/fixtures.ts";

const packageId: Uuid = "33333333-3333-4333-8333-333333333333";

const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

const mathassess = "http://mathassess.qtitools.org/xsd/mathassess";

type Host = "qti-ordering" | "qti-selection";

const hosts: readonly Host[] = ["qti-selection", "qti-ordering"];

/**
 * A test document with one part and one section holding `host`, an element of that name with the
 * given attributes and content, and an item reference after it.
 */
const document = (host: Host, attributes: string, content: string): string =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<qti-assessment-test xmlns="${asi}" xmlns:ma="${mathassess}" identifier="T" title="A test">` +
  `<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">` +
  `<qti-assessment-section identifier="S" title="Section" visible="true">` +
  `<${host}${attributes}>${content}</${host}>` +
  `<qti-assessment-item-ref identifier="I1" href="items/one.xml"/>` +
  `</qti-assessment-section></qti-test-part></qti-assessment-test>`;

const built = (text: string) =>
  Effect.gen(function* builtDocument() {
    const doc = yield* readXml(new TextEncoder().encode(text));

    return yield* testRows(
      {
        doc,
        packageId,
        path: "document.xml",
        resource: "document",
        resourceLomHasGeneral: false,
        resourceType: "imsqti_test_xmlv3p0",
        version: "3.0.0",
      },
      Rows.empty(),
    );
  });

/**
 * The refusal a document ends in, as the importer names it: the walk's, or else the wildcard
 * guard's over the rows the walk built. The walk lets any element through a lax host; the guard
 * refuses the ASI ones `qti-selection` does not admit.
 */
const refused = (text: string) =>
  Effect.gen(function* refusedDocument() {
    const outcome = yield* Effect.flip(
      Effect.flatMap(built(text), ({ rows }) => wildcardGuards(rows)),
    );

    return ruleOfError(outcome);
  });

const selectAttribute = ' select="1"';

describe("the strict attribute hosts of a test document", () => {
  for (const host of hosts) {
    it.effect(
      `strict/d: xml:lang on ${host} is a typed NodeXmlLang row, never a foreign attribute`,
      () =>
        Effect.gen(function* declaredGlobal() {
          const attribute = host === "qti-selection" ? selectAttribute : "";
          const { rows } = yield* built(document(host, `${attribute} xml:lang="en"`, ""));

          const langs = Rows.of(rows, NodeXmlLang);
          assert.strictEqual(langs.length, 1);
          assert.strictEqual(langs[0]?.value, "en");
          assert.strictEqual(Rows.of(rows, ForeignAttribute).length, 0);
        }),
    );

    it.effect(`strict/a: a foreign element inside ${host} is a ForeignElement row under it`, () =>
      Effect.gen(function* foreignElement() {
        const attribute = host === "qti-selection" ? selectAttribute : "";
        const { rows } = yield* built(document(host, attribute, "<ma:ext/>"));

        const foreign = Rows.of(rows, ForeignElement);
        assert.strictEqual(foreign.length, 1);
        assert.strictEqual(foreign[0]?.local, "ext");
        assert.strictEqual(foreign[0]?.namespace, mathassess);
        assert.strictEqual(foreign[0]?.parentKind, host);
      }),
    );

    it.effect(`strict/b: a foreign attribute on ${host} is refused as unmodeled-vocabulary`, () =>
      Effect.gen(function* foreignAttribute() {
        const attribute = host === "qti-selection" ? selectAttribute : "";
        const refusal = yield* refused(document(host, `${attribute} ma:x="1"`, ""));

        assert.strictEqual(refusal.rule, "unmodeled-vocabulary");
      }),
    );
  }

  it.effect(
    "strict/e: an unmodeled QTI-named element inside qti-selection is refused as wildcard-namespace",
    () =>
      Effect.gen(function* unmodeledInSelection() {
        const refusal = yield* refused(document("qti-selection", selectAttribute, "<qti-foo/>"));

        assert.strictEqual(refusal.rule, "wildcard-namespace");
      }),
  );

  it.effect(
    "decision 306: qti-variable and an unmodeled qti-foo inside qti-ordering are foreign elements",
    () =>
      Effect.gen(function* orderingExtension() {
        const { rows } = yield* built(
          document("qti-ordering", "", '<qti-variable identifier="V"/><qti-foo/>'),
        );
        yield* wildcardGuards(rows);

        const foreign = Rows.of(rows, ForeignElement);
        assert.deepStrictEqual(
          foreign.map((row) => [row.local, row.namespace, row.parentKind]),
          [
            ["qti-variable", asi, "qti-ordering"],
            ["qti-foo", asi, "qti-ordering"],
          ],
        );
      }),
  );

  it.effect(
    "decision 306: qti-variable inside qti-selection stays refused as wildcard-namespace",
    () =>
      Effect.gen(function* variableInSelection() {
        const refusal = yield* refused(
          document("qti-selection", selectAttribute, '<qti-variable identifier="V"/>'),
        );

        assert.strictEqual(refusal.rule, "wildcard-namespace");
      }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "readRows on the test-selection-foreign fixture",
  (suite) => {
    suite.effect("reads an xml:lang and one foreign element on each strict attribute host", () =>
      Effect.gen(function* fixture() {
        const { rows } = yield* readRows(yield* materialize("test-selection-foreign"));

        const foreign = Rows.of(rows, ForeignElement);
        assert.deepStrictEqual(
          foreign.map((row) => row.parentKind),
          ["qti-selection", "qti-ordering"],
        );
        assert.strictEqual(Rows.of(rows, NodeXmlLang).length, 2);
        assert.strictEqual(Rows.of(rows, ForeignAttribute).length, 0);
      }),
    );
  },
);
