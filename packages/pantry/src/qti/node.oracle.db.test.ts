/**
 * `Node`'s laws judged by PostgreSQL (Q5.03), written to run at N1 on the lease (and restated in
 * the network seat's probe P1), never by a hand.
 *
 * Only what the database alone holds stays here: the tree's natives across rows, the catalog's
 * foreign keys into `Node` (C12), and the planner's index scans. Node's row CHECKs and content laws
 * are held on the free tier, by the law oracle and `#pantry/qti/node.oracle.test.ts`.
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
 * tree's last axis, is set immediate for the case once the rows are in (`SET CONSTRAINTS <schema>.…
 * IMMEDIATE`, named with `Qti`'s schema). A lawful document raises nothing; a corruption raises the
 * SQLSTATE and a constraint that maps to its law (C22: membership, since one row may break several
 * laws whose constraints PostgreSQL checks in an order it does not promise).
 *
 * The census (C12) reads the catalog: Node's foreign keys into Node are exactly the tree's three
 * axes, so N3, N5's predecessor copy and N7's last slot merged; the rest are, target for target,
 * the keys `Qti`'s statements put on Node into another relation.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Option, Order } from "effect";
import type { Client, DatabaseError } from "pg";
import { describe } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import {
  AttributeSlot,
  Flag,
  grammar,
  nonElementKinds,
  RootOfType,
  TextDomain,
} from "#pantry/grammar/install.ts";
import { governorOf } from "#pantry/import/fold.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { copiedTextKinds, Node, universalDomains, vocabularyTermKinds } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/qti/own.ts";
import { bitsText } from "#pantry/test/bits.ts";
import {
  authorRole,
  authorViews,
  judged,
  loginSession,
  pinned,
  qtiSchema,
  rowsOf,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { checkConstraintOf } from "#pantry/test/judged-laws.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import { keysOf } from "#pantry/test/statements.ts";

/**
 * The QTI 3 ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The MathML namespace.
 */
const mathml = "http://www.w3.org/1998/Math/MathML";

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
 * The foreign keys a schema's laws put on `Node`'s table into another stored relation, as the count
 * per target relation: one for each containment law from `Node` (or a selection of it), a mirrors'
 * `Node` half among them, and one for the proof key into its last member of each family `Node`
 * owns.
 *
 * @param schema - The schema, `Qti`.
 * @returns Each target relation and how many of Node's keys it takes.
 */
const outOfNode = (schema: typeof Qti) => {
  const keys = keysOf(schema);

  return countPerName([
    ...keys.laws.filter(({ from, to }) => from === "Node" && to !== "Node").map(({ to }) => to),
    ...keys.axes.filter(({ from, to }) => to === "Node" && from !== "Node").map(({ from }) => from),
  ]);
};

/**
 * The role a constraint of `Node` plays, read off its name (a check this slice names, by its
 * installed name, `checkConstraintOf`) or the identity its COMMENT spells (grizzle's hashed
 * natives), `other` for another slice's.
 *
 * @param constraint - The constraint.
 * @returns Its role.
 */
const roleOf = (constraint: Constraint): string => {
  const named = new Map(
    (
      [
        ["E1_derived", "E1 derived"],
        ["Foreign_element_class", "Foreign element class"],
        ["Foreign_simple_content", "Foreign simple content"],
        ["N1_sentinel", "N1 sentinel"],
        ["N5_admitted", "N5 admitted"],
        ["N5_Follow", "N5 Follow"],
        ["N6_ancestry", "N6 ancestry"],
        ["N7_barred_by", "N7 barred by"],
        ["N7_Counted", "N7 Counted"],
        ["N7_Last", "N7 Last"],
        ["N8_nearest", "N8 nearest"],
      ] as const
    ).map(([check, role]) => [checkConstraintOf(Qti, Node.name, check), role]),
  );
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
    [
      "xsi type",
      comment.startsWith("check of ElementType for law ElementType(version, kind, type)"),
    ],
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
 * Read a table's constraints from the catalog, `Node`'s by default.
 *
 * @param client - The session.
 * @param table - The table, `node` or another of `Qti`'s.
 * @returns Its constraints.
 */
const constraintsOf = (client: Client, table = "node") =>
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
      WHERE c.conrelid = pg_catalog.to_regclass($1)`,
    [`${qtiSchema}.${table}`],
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
  const governor = governorOf(
    member.version,
    member.parentKind,
    parent === undefined ? Option.none() : parent.governs,
  );
  const domain = textDomainAt.get(`${member.version} ${governor}`);

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
 * The `DocumentType` of a folded document, as its document node's `documentType` holds it:
 * `manifest` for the package's manifest, which no resource lists, and for every other document the
 * type of the resource that lists it, the one `RootOfType` names for its root element's kind, which
 * `ResourceDocumentType` spells as itself (spec reading 176).
 *
 * @param rows - The document's folded rows.
 * @returns The type.
 */
const documentTypeOf = (rows: FoldedRows<Composed>): string => {
  // The nodes are in pre-order, so the first element below the document node is its root.
  const root = rows.nodes.find(({ kind, start }) => start > 0n && !nonElements.has(kind))?.kind;
  if (root === "cp:manifest") {
    return "manifest";
  }

  const [type, ...others] = RootOfType.rows
    .filter((row) => row.root === root)
    .map(({ type: rooted }) => rooted);
  assert.isDefined(type, `${root ?? "no root"}: a resource type RootOfType names for it`);
  assert.isEmpty(others, `${root ?? "no root"}: the one resource type RootOfType names for it`);

  return type;
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
        governor: governorOf(node.version, node.kind, node.governs),
        id: node.id,
        kind: node.kind,
        last: node.last,
        lastState: String(node.childState),
        namespaces: node.namespaces,
        nearest: node.nearest,
        nearestKind: node.nearestKind,
        parent: node.parent,
        parentAncestry: bitsText(Flag, node.parentAncestry),
        parentGovernor: governorOf(parent.version, parent.kind, parent.governs),
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

describe.skipIf(!hasLease)("qti/node.oracle.db.test.ts, on the lease", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "Node's laws, judged by PostgreSQL",
    (it) => {
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
            const reversed = nodeFactsOf(yield* foldedOf(lawfulItem)).toReversed();

            assert.isTrue(Option.isNone(yield* judged(client, statedInserts(reversed), lastAxis)));
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
        "holds Node's foreign keys into Node to the tree's three axes, with every merged containment on them",
        () =>
          // Oracle: the specification as a checker, C12: a containment of an axis's shape merges into
          // the axis, so no foreign key of N3, N5's predecessor copy or N7's last slot stands apart;
          // and, for every other target, `Qti`'s own statements, each containment from Node, each
          // mirrors' Node half and each family Node owns, so a key grizzle merged, split or
          // dropped, or a law a slice put on Node unstated, changes a target's count. On the
          // committed init migration that is 45 keys into 43 relations: Document and Site take two
          // each, and Rounding (ccccaeb3), LomResourceType and LomResourceTypeSource (96a7ea14) are
          // the three the 2026-11-06 hand list lacked.
          // Bound: every constraint of Node's table and every statement of Qti.
          Effect.gen(function* census() {
            const client = yield* loginSession;
            const constraints = yield* constraintsOf(client);
            const foreign = constraints.filter(({ kind }) => kind === "f");
            const intoNode = foreign.filter(({ target }) => target === `${qtiSchema}.node`);

            assert.sameMembers(intoNode.map(roleOf), [
              "owner axis",
              "predecessor axis",
              "last axis",
            ]);
            assert.deepStrictEqual(
              countPerName(
                foreign
                  .filter(({ target }) => target !== `${qtiSchema}.node`)
                  .map(targetRelationOf),
              ),
              outOfNode(Qti),
            );

            const owner = intoNode.find((constraint) => roleOf(constraint) === "owner axis");
            for (const copied of [
              "version",
              "parent_kind",
              "parent_governor",
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
              `SELECT id, start FROM ${authorViews}.node WHERE document = $1 AND start > $2 AND start < $3 ORDER BY start`,
              `SELECT id, at FROM ${authorViews}.node WHERE document = $1 AND start > $2 AND start < $3 AND parent = $4 ORDER BY start`,
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
