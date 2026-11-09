/**
 * The `Qti` schema: its stored level, `QtiBase` (`#pantry/qti/base.ts`), every roster, closed
 * relation and stored relation with the laws over them, and over it the level that names the
 * queries its rules read, with those rules (`#pantry/qti/queries.ts`). The two levels are one
 * installation, under the stored level's name: grizzle installs each level in a PostgreSQL schema
 * of its own, the stored level's holding every table, and judges a rule over a query by deferred
 * triggers on the tables below it (README, "Levels").
 *
 * Every reader of the schema, the author role, its login and the importer among them, reads `Qti`,
 * the top level, so a refusal by a rule over a query is its own law, never a law of a level above.
 */
import { schema } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { CdnPolicy } from "#pantry/db/install.ts";
import { installedPolicy } from "#pantry/db/install.ts";
import { QtiBase, qtiBaseOf } from "#pantry/qti/base.ts";
import { cdnLawsByName } from "#pantry/qti/cdn.ts";
import { queryLaws, queryRelations } from "#pantry/qti/queries.ts";

/**
 * A type, or `never` where it is `any`: only `any` meets `1 & S` at `0`.
 */
type Typed<S> = 0 extends 1 & S ? never : S;

/**
 * A list of statements, or `never` where the list or its statement type is `any`. A list of rules
 * typed `any` would type every statement of `Qti` `any`, and with them every nested member's count
 * (`#pantry/qti/queries.ts` `QueryStatement`), so the rules over queries are held to it, and an
 * `any` there fails the typecheck here.
 */
type TypedStatements<L extends readonly unknown[]> = Typed<L> & readonly Typed<L[number]>[];

/**
 * Build the QTI 3.0 schema over a stored level: the level `QtiQueries`, holding every query and
 * every rule over one.
 *
 * Each query is defined over this package's own stored level (`#pantry/qti/queries.ts`), and holds
 * over a policy's as well: a definition reads relations by name, and every stored level holds the
 * same relations, a policy adding only row checks.
 *
 * @param base - The stored level, built for an install's policy or none.
 * @returns The schema.
 */
const qtiOf = (base: typeof QtiBase) =>
  schema.extend(
    base,
    "QtiQueries",
    queryRelations,
    queryLaws satisfies TypedStatements<typeof queryLaws>,
  );

/**
 * The QTI 3.0 schema of this package's own install: no policy, so its statements are exactly the
 * modules' and the committed migrations install it.
 */
const ownQti = qtiOf(QtiBase);

/**
 * The QTI 3.0 schema built for each origin so far, by origin.
 */
const builtSchemas = new Map<string, typeof ownQti>();

/**
 * Build the QTI 3.0 schema for an install's policy, or none for this package's own install: every
 * module's relations and laws, the policy's single-CDN laws (`#pantry/qti/cdn.ts`) on the stored
 * level, and the queries and their rules over it.
 *
 * One schema value stands for each policy, built at its first call, so an install outside this
 * package that composes `Qti` for a policy holds the very value this package's runtime opens with
 * that policy, and its statements are the ones the importer names refusals by.
 *
 * @param policy - The install's policy, none for this package's own install.
 * @returns The schema.
 */
export const qtiSchema = (policy: Option.Option<CdnPolicy>): typeof ownQti =>
  Option.match(policy, {
    onNone: () => ownQti,
    onSome: ({ cdn }) => {
      const known = builtSchemas.get(cdn);
      if (known !== undefined) {
        return known;
      }

      const built = qtiOf(qtiBaseOf(Object.values(cdnLawsByName(policy)).flat()));
      builtSchemas.set(cdn, built);

      return built;
    },
  });

/**
 * The QTI 3.0 schema this process opens: built for the policy of the install `GR8DES_QTI_INSTALL`
 * names (`#pantry/db/install.ts`), and this package's own where it names none.
 */
export const Qti = qtiSchema(installedPolicy);
