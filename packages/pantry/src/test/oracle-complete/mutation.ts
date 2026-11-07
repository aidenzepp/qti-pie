/**
 * The mutations the oracle-completeness property draws (`src/test/complete.oracle.test.ts`), and
 * the base packages they break.
 *
 * A {@link Mutation} names one law of the law oracle (`#pantry/test/oracle.ts`) and breaks exactly
 * it in a package the oracle accepts: the every-relation package
 * (`#pantry/test/gen/every-relation.ts`), drawn by its member counts, or a base of the mutation's
 * own. Each mutation is a generator, so the site it edits and the value it writes are drawn, never
 * one fixed example:
 *
 * - `package`: an edit of the base's entries, judged by `judge` over the whole package;
 * - `rows`: an edit of one listed document's folded rows, judged by `documentBreaches`, for a law
 *   over rows the folds write that no package text can break (a tree's interval, a fold's copy).
 *
 * The property holds a mutated package to the law: the oracle raises it, and raises no law whose
 * rule stands ahead of the law's in the refusal's precedence (`#pantry/import/refusal.ts`
 * `precedence`), so the database, which names a refusal by that order, names it by the law's rule.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { Effect, Option } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import type { SchemaVersion } from "#pantry/grammar/kinds.ts";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { everyRelationPackage } from "#pantry/test/gen/every-relation.ts";
import type { MemberCounts, PackageEntries } from "#pantry/test/gen/every-relation.ts";

/**
 * A base package a mutation breaks: its entries, which the oracle accepts, and the member counts
 * it was drawn by.
 */
export interface Base {
  readonly entries: PackageEntries;
  readonly members: MemberCounts;
}

/**
 * The schema version every base is judged under: the every-relation manifest's `schemaversion`.
 */
export const baseVersion: SchemaVersion = "3.0.0";

/**
 * One law's mutation, drawn against a base:
 *
 * - `package`: `mutate` edits the base's entries; `base`, when given, replaces the every-relation
 *   package as the base the mutation reads, and must be one the oracle accepts;
 * - `rows`: `mutate` edits the folded rows of the base's listed document at `document`, which must
 *   break no law before the edit.
 */
export type Mutation =
  | {
      readonly base?: (members: MemberCounts) => PackageEntries;
      readonly mutate: (base: Base, grammar: ComposedGrammar) => Gen<PackageEntries>;
      readonly over: "package";
    }
  | {
      readonly document: string;
      readonly mutate: (
        rows: FoldedRows<Composed>,
        grammar: ComposedGrammar,
      ) => Gen<FoldedRows<Composed>>;
      readonly over: "rows";
    };

/**
 * The every-relation package for a draw of member counts, the default base.
 *
 * @param members - The counts.
 * @returns Its entries.
 */
export const everyRelationBase = (members: MemberCounts): PackageEntries =>
  everyRelationPackage(members);

/**
 * The encoder every edited text is written back with.
 */
const encoder = new TextEncoder();

/**
 * The decoder every base text is read with: every generated document is UTF-8.
 */
const decoder = new TextDecoder("utf-8", { fatal: true });

/**
 * Read one entry of a package as text.
 *
 * @param entries - The package.
 * @param path - The entry's path.
 * @returns Its text. Throws when the package has no such entry, a mutation's own defect.
 */
export const textOf = (entries: PackageEntries, path: string): string => {
  const bytes = entries.get(path);
  if (bytes === undefined) {
    throw new Error(`the base package has no entry ${path}`);
  }

  return decoder.decode(bytes);
};

/**
 * Replace one entry of a package with a text, or add it when the package has none at the path.
 *
 * @param entries - The package.
 * @param path - The entry's path.
 * @param text - Its new text, written as UTF-8.
 * @returns The package with the entry.
 */
export const withText = (entries: PackageEntries, path: string, text: string): PackageEntries =>
  new Map([...entries, [path, encoder.encode(text)]]);

/**
 * Remove one entry of a package.
 *
 * @param entries - The package.
 * @param path - The entry's path.
 * @returns The package without it.
 */
export const without = (entries: PackageEntries, path: string): PackageEntries =>
  new Map([...entries].filter(([at]) => at !== path));

/**
 * Edit one entry's text by a function of it.
 *
 * @param entries - The package.
 * @param path - The entry's path.
 * @param edit - The edit.
 * @returns The package with the entry edited.
 */
export const editText = (
  entries: PackageEntries,
  path: string,
  edit: (text: string) => string,
): PackageEntries => withText(entries, path, edit(textOf(entries, path)));

/**
 * Draw one match of a pattern in a text and replace it, every other match left as it is: the site a
 * mutation edits, drawn among every site the base holds.
 *
 * @param text - The text.
 * @param pattern - The pattern; its flags are kept, and it is matched globally.
 * @param replace - The replacement of the drawn match, from the match.
 * @returns A generator of the edited text. Throws when the text holds no match, so a base without
 *   the site fails the mutation loudly rather than passing it unmutated.
 */
export const replaceDrawn =
  (text: string, pattern: RegExp, replace: (match: RegExpExecArray) => string): Gen<string> =>
  (source) => {
    const global = new RegExp(
      pattern.source,
      pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
    );
    const matches = [...text.matchAll(global)];
    if (matches.length === 0) {
      throw new Error(`the base holds no site ${String(pattern)}`);
    }

    const match = matches[source.draw(int(0, matches.length - 1))];
    if (match === undefined) {
      throw new Error(`the base holds no site ${String(pattern)}`);
    }

    return `${text.slice(0, match.index)}${replace(match)}${text.slice(match.index + match[0].length)}`;
  };

/**
 * Draw two distinct matches of a pattern in a text and give the first the second's value: the first
 * capture group of the first match is replaced by the second's, every other match left as it is.
 * The site of a duplicate a key law refuses.
 *
 * @param text - The text.
 * @param pattern - The pattern, whose first capture group is the value; matched globally.
 * @returns A generator of the edited text. Throws when the text holds fewer than two matches with
 *   distinct values.
 */
export const renameDrawn =
  (text: string, pattern: RegExp): Gen<string> =>
  (source) => {
    const global = new RegExp(
      pattern.source,
      pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
    );
    const matches = [...text.matchAll(global)];
    const renamed = matches[source.draw(int(0, matches.length - 1))];
    const others = matches.filter((match) => match[1] !== renamed?.[1]);
    if (renamed === undefined || others.length === 0) {
      throw new Error(`the base holds no two sites ${String(pattern)} of distinct values`);
    }

    const taken = others[source.draw(int(0, others.length - 1))]?.[1] ?? "";
    const value = renamed[1] ?? "";
    const at = renamed.index + renamed[0].indexOf(value);

    return `${text.slice(0, at)}${taken}${text.slice(at + value.length)}`;
  };

/**
 * Draw one match of a pattern in a text and write a copy of it right after it, on a line of its own
 * at the match's indentation: a second element of one name, the site of a duplicate a key law
 * refuses.
 *
 * @param text - The text.
 * @param pattern - The pattern, which matches whole elements on one line; matched globally.
 * @returns A generator of the edited text. Throws when the text holds no match.
 */
export const duplicateDrawn = (text: string, pattern: RegExp): Gen<string> =>
  replaceDrawn(text, pattern, (match) => {
    const line = text.lastIndexOf("\n", match.index) + 1;
    const indent = /^[ \t]*/u.exec(text.slice(line, match.index))?.[0] ?? "";

    return `${match[0]}\n${indent}${match[0]}`;
  });

/**
 * Draw one of a package's documents among those a pattern finds a site in, and edit it by a drawn
 * edit of its text.
 *
 * @param entries - The package.
 * @param paths - The documents the edit may target.
 * @param pattern - The site the edit needs, which the drawn document must hold.
 * @param edit - The drawn edit of the document's text.
 * @returns A generator of the edited package. Throws when no document holds the site.
 */
export const editDrawnDocument =
  (
    entries: PackageEntries,
    paths: readonly string[],
    pattern: RegExp,
    edit: (text: string) => Gen<string>,
  ): Gen<PackageEntries> =>
  (source) => {
    const held = paths.filter((path) => pattern.test(textOf(entries, path)));
    if (held.length === 0) {
      throw new Error(`no document of ${paths.join(", ")} holds a site ${String(pattern)}`);
    }

    const path = held[source.draw(int(0, held.length - 1))] ?? "";

    return withText(entries, path, source.draw(edit(textOf(entries, path))));
  };

/**
 * Replace the one occurrence of a passage in a text.
 *
 * @param text - The text.
 * @param passage - The passage, which must occur exactly once.
 * @param replacement - What replaces it.
 * @returns The edited text. Throws when the passage occurs other than once.
 */
export const replaceOnce = (text: string, passage: string, replacement: string): string => {
  const at = text.indexOf(passage);
  if (at === -1 || text.includes(passage, at + 1)) {
    throw new Error(`the passage ${JSON.stringify(passage)} does not occur exactly once`);
  }

  return `${text.slice(0, at)}${replacement}${text.slice(at + passage.length)}`;
};

/**
 * One drawn replacement: a passage of a document, which occurs exactly once, and the texts that may
 * replace it.
 */
export interface Site {
  readonly passage: string;
  readonly path: string;
  readonly replacements: readonly [string, ...string[]];
}

/**
 * Draw one site and one of its replacements, and write it into the base.
 *
 * @param sites - The sites.
 * @returns The mutation's edit.
 */
export const replacing =
  (sites: readonly [Site, ...Site[]]) =>
  ({ entries }: Base): Gen<PackageEntries> =>
  (source) => {
    const site = sites[source.draw(int(0, sites.length - 1))] ?? sites[0];
    const replacement = source.draw(element([...site.replacements]));

    return withText(
      entries,
      site.path,
      replaceOnce(textOf(entries, site.path), site.passage, replacement),
    );
  };

/**
 * One passage of a document and the texts that may replace it, as a `package` mutation.
 *
 * @param path - The document.
 * @param passage - The passage, which occurs exactly once.
 * @param replacements - What may replace it.
 * @returns The mutation.
 */
export const passageAt = (
  path: string,
  passage: string,
  replacements: readonly [string, ...string[]],
): Mutation => ({ mutate: replacing([{ passage, path, replacements }]), over: "package" });

/**
 * Draw one row of a list among those a predicate keeps, and replace it, every other row as it is.
 *
 * @param rows - The rows.
 * @param keep - The rows the edit may target.
 * @param change - The replacement of the drawn row.
 * @returns A generator of the edited rows. Throws when no row is kept.
 */
export const changeDrawn =
  <Row>(
    rows: readonly Row[],
    keep: (row: Row, index: number) => boolean,
    change: (row: Row, index: number) => Row,
  ): Gen<readonly Row[]> =>
  (source) => {
    const targets = rows.flatMap((row, index) => (keep(row, index) ? [index] : []));
    if (targets.length === 0) {
      throw new Error("the base's rows hold no row the edit may target");
    }

    const target = targets[source.draw(int(0, targets.length - 1))];

    return rows.map((row, index) => (index === target ? change(row, index) : row));
  };

/**
 * Draw one row of a list and drop it, every other row as it is.
 *
 * @param rows - The rows.
 * @returns A generator of the list without the drawn row. Throws when the list is empty.
 */
export const droppedDrawn =
  <Row>(rows: readonly Row[]): Gen<readonly Row[]> =>
  (source) => {
    if (rows.length === 0) {
      throw new Error("the base's rows hold no row the edit may drop");
    }

    const dropped = source.draw(int(0, rows.length - 1));

    return rows.filter((_, index) => index !== dropped);
  };

/**
 * Replace a document's node rows by an edit of them, every other row kept.
 *
 * @param rows - The folded rows.
 * @param nodes - The edited node rows.
 * @returns The rows with the node rows replaced.
 */
export const withNodes = (
  rows: FoldedRows<Composed>,
  nodes: readonly FoldedNode<Composed>[],
): FoldedRows<Composed> => ({ ...rows, nodes });

/**
 * A drawn edit of one listed document's folded rows, as a `rows` mutation.
 *
 * @param document - The document's path.
 * @param edit - The drawn edit, of the rows and the grammar.
 * @returns The mutation.
 */
export const editingRows = (
  document: string,
  edit: (rows: FoldedRows<Composed>, grammar: ComposedGrammar) => Gen<FoldedRows<Composed>>,
): Mutation => ({ document, mutate: edit, over: "rows" });

/**
 * Whether a node row is an element's, by the grammar's `IsElement`: no document node, character
 * run, comment, instruction, entity reference or doctype.
 *
 * @param grammar - The composed grammar.
 * @param node - The node row.
 * @returns Whether it is.
 */
export const isElementNode = (grammar: ComposedGrammar, node: FoldedNode<Composed>): boolean =>
  Option.isSome(grammar.kinds.isElement.lookup({ kind: node.kind }));

/**
 * Order two paths by UTF-16 code unit, the order `readPackage` lists entries in.
 *
 * @param left - One path.
 * @param right - The other.
 * @returns Negative, zero or positive as `left` sorts before, with or after `right`.
 */
const byCodeUnit = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

/**
 * Read a package's entries as `readPackage` returns them: each with its kind, sorted by path.
 *
 * @param entries - The package.
 * @returns Its files.
 */
export const filesOf = (entries: PackageEntries): readonly PackageFile[] =>
  [...entries]
    .map(([path, bytes]): PackageFile => ({
      bytes,
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => byCodeUnit(left.path, right.path));

/**
 * Read, shred and fold one entry of a package as the oracle does a listed document, its node ids
 * numbered for the document.
 *
 * @param entries - The package.
 * @param path - The document's path.
 * @param grammar - The composed grammar.
 * @returns Its folded rows. Dies when the document does not read, shred or fold, a base's defect.
 */
export const foldedDocument = (entries: PackageEntries, path: string, grammar: ComposedGrammar) =>
  Effect.gen(function* foldDocument() {
    const xml = yield* Effect.orDie(readXml(encoder.encode(textOf(entries, path))));
    const tree = yield* Effect.orDie(shred(xml, baseVersion, shredGrammarOf(grammar)));

    return yield* Effect.orDie(
      Effect.fromResult(
        fold(
          tree,
          (index): NodeId => `00000000-0000-4000-8001-${index.toString(16).padStart(12, "0")}`,
          foldGrammarOf(grammar),
        ),
      ),
    );
  });
