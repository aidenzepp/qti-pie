/**
 * The dev playground's view of the corpus: the verdict of every member of the document set, each
 * opened once and kept, and the listing's grouping of them.
 *
 * The cache holds one verdict per member of `corpusDocuments`, so what it keeps is bounded by the
 * corpus. A member is opened the first time something asks for its verdict and kept for the
 * cache's life; a failed open is not kept, so the next request opens that member again. The
 * playground reads its cache as the {@link Verdicts} service, which its handler's runtime builds
 * once, from {@link Verdicts.layer} unless the handler is given another Layer.
 *
 * @module
 */
import { Context, Duration, Effect, Exit, Layer } from "effect";
import type { Config, Option } from "effect";
import type { CorpusFileUnreadable, CorpusMissing } from "#plate/document/corpus.ts";
import { corpusDocuments, readCorpusFile } from "#plate/document/corpus.ts";
import { open } from "#plate/validate/open.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * A verdict `open` gives, by name.
 */
export type VerdictName = Verdict["verdict"];

/**
 * The verdicts the listing groups by, in the order it shows them.
 */
export const verdictOrder = [
  "accepted",
  "accepted-with-unsupported",
  "unchecked",
  "refused",
] as const satisfies readonly VerdictName[];

/**
 * The failure of a listing or an open: the corpus root is missing, a member or a directory cannot
 * be read, or neither `PLATE_CORPUS_DIR` nor `HOME` is set.
 */
export type OpenFailure = Config.ConfigError | CorpusFileUnreadable | CorpusMissing;

/**
 * Open one member of the document set and give its verdict.
 */
export type Opener = (member: string) => Effect.Effect<Verdict, OpenFailure>;

/**
 * Open one member of the document set: read it with `readCorpusFile`, then judge it with `open`.
 *
 * @param member The member's corpus path.
 * @returns Its verdict.
 */
export const openMember: Opener = Effect.fn("listing.openMember")(function* openMember(
  member: string,
): Effect.fn.Return<Verdict, OpenFailure> {
  return yield* open(member, yield* readCorpusFile(member));
});

/**
 * The verdicts of the document set's members, each member opened at most once while its open
 * succeeds.
 */
export interface VerdictCache {
  /**
   * One member's verdict, opening that member alone the first time it is asked for; none when the
   * path is not a member.
   *
   * @param member The corpus path a request names.
   */
  readonly verdictOf: (member: string) => Effect.Effect<Option.Option<Verdict>, OpenFailure>;
  /**
   * Every member's verdict, in the document set's order, opening each member not opened yet, at
   * most 8 at once.
   */
  readonly verdicts: Effect.Effect<readonly Verdict[], OpenFailure>;
}

/**
 * Keep an effect's result for the cache's life when it succeeds, and none of a failure. The
 * playground's caches keep their entries by it.
 *
 * @param effect The effect.
 * @returns The effect that runs it once while it succeeds.
 */
export const keptOnSuccess = <A, E>(
  effect: Effect.Effect<A, E>,
): Effect.Effect<Effect.Effect<A, E>> =>
  Effect.cachedWithTTL(effect, (exit) => (Exit.isSuccess(exit) ? Duration.infinity : 0));

/**
 * Construct a verdict cache over the document set.
 *
 * The set is listed the first time a verdict is asked for, and each member is opened through the
 * opener the first time its verdict is asked for. The opener is called only then, once per
 * member while its opens succeed, so a test can count the opens through it. Concurrent requests
 * share an open in flight.
 *
 * @param opener How a member is opened; {@link openMember} when absent.
 * @returns The cache.
 */
export const verdictCache = (opener: Opener = openMember): Effect.Effect<VerdictCache> =>
  corpusDocuments.pipe(
    Effect.flatMap((members) =>
      Effect.all(
        members.map((member) =>
          keptOnSuccess(Effect.suspend(() => opener(member))).pipe(
            Effect.map((verdict) => [member, verdict] as const),
          ),
        ),
      ),
    ),
    Effect.map((entries) => new Map(entries)),
    keptOnSuccess,
    Effect.map((table): VerdictCache => ({
      verdictOf: (member) =>
        table.pipe(
          Effect.flatMap((members) => {
            const verdict = members.get(member);

            return verdict === undefined ? Effect.succeedNone : Effect.asSome(verdict);
          }),
        ),
      verdicts: table.pipe(
        Effect.flatMap((members) => Effect.all([...members.values()], { concurrency: 8 })),
      ),
    })),
  );

/**
 * The playground's verdict cache as a service: the handler's runtime builds it once, and every
 * request the handler answers reads the same cache.
 *
 * A test shares one cache between handlers by providing it with `Layer.succeed(Verdicts, cache)`,
 * and counts its opens through the opener it built the cache with.
 */
export class Verdicts extends Context.Service<Verdicts, VerdictCache>()(
  "@qti-pie/plate/dev/listing/Verdicts",
) {
  /**
   * A new verdict cache over {@link openMember}. Building it reads nothing: the corpus root is read
   * under the config provider of the first request that asks for a verdict.
   */
  static readonly layer: Layer.Layer<Verdicts> = Layer.effect(Verdicts, verdictCache());
}

/**
 * The members of one top folder of the corpus root, in the document set's order.
 */
export interface FolderGroup {
  /**
   * The folder's name, the first segment of each member's path; `.` for members at the root.
   */
  readonly folder: string;
  readonly members: readonly string[];
}

/**
 * The members of one verdict, grouped by top folder.
 */
export interface VerdictGroup {
  /**
   * How many members have the verdict.
   */
  readonly count: number;
  /**
   * Each top folder that holds a member with the verdict, in the order the set first reaches it.
   */
  readonly folders: readonly FolderGroup[];
  readonly verdict: VerdictName;
}

/**
 * Give the top folder of a corpus path: its first segment, or `.` when it names a file at the
 * root.
 *
 * @param member The corpus path.
 * @returns The folder.
 */
const topFolder = (member: string): string => {
  const slash = member.indexOf("/");

  return slash === -1 ? "." : member.slice(0, slash);
};

/**
 * Group verdicts for the listing: by verdict, in {@link verdictOrder}, then by top folder.
 *
 * Every verdict has a group, an empty one when no member has it. Members keep the order they are
 * given in, which is the document set's.
 *
 * @param verdicts Each member's corpus path and verdict.
 * @returns The four groups.
 */
export const groupVerdicts = (
  verdicts: readonly Pick<Verdict, "document" | "verdict">[],
): readonly VerdictGroup[] =>
  verdictOrder.map((name): VerdictGroup => {
    const members = verdicts
      .filter(({ verdict }) => verdict === name)
      .map(({ document }) => document);

    return {
      count: members.length,
      folders: Array.from(Map.groupBy(members, topFolder), ([folder, grouped]) => ({
        folder,
        members: grouped,
      })),
      verdict: name,
    };
  });
