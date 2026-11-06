import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * The cached Results Reporting XSD, named relative to the XSD cache.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * The cached QTI 3.0.1 ASI XSD, which imports MathML and SSML through their purl locations.
 */
const asiXsd = "imsqti_asiv3p0p1_v1p0.xsd";

/**
 * The corpus folder that holds 1EdTech's Results Reporting examples.
 */
const resultsFolder = "qtiv3-examples/results";

/**
 * An xmllint path that names no file: one beside this test that does not exist.
 */
const nowhere = path.join(import.meta.dirname, "no-such-xmllint");

/**
 * The ASI XSD compiles from about 18 MB of schema text on every run, which takes xmllint a second
 * or two on an idle machine; the load cap lets the machine run far busier than that.
 */
const asiTimeoutMs = 120_000;

/**
 * Read one of the corpus's Results examples as text.
 *
 * @param name The file's name in the corpus's Results folder.
 * @returns The document's text.
 */
const resultsExample = (name: string) =>
  readCorpusFile(`${resultsFolder}/${name}`).pipe(
    Effect.map((bytes) => new TextDecoder().decode(bytes)),
  );

/**
 * A QTI 3 item written for this test, whose body holds one MathML expression.
 *
 * @param element The MathML element inside `math`.
 * @returns The item's text.
 */
const itemWithMath = (element: string): string =>
  [
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="xsd-oracle"',
    ' title="XSD oracle" adaptive="false" time-dependent="false">',
    "<qti-item-body><p>Solve ",
    `<math xmlns="http://www.w3.org/1998/Math/MathML"><${element}>x</${element}></math>`,
    ".</p></qti-item-body></qti-assessment-item>",
  ].join("");

describe("test/xsd.ts", () => {
  it.effect(
    "report.xml and conformance-use-case-1.xml validate against the Results XSD, naming xmllint's path and version",
    () =>
      Effect.gen(function* validExamples() {
        for (const name of ["report.xml", "conformance-use-case-1.xml"]) {
          const result = yield* validateAgainst(resultsXsd, yield* resultsExample(name));

          assert.isTrue(result.valid, `${name}: ${result.messages.join("\n")}`);
          assert.isTrue(path.isAbsolute(result.binary.path), result.binary.path);
          assert.strictEqual(path.basename(result.binary.path), "xmllint");
          assert.include(result.binary.version, "libxml");
        }
      }),
    { tags: ["corpus", "qti-xsd"] },
  );

  it.effect(
    "full-example.xml, which is not well-formed, does not validate",
    () =>
      Effect.gen(function* notWellFormed() {
        const result = yield* validateAgainst(
          resultsXsd,
          yield* resultsExample("full-example.xml"),
        );

        assert.isFalse(result.valid);
        assert.isNotEmpty(result.messages);
      }),
    { tags: ["corpus", "qti-xsd"] },
  );

  it.effect(
    "a well-formed document the XSD refuses does not validate, with xmllint's messages",
    () =>
      Effect.gen(function* refused() {
        const result = yield* validateAgainst(
          resultsXsd,
          '<assessmentResult xmlns="http://www.imsglobal.org/xsd/imsqti_result_v3p0"><unexpected/></assessmentResult>',
        );

        assert.isFalse(result.valid);
        assert.isTrue(
          result.messages.some((line) => line.includes("unexpected")),
          result.messages.join("\n"),
        );
      }),
    { tags: ["qti-xsd"] },
  );

  it.effect(
    "the catalog reaches MathML: an item's math validates against the 3.0.1 ASI XSD, and an element MathML lacks does not",
    () =>
      Effect.gen(function* mathml() {
        const valid = yield* validateAgainst(asiXsd, itemWithMath("mi"));
        const refused = yield* validateAgainst(asiXsd, itemWithMath("mbogus"));

        assert.isTrue(valid.valid, valid.messages.join("\n"));
        assert.isFalse(refused.valid);
        assert.isTrue(
          refused.messages.some((line) => line.includes("mbogus")),
          refused.messages.join("\n"),
        );
      }),
    { tags: ["qti-xsd"], timeout: asiTimeoutMs },
  );

  it.effect("PLATE_XMLLINT naming no file fails with XmllintMissing, naming the setting", () =>
    Effect.gen(function* missing() {
      const error = yield* Effect.flip(
        validateAgainst(resultsXsd, "<x/>").pipe(
          Effect.provide(
            ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_XMLLINT: nowhere })),
          ),
        ),
      );

      assert.strictEqual(error._tag, "XmllintMissing");

      if (error._tag === "XmllintMissing") {
        assert.strictEqual(error.setting, "PLATE_XMLLINT");
        assert.strictEqual(error.value, nowhere);
      }
    }),
  );

  it.effect("an XSD that does not exist fails with XsdUnusable, not an invalid verdict", () =>
    Effect.gen(function* unusable() {
      const error = yield* Effect.flip(validateAgainst("no-such-schema.xsd", "<x/>"));

      assert.strictEqual(error._tag, "XsdUnusable");

      if (error._tag === "XsdUnusable") {
        assert.strictEqual(path.basename(error.xsd), "no-such-schema.xsd");
        assert.isNotEmpty(error.messages);
      }
    }),
  );
});
