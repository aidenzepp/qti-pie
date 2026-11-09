/**
 * The verdict on a document, the one gate between a source and an item a host may redact, score or
 * render, or a test it may deliver, and the sentences that word a refusal for the host and the
 * author.
 *
 * {@link check} refuses a root outside QTI's namespace, then runs the structural validator, the
 * item prose rules and the test prose rules together, then leaves unchecked what it cannot judge.
 * Every verdict carries the kind of its document's root. On an item it accepts it secures the
 * source before it builds the item: it removes every attribute only a wildcard admits (E3) and
 * passes every URL attribute through `url.ts`, keeping each value in its parsed form or dropping it
 * with a notice beside its element. Its {@link Accepted} is the only input `redact` and `score`
 * take. On a test it builds the test model, the {@link AcceptedTest} a session starts from; a
 * section or a stimulus is accepted and marked, delivered by neither M2 nor M1. A refusal is a
 * verdict, never a failure, so `check` is a plain function; it lifts each builder, which stays an
 * Effect, once.
 *
 * @module
 */
import { Array as Arr, Brand, Effect, Option, Result } from "effect";
import {
  attributePath,
  mathmlNamespace,
  qtiNamespace,
  ssmlNamespace,
  walk,
  xincludeNamespace,
  xmlNamespace,
} from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import { buildItem } from "#plate/model/item.ts";
import type {
  BodyNode,
  Item,
  SimpleChoice,
  Unsupported,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import { buildTest } from "#plate/model/test.ts";
import type { MarkedFeature, Test } from "#plate/model/test.ts";
import { classifyUrl, formatUrl, urlContextOf } from "#plate/model/url.ts";
import { durationForm, trimXmlSpace } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { checkRules } from "#plate/validate/rules.ts";
import {
  attributeName,
  checkStructure,
  governingTables,
  isAllowance,
  isInstanceAttribute,
  tableOf,
} from "#plate/validate/structure.ts";
import { checkTestRules } from "#plate/validate/test-rules.ts";
import type { ContentTable, Tables } from "#plate/validate/xsd.ts";
import { cpVersions, manifestNamespace } from "#plate/vocabulary.ts";
import type { TestMark } from "#plate/vocabulary.ts";

/**
 * Why a valid document is left unchecked: it holds MathML (reading 2) or SSML (reading 3), whose
 * validity plate cannot judge, an XInclude `include` in an item or a stimulus, whose inclusion
 * plate neither performs nor judges, an entity reference the reader kept unexpanded, or a root
 * that is not an item, a test, a section or a stimulus. `path` is the element or attribute at
 * issue.
 */
export interface UncheckedReason {
  readonly path: string;
  readonly reason: "entity" | "mathml" | "root" | "ssml" | "xinclude";
}

/**
 * The fields of an accepted document, which only {@link check} and {@link acceptForTest} brand.
 */
interface AcceptedFields {
  /**
   * The document's location as the host named it.
   */
  readonly document: string;
  /**
   * The item built from the secured source, with each URL notice placed in its body and its
   * `unsupported` equal to {@link AcceptedFields.unsupported}.
   */
  readonly item: Item;
  /**
   * Every feature not rendered, in document order: the item's own, each attribute E3 removed, and
   * each URL dropped.
   */
  readonly unsupported: readonly UnsupportedFeature[];
}

/**
 * A document {@link check} accepted, the only input `redact` and `score` take.
 *
 * The brand exists only in the type, so a hand-built {@link Item}, or any object built by hand,
 * does not type-check where an `Accepted` is expected: {@link check} is its constructor, and
 * {@link acceptForTest} the one named seam for tests.
 */
export type Accepted = Brand.Branded<AcceptedFields, "Accepted">;

/**
 * The brand's constructor, kept to this module.
 */
const accept = Brand.nominal<Accepted>();

/**
 * The fields of an accepted test, which only {@link check}, {@link acceptMarkedTest} and
 * {@link acceptTestForTest} brand.
 */
interface AcceptedTestFields {
  /**
   * The document's location as the host named it, the test's own `document`.
   */
  readonly document: string;
  /**
   * The test model built from the document.
   */
  readonly test: Test;
  /**
   * Every feature the test holds and M2 does not deliver, the test's own `unsupported`.
   */
  readonly unsupported: readonly MarkedFeature[];
}

/**
 * A test {@link check} accepted, the test a session starts from and a stored session is checked
 * against.
 *
 * The brand exists only in the type, as {@link Accepted}'s does: {@link check} is its constructor,
 * and {@link acceptTestForTest} the one named seam for tests. It is not an {@link Accepted}, so
 * `redact`, `score` and `render` do not take it.
 */
export type AcceptedTest = Brand.Branded<AcceptedTestFields, "AcceptedTest">;

/**
 * The brand's constructor, kept to this module.
 */
const acceptTest = Brand.nominal<AcceptedTest>();

/**
 * Construct the {@link AcceptedTest} `openPackage` delivers for a test {@link check} accepted whose
 * model the package marked: `openPackage`'s constructor, which nothing else calls. A package reads
 * the test's items, so it may mark processing the test document's own verdict cannot, such as a
 * read of an item's context variable through its item ref (`withUnheldReads` in
 * `#plate/model/test.ts`). The test document's own verdict keeps `accepted` as {@link check} gave
 * it.
 *
 * @param accepted The test as {@link check} accepted it.
 * @param test Its model, as the package marked it.
 * @returns The test accepted with the marked model, its `unsupported` the model's.
 */
export const acceptMarkedTest = (accepted: AcceptedTest, test: Test): AcceptedTest =>
  acceptTest({ document: accepted.document, test, unsupported: test.unsupported });

/**
 * What M2 holds of a section or a stimulus document it accepts: valid, and delivered alone by no
 * stage before M3.
 */
export interface RootSummary {
  /**
   * The document's location as the host named it.
   */
  readonly document: string;
  /**
   * The root's `identifier`, its outer XML whitespace removed, as an NCName reads.
   */
  readonly identifier: string;
  /**
   * The root's `title`, as written.
   */
  readonly title: string;
  /**
   * Every feature not delivered: the root's own mark, `root:qti-assessment-section` or
   * `root:qti-assessment-stimulus`, at the root's path.
   */
  readonly unsupported: readonly MarkedFeature[];
}

/**
 * A section document {@link check} accepted. {@link check} is its constructor, and
 * {@link acceptSectionForTest} the one named seam for tests.
 */
export type AcceptedSection = Brand.Branded<RootSummary, "AcceptedSection">;

/**
 * The brand's constructor, kept to this module.
 */
const acceptSection = Brand.nominal<AcceptedSection>();

/**
 * A stimulus document {@link check} accepted. {@link check} is its constructor, and
 * {@link acceptStimulusForTest} the one named seam for tests.
 */
export type AcceptedStimulus = Brand.Branded<RootSummary, "AcceptedStimulus">;

/**
 * The brand's constructor, kept to this module.
 */
const acceptStimulus = Brand.nominal<AcceptedStimulus>();

/**
 * The kind of a QTI 3 root, by its local name in QTI's namespace: the item, the test, the section
 * and the stimulus, and the two roots M3 checks, an outcome declaration and response processing.
 */
export type RootKind =
  | "item"
  | "outcome-declaration"
  | "response-processing"
  | "section"
  | "stimulus"
  | "test";

/**
 * The kind a verdict carries: its root's, or `"none"` when the document has no QTI 3 root. That is
 * bytes that are not well-formed XML, a root outside QTI's namespace, or a QTI element other than
 * the six roots at the root.
 */
export type VerdictKind = RootKind | "none";

/**
 * The kinds of root {@link check} accepts.
 */
export type AcceptedKind = "item" | "section" | "stimulus" | "test";

/**
 * An accepting verdict's document, by its kind, so that `kind` narrows `accepted`.
 */
type AcceptedByKind =
  | { readonly accepted: Accepted; readonly kind: "item" }
  | { readonly accepted: AcceptedSection; readonly kind: "section" }
  | { readonly accepted: AcceptedStimulus; readonly kind: "stimulus" }
  | { readonly accepted: AcceptedTest; readonly kind: "test" };

/**
 * The verdict on a document, by `verdict`.
 *
 * - `refused`: one or more refusals; never rendered.
 * - `unchecked`: valid as far as plate checks, with every reason it cannot judge the rest; never
 *   rendered.
 * - `accepted-with-unsupported`: valid, with features plate does not render or deliver, each named.
 * - `accepted`: valid, and plate renders or delivers all of it.
 *
 * Every arm carries `kind`: an accepting verdict's is `item`, `test`, `section` or `stimulus`, and
 * `accepted` is the {@link Accepted}, {@link AcceptedTest}, {@link AcceptedSection} or
 * {@link AcceptedStimulus} to match, so `kind` narrows it. `unchecked` and `refused` carry the
 * root's kind, `"none"` when it is none of the six. Read an accepted item through
 * {@link acceptedItem}. `document` is the document's location.
 */
export type Verdict =
  | {
      readonly document: string;
      readonly kind: VerdictKind;
      readonly refusals: Arr.NonEmptyReadonlyArray<Refusal>;
      readonly verdict: "refused";
    }
  | {
      readonly document: string;
      readonly kind: VerdictKind;
      readonly reasons: readonly UncheckedReason[];
      readonly verdict: "unchecked";
    }
  | (AcceptedByKind & {
      readonly document: string;
      readonly verdict: "accepted-with-unsupported";
    })
  | (AcceptedByKind & { readonly document: string; readonly verdict: "accepted" });

/**
 * Each QTI 3 root's kind, by its local name in QTI's namespace.
 */
const rootKinds: ReadonlyMap<string, RootKind> = new Map<string, RootKind>([
  ["qti-assessment-item", "item"],
  ["qti-assessment-section", "section"],
  ["qti-assessment-stimulus", "stimulus"],
  ["qti-assessment-test", "test"],
  ["qti-outcome-declaration", "outcome-declaration"],
  ["qti-response-processing", "response-processing"],
]);

/**
 * Give the kind of a document's root.
 *
 * @param root The root.
 * @returns Its kind, or `"none"` when it is not one of QTI 3's six roots.
 */
const kindOf = (root: SourceElement): VerdictKind =>
  root.namespace === qtiNamespace ? (rootKinds.get(root.local) ?? "none") : "none";

/**
 * Report whether {@link check} accepts a root of a kind, when nothing refuses it and nothing leaves
 * it unchecked.
 *
 * @param kind The root's kind.
 * @returns Whether it is an item, a test, a section or a stimulus.
 */
const isAcceptedKind = (kind: VerdictKind): kind is AcceptedKind =>
  kind === "item" || kind === "section" || kind === "stimulus" || kind === "test";

/**
 * A source with its attributes secured, and what securing it removed.
 */
interface Secured {
  /**
   * The features of each URL dropped, keyed by its element's path, in document order, each once.
   */
  readonly drops: ReadonlyMap<string, readonly string[]>;
  /**
   * Each attribute E3 removed, as a mark at its element's path.
   */
  readonly marks: readonly UnsupportedFeature[];
  readonly source: SourceDocument;
}

/**
 * The elements whose children are fallback content a browser does not show while it plays or
 * shows the element itself.
 */
const mediaElements: ReadonlySet<string> = new Set(["audio", "picture", "video"]);

/**
 * The elements whose notices are placed after their enclosing media element, never inside it.
 */
const mediaSources: ReadonlySet<string> = new Set(["source", "track"]);

/**
 * Report whether an attribute is `xml:lang` or `xml:base`, which E3 keeps on any element beyond
 * the structural walk's allowances.
 *
 * @param attribute The attribute.
 * @returns Whether it is one of the two.
 */
const isLangOrBase = (attribute: SourceAttribute): boolean =>
  attribute.namespace === xmlNamespace &&
  (attribute.local === "lang" || attribute.local === "base");

/**
 * Report whether an attribute is one E3 keeps on any element without its table naming it: the
 * structural walk's allowances ({@link isAllowance}: a namespace declaration,
 * `xsi:schemaLocation` or `xsi:noNamespaceSchemaLocation`), `xsi:type` and `xsi:nil`
 * ({@link isInstanceAttribute}), and, E3's one difference, `xml:lang` and `xml:base`
 * ({@link isLangOrBase}).
 *
 * The structural walk judges `xsi:type` and `xsi:nil` on every element it checks (reading 47), so
 * a valid `xsi:type` is kept, never marked; on an element only a wildcard admits neither is judged.
 *
 * @param attribute The attribute.
 * @returns Whether it is an allowance.
 */
const isKeptEverywhere = (attribute: SourceAttribute): boolean =>
  isAllowance(attribute) || isInstanceAttribute(attribute) || isLangOrBase(attribute);

/**
 * Report whether an element's table declares an attribute by its exact namespace and local name,
 * a prohibited declaration not counting.
 *
 * @param table The table that governs the element.
 * @param namespace The attribute's namespace, `""` for none.
 * @param local The attribute's local name.
 * @returns Whether the table declares it.
 */
const declares = (table: ContentTable, namespace: string, local: string): boolean =>
  table.attributes.some(
    (declaration) =>
      declaration.use !== "prohibited" &&
      declaration.namespace === namespace &&
      declaration.local === local,
  );

/**
 * Report whether E3 keeps an attribute of a QTI-namespace element.
 *
 * It keeps an allowance and an attribute the table that governs the element declares by name.
 * Reading 10 accepts both `aria-keyshorts` and `aria-keyshortcuts` where the table declares
 * `aria-keyshorts` (the empty elements), so `aria-keyshortcuts` is kept there too. Names compare
 * exactly, as XML's do.
 *
 * @param table The table that governs the element, none when the XSD declares no element of its
 *   name.
 * @param attribute The attribute.
 * @returns Whether it stays; any other attribute was admitted only by a wildcard.
 */
const isKept = (table: Option.Option<ContentTable>, attribute: SourceAttribute): boolean =>
  isKeptEverywhere(attribute) ||
  Option.exists(
    table,
    (declared) =>
      declares(declared, attribute.namespace, attribute.local) ||
      (attribute.namespace === "" &&
        attribute.local === "aria-keyshortcuts" &&
        declares(declared, "", "aria-keyshorts")),
  );

/**
 * Secure one element's attributes: remove each one only a wildcard admits (E3) and pass each URL
 * attribute through `url.ts`.
 *
 * An element the structural walk checked is read by the table that governs it, so an attribute a
 * valid `xsi:type`'s type declares is kept (AD-9); any other QTI-namespace element by its name's
 * table.
 *
 * @param visit The element's visit.
 * @param tables The tables.
 * @param governing The table that governs each element the structural walk checked.
 * @param marks Where E3's marks are collected.
 * @param drops Where each dropped URL's feature is collected, by element path.
 * @returns The attributes that stay, each kept URL in its parsed form.
 */
const secureAttributes = (
  visit: Visit,
  tables: Tables,
  governing: ReadonlyMap<SourceElement, ContentTable>,
  marks: UnsupportedFeature[],
  drops: Map<string, string[]>,
): readonly SourceAttribute[] => {
  const { element, path } = visit;
  if (element.namespace !== qtiNamespace) {
    return element.attributes;
  }

  const table = Option.orElse(
    Option.fromUndefinedOr(governing.get(element)),
    (): Option.Option<ContentTable> => tableOf(tables, element.local),
  );
  const kept: SourceAttribute[] = [];
  for (const attribute of element.attributes) {
    if (!isKept(table, attribute)) {
      marks.push({ feature: `attribute:${attributeName(attribute)}`, path, shown: "mark" });
      continue;
    }

    const context =
      attribute.namespace === "" ? urlContextOf(element.local, attribute.local) : Option.none();
    if (Option.isNone(context)) {
      kept.push(attribute);
      continue;
    }

    const url = classifyUrl(context.value, attribute.value);
    if (url.kind === "dropped") {
      const features = drops.get(path) ?? [];
      if (!features.includes(url.feature)) {
        drops.set(path, [...features, url.feature]);
      }
    } else {
      kept.push({ ...attribute, value: formatUrl(url) });
    }
  }

  return kept;
};

/**
 * Secure a source before the item is built from it.
 *
 * Each element is rebuilt after its descendants, from the walk in reverse, so the work needs no
 * call stack however deep the document. Element paths do not change: they depend only on element
 * names and their order.
 *
 * @param source A document the validators accepted and phase 1 can judge.
 * @param tables The tables it was checked against.
 * @returns The secured source, E3's marks and the dropped URLs.
 */
const secure = (source: SourceDocument, tables: Tables): Secured => {
  const marks: UnsupportedFeature[] = [];
  const drops = new Map<string, string[]>();
  const governing = governingTables(source, tables);
  const visits = [...walk(source)];
  const attributes = new Map(
    visits.map(
      (visit) => [visit.element, secureAttributes(visit, tables, governing, marks, drops)] as const,
    ),
  );
  const rebuilt = new Map<SourceElement, SourceElement>();
  for (const { element } of visits.toReversed()) {
    rebuilt.set(element, {
      ...element,
      attributes: attributes.get(element) ?? element.attributes,
      children: element.children.map((child): SourceChild =>
        child.kind === "element" ? (rebuilt.get(child) ?? child) : child,
      ),
    });
  }

  return {
    drops,
    marks,
    source: { location: source.location, root: rebuilt.get(source.root) ?? source.root },
  };
};

/**
 * The body nodes a placement gives back, and the notices that move up to the enclosing media
 * element.
 */
interface Placed {
  readonly lifted: readonly Unsupported[];
  readonly nodes: readonly BodyNode[];
}

/**
 * Report whether a body element holds nothing a reader sees: no element, and no text but XML
 * whitespace.
 *
 * @param children The element's children.
 * @returns Whether they are empty to the eye.
 */
const isBare = (children: readonly BodyNode[]): boolean =>
  children.every((child) => child.kind === "text" && /^[ \t\r\n]*$/u.test(child.text));

/**
 * Construct the notices of the URLs dropped from one element, and note that they were placed.
 *
 * @param drops The dropped URLs' features, by element path.
 * @param placed The paths whose notices are in the body.
 * @param path The element's path.
 * @returns One notice per feature, in order.
 */
const noticesAt = (
  drops: ReadonlyMap<string, readonly string[]>,
  placed: Set<string>,
  path: string,
): readonly Unsupported[] => {
  const features = drops.get(path) ?? [];
  if (features.length > 0) {
    placed.add(path);
  }

  return features.map((feature) => ({ feature, kind: "unsupported", path }));
};

/**
 * Place the URL notices among a list of body nodes and inside them.
 *
 * @param nodes The nodes.
 * @param drops The dropped URLs' features, by element path.
 * @param placed The paths whose notices are in the body, added to as they are placed.
 * @param inMedia Whether a media element encloses the nodes.
 * @returns The nodes with their notices, and the notices lifted out of them.
 */
const placeNodes = (
  nodes: readonly BodyNode[],
  drops: ReadonlyMap<string, readonly string[]>,
  placed: Set<string>,
  inMedia: boolean,
): Placed => {
  const out: BodyNode[] = [];
  const lifted: Unsupported[] = [];
  for (const node of nodes) {
    // oxlint-disable-next-line eslint/no-use-before-define -- `placeNodes` and `placeNode` are mutually recursive, as body nodes nest; the call runs only after both are defined.
    const result = placeNode(node, drops, placed, inMedia);
    for (const placedNode of result.nodes) {
      out.push(placedNode);
    }
    for (const notice of result.lifted) {
      lifted.push(notice);
    }
  }

  return { lifted, nodes: out };
};

/**
 * The parts of a Choice or an Inline Choice with their URL notices placed: its Prompt or Label,
 * its choices, and the notices lifted out of them.
 */
interface PlacedChoiceParts {
  readonly choices: readonly SimpleChoice[];
  readonly lead: Option.Option<readonly BodyNode[]>;
  readonly lifted: readonly Unsupported[];
}

/**
 * Place the URL notices inside the parts of a Choice or an Inline Choice: its Prompt or Label
 * first, then each choice's content in document order.
 *
 * @param lead The content of the Choice's Prompt or the Inline Choice's Label, none when it has
 *   none.
 * @param choices The choices.
 * @param drops The dropped URLs' features, by element path.
 * @param placed The paths whose notices are in the body, added to as they are placed.
 * @param inMedia Whether a media element encloses the interaction.
 * @returns The Prompt or Label and the choices with their notices, and the notices lifted out of
 *   them, the Prompt's or Label's first.
 */
const placeChoiceParts = (
  lead: Option.Option<readonly BodyNode[]>,
  choices: readonly SimpleChoice[],
  drops: ReadonlyMap<string, readonly string[]>,
  placed: Set<string>,
  inMedia: boolean,
): PlacedChoiceParts => {
  const leading = lead.pipe(Option.map((nodes) => placeNodes(nodes, drops, placed, inMedia)));
  const entries = choices.map((choice) => ({
    choice,
    placed: placeNodes(choice.content, drops, placed, inMedia),
  }));

  return {
    choices: entries.map((entry) => ({ ...entry.choice, content: entry.placed.nodes })),
    lead: leading.pipe(Option.map((result) => result.nodes)),
    lifted: [
      ...Option.match(leading, { onNone: () => [], onSome: (result) => result.lifted }),
      ...entries.flatMap((entry) => entry.placed.lifted),
    ],
  };
};

/**
 * Place the URL notices of one body node and of its subtree.
 *
 * A notice follows its element as its next sibling. A link the drop leaves bare, with no element
 * and no text, is replaced by its notice. A `source` or `track` inside an `audio`, `picture` or
 * `video` lifts its notice to just after that media element, where a reader sees it; inside, it
 * would be fallback content.
 *
 * @param node The node.
 * @param drops The dropped URLs' features, by element path.
 * @param placed The paths whose notices are in the body, added to as they are placed.
 * @param inMedia Whether a media element encloses the node.
 * @returns The node and its notices, and the notices lifted out of it.
 */
const placeNode = (
  node: BodyNode,
  drops: ReadonlyMap<string, readonly string[]>,
  placed: Set<string>,
  inMedia: boolean,
): Placed => {
  switch (node.kind) {
    case "element": {
      const media = mediaElements.has(node.tag);
      const inner = placeNodes(node.children, drops, placed, inMedia || media);
      const element: BodyNode = { ...node, children: inner.nodes };
      const own = noticesAt(drops, placed, node.path);
      if (media) {
        return { lifted: [], nodes: [element, ...own, ...inner.lifted] };
      }

      if (inMedia && mediaSources.has(node.tag)) {
        return { lifted: [...inner.lifted, ...own], nodes: [element] };
      }

      if (node.tag === "a" && own.length > 0 && isBare(node.children)) {
        return { lifted: inner.lifted, nodes: own };
      }

      return { lifted: inner.lifted, nodes: [element, ...own] };
    }

    case "choice": {
      const parts = placeChoiceParts(node.prompt, node.choices, drops, placed, inMedia);

      return {
        lifted: parts.lifted,
        nodes: [{ ...node, choices: parts.choices, prompt: parts.lead }],
      };
    }

    case "extended-text": {
      const prompt = node.prompt.pipe(
        Option.map((nodes) => placeNodes(nodes, drops, placed, inMedia)),
      );

      return {
        lifted: Option.match(prompt, { onNone: () => [], onSome: (result) => result.lifted }),
        nodes: [{ ...node, prompt: prompt.pipe(Option.map((result) => result.nodes)) }],
      };
    }

    case "inline-choice": {
      const parts = placeChoiceParts(node.label, node.choices, drops, placed, inMedia);

      return {
        lifted: parts.lifted,
        nodes: [{ ...node, choices: parts.choices, label: parts.lead }],
      };
    }

    case "feedback-block":
    case "feedback-inline":
    case "template-block":
    case "template-inline": {
      const inner = placeNodes(node.content, drops, placed, inMedia);

      return { lifted: inner.lifted, nodes: [{ ...node, content: inner.nodes }] };
    }

    case "printed-variable":
    case "text":
    case "text-entry":
    case "unsupported": {
      return { lifted: [], nodes: [node] };
    }

    default: {
      return node satisfies never;
    }
  }
};

/**
 * Put every unsupported feature of an accepted document in document order, each once per feature
 * and path.
 *
 * @param entries The item's own features, then E3's marks, then the dropped URLs'.
 * @param source The document, whose walk gives each element's order.
 * @returns The features ordered by their element, keeping the given order within one element.
 */
const inDocumentOrder = (
  entries: readonly UnsupportedFeature[],
  source: SourceDocument,
): readonly UnsupportedFeature[] => {
  const order = new Map(Array.from(walk(source), (visit, index) => [visit.path, index] as const));
  const seen = new Set<string>();
  const unique = entries.filter((entry) => {
    const key = `${entry.feature}\n${entry.path}`;
    const fresh = !seen.has(key);
    seen.add(key);

    return fresh;
  });

  return unique.toSorted((a, b) => (order.get(a.path) ?? 0) - (order.get(b.path) ?? 0));
};

/**
 * Give the item its URL notices and the accepted document's unsupported features.
 *
 * A dropped URL whose element the body or a modal feedback's content holds is a notice beside it.
 * One inside a part the page already shows as a notice, or outside both, has no place to show, so
 * it is a mark.
 *
 * @param built The item built from the secured source.
 * @param secured The secured source and what securing it removed.
 * @returns The item with its notices placed and every unsupported feature listed.
 */
const complete = (built: Item, secured: Secured): Item => {
  const placed = new Set<string>();
  const result = placeNodes(built.body, secured.drops, placed, false);
  const modalFeedback = built.modalFeedback?.map((feedback) => {
    const content = placeNodes(feedback.content, secured.drops, placed, false);

    return { ...feedback, content: [...content.nodes, ...content.lifted] };
  });
  const dropped = Array.from(secured.drops, ([path, features]) =>
    features.map((feature): UnsupportedFeature => ({
      feature,
      path,
      shown: placed.has(path) ? "notice" : "mark",
    })),
  ).flat();

  const completed: Item = {
    ...built,
    body: [...result.nodes, ...result.lifted],
    unsupported: inDocumentOrder(
      [...built.unsupported, ...secured.marks, ...dropped],
      secured.source,
    ),
  };

  return modalFeedback === undefined ? completed : { ...completed, modalFeedback };
};

/**
 * Collect every reason plate cannot judge a document: a root other than an item, a test, a section
 * or a stimulus, then in document order each MathML, SSML or XInclude element whose parent is
 * outside its namespace, each attribute whose value holds an unexpanded entity reference, and each
 * element with one among its children.
 *
 * In a test or a section an XInclude `include` is no reason: the test model marks it
 * `xi:include` and leaves it out, as it is never fetched.
 *
 * @param source A document whose root is in QTI's namespace.
 * @param kind The root's kind.
 * @returns The reasons, empty when plate can judge all of it.
 */
const uncheckedReasons = (
  source: SourceDocument,
  kind: VerdictKind,
): readonly UncheckedReason[] => {
  const includes = kind !== "section" && kind !== "test";
  const reasons: UncheckedReason[] = [];
  for (const { element, parent, path } of walk(source)) {
    /**
     * Report whether the element starts an island of a namespace: it is in that namespace and its
     * parent, if any, is not.
     *
     * @param namespace The island's namespace.
     * @returns Whether the element is the island's outermost element.
     */
    const island = (namespace: string): boolean =>
      element.namespace === namespace &&
      !Option.exists(parent, (container) => container.namespace === namespace);
    if (Option.isNone(parent) && !isAcceptedKind(kind)) {
      reasons.push({ path, reason: "root" });
    }

    if (island(mathmlNamespace)) {
      reasons.push({ path, reason: "mathml" });
    }

    if (island(ssmlNamespace)) {
      reasons.push({ path, reason: "ssml" });
    }

    if (includes && island(xincludeNamespace)) {
      reasons.push({ path, reason: "xinclude" });
    }

    for (const attribute of element.attributes) {
      if (attribute.references.length > 0) {
        reasons.push({ path: attributePath(path, attribute), reason: "entity" });
      }
    }

    if (element.children.some((child) => child.kind === "entity")) {
      reasons.push({ path, reason: "entity" });
    }
  }

  return reasons;
};

/**
 * Construct the refusal of a root outside QTI's namespace.
 *
 * @param source The document.
 * @returns The refusal `not-qti-root` at the root, naming its local name and namespace.
 */
const notQtiRoot = (source: SourceDocument): Refusal =>
  new Refusal({
    detail: { element: source.root.local, namespace: source.root.namespace },
    document: source.location,
    location: { kind: "path", path: `{${source.root.namespace}}${source.root.local}` },
    readerRule: Option.none(),
    rule: "not-qti-root",
    suggestion: Option.none(),
  });

/**
 * Construct the refusal `missing-attribute` of an attribute a root must carry.
 *
 * @param source The document.
 * @param name The attribute's name.
 * @returns The refusal at the root.
 */
const missingRootAttribute = (source: SourceDocument, name: string): Refusal =>
  new Refusal({
    detail: { attribute: name, element: source.root.local },
    document: source.location,
    location: { kind: "path", path: source.root.local },
    readerRule: Option.none(),
    rule: "missing-attribute",
    suggestion: Option.none(),
  });

/**
 * Read an attribute in no namespace that a QTI root must carry.
 *
 * @param source The document, its root in QTI's namespace.
 * @param name The attribute's name.
 * @returns Its value as written, or the refusal `missing-attribute`, which a document the
 *   structural validator accepted never gives.
 */
const rootAttribute = (source: SourceDocument, name: string): Result.Result<string, Refusal> =>
  Option.match(
    Arr.findFirst(
      source.root.attributes,
      (attribute) => attribute.namespace === "" && attribute.local === name,
    ),
    {
      onNone: () => Result.fail(missingRootAttribute(source, name)),
      onSome: (attribute) => Result.succeed(attribute.value),
    },
  );

/**
 * Read what M2 holds of a section or a stimulus document: its identifier, its title and its root
 * mark.
 *
 * @param source A section or stimulus document the validators accepted.
 * @param mark The root's mark.
 * @returns The summary, or the refusal `missing-attribute`, which a document the structural
 *   validator accepted never gives.
 */
const summarise = (source: SourceDocument, mark: TestMark): Result.Result<RootSummary, Refusal> =>
  Result.gen(function* summary() {
    const identifier = trimXmlSpace(yield* rootAttribute(source, "identifier"));
    const title = yield* rootAttribute(source, "title");

    return {
      document: source.location,
      identifier,
      title,
      unsupported: [{ feature: mark, path: source.root.local, shown: "mark" }],
    };
  });

/**
 * Give the verdict on an item that every validator accepted and plate can judge: secure it, build
 * it, and accept it.
 *
 * @param source The item.
 * @param tables The tables it was checked against.
 * @returns `refused` when the builder refuses it, else `accepted` or `accepted-with-unsupported`.
 */
const checkItem = (source: SourceDocument, tables: Tables): Verdict => {
  const document = source.location;
  const secured = secure(source, tables);
  const built = Effect.runSync(Effect.result(buildItem(secured.source)));
  if (Result.isFailure(built)) {
    return { document, kind: "item", refusals: [built.failure], verdict: "refused" };
  }

  const item = complete(built.success, secured);
  const accepted = accept({ document, item, unsupported: item.unsupported });

  return item.unsupported.length > 0
    ? { accepted, document, kind: "item", verdict: "accepted-with-unsupported" }
    : { accepted, document, kind: "item", verdict: "accepted" };
};

/**
 * Give the verdict on a test that every validator accepted and plate can judge: build the test
 * model and accept it.
 *
 * @param source The test.
 * @returns `refused` when the builder refuses it, else `accepted-with-unsupported` when it holds a
 *   feature M2 marks and `accepted` when it holds none.
 */
const checkTest = (source: SourceDocument): Verdict => {
  const document = source.location;
  const built = Effect.runSync(Effect.result(buildTest(source)));
  if (Result.isFailure(built)) {
    return { document, kind: "test", refusals: [built.failure], verdict: "refused" };
  }

  const test = built.success;
  const accepted = acceptTest({ document, test, unsupported: test.unsupported });

  return test.unsupported.length > 0
    ? { accepted, document, kind: "test", verdict: "accepted-with-unsupported" }
    : { accepted, document, kind: "test", verdict: "accepted" };
};

/**
 * Give the verdict on a section or a stimulus document that every validator accepted and plate can
 * judge: always `accepted-with-unsupported`, with its root's mark, as M2 delivers neither alone.
 *
 * @param source The section or stimulus.
 * @param kind Which of the two it is.
 * @returns The verdict.
 */
const checkUndelivered = (source: SourceDocument, kind: "section" | "stimulus"): Verdict => {
  const document = source.location;
  const summary = summarise(
    source,
    kind === "section" ? "root:qti-assessment-section" : "root:qti-assessment-stimulus",
  );
  if (Result.isFailure(summary)) {
    return { document, kind, refusals: [summary.failure], verdict: "refused" };
  }

  return kind === "section"
    ? {
        accepted: acceptSection(summary.success),
        document,
        kind,
        verdict: "accepted-with-unsupported",
      }
    : {
        accepted: acceptStimulus(summary.success),
        document,
        kind,
        verdict: "accepted-with-unsupported",
      };
};

/**
 * Give the verdict on a document, in order:
 *
 * 1. A root outside QTI's namespace is `refused`, of kind `none`, with `not-qti-root` alone.
 * 2. The structural validator's refusals, the item prose rules' and the test prose rules', together
 *    and in that order, with no short-circuit: any one makes the document `refused`, with all of
 *    them. Each rule set judges only its own roots.
 * 3. A document holding MathML, SSML, an unexpanded entity reference, an XInclude `include` in
 *    anything but a test or a section, or a root other than an item, a test, a section or a
 *    stimulus, is `unchecked`, with every reason. It is never rendered.
 * 4. An item: each attribute only a wildcard admitted is removed and marked `attribute:<name>` (E3),
 *    and each URL attribute goes through `url.ts`: a kept value is written in its parsed form, and
 *    a dropped one goes, with its notice beside its element. The item is built from the secured
 *    source. A refusal of the builder, such as `value-type` or `count-range`, makes the document
 *    `refused`. Otherwise it is `accepted-with-unsupported` when anything is unsupported, the
 *    builder's `variable:<identifier>` marks included, and `accepted` when nothing is.
 * 5. A test: the test model is built. A refusal of the builder makes the document `refused`; otherwise
 *    it is `accepted-with-unsupported` when the test holds a feature M2 marks and `accepted` when
 *    it holds none.
 * 6. A section or a stimulus is `accepted-with-unsupported`, marked `root:qti-assessment-section` or
 *    `root:qti-assessment-stimulus`.
 *
 * Every verdict carries its root's kind, `"none"` for a root that is none of QTI 3's six.
 *
 * @param source The document, as the reader adapter built it.
 * @param tables The tables generated from the QTI XSD.
 * @returns The verdict. A refusal is a verdict, never a failure. A defect of the item or test
 *   builder, which a checked document cannot cause, is thrown.
 */
export const check = (source: SourceDocument, tables: Tables): Verdict => {
  const document = source.location;
  if (source.root.namespace !== qtiNamespace) {
    return { document, kind: "none", refusals: [notQtiRoot(source)], verdict: "refused" };
  }

  const kind = kindOf(source.root);
  const refusals = [
    ...checkStructure(source, tables),
    ...checkRules(source, tables),
    ...checkTestRules(source, tables),
  ];
  if (Arr.isReadonlyArrayNonEmpty(refusals)) {
    return { document, kind, refusals, verdict: "refused" };
  }

  const reasons = uncheckedReasons(source, kind);
  if (reasons.length > 0 || !isAcceptedKind(kind)) {
    return { document, kind, reasons, verdict: "unchecked" };
  }

  switch (kind) {
    case "item": {
      return checkItem(source, tables);
    }
    case "test": {
      return checkTest(source);
    }
    case "section":
    case "stimulus": {
      return checkUndelivered(source, kind);
    }
    default: {
      return kind satisfies never;
    }
  }
};

/**
 * Construct an {@link Accepted} from a hand-built item: the one named seam through which tests
 * reach `redact` and `score` without a source. Nothing outside a test calls it; it secures
 * nothing, so it must never take an item a host built from untrusted content.
 *
 * @param item The hand-built item.
 * @returns The item accepted as it is, with its own unsupported features.
 */
export const acceptForTest = (item: Item): Accepted =>
  accept({ document: item.document, item, unsupported: item.unsupported });

/**
 * Construct an {@link AcceptedTest} from a hand-built test model: the one named seam through which
 * tests reach a session without a source. Nothing outside a test calls it.
 *
 * @param test The hand-built test.
 * @returns The test accepted as it is, with its own unsupported features.
 */
export const acceptTestForTest = (test: Test): AcceptedTest =>
  acceptTest({ document: test.document, test, unsupported: test.unsupported });

/**
 * Construct an {@link AcceptedSection} from a hand-built summary: the one named seam for tests.
 * Nothing outside a test calls it.
 *
 * @param section The hand-built summary.
 * @returns The section accepted as it is.
 */
export const acceptSectionForTest = (section: RootSummary): AcceptedSection =>
  acceptSection(section);

/**
 * Construct an {@link AcceptedStimulus} from a hand-built summary: the one named seam for tests.
 * Nothing outside a test calls it.
 *
 * @param stimulus The hand-built summary.
 * @returns The stimulus accepted as it is.
 */
export const acceptStimulusForTest = (stimulus: RootSummary): AcceptedStimulus =>
  acceptStimulus(stimulus);

/**
 * Read the accepted item out of a verdict: the one way a caller reads one.
 *
 * An `accepted` or `accepted-with-unsupported` verdict of kind `item` gives its {@link Accepted};
 * `unchecked` and `refused` give none, and so does an accepting verdict on a test, a section or a
 * stimulus.
 *
 * @param verdict The verdict, as {@link check} gave it.
 * @returns The accepted item, or none when the verdict accepts no item.
 */
export const acceptedItem = (verdict: Verdict): Option.Option<Accepted> =>
  (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
  verdict.kind === "item"
    ? Option.some(verdict.accepted)
    : Option.none();

/**
 * Give the features an accepting verdict names as not rendered or not delivered, for a document of
 * any kind: an item's, a test's marks, or a section's or stimulus's root mark.
 *
 * @param verdict The verdict, as {@link check} gave it.
 * @returns The accepted document's unsupported features, in its order; none for `unchecked` and
 *   `refused`.
 */
export const unsupportedFeatures = (verdict: Verdict): readonly UnsupportedFeature[] =>
  verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
    ? verdict.accepted.unsupported
    : [];

/**
 * Write text as a Markdown code span that holds it exactly (CommonMark 0.31.2, §6.1), so that a
 * refusal's facts, which are author text, stay text: no backtick in them closes the span early.
 *
 * - The fence is one backtick longer than the longest run of backticks in the text, so no run inside
 *   matches it.
 * - One space pads each side when the text begins or ends with a backtick, or begins and ends with a
 *   space without being all spaces, where a space is U+0020 alone: a tab or any other whitespace is
 *   content. A renderer removes one space from each side of such a span and of no other, so the
 *   text it shows is the text given.
 * - Each line ending is written as a space, which is what a renderer shows for one inside a span. A
 *   blank line would end the paragraph and leave the span open, with the text after it live.
 * - Empty text, which no span holds, is written as a span of one space.
 *
 * @param text The text, as the detail holds it.
 * @returns The code span.
 */
const code = (text: string): string => {
  const line = text.replaceAll(/\r\n|\r|\n/gu, " ");

  if (line === "") {
    return "` `";
  }

  let longest = 0;

  for (const [run] of line.matchAll(/`+/gu)) {
    longest = Math.max(longest, run.length);
  }

  const fence = "`".repeat(longest + 1);
  const padded =
    line.startsWith("`") ||
    line.endsWith("`") ||
    (line.startsWith(" ") && line.endsWith(" ") && /[^ ]/u.test(line));
  const inner = padded ? ` ${line} ` : line;

  return `${fence}${inner}${fence}`;
};

/**
 * QTI 3.0's namespace as a sentence names it.
 */
const qtiNamespaceText = code(qtiNamespace);

/**
 * Read one fact of a refusal's detail.
 *
 * @param refusal The refusal.
 * @param key The fact's name.
 * @param fallback What to write when the detail lacks it.
 * @returns The fact as written.
 */
const fact = (refusal: Refusal, key: string, fallback: string): string =>
  Object.hasOwn(refusal.detail, key) ? (refusal.detail[key] ?? fallback) : fallback;

/**
 * Read an optional fact of a refusal's detail.
 *
 * @param refusal The refusal.
 * @param key The fact's name.
 * @returns The fact, or none when the detail lacks it.
 */
const optionalFact = (refusal: Refusal, key: string): Option.Option<string> =>
  Object.hasOwn(refusal.detail, key) ? Option.fromUndefinedOr(refusal.detail[key]) : Option.none();

/**
 * Write a fact of a refusal's detail that holds text the document controls, such as a parser's
 * message, in a code span.
 *
 * @param refusal The refusal.
 * @param key The fact's name.
 * @param fallback What to write, as prose, when the detail lacks it.
 * @returns The fact in a code span, or the fallback.
 */
const quoted = (refusal: Refusal, key: string, fallback: string): string =>
  Option.match(optionalFact(refusal, key), { onNone: () => fallback, onSome: code });

/**
 * Cite the reading a refusal's detail names, if any.
 *
 * @param refusal The refusal.
 * @returns ` (reading <n>)`, or nothing.
 */
const citation = (refusal: Refusal): string =>
  Option.match(optionalFact(refusal, "reading"), {
    onNone: () => "",
    onSome: (reading) => ` (reading ${reading})`,
  });

/**
 * Cite what settles a refusal: the reading its detail names, or else the line of QTI's information
 * model its `source` names, for a rule the information model states and no shared reading carries.
 *
 * @param refusal The refusal.
 * @returns ` (reading <n>)`, ` (<source>)`, or nothing.
 */
const settled = (refusal: Refusal): string =>
  Option.match(optionalFact(refusal, "reading"), {
    onNone: () =>
      Option.match(optionalFact(refusal, "source"), {
        onNone: () => "",
        onSome: (line) => ` (${line})`,
      }),
    onSome: (reading) => ` (reading ${reading})`,
  });

/**
 * Open a content refusal's sentence: the document and where in it, each name the document controls
 * in a code span.
 *
 * @param refusal The refusal.
 * @returns `**<document>, at <location>: refused.**`, or `**<document>: refused.**` for one that
 *   points at the whole document.
 */
const opening = (refusal: Refusal): string => {
  const document = code(refusal.document);

  switch (refusal.location.kind) {
    case "path": {
      return `**${document}, at ${code(refusal.location.path)}: refused.**`;
    }
    case "position": {
      return `**${document}, at line ${refusal.location.line}, column ${refusal.location.column}: refused.**`;
    }
    case "document": {
      return `**${document}: refused.**`;
    }
    default: {
      return refusal.location satisfies never;
    }
  }
};

/**
 * Write a content refusal in its shape: the document and the location, what is wrong, the rule,
 * and what to change.
 *
 * @param refusal The refusal.
 * @param wrong What is wrong, one sentence.
 * @param change What to change to make the document valid.
 * @returns The sentence.
 */
const sentence = (refusal: Refusal, wrong: string, change: string): string =>
  `${opening(refusal)} ${wrong} Rule ${code(refusal.rule)}. To make it valid: ${change}.`;

/**
 * Write a refusal of a file that is not a QTI document.
 *
 * @param refusal The refusal.
 * @param wrong What is wrong, one sentence.
 * @param change What to change.
 * @returns The sentence.
 */
const notQti = (refusal: Refusal, wrong: string, change: string): string =>
  `**${code(refusal.document)}: refused, not a QTI document.** ${wrong} Rule ${code(refusal.rule)}: a document is well-formed XML whose root is a QTI 3.0 element. To make it valid: ${change}.`;

/**
 * Name a base type in a sentence, `untyped` for none.
 *
 * @param baseType The base type as the detail writes it.
 * @returns The base type in code, or `untyped`.
 */
const baseTypeText = (baseType: string): string => (baseType === "" ? "untyped" : code(baseType));

/**
 * Word a kind of variable a detail names: an `undeclared-variable` refusal's `expected`, one kind
 * of a template rule's space-separated `expected` list, or a P20 refusal's `targetKind`.
 *
 * @param expected The kind: `response`, `outcome`, `template` or `variable`.
 * @returns The noun, `variable` for any other kind.
 */
const variableKind = (expected: string): string => {
  switch (expected) {
    case "outcome":
    case "response": {
      return expected;
    }
    case "template": {
      return "template variable";
    }
    default: {
      return "variable";
    }
  }
};

/**
 * Name the facts most refusals word: the element, the attribute and the reading cited.
 *
 * @param refusal The refusal.
 * @returns The element and attribute as the detail names them, and the citation.
 */
const named = (refusal: Refusal) => ({
  attribute: fact(refusal, "attribute", "the attribute"),
  cite: citation(refusal),
  element: fact(refusal, "element", "the element"),
});

/**
 * Open a noun phrase with its indefinite article: `an` before a vowel, as in `an ordered`, and `a`
 * otherwise. Every phrase it opens starts with a cardinality or a kind of variable, in prose.
 *
 * @param phrase The noun phrase.
 * @returns The phrase after its article.
 */
const withArticle = (phrase: string): string =>
  `${/^[aeiou]/u.test(phrase) ? "an" : "a"} ${phrase}`;

/**
 * Offer the words of a space-separated list as alternatives: `a`, `a or b`, `a, b or c`.
 *
 * @param list The words, separated by spaces, as a refusal's detail writes them.
 * @param word How to write each word.
 * @returns The words, joined.
 */
const alternatives = (list: string, word: (one: string) => string): string => {
  const words = list
    .split(" ")
    .filter((one) => one !== "")
    .map((one) => word(one));
  const last = words.at(-1) ?? "";

  return words.length < 2 ? last : `${words.slice(0, -1).join(", ")} or ${last}`;
};

/**
 * Word an `expression-type` refusal of an operand the element does not take (`check: "operand"`,
 * pantry's P23), counted from 1.
 *
 * The sentence names the type the operand has and what the element takes: the
 * `acceptsCardinalities` and `acceptsBaseTypes` its rule names, in the rule's order, where
 * `acceptsBaseTypes` of `any` is a kind that takes a value of any base type and names none. Every
 * producer writes both accepts facts (`operandTypes` in `#plate/validate/rules.ts`).
 *
 * @param refusal The refusal.
 * @param element The element's local name.
 * @param expression The operand's cardinality and base type, as a sentence words them.
 * @returns The sentence.
 */
const operandType = (refusal: Refusal, element: string, expression: string): string => {
  const operand = fact(refusal, "operand", "");
  const baseTypes = fact(refusal, "acceptsBaseTypes", "");
  const cardinalities = fact(refusal, "acceptsCardinalities", "");
  const taken = withArticle(
    baseTypes === "any"
      ? `${alternatives(cardinalities, String)} value of any base type`
      : `${alternatives(cardinalities, String)} ${alternatives(baseTypes, code)} value`,
  );

  return sentence(
    refusal,
    `Operand ${operand} of ${code(element)} is ${withArticle(expression)} value, which ${code(element)} does not take; it takes ${taken}${citation(refusal)}.`,
    `give operand ${operand} ${taken}`,
  );
};

/**
 * What a template rule that sets a response's or an outcome's value sets, as a P20 sentence words
 * it before the variable's name: its correct response or its default value. A rule that sets the
 * variable itself has no entry.
 */
const valuesSet: ReadonlyMap<string, string> = new Map([
  ["qti-set-correct-response", "the correct response of "],
  ["qti-set-default-value", "the default value of "],
]);

/**
 * Word an `expression-type` refusal whose detail names no `check`: a lookup operand against its
 * table (reading 28), a lookup operand no lookup reads, or an expression against the variable it
 * sets (pantry's P20).
 *
 * A lookup's refusal with no `table` is a `qti-lookup-outcome-value` whose outcome a test reads
 * through an item ref (`I1.SCORE`), whose table is its item's: the sentence names what every
 * lookup reads, a single `integer`, `float` or `duration` (pantry's P22).
 *
 * The variable's type is the detail's `outcomeCardinality` and `outcomeBaseType` whatever its
 * kind, and its kind is the `targetKind` a template rule's refusal carries (`template`,
 * `response` or `outcome`), an outcome when there is none, as for a `qti-set-outcome-value`.
 *
 * @param refusal The refusal.
 * @param element The element's local name.
 * @param expression The expression's cardinality and base type, as a sentence words them.
 * @returns The sentence.
 */
const uncheckedType = (refusal: Refusal, element: string, expression: string): string => {
  const identifier = fact(refusal, "identifier", "the outcome");

  return Option.match(optionalFact(refusal, "table"), {
    onNone: () => {
      if (element === "qti-lookup-outcome-value") {
        const read = `a single ${alternatives("integer float duration", code)} value`;

        return sentence(
          refusal,
          `${code(element)} looks ${code(identifier)} up with ${withArticle(expression)} value, but a lookup reads only ${read}${citation(refusal)}.`,
          `look ${code(identifier)} up with ${read}`,
        );
      }

      const variable = withArticle(
        `${fact(refusal, "outcomeCardinality", "")} ${baseTypeText(fact(refusal, "outcomeBaseType", ""))} ${variableKind(fact(refusal, "targetKind", "outcome"))}`,
      );

      return sentence(
        refusal,
        `${code(element)} sets ${valuesSet.get(element) ?? ""}${code(identifier)}, ${variable}, to ${withArticle(expression)} value${citation(refusal)}.`,
        `give the expression the base type and cardinality of ${code(identifier)}, or change its declaration`,
      );
    },
    onSome: (table) =>
      sentence(
        refusal,
        `${code(element)} looks ${code(identifier)} up in its ${code(table)} with ${withArticle(expression)} value, which that table cannot read${citation(refusal)}.`,
        `look up a value of the base type ${code(table)} reads, or use the other lookup table`,
      ),
  });
};

/**
 * Word an `expression-type` refusal of a reference attribute (`check: "reference"`, pantry's P24):
 * an attribute names a variable that is not a single template or outcome variable of the base type
 * the attribute holds. The facts the detail carries select the sentence, in this order:
 *
 * - `expectedCardinalities`: the attribute is a `template-identifier`, which names a template
 *   variable of base type identifier, single or multiple (pantry's `template-ref`). The sentence
 *   offers the cardinalities as alternatives and cites the element's line ({@link settled}).
 * - `declarer` of `test`: the attribute is a test's printed variable's, and a test declares no
 *   template variable, so the sentence names and offers only an outcome the test declares.
 * - `variableKind`, in an item or a test: the attribute is a printed variable's `identifier`, which
 *   may name a template or outcome variable of any type (pantry's `printed-variable-ref`). The
 *   sentence names the kind the variable has, `response` or `context`, says no base type, and cites
 *   what settles it ({@link settled}). In an item, for a response, the remedy offers an outcome set
 *   to its value, as the information model suggests.
 *
 * @param refusal The refusal.
 * @param element The element's local name.
 * @param identifier The name the attribute gives, in a code span.
 * @returns The sentence.
 */
const referenceType = (refusal: Refusal, element: string, identifier: string): string => {
  const attribute = code(fact(refusal, "attribute", "the attribute"));
  const expected = baseTypeText(fact(refusal, "expectedBaseType", ""));
  const cite = citation(refusal);

  const cardinalities = optionalFact(refusal, "expectedCardinalities");
  if (Option.isSome(cardinalities)) {
    const wanted = `a template variable of base type ${expected}, ${alternatives(cardinalities.value, (one) => one)}`;

    return sentence(
      refusal,
      `${code(element)}'s attribute ${attribute} names ${identifier}, which is not ${wanted}${settled(refusal)}.`,
      `name ${wanted}, in ${attribute}`,
    );
  }

  if (fact(refusal, "declarer", "item") === "test") {
    return Option.match(optionalFact(refusal, "variableKind"), {
      onNone: () =>
        sentence(
          refusal,
          `${code(element)}'s attribute ${attribute} names ${identifier}, which is not a single outcome variable of base type ${expected}${cite}.`,
          `in ${attribute}, name a single outcome variable of base type ${expected} that the test declares, or write a value of that base type`,
        ),
      onSome: (kind) =>
        sentence(
          refusal,
          `${code(element)}'s attribute ${attribute} names ${identifier}, ${withArticle(kind)} variable, which is not an outcome variable${settled(refusal)}.`,
          `in ${attribute}, name an outcome variable that the test declares`,
        ),
    });
  }

  return Option.match(optionalFact(refusal, "variableKind"), {
    onNone: () =>
      sentence(
        refusal,
        `${code(element)}'s attribute ${attribute} names ${identifier}, which is not a single template or outcome variable of base type ${expected}${cite}.`,
        `name a single template or outcome variable of base type ${expected} in ${attribute}, or write a value of that base type there`,
      ),
    onSome: (kind) =>
      sentence(
        refusal,
        `${code(element)}'s attribute ${attribute} names ${identifier}, ${withArticle(kind)} variable, which is neither a template nor an outcome variable${settled(refusal)}.`,
        `name a template or outcome variable in ${attribute}${kind === "response" ? ", such as an outcome that response processing sets to the response's value" : ""}`,
      ),
  });
};

/**
 * The line of QTI's information model that limits what template processing reads: "An expression
 * used in a qti-template-rule must not refer to the value of a response variable or outcome
 * variable. It may only refer to the values of the template variables." Context variables "may be
 * referenced in template processing" (`info.txt:22601`), so the sentence names them beside
 * template variables.
 */
const templateReadSource = "info.txt:65111";

/**
 * The line of QTI's information model a weighted `qti-test-variables` refusal cites: a weight's
 * behaviour "is only defined if the base-type attribute is float or omitted", and the line rules
 * out `base-type` integer.
 */
const weightSource = "info.txt:71457";

/**
 * Word an `expression-type` refusal, by the `check` its detail names.
 *
 * - `condition` (pantry's P21): the condition of a rule's branch is not a single `boolean`.
 * - `operand` (P23): an operand the element does not take, and what it takes.
 * - `reference` (P24): an attribute names a variable that is not a single template or outcome
 *   variable of the base type the attribute holds, or a printed variable's `identifier` or a
 *   `template-identifier` names a variable of another kind or type (see {@link referenceType}).
 * - `template-read` (P26): template processing reads a variable that is neither a template nor a
 *   context variable (a response, an outcome or a built-in), by an element or through the reference
 *   attribute an `attribute` fact names. It cites the information model's line, which allows only
 *   template variables (`info.txt:65111`), unless the detail names a reading; the remedy offers a
 *   template variable, never `qti-correct` or `qti-default`, which read the refused variable too.
 * - `weight` (P29): a weighted `qti-test-variables` whose base type is not `float`. A weight is
 *   defined only for a `base-type` of `float` or none (`info.txt:71457`; G-R3 199), so the remedy
 *   drops the weight or the `base-type`.
 * - None: an expression against the variable it sets (P20), or a lookup operand against its table or,
 *   for an outcome a test reads through an item ref, against what every lookup reads (P22; see
 *   {@link uncheckedType}).
 *
 * An `expressionBaseType` of `""`, a type with no base type of its own, is worded `untyped`.
 *
 * @param refusal The refusal.
 * @returns The sentence.
 */
const expressionType = (refusal: Refusal): string => {
  const element = fact(refusal, "element", "the element");
  const expression = `${fact(refusal, "expressionCardinality", "")} ${baseTypeText(fact(refusal, "expressionBaseType", ""))}`;
  const identifier = code(fact(refusal, "identifier", ""));
  const cite = citation(refusal);

  switch (fact(refusal, "check", "")) {
    case "condition": {
      return sentence(
        refusal,
        `The condition of ${code(element)} is ${withArticle(expression)} value, not a single ${code("boolean")}${cite}.`,
        `change the condition to a single ${code("boolean")} expression`,
      );
    }
    case "operand": {
      return operandType(refusal, element, expression);
    }
    case "reference": {
      return referenceType(refusal, element, identifier);
    }
    case "template-read": {
      const variable = Option.match(optionalFact(refusal, "variableKind"), {
        onNone: () => "a variable",
        onSome: (kind) => `${withArticle(kind)} variable`,
      });
      const rule = `in template processing, which may read only template and context variables${cite === "" ? ` (${templateReadSource})` : cite}.`;

      return Option.match(optionalFact(refusal, "attribute"), {
        onNone: () =>
          sentence(
            refusal,
            `${code(element)} reads ${identifier}, ${variable}, ${rule}`,
            "read a template variable instead",
          ),
        onSome: (attribute) =>
          sentence(
            refusal,
            `${code(element)}'s attribute ${code(attribute)} names ${identifier}, ${variable}, ${rule}`,
            `name a template variable in ${code(attribute)}, or write a value there`,
          ),
      });
    }
    case "weight": {
      const baseType = baseTypeText(fact(refusal, "baseType", ""));

      return sentence(
        refusal,
        `${code(element)} is weighted and has the base type ${baseType}, but a weight is defined only for the base type ${code("float")} or none${cite === "" ? ` (${weightSource})` : cite}.`,
        `remove ${code("weight-identifier")} from ${code(element)}, or remove its ${code("base-type")}`,
      );
    }
    default: {
      return uncheckedType(refusal, element, expression);
    }
  }
};

/**
 * Word an `attribute-type` refusal, by the `check` its detail names.
 *
 * - `reserved-identifier` (pantry's `DeclarationNotReserved`): a declaration whose `identifier` is a
 *   built-in variable's, `completionStatus`, `numAttempts` or `duration`.
 * - `reserved-outcome-type` (pantry's `ReservedOutcomeTypes`): an outcome declaration in an item
 *   named `SCORE` or `MAXSCORE` whose `base-type` is not `float`, or one in an item or a test named
 *   `PASSED` whose `base-type` is not `boolean`; the detail names the outcome, `identifier`, and
 *   the base type it must have, `baseType`.
 * - `tolerance-token` (pantry's P6): a `qti-equal`'s `tolerance` holding a token that is neither an
 *   `xs:double` nor an NCName.
 * - None: a value outside the attribute's type, or outside what a reading or the information model
 *   narrows it to, which the `expected` fact names.
 *
 * Each cites what settles it ({@link settled}).
 *
 * @param refusal The refusal.
 * @returns The sentence.
 */
const attributeType = (refusal: Refusal): string => {
  const { attribute, element } = named(refusal);
  const value = code(fact(refusal, "value", ""));

  switch (fact(refusal, "check", "")) {
    case "reserved-identifier": {
      return sentence(
        refusal,
        `${code(element)}'s attribute ${code(attribute)} is ${value}, the identifier of a built-in variable, which no declaration may take${settled(refusal)}.`,
        `give ${code(element)} another identifier; the built-in variable needs no declaration`,
      );
    }
    case "reserved-outcome-type": {
      const baseType = code(fact(refusal, "baseType", ""));

      return sentence(
        refusal,
        `${code(element)}'s attribute ${code(attribute)} is ${value}, but an outcome named ${code(fact(refusal, "identifier", ""))} must have the base type ${baseType}${settled(refusal)}.`,
        `change ${code(attribute)} to ${baseType}, or give ${code(element)} another identifier`,
      );
    }
    case "tolerance-token": {
      return sentence(
        refusal,
        `${code(element)}'s attribute ${code(attribute)} is ${value}, which holds a token that is neither a number (${code("xs:double")}) nor a variable's name (an NCName)${settled(refusal)}.`,
        `write each token of ${code(attribute)} as a number or a variable's name, one space apart`,
      );
    }
    default: {
      const expected = optionalFact(refusal, "expected");

      return sentence(
        refusal,
        `${code(element)}'s attribute ${code(attribute)} is ${value}, which is not ${Option.getOrElse(expected, () => "a value its type allows")}${settled(refusal)}.`,
        `write a value that is ${Option.getOrElse(expected, () => "of the attribute's type")}`,
      );
    }
  }
};

/**
 * The built-in variables' identifiers, which "are reserved" (`info.txt:12006`), so no declaration
 * may take one: the names of `reservedIdentifiers` in `#plate/validate/structure.ts`, which refuses
 * such a declaration `attribute-type` (pantry's `DeclarationNotReserved`).
 */
const builtInIdentifiers: ReadonlySet<string> = new Set([
  "completionStatus",
  "duration",
  "numAttempts",
]);

/**
 * The fix of a response a test names with no item ref: a test declares no response, so it reads an
 * item's through that item's ref.
 */
const itemRefResponse = `name a response an item declares, through its item ref, written ${code("ITEMREF.RESPONSE")}`;

/**
 * Word an `undeclared-variable` refusal with no `check` whose `expected` is exactly `response`,
 * when no declaration can give its name, so the sentence does not ask for a declaration that would
 * itself be wrong. `qti-map-response`, `qti-map-response-point` and `qti-correct` read a declared
 * response's mapping, area mapping or correct response, so a name that is not one is refused
 * there: by the rules (P8), in an item and in a test, and by `openPackage` for a test's dotted name
 * read through a ref.
 *
 * - A dotted name a test reads through an item ref, test part or section: "Identifiers containing the
 *   period character are reserved for use in prefixing" (`info.txt:10122`, reading 48).
 *   `openPackage` refuses it with the `prefix` its reading reads through, since what it reads is
 *   not a response its item declares, but an outcome, a template variable or a built-in. The fix is
 *   a response the item declares, written `ITEMREF.RESPONSE`.
 * - A built-in ({@link builtInIdentifiers}): no declaration may take its name, so it has no mapping
 *   and no correct response. `numAttempts` and `duration` are "built-in response variables"
 *   (`info.txt:8466`), so the sentence calls each the built-in and never says it is no response. In
 *   an item the fix is a declared response; with `declarer: "test"` it is an item's response read
 *   through its item ref ({@link itemRefResponse}).
 * - Any other name with `declarer: "test"`: a test declares outcomes and context variables, and only
 *   its items declare responses, so the sentence says the test declares none and the fix is an
 *   item's response read through its item ref, never a declaration. A dotted name the test declares
 *   whole (reading 37), an outcome, takes it too.
 *
 * An item's dotted name with no `prefix`, one it declares whole, and every other name an item does
 * not declare take the sentence that asks for a declared response.
 *
 * @param refusal The refusal.
 * @param subject The element, or the element's attribute, as the sentence names it.
 * @returns The sentence, or none for a name an item's declaration can give, whose sentence asks for
 *   a declared response.
 */
const undeclarableResponse = (refusal: Refusal, subject: string): Option.Option<string> => {
  if (fact(refusal, "expected", "") !== "response") {
    return Option.none();
  }

  const name = fact(refusal, "identifier", "");
  const identifier = code(name);
  const test = fact(refusal, "declarer", "item") === "test";

  if (Option.isSome(optionalFact(refusal, "prefix"))) {
    return Option.some(
      sentence(
        refusal,
        `${subject} names ${identifier}, which reads, through an item ref, test part or section, a variable that is not a response its item declares.`,
        `name a response the item declares, written ${code("ITEMREF.RESPONSE")}`,
      ),
    );
  }

  if (builtInIdentifiers.has(name)) {
    return Option.some(
      sentence(
        refusal,
        `${subject} names the built-in ${identifier}, which has no declaration, so no mapping or correct response.`,
        test ? itemRefResponse : "name a declared response",
      ),
    );
  }

  return test
    ? Option.some(
        sentence(
          refusal,
          `${subject} names ${identifier}, and the test declares no response ${identifier}; only an item declares responses.`,
          itemRefResponse,
        ),
      )
    : Option.none();
};

/**
 * Word an `undeclared-variable` refusal, by the `check` its detail names.
 *
 * - `untimed-duration` (pantry's `item-duration`): the built-in `duration`, read where the item is
 *   not time dependent.
 * - `reading` (pantry's `prefixed-ref`): a dotted name that resolves to no variable of an item ref,
 *   test part or section (reading 48).
 * - `built-in-target` (pantry's P9): a rule other than `qti-set-outcome-value` that sets a built-in,
 *   citing the information model's line its `source` names.
 * - None (P8): a name the item declares no variable of the `expected` kind for. A template rule's
 *   target lists every kind the rule may set, space-separated, and the sentence offers them as
 *   alternatives (pantry's `DeclaredRefKind`). A test's printed variable, and a name in a test's
 *   processing or a section document a test reaches, carries `declarer: "test"`, and the sentence
 *   names the test as what declares no such variable (pantry's `binding-declared` for a test); a
 *   test may declare an outcome or a context variable, so the fix to declare it stands. A response
 *   that no declaration can give, a dotted name read through an item ref, test part or section, a
 *   built-in, or any response a test names, is worded by {@link undeclarableResponse}, so the
 *   sentence never asks for it to be declared.
 *
 * Each names the element, or the element's attribute when a reference attribute names the
 * variable.
 *
 * @param refusal The refusal.
 * @returns The sentence.
 */
const undeclaredVariable = (refusal: Refusal): string => {
  const element = code(named(refusal).element);
  const identifier = code(fact(refusal, "identifier", ""));
  const attribute = optionalFact(refusal, "attribute");
  const subject = Option.match(attribute, {
    onNone: () => element,
    onSome: (name) => `${element}'s attribute ${code(name)}`,
  });

  switch (fact(refusal, "check", "")) {
    case "untimed-duration": {
      return sentence(
        refusal,
        `${subject} ${Option.isSome(attribute) ? "names" : "reads"} the built-in ${identifier}, which an item that is not time dependent does not have${citation(refusal)}.`,
        `declare the item ${code('time-dependent="true"')}, or read another variable`,
      );
    }
    case "reading": {
      return sentence(
        refusal,
        `${subject} names ${identifier}, which resolves to no item ref, test part or section variable${citation(refusal)}.`,
        `name a variable that an item ref, test part or section of the test declares`,
      );
    }
    case "built-in-target": {
      const setter = code("qti-set-outcome-value");

      return sentence(
        refusal,
        `${subject} sets the built-in ${identifier}, which only a ${setter} may set${settled(refusal)}.`,
        `set ${identifier} with a ${setter}, or name a declared outcome`,
      );
    }
    default: {
      const kind = alternatives(fact(refusal, "expected", "variable"), variableKind);
      const declarer = fact(refusal, "declarer", "item") === "test" ? "test" : "item";

      return Option.getOrElse(undeclarableResponse(refusal, subject), () =>
        sentence(
          refusal,
          `${subject} names ${identifier}, and the ${declarer} declares no ${kind} ${identifier}.`,
          `declare ${identifier}, or name a declared ${kind}`,
        ),
      );
    }
  }
};

/**
 * Word the `template-requirements` refusal: the declaration a standard template, an inline
 * `qti-map-response` or a `qti-lookup-outcome-value` needs. The sentence names the template when
 * the detail has one, and otherwise the element that needs the declaration, so it never blames a
 * template the item may not have.
 *
 * A test's `qti-map-response` or `qti-map-response-point` of a dotted name carries the `prefix`
 * its reading reads through (`openPackage`, reading 48): the name reads a response the item that
 * item ref names declares without the `qti-mapping`, or the `point` base type and the
 * `qti-area-mapping`, the expression needs. The sentence names the response as that item's, and
 * the fix gives it what it lacks in that item; it never asks for the dotted name to be declared,
 * since that item already declares the response. With no `prefix`, the item lacks the
 * declaration, and the fix is to declare it.
 *
 * @param refusal The refusal.
 * @returns The sentence.
 */
const templateRequirements = (refusal: Refusal): string => {
  const baseType = optionalFact(refusal, "baseType");
  const child = optionalFact(refusal, "child");
  const needs = [
    ...baseType.pipe(
      Option.map((type) => `of base type ${code(type)}`),
      Option.toArray,
    ),
    ...child.pipe(
      Option.map((name) => `with a ${code(name)}`),
      Option.toArray,
    ),
  ].join(" ");
  const lacking = needs === "" ? "" : ` ${needs}`;
  const identifier = code(fact(refusal, "identifier", ""));
  const needer = Option.match(optionalFact(refusal, "template"), {
    onNone: () =>
      Option.match(optionalFact(refusal, "element"), {
        onNone: () => "The element",
        onSome: code,
      }),
    onSome: (uri) => `The response processing template ${code(uri)}`,
  });

  return Option.match(optionalFact(refusal, "prefix"), {
    onNone: () => {
      const declared = `${identifier} in a ${code(fact(refusal, "declaration", "declaration"))}${lacking}`;

      return sentence(
        refusal,
        `${needer} needs ${declared}, and the item has none.`,
        `declare ${declared}`,
      );
    },
    onSome: (prefix) => {
      const item = `the item that item ref ${code(prefix)} names`;
      const gives = [
        ...child.pipe(
          Option.map((name) => `a ${code(name)}`),
          Option.toArray,
        ),
        ...baseType.pipe(
          Option.map((type) => `the base type ${code(type)}`),
          Option.toArray,
        ),
      ].join(" and ");

      return sentence(
        refusal,
        `${needer} reads ${identifier}, a response of ${item}, and that item does not declare it${lacking}.`,
        `give that response ${gives === "" ? "what it needs" : gives} in ${item}`,
      );
    },
  });
};

/**
 * The sentence of each rule, one function per rule in `refusalRules`.
 *
 * M2's rules read these facts from the detail: `expression-placement` the `element`, the
 * `attribute` when an attribute is what is misplaced, the `context` it is in and the `reading`;
 * `not-qti3-package` the manifest root's `element` and `namespace`; `package-profile` the
 * `schemaversion` found, none when the manifest gives none; `package-path-outside` the `path` that
 * leaves the root, a file the package holds or a manifest `href` as written;
 * `package-file-unlisted` and `package-file-missing` the file's `path`, and the last also the
 * `resource` that lists it; `dependency-unresolved` the `resource` and the `dependency` it names;
 * `item-ref-unresolved` the item ref's `identifier`, its `href` and the `path` that resolves to;
 * `ambiguous-reference` the `reference`, its two readings as `firstPrefix` with `firstVariable`
 * and `secondPrefix` with `secondVariable`, and the `reading`; `resource-type-mismatch` the
 * declared `type`, the resource's `path`, the `root` its document has and, when known, the type
 * that root names, `expected`.
 *
 * `attribute-type` and `missing-attribute` cite the `reading` that settles them, or else the
 * `source`, a line of QTI's information model, for the floor of a literal `figures` or `n`, the
 * `tolerance` an absolute or relative `qti-equal` must carry, a declaration named after a built-in
 * variable and a `tolerance` token that is neither a number nor a name; `attribute-type` words the
 * last two by their `check` ({@link attributeType}). `missing-attribute` names the mode that
 * requires the attribute, `whenAttribute` with `whenValue`, when one does.
 */
const wordings = {
  "ambiguous-reference": (refusal) => {
    const reference = code(fact(refusal, "reference", ""));
    /**
     * Word one reading of the reference from the two facts that hold it.
     *
     * @param prefix The name of the fact that holds the reading's item ref, part or section.
     * @param variable The name of the fact that holds the variable it names there.
     * @returns The prefix with the variable, each as code.
     */
    const reading = (prefix: string, variable: string): string =>
      `${code(fact(refusal, prefix, ""))} with the variable ${code(fact(refusal, variable, ""))}`;

    return sentence(
      refusal,
      `The reference ${reference} reads two ways, ${reading("firstPrefix", "firstVariable")} and ${reading("secondPrefix", "secondVariable")}, and both name a variable that exists${citation(refusal)}.`,
      `rename the identifier whose ${code(".")} lets ${reference} split two ways, so that only one reading names a variable`,
    );
  },
  "attribute-type": attributeType,
  binding: (refusal) => {
    const interaction = fact(refusal, "interaction", "the interaction");
    const response = fact(refusal, "response", "");

    return sentence(
      refusal,
      `${code(interaction)} cannot be bound to ${code(response)}, ${withArticle(`${fact(refusal, "cardinality", "")} response`)} of base type ${baseTypeText(fact(refusal, "baseType", ""))}.`,
      `bind ${code(interaction)} to a response of a base type and cardinality it accepts, or change the declaration of ${code(response)}`,
    );
  },
  "child-count": (refusal) => {
    const { element } = named(refusal);
    const required = fact(refusal, "required", "the required number of");
    const child = fact(refusal, "child", "children");
    const source = Option.match(optionalFact(refusal, "source"), {
      onNone: () => "",
      onSome: (cited) => ` (${cited})`,
    });

    return sentence(
      refusal,
      `${code(element)} must hold ${required} ${child}${source}.`,
      `give ${code(element)} ${required} ${child}`,
    );
  },
  "count-range": (refusal) => {
    const { attribute, cite } = named(refusal);
    const least = fact(refusal, "least", "");
    const greatest = fact(refusal, "greatest", "");

    return sentence(
      refusal,
      `${code(attribute)} is ${fact(refusal, "lexical", "")}, outside the signed 64-bit range a count holds, ${least} to ${greatest}${cite}.`,
      `write a value from ${least} to ${greatest}`,
    );
  },
  "dependency-unresolved": (refusal) => {
    const dependency = code(fact(refusal, "dependency", ""));

    return sentence(
      refusal,
      `The resource ${code(fact(refusal, "resource", ""))} depends on ${dependency}, and the manifest declares no resource with that identifier.`,
      `point the ${code("dependency")} at a resource the manifest declares, or declare a resource ${dependency}`,
    );
  },
  "duplicate-identifier": (refusal) => {
    const identifier = fact(refusal, "identifier", "");

    return sentence(
      refusal,
      `The identifier ${code(identifier)} is given more than once where each must be unique.`,
      `give each one its own identifier in place of ${code(identifier)}`,
    );
  },
  /**
   * An attribute refused with no `context` is an item's weighted `qti-variable` (P12): weights are
   * "defined only in the test context (and hence only in outcomes processing)" (`info.txt:72139`),
   * so the one change an item can make is to remove the attribute. A test's refusal names its
   * `context`, and moving the expression into outcome processing is offered there.
   */
  "expression-placement": (refusal) => {
    const { cite, element } = named(refusal);
    const outcomeProcessing = code("qti-outcome-processing");
    const context = optionalFact(refusal, "context");
    const where = Option.match(context, {
      onNone: () => "",
      onSome: (container) => `, and it is in ${code(container)}`,
    });

    return Option.match(optionalFact(refusal, "attribute"), {
      onNone: () =>
        sentence(
          refusal,
          `${code(element)} is allowed only in outcome processing${where}${cite}.`,
          `move ${code(element)} into ${outcomeProcessing}, or remove it`,
        ),
      onSome: (attribute) =>
        Option.isNone(context)
          ? sentence(
              refusal,
              `${code(element)}'s attribute ${code(attribute)} is allowed only in a test's outcome processing${cite}.`,
              `remove ${code(attribute)} from ${code(element)}`,
            )
          : sentence(
              refusal,
              `${code(element)}'s attribute ${code(attribute)} is allowed only in outcome processing${where}${cite}.`,
              `remove ${code(attribute)} from ${code(element)}, or move the expression into ${outcomeProcessing}`,
            ),
    });
  },
  "expression-type": expressionType,
  "item-ref-unresolved": (refusal) => {
    const resolved = Option.match(optionalFact(refusal, "path"), {
      onNone: () => ",",
      onSome: (path) => `, which resolves to ${code(path)},`,
    });

    return sentence(
      refusal,
      `The item ref ${code(fact(refusal, "identifier", ""))} points at ${code(fact(refusal, "href", ""))}${resolved} and the manifest lists no item resource there.`,
      `point the item ref's ${code("href")} at an item resource the manifest lists, or list the item as a resource of the package`,
    );
  },
  /**
   * Reading 62's identifier rule. Its facts are the package reader's: the `resource`, its
   * document's `path` and `identifier`, the first LOM identifier entry as `metadata`, how many
   * other entries there are as `others` when there are any, and the `reading`.
   */
  "lom-identifier": (refusal) => {
    const identifier = code(fact(refusal, "identifier", ""));
    const metadata = code(fact(refusal, "metadata", ""));
    const others = Option.match(optionalFact(refusal, "others"), {
      onNone: () => "",
      onSome: (count) => ` and ${count} other ${count === "1" ? "entry" : "entries"}`,
    });

    return sentence(
      refusal,
      `The document ${code(fact(refusal, "path", ""))} has the identifier ${identifier}, and the LOM metadata of its resource ${code(fact(refusal, "resource", ""))} gives ${metadata}${others} instead; an item's or test's identifier must be one its LOM metadata gives${citation(refusal)}.`,
      `make one of the resource's LOM identifier entries ${identifier}, or change the document's ${code("identifier")} to ${metadata}`,
    );
  },
  /**
   * Reading 62's title rule. Its facts are the package reader's: the `resource`, its document's
   * `path` and `title`, the first LOM title string as `metadata`, how many other strings there are
   * as `others` when there are any, and the `reading`.
   */
  "lom-title": (refusal) => {
    const title = code(fact(refusal, "title", ""));
    const metadata = code(fact(refusal, "metadata", ""));
    const others = Option.match(optionalFact(refusal, "others"), {
      onNone: () => "",
      onSome: (count) => ` and ${count} other ${count === "1" ? "string" : "strings"}`,
    });

    return sentence(
      refusal,
      `The document ${code(fact(refusal, "path", ""))} has the title ${title}, and the LOM metadata of its resource ${code(fact(refusal, "resource", ""))} gives ${metadata}${others} instead; an item's or test's title must be one its LOM metadata gives${citation(refusal)}.`,
      `make one of the resource's LOM title strings ${title}, or change the document's ${code("title")} to ${metadata}`,
    );
  },
  "misplaced-element": (refusal) => {
    const { cite, element } = named(refusal);

    return sentence(
      refusal,
      `${code(element)} is allowed only ${fact(refusal, "requires", "elsewhere")}${cite}.`,
      `move ${code(element)} where it is allowed, or remove it`,
    );
  },
  "missing-attribute": (refusal) => {
    const { attribute, element } = named(refusal);
    const when = Option.match(optionalFact(refusal, "whenAttribute"), {
      onNone: () => "",
      onSome: (mode) => ` when ${code(mode)} is ${code(fact(refusal, "whenValue", ""))}`,
    });

    return sentence(
      refusal,
      `${code(element)} must carry the attribute ${code(attribute)}${when}, and it has none${settled(refusal)}.`,
      `add ${code(attribute)} to ${code(element)}`,
    );
  },
  "not-qti-root": (refusal) => {
    const namespace = fact(refusal, "namespace", "");
    const where = namespace === "" ? "in no namespace" : `in the namespace ${code(namespace)}`;

    return notQti(
      refusal,
      `The root element ${code(named(refusal).element)} is ${where}, not QTI 3.0's ${qtiNamespaceText}.`,
      "replace this file with the QTI document it was meant to be, or put its root in QTI 3.0's namespace",
    );
  },
  "not-qti3-package": (refusal) => {
    const namespace = fact(refusal, "namespace", "");
    const where = namespace === "" ? "in no namespace" : `in the namespace ${code(namespace)}`;

    return sentence(
      refusal,
      `The manifest's root ${code(named(refusal).element)} is ${where}, not QTI 3.0's content packaging namespace ${code(manifestNamespace)}.`,
      "give the package a QTI 3.0 manifest, whose root is in that namespace",
    );
  },
  "not-well-formed": (refusal) => {
    const at =
      refusal.location.kind === "position"
        ? ` at line ${refusal.location.line}, column ${refusal.location.column}`
        : "";

    return notQti(
      refusal,
      `The file is not well-formed XML: ${quoted(refusal, "message", "the parser stopped")}${at}.`,
      "correct the XML at that line",
    );
  },
  "package-file-missing": (refusal) => {
    const path = code(fact(refusal, "path", ""));
    const lister = Option.match(optionalFact(refusal, "resource"), {
      onNone: () => "The manifest",
      onSome: (resource) => `The resource ${code(resource)}`,
    });

    return sentence(
      refusal,
      `${lister} lists the file ${path}, and the package holds no such file.`,
      `add ${path} to the package, or remove its ${code("file")} entry`,
    );
  },
  "package-file-unlisted": (refusal) => {
    const path = code(fact(refusal, "path", ""));

    return sentence(
      refusal,
      `The package holds ${path}, and no resource in the manifest lists it in a ${code("file")} entry.`,
      `list ${path} in a ${code("file")} entry of the resource that uses it, or remove it from the package`,
    );
  },
  "package-manifest-missing": (refusal) =>
    sentence(
      refusal,
      `The package holds no ${code("imsmanifest.xml")} at its root.`,
      `add the package's manifest at its root, named ${code("imsmanifest.xml")}`,
    ),
  "package-path-outside": (refusal) => {
    const path = code(fact(refusal, "path", ""));

    return sentence(
      refusal,
      `The path ${path} leads outside the package's root.`,
      `write ${path} relative to the package's root so that it stays inside it: no leading ${code("/")}, and no ${code("..")} segment that climbs above the root, counting any ${code("xml:base")} the path is resolved against`,
    );
  },
  "package-profile": (refusal) => {
    const field = code("schemaversion");
    const accepted = cpVersions.map((version) => code(version)).join(" or ");
    const found = Option.match(optionalFact(refusal, "schemaversion"), {
      onNone: () => `The manifest gives no ${field}`,
      onSome: (version) => `The manifest's ${field} is ${code(version)}`,
    });

    return sentence(
      refusal,
      `${found}, and a QTI 3.0 package's is ${accepted}.`,
      `set the manifest's ${field} to ${accepted}, whichever QTI 3.0 profile the package follows`,
    );
  },
  "padded-attribute": (refusal) => {
    const { attribute, cite, element } = named(refusal);

    return sentence(
      refusal,
      `${code(element)}'s attribute ${code(attribute)} is ${code(fact(refusal, "value", ""))}, with whitespace at its start or end, which this value may not carry${cite}.`,
      "remove the whitespace around the value",
    );
  },
  "reader-refused": (refusal) => {
    const rule = Option.match(refusal.readerRule, {
      onNone: () => "",
      onSome: (name) => ` (reader rule ${code(name)})`,
    });

    return notQti(
      refusal,
      `The XML reader refused the file: ${quoted(refusal, "detail", "it gave no detail")}${rule}.`,
      "replace this file with the QTI document it was meant to be",
    );
  },
  "resource-type-mismatch": (refusal) => {
    const root = code(fact(refusal, "root", ""));

    return sentence(
      refusal,
      `The manifest declares ${code(fact(refusal, "path", ""))} a resource of type ${code(fact(refusal, "type", ""))}, and its document's root is ${root}.`,
      Option.match(optionalFact(refusal, "expected"), {
        onNone: () => `give the resource the type its document's root ${root} names`,
        onSome: (expected) =>
          `give the resource the type ${code(expected)}, which its document's root ${root} names`,
      }),
    );
  },
  "template-requirements": templateRequirements,
  "text-not-allowed": (refusal) => {
    const { element } = named(refusal);

    return sentence(
      refusal,
      `${code(element)} holds text, and QTI 3.0's schema allows it none.`,
      `remove the text from ${code(element)}, or wrap it in an element that allows text`,
    );
  },
  "undeclared-response": (refusal) => {
    const response = fact(refusal, "response", "");

    return sentence(
      refusal,
      `The interaction is bound to the response ${code(response)}, which the item does not declare.`,
      `declare ${code(response)} in a \`qti-response-declaration\`, or bind the interaction to a declared response`,
    );
  },
  "undeclared-variable": undeclaredVariable,
  "unknown-attribute": (refusal) => {
    const { attribute, cite, element } = named(refusal);

    return Option.match(refusal.suggestion, {
      onNone: () =>
        sentence(
          refusal,
          `${code(element)} has no attribute ${code(attribute)}${cite}.`,
          "remove the attribute",
        ),
      onSome: (suggestion) =>
        sentence(
          refusal,
          `${code(element)} has no attribute ${code(attribute)}; QTI 3.0's schema names it ${code(suggestion)}${cite}.`,
          "rename the attribute",
        ),
    });
  },
  "unknown-element": (refusal) => {
    const { cite, element } = named(refusal);

    return Option.match(optionalFact(refusal, "parent"), {
      onNone: () =>
        sentence(
          refusal,
          `QTI 3.0's schema declares no root element ${code(element)}.`,
          "use a QTI 3.0 element as the root",
        ),
      onSome: (parent) =>
        cite === ""
          ? sentence(
              refusal,
              `${code(parent)} may not hold ${code(element)}; QTI 3.0's schema allows no such child there.`,
              `remove ${code(element)}, or use an element ${code(parent)} allows`,
            )
          : sentence(
              refusal,
              `${code(parent)} may not hold ${code(element)}; XML Schema allows no such child there${cite}.`,
              `remove ${code(element)}`,
            ),
    });
  },
  /**
   * A duration's remedy names its seconds in the words a parse failure uses ({@link durationForm});
   * every other base type's names the base type.
   */
  "value-type": (refusal) => {
    const written = fact(refusal, "baseType", "");
    const baseType = baseTypeText(written);

    return sentence(
      refusal,
      `${code(fact(refusal, "lexical", ""))} is not a value of base type ${baseType}.`,
      written === "duration"
        ? `write ${durationForm(code)}`
        : `write a value of base type ${baseType}`,
    );
  },
} satisfies { readonly [R in RefusalRule]: (refusal: Refusal) => string };

/**
 * Word a refusal for the host and the author, in `en` (D10).
 *
 * Every sentence names the document, where in it, what is wrong, the rule and what to change; a
 * refusal whose detail names a reading cites it, and a child count cites its source as written.
 * A test asserts a refusal's fields, never this text.
 *
 * @param refusal The refusal.
 * @returns The sentence, in Markdown.
 */
export const describeRefusal = (refusal: Refusal): string => wordings[refusal.rule](refusal);
