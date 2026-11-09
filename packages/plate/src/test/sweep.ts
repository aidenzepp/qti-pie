/**
 * The corpus sweeps' shared support: every corpus member opened once per test file, the HTML of an
 * accepted item's three render states, and the records a templated item is redacted under.
 *
 * Test support, outside the core: nothing under `src/index.ts`'s closure imports it
 * (`src/boundary.test.ts`). It reads the corpus through `corpusDocuments` and `readCorpusFile`, so
 * a test points it elsewhere with `PLATE_CORPUS_DIR` through `ConfigProvider.fromUnknown`.
 *
 * @module
 */
import type { Config } from "effect";
import { Effect, Exit, Option, Result } from "effect";
import { decodeRecord } from "#plate/codec/record.ts";
import { corpusDocuments, readCorpusFile } from "#plate/document/corpus.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { begin, redact, render } from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  EngineFailure,
  InvalidInstance,
  InvalidRecord,
  Options,
  OutputTooLarge,
  PartSwapRefused,
  StoredRecord,
  UnknownPart,
  Verdict,
} from "#plate/index.ts";
import type { ItemRecord, RedactRecord } from "#plate/model/record.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * One corpus member, read and opened.
 */
export interface Member {
  /**
   * The member's bytes as read from the corpus, which `open` judged.
   */
  readonly bytes: Uint8Array;
  /**
   * The member's corpus-relative path, which `open` took as its location.
   */
  readonly location: string;
  /**
   * What `open` gave: its verdict, or the defect that escaped it.
   */
  readonly verdict: Exit.Exit<Verdict>;
}

/**
 * Read one member and open it, keeping a defect `open` lets escape as the member's outcome rather
 * than the sweep's failure.
 *
 * @param location The member's corpus-relative path.
 * @returns The member; a failure only when the corpus cannot be read.
 */
const openMember = Effect.fnUntraced(function* openMember(
  location: string,
): Effect.fn.Return<Member, CorpusFileUnreadable | CorpusMissing | Config.ConfigError> {
  const bytes = yield* readCorpusFile(location);
  const verdict = yield* Effect.exit(open(location, bytes));

  return { bytes, location, verdict };
});

/**
 * Every member of the corpus document set, read and opened, in the set's order.
 *
 * It runs once per test file: the first run's result, members or failure, is kept for the module's
 * life, and Vitest gives each test file its own module. That run reads the corpus root from the
 * configuration in force when it starts.
 */
export const openCorpus: Effect.Effect<
  readonly Member[],
  CorpusFileUnreadable | CorpusMissing | Config.ConfigError
> = Effect.runSync(
  Effect.cached(
    corpusDocuments.pipe(
      Effect.flatMap((documents) =>
        Effect.all(
          documents.map((location) => openMember(location)),
          { concurrency: 8 },
        ),
      ),
    ),
  ),
);

/**
 * Give a member's accepted document, when `open` accepted it with either accepting verdict.
 *
 * @param member The member.
 * @returns The accepted document, or none for a refused or unchecked member or a defect.
 */
export const acceptedOf = (member: Member): Option.Option<Accepted> =>
  Exit.match(member.verdict, {
    onFailure: () => Option.none(),
    onSuccess: acceptedItem,
  });

/**
 * The instance token every sweep render passes, so a render is a function of its item and state.
 */
export const sweepInstance = "sweep";

/**
 * The text each response's validation message carries in the second state.
 */
export const messageText = "Check this answer.";

/**
 * The string each response's refused post sent in the second state. It holds the characters HTML
 * escapes in text and in attribute values, so a render that writes it unescaped fails the round
 * trip.
 */
export const postedText = 'posted & <text> "here"';

/**
 * The name of one render state.
 */
export type StateName = "disabled" | "messages and posted text" | "no inputs";

/**
 * One render state of an item: its name, the options `render` took, and the HTML it gave.
 */
export interface RenderState {
  readonly html: string;
  readonly name: StateName;
  readonly options: Options;
}

/**
 * Give the options of the three render states for an item's responses: no inputs; a validation
 * message for each response with its posted text; and every control disabled.
 *
 * @param responses The identifiers of the item's responses.
 * @returns Each state's name and options, in that order.
 */
const statesOf = (responses: readonly string[]): readonly (readonly [StateName, Options])[] => [
  ["no inputs", { instance: sweepInstance }],
  [
    "messages and posted text",
    {
      instance: sweepInstance,
      messages: responses.map((response) => ({ response, text: messageText })),
      posted: Object.fromEntries(responses.map((response) => [response, [postedText]])),
    },
  ],
  ["disabled", { disabled: true, instance: sweepInstance }],
];

/**
 * Render an accepted item through `render(redact(…))` in its three states, each with the fixed
 * instance {@link sweepInstance}.
 *
 * @param accepted The accepted document.
 * @param configuration The configuration every state renders with.
 * @param record The record `redact` shows the item by; none to show it as it reads with no record.
 * @returns The three states with their HTML, or the first `render` error.
 */
export const threeStates = (
  accepted: Accepted,
  configuration: Configuration,
  record?: RedactRecord,
): Result.Result<
  readonly RenderState[],
  InvalidInstance | OutputTooLarge | PartSwapRefused | UnknownPart
> => {
  const redacted = redact(accepted, record);
  const responses = redacted.responses.map((response) => response.identifier);

  return Result.all(
    statesOf(responses).map(([name, options]) =>
      Result.map(render(redacted, configuration, options), ({ html }) => ({
        html,
        name,
        options,
      })),
    ),
  );
};

/**
 * Report whether an accepted item's template processing runs: the item holds template rules.
 *
 * @param accepted The accepted document.
 * @returns Whether `begin` runs template processing for it, so `redact` needs its record.
 */
export const templated = (accepted: Accepted): boolean =>
  Option.isSome(accepted.item.templateProcessing);

/**
 * The seeds the template sweeps begin a record under: fixed strings, so a run repeats and a
 * failure names the seed. `begin` draws a fresh seed when given none, so a sweep never leaves one
 * out.
 */
export const sweepSeeds = ["1", "2"] as const;

/**
 * One state a templated item is redacted in: a record begun under a sweep seed, or no record.
 */
export interface RecordState {
  /**
   * The state as a failure names it: `seed "1"`, or `no record`.
   */
  readonly name: string;
  /**
   * The record `begin` started under the seed, decoded from the form the host stores; none for no
   * record.
   */
  readonly record: Option.Option<ItemRecord>;
}

/**
 * The state of an item redacted with no record.
 */
export const noRecord: RecordState = { name: "no record", record: Option.none() };

/**
 * A record `begin` started under a sweep seed: the form the host stores, and the record decoded
 * from it as a host reads it back.
 */
export interface BegunRecord {
  readonly decoded: ItemRecord;
  readonly stored: StoredRecord;
}

/**
 * Begin an accepted item's record under a sweep seed, with the fixed instance
 * {@link sweepInstance}, and decode it as a host would read it back.
 *
 * @param accepted The accepted document.
 * @param seed The sweep seed.
 * @returns The stored record and its decoding, or the first failure of `begin` or of
 *   `decodeRecord`.
 */
export const begunUnder = (
  accepted: Accepted,
  seed: string,
): Result.Result<BegunRecord, EngineFailure | InvalidRecord> =>
  Result.flatMap(begin(accepted, { instance: sweepInstance, seed }), (stored) =>
    Result.map(decodeRecord(stored), (decoded): BegunRecord => ({ decoded, stored })),
  );

/**
 * Begin an accepted item's record under each of {@link sweepSeeds} ({@link begunUnder}); then add
 * {@link noRecord}.
 *
 * @param accepted The accepted document.
 * @returns A state per seed, in {@link sweepSeeds}' order, then the state with no record; or the
 *   first failure of `begin` or of `decodeRecord`.
 */
export const recordStates = (
  accepted: Accepted,
): Result.Result<readonly RecordState[], EngineFailure | InvalidRecord> =>
  Result.map(
    Result.all(
      sweepSeeds.map((seed) =>
        Result.map(begunUnder(accepted, seed), ({ decoded }): RecordState => ({
          name: `seed ${JSON.stringify(seed)}`,
          record: Option.some(decoded),
        })),
      ),
    ),
    (begun): readonly RecordState[] => [...begun, noRecord],
  );
