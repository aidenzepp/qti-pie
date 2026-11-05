/**
 * The importer's front door: a package directory in, one committed package out or one named
 * refusal.
 *
 * The package is read whole into rows in memory (manifest, then each document the manifest lists),
 * judged by the guards, and written by the author workload's import program applied once, so the
 * database holds either the whole package or nothing of it.
 */
import { Db } from "@bjornpagen/grizzle";
import type { ApplyError, DbLayer, OpenError, Uuid } from "@bjornpagen/grizzle";
import { Clock, Duration, Effect, Option, Random, Ref, Schedule } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { externalRows } from "#pantry/import/external.ts";
import { guards } from "#pantry/import/guards.ts";
import { itemRows } from "#pantry/import/item.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { outcomeRows } from "#pantry/import/outcome.ts";
import { importParameters } from "#pantry/import/program.ts";
import type { ImportLaw, ImportRefused, ImportWitness } from "#pantry/import/refusal.ts";
import { refusalOfLaw, ruleOfError } from "#pantry/import/refusal.ts";
import { rptemplateRows } from "#pantry/import/rptemplate.ts";
import { Rows, UnmodeledVocabulary, kindOf } from "#pantry/import/tree.ts";
import { usageRows } from "#pantry/import/usage.ts";
import { listPackage, readEntry } from "#pantry/package/read.ts";
import { ResourceLomGeneral } from "#pantry/schema/lang.ts";
import { AuthorApp } from "#pantry/schema/logins.ts";
import type { RootKindHandle, SchemaVersionHandle } from "#pantry/schema/node.ts";
import { Package } from "#pantry/schema/package.ts";
import type { Author } from "#pantry/schema/roles.ts";
import { rootOfType } from "#pantry/schema/seed/root-of-type.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * The longest the retries of one database call run, in total.
 */
const retryBound = Duration.seconds(30);

/**
 * The longest one wait between attempts lasts, before jitter.
 */
const retryDelayCap = Duration.seconds(1);

/**
 * The retry between attempts at the database, bounded by elapsed time and not by count.
 *
 * A serialization failure never depends on the call's inputs, and under contention PostgreSQL
 * expects many attempts, so a count says nothing about how long the contention lasts. The wait
 * starts at 50 ms and doubles, is capped at one second so the retries keep sampling while the
 * burst thins out, and is then drawn uniformly from zero to that wait, so attempts that collided do
 * not retry together. The retries stop at the first attempt that ends after thirty seconds, and
 * that attempt's failure is the call's.
 */
export const retrySchedule = Schedule.exponential("50 millis", 2).pipe(
  Schedule.modifyDelay(
    Effect.fnUntraced(function* jitters({ duration }) {
      const random = yield* Random.next;

      return Duration.times(Duration.min(duration, retryDelayCap), random);
    }),
  ),
  Schedule.upTo({ duration: retryBound }),
);

/**
 * What a caller may replace in {@link importPackage}: how the database calls are retried and what
 * runs in place of the apply, so a test can inject a failure the cluster will not raise on demand.
 */
export interface ImportOptions {
  /**
   * Wraps each attempt of the apply, in place of running it as is. Defaults to running it.
   */
  readonly wrapApply?: <A, E, R>(
    apply: Effect.Effect<A, E, R>,
  ) => Effect.Effect<A, E | ApplyError, R>;
  /**
   * The schedule of the retries of `Db.open` and `db.apply`. Defaults to {@link retrySchedule}.
   */
  readonly schedule?: Schedule.Schedule<unknown>;
}

/**
 * Whether the database refused an attempt for a reason outside the call's inputs, so the same call
 * may succeed again: grizzle's `TransientFailure`, or an `OpenError` whose admission was refused by
 * `SERIALIZABLE`. Nothing else is retried.
 */
const isTransient = (error: ApplyError | OpenError): boolean =>
  error._tag === "TransientFailure" ||
  (error._tag === "OpenError" && error.reason._tag === "AdmissionTransient");

/**
 * Run `attempt` again while the database calls the failure transient, on `schedule`. Each retry
 * logs the attempt it follows, the time since the first attempt and the failure's tag, so a run
 * shows how often it retried; a failure after the last retry is the error it was, logged with the
 * attempts made.
 */
const retried = <A, E extends ApplyError | OpenError, R>(
  name: string,
  attempt: Effect.Effect<A, E, R>,
  schedule: Schedule.Schedule<unknown>,
): Effect.Effect<A, E, R> =>
  Effect.gen(function* retriedAttempt() {
    const attempts = yield* Ref.make(0);
    const started = yield* Clock.currentTimeMillis;
    const logTransient = Effect.fnUntraced(function* logsRetry(failure: E) {
      if (!isTransient(failure)) {
        return;
      }

      const n = yield* Ref.get(attempts);
      const now = yield* Clock.currentTimeMillis;

      yield* Effect.logWarning(`${name} attempt ${n} failed transiently`).pipe(
        Effect.annotateLogs({ attempt: n, elapsedMillis: now - started, errorTag: failure._tag }),
      );
    });
    const counted = Effect.andThen(
      Ref.update(attempts, (n) => n + 1),
      attempt,
    ).pipe(Effect.tapError(logTransient));

    return yield* counted.pipe(
      Effect.retry({ schedule, while: isTransient }),
      Effect.tapError(() =>
        Effect.flatMap(Ref.get(attempts), (n) =>
          Effect.logError(`${name} failed after ${n} attempt${n === 1 ? "" : "s"}`),
        ),
      ),
    );
  });

/**
 * Whether `error` is one the guards or the reader raised, as opposed to the platform's.
 *
 * It narrows whatever union reaches it, so a refusal a later slice adds to {@link ruleOfError}'s
 * parameter flows to {@link ruleOfError} with no edit here.
 */
const isReadRefusal = <E extends { readonly _tag: string }>(
  error: E,
): error is Exclude<E, PlatformError.PlatformError> => error._tag !== "PlatformError";

/**
 * The root kind a resource type lists its documents under, none for a type `RootOfType` does not
 * hold.
 */
const rootKindOfType = (type: string): RootKindHandle | undefined =>
  rootOfType.find((entry) => entry.type === type)?.root;

/**
 * What {@link documentRows} needs to know about one listed document.
 */
export interface DocumentInput {
  readonly doc: XmlDocument;
  readonly packageId: Uuid;
  readonly path: string;
  readonly resource: string;
  /**
   * Whether the manifest's LOM record for this resource has a `general` category, as the manifest
   * pass found it.
   */
  readonly resourceLomHasGeneral: boolean;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Write the rows of one document the manifest lists, by the root kind its resource type maps to in
 * `RootOfType` for the `rptemplate` family, and by the root element the file holds for every other
 * document.
 *
 * First, a resource type whose root kind is `rptemplate` goes to {@link rptemplateRows}, never by
 * the type string, so a new `rptemplate` type reaches it with no edit here; a
 * `qti-response-processing` root listed under any other type has no element route and is
 * `UnmodeledVocabulary`. Then the root element decides: `qti-assessment-item` goes to `itemRows`,
 * `qti-outcome-declaration` to `outcomeRows`, `lom:lom` to `externalRows`, and `ud:usageData` to
 * `usageRows`. A root no builder names is `UnmodeledVocabulary`, except in a `qtiusagedata/xml`
 * file, which goes to `usageRows` so that a root outside QTI 3 usage data is `NotQti3`. A root that
 * does not belong to its type is refused at commit by the `Document` containment into
 * `RootOfType`.
 *
 * @param input - The decoded document and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with the document's added.
 */
export const documentRows = Effect.fn("import.documentRows")(function* documentRows(
  input: DocumentInput,
  rows: Rows,
) {
  if (rootKindOfType(input.resourceType) === "rptemplate") {
    return yield* rptemplateRows(input, rows);
  }

  const { doc } = input;
  const listed = {
    package: input.packageId,
    path: input.path,
    resource: input.resource,
    resourceType: input.resourceType,
    version: input.version,
  };
  const root = Option.getOrUndefined(kindOf(doc.root, Option.none()));

  if (root === "qti-assessment-item") {
    return yield* itemRows(input, rows);
  }

  if (root === "lom:lom") {
    return yield* externalRows(doc, listed, rows);
  }

  if (
    root === "ud:usageData" ||
    (root === undefined && input.resourceType === "qtiusagedata/xml")
  ) {
    return yield* usageRows(doc, listed, rows);
  }

  if (root === "qti-outcome-declaration") {
    return yield* outcomeRows(input, rows);
  }

  return yield* new UnmodeledVocabulary({
    kind: "element",
    name: doc.root.qname,
    parent: Option.none(),
  });
});

/**
 * Read the package at `dir` into rows and judge them, without the database: the manifest's, then
 * every document it lists, each built by {@link documentRows}, then the tree, manifest, item,
 * content, processing and usage guards.
 */
export const readRows = Effect.fn("import.readRows")(function* readRows(dir: string) {
  const entries = yield* listPackage(dir);
  const manifest = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
  const built = yield* manifestRows(dir, entries, manifest, Rows.empty());
  let { rows } = built;

  for (const document of built.documents) {
    const doc = yield* readXml(yield* readEntry(dir, document.path));
    const item = yield* documentRows(
      {
        doc,
        packageId: built.packageId,
        path: document.path,
        resource: document.resource,
        resourceLomHasGeneral: Rows.of(built.rows, ResourceLomGeneral).some(
          (general) => general.resource === document.resource,
        ),
        resourceType: document.type,
        version: built.version,
      },
      rows,
    );
    ({ rows } = item);
  }

  yield* guards(rows, entries);

  return { packageId: built.packageId, rows };
});

/**
 * The database of the author role, as `Db.open` opens it with the author application's workload.
 */
type AuthorDb = Effect.Success<ReturnType<typeof openAuthor>>;

/**
 * Open the database of the author role.
 */
const openAuthor = () => Db.open(AuthorApp.roles.author, {});

/**
 * Apply the import program to `rows` through `db`: every relation's facts, the package's own
 * among them, in one transaction.
 *
 * @param db - An opened database of the author role.
 * @param rows - The rows an import built.
 * @returns The program's outcome, as `apply` answers it.
 */
export const applyRows = (db: AuthorDb, rows: Rows) =>
  db.workload.importRows.apply(
    // SAFETY: the program's static type states only its `Package` parameter (`#pantry/import/program.ts`); every other relation's parameter is its own name, which `importParameters` fills with that relation's facts.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    importParameters(rows) as Parameters<AuthorDb["workload"]["importRows"]["apply"]>[0],
  );

/**
 * Import the package at `dir`.
 *
 * Reads `imsmanifest.xml` and every QTI document it lists, judges the rows with the tree, manifest,
 * item, content, processing and usage guards, and applies them with the author workload's import
 * program. `Db.open` and `db.apply` are retried on a transient refusal and on nothing else.
 * When the commit's outcome is unknown the package row is read back by its id: present, the import
 * was accepted; absent, the error is the answer.
 *
 * @param dir - The package directory.
 * @param options - Replacements for the retry schedule and the apply step, for tests.
 * @returns The id of the committed package. Fails with `ImportRefused` naming the rule the package
 *   broke, whether a guard, the reader or the database refused it; with the platform's error when
 *   the directory cannot be read; and with grizzle's own error when the database failed for a
 *   reason that is not a refusal.
 */
export const importPackage = Effect.fn("import.importPackage")(function* importPackage(
  dir: string,
  options: ImportOptions = {},
): Effect.fn.Return<
  Uuid,
  ImportRefused | PlatformError.PlatformError | ApplyError | OpenError,
  FileSystem.FileSystem | DbLayer<typeof Author>
> {
  const schedule = options.schedule ?? retrySchedule;
  const wrap = options.wrapApply ?? (<A, E, R>(apply: Effect.Effect<A, E, R>) => apply);
  const { packageId, rows } = yield* readRows(dir).pipe(
    Effect.catchIf(isReadRefusal, (error) => Effect.fail(ruleOfError(error))),
  );
  const db = yield* retried("Db.open", openAuthor(), schedule);
  const outcome = yield* retried("db.apply", wrap(applyRows(db, rows)), schedule).pipe(
    Effect.catchTag("CommitUnknown", (unknown) =>
      Effect.gen(function* readBack() {
        const found = yield* db
          .get(Package, { id: packageId })
          .pipe(Effect.orElseSucceed(Option.none));

        return Option.isSome(found) ? { kind: "committed" as const } : yield* unknown;
      }),
    ),
  );

  if (outcome.kind === "invariant-rejected") {
    return yield* refusalOfLaw(
      outcome.law satisfies ImportLaw,
      outcome.witness satisfies ImportWitness,
    );
  }

  if (outcome.kind === "accepted" || outcome.kind === "committed") {
    if (outcome.kind === "accepted") {
      yield* Effect.logDebug(
        "import applied",
        Object.fromEntries(outcome.counts.map((c) => [c.relation, String(c.added)])),
      );
    }

    return packageId;
  }

  return yield* Effect.die(
    new Error(
      `The apply of package ${packageId} answered ${outcome.kind}, which a first insert of a new package never does.`,
    ),
  );
});
