/**
 * The lexical forms a QTI result writes in a `value` element, one element per value.
 *
 * Results Reporting's XSD types `value` as `normalizedString`, so the schema cannot tell a wrong
 * form from a right one; these functions fix the form instead. Each modelled base type takes the
 * form {@link format} writes, which `parseLexical` of `#plate/model/values.ts` reads back to the
 * same value: an integer as its exact digits at any size (reading 45), a float as its shortest
 * round trip with `INF`, `-INF` and `NaN`, and a point, pair or directed pair as its two parts
 * separated by one space. A duration is its seconds, written as a float is (reading 29).
 *
 * @module
 */
import { format } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * One value a result writes: a value of a modelled base type, or a duration as its seconds.
 *
 * The value model holds no duration, but every result reports the built-in `duration`: a single
 * float in an item and a value of base type duration in a test, part or section (reading 29), each
 * a count of seconds.
 */
export type ResultSingle = Single | { readonly baseType: "duration"; readonly value: number };

/**
 * Write one value in the lexical form a result's `value` element holds.
 *
 * A duration is written as its seconds, `90.5` and never `PT1M30.5S`, in the form a float takes;
 * every other value is written as {@link format} writes it.
 *
 * @param single The value to write.
 * @returns Its lexical form.
 */
export const resultValue = (single: ResultSingle): string =>
  single.baseType === "duration"
    ? format({ baseType: "float", value: single.value })
    : format(single);

/**
 * Write the values of a QTI value in the lexical form a result's `value` element holds, one
 * entry per `value` element.
 *
 * A multiple or ordered value gives one entry per member in the order it holds them, repeats
 * kept, a single value one entry, and NULL none.
 *
 * @param value The value to write.
 * @returns One lexical form per member, in order.
 */
export const resultValues = (value: Value): readonly string[] => value.values.map(resultValue);
