/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * How the command line reports a refused verdict of pantry's import and preview programs
 * (`#pantry/api/verdict.ts`): it turns the verdict's {@link Refusal} back into the failure a run
 * ends with, so a refused package exits as `import-refused` (`#pantry/cli/errors.ts`).
 */
import { Effect, Runtime, Schema } from "effect";
import type { Refusal } from "#pantry/api/verdict.ts";
import { cliKind, kindExitCode } from "#pantry/cli/errors.ts";
import type { Kind } from "#pantry/cli/errors.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";

/**
 * A level an app builds above `Qti` refused the package, under that level's own rule, which
 * pantry's roster does not hold. Nothing was written: the import refused the whole package.
 *
 * `level` names the level, `rule` its rule and `detail` what the rule refused, as the refused
 * verdict carries them.
 */
export class RefusedByLevel extends Schema.TaggedError<RefusedByLevel>()("RefusedByLevel", {
  detail: Schema.String,
  level: Schema.String,
  rule: Schema.String,
}) {
  /**
   * This error's kind, `import-refused`, the kind of a package `Qti` refused: a refused package is
   * a verdict on the package, never a defect of qti. A getter, so the kind stays on the prototype
   * and is no field of the error's data.
   */
  // oxlint-disable-next-line typescript/class-literal-property-style, eslint/class-methods-use-this -- A field would be an own property of the error.
  get [cliKind](): Kind {
    return "import-refused";
  }

  /**
   * The exit code of this error's kind.
   */
  override get [Runtime.errorExitCode](): number {
    return kindExitCode[this[cliKind]];
  }

  /**
   * The level and rule that refused the package, and what the rule refused.
   */
  override get message(): string {
    return `The package was refused under the ${this.rule} rule of the ${this.level} level, a level above Qti: ${this.detail}.`;
  }

  /**
   * What to fix, and that nothing was written.
   */
  get help(): string {
    return `Fix what the ${this.level} level's ${this.rule} rule describes in the package, then import it again. Nothing was written.`;
  }
}

/**
 * Fail with the error a refused verdict stands for: a `qti` refusal as the `ImportRefused` it came
 * from, with the same rule, detail and origin, so the command line prints it, exits and writes its
 * JSON as it does for any refusal of `Qti`; an `above` refusal as {@link RefusedByLevel}.
 *
 * The refusal module loads the composed grammar, so it is imported when a refusal is failed, never
 * when the command line starts; the program that returned the verdict has loaded it already.
 *
 * @param refusal - The refused verdict's refusal.
 * @returns An effect that fails with `ImportRefused` or {@link RefusedByLevel}.
 */
export const failRefused = (
  refusal: Refusal,
): Effect.Effect<never, ImportRefused | RefusedByLevel> =>
  refusal.kind === "qti"
    ? Effect.flatMap(
        Effect.promise(() => import("#pantry/import/refusal.ts")),
        ({ ImportRefused: Refused }) =>
          Effect.fail(
            new Refused({ detail: refusal.detail, origin: refusal.origin, rule: refusal.rule }),
          ),
      )
    : Effect.fail(
        new RefusedByLevel({ detail: refusal.detail, level: refusal.level, rule: refusal.rule }),
      );
