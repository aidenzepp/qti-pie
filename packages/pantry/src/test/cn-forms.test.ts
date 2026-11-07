/**
 * The MathML cn form, judged twice: a part of a typed cn holds its form's whole lexical space, and
 * the schema's own laws over the import's rows (PostgreSQL's `~` searches, so its patterns need
 * anchors) agree with the law oracle (which anchors the pattern itself) on every input, malformed
 * or not.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { base, edit, item, packageOf } from "#pantry/test/probe.ts";

const laws = judgedLaws(Qti);

/**
 * A cn the lexical space refuses: its markup and a name for the failure message.
 */
const refused: readonly (readonly [string, string])[] = [
  ["a real with a trailing letter", "<m:cn>1x</m:cn>"],
  ["a real with a space inside", "<m:cn>1 2</m:cn>"],
  ["an integer with trailing letters", '<m:cn type="integer">12abc</m:cn>'],
  ["an integer with a fraction", '<m:cn type="integer">1.5</m:cn>'],
  ["a double with trailing letters", '<m:cn type="double">1.5foo</m:cn>'],
  ["a hexdouble of 18 digits", '<m:cn type="hexdouble">7F8000000000000000</m:cn>'],
  ["a rational with a slash", '<m:cn type="rational">1/<m:sep/>2</m:cn>'],
  ["a base 2 integer with a 2", '<m:cn base="2" type="integer">1012</m:cn>'],
  ["a base 16 real with a G", '<m:cn base="16">FG</m:cn>'],
];

/**
 * A cn the lexical space accepts.
 */
const accepted: readonly (readonly [string, string])[] = [
  ["a real", "<m:cn>12</m:cn>"],
  ["a hexdouble of 16 digits", '<m:cn type="hexdouble">7ff8000000000000</m:cn>'],
  ["a base 16 real", '<m:cn base="16">FF</m:cn>'],
];

/**
 * The base package with a formula in the item's body.
 *
 * @param cn - The cn element's markup.
 * @returns The package's files.
 */
const withCn = (cn: string) => ({
  ...base,
  "item.xml": edit(
    edit(
      item,
      `<qti-assessment-item xmlns=`,
      `<qti-assessment-item xmlns:m="http://www.w3.org/1998/Math/MathML" xmlns=`,
    ),
    '<p id="intro">Pick one.</p>',
    `<p id="intro">Pick one.</p><m:math>${cn}</m:math>`,
  ),
});

/**
 * Judge a package with one cn in its item, by the law oracle and by the schema's laws over the
 * import's rows.
 *
 * @param cn - The cn element's markup.
 * @returns The host's first rule (or `accepted`) and the oracle's rules.
 */
const verdicts = (cn: string) =>
  Effect.scoped(
    Effect.gen(function* bothJudges() {
      const entries = new Map(
        packageOf(withCn(cn)).map(({ bytes, path }) => [path, bytes] as const),
      );
      const dir = yield* scopedPackage(entries);
      const oracle = yield* oracleVerdict(yield* readPackage(dir));
      const program = yield* readProgram(dir);
      const { broken } = judge(hostRowsOf(program.inputs), laws);
      const [first, ...rest] = broken.map(({ law }) => law);
      const host =
        first === undefined
          ? "accepted"
          : Option.getOrElse(ruleOfLaws([first, ...rest]), () => "unnamed");

      return { host, oracle: oracle.kind === "accepted" ? new Set(["accepted"]) : oracle.rules };
    }),
  );

layer(NodeServices.layer, { excludeTestServices: true })("the MathML cn form", (it) => {
  for (const [name, cn] of refused) {
    it.effect(`both judges refuse ${name}`, () =>
      Effect.gen(function* refusal() {
        const { host, oracle } = yield* verdicts(cn);
        assert.strictEqual(host, "attribute-lexical", `${name}: the import's rows give ${host}`);
        assert.isTrue(
          oracle.has("attribute-lexical"),
          `${name}: the oracle gives ${[...oracle].join(", ")}`,
        );
      }),
    );
  }

  for (const [name, cn] of accepted) {
    it.effect(`both judges accept ${name}`, () =>
      Effect.gen(function* acceptance() {
        const { host, oracle } = yield* verdicts(cn);
        assert.strictEqual(host, "accepted", `${name}: the import's rows give ${host}`);
        assert.isTrue(
          oracle.has("accepted"),
          `${name}: the oracle gives ${[...oracle].join(", ")}`,
        );
      }),
    );
  }
});
