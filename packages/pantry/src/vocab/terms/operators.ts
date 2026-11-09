/**
 * The terms of operators that the schema (`#pantry/qti/operators.ts`) and the importer
 * (`#pantry/import/overlays/operators.ts`) both read. Loading this module builds no relation of the
 * schema.
 */

/**
 * The kinds of the rounding operators, whose `figures` reading 119 reads.
 */
export const roundingKinds = ["qti-equal-rounded", "qti-round-to"] as const;

/**
 * The rounding modes, the values of `RoundingModeEnum` (info §8.26).
 */
export const roundingModes = ["decimalPlaces", "significantFigures"] as const;

/**
 * The `rounding-mode` in force on a `qti-equal-rounded` that writes none: the XSD's default
 * (`EqualRoundedDType`'s `rounding-mode`, `default="significantFigures"`; info §5.47.1). A
 * `qti-round-to` has none, since `RoundToDType` requires the attribute (§5.119.1).
 */
export const equalRoundedMode = "significantFigures" satisfies (typeof roundingModes)[number];
