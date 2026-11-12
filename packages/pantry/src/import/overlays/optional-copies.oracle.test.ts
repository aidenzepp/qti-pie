/**
 * The rows of two optional attributes stand exactly where their attribute is written: a
 * `cp:resource`'s `href`, its `ResourceHref` (IMS Content Packaging 1.2, `resource`: `href` is
 * optional), and a `lom:string`'s `language`, its `LomStringLanguage` (IEEE LOM's LangString:
 * `language` is optional on `string`). A value that may be missing is a row of its own relation,
 * which represents an actual optional domain value (AGENTS.md, Schema intent), so no such row
 * stands for an attribute that is not written.
 *
 * Each row is copied from its attribute both ways: the copy makes the row exist wherever the
 * attribute is written and hold its lexical form, and the way back, a containment from the row's
 * place into the attribute's selection, refuses a row with no attribute, under "Manifest overlay"
 * for a `ResourceHref` and "E1 derived" for a `LomStringLanguage`.
 *
 * Oracle: the specification, as read above. The import's rows hold each row exactly where its
 * attribute is written and break neither law on the host
 * (`#pantry/test/gen/genetic/host-laws.ts` `hostVerdictOf`). A row planted where its attribute is
 * not written, every other row it touches made to agree as a writer would, newly breaks exactly one
 * statement, the way back, named by its law: without the way back, nothing refuses it.
 *
 * Bound: an item resource whose record's description holds two `lom:string`s, each writing a
 * `language` or not, beside two `webcontent` resources, each writing an `href` or not and listing
 * its own file: 16 packages, exhausted, with a row planted on every resource and every string of
 * each that writes none.
 */
import { NodeServices } from "@effect/platform-node";
import { sameLaw } from "@bjornpagen/grizzle";
import type { Law } from "@bjornpagen/grizzle";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, FileSystem, Option } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { schemaLawNameOf } from "#pantry/test/law-namer.ts";

/**
 * A `webcontent` resource of a case: its identifier, the file it lists, and whether it writes that
 * file as its `href`.
 */
interface WebResource {
  readonly file: string;
  readonly identifier: string;
  readonly writesHref: boolean;
}

/**
 * A string of the item's record's description in a case: its text, the `language` it may write,
 * and whether it writes it.
 */
interface DescriptionString {
  readonly language: string;
  readonly text: string;
  readonly writesLanguage: boolean;
}

/**
 * One case of the box: the two `webcontent` resources and the two description strings.
 */
interface OptionalCase {
  readonly resources: readonly WebResource[];
  readonly strings: readonly DescriptionString[];
}

/**
 * Both values of a flag.
 */
const flags = [false, true] as const;

/**
 * Every case of the box: `W1` and `W2`, listing `page1.html` and `page2.html`, each writing its
 * file as its `href` or not, and the strings `One` and `Two`, each writing `en` or `fr` or not.
 */
const cases: readonly OptionalCase[] = flags.flatMap((h1) =>
  flags.flatMap((h2) =>
    flags.flatMap((l1) =>
      flags.map((l2): OptionalCase => ({
        resources: [
          { file: "page1.html", identifier: "W1", writesHref: h1 },
          { file: "page2.html", identifier: "W2", writesHref: h2 },
        ],
        strings: [
          { language: "en", text: "One", writesLanguage: l1 },
          { language: "fr", text: "Two", writesLanguage: l2 },
        ],
      })),
    ),
  ),
);

/**
 * A situation the box must reach.
 */
type Situation =
  | "a resource with no href"
  | "a resource with no href and a string with no language"
  | "a string with no language"
  | "every attribute written";

/**
 * Name a case.
 *
 * @param of - The case.
 * @returns Its name.
 */
const nameOf = (of: OptionalCase): string =>
  `hrefs ${JSON.stringify(of.resources.map(({ writesHref }) => writesHref))}, languages ${JSON.stringify(of.strings.map(({ writesLanguage }) => writesLanguage))}`;

/**
 * The resources of a case that write no `href`.
 *
 * @param of - The case.
 * @returns Those resources.
 */
const hrefless = (of: OptionalCase): readonly WebResource[] =>
  of.resources.filter(({ writesHref }) => !writesHref);

/**
 * The strings of a case that write no `language`.
 *
 * @param of - The case.
 * @returns Those strings.
 */
const languageless = (of: OptionalCase): readonly DescriptionString[] =>
  of.strings.filter(({ writesLanguage }) => !writesLanguage);

/**
 * The situation a case is in.
 *
 * @param of - The case.
 * @returns Its situation.
 */
const situationOf = (of: OptionalCase): Situation => {
  const noHref = hrefless(of).length > 0;
  const noLanguage = languageless(of).length > 0;
  if (noHref && noLanguage) {
    return "a resource with no href and a string with no language";
  }

  if (noHref) {
    return "a resource with no href";
  }

  return noLanguage ? "a string with no language" : "every attribute written";
};

/**
 * The `href`s a case writes: the item resource's, `item.xml`, and each `webcontent` resource's that
 * writes one, its own file.
 *
 * @param of - The case.
 * @returns The hrefs.
 */
const writtenHrefs = (of: OptionalCase): readonly string[] => [
  "item.xml",
  ...of.resources.filter(({ writesHref }) => writesHref).map(({ file }) => file),
];

/**
 * The `language`s a case writes.
 *
 * @param of - The case.
 * @returns The languages.
 */
const writtenLanguages = (of: OptionalCase): readonly string[] =>
  of.strings.filter(({ writesLanguage }) => writesLanguage).map(({ language }) => language);

/**
 * Build a case's package: an item named by its resource's `href`, whose record's description holds
 * the two strings, and the two `webcontent` resources, each listing its own page.
 *
 * @param of - The case.
 * @returns The package's entries.
 */
const packageOf = (of: OptionalCase): PackageEntries => {
  const text = new TextEncoder();
  const described = of.strings
    .map(
      ({ language, text: value, writesLanguage }) =>
        `<imsmd:string${writesLanguage ? ` language="${language}"` : ""}>${value}</imsmd:string>`,
    )
    .join("");
  const web = of.resources
    .map(
      ({ file, identifier, writesHref }) =>
        `<resource identifier="${identifier}" type="webcontent"${writesHref ? ` href="${file}"` : ""}><file href="${file}"/></resource>`,
    )
    .join("");

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><metadata><imsmd:lom><imsmd:general><imsmd:description>${described}</imsmd:description></imsmd:general></imsmd:lom></metadata><file href="item.xml"/></resource>${web}</resources></manifest>\n`,
      ),
    ],
    [
      "item.xml",
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false"><qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>\n`,
      ),
    ],
    ...of.resources.map(({ file }) => [file, text.encode(`<p>${file}</p>\n`)] as const),
  ]);
};

/**
 * An element's place as the test compares it, its document's path and its `start`: every row of
 * one case is of its one package.
 *
 * @param row - A row of the element.
 * @param row.path - Its document's path.
 * @param row.start - Its position there.
 * @returns The place's text.
 */
const placeOf = ({ path, start }: { readonly path: string; readonly start: bigint }): string =>
  JSON.stringify([path, String(start)]);

/**
 * Describe a law as the test compares it: a containment by its two relations, any other by its
 * kind, each with the law a refusal names it by.
 *
 * @param law - The law.
 * @returns Its description.
 */
const describeLaw = (law: Law): string =>
  `${law.kind === "contained" ? `${law.from.relation} ⊆ ${law.to.relation}` : law.kind}, ${Option.match(
    schemaLawNameOf(law),
    { onNone: () => "named by no law", onSome: (name) => `"${name}"` },
  )}`;

/**
 * The statements planted rows break that the import's own rows do not.
 *
 * @param planted - The rows with a row planted.
 * @param own - The import's own rows.
 * @returns Each newly broken statement, described.
 */
const newlyBroken = (planted: PackageInputs, own: PackageInputs): readonly string[] => {
  const before = hostVerdictOf(own).brokenLaws;

  return hostVerdictOf(planted)
    .brokenLaws.filter((law) => !before.some((held) => sameLaw(held, law)))
    .map(describeLaw);
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "the rows of a resource's href and a LOM string's language, as the import's rows hold them",
  (it) => {
    it.effect(
      "holds each row exactly where its attribute is written, and refuses one planted where it is not by its way back alone",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* optionalCopiesRuns() {
            const fs = yield* FileSystem.FileSystem;
            const directory = yield* scratchDirectory("optional-copies-");

            assert.strictEqual(cases.length, 16);

            return yield* exhaust(
              {
                box: "an item resource whose record's description holds two lom:strings, each writing a language or not, beside two webcontent resources, each writing an href or not",
                caseHang: Duration.minutes(2),
                coverage: requiredInSpace<Situation>([
                  "a resource with no href",
                  "a resource with no href and a string with no language",
                  "a string with no language",
                  "every attribute written",
                ]),
                generator: int(0, cases.length - 1),
                literal: (at) => nameOf(Arr.getUnsafe(cases, at)),
                oracle: {
                  kind: "specification",
                  name: "IMS Content Packaging 1.2's optional resource href and IEEE LOM's optional string language, each a row exactly where it is written",
                },
                suite: "import/overlays/optional-copies",
              },
              (at, c) =>
                Effect.gen(function* optionalCopiesCase() {
                  const of = Arr.getUnsafe(cases, at);
                  const said = nameOf(of);
                  c.note(situationOf(of));

                  const dir = `${directory}/c${String(at)}`;
                  yield* writePackage(packageOf(of), dir);

                  const { inputs } = yield* Effect.orDie(readProgram(dir));
                  yield* fs.remove(dir, { recursive: true });

                  const hrefs = [...inputs.ResourceHref.values()];
                  const languages = [...inputs.LomStringLanguage.values()];
                  assert.sameMembers(
                    hrefs.map(({ href }) => href),
                    [...writtenHrefs(of)],
                    `${said}: ResourceHref`,
                  );
                  assert.sameMembers(
                    languages.map(({ language }) => language),
                    [...writtenLanguages(of)],
                    `${said}: LomStringLanguage`,
                  );

                  const own = hostVerdictOf(inputs).broken;
                  assert.isFalse(
                    own.has("Manifest overlay"),
                    `${said}: ${String(own.get("Manifest overlay")?.witness)}`,
                  );
                  assert.isFalse(
                    own.has("E1 derived"),
                    `${said}: ${String(own.get("E1 derived")?.witness)}`,
                  );

                  const hrefPlaces = new Set(hrefs.map(placeOf));
                  const files = [...inputs.File.values()];
                  const bare = [...inputs.ResourceTyped.values()].filter(
                    (resource) =>
                      resource.type === "webcontent" && !hrefPlaces.has(placeOf(resource)),
                  );
                  assert.lengthOf(bare, hrefless(of).length, said);
                  for (const resource of bare) {
                    const file = Arr.findFirst(
                      files,
                      ({ path, resource: owner }) =>
                        path === resource.path && owner === resource.start,
                    );
                    assert.isTrue(Option.isSome(file), `${said}: the resource's file`);
                    if (Option.isSome(file)) {
                      // The href a writer plants is its resource's own file's; its typed href is
                      // the query `TypedHref`'s, which no row stores.
                      const { href, scope, target } = file.value;
                      const planted: PackageInputs = {
                        ...inputs,
                        ResourceHref: new Map([
                          ...inputs.ResourceHref,
                          [
                            `planted ${placeOf(resource)}`,
                            {
                              href,
                              package: resource.package,
                              path: resource.path,
                              scope,
                              start: resource.start,
                              target,
                            },
                          ],
                        ]),
                      };
                      const broken = newlyBroken(planted, inputs);
                      assert.deepStrictEqual(
                        broken,
                        ['ResourceHref ⊆ Attribute, "Manifest overlay"'],
                        `${said}: a ResourceHref planted on ${href}'s resource, which writes no href, newly breaks ${JSON.stringify(broken)}`,
                      );
                    }
                  }

                  const languagePlaces = new Set(languages.map(placeOf));
                  const unwritten = [...inputs.LomString.values()].filter(
                    (lomString) => !languagePlaces.has(placeOf(lomString)),
                  );
                  assert.lengthOf(unwritten, languageless(of).length, said);
                  for (const lomString of unwritten) {
                    // The string's `languageTag` is its language's where it writes one, which a
                    // writer of the planted row makes agree.
                    const planted: PackageInputs = {
                      ...inputs,
                      LomString: new Map(
                        [...inputs.LomString].map(([key, row]) => [
                          key,
                          placeOf(row) === placeOf(lomString) ? { ...row, languageTag: "en" } : row,
                        ]),
                      ),
                      LomStringLanguage: new Map([
                        ...inputs.LomStringLanguage,
                        [
                          `planted ${placeOf(lomString)}`,
                          {
                            language: "en",
                            package: lomString.package,
                            path: lomString.path,
                            start: lomString.start,
                          },
                        ],
                      ]),
                    };
                    const broken = newlyBroken(planted, inputs);
                    assert.deepStrictEqual(
                      broken,
                      ['LomStringLanguage ⊆ Attribute, "E1 derived"'],
                      `${said}: a LomStringLanguage planted on a lom:string that writes no language newly breaks ${JSON.stringify(broken)}`,
                    );
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
