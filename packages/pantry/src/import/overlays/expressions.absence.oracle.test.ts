/**
 * The expression overlays' rows where an element leaves out an attribute their laws read: the
 * import and the law oracle give one verdict on every package of a small box.
 *
 * The attributes are those that type an attribute-typed expression: a base value's `base-type`, a
 * math operator's `name` and a test variables' `base-type`.
 *
 * A required attribute an element leaves out is AL3's alone. The XSD requires the first two
 * (`BaseValueDType`, `MathOperatorDType`); a test variables' `base-type` is optional, and its
 * absence types the element `unknown`. So the rows must break no law the oracle does not raise. An
 * unwritten typing row, which `E1_derived` refuses, breaks that.
 *
 * Each package is judged both ways by the genetic differential's judge (`judgeOne` of
 * `#pantry/test/gen/genetic/judge.ts`): the law oracle over the documents as written, and
 * `readProgram`'s refusal or the laws its rows break on the host. No package may show a class of
 * disagreement the known table (`#pantry/test/gen/genetic/known.ts`) does not record, which waits
 * on its owner's fix there, as NS1's dangling `VariableRef.declaration` of a built-in does.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, recordsClassOf, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * How an element writes the attribute a case varies: not at all, as a value the attribute's type
 * spells, or as one it does not.
 */
type Written = "spelled" | "unspelled" | "unwritten";

/**
 * One package of the box: an attribute-typed expression whose typing attribute is written or not.
 */
interface Case {
  readonly kind: "qti-base-value" | "qti-math-operator" | "qti-test-variables";
  readonly written: Written;
}

/**
 * Hold a box's cases as the nonempty list a generator draws from.
 *
 * @param listed - The cases.
 * @returns The same cases, typed nonempty.
 * @throws {Error} When the box lists none, which its product never does.
 */
const nonEmpty = (listed: readonly Case[]): readonly [Case, ...Case[]] => {
  if (Arr.isReadonlyArrayNonEmpty(listed)) {
    return listed;
  }

  throw new Error("The box lists no case. List each typed kind under each way of writing it.");
};

/**
 * Every case of the box: each typed kind under each {@link Written}.
 */
const cases = nonEmpty(
  (["qti-base-value", "qti-math-operator", "qti-test-variables"] as const).flatMap((kind) =>
    (["unwritten", "spelled", "unspelled"] as const).map((written): Case => ({ kind, written })),
  ),
);

/**
 * The box, every case once.
 */
const caseGen: Gen<Case> = element(cases);

/**
 * Write an attribute as a case writes it.
 *
 * @param name - The attribute's name.
 * @param written - How the case writes it.
 * @param spelled - A value its type spells.
 * @returns The attribute's text, with its leading space, or none.
 */
const attributeOf = (name: string, written: Written, spelled: string): string => {
  switch (written) {
    case "unwritten": {
      return "";
    }
    case "spelled": {
      return ` ${name}="${spelled}"`;
    }
    case "unspelled": {
      return ` ${name}="nope"`;
    }
    default: {
      return written satisfies never;
    }
  }
};

/**
 * The rules a case writes: the item's response processing's and the test's outcome processing's,
 * each the rules inside its processing element, or none.
 */
interface Rules {
  readonly item: string;
  readonly test: string;
}

/**
 * The item's response processing and the test's outcome processing a case writes.
 *
 * @param input - The case.
 * @returns The two.
 */
const rulesOf = (input: Case): Rules => {
  switch (input.kind) {
    case "qti-base-value": {
      return {
        item: `<qti-set-outcome-value identifier="SCORE"><qti-base-value${attributeOf("base-type", input.written, "float")}>1.5</qti-base-value></qti-set-outcome-value>`,
        test: "",
      };
    }
    case "qti-math-operator": {
      return {
        item: `<qti-set-outcome-value identifier="SCORE"><qti-math-operator${attributeOf("name", input.written, "sin")}><qti-base-value base-type="float">1.5</qti-base-value></qti-math-operator></qti-set-outcome-value>`,
        test: "",
      };
    }
    case "qti-test-variables": {
      return {
        item: "",
        test: `<qti-set-outcome-value identifier="OUT"><qti-sum><qti-test-variables variable-identifier="SCORE"${attributeOf("base-type", input.written, "float")}/></qti-sum></qti-set-outcome-value>`,
      };
    }
    default: {
      return input.kind satisfies never;
    }
  }
};

/**
 * Build a case's package: a manifest listing a test and an item, the test placing the item by an
 * item ref `a`, each document's processing the case's.
 *
 * @param input - The case.
 * @returns The package's entries.
 */
const entriesOf = (input: Case): PackageEntries => {
  const rules = rulesOf(input);
  const text = new TextEncoder();
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="ABSENCE"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="test" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource><resource identifier="item" type="imsqti_item_xmlv3p0" href="items/a.xml"><file href="items/a.xml"/></resource></resources></manifest>`;
  const item = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="${asi}" identifier="a" title="A" adaptive="false" time-dependent="false"><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body><p>A.</p></qti-item-body>${rules.item === "" ? "" : `<qti-response-processing>${rules.item}</qti-response-processing>`}</qti-assessment-item>`;
  const test = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-test xmlns="${asi}" identifier="TEST" title="TEST"><qti-outcome-declaration identifier="OUT" cardinality="single" base-type="float"/><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="S" visible="true"><qti-assessment-item-ref identifier="a" href="items/a.xml"/></qti-assessment-section></qti-test-part>${rules.test === "" ? "" : `<qti-outcome-processing>${rules.test}</qti-outcome-processing>`}</qti-assessment-test>`;

  return new Map([
    ["imsmanifest.xml", text.encode(manifest)],
    ["items/a.xml", text.encode(item)],
    ["test.xml", text.encode(test)],
  ]);
};

/**
 * The classes of disagreement the known table records, each waiting on its owner's fix.
 */
const recorded: readonly Signature[] = known.map(({ signature }) => signature);

/**
 * Whether each side accepted a case's package.
 */
type Situation = "accepted" | "refused";

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/expressions.ts, an attribute its laws read left out",
  (it) => {
    it.effect(
      "gives every attribute-typed expression with its typing attribute written or not the oracle's verdict",
      (ctx) =>
        // Oracle: a second implementation, the law oracle, against readProgram's refusal and the
        // laws its rows break on the host, as the genetic differential judges them, over the XSD's
        // `use` of each attribute (BaseValueDType, MathOperatorDType, TestVariablesDType).
        // Bound: every case of the box, 9 packages.
        searched(
          ctx,
          Effect.gen(function* absence() {
            const directory = yield* scratchDirectory("expressions-absence-");
            const bench = { directory, grammar, laws };
            let at = 0;

            return yield* exhaust(
              {
                box: "each typed kind under each way of writing its typing attribute",
                caseHang: Duration.minutes(2),
                coverage: requiredInSpace<Situation>(["accepted", "refused"]),
                generator: caseGen,
                limit: cases.length,
                literal: (input) => JSON.stringify(input),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against readProgram's refusal and its rows' host laws",
                },
                suite: "import/overlays/expressions-absence",
              },
              (input, c) =>
                Effect.gen(function* judged() {
                  const judgment = yield* judgeOne(yield* genomeOf(entriesOf(input)), bench, at);
                  at += 1;
                  c.note(judgment.summary.oracle === "laws " ? "accepted" : "refused");

                  assert.deepStrictEqual(
                    judgment.disagreements
                      .filter((disagreement) => !recordsClassOf(recorded, disagreement))
                      .map(shownDisagreement),
                    [],
                    `${JSON.stringify(input)}: ${JSON.stringify(judgment.summary)}`,
                  );
                }),
            );
          }),
        ),
      { timeout: 600_000 },
    );
  },
);
