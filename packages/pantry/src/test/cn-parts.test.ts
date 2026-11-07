/**
 * The parts of a typed `m:cn`, judged twice (spec reading 2, MathML 3 §4.2.1): the law oracle's
 * verdict over the package, and the schema's own laws over the import's rows
 * (`#pantry/test/host-judge.ts`), and the two must be one.
 *
 * The oracle counts the parts of every `cn` whose `type` lists a form, whatever its `base` and
 * whatever its parts hold, so a `cn` of `base` outside 2 to 36, or with a part that holds an
 * element, is refused for a wrong count as any other is. The host once judged only the `cn`s whose
 * digits it could read, so it accepted those (audit e8db90e1, F7). Each case is a `cn` written into
 * the base item; the controls have the right count and are accepted by both.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { lawIdentity, ruleOfLaws } from "#pantry/import/refusal.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { itemResource, manifestOf, packageOf, withItem } from "#pantry/test/probe.ts";

/**
 * A `cn` case: its markup, whether both judges must accept it, and the rule they refuse it under.
 */
interface CnCase {
  readonly cn: string;
  readonly name: string;
  readonly refused: boolean;
}

/**
 * The cases: the audit's failing inputs, their controls, and the surplus the host already refused.
 */
const cases: readonly CnCase[] = [
  {
    cn: '<m:cn type="rational" base="40">1<m:sep/>2<m:sep/>3</m:cn>',
    name: "base 40 rational of three parts",
    refused: true,
  },
  {
    cn: '<m:cn type="rational" base="40">1<m:sep/>2<m:sep/>3<m:sep/>4</m:cn>',
    name: "base 40 rational of four parts",
    refused: true,
  },
  {
    cn: '<m:cn type="rational" base="40">1</m:cn>',
    name: "base 40 rational of one part",
    refused: true,
  },
  {
    cn: '<m:cn type="rational" base="">1<m:sep/>2<m:sep/>3</m:cn>',
    name: "empty base rational of three parts",
    refused: true,
  },
  {
    cn: '<m:cn type="rational" base="1">1<m:sep/>2<m:sep/>3</m:cn>',
    name: "base 1 rational of three parts",
    refused: true,
  },
  {
    cn: '<m:cn type="rational"><m:mglyph src="glyph.png"/><m:sep/>2<m:sep/>3</m:cn>',
    name: "mglyph part, rational of three parts",
    refused: true,
  },
  {
    cn: '<m:cn type="integer" base="40">1<m:sep/>2</m:cn>',
    name: "base 40 integer of two parts",
    refused: true,
  },
  {
    cn: '<m:cn type="rational">1<m:sep/>2<m:sep/>3</m:cn>',
    name: "rational surplus",
    refused: true,
  },
  { cn: '<m:cn type="real">1<m:sep/>2</m:cn>', name: "real surplus", refused: true },
  {
    cn: '<m:cn type="rational" base="40">1<m:sep/>2</m:cn>',
    name: "base 40 rational of two parts",
    refused: false,
  },
  {
    cn: '<m:cn type="rational"><m:mglyph src="glyph.png"/><m:sep/>2</m:cn>',
    name: "mglyph part, rational of two parts",
    refused: false,
  },
  {
    cn: '<m:cn type="rational">1<m:sep/>2</m:cn>',
    name: "rational of two parts",
    refused: false,
  },
  {
    cn: '<m:cn type="integer" base="40">1</m:cn>',
    name: "base 40 integer of one part",
    refused: false,
  },
  {
    cn: '<m:cn type="constant" base="40">1<m:sep/>2<m:sep/>3</m:cn>',
    name: "type no form lists, any parts",
    refused: false,
  },
];

/**
 * The base package with the case's `cn` in its item body, and the `glyph.png` an `mglyph` names.
 *
 * @param cn - The `cn`'s markup.
 * @returns The package's files by path.
 */
const filesOf = (cn: string) => {
  const edited = withItem(
    '<p id="intro">Pick one.</p>',
    `<p id="intro">Pick one.</p><m:math>${cn}</m:math>`,
  );

  return {
    "glyph.png": "png",
    "imsmanifest.xml": manifestOf(
      itemResource.replace(
        '<file href="item.xml"/>',
        '<file href="item.xml"/><file href="glyph.png"/>',
      ),
    ),
    "item.xml": edited["item.xml"].replace(
      "<qti-assessment-item ",
      '<qti-assessment-item xmlns:m="http://www.w3.org/1998/Math/MathML" ',
    ),
  };
};

/**
 * Every law the host judges, read once.
 */
const laws = judgedLaws(Qti.statements);

layer(NodeServices.layer, { excludeTestServices: true })("the parts of a typed cn", (it) => {
  it.effect("is counted whatever its base and whatever its parts hold, by both judges", () =>
    Effect.gen(function* eachCase() {
      for (const { cn, name, refused } of cases) {
        const files = filesOf(cn);
        const verdict = yield* oracleVerdict(packageOf(files));
        const entries = new Map(
          Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)]),
        );
        const { broken } = yield* Effect.scoped(
          Effect.gen(function* host() {
            const dir = yield* scopedPackage(entries);
            const program = yield* readProgram(dir);

            return judge(hostRowsOf(program.inputs), laws);
          }),
        );
        const [first, ...rest] = broken.map(({ law }) => law);
        const rule =
          first === undefined
            ? "accepted"
            : Option.getOrElse(ruleOfLaws([first, ...rest]), () => "unnamed");
        const rules = verdict.kind === "accepted" ? new Set(["accepted"]) : verdict.rules;
        const shown = `${name}: the import's rows give ${rule} (${broken.map(({ law }) => lawIdentity(law)).join("; ") || "no law"}), the oracle ${[...rules].join(", ")}`;

        assert.strictEqual(verdict.kind === "accepted", !refused, shown);
        assert.isTrue(rules.has(rule), shown);
        if (refused) {
          assert.isTrue(rules.has("attribute-lexical"), shown);
        }
      }
    }),
  );
});
