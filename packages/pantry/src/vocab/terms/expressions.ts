/**
 * The terms of expressions that the schema (`#pantry/qti/expressions.ts`) and the importer
 * (`#pantry/import/overlays/expressions.ts`) both read. Loading this module builds no relation of
 * the schema.
 */

/**
 * The kinds whose type an attribute of their own gives.
 */
export const attributeTypedKinds = [
  "qti-base-value",
  "qti-math-operator",
  "qti-test-variables",
] as const;

/**
 * The attribute-typed kinds whose typing attribute an element may omit, so that its absence types
 * the element: a test variables' `base-type` (`TestVariablesDType`, `use="optional"`), whose
 * absence matches every integer and float variable and types it `unknown`, or float where it is
 * weighted (spec reading 167). A base value's `base-type` and a math
 * operator's `name` are required (`BaseValueDType` and `MathOperatorDType`, `use="required"`), so
 * an element that omits one is AL3's alone, and holds no typing row.
 */
export const optionallyTypedKinds = [
  "qti-test-variables",
] as const satisfies readonly (typeof attributeTypedKinds)[number][];
