/**
 * `Node`'s laws judged by PostgreSQL (Q5.03), written to run at N1 on the lease (and restated in
 * the network seat's probe P1), never by a hand.
 *
 * Every case writes a document's `Node` rows by direct SQL, as a direct writer does (README,
 * "Direct SQL access"): the author login, `SET ROLE` to the author role, SERIALIZABLE, one INSERT
 * of every row with each column the host fills, the hidden ones (‹n›, ‹ps›, the hidden fold
 * accumulators) found by the COMMENT grizzle puts on each. The rows come from shred and the host's
 * fold (`#pantry/model/folds.ts`), the fields the folds leave out (the counted and barred folds,
 * the string value's running text) computed here from `install.ts`'s rows, so a lawful document is
 * the rows grizzle's filler writes for it.
 *
 * A `Node` tree commits only with its package (the document node's `Document` row, the character
 * arms, the attribute family): those laws are deferred to COMMIT and belong to other slices, so
 * every case is judged at its INSERT's end and rolled back. A law that is itself deferred, the
 * tree's last axis, is made immediate for the case (`SET CONSTRAINTS … IMMEDIATE`). A lawful
 * document's INSERT raises nothing; a corruption's raises the SQLSTATE and a constraint that maps
 * to its law (C22: membership, since one row may break several laws whose constraints PostgreSQL
 * checks in an order it does not promise).
 *
 * The census (C12) reads the catalog: Node's foreign keys into Node are exactly the tree's three
 * axes, so N3, N5's predecessor copy and N7's last slot merged; the rest are the other slices'
 * foreign keys, as each reported its laws' objects.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import type { DbConnection } from "@bjornpagen/grizzle";
import { Array as Arr, Effect, Option, Redacted, Result } from "effect";
import { Client, DatabaseError } from "pg";
import type { QueryResultRow } from "pg";
import { describe } from "vitest";
import { readXml } from "@qti-pie/crust/read.ts";
import {
  AttributeSlot,
  Banned,
  BarredOf,
  CountedOf,
  Flag,
  GoverningOf,
  grammar,
  NodeKind,
  nonElementKinds,
  Position,
  SchemaVersion,
  TextDomain,
  TypeName,
} from "#pantry/grammar/install.ts";
import { loginConnection } from "#pantry/db/connection.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { schemaVersions } from "#pantry/grammar/kinds.ts";
import { readPackage } from "#pantry/package/read.ts";
import { copiedTextKinds, Node, universalDomains } from "#pantry/qti/node.ts";
import { materializeCorpus } from "#pantry/test/fixtures.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawsOf, nodeLawNames } from "#pantry/test/oracle.ts";
import type { LawName } from "#pantry/test/oracle.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The author login's PostgreSQL role, `<schema>__<login>`.
 */
const authorAppRole = "qti__author_app";

/**
 * The author role's PostgreSQL role, and the schema of its views.
 */
const authorRole = "qti__author";

/**
 * `Node`'s table, as a direct writer names it.
 */
const nodeTable = `"qti"."node"`;

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
 */
const lawCases: readonly { readonly law: LawName; readonly name: string; readonly xml: string }[] =
  [
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
 * A column of `Node`'s table as the catalog holds it.
 */
interface Column {
  readonly comment: string;
  readonly generated: boolean;
  readonly name: string;
}

/**
 * `Node`'s table read from the catalog: its columns and its constraints.
 */
interface Catalogue {
  readonly columns: readonly Column[];
  readonly constraints: readonly Constraint[];
}

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
 * Read the password a connection authenticates with.
 *
 * @param password - The connection's password.
 * @returns Its text.
 */
const passwordText = (password: DbConnection["password"]) =>
  (Redacted.isRedacted(password) ? Effect.succeed(password) : password).pipe(
    Effect.map(Redacted.value),
  );

/**
 * A session of the author login on the lease over verify-full TLS, closed with its scope.
 */
const loginSession = Effect.gen(function* loginSession() {
  const connection = yield* loginConnection(authorAppRole);
  const password = yield* passwordText(connection.password);
  const client = new Client({
    database: connection.database,
    host: connection.transport.host,
    password,
    port: connection.transport.port,
    ssl: { ca: [connection.transport.ca].flat(), servername: connection.transport.servername },
    user: authorAppRole,
  });

  return yield* Effect.acquireRelease(
    Effect.tryPromise(() => client.connect()).pipe(Effect.as(client)),
    () => Effect.promise(() => client.end()),
  );
});

/**
 * Run one statement and return its rows.
 *
 * @param client - The session.
 * @param text - The statement.
 * @param values - Its parameters, as text.
 * @returns The rows.
 */
const query = <R extends QueryResultRow>(
  client: Client,
  text: string,
  values: readonly string[] = [],
) =>
  Effect.tryPromise(() => client.query<R>(text, [...values])).pipe(Effect.map(({ rows }) => rows));

/**
 * Read `Node`'s table from the catalog.
 *
 * @param client - The session.
 * @returns Its columns and constraints.
 */
const catalogueOf = (client: Client) =>
  Effect.gen(function* catalogue() {
    const columns = yield* query<{
      readonly comment: string | null;
      readonly generated: string;
      readonly name: string;
    }>(
      client,
      `SELECT a.attname AS name, a.attgenerated AS generated, pg_catalog.col_description(a.attrelid, a.attnum) AS comment
         FROM pg_catalog.pg_attribute a
        WHERE a.attrelid = 'qti.node'::regclass AND a.attnum > 0 AND NOT a.attisdropped
        ORDER BY a.attnum`,
    );
    const constraints = yield* query<{
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
    );

    return {
      columns: columns.map((column) => ({
        comment: column.comment ?? "",
        generated: column.generated !== "",
        name: column.name,
      })),
      constraints: constraints.map((constraint) => ({
        ...constraint,
        comment: constraint.comment ?? "",
        target: constraint.target ?? "",
      })),
    } satisfies Catalogue;
  });

/**
 * A node's row as a direct writer sends it: each column's SQL literal, keyed by the field it holds
 * or by the hidden column's role (`copy`, `parentStart`, `countedBefore`, `countedAfter`,
 * `barredBefore`, `barredAfter`).
 */
type SqlRow = Record<string, string>;

/**
 * Quote a text as a SQL literal.
 *
 * @param text - The text.
 * @returns The literal.
 */
const text = (value: string): string => `'${value.replaceAll("'", "''")}'`;

/**
 * Spell a handle as its code, its index in its roster's handles, the code a fresh installation
 * gives it.
 *
 * @param roster - The roster.
 * @param roster.handles - Its handles, in code order.
 * @param handle - The handle.
 * @returns The code's literal.
 * @throws {Error} When the roster lacks the handle, a case built over a name the grammar does not
 *   hold.
 */
const code = (roster: { readonly handles: readonly string[] }, handle: string): string => {
  const at = roster.handles.indexOf(handle);
  if (at === -1) {
    throw new Error(`${handle} is no handle of its roster, so the case writes no code for it.`);
  }

  return String(at);
};

/**
 * Spell a set of handles as its bit string, one bit per code, code 0 first.
 *
 * @param roster - The roster.
 * @param roster.handles - Its handles, in code order.
 * @param members - The set's handles.
 * @returns The bit string's literal.
 */
const bitsOf = (
  roster: { readonly handles: readonly string[] },
  members: ReadonlySet<string>,
): string => `B'${roster.handles.map((handle) => (members.has(handle) ? "1" : "0")).join("")}'`;

/**
 * The kinds that are no element, as a set.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

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
 * `CountedOf`'s and `BarredOf`'s positions by `<version> <parent>`.
 */
const countedAt = new Map(
  CountedOf.rows.map((row) => [`${row.version} ${row.parent}`, row.position]),
);

const barredAt = new Map(
  BarredOf.rows.map((row) => [`${row.version} ${row.parent}`, row.position]),
);

/**
 * Decide whether a member's characters make its parent's string value, as `node.ts`'s fold steps
 * it: its parent's text is checked (its domain is no universal one), its parent is one of
 * `copiedTextKinds`, or it is a title string's child (`copiedTitleText`).
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
    (member.parentKind === "lom:string" && parent?.parentKind === "lom:title")
  );
};

/**
 * Compute a document's `Node` rows, every column the host and grizzle write, in pre-order: the
 * fields from the host's fold, ‹n› and ‹ps› from the parent, and each fold's running values as
 * `node.ts`'s folds step them. `parentParentKind` is accumulated, so the host never writes it: the
 * direct writer fills it as grizzle's owner-axis copy does, the parent's `parentKind`, the root's
 * own, and steps a title string's children (`copiedTitleText`) as the fold does.
 *
 * @param rows - The document's folded rows.
 * @returns Each node's row, in document order.
 */
const sqlRowsOf = (rows: FoldedRows<Composed>): SqlRow[] => {
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

  const running = new Map<
    string,
    {
      counted: number;
      barred: number;
      charsWas: string;
      charsAfter: string;
      countedWas: number;
      barredWas: number;
      piece: string;
    }
  >();
  for (const [parentId, members] of familyOf) {
    const parent = byId.get(parentId);
    members.sort((left, right) => Number(left.at - right.at));
    let counted = 0;
    let barred = 0;
    let joined = "";
    for (const member of members) {
      const checked = inStringValue(member, parent);
      const element = !nonElements.has(member.kind);
      const state = String(member.derived.state);
      const countedWas = counted;
      const barredWas = barred;
      const charsWas = joined;
      if (element && state === countedAt.get(`${member.version} ${member.parentKind}`)) {
        counted += 1;
      }

      if (element && state === barredAt.get(`${member.version} ${member.parentKind}`)) {
        barred += 1;
      }

      if (checked) {
        joined += chars.get(member.id) ?? "";
      }

      running.set(member.id, {
        barred,
        barredWas,
        charsAfter: joined,
        charsWas,
        counted,
        countedWas,
        piece: checked ? (chars.get(member.id) ?? "") : "",
      });
    }
  }

  return rows.nodes.map((node) => {
    const parent = node.start === 0n ? node : (byId.get(node.parent) ?? node);
    const own = running.get(node.id) ?? {
      barred: 0,
      barredWas: 0,
      charsAfter: "",
      charsWas: "",
      counted: 0,
      countedWas: 0,
      piece: "",
    };
    const last = Arr.last(familyOf.get(node.id) ?? []).pipe(
      Option.flatMap(({ id }) => Option.fromNullishOr(running.get(id))),
    );

    return {
      ancestry: bitsOf(Flag, node.derived.ancestry),
      at: String(node.at),
      attributes: String(node.attributes),
      attrs: bitsOf(AttributeSlot, new Set([...node.attrs].map(String))),
      barredAfter: String(own.barred),
      barredBefore: String(own.barredWas),
      barredChildren: String(
        Option.match(last, { onNone: () => 0, onSome: ({ barred }) => barred }),
      ),
      chars: text(chars.get(node.id) ?? ""),
      charsAfter: text(own.charsAfter),
      charsWas: text(own.charsWas),
      children: String(node.children),
      copy: String(parent.children),
      countedAfter: String(own.counted),
      countedBefore: String(own.countedWas),
      countedChildren: String(
        Option.match(last, { onNone: () => 0, onSome: ({ counted }) => counted }),
      ),
      document: text(node.document),
      elementChildren: String(node.elementChildren),
      elements: String(node.derived.elements),
      elementsWas: String(node.elementsWas),
      end: String(node.end),
      governs: code(TypeName, node.governs),
      id: text(node.id),
      kind: code(NodeKind, node.kind),
      lastState: code(Position, String(node.childState)),
      namespaces: String(node.namespaces),
      nearest: text(node.nearest),
      nearestKind: code(NodeKind, node.nearestKind),
      parent: text(node.parent),
      parentAncestry: bitsOf(Flag, node.parentAncestry),
      parentGoverns: code(TypeName, parent.governs),
      parentKind: code(NodeKind, node.parentKind),
      parentNearest: text(node.parentNearest),
      parentNearestKind: code(NodeKind, node.parentNearestKind),
      parentParentKind: code(NodeKind, parent.parentKind),
      parentStart: String(node.parentStart),
      prefix: text(node.prefix),
      start: String(node.start),
      state: code(Position, String(node.derived.state)),
      stringPiece: text(own.piece),
      stringValue: text(
        Option.match(last, { onNone: () => "", onSome: ({ charsAfter }) => charsAfter }),
      ),
      version: code(SchemaVersion, node.version),
      was: code(Position, String(node.was)),
    };
  });
};

/**
 * Spell a field as its column: its conversion, lowercased segments joined by underscores.
 *
 * @param field - The field.
 * @returns The column's name.
 */
const columnOfField = (field: string): string =>
  field.replaceAll(/[A-Z]/gu, (upper) => `_${upper.toLowerCase()}`);

/**
 * Name each written column of `Node`'s table by the role a row holds its value under: a field by
 * its name, ‹n› as `copy`, ‹ps› as `parentStart`, and each hidden fold accumulator by its fold,
 * read off the fold's CHECK, which names the end column beside it.
 *
 * @param catalogue - The table.
 * @returns Each column a direct writer fills, with its role.
 * @throws {Error} When a written column has no role, a column this case cannot fill.
 */
const writtenColumns = (
  catalogue: Catalogue,
): readonly { readonly column: string; readonly role: string }[] => {
  const fields = new Map(Object.keys(Node.fields).map((field) => [columnOfField(field), field]));
  const foldOf = (column: string): string => {
    const check = catalogue.constraints.find(
      ({ definition, kind }) => kind === "c" && definition.includes(column),
    );

    return check?.definition.includes("counted_children") === true ? "counted" : "barred";
  };

  return catalogue.columns
    .filter(({ generated }) => !generated)
    .map(({ comment, name }) => {
      const field = fields.get(name);
      if (field !== undefined) {
        return { column: name, role: field };
      }

      if (comment === "the owner's count of the family Node.children") {
        return { column: name, role: "copy" };
      }

      if (comment === "the parent's start of the family Node.children") {
        return { column: name, role: "parentStart" };
      }

      const hidden =
        /^the accumulator (?<side>before|after) plane 0 of the fold \S+ over the family Node\.children$/u.exec(
          comment,
        )?.groups?.["side"];
      if (hidden !== undefined) {
        return { column: name, role: `${foldOf(name)}${hidden === "before" ? "Before" : "After"}` };
      }

      throw new Error(
        `Node's column ${name} (${comment}) is written by no role this test fills. Give it a role in writtenColumns.`,
      );
    });
};

/**
 * Write the INSERT of a set of `Node` rows.
 *
 * @param columns - The written columns and their roles.
 * @param rows - The rows.
 * @returns The statement.
 */
const insertOf = (
  columns: readonly { readonly column: string; readonly role: string }[],
  rows: readonly SqlRow[],
): string =>
  `INSERT INTO ${nodeTable} (${columns.map(({ column }) => `"${column}"`).join(", ")}) VALUES ${rows
    .map((row) => `(${columns.map(({ role }) => row[role] ?? "NULL").join(", ")})`)
    .join(", ")}`;

/**
 * What PostgreSQL answered an INSERT with: nothing, or its SQLSTATE and the constraint it names.
 */
type Verdict = Option.Option<{ readonly code: string; readonly constraint: string }>;

/**
 * Judge a set of rows at its INSERT's end, as the author role at SERIALIZABLE, and roll back.
 *
 * @param client - The session.
 * @param catalogue - Node's table.
 * @param rows - The rows.
 * @param immediate - The roles of deferred constraints the case checks at the statement's end.
 * @returns PostgreSQL's verdict.
 */
const judged = (
  client: Client,
  catalogue: Catalogue,
  rows: readonly SqlRow[],
  immediate: readonly string[] = [],
) =>
  Effect.gen(function* judge() {
    const columns = writtenColumns(catalogue);
    const deferred = catalogue.constraints.filter((constraint) =>
      immediate.includes(roleOf(constraint)),
    );
    yield* query(client, "BEGIN ISOLATION LEVEL SERIALIZABLE");
    yield* query(client, `SET LOCAL ROLE ${authorRole}`);
    for (const { name } of deferred) {
      yield* query(client, `SET CONSTRAINTS "${name}" IMMEDIATE`);
    }

    const answered = yield* Effect.result(
      Effect.tryPromise({
        catch: (cause) => cause,
        try: () => client.query(insertOf(columns, rows)),
      }),
    );
    yield* query(client, "ROLLBACK");

    return Result.match(answered, {
      onFailure: (cause): Verdict =>
        Option.some(
          cause instanceof DatabaseError
            ? { code: cause.code ?? "", constraint: cause.constraint ?? "" }
            : { code: "", constraint: String(cause) },
        ),
      onSuccess: (): Verdict => Option.none(),
    });
  });

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
 * @param catalogue - Node's table.
 * @param verdict - The verdict.
 * @param codes - The SQLSTATEs the law's constraints raise.
 * @param roles - The roles of the law's constraints.
 * @param label - The case.
 */
const assertRefused = (
  catalogue: Catalogue,
  verdict: Verdict,
  codes: readonly string[],
  roles: ReadonlySet<string>,
  label: string,
) => {
  const refusal = Option.getOrThrowWith(
    verdict,
    () => new Error(`${label}: PostgreSQL accepted it`),
  );
  const constraint = catalogue.constraints.find(({ name }) => name === refusal.constraint);

  assert.include(codes, refusal.code, `${label}: SQLSTATE`);
  assert.isTrue(
    constraint !== undefined && roles.has(roleOf(constraint)),
    `${label}: refused by ${refusal.constraint}, a ${constraint === undefined ? "constraint of no role" : roleOf(constraint)}`,
  );
};

/**
 * Edit one row of a copy of a document's rows.
 *
 * @param rows - The rows.
 * @param at - The row's index in document order.
 * @param edit - The fields to replace.
 * @returns The edited rows.
 */
const edited = (rows: readonly SqlRow[], at: number, edit: SqlRow): SqlRow[] =>
  rows.map((row, index) => (index === at ? { ...row, ...edit } : row));

/**
 * Find the first row whose fields hold a predicate, as a corruption's target.
 *
 * @param rows - The rows.
 * @param holds - The predicate over a row and its index.
 * @param what - The target, for the failure's message.
 * @returns Its index.
 * @throws {Error} When no row holds the predicate, a case document too small for the corruption.
 */
const targetOf = (
  rows: readonly SqlRow[],
  holds: (row: SqlRow, index: number) => boolean,
  what: string,
): number => {
  const at = rows.findIndex(holds);
  if (at === -1) {
    throw new Error(`The case document holds no ${what}, so the corruption has no target.`);
  }

  return at;
};

describe.skipIf(!hasLease)("qti/node.db.test.ts, on the lease", () => {
  layer(NodeServices.layer, { excludeTestServices: true })(
    "Node's laws, judged by PostgreSQL",
    (it) => {
      it.effect(
        "accepts every document of the three accepted corpus packages, and a lawful item's rows sent successor before predecessor",
        () =>
          // Oracle: the corpus verdicts (`verdicts/qti-examples-0a92fbb.tsv`: sharedMedia, simple and svg
          // accepted), and fin.md §11's row-order obligation: an INSERT whose rows arrive successor
          // before predecessor passes the immediate predecessor key, which PostgreSQL checks at the
          // statement's end. The last axis is checked at the statement's end too.
          // Bound: every XML entry of the three packages.
          Effect.gen(function* accepted() {
            const client = yield* loginSession;
            const catalogue = yield* catalogueOf(client);
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
                const verdict = yield* judged(client, catalogue, sqlRowsOf(rows), ["last axis"]);

                assert.isTrue(
                  Option.isNone(verdict),
                  `${name}/${file.path}: ${JSON.stringify(verdict)}`,
                );
              }
            }

            const reversed = sqlRowsOf(yield* foldedOf(lawfulItem)).toReversed();

            assert.isTrue(Option.isNone(yield* judged(client, catalogue, reversed, ["last axis"])));
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
            const catalogue = yield* catalogueOf(client);
            const lawful = sqlRowsOf(yield* foldedOf(lawfulItem));
            const other = sqlRowsOf(yield* foldedOf(mathItem)).map((row) => ({
              ...row,
              document:
                row["document"]?.replace("00000000-0000-4000-8000", "00000000-0000-4000-9000") ??
                "",
              id: row["id"]?.replace("00000000-0000-4000-8000", "00000000-0000-4000-9000") ?? "",
              nearest:
                row["nearest"]?.replace("00000000-0000-4000-8000", "00000000-0000-4000-9000") ?? "",
              parent:
                row["parent"]?.replace("00000000-0000-4000-8000", "00000000-0000-4000-9000") ?? "",
              parentNearest:
                row["parentNearest"]?.replace(
                  "00000000-0000-4000-8000",
                  "00000000-0000-4000-9000",
                ) ?? "",
            }));
            const leaf = targetOf(
              lawful,
              (row) => row["children"] === "0" && row["at"] === "0" && row["start"] !== "0",
              "first leaf",
            );
            const withSibling = targetOf(lawful, (row) => row["at"] === "1", "second sibling");
            const inner = targetOf(
              lawful,
              (row, index) => index > 1 && row["children"] !== "0",
              "inner element",
            );
            const deeper = targetOf(
              lawful,
              (row, index) => index > inner && row["children"] === "0",
              "leaf below an inner element",
            );
            const corruptions: readonly {
              readonly codes: readonly string[];
              readonly name: string;
              readonly rows: readonly SqlRow[];
            }[] = [
              {
                codes: ["23503", "23514", "23505"],
                name: "a ring: an inner element under its own descendant",
                rows: edited(lawful, inner, { at: "0", parent: lawful[deeper]?.["id"] ?? "" }),
              },
              {
                codes: ["23505"],
                name: "a shared child: one id at two slots",
                rows: [...lawful, { ...lawful[leaf], at: "1" }],
              },
              {
                codes: ["23514", "23503"],
                name: "a gap: a slot past its family's count",
                rows: edited(lawful, withSibling, { at: "2" }),
              },
              {
                codes: ["23503"],
                name: "an orphan: a parent no row holds",
                rows: edited(lawful, leaf, {
                  parent: text("00000000-0000-4000-8000-0000000fffff"),
                }),
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
                        row["children"] === "0" &&
                        BigInt(row["start"] ?? "0") >= BigInt(lawful.length),
                      "leaf past the first document's starts",
                    ),
                    { document: lawful[0]?.["document"] ?? "" },
                  ),
                ],
              },
              {
                codes: ["23514", "23503"],
                name: "wrongSize: a leaf's interval of two",
                rows: edited(lawful, leaf, {
                  end: String(BigInt(lawful[leaf]?.["end"] ?? "0") + 1n),
                }),
              },
              {
                codes: ["23503", "23514"],
                name: "overlappingSiblings: a predecessor ending past its successor's start",
                rows: edited(lawful, withSibling - 1, {
                  end: String(BigInt(lawful[withSibling - 1]?.["end"] ?? "0") + 1n),
                }),
              },
              {
                codes: ["23503", "23514", "23505"],
                name: "gapBetweenSiblings: a successor starting past its predecessor's end",
                rows: edited(lawful, withSibling, {
                  start: String(BigInt(lawful[withSibling]?.["start"] ?? "0") + 1n),
                }),
              },
              {
                codes: ["23503"],
                name: "childOutsideParent: a parent ending before its last child",
                rows: edited(lawful, inner, {
                  end: String(BigInt(lawful[inner]?.["end"] ?? "0") - 1n),
                }),
              },
              {
                codes: ["23514", "23503"],
                name: "secondRoot: a member as its own parent",
                rows: edited(lawful, leaf, { parent: lawful[leaf]?.["id"] ?? "" }),
              },
            ];
            for (const corruption of corruptions) {
              assertRefused(
                catalogue,
                yield* judged(client, catalogue, corruption.rows, ["last axis"]),
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
          // exactly the case's law among the node laws and none in the lawful items, against
          // PostgreSQL's verdict.
          // Bound: the seven items of `lawCases` and the two lawful items.
          Effect.gen(function* content() {
            const client = yield* loginSession;
            const catalogue = yield* catalogueOf(client);
            for (const xml of [lawfulItem, mathItem]) {
              const rows = yield* foldedOf(xml);

              assert.deepStrictEqual(nodeBreaches(rows), []);
              assert.isTrue(
                Option.isNone(yield* judged(client, catalogue, sqlRowsOf(rows), ["last axis"])),
              );
            }

            for (const { law, name, xml } of lawCases) {
              const rows = yield* foldedOf(xml);

              assert.deepStrictEqual(nodeBreaches(rows), [law], name);
              assertRefused(
                catalogue,
                yield* judged(client, catalogue, sqlRowsOf(rows)),
                ["23514"],
                new Set([law]),
                name,
              );
            }
          }),
        leaseTestTimeoutMs,
      );

      it.effect(
        "refuses a shared kind's state outside Symbol or unfollowed, a junk accumulator at each fold's first slot, a wrong after, a leaked root ancestry, a wrong nearest and an xsi:type outside XsiType",
        () =>
          // Oracle: the specification as a checker: N5's Symbol and Follow (`m:mfrac`'s two `m:ci`
          // at positions 1 and 2), fin.md §4.3's first-slot pins and combine CHECKs, C10's root
          // pin, N8 and N12, each an edit of a lawful item's rows that breaks the one law.
          // Bound: the two lawful items under each named edit.
          Effect.gen(function* rowLaws() {
            const client = yield* loginSession;
            const catalogue = yield* catalogueOf(client);
            const lawful = sqlRowsOf(yield* foldedOf(lawfulItem));
            const math = sqlRowsOf(yield* foldedOf(mathItem));
            const ciKind = code(NodeKind, "m:ci");
            const secondCi = targetOf(
              math,
              (row) => row["kind"] === ciKind && row["at"] === "1",
              "second m:ci",
            );
            const firstMember = targetOf(
              lawful,
              (row) => row["at"] === "0" && row["start"] !== "0",
              "first child",
            );
            const lastElement = targetOf(
              lawful,
              (row, index) => index > 0 && row["kind"] === code(NodeKind, "qti-item-body"),
              "item body",
            );
            const textLeaf = targetOf(
              lawful,
              (row) => row["kind"] === code(NodeKind, "text"),
              "text node",
            );
            const flag =
              Flag.handles.find(
                (handle) =>
                  !Banned.rows.some(
                    (row) =>
                      row.flag === handle &&
                      lawful.some((held) => held["kind"] === code(NodeKind, row.kind)),
                  ),
              ) ?? Flag.handles[0];
            const leaked = new Set([flag]);
            const withFlag = (bits: string): string => {
              const set = bits.slice(2, -1).split("");
              set[Flag.handles.indexOf(flag)] = "1";

              return `B'${set.join("")}'`;
            };
            const cases: readonly {
              readonly codes: readonly string[];
              readonly name: string;
              readonly roles: readonly string[];
              readonly rows: readonly SqlRow[];
            }[] = [
              {
                codes: ["23514"],
                name: "a shared kind at a Symbol position Follow does not step to",
                roles: ["N5 Follow"],
                rows: edited(math, secondCi, { state: code(Position, "1") }),
              },
              {
                codes: ["23514"],
                name: "a shared kind at a position Symbol does not name",
                roles: ["N5 admitted", "N5 Follow"],
                rows: edited(math, secondCi, { state: code(Position, "3") }),
              },
              {
                codes: ["23514"],
                name: "a junk elements accumulator at slot 0",
                roles: ["elements fold"],
                rows: edited(lawful, firstMember, { elementsWas: "1" }),
              },
              {
                codes: ["23514"],
                name: "a junk counted accumulator at slot 0",
                roles: ["counted fold"],
                rows: edited(lawful, firstMember, { countedAfter: "1", countedBefore: "1" }),
              },
              {
                codes: ["23514"],
                name: "a junk barred accumulator at slot 0",
                roles: ["barred fold"],
                rows: edited(lawful, firstMember, { barredAfter: "1", barredBefore: "1" }),
              },
              {
                codes: ["23514"],
                name: "a junk string-value accumulator at slot 0",
                roles: ["string value fold"],
                rows: edited(lawful, firstMember, { charsAfter: text("x"), charsWas: text("x") }),
              },
              {
                codes: ["23514"],
                name: "a junk state copy at slot 0",
                roles: ["was pin", "N5 Follow"],
                rows: edited(lawful, firstMember, { was: code(Position, "1") }),
              },
              {
                codes: ["23514"],
                name: "a wrong after: an element counted twice",
                roles: ["elements fold"],
                rows: edited(lawful, lastElement, {
                  elements: String(BigInt(lawful[lastElement]?.["elements"] ?? "0") + 1n),
                }),
              },
              {
                codes: ["23514"],
                name: "a leaked root ancestry, carried consistently down the tree (C10)",
                roles: ["N1 sentinel"],
                rows: lawful.map((row) => ({
                  ...row,
                  ancestry: withFlag(row["ancestry"] ?? ""),
                  parentAncestry: withFlag(row["parentAncestry"] ?? ""),
                })),
              },
              {
                codes: ["23514"],
                name: "a nearest that is no interaction's",
                roles: ["N8 nearest"],
                rows: edited(lawful, textLeaf, { nearest: lawful[textLeaf]?.["parent"] ?? "" }),
              },
              {
                codes: ["23514"],
                name: "an xsi:type outside XsiType",
                roles: ["xsi type", "other"],
                rows: edited(lawful, lastElement, { governs: code(TypeName, "xs:anyType") }),
              },
            ];
            assert.isTrue(leaked.size === 1);
            for (const { codes, name, roles, rows } of cases) {
              assertRefused(
                catalogue,
                yield* judged(client, catalogue, rows),
                codes,
                new Set(roles),
                name,
              );
            }
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
            const catalogue = yield* catalogueOf(client);
            for (const { corrupt, law, lawful, name } of foreignCases) {
              const rows = yield* foldedOf(lawful);

              assert.deepStrictEqual(nodeBreaches(rows), [], name);
              assert.isTrue(
                Option.isNone(yield* judged(client, catalogue, sqlRowsOf(rows), ["last axis"])),
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
                catalogue,
                yield* judged(client, catalogue, sqlRowsOf(broken)),
                ["23514"],
                new Set([law]),
                name,
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
          // and the other slices' reports of the objects their laws put on Node (Q5.04: its four
          // arms, OpenElementName and the root kind; Q5.05 and Q5.04: the attribute and namespace
          // families' last axes; Q5.11: the existence mirrors of AreaMapping, MatchTable and
          // InterpolationTable).
          // Bound: every constraint of Node's table.
          Effect.gen(function* census() {
            const client = yield* loginSession;
            const catalogue = yield* catalogueOf(client);
            const foreign = catalogue.constraints.filter(({ kind }) => kind === "f");
            const intoNode = foreign.filter(({ target }) => target === "qti.node");

            assert.sameMembers(intoNode.map(roleOf), [
              "owner axis",
              "predecessor axis",
              "last axis",
            ]);
            assert.sameMembers(
              foreign.filter(({ target }) => target !== "qti.node").map(({ target }) => target),
              [
                "qti.attribute",
                "qti.namespace",
                "qti.comment",
                "qti.pi",
                "qti.doctype",
                "qti.document",
                "qti.document",
                "qti.open_element_name",
                "qti.area_mapping",
                "qti.interpolation_table",
                "qti.match_table",
              ],
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
          // a plan exists over T1's UNIQUE (document, start) that reads the range in order, so the
          // index serves both reads. (An estimate over a small table may prefer a sequential scan,
          // which says nothing of the index.)
          // Bound: the two reads.
          Effect.gen(function* plans() {
            const client = yield* loginSession;
            const catalogue = yield* catalogueOf(client);
            const order = catalogue.constraints.find(
              (constraint) => roleOf(constraint) === "document order",
            );
            const reads = [
              `SELECT id, start FROM ${authorRole}.node WHERE document = $1 AND start > $2 AND start < $3 ORDER BY start`,
              `SELECT id, at FROM ${authorRole}.node WHERE document = $1 AND start > $2 AND start < $3 AND parent = $4 ORDER BY start`,
            ];
            yield* query(client, "BEGIN");
            yield* query(client, `SET LOCAL ROLE ${authorRole}`);
            yield* query(client, "SET LOCAL enable_seqscan = off");
            yield* query(client, "SET LOCAL enable_bitmapscan = off");

            const explained = yield* Effect.all(
              reads.map((read, index) =>
                query<{ readonly "QUERY PLAN": unknown }>(client, `EXPLAIN (FORMAT JSON) ${read}`, [
                  "00000000-0000-4000-8000-000000000000",
                  "0",
                  "10",
                  ...(index === 1 ? ["00000000-0000-4000-8000-000000000001"] : []),
                ]),
              ),
            );
            yield* query(client, "ROLLBACK");
            for (const plan of explained) {
              const shown = JSON.stringify(plan);

              assert.include(shown, `"Index Name":"${order?.name ?? ""}"`);
              assert.notInclude(shown, `"Node Type":"Sort"`);
            }
          }),
      );
    },
  );
});
