import { existsSync } from "node:fs";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect } from "effect";
import { readPackage } from "#pantry/package/read.ts";
import { examplesTarball, materialize } from "#pantry/test/fixtures.ts";
import { judge, verdictOf } from "#pantry/test/oracle.ts";
import {
  asi,
  base,
  breachesOf,
  edit,
  item,
  itemResource,
  judged,
  grammar,
  laws,
  manifestOf,
  shown,
  withItem,
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
 * The base package with its response declared a string and mapped by the given entries.
 *
 * @param entries - The mapping's `qti-map-entry` elements, as written.
 * @returns The package's files, by path.
 */
const packageOfMapping = (entries: string) => ({
  ...base,
  "item.xml": edit(
    item,
    "</qti-correct-response>",
    `</qti-correct-response><qti-mapping default-value="0">${entries}</qti-mapping>`,
  ).replace('base-type="identifier"', 'base-type="string"'),
});

/**
 * The base item with its response processing's `qti-match` replaced by a `qti-pattern-match` of the
 * given `pattern`, over a string literal.
 *
 * @param pattern - The `pattern`, as written.
 * @returns The package's files, by path.
 */
const packageOfPattern = (pattern: string) =>
  withItem(
    '<qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>',
    `<qti-pattern-match pattern="${pattern}"><qti-base-value base-type="string">x</qti-base-value></qti-pattern-match>`,
  );

/**
 * Count the breaches of one law in a judged package.
 *
 * @param files - The package's files, by path.
 * @param law - The law's name.
 * @returns The number of breaches of the law.
 */
const breachesOfLaw = (files: Readonly<Record<string, string>>, law: string) =>
  judged(files).pipe(
    Effect.map((judgment) => breachesOf(judgment).filter((breach) => breach.law === law).length),
  );

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

    judging.effect(
      "a string mapping's keys that differ only in ASCII case break Map key, as the default case-sensitive false matches them (reading 98)",
      () =>
        Effect.gen(function* foldedKeys() {
          const clash = (first: string, second: string) =>
            breachesOfLaw(
              packageOfMapping(
                `<qti-map-entry map-key="${first}" mapped-value="1"/><qti-map-entry map-key="${second}" mapped-value="2"/>`,
              ),
              "Map key",
            );

          assert.strictEqual(yield* clash("York", "york"), 1, "two default entries fold together");
          assert.strictEqual(
            yield* breachesOfLaw(
              packageOfMapping(
                `<qti-map-entry map-key="York" case-sensitive="true" mapped-value="1"/><qti-map-entry map-key="york" mapped-value="2"/>`,
              ),
              "Map key",
            ),
            0,
            "a case-sensitive entry beside a default one is two keys",
          );
          assert.strictEqual(
            yield* breachesOfLaw(
              packageOfMapping(
                `<qti-map-entry map-key="York" case-sensitive="true" mapped-value="1"/><qti-map-entry map-key="york" case-sensitive="true" mapped-value="2"/>`,
              ),
              "Map key",
            ),
            0,
            "two case-sensitive entries compare by code points",
          );
          assert.strictEqual(
            yield* breachesOfLaw(
              packageOfMapping(
                `<qti-map-entry map-key="York" case-sensitive="true" mapped-value="1"/><qti-map-entry map-key="York" case-sensitive="1" mapped-value="2"/>`,
              ),
              "Map key",
            ),
            1,
            "one string matched the same way twice still clashes",
          );
          assert.strictEqual(yield* clash("\u00C9", "\u00E9"), 0, "the fold is ASCII only");
        }),
    );

    judging.effect(
      "a braced qti-pattern-match pattern that names no declared variable is a string value in an item (reading R15-k)",
      () =>
        Effect.gen(function* unresolvedPattern() {
          for (const files of [packageOfPattern("{NOSUCH}"), packageOfPattern("{NOSUCH.SCORE}")]) {
            const judgment = yield* judged(files);

            assert.deepStrictEqual(breachesOf(judgment), [], shown(breachesOf(judgment)));
            assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
          }
        }),
    );

    judging.effect(
      "a braced pattern that names a variable of the wrong kind or base type still breaks Reference type, and an unresolved bare reference still breaks Variable declared (reading R15-k)",
      () =>
        Effect.gen(function* resolvedPattern() {
          for (const name of ["RESPONSE", "SCORE"]) {
            assert.strictEqual(
              yield* breachesOfLaw(packageOfPattern(`{${name}}`), "Reference type"),
              1,
              `{${name}} is no string single template or outcome variable`,
            );
          }

          assert.strictEqual(
            yield* breachesOfLaw(
              withItem(
                '<qti-variable identifier="RESPONSE"/>',
                '<qti-variable identifier="NOSUCH"/>',
              ),
              "Variable declared",
            ),
            1,
            "a bare unresolved reference names nothing",
          );
        }),
    );

    judging.effect.skipIf(!tarballPresent)(
      "a usage value outside a record is untyped text whatever baseType it writes, and inside a record it is typed (reading 105)",
      () =>
        Effect.gen(function* usageValue() {
          const files = yield* readPackage(yield* materialize("usage3-integer-float"));
          const typed = (text: (original: string) => string) =>
            judge(
              files.map((file) =>
                file.path === "example.xml"
                  ? {
                      ...file,
                      bytes: new TextEncoder().encode(text(new TextDecoder().decode(file.bytes))),
                    }
                  : file,
              ),
              grammar,
              laws,
            ).pipe(
              Effect.map(
                (judgment) =>
                  breachesOf(judgment).filter(({ law }) => law === "Usage typed value").length,
              ),
            );

          assert.strictEqual(yield* typed((xml) => xml), 0, "outside a record");
          assert.strictEqual(
            yield* typed((xml) =>
              edit(
                xml,
                '<value baseType="integer">',
                '<value baseType="integer" fieldIdentifier="F">',
              ),
            ),
            1,
            "inside a record",
          );
        }),
    );
  },
);
