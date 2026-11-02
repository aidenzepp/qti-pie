import { Db, query, v } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readFileSync } from "node:fs";
import { describe, it as plainIt } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { Author } from "#qti/schema/roles.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { AncestryStep } from "#qti/schema/ancestry.ts";
import { AttributeAdmission } from "#qti/schema/attributes.ts";
import { Admission } from "#qti/schema/node.ts";
import { admission, ancestryStep, attributeAdmission } from "#qti/schema/seed/admission.ts";
import { hasLease } from "#qti/test/settings.ts";

const admissionCount = query(Author).rule((r) => {
  const { child, parent, version } = v(Admission);

  return r.match(Admission, { child, parent, version }).find({ total: r.count() });
});

const ancestryStepCount = query(Author).rule((r) => {
  const { ancestry, kind, next } = v(AncestryStep);

  return r.match(AncestryStep, { ancestry, kind, next }).find({ total: r.count() });
});

const attributeAdmissionCount = query(Author).rule((r) => {
  const { attribute, kind } = v(AttributeAdmission);

  return r.match(AttributeAdmission, { attribute, kind }).find({ total: r.count() });
});

describe.skipIf(!hasLease)("db/layer.test.ts, on the lease", () => {
  layer(AuthorAppLayer)("the author application's pool on the lease", (it) => {
    it.effect("opens the author role", () =>
      Effect.gen(function* opensTheAuthorRole() {
        const db = yield* Db.open(AuthorApp.roles.author, {});

        assert.isDefined(db);
      }),
    );

    it.effect("reads the seeded admission rows through the author role", () =>
      Effect.gen(function* readsTheSeed() {
        const db = yield* Db.open(AuthorApp.roles.author, {});
        const rows = yield* (yield* db.execute(admissionCount, {})).collect;

        assert.deepStrictEqual(
          rows.map((row) => row.total),
          [BigInt(admission.length)],
        );
      }),
    );

    it.effect("reads the seeded ancestry steps through the author role", () =>
      Effect.gen(function* readsTheAncestrySteps() {
        const db = yield* Db.open(AuthorApp.roles.author, {});
        const rows = yield* (yield* db.execute(ancestryStepCount, {})).collect;

        assert.deepStrictEqual(
          rows.map((row) => row.total),
          [BigInt(ancestryStep.length)],
        );
      }),
    );

    it.effect("reads the seeded attribute admissions through the author role", () =>
      Effect.gen(function* readsTheAttributeAdmissions() {
        const db = yield* Db.open(AuthorApp.roles.author, {});
        const rows = yield* (yield* db.execute(attributeAdmissionCount, {})).collect;

        assert.deepStrictEqual(
          rows.map((row) => row.total),
          [BigInt(attributeAdmission.length)],
        );
      }),
    );
  });
});

describe("db/layer.ts, without a database", () => {
  plainIt("reads the migrations snapshot from disk, never as a module", () => {
    const source = readFileSync(new URL("layer.ts", import.meta.url), "utf-8");

    assert.notInclude(source, "import snapshot");
    assert.notMatch(source, /^import .*snapshot\.json/mu);
  });
});
