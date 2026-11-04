/**
 * The HTML elements of the model's first milestone: the paragraph and the image.
 *
 * The HTML and QTI base attribute families are not modeled: a document carrying one is refused as
 * unmodeled vocabulary. The arms' containments into `Node` are bound by one `mirrors` per handle in
 * the composed schema, not written here.
 */
import { contained, on, relation, str, uuid } from "@bjornpagen/grizzle";
import { EmbedSourceUri, LongDescriptionUri } from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * A `p` element.
 */
export const P = relation("P", { id: uuid }, ["id"]);

/**
 * An `img` element.
 *
 * `alt` is an `xs:string` attribute whose whitespace is preserved, so its column holds a tab a
 * character reference carries; `src` is judged on the collapsed value.
 */
export const Img = relation(
  "Img",
  {
    alt: str.regex(patterns.xsString, patterns.xsStringFlags),
    id: uuid,
    src: EmbedSourceUri,
  },
  ["id"],
);

/**
 * An image's `longdesc`, when written.
 */
export const ImgLongdesc = relation("ImgLongdesc", { node: uuid, value: LongDescriptionUri }, [
  "node",
]);

/**
 * An image's `height`, when written.
 */
export const ImgHeight = relation(
  "ImgHeight",
  { node: uuid, value: str.regex(patterns.lengthDType) },
  ["node"],
);

/**
 * An image's `width`, when written.
 */
export const ImgWidth = relation(
  "ImgWidth",
  { node: uuid, value: str.regex(patterns.lengthDType) },
  ["node"],
);

/**
 * The HTML kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = { img: Img, p: P };

/**
 * The relations of this module, as schema members.
 */
export const relations = { Img, ImgHeight, ImgLongdesc, ImgWidth, P };

/**
 * The statements over this module's relations: an optional image value belongs to an image.
 */
export const rules = [
  contained(on(ImgLongdesc, "node"), on(Img, "id")),
  contained(on(ImgHeight, "node"), on(Img, "id")),
  contained(on(ImgWidth, "node"), on(Img, "id")),
] as const;
