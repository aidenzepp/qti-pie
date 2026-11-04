/**
 * The day-one probe of the superkey mirror (phase 4, unit U00).
 *
 * Phase 4 wants to mirror each `ManifestId` arm with its owner, as in
 * `mirrors(on(ManifestIdOfManifest, "package", "id"), on(Package, "id", "identifier"))`, where
 * `(id, identifier)` is a superkey of `Package` and not a key (its key is `id` alone). This file
 * builds a probe schema of its own, never composed into `Qti`, and records whether grizzle admits
 * that form.
 *
 * Verdict: admitted. The schema builds, so `p4-13` writes the three mirrors. A later refusal would
 * fail this test and send `p4-13` back to two containments each way.
 *
 * The compile spike (mail `052b9984`) settled the two other forms this unit once probed, so they
 * are not probed here: a selected `Edge` source with an unselected target under `within(0n, 1n)`
 * drafts a partial unique index, and a single-selector target is a capacity grizzle supports.
 */
import { mirrors, on, relation, schema, str, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as patterns from "#pantry/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

/**
 * The owner: `id` is its key, so `(id, identifier)` is a superkey but not a key.
 */
const OwnerLike = relation("OwnerLike", { id: uuid, identifier: ncName }, ["id"]);

/**
 * The arm, keyed by `(package, id)` the way a `ManifestId` arm is.
 */
const ArmLike = relation("ArmLike", { id: ncName, package: uuid }, ["package", "id"]);

describe("superkey mirror probe", () => {
  it.effect("is admitted: mirroring onto a superkey of the owner builds", () =>
    Effect.gen(function* probe() {
      const built = yield* Effect.try(() =>
        schema("P4SuperkeyMirrorProbe", { ArmLike, OwnerLike }, [
          mirrors(on(ArmLike, "package", "id"), on(OwnerLike, "id", "identifier")),
        ]),
      );
      assert.isDefined(built);
    }),
  );
});
