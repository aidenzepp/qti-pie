/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * What a test reaches through section refs: a section ref behaves as if its section document were
 * inline, so a test reaches its own structure holders and, transitively, every holder of each
 * section document its refs resolve to. The module is pure, over plain records, so the graph is
 * tested without rows; the package stage builds `TestReach` and `TestDocument` rows from it.
 */
import { Effect, Schema } from "effect";

/**
 * The kinds of structure holder a test or section document carries.
 */
export type HolderKind = "itemRef" | "part" | "section" | "sectionRef";

/**
 * One structure holder of a document: its node, its identifier and its kind.
 */
export interface Holder {
  readonly holder: string;
  readonly holderKind: HolderKind;
  readonly identifier: string;
}

/**
 * One section ref: the holder that is the ref, and the section document it resolves to.
 */
export interface SectionRef {
  readonly document: string;
  readonly holder: string;
}

/**
 * A test or section document as the graph sees it: its own holders and its section refs.
 */
export interface StructureDocument {
  readonly document: string;
  readonly holders: readonly Holder[];
  readonly sectionRefs: readonly SectionRef[];
}

/**
 * The package's test documents and section documents.
 */
export interface ReachInput {
  readonly sections: readonly StructureDocument[];
  readonly tests: readonly StructureDocument[];
}

/**
 * One holder a test reaches, once per `(test, holder)`.
 */
export interface ReachedHolder extends Holder {
  readonly test: string;
}

/**
 * One document a test reaches, itself included, once per `(test, document)`.
 */
export interface ReachedDocument {
  readonly document: string;
  readonly test: string;
}

/**
 * What the tests of a package reach.
 *
 * `reach` and `documents` follow the order of `tests`, each test's own holders first and then the
 * holders of each section document in ref order. `reachedBy` is the inverse of `documents` for
 * section documents: the tests that reach each one, and nothing for a section no test reaches.
 */
export interface Reach {
  readonly documents: readonly ReachedDocument[];
  readonly reach: readonly ReachedHolder[];
  readonly reachedBy: readonly ReachedDocument[];
}

/**
 * A section document reaches itself through its section refs.
 *
 * `documents` names the documents of the cycle in ref order, the first one being the document the
 * walk entered the cycle at.
 */
export class SectionRefCycle extends Schema.TaggedError<SectionRefCycle>()("SectionRefCycle", {
  documents: Schema.Array(Schema.String),
}) {
  /**
   * What was refused and what to change, in one or two sentences.
   */
  override get message(): string {
    return `Section documents ${this.documents.join(" -> ")} -> ${this.documents[0] ?? ""} refer to each other in a cycle, so none of them can be put inline. Remove one of the section refs in the cycle.`;
  }
}

/**
 * The first cycle among the section documents, as the documents of the cycle, or none.
 */
const findCycle = (byDocument: ReadonlyMap<string, StructureDocument>): readonly string[] => {
  const settled = new Set<string>();
  const visit = (document: string, path: readonly string[]): readonly string[] => {
    const at = path.indexOf(document);
    if (at !== -1) {
      return path.slice(at);
    }

    if (settled.has(document)) {
      return [];
    }

    const found = byDocument.get(document);
    for (const ref of found?.sectionRefs ?? []) {
      const cycle = visit(ref.document, [...path, document]);
      if (cycle.length > 0) {
        return cycle;
      }
    }
    settled.add(document);

    return [];
  };
  for (const document of byDocument.keys()) {
    const cycle = visit(document, []);
    if (cycle.length > 0) {
      return cycle;
    }
  }

  return [];
};

/**
 * Compute what every test reaches through section refs, or refuse a cycle of section refs.
 *
 * A section ref whose document is not among the section documents contributes nothing; resolving
 * refs is the package stage's job. A section document referenced twice is reached once per test.
 *
 * @param input - The test and section documents of one package.
 * @returns Each test's reach and documents, and the tests that reach each section document.
 */
export const reachOf = (input: ReachInput): Effect.Effect<Reach, SectionRefCycle> =>
  Effect.gen(function* computeReach() {
    const byDocument = new Map(input.sections.map((section) => [section.document, section]));
    const cycle = findCycle(byDocument);
    if (cycle.length > 0) {
      return yield* new SectionRefCycle({ documents: cycle });
    }

    const documents: ReachedDocument[] = [];
    const reach: ReachedHolder[] = [];
    const reachedBy: ReachedDocument[] = [];
    for (const test of input.tests) {
      const seen = new Set<string>();
      const walk = (own: StructureDocument): void => {
        for (const holder of own.holders) {
          reach.push({ ...holder, test: test.document });
        }
        for (const ref of own.sectionRefs) {
          const section = byDocument.get(ref.document);
          if (section !== undefined && !seen.has(section.document)) {
            seen.add(section.document);
            documents.push({ document: section.document, test: test.document });
            reachedBy.push({ document: section.document, test: test.document });
            walk(section);
          }
        }
      };
      documents.push({ document: test.document, test: test.document });
      walk(test);
    }

    return {
      documents,
      reach,
      reachedBy: reachedBy.toSorted((left, right) => left.document.localeCompare(right.document)),
    };
  });
