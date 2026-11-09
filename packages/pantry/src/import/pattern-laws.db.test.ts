/**
 * Two fields of one text domain, each refused on the lease by its own pattern law: PostgreSQL the
 * judge, grizzle's outcome the name.
 *
 * `OpenElementName.local` (`NcName` of `src/qti/chardata.ts`) and `AttributeEntity.name`
 * (`EntityName` of `src/qti/attributes.ts`) spell the NCName language two ways, so grizzle types
 * both columns by one text domain. Before grizzle fd4e8b7 the second field's law was recorded
 * under a domain the plan never created, so a 23514 on its column named no law and the write failed
 * as an execution failure. Each case writes the every-relation package with one field's values
 * broken by a leading digit, which no NCName admits, so the domain refuses them as the statement
 * casts them, before any row CHECK, and the outcome names that field's law alone, which the refusal
 * names by its type's row: both types are "XML production", two laws of one class.
 */
import { Db, sameLaw } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Layer, Option } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { readProgram } from "#pantry/import/program.ts";
import { lawNameOf, schemaLawsOf } from "#pantry/import/refusal.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { NodeMember, PackageInputs } from "#pantry/import/write.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { loginSession, qtiSchema, rowsOf } from "#pantry/test/direct-sql.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * Break a name: a leading digit, which no NCName's first character is (Namespaces in XML 1.0,
 * production 4), so the domain of either field refuses it.
 *
 * @param name - The name.
 * @returns The broken name.
 */
const broken = (name: string): string => `1${name}`;

/**
 * A node and its subtree with every attribute entity reference's name broken.
 *
 * @param node - The node.
 * @returns It, its entity names broken.
 */
const withBrokenEntities = <N extends NodeMember>(node: N): N => ({
  ...node,
  attributes: node.attributes.map((attribute) => ({
    ...attribute,
    entities: attribute.entities.map((entity) => ({ ...entity, name: broken(entity.name) })),
  })),
  children: node.children.map(withBrokenEntities),
});

/**
 * Each case: the field, its table and column, the law its type's row names, and the edit that
 * breaks its every value in the package's inputs.
 */
const cases: readonly {
  readonly column: string;
  readonly edit: (inputs: PackageInputs) => PackageInputs;
  readonly field: string;
  readonly name: LawName;
  readonly relation: string;
  readonly table: string;
}[] = [
  {
    column: "local",
    edit: (inputs) => ({
      ...inputs,
      OpenElementName: new Map(
        [...inputs.OpenElementName].map(([node, row]) => [
          node,
          { ...row, local: broken(row.local) },
        ]),
      ),
    }),
    field: "local",
    name: "XML production",
    relation: "OpenElementName",
    table: "open_element_name",
  },
  {
    column: "name",
    edit: (inputs) => ({
      ...inputs,
      Node: new Map([...inputs.Node].map(([node, root]) => [node, withBrokenEntities(root)])),
    }),
    field: "name",
    name: "XML production",
    relation: "AttributeEntity",
    table: "attribute_entity",
  },
];

describe.skipIf(!hasLease)("import/pattern-laws.db.test.ts, on the lease", () => {
  layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
    excludeTestServices: true,
    timeout: authorLayerHookTimeoutMs,
  })("two fields of one text domain, judged by PostgreSQL", (it) => {
    it.effect("types OpenElementName.local and AttributeEntity.name by one text domain", () =>
      // Oracle: PostgreSQL's catalogue, the type each column casts its values to. Bound: the two
      // columns the cases below break.
      Effect.gen(function* sharedDomain() {
        const client = yield* loginSession;
        const domains = yield* Effect.all(
          cases.map(({ column, table }) =>
            rowsOf<{ readonly domain: string }>(
              client,
              `SELECT a.atttypid::pg_catalog.regtype::text AS domain FROM pg_catalog.pg_attribute a
                WHERE a.attrelid = pg_catalog.to_regclass($1) AND a.attname = $2 AND NOT a.attisdropped`,
              [`${qtiSchema}.${table}`, column],
            ).pipe(Effect.map((rows) => rows.map(({ domain }) => domain))),
          ),
        );

        assert.lengthOf(domains.flat(), cases.length, "each column is in the catalogue once");
        assert.lengthOf(Arr.dedupe(domains.flat()), 1, domains.flat().join(", "));
      }).pipe(Effect.scoped),
    );

    for (const { edit, field, name, relation } of cases) {
      it.effect(
        `refuses ${relation}.${field}, broken in every value, by its own pattern law, which the refusal names ${name}`,
        () =>
          // Oracle: PostgreSQL, the shared domain's CHECK as the statement casts each value, and
          // grizzle's pattern law (`lawsOf`), the field's law its installation lists the domain's CHECK
          // with, named by its type's row of `textLaws`. Bound: every value of the field in the
          // every-relation package, broken.
          Effect.gen(function* ownLaw() {
            const law = Arr.findFirst(
              schemaLawsOf(Qti),
              (stated) =>
                stated.kind === "pattern" && stated.relation === relation && stated.field === field,
            ).pipe(
              Option.getOrThrowWith(() => new Error(`${relation}.${field} states no pattern law`)),
            );
            const dir = yield* scopedPackage(
              everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 }),
            );
            const program = yield* readProgram(dir);
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const outcome = yield* db.apply(changeSetOf(Author, edit(program.inputs)), {});

            assert.strictEqual(outcome.kind, "invariant-rejected", Formatter.format(outcome));
            assert.isTrue(
              outcome.kind === "invariant-rejected" &&
                outcome.refused.laws.length === 1 &&
                outcome.refused.laws.every((refused) => sameLaw(refused, law)),
              Formatter.format(outcome),
            );
            assert.deepStrictEqual(lawNameOf(law), Option.some(name));
          }).pipe(Effect.scoped),
        leaseTestTimeoutMs,
      );
    }
  });
});
