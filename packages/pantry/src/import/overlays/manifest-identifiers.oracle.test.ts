/**
 * A manifest's identifiers as optional parts: the host writes a `ManifestId` only where the
 * `cp:manifest` writes its `identifier`, a `ResourceId` only where a `cp:resource` writes its own,
 * and a `DependencyTarget` only where a dependency's `identifierref` is some resource's identifier,
 * so no row compares an identifier an element does not write. Over every case of the box, the
 * import's rows, judged on the host, break no law the law oracle does not find broken, and are
 * refused under the oracle's rule wherever they break one.
 *
 * Oracle: the specification as a checker, IMS Content Packaging 1.2 (the manifest's and each
 * resource's `identifier` are required `xs:ID`s, one ID space; a dependency's `identifierref`
 * names a resource of its manifest, never its own, §6.11.5 B ii) and the XSDs' use="required"
 * (AL3), through the law oracle's verdict on each case. A missing value is a row of its own
 * relation, never a sentinel (AGENTS.md, Schema intent): before this guard the import wrote an
 * absent identifier as "", so two resources of none broke "DocumentId key" and a manifest and a
 * resource of none "Manifest id space", where AL3 alone is broken.
 *
 * The identifiers and identifierrefs compare collapsed: an `xs:ID` and an `xs:IDREF` are whiteSpace
 * `collapse` types, so an `identifierref` written `" r1"` names the resource `r1`, and a manifest
 * `identifier=" M"` is a resource's `M` (decision 457 (3), need e0a6760b; IMS Content Packaging
 * 1.2, §6.11.4 and §6.11.5, leave the value to the binding). The explicit cases hold the host's
 * broken laws to exactly the oracle's: before the import collapsed them, it broke "Dependency
 * target" on a padded `identifierref` or a padded resource identifier, where the oracle raises
 * nothing, and raised no "Manifest id space" on a padded manifest identifier, where the oracle
 * does.
 */
import { randomUUID } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { readProgram } from "#pantry/import/program.ts";
import { rulesOf } from "#pantry/import/refusal.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { item } from "#pantry/test/probe.ts";

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The content packaging namespace of QTI 3.0's profile.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The identifier a resource of the box writes: its own (`r<n>`), the first resource's (`r0`), the
 * manifest's (`m`), or none.
 */
type IdentifierDraw = "m" | "none" | "own" | "r0";

/**
 * The `identifierref` the first resource's dependency writes: no dependency, its own identifier
 * (`r0`), the second resource's (`r1`), or one no resource writes.
 */
type DependencyDraw = "none" | "nowhere" | "r0" | "r1";

/**
 * One case of the box: the manifest's identifier written or not, a first resource with its
 * identifier, its type written or not and its dependency, and an optional second resource.
 */
interface IdentifierCase {
  readonly dependency: DependencyDraw;
  readonly first: IdentifierDraw;
  readonly manifest: boolean;
  readonly second: IdentifierDraw | undefined;
  readonly typed: boolean;
}

/**
 * Every case: 2 manifests, 4 first identifiers, 2 types, 4 dependencies and 5 second resources,
 * 320 cases.
 */
const cases: Gen<IdentifierCase> = (source) => ({
  dependency: source.draw(element(["none", "r0", "r1", "nowhere"] as const)),
  first: source.draw(element(["own", "r0", "m", "none"] as const)),
  manifest: source.draw(element([true, false] as const)),
  second: source.draw(element([undefined, "own", "r0", "m", "none"] as const)),
  typed: source.draw(element([true, false] as const)),
});

/**
 * The situations a case reaches, each a named variant the box must hold.
 */
type Situation =
  | "dangling-dependency"
  | "duplicate-identifier"
  | "manifest-id-clash"
  | "self-dependency"
  | "unnamed-manifest"
  | "unnamed-resource"
  | "unnamed-resources"
  | "untyped";

/**
 * Write a drawn identifier as the resource at a place writes it.
 *
 * @param draw - The draw.
 * @param at - The resource's place.
 * @returns The identifier, none for none.
 */
const identifierOf = (draw: IdentifierDraw, at: number): Option.Option<string> => {
  if (draw === "none") {
    return Option.none();
  }

  return Option.some(draw === "own" ? `r${String(at)}` : draw);
};

/**
 * Name the situations a case reaches.
 *
 * @param input - The case.
 * @returns Its situations.
 */
const situationsOf = (input: IdentifierCase): readonly Situation[] => {
  const written = [
    identifierOf(input.first, 0),
    ...(input.second === undefined ? [] : [identifierOf(input.second, 1)]),
  ];
  const named = written.flatMap((identifier) => Option.toArray(identifier));
  const reached: readonly (readonly [Situation, boolean])[] = [
    ["unnamed-manifest", !input.manifest],
    ["unnamed-resource", written.some(Option.isNone)],
    ["unnamed-resources", written.length === 2 && written.every(Option.isNone)],
    ["untyped", !input.typed],
    ["duplicate-identifier", new Set(named).size < named.length],
    ["manifest-id-clash", input.manifest && named.includes("m")],
    [
      "self-dependency",
      Option.exists(written[0] ?? Option.none(), (id) => id === input.dependency),
    ],
    ["dangling-dependency", input.dependency !== "none" && !named.includes(input.dependency)],
  ];

  return reached.flatMap(([situation, holds]) => (holds ? [situation] : []));
};

/**
 * Write an attribute that may be unwritten.
 *
 * @param name - Its name.
 * @param value - Its lexical form, none where it is unwritten.
 * @returns The attribute's text, with its leading space, or nothing.
 */
const attribute = (name: string, value: Option.Option<string>): string =>
  Option.match(value, { onNone: () => "", onSome: (written) => ` ${name}="${written}"` });

/**
 * Write a case's manifest, the package's one entry.
 *
 * @param input - The case.
 * @returns The manifest's text.
 */
const manifestOf = (input: IdentifierCase): string => {
  const first = `<resource${attribute("identifier", identifierOf(input.first, 0))}${input.typed ? ' type="webcontent"' : ""}>${input.dependency === "none" ? "" : `<dependency identifierref="${input.dependency}"/>`}</resource>`;
  const second =
    input.second === undefined
      ? ""
      : `<resource${attribute("identifier", identifierOf(input.second, 1))} type="webcontent"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="${cpNamespace}"${input.manifest ? ' identifier="m"' : ""}><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${first}${second}</resources></manifest>`;
};

/**
 * Judge a package both ways: the law oracle's judgment and verdict, and the import's rows judged
 * on the host.
 *
 * @param files - Each file's text by path; {@link manifestPath} is the manifest.
 * @returns The oracle's verdict and broken laws, the import's inputs and the host's verdict.
 */
const judgedBothWays = Effect.fn("test.manifestIdentifiers.judgedBothWays")(
  function* judgedBothWays(files: Readonly<Record<string, string>>) {
    const text = new TextEncoder();
    const dir = yield* scopedPackage(
      new Map(
        Object.entries(files).map(([path, written]) => [path, text.encode(written)] as const),
      ),
    );
    const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
    const minted = new Set<string>();
    const { inputs } = yield* readProgram(dir, (): NodeId => {
      const id: NodeId = randomUUID();
      minted.add(id);

      return id;
    });
    const oracleLaws: ReadonlySet<string> = new Set(
      judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
    );

    return {
      host: hostVerdictOf(inputs, minted),
      inputs,
      oracleLaws,
      verdict: verdictOf(judgment),
    };
  },
);

/**
 * Write a manifest of identifier `M` around its resources, as the explicit cases do.
 *
 * @param resources - The `resource` elements, as written.
 * @param identifier - The manifest's `identifier`, as written.
 * @returns The manifest's text.
 */
const writtenManifestOf = (resources: string, identifier = "M"): string =>
  `<?xml version="1.0" encoding="UTF-8"?><manifest xmlns="${cpNamespace}" identifier="${identifier}"><metadata><schema>QTI Package</schema><schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>${resources}</resources></manifest>`;

/**
 * One explicit case of a padded identifier or identifierref: its package, the laws both sides must
 * break (`present`) and must not (`absent`), and whether it is valid, a package the oracle accepts
 * and whose rows break no law on the host (reading 1).
 */
interface PaddedCase {
  readonly absent: readonly string[];
  readonly files: Readonly<Record<string, string>>;
  readonly name: string;
  readonly present: readonly string[];
  readonly valid: boolean;
}

/**
 * Write a `webcontent` resource with its one file, which QTI 3.0's profile requires (`file`
 * [1..*]), so that no content model law breaks beside the laws a case is about.
 *
 * @param identifier - Its `identifier`, as written.
 * @param file - Its file's `href`, an entry of the package.
 * @param dependencies - Its `dependency` elements, as written.
 * @returns The resource's text.
 */
const webcontentOf = (identifier: string, file: string, dependencies = ""): string =>
  `<resource identifier="${identifier}" type="webcontent"><file href="${file}"/>${dependencies}</resource>`;

/**
 * The text of each `webcontent` file, which no law reads.
 */
const webText = "<p>web</p>";

/**
 * The explicit cases (decision 457 (3)): each identifier and identifierref compares collapsed.
 */
const paddedCases: readonly PaddedCase[] = [
  {
    absent: ["Dependency target"],
    files: {
      [manifestPath]: writtenManifestOf(
        `${webcontentOf("r1", "r1.html")}${webcontentOf("r2", "r2.html", '<dependency identifierref=" r1"/>')}`,
      ),
      "r1.html": webText,
      "r2.html": webText,
    },
    name: "a padded identifierref names its resource",
    present: [],
    valid: false,
  },
  {
    absent: ["Dependency target"],
    files: {
      [manifestPath]: writtenManifestOf(
        `${webcontentOf(" r1 ", "r1.html")}${webcontentOf("r2", "r2.html", '<dependency identifierref="r1"/>')}`,
      ),
      "r1.html": webText,
      "r2.html": webText,
    },
    name: "an identifierref names a padded resource identifier",
    present: [],
    valid: false,
  },
  {
    absent: [],
    files: {
      "m.html": webText,
      [manifestPath]: writtenManifestOf(webcontentOf("M", "m.html"), " M"),
    },
    name: "a padded manifest identifier is a resource's",
    present: ["Manifest id space"],
    valid: false,
  },
  {
    absent: ["Dependency target"],
    files: {
      "item.xml": item,
      [manifestPath]: writtenManifestOf(
        `<resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/><dependency identifierref=" W"/></resource>${webcontentOf("W", "w.html")}`,
      ),
      "w.html": webText,
    },
    name: "a valid package whose item depends on a padded identifierref",
    present: [],
    valid: true,
  },
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/package.ts, a manifest's identifiers",
  (it) => {
    it.effect(
      "writes an identifier only where it is written, and is refused under the oracle's rule",
      (ctx) =>
        // Bound: the 320 cases of `cases`, exhausted.
        searched(
          ctx,
          exhaust(
            {
              box: "a manifest with or without its identifier, a first resource of its own identifier, the first's, the manifest's or none, typed or not, with no dependency or one on itself, the second resource or nothing, and an optional second resource of the same identifiers",
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<Situation>([
                "dangling-dependency",
                "duplicate-identifier",
                "manifest-id-clash",
                "self-dependency",
                "unnamed-manifest",
                "unnamed-resource",
                "unnamed-resources",
                "untyped",
              ]),
              generator: cases,
              limit: 400,
              literal: (value) => Formatter.format(value),
              oracle: { kind: "specification", name: "the law oracle's verdict on each case" },
              suite: "import/overlays-manifest-identifiers",
            },
            (input, c) =>
              Effect.gen(function* identifierCase() {
                c.noteAll(situationsOf(input));

                const manifest = manifestOf(input);
                const { host, inputs, oracleLaws, verdict } = yield* judgedBothWays({
                  [manifestPath]: manifest,
                });

                for (const name of host.broken.keys()) {
                  assert.isTrue(
                    oracleLaws.has(name),
                    `${manifest}: the import's rows break ${name}, which the oracle finds held (${Formatter.format([...oracleLaws])})`,
                  );
                }

                if (Arr.isReadonlyArrayNonEmpty(host.brokenLaws)) {
                  assert.strictEqual(
                    Option.getOrUndefined(Arr.head(rulesOf(host.brokenLaws))),
                    verdict.verdict === "accepted" ? undefined : verdict.rule,
                    `${manifest}: the import's rows, judged on the host, refused under the oracle's rule`,
                  );
                }

                const resources = [
                  identifierOf(input.first, 0),
                  ...(input.second === undefined ? [] : [identifierOf(input.second, 1)]),
                ];
                assert.strictEqual(inputs.ManifestId.size, input.manifest ? 1 : 0, manifest);
                assert.sameMembers(
                  [...inputs.ResourceId.values()].map(({ identifier }) => identifier),
                  resources.flatMap((identifier) => Option.toArray(identifier)),
                  `${manifest}: a ResourceId a written identifier`,
                );
              }).pipe(Effect.scoped),
          ),
        ),
      600_000,
    );

    for (const padded of paddedCases) {
      it.effect(`compares the identifiers and identifierrefs collapsed: ${padded.name}`, () =>
        Effect.gen(function* paddedCase() {
          const { host, oracleLaws, verdict } = yield* judgedBothWays(padded.files);
          const hostLaws = [...host.broken.keys()];

          assert.sameMembers(
            hostLaws,
            [...oracleLaws],
            "the host breaks exactly the oracle's laws",
          );
          for (const law of padded.present) {
            assert.include(hostLaws, law, `the host breaks ${law}`);
          }

          for (const law of padded.absent) {
            assert.notInclude(hostLaws, law, `the host breaks no ${law}`);
            assert.isFalse(oracleLaws.has(law), `the oracle finds ${law} held`);
          }

          if (padded.valid) {
            assert.strictEqual(verdict.verdict, "accepted", "the oracle accepts");
            assert.lengthOf(hostLaws, 0, "the host breaks no law");
          }
        }).pipe(Effect.scoped),
      );
    }
  },
);
