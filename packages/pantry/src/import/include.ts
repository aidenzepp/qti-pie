/**
 * The rows of an `xi:include` outside a processing tree: the `XInclude` arm, the attributes the
 * source wrote and the `Fallback` of its `xi:fallback` child.
 *
 * An include in an item body, a prompt, a simple choice, a `p` or `div`, a section, a test rubric
 * or feedback body, or a stimulus body is written here. The includes under the roots processing's
 * own walk writes (response, template and outcome processing, pre-conditions, branch rules and
 * template defaults) are skipped: that writer owns them. The include is stored as written and never
 * resolved (spec 4.12, E5).
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, identity, Option } from "effect";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { closedOf, Rows, typedAttribute, withParents } from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import type { WhiteSpace } from "#pantry/import/whitespace.ts";
import { XIncludeUri } from "#pantry/schema/contracts.ts";
import type { AttributeNameHandle, NodeKindHandle } from "#pantry/schema/node.ts";
import * as ruleSchema from "#pantry/schema/rule.ts";
import { XIncludeParseValue } from "#pantry/schema/content/rosters.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The kinds whose subtrees processing's own writer owns an include in.
 */
const processingKinds: ReadonlySet<NodeKindHandle> = new Set<NodeKindHandle>([
  "qti-branch-rule",
  "qti-outcome-processing",
  "qti-pre-condition",
  "qti-response-processing",
  "qti-template-default",
  "qti-template-processing",
]);

/**
 * The whitespace class of each `xi:include` attribute: `href` and `parse` collapse, the rest keep
 * their text.
 */
const classes = {
  accept: "preserve",
  "accept-language": "preserve",
  encoding: "preserve",
  href: "collapse",
  parse: "collapse",
  xpointer: "preserve",
} as const satisfies Readonly<Partial<Record<AttributeNameHandle, WhiteSpace>>>;

/**
 * Write the rows of one `xi:include`.
 *
 * @param element - The include.
 * @param entry - The node it became.
 * @param nodes - The node index of the tree.
 * @param rows - The rows so far.
 * @returns The rows with the include's added, or an `ImportRefused` for a `parse` outside its
 *   roster.
 */
const oneInclude = (
  element: Element,
  entry: { readonly id: Uuid; readonly kind: NodeKindHandle },
  nodes: NodeIndex,
  rows: Rows,
): Effect.Effect<Rows, ImportRefused> =>
  Effect.gen(function* includeArm() {
    let built = rows;
    const read = (name: keyof typeof classes): Option.Option<string> =>
      Option.fromNullishOr(element.attributes.find((found) => found.qname === name)).pipe(
        Option.map((found) => {
          const typed = typedAttribute(
            built,
            entry.id,
            entry.kind,
            name,
            found.value,
            classes[name],
          );
          built = typed.rows;

          return typed.value;
        }),
      );
    const href = read("href");
    const parse = read("parse");
    const parseHandle = yield* Option.match(parse, {
      onNone: () => Effect.succeed(Option.none<(typeof XIncludeParseValue.handles)[number]>()),
      onSome: (value) =>
        closedOf(
          XIncludeParseValue.handles,
          value,
          "attribute-lexical",
          "the parse attribute of xi:include",
        ).pipe(Effect.map(Option.some)),
    });
    const own = (value: Option.Option<string>) =>
      Option.toArray(value).map((text) => ({ node: entry.id, value: text }));
    const fallback = element.children.flatMap((child) => {
      const found = child.kind === "element" ? nodes.get(child) : undefined;

      return found?.kind === "xi:fallback" ? [{ id: found.id }] : [];
    });

    built = Rows.add(built, ruleSchema.XInclude, [{ id: entry.id }]);
    built = Rows.add(
      built,
      ruleSchema.XIncludeHref,
      Option.toArray(href).map((text) => ({ node: entry.id, value: XIncludeUri(text) })),
    );
    built = Rows.add(
      built,
      ruleSchema.XIncludeParse,
      Option.toArray(parseHandle).map((value) => ({ node: entry.id, value })),
    );
    built = Rows.add(built, ruleSchema.XIncludeXpointer, own(read("xpointer")));
    built = Rows.add(built, ruleSchema.XIncludeEncoding, own(read("encoding")));
    built = Rows.add(built, ruleSchema.XIncludeAccept, own(read("accept")));
    built = Rows.add(built, ruleSchema.XIncludeAcceptLanguage, own(read("accept-language")));

    return Rows.add(built, ruleSchema.Fallback, fallback);
  });

/**
 * Write the rows of every `xi:include` of a tree that is not under a processing root.
 *
 * @param root - The tree's root element.
 * @param nodes - The node index of the tree.
 * @param rows - The rows so far.
 * @returns The rows with each include's `XInclude`, attribute and `Fallback` rows added, or an
 *   `ImportRefused` under `attribute-lexical` for a `parse` outside its roster.
 */
export const includeRows = Effect.fn("import.includeRows")(function* includeRows(
  root: Element,
  nodes: NodeIndex,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused> {
  const walk = withParents(root, Option.none());
  const parents = new Map(walk.map(([element, parent]) => [element, parent]));
  const underProcessing = (element: Element): boolean =>
    Option.match(Option.flatMap(Option.fromNullishOr(parents.get(element)), identity), {
      onNone: () => false,
      onSome: (parent) => {
        const kind = nodes.get(parent)?.kind;

        return (kind !== undefined && processingKinds.has(kind)) || underProcessing(parent);
      },
    });

  let built = rows;
  for (const [element] of walk) {
    const entry = nodes.get(element);
    if (entry?.kind === "xi:include" && !underProcessing(element)) {
      built = yield* oneInclude(element, entry, nodes, built);
    }
  }

  return built;
});
