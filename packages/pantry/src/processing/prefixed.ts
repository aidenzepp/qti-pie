import { Option } from "effect";

/**
 * A variable name split at its prefix.
 *
 * `prefix` is the text before the first `.`. `instance` is present only for the `ITEMREF.N.VAR`
 * form, where `N` is a positive number: `value` is exact and `spelling` is as written, so `02`
 * keeps its spelling while its canonical form is `String(value)`. `variable` is all the text
 * after the prefix, or after the instance segment, with any further `.` kept.
 */
export interface PrefixedForm {
  readonly prefix: string;
  readonly instance: { readonly value: bigint; readonly spelling: string } | undefined;
  readonly variable: string;
}

/**
 * Splits `name` at the first `.`, then at a digits-only second segment of at least 1.
 *
 * An identifier may contain `.` (reading 37), so the variable is never the text after the last
 * `.`. An NCName does not start with a digit, so a digits-only middle segment is never part of an
 * identifier. `I1.0.SCORE` has no instance and its variable is `0.SCORE`. Whether `duration`
 * names a part's or section's duration or the item's built-in is the caller's, by what the prefix
 * names.
 *
 * @param name - A variable name as written.
 * @returns `none` when `name` has no `.`, otherwise its parts.
 */
export const prefixedForm = (name: string): Option.Option<PrefixedForm> => {
  const dot = name.indexOf(".");
  if (dot === -1) {
    return Option.none();
  }

  const prefix = name.slice(0, dot);
  const rest = name.slice(dot + 1);
  const second = /^(?<digits>[0-9]+)\.(?<variable>.+)$/su.exec(rest);
  const digits = second?.groups?.["digits"];
  const variable = second?.groups?.["variable"];
  if (digits !== undefined && variable !== undefined && BigInt(digits) >= 1n) {
    return Option.some({
      instance: { spelling: digits, value: BigInt(digits) },
      prefix,
      variable,
    });
  }

  return Option.some({ instance: undefined, prefix, variable: rest });
};
