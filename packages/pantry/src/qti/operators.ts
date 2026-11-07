/**
 * The operator attribute laws (spec readings 119 and 121; Aiden's review of PR #46, items 1 and 3):
 * what the information model asks of a rounding operator's `figures` and of an equality's
 * `tolerance` beyond the XSD, which types the one as `xs:integer` or a variable name and the other
 * as an unbounded list of `xs:string` or `xs:double`. Where the two differ, the stricter source is
 * the rule (readings 16 and 17).
 *
 * - **Reading 119** (rule `P10`): a `qti-equal-rounded`'s or a `qti-round-to`'s `figures` that is an
 *   integer is at least 1 under `significantFigures` and at least 0 under `decimalPlaces` ("If
 *   roundingMode= 'significantFigures', the value of figures must be a non-zero positive integer.
 *   If roundingMode='decimalPlaces', the value of figures must be an integer greater than or equal
 *   to zero", info §5.47.2 and §5.119.2). `rounding-mode` defaults to `significantFigures` on
 *   `qti-equal-rounded` (§5.47.1) and is required on `qti-round-to` (§5.119.1, AL3's). A `figures`
 *   that names a variable is read at run time, so it is not judged. {@link Rounding} holds each
 *   such element's `figures` and the mode in force.
 * - **Reading 121** (rule `P36`): under `tolerance-mode` `absolute` or `relative` a `qti-equal`
 *   carries a `tolerance` ("If the tolerance mode is absolute or relative then the tolerance must
 *   be specified", info §5.46.2), and every `tolerance` is one or two values ("The tolerance
 *   consists of two positive numbers, t0 and t1 ... If only one value is given it is used for
 *   both"), each that is a number above 0. A value is a number where it is written in `xs:double`'s
 *   lexical space, and otherwise a string, which names a variable read at run time (§9.1.5,
 *   ToleranceList: "a space separated list of either strings (must not contain a space) or
 *   numbers"). {@link Tolerance} holds each `tolerance`, split into its {@link ToleranceToken}s.
 *
 * `rounding-mode` and `tolerance-mode` are enumerations of `xs:string` under whiteSpace `preserve`,
 * so each value is its lexical form and AL1's lexical half refuses every other form. `figures` is a
 * union whose `xs:integer` member collapses whitespace and whose variable-name member preserves it
 * (decision 123), so its value is read collapsed; `tolerance` is a list, its items split at XML
 * whitespace.
 *
 * Every copy of an attribute into an overlay follows C18 the other way round, as `identity.ts`
 * states it: from `select(Attribute, φ)` into the overlay, beside a key over the same selection
 * whose UNIQUE serves the copy's reverse probe. Every copied text that takes part in a cross-row
 * equality is `keyText` (`#pantry/qti/limits.ts`). Every check is named by its oracle law
 * (`#pantry/test/oracle.ts` `LawName`) with spaces written as underscores.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_EqualRounded | QTI 3.0 information model, §5.47 EqualRounded}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_RoundTo | QTI 3.0 information model, §5.119 RoundTo}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Equal | QTI 3.0 information model, §5.46 Equal}
 */
import {
  accumulated,
  check,
  closedId,
  Compute,
  contained,
  drawn,
  fin,
  fold,
  key,
  lexicalForm,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { idValuePattern, spacePattern } from "#pantry/qti/identity.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";

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

/**
 * The null objects of a {@link Rounding} row whose element leaves an attribute unwritten, which AL3
 * refuses alone: `figuresLexical` and `figures` where it writes no `figures`, `mode` where a
 * `qti-round-to` writes no `rounding-mode`, and `figuresValue` where `figures` is no integer.
 * `mode`'s is grizzle-forced (FB-EXPR's report to main of 2026-11-07): `Rounding_figures` reads the
 * mode and the integer in one row, which no outer join builds from two optional rows.
 */
export const roundingUnwritten = { figures: "", figuresValue: 0n, mode: "" } as const;

/**
 * The tolerance modes under which a `qti-equal` compares within a range, and so carries a
 * `tolerance` (info §5.46.2).
 */
export const rangeModes = ["absolute", "relative"] as const;

/**
 * The lexical form of a `figures` that `Compute.cast` reads exactly: `xs:integer`'s, within the
 * signed 64-bit range spec reading 46 holds `figures` to, so every integer AL1's lexical half
 * admits is in it.
 */
export const integerForm = lexicalForm(pg.bigint);

/**
 * `xs:double`'s lexical space (XML Schema 1.0 Part 2 §3.2.5.1): a decimal mantissa with an
 * optional exponent, `INF`, `-INF` or `NaN`, unbounded in its digits. A tolerance value in it is a
 * number; any other is a string, which names a variable read at run time (spec reading 121).
 *
 * The test is by form, not by a cast: grizzle's double form bounds a mantissa to 15 significant
 * digits (`lexicalForm(pg["double precision"])`), so a longer negative number would fall outside
 * it and pass as a string.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-2/#double | XML Schema Part 2, 3.2.5 double}
 */
export const doublePattern =
  "^(?:[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|-?INF|NaN)$";

/**
 * The positive values of {@link doublePattern}'s space, read off the form: a mantissa with no `-`
 * and a digit other than 0, with any exponent, or `INF`. `NaN`, `-INF` and every zero, `-0` and
 * `0e5` among them, are no positive number.
 *
 * A positive mantissa with a large negative exponent, `1e-400`, is a positive number as written,
 * though binary64 rounds it to 0: "positive" is read of the number the value names, not of its
 * nearest double.
 */
export const positivePattern =
  "^(?:\\+?(?:[0-9]*[1-9][0-9]*(?:\\.[0-9]*)?|[0-9]*\\.[0-9]*[1-9][0-9]*)(?:[Ee][+-]?[0-9]+)?|INF)$";

/**
 * A rounding operator's `figures` and the mode in force, keyed by its node: one row for every
 * `qti-equal-rounded` and every `qti-round-to`.
 *
 * - **copied from `Node`:** its {@link nodeRef} tuple;
 * - **copied from the attribute:** `figuresLexical`, `figures` as written, and `mode`, its
 *   `rounding-mode`, where `modeWritten`;
 * - **the host's**, each proved by `E1_derived`: `figures`, the lexical form collapsed; `integer`,
 *   whether that is in {@link integerForm}; `figuresValue`, its integer, else 0; and an unwritten
 *   `mode`, `significantFigures` on a `qti-equal-rounded` (§5.47.1) and empty on a `qti-round-to`,
 *   whose mode AL3 requires.
 *
 * An element that writes no `figures` (AL3 refuses it) holds an empty `figures`, no integer.
 */
export const Rounding = relation(
  "Rounding",
  {
    document: uuid,
    figures: keyText,
    figuresLexical: keyText,
    figuresValue: pg.bigint,
    integer: pg.boolean,
    kind: closedId(NodeKind),
    mode: keyText,
    modeWritten: pg.boolean,
    nearest: uuid,
    node: uuid,
    parent: uuid,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One `qti-equal`'s `tolerance`, keyed by the element's node.
 *
 * - **copied from the attribute:** `node` and `lexical`, the value as written;
 * - **drawn:** `tokens`, its {@link ToleranceToken} count;
 * - **accumulated:** `tokenText`, the end of its tokens' concatenation.
 */
export const Tolerance = relation(
  "Tolerance",
  {
    lexical: keyText,
    node: uuid,
    tokenText: accumulated(keyText, ""),
    tokens: drawn(natural),
  },
  ["node"],
);

/**
 * One value of a `tolerance`, in order, with the whitespace written before and after it, so its
 * `piece` is a stretch of the value and the pieces concatenate to it, as `identity.ts`'s
 * `TextIdref` splits an element's text.
 *
 * - **the host's:** `before`, `token` and `after`, and `piece`, `before ‖ token ‖ after`, which
 *   `E1_derived` proves;
 * - **the family's group:** `node`, the `qti-equal`;
 * - **drawn:** `at`;
 * - **accumulated:** `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const ToleranceToken = relation(
  "ToleranceToken",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    node: uuid,
    piece: keyText,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    token: keyText,
  },
  ["node", "at"],
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const operatorRelations = { Rounding, Tolerance, ToleranceToken };

/**
 * Each `tolerance`'s values in order, counted by `Tolerance.tokens`.
 */
export const toleranceTokenFamily = ordered(
  on(ToleranceToken, "node", "at"),
  fin(Tolerance, "tokens"),
);

/**
 * The rounding operators, every one of which has its {@link Rounding} row.
 */
const roundingNodes = select(Node, (n) => n.in(n.kind, roundingKinds));

/**
 * A rounding operator's `figures`, the source of {@link Rounding}'s `figuresLexical`.
 */
const figuresAttributes = select(Attribute, (a) =>
  a.and(a.in(a.kind, roundingKinds), a.eq(a.name, "figures")),
);

/**
 * A rounding operator's `rounding-mode`, the source of {@link Rounding}'s written `mode`.
 */
const modeAttributes = select(Attribute, (a) =>
  a.and(a.in(a.kind, roundingKinds), a.eq(a.name, "rounding-mode")),
);

/**
 * The rounding operators that write `rounding-mode`.
 */
const writtenModes = select(Rounding, (r) => r.eq(r.modeWritten, true));

/**
 * A `qti-equal`'s `tolerance`, the source of {@link Tolerance}.
 */
const toleranceAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "qti-equal"), a.eq(a.name, "tolerance")),
);

/**
 * A `qti-equal`'s `tolerance-mode` written as `absolute` or `relative`, each the one lexical form
 * of its value.
 */
const rangeModeAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "qti-equal"), a.eq(a.name, "tolerance-mode"), a.in(a.lexical, rangeModes)),
);

/**
 * Reading 119 (law "Rounding figures", rule `P10`; info §5.47.2 and §5.119.2): a `figures` that is
 * an integer is at least 1 under `significantFigures` and at least 0 under `decimalPlaces`. A
 * variable's name is no integer, and a mode outside the enumeration (AL1's) or none (AL3's) binds
 * neither bound.
 */
export const roundingFigures = check("Rounding_figures", Rounding, (r) =>
  r.and(
    r.or(r.eq(r.integer, false), r.ne(r.mode, "significantFigures"), r.ge(r.figuresValue, 1n)),
    r.or(r.eq(r.integer, false), r.ne(r.mode, "decimalPlaces"), r.ge(r.figuresValue, 0n)),
  ),
);

/**
 * Reading 121's presence (law "Equal tolerance", rule `P36`; info §5.46.2: "If the tolerance mode
 * is absolute or relative then the tolerance must be specified"): a `qti-equal` whose
 * `tolerance-mode` is `absolute` or `relative` has a {@link Tolerance} row, which exists exactly
 * where it writes `tolerance`.
 */
export const toleranceRequired = contained(on(rangeModeAttributes, "node"), on(Tolerance, "node"));

/**
 * Reading 121's count (law "Equal tolerance", rule `P36`; info §5.46.2: "The tolerance consists of
 * two positive numbers, t0 and t1 ... If only one value is given it is used for both"): a
 * `tolerance` holds one value or two.
 */
export const toleranceCount = check("Equal_tolerance", Tolerance, (t) => t.in(t.tokens, [1n, 2n]));

/**
 * Reading 121's sign (law "Equal tolerance", rule `P36`; info §5.46.2, "two positive numbers"): a
 * tolerance value in `xs:double`'s lexical space is positive. A string names a variable and is
 * read at run time.
 */
export const tolerancePositive = check("Equal_tolerance", ToleranceToken, (x) =>
  x.or(x.not(Compute.matches(x.token, doublePattern)), Compute.matches(x.token, positivePattern)),
);

/**
 * Every statement over the operator overlays, each `check` named by its oracle law:
 *
 * - **Rounding:** each row on its node's {@link nodeRef} tuple, one for every rounding operator; its
 *   `figures` copied from the attribute where written, and its `rounding-mode` both ways;
 *   `E1_derived` for its kind, its collapsed `figures`, `integer`, `figuresValue` and the default
 *   mode; and reading 119, {@link roundingFigures};
 * - **Tolerance:** each `tolerance` copied into its row, both ways; its values a family whose
 *   concatenation is the value, or none for a value of whitespace alone, each value a maximal run
 *   of no whitespace (`E1_derived`);
 * - **Reading 121:** {@link toleranceRequired}, {@link toleranceCount} and {@link tolerancePositive}.
 */
export const operatorLawsByName = {
  "DocumentId key": [
    key(on(figuresAttributes, "node")),
    key(on(modeAttributes, "node")),
    key(on(toleranceAttributes, "node")),
  ],
  "E1 derived": [
    contained(
      on(Rounding, "node", "document", "kind", "start", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(on(roundingNodes, "id"), on(Rounding, "node")),
    contained(on(figuresAttributes, "node", "lexical"), on(Rounding, "node", "figuresLexical")),
    contained(on(modeAttributes, "node", "lexical"), on(writtenModes, "node", "mode")),
    contained(on(writtenModes, "node"), on(modeAttributes, "node")),
    check("E1_derived", Rounding, (r) =>
      r.and(
        r.in(r.kind, roundingKinds),
        r.eq(r.figures, Compute.collapse(r.figuresLexical)),
        r.or(
          r.and(r.eq(r.integer, true), Compute.matches(r.figures, integerForm)),
          r.and(r.eq(r.integer, false), r.not(Compute.matches(r.figures, integerForm))),
        ),
        r.eq(
          r.figuresValue,
          Compute.when(
            Compute.matches(r.figures, integerForm),
            (figures) => Compute.cast(figures, pg.bigint),
            roundingUnwritten.figuresValue,
          ),
        ),
        r.or(
          r.eq(r.modeWritten, true),
          r.and(r.eq(r.kind, "qti-equal-rounded"), r.eq(r.mode, equalRoundedMode)),
          r.and(r.eq(r.kind, "qti-round-to"), r.eq(r.mode, roundingUnwritten.mode)),
        ),
      ),
    ),
    contained(on(toleranceAttributes, "node", "lexical"), on(Tolerance, "node", "lexical")),
    contained(on(Tolerance, "node"), on(toleranceAttributes, "node")),
    toleranceTokenFamily,
    fold(
      toleranceTokenFamily,
      Monoid.concat,
      on(ToleranceToken, "node", "piece", "piecesWas", "piecesAfter"),
      on(Tolerance, "node", "tokenText"),
    ),
    check("E1_derived", Tolerance, (t) =>
      t.or(
        t.eq(t.lexical, t.tokenText),
        t.and(t.eq(t.tokens, 0n), Compute.matches(t.lexical, spacePattern)),
      ),
    ),
    check("E1_derived", ToleranceToken, (x) =>
      x.and(
        x.eq(x.piece, Compute.concat(Compute.concat(x.before, x.token), x.after)),
        Compute.matches(x.token, idValuePattern),
        x.or(x.eq(x.at, 0n), x.ne(x.before, "")),
      ),
    ),
  ],
  "Equal tolerance": [toleranceRequired, toleranceCount, tolerancePositive],
  "Rounding figures": [roundingFigures],
} as const;

/**
 * {@link operatorLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const operatorLaws = Object.values(operatorLawsByName).flat();
