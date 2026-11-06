import { randomUUID } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option } from "effect";
import { corpusRoot } from "#plate/document/corpus.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import { instructions, writeWalkCorpus } from "#scripts/walk-corpus.ts";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files.
 */
const scratch = path.resolve(import.meta.dirname, "..", "work", `walk-corpus-test-${randomUUID()}`);

/**
 * Reading every corpus member (about 800) to derive the probes runs in seconds here; the bound
 * leaves room for a slow machine without letting a hung run stall the suite.
 */
const walkTimeoutMs = 600_000;

/**
 * The writer's run into {@link scratch}, once for the file. `PLATE_WALK_CORPUS_DIR` names the
 * scratch folder; the corpus root still comes from the environment, as the sweeps read it.
 */
const written = Effect.runSync(
  Effect.cached(
    writeWalkCorpus.pipe(
      Effect.provide(
        ConfigProvider.layerAdd(ConfigProvider.fromUnknown({ PLATE_WALK_CORPUS_DIR: scratch }), {
          asPrimary: true,
        }),
      ),
    ),
  ),
);

/**
 * Read a written file of the walk corpus.
 *
 * @param relative The file's path under {@link scratch}.
 * @returns Its bytes.
 */
const readWritten = (relative: string): Uint8Array => readFileSync(path.join(scratch, relative));

/**
 * One text interaction of the corpus that carries `pattern-mask`: its document and the response it
 * binds.
 */
interface Source {
  readonly document: string;
  readonly response: string;
}

/**
 * Order sources by document, then response identifier.
 *
 * @param sources The sources.
 * @returns The sources, sorted.
 */
const sorted = (sources: readonly Source[]): readonly Source[] =>
  sources.toSorted((left, right) =>
    left.document === right.document
      ? left.response.localeCompare(right.response)
      : left.document.localeCompare(right.document),
  );

/**
 * Scan the corpus for text interactions that carry `pattern-mask`, by the raw text of each `.xml`
 * file outside `qtiv2p2-examples/`, independently of the script's reader and walk.
 *
 * @param root The corpus root.
 * @returns Each interaction's document and response identifier.
 */
const scan = (root: string): readonly Source[] => {
  const found: Source[] = [];

  for (const entry of readdirSync(root, { recursive: true, withFileTypes: true })) {
    const document = path
      .relative(root, path.join(entry.parentPath, entry.name))
      .split(path.sep)
      .join("/");
    if (
      !entry.isFile() ||
      !entry.name.endsWith(".xml") ||
      document.startsWith("qtiv2p2-examples/")
    ) {
      continue;
    }

    const text = readFileSync(path.join(root, document), "utf-8");
    for (const match of text.matchAll(
      /<qti-(?:text-entry|extended-text)-interaction\b(?<attributes>[^>]*)>/gu,
    )) {
      const attributes = match.groups?.["attributes"] ?? "";
      const response =
        /(?:^|\s)response-identifier\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)')/u.exec(
          attributes,
        );
      if (/(?:^|\s)pattern-mask\s*=/u.test(attributes) && response !== null) {
        found.push({
          document,
          response: response.groups?.["double"] ?? response.groups?.["single"] ?? "",
        });
      }
    }
  }

  return found;
};

/**
 * Collect the `data` of every `object` in an item body, in document order.
 *
 * @param nodes The body.
 * @returns Each object's `data` as the item holds it.
 */
const objectData = (nodes: readonly BodyNode[]): readonly string[] =>
  nodes.flatMap((node): readonly string[] => {
    if (node.kind !== "element") {
      return [];
    }

    const own =
      node.tag === "object"
        ? node.attributes.filter((each) => each.name === "data").map((each) => each.value)
        : [];

    return [...own, ...objectData(node.children)];
  });

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("the walk corpus", () => {
  it.effect(
    "open accepts every probe item",
    () =>
      Effect.gen(function* acceptsEveryProbe() {
        const walk = yield* written;

        assert.include(walk.items, "inline.xml");
        assert.isAbove(walk.items.length, 4);
        for (const item of walk.items) {
          const verdict = yield* open(item, readWritten(item));
          assert.strictEqual(verdict.verdict, "accepted", item);
        }
      }),
    walkTimeoutMs,
  );

  it.effect(
    "both OD-14 (e) documents hold a script and a target=_top link",
    () =>
      Effect.gen(function* controlsHoldAScript() {
        const walk = yield* written;

        assert.strictEqual(walk.controls.length, 2);
        for (const control of walk.controls) {
          const text = readFileSync(control, "utf-8");
          assert.match(text, /<script\b/u, control);
          assert.match(text, /<a\b[^>]*\btarget="_top"/u, control);
        }
      }),
    walkTimeoutMs,
  );

  it.effect(
    "the OD-14 (e) probe's object@data values survive check as package-relative",
    () =>
      Effect.gen(function* objectDataSurvives() {
        const walk = yield* written;
        const verdict = yield* open(walk.od14, readWritten(walk.od14));

        assert.strictEqual(verdict.verdict, "accepted");

        const accepted = acceptedItem(verdict);
        if (Option.isSome(accepted)) {
          assert.deepStrictEqual(objectData(accepted.value.item.body), [
            "od14-probe.html",
            "od14-probe.svg",
          ]);
        }

        assert.deepStrictEqual(
          walk.controls.map((control) =>
            path.relative(path.dirname(path.join(scratch, walk.od14)), control),
          ),
          ["od14-probe.html", "od14-probe.svg"],
        );
      }),
    walkTimeoutMs,
  );

  it.effect(
    "the derived probes' sources equal an independent scan of the corpus",
    () =>
      Effect.gen(function* derivedMatchScan() {
        const started = performance.now();
        const walk = yield* written;
        const root = yield* corpusRoot;
        const expected = scan(root);

        assert.isAbove(expected.length, 0);
        assert.deepStrictEqual(
          sorted(walk.derived.map(({ document, response }) => ({ document, response }))),
          sorted(expected),
        );
        for (const probe of walk.derived) {
          assert.isTrue(walk.items.includes(probe.item), probe.item);
        }
        // The time the corpus walk took, for the seat's report.
        yield* Effect.logInfo(
          `walk corpus: ${String(walk.derived.length)} derived probes, ${String(Math.round(performance.now() - started))} ms`,
        );
      }),
    walkTimeoutMs,
  );

  it.effect(
    "the printed text names the serve command on the walk directory and the control documents",
    () =>
      Effect.gen(function* printsServeCommand() {
        const walk = yield* written;
        const text = instructions(walk);

        assert.include(text, `PLATE_CORPUS_DIR='${walk.directory}'`);
        assert.include(text, "pnpm --filter @qti-pie/plate serve");
        for (const control of walk.controls) {
          assert.include(text, pathToFileURL(control).href);
          assert.isTrue(existsSync(control), control);
        }
      }),
    walkTimeoutMs,
  );
});
