/**
 * The one type a refused document carries, and the closed list of rules it may name.
 *
 * A refusal is data, not an error class: the verdict holds it beside the document it judges, and
 * the reader adapter fails with it. The structural validator, the prose rules, the item model, the
 * verdict and the reader adapter all produce {@link Refusal}, and no other module defines one, so a
 * caller and a test see one roster, {@link refusalRules}, whichever stage refused. The wording that
 * turns a refusal into a sentence belongs to the verdict.
 */
import { Schema } from "effect";

/**
 * Every rule a {@link Refusal} may name, each exactly once.
 *
 * The first eight are the structural validator's (the XSD's elements, attributes and text, and the
 * readings' placements and child counts), the next eight the prose rules' (responses, identifiers,
 * bindings, templates, value types, variables, expression types and the count range), then the
 * verdict's `not-qti-root`, and last the reader adapter's `not-well-formed`, located by line and
 * column, and `reader-refused`, located at the whole document with the shared reader's own rule in
 * {@link Refusal.readerRule}. Adding a rule here is the only way a stage gains a new refusal.
 */
export const refusalRules = [
  "unknown-element",
  "unknown-attribute",
  "missing-attribute",
  "attribute-type",
  "padded-attribute",
  "text-not-allowed",
  "misplaced-element",
  "child-count",
  "undeclared-response",
  "duplicate-identifier",
  "binding",
  "template-requirements",
  "value-type",
  "undeclared-variable",
  "expression-type",
  "count-range",
  "not-qti-root",
  "not-well-formed",
  "reader-refused",
] as const;

/**
 * The Schema of one of {@link refusalRules}, which refuses any other string when decoding.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `RefusalRule` is the Schema and the type of a rule under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const RefusalRule = Schema.Literals(refusalRules);

/**
 * A rule a {@link Refusal} names, one of {@link refusalRules}.
 */
export type RefusalRule = typeof RefusalRule.Type;

/**
 * The Schema of where in a document a refusal points.
 *
 * `path` is an element or attribute path as the source view spells it (`qti-assessment-item/
 * qti-item-body/qti-choice-interaction`, `…/@identifier`). `position` is the line and column the
 * shared reader reported, which only a document that is not well-formed has, because the reader
 * keeps no positions on the elements it builds. `document` points at the whole document, for a
 * refusal no part of the document owns.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Location` is the Schema and the type of a location under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const Location = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("path"), path: Schema.String }),
  Schema.Struct({ column: Schema.Int, kind: Schema.Literal("position"), line: Schema.Int }),
  Schema.Struct({ kind: Schema.Literal("document") }),
]);

/**
 * Where in a document a refusal points: an element or attribute path, a line and column, or the
 * whole document.
 */
export type Location = typeof Location.Type;

/**
 * A document the renderer will not render, with the rule it breaks and where.
 *
 * `document` is the location the caller gave the document. `suggestion` is the nearest known name
 * from the table of misspellings, set only when that table has one. `readerRule` is the shared
 * reader's own rule name, set only for `reader-refused`. `detail` holds the facts the verdict's
 * wording needs, keyed by name, so a test asserts `rule`, `location`, `suggestion` and
 * `readerRule`, never the sentence.
 */
export class Refusal extends Schema.TaggedClass<Refusal>()("Refusal", {
  detail: Schema.Record(Schema.String, Schema.String),
  document: Schema.String,
  location: Location,
  readerRule: Schema.Option(Schema.String),
  rule: RefusalRule,
  suggestion: Schema.Option(Schema.String),
}) {}
