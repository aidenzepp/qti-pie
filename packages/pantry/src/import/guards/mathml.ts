/**
 * The MathML content-model guard: the element children of every MathML node, matched against the
 * content model the XSD states for its kind (spec 4.8, bin 2).
 *
 * Grizzle cannot state an order or a count over a union of kinds, and MathML's models are mostly
 * unions (`m:mfrac` holds exactly two element children of about 170 kinds), so the guard reads
 * them from `schema/mathml/models.ts`. {@link modelFinding} is the pure core over plain handle
 * strings; {@link mathmlGuards} reads the rows an import built and refuses before any is written.
 * The REC's narrower models and the head-dependent models of `m:apply` and `m:bind` are later
 * slices' (spec MA04, parts 2 to 4), so the models here are the XSD's alone.
 */
import { Effect } from "effect";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows } from "#pantry/import/tree.ts";
import { mathmlInventory } from "#pantry/schema/content/inventory/mathml.ts";
import { kinds as genericKinds } from "#pantry/schema/kinds/generic.ts";
import { models } from "#pantry/schema/mathml/models.ts";
import type { Model, Particle } from "#pantry/schema/mathml/models.ts";
import { Edge, Node } from "#pantry/schema/node.ts";

/**
 * The handles of the MathML kinds: the keys of the XSD inventory leaf, `m:semantics.ci` included.
 */
const mathmlKinds: ReadonlySet<string> = new Set(Object.keys(mathmlInventory));

/**
 * The kinds of the children that are not elements: text, whitespace, entity references, comments
 * and processing instructions. A model constrains element children alone.
 */
const notElements: ReadonlySet<string> = new Set(genericKinds);

/**
 * The pattern text of a handle's literal spelling, safe inside a regular expression.
 *
 * @param handle - A kind handle, such as `m:semantics.ci`.
 * @returns The handle with every pattern character escaped.
 */
const literal = (handle: string): string => RegExp.escape(handle);

/**
 * The pattern text of a particle's repeat, nothing for exactly one.
 *
 * @param particle - The particle.
 * @returns The quantifier that applies its `min` and `max`.
 */
const repeat = (particle: Particle): string => {
  if (particle.min === 1 && particle.max === 1) {
    return "";
  }

  return `{${particle.min},${particle.max ?? ""}}`;
};

/**
 * The pattern text of one particle over the space-terminated handles a child list is written as:
 * a handle is matched with its trailing space, so no handle matches the front of a longer one.
 *
 * @param particle - The particle.
 * @returns The pattern that matches the particle's children.
 */
const patternOf = (particle: Particle): string => {
  if ("any" in particle) {
    return `(?:\\S+ )${repeat(particle)}`;
  }

  if ("kinds" in particle) {
    return `(?:(?:${particle.kinds.map(literal).join("|")}) )${repeat(particle)}`;
  }

  if ("sequence" in particle) {
    return `(?:${particle.sequence.map(patternOf).join("")})${repeat(particle)}`;
  }

  return `(?:${particle.choice.map(patternOf).join("|")})${repeat(particle)}`;
};

/**
 * Every handle a particle names, descending into sequences and choices. A particle that matches
 * any element names none.
 *
 * @param particle - The particle.
 * @returns The handles, in the order the particle lists them.
 */
const handlesOf = (particle: Particle): readonly string[] => {
  if ("any" in particle) {
    return [];
  }

  if ("kinds" in particle) {
    return particle.kinds;
  }

  return ("sequence" in particle ? particle.sequence : particle.choice).flatMap(handlesOf);
};

/**
 * Where each handle sits in a model's order: the index of the first top-level particle that names
 * it. A handle the model does not name has no place.
 *
 * @param model - The model.
 * @returns The place of each named handle.
 */
const placesOf = (model: Model): ReadonlyMap<string, number> => {
  const places = new Map<string, number>();
  for (const [index, particle] of model.entries()) {
    for (const handle of handlesOf(particle)) {
      if (!places.has(handle)) {
        places.set(handle, index);
      }
    }
  }

  return places;
};

/**
 * One kind's model, compiled once: the pattern its space-joined children must match and the places
 * that put a permutation of them into the model's order.
 */
interface Compiled {
  readonly model: Model;
  readonly pattern: RegExp;
  readonly places: ReadonlyMap<string, number>;
}

/**
 * The compiled model of every MathML handle.
 */
const compiled: ReadonlyMap<string, Compiled> = new Map(
  Object.entries(models).map(([kind, model]) => [
    kind,
    {
      model,
      pattern: new RegExp(`^${model.map(patternOf).join("")}$`, "u"),
      places: placesOf(model),
    },
  ]),
);

/**
 * Whether a child list matches a compiled model.
 *
 * @param entry - The compiled model.
 * @param children - The element children's handles, in order.
 * @returns True when the whole list matches.
 */
const matches = (entry: Compiled, children: readonly string[]): boolean =>
  entry.pattern.test(children.map((child) => `${child} `).join(""));

/**
 * The rule a failed child list breaks, or nothing when it passes.
 */
export type ModelFinding = "ordering" | "union-count" | undefined;

/**
 * Judge one MathML node's element children against the XSD's content model of its kind.
 *
 * The children are the element children only, as handles in document order: never `text`, `ws`,
 * `entityRef`, `comment` or `pi`. The answer is `union-count` when the multiset of children is
 * wrong (a count, or a child the model does not name), and `ordering` when the same children
 * sorted into the model's particle order would match, so only their order is wrong. Children are
 * sorted by the first top-level particle that names them, equal places keeping their order.
 *
 * @param kind - The node's kind handle, such as `m:mfrac`.
 * @param children - The element children's handles, in document order.
 * @returns Nothing when the children match, otherwise the rule they break.
 * @throws {Error} When the kind has no model: that is a gap in the table, not a finding about the
 *   tree.
 */
export const modelFinding = (kind: string, children: readonly string[]): ModelFinding => {
  const entry = compiled.get(kind);
  if (entry === undefined) {
    throw new Error(
      `The kind ${kind} has no MathML content model; add it to schema/mathml/models.ts.`,
    );
  }

  if (matches(entry, children)) {
    return undefined;
  }

  const place = (child: string): number => entry.places.get(child) ?? entry.model.length;
  const sorted = children.toSorted((a, b) => place(a) - place(b));
  const moved = sorted.some((child, index) => child !== children[index]);

  return moved && matches(entry, sorted) ? "ordering" : "union-count";
};

/**
 * How a particle's repeat reads in a model's description.
 *
 * @param particle - The particle.
 * @returns A suffix: nothing for one, `?`, `*`, `+` or the counts.
 */
const countOf = (particle: Particle): string => {
  if (particle.min === 1 && particle.max === 1) {
    return "";
  }

  if (particle.min === 0 && particle.max === 1) {
    return "?";
  }

  if (particle.min === 0 && particle.max === undefined) {
    return "*";
  }

  if (particle.min === 1 && particle.max === undefined) {
    return "+";
  }

  return `{${particle.min},${particle.max ?? ""}}`;
};

/**
 * Describe one particle for a refusal: a short set of handles by name, a long one by its size.
 *
 * @param particle - The particle.
 * @returns The particle's text, with its repeat.
 */
const describeParticle = (particle: Particle): string => {
  if ("any" in particle) {
    return `any element${countOf(particle)}`;
  }

  if ("kinds" in particle) {
    const names =
      particle.kinds.length <= 4
        ? particle.kinds.join(" or ")
        : `one of ${particle.kinds.length} kinds`;

    return `${names}${countOf(particle)}`;
  }

  if ("sequence" in particle) {
    return `(${particle.sequence.map(describeParticle).join(", ")})${countOf(particle)}`;
  }

  return `(${particle.choice.map(describeParticle).join(" | ")})${countOf(particle)}`;
};

/**
 * Describe a content model for a refusal.
 *
 * @param model - The model.
 * @returns The model's particles in order, or `no element child` for an empty model.
 */
const describeModel = (model: Model): string =>
  model.length === 0 ? "no element child" : model.map(describeParticle).join(", ");

/**
 * The most children a refusal names before it counts the rest.
 */
const namedChildren = 12;

/**
 * List a node's children for a refusal.
 *
 * @param children - The element children's handles.
 * @returns The handles in order, the first few when there are many, or `no element child`.
 */
const describeChildren = (children: readonly string[]): string => {
  if (children.length === 0) {
    return "no element child";
  }

  const shown = children.slice(0, namedChildren).join(", ");

  return children.length > namedChildren
    ? `${shown} and ${children.length - namedChildren} more`
    : shown;
};

/**
 * Refuse a MathML node whose element children break its model.
 *
 * @param rule - `ordering` or `union-count`.
 * @param node - The node: its id, kind and schema version.
 * @param node.id - The node's id.
 * @param node.kind - The node's kind handle.
 * @param node.version - The schema version the node is read under.
 * @param children - The node's element children's handles, in document order.
 * @returns The refusal, naming the node, its kind, the model and the children.
 */
const refusal = (
  rule: "ordering" | "union-count",
  node: { readonly id: string; readonly kind: string; readonly version: string },
  children: readonly string[],
): ImportRefused => {
  const model = describeModel(compiled.get(node.kind)?.model ?? []);
  const wrong =
    rule === "ordering"
      ? "the children are the right ones but in the wrong order; the model lists them in the order it gives"
      : "the children do not match it, by count or by kind; text, comments and processing instructions are not counted";

  return new ImportRefused({
    detail: `${node.kind} ${node.id} (${node.version}) holds ${describeChildren(children)}, but its content model is ${model}: ${wrong}. Hold the children the model names, in its order, and nothing else.`,
    rule,
  });
};

/**
 * Refuse the first MathML node, in document order, whose element children break the content model
 * of its kind.
 *
 * It reads every `Node` row whose kind is a MathML handle, and for each the element children its
 * `Edge` rows give in `position` order. Nodes are visited in preorder from each tree's root, so
 * the first finding is the one earliest in the document. No row is written.
 *
 * @param rows - The rows an import built for one package.
 * @returns Nothing when every MathML node matches its model.
 */
export const mathmlGuards = Effect.fn("mathmlGuards")(function* mathmlGuards(
  rows: Rows,
): Effect.fn.Return<void, ImportRefused> {
  const nodes = Rows.of(rows, Node);
  const edges = Map.groupBy(
    Rows.of(rows, Edge).toSorted((a, b) => Number(a.position - b.position)),
    (edge) => edge.parent,
  );
  const children = new Set(Rows.of(rows, Edge).map((edge) => edge.child));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const pending = nodes.filter((node) => !children.has(node.id)).toReversed();
  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined) {
      break;
    }

    const own = edges.get(node.id) ?? [];
    if (mathmlKinds.has(node.kind)) {
      const handles = own.map((edge) => edge.childKind).filter((kind) => !notElements.has(kind));
      const rule = modelFinding(node.kind, handles);
      if (rule !== undefined) {
        yield* refusal(rule, node, handles);
      }
    }

    for (const edge of own.toReversed()) {
      const child = byId.get(edge.child);
      if (child !== undefined) {
        pending.push(child);
      }
    }
  }
});
