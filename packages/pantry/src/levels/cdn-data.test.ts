/**
 * The single-CDN level's data rule (`#pantry/levels/cdn-data.ts`):
 *
 * - **Its laws**, with no database: the `Cdn` level states a `CdnData` check over each of the rule's
 *   derived relations (the admitted `xs:anyURI` attributes, the address lists, the `xs:anyURI`
 *   texts), and every law it adds is a check over a relation of its own, so it states no law of
 *   `Qti` that `Qti` does not.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Cdn` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`, so the
 *   rule's checks are known to compile however `lawsOf` reads them.
 * - **Its two patterns** read a `data:` address exactly as the URL Standard's parser reads its scheme
 *   (Node's `URL`), over #55's value pieces.
 * - **A kept entity reference hides a value from them** (decision 488): `Qti` admits an address list
 *   and a URI text that keep an entity reference the document never declares, which a player that
 *   reads the external DTD expands, so the level refuses every judged value that keeps one.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Formatter } from "effect";
import { ValueDomainOf } from "#pantry/grammar/install.ts";
import { cdnDataRule, dataScheme, dataToken } from "#pantry/levels/cdn-data.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { asi, breachesOf, judged, shown, withItem } from "#pantry/test/probe.ts";
import { Qti } from "#pantry/test/qti.ts";
import { xsiNamespace as xsi } from "#pantry/vocab/namespaces.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * The origin the tests build the level for.
 */
const origin = "https://cdn.example.com/";

/**
 * The address a player resolves a relative one against: a document of a package on another host.
 */
const base = "https://player.example.test/package/items/item.xml";

/**
 * Whether an address uses the `data:` scheme, as the URL Standard's parser reads its scheme.
 *
 * @param address - The address as written.
 * @returns Whether it parses with the scheme `data`.
 */
const isData = (address: string): boolean =>
  URL.canParse(address, base) && new URL(address, base).protocol === "data:";

/**
 * The pieces #55's search built values from (`src/qti/cdn.test.ts`, CDN data): the scheme in
 * several cases and with a tab or newline inside, near misses, whitespace, a C0 control, a
 * relative path and another host.
 */
const pieces = [
  "data:",
  "DaTa:",
  "da\nta:",
  "d\tata:",
  "data :",
  "dat",
  "a:",
  "x",
  " ",
  "\t",
  "\u0001",
  "image.png",
  "https://elsewhere.example.test/",
] as const;

/**
 * Every value one piece longer than one of the given values.
 *
 * @param shorter - The values to extend.
 * @returns Each followed by each piece.
 */
const extended = (shorter: readonly string[]): readonly string[] =>
  shorter.flatMap((prefix) => pieces.map((piece) => `${prefix}${piece}`));

/**
 * Every value of one piece.
 */
const one = extended([""]);

/**
 * Every value of two pieces.
 */
const two = extended(one);

/**
 * Every value of at most three pieces, the empty value included.
 */
const values: readonly string[] = ["", ...one, ...two, ...extended(two)];

/**
 * The derived relations the data rule judges, sorted: the three sets of values, and the entity
 * references kept in a URI text (decision 488).
 */
const dataRelations = [
  "CdnDataAddressList",
  "CdnDataUriAttribute",
  "CdnDataUriText",
  "CdnDataUriTextEntity",
] as const;

/**
 * The package directory, where grizzle is run from and where the committed migrations live.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * The folder the installation's configuration is written to, made and removed by its test.
 */
const configDirectory = path.join(packageDirectory, "work", "cdn-data-compile");

/**
 * The laws a level states that a lower level does not.
 *
 * @param laws - The level's laws.
 * @param lower - The lower level's laws.
 * @returns The laws only the level states, in its order.
 */
const addedLaws = (laws: readonly Law[], lower: readonly Law[]): readonly Law[] =>
  laws.filter((law) => !lower.some((held) => sameLaw(held, law)));

/**
 * The relations a schema's `CdnData` checks read.
 *
 * @param laws - The schema's laws.
 * @returns The relations of its `CdnData` checks, sorted.
 */
const cdnDataRelations = (laws: readonly Law[]): readonly string[] =>
  laws
    .flatMap((law) => (law.kind === "check" && law.name === "CdnData" ? [law.relation] : []))
    .toSorted();

/**
 * The configuration of an installation whose top level is the `Cdn` level over `Qti`, with the
 * author's login and the committed migrations, as `grizzle.config.ts` configures `Qti`.
 */
const configText = `import { defineConfig } from "@bjornpagen/grizzle";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import { Effect } from "effect";
import { migrationConnection } from "#pantry/db/connection.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { qti } from "#pantry/qti/schema.ts";

export default defineConfig({
  connection: await Effect.runPromise(
    migrationConnection.pipe(Effect.provide(NodeFileSystem.layer)),
  ),
  logins: [authorLogin(qti())],
  migrations: ${JSON.stringify(path.join(packageDirectory, "migrations"))},
  schemas: [singleCdn(qti(), { origin: ${JSON.stringify(origin)} })],
});
`;

/**
 * Write the installation's configuration into its own folder, removing the folder when the scope
 * closes.
 *
 * @returns The configuration file's path.
 */
const writtenConfig = Effect.acquireRelease(
  Effect.tryPromise(async () => {
    await mkdir(configDirectory, { recursive: true });
    const file = path.join(configDirectory, "grizzle.config.ts");
    await writeFile(file, configText);

    return file;
  }),
  () => Effect.promise(() => rm(configDirectory, { force: true, recursive: true })),
);

/**
 * Run `pnpm exec grizzle check <config>` in the package directory and collect how it ended.
 * grizzle prints its findings on standard error, so both streams are read together.
 *
 * @param config - The configuration file's path.
 * @returns The exit code, and everything the process wrote.
 */
const grizzleCheck = (config: string) =>
  Effect.callback<{ readonly code: number | null; readonly output: string }, Error>((resume) => {
    const child = spawn("pnpm", ["exec", "grizzle", "check", config], {
      cwd: packageDirectory,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    child.on("error", (error) => {
      resume(Effect.fail(error));
    });
    child.on("close", (code) => {
      resume(Effect.succeed({ code, output: Buffer.concat(chunks).toString("utf-8") }));
    });

    return Effect.sync(() => {
      child.kill();
    });
  });

describe("cdnDataRule", () => {
  it(
    "states CdnData over each of the level's own derived relations, and no law over a Qti relation",
    () => {
      // Oracle: spec U12 and the pa1-16 brief: CDN data as derived relations over `Qti` (the
      // admitted `xs:anyURI` attributes, the address lists, the `xs:anyURI` texts), each with a
      // check named `CdnData`, declared at the `Cdn` level; GOAL G4, a level only adds laws.
      const level = singleCdn(Qti, { origin });
      const baseLaws = lawsOf(Qti);
      const levelLaws = lawsOf(level);
      const added = addedLaws(levelLaws, baseLaws);
      // A level's record holds every relation of every level of it; a live derived relation is no
      // whole entry (`wholeEntriesOf`), so the record is what names the level's own.
      const baseNames = new Set(Object.keys(Qti.relations));
      const ownNames = new Set(Object.keys(level.relations).filter((name) => !baseNames.has(name)));

      assert.deepStrictEqual(cdnDataRelations(added), [...dataRelations]);
      assert.deepStrictEqual(cdnDataRelations(baseLaws), []);
      assert.deepStrictEqual(addedLaws(baseLaws, levelLaws), [], "a Qti law the level drops");
      for (const law of added) {
        assert.isTrue(
          law.kind === "check" && ownNames.has(law.relation),
          `${Formatter.format(law)} is a law the level states over no relation of its own`,
        );
      }
    },
    // How long reading the level's laws may take: `lawsOf` compiles `Qti`'s law model and the
    // level's. Its measurement is owed (`exempt` of `src/test/timeouts.test.ts`).
    600_000,
  );

  it.effect(
    "grizzle check compiles an installation holding the Cdn level: no statement of it does not compile",
    () =>
      Effect.scoped(
        Effect.gen(function* compiles() {
          const config = yield* writtenConfig;
          const { code, output } = yield* grizzleCheck(config);
          const lines = output.split("\n");

          // Oracle: grizzle's `compileSchema` and program compilation, as `grizzle check` runs
          // them over the installation. Drift against the committed snapshot passes, as in
          // `src/test/compile.test.ts`. Bound: the one installation; residual none.
          assert.isTrue(
            code === 0 || code === 1,
            `grizzle check exited ${String(code)}:\n${output}`,
          );
          assert.isTrue(
            lines.some((line) => line.startsWith("Cdn: ")),
            `grizzle check printed no Cdn line:\n${output}`,
          );
          assert.deepStrictEqual(
            lines.filter((line) => line.includes("does not compile")),
            [],
          );
        }),
      ),
    // How long grizzle's check of the installation may take: it compiles every statement of `Qti`
    // and of the level, and every program of the author's login. Its measurement is owed (`exempt`
    // of `src/test/timeouts.test.ts`).
    360_000,
  );
});

describe("an entity reference in a judged value", () => {
  it.effect(
    "Qti admits an address list holding an undeclared entity reference, which the data pattern does not read",
    () =>
      Effect.gen(function* hidden() {
        // Oracle: XML 1.0 §4.1 and §5.1 (a reference to an entity declared in the external DTD is
        // kept unexpanded by a non-validating reader, and expanded by one that reads the DTD), and
        // pantry's law oracle for `Qti`. A reader that expands `&payload;` to a `data:` address
        // reads a `data:` token, so the level cannot judge the value by its pattern (decision 488).
        const opening = `<qti-assessment-item xmlns="${asi}"`;
        const located = `${opening} xmlns:xsi="${xsi}" xsi:schemaLocation="${asi} &payload;"`;
        const files = withItem(opening, located);
        const judgment = yield* judged({
          ...files,
          "item.xml": `<!DOCTYPE qti-assessment-item SYSTEM "qti.dtd">\n${files["item.xml"]}`,
        });
        const breaches = breachesOf(judgment);
        const xml = yield* Effect.orDie(
          readXml(
            new TextEncoder().encode(
              `<!DOCTYPE a SYSTEM "qti.dtd"><a xmlns:xsi="${xsi}" xsi:schemaLocation="${asi} &payload;"/>`,
            ),
          ),
        );
        const pattern = new RegExp(dataToken, "u");

        assert.deepStrictEqual(breaches, [], shown(breaches));
        assert.isTrue(
          xml.root.attributes.some(({ references }) => references.length > 0),
          "the reader keeps the reference unexpanded",
        );
        assert.isFalse(pattern.test(`${asi} &payload;`));
        assert.isTrue(pattern.test(`${asi} data:text/xml,payload`));
      }),
  );

  it("refuses an attribute that keeps an entity reference: each attribute relation carries its count", () => {
    // Oracle: decision 488 and the case above. Evidence without a database: the patterns admit the
    // kept form, so each check must judge the row's count of kept references, which each relation
    // of attributes then carries.
    const { relations } = cdnDataRule(Qti, origin);

    for (const relation of [relations.CdnDataUriAttribute, relations.CdnDataAddressList]) {
      assert.include(
        Object.keys(relation.heading),
        "entities",
        `${relation.name} judges no count of kept entity references`,
      );
    }
  });

  it.effect(
    "a URI text keeps an entity reference as a child its xs:anyURI domain admits, which the data pattern does not read",
    () =>
      Effect.gen(function* keptInText() {
        // Oracle: XML 1.0 section 4.4 (a reference in content to an entity the external subset
        // may declare, kept by a reader that never reads it), and `Qti`'s TextDomain, which judges
        // an `xs:anyURI` text's string value, the kept `&payload;` included, by the domain's
        // pattern. A string value cannot tell the kept reference from text, so the level selects
        // the `entityRef` child itself (decision 488).
        const xml = yield* Effect.orDie(
          readXml(
            new TextEncoder().encode(
              `<!DOCTYPE drd:hasAdaptation SYSTEM "drd.dtd"><drd:hasAdaptation xmlns:drd="urn:x">&payload;</drd:hasAdaptation>`,
            ),
          ),
        );
        const uri = ValueDomainOf.rows.find(({ domain }) => domain === "xs:anyURI");

        assert.isTrue(
          xml.root.children.some((child) => child.kind === "entityRef"),
          "the reader keeps the reference as a child",
        );
        assert.isTrue(new RegExp(uri?.pattern ?? "(?!)", "u").test("&payload;"));
        assert.isFalse(new RegExp(dataScheme, "u").test("&payload;"));
      }),
  );
});

describe("dataScheme", () => {
  it("matches a value exactly where the URL Standard reads its scheme as data", () => {
    // Oracle: the URL Standard's scheme state, through Node's `URL` (#55's CDN data oracle).
    const pattern = new RegExp(dataScheme, "u");
    const disagreeing = values.filter((value) => pattern.test(value) !== isData(value));

    assert.deepStrictEqual(disagreeing, []);
    assert.isTrue(values.some((value) => pattern.test(value)));
  });
});

describe("dataToken", () => {
  it("matches an address list exactly where one of its whitespace-separated tokens is a data address", () => {
    // Oracle: XML Schema 1.0 Part 2, §2.5.1.2 (a list's tokens are separated by whitespace), each
    // token read by the URL Standard (#55's CDN data oracle for `xsi:schemaLocation`).
    const pattern = new RegExp(dataToken, "u");
    const disagreeing = values.filter(
      (value) => pattern.test(value) !== value.split(/[\t\n\r ]+/u).some(isData),
    );

    assert.deepStrictEqual(disagreeing, []);
    assert.isTrue(values.some((value) => pattern.test(value)));
  });
});
