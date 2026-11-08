import path from "node:path";
import { gzipSync } from "node:zlib";
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { rolldown } from "vite/rolldown";

/**
 * The most gzip bytes crust's read path may weigh in a browser bundle.
 *
 * Set at 31000 on 2026-11-07, reviewed by the coordinator: 28727 bytes were measured with
 * vite-plus-core 1.5.0's rolldown, which leaves about 8 percent headroom, the policy the first
 * budget (28000, over 25752 measured with rolldown 1.2.11) set. Two changes grew it: the decoder
 * carries XML 1.0 Appendix F.1's table as data (`decode.ts`, about 1700 bytes), and namespace
 * resolution moved from `saxes` into crust, after the attribute-list defaults (`namespaces.ts` and
 * Effect's `Result`, about 1200). `saxes` still ships its own namespace mode, which crust no longer
 * runs: its namespace-only methods weigh about 680 bytes that nothing reaches. Raising the budget
 * is a reviewed change, not a re-pin to whatever is measured.
 */
const GZIP_BUDGET = 31_000;

/**
 * Effect modules that carry Schema, which crust's browser path must not import.
 */
const SCHEMA_MODULE = /\/effect\/dist\/(?:Schema[^/]*|internal\/schema\/[^/]*)\.js$/u;

it.effect("keeps crust's read path small, Schema-free and Buffer-free in a browser bundle", () =>
  Effect.acquireUseRelease(
    Effect.tryPromise(() =>
      rolldown({
        input: path.join(import.meta.dirname, "read.ts"),
        logLevel: "silent",
        platform: "browser",
      }),
    ),
    (bundle) =>
      Effect.gen(function* checkBundle() {
        const output = yield* Effect.tryPromise(() =>
          bundle.generate({ format: "esm", minify: true }),
        );
        const chunks = output.output.filter((item) => item.type === "chunk");
        assert.strictEqual(chunks.length, 1, "the read path bundles to one chunk");

        const [chunk] = chunks;
        if (chunk === undefined) {
          return;
        }

        const modules = Object.keys(chunk.modules);

        assert.isTrue(
          modules.some((id) => id.endsWith("/src/read.ts")) &&
            modules.some((id) => id.includes("/effect/dist/")),
          `the bundle holds crust's read.ts and Effect modules, got ${modules.length} modules`,
        );

        const schemaModules = modules.filter((id) => SCHEMA_MODULE.test(id));
        assert.deepStrictEqual(schemaModules, [], "no Schema module is bundled");

        assert.isFalse(/\bBuffer\b/u.test(chunk.code), "the bundle names no Buffer");

        const gzipBytes = gzipSync(chunk.code).length;
        yield* Effect.log(`crust read path browser bundle: ${gzipBytes} gzip bytes`);

        assert.isTrue(
          gzipBytes <= GZIP_BUDGET,
          `the bundle is ${gzipBytes} gzip bytes, over the budget of ${GZIP_BUDGET}`,
        );
      }),
    (bundle) => Effect.promise(() => bundle.close()),
  ),
);
