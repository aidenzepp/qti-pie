/**
 * The terms of declarations that the schema (`#pantry/qti/declarations.ts`) and the importer
 * (`#pantry/import/overlays/declarations.ts`) both read. Each is a function of the attribute
 * inventory alone, so loading this module builds no relation of the schema.
 */
import { Option } from "effect";
import type { SchemaVersion as Version } from "#pantry/grammar/kinds.ts";
import { attributeDeclarations } from "#pantry/vocab/inventory/attributes.ts";

/**
 * The `normal-minimum` an outcome declaration has, by its version, where the version's XSD states a
 * default (spec reading 149): QTI 3.0.1's `default="0.0"` (`imsqti_asiv3p0p1_v1p0.xsd` line 30137;
 * information model §4.5.8, "Default = "0.0"" and "It is set to 0 by default"). QTI 3.0 states none
 * (`imsqti_asiv3p0_v1p0.xsd` line 29989, and its §4.5.8), so a 3.0.0 declaration that writes no
 * `normal-minimum` has no normal minimum. Read from the inventory's leaf, the one statement of the
 * XSD's defaults.
 */
export const normalMinimumDefaults: ReadonlyMap<Version, string> = new Map(
  attributeDeclarations.flatMap(({ default: stated, kind, name, versions }) =>
    kind === "qti-outcome-declaration" && name === "normal-minimum"
      ? Option.toArray(stated).flatMap((value) =>
          versions.map((version) => [version, value] as const),
        )
      : [],
  ),
);
