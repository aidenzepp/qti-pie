import type { AnyRelation } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result, Schema } from "effect";
import {
  admittedIn,
  attributesOf,
  domainOf,
  generate,
  mediaRevisions,
  supplement,
  valueDomains,
} from "#pantry/grammar/attributes.ts";
import type {
  Admitted,
  AttributeVocabulary,
  Declared,
  ValueDomain,
} from "#pantry/grammar/attributes.ts";
import { ownByKind, shared } from "#pantry/schema/attribute-homes.ts";
import type { Index, Reader } from "#pantry/schema/attribute-homes.ts";
import * as family from "#pantry/schema/attributes.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import { BaseType, TypedCardinality } from "#pantry/schema/declaration.ts";
import { AttributeName, NodeKind, SchemaVersion } from "#pantry/schema/node.ts";
import { BuiltIn } from "#pantry/schema/processing.ts";
import { attributeAdmission } from "#pantry/schema/seed/admission.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * Today's composition of the attribute vocabularies: the XSD inventory's ASI, HTML and processing
 * kinds with the 3.0.0 media revisions, and the kinds the inventory does not hold.
 */
const today: readonly AttributeVocabulary[] = [
  { attributes: attributesOf(inventory), revisions: mediaRevisions },
  supplement,
];

/**
 * Today's attribute grammar, over today's `NodeKind` (K = 363), `AttributeName` (A = 221) and
 * `SchemaVersion` rosters.
 */
const grammar = Effect.fromResult(
  generate({
    kinds: NodeKind.handles,
    names: AttributeName.handles,
    versions: SchemaVersion.handles,
    vocabularies: today,
  }),
);

/**
 * Today's admitted attributes, as the generator lists them.
 */
const admitted = Effect.fromResult(admittedIn(SchemaVersion.handles, today));

/**
 * Spell a (kind, name) pair as one key.
 *
 * @param kind - The kind's handle.
 * @param name - The attribute's name.
 * @returns `kind name`.
 */
const pairOf = (kind: string, name: string): string => `${kind} ${name}`;

/**
 * List the domain of each admitted attribute of one version, by pair.
 *
 * @param rows - The admitted attributes.
 * @param version - The version.
 * @returns Each pair's domain in that version.
 */
const domainsIn = (rows: readonly Admitted[], version: string): ReadonlyMap<string, ValueDomain> =>
  new Map(
    rows
      .filter((row) => row.version === version)
      .map((row) => [pairOf(row.kind, row.name), row.domain]),
  );

/**
 * Find a value domain by handle.
 *
 * @param handle - The handle.
 * @returns The domain, or none.
 */
const domainNamed = (handle: string): Option.Option<ValueDomain> =>
  Option.fromNullishOr(valueDomains.find((domain) => domain.handle === handle));

describe("the value domains", () => {
  it("are 81, each one distinct definition under its own handle", () => {
    const definitions = new Set(
      valueDomains.map(
        ({ datatype, flags, source, whiteSpace }) =>
          `${source}\u0000${flags}\u0000${whiteSpace}\u0000${datatype}`,
      ),
    );

    assert.strictEqual(valueDomains.length, 81);
    assert.strictEqual(new Set(valueDomains.map(({ handle }) => handle)).size, 81);
    assert.strictEqual(definitions.size, 81);
  });

  it("spell an enumeration as the alternation of its values, and match only those", () => {
    assert.deepStrictEqual(
      domainNamed("showHide").pipe(Option.map(({ source }) => source)),
      Option.some("^(?:show|hide)$"),
    );
    for (const domain of valueDomains) {
      if (domain._tag !== "pattern") {
        const regex = new RegExp(domain.source, domain.flags);
        for (const value of domain.values) {
          assert.isTrue(regex.test(value), `${domain.handle} ${value}`);
          assert.isFalse(regex.test(`${value} `), `${domain.handle} ${value} with a space`);
        }
      }
    }
  });

  it("code the five enumerations a law reads, in today's roster order", () => {
    const coded = valueDomains.flatMap((domain) =>
      domain._tag === "coded" ? [[domain.handle, domain.values] as const] : [],
    );

    assert.deepStrictEqual(coded, [
      ["baseType", BaseType.handles],
      ["cardinality", [...TypedCardinality.handles, "record"]],
      ["shape", rosters.Shape.handles],
      ["roundingMode", rosters.RoundingMode.handles],
      ["toleranceMode", rosters.ToleranceMode.handles],
    ]);
  });
});

/**
 * A field read of today's attribute homes: the relation a reader asked for, the column it keyed
 * the relation by, and the field it read.
 */
interface Read {
  readonly field: string;
  readonly key: string;
  readonly relation: AnyRelation;
}

/**
 * The id the probe asks every home for.
 */
const probe = "00000000-0000-4000-8000-000000000000";

/**
 * Run one of today's attribute homes against an index that holds a fact for every relation it
 * asks for, and record each field it reads.
 *
 * Every fact answers every field with the text `probe`, which no home takes for a discriminator
 * (`record`, `ref`, `picture`), so each home reads the column of its plain case; the token rows of
 * an identifier-reference attribute answer no attribute name, so they record only that read.
 *
 * @param source - The home, as `attribute-homes.ts` builds it.
 * @returns The fields it read, in order.
 */
const readsOf = (source: (index: Index) => Reader): readonly Read[] => {
  const reads: Read[] = [];
  const factOf = (relation: AnyRelation, key: string) =>
    new Proxy<Readonly<Record<string, string>>>(
      {},
      {
        get: (_target, field) => {
          if (Predicate.isString(field)) {
            reads.push({ field, key, relation });
          }

          return "probe";
        },
      },
    );
  const index: Index = {
    many: (relation, key) => new Map([[probe, [factOf(relation, key)]]]),
    one: (relation, key) => new Map([[probe, factOf(relation, key)]]),
  };
  source(index)(probe);

  return reads;
};

/**
 * Every field today's homes read for an attribute of a kind: its own homes, then the shared ones,
 * as the renderer reads them.
 *
 * @param kind - The kind's handle.
 * @param name - The attribute's name.
 * @returns The reads of every home named `name`.
 */
const homeReadsOf = (kind: string, name: string): readonly Read[] =>
  [...(ownByKind.get(kind) ?? []), ...shared]
    .filter(([named]) => named === name)
    .flatMap(([, source]) => readsOf(source));

/**
 * A column type today: a regex over text, a closed roster, or a scalar such as `bigint`.
 */
type Column =
  | { readonly _tag: "pattern"; readonly flags: string; readonly source: string }
  | { readonly _tag: "roster"; readonly values: readonly string[] }
  | { readonly _tag: "scalar"; readonly sql: string };

/**
 * A column a regex types.
 */
const PatternColumn = Schema.Struct({
  pattern: Schema.Struct({ flags: Schema.String, source: Schema.String }),
});

/**
 * The field types of a relation's columns, as grizzle builds them: a contract, which is a
 * constructor over its base and so is read first, a regex, a roster, or a scalar.
 */
const Fields = Schema.Record(
  Schema.String,
  Schema.Union([
    Schema.declare(
      (input: unknown): input is { readonly base: unknown } =>
        Predicate.isFunction(input) && Predicate.hasProperty(input, "base"),
    ),
    PatternColumn,
    Schema.Struct({ roster: Schema.Struct({ handles: Schema.Array(Schema.String) }) }),
    Schema.Struct({ sql: Schema.String }),
  ]),
);

/**
 * Read the type of each column a set of field reads names.
 *
 * @param reads - The field reads.
 * @returns The type of each read field's column, in order.
 */
const columnsOf = Effect.fnUntraced(function* columnsOf(reads: readonly Read[]) {
  const columns: Column[] = [];
  for (const { field, relation } of reads) {
    const fields = yield* Schema.decodeUnknownEffect(Fields)(relation.fields);
    const found = fields[field];
    if (found === undefined) {
      return yield* Effect.die(`${relation.name} has no column ${field}`);
    }

    if ("base" in found) {
      const { pattern } = yield* Schema.decodeUnknownEffect(PatternColumn)(found.base);
      columns.push({ _tag: "pattern", ...pattern });
    } else if ("pattern" in found) {
      columns.push({ _tag: "pattern", ...found.pattern });
    } else if ("roster" in found) {
      columns.push({ _tag: "roster", values: found.roster.handles });
    } else {
      columns.push({ _tag: "scalar", sql: found.sql });
    }
  }

  return columns;
});

/**
 * The fields a home reads beside the attribute's value, which say nothing of its language: a
 * `source`'s parent, which decides the picture fill, and the attribute name of an
 * identifier-reference token row.
 */
const ignored = new Set(["AttributeIdref.attribute", "Source.parentKind"]);

/**
 * The fields a home reads to choose which of its columns holds the value: a declaration's or a
 * value's shape, and the literal-or-reference kind of `figures`, `n` and `number-repeats`.
 */
const choosers = new Set([
  "Declaration.shape",
  "DeclaredValue.shape",
  "EqualRounded.figuresKind",
  "Index.nKind",
  "Repeat.numberRepeatsKind",
  "RoundTo.figuresKind",
]);

/**
 * The columns today's homes hold an attribute's value in, and whether a home chooses between
 * them.
 */
interface Home {
  readonly chosen: boolean;
  readonly columns: readonly Column[];
}

/**
 * Read today's home of an attribute of a kind.
 *
 * @param kind - The kind's handle.
 * @param name - The attribute's name.
 * @returns Its value columns, and whether a home reads a field that chooses between them.
 */
const homeOf = Effect.fnUntraced(function* homeOf(kind: string, name: string) {
  const reads = homeReadsOf(kind, name).filter(
    ({ field, relation }) => !ignored.has(`${relation.name}.${field}`),
  );
  const chosen = reads.some(({ field, relation }) => choosers.has(`${relation.name}.${field}`));
  const columns = yield* columnsOf(
    reads.filter(({ field, relation }) => !choosers.has(`${relation.name}.${field}`)),
  );

  return { chosen, columns } satisfies Home;
});

/**
 * The value sets today's checks narrow a roster column to, by version and pair: the media booleans'
 * `ByVersion` checks (`schema/html/media.ts`), `BdoDirNotAuto` and `AriaRoleH1`
 * (`schema/attributes.ts`).
 *
 * @param version - The schema version.
 * @param kind - The kind's handle.
 * @param name - The attribute's name.
 * @returns The values the column admits there, or none where no check narrows it.
 */
const narrowed = (
  version: string,
  kind: string,
  name: string,
): Option.Option<readonly string[]> => {
  const booleanWords = ["true", "false", "1", "0"];
  if (
    (kind === "audio" || kind === "video") &&
    ["autoplay", "controls", "loop", "muted"].includes(name)
  ) {
    return Option.some(version === "3.0.0" ? booleanWords : ["true", "false", name]);
  }

  if (kind === "track" && name === "default") {
    return Option.some(version === "3.0.0" ? booleanWords : ["true", "false", name]);
  }

  if (kind === "bdo" && name === "dir") {
    return Option.some(["ltr", "rtl"]);
  }

  return kind === "h1" && name === "role"
    ? Option.some(["heading", "tab", "presentation"])
    : Option.none();
};

/**
 * The domain that reads each attribute whose home is not one column or chooses between columns,
 * by name:
 *
 * - `cardinality`: a typed declaration's `TypedCardinality`, or `record`, which the declaration's
 *   shape chooses.
 * - `base-type` of a `qti-value`: written only for a record's field value, the shape choosing.
 * - `map-key`, `default-value`, `target-value`: one column per base type, the domain being the XSD's
 *   string type; the mapping's base type narrows the value in its overlay (O5).
 * - `figures`, `n`, `number-repeats`: a literal integer (a `bigint` column) or a variable reference,
 *   the kind choosing.
 * - `identifier` of a variable reference: a declared variable's identifier or a built-in's name, each
 *   an NCName.
 * - `class` of a custom operator: its NCName class, which is also a one-token class list.
 * - `data-ssml`: no home, the importer refusing it until the cutover lifts the refusal.
 * - `headers`: token rows only, each an NCName, an empty list kept as its lexical form.
 */
const explained: ReadonlyMap<string, string> = new Map([
  ["base-type", "baseType"],
  ["cardinality", "cardinality"],
  ["class", "ncName"],
  ["data-ssml", "string"],
  ["default-value", "string"],
  ["figures", "integerOrVariable"],
  ["headers", "identifierList"],
  ["identifier", "ncName"],
  ["map-key", "normalizedString"],
  ["n", "integerOrVariable"],
  ["number-repeats", "integerOrVariable"],
  ["target-value", "string"],
]);

/**
 * How a domain was found to read its home's language: by the home's one regex, its roster, its
 * integer count, or the table of explained readings; or why it does not.
 */
type Verdict =
  | { readonly _tag: "agrees"; readonly by: "count" | "explained" | "regex" | "roster" }
  | { readonly _tag: "differs"; readonly why: string };

/**
 * Judge whether a domain reads the language today's home holds for one attribute.
 *
 * A home of one column must agree with it: a regex column, or several with one regex, must be the
 * domain's regex; a roster column, as today's checks narrow it, must hold the enumeration's values;
 * a `bigint` count is read as the importer's integer reader reads `xs:nonNegativeInteger`. A home
 * that chooses between columns, or has none or several, must be read as {@link explained} says.
 *
 * @param row - The admitted attribute.
 * @param home - Its home today.
 * @returns The verdict.
 */
const verdictOf = (row: Admitted, home: Home): Verdict => {
  const { domain, kind, name, version } = row;
  const differs = (why: string): Verdict => ({
    _tag: "differs",
    why: `${version} ${kind} ${name} (${domain.handle}): ${why}`,
  });
  const sources = new Set(
    home.columns.map((column) =>
      column._tag === "pattern" ? `${column.source}\u0000${column.flags}` : column._tag,
    ),
  );
  const [only] = home.columns;
  if (!home.chosen && only?._tag === "pattern" && sources.size === 1) {
    return sources.has(`${domain.source}\u0000${domain.flags}`)
      ? { _tag: "agrees", by: "regex" }
      : differs("the home's regex differs");
  }

  if (!home.chosen && home.columns.length === 1 && only?._tag === "roster") {
    const values = Option.getOrElse(narrowed(version, kind, name), () => only.values);
    const held = domain._tag === "pattern" ? [] : domain.values;

    return new Set(held).size === values.length && values.every((value) => held.includes(value))
      ? { _tag: "agrees", by: "roster" }
      : differs(`the values differ from ${values.join("|")}`);
  }

  if (!home.chosen && home.columns.length === 1 && only?._tag === "scalar") {
    return only.sql === "bigint" && domain.handle === "xsdNonNegativeInteger"
      ? { _tag: "agrees", by: "count" }
      : differs(`a ${only.sql} column`);
  }

  return Option.match(Option.fromNullishOr(explained.get(name)), {
    onNone: () => differs("no one column, and no reading explained"),
    onSome: (handle): Verdict =>
      handle === domain.handle
        ? { _tag: "agrees", by: "explained" }
        : differs(`explained as ${handle}`),
  });
};

describe("today's composition", () => {
  it("declares the 6,788 (kind, name) pairs of the attribute-admission seed", () => {
    const declared = today.flatMap(({ attributes }) =>
      Object.entries(attributes).flatMap(([kind, declarations]) =>
        declarations.map(({ name }) => pairOf(kind, name)),
      ),
    );
    const seeded = attributeAdmission.map(({ attribute, kind }) => pairOf(kind, attribute));

    assert.strictEqual(declared.length, 6788);
    assert.deepStrictEqual(new Set(declared), new Set(seeded));
  });

  it.effect("admits every declared pair in both versions but a source's role", () =>
    Effect.gen(function* admitsPairs() {
      const { admission } = yield* grammar;
      const seeded = attributeAdmission.map(({ attribute, kind }) => pairOf(kind, attribute));
      for (const version of SchemaVersion.handles) {
        const rows = admission.rows.filter((row) => row.version === version);
        const pairs = new Set(rows.map(({ kind, name }) => pairOf(kind, name)));

        assert.strictEqual(rows.length, 6787, version);
        assert.deepStrictEqual(
          seeded.filter((pair) => !pairs.has(pair)),
          ["source role"],
        );
      }

      assert.strictEqual(admission.rows.length, 13_574);
      assert.strictEqual(new Set(admission.rows.map(({ domain }) => domain)).size, 81);
    }),
  );

  it.effect("reads every attribute as the language of its home today", () =>
    Effect.gen(function* matchesHomes() {
      const differing: string[] = [];
      const agreeing = new Map<string, number>();
      const explainedNames = new Map<string, number>();
      for (const row of yield* admitted) {
        const verdict = verdictOf(row, yield* homeOf(row.kind, row.name));
        if (verdict._tag === "differs") {
          differing.push(verdict.why);
        } else {
          agreeing.set(verdict.by, (agreeing.get(verdict.by) ?? 0) + 1);
          if (verdict.by === "explained") {
            explainedNames.set(row.name, (explainedNames.get(row.name) ?? 0) + 1);
          }
        }
      }

      assert.deepStrictEqual(differing, []);
      assert.isTrue(BuiltIn.handles.every((name) => new RegExp(patterns.ncName, "u").test(name)));
      assert.deepStrictEqual(Object.fromEntries(agreeing), {
        count: 68,
        explained: 150,
        regex: 7974,
        roster: 5382,
      });
      assert.deepStrictEqual(Object.fromEntries(explainedNames), {
        "base-type": 2,
        cardinality: 8,
        class: 2,
        "data-ssml": 96,
        "default-value": 4,
        figures: 4,
        headers: 4,
        identifier: 20,
        "map-key": 2,
        n: 2,
        "number-repeats": 2,
        "target-value": 4,
      });
    }),
  );

  it.effect("reads each identifier-reference token as an NCName, as the reference domains do", () =>
    Effect.gen(function* tokens() {
      const columns = yield* columnsOf([
        { field: "target", key: "node", relation: family.AttributeIdref },
      ]);
      const later = domainsIn(yield* admitted, "3.0.1");
      const handles = [
        "td headers",
        "p aria-controls",
        "p aria-details",
        "p data-catalog-idref",
      ].map((pair) => later.get(pair)?.handle);

      assert.deepStrictEqual(columns, [{ _tag: "pattern", flags: "u", source: patterns.ncName }]);
      assert.deepStrictEqual(handles, ["identifierList", "idrefs", "idref", "idref"]);
    }),
  );

  it.effect("differs between the versions in the nine media booleans only", () =>
    Effect.gen(function* versions() {
      const rows = yield* admitted;
      const earlier = domainsIn(rows, "3.0.0");
      const later = domainsIn(rows, "3.0.1");
      const differing = [...later]
        .flatMap(([pair, domain]) =>
          earlier.get(pair)?.handle === domain.handle
            ? []
            : [`${pair}: ${earlier.get(pair)?.handle ?? "none"} then ${domain.handle}`],
        )
        .toSorted();

      assert.deepStrictEqual(differing, [
        "audio autoplay: boolean then mediaAutoplay",
        "audio controls: boolean then mediaControls",
        "audio loop: boolean then mediaLoop",
        "audio muted: boolean then mediaMuted",
        "track default: boolean then trackDefault",
        "video autoplay: boolean then mediaAutoplay",
        "video controls: boolean then mediaControls",
        "video loop: boolean then mediaLoop",
        "video muted: boolean then mediaMuted",
      ]);
    }),
  );

  it.effect("takes the whitespace class each inventory declaration states", () =>
    Effect.gen(function* classes() {
      const later = domainsIn(yield* admitted, "3.0.1");
      const differing = Object.values(inventory).flatMap((entry) =>
        entry.attributes.flatMap(({ name, whiteSpace }) => {
          const domain = later.get(pairOf(entry.handle, name));

          return whiteSpace === "union" || domain === undefined || domain.whiteSpace === whiteSpace
            ? []
            : [pairOf(entry.handle, name)];
        }),
      );

      assert.deepStrictEqual(differing, []);
    }),
  );
});

/**
 * Record the relations a home looks up an attribute's facts in, each with the column it keys them
 * by.
 *
 * @param kind - The kind's handle.
 * @param name - The attribute's name.
 * @returns Each lookup as `relation/key`, in order.
 */
const lookupsOf = (kind: string, name: string): readonly string[] => {
  const lookups: string[] = [];
  const index: Index = {
    many: (relation, key) => {
      lookups.push(`${relation.name}/${key}`);

      return new Map();
    },
    one: (relation, key) => {
      lookups.push(`${relation.name}/${key}`);

      return new Map();
    },
  };
  for (const [named, source] of [...(ownByKind.get(kind) ?? []), ...shared]) {
    if (named === name) {
      source(index)(probe);
    }
  }

  return lookups;
};

/**
 * The attributes today's importer refuses to find absent, by its `requiredAttribute` calls: in
 * `import/item.ts`, `import/content.ts`, `import/html.ts` and `import/interactions/other.ts`.
 */
const refusedAbsent = [
  "a href",
  "img alt",
  "img src",
  "object data",
  "object type",
  "param name",
  "param value",
  "qti-end-attempt-interaction title",
  "qti-media-interaction autostart",
  "qti-modal-feedback show-hide",
  "qti-slider-interaction lower-bound",
  "qti-slider-interaction upper-bound",
  "qti-stylesheet href",
  "source src",
  "track src",
];

describe("Required", () => {
  it.effect("holds 135 attributes in each version, the same in both", () =>
    Effect.gen(function* sameInBoth() {
      const { required } = yield* grammar;
      const [earlier, later] = SchemaVersion.handles.map(
        (version) =>
          new Set(
            required.rows
              .filter((row) => row.version === version)
              .map(({ kind, name }) => pairOf(kind, name)),
          ),
      );

      assert.strictEqual(later?.size, 135);
      assert.deepStrictEqual(earlier, later);
      assert.strictEqual(required.rows.length, 270);
    }),
  );

  it.effect("is the declared use but where today's rules read it otherwise", () =>
    Effect.gen(function* departures() {
      const { required } = yield* grammar;
      const held = new Set(
        required.rows
          .filter((row) => row.version === "3.0.1")
          .map(({ kind, name }) => pairOf(kind, name)),
      );
      const declared = new Set(
        today.flatMap(({ attributes }) =>
          Object.entries(attributes).flatMap(([kind, declarations]) =>
            declarations.flatMap(({ name, use }) =>
              use === "required" ? [pairOf(kind, name)] : [],
            ),
          ),
        ),
      );

      assert.deepStrictEqual(
        [...held].filter((pair) => !declared.has(pair)),
        ["bdo dir"],
      );
      assert.deepStrictEqual([...declared].filter((pair) => !held.has(pair)).toSorted(), [
        "param valuetype",
        "qti-area-map-entry coords",
        "qti-associable-hotspot coords",
        "qti-hotspot-choice coords",
      ]);
      for (const kind of ["qti-area-map-entry", "qti-associable-hotspot", "qti-hotspot-choice"]) {
        assert.deepStrictEqual(lookupsOf(kind, "coords"), ["Coords/node"], kind);
      }

      assert.include(lookupsOf("param", "valuetype"), "DeclaredValuetype/node");
      assert.isTrue(
        family.rules.some(
          (rule) => rule.kind === "capacity" && rule.from.source.name === "NodeDir",
        ),
      );
    }),
  );

  it.effect("holds every attribute the importer refuses to find absent, but a source's src", () =>
    Effect.gen(function* refusals() {
      const { required } = yield* grammar;
      const held = new Set(required.rows.map(({ kind, name }) => pairOf(kind, name)));

      assert.deepStrictEqual(
        refusedAbsent.filter((pair) => !held.has(pair)),
        ["source src"],
      );
    }),
  );
});

describe("Enumeration", () => {
  it.effect("codes each value of a coded domain by its position, and nothing else", () =>
    Effect.gen(function* codes() {
      const { enumeration } = yield* grammar;
      const codeOf = (domain: string, value: string) =>
        enumeration.lookup({ domain, value }).pipe(Option.map(({ code }) => code));

      assert.strictEqual(enumeration.rows.length, 25);
      assert.deepStrictEqual(codeOf("baseType", "float"), Option.some(2));
      assert.deepStrictEqual(codeOf("cardinality", "record"), Option.some(3));
      assert.deepStrictEqual(codeOf("shape", "rect"), Option.some(4));
      assert.deepStrictEqual(codeOf("toleranceMode", "exact"), Option.some(1));
      assert.isTrue(Option.isNone(codeOf("baseType", "record")));
      assert.isTrue(Option.isNone(codeOf("string", "float")));
    }),
  );
});

describe("the constants", () => {
  it.effect(
    "AttributeAdmission at K = 363 and A = 221 is 160,446 cells of 7 bits, 140,399 bytes",
    () =>
      Effect.gen(function* admissionSize() {
        const { admission } = yield* grammar;

        assert.strictEqual(admission.cells, 160_446);
        assert.strictEqual(admission.width, 7);
        assert.strictEqual(admission.bytes, 140_399);
      }),
  );

  it.effect("Required is 160,446 bits, 20,064 bytes, and Enumeration 2,025 cells of 4 bits", () =>
    Effect.gen(function* sets() {
      const { enumeration, required } = yield* grammar;

      assert.deepStrictEqual(
        [required.cells, required.width, required.bytes],
        [160_446, 1, 20_064],
      );
      assert.deepStrictEqual(
        [enumeration.cells, enumeration.width, enumeration.bytes],
        [2025, 4, 1021],
      );
    }),
  );
});

/**
 * Declare an optional attribute.
 *
 * @param name - Its name.
 * @param type - Its XSD type.
 * @param whiteSpace - Its whitespace class.
 * @returns The declaration.
 */
const optional = (name: string, type: string, whiteSpace: Declared["whiteSpace"]): Declared => ({
  name,
  type,
  use: "optional",
  whiteSpace,
});

/**
 * Read a declaration on a kind and name its domain.
 *
 * @param kind - The kind's handle.
 * @param declared - The declaration.
 * @returns The domain's handle, or the failure's tag.
 */
const handleOf = (kind: string, declared: Declared): string =>
  Result.match(domainOf(kind, declared), {
    onFailure: (failure) => failure._tag,
    onSuccess: (domain) => domain.handle,
  });

/**
 * List what one vocabulary admits in both versions when its revisions of `a` and its two added
 * attributes, one on a kind it declares nothing of, hold in `version`.
 *
 * @param version - The version the added attributes' revisions hold in.
 * @returns The admitted attributes, or the failure.
 */
const revised = (version: string) =>
  admittedIn(
    ["3.0.0", "3.0.1"],
    [
      {
        attributes: { k: [optional("a", "xs:string", "preserve")] },
        revisions: [
          { ...optional("a", "xs:boolean", "collapse"), kind: "k", version: "3.0.0" },
          { ...optional("b", "xs:int", "collapse"), kind: "k", version },
          { ...optional("c", "xs:ID", "collapse"), kind: "m", version },
        ],
      },
    ],
  );

/**
 * Generate the attribute grammar of one vocabulary over a roster of one kind and one name, and
 * take its failure.
 *
 * @param attributes - The vocabulary's declarations.
 * @returns The failure, or a defect when the grammar generates.
 */
const refusalOf = (attributes: AttributeVocabulary["attributes"]) =>
  Effect.flip(
    Effect.fromResult(
      generate({
        kinds: ["k"],
        names: ["a"],
        versions: ["3.0.1"],
        vocabularies: [{ attributes, revisions: [] }],
      }),
    ),
  );

describe("the readings", () => {
  it("read an attribute on its kind before its name's reading, and that before its type's", () => {
    assert.deepStrictEqual(
      [
        handleOf("bdo", optional("dir", "xs:string", "preserve")),
        handleOf("p", optional("dir", "xs:string", "preserve")),
        handleOf("p", optional("title", "xs:string", "preserve")),
        handleOf("qti-printed-variable", optional("format", "xs:normalizedString", "replace")),
        handleOf(
          "qti-text-entry-interaction",
          optional("format", "xs:normalizedString", "replace"),
        ),
        handleOf("p", optional("data-foo", "xs:anySimpleType", "preserve")),
      ],
      ["bdoDirection", "textDirection", "string", "printfFormat", "normalizedString", "string"],
    );
  });

  it("refuse a type no reading maps, and a class the domain does not apply", () => {
    const unread = domainOf("p", optional("span", "xs:duration", "collapse"));
    const mismatched = domainOf("p", optional("id", "xs:ID", "preserve"));

    assert.isTrue(Result.isFailure(unread));
    assert.include(
      Result.match(unread, { onFailure: ({ message }) => message, onSuccess: () => "" }),
      "p declares span of type xs:duration, which no value domain reads",
    );
    assert.include(
      Result.match(mismatched, { onFailure: ({ message }) => message, onSuccess: () => "" }),
      "p declares id with whitespace class preserve, and the id domain it is read as applies collapse",
    );
  });

  it.effect(
    "revise a declaration in its version only, add one there, and refuse a stray version",
    () =>
      Effect.gen(function* revisions() {
        const rows = yield* Effect.fromResult(revised("3.0.1"));
        const stray = yield* Effect.flip(Effect.fromResult(revised("3.1")));

        assert.deepStrictEqual(
          rows.map(
            ({ domain, kind, name, version }) => `${version} ${kind} ${name} ${domain.handle}`,
          ),
          ["3.0.0 k a boolean", "3.0.1 k a string", "3.0.1 k b int", "3.0.1 m c id"],
        );
        assert.include(stray.message, "AttributeAdmission has a row whose version is 3.1");
      }),
  );

  it.effect("refuse a kind outside the roster, and a name one kind declares twice", () =>
    Effect.gen(function* outsideOrTwice() {
      const outside = yield* refusalOf({ z: [optional("a", "xs:string", "preserve")] });
      const twice = yield* refusalOf({
        k: [optional("a", "xs:string", "preserve"), optional("a", "xs:NCName", "collapse")],
      });

      assert.include(outside.message, "AttributeAdmission has a row whose kind is z");
      assert.include(
        twice.message,
        "AttributeAdmission states two rows at (version 3.0.1, kind k, name a)",
      );
    }),
  );
});
