/**
 * The scratch folders plate's tests and scripts' tests write to: {@link scratchFolder}.
 *
 * @module
 */
import { mkdirSync, mkdtempSync } from "node:fs";
import path from "node:path";

/**
 * The package's git-ignored `work/` folder, where every scratch folder lives.
 */
const workDirectory = path.resolve(import.meta.dirname, "..", "..", "work");

/**
 * Make a scratch folder a test run owns, under the package's git-ignored `work/`.
 *
 * `mkdtemp` names it: the prefix and six characters it picks, and it creates the folder only under
 * a name no folder holds, so two runs at once never share or remove each other's files. The run
 * removes the folder when it ends.
 *
 * @example
 *   scratchFolder("caches-test-"); // "<package>/work/caches-test-Xk3d9Q", created
 *   scratchFolder("pages-", "browser-test"); // "<package>/work/browser-test/pages-a8Lq0z", created
 *
 * @param prefix The start of the folder's name.
 * @param under The folders between `work/` and the scratch folder, created when missing.
 * @returns The folder's absolute path.
 */
export const scratchFolder = (prefix: string, ...under: readonly string[]): string => {
  const parent = path.join(workDirectory, ...under);
  mkdirSync(parent, { recursive: true });

  return mkdtempSync(path.join(parent, prefix));
};
