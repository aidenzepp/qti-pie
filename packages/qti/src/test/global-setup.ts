import { NodeServices } from "@effect/platform-node";
import { Effect } from "effect";
import type { TestProject } from "vitest/node";
import { materialize, materializePackage } from "#qti/test/fixtures.ts";
import type { RefusedPackage } from "#qti/test/fixtures.ts";

/**
 * The fixtures every test run materializes once, before the first test file opens: `simple` and the
 * four packages the importer refuses.
 */
export type BaseFixture = "simple" | RefusedPackage;

declare module "vitest" {
  /**
   * The values the package's `globalSetup` provides to every test file through `inject`.
   */
  export interface ProvidedContext {
    /**
     * The directory of each {@link BaseFixture}, as `materialize` and `materializePackage` return
     * it.
     */
    fixtures: Record<BaseFixture, string>;
  }
}

/**
 * Materialize the base set once and provide it to every test file as `inject("fixtures")`.
 *
 * Vitest runs this before any test file is opened, so a test reads a package directory that already
 * exists. A run whose config never loaded this file has no `fixtures` to inject, which
 * `fixtures.test.ts` reports as a failure, so a leftover tree under `work/fixtures` cannot pass for
 * a working setup. The five paths are logged so a run shows what it read.
 *
 * @param project - The vitest project the run belongs to.
 * @returns Completes once `fixtures` is provided.
 */
export default async function setup(project: TestProject): Promise<void> {
  const fixtures = await Effect.runPromise(
    Effect.all(
      {
        CAT_Test01_Adaptive_EchoAdapt: materializePackage("CAT_Test01_Adaptive_EchoAdapt"),
        lti: materializePackage("lti"),
        metaData: materializePackage("metaData"),
        sample_pci: materializePackage("sample_pci"),
        simple: materialize("simple"),
      },
      { concurrency: "unbounded" },
    ).pipe(
      Effect.tap((paths) => Effect.logInfo("fixtures provided", paths)),
      Effect.provide(NodeServices.layer),
    ),
  );

  project.provide("fixtures", fixtures);
}
