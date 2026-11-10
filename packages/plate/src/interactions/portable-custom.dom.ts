/**
 * The Portable Custom Interaction's (Q-16) runtime controller (issue pci-04): each rendered PCI
 * whose root carries the host facts runs in its own sandboxed frame, through the frame host in
 * `pci/frame-host.dom.ts`, which holds every rule of the frame, its messages and its teardown.
 *
 * @module
 */
import { hostFrame } from "#plate/pci/frame-host.dom.ts";
import type { Controller } from "#plate/runtime/contract.dom.ts";

/**
 * The Portable Custom Interaction's controller: its upgrade hosts the PCI in one sandboxed frame
 * when the root carries a loader fact, and attaches nothing when it does not (decision D15); it
 * moves no focus and announces nothing, since the PCI's ready, change and done facts are events
 * on the root, not speech; its teardown asks the PCI to complete and removes the frame.
 */
export const controller: Controller<"portable-custom"> = {
  implemented: true,
  kind: "portable-custom",
  upgrade: (root) => hostFrame(root),
};
