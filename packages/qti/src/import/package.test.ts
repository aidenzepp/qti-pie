import { CommitUnknown, Db, query, TransientFailure, uuid, v } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Ref, Result, Schedule, Schema } from "effect";
import { describe, inject } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { importPackage } from "#qti/import/package.ts";
import { ImportRefused, isMappedLaw } from "#qti/import/refusal.ts";
import type { ImportLaw, Rule } from "#qti/import/refusal.ts";
import { Document } from "#qti/schema/document.ts";
import { AttributeLexical, Node, TreeExportCharset } from "#qti/schema/node.ts";
import { Package } from "#qti/schema/package.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Author } from "#qti/schema/roles.ts";
import { materialize } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

const fixtures = inject("fixtures");

/**
 * The package ids a document's trees are, beside the manifest's tree, which is the package id.
 */
const documentsOf = query(Author).rule((r) => {
  const { id } = v(Document);

  return r.match(Document, { id, package: r.param("package", uuid) }).find({ id });
});

const charsetsOf = query(Author).rule((r) => {
  const { label } = v(TreeExportCharset);

  return r.match(TreeExportCharset, { label, tree: r.param("tree", uuid) }).find({ label });
});

const lexicalsOf = query(Author).rule((r) => {
  const { attribute, node } = v(AttributeLexical);

  return r
    .match(Node, { id: node, tree: r.param("tree", uuid) })
    .match(AttributeLexical, { attribute, node })
    .find({ attribute, node });
});

const packageRows = query(Author).rule((r) => {
  const { id } = v(Package);

  return r
    .match(Package, { id })
    .where(r.eq(id, r.param("id", uuid)))
    .find({ id });
});

/**
 * Every tree an imported package holds: the manifest's, whose id is the package id, and its
 * documents'.
 */
const treesOf = (packageId: string) =>
  Effect.gen(function* treesOfPackage() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const documents = yield* (yield* db.execute(documentsOf, { package: packageId })).collect;

    return [packageId, ...documents.map((row) => row.id)];
  });

/**
 * The export charsets of every tree of a package, by label.
 */
const charsetsOfPackage = (packageId: string) =>
  Effect.gen(function* charsetsOfTrees() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const trees = yield* treesOf(packageId);
    const found = yield* Effect.all(
      trees.map((tree) =>
        Effect.flatMap(db.execute(charsetsOf, { tree }), (result) => result.collect),
      ),
    );

    return found.flat().map((row) => row.label);
  });

/**
 * The `AttributeLexical` rows of every tree of a package.
 */
const lexicalsOfPackage = (packageId: string) =>
  Effect.gen(function* lexicalsOfTrees() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const trees = yield* treesOf(packageId);
    const found = yield* Effect.all(
      trees.map((tree) =>
        Effect.flatMap(db.execute(lexicalsOf, { tree }), (result) => result.collect),
      ),
    );

    return found.flat();
  });

/**
 * The refusal an import fails with, or a test failure when it is accepted or fails otherwise.
 * A law that fell to the nearest rule is logged as a finding.
 */
const refusalOf = (dir: string, label: string) =>
  Effect.gen(function* refusalOfImport() {
    const result = yield* Effect.result(importPackage(dir));
    if (Result.isSuccess(result)) {
      return assert.fail(`${label} was accepted as package ${result.success}`);
    }

    const refusal = result.failure;
    if (!(refusal instanceof ImportRefused)) {
      return assert.fail(`${label} failed with something other than a refusal: ${refusal.message}`);
    }

    // SAFETY: the importer keeps the engine's law verbatim, a value of the structural mirror.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    const law = refusal.law as ImportLaw | undefined;
    if (law !== undefined && !isMappedLaw(law)) {
      yield* Effect.logWarning(
        `FINDING ${label}: law not mapped, filed under ${refusal.rule}: ${refusal.detail}`,
        law,
      );
    }

    return refusal;
  });

const refused = (dir: string, label: string, rules: readonly Rule[]) =>
  Effect.gen(function* refusedUnder() {
    const refusal = yield* refusalOf(dir, label);

    assert.include(rules, refusal.rule, `${label}: ${refusal.message}`);
  });

const accepted = (dir: string) =>
  Effect.gen(function* acceptedImport() {
    const id = yield* importPackage(dir);

    assert.match(id, uuidPattern);

    return id;
  });

const fixture = (name: FixtureName) => materialize(name);

/**
 * Grizzle exports a `TransientFailure`'s reason and server report as types only, so the failure a
 * serializable transaction meets is built by decoding its fields.
 */
const serializationFailure = Schema.decodeUnknownSync(TransientFailure)({
  _tag: "TransientFailure",
  error: {
    _tag: "ServerError",
    column: undefined,
    constraint: undefined,
    dataType: undefined,
    detail: undefined,
    hint: undefined,
    message: "could not serialize access due to concurrent update",
    schema: undefined,
    sqlstate: "40001",
    table: undefined,
  },
  reason: { _tag: "SerializationFailure" },
});

/**
 * Retries with no wait, so a test of the retry logic does not sleep.
 */
const quickly = Schedule.recurs(2);

describe.skipIf(!hasLease)(
  "import/package.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "60 seconds",
    })("importPackage on the lease", (it) => {
      it.effect("accepts simple and returns the package's id", () =>
        Effect.gen(function* acceptsSimple() {
          const id = yield* accepted(fixtures.simple);
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const rows = yield* (yield* db.execute(packageRows, { id })).collect;

          assert.strictEqual(rows.length, 1);
        }),
      );

      it.effect("refuses metaData under a LOM rule", () =>
        refused(fixtures.metaData, "metaData", ["lom-identifier", "lom-title"]),
      );

      it.effect("refuses identifier-mismatch under lom-identifier", () =>
        Effect.gen(function* identifierMismatch() {
          yield* refused(yield* fixture("identifier-mismatch"), "identifier-mismatch", [
            "lom-identifier",
          ]);
        }),
      );

      it.effect("refuses title-mismatch under lom-title", () =>
        Effect.gen(function* titleMismatch() {
          yield* refused(yield* fixture("title-mismatch"), "title-mismatch", ["lom-title"]);
        }),
      );

      it.effect("refuses lti under resource-type", () =>
        refused(fixtures.lti, "lti", ["resource-type"]),
      );

      it.effect("refuses CAT_Test01_Adaptive_EchoAdapt under not-qti3", () =>
        refused(fixtures.CAT_Test01_Adaptive_EchoAdapt, "CAT_Test01_Adaptive_EchoAdapt", [
          "not-qti3",
        ]),
      );

      it.effect("refuses sample_pci under not-qti3", () =>
        refused(fixtures.sample_pci, "sample_pci", ["not-qti3"]),
      );

      const broken: readonly (readonly [FixtureName, readonly Rule[]])[] = [
        ["undeclared-response", ["binding-declared"]],
        ["choice-in-prompt", ["admission", "choice-parent"]],
        ["two-values-single", ["value-single"]],
        ["bad-identifier-value", ["value-lexical"]],
        ["padded-identifier-value", ["value-lexical"]],
        ["choice-bounds", ["choice-bounds"]],
        ["body-empty", ["body-empty"]],
        ["bad-template-uri", ["uri-syntax"]],
      ];
      for (const [name, rules] of broken) {
        it.effect(`refuses ${name} under ${rules.join(" or ")}`, () =>
          Effect.gen(function* refusesBroken() {
            yield* refused(yield* fixture(name), name, rules);
          }),
        );
      }

      const clean: readonly FixtureName[] = [
        "doctype",
        "latin1",
        "external",
        "utf16",
        "comment-in-element",
      ];
      for (const name of clean) {
        it.effect(`accepts ${name}`, () =>
          Effect.gen(function* acceptsClean() {
            yield* accepted(yield* fixture(name));
          }),
        );
      }

      it.effect("accepts windows-1252 with a TreeExportCharset row", () =>
        Effect.gen(function* windows1252() {
          const id = yield* accepted(yield* fixture("windows-1252"));
          const labels = yield* charsetsOfPackage(id);

          assert.strictEqual(labels.length, 1);
        }),
      );

      it.effect("accepts padded-attributes with eight AttributeLexical rows", () =>
        Effect.gen(function* paddedAttributes() {
          const id = yield* accepted(yield* fixture("padded-attributes"));
          const rows = yield* lexicalsOfPackage(id);

          assert.strictEqual(rows.length, 8);
        }),
      );

      it.effect("accepts padded-text with no AttributeLexical rows", () =>
        Effect.gen(function* paddedText() {
          const id = yield* accepted(yield* fixture("padded-text"));
          const rows = yield* lexicalsOfPackage(id);

          assert.strictEqual(rows.length, 0);
        }),
      );

      it.effect("retries one injected TransientFailure and then accepts", () =>
        Effect.gen(function* retriesTransient() {
          const attempts = yield* Ref.make(0);
          const id = yield* importPackage(fixtures.simple, {
            schedule: quickly,
            wrapApply: <A, E, R>(apply: Effect.Effect<A, E, R>) =>
              Effect.flatMap(
                Ref.getAndUpdate(attempts, (n) => n + 1),
                (n): Effect.Effect<A, E | TransientFailure, R> =>
                  n === 0 ? Effect.fail(serializationFailure) : apply,
              ),
          });

          assert.match(id, uuidPattern);
          assert.isAtLeast(yield* Ref.get(attempts), 2);
        }),
      );

      it.effect("fails with the TransientFailure itself after the last retry", () =>
        Effect.gen(function* givesUp() {
          const attempts = yield* Ref.make(0);
          const result = yield* Effect.result(
            importPackage(fixtures.simple, {
              schedule: quickly,
              wrapApply: () =>
                Effect.andThen(
                  Ref.update(attempts, (n) => n + 1),
                  Effect.fail(serializationFailure),
                ),
            }),
          );

          assert.isTrue(Result.isFailure(result));
          assert.strictEqual(
            Result.isFailure(result) ? result.failure : undefined,
            serializationFailure,
          );
          assert.strictEqual(yield* Ref.get(attempts), 3);
        }),
      );

      it.effect("reads the package back when the commit's outcome is unknown", () =>
        Effect.gen(function* readsBack() {
          const id = yield* importPackage(fixtures.simple, {
            wrapApply: (apply) => Effect.andThen(apply, Effect.fail(new CommitUnknown())),
          });
          const db = yield* Db.open(AuthorApp.roles.author, {});
          const rows = yield* (yield* db.execute(packageRows, { id })).collect;

          assert.strictEqual(rows.length, 1);
        }),
      );

      it.effect("fails with CommitUnknown when the package is not there", () =>
        Effect.gen(function* notThere() {
          const result = yield* Effect.result(
            importPackage(fixtures.simple, {
              wrapApply: () => Effect.fail(new CommitUnknown()),
            }),
          );

          assert.isTrue(Result.isFailure(result) && result.failure._tag === "CommitUnknown");
        }),
      );
    });
  },
);
