/**
 * The mutations of the law oracle's laws over the declarations, the LOM title and the laws lane OL
 * added (`#pantry/test/oracle-laws/documents.ts`), each drawn to break exactly its law in an
 * accepted package (`src/test/complete.oracle.test.ts`).
 *
 * Each edits the every-relation package's items (`items/item.xml`, `item2.xml`, `item3.xml`), its
 * test, its usage data or its manifest, at a site it draws among those the base holds, writing a
 * value it draws among those the law refuses. A new declaration is an outcome declaration written
 * after an outcome declaration, so the item's content order holds, under a fresh identifier, so no
 * declaration's key breaks first.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import {
  changeDrawn,
  editDrawnDocument,
  replaceDrawn,
  replaceOnce,
  textOf,
  withText,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Base, Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation item that declares the most.
 */
const item = "items/item.xml";

/**
 * The every-relation documents that declare variables: the three items and the test.
 */
const declaring = ["items/item.xml", "items/item2.xml", "items/item3.xml", "test.xml"] as const;

/**
 * A self-closing outcome declaration, after which a new declaration may be written.
 */
const outcomeLine = /<qti-outcome-declaration identifier="[^"]+"[^>]*\/>/u;

/**
 * Draw one of a list of edits and apply it to the base.
 *
 * @param edits - The edits, each a drawn edit of the base's entries.
 * @returns The mutation's edit.
 */
const oneOf =
  (edits: readonly ((entries: PackageEntries) => Gen<PackageEntries>)[]) =>
  ({ entries }: Base): Gen<PackageEntries> =>
  (source) => {
    const edit = edits[source.draw(int(0, edits.length - 1))];
    if (edit === undefined) {
      throw new Error("no edit to draw");
    }

    return source.draw(edit(entries));
  };

/**
 * Edit one entry of a package by a drawn edit of its text.
 *
 * @param path - The entry's path.
 * @param edit - The drawn edit.
 * @returns The drawn edit of the package.
 */
const drawnIn =
  (path: string, edit: (text: string) => Gen<string>) =>
  (entries: PackageEntries): Gen<PackageEntries> =>
  (source) =>
    withText(entries, path, source.draw(edit(textOf(entries, path))));

/**
 * Write a drawn declaration after a drawn self-closing outcome declaration of a drawn declaring
 * document.
 *
 * @param declaration - The declaration's text.
 * @returns The drawn edit of the package.
 */
const declaredAfterOutcome =
  (declaration: Gen<string>) =>
  (entries: PackageEntries): Gen<PackageEntries> =>
  (source) => {
    const written = source.draw(declaration);

    return source.draw(
      editDrawnDocument(entries, declaring, outcomeLine, (text) =>
        replaceDrawn(text, outcomeLine, (match) => `${match[0]}${written}`),
      ),
    );
  };

/**
 * The typed values the every-relation documents write, each by its document, the declaration that
 * holds it and the base type it is a value of.
 */
const typedSites = [
  { baseType: "integer", identifier: "CTX", path: item },
  { baseType: "float", identifier: "SCORE", path: item },
  { baseType: "integer", identifier: "COUNT", path: item },
  { baseType: "integer", identifier: "DIGITS", path: item },
  { baseType: "identifier", identifier: "RESPONSE", path: item },
  { baseType: "float", identifier: "SCORE", path: "items/item2.xml" },
  { baseType: "identifier", identifier: "RESPONSE", path: "items/item2.xml" },
  { baseType: "float", identifier: "TOTAL", path: "test.xml" },
  { baseType: "integer", identifier: "PLACE", path: "test.xml" },
] as const;

/**
 * Texts that are no lexical form of each judged base type.
 */
const untyped = {
  float: ["one", "1,5", "--1", "1.0.0", "0x10"],
  identifier: ["1Choice", "Choice A", "", "Choice:A"],
  integer: ["1.5", "ten", "1e3", "+-1", " 1 2 "],
} as const;

/**
 * The value of a declaration's default or correct response, its one `qti-value`, around its text.
 *
 * @param identifier - The declaration's identifier.
 * @returns The pattern, whose second group is the text.
 */
const valueOf = (identifier: string): RegExp =>
  new RegExp(
    `(<qti-(?:context|response|outcome)-declaration identifier="${identifier}"[^>]*>\\s*<qti-(?:default-value|correct-response)><qti-value>)([^<]*)(</qti-value>)`,
    "u",
  );

/**
 * The single-valued defaults and correct responses of the every-relation item, each one value
 * closing its set.
 */
const singleValue = /<qti-value>[^<]*<\/qti-value>(?=<\/qti-(?:default-value|correct-response)>)/u;

/**
 * Each law's mutation, by law.
 */
export const documentMutations = {
  // Adaptive feedback (§5.49, §5.52): the non-adaptive item's slider interaction, bound to LEVER,
  // moved into a feedback block's content body, bare or inside a division.
  "Adaptive feedback": {
    mutate: oneOf([
      drawnIn(item, (text) => (source) => {
        const slider =
          '<qti-slider-interaction response-identifier="LEVER" lower-bound="0" upper-bound="10" step="1"/>';
        // A feedback block holds its flow content in a content body.
        const held = source.draw(element([slider, `<div>${slider}</div>`]));
        const before = source.draw(
          element([
            "    <p>It says <q>read this</q> and stops.</p>",
            "    <p><qti-feedback-inline",
          ]),
        );

        return replaceOnce(
          replaceOnce(text, `    ${slider}\n`, ""),
          before,
          `    <qti-feedback-block outcome-identifier="FEEDBACK" identifier="RIGHT" show-hide="show"><qti-content-body>${held}</qti-content-body></qti-feedback-block>\n${before}`,
        );
      }),
    ]),
    over: "package",
  },
  // Declaration base type (§4.5.3): a variable of single, multiple or ordered cardinality declared
  // with no base type, or a record declared with one.
  "Declaration base type": {
    mutate: oneOf([
      declaredAfterOutcome(
        (source) =>
          `<qti-outcome-declaration identifier="UNTYPED" cardinality="${source.draw(element(["single", "multiple", "ordered"]))}"/>`,
      ),
      declaredAfterOutcome(
        (source) =>
          `<qti-outcome-declaration identifier="TYPEDRECORD" cardinality="record" base-type="${source.draw(element(["integer", "string", "float"]))}"/>`,
      ),
    ]),
    over: "package",
  },
  // Declaration not reserved (reading 72): a declaration of a built-in session variable, in an item
  // or the test.
  "Declaration not reserved": {
    mutate: oneOf([
      declaredAfterOutcome(
        (source) =>
          `<qti-outcome-declaration identifier="${source.draw(element(["completionStatus", "numAttempts", "duration"]))}" cardinality="single" base-type="integer"/>`,
      ),
    ]),
    over: "package",
  },
  // Dependency target (CP 1.2): a drawn dependency of the manifest naming no resource of it.
  "Dependency target": {
    mutate: oneOf([
      drawnIn(
        "imsmanifest.xml",
        (text) => (source) =>
          replaceDrawn(
            text,
            /<dependency identifierref="[^"]+"\/>/u,
            () =>
              `<dependency identifierref="${source.draw(element(["nothing-res", "item9-res", "test-res-2"]))}"/>`,
          )(source),
      ),
    ]),
    over: "package",
  },
  // LomObjectTitle (QTI 3.0 Metadata §2.7.1.2): an item's or the test's title changed under its
  // record's title, by a word, by case, or by a doubled space, which `xs:normalizedString` keeps.
  LomObjectTitle: {
    mutate: oneOf(
      (
        [
          { path: item, title: "Every relation" },
          { path: "items/item2.xml", title: "Templated" },
          { path: "test.xml", title: "Every relation test" },
        ] as const
      ).map(({ path, title }) =>
        drawnIn(
          path,
          (text) => (source) =>
            replaceOnce(
              text,
              `title="${title}"`,
              `title="${source.draw(element([`${title} again`, title.toUpperCase(), title.replace(/ |$/u, "  "), "Another"]))}"`,
            ),
        ),
      ),
    ),
    over: "package",
  },
  // Mastery range (reading 9): the item's SCORE given a mastery value above its normal maximum or
  // below its normal minimum, or a normal range that leaves its mastery value out.
  "Mastery range": {
    mutate: oneOf([
      drawnIn(
        item,
        (text) => (source) =>
          replaceOnce(
            text,
            'mastery-value="5"',
            `mastery-value="${source.draw(element(["11", "-1", "1e2", "INF", "-INF", "10.5"]))}"`,
          ),
      ),
      drawnIn(
        item,
        (text) => (source) =>
          replaceOnce(
            text,
            'normal-maximum="10" normal-minimum="0"',
            source.draw(
              element([
                'normal-maximum="4" normal-minimum="0"',
                'normal-maximum="10" normal-minimum="6"',
              ]),
            ),
          ),
      ),
    ]),
    over: "package",
  },
  // Max strings required (§5.48.6): an extended text interaction bound to a new multiple or ordered
  // string response, written with no max-strings.
  "Max strings required": {
    mutate: oneOf([
      drawnIn(item, (text) => (source) => {
        const cardinality = source.draw(element(["multiple", "ordered"]));

        return replaceOnce(
          replaceOnce(
            text,
            '<qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/>',
            `<qti-response-declaration identifier="WIDGET" cardinality="single" base-type="string"/><qti-response-declaration identifier="ESSAYS" cardinality="${cardinality}" base-type="string"/>`,
          ),
          "    <p>It says <q>read this</q> and stops.</p>",
          '    <qti-extended-text-interaction response-identifier="ESSAYS"/>\n    <p>It says <q>read this</q> and stops.</p>',
        );
      }),
    ]),
    over: "package",
  },
  // Record field key (§8.16): the item's SUMMARY record default given two fields of one name.
  "Record field key": {
    mutate: oneOf([
      drawnIn(
        item,
        (text) => (source) =>
          source.draw(element(["rename", "add"])) === "rename"
            ? replaceOnce(text, 'field-identifier="note"', 'field-identifier="attempts"')
            : replaceOnce(
                text,
                '<qti-value field-identifier="note" base-type="string">none</qti-value>',
                `<qti-value field-identifier="note" base-type="string">none</qti-value><qti-value field-identifier="${source.draw(element(["note", "attempts"]))}" base-type="integer">2</qti-value>`,
              ),
      ),
    ]),
    over: "package",
  },
  // Reserved type (§2.2.2.1, §2.2.2.3): MAXSCORE or PASSED declared of another base type than the
  // specification gives it, or QTI_CONTEXT declared as an outcome.
  "Reserved type": {
    mutate: oneOf([
      declaredAfterOutcome(
        (source) =>
          `<qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="${source.draw(element(["integer", "string", "boolean", "identifier"]))}"/>`,
      ),
      declaredAfterOutcome(
        (source) =>
          `<qti-outcome-declaration identifier="PASSED" cardinality="single" base-type="${source.draw(element(["integer", "float", "string", "identifier"]))}"/>`,
      ),
      declaredAfterOutcome(
        () => '<qti-outcome-declaration identifier="QTI_CONTEXT" cardinality="record"/>',
      ),
    ]),
    over: "package",
  },
  // Typed value (§7.46, §8.13): a drawn default or correct value written as a text that is no
  // lexical form of its base type.
  "Typed value": {
    mutate:
      ({ entries }: Base): Gen<PackageEntries> =>
      (source) => {
        const site = source.draw(element([...typedSites]));
        const written = source.draw(element([...untyped[site.baseType]]));

        return withText(
          entries,
          site.path,
          textOf(entries, site.path).replace(
            valueOf(site.identifier),
            (_, open: string, _text: string, close: string) => `${open}${written}${close}`,
          ),
        );
      },
    over: "package",
  },
  // Value cardinality (§8.16, §7.46): a single variable's default or correct response given a
  // second value, a record field or a base-type alone, or the SUMMARY record's value given a value
  // that is no field or a field with no base-type.
  "Value cardinality": {
    mutate: oneOf([
      drawnIn(item, (text) => replaceDrawn(text, singleValue, (match) => `${match[0]}${match[0]}`)),
      drawnIn(item, (text) =>
        replaceDrawn(text, singleValue, (match) =>
          match[0].replace("<qti-value>", '<qti-value field-identifier="f" base-type="integer">'),
        ),
      ),
      drawnIn(item, (text) =>
        replaceDrawn(text, singleValue, (match) =>
          match[0].replace("<qti-value>", '<qti-value base-type="identifier">'),
        ),
      ),
      drawnIn(
        item,
        (text) => () =>
          replaceOnce(
            text,
            '<qti-value field-identifier="attempts" base-type="integer">',
            '<qti-value field-identifier="attempts">',
          ),
      ),
      drawnIn(
        item,
        (text) => (source) =>
          replaceOnce(
            text,
            source.draw(
              element([
                '<qti-value field-identifier="attempts" base-type="integer">1</qti-value>',
                '<qti-value field-identifier="note" base-type="string">none</qti-value>',
              ]),
            ),
            "<qti-value>1</qti-value>",
          ),
      ),
    ]),
    over: "package",
  },
  // XML production (XML 1.0 §2.5, §2.6, §2.8, §4.3.3): one of the stimulus's stored texts written
  // outside its production, which no text crust reads reaches: a comment with a double hyphen or a
  // final one, a processing instruction targeted xml or holding ?>, a doctype that is no doctype,
  // or an encoding or version that is no name of one.
  "XML production": {
    document: "items/stimulus.xml",
    mutate: (rows) => (source) => {
      const edit = source.draw(
        element(["comment", "target", "data", "doctype", "encoding", "version"]),
      );
      if (edit === "comment" || edit === "doctype") {
        const value = source.draw(
          element(
            edit === "comment"
              ? ["a--b", "trailing-", "--"]
              : ["<!DOCTYPEx>", "DOCTYPE qti-assessment-stimulus"],
          ),
        );
        const changed = (held: typeof rows.comments) =>
          source.draw(
            changeDrawn(
              held,
              () => true,
              (row) => ({ ...row, value }),
            ),
          );

        return edit === "comment"
          ? { ...rows, comments: changed(rows.comments) }
          : { ...rows, doctypes: changed(rows.doctypes) };
      }

      if (edit === "target" || edit === "data") {
        const value = source.draw(
          element(edit === "target" ? ["xml", "XmL", "1pi"] : ["a?>b", " leading", "?>"]),
        );

        return {
          ...rows,
          pis: source.draw(
            changeDrawn(
              rows.pis,
              () => true,
              (row) => ({ ...row, [edit]: value }),
            ),
          ),
        };
      }

      if (edit === "encoding") {
        const encoding = source.draw(element(["8bit", "utf 8", "-x"]));

        return {
          ...rows,
          encodingDecls: source.draw(
            changeDrawn(
              rows.encodingDecls,
              () => true,
              (row) => ({ ...row, encoding }),
            ),
          ),
        };
      }

      const version = source.draw(element(["1.-1", "1.1e5", "1.1.1"] as const));

      return {
        ...rows,
        xmlDecls: source.draw(
          changeDrawn(
            rows.xmlDecls,
            () => true,
            (row) => ({ ...row, version }),
          ),
        ),
      };
    },
    over: "rows",
  },
} as const satisfies Readonly<Record<string, Mutation>>;
