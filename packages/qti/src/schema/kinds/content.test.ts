import { assert, describe, it } from "@effect/vitest";

import { hostAdditions } from "#qti/schema/content/sets.ts";
import { entryOf, inventory } from "#qti/schema/content/xsd-inventory.ts";
import { admission as asiAdmission } from "#qti/schema/kinds/asi.ts";
import type { AdmissionRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";
import { admission as htmlAdmission } from "#qti/schema/kinds/html.ts";

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const composed: readonly AdmissionRow[] = [...asiAdmission, ...htmlAdmission];

const key = (version: string, parent: string, child: string): string =>
  `${version}|${parent}|${child}`;

const present = new Set(composed.map((row) => key(row.version, row.parent, row.child)));

const admits = (version: string, parent: string, child: string): boolean =>
  present.has(key(version, parent, child));

const childrenOf = (version: string, parent: string): readonly string[] =>
  composed
    .filter((row) => row.version === version && row.parent === parent)
    .map((row) => row.child);

const pairs = (version: string): readonly string[] =>
  composed.filter((row) => row.version === version).map((row) => `${row.parent}|${row.child}`);

const presentPairs: readonly (readonly [string, string])[] = [
  ["p", "qti-text-entry-interaction"],
  ["div", "qti-choice-interaction"],
  ["li", "qti-feedback-block"],
  ["span", "qti-hottext"],
  ["a", "qti-gap"],
  ["bdo", "span"],
  ["table", "tbody"],
  ["tr", "th"],
  ["details", "summary"],
  ["picture", "source"],
  ["object", "param"],
  ["qti-content-body.feedback", "qti-choice-interaction"],
  ["qti-gap-match-interaction", "p"],
  ["qti-gap-text", "qti-printed-variable"],
  ["qti-position-object-stage", "qti-position-object-interaction"],
  ["qti-hottext-interaction", "p"],
  ["qti-context-declaration", "qti-default-value"],
  ["div", "ws"],
  ["span", "entityRef"],
];

const absentPairs: readonly (readonly [string, string])[] = [
  ["p", "qti-choice-interaction"],
  ["bdi", "qti-printed-variable"],
  ["p", "div"],
  ["summary", "p"],
  ["table", "td"],
  ["ol", "p"],
  ["audio", "p"],
  ["qti-content-body.modal", "qti-choice-interaction"],
  ["qti-feedback-inline", "qti-feedback-block"],
  ["qti-gap-match-interaction", "qti-gap"],
  ["qti-hottext-interaction", "qti-hottext"],
  ["qti-catalog-info", "qti-catalog"],
];

describe("the M1 Admission rows", () => {
  it("admits each listed pair in both versions", () => {
    for (const version of versions) {
      for (const [parent, child] of presentPairs) {
        assert.isTrue(admits(version, parent, child), `${version}: (${parent}, ${child})`);
      }
    }
  });

  it("refuses each listed pair in both versions", () => {
    for (const version of versions) {
      for (const [parent, child] of absentPairs) {
        assert.isFalse(admits(version, parent, child), `${version}: (${parent}, ${child})`);
      }
    }
  });

  it("gives the empty type comments and instructions only", () => {
    for (const version of versions) {
      assert.deepStrictEqual([...childrenOf(version, "qti-text-entry-interaction")].toSorted(), [
        "comment",
        "pi",
      ]);
    }
  });

  it("admits comments and instructions under every element host, and text under every mixed host", () => {
    for (const version of versions) {
      for (const entry of Object.values(inventory)) {
        if (entry.handle === "template") {
          continue;
        }

        assert.isTrue(admits(version, entry.handle, "comment"), `${entry.handle} comment`);
        assert.isTrue(admits(version, entry.handle, "pi"), `${entry.handle} pi`);
        if (entry.mixed) {
          assert.isTrue(admits(version, entry.handle, "text"), `${entry.handle} text`);
          assert.isTrue(admits(version, entry.handle, "entityRef"), `${entry.handle} entityRef`);
        }
      }
    }
  });

  it("counts the rows of p, div, qti-item-body and qti-modal-feedback per host", () => {
    const expected = {
      div: 80 + 5,
      p: 36 + 5,
      "qti-item-body": 45 + 3,
      "qti-modal-feedback": 3 + 3,
    };
    for (const version of versions) {
      for (const [host, count] of Object.entries(expected)) {
        assert.strictEqual(childrenOf(version, host).length, count, `${version}: ${host}`);
      }
    }
  });

  it("gives both versions the same rows", () => {
    assert.deepStrictEqual(pairs("3.0.0"), pairs("3.0.1"));
  });

  it("admits every QTI addition of hostAdditions that the roster holds", () => {
    for (const [host, additions] of Object.entries(hostAdditions)) {
      if (entryOf(host)._tag === "None") {
        continue;
      }

      for (const addition of additions) {
        if (entryOf(addition)._tag === "None") {
          continue;
        }

        const handles = [addition, `${addition}.rubric`, `${addition}.template`];
        assert.isTrue(
          handles.some((handle) => admits("3.0.1", host, handle)),
          `hostAdditions: (${host}, ${addition})`,
        );
      }
    }
  });

  it("follows the XSD on details: flow hosts admit it, the item body and hottext interaction do not", () => {
    for (const version of versions) {
      assert.isTrue(admits(version, "div", "details"));
      assert.isFalse(admits(version, "qti-item-body", "details"));
      assert.isFalse(admits(version, "qti-hottext-interaction", "details"));
    }
  });

  it("maps a multi-type child to the dotted handle its host names", () => {
    for (const version of versions) {
      assert.isTrue(admits(version, "qti-modal-feedback", "qti-content-body.modal"));
      assert.isTrue(admits(version, "qti-feedback-block", "qti-content-body.feedback"));
      assert.isTrue(admits(version, "qti-feedback-block.template", "qti-content-body.template"));
      assert.isTrue(
        admits(version, "qti-template-block.rubric", "qti-content-body.rubricTemplate"),
      );
      assert.isTrue(admits(version, "qti-content-body.template", "qti-feedback-block.template"));
      assert.isTrue(admits(version, "qti-content-body.rubric", "qti-template-block.rubric"));
      assert.isTrue(admits(version, "qti-content-body.rubric", "qti-template-inline.rubric"));
      assert.isFalse(admits(version, "qti-modal-feedback", "qti-content-body"));
    }
  });

  it("holds no duplicate (version, parent, child) row", () => {
    assert.strictEqual(present.size, composed.length);
  });

  it("keeps phase-1's M0 rows", () => {
    for (const version of versions) {
      assert.isTrue(admits(version, "qti-item-body", "qti-choice-interaction"));
      assert.isTrue(admits(version, "qti-assessment-item", "qti-response-declaration"));
      assert.isTrue(admits(version, "qti-value", "text"));
      assert.isTrue(admits(version, "p", "img"));
      assert.isTrue(admits(version, "img", "comment"));
    }
  });
});
