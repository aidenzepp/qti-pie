/* oxlint-disable unicorn/text-encoding-identifier-case -- A `Document` row spells its XML encoding labels (`UTF-8`) as crust's reader reports them and `Document` stores them. */
/**
 * The identity overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3),
 * written to run at N1 and never by a hand: each refused state is one the law's model refuses,
 * named by the constraint that states the law.
 *
 * Every case is a direct SQL writer's, as the rules file's rule 8 and grizzle's README ("Direct SQL
 * access") state it, through the one direct writer (`#pantry/test/direct-sql.ts`): a case states
 * its rows as facts, and the writer orders them, owners first, and fills each owner's counts from
 * the members the case states under it (unless the case states one) and each member's hidden
 * index and copy of its owner's count from `Qti`'s family statements. It then sets the one
 * deferred constraint under test immediate, and rolls back. A row's CHECKs, keys and non-deferrable
 * foreign keys (a key whose target holds no field beyond the ones it names) are judged at its
 * INSERT's end. A family's owner axis is deferred, so a case that judges one sets it immediate: a
 * `DocumentId`'s and an `XmlLang`'s document is a `Document` row (`Document.ids`,
 * `Document.langs`), stated beside them. A refused case's verdict is its SQLSTATE and
 * the constraint that states the law, and a control's is that the same constraint passes.
 *
 * The cases that need a whole stored document arrive with the importer (Q5.15), and probe P2
 * restates them over a package: a dangling IDREF token, refused at COMMIT by `foreign key
 * Idref(document, token) to IdrefTarget(document, id)` (23503), and a text's by `TextIdref`'s,
 * which this file holds to their fields by the catalogue, since a token's owner axis into
 * `Attribute` or `IdentityText` is not deferrable; the copies between `Attribute`, `Node` and each
 * overlay, both ways; and R26 over a manifest and an item.
 */
import { assert, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Client } from "pg";
import { describe } from "vitest";
import { Flag } from "#pantry/grammar/install.ts";
import { governorOf } from "#pantry/import/fold.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  DocumentGenerals,
  DocumentId,
  DocumentLang,
  FragmentValue,
  GeneralLang,
  IdBinding,
  IdentityText,
  LabelUse,
  LomLanguage,
  ResourceLomLanguageSet,
  SsmlAttribute,
  SsmlScope,
  XmlLang,
} from "#pantry/qti/identity.ts";
import { Qti } from "#pantry/qti/own.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  assertVerdict,
  constraintDescribed,
  judged,
  loginSession,
  qtiSchema,
  rowsOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * Read a foreign key's referencing and referenced columns from the catalogue.
 *
 * @param client - The session.
 * @param name - The constraint's name.
 * @returns The two tables and their columns, in key order.
 */
const foreignKeyOf = (client: Client, name: string) =>
  rowsOf<{ readonly columns: string; readonly target: string; readonly targets: string }>(
    client,
    `SELECT pg_catalog.string_agg(a.attname, ' ' ORDER BY k.n) AS columns,
            t.relname AS target,
            pg_catalog.string_agg(b.attname, ' ' ORDER BY k.n) AS targets
       FROM pg_catalog.pg_constraint c
       JOIN pg_catalog.pg_namespace s ON s.oid = c.connamespace
       JOIN pg_catalog.pg_class t ON t.oid = c.confrelid
       CROSS JOIN LATERAL ROWS FROM (pg_catalog.unnest(c.conkey), pg_catalog.unnest(c.confkey)) WITH ORDINALITY AS k(src, dst, n)
       JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.src
       JOIN pg_catalog.pg_attribute b ON b.attrelid = c.confrelid AND b.attnum = k.dst
      WHERE s.nspname = $1 AND c.conname = $2 AND c.contype = 'f'
      GROUP BY t.relname`,
    [qtiSchema, name],
  ).pipe(Effect.map((rows) => rows[0]));

/**
 * The uuid of the case's row numbered `n`: no stored row holds one.
 *
 * @param n - The number, below 256.
 * @returns The uuid.
 */
const uuidOf = (n: number): string =>
  `00000000-0000-4000-8000-00000000${n.toString(16).padStart(4, "0")}`;

/**
 * The two documents the cases write into.
 */
const [first, second] = [uuidOf(1), uuidOf(2)] as const;

/**
 * A `DocumentId` fact of an element: its lexical form split around its value as the builder
 * splits it, or as the case corrupts it, and its owner, the element itself for an attribute's ID.
 * Its slots in its binding's family and its document's are its place among the IDs the case
 * states under each.
 *
 * @param node - The element's number.
 * @param document - Its document.
 * @param pieces - The lexical form and its pieces.
 * @param pieces.before - The whitespace before the value.
 * @param pieces.id - The value.
 * @param pieces.after - The whitespace after the value.
 * @param pieces.lexical - The lexical form; by default the pieces concatenated.
 * @param pieces.owner - The number of the element its binding names; by default its own.
 * @returns The fact.
 */
const documentId = (
  node: number,
  document: string,
  {
    after = "",
    before = "",
    id,
    lexical = `${before}${id}${after}`,
    owner = node,
  }: {
    readonly after?: string;
    readonly before?: string;
    readonly id: string;
    readonly lexical?: string;
    readonly owner?: number;
  },
): Stated => ({
  fact: { after, before, document, id, lexical, node: uuidOf(node), owner: uuidOf(owner) },
  relation: DocumentId,
});

/**
 * An `IdBinding` fact: an id of a document bound to an element, carried by the IDs the case states
 * under it.
 *
 * @param document - The document.
 * @param id - The id.
 * @param owner - The number of the element it is bound to.
 * @returns The fact.
 */
const binding = (document: string, id: string, owner: number): Stated => ({
  fact: { document, id, owner: uuidOf(owner) },
  relation: IdBinding,
});

/**
 * The package every case's documents are entries of: no stored row holds it.
 */
const casePackage = uuidOf(255);

/**
 * A `Document` fact of an item document, the owner of its IDs' and its `xml:lang` carriers'
 * families, each count the members the case states under it: a counted family's owner axis is not
 * deferrable, so a `DocumentId` or `XmlLang` row is judged against its document's row at its
 * INSERT. Every other field is lawful on the row's own CHECKs: no XML declaration, no site naming
 * the document (so its context is the empty set and its nearest context the document node), and an
 * item's resource type over an item root (`RootOfType`). Its foreign keys are deferred and never
 * judged.
 *
 * @param document - The document's node.
 * @returns The fact.
 */
const documentOf = (document: string): Stated => ({
  fact: {
    assembled: false,
    charset: "UTF-8",
    context: bitsText(Flag, []),
    contextNearest: document,
    contextNearestKind: "document",
    documentType: "imsqti_item_xmlv3p0",
    exportCharset: "UTF-8",
    node: document,
    nodeChildren: 1n,
    package: casePackage,
    path: `${document}.xml`,
    rootKind: "qti-assessment-item",
    version: "3.0.1",
  },
  relation: Document,
});

/**
 * The first document's `DocumentGenerals` fact, its count of describing categories as a case
 * states it, none of which it writes.
 *
 * @param generals - The count.
 * @returns The fact.
 */
const described = (generals: bigint): Stated => ({
  fact: { document: first, generals },
  relation: DocumentGenerals,
});

/**
 * The family of one projection and its members: `DocumentLang` over `XmlLang`, and
 * `ResourceLomLanguageSet` over `LomLanguage`. `count` is the projection's family. `beside` states
 * the other rows a case's owner and members are judged against at their INSERT, each owner axis
 * and a foreign key whose target holds no field beyond the ones it names being immediate: the
 * document's `Document` row, the owner of its `xml:lang` carriers too (`Document.langs`), and its
 * `DocumentGenerals` row, the one a form's `generals` of 0 names.
 */
interface Projection {
  readonly beside: readonly Stated[];
  readonly count: string;
  readonly member: (node: number, owner: string, lang: string) => Stated;
  readonly memberTable: string;
  readonly owner: (owner: string, lang: string) => Stated;
}

/**
 * The two projections, each over its owner field: a document, or a LOM general category. A LOM
 * language's tag is its value case-folded, so a lower-case value is its own tag. An owner's
 * carriers are the members a case states under it.
 */
const projections: readonly Projection[] = [
  {
    beside: [documentOf(first), described(0n)],
    count: "DocumentLang.carriers",
    member: (node, document, lang) => ({
      fact: { document, lang, node: uuidOf(node) },
      relation: XmlLang,
    }),
    memberTable: "xml_lang",
    owner: (document, lang) => ({ fact: { document, lang }, relation: DocumentLang }),
  },
  {
    beside: [],
    count: "ResourceLomLanguageSet.carriers",
    member: (node, general, lang) => ({
      fact: { general, lang, node: uuidOf(node), tag: lang },
      relation: LomLanguage,
    }),
    memberTable: "lom_language",
    owner: (general, lang) => ({ fact: { general, lang }, relation: ResourceLomLanguageSet }),
  },
];

/**
 * One `LabelUse` fact, of an element in a document whose root is of the given kind.
 *
 * @param rootKind - The document's root kind.
 * @returns The fact.
 */
const labelled = (rootKind: string): Stated => ({
  fact: { document: first, node: uuidOf(3), rootKind },
  relation: LabelUse,
});

/**
 * A `DocumentLang` fact of the first document, carried once, its count of listing categories as a
 * case states it; the case writes neither its carrier nor its witnesses.
 *
 * @param lang - The `xml:lang` form.
 * @param generals - The count of its witnesses.
 * @returns The fact.
 */
const form = (lang: string, generals: bigint): Stated => ({
  fact: { carriers: 1n, document: first, generals, lang },
  relation: DocumentLang,
});

/**
 * One R26 witness of the first document's form, its one listing category's, beside the form's
 * `DocumentLang` row and the document's `DocumentGenerals` row of one category, which a stated
 * form's foreign key names at its INSERT.
 *
 * @param lang - The `xml:lang` form.
 * @param value - The witness's value, as the case writes it.
 * @returns The facts.
 */
const witness = (lang: string, value: string): readonly Stated[] => [
  described(1n),
  form(lang, 1n),
  { fact: { document: first, general: uuidOf(9), lang, value }, relation: GeneralLang },
];

/**
 * Fold ASCII capitals to lower case, RFC 5646 §2.1.1's comparison of language tags
 * (`Compute.lowerAscii`).
 *
 * @param text - The text.
 * @returns It case-folded.
 */
const lowerAscii = (text: string): string =>
  text.replaceAll(/[A-Z]/gu, (letter) => letter.toLowerCase());

/**
 * Collapse a text as XML Schema 1.0 Part 2 §4.3.6's whiteSpace `collapse` does an
 * `xs:language`'s: each tab, line feed and carriage return a space, each run of spaces one, and
 * none at either end.
 *
 * @param text - The text.
 * @returns It collapsed.
 */
const collapsed = (text: string): string =>
  text
    .replaceAll(/[\t\n\r]/gu, " ")
    .replaceAll(/ +/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * The general category every listing case's LOM language belongs to: the one that describes the
 * first document, which {@link witness}'s row names.
 */
const listingGeneral = uuidOf(9);

/**
 * One R26 listing, the builder's facts for it: a LOM language of the first document's one general
 * category, its tag its value case-folded as written (`LomLanguage`'s `E1_derived`), the category's
 * language set over that tag, and the first document's stated `xml:lang` form with its one witness,
 * whose value is the form collapsed and case-folded (`GeneralLang`'s `E1_derived`). Every row's own
 * CHECKs and immediate keys hold, so the one key left to judge is the witness's containment into
 * the category's languages.
 *
 * @param xmlLang - The document's `xml:lang` form.
 * @param lomLang - The `lom:language` element's string value, as written.
 * @returns The facts.
 */
const listing = (xmlLang: string, lomLang: string): readonly Stated[] => [
  {
    fact: { general: listingGeneral, lang: lowerAscii(lomLang) },
    relation: ResourceLomLanguageSet,
  },
  {
    fact: { general: listingGeneral, lang: lomLang, node: uuidOf(6), tag: lowerAscii(lomLang) },
    relation: LomLanguage,
  },
  ...witness(xmlLang, lowerAscii(collapsed(xmlLang))),
];

/**
 * An `IdentityText` fact of a `qti-description` under a governing type, its governor the one the
 * type gives it (`governorOf`), with its IDREF token count and their concatenation's end as a case
 * states them; the case writes none of its tokens.
 *
 * @param governs - The governing type's `TypeName` handle.
 * @param lexical - The element's text.
 * @param idrefs - Its token count.
 * @param idrefText - Its tokens' concatenation.
 * @returns The fact.
 */
const identityText = (
  governs: string,
  lexical: string,
  idrefs: bigint,
  idrefText: string,
): Stated => ({
  fact: {
    document: first,
    governor: governorOf("3.0.1", "qti-description", Option.some(governs)),
    idrefText,
    idrefs,
    kind: "qti-description",
    lexical,
    node: uuidOf(4),
    owner: uuidOf(3),
    version: "3.0.1",
  },
  relation: IdentityText,
});

/**
 * A `FragmentValue` fact: a value the attributes of one kind of element hold in a fragment, held by
 * `carriers` of them as a case states it, which need not be the attributes it writes.
 *
 * @param fragment - The fragment's `speak`, by number.
 * @param kind - The element kind.
 * @param value - The value.
 * @param carriers - The attributes that hold it.
 * @returns The fact.
 */
const fragmentValue = (
  fragment: number,
  kind: string,
  value: string,
  carriers: bigint,
): Stated => ({
  fact: { carriers, fragment: uuidOf(fragment), kind, value },
  relation: FragmentValue,
});

/**
 * One SSML attribute of a fragment, a member of its value's family, its value written bare.
 *
 * @param node - Its element's number.
 * @param fragment - Its fragment's `speak`, by number.
 * @param read - The attribute: its element kind, its name, the kind it names, and its value.
 * @param read.kind - The element kind.
 * @param read.name - The attribute's name.
 * @param read.refers - The kind its value names.
 * @param read.value - The value.
 * @returns The fact.
 */
const ssmlAttribute = (
  node: number,
  fragment: number,
  read: {
    readonly kind: string;
    readonly name: string;
    readonly refers: string;
    readonly value: string;
  },
): Stated => ({
  fact: {
    fragment: uuidOf(fragment),
    kind: read.kind,
    lexical: read.value,
    name: read.name,
    node: uuidOf(node),
    refers: read.refers,
    value: read.value,
  },
  relation: SsmlAttribute,
});

/**
 * An `SsmlScope` fact of the first document's element, its fragment as a case writes it.
 *
 * @param node - The element's number.
 * @param scope - The element's kind, its parent's number and its fragment's.
 * @param scope.fragment - The fragment's number; the document's node is the document itself.
 * @param scope.kind - The element kind.
 * @param scope.parent - The parent's number; the document's node is the document itself.
 * @returns The fact.
 */
const ssmlScope = (
  node: number,
  scope: { readonly fragment: number; readonly kind: string; readonly parent: number },
): Stated => ({
  fact: {
    document: first,
    fragment: uuidOf(scope.fragment),
    kind: scope.kind,
    nearest: first,
    node: uuidOf(node),
    parent: uuidOf(scope.parent),
    start: BigInt(node),
    version: "3.0.1",
  },
  relation: SsmlScope,
});

describe.skipIf(!hasLease)("qti/identity.db.test.ts, on the lease", () => {
  it.effect(
    "refuses one id bound to two elements of one document by DocumentId key, and accepts one id bound twice to one element and one id in two documents",
    () =>
      // Oracle: PostgreSQL, the UNIQUE of `key(on(IdBinding, "document", "id"))`, against XML
      // Schema 1.0 Part 1 §3.15.5 and cvc-id clause 2 (reading 101): an id's [binding] is the set of
      // elements that purport it, an attribute's element or an ID-typed text's parent, and no
      // binding has two members; so two ID-typed children of one parent with one value, ` a ` and
      // `a`, are one binding, and so are one id in each of two documents.
      // Bound: one id on two elements of one document; one id twice under one parent, as written
      // and padded; one id in two documents.
      Effect.gen(function* documentKey() {
        const client = yield* loginSession;
        const key = yield* constraintDescribed(client, "id_binding", "key IdBinding(document, id)");

        assertVerdict(
          yield* judged(
            client,
            // Each binding is carried once, by an ID the case does not write.
            statedInserts(
              [3, 4].map((owner): Stated => ({
                fact: { carriers: 1n, document: first, id: "a", owner: uuidOf(owner) },
                relation: IdBinding,
              })),
            ),
          ),
          key,
          true,
          "one id on two elements",
          "23505",
        );
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              documentOf(first),
              binding(first, "a", 3),
              documentId(4, first, { id: "a", owner: 3 }),
              documentId(5, first, { after: " ", before: "\t", id: "a", owner: 3 }),
            ]),
          ),
          key,
          false,
          "one id twice under one parent",
        );
        assertVerdict(
          yield* judged(
            client,
            statedInserts([
              documentOf(first),
              documentOf(second),
              binding(first, "a", 3),
              binding(second, "a", 4),
              documentId(3, first, { id: "a" }),
              documentId(4, second, { id: "a" }),
            ]),
          ),
          key,
          false,
          "one id in two documents",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses an ID row whose pieces are not its lexical form's value and outer whitespace, by E1_derived, and accepts the builder's split",
    () =>
      // Oracle: PostgreSQL, `DocumentId`'s `E1_derived` CHECK, against XML Schema 1.0 Part 2
      // §4.3.6's whiteSpace collapse of an xs:NCName: the value is the form with its outer
      // whitespace removed, one run with no whitespace in it.
      // Bound: a value that is not the form's, whitespace kept in the value, inner whitespace, an
      // empty value, and the control.
      Effect.gen(function* idSplit() {
        const client = yield* loginSession;
        const cases = [
          ["another value", { id: "b", lexical: "a" }],
          ["outer whitespace in the value", { id: " a", lexical: " a" }],
          ["inner whitespace", { id: "a b" }],
          ["an empty value", { before: " ", id: "" }],
          ["the split", { after: "\n", before: " ", id: "a" }],
        ] as const;

        for (const [label, pieces] of cases) {
          assertVerdict(
            yield* judged(
              client,
              statedInserts([
                documentOf(first),
                binding(first, pieces.id, 3),
                documentId(3, first, pieces),
              ]),
            ),
            checkConstraintOf(Qti, DocumentId.name, "E1_derived"),
            label !== "the split",
            label,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses each projection's member whose value its owner lacks, and an owner value no member carries, and accepts one value carried twice as one row",
    () =>
      // Oracle: PostgreSQL, each counted family's owner-axis foreign key (deferred, set immediate)
      // and the owner's `E1_derived` CHECK, `carriers > 0`, against the
      // specification of a projection (sets ruling 2): its rows are exactly the values its members
      // carry, each once. These are the `lang-set-copy` fixtures, both ways. Each case states the
      // projection's other owners (`beside`), holding the case's members, so the one owner axis
      // that can break is the projection's.
      // Bound: each projection's missing owner, its uncarried owner, and its value carried by two
      // members.
      Effect.gen(function* langSetCopy() {
        const client = yield* loginSession;
        for (const projection of projections) {
          const ownerAxis = yield* constraintDescribed(
            client,
            projection.memberTable,
            `foreign key %the owner's count of the family ${projection.count}) to %`,
          );
          const label = projection.count;

          assertVerdict(
            yield* judged(
              client,
              statedInserts([...projection.beside, projection.member(3, first, "fr")]),
              [ownerAxis],
            ),
            ownerAxis,
            true,
            `${label}: a member whose value its owner lacks`,
            "23503",
          );
          assertVerdict(
            yield* judged(
              client,
              statedInserts([...projection.beside, projection.owner(first, "fr")]),
            ),
            checkConstraintOf(Qti, projection.owner(first, "fr").relation.name, "E1_derived"),
            true,
            `${label}: an owner value no member carries`,
          );
          assertVerdict(
            yield* judged(
              client,
              statedInserts([
                ...projection.beside,
                projection.owner(first, "fr"),
                projection.member(3, first, "fr"),
                projection.member(4, first, "fr"),
              ]),
              [ownerAxis],
            ),
            ownerAxis,
            false,
            `${label}: one value carried twice`,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a label in an item whose root names no tool, by Label tools, and binds no label in a stimulus",
    () =>
      // Oracle: PostgreSQL, the two foreign keys from `select(LabelUse, rootKind =
      // qti-assessment-item)` into the item roots' `tool-name` and `tool-version`, set immediate,
      // against the information model's label characteristic (§5.16.5: "If an item uses labels
      // then values for the associated toolName and toolVersion characteristics must also be
      // provided"), which binds an item, not a stimulus.
      // Bound: a label in an item with neither tool stored, and the same label in a stimulus.
      Effect.gen(function* labelTools() {
        const client = yield* loginSession;
        const tools = yield* Effect.forEach(["tool-name", "tool-version"], (tool) =>
          constraintDescribed(
            client,
            "label_use",
            `foreign key LabelUse(document where %"${tool}"%`,
          ),
        );
        for (const tool of tools) {
          assertVerdict(
            yield* judged(client, statedInserts([labelled("qti-assessment-item")]), [tool]),
            tool,
            true,
            `an item's label beside no ${tool}`,
            "23503",
          );
        }

        assertVerdict(
          yield* judged(client, statedInserts([labelled("qti-assessment-stimulus")]), tools),
          "",
          false,
          "a stimulus's label",
        );
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "holds Idref target as the foreign keys from Idref's and TextIdref's (document, token) into IdrefTarget's (document, id)",
    () =>
      // Oracle: the catalogue, against the statements `contained(on(Idref, "document", "token"),
      // on(IdrefTarget, "document", "id"))` and its `TextIdref` twin (`#pantry/qti/identity.ts`,
      // identityLaws): XML Schema's Validation Root, an IDREF, an attribute's or an element
      // text's (reading 101), names an ID of its document, through the projection of the ids its
      // tokens name (spec reading 117), which `unassembledTargets` holds to `IdBinding` in a
      // document of no assembly. The dangling token itself is refused over a whole stored
      // document (Q5.15, P2).
      // Bound: the two foreign keys.
      Effect.gen(function* idrefTarget() {
        const client = yield* loginSession;
        for (const [relation, table] of [
          ["Idref", "idref"],
          ["TextIdref", "text_idref"],
        ] as const) {
          const name = yield* constraintDescribed(
            client,
            table,
            `foreign key ${relation}(document, token) to IdrefTarget(document, id)`,
          );

          assert.deepStrictEqual(
            yield* foreignKeyOf(client, name),
            { columns: "document token", target: "idref_target", targets: "document id" },
            relation,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a stated xml:lang form whose listing categories fall short of its document's, by Document lang, and accepts an equal count, an unstated form, one that is no tag and a document no category describes",
    () =>
      // Oracle: PostgreSQL, the foreign key of `documentLang`, against QTI 3.0 Metadata §2.7.1.3
      // ("There must be one value for each of the languages referred to by the language
      // attributes"), counted: a form that states a language is listed by as many general
      // categories (`DocumentLang.generals`, its witnesses) as describe its document
      // (`DocumentGenerals.generals`), and an empty or all-whitespace form states none (XML 1.0
      // §2.12), nor does one that is no language tag once collapsed (RFC 5646 §2.1, spec reading
      // 164). Its target holds no field beyond the two it names, so PostgreSQL judges it at the
      // form's INSERT (README, "Direct SQL access": a foreign key is deferred to COMMIT only as a
      // family's proof needs, or when its target has another field or it lies on a cycle); it is
      // set immediate too, which PostgreSQL takes as a no-op on a key it does not defer, so the
      // case holds wherever grizzle places it.
      // Bound: a stated form listed by none of one category; listed by it; the empty form, a form
      // of whitespace alone and one that is no tag beside one category; a stated form of a
      // document no category describes.
      Effect.gen(function* documentLangLaw() {
        const client = yield* loginSession;
        const law = yield* constraintDescribed(
          client,
          "document_lang",
          "foreign key DocumentLang(document where %, generals where %) to DocumentGenerals(document, generals)",
        );
        for (const [label, stated, refused] of [
          ["a stated form no category lists", [described(1n), form("en", 0n)], true],
          ["a stated form its one category lists", [described(1n), form("en", 1n)], false],
          ["the empty form", [described(1n), form("", 0n)], false],
          ["a form of whitespace alone", [described(1n), form(" \t", 0n)], false],
          ["a form that is no tag", [described(1n), form("en_GB", 0n)], false],
          ["a document no category describes", [described(0n), form("en", 0n)], false],
        ] as const) {
          assertVerdict(
            yield* judged(client, statedInserts(stated), [law]),
            law,
            refused,
            label,
            "23503",
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses an R26 witness whose value is not its form's collapsed value, by E1_derived, and accepts the collapsed value",
    () =>
      // Oracle: PostgreSQL, `GeneralLang`'s `E1_derived` CHECK, `value = lowerAscii(collapse(lang))`
      // of a form that states a language, against XML Schema 1.0 Part 2 §3.3.3: an xs:language's
      // value is its form collapsed, outer whitespace removed, and a form states a language only
      // where that value is a language tag (spec reading 164). Each case states its document's
      // one category and its form, so the witness's owner axis and the form's own key hold at
      // their INSERTs and the CHECK is the verdict.
      // Bound: another value, whitespace kept in the value, an empty value, the value of a form
      // that is no tag, and the control.
      Effect.gen(function* witnessSplit() {
        const client = yield* loginSession;
        for (const [label, lang, value] of [
          ["another value", "en", "fr"],
          ["whitespace kept in the value", " en", " en"],
          ["an empty value", " ", ""],
          ["the value of a form that is no tag", "en_GB", "en_gb"],
          ["the collapsed value", " fr\n", "fr"],
        ] as const) {
          assertVerdict(
            yield* judged(client, statedInserts(witness(lang, value))),
            checkConstraintOf(Qti, GeneralLang.name, "E1_derived"),
            label !== "the collapsed value",
            label,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a document language no LOM language of its category lists as written, by the witness's containment into the category's languages, and accepts one listed in another case (spec reading 134)",
    () =>
      // Oracle: the specification as a checker, spec reading 134: QTI 3.0 Metadata §2.7.1.3 ("There
      // must be one value for each of the languages referred to by the language attributes"),
      // compared as language tags, case-insensitively (RFC 5646 §2.1.1); `xml:lang` is an
      // `xs:language`, collapsed (XML Schema 1.0 Part 2 §3.3.3), and a LOM language is
      // `CharacterString`, an `xs:string` as written, so whitespace around it makes it no tag (RFC
      // 5646 §2.1: "Whitespace is not permitted in a language tag"). PostgreSQL judges it by the
      // foreign key `GeneralLang(general, value) to ResourceLomLanguageSet(general, lang)`, set
      // immediate: 23503 on that key where the category lists no language the form states.
      // Bound: the small scope exhausted, every pair of four forms of `xml:lang` (plain, padded,
      // upper case and a region subtag) and six LOM languages (plain, padded with spaces, upper
      // case, the region in lower case, a trailing line feed, and another language), 24 cases.
      Effect.gen(function* listedAsWritten() {
        const client = yield* loginSession;
        const key = yield* constraintDescribed(
          client,
          "general_lang",
          "foreign key GeneralLang(general, value) to ResourceLomLanguageSet(general, lang)",
        );
        for (const xmlLang of ["en", " en\t", "EN", "en-GB"]) {
          for (const lomLang of ["en", " en ", "EN", "en-gb", "en\n", "fr"]) {
            assertVerdict(
              yield* judged(client, statedInserts(listing(xmlLang, lomLang)), [key]),
              key,
              lowerAscii(collapsed(xmlLang)) !== lowerAscii(lomLang),
              `xml:lang ${JSON.stringify(xmlLang)} beside LOM ${JSON.stringify(lomLang)}`,
              "23503",
            );
          }
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses an identity-typed text whose tokens do not fit its identity, by E1_derived, and accepts an ID with no tokens and an IDREF whose tokens are its text",
    () =>
      // Oracle: PostgreSQL, `IdentityText`'s `E1_derived` CHECK over the installed `GoverningOf`,
      // `TextDomain` and `ValueIdentity`, against XML Schema 1.0 Part 1 §3.15.5 (C50): an element
      // whose governing type reads its text as an xs:ID holds one ID and no IDREF token, one read
      // as an xs:IDREF or xs:IDREFS holds tokens that concatenate to its text, and an element of
      // no identity type has no row.
      // Bound: an ID with a token, an IDREF whose tokens are not its text, an untyped text, and
      // the two controls.
      Effect.gen(function* identityTextCheck() {
        const client = yield* loginSession;
        for (const [label, stated, refused] of [
          ["an ID with a token", identityText("xs:ID", "a", 1n, "a"), true],
          ["an IDREF whose tokens are not its text", identityText("xs:IDREF", "a", 1n, "b"), true],
          ["a text of no identity type", identityText("xs:normalizedString", "a", 0n, ""), true],
          ["an ID", identityText("xs:ID", " a ", 0n, ""), false],
          ["an IDREF", identityText("xs:IDREF", " a ", 1n, " a "), false],
        ] as const) {
          assertVerdict(
            yield* judged(client, statedInserts([stated])),
            checkConstraintOf(Qti, stated.relation.name, "E1_derived"),
            refused,
            label,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a startmark whose mark its fragment defines other than once, by SSML trim mark, and a lookup whose lexicon its fragment lacks, by SSML lexicon reference, and accepts each named once",
    () =>
      // Oracle: PostgreSQL, the foreign keys of `ssmlTrimMark` and `ssmlLexiconReference`, each set
      // immediate, against SSML 1.1 §3.1.1.1 ("Only markers defined once in the document … are
      // permitted as the value of either startmark or endmark") and §3.1.5.1 (a lexicon's name is
      // scoped to "the current SSML document") under spec reading 3, each fragment a speak. The
      // trim's key names every field of `FragmentValue` (its `carriers = 1` a tag column), so
      // PostgreSQL judges it at the trim's INSERT (README, "Direct SQL access"); the lookup's
      // target holds `carriers` beyond the fields it names, so it is deferred until set immediate.
      // grizzle describes each key's side term by term, a selected term as `<field> where <its
      // selection>`.
      // Bound: a startmark whose mark the fragment holds twice, none, or once; a lookup whose
      // lexicon the fragment holds or not.
      Effect.gen(function* ssmlFragment() {
        const client = yield* loginSession;
        const [trim = "", lookup = ""] = yield* Effect.forEach(
          [
            "foreign key SsmlAttribute(node where %, refers where %, value where %, tag FragmentValue.carriers = 1) to FragmentValue(fragment, kind, value, carriers)",
            "foreign key SsmlAttribute(fragment where %, refers where %, value where %) to FragmentValue(fragment, kind, value)",
          ],
          (pattern) => constraintDescribed(client, "ssml_attribute", pattern),
        );
        const startmark = ssmlAttribute(3, 3, {
          kind: "ssml:speak",
          name: "startmark",
          refers: "ssml:mark",
          value: "m",
        });
        const reference = ssmlAttribute(4, 3, {
          kind: "ssml:lookup",
          name: "ref",
          refers: "ssml:lexicon",
          value: "L",
        });
        for (const [label, stated, key, refused] of [
          [
            "a mark defined twice",
            [
              fragmentValue(3, "ssml:speak", "m", 1n),
              fragmentValue(3, "ssml:mark", "m", 2n),
              startmark,
            ],
            trim,
            true,
          ],
          ["no such mark", [fragmentValue(3, "ssml:speak", "m", 1n), startmark], trim, true],
          [
            "a mark defined once",
            [
              fragmentValue(3, "ssml:speak", "m", 1n),
              fragmentValue(3, "ssml:mark", "m", 1n),
              startmark,
            ],
            trim,
            false,
          ],
          [
            "a lexicon the fragment lacks",
            [fragmentValue(3, "ssml:lookup", "L", 1n), reference],
            lookup,
            true,
          ],
          [
            "a lexicon of the fragment",
            [
              fragmentValue(3, "ssml:lookup", "L", 1n),
              fragmentValue(3, "ssml:lexicon", "L", 1n),
              reference,
            ],
            lookup,
            false,
          ],
        ] as const) {
          assertVerdict(
            yield* judged(client, statedInserts(stated), [key]),
            key,
            refused,
            label,
            "23503",
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );

  it.effect(
    "refuses a scope whose fragment is not its nearest speak's, by E1_derived, and accepts a speak's own, a root's document and an inherited one",
    () =>
      // Oracle: PostgreSQL, `SsmlScope`'s `E1_derived` CHECK, against spec reading 3's fragment:
      // the nearest ssml:speak, itself included, or none (the document node) above a root that is
      // no speak; an inner element's is read from its parent by the deferred containment.
      // Bound: a speak in another fragment, a root in a fragment, and the three controls.
      Effect.gen(function* ssmlScopeCheck() {
        const client = yield* loginSession;
        for (const [label, stated, refused] of [
          [
            "a speak in another fragment",
            ssmlScope(3, { fragment: 2, kind: "ssml:speak", parent: 2 }),
            true,
          ],
          [
            "a root in a fragment",
            ssmlScope(1, { fragment: 3, kind: "qti-assessment-item", parent: 1 }),
            true,
          ],
          [
            "a speak's own fragment",
            ssmlScope(3, { fragment: 3, kind: "ssml:speak", parent: 2 }),
            false,
          ],
          [
            "a root's document",
            ssmlScope(2, { fragment: 1, kind: "qti-assessment-item", parent: 1 }),
            false,
          ],
          [
            "an inherited fragment",
            ssmlScope(4, { fragment: 3, kind: "ssml:mark", parent: 3 }),
            false,
          ],
        ] as const) {
          assertVerdict(
            yield* judged(client, statedInserts([stated])),
            checkConstraintOf(Qti, stated.relation.name, "E1_derived"),
            refused,
            label,
          );
        }
      }).pipe(Effect.scoped),
    leaseTestTimeoutMs,
  );
});
