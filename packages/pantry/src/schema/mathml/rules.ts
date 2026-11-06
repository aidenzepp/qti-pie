/**
 * The MathML laws that name a kind literal (spec 4.5 and 4.8).
 *
 * Phase 2's `NodeClass` and `NodeDir` admit any kind `AttributeAdmission` lists with `class` or
 * `dir`, and the MathML kinds now are listed. MathML types the two attributes differently from
 * HTML (`class` is `xs:NMTOKENS`, `dir` is `ltr | rtl` without `auto`), and the MathML attribute
 * families hold them, so the two relations refuse every MathML kind that lists them. The form is
 * a membership check: one test over the kind roster, not a comparison per handle. The three
 * capacities are the MathML children MathML's content model allows once, in the source-selected
 * form of `html/structure.ts`.
 */
import { capacity, check, on, select, within } from "@bjornpagen/grizzle";

import { NodeClass, NodeDir } from "#pantry/schema/attributes.ts";
import { kinds, registry } from "#pantry/schema/kinds/mathml.ts";
import type { MathmlKind } from "#pantry/schema/kinds/mathml.ts";
import { MathmlBvar, MathmlMmultiscripts, MathmlPiecewise } from "#pantry/schema/mathml/arms.ts";
import * as node from "#pantry/schema/node.ts";

/**
 * The MathML kinds whose registry row lists an attribute.
 *
 * @param attribute - The attribute name.
 * @returns The kind handles, in registry order.
 */
export const kindsListing = (attribute: string): readonly MathmlKind[] =>
  kinds.filter((kind) => registry[kind].attributes.includes(attribute));

const withClass = kindsListing("class");

const withDir = kindsListing("dir");

/**
 * The statements of this module: the `class` and `dir` exclusions, then the three capacities.
 */
export const rules = [
  check("NodeClassNotMathml", NodeClass, (row) => row.not(row.in(row.kind, withClass))),
  check("NodeDirNotMathml", NodeDir, (row) => row.not(row.in(row.kind, withDir))),
  capacity(on(MathmlMmultiscripts, "id"), {
    from: on(select(node.Edge, { childKind: "m:mprescripts" }), "parent"),
    within: within(0n, 1n),
  }),
  capacity(on(MathmlBvar, "id"), {
    from: on(select(node.Edge, { childKind: "m:degree" }), "parent"),
    within: within(0n, 1n),
  }),
  capacity(on(MathmlPiecewise, "id"), {
    from: on(select(node.Edge, { childKind: "m:otherwise" }), "parent"),
    within: within(0n, 1n),
  }),
] as const;
