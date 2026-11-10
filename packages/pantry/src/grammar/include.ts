/**
 * The kinds an included fragment's root may be (spec readings 85 and 114 to 118; QTI 3.0
 * information model, §2.12 and Table 9.4.1).
 *
 * An `xi:include` "is treated as if it was actually an instance of the root element of the
 * fragment referred to" (§2.12), and the information model lists the classes whose children
 * include it (Table 9.4.1, Include's parent classes: `BlockGroup`, `FlowStaticGroup`,
 * `InlineStaticGroup`, `ResponseRuleGroup`, `OutcomeRule`, `SectionPart` and the rest). Each class
 * is a choice: an include stands where any of its members may. The pinned XSDs state each class
 * as a `choice` group holding an explicit `xi:include` element particle beside the class's members,
 * so an include under a parent stands for its fragment's root exactly where that root is one of the
 * include's alternatives: the element kinds of the choice group the include's particle sits in,
 * nested choices flattened (spec reading 114). Each alternative's position in the parent's
 * Glushkov automaton follows and is followed by the same positions as the include's own, so N5,
 * stepping the include at its own position, steps the parent's automaton as its root would
 * (`include.test.ts` proves it over every row).
 *
 * An include held by a wildcard (`qti-custom-interaction`'s markup, `qti-ordering`'s extension
 * slot, HTML's `template`) is no Include of the information model: it has no explicit particle, so
 * no row here, and it is read as written (reading 114).
 *
 * A fragment's root element is read at its own document's root, by its expanded name alone, so a
 * kind the composition splits by context (`qti-template-block.rubric` beside
 * `qti-template-block`) never roots a fragment (reading 116): {@link fragmentRootsOf} keeps the
 * kind of each name whose handle is its name.
 */
import { closed, idField, indexed, roster } from "#pantry/grammar/closed.ts";
import type { Closed, IdField, Indexed, Roster } from "#pantry/grammar/closed.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import type { ContentModel, Particle } from "#pantry/vocab/inventory/types.ts";

/**
 * XInclude's include, the kind whose particle marks a class that admits a fragment.
 */
export const includeKind = "xi:include";

/**
 * XInclude's fallback, which no fragment's root is.
 */
const fallbackKind = "xi:fallback";

/**
 * The resource type of an included fragment (QTI 3.0 Best Practice and Implementation Guide, §6.2:
 * `imsqti_fragment_xmlv3p0`, "QTI 3 inclusion (XInclude)").
 */
export const fragmentType = "imsqti_fragment_xmlv3p0";

/**
 * One kind an include under a parent may stand for, in one schema version.
 */
export interface IncludeAlternative {
  readonly kind: string;
  readonly parent: string;
  readonly version: SchemaVersion;
}

/**
 * Collect the element kinds of a choice group, its nested choices' included: the members of the
 * class it states. A sequence or an `all` inside it is no member, and a wildcard names no kind.
 *
 * @param particles - The group's particles.
 * @returns Their element kinds, in tree order.
 */
const choiceKinds = (particles: readonly Particle[]): readonly string[] =>
  particles.flatMap((particle): readonly string[] => {
    switch (particle._tag) {
      case "element": {
        return particle.kinds;
      }
      case "group": {
        return particle.compositor === "choice" ? choiceKinds(particle.particles) : [];
      }
      case "any": {
        return [];
      }
      default: {
        return particle satisfies never;
      }
    }
  });

/**
 * Collect the alternatives of every explicit include particle in a particle tree: for each choice
 * group whose members (its nested choices flattened) name `xi:include`, its other element kinds.
 * A nested choice is read once, as part of the outermost choice that holds it.
 *
 * @param particle - The tree's root.
 * @returns The kinds, once each.
 */
const alternativesIn = (particle: Particle): ReadonlySet<string> => {
  const found = new Set<string>();
  const visit = (at: Particle, inChoice: boolean): void => {
    if (at._tag !== "group") {
      return;
    }

    const isChoice = at.compositor === "choice";
    if (isChoice && !inChoice) {
      const members = choiceKinds(at.particles);
      if (members.includes(includeKind)) {
        for (const kind of members) {
          if (kind !== includeKind && kind !== fallbackKind) {
            found.add(kind);
          }
        }
      }
    }

    for (const child of at.particles) {
      visit(child, isChoice);
    }
  };
  visit(particle, false);

  return found;
};

/**
 * Read every include alternative off the content models: for each model whose particle tree holds
 * an explicit `xi:include` in a choice, each (version, parent, kind) of its alternatives.
 *
 * @param models - The content models, as the IR states them.
 * @returns The alternatives, once each, in model and tree order.
 */
export const includeAlternativesOf = (
  models: readonly ContentModel[],
): readonly IncludeAlternative[] => {
  const seen = new Set<string>();

  return models.flatMap((model): readonly IncludeAlternative[] => {
    const { content } = model;
    if (content._tag !== "element-only" && content._tag !== "mixed") {
      return [];
    }

    const kinds = [...alternativesIn(content.particle)];

    return model.versions.flatMap((version) =>
      kinds.flatMap((kind) => {
        const at = `${version} ${model.kind} ${kind}`;
        if (seen.has(at)) {
          return [];
        }

        seen.add(at);

        return [{ kind, parent: model.kind, version }];
      }),
    );
  });
};

/**
 * Pick the kinds that may root a fragment's own document: every alternative, but of the kinds
 * that share one expanded name only the one whose handle is the name (spec reading 116), since a
 * document's root is read by its name alone.
 *
 * @param alternatives - The include alternatives.
 * @param nameOf - A kind's expanded name, `namespace}local`.
 * @param localOf - A kind's local name.
 * @returns The fragment root kinds, once each, in the alternatives' order.
 */
export const fragmentRootsOf = (
  alternatives: readonly IncludeAlternative[],
  nameOf: (kind: string) => string,
  localOf: (kind: string) => string,
): readonly string[] => {
  const kinds = [...new Set(alternatives.map(({ kind }) => kind))];
  const rooting = new Set(
    [...Map.groupBy(kinds, nameOf).values()].flatMap((sharing) =>
      sharing.length === 1
        ? sharing
        : sharing.filter((kind) => kind.replace(/^[^:]*:/u, "") === localOf(kind)),
    ),
  );

  return kinds.filter((kind) => rooting.has(kind));
};

/**
 * The include relations of a composition.
 */
export interface IncludeGrammar {
  /**
   * The `IncludeParent` roster: the kinds whose model holds an explicit include, in first-met
   * order.
   */
  readonly includeParent: Roster<string>;
  /**
   * `IncludeParentKind`, the function from an include parent to its kind.
   */
  readonly includeParentKind: Closed<
    readonly [IdField<"parent", string>],
    readonly [IdField<"kind", string>]
  >;
  /**
   * The `IncludeSet` roster: every distinct set of kinds an include stands for, numbered from 0 in
   * the order of the first family that holds it (rule 0: identical facts are one fact).
   */
  readonly includeSet: Roster<string>;
  /**
   * `IncludeSetOf`: (version, include parent) → set, the kinds an include under the parent stands
   * for, for each family that holds one.
   */
  readonly includeSetOf: Indexed<
    readonly [IdField<"version", SchemaVersion>, IdField<"parent", string>],
    readonly [IdField<"set", string>]
  >;
  /**
   * `IncludeMember`: the set of (set, kind) where an include set holds the kind, each set's kinds
   * in handle order.
   */
  readonly includeMember: Indexed<
    readonly [IdField<"set", string>, IdField<"kind", string>],
    readonly []
  >;
}

/**
 * Generate the include relations over a composition's rosters.
 *
 * @param input - The rosters and the alternatives.
 * @param input.alternatives - The include alternatives, {@link includeAlternativesOf}'s.
 * @param input.kinds - The `NodeKind` roster.
 * @param input.versions - The `SchemaVersion` roster.
 * @returns The relations. A version or kind the rosters do not hold is a fault of the rows
 *   (`faultOf`), which the tests find and grizzle refuses.
 */
export const includeGrammar = (input: {
  readonly alternatives: readonly IncludeAlternative[];
  readonly kinds: Roster<string>;
  readonly versions: Roster<SchemaVersion>;
}): IncludeGrammar => {
  const parents = [...new Set(input.alternatives.map(({ parent }) => parent))];
  const includeParent = roster("IncludeParent", parents);
  const parent = idField("parent", includeParent);
  // Each (version, include parent)'s kinds, in the order of its first alternative; then each
  // distinct sorted set of them numbered once, in the order of the first family that holds it.
  const families = new Map<
    string,
    { readonly kinds: string[]; readonly parent: string; readonly version: SchemaVersion }
  >();
  for (const { kind, parent: held, version } of input.alternatives) {
    families
      .getOrInsertComputed(`${version} ${held}`, () => ({ kinds: [], parent: held, version }))
      .kinds.push(kind);
  }

  const setOf = new Map<string, string>();
  const members: { readonly kind: string; readonly set: string }[] = [];
  const setRows = [...families.values()].map(({ kinds, parent: held, version }) => {
    const sorted = kinds.toSorted((left, right) => (left < right ? -1 : 1));
    const set = setOf.getOrInsertComputed(sorted.join(" "), () => {
      const fresh = String(setOf.size);
      members.push(...sorted.map((kind) => ({ kind, set: fresh })));

      return fresh;
    });

    return { parent: held, set, version };
  });
  const includeSet = roster("IncludeSet", [...setOf.values()]);
  const set = idField("set", includeSet);

  return {
    includeMember: indexed(
      closed({
        key: [set, idField("kind", input.kinds)],
        name: "IncludeMember",
        payload: [],
        rows: members,
      }),
    ),
    includeParent,
    includeParentKind: closed({
      key: [parent],
      name: "IncludeParentKind",
      payload: [idField("kind", input.kinds)],
      rows: parents.map((handle) => ({ kind: handle, parent: handle })),
    }),
    includeSet,
    includeSetOf: indexed(
      closed({
        key: [idField("version", input.versions), parent],
        name: "IncludeSetOf",
        payload: [set],
        rows: setRows,
      }),
    ),
  };
};
