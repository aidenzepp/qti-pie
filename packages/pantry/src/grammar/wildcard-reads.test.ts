/**
 * A `lax` or `strict` wildcard admits a globally declared element as its kind only where a schema
 * set its parent's documents are assessed against declares it, and only in a version that declares
 * it (spec reading 81; XML Schema 1.0 Part 1, §3.10.4, Item Valid (Wildcard), clauses 1 and 2, and
 * §3.3.4, Schema-Validity Assessment (Element), clause 1.1.1.3.2: the element is found by its
 * top-level declaration in the schema the document is assessed against, and only there).
 *
 * Oracle: a second implementation of the schema sets. The test's own reading of the pinned XSDs
 * (`schemaSetOf`, `#pantry/test/xsd-catalog.ts`) takes each document root's XSD and every XSD it
 * imports, includes or redefines, transitively, beside the grammar's hand-stated sets
 * (`#pantry/vocab/open.ts` `wildcardReads`) and `globalKinds`' versions. A kind of a vocabulary
 * stands in the documents of every root whose set lists its namespace, and one grammar serves them
 * all, so its wildcards read what any of those sets declares (reading 81's stated limit); a kind of
 * no vocabulary stands in every document.
 *
 * Bound: every (version, wildcard host, global kind) of both versions, exhausted: each host is a
 * kind whose content admits a foreign kind, so it holds a non-`skip` wildcard, and each global kind
 * is one of `globalKinds`, in any version, of a namespace other than the host's. The box states one
 * direction: an `Admission` row of such a pair needs a root set holding both namespaces, and a
 * version that declares the global. It kills the composition's `wildcardReads` conjunct dropped
 * (compose.ts, 8,730 rows added), and, with one global's versions cut to one version, its version
 * conjunct dropped (a data mutant, since every global of today's pins is in both versions).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, layer } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import { isForeignKind, schemaVersions } from "#pantry/grammar/kinds.ts";
import { schemaSetOf } from "#pantry/test/xsd-catalog.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import { globalKinds } from "#pantry/vocab/inventory/vocabularies.ts";

/**
 * Whether the XSD cache holds every pin.
 */
const cached = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(true),
    Effect.catchTag("XsdSourceMissing", () => Effect.succeed(false)),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The composed grammar.
 */
const grammar = Result.getOrThrow(composed());

/**
 * Read a kind's namespace, empty for a kind of no vocabulary.
 *
 * @param kind - The kind.
 * @returns Its namespace.
 */
const namespaceOf = (kind: string): string =>
  Option.match(grammar.kinds.elementName.lookup({ kind }), {
    onNone: () => "",
    onSome: ({ namespace }) => namespace,
  });

describe.skipIf(!cached)("a wildcard's global elements", () => {
  layer(NodeServices.layer)("the pinned XSDs' schema sets", (it) => {
    it.effect(
      "admit a global as its kind only where a root's schema set holds both namespaces, in a version that declares it: every host and global of both versions",
      () =>
        Effect.gen(function* everyPair() {
          const wrong: string[] = [];
          let pairs = 0;
          for (const version of schemaVersions) {
            const rows = grammar.admission.rows.filter((row) => row.version === version);
            const roots = [
              ...new Set(
                rows
                  .filter((row) => row.parent === "document")
                  .map(({ child }) => namespaceOf(child))
                  .filter((namespace) => namespace !== ""),
              ),
            ];
            const sets: ReadonlySet<string>[] = [];
            for (const root of roots) {
              sets.push(yield* schemaSetOf(version, root).pipe(Effect.orDie));
            }

            const hosts = [
              ...new Set(
                rows.filter(({ child }) => isForeignKind(child)).map(({ parent }) => parent),
              ),
            ];
            for (const host of hosts) {
              const hostNamespace = namespaceOf(host);
              for (const { kind, versions } of globalKinds) {
                const childNamespace = namespaceOf(kind);
                if (childNamespace !== "" && childNamespace !== hostNamespace) {
                  pairs += 1;
                  const shared = sets.some(
                    (set) =>
                      (hostNamespace === "" || set.has(hostNamespace)) && set.has(childNamespace),
                  );
                  const declared = versions.some((held) => held === version);
                  const admitted = Option.isSome(
                    grammar.admission.lookup({ child: kind, parent: host, version }),
                  );
                  if (admitted && !(shared && declared)) {
                    wrong.push(
                      `${version} ${kind} under ${host}: admitted, ${shared ? "" : "no root's schema set holds both namespaces"}${shared || declared ? "" : ", and "}${declared ? "" : `the global is declared in ${versions.join(" and ")} alone`}`,
                    );
                  }
                }
              }
            }
          }

          assert.isAbove(pairs, 0, "some host and global were paired");
          assert.deepStrictEqual(
            wrong.slice(0, 40),
            [],
            "no wildcard admits a global its schema sets or its versions do not declare",
          );
        }),
      { timeout: 120_000 },
    );
  });
});
