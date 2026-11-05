import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Context, Effect, FileSystem, Layer, Option, Result, Stream } from "effect";
import { Digest } from "effect/crypto";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { readXml } from "@qti-pie/crust/read.ts";
import { renderLeaf } from "#pantry/vocab/derive/derive.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";
import {
  handlePrefix,
  loadHosts,
  loadSsml,
  ssmlLeafSpec,
  ssmlOf,
} from "#pantry/vocab/derive/ssml.ts";
import type { asiSources, SsmlHost, SsmlVocabulary } from "#pantry/vocab/derive/ssml.ts";
import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import { asiRemainderInventory } from "#pantry/vocab/inventory/asi-remainder.ts";
import { asiPrefix, hosted, kinds, registry, wildcards } from "#pantry/vocab/ssml.ts";

/**
 * The package folder, `packages/pantry`, which the committed leaf and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when all the
 * pinned XSDs are present. Any other failure of the check fails the file's load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the hook that reads the SSML XSDs and both ASI XSDs.
 *
 * The two ASI XSDs are 18 MB each and take most of it. Measured on 2026-11-05 on a 10-CPU M2 Max
 * at a load average of 10, with other suites running: three reads took 2.0 to 2.7 s. The budget is
 * the larger of twice that maximum (5.4 s) and 20 s, the floor `derive.test.ts` uses, twice
 * vitest's default hook timeout. Raise it only on a new measurement recorded here, never to make a
 * run pass.
 */
const schemasHookTimeoutMs = 20_000;

/**
 * The timeout, in milliseconds, for the test that renders the leaf and formats it with `vp fmt`.
 *
 * Measured on 2026-11-05 under the same load: three `vp fmt` runs over this leaf, through pnpm,
 * took 0.36 to 0.42 s. The budget is the larger of twice that maximum (0.84 s) and 10 s, the
 * floor `derive.test.ts` uses, twice vitest's default test timeout. Raise it only on a new
 * measurement recorded here, never to make a run pass.
 */
const formatTestTimeoutMs = 10_000;

/**
 * Parse an XSD written out in a test, as crust reads the pinned files.
 *
 * @param text - The schema document.
 * @returns Its tree.
 */
const xsd = (text: string) => readXml(new TextEncoder().encode(text));

/**
 * A no-namespace schema like SSML's: one element `a` of type `a`, with two optional attributes and
 * a lax wildcard for attributes of other namespaces.
 */
const chameleon = `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xsd:element name="a" type="a"/>
  <xsd:complexType name="a" mixed="true">
    <xsd:attribute name="x" type="xsd:token"/>
    <xsd:attribute name="y" type="xsd:string"/>
    <xsd:anyAttribute namespace="##other" processContents="lax"/>
  </xsd:complexType>
</xsd:schema>`;

/**
 * A core profile like SSML's: it redefines {@link chameleon} into `urn:t` with the given
 * redefinition of `a`.
 *
 * @param location - The `schemaLocation` the redefine names.
 * @param redefinition - The `xsd:complexType` it holds.
 * @returns The schema document.
 */
const core = (location: string, redefinition: string): string =>
  `<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="urn:t" targetNamespace="urn:t" elementFormDefault="qualified">
  <xsd:redefine schemaLocation="${location}">${redefinition}</xsd:redefine>
</xsd:schema>`;

/**
 * A redefinition of `a` that makes `x` required and keeps the wildcard.
 */
const requiringX = `<xsd:complexType name="a" mixed="true">
  <xsd:complexContent>
    <xsd:restriction base="a">
      <xsd:attribute name="x" type="xsd:token" use="required"/>
      <xsd:anyAttribute namespace="##other" processContents="lax"/>
    </xsd:restriction>
  </xsd:complexContent>
</xsd:complexType>`;

/**
 * Read a vocabulary from two schema texts, failing the test when either is not well-formed.
 *
 * @param base - The no-namespace schema.
 * @param including - The core profile.
 * @returns The reading.
 */
const readPair = Effect.fn("test.readPair")(function* readPair(base: string, including: string) {
  return ssmlOf(yield* xsd(base), yield* xsd(including));
});

describe("vocab/derive/ssml.ts reading rules", () => {
  it.effect(
    "reads a redefinition as a restriction that replaces its base's attribute in place",
    () =>
      Effect.gen(function* redefinition() {
        const read = yield* readPair(chameleon, core("synthesis-nonamespace.xsd", requiringX));
        const vocabulary = Result.getOrElse(read, (failure) => assert.fail(failure.message));
        const [entry] = vocabulary.entries;

        assert.strictEqual(vocabulary.namespace, "urn:t");
        assert.deepStrictEqual(
          entry?.attributes.map(({ name, type, use, whiteSpace }) => [name, type, use, whiteSpace]),
          [
            ["x", "xs:token", "required", "collapse"],
            ["y", "xs:string", "optional", "preserve"],
          ],
        );
        assert.deepStrictEqual(
          [entry?.handle, entry?.type, entry?.mixed],
          [`${handlePrefix}:a`, "a", true],
        );
        assert.deepStrictEqual(
          entry?.attributeWildcard,
          Option.some({ namespaces: "other", processing: "lax" }),
        );
      }),
  );

  it.effect("refuses a core that redefines another file", () =>
    Effect.gen(function* otherFile() {
      const read = yield* readPair(chameleon, core("other.xsd", requiringX));

      assert.include(
        Result.match(read, { onFailure: (error) => error.message, onSuccess: () => "" }),
        "the core redefines other.xsd, not synthesis-nonamespace.xsd",
      );
    }),
  );

  it.effect("refuses a redefinition that is no restriction of the type it redefines", () =>
    Effect.gen(function* extension() {
      const read = yield* readPair(
        chameleon,
        core(
          "synthesis-nonamespace.xsd",
          '<xsd:complexType name="a"><xsd:complexContent><xsd:extension base="a"/></xsd:complexContent></xsd:complexType>',
        ),
      );

      assert.include(
        Result.match(read, { onFailure: (error) => error.message, onSuccess: () => "" }),
        "the redefinition of a is not a complexContent restriction of a",
      );
    }),
  );
});

/**
 * The SSML vocabulary and its hosts under each schema version, read once for the suite.
 */
class Derived extends Context.Service<
  Derived,
  {
    readonly hosts: Readonly<Record<keyof typeof asiSources, readonly SsmlHost[]>>;
    readonly vocabulary: SsmlVocabulary;
  }
>()("vocab/derive/ssml.test/Derived") {}

/**
 * Read the SSML XSDs, then both ASI XSDs' hosts, through their pins.
 */
const DerivedLayer = Layer.effect(
  Derived,
  Effect.gen(function* readDerived() {
    const vocabulary = yield* loadSsml();
    const [v300, v301] = yield* Effect.all(
      [loadHosts("3.0.0", vocabulary.namespace), loadHosts("3.0.1", vocabulary.namespace)],
      { concurrency: "unbounded" },
    );

    return Derived.of({ hosts: { "3.0.0": v300, "3.0.1": v301 }, vocabulary });
  }),
);

/**
 * Format TypeScript text with `vp fmt`, as the committed files are formatted.
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

if (Option.isSome(absence)) {
  it("derives the SSML vocabulary from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/ssml.ts over the pinned XSDs", () => {
  layer(
    Layer.mergeAll(
      DerivedLayer.pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
      NodeServices.layer,
    ),
    { timeout: schemasHookTimeoutMs },
  )("from the cache", (cached) => {
    cached.effect(
      "regenerates inventory/ssml.ts byte for byte after vp fmt",
      () =>
        Effect.gen(function* regenerate() {
          const fs = yield* FileSystem.FileSystem;
          const { vocabulary } = yield* Derived;
          const file = "src/vocab/inventory/ssml.ts";
          const derived = yield* vpFmt(renderLeaf(ssmlLeafSpec, vocabulary.entries), file);

          assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${file}`));
        }),
      formatTestTimeoutMs,
    );

    cached.effect("reads the namespace and the 20 kinds of src/vocab/ssml.ts", () =>
      Effect.gen(function* namespaceAndKinds() {
        const { vocabulary } = yield* Derived;

        assert.deepStrictEqual(
          vocabulary.entries.map((entry) => entry.handle),
          [...kinds],
        );
        for (const kind of kinds) {
          assert.strictEqual(registry[kind].namespace, vocabulary.namespace, kind);
        }
      }),
    );

    cached.effect("applies the core's redefinitions of speak and mark", () =>
      Effect.gen(function* redefinitions() {
        const { vocabulary } = yield* Derived;
        const uses = (handle: string) =>
          vocabulary.entries
            .find((entry) => entry.handle === handle)
            ?.attributes.map(({ name, use }) => `${name} ${use}`);

        assert.deepStrictEqual(uses("ssml:speak"), [
          "version required",
          "xml:lang required",
          "xml:base optional",
          "onlangfailure optional",
          "startmark optional",
          "endmark optional",
        ]);
        assert.deepStrictEqual(uses("ssml:mark"), ["name required"]);
      }),
    );

    cached.effect("finds every non-mixed SSML type element-only: it holds a particle", () =>
      Effect.gen(function* elementOnly() {
        const { vocabulary } = yield* Derived;
        const empty = vocabulary.entries.filter(
          (entry) => !entry.mixed && entry.references.length === 0 && !entry.wildcard,
        );

        assert.deepStrictEqual(
          empty.map((entry) => entry.handle),
          [],
        );
      }),
    );

    cached.effect("finds the leaves' 69 SSML hosts, of 62 elements, alike in both versions", () =>
      Effect.gen(function* hostRows() {
        const derived = yield* Derived;
        const locals = hosted.map((kind) => registry[kind].local).toSorted();
        const leaves = Object.values({ ...inventory, ...asiRemainderInventory }).filter((entry) =>
          entry.children.some(({ name }) => name.startsWith(`${asiPrefix}:`)),
        );

        for (const version of ["3.0.0", "3.0.1"] as const) {
          const read = derived.hosts[version];

          assert.deepStrictEqual(
            read.map(({ element, type }) => `${element} ${type}`).toSorted(),
            leaves.map(({ element, type }) => `${element} ${type}`).toSorted(),
            version,
          );
          assert.deepStrictEqual(
            [read.length, new Set(read.map((host) => host.element)).size],
            [69, 62],
            version,
          );
          for (const host of read) {
            assert.deepStrictEqual(host.ssml.toSorted(), locals, `${host.element} ${host.type}`);
          }
        }
      }),
    );

    cached.effect("reads the attribute wildcards src/vocab/ssml.ts states", () =>
      Effect.gen(function* attributeWildcards() {
        const { vocabulary } = yield* Derived;

        for (const entry of vocabulary.entries) {
          const statement = wildcards.find((stated) =>
            stated.elements.some((local) => local === entry.element),
          );

          assert.deepStrictEqual(
            entry.attributeWildcard,
            Option.map(Option.fromNullishOr(statement), (stated) => stated.wildcard),
            entry.handle,
          );
        }
      }),
    );
  });
});
