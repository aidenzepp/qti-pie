/**
 * The `Qti` schema's builder, {@link qti}: its stored level, `QtiBase` (`#pantry/qti/base.ts`),
 * every roster, closed relation and stored relation with the laws over them, and over it the level
 * that names the queries its rules read, with those rules (`#pantry/qti/queries.ts`). The two
 * levels are one installation, under the stored level's name: grizzle installs each level in a
 * PostgreSQL schema of its own, the stored level's holding every table, and judges a rule over a
 * query by deferred triggers on the tables below it (README, "Levels").
 *
 * Every reader of the schema, the author role, its login and the importer among them, reads the top
 * level, so a refusal by a rule over a query is its own law, never a law of a level above.
 *
 * Loading this module builds no schema and reads no environment: the first call of {@link qti}
 * builds both levels once, and every later call returns them.
 */
import { schema } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { qtiBaseOf } from "#pantry/qti/base.ts";
import { queriesOf } from "#pantry/qti/queries.ts";

/**
 * Build the QTI 3.0 schema's levels: the stored level with every module's relations and laws; over
 * it the level `QtiQueries`, every query and every rule over one, each defined over that stored
 * level; and the groups of the queries' statements by the law each states, which the schema's own
 * naming of its laws reads (`#pantry/test/law-namer.ts` `namedLaws`, the source of the committed
 * law-name dictionary), since it knows a statement by its identity.
 *
 * @returns The stored level (`base`), the schema (`qti`) and the groups of the statements built
 *   with it (`lawsByName`).
 */
const buildLevels = () => {
  const base = qtiBaseOf();
  const queries = queriesOf(base);

  return {
    base,
    lawsByName: queries.lawsByName,
    qti: schema.extend(base, "QtiQueries", queries.relations, queries.laws),
  };
};

/**
 * The QTI 3.0 schema's levels, as {@link qtiLevels} returns them.
 */
type QtiLevels = ReturnType<typeof buildLevels>;

/**
 * The composed QTI 3.0 schema, as {@link qti} returns it: the top level, which the author role, its
 * login and the export's reads are built over.
 */
export type QtiSchema = QtiLevels["qti"];

/**
 * The options {@link qti} builds the schema with. Phase 1 holds none: every call gives the one
 * schema.
 */
export type QtiOptions = Readonly<Record<never, never>>;

/**
 * The levels {@link qtiLevels} built on its first call, or nothing before it.
 */
let built: Option.Option<QtiLevels> = Option.none();

/**
 * Build the QTI 3.0 schema's levels on the first call and return that one value on every call, so
 * loading this module composes nothing and {@link qti} returns the top level of this one build.
 *
 * It exists for the test fixture (`#pantry/test/qti.ts`) and the schema's naming of its laws
 * (`#pantry/test/law-namer.ts`), which read the stored level and the statements' groups. It is
 * never exported from the package entry.
 *
 * @returns The stored level (`base`), the schema (`qti`) and the groups of the queries' statements
 *   by the law each states (`lawsByName`).
 */
export const qtiLevels = (): QtiLevels => {
  if (Option.isSome(built)) {
    return built.value;
  }

  const levels = buildLevels();
  built = Option.some(levels);

  return levels;
};

/**
 * Build the QTI 3.0 schema on the first call and return that one value on every call, so loading
 * this module composes nothing and a caller pays for the composition only when it asks. The value
 * is the top level of {@link qtiLevels}' one build.
 *
 * @param _options - The schema's options, empty in phase 1: every call returns the same schema.
 * @returns The composed `Qti` schema.
 */
export const qti = (_options: QtiOptions = {}): QtiSchema => qtiLevels().qti;

/**
 * Decide whether {@link qti} has built the schema yet: a probe for the tests that hold loading a
 * module to composing nothing. It is never exported from the package entry.
 *
 * @returns Whether the schema has been built.
 */
export const qtiBuilt = (): boolean => Option.isSome(built);
