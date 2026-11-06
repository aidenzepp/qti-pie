/**
 * The XSD fetcher, checked against the rules a pin table keeps and against the cache it leaves.
 *
 * - `sources.ts` itself: every one of its 23 entries keeps the rules, checked from the rules'
 *   statements rather than through `pinFaults`, and the command its errors name is a script of this
 *   package.
 * - `pinFaults`: tables made from the real one with named faults planted, each planted fault the one
 *   fault reported; one plant of each kind at every target and both ends is exhausted, and tables
 *   of up to four plants are drawn under a swarm of the kinds.
 * - `fetchPinned`: generated pin tables, each pin with a cache state and an answer from a fake
 *   server, against a model of what the run must leave: the files, the requests, and the outcome or
 *   failure of each pin. Digests in the model come from `node:crypto`, not from the module's
 *   `Digest`.
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import type { Coverage } from "@grizzle/testing/features";
import { bytes, element, int, subset } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import {
  ConfigProvider,
  Duration,
  Effect,
  FileSystem,
  Formatter,
  Layer,
  Option,
  Result,
  Schema,
} from "effect";
import { Digest } from "effect/crypto";
import { HttpClient, HttpClientError, HttpClientResponse } from "effect/http";
import {
  fetchPinned,
  pinFaults,
  pinRules,
  XsdFetchIncomplete,
} from "#pantry/vocab/derive/fetch-xsds.ts";
import type { PinRule, Settled, XsdPins } from "#pantry/vocab/derive/fetch-xsds.ts";
import {
  fetchCommand,
  sourcePaths,
  sources,
  XsdSourceMismatch,
  XsdSourceMissing,
} from "#pantry/vocab/derive/sources.ts";
import type { XsdSource } from "#pantry/vocab/derive/sources.ts";

/**
 * The package directory, `packages/pantry`.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * How long one case may run.
 */
const caseHang = Duration.seconds(30);

/**
 * The real table's entries, in its order.
 */
const realEntries: readonly (readonly [string, XsdSource])[] = Object.entries(sources);

/**
 * The hexadecimal digits a digest is written in, from the rule's statement.
 */
const hexDigits = "0123456789abcdef";

/**
 * The characters a path segment may hold, from the rule's statement: ASCII letters, digits, `.`,
 * `_` and `-`.
 */
const segmentCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789._-";

/**
 * Split a text into its UTF-16 code units, each a string: a character outside ASCII is never one
 * of the characters a rule admits, so reading it as one or two units gives the same verdict.
 *
 * @param text - The text.
 * @returns Its code units, in order.
 */
const unitsOf = (text: string): readonly string[] =>
  Array.from({ length: text.length }, (_, at) => text.charAt(at));

/**
 * Whether a digest is 64 lower-case hexadecimal digits, read character by character.
 *
 * @param sha256 - A pin's digest.
 * @returns Whether it keeps the `digest` rule.
 */
const isDigest = (sha256: string): boolean =>
  sha256.length === 64 && unitsOf(sha256).every((character) => hexDigits.includes(character));

describe("vocab/derive/sources.ts, the pin table", () => {
  it.effect(
    "pins 23 XSDs, each at a unique portable path with an https URL in serialized form and a 64-hex digest",
    () =>
      // Oracle: the rules' statements, written without `pinFaults`. Bound: all 23 entries, and
      // every pair of them.
      Effect.sync(() => {
        assert.strictEqual(realEntries.length, 23);
        assert.deepStrictEqual(
          realEntries.map(([held]) => held),
          [...sourcePaths],
        );

        const wrong: string[] = [];
        for (const [file, { sha256, url }] of realEntries) {
          const parsed = URL.parse(url);
          if (!isDigest(sha256)) {
            wrong.push(`${file}: digest ${sha256}`);
          }

          if (parsed === null || parsed.protocol !== "https:" || parsed.href !== url) {
            wrong.push(`${file}: url ${url}`);
          }

          const segments = file.split("/");
          if (
            !file.endsWith(".xsd") ||
            segments.some(
              (segment) =>
                segment === "" ||
                segment === "." ||
                segment === ".." ||
                unitsOf(segment).some((character) => !segmentCharacters.includes(character)),
            )
          ) {
            wrong.push(`${file}: path`);
          }
        }

        for (const [at, [left, { url: leftUrl }]] of realEntries.entries()) {
          for (const [right, { url: rightUrl }] of realEntries.slice(at + 1)) {
            const [a, b] = [left.toLowerCase(), right.toLowerCase()];
            if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)) {
              wrong.push(`${left} and ${right}: one file`);
            }

            if (leftUrl === rightUrl) {
              wrong.push(`${left} and ${right}: one url`);
            }
          }
        }

        assert.deepStrictEqual(wrong, []);
        assert.deepStrictEqual(pinFaults(sources), []);
      }),
  );

  it.effect("names in its cache errors a command that is this package's fetch-xsds script", () =>
    // Oracle: the package's own package.json. Bound: the two errors a cache read raises.
    Effect.gen(function* commandNamed() {
      const fs = yield* FileSystem.FileSystem;
      const manifest = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(
          Schema.Struct({
            name: Schema.String,
            scripts: Schema.Record(Schema.String, Schema.String),
          }),
        ),
      )(yield* fs.readFileString(`${packageRoot}/package.json`));
      const file = "w3/xml.xsd";
      const missing = new XsdSourceMissing({
        directory: "/cache",
        missing: [{ path: file, url: sources[file].url }],
      });
      const mismatch = new XsdSourceMismatch({
        actual: "0".repeat(64),
        expected: sources[file].sha256,
        path: file,
        url: sources[file].url,
      });

      assert.strictEqual(fetchCommand, `pnpm --filter ${manifest.name} run fetch-xsds`);
      assert.strictEqual(manifest.scripts["fetch-xsds"], "node src/vocab/derive/fetch-xsds.ts");
      assert.isTrue(yield* fs.exists(`${packageRoot}/src/vocab/derive/fetch-xsds.ts`));
      assert.include(missing.message, `\`${fetchCommand}\``);
      assert.include(mismatch.message, `\`${fetchCommand}\``);
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});

/**
 * The named ways an entry breaks the table's rules, and `valid`, the floor: an entry that breaks
 * none.
 */
const PLANTS = [
  "valid",
  "digest-upper",
  "digest-short",
  "digest-long",
  "digest-letter",
  "digest-empty",
  "url-http",
  "url-scheme-case",
  "url-relative",
  "url-space",
  "url-unescaped",
  "url-dot-segment",
  "url-empty",
  "url-shared",
  "path-parent",
  "path-absolute",
  "path-empty-segment",
  "path-dot",
  "path-backslash",
  "path-not-xsd",
  "path-trailing-slash",
  "path-space",
  "path-non-ascii",
  "path-case",
  "path-inside",
] as const;

type Plant = (typeof PLANTS)[number];

/**
 * The rule each plant breaks, none for `valid`.
 */
const ruleOf: Readonly<Record<Plant, PinRule | undefined>> = {
  "digest-empty": "digest",
  "digest-letter": "digest",
  "digest-long": "digest",
  "digest-short": "digest",
  "digest-upper": "digest",
  "path-absolute": "path",
  "path-backslash": "path",
  "path-case": "path-collision",
  "path-dot": "path",
  "path-empty-segment": "path",
  "path-inside": "path-collision",
  "path-non-ascii": "path",
  "path-not-xsd": "path",
  "path-parent": "path",
  "path-space": "path",
  "path-trailing-slash": "path",
  "url-dot-segment": "url",
  "url-empty": "url",
  "url-http": "url",
  "url-relative": "url",
  "url-scheme-case": "url",
  "url-shared": "url-shared",
  "url-space": "url",
  "url-unescaped": "url",
  valid: undefined,
};

/**
 * One planted entry: its kind, the real entry it is built from, and whether it stands before
 * every real entry or after them.
 */
interface Planting {
  readonly kind: Plant;
  readonly place: "first" | "last";
  readonly target: number;
}

/**
 * Build a planted entry, its path and URL fresh by its index unless the plant copies the
 * target's.
 *
 * @param planting - The plant.
 * @param index - Its index among the case's plants.
 * @returns The entry.
 */
const plantedEntry = (planting: Planting, index: number): readonly [string, XsdSource] => {
  const [target, { url: targetUrl }] = realEntries[planting.target] ?? ["", sources["w3/xml.xsd"]];
  const fresh = `fresh-${String(index)}`;
  const file = `${fresh}.xsd`;
  const url = `https://example.org/${file}`;
  const sha256 = String(index).padStart(64, "0");
  const entries: Readonly<Record<Plant, readonly [string, XsdSource]>> = {
    "digest-empty": [file, { sha256: "", url }],
    "digest-letter": [file, { sha256: `g${"a".repeat(63)}`, url }],
    "digest-long": [file, { sha256: "a".repeat(65), url }],
    "digest-short": [file, { sha256: "a".repeat(63), url }],
    "digest-upper": [file, { sha256: "A".repeat(64), url }],
    "path-absolute": [`/${file}`, { sha256, url }],
    "path-backslash": [`w3\\${file}`, { sha256, url }],
    "path-case": [`${target.slice(0, -4).toUpperCase()}.xsd`, { sha256, url }],
    "path-dot": [`./${file}`, { sha256, url }],
    "path-empty-segment": [`w3//${file}`, { sha256, url }],
    "path-inside": [`${target}/${file}`, { sha256, url }],
    "path-non-ascii": [`${fresh}-é.xsd`, { sha256, url }],
    "path-not-xsd": [`${fresh}.xml`, { sha256, url }],
    "path-parent": [`../${file}`, { sha256, url }],
    "path-space": [`${fresh} x.xsd`, { sha256, url }],
    "path-trailing-slash": [`${file}/`, { sha256, url }],
    "url-dot-segment": [file, { sha256, url: `https://example.org/a/../${file}` }],
    "url-empty": [file, { sha256, url: "" }],
    "url-http": [file, { sha256, url: `http://example.org/${file}` }],
    "url-relative": [file, { sha256, url: file }],
    "url-scheme-case": [file, { sha256, url: `HTTPS://example.org/${file}` }],
    "url-shared": [file, { sha256, url: targetUrl }],
    "url-space": [file, { sha256, url: ` ${url}` }],
    "url-unescaped": [file, { sha256, url: `https://example.org/${fresh} x.xsd` }],
    valid: [file, { sha256, url }],
  };

  return entries[planting.kind];
};

/**
 * A fault a planted table must report: the entry it is on, the rule, and the other entry its
 * detail names, empty for a rule that relates no two entries.
 */
interface ExpectedFault {
  readonly names: string;
  readonly path: string;
  readonly rule: PinRule;
}

/**
 * The table a case's plants make, and the faults it must report: the rule each plant breaks, on
 * the plant, or for a rule relating two entries on the later of the plant and its target, naming
 * the other.
 *
 * @param plantings - The plants, each on a distinct target.
 * @returns The table and its expected faults, each `path`, `rule` and the path its detail names.
 */
const plantedTable = (plantings: readonly Planting[]) => {
  const planted = plantings.map((planting, index) => ({
    entry: plantedEntry(planting, index),
    planting,
  }));
  const first = planted.filter(({ planting }) => planting.place === "first");
  const last = planted.filter(({ planting }) => planting.place === "last");
  const table: XsdPins = Object.fromEntries([
    ...first.map(({ entry }) => entry),
    ...realEntries,
    ...last.map(({ entry }) => entry),
  ]);
  const expected = planted.flatMap(({ entry: [file], planting }): readonly ExpectedFault[] => {
    const rule = ruleOf[planting.kind];
    const [target] = realEntries[planting.target] ?? ["", sources["w3/xml.xsd"]];
    if (rule === undefined) {
      return [];
    }

    if (rule === "path-collision" || rule === "url-shared") {
      return planting.place === "last"
        ? [{ names: target, path: file, rule }]
        : [{ names: file, path: target, rule }];
    }

    return [{ names: "", path: file, rule }];
  });
  // Two `url-empty` plants share the URL "", so the later in the table's order also shares it.
  const ordered = [...first, ...last];
  const sharing = ordered.flatMap(({ entry: [file, { url }] }, at): readonly ExpectedFault[] => {
    const earlier = ordered.slice(0, at).find(({ entry: [, held] }) => held.url === url);

    return earlier === undefined
      ? []
      : [{ names: earlier.entry[0], path: file, rule: "url-shared" }];
  });

  return { expected: [...expected, ...sharing], table };
};

/**
 * A fault as `path`, a tab and `rule`, so two lists of faults compare as sorted texts.
 *
 * @param fault - The fault.
 * @param fault.path - The entry it is reported on.
 * @param fault.rule - The rule it breaks.
 * @returns Its key.
 */
const keyOf = ({ path: file, rule }: { readonly path: string; readonly rule: string }): string =>
  `${file}\t${rule}`;

/**
 * Check `pinFaults` on one case's plants: it reports exactly the planted faults, each relating
 * rule naming the other entry.
 *
 * @param plantings - The case's plants.
 * @returns Nothing when it agrees; fails the test otherwise.
 */
const checkPlanted = (plantings: readonly Planting[]) =>
  Effect.sync(() => {
    const { expected, table } = plantedTable(plantings);
    const faults = pinFaults(table);

    assert.deepStrictEqual(faults.map(keyOf).toSorted(), expected.map(keyOf).toSorted());
    for (const { names, path: file, rule } of expected) {
      const fault = faults.find((held) => held.path === file && held.rule === rule);
      if (names !== "") {
        assert.include(fault?.detail ?? "", names, `${file} ${rule}`);
      }
    }
  });

/**
 * One plant: a kind, at a target, at one end.
 */
const plantingOf: Gen<Planting> = (source) => ({
  kind: source.draw(element(PLANTS)),
  place: source.draw(element(["first", "last"] as const)),
  target: source.draw(int(0, realEntries.length - 1)),
});

/**
 * One to four plants, each on a distinct target, their kinds drawn under a swarm of the kinds.
 */
const plantingsOf: Gen<readonly Planting[]> = (source) => {
  const on = source.draw(swarm(PLANTS));
  const count = source.draw(int(1, 4));
  const targets = source.draw(
    subset(
      realEntries.map((_, index) => index),
      { max: count, min: count },
    ),
  );

  return targets.map((target) => ({
    kind: source.draw(swarmChoice(on, PLANTS)),
    place: source.draw(element(["first", "last"] as const)),
    target,
  }));
};

/**
 * This file's budget for a search over `generator`.
 *
 * @param suite - The suite's name.
 * @param generator - What it draws.
 * @param coverage - What it must reach.
 * @param oracle - What judges each case.
 * @returns The search's specification.
 */
const search = <S, F extends string>(
  suite: string,
  generator: Gen<S>,
  coverage: Coverage<F>,
  oracle: string,
) => ({
  caseHang,
  concurrency: 1,
  coverage,
  draw: drawn(generator),
  kept: [],
  literal: Formatter.format,
  oracle: { kind: "specification", name: oracle } as const,
  runs: 300,
  shrink: completeShrink,
  steerEvery: 16,
  suite,
});

describe("pinFaults", () => {
  it.effect(
    "reports exactly the one planted fault: every plant kind, at every target, at either end",
    (ctx) =>
      // Oracle: the plant, which breaks one rule by construction. Bound: the 25 kinds at the 23
      // targets and the 2 ends, 1,150 cases, exhausted.
      searched(
        ctx,
        exhaust(
          {
            box: "one plant: each of the 25 kinds, at each of the 23 targets, at either end",
            caseHang,
            coverage: requiredInSpace<Plant>(PLANTS),
            generator: plantingOf,
            limit: 2000,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "the plant's broken rule" },
            suite: "vocab/fetch-xsds/one-plant",
          },
          (planting, c) => {
            c.note(planting.kind);

            return checkPlanted([planting]);
          },
        ),
      ),
  );

  it.effect(
    "reports exactly the planted faults of up to four plants, drawn under a swarm of the kinds",
    (ctx) =>
      // Oracle: the plants, each breaking one rule by construction, and two `url-empty` plants
      // sharing their URL.
      // Bound: 300 tables a run, each the real table with one to four plants on distinct targets.
      searched(
        ctx,
        explore(
          search(
            "vocab/fetch-xsds/plants",
            plantingsOf,
            required<Plant>(PLANTS, { cases: 300, sense: notesOnly }),
            "the plants' broken rules",
          ),
          (plantings, c) => {
            for (const { kind } of plantings) {
              c.note(kind);
            }

            return checkPlanted(plantings);
          },
        ),
      ),
  );

  it("states one rule per fault kind it can report", () => {
    assert.deepStrictEqual(
      [...new Set(Object.values(ruleOf).filter((rule) => rule !== undefined))].toSorted(),
      [...pinRules].toSorted(),
    );
  });
});

/**
 * What the cache holds at a pin's path before the run: nothing, the pinned bytes, or other bytes.
 */
const CACHE_STATES = ["absent", "pinned", "stale"] as const;

type CacheState = (typeof CACHE_STATES)[number];

/**
 * What the fake server answers for a pin's URL: the pinned bytes, other bytes, HTTP 404, or a
 * transport error.
 */
const ANSWERS = ["pinned", "changed", "missing", "unreachable"] as const;

type Answer = (typeof ANSWERS)[number];

/**
 * Every pairing of a cache state with an answer, `cache/answer`: the situations a run must reach.
 */
const SITUATIONS = [
  "absent/pinned",
  "absent/changed",
  "absent/missing",
  "absent/unreachable",
  "pinned/pinned",
  "pinned/changed",
  "pinned/missing",
  "pinned/unreachable",
  "stale/pinned",
  "stale/changed",
  "stale/missing",
  "stale/unreachable",
] as const;

type Situation = (typeof SITUATIONS)[number];

/**
 * The cache state and the answer each situation pairs.
 */
const pairOf: Readonly<Record<Situation, { readonly answer: Answer; readonly cache: CacheState }>> =
  {
    "absent/changed": { answer: "changed", cache: "absent" },
    "absent/missing": { answer: "missing", cache: "absent" },
    "absent/pinned": { answer: "pinned", cache: "absent" },
    "absent/unreachable": { answer: "unreachable", cache: "absent" },
    "pinned/changed": { answer: "changed", cache: "pinned" },
    "pinned/missing": { answer: "missing", cache: "pinned" },
    "pinned/pinned": { answer: "pinned", cache: "pinned" },
    "pinned/unreachable": { answer: "unreachable", cache: "pinned" },
    "stale/changed": { answer: "changed", cache: "stale" },
    "stale/missing": { answer: "missing", cache: "stale" },
    "stale/pinned": { answer: "pinned", cache: "stale" },
    "stale/unreachable": { answer: "unreachable", cache: "stale" },
  };

/**
 * One pin of a generated table: its bytes, what the cache holds and what the server answers.
 */
interface PinCase {
  readonly answer: Answer;
  readonly bytes: Uint8Array;
  readonly cache: CacheState;
}

/**
 * The bytes a pin's cache or server holds when they are not the pinned ones: the pinned bytes and
 * one more, so they always differ.
 *
 * @param pinned - The pinned bytes.
 * @returns Other bytes.
 */
const otherBytes = (pinned: Uint8Array): Uint8Array => Uint8Array.of(...pinned, 0x0a);

/**
 * The SHA-256 of bytes as 64 lower-case hexadecimal digits, by `node:crypto`.
 *
 * @param held - The bytes.
 * @returns Their digest.
 */
const sha256Of = (held: Uint8Array): string => createHash("sha256").update(held).digest("hex");

/**
 * The path of the pin at an index: alternately at the cache's top and in a folder of its own.
 *
 * @param index - The pin's index.
 * @returns Its path.
 */
const pinPath = (index: number): string =>
  index % 2 === 0 ? `f${String(index)}.xsd` : `d${String(index)}/f${String(index)}.xsd`;

/**
 * The URL the pin at an index is published at.
 *
 * @param index - The pin's index.
 * @returns Its URL.
 */
const pinUrl = (index: number): string => `https://example.org/f${String(index)}.xsd`;

/**
 * What the run must do with one pin: the bytes the cache holds after it, how many requests it
 * makes, and its outcome or its failure's tag and `staleCopy`.
 */
interface Expectation {
  readonly after: Option.Option<Uint8Array>;
  readonly requests: number;
  readonly result: Result.Result<
    Settled,
    {
      readonly staleCopy: boolean;
      readonly tag: "XsdDownloadFailed" | "XsdPublishedChanged";
    }
  >;
}

/**
 * Model what the run must do with one pin.
 *
 * @param pin - The pin's case.
 * @returns The expectation.
 */
const expectationOf = (pin: PinCase): Expectation => {
  const before = {
    absent: Option.none<Uint8Array>(),
    pinned: Option.some(pin.bytes),
    stale: Option.some(otherBytes(pin.bytes)),
  }[pin.cache];
  if (pin.cache === "pinned") {
    return { after: before, requests: 0, result: Result.succeed<Settled>("present") };
  }

  if (pin.answer === "pinned") {
    return {
      after: Option.some(pin.bytes),
      requests: 1,
      result: Result.succeed<Settled>(pin.cache === "stale" ? "replaced" : "fetched"),
    };
  }

  return {
    after: before,
    requests: 1,
    result: Result.fail({
      staleCopy: pin.cache === "stale",
      tag: pin.answer === "changed" ? "XsdPublishedChanged" : "XsdDownloadFailed",
    }),
  };
};

/**
 * A fake server for a generated table: it answers each pin's URL as the case says and counts the
 * requests each URL receives.
 *
 * @param pins - The table's cases, by index.
 * @returns The client and the request counts by URL.
 */
const fakeServer = (pins: readonly PinCase[]) => {
  const requests = new Map<string, number>();
  const client = HttpClient.make((request, url) => {
    const { href } = url;
    const index = pins.findIndex((_, at) => pinUrl(at) === href);
    const pin = pins[index];

    requests.set(href, (requests.get(href) ?? 0) + 1);
    if (pin === undefined || pin.answer === "unreachable") {
      return Effect.fail(
        new HttpClientError.HttpClientError({
          reason: new HttpClientError.TransportError({
            description: "connection refused",
            request,
          }),
        }),
      );
    }

    const answered = {
      changed: { body: otherBytes(pin.bytes), status: 200 },
      missing: { body: new TextEncoder().encode("not found"), status: 404 },
      pinned: { body: pin.bytes, status: 200 },
    }[pin.answer];

    return Effect.succeed(
      HttpClientResponse.fromWeb(
        request,
        new Response(Uint8Array.from(answered.body), { status: answered.status }),
      ),
    );
  });

  return { client, requests };
};

/**
 * Check what an incomplete run says about each pin it could not settle: the message names the pin,
 * the pin's own message its URL, a failed download what the server did, and a changed file the
 * digest of what it served.
 *
 * @param pins - The table's cases.
 * @param failure - The run's failure.
 */
const checkFailures = (pins: readonly PinCase[], failure: XsdFetchIncomplete): void => {
  for (const held of failure.failures) {
    const index = pins.findIndex((_, at) => pinPath(at) === held.path);

    assert.include(failure.message, held.path);
    assert.include(held.message, pinUrl(index));
    if (held._tag === "XsdDownloadFailed") {
      assert.strictEqual(
        held.reason,
        pins[index]?.answer === "missing"
          ? "the server answered HTTP 404"
          : "the request did not complete: connection refused",
      );
    } else {
      assert.strictEqual(held.actual, sha256Of(otherBytes(pins[index]?.bytes ?? new Uint8Array())));
    }
  }
};

/**
 * Run `fetchPinned` over one generated table in a fresh `HOME`, and check what it left against the
 * model: the run's outcome or failures, every file in the cache, the requests, and that the scratch
 * directory is gone.
 *
 * @param pins - The table's cases.
 * @returns Nothing when the run agrees with the model; fails the test otherwise.
 */
const checkRun = Effect.fn("test.fetchXsds.checkRun")(function* checkRun(pins: readonly PinCase[]) {
  const fs = yield* FileSystem.FileSystem;
  const home = yield* fs.makeTempDirectoryScoped({ prefix: "fetch-xsds-" });
  const directory = `${home}/.cache/gr8des/qti3/xsd`;
  const table: XsdPins = Object.fromEntries(
    pins.map((pin, index) => [pinPath(index), { sha256: sha256Of(pin.bytes), url: pinUrl(index) }]),
  );
  const expected = pins.map((pin) => expectationOf(pin));

  for (const [index, pin] of pins.entries()) {
    const file = `${directory}/${pinPath(index)}`;
    if (pin.cache !== "absent") {
      yield* fs.makeDirectory(path.dirname(file), { recursive: true });
      yield* fs.writeFile(file, pin.cache === "pinned" ? pin.bytes : otherBytes(pin.bytes));
    }
  }

  const { client, requests } = fakeServer(pins);
  const run = yield* Effect.result(
    fetchPinned(table).pipe(
      Effect.provideService(HttpClient.HttpClient, client),
      Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: home }))),
    ),
  );
  const failures = expected.flatMap(({ result }, index) =>
    Result.isFailure(result) ? [{ ...result.failure, path: pinPath(index) }] : [],
  );

  if (failures.length === 0) {
    assert.isTrue(Result.isSuccess(run), Result.isFailure(run) ? run.failure.message : "");
    assert.deepStrictEqual(Result.isSuccess(run) ? run.success : undefined, {
      directory,
      settled: expected.flatMap(({ result }, index) =>
        Result.isSuccess(result) ? [{ outcome: result.success, path: pinPath(index) }] : [],
      ),
    });
  } else {
    const failure = Result.isFailure(run) ? run.failure : undefined;

    assert.instanceOf(failure, XsdFetchIncomplete);
    assert.deepStrictEqual(
      failure instanceof XsdFetchIncomplete
        ? {
            directory: failure.directory,
            failures: failure.failures.map((held) => ({
              path: held.path,
              staleCopy: held.staleCopy,
              tag: held._tag,
            })),
            pinned: failure.pinned,
          }
        : undefined,
      { directory, failures, pinned: pins.length },
    );
    if (failure instanceof XsdFetchIncomplete) {
      checkFailures(pins, failure);
    }
  }

  const left = yield* fs.readDirectory(home, { recursive: true });
  const files = yield* Effect.filter(
    left,
    (entry) => fs.stat(`${home}/${entry}`).pipe(Effect.map((info) => info.type === "File")),
    { concurrency: "unbounded" },
  );

  assert.deepStrictEqual(
    files.toSorted(),
    expected
      .flatMap(({ after }, index) =>
        Option.isSome(after) ? [`.cache/gr8des/qti3/xsd/${pinPath(index)}`] : [],
      )
      .toSorted(),
  );
  assert.deepStrictEqual(
    left.filter((entry) => entry.includes(".fetch-xsds-")),
    [],
  );
  for (const [index, { after, requests: count }] of expected.entries()) {
    if (Option.isSome(after)) {
      assert.deepStrictEqual(
        sha256Of(yield* fs.readFile(`${directory}/${pinPath(index)}`)),
        sha256Of(after.value),
        pinPath(index),
      );
    }

    assert.strictEqual(requests.get(pinUrl(index)) ?? 0, count, pinPath(index));
  }
});

/**
 * One pin's case: its bytes, and a cache state and an answer.
 *
 * @param situation - The pairing of cache state and answer.
 * @returns The case.
 */
const pinCaseOf =
  (situation: Situation): Gen<PinCase> =>
  (source) => ({ ...pairOf[situation], bytes: source.draw(bytes({ max: 12, min: 0 })) });

/**
 * One to four pins, each pairing drawn under a swarm of the twelve.
 */
const pinCasesOf: Gen<readonly PinCase[]> = (source) => {
  const on = source.draw(swarm(SITUATIONS));
  const count = source.draw(int(1, 4));

  return Array.from({ length: count }, () =>
    source.draw(pinCaseOf(source.draw(swarmChoice(on, SITUATIONS)))),
  );
};

/**
 * The layer every fetch case runs under: Node's file system and paths, and WebCrypto's digests.
 */
const fetchLayer = Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto);

describe("fetchPinned", () => {
  it.effect("settles one pin as the model says: every cache state against every answer", (ctx) =>
    // Oracle: the model, `expectationOf`, with digests by node:crypto. Bound: the 3 cache states
    // and the 4 answers, 12 cases, exhausted.
    searched(
      ctx,
      exhaust(
        {
          box: "one pin: each of the 3 cache states against each of the 4 answers",
          caseHang,
          coverage: requiredInSpace<Situation>(SITUATIONS),
          generator: (source) => source.draw(element(SITUATIONS)),
          limit: 100,
          literal: Formatter.format,
          oracle: { kind: "specification", name: "the fetcher's model" },
          suite: "vocab/fetch-xsds/one-pin",
        },
        (situation, c) => {
          c.note(situation);

          return checkRun([
            { ...pairOf[situation], bytes: new TextEncoder().encode("<xs:schema/>") },
          ]);
        },
      ),
    ).pipe(Effect.provide(fetchLayer)),
  );

  it.effect(
    "leaves exactly the model's cache for tables of up to four pins, drawn under a swarm of the pairings",
    (ctx) =>
      // Oracle: the model, `expectationOf`, with digests by node:crypto. Bound: 300 tables a run
      // of one to four pins, each a cache state, an answer and up to 12 bytes.
      searched(
        ctx,
        explore(
          {
            ...search(
              "vocab/fetch-xsds/tables",
              pinCasesOf,
              required<Situation>(SITUATIONS, { cases: 300, sense: notesOnly }),
              "the fetcher's model",
            ),
            runs: 200,
          },
          (pins, c) => {
            for (const { answer, cache } of pins) {
              c.note(`${cache}/${answer}`);
            }

            return checkRun(pins);
          },
        ),
      ).pipe(Effect.provide(fetchLayer)),
    120_000,
  );
});
