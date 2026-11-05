/**
 * The corpus sweeps' shared support: every corpus member opened once per test file, and the HTML of
 * an accepted item's three render states.
 *
 * Test support, outside the core: nothing under `src/index.ts`'s closure imports it
 * (`src/boundary.test.ts`). It reads the corpus through `corpusDocuments` and `readCorpusFile`, so
 * a test points it elsewhere with `PLATE_CORPUS_DIR` through `ConfigProvider.fromUnknown`.
 *
 * @module
 */
import type { Config } from "effect";
import { Effect, Exit, Option, Result } from "effect";
import { corpusDocuments, readCorpusFile } from "#plate/document/corpus.ts";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { open, redact, render } from "#plate/index.ts";
import type {
  Accepted,
  Configuration,
  InvalidInstance,
  Options,
  PartSwapRefused,
  UnknownPart,
  Verdict,
} from "#plate/index.ts";
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
 * @returns The three states with their HTML, or the first `render` error.
 */
export const threeStates = (
  accepted: Accepted,
  configuration: Configuration,
): Result.Result<readonly RenderState[], InvalidInstance | PartSwapRefused | UnknownPart> => {
  const redacted = redact(accepted);
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
