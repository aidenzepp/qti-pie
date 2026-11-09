/**
 * A resource's type as an optional part (the boundary class, option B): the host writes a
 * `ResourceTyped` exactly where the type spells a handle, so the typed hrefs (`typedHrefsOf`, the
 * query `TypedHref`'s rows) are its href's, and their (path, type) pairs are the case's; the law
 * oracle's verdict and the laws it finds broken over each case of reading 93's box are the stated
 * ones, the import's rows, judged on the host, are refused under the same rule, or by nothing
 * where the case breaks a rule over the query, which the host leaves to the database, and a type
 * that spells nothing breaks AL1 alone; and a path two types name is the document its root bears
 * out, in either order (reading 162).
 *
 * Oracle: the specification as a checker, spec readings 67 (a resource's `type` is its version's
 * enumeration, an `xs:string` restriction whose whitespace is preserved, XSD 1.1 Part 2 §4.3.6), 93
 * (a document has one type, so one path under two document types is refused) and 162 (that type is
 * the one its root bears out), and the law oracle's verdict on each case.
 */
import { randomUUID } from "node:crypto";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Array as Arr, Effect, Formatter, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { typedHrefsOf } from "#pantry/import/overlays/package.ts";
import { readProgram } from "#pantry/import/program.ts";
import { rulesOf } from "#pantry/import/refusal.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import { materializeSpec, specOf } from "#pantry/test/fixtures.ts";
import type { Edit } from "#pantry/test/fixtures.ts";
import { hostVerdictOf } from "#pantry/test/gen/genetic/host-laws.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { resourceTypeCases } from "#pantry/test/resource-type-cases.ts";

/**
 * The composed grammar every case is judged by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The timeout, in milliseconds, that each of this file's tests states: a hang guard, never a
 * budget. Measured 2026-11-07: 2.8 s at a load average of 85 to 93, its slowest test.
 */
const testTimeoutMs = 120_000;

/**
 * The type `simple`'s one resource lists its item under.
 */
const itemType = "imsqti_item_xmlv3p0";

/**
 * Every other type `RootOfType` maps, each of which lists a document whose root an item's is not.
 */
const otherTypes = [...new Set(grammar.package.rootOfType.rows.map(({ type }) => type))].filter(
  (type) => type !== itemType,
);

/**
 * `simple`'s item path listed again under another type, its resource before the item's or after.
 *
 * @param type - The other type.
 * @param before - Whether its resource comes first.
 * @returns The edit of `simple`'s manifest.
 */
const listedAgain = (type: string, before: boolean): Edit => {
  const resource = `<resource identifier="again" type="${type}" href="choice.xml"><file href="choice.xml"/></resource>`;

  return before
    ? {
        _tag: "ReplaceText",
        file: "imsmanifest.xml",
        replacement: `<resources>${resource}`,
        search: "<resources>",
      }
    : {
        _tag: "ReplaceText",
        file: "imsmanifest.xml",
        replacement: `${resource}</resources>`,
        search: "</resources>",
      };
};

/**
 * Judge `simple` with its item path listed again under another type, on both sides: the law
 * oracle's breaches, the laws the import's rows break on the host, and the type of the document
 * the import writes at the path.
 *
 * @param type - The other type.
 * @param before - Whether its resource comes first.
 * @returns The three, the laws each by name, sorted.
 */
const judgedListedAgain = (type: string, before: boolean) =>
  Effect.gen(function* judgedAgain() {
    const simple = specOf("simple");
    const dir = yield* materializeSpec({
      ...simple,
      edits: [...simple.edits, listedAgain(type, before)],
      name: `listed-again-${type.replaceAll(/[^\da-z]+/giu, "-")}-${before ? "before" : "after"}`,
    });
    const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
    const minted = new Set<string>();
    const { inputs } = yield* readProgram(dir, (): NodeId => {
      const id: NodeId = randomUUID();
      minted.add(id);

      return id;
    });

    return {
      host: [...hostVerdictOf(inputs, minted).broken.keys()].toSorted(),
      oracle:
        judgment._tag === "Judged"
          ? [...new Set(judgment.breaches.map(({ law }) => law))].toSorted()
          : [judgment.rule],
      types: [...inputs.Document.values()].flatMap(({ documentType, path }) =>
        path === "choice.xml" ? [documentType] : [],
      ),
    };
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "import/overlays/package.ts, a resource's type",
  (it) => {
    for (const {
      broken,
      byQuery,
      edits,
      label,
      named,
      resources,
      typed,
      verdict,
    } of resourceTypeCases) {
      it.effect(
        `writes a type only where it spells a handle, and judges ${label} by reading 93`,
        () =>
          Effect.gen(function* resourceTypeCase() {
            const simple = specOf("simple");
            const dir = yield* materializeSpec({
              ...simple,
              edits: [...simple.edits, ...edits],
              name: `resource-types-${label.replaceAll(/[^\da-z]+/giu, "-")}`,
            });
            const judgment = yield* judge(yield* readPackage(dir), grammar, laws);
            const minted = new Set<string>();
            const { inputs } = yield* readProgram(dir, (): NodeId => {
              const id: NodeId = randomUUID();
              minted.add(id);

              return id;
            });
            const host = hostVerdictOf(inputs, minted);

            assert.deepStrictEqual(verdictOf(judgment), verdict, Formatter.format(judgment));
            assert.sameMembers(
              judgment._tag === "Judged" ? judgment.breaches.map(({ law }) => law) : [],
              [...broken],
              "the laws broken",
            );
            assert.strictEqual(
              Arr.isReadonlyArrayNonEmpty(host.brokenLaws)
                ? Option.getOrUndefined(Arr.head(rulesOf(host.brokenLaws)))
                : undefined,
              verdict.verdict === "accepted" || byQuery ? undefined : verdict.rule,
              "the import's rows, judged on the host, refused under the same rule, or by nothing where the law they break is a rule over a query, the database's alone",
            );

            assert.strictEqual(inputs.Resource.size, resources, "a Resource a resource");
            assert.strictEqual(inputs.ResourceTyped.size, typed, "a ResourceTyped a typed one");

            const typedHrefs = typedHrefsOf(inputs);
            assert.strictEqual(typedHrefs.length, typed, "a typed href a typed resource's href");
            assert.sameMembers(
              [...new Set(typedHrefs.map(({ path, type }) => JSON.stringify([path, type])))],
              named.map((pair) => JSON.stringify(pair)),
              "the typed hrefs' (path, type) pairs",
            );
          }),
        testTimeoutMs,
      );
    }

    it.effect(
      "reads a path two types name as the document its root bears out, whatever order the manifest lists them in (reading 162)",
      () =>
        // Oracle: spec reading 162, the specification as a checker: of the types a path's resources
        // name, the document is the one its root bears out, so the other type's href breaks
        // Document entry and RootOfType holds, whichever resource is listed first. The href breaks
        // Document entry's rule over the query `TypedHref` (`src/qti/queries.ts`), which the host's
        // judge leaves to the database, so the import's rows judged on the host break nothing.
        // Bound: simple's item path listed again under each other type RootOfType maps, before the
        // item's resource and after it.
        Effect.gen(function* rootBearsOut() {
          for (const type of otherTypes) {
            const first = yield* judgedListedAgain(type, true);
            const last = yield* judgedListedAgain(type, false);

            assert.deepStrictEqual(first, last, `${type}: either order`);
            assert.deepStrictEqual(first.types, [itemType], `${type}: the document's type`);
            assert.include(first.oracle, "Document entry", `${type}: the oracle`);
            assert.notInclude(first.oracle, "RootOfType", `${type}: the oracle`);
            assert.deepStrictEqual(first.host, [], `${type}: the host`);
          }
        }),
      testTimeoutMs,
    );
  },
);
