/**
 * The lexical forms a QTI result writes in a `value` element, one element per value.
 *
 * Results Reporting's XSD types `value` as `normalizedString`, so the schema cannot tell a wrong
 * form from a right one; these functions fix the form instead. Each modelled base type takes the
 * form {@link format} writes, which `parseLexical` of `#plate/model/values.ts` reads back to the
 * same value: an integer as its exact digits at any size (reading 45), a float as its shortest
 * round trip with `INF`, `-INF` and `NaN`, and a point, pair or directed pair as its two parts
 * separated by one space. A duration is its seconds, written as a float is (readings 29 and 68).
 *
 * @module
 */
import { format } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * One value a result writes: a value of the value model, a duration among them.
 *
 * Every result reports the built-in `duration`: a single float in an item and a value of base type
 * duration in a test, part or section (reading 29), each a count of seconds, as the value model
 * holds a duration.
 */
export type ResultSingle = Single;

/**
 * Write one value in the lexical form a result's `value` element holds, as {@link format} writes
 * it.
 *
 * A duration is written as its seconds, `90.5` and never `PT1M30.5S`, in the form a float takes,
 * `INF`, `-INF` and `NaN` included (reading 68).
 *
 * @param single The value to write.
 * @returns Its lexical form.
 */
export const resultValue = (single: ResultSingle): string => format(single);

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
