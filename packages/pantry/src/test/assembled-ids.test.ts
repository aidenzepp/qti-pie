/**
 * The IDs of an assembled test, judged over the assembly (spec readings 86 and 117): a test's
 * rubric, the section document it places and a fragment that document's rubric includes, each
 * carrying one ID, the three alike or apart, the section placed once or twice and the fragment
 * included once or twice. The law oracle states "DocumentId key" and "Idref target" over each
 * assembly as Q5.13's instances place it (`#pantry/test/oracle.ts` `assembliesOf`), and the
 * import's rows are judged by the schema's own laws on the host (`#pantry/test/host-judge.ts`),
 * and the two verdicts must be one. A test rubric's IDREF may name its section document's ID, since
 * the test's assembly holds it, and a section document's may not name the test's, since its own
 * assembly does not.
 *
 * The section document is placed whole, an instance of its own, and the test writes its elements
 * once however often it is placed (reading 86), so two section refs of it collide with nothing.
 * The fragment is spliced in place into the section document (reading 117), so including it twice
 * merges its ID twice, and its ID collides with the section's own. An ID two distinct elements of
 * the assembly carry is refused, whichever documents write them: a test rubric's and its section
 * document's, a section document's and its fragment's.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { rulesOf } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge, judgedLaws } from "#pantry/test/host-judge.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 240.3 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * Which of the three carriers share their ID: none, two of them, or all three.
 */
const alikes = [
  "apart",
  "test and section",
  "test and fragment",
  "section and fragment",
  "all",
] as const;

/**
 * Which IDREF a case writes: none, the test rubric's naming the section document's ID, or the
 * section document's naming the test rubric's.
 */
const references = ["none", "test names section", "section names test"] as const;

/**
 * One case of the box: which carriers share their ID, how many section refs place the section
 * document, how many includes of its rubric place the fragment, and which IDREF it writes.
 */
interface IdCase {
  readonly alike: (typeof alikes)[number];
  readonly fragments: 1 | 2;
  readonly reference: (typeof references)[number];
  readonly sections: 1 | 2;
}

/**
 * Every case of the box: 60 in all.
 */
const idCases: Gen<IdCase> = (source) => ({
  alike: source.draw(element(alikes)),
  fragments: source.draw(element([1, 2] as const)),
  reference: source.draw(element(references)),
  sections: source.draw(element([1, 2] as const)),
});

/**
 * The ID each carrier writes under a case: `shared` where the case makes it alike with another,
 * its own name otherwise.
 */
/**
 * The ID each of the three carriers writes.
 */
interface CarriedIds {
  readonly fragment: string;
  readonly section: string;
  readonly test: string;
}

const idsOf = ({ alike }: IdCase): CarriedIds => ({
  fragment:
    alike === "test and fragment" || alike === "section and fragment" || alike === "all"
      ? "shared"
      : "fragmentId",
  section:
    alike === "test and section" || alike === "section and fragment" || alike === "all"
      ? "shared"
      : "sectionId",
  test:
    alike === "test and section" || alike === "test and fragment" || alike === "all"
      ? "shared"
      : "testId",
});

/**
 * The XInclude namespace.
 */
const xi = "http://www.w3.org/2001/XInclude";

/**
 * The fragment the section document's rubric includes.
 */
const fragmentPath = "sfragment.xml";

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
 * Build a case's package: the every-relation package with an ID on a rubric of the test's first
 * section, on its section document's rubric and on a fragment that rubric includes, its section
 * document placed by one or two section refs and the fragment by one or two includes.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: IdCase): PackageEntries => {
  const ids = idsOf(drawn);
  const fragment = `<?xml version="1.0" encoding="UTF-8"?>\n<p xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" id="${ids.fragment}">Included.</p>\n`;
  const steps: readonly ((entries: PackageEntries) => PackageEntries)[] = [
    // A section's rubric blocks follow its qti-ordering, so the test's rubric goes after it.
    (entries) =>
      replaced(
        entries,
        "test.xml",
        '<qti-assessment-section identifier="first" title="First" visible="true">\n      <qti-ordering shuffle="true"/>\n',
        `<qti-assessment-section identifier="first" title="First" visible="true">\n      <qti-ordering shuffle="true"/>\n      <qti-rubric-block use="instructions" view="candidate"><qti-content-body><p id="${ids.test}"${drawn.reference === "test names section" ? ` aria-labelledby="${ids.section}"` : ""}>Test.</p></qti-content-body></qti-rubric-block>\n`,
      ),
    (entries) =>
      drawn.sections === 1
        ? entries
        : replaced(
            entries,
            "test.xml",
            '<qti-assessment-section-ref identifier="placement" href="section.xml"/>',
            '<qti-assessment-section-ref identifier="placement" href="section.xml"/><qti-assessment-section-ref identifier="placementAgain" href="section.xml"/>',
          ),
    (entries) =>
      replaced(
        entries,
        "section.xml",
        "<qti-assessment-section ",
        `<qti-assessment-section xmlns:xi="${xi}" `,
      ),
    (entries) =>
      replaced(
        entries,
        "section.xml",
        "      <div><qti-printed-variable",
        `      ${`<xi:include href="${fragmentPath}"/>`.repeat(drawn.fragments)}<div id="${ids.section}"${drawn.reference === "section names test" ? ` aria-labelledby="${ids.test}"` : ""}><qti-printed-variable`,
      ),
    (entries) =>
      replaced(
        entries,
        "imsmanifest.xml",
        '<resource identifier="section-res"',
        `<resource identifier="sfragment-res" type="imsqti_fragment_xmlv3p0" href="${fragmentPath}">\n      <file href="${fragmentPath}"/>\n    </resource>\n    <resource identifier="section-res"`,
      ),
    (entries) => new Map([...entries, [fragmentPath, new TextEncoder().encode(fragment)]]),
  ];

  let entries = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });
  for (const step of steps) {
    entries = step(entries);
  }

  return entries;
};

/**
 * Every law the host judges, read once.
 */
const laws = judgedLaws(Qti);

/**
 * A situation the box must reach: each verdict, and a section document placed twice whose IDs
 * collide with nothing.
 */
type Situation =
  | "accepted"
  | "refused"
  | "a section placed twice, accepted"
  | "the test names the section's ID, accepted";

layer(NodeServices.layer, { excludeTestServices: true })("the IDs of an assembled test", (it) => {
  it.effect(
    "refuses an ID two elements of the assembly carry and accepts the rest, the law oracle and the import's rows alike",
    (ctx) =>
      // Oracle: two implementations side by side, the law oracle's assembly over the listed
      // documents and the schema's own laws over the import's rows. Bound: three carriers, five
      // ways they share an ID, the section placed once or twice, the fragment included once or
      // twice, and no IDREF or one either way: 60 packages.
      searched(
        ctx,
        exhaust(
          {
            box: "a test rubric's, its section document's and that document's fragment's IDs, alike or apart, the section placed once or twice, the fragment included once or twice, and an IDREF from the test to the section or back",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<Situation>([
              "accepted",
              "refused",
              "a section placed twice, accepted",
              "the test names the section's ID, accepted",
            ]),
            generator: idCases,
            limit: 80,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's assembly, and the schema's laws over the import's rows",
            },
            suite: "test/assembled-ids",
          },
          (drawn, c) =>
            Effect.scoped(
              Effect.gen(function* oneCase() {
                const dir = yield* scopedPackage(packageOf(drawn));
                const verdict = yield* oracleVerdict(yield* readPackage(dir));
                const program = yield* readProgram(dir);
                const { broken } = judge(hostRowsOf(program.inputs), laws);
                const [first, ...rest] = broken.map(({ law }) => law);
                const rule =
                  first === undefined
                    ? "accepted"
                    : Option.getOrElse(Arr.head(rulesOf([first, ...rest])), () => "unnamed");
                const rules = verdict.kind === "accepted" ? new Set(["accepted"]) : verdict.rules;
                c.note(verdict.kind);
                if (verdict.kind === "accepted" && drawn.sections === 2) {
                  c.note("a section placed twice, accepted");
                }

                if (verdict.kind === "accepted" && drawn.reference === "test names section") {
                  c.note("the test names the section's ID, accepted");
                }

                assert.isTrue(
                  rules.has(rule),
                  `${Formatter.format(drawn)}: the import's rows give ${rule} (${broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law"}), the oracle ${[...rules].join(", ")}`,
                );
              }),
            ),
        ),
      ),
    testTimeoutMs,
  );
});
