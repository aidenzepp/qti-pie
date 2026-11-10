/**
 * An include splices its target in place only where it may stand for that target's root (spec
 * readings 114 and 117): an include under one of `splicingParents` whose target's root
 * `IncludeRoot` does not give its parent splices nothing, "Include root" refuses it, and the
 * document it names heads an assembly of its own. The law oracle judges so (`standsFor` in
 * `#pantry/test/oracle.ts`), and the schema states it as `Inclusion.splices`, which
 * `SiteTarget.splices` copies and `Document.spliced` counts (`#pantry/qti/tests.ts`).
 *
 * The box is an item whose response processing includes a rule fragment, and whose body or
 * processing includes one more document: none, the item itself, a paragraph or a rule, each of the
 * last two naming a declared variable or one the item does not declare. Every case is judged by the
 * law oracle and by the schema's own laws over the import's rows (`#pantry/test/host-judge.ts`),
 * and the laws each side breaks must be one set, but for the classes {@link recorded} names and
 * decision 451's {@link nonStandingCycle}.
 *
 * An item that includes itself where an item may not stand is the case GEN-A's differential found
 * (`#pantry/test/gen/genetic/known.ts`, "oracle-only-law: Variable declared"): counted as a splice,
 * the include left the item heading no assembly, so its rule fragment was judged nowhere.
 */
import type { Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { lawNameOf } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/test/qti.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/judged-laws.ts";
import { judge as judgeOracle, lawsOf } from "#pantry/test/oracle.ts";

/**
 * The include parents of the box: an item's body, where a paragraph may stand and a rule may not,
 * and its response processing, where a rule may stand and a paragraph may not.
 */
const parents = ["qti-item-body", "qti-response-processing"] as const;

/**
 * What the second include names: nothing, the item itself (which no include may stand for), a
 * paragraph or a set-outcome-value rule, each of the two fragments with or without a reference to
 * a variable the item does not declare.
 */
const targets = [
  "none",
  "the item",
  "a paragraph",
  "a paragraph naming NOPE",
  "a rule",
  "a rule naming NOPE",
] as const;

/**
 * One case: the second include's parent and target, and whether the rule fragment the processing
 * includes sets a declared outcome or an undeclared one.
 */
interface StandCase {
  readonly parent: (typeof parents)[number];
  readonly rules: "declared" | "undeclared";
  readonly target: (typeof targets)[number];
}

/**
 * Every case of the box: 24 in all.
 */
const standCases: Gen<StandCase> = (source) => ({
  parent: source.draw(element(parents)),
  rules: source.draw(element(["declared", "undeclared"] as const)),
  target: source.draw(element(targets)),
});

/**
 * Decide whether a case's second include may stand for its target's root (`IncludeRoot`, reading
 * 114): a paragraph in a body, a rule in a response processing.
 *
 * @param drawn - The case.
 * @returns Whether it may, none where the case writes no second include of a fragment.
 */
const standsIn = (drawn: StandCase): Option.Option<boolean> => {
  switch (drawn.target) {
    case "none":
    case "the item": {
      return Option.none();
    }
    case "a paragraph":
    case "a paragraph naming NOPE": {
      return Option.some(drawn.parent === "qti-item-body");
    }
    case "a rule":
    case "a rule naming NOPE": {
      return Option.some(drawn.parent === "qti-response-processing");
    }
    default: {
      return drawn.target satisfies never;
    }
  }
};

/**
 * A disagreement class the box shows, its owner and the fix it waits on, and the cases it shows
 * in: no other case may show it, and each must.
 */
interface Recorded {
  readonly fix: string;
  readonly owner: string;
  readonly shows: (drawn: StandCase) => boolean;
}

/**
 * The disagreements the box shows today, each keyed by its signature, the law a side breaks alone:
 * none. Lane ASM's two classes, a fragment whose include may not stand for its root judged in the
 * item by the schema and alone by the oracle ("Printed variable reference" and "Variable
 * declared"), closed when the schema placed a target only at a site that places it
 * (`SiteTarget.places`, genetic repair gr-2), so every case of theirs must now agree.
 */
const recorded: Readonly<Record<string, Recorded>> = {};

/**
 * The one class the box may show beyond {@link recorded} (decision 451): a cycle closed by an
 * include that may not stand for its target's root. The law oracle counts every include as an edge
 * of reading 85's chain (`inclusionCycles` in `#pantry/test/oracle.ts`), as XInclude still recurses
 * through it; the schema places a child instance only at a site that places its target
 * (`SiteTarget.places`, `#pantry/qti/tests.ts`), so its "Inclusion cycle" sees no such edge. Both
 * refuse the package under "Include root", so no verdict moves: the case may differ by "Inclusion
 * cycle" alone, and only where both sides break "Include root". A cycle every edge of which is a
 * standing include must still agree. It is outlandish and absent from the 1EdTech corpus, so it is
 * a stated limit, not a rework (the operator's outlandish-case rule).
 */
const nonStandingCycle = "oracle-only-law: Inclusion cycle";

/**
 * Decide whether a case's chain is closed by an include that may not stand: the item including
 * itself, which no include may stand for, under either parent.
 *
 * @param drawn - The case.
 * @returns Whether it is.
 */
const closedByNonStanding = (drawn: StandCase): boolean => drawn.target === "the item";

/**
 * The QTI 3.0 namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XInclude namespace.
 */
const xi = "http://www.w3.org/2001/XInclude";

/**
 * The XML declaration every document of the box opens with.
 */
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

/**
 * The path each target is written at, none for no second include.
 */
const targetPaths: Readonly<Record<StandCase["target"], Option.Option<string>>> = {
  "a paragraph": Option.some("paragraph.xml"),
  "a paragraph naming NOPE": Option.some("paragraph.xml"),
  "a rule": Option.some("rule.xml"),
  "a rule naming NOPE": Option.some("rule.xml"),
  none: Option.none(),
  "the item": Option.some("item.xml"),
};

/**
 * Write a fragment target's text: a paragraph, whose printed variable names `SCORE` or `NOPE`, or
 * a rule setting `SCORE` or `NOPE`.
 *
 * @param target - The target.
 * @returns Its document, none for a target that is no fragment of its own.
 */
const fragmentOf = (target: StandCase["target"]): Option.Option<string> => {
  switch (target) {
    case "a paragraph":
    case "a paragraph naming NOPE": {
      return Option.some(
        `${declaration}\n<p xmlns="${asi}">Score: <qti-printed-variable identifier="${target === "a paragraph" ? "SCORE" : "NOPE"}"/></p>\n`,
      );
    }
    case "a rule":
    case "a rule naming NOPE": {
      return Option.some(
        `${declaration}\n<qti-set-outcome-value xmlns="${asi}" identifier="${target === "a rule" ? "SCORE" : "NOPE"}"><qti-base-value base-type="float">2</qti-base-value></qti-set-outcome-value>\n`,
      );
    }
    case "none":
    case "the item": {
      return Option.none();
    }
    default: {
      return target satisfies never;
    }
  }
};

/**
 * Write a manifest's resource for a document of the package, listing its one file.
 *
 * @param type - The resource's type.
 * @param href - The document's path.
 * @param at - The resource's number, which names its identifier.
 * @returns The `resource` element.
 */
const resource = (type: string, href: string, at: number): string =>
  `<resource identifier="r${String(at)}" type="${type}" href="${href}"><file href="${href}"/></resource>`;

/**
 * Encode a document's text as its entry's bytes.
 *
 * @param text - The text.
 * @returns Its UTF-8 bytes.
 */
const encoded = (text: string): Uint8Array => new TextEncoder().encode(text);

/**
 * Build a case's package: the item, its rule fragment, the second include's target where it is a
 * fragment, and a manifest listing each.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: StandCase): PackageEntries => {
  const include = Option.match(targetPaths[drawn.target], {
    onNone: () => "",
    onSome: (href) => `<xi:include href="${href}"/>`,
  });
  const fragment = Option.map(fragmentOf(drawn.target), (text) => ({
    path: Option.getOrElse(targetPaths[drawn.target], () => ""),
    text,
  }));
  const item = [
    declaration,
    `<qti-assessment-item xmlns="${asi}" xmlns:xi="${xi}" identifier="item1" title="Item" adaptive="false" time-dependent="false">`,
    '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
    `<qti-item-body><p>Body.</p>${drawn.parent === "qti-item-body" ? include : ""}</qti-item-body>`,
    `<qti-response-processing><xi:include href="rules.xml"/>${drawn.parent === "qti-response-processing" ? include : ""}</qti-response-processing>`,
    "</qti-assessment-item>",
    "",
  ].join("\n");
  const rules = `${declaration}\n<qti-response-condition xmlns="${asi}"><qti-response-if><qti-base-value base-type="boolean">true</qti-base-value><qti-set-outcome-value identifier="${drawn.rules === "declared" ? "SCORE" : "NOPE"}"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>\n`;
  const manifest = [
    declaration,
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="m">',
    "<metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata>",
    "<organizations/><resources>",
    resource("imsqti_item_xmlv3p0", "item.xml", 1),
    resource("imsqti_fragment_xmlv3p0", "rules.xml", 2),
    ...Option.toArray(fragment).map(({ path }) => resource("imsqti_fragment_xmlv3p0", path, 3)),
    "</resources></manifest>",
    "",
  ].join("\n");

  return new Map([
    ["imsmanifest.xml", encoded(manifest)],
    ["item.xml", encoded(item)],
    ["rules.xml", encoded(rules)],
    ...Option.toArray(fragment).map(({ path, text }) => [path, encoded(text)] as const),
  ]);
};

/**
 * Name the laws a host judgment lists, each by its law's name.
 *
 * @param laws - The broken or skipped laws.
 * @returns Their names.
 */
const named = (laws: readonly { readonly law: Law }[]): ReadonlySet<string> =>
  new Set(laws.flatMap(({ law }) => Option.toArray(lawNameOf(law))));

/**
 * The timeout, in milliseconds, that this file's test states: a hang guard, never a budget.
 * Measured 2026-11-07: 20.6 s at a load average of 83 to 96, its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The oracle's law tables over the installed grammar.
 */
const oracleLaws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * A situation the box must reach.
 */
type Situation =
  | "accepted"
  | "a fragment spliced in place"
  | "a fragment no include may splice, judged alone"
  | "a self-including item's rule fragment judged in place";

/**
 * One case of the spliced include's own attributes: the `parse` an include of a fragment writes,
 * and whether its `href` names the fragment, so that it splices, or no file, so that nothing does.
 */
interface ParseCase {
  readonly href: "the fragment" | "no file";
  readonly parse: string;
}

/**
 * The cases: `parse` spelled `xml`, as reading 85 binds it, and three spellings it refuses, each
 * on an include that splices, and one refused spelling on an include whose target is no file.
 */
const parseCases: readonly ParseCase[] = [
  { href: "the fragment", parse: "xml" },
  { href: "the fragment", parse: "XML" },
  { href: "the fragment", parse: "text" },
  { href: "the fragment", parse: "single" },
  { href: "no file", parse: "XML" },
];

/**
 * Build a parse case's package: an item whose body includes a `div` fragment under the case's
 * `parse`, listed beside the fragment by a manifest whose resources write no identifier and no
 * file.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const parsePackageOf = (drawn: ParseCase): PackageEntries => {
  const href = drawn.href === "the fragment" ? "rtest01-fragment.xml" : "rtest01-missing.xml";
  const manifest = `${declaration}\n<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"><metadata><schemaversion>3.0.0</schemaversion></metadata><resources><resource type="imsqti_item_xmlv3p0" href="rtest01/rtest01-set01.xml"/><resource type="imsqti_fragment_xmlv3p0" href="rtest01/rtest01-fragment.xml"/></resources></manifest>\n`;
  const item = `${declaration}\n<qti-assessment-item xmlns="${asi}" xmlns:xi="${xi}"><qti-item-body><xi:include href="${href}" parse="${drawn.parse}"/></qti-item-body></qti-assessment-item>\n`;

  return new Map([
    ["imsmanifest.xml", encoded(manifest)],
    ["rtest01/rtest01-fragment.xml", encoded(`${declaration}\n<div xmlns="${asi}"/>\n`)],
    ["rtest01/rtest01-set01.xml", encoded(item)],
  ]);
};

layer(NodeServices.layer, { excludeTestServices: true })(
  "an include that splices its target",
  (it) => {
    it.effect(
      "keeps its own attributes, so both judges hold its parse to xml",
      () =>
        // Oracle: two implementations side by side, the law oracle's attribute laws over the
        // unspliced include and the schema's laws over the import's rows. Bound: the include's
        // parse in xml and three refused spellings on an include that splices, and one refused
        // spelling on an include that names no file: five packages.
        Effect.forEach(
          parseCases,
          (drawn) =>
            Effect.scoped(
              Effect.gen(function* oneParseCase() {
                const dir = yield* scopedPackage(parsePackageOf(drawn));
                const judgment = yield* judgeOracle(yield* readPackage(dir), grammar, oracleLaws);
                assert.strictEqual(judgment._tag, "Judged", Formatter.format(drawn));

                const breaches = judgment._tag === "Judged" ? judgment.breaches : [];
                const oracle = new Set<string>(breaches.map(({ law }) => law));
                const program = yield* readProgram(dir);
                const host = judge(hostRowsOf(program.inputs), hostLaws);
                const broken = named(host.broken);
                const unjudged = named(host.skipped);
                const shown = [
                  ...[...broken]
                    .filter((law) => !oracle.has(law))
                    .map((law) => `import-only-law: ${law}`),
                  ...[...oracle]
                    .filter((law) => !broken.has(law) && !unjudged.has(law))
                    .map((law) => `oracle-only-law: ${law}`),
                ].toSorted();

                assert.strictEqual(
                  breaches.some(
                    ({ keys, law }) => law === "value domain" && keys["name"] === "parse",
                  ),
                  drawn.parse !== "xml",
                  Formatter.format(drawn),
                );
                assert.deepStrictEqual(shown, [], Formatter.format(drawn));
              }),
            ),
          { discard: true },
        ),
      testTimeoutMs,
    );
  },
);

layer(NodeServices.layer, { excludeTestServices: true })(
  "an include that may not stand for its target's root",
  (it) => {
    it.effect(
      "splices nothing, so the law oracle and the import's rows break one set of laws",
      (ctx) =>
        // Oracle: two implementations side by side, the law oracle's splicing by standsFor and the
        // schema's laws over the import's rows. Bound: two include parents, six second targets and
        // a rule fragment setting a declared or an undeclared outcome: 24 packages.
        searched(
          ctx,
          exhaust(
            {
              box: "an item's second include under its body or its processing, naming nothing, the item, a paragraph or a rule, the last two naming a declared or an undeclared variable, beside a rule fragment setting a declared or an undeclared outcome",
              caseHang: Duration.minutes(2),
              coverage: requiredInSpace<Situation>([
                "accepted",
                "a fragment spliced in place",
                "a fragment no include may splice, judged alone",
                "a self-including item's rule fragment judged in place",
              ]),
              generator: standCases,
              limit: 40,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle's splicing by standsFor, and the schema's laws over the import's rows",
              },
              suite: "test/include-stands",
            },
            (drawn, c) =>
              Effect.scoped(
                Effect.gen(function* oneCase() {
                  const dir = yield* scopedPackage(packageOf(drawn));
                  const judgment = yield* judgeOracle(yield* readPackage(dir), grammar, oracleLaws);
                  assert.strictEqual(judgment._tag, "Judged", Formatter.format(drawn));

                  const oracle = new Set<string>(
                    judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
                  );
                  const program = yield* readProgram(dir);
                  const host = judge(hostRowsOf(program.inputs), hostLaws);
                  const broken = named(host.broken);
                  const unjudged = named(host.skipped);
                  const shown = [
                    ...[...broken]
                      .filter((law) => !oracle.has(law))
                      .map((law) => `import-only-law: ${law}`),
                    ...[...oracle]
                      .filter((law) => !broken.has(law) && !unjudged.has(law))
                      .map((law) => `oracle-only-law: ${law}`),
                  ].toSorted();
                  const compared =
                    closedByNonStanding(drawn) &&
                    oracle.has("Include root") &&
                    broken.has("Include root")
                      ? shown.filter((signature) => signature !== nonStandingCycle)
                      : shown;
                  const expected = Object.entries(recorded)
                    .filter(([, { shows }]) => shows(drawn))
                    .map(([signature]) => signature)
                    .toSorted();
                  const stands = standsIn(drawn);
                  if (oracle.size === 0) {
                    c.note("accepted");
                  }

                  if (Option.contains(stands, true)) {
                    c.note("a fragment spliced in place");
                  }

                  if (Option.contains(stands, false)) {
                    c.note("a fragment no include may splice, judged alone");
                  }

                  if (
                    drawn.target === "the item" &&
                    drawn.rules === "undeclared" &&
                    oracle.has("Variable declared") &&
                    broken.has("Variable declared")
                  ) {
                    c.note("a self-including item's rule fragment judged in place");
                  }

                  assert.deepStrictEqual(
                    compared,
                    expected,
                    `${Formatter.format(drawn)}: ${shown.join("; ") || "no disagreement"}, where ${expected.join("; ") || "none"} is recorded; the oracle breaks ${[...oracle].toSorted().join(", ") || "no law"}; the import's rows break ${[...broken].toSorted().join(", ") || "no law"}`,
                  );
                }),
              ),
          ),
        ),
      testTimeoutMs,
    );
  },
);
