/**
 * The day-one probe of the schema tightening (phase 13, unit T00).
 *
 * Phase 13 retypes columns to contracts and closed rosters, and lifts one composite containment
 * onto a closed handle. This file builds probe schemas of its own, never composed into `Qti`, and
 * records grizzle's verdict on six forms. A verdict is an observation, not a requirement: each
 * case asserts what grizzle does on the vendored commit, so a later change of verdict fails the
 * case and sends the slices that wait on it back to the Mind.
 *
 * Verdicts:
 *
 * 1. Admitted. A relation whose primary key is a `contract` over `str.regex(patterns.ncName)` builds.
 *    Gates `p13-t30`.
 * 2. Admitted. A `contained(...)` between two relations whose linked columns are one such contract
 *    builds. Gates `p13-t30`.
 * 3. Admitted. A `contract` over `str.regex(patterns.anyUri)` builds. Gates `p13-t30`.
 * 4. Admitted. A `closed(...)` roster whose handles include `"QTI Package"`, `"3.0.0"`,
 *    `"use-credentials"` and `"computer-read-aloud"` builds: a handle is any distinct string of at
 *    most 63 UTF-8 bytes (grizzle `packages/engine/src/schema/relation.ts:187-194`). Gates
 *    `p13-t20`.
 * 5. Refused at the type level. A containment from a contract column into a bare column of the same
 *    pattern does not typecheck: both sides of a containment need one host type, brand included
 *    (grizzle `types/schema/statements.ts:155-164`). The refusal is the type error the
 *    `@ts-expect-error` line below expects, so `tsc` fails the line if it ever typechecks. At run
 *    time the same schema builds, because the brand is erased: the type is the only guard. Gates
 *    `p13-t30`.
 * 6. Admitted. Pair 38's shape builds: a relation `{ id, metadata, package, version }` contained
 *    through `(metadata, package)` into a parent `{ id, manifest }` and through `(package,
 *    version)` into a parent `{ id, schemaversion }`, both keyed `["id"]`, with `version` and
 *    `schemaversion` one `closedId`. `Resource` uses the second form (`src/schema/package.ts:640`).
 *    Gates `p13-t18`.
 *
 * No refusal was observed, so no reason is quoted.
 */
import {
  closed,
  closedId,
  contained,
  contract,
  on,
  relation,
  schema,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import * as patterns from "#pantry/schema/patterns.ts";

describe("schema tightening probe", () => {
  it.effect("case 1: a primary key that is a contract over ncName is admitted", () =>
    Effect.gen(function* probe() {
      const NcName = contract("ProbeNcName", str.regex(patterns.ncName));
      const Keyed = relation("ProbeKeyedByContract", { id: NcName, owner: uuid }, ["id"]);
      const built = yield* Effect.try(() => schema("ProbeContractKey", { Keyed }, []));
      assert.isDefined(built);
    }),
  );

  it.effect("case 2: a containment between two columns of one contract is admitted", () =>
    Effect.gen(function* probe() {
      const NcName = contract("ProbeLinkName", str.regex(patterns.ncName));
      const Parent = relation("ProbeLinkParent", { id: NcName }, ["id"]);
      const Child = relation("ProbeLinkChild", { id: uuid, parent: NcName }, ["id"]);
      const built = yield* Effect.try(() =>
        schema("ProbeContractLink", { Child, Parent }, [
          contained(on(Child, "parent"), on(Parent, "id")),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("case 3: a contract over anyUri is admitted", () =>
    Effect.gen(function* probe() {
      const AnyUri = contract("ProbeAnyUri", str.regex(patterns.anyUri));
      const Holder = relation("ProbeUriHolder", { id: uuid, uri: AnyUri }, ["id"]);
      const built = yield* Effect.try(() => schema("ProbeUriContract", { Holder }, []));
      assert.isDefined(built);
    }),
  );

  it.effect("case 4: rosters of spaced, numeric and hyphenated handles are admitted", () =>
    Effect.gen(function* probe() {
      const Handles = closed("ProbeHandles", [
        "QTI Package",
        "3.0.0",
        "use-credentials",
        "computer-read-aloud",
      ]);
      const Holder = relation("ProbeHandleHolder", { handle: closedId(Handles), id: uuid }, ["id"]);
      const built = yield* Effect.try(() => schema("ProbeClosedHandles", { Handles, Holder }, []));
      assert.isDefined(built);
    }),
  );

  it.effect("case 5: a contract column into a bare column of its pattern fails to typecheck", () =>
    Effect.gen(function* probe() {
      const bare = str.regex(patterns.ncName);
      const Branded = contract("ProbeBranded", str.regex(patterns.ncName));
      const Parent = relation("ProbeBareParent", { id: bare }, ["id"]);
      const Child = relation("ProbeBrandedChild", { id: uuid, parent: Branded }, ["id"]);
      const built = yield* Effect.try(() =>
        schema("ProbeBrandMismatch", { Child, Parent }, [
          // @ts-expect-error both sides of a containment need one host type, brand included
          contained(on(Child, "parent"), on(Parent, "id")),
        ]),
      );
      assert.isDefined(built);
    }),
  );

  it.effect("case 6: pair 38's two containments, one through a closed handle, are admitted", () =>
    Effect.gen(function* probe() {
      const Version = closed("ProbeSchemaVersionLike", ["3.0.0", "3.0.1"]);
      const Metadata = relation("ProbeMetadata", { id: uuid, manifest: uuid }, ["id"]);
      const Package = relation("ProbePackage", { id: uuid, schemaversion: closedId(Version) }, [
        "id",
      ]);
      const Child = relation(
        "ProbePairChild",
        { id: uuid, metadata: uuid, package: uuid, version: closedId(Version) },
        ["id"],
      );
      const built = yield* Effect.try(() =>
        schema("ProbePairShape", { Child, Metadata, Package, Version }, [
          contained(on(Child, "metadata", "package"), on(Metadata, "id", "manifest")),
          contained(on(Child, "package", "version"), on(Package, "id", "schemaversion")),
        ]),
      );
      assert.isDefined(built);
    }),
  );
});
