/**
 * What the choice-like interactions share: the template variable a choice reads its identifier
 * from, a match group's identifiers, and the bound check the two match arms repeat.
 *
 * A `qti-simple-choice` may name a template variable instead of writing its own identifier, and
 * that variable must be a template declaration of the same document holding a single identifier or
 * a multiple identifier. The check and both containments say so.
 */
import { check, closedId, contained, on, relation, select, str, uuid } from "@bjornpagen/grizzle";
import type { pg, Relation } from "@bjornpagen/grizzle";
import {
  BaseType,
  Declaration,
  TypedCardinality,
  TypedDeclaration,
} from "#pantry/schema/declaration.ts";
import { Node } from "#pantry/schema/node.ts";
import { MatchGroupList } from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

/**
 * The template variable a choice takes its identifier from: one row where the choice names one.
 * `document` and `identifier` name the declaration, and the pair of them with the base type and
 * cardinality copies the typed declaration's, so a reference is to a declaration of the one
 * document.
 */
export const ChoiceTemplateRef = relation(
  "ChoiceTemplateRef",
  {
    baseType: closedId(BaseType),
    cardinality: closedId(TypedCardinality),
    document: uuid,
    identifier: ncName,
    node: uuid,
  },
  ["node"],
);

/**
 * The `match-group` attribute of a choice: a space-separated list of NCNames. The attribute is an
 * anonymous list with no minimum length, so the empty list is admitted.
 */
export const MatchGroup = relation("MatchGroup", { node: uuid, value: MatchGroupList }, ["node"]);

/**
 * The relations of this module, as schema members.
 */
export const relations = { ChoiceTemplateRef, MatchGroup };

/**
 * No arms: both relations are optional values of nodes other modules own.
 */
export const arms = {};

/**
 * A relation carrying the two match bounds as `pg.bigint` fields, keyed by `id`.
 */
export type BoundedRelation = Relation<
  string,
  {
    readonly id: typeof uuid;
    readonly matchMaxN: typeof pg.bigint;
    readonly matchMinN: typeof pg.bigint;
  },
  readonly ["id"]
>;

/**
 * A match arm's bounds: a maximum of 0 is unbounded, otherwise the maximum is at least the minimum.
 * The arm that carries `matchMaxN` and `matchMinN` states it under its own name.
 */
export const matchBoundsCheck = <const Name extends string>(name: Name, target: BoundedRelation) =>
  check(name, target, (r) => r.or(r.eq(r.matchMaxN, 0n), r.ge(r.matchMaxN, r.matchMinN)));

/**
 * The statements over the relations above: a template reference is a template declaration of its
 * document, with the base type and cardinality its declaration holds, on a node of that document's
 * tree, and its type is an identifier of single or multiple cardinality.
 */
export const rules = [
  contained(
    on(ChoiceTemplateRef, "document", "identifier"),
    on(select(Declaration, { kind: "template" }), "document", "identifier"),
  ),
  contained(
    on(ChoiceTemplateRef, "document", "identifier", "baseType", "cardinality"),
    on(TypedDeclaration, "document", "identifier", "baseType", "cardinality"),
  ),
  contained(on(ChoiceTemplateRef, "node", "document"), on(Node, "id", "tree")),
  check("ChoiceTemplateRefType", ChoiceTemplateRef, (r) =>
    r.and(r.eq(r.baseType, "identifier"), r.in(r.cardinality, ["single", "multiple"])),
  ),
] as const;
