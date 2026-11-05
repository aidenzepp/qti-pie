import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { readSource } from "#plate/document/read.ts";
import { qtiNamespace, walk } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * The M2 fixture package, a CP 3.0.1 package written for this repository.
 */
const fixtureDirectory = path.resolve(import.meta.dirname, "..", "..", "fixtures", "m2");

/**
 * The cached QTI 3.0.1 ASI XSD, which governs the test and every item.
 */
const asiXsd = "imsqti_asiv3p0p1_v1p0.xsd";

/**
 * The cached QTI 3.0.1 profile of IMS Content Packaging 1.2, which governs the manifest.
 */
const manifestXsd = "imsqtiv3p0p1_imscpv1p2_v1p0.xsd";

/**
 * The package's QTI documents, relative to its root: the test, then its items in test order.
 */
const qtiDocuments = [
  "test.xml",
  "items/p1-single-choice.xml",
  "items/p1-text-entry.xml",
  "items/p1-multiple-choice.xml",
  "items/p2-extended-text.xml",
  "items/p2-choice.xml",
] as const;

/**
 * The ASI XSD compiles from about 18 MB of schema text on every run, which takes xmllint a second
 * or two on an idle machine; the load cap lets the machine run far busier than that.
 */
const asiTimeoutMs = 120_000;

/**
 * Read one of the package's files.
 *
 * @param file The file's path relative to the package's root.
 * @returns The file's bytes.
 */
const fixtureBytes = (file: string) =>
  Effect.tryPromise(() => readFile(path.join(fixtureDirectory, file)));

/**
 * Read one of the package's files as text.
 *
 * @param file The file's path relative to the package's root.
 * @returns The file's text.
 */
const fixtureText = (file: string) =>
  fixtureBytes(file).pipe(Effect.map((bytes) => new TextDecoder().decode(bytes)));

/**
 * The value of an attribute in no namespace.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns The value as written, or `undefined` when the element does not carry it.
 */
const attributeOf = (element: SourceElement, local: string): string | undefined =>
  element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local)
    ?.value;

describe("fixtures/m2", () => {
  it.effect(
    "the test and every item validate against the QTI 3.0.1 ASI XSD",
    () =>
      Effect.gen(function* qtiValid() {
        for (const file of qtiDocuments) {
          const result = yield* validateAgainst(asiXsd, yield* fixtureText(file));

          assert.isTrue(result.valid, `${file}: ${result.messages.join("\n")}`);
        }
      }),
    asiTimeoutMs * qtiDocuments.length,
  );

  it.effect("the manifest validates against the QTI 3.0.1 profile of CP 1.2", () =>
    Effect.gen(function* manifestValid() {
      const result = yield* validateAgainst(manifestXsd, yield* fixtureText("imsmanifest.xml"));

      assert.isTrue(result.valid, `imsmanifest.xml: ${result.messages.join("\n")}`);
    }),
  );

  it.effect("the multiple-choice item shuffles its choices and fixes one, its last, in place", () =>
    Effect.gen(function* shuffledChoice() {
      const file = "items/p1-multiple-choice.xml";
      const source = yield* readSource(file, yield* fixtureBytes(file));
      const interactions = [...walk(source)]
        .map((visit) => visit.element)
        .filter(
          (element) =>
            element.namespace === qtiNamespace && element.local === "qti-choice-interaction",
        );

      assert.strictEqual(interactions.length, 1);

      const [interaction] = interactions;

      assert.isDefined(interaction);
      assert.strictEqual(attributeOf(interaction, "shuffle"), "true");
      assert.strictEqual(attributeOf(interaction, "max-choices"), "2");

      const choices = interaction.children.filter(
        (child): child is SourceElement =>
          child.kind === "element" && child.local === "qti-simple-choice",
      );
      const fixed = choices.filter((choice) => attributeOf(choice, "fixed") === "true");

      assert.strictEqual(fixed.length, 1);
      assert.strictEqual(fixed[0], choices.at(-1));
    }),
  );
});
