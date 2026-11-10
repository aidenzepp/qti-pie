/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * Download every XSD `src/vocab/derive/sources.ts` pins into the shared cache the vocabulary reads,
 * checking each file against its SHA-256 pin.
 *
 * Run it as `pnpm --filter @qti-pie/pantry run fetch-xsds` from anywhere in the workspace. It
 * writes only under {@link xsdDirectory}, `.cache/gr8des/qti3/xsd` under `HOME`, and touches no
 * database. A cached file that hashes to its pin is kept, and no request is made for it. An absent
 * file, or one whose bytes differ from its pin, is downloaded, and the download is written only
 * when it hashes to the pin, into a scratch directory inside the cache and then renamed into
 * place, so the cache never holds a partial or unpinned file under a pinned path. Every pin is
 * attempted; the run then fails naming each one it could not settle, and a second run requests
 * only those.
 */
import { NodeRuntime, NodeServices } from "@effect/platform-node";
import {
  Cause,
  Console,
  Duration,
  Effect,
  FileSystem,
  flow,
  Layer,
  Option,
  Path,
  Result,
  Schedule,
  Schema,
} from "effect";
import { Command } from "effect/cli";
import { Digest } from "effect/crypto";
import { FetchHttpClient, HttpClient } from "effect/http";
import type { HttpClientError } from "effect/http";
import { fetchCommand, sources, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { XsdSource } from "#pantry/vocab/derive/sources.ts";

/**
 * A table of pinned XSDs, keyed by path under {@link xsdDirectory}: {@link sources}, or a table of
 * the same shape.
 */
export type XsdPins = Readonly<Record<string, XsdSource>>;

/**
 * The rules a pin table keeps, each the name of the fault {@link pinFaults} reports when an entry
 * breaks it.
 *
 * - `digest`: the `sha256` is 64 lower-case hexadecimal digits, the form `Digest.digestHex` writes
 *   and the reads compare as text.
 * - `url`: the `url` is an `https` URL written as the WHATWG URL standard serializes it. The deriver
 *   and the XSD catalog find the pin an `xs:include` or `xs:import` names by comparing the
 *   location's resolved `href` with each pin's `url` as text, so a pin in any other spelling is
 *   never found.
 * - `url-shared`: no two pins have one `url`, so a resolved location names one file.
 * - `path`: the path is relative, of segments of ASCII letters, digits, `.`, `_` and `-`, none `.` or
 *   `..`, and ends in `.xsd`, so the file it names lies inside the cache directory on every file
 *   system.
 * - `path-collision`: no two paths name one file on a case-insensitive file system, the default on
 *   macOS and Windows, and no path lies inside another, which would have to be both a file and a
 *   directory.
 */
export const pinRules = ["digest", "url", "url-shared", "path", "path-collision"] as const;

/**
 * One of {@link pinRules}.
 */
export type PinRule = (typeof pinRules)[number];

/**
 * One entry of a pin table that breaks a rule: the entry's path, the rule, and what is wrong with
 * it, in a phrase that follows the path.
 */
const PinFaultSchema = Schema.Struct({
  detail: Schema.String,
  path: Schema.String,
  rule: Schema.Literals(pinRules),
});

/**
 * One entry of a pin table that breaks one of {@link pinRules}.
 */
export type PinFault = typeof PinFaultSchema.Type;

/**
 * A SHA-256 digest as `Digest.digestHex` writes it.
 */
const digestForm = /^[\da-f]{64}$/u;

/**
 * One segment of a pinned path.
 */
const segmentForm = /^[\w.-]+$/u;

/**
 * Whether a path keeps the `path` rule of {@link pinRules}.
 *
 * @param path - A key of a pin table.
 * @returns Whether it is relative segments of the portable letters, none `.` or `..`, ending in
 *   `.xsd`.
 */
const isPortablePath = (path: string): boolean =>
  path.endsWith(".xsd") &&
  path
    .split("/")
    .every((segment) => segmentForm.test(segment) && segment !== "." && segment !== "..");

/**
 * Whether one path lies inside the directory another names, compared case-folded.
 *
 * @param inner - The path that may lie inside.
 * @param outer - The path that may be its directory.
 * @returns Whether `outer` followed by `/` begins `inner`.
 */
const liesInside = (inner: string, outer: string): boolean =>
  inner.toLowerCase().startsWith(`${outer.toLowerCase()}/`);

/**
 * Report every entry of a pin table that breaks one of {@link pinRules}.
 *
 * A rule that relates two entries, `url-shared` and `path-collision`, is reported on the later of
 * the two in the table's order and names the earlier.
 *
 * @param pins - The table to check.
 * @returns Each fault, in the table's order and then the order of {@link pinRules}; none when the
 *   table keeps every rule.
 */
export const pinFaults = (pins: XsdPins): readonly PinFault[] =>
  Object.entries(pins).flatMap(([path, { sha256, url }], index, entries) => {
    const earlier = entries.slice(0, index).map(([held]) => held);
    const parsed = URL.parse(url);
    const sharer = entries.slice(0, index).find(([, held]) => held.url === url);
    const collider = earlier.find(
      (held) =>
        held.toLowerCase() === path.toLowerCase() ||
        liesInside(path, held) ||
        liesInside(held, path),
    );
    const faults: readonly (readonly PinFault[])[] = [
      digestForm.test(sha256)
        ? []
        : [
            {
              detail: `its sha256 ${JSON.stringify(sha256)} is not 64 lower-case hexadecimal digits`,
              path,
              rule: "digest",
            },
          ],
      parsed?.protocol === "https:" && parsed.href === url
        ? []
        : [
            {
              detail: `its url ${JSON.stringify(url)} is not an https URL written as the URL standard serializes it, the form an xs:include's resolved location is matched against`,
              path,
              rule: "url",
            },
          ],
      sharer === undefined
        ? []
        : [
            {
              detail: `its url is also the url of ${sharer[0]}, so a location that resolves to it names two files`,
              path,
              rule: "url-shared",
            },
          ],
      isPortablePath(path)
        ? []
        : [
            {
              detail:
                'it is not a relative path of segments of letters, digits, ".", "_" and "-", none "." or "..", ending in ".xsd"',
              path,
              rule: "path",
            },
          ],
      collider === undefined
        ? []
        : [
            {
              detail: `it names the same file as ${collider}, or a file inside it or around it, on a case-insensitive file system`,
              path,
              rule: "path-collision",
            },
          ],
    ];

    return faults.flat();
  });

/**
 * The pin table breaks one of {@link pinRules}, so nothing was downloaded.
 *
 * `faults` lists each entry that breaks a rule.
 */
export class XsdPinsInvalid extends Schema.TaggedError<XsdPinsInvalid>()("XsdPinsInvalid", {
  faults: Schema.Array(PinFaultSchema),
}) {
  /**
   * Which entries are malformed, how, and where they are corrected.
   */
  override get message(): string {
    const malformed = new Set(this.faults.map(({ path }) => path)).size;

    return [
      `${malformed === 1 ? "1 pin" : `${String(malformed)} pins`} in src/vocab/derive/sources.ts ${malformed === 1 ? "is" : "are"} malformed, so no XSD was downloaded:`,
      ...this.faults.map(({ detail, path }) => `  - ${path}: ${detail}.`),
      `Correct each entry in sources.ts, then run \`${fetchCommand}\` again.`,
    ].join("\n");
  }
}

/**
 * A pinned XSD could not be downloaded.
 *
 * `reason` says what the request ended with. `staleCopy` is whether the cache already held a file
 * at the path whose bytes differ from the pin; that file is left as it was.
 */
export class XsdDownloadFailed extends Schema.TaggedError<XsdDownloadFailed>()(
  "XsdDownloadFailed",
  { path: Schema.String, reason: Schema.String, staleCopy: Schema.Boolean, url: Schema.String },
) {
  /**
   * Which file was not downloaded, from where, and why.
   */
  override get message(): string {
    return `${this.path} was not downloaded from ${this.url}: ${this.reason}.${this.staleCopy ? " The cached copy, which does not match its pin, was left as it was." : ""}`;
  }
}

/**
 * A pinned XSD's URL serves bytes that do not hash to its pin, so they were not written.
 *
 * `expected` is the pinned SHA-256 and `actual` the digest of the bytes served. `staleCopy` is
 * whether the cache already held a file at the path whose bytes differ from the pin; that file is
 * left as it was.
 */
export class XsdPublishedChanged extends Schema.TaggedError<XsdPublishedChanged>()(
  "XsdPublishedChanged",
  {
    actual: Schema.String,
    expected: Schema.String,
    path: Schema.String,
    staleCopy: Schema.Boolean,
    url: Schema.String,
  },
) {
  /**
   * Which URL serves other bytes than its pin, and that nothing was written for it.
   */
  override get message(): string {
    return `${this.url} serves a file with SHA-256 ${this.actual}, not the pinned ${this.expected}, so ${this.path} was not written.${this.staleCopy ? " The cached copy, which does not match its pin either, was left as it was." : ""}`;
  }
}

/**
 * Why one pin could not be settled: its download failed, or it served other bytes than its pin.
 */
export type PinFailure = XsdDownloadFailed | XsdPublishedChanged;

/**
 * Keep a pin's failure as a value, so a run attempts every pin before it fails.
 *
 * @param failure - The pin's failure.
 * @returns The failure as a failed result, in the success channel.
 */
const keptFailure = (failure: PinFailure) =>
  Effect.succeed<Result.Result<Settled, PinFailure>>(Result.fail(failure));

/**
 * Some pinned XSDs could not be put in the cache directory.
 *
 * `failures` lists each one and why, `pinned` is the size of the pin table, and every pin not
 * among the failures is in the directory and hashes to its pin.
 */
export class XsdFetchIncomplete extends Schema.TaggedError<XsdFetchIncomplete>()(
  "XsdFetchIncomplete",
  {
    directory: Schema.String,
    failures: Schema.Array(Schema.Union([XsdDownloadFailed, XsdPublishedChanged])),
    pinned: Schema.Number,
  },
) {
  /**
   * Which files are missing and why, that the rest are in place, and what settles each kind of
   * failure.
   */
  override get message(): string {
    const missing = this.failures.length;
    const rest = this.pinned - missing;
    const repairs = [
      ...(this.failures.some((failure) => failure._tag === "XsdDownloadFailed")
        ? [
            `For a download that failed, check that its URL answers, then run \`${fetchCommand}\` again; it requests only the files still missing.`,
          ]
        : []),
      ...(this.failures.some((failure) => failure._tag === "XsdPublishedChanged")
        ? [
            "For a file that changed where it is published, review the change, then re-pin it in src/vocab/derive/sources.ts and run the deriver's tests again.",
          ]
        : []),
    ];

    return [
      `${String(missing)} of the ${String(this.pinned)} pinned XSDs could not be put in ${this.directory}:`,
      ...this.failures.map((failure) => `  - ${failure.message}`),
      rest === 1
        ? "The remaining 1 is in place, checked against its pin."
        : `The remaining ${String(rest)} are in place, each checked against its pin.`,
      ...repairs,
    ].join("\n");
  }
}

/**
 * What a run did with one pin: `present` when the cache already held its bytes, `fetched` when it
 * was absent and is now downloaded, `replaced` when the cached bytes differed from the pin and the
 * download replaced them.
 */
export type Settled = "present" | "fetched" | "replaced";

/**
 * What a run left in the cache: the directory and, in the table's order, every pin with what the
 * run did with it. Each file named is in the directory and hashes to its pin.
 */
export interface FetchReport {
  readonly directory: string;
  readonly settled: readonly { readonly outcome: Settled; readonly path: string }[];
}

/**
 * How many pinned files download at once, here and in the spec cache's fetcher,
 * `#pantry/test/spec-cache/fetch.ts`.
 */
export const concurrency = 4;

/**
 * How long one file's download may take, its body included. The largest XSD, the ASI 3.0.1 one, is
 * about 19 MB, and the largest file the spec cache's fetcher downloads, the QTI 3.0 XML binding's
 * HTML, about 37 MB.
 */
const downloadTimeout = Duration.minutes(5);

/**
 * Say what a download ended with, for the `reason` of {@link XsdDownloadFailed} and of the spec
 * cache's `SpecDownloadFailed`.
 *
 * @param error - The request's failure, or the timeout's.
 * @returns A phrase that follows "was not downloaded from <url>:".
 */
export const reasonOf = (error: HttpClientError.HttpClientError | Cause.TimeoutError): string => {
  if (Cause.isTimeoutError(error)) {
    return `no complete answer came within ${Duration.format(downloadTimeout)}`;
  }

  const { reason } = error;
  if (reason._tag === "StatusCodeError") {
    return `the server answered HTTP ${String(reason.response.status)}`;
  }

  if (reason._tag === "TransportError") {
    const cause = Option.liftPredicate(
      reason.cause,
      (held): held is Error => held instanceof Error,
    );
    // The client's own description, else its cause's message; either may be missing.
    const detail = Option.orElse(Option.fromNullishOr(reason.description), () =>
      cause.pipe(Option.map(({ message }) => message)),
    );
    const code = cause.pipe(
      Option.flatMap((held) =>
        held.cause instanceof Error && "code" in held.cause
          ? Option.some(String(held.cause.code))
          : Option.none(),
      ),
    );
    const said = Option.match(detail, {
      onNone: () =>
        Option.match(code, {
          onNone: () => "the client gave no reason",
          onSome: (held) => `the client gave only the code ${held}`,
        }),
      onSome: (held) =>
        Option.match(code, { onNone: () => held, onSome: (named) => `${held} (${named})` }),
    });

    return `the request did not complete: ${said}`;
  }

  return `the answer could not be read: ${reason.message}`;
};

/**
 * What the cache holds at a pinned path: `pinned` when the file there hashes to the pin, `stale`
 * when its bytes differ from the pin, `absent` when there is no file there.
 */
export type Held = "absent" | "stale" | "pinned";

/**
 * Compare the file the cache holds at a pinned path with its pin.
 *
 * @param destination - The file's path.
 * @param sha256 - Its pinned SHA-256.
 * @returns What the cache holds there; any file system failure but a missing file.
 */
export const heldAgainstPin = Effect.fn("vocab.heldAgainstPin")(function* heldAgainstPin(
  destination: string,
  sha256: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const digest = yield* Digest.Digest;
  const cached = yield* fs.readFile(destination).pipe(
    Effect.map(Option.some),
    Effect.catchIf(
      (error) => error.reason._tag === "NotFound",
      () => Effect.succeedNone,
    ),
  );

  if (Option.isNone(cached)) {
    return "absent" satisfies Held;
  }

  return (yield* digest.digestHex(Digest.sha256, cached.value)) === sha256
    ? ("pinned" satisfies Held)
    : ("stale" satisfies Held);
});

/**
 * Download one pinned file's bytes, its body read within {@link downloadTimeout}.
 *
 * @param client - The client the download is made with.
 * @param url - The file's URL.
 * @returns The bytes served; the request's failure or the timeout's, which {@link reasonOf}
 *   describes.
 */
export const downloadBytes = (client: HttpClient.HttpClient, url: string) =>
  client.get(url).pipe(
    Effect.flatMap((response) => response.arrayBuffer),
    Effect.map((buffer) => new Uint8Array(buffer)),
    Effect.timeout(downloadTimeout),
  );

/**
 * Put bytes checked against their pin at the pinned path: write them to a scratch file inside the
 * cache, then rename it into place, so the path never holds a partial file.
 *
 * @param bytes - The bytes, which hash to the pin.
 * @param scratch - A path in a scratch directory inside the cache that nothing else uses.
 * @param destination - The pinned path.
 * @returns Nothing once the file is in place; the file system's failure.
 */
export const placeFile = Effect.fn("vocab.placeFile")(function* placeFile(
  bytes: Uint8Array,
  scratch: string,
  destination: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const paths = yield* Path.Path;

  yield* fs.makeDirectory(paths.dirname(destination), { recursive: true });
  yield* fs.writeFile(scratch, bytes);
  yield* fs.rename(scratch, destination);
});

/**
 * Settle one pin: keep the cached file when it hashes to the pin, and otherwise download it and
 * write it when the download does.
 *
 * @param pin - The pin's path, its URL and digest, and the scratch file a download is written to
 *   before it is renamed into place.
 * @param pin.path - The path under the cache directory.
 * @param pin.source - Its URL and SHA-256.
 * @param pin.scratch - A path in the scratch directory, inside the cache directory, that no other
 *   pin uses.
 * @param directory - The cache directory.
 * @param client - The client the download is made with, refusing every status but 2xx.
 * @returns What was done; an {@link XsdDownloadFailed} when the download failed, or an
 *   {@link XsdPublishedChanged} when its bytes differ from the pin.
 */
const settle = Effect.fn("vocab.fetchXsd")(function* settle(
  pin: { readonly path: string; readonly scratch: string; readonly source: XsdSource },
  directory: string,
  client: HttpClient.HttpClient,
) {
  const { path, scratch, source } = pin;

  yield* Effect.annotateCurrentSpan({ path, url: source.url });

  const paths = yield* Path.Path;
  const digest = yield* Digest.Digest;
  const destination = paths.join(directory, path);
  const held = yield* heldAgainstPin(destination, source.sha256);

  if (held === "pinned") {
    return "present" satisfies Settled;
  }

  const staleCopy = held === "stale";
  const bytes = yield* downloadBytes(client, source.url).pipe(
    Effect.mapError(
      (error) =>
        new XsdDownloadFailed({ path, reason: reasonOf(error), staleCopy, url: source.url }),
    ),
  );
  const actual = yield* digest.digestHex(Digest.sha256, bytes);

  if (actual !== source.sha256) {
    return yield* new XsdPublishedChanged({
      actual,
      expected: source.sha256,
      path,
      staleCopy,
      url: source.url,
    });
  }

  yield* placeFile(bytes, scratch, destination);

  return staleCopy ? ("replaced" satisfies Settled) : ("fetched" satisfies Settled);
});

/**
 * Put every XSD a pin table names in the cache directory, each checked against its SHA-256.
 *
 * The table is checked against {@link pinRules} before any request. The downloads use the
 * `HttpClient` the caller provides, a status other than 2xx counting as a failure; the command
 * provides one that retries transient failures. The scratch directory the downloads are written
 * to is removed when the run ends, however it ends.
 *
 * @param pins - The pin table, {@link sources} for the command.
 * @returns What the run did with each pin; an {@link XsdPinsInvalid} when the table breaks a rule,
 *   an {@link XsdFetchIncomplete} naming each pin that could not be settled once every pin was
 *   attempted, or the file system's failure.
 */
export const fetchPinned = Effect.fn("vocab.fetchPinned")(function* fetchPinned(pins: XsdPins) {
  const faults = pinFaults(pins);

  if (faults.length > 0) {
    return yield* new XsdPinsInvalid({ faults });
  }

  const fs = yield* FileSystem.FileSystem;
  const paths = yield* Path.Path;
  const directory = yield* xsdDirectory;
  const client = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);

  yield* Effect.annotateCurrentSpan({ directory, pinned: Object.keys(pins).length });
  yield* fs.makeDirectory(directory, { recursive: true });

  const scratch = yield* fs.makeTempDirectoryScoped({ directory, prefix: ".fetch-xsds-" });
  const results = yield* Effect.forEach(
    Object.entries(pins),
    ([path, source], index) =>
      settle({ path, scratch: paths.join(scratch, String(index)), source }, directory, client).pipe(
        Effect.map((outcome): Result.Result<Settled, PinFailure> => Result.succeed(outcome)),
        // A pin's own failure is kept and the other pins go on; a file system failure ends the run.
        Effect.catchTags({ XsdDownloadFailed: keptFailure, XsdPublishedChanged: keptFailure }),
        Effect.map((result) => ({ path, result })),
      ),
    { concurrency },
  );
  const failures = results.flatMap(({ result }) =>
    Result.isFailure(result) ? [result.failure] : [],
  );

  if (failures.length > 0) {
    return yield* new XsdFetchIncomplete({
      directory,
      failures,
      pinned: results.length,
    });
  }

  return {
    directory,
    settled: results.flatMap(({ path, result }) =>
      Result.isSuccess(result) ? [{ outcome: result.success, path }] : [],
    ),
  } satisfies FetchReport;
}, Effect.scoped);

/**
 * Write the closing line of a run that settled every pin.
 *
 * @param report - What the run did.
 * @returns How many pins are in which directory, and how many of them the run fetched, replaced
 *   or found present.
 */
export const summaryOf = (report: FetchReport): string => {
  const count = (outcome: Settled) =>
    String(report.settled.filter((held) => held.outcome === outcome).length);

  return `All ${String(report.settled.length)} pinned XSDs are in ${report.directory} and match their SHA-256 pins: ${count("fetched")} fetched, ${count("replaced")} replaced, ${count("present")} already present.`;
};

/**
 * The client the command downloads with: `fetch`, each attempt given 30 seconds to answer, and a
 * transient failure (a transport error, a timeout, HTTP 408, 429 or 5xx) tried again up to three
 * times, a second, two and four seconds apart.
 */
export const downloadClient = Layer.effect(
  HttpClient.HttpClient,
  HttpClient.HttpClient.pipe(
    Effect.map(
      flow(
        HttpClient.timeout(Duration.seconds(30)),
        HttpClient.retryTransient({
          schedule: Schedule.exponential(Duration.seconds(1)),
          times: 3,
        }),
      ),
    ),
  ),
).pipe(Layer.provide(FetchHttpClient.layer));

/**
 * The command line: `fetch-xsds` downloads the pinned XSDs and prints one line per pin, then a
 * summary.
 */
const command = Command.make(
  "fetch-xsds",
  {},
  Effect.fn("vocab.fetchXsdsCommand")(function* fetchXsdsCommand() {
    const report = yield* fetchPinned(sources);

    for (const { outcome, path } of report.settled) {
      yield* Console.log(`${outcome.padEnd(8)} ${path}`);
    }

    yield* Console.log(summaryOf(report));
  }),
).pipe(
  Command.withDescription(
    "Download the XSDs src/vocab/derive/sources.ts pins into ~/.cache/gr8des/qti3/xsd, checking each against its SHA-256. A file already there that matches its pin is kept.",
  ),
);

if (import.meta.main) {
  NodeRuntime.runMain(
    Command.run(command, { version: "0.0.0" }).pipe(
      Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto, downloadClient)),
    ),
  );
}
