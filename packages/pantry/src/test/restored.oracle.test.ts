import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readPackage } from "#pantry/package/read.ts";
import { examplesTarball, materialize } from "#pantry/test/fixtures.ts";
import { judge, verdictOf } from "#pantry/test/oracle.ts";
import {
  asi,
  breachesOf,
  itemResource,
  judged,
  grammar,
  laws,
  manifestOf,
  shown,
} from "#pantry/test/probe.ts";

/**
 * Whether the examples tarball, which every fixture is cut from, is on this machine.
 */
const tarballPresent = existsSync(Effect.runSync(examplesTarball));

/**
 * A package whose one item body holds one `xi:include` of the given href and lists no fragment.
 *
 * @param href - The include's href, as written.
 * @returns The package's files, by path.
 */
const packageOfInclude = (href: string) => ({
  "imsmanifest.xml": manifestOf(itemResource),
  "item.xml": `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="I" title="Item" time-dependent="false"><qti-item-body><xi:include href="${href}"/></qti-item-body></qti-assessment-item>`,
});

/**
 * Judges the restored-check fixtures and the restored laws' cases with the law oracle. The
 * contrast for the first case, `xml:lang="en"` against a LOM `language` of `fr` breaking "Document
 * lang", is already pinned in `oracle.rv-i.test.ts`.
 */
layer(NodeServices.layer, { excludeTestServices: true })(
  "the law oracle's verdict on the restored fixtures (skipped without the examples tarball)",
  (judging) => {
    judging.effect.skipIf(!tarballPresent)(
      "lang-case-mismatch breaks no law: language tags compare without regard to case",
      () =>
        Effect.gen(function* langCaseMismatch() {
          const dir = yield* materialize("lang-case-mismatch");
          const judgment = yield* judge(yield* readPackage(dir), grammar, laws);

          if (judgment._tag === "CodecRefusal") {
            assert.fail(
              `the codec refused lang-case-mismatch: ${judgment.rule}, ${judgment.detail}`,
            );
          }

          assert.deepStrictEqual(judgment.breaches, [], shown(judgment.breaches));
          assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
        }),
    );

    judging.effect(
      "an item body's xi:include of an external href breaks nothing: it is stored and never fetched (reading 115)",
      () =>
        Effect.gen(function* externalInclude() {
          const judgment = yield* judged(packageOfInclude("https://example.org/f.xml"));

          assert.deepStrictEqual(breachesOf(judgment), [], shown(breachesOf(judgment)));
          assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
        }),
    );

    judging.effect("an xi:include naming no listed entry still breaks Include target", () =>
      Effect.gen(function* missingInclude() {
        const breaches = breachesOf(yield* judged(packageOfInclude("f.xml")));

        assert.isAbove(
          breaches.filter(({ law }) => law === "Include target").length,
          0,
          shown(breaches),
        );
      }),
    );
  },
);
