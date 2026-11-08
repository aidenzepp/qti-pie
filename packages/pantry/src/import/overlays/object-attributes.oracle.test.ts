/**
 * An assessment object's `identifier` and `title` are required (AL3), and a LOM record names its
 * document by them (QTI 3.0 Metadata §2.7.1.1: "One of the values given for the identifier must
 * have an entry that matches the identifier of the associated item, test or object bank";
 * §2.7.1.2: "The title must have a value that matches the value of the title attribute of the
 * associated item, test or object bank"). A root that writes neither still is the record's
 * document, and its absent attribute is a value no entry or string matches: the import writes each
 * attribute as a row of its own (`ObjectIdentifier`, `ObjectTitle`), and a record none of whose
 * entries or strings names its document has no witness row, so AL3 refuses the root, and
 * `lom-identifier` or `lom-title` the record, each under its own name. A usage value's `baseType`
 * types its text only where it spells a code (spec reading 105, C17), so one that spells none has
 * no `UsageValue` row, and its value domain refuses it alone (lane NIL's audit, B11).
 *
 * The import once wrote an absent identifier and title as `""` and an object with either absent as
 * no row, so "E1 derived" broke beside AL3, and an empty LOM entry or title string matched an
 * identifier or a title the root never wrote; the law oracle read an absent title as `""` too. It
 * wrote a misspelled `baseType` as `none`, which "E1 derived" refused beside the value domain.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), and
 * both against §2.7.1.1, §2.7.1.2 and reading 105 as stated above: the two agree on every case,
 * and each raises AL3, `LomObjectIdentifier`, `LomObjectTitle` and the value domain exactly where
 * the case says.
 *
 * Bound: an item resource whose root writes or omits its `identifier` and its `title`, its record
 * listing no entry, an empty one, the root's or another, and no title string, an empty one, the
 * root's title or another: 64 cases; and a usage value whose `baseType` is unwritten, spelled,
 * misspelled or padded: 4 cases; exhausted.
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
import type { Bench } from "#pantry/test/gen/genetic/judge.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The root's identifier and title, as the record names them.
 */
const root = { identifier: "doc", title: "Doc" } as const;

/**
 * What the record's general category writes of one attribute: nothing, an empty value, the root's,
 * or another.
 */
const named = ["absent", "empty", "matching", "different"] as const;

/**
 * One object case of the bound.
 */
interface ObjectCase {
  readonly entry: (typeof named)[number];
  readonly identifier: boolean;
  readonly string: (typeof named)[number];
  readonly title: boolean;
}

/**
 * Every object case of the bound.
 */
const objectCases: readonly ObjectCase[] = [true, false].flatMap((identifier) =>
  [true, false].flatMap((title) =>
    named.flatMap((entry) =>
      named.map((string): ObjectCase => ({ entry, identifier, string, title })),
    ),
  ),
);

/**
 * Write the value a case's record names an attribute by, none where it names none.
 *
 * @param of - What the record writes.
 * @param value - The root's value.
 * @returns The value, none for an absent one.
 */
const valueOf = (of: ObjectCase["entry"], value: string): string | undefined => {
  switch (of) {
    case "absent": {
      return undefined;
    }
    case "empty": {
      return "";
    }
    case "matching": {
      return value;
    }
    case "different": {
      return `other ${value}`;
    }
    default: {
      return of satisfies never;
    }
  }
};

/**
 * Build a manifest of one resource, with its record's general category and its one file.
 *
 * @param type - The resource's type.
 * @param path - Its `href`, and its file's.
 * @param general - Its record's general category's content.
 * @returns The manifest's text.
 */
const manifestOf = (type: string, path: string, general: string): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="object-attributes">',
    "  <metadata><schemaversion>3.0.0</schemaversion></metadata>",
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="doc-res" type="${type}" href="${path}">`,
    `      <metadata><imsmd:lom><imsmd:general>${general}</imsmd:general></imsmd:lom></metadata>`,
    `      <file href="${path}"/>`,
    "    </resource>",
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");

/**
 * Build an object case's package: the manifest, whose item resource's record names the case's
 * entry and title string, and the item, which writes the case's attributes.
 *
 * @param of - The case.
 * @returns The package's entries.
 */
const objectPackageOf = (of: ObjectCase): ReadonlyMap<string, Uint8Array> => {
  const entry = valueOf(of.entry, root.identifier);
  const string = valueOf(of.string, root.title);
  const general = [
    entry === undefined
      ? ""
      : `<imsmd:identifier><imsmd:entry>${entry}</imsmd:entry></imsmd:identifier>`,
    string === undefined ? "" : `<imsmd:title><imsmd:string>${string}</imsmd:string></imsmd:title>`,
  ].join("");
  const attributes = [
    of.identifier ? ` identifier="${root.identifier}"` : "",
    of.title ? ` title="${root.title}"` : "",
  ].join("");
  const item = `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"${attributes} adaptive="false" time-dependent="false"/>\n`;
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifestOf("imsqti_item_xmlv3p0", "doc.xml", general))],
    ["doc.xml", text.encode(item)],
  ]);
};

/**
 * Name an object case.
 *
 * @param of - The case.
 * @returns Its name.
 */
const objectNameOf = (of: ObjectCase): string =>
  `an item ${of.identifier ? "with" : "without"} its identifier and ${of.title ? "with" : "without"} its title, its record's entry ${of.entry} and its title string ${of.string}`;

/**
 * The usage value's `baseType`: unwritten, spelled, misspelled, and padded, which spells nothing
 * since the enumeration preserves whitespace.
 */
const baseTypes = [undefined, "integer", "intger", " integer"] as const;

/**
 * Build a usage case's package: the manifest, whose usage data resource lists its file, and the
 * file, a statistic whose value writes the case's `baseType`.
 *
 * @param baseType - The case's `baseType`.
 * @returns The package's entries.
 */
const usagePackageOf = (baseType: (typeof baseTypes)[number]): ReadonlyMap<string, Uint8Array> => {
  const attribute = baseType === undefined ? "" : ` baseType="${baseType}"`;
  const usage = `<?xml version="1.0" encoding="UTF-8"?>\n<usageData xmlns="http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0"><ordinaryStatistic name="AIS" context="http://example.org/c"><targetObject identifier="item"/><value${attribute}>1</value></ordinaryStatistic></usageData>\n`;
  const text = new TextEncoder();

  return new Map([
    ["imsmanifest.xml", text.encode(manifestOf("qtiusagedata/xml", "usage.xml", ""))],
    ["usage.xml", text.encode(usage)],
  ]);
};

/**
 * Judge a package on both sides, and require them to agree and the import to build its rows.
 *
 * @param entries - The package.
 * @param bench - The bench the two judge on.
 * @param at - The case's number, which names its scratch directory.
 * @param name - The case's name.
 * @returns The case's description, and the laws each side raises as its summary writes them: the
 *   oracle's every law, the import's those of its rows the host evaluates (no law of `Node` or
 *   `Attribute`, AL3 and the value domain among them).
 */
const agreed = Effect.fn("test.objectAttributes.agreed")(function* agreed(
  entries: ReadonlyMap<string, Uint8Array>,
  bench: Bench,
  at: number,
  name: string,
) {
  const judged = yield* judgeOne(yield* genomeOf(entries), bench, at);
  const said = `${name}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`;

  assert.deepStrictEqual(judged.disagreements.map(shownDisagreement), [], said);
  assert.match(judged.summary.import, /^built /u, said);

  return {
    oracle: judged.summary.oracle,
    said,
    sides: [judged.summary.oracle, judged.summary.import],
  };
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "an assessment object's attributes and a usage value's base type, as their rows hold them",
  (it) => {
    it.effect(
      "refuses an unwritten identifier or title under AL3 alone, and a record under lom-identifier or lom-title exactly where none of its entries or strings is the root's, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* objectAttributeRuns() {
            const directory = yield* scratchDirectory("object-attributes-");
            const bench = { directory, grammar, laws };

            assert.strictEqual(objectCases.length, 64);

            return yield* exhaust(
              {
                box: "an item that writes or omits its identifier and title, its record's entry and title string each absent, empty, the root's or another",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, objectCases.length - 1),
                limit: objectCases.length,
                literal: (at) => {
                  const of = objectCases[at];

                  return of === undefined ? String(at) : objectNameOf(of);
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle and QTI 3.0 Metadata §2.7.1.1 and §2.7.1.2, against the laws the import's rows break on the host",
                },
                suite: "pantry/object-attributes",
              },
              (at) =>
                Effect.gen(function* objectAttributeCase() {
                  const of = objectCases[at];
                  assert.isDefined(of, `no case ${String(at)}`);
                  if (of === undefined) {
                    return;
                  }

                  const { oracle, said, sides } = yield* agreed(
                    objectPackageOf(of),
                    bench,
                    at,
                    objectNameOf(of),
                  );
                  const identified =
                    of.entry !== "absent" && !(of.identifier && of.entry === "matching");
                  const titled = of.string !== "absent" && !(of.title && of.string === "matching");
                  assert.strictEqual(
                    /\bAL3 required\b/u.test(oracle),
                    !of.identifier || !of.title,
                    said,
                  );
                  for (const side of sides) {
                    assert.strictEqual(/\bLomObjectIdentifier\b/u.test(side), identified, said);
                    assert.strictEqual(/\bLomObjectTitle\b/u.test(side), titled, said);
                    assert.notMatch(side, /\bE1 derived\b/u, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );

    it.effect(
      "refuses a usage value's baseType that spells no code under its value domain alone, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* usageRuns() {
            const directory = yield* scratchDirectory("usage-base-type-");
            const bench = { directory, grammar, laws };

            return yield* exhaust(
              {
                box: "a usage value whose baseType is unwritten, spelled, misspelled or padded",
                caseHang: Duration.minutes(5),
                coverage: noCoverage,
                generator: int(0, baseTypes.length - 1),
                limit: baseTypes.length,
                literal: (at) => JSON.stringify(baseTypes[at] ?? "unwritten"),
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle and reading 105, against the laws the import's rows break on the host",
                },
                suite: "pantry/usage-base-type",
              },
              (at) =>
                Effect.gen(function* usageCase() {
                  assert.isTrue(at >= 0 && at < baseTypes.length, `no case ${String(at)}`);

                  const baseType = baseTypes[at];
                  const { oracle, said, sides } = yield* agreed(
                    usagePackageOf(baseType),
                    bench,
                    at,
                    `a usage value of baseType ${JSON.stringify(baseType ?? "unwritten")}`,
                  );
                  assert.strictEqual(
                    /\bvalue domain\b/u.test(oracle),
                    baseType !== undefined && baseType !== "integer",
                    said,
                  );
                  for (const side of sides) {
                    assert.notMatch(side, /\bE1 derived\b/u, said);
                  }
                }),
            );
          }).pipe(Effect.scoped),
        ),
    );
  },
);
