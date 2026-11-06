/**
 * The comparison family of the item model: the kind rules and reader specs of `qti-match` and
 * `qti-equal`, and the unlanded rule and stub reader spec of each kind the family has not landed
 * (`qti-gt`, `qti-gte`, `qti-lt`, `qti-lte`, `qti-duration-lt` and `qti-duration-gte`), which its
 * slice (`p7-03`) replaces.
 *
 * It value-imports only `effect`, `#plate/model/expression.ts` and the leaf
 * `#plate/model/attributes.ts`, and names the registry's reader types with `import type` only, so
 * the registry in `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { Effect, Option } from "effect";
import { elementsOf, enumerated, valueOf, xsBoolean } from "#plate/model/attributes.ts";
import {
  acceptsAnyOperands,
  everyOperand,
  floatOrRefOf,
  singleOf,
  toleranceModes,
  unlandedRule,
} from "#plate/model/expression.ts";
import type { FamilyRules, FloatOrRef, KindRule } from "#plate/model/expression.ts";
import type {
  FamilyReaders,
  ReaderSpec,
  UnlandedReader,
  Variant,
} from "#plate/model/expressions/read.ts";

/**
 * The rule of `qti-match`: a single boolean. It judges no operand yet: the qti package's rule, two
 * operands of one type and no duration, lands with the family's slice (`p7-03`), so the model
 * refuses nothing new before then.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMatch
 */
const matchRule: KindRule = {
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: () => singleOf("boolean"),
};

/**
 * The rule of `qti-equal`: a single boolean, of "two sub-expressions which must both have single
 * cardinality and have a numerical base-type" (`info-compact.txt:11415`). Numerical is integer or
 * float, never duration, as the qti package reads it, so each operand of another type is a
 * mismatch that accepts `integer` and `float`, `single`.
 *
 * Its `tolerance` may name a variable, but a reference there is not checked and the facet entry
 * arrives with the family's slice (`p7-03`), when the modes that read it run.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpEqual
 */
const equalRule: KindRule = {
  operandsAccept: everyOperand(["integer", "float"], ["single"]),
  references: [],
  resultType: () => singleOf("boolean"),
};

/**
 * The comparison family's kind rules by kind: M1's `match` and `equal`, and the unlanded rule for
 * each kind the family has not landed.
 */
export const comparisonRules: FamilyRules<
  "duration-gte" | "duration-lt" | "equal" | "gt" | "gte" | "lt" | "lte" | "match"
> = {
  "duration-gte": unlandedRule,
  "duration-lt": unlandedRule,
  equal: equalRule,
  gt: unlandedRule,
  gte: unlandedRule,
  lt: unlandedRule,
  lte: unlandedRule,
  match: matchRule,
};

/**
 * A run of XML whitespace, which separates the tokens of an XSD list such as `tolerance`.
 */
const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * The reader spec of `qti-match`: its two operands, and no attribute.
 */
const matchReader: ReaderSpec<"match"> = {
  _tag: "generic",
  arity: "two",
  attributes: () => Effect.succeed((operands) => ({ kind: "match", operands })),
};

/**
 * The reader spec of `qti-equal`: its two operands and its attributes, in its default `exact`
 * tolerance mode.
 *
 * Its `tolerance-mode`, `tolerance`, `include-lower-bound` and `include-upper-bound` are read in
 * every mode, with the XSD's defaults: `exact`, no tolerance, and both bounds included. Each token
 * of `tolerance`, an XSD list whose tokens are a number or a variable's name, is classified by
 * `floatOrRefOf`, so a token that names nothing is held as a reference and marks nothing here.
 * A `qti-equal` in its `absolute` or `relative` mode is the mark `tolerance-mode="<mode>"` at its
 * path, and its operands are read after it, so every element in them the engine does not run is
 * marked too; it builds nothing.
 *
 * Its read fails, as a document the validator refuses first would, with `attribute-type` for a
 * `tolerance-mode` outside its three values and `value-type` for a bound outside `xs:boolean`.
 */
const equalReader: ReaderSpec<"equal"> = {
  _tag: "custom",
  read: (context, element) =>
    Effect.gen(function* readEqual() {
      const [left, right, ...extra] = elementsOf(element);
      if (left === undefined || right === undefined || extra.length > 0) {
        return yield* context.unread(element);
      }

      const mode = Option.getOrElse(
        yield* enumerated(context.walk, element, "tolerance-mode", toleranceModes),
        () => "exact" as const,
      );
      const includeLowerBound = yield* xsBoolean(
        context.walk,
        element,
        "include-lower-bound",
        true,
      );
      const includeUpperBound = yield* xsBoolean(
        context.walk,
        element,
        "include-upper-bound",
        true,
      );
      const tolerance = Option.match(valueOf(element, "tolerance"), {
        onNone: (): readonly FloatOrRef[] => [],
        onSome: (written) =>
          written
            .split(xmlWhitespaceRun)
            .filter((token) => token !== "")
            .map((token) => floatOrRefOf(token)),
      });
      if (mode !== "exact") {
        yield* context.mark(element, `tolerance-mode="${mode}"`);
      }

      const read = Option.all([yield* context.expression(left), yield* context.expression(right)]);
      const equal = read.pipe(
        Option.map((pair): Variant<"equal"> => ({
          includeLowerBound,
          includeUpperBound,
          kind: "equal",
          operands: pair,
          tolerance,
          toleranceMode: mode,
        })),
      );

      return mode === "exact" ? equal : Option.none();
    }),
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The comparison family's reader specs by kind: M1's `match` and `equal`, and the stub for each
 * kind the family has not landed.
 */
export const comparisonReaders: FamilyReaders<
  "duration-gte" | "duration-lt" | "equal" | "gt" | "gte" | "lt" | "lte" | "match"
> = {
  "duration-gte": unlanded,
  "duration-lt": unlanded,
  equal: equalReader,
  gt: unlanded,
  gte: unlanded,
  lt: unlanded,
  lte: unlanded,
  match: matchReader,
};
