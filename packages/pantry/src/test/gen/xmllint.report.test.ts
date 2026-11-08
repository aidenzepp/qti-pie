/**
 * The vocabulary XSD oracle's reading of a batch report (`#pantry/test/gen/xmllint.ts`
 * `probeErrorsOf`, over `#pantry/xml/oracle.ts` `verdictsOf`), held to the errors the report was
 * written from, in each libxml2 format.
 *
 * Each case draws a batch of probes and the errors and warnings xmllint reports about them: schema
 * validity errors with or without an attribute, libxml2's own identity errors, and schema
 * warnings. The report is written twice, as libxml2 2.12 writes it (every message on an element
 * led by `element NAME: `) and as 2.13 and later do (a schema validity message with no such
 * prefix). Both must read back as each probe's errors in order, the warnings judging nothing. The
 * formats are libxml2's `xmlReportError` (2.12.0) and `xmlFormatError` (2.13.0), cited at
 * `#pantry/xml/oracle.ts`'s `schemaMessage`.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { probeErrorsOf } from "#pantry/test/gen/xmllint.ts";
import type { ValidityError } from "#pantry/test/gen/xmllint.ts";
import { verdictsOf } from "#pantry/xml/oracle.ts";

/**
 * The batch's path in every report.
 */
const batch = "work/vocab-open-oracle-x/3.0.1/batch-0.xml";

/**
 * One message xmllint writes about a probe: a schema validity error, an identity error, or a
 * schema warning. `local` is the element's local name, which libxml2's `element NAME: ` prefix
 * writes (an element node's name holds no prefix).
 */
interface Said {
  readonly attribute: Option.Option<string>;
  readonly kind: "identity" | "schema" | "warning";
  readonly local: string;
  readonly probe: number;
  readonly text: string;
}

/**
 * One case: how many probes the batch holds, and what xmllint says of them.
 */
interface ReportCase {
  readonly probes: number;
  readonly said: readonly Said[];
}

/**
 * Draw a case: up to 6 probes and up to 8 messages, each on a probe the batch holds.
 */
const reportCase: Gen<ReportCase> = (source) => {
  const probes = source.draw(int(1, 6));
  const said = source.draw(
    array(
      (inner): Said => ({
        attribute:
          inner.choose(0, 1) === 1
            ? Option.some(inner.draw(element(["id", "lang"])))
            : Option.none(),
        kind: inner.draw(element(["schema", "schema", "identity", "warning"] as const)),
        local: inner.draw(element(["qti-choice", "p", "mi"])),
        probe: inner.draw(int(0, probes - 1)),
        text: inner.draw(
          element([
            "This element is not expected.",
            "[facet 'pattern'] The value 'x' is not accepted by the pattern 'y'.",
            "The attribute 'v' is not allowed.",
          ]),
        ),
      }),
      { max: 8, min: 0 },
    ),
  );

  return { probes, said };
};

/**
 * Write one message's report line in a libxml2 format.
 *
 * @param said - The message.
 * @param format - `2.12`, which leads every message on an element with `element NAME: `, or `2.13`,
 *   which leaves that prefix off a schema validity message.
 * @returns The line.
 */
const lineOf = (said: Said, format: "2.12" | "2.13"): string => {
  const at = `${batch}:${String(said.probe + 2)}: `;
  const prefix = `element ${said.local}: `;
  const named = Option.match(said.attribute, {
    onNone: () => "",
    onSome: (name) => `, attribute '${name}'`,
  });

  if (said.kind === "identity") {
    return `${at}${prefix}validity error : ID ${said.local}-1 already defined`;
  }

  const severity = said.kind === "warning" ? "warning" : "error";

  return `${at}${format === "2.12" ? prefix : ""}Schemas validity ${severity} : Element '{urn:x}${said.local}'${named}: ${said.text}`;
};

/**
 * Write a case's whole report in a libxml2 format: each message, then the batch's status.
 *
 * @param drawnCase - The case.
 * @param format - The libxml2 format.
 * @returns The report.
 */
const reportOf = (drawnCase: ReportCase, format: "2.12" | "2.13"): string =>
  [
    ...drawnCase.said.map((said) => lineOf(said, format)),
    drawnCase.said.some(({ kind }) => kind !== "warning")
      ? `${batch} fails to validate`
      : `${batch} validates`,
  ].join("\n");

/**
 * The model: each probe's errors as the report states them, in order, the warnings dropped.
 *
 * @param drawnCase - The case.
 * @returns Each probe's errors.
 */
const modelOf = (drawnCase: ReportCase): readonly (readonly ValidityError[])[] =>
  Array.from({ length: drawnCase.probes }, (_, probe) =>
    drawnCase.said
      .filter((said) => said.probe === probe && said.kind !== "warning")
      .map((said): ValidityError =>
        said.kind === "identity"
          ? {
              attribute: Option.none(),
              element: said.local,
              message: `ID ${said.local}-1 already defined`,
            }
          : { attribute: said.attribute, element: `{urn:x}${said.local}`, message: said.text },
      ),
  );

/**
 * Read a report the way `validate` reads a batch's: its verdict, then each probe's errors.
 *
 * @param drawnCase - The case, for the probe count.
 * @param report - The report.
 * @returns Each probe's errors.
 */
const readBack = (drawnCase: ReportCase, report: string) =>
  Effect.gen(function* read() {
    const [verdict] = yield* verdictsOf([batch], report);

    return yield* probeErrorsOf(
      batch,
      drawnCase.probes,
      verdict?._tag === "Invalid" ? verdict.messages : [],
    );
  });

/**
 * What a case exercises.
 */
type Reached = "2.12 prefix" | "attribute" | "identity" | "warning" | "several on one probe";

/**
 * Name what a case reaches.
 *
 * @param drawnCase - The case.
 * @returns The situations.
 */
const reachedBy = (drawnCase: ReportCase): readonly Reached[] => [
  ...(drawnCase.said.some(({ kind }) => kind === "schema") ? (["2.12 prefix"] as const) : []),
  ...(drawnCase.said.some(({ attribute, kind }) => kind === "schema" && Option.isSome(attribute))
    ? (["attribute"] as const)
    : []),
  ...(drawnCase.said.some(({ kind }) => kind === "identity") ? (["identity"] as const) : []),
  ...(drawnCase.said.some(({ kind }) => kind === "warning") ? (["warning"] as const) : []),
  ...(new Set(drawnCase.said.map(({ probe }) => probe)).size < drawnCase.said.length
    ? (["several on one probe"] as const)
    : []),
];

describe("the vocabulary XSD oracle's batch reading", () => {
  it.effect("reads each probe's errors from libxml2 2.12's report and from 2.13's alike", (ctx) =>
    searched(
      ctx,
      explore(
        {
          caseHang: Duration.seconds(30),
          concurrency: 1,
          coverage: required<Reached>(
            ["2.12 prefix", "attribute", "identity", "warning", "several on one probe"],
            { cases: 200, sense: notesOnly },
          ),
          draw: drawn(reportCase),
          kept: [],
          literal: Formatter.format,
          oracle: {
            kind: "second-implementation",
            name: "the errors each report was written from, in libxml2 2.12's and 2.13's formats",
          },
          runs: 400,
          shrink: completeShrink,
          steerEvery: 16,
          suite: "pantry/test/gen/xmllint-batch-report",
        },
        (drawnCase, c) =>
          Effect.gen(function* agree() {
            c.noteAll(reachedBy(drawnCase));

            const expected = modelOf(drawnCase);

            for (const format of ["2.12", "2.13"] as const) {
              assert.deepStrictEqual(
                yield* readBack(drawnCase, reportOf(drawnCase, format)),
                expected,
                format,
              );
            }
          }),
      ),
    ),
  );
});
