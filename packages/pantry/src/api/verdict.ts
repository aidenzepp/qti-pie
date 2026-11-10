/**
 * The verdicts an app reads from pantry's import and preview programs (`#pantry/api/import.ts`):
 * a package accepted or previewed, or refused with one {@link Refusal}.
 *
 * A refusal is a verdict on the package, never an error: the programs return it as a value, so an
 * app switches on `verdict` and keeps its error channel for failures that are not about the
 * package (the platform's, grizzle's). The values are plain data, safe to log, serialize or send.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import type { RefusedAbove } from "#pantry/import/above.ts";
import type { ImportRefused, Rule } from "#pantry/import/refusal.ts";
import type { RefusalOrigin } from "#pantry/package/refusal-origin.ts";

/**
 * Why a package was refused, named by the level whose rule it broke.
 *
 * `qti`: the `Qti` schema refused it, under `rule`, one name of pantry's roster (`ImportRule` of
 * `#pantry/import/refusal.ts`, the names the verdict file uses). `above`: a level an app builds
 * above `Qti` refused it, under that level's own `rule`, which pantry's roster does not hold.
 * `detail` says what was refused in one sentence, and `origin` says who refused it: the reader,
 * the container or the codec before any row existed, or the database with the laws it named.
 */
export type Refusal =
  | {
      readonly kind: "qti";
      readonly level: "Qti";
      readonly rule: Rule;
      readonly detail: string;
      readonly origin: typeof RefusalOrigin.Type;
    }
  | {
      readonly kind: "above";
      readonly level: string;
      readonly rule: string;
      readonly detail: string;
      readonly origin: typeof RefusalOrigin.Type;
    };

/**
 * The verdict of an import: the package stored, under the id `packageId` its `Package` row holds,
 * or refused, with nothing of it written.
 */
export type ImportVerdict =
  | { readonly verdict: "accepted"; readonly packageId: Uuid }
  | { readonly verdict: "refused"; readonly refusal: Refusal };

/**
 * The verdict of a preview: the package read and built into rows, with the number of relations
 * that would hold a row and the number of rows, or refused by the reader, the container or the
 * codec.
 *
 * `databaseChecked` is always false: a preview opens no database, so no law of the schema judged
 * the rows, and an import of a previewed package can still be refused.
 */
export type PreviewVerdict =
  | {
      readonly verdict: "previewed";
      readonly databaseChecked: false;
      readonly relations: number;
      readonly rows: number;
    }
  | { readonly verdict: "refused"; readonly refusal: Refusal };

/**
 * Convert an importer refusal into the {@link Refusal} an app reads: `ImportRefused` into the
 * `qti` case at level `Qti`, `RefusedAbove` into the `above` case at its level, each with its rule,
 * detail and origin unchanged.
 *
 * @param error - The importer's refusal.
 * @returns The refusal as plain data.
 */
export const refusalOf = (error: ImportRefused | RefusedAbove): Refusal =>
  error._tag === "ImportRefused"
    ? { detail: error.detail, kind: "qti", level: "Qti", origin: error.origin, rule: error.rule }
    : {
        detail: error.detail,
        kind: "above",
        level: error.level,
        origin: error.origin,
        rule: error.rule,
      };
