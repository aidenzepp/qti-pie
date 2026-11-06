import { assert, describe, it } from "@effect/vitest";

import { hostAdditions } from "#pantry/schema/content/sets.ts";
import { entryOf, inventory } from "#pantry/schema/content/xsd-inventory.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as foreign from "#pantry/schema/kinds/foreign.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as mathml from "#pantry/schema/kinds/mathml.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import { AttributeName, NodeKind } from "#pantry/schema/node.ts";
import { bindingFit } from "#pantry/schema/seed/binding-fit.ts";

const asiAdmission = asi.admission;

const htmlAdmission = html.admission;

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const composed: readonly AdmissionRow[] = [
  ...asiAdmission,
  ...htmlAdmission,
  ...test.admission,
  ...mathml.admission,
];

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
    // Each host whose XSD content names `m3:math` gains the one `m:math` row of the MathML
    // vocabulary (spec 4.4); `qti-modal-feedback` names none.
    const expected = {
      div: 80 + 5 + 1,
      p: 36 + 5 + 1,
      "qti-item-body": 45 + 3 + 1,
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

/**
 * Phase-1's ASI and HTML kinds: the tuples' lengths before the roster append.
 */
const m0Asi = [
  "qti-assessment-item",
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-correct-response",
  "qti-default-value",
  "qti-value",
  "qti-item-body",
  "qti-choice-interaction",
  "qti-prompt",
  "qti-simple-choice",
  "qti-response-processing",
] as const;

const m0Html = ["p", "img"] as const;

/**
 * The 51 M1 element names of the XSD roster (spec 3.4). Five of them have several types and so
 * several handles, `qti-content-body` only dotted ones.
 */
const m1Names =
  `qti-area-map-entry qti-area-mapping qti-associable-hotspot qti-associate-interaction
qti-catalog-info qti-companion-materials-info qti-content-body qti-context-declaration
qti-drawing-interaction qti-end-attempt-interaction qti-extended-text-interaction qti-feedback-block
qti-feedback-inline qti-gap qti-gap-img qti-gap-match-interaction qti-gap-text
qti-graphic-associate-interaction qti-graphic-gap-match-interaction qti-graphic-order-interaction
qti-hotspot-choice qti-hotspot-interaction qti-hottext qti-hottext-interaction qti-inline-choice
qti-inline-choice-interaction qti-interpolation-table qti-interpolation-table-entry qti-label
qti-map-entry qti-mapping qti-match-interaction qti-match-table qti-match-table-entry
qti-media-interaction qti-modal-feedback qti-order-interaction qti-position-object-interaction
qti-position-object-stage qti-printed-variable qti-rubric-block qti-select-point-interaction
qti-simple-associable-choice qti-simple-match-set qti-slider-interaction qti-stylesheet
qti-template-block qti-template-declaration qti-template-inline qti-text-entry-interaction
qti-upload-interaction`
    .split("\n")
    .flatMap((line) => line.split(" "));

const htmlNames =
  `a abbr acronym address article aside audio b bdi bdo big blockquote br caption cite
code col colgroup dd details dfn div dl dt em figcaption figure footer h1 h2 h3 h4 h5 h6 header hr i
img kbd label li nav object ol p param picture pre q rb rp rt rtc ruby samp section small source span
strong sub summary sup table tbody td template tfoot th thead tr track tt ul var video`
    .split("\n")
    .flatMap((line) => line.split(" "));

const registries: readonly Readonly<Record<string, RegistryRow>>[] = [
  generic.registry,
  asi.registry,
  html.registry,
  cp.registry,
  lom.registry,
  qmd.registry,
  cpx.registry,
  drd.registry,
  csmd.registry,
  ud.registry,
  xi.registry,
  test.registry,
  foreign.registry,
  mathml.registry,
];

const attributeTuples: readonly (readonly string[])[] = [
  generic.attributes,
  asi.attributes,
  html.attributes,
  cp.attributes,
  lom.attributes,
  qmd.attributes,
  cpx.attributes,
  drd.attributes,
  csmd.attributes,
  ud.attributes,
  xi.attributes,
  test.attributes,
  foreign.attributes,
  mathml.attributes,
];

describe("the roster append", () => {
  it("appends 58 ASI and 74 HTML handles to phase-1's, beside phase-3's processing kinds", () => {
    assert.strictEqual(
      asi.kinds.length,
      m0Asi.length + 58 + asi.expressionKinds.length + asi.ruleKinds.length,
    );
    assert.strictEqual(html.kinds.length, m0Html.length + 74);
    assert.deepStrictEqual(asi.kinds.slice(0, m0Asi.length), [...m0Asi]);
    assert.deepStrictEqual(html.kinds.slice(0, m0Html.length), [...m0Html]);
  });

  it("gives every M1 name of the XSD roster a handle", () => {
    assert.strictEqual(m1Names.length, 51);
    for (const name of m1Names) {
      assert.isTrue(
        asi.kinds.some((kind) => kind === name || kind.startsWith(`${name}.`)),
        name,
      );
    }
    assert.strictEqual(htmlNames.length, 76);
    for (const name of htmlNames) {
      assert.include(html.kinds, name);
    }
  });

  it("composes NodeKind from the fourteen tuples", () => {
    const sum = [
      generic,
      asi,
      html,
      cp,
      lom,
      qmd,
      cpx,
      drd,
      csmd,
      ud,
      xi,
      test,
      foreign,
      mathml,
    ].reduce((n, kinds) => n + kinds.kinds.length, 0);
    assert.strictEqual(NodeKind.handles.length, sum);
    assert.strictEqual(new Set(NodeKind.handles).size, sum);
  });

  it("holds a registry row for every handle and none beyond", () => {
    for (const [kinds, registry] of [
      [asi.kinds, asi.registry],
      [html.kinds, html.registry],
      [test.kinds, test.registry],
    ] as const) {
      assert.deepStrictEqual(Object.keys(registry).toSorted(), [...kinds].toSorted());
    }
  });

  it("gives every inventory handle a registry attribute set equal to its entry's names", () => {
    for (const entry of Object.values(inventory)) {
      const row = { ...asi.registry, ...html.registry, ...test.registry, ...mathml.registry }[
        entry.handle
      ];
      assert.isDefined(row, entry.handle);
      // A test kind whose heading slice has not filled its row waits: `kinds/test.test.ts`'s
      // `awaiting` pins which. p5-19 fills the last row and deletes this skip.
      if (entry.handle in test.registry && row?.attributes.length === 0) {
        continue;
      }

      assert.deepStrictEqual(
        new Set(row?.attributes),
        new Set(entry.attributes.map((attribute) => attribute.name)),
        entry.handle,
      );
      assert.strictEqual(row?.attributes.length, new Set(row?.attributes).size, entry.handle);
    }
  });

  it("widens lom:string to language and xml:lang", () => {
    assert.include(lom.registry["lom:string"].attributes, "language");
    assert.include(lom.registry["lom:string"].attributes, "xml:lang");
  });

  it("composes AttributeName from the tuples, each registry attribute name once", () => {
    const names = registries.flatMap((registry) =>
      Object.values(registry).flatMap((row) => row.attributes),
    );
    assert.deepStrictEqual([...AttributeName.handles].toSorted(), [...new Set(names)].toSorted());

    const handles: readonly string[] = AttributeName.handles;
    assert.strictEqual(
      handles.length,
      attributeTuples.reduce((n, tuple) => n + tuple.length, 0),
    );
    assert.strictEqual(new Set(handles).size, handles.length);
  });

  it("declares a new name once, in the first vocabulary whose kind carries it", () => {
    assert.include(asi.attributes, "xml:lang");
    assert.include(asi.attributes, "aria-label");
    assert.include(html.attributes, "srcset");
    for (const name of ["type", "href", "identifierref"]) {
      assert.include(cp.attributes, name);
      assert.notInclude(asi.attributes, name);
      assert.notInclude(html.attributes, name);
    }
  });
});

const has = (baseType: string, cardinality: string, interactionKind: string): boolean =>
  bindingFit.some(
    (row) =>
      row.baseType === baseType &&
      row.cardinality === cardinality &&
      row.interactionKind === interactionKind,
  );

describe("the BindingFit rows", () => {
  it("holds 40 rows, every interaction kind a handle", () => {
    assert.strictEqual(bindingFit.length, 40);
    for (const row of bindingFit) {
      assert.include(NodeKind.handles, row.interactionKind);
    }
  });

  it("holds the select-point rows and keeps phase-1's choice rows", () => {
    assert.isTrue(has("point", "multiple", "qti-select-point-interaction"));
    assert.isFalse(has("identifier", "single", "qti-order-interaction"));
    assert.isTrue(has("identifier", "ordered", "qti-order-interaction"));
    assert.isTrue(has("identifier", "single", "qti-choice-interaction"));
    assert.isTrue(has("identifier", "multiple", "qti-choice-interaction"));
  });
});
