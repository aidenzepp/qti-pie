/**
 * An entry's `digest` (`#pantry/qti/package.ts` `Entry`), imported on the lease, PostgreSQL the
 * judge: the field is generated, `Compute.sha256` of `content`, so PostgreSQL computes it from the
 * bytes it stores and no writer sends one.
 *
 * - Every entry's digest, read back through the author role, is the SHA-256 of its bytes as Node's
 *   `node:crypto` computes it, over the lengths at SHA-256's padding boundaries (0, 1, 55, 56, 63,
 *   64 and 65 bytes, where a message takes one block or two), every byte value, a body past one
 *   block many times over, and the package's own documents.
 * - A write cannot carry a digest: grizzle's `Addition` of `Entry` holds only the written fields, and
 *   the importer's row (`EntryRow`) carries none of the fields it does not write, so the write type
 *   refuses a digest before any SQL.
 */
import { createHash } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Db, login, query, uuid, v, workload } from "@bjornpagen/grizzle";
import type { Addition, Fact } from "@bjornpagen/grizzle";
import { Effect, Layer } from "effect";
import { describe } from "vitest";
import { importPackage } from "#pantry/import/package.ts";
import type { EntryRow } from "#pantry/package/record.ts";
import { authorWorkloadsOf } from "#pantry/qti/logins.ts";
import { Qti } from "#pantry/qti/own.ts";
import { Entry } from "#pantry/qti/package.ts";
import { authorRoleOf } from "#pantry/qti/roles.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { servedProbe } from "#pantry/test/served-members.ts";
import { hasLease, leaseTestTimeoutMs, probeLayerHookTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The fields of an `Entry` that no write holds: each a fact's field that grizzle's addition of the
 * relation leaves out.
 */
type Unwritten = Exclude<keyof Fact<typeof Entry>, keyof Addition<typeof Entry>>;

/**
 * The write type refuses a digest: `digest` is a field of the fact and of no addition, and no field
 * of the importer's row is one the fact holds unwritten. Each is a type `tsc` checks, so the
 * assertion holds where no lease runs this file.
 */
const digestUnwritten = {
  importerWritesNone: true,
  unwritten: true,
} as const satisfies {
  readonly importerWritesNone: [Extract<keyof EntryRow, Unwritten>] extends [never] ? true : false;
  readonly unwritten: "digest" extends Unwritten ? true : false;
};

/**
 * The author role of this file's probe login: grizzle puts a role in one login only, so the probe
 * holds a role of its own, named as the installed one.
 */
const probeAuthor = authorRoleOf(Qti);

/**
 * The author login with this file's read of a package's entries, each with its bytes and its
 * digest, beside its own members (`#pantry/test/served-members.ts` `servedProbe`).
 */
const { layer: probeLayer, ProbeLogin } = servedProbe(
  login(Qti, "author_app", [probeAuthor], {
    workload: [
      ...authorWorkloadsOf(Qti, probeAuthor),
      workload(probeAuthor, {
        entryDigests: query(probeAuthor).rule((r) => {
          const { content, digest, path } = v(Entry, "entry");

          return r
            .match(Entry, { content, digest, package: r.param("package", uuid), path })
            .find({ content, digest, path });
        }),
      }),
    ],
  }),
);

/**
 * The media entries the package lists beside its item, by path: the lengths at SHA-256's padding
 * boundaries, where a message's length field fits its last block or spills into another, every byte
 * value once, and a body of many blocks.
 */
const media: ReadonlyMap<string, Uint8Array> = new Map([
  ...[0, 1, 55, 56, 63, 64, 65].map(
    (length) =>
      [
        `media/length-${String(length)}.png`,
        Uint8Array.from({ length }, (_, at) => (at * 7 + length) % 256),
      ] as const,
  ),
  ["media/every-byte.png", Uint8Array.from({ length: 256 }, (_, at) => at)] as const,
  ["media/blocks.png", Uint8Array.from({ length: 70_000 }, (_, at) => (at * 31) % 251)] as const,
]);

/**
 * Write a package of one item that fetches one of its media entries, every media entry listed as a
 * file of the item's resource.
 *
 * @returns Its entries.
 */
const packageEntries = (): PackageEntries => {
  const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const text = new TextEncoder();
  const files = [...media.keys()].map((path) => `<file href="${path}"/>`).join("");

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(
        [
          declaration,
          '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="digest-manifest">',
          "  <metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata>",
          "  <organizations/>",
          "  <resources>",
          `    <resource identifier="item-res" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/>${files}</resource>`,
          "  </resources>",
          "</manifest>",
          "",
        ].join("\n"),
      ),
    ],
    [
      "item.xml",
      text.encode(
        [
          declaration,
          `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" adaptive="false" time-dependent="false">`,
          '  <qti-item-body><p><img src="media/every-byte.png" alt="every byte"/></p></qti-item-body>',
          "</qti-assessment-item>",
          "",
        ].join("\n"),
      ),
    ],
    ...media,
  ]);
};

/**
 * The SHA-256 of bytes as 64 lowercase hex digits, as Node's `node:crypto` computes it.
 *
 * @param bytes - The bytes.
 * @returns The digest.
 */
const sha256Of = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

describe.skipIf(!hasLease)(
  "qti/entry-digest.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(probeLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: probeLayerHookTimeoutMs,
    })("an entry's digest", (it) => {
      it.effect(
        "is the SHA-256 of the entry's bytes, PostgreSQL's own, for every entry of the package",
        () =>
          // Oracle: Node's `node:crypto` SHA-256 (FIPS 180-4) of the bytes the read returns and of
          // the bytes the package wrote. Bound: one package, every entry: the lengths at the
          // padding boundaries, every byte value, a body of many blocks, and the two documents.
          Effect.scoped(
            Effect.gen(function* digestOfEveryEntry() {
              assert.isTrue(digestUnwritten.unwritten && digestUnwritten.importerWritesNone);

              const entries = packageEntries();
              const pkg = yield* importPackage(yield* scopedPackage(entries));
              const db = yield* Db.open((yield* ProbeLogin).roles.author, {});
              const rows = yield* (yield* db.workload.entryDigests.execute({ package: pkg }))
                .collect;

              assert.sameMembers(
                rows.map(({ path }) => path),
                [...entries.keys()],
                "one row per entry",
              );
              for (const { content, digest, path } of rows) {
                const written = entries.get(path) ?? assert.fail(`${path}: no entry written`);

                assert.match(digest, /^[0-9a-f]{64}$/u, path);
                assert.strictEqual(digest, sha256Of(content), `${path}: the bytes read back`);
                assert.strictEqual(digest, sha256Of(written), `${path}: the bytes written`);
              }
            }),
          ),
      );
    });
  },
);
