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
import { lawIdentity, lawRules, statedLaws } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import { keyText, keyTextBytes, utf8Length } from "#pantry/qti/limits.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { keyCopies, keyTextFields } from "#pantry/test/key-copies.ts";
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
const statedCopies = statedLaws.flatMap(([law]) => {
  if (law.kind === "contained") {
    return law.from.terms.flatMap((term, at) => {
      const held = law.to.terms[at]?.field ?? "";

      return isKeyText(law.to.relation, held) && !isKeyText(law.from.relation, term.field)
        ? [
            {
              copy: `${lawIdentity(law)} → ${law.to.relation}.${held}`,
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
          copy: `${lawIdentity(law)} → ${law.end.relation}.${held}`,
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
        const identity = lawIdentity({
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
      statedLaws.flatMap(([law]) =>
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
      // The two checks that equate a document field with a key text on one row: an IDREF's
      // lexical form and its tokens' concatenation (attributes.ts), and a member's characters and
      // its string value's step (node.ts).
      ["Attribute.lexical = Attribute.idrefText", "Node.chars = Node.stringPiece"],
    );
  });

  it("leaves out only the copies whose source is no document row, each bounded where it is written", () => {
    // Oracle: the law table's copies into a keyText field from a relation the oracle has no rows
    // of, each bounded by its own type where its row is written: a document's path and an entry's
    // are `EntryPath`, which the oracle bounds as `Document.path`, and a float map key's host
    // value mirrors `MapKey.key`, which copies the attribute.
    // Bound: every law the schema states that is no check.
    assert.deepStrictEqual(
      [
        ...new Set(
          statedCopies
            .filter(({ document }) => !document)
            .map(({ copy, source }) => `${source} → ${copy.split(" → ")[1] ?? ""}`),
        ),
      ].toSorted(),
      [
        "Document.path → NamedHref.path",
        "Entry.path → FileHref.path",
        "MapKeyFloat.key → MapKey.key",
      ],
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
 * U+10000, each a name start character of XML 1.0, so every place an NCName goes takes it.
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
 * `keyText`'s pattern, read as grizzle installs it.
 */
const keyTextPattern = new RegExp(keyText.pattern.source, keyText.pattern.flags);

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
 * A concat fold as grizzle keeps it: its family's owner and count, its monoid, its step side's
 * terms and its end side's relation and terms.
 */
const FoldRead = Schema.Struct({
  end: SideRead,
  family: Schema.Struct({
    slots: Schema.Struct({ count: Schema.String, owner: Schema.Struct({ name: Schema.String }) }),
  }),
  kind: Schema.Literal("fold"),
  monoid: Schema.Struct({ name: Schema.String }),
  step: SideRead,
});

/**
 * The end each concat fold of the schema into a `keyText` field computes, by its owner and count
 * field: its owner's field and the member field each step adds, read from the schema's own
 * statements, since the law table names a fold by its slots, monoid and end alone.
 */
const concatEnds: ReadonlyMap<string, { readonly end: string; readonly step: string }> = new Map(
  Qti.statements.flatMap((statement) =>
    Option.match(Schema.decodeUnknownOption(FoldRead)(statement), {
      onNone: () => [],
      onSome: ({ end, family, monoid, step }) => {
        const owner = lawSideOf(end);
        const held = owner.terms.at(-1)?.field ?? "";
        const added = lawSideOf(step).terms.at(-3)?.field ?? "";

        return monoid.name === "concat" && isKeyText(owner.relation, held)
          ? [
              [
                `${family.slots.owner.name}.${family.slots.count}`,
                { end: held, step: added },
              ] as const,
            ]
          : [];
      },
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
 * Collect the key texts a package's import rows hold that the schema's type does not admit, by
 * `Relation.field`: each `keyText` field of each written row, nested families' rows included, and
 * each concat fold's end the database computes from a written family.
 *
 * @param inputs - The import's rows.
 * @returns The fields that hold a text past the bound.
 */
const refusedFields = (inputs: PackageInputs): ReadonlySet<string> => {
  const refused = new Set<string>();
  const visit = (relation: string, row: typeof WrittenRow.Type): void => {
    for (const [field, value] of Object.entries(row)) {
      const member = memberOf.get(`${relation}.${field}`);
      const nested = Schema.decodeUnknownOption(WrittenRows)(value);
      if (member !== undefined && Option.isSome(nested)) {
        for (const each of nested.value) {
          visit(member, each);
        }

        const fold = concatEnds.get(`${relation}.${field}`);
        const end = nested.value
          .map((each) => {
            const added = each[fold?.step ?? ""];

            return Predicate.isString(added) ? added : "";
          })
          .join("");
        if (fold !== undefined && !admitsKeyText(end)) {
          refused.add(`${relation}.${fold.end}`);
        }
      } else if (Predicate.isString(value) && isKeyText(relation, field) && !admitsKeyText(value)) {
        refused.add(`${relation}.${field}`);
      }
    }
  };
  for (const [relation, rows] of Object.entries(inputs)) {
    for (const row of Option.getOrElse(
      Schema.decodeUnknownOption(WrittenMap)(rows),
      () => new Map<string, typeof WrittenRow.Type>(),
    ).values()) {
      visit(relation, row);
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
 * The relations an import writes fewer rows of for a package than for its twin with every place
 * short: each a copy an overlay leaves out because its text is past `keyText` (as
 * `#pantry/import/overlays/identity.ts` leaves out a long ID's `DocumentId`), which the copy's
 * containment then refuses for the row it lacks.
 *
 * @param long - The package's rows, counted by relation.
 * @param short - Its short twin's.
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

      return statedLaws.flatMap(([law]) =>
        law.kind === "contained" && law.to.relation === relation
          ? Option.toArray(Option.fromUndefinedOr(lawRules.get(lawIdentity(law))))
          : [],
      );
    }),
  );

/**
 * Count the rows the import writes for the package with every place short, by relation: the twin
 * every case's rows are compared with.
 */
const shortTwin = Effect.gen(function* shortTwin() {
  const dir = yield* scopedPackage(packageOf({}));

  return rowCountsOf(yield* readProgram(dir));
}).pipe(Effect.scoped);

/**
 * Judge one generated package both ways: the oracle's "Key text bound" breaches against the
 * database's refusal of the same texts as the import's rows give it, a `keyText` field written past
 * what the schema's type admits, or a copy left out of a relation its containment reads; and the
 * rule each would refuse it under ({@link databaseRules}) against the rules the oracle names.
 *
 * @param sketch - The package.
 * @param short - The rows its short twin writes, counted by relation ({@link shortTwin}).
 * @param note - Notes the situations it reaches.
 * @returns Nothing; fails on a disagreement.
 */
const judged = (
  sketch: Sketch,
  short: ReadonlyMap<string, number>,
  note: (situation: Situation) => void,
) =>
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
      ...leftOut(rowCountsOf(program), short),
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
          const short = yield* shortTwin;
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
                judged(sketch, short, (situation) => {
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
        shortTwin.pipe(
          Effect.flatMap((short) =>
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
                  judged(sketch, short, (situation) => {
                    c.note(situation);
                  }),
              ),
            ),
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
