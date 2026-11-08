import {
  CompileError,
  CredentialError,
  CursorError,
  EncodingFailure,
  ExecutionFailure,
  OpenError,
  TokenError,
  TransportFailure,
} from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Config, ConfigProvider, Effect, Option, Result } from "effect";
import {
  describeFailure,
  kindExitCode,
  kindHelp,
  namedFailureOf,
  RoundtripDiffers,
} from "#pantry/cli/errors.ts";
import type { ExportDefectTag, ImportDefectTag } from "#pantry/cli/errors.ts";
import { refusalFieldsOf } from "#pantry/cli/refused.ts";
import { ClusterConfigError } from "#pantry/db/connection.ts";
import { SnapshotLoadError } from "#pantry/db/layer.ts";
import { PackageNotFound } from "#pantry/export/package.ts";
import { DocumentRowCount, XmlVersionUnread } from "#pantry/export/pages.ts";
import { RootMissing, RowMissing, RowsOutsideImage } from "#pantry/model/assemble.ts";
import { WitnessKind } from "#pantry/package/refusal-origin.ts";
import { EncodeError } from "@qti-pie/crust/errors.ts";

/**
 * What a failure is, without its help: the kind and the exit code.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- A failure can be any value; see `describeFailure`.
const identity = (failure: unknown) => {
  const { exitCode, kind } = describeFailure(failure);

  return { exitCode, kind };
};

const config = { exitCode: 78, kind: "config" };

const database = { exitCode: 1, kind: "database" };

/**
 * What the password reader of `AuthorAppLayer` fails with when the password file is missing.
 */
const credential = new CredentialError({ cause: new Error("ENOENT") });

describe("describeFailure, the local set-up", () => {
  it("a ClusterConfigError exits 78 as config", () => {
    const failure = new ClusterConfigError({
      path: "/state/tls/ca.crt",
      setting: "GRIZZLE_PG_STATE",
    });

    assert.deepStrictEqual(identity(failure), config);
  });

  it("a SnapshotLoadError exits 78 as config", () => {
    const failure = new SnapshotLoadError({ path: "/snapshot.json", reason: "pointer file" });

    assert.deepStrictEqual(identity(failure), config);
  });

  it.effect("Effect's ConfigError exits 78 as config", () =>
    Effect.gen(function* configError() {
      const result = yield* Effect.gen(function* readHome() {
        return yield* Config.String("HOME");
      }).pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))), Effect.result);

      assert.isTrue(Result.isFailure(result));

      if (Result.isFailure(result)) {
        assert.deepStrictEqual(identity(result.failure), config);
      }
    }),
  );

  it("an OpenError or a TransportFailure carrying a CredentialError exits 78 as config", () => {
    assert.deepStrictEqual(identity(new OpenError({ reason: credential })), config);
    assert.deepStrictEqual(identity(new TransportFailure({ reason: credential })), config);
  });
});

describe("describeFailure, what to do next", () => {
  it("every kind has a non-empty help", () => {
    assert.sameMembers(Object.keys(kindHelp), Object.keys(kindExitCode));

    for (const help of Object.values(kindHelp)) {
      assert.isAbove(help.length, 0);
    }
  });

  it("a RoundtripDiffers names the diff to run", () => {
    const failure = new RoundtripDiffers({ differing: 2, exportDir: "work/export/pkg" });

    assert.include(describeFailure(failure).help, "diff -r");
  });
});

describe("describeFailure, a package id no package has", () => {
  it("a PackageNotFound exits 1 as not-found, with the help of its kind", () => {
    const failure = new PackageNotFound({ packageId: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40" });

    assert.deepStrictEqual(identity(failure), { exitCode: 1, kind: "not-found" });
    assert.strictEqual(describeFailure(failure).help, kindHelp["not-found"]);
  });
});

/**
 * One failure of every tag the export ends with when it cannot rebuild a package the database
 * holds: `assemble`'s three refusals, the scan's two, grizzle's cursor refusal and crust's encoder
 * refusal. It is keyed by the export's error union, so a tag the export gains or loses fails to
 * compile here until its case is written or deleted.
 */
const exportDefects = {
  CursorError: CursorError.make({ _tag: "cursorMalformed" }),
  DocumentRowCount: new DocumentRowCount({
    document: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
    found: 2,
  }),
  EncodeError: new EncodeError({ codePoint: 0x1_f6_00, threshold: 0xff, where: "comment" }),
  RootMissing: new RootMissing({ node: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40" }),
  RowMissing: new RowMissing({ key: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40", rows: "texts" }),
  RowsOutsideImage: new RowsOutsideImage({
    departure: { _tag: "differs", field: "at", found: "2", written: "1" },
    key: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
    rows: "nodes",
  }),
  XmlVersionUnread: new XmlVersionUnread({
    document: "6f1c2b7e-0d4a-4c8e-9b3a-2f5d7e1a9c40",
    xmlVersion: "2.0",
  }),
} as const satisfies { readonly [K in ExportDefectTag]: { readonly _tag: K } };

/**
 * One failure of every tag the import ends with on a defect of qti: grizzle's codec refusing a
 * built value, and the two the importer dies with, keyed by the import's tags as
 * {@link exportDefects} is by the export's. The two are matched by their tag alone, which
 * `errors.ts` checks against their classes by type, so they are written as their tags here: the
 * modules that define them load the composed grammar and the author login, which this file does
 * not need.
 */
const importDefects = {
  EncodingFailure: new EncodingFailure({ place: { _tag: "Fact" }, reason: { _tag: "textNul" } }),
  OverlayConflict: { _tag: "OverlayConflict" },
  UnownedLaws: { _tag: "UnownedLaws" },
} as const satisfies { readonly [K in ImportDefectTag]: { readonly _tag: K } };

/**
 * Failures that carry no string tag, so nothing names them: nothing at all, a primitive, an object
 * with no tag, and objects whose tag is a number or an object that spells a named tag when
 * coerced, which a lookup by property key would read as that tag.
 */
const untagged: readonly unknown[] = [
  null,
  undefined,
  "RootMissing",
  70,
  {},
  { _tag: 70 },
  { _tag: { toString: () => "RootMissing" } },
];

describe("describeFailure, the defects qti names", () => {
  it("each of the export's defects exits 70 as internal, named, with a help that keeps the target", () => {
    for (const failure of Object.values(exportDefects)) {
      const { exitCode, help, kind } = describeFailure(failure);

      assert.deepStrictEqual({ exitCode, kind }, { exitCode: 70, kind: "internal" }, failure._tag);
      assert.include(help, "the export cannot rebuild it", failure._tag);
      assert.include(help, "the target is as it was", failure._tag);
      assert.deepStrictEqual(namedFailureOf(failure), Option.some(failure._tag));
    }
  });

  it("each of the import's defects exits 70 as internal, named, with a help that says nothing was written", () => {
    for (const failure of Object.values(importDefects)) {
      const { exitCode, help, kind } = describeFailure(failure);

      assert.deepStrictEqual({ exitCode, kind }, { exitCode: 70, kind: "internal" }, failure._tag);
      assert.include(help, "nothing was written", failure._tag);
      assert.notInclude(help, "trace", failure._tag);
      assert.deepStrictEqual(namedFailureOf(failure), Option.some(failure._tag));
    }
  });

  it("a failure with no string tag is named by nothing, and exits 70 as internal with that kind's help", () => {
    for (const failure of untagged) {
      assert.deepStrictEqual(
        describeFailure(failure),
        { exitCode: 70, help: kindHelp.internal, kind: "internal" },
        String(failure),
      );
      assert.isTrue(Option.isNone(namedFailureOf(failure)), String(failure));
    }
  });
});

/**
 * Grizzle's refusal to compile the import's ChangeSet, as `db.apply` reported it on the migrated
 * schema before R87: the write filler's `UnsupportedOperation` for an owner-axis copy of a column
 * the owner fills only after its members.
 */
const uncompiled = CompileError.make({
  _tag: "UnsupportedOperation",
  at: { label: "ChangeSet.insert", path: [], site: undefined },
  capability:
    "BranchResolution.instanceEnd copies Instance's end along the owner axis of Instance.rules, a column its owner fills only after its members",
});

describe("describeFailure, a program grizzle refused to compile", () => {
  it("an ExecutionFailure or an OpenError carrying a CompileError exits 70 as internal, with a help that blames qti and keeps the database", () => {
    // Oracle: the failure's carrier and its reason's tag, read from its fields: grizzle refused
    // the program before any SQL, so neither the package nor the cluster is at fault, and the
    // database holds what it held. Bound: both carriers of a CompileError, and each carrier with a
    // reason of another tag, exhausted; residual none.
    for (const failure of [
      new ExecutionFailure({ reason: uncompiled }),
      new OpenError({ reason: uncompiled }),
    ]) {
      const { exitCode, help, kind } = describeFailure(failure);

      assert.deepStrictEqual({ exitCode, kind }, { exitCode: 70, kind: "internal" }, failure._tag);
      assert.include(help, "a defect in qti, not in the package or the database", failure._tag);
      assert.include(help, "before sending any SQL, so the database is as it was", failure._tag);
      assert.notInclude(help, "cluster", failure._tag);
      assert.isTrue(Option.isNone(namedFailureOf(failure)), failure._tag);
    }

    assert.deepStrictEqual(
      identity({ _tag: "ExecutionFailure", reason: { _tag: "ServerError" } }),
      database,
    );
    assert.deepStrictEqual(
      identity(new OpenError({ reason: new TokenError({ cause: new Error("refused") }) })),
      database,
    );
  });
});

/**
 * One law a database refusal names, as the refusal carries it: AL1's admission check.
 */
const refusedLaw = {
  identity: "check AL1_admission",
  name: "AL1 admission",
  rule: "attribute-admission",
};

describe("describeFailure, a refused import", () => {
  // A refusal is matched by its tag and fields, so it is written as them here: `refusal.ts`, which
  // defines its class, loads the composed grammar.
  it("a refusal the database gave says where to look by the kind of its witness", () => {
    // Oracle: the witness kind the refusal's origin carries, read from its field and never from
    // its detail: a key or a row is named in the message, an unreported witness names
    // none. Bound: every kind of `WitnessKind`, exhausted; residual none.
    for (const witness of WitnessKind.literals) {
      const { exitCode, help, kind } = describeFailure({
        _tag: "ImportRefused",
        detail: "x",
        origin: { _tag: "Database", laws: [refusedLaw], sources: ["AL1"], witness },
        rule: "attribute-admission",
      });
      const named = witness === "key" || witness === "row";

      assert.deepStrictEqual({ exitCode, kind }, { exitCode: 1, kind: "import-refused" });
      assert.notStrictEqual(help, kindHelp["import-refused"]);
      assert.strictEqual(help.includes("at the row the message names"), named, witness);
      assert.strictEqual(help.includes("The database names no row for this law"), !named, witness);
      assert.include(help, "Nothing was written.");
    }
  });

  it("a database origin without all of its laws, sources and witness is no refusal's", () => {
    // Oracle: the origin's shape, one case that carries the three facts together or the reader's
    // that carries none: an origin that lacks any of them, or holds no law or no source, is not a
    // refusal the command line reads, and keeps the help of the import-refused kind. Bound: every
    // subset of the three facts, exhausted, and each list empty; residual none.
    const whole = { laws: [refusedLaw], sources: ["AL1"], witness: "key" };
    const facts = ["laws", "sources", "witness"] as const;
    const subsets: (readonly (typeof facts)[number][])[] = [[]];
    for (const fact of facts) {
      subsets.push(...subsets.map((subset) => [...subset, fact]));
    }

    const partial = subsets.map((subset) =>
      Object.fromEntries(subset.map((fact) => [fact, whole[fact]])),
    );

    assert.strictEqual(partial.length, 2 ** facts.length);
    for (const origin of [...partial, { ...whole, laws: [] }, { ...whole, sources: [] }]) {
      const refused = {
        _tag: "ImportRefused",
        detail: "x",
        origin: { _tag: "Database", ...origin },
        rule: "attribute-admission",
      };
      const reads = Option.isSome(refusalFieldsOf(refused));
      const carriesAll = facts.every((fact) => fact in origin && [origin[fact]].flat().length > 0);

      assert.strictEqual(reads, carriesAll, JSON.stringify(origin));
      assert.strictEqual(
        describeFailure(refused).help === kindHelp["import-refused"],
        !carriesAll,
        JSON.stringify(origin),
      );
    }
  });
});
