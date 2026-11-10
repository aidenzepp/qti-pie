/**
 * The composition of `Qti`, `Author` and `AuthorApp` against the W5 amendment's §C table, the
 * specification of which module exports which law array and which relations: each law array is in
 * the schema once, nothing else is, no relation is `mutable`, and the author role holds and writes
 * every stored relation; and the modules an install outside this package loads build no schema, and
 * this package builds its own once (`#pantry/qti/own.ts`).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import type { Statement } from "@bjornpagen/grizzle";
import { Predicate, Schema } from "effect";
import * as install from "#pantry/grammar/install.ts";
import * as attributes from "#pantry/qti/attributes.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import * as catalog from "#pantry/qti/catalog.ts";
import { catalogLaws } from "#pantry/qti/catalog.ts";
import * as chardata from "#pantry/qti/chardata.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import * as dataSsml from "#pantry/qti/data-ssml.ts";
import { dataSsmlLaws } from "#pantry/qti/data-ssml.ts";
import * as declarations from "#pantry/qti/declarations.ts";
import { declarationLaws } from "#pantry/qti/declarations.ts";
import * as expressionTypes from "#pantry/qti/expression-types.ts";
import * as expressions from "#pantry/qti/expressions.ts";
import { expressionLaws } from "#pantry/qti/expressions.ts";
import * as html from "#pantry/qti/html.ts";
import { htmlLaws } from "#pantry/qti/html.ts";
import * as identity from "#pantry/qti/identity.ts";
import { identityLaws } from "#pantry/qti/identity.ts";
import * as interactions from "#pantry/qti/interactions.ts";
import { interactionLaws } from "#pantry/qti/interactions.ts";
import * as mapping from "#pantry/qti/mapping.ts";
import { mappingLaws } from "#pantry/qti/mapping.ts";
import * as metadata from "#pantry/qti/metadata.ts";
import { metadataLaws } from "#pantry/qti/metadata.ts";
import * as node from "#pantry/qti/node.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import * as mathml from "#pantry/qti/mathml.ts";
import { mathmlLaws } from "#pantry/qti/mathml.ts";
import * as operators from "#pantry/qti/operators.ts";
import { operatorLaws } from "#pantry/qti/operators.ts";
import * as pkg from "#pantry/qti/package.ts";
import { packageLaws } from "#pantry/qti/package.ts";
import * as quotation from "#pantry/qti/quotation.ts";
import { quotationLaws } from "#pantry/qti/quotation.ts";
import { builtLawsByName, Qti } from "#pantry/qti/own.ts";
import { Author, AuthorApp, exportWork, importWork } from "#pantry/qti/own-login.ts";
import * as tests from "#pantry/qti/tests.ts";
import { testLaws } from "#pantry/qti/tests.ts";
import { moduleImports } from "#pantry/test/module-imports.ts";

/**
 * Each §C module composed so far, with the law array it exports, by the name §C gives it.
 */
const composedLaws: readonly (readonly [string, readonly Statement[]])[] = [
  ["src/qti/node.ts nodeLaws", nodeLaws],
  ["src/qti/chardata.ts chardataLaws", chardataLaws],
  ["src/qti/attributes.ts attributeLaws", attributeLaws],
  ["src/qti/package.ts packageLaws", packageLaws],
  ["src/qti/identity.ts identityLaws", identityLaws],
  ["src/qti/declarations.ts declarationLaws", declarationLaws],
  ["src/qti/tests.ts testLaws", testLaws],
  ["src/qti/mapping.ts mappingLaws", mappingLaws],
  ["src/qti/interactions.ts interactionLaws", interactionLaws],
  ["src/qti/metadata.ts metadataLaws", metadataLaws],
  ["src/qti/expressions.ts expressionLaws", expressionLaws],
  ["src/qti/html.ts htmlLaws", htmlLaws],
  ["src/qti/quotation.ts quotationLaws", quotationLaws],
  ["src/qti/operators.ts operatorLaws", operatorLaws],
  ["src/qti/mathml.ts mathmlLaws", mathmlLaws],
  ["src/qti/catalog.ts catalogLaws", catalogLaws],
  ["src/qti/data-ssml.ts dataSsmlLaws", dataSsmlLaws],
  [
    "src/qti/own.ts builtLawsByName, the policy's and the queries' built with Qti",
    builtLawsByName.flatMap((byName: Readonly<Partial<Record<string, readonly Statement[]>>>) =>
      Object.values(byName).flatMap((statements) => statements ?? []),
    ),
  ],
];

/**
 * Each §C module composed so far, as its namespace: every roster, closed relation and relation it
 * exports is one of `Qti`'s members.
 */
const composedModules = [
  ["src/grammar/install.ts", install],
  ["src/qti/node.ts", node],
  ["src/qti/chardata.ts", chardata],
  ["src/qti/attributes.ts", attributes],
  ["src/qti/package.ts", pkg],
  ["src/qti/identity.ts", identity],
  ["src/qti/declarations.ts", declarations],
  ["src/qti/tests.ts", tests],
  ["src/qti/mapping.ts", mapping],
  ["src/qti/interactions.ts", interactions],
  ["src/qti/metadata.ts", metadata],
  ["src/qti/expressions.ts", expressions],
  ["src/qti/expression-types.ts", expressionTypes],
  ["src/qti/html.ts", html],
  ["src/qti/quotation.ts", quotation],
  ["src/qti/operators.ts", operators],
  ["src/qti/mathml.ts", mathml],
  ["src/qti/catalog.ts", catalog],
  ["src/qti/data-ssml.ts", dataSsml],
] as const;

/**
 * The kinds of a schema member's value: a stored relation, a roster, a closed relation, and a
 * derived one, a query of the level of queries (`#pantry/qti/queries.ts`).
 */
const memberKinds: ReadonlySet<unknown> = new Set([
  "closed",
  "closedRelation",
  "derived",
  "relation",
]);

/**
 * The kinds of a member the author role holds no entry of: a closed relation, whose rows the role
 * reads inline, and a derived one, which a role reads through the tables its definition reads,
 * never whole (grizzle's README, "Derived tables").
 */
const unheldKinds: ReadonlySet<unknown> = new Set(["closedRelation", "derived"]);

describe("qti/schema.ts, composed", () => {
  it("holds every roster, closed relation and relation each composed module exports, under its own name", () => {
    for (const [module, exports] of composedModules) {
      for (const [name, value] of Object.entries(exports)) {
        if (Predicate.hasProperty(value, "kind") && memberKinds.has(value.kind)) {
          const member: unknown = Object.getOwnPropertyDescriptor(Qti.relations, name)?.value;

          assert.isTrue(
            Predicate.hasProperty(value, "name") && value.name === name,
            `${module} ${name}`,
          );
          assert.strictEqual(member, value, `${module} exports ${name}, which Qti does not hold`);
        }
      }
    }
  });

  it("holds each module's law array once, each statement once, and no other statement", () => {
    const seen = new Map<Statement, string>();

    for (const [module, laws] of composedLaws) {
      for (const law of laws) {
        assert.isFalse(seen.has(law), `${module} repeats a statement of ${seen.get(law)}`);
        seen.set(law, module);
      }
    }

    for (const law of Qti.statements) {
      assert.isTrue(seen.has(law), `Qti holds a statement no composed module exports: ${law.kind}`);
    }

    assert.strictEqual(Qti.statements.length, seen.size);
  });

  it("declares no relation mutable", () => {
    const statements: readonly Statement[] = Qti.statements;

    assert.deepStrictEqual(
      statements.filter((statement) => statement.kind === "mutable"),
      [],
    );
  });
});

describe("qti/roles.ts, the author role", () => {
  it("holds every stored relation and roster of Qti whole, and no closed or derived relation", () => {
    for (const [name, member] of Object.entries(Qti.relations)) {
      const entry: unknown = Object.getOwnPropertyDescriptor(Author.relations, name)?.value;

      assert.strictEqual(entry, unheldKinds.has(member.kind) ? undefined : member, name);
    }

    assert.sameMembers(
      Object.keys(Author.relations),
      Object.entries(Qti.relations).flatMap(([name, member]) =>
        unheldKinds.has(member.kind) ? [] : [name],
      ),
    );
  });

  it("writes exactly Qti's stored relations", () => {
    const stored = Object.entries(Qti.relations).flatMap(([name, member]) =>
      member.kind === "relation" ? [name] : [],
    );

    assert.sameMembers([...Author.write], stored);
  });
});

describe("qti/logins.ts, the author application", () => {
  it("opens the author role, and only it, under its unchanged name", () => {
    assert.strictEqual(AuthorApp.name, "author_app");
    assert.deepStrictEqual(Object.keys(AuthorApp.roles), ["author"]);
    assert.strictEqual(AuthorApp.roles.author.role, Author);
  });

  it("owns the export scan and the import's write program as its workload", () => {
    assert.deepStrictEqual(AuthorApp.workload, [exportWork, importWork]);
  });
});

/**
 * The source folder, every module of which is read for what it imports.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * Read the modules one module loads, each by its path under the source folder: every import,
 * re-export and dynamic import of a `#pantry/` module that is no type
 * (`#pantry/test/module-imports.ts`).
 *
 * @param module - The module's path under the source folder.
 * @returns The modules it imports.
 */
const importsOf = (module: string): readonly string[] =>
  moduleImports(readFileSync(path.join(sourceRoot, module), "utf-8")).flatMap(
    ({ form, specifier }) =>
      form !== "type" && specifier.startsWith("#pantry/")
        ? [specifier.slice("#pantry/".length)]
        : [],
  );

/**
 * Every module one module loads, itself among them, by its path under the source folder.
 *
 * @param entry - The module's path under the source folder.
 * @returns The modules it loads.
 */
const loadedBy = (entry: string): ReadonlySet<string> => {
  const loaded = new Set<string>();
  const pending = [entry];
  for (let module = pending.pop(); module !== undefined; module = pending.pop()) {
    if (!loaded.has(module)) {
      loaded.add(module);
      pending.push(...importsOf(module));
    }
  }

  return loaded;
};

/**
 * A `package.json` as this test reads it: its `exports` map, each subpath to its target.
 */
const ManifestSchema = Schema.fromJsonString(
  Schema.Struct({ exports: Schema.Record(Schema.String, Schema.String) }),
);

/**
 * The modules this package exports to an install outside it, by their paths under the source
 * folder, as its `package.json` `exports` map lists them.
 */
const exportedModules: readonly string[] = Object.values(
  Schema.decodeUnknownSync(ManifestSchema)(
    readFileSync(path.join(sourceRoot, "..", "package.json"), "utf-8"),
  ).exports,
).flatMap((target) => (target.startsWith("./src/") ? [target.slice("./src/".length)] : []));

/**
 * The modules of the source folder that call a builder, but the tests, the test support and the
 * builder's own module.
 *
 * @param builder - A call of the builder.
 * @param own - The builder's own module, by its path under the source folder.
 * @returns The callers, by their paths under the source folder.
 */
const callers = (builder: RegExp, own: string): readonly string[] =>
  readdirSync(sourceRoot, { recursive: true, withFileTypes: true }).flatMap((entry) => {
    const module = path.relative(sourceRoot, path.join(entry.parentPath, entry.name));

    return entry.isFile() &&
      module.endsWith(".ts") &&
      !module.endsWith(".test.ts") &&
      !module.startsWith("test/") &&
      module !== own &&
      builder.test(readFileSync(path.join(sourceRoot, module), "utf-8"))
      ? [module]
      : [];
  });

describe("qti/own.ts and qti/own-login.ts, this package's own install", () => {
  it("is loaded by no module an install outside this package loads, so loading one builds no schema", () => {
    // Bound: every module the exports map lists, and every module each loads.
    assert.isNotEmpty(exportedModules);
    for (const module of exportedModules) {
      const loaded = loadedBy(module);

      assert.isFalse(loaded.has("qti/own.ts"), `${module} loads qti/own.ts`);
      assert.isFalse(loaded.has("qti/own-login.ts"), `${module} loads qti/own-login.ts`);
    }
  });

  it("builds the schema this process opens, and its login, once: no other module of the package builds one", () => {
    // Bound: every module of the source folder but the tests, the test support and the builders'
    // own modules, read for a call of each builder.
    assert.deepStrictEqual(callers(/\bqti(?:LevelsOf|Schema)\(/u, "qti/schema.ts"), ["qti/own.ts"]);
    assert.deepStrictEqual(callers(/\bauthorAppOf\(/u, "qti/logins.ts"), ["qti/own-login.ts"]);
  });
});
