/**
 * The HTML overlays' laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3),
 * written to run at Z and never by a hand: each refused package is refused under the law its one
 * edit of `simple` breaks (membership in the outcome's `refused.laws`, since one native object may
 * discharge several, C22), and the nearest valid package beside it is accepted whole.
 *
 * - **Reading 124:** a `source` in a `picture` without `srcset`, and one in a `video` or an `audio`
 *   without `src`, each by its check on `Node` (main's `content-b.test.ts` case of a picture's
 *   source with no `SourceSrcset` row, ported to this tree's laws).
 * - **Reading 125:** a `track` with no `kind` and no `srclang`, by its check on `Node`, and one whose
 *   `kind` is `subtitles`, by the containment between the two `Attribute` selections (main's case
 *   of a subtitles track with no `TrackSrclang` row, ported).
 * - **Reading 126:** a cell whose `headers` name a `th` of another table, nested or enclosing, or a
 *   `td`, by the containment of `HeaderToken(table, token)` in `TableHeader(table, id)`; a token
 *   named twice by `HeaderToken`'s key (main's `same-table-headers` guard case, ported); and the
 *   overlay's rows held to the tree, by an edit of the package's inputs that writes a state no
 *   valid document shreds to.
 */
import { Db, query, v } from "@bjornpagen/grizzle";
import type { ApplyOutcome, Law } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Layer } from "effect";
import { describe } from "vitest";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { readProgram } from "#pantry/import/program.ts";
import { changeSetOf } from "#pantry/import/write.ts";
import type { PackageInputs } from "#pantry/import/write.ts";
import { Author, AuthorApp } from "#pantry/test/qti.ts";
import { Package } from "#pantry/qti/package.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { TextEdit } from "#pantry/test/fixtures.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The tarball member `simple` is extracted from.
 */
const simpleMember = "qtiv3-examples/packaging/simple/simple.zip";

/**
 * An external URL, which the package's reference laws admit and never resolve.
 */
const url = "https://example.com/a";

/**
 * `simple` with markup inserted into its item body before its choice interaction, where flow
 * content stands, materialized once under its own name.
 *
 * @param name - The fixture's name.
 * @param markup - The markup.
 * @returns The package's directory.
 */
const withBody = (name: string, markup: string) => {
  const edit: TextEdit = {
    _tag: "ReplaceText",
    file: "choice.xml",
    replacement: `${markup}<qti-choice-interaction`,
    search: "<qti-choice-interaction",
  };

  return materializeSpec({ edits: [edit], member: simpleMember, name: `rv-h-${name}` });
};

/**
 * Pick a check of one relation by its name.
 *
 * @param relation - The relation.
 * @param name - The check's name.
 * @returns The predicate.
 */
const checkNamed =
  (relation: string, name: string) =>
  (law: Law): boolean =>
    law.kind === "check" && law.relation === relation && law.name === name;

/**
 * Pick a containment by the relations and fields of its two sides.
 *
 * @param from - The source's relation and its terms.
 * @param to - The target's relation and its terms.
 * @returns The predicate.
 */
const containedIn =
  (from: readonly [string, ...string[]], to: readonly [string, ...string[]]) =>
  (law: Law): boolean =>
    law.kind === "contained" &&
    [law.from.relation, ...law.from.terms.map(({ field }) => field)].join(" ") === from.join(" ") &&
    [law.to.relation, ...law.to.terms.map(({ field }) => field)].join(" ") === to.join(" ");

/**
 * Pick a key by its relation and the fields it reads, in order.
 *
 * @param relation - The relation.
 * @param fields - The key's fields.
 * @returns The predicate.
 */
const keyOn =
  (relation: string, ...fields: readonly string[]) =>
  (law: Law): boolean =>
    law.kind === "key" &&
    law.side.relation === relation &&
    law.side.terms.map(({ field }) => field).join(" ") === fields.join(" ");

/**
 * Whether an outcome is `invariant-rejected` with a law among its `refused.laws` one of the
 * predicates picks.
 *
 * @param outcome - The apply's outcome.
 * @param picks - The laws the case may be refused under.
 * @returns Whether it is.
 */
const rejectedBy = (
  outcome: ApplyOutcome<unknown>,
  picks: readonly ((law: Law) => boolean)[],
): boolean =>
  outcome.kind === "invariant-rejected" &&
  outcome.refused.laws.some((law) => picks.some((pick) => pick(law)));

/**
 * The number of packages stored, through a query that counts each by its key.
 */
const packagesCounted = query(Author).rule((r) => {
  const { id } = v(Package, "package");

  return r.match(Package, { id }).find({ total: r.count() });
});

/**
 * Count the packages stored.
 */
const storedPackages = Effect.gen(function* storedPackages() {
  const db = yield* Db.open(AuthorApp.roles.author, {});
  const rows = yield* (yield* db.execute(packagesCounted, {})).collect;

  return rows[0]?.total ?? 0n;
});

/**
 * Build a package's ChangeSet with one edit of its inputs, and apply it.
 *
 * @param dir - The valid package.
 * @param edit - The edit of its inputs; none applies the package as read.
 * @returns The apply's outcome.
 */
const applyEdited = (
  dir: string,
  edit: (inputs: PackageInputs) => PackageInputs = (held) => held,
) =>
  Effect.gen(function* appliesEdited() {
    const program = yield* readProgram(dir);
    const db = yield* Db.open(AuthorApp.roles.author, {});

    return yield* db.apply(changeSetOf(Author, edit(program.inputs)), {});
  });

/**
 * The markup of every valid form the three readings read: a picture's source with `srcset`, a
 * video's and an audio's with `src`, a track with `srclang`, a captions track with none, and cells
 * of two nested tables, a `th` and a `td`, naming headers of their own tables, padded.
 */
const validBody = `<p><picture><source srcset="${url}.png"/><img src="${url}.png" alt="a"/></picture></p><div><video><source src="${url}.mp4"/><track src="${url}.vtt" srclang="en"/><track kind="captions" src="${url}.vtt"/></video><audio><source src="${url}.mp3"/></audio></div><table><tbody><tr><th id="ho">H</th><th id="hp" headers="ho">P</th><td headers=" hp  ho ">a</td></tr><tr><td><table><tbody><tr><th id="hi">I</th><td headers="hi">b</td></tr></tbody></table></td></tr></tbody></table>`;

/**
 * A body of two nested tables, the cell under test the inner table's, naming the outer table's
 * header.
 */
const enclosingBody = `<table><tbody><tr><th id="ho">H</th><td>a</td></tr><tr><td><table><tbody><tr><th id="hi">I</th><td headers="ho">b</td></tr></tbody></table></td></tr></tbody></table>`;

/**
 * The refused cases, one law's breach each: the package's apply, the laws it may be refused
 * under, and its name.
 */
const refusedCases = [
  {
    apply: () =>
      Effect.flatMap(
        withBody(
          "picture-src",
          `<p><picture><source src="${url}.png"/><img src="${url}.png" alt="a"/></picture></p>`,
        ),
        (dir) => applyEdited(dir),
      ),
    laws: [checkNamed("Node", "Picture_source_srcset")],
    name: "a picture's source with src and no srcset (Picture source srcset, reading 124)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody("video-source", `<div><video src="${url}.mp4"><source/></video></div>`),
        (dir) => applyEdited(dir),
      ),
    laws: [checkNamed("Node", "Media_source_src")],
    name: "a video's source with no src (Media source src, reading 124)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody("audio-srcset", `<div><audio><source srcset="${url}.png"/></audio></div>`),
        (dir) => applyEdited(dir),
      ),
    laws: [checkNamed("Node", "Media_source_src")],
    name: "an audio's source with srcset and no src (Media source src, reading 124)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody(
          "track-default",
          `<div><video src="${url}.mp4"><track src="${url}.vtt"/></video></div>`,
        ),
        (dir) => applyEdited(dir),
      ),
    laws: [checkNamed("Node", "Track_srclang")],
    name: "a track with no kind and no srclang (Track srclang, reading 125)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody(
          "track-subtitles",
          `<div><video src="${url}.mp4"><track kind="subtitles" src="${url}.vtt"/></video></div>`,
        ),
        (dir) => applyEdited(dir),
      ),
    laws: [containedIn(["Attribute", "node"], ["Attribute", "node"])],
    name: "a subtitles track with no srclang (Track srclang, reading 125)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody(
          "headers-other-table",
          `<table><tbody><tr><th id="h1">h</th></tr></tbody></table><table><tbody><tr><td headers="h1">a</td></tr></tbody></table>`,
        ),
        (dir) => applyEdited(dir),
      ),
    laws: [containedIn(["HeaderToken", "table", "token"], ["TableHeader", "table", "id"])],
    name: "a td whose headers name a th of another table (Table headers, reading 126)",
  },
  {
    apply: () =>
      Effect.flatMap(withBody("headers-enclosing", enclosingBody), (dir) => applyEdited(dir)),
    laws: [containedIn(["HeaderToken", "table", "token"], ["TableHeader", "table", "id"])],
    name: "a nested table's td whose headers name the enclosing table's th (Table headers, reading 126)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody(
          "headers-td",
          `<table><tbody><tr><td id="d1">d</td><td headers="d1">a</td></tr></tbody></table>`,
        ),
        (dir) => applyEdited(dir),
      ),
    laws: [containedIn(["HeaderToken", "table", "token"], ["TableHeader", "table", "id"])],
    name: "a td whose headers name a td (Table headers, reading 126)",
  },
  {
    apply: () =>
      Effect.flatMap(
        withBody(
          "headers-twice",
          `<table><tbody><tr><th id="h1">h</th><td headers="h1 h1">a</td></tr></tbody></table>`,
        ),
        (dir) => applyEdited(dir),
      ),
    laws: [keyOn("HeaderToken", "node", "token")],
    name: "a td whose headers name one th twice (Table headers, reading 126)",
  },
  {
    apply: () =>
      Effect.flatMap(withBody("valid", validBody), (dir) =>
        applyEdited(dir, (inputs) => ({
          ...inputs,
          CellHeaders: new Map([...inputs.CellHeaders].slice(1)),
        })),
      ),
    laws: [containedIn(["Attribute", "node", "lexical"], ["CellHeaders", "node", "lexical"])],
    name: "a cell's headers with no CellHeaders row (E1 derived)",
  },
  {
    apply: () =>
      Effect.flatMap(withBody("valid", validBody), (dir) =>
        applyEdited(dir, (inputs) => {
          const tables = new Set([...inputs.CellHeaders.values()].map(({ table }) => table));
          const [first, ...rest] = [...inputs.CellHeaders];
          const other = [...tables].find((table) => table !== first?.[1].table);

          return first === undefined || other === undefined
            ? assert.fail("the valid body's cells stand in two tables")
            : {
                ...inputs,
                CellHeaders: new Map([[first[0], { ...first[1], table: other }], ...rest]),
              };
        }),
      ),
    laws: [
      containedIn(["CellHeaders", "node", "table"], ["TableScope", "node", "table"]),
      containedIn(["HeaderToken", "table", "token"], ["TableHeader", "table", "id"]),
    ],
    name: "a cell's headers placed in a table its scope does not reach (E1 derived)",
  },
  {
    apply: () =>
      Effect.flatMap(withBody("valid", validBody), (dir) =>
        applyEdited(dir, (inputs) => ({
          ...inputs,
          TableScope: new Map(
            [...inputs.TableScope].map(([node, row]) => [
              node,
              row.kind === "tbody" ? { ...row, table: row.node } : row,
            ]),
          ),
        })),
      ),
    laws: [containedIn(["TableScope", "parent", "table"], ["TableScope", "node", "table"])],
    name: "a tbody's scope that names itself as its table (E1 derived)",
  },
];

describe.skipIf(!hasLease)(
  "qti/html.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the HTML element laws, judged by PostgreSQL", (it) => {
      it.effect("accepts simple with every valid form of readings 124 to 126 in its body", () =>
        // Oracle: PostgreSQL, every law of the schema over a package whose sources, tracks and
        // cells each meet readings 124, 125 and 126.
        Effect.gen(function* accepted() {
          const before = yield* storedPackages;
          const outcome = yield* applyEdited(yield* withBody("valid", validBody));

          assert.strictEqual(outcome.kind, "accepted", Formatter.format(outcome));
          assert.strictEqual(yield* storedPackages, before + 1n);
        }),
      );

      for (const { apply, laws, name } of refusedCases) {
        it.effect(`refuses ${name}`, () =>
          // Oracle: PostgreSQL, the law the case's one edit breaks, named in the outcome's `refused.laws`.
          Effect.gen(function* refused() {
            const before = yield* storedPackages;
            const outcome = yield* apply();

            assert.isTrue(rejectedBy(outcome, laws), `${name}: ${Formatter.format(outcome)}`);
            assert.strictEqual(yield* storedPackages, before);
          }),
        );
      }
    });
  },
);
