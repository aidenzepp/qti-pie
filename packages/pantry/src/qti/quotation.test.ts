/**
 * The quotation law's free tests (spec reading 127): its statements are composed into `Qti` once
 * and each check is named by an oracle law; and over a box of `q`s with a mark beside or inside
 * them, the builder's row holds each end the tree shows, the check's predicate refuses exactly
 * the rows a quotation mark stands in, and the oracle refuses exactly the same documents.
 *
 * The database tests (`quotation.db.test.ts`) judge the same laws through PostgreSQL.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { grammar } from "#pantry/grammar/install.ts";
import { rowsOf } from "#pantry/import/overlays/quotation.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import { quotationLaws, quotationMarks, quotationRelations } from "#pantry/qti/quotation.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { idOf, searchTimeout } from "#pantry/test/gen/xdm.ts";
import { documentBreaches, lawNames, lawsOf, ruleOf } from "#pantry/test/oracle.ts";

/**
 * The host law model, the oracle's tables over the grammar.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * Write an item in 3.0.1 whose body is the given content.
 *
 * @param body - The item body's content.
 * @returns The item's text.
 */
const itemOf = (body: string): string =>
  `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false" adaptive="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * The quotation marks the check refuses, as a set.
 */
const marks: ReadonlySet<string> = new Set(quotationMarks);

/**
 * Where a box case puts its mark: in the sibling before the `q`, the sibling after it, or the
 * `q`'s own content at its start or its end.
 */
type Position = "after" | "before" | "end" | "start";

/**
 * What a box case puts at its position: a quotation mark, an apostrophe, a letter, or nothing.
 */
type Mark = '"' | "’" | "none" | "x";

/**
 * The node that holds a box case's mark: a text, a text behind a comment that stands between it
 * and the `q`, or a text inside an element.
 */
type Neighbour = "comment" | "element" | "text";

/**
 * One case of the box.
 */
interface BoxCase {
  readonly mark: Mark;
  readonly neighbour: Neighbour;
  readonly position: Position;
}

/**
 * Every case of the box: each position, each mark and each neighbour.
 */
const boxCases: readonly [BoxCase, ...BoxCase[]] = (() => {
  const cases: BoxCase[] = [];
  for (const position of ["before", "after", "start", "end"] as const) {
    for (const mark of ['"', "’", "x", "none"] as const) {
      for (const neighbour of ["text", "comment", "element"] as const) {
        cases.push({ mark, neighbour, position });
      }
    }
  }

  const [first, ...rest] = cases;
  if (first === undefined) {
    throw new Error("The box holds no case. Give it a position, a mark and a neighbour.");
  }

  return [first, ...rest];
})();

/**
 * Write a box case's paragraph: a text that holds the mark at the end that faces the `q`, placed
 * beside or inside it as its neighbour says.
 *
 * @param boxCase - The case.
 * @returns The paragraph.
 */
const paragraphOf = ({ mark, neighbour, position }: BoxCase): string => {
  const written = mark === "none" ? "" : mark;
  const facing = {
    after: `${written} now`,
    before: `say ${written}`,
    end: `x${written}`,
    start: `${written}x`,
  }[position];
  const held = {
    comment:
      position === "before" || position === "end" ? `${facing}<!--c-->` : `<!--c-->${facing}`,
    element: `<b>${facing}</b>`,
    text: facing,
  }[neighbour];

  return {
    after: `<p><q>x</q>${held}</p>`,
    before: `<p>${held}<q>x</q></p>`,
    end: `<p><q>${held}</q></p>`,
    start: `<p><q>${held}</q></p>`,
  }[position];
};

/**
 * The character a box case's row holds at its position: the mark's text's character facing the
 * `q` where that text is the `q`'s neighbour, and nothing where a comment or an element is.
 *
 * @param boxCase - The case.
 * @returns The character.
 */
const expectedEnd = ({ mark, neighbour, position }: BoxCase): string => {
  if (neighbour !== "text") {
    return "";
  }

  if (mark !== "none") {
    return mark;
  }

  return position === "before" || position === "after" ? " " : "x";
};

/**
 * Read a document's text into its tree and its folded rows, as the importer and the oracle read it,
 * in 3.0.1.
 *
 * @param xml - The document.
 * @returns Its tree and its folded rows.
 */
const readOf = (xml: string) =>
  Effect.gen(function* read() {
    const document = yield* Effect.orDie(readXml(new TextEncoder().encode(xml)));
    const tree = yield* Effect.orDie(shred(document, "3.0.1", shredGrammarOf(grammar)));
    const rows = yield* Effect.orDie(Effect.fromResult(fold(tree, idOf, foldGrammarOf(grammar))));

    return { rows, tree };
  });

/**
 * Judge one item body three ways: its one `Quotation` row as the builder writes it, whether the
 * check's predicate refuses that row, and the laws the oracle finds it breaks.
 *
 * @param body - The item body's content, holding one `q`.
 * @returns The row, the check's verdict and the oracle's laws.
 */
const judgedOf = (body: string) =>
  Effect.gen(function* judged() {
    const { rows, tree } = yield* readOf(itemOf(body));
    const quotations = [...rowsOf(tree, { idOf }).Quotation.values()];
    const [row] = quotations;
    assert.lengthOf(quotations, 1, body);
    if (row === undefined) {
      return assert.fail(`${body} holds no q row`);
    }

    return {
      checked: [row.before, row.after, row.first, row.last].some((end) => marks.has(end)),
      laws: [...new Set(documentBreaches("item.xml", rows, laws).map(({ law }) => law))],
      row,
    };
  });

describe("qti/quotation.ts, declared", { timeout: searchTimeout }, () => {
  it("is composed into Qti, its relation under its own name and every statement once", () => {
    for (const relation of Object.values(quotationRelations)) {
      assert.strictEqual(
        Object.getOwnPropertyDescriptor(Qti.relations, relation.name)?.value,
        relation,
      );
    }

    assert.strictEqual(new Set(quotationLaws).size, quotationLaws.length);
    for (const statement of quotationLaws) {
      assert.strictEqual(Qti.statements.filter((held) => held === statement).length, 1);
    }
  });

  it("names each check by an oracle law, spaces written as underscores, so ruleOf maps it", () => {
    // Oracle: the oracle's own law list (`#pantry/test/oracle.ts` lawNames), the names Q5.17 maps.
    const named = quotationLaws.flatMap((statement) =>
      statement.kind === "check" ? [statement.name.replaceAll("_", " ")] : [],
    );

    for (const name of named) {
      const law = lawNames.find((known) => known === name);

      assert.isDefined(law, `${name} is no oracle law`);
    }

    assert.deepStrictEqual(named.toSorted(), ["E1 derived", "Quotation punctuation"]);
    assert.strictEqual(ruleOf("Quotation punctuation"), "q-punctuation");
  });
});

describe("qti/quotation.ts, a q beside and around its marks", { timeout: searchTimeout }, () => {
  it.effect(
    "writes each end a q's neighbour shows, and refuses exactly the q a quotation mark stands next to or inside",
    (ctx) =>
      // Oracle: the specification as a checker, §5.111 as reading 127 reads it: a q is refused
      // where the text beside it or inside it at the q's side ends in a quotation mark, any one of
      // the four positions alone; an apostrophe or a letter is no quotation mark, and a comment or
      // an element between the q and the mark keeps it from being immediately beside the q. The
      // oracle's law and the check's predicate over the builder's row must both agree with it.
      // Bound: the box, every position by every mark by every neighbour, 48 cases.
      searched(
        ctx,
        exhaust(
          {
            box: "each of before, after, start and end, by a double quote, a right single quote, a letter and nothing, by a text, a comment and an element as its neighbour",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<"accepted" | "refused">(["accepted", "refused"]),
            generator: element(boxCases),
            limit: 100,
            literal: paragraphOf,
            oracle: { kind: "specification", name: "info §5.111 Q, as reading 127 reads it" },
            suite: "qti/quotation-box",
          },
          (boxCase: BoxCase, c) =>
            Effect.gen(function* box() {
              const refused = boxCase.mark === '"' && boxCase.neighbour === "text";
              c.note(refused ? "refused" : "accepted");

              const paragraph = paragraphOf(boxCase);
              const { checked, laws: broken, row } = yield* judgedOf(paragraph);
              const ends = {
                after: row.after,
                before: row.before,
                end: row.last,
                start: row.first,
              };

              assert.strictEqual(ends[boxCase.position], expectedEnd(boxCase), paragraph);
              assert.strictEqual(checked, refused, paragraph);
              assert.deepStrictEqual(broken, refused ? ["Quotation punctuation"] : [], paragraph);
            }),
        ),
      ),
  );

  it.effect(
    "reads a predefined entity as its character, refuses the curly double quotes inside a q, and admits an apostrophe and a nested q",
    () =>
      // Oracle: the specification as a checker: crust substitutes the five predefined entities
      // (XML 1.0 §4.6), so `&quot;` is a double quote beside the q and `&apos;` an apostrophe;
      // “ and ” are quotation marks; ’ and ' are apostrophes (reading 127); an element child is no
      // punctuation, so a q whose only child is a q is judged by the inner q's own ends.
      // Bound: each named case, once.
      Effect.gen(function* named() {
        const cases = [
          { body: `<p>x&quot;<q>x</q></p>`, refused: true },
          { body: `<p>it&apos;<q>x</q></p>`, refused: false },
          { body: `<p><q>“x”</q></p>`, refused: true },
          { body: `<p>l’<q>x</q></p>`, refused: false },
          { body: `<p>the students'<q>x</q></p>`, refused: false },
          { body: `<p>«<q>x</q>»</p>`, refused: true },
          { body: `<p>say "<q>x</q>"</p>`, refused: true },
        ] as const;
        for (const { body, refused } of cases) {
          const { checked, laws: broken } = yield* judgedOf(body);

          assert.strictEqual(checked, refused, body);
          assert.deepStrictEqual(broken, refused ? ["Quotation punctuation"] : [], body);
        }

        const { rows, tree } = yield* readOf(itemOf(`<p>a <q><q>x</q></q> b</p>`));
        const nested = [...rowsOf(tree, { idOf }).Quotation.values()];

        assert.lengthOf(nested, 2);
        assert.deepStrictEqual(
          nested.map(({ after, before, first, last }) => [before, after, first, last]),
          [
            [" ", " ", "", ""],
            ["", "", "x", "x"],
          ],
        );
        assert.deepStrictEqual(documentBreaches("item.xml", rows, laws), []);
      }),
  );
});
