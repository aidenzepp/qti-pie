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
 *   spec reading 81 bounds by the parent's schema set;
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
 * The qualifiers' places in the order MathML 3 §4.3.3 fixes: "In all cases, if more than one
 * qualifier is present, they appear in the order bvar, lowlimit, uplimit, interval, condition,
 * domainofapplication, degree, momentabout, logbase." The RelaxNG's `DomainQ =
 * (domainofapplication|condition|interval|(lowlimit,uplimit?))*` (`mathml3-content.rnc` line 41)
 * and `Qualifier = DomainQ|degree|momentabout|logbase` (line 47) leave the order free, so this is
 * the one layer of the qualifiers that is not the RelaxNG alone. `lowlimit` and `uplimit` share a
 * place, the `(lowlimit, uplimit?)` group, an `uplimit` right after a `lowlimit`.
 */
const qualifierPlace: ReadonlyMap<string, number> = new Map([
  ["m:lowlimit", 1],
  ["m:uplimit", 1],
  ["m:interval", 2],
  ["m:condition", 3],
  ["m:domainofapplication", 4],
  ["m:degree", 5],
  ["m:momentabout", 6],
  ["m:logbase", 7],
]);

/**
 * Whether a run is qualifiers in the Recommendation's order: each kind one of the `allowed`, the
 * places never falling, each `uplimit` right after a `lowlimit`, and, when no `bvar` precedes the
 * run, no `condition` (§4.3.3.2, "condition qualifiers always contain instances of the bound
 * variable, and thus require a preceding bvar").
 *
 * @param run - The run, after the family's `bvar` run.
 * @param allowed - The qualifier kinds the pattern names.
 * @param bound - Whether a `bvar` precedes the run.
 * @returns Whether the run is one.
 */
const ordered = (run: readonly string[], allowed: ReadonlySet<string>, bound: boolean): boolean =>
  run.every((kind, at) => {
    const place = qualifierPlace.get(kind);
    const before = at === 0 ? 0 : (qualifierPlace.get(run[at - 1] ?? "") ?? 0);

    return (
      place !== undefined &&
      allowed.has(kind) &&
      place >= before &&
      (kind !== "m:uplimit" || run[at - 1] === "m:lowlimit") &&
      (kind !== "m:condition" || bound)
    );
  });

/**
 * The qualifier kinds of `DomainQ` (line 41), and of `Qualifier` (line 47) with `degree`,
 * `momentabout` and `logbase`.
 */
const domainKinds: ReadonlySet<string> = new Set([
  "m:domainofapplication",
  "m:condition",
  "m:interval",
  "m:lowlimit",
  "m:uplimit",
]);

const qualifierKinds: ReadonlySet<string> = new Set([
  ...domainKinds,
  "m:degree",
  "m:momentabout",
  "m:logbase",
]);

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
 * Whether a family is `qualifiers, ContExp*` for some split: a qualifier run in the
 * Recommendation's order, then content expressions, an `interval` free to fall on either side.
 *
 * @param children - The family, after the leading content expression if the pattern has one.
 * @param allowed - The qualifier kinds the pattern names.
 * @param classes - The classes.
 * @param binding - Whether the family's `bvar` run may be empty: a `bind`'s may not.
 * @returns Whether some split matches.
 */
const qualifiedThenArguments = (
  children: readonly string[],
  allowed: ReadonlySet<string>,
  classes: MathClasses,
  binding: "optional" | "required",
): boolean => {
  const bound = boundCount(children);
  const rest = children.slice(bound);

  return (
    (binding === "optional" || bound > 0) &&
    Array.from({ length: rest.length + 1 }, (_, split) => split).some(
      (split) =>
        ordered(rest.slice(0, split), allowed, bound > 0) &&
        rest.slice(split).every((kind) => classes.content.has(kind)),
    )
  );
};

/**
 * `apply.content = ContExp+ | (ContExp, BvarQ, Qualifier*, ContExp*)` (`mathml3-content.rnc` line
 * 29), the qualifiers in the Recommendation's order and a `condition` only after a `bvar`.
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
    qualifiedThenArguments(rest, qualifierKinds, classes, "optional")
  );
};

/**
 * `bind.content`, the same (line 31), with the non-empty list of `bvar` elements §4.2.6.1 asks
 * for: "This is followed by a non-empty list of bvar elements".
 *
 * @param children - The family.
 * @param classes - The classes.
 * @returns Whether the RelaxNG accepts it.
 */
const bindContent: Recognizer = (children, classes) => {
  const [operator, ...rest] = children;

  return (
    operator !== undefined &&
    classes.content.has(operator) &&
    qualifiedThenArguments(rest, qualifierKinds, classes, "required")
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
  qualifiedThenArguments(children, domainKinds, classes, "optional");

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
  const bound = boundCount(before);

  return (
    body !== undefined &&
    classes.content.has(body) &&
    ordered(before.slice(bound), domainKinds, bound > 0)
  );
};

/**
 * The kinds `MstackExpression = MathExpression|mscarries|msline|msrow|msgroup` adds to
 * `MathExpression` (`mathml3-presentation.rnc` line 22).
 */
const stackOnly: ReadonlySet<string> = new Set(["m:mscarries", "m:msline", "m:msrow", "m:msgroup"]);

/**
 * The RelaxNG's `mstack` and `mlongdiv` with the Recommendation's prose rule applied, the one layer
 * of this file that is not the RelaxNG alone: MathML 3 §3.6.1, "It is an error for mscarries to be
 * the last element of an mstack or mlongdiv element", which the RelaxNG does not say. The pattern
 * is `MstackExpression*` for `mstack` (`mathml3-presentation.rnc` line 494) and `MstackExpression,
 * MstackExpression, MstackExpression+` for `mlongdiv` (line 504), so `mlongdiv` holds at least
 * three.
 *
 * @param least - The fewest children the RelaxNG's pattern takes.
 * @returns The recognizer.
 */
const stackContent =
  (least: number): Recognizer =>
  (children, classes) =>
    children.length >= least &&
    children.every((kind) => classes.math.has(kind) || stackOnly.has(kind)) &&
    children.at(-1) !== "m:mscarries";

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
 *   `declare` (72) and `interval` (84);
 * - `mstack` and `mlongdiv` (`mathml3-presentation.rnc` lines 494 and 504) with §3.6.1's prose rule
 *   that `mscarries` is not their last child, which is the RelaxNG with the Recommendation's prose
 *   and not the RelaxNG alone.
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
  ["m:bind", bindContent],
  ["m:lambda", lambdaContent],
  ["m:mstack", stackContent(0)],
  ["m:mlongdiv", stackContent(3)],
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
