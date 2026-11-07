/**
 * Where a document's root may stand, judged by the law oracle and built by the import's reader: the
 * document node's model admits the manifest's root and each root kind `RootOfType` pairs with a
 * resource type, and no other (spec readings 93 and 114). Any other element at a document's root
 * has no representation, so the codec refuses its package as `unmodeled-vocabulary` before any row
 * exists, the importer and the oracle alike. A root it admits is read, and its document breaks
 * `RootOfType` (P2, `root-type-reverse`) exactly where its (resource type, root kind) is no pair
 * of the relation.
 *
 * Oracle: the specification's statement of `RootOfType`, the closed relation's rows, which say
 * which root kinds a document of some type may have, so no expected verdict is computed by shred's
 * or the oracle's own reading of the document.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, FileSystem, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { manifestRoot } from "#pantry/grammar/facets.ts";
import { fragmentType } from "#pantry/grammar/include.ts";
import { readProgram } from "#pantry/import/program.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { globalKinds, vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * `RootOfType`'s rows: each resource type that lists documents, with a root kind its documents may
 * have.
 */
const rootsOfType = grammar.package.rootOfType.rows;

/**
 * The root kinds a document may have: the manifest's, which no resource type lists, and each kind
 * `RootOfType` pairs with a type.
 */
const documentRootKinds: ReadonlySet<string> = new Set([
  manifestRoot,
  ...rootsOfType.map(({ root }) => root),
]);

/**
 * Each element kind's expanded name, by its handle, from the vocabularies that declare it.
 */
const elementNames: ReadonlyMap<string, { readonly local: string; readonly namespace: string }> =
  new Map(
    vocabularies.flatMap(({ kinds, namespace }) =>
      kinds.map(({ handle, local }) => [handle, { local, namespace }] as const),
    ),
  );

/**
 * One case: a package whose manifest lists one document, `doc.xml`, under a resource type, the
 * document an empty element of one kind.
 */
interface RootCase {
  readonly root: string;
  readonly type: string;
}

/**
 * Write a case's package, each file's text encoded as UTF-8, as `readPackage` returns one: a 3.0.0
 * manifest whose one resource lists `doc.xml` under the case's type, and `doc.xml`, the case's root
 * alone, in its vocabulary's namespace.
 *
 * @param drawn - The case.
 * @returns The entries, sorted by path.
 */
const packageOf = (drawn: RootCase): readonly PackageFile[] => {
  const name = elementNames.get(drawn.root);
  const files = {
    "doc.xml":
      name === undefined
        ? assert.fail(`no vocabulary declares ${drawn.root}`)
        : `<${name.local} xmlns="${name.namespace}"/>`,
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="R" type="${drawn.type}" href="doc.xml"><file href="doc.xml"/></resource></resources></manifest>`,
  };

  return Object.entries(files).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));
};

/**
 * Read a case's package through the import's reader, its files written to a scratch folder.
 *
 * @param drawn - The case.
 * @returns The program, or the reader's refusal.
 */
const programOf = (drawn: RootCase) =>
  Effect.scoped(
    Effect.gen(function* readCase() {
      const fs = yield* FileSystem.FileSystem;
      const dir = yield* scratchDirectory("document-roots-");
      for (const { bytes, path } of packageOf(drawn)) {
        yield* fs.writeFile(`${dir}/${path}`, bytes);
      }

      return yield* Effect.result(readProgram(dir));
    }),
  );

/**
 * Name what the import's reader did with a case's package.
 *
 * @param drawn - The case.
 * @returns The rule the reader refuses it under, or `read` when it builds every row.
 */
const readerVerdict = (drawn: RootCase) =>
  Effect.map(programOf(drawn), (read) => {
    if (Result.isSuccess(read)) {
      return "read";
    }

    return read.failure._tag === "ImportRefused" ? read.failure.rule : read.failure._tag;
  });

/**
 * Every element kind any schema of QTI 3.0 declares globally, the elements XML Schema would assess
 * a document's root against.
 */
const globalRoots = globalKinds.map(({ kind }) => kind);

/**
 * Each of {@link globalRoots} as the root of an item resource's one document.
 */
const rootCases: Gen<RootCase> = (source) => ({
  root: source.draw(
    element(
      Arr.isReadonlyArrayNonEmpty(globalRoots)
        ? globalRoots
        : assert.fail("no schema declares a global element"),
    ),
  ),
  type: "imsqti_item_xmlv3p0",
});

/**
 * A situation the box must reach: a root no resource type lists, and one some type lists.
 */
type RootSituation =
  | "a root no resource type lists, refused before any row"
  | "a root some resource type lists, read"
  | "p29's qti-outcome-processing";

/**
 * The resource types that list documents, each once, in `RootOfType`'s order.
 */
const documentTypes = [...new Set(rootsOfType.map(({ type }) => type))];

/**
 * The root kinds of the documents a type other than the included fragment's lists, each once, and
 * the manifest's: a fragment's type holds every kind an include stands for (spec reading 114), and
 * the box takes each type's own roots.
 */
const ownRoots = [
  ...new Set([
    ...rootsOfType.filter(({ type }) => type !== fragmentType).map(({ root }) => root),
    manifestRoot,
  ]),
];

/**
 * Each root kind of {@link ownRoots} as the root of the one document of a resource of each type of
 * {@link documentTypes}.
 */
const pairCases: Gen<RootCase> = (source) => ({
  root: source.draw(
    element(
      Arr.isReadonlyArrayNonEmpty(ownRoots) ? ownRoots : assert.fail("no type lists a document"),
    ),
  ),
  type: source.draw(
    element(
      Arr.isReadonlyArrayNonEmpty(documentTypes)
        ? documentTypes
        : assert.fail("no type lists a document"),
    ),
  ),
});

/**
 * A situation the pair box must reach: a pair `RootOfType` holds, one it does not, and the
 * database case's item listed as a stimulus (`import/program.db.test.ts`, root-type-reverse).
 */
type PairSituation =
  | "a pair RootOfType holds"
  | "a pair RootOfType does not hold"
  | "an item listed as a stimulus";

describe("model/shred.ts and test/oracle.ts, a document's root", () => {
  it.effect(
    "refuses a document whose root is no RootOfType root before any row, the import and the oracle alike, and reads every other",
    (ctx) =>
      // Oracle: `RootOfType`'s rows and the manifest's root, the root kinds a document may have.
      // Bound: every global element kind of every schema, 317, as the root of an item's document.
      searched(
        ctx,
        exhaust(
          {
            box: "every globally declared element kind as the root of the one document of an item resource",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<RootSituation>([
              "a root no resource type lists, refused before any row",
              "a root some resource type lists, read",
              "p29's qti-outcome-processing",
            ]),
            generator: rootCases,
            limit: 400,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "RootOfType's (type, root) rows and the manifest's root (spec readings 93 and 114)",
            },
            suite: "model/document-roots",
          },
          (drawn: RootCase, c) =>
            Effect.gen(function* rootCase() {
              const admitted = documentRootKinds.has(drawn.root);
              const judgment = yield* judge(packageOf(drawn), grammar, laws);
              const read = yield* readerVerdict(drawn);

              c.note(
                admitted
                  ? "a root some resource type lists, read"
                  : "a root no resource type lists, refused before any row",
              );
              if (drawn.root === "qti-outcome-processing") {
                c.note("p29's qti-outcome-processing");
              }

              assert.deepStrictEqual(
                {
                  oracle: judgment._tag === "CodecRefusal" ? judgment.rule : "judged",
                  reader: read,
                },
                admitted
                  ? { oracle: "judged", reader: "read" }
                  : { oracle: "unmodeled-vocabulary", reader: "unmodeled-vocabulary" },
                JSON.stringify(drawn),
              );
            }).pipe(Effect.provide(NodeServices.layer)),
        ),
      ),
    240_000,
  );

  it.effect(
    "breaks RootOfType exactly where a document's (resource type, root kind) is no pair of it, the cell the import writes",
    (ctx) =>
      // Oracle: `RootOfType`'s rows. Bound: every type that lists documents, 10, by every root kind
      // of a type but the fragment's and the manifest's, 9: 90 packages.
      searched(
        ctx,
        exhaust(
          {
            box: "every resource type that lists documents, by every root kind a type other than the fragment's lists and the manifest's, as its one document's root",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<PairSituation>([
              "a pair RootOfType holds",
              "a pair RootOfType does not hold",
              "an item listed as a stimulus",
            ]),
            generator: pairCases,
            limit: 120,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "RootOfType's (type, root) rows (spec readings 93 and 114, P2 root-type-reverse)",
            },
            suite: "model/document-root-types",
          },
          (drawn: RootCase, c) =>
            Effect.gen(function* pairCase() {
              const paired = rootsOfType.some(
                ({ root, type }) => type === drawn.type && root === drawn.root,
              );
              const judgment = yield* judge(packageOf(drawn), grammar, laws);
              const read = yield* programOf(drawn);

              c.note(paired ? "a pair RootOfType holds" : "a pair RootOfType does not hold");
              if (
                drawn.type === "imsqti_stimulus_xmlv3p0" &&
                drawn.root === "qti-assessment-item"
              ) {
                c.note("an item listed as a stimulus");
              }

              assert.isTrue(judgment._tag === "Judged", JSON.stringify(drawn));
              assert.strictEqual(
                judgment._tag === "Judged" &&
                  judgment.breaches.some(({ law }) => law === "RootOfType"),
                !paired,
                `${JSON.stringify(drawn)}: the oracle breaks RootOfType`,
              );
              assert.deepStrictEqual(
                Result.isSuccess(read)
                  ? [...read.success.inputs.Document.values()]
                      .filter(({ path }) => path === "doc.xml")
                      .map(({ resourceType, rootKind }) => `${resourceType} ${rootKind}`)
                  : read.failure._tag,
                [`${drawn.type} ${drawn.root}`],
                `${JSON.stringify(drawn)}: the import's Document cell`,
              );
            }).pipe(Effect.provide(NodeServices.layer)),
        ),
      ),
    240_000,
  );
});
