/**
 * The base types a mapping may be of.
 */
import type { BaseType } from "#qti/schema/declaration.ts";

/**
 * A base type of a mapping.
 */
type BaseTypeHandle = (typeof BaseType.handles)[number];

/**
 * Every base type but `file` and `duration`, which have no lexical map key to compare: nine rows.
 */
export const mappableBaseType: readonly { readonly baseType: BaseTypeHandle }[] = [
  { baseType: "boolean" },
  { baseType: "directedPair" },
  { baseType: "float" },
  { baseType: "identifier" },
  { baseType: "integer" },
  { baseType: "pair" },
  { baseType: "point" },
  { baseType: "string" },
  { baseType: "uri" },
];
