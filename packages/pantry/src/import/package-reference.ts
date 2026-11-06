/**
 * The one resolver of a URI a QTI document carries against its package path.
 *
 * It is pure: a reference value, the referring document's package path and its `xml:base` chain
 * give the in-package path the value names, or a tag saying it names none. The caller decides what
 * a value that names no package file means: the item and test importers write no row for it (an
 * `img` may name an external URI), and a card file refuses it.
 */

/**
 * The value names this file of the package, written as a manifest `file/@href` is.
 */
export interface InPackage {
  readonly _tag: "InPackage";
  readonly path: string;
}

/**
 * The value, or an `xml:base` it resolves against, has a URI scheme.
 */
export interface Scheme {
  readonly _tag: "Scheme";
}

/**
 * The value is a fragment alone, so it names a place in the referring document.
 */
export interface FragmentOnly {
  readonly _tag: "FragmentOnly";
}

/**
 * The value, or an `xml:base` it resolves against, is a network-path reference (`//host/...`).
 */
export interface NetworkPath {
  readonly _tag: "NetworkPath";
}

/**
 * The value resolves to an absolute path or to a path whose segments leave the package root.
 */
export interface OutsidePackage {
  readonly _tag: "OutsidePackage";
}

export type PackageReference = InPackage | Scheme | FragmentOnly | NetworkPath | OutsidePackage;

/**
 * Where a base points: at the segments of a package path, or at something that is not the package.
 */
type Base = InPackage | Exclude<PackageReference, FragmentOnly | InPackage>;

const scheme = /^[A-Za-z][A-Za-z0-9+.-]*:/u;

/**
 * The reference without its fragment and its query, which name no file.
 */
const withoutFragmentAndQuery = (value: string): string => {
  const hash = value.indexOf("#");
  const noFragment = hash === -1 ? value : value.slice(0, hash);
  const query = noFragment.indexOf("?");

  return query === -1 ? noFragment : noFragment.slice(0, query);
};

/**
 * RFC 3986 section 5 resolution of `value` against a base, with dot segments removed and nothing
 * percent-decoded. A base that is not a package path makes every relative value that too.
 */
const resolveAgainst = (value: string, base: Base): Base => {
  if (scheme.test(value)) {
    return { _tag: "Scheme" };
  }

  if (value.startsWith("//")) {
    return { _tag: "NetworkPath" };
  }

  if (value.startsWith("/")) {
    return { _tag: "OutsidePackage" };
  }

  if (base._tag !== "InPackage") {
    return base;
  }

  const target = withoutFragmentAndQuery(value);

  if (target === "") {
    return base;
  }

  const segments = base.path.split("/").slice(0, -1);

  for (const segment of target.split("/")) {
    if (segment === "..") {
      if (segments.length === 0) {
        return { _tag: "OutsidePackage" };
      }

      segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  }

  return { _tag: "InPackage", path: segments.join("/") };
};

/**
 * Resolve `value` against the package path of the document that carries it, after each `xml:base`
 * of `xmlBase` (outermost first) has been resolved against that path in turn.
 *
 * A fragment-only value names the referring document, so it is its own result whatever the base.
 */
export const resolvePackageReference = (
  value: string,
  documentPath: string,
  xmlBase: readonly string[] = [],
): PackageReference => {
  if (value.startsWith("#")) {
    return { _tag: "FragmentOnly" };
  }

  let base: Base = { _tag: "InPackage", path: documentPath };

  for (const next of xmlBase) {
    base = resolveAgainst(next, base);
  }

  return resolveAgainst(value, base);
};
