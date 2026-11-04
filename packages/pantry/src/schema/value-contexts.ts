/**
 * The contexts a `qti-value`'s text is written in, and the field type of each base type in each:
 * the table `value.ts`, `value-contracts.ts` and `mapping.ts` read. It is a leaf of the schema,
 * reading only grizzle, the patterns and the boolean roster, so the arm contracts, which are minted
 * over its field types, can be applied by `value.ts` without an import cycle.
 */
import { closedId, str } from "@bjornpagen/grizzle";
import { BooleanLiteral } from "#pantry/schema/content/rosters.ts";
import type { Rule } from "#pantry/import/refusal.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * The places a `qti-value`'s text is written as one of the eleven base types, each with the prefix
 * of its arm relations and the refusal rule that judges the text before it is written.
 */
export const valueContexts = [
  { context: "Declared", prefix: "DeclaredValue", rule: "value-lexical" },
  { context: "Literal", prefix: "Literal", rule: "P7" },
  { context: "Usage", prefix: "UsageTypedValue", rule: "usage-typed-value" },
  { context: "MapKey", prefix: "MapEntry", rule: "map-key-lexical" },
  { context: "MatchDefault", prefix: "MatchTableDefaultValue", rule: "attribute-lexical" },
  { context: "MatchTarget", prefix: "MatchTableEntry", rule: "attribute-lexical" },
  {
    context: "InterpolationDefault",
    prefix: "InterpolationTableDefaultValue",
    rule: "attribute-lexical",
  },
  { context: "InterpolationTarget", prefix: "InterpolationTableEntry", rule: "attribute-lexical" },
] as const satisfies readonly { context: string; prefix: string; rule: Rule }[];

/**
 * One of the eight contexts of `valueContexts`.
 */
export type ValueContext = (typeof valueContexts)[number]["context"];

const normalized = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

const double = str.regex(patterns.xsDouble);

const pair = str.regex(patterns.pair);

/**
 * The lexical form of a value of each base type: a boolean is a handle of `BooleanLiteral`, a
 * duration is a number of seconds, and a string or a file is the text after replacement.
 */
const lexicalForms = {
  boolean: closedId(BooleanLiteral),
  directedPair: pair,
  duration: double,
  file: normalized,
  float: double,
  identifier: str.regex(patterns.ncName),
  integer: str.regex(patterns.xsInteger),
  pair,
  point: str.regex(patterns.point),
  string: normalized,
  uri: str.regex(patterns.anyUri),
};

const lexicalByContext: Record<ValueContext, typeof lexicalForms> = {
  Declared: lexicalForms,
  InterpolationDefault: lexicalForms,
  InterpolationTarget: lexicalForms,
  Literal: lexicalForms,
  MapKey: lexicalForms,
  MatchDefault: lexicalForms,
  MatchTarget: lexicalForms,
  Usage: lexicalForms,
};

/**
 * The field type of each of the eleven base types in a context.
 */
export const lexicalOf = (context: ValueContext) => lexicalByContext[context];
