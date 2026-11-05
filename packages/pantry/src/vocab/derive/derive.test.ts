import { createHash } from "node:crypto";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { ConfigProvider, Context, Effect, FileSystem, Layer, Option, Result, Stream } from "effect";
import { Digest } from "effect/crypto";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { HBLOCK, HFLOW, HINL, PHR } from "#pantry/schema/content/sets.ts";
import {
  operatorArity,
  operatorArityMax,
  operatorArityUnbounded,
} from "#pantry/schema/seed/operator-arity.ts";
import {
  arityOf,
  contentOf,
  contentSetsOf,
  entriesOf,
  hostsOf,
  htmlNamesOf,
  includesOf,
  indexSchema,
  indexSchemas,
  leafSpecOf,
  leaves,
  loadSchemaSet,
  mathmlEntriesOf,
  mathmlKindsOf,
  mathmlLeaf,
  mathmlReadingsOf,
  mathmlSource,
  printArity,
  renderLeaf,
} from "#pantry/vocab/derive/derive.ts";
import type { Entry, SchemaSet, XsdSchema } from "#pantry/vocab/derive/derive.ts";
import {
  checkCache,
  readSource,
  sourcePaths,
  sources,
  verifySource,
  XsdSourceMismatch,
  XsdSourceMissing,
} from "#pantry/vocab/derive/sources.ts";
import type { SourcePath } from "#pantry/vocab/derive/sources.ts";

/**
 * The package folder, `packages/pantry`, which the committed files and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * A `HOME` under the package's ignored `work/` that nothing creates, so its XSD cache is absent.
 */
const absentHome = `${packageRoot}/work/vocab-derive-test-no-home`;

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when all 14
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
 * The timeout, in milliseconds, for the hook that reads and indexes the 14 pinned XSDs.
 *
 * The two ASI XSDs are 18 MB each and take most of it. Measured on 2026-11-05 on a 10-CPU M2 Max
 * at load averages of 10 to 12, with other suites running: five builds took 2.7 to 3.0 s. The
 * budget is the larger of twice that maximum (6 s) and 20 s, the floor being twice vitest's default
 * hook timeout. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const schemasHookTimeoutMs = 20_000;

/**
 * The timeout, in milliseconds, for one test that renders a leaf and formats it with `vp fmt`.
 *
 * Measured on 2026-11-05 under the same load: nine such tests took 0.41 to 0.81 s. The budget is
 * the larger of twice that maximum (1.6 s) and 10 s, the floor being twice vitest's default test
 * timeout. Raise it only on a new measurement recorded here, never to make a run pass.
 */
const formatTestTimeoutMs = 10_000;

/**
 * The pinned XSDs as read once for the suite: every document, the two ASI schemas indexed, and the
 * MathML schema read through its includes.
 */
class Schemas extends Context.Service<
  Schemas,
  {
    readonly asi300: XsdSchema;
    readonly asi301: XsdSchema;
    readonly documents: ReadonlyMap<SourcePath, XmlDocument>;
    readonly mathml: SchemaSet;
  }
>()("vocab/derive.test/Schemas") {}

/**
 * Read every pinned XSD through its digest check, index the two ASI schemas, and read the MathML
 * schema from its entry document.
 */
const SchemasLayer = Layer.effect(
  Schemas,
  Effect.gen(function* readSchemas() {
    const read = yield* Effect.forEach(
      sourcePaths,
      (name) => readSource(name).pipe(Effect.map((document) => [name, document] as const)),
      { concurrency: "unbounded" },
    );
    const documents = new Map(read);
    const indexed = (name: SourcePath) =>
      Effect.fromOption(Option.fromNullishOr(documents.get(name))).pipe(
        Effect.flatMap((document) => Effect.fromResult(indexSchema(document))),
      );

    return Schemas.of({
      asi300: yield* indexed("imsqti_asiv3p0_v1p0.xsd"),
      asi301: yield* indexed("imsqti_asiv3p0p1_v1p0.xsd"),
      documents,
      mathml: yield* loadSchemaSet(mathmlSource),
    });
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

/**
 * The lines of the fenced `text` block in a module comment, without their ` * ` prefix.
 *
 * @param source - The module's text.
 * @returns The block's lines joined by line breaks.
 */
const textBlockOf = (source: string): string => {
  const lines = source.split("\n");
  const start = lines.indexOf(" * ```text");
  const end = lines.indexOf(" * ```", start + 1);

  assert.isAbove(start, -1, "the module comment has a ```text block");

  return lines
    .slice(start + 1, end)
    .map((line) => line.replace(/^ \* /u, ""))
    .join("\n");
};

/**
 * Unwrap a derivation's result, failing the test with the reading error.
 *
 * @param result - The derivation's result.
 * @returns Its value.
 */
const valueOf = <A, E>(result: Result.Result<A, E>): A =>
  Result.getOrElse(result, (failure) => assert.fail(String(failure)));

/**
 * Read an inline XML document, as crust reads a pinned XSD.
 *
 * @param text - The document's text.
 * @returns Its tree.
 */
const parse = (text: string) => readXml(new TextEncoder().encode(text));

/**
 * The `xs:schema` start tag of an inline schema in the namespace `urn:t`, bound to `t`.
 *
 * @param target - The target namespace, `urn:t` unless a test needs another.
 * @returns The start tag, with `elementFormDefault="qualified"`.
 */
const schemaTag = (target = "urn:t"): string =>
  `<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:t="${target}" targetNamespace="${target}" elementFormDefault="qualified">`;

/**
 * The failure detail of a derivation that must fail.
 *
 * @param result - The derivation's result.
 * @returns The reading error's message.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): string =>
  Result.match(result, {
    onFailure: String,
    onSuccess: () => assert.fail("the derivation succeeded"),
  });

/**
 * Read the content of one named complex type of an inline schema.
 *
 * @param schema - The schema.
 * @param type - The type's name.
 * @returns The reading.
 */
const contentOfType = (schema: XsdSchema, type: string) =>
  Option.match(Option.fromNullishOr(schema.complexTypes.get(type)), {
    onNone: () => assert.fail(`no complex type ${type}`),
    onSome: (complexType) => valueOf(contentOf(schema, complexType)),
  });

/**
 * The MathML entry of a kind, failing the test when the MathML reading has none.
 *
 * @param entries - The MathML entries.
 * @param handle - The kind.
 * @returns Its entry.
 */
const mathmlEntry = (entries: readonly Entry[], handle: string): Entry =>
  Option.getOrElse(Option.fromNullishOr(entries.find((entry) => entry.handle === handle)), () =>
    assert.fail(`no MathML entry ${handle}`),
  );

/**
 * Read an inline schema that includes one location, as `mathml/mathml3.xsd` would.
 *
 * @param location - The `schemaLocation` of its one `xs:include`.
 * @returns Its tree.
 */
const including = (location: string) =>
  parse(`${schemaTag()}<xs:include schemaLocation="${location}"/></xs:schema>`);

describe("vocab/derive/sources.ts", () => {
  it.effect("refuses bytes that do not hash to the pin, naming both digests and the URL", () =>
    Effect.gen(function* mismatch() {
      const bytes = new TextEncoder().encode(
        '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>',
      );
      const failure = yield* Effect.flip(verifySource("w3/xml.xsd", bytes));

      assert.instanceOf(failure, XsdSourceMismatch);
      assert.strictEqual(failure.expected, sources["w3/xml.xsd"].sha256);
      assert.strictEqual(failure.actual, createHash("sha256").update(bytes).digest("hex"));
      assert.include(failure.message, sources["w3/xml.xsd"].url);
    }).pipe(Effect.provide(Digest.layerWebCrypto)),
  );

  it.effect("names every pinned file and its URL when the cache directory is absent", () =>
    Effect.gen(function* absent() {
      const fs = yield* FileSystem.FileSystem;

      assert.isFalse(yield* fs.exists(absentHome));

      const failure = yield* Effect.flip(checkCache());

      assert.instanceOf(failure, XsdSourceMissing);
      assert.deepStrictEqual(
        failure instanceof XsdSourceMissing ? failure.missing : [],
        sourcePaths.map((name) => ({ path: name, url: sources[name].url })),
      );
      assert.include(failure.message, `14 of the 14 pinned XSDs are not in ${absentHome}/.cache`);
    }).pipe(
      Effect.provide(
        Layer.mergeAll(
          NodeServices.layer,
          ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: absentHome })),
        ),
      ),
    ),
  );
});

describe("vocab/derive/derive.ts over inline schemas", () => {
  it.effect(
    "resolves an xs:include against the including pin's URL, and refuses one no pin is",
    () =>
      Effect.gen(function* includes() {
        assert.deepStrictEqual(
          valueOf(includesOf(mathmlSource, yield* including("mathml3-common.xsd"))),
          ["mathml/mathml3-common.xsd"],
        );
        assert.deepStrictEqual(
          valueOf(
            includesOf(
              mathmlSource,
              yield* including("../../../../ssml/v1p1/schema/xsd/ssmlv1p1-core.xsd"),
            ),
          ),
          ["ssml/ssmlv1p1-core.xsd"],
        );
        assert.include(
          failureOf(includesOf(mathmlSource, yield* including("mathml3-extra.xsd"))),
          "https://purl.imsglobal.org/spec/mathml/v3p0/schema/xsd/mathml3-extra.xsd, a file no pin",
        );
      }),
  );

  it.effect("refuses an xs:redefine rather than read the schema without it", () =>
    Effect.gen(function* redefine() {
      const document = yield* parse(
        `${schemaTag()}<xs:redefine schemaLocation="mathml3-common.xsd"/></xs:schema>`,
      );

      assert.include(failureOf(includesOf(mathmlSource, document)), "has an xs:redefine");
    }),
  );

  it.effect("indexes included documents as one schema, refusing a second target or name", () =>
    Effect.gen(function* merge() {
      const holder = yield* parse(
        `${schemaTag()}<xs:complexType name="Holder"><xs:sequence><xs:element ref="t:item"/></xs:sequence></xs:complexType></xs:schema>`,
      );
      const declarer = yield* parse(
        `${schemaTag()}<xs:element name="item"/><xs:complexType name="Other"/></xs:schema>`,
      );
      const schema = valueOf(indexSchemas([holder, declarer]));

      assert.deepStrictEqual([...schema.complexTypes.keys()], ["Holder", "Other"]);
      assert.deepStrictEqual([...schema.elements.keys()], ["item"]);
      assert.strictEqual(schema.targetPrefix, "t");
      assert.include(
        failureOf(indexSchemas([holder, yield* parse(`${schemaTag("urn:u")}</xs:schema>`)])),
        'the target namespace "urn:u"',
      );
      assert.include(
        failureOf(indexSchemas([holder, holder])),
        "both declare a top-level xs:complexType Holder",
      );
    }),
  );

  it.effect(
    "reads a substitution group head as its members, as one choice unless a choice holds it",
    () =>
      Effect.gen(function* substitution() {
        const schema = valueOf(
          indexSchema(
            yield* parse(
              `${schemaTag()}<xs:element name="head" abstract="true"/><xs:element name="a" substitutionGroup="t:head"/><xs:element name="b" substitutionGroup="t:head"/><xs:element name="c"/>` +
                `<xs:complexType name="Run"><xs:sequence><xs:element ref="t:head" maxOccurs="unbounded"/></xs:sequence></xs:complexType>` +
                `<xs:complexType name="Pick"><xs:choice><xs:element ref="t:head"/><xs:element ref="t:c"/></xs:choice></xs:complexType>` +
                `<xs:complexType name="Local"><xs:sequence><xs:element name="d"/></xs:sequence></xs:complexType></xs:schema>`,
            ),
          ),
        );
        const many = { max: Option.none(), min: 1 };
        const one = { max: Option.some(1), min: 1 };

        assert.deepStrictEqual(contentOfType(schema, "Run"), {
          choices: [{ names: ["t:a", "t:b"], occurs: many }],
          references: [
            { name: "t:a", occurs: many },
            { name: "t:b", occurs: many },
          ],
          wildcard: false,
        });
        assert.deepStrictEqual(contentOfType(schema, "Pick").choices, [
          { names: ["t:a", "t:b", "t:c"], occurs: one },
        ]);
        assert.deepStrictEqual(contentOfType(schema, "Local").references, [
          { name: "t:d", occurs: one },
        ]);
      }),
  );
});

if (Option.isSome(absence)) {
  it("derives the vocabulary data from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("vocab/derive/derive.ts over the pinned XSDs", () => {
  layer(
    Layer.mergeAll(
      SchemasLayer.pipe(Layer.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
      NodeServices.layer,
    ),
    { timeout: schemasHookTimeoutMs },
  )("from the cache", (cached) => {
    cached.effect("reads every pinned XSD through its pin, XInclude's UTF-16 included", () =>
      Effect.gen(function* everySource() {
        const { documents } = yield* Schemas;

        assert.deepStrictEqual([...documents.keys()], sourcePaths);
        for (const document of documents.values()) {
          assert.strictEqual(document.root.local, "schema");
          assert.strictEqual(document.root.namespace, "http://www.w3.org/2001/XMLSchema");
        }

        assert.strictEqual(documents.get("w3/XInclude.xsd")?.charset, "UTF-16");
      }),
    );

    for (const leaf of leaves) {
      cached.effect(
        `regenerates inventory/${leaf}.ts byte for byte after vp fmt`,
        () =>
          Effect.gen(function* regenerate() {
            const fs = yield* FileSystem.FileSystem;
            const { asi301 } = yield* Schemas;
            const file = `src/schema/content/inventory/${leaf}.ts`;
            const derived = yield* vpFmt(
              renderLeaf(leafSpecOf(leaf), valueOf(entriesOf(asi301, leaf))),
              file,
            );

            assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${file}`));
          }),
        formatTestTimeoutMs,
      );
    }

    cached.effect("derives the four HTML content sets of content/sets.ts", () =>
      Effect.gen(function* contentSets() {
        const { asi301 } = yield* Schemas;

        assert.deepStrictEqual(valueOf(contentSetsOf(asi301)), { HBLOCK, HFLOW, HINL, PHR });
      }),
    );

    cached.effect("finds the block hosts' 25 HTML names to be HBLOCK without details", () =>
      Effect.gen(function* blockHosts() {
        const { asi301 } = yield* Schemas;

        for (const type of ["ItemBodyDType", "StimulusBodyDType", "HotTextInteractionDType"]) {
          assert.deepStrictEqual(
            valueOf(htmlNamesOf(asi301, type)).toSorted(),
            HBLOCK.filter((name) => name !== "details"),
            type,
          );
        }
      }),
    );

    cached.effect("derives the 64, 50 and 14 rows of seed/operator-arity.ts", () =>
      Effect.gen(function* arity() {
        const { asi300 } = yield* Schemas;
        const rows = valueOf(arityOf(asi300));
        const bounded = rows.flatMap((row) =>
          Option.match(row.max, {
            onNone: () => [],
            onSome: (max) => [{ kind: row.kind, max: BigInt(max) }],
          }),
        );
        const unbounded = rows.flatMap((row) =>
          Option.isNone(row.max) ? [{ kind: row.kind }] : [],
        );

        assert.deepStrictEqual([rows.length, bounded.length, unbounded.length], [64, 50, 14]);
        assert.deepStrictEqual(
          rows.map((row) => ({ kind: row.kind, min: BigInt(row.min) })),
          operatorArity,
        );
        assert.deepStrictEqual(bounded, operatorArityMax);
        assert.deepStrictEqual(unbounded, operatorArityUnbounded);
      }),
    );

    cached.effect(
      "reads mathml3.xsd and the four documents it includes, each once, depth first",
      () =>
        Effect.gen(function* mathmlDocuments() {
          const { mathml } = yield* Schemas;

          assert.deepStrictEqual([...mathml.documents.keys()], mathmlLeaf.sources);
          assert.strictEqual(mathml.schema.targetPrefix, "m");
        }),
    );

    cached.effect(
      "regenerates src/vocab/inventory/mathml.ts byte for byte after vp fmt",
      () =>
        Effect.gen(function* regenerateMathml() {
          const fs = yield* FileSystem.FileSystem;
          const { mathml } = yield* Schemas;
          const file = "src/vocab/inventory/mathml.ts";
          const entries = valueOf(mathmlEntriesOf(mathml)).toSorted((left, right) =>
            left.handle < right.handle ? -1 : 1,
          );
          const derived = yield* vpFmt(renderLeaf(mathmlLeaf, entries), file);

          assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${file}`));
        }),
      formatTestTimeoutMs,
    );

    cached.effect("reads 193 MathML kinds: common 4, presentation 40, content 140, strict 9", () =>
      Effect.gen(function* mathmlKinds() {
        const { mathml } = yield* Schemas;
        const parts = valueOf(mathmlKindsOf(mathml));

        assert.deepStrictEqual(
          parts.map(({ names, path: part }) => [part, names.length]),
          [
            ["mathml/mathml3-common.xsd", 4],
            ["mathml/mathml3-presentation.xsd", 40],
            ["mathml/mathml3-content.xsd", 140],
            ["mathml/mathml3-strict-content.xsd", 9],
          ],
        );
        assert.strictEqual(new Set(parts.flatMap(({ names }) => names)).size, 193);
      }),
    );

    cached.effect("reads m:semantics from the widest of its three declarations", () =>
      Effect.gen(function* semantics() {
        const { mathml } = yield* Schemas;
        const entry = mathmlEntry(valueOf(mathmlEntriesOf(mathml)), "m:semantics");
        const children = new Set(entry.references.map((reference) => reference.name));

        assert.strictEqual(entry.type, "anonymous, in m:semantics in group m:semantics");
        for (const child of ["m:ci", "m:semantics", "m:apply", "m:mi", "m:annotation-xml"]) {
          assert.isTrue(children.has(child), child);
        }
      }),
    );

    cached.effect("reads substitution members, inherited types and untyped attributes", () =>
      Effect.gen(function* members() {
        const { mathml } = yield* Schemas;
        const entries = valueOf(mathmlEntriesOf(mathml));
        const mtr = mathmlEntry(entries, "m:mtr");
        const plus = mathmlEntry(entries, "m:plus");
        const alttext = mathmlEntry(entries, "m:math").attributes.find(
          (row) => row.name === "alttext",
        );

        assert.deepStrictEqual(
          mtr.references.map((reference) => reference.name),
          ["m:mtd"],
        );
        assert.strictEqual(
          mathmlEntry(entries, "m:mtd").type,
          "anonymous, in m:TableCellExpression",
        );
        assert.strictEqual(plus.type, "anonymous, in m:nary-arith.class");
        assert.deepStrictEqual(plus.references, []);
        assert.deepStrictEqual(
          [alttext?.type, alttext?.whiteSpace],
          ["xs:anySimpleType", "preserve"],
        );
        assert.isTrue(mathmlEntry(entries, "m:annotation-xml").wildcard);
        assert.strictEqual(valueOf(mathmlReadingsOf(mathml)).length, 193);
      }),
    );

    cached.effect("finds m3:math under 61 elements in 34 types, in 3.0.0 and 3.0.1 alike", () =>
      Effect.gen(function* mathHosts() {
        const { asi300, asi301 } = yield* Schemas;
        const hosts = valueOf(hostsOf(asi301, "m3:math"));

        assert.deepStrictEqual(valueOf(hostsOf(asi300, "m3:math")), hosts);
        assert.deepStrictEqual(
          [
            hosts.length,
            new Set(hosts.map((host) => host.element)).size,
            new Set(hosts.map((host) => host.type)).size,
          ],
          [68, 61, 34],
        );
      }),
    );

    cached.effect("prints the arity block seed/operator-arity.ts keeps in its comment", () =>
      Effect.gen(function* arityBlock() {
        const fs = yield* FileSystem.FileSystem;
        const { asi300 } = yield* Schemas;
        const source = yield* fs.readFileString(`${packageRoot}/src/schema/seed/operator-arity.ts`);

        assert.strictEqual(printArity(valueOf(arityOf(asi300))), textBlockOf(source));
      }),
    );
  });
});
