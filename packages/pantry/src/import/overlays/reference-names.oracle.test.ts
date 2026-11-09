/**
 * A value names something only where it is an NCName (spec reading 152): a variable reference's, a
 * binding's, a declaration's identifier or a record field's `field-identifier`. Each is typed
 * `IdentifierDType` or, for a literal-or-reference union, holds a variable by its
 * `VariableStringDType` member, both `xs:NCName`, so a value outside that lexical space, empty,
 * whitespace, `1a`, `a b`, or a name only a later edition of XML admits, names nothing: no
 * reference, binding or name row holds it, and its value domain refuses it alone, on the import's
 * rows as in the law oracle. The import read any string as a name before, its rows breaking
 * "Template reference", "Feedback reference", "Printed variable reference", "Context variable
 * reference", "Binding declared", "Variable declared" or "E1 derived" beside the value domain the
 * oracle alone raises. A declaration whose identifier names nothing keeps its row and every row
 * below it, and has no name alone (spec reading 157), so the laws over its type and values judge it
 * alike on both sides: `known` records the classes the box meets that no NCName reading causes.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), which
 * holds the two to one verdict and one rule: no case shows a disagreement but a class a lane's open
 * fix owns (`known`).
 *
 * Bound: the every-relation package with one attribute's value replaced, each attribute that names
 * something (a `VariableReference` row's, a binding's, a declaration's `identifier`, a value's
 * `field-identifier`) at its first occurrence in each document that writes it, by each of
 * {@link valuesOf}: 49 attributes and 7 values, 343 packages, exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { grammar, interactionKinds } from "#pantry/grammar/install.ts";
import { declarationKinds } from "#pantry/qti/declarations.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, recordsClassOf, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import type { Signature } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { bindingAttributes } from "#pantry/vocab/terms/interactions.ts";

/**
 * The oracle's law tables over the composed grammar.
 */
const laws = lawsOf(grammar);

/**
 * The signatures of the disagreements a lane's open fix owns (`#pantry/test/gen/genetic/known.ts`),
 * which the box sets aside.
 */
const recorded: readonly Signature[] = known.map(({ signature }) => signature);

/**
 * The package every case starts from.
 */
const base = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });

/**
 * The text of each XML document of {@link base}, by path.
 */
const texts: ReadonlyMap<string, string> = new Map(
  [...base]
    .filter(([path]) => path.endsWith(".xml"))
    .map(([path, bytes]) => [path, new TextDecoder().decode(bytes)] as const),
);

/**
 * Each attribute that names something, by its element's kind, which a kind of the grammar's that
 * holds a dot qualifies by its context (`qti-template-inline.rubric`): every `VariableReference`
 * row's, each interaction's bindings, each declaration's `identifier` and a value's
 * `field-identifier`.
 */
const naming: readonly { readonly attribute: string; readonly kind: string }[] = [
  ...grammar.references.variableReference.rows,
  ...interactionKinds.flatMap((kind) =>
    bindingAttributes.map((attribute) => ({ attribute, kind })),
  ),
  ...declarationKinds.map((kind) => ({ attribute: "identifier", kind })),
  { attribute: "field-identifier", kind: "qti-value" },
];

/**
 * One attribute of the box: its document and the document's text, its element's tag and name, and
 * where its value sits in the text.
 */
interface Site {
  readonly attribute: string;
  readonly at: number;
  readonly path: string;
  readonly tag: string;
  readonly text: string;
  readonly value: string;
}

/**
 * Each attribute of {@link naming} at its first occurrence in each document of {@link base} that
 * writes it, each (document, tag, attribute) once.
 */
const sites: readonly Site[] = [
  ...new Map(
    naming.flatMap(({ attribute, kind }) => {
      const tag = kind.replace(/\..*$/u, "");

      return [...texts].flatMap(([path, text]) =>
        [...text.matchAll(new RegExp(`<${tag}\\s(?:[^>]*?\\s)?${attribute}="([^"]*)"`, "gu"))]
          .slice(0, 1)
          .flatMap(({ 0: written, 1: value, index }) =>
            value === undefined
              ? []
              : [
                  [
                    `${path} ${tag} ${attribute}`,
                    {
                      at: index + written.length - value.length - 1,
                      attribute,
                      path,
                      tag,
                      text,
                      value,
                    },
                  ] as const,
                ],
          ),
      );
    }),
  ).values(),
];

/**
 * What a value of the box is: the package's own, an NCName no declaration or reference shares, or
 * a value that is no NCName.
 */
type Situation = "a non-NCName" | "an unshared NCName" | "its own value";

/**
 * The values each attribute takes, with what each is: its own, which names what the package means
 * it to (or, of a literal-or-reference attribute, its literal); an NCName nothing else in the
 * package writes; the empty value; whitespace alone; a name that starts with a digit; two names;
 * and `٠a`, whose first character, ARABIC-INDIC DIGIT ZERO, starts a name in XML 1.0's fifth
 * edition but is a digit in the `Letter` tables `xs:NCName` reads.
 *
 * @param own - The attribute's value in the package.
 * @returns The values.
 */
const valuesOf = (
  own: string,
): readonly { readonly situation: Situation; readonly value: string }[] => [
  { situation: "its own value", value: own },
  { situation: "an unshared NCName", value: "UNSHARED" },
  ...["", "  ", "1a", "a b", "٠a"].map((value) => ({
    situation: "a non-NCName" as const,
    value,
  })),
];

/**
 * Every case: a site and a value.
 */
const cases = sites.flatMap((site) => valuesOf(site.value).map((held) => ({ ...held, site })));

/**
 * Write a case's package: the base, its site's value replaced.
 *
 * @param site - The site.
 * @param value - Its value.
 * @returns Its entries.
 */
const packageOf = ({ at, path, text, value: own }: Site, value: string): PackageEntries =>
  new Map([
    ...base,
    [path, new TextEncoder().encode(`${text.slice(0, at)}${value}${text.slice(at + own.length)}`)],
  ]);

layer(NodeServices.layer, { excludeTestServices: true })("a value that is no NCName", (it) => {
  it.effect(
    "names nothing, so its value domain alone refuses it, on the import's rows as in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* referenceNamesRuns() {
          const directory = yield* scratchDirectory("reference-names-");
          const bench = { directory, grammar, laws };
          assert.isAtLeast(sites.length, 40, "the base writes each class of naming attribute");

          return yield* exhaust(
            {
              box: "the every-relation package with one naming attribute's value replaced by its own, an unshared NCName, or a value that is no NCName",
              caseHang: Duration.minutes(5),
              coverage: requiredInSpace<Situation>([
                "a non-NCName",
                "an unshared NCName",
                "its own value",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const held = cases[at];

                return held === undefined
                  ? String(at)
                  : `${held.site.path} ${held.site.tag} ${held.site.attribute}=${JSON.stringify(held.value)}`;
              },
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host",
              },
              suite: "pantry/reference-names",
            },
            (at: number, c) =>
              Effect.gen(function* referenceNamesCase() {
                const held = cases[at];
                assert.isDefined(held, `no case ${String(at)}`);

                const { site, situation, value } = held;
                c.note(situation);

                const judged = yield* judgeOne(yield* genomeOf(packageOf(site, value)), bench, at);

                assert.deepStrictEqual(
                  judged.disagreements
                    .filter((disagreement) => !recordsClassOf(recorded, disagreement))
                    .map(shownDisagreement),
                  [],
                  `${site.path} ${site.tag} ${site.attribute}=${JSON.stringify(value)}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                );
              }),
          );
        }).pipe(Effect.scoped),
      ),
    600_000,
  );
});
