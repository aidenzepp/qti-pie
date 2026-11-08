/**
 * A read attribute's value is its lexical form collapsed (XML Schema Part 2, §4.3.6), whatever the
 * form: every attribute an interaction law reads (`readAttributes`, and the ARIA range attributes
 * on every kind) is an atomic XSD type whose whiteSpace is `collapse` (spec reading 7), and a
 * collapsed value with whitespace inside (`max-choices="1 2"`, a reference `"a b"`) is in no such
 * type's lexical space, so its value domain alone refuses it, on the import's rows as in the law
 * oracle. `InteractionAttribute` held each form split into its outer whitespace and a value
 * `E1_derived` held to no whitespace before, so the copy every read attribute asks could not hold
 * beside its split, and such a form broke "E1 derived" beside the value domain the oracle alone
 * raised.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`): no
 * case shows a disagreement but a class a lane's open fix owns (`known`).
 *
 * Bound: the every-relation package with one read attribute's value replaced, each read attribute
 * at its first occurrence on each kind in each document that writes it, by its own value or by each
 * of {@link spaced}'s three values with whitespace inside: every site the base writes, four values
 * each, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar } from "#pantry/grammar/install.ts";
import { ariaNames, readAttributes } from "#pantry/qti/interactions.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, shownDisagreement, signatureOf } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside.
 */
const recorded: ReadonlySet<string> = new Set(Object.keys(known));

/**
 * The package every case starts from.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * The tags each read attribute is read on, by its name: each kind's element name, a kind the
 * grammar qualifies by its context (`qti-template-inline.rubric`) by its element's, and `*` for the
 * ARIA range attributes, which are read on every kind.
 */
const readTags: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ...[...readAttributes].map(
    ([name, kinds]) => [name, new Set(kinds.map((kind) => kind.replace(/\..*$/u, "")))] as const,
  ),
  ...ariaNames.map((name) => [name, new Set(["*"])] as const),
]);

/**
 * One read attribute of the box: its document and the document's text, its element's tag, its name,
 * and where its value sits in the text.
 */
interface Site {
  readonly at: number;
  readonly name: string;
  readonly path: string;
  readonly tag: string;
  readonly text: string;
  readonly value: string;
}

/**
 * A start tag of a document's text: its name and its attributes, each written in double quotes, as
 * the every-relation package writes them.
 */
const startTag = /<(?<tag>[A-Za-z][\w.:-]*)(?<written>(?:\s+[\w.:-]+="[^"]*")*)\s*\/?>/gu;

/**
 * An attribute of a start tag, with its value.
 */
const attribute = /\s(?<name>[\w.:-]+)="(?<value>[^"]*)"/gu;

/**
 * Each read attribute at its first occurrence on each tag in each XML document of {@link base}, each
 * (document, tag, name) once.
 */
const sites: readonly Site[] = [
  ...Map.groupBy(
    [...base]
      .filter(([path]) => path.endsWith(".xml"))
      .flatMap(([path, bytes]) => {
        const text = new TextDecoder().decode(bytes);

        return [...text.matchAll(startTag)].flatMap(({ groups, index }) => {
          const tag = groups?.["tag"];
          const written = groups?.["written"];

          return tag === undefined || written === undefined
            ? []
            : [...written.matchAll(attribute)].flatMap((held) => {
                const name = held.groups?.["name"];
                const value = held.groups?.["value"];
                const tags = name === undefined ? undefined : readTags.get(name);

                return name === undefined ||
                  value === undefined ||
                  tags === undefined ||
                  !(tags.has(tag) || tags.has("*"))
                  ? []
                  : [
                      {
                        at: index + 1 + tag.length + held.index + held[0].length - value.length - 1,
                        name,
                        path,
                        tag,
                        text,
                        value,
                      },
                    ];
              });
        });
      }),
    ({ name, path, tag }) => `${path} ${tag} ${name}`,
  ).values(),
].flatMap(([first]) => (first === undefined ? [] : [first]));

/**
 * What a value of the box is: the package's own, or one whose collapsed form holds whitespace.
 */
type Situation = "its own value" | "whitespace inside";

/**
 * The values with whitespace inside each attribute takes, as written in a double-quoted attribute:
 * two names, two integers, and two names among a tab, a line feed and a carriage return, each a
 * character reference, so the parser keeps it (XML 1.0, §3.3.3), the first and last outside them.
 */
const spaced = ["a b", "1 2", "&#9;a&#10; b&#13;"] as const;

/**
 * Every case: a site and a value.
 */
const cases = sites.flatMap((site) => [
  { site, situation: "its own value" as const, value: site.value },
  ...spaced.map((value) => ({ site, situation: "whitespace inside" as const, value })),
]);

/**
 * Write a case's package: the base, its site's value replaced.
 *
 * @param site - The site.
 * @param value - Its value, as written.
 * @returns Its entries.
 */
const packageOf = ({ at, path, text, value: own }: Site, value: string): PackageEntries =>
  new Map([
    ...base,
    [path, new TextEncoder().encode(`${text.slice(0, at)}${value}${text.slice(at + own.length)}`)],
  ]);

layer(NodeServices.layer, { excludeTestServices: true })(
  "a read attribute whose collapsed value holds whitespace",
  (it) => {
    it.effect(
      "is refused by its value domain alone, on the import's rows as in the law oracle",
      (ctx) =>
        searched(
          ctx,
          Effect.gen(function* collapsedValuesRuns() {
            const directory = yield* scratchDirectory("collapsed-values-");
            const bench = { directory, grammar, laws };
            const names = new Set(sites.map(({ name }) => name));
            for (const name of [
              "response-identifier",
              "identifier",
              "shape",
              "max-choices",
              "min-choices",
              "lower-bound",
              "upper-bound",
              "adaptive",
              "outcome-identifier",
              "template-identifier",
              "base",
              "index",
              "aria-valuemin",
              "aria-valuemax",
            ]) {
              assert.isTrue(names.has(name), `the base writes ${name}`);
            }

            return yield* exhaust(
              {
                box: "the every-relation package with one read attribute's value replaced by its own or by a value whose collapsed form holds whitespace",
                caseHang: Duration.minutes(5),
                coverage: requiredInSpace<Situation>(["its own value", "whitespace inside"]),
                generator: int(0, cases.length - 1),
                limit: cases.length,
                literal: (at) => {
                  const held = cases[at];

                  return held === undefined
                    ? String(at)
                    : `${held.site.path} ${held.site.tag} ${held.site.name}=${JSON.stringify(held.value)}`;
                },
                oracle: {
                  kind: "second-implementation",
                  name: "the law oracle against the laws the import's rows break on the host",
                },
                suite: "pantry/collapsed-values",
              },
              (at: number, c) =>
                Effect.gen(function* collapsedValuesCase() {
                  const held = cases[at];
                  assert.isDefined(held, `no case ${String(at)}`);

                  const { site, situation, value } = held;
                  c.note(situation);

                  const judged = yield* judgeOne(
                    yield* genomeOf(packageOf(site, value)),
                    bench,
                    at,
                  );

                  assert.deepStrictEqual(
                    judged.disagreements
                      .filter((disagreement) => !recorded.has(signatureOf(disagreement)))
                      .map(shownDisagreement),
                    [],
                    `${site.path} ${site.tag} ${site.name}=${JSON.stringify(value)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                  );
                }),
            );
          }).pipe(Effect.scoped),
        ),
      600_000,
    );
  },
);
