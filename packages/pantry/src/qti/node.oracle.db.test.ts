/**
 * `Node`'s laws judged by PostgreSQL (Q5.03), written to run at N1 on the lease (and restated in
 * the network seat's probe P1), never by a hand.
 *
 * Every case states a document's `Node` rows as facts, and the one direct writer
 * (`#pantry/test/direct-sql.ts`, README, "Direct SQL access") writes them as one INSERT: the author
 * login, `SET ROLE` to the author role, SERIALIZABLE, each column the host fills a parameter, and
 * the hidden ones (‹n›, ‹ps›, the hidden fold accumulators) derived from `Qti`'s tree and fold
 * statements and found by the COMMENT grizzle puts on each. The facts come from shred and the
 * host's fold (`#pantry/model/folds.ts`), the string value's running text, which the folds leave
 * out, computed here from `install.ts`'s rows, so a lawful document is the rows grizzle's filler
 * writes for it.
 *
 * A `Node` tree commits only with its package (the document node's `Document` row, the character
 * arms, the attribute family): those laws are deferred to COMMIT and belong to other slices, so
 * every case is judged at its INSERT's end and rolled back. A law that is itself deferred, the
 * tree's last axis, is set immediate for the case once the rows are in (`SET CONSTRAINTS "qti".…
 * IMMEDIATE`, named with its schema). A lawful document raises nothing; a corruption raises the
 * SQLSTATE and a constraint that maps to its law (C22: membership, since one row may break several
 * laws whose constraints PostgreSQL checks in an order it does not promise).
 *
 * The census (C12) reads the catalog: Node's foreign keys into Node are exactly the tree's three
 * axes, so N3, N5's predecessor copy and N7's last slot merged; the rest are, target for target,
 * the keys `Qti`'s statements put on Node into another relation.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Option, Order } from "effect";
import type { Client, DatabaseError } from "pg";
import { describe } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import {
  AttributeSlot,
  Banned,
  ContentModelOf,
  Flag,
  Follow,
  GoverningOf,
  grammar,
  nonElementKinds,
  Position,
  RootOfType,
  SharedModelOf,
  Symbol as ContentSymbol,
  TextDomain,
} from "#pantry/grammar/install.ts";
import { ownContext } from "#pantry/import/fold.ts";
import { rowsOf as identityRowsOf } from "#pantry/import/overlays/identity.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { LabelUse } from "#pantry/qti/identity.ts";
import { copiedTextKinds, Node, universalDomains, vocabularyTermKinds } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/test/qti.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  accumulatorOf,
  assertVerdict,
  authorRole,
  constraintDescribed,
  judged,
  loginSession,
  pinned,
  qtiSchema,
  rowsOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawsOf, nodeLawNames } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { keysOf } from "#pantry/test/statements.ts";

/**
 * The accepted corpus packages (`verdicts/qti-examples-0a92fbb.tsv`), by their zip's name.
 */
const acceptedPackages: ReadonlySet<string> = new Set(["sharedMedia", "simple", "svg"]);

/**
 * The QTI 3 ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The MathML namespace.
 */
const mathml = "http://www.w3.org/1998/Math/MathML";

/**
 * UTF-8's encoding label, as crust's reader reports it and `Document` stores it.
 */
// oxlint-disable-next-line unicorn/text-encoding-identifier-case -- the label as a document states it
const utf8Label = "UTF-8";

/**
 * The host law model, the oracle's tables over the grammar.
 */
const laws = lawsOf(grammar);

/**
 * Write an item in 3.0.1 with one response declaration, a body and what follows it.
 *
 * @param body - The item body's content.
 * @param after - What follows the item body.
 * @returns The item's text.
 */
const itemOf = (body: string, after = ""): string =>
  `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false" adaptive="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body>${body}</qti-item-body>${after}</qti-assessment-item>`;

/**
 * A lawful item: every law over its node rows holds (the oracle's `documentBreaches` finds none).
 */
const lawfulItem = itemOf(`<p>Text <b>bold</b></p>`);

/**
 * A lawful item with a shared kind: `m:ci` names both of `m:mfrac`'s positions, so the state
 * decides.
 */
const mathItem = itemOf(
  `<p><m:math xmlns:m="${mathml}"><m:mfrac><m:ci>a</m:ci><m:ci>b</m:ci></m:mfrac></m:math></p>`,
);

/**
 * XML Schema's instance namespace, which `xsi:type` is in.
 */
const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * XML Schema's namespace, its built-in types'.
 */
const xsNamespace = "http://www.w3.org/2001/XMLSchema";

/**
 * Write a test in 3.0.1 whose one section holds the given content before its item ref, with a
 * foreign namespace bound to `f` and XML Schema's two to `xsi` and `xs`.
 *
 * @param section - The section's content before its item ref.
 * @returns The test's text.
 */
const testOf = (section: string): string =>
  `<qti-assessment-test xmlns="${asi}" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="${xsNamespace}" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true">${section}<qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * The foreign element laws over `Node`'s rows' cases (C4, C41): each a lawful document, and a
 * corruption of it that breaks the one law, as a second document or as an edit of its one foreign
 * element of a kind, each checked against the host oracle before PostgreSQL judges it. "Strictly
 * held" is over `OpenElementName`, so `chardata.db.test.ts` states its cases.
 */
const foreignCases: readonly {
  readonly corrupt:
    | { readonly xml: string }
    | {
        readonly fields: Partial<Pick<FoldedNode<Composed>, "prefix">>;
        readonly kind: string;
      };
  readonly law: LawName;
  readonly lawful: string;
  readonly name: string;
}[] = [
  {
    corrupt: {
      xml: testOf(
        `<qti-selection select="1"><f:x xsi:type="xs:string">a<f:y/></f:x></qti-selection>`,
      ),
    },
    law: "Foreign simple content",
    lawful: testOf(`<qti-selection select="1"><f:x xsi:type="xs:string">a</f:x></qti-selection>`),
    name: "a foreign element governed by xs:string with an element child (C41)",
  },
  {
    corrupt: { fields: { prefix: "p" }, kind: "no-namespace-element" },
    law: "Foreign element class",
    lawful: testOf(`<qti-ordering shuffle="true"><foo xmlns=""/><qti-variable/></qti-ordering>`),
    name: "an element in no namespace in qti-ordering written with a prefix (C4, reading 61)",
  },
];

/**
 * The items each breaking one law over its node rows, its retired rule's fixture restated (§2.2:
 * `ordering`, `union-count` and `body-empty` become Follow and Last; the counted and barred laws;
 * an ancestry ban and a need), each checked against the host oracle before PostgreSQL judges it.
 * `beside` names a node law the item also breaks over rows the case does not write: a gap outside
 * a gap match interaction breaks N8's choice clause, every choice in an interaction, its nearest
 * (information model §5.55, reading 38), over its `Choice` row, beside N6's need over its nodes.
 */
const lawCases: readonly {
  readonly beside?: readonly LawName[];
  readonly law: LawName;
  readonly name: string;
  readonly xml: string;
}[] = [
  {
    law: "N5 Follow",
    name: "an outcome declaration after the item body (ordering)",
    xml: itemOf(
      `<p>x</p>`,
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
    ),
  },
  {
    law: "N7 Last",
    name: "a choice interaction without a choice (union-count)",
    xml: itemOf(`<qti-choice-interaction response-identifier="RESPONSE"/>`),
  },
  { law: "N7 Last", name: "an item body of whitespace alone (body-empty)", xml: itemOf(" ") },
  {
    law: "N7 Counted",
    name: "a match interaction with one simple match set",
    xml: itemOf(
      `<qti-match-interaction response-identifier="RESPONSE" max-associations="1"><qti-simple-match-set><qti-simple-associable-choice identifier="M" match-max="1">M</qti-simple-associable-choice></qti-simple-match-set></qti-match-interaction>`,
    ),
  },
  {
    law: "N7 barred by",
    name: "a colgroup with a span and a col",
    xml: itemOf(`<table><colgroup span="2"><col/></colgroup><tr><td>x</td></tr></table>`),
  },
  {
    law: "N6 ancestry",
    name: "a text entry inside a hottext interaction (a ban)",
    xml: itemOf(
      `<qti-hottext-interaction response-identifier="RESPONSE"><p>Type <qti-text-entry-interaction response-identifier="RESPONSE"/></p></qti-hottext-interaction>`,
    ),
  },
  {
    beside: ["N8 nearest"],
    law: "N6 ancestry",
    name: "a gap outside a gap match interaction (a need)",
    xml: itemOf(`<p>A <qti-gap identifier="G"/></p>`),
  },
];

/**
 * A constraint of `Node`'s table as the catalog holds it.
 */
interface Constraint {
  readonly columns: readonly string[];
  readonly comment: string;
  readonly definition: string;
  readonly kind: "c" | "f" | "p" | "u" | "t" | "x" | "n";
  readonly name: string;
  readonly target: string;
}

/**
 * The relation a foreign key of `Node`'s table targets, by its declared name, as grizzle's comment
 * on the constraint states it: `foreign key Node(…) to <Relation>(…)`.
 *
 * @param constraint - The foreign key.
 * @returns The target relation's name.
 * @throws {Error} When the comment names no target relation.
 */
const targetRelationOf = (constraint: Constraint): string => {
  const named = [...constraint.comment.matchAll(/\) to (?<target>[A-Z][\dA-Za-z]*)\(/gu)].at(-1)
    ?.groups?.["target"];
  if (named === undefined) {
    throw new Error(
      `The comment on ${constraint.name} names no target relation, so the census can't place the foreign key: "${constraint.comment}". Read the comment grizzle now writes on a foreign key and match its target.`,
    );
  }

  return named;
};

/**
 * Fold names, each one key's, into the count of keys per name, by name.
 *
 * @param names - The name of each key.
 * @returns Each name and how many keys hold it.
 */
const countPerName = (names: readonly string[]): readonly (readonly [string, number])[] =>
  [...Map.groupBy(names, (name) => name)]
    .map(([name, held]) => [name, held.length] as const)
    .toSorted(([left], [right]) => Order.String(left, right));

/**
 * The foreign keys a schema's statements put on `Node`'s table into another stored relation, as
 * the count per target relation: one for each containment from `Node` (or a selection of it), one
 * for the `Node` half of each mirrors, and one for the proof key into its last member of each
 * family `Node` owns.
 *
 * @param statements - The schema's statements.
 * @returns Each target relation and how many of Node's keys it takes.
 */
const outOfNode = (statements: readonly unknown[]) => {
  const keys = keysOf(statements);

  return countPerName([
    ...keys.laws.filter(({ from, to }) => from === "Node" && to !== "Node").map(({ to }) => to),
    ...keys.axes.filter(({ from, to }) => to === "Node" && from !== "Node").map(({ from }) => from),
  ]);
};

/**
 * The role a constraint of `Node` plays, read off its name (a check this slice names) or the
 * identity its COMMENT spells (grizzle's hashed natives), `other` for another slice's.
 *
 * @param constraint - The constraint.
 * @returns Its role.
 */
const roleOf = (constraint: Constraint): string => {
  const named = new Map([
    ["e_1_derived", "E1 derived"],
    ["foreign_element_class", "Foreign element class"],
    ["foreign_simple_content", "Foreign simple content"],
    ["n_1_sentinel", "N1 sentinel"],
    ["n_5_admitted", "N5 admitted"],
    ["n_5_follow", "N5 Follow"],
    ["n_6_ancestry", "N6 ancestry"],
    ["n_7_barred_by", "N7 barred by"],
    ["n_7_counted", "N7 Counted"],
    ["n_7_last", "N7 Last"],
    ["n_8_nearest", "N8 nearest"],
  ]);
  const { comment } = constraint;
  const held = named.get(constraint.name);
  if (held !== undefined) {
    return held;
  }

  const rules: readonly (readonly [string, boolean])[] = [
    ["identity", comment === "primary key of Node"],
    ["tree check", comment.startsWith("check of Node for law tree Node(parent, at)")],
    ["document order", comment === "key Node(document, start)"],
    ["family key", comment.startsWith("key Node(parent where") && constraint.columns.length === 2],
    [
      "member superkey",
      comment.startsWith("key Node(parent where") && constraint.columns.length > 2,
    ],
    ["owner superkey", comment.startsWith("key Node(id, children,")],
    [
      "owner axis",
      comment.startsWith("foreign key Node(parent, the owner's count of the family Node.children"),
    ],
    ["predecessor axis", comment.startsWith("foreign key Node(parent where")],
    ["last axis", comment.startsWith("foreign key Node(id, pred(children)")],
    [
      "elements fold",
      comment.startsWith(
        "check of Node for law count fold over fin(Node, children) of Node(parent, elementsWas, elements)",
      ),
    ],
    [
      "string value fold",
      comment.startsWith("check of Node for law concat fold over fin(Node, children)"),
    ],
    [
      "counted fold",
      comment.startsWith(
        "check of Node for law count fold over fin(Node, children) of Node(parent) ",
      ) && constraint.definition.includes("counted_children"),
    ],
    [
      "barred fold",
      comment.startsWith(
        "check of Node for law count fold over fin(Node, children) of Node(parent) ",
      ) && constraint.definition.includes("barred_children"),
    ],
    ["was pin", comment.startsWith("check of Node for law Node(parent, pred(at), was)")],
    [
      "last state pin",
      comment.startsWith("check of Node for law Node(id, pred(children), lastState)"),
    ],
    ["xsi type", comment.startsWith("check of Node for law Node(version, kind, governs)")],
  ];

  return rules.find(([, holds]) => holds)?.[0] ?? "other";
};

/**
 * The roles of the tree's natives: each discharges the tree statement (T0 to T6, the family's key
 * and mirrors, the root pin), so a refusal by any of them is the tree's.
 */
const treeRoles: ReadonlySet<string> = new Set([
  "identity",
  "tree check",
  "document order",
  "family key",
  "member superkey",
  "owner superkey",
  "owner axis",
  "predecessor axis",
  "last axis",
]);

/**
 * Read `Node`'s constraints from the catalog.
 *
 * @param client - The session.
 * @returns Its constraints.
 */
const constraintsOf = (client: Client) =>
  rowsOf<{
    readonly columns: readonly string[];
    readonly comment: string | null;
    readonly definition: string;
    readonly kind: Constraint["kind"];
    readonly name: string;
    readonly target: string | null;
  }>(
    client,
    `SELECT c.conname AS name, c.contype AS kind, pg_catalog.pg_get_constraintdef(c.oid) AS definition,
            pg_catalog.obj_description(c.oid, 'pg_constraint') AS comment,
            CASE WHEN c.confrelid = 0 THEN NULL ELSE c.confrelid::regclass::text END AS target,
            ARRAY(SELECT a.attname::text FROM unnest(c.conkey) AS k(n)
                    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.n) AS columns
       FROM pg_catalog.pg_constraint c
      WHERE c.conrelid = 'qti.node'::regclass`,
  ).pipe(
    Effect.map((constraints) =>
      constraints.map((constraint): Constraint => ({
        ...constraint,
        comment: constraint.comment ?? "",
        target: constraint.target ?? "",
      })),
    ),
  );

/**
 * The names of `Node`'s constraints of one role, as a case sets a deferred one immediate.
 *
 * @param constraints - Node's constraints.
 * @param role - The role.
 * @returns The names.
 */
const namesOf = (constraints: readonly Constraint[], role: string): readonly string[] =>
  constraints.filter((constraint) => roleOf(constraint) === role).map(({ name }) => name);

/**
 * `GoverningOf`'s rows by `<version> <kind> <governs>`.
 */
const governorAt = new Map(
  GoverningOf.rows.map((row) => [`${row.version} ${row.kind} ${row.governs}`, row.governor]),
);

/**
 * `TextDomain`'s rows by `<version> <governor>`.
 */
const textDomainAt = new Map(
  TextDomain.rows.map((row) => [`${row.version} ${row.governor}`, row.domain]),
);

/**
 * The value domains no TextDomain check reads, whose elements' text the string value's fold skips.
 */
const universal: ReadonlySet<string> = new Set(universalDomains);

/**
 * The kinds whose text an overlay copies, whose children the string value's fold steps too.
 */
const copiedKinds: ReadonlySet<string> = new Set(copiedTextKinds);

/**
 * Decide on the host what `copiedTitleText` and `copiedVocabularyText` of `node.ts` state of a
 * member, from its parent's kind and its grandparent's: whether an overlay copies its parent's
 * text by the two kinds together.
 *
 * @param parentKind - The member's parent's kind.
 * @param parentParentKind - The member's grandparent's kind, `document` for a child of the root
 *   element.
 * @returns Whether the member's characters are copied into its parent's string value.
 */
const copiedUnder = (parentKind: string, parentParentKind: string): boolean =>
  (parentKind === "lom:string" && parentParentKind === "lom:title") ||
  (vocabularyTermKinds.some((kind) => kind === parentKind) &&
    parentParentKind === "lom:learningResourceType");

/**
 * Decide whether a member's characters make its parent's string value, as `node.ts`'s fold steps
 * it: its parent's text is checked (its domain is no universal one), its parent is one of
 * `copiedTextKinds`, or an overlay copies its parent's text by its parent's and grandparent's kinds
 * together, a title string's or a vocabulary term's ({@link copiedUnder}).
 *
 * @param member - The member's folded row.
 * @param parent - Its parent's folded row.
 * @returns Whether the fold steps it.
 */
const inStringValue = (
  member: FoldedNode<Composed>,
  parent: FoldedNode<Composed> | undefined,
): boolean => {
  const governor = governorAt.get(
    `${member.version} ${member.parentKind} ${parent?.governs ?? ""}`,
  );
  const domain = textDomainAt.get(`${member.version} ${governor ?? ""}`);

  return (
    (domain !== undefined && !universal.has(domain)) ||
    copiedKinds.has(member.parentKind) ||
    copiedUnder(member.parentKind, parent?.parentKind ?? "document")
  );
};

/**
 * The kinds that are no element, as a set.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

/**
 * The resource type of a folded document: the one `RootOfType` names for its root element's kind,
 * `none` for a manifest, which no resource lists.
 *
 * @param rows - The document's folded rows.
 * @returns The type.
 */
const documentTypeOf = (rows: FoldedRows<Composed>) => {
  // The nodes are in pre-order, so the first element below the document node is its root.
  const root = rows.nodes.find(({ kind, start }) => start > 0n && !nonElements.has(kind))?.kind;
  if (root === "cp:manifest") {
    return "none";
  }

  const types = RootOfType.rows.filter((row) => row.root === root).map(({ type }) => type);
  assert.lengthOf(types, 1, `${root ?? "no root"}: the one resource type RootOfType names for it`);

  return types[0] ?? "none";
};

/**
 * State a document's `Node` facts, every field the host writes, in pre-order: the fields from the
 * host's fold, and the string value's running text as `node.ts`'s fold steps it. The writer derives
 * the rest from `Qti`'s statements: ‹n› and ‹ps› from the parent, and the counted and barred folds'
 * accumulators and ends from the members their selections hold, and each member's documentType from
 * its root's, which the root states (T3). `parentParentKind` is accumulated,
 * so the host never writes it: the fact states it as grizzle's owner-axis copy does, the parent's
 * `parentKind`, the root's own, and steps the children whose text an overlay copies by two kinds
 * (`copiedUnder`) as the fold does.
 *
 * @param rows - The document's folded rows.
 * @returns Each node's fact, in document order.
 */
const nodeFactsOf = (rows: FoldedRows<Composed>): Stated[] => {
  const byId = new Map(rows.nodes.map((node) => [node.id, node]));
  const chars = new Map(
    [...rows.texts, ...rows.whitespace].map(({ node, value }) => [node, value]),
  );
  for (const { name, node } of rows.entityRefs) {
    chars.set(node, `&${name};`);
  }

  const familyOf = new Map<FoldedNode<Composed>["parent"], FoldedNode<Composed>[]>();
  for (const node of rows.nodes.filter(({ start }) => start > 0n)) {
    familyOf.set(node.parent, [...(familyOf.get(node.parent) ?? []), node]);
  }

  const running = new Map<string, { charsAfter: string; charsWas: string }>();
  for (const [parentId, members] of familyOf) {
    const parent = byId.get(parentId);
    members.sort((left, right) => Number(left.at - right.at));
    let joined = "";
    for (const member of members) {
      const checked = inStringValue(member, parent);
      const charsWas = joined;
      if (checked) {
        joined += chars.get(member.id) ?? "";
      }

      running.set(member.id, { charsAfter: joined, charsWas });
    }
  }

  const facts = rows.nodes.map((node): Stated => {
    const parent = node.start === 0n ? node : (byId.get(node.parent) ?? node);
    const own = running.get(node.id) ?? { charsAfter: "", charsWas: "" };
    const last = Arr.last(familyOf.get(node.id) ?? []).pipe(
      Option.flatMap(({ id }) => Option.fromNullishOr(running.get(id))),
    );

    return {
      fact: {
        ancestry: bitsText(Flag, node.derived.ancestry),
        at: node.at,
        attributes: node.attributes,
        attrs: bitsText(AttributeSlot, [...node.attrs].map(String)),
        chars: chars.get(node.id) ?? "",
        charsAfter: own.charsAfter,
        charsWas: own.charsWas,
        children: node.children,
        document: node.document,
        elementChildren: node.elementChildren,
        elements: node.derived.elements,
        elementsWas: node.elementsWas,
        end: node.end,
        first: node.first,
        governs: node.governs,
        id: node.id,
        kind: node.kind,
        last: node.last,
        lastState: String(node.childState),
        namespaces: node.namespaces,
        nearest: node.nearest,
        nearestKind: node.nearestKind,
        parent: node.parent,
        parentAncestry: bitsText(Flag, node.parentAncestry),
        parentGoverns: parent.governs,
        parentKind: node.parentKind,
        parentNearest: node.parentNearest,
        parentNearestKind: node.parentNearestKind,
        parentParentKind: parent.parentKind,
        prefix: node.prefix,
        start: node.start,
        state: String(node.derived.state),
        stringValue: Option.match(last, {
          onNone: () => "",
          onSome: ({ charsAfter }) => charsAfter,
        }),
        version: node.version,
        was: String(node.was),
      },
      relation: Node,
    };
  });
  const type = documentTypeOf(rows);

  return facts.map((stated) =>
    stated.fact["start"] === 0n
      ? { ...stated, fact: { ...stated.fact, documentType: type } }
      : stated,
  );
};

/**
 * Read the indexes of `Node`'s table whose first two key columns are T1's (document, start): each
 * reads a document's nodes in document order, T1's UNIQUE among them.
 *
 * @param client - The session.
 * @returns The indexes' names.
 */
const documentOrderIndexes = (client: Client) =>
  rowsOf<{ readonly name: string }>(
    client,
    `SELECT c.relname AS name
       FROM pg_catalog.pg_index i
       JOIN pg_catalog.pg_class c ON c.oid = i.indexrelid
       JOIN pg_catalog.pg_attribute d ON d.attrelid = i.indrelid AND d.attnum = i.indkey[0]
       JOIN pg_catalog.pg_attribute s ON s.attrelid = i.indrelid AND s.attnum = i.indkey[1]
      WHERE i.indrelid = '${qtiSchema}.node'::regclass AND i.indnkeyatts >= 2
        AND d.attname = 'document' AND s.attname = 'start'`,
  ).pipe(Effect.map((rows) => rows.map(({ name }) => name)));

/**
 * The namespace of the content package's elements, which a manifest's `schemaversion` is in.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * Find the schema version a package declares, as the importer finds it: the text of the first
 * `metadata/schemaversion` under its content package `manifest` root.
 *
 * @param files - The package's entries.
 * @returns The version as written, or none when the manifest does not read or declares none.
 */
const declaredVersionOf = (files: readonly PackageFile[]) =>
  Effect.gen(function* declaredVersion() {
    const manifest = files.find(({ kind }) => kind === "manifest");
    const read =
      manifest === undefined ? Option.none() : yield* Effect.option(readXml(manifest.bytes));

    return read.pipe(
      Option.flatMap(({ root }) => {
        const metadata = root.children.find(
          (child) => child.kind === "element" && child.local === "metadata",
        );
        const version =
          metadata?.kind === "element"
            ? metadata.children.find(
                (child) => child.kind === "element" && child.local === "schemaversion",
              )
            : undefined;

        return root.namespace === cpNamespace && version?.kind === "element"
          ? Option.some(
              version.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
            )
          : Option.none();
      }),
    );
  });

/**
 * Read a document's text as shred and the host's fold read it, in 3.0.1.
 *
 * @param xml - The document.
 * @returns Its folded rows.
 */
const foldedOf = (xml: string) =>
  Effect.gen(function* folded() {
    const document = yield* Effect.orDie(readXml(new TextEncoder().encode(xml)));
    const tree = yield* Effect.orDie(shred(document, "3.0.1", shredGrammarOf(grammar)));

    return yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));
  });

/**
 * Read a document's text as shred and the host's fold read it, in a schema version, with the tree
 * shred gives, which the overlays' builders read.
 *
 * @param xml - The document.
 * @param version - Its schema version, as its manifest would declare it.
 * @returns Its tree and its folded rows.
 */
const foldedAt = (xml: string, version: (typeof schemaVersions)[number]) =>
  Effect.gen(function* folded() {
    const document = yield* Effect.orDie(readXml(new TextEncoder().encode(xml)));
    const tree = yield* Effect.orDie(shred(document, version, shredGrammarOf(grammar)));

    return {
      rows: yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar)))),
      tree,
    };
  });

/**
 * State a document's `Attribute` facts: the fold's fields, the slot the fold steps (`attrs` without
 * the slots before it), and the counts of the families an attribute owns whose members these cases
 * write none of, its entity references and its open name, from the document's rows; no witness of
 * these cases holds an IDREF attribute, so each has no token, the count the writer derives, and the
 * empty concatenation.
 *
 * @param rows - The document's folded rows.
 * @returns Each attribute's fact, in the fold's order.
 */
const attributeFactsOf = (rows: FoldedRows<Composed>): Stated[] =>
  rows.attributes.map((attribute) => {
    const after = [...attribute.derived.attrs].map(String);
    const was = new Set([...attribute.attrsWas].map(String));

    return {
      fact: {
        at: attribute.at,
        attrsAfter: bitsText(AttributeSlot, after),
        attrsWas: bitsText(AttributeSlot, was),
        document: attribute.document,
        entities: BigInt(
          rows.attributeEntities.filter((row) => row.attribute === attribute.id).length,
        ),
        governs: attribute.governs,
        id: attribute.id,
        idrefText: "",
        kind: attribute.kind,
        lexical: attribute.lexical,
        name: attribute.name,
        node: attribute.node,
        openName: BigInt(rows.openNames.filter((row) => row.attribute === attribute.id).length),
        prefix: attribute.prefix,
        slot: bitsText(
          AttributeSlot,
          after.filter((slot) => !was.has(slot)),
        ),
        version: attribute.version,
      },
      relation: Attribute,
    };
  });

/**
 * An item whose root may carry a `label`, a `tool-name` and a `tool-version`, and whose body's
 * paragraph may carry a `label`: the scope of Label tools (spec reading 128).
 *
 * @param on - What the item carries.
 * @param on.bodyLabel - A label on the body's paragraph.
 * @param on.rootLabel - The root's own label.
 * @param on.toolName - The root's `tool-name`.
 * @param on.toolVersion - The root's `tool-version`.
 * @returns The item's text.
 */
const labelledItemOf = (on: {
  readonly bodyLabel: boolean;
  readonly rootLabel: boolean;
  readonly toolName: boolean;
  readonly toolVersion: boolean;
}): string =>
  `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false" adaptive="false"${on.rootLabel ? ' label="root"' : ""}${on.toolName ? ' tool-name="t"' : ""}${on.toolVersion ? ' tool-version="1"' : ""}><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><p${on.bodyLabel ? ' label="body"' : ""}>Text</p></qti-item-body></qti-assessment-item>`;

/**
 * The node laws a document's rows break, by the host oracle.
 *
 * @param rows - The rows.
 * @returns The laws, once each.
 */
const nodeBreaches = (rows: FoldedRows<Composed>): readonly string[] => {
  const node = new Set<string>(nodeLawNames);

  return [...new Set(documentBreaches("case.xml", rows, laws).map(({ law }) => law))].filter(
    (law) => node.has(law),
  );
};

/**
 * Assert PostgreSQL refused a case with one of the SQLSTATEs and by a constraint of one of the
 * roles.
 *
 * @param constraints - Node's constraints.
 * @param verdict - The verdict.
 * @param codes - The SQLSTATEs the law's constraints raise.
 * @param roles - The roles of the law's constraints.
 * @param label - The case.
 */
const assertRefused = (
  constraints: readonly Constraint[],
  verdict: Option.Option<DatabaseError>,
  codes: readonly string[],
  roles: ReadonlySet<string>,
  label: string,
) => {
  const refusal = Option.getOrThrowWith(
    verdict,
    () => new Error(`${label}: PostgreSQL accepted it`),
  );
  const constraint = constraints.find(({ name }) => name === refusal.constraint);

  assert.include(codes, refusal.code, `${label}: SQLSTATE`);
  assert.isTrue(
    constraint !== undefined && roles.has(roleOf(constraint)),
    `${label}: refused by ${refusal.constraint ?? ""}, a ${constraint === undefined ? "constraint of no role" : roleOf(constraint)}`,
  );
};

/**
 * Edit one fact of a copy of a document's facts, and the hidden values it states.
 *
 * @param rows - The facts.
 * @param at - The fact's index in document order.
 * @param edit - The fields to replace.
 * @param hidden - The hidden values to state, a breach of one of them.
 * @returns The edited facts.
 */
const edited = (
  rows: readonly Stated[],
  at: number,
  edit: Stated["fact"],
  hidden: Stated["hidden"] = {},
): Stated[] =>
  rows.map((row, index) =>
    index === at
      ? { ...row, fact: { ...row.fact, ...edit }, hidden: { ...row.hidden, ...hidden } }
      : row,
  );

/**
 * Find the first fact whose fields hold a predicate, as a corruption's target.
 *
 * @param rows - The facts.
 * @param holds - The predicate over a fact and its index.
 * @param what - The target, for the failure's message.
 * @returns Its index.
 * @throws {Error} When no fact holds the predicate, a case document too small for the corruption.
 */
const targetOf = (
  rows: readonly Stated[],
  holds: (fact: Stated["fact"], index: number) => boolean,
  what: string,
): number => {
  const at = rows.findIndex(({ fact }, index) => holds(fact, index));
  if (at === -1) {
    throw new Error(`The case document holds no ${what}, so the corruption has no target.`);
  }

  return at;
};

/**
 * The key of one of the counted or barred folds' hidden accumulators, a case's breach of one.
 *
 * @param end - The fold, by its end on the parent.
 * @param side - The accumulator.
 * @returns The key.
 */
const childFold = (end: "countedChildren" | "barredChildren", side: "before" | "after") =>
  accumulatorOf(side, `Node.${end}`, "Node.children");

describe.skipIf(!hasLease)("qti/node.oracle.db.test.ts, on the lease", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "Node's laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "accepts every document of the three accepted corpus packages, and a lawful item's rows sent successor before predecessor",
        () =>
          // Oracle: the corpus verdicts (`verdicts/qti-examples-0a92fbb.tsv`: sharedMedia, simple and svg
          // accepted), and fin.md §11's row-order obligation: an INSERT whose rows arrive successor
          // before predecessor passes the immediate predecessor key, which PostgreSQL checks at the
          // statement's end. The last axis is checked once the statement is in.
          // Bound: every XML entry of the three packages.
          Effect.gen(function* accepted() {
            const client = yield* loginSession;
            const lastAxis = namesOf(yield* constraintsOf(client), "last axis");
            const packages = (yield* materializeCorpus()).filter(({ name }) =>
              acceptedPackages.has(name),
            );
            assert.strictEqual(packages.length, acceptedPackages.size);
            for (const { dir, name } of packages) {
              const files = yield* readPackage(dir);
              const version = yield* Effect.orDie(
                Effect.fromResult(versionOf(schemaVersions, yield* declaredVersionOf(files))),
              );
              for (const file of files.filter(({ path }) => path.endsWith(".xml"))) {
                const document = yield* Effect.orDie(readXml(file.bytes));
                const tree = yield* Effect.orDie(shred(document, version, shredGrammarOf(grammar)));
                const rows = yield* Effect.orDie(
                  Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))),
                );
                const verdict = yield* judged(client, statedInserts(nodeFactsOf(rows)), lastAxis);

                assert.isTrue(
                  Option.isNone(verdict),
                  `${name}/${file.path}: ${Formatter.format(verdict)}`,
                );
              }
            }

            const reversed = nodeFactsOf(yield* foldedOf(lawfulItem)).toReversed();

            assert.isTrue(Option.isNone(yield* judged(client, statedInserts(reversed), lastAxis)));
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses each tree corruption by one of the tree's natives: a ring, a shared child, a gap, an orphan, a node under another document's root, and trees.md §7's six",
        () =>
          // Oracle: the specification as a checker, trees.md §2's natives (T0 to T6, the family's key
          // and mirrors) against a lawful item's rows, each edit breaking the tree; the uncorrupted
          // rows are accepted (the first test's oracle).
          // Bound: one lawful item, `<p>Text <b>bold</b></p>` in its body, under each named corruption,
          // and the math item as the second document of T0's case.
          Effect.gen(function* trees() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            // Each corruption edits a lawful document's facts, every value the writer derives for
            // them pinned, so it moves the fields it names and nothing the program fills.
            const lawful = pinned(nodeFactsOf(yield* foldedOf(lawfulItem)));
            const other = pinned(nodeFactsOf(yield* foldedOf(mathItem))).map((row) => ({
              ...row,
              fact: {
                ...row.fact,
                ...Object.fromEntries(
                  ["document", "id", "nearest", "parent", "parentNearest"].map((field) => [
                    field,
                    String(row.fact[field]).replace(
                      "00000000-0000-4000-8000",
                      "00000000-0000-4000-9000",
                    ),
                  ]),
                ),
              },
            }));
            const leaf = targetOf(
              lawful,
              (row) => row["children"] === 0n && row["at"] === 0n && row["start"] !== 0n,
              "first leaf",
            );
            const withSibling = targetOf(lawful, (row) => row["at"] === 1n, "second sibling");
            // The ring moves an inner element under its own first leaf, at slot 0. An element that
            // already stands at slot 0 of its family keeps every first-slot value of its folds and
            // its content state there (fin.md §4.3), so no row CHECK of its own breaks: only the
            // tree's natives, which read across rows, can refuse it.
            const inner = targetOf(
              lawful,
              (row, index) => index > 1 && row["children"] !== 0n && row["at"] === 0n,
              "inner element at slot 0",
            );
            const deeper = targetOf(
              lawful,
              (row, index) => index > inner && row["children"] === 0n,
              "leaf below an inner element",
            );
            const field = (at: number, name: string) => BigInt(lawful[at]?.fact[name] ?? 0n);
            const corruptions: readonly {
              readonly codes: readonly string[];
              readonly name: string;
              readonly rows: readonly Stated[];
            }[] = [
              {
                codes: ["23503", "23514", "23505"],
                name: "a ring: an inner element under its own descendant",
                rows: edited(lawful, inner, { at: 0n, parent: lawful[deeper]?.fact["id"] ?? "" }),
              },
              {
                codes: ["23505"],
                name: "a shared child: one id at two slots",
                rows: [...lawful, ...edited(lawful, leaf, { at: 1n }).slice(leaf, leaf + 1)],
              },
              {
                codes: ["23514", "23503"],
                name: "a gap: a slot past its family's count",
                rows: edited(lawful, withSibling, { at: 2n }),
              },
              {
                codes: ["23503"],
                name: "an orphan: a parent no row holds",
                rows: edited(lawful, leaf, { parent: "00000000-0000-4000-8000-0000000fffff" }),
              },
              {
                codes: ["23503"],
                name: "a node of one document under another document's tree (T0, P3's counterexample: a leaf past the first document's last start, so T1 holds and only the root copy breaks)",
                rows: [
                  ...lawful,
                  ...edited(
                    other,
                    targetOf(
                      other,
                      (row) =>
                        row["children"] === 0n &&
                        BigInt(row["start"] ?? 0n) >= BigInt(lawful.length),
                      "leaf past the first document's starts",
                    ),
                    { document: lawful[0]?.fact["document"] ?? "" },
                  ),
                ],
              },
              {
                codes: ["23514", "23503"],
                name: "wrongSize: a leaf's interval of two",
                rows: edited(lawful, leaf, { end: field(leaf, "end") + 1n }),
              },
              {
                codes: ["23503", "23514"],
                name: "overlappingSiblings: a predecessor ending past its successor's start",
                rows: edited(lawful, withSibling - 1, { end: field(withSibling - 1, "end") + 1n }),
              },
              {
                codes: ["23503", "23514", "23505"],
                name: "gapBetweenSiblings: a successor starting past its predecessor's end",
                rows: edited(lawful, withSibling, { start: field(withSibling, "start") + 1n }),
              },
              {
                codes: ["23503"],
                name: "childOutsideParent: a parent ending before its last child",
                rows: edited(lawful, inner, { end: field(inner, "end") - 1n }),
              },
              {
                codes: ["23514", "23503"],
                name: "secondRoot: a member as its own parent",
                rows: edited(lawful, leaf, { parent: lawful[leaf]?.fact["id"] ?? "" }),
              },
            ];
            const lastAxis = namesOf(constraints, "last axis");
            for (const corruption of corruptions) {
              assertRefused(
                constraints,
                yield* judged(client, statedInserts(corruption.rows), lastAxis),
                corruption.codes,
                treeRoles,
                corruption.name,
              );
            }
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses each retired content rule's item by its law, and accepts each law's lawful twin",
        () =>
          // Oracle: the host law model (`#pantry/test/oracle.ts`'s `documentBreaches`), which finds
          // exactly the case's law among the node laws, with any law it breaks beside over rows the
          // case does not write, and none in the lawful items, against PostgreSQL's verdict on the
          // case's node rows, which names the case's law.
          // Bound: the seven items of `lawCases` and the two lawful items.
          Effect.gen(function* content() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            for (const xml of [lawfulItem, mathItem]) {
              const rows = yield* foldedOf(xml);

              assert.deepStrictEqual(nodeBreaches(rows), []);
              assert.isTrue(
                Option.isNone(
                  yield* judged(
                    client,
                    statedInserts(nodeFactsOf(rows)),
                    namesOf(constraints, "last axis"),
                  ),
                ),
              );
            }

            for (const { beside = [], law, name, xml } of lawCases) {
              const rows = yield* foldedOf(xml);

              assert.deepStrictEqual(nodeBreaches(rows), [law, ...beside], name);
              assertRefused(
                constraints,
                yield* judged(client, statedInserts(nodeFactsOf(rows))),
                ["23514"],
                new Set([law]),
                name,
              );
            }
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses a shared kind's state outside Symbol or unfollowed, a junk accumulator at each fold's first slot, a wrong after, a wrong nearest, an end that is not its node's characters' and an xsi:type outside XsiType",
        () =>
          // Oracle: the specification as a checker: N5's Symbol and Follow (`m:mfrac`'s two `m:ci`,
          // their positions read from the closed relations), fin.md §4.3's first-slot pins and
          // combine CHECKs, N8, E1's ends (reading 127) and N12, each an edit of a lawful item's rows that
          // breaks the one law.
          // Bound: the two lawful items under each named edit.
          Effect.gen(function* rowLaws() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            const lawfulRows = yield* foldedOf(lawfulItem);
            // Each edit is of a lawful item's facts, every value the writer derives for them pinned,
            // so it breaks the one law it names.
            const lawful = pinned(nodeFactsOf(lawfulRows));
            const math = pinned(nodeFactsOf(yield* foldedOf(mathItem)));
            const firstCi = targetOf(
              math,
              (row) => row["kind"] === "m:ci" && row["at"] === 0n,
              "first m:ci",
            );
            const secondCi = targetOf(
              math,
              (row) => row["kind"] === "m:ci" && row["at"] === 1n,
              "second m:ci",
            );
            // The positions N5 reads for the second m:ci, from the closed relations themselves: the
            // positions Symbol names for m:ci under m:mfrac's shared model (N5 admitted), and those
            // Follow steps to from its predecessor's state (N5 Follow). Each case below states its
            // position by them, so the laws it breaks are its premise, checked here, never an
            // accident of which CHECK PostgreSQL names first.
            const second = math[secondCi]?.fact ?? {};
            const sharedModel = SharedModelOf.rows.find(
              (row) => row.version === second["version"] && row.parent === second["parentKind"],
            )?.model;
            const contentModel = ContentModelOf.rows.find(
              (row) => row.version === second["version"] && row.parent === second["parentKind"],
            )?.model;
            const symbolPositions = new Set<string>(
              ContentSymbol.rows
                .filter((row) => row.model === sharedModel && row.kind === "m:ci")
                .map(({ position }) => position),
            );
            const followed = new Set<string>(
              Follow.rows
                .filter((row) => row.model === contentModel && row.from === second["was"])
                .map(({ to }) => to),
            );
            const breaks = (position: string) =>
              [
                ...(symbolPositions.has(position) ? [] : ["N5 admitted"]),
                ...(followed.has(position) ? [] : ["N5 Follow"]),
              ].toSorted();
            const firstState = String(math[firstCi]?.fact["state"]);
            const unnamed = Position.handles.find(
              (position) =>
                position !== "0" && !symbolPositions.has(position) && !followed.has(position),
            );
            assert.deepStrictEqual(breaks(firstState), ["N5 Follow"], "the first m:ci's position");
            assert.isDefined(unnamed, "a position neither Symbol nor Follow names for m:ci");

            const firstMember = targetOf(
              lawful,
              (row) => row["at"] === 0n && row["start"] !== 0n,
              "first child",
            );
            const lastElement = targetOf(
              lawful,
              (row, index) => index > 0 && row["kind"] === "qti-item-body",
              "item body",
            );
            const textLeaf = targetOf(lawful, (row) => row["kind"] === "text", "text node");
            const cases: readonly {
              readonly codes: readonly string[];
              readonly name: string;
              readonly roles: readonly string[];
              readonly rows: readonly Stated[];
            }[] = [
              {
                codes: ["23514"],
                name: "a shared kind at a Symbol position Follow does not step to: the first m:ci's",
                roles: breaks(firstState),
                rows: edited(math, secondCi, { state: firstState }),
              },
              {
                // A position Symbol does not name is no position Follow steps to either, so the
                // edit breaks both laws, and either refusal is the case's.
                codes: ["23514"],
                name: "a shared kind at a position Symbol does not name",
                roles: breaks(unnamed ?? ""),
                rows: edited(math, secondCi, { state: unnamed ?? "" }),
              },
              {
                codes: ["23514"],
                name: "a junk elements accumulator at slot 0",
                roles: ["elements fold"],
                rows: edited(lawful, firstMember, { elementsWas: 1n }),
              },
              {
                codes: ["23514"],
                name: "a junk counted accumulator at slot 0",
                roles: ["counted fold"],
                rows: edited(
                  lawful,
                  firstMember,
                  {},
                  {
                    [childFold("countedChildren", "after")]: 1,
                    [childFold("countedChildren", "before")]: 1,
                  },
                ),
              },
              {
                codes: ["23514"],
                name: "a junk barred accumulator at slot 0",
                roles: ["barred fold"],
                rows: edited(
                  lawful,
                  firstMember,
                  {},
                  {
                    [childFold("barredChildren", "after")]: 1,
                    [childFold("barredChildren", "before")]: 1,
                  },
                ),
              },
              {
                codes: ["23514"],
                name: "a junk string-value accumulator at slot 0",
                roles: ["string value fold"],
                rows: edited(lawful, firstMember, { charsAfter: "x", charsWas: "x" }),
              },
              {
                codes: ["23514"],
                name: "a junk state copy at slot 0",
                roles: ["was pin", "N5 Follow"],
                rows: edited(lawful, firstMember, { was: "1" }),
              },
              {
                codes: ["23514"],
                name: "a wrong after: an element counted twice",
                roles: ["elements fold"],
                rows: edited(lawful, lastElement, {
                  elements: BigInt(lawful[lastElement]?.fact["elements"] ?? 0n) + 1n,
                }),
              },
              {
                codes: ["23514"],
                name: "a nearest that is no interaction's",
                roles: ["N8 nearest"],
                rows: edited(lawful, textLeaf, { nearest: lawful[textLeaf]?.fact["parent"] ?? "" }),
              },
              {
                codes: ["23514"],
                name: "a text whose first is not its first character",
                roles: ["E1 derived"],
                rows: edited(lawful, textLeaf, { first: "x" }),
              },
              {
                codes: ["23514"],
                name: "an element with a last character, though it holds none",
                roles: ["E1 derived"],
                rows: edited(lawful, lastElement, { last: "x" }),
              },
              {
                codes: ["23514"],
                name: "an xsi:type outside XsiType",
                roles: ["xsi type", "other"],
                rows: edited(lawful, lastElement, { governs: "xs:anyType" }),
              },
            ];
            for (const { codes, name, roles, rows } of cases) {
              assertRefused(
                constraints,
                yield* judged(client, statedInserts(rows)),
                codes,
                new Set(roles),
                name,
              );
            }
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses a root ancestry its document's context does not state, carried consistently down the tree, by the root's context containment, and accepts the document's own (C10, spec reading 117)",
        () =>
          // Oracle: the specification as a checker, spec reading 117 and node.ts's N1: a document
          // node's ancestry is its document's context, which its `Document` row states through
          // `nodeContext`, the containment `Document(node, nodeChildren, context, …) to Node(id,
          // children, ancestry, …)`, set immediate. N1 pins no ancestry, and a flag carried down
          // the tree keeps E1 (ancestry is parentAncestry with Enters) and N6 (the flag is one no
          // kind of the item bans), so the containment is the one law the edit breaks: 23503 on
          // its key.
          // Bound: the lawful item with its `Document` row of the empty context, and the same rows
          // with one flag leaked into the root and carried down the tree.
          Effect.gen(function* rootContext() {
            const client = yield* loginSession;
            const key = yield* constraintDescribed(
              client,
              "document",
              "foreign key Document(node, nodeChildren, context, %) to Node(id, children, ancestry, %)",
            );
            const lawfulRows = yield* foldedOf(lawfulItem);
            const lawful = nodeFactsOf(lawfulRows);
            const flag = Flag.handles.find(
              (handle) =>
                !Banned.rows.some(
                  (row) =>
                    row.flag === handle && lawful.some(({ fact }) => fact["kind"] === row.kind),
                ),
            );
            assert.isDefined(flag, "a flag no kind of the item bans");

            const leaked = nodeFactsOf({
              ...lawfulRows,
              nodes: lawfulRows.nodes.map((node) => ({
                ...node,
                derived: {
                  ...node.derived,
                  ancestry: new Set([...node.derived.ancestry, flag ?? ""]),
                },
                parentAncestry: new Set([...node.parentAncestry, flag ?? ""]),
              })),
            });
            const root = lawful.find(({ fact }) => fact["start"] === 0n)?.fact ?? {};
            const document: Stated = {
              fact: {
                assembled: false,
                charset: utf8Label,
                context: root["ancestry"] ?? "",
                contextNearest: root["nearest"] ?? "",
                contextNearestKind: root["nearestKind"] ?? "",
                exportCharset: utf8Label,
                node: root["id"] ?? "",
                nodeChildren: root["children"] ?? 0n,
                package: "00000000-0000-4000-8000-0000000000ff",
                path: "item.xml",
                resourceType: "imsqti_item_xmlv3p0",
                rootKind: "qti-assessment-item",
                version: root["version"] ?? "",
              },
              relation: Document,
            };

            assertVerdict(
              yield* judged(client, statedInserts([...lawful, document]), [key]),
              key,
              false,
              "the document's own context",
              "23503",
            );
            assertVerdict(
              yield* judged(client, statedInserts([...leaked, document]), [key]),
              key,
              true,
              "a leaked root ancestry, carried consistently down the tree",
              "23503",
            );
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses a foreign element of simple type holding an element and a prefixed one in no namespace, and accepts each one's lawful twin",
        () =>
          // Oracle: the host law model (`#pantry/test/oracle.ts`'s `documentBreaches`), which finds
          // none of the node laws in each lawful document and exactly the case's law in its
          // corruption, against PostgreSQL's verdict: XML Schema 1.0 Part 1 §3.3.4 clause 3.1.2
          // (Foreign simple content), and Namespaces in XML 1.0 §5 and §6.2 (an element in no
          // namespace has no prefix).
          // Bound: the two cases of `foreignCases`, a lawful document and one corruption each.
          Effect.gen(function* foreign() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            for (const { corrupt, law, lawful, name } of foreignCases) {
              const rows = yield* foldedOf(lawful);

              assert.deepStrictEqual(nodeBreaches(rows), [], name);
              assert.isTrue(
                Option.isNone(
                  yield* judged(
                    client,
                    statedInserts(nodeFactsOf(rows)),
                    namesOf(constraints, "last axis"),
                  ),
                ),
                name,
              );

              const broken =
                "xml" in corrupt
                  ? yield* foldedOf(corrupt.xml)
                  : {
                      ...rows,
                      nodes: rows.nodes.map((node) =>
                        node.kind === corrupt.kind ? { ...node, ...corrupt.fields } : node,
                      ),
                    };

              assert.deepStrictEqual(nodeBreaches(broken), [law], name);
              assertRefused(
                constraints,
                yield* judged(client, statedInserts(nodeFactsOf(broken))),
                ["23514"],
                new Set([law]),
                name,
              );
            }
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses a 3.0.1 item root's own label without tool-name and tool-version, by Label tools, and accepts a 3.0.0 one, as the law oracle judges every labelled item of the box (spec reading 128)",
        () =>
          // Oracle: the law oracle's Label tools over each folded item (`documentBreaches`), against
          // QTI 3.0.1's §4.1.3, the item's `label`: "If an item uses labels then values for the
          // associated toolName and toolVersion attributes must also be provided", where 3.0.0's
          // §4.1.3 states no such sentence; a body element's label asks for them in both
          // (§5.16.5). PostgreSQL judges the item's `Node` and `Attribute` rows with the
          // `LabelUse` rows the import's builder writes (`#pantry/import/overlays/identity.ts`),
          // by the four foreign keys of Label tools, set immediate: each label in
          // `labelAttributes` is a use and each use such a label (both ways), and an item's use
          // finds the root's `tool-name` and `tool-version`. A breach is 23503 on one of them.
          // Bound: the small scope exhausted, both versions by the root's label, tool-name and
          // tool-version and the body's label, 32 items; the two named cases among them.
          Effect.gen(function* labelTools() {
            const client = yield* loginSession;
            const keys = [
              yield* constraintDescribed(
                client,
                "label_use",
                `foreign key LabelUse(document where %"tool-name"%`,
              ),
              yield* constraintDescribed(
                client,
                "label_use",
                `foreign key LabelUse(document where %"tool-version"%`,
              ),
              yield* constraintDescribed(
                client,
                "label_use",
                "foreign key LabelUse(node) to Attribute(node where %",
              ),
              yield* constraintDescribed(
                client,
                "attribute",
                "foreign key Attribute(node where %) to LabelUse(node, document)",
              ),
            ];
            const flags = [false, true] as const;
            for (const version of ["3.0.0", "3.0.1"] as const) {
              for (const rootLabel of flags) {
                for (const toolName of flags) {
                  for (const toolVersion of flags) {
                    for (const bodyLabel of flags) {
                      const on = { bodyLabel, rootLabel, toolName, toolVersion };
                      const label = `${version} ${JSON.stringify(on)}`;
                      const { rows, tree } = yield* foldedAt(labelledItemOf(on), version);
                      const breached = documentBreaches("item.xml", rows, laws).some(
                        ({ law }) => law === "Label tools",
                      );
                      if (rootLabel && !toolName && !toolVersion && !bodyLabel) {
                        assert.strictEqual(breached, version === "3.0.1", `the oracle: ${label}`);
                      }

                      const uses = identityRowsOf(tree, {
                        assembled: false,
                        context: ownContext(idOf(0)),
                        documentType: "imsqti_item_xmlv3p0",
                        idOf,
                        targetAt: () => Option.none(),
                      }).LabelUse.values();
                      const verdict = yield* judged(
                        client,
                        statedInserts([
                          ...nodeFactsOf(rows),
                          ...attributeFactsOf(rows),
                          ...[...uses].map((use): Stated => ({ fact: use, relation: LabelUse })),
                        ]),
                        keys,
                      );
                      if (breached) {
                        const refusal = Option.getOrUndefined(verdict);
                        assert.strictEqual(refusal?.code, "23503", label);
                        assert.include(keys, refusal?.constraint, label);
                      } else {
                        assert.isTrue(
                          Option.isNone(verdict),
                          `${label}: ${Formatter.format(verdict)}`,
                        );
                      }
                    }
                  }
                }
              }
            }
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "holds Node's foreign keys into Node to the tree's three axes, with every merged containment on them",
        () =>
          // Oracle: the specification as a checker, C12: a containment of an axis's shape merges into
          // the axis, so no foreign key of N3, N5's predecessor copy or N7's last slot stands apart;
          // and, for every other target, `Qti`'s own statements, each containment from Node, each
          // mirrors' Node half and each family Node owns, so a key grizzle merged, split or
          // dropped, or a law a slice put on Node unstated, changes a target's count. On the
          // drafted _init (20261107020714) that is 40 keys into 38 relations: Document and Site
          // take two each, and Rounding (ccccaeb3), LomResourceType and LomResourceTypeSource
          // (96a7ea14) are the three the 2026-11-06 hand list lacked.
          // Bound: every constraint of Node's table and every statement of Qti.
          Effect.gen(function* census() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            const foreign = constraints.filter(({ kind }) => kind === "f");
            const intoNode = foreign.filter(({ target }) => target === "qti.node");

            assert.sameMembers(intoNode.map(roleOf), [
              "owner axis",
              "predecessor axis",
              "last axis",
            ]);
            assert.deepStrictEqual(
              countPerName(
                foreign.filter(({ target }) => target !== "qti.node").map(targetRelationOf),
              ),
              outOfNode(Qti.statements),
            );

            const owner = intoNode.find((constraint) => roleOf(constraint) === "owner axis");
            for (const copied of [
              "version",
              "parent_kind",
              "parent_governs",
              "parent_ancestry",
              "parent_nearest",
              "parent_nearest_kind",
              "document",
            ]) {
              assert.include(owner?.columns ?? [], copied);
            }

            assert.include(
              intoNode.find((constraint) => roleOf(constraint) === "predecessor axis")?.columns ??
                [],
              "was",
            );
            assert.include(
              intoNode.find((constraint) => roleOf(constraint) === "last axis")?.columns ?? [],
              "last_state",
            );
          }),
      );

      it.effect(
        "serves T1's descendant range and a node's ordered children by an index scan, with no sort",
        () =>
          // Oracle: PostgreSQL's planner, asked for a plan with sequential and bitmap scans set off:
          // a plan exists over an index of Node's that leads with T1's (document, start), so it
          // reads the range in order and serves both reads. Such an index is T1's UNIQUE, and any
          // index a workload's query adds over the same leading columns: on grizzle `64f0427` the
          // planner takes the workload's `btree index Node(document, start, id)`
          // (`__node_ix_document_start_id_…`) for an index-only scan of the range, so the plan is
          // held to the indexes that lead with the pair, not to one name. (An estimate over a small
          // table may prefer a sequential scan, which says nothing of the index.)
          // Bound: the two reads.
          Effect.gen(function* plans() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            const order = constraints.find((constraint) => roleOf(constraint) === "document order");
            const ordered = yield* documentOrderIndexes(client);
            assert.include(ordered, order?.name, "T1's UNIQUE leads with (document, start)");

            const reads = [
              `SELECT id, start FROM ${authorRole}.node WHERE document = $1 AND start > $2 AND start < $3 ORDER BY start`,
              `SELECT id, at FROM ${authorRole}.node WHERE document = $1 AND start > $2 AND start < $3 AND parent = $4 ORDER BY start`,
            ];
            yield* rowsOf(client, "BEGIN");
            yield* rowsOf(client, `SET LOCAL ROLE ${authorRole}`);
            yield* rowsOf(client, "SET LOCAL enable_seqscan = off");
            yield* rowsOf(client, "SET LOCAL enable_bitmapscan = off");

            const explained = yield* Effect.all(
              reads.map((read, index) =>
                rowsOf<{ readonly "QUERY PLAN": unknown }>(
                  client,
                  `EXPLAIN (FORMAT JSON) ${read}`,
                  [
                    "00000000-0000-4000-8000-000000000000",
                    "0",
                    "10",
                    ...(index === 1 ? ["00000000-0000-4000-8000-000000000001"] : []),
                  ],
                ),
              ),
            );
            yield* rowsOf(client, "ROLLBACK");
            for (const plan of explained) {
              const shown = JSON.stringify(plan);
              const scanned = [...shown.matchAll(/"Index Name":"(?<name>[^"]+)"/gu)].map(
                (match) => match.groups?.["name"] ?? "",
              );

              assert.isTrue(
                scanned.some((name) => ordered.includes(name)),
                `${shown}: a scan of an index that leads with (document, start)`,
              );
              assert.notInclude(shown, `"Node Type":"Sort"`);
            }
          }),
      );
    },
  );
});
