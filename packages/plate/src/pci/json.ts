/**
 * The QTI 3 implementation guide's Appendix C JSON binding, both ways: {@link toPciJson} writes a
 * plate value as the JSON a portable custom interaction's `boundTo`, `templateVariables` and
 * `contextVariables` carry, and {@link fromPciJson} reads the JSON its `getResponse()` returns as a
 * value of a declared base type and cardinality, or refuses it with a typed reason and the path at
 * fault.
 *
 * No caller yet: issue pci-04 (the frame host) writes `boundTo`, `templateVariables` and
 * `contextVariables` and reads `getResponse()` through it, and issue pci-05 (the server) reads and
 * writes the hidden input's JSON through it.
 *
 * A browser module: the frame host and the server share it, so it value-imports from `effect` only
 * `Option` and `Result`, never `Schema`, and no server module. {@link fromPciJson} takes parsed
 * JSON, never text, so it never calls `JSON.parse` on untrusted input. It reads only the keys the
 * binding names, along the declared path, so an object of any size or depth below them, or one
 * that refers to itself, costs nothing.
 *
 * The binding leaves some choices, and plate's value model differs from it in some places. This
 * module fixes each by the name the issue gives it:
 *
 * - **J1** A QTI 3 `duration` is a number of seconds. It is written `PT<seconds>S`, the seconds as
 *   `format` writes a float, and read from the ISO 8601 day-time form (`PnDTnHnMnS`, each part
 *   optional, a fraction allowed on the seconds alone) and from weeks (`PnW`). Years and months
 *   (`Y`, and `M` before `T`) are no fixed number of seconds, so they are refused as
 *   `duration-calendar`. The seconds-only form `PT<seconds>S` is read in the lexical forms `format`
 *   writes, `INF`, `-INF`, `NaN`, a sign and an exponent included, so every duration written reads
 *   back.
 * - **J2** `intOrIdentifier` is not a QTI 3 base type, so a declaration of it cannot occur, and JSON
 *   that carries it is refused as `base-type-mismatch`.
 * - **J3** `file` is not a base type the value model holds: JSON that carries it, and a declaration
 *   of it, are refused as `file-unmodelled`, and no value is written as one.
 * - **J4** `undefined` and every NULL form read as NULL: a `base` of `null`, a `list` of `null` or of
 *   an empty array, and a `record` of `null` or of an empty array. A NULL value is written as its
 *   cardinality's NULL form: `base`, `list` or `record`, each `null`.
 * - **J5** A field of a record whose base is NULL is no field, since the value model has no NULL
 *   field. An empty `string` is NULL, so a field that holds one is dropped too.
 * - **J6** JSON of another base type than the declared one, or a `base` for a `list` declaration or
 *   the reverse, is refused (`base-type-mismatch`, `cardinality-mismatch`). A NULL form of another
 *   cardinality is a mismatch too. A JSON integer is a double, so an integer or a point coordinate
 *   that is not a safe integer is refused as `number-unsafe`: the reader takes parsed JSON, and a
 *   digit string past the safe range has already lost its digits by then.
 *
 * A value read is one the session codec accepts: an identifier and a record's field name are
 * NCNames, text holds only characters XML can carry, and a container holds no NULL. A float is any
 * JavaScript number, so `NaN` and the infinities, which JSON text cannot carry and a structured
 * clone can, read as floats, and a `uri` that is empty is a value, as `parseElementText` reads
 * one; only an empty `string` is NULL.
 *
 * @module
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl
 */
import { Option, Result } from "effect";
import { isXmlText } from "#plate/form/encoding.ts";
import {
  format,
  isModelled,
  isNcName,
  isRecordValue,
  nullOf,
  nullRecord,
  parseLexical,
} from "#plate/model/values.ts";
import type {
  ModelledBaseType,
  RecordField,
  RecordValue,
  ResponseValue,
  Single,
  Value,
} from "#plate/model/values.ts";
import type { BaseType, Cardinality } from "#plate/vocabulary.ts";

/**
 * What Appendix C's `base` and `list` carry under a base type's name: a boolean, a number, a
 * string, or a pair of numbers (a `point`) or of strings (`pair`, `directedPair`).
 */
export type PciJsonPayload =
  | boolean
  | number
  | string
  | readonly [number, number]
  | readonly [string, string];

/**
 * A JSON value of the Appendix C binding: a `base`, a `list` or a `record` object.
 *
 * `base` is NULL or one value keyed by its base type, `{ "base": { "integer": 3 } }`. `list` is
 * NULL or one array keyed by the base type of its elements, `{ "list": { "identifier": ["A"] } }`;
 * it serves `multiple` and `ordered` alike, which the response declaration tells apart. `record`
 * is NULL or its fields, each a `name` and a `base`, a NULL field written `{ "base": null }`.
 *
 * Numbers are JSON numbers: a non-finite float or duration has none, so one written here is a
 * JavaScript number that `JSON.stringify` writes as `null`, and survives only a structured clone.
 */
export type PciJson =
  | { readonly base: null | { readonly [baseType: string]: PciJsonPayload } }
  | { readonly list: null | { readonly [baseType: string]: readonly PciJsonPayload[] } }
  | {
      readonly record:
        | null
        | readonly {
            readonly name: string;
            readonly base: null | { readonly [baseType: string]: PciJsonPayload };
          }[];
    };

/**
 * Why JSON does not fit its declaration, and what to change.
 *
 * - `base-type-mismatch`: the JSON names a base type the declaration cannot hold, `intOrIdentifier`
 *   and an unknown name included (J2, J6); name the declared base type.
 * - `cardinality-mismatch`: the JSON is a `base`, `list` or `record` of another cardinality than the
 *   declaration (J6); use the object the declared cardinality takes.
 * - `duration-calendar`: a duration with years or months (J1); write it in days, hours, minutes and
 *   seconds, or in weeks.
 * - `file-unmodelled`: the JSON or the declaration is of base type `file` (J3), which plate does not
 *   hold.
 * - `malformed`: the JSON is not Appendix C's form, or a value is outside its base type's lexical
 *   space: a missing or extra key, text XML cannot carry, an identifier that is no NCName, a NULL
 *   inside a list, a field named twice.
 * - `number-unsafe`: an integer or a point coordinate is not a safe integer (J6); write a whole
 *   number from -(2^53 - 1) to 2^53 - 1.
 */
export type PciJsonRefusalReason =
  | "base-type-mismatch"
  | "cardinality-mismatch"
  | "duration-calendar"
  | "file-unmodelled"
  | "malformed"
  | "number-unsafe";

/**
 * Why a JSON value does not fit its declaration: the reason and the JSON path at fault.
 *
 * `path` is JSONPath's dot form from the root `$`: `$.base.integer`, `$.list.identifier[1]`,
 * `$.record[0].name`. A key that is not an identifier is written `["key"]`, quoted as JSON.
 */
export interface PciJsonRefused {
  readonly reason: PciJsonRefusalReason;
  readonly path: string;
}

/**
 * The response declaration {@link fromPciJson} reads against: its cardinality and its base type.
 *
 * A record has no base type of its own, so `baseType` is ignored for `record`. For any other
 * cardinality an absent, `undefined` or none `baseType` means the declaration names no base type,
 * and nothing the JSON holds can fit it. `file` is a declarable base type that plate does not hold
 * (J3).
 */
export interface PciJsonDeclared {
  readonly baseType?: Option.Option<BaseType> | undefined;
  readonly cardinality: Cardinality;
}

/**
 * A reading's outcome: what it read, or the refusal that stopped it.
 */
type Read<A> = Result.Result<A, PciJsonRefused>;

/**
 * Write a single value as the payload Appendix C gives its base type.
 *
 * @param single The value.
 * @returns A boolean, a number, a string, `[x, y]`, `["a", "b"]` or a `PT<seconds>S` duration. An
 *   integer past the safe range is written as its nearest double, since a JSON number is a double
 *   and the value model has no other spelling; {@link fromPciJson} refuses it as `number-unsafe`.
 */
const written = (single: Single): PciJsonPayload => {
  if (single.baseType === "integer") {
    return Number(single.value);
  }

  if (single.baseType === "point") {
    return [Number(single.value[0]), Number(single.value[1])];
  }

  if (single.baseType === "pair" || single.baseType === "directedPair") {
    return [single.value[0], single.value[1]];
  }

  return single.baseType === "duration" ? `PT${format(single)}S` : single.value;
};

/**
 * Write a base type around its payload: `{ "<baseType>": payload }`.
 *
 * @param baseType The base type's name.
 * @param payload What it carries.
 * @returns The one-key object.
 */
const keyed = <A>(baseType: string, payload: A) => ({ [baseType]: payload });

/**
 * Write a plate value as Appendix C JSON (J1, J4).
 *
 * A NULL value is written as its cardinality's NULL form (J4): `base` of `null` for `single`,
 * `list` of `null` for `multiple` and `ordered`, and `record` of `null` for a record. `multiple`
 * and `ordered` write the same `list`, which the response declaration tells apart.
 *
 * The JSON is a tree of plain objects and arrays that `JSON.stringify` writes and `postMessage`
 * clones, but for the numbers JSON has none of: a float or duration of `INF`, `-INF` or `NaN`, and
 * an integer past the safe range, which is written as its nearest double.
 *
 * @param value The value of a response, a template variable or a context variable. Its values are
 *   of its base type, as `ValueSchema` requires.
 * @returns The JSON that {@link fromPciJson} reads back to `value` under the same declaration,
 *   with the exceptions above.
 */
export const toPciJson = (value: ResponseValue): PciJson => {
  if (isRecordValue(value)) {
    return {
      record:
        value.fields.length === 0
          ? null
          : value.fields.map(({ identifier, value: single }) => ({
              base: keyed(single.baseType, written(single)),
              name: identifier,
            })),
    };
  }

  if (value.cardinality === "single") {
    const [single] = value.values;

    return { base: single === undefined ? null : keyed(value.baseType, written(single)) };
  }

  return {
    list: value.values.length === 0 ? null : keyed(value.baseType, value.values.map(written)),
  };
};

/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unsafe-dictionary-type -- Everything below is the parsing boundary for JSON a PCI returns: each node is `unknown` until a predicate has read it, and a browser module may not use Schema to parse it. */

/**
 * A keyed object of parsed JSON.
 */
interface JsonObject {
  readonly [key: string]: unknown;
}

/**
 * A declaration of a response that holds values of a modelled base type.
 */
interface ValueDeclared {
  readonly baseType: ModelledBaseType;
  readonly cardinality: Value["cardinality"];
}

/**
 * A declaration of a record response.
 */
interface RecordDeclared {
  readonly cardinality: "record";
}

/**
 * A {@link PciJsonDeclared} the value model can hold.
 */
type Resolved = RecordDeclared | ValueDeclared;

/**
 * The JSON that names one base type: that base type, the payload under its key, and the payload's
 * path.
 */
interface Typed {
  readonly baseType: ModelledBaseType;
  readonly path: string;
  readonly payload: unknown;
}

/**
 * Report whether a node is a boolean.
 *
 * @param node The node.
 * @returns Whether it is.
 */
const isBoolean = (node: unknown): node is boolean => typeof node === "boolean";

/**
 * Report whether a node is a number.
 *
 * @param node The node.
 * @returns Whether it is, any double included.
 */
const isNumber = (node: unknown): node is number => typeof node === "number";

/**
 * Report whether a node is a string.
 *
 * @param node The node.
 * @returns Whether it is.
 */
const isString = (node: unknown): node is string => typeof node === "string";

/**
 * Report whether a node is a keyed object: not null, not an array.
 *
 * @param node The node.
 * @returns Whether it is a {@link JsonObject}.
 */
const isObject = (node: unknown): node is JsonObject =>
  typeof node === "object" && node !== null && !Array.isArray(node);

/**
 * Report whether a node is an array.
 *
 * @param node The node.
 * @returns Whether it is.
 */
const isList = (node: unknown): node is readonly unknown[] => Array.isArray(node);

/**
 * Refuse JSON.
 *
 * @param reason Why it does not fit.
 * @param path The JSON path at fault.
 * @returns A failed reading.
 */
const refuse = (reason: PciJsonRefusalReason, path: string): Result.Result<never, PciJsonRefused> =>
  Result.fail({ path, reason });

/**
 * A key a path writes after a dot: an ASCII identifier.
 */
const dotKey = /^[A-Za-z_][A-Za-z0-9_]*$/u;

/**
 * Extend a path by an object key.
 *
 * @param path The path to the object.
 * @param key The key.
 * @returns `path.key`, or `path["key"]` for a key that is no identifier.
 */
const member = (path: string, key: string): string =>
  dotKey.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;

/**
 * Extend a path by an array index.
 *
 * @param path The path to the array.
 * @param index The element's index.
 * @returns `path[index]`.
 */
const element = (path: string, index: number): string => `${path}[${String(index)}]`;

/**
 * Read a key an object holds itself, never one it inherits.
 *
 * @param object The object.
 * @param key The key.
 * @returns The node under the key, or undefined when the object has no such own key.
 */
const own = (object: JsonObject, key: string) =>
  Object.hasOwn(object, key) ? object[key] : undefined;

/**
 * Resolve a declaration to one the value model holds.
 *
 * @param declared The response declaration.
 * @returns The declaration, or `file-unmodelled` for base type `file` (J3), or `base-type-mismatch`
 *   for a declaration with no base type, both at the root.
 */
const resolve = (declared: PciJsonDeclared): Read<Resolved> => {
  if (declared.cardinality === "record") {
    return Result.succeed({ cardinality: "record" });
  }

  const baseType = Option.getOrUndefined(declared.baseType ?? Option.none());

  if (baseType === undefined) {
    return refuse("base-type-mismatch", "$");
  }

  return baseType === "file"
    ? refuse("file-unmodelled", "$")
    : Result.succeed({ baseType, cardinality: declared.cardinality });
};

/**
 * Read the one key of an object that names a base type, which JSON puts around a value.
 *
 * @param container The `base` or `list` object, or a record field's `base`.
 * @param path The container's path.
 * @returns The base type, its payload and the payload's path. `malformed` when the container is not
 *   an object with exactly one key, `file-unmodelled` for the key `file` (J3), and
 *   `base-type-mismatch` for any key that is no base type, `intOrIdentifier` included (J2).
 */
const readTyped = (container: unknown, path: string): Read<Typed> => {
  if (!isObject(container)) {
    return refuse("malformed", path);
  }

  const keys = Object.keys(container);
  const [key] = keys;

  if (key === undefined || keys.length !== 1) {
    return refuse("malformed", path);
  }

  const at = member(path, key);

  if (key === "file") {
    return refuse("file-unmodelled", at);
  }

  return isModelled(key)
    ? Result.succeed({ baseType: key, path: at, payload: container[key] })
    : refuse("base-type-mismatch", at);
};

/**
 * Require JSON's base type to be the declared one (J6).
 *
 * @param typed The JSON's base type.
 * @param declared The declared base type.
 * @returns `typed`, or `base-type-mismatch` at its key.
 */
const declaredOnly = (typed: Typed, declared: ModelledBaseType): Read<Typed> =>
  typed.baseType === declared ? Result.succeed(typed) : refuse("base-type-mismatch", typed.path);

/**
 * Read a JSON integer as the exact integer it names.
 *
 * @param payload The node.
 * @param path Its path.
 * @returns The integer; `malformed` for a node that is no number, and `number-unsafe` for a number
 *   that is not a safe integer (J6).
 */
const readSafeInteger = (payload: unknown, path: string): Read<bigint> => {
  if (!isNumber(payload)) {
    return refuse("malformed", path);
  }

  return Number.isSafeInteger(payload)
    ? Result.succeed(BigInt(payload))
    : refuse("number-unsafe", path);
};

/**
 * Read JSON text that XML can carry.
 *
 * @param payload The node.
 * @param path Its path.
 * @returns The text, or `malformed` for a node that is no string or holds a character XML cannot
 *   carry, which the session codec refuses too.
 */
const readText = (payload: unknown, path: string): Read<string> =>
  isString(payload) && isXmlText(payload) ? Result.succeed(payload) : refuse("malformed", path);

/**
 * Read a JSON string as an identifier.
 *
 * @param payload The node.
 * @param path Its path.
 * @returns The identifier, or `malformed` for a node that is no string or no NCName.
 */
const readIdentifier = (payload: unknown, path: string): Read<string> =>
  isString(payload) && isNcName(payload) ? Result.succeed(payload) : refuse("malformed", path);

/**
 * Read a JSON array of exactly two elements, each by one reader.
 *
 * @param payload The node.
 * @param path Its path.
 * @param readElement How to read each element.
 * @returns The two elements in written order, or `malformed` at the array when it is not two long,
 *   or the element's own refusal at its index.
 */
const readTwo = <A>(
  payload: unknown,
  path: string,
  readElement: (node: unknown, at: string) => Read<A>,
): Read<readonly [A, A]> => {
  if (!isList(payload) || payload.length !== 2) {
    return refuse("malformed", path);
  }

  return Result.flatMap(readElement(payload[0], element(path, 0)), (first) =>
    Result.map(readElement(payload[1], element(path, 1)), (second): readonly [A, A] => [
      first,
      second,
    ]),
  );
};

/**
 * Present a value read: not NULL.
 *
 * @param single The value.
 * @returns A successful reading that holds it.
 */
const found = (single: Single): Read<Option.Option<Single>> => Result.succeedSome(single);

/**
 * Read a pair or a directed pair: two identifiers, kept in written order, the source first.
 *
 * @param baseType Which of the two to read.
 * @param payload The node.
 * @param path Its path.
 * @returns The value, or the reason the node is not two NCNames.
 */
const readPair = (
  baseType: "directedPair" | "pair",
  payload: unknown,
  path: string,
): Read<Option.Option<Single>> =>
  Result.flatMap(readTwo(payload, path, readIdentifier), (value) => found({ baseType, value }));

/**
 * The seconds-only duration `PT<seconds>S` as {@link toPciJson} writes it: the lexical forms
 * `format` writes a float in, a sign, a decimal, a lowercase exponent, `INF` and `NaN`. Read
 * through the value model's own lexical reading, so a duration reads as a float does.
 */
const writtenSeconds = /^PT(?<seconds>-?(?:[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?|INF)|NaN)S$/u;

/**
 * The ISO 8601 day-time duration, or weeks alone: `PnDTnHnMnS`, each part optional but one, `T`
 * only before a time part, a fraction on the seconds alone; `PnW`.
 */
const dayTime =
  /^P(?=[0-9]|T[0-9])(?:(?<weeks>[0-9]+)W|(?:(?<days>[0-9]+)D)?(?:T(?=[0-9])(?:(?<hours>[0-9]+)H)?(?:(?<minutes>[0-9]+)M)?(?:(?<seconds>[0-9]+(?:\.[0-9]+)?)S)?)?)$/u;

/**
 * An ISO 8601 duration in the same form with years or months, which no fixed number of seconds
 * names. `years` or `months` is present when it has them.
 */
const calendar =
  /^P(?=[0-9])(?:(?<years>[0-9]+)Y)?(?:(?<months>[0-9]+)M)?(?:[0-9]+D)?(?:T(?=[0-9])(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+(?:\.[0-9]+)?S)?)?$/u;

/**
 * The seconds each part of {@link dayTime} stands for, by its group name.
 */
const secondsPerPart: readonly (readonly [part: string, seconds: number])[] = [
  ["weeks", 604_800],
  ["days", 86_400],
  ["hours", 3600],
  ["minutes", 60],
  ["seconds", 1],
];

/**
 * Add up the parts of a day-time duration.
 *
 * @param groups The named groups of {@link dayTime}.
 * @returns The seconds. A sum past the largest finite double is the largest finite double, as
 *   reading 56 reads a literal there for a float or duration.
 */
const durationSeconds = (groups: Readonly<Record<string, string | undefined>>): number => {
  const seconds = secondsPerPart.reduce(
    (sum, [part, size]) => sum + Number(groups[part] ?? "0") * size,
    0,
  );

  return Number.isFinite(seconds) ? seconds : Number.MAX_VALUE;
};

/**
 * Read a JSON ISO 8601 duration as a number of seconds (J1).
 *
 * @param payload The node.
 * @param path Its path.
 * @returns The duration; `duration-calendar` for years or months, and `malformed` for a node that
 *   is no string or no duration of the forms the module documents.
 */
const readDuration = (payload: unknown, path: string): Read<Option.Option<Single>> => {
  if (!isString(payload)) {
    return refuse("malformed", path);
  }

  const seconds = writtenSeconds.exec(payload)?.groups?.["seconds"];

  if (seconds !== undefined) {
    return parseLexical("duration", seconds).pipe(
      Result.mapError((): PciJsonRefused => ({ path, reason: "malformed" })),
      Result.map(Option.some),
    );
  }

  const groups = dayTime.exec(payload)?.groups;

  if (groups !== undefined) {
    return found({ baseType: "duration", value: durationSeconds(groups) });
  }

  const calendared = calendar.exec(payload)?.groups;

  return calendared?.["years"] === undefined && calendared?.["months"] === undefined
    ? refuse("malformed", path)
    : refuse("duration-calendar", path);
};

/**
 * Read a node as a value of each modelled base type: the value, or none for NULL, which only an
 * empty `string` is. Each is JSON's own type for it, Appendix C's table: a boolean, an integer, a
 * number, a string, `[x, y]`, `["a", "b"]` and an ISO 8601 duration string.
 */
const readers = {
  boolean: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    isBoolean(payload) ? found({ baseType: "boolean", value: payload }) : refuse("malformed", path),
  directedPair: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    readPair("directedPair", payload, path),
  duration: readDuration,
  float: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    isNumber(payload) ? found({ baseType: "float", value: payload }) : refuse("malformed", path),
  identifier: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    Result.flatMap(readIdentifier(payload, path), (value) =>
      found({ baseType: "identifier", value }),
    ),
  integer: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    Result.flatMap(readSafeInteger(payload, path), (value) =>
      found({ baseType: "integer", value }),
    ),
  pair: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    readPair("pair", payload, path),
  point: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    Result.flatMap(readTwo(payload, path, readSafeInteger), (value) =>
      found({ baseType: "point", value }),
    ),
  string: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    Result.flatMap(readText(payload, path), (value): Read<Option.Option<Single>> =>
      value === "" ? Result.succeedNone : found({ baseType: "string", value }),
    ),
  uri: (payload: unknown, path: string): Read<Option.Option<Single>> =>
    Result.flatMap(readText(payload, path), (value) => found({ baseType: "uri", value })),
} satisfies Record<
  ModelledBaseType,
  (payload: unknown, path: string) => Read<Option.Option<Single>>
>;

/**
 * Read a `base`: NULL, or one value keyed by the declared base type.
 *
 * @param container The `base`'s node.
 * @param declared The declaration, of cardinality `single`.
 * @param path The container's path.
 * @returns A single value, NULL for `null` and for an empty `string`.
 */
const readBase = (container: unknown, declared: ValueDeclared, path: string): Read<ResponseValue> =>
  container === null
    ? Result.succeed(nullOf(declared.baseType, declared.cardinality))
    : readTyped(container, path).pipe(
        Result.flatMap((typed) => declaredOnly(typed, declared.baseType)),
        Result.flatMap((typed) => readers[typed.baseType](typed.payload, typed.path)),
        Result.map((single): ResponseValue => ({
          baseType: declared.baseType,
          cardinality: declared.cardinality,
          values: Option.match(single, { onNone: () => [], onSome: (value) => [value] }),
        })),
      );

/**
 * Read each element of a list, none of which may be NULL: a container holds values only.
 *
 * @param baseType The elements' base type.
 * @param items The array's elements. A hole of a sparse array, which a structured clone keeps, is
 *   read as `undefined`, so it is `malformed` where it stands.
 * @param path The array's path.
 * @returns The values in order, or the first refusal.
 */
const readElements = (
  baseType: ModelledBaseType,
  items: readonly unknown[],
  path: string,
): Read<readonly Single[]> =>
  Result.all(
    Array.from(items, (item, index): Read<Single> =>
      Result.flatMap(readers[baseType](item, element(path, index)), (single) =>
        Option.isSome(single)
          ? Result.succeed(single.value)
          : refuse("malformed", element(path, index)),
      ),
    ),
  );

/**
 * Read a `list`: NULL, or one array keyed by the declared base type.
 *
 * @param container The `list`'s node.
 * @param declared The declaration, of cardinality `multiple` or `ordered`.
 * @param path The container's path.
 * @returns A container of the declared cardinality; an empty array is NULL.
 */
const readList = (container: unknown, declared: ValueDeclared, path: string): Read<ResponseValue> =>
  container === null
    ? Result.succeed(nullOf(declared.baseType, declared.cardinality))
    : readTyped(container, path).pipe(
        Result.flatMap((typed) => declaredOnly(typed, declared.baseType)),
        Result.flatMap((typed) =>
          isList(typed.payload)
            ? readElements(typed.baseType, typed.payload, typed.path)
            : refuse("malformed", typed.path),
        ),
        Result.map((values): ResponseValue => ({
          baseType: declared.baseType,
          cardinality: declared.cardinality,
          values,
        })),
      );

/**
 * Read one entry of a `record`: its name and its `base`.
 *
 * @param entry The entry's node.
 * @param path The entry's path.
 * @param seen The names the earlier entries gave, which this entry's joins.
 * @returns The field, or none when its `base` is NULL (J5). `malformed` for an entry that is no
 *   object with a `name` and a `base` and nothing else, a name that is no NCName or that an
 *   earlier entry gave, or a `base` that is no object; a field's base type is any modelled one.
 */
const readEntry = (
  entry: unknown,
  path: string,
  seen: Set<string>,
): Read<Option.Option<RecordField>> => {
  if (!isObject(entry)) {
    return refuse("malformed", path);
  }

  const extra = Object.keys(entry).find((key) => key !== "name" && key !== "base");

  if (extra !== undefined) {
    return refuse("malformed", member(path, extra));
  }

  const name = own(entry, "name");

  if (!isString(name) || !isNcName(name) || seen.has(name)) {
    return refuse("malformed", member(path, "name"));
  }

  seen.add(name);

  const base = own(entry, "base");

  return base === null
    ? Result.succeedNone
    : readTyped(base, member(path, "base")).pipe(
        Result.flatMap((typed) => readers[typed.baseType](typed.payload, typed.path)),
        Result.map(Option.map((value): RecordField => ({ identifier: name, value }))),
      );
};

/**
 * Read a `record`: NULL, or an array of named fields.
 *
 * @param container The `record`'s node.
 * @param path The container's path.
 * @returns The record with its non-NULL fields in written order; none is the NULL record.
 */
const readRecord = (container: unknown, path: string): Read<RecordValue> => {
  if (container === null) {
    return Result.succeed(nullRecord);
  }

  if (!isList(container)) {
    return refuse("malformed", path);
  }

  const seen = new Set<string>();
  const fields: RecordField[] = [];

  for (const [index, entry] of container.entries()) {
    const read = readEntry(entry, element(path, index), seen);

    if (Result.isFailure(read)) {
      return Result.fail(read.failure);
    }

    if (Option.isSome(read.success)) {
      fields.push(read.success.value);
    }
  }

  return Result.succeed({ cardinality: "record", fields });
};

/**
 * Refuse the one key of a JSON object that its declaration does not take.
 *
 * @param key The key.
 * @param path The key's path.
 * @returns `cardinality-mismatch` for `base`, `list` and `record`, which Appendix C does name, and
 *   `malformed` for any other key.
 */
const mismatch = (key: string, path: string): Result.Result<never, PciJsonRefused> =>
  key === "base" || key === "list" || key === "record"
    ? refuse("cardinality-mismatch", path)
    : refuse("malformed", path);

/**
 * Read parsed JSON as a value of a resolved declaration.
 *
 * @param json The node, or undefined.
 * @param declared The resolved declaration.
 * @returns The value, or `malformed` at the root for JSON that is not one object with one key,
 *   `cardinality-mismatch` at that key for a key of another cardinality, and `malformed` at the
 *   key for any other key.
 */
const readAs = (json: unknown, declared: Resolved): Read<ResponseValue> => {
  if (json === undefined) {
    return Result.succeed(
      declared.cardinality === "record"
        ? nullRecord
        : nullOf(declared.baseType, declared.cardinality),
    );
  }

  const keys = isObject(json) ? Object.keys(json) : [];
  const [key] = keys;

  if (!isObject(json) || key === undefined || keys.length !== 1) {
    return refuse("malformed", "$");
  }

  const at = member("$", key);
  const container = json[key];

  if (declared.cardinality === "record") {
    return key === "record" ? readRecord(container, at) : mismatch(key, at);
  }

  if (declared.cardinality === "single") {
    return key === "base" ? readBase(container, declared, at) : mismatch(key, at);
  }

  return key === "list" ? readList(container, declared, at) : mismatch(key, at);
};

/**
 * Read Appendix C JSON (parsed, or `undefined`) as a value of a declared base type and cardinality
 * (J1 to J6); `record` takes no base type.
 *
 * `undefined` is what a portable custom interaction's `getResponse()` returns for "not yet
 * interacted, or not valid", and reads as NULL like every NULL form (J4). The first thing that does
 * not fit stops the reading, so a refusal names one path.
 *
 * @param json The JSON a PCI returned, parsed; never text. A function, a symbol or a bigint at the
 *   root is `malformed`.
 * @param declared The response declaration the JSON must fit.
 * @returns The value of the declared base type and cardinality: a {@link ResponseValue} whose
 *   `cardinality` is `declared`'s, NULL when the JSON is a NULL form; or the {@link PciJsonRefused}
 *   with the reason and the path.
 */
export const fromPciJson = (
  json: unknown,
  declared: PciJsonDeclared,
): Result.Result<ResponseValue, PciJsonRefused> =>
  Result.flatMap(resolve(declared), (resolved) => readAs(json, resolved));
