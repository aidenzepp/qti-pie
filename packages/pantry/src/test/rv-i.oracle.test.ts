/**
 * Slice I's laws judged on whole packages by the law oracle (`#pantry/test/oracle.ts`), from the
 * reader through the shredder and the folds: each input of Aiden's review that a reading now
 * refuses is refused under the law and rule the reading names, and the nearest valid input breaks
 * no law.
 *
 * - Reading 128, a QTI 3.0.1 item root's own `label` asks for `tool-name` and `tool-version` (3.0.1
 *   §4.1.3), and a 3.0.0 one's does not (3.0.0 §4.1.3);
 * - Reading 3, SSML mark names compared by their collapsed value (`xsd:token`, SSML 1.1 §3.3.2);
 * - Reading 131, a namespace name an RFC 3986 URI reference (Namespaces in XML 1.0 §3, §2.1): crust's
 *   reader refuses a package that declares one that is none, as not well-formed (reading 142), so
 *   the law's box judges rows the reader never sees, a tree whose declarations are set after
 *   reading;
 * - Reading 134, an item's languages listed by its record's general categories, compared as language
 *   tags (QTI 3.0 Metadata §2.7.1.3; RFC 5646 §2.1 and §2.1.1).
 *
 * Oracle: the specifications' sentences turned into packages, each refused one beside the nearest
 * one that keeps the sentence. The search-based guards of the same laws are the boxes in
 * `#pantry/qti/identity.oracle.test.ts`, `#pantry/import/overlays/identity.test.ts` and
 * `#pantry/qti/chardata.oracle.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { idOf } from "#pantry/test/gen/xdm.ts";
import {
  documentBreaches,
  judge,
  lawsOf,
  ruleOf,
  shownBreach,
  verdictOf,
} from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * One case: the item root's attributes beyond its three required ones, the body's content, the
 * item resource's LOM general categories, and the schema version the manifest names.
 */
interface Written {
  readonly body?: string;
  readonly generals?: readonly (readonly string[])[];
  readonly root?: string;
  readonly version?: "3.0.0" | "3.0.1";
}

/**
 * Build a one-item package, each file's text encoded as UTF-8, as `readPackage` returns one.
 *
 * @param written - The case.
 * @returns The entries, sorted by path.
 */
const packageOf = ({
  body = "<p>Hi</p>",
  generals,
  root = "",
  version = "3.0.1",
}: Written): readonly PackageFile[] => {
  const lom =
    generals === undefined
      ? ""
      : `<metadata><imsmd:lom>${generals
          .map(
            (langs) =>
              `<imsmd:general>${langs.map((lang) => `<imsmd:language>${lang}</imsmd:language>`).join("")}</imsmd:general>`,
          )
          .join("")}</imsmd:lom></metadata>`;
  const files = {
    "imsmanifest.xml": `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" xmlns:imsmd="http://ltsc.ieee.org/xsd/LOM" identifier="M"><metadata><schema>QTI Package</schema><schemaversion>${version}</schemaversion></metadata><organizations/><resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml">${lom}<file href="item.xml"/></resource></resources></manifest>`,
    "item.xml": `<qti-assessment-item xmlns="${asi}" xmlns:ssml="http://www.w3.org/2001/10/synthesis" identifier="item" title="Item" time-dependent="false"${root === "" ? "" : ` ${root}`}><qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
  };

  return Object.entries(files)
    .map(([path, text]): PackageFile => ({
      bytes: new TextEncoder().encode(text),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));
};

/**
 * Read the breaches of a judgment the codec did not refuse.
 *
 * @param judgment - The judgment.
 * @returns Its breaches.
 */
const breachesOf = (judgment: Judgment): readonly Breach[] =>
  judgment._tag === "Judged"
    ? judgment.breaches
    : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`);

/**
 * Write a judgment's breaches as `law: rule` lines, for an assertion's message.
 *
 * @param breaches - The breaches.
 * @returns One line per breach.
 */
const shown = (breaches: readonly Breach[]): string =>
  breaches.map((breach) => shownBreach(breach, grammar)).join("\n");

/**
 * One named input and what the oracle must say of it: no law broken, the one law and rule the
 * reading names, first among the breaches, or, where another reading refuses the input, no breach
 * of the law this one states (`unbroken`).
 */
interface Named {
  readonly name: string;
  /**
   * What crust's reader's refusal says, for an input the reader refuses as not well-formed before
   * any law reads it.
   */
  readonly reader?: string;
  readonly refused?: { readonly law: LawName; readonly rule: OracleRule };
  readonly unbroken?: LawName;
  readonly written: Written;
}

/**
 * A `speak` fragment in a paragraph.
 *
 * @param attributes - The `speak`'s attributes beyond `version` and `xml:lang`.
 * @param content - Its content.
 * @returns The paragraph.
 */
const speak = (attributes: string, content: string): string =>
  `<p><ssml:speak version="1.1" xml:lang="en" ${attributes}>${content}</ssml:speak></p>`;

/**
 * Every named input, by reading.
 */
const cases: readonly (readonly [reading: string, cases: readonly Named[]])[] = [
  [
    "reading 128: a QTI 3.0.1 item root's own label names its tool",
    [
      {
        name: "a 3.0.1 item whose root has a label and no tools",
        refused: { law: "Label tools", rule: "label-tool" },
        written: { root: `label="root"`, version: "3.0.1" },
      },
      {
        name: "a 3.0.1 item whose root has a label and tool-name alone",
        refused: { law: "Label tools", rule: "label-tool" },
        written: { root: `label="root" tool-name="t"`, version: "3.0.1" },
      },
      {
        name: "a 3.0.1 item whose root has a label and both tools",
        written: { root: `label="root" tool-name="t" tool-version="1"`, version: "3.0.1" },
      },
      {
        name: "a 3.0.0 item whose body has a label and no tools",
        refused: { law: "Label tools", rule: "label-tool" },
        written: { body: `<p label="x">Hi</p>`, version: "3.0.0" },
      },
    ],
  ],
  [
    "reading 3: SSML mark names compare collapsed",
    [
      {
        name: `startmark="a  b" beside <mark name="a b"/>`,
        written: { body: speak(`startmark="a  b"`, `<ssml:mark name="a b"/>x`) },
      },
      {
        name: `endmark=" a\tb " beside <mark name="a b"/>`,
        written: { body: speak(`endmark=" a&#9;b "`, `x<ssml:mark name="a b"/>`) },
      },
      {
        name: `two marks named "a b" and "a  b" with startmark="a b"`,
        refused: { law: "SSML trim mark", rule: "ssml-fragment" },
        written: {
          body: speak(`startmark="a b"`, `<ssml:mark name="a b"/>x<ssml:mark name="a  b"/>`),
        },
      },
      {
        name: `startmark="ab" beside <mark name="a b"/>, another name`,
        refused: { law: "SSML trim mark", rule: "ssml-fragment" },
        written: { body: speak(`startmark="ab"`, `<ssml:mark name="a b"/>x`) },
      },
    ],
  ],
  [
    "reading 131: a namespace name is an RFC 3986 URI reference",
    [
      {
        name: `xmlns:x="http://[bad"`,
        reader: `the prefix x is bound to "http://[bad", which is no URI reference`,
        written: { root: `xmlns:x="http://[bad"` },
      },
      {
        name: `xmlns:x="a b"`,
        reader: `the prefix x is bound to "a b", which is no URI reference`,
        written: { root: `xmlns:x="a b"` },
      },
      {
        name: `xmlns:x="%zz"`,
        reader: `the prefix x is bound to "%zz", which is no URI reference`,
        written: { root: `xmlns:x="%zz"` },
      },
      { name: `xmlns:x="http://[::1]/"`, written: { root: `xmlns:x="http://[::1]/"` } },
      { name: `xmlns:x="urn:x:y"`, written: { root: `xmlns:x="urn:x:y"` } },
      { name: `xmlns:x="a/b", a relative reference`, written: { root: `xmlns:x="a/b"` } },
    ],
  ],
  [
    "reading 134: document-lang compares language tags",
    [
      {
        name: `xml:lang="en-GB" with LOM en-gb`,
        written: { generals: [["en-gb"]], root: `xml:lang="en-GB"` },
      },
      { name: `xml:lang="EN" with LOM en`, written: { generals: [["en"]], root: `xml:lang="EN"` } },
      {
        name: `xml:lang=" en " with LOM en, collapsed`,
        written: { generals: [["en"]], root: `xml:lang=" en "` },
      },
      {
        name: `xml:lang="en" with LOM " en ", an xs:string whose spaces make it no tag`,
        refused: { law: "Document lang", rule: "document-lang" },
        written: { generals: [[" en "]], root: `xml:lang="en"` },
      },
      {
        name: `a body element's xml:lang="  ", which states no language (reading 129 refuses it as no tag)`,
        unbroken: "Document lang",
        written: { body: `<p xml:lang="  ">Hi</p>`, generals: [["fr"]] },
      },
      {
        name: `a body element's xml:lang="fr" with LOM en, a body element's language unlisted`,
        refused: { law: "Document lang", rule: "document-lang" },
        written: { body: `<p xml:lang="fr">Hi</p>`, generals: [["en"]] },
      },
      {
        name: `xml:lang="en" with LOM fr`,
        refused: { law: "Document lang", rule: "document-lang" },
        written: { generals: [["fr"]], root: `xml:lang="en"` },
      },
    ],
  ],
];

for (const [reading, named] of cases) {
  describe(reading, () => {
    for (const { name, reader, refused, unbroken, written } of named) {
      const title = unbroken === undefined ? `accepts ${name}` : `breaks no ${unbroken} in ${name}`;
      const refusedTitle = refused === undefined ? title : `refuses ${name} under ${refused.rule}`;
      it.effect(
        reader === undefined
          ? refusedTitle
          : `refuses ${name} at the reader, under well-formedness`,
        () =>
          Effect.gen(function* judged() {
            const judgment = yield* judge(packageOf(written), grammar, laws);
            if (reader !== undefined) {
              assert.deepStrictEqual(verdictOf(judgment), {
                rule: "well-formedness",
                verdict: "refused",
              });
              assert.include(judgment._tag === "CodecRefusal" ? judgment.detail : "", reader);

              return;
            }

            const breaches = breachesOf(judgment);

            if (unbroken !== undefined) {
              assert.deepStrictEqual(
                breaches.filter(({ law }) => law === unbroken),
                [],
                shown(breaches),
              );
            } else if (refused === undefined) {
              assert.deepStrictEqual(breaches, [], shown(breaches));
              assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" });
            } else {
              assert.strictEqual(breaches[0]?.law, refused.law, shown(breaches));
              assert.strictEqual(ruleOf(refused.law), refused.rule);
              assert.deepStrictEqual(verdictOf(judgment), {
                rule: refused.rule,
                verdict: "refused",
              });
            }
          }),
      );
    }
  });
}

/**
 * The namespace names the declaration box writes: two URI references and two that are none, an IP
 * literal never closed and a space.
 */
const declaredNames = ["urn:x", "%41", "http://[bad", "a b"] as const;

/**
 * Whether a name of {@link declaredNames} is a URI reference, read off RFC 3986 Appendix A by hand.
 */
const isReference: Readonly<Record<(typeof declaredNames)[number], boolean>> = {
  "%41": true,
  "a b": false,
  "http://[bad": false,
  "urn:x": true,
};

/**
 * One declaration of the box: its prefix and the name it binds.
 */
interface Declaration {
  readonly name: (typeof declaredNames)[number];
  readonly prefix: "a" | "b";
}

/**
 * The declarations of one element: none or one of each prefix, so no two bind one prefix.
 */
const declarationsOf: Gen<readonly Declaration[]> = (source) =>
  source
    .draw(array(element(declaredNames), { max: 2, min: 0 }))
    .map((name, at) => ({ name, prefix: at === 0 ? "a" : "b" }));

/**
 * The grammar the box shreds an item by.
 */
const shredGrammar = shredGrammarOf(grammar);

/**
 * The grammar the box folds an item's tree by.
 */
const foldGrammar = foldGrammarOf(grammar);

/**
 * The placeholder name a declaration is read with, by where it stands and the prefix it declares.
 *
 * @param where - `root` or `p`.
 * @param prefix - The prefix.
 * @returns The placeholder, a URI reference.
 */
const placeholder = (where: string, prefix: string): string => `urn:placeholder:${where}:${prefix}`;

/**
 * Set every attribute value that names a placeholder to the name it stands for, through an
 * element and everything below it.
 *
 * @param held - The element.
 * @param names - The name each placeholder stands for.
 * @returns The element with its placeholders replaced.
 */
const withNames = (held: Element, names: ReadonlyMap<string, string>): Element => ({
  ...held,
  attributes: held.attributes.map((attribute) => ({
    ...attribute,
    value: names.get(attribute.value) ?? attribute.value,
  })),
  children: held.children.map((child) =>
    child.kind === "element" ? withNames(child, names) : child,
  ),
});

/**
 * Judge an item whose root and paragraph declare the box's names by its rows, below the reader.
 *
 * Crust's reader refuses a declaration whose name is no URI reference (reading 142), so the item
 * is read with each declaration bound to a placeholder, the tree's declarations are then set to the
 * case's names, and the tree is shredded, folded and judged by the oracle's document laws: the rows
 * hold names no reader admits, as a direct write of rows can.
 *
 * @param root - The root's declarations.
 * @param body - The paragraph's declarations.
 * @returns The document's breaches.
 */
const breachesBelowReader = Effect.fnUntraced(function* breachesBelowReader(
  root: readonly Declaration[],
  body: readonly Declaration[],
) {
  const declare = (where: string, declared: readonly Declaration[]): string =>
    declared.map(({ prefix }) => ` xmlns:${prefix}="${placeholder(where, prefix)}"`).join("");
  const names = new Map([
    ...root.map(({ name, prefix }) => [placeholder("root", prefix), name] as const),
    ...body.map(({ name, prefix }) => [placeholder("p", prefix), name] as const),
  ]);
  const text = `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"${declare("root", root)}><qti-item-body><p${declare("p", body)}>Hi</p></qti-item-body></qti-assessment-item>`;
  const document = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
  const xdm = yield* Effect.orDie(
    shred({ ...document, root: withNames(document.root, names) }, "3.0.1", shredGrammar),
  );
  const rows = yield* Effect.orDie(Effect.fromResult(fold(xdm, idOf, foldGrammar)));

  return documentBreaches("item.xml", rows, laws);
});

/**
 * A situation the declaration box must reach.
 */
type DeclarationSituation =
  | "no declaration"
  | "every name a reference"
  | "a root name refused"
  | "a body name refused"
  | "two names refused";

/**
 * How long the declaration box may run: each of its 441 cases reads, shreds and judges a package.
 * Measured 2026-11-07: 11.3 s at a load average of 63 to 73.
 */
const boxTimeout = 120_000;

describe(
  "reading 131: the oracle's Namespace name over every declaration",
  { timeout: boxTimeout },
  () => {
    it.effect(
      "breaks Namespace name once at each declaration whose name is no URI reference, on the root and in the body alike, and nowhere else",
      (ctx) =>
        // Oracle: the specification as a checker, Namespaces in XML 1.0 §3 ("The attribute's
        // normalized value MUST be either a URI reference … or an empty string") over each
        // declaration the case writes, each name's verdict read off RFC 3986 Appendix A by hand.
        // Bound: every item whose root and whose one paragraph each declare at most 2 prefixes over
        // 4 names, 441.
        searched(
          ctx,
          exhaust(
            {
              box: "every item whose root and paragraph each declare at most 2 prefixes over urn:x, %41, http://[bad and a b",
              caseHang: Duration.seconds(30),
              coverage: requiredInSpace<DeclarationSituation>([
                "no declaration",
                "every name a reference",
                "a root name refused",
                "a body name refused",
                "two names refused",
              ]),
              generator: (source) => ({
                body: source.draw(declarationsOf),
                root: source.draw(declarationsOf),
              }),
              limit: 500,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "Namespaces in XML 1.0 §3, RFC 3986 Appendix A",
              },
              suite: "test/oracle-namespace-name",
            },
            ({ body, root }, c) =>
              Effect.gen(function* declarations() {
                const refused = [
                  ...root
                    .filter(({ name }) => !isReference[name])
                    .map(({ prefix }) => `root ${prefix}`),
                  ...body
                    .filter(({ name }) => !isReference[name])
                    .map(({ prefix }) => `p ${prefix}`),
                ];
                if (root.length + body.length === 0) {
                  c.note("no declaration");
                } else if (refused.length === 0) {
                  c.note("every name a reference");
                }

                if (refused.some((held) => held.startsWith("root"))) {
                  c.note("a root name refused");
                }

                if (refused.some((held) => held.startsWith("p"))) {
                  c.note("a body name refused");
                }

                if (refused.length >= 2) {
                  c.note("two names refused");
                }

                const breaches = (yield* breachesBelowReader(root, body)).filter(
                  ({ law }) => law === "Namespace name",
                );

                assert.deepStrictEqual(
                  breaches
                    .map(
                      ({ keys }) =>
                        `${keys["node"]?.endsWith("/p[0]") === true ? "p" : "root"} ${keys["prefix"] ?? ""}`,
                    )
                    .toSorted(),
                  refused.toSorted(),
                  shown(breaches),
                );
              }),
          ),
        ),
    );
  },
);
