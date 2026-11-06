/* oxlint-disable unicorn/text-encoding-identifier-case -- The documents spell their charset `UTF-8` as crust's reader reports it and `Document` stores it. */
/**
 * The identity builder's free tests: over every document of four small shapes, `rowsOf` gives each
 * overlay one row per element it describes, as the document's own construction says, and each
 * projection each value once; and over a manifest and an item, `languageRowsOf` gives R26's
 * witnesses, whose counts hold the law exactly when the specification does.
 *
 * The documents are built by construction, never filtered: each case's model records what it wrote
 * (every `xml:lang`, ID and `label`, every identity-typed text, every LOM language and its
 * category, the resource that names the item), and the oracle is that model read as keyed sets, so
 * no expected row is computed by the builder's own code.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, boolean, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option } from "effect";
import { GoverningOf } from "#pantry/grammar/install.ts";
import { languageRowsOf, rowsOf } from "#pantry/import/overlays/identity.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { closedName } from "#pantry/model/xdm.ts";
import type {
  NodeId,
  XdmAttribute,
  XdmChild,
  XdmClosedElement,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";

/**
 * The version every case is written in.
 */
const version = "3.0.1";

/**
 * The kinds the cases' elements are of.
 */
type CaseKind =
  | "cp:manifest"
  | "cp:metadata.resource"
  | "cp:resource"
  | "cp:resources"
  | "div"
  | "lom:educational"
  | "lom:general"
  | "lom:language"
  | "lom:lom"
  | "qti-assessment-item"
  | "qti-assessment-stimulus"
  | "qti-description"
  | "ssml:lexicon"
  | "ssml:lookup"
  | "ssml:mark"
  | "ssml:speak";

/**
 * Read the type a kind's element is governed by under its own declaration, `GoverningOf`'s row
 * whose governor is the kind itself.
 *
 * @param kind - The kind.
 * @returns Its declared type's `TypeName` handle.
 */
const declaredType = (kind: CaseKind): string =>
  GoverningOf.rows.find(
    (row) => row.kind === kind && row.governor === kind && row.version === version,
  )?.governs ?? assert.fail(`GoverningOf holds ${kind} under its own governor`);

/**
 * Write a closed attribute.
 *
 * @param handle - Its name.
 * @param lexical - Its lexical form.
 * @returns The attribute.
 */
const attribute = (
  handle:
    | "endmark"
    | "href"
    | "id"
    | "label"
    | "name"
    | "ref"
    | "startmark"
    | "type"
    | "xml:id"
    | "xml:lang",
  lexical: string,
): XdmAttribute<Composed> => ({
  lexical,
  name: closedName(handle),
  references: [],
});

/**
 * Write an element of a kind under its declared type, or under the type an `xsi:type` names.
 *
 * @param kind - Its kind.
 * @param attributes - Its attributes, in source order.
 * @param children - Its children, in order.
 * @param governs - Its governing type; by default its declared type.
 * @returns The element.
 */
const elementOf = (
  kind: CaseKind,
  attributes: readonly XdmAttribute<Composed>[],
  children: readonly XdmChild<Composed>[],
  governs: string = declaredType(kind),
): XdmClosedElement<Composed> => ({
  _tag: "element",
  attributes,
  children,
  governs,
  kind,
  namespaces: [],
  prefix: "",
});

/**
 * Write a document around its root element.
 *
 * @param root - The root.
 * @returns The document, with no declaration, doctype, prolog or epilog.
 */
const documentOf = (root: XdmClosedElement<Composed>): XdmDocument<Composed> => ({
  _tag: "document",
  charset: "UTF-8",
  declaration: Option.none(),
  doctype: Option.none(),
  epilog: [],
  exportCharset: "UTF-8",
  prolog: [],
  root,
  version,
});

/**
 * The ids every content and LOM case's rows are written under: `idOf`, numbering nodes in document
 * order, in a package that holds no document at any path a resource names.
 */
const ids = { documentAt: () => Option.none(), idOf };

/**
 * The document node's id, node 0 of every case.
 */
const documentNode = idOf(0);

/**
 * An ID as a case writes it: its lexical form, and the whitespace before and after its value.
 */
interface WrittenId {
  readonly after: string;
  readonly before: string;
  readonly lexical: string;
  readonly value: string;
}

/**
 * The IDs a content element may carry: a bare one, and the same value padded, which XML Schema's
 * collapse makes one value.
 */
const writtenIds: readonly WrittenId[] = [
  { after: "", before: "", lexical: "a", value: "a" },
  { after: " ", before: " ", lexical: " a ", value: "a" },
];

/**
 * One content element as a case draws it: its `xml:lang`, its ID and whether it carries `label`.
 */
interface ContentChoice {
  readonly id: Option.Option<WrittenId>;
  readonly label: boolean;
  readonly lang: Option.Option<string>;
}

/**
 * A content case: its root's kind, `xml:lang` and label, and its `div` children's choices.
 */
interface ContentCase {
  readonly children: readonly ContentChoice[];
  readonly rootKind: "qti-assessment-item" | "qti-assessment-stimulus";
  readonly rootLabel: boolean;
  readonly rootLang: Option.Option<string>;
}

/**
 * A content element's attributes as its choice writes them.
 *
 * @param choice - The choice.
 * @returns Its attributes.
 */
const attributesOf = (choice: ContentChoice): readonly XdmAttribute<Composed>[] => [
  ...Option.toArray(choice.lang).map((lang) => attribute("xml:lang", lang)),
  ...Option.toArray(choice.id).map(({ lexical }) => attribute("id", lexical)),
  ...(choice.label ? [attribute("label", "x")] : []),
];

/**
 * Every content case: an item or a stimulus whose root carries no `xml:lang`, `en` or ` en`, and a
 * label or none, holding at most 2 `div`s, each with no `xml:lang`, `en` or `fr`, no ID or one of
 * {@link writtenIds}, and a label or none.
 */
const contentCases: Gen<ContentCase> = (source) => ({
  children: source.draw(
    array<ContentChoice>(
      (inner) => ({
        id: inner.draw(element([Option.none(), ...writtenIds.map((held) => Option.some(held))])),
        label: inner.draw(element([false, true])),
        lang: inner.draw(element([Option.none(), Option.some("en"), Option.some("fr")])),
      }),
      { max: 2, min: 0 },
    ),
  ),
  rootKind: source.draw(element(["qti-assessment-item", "qti-assessment-stimulus"] as const)),
  rootLabel: source.draw(element([false, true])),
  rootLang: source.draw(element([Option.none(), Option.some("en"), Option.some(" en")])),
});

/**
 * A situation the content box must reach.
 */
type ContentSituation =
  | "repeated xml:lang"
  | "padded id"
  | "one id value twice"
  | "labelled item content"
  | "labelled stimulus root";

/**
 * Write a sorted list of a keyed set's members, failing on a repeat.
 *
 * @param members - The members as text.
 * @returns Them, sorted.
 */
const asSet = (members: readonly string[]): readonly string[] => {
  assert.strictEqual(new Set(members).size, members.length, `a repeat among ${members.join(", ")}`);

  return members.toSorted();
};

describe(
  "import/overlays/identity.ts, a content document's rows",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "gives each xml:lang form once per document, one XmlLang, DocumentId and LabelUse row per element that carries one, and each ID split around its value",
      (ctx) =>
        // Oracle: the case's own model read as keyed sets: the forms it wrote, each once
        // (sets ruling 2), and the elements it wrote each on, numbered in document order (the root
        // node 1, its k-th div node k + 2).
        // Bound: every item or stimulus over the root's and at most 2 divs' choices above, 4,116.
        searched(
          ctx,
          exhaust(
            {
              box: "every item or stimulus whose root and at most 2 divs each carry a choice of xml:lang, ID and label",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<ContentSituation>([
                "repeated xml:lang",
                "padded id",
                "one id value twice",
                "labelled item content",
                "labelled stimulus root",
              ]),
              generator: contentCases,
              limit: 5000,
              literal: (drawn) => JSON.stringify(drawn),
              oracle: { kind: "specification", name: "the case's model, read as keyed sets" },
              suite: "import/identity-content-rows",
            },
            (drawn: ContentCase, c) =>
              Effect.sync(() => {
                const root = elementOf(
                  drawn.rootKind,
                  attributesOf({ id: Option.none(), label: drawn.rootLabel, lang: drawn.rootLang }),
                  drawn.children.map((choice) => elementOf("div", attributesOf(choice), [])),
                );
                const rows = rowsOf(documentOf(root), ids);
                const placed = [
                  {
                    choice: { id: Option.none(), label: drawn.rootLabel, lang: drawn.rootLang },
                    node: idOf(1),
                    root: true,
                  },
                  ...drawn.children.map((choice, at) => ({
                    choice,
                    node: idOf(at + 2),
                    root: false,
                  })),
                ];
                const langs = placed.flatMap(({ choice }) => Option.toArray(choice.lang));
                const values = placed.flatMap(({ choice }) =>
                  Option.toArray(choice.id).map(({ value }) => value),
                );
                const labelled = placed.filter(
                  ({ choice, root: isRoot }) =>
                    choice.label && !(isRoot && drawn.rootKind === "qti-assessment-item"),
                );

                if (new Set(langs).size < langs.length) {
                  c.note("repeated xml:lang");
                }

                if (
                  placed.some(({ choice }) =>
                    Option.exists(choice.id, ({ before }) => before !== ""),
                  )
                ) {
                  c.note("padded id");
                }

                if (new Set(values).size < values.length) {
                  c.note("one id value twice");
                }

                if (drawn.rootKind === "qti-assessment-item" && labelled.length > 0) {
                  c.note("labelled item content");
                }

                if (drawn.rootKind === "qti-assessment-stimulus" && drawn.rootLabel) {
                  c.note("labelled stimulus root");
                }

                assert.deepStrictEqual(
                  asSet(
                    [...rows.DocumentLang.values()].map(
                      ({ document, lang }) => `${document} ${lang}`,
                    ),
                  ),
                  [...new Set(langs.map((lang) => `${documentNode} ${lang}`))].toSorted(),
                );
                assert.deepStrictEqual(
                  asSet(
                    [...rows.XmlLang.values()].map(
                      ({ document, lang, node }) => `${node} ${document} ${lang}`,
                    ),
                  ),
                  placed
                    .flatMap(({ choice, node }) =>
                      Option.toArray(choice.lang).map((lang) => `${node} ${documentNode} ${lang}`),
                    )
                    .toSorted(),
                );
                assert.deepStrictEqual(
                  asSet(
                    [...rows.DocumentId.values()].map((row) =>
                      JSON.stringify([
                        row.node,
                        row.document,
                        row.before,
                        row.id,
                        row.after,
                        row.lexical,
                        row.owner,
                      ]),
                    ),
                  ),
                  placed
                    .flatMap(({ choice, node }) =>
                      Option.toArray(choice.id).map(({ after, before, lexical, value }) =>
                        JSON.stringify([node, documentNode, before, value, after, lexical, node]),
                      ),
                    )
                    .toSorted(),
                );
                assert.deepStrictEqual(
                  asSet(
                    [...rows.IdBinding.values()].map(
                      ({ document, id, owner }) => `${document} ${id} ${owner}`,
                    ),
                  ),
                  placed
                    .flatMap(({ choice, node }) =>
                      Option.toArray(choice.id).map(
                        ({ value }) => `${documentNode} ${value} ${node}`,
                      ),
                    )
                    .toSorted(),
                );
                assert.deepStrictEqual(
                  [...rows.DocumentGenerals.values()].map(({ document }) => document),
                  [documentNode],
                );
                assert.strictEqual(rows.IdentityText.size, 0);
                assert.strictEqual(rows.GeneralNamed.size, 0);
                assert.strictEqual(rows.GeneralObject.size, 0);
                assert.deepStrictEqual(
                  asSet(
                    [...rows.LabelUse.values()].map(
                      ({ document, node, rootKind }) => `${node} ${document} ${rootKind}`,
                    ),
                  ),
                  labelled
                    .map(({ node }) => `${node} ${documentNode} ${drawn.rootKind}`)
                    .toSorted(),
                );
                assert.strictEqual(rows.LomLanguage.size, 0);
                assert.strictEqual(rows.ResourceLomLanguageSet.size, 0);
              }),
          ),
        ),
    );
  },
);

/**
 * The texts a LOM language is written with: `en`, `fr`, or none, an empty element.
 */
const lomTexts = ["en", "fr", ""] as const;

/**
 * A LOM case: each general category's languages, and the educational category's one language or
 * none, which lists no `general` language.
 */
interface LomCase {
  readonly educational: boolean;
  readonly generals: readonly (readonly string[])[];
}

/**
 * Every LOM case: a record of 1 or 2 general categories, each listing at most 2 languages over
 * {@link lomTexts}, then an educational category with a language or none.
 */
const lomCases: Gen<LomCase> = (source) => ({
  educational: source.draw(element([false, true])),
  generals: source.draw(
    array(array(element<string>(lomTexts), { max: 2, min: 0 }), { max: 2, min: 1 }),
  ),
});

/**
 * Write a `lom:language` element with its text, none for the empty text.
 *
 * @param text - The language's text.
 * @returns The element.
 */
const languageOf = (text: string): XdmClosedElement<Composed> =>
  elementOf("lom:language", [], text === "" ? [] : [{ _tag: "text", value: text }]);

/**
 * A situation the LOM box must reach.
 */
type LomSituation = "repeated language" | "empty language" | "two categories" | "educational";

describe("import/overlays/identity.ts, a LOM record's rows", { timeout: searchTimeout }, () => {
  it.effect(
    "gives one LomLanguage row per general category's language, its category its parent, and each (category, language) once, and none for another category's language",
    (ctx) =>
      // Oracle: the case's own model read as keyed sets, each node numbered in document order:
      // the record node 1, then each category and, after it, each language and its text node.
      // Bound: every record of 1 or 2 general categories of at most 2 languages over en, fr and
      // empty, with an educational language or none, 364.
      searched(
        ctx,
        exhaust(
          {
            box: "every record of 1 or 2 general categories of at most 2 languages over en, fr and empty, beside an educational language or none",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<LomSituation>([
              "repeated language",
              "empty language",
              "two categories",
              "educational",
            ]),
            generator: lomCases,
            limit: 500,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: { kind: "specification", name: "the case's model, read as keyed sets" },
            suite: "import/identity-lom-rows",
          },
          (drawn: LomCase, c) =>
            Effect.sync(() => {
              const children: XdmClosedElement<Composed>[] = drawn.generals.map((texts) =>
                elementOf("lom:general", [], texts.map(languageOf)),
              );
              if (drawn.educational) {
                children.push(elementOf("lom:educational", [], [languageOf("de")]));
              }

              const rows = rowsOf(documentOf(elementOf("lom:lom", [], children)), ids);
              const expected: {
                readonly general: string;
                readonly lang: string;
                readonly node: string;
              }[] = [];
              let next = 2;
              for (const texts of drawn.generals) {
                const general = idOf(next);
                next += 1;
                for (const lang of texts) {
                  expected.push({ general, lang, node: idOf(next) });
                  next += lang === "" ? 1 : 2;
                }
              }

              if (drawn.generals.some((texts) => new Set(texts).size < texts.length)) {
                c.note("repeated language");
              }

              if (drawn.generals.some((texts) => texts.includes(""))) {
                c.note("empty language");
              }

              if (drawn.generals.length === 2) {
                c.note("two categories");
              }

              if (drawn.educational) {
                c.note("educational");
              }

              assert.deepStrictEqual(
                asSet(
                  [...rows.LomLanguage.values()].map(
                    ({ general, lang, node }) => `${node} ${general} ${lang}`,
                  ),
                ),
                expected.map(({ general, lang, node }) => `${node} ${general} ${lang}`).toSorted(),
              );
              assert.deepStrictEqual(
                asSet(
                  [...rows.ResourceLomLanguageSet.values()].map(
                    ({ general, lang }) => `${general} ${lang}`,
                  ),
                ),
                [...new Set(expected.map(({ general, lang }) => `${general} ${lang}`))].toSorted(),
              );
            }),
        ),
      ),
  );
});

/**
 * The governing types a `qti-description` takes in the identity-text box: its declared
 * `xs:normalizedString`, of no identity, and three an `xsi:type` names, two of them IDs.
 */
const textTypes = ["xs:normalizedString", "xs:ID", "UniqueIdentifierDType", "xs:IDREF"] as const;

/**
 * A governing type of {@link textTypes}.
 */
type TextType = (typeof textTypes)[number];

/**
 * A text an identity-typed element holds, with its pieces as the case's model writes them: the
 * ID's split around its value, and the IDREF tokens with the whitespace around each.
 */
interface WrittenText {
  readonly id: { readonly after: string; readonly before: string; readonly value: string };
  readonly idrefs: readonly {
    readonly after: string;
    readonly before: string;
    readonly piece: string;
    readonly token: string;
  }[];
  readonly text: string;
}

/**
 * The texts of the identity-text box: one bare token, and two tokens padded, which an ID keeps
 * whole as its value (and `E1_derived` refuses) and an IDREF splits.
 */
const writtenTexts: readonly [WrittenText, ...WrittenText[]] = [
  {
    id: { after: "", before: "", value: "a" },
    idrefs: [{ after: "", before: "", piece: "a", token: "a" }],
    text: "a",
  },
  {
    id: { after: " ", before: " ", value: "a b" },
    idrefs: [
      { after: "", before: " ", piece: " a", token: "a" },
      { after: " ", before: " ", piece: " b ", token: "b" },
    ],
    text: " a b ",
  },
];

/**
 * One `qti-description` as the identity-text box draws it: its governing type and its text.
 */
interface TextChoice {
  readonly text: WrittenText;
  readonly type: TextType;
}

/**
 * Every identity-text case: an item holding 1 or 2 `div`s, each holding at most 2
 * `qti-description`s, each of a type of {@link textTypes} and a text of {@link writtenTexts}.
 */
const textCases: Gen<readonly (readonly TextChoice[])[]> = array(
  array<TextChoice>(
    (inner) => ({
      text: inner.draw(element(writtenTexts)),
      type: inner.draw(element(textTypes)),
    }),
    { max: 2, min: 0 },
  ),
  { max: 2, min: 1 },
);

/**
 * A situation the identity-text box must reach.
 */
type TextSituation =
  | "one id twice under one parent"
  | "one id under two parents"
  | "tokens split"
  | "untyped text";

describe(
  "import/overlays/identity.ts, an item's identity-typed texts (C50)",
  { timeout: searchTimeout },
  () => {
    it.effect(
      "gives each ID- or IDREF-typed text its IdentityText row with its parent and tokens, each ID text its DocumentId bound to its parent, and each (id, parent) one binding",
      (ctx) =>
        // Oracle: the case's own model read as keyed sets: each description's type and text, its
        // node and its div's numbered in document order (the root node 1, each div, then each of
        // its descriptions and that description's text node), and XML Schema 1.0 Part 1
        // §3.15.5's [binding], the parent of an element whose text is an ID (reading 93).
        // Bound: every item of 1 or 2 divs of at most 2 descriptions over 4 types and 2 texts,
        // 5,402.
        searched(
          ctx,
          exhaust(
            {
              box: "every item of 1 or 2 divs, each of at most 2 qti-descriptions of 4 governing types and 2 texts",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<TextSituation>([
                "one id twice under one parent",
                "one id under two parents",
                "tokens split",
                "untyped text",
              ]),
              generator: textCases,
              limit: 6000,
              literal: (drawn) => JSON.stringify(drawn),
              oracle: {
                kind: "specification",
                name: "the case's model, read as keyed sets; XML Schema 1.0 Part 1 §3.15.5 [binding]",
              },
              suite: "import/identity-text-rows",
            },
            (drawn, c) =>
              Effect.sync(() => {
                const root = elementOf(
                  "qti-assessment-item",
                  [],
                  drawn.map((choices) =>
                    elementOf(
                      "div",
                      [],
                      choices.map(({ text, type }) =>
                        elementOf(
                          "qti-description",
                          [],
                          [{ _tag: "text", value: text.text }],
                          type,
                        ),
                      ),
                    ),
                  ),
                );
                const rows = rowsOf(documentOf(root), ids);
                const placed: {
                  readonly choice: TextChoice;
                  readonly node: string;
                  readonly owner: string;
                }[] = [];
                let next = 2;
                for (const choices of drawn) {
                  const owner = idOf(next);
                  next += 1;
                  for (const choice of choices) {
                    placed.push({ choice, node: idOf(next), owner });
                    next += 2;
                  }
                }

                const typed = placed.filter(({ choice }) => choice.type !== "xs:normalizedString");
                const idTexts = typed.filter(({ choice }) => choice.type !== "xs:IDREF");
                const bindings = idTexts.map(
                  ({ choice, owner }) => `${documentNode} ${choice.text.id.value} ${owner}`,
                );
                const values = idTexts.map(({ choice }) => choice.text.id.value);

                if (new Set(bindings).size < bindings.length) {
                  c.note("one id twice under one parent");
                }

                if (new Set(values).size < new Set(bindings).size) {
                  c.note("one id under two parents");
                }

                if (
                  typed.some(
                    ({ choice }) => choice.type === "xs:IDREF" && choice.text.idrefs.length > 1,
                  )
                ) {
                  c.note("tokens split");
                }

                if (placed.some(({ choice }) => choice.type === "xs:normalizedString")) {
                  c.note("untyped text");
                }

                assert.deepStrictEqual(
                  asSet(
                    [...rows.IdentityText.values()].map((row) =>
                      JSON.stringify([
                        row.node,
                        row.document,
                        row.owner,
                        row.kind,
                        row.governs,
                        row.lexical,
                        row.idrefs.map(({ after, before, piece, token }) => [
                          before,
                          token,
                          after,
                          piece,
                        ]),
                      ]),
                    ),
                  ),
                  typed
                    .map(({ choice, node, owner }) =>
                      JSON.stringify([
                        node,
                        documentNode,
                        owner,
                        "qti-description",
                        choice.type,
                        choice.text.text,
                        choice.type === "xs:IDREF"
                          ? choice.text.idrefs.map(({ after, before, piece, token }) => [
                              before,
                              token,
                              after,
                              piece,
                            ])
                          : [],
                      ]),
                    )
                    .toSorted(),
                );
                assert.deepStrictEqual(
                  asSet(
                    [...rows.DocumentId.values()].map((row) =>
                      JSON.stringify([
                        row.node,
                        row.document,
                        row.before,
                        row.id,
                        row.after,
                        row.lexical,
                        row.owner,
                      ]),
                    ),
                  ),
                  idTexts
                    .map(({ choice, node, owner }) =>
                      JSON.stringify([
                        node,
                        documentNode,
                        choice.text.id.before,
                        choice.text.id.value,
                        choice.text.id.after,
                        choice.text.text,
                        owner,
                      ]),
                    )
                    .toSorted(),
                );
                assert.deepStrictEqual(
                  asSet(
                    [...rows.IdBinding.values()].map(
                      ({ document, id, owner }) => `${document} ${id} ${owner}`,
                    ),
                  ),
                  [...new Set(bindings)].toSorted(),
                );
              }),
          ),
        ),
    );
  },
);

/**
 * The id of the node numbered `index` in the item document of the R26 box: a uuid of its own
 * document's, distinct from every manifest node's {@link idOf}.
 *
 * @param index - The number `flatten` gives the node.
 * @returns Its id.
 */
const itemIdOf = (index: number): NodeId =>
  `00000000-0000-4000-8001-${index.toString(16).padStart(12, "0")}`;

/**
 * The path of the item document of the R26 box, the one path its package holds a document at.
 */
const itemPath = "item.xml";

/**
 * One case of the R26 box: the one resource's type and `href`, its record's general categories'
 * languages, and the item's `xml:lang` on its root and on its one `div`.
 */
interface LangCase {
  readonly divLang: Option.Option<string>;
  readonly generals: readonly (readonly string[])[];
  readonly href: Option.Option<string>;
  readonly rootLang: Option.Option<string>;
  readonly type: "imsqti_item_xmlv3p0" | "imsqti_stimulus_xmlv3p0";
}

/**
 * Every R26 case: an item or a stimulus resource with no `href`, the item's or a path the package
 * holds no document at, whose record has at most 2 general categories, each listing at most 2
 * languages over `en` and `fr`; and an item whose root states no `xml:lang`, `en`, ` fr` or the
 * empty one, and whose `div` states none, `en` or `fr`.
 */
const langCases: Gen<LangCase> = (source) => ({
  divLang: source.draw(element([Option.none(), Option.some("en"), Option.some("fr")])),
  generals: source.draw(
    array(array(element(["en", "fr"]), { max: 2, min: 0 }), { max: 2, min: 0 }),
  ),
  href: source.draw(element([Option.none(), Option.some(itemPath), Option.some("missing.xml")])),
  rootLang: source.draw(
    element([Option.none(), Option.some("en"), Option.some(" fr"), Option.some("")]),
  ),
  type: source.draw(element(["imsqti_item_xmlv3p0", "imsqti_stimulus_xmlv3p0"] as const)),
});

/**
 * A situation the R26 box must reach: each way the law holds or breaks.
 */
type LangSituation =
  | "every category lists it"
  | "a category lacks it"
  | "no general category"
  | "no naming resource"
  | "href to no document"
  | "empty xml:lang";

describe("import/overlays/identity.ts, R26's rows", { timeout: searchTimeout }, () => {
  it.effect(
    "gives each resource's general category its named type, each naming one its document, and a witness for each stated xml:lang form it lists, so the witnesses of every stated form count its document's categories exactly when R26 holds",
    (ctx) =>
      // Oracle: the specification as a checker, QTI 3.0 Metadata §2.7.1.3 ("There must be one
      // value for each of the languages referred to by the language attributes on the associated
      // assessmentItem, test or object bank and its 'bodyElements'") over the case's model, read
      // as keyed sets: an xml:lang by its value, its outer whitespace set apart, the empty one
      // stating none (XML 1.0 §2.12), a LOM language as written, both compared exactly (the named
      // weakening, G-text); the manifest's nodes numbered in document order (the manifest 1, its
      // resources 2, the resource 3, its metadata 4, the record 5, then each category and, after
      // it, each language and its text node).
      // Bound: every item or stimulus resource of 3 hrefs, at most 2 categories of at most 2
      // languages over en and fr, and 12 placings of the item's xml:lang, 4,104.
      searched(
        ctx,
        exhaust(
          {
            box: "every item or stimulus resource, href none, the item's or a missing path, at most 2 general categories of at most 2 languages over en and fr, and the item's root and div xml:lang",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<LangSituation>([
              "every category lists it",
              "a category lacks it",
              "no general category",
              "no naming resource",
              "href to no document",
              "empty xml:lang",
            ]),
            generator: langCases,
            limit: 5000,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: {
              kind: "specification",
              name: "QTI 3.0 Metadata §2.7.1.3 over the case's model, read as keyed sets",
            },
            suite: "import/identity-r26-rows",
          },
          (drawn, c) =>
            Effect.sync(() => {
              const manifest = elementOf(
                "cp:manifest",
                [],
                [
                  elementOf(
                    "cp:resources",
                    [],
                    [
                      elementOf(
                        "cp:resource",
                        [
                          attribute("type", drawn.type),
                          ...Option.toArray(drawn.href).map((href) => attribute("href", href)),
                        ],
                        [
                          elementOf(
                            "cp:metadata.resource",
                            [],
                            [
                              elementOf(
                                "lom:lom",
                                [],
                                drawn.generals.map((langs) =>
                                  elementOf("lom:general", [], langs.map(languageOf)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              );
              const item = elementOf(
                "qti-assessment-item",
                Option.toArray(drawn.rootLang).map((lang) => attribute("xml:lang", lang)),
                [
                  elementOf(
                    "div",
                    Option.toArray(drawn.divLang).map((lang) => attribute("xml:lang", lang)),
                    [],
                  ),
                ],
              );
              const itemDocument = itemIdOf(0);
              const manifestRows = rowsOf(documentOf(manifest), {
                documentAt: (path) =>
                  path === itemPath ? Option.some(itemDocument) : Option.none(),
                idOf,
              });
              const itemRows = rowsOf(documentOf(item), {
                documentAt: () => Option.none(),
                idOf: itemIdOf,
              });
              const witnesses = languageRowsOf([manifestRows, itemRows]).GeneralLang;

              const record = idOf(5);
              const generals: { readonly langs: readonly string[]; readonly node: string }[] = [];
              let next = 6;
              for (const langs of drawn.generals) {
                generals.push({ langs, node: idOf(next) });
                next += 1 + 2 * langs.length;
              }

              const named =
                drawn.type === "imsqti_item_xmlv3p0" && Option.isSome(drawn.href)
                  ? drawn.type
                  : "none";
              const described = Option.exists(drawn.href, (href) => href === itemPath)
                ? itemDocument
                : documentNode;
              const forms = [
                ...new Set([...Option.toArray(drawn.rootLang), ...Option.toArray(drawn.divLang)]),
              ];
              const stated = forms.filter((form) => form.trim() !== "");
              const naming = named === "none" ? [] : generals;
              const holds = stated.every((form) =>
                naming.every(
                  ({ langs }) => described !== itemDocument || langs.includes(form.trim()),
                ),
              );

              if (stated.length > 0 && naming.length > 0 && described === itemDocument) {
                c.note(holds ? "every category lists it" : "a category lacks it");
              }

              if (drawn.generals.length === 0) {
                c.note("no general category");
              }

              if (named === "none") {
                c.note("no naming resource");
              }

              if (Option.exists(drawn.href, (href) => href !== itemPath)) {
                c.note("href to no document");
              }

              if (forms.includes("")) {
                c.note("empty xml:lang");
              }

              assert.deepStrictEqual(
                asSet(
                  [...manifestRows.GeneralNamed.values()].map(
                    (row) => `${row.general} ${row.record} ${row.named}`,
                  ),
                ),
                generals.map(({ node }) => `${node} ${record} ${named}`).toSorted(),
              );
              assert.deepStrictEqual(
                asSet(
                  [...manifestRows.GeneralObject.values()].map(
                    (row) => `${row.general} ${row.record} ${row.document}`,
                  ),
                ),
                naming.map(({ node }) => `${node} ${record} ${described}`).toSorted(),
              );
              assert.deepStrictEqual(
                asSet(
                  [...witnesses.values()].map((row) =>
                    JSON.stringify([
                      row.general,
                      row.document,
                      row.lang,
                      row.lead,
                      row.value,
                      row.trail,
                    ]),
                  ),
                ),
                (described === itemDocument ? naming : [])
                  .flatMap(({ langs, node }) =>
                    stated
                      .filter((form) => langs.includes(form.trim()))
                      .map((form) =>
                        JSON.stringify([
                          node,
                          itemDocument,
                          form,
                          form.slice(0, form.length - form.trimStart().length),
                          form.trim(),
                          form.slice(form.trimEnd().length),
                        ]),
                      ),
                  )
                  .toSorted(),
              );

              // The law as the database counts it: each stated form's witnesses against the
              // categories that describe the item.
              const categories = [...manifestRows.GeneralObject.values()].filter(
                ({ document }) => document === itemDocument,
              ).length;
              assert.strictEqual(
                stated.every(
                  (form) =>
                    [...witnesses.values()].filter(
                      ({ document, lang }) => document === itemDocument && lang === form,
                    ).length === categories,
                ),
                holds,
                JSON.stringify(drawn),
              );
            }),
        ),
      ),
  );
});

/**
 * One `speak` of the SSML box: its `startmark` as written or none, the `mark`s it holds, each
 * named `m`, and its `lookup` of `L`, beside a `lexicon` of that `xml:id` or not, or none.
 */
interface SpeakChoice {
  readonly lookup: "none" | "resolved" | "unresolved";
  readonly marks: number;
  readonly startmark: Option.Option<string>;
}

/**
 * One SSML case: a mark outside every `speak` or not, then 1 or 2 `speak`s.
 */
interface SsmlCase {
  readonly outside: boolean;
  readonly speaks: readonly SpeakChoice[];
}

/**
 * Every SSML case: an item whose `div` holds a mark of its own or not, then 1 or 2 `speak`s, each
 * of no `startmark`, `m` or ` m`, at most 2 marks named `m`, and no lookup, one beside its lexicon
 * or one without.
 */
const ssmlCases: Gen<SsmlCase> = (source) => ({
  outside: source.draw(boolean),
  speaks: source.draw(
    array<SpeakChoice>(
      (inner) => ({
        lookup: inner.draw(element(["none", "resolved", "unresolved"] as const)),
        marks: inner.draw(element([0, 1, 2])),
        startmark: inner.draw(element([Option.none(), Option.some("m"), Option.some(" m")])),
      }),
      { max: 2, min: 1 },
    ),
  ),
});

/**
 * A situation the SSML box must reach.
 */
type SsmlSituation =
  | "a mark defined once"
  | "a mark defined twice"
  | "a mark defined in another speak only"
  | "a lookup resolved"
  | "a lookup unresolved"
  | "a mark outside every speak";

describe("import/overlays/identity.ts, SSML's rows (reading 3)", { timeout: searchTimeout }, () => {
  it.effect(
    "gives each read SSML attribute its row in its nearest speak, each element on the way its scope, and each fragment's values once, so a trim's count is 1 exactly when its speak defines its mark once",
    (ctx) =>
      // Oracle: the specification as a checker, SSML 1.1 §3.1.1.1 and §3.1.5 over spec reading 3
      // ("the document" is each speak fragment) and the case's model, read as keyed sets: the
      // nodes numbered in document order (the root 1, its div 2, the outside mark 3 where drawn,
      // then each speak and, after it, its lexicon, its marks and its lookup), each name with its
      // outer whitespace set apart (the named weakening, G-text).
      // Bound: an outside mark or none and 1 or 2 speaks of 3 trims, at most 2 marks and 3
      // lookups, 1,512.
      searched(
        ctx,
        exhaust(
          {
            box: "every item of an outside mark or none and 1 or 2 speaks, each of 3 startmarks, at most 2 marks named m and 3 lookups",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<SsmlSituation>([
              "a mark defined once",
              "a mark defined twice",
              "a mark defined in another speak only",
              "a lookup resolved",
              "a lookup unresolved",
              "a mark outside every speak",
            ]),
            generator: ssmlCases,
            limit: 2000,
            literal: (drawn) => JSON.stringify(drawn),
            oracle: { kind: "specification", name: "SSML 1.1 §3.1.1.1 and §3.1.5, reading 3" },
            suite: "import/identity-ssml-rows",
          },
          (drawn: SsmlCase, c) =>
            Effect.sync(() => {
              const speaks = drawn.speaks.map((choice) =>
                elementOf(
                  "ssml:speak",
                  Option.toArray(choice.startmark).map((mark) => attribute("startmark", mark)),
                  [
                    ...(choice.lookup === "resolved"
                      ? [elementOf("ssml:lexicon", [attribute("xml:id", "L")], [])]
                      : []),
                    ...Array.from({ length: choice.marks }, () =>
                      elementOf("ssml:mark", [attribute("name", "m")], []),
                    ),
                    ...(choice.lookup === "none"
                      ? []
                      : [elementOf("ssml:lookup", [attribute("ref", "L")], [])]),
                  ],
                ),
              );
              const root = elementOf(
                "qti-assessment-item",
                [],
                [
                  elementOf(
                    "div",
                    [],
                    [
                      ...(drawn.outside
                        ? [elementOf("ssml:mark", [attribute("name", "m")], [])]
                        : []),
                      ...speaks,
                    ],
                  ),
                ],
              );
              const rows = rowsOf(documentOf(root), ids);

              const expectedAttributes: string[] = [];
              const expectedScopes: string[] = [];
              const outsideMark = idOf(3);
              if (drawn.outside) {
                expectedAttributes.push(`${outsideMark} name ssml:mark m ${documentNode}`);
                expectedScopes.push(
                  `${outsideMark} ${documentNode}`,
                  `${idOf(2)} ${documentNode}`,
                  `${idOf(1)} ${documentNode}`,
                );
              }

              let next = drawn.outside ? 4 : 3;
              const trims: { readonly marks: number; readonly speak: string }[] = [];
              for (const choice of drawn.speaks) {
                const speak = idOf(next);
                next += 1;
                for (const mark of Option.toArray(choice.startmark)) {
                  expectedAttributes.push(`${speak} startmark ssml:speak ${mark.trim()} ${speak}`);
                  expectedScopes.push(`${speak} ${speak}`);
                  trims.push({ marks: choice.marks, speak });
                }

                if (choice.lookup === "resolved") {
                  expectedAttributes.push(`${idOf(next)} xml:id ssml:lexicon L ${speak}`);
                  expectedScopes.push(`${idOf(next)} ${speak}`, `${speak} ${speak}`);
                  next += 1;
                }

                for (let at = 0; at < choice.marks; at += 1) {
                  expectedAttributes.push(`${idOf(next)} name ssml:mark m ${speak}`);
                  expectedScopes.push(`${idOf(next)} ${speak}`, `${speak} ${speak}`);
                  next += 1;
                }

                if (choice.lookup !== "none") {
                  expectedAttributes.push(`${idOf(next)} ref ssml:lookup L ${speak}`);
                  expectedScopes.push(`${idOf(next)} ${speak}`, `${speak} ${speak}`);
                  next += 1;
                }
              }

              for (const { marks } of trims) {
                c.note(marks === 1 ? "a mark defined once" : "a mark defined twice");
              }

              if (
                trims.some(({ marks }) => marks === 0) &&
                drawn.speaks.some(({ marks }) => marks > 0)
              ) {
                c.note("a mark defined in another speak only");
              }

              for (const { lookup } of drawn.speaks) {
                if (lookup !== "none") {
                  c.note(lookup === "resolved" ? "a lookup resolved" : "a lookup unresolved");
                }
              }

              if (drawn.outside) {
                c.note("a mark outside every speak");
              }

              assert.deepStrictEqual(
                asSet(
                  [...rows.SsmlAttribute.values()].map(
                    (row) => `${row.node} ${row.name} ${row.kind} ${row.value} ${row.fragment}`,
                  ),
                ),
                expectedAttributes.toSorted(),
              );
              assert.deepStrictEqual(
                asSet(
                  [...rows.SsmlScope.values()].map(({ fragment, node }) => `${node} ${fragment}`),
                ),
                [...new Set(expectedScopes)].toSorted(),
              );
              assert.deepStrictEqual(
                asSet(
                  [...rows.FragmentValue.values()].map(
                    ({ fragment, kind, value }) => `${fragment} ${kind} ${value}`,
                  ),
                ),
                [
                  ...new Set(
                    [...rows.SsmlAttribute.values()].map(
                      ({ fragment, kind, value }) => `${fragment} ${kind} ${value}`,
                    ),
                  ),
                ].toSorted(),
              );

              // The trim law as the database counts it: each trim's value carried once by a mark of
              // its own fragment.
              const marks = [...rows.SsmlAttribute.values()].filter(
                ({ kind }) => kind === "ssml:mark",
              );
              for (const trim of [...rows.SsmlAttribute.values()].filter(
                ({ kind }) => kind === "ssml:speak",
              )) {
                assert.strictEqual(
                  marks.filter(
                    ({ fragment, value }) => fragment === trim.fragment && value === trim.value,
                  ).length === 1,
                  trims.find(({ speak }) => speak === trim.node)?.marks === 1,
                  JSON.stringify(drawn),
                );
              }
            }),
        ),
      ),
  );
});
