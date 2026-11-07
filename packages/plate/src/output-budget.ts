/**
 * The output budget's default and its largest value, in a module of their own.
 *
 * `configuration.ts`'s Schema reads both, and `redactItem` reads the default, the budget a
 * redaction runs under when its caller passes none. They live apart from `configuration.ts`, which
 * value-imports Schema, so that `redact` and `render`, browser modules, read the default without
 * loading the Schema side.
 *
 * @module
 */

/**
 * The output budget a configuration holds when the host sets none, and the one a redaction runs
 * under when its caller passes none: 16,777,216 characters (16 MiB of ASCII), counted as a
 * string's `length` counts them (UTF-16 code units).
 */
export const defaultOutputBudget = 16_777_216;

/**
 * The largest output budget a configuration admits: 536,870,888 characters, V8's longest string,
 * the smallest of the engines' limits, so no budget asks an engine for a string it cannot build.
 */
export const maximumOutputBudget = 536_870_888;
