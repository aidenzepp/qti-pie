/**
 * The Schema codec of the redacted item, for the server and the boundaries: {@link RedactedSchema}
 * checks the fields of a {@link Redacted}, {@link encodeRedacted} writes one in the JSON form a host
 * sends to a page, and {@link decodeRedacted} checks that form before `render` takes it.
 *
 * A `Redacted` holds Effect `Option`s and `bigint` counts, which `JSON.stringify` cannot write, so
 * this file owns the one wire form: an `Option` is an optional key, absent when none, and a count
 * is its decimal digits. `decodeRedacted` is the second way to a `Redacted`, beside
 * `redactItem`'s allowlisted copy, and brands only what its Schema checked.
 *
 * No browser module imports this file, so Schema stays out of the browser bundle.
 *
 * @module
 * @see `redactItem` in `#plate/payload.ts`, the allowlist that decides which fields a `Redacted`
 *   holds.
 */
import { Data, Option, Predicate, Result, Schema } from "effect";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import { modelledBaseTypes, modelledCardinalities } from "#plate/model/values.ts";
import { brandRedacted } from "#plate/payload.ts";
import type { Redacted, RedactedFields } from "#plate/payload.ts";
import { greatestCount } from "#plate/vocabulary.ts";

/**
 * A body element's attribute in the JSON form.
 */
interface BodyAttributeJson {
  readonly name: string;
  readonly value: string;
}

/**
 * An HTML element of the body in the JSON form.
 */
interface BodyElementJson {
  readonly attributes: readonly BodyAttributeJson[];
  readonly children: readonly BodyNodeJson[];
  readonly kind: "element";
  readonly path: string;
  readonly tag: string;
}

/**
 * A run of body text in the JSON form.
 */
interface BodyTextJson {
  readonly kind: "text";
  readonly text: string;
}

/**
 * A `qti-simple-choice` in the JSON form.
 */
interface SimpleChoiceJson {
  readonly content: readonly BodyNodeJson[];
  readonly fixed: boolean;
  readonly identifier: string;
}

/**
 * A Choice in the JSON form: its counts as decimal digits, and each `Option` an optional key.
 */
interface ChoiceInteractionJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: ChoiceInteraction["cardinality"];
  readonly choices: readonly SimpleChoiceJson[];
  readonly class: string;
  readonly kind: "choice";
  readonly maxChoices: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minChoices: string;
  readonly orientation?: string;
  readonly path: string;
  readonly prompt?: readonly BodyNodeJson[];
  readonly response: string;
  readonly shuffle: boolean;
}

/**
 * A Text Entry in the JSON form: `expectedLength` as decimal digits, and each `Option` an optional
 * key.
 */
interface TextEntryInteractionJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly base: number;
  readonly baseType: TextEntryInteraction["baseType"];
  readonly class: string;
  readonly expectedLength?: string;
  readonly kind: "text-entry";
  readonly path: string;
  readonly patternMask?: string;
  readonly patternMaskMessage?: string;
  readonly placeholder?: string;
  readonly response: string;
}

/**
 * An Extended Text in the JSON form: a Text Entry's fields, with `expectedLines`, `maxStrings` and
 * `minStrings` as decimal digits, and `expectedLines`, `maxStrings` and its Prompt optional keys.
 */
interface ExtendedTextInteractionJson extends Omit<TextEntryInteractionJson, "kind"> {
  readonly cardinality: ExtendedTextInteraction["cardinality"];
  readonly expectedLines?: string;
  readonly format: ExtendedTextInteraction["format"];
  readonly kind: "extended-text";
  readonly maxStrings?: string;
  readonly minStrings: string;
  readonly prompt?: readonly BodyNodeJson[];
}

/**
 * A body part phase 1 does not render, in the JSON form.
 */
interface UnsupportedJson {
  readonly feature: string;
  readonly kind: "unsupported";
  readonly path: string;
}

/**
 * A node of the body in the JSON form: the encoded side of {@link BodyNodeSchema}, written out
 * because the body is recursive and its suspended reference needs a declared type.
 */
type BodyNodeJson =
  | BodyElementJson
  | BodyTextJson
  | ChoiceInteractionJson
  | TextEntryInteractionJson
  | ExtendedTextInteractionJson
  | UnsupportedJson;

/**
 * The body's recursive reference: an element's children, a Prompt and a choice's content are body
 * nodes again.
 */
const BodyNodes = Schema.Array(
  // oxlint-disable-next-line eslint/no-use-before-define -- the body is recursive; the suspended reference is read only after `BodyNodeSchema` is defined.
  Schema.suspend((): Schema.Codec<BodyNode, BodyNodeJson> => BodyNodeSchema),
);

/**
 * A text the author may omit: an optional key, absent when none.
 */
const OptionalText = Schema.OptionFromOptionalKey(Schema.String);

/**
 * `max-choices` and `min-choices`: a count from 0 to 2^63-1, held exactly and written as its
 * decimal digits (reading 46).
 */
const ChoiceCount = Schema.BigIntFromString.check(
  Schema.isBetweenBigInt({ maximum: greatestCount, minimum: 0n }),
);

/**
 * `min-strings`: a count with no upper bound (reading 46 does not list it), held exactly and
 * written as its decimal digits.
 */
const Count = Schema.BigIntFromString.check(Schema.isGreaterThanOrEqualToBigInt(0n));

/**
 * `expected-length`, `expected-lines` and `max-strings`: a {@link Count}, an optional key absent
 * when the author gave none.
 */
const OptionalCount = Schema.OptionFromOptionalKey(Count);

/**
 * The fields a Text Entry and an Extended Text share, as `TextEntryInteraction` declares them.
 */
const textControlFields = {
  ariaLabel: OptionalText,
  ariaLabelledby: OptionalText,
  base: Schema.Int,
  baseType: Schema.Literals(["float", "integer", "string"]),
  class: Schema.String,
  expectedLength: OptionalCount,
  path: Schema.String,
  patternMask: OptionalText,
  patternMaskMessage: OptionalText,
  placeholder: OptionalText,
  response: Schema.String,
};

/**
 * The Schema of one body node, a union over the six kinds of `BodyNode`, every field included; its
 * type is {@link BodyNode} and its encoded form {@link BodyNodeJson}.
 */
const BodyNodeSchema = Schema.Union([
  Schema.Struct({
    attributes: Schema.Array(Schema.Struct({ name: Schema.String, value: Schema.String })),
    children: BodyNodes,
    kind: Schema.Literal("element"),
    path: Schema.String,
    tag: Schema.String,
  }),
  Schema.Struct({ kind: Schema.Literal("text"), text: Schema.String }),
  Schema.Struct({
    ariaLabel: OptionalText,
    ariaLabelledby: OptionalText,
    cardinality: Schema.Literals(["multiple", "single"]),
    choices: Schema.Array(
      Schema.Struct({ content: BodyNodes, fixed: Schema.Boolean, identifier: Schema.String }),
    ),
    class: Schema.String,
    kind: Schema.Literal("choice"),
    maxChoices: ChoiceCount,
    messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
    minChoices: ChoiceCount,
    orientation: OptionalText,
    path: Schema.String,
    prompt: Schema.OptionFromOptionalKey(BodyNodes),
    response: Schema.String,
    shuffle: Schema.Boolean,
  }),
  Schema.Struct({ ...textControlFields, kind: Schema.Literal("text-entry") }),
  Schema.Struct({
    ...textControlFields,
    cardinality: Schema.Literals(["multiple", "ordered", "single"]),
    expectedLines: OptionalCount,
    format: Schema.Literals(["plain", "preformatted", "xhtml"]),
    kind: Schema.Literal("extended-text"),
    maxStrings: OptionalCount,
    minStrings: Count,
    prompt: Schema.OptionFromOptionalKey(BodyNodes),
  }),
  Schema.Struct({
    feature: Schema.String,
    kind: Schema.Literal("unsupported"),
    path: Schema.String,
  }),
]);

/**
 * The Schema of a redacted item's fields; its type is {@link RedactedFields}, and its encoded form
 * the {@link RedactedJson} a host sends to a page.
 */
export const RedactedSchema = Schema.Struct({
  body: BodyNodes,
  document: Schema.String,
  identifier: Schema.String,
  lang: OptionalText,
  notices: Schema.Array(Schema.String),
  responses: Schema.Array(
    Schema.Struct({
      baseType: Schema.Literals(modelledBaseTypes),
      cardinality: Schema.Literals(modelledCardinalities),
      identifier: Schema.String,
    }),
  ),
  title: Schema.String,
});

/**
 * A redacted item in the form a host sends to a page: plain JSON, which `JSON.stringify` writes
 * without loss. An `Option` is an optional key, absent when none, and a count is its decimal
 * digits.
 */
export type RedactedJson = typeof RedactedSchema.Encoded;

/**
 * Where the redacted-item codec failed: reading the JSON form a host handed over, or writing one
 * from a `Redacted`.
 */
export type RedactedStage = "decode" | "encode";

/**
 * What each {@link RedactedStage}'s failure means and what to do about it.
 */
const redactedRemedies: Readonly<Record<RedactedStage, (issue: string) => string>> = {
  decode: (issue) =>
    `The input is not the JSON form encodeRedacted writes: ${issue}. Pass encodeRedacted's output to decodeRedacted unchanged, through JSON.stringify and JSON.parse if it crosses the wire.`,
  encode: (issue) =>
    `A field of the redacted item does not fit its JSON form: ${issue}. Only an item built by hand can cause this; pass the Redacted that redact returned.`,
};

/**
 * A redacted item the codec could not read or write: input that is not the JSON form
 * {@link encodeRedacted} writes, or that holds an interaction `render` cannot emit (`stage`
 * `decode`), or a `Redacted` with a field that does not fit {@link RedactedSchema} (`stage`
 * `encode`), which only an object built by hand can hold.
 */
export class InvalidRedacted extends Data.TaggedError("InvalidRedacted")<{
  /**
   * What the Schema found wrong, with the path to it, how deep the input nests past
   * {@link maximumDepth}, which interaction sits where QTI's schema admits none, or what reading
   * the input threw.
   */
  readonly issue: string;
  /**
   * Whether the item failed on its way in from the JSON form or on its way out to it.
   */
  readonly stage: RedactedStage;
}> {
  /**
   * What is wrong and what to do instead, in one line.
   */
  override get message(): string {
    return redactedRemedies[this.stage](this.issue);
  }
}

/**
 * Write a redacted item in the JSON form a host sends to a page.
 *
 * @param item The item `redact` gave.
 * @returns The {@link RedactedJson}, which `JSON.stringify` writes without loss and
 *   {@link decodeRedacted} reads back to `item`, or {@link InvalidRedacted} at stage `encode`
 *   naming a field that does not fit.
 */
export const encodeRedacted = (item: Redacted): Result.Result<RedactedJson, InvalidRedacted> =>
  Result.mapError(
    Schema.encodeResult(RedactedSchema)(item),
    (schemaError) => new InvalidRedacted({ issue: schemaError.message, stage: "encode" }),
  );

/**
 * The most levels of arrays and objects the JSON form may nest, the outermost value counted as
 * the first.
 *
 * `encodeRedacted` never writes more than 511 levels for an item `redact` produced. The reader
 * opens at most 256 elements at once (`ELEMENT_DEPTH` in `@qti-pie/crust/read.ts`), so at most 254
 * nest below `qti-item-body`; each adds at most two levels to the outermost object's one, the array
 * that holds it and its own object, and a run of text or an attribute inside the deepest adds two
 * more. Schema's decode recurses through every level and overflows Node's default stack from about
 * 1,540 levels, on a chain of `span`s in a fresh process. The bound sits between, about twice the
 * deepest item, so a body shape that spends four levels per element still fits.
 */
const maximumDepth = 1024;

/**
 * Tell whether a value nests arrays and objects more than {@link maximumDepth} levels deep,
 * measured with a list of pending values rather than by recursion, so the measure cannot overflow
 * the stack it guards, and stopping at the first value past the bound, so a cycle ends it too.
 *
 * It follows own enumerable properties, the only ones plain JSON data has. The Schema reads
 * inherited and non-enumerable ones too, so a live object can hide a deep field from this measure;
 * {@link decodeRedacted} refuses whatever such a field makes the Schema throw.
 *
 * @param input The value as the host handed it over.
 * @returns Whether some array or object in it sits more than `maximumDepth` levels down.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The JSON form arrives from the host as any value, and this measures it before the Schema reads it.
const nestsTooDeep = (input: unknown): boolean => {
  const pending: { readonly depth: number; readonly value: unknown }[] = [
    { depth: 1, value: input },
  ];

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (Predicate.isObjectOrArray(next.value)) {
      if (next.depth > maximumDepth) {
        return true;
      }

      for (const value of Object.values(next.value)) {
        pending.push({ depth: next.depth + 1, value });
      }
    }
  }

  return false;
};

/**
 * A body node waiting to be walked, with the content it sits in when QTI's schema admits no
 * interaction there, a Prompt or a choice's content, and none elsewhere.
 */
interface PendingNode {
  readonly node: BodyNode;
  readonly within: Option.Option<string>;
}

/**
 * Find the first interaction, in document order, that the body holds inside a Choice's Prompt or a
 * choice's content, or inside an Extended Text's Prompt: content where QTI's schema admits no
 * interaction, and where `render` throws `NestedInteractionDefect` on one.
 *
 * It walks with a list of pending nodes rather than by recursion, as {@link nestsTooDeep} does, so
 * no body the depth bound lets through can overflow the stack.
 *
 * @param body The body the Schema decoded.
 * @returns What the interaction is and where it sits, or none when the body holds none there.
 */
const misplacedInteraction = (body: readonly BodyNode[]): Option.Option<string> => {
  const pending: PendingNode[] = [];
  const enqueue = (nodes: readonly BodyNode[], within: Option.Option<string>): void => {
    for (const node of nodes.toReversed()) {
      pending.push({ node, within });
    }
  };

  enqueue(body, Option.none());
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const { node, within } = next;

    if (node.kind === "element") {
      enqueue(node.children, within);
    } else if (
      node.kind === "choice" ||
      node.kind === "extended-text" ||
      node.kind === "text-entry"
    ) {
      if (Option.isSome(within)) {
        return Option.some(
          `a ${node.kind} interaction for the response ${JSON.stringify(node.response)} sits inside ${within.value}, where QTI's schema admits no interaction and render cannot emit one`,
        );
      }

      const owner = `the ${node.kind} interaction for the response ${JSON.stringify(node.response)}`;
      if (node.kind === "choice") {
        for (const simple of node.choices.toReversed()) {
          enqueue(
            simple.content,
            Option.some(
              `the content of the choice ${JSON.stringify(simple.identifier)} of ${owner}`,
            ),
          );
        }
      }

      if (node.kind !== "text-entry" && Option.isSome(node.prompt)) {
        enqueue(node.prompt.value, Option.some(`the Prompt of ${owner}`));
      }
    }
  }

  return Option.none();
};

/**
 * Measure the input's depth, check it against {@link RedactedSchema}, then walk its body for an
 * interaction `render` cannot emit; the first two may throw on a live object, which
 * {@link decodeRedacted} refuses.
 *
 * @param input The JSON form as the host handed it over.
 * @returns The redacted item, or {@link InvalidRedacted} at stage `decode`.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The JSON form arrives from the host as any value, and this is the check that parses it.
const decodeJson = (input: unknown): Result.Result<Redacted, InvalidRedacted> =>
  nestsTooDeep(input)
    ? Result.fail(
        new InvalidRedacted({
          issue: `it nests arrays and objects more than ${String(maximumDepth)} levels deep, deeper than encodeRedacted writes for any item the reader accepts`,
          stage: "decode",
        }),
      )
    : Result.flatMap(
        Result.mapError(
          Schema.decodeUnknownResult(RedactedSchema)(input),
          (schemaError) => new InvalidRedacted({ issue: schemaError.message, stage: "decode" }),
        ),
        (fields: RedactedFields) =>
          Option.match(misplacedInteraction(fields.body), {
            onNone: () => Result.succeed(brandRedacted(fields)),
            onSome: (issue) => Result.fail(new InvalidRedacted({ issue, stage: "decode" })),
          }),
      );

/**
 * Check the JSON form of a redacted item and make the {@link Redacted} `render` takes. It never
 * throws, whatever it is handed.
 *
 * It checks the JSON's shape, every field against {@link RedactedSchema}, and one rule of the
 * body's content: no interaction stands, at any depth, inside a Choice's Prompt or a choice's
 * content or inside an Extended Text's Prompt, where QTI's schema admits none and `render` cannot
 * emit one, so `render` never meets such an interaction in a `Redacted` it returns. It checks the
 * item against no other rule of QTI's, so a host trusts redacted JSON only as far as the item it
 * came from; the emitter still keeps only the HTML subset's elements and attributes, and the URLs
 * `url.ts` keeps.
 *
 * @param input The JSON form as the host handed it over: the {@link RedactedJson}
 *   {@link encodeRedacted} wrote, after any JSON round trip. A count written as a JSON number is
 *   refused, and so is input that nests arrays and objects more than {@link maximumDepth} levels
 *   deep, which no item the reader accepts reaches. So is a live object that throws when read,
 *   such as one hiding a deep field in its prototype or a non-enumerable property, or holding a
 *   getter that throws; plain JSON data never does.
 * @returns The redacted item, branded only after every field passed {@link RedactedSchema} and its
 *   body held no interaction where `render` cannot emit one, or {@link InvalidRedacted} at stage
 *   `decode` naming what does not fit.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The JSON form arrives from the host as any value, and this is the check that parses it.
export const decodeRedacted = (input: unknown): Result.Result<Redacted, InvalidRedacted> =>
  Result.flatMap(
    Result.try({
      catch: (thrown) =>
        new InvalidRedacted({
          issue: `reading it threw ${Predicate.isError(thrown) ? `${thrown.name}: ${thrown.message}` : "a value that is not an Error"}, which plain JSON data never does`,
          stage: "decode",
        }),
      try: () => decodeJson(input),
    }),
    (decoded) => decoded,
  );
