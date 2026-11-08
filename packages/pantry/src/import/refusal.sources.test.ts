/**
 * Every law source, and every record of the XSD differential that rests on the specification,
 * cites the specifications only where they are normative (lane OL; the verdict review's
 * observation that five sources cited the information model's §2, which both versions mark "This
 * Section is NOT NORMATIVE"): a hostile reader of a source looks first for a citation that rests on
 * a section the specification calls informative, or on an anchor no heading holds.
 *
 * Oracle: the specification as a checker, its own marks, read from its cached HTML and held to its
 * cached text (`#pantry/test/spec-sections.ts`), never listed here. Bound: every source of the
 * refusal's law table and every specification record the differential exports, every citation of
 * an IMS specification in them, exhausted.
 */
import { createHash } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Config, Effect, FileSystem, Option } from "effect";
import { lawTable } from "#pantry/vocab/laws.ts";
import * as differential from "#pantry/test/xsd-differential.ts";
import type { Recorded } from "#pantry/test/xsd-differential.ts";
import {
  normativityOf,
  offencesOf,
  specDocuments,
  specSections,
  textMarks,
} from "#pantry/test/spec-sections.ts";
import type { Sections } from "#pantry/test/spec-sections.ts";

/**
 * Each specification's cached renderings, none where the cache does not hold both.
 */
const cached = await Effect.runPromise(
  Effect.gen(function* readSpecs() {
    const home = yield* Config.NonEmptyString("HOME");
    const fs = yield* FileSystem.FileSystem;
    const read = (file: string) =>
      Effect.flatMap(fs.exists(`${home}/.cache/gr8des/${file}`), (exists) =>
        exists
          ? Effect.map(fs.readFileString(`${home}/.cache/gr8des/${file}`), Option.some)
          : Effect.succeed(Option.none<string>()),
      );

    return yield* Effect.all(
      specDocuments.map((document) =>
        Effect.all({ html: read(document.html), text: read(document.text) }).pipe(
          Effect.map((renderings) => ({ document, read: Option.all(renderings) })),
        ),
      ),
    );
  }).pipe(Effect.provide(NodeServices.layer)),
);

/**
 * Whether the cache holds every specification's renderings.
 */
const held = cached.every(({ read }) => Option.isSome(read));

/**
 * The SHA-256 of a text, in hex.
 *
 * @param text - The text.
 * @returns Its digest.
 */
const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");

/**
 * Each specification's sections, by its URL, read from its renderings.
 */
const sections: ReadonlyMap<string, Sections> = new Map(
  cached.flatMap(({ document, read }) =>
    read.pipe(
      Option.map((renderings) => [document.url, specSections(renderings)] as const),
      Option.toArray,
    ),
  ),
);

/**
 * Decide whether a value the differential exports is one of its records.
 *
 * @param value - The export, or one member of an exported list.
 * @returns Whether it is a record: an object with a direction and a reason.
 */
const isRecorded = (value: unknown): value is Recorded =>
  typeof value === "object" && value !== null && "direction" in value && "reason" in value;

/**
 * Every record the XSD differential exports, each record or list of them, once each by identity,
 * named by the export that first holds it: a record added under an export of its own is read too.
 */
const records: ReadonlyMap<Recorded, string> = new Map(
  Object.entries(differential)
    .flatMap(([name, value]): readonly (readonly [Recorded, string])[] => {
      if (Array.isArray(value)) {
        return value.flatMap((member, at) =>
          isRecorded(member) ? [[member, `${name}[${String(at)}]`] as const] : [],
        );
      }

      return isRecorded(value) ? [[value, name] as const] : [];
    })
    .toReversed(),
);

/**
 * Every source to judge, by a name of its own: each law's, as the refusal's table states it, and
 * each differential record's that rests on the specification, as `xsd-differential <export>
 * (<rule or direction>)`.
 */
const sources: ReadonlyMap<string, string> = new Map([
  ...Object.entries(lawTable).map(([law, { source }]) => [law, source] as const),
  ...[...records].flatMap(([record, name]) =>
    record.reason._tag === "specification"
      ? [
          [
            `xsd-differential ${name} (${record.rule ?? record.direction})`,
            record.reason.source,
          ] as const,
        ]
      : [],
  ),
]);

describe.skipIf(!held)("the law sources' citations", () => {
  it("are judged against the renderings they were read from", () => {
    for (const { document, read } of cached) {
      const { html, text } = Option.getOrElse(read, () => ({ html: "", text: "" }));

      assert.strictEqual(sha256(html), document.htmlSha256, document.html);
      assert.strictEqual(sha256(text), document.textSha256, document.text);
    }
  });

  it("read the same marks from each specification's HTML and its text", () => {
    // Oracle: a second rendering of the same specification, its text, which states each mark
    // under its heading as the HTML does.
    for (const { document, read } of cached) {
      const { text } = Option.getOrElse(read, () => ({ html: "", text: "" }));

      assert.deepStrictEqual(
        Object.fromEntries(sections.get(document.url)?.marks ?? []),
        Object.fromEntries(textMarks(text)),
        document.name,
      );
    }

    const model = sections.get("https://www.imsglobal.org/spec/qti/v3p0/info");
    assert.isDefined(model);
    for (const [section, normative] of [
      ["2.12", false],
      ["2.4.1.1", false],
      ["5.130.2", true],
      ["A1", false],
    ] as const) {
      assert.deepStrictEqual(
        normativityOf(model?.marks ?? new Map(), section),
        Option.some(normative),
        `§${section}`,
      );
    }

    // A line stands in the section of the heading at or before it: the duration sentence of
    // §2.2.2.2, a variable mapping's source of §7.48.1, the table of contents in none.
    for (const [line, section] of [
      [8468, Option.some("2.2.2.2")],
      [71_657, Option.some("7.48.1")],
      [1790, Option.none()],
    ] as const) {
      assert.deepStrictEqual(model?.sectionOfLine(line), section, `info.txt:${line}`);
    }
  });

  it("each cite a heading that exists, in a section its specification marks normative", () => {
    assert.deepStrictEqual(offencesOf(sources, sections), []);
  });

  it("refuse a citation of a non-normative section, an anchor no heading holds, a line no section holds and an unread specification", () => {
    // Planted: each kind of offence, beside a citation that holds.
    const model = "https://www.imsglobal.org/spec/qti/v3p0/info";

    assert.deepStrictEqual(
      offencesOf(
        new Map([
          ["Overview", `${model}#Main2p12 (§2.12: 'Fragments are packaged as separate resources')`],
          ["Dangling", `${model}#Data_BaseType (§5.130)`],
          ["Unread", "https://www.imsglobal.org/spec/qti/v9p0/info#Data_SetValue"],
          ["Lined", "the duration of an item (info.txt:8468, and :999999)"],
          ["Held", `${model}#Data_SetValue (§5.130 and §5.130.2, the expression), info.txt:71657`],
        ]),
        sections,
      ),
      [
        "Overview: #Main2p12 stands in §2.12 of the QTI 3.0 information model, which it marks NOT NORMATIVE",
        "Overview: §2.12 of the QTI 3.0 information model, which it marks NOT NORMATIVE",
        "Dangling: #Data_BaseType names no heading of the QTI 3.0 information model",
        "Unread: https://www.imsglobal.org/spec/qti/v9p0/info#Data_SetValue is no specification whose sections can be judged",
        "Lined: info.txt:8468 stands in §2.2.2.2 of the QTI 3.0 information model, which it marks NOT NORMATIVE",
        "Lined: info.txt:999999 stands in no section of the QTI 3.0 information model",
      ],
    );
  });
});
