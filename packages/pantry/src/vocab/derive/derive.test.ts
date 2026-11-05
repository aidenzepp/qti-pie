import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { ConfigProvider, Context, Effect, FileSystem, Layer, Option, Result, Stream } from "effect";
import { Digest } from "effect/crypto";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { HBLOCK, HFLOW, HINL, PHR } from "#pantry/schema/content/sets.ts";
import {
  operatorArity,
  operatorArityMax,
  operatorArityUnbounded,
} from "#pantry/schema/seed/operator-arity.ts";
import {
  arityOf,
  contentSetsOf,
  entriesOf,
  htmlNamesOf,
  indexSchema,
  leaves,
  printArity,
  renderLeaf,
} from "#pantry/vocab/derive/derive.ts";
import type { XsdSchema } from "#pantry/vocab/derive/derive.ts";
import {
  checkCache,
  readSource,
  sourcePaths,
  sources,
  verifySource,
  XsdSourceMismatch,
  XsdSourceMissing,
} from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";

/**
 * The package folder, `packages/pantry`, which the committed files and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * A `HOME` under the package's ignored `work/` that nothing creates, so its XSD cache is absent.
 */
const absentHome = `${packageRoot}/work/vocab-derive-test-no-home`;

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when all 14
 * pinned XSDs are present. Any other failure of the check fails the file's load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the hook that reads and indexes the 14 pinned XSDs.
 *
 * The two ASI XSDs are 18 MB each and take most of it. Measured on 2026-11-05 on a 10-CPU M2 Max
 * at load averages of 10 to 12, with other suites running: five builds took 2.7 to 3.0 s. The
 * budget is the larger of twice that maximum (6 s) and 20 s, the floor being twice vitest's default
 * hook timeout. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const schemasHookTimeoutMs = 20_000;

/**
 * The timeout, in milliseconds, for one test that renders a leaf and formats it with `vp fmt`.
 *
 * Measured on 2026-11-05 under the same load: nine such tests took 0.41 to 0.81 s. The budget is
 * the larger of twice that maximum (1.6 s) and 10 s, the floor being twice vitest's default test
 * timeout. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const formatTestTimeoutMs = 10_000;

/**
 * The pinned XSDs as read once for the suite: every document, and the two ASI schemas indexed.
 */
class Schemas extends Context.Service<
  Schemas,
  {
    readonly asi300: XsdSchema;
    readonly asi301: XsdSchema;
    readonly documents: ReadonlyMap<SourcePath, XmlDocument>;
  }
>()("vocab/derive.test/Schemas") {}

/**
 * Read every pinned XSD through its digest check and index the two ASI schemas.
 */
const SchemasLayer = Layer.effect(
  Schemas,
  Effect.gen(function* readSchemas() {
    const read = yield* Effect.forEach(
      sourcePaths,
      (name) => readSource(name).pipe(Effect.map((document) => [name, document] as const)),
      { concurrency: "unbounded" },
    );
    const documents = new Map(read);
    const indexed = (name: SourcePath) =>
      Effect.fromOption(Option.fromNullishOr(documents.get(name))).pipe(
        Effect.flatMap((document) => Effect.fromResult(indexSchema(document))),
      );

    return Schemas.of({
      asi300: yield* indexed("imsqti_asiv3p0_v1p0.xsd"),
      asi301: yield* indexed("imsqti_asiv3p0p1_v1p0.xsd"),
      documents,
    });
  }),
);

/**
 * Format TypeScript text with `vp fmt`, as the committed files are formatted.
 *
 * `vp` is on `PATH` whenever the suite runs through pnpm. The text is read from standard input,
 * and `filepath` only chooses the parser and the configuration, so nothing is written.
 *
 * @param text - The unformatted module.
 * @param filepath - The path, relative to `packages/pantry`, the text stands for.
 * @returns What `vp fmt` printed.
 */
const vpFmt = Effect.fn("test.vpFmt")(function* vpFmt(text: string, filepath: string) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collectFormatted() {
      const handle = yield* spawner.spawn(
        ChildProcess.make("vp", ["fmt", `--stdin-filepath=${filepath}`], {
          cwd: packageRoot,
          stdin: Stream.make(new TextEncoder().encode(text)),
        }),
      );
      const { code, stderr, stdout } = yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
        },
        { concurrency: "unbounded" },
      );

      assert.strictEqual(code, ChildProcessSpawner.ExitCode(0), `vp fmt failed: ${stderr}`);

      return stdout;
    }),
  );
});

/**
 * The lines of the fenced `text` block in a module comment, without their ` * ` prefix.
 *
 * @param source - The module's text.
 * @returns The block's lines joined by line breaks.
 */
const textBlockOf = (source: string): string => {
  const lines = source.split("\n");
  const start = lines.indexOf(" * ```text");
  const end = lines.indexOf(" * ```", start + 1);

  assert.isAbove(start, -1, "the module comment has a ```text block");

  return lines
    .slice(start + 1, end)
    .map((line) => line.replace(/^ \* /u, ""))
    .join("\n");
};

/**
 * Unwrap a derivation's result, failing the test with the reading error.
 *
 * @param result - The derivation's result.
 * @returns Its value.
 */
const valueOf = <A, E>(result: Result.Result<A, E>): A =>
  Result.getOrElse(result, (failure) => assert.fail(String(failure)));

describe("vocab/derive/sources.ts", () => {
  it.effect("refuses bytes that do not hash to the pin, naming both digests and the URL", () =>
    Effect.gen(function* mismatch() {
      const bytes = new TextEncoder().encode(
        '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>',
      );
      const failure = yield* Effect.flip(verifySource("w3/xml.xsd", bytes));

      assert.instanceOf(failure, XsdSourceMismatch);
      assert.strictEqual(failure.expected, sources["w3/xml.xsd"].sha256);
      assert.strictEqual(failure.actual, createHash("sha256").update(bytes).digest("hex"));
      assert.include(failure.message, sources["w3/xml.xsd"].url);
    }).pipe(Effect.provide(Digest.layerWebCrypto)),
  );

  it.effect("names every pinned file and its URL when the cache directory is absent", () =>
    Effect.gen(function* absent() {
      const fs = yield* FileSystem.FileSystem;

      assert.isFalse(yield* fs.exists(absentHome));

      const failure = yield* Effect.flip(checkCache());

      assert.instanceOf(failure, XsdSourceMissing);
      assert.deepStrictEqual(
        failure instanceof XsdSourceMissing ? failure.missing : [],
        sourcePaths.map((name) => ({ path: name, url: sources[name].url })),
      );
      assert.include(failure.message, `14 of the 14 pinned XSDs are not in ${absentHome}/.cache`);
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          NodeServices.layer,
          ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: absentHome })),
        ),
      ),
    ),
  );
});

if (Option.isSome(absence)) {
  it("derives the vocabulary data from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/derive.ts over the pinned XSDs", () => {
  layer(
    Layer.mergeAll(
      SchemasLayer.pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
      NodeServices.layer,
    ),
    { timeout: schemasHookTimeoutMs },
  )("from the cache", (cached) => {
    cached.effect("reads every pinned XSD through its pin, XInclude's UTF-16 included", () =>
      Effect.gen(function* everySource() {
        const { documents } = yield* Schemas;

        assert.deepStrictEqual([...documents.keys()], sourcePaths);
        for (const document of documents.values()) {
          assert.strictEqual(document.root.local, "schema");
          assert.strictEqual(document.root.namespace, "http://www.w3.org/2001/XMLSchema");
        }

        assert.strictEqual(documents.get("w3/XInclude.xsd")?.charset, "UTF-16");
      }),
    );

    for (const leaf of leaves) {
      cached.effect(
        `regenerates inventory/${leaf}.ts byte for byte after vp fmt`,
        () =>
          Effect.gen(function* regenerate() {
            const fs = yield* FileSystem.FileSystem;
            const { asi301 } = yield* Schemas;
            const file = `src/schema/content/inventory/${leaf}.ts`;
            const derived = yield* vpFmt(renderLeaf(leaf, valueOf(entriesOf(asi301, leaf))), file);

            assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${file}`));
          }),
        formatTestTimeoutMs,
      );
    }

    cached.effect("derives the four HTML content sets of content/sets.ts", () =>
      Effect.gen(function* contentSets() {
        const { asi301 } = yield* Schemas;

        assert.deepStrictEqual(valueOf(contentSetsOf(asi301)), { HBLOCK, HFLOW, HINL, PHR });
      }),
    );

    cached.effect("finds the block hosts' 25 HTML names to be HBLOCK without details", () =>
      Effect.gen(function* blockHosts() {
        const { asi301 } = yield* Schemas;

        for (const type of ["ItemBodyDType", "StimulusBodyDType", "HotTextInteractionDType"]) {
          assert.deepStrictEqual(
            valueOf(htmlNamesOf(asi301, type)).toSorted(),
            HBLOCK.filter((name) => name !== "details"),
            type,
          );
        }
      }),
    );

    cached.effect("derives the 64, 50 and 14 rows of seed/operator-arity.ts", () =>
      Effect.gen(function* arity() {
        const { asi300 } = yield* Schemas;
        const rows = valueOf(arityOf(asi300));
        const bounded = rows.flatMap((row) =>
          Option.match(row.max, {
            onNone: () => [],
            onSome: (max) => [{ kind: row.kind, max: BigInt(max) }],
          }),
        );
        const unbounded = rows.flatMap((row) =>
          Option.isNone(row.max) ? [{ kind: row.kind }] : [],
        );

        assert.deepStrictEqual([rows.length, bounded.length, unbounded.length], [64, 50, 14]);
        assert.deepStrictEqual(
          rows.map((row) => ({ kind: row.kind, min: BigInt(row.min) })),
          operatorArity,
        );
        assert.deepStrictEqual(bounded, operatorArityMax);
        assert.deepStrictEqual(unbounded, operatorArityUnbounded);
      }),
    );

    cached.effect("prints the arity block seed/operator-arity.ts keeps in its comment", () =>
      Effect.gen(function* arityBlock() {
        const fs = yield* FileSystem.FileSystem;
        const { asi300 } = yield* Schemas;
        const source = yield* fs.readFileString(`${packageRoot}/src/schema/seed/operator-arity.ts`);

        assert.strictEqual(printArity(valueOf(arityOf(asi300))), textBlockOf(source));
      }),
    );
  });
});
