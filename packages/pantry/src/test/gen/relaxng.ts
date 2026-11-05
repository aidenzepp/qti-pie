/**
 * The MathML 3 RelaxNG's content models where spec reading 2 follows it over the XSD, written as
 * recognizers from the RelaxNG's compact text (https://www.w3.org/Math/RelaxNG/mathml3/, fetched
 * 2026-11-05 into `~/.cache/gr8des/mathml3-rng/`), and nothing else: the grammar's restated
 * particles (`src/grammar/facets.ts`) are what they check, so none of them is read here.
 *
 * Each recognizer decides a family of child kinds the way the RelaxNG's pattern does, by trying
 * every way to split the family among the pattern's parts, so an ambiguous pattern (an `interval`
 * that is both a qualifier and an argument) is read as the RelaxNG reads it, not as a
 * deterministic restatement would. The classes it reads (`ContExp`, `MathExpression`) are a test's
 * own reading of the XSD's groups, with the one kind the RelaxNG adds to `ContExp`.
 */

/**
 * The classes a recognizer reads, from a test's own reading of the pinned XSD:
 *
 * - `anyElement`: whether a kind outside MathML stands for an element `anyElement`
 *   (`mathml3-common.rnc` line 61) matches under the parent, an element its wildcard reads, which
 *   spec reading 72 bounds by the parent's schema set;
 * - `content`: the RelaxNG's `ContExp` (`mathml3-strict-content.rnc` line 14), the XSD's `ContExp`
 *   and `semantics-contexp`, the kind `m:semantics.contexp`;
 * - `math`: the RelaxNG's `MathExpression` (`mathml3-common.rnc` line 18, extended in the content and
 *   presentation files), the XSD's `MathExpression`, whose `semantics` is `m:semantics`;
 * - `inMathml`: whether a kind's element is in the MathML namespace, the own-namespace foreign kind
 *   under a MathML parent among them.
 */
export interface MathClasses {
  readonly anyElement: (kind: string) => boolean;
  readonly content: ReadonlySet<string>;
  readonly inMathml: (kind: string) => boolean;
  readonly math: ReadonlySet<string>;
}

/**
 * A recognizer of one model's language.
 */
export type Recognizer = (children: readonly string[], classes: MathClasses) => boolean;

/**
 * The kind of `semantics-contexp`, which the RelaxNG's `ContExp` names and the XSD's drops.
 */
export const semanticsContexp = "m:semantics.contexp";

/**
 * The tokens of `DomainQ = (domainofapplication|condition|interval|(lowlimit,uplimit?))*`
 * (`mathml3-content.rnc` line 41).
 */
const domainTokens: ReadonlySet<string> = new Set([
  "m:domainofapplication",
  "m:condition",
  "m:interval",
  "m:lowlimit",
  "m:uplimit",
]);

/**
 * The tokens of `Qualifier = DomainQ|degree|momentabout|logbase` (line 47), repeated.
 */
const qualifierTokens: ReadonlySet<string> = new Set([
  ...domainTokens,
  "m:degree",
  "m:momentabout",
  "m:logbase",
]);

/**
 * Whether a run is a repetition of a qualifier pattern: each token one of the pattern's, and each
 * `uplimit` right after a `lowlimit`, the `(lowlimit, uplimit?)` group.
 *
 * @param run - The run.
 * @param tokens - The pattern's tokens.
 * @returns Whether the run is one.
 */
const repeats = (run: readonly string[], tokens: ReadonlySet<string>): boolean =>
  run.every(
    (kind, at) => tokens.has(kind) && (kind !== "m:uplimit" || run[at - 1] === "m:lowlimit"),
  );

/**
 * The length of a family's leading `bvar*` (`BvarQ`, `mathml3-strict-content.rnc` line 38).
 *
 * @param children - The family.
 * @returns How many bound variables it opens with.
 */
const boundCount = (children: readonly string[]): number => {
  const at = children.findIndex((kind) => kind !== "m:bvar");

  return at === -1 ? children.length : at;
};

/**
 * Whether a family is `qualifiers, ContExp*` for some split: a qualifier run, then content
 * expressions, an `interval` free to fall on either side.
 *
 * @param children - The family.
 * @param tokens - The qualifier pattern's tokens.
 * @param classes - The classes.
 * @returns Whether some split matches.
 */
const qualifiedThenArguments = (
  children: readonly string[],
  tokens: ReadonlySet<string>,
  classes: MathClasses,
): boolean =>
  Array.from({ length: children.length + 1 }, (_, split) => split).some(
    (split) =>
      repeats(children.slice(0, split), tokens) &&
      children.slice(split).every((kind) => classes.content.has(kind)),
  );

/**
 * `apply.content = ContExp+ | (ContExp, BvarQ, Qualifier*, ContExp*)` (`mathml3-content.rnc` line
 * 29), and `bind.content`, the same (line 31).
 *
 * @param children - The family.
 * @param classes - The classes.
 * @returns Whether the RelaxNG accepts it.
 */
const applyContent: Recognizer = (children, classes) => {
  const [operator, ...rest] = children;

  return (
    operator !== undefined &&
    classes.content.has(operator) &&
    (rest.every((kind) => classes.content.has(kind)) ||
      qualifiedThenArguments(rest.slice(boundCount(rest)), qualifierTokens, classes))
  );
};

/**
 * `bvar*, DomainQ, ContExp*`: `vector`, `matrix` and `matrixrow` (lines 325 to 327), and `set` and
 * `list`'s `BvarQ*, DomainQ*, ContExp*` (lines 230 and 231), the same language.
 *
 * @param children - The family.
 * @param classes - The classes.
 * @returns Whether the RelaxNG accepts it.
 */
const constructorContent: Recognizer = (children, classes) =>
  qualifiedThenArguments(children.slice(boundCount(children)), domainTokens, classes);

/**
 * `lambda = element lambda {CommonAtt, DefEncAtt, BvarQ, DomainQ, ContExp}` (line 103).
 *
 * @param children - The family.
 * @param classes - The classes.
 * @returns Whether the RelaxNG accepts it.
 */
const lambdaContent: Recognizer = (children, classes) => {
  const body = children.at(-1);
  const before = children.slice(0, -1);

  return (
    body !== undefined &&
    classes.content.has(body) &&
    repeats(before.slice(boundCount(before)), domainTokens)
  );
};

/**
 * Exactly so many content expressions.
 *
 * @param count - How many.
 * @returns The recognizer.
 */
const contentExpressions =
  (count: number): Recognizer =>
  (children, classes) =>
    children.length === count && children.every((kind) => classes.content.has(kind));

/**
 * The RelaxNG's language of every model spec reading 2 restates or edits, by the kind whose model
 * it is, each from its line of the RelaxNG:
 *
 * - `bvar`, `((ci | semantics-ci) & degree?)` (`mathml3-content.rnc` line 23), and `piecewise`,
 *   `(piece* & otherwise?)` (line 60), the two interleaves;
 * - The models whose `DomainQ` holds `interval` (line 41): `apply` and `bind` (29, 31), `lambda`
 *   (103), `set` and `list` (230, 231), `vector`, `matrix` and `matrixrow` (325 to 327);
 * - `annotation-xml`, `(MathExpression|anyElement)*` with `anyElement = element (* - m:*)`
 *   (`mathml3-common.rnc` lines 59 and 61);
 * - The models of content expressions, whose `ContExp` holds `semantics-contexp`
 *   (`mathml3-strict-content.rnc` line 14): `semantics-contexp` (23), `cerror` (50), the qualifiers
 *   (`mathml3-content.rnc` lines 42 to 50), `piece` (62), `otherwise` (64), `reln` (70), `fn` (71),
 *   `declare` (72) and `interval` (84).
 */
export const relaxNgModels: ReadonlyMap<string, Recognizer> = new Map<string, Recognizer>([
  [
    "m:bvar",
    (children) =>
      children.every(
        (kind) => kind === "m:ci" || kind === "m:semantics.ci" || kind === "m:degree",
      ) &&
      children.filter((kind) => kind === "m:ci" || kind === "m:semantics.ci").length === 1 &&
      children.filter((kind) => kind === "m:degree").length <= 1,
  ],
  [
    "m:piecewise",
    (children) =>
      children.every((kind) => kind === "m:piece" || kind === "m:otherwise") &&
      children.filter((kind) => kind === "m:otherwise").length <= 1,
  ],
  ["m:apply", applyContent],
  ["m:bind", applyContent],
  ["m:lambda", lambdaContent],
  ["m:set", constructorContent],
  ["m:list", constructorContent],
  ["m:vector", constructorContent],
  ["m:matrix", constructorContent],
  ["m:matrixrow", constructorContent],
  [
    "m:annotation-xml",
    (children, classes) =>
      children.every(
        (kind) => classes.math.has(kind) || (!classes.inMathml(kind) && classes.anyElement(kind)),
      ),
  ],
  [
    semanticsContexp,
    (children, classes) => {
      const [first, ...rest] = children;

      return (
        first !== undefined &&
        classes.content.has(first) &&
        rest.every((kind) => kind === "m:annotation" || kind === "m:annotation-xml")
      );
    },
  ],
  [
    "m:cerror",
    (children, classes) => {
      const [first, ...rest] = children;

      return first === "m:csymbol" && rest.every((kind) => classes.content.has(kind));
    },
  ],
  ...[
    "m:domainofapplication",
    "m:condition",
    "m:uplimit",
    "m:lowlimit",
    "m:degree",
    "m:momentabout",
    "m:logbase",
    "m:otherwise",
    "m:fn",
  ].map((kind): readonly [string, Recognizer] => [kind, contentExpressions(1)]),
  ["m:piece", contentExpressions(2)],
  ["m:interval", contentExpressions(2)],
  ["m:reln", (children, classes) => children.every((kind) => classes.content.has(kind))],
  [
    "m:declare",
    (children, classes) =>
      children.length > 0 && children.every((kind) => classes.content.has(kind)),
  ],
]);

/**
 * The MathML kind the RelaxNG's only start pattern names, `start = math` (`mathml3-common.rnc`
 * line 15): MathML 3 §2.2, "All other MathML content must be contained in a math element".
 */
export const mathmlRoot = "m:math";

/**
 * The MathML namespace, of every kind the RelaxNG's grammar names.
 */
export const mathmlNamespace = "http://www.w3.org/1998/Math/MathML";

/**
 * The kinds whose RelaxNG model reads `ContExp`, so a `semantics` there is `semantics-contexp`
 * (`mathml3-strict-content.rnc` line 14), the kind `m:semantics.contexp`: `apply` and `bind`
 * (`mathml3-content.rnc` lines 29 and 31), `lambda` (103), `set` and `list` (230, 231), `vector`,
 * `matrix` and `matrixrow` (325 to 327), `semantics-contexp` itself and `cerror`
 * (`mathml3-strict-content.rnc` lines 23 and 50), the qualifiers (`mathml3-content.rnc` lines 42 to
 * 50), `piece` (62), `otherwise` (64), `reln` (70), `fn` (71), `declare` (72) and `interval` (84).
 */
export const contentExpressionParents: ReadonlySet<string> = new Set([
  "m:apply",
  "m:bind",
  "m:lambda",
  "m:set",
  "m:list",
  "m:vector",
  "m:matrix",
  "m:matrixrow",
  semanticsContexp,
  "m:cerror",
  "m:domainofapplication",
  "m:condition",
  "m:uplimit",
  "m:lowlimit",
  "m:degree",
  "m:momentabout",
  "m:logbase",
  "m:piece",
  "m:otherwise",
  "m:reln",
  "m:fn",
  "m:declare",
  "m:interval",
]);
