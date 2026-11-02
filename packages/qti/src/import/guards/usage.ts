/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The usage-data guard's refusal; `usageGuards` arrives with p4-32.
 */
import { Schema } from "effect";

/**
 * A usage-data guard refused the rows.
 *
 * `rule` names the guard and `detail` the first row that broke it.
 */
export class UsageGuardRefusal extends Schema.TaggedError<UsageGuardRefusal>()(
  "UsageGuardRefusal",
  {
    detail: Schema.String,
    rule: Schema.Literals(["ordering", "calendar", "text-copy", "typed-copy"]),
  },
) {}
