/**
 * The module the dev playground's pages load when its runtime is on (issue m3d-13): it upgrades the
 * page's rendered items once the document is parsed and records how many interactions it attached a
 * controller to as `data-runtime-upgraded` on the `html` element, so a browser walk can read that
 * the runtime ran, and how far, without the page holding any script of its own.
 *
 * Playground code, not the library's: nothing the library ships imports it, and a host that loads
 * the runtime calls `upgrade` itself.
 *
 * @module
 */
import { upgrade } from "#plate/runtime.dom.ts";

/**
 * Upgrade every item in the document and record the count of interactions upgraded.
 */
const run = (): void => {
  document.documentElement.dataset["runtimeUpgraded"] = String(upgrade().controllers.length);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", run, { once: true });
} else {
  run();
}
