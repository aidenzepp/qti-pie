import path from "node:path";
import { Db, query, uuid, v } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option, Ref, Schema } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#qti/db/layer.ts";
import { importPackage } from "#qti/import/package.ts";
import type { Rule } from "#qti/import/refusal.ts";
import { Document } from "#qti/schema/document.ts";
import { FileContent, Package } from "#qti/schema/package.ts";
import { AuthorApp } from "#qti/schema/logins.ts";
import { AttributeLexical, Node, NodeKind } from "#qti/schema/node.ts";
import { Author } from "#qti/schema/roles.ts";
import { materialize, materializePackage, materializeZip } from "#qti/test/fixtures.ts";
import type { FixtureName } from "#qti/test/fixtures.ts";
import { hasLease, leaseTestTimeoutMs } from "#qti/test/settings.ts";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/u;

/**
 * The directory the scratch files of this suite are made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The packaging fixtures whose import is accepted whole, the spec's 4.12 positives.
 */
const positives = [
  "lomrest",
  "csm",
  "filelom",
  "nestedqmd",
  "extmeta",
  "variant",
  "variant-padded",
  "usage3",
  "usage3-typed",
  "usage3-padded",
  "outcome",
  "lti301",
  "lti300",
  "bytes",
] as const satisfies readonly FixtureName[];

/**
 * The XML-path negatives of the spec's 4.12 to 4.14: each a hand-broken copy of a positive that
 * `importPackage` refuses, with the rules the refusal may name (one, or two where the spec lets a
 * bin 1 rule refuse first). The manifest-side rows come first, then the usage, outcome, LTI and
 * bytes rows.
 */
const negatives = [
  ["lomrest-two-titles", ["lom-title-single"]],
  ["lomrest-two-purposes", ["lom-capacity"]],
  ["lomrest-two-kinds", ["lom-capacity"]],
  ["lomrest-exam", ["lom-learning-resource-type"]],
  ["lomrest-self-assessment", ["lom-learning-resource-type"]],
  ["csm-no-labelled-guid", ["csm-capacity"]],
  ["csm-no-guid", ["csm-capacity"]],
  ["csm-two-sets", ["csm-capacity"]],
  ["csm-two-guids", ["csm-single"]],
  ["filelom-qmd", ["admission", "qti-metadata-host"]],
  ["filelom-two-metadata", ["file-metadata-single"]],
  ["nestedqmd-both", ["qti-metadata-single"]],
  ["extmeta-item-root", ["resource-root"]],
  ["extmeta-two-resources", ["document-key"]],
  ["extmeta-item-href", ["href-listed"]],
  ["extmeta-hrefless", ["record-unnamed"]],
  ["variant-301", ["admission"]],
  ["variant-self-ref", ["variant-target"]],
  ["variant-no-resource", ["variant-target"]],
  ["variant-id-clash", ["manifest-id-holder"]],
  ["variant-tactile", ["drd-value"]],
  ["variant-bad-uri", ["uri-syntax"]],
  ["variant-two-atinteroperable", ["drd-single"]],
  ["variant-two-complexity", ["drd-single"]],
  ["variant-no-metadata", ["variant-metadata"]],
  ["variant-before-file", ["ordering"]],
  ["usage3-no-target", ["usage-count"]],
  ["usage3-no-map-entry", ["usage-count"]],
  ["usage3-two-values", ["usage-key"]],
  ["usage3-ordinary-mapping", ["admission"]],
  ["usage3-bad-month", ["usage-lexical"]],
  ["usage3-feb-30", ["calendar"]],
  ["usage3-bad-context", ["uri-syntax"]],
  ["outcome-title", ["unmodeled-vocabulary"]],
  ["lti300-as-301", ["resource-type"]],
  ["bytes-webcontent-item", ["root-type-reverse"]],
  ["resproc-webcontent", ["root-type-reverse"]],
] as const satisfies readonly (readonly [FixtureName, readonly string[]])[];

/**
 * The negatives whose refusal is a contract law of a typed value. grizzle reports a contract law by
 * the contract's name, so each law names its own contract and `ruleOfLaw` maps it to the spec's
 * rule: the typed value arms to `usage-typed-value` and `Statistic.name` to `usage-lexical`. Each
 * row pairs a fixture with the contract its law must name and the rule that contract maps to.
 */
const contractNegatives = [
  ["usage3-integer-float", "UsageIntegerValue", "usage-typed-value"],
  ["usage3-float-padded", "UsageFloatValue", "usage-typed-value"],
  ["usage3-bad-name", "StatisticName", "usage-lexical"],
] as const satisfies readonly (readonly [FixtureName, string, Rule])[];

/**
 * How many times `nestedqmd-manifest-lom` is imported. The manifest-level `qmd:qtiMetadata` is the
 * only witness of its refusal, so every import names the same rule; twelve imports show it is no
 * longer any one of several witnesses.
 */
const repeatedImports = 12;

const isContractLaw = Schema.is(
  Schema.Struct({ contract: Schema.String, kind: Schema.Literal("contract") }),
);

const documentsOf = query(Author).rule((r) => {
  const { id } = v(Document);

  return r.match(Document, { id, package: r.param("package", uuid) }).find({ id });
});

const lexicalsOf = query(Author).rule((r) => {
  const { attribute, kind, node, value } = v(AttributeLexical);

  return r
    .match(Node, { id: node, tree: r.param("tree", uuid) })
    .match(AttributeLexical, { attribute, kind, node, value })
    .find({ attribute, kind, node, value });
});

const documentRootsOf = query(Author).rule((r) => {
  const { id, resource, root } = v(Document);

  return r
    .match(Document, { id, package: r.param("package", uuid), resource, root })
    .find({ id, resource, root });
});

const filePathsOf = query(Author).rule((r) => {
  const { path: file } = v(FileContent);

  return r
    .match(FileContent, { package: r.param("package", uuid), path: file })
    .find({ path: file });
});

const packagesCounted = query(Author).rule((r) => {
  const { id } = v(Package);

  return r.match(Package, { id }).find({ total: r.count() });
});

const nodesOf = query(Author).rule((r) => {
  const { id } = v(Node);

  return r.match(Node, { id, tree: r.param("tree", uuid) }).find({ total: r.count() });
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
 * The `AttributeLexical` rows of every tree of a package, read back by a query over the relation.
 */
const lexicalsOfPackage = (packageId: string) =>
  Effect.gen(function* lexicalsOfTrees() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    const found = [];

    for (const tree of yield* treesOf(packageId)) {
      found.push(...(yield* (yield* db.execute(lexicalsOf, { tree })).collect));
    }

    return found;
  });

/**
 * How many nodes a package's trees hold in all, read back by a query over `Node`.
 */
const nodeTotalOf = (packageId: string) =>
  Effect.gen(function* nodeTotalOfPackage() {
    const db = yield* Db.open(AuthorApp.roles.author, {});
    let total = 0n;

    for (const tree of yield* treesOf(packageId)) {
      for (const row of yield* (yield* db.execute(nodesOf, { tree })).collect) {
        total += row.total;
      }
    }

    return total;
  });

/**
 * The part of an accepted apply outcome this suite reads: the rows added to each relation.
 */
const AppliedCounts = Schema.Struct({
  counts: Schema.Array(Schema.Struct({ added: Schema.BigInt, relation: Schema.String })),
});

/**
 * The rows an accepted apply added, by relation, as the strings the report keeps.
 */
const countsOf = ({ counts }: typeof AppliedCounts.Type): Record<string, string> =>
  Object.fromEntries(counts.map((count) => [count.relation, String(count.added)]));

const decodeCounts = Schema.decodeUnknownOption(AppliedCounts);

/**
 * Import a package and keep the row count the engine reports for each relation of the apply.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The package id and the rows added, by relation name.
 */
const importCounting = (dir: string) =>
  Effect.gen(function* importCountingRows() {
    const counts = yield* Ref.make<Record<string, string>>({});
    const id = yield* importPackage(dir, {
      wrapApply: (apply) =>
        Effect.tap(apply, (outcome) =>
          Option.match(decodeCounts(outcome), {
            onNone: () => Effect.void,
            onSome: (decoded) => Ref.set(counts, countsOf(decoded)),
          }),
        ),
    });

    return { counts: yield* Ref.get(counts), id };
  });

describe.skipIf(!hasLease)(
  "import/package.packaging.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: "120 seconds",
    })("importPackage of the packaging fixtures on the lease", (it) => {
      for (const name of positives) {
        it.effect(`accepts ${name} as one package`, () =>
          Effect.gen(function* acceptsPositive() {
            const { counts, id } = yield* importCounting(yield* materialize(name));

            assert.match(id, uuidPattern);
            assert.isAbove(Object.keys(counts).length, 0, `${name}: the apply reported no counts`);
          }),
        );
      }

      it.effect("variant-padded keeps its padded identifier in one AttributeLexical row", () =>
        Effect.gen(function* variantPadded() {
          const { id } = yield* importCounting(yield* materialize("variant-padded"));
          const rows = yield* lexicalsOfPackage(id);
          const found = rows.filter((row) => row.kind === "cpx:variant");

          assert.deepStrictEqual(
            found.map((row) => [row.attribute, row.value]),
            [["identifier", " v1 "]],
          );
        }),
      );

      it.effect("usage3-padded keeps the statistic's name and the map entry's key", () =>
        Effect.gen(function* usagePadded() {
          const { id } = yield* importCounting(yield* materialize("usage3-padded"));
          const rows = yield* lexicalsOfPackage(id);
          const found = rows.filter((row) => row.kind.startsWith("ud:"));

          assert.deepStrictEqual(found.map((row) => `${row.attribute}=${row.value}`).toSorted(), [
            "mapKey=a\tb",
            "name= AIS ",
          ]);
          assert.strictEqual(found.length, rows.length, "no other attribute keeps a lexical form");
        }),
      );

      it.effect("records the apply's row counts for usage3, the largest of the packages", () =>
        Effect.gen(function* usageCounts() {
          const fs = yield* FileSystem.FileSystem;
          const { counts } = yield* importCounting(yield* materialize("usage3"));

          yield* fs.makeDirectory(`${workDirectory}/import`, { recursive: true });
          yield* fs.writeFileString(
            `${workDirectory}/import/usage3.counts.json`,
            `${JSON.stringify(counts, undefined, 2)}\n`,
          );
          yield* Effect.log("usage3 apply counts", counts);
        }),
      );

      it.effect("simple imported from its zip and from its directory yields the same rows", () =>
        Effect.gen(function* sameRows() {
          const fromZip = yield* importCounting(yield* materializeZip("simple"));
          const fromDirectory = yield* importCounting(yield* materialize("simple"));

          assert.notStrictEqual(fromZip.id, fromDirectory.id);
          assert.deepStrictEqual(fromZip.counts, fromDirectory.counts);
          assert.strictEqual(yield* nodeTotalOf(fromZip.id), yield* nodeTotalOf(fromDirectory.id));
        }),
      );

      for (const [name, rules] of negatives) {
        it.effect(`refuses ${name} naming ${rules.join(" or ")}`, () =>
          Effect.gen(function* refusesNegative() {
            const refused = yield* Effect.flip(importPackage(yield* materialize(name)));

            assert.strictEqual(refused._tag, "ImportRefused", `${name}: refused by another error`);

            const rule = refused._tag === "ImportRefused" ? refused.rule : refused._tag;

            yield* Effect.log(`negative ${name} refused by rule`, rule);

            assert.include(rules, rule, `${name}: the refusal named another rule`);
          }),
        );
      }

      it.effect("refuses nestedqmd-manifest-lom naming qti-metadata-host on every import", () =>
        Effect.gen(function* refusesNestedQmd() {
          for (let attempt = 0; attempt < repeatedImports; attempt += 1) {
            const refused = yield* Effect.flip(
              importPackage(yield* materialize("nestedqmd-manifest-lom")),
            );
            const rule = refused._tag === "ImportRefused" ? refused.rule : refused._tag;

            yield* Effect.log("nestedqmd-manifest-lom refused by rule", rule);

            assert.strictEqual(rule, "qti-metadata-host");
          }
        }),
      );

      for (const [name, contract, rule] of contractNegatives) {
        it.effect(`refuses ${name} naming ${rule} under the contract ${contract}`, () =>
          Effect.gen(function* refusesContract() {
            const refused = yield* Effect.flip(importPackage(yield* materialize(name)));

            assert.strictEqual(refused._tag, "ImportRefused", `${name}: refused by another error`);

            if (refused._tag !== "ImportRefused") {
              return;
            }

            yield* Effect.log(`${name} refused by rule`, refused.rule);

            assert.strictEqual(refused.rule, rule);
            assert.isTrue(isContractLaw(refused.law), `${name}: the law is no contract law`);
            assert.strictEqual(
              isContractLaw(refused.law) ? refused.law.contract : undefined,
              contract,
              `${name}: the contract law names another contract`,
            );
          }),
        );
      }

      it.effect("refuses the published usageData package naming not-qti3", () =>
        Effect.gen(function* refusesUsageData() {
          const refused = yield* Effect.flip(importPackage(yield* materializePackage("usageData")));
          const rule = refused._tag === "ImportRefused" ? refused.rule : refused._tag;

          yield* Effect.log("usageData refused by rule", rule);

          assert.strictEqual(rule, "not-qti3");
        }),
      );

      it.effect(
        "resproc is refused as unmodeled vocabulary or imported as an rptemplate document",
        () =>
          Effect.gen(function* resprocEitherWay() {
            const db = yield* Db.open(AuthorApp.roles.author, {});
            const totalBefore = (yield* (yield* db.execute(packagesCounted, {})).collect)[0]?.total;
            const outcome = yield* Effect.result(importPackage(yield* materialize("resproc")));

            if (outcome._tag === "Failure") {
              const refused = outcome.failure;

              assert.strictEqual(refused._tag, "ImportRefused", "refused by another error");

              const { detail, rule } =
                refused._tag === "ImportRefused" ? refused : { detail: "", rule: refused._tag };
              const element = /^element (?<name>qti-[^ ]+) /u.exec(detail)?.groups?.["name"];

              yield* Effect.log("resproc refused", { detail, rule });

              assert.strictEqual(rule, "unmodeled-vocabulary");
              assert.isDefined(element, `the detail names no ASI element: ${detail}`);
              assert.isFalse(
                NodeKind.handles.some((handle) => handle === element),
                `${element} is a modeled kind, so it is not unmodeled`,
              );
              assert.strictEqual(
                (yield* (yield* db.execute(packagesCounted, {})).collect)[0]?.total,
                totalBefore,
                "a refused package stored a Package row",
              );

              return;
            }

            yield* Effect.log("resproc accepted");

            const documents = yield* (yield* db.execute(documentRootsOf, {
              package: outcome.success,
            })).collect;
            const files = yield* (yield* db.execute(filePathsOf, { package: outcome.success }))
              .collect;

            assert.deepStrictEqual(
              documents.filter((row) => row.resource === "rp1").map((row) => row.root),
              ["rptemplate"],
            );
            assert.isFalse(
              files.some((row) => row.path === "rp/match_correct.xml"),
              "the rptemplate document's href has a FileContent row",
            );
          }),
      );
    });
  },
);
