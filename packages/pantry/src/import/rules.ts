/**
 * The rules a refused import names, and how a refusal before any row exists names its own (plan W5,
 * Q5.17; the W5 amendment's C22): the reader's, the ZIP container's, the package reader's and the
 * codec's ({@link ruleOfError}), and the one error every refusal is, {@link ImportRefused}. The
 * import's read reaches only this half: it builds no schema and names no law, so a refusal by the
 * database, which `#pantry/import/refusal.ts` names by its laws, is never on the dry run's path.
 */
import { Match, Option, Order, Schema } from "effect";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import type { NotQti3, UnmodeledVocabulary } from "#pantry/model/shred.ts";
import { readerOrigin, RefusalOrigin } from "#pantry/package/refusal-origin.ts";
import type { PackageReadError } from "#pantry/package/read.ts";
import type { ZipRefusal } from "#pantry/package/zip.ts";
import { precedence } from "#pantry/vocab/laws.ts";

/**
 * The rules a package is refused under before any row exists, which no law keeps: the codec's
 * `not-qti3` (shred reads no schema version or a QTI 2 root), the reader's `reader-refusal`, and
 * the ZIP container's and the package reader's (`src/package/zip.ts`, `read.ts`). The codec's
 * `unmodeled-vocabulary` and `attribute-admission` and the reader's `well-formedness` are laws'
 * rules as well, in {@link precedence}.
 */
const codecRules = [
  "not-qti3",
  "reader-refusal",
  "zip-format",
  "manifest-root",
  "href-path",
] as const;

/**
 * The rules that name a stated limit of the representation, never a law of the specification:
 * `key-text-bound` is the bound on a text a key holds (`src/qti/limits.ts` `keyText`), which
 * grizzle's representability rule derives from PostgreSQL's `BTMaxItemSize`, and `href-form` an
 * href the importer reads no name from (reading 102, `overlays/package.ts` `Limit`), and
 * `fragment-context` the one context an included fragment's rows are judged in (reading 117,
 * `tests.ts` `Fragment_context`): a fragment two includes place in different interactions would
 * need two rows per node, and `remote-section` a section ref whose href resolves outside the
 * package (reading 170, `tests.ts` `Remote_section_ref`): the import is offline and never fetches
 * the section, which is the test's own content, so it cannot assemble the test.
 *
 * A value over the bound is valid QTI the model cannot key, so its verdict says so by its rule. The
 * import meets it as the bound's pattern law: grizzle's encoder and its family fill check a text's
 * type, its NUL and its surrogates and never its pattern (`core/text.ts` `validateText`,
 * `write/family/fold.ts` `admittedAt`), so the column's domain CHECK refuses it as the statement
 * casts it, `invariant-rejected` on its field's pattern law, its witness the key of the stated row
 * that holds the value (README, "Errors and outcomes").
 */
export const limitRules = [
  "key-text-bound",
  "href-form",
  "fragment-context",
  "remote-section",
] as const satisfies readonly (typeof precedence)[number][];

/**
 * Every name a refused import may carry: the laws' rules, the codec's, the reader's and the
 * container's, in the order a refusal lists its rules ({@link ruleOrder}).
 *
 * The verdict file names its refusals by these (`verdicts/*.tsv`, `src/test/verdicts.ts`).
 */
export const ImportRule = Schema.Literals([...precedence, ...codecRules]);

/**
 * One name of the roster.
 */
export type Rule = typeof ImportRule.Type;

/**
 * The order a refusal lists its rules in, and the verdict file writes them in: the roster's, the
 * laws' rules most specific first by {@link precedence}, then the codec's. It is a total order, so
 * a set of rules has one listing, and it decides nothing: a refusal carries every rule its laws
 * carry.
 */
export const ruleOrder: Order.Order<Rule> = Order.mapInput(Order.Number, (rule: Rule) =>
  ImportRule.literals.indexOf(rule),
);

/**
 * Name the rules a refusal is under, as its message says them.
 *
 * @param rules - The refusal's rules, in {@link ruleOrder}.
 * @returns The phrase: the one rule, the rules listed, or that the law table names no rule of the
 *   laws.
 */
const rulesText = (rules: readonly Rule[]): string => {
  const [only, ...more] = rules;
  if (only === undefined) {
    return "under laws no rule of the law table names";
  }

  return more.length === 0 ? `under the ${only} rule` : `under the rules ${rules.join(", ")}`;
};

/**
 * The package was refused, under the rules of the roster its refusal names.
 *
 * `rules` is a set, listed in {@link ruleOrder}: the one rule of a refusal made before the
 * database, or every rule the laws of the database's refusal carry, none where the law table holds
 * none of them. `detail` says what broke it, and `origin` where the refusal came from
 * (`#pantry/package/refusal-origin.ts`): the reader, the container or the codec, or the database,
 * whose case carries how grizzle decided the laws it named, each law shown as grizzle reports it
 * with its installed name, its name and its rule, where each is stated, and how the refusal names
 * the row that broke them. A reader that tells the user where to look reads the witness's kind
 * rather than the detail's wording.
 */
export class ImportRefused extends Schema.TaggedError<ImportRefused>()("ImportRefused", {
  detail: Schema.String,
  origin: RefusalOrigin,
  rules: Schema.Array(ImportRule),
}) {
  /**
   * What was refused and under which rules, in one sentence.
   */
  override get message(): string {
    return `The package was refused ${rulesText(this.rules)}: ${this.detail}`;
  }
}

/**
 * Every error that refuses a package before the database does: the reader's, the ZIP container's,
 * the package reader's and the codec's, and an `ImportRefused` the importer raised itself.
 */
export type ReadRefusal =
  | ImportRefused
  | NotQti3
  | PackageReadError
  | ReaderRefusal
  | UnmodeledVocabulary
  | WellFormednessError
  | ZipRefusal;

/**
 * Build the refusal of an error the reader, the container or the codec raised.
 *
 * Shred's `UnmodeledVocabulary` is `attribute-admission` for an attribute its element admits
 * under no name or open class (reason `unadmitted`, AL1's rule) and `unmodeled-vocabulary` for
 * every other name it cannot represent; `PackageReadError` is `manifest-root` for a missing
 * manifest and `href-path` for an entry outside the package; a `ZipRefusal` names its own rule.
 * A `ReaderRefusal`'s detail starts with its own rule and, when it has a position, ends with its
 * line and column, as a `WellFormednessError`'s does.
 *
 * @param e - The error raised.
 * @returns The refusal naming its rule.
 */
export const ruleOfError = (e: ReadRefusal): ImportRefused =>
  Match.value(e).pipe(
    Match.tagsExhaustive({
      ImportRefused: (refused) => refused,
      NotQti3: (refused) =>
        new ImportRefused({ detail: refused.message, origin: readerOrigin, rules: ["not-qti3"] }),
      PackageReadError: (refused) =>
        new ImportRefused({
          detail: refused.message,
          origin: readerOrigin,
          rules: [refused.rule === "manifest-root" ? "manifest-root" : "href-path"],
        }),
      ReaderRefusal: (refused) =>
        new ImportRefused({
          detail: Option.match(refused.position, {
            onNone: () => `${refused.rule}: ${refused.detail}`,
            onSome: ({ column, line }) =>
              `${refused.rule}: ${refused.detail} at line ${String(line)}, column ${String(column)}`,
          }),
          origin: readerOrigin,
          rules: ["reader-refusal"],
        }),
      UnmodeledVocabulary: (refused) =>
        new ImportRefused({
          detail: refused.message,
          origin: readerOrigin,
          rules: [refused.reason === "unadmitted" ? "attribute-admission" : "unmodeled-vocabulary"],
        }),
      WellFormednessError: (refused) =>
        new ImportRefused({
          detail: `${refused.message} at line ${String(refused.line)}, column ${String(refused.column)}`,
          origin: readerOrigin,
          rules: ["well-formedness"],
        }),
      ZipRefusal: (refused) =>
        new ImportRefused({ detail: refused.message, origin: readerOrigin, rules: [refused.rule] }),
    }),
  );
