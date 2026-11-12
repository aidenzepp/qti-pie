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
 * Every overlay row is keyed by its element's place, `(package, path, start)`, the key `Node` holds
 * it by. Every copy of an attribute into an overlay follows C18 the other way round, as
 * `identity.ts` states it: from `select(Attribute, φ)` into the overlay, keyed by `Attribute`'s key
 * `(package, path, start, name)` once the selection fixes the name, whose index serves the copy's
 * reverse probe. Every copied text that takes part in a cross-row equality is `keyText`
 * (`#pantry/qti/limits.ts`). Every check is named by its oracle law (`#pantry/test/oracle.ts`
 * `LawName`) with spaces written as underscores.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_EqualRounded | QTI 3.0 information model, §5.47 EqualRounded}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_RoundTo | QTI 3.0 information model, §5.119 RoundTo}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Equal | QTI 3.0 information model, §5.46 Equal}
 */
import {
  accumulated,
  alternatives,
  check,
  closed,
  closedId,
  Compute,
  contained,
  drawn,
  fin,
  fold,
  generated,
  mirrors,
  Monoid,
  natural,
  on,
  ordered,
  pg,
  relation,
  select,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { Attribute, Space } from "#pantry/qti/attributes.ts";
import { idValuePattern, spacePattern } from "#pantry/qti/identity.ts";
import { EntryPath, integerForm, keyText, ManifestIdentifier } from "#pantry/qti/limits.ts";
import { Node, nodeRef } from "#pantry/qti/node.ts";
import { equalRoundedMode, roundingKinds, roundingModes } from "#pantry/vocab/terms/operators.ts";

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
const rangeModes = ["absolute", "relative"] as const;

/**
 * `xs:double`'s lexical space, pantry's one statement of it: XML Schema 1.0's (Part 2 §3.2.5.1),
 * the edition QTI 3.0's XSDs are written in (spec reading 71), a decimal mantissa of any digits
 * with an optional exponent of any digits, `INF`, `-INF` or `NaN`. XML Schema 1.1's adds `+INF`,
 * which this space refuses, the stricter of the two (readings 144 and 154).
 *
 * It lies inside grizzle's `doubleText`, 1.1's grammar, which is this pattern with `+INF`, so
 * `Compute.parseDouble` reads every form of it total: a value of it is the double that parse maps
 * it to, XML Schema 1.1's doubleLexicalMap (Part 2 §3.3.5.2, reading 144), and every double pantry
 * reads from a form in the database is read by that parse, guarded by this pattern or typed by it
 * (`Slider_bounds`, `Mastery_range`, `MapKeyFloat`). A tolerance value in it is a number; any other
 * is a string, which names a variable read at run time (spec reading 121).
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
 * A rounding operator, keyed by its element's place: one row for every `qti-equal-rounded` and
 * every `qti-round-to`, its {@link nodeRef} tuple, whether it writes `rounding-mode`
 * (`modeWritten`), and its {@link RoundingHolds}, which {@link RoundingFigures} and
 * {@link RoundingMode} prove: it has the one exactly where its `holds` says, and
 * {@link RoundingModeFigures} exactly where it is `both`.
 */
export const Rounding = relation(
  "Rounding",
  {
    holds: closedId(RoundingHolds),
    kind: closedId(NodeKind),
    modeWritten: pg.boolean,
    nearest: natural,
    package: ManifestIdentifier,
    parent: natural,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
);

/**
 * A rounding operator's `figures`, keyed by its element's place, where it writes one:
 * `figuresLexical` as written, copied from the attribute, and `figures`, that form collapsed, which
 * the database derives.
 */
export const RoundingFigures = relation.generated(
  "RoundingFigures",
  { figuresLexical: keyText, package: ManifestIdentifier, path: EntryPath, start: natural },
  ["package", "path", "start"],
  (f) => ({
    figures: generated(keyText, Compute.cast(Compute.collapse(f.figuresLexical), keyText)),
  }),
);

/**
 * A rounding operator's mode in force, keyed by its element's place, where it has one: its
 * `rounding-mode` where it writes one (`modeWritten`, copied from the attribute), else
 * {@link equalRoundedMode} on a `qti-equal-rounded`. A `qti-round-to` that writes none has none,
 * which AL3 refuses.
 */
export const RoundingMode = relation(
  "RoundingMode",
  {
    kind: closedId(NodeKind),
    mode: keyText,
    modeWritten: pg.boolean,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * A rounding operator that has both a `figures` and a mode in force, keyed by its element's place:
 * the
 * `both` arm of its {@link Rounding} row's `holds`, which grizzle's `alternatives` states, with its
 * {@link RoundingFigures}' `figures` and its {@link RoundingMode}'s `mode`, the two reading 119
 * judges together ({@link roundingFigures}).
 */
export const RoundingModeFigures = relation(
  "RoundingModeFigures",
  {
    figures: keyText,
    mode: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * One `qti-equal`'s `tolerance`, keyed by the element's place.
 *
 * - **copied from the attribute:** `package`, `path`, `start` and `lexical`, the value as written;
 * - **drawn:** `tokens`, its {@link ToleranceToken} count;
 * - **accumulated:** `tokenText`, the end of its tokens' concatenation.
 */
export const Tolerance = relation(
  "Tolerance",
  {
    lexical: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    tokenText: accumulated(keyText, ""),
    tokens: drawn(natural),
  },
  ["package", "path", "start"],
);

/**
 * One value of a `tolerance`, in order, with the whitespace written before and after it, so its
 * `piece` is a stretch of the value and the pieces concatenate to it, as `identity.ts`'s
 * `TextIdref` splits an element's text.
 *
 * - **the host's:** `before`, `token` and `after`;
 * - **generated:** `piece`, `before ‖ token ‖ after`, the concatenation's step, a `keyText` whose
 *   domain refuses a piece past the bound;
 * - **the family's group:** `package`, `path` and `start`, the `qti-equal`'s place;
 * - **drawn:** `at`;
 * - **accumulated:** `piecesWas` and `piecesAfter`, the concatenation before and after it.
 */
export const ToleranceToken = relation.generated(
  "ToleranceToken",
  {
    after: Space,
    at: drawn(natural),
    before: Space,
    package: ManifestIdentifier,
    path: EntryPath,
    piecesAfter: accumulated(keyText, ""),
    piecesWas: accumulated(keyText, ""),
    start: natural,
    token: keyText,
  },
  ["package", "path", "start", "at"],
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
const toleranceTokenFamily = ordered(
  on(ToleranceToken, "package", "path", "start", "at"),
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
const roundingFigures = check("Rounding_figures", RoundingModeFigures, (m) =>
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
export const toleranceRequired = contained(
  on(rangeModeAttributes, "package", "path", "start"),
  on(Tolerance, "package", "path", "start"),
);

/**
 * Reading 121's count (law "Equal tolerance", rule `P36`; info §5.46.2: "The tolerance consists of
 * two positive numbers, t0 and t1 ... If only one value is given it is used for both"): a
 * `tolerance` holds one value or two.
 */
const toleranceCount = check("Equal_tolerance", Tolerance, (t) => t.in(t.tokens, [1n, 2n]));

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
 * - **Rounding:** each row on its element's {@link nodeRef} tuple, one for every rounding operator;
 *   its `holds` proved by its `figures` (both ways) and its mode in force (`E1_derived`), and its
 *   `modeWritten` by its `rounding-mode` (both ways); its `figures` copied into
 *   {@link RoundingFigures} and collapsed, its mode in force into {@link RoundingMode}, written or
 *   the default; its `both` arm, {@link RoundingModeFigures}, an `alternatives` arm, copying both;
 *   and reading 119, {@link roundingFigures};
 * - **Tolerance:** each `tolerance` copied into its row, both ways; its values a family whose
 *   concatenation is the value, or none for a value of whitespace alone, each value a maximal run
 *   of no whitespace (`E1_derived`);
 * - **Reading 121:** {@link toleranceRequired}, {@link toleranceCount} and {@link tolerancePositive}.
 */
export const operatorLawsByName = {
  "E1 derived": [
    contained(
      on(Rounding, "package", "path", "start", "kind", "nearest", "version", "parent"),
      nodeRef,
    ),
    contained(
      on(roundingNodes, "package", "path", "start"),
      on(Rounding, "package", "path", "start"),
    ),
    mirrors(
      on(modeAttributes, "package", "path", "start"),
      on(writtenModes, "package", "path", "start"),
    ),
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
      on(figuresAttributes, "package", "path", "start", "lexical"),
      on(RoundingFigures, "package", "path", "start", "figuresLexical"),
    ),
    contained(
      on(RoundingFigures, "package", "path", "start"),
      on(figuresAttributes, "package", "path", "start"),
    ),
    mirrors(
      on(RoundingFigures, "package", "path", "start"),
      on(figuredRoundings, "package", "path", "start"),
    ),
    contained(
      on(modeAttributes, "package", "path", "start", "lexical"),
      on(writtenModesInForce, "package", "path", "start", "mode"),
    ),
    mirrors(
      on(RoundingMode, "package", "path", "start"),
      on(modedRoundings, "package", "path", "start"),
    ),
    contained(
      on(RoundingMode, "package", "path", "start", "kind", "modeWritten"),
      on(Rounding, "package", "path", "start", "kind", "modeWritten"),
    ),
    check("E1_derived", RoundingMode, (m) =>
      m.or(
        m.eq(m.modeWritten, true),
        m.and(m.eq(m.kind, "qti-equal-rounded"), m.eq(m.mode, equalRoundedMode)),
      ),
    ),
    alternatives(Rounding, "holds", RoundingHolds, { both: RoundingModeFigures }),
    contained(
      on(RoundingModeFigures, "package", "path", "start", "figures"),
      on(RoundingFigures, "package", "path", "start", "figures"),
    ),
    contained(
      on(RoundingModeFigures, "package", "path", "start", "mode"),
      on(RoundingMode, "package", "path", "start", "mode"),
    ),
    contained(
      on(toleranceAttributes, "package", "path", "start", "lexical"),
      on(Tolerance, "package", "path", "start", "lexical"),
    ),
    contained(
      on(Tolerance, "package", "path", "start"),
      on(toleranceAttributes, "package", "path", "start"),
    ),
    toleranceTokenFamily,
    fold(
      toleranceTokenFamily,
      Monoid.concat,
      on(ToleranceToken, "package", "path", "start", "piece", "piecesWas", "piecesAfter"),
      on(Tolerance, "package", "path", "start", "tokenText"),
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
