import { Db, query, v } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { Author } from "#qti/schema/roles.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { Admission } from "#qti/schema/node.ts";
import { admission } from "#qti/schema/seed/admission.ts";

const admissionCount = query(Author).rule((r) => {
  const { child, parent, version } = v(Admission);

  return r.match(Admission, { child, parent, version }).find({ total: r.count() });
});

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
});
