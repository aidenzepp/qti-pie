/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import path from "node:path";
import { Effect, Schema } from "effect";
import type { FileSystem, PlatformError } from "effect";
import type { ChildProcessSpawner } from "effect/process";
import { materializeCorpus } from "#qti/test/fixtures.ts";
import type { ExamplesError } from "#qti/test/fixtures.ts";

/**
 * The corpus packages the processing tests read, by the zip's file name without `.zip`.
 */
export type CorpusPackageName = "ccPackage" | "maxfiles" | "svg";

/**
 * A corpus package the examples tarball does not hold, named so the failure says which one.
 */
export class CorpusPackageMissing extends Schema.TaggedError<CorpusPackageMissing>()(
  "CorpusPackageMissing",
  { available: Schema.Array(Schema.String), name: Schema.String },
) {
  /**
   * The package asked for and the ones the corpus holds, in one line.
   */
  override get message(): string {
    return `no corpus package named ${this.name}; the corpus holds ${this.available.join(", ")}`;
  }
}

type Needs = FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner;

type SourceError = PlatformError.PlatformError | ExamplesError;

/**
 * Find a corpus package's directory through phase-1's content-addressed materializer.
 *
 * The first call of a worktree extracts all 28 zips of the examples tarball; later calls find them
 * in place.
 *
 * @param name - The package, named by its zip's file name without `.zip`.
 * @returns The package's directory under the fixtures root.
 */
export const corpusPackage = (
  name: CorpusPackageName,
): Effect.Effect<string, SourceError | CorpusPackageMissing, Needs> =>
  Effect.gen(function* findPackage() {
    const packages = yield* materializeCorpus();
    const found = packages.find((entry) => entry.name === name);

    return found === undefined
      ? yield* new CorpusPackageMissing({ available: packages.map((entry) => entry.name), name })
      : found.dir;
  });

/**
 * One response processing template document of the corpus: the package it lives in and its
 * absolute path.
 */
export interface TemplateDocument {
  readonly path: string;
  readonly pkg: "ccPackage" | "maxfiles";
}

/**
 * The five template documents of the corpus, each a package and the path inside it.
 */
const templateFiles = [
  ["ccPackage", "rptemplates/CC2_map_response.xml"],
  ["ccPackage", "rptemplates/CC2_match_basic.xml"],
  ["ccPackage", "rptemplates/CC2_match.xml"],
  ["maxfiles", "rptemplates/map_response.xml"],
  ["maxfiles", "rptemplates/match_correct.xml"],
] as const;

/**
 * The five response processing template documents of the corpus, each declaring no variable.
 *
 * @returns Absolute paths under the two materialized package directories.
 */
export const templateDocuments = (): Effect.Effect<
  readonly TemplateDocument[],
  SourceError | CorpusPackageMissing,
  Needs
> =>
  Effect.gen(function* findTemplates() {
    const found: TemplateDocument[] = [];

    for (const [pkg, file] of templateFiles) {
      found.push({ path: path.join(yield* corpusPackage(pkg), file), pkg });
    }

    return found;
  });
