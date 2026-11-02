/**
 * The importer's front door: a package directory in, one committed package out or one named
 * refusal.
 *
 * The package is read whole into rows in memory (manifest, then each document the manifest lists),
 * judged by the guards, and written as one `ChangeSet` applied once, so the database holds either
 * the whole package or nothing of it.
 */
import { ChangeSet, Db } from "@bjornpagen/grizzle";
import type { ApplyError, DbLayer, Fact, OpenError } from "@bjornpagen/grizzle";
import { Effect, Option, Ref, Schedule } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { externalRows } from "#qti/import/external.ts";
import { guards } from "#qti/import/guards.ts";
import { itemRows } from "#qti/import/item.ts";
import { manifestRows } from "#qti/import/manifest.ts";
import { outcomeRows } from "#qti/import/outcome.ts";
import type { ImportLaw, ImportRefused, ImportWitness } from "#qti/import/refusal.ts";
import { refusalOfLaw, ruleOfError } from "#qti/import/refusal.ts";
import { Rows, UnmodeledVocabulary, kindOf, treeRows } from "#qti/import/tree.ts";
import { usageRows } from "#qti/import/usage.ts";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Node } from "#qti/schema/node.ts";
import { Package } from "#qti/schema/package.ts";
import { Author } from "#qti/schema/roles.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The retry between attempts at the database: 50 ms doubling each time with jitter, at most five
 * retries after the first attempt.
 */
export const retrySchedule = Schedule.exponential("50 millis", 2).pipe(
  Schedule.jittered,
  Schedule.upTo({ times: 5 }),
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
 * Run `attempt` again while the database calls the failure transient, on `schedule`. A failure
 * after the last retry is the error it was; the attempts made are logged beside it.
 */
const retried = <A, E extends ApplyError | OpenError, R>(
  name: string,
  attempt: Effect.Effect<A, E, R>,
  schedule: Schedule.Schedule<unknown>,
): Effect.Effect<A, E, R> =>
  Effect.gen(function* retriedAttempt() {
    const attempts = yield* Ref.make(0);
    const counted = Effect.andThen(
      Ref.update(attempts, (n) => n + 1),
      attempt,
    );

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
 * Read the package at `dir` into rows: the manifest's, then every document it lists, each built by
 * the builder of the root element the file holds.
 *
 * The root decides the builder, and the resource's `type` is passed on whatever the root is, so a
 * root that does not belong to the type is refused at commit by the `Document` containment into
 * `RootOfType`. A root no builder names is `UnmodeledVocabulary`. The `rptemplate` root has no
 * builder yet, so its tree is read as it stands and the reader refuses its first unmodeled kind.
 */
const readRows = Effect.fn("import.readRows")(function* readRows(dir: string) {
  const entries = yield* listPackage(dir);
  const manifest = yield* readXml(yield* readEntry(dir, "imsmanifest.xml"));
  const built = yield* manifestRows(dir, entries, manifest, Rows.empty());
  let { rows } = built;

  for (const document of built.documents) {
    const doc = yield* readXml(yield* readEntry(dir, document.path));
    const input = {
      doc,
      packageId: built.packageId,
      path: document.path,
      resource: document.resource,
      resourceType: document.type,
      version: built.version,
    };
    const listed = {
      package: built.packageId,
      path: document.path,
      resource: document.resource,
      resourceType: document.type,
      version: built.version,
    };
    const root = Option.getOrUndefined(kindOf(doc.root, Option.none()));

    if (root === "qti-assessment-item") {
      ({ rows } = yield* itemRows(input, rows));
    } else if (root === "lom:lom") {
      ({ rows } = yield* externalRows(doc, listed, rows));
    } else if (root === "ud:usageData") {
      ({ rows } = yield* usageRows(doc, listed, rows));
    } else if (root === "qti-outcome-declaration") {
      ({ rows } = yield* outcomeRows(input, rows));
    } else if (root === "qti-response-processing") {
      ({ rows } = yield* treeRows(
        doc,
        {
          charset: doc.charset,
          id: crypto.randomUUID(),
          kind: "document",
          root: "rptemplate",
          version: built.version,
        },
        rows,
      ));
    } else {
      return yield* new UnmodeledVocabulary({
        kind: "element",
        name: doc.root.qname,
        parent: Option.none(),
      });
    }
  }

  yield* guards(rows, entries);

  return { packageId: built.packageId, rows };
});

/**
 * One `ChangeSet` inserting every row of `rows`, relation by relation, the package's own first.
 */
export const changeSetOf = (rows: Rows) => {
  let changes = ChangeSet.empty(Author).insert(Package, Rows.of(rows, Package));

  for (const [relation, facts] of rows) {
    if (relation !== Package && facts.length > 0) {
      // SAFETY: `Rows` holds each relation's own facts under that relation, and every relation it holds is one the author role writes, but a map keyed by `AnyRelation` cannot say so to `insert`'s per-relation write check; `Package` stands for any of them, and `insert` reads only the relation's name and the facts at run time.
      changes = changes.insert(
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
        relation as typeof Package,
        // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
        facts as readonly Fact<typeof Package>[],
      );
    }
  }

  return changes;
};

/**
 * Import the package at `dir`.
 *
 * Reads `imsmanifest.xml` and every QTI document it lists, judges the rows with the tree, manifest
 * and item guards, and applies them in one `ChangeSet` through the author role. `Db.open` and
 * `db.apply` are retried on a transient refusal and on nothing else. When the commit's outcome is
 * unknown the package row is read back by its id: present, the import was accepted; absent, the
 * error is the answer.
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
  string,
  ImportRefused | PlatformError.PlatformError | ApplyError | OpenError,
  FileSystem.FileSystem | DbLayer<typeof Author>
> {
  const schedule = options.schedule ?? retrySchedule;
  const wrap = options.wrapApply ?? (<A, E, R>(apply: Effect.Effect<A, E, R>) => apply);
  const { packageId, rows } = yield* readRows(dir).pipe(
    Effect.catchIf(isReadRefusal, (error) => Effect.fail(ruleOfError(error))),
  );
  const changes = changeSetOf(rows);
  const db = yield* retried("Db.open", Db.open(AuthorApp.roles.author, {}), schedule);
  const outcome = yield* retried("db.apply", wrap(db.apply(changes, {})), schedule).pipe(
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
    const nodeKinds = new Map(Rows.of(rows, Node).map((node) => [node.id, node.kind]));

    return yield* refusalOfLaw(
      outcome.law satisfies ImportLaw,
      outcome.witness satisfies ImportWitness,
      (id) => nodeKinds.get(id),
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
