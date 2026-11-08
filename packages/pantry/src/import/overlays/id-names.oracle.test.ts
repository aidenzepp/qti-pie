/**
 * An ID names something only where its value is an NCName (spec reading 156, reading 152's for the
 * IDs): an attribute whose domain is `xs:ID`, or a context declaration's `identifier` (spec reading
 * 74), is one of its document's IDs only where its lexical form, collapsed, is in `xs:NCName`'s
 * lexical space, which `xs:ID` restricts. A value outside it, empty, whitespace, `1a`, `a b`, or a
 * name only a later edition of XML admits, is no ID: it has no `DocumentId` row and no binding, and
 * its value domain refuses it, on the import's rows as in the law oracle. An IDREF that names it
 * names no ID, and is refused by its own law ("Idref target", or "Table headers" for a cell's
 * `headers`), never accepted through a row the value should not have. The import wrote a
 * `DocumentId` row for every ID-typed attribute before, so an empty value or one with whitespace
 * inside broke "E1 derived" beside the value domain the oracle alone raises.
 *
 * A `th`'s `id` is the one value the import copies whatever its form: the HTML builder writes its
 * `TableHeader` and judges no form (`#pantry/import/overlays/html.ts`), since the database states
 * which `id` names a header. So where it is no NCName, the import's rows break "E1 derived" through
 * that row's copy back into the ID values whose form names something, or into `DocumentId`, a law
 * of the rows the oracle, which reads documents, never raises: the one disagreement such a case
 * must show, and no other.
 *
 * Oracle: a second implementation, the law oracle (`#pantry/test/oracle.ts` `judge`), against the
 * laws the import's rows break on the host (`#pantry/test/gen/genetic/judge.ts` `judgeOne`), which
 * holds the two to one verdict and one rule: no case shows a disagreement but a class a lane's open
 * fix owns (`known`). Where the references take a value with a token, the specification as a
 * checker beside it: the law oracle raises each reference's own law, since the host reads no row
 * of a `headers` token (`HeaderToken`).
 *
 * Bound: the every-relation package with one ID-typed attribute's value replaced, each at its first
 * occurrence in each document that writes it, by each of {@link valuesOf}, and, where an IDREF or a
 * cell's `headers` of its document names the ID, by each value that is no NCName with every such
 * reference replaced alike: exhausted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { int } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect } from "effect";
import { attributeRows, GoverningOf, grammar, ValueIdentity } from "#pantry/grammar/install.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { genomeOf } from "#pantry/test/gen/genetic/genome.ts";
import { judgeOne, recordsClassOf, shownDisagreement } from "#pantry/test/gen/genetic/judge.ts";
import type { Disagreement, Signature } from "#pantry/test/gen/genetic/judge.ts";
import { known } from "#pantry/test/gen/genetic/known.ts";
import { filesOf } from "#pantry/test/oracle-complete/mutation.ts";
import { judge, lawsOf } from "#pantry/test/oracle.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

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
 * A kind's tag as a document writes it: its local name, its prefix and its context qualifier
 * (`qti-template-inline.rubric`) set apart.
 *
 * @param kind - The kind.
 * @returns Its tag.
 */
const tagOf = (kind: string): string => kind.replace(/^[^:]*:/u, "").replace(/\..*$/u, "");

/**
 * Each (tag, attribute) the grammar reads in a domain of one of `identities`, under any governor
 * and version.
 *
 * @param identities - The identity types.
 * @returns The pairs, each once, as `tag attribute`.
 */
const typedPairs = (identities: readonly string[]): ReadonlySet<string> => {
  const domains = new Set(
    ValueIdentity.rows
      .filter(({ identity }) => identities.includes(identity))
      .map(({ domain }) => domain),
  );
  const typed = attributeRows.filter(({ domain }) => domains.has(domain));

  return new Set(
    GoverningOf.rows.flatMap(({ governor, kind }) =>
      typed.filter((row) => row.governor === governor).map(({ name }) => `${tagOf(kind)} ${name}`),
    ),
  );
};

/**
 * The ID-typed pairs ({@link typedPairs}).
 */
const idPairs = typedPairs(["ID"]);

/**
 * The pairs whose value names IDs: the IDREF- and IDREFS-typed, and a cell's `headers`, whose
 * tokens name `th` IDs (reading 126).
 */
const referringPairs: ReadonlySet<string> = new Set([
  ...typedPairs(["IDREF", "IDREFS"]),
  "td headers",
  "th headers",
]);

/**
 * One attribute value written in a document: where it sits, its element's tag and name, and the
 * value.
 */
interface Written {
  readonly at: number;
  readonly pair: string;
  readonly value: string;
}

/**
 * Every attribute value a document writes on an element whose (tag, attribute) is one of `pairs`,
 * in document order.
 *
 * @param text - The document's text.
 * @param pairs - The (tag, attribute) pairs, as `tag attribute`.
 * @returns The values.
 */
const writtenIn = (text: string, pairs: ReadonlySet<string>): readonly Written[] =>
  [
    ...text.matchAll(
      /<(?:[\w.-]+:)?(?<tag>[\w.-]+)(?<attributes>(?:\s+[^\s=>]+\s*=\s*"[^"]*")*)/gu,
    ),
  ].flatMap(({ 0: element, groups, index }) => {
    const tag = groups?.["tag"];
    const attributes = groups?.["attributes"];
    if (tag === undefined || attributes === undefined) {
      return [];
    }

    const start = index + element.length - attributes.length;

    return [...attributes.matchAll(/\s+(?<name>[^\s=>]+)\s*=\s*"(?<value>[^"]*)"/gu)].flatMap(
      ({ 0: written, groups: named, index: offset }) => {
        const name = named?.["name"];
        const value = named?.["value"];

        return name === undefined || value === undefined || !pairs.has(`${tag} ${name}`)
          ? []
          : [
              {
                at: start + offset + written.length - value.length - 1,
                pair: `${tag} ${name}`,
                value,
              },
            ];
      },
    );
  });

/**
 * One ID-typed attribute of the box: its document and the document's text, its value and where it
 * sits, and the IDREFs and `headers` of its document whose value is exactly its own.
 */
interface Site {
  readonly id: Written;
  readonly path: string;
  readonly references: readonly Written[];
  readonly text: string;
}

/**
 * Each ID-typed attribute at its first occurrence in each document of {@link base} that writes it,
 * each (document, tag, attribute) once.
 */
const sites: readonly Site[] = [...texts].flatMap(([path, text]) =>
  [
    ...new Map(
      writtenIn(text, idPairs)
        .toReversed()
        .map((id) => [id.pair, id] as const),
    ).values(),
  ].map((id) => ({
    id,
    path,
    references: writtenIn(text, referringPairs).filter(({ value }) => value === id.value),
    text,
  })),
);

/**
 * What a value of the box is: the package's own, an NCName nothing else writes, a value that is no
 * NCName, or one written both on the ID and on each reference that named it.
 */
type Situation =
  | "a non-NCName"
  | "a non-NCName its references name"
  | "an unshared NCName"
  | "its own value";

/**
 * Whether a situation writes a value that is no NCName, on the ID alone or on its references too.
 *
 * @param situation - The situation.
 * @returns Whether it does.
 */
const namesNothing = (situation: Situation): boolean =>
  situation === "a non-NCName" || situation === "a non-NCName its references name";

/**
 * Whether a disagreement is the import's rows breaking "E1 derived" through a `TableHeader`: its
 * copy back into the ID-typed attributes whose form names something (`namingIdAttributes`), or
 * into `DocumentId`, which no row holds for a `th`'s `id` that is no NCName
 * (`#pantry/qti/html.ts`), though the HTML builder copies it all the same.
 *
 * @param disagreement - The disagreement.
 * @returns Whether it is.
 */
const isHeaderCopyBack = (disagreement: Disagreement): boolean =>
  disagreement.kind === "import-only-law" &&
  disagreement.law === "E1 derived" &&
  disagreement.broken.kind === "contained" &&
  disagreement.broken.from.relation === "TableHeader";

/**
 * The values that are no NCName: the empty value; whitespace alone; a name that starts with a
 * digit; two names; and `٠a`, whose first character, ARABIC-INDIC DIGIT ZERO, starts a name in XML
 * 1.0's fifth edition but is a digit in the `Letter` tables `xs:NCName` reads.
 */
const nonNames = ["", "  ", "1a", "a b", "٠a"] as const;

/**
 * The values an ID takes, with what each is: its own, an NCName nothing else in the package
 * writes, and each of {@link nonNames}.
 *
 * @param own - The ID's value in the package.
 * @returns The values.
 */
const valuesOf = (
  own: string,
): readonly { readonly situation: Situation; readonly value: string }[] => [
  { situation: "its own value", value: own },
  { situation: "an unshared NCName", value: "UNSHARED" },
  ...nonNames.map((value) => ({ situation: "a non-NCName" as const, value })),
];

/**
 * Every case: a site, a value, and whether the site's references take the value too.
 */
const cases = sites.flatMap((site) => [
  ...valuesOf(site.id.value).map((held) => ({ ...held, edited: [site.id], site })),
  ...(site.references.length === 0
    ? []
    : nonNames.map((value) => ({
        edited: [site.id, ...site.references],
        site,
        situation: "a non-NCName its references name" as const,
        value,
      }))),
]);

/**
 * The law that refuses a reference whose token names no ID: a cell's `headers` token that names no
 * `th` of its table ("Table headers", reading 126), and an IDREF's that names no ID of its document
 * ("Idref target", XML Schema 1.0 Part 1, cvc-id clause 1).
 *
 * @param reference - The reference.
 * @returns Its law.
 */
const referenceLawOf = ({ pair }: Written): string =>
  pair.endsWith(" headers") ? "Table headers" : "Idref target";

/**
 * Write a case's package: the base, each edited value of its site's document replaced.
 *
 * @param site - The site.
 * @param edited - The values replaced: the ID's, and its references' where they take it too.
 * @param value - The value each takes.
 * @returns Its entries.
 */
const packageOf = (
  { path, text: written }: Site,
  edited: readonly Written[],
  value: string,
): PackageEntries => {
  let text = written;
  // From the last value back, so each replacement leaves the places before it as they were.
  for (const { at, value: own } of edited.toSorted((one, other) => other.at - one.at)) {
    text = `${text.slice(0, at)}${value}${text.slice(at + own.length)}`;
  }

  return new Map([...base, [path, new TextEncoder().encode(text)]]);
};

layer(NodeServices.layer, { excludeTestServices: true })("an ID whose value is no NCName", (it) => {
  it.effect(
    "names nothing, so its value domain refuses it, a th's TableHeader copy its copy back beside, and each reference to it its own law, on the import's rows as in the law oracle",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* idNamesRuns() {
          const directory = yield* scratchDirectory("id-names-");
          const bench = { directory, grammar, laws };
          assert.isAtLeast(
            sites.filter(({ references }) => references.length > 0).length,
            3,
            "the base names an attribute ID, a th's ID and a resource by their references",
          );

          return yield* exhaust(
            {
              box: "the every-relation package with one ID-typed attribute's value replaced by its own, an unshared NCName, or a value that is no NCName, alone or with each reference to it",
              caseHang: Duration.minutes(5),
              coverage: requiredInSpace<Situation>([
                "a non-NCName",
                "a non-NCName its references name",
                "an unshared NCName",
                "its own value",
              ]),
              generator: int(0, cases.length - 1),
              limit: cases.length,
              literal: (at) => {
                const held = cases[at];

                return held === undefined
                  ? String(at)
                  : `${held.site.path} ${held.site.id.pair}=${JSON.stringify(held.value)}${held.edited.length > 1 ? " with its references" : ""}`;
              },
              oracle: {
                kind: "second-implementation",
                name: "the law oracle against the laws the import's rows break on the host",
              },
              suite: "pantry/id-names",
            },
            (at: number, c) =>
              Effect.gen(function* idNamesCase() {
                const held = cases[at];
                assert.isDefined(held, `no case ${String(at)}`);

                const { edited, site, situation, value } = held;
                c.note(situation);

                const entries = packageOf(site, edited, value);
                const judged = yield* judgeOne(yield* genomeOf(entries), bench, at);
                const [, ...references] = edited;
                if (references.length > 0 && /[^\t\n\r ]/u.test(value)) {
                  const oracle = yield* judge(filesOf(entries), grammar, laws);
                  assert.includeMembers(
                    oracle._tag === "Judged" ? oracle.breaches.map(({ law }) => law) : [],
                    references.map(referenceLawOf),
                    `${site.path} ${site.id.pair}=${JSON.stringify(value)} with its references: each reference names no ID, so its own law refuses it`,
                  );
                }

                const shown = `${site.path} ${site.id.pair}=${JSON.stringify(value)}${edited.length > 1 ? " with its references" : ""}`;
                const copied = site.id.pair === "th id" && namesNothing(situation);
                const unrecorded = judged.disagreements.filter(
                  (disagreement) => !recordsClassOf(recorded, disagreement),
                );
                assert.deepStrictEqual(
                  unrecorded
                    .filter((disagreement) => !(copied && isHeaderCopyBack(disagreement)))
                    .map(shownDisagreement),
                  [],
                  `${shown}: the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                );
                assert.strictEqual(
                  unrecorded.some(isHeaderCopyBack),
                  copied,
                  `${shown}: the import's rows break E1 derived through a TableHeader exactly where a th's id is no NCName; the oracle ${judged.summary.oracle}; the import ${judged.summary.import}`,
                );
              }),
          );
        }).pipe(Effect.scoped),
      ),
    600_000,
  );
});
