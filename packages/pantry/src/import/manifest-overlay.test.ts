/**
 * The manifest overlays come from the package's manifest alone (`#pantry/import/overlays/index.ts`
 * `documentRowsOf`, `#pantry/import/overlays/package.ts` `rowsOf`): the rows of `ManifestId`,
 * `Resource`, `ResourceHref`, `File`, `Dependency` and their projections describe the package's one
 * `imsmanifest.xml` (IMS Content Packaging 1.2), read from its root `cp:manifest`.
 *
 * A `cp:*` element anywhere else is content of its own document, refused by the content laws over
 * its node, the law oracle's rules: a listed document whose root is `cp:manifest` is refused under
 * `root-type-reverse` and `required-attribute`. Were its elements written as overlays too, a
 * second `ManifestId` of the package would break the key `(package)` before any SQL, which the
 * refusal map names `reachability`, a rule the oracle calls hostless: one cause, two rules. The
 * database tier found that (attribute-order.db, floor seed 0x5eef2511). A `cp:manifest` below the
 * manifest's root is a sub-manifest, which the QTI 3.0 profile prohibits, and the reader refuses it
 * under `unmodeled-vocabulary` before any row, so the manifest's own tree holds one `cp:manifest`.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Formatter } from "effect";
import { NodeKind } from "#pantry/grammar/install.ts";
import { readProgram } from "#pantry/import/program.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";

/**
 * The content packaging namespace of QTI 3.0's profile.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * A listed document of no manifest element: a QTI \`div\`, in the vocabulary the model reads.
 */
const plainDocument = new TextEncoder().encode(
  '<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>',
);

/**
 * A resource with an href, a file and a dependency: every manifest overlay's element once.
 *
 * @param identifier - The resource's identifier.
 * @param href - Its href and its file's.
 * @returns The element's text.
 */
const resourceText = (identifier: string, href: string) =>
  `<resources><resource identifier="${identifier}" type="webcontent" href="${href}"><file href="${href}"/><dependency identifierref="${identifier}"/></resource></resources>`;

/**
 * The package's manifest: one fragment resource whose document is `document.xml`, and, inside its
 * root, the given text.
 *
 * @param inside - Text at the end of the root's content.
 * @returns The manifest's bytes.
 */
const manifestOf = (inside: string) =>
  new TextEncoder().encode(
    `<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="${cpNamespace}" identifier="m"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources><resource identifier="generated" type="imsqti_fragment_xmlv3p0" href="document.xml"><file href="document.xml"/></resource></resources>${inside}</manifest>`,
  );

/**
 * The manifest overlay rows a package reads to, per relation, and whether every row that names
 * its document names the manifest's.
 *
 * @param entries - The package's entries.
 * @returns The counts, or the rule its read refused under.
 */
const overlaysOf = (entries: ReadonlyMap<string, Uint8Array>) =>
  Effect.gen(function* overlays() {
    const dir = yield* scopedPackage(entries);
    const read = yield* Effect.result(readProgram(dir));
    if (read._tag === "Failure") {
      return { refused: String(read.failure) } as const;
    }

    const { inputs } = read.success;
    const manifest = [...inputs.Document.values()].find(({ path }) => path === manifestPath)?.node;
    const named = [
      ...inputs.ManifestId.values(),
      ...inputs.Resource.values(),
      ...inputs.File.values(),
      ...inputs.Dependency.values(),
    ];

    return {
      counts: {
        Dependency: inputs.Dependency.size,
        File: inputs.File.size,
        FileHref: inputs.FileHref.size,
        ManifestId: inputs.ManifestId.size,
        Resource: inputs.Resource.size,
        ResourceFile: inputs.ResourceFile.size,
        ResourceHref: inputs.ResourceHref.size,
      },
      fromManifest: named.every(({ document }) => document === manifest),
    } as const;
  }).pipe(Effect.scoped);

/**
 * The overlay counts of the base package alone: its one manifest, resource, href and file.
 */
const baseCounts = {
  Dependency: 0,
  File: 1,
  FileHref: 1,
  ManifestId: 1,
  Resource: 1,
  ResourceFile: 1,
  ResourceHref: 1,
} as const;

describe("the manifest overlays, from the package's manifest alone", () => {
  it.effect(
    "writes no overlay row of a cp element of another document, whatever its kind, and refuses a sub-manifest before any row",
    () =>
      // Oracle: the specification as a checker, IMS Content Packaging 1.2 (the package's manifest
      // is its one imsmanifest.xml) and the QTI 3.0 profile's ManifestDType ('The "manifest"
      // element has been prohibited'): the overlay rows are the base manifest's, whatever else
      // the package holds.
      // Bound: every cp element name of the grammar as the root of the listed document, holding a resource
      // with an href, a file and a dependency, and the manifest holding a sub-manifest with the
      // same, exhausted.
      Effect.gen(function* manifestOnly() {
        const base = yield* overlaysOf(
          new Map([
            [manifestPath, manifestOf("")],
            ["document.xml", plainDocument],
          ]),
        );
        assert.deepStrictEqual(base, { counts: baseCounts, fromManifest: true }, "the base");

        // A cp kind's handle is its element's name, or that name and the context it is read in
        // (`cp:metadata.file`), so each element name is drawn once as the root.
        const locals = [
          ...new Set(
            NodeKind.handles
              .filter((kind) => kind.startsWith("cp:"))
              .map((kind) => kind.slice("cp:".length).split(".")[0] ?? ""),
          ),
        ];
        assert.include(locals, "manifest");
        for (const local of locals) {
          const read = yield* overlaysOf(
            new Map([
              [manifestPath, manifestOf("")],
              [
                "document.xml",
                new TextEncoder().encode(
                  `<${local} xmlns="${cpNamespace}" identifier="x">${resourceText("inner", "inner.png")}</${local}>`,
                ),
              ],
            ]),
          );

          // A root the reader gives no representation is refused before any row is written, so
          // no overlay can come from it; every other root leaves the base's rows alone.
          if (!("refused" in read) || local === "manifest") {
            assert.deepStrictEqual(read, { counts: baseCounts, fromManifest: true }, local);
          }
        }

        const nested = yield* overlaysOf(
          new Map([
            [
              manifestPath,
              manifestOf(
                `<manifest identifier="sub"><metadata/><organizations/>${resourceText("inner", "inner.png")}</manifest>`,
              ),
            ],
            ["document.xml", plainDocument],
          ]),
        );
        assert.isTrue(
          "refused" in nested && nested.refused.includes("unmodeled-vocabulary"),
          `a sub-manifest is refused before any row: ${Formatter.format(nested)}`,
        );
      }).pipe(Effect.provide(NodeServices.layer)),
  );
});
