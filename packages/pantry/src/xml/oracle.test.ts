import { globSync, readFileSync } from "node:fs";
import { NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, describe, it, layer } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { ConfigProvider, Duration, Effect, Formatter, Layer, Option, Result } from "effect";
import { materialize } from "#pantry/test/fixtures.ts";
import {
  OracleError,
  OracleLayer,
  OracleUnavailable,
  verdictsOf,
  xmllintC14n,
} from "#pantry/xml/oracle.ts";
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
      message: {
        attribute,
        element: Option.some(`{urn:x}${local}`),
        level: severity,
        line,
        source: "schema",
        text,
      },
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
        level: "error",
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
                level: "error",
                line: 3,
                source: "schema",
                text: "[facet 'pattern'] The value 'x' is not accepted by the pattern 'y'.",
              },
              {
                attribute: Option.none(),
                element: Option.some("{urn:x}q"),
                level: "error",
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

/**
 * What the process tests run on: the process spawner `xmllintC14n` needs and the file system and
 * path services that spawner and the fixture materializer need.
 */
const ProcessLayer = OracleLayer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory `materialize("simple")` returned, set once by `beforeAll`.
 */
let simple = "";

beforeAll(() =>
  Effect.gen(function* materializeSimple() {
    simple = yield* materialize("simple");
  }).pipe(Effect.provide(ProcessLayer)),
);

layer(ProcessLayer)("xmllint as a process", (process) => {
  process.effect(
    "a file that does not exist fails as OracleError with xmllint's exit code and message",
    () =>
      Effect.gen(function* missingFile() {
        const failure = yield* Effect.flip(xmllintC14n(`${simple}/missing.xml`));

        assert.instanceOf(failure, OracleError);
        assert.notStrictEqual(failure.exitCode, 0);
        assert.include(failure.stderr, "missing.xml");
      }),
  );

  process.effect("an executable that does not start fails as OracleUnavailable, naming it", () =>
    Effect.gen(function* missingExecutable() {
      const missing = `${simple}/no-such-xmllint`;
      const failure = yield* Effect.flip(xmllintC14n(`${simple}/choice.xml`)).pipe(
        Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ XMLLINT: missing }))),
      );

      assert.instanceOf(failure, OracleUnavailable);
      assert.strictEqual(failure.executable, missing);
      assert.include(failure.message, "set XMLLINT");
    }),
  );
});

/**
 * A quoted absolute path whose last segment is `xmllint`: an install path.
 */
const installPath = /["'`]\/(?:[^\s"'`/]+\/)*xmllint["'`]/u;

/**
 * The code lines of a source that name an install path of `xmllint`. A comment line is no code, so
 * a note of which build was measured, as the oracle's of macOS's, names none.
 *
 * @param text - The source.
 * @returns Its offending lines, trimmed.
 */
const installPathLines = (text: string): readonly string[] =>
  text
    .split("\n")
    .filter((line) => !/^\s*(?:\*|\/\/|\/\*)/u.test(line) && installPath.test(line))
    .map((line) => line.trim());

/**
 * The path of `xmllint` in a directory, built so the guard's own plants name no path in its source.
 *
 * @param bin - The directory.
 * @returns The path.
 */
const installed = (bin: string): string => `${bin}/xmllint`;

describe("the one way to xmllint", () => {
  it("is XMLLINT or PATH: no source of pantry or crust names an install path", () => {
    // Search: every TypeScript source of pantry and crust, exhausted, for the oracle's rule that no
    // machine's install path is the default (`#pantry/xml/oracle.ts` `xmllintPath`). A suite gated
    // on a path skips silently wherever xmllint is installed elsewhere.
    const packages = [
      ["pantry", `${import.meta.dirname}/../..`],
      ["crust", `${import.meta.dirname}/../../../crust`],
    ] as const;
    const sources = packages.flatMap(([name, root]) =>
      globSync("src/**/*.ts", { cwd: root }).map((file) => ({
        name: `${name}/${file}`,
        text: readFileSync(`${root}/${file}`, "utf-8"),
      })),
    );

    assert.includeMembers(
      sources.map(({ name }) => name),
      ["pantry/src/xml/oracle.ts", "crust/src/read.ts"],
    );
    assert.deepStrictEqual(
      sources.flatMap(({ name, text }) => installPathLines(text).map((line) => `${name}: ${line}`)),
      [],
    );

    // Planted: the gate the translation suite of `#pantry/grammar/domains.test.ts` had, built here
    // so this file names no path of its own, is found; the oracle's comment is not.
    const gate = `      (yield* fs.exists("${installed("/usr/bin")}")) || (yield* fs.exists("${installed("/opt/homebrew/bin")}"))`;
    const note = ` * 1,023 corpus and fixture files, libxml2 2.9.13 (macOS's \`${installed("/usr/bin")}\`)`;

    assert.deepStrictEqual(installPathLines(gate), [gate.trim()]);
    assert.deepStrictEqual(installPathLines(note), []);
  });
});
