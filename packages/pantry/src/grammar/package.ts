/**
 * The closed relations of a content package's manifest: the resource types a `cp:resource` may
 * name, the schema versions each one holds in, and the root kind of the documents each one lists
 * (fin.md §17, "qti-pie, erased").
 *
 * A text whose legal values are fixed is a roster, so a resource's `type` is a `ResourceType`
 * handle, spelled exactly as its lexical form, which is how the attribute's lexical form derives
 * its code. `ResourceTypeOf` and `RootOfType` are sets of those handles' rows, and grizzle packs
 * each into a constant with no table.
 */
import { Result } from "effect";
import { closed, idField, roster } from "#pantry/grammar/closed.ts";
import type { Closed, ClosedRelationError, IdField, Roster } from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";

/**
 * One statement of resource types: the types, and the schema versions each holds in.
 */
export interface ResourceTypes {
  readonly types: readonly string[];
  readonly versions: readonly SchemaVersion[];
}

/**
 * The root element kind of the documents one resource type lists.
 */
export interface RootOf {
  readonly root: string;
  readonly type: string;
}

/**
 * A vocabulary's share of the package relations: the resource types it states, and the root kinds
 * of the documents a type lists, stated by the vocabulary of the root kind, or by XInclude's for an
 * included fragment, whose root may be a kind of any vocabulary an include stands for.
 */
export interface PackageFacet {
  readonly resourceTypes: readonly ResourceTypes[];
  readonly roots: readonly RootOf[];
}

/**
 * The package relations of a composition.
 */
export interface PackageGrammar {
  /**
   * The `ResourceType` roster.
   */
  readonly resourceType: Roster<string>;
  /**
   * `ResourceTypeOf`, the set of (version, type) pairs a resource may carry: 39 rows, the law on a
   * `Resource`'s (version, type) cell (`resource-type`).
   */
  readonly resourceTypeOf: Closed<
    readonly [IdField<"version", SchemaVersion>, IdField<"type", string>],
    readonly []
  >;
  /**
   * `RootOfType`, the set of (resource type, root element kind) pairs: each type that lists
   * documents with the kinds their roots may be, the law on a `Document`'s (resource type, root
   * kind) cell (`root-type-reverse`). Each type but one has one root; an included fragment's type
   * has every kind an include stands for (spec reading 107). A type absent from it lists no
   * document.
   */
  readonly rootOfType: Closed<
    readonly [IdField<"type", string>, IdField<"root", string>],
    readonly []
  >;
}

/**
 * Generate the package relations over a composition's rosters.
 *
 * @param input - The rosters and each vocabulary's facet.
 * @param input.versions - The `SchemaVersion` roster.
 * @param input.kinds - The `NodeKind` roster, which `RootOfType`'s roots range over.
 * @param input.facets - The vocabularies' facets.
 * @returns The relations, or an `OutsideCodeSpace` naming a stated version or a root kind the
 *   rosters do not hold, or a `RepeatedValue` naming a type two statements list.
 */
export const packageGrammar = (input: {
  readonly facets: readonly PackageFacet[];
  readonly kinds: Roster<string>;
  readonly versions: Roster<SchemaVersion>;
}): Result.Result<PackageGrammar, ClosedRelationError> =>
  Result.gen(function* generatePackage() {
    const statements = input.facets.flatMap((facet) => facet.resourceTypes);
    const resourceType = yield* roster(
      "ResourceType",
      statements.flatMap(({ types }) => types),
    );
    const type = idField("type", resourceType);

    return {
      resourceType,
      resourceTypeOf: yield* closed({
        key: [idField("version", input.versions), type],
        name: "ResourceTypeOf",
        payload: [],
        rows: statements.flatMap(({ types, versions }) =>
          versions.flatMap((version) => types.map((stated) => ({ type: stated, version }))),
        ),
      }),
      rootOfType: yield* closed({
        key: [type, idField("root", input.kinds)],
        name: "RootOfType",
        payload: [],
        rows: input.facets.flatMap((facet) => facet.roots),
      }),
    };
  });
