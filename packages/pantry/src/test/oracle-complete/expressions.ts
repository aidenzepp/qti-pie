/**
 * The mutations of the law oracle's laws over the expressions
 * (`#pantry/test/oracle-laws/expressions.ts`), each drawn to break exactly its law in an accepted
 * package (`src/test/oracle.complete.test.ts`).
 *
 * Each edits the every-relation package's processing: the item's response processing (a sum of a
 * map response and a map response point into SCORE, a round into COUNT, two lookups, and a match
 * of RESPONSE and its correct value), its template processing (N a random integer, SHOWN an
 * identifier), the third item's included rule (`rules.xml`: numAttempts against 1), the test's
 * outcome processing (TOTAL the sum of `ref1.SCORE` and a test variables) and its template default,
 * and the section document's precondition. Each writes a value of a type the law refuses, drawn
 * among several, at a site drawn among those the base holds.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { replaceOnce, textOf, withText } from "#pantry/test/oracle-complete/mutation.ts";
import type { Base, Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation item.
 */
const item = "items/item.xml";

/**
 * One drawn replacement: a passage of a document, which occurs exactly once, and the texts that
 * may replace it.
 */
interface Site {
  readonly passage: string;
  readonly path: string;
  readonly replacements: readonly [string, ...string[]];
}

/**
 * A base value's text.
 *
 * @param baseType - Its base type.
 * @param text - Its text.
 * @returns The `qti-base-value`.
 */
const literal = (baseType: string, text: string): string =>
  `<qti-base-value base-type="${baseType}">${text}</qti-base-value>`;

/**
 * Draw one site and one of its replacements, and write it into the base.
 *
 * @param sites - The sites.
 * @returns The mutation's edit.
 */
const replacing =
  (sites: readonly Site[]) =>
  ({ entries }: Base): Gen<PackageEntries> =>
  (source) => {
    const site = sites[source.draw(int(0, sites.length - 1))];
    if (site === undefined) {
      throw new Error("no site to draw");
    }

    const replacement = source.draw(element([...site.replacements]));

    return withText(
      entries,
      site.path,
      replaceOnce(textOf(entries, site.path), site.passage, replacement),
    );
  };

/**
 * The item's sum's map response point, an operand any float or integer may stand for.
 */
const sumOperand = '<qti-map-response-point identifier="SPOT"/>';

/**
 * The item's round's operand.
 */
const roundOperand = '<qti-round><qti-variable identifier="SCORE"/></qti-round>';

/**
 * The item's match's correct value.
 */
const matchCorrect = '<qti-correct identifier="RESPONSE"/>';

/**
 * Each law's mutation, by law.
 */
export const expressionMutations = {
  // Condition type (P21): a response condition's or the included rule's condition replaced by an
  // integer, a float or a string.
  "Condition type": {
    mutate: replacing([
      {
        passage:
          '<qti-match>\n          <qti-variable identifier="RESPONSE"/>\n          <qti-correct identifier="RESPONSE"/>\n        </qti-match>',
        path: item,
        replacements: [
          literal("integer", "1"),
          '<qti-variable identifier="SCORE"/>',
          literal("string", "yes"),
        ],
      },
      {
        passage:
          '<qti-gte>\n      <qti-variable identifier="numAttempts"/>\n      <qti-base-value base-type="integer">1</qti-base-value>\n    </qti-gte>',
        path: "items/rules.xml",
        replacements: ['<qti-variable identifier="numAttempts"/>', literal("float", "1.5")],
      },
    ]),
    over: "package",
  },
  // Item duration (A62): the built-in duration read in an item that is not time-dependent, by
  // the item's round or the included rule.
  "Item duration": {
    mutate: replacing([
      {
        passage: roundOperand,
        path: item,
        replacements: ['<qti-round><qti-variable identifier="duration"/></qti-round>'],
      },
      {
        passage: '<qti-variable identifier="numAttempts"/>',
        path: "items/rules.xml",
        replacements: ['<qti-variable identifier="duration"/>'],
      },
    ]),
    over: "package",
  },
  // Literal lexical (§8.13): a base value whose text is no lexical form of its base type, in the
  // item, its rule, the test or the section document.
  "Literal lexical": {
    mutate: replacing([
      {
        passage: literal("identifier", "RIGHT"),
        path: item,
        replacements: [literal("identifier", "1RIGHT"), literal("identifier", "RI GHT")],
      },
      {
        passage: literal("integer", "1"),
        path: "items/rules.xml",
        replacements: [literal("integer", "one"), literal("integer", "1.0")],
      },
      {
        passage: literal("float", "1"),
        path: "items/rules.xml",
        replacements: [literal("float", "x"), literal("float", "1,0")],
      },
      {
        passage: literal("integer", "7"),
        path: "test.xml",
        replacements: [literal("integer", "seven"), literal("integer", "7e")],
      },
      {
        passage: literal("float", "0"),
        path: "section.xml",
        replacements: [literal("float", "zero")],
      },
    ]),
    over: "package",
  },
  // Lookup type (P22): a lookup whose expression is no single integer, float or duration, or a
  // float into a match table, or a lookup of an outcome with no table.
  "Lookup type": {
    mutate: replacing([
      {
        passage:
          '<qti-lookup-outcome-value identifier="LEVEL"><qti-variable identifier="COUNT"/></qti-lookup-outcome-value>',
        path: item,
        replacements: [
          '<qti-lookup-outcome-value identifier="LEVEL"><qti-variable identifier="SCORE"/></qti-lookup-outcome-value>',
          `<qti-lookup-outcome-value identifier="LEVEL">${literal("string", "two")}</qti-lookup-outcome-value>`,
          '<qti-lookup-outcome-value identifier="COUNT"><qti-variable identifier="COUNT"/></qti-lookup-outcome-value>',
        ],
      },
      {
        passage:
          '<qti-lookup-outcome-value identifier="GRADE"><qti-variable identifier="SCORE"/></qti-lookup-outcome-value>',
        path: item,
        replacements: [
          `<qti-lookup-outcome-value identifier="GRADE">${literal("boolean", "true")}</qti-lookup-outcome-value>`,
          '<qti-lookup-outcome-value identifier="GRADE"><qti-multiple><qti-variable identifier="SCORE"/></qti-multiple></qti-lookup-outcome-value>',
        ],
      },
    ]),
    over: "package",
  },
  // Mapped response (P27): a map response of a response with no mapping, or a map response
  // point of one with no area mapping.
  "Mapped response": {
    mutate: replacing([
      {
        passage: '<qti-map-response identifier="RESPONSE"/>',
        path: item,
        replacements: [
          '<qti-map-response identifier="HOT"/>',
          '<qti-map-response identifier="AREA"/>',
          '<qti-map-response identifier="WIDGET"/>',
        ],
      },
      {
        passage: sumOperand,
        path: item,
        replacements: [
          '<qti-map-response-point identifier="LEVER"/>',
          '<qti-map-response-point identifier="PAIRS"/>',
        ],
      },
    ]),
    over: "package",
  },
  // One base (P23): the item's match given operands of two base types or two cardinalities.
  "One base": {
    mutate: replacing([
      {
        passage: matchCorrect,
        path: item,
        replacements: [
          literal("string", "ChoiceA"),
          `<qti-multiple>${literal("identifier", "ChoiceA")}</qti-multiple>`,
        ],
      },
    ]),
    over: "package",
  },
  // Operand fit (P23): an operand of a base type or cardinality its operator does not take: the
  // item's sum given a string, a boolean or an identifier; its round a boolean or a container;
  // the test's sum an identifier; the included rule's comparison a string.
  "Operand fit": {
    mutate: replacing([
      {
        passage: sumOperand,
        path: item,
        replacements: [
          literal("string", "x"),
          literal("boolean", "true"),
          literal("identifier", "yes"),
        ],
      },
      {
        passage: roundOperand,
        path: item,
        replacements: [
          `<qti-round>${literal("boolean", "true")}</qti-round>`,
          `<qti-round><qti-multiple>${literal("float", "1.5")}</qti-multiple></qti-round>`,
        ],
      },
      {
        passage: '<qti-variable identifier="ref1.SCORE"/>',
        path: "test.xml",
        replacements: [literal("identifier", "first")],
      },
      {
        passage: literal("integer", "1"),
        path: "items/rules.xml",
        replacements: [literal("string", "one")],
      },
    ]),
    over: "package",
  },
  // Outcome only (P25): a test operator in the item's response processing, its template
  // processing, or the test's template default, none of them outcome processing.
  "Outcome only": {
    mutate: replacing([
      {
        passage: sumOperand,
        path: item,
        replacements: ["<qti-number-correct/>", "<qti-number-presented/>"],
      },
      {
        passage: '<qti-random-integer min="5" max="10"/>',
        path: item,
        replacements: ["<qti-number-selected/>", "<qti-number-responded/>"],
      },
      {
        passage: literal("integer", "7"),
        path: "test.xml",
        replacements: ["<qti-number-correct/>", "<qti-number-incorrect/>"],
      },
    ]),
    over: "package",
  },
  // Reference type (P24): the template processing's random integer bounded by a variable that is
  // no single integer template or outcome: a template of another base type, a response, a float
  // outcome, or a built-in.
  "Reference type": {
    mutate: replacing([
      {
        passage: '<qti-random-integer min="5" max="10"/>',
        path: item,
        replacements: [
          '<qti-random-integer min="SHOWN" max="10"/>',
          '<qti-random-integer min="5" max="LEVER"/>',
          '<qti-random-integer min="5" max="10" step="WIDGET"/>',
        ],
      },
    ]),
    over: "package",
  },
  // Set type (P20): a setter's expression of another type than its variable's: COUNT, an integer,
  // set to a string or a container; FEEDBACK, an identifier, to a float; N, an integer template,
  // to a string; the test's TOTAL, a float, to a boolean.
  "Set type": {
    mutate: replacing([
      {
        passage: roundOperand,
        path: item,
        replacements: [
          literal("string", "x"),
          `<qti-multiple>${literal("integer", "1")}</qti-multiple>`,
        ],
      },
      {
        passage: literal("identifier", "RIGHT"),
        path: item,
        replacements: [literal("float", "1.5"), literal("boolean", "true")],
      },
      {
        passage: '<qti-random-integer min="5" max="10"/>',
        path: item,
        replacements: [literal("string", "five")],
      },
      {
        passage:
          '<qti-sum>\n        <qti-variable identifier="ref1.SCORE"/>\n        <qti-test-variables variable-identifier="SCORE" base-type="float" section-identifier="first"/>\n      </qti-sum>',
        path: "test.xml",
        replacements: [literal("boolean", "true"), literal("identifier", "none")],
      },
    ]),
    over: "package",
  },
  // Template default type (A38): the test's template default of N, an integer template, given a
  // string, a float, a boolean or a container.
  "Template default type": {
    mutate: replacing([
      {
        passage: literal("integer", "7"),
        path: "test.xml",
        replacements: [
          literal("string", "seven"),
          literal("float", "7.5"),
          literal("boolean", "true"),
          `<qti-multiple>${literal("integer", "7")}</qti-multiple>`,
        ],
      },
    ]),
    over: "package",
  },
  // Template reads (P26): the template processing reading an outcome, a response or a built-in
  // but QTI_CONTEXT, each an integer, as N is.
  "Template reads": {
    mutate: replacing([
      {
        passage: '<qti-random-integer min="5" max="10"/>',
        path: item,
        replacements: [
          '<qti-variable identifier="COUNT"/>',
          '<qti-variable identifier="LEVER"/>',
          '<qti-variable identifier="numAttempts"/>',
        ],
      },
    ]),
    over: "package",
  },
  // Variable kind (§7.10.1, §6.32.3, ...): a setter or a reader naming a variable of a kind it
  // does not set or read: FEEDBACK's setter setting the template SHOWN, the correct value of an
  // outcome, or the test's setter naming an item's variable by its prefix.
  "Variable kind": {
    mutate: replacing([
      {
        passage: '<qti-set-outcome-value identifier="FEEDBACK">',
        path: item,
        replacements: ['<qti-set-outcome-value identifier="SHOWN">'],
      },
      {
        passage: matchCorrect,
        path: item,
        replacements: ['<qti-correct identifier="FEEDBACK"/>'],
      },
      {
        passage: '<qti-set-outcome-value identifier="TOTAL">',
        path: "test.xml",
        replacements: ['<qti-set-outcome-value identifier="ref1.SCORE">'],
      },
    ]),
    over: "package",
  },
  // Weighted base (P29): the test's test variables given a weight-identifier and a base-type that
  // is no float.
  "Weighted base": {
    mutate: replacing([
      {
        passage: 'variable-identifier="SCORE" base-type="float"',
        path: "test.xml",
        replacements: [
          'variable-identifier="SCORE" base-type="integer" weight-identifier="W"',
          'variable-identifier="SCORE" weight-identifier="W" base-type="integer"',
        ],
      },
    ]),
    over: "package",
  },
} as const satisfies Readonly<Record<string, Mutation>>;
