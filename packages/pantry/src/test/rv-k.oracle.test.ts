/**
 * The law oracle on slice K's content-model readings (RV, Aiden's review of PR #46): spec reading
 * 130, the loose LOM binding's Schematron caps, as N7 Counted; and spec reading 44, no SSML `voice`
 * in a `token` or a `w`, over the restated `tokenType`.
 *
 * A `voice` in a `token` is refused before any law reads it: a name resolves by the kinds its
 * parent admits (`src/grammar/compose.ts`), so where the restated model names no `voice`, shred
 * has no kind for it, and the codec refuses it as `unmodeled-vocabulary`, as it refuses every
 * element its parent's model does not name.
 *
 * Oracle: the specifications' sentences turned into packages. Each refused package breaks one
 * sentence the reading quotes, beside the nearest package that keeps it, which no law refuses.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf, ruleOf, shownBreach, verdictOf } from "#pantry/test/oracle.ts";
import type { Breach, Judgment } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The base item: one choice interaction bound to an identifier response, and a paragraph the SSML
 * cases follow.
 */
const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>
  <qti-item-body>
    <p id="intro">Pick one.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

/**
 * Write the manifest of the base item.
 *
 * @param metadata - The item resource's metadata, as written, empty for none.
 * @returns The manifest's text.
 */
const manifestOf = (metadata: string): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml">${metadata}<file href="item.xml"/></resource></resources>
</manifest>`;

/**
 * Build a package from its files' texts, each encoded as UTF-8, as `readEntries` returns one.
 *
 * @param files - Each file's text by path; `imsmanifest.xml` is the manifest.
 * @returns The entries, sorted by path.
 */
const packageOf = (files: Readonly<Record<string, string>>): readonly PackageFile[] =>
  Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));

/**
 * Read the breaches of a judgment the codec did not refuse.
 *
 * @param judgment - The judgment.
 * @returns Its breaches.
 */
const breachesOf = (judgment: Judgment): readonly Breach[] =>
  judgment._tag === "Judged"
    ? judgment.breaches
    : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);

/**
 * Judge the base item under a manifest whose resource carries a LOM record.
 *
 * @param lom - The `lom` element's content.
 * @returns The judgment's breaches.
 */
const withRecord = (lom: string) =>
  judge(
    packageOf({
      "imsmanifest.xml": manifestOf(
        `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM">${lom}</lom></metadata>`,
      ),
      "item.xml": item,
    }),
    grammar,
    laws,
  ).pipe(Effect.map(breachesOf));

/**
 * Judge the base item with one SSML `speak` fragment after its paragraph, under a manifest with no
 * metadata.
 *
 * @param content - The fragment's content.
 * @returns The judgment.
 */
const withSpeech = (content: string) =>
  judge(
    packageOf({
      "imsmanifest.xml": manifestOf(""),
      "item.xml": item.replace(
        `<p id="intro">Pick one.</p>`,
        `<p id="intro">Pick one.</p><p><ssml:speak xmlns:ssml="http://www.w3.org/2001/10/synthesis" version="1.1" xml:lang="en">${content}</ssml:speak></p>`,
      ),
    }),
    grammar,
    laws,
  );

/**
 * Write a judgment's breaches as `law: rule` lines, for an assertion's message.
 *
 * @param breaches - The breaches.
 * @returns One line per breach.
 */
const shown = (breaches: readonly Breach[]): string =>
  breaches.map((breach) => shownBreach(breach, grammar)).join("\n");

/**
 * A LOM general category's title, as the base item's title reads.
 */
const title = "<title><string>Item</string></title>";

/**
 * A LOM purpose of the binding's vocabulary.
 *
 * @param value - Its value.
 * @returns The purpose, as written.
 */
const purpose = (value: string): string =>
  `<purpose><source>LOMv1.0</source><value>${value}</value></purpose>`;

describe("spec reading 130: the loose LOM binding's Schematron caps, as N7 Counted", () => {
  for (const { lom, name } of [
    {
      lom: `<general>${title}</general><general><keyword><string>k</string></keyword></general>`,
      name: "two general categories in one record (lom:lom, line 567)",
    },
    { lom: `<general>${title}${title}</general>`, name: "two titles in one general (line 387)" },
    {
      lom: `<classification>${purpose("discipline")}${purpose("idea")}</classification>`,
      name: "two purposes in one classification (line 145)",
    },
  ]) {
    it.effect(`refuses ${name} under child-set`, () =>
      Effect.gen(function* capped() {
        const breaches = yield* withRecord(lom);

        assert.isTrue(
          breaches.some(({ law }) => law === "N7 Counted"),
          shown(breaches),
        );
        assert.strictEqual(ruleOf("N7 Counted"), "child-set");
      }),
    );
  }

  for (const { lom, name } of [
    {
      lom: `<general>${title}<keyword><string>a</string></keyword><keyword><string>b</string></keyword></general>`,
      name: "two keywords in one general, which the binding leaves unbounded",
    },
    {
      lom: `<general>${title}</general><classification>${purpose("discipline")}</classification><classification>${purpose("idea")}</classification>`,
      name: "one title, and two classifications of one purpose each, which the binding leaves unbounded",
    },
  ]) {
    it.effect(`accepts ${name}`, () =>
      Effect.gen(function* uncapped() {
        const breaches = yield* withRecord(lom);

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
    );
  }
});

describe("spec reading 44: no SSML voice in a token or a w", () => {
  for (const parent of ["token", "w"]) {
    it.effect(`refuses a voice inside a ${parent} under unmodeled-vocabulary, naming both`, () =>
      Effect.gen(function* voiceInToken() {
        const judgment = yield* withSpeech(
          `<ssml:${parent}><ssml:voice gender="female">x</ssml:voice></ssml:${parent}>`,
        );

        assert.deepStrictEqual(verdictOf(judgment), {
          rule: "unmodeled-vocabulary",
          verdict: "refused",
        });
        assert.include(
          judgment._tag === "CodecRefusal" ? judgment.detail : "",
          `ssml:voice in ssml:${parent}`,
        );
      }),
    );
  }

  for (const { content, name } of [
    {
      content: `<ssml:w><ssml:prosody rate="slow">x</ssml:prosody></ssml:w>`,
      name: "a prosody inside a w",
    },
    {
      content: `<ssml:voice gender="female"><ssml:token>x</ssml:token></ssml:voice>`,
      name: "a token inside a voice",
    },
    {
      content: `<ssml:token><ruby xmlns="urn:x-ruby">x</ruby></ssml:token>`,
      name: "an element of another namespace inside a token (SSML 1.1 §2.2.3)",
    },
  ]) {
    it.effect(`accepts ${name}`, () =>
      Effect.gen(function* tokenContent() {
        const breaches = breachesOf(yield* withSpeech(content));

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
    );
  }
});
