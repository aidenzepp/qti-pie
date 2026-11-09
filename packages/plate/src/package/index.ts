/**
 * The content-package surface of `@qti-pie/plate`, published as `@qti-pie/plate/package` through
 * the `exports` map in `package.json`: `openPackage`, which checks a QTI 3.0 content package's
 * files, and the types of its verdict.
 *
 * It is an entry of its own so that a host that serves items never loads the package tables:
 * `openPackage` checks a manifest against tables generated from the content packaging profiles,
 * which a module that imports it loads, and nothing in `@qti-pie/plate` reads them. A host imports
 * this entry where it opens packages, and `@qti-pie/plate` everywhere else.
 *
 * Nothing else under `src/package/` is reachable from outside the package. The seam
 * `acceptPackageForTest` is never exported here, so only `openPackage` makes an `AcceptedPackage`.
 *
 * @module
 */
export type {
  AcceptedPackage,
  PackageResource,
  PackageTest,
  PackageVerdict,
} from "#plate/package/open.ts";

export { openPackage } from "#plate/package/open.ts";
