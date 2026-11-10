/**
 * Rubric Block (I-11): an item body's `qti-rubric-block`, read, redacted, copied, coded and
 * written as one `div` for the views its `view` names, and for no other.
 *
 * The block is shown only to the views its `view` list names (reading 65: "Each block is shown
 * only to the views its `view` names"): the redaction keeps it when the view the item is shown to
 * is among them and drops it otherwise, withholding its content, so a scorer's rubric is in neither
 * a candidate's HTML nor the redacted copy a host sends to a page. The item is shown to the
 * candidate's view when the host names none, so a candidate render holds no scorer, proctor,
 * tutor, author or test-constructor rubric. A block the view names is placed in document order,
 * where it stands in the body, whatever its `use`; a block that carries
 * `qti-rubric-discretionary-placement` is placed there too, since the class gives the delivery
 * leave to place the block for its view actors elsewhere and does not oblige it.
 *
 * A rubric's `qti-stylesheet` and `qti-catalog-info` children are read past: each is recorded as a
 * mark on the verdict and renders nothing, since a rubric's stylesheet is issue m5-06's and its
 * catalog issue m3e-04's. Issue m3e-01 lands this module; a test's, a test part's or a section's
 * rubric is issue m3e-01b's.
 *
 * This is a browser module: `payload.ts` and the emitter reach it, so it value-imports from
 * `effect` only `Option` and `Result` (ruling OD-6).
 *
 * @module
 */
import { Option, Result } from "effect";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import type { BodyContentModule } from "#plate/content/contract.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes } from "#plate/emit/node.ts";
import type { BodyNode } from "#plate/model/item.ts";
import type { PayloadNode } from "#plate/payload.ts";

/**
 * The QTI element Rubric Block is read from.
 */
const element = "qti-rubric-block";

/**
 * A run of the white space an XSD list's tokens are separated by, which XML allows as a space, a
 * tab, a carriage return or a line feed.
 */
const separators = /[\t\n\r ]+/u;

/**
 * A rubric block in the item body (I-11): the content of its `qti-content-body` in document order,
 * its `use` as written, the views its `view` names as written, and its `xml:lang`. The redaction
 * keeps the node only for a view among its `views`.
 *
 * Its `qti-stylesheet` and `qti-catalog-info` children are not in the node: they are read past and
 * recorded as marks on the verdict.
 */
export interface RubricBlock {
  /**
   * The body nodes of the block's `qti-content-body`: flow content, printed variables and template
   * content, which hold no interaction.
   */
  readonly content: readonly BodyNode[];
  /**
   * The block's `xml:lang` as written, none when the block carries none.
   */
  readonly lang: Option.Option<string>;
  /**
   * The block's `use` as written: `instructions`, `scoring`, `navigation` or an `ext:` name.
   */
  readonly use: string;
  /**
   * The views the block's `view` lists, as written and in order: each of `author`, `candidate`,
   * `proctor`, `scorer`, `testConstructor` and `tutor` the block is shown to.
   */
  readonly views: readonly string[];
}

/**
 * The payload node of a rubric block (I-11): what {@link RubricBlock} gives the page, its content
 * copied into payload nodes, which the render writes through the kit and the heading shift reads.
 */
export interface RubricBlockPayload {
  /**
   * The block's `xml:lang`, which the render writes as `lang`.
   */
  readonly lang: Option.Option<string>;
  /**
   * The block's content as payload nodes, in document order.
   */
  readonly nodes: readonly PayloadNode[];
  /**
   * The block's `use` as written, which the render writes as `data-use`.
   */
  readonly use: string;
  /**
   * The views the block names, which the render writes as `data-view`.
   */
  readonly views: readonly string[];
}

/**
 * The JSON form of a {@link RubricBlock} in a redacted item (I-11): its content through the body's
 * codec, its `lang` an optional key absent when the block has none, its `use` and `views` as
 * written. It holds no path, as no body node does.
 */
export interface RubricBlockJson {
  readonly content: RedactedJson["body"];
  readonly lang?: string;
  readonly use: string;
  readonly views: readonly string[];
}

/**
 * Give the attributes a block's `xml:lang` adds to its `div`: `lang` when the block wrote
 * `xml:lang`, none otherwise.
 *
 * @param lang The block's `xml:lang`.
 * @returns The attributes to write beside the block's `data-use` and `data-view`.
 */
const langAttributes = (lang: Option.Option<string>): Attributes =>
  Option.match(lang, { onNone: () => ({}), onSome: (written) => ({ lang: written }) });

/**
 * The Rubric Block module (I-11, issue m3e-01).
 *
 * It reads a `qti-rubric-block` of the item body into a {@link RubricBlock}, keeps it in the
 * redacted item only for the views its `view` names, and writes it as a `div` that carries
 * `data-use` and `data-view` as written and `lang` when the block wrote `xml:lang`, holding its
 * content in document order. A rubric block in another block's content body stands where it is
 * written.
 */
export const rubricModule: BodyContentModule<
  typeof element,
  RubricBlock,
  RubricBlockPayload,
  RubricBlockJson
> = {
  /**
   * Give the payload nodes the render writes as the block's content, which the heading shift reads
   * as it reads a Prompt's, so a heading in a rubric shifts with the body's.
   *
   * @param payload The block's payload node.
   * @returns Its content, in document order.
   */
  content: (payload) => payload.nodes,
  /**
   * Copy a block the redaction kept into the payload node the page may know, its content through
   * the payload's copy of body nodes.
   *
   * @param node The block the redaction kept.
   * @param kit The payload's copy of body nodes.
   * @returns The block's payload node.
   */
  copy: (node, kit) => ({
    lang: node.lang,
    nodes: kit.nodes(node.content),
    use: node.use,
    views: node.views,
  }),
  element,
  feature: ["I-11"],
  /**
   * True: the module reads, redacts, codes and writes the element.
   */
  implemented: true,
  namespace: qtiNamespace,
  /**
   * Read a `qti-rubric-block` into its {@link RubricBlock}: the required `use` and `view`, its
   * `xml:lang`, and the children of its `qti-content-body` as body nodes. Its `qti-stylesheet` and
   * `qti-catalog-info` children are recorded as marks in document order, as the verdict names them,
   * and read no further.
   *
   * @param source The `qti-rubric-block` element.
   * @param context The body walk's context, whose reader kit reads the element and records its
   *   marks.
   * @returns The block, or the refusal of a missing `use` or `view`, or of its content.
   */
  parse: (source, context) =>
    Result.gen(function* parseRubric() {
      const { read } = context;
      const use = yield* read.requiredValue(source, "use");
      const view = yield* read.requiredValue(source, "view");

      read.markElement(source);
      for (const stylesheet of read.childrenNamed(source, "qti-stylesheet")) {
        read.mark(stylesheet, read.nameOf(stylesheet));
      }

      const content = yield* read.content(source, "qti-content-body");

      for (const catalog of read.childrenNamed(source, "qti-catalog-info")) {
        read.mark(catalog, read.nameOf(catalog));
      }

      return {
        content: Option.getOrElse(content, () => []),
        lang: read.valueOf(source, "xml:lang"),
        use,
        views: view.split(separators).filter((token) => token !== ""),
      };
    }),
  /**
   * Give the codec of a block in the JSON form: its content through the body's recursive codec, its
   * `lang` an optional key, its `use` and `views` as written.
   *
   * @param kit The codec's Schema and the body's recursive codec.
   * @returns The block's codec.
   */
  payloadSchema: ({ BodyNodes, OptionalText, Schema }) =>
    Schema.Struct({
      content: BodyNodes,
      lang: OptionalText,
      use: Schema.String,
      views: Schema.Array(Schema.String),
    }),
  placement: "body",
  /**
   * Decide what the redacted item keeps of a block: the block, its content walked through the kit,
   * when the view the item is shown to is among the views the block names; otherwise none, the
   * content withheld through the kit, so a view the block does not name never receives its content,
   * and a printed variable, template content or notice inside it is still reached.
   *
   * @param node The block.
   * @param kit The redaction's walk and the view the item is shown to.
   * @returns The block kept for the view, or none.
   */
  redact: (node, kit) => {
    if (node.views.includes(kit.view)) {
      return Option.some({ ...node, content: kit.nodes(node.content) });
    }

    kit.withhold(node.content);

    return Option.none();
  },
  /**
   * Write a block as one `div` holding its content, emitted through the kit with the body's id
   * scoping, heading shift, URLs and Notice part: `data-use` and `data-view` as written, space
   * separated, and `lang` when the block wrote `xml:lang`. The `div` carries no other attribute, no
   * part marker and no class.
   *
   * @param payload The block's payload node.
   * @param _state The emit state, which the block does not read.
   * @param kit The emission of the block's content.
   * @returns The `div`, or the refusal of a part swap in its content.
   */
  render: (payload, _state, kit) =>
    Result.map(kit.nodes(payload.nodes), (nodes) =>
      h(
        "div",
        {
          "data-use": payload.use,
          "data-view": payload.views.join(" "),
          ...langAttributes(payload.lang),
        },
        nodes,
      ),
    ),
};
