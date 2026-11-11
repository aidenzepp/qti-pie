/**
 * A test keyed by its package and its root's identifier, imported on the lease, PostgreSQL the
 * judge (spec readings 94, 133 and 148): the root's `identifier` is held, collapsed, in
 * `ObjectIdentifier.identifier` (`#pantry/qti/metadata.ts`), a `keyText` held to the attribute
 * both ways by containment, whose index PostgreSQL must take at the bound.
 *
 * - An identifier of exactly `keyTextBytes` UTF-8 bytes is accepted and stored.
 * - One byte past is refused under `key-text-bound` alone: the import writes the copy whatever its
 *   length (reading 133), and `keyText`'s pattern law refuses it.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { describe } from "vitest";

import { AuthorAppLayer } from "#pantry/cli/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import { keyTextBytes } from "#pantry/qti/limits.ts";

import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

/**
 * An identifier of `bytes` UTF-8 bytes, an NCName of ASCII letters.
 *
 * @param bytes - Its length, at least 1.
 * @returns The identifier.
 */
const identifierOf = (bytes: number): string => `t${"a".repeat(bytes - 1)}`;

/**
 * Write a package of one test, its root's identifier `identifier`, whose one item ref names its one
 * item.
 *
 * @param identifier - The test's identifier.
 * @returns Its entries, each encoded as UTF-8.
 */
const testPackageOf = (identifier: string): PackageEntries => {
  const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>';
  const text = new TextEncoder();

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(
        [
          declaration,
          '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="keyed-manifest">',
          "  <metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata>",
          "  <organizations/>",
          "  <resources>",
          '    <resource identifier="item-res" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource>',
          '    <resource identifier="test-res" type="imsqti_test_xmlv3p0" href="test.xml">',
          '      <file href="test.xml"/>',
          '      <dependency identifierref="item-res"/>',
          "    </resource>",
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
          "  <qti-item-body><p>An item.</p></qti-item-body>",
          "</qti-assessment-item>",
          "",
        ].join("\n"),
      ),
    ],
    [
      "test.xml",
      text.encode(
        [
          declaration,
          `<qti-assessment-test xmlns="${asi}" identifier="${identifier}" title="Keyed">`,
          '  <qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
          '    <qti-assessment-section identifier="S" title="S" visible="true">',
          '      <qti-assessment-item-ref identifier="I" href="item.xml"/>',
          "    </qti-assessment-section>",
          "  </qti-test-part>",
          "</qti-assessment-test>",
          "",
        ].join("\n"),
      ),
    ],
  ]);
};

describe.skipIf(!hasLease)(
  "qti/object-identifier.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("a test keyed by its package and its root's identifier", (it) => {
      it.effect("accepts a test whose identifier is keyTextBytes bytes", () =>
        // Oracle: PostgreSQL, every law of the schema and every index over the package; reading
        // 133 says an identifier within the bound is held. Bound: an identifier at exactly the
        // bound.
        Effect.scoped(
          Effect.gen(function* keyedAtTheBound() {
            const outcome = yield* Effect.result(
              importDir(yield* scopedPackage(testPackageOf(identifierOf(keyTextBytes)))),
            );

            assert.isTrue(
              Result.isSuccess(outcome),
              Result.isFailure(outcome) ? outcome.failure.message : "accepted",
            );
          }),
        ),
      );

      it.effect(
        "refuses a test whose identifier is one byte past keyTextBytes, by key-text-bound",
        () =>
          // Oracle: PostgreSQL, `keyText`'s pattern law on the copy the import writes whatever its
          // length (reading 133). Bound: an identifier one byte past the bound.
          Effect.scoped(
            Effect.gen(function* refusedPastTheBound() {
              const outcome = yield* Effect.result(
                importDir(yield* scopedPackage(testPackageOf(identifierOf(keyTextBytes + 1)))),
              );

              assert.isTrue(
                Result.isFailure(outcome) &&
                  outcome.failure instanceof ImportRefused &&
                  outcome.failure.rules.length === 1 &&
                  outcome.failure.rules[0] === "key-text-bound",
                Result.isFailure(outcome) ? outcome.failure.message : "accepted",
              );
            }),
          ),
      );
    });
  },
);
