/**
 * The MathML `m:cn` content guard: the text of a number element read against the lexical form its
 * `type` gives, and against its `base` (spec MA18, C13).
 *
 * The Recommendation says of every number type that it "implies that the content be of a certain
 * form" (MathML 3, `c4#contm.cn`), and no statement over stored rows can say so: the form depends
 * on a sibling attribute and the `m:sep` children split the text into parts. {@link cnFinding}
 * reads the rows an import built and refuses before any is written.
 *
 * ## The forms
 *
 * - `integer`: an optional sign and one or more digits (`c4#contm.cn.strict`).
 * - `real`: an optional sign and digits, with at most one decimal point between an integer and a
 *   fractional part, one of which may be empty (`c4#contm.cn.strict`). A `cn` with no `type` is a
 *   `real` (`c4#contm.cn.extended`: "If the type attribute is omitted, it defaults to real").
 * - `double`: the `xs:double` lexical space, which the Recommendation points to (XML Schema Part 2,
 *   3.2.5.1): a decimal with an optional exponent, `INF`, `-INF`, `+INF` or `NaN`.
 * - `hexdouble`: sixteen digits of `0-9` and `A-F` (`c4#contm.cn.strict`). The Recommendation's own
 *   example holds eight digits (`7F800000`), against its text; the text is the rule here.
 * - `e-notation`: two parts, a real significand and an integer exponent (`c4#contm.cn.extended`).
 * - `rational`: two integers, numerator and denominator.
 * - `complex-cartesian` and `complex-polar`: two reals.
 *
 * Every other `type` value, `constant` among them, names no form (`c4#contm.cn.extended`: the value
 * is "text"), so its content is not judged. The parts of a two-part type are separated by exactly
 * one `m:sep`, and the single-part types hold none.
 *
 * ## The base
 *
 * `base` defaults to 10 and gives the radix of the digits of every integer and real part. Digits
 * are `0-9` and then the Latin letters in alphabetical order, case not significant, so a digit is
 * valid when its value is below the base (`c4#contm.cn.extended`). Above 36 the digits beyond the
 * alphabet are "application specific", so every letter and number stays valid. The base is the
 * `MathmlBase` row's text read as a `bigint`. `double` and `hexdouble` state their own digits and
 * ignore it.
 *
 * ## The text
 *
 * A part's text is the text of its `TextNode` and `Ws` children in order, with leading and
 * trailing whitespace removed and each internal run of whitespace made one space, as the
 * Recommendation's token rule states (`c2#fund.collapse`: whitespace is U+0020, U+0009, U+000A and
 * U+000D). A part that holds an element or an entity reference besides text (an `m:mglyph` or a
 * presentation expression, which the full schema allows) has no text to judge and is left alone.
 */
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { MathmlBase, MathmlString } from "#pantry/schema/mathml/attributes.ts";
import { Edge, Node, TextNode, Ws } from "#pantry/schema/node.ts";

/**
 * The forms a part of a number can take.
 */
type Form = "double" | "hexdouble" | "integer" | "real";

/**
 * What a `type` implies for its content: the form of each part, so the length is the number of
 * parts and the `m:sep` children between them is one fewer.
 */
const forms: ReadonlyMap<string, readonly Form[]> = new Map<string, readonly Form[]>([
  ["complex-cartesian", ["real", "real"]],
  ["complex-polar", ["real", "real"]],
  ["double", ["double"]],
  ["e-notation", ["real", "integer"]],
  ["hexdouble", ["hexdouble"]],
  ["integer", ["integer"]],
  ["rational", ["integer", "integer"]],
  ["real", ["real"]],
]);

/**
 * The type of a `cn` that has none.
 */
const defaultType = "real";

/**
 * The base of a `cn` that has none.
 */
const defaultBase = 10n;

/**
 * The lexical space of `xs:double` (XML Schema Part 2, 3.2.5.1).
 */
const doubleForm = /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|[+-]?INF|NaN)$/u;

/**
 * The lexical space of `hexdouble`: sixteen digits of `0-9` and `A-F`.
 */
const hexdoubleForm = /^[0-9A-F]{16}$/u;

/**
 * Collapse a part's whitespace as the token rule states.
 *
 * @param text - The part's raw text.
 * @returns The text without leading or trailing whitespace and with each run collapsed.
 */
const collapsed = (text: string): string =>
  text
    .replaceAll(/[\t\n\r ]+/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * The value of a digit in the alphabet `0-9` then `A-Z`, case not significant.
 *
 * @param digit - One character.
 * @returns Its value, or nothing when it is no digit of any base.
 */
const digitValue = (digit: string): number | undefined => {
  if (/^[0-9]$/u.test(digit)) {
    return Number(digit);
  }

  if (/^[A-Za-z]$/u.test(digit)) {
    return Number.parseInt(digit, 36);
  }

  return undefined;
};

/**
 * Whether a run is one or more digits of a base.
 *
 * @param run - The text between signs and points.
 * @param base - The radix.
 * @returns Whether the run is not empty and every character is a digit below the base.
 */
const digitsOf = (run: string, base: bigint): boolean => {
  for (const digit of run) {
    const value = digitValue(digit);
    if (value === undefined || BigInt(value) >= base) {
      return false;
    }
  }

  return run.length > 0;
};

/**
 * Whether a text has the lexical form.
 *
 * @param form - The form a part takes.
 * @param text - The part's collapsed text.
 * @param base - The radix of its digits.
 * @returns Whether the text is in the form.
 */
const hasForm = (form: Form, text: string, base: bigint): boolean => {
  if (form === "double") {
    return doubleForm.test(text);
  }

  if (form === "hexdouble") {
    return hexdoubleForm.test(text);
  }

  const unsigned = text.replace(/^[+-]/u, "");
  if (form === "integer") {
    return digitsOf(unsigned, base);
  }

  const [whole = "", fraction = "", ...rest] = unsigned.split(".");
  const hasDigit = whole.length + fraction.length > 0;
  const wholeOk = whole.length === 0 || digitsOf(whole, base);
  const fractionOk = fraction.length === 0 || digitsOf(fraction, base);

  return rest.length === 0 && hasDigit && wholeOk && fractionOk;
};

/**
 * One part of a `cn`: the text between two `m:sep` children, or undefined when it holds more than
 * text.
 */
interface Part {
  readonly judged: boolean;
  readonly text: string;
}

/**
 * The kinds of children a part's text is made of or ignores: text, whitespace, comments and
 * processing instructions.
 */
const textual: ReadonlySet<string> = new Set(["comment", "pi", "text", "ws"]);

/**
 * Describe a refusal.
 *
 * @param node - The `m:cn` node: its id and schema version.
 * @param node.id - The node's id.
 * @param node.version - The schema version the node is read under.
 * @param type - The effective `type`.
 * @param why - What is wrong with the content.
 * @returns The refusal under `attribute-lexical`.
 */
const refusal = (
  node: { readonly id: string; readonly version: string },
  type: string,
  why: string,
): ImportRefused =>
  new ImportRefused({
    detail: `m:cn ${node.id} (${node.version}) of type ${type}: ${why}. Write the number in the form its type gives, with exactly the m:sep children that form takes, and digits that are valid in its base.`,
    rule: "attribute-lexical",
  });

/**
 * The parts of a `cn` and how many `m:sep` children separated them.
 */
interface PartsOf {
  readonly parts: readonly Part[];
  readonly separators: number;
}

/**
 * Split a `cn`'s children into the parts the `m:sep` children separate.
 *
 * @param children - The children's kinds and ids, in document order.
 * @param text - The text of every text and whitespace node, by id.
 * @returns The parts, and how many `m:sep` separated them.
 */
const partsOf = (
  children: readonly { readonly child: string; readonly childKind: string }[],
  text: ReadonlyMap<string, string>,
): PartsOf => {
  const parts: Part[] = [];
  let current = { judged: true, raw: "" };
  for (const { child, childKind } of children) {
    if (childKind === "m:sep") {
      parts.push({ judged: current.judged, text: collapsed(current.raw) });
      current = { judged: true, raw: "" };
    } else if (textual.has(childKind)) {
      current = { judged: current.judged, raw: current.raw + (text.get(child) ?? "") };
    } else {
      current = { judged: false, raw: current.raw };
    }
  }

  parts.push({ judged: current.judged, text: collapsed(current.raw) });

  return { parts, separators: parts.length - 1 };
};

/**
 * Refuse the first `m:cn`, in the order the importer built its nodes (document order), whose
 * content is not the form its type gives or holds a digit its base does not have.
 *
 * It reads each `Node` row of kind `m:cn`, its `type` (`MathmlString`, default `real`) and `base`
 * (`MathmlBase`, default 10), and the children its `Edge` rows give in `position` order. No row is
 * written.
 *
 * @param rows - The rows an import built for one package.
 * @returns The refusal for the first offending `m:cn`, or nothing when every one is well formed.
 */
export const cnFinding = (rows: Rows): ImportRefused | undefined => {
  const edges = Map.groupBy(
    Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position)),
    (edge) => edge.parent,
  );
  const text = new Map(
    [...Rows.of(rows, TextNode), ...Rows.of(rows, Ws)].map((row) => [row.id, row.value]),
  );
  const types = new Map(
    Rows.of(rows, MathmlString)
      .filter((row) => row.kind === "m:cn" && row.attribute === "type")
      .map((row) => [row.node, row.value]),
  );
  const bases = new Map(
    Rows.of(rows, MathmlBase)
      .filter((row) => row.kind === "m:cn" && row.attribute === "base")
      .map((row) => [row.node, /^[0-9]+$/u.test(row.value) ? BigInt(row.value) : defaultBase]),
  );

  for (const node of Rows.of(rows, Node)) {
    const type = types.get(node.id) ?? defaultType;
    const expected = forms.get(type);
    if (node.kind !== "m:cn" || expected === undefined) {
      continue;
    }

    const { parts, separators } = partsOf(edges.get(node.id) ?? [], text);
    if (separators !== expected.length - 1) {
      return refusal(
        node,
        type,
        `it holds ${separators} m:sep but the type takes ${expected.length - 1}, separating ${expected.length} part${expected.length === 1 ? "" : "s"}`,
      );
    }

    const base = bases.get(node.id) ?? defaultBase;
    for (const [index, form] of expected.entries()) {
      const part = parts[index];
      if (part !== undefined && part.judged && !hasForm(form, part.text, base)) {
        const radix = form === "double" || form === "hexdouble" ? "" : ` in base ${base}`;

        return refusal(
          node,
          type,
          `part ${index + 1} reads "${part.text}", which is not a ${form}${radix}`,
        );
      }
    }
  }

  return undefined;
};
