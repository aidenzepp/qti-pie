/**
 * The assembly of a test from its package's section documents (S-9 Section References, P-2 Nested
 * Section Instances; issue m3f-03): the document `openPackage` builds a delivered test from, in
 * which each `qti-assessment-section-ref` that places a section document is replaced by that
 * document's root `qti-assessment-section`, in place, recursively through the placed documents'
 * own section refs.
 *
 * A section ref "functions as a facade for the qti-assessment-section to which it refers", and
 * "an included fragment is read in place, as XML" (reading 85), so the test with its sections
 * assembled is the document a session walks and every test feature reads: the placed sections'
 * items are the test's items, and their session control, time limits, selection and ordering are
 * read exactly as the test's own, by the one test model built from the assembled document, with no
 * module knowing a section was placed. "A section document a test places twice is written once"
 * (reading 86), and each placement is still an instance of everything it holds, so the assembled
 * document holds a twice-placed document's elements twice, each placement its own copy: the model
 * keys an element's path by its identity, so two placements of one element object would share a
 * path.
 *
 * The module is pure: it reads what the package's judging resolved, which section document each
 * section ref places and which item each item ref names, and builds plain data. A document is
 * plain immutable data, so the assembly copies and never mutates a judged one. It refuses nothing:
 * a cycle (`inclusion-cycle`, reading 85), a remote section ref (`package-path-outside`, reading
 * 170) and the assembly limit are the judging's, and refuse the package before it is delivered. A
 * section ref whose document the walk finds on its own chain, or that places no document given, is
 * kept as written and places nothing, so a loop can never run the copy without end. The assembled
 * document is the one document no reader read, so the copy holds it to two limits of the delivery,
 * {@link assemblyDepthLimit} and {@link assemblyInstanceLimit}, and gives none past either: the
 * test is then delivered unassembled, as a test opened alone is.
 *
 * @module
 */
import { Option } from "effect";
import { walk } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import type { LtiLink } from "#plate/model/test.ts";

/**
 * One section ref of a test document or of a placed section document that the package's judging
 * found placing a section document: the ref element, as the reader read it, and the path of the
 * document it places, as the package names it (S-9; issue m3f-03).
 */
export interface PlacedSection {
  readonly element: SourceElement;
  readonly path: string;
}

/**
 * One item ref of a test document or of a placed section document that the package's judging
 * resolved: the ref element, as the reader read it, its identifier, the path of the item, or LTI
 * link, it names, as the package names it, resolved against the document that writes the ref, and
 * whether it names an LTI link in place of an item (reading 110; S-9; issue m3f-03).
 */
export interface ResolvedItem {
  readonly element: SourceElement;
  readonly identifier: string;
  readonly link: boolean;
  readonly path: string;
}

/**
 * What the assembly of one test takes: the test's document, the package's documents by path, each
 * section ref the judging found placing a section document, and each item ref it resolved (S-9,
 * P-2; issue m3f-03).
 */
export interface AssemblyInput {
  /**
   * The package's documents the reader read, keyed by their paths from the package's root. A
   * section ref whose path is not among them places nothing.
   */
  readonly documents: ReadonlyMap<string, SourceDocument>;
  /**
   * Each item ref of the test document and of every section document the test places, with what it
   * names. An item ref not among them is kept in the assembled document and names no item here.
   */
  readonly itemRefs: readonly ResolvedItem[];
  /**
   * Each section ref of the test document and of every section document the test places, with the
   * document it places. A section ref not among them is kept as written.
   */
  readonly sectionRefs: readonly PlacedSection[];
  readonly test: SourceDocument;
}

/**
 * What the assembly of one test gives: the assembled document, the item of every item ref it
 * holds, its item refs that name an LTI link, and where each element of the test document stands
 * in it (S-9, P-2; issue m3f-03).
 */
export interface AssembledTest {
  /**
   * How many elements of the assembled document are open at once at its deepest, the root
   * counted: its nesting depth, which a chain of placed documents adds up, within
   * {@link assemblyDepthLimit}.
   */
  readonly depth: number;
  /**
   * The assembled document, at the test document's location: a copy of the test document in which
   * each section ref that places a document is replaced by a copy of that document's root, each
   * placement its own copy.
   */
  readonly document: SourceDocument;
  /**
   * The path of the item each item ref of the assembled document names, keyed by the item ref's
   * identifier, in the assembled document's order, the first of an identifier kept: a section
   * document placed twice gives its item refs twice, and both name one item. An item ref that
   * names an LTI link is not among them, since a package delivers no LTI link.
   */
  readonly items: ReadonlyMap<string, string>;
  /**
   * Each item ref of the assembled document that names an LTI link, with its path in the assembled
   * document, in document order: what the delivered test marks `lti-link` and leaves out.
   */
  readonly links: readonly LtiLink[];
  /**
   * The path in the assembled document of each element of the test document that stands in it,
   * keyed by the element's path in the test document, in the test document's order. A placed
   * section standing beside the test's own sections gives them a sibling index they lacked, so a
   * path the judging records in the test document is read through this map before it names a
   * place in the delivered test. A section ref the assembly replaced has no entry.
   */
  readonly paths: ReadonlyMap<string, string>;
}

/**
 * The deepest an assembled document may nest, 256 elements open at once, and still be delivered
 * assembled: the shared reader's own depth limit (`defaultElementDepth` in
 * `@qti-pie/crust/read.ts`, rule `element-depth`), which plate's `document/read.ts` alone imports.
 * Every reader of a source document, the test model and the session among them, recurses over its
 * elements with the call stack and is bounded by that limit, since no document the reader read
 * nests deeper; an assembled document is the one document no reader read, and a chain of placed
 * section documents nests as deep as the chain is long, within the assembly limit of 2,048
 * placements. A test whose assembled document nests deeper is delivered as its own document, its
 * section refs marked and nothing placed, as a test opened alone is: a stated limit of the
 * delivery, no rule of QTI, which an iterative test model would lift (S-9; issue m3f-03).
 */
export const assemblyDepthLimit = 256;

/**
 * The most placements of section documents an assembled document may hold, each instance counted,
 * 2,048, and still be delivered assembled. The package's judging holds a test's placements to the
 * same count, but there a document placed under one context is one placement however many times a
 * chain of documents multiplies it (`assemblyPlacementLimit` in `#plate/package/open.ts`), so a
 * chain of forty section documents each placing the next twice is judged within its limit while
 * its assembled document, which writes every instance, would hold 2^40 placements and more items
 * than any session could meet. The copy stops at the first instance past this count, so refusing
 * to assemble costs what reaching the count does, and the test is delivered as its own document,
 * its section refs marked and nothing placed, as a test opened alone is: a stated limit of the
 * delivery, no rule of QTI (S-9, P-2; issue m3f-03).
 */
export const assemblyInstanceLimit = 2048;

/**
 * One open element of the copy: the element being copied, which document's placement it lies in,
 * its children copied so far, and the index of its next child.
 */
interface Frame {
  readonly copied: SourceChild[];
  readonly element: SourceElement;
  next: number;
  /**
   * The path of the section document whose root this element is, which the frame's end takes off
   * the chain; none for every other element.
   */
  readonly placed: string | undefined;
  /**
   * Whether the element is the test document's own, and not a placed document's, so its copy is
   * one element the test document's paths map to.
   */
  readonly own: boolean;
}

/**
 * Assemble a test from its package's section documents: copy the test document, replacing each
 * section ref that places a document by a copy of that document's root, depth first in document
 * order, and through each placed document's own section refs in turn, as the qti package's
 * assembled test places them (its `Instance` tree, `packages/pantry/src/qti/tests.ts`); then find
 * each item ref of the copy, the item it names and, for the test document's own elements, where
 * each now stands (S-9 Section References, P-2 Nested Section Instances; issue m3f-03).
 *
 * The copy keeps the elements still open in a list of its own rather than on the call stack, so no
 * depth of nested placements overflows it. A section ref whose document is on the chain of
 * documents from the test down to the ref, which the judging refuses `inclusion-cycle`, or whose
 * document is not among the package's, is kept as written and places nothing. The copy stops, and
 * gives none, at the first element that would nest deeper than {@link assemblyDepthLimit} or the
 * first placement past {@link assemblyInstanceLimit}: the test is then delivered unassembled.
 *
 * @param input The test's document, the package's documents, and the section refs and item refs
 *   the judging resolved.
 * @returns The assembled document with its item refs' items, its LTI links and the test document's
 *   paths in it; none when the assembled document would pass a limit of the delivery.
 */
export const assembleTest = ({
  documents,
  itemRefs,
  sectionRefs,
  test,
}: AssemblyInput): Option.Option<AssembledTest> => {
  const placing = new Map(sectionRefs.map(({ element, path }) => [element, path] as const));
  const naming = new Map(itemRefs.map((itemRef) => [itemRef.element, itemRef] as const));
  // Each copied element of the test document's own, by the original.
  const copies = new Map<SourceElement, SourceElement>();
  // What each copied item ref's original names, by the copy.
  const named = new Map<SourceElement, ResolvedItem>();
  const onChain = new Set<string>();
  let instances = 0;
  /**
   * Open the copy of an element, or of the root of the document a section ref places.
   *
   * @param element The element to copy.
   * @param own Whether it is the test document's own.
   * @returns The frame to push.
   */
  const opened = (element: SourceElement, own: boolean): Frame => {
    const placed = placing.get(element);
    const document = placed === undefined ? undefined : documents.get(placed);
    if (placed !== undefined && document !== undefined && !onChain.has(placed)) {
      onChain.add(placed);
      instances += 1;

      return { copied: [], element: document.root, next: 0, own: false, placed };
    }

    return { copied: [], element, next: 0, own, placed: undefined };
  };

  const frames: Frame[] = [opened(test.root, true)];
  let { root } = test;
  let depth = 1;
  for (let frame = frames.at(-1); frame !== undefined; frame = frames.at(-1)) {
    depth = Math.max(depth, frames.length);
    if (depth > assemblyDepthLimit || instances > assemblyInstanceLimit) {
      return Option.none();
    }

    const child = frame.element.children[frame.next];
    frame.next += 1;
    if (child === undefined) {
      frames.pop();

      const copy: SourceElement = { ...frame.element, children: frame.copied };
      if (frame.placed !== undefined) {
        onChain.delete(frame.placed);
      }

      if (frame.own) {
        copies.set(frame.element, copy);
      }

      const itemRef = naming.get(frame.element);
      if (itemRef !== undefined) {
        named.set(copy, itemRef);
      }

      const parent = frames.at(-1);
      if (parent === undefined) {
        root = copy;
      } else {
        parent.copied.push(copy);
      }
    } else if (child.kind === "element") {
      frames.push(opened(child, frame.own));
    } else {
      frame.copied.push(child);
    }
  }

  const document: SourceDocument = { location: test.location, root };
  // One walk of the assembled document gives each copy its path and the item refs their order.
  const assembledPaths = new Map<SourceElement, string>();
  const items = new Map<string, string>();
  const links: LtiLink[] = [];
  for (const { element, path } of walk(document)) {
    assembledPaths.set(element, path);

    const itemRef = named.get(element);
    if (itemRef === undefined) {
      continue;
    }

    if (itemRef.link) {
      links.push({ identifier: itemRef.identifier, path });
    } else if (!items.has(itemRef.identifier)) {
      items.set(itemRef.identifier, itemRef.path);
    }
  }

  const paths = new Map<string, string>();
  for (const { element, path } of walk(test)) {
    const copy = copies.get(element);
    const assembled = copy === undefined ? undefined : assembledPaths.get(copy);
    if (assembled !== undefined) {
      paths.set(path, assembled);
    }
  }

  return Option.some({ depth, document, items, links, paths });
};
