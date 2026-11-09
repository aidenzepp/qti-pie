/**
 * The site generator's packages (`#pantry/test/gen/sites.ts`) against the law oracle (lane NIL, the
 * SitePath fix; spec readings 114 and 115): every way each of the package's three sites can write
 * its href, exhausted, each package's import rows judged by the site laws restated on the host,
 * and three verdicts held to one: the rows', the law oracle's, and the case table's
 * (`rulesOfBox`).
 *
 * A site's href is a row of its own, `SitePath`, written only where the href names a path of the
 * package, with whether an entry is there (`entry`), and its target another, `SiteTarget`. So no
 * site holds a stand-in path, and each fault breaks one law: an href naming an absent file breaks
 * `File_exists` alone, a CHECK the row meets as it is inserted, whatever its site; an include that
 * names no document breaks "Include target" alone; a section ref naming no section document,
 * "Document entry" alone.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import type { Case } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { ruleOfLaw } from "#pantry/import/refusal.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/own.ts";
import type { Site } from "#pantry/qti/tests.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { datumText } from "#pantry/test/predicates.ts";
import type { Datum } from "#pantry/test/predicates.ts";
import { containmentsOf } from "#pantry/test/judged-laws.ts";
import { checkOf } from "#pantry/test/key-copies.ts";
import {
  hrefCases,
  outsideRulesOfBox,
  ruleOfCase,
  rulesOfBox,
  siteBox,
  siteLiteral,
  siteNames,
  sitePackage,
  sites,
} from "#pantry/test/gen/sites.ts";
import type { HrefCase, SiteBox, SiteName } from "#pantry/test/gen/sites.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 284.1 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 2_400_000;

/**
 * The rules a site's laws, the required href of a section ref, or an absent file refuse a package
 * under: the include's target, the section ref's document entry, the stated limit on a remote
 * section ref (reading 170), the href's reachability, AL3 and the file's existence.
 */
const siteRules: ReadonlySet<string> = new Set([
  "entry-kind",
  "file-exists",
  "include-target",
  "reachability",
  "remote-section",
  "required-attribute",
]);

/**
 * A situation the box must reach: each site under each case.
 */
type Situation = `${SiteName} ${HrefCase}`;

/**
 * Find the one site row of a named site of the box: its document's and its element's.
 *
 * @param inputs - The package's import inputs.
 * @param name - The site.
 * @returns The row.
 */
const siteOf = (inputs: PackageInputs, name: SiteName): Addition<typeof Site> => {
  const paths = new Map([...inputs.Document.values()].map(({ node, path }) => [node, path]));
  const found = [...inputs.Site.values()].filter(
    (site) => paths.get(site.document) === sites[name].path && site.kind === sites[name].kind,
  );
  assert.lengthOf(found, 1, `${name}: one site row`);

  const [site] = found;
  if (site === undefined) {
    return assert.fail(`${name}: no site row`);
  }

  return site;
};

/**
 * Judge a package's site rows by the site laws restated on the host: each `SitePath` a site's, its
 * path its href's `ReferencePath` and `entry` exactly where an entry is there; each `SiteTarget` a
 * site's and its path's, exactly where that path is a listed document. The rules the rows break,
 * each site's one: `File_exists` where its path's `entry` is false, which PostgreSQL judges as the
 * row is inserted; otherwise, for an include with no target whose href does not resolve outside the
 * package, "Include target" (an external include, marked `external` exactly where its href's
 * `Reference` is external, is stored as written and never fetched, reading 115); for a section ref
 * marked `external`, the stated limit "Remote section ref" (reading 170), with no href, AL3, which
 * PostgreSQL judges first, and with one that names no section document of the package, "Document
 * entry".
 *
 * @param inputs - The package's import inputs.
 * @param literal - The package's literal, for the assertions' messages.
 * @returns The rules the rows break.
 */
const rowRules = (inputs: PackageInputs, literal: string): ReadonlySet<string> => {
  const hrefPaths = new Set(
    [...inputs.ReferencePath.values()]
      .filter(({ name }) => name === "href")
      .map(({ node, package: pkg, path }) => JSON.stringify([node, pkg, path])),
  );
  const hrefs = new Set(
    [...inputs.Reference.values()].flatMap(({ name, node }) => (name === "href" ? [node] : [])),
  );
  const externalHrefs = new Set(
    [...inputs.Reference.values()].flatMap(({ name, node, scope }) =>
      name === "href" && scope === "external" ? [node] : [],
    ),
  );
  const entries = new Set(
    [...inputs.Package.values()].flatMap(({ entries: held }) => held.map(({ path }) => path)),
  );
  const documents = new Map([...inputs.Document.values()].map(({ node, path }) => [path, node]));
  const pathOf = new Map([...inputs.SitePath.values()].map((row) => [row.node, row]));
  const targetOf = new Map([...inputs.SiteTarget.values()].map((row) => [row.node, row]));
  const sectionPaths = new Set(
    [...inputs.TestDocument.values()]
      .filter(({ rootKind }) => rootKind === "qti-assessment-section")
      .map(({ path }) => path),
  );
  const siteNodes = new Set([...inputs.Site.values()].map(({ node }) => node));
  assert.isTrue(
    [...pathOf.keys(), ...targetOf.keys()].every((node) => siteNodes.has(node)),
    `${literal}: a path or a target of no site`,
  );

  const broken = new Set<string>();
  for (const name of siteNames) {
    const site = siteOf(inputs, name);
    const path = pathOf.get(site.node);
    const target = targetOf.get(site.node);
    assert.strictEqual(
      site.external,
      externalHrefs.has(site.node),
      `${literal}: ${name}'s external mark`,
    );
    if (path !== undefined) {
      assert.isTrue(
        hrefPaths.has(JSON.stringify([path.node, path.package, path.path])),
        `${literal}: ${name}'s path ${path.path} is no ReferencePath of its href`,
      );
      assert.strictEqual(path.entry, entries.has(path.path), `${literal}: ${name}'s entry`);
      assert.strictEqual(path.kind, site.kind, `${literal}: ${name}'s path's kind`);
    }

    assert.strictEqual(
      target?.target,
      path === undefined ? undefined : documents.get(path.path),
      `${literal}: ${name}'s target`,
    );
    assert.isTrue(
      target === undefined || (target.path === path?.path && target.package === path.package),
      `${literal}: ${name}'s target copies no path of its site`,
    );

    if (path?.entry === false) {
      broken.add("file-exists");
    } else if (sites[name].kind === "xi:include") {
      if (target === undefined && !site.external) {
        broken.add("include-target");
      }
    } else if (site.external) {
      broken.add("remote-section");
    } else if (path === undefined) {
      broken.add(hrefs.has(site.node) ? "entry-kind" : "required-attribute");
    } else if (!sectionPaths.has(path.path)) {
      broken.add("entry-kind");
    }
  }

  return broken;
};

/**
 * A row as the schema's statements read it.
 */
type Row = Readonly<Record<string, Datum>>;

/**
 * `SitePath`'s `File_exists`, read from the predicate grizzle keeps for it.
 */
const fileExists = Option.getOrThrow(checkOf(Qti.statements, "SitePath", "File_exists"));

/**
 * `Site`'s `Remote_section_ref`, read from the predicate grizzle keeps for it.
 */
const remoteSection = Option.getOrThrow(checkOf(Qti.statements, "Site", "Remote_section_ref"));

/**
 * Write the values a containment pairs as one key, each as its text, so a source tuple is sought
 * among its target's.
 *
 * @param values - The values, a field a row lacks as none.
 * @returns The key.
 */
const keyOf = (values: readonly (Datum | undefined)[]): string =>
  JSON.stringify(values.map(datumText));

/**
 * Every containment the schema states from a site or its path, read from the statements grizzle
 * keeps, selections included: the include's target and href, the section ref's document entry,
 * the file's existence and the href's reachability.
 */
const siteContainments = [...containmentsOf(Qti, "Site"), ...containmentsOf(Qti, "SitePath")];

/**
 * Judge each site's rows by the schema's own statements, read from grizzle's: `File_exists` over
 * its path, `Remote_section_ref` over the site, and every containment from it or its path into a
 * relation these rows hold, each source row its selection holds sought among the target rows its
 * selection holds. Each breach is named by refusal.ts's rule for its law, by the site it is the row
 * of.
 *
 * @param inputs - The package's import inputs.
 * @returns The rules each site's rows break, by its node.
 */
const schemaRules = (inputs: PackageInputs): ReadonlyMap<string, ReadonlySet<string>> => {
  const held: ReadonlyMap<string, readonly Row[]> = new Map<string, readonly Row[]>([
    [
      "Entry",
      [...inputs.Package.values()].flatMap(({ entries, id }) =>
        entries.map(({ path }) => ({ package: id, path })),
      ),
    ],
    ["Reference", [...inputs.Reference.values()]],
    ["ReferencePath", [...inputs.ReferencePath.values()]],
    ["Site", [...inputs.Site.values()]],
    ["SitePath", [...inputs.SitePath.values()]],
    ["SiteTarget", [...inputs.SiteTarget.values()]],
    ["TestDocument", [...inputs.TestDocument.values()]],
  ]);
  const broken = new Map<string, Set<string>>();
  const breach = (node: Datum | undefined, rule: string) => {
    const at = datumText(node);
    broken.set(at, new Set([...(broken.get(at) ?? []), rule]));
  };
  for (const path of inputs.SitePath.values()) {
    if (!fileExists(path)) {
      breach(path.node, "file-exists");
    }
  }

  for (const site of inputs.Site.values()) {
    if (!remoteSection(site)) {
      breach(site.node, "remote-section");
    }
  }

  for (const containment of siteContainments) {
    const targets = held.get(containment.to);
    if (targets === undefined) {
      continue;
    }

    const present = new Set(
      targets
        .filter(containment.targeted)
        .map((row) => keyOf(containment.toFields.map((field) => row[field]))),
    );
    for (const row of held.get(containment.from) ?? []) {
      const sought = keyOf(containment.fromFields.map((field) => row[field]));
      if (containment.selected(row) && !present.has(sought)) {
        breach(
          row["node"],
          Option.getOrElse(ruleOfLaw(containment.law), () => "unnamed"),
        );
      }
    }
  }

  return broken;
};

/**
 * Judge one package of the box: its rows under the site laws, the law oracle's verdict and the case
 * table's rules, one set of rules from all three.
 *
 * @param box - The package.
 * @param c - The search's case.
 * @returns Nothing; fails the case on a disagreement.
 */
const judged = (box: SiteBox, c: Case<Situation>) =>
  Effect.gen(function* judgedSites() {
    const literal = siteLiteral(box);
    const dir = yield* scopedPackage(sitePackage(box));
    const verdict = yield* oracleVerdict(yield* readPackage(dir));
    const program = yield* readProgram(dir);
    const byRows = rowRules(program.inputs, literal);
    const byCases = rulesOfBox(box);
    const outside = outsideRulesOfBox(box);
    const oracled = new Set(
      verdict.kind === "refused" ? [...verdict.rules].filter((rule) => siteRules.has(rule)) : [],
    );

    c.noteAll(siteNames.map((name): Situation => `${name} ${box[name]}`));
    assert.deepStrictEqual(
      byRows,
      byCases,
      `${literal}: its site rows break {${[...byRows].join(", ")}}, and its cases {${[...byCases].join(", ")}}`,
    );
    assert.deepStrictEqual(
      oracled,
      byCases,
      `${literal}: the law oracle refuses it under {${verdict.kind === "refused" ? [...verdict.rules].join(", ") : ""}}, and its cases {${[...byCases].join(", ")}}`,
    );
    assert.strictEqual(
      verdict.kind === "accepted",
      byCases.size === 0 && outside.size === 0,
      `${literal}: the law oracle ${verdict.kind === "accepted" ? "accepts" : "refuses"} it`,
    );
    if (byCases.size > 0 && verdict.kind === "refused") {
      assert.deepStrictEqual(
        [...verdict.rules].filter((rule) => !byCases.has(rule) && !outside.has(rule)),
        [],
        `${literal}: the law oracle names rules beyond its cases {${[...byCases].join(", ")}} and the outside rules {${[...outside].join(", ")}}`,
      );
    }

    if (byCases.size === 0 && verdict.kind === "refused") {
      assert.deepStrictEqual(
        verdict.rules,
        outside,
        `${literal}: the law oracle refuses it under {${[...verdict.rules].join(", ")}}, outside the site laws`,
      );
    }
  }).pipe(Effect.scoped);

layer(NodeServices.layer, { excludeTestServices: true })("test/gen/sites.ts", (it) => {
  it.effect(
    "writes each site's href and target as rows of their own, so each package breaks exactly the site laws its cases and the law oracle name, an absent file File exists alone",
    (ctx) =>
      // Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts`) over the same
      // entries, and the specification as a checker, reading 115 and §7.5 per case
      // (`ruleOfCase`), against the import's rows under the site laws restated on the host.
      // Bound: the every-relation package's three sites, each listed, naming an absent file, an
      // entry listed as no document or a file outside the package, or writing no href, 125.
      searched(
        ctx,
        exhaust(
          {
            box: "the every-relation package's include of fragment.xml, include of rules.xml and section ref of section.xml, each listed, naming an absent file, an entry listed as no document or an external file, or writing no href",
            caseHang: Duration.seconds(120),
            coverage: requiredInSpace<Situation>([
              "fragment absent",
              "fragment external",
              "fragment listed",
              "fragment missing",
              "fragment unlisted",
              "rules absent",
              "rules external",
              "rules listed",
              "rules missing",
              "rules unlisted",
              "section absent",
              "section external",
              "section listed",
              "section missing",
              "section unlisted",
            ]),
            generator: siteBox,
            limit: hrefCases.length ** siteNames.length,
            literal: siteLiteral,
            oracle: { kind: "second-implementation", name: "the law oracle over the same entries" },
            suite: "pantry/test/gen-sites-box",
          },
          judged,
        ),
      ),
    { timeout: testTimeoutMs },
  );

  it.effect(
    "breaks, by the schema's own statements over each package's rows, each site's one law: an absent file File_exists alone, never its site's document law beside it, and an external section ref Remote_section_ref alone",
    (ctx) =>
      // Oracle: the specification as a checker, reading 115 and §7.5 per case (`ruleOfCase`),
      // against the schema's statements as grizzle keeps them, their selections included
      // (`#pantry/test/key-copies.ts` `checkOf`, `#pantry/test/judged-laws.ts` `containmentsOf`),
      // evaluated over the import's rows and named by refusal.ts's rules. A section ref with no
      // href breaks its document law, a deferred key, beside AL3, which PostgreSQL judges first as
      // the node is inserted.
      // Bound: the box's 125 packages.
      searched(
        ctx,
        exhaust(
          {
            box: "the every-relation package's include of fragment.xml, include of rules.xml and section ref of section.xml, each listed, naming an absent file, an entry listed as no document or an external file, or writing no href",
            caseHang: Duration.seconds(120),
            coverage: requiredInSpace<Situation>([
              "fragment absent",
              "rules absent",
              "section absent",
              "section external",
              "section missing",
            ]),
            generator: siteBox,
            limit: hrefCases.length ** siteNames.length,
            literal: siteLiteral,
            oracle: { kind: "specification", name: "reading 115 and §7.5 per case" },
            suite: "pantry/test/gen-sites-schema",
          },
          (box: SiteBox, c: Case<Situation>) =>
            Effect.gen(function* bySchema() {
              const literal = siteLiteral(box);
              const program = yield* readProgram(yield* scopedPackage(sitePackage(box)));
              const broken = schemaRules(program.inputs);

              c.noteAll(siteNames.map((name): Situation => `${name} ${box[name]}`));
              for (const name of siteNames) {
                const site = siteOf(program.inputs, name);
                const expected = ruleOfCase(name, box[name]);
                assert.deepStrictEqual(
                  [...(broken.get(site.node) ?? [])].toSorted(),
                  expected === undefined
                    ? []
                    : [expected === "required-attribute" ? "entry-kind" : expected],
                  `${literal}: ${name}`,
                );
              }
            }).pipe(Effect.scoped),
        ),
      ),
    { timeout: testTimeoutMs },
  );
});
