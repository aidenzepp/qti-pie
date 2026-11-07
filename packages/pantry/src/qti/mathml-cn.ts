/**
 * The MathML cn laws (spec reading 2, MathML 3 validity): the law "MathML cn form", stated over
 * the `m:cn` elements of Content MathML.
 *
 * The content of a `cn` has the form its `type` implies (MathML 3 §4.2.1): the parts a `type`
 * lists, split at `m:sep`, each in the lexical space of its form, its digits read in the `cn`'s
 * `base`. `#pantry/grammar/install.ts` holds what the type implies, {@link CnParts} (how many
 * parts) and {@link CnForm} (the form of each), and what a form allows, {@link CnPattern} (by form
 * and base). The importer refused none of it before: only the law oracle judged it.
 *
 * - **{@link MathCn}**, one row per judged `m:cn`, keyed by its node: the `type` and `base` it is
 *   judged under, each with the lexical form of the attribute that gave it (empty where the `cn`
 *   writes none, so `real` and `10`), and `parts`, the count of its {@link CnPartText} rows. A `cn`
 *   whose `type` {@link CnType} does not list, or whose `base` {@link CnBase} does not list, has no
 *   row, so it is not judged: its content is text, or its digits are application specific.
 * - **{@link CnPartText}**, one row per part of a judged `cn`, keyed by `(node, part)` (named apart
 *   from the roster {@link CnPart} of the places a part takes, which `install.ts` holds): the
 *   `type` and `base` of its `cn`, the part's collapsed `text` (MathML 3 §2.1.7) and its `form`. A
 *   part that holds an element or an entity reference is not judged, so a `cn` with one has no
 *   rows.
 *
 * `MathML_cn_form` is the law's check over {@link CnPartText}: the text lies in the lexical space
 * of its form in its base. Every other statement is a restatement of the tree, "E1 derived"; the
 * check is named by its law, as `#pantry/qti/expressions.ts` names `Literal_lexical`.
 *
 * The count of parts is the family: the rows of a `cn` are counted by `MathCn.parts`, which
 * {@link CnParts} fixes for the type, and each row's `(type, part, form)` is in {@link CnForm},
 * whose `part` takes only the slots 0 to its count less one, so the rows of a `cn` are exactly its
 * type's slots, each once (the rows' key), and one part of a `rational` is refused. A part beyond
 * the type's places is written at the place no type lists and refused, so three parts of a
 * `rational` are refused as one is.
 *
 * @see {@link https://www.w3.org/TR/MathML3/chapter4.html#contm.cn | MathML 3 §4.2.1, Numbers}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  key,
  natural,
  on,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import {
  AttributeName,
  CnBase,
  CnForm,
  CnPart,
  CnPartForm,
  CnParts,
  CnPattern,
  CnType,
} from "#pantry/grammar/install.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Node } from "#pantry/qti/node.ts";

/**
 * What spells each `type` a {@link MathCn} row is judged under, as a pattern over the attribute's
 * raw value: the type's name, in XML whitespace (MathML 3 §2.1.7). A literal for each handle, since
 * a pattern in a check is a literal source; the test holds each to the name its handle spells.
 */
export const typeSpellings = [
  ["complex-cartesian", "^[ \\t\\n\\r]*complex-cartesian[ \\t\\n\\r]*$"],
  ["complex-polar", "^[ \\t\\n\\r]*complex-polar[ \\t\\n\\r]*$"],
  ["double", "^[ \\t\\n\\r]*double[ \\t\\n\\r]*$"],
  ["e-notation", "^[ \\t\\n\\r]*e-notation[ \\t\\n\\r]*$"],
  ["hexdouble", "^[ \\t\\n\\r]*hexdouble[ \\t\\n\\r]*$"],
  ["integer", "^[ \\t\\n\\r]*integer[ \\t\\n\\r]*$"],
  ["rational", "^[ \\t\\n\\r]*rational[ \\t\\n\\r]*$"],
  ["real", "^[ \\t\\n\\r]*real[ \\t\\n\\r]*$"],
] as const;

/**
 * What spells each `base` a {@link MathCn} row is judged under: the numeral with any leading zeros,
 * in XML whitespace, `cn/@base` being a positive integer (reading 2). A literal for each handle,
 * as {@link typeSpellings}.
 */
export const baseSpellings = [
  ["2", "^[ \\t\\n\\r]*0*2[ \\t\\n\\r]*$"],
  ["3", "^[ \\t\\n\\r]*0*3[ \\t\\n\\r]*$"],
  ["4", "^[ \\t\\n\\r]*0*4[ \\t\\n\\r]*$"],
  ["5", "^[ \\t\\n\\r]*0*5[ \\t\\n\\r]*$"],
  ["6", "^[ \\t\\n\\r]*0*6[ \\t\\n\\r]*$"],
  ["7", "^[ \\t\\n\\r]*0*7[ \\t\\n\\r]*$"],
  ["8", "^[ \\t\\n\\r]*0*8[ \\t\\n\\r]*$"],
  ["9", "^[ \\t\\n\\r]*0*9[ \\t\\n\\r]*$"],
  ["10", "^[ \\t\\n\\r]*0*10[ \\t\\n\\r]*$"],
  ["11", "^[ \\t\\n\\r]*0*11[ \\t\\n\\r]*$"],
  ["12", "^[ \\t\\n\\r]*0*12[ \\t\\n\\r]*$"],
  ["13", "^[ \\t\\n\\r]*0*13[ \\t\\n\\r]*$"],
  ["14", "^[ \\t\\n\\r]*0*14[ \\t\\n\\r]*$"],
  ["15", "^[ \\t\\n\\r]*0*15[ \\t\\n\\r]*$"],
  ["16", "^[ \\t\\n\\r]*0*16[ \\t\\n\\r]*$"],
  ["17", "^[ \\t\\n\\r]*0*17[ \\t\\n\\r]*$"],
  ["18", "^[ \\t\\n\\r]*0*18[ \\t\\n\\r]*$"],
  ["19", "^[ \\t\\n\\r]*0*19[ \\t\\n\\r]*$"],
  ["20", "^[ \\t\\n\\r]*0*20[ \\t\\n\\r]*$"],
  ["21", "^[ \\t\\n\\r]*0*21[ \\t\\n\\r]*$"],
  ["22", "^[ \\t\\n\\r]*0*22[ \\t\\n\\r]*$"],
  ["23", "^[ \\t\\n\\r]*0*23[ \\t\\n\\r]*$"],
  ["24", "^[ \\t\\n\\r]*0*24[ \\t\\n\\r]*$"],
  ["25", "^[ \\t\\n\\r]*0*25[ \\t\\n\\r]*$"],
  ["26", "^[ \\t\\n\\r]*0*26[ \\t\\n\\r]*$"],
  ["27", "^[ \\t\\n\\r]*0*27[ \\t\\n\\r]*$"],
  ["28", "^[ \\t\\n\\r]*0*28[ \\t\\n\\r]*$"],
  ["29", "^[ \\t\\n\\r]*0*29[ \\t\\n\\r]*$"],
  ["30", "^[ \\t\\n\\r]*0*30[ \\t\\n\\r]*$"],
  ["31", "^[ \\t\\n\\r]*0*31[ \\t\\n\\r]*$"],
  ["32", "^[ \\t\\n\\r]*0*32[ \\t\\n\\r]*$"],
  ["33", "^[ \\t\\n\\r]*0*33[ \\t\\n\\r]*$"],
  ["34", "^[ \\t\\n\\r]*0*34[ \\t\\n\\r]*$"],
  ["35", "^[ \\t\\n\\r]*0*35[ \\t\\n\\r]*$"],
  ["36", "^[ \\t\\n\\r]*0*36[ \\t\\n\\r]*$"],
] as const;

/**
 * One judged `m:cn`, keyed by its node.
 *
 * - **the host's:** `node`, proved by containment to be an `m:cn`; `type` and `base`, the handles the
 *   `cn` is judged under, and `typeLexical` and `baseLexical`, the lexical forms of the attributes
 *   that gave them, each empty where the `cn` writes none; proved by containment and by
 *   `E1_derived`;
 * - **drawn:** `parts`, the count of its {@link CnPartText} rows.
 *
 * Its fields are declared in key order, which the lint's `sort-keys` holds and which is column
 * order.
 */
export const MathCn = relation(
  "MathCn",
  {
    base: closedId(CnBase),
    baseLexical: keyText,
    node: uuid,
    parts: drawn(natural),
    type: closedId(CnType),
    typeLexical: keyText,
  },
  ["node"],
);

/**
 * One part of a judged `m:cn`'s content, keyed by its node and its place among the parts `m:sep`
 * separates: the `type` and `base` of its `cn`, the part's collapsed `text` and the `form` of its
 * place. A part beyond its type's places sits at the place no type lists, so it is refused.
 */
export const CnPartText = relation(
  "CnPartText",
  {
    base: closedId(CnBase),
    form: closedId(CnPartForm),
    node: uuid,
    part: closedId(CnPart),
    text: keyText,
    type: closedId(CnType),
  },
  ["node", "part"],
);

/**
 * One `type` or `base` attribute of an `m:cn`, keyed by its node and its name: its lexical form as
 * written, whether or not the `cn` is judged, copied so that a law can compare it in a key. A value
 * over `keyText`'s bound is refused under "Key text bound", a stated limit, as the
 * `InteractionAttribute` copies and `MathDir` are (`#pantry/qti/interactions.ts`,
 * `#pantry/qti/mathml-align.ts`); the schemas enumerate `type` and `base` only for the values a
 * `cn` is judged under, so a `cn` whose `type` is a word the bound excludes is refused too.
 */
export const CnAttribute = relation(
  "CnAttribute",
  { lexical: keyText, name: closedId(AttributeName), node: uuid },
  ["node", "name"],
);

/**
 * The relations the cn laws declare, each under its own name, as `#pantry/qti/schema.ts` composes
 * them.
 */
export const cnRelations = { CnAttribute, CnPartText, MathCn };

/**
 * The `m:cn` nodes, each of which may hold a {@link MathCn} row.
 */
const cnNodes = select(Node, (n) => n.eq(n.kind, "m:cn"));

/**
 * The `type` and `base` attributes of an `m:cn`.
 */
const cnAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "m:cn"), a.in(a.name, ["type", "base"])),
);

/**
 * The {@link MathCn} rows of a `cn` that writes a `type`.
 */
const typedCns = select(MathCn, (c) => c.ne(c.typeLexical, ""));

/**
 * The {@link MathCn} rows of a `cn` that writes a `base`.
 */
const basedCns = select(MathCn, (c) => c.ne(c.baseLexical, ""));

/**
 * The family of a `cn`'s parts, counted by `MathCn.parts`.
 */
export const partFamily = counted(on(CnPartText, "node"), fin(MathCn, "parts"));

/**
 * The statements over {@link CnAttribute}, {@link MathCn} and {@link CnPartText}, each `check`
 * named by its law:
 *
 * - **the attributes:** a {@link CnAttribute} row for each `type` and `base` of an `m:cn` and no
 *   other (both ways), its lexical form the attribute's;
 * - **the cn:** each row's node an `m:cn`; where it writes a `type` or a `base`, the lexical form is
 *   that of the node's {@link CnAttribute} row, and the handle is the one the form spells (`real`
 *   and `10` where none is written, `E1_derived`); its `parts` the count {@link CnParts} gives its
 *   type;
 * - **the parts:** the family, counted by `MathCn.parts`; each row's `type` and `base` those of its
 *   `cn`, and its `(type, part, form)` a row of {@link CnForm}, so a place beyond the type's parts
 *   is refused;
 * - **`MathML_cn_form`:** each part's text matches the pattern of its form in its base.
 */
export const cnLaws = [
  contained(on(MathCn, "node"), on(cnNodes, "id")),
  key(on(cnAttributes, "node", "name")),
  contained(
    on(cnAttributes, "node", "name", "lexical"),
    on(CnAttribute, "node", "name", "lexical"),
  ),
  contained(on(CnAttribute, "node", "name"), on(cnAttributes, "node", "name")),
  contained(
    on(typedCns, "node", "typeLexical"),
    on(
      select(CnAttribute, (a) => a.eq(a.name, "type")),
      "node",
      "lexical",
    ),
  ),
  contained(
    on(basedCns, "node", "baseLexical"),
    on(
      select(CnAttribute, (a) => a.eq(a.name, "base")),
      "node",
      "lexical",
    ),
  ),
  contained(on(MathCn, "type", "parts"), on(CnParts, "type", "parts")),
  check("E1_derived", MathCn, (c) =>
    c.and(
      c.or(
        c.and(c.eq(c.typeLexical, ""), c.eq(c.type, "real")),
        ...typeSpellings.map(([type, spelling]) =>
          c.and(c.eq(c.type, type), Compute.matches(c.typeLexical, spelling)),
        ),
      ),
      c.or(
        c.and(c.eq(c.baseLexical, ""), c.eq(c.base, "10")),
        ...baseSpellings.map(([base, spelling]) =>
          c.and(c.eq(c.base, base), Compute.matches(c.baseLexical, spelling)),
        ),
      ),
    ),
  ),

  partFamily,
  contained(on(CnPartText, "node", "type", "base"), on(MathCn, "node", "type", "base")),
  contained(on(CnPartText, "type", "part", "form"), on(CnForm, "type", "part", "form")),
  check("MathML_cn_form", CnPartText, (p) =>
    Compute.matches(p.text, CnPattern.at("pattern", p.form, p.base)),
  ),
];
