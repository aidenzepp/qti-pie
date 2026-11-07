/**
 * The attribute layer's free tests: its statements build beside the document layer's, each check is
 * named by an oracle law, the host's `attrs` agrees with the installed grammar, AL2's distinctness
 * refuses exactly a repeated closed name, the derived bounds are what `#pantry/qti/limits.ts`
 * derives, and `coords` is judged by `CoordsDType` alone, whatever its shape.
 *
 * The database tests (`attributes.db.test.ts`) judge the same laws through PostgreSQL.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { openDomain } from "#pantry/grammar/attributes.ts";
import { patternFlags } from "#pantry/grammar/domains.ts";
import { openClasses, schemaVersions } from "#pantry/grammar/kinds.ts";
import { attributeRows, GoverningOf, grammar, ValueDomainOf } from "#pantry/grammar/install.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedRows } from "#pantry/model/folds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import {
  Attribute,
  AttributeEntity,
  attributeLaws,
  Idref,
  OpenAttributeName,
  OpenLocal,
} from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { namespaceText } from "#pantry/qti/limits.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { caseHang, featuresOf, idOf, searchTimeout, xdmDocument } from "#pantry/test/gen/xdm.ts";
import type { XdmFeature } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawNames, lawsOf, ruleOf } from "#pantry/test/oracle.ts";
import { asiNamespace, xsiNamespace, xsNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * Whether an `AttributeName` handle is an open class's.
 *
 * @param name - The handle.
 * @returns Whether it is one of `openClasses`.
 */
const isOpen = (name: string): boolean => openClasses.some((open) => open === name);

/**
 * The installed `GoverningOf`, keyed `version kind governs` by its rows: the second implementation
 * the host's governor lookup is checked against.
 */
const governing: ReadonlyMap<string, string> = new Map(
  GoverningOf.rows.map(({ governor, governs, kind, version }) => [
    `${version} ${kind} ${governs}`,
    governor,
  ]),
);

/**
 * The installed `AttributeGrammar`'s slots, keyed `version governor name` by its rows.
 */
const slots: ReadonlyMap<string, number> = new Map(
  attributeRows.map(({ governor, name, position, version }) => [
    `${version} ${governor} ${name}`,
    Number(position),
  ]),
);

describe("qti/attributes.ts, declared", () => {
  it("builds a schema of the closed relations, Node, the character data and the attribute layer with every law, each statement once", () => {
    const built = schema("AttributeLayer", { ...Qti.relations }, [
      ...nodeLaws,
      ...chardataLaws,
      ...attributeLaws,
    ]);

    for (const relation of [Attribute, OpenAttributeName, Idref, AttributeEntity]) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(attributeLaws).size, attributeLaws.length);
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length + chardataLaws.length + attributeLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = attributeLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.isDefined(ruleOf(law), name);
      }
    }

    assert.deepStrictEqual([...new Set(named)].toSorted(), [
      "AL1 admission",
      "AL2 distinct",
      "AL3 required",
      "AL4 data name",
      "AL4 declared data name",
      "AL4 open names",
      "Attribute prefix",
      "Double bound",
      "Double value",
      "E1 derived",
      "Foreign attribute class",
      "TextDomain",
      "value domain",
    ]);
  });

  it("types an open attribute's namespace names by the one namespace bound, and its local name by its own", () => {
    // Oracle: `#pantry/qti/limits.ts`, whose bounds `limits.test.ts` holds to grizzle's
    // `keyTextBytes`: an open attribute's namespace and its element's take the schema-wide
    // namespace name type, what `(node, uri, local)` leaves beside a uuid and a local name, and its
    // local name `OpenLocal`, an NCName of the local name's bytes with no counted repetition.
    assert.strictEqual(OpenAttributeName.fields.uri, namespaceText);
    assert.strictEqual(OpenAttributeName.fields.elementNamespace, namespaceText);
    assert.strictEqual(OpenAttributeName.fields.local, OpenLocal);
    assert.notMatch(OpenLocal.pattern.source, /\{\d*,\d+\}/u);
  });
});

/**
 * The trees the host's view is checked over: the one generator's, over the composed grammar.
 */
const documents = xdmDocument(grammar);

/**
 * The relations the folds read.
 */
const foldGrammar = foldGrammarOf(grammar);

/**
 * What the host's-view search must reach on its witnesses: closed and open attributes, two of one
 * open class on one element, and a foreign element.
 */
const reached = required<XdmFeature>(["attribute", "openName", "repeatedOpenClass", "wildcard"], {
  cases: 300,
  sense: notesOnly,
});

describe("qti/attributes.ts, the host's view", { timeout: searchTimeout }, () => {
  it.effect(
    "folds each element's attrs to the installed AttributeGrammar slots of its closed names under its governor, and to none of its open classes'",
    (ctx) =>
      // Oracle: a second implementation, `install.ts`'s re-keyed `GoverningOf` and
      // `AttributeGrammar` read by their rows, against folds.ts, which reads the composed
      // grammar's `admissionOf` (the kind's rows, or `GovernedAttribute`'s under a governor).
      // Bound: the generator's drawn bounds, up to 200 nodes a tree, 300 cases.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: reached,
            draw: drawn(documents),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "install.ts's GoverningOf and AttributeGrammar rows against folds.ts's admissionOf",
            },
            runs: 300,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "qti/attributes-host-attrs",
          },
          ({ document }, c) =>
            Effect.gen(function* hostAttrs() {
              c.noteAll(featuresOf(document));

              const rows = yield* Effect.orDie(
                Effect.fromResult(fold(document, idOf, foldGrammar)),
              );
              const byNode = Map.groupBy(rows.attributes, ({ node }) => node);

              for (const node of rows.nodes) {
                const governor = governing.get(`${node.version} ${node.kind} ${node.governs}`);
                const expected = new Set(
                  (byNode.get(node.id) ?? [])
                    .filter(({ name }) => !isOpen(name))
                    .map(({ name }) => slots.get(`${node.version} ${governor ?? ""} ${name}`)),
                );

                assert.isFalse(expected.has(undefined), `${node.kind}: a closed name no row holds`);
                assert.deepStrictEqual(
                  [...node.attrs].toSorted((a, b) => a - b),
                  [...expected].toSorted((a, b) => (a ?? 0) - (b ?? 0)),
                  `${node.version} ${node.kind} under ${node.governs}`,
                );
              }
            }),
        ),
      ),
  );
});

/**
 * A (version, governor) whose admitted names hold two closed names and two open classes, the
 * smallest alphabet in which every pattern of AL2's distinctness occurs: the first such in
 * `AttributeGrammar`'s rows.
 */
const alphabet = (() => {
  const families = Map.groupBy(attributeRows, ({ governor, version }) => `${version} ${governor}`);
  for (const rows of families.values()) {
    const closed = rows.filter(({ name }) => !isOpen(name)).slice(0, 2);
    const open = rows.filter(({ name }) => isOpen(name)).slice(0, 2);
    if (closed.length === 2 && open.length === 2) {
      const [first, ...rest] = [...closed, ...open].map(({ name, position }) => ({
        name,
        slot: Number(position),
      }));
      if (first !== undefined) {
        return [first, ...rest] as const;
      }
    }
  }

  return assert.fail("no (version, governor) admits two closed names and two open classes");
})();

/**
 * One attribute of the distinctness box: its name and its slot under the box's governor.
 */
type Letter = (typeof alphabet)[number];

/**
 * Judge a list of attributes by the database's statements over them, stated over the slots: the
 * `or` fold's step (`attrsAfter = attrsWas | slot`, the open classes stepped over when the step
 * selects), then `AL2_distinct`, `attrsWas ∩ slot = ∅`.
 *
 * @param letters - The attributes, in source order.
 * @param selects - Whether the fold's step selection leaves the open classes out: the statement as
 *   written; `false` is the mutant that drops it.
 * @returns Whether a row breaks `AL2_distinct`.
 */
const refused = (letters: readonly Letter[], selects: boolean): boolean => {
  let was = new Set<number>();
  for (const { name, slot } of letters) {
    if (was.has(slot)) {
      return true;
    }

    was = selects && isOpen(name) ? was : new Set([...was, slot]);
  }

  return false;
};

/**
 * Every list of at most 4 attributes over {@link alphabet}: the distinctness box.
 */
const lists: Gen<readonly Letter[]> = array(element<Letter>(alphabet), { max: 4, min: 0 });

/**
 * A situation the distinctness box must reach: each kind of list, and a list that tells the
 * mutant without the step selection apart from the statement as written.
 */
type DistinctSituation = "closed repeat" | "open repeat" | "distinct" | "mutant killed";

describe("qti/attributes.ts, AL2's distinctness", () => {
  it.effect(
    "refuses exactly a repeated closed name, and the mutant without the step selection refuses two attributes of one open class",
    (ctx) =>
      // Oracle: the specification as a checker, XML 1.0 §3.1's Unique Att Spec by name: a list is
      // refused exactly when a closed name repeats, since two open names of one class are two
      // names (OpenAttributeName's key judges those).
      // Bound: every list of at most 4 attributes over 2 closed names and 2 open classes, 341.
      searched(
        ctx,
        exhaust(
          {
            box: "every list of at most 4 attributes over 2 closed names and 2 open classes",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<DistinctSituation>([
              "closed repeat",
              "open repeat",
              "distinct",
              "mutant killed",
            ]),
            generator: lists,
            limit: 400,
            literal: (letters) => letters.map(({ name }) => name).join(" "),
            oracle: {
              kind: "specification",
              name: "XML 1.0 §3.1, Unique Att Spec, by closed name",
            },
            suite: "qti/attributes-al2-distinct",
          },
          (letters: readonly Letter[], c) =>
            Effect.sync(() => {
              const names = letters.map(({ name }) => name);
              const repeats = (open: boolean) =>
                names.some((name, at) => isOpen(name) === open && names.indexOf(name) !== at);
              const situation = (): DistinctSituation => {
                if (repeats(false)) {
                  return "closed repeat";
                }

                return repeats(true) ? "open repeat" : "distinct";
              };
              c.note(situation());

              assert.strictEqual(refused(letters, true), repeats(false), names.join(" "));
              if (refused(letters, false) !== repeats(false)) {
                c.note("mutant killed");
              }
            }),
        ),
      ),
  );
});

/**
 * Every (version, governor) that admits `coords`, with its domain's pattern as `ValueDomainOf`
 * installs it, read as a JavaScript host reads it (`patternFlags`).
 */
const coordsDomains = attributeRows
  .filter(({ name }) => name === "coords")
  .map(({ domain, governor, version }) => ({
    governor,
    pattern: Option.getOrThrow(
      Option.fromNullishOr(ValueDomainOf.rows.find((row) => row.domain === domain)?.pattern),
    ),
    version,
  }));

describe("qti/attributes.ts, coords", () => {
  it("judges coords by CoordsDType alone, so a rect with three coordinates and a circle with four are admitted (spec reading 59)", () => {
    // Oracle: the specification as a checker, `CoordsDType`'s pattern
    // (`imsqti_asiv3p0p1_v1p0.xsd` lines 24088 to 24092): three, four, or an even number of six or
    // more comma-separated non-negative integers or percentages, whatever the shape; reading 59
    // reads a count that does not fit its shape by HTML's image-map processing model.
    assert.isNotEmpty(coordsDomains);
    for (const { governor, pattern, version } of coordsDomains) {
      const matches = (value: string) => new RegExp(pattern, patternFlags).test(value);
      const at = `${version} ${governor}`;

      for (const value of ["1,2,3", "1,2,3,4", "0,0,10%", "1,2,3,4,5,6", "1,2,3,4,5,6,7,8"]) {
        assert.isTrue(matches(value), `${at} admits ${value}`);
      }

      for (const value of ["", "1,2", "1,2,3,4,5", "1, 2, 3", "1,2,3,", "-1,2,3", "1.5,2,3"]) {
        assert.isFalse(matches(value), `${at} refuses ${value}`);
      }
    }

    assert.isTrue(Arr.isReadonlyArrayNonEmpty(coordsDomains));
  });
});

/**
 * Collapse a value as XML Schema's `collapse` whitespace does (Part 2, §4.3.6): runs of XML
 * whitespace to one space, then the outer one removed.
 *
 * @param value - The value as written.
 * @returns The collapsed value.
 */
const collapse = (value: string): string => value.replaceAll(/[\t\n\r ]+/gu, " ").trim();

/**
 * Read an installed value domain's pattern as a JavaScript host reads it.
 *
 * @param domain - The domain's handle.
 * @returns A test of a lexical form against it; every form passes the open domain, which has no
 *   pattern to judge by beyond `xs:anySimpleType`'s.
 */
const patternOf = (domain: string): ((value: string) => boolean) => {
  const source = ValueDomainOf.rows.find((row) => row.domain === domain)?.pattern;
  if (source === undefined) {
    return assert.fail(`ValueDomainOf holds no pattern of ${domain}`);
  }

  const regex = new RegExp(source, patternFlags);

  return (value) => regex.test(value);
};

/**
 * The values each XLink attribute is judged over: empty and blank forms, NCNames and non-NCNames,
 * URI references, and every value of the three enumerations, a case or a space from them.
 */
const xlinkValues = [
  "",
  " ",
  "a",
  " a ",
  "a1",
  "_x",
  "1a",
  "x:y",
  "#f",
  "http://e.org/r",
  "simple",
  " simple ",
  "Simple",
  "simple extended",
  "extended",
  "title",
  "resource",
  "locator",
  "arc",
  "new",
  "replace",
  "embed",
  "other",
  "none",
  "onLoad",
  "onRequest",
  "onload",
] as const;

/**
 * The `xs:anyURI` domain as installed, which `hrefType` restricts with no facet: XLink's `role`
 * and `arcrole` are it with `minLength 1` (`xlink/xlink.xsd` lines 50 to 60).
 */
const anyUri = patternOf("xs:anyURI");

/**
 * Whether a collapsed value is an NCName, over the box's ASCII values.
 *
 * @param value - The value, collapsed.
 * @returns Whether it is a letter or `_`, then letters, digits, `.`, `-` or `_`.
 */
const isNcName = (value: string): boolean => /^[A-Z_a-z][\w.-]*$/u.test(value);

/**
 * XLink's ten global attributes as `xlink/xlink.xsd` types them (lines 29 to 105): the verdict on
 * a lexical form, by the attribute's local name. The three enumerations restrict `xs:token`, so a
 * form is read collapsed; `role` and `arcrole` are an `xs:anyURI` of at least one character after
 * that collapse; `label`, `from` and `to` an `xs:NCName`; `title` an `xs:string`.
 */
const xlinkSpec = {
  actuate: (value) => ["onLoad", "onRequest", "other", "none"].includes(collapse(value)),
  arcrole: (value) => collapse(value) !== "" && anyUri(value),
  from: (value) => isNcName(collapse(value)),
  href: anyUri,
  label: (value) => isNcName(collapse(value)),
  role: (value) => collapse(value) !== "" && anyUri(value),
  show: (value) => ["new", "replace", "embed", "other", "none"].includes(collapse(value)),
  title: () => true,
  to: (value) => isNcName(collapse(value)),
  type: (value) =>
    ["simple", "extended", "title", "resource", "locator", "arc"].includes(collapse(value)),
} as const satisfies Readonly<Record<string, (value: string) => boolean>>;

describe("qti/attributes.ts, XLink's globals (C30)", () => {
  it("reads each of XLink's ten attributes in the domain xlink.xsd gives it, on every governor that admits it, roleType's and arcroleType's minLength 1 included", () => {
    // Oracle: the specification as a checker, `xlink/xlink.xsd` lines 29 to 105 as `xlinkSpec`,
    // against `ValueDomainOf`'s pattern of each admitted name's domain, which value_domain matches
    // its lexical form against; a governor that reads a name under the open domain (a `skip`
    // wildcard) judges nothing.
    // Bound: the 27 values of `xlinkValues` for each of the 10 names on every (version, governor)
    // that admits it, exhausted.
    const admitted = attributeRows.filter(({ name }) => name.startsWith("xlink:"));
    const judged = new Set<string>();
    for (const { domain, governor, name, version } of admitted) {
      const local = name.slice("xlink:".length);
      const spec =
        Object.entries(xlinkSpec).find(([held]) => held === local)?.[1] ??
        assert.fail(`xlink.xsd declares no ${name}`);
      const installed = patternOf(domain);
      judged.add(local);
      for (const value of xlinkValues) {
        assert.strictEqual(
          installed(value),
          domain === openDomain.handle || spec(value),
          `${name} ${JSON.stringify(value)} on ${governor} in ${version}, read in ${domain}`,
        );
      }
    }

    assert.sameMembers([...judged], Object.keys(xlinkSpec));
  });
});

describe("qti/attributes.ts, a rubric block's view (spec reading 17)", () => {
  it("refuses an empty view on every rubric block, test rubrics included, and admits one or more of the six views; an outcome declaration's view, which no reading binds, admits the empty list", () => {
    // Oracle: the specification as a checker, reading 17 ("one or more of" the six views of the
    // information model's View enumeration) over `ValueDomainOf`'s pattern of each rubric
    // block's `view`; the XSD's list type alone, which admits length 0, as the control on
    // `qti-outcome-declaration`.
    // Bound: 9 forms on every (version, governor) that admits view, exhausted.
    const views = ["author", "candidate", "proctor", "scorer", "testConstructor", "tutor"];
    const forms = ["", "  ", "candidate", " candidate  tutor ", "student", "Candidate"];
    const rows = attributeRows.filter(({ name }) => name === "view");
    const governors = new Set(rows.map(({ governor }) => governor));

    assert.includeMembers([...governors], ["qti-rubric-block", "qti-rubric-block.test"]);
    for (const { domain, governor, version } of rows) {
      const installed = patternOf(domain);
      const rubric = governor.startsWith("qti-rubric-block");
      for (const form of [...forms, ...views]) {
        const tokens = collapse(form) === "" ? [] : collapse(form).split(" ");
        const listed = tokens.every((token) => views.includes(token));
        assert.strictEqual(
          installed(form),
          listed && (!rubric || tokens.length > 0),
          `${governor} view ${JSON.stringify(form)} in ${version}`,
        );
      }
    }
  });
});

/**
 * The grammar shred reads the prefix and NOTATION documents through, and the oracle's tables.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The oracle's tables over the composed grammar.
 */
const oracleLaws = lawsOf(grammar);

/**
 * Shred a document's bytes in a version and fold its rows.
 *
 * @param text - The document.
 * @param version - Its version.
 * @returns Its folded rows; dies on a refusal, which no document here meets.
 */
const foldedOf = (text: string, version: (typeof schemaVersions)[number]) =>
  Effect.gen(function* folded() {
    const read = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
    const tree = yield* Effect.orDie(shred(read, version, shredGrammar));

    return yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammar)));
  });

/**
 * Name the laws a document's rows break, by the oracle.
 *
 * @param rows - The rows.
 * @returns The laws, once each.
 */
const lawsBroken = (rows: FoldedRows<Composed>): ReadonlySet<string> =>
  new Set(documentBreaches("a.xml", rows, oracleLaws).map(({ law }) => law));

/**
 * An item whose root carries a closed name in no namespace, `title`, which the prefix box rewrites
 * to each name and prefix.
 */
const plainItem = `<qti-assessment-item xmlns="${asiNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"/>`;

/**
 * The names of the prefix box, each with the namespace its name is in: a closed name in no
 * namespace, the XML namespace's, XML Schema's instance namespace's and XLink's, and each open
 * class, `own-namespace` and `foreign` in a namespace.
 */
const prefixNames = [
  ["title", "none"],
  ["xml:lang", "xml"],
  ["xsi:schemaLocation", "other"],
  ["xlink:href", "other"],
  ["data-*", "none"],
  ["no-namespace", "none"],
  ["own-namespace", "other"],
  ["foreign", "other"],
] as const;

/**
 * The prefixes of the box: none, the two Namespaces in XML reserves, the handles' own, and one a
 * document may bind to a namespace of its choosing.
 */
const prefixes = ["", "xml", "xmlns", "xsi", "xlink", "zs"] as const;

describe("qti/attributes.ts, the attribute prefix (C54)", () => {
  it.effect(
    "breaks law Attribute prefix exactly where a prefix disagrees with its name's namespace: every name class with every prefix",
    () =>
      // Oracle: the specification as a checker, Namespaces in XML 1.0 §6.2 (an unprefixed
      // attribute is in no namespace, a prefixed one in its prefix's) and §3 (`xml` is bound to
      // the XML namespace and no other prefix is; `xmlns` declares only), as the table below.
      // Bound: the 8 name classes of `prefixNames` with the 6 prefixes of `prefixes`, 48 rows.
      Effect.gen(function* prefixBox() {
        const rows = yield* foldedOf(plainItem, "3.0.1");
        const target =
          rows.attributes.find(({ name }) => name === "title") ??
          assert.fail("the item carries its title");
        for (const [name, namespace] of prefixNames) {
          for (const prefix of prefixes) {
            const valid = {
              none: prefix === "",
              other: !["", "xml", "xmlns"].includes(prefix),
              xml: prefix === "xml",
            }[namespace];
            const tampered: FoldedRows<Composed> = {
              ...rows,
              attributes: rows.attributes.map((attribute) =>
                attribute === target ? { ...attribute, name, prefix } : attribute,
              ),
            };

            assert.strictEqual(
              lawsBroken(tampered).has("Attribute prefix"),
              !valid,
              `${name} written with ${JSON.stringify(prefix)}`,
            );
          }
        }
      }),
  );
});

/**
 * An item whose body holds one paragraph carrying the attribute `data-x`, which the data name box
 * rewrites to each class, host and local name.
 */
const dataItem = `<qti-assessment-item xmlns="${asiNamespace}" identifier="i" title="t" adaptive="false" time-dependent="false"><qti-item-body><p data-x="1">t</p></qti-item-body></qti-assessment-item>`;

describe("qti/attributes.ts, the data name (reading 13)", () => {
  it.effect(
    "breaks law AL4 data name on a data-* name outside reading 13's language and on a no-namespace data- name of an element that is not foreign, and on no name of the language",
    () =>
      // Oracle: the specification as a checker, reading 13 of `docs/spec-readings.md`: HTML's
      // custom data attribute rule read in XML, `data-` and one or more name characters with no
      // ASCII upper-case letter, and a no-namespace `data-` name of an element that is not foreign
      // is `data-*` or refused (a foreign element's is `no-namespace`).
      // Bound: the four cases of the brief, written out.
      Effect.gen(function* dataNameBox() {
        const rows = yield* foldedOf(dataItem, "3.0.1");
        const target =
          rows.attributes.find(({ name }) => name === "data-*") ??
          assert.fail("the paragraph carries its data-x");
        const host =
          rows.nodes.find(({ id }) => id === target.node) ?? assert.fail("the paragraph is a node");
        const cases = [
          { broken: true, class: "data-*", kind: host.kind, local: "data-A" },
          { broken: true, class: "no-namespace", kind: host.kind, local: "data-x" },
          { broken: false, class: "data-*", kind: host.kind, local: "data-x" },
          { broken: false, class: "no-namespace", kind: "foreign-element", local: "data-x" },
        ] as const;

        for (const { broken, class: name, kind, local } of cases) {
          const tampered: FoldedRows<Composed> = {
            ...rows,
            attributes: rows.attributes.map((attribute) =>
              attribute === target ? { ...attribute, name } : attribute,
            ),
            nodes: rows.nodes.map((node) => (node === host ? { ...node, kind } : node)),
            openNames: rows.openNames.map((open) =>
              open.attribute === target.id ? { ...open, local } : open,
            ),
          };

          assert.strictEqual(
            lawsBroken(tampered).has("AL4 data name"),
            broken,
            `${name} ${local} on ${kind}`,
          );
        }
      }),
  );
});

describe("qti/attributes.ts, a declared data- name (goal part E)", () => {
  it.effect(
    "breaks law AL4 declared data name on a data-* attribute named for a data- name its element declares, and on no other data-* name or host",
    () =>
      // Oracle: the specification as a checker, goal part E: a data- name QTI declares on an
      // element is that attribute, never a custom one; `p` declares `data-catalog-idref` and
      // `qti-assessment-item` does not (the XSDs, read through `AttributeGrammar.rows`).
      // Bound: the three cases of the brief, written out.
      Effect.gen(function* declaredDataNameBox() {
        const rows = yield* foldedOf(dataItem, "3.0.1");
        const target =
          rows.attributes.find(({ name }) => name === "data-*") ??
          assert.fail("the paragraph carries its data-x");
        const host =
          rows.nodes.find(({ id }) => id === target.node) ?? assert.fail("the paragraph is a node");
        const cases = [
          { broken: true, kind: host.kind, local: "data-catalog-idref" },
          { broken: false, kind: "qti-assessment-item", local: "data-catalog-idref" },
          { broken: false, kind: host.kind, local: "data-x" },
        ] as const;

        for (const { broken, kind, local } of cases) {
          const tampered: FoldedRows<Composed> = {
            ...rows,
            nodes: rows.nodes.map((node) => (node === host ? { ...node, kind } : node)),
            openNames: rows.openNames.map((open) =>
              open.attribute === target.id ? { ...open, local } : open,
            ),
          };

          assert.strictEqual(
            lawsBroken(tampered).has("AL4 declared data name"),
            broken,
            `${local} on ${kind}`,
          );
        }
      }),
  );
});

/**
 * A test whose section's `qti-selection` holds one foreign element under its `lax` `##other`
 * wildcard, its `xsi:type` naming a built-in type, and a text.
 *
 * @param type - The built-in type's local name.
 * @param text - The element's text.
 * @returns The document.
 */
const typedForeign = (type: string, text: string): string =>
  `<qti-assessment-test xmlns="${asiNamespace}" xmlns:f="urn:f" xmlns:xsi="${xsiNamespace}" xmlns:xs="${xsNamespace}" identifier="t" title="t"><qti-test-part identifier="p" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="s" title="s" visible="true"><qti-selection select="1"><f:x xsi:type="xs:${type}">${text}</f:x></qti-selection><qti-assessment-item-ref identifier="i" href="i.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

describe("qti/attributes.ts, xs:NOTATION's empty domain (C47)", () => {
  it.effect(
    "breaks TextDomain on a foreign element governed by xs:NOTATION whatever its text, and on none governed by xs:string: every text of the box in both versions",
    () =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 2 §3.2.19 ("The value space of
      // NOTATION is the set of QNames of notations declared in the current schema") with no
      // notation in any pinned XSD, so no text is in it; `xs:string`, whose value space holds
      // every string, as the control (§3.2.1).
      // Bound: 5 texts under the 2 types in the 2 versions, 20 documents, exhausted.
      Effect.gen(function* notationBox() {
        for (const version of schemaVersions) {
          for (const text of ["", "a", "q:a", " notation ", "x-1"]) {
            for (const type of ["NOTATION", "string"]) {
              const rows = yield* foldedOf(typedForeign(type, text), version);

              assert.strictEqual(
                lawsBroken(rows).has("TextDomain"),
                type === "NOTATION",
                `xs:${type} holding ${JSON.stringify(text)} in ${version}`,
              );
            }
          }
        }
      }),
  );
});
