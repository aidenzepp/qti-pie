/**
 * The verdict on a document (spec §4.5), the one gate between a source and an item a host may
 * redact, score or render, and the sentences that word a refusal for the host and the author
 * (spec §4.6).
 *
 * {@link check} refuses a root outside QTI's namespace, then runs the structural validator and the
 * prose rules together, then leaves unchecked what phase 1 cannot judge. On a document it accepts
 * it secures the source before it builds the item: it removes every attribute only a wildcard
 * admits (E3) and passes every URL attribute through `url.ts`, keeping each value in its parsed
 * form or dropping it with a notice beside its element. Its {@link Accepted} is the only input
 * `redact` and `score` take. A refusal is a verdict, never a failure, so `check` is a plain
 * function; it lifts the item builder, which stays an Effect, once.
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
  xmlnsNamespace,
  xsiNamespace,
} from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import { buildItem } from "#plate/model/item.ts";
import type { BodyNode, Item, Unsupported, UnsupportedFeature } from "#plate/model/item.ts";
import { classifyUrl, formatUrl, urlContextOf } from "#plate/model/url.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { checkRules } from "#plate/validate/rules.ts";
import { checkStructure, governingTables } from "#plate/validate/structure.ts";
import type { ContentTable, ElementTable, Tables } from "#plate/validate/xsd.ts";

/**
 * Why a valid document is left unchecked: it holds MathML (reading 2) or SSML (reading 3), whose
 * validity phase 1 cannot judge, an XInclude `include`, whose inclusion phase 1 neither performs
 * nor judges, an entity reference the reader kept unexpanded, or a root that is not
 * `qti-assessment-item`. `path` is the element or attribute at issue.
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
 * The verdict on a document, by `verdict`.
 *
 * - `refused`: one or more refusals; never rendered.
 * - `unchecked`: valid as far as phase 1 checks, with every reason it cannot judge the rest; never
 *   rendered.
 * - `accepted-with-unsupported`: valid, with features phase 1 does not render, each named.
 * - `accepted`: valid, and phase 1 renders all of it.
 *
 * Only the two accepting verdicts carry an {@link Accepted}. `document` is the document's location.
 */
export type Verdict =
  | {
      readonly document: string;
      readonly refusals: Arr.NonEmptyReadonlyArray<Refusal>;
      readonly verdict: "refused";
    }
  | {
      readonly document: string;
      readonly reasons: readonly UncheckedReason[];
      readonly verdict: "unchecked";
    }
  | {
      readonly accepted: Accepted;
      readonly document: string;
      readonly verdict: "accepted-with-unsupported";
    }
  | { readonly accepted: Accepted; readonly document: string; readonly verdict: "accepted" };

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
 * Name an attribute as its path step spells it without the `@`: its local name in no namespace,
 * `xml:<local>` in the XML namespace and `{<namespace>}<local>` otherwise.
 *
 * @param attribute The attribute's name parts.
 * @returns Its name.
 */
const attributeName = (attribute: Pick<SourceAttribute, "local" | "namespace">): string => {
  if (attribute.namespace === "") {
    return attribute.local;
  }

  return attribute.namespace === xmlNamespace
    ? `xml:${attribute.local}`
    : `{${attribute.namespace}}${attribute.local}`;
};

/**
 * Report whether an attribute is one E3 keeps on any element without its table naming it: a
 * namespace declaration, `xsi:schemaLocation`, `xsi:noNamespaceSchemaLocation`, `xsi:type`,
 * `xsi:nil`, `xml:lang` or `xml:base`.
 *
 * The structural walk judges `xsi:type` and `xsi:nil` on every element it checks (reading 47), so
 * a valid `xsi:type` is kept, never marked; on an element only a wildcard admits neither is judged.
 *
 * @param attribute The attribute.
 * @returns Whether it is an allowance.
 */
const isAllowance = (attribute: SourceAttribute): boolean =>
  attribute.namespace === xmlnsNamespace ||
  (attribute.namespace === xsiNamespace &&
    (attribute.local === "schemaLocation" ||
      attribute.local === "noNamespaceSchemaLocation" ||
      attribute.local === "type" ||
      attribute.local === "nil")) ||
  (attribute.namespace === xmlNamespace &&
    (attribute.local === "lang" || attribute.local === "base"));

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
  isAllowance(attribute) ||
  Option.exists(
    table,
    (declared) =>
      declares(declared, attribute.namespace, attribute.local) ||
      (attribute.namespace === "" &&
        attribute.local === "aria-keyshortcuts" &&
        declares(declared, "", "aria-keyshorts")),
  );

/**
 * Look up an element's table, only among the tables' own keys.
 *
 * @param tables The tables.
 * @param local The element's local name in the QTI namespace.
 * @returns Its table, or none when the XSD declares no element of that name.
 */
const tableOf = (tables: Tables, local: string): Option.Option<ElementTable> =>
  Object.hasOwn(tables.elements, local)
    ? Option.fromUndefinedOr(tables.elements[local])
    : Option.none();

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
      const prompt = node.prompt.pipe(
        Option.map((nodes) => placeNodes(nodes, drops, placed, inMedia)),
      );
      const choices = node.choices.map((choice) => ({
        choice,
        placed: placeNodes(choice.content, drops, placed, inMedia),
      }));

      return {
        lifted: [
          ...Option.match(prompt, { onNone: () => [], onSome: (result) => result.lifted }),
          ...choices.flatMap((entry) => entry.placed.lifted),
        ],
        nodes: [
          {
            ...node,
            choices: choices.map((entry) => ({ ...entry.choice, content: entry.placed.nodes })),
            prompt: prompt.pipe(Option.map((result) => result.nodes)),
          },
        ],
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
 * A dropped URL whose element the body holds is a notice beside it. One inside a part the body
 * already shows as a notice, or outside the body, has no place to show, so it is a mark.
 *
 * @param built The item built from the secured source.
 * @param secured The secured source and what securing it removed.
 * @returns The item with its notices placed and every unsupported feature listed.
 */
const complete = (built: Item, secured: Secured): Item => {
  const placed = new Set<string>();
  const result = placeNodes(built.body, secured.drops, placed, false);
  const dropped = Array.from(secured.drops, ([path, features]) =>
    features.map((feature): UnsupportedFeature => ({
      feature,
      path,
      shown: placed.has(path) ? "notice" : "mark",
    })),
  ).flat();

  return {
    ...built,
    body: [...result.nodes, ...result.lifted],
    unsupported: inDocumentOrder(
      [...built.unsupported, ...secured.marks, ...dropped],
      secured.source,
    ),
  };
};

/**
 * Collect every reason phase 1 cannot judge a document: a root other than `qti-assessment-item`,
 * then in document order each MathML, SSML or XInclude element whose parent is outside its
 * namespace, each attribute whose value holds an unexpanded entity reference, and each element
 * with one among its children.
 *
 * @param source A document whose root is in QTI's namespace.
 * @returns The reasons, empty when phase 1 can judge all of it.
 */
const uncheckedReasons = (source: SourceDocument): readonly UncheckedReason[] => {
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
    if (Option.isNone(parent) && element.local !== "qti-assessment-item") {
      reasons.push({ path, reason: "root" });
    }

    if (island(mathmlNamespace)) {
      reasons.push({ path, reason: "mathml" });
    }

    if (island(ssmlNamespace)) {
      reasons.push({ path, reason: "ssml" });
    }

    if (island(xincludeNamespace)) {
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
 * Give the verdict on a document, in order:
 *
 * 1. A root outside QTI's namespace is `refused`, with `not-qti-root` alone.
 * 2. The structural validator's refusals and the prose rules', together and in that order, with no
 *    short-circuit: any one makes the document `refused`, with all of them.
 * 3. A document holding MathML, SSML, an XInclude `include`, an unexpanded entity reference, or a root
 *    other than `qti-assessment-item` is `unchecked`, with every reason. It is never rendered.
 * 4. Otherwise each attribute only a wildcard admitted is removed and marked `attribute:<name>` (E3),
 *    and each URL attribute goes through `url.ts`: a kept value is written in its parsed form, and
 *    a dropped one goes, with its notice beside its element.
 * 5. The item is built from the secured source. A refusal of the builder, such as `value-type` or
 *    `count-range`, makes the document `refused`. Otherwise it is `accepted-with-unsupported` when
 *    anything is unsupported, the builder's `variable:<identifier>` marks included, and `accepted`
 *    when nothing is.
 *
 * @param source The document, as the reader adapter built it.
 * @param tables The tables generated from the QTI XSD.
 * @returns The verdict. A refusal is a verdict, never a failure. A defect of the item builder,
 *   which a checked document cannot cause, is thrown.
 */
export const check = (source: SourceDocument, tables: Tables): Verdict => {
  const document = source.location;
  if (source.root.namespace !== qtiNamespace) {
    return { document, refusals: [notQtiRoot(source)], verdict: "refused" };
  }

  const refusals = [...checkStructure(source, tables), ...checkRules(source)];
  if (Arr.isReadonlyArrayNonEmpty(refusals)) {
    return { document, refusals, verdict: "refused" };
  }

  const reasons = uncheckedReasons(source);
  if (reasons.length > 0) {
    return { document, reasons, verdict: "unchecked" };
  }

  const secured = secure(source, tables);
  const built = Effect.runSync(Effect.result(buildItem(secured.source)));
  if (Result.isFailure(built)) {
    return { document, refusals: [built.failure], verdict: "refused" };
  }

  const item = complete(built.success, secured);
  const accepted = accept({ document, item, unsupported: item.unsupported });

  return item.unsupported.length > 0
    ? { accepted, document, verdict: "accepted-with-unsupported" }
    : { accepted, document, verdict: "accepted" };
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
 * Write a refusal of a file that is not a QTI document, in spec §4.6's shape.
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
 * Word an `undeclared-variable` refusal's kind of variable.
 *
 * @param expected The kind the detail names: `response`, `outcome` or `variable`.
 * @returns The noun.
 */
const variableKind = (expected: string): string =>
  expected === "response" || expected === "outcome" ? expected : "variable";

/**
 * Word an `expression-type` refusal.
 *
 * @param refusal The refusal.
 * @returns The sentence: a lookup operand against its table (reading 28), or an expression against
 *   the outcome it sets.
 */
const expressionType = (refusal: Refusal): string => {
  const element = fact(refusal, "element", "the element");
  const identifier = fact(refusal, "identifier", "the outcome");
  const expression = `${fact(refusal, "expressionCardinality", "")} ${baseTypeText(fact(refusal, "expressionBaseType", ""))}`;

  return Option.match(optionalFact(refusal, "table"), {
    onNone: () =>
      sentence(
        refusal,
        `${code(element)} sets ${code(identifier)}, a ${fact(refusal, "outcomeCardinality", "")} ${baseTypeText(fact(refusal, "outcomeBaseType", ""))} outcome, to a ${expression} value${citation(refusal)}.`,
        `give the expression the base type and cardinality of ${code(identifier)}, or change its declaration`,
      ),
    onSome: (table) =>
      sentence(
        refusal,
        `${code(element)} looks ${code(identifier)} up in its ${code(table)} with a ${expression} value, which that table cannot read${citation(refusal)}.`,
        `look up a value of the base type ${code(table)} reads, or use the other lookup table`,
      ),
  });
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
 * Word the `template-requirements` refusal: the declaration a standard template, an inline
 * `qti-map-response` or a `qti-lookup-outcome-value` needs. The sentence names the template when
 * the detail has one, and otherwise the element that needs the declaration, so it never blames a
 * template the item may not have.
 *
 * @param refusal The refusal.
 * @returns The sentence.
 */
const templateRequirements = (refusal: Refusal): string => {
  const needs = [
    ...Option.toArray(
      Option.map(optionalFact(refusal, "baseType"), (type) => `of base type ${code(type)}`),
    ),
    ...Option.toArray(
      Option.map(optionalFact(refusal, "child"), (child) => `with a ${code(child)}`),
    ),
  ].join(" ");
  const declared = `${code(fact(refusal, "identifier", ""))} in a ${code(fact(refusal, "declaration", "declaration"))}${needs === "" ? "" : ` ${needs}`}`;
  const needer = Option.match(optionalFact(refusal, "template"), {
    onNone: () =>
      Option.match(optionalFact(refusal, "element"), {
        onNone: () => "The element",
        onSome: code,
      }),
    onSome: (uri) => `The response processing template ${code(uri)}`,
  });

  return sentence(
    refusal,
    `${needer} needs ${declared}, and the item has none.`,
    `declare ${declared}`,
  );
};

/**
 * The sentence of each rule, one function per rule in `refusalRules`.
 */
const wordings = {
  "attribute-type": (refusal) => {
    const { attribute, cite, element } = named(refusal);
    const expected = optionalFact(refusal, "expected");

    return sentence(
      refusal,
      `${code(element)}'s attribute ${code(attribute)} is ${code(fact(refusal, "value", ""))}, which is not ${Option.getOrElse(expected, () => "a value its type allows")}${cite}.`,
      `write a value that is ${Option.getOrElse(expected, () => "of the attribute's type")}`,
    );
  },
  binding: (refusal) => {
    const interaction = fact(refusal, "interaction", "the interaction");
    const response = fact(refusal, "response", "");

    return sentence(
      refusal,
      `${code(interaction)} cannot be bound to ${code(response)}, a ${fact(refusal, "cardinality", "")} response of base type ${baseTypeText(fact(refusal, "baseType", ""))}.`,
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
  "duplicate-identifier": (refusal) => {
    const identifier = fact(refusal, "identifier", "");

    return sentence(
      refusal,
      `The identifier ${code(identifier)} is given more than once where each must be unique.`,
      `give each one its own identifier in place of ${code(identifier)}`,
    );
  },
  "expression-type": expressionType,
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

    return sentence(
      refusal,
      `${code(element)} must carry the attribute ${code(attribute)}, and it has none.`,
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
  "undeclared-variable": (refusal) => {
    const identifier = fact(refusal, "identifier", "");
    const kind = variableKind(fact(refusal, "expected", "variable"));

    return sentence(
      refusal,
      `${code(named(refusal).element)} names ${code(identifier)}, and the item declares no ${kind} ${code(identifier)}.`,
      `declare ${code(identifier)}, or name a declared ${kind}`,
    );
  },
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
    const { element } = named(refusal);

    return Option.match(optionalFact(refusal, "parent"), {
      onNone: () =>
        sentence(
          refusal,
          `QTI 3.0's schema declares no root element ${code(element)}.`,
          "use a QTI 3.0 element as the root",
        ),
      onSome: (parent) =>
        sentence(
          refusal,
          `${code(parent)} may not hold ${code(element)}; QTI 3.0's schema allows no such child there.`,
          `remove ${code(element)}, or use an element ${code(parent)} allows`,
        ),
    });
  },
  "value-type": (refusal) => {
    const baseType = baseTypeText(fact(refusal, "baseType", ""));

    return sentence(
      refusal,
      `${code(fact(refusal, "lexical", ""))} is not a value of base type ${baseType}.`,
      `write a value of base type ${baseType}`,
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
