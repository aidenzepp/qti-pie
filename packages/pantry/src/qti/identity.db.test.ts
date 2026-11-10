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
 * `DocumentId`'s and a `BodyXmlLang`'s document is a `Document` row (`Document.ids`,
 * `Document.langs`), stated beside them. A refused case's verdict is its SQLSTATE and
 * the constraint that states the law, and a control's is that the same constraint passes.
 *
 * The cases that need a whole stored document arrive with the importer (Q5.15), and probe P2
 * restates them over a package: a dangling IDREF token, refused at COMMIT by `foreign key
 * Idref(document, token) to IdrefTarget(document, id)` (23503), and a text's by `TextIdref`'s,
 * which this file holds to their fields by the catalogue, since a token's owner axis into
 * `Attribute` or `IdentityText` is not deferrable; and the copies between `Attribute`, `Node` and
 * each overlay, both ways.
 *
 * R26 is a rule over a query (`DescribedLang`, `#pantry/qti/queries.ts`), a deferred constraint
 * trigger on every table its query reads, so its cases are whole packages through the importer,
 * which names a refusal by its rule; and `DocumentLang.value`, the compared form R26 reads, is a
 * field PostgreSQL generates from the form, read back in a direct writer's case.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, it, layer } from "@effect/vitest";
import { Effect, Layer, Option } from "effect";
import type { Client } from "pg";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { Flag } from "#pantry/grammar/install.ts";
import { importPackage } from "#pantry/import/package.ts";
import { governorOf } from "#pantry/import/fold.ts";
import { Document } from "#pantry/qti/chardata.ts";
import {
  BodyXmlLang,
  DocumentId,
  DocumentLang,
  FragmentValue,
  IdBinding,
  IdentityText,
  LabelUse,
  LomLanguage,
  ResourceLomLanguageSet,
  SsmlAttribute,
  SsmlScope,
} from "#pantry/qti/identity.ts";
import { Qti } from "#pantry/qti/own.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  assertVerdict,
  authorViews,
  constraintDescribed,
  judged,
  judgedCase,
  loginSession,
  qtiSchema,
  rowsOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { writePackage } from "#pantry/test/gen/every-relation.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

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
 * @param pieces.admitted - Whether the grammar admits its element where it stands; by default it
 *   does.
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
    admitted = true,
    after = "",
    before = "",
    id,
    lexical = `${before}${id}${after}`,
    owner = node,
  }: {
    readonly admitted?: boolean;
    readonly after?: string;
    readonly before?: string;
    readonly id: string;
    readonly lexical?: string;
    readonly owner?: number;
  },
): Stated => ({
  fact: {
    admitted,
    after,
    before,
    document,
    id,
    lexical,
    node: uuidOf(node),
    owner: uuidOf(owner),
  },
  relation: DocumentId,
});

/**
 * An `IdBinding` fact: an id of a document bound to an element, carried by the IDs the case states
 * under it, and admitted as they are.
 *
 * @param document - The document.
 * @param id - The id.
 * @param owner - The number of the element it is bound to.
 * @param admitted - Whether the grammar admits that element where it stands; by default it does.
 * @returns The fact.
 */
const binding = (document: string, id: string, owner: number, admitted = true): Stated => ({
  fact: { admitted, document, id, owner: uuidOf(owner) },
  relation: IdBinding,
});

/**
 * The package every case's documents are entries of: no stored row holds it.
 */
const casePackage = uuidOf(255);

/**
 * A `Document` fact of an item document, the owner of its IDs' and its `xml:lang` carriers'
 * families, each count the members the case states under it: a counted family's owner axis is not
 * deferrable, so a `DocumentId` or `BodyXmlLang` row is judged against its document's row at its
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
 * The family of one projection and its members: `DocumentLang` over `BodyXmlLang`, and
 * `ResourceLomLanguageSet` over `LomLanguage`. `count` is the projection's family. `beside` states
 * the other rows a case's owner and members are judged against at their INSERT, each owner axis
 * and a foreign key whose target holds no field beyond the ones it names being immediate: the
 * document's `Document` row, the owner of its `xml:lang` carriers too (`Document.langs`).
 */
interface Projection {
  readonly beside: readonly Stated[];
  readonly count: string;
  readonly member: (node: number, owner: string, lang: string) => Stated;
  readonly memberTable: string;
  readonly owner: (owner: string, lang: string) => Stated;
}

/**
 * The two projections, each over its owner field: a document (its members the `BodyXmlLang` rows,
 * the `xml:lang` outside every catalog), or a LOM general category. A LOM
 * language's tag is its value case-folded, so a lower-case value is its own tag. An owner's
 * carriers are the members a case states under it.
 */
const projections: readonly Projection[] = [
  {
    beside: [documentOf(first)],
    count: "DocumentLang.carriers",
    member: (node, document, lang) => ({
      fact: { document, lang, node: uuidOf(node) },
      relation: BodyXmlLang,
    }),
    memberTable: "body_xml_lang",
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
 * @param read - The attribute: its element kind, its name, the kind it names, its value and, where it
 *   differs, its lexical form.
 * @param read.kind - The element kind.
 * @param read.lexical - The lexical form; the value where none is given.
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
    readonly lexical?: string;
    readonly name: string;
    readonly refers: string;
    readonly value: string;
  },
): Stated => ({
  fact: {
    fragment: uuidOf(fragment),
    kind: read.kind,
    lexical: read.lexical ?? read.value,
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
    "refuses one id bound to two admitted elements of one document by DocumentId key, and accepts one id bound twice to one element, one id in two documents and one id an unadmitted element also carries",
    () =>
      // Oracle: PostgreSQL, the UNIQUE of `key(on(admittedBindings, "document", "id"))`, against
      // XML Schema 1.0 Part 1 §3.15.5 and cvc-id clause 2 (reading 101): an id's [binding] is the
      // set of elements that purport it, an attribute's element or an ID-typed text's parent, and no
      // binding has two members; so two ID-typed children of one parent with one value, ` a ` and
      // `a`, are one binding, and so are one id in each of two documents. An element the grammar
      // does not admit where it stands binds no ID (gr-4, decision 452: the key is over admitted
      // bindings, and "N5 admitted" alone refuses that element), so its id beside an admitted
      // element's is no second member.
      // Bound: one id on two admitted elements of one document; one id on an admitted and an
      // unadmitted element, and on two unadmitted ones; one id twice under one parent, as written
      // and padded; one id in two documents.
      Effect.gen(function* documentKey() {
        const client = yield* loginSession;
        const key = yield* constraintDescribed(
          client,
          "id_binding",
          "key IdBinding(document where %, id where %)",
        );
        // Each element's number and whether it is admitted.
        const twoElements = [
          [
            "one id on two admitted elements",
            [
              [3, true],
              [4, true],
            ],
          ],
          [
            "one id on an admitted and an unadmitted element",
            [
              [3, true],
              [4, false],
            ],
          ],
          [
            "one id on two unadmitted elements",
            [
              [3, false],
              [4, false],
            ],
          ],
        ] as const;

        for (const [label, owners] of twoElements) {
          assertVerdict(
            yield* judged(
              client,
              // Each binding is carried once, by an ID the case does not write.
              statedInserts(
                owners.map(([owner, admitted]): Stated => ({
                  fact: {
                    admitted,
                    carriers: 1n,
                    document: first,
                    id: "a",
                    owner: uuidOf(owner),
                  },
                  relation: IdBinding,
                })),
              ),
            ),
            key,
            label === "one id on two admitted elements",
            label,
            "23505",
          );
        }
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
    "generates an xml:lang form's compared value, the form collapsed and case-folded",
    () =>
      // Oracle: PostgreSQL, `DocumentLang`'s generated `value`, `lowerAscii(collapse(lang))` cast
      // into its key text, read back before the rollback, against XML Schema 1.0 Part 2 §3.3.3, an
      // xs:language's value is its form collapsed, and RFC 5646 §2.1.1, tags compared without
      // regard to case. Each case states the form beside its document, so its own key holds at
      // its INSERT.
      // Bound: a bare tag, outer whitespace, upper case, a form that is no tag, and the empty form.
      Effect.gen(function* comparedValues() {
        const client = yield* loginSession;
        for (const [lang, value] of [
          ["en", "en"],
          [" fr\n", "fr"],
          ["EN-GB", "en-gb"],
          ["en_GB", "en_gb"],
          ["", ""],
        ] as const) {
          const { read, refused } = yield* judgedCase(client, {
            inserts: statedInserts([
              documentOf(first),
              { fact: { carriers: 1n, document: first, lang }, relation: DocumentLang },
            ]),
            reads: [
              {
                text: `SELECT value FROM ${authorViews}.document_lang WHERE document = $1`,
                values: [first],
              },
            ],
          });

          assert.isTrue(Option.isNone(refused), JSON.stringify(lang));
          assert.deepStrictEqual(read, [[{ value }]], JSON.stringify(lang));
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
    "refuses an attribute whose value is not its lexical form collapsed, by E1_derived, and accepts one that is",
    () =>
      // Oracle: PostgreSQL, `SsmlAttribute`'s `E1_derived` CHECK (`s.value = collapse(s.lexical)`),
      // against SSML 1.1 §3.3.2 (a mark's name is an `xs:token`, whose whiteSpace is `collapse`)
      // under spec reading 3.
      // The fragment holds its mark once under each value, so the trim's foreign key is met and the
      // check is the one verdict left.
      // Bound: an inner run of two spaces and a leading space left in the value, and a lexical form
      // whose tab and outer spaces collapse away.
      Effect.gen(function* ssmlAttributeCollapse() {
        const client = yield* loginSession;
        for (const [label, lexical, value, refused] of [
          ["an inner run of spaces left in the value", "a  b", "a  b", true],
          ["a leading space left in the value", " a b", " a b", true],
          ["a tab and outer spaces collapsed away", " a\t b ", "a b", false],
        ] as const) {
          assertVerdict(
            yield* judged(
              client,
              statedInserts([
                fragmentValue(3, "ssml:speak", value, 1n),
                fragmentValue(3, "ssml:mark", value, 1n),
                ssmlAttribute(3, 3, {
                  kind: "ssml:speak",
                  lexical,
                  name: "startmark",
                  refers: "ssml:mark",
                  value,
                }),
              ]),
            ),
            checkConstraintOf(Qti, SsmlAttribute.name, "E1_derived"),
            refused,
            label,
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

/**
 * A package of one item resource whose href names the item, unless `named` is false, and whose
 * record's one general category lists `lomLang`, and the item whose root writes `xmlLang`.
 *
 * @param xmlLang - The item root's `xml:lang`, as written.
 * @param lomLang - The category's `lom:language`, as written.
 * @param named - Whether the resource's href names the item.
 * @returns The package's entries.
 */
const r26PackageOf = (xmlLang: string, lomLang: string, named: boolean) => {
  const text = new TextEncoder();
  const href = named ? ' href="item.xml"' : "";

  return new Map([
    [
      "imsmanifest.xml",
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?>\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0"${href}><metadata><imsmd:lom><imsmd:general><imsmd:language>${lomLang}</imsmd:language></imsmd:general></imsmd:lom></metadata><file href="item.xml"/></resource></resources></manifest>\n`,
      ),
    ],
    [
      "item.xml",
      text.encode(
        `<?xml version="1.0" encoding="UTF-8"?>\n<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item" time-dependent="false" xml:lang="${xmlLang}"><qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>\n`,
      ),
    ],
  ]);
};

describe.skipIf(!hasLease)(
  "qti/identity.db.test.ts, R26 through the importer",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("document-lang, judged by PostgreSQL's rule over a query", (r26) => {
      r26.effect(
        "refuses a package whose item states a language its record's category does not list, by document-lang, and accepts one listed in another case, an unstated form and an item no record names",
        () =>
          // Oracle: the specification as a checker, QTI 3.0 Metadata §2.7.1.3 ("There must be one
          // value for each of the languages referred to by the language attributes"), compared as
          // tags without regard to case (RFC 5646 §2.1.1), the xml:lang collapsed (XML Schema 1.0
          // Part 2 §3.3.3) and a LOM language as written (spec reading 134); an empty xml:lang
          // states none (XML 1.0 §2.12), even beside an empty lom:language; and an item no record
          // names is read against no category (reading 93). PostgreSQL judges it by
          // `DescribedLang` contained in `ResourceLomLanguageSet`, a deferred trigger, and the
          // importer names the refusal's rule.
          // Bound: four xml:lang forms by six LOM languages (24, each named), the empty form beside
          // an empty LOM language, and an unlisted form of an item no record names.
          Effect.gen(function* documentLangRule() {
            const directory = yield* scratchDirectory("identity-r26-");
            const cases = [
              ...["en", " en\t", "EN", "en-GB"].flatMap((xmlLang) =>
                ["en", " en ", "EN", "en-gb", "en\n", "fr"].map((lomLang) => ({
                  lomLang,
                  named: true,
                  refused: lowerAscii(collapsed(xmlLang)) !== lowerAscii(lomLang),
                  xmlLang,
                })),
              ),
              { lomLang: "", named: true, refused: false, xmlLang: "" },
              { lomLang: "fr", named: false, refused: false, xmlLang: "en" },
            ];
            for (const [at, { lomLang, named, refused, xmlLang }] of cases.entries()) {
              const label = `xml:lang ${JSON.stringify(xmlLang)} beside LOM ${JSON.stringify(lomLang)}${named ? "" : ", no record naming the item"}`;
              const dir = `${directory}/c${String(at)}`;
              yield* writePackage(r26PackageOf(xmlLang, lomLang, named), dir);

              const outcome = yield* Effect.result(importPackage(dir));
              const rules =
                outcome._tag === "Failure" && outcome.failure instanceof ImportRefused
                  ? outcome.failure.rules
                  : [];

              assert.strictEqual(
                rules.includes("document-lang"),
                refused,
                `${label}: ${outcome._tag === "Failure" ? outcome.failure.message : "accepted"}`,
              );
            }
          }).pipe(Effect.scoped),
        leaseTestTimeoutMs,
      );
    });
  },
);
