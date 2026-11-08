/**
 * The quotation law of spec reading 127: no quotation punctuation immediately before, after or
 * inside a `q`, since the user agent draws the quotes itself.
 *
 * The information model says of Q: "Quotation punctuation (such as quotation marks) that is
 * quoting the contents of the tag must not appear immediately before, after, or inside q tags;
 * they will be inserted into the rendering by the user agent" (§5.111; the 3.0.0 and 3.0.1 ASI
 * XSDs repeat it as `QDType`'s documentation). So a `q` is refused where any one of four
 * characters is a quotation mark ({@link quotationMarks}): the last character of its sibling
 * before it, the first of its sibling after it, and the first and last of its own content.
 *
 * Each of the four is the end of one sibling or child row of `Node`, its `first` or `last`
 * (`#pantry/qti/node.ts`), which `E1_derived` proves against its `chars`; `chars` itself is
 * unbounded and fits no key, so no containment can carry it. A neighbour that is no text holds no
 * characters, so its ends are empty and never a mark: an element beside a `q` is not judged, and
 * a comment or processing instruction between a `q` and a mark keeps the mark from being
 * immediately beside it. An entity reference crust keeps is one the document does not declare,
 * whose replacement text no row holds, so it is judged as written, `&` and `;`.
 *
 * {@link Quotation} is one row per `q`, keyed by its node: the node's tuple (C18), its slot and
 * child count and its parent's, and the four ends, each copied from the member at the slot it
 * names under its parent, `(parent, at)` over the tree's members ({@link members}), or empty where
 * that member does not exist.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Q | QTI 3.0 ASI information model, §5.111 Q}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  key,
  mirrors,
  natural,
  on,
  pred,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { EndCharacter, members, Node, nodeRef } from "#pantry/qti/node.ts";

/**
 * The quotation punctuation a `q`'s four ends are refused for: the ASCII double quote, the single
 * and double curly and low quotes but the right single quotation mark, and the guillemets, main's
 * set (`src/import/guards/content.ts` at `2b276d76`).
 *
 * The ASCII apostrophe (U+0027) and the right single quotation mark (U+2019) are left out: each is
 * an apostrophe as often as a quote, and a possessive or an elision beside a `q`, as in
 * `the students’<q>…</q>`, quotes nothing. A predefined entity reaches the rows as its character,
 * since crust substitutes it, so `&quot;` is the double quote here and `&apos;` the apostrophe.
 */
export const quotationMarks = ['"', "«", "»", "‘", "‚", "‛", "“", "”", "„", "‟", "‹", "›"] as const;

/**
 * A `q`'s overlay, keyed by its node: its {@link nodeRef} tuple, its slot `at` among its parent's
 * `siblings` and its own count of `children`, its parent's slot `parentAt` (which only lets the
 * parent's count be read through the one `UNIQUE (id, at, children)` its own slot and count use),
 * and the four ends the law judges.
 *
 * - `before`: the last character of the sibling at `at − 1`, empty at slot 0;
 * - `after`: the first character of the sibling at `nextAt`, which is `at + 1`, empty when the `q` is
 *   its parent's last child;
 * - `first`: the first character of the child at `firstAt`, which is 0, empty when it has none;
 * - `last`: the last character of the child at `children − 1`, empty when it has none.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const Quotation = relation(
  "Quotation",
  {
    after: EndCharacter,
    at: natural,
    before: EndCharacter,
    children: natural,
    document: uuid,
    first: EndCharacter,
    firstAt: natural,
    kind: closedId(NodeKind),
    last: EndCharacter,
    nearest: uuid,
    nextAt: natural,
    node: uuid,
    parent: uuid,
    parentAt: natural,
    siblings: natural,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * This module's relation, under its own name, as `#pantry/qti/schema.ts` composes it.
 */
export const quotationRelations = { Quotation };

/**
 * The `q` nodes, a constant selection: a containment into it references the one `UNIQUE (id,
 * kind)` on `Node` the document layer's arms share.
 */
const quotations = select(Node, (n) => n.eq(n.kind, "q"));

/**
 * The `q`s with a sibling after them, whose `after` is that sibling's first character.
 */
const followed = select(Quotation, (q) => q.lt(q.nextAt, q.siblings));

/**
 * The `q`s with a child, whose `first` is their first child's first character.
 */
const filled = select(Quotation, (q) => q.gt(q.children, 0n));

/**
 * Every statement over {@link Quotation}, each `check` named by its oracle law:
 *
 * - **the overlay:** its node's {@link nodeRef} tuple, one row for each `q` and no other node (both
 *   ways), and its node's and its parent's slot and count;
 * - **E1:** `nextAt` is `at + 1`, `firstAt` is 0, and each end whose member does not exist is empty;
 * - **the ends:** two keys over the tree's members, `(parent, at)` with its `first` and with its
 *   `last`, which hold since `(parent, at)` names one member, and the four copies into them;
 * - **`Quotation_punctuation`:** none of the four ends is a quotation mark.
 */
export const quotationLawsByName = {
  "E1 derived": [
    contained(
      on(Quotation, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    mirrors(on(Quotation, "node"), on(quotations, "id")),
    contained(on(Quotation, "node", "at", "children"), on(Node, "id", "at", "children")),
    contained(on(Quotation, "parent", "parentAt", "siblings"), on(Node, "id", "at", "children")),
    check("E1_derived", Quotation, (q) =>
      q.and(
        q.eq(Compute.base(q.nextAt), Compute.add(Compute.base(q.at), 1n)),
        q.eq(q.firstAt, 0n),
        q.or(q.gt(q.at, 0n), q.eq(q.before, "")),
        q.or(q.lt(q.nextAt, q.siblings), q.eq(q.after, "")),
        q.or(q.gt(q.children, 0n), q.and(q.eq(q.first, ""), q.eq(q.last, ""))),
      ),
    ),
    key(on(members, "parent", "at", "first")),
    key(on(members, "parent", "at", "last")),
    contained(on(Quotation, "parent", pred("at"), "before"), on(members, "parent", "at", "last")),
    contained(on(followed, "parent", "nextAt", "after"), on(members, "parent", "at", "first")),
    contained(on(filled, "node", "firstAt", "first"), on(members, "parent", "at", "first")),
    contained(on(Quotation, "node", pred("children"), "last"), on(members, "parent", "at", "last")),
  ],
  "Quotation punctuation": [
    check("Quotation_punctuation", Quotation, (q) =>
      q.not(
        q.or(
          q.in(q.before, quotationMarks),
          q.in(q.after, quotationMarks),
          q.in(q.first, quotationMarks),
          q.in(q.last, quotationMarks),
        ),
      ),
    ),
  ],
} as const;

/**
 * {@link quotationLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const quotationLaws = Object.values(quotationLawsByName).flat();
