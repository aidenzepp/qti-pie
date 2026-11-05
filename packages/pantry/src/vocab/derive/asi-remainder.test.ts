import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer, Option, Result, Stream } from "effect";
import { Digest } from "effect/crypto";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import type { Element } from "@qti-pie/crust/tree.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as cp from "#pantry/schema/kinds/cp.ts";
import * as cpx from "#pantry/schema/kinds/cpx.ts";
import * as csmd from "#pantry/schema/kinds/csmd.ts";
import * as drd from "#pantry/schema/kinds/drd.ts";
import * as generic from "#pantry/schema/kinds/generic.ts";
import type { AdmissionRow, RegistryRow } from "#pantry/schema/kinds/generic.ts";
import * as html from "#pantry/schema/kinds/html.ts";
import * as lom from "#pantry/schema/kinds/lom.ts";
import * as qmd from "#pantry/schema/kinds/qmd.ts";
import * as ud from "#pantry/schema/kinds/ud.ts";
import * as xi from "#pantry/schema/kinds/xi.ts";
import {
  added301,
  admission,
  attributeAdmission,
  attributeless300,
  attributeTypes300,
  childHandleOf,
  contentOf as stateContentOf,
  hosts,
  kinds,
  registry,
} from "#pantry/vocab/asi-remainder.ts";
import {
  contentOf,
  differenceOf,
  readingOf,
  remainder,
  remainderEntriesOf,
  remainderLeafSpec,
  typedChildrenOf,
} from "#pantry/vocab/derive/asi-remainder.ts";
import type { Reading } from "#pantry/vocab/derive/asi-remainder.ts";
import {
  attributeOf,
  elementsOf,
  indexSchema,
  isXs,
  renderLeaf,
} from "#pantry/vocab/derive/derive.ts";
import type { Entry, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import { checkCache, readSource } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import { asiRemainderInventory } from "#pantry/vocab/inventory/asi-remainder.ts";

/**
 * The package folder, `packages/pantry`, which the committed leaf and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * The committed leaf, relative to {@link packageRoot}.
 */
const leafPath = "src/vocab/inventory/asi-remainder.ts";

/**
 * Why the suite cannot run here: the cache's missing files, or `None` when all 14 pinned XSDs are
 * present. Any other failure of the check fails the file's load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the hook that reads the two ASI XSDs and derives both
 * versions' readings.
 *
 * Measured on 2026-11-05 on a 10-CPU M2 Max at load averages of 13 to 14, with other suites
 * running: in three runs the file's test time, which this hook dominates, was 3.9 to 4.9 s. The
 * budget is the larger of twice that maximum (9.8 s) and 20 s, the floor being twice vitest's
 * default hook timeout. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const schemasHookTimeoutMs = 20_000;

/**
 * The timeout, in milliseconds, for the test that renders the leaf and formats it with `vp fmt`.
 *
 * Measured on 2026-11-05 under the same load: three runs took 0.43 to 0.48 s. The budget is the
 * larger of twice that maximum (0.96 s) and 10 s, the floor being twice vitest's default test
 * timeout. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const formatTestTimeoutMs = 10_000;

/**
 * One ASI XSD as the suite reads it: its root, its index, its remainder entries and its reading.
 */
interface Version {
  readonly entries: readonly Entry[];
  readonly reading: Reading;
  readonly root: Element;
  readonly schema: XsdSchema;
}

/**
 * The two ASI XSDs, read once for the suite.
 */
class Versions extends Context.Service<
  Versions,
  { readonly "3.0.0": Version; readonly "3.0.1": Version }
>()("vocab/derive/asi-remainder.test/Versions") {}

/**
 * Read one ASI XSD and derive what the suite compares from it.
 *
 * @param source - The pinned XSD.
 * @returns The version's reading.
 */
const versionOf = Effect.fn("test.versionOf")(function* versionOf(
  source: "imsqti_asiv3p0_v1p0.xsd" | "imsqti_asiv3p0p1_v1p0.xsd",
) {
  const document = yield* readSource(source);
  const schema = yield* Effect.fromResult(indexSchema(document));

  return {
    entries: yield* Effect.fromResult(remainderEntriesOf(schema)),
    reading: yield* Effect.fromResult(readingOf(schema)),
    root: document.root,
    schema,
  };
});

/**
 * Read both ASI XSDs through their digest checks.
 */
const VersionsLayer = Layer.effect(
  Versions,
  Effect.all(
    {
      "3.0.0": versionOf("imsqti_asiv3p0_v1p0.xsd"),
      "3.0.1": versionOf("imsqti_asiv3p0p1_v1p0.xsd"),
    },
    { concurrency: "unbounded" },
  ).pipe(Effect.map((versions) => Versions.of(versions))),
);

/**
 * Format TypeScript text with `vp fmt`, as the committed leaf is formatted.
 *
 * `vp` is on `PATH` whenever the suite runs through pnpm. The text is read from standard input,
 * and `filepath` only chooses the parser and the configuration, so nothing is written.
 *
 * @param text - The unformatted module.
 * @param filepath - The path, relative to `packages/pantry`, the text stands for.
 * @returns What `vp fmt` printed.
 */
const vpFmt = Effect.fn("test.vpFmt")(function* vpFmt(text: string, filepath: string) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collectFormatted() {
      const handle = yield* spawner.spawn(
        ChildProcess.make("vp", ["fmt", `--stdin-filepath=${filepath}`], {
          cwd: packageRoot,
          stdin: Stream.make(new TextEncoder().encode(text)),
        }),
      );
      const { code, stderr, stdout } = yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
        },
        { concurrency: "unbounded" },
      );

      assert.strictEqual(code, ChildProcessSpawner.ExitCode(0), `vp fmt failed: ${stderr}`);

      return stdout;
    }),
  );
});

/**
 * Unwrap a derivation's result, failing the test with the reading error.
 *
 * @param result - The derivation's result.
 * @returns Its value.
 */
const valueOf = <A, E>(result: Result.Result<A, E>): A =>
  Result.getOrElse(result, (failure) => assert.fail(String(failure)));

/**
 * Every `xs:element` declaration under a schema element, at any depth.
 *
 * @param node - The element to search.
 * @returns The declarations, in document order.
 */
const declarationsUnder = (node: Element): readonly Element[] =>
  elementsOf(node).flatMap((child) => [
    ...(isXs(child, "element") ? [child] : []),
    ...declarationsUnder(child),
  ]);

/**
 * The ASI-namespace elements the eleven composed vocabularies hold a kind for.
 */
const elevenElements: ReadonlySet<string> = new Set(
  [generic, asi, html, cp, lom, qmd, cpx, drd, csmd, ud, xi]
    .flatMap((vocabulary) => Object.values<RegistryRow>(vocabulary.registry))
    .filter(
      (row) => row.namespace === "http://www.imsglobal.org/xsd/imsqtiasi_v3p0" && row.local !== "",
    )
    .map((row) => row.local),
);

/**
 * The generic kinds: character data, comments and instructions.
 */
const genericKinds: ReadonlySet<string> = new Set(generic.kinds);

/**
 * Write host-to-children pairs in one order: hosts sorted, each host's children sorted.
 *
 * @param pairs - Each host with its children.
 * @returns The pairs, sorted.
 */
const sorted = (
  pairs: Iterable<readonly [string, readonly string[]]>,
): readonly (readonly [string, readonly string[]])[] =>
  [...pairs]
    .map(([host, children]) => [host, children.toSorted()] as const)
    .toSorted(([left], [right]) => (left < right ? -1 : 1));

/**
 * The element rows of the remainder's admission under one version, as host to children.
 *
 * @param version - The version.
 * @returns Each host with its admitted element children.
 */
const stated = (
  version: AdmissionRow["version"],
): readonly (readonly [string, readonly string[]])[] =>
  sorted(
    [
      ...Map.groupBy(
        admission.filter((row) => row.version === version && !genericKinds.has(row.child)),
        (row) => row.parent,
      ),
    ].map(([parent, rows]) => [parent, rows.map((row) => row.child)] as const),
  );

if (Option.isSome(absence)) {
  it("derives the ASI remainder from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))(
  "vocab/derive/asi-remainder.ts over the pinned XSDs",
  () => {
    layer(
      Layer.mergeAll(
        VersionsLayer.pipe(
          Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto)),
        ),
        NodeServices.layer,
      ),
      { timeout: schemasHookTimeoutMs },
    )("from the cache", (cached) => {
      cached.effect(
        `regenerates ${leafPath} byte for byte after vp fmt`,
        () =>
          Effect.gen(function* regenerate() {
            const fs = yield* FileSystem.FileSystem;
            const { entries } = (yield* Versions)["3.0.1"];
            const derived = yield* vpFmt(renderLeaf(remainderLeafSpec, entries), leafPath);

            assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${leafPath}`));
          }),
        formatTestTimeoutMs,
      );

      cached.effect(
        "finds the 51 ASI elements the eleven lack in both XSDs, and 61 kinds of them",
        () =>
          Effect.gen(function* fiftyOne() {
            const versions = yield* Versions;
            const remainderElements = new Set(
              kinds
                .map((handle) => registry[handle]?.local ?? handle)
                .filter((local) => !elevenElements.has(local)),
            );

            for (const { entries, root } of [versions["3.0.0"], versions["3.0.1"]]) {
              const named = new Set(
                declarationsUnder(root).flatMap((declaration) =>
                  Option.toArray(attributeOf(declaration, "name")),
                ),
              );

              assert.strictEqual(named.size, 278);
              assert.deepStrictEqual(
                [...named].filter((name) => !elevenElements.has(name)).toSorted(),
                [...remainderElements].toSorted(),
              );
              assert.strictEqual(remainderElements.size, 51);
              assert.deepStrictEqual(
                entries.map((entry) => entry.handle),
                [...kinds].toSorted(),
              );
            }
          }),
      );

      cached.effect("names each typed kind's type as the XSD declares its element", () =>
        Effect.gen(function* typedKinds() {
          const { root, schema } = (yield* Versions)["3.0.1"];

          for (const [handle, { element, type }] of Object.entries(remainder.typed)) {
            if (handle === "qti-calculator-type") {
              const declared = declarationsUnder(root).filter((candidate) =>
                Option.contains(attributeOf(candidate, "name"), element),
              );

              assert.lengthOf(declared, 1);
              assert.deepStrictEqual(
                declared.map((declaration) => Option.getOrNull(attributeOf(declaration, "type"))),
                [null],
              );
              assert.deepStrictEqual(
                declared
                  .flatMap((declaration) =>
                    elementsOf(declaration).filter((child) => isXs(child, "simpleType")),
                  )
                  .flatMap((simple) =>
                    elementsOf(simple).filter((child) => isXs(child, "restriction")),
                  )
                  .map((step) => Option.getOrNull(attributeOf(step, "base"))),
                [type],
              );
            } else {
              assert.include(schema.declarations.get(element) ?? [], type, handle);
            }
          }
        }),
      );

      cached.effect("reads the 74 element names qti-interaction-markup's content lists", () =>
        Effect.gen(function* markup() {
          const { entries } = (yield* Versions)["3.0.1"];
          const entry = entries.find((candidate) => candidate.handle === "qti-interaction-markup");
          const names = new Set((entry?.references ?? []).map((reference) => reference.name));

          assert.strictEqual(names.size, 74);
          assert.isTrue(names.has("m3:math") && names.has("ssml11:speak") && names.has("template"));
        }),
      );

      cached.effect("states each kind's content class as both XSDs read it", () =>
        Effect.gen(function* contentClasses() {
          const versions = yield* Versions;

          for (const { entries, schema } of [versions["3.0.0"], versions["3.0.1"]]) {
            for (const entry of entries) {
              assert.deepStrictEqual(
                Option.map(
                  Option.fromNullishOr(asiRemainderInventory[entry.handle]),
                  stateContentOf,
                ),
                Option.some(valueOf(contentOf(schema, entry))),
                entry.handle,
              );
            }
          }
        }),
      );

      cached.effect("states the hosts of each dotted kind as both XSDs declare them", () =>
        Effect.gen(function* typedHosts() {
          const versions = yield* Versions;

          for (const { entries, schema } of [versions["3.0.0"], versions["3.0.1"]]) {
            const resolved = valueOf(typedChildrenOf(schema, entries));

            assert.deepStrictEqual(
              sorted(
                [...Map.groupBy(resolved, (child) => child.handle)].map(
                  ([handle, children]) => [handle, children.map((child) => child.host)] as const,
                ),
              ),
              sorted(Object.entries(hosts)),
            );
          }
        }),
      );

      cached.effect("admits, under each version, exactly the element children its XSD lists", () =>
        Effect.gen(function* rows() {
          const versions = yield* Versions;

          for (const version of ["3.0.0", "3.0.1"] as const) {
            const { reading } = versions[version];
            const derived = sorted(
              [...reading.children].flatMap(([host, names]) =>
                names.length === 0
                  ? []
                  : [
                      [
                        host,
                        names.map((name) =>
                          Option.getOrElse(childHandleOf(host, name), () =>
                            assert.fail(`${name} under ${host} has no handle prefix`),
                          ),
                        ),
                      ] as const,
                    ],
              ),
            );

            assert.deepStrictEqual(stated(version), derived, version);
          }
        }),
      );

      cached.effect("states each kind's attributes and their types as each XSD declares them", () =>
        Effect.gen(function* attributeRows() {
          const versions = yield* Versions;

          for (const version of ["3.0.0", "3.0.1"] as const) {
            const derived = [...versions[version].reading.attributes].flatMap(([kind, rows]) =>
              rows.map((row) => `${kind}|${row.name}|${row.type}`),
            );

            assert.deepStrictEqual(
              attributeAdmission
                .filter((row) => row.version === version)
                .map((row) => `${row.kind}|${row.attribute}|${row.type}`)
                .toSorted(),
              derived.toSorted(),
              version,
            );
          }
        }),
      );

      cached.effect(
        "finds 3.0.1 adding only the stated rows and changing only the stated type",
        () =>
          Effect.gen(function* difference() {
            const versions = yield* Versions;
            const { added, changed, dropped } = differenceOf(
              versions["3.0.0"].reading,
              versions["3.0.1"].reading,
            );

            assert.strictEqual(dropped.attributes.size + dropped.children.size, 0);
            assert.deepStrictEqual(
              Object.fromEntries(
                [...added.children].map(([host, names]) => [
                  host,
                  names.flatMap((name) => Option.toArray(childHandleOf(host, name))),
                ]),
              ),
              Object.fromEntries(
                Object.entries(added301).map(([host, names]) => [host, [...names]]),
              ),
            );
            assert.deepStrictEqual(
              [...added.attributes],
              attributeless300.map((kind) => [kind, registry[kind]?.attributes ?? []]),
            );
            assert.deepStrictEqual(
              Object.fromEntries(
                [...changed].map(([kind, rows]) => [
                  kind,
                  Object.fromEntries(rows.map((row) => [row.name, row.type])),
                ]),
              ),
              attributeTypes300,
            );

            for (const [kind, rows] of changed) {
              for (const row of rows) {
                const later = versions["3.0.1"].reading.attributes
                  .get(kind)
                  ?.find((candidate) => candidate.name === row.name);

                assert.deepStrictEqual({ ...row, type: later?.type }, later, `${kind} ${row.name}`);
              }
            }
          }),
      );
    });
  },
);
