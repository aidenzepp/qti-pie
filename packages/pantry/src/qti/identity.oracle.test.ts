/**
 * The identity overlays' free tests: their statements build beside the layers they read, each check
 * is named by an oracle law, and the ID law `E1_derived` pins one value per lexical form, the one
 * XML Schema's whitespace collapse gives an `xs:NCName`.
 *
 * The database tests (`identity.db.test.ts`) judge the laws through PostgreSQL, and the builder's
 * tests (`#pantry/import/overlays/identity.test.ts`) its rows.
 */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, boolean, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { attributeLaws } from "#pantry/qti/attributes.ts";
import { chardataLaws } from "#pantry/qti/chardata.ts";
import { identityLaws, identityRelations, idValuePattern } from "#pantry/qti/identity.ts";
import { nodeLaws } from "#pantry/qti/node.ts";
import { qtiRelations } from "#pantry/qti/base.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawNames, lawsOf, ruleOf } from "#pantry/test/oracle.ts";

/**
 * How long building a schema over every relation of the schema may take: its statements are planned
 * whole, which takes some seconds beside the composed grammar.
 * Measured 2026-11-07: 16.7 s at a load average of 63 to 73.
 */
const buildTimeout = 60_000;

describe("qti/identity.ts, declared", { timeout: buildTimeout }, () => {
  it("builds a schema of Node, the character data, the attribute layer and the identity overlays with every law, each statement once", () => {
    const built = schema("IdentityLayer", { ...qtiRelations, ...identityRelations }, [
      ...nodeLaws,
      ...chardataLaws,
      ...attributeLaws,
      ...identityLaws,
    ]);

    for (const relation of Object.values(identityRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(built.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(identityLaws).size, identityLaws.length);
    assert.strictEqual(
      built.statements.length,
      nodeLaws.length + chardataLaws.length + attributeLaws.length + identityLaws.length,
    );
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = identityLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
      if (law !== undefined) {
        assert.strictEqual(ruleOf(law), "derived", name);
      }
    }

    assert.deepStrictEqual([...new Set(named)], ["E1 derived"]);
    assert.isDefined(lawNames.find((known) => known === "Label tools"));
    assert.strictEqual(ruleOf("Label tools"), "label-tool");
    assert.strictEqual(ruleOf("DocumentId key"), "document-key");
    assert.strictEqual(ruleOf("Idref target"), "idref-target");
    assert.strictEqual(ruleOf("Document lang"), "document-lang");
  });
});

/**
 * XML whitespace `S`, as `DocumentId.before` and `after` are typed.
 */
const space = /^[\t\n\r ]*$/u;

/**
 * An ID's value as `E1_derived` reads it, `idValuePattern` under the `u` flag grizzle compiles
 * every pattern with.
 */
const value = new RegExp(idValuePattern, "u");

/**
 * Every way `DocumentId`'s `E1_derived` admits a lexical form as `before ‖ id ‖ after`: the
 * statement as written, restated on the host, or, as the mutant, without its `id` pattern.
 *
 * @param lexical - The lexical form.
 * @param patterned - Whether `id` must match `idValuePattern`: the statement; `false` is the
 *   mutant that drops it.
 * @returns Each admitted split, as `before|id|after`.
 */
const splitsOf = (lexical: string, patterned: boolean): readonly string[] => {
  const splits: string[] = [];
  for (let cut = 0; cut <= lexical.length; cut += 1) {
    for (let end = cut; end <= lexical.length; end += 1) {
      const before = lexical.slice(0, cut);
      const id = lexical.slice(cut, end);
      const after = lexical.slice(end);
      if (space.test(before) && space.test(after) && (!patterned || value.test(id))) {
        splits.push(`${before}|${id}|${after}`);
      }
    }
  }

  return splits;
};

/**
 * The characters of the split box: a name character, a space and a tab.
 */
const characters = ["a", " ", "\t"] as const;

/**
 * Every lexical form of at most 4 characters over {@link characters}: the split box.
 */
const lexicals: Gen<readonly string[]> = array(element<string>(characters), { max: 4, min: 0 });

/**
 * A situation the split box must reach: a form with one value, padded or not; a form with none;
 * and a form that tells the mutant without the `id` pattern apart.
 */
type SplitSituation = "bare value" | "padded value" | "no value" | "mutant killed";

describe("qti/identity.ts, an ID's value", () => {
  it.effect(
    "admits exactly one split of a form whose whitespace-collapsed value is one run, its value that run, and none of any other form",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema 1.0 Part 2 §4.3.6 whiteSpace collapse
      // over an xs:ID (an xs:NCName, which holds no whitespace): the value is the form with its
      // leading and trailing whitespace removed, and a form whose remainder holds whitespace or
      // is empty has no NCName value.
      // Bound: every form of at most 4 characters over a name character, a space and a tab, 121.
      searched(
        ctx,
        exhaust(
          {
            box: "every lexical form of at most 4 characters over a, space and tab",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<SplitSituation>([
              "bare value",
              "padded value",
              "no value",
              "mutant killed",
            ]),
            generator: lexicals,
            limit: 200,
            literal: (chars) => JSON.stringify(chars.join("")),
            oracle: {
              kind: "specification",
              name: "XML Schema 1.0 Part 2 §4.3.6, whiteSpace collapse of an xs:NCName",
            },
            suite: "qti/identity-id-split",
          },
          (chars: readonly string[], c) =>
            Effect.sync(() => {
              const lexical = chars.join("");
              const trimmed = lexical.replace(/^[\t\n\r ]+/u, "").replace(/[\t\n\r ]+$/u, "");
              const expected =
                trimmed !== "" && !/[\t\n\r ]/u.test(trimmed)
                  ? [
                      `${lexical.slice(0, lexical.indexOf(trimmed))}|${trimmed}|${lexical.slice(
                        lexical.indexOf(trimmed) + trimmed.length,
                      )}`,
                    ]
                  : [];
              const situation = (): SplitSituation => {
                if (expected.length === 0) {
                  return "no value";
                }

                return trimmed === lexical ? "bare value" : "padded value";
              };
              c.note(situation());

              assert.deepStrictEqual(splitsOf(lexical, true), expected, JSON.stringify(lexical));
              if (splitsOf(lexical, false).length !== expected.length) {
                c.note("mutant killed");
              }
            }),
        ),
      ),
  );
});

/**
 * The tables the oracle's laws read, derived from the installed grammar once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3.0 assessment namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * One choice of the label box: whether the item's root carries `tool-name`, `tool-version` and a
 * `label` of its own, whether a paragraph of its body carries one, and the schema version its
 * manifest names.
 */
interface LabelCase {
  readonly bodyLabel: boolean;
  readonly rootLabel: boolean;
  readonly toolName: boolean;
  readonly toolVersion: boolean;
  readonly version: "3.0.0" | "3.0.1";
}

/**
 * Every choice of the label box.
 */
const labelCases: Gen<LabelCase> = (source) => ({
  bodyLabel: source.draw(boolean),
  rootLabel: source.draw(boolean),
  toolName: source.draw(boolean),
  toolVersion: source.draw(boolean),
  version: source.draw(element(["3.0.0", "3.0.1"] as const)),
});

/**
 * Write a one-item package for a label case: the manifest naming the item, and an item whose body
 * is one paragraph.
 *
 * @param drawn - The case.
 * @returns The package's entries, as `readPackage` reads them.
 */
const labelPackage = (drawn: LabelCase): readonly PackageFile[] => {
  const root = [
    `xmlns="${asi}" identifier="item" title="Item" time-dependent="false"`,
    drawn.toolName ? 'tool-name="t"' : "",
    drawn.toolVersion ? 'tool-version="1"' : "",
    drawn.rootLabel ? 'label="root"' : "",
  ].join(" ");
  const files = {
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${drawn.version}</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item ${root}><qti-item-body><p${drawn.bodyLabel ? ' label="x"' : ""}>Hi</p></qti-item-body></qti-assessment-item>`,
  };

  return Object.entries(files).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));
};

/**
 * A situation the label box must reach: each way the law holds or breaks, and each version's
 * root label with no tool named.
 */
type LabelSituation =
  | "unlabelled"
  | "root label only"
  | "named tool"
  | "unnamed tool"
  | "3.0.0 root label, unnamed tool"
  | "3.0.1 root label, unnamed tool";

describe("test/oracle.ts, Label tools", { timeout: buildTimeout }, () => {
  it.effect(
    "breaks once at each labelled element, the paragraph in either version and the root in 3.0.1, exactly when its root lacks tool-name or tool-version",
    (ctx) =>
      // Oracle: the specification as a checker, the information model's label characteristic
      // (§5.16.5: "If an item uses labels then values for the associated toolName and toolVersion
      // characteristics must also be provided") in both versions, and the item's own label in
      // 3.0.1 alone (3.0.1 §4.1.3 says the same of it; 3.0.0 §4.1.3 calls it "A human readable
      // label" and asks for nothing; spec reading 128).
      // Bound: every item of one labelled or unlabelled paragraph, with or without a root label,
      // tool-name and tool-version, under each version, 32.
      searched(
        ctx,
        exhaust(
          {
            box: "every item of one paragraph, each of its body label, root label, tool-name and tool-version present or absent, in 3.0.0 or 3.0.1",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<LabelSituation>([
              "unlabelled",
              "root label only",
              "named tool",
              "unnamed tool",
              "3.0.0 root label, unnamed tool",
              "3.0.1 root label, unnamed tool",
            ]),
            generator: labelCases,
            limit: 40,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "the information model's label characteristic, §5.16.5, and 3.0.1's §4.1.3",
            },
            suite: "test/oracle-label-tools",
          },
          (drawn: LabelCase, c) =>
            Effect.gen(function* labelTools() {
              const named = drawn.toolName && drawn.toolVersion;
              const situation = (): LabelSituation => {
                if (!drawn.bodyLabel) {
                  return drawn.rootLabel ? "root label only" : "unlabelled";
                }

                return named ? "named tool" : "unnamed tool";
              };
              c.note(situation());
              if (drawn.rootLabel && !named) {
                c.note(`${drawn.version} root label, unnamed tool`);
              }

              const judgment = yield* judge(labelPackage(drawn), grammar, laws);
              const breaches =
                judgment._tag === "Judged"
                  ? judgment.breaches.filter(({ law }) => law === "Label tools")
                  : assert.fail(`the codec refused the package: ${judgment.rule}`);

              assert.deepStrictEqual(
                breaches
                  .map(({ document, keys }) => `${document} ${keys["kind"] ?? ""}`)
                  .toSorted(),
                named
                  ? []
                  : [
                      ...(drawn.rootLabel && drawn.version === "3.0.1"
                        ? ["item.xml qti-assessment-item"]
                        : []),
                      ...(drawn.bodyLabel ? ["item.xml p"] : []),
                    ].toSorted(),
                JSON.stringify(drawn),
              );
            }),
        ),
      ),
  );
});

/**
 * The QTI 3.0 content packaging namespace of a manifest.
 */
const cp = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * Write a package's entries from their texts, as `readPackage` reads them.
 *
 * @param files - Each entry's text by its path, the manifest at `imsmanifest.xml`.
 * @returns The entries.
 */
const packageOf = (files: Readonly<Record<string, string>>): readonly PackageFile[] =>
  Object.entries(files).map(([path, text]): PackageFile => ({
    bytes: new TextEncoder().encode(text),
    kind: path === "imsmanifest.xml" ? "manifest" : "file",
    path,
  }));

/**
 * One child of a custom interaction in the identity-text box: a foreign element whose `xsi:type`
 * makes its text an ID or an IDREF, and the text.
 */
interface TypedChild {
  readonly type: "xs:ID" | "xs:IDREF";
  readonly value: "a" | "b";
}

/**
 * Every child choice of the identity-text box: an ID `a`, an ID `b`, and an IDREF to `a`.
 */
const typedChildren: Gen<TypedChild> = element<TypedChild>([
  { type: "xs:ID", value: "a" },
  { type: "xs:ID", value: "b" },
  { type: "xs:IDREF", value: "a" },
]);

/**
 * Write the path of the identity-text box's custom interaction at a slot of its `div`.
 *
 * @param parent - The slot.
 * @returns The path, as a breach's `node` key writes it.
 */
const at = (parent: number): string =>
  `/qti-assessment-item[0]/qti-item-body[1]/div[0]/qti-custom-interaction[${String(parent)}]`;

/**
 * Every case of the identity-text box: two custom interactions, each of at most 2 children.
 */
const typedCases: Gen<readonly (readonly TypedChild[])[]> = array(
  array(typedChildren, { max: 2, min: 0 }),
  { max: 2, min: 2 },
);

/**
 * A situation the identity-text box must reach: each way the two laws hold or break.
 */
type TypedSituation =
  | "one id twice under one parent"
  | "one id under two parents"
  | "a reference resolved"
  | "a reference dangling";

describe(
  "test/oracle.ts, DocumentId key and Idref target over typed texts (C50)",
  { timeout: buildTimeout },
  () => {
    it.effect(
      "breaks DocumentId key exactly where one id is purported by two parents, and Idref target exactly where a text's IDREF names no id",
      (ctx) =>
        // Oracle: the specification as a checker, XML Schema 1.0 Part 1 §3.15.5 and cvc-id (reading
        // 101): an element text's ID is bound to its parent, no id's binding has two members, and an
        // IDREF names an id of its document.
        // Bound: every pair of custom interactions, each of at most 2 foreign children over an ID
        // `a`, an ID `b` and an IDREF to `a`, 169.
        searched(
          ctx,
          exhaust(
            {
              box: "every two custom interactions of at most 2 xsi:typed foreign children over ID a, ID b and IDREF a",
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<TypedSituation>([
                "one id twice under one parent",
                "one id under two parents",
                "a reference resolved",
                "a reference dangling",
              ]),
              generator: typedCases,
              limit: 200,
              literal: (drawn) => JSON.stringify(drawn),
              oracle: { kind: "specification", name: "XML Schema 1.0 Part 1 §3.15.5, cvc-id" },
              suite: "test/oracle-typed-ids",
            },
            (drawn, c) =>
              Effect.gen(function* typedIds() {
                const interactions = drawn.map(
                  (children) =>
                    `<qti-custom-interaction response-identifier="RESPONSE">${children
                      .map(
                        (child) =>
                          `<x:e xmlns:x="urn:x" xsi:type="${child.type}">${child.value}</x:e>`,
                      )
                      .join("")}</qti-custom-interaction>`,
                );
                const files = packageOf({
                  "imsmanifest.xml": `<manifest xmlns="${cp}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/></resource></resources></manifest>`,
                  "item.xml": `<qti-assessment-item xmlns="${asi}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" identifier="item" title="Item" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><div>${interactions.join("")}</div></qti-item-body></qti-assessment-item>`,
                });
                const owners = (id: string) =>
                  drawn.flatMap((children, parent) =>
                    children.some((child) => child.type === "xs:ID" && child.value === id)
                      ? [parent]
                      : [],
                  );
                const ids = new Set(
                  drawn.flatMap((children) =>
                    children.filter(({ type }) => type === "xs:ID").map((child) => child.value),
                  ),
                );
                const expectedKey = ["a", "b"].flatMap((id) =>
                  owners(id)
                    .slice(1)
                    .map((parent) => `${id} ${at(parent)}`),
                );
                const expectedTargets = drawn.flatMap((children, parent) =>
                  children.flatMap((child, slot) =>
                    child.type === "xs:IDREF" && !ids.has(child.value)
                      ? [`${child.value} ${at(parent)}/foreign-element[${String(slot)}]`]
                      : [],
                  ),
                );

                if (
                  drawn.some(
                    (children) =>
                      children.filter((child) => child.type === "xs:ID" && child.value === "a")
                        .length > 1,
                  )
                ) {
                  c.note("one id twice under one parent");
                }

                if (expectedKey.length > 0) {
                  c.note("one id under two parents");
                }

                if (drawn.some((children) => children.some(({ type }) => type === "xs:IDREF"))) {
                  c.note(
                    expectedTargets.length > 0 ? "a reference dangling" : "a reference resolved",
                  );
                }

                const judgment = yield* judge(files, grammar, laws);
                const breaches =
                  judgment._tag === "Judged"
                    ? judgment.breaches
                    : assert.fail(`the codec refused the package: ${judgment.rule}`);

                assert.deepStrictEqual(
                  breaches
                    .filter(({ law }) => law === "DocumentId key")
                    .map(({ keys }) => `${keys["id"] ?? ""} ${keys["node"] ?? ""}`)
                    .toSorted(),
                  expectedKey.toSorted(),
                  JSON.stringify(drawn),
                );
                assert.deepStrictEqual(
                  breaches
                    .filter(({ law }) => law === "Idref target")
                    .map(({ keys }) => `${keys["token"] ?? ""} ${keys["node"] ?? ""}`)
                    .toSorted(),
                  expectedTargets.toSorted(),
                  JSON.stringify(drawn),
                );
              }),
          ),
        ),
    );
  },
);

/**
 * One choice of the Document lang box: the item root's `xml:lang`, whether its resource names it
 * by `href` (else by its one file, which names no document under reading 93), and the languages
 * of each general category of the resource's record.
 */
interface DocumentLangCase {
  readonly generals: readonly (readonly string[])[];
  readonly href: boolean;
  readonly rootLang: Option.Option<string>;
}

/**
 * The LOM languages a general category of the Document lang box lists: `en`, `fr`, `EN` (`en` in
 * another case) and ` en ` (`en` padded, an `xs:string` whose spaces are part of its value, so no
 * language tag: spec reading 134).
 */
const lomLanguages = ["en", "fr", "EN", " en "] as const;

/**
 * Every choice of the Document lang box: no `xml:lang`, `en`, ` EN` (`en` padded and in another
 * case) or the empty one; an `href` or none; and at most 2 general categories, each listing at most
 * one of {@link lomLanguages}.
 */
const documentLangCases: Gen<DocumentLangCase> = (source) => ({
  generals: source.draw(
    array(array(element(lomLanguages), { max: 1, min: 0 }), { max: 2, min: 0 }),
  ),
  href: source.draw(boolean),
  rootLang: source.draw(
    element([Option.none(), Option.some("en"), Option.some(" EN"), Option.some("")]),
  ),
});

/**
 * Read a language tag as BCP 47 compares it: its ASCII capitals as small letters (RFC 5646
 * §2.1.1), a tag's subtags being ASCII (§2.1).
 *
 * @param tag - The tag as written.
 * @returns The folded tag.
 */
const foldedTag = (tag: string): string => tag.replaceAll(/[A-Z]/gu, (c) => c.toLowerCase());

/**
 * Read an `xml:lang` form as BCP 47 compares it: its form collapsed (an `xs:language`'s whiteSpace,
 * XML Schema Part 2, §4.3.6), then folded ({@link foldedTag}).
 *
 * @param form - The form as written.
 * @returns The tag the form names.
 */
const tagOf = (form: string): string =>
  foldedTag(
    form
      .replaceAll(/[\t\n\r ]+/gu, " ")
      .replace(/^ /u, "")
      .replace(/ $/u, ""),
  );

/**
 * A situation the Document lang box must reach: each way R26 holds or breaks.
 */
type DocumentLangSituation =
  | "listed by every category"
  | "missing from a category"
  | "no general category"
  | "named by no href"
  | "no language stated"
  | "listed in another case"
  | "listed padded";

describe("test/oracle.ts, Document lang (R26)", { timeout: buildTimeout }, () => {
  it.effect(
    "breaks once, at the item, exactly when its xml:lang states a language that a general category of its resource's record does not list",
    (ctx) =>
      // Oracle: the specification as a checker, QTI 3.0 Metadata §2.7.1.3 ("There must be one
      // value for each of the languages referred to by the language attributes on the associated
      // assessmentItem, test or object bank and its 'bodyElements'"), over a resource that names
      // its item by href (reading 93), an xml:lang by its collapsed value, the empty one stating
      // none (XML 1.0 §2.12), compared with each listed language as a tag, without regard to case
      // (RFC 5646 §2.1.1); a LOM language is an xs:string, read as written, so one with spaces
      // around it is no tag ("Whitespace is not permitted in a language tag", §2.1; reading 134).
      // Bound: every item root xml:lang of 4, href or none, and at most 2 categories of at most
      // one of en, fr, EN and padded en, 248.
      searched(
        ctx,
        exhaust(
          {
            box: "every item xml:lang of none, en, padded EN and empty, named by href or not, beside at most 2 general categories of at most one of en, fr, EN and padded en",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<DocumentLangSituation>([
              "listed by every category",
              "missing from a category",
              "no general category",
              "named by no href",
              "no language stated",
              "listed in another case",
              "listed padded",
            ]),
            generator: documentLangCases,
            limit: 300,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: { kind: "specification", name: "QTI 3.0 Metadata §2.7.1.3, Language" },
            suite: "test/oracle-document-lang",
          },
          (drawn: DocumentLangCase, c) =>
            Effect.gen(function* documentLang() {
              const generals = drawn.generals
                .map(
                  (langs) =>
                    `<imsmd:general>${langs.map((lang) => `<imsmd:language>${lang}</imsmd:language>`).join("")}</imsmd:general>`,
                )
                .join("");
              const files = packageOf({
                "imsmanifest.xml": `<manifest xmlns="${cp}" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0"${drawn.href ? ' href="item.xml"' : ""}><metadata><imsmd:lom>${generals}</imsmd:lom></metadata><file href="item.xml"/></resource></resources></manifest>`,
                "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"${Option.match(drawn.rootLang, { onNone: () => "", onSome: (lang) => ` xml:lang="${lang}"` })}><qti-item-body><p>Hi</p></qti-item-body></qti-assessment-item>`,
              });
              const stated = tagOf(Option.getOrElse(drawn.rootLang, () => ""));
              const breaks =
                drawn.href &&
                stated !== "" &&
                drawn.generals.some((langs) => !langs.map(foldedTag).includes(stated));
              const situation = (): DocumentLangSituation => {
                if (!drawn.href) {
                  return "named by no href";
                }

                if (stated === "") {
                  return "no language stated";
                }

                if (drawn.generals.length === 0) {
                  return "no general category";
                }

                return breaks ? "missing from a category" : "listed by every category";
              };
              c.note(situation());
              if (drawn.href && stated === "en") {
                const listed = new Set(drawn.generals.flat());
                if (listed.has("EN") && Option.contains(drawn.rootLang, "en")) {
                  c.note("listed in another case");
                }

                if (listed.has(" en ")) {
                  c.note("listed padded");
                }
              }

              const judgment = yield* judge(files, grammar, laws);
              const breaches =
                judgment._tag === "Judged"
                  ? judgment.breaches.filter(({ law }) => law === "Document lang")
                  : assert.fail(`the codec refused the package: ${judgment.rule}`);

              assert.deepStrictEqual(
                breaches.map(({ document, keys }) => `${document} ${keys["lang"] ?? ""}`),
                breaks ? [`item.xml ${Option.getOrElse(drawn.rootLang, () => "")}`] : [],
                JSON.stringify(drawn),
              );
            }),
        ),
      ),
  );
});

/**
 * One choice of the SSML box: the first `speak`'s `startmark` and the names of its marks, whether a
 * second `speak` defines `a b` too, and where the `lexicon` the first `speak`'s `lookup` names is.
 * A name is written as XML writes it, so `&#9;` is a tab in its lexical form, which attribute-value
 * normalization would otherwise make a space.
 */
interface SsmlLawCase {
  readonly lookup: "none" | "own" | "other";
  readonly markElsewhere: boolean;
  readonly marks: readonly string[];
  readonly startmark: Option.Option<string>;
}

/**
 * The names the SSML box writes: one `xsd:token`, `a b`, in three lexical forms, an inner run and
 * outer whitespace with a tab among them, and another name, `ab`.
 */
const markNames = ["a b", "a  b", " a&#9;b ", "ab"] as const;

/**
 * Every choice of the SSML box: a `startmark` of none or one of {@link markNames}, and at most 2
 * marks over the two inner forms of `a b` and `ab`.
 */
const ssmlLawCases: Gen<SsmlLawCase> = (source) => ({
  lookup: source.draw(element(["none", "own", "other"] as const)),
  markElsewhere: source.draw(boolean),
  marks: source.draw(array(element(["a b", "a  b", "ab"] as const), { max: 2, min: 0 })),
  startmark: source.draw(
    element([Option.none(), ...markNames.map((name) => Option.some<string>(name))]),
  ),
});

/**
 * Read a mark name as SSML compares it: its value, the lexical form collapsed (`xsd:token`'s
 * whiteSpace, XML Schema Part 2 §4.3.6), `&#9;` read as the tab it writes.
 *
 * @param written - The name as the box writes it.
 * @returns Its value.
 */
const markValueOf = (written: string): string =>
  written
    .replaceAll("&#9;", "\t")
    .replaceAll(/[\t\n\r ]+/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * A situation the SSML box must reach: each way the two laws hold or break, a trim that names its
 * mark in another lexical form, and a fragment that defines one name in two forms.
 */
type SsmlLawSituation =
  | "trim to a mark defined once"
  | "trim to a mark defined twice"
  | "trim to a mark of another speak"
  | "trim to a mark written otherwise"
  | "one name in two forms"
  | "lookup in its own speak"
  | "lookup across speaks";

describe(
  "test/oracle.ts, SSML trim mark and SSML lexicon reference (reading 3)",
  { timeout: buildTimeout },
  () => {
    it.effect(
      "breaks SSML trim mark exactly where a startmark names a mark its own speak defines other than once, names compared collapsed, and SSML lexicon reference exactly where a lookup's lexicon is in another speak",
      (ctx) =>
        // Oracle: the specification as a checker, SSML 1.1 §3.1.1.1 ("Only markers defined once in
        // the document, i.e. that are unique, are permitted as the value of either startmark or
        // endmark") and §3.1.5.1 ("The scope of this name is the current SSML document"), read
        // under spec reading 3: "the document" is each speak fragment, a name compared by its
        // value, collapsed (`mark@name`, `startmark` and `endmark` are `xsd:token`s, SSML 1.1
        // §3.3.2, whose whiteSpace is collapse, XML Schema Part 2 §4.3.6), so `a  b` and `a b` are
        // one name.
        // Bound: every first speak of 5 startmarks, at most 2 marks over 3 names and 3 lookups,
        // beside a second speak that defines `a b` or not, 390.
        searched(
          ctx,
          exhaust(
            {
              box: "every two speaks: the first of 5 startmarks, at most 2 marks over a b, a  b and ab, and 3 lookups, the second defining a b or not",
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<SsmlLawSituation>([
                "trim to a mark defined once",
                "trim to a mark defined twice",
                "trim to a mark of another speak",
                "trim to a mark written otherwise",
                "one name in two forms",
                "lookup in its own speak",
                "lookup across speaks",
              ]),
              generator: ssmlLawCases,
              limit: 400,
              literal: (drawn) => JSON.stringify(drawn),
              oracle: {
                kind: "specification",
                name: "SSML 1.1 §3.1.1.1, §3.1.5.1 and §3.3.2, reading 3",
              },
              suite: "test/oracle-ssml-fragment",
            },
            (drawn: SsmlLawCase, c) =>
              Effect.gen(function* ssmlLaws() {
                const lexicon = `<ssml:lexicon uri="a.pls" xml:id="L"/>`;
                const first = `<ssml:speak version="1.1" xml:lang="en"${Option.match(drawn.startmark, { onNone: () => "", onSome: (mark) => ` startmark="${mark}"` })}>${drawn.lookup === "own" ? lexicon : ""}${drawn.marks.map((name) => `<ssml:mark name="${name}"/>`).join("")}${drawn.lookup === "none" ? "" : `<ssml:lookup ref="L">x</ssml:lookup>`}</ssml:speak>`;
                const second = `<ssml:speak version="1.1" xml:lang="en">${drawn.lookup === "other" ? lexicon : ""}${drawn.markElsewhere ? `<ssml:mark name="a b"/>` : ""}</ssml:speak>`;
                const files = packageOf({
                  "a.pls": "<lexicon/>",
                  "imsmanifest.xml": `<manifest xmlns="${cp}" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/><file href="a.pls"/></resource></resources></manifest>`,
                  "item.xml": `<qti-assessment-item xmlns="${asi}" xmlns:ssml="http://www.w3.org/2001/10/synthesis" identifier="item" title="Item" time-dependent="false"><qti-item-body><p>${first}${second}</p></qti-item-body></qti-assessment-item>`,
                });
                const named = drawn.startmark.pipe(Option.map(markValueOf));
                const defined = Option.match(named, {
                  onNone: () => 0,
                  onSome: (mark) => drawn.marks.filter((name) => markValueOf(name) === mark).length,
                });
                const trimBreaks = Option.isSome(named) && defined !== 1;

                if (Option.isSome(named)) {
                  if (defined === 0 && drawn.markElsewhere && named.value === "a b") {
                    c.note("trim to a mark of another speak");
                  } else {
                    c.note(
                      defined === 1
                        ? "trim to a mark defined once"
                        : "trim to a mark defined twice",
                    );
                  }

                  if (
                    defined === 1 &&
                    !drawn.marks.includes(Option.getOrElse(drawn.startmark, () => ""))
                  ) {
                    c.note("trim to a mark written otherwise");
                  }
                }

                if (drawn.marks.includes("a b") && drawn.marks.includes("a  b")) {
                  c.note("one name in two forms");
                }

                if (drawn.lookup !== "none") {
                  c.note(
                    drawn.lookup === "own" ? "lookup in its own speak" : "lookup across speaks",
                  );
                }

                const judgment = yield* judge(files, grammar, laws);
                const breaches =
                  judgment._tag === "Judged"
                    ? judgment.breaches
                    : assert.fail(`the codec refused the package: ${judgment.rule}`);

                assert.deepStrictEqual(
                  breaches.filter(({ law }) => law === "SSML trim mark").length,
                  trimBreaks ? 1 : 0,
                  JSON.stringify(drawn),
                );
                assert.deepStrictEqual(
                  breaches.filter(({ law }) => law === "SSML lexicon reference").length,
                  drawn.lookup === "other" ? 1 : 0,
                  JSON.stringify(drawn),
                );
              }),
          ),
        ),
    );
  },
);
