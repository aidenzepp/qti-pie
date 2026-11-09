/**
 * The attribute layer's laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3):
 * each refused row is one the law's model refuses, named by the constraint that states the law.
 *
 * Every case is a direct SQL writer's, as the rules file's rule 8 states it, through the one direct
 * writer (`#pantry/test/direct-sql.ts`): the author login, `SET ROLE` to the author role, at
 * SERIALIZABLE, every deferrable foreign key deferred, one `INSERT` of the case's facts into
 * `Qti`'s table with every column a writer fills, and a rollback. A row's CHECKs and keys are
 * judged as the row is inserted, before any foreign key's trigger runs at the statement's end, so a
 * refused row's verdict is its SQLSTATE and the constraint that states the law, and a control's is
 * that no CHECK and no key refuses it: it meets, at most, the owner axis's foreign key into a
 * `Node` row the case does not write (23503). Since no case writes its owner, a member's copy of
 * its owner's count is the members it states, unless it states that count as a hidden value: the
 * second of two attributes, or one token of two.
 *
 * PostgreSQL evaluates a table's CHECKs in the order of their names, and each control states every
 * field as grizzle's filler would, so a corrupted row breaks exactly the law its case names.
 *
 * Cases over a stored tree arrive with the importer (Q5.15), and probe P1 restates them over a
 * whole package: AL3 required and TextDomain, which are CHECKs on `Node` beside the tree's own, and
 * the families' last-axis foreign keys (an open-class attribute whose `OpenAttributeName` is
 * missing, an IDREF attribute whose tokens are missing), which need the owner's `Node` row.
 *
 * `value_domain` reads `ValueDomainOf`'s patterns, which compile once grammar/domains.ts emits them
 * without lookaround (seat QX); its cases run once it does.
 */
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { DatabaseError } from "pg";
import { describe } from "vitest";
import {
  AttributeName,
  attributeRows,
  AttributeSlot,
  GoverningOf,
  KindNamespace,
  NodeKind,
} from "#pantry/grammar/install.ts";
import { Attribute, Idref, OpenAttributeName } from "#pantry/qti/attributes.ts";
import { Qti } from "#pantry/qti/own.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  assertVerdict,
  constraintDescribed,
  judged,
  loginSession,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * Assert that no CHECK and no key refused a case: it was accepted, or met a foreign key, the owner
 * axis into the `Node` row no case writes.
 *
 * @param verdict - The server's error, if any.
 * @param label - The case.
 */
const assertNoRowLawRefuses = (verdict: Option.Option<DatabaseError>, label: string) => {
  const refused = Option.getOrUndefined(verdict);
  assert.isTrue(
    refused === undefined || refused.code === "23503",
    `${label}: ${refused?.code ?? ""} ${refused?.constraint ?? ""} ${refused?.message ?? ""}`,
  );
};

/**
 * A set of `AttributeSlot` handles as its column reads it, in grizzle's one spelling of a bit
 * string (`#pantry/test/bits.ts`).
 *
 * @param slots - The slots, by code.
 * @returns The set's text.
 */
const slotBits = (...slots: readonly number[]): string =>
  bitsText(
    AttributeSlot,
    AttributeSlot.handles.filter((_, code) => slots.includes(code)),
  );

/**
 * The element of every Attribute case: a hotspot choice in 3.0.1 under its declared type, which
 * requires `identifier`, `shape` and `coords` and admits `data-*` and ARIA's IDREFS.
 */
const kind = "qti-hotspot-choice";

/**
 * The version of every case but the version-difference one.
 */
const version = "3.0.1";

/**
 * The hotspot choice as its attributes' element, under its own governor: its kind's, as under its
 * declared type.
 */
const hotspotHost = { governor: kind, kind } as const;

/**
 * The slot of a name a governor admits in a version.
 *
 * @param name - The attribute's name.
 * @param at - The version.
 * @param governor - The governor.
 * @returns Its `AttributeGrammar` position's code.
 */
const slotOf = (name: string, at: string = version, governor: string = kind): number =>
  Number(
    attributeRows.find(
      (row) => row.version === at && row.governor === governor && row.name === name,
    )?.position ?? assert.fail(`${governor} admits ${name} in ${at}`),
  );

/**
 * A uuid no stored row holds: the cases' element.
 */
const strayNode = "00000000-0000-4000-8000-0000000000a0";

/**
 * The resource type of the cases' element's document: a hotspot choice is an item's, and no case
 * writes the element its attributes copy it from.
 */
const documentType = "imsqti_item_xmlv3p0";

/**
 * A member's copy of its owner's count, stated by the case where it writes fewer members than its
 * owner counts.
 *
 * @param family - The family, `Owner.count`.
 * @param count - The owner's count.
 * @returns The hidden value.
 */
const ownerCount = (family: string, count: number) => ({
  [`the owner's count of the family ${family}`]: count,
});

/**
 * An attribute fact of the hotspot choice, every field as grizzle's filler writes it for the
 * attribute at slot `at`, after the slots `was`: the control each case corrupts. It has no prefix,
 * no entity, no token and the empty concatenation, and one open name exactly where its name is an
 * open class.
 *
 * @param fields - The attribute's name and lexical form, and whatever the case sets.
 * @param fields.name - The name.
 * @param fields.lexical - The lexical form.
 * @param place - Its slot, its element, and the slots before it.
 * @param place.at - Its slot.
 * @param place.host - Its element's kind and governor: the hotspot choice under its own governor by
 *   default.
 * @param place.was - The slots of the closed names before it.
 * @param place.rest - Any other field the case sets.
 * @returns The fact.
 */
const attributeOf = (
  { lexical, name }: { readonly lexical: string; readonly name: string },
  {
    at = 0,
    host = hotspotHost,
    rest = {},
    was = [],
  }: {
    readonly at?: number;
    readonly host?: { readonly governor: string; readonly kind: string };
    readonly rest?: Stated["fact"];
    readonly was?: readonly number[];
  } = {},
): Stated => {
  const open = ["data-*", "foreign", "no-namespace", "own-namespace"].includes(name);
  const slot = slotOf(name, version, host.kind);

  return {
    fact: {
      at: BigInt(at),
      attrsAfter: slotBits(...was, ...(open ? [] : [slot])),
      attrsWas: slotBits(...was),
      document: strayNode,
      documentType,
      governor: host.governor,
      id: `00000000-0000-4000-8000-0000000001${String(at).padStart(2, "0")}`,
      idrefText: "",
      kind: host.kind,
      lexical,
      name,
      node: strayNode,
      openName: open ? 1n : 0n,
      prefix: "",
      slot: slotBits(slot),
      version,
      ...rest,
    },
    relation: Attribute,
  };
};

/**
 * The second of two attributes of the hotspot choice, its element counting both.
 *
 * @param fields - The attribute's name and lexical form.
 * @param fields.name - The name.
 * @param fields.lexical - The lexical form.
 * @param was - The slots of the closed names before it.
 * @returns The fact.
 */
const secondOfTwo = (
  fields: { readonly lexical: string; readonly name: string },
  was: readonly number[],
): Stated => ({
  ...attributeOf(fields, { at: 1, was }),
  hidden: ownerCount("Node.attributes", 2),
});

/**
 * A kind's elements under the kind's own governor (`KindGovernor`), as under its declared type or
 * no named type: the host of a case on another kind than the hotspot choice.
 *
 * @param of - The kind.
 * @returns The kind and its governor.
 */
const hostOf = (of: string) => ({ governor: of, kind: of });

/**
 * A fact with some of its fields replaced: a case's corruption of a control.
 *
 * @param stated - The control.
 * @param fields - The fields to replace.
 * @returns The fact.
 */
const withFields = (stated: Stated, fields: Stated["fact"]): Stated => ({
  ...stated,
  fact: { ...stated.fact, ...fields },
});

/**
 * A piece of an IDREFS attribute's two tokens, which no case writes the attribute of: its token
 * with its whitespace, the piece itself PostgreSQL's to generate.
 *
 * @param at - Its slot.
 * @param fields - Its running texts and token, and whatever else the case sets.
 * @returns The fact.
 */
const idrefPiece = (at: number, fields: Readonly<Record<string, string>>): Stated => ({
  fact: {
    after: "",
    at: BigInt(at),
    attribute: "00000000-0000-4000-8000-000000000100",
    before: at === 0 ? "" : " ",
    document: strayNode,
    node: strayNode,
    ...fields,
  },
  hidden: ownerCount("Attribute.idrefs", 2),
  relation: Idref,
});

/**
 * An open name of an attribute that counts one, which no case writes: a name in no namespace on a
 * foreign element of version 3.0.1 governed by none, unless the case sets otherwise.
 *
 * @param fields - Its class and whatever else the case sets.
 * @param attribute - Its attribute.
 * @returns The fact.
 */
const openNameOf = (
  fields: Stated["fact"],
  attribute = "00000000-0000-4000-8000-000000000100",
): Stated => ({
  fact: {
    at: 0n,
    attribute,
    elementNamespace: "urn:element",
    governs: "none",
    kind: "foreign-element",
    local: "a",
    node: strayNode,
    uri: "",
    version: "3.0.1",
    ...fields,
  },
  hidden: ownerCount("Attribute.openName", 1),
  relation: OpenAttributeName,
});

/**
 * The fields a closed element's open name copies from it: its namespace and its declared type as
 * the importer writes it, read from `KindNamespace` and `GoverningOf` at 3.0.1, never `none`.
 *
 * @param element - The element's kind.
 * @returns The fields.
 */
const on = (element: string): Stated["fact"] => ({
  elementNamespace:
    KindNamespace.rows.find((row) => row.kind === element)?.namespace ??
    assert.fail(`KindNamespace holds ${element}`),
  governs:
    GoverningOf.rows.find((row) => row.kind === element && row.version === "3.0.1")?.governs ??
    assert.fail(`GoverningOf holds ${element} at 3.0.1`),
  kind: element,
});

describe.skipIf(!hasLease)("qti/attributes.db.test.ts, on the lease", () => {
  it.effect(
    "accepts a hotspot choice's admitted, distinct, rightly folded attributes by every CHECK and key, and refuses each corruption by its law",
    () =>
      // Oracle: PostgreSQL, Attribute's CHECKs as grizzle installs them: AL1_admission, E1_derived,
      // AL2_distinct and AL4_open_names by name, and the or fold's slot-0 pin and combine by its
      // comment; each control is the row the fold would write.
      // Bound: one control per law and one corruption per named invalid variant (rules file rule
      // 8): an unadmitted name, a wrong slot, a repeated closed name, a junk accumulator at slot
      // 0, a wrong after, an open class stepping the fold (the mutant without the step selection),
      // and open names counted 0 or 2.
      Effect.gen(function* attributeChecks() {
        const client = yield* loginSession;
        const fold = yield* constraintDescribed(
          client,
          "attribute",
          "check of Attribute for law or fold over fin(Node, attributes)%",
        );
        const identifier = slotOf("identifier");
        const admitted = attributeOf({ lexical: "H1", name: "identifier" });

        assertNoRowLawRefuses(yield* judged(client, statedInserts([admitted])), "control");

        const unadmitted =
          AttributeName.handles.find(
            (name) =>
              !attributeRows.some(
                (row) => row.version === version && row.governor === kind && row.name === name,
              ),
          ) ?? assert.fail(`${kind} admits every name`);
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              withFields(admitted, { attrsAfter: slotBits(), name: unadmitted, slot: slotBits() }),
            ]),
          ),
          checkConstraintOf(Qti, Attribute.name, "AL1_admission"),
          true,
          `${unadmitted} on ${kind}`,
        );

        const wrongSlot = slotOf("shape");
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              withFields(admitted, { attrsAfter: slotBits(wrongSlot), slot: slotBits(wrongSlot) }),
            ]),
          ),
          checkConstraintOf(Qti, Attribute.name, "E1_derived"),
          true,
          "identifier holding shape's slot",
        );

        assertVerdict(
          yield* judged(
            client,
            statedInserts([secondOfTwo({ lexical: "H2", name: "identifier" }, [identifier])]),
          ),
          checkConstraintOf(Qti, Attribute.name, "AL2_distinct"),
          true,
          "identifier repeated",
        );

        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              attributeOf({ lexical: "H1", name: "identifier" }, { was: [slotOf("shape")] }),
            ]),
          ),
          fold,
          true,
          "a junk attrsWas at slot 0",
        );

        assertVerdict(
          yield* judged(client, statedInserts([withFields(admitted, { attrsAfter: slotBits() })])),
          fold,
          true,
          "an after that left the slot out",
        );

        const data = attributeOf({ lexical: "x", name: "data-*" });
        assertNoRowLawRefuses(yield* judged(client, statedInserts([data])), "data-* control");
        assertNoRowLawRefuses(
          yield* judged(client, statedInserts([secondOfTwo({ lexical: "y", name: "data-*" }, [])])),
          "a second data-*: the fold steps over open classes, so attrsWas holds no open slot",
        );
        assertVerdict(
          yield* judged(
            client,
            statedInserts([withFields(data, { attrsAfter: slotBits(slotOf("data-*")) })]),
          ),
          fold,
          true,
          "data-* stepping the fold, which the step selection leaves it out of",
        );

        for (const openName of [0n, 2n]) {
          assertVerdict(
            yield* judged(client, statedInserts([withFields(data, { openName })])),
            checkConstraintOf(Qti, Attribute.name, "AL4_open_names"),
            true,
            `data-* with ${String(openName)} open names`,
          );
        }

        assertVerdict(
          yield* judged(client, statedInserts([withFields(admitted, { openName: 1n })])),
          checkConstraintOf(Qti, Attribute.name, "AL4_open_names"),
          true,
          "a closed name with an open name",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "admits a name in exactly the versions whose grammar admits it on the kind, each version judged by its own rows",
    () =>
      // Oracle: PostgreSQL's AL1_admission against `AttributeGrammar`'s rows, the XSDs' declarations
      // per version (§1.2).
      // Bound: every (kind, name) the two versions' grammars admit differently, up to 8.
      Effect.gen(function* versionDifferences() {
        const client = yield* loginSession;
        const admission = checkConstraintOf(Qti, Attribute.name, "AL1_admission");
        const kinds: ReadonlySet<string> = new Set(NodeKind.handles);
        const admittedIn = (at: string) =>
          new Set(
            attributeRows
              .filter((row) => row.version === at && kinds.has(row.governor))
              .map(({ governor, name }) => `${governor}\u0000${name}`),
          );
        // Each version's admitted names, read once: 38986 rows, so a set per key is minutes.
        const [older, newer] = [admittedIn("3.0.0"), admittedIn("3.0.1")];
        const differences = [
          ...[...newer].filter((key) => !older.has(key)),
          ...[...older].filter((key) => !newer.has(key)),
        ].slice(0, 8);

        for (const key of differences) {
          const [governor = "", name = ""] = key.split("\u0000");
          for (const at of ["3.0.0", "3.0.1"]) {
            const row = attributeRows.find(
              (held) => held.version === at && held.governor === governor && held.name === name,
            );
            const governing = GoverningOf.rows.find(
              (held) => held.version === at && held.kind === governor && held.governor === governor,
            );
            if (governing === undefined) {
              continue;
            }

            const slot = row === undefined ? [] : [Number(row.position)];
            const refused = yield* judged(
              client,
              statedInserts([
                {
                  fact: {
                    at: 0n,
                    attrsAfter: slotBits(...slot),
                    attrsWas: slotBits(),
                    document: strayNode,
                    documentType,
                    governor: governing.governor,
                    id: "00000000-0000-4000-8000-000000000200",
                    idrefText: "",
                    kind: governor,
                    lexical: "",
                    name,
                    node: strayNode,
                    prefix: "",
                    slot: slotBits(...slot),
                    version: at,
                  },
                  relation: Attribute,
                },
              ]),
            );
            const label = `${name} on ${governor} in ${at}`;

            if (row === undefined) {
              assertVerdict(refused, admission, true, label);
            } else {
              assert.notStrictEqual(Option.getOrUndefined(refused)?.constraint, admission, label);
            }
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "judges an attribute's lexical form by its domain's pattern, coords by CoordsDType whatever its shape (spec reading 59)",
    () =>
      // Oracle: PostgreSQL's value_domain CHECK over `ValueDomainOf`'s patterns; the expected
      // verdicts are CoordsDType's (imsqti_asiv3p0p1_v1p0.xsd lines 24088 to 24092) and the roster
      // of aria-live's enumeration, the old `attribute-lexical` guard's fixture.
      // Bound: coords of 3, 4 and 6 values accepted, 2 and 5 refused; aria-live in and outside
      // its roster.
      Effect.gen(function* lexical() {
        const client = yield* loginSession;
        for (const [value, name, valid] of [
          ["1,2,3", "coords", true],
          ["1,2,3,4", "coords", true],
          ["1,2,3,4,5,6", "coords", true],
          ["1,2", "coords", false],
          ["1,2,3,4,5", "coords", false],
          ["polite", "aria-live", true],
          ["loud", "aria-live", false],
        ] as const) {
          const refused = yield* judged(
            client,
            statedInserts([attributeOf({ lexical: value, name })]),
          );

          if (valid) {
            assertNoRowLawRefuses(refused, `${name} ${value}`);
          } else {
            assertVerdict(
              refused,
              checkConstraintOf(Qti, Attribute.name, "value_domain"),
              true,
              `${name} ${value}`,
            );
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds each attribute's prefix to the namespace its name is in, XLink's values to xlink.xsd's types and a rubric block's view to one or more views",
    () =>
      // Oracle: PostgreSQL's Attribute_prefix CHECK, against Namespaces in XML 1.0 §6.2 (an
      // unprefixed attribute is in no namespace) and §3 (`xml` is the XML namespace's alone,
      // `xmlns` declares only): a name in no namespace has none, an `xml:` name `xml`, any other a
      // declared prefix; and value_domain over `ValueDomainOf`'s patterns, against
      // `xlink/xlink.xsd` lines 29 to 105 and spec reading 17.
      // Bound: each name class with a prefix right and wrong (a closed name in no namespace,
      // `data-*`, `xml:lang`, `xsi:schemaLocation` under `xsi` and `zs`, `xlink:href` on
      // `lom:source`, and both namespaced open classes on a foreign element); xlink:type and
      // xlink:role in and outside their domains; view empty and listed.
      Effect.gen(function* prefixesAndDomains() {
        const client = yield* loginSession;
        const lom = hostOf("lom:source");
        const foreign = hostOf("foreign-element");
        const rubric = hostOf("qti-rubric-block");
        const cases: readonly (readonly [
          string,
          string,
          string,
          string,
          { readonly governor: string; readonly kind: string },
          boolean,
        ])[] = [
          ["identifier", "H1", "", "", hotspotHost, true],
          ["identifier", "H1", "x", "Attribute_prefix", hotspotHost, false],
          ["data-*", "v", "", "", hotspotHost, true],
          ["data-*", "v", "x", "Attribute_prefix", hotspotHost, false],
          ["xml:lang", "en", "xml", "", hotspotHost, true],
          ["xml:lang", "en", "", "Attribute_prefix", hotspotHost, false],
          ["xml:lang", "en", "x", "Attribute_prefix", hotspotHost, false],
          ["xsi:schemaLocation", "urn:a b", "xsi", "", hotspotHost, true],
          ["xsi:schemaLocation", "urn:a b", "zs", "", hotspotHost, true],
          ["xsi:schemaLocation", "urn:a b", "", "Attribute_prefix", hotspotHost, false],
          ["xsi:schemaLocation", "urn:a b", "xml", "Attribute_prefix", hotspotHost, false],
          ["xsi:schemaLocation", "urn:a b", "xmlns", "Attribute_prefix", hotspotHost, false],
          ["xlink:href", "a.xml", "xl", "", lom, true],
          ["xlink:href", "a.xml", "", "Attribute_prefix", lom, false],
          ["foreign", "1", "f", "", foreign, true],
          ["foreign", "1", "", "Attribute_prefix", foreign, false],
          ["own-namespace", "1", "o", "", foreign, true],
          ["own-namespace", "1", "", "Attribute_prefix", foreign, false],
          ["xlink:type", "simple", "xlink", "", lom, true],
          ["xlink:type", " locator ", "xlink", "", lom, true],
          ["xlink:type", "bogus", "xlink", "value_domain", lom, false],
          ["xlink:role", "urn:r", "xlink", "", lom, true],
          ["xlink:role", "", "xlink", "value_domain", lom, false],
          ["xlink:role", " ", "xlink", "value_domain", lom, false],
          ["view", "candidate tutor", "", "", rubric, true],
          ["view", "", "", "value_domain", rubric, false],
          ["view", "  ", "", "value_domain", rubric, false],
        ];
        for (const [name, lexical, prefix, check, host, valid] of cases) {
          const label = `${name}=${JSON.stringify(lexical)} written with ${JSON.stringify(prefix)} on ${host.kind}`;
          const refused = yield* judged(
            client,
            statedInserts([attributeOf({ lexical, name }, { host, rest: { prefix } })]),
          );

          if (valid) {
            assertNoRowLawRefuses(refused, label);
          } else {
            assertVerdict(refused, checkConstraintOf(Qti, Attribute.name, check), true, label);
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "carries an IDREFS attribute's tokens as Idref pieces that concatenate to its lexical form, and none on any other attribute",
    () =>
      // Oracle: PostgreSQL, E1_derived on Attribute (the concatenation's end is the lexical form of
      // an IDREF or IDREFS attribute, and no other attribute has tokens) and on Idref (a token
      // holds no whitespace, and every token after the first follows whitespace), and the concat
      // fold's slot-0 pin by its comment. Each piece is generated, its whitespace and its token, so
      // no case can write one that is not its parts.
      // Bound: one control and one corruption of each law.
      Effect.gen(function* idrefTokens() {
        const client = yield* loginSession;
        const controls = attributeOf(
          { lexical: "a b", name: "aria-controls" },
          { rest: { idrefText: "a b", idrefs: 2n } },
        );
        assertNoRowLawRefuses(yield* judged(client, statedInserts([controls])), "IDREFS control");
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              { ...controls, fact: { ...controls.fact, idrefText: "a", idrefs: 1n } },
            ]),
          ),
          checkConstraintOf(Qti, Attribute.name, "E1_derived"),
          true,
          "tokens short of the lexical form",
        );
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              attributeOf(
                { lexical: "H1", name: "identifier" },
                { rest: { idrefText: "H1", idrefs: 1n } },
              ),
            ]),
          ),
          checkConstraintOf(Qti, Attribute.name, "E1_derived"),
          true,
          "an identifier, of no IDREF domain, with tokens",
        );

        assertNoRowLawRefuses(
          yield* judged(
            client,
            statedInserts([
              idrefPiece(0, { piecesAfter: "a", piecesWas: "", token: "a" }),
              idrefPiece(1, { piecesAfter: "a b", piecesWas: "a", token: "b" }),
            ]),
          ),
          "pieces control",
        );

        for (const [label, stated] of [
          [
            "a token holding a space",
            idrefPiece(0, { piecesAfter: "a c", piecesWas: "", token: "a c" }),
          ],
          [
            "a second token with no whitespace before it",
            idrefPiece(1, { before: "", piecesAfter: "ab", piecesWas: "a", token: "b" }),
          ],
        ] as const) {
          assertVerdict(
            yield* judged(client, statedInserts([stated])),
            checkConstraintOf(Qti, stated.relation.name, "E1_derived"),
            true,
            label,
          );
        }

        assertVerdict(
          yield* judged(
            client,
            statedInserts([idrefPiece(0, { piecesAfter: "za", piecesWas: "z", token: "a" })]),
          ),
          yield* constraintDescribed(client, "idref", "check of Idref for law concat fold%"),
          true,
          "a junk running text at slot 0",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds an open name's namespace to its class against its element's, and its expanded name distinct on its element",
    () =>
      // Oracle: PostgreSQL, Foreign_attribute_class by name (XML Schema 1.0 Part 1 §3.10.4, with
      // Namespaces in XML 1.0 §2 for the absent namespace) and OpenAttributeName's key (node, uri,
      // local) by its comment (XML Namespaces' unique expanded names); the open names' count by
      // the ordered family's index CHECK.
      // Bound: each class with its namespace right and wrong; a closed kind's element namespace
      // right and wrong; two names of one expanded name; two open names under one attribute.
      Effect.gen(function* openNames() {
        const client = yield* loginSession;
        const kindNamespace =
          KindNamespace.rows.find((row) => row.kind === kind)?.namespace ??
          assert.fail(`KindNamespace holds ${kind}`);
        const cases: readonly (readonly [string, Stated, boolean])[] = [
          ["no-namespace in none", openNameOf({ class: "no-namespace" }), true],
          [
            "no-namespace in a namespace",
            openNameOf({ class: "no-namespace", uri: "urn:x" }),
            false,
          ],
          ["data-* in none", openNameOf({ class: "data-*", local: "data-a" }), true],
          [
            "data-* in a namespace",
            openNameOf({ class: "data-*", local: "data-a", uri: "urn:x" }),
            false,
          ],
          [
            "own-namespace in its element's",
            openNameOf({ class: "own-namespace", uri: "urn:element" }),
            true,
          ],
          ["own-namespace in another", openNameOf({ class: "own-namespace", uri: "urn:x" }), false],
          ["own-namespace in none", openNameOf({ class: "own-namespace" }), false],
          ["foreign in another", openNameOf({ class: "foreign", uri: "urn:x" }), true],
          ["foreign in its element's", openNameOf({ class: "foreign", uri: "urn:element" }), false],
          ["foreign in none", openNameOf({ class: "foreign" }), false],
          [
            "foreign on a kind, its element's namespace the kind's",
            openNameOf({ class: "foreign", elementNamespace: kindNamespace, kind, uri: "urn:x" }),
            true,
          ],
          [
            "foreign on a kind, its element's namespace another",
            openNameOf({ class: "foreign", elementNamespace: "urn:other", kind, uri: "urn:x" }),
            false,
          ],
        ];
        for (const [label, stated, valid] of cases) {
          const refused = yield* judged(client, statedInserts([stated]));

          if (valid) {
            assertNoRowLawRefuses(refused, label);
          } else {
            assertVerdict(
              refused,
              checkConstraintOf(Qti, OpenAttributeName.name, "Foreign_attribute_class"),
              true,
              label,
            );
          }
        }

        const foreign = { class: "foreign", uri: "urn:x" };
        const second = openNameOf({ ...foreign, local: "b" });
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              openNameOf(foreign),
              openNameOf(foreign, "00000000-0000-4000-8000-000000000101"),
            ]),
          ),
          yield* constraintDescribed(
            client,
            "open_attribute_name",
            "key OpenAttributeName(node, uri, local)%",
          ),
          true,
          "two attributes of one expanded name on one element",
          "23505",
        );
        assertVerdict(
          yield* judged(
            client,
            statedInserts([openNameOf(foreign), { ...second, fact: { ...second.fact, at: 1n } }]),
          ),
          yield* constraintDescribed(
            client,
            "open_attribute_name",
            "check of OpenAttributeName for law ordered%",
          ),
          true,
          "two open names under one attribute",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds a data-* name to its pattern and to what its element's governor declares",
    () =>
      // Oracle: PostgreSQL, OpenAttributeName's AL4_data_name and AL4_declared_data_name checks,
      // by name (a named check carries no comment to find it by); the pattern is the HTML data-* name (`/^data-[a-z0-9_.-]+$/u`).
      // Bound: a data-* name with an upper-case and a non-ASCII local (decision 424, the standard's
      // refusal), a no-namespace name starting data- on a closed element, a declared name on an
      // element that admits no custom one and on the one whose governor does not declare it, and
      // a plain data-* name.
      Effect.gen(function* dataNames() {
        const client = yield* loginSession;
        const pattern = "al_4_data_name";
        const declared = "al_4_declared_data_name";
        const cases: readonly (readonly [string, Stated, string | undefined])[] = [
          [
            "data-* with an upper-case local",
            openNameOf({ class: "data-*", local: "data-A" }),
            pattern,
          ],
          [
            "data-* with a non-ASCII local",
            openNameOf({ class: "data-*", local: "data-é" }),
            pattern,
          ],
          [
            "no-namespace data-x on p",
            openNameOf({ class: "no-namespace", ...on("p"), local: "data-x" }),
            pattern,
          ],
          [
            "data-* data-catalog-idref on p",
            openNameOf({ class: "data-*", ...on("p"), local: "data-catalog-idref" }),
            declared,
          ],
          [
            "data-* data-x on p",
            openNameOf({ class: "data-*", ...on("p"), local: "data-x" }),
            undefined,
          ],
          [
            "data-* data-catalog-idref on qti-assessment-item",
            openNameOf({
              class: "data-*",
              ...on("qti-assessment-item"),
              local: "data-catalog-idref",
            }),
            undefined,
          ],
        ];
        for (const [label, stated, refusedBy] of cases) {
          const verdict = yield* judged(client, statedInserts([stated]));

          if (refusedBy === undefined) {
            assertNoRowLawRefuses(verdict, label);
          } else {
            assertVerdict(verdict, refusedBy, true, label);
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );
});
