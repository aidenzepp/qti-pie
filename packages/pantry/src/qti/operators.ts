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
 *   such element's {@link RoundingHolds}, which of the two it has, {@link RoundingFigures} its
 *   `figures`, {@link RoundingMode} the mode in force, and {@link RoundingModeFigures} both
 *   together, where reading 119 judges them.
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
  closed,
  closedId,
  Compute,
  contained,
  drawn,
  fin,
  fold,
  generated,
  key,
  lexicalForm,
  mirrors,
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
 * Which of reading 119's two inputs a rounding operator has, its {@link Rounding} row's `holds`:
 * `both`, a `figures` and a mode in force, written or `qti-equal-rounded`'s default; `figures`, a
 * `figures` and no mode, a `qti-round-to` that writes no `rounding-mode`; `mode`, a mode and no
 * `figures`; `neither`, neither. Only `both` is valid: `figures` is required on both kinds
 * (`EqualRoundedDType`, `RoundToDType`) and `rounding-mode` on `qti-round-to`, so every other value
 * is an element AL3 refuses alone, which holds no detail row ({@link RoundingModeFigures} is
 * `both`'s arm alone), never an optional value of the domain.
 */
export const RoundingHolds = closed("RoundingHolds", ["neither", "mode", "figures", "both"]);

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
export const doublePattern = Compute.pattern(
  "^(?:[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|-?INF|NaN)$",
);

/**
 * The positive values of {@link doublePattern}'s space, read off the form: a mantissa with no `-`
 * and a digit other than 0, with any exponent, or `INF`. `NaN`, `-INF` and every zero, `-0` and
 * `0e5` among them, are no positive number.
 *
 * A positive mantissa with a large negative exponent, `1e-400`, is a positive number as written,
 * though binary64 rounds it to 0: "positive" is read of the number the value names, not of its
 * nearest double.
 */
export const positivePattern = Compute.pattern(
  "^(?:\\+?(?:[0-9]*[1-9][0-9]*(?:\\.[0-9]*)?|[0-9]*\\.[0-9]*[1-9][0-9]*)(?:[Ee][+-]?[0-9]+)?|INF)$",
);

/**
 * A rounding operator, keyed by its node: one row for every `qti-equal-rounded` and every
 * `qti-round-to`, its {@link nodeRef} tuple, whether it writes `rounding-mode` (`modeWritten`), and
 * its {@link RoundingHolds}, which {@link RoundingFigures} and {@link RoundingMode} prove: it has
 * the one exactly where its `holds` says, and {@link RoundingModeFigures} exactly where it is
 * `both`.
 */
export const Rounding = relation(
  "Rounding",
  {
    document: uuid,
    holds: closedId(RoundingHolds),
    kind: closedId(NodeKind),
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
 * A rounding operator's `figures`, keyed by its node, where it writes one: `figuresLexical` as
 * written, copied from the attribute, and `figures`, collapsed (`E1_derived`).
 */
export const RoundingFigures = relation(
  "RoundingFigures",
  { figures: keyText, figuresLexical: keyText, node: uuid },
  ["node"],
);

/**
 * A rounding operator's mode in force, keyed by its node, where it has one: its `rounding-mode`
 * where it writes one (`modeWritten`, copied from the attribute), else {@link equalRoundedMode} on a
 * `qti-equal-rounded`. A `qti-round-to` that writes none has none, which AL3 refuses.
 */
export const RoundingMode = relation(
  "RoundingMode",
  { kind: closedId(NodeKind), mode: keyText, modeWritten: pg.boolean, node: uuid },
  ["node"],
);

/**
 * A rounding operator that has both a `figures` and a mode in force, keyed by its node: the
 * `both` arm of its {@link Rounding} row's `holds`, with its {@link RoundingFigures}' `figures` and
 * its {@link RoundingMode}'s `mode`, the two reading 119 judges together ({@link roundingFigures}).
 */
export const RoundingModeFigures = relation(
  "RoundingModeFigures",
  { figures: keyText, mode: keyText, node: uuid },
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
 * - **the host's:** `before`, `token` and `after`;
 * - **generated:** `piece`, `before ‖ token ‖ after`, the concatenation's step, a `keyText` whose
 *   domain refuses a piece past the bound;
 * - **the family's group:** `node`, the `qti-equal`;
 * - **drawn:** `at`;
 * - **accumulated:** `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const ToleranceToken = relation.generated(
  "ToleranceToken",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    node: uuid,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    token: keyText,
  },
  ["node", "at"],
  (x) => ({
    piece: generated(keyText, Compute.concat(Compute.concat(x.before, x.token), x.after)),
  }),
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const operatorRelations = {
  Rounding,
  RoundingFigures,
  RoundingHolds,
  RoundingMode,
  RoundingModeFigures,
  Tolerance,
  ToleranceToken,
};

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
 * A rounding operator's `figures`, the source of {@link RoundingFigures}.
 */
const figuresAttributes = select(Attribute, (a) =>
  a.and(a.in(a.kind, roundingKinds), a.eq(a.name, "figures")),
);

/**
 * A rounding operator's `rounding-mode`, the source of a written {@link RoundingMode}.
 */
const modeAttributes = select(Attribute, (a) =>
  a.and(a.in(a.kind, roundingKinds), a.eq(a.name, "rounding-mode")),
);

/**
 * The rounding operators that write `rounding-mode`.
 */
const writtenModes = select(Rounding, (r) => r.eq(r.modeWritten, true));

/**
 * The written modes in force, each its attribute's lexical form.
 */
const writtenModesInForce = select(RoundingMode, (m) => m.eq(m.modeWritten, true));

/**
 * The rounding operators that hold a `figures`.
 */
const figuredRoundings = select(Rounding, (r) => r.in(r.holds, ["figures", "both"]));

/**
 * The rounding operators that hold both a `figures` and a mode in force, each of which has its
 * {@link RoundingModeFigures} row: the `both` arm, stated as the two containments grizzle's
 * `alternatives` would state of its one arm, since the importer's refusal tables read no
 * `alternatives` statement.
 */
const bothHeld = select(Rounding, (r) => r.eq(r.holds, "both"));

/**
 * The rounding operators that hold a mode in force.
 */
const modedRoundings = select(Rounding, (r) => r.in(r.holds, ["mode", "both"]));

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
 * The least `figures` each rounding mode admits (reading 119; info §5.47.2 and §5.119.2): 1 under
 * `significantFigures`, "a non-zero positive integer", and 0 under `decimalPlaces`, "an integer
 * greater than or equal to zero".
 */
const leastFigures = { decimalPlaces: 0n, significantFigures: 1n } as const;

/**
 * Reading 119 (law "Rounding figures", rule `P10`; info §5.47.2 and §5.119.2): a `figures` that is
 * an integer is at least its mode's {@link leastFigures}. A variable's name is no integer, and a
 * mode outside the enumeration (AL1's) binds no bound; an operator with no `figures` or no mode is
 * AL3's, and has no {@link RoundingModeFigures} row to judge. The cast reads only an integer's
 * form, which the guard proves, so its `otherwise` is the least itself, which the bound admits.
 */
export const roundingFigures = check("Rounding_figures", RoundingModeFigures, (m) =>
  m.or(
    m.not(Compute.matches(m.figures, integerForm)),
    m.and(
      ...roundingModes.map((mode) =>
        m.or(
          m.ne(m.mode, mode),
          m.ge(
            Compute.when(
              Compute.matches(m.figures, integerForm),
              (figures) => Compute.cast(figures, pg.bigint),
              leastFigures[mode],
            ),
            leastFigures[mode],
          ),
        ),
      ),
    ),
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
 *   `holds` proved by its `figures` (both ways) and its mode in force (`E1_derived`), and its
 *   `modeWritten` by its `rounding-mode` (both ways); its `figures` copied into
 *   {@link RoundingFigures} and collapsed, its mode in force into {@link RoundingMode}, written or
 *   the default; its `both` arm, {@link RoundingModeFigures}, copying both; and reading 119,
 *   {@link roundingFigures};
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
    mirrors(on(modeAttributes, "node"), on(writtenModes, "node")),
    check("E1_derived", Rounding, (r) =>
      r.and(
        r.in(r.kind, roundingKinds),
        r.or(
          r.and(
            r.in(r.holds, ["mode", "both"]),
            r.or(r.eq(r.modeWritten, true), r.eq(r.kind, "qti-equal-rounded")),
          ),
          r.and(
            r.in(r.holds, ["neither", "figures"]),
            r.eq(r.modeWritten, false),
            r.eq(r.kind, "qti-round-to"),
          ),
        ),
      ),
    ),
    contained(
      on(figuresAttributes, "node", "lexical"),
      on(RoundingFigures, "node", "figuresLexical"),
    ),
    contained(on(RoundingFigures, "node"), on(figuresAttributes, "node")),
    mirrors(on(RoundingFigures, "node"), on(figuredRoundings, "node")),
    check("E1_derived", RoundingFigures, (f) =>
      f.eq(f.figures, Compute.collapse(f.figuresLexical)),
    ),
    contained(on(modeAttributes, "node", "lexical"), on(writtenModesInForce, "node", "mode")),
    mirrors(on(RoundingMode, "node"), on(modedRoundings, "node")),
    contained(
      on(RoundingMode, "node", "kind", "modeWritten"),
      on(Rounding, "node", "kind", "modeWritten"),
    ),
    check("E1_derived", RoundingMode, (m) =>
      m.or(
        m.eq(m.modeWritten, true),
        m.and(m.eq(m.kind, "qti-equal-rounded"), m.eq(m.mode, equalRoundedMode)),
      ),
    ),
    mirrors(on(bothHeld, "node"), on(RoundingModeFigures, "node")),
    contained(on(RoundingModeFigures, "node", "figures"), on(RoundingFigures, "node", "figures")),
    contained(on(RoundingModeFigures, "node", "mode"), on(RoundingMode, "node", "mode")),
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
      x.and(Compute.matches(x.token, idValuePattern), x.or(x.eq(x.at, 0n), x.ne(x.before, ""))),
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
