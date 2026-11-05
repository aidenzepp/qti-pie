/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the tool column the rows carry; the shape here is which of the two tool attributes the root wrote, not a structure. */

/**
 * The tool rows an item, a test and a stimulus root share: one `ItemTool` row naming which of
 * `tool-name` and `tool-version` the root wrote, and the arm relation that holds the strings.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { Rows } from "#pantry/import/tree.ts";
import { ToolName, ToolVersion } from "#pantry/schema/contracts.ts";
import { ItemTool, ItemToolBoth, ItemToolName, ItemToolVersion } from "#pantry/schema/item.ts";

/**
 * The tool row of a root and the arm that holds the strings it wrote, as the attribute reader read
 * them; none when it wrote neither `tool-name` nor `tool-version`.
 */
export const toolRows = (
  rows: Rows,
  root: "item" | "stimulus" | "test",
  tree: Uuid,
  name: Option.Option<string>,
  version: Option.Option<string>,
): Rows => {
  if (Option.isSome(name) && Option.isSome(version)) {
    return Rows.add(Rows.add(rows, ItemTool, [{ root, shape: "both", tree }]), ItemToolBoth, [
      { toolName: ToolName(name.value), toolVersion: ToolVersion(version.value), tree },
    ]);
  }

  if (Option.isSome(name)) {
    return Rows.add(Rows.add(rows, ItemTool, [{ root, shape: "nameOnly", tree }]), ItemToolName, [
      { toolName: ToolName(name.value), tree },
    ]);
  }

  return Option.isSome(version)
    ? Rows.add(Rows.add(rows, ItemTool, [{ root, shape: "versionOnly", tree }]), ItemToolVersion, [
        { toolVersion: ToolVersion(version.value), tree },
      ])
    : rows;
};
