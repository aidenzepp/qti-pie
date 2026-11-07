/**
 * A LOM record's title names its document in the document's language (QTI 3.0 Metadata §2.7.1.2:
 * "The title must have a value that matches the value of the title attribute of the associated
 * item, test or object bank. The language used to interpret the title is taken from the language
 * attribute of the associated item, test or object bank"), and an item states no language where its
 * `xml:lang` names none (spec reading 151): where it writes none, and where its form lies outside
 * its value domain, which AL1 refuses, as the empty one (spec reading 129) and an ill-formed tag
 * (RFC 5646 §2.1) do. The title is then judged without a language: a string with the title's value
 * names the document, whatever its own `language`, and a record with no such string is refused
 * under `lom-title` beside AL1.
 *
 * The law oracle once skipped `lom-title` where the root's `xml:lang` lay outside its domain, so a
 * record titled otherwise passed beside AL1; the import compared an ill-formed tag as written, so a
 * string in a language failed against a tag the root does not state.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), and
 * both against §2.7.1.2 and reading 151 as stated above: the two agree on every case, and each
 * raises `LomObjectTitle` exactly where the case's record has a title none of whose strings holds
 * the root's title in its language; the oracle raises the value domain exactly where the item's
 * `xml:lang` lies outside it.
 *
 * Bound: an item whose `xml:lang` is `en`, empty, `en_GB` or unwritten, and whose record's title
 * is absent, the root's or another, its string's `language` unwritten, `en` or `fr`: 28 cases,
 * exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The root's title, as the record names it.
 */
const rootTitle = "Doc";

/**
 * The item's `xml:lang`: a tag, the empty text, an ill-formed tag (`_` is no subtag separator,
 * RFC 5646 §2.1), or none. Only the tag states a language.
 */
const langs = [
  { lang: Option.some("en"), name: "valid" },
  { lang: Option.some(""), name: "empty" },
  { lang: Option.some("en_GB"), name: "invalid" },
  { lang: Option.none<string>(), name: "absent" },
] as const;

/**
 * What the record's general category writes as its title: nothing, or one string holding the
 * root's title or another, its `language` unwritten, the root's tag or another tag.
 */
type Title =
  | { readonly kind: "absent" }
  | {
      readonly kind: "matching" | "different";
      readonly language: Option.Option<string>;
    };

/**
 * Every title of the bound.
 */
const titles: readonly Title[] = [
  { kind: "absent" },
  ...(["matching", "different"] as const).flatMap((kind) =>
    [Option.none<string>(), Option.some("en"), Option.some("fr")].map((language): Title => ({
      kind,
      language,
    })),
  ),
];

/**
 * One case of the bound.
 */
interface LangCase {
  readonly lang: (typeof langs)[number];
  readonly title: Title;
}

/**
 * Every case of the bound.
 */
const cases: readonly LangCase[] = langs.flatMap((lang) =>
  titles.map((title): LangCase => ({ lang, title })),
);

/**
 * Build a case's package: the manifest, whose item resource's record writes the case's title, and
 * the item, which writes the case's `xml:lang`.
 *
 * @param of - The case.
 * @returns The package's entries.
 */
const packageOf = (of: LangCase): ReadonlyMap<string, Uint8Array> => {
  const general =
    of.title.kind === "absent"
      ? ""
      : `<imsmd:title><imsmd:string${Option.match(of.title.language, {
          onNone: () => "",
          onSome: (language) => ` language="${language}"`,
        })}>${of.title.kind === "matching" ? rootTitle : `other ${rootTitle}`}</imsmd:string></imsmd:title>`;
  const lang = Option.match(of.lang.lang, {
    onNone: () => "",
    onSome: (value) => ` xml:lang="${value}"`,
  });
  const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="doc" title="${rootTitle}"${lang} adaptive="false" time-dependent="false"/>`;
  const manifest = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="object-lang">',
    "  <metadata><schemaversion>3.0.0</schemaversion></metadata>",
    "  <organizations/>",
    "  <resources>",
    '    <resource identifier="doc-res" type="imsqti_item_xmlv3p0" href="doc.xml">',
    `      <metadata><imsmd:lom><imsmd:general>${general}</imsmd:general></imsmd:lom></metadata>`,
    '      <file href="doc.xml"/>',
    "    </resource>",
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifest)],
    ["doc.xml", text.encode(`<?xml version="1.0" encoding="UTF-8"?>\n${item}\n`)],
  ]);
};

/**
 * Name a case.
 *
 * @param of - The case.
 * @returns Its name.
 */
const nameOf = (of: LangCase): string => {
  const language =
    of.title.kind === "absent"
      ? ""
      : Option.match(of.title.language, {
          onNone: () => " with no language",
          onSome: (tag) => ` in ${tag}`,
        });

  return `an item whose xml:lang is ${of.lang.name}, its record's title ${of.title.kind}${language}`;
};

/**
 * Decide, from §2.7.1.2 and reading 151, whether a case's record is refused under `lom-title`: it
 * has a title, and its string does not hold the item's title in the item's language. The item
 * states a language only where its `xml:lang` is a tag, and a string with no `language` is in
 * every language.
 *
 * @param of - The case.
 * @returns Whether `lom-title` refuses the record.
 */
const titleRefused = (of: LangCase): boolean => {
  if (of.title.kind === "absent") {
    return false;
  }

  const stated = of.lang.name === "valid" ? of.lang.lang : Option.none();
  const inLanguage =
    Option.isNone(stated) ||
    Option.isNone(of.title.language) ||
    of.title.language.value === stated.value;

  return !(of.title.kind === "matching" && inLanguage);
};

/**
 * Decide whether AL1's value domain refuses a case's `xml:lang` (spec reading 129): the empty one
 * and the ill-formed one.
 *
 * @param of - The case.
 * @returns Whether the value domain refuses it.
 */
const langRefused = (of: LangCase): boolean =>
  of.lang.name === "empty" || of.lang.name === "invalid";

layer(NodeServices.layer, { excludeTestServices: true })(
  "a LOM record's title in its document's language, as the import's rows hold it",
  (it) => {
    it.effect(
      "judges lom-title without a language where the item's xml:lang states none, unwritten or outside its value domain, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* objectLangRuns() {
            const directory = yield* scratchDirectory("object-lang-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 28);

            return yield* exhaust(
              {
                box: "an item whose xml:lang is a tag, empty, ill-formed or unwritten, its record's title absent, the item's or another, in no language, the item's tag or another",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const of = cases[at];

                  return of === undefined ? String(at) : nameOf(of);
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle and QTI 3.0 Metadata §2.7.1.2 under reading 151, against the laws the import's rows break on the host",
                },
                suite: "pantry/object-lang",
              },
              (at) =>
                Effect.gen(function* objectLangCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(of)), bench, at);
                  const said = `${nameOf(of)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;

                  assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
                  assert.match(judged.summary.import, /^built /u, said);
                  for (const side of [judged.summary.oracle, judged.summary.import]) {
                    assert.strictEqual(/\bLomObjectTitle\b/u.test(side), titleRefused(of), said);
                    assert.notMatch(side, /\bE1 derived\b/u, said);
                  }

                  assert.strictEqual(
                    /\bvalue domain\b/u.test(judged.summary.oracle),
                    langRefused(of),
                    said,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
