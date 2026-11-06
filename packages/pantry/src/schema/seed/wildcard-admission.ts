/**
 * The `Admission` rows that name `foreign`, or a typed global, under a wildcard host.
 *
 * A pure function of the wildcard tables (`seed/wildcard.ts`) and of the registries' kinds, so a
 * row a later unit appends to those tables enters with no edit here. The rows are the spec's
 * W03b: `(host, foreign)` for every lax element wildcard host and for the two manifest-set strict
 * hosts, under whose `##other` an opaque global falls, and `(host or foreign, K)` for every
 * global element whose kind `K` the registries name and whose namespace the host's policy admits.
 */
import { Option } from "effect";

import type { NamespacePolicyHandle } from "#pantry/schema/content/rosters.ts";
import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";
import type { GlobalRow, WildcardHostRow } from "#pantry/schema/seed/wildcard.ts";

/**
 * What the derivation needs of a registry row: the element name that selects the kind, and
 * whether the row is a plain candidate (no parent).
 */
export type KindRegistryLike = Readonly<
  Record<string, Pick<RegistryRow, "local" | "namespace" | "parent">>
>;

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const mathml = "http://www.w3.org/1998/Math/MathML";

/**
 * The manifest-set strict hosts that store an opaque global as `foreign` (decision 105).
 */
const strictForeignHosts: ReadonlySet<string> = new Set([
  "cp:metadata.file",
  "drd:accessForAllResource",
]);

/**
 * The kind `template` is excepted until phase 10 gives it content (spec 4.6).
 */
const exceptedKinds: ReadonlySet<string> = new Set(["template"]);

/**
 * Whether a wildcard of `policy`, relative to `target`, admits an element of `namespace`.
 */
const admitsNamespace = (
  policy: NamespacePolicyHandle,
  target: string,
  namespace: string,
): boolean => {
  if (policy === "any") {
    return true;
  }

  return namespace !== target && (policy === "otherOrLocal" || namespace !== "");
};

/**
 * The kinds the registries name for each `(namespace, local)`: the plain candidates `kindOf`
 * uses, rows with a non-empty `local` and no `parent`.
 */
const kindsByName = (registries: readonly KindRegistryLike[]): ReadonlyMap<string, string[]> => {
  const byName = new Map<string, string[]>();
  for (const registry of registries) {
    for (const [kind, row] of Object.entries(registry)) {
      if (row.local !== "" && Option.isNone(row.parent)) {
        const name = `{${row.namespace}}${row.local}`;
        byName.set(name, [...(byName.get(name) ?? []), kind]);
      }
    }
  }

  return byName;
};

/**
 * The namespace of every kind the registries declare.
 */
const namespaceOfKind = (registries: readonly KindRegistryLike[]): ReadonlyMap<string, string> =>
  new Map(
    registries.flatMap((registry) =>
      Object.entries(registry).map(([kind, row]) => [kind, row.namespace] as const),
    ),
  );

/**
 * The `Admission` rows that name `foreign` or a typed global under a wildcard host, both
 * versions.
 *
 * Under any host that is not a MathML element, and under `foreign`, a MathML kind other than
 * `math` is not admitted: MathML validity is the MathML Recommendation's, which names `math`
 * alone as the root a foreign host may hold (reading 2, decision 110).
 *
 * @param input - The wildcard hosts, the global elements and the registries.
 * @returns The rows, unsorted and not deduplicated against other rows.
 */
export const wildcardAdmissionRows = (input: {
  readonly globals: readonly GlobalRow[];
  readonly hosts: readonly WildcardHostRow[];
  readonly registries: readonly KindRegistryLike[];
}): readonly AdmissionRow[] => {
  const named = kindsByName(input.registries);
  const namespaces = namespaceOfKind(input.registries);
  const rows: AdmissionRow[] = [];
  for (const version of versions) {
    for (const host of input.hosts) {
      const typed = host.process === "lax";
      if (typed || strictForeignHosts.has(host.host)) {
        rows.push({ child: "foreign", parent: host.host, version });
      }

      if (typed) {
        const underMathml = namespaces.get(host.host) === mathml;
        for (const global of input.globals) {
          if (admitsNamespace(host.policy, host.target, global.namespace)) {
            for (const kind of named.get(`{${global.namespace}}${global.local}`) ?? []) {
              const mathmlOnly =
                global.namespace === mathml && global.local !== "math" && !underMathml;
              if (!exceptedKinds.has(kind) && !mathmlOnly) {
                rows.push({ child: kind, parent: host.host, version });
              }
            }
          }
        }
      }
    }
  }

  return rows;
};
