/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The usage guards: the facts about a usage-data document's rows that no single relation can
 * state, judged over the rows an import built before any of them is written.
 */
import { Effect, Predicate, Schema } from "effect";
import { collapse, replace, Rows, valueText } from "#qti/import/tree.ts";
import type { WhiteSpace } from "#qti/import/tree.ts";
import { AttributeLexical, Edge, EntityReference, TextNode, Ws } from "#qti/schema/node.ts";
import * as ud from "#qti/schema/usage.ts";

/**
 * A usage-data guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class UsageGuardRefusal extends Schema.TaggedError<UsageGuardRefusal>()(
  "UsageGuardRefusal",
  {
    detail: Schema.String,
    rule: Schema.Literals(["ordering", "calendar", "text-copy", "typed-copy"]),
  },
) {}

/**
 * The first refusal a check finds, or nothing when its rows are sound.
 */
type Finding = UsageGuardRefusal | undefined;

const refuse = (rule: UsageGuardRefusal["rule"], detail: string): UsageGuardRefusal =>
  new UsageGuardRefusal({ detail, rule });

const quoted = (text: string): string => JSON.stringify(text);

/**
 * `ordering` (spec 4.10): under a statistic every target object precedes the value or mapping. The
 * statistics themselves are an unordered choice and are not judged.
 */
const ordering = (rows: Rows): Finding => {
  const statistics = new Set(Rows.of(rows, ud.Statistic).map((row) => row.id));
  const children = Map.groupBy(
    Rows.of(rows, Edge)
      .filter((edge) => statistics.has(edge.parent))
      .toSorted((a, b) => Number(a.position - b.position)),
    (edge) => edge.parent,
  );
  for (const [statistic, edges] of children) {
    const answer = edges.find(
      (edge) => edge.childKind === "ud:value" || edge.childKind === "ud:mapping",
    );
    const late = edges.find(
      (edge) =>
        edge.childKind === "ud:targetObject" &&
        answer !== undefined &&
        edge.position > answer.position,
    );
    if (answer !== undefined && late !== undefined) {
      return refuse(
        "ordering",
        `Under the statistic ${statistic}, the target object ${late.child} follows the ${answer.childKind.slice(3)} ${answer.child}; a statistic holds its target objects, then its value or mapping.`,
      );
    }
  }

  return undefined;
};

/**
 * Whether `year` is a leap year of the proleptic Gregorian calendar.
 */
const isLeap = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

/**
 * The days in a month of a year.
 */
const daysIn = (year: number, month: number): number => {
  if (month === 2) {
    return isLeap(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/**
 * `calendar` (spec 4.10 and 4.14): every `lastUpdated` names a real day. The column's pattern holds
 * the ranges of month and day a regular expression can state; month lengths and leap years are
 * judged here.
 */
const calendar = (rows: Rows): Finding => {
  for (const row of Rows.of(rows, ud.StatisticLastUpdated)) {
    const parts = /^(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2})$/u.exec(row.value);
    if (parts === null) {
      continue;
    }

    const { year = "", month = "", day = "" } = parts.groups ?? {};
    if (Number(day) > daysIn(Number(year), Number(month))) {
      return refuse(
        "calendar",
        `The lastUpdated ${quoted(row.value)} of the statistic ${row.node} names no real day.`,
      );
    }
  }

  return undefined;
};

/**
 * The character content of every node as its `text`, `ws` and `entityRef` children give it, in
 * order.
 */
const contents = (rows: Rows): ReadonlyMap<string, string> => {
  const pieces = new Map([
    ...Rows.of(rows, TextNode).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, Ws).map((row): [string, string] => [row.id, row.value]),
    ...Rows.of(rows, EntityReference).map((row): [string, string] => [row.id, `&${row.name};`]),
  ]);
  const children = Map.groupBy(
    Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position)),
    (edge) => edge.parent,
  );

  return new Map(
    Rows.of(rows, ud.UsageValue).map((row): [string, string] => [
      row.id,
      (children.get(row.id) ?? []).map((edge) => pieces.get(edge.child) ?? "").join(""),
    ]),
  );
};

/**
 * `text-copy`: a value holds the `replace`d text of its node and its `collapsed` is the collapse of
 * that value.
 */
const textCopy = (rows: Rows): Finding => {
  const text = contents(rows);
  for (const row of Rows.of(rows, ud.UsageValue)) {
    const expected = replace(text.get(row.id) ?? "");
    if (row.value !== expected) {
      return refuse(
        "text-copy",
        `UsageValue ${row.id} holds ${quoted(row.value)}; its text children give ${quoted(expected)}.`,
      );
    }

    if (row.collapsed !== collapse(row.value)) {
      return refuse(
        "text-copy",
        `UsageValue ${row.id} holds collapsed ${quoted(row.collapsed)}; the collapse of its value is ${quoted(collapse(row.value))}.`,
      );
    }
  }

  return undefined;
};

/**
 * A usage attribute that may carry an `AttributeLexical` row: its whitespace class and the typed
 * column its processed value is copied to.
 */
interface Shadow {
  readonly column: (rows: Rows, node: string) => string | undefined;
  readonly whiteSpace: WhiteSpace;
}

const processed = (value: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(value);
  }

  return whiteSpace === "replace" ? replace(value) : value;
};

const statistic = (rows: Rows, node: string) =>
  Rows.of(rows, ud.Statistic).find((row) => row.id === node);

const target = (rows: Rows, node: string) =>
  Rows.of(rows, ud.TargetObject).find((row) => row.id === node);

const mapEntry = (rows: Rows, node: string) =>
  Rows.of(rows, ud.UsageMapEntry).find((row) => row.id === node);

const mapping = (rows: Rows, node: string) =>
  Rows.of(rows, ud.UsageMapping).find((row) => row.id === node);

/**
 * The value of the optional relation's row for `node`.
 */
const optionalOf =
  (
    read: (rows: Rows) => readonly { readonly node: string; readonly value: string }[],
  ): Shadow["column"] =>
  (rows, node) =>
    read(rows).find((row) => row.node === node)?.value;

/**
 * Every usage attribute with a typed column, by element kind and attribute. An attribute the table
 * lacks has no typed column to shadow.
 */
const shadows: ReadonlyMap<string, Shadow> = new Map<string, Shadow>([
  ...["ud:ordinaryStatistic", "ud:categorizedStatistic"].flatMap((kind): [string, Shadow][] => [
    [
      `${kind}/name`,
      { column: (rows, node) => statistic(rows, node)?.name, whiteSpace: "collapse" },
    ],
    [
      `${kind}/context`,
      { column: (rows, node) => statistic(rows, node)?.context, whiteSpace: "collapse" },
    ],
    [
      `${kind}/glossary`,
      { column: optionalOf((rows) => Rows.of(rows, ud.StatisticGlossary)), whiteSpace: "collapse" },
    ],
    [
      `${kind}/caseCount`,
      {
        column: optionalOf((rows) => Rows.of(rows, ud.StatisticCaseCount)),
        whiteSpace: "collapse",
      },
    ],
    [
      `${kind}/stdError`,
      { column: optionalOf((rows) => Rows.of(rows, ud.StatisticStdError)), whiteSpace: "collapse" },
    ],
    [
      `${kind}/stdDeviation`,
      {
        column: optionalOf((rows) => Rows.of(rows, ud.StatisticStdDeviation)),
        whiteSpace: "collapse",
      },
    ],
    [
      `${kind}/lastUpdated`,
      {
        column: optionalOf((rows) => Rows.of(rows, ud.StatisticLastUpdated)),
        whiteSpace: "collapse",
      },
    ],
  ]),
  [
    "ud:usageData/glossary",
    { column: optionalOf((rows) => Rows.of(rows, ud.UsageDataGlossary)), whiteSpace: "collapse" },
  ],
  [
    "ud:targetObject/identifier",
    { column: (rows, node) => target(rows, node)?.identifier, whiteSpace: "preserve" },
  ],
  [
    "ud:targetObject/partIdentifier",
    {
      column: optionalOf((rows) => Rows.of(rows, ud.TargetObjectPartIdentifier)),
      whiteSpace: "collapse",
    },
  ],
  [
    "ud:targetObject/objectType",
    {
      column: optionalOf((rows) => Rows.of(rows, ud.TargetObjectObjectType)),
      whiteSpace: "preserve",
    },
  ],
  [
    "ud:value/fieldIdentifier",
    {
      column: (rows, node) =>
        Rows.of(rows, ud.UsageValueFieldIdentifier).find((row) => row.id === node)?.value,
      whiteSpace: "collapse",
    },
  ],
  [
    "ud:value/baseType",
    {
      column: (rows, node) =>
        Rows.of(rows, ud.UsageValueBaseType).find((row) => row.id === node)?.baseType,
      whiteSpace: "preserve",
    },
  ],
  [
    "ud:mapping/defaultValue",
    { column: (rows, node) => mapping(rows, node)?.defaultValue, whiteSpace: "collapse" },
  ],
  [
    "ud:mapping/lowerBound",
    {
      column: optionalOf((rows) => Rows.of(rows, ud.UsageMappingLowerBound)),
      whiteSpace: "collapse",
    },
  ],
  [
    "ud:mapping/upperBound",
    {
      column: optionalOf((rows) => Rows.of(rows, ud.UsageMappingUpperBound)),
      whiteSpace: "collapse",
    },
  ],
  [
    "ud:mapEntry/mapKey",
    { column: (rows, node) => mapEntry(rows, node)?.mapKey, whiteSpace: "replace" },
  ],
  [
    "ud:mapEntry/mappedValue",
    { column: (rows, node) => mapEntry(rows, node)?.mappedValue, whiteSpace: "collapse" },
  ],
  [
    "ud:mapEntry/caseSensitive",
    {
      column: optionalOf((rows) => Rows.of(rows, ud.UsageMapEntryCaseSensitive)),
      whiteSpace: "collapse",
    },
  ],
]);

/**
 * `typed-copy` of the lexical rows: each row of a usage node shadows a typed column, differs from
 * it as read, and processes under its attribute's class to it.
 */
const lexicalCopy = (rows: Rows): Finding => {
  for (const row of Rows.of(rows, AttributeLexical)) {
    if (!row.kind.startsWith("ud:")) {
      continue;
    }

    const shadow = shadows.get(`${row.kind}/${row.attribute}`);
    const typed = shadow?.column(rows, row.node);
    if (shadow === undefined || typed === undefined) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} shadows no typed column.`,
      );
    }

    const expected = processed(row.value, shadow.whiteSpace);
    if (expected !== typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} ${quoted(row.value)} of ${row.kind} ${row.node} processes to ${quoted(expected)}, and its column holds ${quoted(typed)}.`,
      );
    }

    if (row.value === typed) {
      return refuse(
        "typed-copy",
        `The lexical ${row.attribute} of ${row.kind} ${row.node} equals its column ${quoted(typed)}; a lexical row exists only where processing changed the value.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy` of a mapping's default: a mapping that wrote no `defaultValue` holds `0`. Where it
 * wrote one, the column is that attribute collapsed, which `lexicalCopy` judges against the
 * lexical row when processing changed the form.
 */
const defaultCopy = (rows: Rows): Finding => {
  const declared = new Set(Rows.of(rows, ud.DeclaredDefaultValue).map((row) => row.node));
  for (const row of Rows.of(rows, ud.UsageMapping)) {
    if (!declared.has(row.id) && row.defaultValue !== "0") {
      return refuse(
        "typed-copy",
        `UsageMapping ${row.id} wrote no defaultValue and holds ${quoted(row.defaultValue)}; the effective default is "0".`,
      );
    }
  }

  return undefined;
};

/**
 * The arms of `UsageTypedValue`: each holds the id of its value and the text it copies.
 */
const typedArms = Object.entries<unknown>(ud.relations)
  .filter(([name]) => name.startsWith("UsageTypedValue") && name !== "UsageTypedValue")
  .map(([, member]) => member)
  .filter((member): member is typeof ud.relations.UsageTypedValueFloat =>
    Predicate.hasProperty(member, "fields"),
  );

/**
 * `typed-copy` of the typed values: a `UsageTypedValue` and the arm row of its base type each hold
 * the text of their `UsageValue` read as `valueText` reads it, trimmed for every base type but
 * `string` (decision 157, item 1).
 */
const typedCopy = (rows: Rows): Finding => {
  const texts = new Map(Rows.of(rows, ud.UsageValue).map((row) => [row.id, row.value]));
  const baseTypes = new Map(Rows.of(rows, ud.UsageTypedValue).map((row) => [row.id, row.baseType]));
  const held: readonly { readonly name: string; readonly id: string; readonly value: string }[] = [
    ...Rows.of(rows, ud.UsageTypedValue).map((row) => ({ ...row, name: "UsageTypedValue" })),
    ...typedArms.flatMap((arm) => Rows.of(rows, arm).map((row) => ({ ...row, name: arm.name }))),
  ];
  for (const row of held) {
    const text = texts.get(row.id);
    const baseType = baseTypes.get(row.id);
    const expected =
      text === undefined || baseType === undefined ? text : valueText(baseType, text);
    if (row.value !== expected) {
      return refuse(
        "typed-copy",
        `${row.name} ${row.id} holds ${quoted(row.value)}; its UsageValue holds ${quoted(text ?? "")}, which reads as ${quoted(expected ?? "")}.`,
      );
    }
  }

  return undefined;
};

/**
 * `typed-copy` of the map keys: a key holds no tab, line feed or carriage return, as the `replace`
 * class guarantees.
 */
const mapKeys = (rows: Rows): Finding => {
  const found = Rows.of(rows, ud.UsageMapEntry).find((row) => replace(row.mapKey) !== row.mapKey);

  return found === undefined
    ? undefined
    : refuse(
        "typed-copy",
        `UsageMapEntry ${found.id} holds the mapKey ${quoted(found.mapKey)}; a replace-class value holds no tab, line feed or carriage return.`,
      );
};

/**
 * Refuse usage-data rows that break one of the four cross-relation facts: the order of a
 * statistic's children, the calendar validity of its date, the text copies and the typed copies.
 *
 * The first refusal found, in that order, is the failure. Reads rows only; writes nothing.
 *
 * @param rows - The rows the import built.
 * @returns Nothing when every guard passes; fails with the first {@link UsageGuardRefusal}
 *   otherwise.
 */
export const usageGuards = Effect.fn("usageGuards")(function* usageGuards(
  rows: Rows,
): Effect.fn.Return<void, UsageGuardRefusal> {
  const found =
    ordering(rows) ??
    calendar(rows) ??
    textCopy(rows) ??
    lexicalCopy(rows) ??
    defaultCopy(rows) ??
    typedCopy(rows) ??
    mapKeys(rows);
  if (found !== undefined) {
    yield* found;
  }
});
