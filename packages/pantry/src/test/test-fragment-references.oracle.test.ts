/**
 * A fragment's references resolve where it is included, once per placement, as its merged document
 * holds them (spec reading 117): a fragment a test or a section document splices resolves its
 * feedback and printed variables in the test's declarations, as the section document's own do, and
 * the variable references a rule fragment spliced into the test's outcome processing makes are read
 * as the test's own (readings 48 and 88); a fragment an item splices resolves them in the item's.
 *
 * The box is the every-relation package with a fragment spliced into one host: a rubric of the
 * test, the section document's rubric, the test's outcome processing, or an item's body. The
 * fragment makes one reference, a printed variable or a feedback outcome in content and a
 * set-outcome-value in processing, which names a variable its host's assembly declares or one it
 * does not, and is included once or twice. Every case is judged by the law oracle
 * (`#pantry/test/oracle-laws/tests.ts`, which reads each document a test places with the fragments
 * it splices) and by the schema's own laws over the import's rows (`#pantry/test/host-judge.ts`:
 * `SectionScope`'s placements, `TestReference` over every document that is no item), and the laws
 * each side breaks must be one set.
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
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import { judge as judgeOracle, lawsOf } from "#pantry/test/oracle.ts";
import { schemaLawNameOf } from "#pantry/test/law-namer.ts";

/**
 * Where the fragment is spliced: a rubric block of the test's first section, after its ordering
 * (a section's rubric blocks follow its selection and ordering), the section document's rubric,
 * the test's outcome processing, or the body of the every-relation package's third item.
 */
const hosts = ["test rubric", "section document", "test processing", "item body"] as const;

/**
 * The reference a content fragment makes: a printed variable's `identifier`, or a feedback
 * inline's `outcome-identifier`. A processing fragment's is a set-outcome-value's `identifier`.
 */
const kinds = ["printed variable", "feedback"] as const;

/**
 * One case: the host, the reference's kind (read only in content), whether the name it spells is
 * one its host's assembly declares, and how many includes place the fragment.
 */
interface FragmentCase {
  readonly host: (typeof hosts)[number];
  readonly kind: (typeof kinds)[number];
  readonly placed: 1 | 2;
  readonly resolves: boolean;
}

/**
 * Every case of the box: 32 drawn, 28 distinct, the processing host's reference kind being its
 * set-outcome-value alone.
 */
const fragmentCases: Gen<FragmentCase> = (source) => ({
  host: source.draw(element(hosts)),
  kind: source.draw(element(kinds)),
  placed: source.draw(element([1, 2] as const)),
  resolves: source.draw(element([true, false])),
});

/**
 * The QTI 3.0 namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XInclude namespace.
 */
const xi = "http://www.w3.org/2001/XInclude";

/**
 * The fragment's path, beside the test.
 */
const fragmentPath = "afragment.xml";

/**
 * The name a case's reference spells: one its host's assembly declares, an outcome of the test's
 * (`TOTAL`, `VERDICT`) or of the item's (`SCORE`, and the `VERDICT` the box adds to it), else one
 * no declaration holds.
 *
 * @param drawn - The case.
 * @returns The name.
 */
const nameOf = (drawn: FragmentCase): string => {
  if (!drawn.resolves) {
    return "NOPE";
  }

  if (drawn.host !== "test processing" && drawn.kind === "feedback") {
    return "VERDICT";
  }

  return drawn.host === "item body" ? "SCORE" : "TOTAL";
};

/**
 * Write a case's fragment: a paragraph holding its printed variable or feedback inline, or, in the
 * test's outcome processing, a set-outcome-value.
 *
 * @param drawn - The case.
 * @returns The document.
 */
const fragmentOf = (drawn: FragmentCase): string => {
  const name = nameOf(drawn);
  if (drawn.host === "test processing") {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<qti-set-outcome-value xmlns="${asi}" identifier="${name}"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>\n`;
  }

  const reference =
    drawn.kind === "printed variable"
      ? `<qti-printed-variable identifier="${name}"/>`
      : `<qti-feedback-inline outcome-identifier="${name}" identifier="true" show-hide="show">Passed.</qti-feedback-inline>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n<p xmlns="${asi}">Included: ${reference}</p>\n`;
};

/**
 * Replace the one occurrence of a text in an entry of a package.
 *
 * @param entries - The package's entries.
 * @param path - The entry.
 * @param search - The text, which must occur exactly once.
 * @param replacement - Its replacement.
 * @returns The entries, that entry edited.
 */
const replaced = (
  entries: PackageEntries,
  path: string,
  search: string,
  replacement: string,
): PackageEntries => {
  const text = new TextDecoder().decode(entries.get(path));
  assert.lengthOf(text.split(search), 2, `${path}: ${search}`);

  return new Map([
    ...entries,
    [path, new TextEncoder().encode(text.replace(search, () => replacement))],
  ]);
};

/**
 * Build a case's package: the every-relation package, its third item declaring an identifier
 * outcome `VERDICT` beside its `SCORE`, the fragment listed, and its includes in the host.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: FragmentCase): PackageEntries => {
  const includes = `<xi:include href="${fragmentPath}"/>`.repeat(drawn.placed);
  const placing: Readonly<
    Record<FragmentCase["host"], (entries: PackageEntries) => PackageEntries>
  > = {
    "item body": (entries) =>
      replaced(
        entries,
        "items/item3.xml",
        "<p>Scored by its included rule.</p>",
        `<p>Scored by its included rule.</p>${includes.replaceAll(fragmentPath, `../${fragmentPath}`)}`,
      ),
    "section document": (entries) =>
      replaced(
        replaced(
          entries,
          "section.xml",
          "<qti-assessment-section ",
          `<qti-assessment-section xmlns:xi="${xi}" `,
        ),
        "section.xml",
        "      <div><qti-printed-variable",
        `      ${includes}<div><qti-printed-variable`,
      ),
    "test processing": (entries) =>
      replaced(
        replaced(
          entries,
          "test.xml",
          "<qti-assessment-test ",
          `<qti-assessment-test xmlns:xi="${xi}" `,
        ),
        "test.xml",
        "  </qti-outcome-processing>",
        `    ${includes}\n  </qti-outcome-processing>`,
      ),
    "test rubric": (entries) =>
      replaced(
        replaced(
          entries,
          "test.xml",
          "<qti-assessment-test ",
          `<qti-assessment-test xmlns:xi="${xi}" `,
        ),
        "test.xml",
        '      <qti-ordering shuffle="true"/>\n',
        `      <qti-ordering shuffle="true"/>\n      <qti-rubric-block use="instructions" view="candidate"><qti-content-body>${includes}</qti-content-body></qti-rubric-block>\n`,
      ),
  };
  const steps: readonly ((entries: PackageEntries) => PackageEntries)[] = [
    (entries) =>
      replaced(
        entries,
        "items/item3.xml",
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="VERDICT" cardinality="single" base-type="identifier"/>',
      ),
    (entries) =>
      replaced(
        entries,
        "imsmanifest.xml",
        '<resource identifier="section-res"',
        `<resource identifier="afragment-res" type="imsqti_fragment_xmlv3p0" href="${fragmentPath}">\n      <file href="${fragmentPath}"/>\n    </resource>\n    <resource identifier="section-res"`,
      ),
    (entries) => new Map([...entries, [fragmentPath, new TextEncoder().encode(fragmentOf(drawn))]]),
    placing[drawn.host],
  ];

  let entries = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });
  for (const step of steps) {
    entries = step(entries);
  }

  return entries;
};

/**
 * Name the laws a host judgment lists, each by its law's name.
 *
 * @param laws - The broken or skipped laws.
 * @returns Their names.
 */
const named = (laws: readonly { readonly law: Law }[]): ReadonlySet<string> =>
  new Set(laws.flatMap(({ law }) => Option.toArray(schemaLawNameOf(law))));

/**
 * The oracle's law tables over the installed grammar.
 */
const oracleLaws = lawsOf(grammar);

/**
 * Every law the host judges, read once.
 */
const hostLaws = judgedLaws(Qti);

/**
 * A situation the box must reach: each host's fragment accepted and refused.
 */
type Situation = `${FragmentCase["host"]}, ${"accepted" | "refused"}`;

layer(NodeServices.layer, { excludeTestServices: true })(
  "the references of a fragment a test, a section document or an item splices",
  (it) => {
    it.effect(
      "resolve in the assembly that places it, once per placement, the law oracle and the import's rows alike",
      (ctx) =>
        // Oracle: two implementations side by side, the law oracle's reading of each document a
        // test places with what it splices, and the schema's laws over the import's rows. Bound:
        // four hosts, two content references, a name declared or not, one or two includes: 32
        // packages.
        searched(
          ctx,
          exhaust(
            {
              box: "a fragment spliced into a test rubric, a section document's rubric, the test's outcome processing or an item's body, once or twice, its printed variable, feedback outcome or set-outcome-value naming a declared or an undeclared variable",
              caseHang: Duration.minutes(2),
              coverage: requiredInSpace<Situation>([
                "test rubric, accepted",
                "test rubric, refused",
                "section document, accepted",
                "section document, refused",
                "test processing, accepted",
                "test processing, refused",
                "item body, accepted",
                "item body, refused",
              ]),
              generator: fragmentCases,
              limit: 48,
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the law oracle's test references read through what each document splices, and the schema's laws over the import's rows",
              },
              suite: "test/test-fragment-references",
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
                  c.note(`${drawn.host}, ${oracle.size === 0 ? "accepted" : "refused"}`);
                  assert.strictEqual(
                    oracle.size === 0,
                    drawn.resolves,
                    `${Formatter.format(drawn)}: the oracle breaks ${[...oracle].toSorted().join(", ") || "no law"}`,
                  );

                  // An unresolved feedback outcome once broke "Feedback outcome type" on the import's
                  // rows alone, resolved to the nil declaration of base type none; it has no
                  // declaration row now, so that law judges only a resolved outcome (lane NIL's NS2).
                  assert.deepStrictEqual(
                    shown,
                    [],
                    `${Formatter.format(drawn)}: ${shown.join("; ")}; the oracle breaks ${[...oracle].toSorted().join(", ") || "no law"}; the import's rows break ${[...broken].toSorted().join(", ") || "no law"}`,
                  );
                }),
              ),
          ),
        ),
      600_000,
    );
  },
);
