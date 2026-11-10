/**
 * The spec fetcher, against a small pin table of its own and a fake server that counts the
 * requests each URL receives: what it leaves in a scratch `HOME`'s cache, and what it requests.
 * Digests in the checks come from `node:crypto`, not from the module's `Digest`. Every run checks
 * the `xmllint` on `PATH` first, so these cases need one, as the spec tests do.
 */
import { createHash } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Layer, Result } from "effect";
import { Digest } from "effect/crypto";
import { HttpClient, HttpClientError, HttpClientResponse } from "effect/http";
import { fetchSpecs, SpecFetchIncomplete } from "#pantry/test/spec-cache/fetch.ts";
import type { Rendering, SpecPins } from "#pantry/test/spec-cache/pins.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The SHA-256 of bytes as 64 lower-case hexadecimal digits, by `node:crypto`.
 *
 * @param held - The bytes.
 * @returns Their digest.
 */
const sha256Of = (held: Uint8Array): string => createHash("sha256").update(held).digest("hex");

/**
 * The bytes each test source is published with, by path: one at the cache's top, two in folders.
 */
const published = new Map([
  ["rng/a.rng", new TextEncoder().encode("<grammar/>")],
  ["spec.html", new TextEncoder().encode("<html><body>spec</body></html>")],
  ["w3/b/part.html", new TextEncoder().encode("<html>part</html>")],
]);

/**
 * The URL a test source is published at.
 *
 * @param path - The source's path under the cache.
 * @returns Its URL.
 */
const urlOf = (path: string): string => `https://example.org/${path}`;

/**
 * The text rendering of `spec.html` by the recorded command, written out by hand: each of its four
 * tags becomes one space, and each run of spaces then becomes one.
 */
const renderedSpec = new TextEncoder().encode(" spec ");

/**
 * The rendering of `spec.html`, pinned to {@link renderedSpec}.
 */
const specText: Rendering = {
  from: "spec.html",
  path: "spec.txt",
  sha256: sha256Of(renderedSpec),
};

/**
 * The test table: each of {@link published} pinned to its bytes, and {@link specText}.
 */
const table: SpecPins = {
  renderings: [specText],
  sources: [...published].map(([path, held]) => ({
    path,
    sha256: sha256Of(held),
    url: urlOf(path),
  })),
};

/**
 * Bytes that differ from the given ones.
 *
 * @param held - The bytes.
 * @returns Them with one more byte.
 */
const otherBytes = (held: Uint8Array): Uint8Array => Uint8Array.of(...held, 0x21);

/**
 * A fake server that answers each source's URL with its published bytes, except the paths in
 * `changed`, answered with other bytes, and counts the requests each URL receives.
 *
 * @param changed - The paths whose URL serves bytes that differ from their pin.
 * @returns The client and the request counts by URL.
 */
const fakeServer = (changed: readonly string[] = []) => {
  const requests = new Map<string, number>();
  const client = HttpClient.make((request, url) => {
    const { href } = url;
    const path = [...published.keys()].find((held) => urlOf(held) === href);

    requests.set(href, (requests.get(href) ?? 0) + 1);
    if (path === undefined) {
      return Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({ description: "unknown URL", request }),
        }),
      );
    }

    const held = published.get(path) ?? new Uint8Array();
    const body = changed.includes(path) ? otherBytes(held) : held;

    return Effect.succeed(
      HttpClientResponse.fromWeb(request, new Response(Uint8Array.from(body), { status: 200 })),
    );
  });
  const total = () => [...requests.values()].reduce((sum, count) => sum + count, 0);

  return { client, requests, total };
};

/**
 * Run `fetchSpecs` over a pin table and no XSDs in a scratch `HOME`, against a client.
 *
 * @param home - The scratch `HOME`.
 * @param client - The fake server's client.
 * @param options - What differs from the default run.
 * @param options.pins - The pin table; the test table when absent.
 * @param options.xmllint - The `XMLLINT` setting; `xmllint` on `PATH` when absent.
 * @returns The run's result.
 */
const runIn = (
  home: string,
  client: HttpClient.HttpClient,
  options: { readonly pins?: SpecPins; readonly xmllint?: string } = {},
) =>
  Effect.result(
    fetchSpecs(options.pins ?? table, {}).pipe(
      Effect.provideService(HttpClient.HttpClient, client),
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromUnknown(
            options.xmllint === undefined
              ? { HOME: home }
              : { HOME: home, XMLLINT: options.xmllint },
          ),
        ),
      ),
    ),
  );

/**
 * The digest of the cached file at a path, or `"absent"` when the cache holds none.
 *
 * @param home - The scratch `HOME`.
 * @param path - The path under the cache.
 * @returns The digest, or `"absent"`.
 */
const cachedDigest = Effect.fn("test.specCache.cachedDigest")(function* cachedDigest(
  home: string,
  path: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const file = `${home}/.cache/gr8des/${path}`;

  return (yield* fs.exists(file)) ? sha256Of(yield* fs.readFile(file)) : "absent";
});

/**
 * Write a file into the scratch `HOME`'s cache.
 *
 * @param home - The scratch `HOME`.
 * @param path - The path under the cache.
 * @param held - The bytes to write.
 */
const seed = Effect.fn("test.specCache.seed")(function* seed(
  home: string,
  path: string,
  held: Uint8Array,
) {
  const fs = yield* FileSystem.FileSystem;
  const file = `${home}/.cache/gr8des/${path}`;

  yield* fs.makeDirectory(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  yield* fs.writeFile(file, held);
});

/**
 * The entries a run left in the cache whose name marks the scratch directory.
 *
 * @param home - The scratch `HOME`.
 * @returns Those entries; none once the run has removed its scratch directory.
 */
const scratchLeft = Effect.fn("test.specCache.scratchLeft")(function* scratchLeft(home: string) {
  const fs = yield* FileSystem.FileSystem;
  const left = yield* fs.readDirectory(`${home}/.cache/gr8des`, { recursive: true });

  return left.filter((entry) => entry.includes(".fetch-specs-"));
});

/**
 * The layer every case runs under: Node's file system, paths and processes, and WebCrypto's
 * digests.
 */
const fetchLayer = Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto);

describe("fetchSpecs", () => {
  it.effect("fills an empty cache with every source, each hashing to its pin", () =>
    Effect.gen(function* fillsEmptyCache() {
      const home = yield* scratchDirectory("spec-fetch-home-");
      const { client, requests } = fakeServer();
      const run = yield* runIn(home, client);

      assert.isTrue(Result.isSuccess(run));
      assert.deepStrictEqual(
        Result.isSuccess(run) ? run.success.settled.map(({ outcome }) => outcome) : [],
        ["fetched", "fetched", "fetched"],
      );
      for (const { path, sha256, url } of table.sources) {
        assert.strictEqual(yield* cachedDigest(home, path), sha256, path);
        assert.strictEqual(requests.get(url), 1, url);
      }

      assert.deepStrictEqual(yield* scratchLeft(home), []);
    }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect("makes no request on a second run, every source already present", () =>
    Effect.gen(function* secondRunRequestsNothing() {
      const home = yield* scratchDirectory("spec-fetch-home-");

      yield* runIn(home, fakeServer().client);

      const again = fakeServer();
      const run = yield* runIn(home, again.client);

      assert.strictEqual(again.total(), 0);
      assert.deepStrictEqual(
        Result.isSuccess(run) ? run.success.settled.map(({ outcome }) => outcome) : [],
        ["present", "present", "present"],
      );
    }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect(
    "refuses a served file whose digest differs, writes nothing for it, and settles the rest",
    () =>
      Effect.gen(function* refusesChangedFile() {
        const home = yield* scratchDirectory("spec-fetch-home-");
        const changed = "rng/a.rng";
        const run = yield* runIn(home, fakeServer([changed]).client);
        const failure = Result.isFailure(run) ? run.failure : undefined;

        assert.instanceOf(failure, SpecFetchIncomplete);
        assert.deepStrictEqual(
          failure instanceof SpecFetchIncomplete
            ? {
                failures: failure.failures.map((held) => ({
                  actual: held._tag === "SpecPublishedChanged" ? held.actual : "",
                  path: held.path,
                  tag: held._tag,
                })),
                pinned: failure.pinned,
              }
            : undefined,
          {
            failures: [
              {
                actual: sha256Of(otherBytes(published.get(changed) ?? new Uint8Array())),
                path: changed,
                tag: "SpecPublishedChanged",
              },
            ],
            pinned: 3,
          },
        );
        for (const { path, sha256 } of table.sources) {
          assert.strictEqual(
            yield* cachedDigest(home, path),
            path === changed ? "absent" : sha256,
            path,
          );
        }

        assert.deepStrictEqual(yield* scratchLeft(home), []);
      }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect("replaces a cached file whose bytes differ from its pin", () =>
    Effect.gen(function* replacesStaleFile() {
      const home = yield* scratchDirectory("spec-fetch-home-");
      const stale = "w3/b/part.html";

      yield* seed(home, stale, otherBytes(published.get(stale) ?? new Uint8Array()));

      const { client, requests } = fakeServer();
      const run = yield* runIn(home, client);

      assert.deepStrictEqual(
        Result.isSuccess(run) ? run.success.settled : [],
        table.sources.map(({ path }) => ({
          outcome: path === stale ? "replaced" : "fetched",
          path,
        })),
      );
      assert.strictEqual(requests.get(urlOf(stale)), 1);
      assert.strictEqual(
        yield* cachedDigest(home, stale),
        sha256Of(published.get(stale) ?? new Uint8Array()),
      );
    }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect("fails before any request when xmllint does not run", () =>
    Effect.gen(function* refusesWithoutXmllint() {
      const home = yield* scratchDirectory("spec-fetch-home-");
      const server = fakeServer();
      const run = yield* runIn(home, server.client, { xmllint: `${home}/no-such-xmllint` });

      assert.strictEqual(
        Result.isFailure(run) ? run.failure._tag : "succeeded",
        "SpecXmllintUnavailable",
      );
      assert.strictEqual(server.total(), 0);
      for (const { path } of [...table.sources, ...table.renderings]) {
        assert.strictEqual(yield* cachedDigest(home, path), "absent", path);
      }
    }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect(
    "derives a rendering that hashes to its pin, and a second run derives and downloads nothing",
    () =>
      Effect.gen(function* derivesRendering() {
        const home = yield* scratchDirectory("spec-fetch-home-");
        const first = yield* runIn(home, fakeServer().client);

        assert.deepStrictEqual(Result.isSuccess(first) ? first.success.renderings : [], [
          { outcome: "derived", path: specText.path },
        ]);
        assert.strictEqual(yield* cachedDigest(home, specText.path), specText.sha256);

        const again = fakeServer();
        const second = yield* runIn(home, again.client);

        assert.strictEqual(again.total(), 0);
        assert.deepStrictEqual(Result.isSuccess(second) ? second.success.renderings : [], [
          { outcome: "present", path: specText.path },
        ]);
        assert.deepStrictEqual(yield* scratchLeft(home), []);
      }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect(
    "refuses a rendering that does not hash to its pin, and writes nothing at its path",
    () =>
      Effect.gen(function* refusesUnpinnedRendering() {
        const home = yield* scratchDirectory("spec-fetch-home-");
        const pins: SpecPins = {
          ...table,
          renderings: [{ ...specText, sha256: sha256Of(otherBytes(renderedSpec)) }],
        };
        const run = yield* runIn(home, fakeServer().client, { pins });
        const failure = Result.isFailure(run) ? run.failure : undefined;

        assert.deepStrictEqual(
          failure?._tag === "SpecRenderIncomplete"
            ? failure.failures.map((held) => ({
                actual: held._tag === "SpecRenderingChanged" ? held.actual : "",
                path: held.path,
                tag: held._tag,
              }))
            : failure?._tag,
          [{ actual: specText.sha256, path: specText.path, tag: "SpecRenderingChanged" }],
        );
        assert.strictEqual(yield* cachedDigest(home, specText.path), "absent");
        assert.deepStrictEqual(yield* scratchLeft(home), []);
      }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );

  it.effect("replaces a cached rendering whose bytes differ from its pin", () =>
    Effect.gen(function* replacesOldRendering() {
      const home = yield* scratchDirectory("spec-fetch-home-");

      yield* seed(home, specText.path, otherBytes(renderedSpec));

      const run = yield* runIn(home, fakeServer().client);

      assert.deepStrictEqual(Result.isSuccess(run) ? run.success.renderings : [], [
        { outcome: "replaced", path: specText.path },
      ]);
      assert.strictEqual(yield* cachedDigest(home, specText.path), specText.sha256);
    }).pipe(Effect.scoped, Effect.provide(fetchLayer)),
  );
});
