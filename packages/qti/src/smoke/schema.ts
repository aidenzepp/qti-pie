import {
  contained,
  login,
  on,
  query,
  relation,
  role,
  schema,
  str,
  uuid,
  v,
  workload,
} from "@bjornpagen/grizzle";

/**
 * A throwaway two-table schema that proves the toolchain end to end: grizzle compiles it, `grizzle
 * generate` drafts its migration, `grizzle migrate` installs it on the local cluster, and the smoke
 * test writes and reads through a role. It is not part of the QTI model and is deleted once real
 * schemas replace it.
 */
const Identifier = str.regex("^[A-Za-z_][A-Za-z0-9_.-]{0,63}$");

const Text = str.regex("^.{1,200}$", "su");

export const Item = relation("Item", { id: uuid, identifier: Identifier, title: Text }, ["id"]);

export const Choice = relation("Choice", { identifier: Identifier, item: uuid, text: Text }, [
  "item",
  "identifier",
]);

export const Smoke = schema("QtiSmoke", { Choice, Item }, [
  contained(on(Choice, "item"), on(Item, "id")),
]);

export const Author = role(Smoke, "author", { Choice, Item }, { write: ["Item", "Choice"] });

const { Item: AuthorItem, Choice: AuthorChoice } = Author.relations;

/**
 * One item by id, with its choices nested inside it.
 */
export const itemWithChoices = query(Author)
  .rule((r) => {
    const { id, identifier, title } = v(AuthorItem);

    return r
      .match(AuthorItem, { id, identifier, title })
      .where(r.eq(id, r.param("id", uuid)))
      .find({ id, identifier, title });
  })
  .attach(
    "choices",
    (item) =>
      query(Author).rule((r) => {
        const { identifier, text } = v(AuthorChoice);

        return r
          .match(AuthorChoice, { identifier, item: item.id, text })
          .find({ identifier, text });
      }),
    "array",
  );

export const authorReads = workload(Author, { itemWithChoices });

export const AuthorApp = login(Smoke, "author_app", [Author], { workload: [authorReads] });
