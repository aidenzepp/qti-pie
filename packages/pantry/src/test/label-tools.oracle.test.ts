/**
 * Label tools judged by the law oracle and built by the import's identity rows, over items that put
 * a `label` on each kind of label characteristic (spec reading 128): a body element's, which asks
 * the item's root for `tool-name` and `tool-version`, the 3.0.1 item root's own, which does too,
 * and an `ItemFileInfo`'s (`qti-digital-material`, `qti-calculator-info`, §5.80.2) and a printed
 * variable's (§7.30.4), which are text for a reader and ask for nothing.
 *
 * Oracle: the information model's description of each label characteristic, as the case model
 * records which element carries a label, so no expected breach or row is computed by the oracle's
 * or the builder's own selection. The database's side is `program.oracle.db.test.ts`'s pair of
 * packages.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn as drawnFrom, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, boolean, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { swarm, swarmChoice } from "@grizzle/testing/swarm";
import { notesOnly } from "@grizzle/testing/sense";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { NodeMember } from "#pantry/import/write.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 24 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 480_000;

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The places a case's item may carry a `label`: the root, two body elements of the BaseSequence
 * family (a `p` and a `span`, §5.16.5), a printed variable, a calculator's info and a digital
 * material.
 */
const places = ["root", "p", "span", "printed", "calculator", "material"] as const;

/**
 * One place a case's item may carry a `label`.
 */
type Place = (typeof places)[number];

/**
 * The kind of the element at each place.
 */
const kindAt: Readonly<Record<Place, string>> = {
  calculator: "qti-calculator-info",
  material: "qti-digital-material",
  p: "p",
  printed: "qti-printed-variable",
  root: "qti-assessment-item",
  span: "span",
};

/**
 * One case: the places that carry a `label`, how many digital materials the item lists (each
 * labelled where `material` is), whether its root carries `tool-name` and `tool-version`, and the
 * schema version its manifest names.
 */
interface LabelCase {
  readonly labelled: readonly Place[];
  readonly materials: number;
  readonly toolName: boolean;
  readonly toolVersion: boolean;
  readonly version: "3.0.0" | "3.0.1";
}

/**
 * Read whether a case's place carries a `label`.
 *
 * @param drawn - The case.
 * @param place - The place.
 * @returns Whether it does.
 */
const carries = (drawn: LabelCase, place: Place): boolean => drawn.labelled.includes(place);

/**
 * Write a `label` attribute where a case puts one.
 *
 * @param drawn - The case.
 * @param place - The place.
 * @returns The attribute with its leading space, or nothing.
 */
const labelAt = (drawn: LabelCase, place: Place): string =>
  carries(drawn, place) ? ` label="${place}"` : "";

/**
 * Write a one-item package for a case, each file's text encoded as UTF-8, as `readPackage` returns
 * one: the manifest naming the item, and an item with an outcome its printed variable names, the
 * companion materials the case draws and a body of one paragraph.
 *
 * @param drawn - The case.
 * @returns The entries, sorted by path.
 */
const packageOf = (drawn: LabelCase): readonly PackageFile[] => {
  const calculator = carries(drawn, "calculator")
    ? `<qti-calculator><qti-calculator-type>basic</qti-calculator-type><qti-description>A calculator</qti-description><qti-calculator-info${labelAt(drawn, "calculator")}><qti-file-href>https://example.org/calculator.html</qti-file-href></qti-calculator-info></qti-calculator>`
    : "";
  const materials = Array.from(
    { length: drawn.materials },
    (_unused, at) =>
      `<qti-digital-material${labelAt(drawn, "material")}><qti-file-href>https://example.org/table-${String(at)}.html</qti-file-href></qti-digital-material>`,
  ).join("");
  const companion =
    calculator === "" && materials === ""
      ? ""
      : `<qti-companion-materials-info>${calculator}${materials}</qti-companion-materials-info>`;
  const root = [
    `xmlns="${asi}" identifier="item" title="Item" time-dependent="false"`,
    drawn.toolName ? 'tool-name="t"' : "",
    drawn.toolVersion ? 'tool-version="1"' : "",
  ].join(" ");
  const files = {
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${drawn.version}</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item ${root}${labelAt(drawn, "root")}><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${companion}<qti-item-body><p${labelAt(drawn, "p")}>Score <span${labelAt(drawn, "span")}>now</span> <qti-printed-variable identifier="SCORE"${labelAt(drawn, "printed")}/></p></qti-item-body></qti-assessment-item>`,
  };

  return Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));
};

/**
 * The kinds of a case's labels that ask for the item's tools, one per labelled element, sorted:
 * the body elements' in either version and the root's in 3.0.1 (§5.16.5; 3.0.1's §4.1.3), never
 * an `ItemFileInfo`'s (§5.80.2) or a printed variable's (§7.30.4), and never the 3.0.0 root's
 * (3.0.0's §4.1.3).
 *
 * @param drawn - The case.
 * @returns The kinds.
 */
const askingKinds = (drawn: LabelCase): readonly string[] =>
  [
    ...(carries(drawn, "root") && drawn.version === "3.0.1" ? [kindAt.root] : []),
    ...(carries(drawn, "p") ? [kindAt.p] : []),
    ...(carries(drawn, "span") ? [kindAt.span] : []),
  ].toSorted();

/**
 * Judge a case by the oracle and read its breaches, failing when the codec refuses it or any law
 * but Label tools breaks: every case's item is valid but for its labels.
 *
 * @param drawn - The case.
 * @returns The kinds of the elements Label tools breaks at, sorted.
 */
const labelToolBreaches = (drawn: LabelCase) =>
  Effect.gen(function* breachesOfCase() {
    const judgment = yield* judge(packageOf(drawn), grammar, laws);
    if (judgment._tag === "CodecRefusal") {
      return assert.fail(`the codec refused the case: ${judgment.rule}, ${judgment.detail}`);
    }

    assert.deepStrictEqual(
      judgment.breaches.filter(({ law }) => law !== "Label tools").map(({ law }) => law),
      [],
      "no law but Label tools breaks",
    );

    return judgment.breaches.map(({ keys }) => keys["kind"] ?? "").toSorted();
  });

/**
 * Read every node of a nested tree, the root and its descendants.
 *
 * @param node - The tree's root.
 * @returns The nodes, in document order.
 */
const nodesOf = (node: NodeMember): readonly NodeMember[] => [
  node,
  ...node.children.flatMap(nodesOf),
];

/**
 * Build a case's import program through the reader, the codec and the overlay builders, its files
 * written to a scratch folder, and read the kinds of the elements its `LabelUse` rows name.
 *
 * @param drawn - The case.
 * @returns The kinds, sorted.
 */
const labelUseKinds = (drawn: LabelCase) =>
  Effect.scoped(
    Effect.gen(function* rowsOfCase() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* scratchDirectory("label-tools-");
      for (const { bytes, path } of packageOf(drawn)) {
        yield* fs.writeFile(`${dir}/${path}`, bytes);
      }

      const program = yield* readProgram(dir);
      const kinds = new Map(
        [...program.inputs.Node.values()]
          .flatMap(nodesOf)
          .map(({ id, kind }) => [id, kind] as const),
      );

      return [...program.inputs.LabelUse.values()]
        .map(({ node }) => kinds.get(node) ?? `no node ${node}`)
        .toSorted();
    }),
  );

/**
 * Every choice of the small box: each place labelled or not, one digital material where it is
 * labelled, each tool named or not, in either version.
 */
const boxCases: Gen<LabelCase> = (source) => {
  const labelled = places.filter(() => source.draw(boolean));

  return {
    labelled,
    materials: labelled.includes("material") ? 1 : 0,
    toolName: source.draw(boolean),
    toolVersion: source.draw(boolean),
    version: source.draw(element(["3.0.0", "3.0.1"] as const)),
  };
};

/**
 * Every choice of the rows' box: each place labelled or not, one digital material where it is
 * labelled, neither tool named, in either version, since a row is written whether or not the
 * root names its tools.
 */
const rowCases: Gen<LabelCase> = (source) => {
  const labelled = places.filter(() => source.draw(boolean));

  return {
    labelled,
    materials: labelled.includes("material") ? 1 : 0,
    toolName: false,
    toolVersion: false,
    version: source.draw(element(["3.0.0", "3.0.1"] as const)),
  };
};

/**
 * A situation the box must reach: each label that asks for no tool alone in an item that names no
 * tool, each that does, and the item that names both.
 */
type BoxSituation =
  | "a calculator's label alone, no tool named"
  | "a digital material's label alone, no tool named"
  | "a printed variable's label alone, no tool named"
  | "a body element's label, no tool named"
  | "a 3.0.0 root's label alone, no tool named"
  | "a 3.0.1 root's label alone, no tool named"
  | "both tools named";

/**
 * The note of a box case, by its labels and tools.
 *
 * @param drawn - The case.
 * @returns The situation it reaches, if one.
 */
const boxNote = (drawn: LabelCase): BoxSituation | undefined => {
  if (drawn.toolName && drawn.toolVersion) {
    return "both tools named";
  }

  if (drawn.labelled.includes("p") || drawn.labelled.includes("span")) {
    return "a body element's label, no tool named";
  }

  const [only, ...rest] = drawn.labelled;
  if (rest.length > 0 || only === undefined) {
    return undefined;
  }

  const alone: Partial<Readonly<Record<Place, BoxSituation>>> = {
    calculator: "a calculator's label alone, no tool named",
    material: "a digital material's label alone, no tool named",
    printed: "a printed variable's label alone, no tool named",
    root: `a ${drawn.version} root's label alone, no tool named`,
  };

  return alone[only];
};

/**
 * The kinds a swarm turns on: each place's label, as a feature.
 */
const swarmPlaces = ["p", "span", "printed", "calculator", "material", "root"] as const;

/**
 * Draw a case under a swarm: each place labelled at its own weight, up to three digital materials,
 * each tool named or not, in either version.
 */
const swarmCases: Gen<LabelCase> = (source) => {
  const mix = source.draw(swarm(swarmPlaces));
  const labelled = [
    ...new Set(
      source.draw(array((inner) => inner.draw(swarmChoice(mix, swarmPlaces)), { max: 4, min: 0 })),
    ),
  ];

  return {
    labelled,
    materials: source.draw(element([0, 1, 2, 3] as const)),
    toolName: source.draw(boolean),
    toolVersion: source.draw(boolean),
    version: source.draw(element(["3.0.0", "3.0.1"] as const)),
  };
};

/**
 * A situation the swarm must reach: items with several kinds of label at once.
 */
type SwarmNote = "reader labels beside a body label" | "several digital materials labelled";

describe("test/oracle.ts and import/overlays/identity.ts, Label tools by label characteristic", () => {
  it.effect(
    "the oracle breaks Label tools once at each label whose characteristic asks for a tool, exactly when the root lacks a tool, and never at an ItemFileInfo's or a printed variable's",
    (ctx) =>
      // Oracle: the information model's label characteristics, as `askingKinds` reads the case.
      // Bound: every item of the six places each labelled or not, each tool named or not, in each
      // version, 512.
      searched(
        ctx,
        exhaust(
          {
            box: "every item whose root, p, span, printed variable, calculator info and digital material each carry a label or not, each tool named or not, in 3.0.0 or 3.0.1",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<BoxSituation>([
              "a calculator's label alone, no tool named",
              "a digital material's label alone, no tool named",
              "a printed variable's label alone, no tool named",
              "a body element's label, no tool named",
              "a 3.0.0 root's label alone, no tool named",
              "a 3.0.1 root's label alone, no tool named",
              "both tools named",
            ]),
            generator: boxCases,
            limit: 600,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's label characteristics: §5.16.5 and its kin ask for tools, §5.80.2 and §7.30.4 do not; 3.0.1's §4.1.3",
            },
            suite: "test/oracle-label-characteristics",
          },
          (drawn: LabelCase, c) =>
            Effect.gen(function* boxCase() {
              const note = boxNote(drawn);
              if (note !== undefined) {
                c.note(note);
              }

              assert.deepStrictEqual(
                yield* labelToolBreaches(drawn),
                drawn.toolName && drawn.toolVersion ? [] : askingKinds(drawn),
                JSON.stringify(drawn),
              );
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "the import writes one LabelUse row per label whose characteristic asks for a tool, and none for an ItemFileInfo's, a printed variable's or a 3.0.0 root's",
    (ctx) =>
      // Oracle: the same characteristics, as `askingKinds` reads the case; a row is written for
      // each asking label whether or not the root names its tools, which the law then judges.
      // Bound: every item of the six places each labelled or not, neither tool named, in each
      // version, 128.
      searched(
        ctx,
        exhaust(
          {
            box: "every item whose six places each carry a label or not, in 3.0.0 or 3.0.1",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<BoxSituation>([
              "a body element's label, no tool named",
              "a digital material's label alone, no tool named",
            ]),
            generator: rowCases,
            limit: 200,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's label characteristics, §5.16.5 and its kin, §5.80.2 and §7.30.4",
            },
            suite: "import/label-use-rows",
          },
          (drawn: LabelCase, c) =>
            Effect.gen(function* rowsCase() {
              const note = boxNote(drawn);
              if (note !== undefined) {
                c.note(note);
              }

              assert.deepStrictEqual(
                yield* labelUseKinds(drawn),
                askingKinds(drawn),
                JSON.stringify(drawn),
              );
            }).pipe(Effect.provide(NodeServices.layer)),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "the oracle and the import agree with the characteristics over swarm-drawn items of several labels and materials",
    (ctx) =>
      // Oracle: `askingKinds`, against both the oracle's breaches and the import's rows.
      // Bound: 120 items drawn under a swarm over the six places' weights, up to three materials.
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(30),
            concurrency: 1,
            coverage: required<SwarmNote>(
              ["reader labels beside a body label", "several digital materials labelled"],
              { cases: 100, sense: notesOnly },
            ),
            draw: drawnFrom(swarmCases),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the information model's label characteristics, §5.16.5 and its kin, §5.80.2 and §7.30.4; 3.0.1's §4.1.3",
            },
            runs: 120,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "test/oracle-label-swarm",
          },
          (drawn, c) =>
            Effect.gen(function* swarmCase() {
              const asking = askingKinds(drawn);
              if (
                asking.some((kind) => kind === "p" || kind === "span") &&
                drawn.labelled.some((place) =>
                  ["printed", "calculator", "material"].includes(place),
                )
              ) {
                c.note("reader labels beside a body label");
              }

              if (drawn.materials > 1 && carries(drawn, "material")) {
                c.note("several digital materials labelled");
              }

              assert.deepStrictEqual(
                yield* labelToolBreaches(drawn),
                drawn.toolName && drawn.toolVersion ? [] : asking,
                "oracle",
              );
              assert.deepStrictEqual(yield* labelUseKinds(drawn), asking, "rows");
            }).pipe(Effect.provide(NodeServices.layer)),
        ),
      ),
    testTimeoutMs,
  );
});
