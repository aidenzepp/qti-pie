/**
 * A QTI 3.0 content package's manifest, read into its model and checked by every rule that needs
 * only the manifest: {@link readManifest}.
 *
 * The rules run in the order a host meets their failures. A root outside QTI 3.0's packaging
 * namespace is `not-qti3-package`, alone. `metadata/schemaversion` then picks the profile, `3.0.0`
 * or `3.0.1`, and any other value, or none, is `package-profile`, alone. The manifest is then
 * walked against that profile's tables (`packageTables`), every namespace its imports reach
 * included, so LOM, QTI metadata, curriculum standards and the CP extension are checked inside
 * `metadata` as XML Schema assesses them (Q6), and the manifest's own rules follow: a resource's
 * `href` references one of its `file` entries, a `dependency` names a resource, and every `href`
 * stays inside the package's root. The walk's refusals and the rules' are reported together, in
 * that order. What needs the package's files or documents, which files exist and what each
 * document's root is, belongs to the package reader.
 *
 * The readings the manifest binds: `qtiMetadata` is admitted as a `cp:metadata` child or inside
 * `lom` (reading 32), a `controlfile` resource and a packaged XSD listed as a file are admitted
 * (reading 33), an absolute `href` is admitted and stored as written, never fetched (reading 35),
 * and one file may be listed twice by a resource and by several resources (reading 36).
 *
 * @module
 */
import { Data, Option, Result } from "effect";
import type { Array as Arr } from "effect";
import { attributePath, walk, xmlNamespace } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { packageTables } from "#plate/package/tables.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { checkStructure } from "#plate/validate/structure.ts";
import type { Tables } from "#plate/validate/xsd.ts";
import { cpVersions } from "#plate/vocabulary.ts";
import type { CpVersion } from "#plate/vocabulary.ts";

/**
 * The namespace of a QTI 3.0 package's manifest, under both content packaging profiles. A root in
 * any other namespace, such as the plain IMS CP namespace of a QTI 2 package, is
 * `not-qti3-package`.
 */
export const manifestNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * One `href` a manifest writes, on a `resource` or a `file`, with the package path it names.
 *
 * `path` is the file's path from the package's root, which is where the manifest sits: the
 * reference resolved against the `xml:base` values above it, its dot segments removed, each
 * segment's percent escapes decoded and its query and fragment set aside, so `./items/a%20b.xml`
 * names `items/a b.xml`. It is none for an absolute URI, which the package does not hold and which
 * is never fetched (reading 35).
 */
export interface ManifestHref {
  /**
   * The value as the manifest writes it.
   */
  readonly href: string;
  readonly path: Option.Option<string>;
}

/**
 * One `resource` of a read manifest, its `file` and `dependency` entries in document order.
 */
export interface ManifestResource {
  /**
   * The `identifierref` of each `dependency`, each naming a resource of the same manifest.
   */
  readonly dependencies: readonly string[];
  /**
   * Each `file` entry, duplicates kept (reading 36).
   */
  readonly files: readonly ManifestHref[];
  /**
   * The resource's own `href`, its launchable entry, which one of its `file` entries references.
   */
  readonly href: Option.Option<ManifestHref>;
  readonly identifier: string;
  /**
   * The resource element's path in the manifest, the location a refusal of the resource names.
   */
  readonly location: string;
  /**
   * The resource type as written, one of the profile's enumeration.
   */
  readonly type: string;
}

/**
 * A manifest {@link readManifest} read: the profile its `schemaversion` names and its resources in
 * document order.
 */
export interface Manifest {
  readonly identifier: string;
  readonly resources: readonly ManifestResource[];
  readonly version: CpVersion;
}

/**
 * The defect of a manifest the walk accepted that lacks an attribute its profile requires, which
 * the walk refuses as `missing-attribute`, so a checked manifest cannot cause it.
 */
export class ManifestDefect extends Data.TaggedError("ManifestDefect")<{
  readonly attribute: string;
  readonly element: string;
}> {}

/**
 * The QTI tables the manifest walk passes `checkStructure`: none. Neither profile imports QTI's
 * own schema, so XML Schema finds no declaration for a QTI element in the manifest's lax wildcard
 * content and passes over it, and so does the walk.
 */
const noQtiTables: Tables = { elements: {}, types: {} };

/**
 * Where an `href` leads: a path inside the package, as its segments, an absolute URI with its query
 * and fragment set aside, or outside the package's root.
 */
type Target =
  | { readonly kind: "absolute"; readonly uri: string }
  | { readonly kind: "inside"; readonly segments: readonly string[] }
  | { readonly kind: "outside" };

/**
 * The target of the package's root, the base every relative reference resolves against: its
 * directory is the root, so its last segment, the one a reference replaces, is empty.
 */
const packageRoot: Target = { kind: "inside", segments: [""] };

/**
 * A scheme followed by its colon at the start of a URI reference, which makes the reference an
 * absolute URI (RFC 3986, section 3.1).
 *
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-3.1
 */
const schemePrefix = /^[A-Za-z][\d+.A-Za-z-]*:/u;

/**
 * Take the part of a URI reference before its query and fragment.
 *
 * @param reference The reference.
 * @returns Its scheme, authority and path, whichever it has.
 */
const withoutQuery = (reference: string): string => reference.split(/[#?]/u, 1)[0] ?? "";

/**
 * Decode a path segment's percent escapes, leaving a segment whose escapes are malformed as it is
 * written.
 *
 * @param segment The segment.
 * @returns The segment decoded.
 */
const decodeSegment = (segment: string): string =>
  Result.getOrElse(
    Result.try(() => decodeURIComponent(segment)),
    () => segment,
  );

/**
 * Resolve a URI reference against a base target, as RFC 3986 section 5.2 merges a relative path
 * with its base and removes its dot segments.
 *
 * An absolute URI is its own target whatever its base, and a relative reference under an absolute
 * base is the absolute URI the URL parser resolves it to, or, when the parser refuses it, the base
 * and the reference joined, which no other reference shares. A reference that starts with `/` names
 * a path from a host's root, and a `..` that climbs above the package's root leaves the package:
 * both are outside, where RFC 3986 would drop the extra `..`.
 *
 * @param base The target the reference is resolved against.
 * @param reference The reference as written.
 * @returns Its target.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-5.2
 */
const resolve = (base: Target, reference: string): Target => {
  if (schemePrefix.test(reference)) {
    return { kind: "absolute", uri: withoutQuery(reference) };
  }

  if (base.kind === "absolute") {
    const parsed = URL.parse(withoutQuery(reference), base.uri);

    return { kind: "absolute", uri: parsed === null ? `${base.uri} ${reference}` : parsed.href };
  }

  if (base.kind === "outside") {
    return base;
  }

  const path = withoutQuery(reference);
  if (path.startsWith("/")) {
    return { kind: "outside" };
  }

  const segments = base.segments.slice(0, -1);
  const written = path.split("/").map(decodeSegment);
  for (const [index, segment] of written.entries()) {
    const last = index === written.length - 1;
    if (segment === "..") {
      if (segments.length === 0) {
        return { kind: "outside" };
      }

      segments.pop();
    }

    if (segment !== "." && segment !== "..") {
      segments.push(segment);
    } else if (last) {
      segments.push("");
    }
  }

  return { kind: "inside", segments };
};

/**
 * Name a target as a comparable key: two `href` values reference the same file exactly when their
 * keys are equal.
 *
 * @param target The target.
 * @returns Its key, none for a target outside the package.
 */
const keyOf = (target: Target): Option.Option<string> => {
  switch (target.kind) {
    case "absolute": {
      return Option.some(`uri:${target.uri}`);
    }
    case "inside": {
      return Option.some(`path:${target.segments.join("/")}`);
    }
    case "outside": {
      return Option.none();
    }
    default: {
      return target satisfies never;
    }
  }
};

/**
 * Take an element's children in the manifest's namespace with one local name.
 *
 * @param element The element.
 * @param local The children's local name.
 * @returns The children, in document order.
 */
const childrenNamed = (element: SourceElement, local: string): readonly SourceElement[] =>
  element.children.filter(
    (child): child is SourceElement =>
      child.kind === "element" && child.namespace === manifestNamespace && child.local === local,
  );

/**
 * Find an element's attribute in no namespace.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns The attribute, if the element writes it.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<SourceAttribute> =>
  Option.fromUndefinedOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local),
  );

/**
 * Read an attribute the profile requires of a manifest the walk accepted.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns Its value.
 * @throws {ManifestDefect} When the element lacks it, which the walk refuses first.
 */
const required = (element: SourceElement, local: string): string =>
  Option.getOrThrowWith(
    Option.map(attributeOf(element, local), (attribute) => attribute.value),
    () => new ManifestDefect({ attribute: local, element: element.local }),
  );

/**
 * Resolve an element's `xml:base` against its parent's base.
 *
 * @param base The parent's base.
 * @param element The element.
 * @returns The element's base: its `xml:base` resolved, or the parent's when it writes none.
 */
const baseOf = (base: Target, element: SourceElement): Target =>
  Option.match(
    Option.fromUndefinedOr(
      element.attributes.find(
        (attribute) => attribute.namespace === xmlNamespace && attribute.local === "base",
      ),
    ),
    { onNone: () => base, onSome: (attribute) => resolve(base, attribute.value) },
  );

/**
 * Construct a refusal of the manifest, located at an element or attribute path.
 *
 * @param source The manifest.
 * @param rule The rule it breaks.
 * @param path The element or attribute path.
 * @param detail The facts the verdict's wording reads.
 * @returns The refusal.
 */
const refuse = (
  source: SourceDocument,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
): Refusal =>
  new Refusal({
    detail,
    document: source.location,
    location: { kind: "path", path },
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

/**
 * Name an element as a refusal's detail does, as its path step spells it.
 *
 * @param element The element.
 * @returns `{<namespace>}<local>`.
 */
const elementName = (element: SourceElement): string => `{${element.namespace}}${element.local}`;

/**
 * One `href` attribute with its target and the path of the attribute.
 */
interface Located {
  readonly at: string;
  readonly href: string;
  readonly target: Target;
}

/**
 * One resource as the manifest's rules read it, before the model is built.
 */
interface ResourceEntry {
  readonly dependencies: readonly { readonly at: string; readonly identifier: string }[];
  readonly element: SourceElement;
  readonly files: readonly Located[];
  readonly href: Option.Option<Located>;
  readonly path: string;
}

/**
 * Read the manifest's resources, the `resource` children of its `resources`, each `href` resolved
 * through the `xml:base` values of the manifest, the `resources` and the resource.
 *
 * @param root The manifest's root.
 * @param paths Each element's path, as the walk spells it.
 * @returns The resources, in document order.
 */
const resourcesOf = (
  root: SourceElement,
  paths: ReadonlyMap<SourceElement, string>,
): readonly ResourceEntry[] => {
  const pathOf = (element: SourceElement): string => paths.get(element) ?? "";
  const located = (base: Target, element: SourceElement): Option.Option<Located> =>
    Option.map(attributeOf(element, "href"), (attribute) => ({
      at: attributePath(pathOf(element), attribute),
      href: attribute.value,
      target: resolve(base, attribute.value),
    }));
  const rootBase = baseOf(packageRoot, root);

  return childrenNamed(root, "resources").flatMap((resources) => {
    const listBase = baseOf(rootBase, resources);

    return childrenNamed(resources, "resource").map((element): ResourceEntry => {
      const base = baseOf(listBase, element);

      return {
        dependencies: childrenNamed(element, "dependency").flatMap((dependency) =>
          Option.toArray(
            Option.map(attributeOf(dependency, "identifierref"), (attribute) => ({
              at: attributePath(pathOf(dependency), attribute),
              identifier: attribute.value,
            })),
          ),
        ),
        element,
        files: childrenNamed(element, "file").flatMap((file) =>
          Option.toArray(located(base, file)),
        ),
        href: located(base, element),
        path: pathOf(element),
      };
    });
  });
};

/**
 * Check the manifest's own rules over its resources: each `href` stays inside the package's root
 * (`package-path-outside`), a resource's `href` references one of its `file` entries
 * (`child-count`, Content Packaging 1.2 section 6.6.2), and each `dependency` names a resource
 * (`dependency-unresolved`).
 *
 * An `href` leaves the root when its resolution through the `xml:base` values above it does, so
 * an `xml:base` that climbs out is refused through each relative `href` beneath it.
 *
 * @param source The manifest.
 * @param entries Its resources.
 * @returns The refusals, in document order of the resources.
 */
const checkResources = (
  source: SourceDocument,
  entries: readonly ResourceEntry[],
): readonly Refusal[] => {
  const identifiers = new Set(
    entries.flatMap((entry) =>
      Option.toArray(Option.map(attributeOf(entry.element, "identifier"), (id) => id.value)),
    ),
  );
  const outside = (reference: Located): readonly Refusal[] =>
    reference.target.kind === "outside"
      ? [refuse(source, "package-path-outside", reference.at, { path: reference.href })]
      : [];

  return entries.flatMap((entry) => {
    const owner = Option.map(attributeOf(entry.element, "identifier"), (id) => id.value);
    const fileKeys = new Set(entry.files.flatMap((file) => Option.toArray(keyOf(file.target))));
    const unmatched = entry.href.pipe(
      Option.flatMap((href) => keyOf(href.target).pipe(Option.map((key) => ({ href, key })))),
      Option.filter(({ key }) => !fileKeys.has(key)),
      Option.map(({ href }) =>
        refuse(source, "child-count", entry.path, {
          child: `file entry that references its href ${href.href}`,
          element: elementName(entry.element),
          required: "at least one",
          source: "Content Packaging 1.2, section 6.6.2",
        }),
      ),
    );
    const unresolved = entry.dependencies
      .filter((dependency) => !identifiers.has(dependency.identifier))
      .map((dependency) =>
        refuse(source, "dependency-unresolved", dependency.at, {
          dependency: dependency.identifier,
          ...Option.match(owner, { onNone: () => ({}), onSome: (resource) => ({ resource }) }),
        }),
      );

    return [
      ...Option.toArray(entry.href).flatMap(outside),
      ...entry.files.flatMap(outside),
      ...Option.toArray(unmatched),
      ...unresolved,
    ];
  });
};

/**
 * Turn a reference the rules accepted into the model's form.
 *
 * @param reference The reference.
 * @returns Its value as written and the package path it names.
 */
const hrefOf = (reference: Located): ManifestHref => ({
  href: reference.href,
  path:
    reference.target.kind === "inside"
      ? Option.some(reference.target.segments.join("/"))
      : Option.none(),
});

/**
 * Write one child of a text-only element as the document spells it: its characters, or an
 * unexpanded entity reference in its form `&name;`.
 *
 * @param child The child.
 * @returns Its text, `""` for an element child.
 */
const writtenText = (child: SourceChild): string => {
  if (child.kind === "text") {
    return child.text;
  }

  return child.kind === "entity" ? `&${child.name};` : "";
};

/**
 * Pick the profile a manifest names: the text of its first `metadata`'s first `schemaversion`,
 * when that is exactly one of {@link cpVersions}, since the profiles type it as an `xs:string`
 * enumeration, whose whitespace is kept.
 *
 * @param source The manifest.
 * @param root Its root.
 * @param paths Each element's path, as the walk spells it.
 * @returns The profile, or the `package-profile` refusal: at the `schemaversion` with the value it
 *   holds, or, when there is none, at the `metadata` or the root that lacks it.
 */
const profileOf = (
  source: SourceDocument,
  root: SourceElement,
  paths: ReadonlyMap<SourceElement, string>,
): Result.Result<CpVersion, Refusal> => {
  const metadata = Option.fromUndefinedOr(childrenNamed(root, "metadata")[0]);
  const schemaversion = metadata.pipe(
    Option.flatMap((holder) => Option.fromUndefinedOr(childrenNamed(holder, "schemaversion")[0])),
  );

  return Option.match(schemaversion, {
    onNone: () =>
      Result.fail(
        refuse(
          source,
          "package-profile",
          paths.get(Option.getOrElse(metadata, () => root)) ?? "",
          {},
        ),
      ),
    onSome: (element) => {
      const written = element.children.map((child) => writtenText(child)).join("");
      const version = cpVersions.find((candidate) => candidate === written);

      return version === undefined
        ? Result.fail(
            refuse(source, "package-profile", paths.get(element) ?? "", {
              schemaversion: written,
            }),
          )
        : Result.succeed(version);
    },
  });
};

/**
 * Read a package's manifest and check it by every rule that needs only the manifest.
 *
 * A root outside {@link manifestNamespace} is refused `not-qti3-package` alone, and a
 * `schemaversion` other than `3.0.0` or `3.0.1`, or none, `package-profile` alone. Otherwise the
 * manifest is walked against its profile's tables with `checkStructure`, each refusal of the walk
 * carrying the profile it was judged against as `schemaversion` in its detail, and then checked by
 * the manifest's own rules: `package-path-outside`, `child-count` for a resource whose `href` no
 * `file` entry references, and `dependency-unresolved`. Both sets are reported, the walk's first.
 * Nothing is read or fetched beyond the document given.
 *
 * @param source The manifest, as the reader adapter built it, whose location every refusal carries.
 * @returns The manifest, or every refusal of it in the order above.
 * @throws {ManifestDefect} When the walk accepts a resource that lacks a required attribute, a
 *   defect of the walk.
 */
export const readManifest = (
  source: SourceDocument,
): Result.Result<Manifest, Arr.NonEmptyReadonlyArray<Refusal>> => {
  const { root } = source;
  const paths = new Map(Array.from(walk(source), (visit) => [visit.element, visit.path]));
  if (root.namespace !== manifestNamespace) {
    return Result.fail([
      refuse(source, "not-qti3-package", paths.get(root) ?? "", {
        element: root.local,
        namespace: root.namespace,
      }),
    ]);
  }

  const profile = profileOf(source, root, paths);
  if (Result.isFailure(profile)) {
    return Result.fail([profile.failure]);
  }

  const version = profile.success;
  const walked = checkStructure(source, noQtiTables, packageTables.get(version)).map(
    (refusal) =>
      new Refusal({
        detail: { ...refusal.detail, schemaversion: version },
        document: refusal.document,
        location: refusal.location,
        readerRule: refusal.readerRule,
        rule: refusal.rule,
        suggestion: refusal.suggestion,
      }),
  );
  const entries = resourcesOf(root, paths);
  const [first, ...rest] = [...walked, ...checkResources(source, entries)];
  if (first !== undefined) {
    return Result.fail([first, ...rest]);
  }

  return Result.succeed({
    identifier: required(root, "identifier"),
    resources: entries.map((entry): ManifestResource => ({
      dependencies: entry.dependencies.map((dependency) => dependency.identifier),
      files: entry.files.map((file) => hrefOf(file)),
      href: entry.href.pipe(Option.map((href) => hrefOf(href))),
      identifier: required(entry.element, "identifier"),
      location: entry.path,
      type: required(entry.element, "type"),
    })),
    version,
  });
};
