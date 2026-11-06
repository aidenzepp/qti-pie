import { NodeServices } from "@effect/platform-node";
import { assert, describe, it as plainIt, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readRows, routeOf } from "#pantry/import/package.ts";
import { Rows } from "#pantry/import/tree.ts";
import { Document } from "#pantry/schema/document.ts";
import { Node } from "#pantry/schema/node.ts";
import { TemplateDefault } from "#pantry/schema/test/rules.ts";
import { TestReach } from "#pantry/schema/test/structure.ts";
import { materialize } from "#pantry/test/fixtures.ts";

describe("routeOf", () => {
  plainIt("sends each root a builder names to that builder", () => {
    assert.strictEqual(routeOf("qti-assessment-item", "imsqti_item_xmlv3p0"), "item");
    assert.strictEqual(routeOf("qti-assessment-test", "imsqti_test_xmlv3p0"), "test");
    assert.strictEqual(routeOf("qti-assessment-section", "imsqti_section_xmlv3p0"), "test");
    assert.strictEqual(routeOf("qti-assessment-stimulus", "imsqti_stimulus_xmlv3p0"), "stimulus");
    assert.strictEqual(routeOf("qti-outcome-declaration", "imsqti_outcomes_xmlv3p0"), "outcomes");
    assert.strictEqual(routeOf("lom:lom", "resourcemetadata/xml"), "external");
    assert.strictEqual(routeOf("ud:usageData", "qtiusagedata/xml"), "usage");
  });

  plainIt("sends a usage-data file with an unnamed root to the usage builder", () => {
    assert.strictEqual(routeOf(undefined, "qtiusagedata/xml"), "usage");
  });

  plainIt("sends an rptemplate type there whatever its root", () => {
    assert.strictEqual(
      routeOf("qti-response-processing", "imsqti_rptemplate_xmlv3p0"),
      "rptemplate",
    );
  });

  plainIt(
    "leaves an unknown root, and a response-processing root under another type, unmodeled",
    () => {
      assert.strictEqual(routeOf(undefined, "imsqti_item_xmlv3p0"), "unmodeled");
      assert.strictEqual(routeOf("qti-response-processing", "imsqti_item_xmlv3p0"), "unmodeled");
    },
  );
});

layer(NodeServices.layer)("readRows", (it) => {
  it.effect("reads a simple package's documents and nodes", () =>
    Effect.gen(function* readsSimple() {
      const { rows } = yield* readRows(yield* materialize("simple"));

      assert.isAbove(Rows.of(rows, Document).length, 0);
      assert.isAbove(Rows.of(rows, Node).length, 0);
    }),
  );

  it.effect("includes the rows the package stage writes, the template-default arm among them", () =>
    Effect.gen(function* readsMapping() {
      const { rows } = yield* readRows(yield* materialize("test-template-default"));

      assert.isAbove(Rows.of(rows, TestReach).length, 0);
      assert.isAbove(Rows.of(rows, TemplateDefault).length, 0);
    }),
  );
});
