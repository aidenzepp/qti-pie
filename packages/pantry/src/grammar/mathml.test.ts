/**
 * Spec reading 2 as the composed grammar holds it: MathML validity is the MathML 3 Recommendation,
 * its RelaxNG schema and its prose, where they differ from the MathML XSD QTI imports.
 *
 * - **The notation types** (MathML 3 §2.1.5.1): every attribute of an integer notation type takes the
 *   notation's lexical space within its type's, checked against a recognizer written from the
 *   section's text over every short string of an alphabet that holds each case.
 * - **The content models** the reading restates or edits: every child sequence of a bounded box,
 *   against `#pantry/test/gen/relaxng.ts`'s recognizers, written from the RelaxNG's text.
 * - **MathML's one root** (the RelaxNG's `start = math`, §2.2): no non-MathML parent admits a MathML
 *   kind but `m:math`.
 * - **Each RelaxNG case, its valid and its invalid instance**, judged by the grammar, by libxml2's
 *   RelaxNG validator over the cached MathML 3 RelaxNG, and by libxml2's XSD validator over the
 *   pinned MathML XSD: the grammar agrees with the RelaxNG on every instance, and the XSD departs
 *   from it exactly where the case says, each departure classified by the rule it is reading 2's.
 * - **Generated MathML**: trees drawn from the run seed, judged by the grammar and by libxml2's
 *   RelaxNG validator, which must agree on every one.
 *
 * The xmllint tests are gated on both caches, `~/.cache/gr8des/qti3/xsd/` and
 * `~/.cache/gr8des/mathml3-rng/`. They write `work/mathml-rng/`.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { floorSeed, rotatingSeed } from "@grizzle/testing/random";
import { sample } from "@grizzle/testing/source";
import { searched } from "@grizzle/testing/vitest";
import { runOfProcess } from "@grizzle/testing/vitest/run";
import {
  Array as Arr,
  Config,
  Duration,
  Effect,
  FileSystem,
  Formatter,
  Option,
  Result,
} from "effect";
import { admits, step } from "#pantry/grammar/ancestry.ts";
import type { Ancestry } from "#pantry/grammar/ancestry.ts";
import { composed } from "#pantry/grammar/compose.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { accepts } from "#pantry/grammar/content.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { foreignKinds, schemaVersions } from "#pantry/grammar/kinds.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { breachesOf, judged as judgedPackage, shown, withItem } from "#pantry/test/probe.ts";
import { xsdDirectory } from "#pantry/vocab/derive/sources.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";
import type { ContentModel, Particle } from "#pantry/vocab/inventory/types.ts";
import { namespaceClassOf } from "#pantry/vocab/namespaces.ts";
import {
  resolverOf,
  toyFacets,
  toyGrammar,
  toySources,
  toyVocabulary,
  XsdOracleLayer,
} from "#pantry/test/gen/grammar.ts";
import {
  mathmlNamespace,
  mathmlRoot,
  relaxNgModels,
  semanticsContexp,
} from "#pantry/test/gen/relaxng.ts";
import type { MathClasses } from "#pantry/test/gen/relaxng.ts";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { xmllintValidate } from "#pantry/xml/oracle.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 8.7 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The composed grammar of production, failing the test that reads it when a generator refuses.
 */
const grammar = Effect.fromResult(composed());

/**
 * The namespace foreign elements are written in, which no vocabulary is in.
 */
const foreignNamespace = "urn:x-mathml-test-foreign";

/**
 * The directory of the cached MathML 3 RelaxNG, in XML syntax, fetched once from
 * https://www.w3.org/Math/RelaxNG/mathml3/ beside its compact syntax.
 */
const relaxNgDirectory = Config.NonEmptyString("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/mathml3-rng`),
);

/**
 * The folder the xmllint tests write their instances to, `packages/pantry/work/mathml-rng-*`, the
 * run's own, so two runs at once never remove each other's batches under xmllint.
 */
const outputRoot = fileScratchDirectory("mathml-rng-");

/**
 * Whether both caches hold what the xmllint tests read: the MathML 3 RelaxNG and the pinned MathML
 * XSD.
 */
const cached = await Effect.runPromise(
  Effect.gen(function* bothCaches() {
    const fs = yield* FileSystem.FileSystem;
    const rng = yield* relaxNgDirectory;
    const xsd = yield* xsdDirectory;

    return (
      (yield* fs.exists(`${rng}/mathml3.rng`)) && (yield* fs.exists(`${xsd}/mathml/mathml3.xsd`))
    );
  }).pipe(
    Effect.catch(() => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * How long one xmllint run over a batch may take: compiling the MathML 3 RelaxNG took 8 s and the
 * MathML XSD 20 s on 2026-11-05 at a load average of about 40, with each instance after that
 * milliseconds. Three times the two compiles, rounded up.
 * Measured 2026-11-07: 42.1 s at a load average of 63 to 73, the slower of its two tests.
 */
const xmllintTimeout = 120_000;

/**
 * Collapse a value's whitespace as XML Schema's `collapse` does (Part 2, 4.3.6).
 *
 * @param value - The raw value.
 * @returns The collapsed value.
 */
const collapsed = (value: string): string =>
  value
    .replaceAll(/[\t\n\r]/gu, " ")
    .trim()
    .replaceAll(/ +/gu, " ");

/**
 * Whether a character is a decimal digit, "U+0030 to U+0039" (§2.1.5.1, `decimal-digit`).
 *
 * @param character - The character.
 * @returns Whether it is one.
 */
const isDigit = (character: string): boolean => character >= "0" && character <= "9";

/**
 * The reference recognizers, written from MathML 3 §2.1.5.1's text and the XSD type each notation
 * type restricts, over the collapsed value:
 *
 * - `unsigned-integer`, "a string of decimal-digits", of `xs:unsignedLong`, at most 2⁶⁴ − 1;
 * - `positive-integer`, "a string of decimal-digits, but not consisting solely of "0"s", of
 *   `xs:positiveInteger`;
 * - `integer`, "an optional "-" (U+002D), followed by a string of decimal digits", of `xs:integer`;
 * - `scriptlevel`, `( "+" | "-" )? unsigned-integer` (§3.3.4.2), of `xs:integer`.
 */
const notations = {
  integer: (value: string) => {
    const digits = value.startsWith("-") ? value.slice(1) : value;

    return digits.length > 0 && digits.split("").every(isDigit);
  },
  "positive-integer": (value: string) =>
    value.length > 0 &&
    value.split("").every(isDigit) &&
    value.split("").some((digit) => digit !== "0"),
  scriptlevel: (value: string) => {
    const digits = value.startsWith("+") || value.startsWith("-") ? value.slice(1) : value;

    return digits.length > 0 && digits.split("").every(isDigit);
  },
  "unsigned-integer": (value: string) =>
    value.length > 0 &&
    value.split("").every(isDigit) &&
    BigInt(value) <= 18_446_744_073_709_551_615n,
} satisfies Readonly<Record<string, (value: string) => boolean>>;

/**
 * One representative attribute of each notation, whose domain the box reads.
 */
const representatives = {
  integer: { kind: "m:msgroup", name: "position" },
  "positive-integer": { kind: "m:mtd", name: "columnspan" },
  scriptlevel: { kind: "m:mstyle", name: "scriptlevel" },
  "unsigned-integer": { kind: "m:msline", name: "length" },
} as const;

/**
 * The notations the box reads, each with its representative and its reference recognizer.
 */
const notationNames = ["integer", "positive-integer", "scriptlevel", "unsigned-integer"] as const;

/**
 * The alphabet of the notation box: each character class a notation tells apart (a zero, another
 * digit, the two signs, the two whitespace characters `collapse` folds, and a letter).
 */
const notationAlphabet = ["0", "1", "9", "+", "-", " ", "\t", "a"] as const;

/**
 * Values at the notations' bounds, beyond the box's reach: `xs:unsignedLong`'s greatest and one
 * past it, with and without leading zeros and padding, and integers wider than 64 bits.
 */
const boundaries = [
  "18446744073709551615",
  "18446744073709551616",
  "018446744073709551615",
  " 18446744073709551615 ",
  "+18446744073709551615",
  "99999999999999999999999",
  "-99999999999999999999999",
  "000",
  "-000",
] as const;

/**
 * Read the compiled pattern of a kind's attribute in a version.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version.
 * @param kind - The kind.
 * @param name - The attribute.
 * @returns Its domain's pattern, as a regular expression.
 */
const patternOf = (
  composedGrammar: ComposedGrammar,
  version: SchemaVersion,
  kind: string,
  name: string,
): RegExp => {
  const handle = Option.getOrThrowWith(
    Option.map(
      composedGrammar.attributes.admission.lookup({ kind, name, version }),
      (row) => row.domain,
    ),
    () => new Error(`${kind}@${name} is not admitted in ${version}.`),
  );
  const domain = Option.getOrThrowWith(
    Arr.findFirst(composedGrammar.attributes.domains, (held) => held.handle === handle),
    () => new Error(`The domain ${handle} is not in the ValueDomain roster.`),
  );

  return new RegExp(domain.pattern, patternFlags);
};

/**
 * Every sequence of at most `length` letters of an alphabet, shortest first.
 *
 * @param alphabet - The letters.
 * @param length - The longest sequence.
 * @returns The sequences.
 */
const sequencesOf = (
  alphabet: readonly string[],
  length: number,
): readonly (readonly string[])[] => {
  const out: (readonly string[])[] = [[]];
  let frontier: readonly (readonly string[])[] = [[]];
  for (let at = 0; at < length; at += 1) {
    frontier = frontier.flatMap((prefix) => alphabet.map((letter) => [...prefix, letter]));
    out.push(...frontier);
  }

  return out;
};

/**
 * The classes of the content box's kinds, read from the RelaxNG's text: `ContExp` holds `cn`, `ci`,
 * `csymbol`, `apply` and `semantics-contexp` (`mathml3-strict-content.rnc` line 14) and `interval`
 * (`mathml3-content.rnc` line 81); `MathExpression` holds those, `semantics` and the presentation
 * tokens such as `mi` (`mathml3-presentation.rnc` lines 14 and 78). Under a math expression's
 * parent a `semantics` is `m:semantics`, so `m:semantics.contexp` is no math expression's kind.
 * `annotation-xml`'s wildcards read `div`, an ASI global, and the foreign kinds of other
 * namespaces and of none as `anyElement`.
 */
const boxClasses: MathClasses = {
  anyElement: (kind) =>
    kind === foreignKinds.other || kind === foreignKinds.absent || kind === "div",
  content: new Set(["m:ci", "m:cn", "m:csymbol", "m:apply", "m:interval", semanticsContexp]),
  inMathml: (kind) => kind.startsWith("m:") || kind === foreignKinds.own,
  math: new Set([
    "m:ci",
    "m:cn",
    "m:csymbol",
    "m:apply",
    "m:interval",
    "m:semantics",
    "m:mi",
    "m:mn",
  ]),
};

/**
 * The boxes of the content test: each parent spec reading 2 restates or edits, the alphabet its
 * sequences are drawn over, and their greatest length. The alphabets hold each class the
 * RelaxNG's pattern tells apart and a kind outside them.
 */
const boxes: readonly {
  readonly alphabet: readonly string[];
  readonly length: number;
  readonly parents: readonly string[];
}[] = [
  {
    alphabet: [
      "m:ci",
      "m:interval",
      "m:bvar",
      "m:condition",
      "m:lowlimit",
      "m:uplimit",
      "m:domainofapplication",
      "m:degree",
      "m:logbase",
    ],
    length: 5,
    parents: [
      "m:apply",
      "m:bind",
      "m:lambda",
      "m:set",
      "m:list",
      "m:vector",
      "m:matrix",
      "m:matrixrow",
    ],
  },
  {
    alphabet: [
      "m:ci",
      "m:interval",
      semanticsContexp,
      "m:semantics",
      "m:mi",
      "m:csymbol",
      "m:annotation",
      "m:bvar",
    ],
    length: 3,
    parents: [
      "m:apply",
      "m:lambda",
      "m:vector",
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
    ],
  },
  {
    alphabet: ["m:ci", "m:semantics.ci", "m:degree", "m:semantics", "m:mi"],
    length: 4,
    parents: ["m:bvar"],
  },
  { alphabet: ["m:piece", "m:otherwise", "m:ci"], length: 5, parents: ["m:piecewise"] },
  {
    alphabet: ["m:mn", "m:msrow", "m:mscarries", "m:msline", "m:bvar"],
    length: 4,
    parents: ["m:mstack", "m:mlongdiv"],
  },
  {
    alphabet: [
      "m:mi",
      "m:apply",
      "m:semantics",
      semanticsContexp,
      "m:bvar",
      "m:math",
      foreignKinds.other,
      foreignKinds.absent,
      foreignKinds.own,
      "div",
    ],
    length: 3,
    parents: ["m:annotation-xml"],
  },
];

describe("spec reading 2: MathML's notation types (MathML 3 §2.1.5.1)", () => {
  it.effect(
    "accept exactly what the notation and its type accept: every string of at most 4 characters over 8 classes, and the bounds",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every string of at most 4 of notationAlphabet (4,681), each notation and scriptlevel, in both versions, then the boundaries",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
            generator: array(element(notationAlphabet), { max: 4, min: 0 }),
            limit: 10_000,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "MathML 3 §2.1.5.1's notations, written from its text (notations)",
            },
            suite: "grammar/mathml/notations",
          },
          (letters, c) =>
            Effect.gen(function* everyString() {
              const composedGrammar = yield* grammar;
              const values = [letters.join(""), ...(letters.length === 0 ? boundaries : [])];
              for (const version of schemaVersions) {
                for (const notation of notationNames) {
                  const { kind, name } = representatives[notation];
                  const pattern = patternOf(composedGrammar, version, kind, name);
                  const reference = notations[notation];
                  for (const value of values) {
                    const expected = reference(collapsed(value));
                    c.note(expected ? "accepted" : "refused");
                    assert.strictEqual(
                      pattern.test(value),
                      expected,
                      `${notation} (${kind}@${name}, ${version}) ${JSON.stringify(value)}`,
                    );
                  }
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "read every MathML attribute of a notation type by its notation, scriptlevel by its own",
    () =>
      // Oracle: the declarations of the IR against the four representatives' patterns: an
      // attribute the XSD types `m:unsigned-integer`, `m:positive-integer` or `m:integer` takes its
      // notation's domain; `scriptlevel`, whose row states its own notation (§3.3.4.2), keeps the
      // type's. Bound: every such declaration, in each of its versions.
      Effect.gen(function* everyDeclaration() {
        const composedGrammar = yield* grammar;
        const notationOf = new Map<string, (typeof notationNames)[number]>([
          ["m:integer", "integer"],
          ["m:positive-integer", "positive-integer"],
          ["m:unsigned-integer", "unsigned-integer"],
        ]);
        const wrong: string[] = [];
        let checked = 0;
        for (const { kind, name, type, versions } of attributeDeclarations) {
          const notation = notationOf.get(type.type);
          if (kind.startsWith("m:") && notation !== undefined) {
            const read = name === "scriptlevel" ? "scriptlevel" : notation;
            const { kind: like, name: likeName } = representatives[read];
            for (const version of versions) {
              checked += 1;
              const handle = (held: string, attribute: string) =>
                Option.map(
                  composedGrammar.attributes.admission.lookup({
                    kind: held,
                    name: attribute,
                    version,
                  }),
                  (row) => row.domain,
                );
              if (
                Option.getOrUndefined(handle(kind, name)) !==
                Option.getOrUndefined(handle(like, likeName))
              ) {
                wrong.push(`${kind}@${name} ${version} is not read as ${read}`);
              }
            }
          }
        }

        assert.isAbove(checked, 0);
        assert.deepStrictEqual(wrong, []);
      }),
  );
});

describe("spec reading 2: MathML's content models (the MathML 3 RelaxNG)", () => {
  it.effect(
    "accept exactly the RelaxNG's child sequences, every sequence of each box",
    () =>
      // Oracle: the specification as a checker, `relaxNgModels`, written from the RelaxNG's text,
      // which tries every split of an ambiguous pattern where the grammar's restatement is
      // deterministic. Bound: `boxes`, every sequence of at most each box's length over its
      // alphabet, every parent of it, in both versions.
      Effect.gen(function* everySequence() {
        const composedGrammar = yield* grammar;
        const wrong: string[] = [];
        let compared = 0;
        for (const { alphabet, length, parents } of boxes) {
          const sequences = sequencesOf(alphabet, length);
          for (const parent of parents) {
            const recognizer = Option.getOrThrowWith(
              Option.fromNullishOr(relaxNgModels.get(parent)),
              () => new Error(`No RelaxNG recognizer reads ${parent}.`),
            );
            for (const version of schemaVersions) {
              for (const children of sequences) {
                compared += 1;
                const installed = accepts(composedGrammar, version, parent, children);
                if (installed !== recognizer(children, boxClasses)) {
                  wrong.push(
                    `${version} ${parent} [${children.join(", ")}]: installed ${installed ? "accepts" : "refuses"}`,
                  );
                }
              }
            }
          }
        }

        assert.isAbove(compared, 0);
        assert.deepStrictEqual(wrong.slice(0, 30), []);
      }),
    testTimeoutMs,
  );

  it.effect(
    "admit no MathML kind but m:math under a parent outside MathML (the RelaxNG's start)",
    () =>
      // Oracle: the RelaxNG's `start = math` (`mathml3-common.rnc` line 15) and §2.2, "All other MathML
      // content must be contained in a math element". Bound: every Admission row.
      Effect.gen(function* everyRow() {
        const { admission } = yield* grammar;
        const wrong = admission.rows
          .filter(
            ({ child, parent }) =>
              child.startsWith("m:") && !parent.startsWith("m:") && child !== mathmlRoot,
          )
          .map(({ child, parent, version }) => `${version} ${parent} admits ${child}`);
        const roots = admission.rows.filter(
          ({ child, parent }) => child === mathmlRoot && !parent.startsWith("m:"),
        );

        assert.isAbove(roots.length, 0);
        assert.deepStrictEqual(wrong, []);
      }),
  );
});

/**
 * An element of a test instance: its namespace, local name, the text it opens with (empty for
 * none) and its element children.
 */
interface Node {
  readonly children: readonly Node[];
  readonly local: string;
  readonly namespace: string;
  readonly text: string;
}

/**
 * A MathML element.
 *
 * @param local - Its local name.
 * @param children - Its children.
 * @returns The element.
 */
const m = (local: string, ...children: readonly Node[]): Node => ({
  children,
  local,
  namespace: mathmlNamespace,
  text: "",
});

/**
 * A MathML element of text alone.
 *
 * @param local - Its local name.
 * @param text - Its text.
 * @returns The element.
 */
const token = (local: string, text: string): Node => ({ ...m(local), text });

/**
 * An element in a namespace no vocabulary is in.
 *
 * @param local - Its local name.
 * @param children - Its children.
 * @returns The element.
 */
const foreign = (local: string, ...children: readonly Node[]): Node => ({
  children,
  local,
  namespace: foreignNamespace,
  text: "",
});

/**
 * Write an instance: a MathML element, its namespaces declared on it.
 *
 * @param node - The element.
 * @param root - Whether it is the instance's root, which declares the namespaces.
 * @returns Its text.
 */
const written = (node: Node, root = true): string => {
  const name = node.namespace === mathmlNamespace ? node.local : `x:${node.local}`;
  const declarations = root ? ` xmlns="${mathmlNamespace}" xmlns:x="${foreignNamespace}"` : "";
  const inner = `${node.text}${node.children.map((child) => written(child, false)).join("")}`;

  return `<${name}${declarations}>${inner}</${name}>`;
};

/**
 * Judge an instance rooted at `m:math` by the grammar, as QTI holds a MathML island and shred reads
 * it: each element's kind is its name resolved under its parent's kind, or its namespace class's
 * foreign kind where no admitted declaration names it; each family of element children steps the
 * parent's automaton and ends where `Last` allows; and each element sits where its ancestry admits
 * it. Text is read as the mixed content it stands in and is not judged; the MathML arity law and
 * the attributes are not read.
 *
 * One rule beside the grammar is read too, the one spec reading 2 needs where shred would read an
 * element no wildcard admits as foreign: no foreign element is in the MathML namespace ("MathML
 * foreign element", MathML 3 RelaxNG `start = math` and `anyElement = element (* - m:*)`,
 * `mathml3-common.rnc` lines 15 and 61). The grammar's root rule leaves a bare `m:mi` under a lax
 * wildcard no MathML kind, and shred refuses it rather than read it as foreign
 * (`#pantry/model/shred.ts`, `childReadingOf`, reason `mathml-foreign`, whose own property is
 * `shred.oracle.test.ts`'s "shred's refusals" variant `mathml foreign`; the oracle's law of the
 * same name is `#pantry/test/oracle.ts`'s, in `wholeBreaches`), so the test states that refusal
 * here, and the grammar's share is the rest.
 *
 * @param composedGrammar - The grammar.
 * @param version - The version.
 * @param root - The instance's root, an `m:math`.
 * @returns Whether the grammar and that law admit it.
 */
const judged = (composedGrammar: ComposedGrammar, version: SchemaVersion, root: Node): boolean => {
  const resolve = resolverOf(composedGrammar.kinds);
  const visit = (node: Node, kind: string, ancestry: Ancestry): boolean => {
    const own = step(composedGrammar.ancestry, ancestry, kind);
    const elements = node.children;
    const kinds = elements.map((child) =>
      Option.getOrElse(
        resolve(child.namespace, child.local, kind),
        () => foreignKinds[namespaceClassOf(child.namespace, node.namespace)],
      ),
    );
    const foreignMathml = elements.some(
      (child, at) =>
        child.namespace === mathmlNamespace && !Arr.getUnsafe(kinds, at).startsWith("m:"),
    );

    return (
      !foreignMathml &&
      accepts(composedGrammar, version, kind, kinds) &&
      elements.every((child, at) => {
        const childKind = Arr.getUnsafe(kinds, at);

        return admits(composedGrammar.ancestry, own, childKind) && visit(child, childKind, own);
      })
    );
  };

  return visit(root, mathmlRoot, new Set());
};

/**
 * What a case's instance is, by each judge: valid or not by the RelaxNG, which the grammar must
 * match, and by the MathML XSD.
 */
interface Case {
  readonly instance: Node;
  readonly name: string;
  readonly relaxNg: boolean;
  /**
   * The rule of reading 2 the case is an instance of, the departure's class where the XSD's verdict
   * differs from the RelaxNG's.
   */
  readonly rule: string;
  readonly xsd: boolean;
}

/**
 * An interval of two numbers.
 */
const unit = m("interval", token("cn", "0"), token("cn", "1"));

/**
 * A bound variable `x`.
 */
const boundX = m("bvar", token("ci", "x"));

/**
 * Each RelaxNG case of reading 2, its valid and its invalid instance, and what the XSD says of
 * each.
 */
const cases: readonly Case[] = [
  {
    instance: m(
      "math",
      m("apply", m("int"), boundX, unit, m("condition", token("ci", "c")), token("ci", "f")),
    ),
    name: "an interval qualifier before a condition",
    relaxNg: true,
    rule: "interval qualifier (mathml3-content.rnc line 41)",
    xsd: false,
  },
  {
    instance: m(
      "math",
      m("apply", m("int"), boundX, token("ci", "f"), m("condition", token("ci", "c"))),
    ),
    name: "a condition after an argument",
    relaxNg: false,
    rule: "interval qualifier (mathml3-content.rnc line 41)",
    xsd: false,
  },
  {
    instance: m("math", m("lambda", boundX, unit, token("ci", "f"))),
    name: "a lambda with an interval qualifier and a body",
    relaxNg: true,
    rule: "interval qualifier (mathml3-content.rnc line 103)",
    xsd: false,
  },
  {
    instance: m("math", m("lambda", boundX, unit, m("condition", token("ci", "c")))),
    name: "a lambda that ends in a qualifier",
    relaxNg: false,
    rule: "interval qualifier (mathml3-content.rnc line 103)",
    xsd: false,
  },
  {
    instance: m("math", m("set", boundX, unit, m("condition", token("ci", "c")), token("ci", "x"))),
    name: "a set with an interval qualifier",
    relaxNg: true,
    rule: "interval qualifier (mathml3-content.rnc line 230)",
    xsd: false,
  },
  {
    instance: m("math", m("vector", token("ci", "a"), m("condition", token("ci", "c")))),
    name: "a vector with a condition after an argument",
    relaxNg: false,
    rule: "interval qualifier (mathml3-content.rnc line 325)",
    xsd: false,
  },
  {
    instance: m(
      "math",
      m(
        "apply",
        m("plus"),
        m("semantics", token("ci", "x"), token("annotation", "a")),
        token("ci", "y"),
      ),
    ),
    name: "a semantics among content expressions",
    relaxNg: true,
    rule: "semantics-contexp (mathml3-strict-content.rnc lines 14 and 23)",
    xsd: false,
  },
  {
    instance: m("math", m("apply", m("plus"), m("semantics", token("mi", "x")), token("ci", "y"))),
    name: "a content expression's semantics around a presentation token",
    relaxNg: false,
    rule: "semantics-contexp (mathml3-strict-content.rnc lines 14 and 23)",
    xsd: false,
  },
  {
    instance: m(
      "math",
      m(
        "lambda",
        m("bvar", m("semantics", token("ci", "x"), token("annotation", "a"))),
        token("ci", "x"),
      ),
    ),
    name: "a bound variable's semantics around ci",
    relaxNg: true,
    rule: "semantics-ci (mathml3-strict-content.rnc line 20)",
    xsd: true,
  },
  {
    instance: m("math", m("lambda", m("bvar", m("semantics", token("cn", "1"))), token("ci", "x"))),
    name: "a bound variable's semantics around cn",
    relaxNg: false,
    rule: "semantics-ci (mathml3-strict-content.rnc line 20)",
    xsd: false,
  },
  {
    instance: m("math", m("semantics", token("mi", "x"), m("annotation-xml"))),
    name: "an empty annotation-xml",
    relaxNg: true,
    rule: "annotation-xml (mathml3-common.rnc line 59)",
    xsd: false,
  },
  {
    instance: m(
      "math",
      m("semantics", token("mi", "x"), m("annotation-xml", token("mi", "a"), token("mi", "b"))),
    ),
    name: "an annotation-xml of two math expressions",
    relaxNg: true,
    rule: "annotation-xml (mathml3-common.rnc line 59)",
    xsd: false,
  },
  {
    instance: m("math", m("semantics", token("mi", "x"), m("annotation-xml", boundX))),
    name: "an annotation-xml holding a bvar",
    relaxNg: false,
    rule: "annotation-xml (mathml3-common.rnc line 59)",
    xsd: true,
  },
  {
    instance: m("math", m("semantics", token("mi", "x"), m("annotation-xml", m("math")))),
    name: "an annotation-xml holding a math",
    relaxNg: false,
    rule: "annotation-xml (mathml3-common.rnc line 59)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m(
        "semantics",
        token("mi", "x"),
        m("annotation-xml", { ...foreign("e", foreign("f")), text: "t" }),
      ),
    ),
    name: "an annotation-xml of foreign markup",
    relaxNg: true,
    rule: "anyElement (mathml3-common.rnc line 61)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m("semantics", token("mi", "x"), m("annotation-xml", foreign("e", token("mi", "a")))),
    ),
    name: "MathML inside foreign markup in annotation-xml",
    relaxNg: false,
    rule: "anyElement (mathml3-common.rnc line 61) and math's root (line 15)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m("semantics", token("mi", "x"), m("annotation-xml", foreign("e", m("math")))),
    ),
    name: "a math inside foreign markup in annotation-xml",
    relaxNg: false,
    rule: "anyElement (mathml3-common.rnc line 61) and one math in another (§2.2)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m("lambda", m("bvar", m("degree", token("cn", "2")), token("ci", "x")), token("ci", "x")),
    ),
    name: "a bound variable with its degree first",
    relaxNg: true,
    rule: "bvar interleave (mathml3-content.rnc line 23)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m("lambda", m("bvar", token("ci", "x"), token("ci", "y")), token("ci", "x")),
    ),
    name: "a bound variable of two variables",
    relaxNg: false,
    rule: "bvar interleave (mathml3-content.rnc line 23)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m(
        "piecewise",
        m("piece", token("ci", "a"), token("ci", "p")),
        m("otherwise", token("ci", "b")),
        m("piece", token("ci", "c"), token("ci", "q")),
      ),
    ),
    name: "an otherwise between pieces",
    relaxNg: true,
    rule: "piecewise interleave (mathml3-content.rnc line 60)",
    xsd: true,
  },
  {
    instance: m(
      "math",
      m("piecewise", m("otherwise", token("ci", "a")), m("otherwise", token("ci", "b"))),
    ),
    name: "two otherwise parts",
    relaxNg: false,
    rule: "piecewise interleave (mathml3-content.rnc line 60)",
    xsd: true,
  },
];

/**
 * The verdicts of one xmllint run over instances: each instance valid or not.
 */
type Verdicts = readonly boolean[];

/**
 * Validate instances with xmllint, against a RelaxNG schema or an XSD, in one run, through the
 * shared validity oracle (`#pantry/xml/oracle.ts` `xmllintValidate`).
 *
 * @param language - The schema's language.
 * @param schema - The schema's path.
 * @param label - The batch's folder under {@link outputRoot}.
 * @param instances - The instances' texts.
 * @returns Each instance's verdict, in order; the oracle's failure when the schema does not
 *   compile or xmllint does not run.
 */
const validated = Effect.fn("test.mathml.validated")(function* validated(
  language: "relax-ng" | "xsd",
  schema: string,
  label: string,
  instances: readonly string[],
) {
  const fs = yield* FileSystem.FileSystem;
  const folder = `${outputRoot}/${label}`;
  yield* fs.remove(folder, { force: true, recursive: true });
  yield* fs.makeDirectory(folder, { recursive: true });

  const files = instances.map((_, index) => `${folder}/${String(index).padStart(4, "0")}.xml`);
  yield* Effect.forEach(
    instances,
    (text, index) => fs.writeFileString(Arr.getUnsafe(files, index), `${text}\n`),
    { concurrency: 8 },
  );

  const verdicts = yield* xmllintValidate({ language, paths: files, schema });

  return verdicts.map(({ _tag }) => _tag === "Valid") satisfies Verdicts;
});

/**
 * How many trees the generated test draws.
 */
const treeCount = 300;

/**
 * The plausible children of each MathML element name the generator writes, from the RelaxNG's
 * patterns, so most drawn trees come near valid ones and the corners reading 2 changes are reached:
 * qualifiers and intervals around arguments, `semantics` among content expressions, any number of
 * children in `annotation-xml`, foreign markup and a nested `math`.
 */
const plausible = new Map<string, readonly string[]>(
  Object.entries({
    "annotation-xml": ["mi", "apply", "semantics", "x:e", "bvar", "math"],
    apply: [
      "plus",
      "sin",
      "int",
      "ci",
      "cn",
      "interval",
      "bvar",
      "condition",
      "lowlimit",
      "uplimit",
      "degree",
      "semantics",
      "apply",
    ],
    bvar: ["ci", "degree", "semantics"],
    condition: ["ci", "apply", "semantics", "interval"],
    degree: ["cn", "ci", "semantics"],
    interval: ["cn", "ci", "semantics"],
    lambda: ["bvar", "interval", "condition", "lowlimit", "uplimit", "ci", "apply", "semantics"],
    lowlimit: ["cn", "ci"],
    math: ["mrow", "mi", "apply", "semantics", "lambda", "set", "vector", "piecewise", "ci"],
    mrow: ["mi", "ci", "semantics", "apply", "mrow"],
    otherwise: ["ci", "cn", "apply"],
    piece: ["ci", "cn", "apply"],
    piecewise: ["piece", "otherwise", "ci"],
    semantics: ["ci", "mi", "apply", "plus", "annotation", "annotation-xml", "semantics"],
    set: ["bvar", "interval", "condition", "ci", "cn", "semantics"],
    uplimit: ["cn", "ci"],
    vector: ["ci", "cn", "interval", "condition", "bvar"],
    "x:e": ["x:e", "mi", "math"],
  }),
);

/**
 * Every name the generator writes.
 */
const names: readonly [string, ...string[]] = [
  "math",
  ...new Set([
    ...plausible.keys(),
    ...[...plausible.values()].flat(),
    "annotation",
    "mi",
    "ci",
    "cn",
    "plus",
    "sin",
    "int",
  ]),
];

/**
 * The names whose content is text alone in the RelaxNG, which the generator leaves empty or gives a
 * text.
 */
const textual: ReadonlySet<string> = new Set(["mi", "ci", "cn", "annotation"]);

/**
 * Draw a tree under a name: its children from the name's plausible children, each a wild child
 * from every name at weight 1 in 8, at most 4 of them, to depth 4.
 *
 * @param name - The element's name, `x:` for a foreign one.
 * @param depth - How many levels may still be drawn.
 * @returns The generator.
 */
const nodeOf =
  (name: string, depth: number): Gen<Node> =>
  (source) => {
    const pool = plausible.get(name) ?? [];
    const children: Node[] = [];
    if (depth > 0 && Arr.isReadonlyArrayNonEmpty(pool)) {
      const count = source.draw(int(0, 4));
      for (let at = 0; at < count; at += 1) {
        const wild = source.draw(int(0, 7)) === 0;
        const child = source.draw(element(wild ? names : pool));
        children.push(source.draw(nodeOf(child, depth - 1)));
      }
    }

    return name.startsWith("x:")
      ? foreign(name.slice(2), ...children)
      : { ...m(name, ...children), text: textual.has(name) ? "v" : "" };
  };

/**
 * A generated `math` tree.
 */
const treeOf: Gen<Node> = nodeOf("math", 4);

/**
 * A toy model `(... | ...)*` of one choice that repeats, each alternative an element particle of
 * the kinds it lists, under the toy kind `p`.
 *
 * @param alternatives - Each alternative's kinds.
 * @returns The model.
 */
const repeatedChoice = (
  alternatives: readonly (readonly [string, ...string[]])[],
): ContentModel => {
  const sources = toySources(schemaVersions);
  const once = { max: Option.some(1), min: 1 };
  const choice: Particle = {
    _tag: "group",
    compositor: "choice",
    occurs: { max: Option.none(), min: 0 },
    particles: alternatives.map((kinds): Particle => ({
      _tag: "element",
      kinds,
      occurs: once,
      sources,
    })),
    sources,
  };

  return {
    content: {
      _tag: "element-only",
      particle: {
        _tag: "group",
        compositor: "sequence",
        occurs: once,
        particles: [choice],
        sources,
      },
    },
    kind: "p",
    sources,
    type: Option.none(),
    versions: schemaVersions,
  };
};

/**
 * Compose a toy vocabulary of `p` over `a`, `b` and `c`, its model ended by some kinds.
 *
 * @param model - `p`'s model.
 * @param ending - The kinds its families end with.
 * @returns The grammar, or the composition's refusal.
 */
const endedToy = (model: ContentModel, ending: readonly [string, ...string[]]) =>
  toyGrammar([
    {
      ...toyVocabulary({
        admission: [],
        attributes: [],
        data: ["ws", "comment", "pi"],
        facets: toyFacets({
          content: {
            edits: [{ _tag: "ends", kinds: ending, parent: "p", source: "a toy ending" }],
            models: [],
            roots: [],
          },
        }),
        kinds: ["p", "a", "b", "c"],
      }),
      models: [model],
    },
  ]);

describe("MathML 3 §3.6.5.1: mscarries is never the last element of an mstack or mlongdiv", () => {
  it.effect(
    "refuses a package whose mstack ends in an mscarries, under N7 Last and child-set",
    () =>
      // Oracle: §3.6.5.1, "It is an error for mscarries to be the last element of an mstack or
      // mlongdiv element", as the law oracle judges a whole package. Bound: one package, the base
      // item with that `mstack` after its paragraph.
      Effect.gen(function* endsInCarries() {
        const breaches = breachesOf(
          yield* judgedPackage(
            withItem(
              `<p id="intro">Pick one.</p>`,
              `<p id="intro">Pick one.</p><p><m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mstack><m:mn>1</m:mn><m:mscarries/></m:mstack></m:math></p>`,
            ),
          ),
        );

        assert.deepStrictEqual(
          breaches.map(({ law }) => law),
          ["N7 Last"],
        );
        assert.match(shown(breaches), /^N7 Last \(child-set\) at item\.xml/u);
      }),
  );
});

/**
 * A package whose item holds one math formula after its paragraph.
 *
 * @param formula - The content markup, written in the `m:` prefix.
 * @returns The package's files.
 */
const withFormula = (formula: string) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one.</p><p><m:math xmlns:m="http://www.w3.org/1998/Math/MathML">${formula}</m:math></p>`,
  );

describe("MathML 3 §4.3.3 and §4.2.6.1: qualifiers in order, a condition after a bvar, a bind with a bvar", () => {
  // Each case's laws in order. The oracle sets the child N5 refuses aside and judges the rest, so
  // a bind left with its operator alone also ends where its model cannot (N7).
  const refused: readonly (readonly [string, string, readonly string[]])[] = [
    [
      "a condition before a lowlimit",
      "<m:apply><m:int/><m:bvar><m:ci>x</m:ci></m:bvar><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:lowlimit><m:cn>0</m:cn></m:lowlimit><m:ci>f</m:ci></m:apply>",
      ["N5 Follow"],
    ],
    [
      "a condition with no bvar before it",
      "<m:apply><m:sum/><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:ci>f</m:ci></m:apply>",
      ["N5 Follow"],
    ],
    ["a bind with no bvar", "<m:bind><m:forall/><m:ci>p</m:ci></m:bind>", ["N5 Follow", "N7 Last"]],
  ];
  const accepted: readonly (readonly [string, string])[] = [
    [
      "an interval, then a condition, after a bvar",
      "<m:apply><m:int/><m:bvar><m:ci>x</m:ci></m:bvar><m:interval><m:cn>0</m:cn><m:cn>1</m:cn></m:interval><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:ci>f</m:ci></m:apply>",
    ],
    [
      "a lambda with a bvar and an interval",
      "<m:lambda><m:bvar><m:ci>x</m:ci></m:bvar><m:interval><m:cn>0</m:cn><m:cn>1</m:cn></m:interval><m:ci>f</m:ci></m:lambda>",
    ],
    [
      "a degree before a momentabout",
      "<m:apply><m:moment/><m:degree><m:cn>2</m:cn></m:degree><m:momentabout><m:cn>0</m:cn></m:momentabout><m:ci>x</m:ci></m:apply>",
    ],
    [
      "a degree after an applied operator",
      "<m:apply><m:apply><m:ci>f</m:ci></m:apply><m:degree><m:cn>2</m:cn></m:degree><m:ci>x</m:ci></m:apply>",
    ],
    [
      "a list with a bvar, then a condition",
      "<m:list><m:bvar><m:ci>x</m:ci></m:bvar><m:condition><m:apply><m:gt/><m:ci>x</m:ci><m:cn>0</m:cn></m:apply></m:condition><m:ci>x</m:ci></m:list>",
    ],
    [
      "a bind with a bvar",
      "<m:bind><m:forall/><m:bvar><m:ci>x</m:ci></m:bvar><m:ci>p</m:ci></m:bind>",
    ],
  ];

  it.effect.each(refused)("refuses %s", ([, formula, laws]) =>
    // Oracle: §4.3.3 ("they appear in the order bvar, lowlimit, uplimit, interval, condition,
    // domainofapplication, degree, momentabout, logbase"), §4.3.3.1 ("condition qualifiers ...
    // require a preceding bvar") and §4.2.6.1 ("followed by a non-empty list of bvar elements"),
    // as the law oracle judges a whole package. Bound: the three inputs that failed.
    Effect.gen(function* refusedFormula() {
      const breaches = breachesOf(yield* judgedPackage(withFormula(formula)));

      assert.deepStrictEqual(
        breaches.map(({ law }) => law),
        laws,
        shown(breaches),
      );
      assert.match(shown(breaches), /^N5 Follow \(ordering\) at item\.xml/u);
    }),
  );

  it.effect.each(accepted)("accepts %s", ([, formula]) =>
    // Oracle: the same rules; the formula follows them, so no law breaches. Bound: the six
    // inputs that must stay accepted, with a bind that holds a bvar.
    Effect.gen(function* acceptedFormula() {
      const breaches = breachesOf(yield* judgedPackage(withFormula(formula)));

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }),
  );
});

describe("the ending edit, which lambda's restatement reads (content.ts, endedBy)", () => {
  it.effect(
    "ends a family exactly where its last child is a listed kind, every family of at most 4 over 3 kinds, each ending of 1 or 2 kinds",
    () =>
      // Oracle: the edit's contract, a family is nonempty and its last child's kind is listed.
      // Bound: `(a | b | c)*`, every family of at most 4 children, ended by each nonempty proper
      // subset of the three kinds.
      Effect.gen(function* everyFamily() {
        const wrong: string[] = [];
        const endings: readonly (readonly [string, ...string[]])[] = [
          ["a"],
          ["b"],
          ["c"],
          ["a", "b"],
          ["a", "c"],
          ["b", "c"],
        ];
        for (const ending of endings) {
          const toy = yield* Effect.fromResult(
            endedToy(repeatedChoice([["a"], ["b"], ["c"]]), ending),
          );
          for (const children of sequencesOf(["a", "b", "c"], 4)) {
            const last = children.at(-1);
            const expected = last !== undefined && ending.includes(last);
            if (accepts(toy, "3.0.1", "p", children) !== expected) {
              wrong.push(
                `[${ending.join(" ")}] ends [${children.join(" ")}]: ${String(!expected)}`,
              );
            }
          }
        }

        assert.deepStrictEqual(wrong, []);
      }),
  );

  it("refuses an ending that lists some of one position's kinds, and states one that lists them all", () => {
    // Oracle: the edit's contract, a position's state cannot tell which of its kinds ended the
    // family. Bound: `([a, b] | c)*`, ended by `a`, by `a` and `b`, and by `c`.
    const mixed = repeatedChoice([["a", "b"], ["c"]]);

    assert.strictEqual(
      Result.match(endedToy(mixed, ["a"]), {
        onFailure: (error) => error._tag,
        onSuccess: () => "composed",
      }),
      "MixedEnding",
    );
    for (const ending of [["a", "b"], ["c"]] as const) {
      assert.isTrue(Result.isSuccess(endedToy(mixed, ending)), ending.join(" "));
    }
  });
});

describe.skipIf(!cached)("spec reading 2 against libxml2's RelaxNG and XSD validators", () => {
  it.effect(
    "agree with the RelaxNG on each case's valid and invalid instance, the XSD departing exactly where the case classifies it",
    () =>
      // Oracle: a second implementation, libxml2's RelaxNG validator over the MathML 3 RelaxNG;
      // libxml2's XSD validator over the pinned MathML XSD records each departure, classified by
      // the reading-2 rule its case names. Bound: `cases`, both versions.
      Effect.gen(function* everyCase() {
        const composedGrammar = yield* grammar;
        const texts = cases.map(({ instance }) => written(instance));
        const rng = yield* validated(
          "relax-ng",
          `${yield* relaxNgDirectory}/mathml3.rng`,
          "cases-rng",
          texts,
        );
        const xsd = yield* validated(
          "xsd",
          `${yield* xsdDirectory}/mathml/mathml3.xsd`,
          "cases-xsd",
          texts,
        );
        const wrong = cases.flatMap(({ instance, name, relaxNg, rule, xsd: departure }, index) => [
          ...(Arr.getUnsafe(rng, index) === relaxNg
            ? []
            : [`${name}: libxml2's RelaxNG says ${String(!relaxNg)}`]),
          ...(Arr.getUnsafe(xsd, index) === departure
            ? []
            : [`${name}: libxml2's XSD says ${String(!departure)}, unclassified (${rule})`]),
          ...schemaVersions.flatMap((version) =>
            judged(composedGrammar, version, instance) === relaxNg
              ? []
              : [`${name}: the grammar in ${version} says ${String(!relaxNg)} (${rule})`],
          ),
        ]);

        assert.deepStrictEqual(wrong, []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xmllintTimeout,
  );

  it.effect(
    "agree with the RelaxNG on generated MathML: 300 trees of depth at most 4, drawn from the run seed",
    (ctx) =>
      // Oracle: a second implementation, libxml2's RelaxNG validator over the MathML 3 RelaxNG.
      // Bound: `treeCount` trees from `treeOf`, each element's children drawn from the plausible
      // children of its name or, at the swarm's weight, from every name (a wild child), a fresh draw
      // each run (TEST_SEED replays it).
      Effect.gen(function* generated() {
        const composedGrammar = yield* grammar;
        const run = yield* runOfProcess;
        const trees = sample(
          treeOf,
          rotatingSeed(run.seed, floorSeed("grammar/mathml/trees")),
          treeCount,
        );
        const rng = yield* validated(
          "relax-ng",
          `${yield* relaxNgDirectory}/mathml3.rng`,
          "trees-rng",
          trees.map((tree) => written(tree)),
        );
        const valid = rng.filter(Boolean).length;
        const wrong = trees.flatMap((tree, index) => {
          const expected = Arr.getUnsafe(rng, index);
          const held = judged(composedGrammar, "3.0.1", tree);

          return held === expected
            ? []
            : [
                `${written(tree)}: the RelaxNG says ${String(expected)}, the grammar ${String(held)}`,
              ];
        });

        yield* Effect.promise(() =>
          ctx.annotate(
            `${String(trees.length)} trees, ${String(valid)} valid by the RelaxNG`,
            "bound",
          ),
        );
        assert.isAbove(valid, 0);
        assert.isBelow(valid, trees.length);
        assert.deepStrictEqual(wrong.slice(0, 10), []);
      }).pipe(Effect.provide(XsdOracleLayer)),
    xmllintTimeout,
  );
});
