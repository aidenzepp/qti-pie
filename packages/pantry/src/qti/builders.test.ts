/**
 * The author role's, the export queries' and the author login's builders: loading their modules
 * builds no schema, each builds its value over the `Qti` it is handed, and the same schema gives
 * the same value (GOAL "Architecture direction" 1, O1, criterion 5).
 *
 * This file never imports `#pantry/test/qti.ts` or, statically, `#pantry/qti/logins.ts`: either
 * import builds the schema when it loads.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { documentScanOf } from "#pantry/export/scan.ts";
import { authorRole } from "#pantry/qti/roles.ts";
import { qti, qtiBuilt } from "#pantry/qti/schema.ts";

describe("the author builders", () => {
  it("build nothing when their modules load", () => {
    // Oracle: criterion 5, the entry builds nothing at load. Vitest gives each test file its own
    // module graph, so only this file's imports ran before this assertion.
    assert.isFalse(qtiBuilt());
  });

  it("give the same role and scan for the same schema", () => {
    // Oracle: GOAL O1, the same options give the same value; grizzle puts a role in one login
    // only, so the role must be one value per schema.
    assert.strictEqual(authorRole(qti()), authorRole(qti()));
    assert.strictEqual(documentScanOf(qti()), documentScanOf(qti()));
  });

  it.effect("build the author login over the schema's author role", () =>
    Effect.gen(function* authorLoginOfSchema() {
      // Oracle: the installed login is `qti__author_app` over one role, the author, with two
      // workloads, the export's reads and the import's write program.
      const { authorLogin } = yield* Effect.promise(() => import("#pantry/qti/logins.ts"));
      const login = authorLogin(qti());

      assert.strictEqual(login.name, "author_app");
      assert.strictEqual(login.roles.author.role, authorRole(qti()));
      assert.strictEqual(login.workload.length, 2);
    }),
  );
});
