/**
 * The law oracle's key texts against the schema (Aiden's question on RV-slices S1: does the
 * oracle's list cover ID attributes, so the oracle and the database agree on a 700-byte id?).
 *
 * - **The list is the schema's.** `#pantry/test/key-copies.ts` reads its copies from the schema's
 *   statements. This file holds them, statement by statement and field by field, to the laws the
 *   law table states (`src/import/refusal.ts` `statedLaws`), to every `keyText` field of the
 *   document relations, and to the copies whose source is no document row.
 * - **The verdict is the schema's.** Generated packages carry key texts of generated lengths in 1-,
 *   2-, 3- and 4-byte scripts around the bound the schema's type admits. The oracle refuses one
 *   under "Key text bound" exactly where the import's rows hold a text `keyText` does not admit,
 *   every field it names is one of those rows' fields, and every rule the database would refuse it
 *   under is one the oracle names: one cause, one rule, `key-text-bound` at both seats.
 */
import type { LawSide } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, pipe, Predicate, Schema } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { readProgram, rowCountsOf } from "#pantry/import/program.ts";
import { ruleOfLaw, statedLaws } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import { keyText, keyTextBytes, utf8Length } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/own.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { SideSchema } from "#pantry/test/predicates.ts";
import type { Datum } from "#pantry/test/predicates.ts";
import { generatedFields, judgedSideOf } from "#pantry/test/host-judge.ts";
import { identityOf, keyCopies, keyTextFields } from "#pantry/test/key-copies.ts";
import { judge, lawsOf, ruleOf } from "#pantry/test/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 13.5 s at a load average of 63 to
 * 73, its slowest test.
 */
const testTimeoutMs = 1_800_000;

/**
 * The oracle's tables over the installed grammar, built once.
 */
const laws = lawsOf(grammar);

/**
 * The document relations the oracle has rows for.
 */
const documentRelations: ReadonlySet<string> = new Set(["Attribute", "Node"]);

/**
 * Whether a relation's field is of type `keyText`.
 *
 * @param relation - The relation's name.
 * @param field - The field's name.
 * @returns Whether it is.
 */
const isKeyText = (relation: string, field: string): boolean =>
  keyTextFields.has(`${relation}.${field}`);

/**
 * The copies the law table states: each containment of `statedLaws` that pairs a field of no
 * `keyText` type of its source with a `keyText` field of its target, and each `Monoid.concat`
 * fold over a relation's own rows into a `keyText` accumulator of it, as `law → Relation.field` for
 * the field it holds, with whether its source is a document relation.
 */
const statedCopies = statedLaws().flatMap(([law]) => {
  if (law.kind === "contained") {
    return law.from.terms.flatMap((term, at) => {
      const held = law.to.terms[at]?.field ?? "";

      return isKeyText(law.to.relation, held) && !isKeyText(law.from.relation, term.field)
        ? [
            {
              copy: `${identityOf(law)} → ${law.to.relation}.${held}`,
              document: documentRelations.has(law.from.relation),
              source: `${law.from.relation}.${term.field}`,
            },
          ]
        : [];
    });
  }

  const held = law.kind === "fold" ? (law.end.terms.at(-1)?.field ?? "") : "";

  return law.kind === "fold" &&
    law.monoid === "concat" &&
    isKeyText(law.end.relation, held) &&
    law.step.relation === law.end.relation
    ? [
        {
          copy: `${identityOf(law)} → ${law.end.relation}.${held}`,
          document: documentRelations.has(law.end.relation),
          source: `${law.step.relation}.${law.step.terms.at(-3)?.field ?? ""}`,
        },
      ]
    : [];
});

/**
 * A side of a containment as grizzle keeps it: the relation it reads, a selection's or its own,
 * and its terms, a `pred` one as an object over its field.
 */
const SideRead = Schema.Struct({
  source: Schema.Union([
    Schema.Struct({ relation: Schema.Struct({ name: Schema.String }) }),
    Schema.Struct({ name: Schema.String }),
  ]),
  terms: Schema.NonEmptyArray(
    Schema.Union([Schema.String, Schema.Struct({ field: Schema.String })]),
  ),
});

/**
 * A containment or a mirrors as grizzle keeps it.
 */
const ContainmentRead = Schema.Struct({
  kind: Schema.Literals(["contained", "mirrors"]),
  left: SideRead,
  right: SideRead,
});

/**
 * Read a containment's side as a law names it.
 *
 * @param side - The side as grizzle keeps it.
 * @returns The side.
 */
const lawSideOf = (side: typeof SideRead.Type): LawSide => ({
  relation: "name" in side.source ? side.source.name : side.source.relation.name,
  selection: { conjuncts: [] },
  terms: pipe(
    side.terms,
    Arr.map((term): LawSide["terms"][number] =>
      Predicate.isString(term)
        ? { field: term, kind: "field" }
        : { field: term.field, kind: "pred" },
    ),
  ),
});

/**
 * The places among the schema's statements of each containment, by its law's identity: a mirrors
 * is both of its containments, and two statements may share one identity.
 */
const placesByIdentity: ReadonlyMap<string, ReadonlySet<number>> = (() => {
  const places = new Map<string, Set<number>>();
  for (const [at, statement] of Qti.statements.entries()) {
    for (const { kind, left, right } of Option.toArray(
      Schema.decodeUnknownOption(ContainmentRead)(statement),
    )) {
      const ways =
        kind === "mirrors"
          ? [[left, right] as const, [right, left] as const]
          : [[left, right] as const];
      for (const [from, to] of ways) {
        const identity = identityOf({
          from: lawSideOf(from),
          kind: "contained",
          to: lawSideOf(to),
        });
        places.set(identity, new Set([...(places.get(identity) ?? []), at]));
      }
    }
  }

  return places;
})();

describe("the oracle's key-text list", () => {
  it("is every containment and fold the law table states of a document's text into a key text", () => {
    // Oracle: the law table (`statedLaws`), read independently of key-copies.ts: each stated
    // containment pairing a document field of no keyText type with a keyText field, and each concat
    // fold into a keyText accumulator over a document relation's own rows.
    // Bound: every law the schema states that is no check.
    const stated = new Set(statedCopies.filter(({ document }) => document).map(({ copy }) => copy));
    const listed = new Set(
      keyCopies.filter(({ by }) => by !== "check").map(({ field, law }) => `${law} → ${field}`),
    );

    assert.deepStrictEqual([...listed].toSorted(), [...stated].toSorted());
  });

  it("holds one copy for each statement and field that writes it, so no copy of several sharing an identity is left out", () => {
    // Oracle: the schema's statements, read independently of key-copies.ts: each containment whose
    // identity is a stated copy's is one place, and the list holds a copy at each such place.
    // Bound: every containment and mirrors of the composed Qti.
    const keyed = new Set(keyCopies.map(({ field, statement }) => `${String(statement)} ${field}`));

    assert.strictEqual(keyed.size, keyCopies.length, "two copies share a statement and a field");
    for (const { copy, document } of statedCopies) {
      const [law = "", field = ""] = copy.split(" → ");
      const listed = new Set(
        keyCopies
          .filter((held) => held.law === law && held.field === field)
          .map(({ statement }) => statement),
      );
      if (document && law.startsWith("contained ")) {
        assert.deepStrictEqual(
          [...listed].toSorted((a, b) => a - b),
          [...(placesByIdentity.get(law) ?? [])].toSorted((a, b) => a - b),
          `${copy}: the list holds it at other statements than the schema states it`,
        );
      }
    }
  });

  it("holds every keyText field of a document relation by a copy, or as a prefix of a held fold's end", () => {
    // Oracle: the schema's field types: every keyText field of Attribute and Node is the field of a
    // copy, or a running accumulator of a concat fold whose end a copy holds.
    // Bound: the document relations' fields.
    const held = new Set(keyCopies.map(({ field }) => field));
    const prefixes = new Set(
      statedLaws().flatMap(([law]) =>
        law.kind === "fold" && held.has(`${law.end.relation}.${law.end.terms.at(-1)?.field ?? ""}`)
          ? law.step.terms.slice(-2).map(({ field }) => `${law.step.relation}.${field}`)
          : [],
      ),
    );
    const documentFields = [...keyTextFields].filter((field) =>
      documentRelations.has(field.split(".")[0] ?? ""),
    );

    assert.deepStrictEqual(
      documentFields.filter((field) => !held.has(field) && !prefixes.has(field)),
      [],
    );
    assert.deepStrictEqual(
      keyCopies
        .filter(({ by }) => by === "check")
        .map(({ field, reads, source }) => `${source}.${reads} = ${field}`)
        .toSorted(),
      // The one check that equates a document field with a key text on one row: an IDREF's
      // lexical form and its tokens' concatenation (attributes.ts). A member's characters are its
      // string value's step itself (node.ts), held by the fold's keyText accumulators.
      ["Attribute.lexical = Attribute.idrefText"],
    );
  });

  it("leaves out only the copies whose source is no document row, each bounded where it is written", () => {
    // Oracle: the law table's copies into a keyText field from a relation the oracle has no rows
    // of, each bounded by its own type where its row is written: an entry's path is `EntryPath`,
    // which the oracle bounds as `Document.path`. A float map key's typed value is the query
    // `MapKeyFloat` over `MapKeyType`, and a resource's document's path meets a typed href in a
    // rule over the query `TypedHref`, so neither copies a text.
    // Bound: every law the schema states that is no check.
    assert.deepStrictEqual(
      [
        ...new Set(
          statedCopies
            .filter(({ document }) => !document)
            .map(({ copy, source }) => `${source} → ${copy.split(" → ")[1] ?? ""}`),
        ),
      ].toSorted(),
      ["Entry.path → FileHref.path"],
    );
  });
});

/**
 * The places of a generated package a key text, or a text no key holds, is written at.
 *
 * - `p id`: a paragraph's `id`, `DocumentId.lexical`;
 * - `idref`: a span's `id` and the paragraph's `aria-describedby` that names it, an IDREFS whose
 *   tokens' text is `Attribute.idrefText`;
 * - `item identifier`, `item title`: the item's, `AssessmentObject`'s;
 * - `xml:lang`: a paragraph's, `XmlLang.lang`;
 * - `response identifier`: the response's declaration and its interaction's `response-identifier`;
 * - `choice identifier`: a choice's and the correct response's value, a copied string value;
 * - `map key`: a map entry's `map-key`, `MapKey.key`;
 * - `string value`: a string outcome's default value, a copied string value;
 * - `resource identifier`, `manifest identifier`: the manifest's, `Resource.identifier` and
 *   `ManifestId.identifier`;
 * - `free attribute`, `free text`: a `data-*` attribute and a paragraph's text, which no key holds.
 */
const sites = [
  "p id",
  "idref",
  "item identifier",
  "item title",
  "xml:lang",
  "response identifier",
  "choice identifier",
  "map key",
  "string value",
  "resource identifier",
  "manifest identifier",
  "free attribute",
  "free text",
] as const;

/**
 * A place a generated package writes a text at.
 */
type Site = (typeof sites)[number];

/**
 * The ASCII letter each place's drawn text starts with, distinct, so no two places draw one text
 * and no drawn identifier collides with another or with a short default.
 */
const siteLetters: Readonly<Record<Site, string>> = {
  "choice identifier": "c",
  "free attribute": "f",
  "free text": "t",
  idref: "h",
  "item identifier": "i",
  "item title": "k",
  "manifest identifier": "m",
  "map key": "q",
  "p id": "p",
  "resource identifier": "r",
  "response identifier": "s",
  "string value": "v",
  "xml:lang": "x",
};

/**
 * The places whose text no key holds, which no length refuses.
 */
const freeSites: ReadonlySet<Site> = new Set(["free attribute", "free text"]);

/**
 * The scripts a text is written in, by the UTF-8 bytes of their one character: `a`, `é`, `中` and
 * U+10000. The first three are name characters of XML 1.0 Second Edition, so every place an NCName
 * goes takes them; U+10000 is none (reading 94), so a text in it past its leading letter names
 * nothing at any length, and its import writes no row of the name (reading 152), as its twin's
 * does ({@link twinOf}).
 */
const scripts = ["1-byte", "2-byte", "3-byte", "4-byte"] as const;

/**
 * A script a text is written in.
 */
type Script = (typeof scripts)[number];

/**
 * The one character of each script.
 */
const glyphs: Readonly<Record<Script, string>> = {
  "1-byte": "a",
  "2-byte": "é",
  "3-byte": "中",
  "4-byte": "\u{10000}",
};

/**
 * One generated text: its script and how many of its character it repeats.
 */
interface Drawn {
  readonly count: number;
  readonly script: Script;
}

/**
 * A generated package: the texts drawn at some of its places, each other place keeping its short
 * default.
 */
type Sketch = Readonly<Partial<Record<Site, Drawn>>>;

/**
 * `keyText`'s pattern, read as grizzle installs it: its one `str.regex` pattern.
 */
const keyTextPattern = new RegExp(keyText.patterns[0].source, keyText.patterns[0].flags);

/**
 * Decide whether the schema's type admits a text as a key text, as grizzle's `str.bytes` domain
 * checks it: at most `keyTextBytes` UTF-8 bytes, then `keyText`'s pattern.
 *
 * @param text - The text.
 * @returns Whether `keyText` admits it.
 */
const admitsKeyText = (text: string): boolean =>
  utf8Length(text) <= keyTextBytes && keyTextPattern.test(text);

/**
 * Write a drawn text: its place's letter, then its script's character, `count` characters in all.
 *
 * @param letter - The place's letter.
 * @param drawnText - The text drawn: its script and its count, at least 1.
 * @returns The text.
 */
const textOf = (letter: string, { count, script }: Drawn): string =>
  `${letter}${glyphs[script].repeat(Math.max(0, count - 1))}`;

/**
 * The most characters of a script a key text holds, by the schema's type alone, a drawn text's
 * leading letter counted.
 *
 * @param script - The script.
 * @returns The greatest count of a drawn text in it `keyText` admits.
 */
const edgeOf = (script: Script): number => {
  let low = 1;
  let high = 16_384;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (admitsKeyText(textOf("a", { count: middle, script }))) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }

  return low;
};

/**
 * Each script's edge, {@link edgeOf}.
 */
const edges: Readonly<Record<Script, number>> = {
  "1-byte": edgeOf("1-byte"),
  "2-byte": edgeOf("2-byte"),
  "3-byte": edgeOf("3-byte"),
  "4-byte": edgeOf("4-byte"),
};

/**
 * Write a language tag of exactly `count` ASCII characters, `xs:language`'s form: `a`, then `aa`
 * where the count is even, then `-a` subtags.
 *
 * @param count - The tag's length, at least 1.
 * @returns The tag.
 */
const languageOf = (count: number): string =>
  count % 2 === 0 ? `aa${"-a".repeat((count - 2) / 2)}` : `a${"-a".repeat((count - 1) / 2)}`;

/**
 * The text a package writes at a place: its drawn text, else its short default.
 *
 * @param sketch - The package.
 * @param site - The place.
 * @param short - The place's default.
 * @returns The text.
 */
const textAt = (sketch: Sketch, site: Site, short: string): string => {
  const held = sketch[site];
  if (held === undefined) {
    return short;
  }

  return site === "xml:lang" ? languageOf(held.count) : textOf(siteLetters[site], held);
};

/**
 * Write a generated package: one choice item with a mapped identifier response and a string
 * outcome, and its manifest.
 *
 * @param sketch - The package.
 * @returns Its entries, each encoded as UTF-8.
 */
const packageOf = (sketch: Sketch): ReadonlyMap<string, Uint8Array> => {
  const at = (site: Site, short: string): string => textAt(sketch, site, short);
  const item = `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${at("item identifier", "item")}" title="${at("item title", "Item")}" time-dependent="false">
  <qti-response-declaration identifier="${at("response identifier", "RESPONSE")}" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>${at("choice identifier", "A")}</qti-value></qti-correct-response>
    <qti-mapping default-value="0"><qti-map-entry map-key="${at("map key", "A")}" mapped-value="1"/></qti-mapping>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="NOTE" cardinality="single" base-type="string"><qti-default-value><qti-value>${at("string value", "none")}</qti-value></qti-default-value></qti-outcome-declaration>
  <qti-item-body>
    <p id="${at("p id", "intro")}" xml:lang="${at("xml:lang", "en")}" data-note="${at("free attribute", "note")}">${at("free text", "Pick one.")}</p>
    <p aria-describedby="${at("idref", "hint")}"><span id="${at("idref", "hint")}">Hint</span></p>
    <qti-choice-interaction response-identifier="${at("response identifier", "RESPONSE")}" max-choices="1">
      <qti-simple-choice identifier="${at("choice identifier", "A")}">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;
  const manifest = `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="${at("manifest identifier", "M")}">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="${at("resource identifier", "R")}" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources>
</manifest>`;

  return new Map([
    ["imsmanifest.xml", new TextEncoder().encode(manifest)],
    ["item.xml", new TextEncoder().encode(item)],
  ]);
};

/**
 * A family of the schema as its statement keeps it: its owner, its count and its member's relation.
 */
const FamilySchema = Schema.Struct({
  family: Schema.Struct({
    source: Schema.Union([
      Schema.Struct({ relation: Schema.Struct({ name: Schema.String }) }),
      Schema.Struct({ name: Schema.String }),
    ]),
  }),
  kind: Schema.Literals(["counted", "ordered", "tree"]),
  slots: Schema.Struct({ count: Schema.String, owner: Schema.Struct({ name: Schema.String }) }),
});

/**
 * The member relation of each family, by its owner and count field, as `Owner.count`: the field a
 * writer nests the members' rows at.
 */
const memberOf: ReadonlyMap<string, string> = new Map(
  Qti.statements.flatMap((statement) =>
    Option.match(Schema.decodeUnknownOption(FamilySchema)(statement), {
      onNone: () => [],
      onSome: ({ family, slots }) => [
        [
          `${slots.owner.name}.${slots.count}`,
          "relation" in family.source ? family.source.relation.name : family.source.name,
        ] as const,
      ],
    }),
  ),
);

/**
 * A written row's fields, each read as text, a nested family's rows, or neither.
 */
const WrittenRow = Schema.Record(Schema.String, Schema.Unknown);

/**
 * A nested family's written rows.
 */
const WrittenRows = Schema.Array(WrittenRow);

/**
 * A relation's written rows, keyed by the text of their key.
 */
const WrittenMap = Schema.ReadonlyMap(Schema.String, WrittenRow);

/**
 * A written row, as {@link WrittenRow} reads it.
 */
type Written = typeof WrittenRow.Type;

/**
 * A written row's scalar fields as a selection reads them: its texts and its integers.
 *
 * @param row - The row.
 * @returns Its scalars.
 */
const scalarsOf = (row: Written): Readonly<Record<string, Datum>> =>
  Object.fromEntries(
    Object.entries(row).flatMap(([field, value]) =>
      Predicate.isString(value) || Predicate.isBigInt(value) ? [[field, value] as const] : [],
    ),
  );

/**
 * Read a text field of a written row.
 *
 * @param row - The row.
 * @param field - The field.
 * @returns Its text.
 * @throws {Error} When the row holds no text there: the import writes every text a fold steps by
 *   and a tree's copy reads, so a row without one is a defect of this file's reading, never of the
 *   package.
 */
const writtenText = (row: Written, field: string): string => {
  const value = row[field];
  if (!Predicate.isString(value)) {
    throw new TypeError(
      `A written row holds no text at ${field}, which a fold's step or a tree's copy reads. Read the field its relation writes.`,
    );
  }

  return value;
};

/**
 * Read a generated key text of a written row at the value PostgreSQL computes: its term, as
 * grizzle keeps it in its relation's description (`#pantry/test/key-copies.ts`
 * `generatedFields`), over the row's written scalars ({@link scalarsOf}). Its type is `keyText`,
 * whose domain refuses a value past the bound as a written key text's does.
 *
 * @param relation - The row's relation.
 * @param field - The generated field.
 * @param valueOf - Its value over a row.
 * @param row - The row as the import writes it.
 * @returns The text.
 * @throws {Error} When the term is unknown over the row: it reads a field the row does not write,
 *   or a term the host's evaluator does not read, so the bound the text must meet goes unchecked.
 */
const generatedText = (
  relation: string,
  field: string,
  valueOf: (row: Readonly<Record<string, Datum>>) => Datum | undefined,
  row: Written,
): string => {
  const value = valueOf(scalarsOf(row));
  if (!Predicate.isString(value)) {
    throw new TypeError(
      `The generated key text ${relation}.${field} is unknown over a written row: its term reads a field the row does not write, or a term the host's evaluator does not read. Teach key-copies.ts's evaluator the term, so the text's bound is checked.`,
    );
  }

  return value;
};

/**
 * A row's generated key texts, by field, each at the value PostgreSQL computes
 * ({@link generatedText}).
 *
 * @param relation - The row's relation.
 * @param row - The row as the import writes it.
 * @returns The generated texts.
 */
const generatedTextsOf = (relation: string, row: Written): ReadonlyMap<string, string> =>
  new Map(
    Option.toArray(Option.fromUndefinedOr(generatedFields.get(relation))).flatMap((generated) =>
      [...generated].flatMap(([field, valueOf]) =>
        isKeyText(relation, field)
          ? [[field, generatedText(relation, field, valueOf, row)] as const]
          : [],
      ),
    ),
  );

/**
 * Read a member's step value: its generated text where PostgreSQL computes the step, else the text
 * it writes.
 *
 * @param relation - The member's relation.
 * @param row - The member as the import writes it.
 * @param field - The step's field.
 * @returns The step's text.
 */
const stepOf = (relation: string, row: Written, field: string): string =>
  Option.match(Option.fromUndefinedOr(generatedFields.get(relation)?.get(field)), {
    onNone: () => writtenText(row, field),
    onSome: (valueOf) => generatedText(relation, field, valueOf, row),
  });

/**
 * A concat fold as grizzle keeps it: its family's owner and count, its monoid, its step side, the
 * selection it steps by among them, and its end side's relation and terms.
 */
const FoldRead = Schema.Struct({
  end: SideRead,
  family: Schema.Struct({
    slots: Schema.Struct({ count: Schema.String, owner: Schema.Struct({ name: Schema.String }) }),
  }),
  kind: Schema.Literal("fold"),
  monoid: Schema.Struct({ name: Schema.String }),
  step: SideSchema,
});

/**
 * The end each concat fold of the schema into a `keyText` field computes, by its owner and count
 * field: its owner's field, the member field each step adds, and the selection of the members it
 * steps, read from the schema's own statements, since the law table names a fold by its slots,
 * monoid and end alone.
 */
const concatEnds: ReadonlyMap<
  string,
  {
    readonly end: string;
    readonly selected: (row: Readonly<Record<string, Datum>>) => boolean | undefined;
    readonly step: string;
  }
> = new Map(
  Qti.statements.flatMap((statement) =>
    Option.match(Schema.decodeUnknownOption(FoldRead)(statement), {
      onNone: () => [],
      onSome: ({ end, family, monoid, step }) => {
        const owner = lawSideOf(end);
        const held = owner.terms.at(-1)?.field ?? "";
        const side = judgedSideOf(step);
        const added = side.law.terms.at(-3)?.field ?? "";

        return monoid.name === "concat" && isKeyText(owner.relation, held)
          ? [
              [
                `${family.slots.owner.name}.${family.slots.count}`,
                { end: held, selected: side.selection, step: added },
              ] as const,
            ]
          : [];
      },
    }),
  ),
);

/**
 * The parent copies a tree's member reads, as grizzle fills them along the owner axis from the row
 * it nests in: its parent's kind and governor, and its grandparent's kind, the parent's own
 * `parentKind`; and its `start`, past the root's 0.
 *
 * @param owner - The member's parent, as the import writes it.
 * @param copies - The parent's own copies.
 * @returns The member's copies.
 * @throws {Error} When the parent holds no `parentKind` copy, which every tree row holds: its
 *   parent's kind, or for the root its own (N1).
 */
const treeCopies = (owner: Written, copies: Readonly<Record<string, Datum>>) => {
  const grandparent = copies["parentKind"];
  if (grandparent === undefined) {
    throw new Error(
      "A tree row nests members with no parentKind copy of its own. Give every root its own kind, as N1 does.",
    );
  }

  return {
    parentGovernor: writtenText(owner, "governor"),
    parentKind: writtenText(owner, "kind"),
    parentParentKind: grandparent,
    start: 1n,
  };
};

/**
 * Collect the key texts a package's import rows hold that the schema's type does not admit, by
 * `Relation.field`: each `keyText` field of each written row, nested families' rows included, each
 * generated one at the value PostgreSQL computes, and each concat fold's end the database computes
 * from a written family, over the members its step selects, each with the copies its selection
 * reads ({@link treeCopies}).
 *
 * @param inputs - The import's rows.
 * @returns The fields that hold a text past the bound.
 */
const refusedFields = (inputs: PackageInputs): ReadonlySet<string> => {
  const refused = new Set<string>();
  const visit = (relation: string, row: Written, copies: Readonly<Record<string, Datum>>): void => {
    for (const [field, text] of generatedTextsOf(relation, row)) {
      if (!admitsKeyText(text)) {
        refused.add(`${relation}.${field}`);
      }
    }

    for (const [field, value] of Object.entries(row)) {
      const member = memberOf.get(`${relation}.${field}`);
      const nested = Schema.decodeUnknownOption(WrittenRows)(value);
      if (member !== undefined && Option.isSome(nested)) {
        const held = member === relation ? treeCopies(row, copies) : {};
        for (const each of nested.value) {
          visit(member, each, held);
        }

        const fold = concatEnds.get(`${relation}.${field}`);
        if (fold !== undefined) {
          const end = nested.value
            .filter((each) => fold.selected({ ...scalarsOf(each), ...held }) === true)
            .map((each) => stepOf(member, each, fold.step))
            .join("");
          if (!admitsKeyText(end)) {
            refused.add(`${relation}.${fold.end}`);
          }
        }
      } else if (Predicate.isString(value) && isKeyText(relation, field) && !admitsKeyText(value)) {
        refused.add(`${relation}.${field}`);
      }
    }
  };
  for (const [relation, rows] of Object.entries(inputs)) {
    for (const row of Option.getOrElse(
      Schema.decodeUnknownOption(WrittenMap)(rows),
      () => new Map<string, Written>(),
    ).values()) {
      // A root's parent copies are its own (N1); a row of no tree reads none.
      const { kind } = row;
      visit(relation, row, Predicate.isString(kind) ? { parentKind: kind } : {});
    }
  }

  return refused;
};

/**
 * A situation a search must reach: a place drawn past the bound, in a script, a text no key holds
 * drawn past it, another law the package breaks, and the verdict.
 */
type Situation =
  | `${Script} past the bound`
  | `${Site} past the bound`
  | "a free text past the bound"
  | "accepted"
  | "another law broken too"
  | "refused";

/**
 * The relations an import writes fewer rows of for a package than for its twin ({@link twinOf}):
 * each a copy an overlay leaves out because its text is past `keyText`, which the copy's
 * containment then refuses for the row it lacks. The twin differs from the package in its texts'
 * lengths alone, so a row an overlay leaves out of both, a name's that names nothing (reading
 * 152), is no copy the bound left out.
 *
 * @param long - The package's rows, counted by relation.
 * @param short - Its twin's.
 * @returns The relations, each as `Relation.*`.
 */
const leftOut = (
  long: ReadonlyMap<string, number>,
  short: ReadonlyMap<string, number>,
): ReadonlySet<string> =>
  new Set(
    [...short].flatMap(([relation, rows]) =>
      (long.get(relation) ?? 0) < rows ? [`${relation}.*`] : [],
    ),
  );

/**
 * The rules the database refuses a package's import under for its key texts, read from its rows:
 * `key-text-bound` where a written `keyText` field holds a text past the bound, which the type's
 * own check refuses, and for a copy left out of a relation, the rule of each containment the law
 * table states into that relation, which then finds no row.
 *
 * @param refused - The fields the import's rows hold past the bound, and each relation it leaves a
 *   copy out of, as `Relation.*`.
 * @returns The rules.
 */
const databaseRules = (refused: ReadonlySet<string>): ReadonlySet<string> =>
  new Set(
    [...refused].flatMap((held) => {
      const [relation = "", field = ""] = held.split(".");
      if (field !== "*") {
        return ["key-text-bound"];
      }

      return statedLaws().flatMap(([law]) =>
        law.kind === "contained" && law.to.relation === relation
          ? Option.toArray(ruleOfLaw(law))
          : [],
      );
    }),
  );

/**
 * The most characters a twin's text holds: its place's letter and one character of its script, so
 * the twin keeps what each drawn text names, and no twin's text is near the bound.
 */
const twinCount = 2;

/**
 * A package's twin: each drawn text at {@link twinCount} characters of its own script, or as it is
 * where it is shorter. An NCName's production states no length (reading 94), so a text and its
 * twin name the same, and only the bound tells their imports apart.
 *
 * @param sketch - The package.
 * @returns Its twin.
 */
const twinOf = (sketch: Sketch): Sketch => {
  const twin: Partial<Record<Site, Drawn>> = {};
  for (const site of sites) {
    const held = sketch[site];
    if (held !== undefined) {
      twin[site] = { count: Math.min(held.count, twinCount), script: held.script };
    }
  }

  return twin;
};

/**
 * Count the rows the import writes for a package's twin ({@link twinOf}), by relation: the rows
 * the package's own are compared with.
 *
 * @param sketch - The package.
 * @returns Its twin's rows, counted by relation.
 */
const twinRows = (sketch: Sketch) =>
  Effect.gen(function* twinRowsOf() {
    const dir = yield* scopedPackage(packageOf(twinOf(sketch)));

    return rowCountsOf(yield* readProgram(dir));
  }).pipe(Effect.scoped);

/**
 * Judge one generated package both ways: the oracle's "Key text bound" breaches against the
 * database's refusal of the same texts as the import's rows give it, a `keyText` field written past
 * what the schema's type admits, or a copy left out of a relation its containment reads; and the
 * rule each would refuse it under ({@link databaseRules}) against the rules the oracle names.
 *
 * @param sketch - The package.
 * @param note - Notes the situations it reaches.
 * @returns Nothing; fails on a disagreement.
 */
const judged = (sketch: Sketch, note: (situation: Situation) => void) =>
  Effect.gen(function* judgedCase() {
    const literal = Formatter.format(sketch);
    const dir = yield* scopedPackage(packageOf(sketch));
    const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
    const breaches =
      judgment._tag === "Judged"
        ? judgment.breaches
        : assert.fail(
            `${literal}: the oracle's codec refused it: ${judgment.rule}, ${judgment.detail}`,
          );
    const bound = breaches.filter(({ law }) => law === "Key text bound");
    const named = new Set(bound.map(({ keys }) => keys["field"] ?? ""));
    const program = yield* readProgram(dir);
    const refused = new Set([
      ...refusedFields(program.inputs),
      ...leftOut(rowCountsOf(program), yield* twinRows(sketch)),
    ]);
    for (const site of sites) {
      const held = sketch[site];
      if (held !== undefined && held.count > edges[held.script]) {
        note(`${site} past the bound`);
        note(`${held.script} past the bound`);
        if (freeSites.has(site)) {
          note("a free text past the bound");
        }
      }
    }

    note(refused.size > 0 ? "refused" : "accepted");
    assert.strictEqual(
      bound.length > 0,
      refused.size > 0,
      `${literal}: the oracle names ${[...named].join(", ") || "no key text"}, and the import's rows hold ${[...refused].join(", ") || "none"} past the bound`,
    );
    for (const field of named) {
      assert.isTrue(
        refused.has(field) || refused.has(`${field.split(".")[0] ?? ""}.*`),
        `${literal}: the oracle names ${field}, which the import's rows hold within the bound (${[...refused].join(", ")})`,
      );
    }

    const oracleRules = new Set<string>(breaches.map(({ law }) => ruleOf(law)));
    for (const rule of databaseRules(refused)) {
      assert.isTrue(
        oracleRules.has(rule),
        `${literal}: the database refuses it under ${rule}, and the oracle under ${[...oracleRules].join(", ") || "none"}`,
      );
    }

    if (breaches.some(({ law }) => law !== "Key text bound")) {
      note("another law broken too");
    }
  }).pipe(Effect.scoped);

/**
 * The box: the package with every place short; then each place alone, in each script, at the
 * most characters the schema's type admits and one more (a language tag in ASCII alone).
 */
const boxCases: Arr.NonEmptyReadonlyArray<Sketch> = [
  {},
  ...sites.flatMap((site) =>
    (site === "xml:lang" ? (["1-byte"] as const) : scripts).flatMap((script) =>
      [edges[script], edges[script] + 1].map((count): Sketch => ({ [site]: { count, script } })),
    ),
  ),
];

/**
 * Draw a package by its own swarm: the places it lengthens, each in a script the case's swarm
 * weighs, at one of the counts that matter, 1, one short of the edge, the edge, one past it, or
 * twice it.
 */
const swarmedSketch: Gen<{ readonly sketch: Sketch; readonly swarm: Swarm<Script | Site> }> = (
  source,
) => {
  const drawnSwarm = source.draw(swarm<Script | Site>([...sites, ...scripts]));
  const sketch: Partial<Record<Site, Drawn>> = {};
  for (const site of sites) {
    if (source.draw(keep(drawnSwarm, site))) {
      const script = site === "xml:lang" ? "1-byte" : source.draw(swarmChoice(drawnSwarm, scripts));
      const edge = edges[script];
      sketch[site] = {
        count: source.draw(element([1, edge - 1, edge, edge + 1, 2 * edge])),
        script,
      };
    }
  }

  return { sketch, swarm: drawnSwarm };
};

/**
 * A stored relation of the schema as grizzle keeps it, for its fields' names.
 */
const FieldsRead = Schema.Struct({
  fields: Schema.Record(Schema.String, Schema.Unknown),
  kind: Schema.Literal("relation"),
  name: Schema.String,
});

describe("the import's key texts as the database computes them", () => {
  it("evaluates the term of every generated step of a concat fold into a key text, so the database's end is judged at its value", () => {
    // Oracle: the schema's own statements and the terms grizzle keeps in each relation's
    // description: every concat fold into a keyText end whose step PostgreSQL generates has a term
    // the host evaluates to a text, over a row holding a text at each of its relation's fields, so
    // no package that writes the step's relation meets a generated text it cannot check.
    // Bound: the composed schema's concat folds.
    const steps = new Set(
      [...concatEnds].flatMap(([family, { step }]) =>
        Option.toArray(Option.fromUndefinedOr(memberOf.get(family))).map(
          (member) => `${member}.${step}`,
        ),
      ),
    );
    const evaluated = Object.values(Qti.relations).flatMap((member) =>
      Option.match(Schema.decodeUnknownOption(FieldsRead)(member), {
        onNone: () => [],
        onSome: ({ fields, name }) => {
          const row = Object.fromEntries(Object.keys(fields).map((field) => [field, `<${field}>`]));

          return Option.toArray(Option.fromUndefinedOr(generatedFields.get(name))).flatMap(
            (generated) =>
              [...generated].flatMap(([field, valueOf]) =>
                steps.has(`${name}.${field}`) ? [[`${name}.${field}`, valueOf(row)] as const] : [],
              ),
          );
        },
      }),
    );

    assert.isAbove(evaluated.length, 0, "a generated step of a concat fold into a key text");
    assert.deepStrictEqual(
      evaluated.flatMap(([step, value]) => (Predicate.isString(value) ? [] : [step])),
      [],
      "a generated step whose term the host does not evaluate to a text",
    );
  });
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "the oracle's key-text verdict",
  (test) => {
    test.effect(
      "refuses each package of the box under Key text bound exactly where its import's rows hold a text keyText does not admit, under the rule the database names",
      (ctx) =>
        // Oracle: a differential, the import's rows (readProgram, every overlay's copy and every
        // concat fold's end) under the schema's own keyText type, against the oracle's breaches.
        // Bound: every place alone at the edge and one past it in each of four scripts, and the
        // package with every place short.
        Effect.gen(function* box() {
          const exhausted = yield* searched(
            ctx,
            exhaust(
              {
                box: "each place alone at the edge and one past it, in 1-, 2-, 3- and 4-byte scripts",
                caseHang: Duration.seconds(120),
                coverage: requiredInSpace<Situation>([
                  "1-byte past the bound",
                  "2-byte past the bound",
                  "3-byte past the bound",
                  "4-byte past the bound",
                  "a free text past the bound",
                  "accepted",
                  "idref past the bound",
                  "p id past the bound",
                  "refused",
                  "xml:lang past the bound",
                ]),
                generator: element(boxCases),
                limit: boxCases.length,
                literal: Formatter.format,
                oracle: { kind: "second-implementation", name: "the import's rows under keyText" },
                suite: "pantry/test/oracle-keys-box",
              },
              (sketch, c) =>
                judged(sketch, (situation) => {
                  c.note(situation);
                }),
            ),
          );

          assert.strictEqual(exhausted.cases, boxCases.length);
        }),
      { timeout: testTimeoutMs },
    );

    test.effect(
      "refuses each swarmed package under Key text bound exactly where its import's rows hold a text keyText does not admit, under the rule the database names",
      (ctx) =>
        // Oracle: as the box's. Bound: each case under its own swarm of the 13 places and 4 scripts,
        // each place at 1, one short of the edge, the edge, one past it or twice it; 60 runs.
        searched(
          ctx,
          explore(
            {
              caseHang: Duration.seconds(120),
              concurrency: 1,
              coverage: required<Situation>(["accepted", "refused"], {
                cases: 30,
                sense: notesOnly,
              }),
              draw: drawn(swarmedSketch),
              kept: [],
              literal: ({ sketch }) => Formatter.format(sketch),
              oracle: {
                kind: "second-implementation",
                name: "the import's rows under keyText",
              },
              runs: 60,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/test/oracle-keys-swarm",
            },
            ({ sketch }, c) =>
              judged(sketch, (situation) => {
                c.note(situation);
              }),
          ),
        ),
      { timeout: testTimeoutMs },
    );
  },
);

it("draws every edge from the schema's type: the edge admitted and one past it refused", () => {
  // Oracle: the specification as a checker, `keyText`'s pattern itself.
  // Bound: the four scripts.
  for (const script of scripts) {
    assert.isTrue(admitsKeyText(textOf("a", { count: edges[script], script })), script);
    assert.isFalse(admitsKeyText(textOf("a", { count: edges[script] + 1, script })), script);
  }
});
