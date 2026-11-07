import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option, Result } from "effect";
import { verdictsOf } from "#pantry/xml/oracle.ts";
import type { XsdMessage, XsdVerdict } from "#pantry/xml/oracle.ts";

/**
 * The search budget of the report property.
 */
const budget = {
  caseHang: Duration.minutes(1),
  concurrency: 1,
  coverage: noCoverage,
  kept: [],
  literal: Formatter.format,
  shrink: completeShrink,
  steerEvery: 16,
} as const;

/**
 * One message as `xmllint` writes it: the lines of the report it takes, and the message the parser
 * reads them back as.
 */
interface Written {
  readonly lines: readonly string[];
  readonly message: XsdMessage;
}

/**
 * One judged file as `xmllint` reports it: its messages, and its status, none for a file that is
 * not well-formed, which `xmllint` never validates.
 */
interface Judged {
  readonly messages: readonly Written[];
  readonly status: Option.Option<boolean>;
}

/**
 * A word of a message, from letters no path, status or message shape holds.
 */
const word: Gen<string> = (source) =>
  source.draw(element(["value", "expected", "attribute", "content", "pattern", "facet"]));

/**
 * Draw a schema message of one severity on a file: an element, an optional attribute and a text,
 * written with libxml2 2.12's `element NAME: ` prefix or without it, as 2.13 and later write a
 * schema validity message.
 *
 * @param path - The file.
 * @param severity - Whether it is an error or a warning.
 * @returns The message's generator.
 */
const schemaMessageOf =
  (path: string, severity: "error" | "warning"): Gen<Written> =>
  (source) => {
    const line = source.draw(int(1, 40));
    const local = source.draw(element(["item", "choice", "p"]));
    const prefix = source.choose(0, 1) === 1 ? `element ${local}: ` : "";
    const attribute = source.choose(0, 1) === 1 ? Option.some(source.draw(word)) : Option.none();
    const text = `${source.draw(word)} ${source.draw(word)}.`;
    const named = Option.match(attribute, {
      onNone: () => "",
      onSome: (held) => `, attribute '${held}'`,
    });

    return {
      lines: [
        `${path}:${String(line)}: ${prefix}Schemas validity ${severity} : Element '{urn:x}${local}'${named}: ${text}`,
      ],
      message: { attribute, element: Option.some(`{urn:x}${local}`), line, source: "schema", text },
    };
  };

/**
 * Draw a parser message on a file, with the context lines `xmllint` prints after it, which the
 * parser appends to its text.
 *
 * @param path - The file.
 * @returns The message's generator.
 */
const parserMessageOf =
  (path: string): Gen<Written> =>
  (source) => {
    const line = source.draw(int(1, 40));
    const body = `parser error : ${source.draw(word)} ${source.draw(word)}`;
    const context = source.choose(0, 1) === 1 ? ["<a><b>", "     ^"] : [];

    return {
      lines: [`${path}:${String(line)}: ${body}`, ...context],
      message: {
        attribute: Option.none(),
        element: Option.none(),
        line,
        source: "parser",
        text: [body, ...context].join("\n"),
      },
    };
  };

/**
 * Draw one file's report: valid with warnings, invalid with errors, or not well-formed with parser
 * messages and no status.
 *
 * @param path - The file.
 * @returns The file's generator.
 */
const judgedOf =
  (path: string): Gen<Judged> =>
  (source) => {
    switch (source.choose(0, 2)) {
      case 0: {
        return {
          messages: source.draw(array(schemaMessageOf(path, "warning"), { max: 2, min: 0 })),
          status: Option.some(true),
        };
      }
      case 1: {
        return {
          messages: source.draw(array(schemaMessageOf(path, "error"), { max: 3, min: 1 })),
          status: Option.some(false),
        };
      }
      default: {
        return {
          messages: source.draw(array(parserMessageOf(path), { max: 2, min: 1 })),
          status: Option.none(),
        };
      }
    }
  };

/**
 * One drawn report: the judged files, by path, in order.
 */
interface Drawn {
  readonly files: readonly (Judged & { readonly path: string })[];
}

/**
 * Draw a report over one to four files.
 */
const drawnReport: Gen<Drawn> = (source) => {
  const count = source.draw(int(1, 4));

  return {
    files: Array.from({ length: count }, (_, at) => {
      const path = `work/xsd-report/case-${String(at)}.xml`;

      return { ...source.draw(judgedOf(path)), path };
    }),
  };
};

/**
 * Write a drawn report as `xmllint` does: each file's messages, then its status line.
 *
 * @param report - The report.
 * @returns Its text.
 */
const reportText = (report: Drawn): string =>
  report.files
    .flatMap(({ messages, path, status }) => [
      ...messages.flatMap(({ lines }) => lines),
      ...Option.toArray(status).map(
        (valid) => `${path} ${valid ? "validates" : "fails to validate"}`,
      ),
    ])
    .join("\n");

/**
 * The verdicts a drawn report encodes.
 *
 * @param report - The report.
 * @returns Each file's verdict, in order.
 */
const verdictsIn = (report: Drawn): readonly XsdVerdict[] =>
  report.files.map(({ messages, status }): XsdVerdict => {
    const held = messages.map(({ message }) => message);

    return Option.contains(status, true)
      ? { _tag: "Valid", warnings: held }
      : { _tag: "Invalid", messages: held };
  });

describe("xmllint's report, read back", () => {
  it.effect("a report written from verdicts reads back as exactly those verdicts", (ctx) =>
    searched(
      ctx,
      explore(
        {
          ...budget,
          draw: drawn(drawnReport),
          oracle: {
            kind: "universal",
            name: "verdictsOf ∘ reportText = the drawn verdicts, each written as xmllint writes it",
          },
          runs: 400,
          suite: "xml/oracle/report",
        },
        (report) =>
          verdictsOf(
            report.files.map(({ path }) => path),
            reportText(report),
          ).pipe(
            Effect.tap((verdicts) =>
              Effect.sync(() => {
                assert.deepStrictEqual(verdicts, verdictsIn(report));
              }),
            ),
          ),
      ),
    ),
  );

  it.effect(
    "a schema message libxml2 2.13 writes, with no element prefix, reads with its element and attribute",
    () =>
      Effect.gen(function* unprefixed() {
        const path = "work/xsd-report/case-0.xml";
        const verdicts = yield* verdictsOf(
          [path],
          [
            `${path}:3: Schemas validity error : Element '{urn:x}p', attribute 'v': [facet 'pattern'] The value 'x' is not accepted by the pattern 'y'.`,
            `${path}:4: element q: Schemas validity error : Element '{urn:x}q': This element is not expected.`,
            `${path} fails to validate`,
          ].join("\n"),
        );

        assert.deepStrictEqual(verdicts, [
          {
            _tag: "Invalid",
            messages: [
              {
                attribute: Option.some("v"),
                element: Option.some("{urn:x}p"),
                line: 3,
                source: "schema",
                text: "[facet 'pattern'] The value 'x' is not accepted by the pattern 'y'.",
              },
              {
                attribute: Option.none(),
                element: Option.some("{urn:x}q"),
                line: 4,
                source: "schema",
                text: "This element is not expected.",
              },
            ],
          },
        ]);
      }),
  );

  it.effect(
    "a stray line after a file's status, and a file with no status and no message, are unreadable",
    () =>
      Effect.gen(function* unreadable() {
        const path = "work/xsd-report/case-0.xml";
        const message = `${path}:3: element p: Schemas validity error : Element '{urn:x}p': value expected.`;
        const stray = yield* Effect.result(
          verdictsOf([path], [message, `${path} fails to validate`, "stray words"].join("\n")),
        );
        const silent = yield* Effect.result(
          verdictsOf(
            [path, "work/xsd-report/case-1.xml"],
            [message, `${path} fails to validate`].join("\n"),
          ),
        );

        assert.isTrue(Result.isFailure(stray), "a stray line after a status");
        assert.strictEqual(Result.isFailure(stray) ? stray.failure._tag : "", "OracleUnreadable");
        assert.isTrue(Result.isFailure(silent), "a file with neither a status nor a message");
        assert.strictEqual(
          Result.isFailure(silent) ? silent.failure.line : "",
          "work/xsd-report/case-1.xml",
        );
      }),
  );
});
