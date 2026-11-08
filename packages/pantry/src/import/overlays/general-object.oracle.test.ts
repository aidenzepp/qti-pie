/**
 * A resource's LOM record names the document its `href` names (spec reading 93), the "associated
 * item, test or object bank" the general category's laws read it against (QTI 3.0 Metadata §2.7.1:
 * `lom-identifier`, `lom-title` and `document-lang`), and a record whose `href` names no document
 * of the package names none: there is nothing to read it against, and "Document entry" refuses the
 * `href` (IMS Content Packaging 1.2 §6.6.2: "A value declared by a Resource{ Href } object is a
 * launchable URI"; reading 93). The import holds it so: its records' `LomResource.named` is `none`
 * where the `href` names no document (`targetAt`), so no `LomObject`, `GeneralObject`,
 * `LomObjectIdentifier` or `LomObjectTitle` row stands for it. The genetic differential found the
 * import giving such a record the manifest as its document (NS6), which broke "E1 derived" and the
 * record's laws where the law oracle raises "Document entry" alone.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), and
 * both against §2.7.1 and readings 93 and 146 as stated above: the two agree on every case, and
 * each raises "Document entry" exactly where the `href` names no document a resource names.
 *
 * Bound: a package of one resource, of the item type or the test type, whose `href` names each of
 * the listed document of its type, a path no entry holds, a path outside the package, the
 * manifest, and nothing (no `href`), and whose record's general category lists the document's
 * language alone, or also an identifier and a title that are not the document's: 20 cases,
 * exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
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
 * The resource's type, each with the root of the document of that type the package lists.
 */
const types = [
  { root: "qti-assessment-item", type: "imsqti_item_xmlv3p0" },
  { root: "qti-assessment-test", type: "imsqti_test_xmlv3p0" },
] as const;

/**
 * What the resource's `href` names: the listed document of its type, a path no entry holds, a path
 * outside the package, the manifest, or nothing.
 */
const hrefs = ["the listed document", "no entry", "outside", "the manifest", "nothing"] as const;

/**
 * What the record's general category lists: the document's language alone, or also an identifier
 * and a title that are not the document's, which break `lom-identifier` and `lom-title` wherever
 * the record names the document.
 */
const records = ["language", "identified"] as const;

/**
 * One case of the bound.
 */
interface Case {
  readonly href: (typeof hrefs)[number];
  readonly record: (typeof records)[number];
  readonly type: (typeof types)[number];
}

/**
 * Every case of the bound.
 */
const cases: readonly Case[] = types.flatMap((type) =>
  hrefs.flatMap((href) => records.map((record): Case => ({ href, record, type }))),
);

/**
 * The listed document's path.
 */
const documentPath = "doc.xml";

/**
 * Write a case's `href`, none for a resource that writes none.
 *
 * @param href - What the href names.
 * @returns The href, none for nothing.
 */
const hrefOf = (href: Case["href"]): string | undefined => {
  switch (href) {
    case "the listed document": {
      return documentPath;
    }
    case "no entry": {
      return "missing.xml";
    }
    case "outside": {
      return "../outside.xml";
    }
    case "the manifest": {
      return "imsmanifest.xml";
    }
    case "nothing": {
      return undefined;
    }
    default: {
      return href satisfies never;
    }
  }
};

/**
 * Build a case's package: the manifest, whose one resource of the case's type writes the case's
 * `href`, one file of the same `href` and one record; and the document of the case's type, which
 * the package lists only where the `href` names it.
 *
 * @param of - The case.
 * @returns The package's entries.
 */
const packageOf = (of: Case): ReadonlyMap<string, Uint8Array> => {
  const href = hrefOf(of.href);
  const general = [
    ...(of.record === "identified"
      ? [
          "<imsmd:identifier><imsmd:entry>other</imsmd:entry></imsmd:identifier>",
          "<imsmd:title><imsmd:string>Other</imsmd:string></imsmd:title>",
        ]
      : []),
    "<imsmd:language>en</imsmd:language>",
  ].join("");
  const manifest = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="general-object">',
    "  <metadata><schemaversion>3.0.0</schemaversion></metadata>",
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="doc-res" type="${of.type.type}"${href === undefined ? "" : ` href="${href}"`}>`,
    `      <metadata><imsmd:lom><imsmd:general>${general}</imsmd:general></imsmd:lom></metadata>`,
    ...(href === undefined ? [] : [`      <file href="${href}"/>`]),
    "    </resource>",
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");
  const lang = of.type.root === "qti-assessment-item" ? ' xml:lang="en"' : "";
  const document = `<?xml version="1.0" encoding="UTF-8"?>\n<${of.type.root} xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="doc" title="Doc"${lang}/>\n`;
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifest)],
    ...(of.href === "the listed document" ? [[documentPath, text.encode(document)] as const] : []),
  ]);
};

/**
 * Name a case.
 *
 * @param of - The case.
 * @returns Its name.
 */
const nameOf = (of: Case): string =>
  `${of.type.type} whose href names ${of.href}, its record ${of.record}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "a resource's record, against the document its href names",
  (it) => {
    it.effect(
      "reads the document its href names, and a record whose href names none names nothing, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* generalObjectRuns() {
            const directory = yield* scratchDirectory("general-object-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(cases.length, 20);

            return yield* exhaust(
              {
                box: "an item or a test resource whose href names its listed document, no entry, a path outside, the manifest or nothing, its record listing a language alone or also another identifier and title",
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
                  name: "the law oracle and QTI 3.0 Metadata §2.7.1 and reading 93, against the laws the import's rows break on the host",
                },
                suite: "pantry/general-object",
              },
              (at) =>
                Effect.gen(function* generalObjectCase() {
                  const of = cases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const judged = yield* judgeOne(yield* genomeOf(packageOf(of)), bench, at);
                  const said = `${nameOf(of)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;

                  assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
                  assert.match(judged.summary.import, /^built /u, said);

                  // A path no entry holds, one outside the package and the manifest's are no
                  // document a resource names (readings 93 and 146).
                  const unnamed =
                    of.href === "no entry" || of.href === "outside" || of.href === "the manifest";
                  const read = of.href === "the listed document" && of.record === "identified";
                  for (const side of [judged.summary.oracle, judged.summary.import]) {
                    assert.strictEqual(/\bDocument entry\b/u.test(side), unnamed, said);
                    assert.strictEqual(/\bLomObjectIdentifier\b/u.test(side), read, said);
                    assert.strictEqual(/\bLomObjectTitle\b/u.test(side), read, said);
                    assert.notMatch(side, /\bE1 derived\b/u, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
