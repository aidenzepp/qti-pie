import { ChangeSet, Db } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { AuthorAppLayer } from "#qti/smoke/layer.ts";
import { Author, AuthorApp } from "#qti/smoke/schema.ts";

const { Item, Choice } = Author.relations;

layer(AuthorAppLayer)("grizzle smoke, through the author role", (it) => {
  it.effect("writes an item with its choices and reads them back nested", () =>
    Effect.gen(function* writesAndReadsBack() {
      const db = yield* Db.open(AuthorApp.roles.author, {});
      const id = crypto.randomUUID();
      const written = ChangeSet.empty(Author)
        .insert(Item, [{ id, identifier: "capital", title: "The capital of France" }])
        .insert(Choice, [
          { identifier: "a", item: id, text: "Paris" },
          { identifier: "b", item: id, text: "Lyon" },
        ]);
      const outcome = yield* db.apply(written, {});

      assert.strictEqual(outcome.kind, "accepted");

      const rows = yield* (yield* db.workload.itemWithChoices.execute({ id })).collect;
      const choices = rows
        .flatMap((row) => row.choices)
        .toSorted((x, y) => x.identifier.localeCompare(y.identifier));

      assert.deepStrictEqual(
        rows.map(({ identifier, title }) => ({ identifier, title })),
        [{ identifier: "capital", title: "The capital of France" }],
      );
      assert.deepStrictEqual(choices, [
        { identifier: "a", text: "Paris" },
        { identifier: "b", text: "Lyon" },
      ]);
    }),
  );

  it.effect("refuses a choice whose item does not exist", () =>
    Effect.gen(function* refusesAnOrphanChoice() {
      const db = yield* Db.open(AuthorApp.roles.author, {});
      const orphan = ChangeSet.empty(Author).insert(Choice, [
        { identifier: "a", item: crypto.randomUUID(), text: "Paris" },
      ]);
      const outcome = yield* db.apply(orphan, {});

      assert.strictEqual(outcome.kind, "invariant-rejected");
    }),
  );
});
