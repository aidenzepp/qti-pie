/**
 * The languages R26 (`document-lang`, QTI 3.0 Metadata §2.7.1.3) asks an item's records to list,
 * as the import's rows hold them beside the law oracle: only those its `xml:lang` forms state, a
 * form stating a language only where its value, collapsed, is a language tag (spec reading 164).
 *
 * §2.7.1.3 asks "one value for each of the languages referred to by the language attributes on the
 * associated assessmentItem ... and its 'bodyElements'". An `xml:lang` refers to a language by a
 * BCP 47 tag (XML 1.0 §2.12), read by its value, its form collapsed (an `xs:language`, spec reading
 * 134); an empty value states none ("just as if xml:lang had not been specified", §2.12), and a
 * form RFC 5646's ABNF does not produce is no tag, so it identifies no language (§2.1 and §2.2.9),
 * as reading 151 reads it for `lom-title`. Such a form refers to no language a record could list,
 * and its value domain refuses it alone (spec reading 129), as a name that names nothing is
 * (reading 152). The import, the schema and the law oracle listed every form but an empty one or
 * one of whitespace alone, so `xml:lang="en_GB"` asked each record for `en_gb`, a value no tag has,
 * and was refused under "Document lang" beside its value domain unless the record wrote that
 * value.
 *
 * The genetic judge (`judgeOne`) cannot hold this: its host never holds "Document lang", since the
 * law reads counts the database draws through a selection by pattern. So the import's rows are
 * judged here by the schema's statements of R26 on the host, its counts drawn from the rows.
 *
 * An assessment object's `ObjectLang` row is the root's `xml:lang`, copied both ways: a row planted
 * for a root that writes none is refused under "E1 derived".
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * schema's R26 over the import's rows (`documentLang` and `assembledLang` of
 * `#pantry/qti/identity.ts`, its witnesses' containments into their categories' languages and
 * their `E1_derived`), and both against §2.7.1.3 under readings 134 and 164 as stated above, each
 * form's tagness read off RFC 5646 by hand: the three refuse one set of forms under "Document
 * lang", and the oracle refuses a form under its value domain exactly where it lies outside it. And
 * the host verdict over the import's rows with an `ObjectLang` row planted.
 *
 * Bound: an item whose root, or a body element, writes each of nine `xml:lang` forms (unwritten,
 * three tags, the empty one, one of whitespace alone and three that are no tag), its record's one
 * general category listing nothing, `en`, `en-gb` or `en_gb`: 72 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, FileSystem, Option, Predicate } from "effect";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { statedLanguagePattern } from "#pantry/qti/identity.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostVerdictOf, viewOf } from "#pantry/test/gen/genetic/host-laws.ts";
import type { Row } from "#pantry/test/gen/genetic/host-laws.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the installed grammar.
 */
const laws = lawsOf(grammar);

/**
 * One `xml:lang` form the box writes, and what RFC 5646 makes of its value, collapsed: the tag it
 * is, folded to small letters, or none for a form that is no tag.
 */
interface Form {
  readonly tag: Option.Option<string>;
  readonly written: Option.Option<string>;
}

/**
 * The forms: none written; `en`, `EN-gb` and ` en `, whose collapsed values are tags; the empty one
 * and one of whitespace alone, which state no language (XML 1.0 §2.12); and `en_GB` (`_` is no
 * subtag separator, RFC 5646 §2.1), `a-value` (a lone `a` is no language subtag, §2.1, reading 129)
 * and `english language` (whitespace is no part of a tag, §2.1), which are no tag.
 */
const forms: readonly Form[] = [
  { tag: Option.none(), written: Option.none() },
  { tag: Option.some("en"), written: Option.some("en") },
  { tag: Option.some("en-gb"), written: Option.some("EN-gb") },
  { tag: Option.some("en"), written: Option.some(" en ") },
  { tag: Option.none(), written: Option.some("") },
  { tag: Option.none(), written: Option.some(" ") },
  { tag: Option.none(), written: Option.some("en_GB") },
  { tag: Option.none(), written: Option.some("a-value") },
  { tag: Option.none(), written: Option.some("english language") },
];

/**
 * Where the form is written: on the item's root, whose `xml:lang` is never empty (information model
 * §4.1.4, reading 129), or on a `p` of its body, whose may be.
 */
type Place = "body" | "root";

/**
 * The languages the record's one general category lists: none, two tags, and `en_gb`, the value
 * the old reading asked of `en_GB`.
 */
const listings: readonly (readonly string[])[] = [[], ["en"], ["en-gb"], ["en_gb"]];

/**
 * One case of the box.
 */
interface LangCase {
  readonly form: Form;
  readonly listing: readonly string[];
  readonly place: Place;
}

/**
 * Every case of the box.
 */
const cases: readonly LangCase[] = (["root", "body"] as const).flatMap((place) =>
  forms.flatMap((form) => listings.map((listing): LangCase => ({ form, listing, place }))),
);

/**
 * A situation the box must reach.
 */
type Situation = "a tag listed" | "a tag unlisted" | "no language" | "no tag";

/**
 * Name a case.
 *
 * @param of - The case.
 * @returns Its name.
 */
const nameOf = (of: LangCase): string =>
  `${Option.match(of.form.written, {
    onNone: () => "no xml:lang",
    onSome: (written) => `xml:lang=${JSON.stringify(written)} on the ${of.place}`,
  })}, its record listing ${JSON.stringify(of.listing)}`;

/**
 * The attribute a case writes, empty where it writes none.
 *
 * @param of - The case.
 * @returns The attribute's text in a start tag.
 */
const langAttribute = (of: LangCase): string =>
  Option.match(of.form.written, {
    onNone: () => "",
    onSome: (written) => ` xml:lang="${written}"`,
  });

/**
 * Build a case's package: an item whose root or body `p` writes the case's `xml:lang`, and a
 * manifest whose resource names it by `href` (spec reading 93), its record's general category
 * listing the case's languages.
 *
 * @param of - The case.
 * @returns The package's entries.
 */
const packageOf = (of: LangCase): PackageEntries => {
  const languages = of.listing.map((language) => `<imsmd:language>${language}</imsmd:language>`);
  const root = of.place === "root" ? langAttribute(of) : "";
  const body = of.place === "body" ? langAttribute(of) : "";
  const text = new TextEncoder();

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><metadata><imsmd:lom><imsmd:general>${languages.join("")}</imsmd:general></imsmd:lom></metadata><file href="item.xml"/></resource></resources></manifest>\n`,
      ),
    ],
    [
      "item.xml",
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false"${root}><qti-item-body><p${body}>Hi</p></qti-item-body></qti-assessment-item>\n`,
      ),
    ],
  ]);
};

/**
 * Decide, from §2.7.1.3 under readings 134 and 164, the forms "Document lang" refuses in a case:
 * its form, where it states a tag the record's category does not list, without regard to case.
 *
 * @param of - The case.
 * @returns The refused forms, as written.
 */
const refusedForms = (of: LangCase): readonly string[] =>
  Option.match(Option.all({ tag: of.form.tag, written: of.form.written }), {
    onNone: () => [],
    onSome: ({ tag, written }) => (of.listing.includes(tag) ? [] : [written]),
  });

/**
 * Decide whether a case's form lies outside its value domain (spec reading 129): one that is no
 * tag, but the empty one on a body element, whose `xml:lang` may be empty (XML 1.0 §2.12).
 *
 * @param of - The case.
 * @returns Whether the value domain refuses it.
 */
const outsideDomain = (of: LangCase): boolean =>
  Option.isSome(of.form.written) &&
  Option.isNone(of.form.tag) &&
  !(of.place === "body" && Option.contains(of.form.written, ""));

/**
 * The schema's stated forms, `statedLanguagePattern` read on the host.
 */
const stated = new RegExp(statedLanguagePattern, patternFlags);

/**
 * Read a row's text field.
 *
 * @param row - The row.
 * @param field - The field.
 * @returns Its text.
 */
const textOf = (row: Row, field: string): string => {
  const value = row[field];

  return Predicate.isString(value) ? value : assert.fail(`the row holds no text in ${field}`);
};

/**
 * Count the rows of a relation whose fields hold the given texts.
 *
 * @param rows - The relation's rows.
 * @param fields - The fields and their texts.
 * @returns The count.
 */
const countOf = (rows: readonly Row[], fields: Readonly<Record<string, string>>): number =>
  rows.filter((row) => Object.entries(fields).every(([field, text]) => textOf(row, field) === text))
    .length;

/**
 * What the schema's R26 says of a package's rows on the host: the forms it refuses, as written, and
 * the forms of the witnesses that state no language.
 */
interface HostDocumentLang {
  readonly refused: readonly string[];
  readonly unstated: readonly string[];
}

/**
 * Judge the schema's R26 on the host over a package's rows: each form that states a language
 * ({@link stated}) counts as many witnesses, a document's (`GeneralLang`) and an assembly's
 * (`PlacedGeneralLang`), as general categories describe its document (`GeneralObject`), the counts
 * the database draws; each witness's value is a language its category lists
 * (`ResourceLomLanguageSet`), its containment; and every witness is a stated form's (its
 * `E1_derived`).
 *
 * @param view - The rows by relation.
 * @returns The forms the law refuses, and the witnesses of a form that states none.
 */
const documentLangOf = (view: ReadonlyMap<string, readonly Row[]>): HostDocumentLang => {
  const rowsOf = (relation: string): readonly Row[] => view.get(relation) ?? [];
  const objects = rowsOf("GeneralObject");
  const witnesses = [...rowsOf("GeneralLang"), ...rowsOf("PlacedGeneralLang")];
  const listed = new Set(
    rowsOf("ResourceLomLanguageSet").map((row) =>
      JSON.stringify([textOf(row, "general"), textOf(row, "lang")]),
    ),
  );
  const unlisted = witnesses.filter(
    (witness) =>
      !listed.has(JSON.stringify([textOf(witness, "general"), textOf(witness, "value")])),
  );
  const documentForms = rowsOf("DocumentLang").filter(
    (form) =>
      stated.test(textOf(form, "lang")) &&
      countOf(rowsOf("GeneralLang"), {
        document: textOf(form, "document"),
        lang: textOf(form, "lang"),
      }) !== countOf(objects, { document: textOf(form, "document") }),
  );
  const assembledForms = rowsOf("AssembledLang").filter(
    (form) =>
      stated.test(textOf(form, "lang")) &&
      countOf(rowsOf("PlacedGeneralLang"), {
        assembly: textOf(form, "assembly"),
        lang: textOf(form, "lang"),
      }) !== countOf(objects, { document: textOf(form, "assembly") }),
  );

  return {
    refused: [
      ...new Set(
        [...documentForms, ...assembledForms, ...unlisted].map((form) => textOf(form, "lang")),
      ),
    ],
    unstated: witnesses
      .map((witness) => textOf(witness, "lang"))
      .filter((lang) => !stated.test(lang)),
  };
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "the languages an item's records list, as the import's rows hold them",
  (it) => {
    it.effect(
      "asks the records to list only the forms that are language tags once collapsed, on the import's rows, in the schema and in the law oracle, and refuses an ObjectLang row no xml:lang carries",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* documentLangRuns() {
            const fs = yield* FileSystem.FileSystem;
            const directory = yield* scratchDirectory("document-lang-");

            assert.strictEqual(cases.length, 72);

            return yield* exhaust(
              {
                box: "an item whose root or body p writes one of nine xml:lang forms, its record's general category listing nothing, en, en-gb or en_gb",
                caseHang: Duration.minutes(2),
                coverage: requiredInSpace<Situation>([
                  "a tag listed",
                  "a tag unlisted",
                  "no language",
                  "no tag",
                ]),
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => nameOf(Arr.getUnsafe(cases, at)),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle and the schema's R26 over the import's rows, against QTI 3.0 Metadata §2.7.1.3 under readings 134 and 164",
                },
                suite: "import/overlays/document-lang",
              },
              (at, c) =>
                Effect.gen(function* documentLangCase() {
                  const of = Arr.getUnsafe(cases, at);
                  const said = nameOf(of);
                  const expected = refusedForms(of);
                  c.note(
                    Option.match(of.form.tag, {
                      onNone: () => (outsideDomain(of) ? "no tag" : "no language"),
                      onSome: () => (expected.length > 0 ? "a tag unlisted" : "a tag listed"),
                    }),
                  );

                  const entries = packageOf(of);
                  const judgment = yield* judge(filesOf(entries), grammar, laws);
                  assert.strictEqual(judgment._tag, "Judged", said);

                  const breaches = judgment._tag === "Judged" ? judgment.breaches : [];

                  const dir = `${directory}/c${String(at)}`;
                  yield* writePackage(entries, dir);

                  const minted = new Set<string>();
                  const mint = (): NodeId => {
                    const id: NodeId = `${(0x10_00_00_00 + minted.size + 1).toString(16)}-0000-4000-8000-000000000000`;
                    minted.add(id);

                    return id;
                  };
                  const { inputs } = yield* Effect.orDie(readProgram(dir, mint));
                  yield* fs.remove(dir, { recursive: true });

                  const host = documentLangOf(viewOf(inputs));

                  assert.deepStrictEqual(
                    breaches
                      .filter(({ law }) => law === "Document lang")
                      .flatMap(({ keys }) => Option.toArray(Option.fromNullishOr(keys["lang"]))),
                    expected,
                    `${said}: the law oracle`,
                  );
                  assert.deepStrictEqual(host.refused, expected, `${said}: the import's rows`);
                  assert.deepStrictEqual(host.unstated, [], `${said}: a witness of no language`);
                  assert.strictEqual(
                    breaches.some(({ law }) => law === "value domain"),
                    outsideDomain(of),
                    `${said}: the value domain`,
                  );

                  const objects = [...inputs.AssessmentObject.values()];
                  const rootLang = of.place === "root" ? of.form.written : Option.none();
                  assert.deepStrictEqual(
                    [...inputs.ObjectLang.values()].map(({ lang }) => lang),
                    Option.toArray(rootLang),
                    `${said}: ObjectLang`,
                  );
                  if (Option.isNone(rootLang)) {
                    const planted = {
                      ...inputs,
                      ObjectLang: new Map(
                        objects.map(({ node }) => [node, { lang: "en", langTag: "en", node }]),
                      ),
                    };
                    assert.isNotEmpty(objects, said);
                    assert.isTrue(
                      hostVerdictOf(planted, minted).broken.has("E1 derived"),
                      `${said}: an ObjectLang row planted on a root that writes no xml:lang`,
                    );
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
