/**
 * The single-CDN level's origin rule (`#pantry/levels/cdn-origin.ts`), with no database:
 *
 * - **Its laws**: the `Cdn` level states a `CdnOrigin` check over each of the rule's derived
 *   relations, the fetched attributes of each address form and the fetched texts, and every law it
 *   adds is a check over a relation of its own, so it states no law of `Qti` that `Qti` does not.
 * - **Its installation compiles**: grizzle's own check compiles an installation whose top level is
 *   the `Cdn` level, every statement of it, as `src/test/compile.test.ts` compiles `Qti`, so the
 *   rule's matches are known to compile however `lawsOf` reads them.
 * - **Its patterns**, as JavaScript regular expressions under the flag `u`, the flags grizzle reads a
 *   pattern under, against the readings they state, written here apart from the patterns: HTML's
 *   srcset parser, written from the HTML Standard, and the URL Standard's leading strip; and every
 *   address a pattern admits against the URL Standard's own parser (Node's `URL`), which must
 *   resolve it on the origin.
 * - **Its two bypasses** (decision 488): an entity reference crust keeps unexpanded, which a player
 *   reading the external subset expands, is refused in a fetched attribute however the rest of its
 *   value reads; and every governing type the base model admits on a fetched kind is one the rule
 *   selects, so no `xsi:type` takes a fetched value out of it.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { lawsOf, sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { GoverningOf, XsiType } from "#pantry/grammar/install.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import {
  addressPattern,
  candidatesPattern,
  cdnOriginRule,
  governorsOf,
} from "#pantry/levels/cdn-origin.ts";
import { qti } from "#pantry/qti/schema.ts";
import { fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

/**
 * The origins every case is judged under: one plain, and one with a port and a hyphen, so a
 * pattern that reads either wrongly is seen.
 */
const origins = ["https://cdn.example.com/", "https://media-cdn.example.test:8443/"] as const;

/**
 * The origin the level's laws are read under.
 */
const [origin] = origins;

/**
 * The derived relations the origin rule judges: the fetched attributes read as one address, those
 * read as a `srcset`, and the fetched texts.
 */
const originRelations = ["CdnFetchedAddress", "CdnFetchedCandidates", "CdnFetchedText"] as const;

/**
 * The package directory, where grizzle is run from and where the committed migrations live.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * The folder the installation's configuration is written to, made and removed by its test.
 */
const configDirectory = path.join(packageDirectory, "work", "cdn-origin-compile");

/**
 * How long reading the level's laws may take: `lawsOf` compiles `Qti`'s law model and the level's.
 * Measurement owed: it ran 113.6 s and 83.7 s on 2026-11-10, at load averages of 22.5 to 66.2,
 * never at 60 or more throughout, so no busy measurement stands yet; its number is the sibling
 * rule's (`cdn-foreign.test.ts`), over twice either run.
 */
const lawsTimeoutMs = 600_000;

/**
 * How long grizzle's check of the installation may take: it compiles every statement of `Qti` and
 * of the level, and every program of the author's login.
 * Measurement owed: it ran 67.6 s and 158.9 s on 2026-11-10, at load averages of 22.5 to 66.2,
 * never at 60 or more throughout, so no busy measurement stands yet; its number is the sibling
 * rule's (`cdn-foreign.test.ts`), over twice either run.
 */
const compileTimeoutMs = 360_000;

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

describe("levels/cdn-origin.ts, the laws", () => {
  it(
    "states a CdnOrigin check over each derived relation of the rule at the Cdn level, and no law over a Qti relation",
    () => {
      // Oracle: spec U12 done_when, "lawsOf lists the four checks at level Cdn and no new Qti
      // law"; GOAL G4, a level only adds laws.
      const base = qti();
      const level = singleCdn(base, { origin });
      const baseLaws = lawsOf(base);
      const levelLaws = lawsOf(level);
      const added = addedLaws(levelLaws, baseLaws);
      // A level's record holds every relation of every level of it; a live derived relation is no
      // whole entry (`wholeEntriesOf`), so the record is what names the level's own.
      const baseNames = new Set(Object.keys(base.relations));
      const ownNames = new Set(Object.keys(level.relations).filter((name) => !baseNames.has(name)));

      assert.deepStrictEqual(
        added
          .flatMap((law) =>
            law.kind === "check" && law.name === "CdnOrigin" ? [law.relation] : [],
          )
          .toSorted(),
        [...originRelations],
      );
      assert.deepStrictEqual(addedLaws(baseLaws, levelLaws), [], "a Qti law the level drops");
      for (const law of added) {
        assert.isTrue(
          law.kind === "check" && ownNames.has(law.relation),
          `${Formatter.format(law)} is a law the level states over no relation of its own`,
        );
      }
    },
    lawsTimeoutMs,
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
    compileTimeoutMs,
  );
});

/**
 * HTML's ASCII whitespace.
 *
 * @see {@link https://infra.spec.whatwg.org/#ascii-whitespace | Infra Standard, ASCII whitespace}
 */
const htmlSpace = new Set(["\t", "\n", "\f", "\r", " "]);

/**
 * The address a player resolves a relative one against: a document of a package on another host.
 */
const playerDocument = "https://player.example.test/package/items/item.xml";

/**
 * Decide whether an address resolves on an origin, as the URL Standard's parser resolves it
 * against the player's document.
 *
 * @param address - The address as written.
 * @param on - The origin.
 * @returns Whether it parses and its URL starts with the origin.
 */
const resolvesOn = (address: string, on: string): boolean =>
  URL.canParse(address, playerDocument) && new URL(address, playerDocument).href.startsWith(on);

/**
 * Find where a run of characters a test holds ends: the first position from `from` whose
 * character the test refuses, or the text's end.
 *
 * @param text - The text.
 * @param from - Where the run starts.
 * @param holds - The test.
 * @returns The run's end.
 */
const runEnd = (text: string, from: number, holds: (character: string) => boolean): number => {
  let at = from;
  while (at < text.length && holds(text.charAt(at))) {
    at += 1;
  }

  return at;
};

/**
 * Strip what the URL Standard strips before a URL: its leading C0 controls and spaces.
 *
 * @param address - The address as written.
 * @returns It without them.
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser, step 1}
 */
const stripped = (address: string): string =>
  address.slice(runEnd(address, 0, (character) => (character.codePointAt(0) ?? 0) <= 0x20));

/**
 * Decide whether a character is one HTML's splitting loop skips between candidates: ASCII
 * whitespace or a comma.
 *
 * @param character - The character.
 * @returns Whether the loop skips it.
 */
const betweenCandidates = (character: string): boolean =>
  htmlSpace.has(character) || character === ",";

/**
 * Find where a candidate's descriptors end, as HTML's descriptor tokenizer reads them past its
 * URL: after the first comma outside parentheses, or at the text's end.
 *
 * @param text - The `srcset`.
 * @param from - The position after the candidate's URL.
 * @returns The position the splitting loop resumes at.
 */
const descriptorsEnd = (text: string, from: number): number => {
  let inParens = false;
  for (let at = from; at < text.length; at += 1) {
    const character = text.charAt(at);
    if (inParens) {
      inParens = character !== ")";
    } else if (character === ",") {
      return at + 1;
    } else {
      inParens = character === "(";
    }
  }

  return text.length;
};

/**
 * Collect the URL of each image candidate of a `srcset`, as HTML's algorithm collects them: the
 * splitting loop skips whitespace and commas, a URL is the run of non-whitespace that follows, a
 * URL ending in commas loses them and ends its candidate, and any other is followed by its
 * descriptors, read up to a comma outside parentheses. Every candidate's URL is listed, those whose
 * descriptors HTML then drops among them, so a pattern that holds every URL holds every one HTML
 * fetches.
 *
 * @param srcset - The attribute's value.
 * @returns The candidates' URLs, in order.
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 */
const candidateUrls = (srcset: string): readonly string[] => {
  const urls: string[] = [];
  let position = runEnd(srcset, 0, betweenCandidates);
  while (position < srcset.length) {
    const end = runEnd(srcset, position, (character) => !htmlSpace.has(character));
    const url = srcset.slice(position, end);
    const commas = url.endsWith(",");
    urls.push(commas ? url.replace(/,+$/u, "") : url);
    position = runEnd(srcset, commas ? end : descriptorsEnd(srcset, end), betweenCandidates);
  }

  return urls;
};

/**
 * Collect the pieces a drawn value is made of: an origin's own text and spellings of it the origin
 * does not write, another host, a relative path, a `data:` scheme in several cases, whitespace
 * HTML and the URL Standard read, a C0 control the URL Standard strips, commas, parentheses,
 * descriptors and an entity reference.
 *
 * @param on - The origin.
 * @returns The pieces.
 */
const piecesOf = (on: string) =>
  [
    on,
    on.toUpperCase(),
    on.replace("https:", ""),
    on.replace("https://", ""),
    on.slice(0, -1),
    "https://elsewhere.example.test/",
    "data:",
    "DaTa:",
    "da\tta:",
    "image.png",
    "a/",
    "../",
    " ",
    "\t",
    "\n",
    "\u0001",
    ",",
    "(",
    ")",
    " 1x",
    " 2w",
    "&cdn;",
  ] as const;

/**
 * The address forms a fetched value is read in.
 */
const forms = ["address", "candidates"] as const;

/**
 * The features the pattern search steers by: each form, seen admitted and refused.
 */
const patternFeatures = [
  "address admitted",
  "address refused",
  "candidates admitted",
  "candidates refused",
] as const;

/**
 * Compile an origin's pattern of a form as JavaScript reads it, under the flag `u`.
 *
 * @param on - The origin.
 * @param form - The form.
 * @returns The regular expression.
 */
const patternOf = (on: string, form: (typeof forms)[number]): RegExp =>
  new RegExp(form === "address" ? addressPattern(on) : candidatesPattern(on), "u");

describe("levels/cdn-origin.ts, the patterns", () => {
  it.effect(
    "admit an address exactly when, past the URL Standard's leading strip, it starts with the origin, and a srcset exactly when every candidate's URL does, as HTML parses it; and each address they admit resolves on the origin",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(patternFeatures, { cases: 400, sense: notesOnly }),
            draw: drawn((source) => {
              const on = source.draw(element(origins));

              return {
                form: source.draw(element(forms)),
                on,
                value: source.draw(array(element(piecesOf(on)), { max: 7, min: 0 })).join(""),
              };
            }),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the URL Standard's leading strip and parser (Node's URL), and HTML's srcset parser written from the HTML Standard",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "levels/cdn-origin/patterns",
          },
          ({ form, on, value }, c) =>
            Effect.sync(() => {
              const addresses = form === "candidates" ? candidateUrls(value) : [stripped(value)];
              const admitted = addresses.every((address) => address.startsWith(on));
              const verdict = patternOf(on, form).test(value);
              const shown = `${form} under ${on}: ${JSON.stringify(value)}`;

              assert.strictEqual(verdict, admitted, shown);
              c.note(verdict ? `${form} admitted` : `${form} refused`);
              if (verdict) {
                for (const address of addresses) {
                  assert.isTrue(
                    resolvesOn(address, on),
                    `${shown}: ${JSON.stringify(address)} resolves off the origin`,
                  );
                }
              }
            }),
        ),
      ),
  );
});

/**
 * A fetched kind's value under each governing type, one per fetched attribute and fetched text,
 * with the governors the rule selects it under.
 */
const fetchedUnderGovernors = [
  ...fetchedAttributes.map(({ form, kind, name }) => ({
    governors: governorsOf(
      fetchedAttributes
        .filter((row) => row.form === form && row.name === name)
        .map((row) => row.kind),
    ),
    kind,
    what: `${kind}'s ${name}`,
  })),
  ...fetchedTexts.map((kind) => ({
    governors: governorsOf(fetchedTexts),
    kind,
    what: `${kind}'s text`,
  })),
];

describe("levels/cdn-origin.ts, the bypasses", () => {
  it("refuses an entity reference kept in a fetched attribute, which a srcset's pattern admits while its expansion is off the origin", () => {
    // Oracle: XML 1.0 section 4.4 (a validating player includes the replacement text of an entity
    // the external subset declares, which crust never reads and keeps as `&name;`), and HTML's
    // srcset parser as `candidateUrls` writes it. Decision 488, claim 1. Evidence without a
    // database: the pattern admits the kept form, so the rule must judge each row's count of kept
    // references, which each relation of fetched attributes then carries for its check.
    const kept = `${origin}a.png 1x&far;`;
    const expanded = kept.replace("&far;", ", https://elsewhere.example.test/b.png 2x");
    const { relations } = cdnOriginRule(qti(), origin);

    assert.isTrue(patternOf(origin, "candidates").test(kept), `the pattern refuses ${kept}`);
    assert.isFalse(
      candidateUrls(expanded).every((url) => url.startsWith(origin)),
      `${expanded} holds no candidate off the origin`,
    );
    for (const relation of [relations.CdnFetchedAddress, relations.CdnFetchedCandidates]) {
      assert.include(
        Object.keys(relation.heading),
        "entities",
        `${relation.name} judges no count of kept entity references`,
      );
    }
  });

  it("selects each fetched value under every governing type the base model admits on its kind, so no xsi:type takes one out of the rule", () => {
    // Oracle: Qti's "XsiType derived" containment holds every element that is not foreign to an
    // `XsiType` row of its kind, and `GoverningOf` gives each row its governor; an xsi:type naming
    // any other type is refused before the rule judges anything. Decision 488, claim 2.
    const admitted = fetchedUnderGovernors.flatMap(({ governors, kind, what }) =>
      XsiType.rows
        .filter((row) => row.kind === kind)
        .map(({ type, version }) => ({
          selected: GoverningOf.rows.some(
            (row) =>
              row.version === version &&
              row.kind === kind &&
              row.governs === type &&
              governors.includes(row.governor),
          ),
          shown: `${what} under ${type} in ${version}`,
        })),
    );

    assert.deepStrictEqual(
      fetchedUnderGovernors.filter(({ kind }) => !XsiType.rows.some((row) => row.kind === kind)),
      [],
      "a fetched kind no governing type admits",
    );
    assert.deepStrictEqual(
      admitted.filter(({ selected }) => !selected).map(({ shown }) => shown),
      [],
    );
  });
});
