/**
 * Performing the XInclude includes of a package document (I-12 Item Include, S-6 Section Include;
 * issue m3f-06): the document `openPackage` judges, delivers, renders and scores in place of one
 * that writes an `xi:include`, in which each include that stands for the information model's
 * Include is replaced by the root of the fragment it names, recursively through the fragments' own
 * includes, so no later stage sees an include.
 *
 * The module applies the proposed reading of issue m3f-06: an include is performed at
 * `openPackage`, against the package's own files alone, bounded, and an unresolvable one takes its
 * `xi:fallback` or refuses the package. "An included fragment is read in place, as XML, with no
 * `xpointer`" (reading 85), and "an `xi:include` is the information model's Include only where its
 * parent's model holds one, and there it stands for its fragment's root, one of that include's
 * alternatives" (reading 114), so an include inside wildcard content ({@link wildcardHolders}) is
 * no Include and is kept as written, as is one with an `xpointer` or a `parse` other than `xml`,
 * which the operator's ruling P4 refuses for no form: a document still holding an include stays
 * unchecked (E23) before the model is built. "An include names a document of its package or a
 * resource outside it, by an href with no fragment identifier" (reading 115): an `href` holding a
 * `#` names no fragment here and does not resolve. The content of a resolving include other than
 * its fallback is ignored (reading 118, "an include holds at most one fallback").
 *
 * A fragment's relative file references, each attribute and text that reading 103's census names
 * ("a document's file references are the attributes its vocabularies define as the location of a
 * file, and each one that resolves within the package names a file the manifest describes; an
 * `xml:base` is a base, resolved and never a file reference"), are rewritten in place as the
 * fragment is spliced, so each resolves from the including document exactly as it resolved from
 * the fragment's own location ({@link relativeReference}); no `xml:base` is added, since `check`
 * refuses one on a test element (reading 90) and marks one on a body element. A reference that is
 * absolute or has no path is left as written, and so is every reference of a fragment spliced into
 * its own directory, where nothing moves.
 *
 * The module is pure: it reads the sources the package read, builds plain data and performs no
 * I/O. A document is immutable, so the merge copies and never mutates a read one, and a document
 * with no include is given back as it is.
 *
 * @module
 * @see https://www.w3.org/TR/xinclude/
 */
import { Option, Result } from "effect";
import { directoryOf, resolveIn, schemePrefix, withoutQuery } from "#plate/document/href.ts";
import type { Directory, Resolved } from "#plate/document/href.ts";
import { qtiNamespace, walk, xincludeNamespace, xmlNamespace } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { xmlWhitespaceRun } from "#plate/model/attributes.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";

/**
 * The deepest a chain of includes may run, 8: a document's include is one deep, an include of the
 * fragment it places two, and a chain that would place a ninth fragment is refused
 * `assembly-limit` with `bound: "depth"`. It is plate's own stated limit, no rule of QTI (issue
 * m3f-06, proposed reading: "cap the depth"), beside the cycle refusal, which bounds the chain only
 * where it repeats a document.
 */
export const includeDepthLimit = 8;

/**
 * How a file reference's value is read before it is resolved, by its attribute's type (reading
 * 102): an `xs:anyURI` collapses, HTML's `URLDType` turns each tab, line feed and carriage return
 * into a space, and an `xs:string` keeps them; each then sets aside the whitespace around it. The
 * names are `openPackage`'s, so its census passes through unchanged.
 */
export type ReferenceSpace = "collapse" | "preserve" | "replace";

/**
 * One attribute reading 103's census names on an element: its local name, how its value is read,
 * and whether the value is HTML's list of image candidate strings, each candidate's URL one
 * reference.
 */
export interface CensusAttribute {
  readonly local: string;
  readonly space: ReferenceSpace;
  readonly srcset: boolean;
}

/**
 * Reading 103's census of file references, as `openPackage` holds it, which the splice rewrites
 * (I-12, S-6; issue m3f-06): the census is the package reader's, so one roster decides what is a
 * file reference whether it is checked or rewritten.
 */
export interface ReferenceCensus {
  /**
   * Give the attributes the census names on an element, in no namespace.
   *
   * @param element The element.
   * @returns The attributes, none for an element the census does not name.
   */
  readonly attributesOf: (element: SourceElement) => readonly CensusAttribute[];
  /**
   * Give how an element's text is read when the census names it as a file reference, a card's or
   * card entry's `qti-file-href` and a `qti-resource-icon`.
   *
   * @param element The element.
   * @param parent Its parent, none for a root.
   * @returns The whitespace class, none for an element whose text the census does not read.
   */
  readonly textOf: (
    element: SourceElement,
    parent: Option.Option<SourceElement>,
  ) => Option.Option<ReferenceSpace>;
}

/**
 * What a package's includes have placed so far, counted across its documents toward the assembly
 * limit `openPackage` holds section refs to (I-12, S-6; issue m3f-06): each include performed is
 * one placement, and its fragment's size in the package counts once toward the bytes.
 */
export interface IncludeCount {
  readonly bytes: number;
  readonly placements: number;
}

/**
 * What performing one document's includes takes (I-12, S-6; issue m3f-06).
 */
export interface IncludeInput {
  /**
   * The census the splice rewrites by.
   */
  readonly census: ReferenceCensus;
  /**
   * The document, as the reader read it.
   */
  readonly document: SourceDocument;
  /**
   * The assembly limit: the most placements and the most bytes the package's includes may place,
   * past either of which the package is refused `assembly-limit`.
   */
  readonly limits: IncludeCount;
  /**
   * The package's location, which an `assembly-limit` refusal carries as its document.
   */
  readonly location: string;
  /**
   * The document's path from the package's root.
   */
  readonly path: string;
  /**
   * What the package's documents performed before this one placed.
   */
  readonly placed: IncludeCount;
  /**
   * Give the size in bytes of the package's file at a path.
   */
  readonly sizeOf: (path: string) => number;
  /**
   * The reading of each file the package holds and the manifest lists that an include may name,
   * keyed by path from the package's root, as the reader read it. An include whose `href` resolves
   * to a path not among them does not resolve.
   */
  readonly sources: ReadonlyMap<string, Result.Result<SourceDocument, Refusal>>;
}

/**
 * What performing one document's includes gives (I-12, S-6; issue m3f-06).
 */
export interface Included {
  /**
   * The merged document, at the document's location; the document itself when it holds no
   * include in the XInclude namespace.
   */
  readonly document: SourceDocument;
  /**
   * How many includes were performed, the fragments' own counted.
   */
  readonly performed: number;
  /**
   * What the package's documents have placed with this one's includes.
   */
  readonly placed: IncludeCount;
}

/**
 * A base a document's references resolve against: the directory a reference's path is relative to,
 * or none for a base outside the package, against which every relative reference stays outside it.
 */
type Base = Option.Option<Directory>;

/**
 * The QTI elements whose content is wildcard content in which an `xi:include` is no Include
 * (reading 114; issue m3f-06): a custom or portable custom interaction's markup, the extension
 * slots of ordering, selection and a custom operator, companion materials, and an HTML `template`.
 * An element below one of them is wildcard content too.
 */
const wildcardHolders: ReadonlySet<string> = new Set([
  "qti-companion-materials-info",
  "qti-custom-interaction",
  "qti-custom-operator",
  "qti-ordering",
  "qti-portable-custom-interaction",
  "qti-selection",
  "template",
]);

/**
 * A carriage return, a line feed or a tab, each of which an `xs:normalizedString` reads as a space.
 */
const replacedWhitespace = /[\t\n\r]/gu;

/**
 * Collapse a value's XML whitespace: its outer whitespace removed and each inner run of it one
 * space.
 *
 * @param value The value as written.
 * @returns The value collapsed.
 */
const collapse = (value: string): string => trimXmlSpace(value).replaceAll(xmlWhitespaceRun, " ");

/**
 * Read a file reference's value by its whitespace class, before it is resolved (reading 102).
 *
 * @param space How the value is read.
 * @param value The value, as written.
 * @returns The value as read, the whitespace around it set aside.
 */
const readReference = (space: ReferenceSpace, value: string): string =>
  space === "collapse"
    ? collapse(value)
    : trimXmlSpace(space === "replace" ? value.replaceAll(replacedWhitespace, " ") : value);

/**
 * Give an element's attribute by namespace and local name, as written.
 *
 * @param element The element.
 * @param namespace The attribute's namespace, `""` for none.
 * @param local The attribute's local name.
 * @returns Its value, none when the element has no such attribute.
 */
const attributeOf = (
  element: SourceElement,
  namespace: string,
  local: string,
): Option.Option<string> =>
  Option.fromUndefinedOr(
    element.attributes.find(
      (attribute) => attribute.namespace === namespace && attribute.local === local,
    )?.value,
  );

/**
 * Report whether an element is XInclude's element of a local name.
 *
 * @param child A child of a source element.
 * @param local The local name, `include` or `fallback`.
 * @returns Whether it is that element.
 */
const isXInclude = (child: SourceChild, local: string): child is SourceElement =>
  child.kind === "element" && child.namespace === xincludeNamespace && child.local === local;

/**
 * Report whether an `xi:include` has the form plate performs: no `xpointer`, and no `parse` other
 * than `xml` ("an included fragment is read in place, as XML, with no `xpointer`", reading 85).
 * One of another form is kept as written and refused for nothing (ruling P4).
 *
 * @param include The include.
 * @returns Whether it is performed where it stands for an Include.
 */
const isPerformable = (include: SourceElement): boolean =>
  Option.isNone(attributeOf(include, "", "xpointer")) &&
  Option.getOrElse(Option.map(attributeOf(include, "", "parse"), collapse), () => "xml") === "xml";

/**
 * Report whether a document holds any element in the XInclude namespace.
 *
 * @param document The document.
 * @returns Whether it does.
 */
const holdsInclude = (document: SourceDocument): boolean => {
  for (const { element } of walk(document)) {
    if (element.namespace === xincludeNamespace) {
      return true;
    }
  }

  return false;
};

/**
 * Resolve a reference against a base through {@link resolveIn}, by the rule the manifest resolves an
 * `href` by (reading 102).
 *
 * @param base The base in scope where the reference is written.
 * @param reference The reference, as read.
 * @returns The directory and name it names inside the package; none for an absolute URI, a path
 *   from a host's root, one whose `..` climbs above the package's root, and any reference under a
 *   base outside the package.
 */
const locate = (base: Base, reference: string): Option.Option<Resolved> =>
  schemePrefix.test(reference)
    ? Option.none()
    : base.pipe(Option.flatMap((directory) => resolveIn(directory, reference)));

/**
 * Give the base in scope below an element: its own `xml:base`, collapsed and resolved against the
 * base above it, or that base when it writes none or one whose path is empty (reading 103; RFC
 * 3986, section 5.2.2).
 *
 * @param above The base in scope above the element.
 * @param element The element.
 * @returns The base its children and its own references resolve against.
 */
const baseBelow = (above: Base, element: SourceElement): Base =>
  Option.match(Option.map(attributeOf(element, xmlNamespace, "base"), collapse), {
    onNone: () => above,
    onSome: (value) =>
      withoutQuery(value) === ""
        ? above
        : Option.map(locate(above, value), (resolved) => resolved.directory),
  });

/**
 * Give a directory's segments from the package's root.
 *
 * @param directory The directory.
 * @returns Its names, the package root's none.
 */
const segmentsOf = (directory: Directory): readonly string[] => {
  const names: string[] = [];
  for (let place = directory; Option.isSome(place.parent); place = place.parent.value) {
    names.push(place.name);
  }

  return names.toReversed();
};

/**
 * Report whether two directories are one directory of the package.
 *
 * @param first One directory.
 * @param second Another.
 * @returns Whether their paths are equal.
 */
const sameDirectory = (first: Directory, second: Directory): boolean =>
  first === second || segmentsOf(first).join("/") === segmentsOf(second).join("/");

/**
 * Write a decoded path segment as a reference writes it: each character a URI reference reserves
 * or cannot hold, `%`, `?`, `#` and `/` among them, percent-encoded as `encodeURIComponent` writes
 * them, but `@`, which a path segment may hold (RFC 3986, section 3.3), so the package reads the
 * segment back as the name it holds (`decodeSegment` in `#plate/document/href.ts`). A plain name
 * is written as it is, and a `:` is encoded, since a first segment holding one would read as a
 * scheme.
 *
 * @param segment The segment, as the package names it.
 * @returns The segment as a reference spells it.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.3
 */
const encodeSegment = (segment: string): string =>
  encodeURIComponent(segment).replaceAll("%40", "@");

/**
 * Rewrite a relative reference written at one directory of the package so that, written at
 * another, it resolves to the same path (reading 103; issue m3f-06): the path it names from the
 * package's root, relative to the other directory, `..` for each segment that directory holds
 * below their common one, then the remaining segments of the path, its query and fragment kept as
 * written.
 *
 * @param written The reference, as read.
 * @param from The directory it is written at, the fragment's.
 * @param to The directory it is to be written at, the including document's base in scope.
 * @returns The rewritten reference; none for one left as written: an absolute URI, a path from a
 *   host's root, one with no path, and one that climbs above the package's root.
 */
const relativeReference = (
  written: string,
  from: Directory,
  to: Directory,
): Option.Option<string> => {
  const path = withoutQuery(written);
  if (path === "" || path.startsWith("/") || schemePrefix.test(written)) {
    return Option.none();
  }

  return Option.map(resolveIn(from, written), (resolved) => {
    const target = [...segmentsOf(resolved.directory), resolved.name];
    const host = segmentsOf(to);
    let shared = 0;
    while (shared < host.length && shared < target.length - 1 && host[shared] === target[shared]) {
      shared += 1;
    }

    const steps = [
      ...Array.from({ length: host.length - shared }, () => ".."),
      ...target.slice(shared).map(encodeSegment),
    ];
    const text = steps.join("/");

    return `${text === "" ? "./" : text}${written.slice(path.length)}`;
  });
};

/**
 * Rewrite one census attribute's value as read, or keep it as written when nothing in it moves.
 *
 * A `srcset` is split at its commas into image candidates, each candidate's URL the text before
 * its first whitespace, as the package reader splits it, and written back joined by `,`.
 *
 * @param attribute The census attribute.
 * @param value Its value, as written.
 * @param from The fragment's directory in scope.
 * @param to The including document's directory in scope.
 * @returns The value to write.
 */
const rewrittenValue = (
  attribute: CensusAttribute,
  value: string,
  from: Directory,
  to: Directory,
): string => {
  const read = readReference(attribute.space, value);
  if (!attribute.srcset) {
    return Option.getOrElse(
      Option.filter(relativeReference(read, from, to), (text) => text !== read),
      () => value,
    );
  }

  let changed = false;
  const candidates = read.split(",").map((candidate) => {
    const trimmed = trimXmlSpace(candidate);
    const [url = "", ...descriptors] = trimmed.split(xmlWhitespaceRun);
    const rewritten = url === "" ? Option.none() : relativeReference(url, from, to);

    return Option.match(rewritten, {
      onNone: () => candidate,
      onSome: (text) => {
        changed ||= text !== url;

        return [text, ...descriptors].join(" ");
      },
    });
  });

  return changed ? candidates.join(",") : value;
};

/**
 * One document whose elements are being copied, with what the copy of each of its elements needs.
 */
interface Scope {
  /**
   * The base in scope on the fragment's side, which the document's references resolve against.
   */
  readonly base: Base;
  /**
   * The paths of the documents from the one whose includes are performed down to this one, which
   * an include naming one of them closes into a cycle; its length is the depth of this document's
   * includes.
   */
  readonly chain: readonly string[];
  readonly document: SourceDocument;
  /**
   * The base in scope on the including document's side, where the copy stands; the fragment's
   * base itself where nothing is rewritten.
   */
  readonly hostBase: Base;
  /**
   * The document's path from the package's root.
   */
  readonly path: string;
  /**
   * The path of each element of the document, which a refusal at an include names.
   */
  readonly paths: ReadonlyMap<SourceElement, string>;
  /**
   * Whether the copy stands at another directory than the document's references were written at,
   * so each relative reference is rewritten.
   */
  readonly rewriting: boolean;
  /**
   * Whether the elements copied are wildcard content, in which an include is no Include.
   */
  readonly wild: boolean;
}

/**
 * The copy of a document's includes in progress: the input and the counts so far.
 */
interface Merge {
  readonly input: IncludeInput;
  performed: number;
  placed: IncludeCount;
}

/**
 * Construct a refusal at an element of a document.
 *
 * @param document The document's location.
 * @param rule The rule.
 * @param path The element's path.
 * @param detail The facts the verdict's wording reads.
 * @returns The refusal.
 */
const refuseAt = (
  document: string,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
): Refusal =>
  new Refusal({
    detail,
    document,
    location: { kind: "path", path },
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

/**
 * Construct the `assembly-limit` refusal of a package: its detail names the `bound` passed, its
 * `limit` and the count `reached`, at the package's location, as the section refs' limit is given.
 *
 * @param location The package's location.
 * @param bound The bound passed.
 * @param limit The bound's limit.
 * @param reached The count that passed it.
 * @returns The refusal.
 */
const limitRefusal = (
  location: string,
  bound: "bytes" | "depth" | "placements",
  limit: number,
  reached: number,
): Refusal =>
  new Refusal({
    detail: { bound, limit: String(limit), reached: String(reached) },
    document: location,
    location: { kind: "document" },
    readerRule: Option.none(),
    rule: "assembly-limit",
    suggestion: Option.none(),
  });

/**
 * Give the path of each element of a document.
 *
 * @param document The document.
 * @returns The paths, by element.
 */
const pathsOf = (document: SourceDocument): ReadonlyMap<SourceElement, string> =>
  new Map(Array.from(walk(document), ({ element, path }) => [element, path] as const));

/**
 * Why an include does not resolve: its `href` names a path outside the package, or a path inside
 * it that the package does not hold and list.
 */
type Unresolved = "missing" | "outside";

/**
 * Where an include's `href` leads: a source the package holds, at its path, or why it does not
 * resolve, with the path it named inside the package when it named one.
 */
type Lead =
  | {
      readonly kind: "found";
      readonly path: string;
      readonly source: Result.Result<SourceDocument, Refusal>;
    }
  | { readonly kind: Unresolved; readonly path: Option.Option<string> };

/**
 * Resolve an include's `href` against the base in scope at the include (its own `xml:base`
 * counted) to a source of the package: an `href` that is absent, empty, has no path or holds a `#`
 * names no fragment and is missing (reading 115); an absolute URI, a path from a host's root, one
 * that climbs above the package's root or one under a base outside the package is outside; a path
 * inside it with no source is missing.
 *
 * @param include The include.
 * @param base The base in scope above the include.
 * @param sources The package's sources.
 * @returns Where the `href` leads.
 */
const leadOf = (
  include: SourceElement,
  base: Base,
  sources: ReadonlyMap<string, Result.Result<SourceDocument, Refusal>>,
): Lead => {
  const href = Option.getOrElse(Option.map(attributeOf(include, "", "href"), collapse), () => "");
  if (withoutQuery(href) === "" || href.includes("#")) {
    return { kind: "missing", path: Option.none() };
  }

  const resolved = locate(baseBelow(base, include), href);
  if (Option.isNone(resolved)) {
    return { kind: "outside", path: Option.none() };
  }

  const path = [...segmentsOf(resolved.value.directory), resolved.value.name].join("/");
  const source = sources.get(path);

  return source === undefined
    ? { kind: "missing", path: Option.some(path) }
    : { kind: "found", path, source };
};

/**
 * Rewrite an element's simple content as one reference, when it is text alone and moves.
 *
 * @param children The element's copied children.
 * @param space How the text is read.
 * @param from The fragment's directory in scope.
 * @param to The including document's directory in scope.
 * @returns The children, one text holding the rewritten reference when it moves.
 */
const rewrittenText = (
  children: readonly SourceChild[],
  space: ReferenceSpace,
  from: Directory,
  to: Directory,
): readonly SourceChild[] => {
  if (!children.every((child) => child.kind === "text")) {
    return children;
  }

  const read = readReference(space, children.map((child) => child.text).join(""));

  return Option.match(
    Option.filter(relativeReference(read, from, to), (text) => text !== read),
    {
      onNone: () => children,
      onSome: (text) => [{ kind: "text", text }],
    },
  );
};

/**
 * Copy one element: its `xml:base` and its census references rewritten where the copy stands at
 * another directory than they were written at, and its children copied with its includes
 * performed where they stand for an Include.
 *
 * A relative `xml:base` of its own is rewritten so that it names, from where the copy stands, the
 * directory it named from the fragment, and below it both sides agree, so nothing further is
 * rewritten; an absolute one, or one whose path is empty, is kept, and below an absolute one both
 * sides agree too. Below an `xml:base` that leaves the package every relative reference is outside
 * it and is left as written.
 *
 * @param merge The copy in progress.
 * @param element The element.
 * @param scope The scope its parent's children are copied in.
 * @param parent The element the copy becomes a child of, none for the root of the document whose
 *   includes are performed; a spliced fragment root's is the include's parent.
 * @returns The copy, or the first refusal of an include below it.
 */
const copyElement = (
  merge: Merge,
  element: SourceElement,
  scope: Scope,
  parent: Option.Option<SourceElement>,
): Result.Result<SourceElement, Refusal> => {
  const base = baseBelow(scope.base, element);
  const own = Option.map(attributeOf(element, xmlNamespace, "base"), collapse);
  const rebased =
    scope.rewriting && Option.isSome(own) && withoutQuery(own.value) !== ""
      ? Option.flatMap(Option.all([scope.base, scope.hostBase]), ([from, to]) =>
          relativeReference(own.value, from, to),
        )
      : Option.none();
  // Once an element writes an `xml:base` of its own, the base below it is the same on both sides:
  // a rewritten one names the directory the fragment's named, and an absolute one names itself.
  const rewriting = scope.rewriting && (Option.isNone(own) || withoutQuery(own.value) === "");
  const withBase: readonly SourceAttribute[] = Option.match(rebased, {
    onNone: () => element.attributes,
    onSome: (value) =>
      element.attributes.map((attribute) =>
        attribute.namespace === xmlNamespace && attribute.local === "base"
          ? { ...attribute, value }
          : attribute,
      ),
  });
  const hostBase = rewriting
    ? scope.hostBase
    : baseBelow(scope.hostBase, { ...element, attributes: withBase });
  const directories = rewriting ? Option.all([base, hostBase]) : Option.none();
  const named = Option.isSome(directories)
    ? new Map(
        merge.input.census.attributesOf(element).map((entry) => [entry.local, entry] as const),
      )
    : new Map<string, CensusAttribute>();
  const attributes = Option.match(directories, {
    onNone: () => withBase,
    onSome: ([from, to]) =>
      withBase.map((attribute) => {
        const entry = attribute.namespace === "" ? named.get(attribute.local) : undefined;

        return entry === undefined || attribute.references.length > 0
          ? attribute
          : { ...attribute, value: rewrittenValue(entry, attribute.value, from, to) };
      }),
  });
  const text = Option.isSome(directories)
    ? merge.input.census.textOf(element, parent)
    : Option.none();
  const wild =
    scope.wild || (element.namespace === qtiNamespace && wildcardHolders.has(element.local));
  const below: Scope = { ...scope, base, hostBase, rewriting, wild };

  return Result.map(
    // oxlint-disable-next-line eslint/no-use-before-define -- `copyElement` and `copyChildren` are mutually recursive, as elements nest; the call runs only after both are defined.
    copyChildren(
      merge,
      element,
      element.children,
      below,
      !wild && element.namespace === qtiNamespace,
    ),
    (children) => ({
      ...element,
      attributes,
      children: Option.match(Option.all([text, directories]), {
        onNone: () => children,
        onSome: ([space, [from, to]]) => rewrittenText(children, space, from, to),
      }),
    }),
  );
};

/**
 * Copy the children of an element, performing each `xi:include` among them that stands for an
 * Include: one whose parent is a QTI element outside wildcard content and whose form plate
 * performs ({@link isPerformable}). Any other child is copied as written, its own children in turn.
 *
 * @param merge The copy in progress.
 * @param parent The element whose children they are copied as.
 * @param children The children to copy.
 * @param scope The scope the parent's children are copied in.
 * @param performing Whether an include among them is performed: the parent is a QTI element
 *   outside wildcard content, or the children are the fallback of such an include.
 * @returns The copied children, or the first refusal.
 */
const copyChildren = (
  merge: Merge,
  parent: SourceElement,
  children: readonly SourceChild[],
  scope: Scope,
  performing: boolean,
): Result.Result<readonly SourceChild[], Refusal> => {
  const copied: SourceChild[] = [];
  for (const child of children) {
    if (child.kind !== "element") {
      copied.push(child);
      continue;
    }

    const result =
      performing && isXInclude(child, "include") && isPerformable(child)
        ? // oxlint-disable-next-line eslint/no-use-before-define -- `copyChildren` and `performInclude` are mutually recursive, as a spliced fragment's children are copied in turn; the call runs only after both are defined.
          performInclude(merge, parent, child, scope)
        : Result.map(copyElement(merge, child, scope, Option.some(parent)), (element) => [element]);
    if (Result.isFailure(result)) {
      return result;
    }

    copied.push(...result.success);
  }

  return Result.succeed(copied);
};

/**
 * Perform one include that stands for an Include: splice the root of the fragment its `href`
 * names, its own includes performed in turn and its relative file references rewritten for where
 * it now stands; or, where the `href` does not resolve, splice the children of its `xi:fallback`,
 * copied as the including document's own content, or refuse.
 *
 * @param merge The copy in progress.
 * @param parent The include's parent, whose child what replaces the include becomes.
 * @param include The include.
 * @param scope The scope its parent's children are copied in.
 * @returns What stands in the include's place, or the refusal: `package-path-outside` or
 *   `package-file-missing` with `check: "include"` at the include, `inclusion-cycle` at the include
 *   whose fragment is on its chain, `assembly-limit` for the depth, the placements or the bytes,
 *   or the reader's refusal of the fragment's file.
 */
const performInclude = (
  merge: Merge,
  parent: SourceElement,
  include: SourceElement,
  scope: Scope,
): Result.Result<readonly SourceChild[], Refusal> => {
  const { input } = merge;
  const at = scope.paths.get(include) ?? "";
  const href = Option.getOrElse(attributeOf(include, "", "href"), () => "");
  const lead = leadOf(include, scope.base, input.sources);
  if (lead.kind !== "found") {
    const fallback = include.children.find((child) => isXInclude(child, "fallback"));
    if (fallback !== undefined) {
      return copyChildren(merge, parent, fallback.children, scope, true);
    }

    return Result.fail(
      refuseAt(
        scope.document.location,
        lead.kind === "outside" ? "package-path-outside" : "package-file-missing",
        at,
        {
          check: "include",
          document: scope.path,
          href,
          ...Option.match(lead.path, { onNone: () => ({}), onSome: (path) => ({ path }) }),
        },
      ),
    );
  }

  if (scope.chain.includes(lead.path)) {
    return Result.fail(
      refuseAt(scope.document.location, "inclusion-cycle", at, {
        chain: [...scope.chain, lead.path].join(" "),
        href,
        reading: "85",
      }),
    );
  }

  if (scope.chain.length > includeDepthLimit) {
    return Result.fail(
      limitRefusal(input.location, "depth", includeDepthLimit, scope.chain.length),
    );
  }

  const placed = {
    bytes: merge.placed.bytes + input.sizeOf(lead.path),
    placements: merge.placed.placements + 1,
  };
  if (placed.placements > input.limits.placements) {
    return Result.fail(
      limitRefusal(input.location, "placements", input.limits.placements, placed.placements),
    );
  }

  if (placed.bytes > input.limits.bytes) {
    return Result.fail(limitRefusal(input.location, "bytes", input.limits.bytes, placed.bytes));
  }

  if (Result.isFailure(lead.source)) {
    return Result.fail(lead.source.failure);
  }

  merge.placed = placed;
  merge.performed += 1;
  const fragment = lead.source.success;
  const base = directoryOf(lead.path);

  return Result.map(
    copyElement(
      merge,
      fragment.root,
      {
        base: Option.some(base),
        chain: [...scope.chain, lead.path],
        document: fragment,
        hostBase: scope.hostBase,
        path: lead.path,
        paths: pathsOf(fragment),
        rewriting: Option.exists(scope.hostBase, (host) => !sameDirectory(base, host)),
        wild: false,
      },
      Option.some(parent),
    ),
    (root) => [root],
  );
};

/**
 * Give the paths inside the package that a document's includes of the form plate performs name,
 * each resolved through the `xml:base` in scope, whether or not the package holds a file there: the
 * files `openPackage` reads before it performs the document's includes, the fragments' own found
 * from theirs in turn (I-12, S-6; issue m3f-06).
 *
 * @param document The document.
 * @param path The document's path from the package's root, which its `href`s resolve against
 *   where no `xml:base` is in scope.
 * @returns The paths, in document order, one that two includes name given twice.
 */
export const includeTargets = (document: SourceDocument, path: string): readonly string[] => {
  const bases = new Map<SourceElement, Base>();
  const own: Base = Option.some(directoryOf(path));
  const targets: string[] = [];
  for (const { element, parent } of walk(document)) {
    const above = Option.match(parent, {
      onNone: () => own,
      onSome: (holder) => bases.get(holder) ?? own,
    });
    bases.set(element, baseBelow(above, element));
    if (isXInclude(element, "include") && isPerformable(element)) {
      const href = Option.getOrElse(
        Option.map(attributeOf(element, "", "href"), collapse),
        () => "",
      );
      if (withoutQuery(href) !== "" && !href.includes("#")) {
        for (const resolved of Option.toArray(locate(bases.get(element) ?? own, href))) {
          targets.push([...segmentsOf(resolved.directory), resolved.name].join("/"));
        }
      }
    }
  }

  return targets;
};

/**
 * Perform the includes of one document of a package (I-12 Item Include, S-6 Section Include;
 * issue m3f-06): give the document in which each `xi:include` that stands for an Include is
 * replaced by the root of the fragment it names, the fragment's own includes performed in turn and
 * its relative file references rewritten for where it now stands, or the first refusal.
 *
 * An include stands for an Include where its parent is a QTI element outside wildcard content
 * ({@link wildcardHolders}) and it has no `xpointer` and no `parse` but `xml`; any other include is
 * kept as written. Its `href` resolves against the base in scope at it to a file the package holds
 * and the manifest lists ({@link IncludeInput.sources}): one that does not resolve takes the
 * children of its `xi:fallback`, copied as the including document's own content, or refuses the
 * package, `package-path-outside` with `check: "include"` for a path outside the package and
 * `package-file-missing` with `check: "include"` for a missing one, each at the include's path in
 * the document that writes it, its detail naming the `document` and the `href`, and the `path`
 * named when there is one. A fragment on the chain of documents from this one down to the include
 * is `inclusion-cycle` at that include, its detail the `chain` of paths from this document through
 * the repeated one, space-separated, and the `href` (reading 85). A chain deeper than
 * {@link includeDepthLimit} is `assembly-limit` with `bound: "depth"`, and each include performed
 * counts one placement and its fragment's bytes toward the package's assembly limit, past which it
 * is `assembly-limit` with `bound: "placements"` or `"bytes"`, each at the package's location. A
 * fragment the reader could not read refuses with the reader's own refusal.
 *
 * The merged document is judged as one document, so the fragment's interactions bind the
 * including item's responses and its identifiers count among the item's (reading 117, "an included
 * fragment is judged in place, as its merged document holds it"). A document holding no element in
 * the XInclude namespace is given back itself.
 *
 * @param input The document, the package's sources, the census and the counts.
 * @returns The merged document with the counts, or the refusal.
 */
export const performIncludes = (input: IncludeInput): Result.Result<Included, Refusal> => {
  if (!holdsInclude(input.document)) {
    return Result.succeed({ document: input.document, performed: 0, placed: input.placed });
  }

  const merge: Merge = { input, performed: 0, placed: input.placed };
  const base: Base = Option.some(directoryOf(input.path));

  return Result.map(
    copyElement(
      merge,
      input.document.root,
      {
        base,
        chain: [input.path],
        document: input.document,
        hostBase: base,
        path: input.path,
        paths: pathsOf(input.document),
        rewriting: false,
        wild: false,
      },
      Option.none(),
    ),
    (root) => ({
      document: { location: input.document.location, root },
      performed: merge.performed,
      placed: merge.placed,
    }),
  );
};
