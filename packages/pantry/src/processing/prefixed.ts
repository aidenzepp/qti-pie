/**
 * One reading of a variable name: an identifier prefix and the variable it names.
 *
 * `instance` is present only for the `ITEMREF.N.VAR` form, where `N` is a positive number:
 * `value` is exact and `spelling` is as written, so `02` keeps its spelling while its canonical
 * form is `String(value)`. `variable` is all the text after the prefix, or after the instance
 * segment, with any further `.` kept.
 */
export interface PrefixedForm {
  readonly prefix: string;
  readonly instance: { readonly value: bigint; readonly spelling: string } | undefined;
  readonly variable: string;
}

/**
 * Splits `name` at every `.`, one reading per `.`, leftmost first.
 *
 * An identifier may contain `.` (reading 37), so `a.b.SCORE` is item ref `a` with variable
 * `b.SCORE` or item ref `a.b` with variable `SCORE`, and the text alone cannot say which. A
 * reading is given whether or not an identifier could spell its prefix or its variable; the
 * checker (p5-14) knows the item refs and chooses among the readings. Where the text after a
 * split is a digits-only segment of at least 1, a `.` and more text, that reading is the
 * instance form (`I1.0.SCORE` has none, since 0 is not an instance); the next split along still
 * gives its own reading, because `I1.2` is an NCName and may name an item ref.
 *
 * @param name - A variable name as written.
 * @returns One reading per `.` in `name`, empty when `name` has no `.`.
 */
export const prefixedReadings = (name: string): readonly PrefixedForm[] => {
  const readings: PrefixedForm[] = [];
  for (let dot = name.indexOf("."); dot !== -1; dot = name.indexOf(".", dot + 1)) {
    const prefix = name.slice(0, dot);
    const rest = name.slice(dot + 1);
    const second = /^(?<digits>[0-9]+)\.(?<variable>.+)$/su.exec(rest);
    const digits = second?.groups?.["digits"];
    const variable = second?.groups?.["variable"];
    if (digits !== undefined && variable !== undefined && BigInt(digits) >= 1n) {
      readings.push({ instance: { spelling: digits, value: BigInt(digits) }, prefix, variable });
    } else {
      readings.push({ instance: undefined, prefix, variable: rest });
    }
  }

  return readings;
};
