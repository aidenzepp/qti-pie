/**
 * The extension-rules deriver's tests (spec reading 90), each against an independent oracle:
 *
 * - **The pinned XSDs, read as text.** Over the cache, the leaf is what a re-run prints, after `vp
 *   fmt`, byte for byte, and its elements per version are exactly the `//qti:<local>` contexts a
 *   regular expression finds in the raw text of the three data-extension patterns, with no XML
 *   reader between: 126 in 3.0.0 and 127 in 3.0.1, as reading 90 counts them. Skipped, with its
 *   reason, without the pinned cache.
 * - **A naive model of the reading, over generated Schematron.** Toy schemas of up to six rules, each
 *   a valid rule, a repeated element, a rule of another pattern, or one of the named invalid
 *   contexts (another shape, a prefix no `sch:ns` declares, a namespace of no vocabulary), are read
 *   by `coveredIn` and by a model written from the reading rules: the two agree on the refusal or
 *   on the elements and their lines, and every variant is a required situation of the search.
 */
import path from "node:path";
import { NodeChildProcessSpawner, NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import {
  Array as Arr,
  Duration,
  Effect,
  FileSystem,
  Formatter,
  Layer,
  Option,
  Result,
} from "effect";
import { Digest } from "effect/crypto";
import { readXml } from "@qti-pie/crust/read.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { vpFmt } from "#pantry/test/vp-fmt.ts";
import {
  coveredIn,
  extensionPatterns,
  extensionSources,
  loadCovered,
  renderExtensions,
  schematronNamespace,
} from "#pantry/vocab/derive/extensions.ts";
import { checkCache, xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import { coveredElements } from "#pantry/vocab/inventory/extensions.ts";
import { asiNamespace, mathmlNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The package folder, `packages/pantry`, which the committed leaf and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * The leaf, relative to {@link packageRoot}.
 */
const leafPath = "src/vocab/inventory/extensions.ts";

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when every pinned
 * XSD is present.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, of the cache-gated tests: each reads both ASI XSDs, 37 MB, which
 * took 37 s for the deriver's run on 2026-11-05 at a load average near 45. The budget is four
 * times that.
 */
const cacheTimeoutMs = 150_000;

/**
 * How long one search case may run: each reads one small document.
 */
const caseHang = Duration.seconds(30);

/**
 * The services the cache-gated tests read through: the file system, SHA-256 and `vp fmt`.
 */
const SuiteLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  NodeChildProcessSpawner.layer,
).pipe(Layer.provide(NodeServices.layer));

/**
 * The `//qti:<local>` contexts of the data-extension patterns in an ASI XSD's raw text, each
 * pattern from its start tag to the next `</sch:pattern>`.
 *
 * @param text - The XSD's text.
 * @returns The local names, each once.
 */
const contextsInText = (text: string): ReadonlySet<string> =>
  new Set(
    extensionPatterns.flatMap((id) => {
      const start = text.indexOf(`<sch:pattern abstract="false" id="${id}">`);
      const body = start === -1 ? "" : text.slice(start, text.indexOf("</sch:pattern>", start));

      return [...body.matchAll(/context="\/\/qti:(?<local>[a-z0-9-]+)"/gu)].flatMap((found) =>
        Option.toArray(Option.fromNullishOr(found.groups?.["local"])),
      );
    }),
  );

if (Option.isSome(absence)) {
  it("derives the extension-rules leaf from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/extensions.ts over the pinned XSDs", () => {
  layer(SuiteLayer, { timeout: cacheTimeoutMs })("from the cache", (cached) => {
    cached.effect(
      "regenerates the leaf byte for byte after vp fmt",
      () =>
        Effect.gen(function* regenerate() {
          const fs = yield* FileSystem.FileSystem;

          assert.strictEqual(
            yield* vpFmt(renderExtensions(yield* loadCovered()), leafPath),
            yield* fs.readFileString(`${packageRoot}/${leafPath}`),
          );
        }),
      cacheTimeoutMs,
    );

    cached.effect(
      "covers exactly the contexts the raw text of each version's patterns names, 126 and 127",
      () =>
        // Oracle: the pinned XSDs as text, read by a regular expression and no XML reader; the
        // counts are reading 90's.
        Effect.gen(function* againstTheText() {
          const fs = yield* FileSystem.FileSystem;
          const directory = yield* xsdDirectory;
          const counts: number[] = [];
          for (const version of schemaVersions) {
            const text = yield* fs.readFileString(`${directory}/${extensionSources[version]}`);
            const expected = contextsInText(text);
            const leaf = coveredElements
              .filter(({ versions }) => versions.some((held) => held === version))
              .map(({ element: named }) => named);

            assert.deepStrictEqual(
              new Set(leaf.map(({ local }) => local)),
              expected,
              `${version}'s covered elements`,
            );
            assert.isTrue(leaf.every(({ namespace }) => namespace === asiNamespace));
            counts.push(expected.size);
          }

          assert.deepStrictEqual(counts, [126, 127]);
        }),
      cacheTimeoutMs,
    );
  });
});

/**
 * The named variants of one generated rule:
 *
 * - `valid`: `//p:<local>` in an extension pattern, `p` bound to the ASI namespace;
 * - `repeated`: a valid rule naming an element an earlier rule named;
 * - `other-pattern`: a rule of a pattern no data-extension id names, whatever its context;
 * - `wrong-shape`: a context other than `//<prefix>:<local>`;
 * - `unbound-prefix`: a prefix no `sch:ns` declares;
 * - `no-vocabulary`: a prefix bound to a namespace no vocabulary is in.
 */
const ruleVariants = [
  "valid",
  "repeated",
  "other-pattern",
  "wrong-shape",
  "unbound-prefix",
  "no-vocabulary",
] as const;

/**
 * A rule variant.
 */
type RuleVariant = (typeof ruleVariants)[number];

/**
 * The variants a reader must refuse.
 */
const refused: ReadonlySet<RuleVariant> = new Set([
  "wrong-shape",
  "unbound-prefix",
  "no-vocabulary",
]);

/**
 * One generated rule: its variant, the pattern it stands in, its context and the local name a valid
 * context names.
 */
interface ToyRule {
  readonly context: string;
  readonly local: string;
  readonly pattern: string;
  readonly variant: RuleVariant;
}

/**
 * The local names a toy rule names.
 */
const toyLocals = ["div", "span", "qti-prompt", "m-like"] as const;

/**
 * The contexts of another form than `//<prefix>:<local>`: a child step, a path of two steps, no
 * step and an unprefixed name.
 *
 * @param local - The local name they name.
 * @returns The contexts.
 */
const otherContexts = (local: string): Arr.NonEmptyReadonlyArray<string> => [
  `/p:${local}`,
  `//p:${local}/p:b`,
  `p:${local}`,
  `//${local}`,
];

/**
 * Draw one rule of a variant, its local name among {@link toyLocals}, a `repeated` one among those
 * drawn before it.
 *
 * @param before - The local names the valid rules before it named.
 * @returns The generator.
 */
const ruleGen =
  (before: readonly string[]): Gen<ToyRule> =>
  (source) => {
    const variant = source.draw(
      weighted<RuleVariant>([
        [6, () => "valid"],
        ...ruleVariants
          .filter((held) => held !== "valid" && (held !== "repeated" || before.length > 0))
          .map((held) => [1, () => held] as const),
      ]),
    );
    const local =
      variant === "repeated" && Arr.isReadonlyArrayNonEmpty(before)
        ? source.draw(element(before))
        : source.draw(element(toyLocals));
    const pattern =
      variant === "other-pattern" ? "RULE_SET_GENERAL_1" : source.draw(element(extensionPatterns));
    const context = {
      "no-vocabulary": `//z:${local}`,
      "other-pattern": source.draw(
        element([`//p:${local}`, ...otherContexts(local), `//u:${local}`]),
      ),
      repeated: `//p:${local}`,
      "unbound-prefix": `//u:${local}`,
      valid: `//p:${local}`,
      "wrong-shape": source.draw(element(otherContexts(local))),
    }[variant];

    return { context, local, pattern, variant };
  };

/**
 * Draw a toy schema's rules: up to six, each drawn knowing the elements the valid ones before it
 * name.
 */
const rulesGen: Gen<readonly ToyRule[]> = (source) => {
  const count = source.draw(int(1, 6));
  const rules: ToyRule[] = [];
  for (let at = 0; at < count; at += 1) {
    const named = rules
      .filter(({ variant }) => variant === "valid" || variant === "repeated")
      .map(({ local }) => local);
    rules.push(source.draw(ruleGen([...new Set(named)])));
  }

  return rules;
};

/**
 * A toy schema's text, and the line each of its rules' start tags stands on.
 */
interface ToySchema {
  readonly lines: readonly number[];
  readonly text: string;
}

/**
 * Write a toy schema whose every element stands on a line of its own, from line 1, each rule its
 * own pattern, and the line each rule's start tag stands on: the schema, an annotation, the
 * `sch:ns` declarations of `p` (the ASI namespace) and `z` (a namespace of no vocabulary), then
 * each rule after its pattern.
 *
 * @param rules - The rules.
 * @returns The text and each rule's line.
 */
const toySchema = (rules: readonly ToyRule[]): ToySchema => {
  const head = [
    `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:sch="${schematronNamespace}">`,
    "<xs:annotation>",
    "<xs:appinfo>",
    `<sch:ns uri="${asiNamespace}" prefix="p"/>`,
    `<sch:ns uri="urn:no-vocabulary" prefix="z"/>`,
  ];
  const body = rules.flatMap(({ context, pattern }) => [
    `<sch:pattern abstract="false" id="${pattern}">`,
    `<sch:rule abstract="false" context="${context}"/>`,
    "</sch:pattern>",
  ]);

  return {
    lines: rules.map((_rule, at) => head.length + 3 * at + 2),
    text: [...head, ...body, "</xs:appinfo>", "</xs:annotation>", "</xs:schema>"].join("\n"),
  };
};

/**
 * The start-tag lines of a toy schema in document order: one element per line, every line but
 * the closing tags'.
 *
 * @param text - The schema.
 * @returns The lines.
 */
const startLines = (text: string): readonly number[] =>
  text.split("\n").flatMap((line, at) => (line.startsWith("</") ? [] : [at + 1]));

describe("coveredIn, over generated Schematron", () => {
  it.effect(
    "refuses exactly the named invalid contexts, and reads every other rule set as the reading rules say",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<RuleVariant>(ruleVariants, { cases: 300, sense: notesOnly }),
            draw: drawn(rulesGen),
            kept: [],
            literal: Formatter.format,
            runs: 400,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "vocab/derive-extensions/covered",
          },
          (rules, c) =>
            Effect.gen(function* readRules() {
              for (const { variant } of rules) {
                c.note(variant);
              }

              const { lines, text } = toySchema(rules);
              const document = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
              const read = coveredIn("3.0.1", {
                document,
                file: "imsqti_asiv3p0p1_v1p0.xsd",
                lines: startLines(text),
              });
              // The model: a rule of a data-extension pattern with a refused context refuses the
              // schema; every other one, of those patterns, names its element once, at its first
              // rule's line.
              const extension = rules.flatMap((rule, at) =>
                rule.pattern === "RULE_SET_GENERAL_1" ? [] : [{ line: lines[at] ?? 0, rule }],
              );
              const first = new Map<string, number>();
              for (const { line, rule } of extension) {
                if (!first.has(rule.local)) {
                  first.set(rule.local, line);
                }
              }
              const expected = extension.some(({ rule }) => refused.has(rule.variant))
                ? Option.none()
                : Option.some([...first].map(([local, line]) => `${local}@${String(line)}`));

              assert.deepStrictEqual(
                Result.isSuccess(read)
                  ? Option.some(
                      read.success.map(({ line, local, namespace }) => {
                        assert.strictEqual(namespace, asiNamespace);

                        return `${local}@${String(line)}`;
                      }),
                    )
                  : Option.none(),
                expected,
              );
            }),
        ),
      ),
  );

  it.effect("reads a rule over another vocabulary's element in that vocabulary's namespace", () =>
    // Oracle: the specification as a checker: a context's prefix is resolved through `sch:ns`, so
    // the element is an expanded name, and a namespace a vocabulary is in (MathML) is read.
    Effect.gen(function* otherVocabulary() {
      const text = [
        `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:sch="${schematronNamespace}">`,
        `<sch:ns uri="${mathmlNamespace}" prefix="m"/>`,
        `<sch:pattern abstract="false" id="${extensionPatterns[0]}">`,
        `<sch:rule abstract="false" context="//m:mi"/>`,
        "</sch:pattern>",
        "</xs:schema>",
      ].join("\n");
      const document = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
      const read = coveredIn("3.0.0", {
        document,
        file: "imsqti_asiv3p0_v1p0.xsd",
        lines: startLines(text),
      });

      assert.deepStrictEqual(
        read.pipe(
          Result.map((rows) => rows.map(({ line, local, namespace }) => [namespace, local, line])),
        ),
        Result.succeed([[mathmlNamespace, "mi", 4]]),
      );
    }),
  );
});
