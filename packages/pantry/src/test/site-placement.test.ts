/**
 * Every placement of a site, judged three ways: the law oracle's verdict over the package, the
 * import's own rows, and the CHECKs those rows meet in the database, Site's and Instance's
 * `E1_derived`, read from the predicates grizzle keeps for them and evaluated on the host
 * (`#pantry/test/key-copies.ts` `checkOf`).
 *
 * A site's `part` is the test part it sits in: its parent section's under a section, its parent
 * under a test part, and its own document under any other parent, which its placement reads as its
 * placing instance's part. An include under an item's body or processing, or under a fragment's
 * content, is such a site, and its placement's document is a fragment, whose root is any kind the
 * include may stand for (spec readings 114 and 117). Each package below is the every-relation
 * package, which the law oracle accepts, with one site placed differently.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import type { Addition } from "@bjornpagen/grizzle";
import { Duration, Effect, Formatter, Option } from "effect";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import type { Site } from "#pantry/qti/tests.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { checkOf } from "#pantry/test/key-copies.ts";
import type { Datum } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/locate.ts";

/**
 * A row as the host judges it: its fields' values, each a datum of `#pantry/test/key-copies.ts`.
 */
type Row = Readonly<Record<string, Datum>>;

/**
 * The places a site stands in, each with the parent kind its site has there:
 *
 * - An include in an item's body (`qti-item-body`) and in its response processing
 *   (`qti-response-processing`), the every-relation package's own;
 * - An include of a section document in a section (`qti-assessment-section`), where the package's
 *   section ref was;
 * - A section ref directly under the test part (`qti-test-part`);
 * - An include in a fragment's content (`div`), of a second fragment.
 */
const placements = [
  { kind: "xi:include", name: "item body", parentKind: "qti-item-body" },
  { kind: "xi:include", name: "item processing", parentKind: "qti-response-processing" },
  { kind: "xi:include", name: "section", parentKind: "qti-assessment-section" },
  { kind: "qti-assessment-section-ref", name: "test part", parentKind: "qti-test-part" },
  { kind: "xi:include", name: "fragment", parentKind: "div" },
] as const;

/**
 * One place a site stands in.
 */
type Placement = (typeof placements)[number];

/**
 * The XInclude namespace.
 */
const xi = "http://www.w3.org/2001/XInclude";

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
 * The every-relation package with a site at a placement: its own two item includes, or one of the
 * test's section placements moved, or a second fragment its fragment includes.
 *
 * @param placement - The placement.
 * @returns The package's entries.
 */
const packageOf = (placement: Placement): PackageEntries => {
  const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });
  const sectionRef = '<qti-assessment-section-ref identifier="placement" href="section.xml"/>';
  const placed: Readonly<Record<Placement["name"], () => PackageEntries>> = {
    fragment: () =>
      replaced(
        replaced(
          replaced(
            new Map([
              ...base,
              [
                "items/inner.xml",
                new TextEncoder().encode(
                  '<?xml version="1.0" encoding="UTF-8"?>\n<div xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><p>Placed inside the fragment.</p></div>\n',
                ),
              ],
            ]),
            "items/fragment.xml",
            '<div xmlns="',
            `<div xmlns:xi="${xi}" xmlns="`,
          ),
          "items/fragment.xml",
          "</div>\n",
          '  <xi:include href="inner.xml"/>\n</div>\n',
        ),
        "imsmanifest.xml",
        '<resource identifier="stimulus1-res"',
        '<resource identifier="inner-res" type="imsqti_fragment_xmlv3p0" href="items/inner.xml">\n      <file href="items/inner.xml"/>\n    </resource>\n    <resource identifier="stimulus1-res"',
      ),
    "item body": () => base,
    "item processing": () => base,
    section: () =>
      replaced(
        replaced(
          base,
          "test.xml",
          "<qti-assessment-test ",
          `<qti-assessment-test xmlns:xi="${xi}" `,
        ),
        "test.xml",
        sectionRef,
        '<xi:include href="section.xml"/>',
      ),
    "test part": () =>
      replaced(
        base,
        "test.xml",
        `      ${sectionRef}\n    </qti-assessment-section>\n`,
        `    </qti-assessment-section>\n    ${sectionRef}\n`,
      ),
  };

  return placed[placement.name]();
};

/**
 * A site's row as its check reads it: its kind and its parent's, and the scope it is placed in.
 *
 * @param site - The site, as the import writes it.
 * @returns The row.
 */
const siteRow = (site: Addition<typeof Site>) =>
  ({
    document: site.document,
    kind: site.kind,
    parent: site.parent,
    parentKind: site.parentKind,
    parentLooseChain: site.parentLooseChain,
    parentMixes: site.parentMixes,
    part: site.part,
    replaced: site.replaced,
  }) satisfies Row;

/**
 * Site's and Instance's `E1_derived`, as the schema states them.
 */
const siteCheck = Option.getOrThrow(checkOf(Qti.statements, "Site", "E1_derived"));

const instanceCheck = Option.getOrThrow(checkOf(Qti.statements, "Instance", "E1_derived"));

/**
 * Every instance below an assembly's root as the database holds it, its drawn and accumulated
 * fields filled as grizzle fills them: `start`, its place in the tree's pre-order, and its parent's
 * `parentDocument`, `parentPart`, `parentReplaced` and `parentMixes`.
 *
 * @param root - The assembly's root, as the import writes it.
 * @returns Each placed instance's row.
 */
const placedRows = (root: InstanceMember): readonly Row[] => {
  const rows: Row[] = [];
  let next = 0;
  const visit = (instance: InstanceMember, parent: Option.Option<InstanceMember>): void => {
    const start = BigInt(next);
    next += 1;
    for (const held of Option.toArray(parent)) {
      rows.push({
        assemblyKind: instance.assemblyKind,
        document: instance.document,
        id: instance.id,
        mixes: instance.mixes,
        parentDocument: held.document,
        parentMixes: held.mixes,
        parentPart: held.part,
        parentReplaced: held.replaced,
        part: instance.part,
        replaced: instance.replaced,
        rootKind: instance.rootKind,
        site: instance.site,
        siteLooseChain: instance.siteLooseChain,
        siteMixes: instance.siteMixes,
        sitePart: instance.sitePart,
        siteReplaced: instance.siteReplaced,
        siteStart: instance.siteStart,
        start,
      });
    }

    for (const child of instance.children) {
      visit(child, Option.some(instance));
    }
  };
  visit(root, Option.none());

  return rows;
};

/**
 * Name the part a site sits in: its document, its parent test part, or its section's.
 *
 * @param site - The site's row.
 * @returns The feature its part reaches.
 */
const partOf = (site: Row): Reached => {
  if (site["part"] === site["document"]) {
    return "part is the document";
  }

  return site["part"] === site["parent"] ? "part is the parent" : "part is the section's";
};

/**
 * The features a search must reach: a site whose part is its document, one whose part is its
 * parent test part, and one whose part is its section's.
 */
type Reached = "part is the document" | "part is the parent" | "part is the section's";

layer(NodeServices.layer, { excludeTestServices: true })("a site at every placement", (it) => {
  it.effect(
    "writes each placement's site and instances as the law oracle accepts them and Site's and Instance's E1_derived keep them, and refuses its site under the other part",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every placement of a site: an include in an item's body, its processing, a section and a fragment, and a section ref under a test part",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<Reached>([
              "part is the document",
              "part is the parent",
              "part is the section's",
            ]),
            generator: (source) => source.draw(element(placements)),
            limit: placements.length,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the law oracle's verdict, and Site's and Instance's E1_derived read from the schema's own predicates",
            },
            suite: "test/site-placement",
          },
          (placement, c) =>
            Effect.scoped(
              Effect.gen(function* onePlacement() {
                const dir = yield* scopedPackage(packageOf(placement));
                const verdict = yield* oracleVerdict(yield* readPackage(dir));
                const program = yield* readProgram(dir);
                const sites = [...program.inputs.Site.values()]
                  .map(siteRow)
                  .filter(
                    (site) =>
                      site.kind === placement.kind && site.parentKind === placement.parentKind,
                  );

                assert.deepStrictEqual(verdict, { kind: "accepted" }, placement.name);
                assert.isNotEmpty(sites, `${placement.name}: no site there`);
                for (const site of sites) {
                  const part = partOf(site);
                  c.note(part);
                  assert.isTrue(siteCheck(site), `${placement.name}: ${part}`);

                  // The planted wrong part: the site's part moved to the other place a site's part
                  // may be, which Site's E1_derived refuses outside a section.
                  const wrongs =
                    site.parentKind === "qti-assessment-section"
                      ? []
                      : [part === "part is the document" ? site.parent : site.document];
                  for (const wrong of wrongs) {
                    assert.isFalse(
                      siteCheck({ ...site, part: wrong }),
                      `${placement.name}: a wrong part kept`,
                    );
                  }
                }

                for (const root of program.inputs.Instance.values()) {
                  for (const row of placedRows(root)) {
                    assert.isTrue(
                      instanceCheck(row),
                      `${placement.name}: the instance of ${Formatter.format(row["rootKind"])}`,
                    );
                  }
                }
              }),
            ),
        ),
      ),
    600_000,
  );
});
