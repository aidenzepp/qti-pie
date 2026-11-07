import { Effect, Option } from "effect";
import { SaxesParser } from "saxes";
import type { SaxesAttributeNS } from "saxes";
import { decode } from "#crust/decode.ts";
import type { Decoded } from "#crust/decode.ts";
import { NAME_CHAR, NAME_START, lexProlog, substitute } from "#crust/dtd.ts";
import type { AttlistEntry, Prolog, Substituted } from "#crust/dtd.ts";
import { ReaderRefusal, WellFormednessError } from "#crust/errors.ts";
import { rebuild } from "#crust/rebuild.ts";
import { SENTINEL_FIRST, SENTINEL_LAST, sentinelsWritten } from "#crust/sentinels.ts";
import type {
  Attribute,
  AttributeReference,
  Child,
  Element,
  EntityRef,
  Misc,
  XmlDocument,
} from "#crust/tree.ts";

/**
 * An element whose start tag has been read and whose end tag has not.
 */
interface OpenElement {
  readonly attributes: readonly Attribute[];
  /**
   * Every namespace binding in scope at the element, its own declarations included, from prefix
   * to namespace name.
   */
  readonly bindings: Readonly<Record<string, string>>;
  readonly children: Child[];
  readonly local: string;
  readonly namespace: string;
  readonly prefix: string;
  readonly qname: string;
}

/**
 * What `parse` builds: the root element and the comments and processing instructions around it.
 */
interface Built {
  readonly epilog: readonly Misc[];
  readonly prolog: readonly Misc[];
  readonly root: Element;
}

/**
 * What the undeclared-reference scan stops at, in document order: a comment, a processing
 * instruction or a CDATA section (skipped whole), a character reference (its value group), or a
 * general entity reference (its name group).
 */
const SCAN = new RegExp(
  String.raw`<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|&#(?:x(?<hex>[0-9A-Fa-f]+)|(?<decimal>[0-9]+));|&(?<name>[${NAME_START}][${NAME_CHAR}]*);`,
  "gu",
);

/**
 * The five entities every XML processor knows (XML 1.0 section 4.6).
 */
const PREDEFINED: ReadonlySet<string> = new Set(["lt", "gt", "amp", "apos", "quot"]);

/**
 * The undeclared entity names the body references, in order of first use, and the code points the
 * body already holds in the sentinel range, whether written out or named by a character reference.
 */
interface Scanned {
  readonly names: readonly string[];
  readonly used: ReadonlySet<number>;
}

/**
 * Scan the body of `substituted` (everything from `bodyStart`) for references to entities that are
 * neither predefined nor declared.
 */
const scanReferences = (body: string, declared: ReadonlyMap<string, string>): Scanned => {
  const names = new Set<string>();
  const used = sentinelsWritten(body);
  for (const match of body.matchAll(SCAN)) {
    const { decimal, hex, name } = match.groups ?? {};
    if (name !== undefined && !PREDEFINED.has(name) && !declared.has(name)) {
      names.add(name);
    } else if (hex !== undefined || decimal !== undefined) {
      used.add(hex === undefined ? Number(decimal) : Number.parseInt(hex, 16));
    }
  }

  return { names: [...names], used };
};

/**
 * The refusal for a reference to an entity the document never declares and has nowhere to declare.
 */
const undeclared = (name: string, why: string): ReaderRefusal =>
  new ReaderRefusal({
    detail: `the entity "${name}" is referenced but not declared, and ${why}, so no declaration can exist (XML 1.0 section 4.1, Entity Declared).`,
    rule: "undeclared-entity",
  });

/**
 * Give each undeclared entity name in the body a stand-in character, or refuse.
 *
 * A document that is `standalone="yes"` or has no external subset declares every entity it may use
 * in its own prolog, so an undeclared reference is a well-formedness error and is refused naming
 * the entity. Otherwise the declaration may sit in the external subset, which is never read: the
 * name gets a private use character that occurs nowhere in the document, and the parser appends it
 * as plain text.
 *
 * @returns The stand-in character of each name; the map is empty when the body has no such
 *   reference.
 */
const assignSentinels = (
  substituted: Substituted,
  prolog: Prolog,
): Effect.Effect<ReadonlyMap<string, string>, ReaderRefusal> =>
  Effect.suspend(() => {
    const scanned = scanReferences(substituted.body.slice(prolog.bodyStart), prolog.entities);
    const [firstName] = scanned.names;
    if (firstName === undefined) {
      return Effect.succeed(new Map<string, string>());
    }

    if (prolog.standalone) {
      return Effect.fail(undeclared(firstName, 'the document says standalone="yes"'));
    }

    if (!prolog.externalSubset) {
      return Effect.fail(undeclared(firstName, "the document has no external subset"));
    }

    const sentinels = new Map<string, string>();
    let point = SENTINEL_FIRST;
    for (const name of scanned.names) {
      while (point <= SENTINEL_LAST && scanned.used.has(point)) {
        point += 1;
      }

      if (point > SENTINEL_LAST) {
        return Effect.fail(
          undeclared(name, "the document leaves no private use character free to stand for it"),
        );
      }

      sentinels.set(name, String.fromCodePoint(point));
      point += 1;
    }

    return Effect.succeed(sentinels);
  });

/**
 * The UTF-16 index in `text` of the code point at `position`, which `saxes` counts in code points.
 */
const utf16Offset = (text: string, position: number): number => {
  let index = 0;
  for (let seen = 0; seen < position && index < text.length; seen += 1) {
    index += (text.codePointAt(index) ?? 0) > 0xff_ff ? 2 : 1;
  }

  return index;
};

/**
 * The tree attribute for one `saxes` attribute; its value is the parser's, with no references.
 */
const toAttribute = (attribute: SaxesAttributeNS): Attribute => ({
  local: attribute.local,
  namespace: attribute.uri,
  prefix: attribute.prefix,
  qname: attribute.name,
  references: [],
  value: attribute.value,
});

/**
 * The tree element for a closed element and the children collected for it.
 */
const toElement = (open: OpenElement): Element => ({
  attributes: open.attributes,
  children: open.children,
  kind: "element",
  local: open.local,
  namespace: open.namespace,
  prefix: open.prefix,
  qname: open.qname,
});

/**
 * The most elements a document may hold open at once unless its reader says otherwise: `xmllint`'s
 * default depth limit.
 */
export const defaultElementDepth = 256;

/**
 * How {@link readXml} reads a document.
 */
export interface ReadOptions {
  /**
   * The most elements open at once before the document is refused under rule `element-depth`:
   * {@link defaultElementDepth} when absent, and `Number.POSITIVE_INFINITY` for a document of any
   * depth.
   */
  readonly elementDepth?: number;
}

/**
 * The namespace bindings in scope above the root element: the `xml` and `xmlns` prefixes, bound by
 * definition (Namespaces in XML 1.0, section 3), and the empty default, which names no namespace
 * until a declaration gives it one.
 */
const ROOT_BINDINGS = {
  "": "",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
} as const;

/**
 * Run `saxes` over `substituted.body` and build the root element with the comments and processing
 * instructions around it.
 *
 * `saxes` throws its first well-formedness error; that error becomes a `WellFormednessError` at
 * the position the parser had reached. A document that nests more than `elementDepth` elements is
 * refused with a `ReaderRefusal` under rule `element-depth`. The tree is built on a stack of open
 * elements, so a document of any depth within that bound is read without recursion.
 *
 * Each start tag's `ns` record is seeded with every binding in scope, its parent's whole record,
 * before `saxes` reads the tag's attributes. `saxes` resolves a prefix by looking in the open tag's
 * own record, then in every open ancestor's from the innermost out, then in its root record
 * (`SaxesParser.resolve`), so unseeded, a prefix the tag does not itself declare, the empty
 * default included, costs a walk over every open element, and reading costs the square of the
 * depth. Seeded, the tag's own record answers every lookup with the name the walk would find,
 * because `saxes` writes the tag's own declarations into that record after the seed, overriding
 * the inherited ones. A prefix bound nowhere is in no record, and `saxes` refuses it as unbound.
 *
 * @param substituted - The document text with its declared entities substituted.
 * @param sentinels - The stand-in character of each undeclared entity name.
 * @param elementDepth - The most elements open at once.
 * @returns The root element and the comments and processing instructions around it, the
 *   `ReaderRefusal` for an element past `elementDepth`, or the `WellFormednessError` for the first
 *   error `saxes` raises.
 * @see {@link https://github.com/lddubeau/saxes/blob/v6.0.0/src/saxes.ts#L2458-L2479 saxes 6.0.0, SaxesParser.resolve}
 * @see {@link https://github.com/lddubeau/saxes/blob/v6.0.0/src/saxes.ts#L2005-L2009 saxes 6.0.0, the start tag's own record}
 */
const parse = (
  substituted: Substituted,
  sentinels: ReadonlyMap<string, string>,
  elementDepth: number,
): Effect.Effect<Built, WellFormednessError | ReaderRefusal> => {
  const parser = new SaxesParser({ position: true, xmlns: true });
  for (const [name, sentinel] of sentinels) {
    parser.ENTITIES[name] = sentinel;
  }

  return Effect.try({
    catch: (error) =>
      error instanceof ReaderRefusal
        ? error
        : new WellFormednessError({
            afterSubstitution: substituted.afterSubstitution(
              utf16Offset(substituted.body, parser.position),
            ),
            column: parser.column,
            line: parser.line,
            message: error instanceof Error ? error.message : String(error),
          }),
    try: () => {
      const open: OpenElement[] = [];
      const prolog: Misc[] = [];
      const epilog: Misc[] = [];
      let root: Element | undefined;
      const place = (node: Child & Misc): void => {
        const parent = open.at(-1);
        if (parent === undefined) {
          (root ? epilog : prolog).push(node);
        } else {
          parent.children.push(node);
        }
      };

      parser.on("opentagstart", (tag) => {
        const parent = open.at(-1);
        Object.assign(tag.ns, parent === undefined ? ROOT_BINDINGS : parent.bindings);
      });
      parser.on("opentag", (tag) => {
        if (open.length >= elementDepth) {
          throw new ReaderRefusal({
            detail: `The document nests elements more than ${elementDepth} deep: element <${tag.name}> at line ${parser.line}, column ${parser.column} opens past the reader's limit. Flatten the structure so at most ${elementDepth} elements are open at once.`,
            rule: "element-depth",
          });
        }

        // The attribute record's insertion order is the order the attributes were written in,
        // namespace declarations included.
        open.push({
          attributes: Object.values(tag.attributes).map(toAttribute),
          bindings: tag.ns,
          children: [],
          local: tag.local,
          namespace: tag.uri,
          prefix: tag.prefix,
          qname: tag.name,
        });
      });
      parser.on("closetag", () => {
        const closed = open.pop();
        if (closed === undefined) {
          return;
        }

        const element = toElement(closed);
        const parent = open.at(-1);
        if (parent === undefined) {
          root = element;
        } else {
          parent.children.push(element);
        }
      });
      parser.on("text", (value) => {
        const parent = open.at(-1);
        const last = parent?.children.at(-1);
        if (parent === undefined || value === "") {
          return;
        }

        if (last?.kind === "text" && last.cdata) {
          parent.children.push({ cdata: false, kind: "text", value });
        } else if (last?.kind === "text") {
          parent.children[parent.children.length - 1] = { ...last, value: last.value + value };
        } else {
          parent.children.push({ cdata: false, kind: "text", value });
        }
      });
      parser.on("cdata", (value) => {
        open.at(-1)?.children.push({ cdata: true, kind: "text", value });
      });
      parser.on("comment", (text) => {
        place({ kind: "comment", text });
      });
      parser.on("processinginstruction", ({ body, target }) => {
        place({ data: body, kind: "pi", target });
      });
      parser.write(substituted.body).close();

      if (root === undefined) {
        throw new Error("the document has no root element");
      }

      return { epilog, prolog, root };
    },
  });
};

/**
 * The value with leading and trailing spaces removed and each run of spaces made one (XML 1.0
 * section 3.3.3, the second step, which applies to every attribute type but `CDATA`).
 */
const collapseSpaces = (value: string): string => value.replaceAll(/ +/gu, " ").trim();

/**
 * The `&name;` references in `value`, each as its name and the index of its `&`.
 */
const referencesIn = (value: string): readonly AttributeReference[] =>
  [...value.matchAll(/&(?<name>[^\s&;]+);/gu)].map((match) => ({
    name: match.groups?.["name"] ?? "",
    offset: match.index,
  }));

/**
 * The attribute `declared` names with `value`, which is as the ATTLIST declaration supplies it
 * except for the second normalization step a non-`CDATA` type adds; a name in it other than the
 * predefined five is kept as written and recorded as a reference.
 */
const defaultAttribute = (declared: string, entry: AttlistEntry, value: string): Attribute => {
  const normalized = entry.type === "CDATA" ? value : collapseSpaces(value);

  return {
    local: declared,
    namespace: "",
    prefix: "",
    qname: declared,
    references: referencesIn(normalized),
    value: normalized,
  };
};

/**
 * `element`'s attributes after the ATTLIST table of its name is applied: a non-`CDATA` value is
 * normalized and each declared default the element lacks is appended in declaration order.
 */
const applyAttlist = (
  attributes: readonly Attribute[],
  table: ReadonlyMap<string, AttlistEntry>,
): readonly Attribute[] => {
  const written = attributes.map((attribute) => {
    const entry = table.get(attribute.qname);

    return entry === undefined || entry.type === "CDATA"
      ? attribute
      : { ...attribute, value: collapseSpaces(attribute.value) };
  });
  const present = new Set(attributes.map((attribute) => attribute.qname));
  const defaulted = [...table].flatMap(([declared, entry]) =>
    !present.has(declared) && Option.isSome(entry.default)
      ? [defaultAttribute(declared, entry, entry.default.value)]
      : [],
  );

  return [...written, ...defaulted];
};

/**
 * `root` and everything below it with the ATTLIST tables applied, without recursion.
 *
 * @param root - The root element as `saxes` built it.
 * @param attlists - The ATTLIST table of each element name.
 * @returns The tree with each element's table applied to its attributes.
 */
const applyAttlists = (root: Element, attlists: Prolog["attlists"]): Element =>
  rebuild(
    root,
    (element) => {
      const table = attlists.get(element.qname);

      return table === undefined ? element.attributes : applyAttlist(element.attributes, table);
    },
    (leaf) => [leaf],
  );

/**
 * An attribute value after its stand-in characters are written back as `&name;`, with where each
 * `&` landed.
 */
interface Restored {
  readonly references: readonly AttributeReference[];
  readonly value: string;
}

/**
 * `value` with each stand-in character written back as `&name;`.
 */
const restoreValue = (value: string, names: ReadonlyMap<string, string>): Restored => {
  const references: AttributeReference[] = [];
  let restored = "";
  for (const character of value) {
    const name = names.get(character);
    if (name === undefined) {
      restored += character;
    } else {
      references.push({ name, offset: restored.length });
      restored += `&${name};`;
    }
  }

  return { references, value: restored };
};

/**
 * `value` split around its stand-in characters: the text between them as `Text` runs and each
 * stand-in as an `EntityRef`.
 */
const restoreText = (value: string, names: ReadonlyMap<string, string>): readonly Child[] => {
  const children: Child[] = [];
  let run = "";
  for (const character of value) {
    const name = names.get(character);
    if (name === undefined) {
      run += character;
    } else {
      if (run !== "") {
        children.push({ cdata: false, kind: "text", value: run });
      }

      children.push({ kind: "entityRef", name } satisfies EntityRef);
      run = "";
    }
  }

  if (run !== "") {
    children.push({ cdata: false, kind: "text", value: run });
  }

  return children;
};

/**
 * `root` and everything below it, without recursion, with each stand-in character replaced by the
 * reference it stands for: an `EntityRef` among the children, and `&name;` in an attribute value
 * with its offset recorded.
 *
 * @param root - The root element with the ATTLIST tables applied.
 * @param names - The entity name each stand-in character stands for.
 * @returns The tree with every stand-in character restored.
 */
const restoreReferences = (root: Element, names: ReadonlyMap<string, string>): Element =>
  rebuild(
    root,
    (element) =>
      element.attributes.map((attribute) => {
        const restored = restoreValue(attribute.value, names);

        return restored.references.length === 0
          ? attribute
          : { ...attribute, references: restored.references, value: restored.value };
      }),
    (leaf) => (leaf.kind === "text" && !leaf.cdata ? restoreText(leaf.value, names) : [leaf]),
  );

/**
 * Assemble the document from what the earlier stages read and the tree `saxes` built.
 */
const assemble = (
  decoded: Decoded,
  prolog: Prolog,
  built: Built,
  names: ReadonlyMap<string, string>,
): XmlDocument => {
  const applied =
    prolog.attlists.size === 0 ? built.root : applyAttlists(built.root, prolog.attlists);

  return {
    charset: decoded.label,
    declaration: prolog.declaration,
    doctype: prolog.doctype,
    epilog: built.epilog,
    prolog: built.prolog,
    root: names.size === 0 ? applied : restoreReferences(applied, names),
  };
};

/**
 * Read a document's bytes into its tree.
 *
 * The bytes are decoded, the prolog is lexed and the declared entities are substituted into the
 * body, then `saxes` parses the result with namespaces on and the tree is built from its events:
 * adjacent text events become one `Text`, a CDATA section stays its own `Text`, and the
 * empty-element form is dropped. The ATTLIST table is then applied: a declared default the element
 * lacks is appended, and a non-`CDATA` attribute value is normalized.
 *
 * A reference to an entity the document does not declare is refused when the document is
 * `standalone="yes"` or has no external subset. Otherwise each such name is registered with
 * `saxes` as one private use character that the document does not contain, and after the parse each
 * character becomes the reference it stood for: an `EntityRef` in content, `&name;` with a recorded
 * offset in an attribute value.
 *
 * At most `options.elementDepth` elements may be open at once, {@link defaultElementDepth} (256,
 * as in `xmllint`) unless the caller gives another bound; a deeper document is refused under rule
 * `element-depth`. Within the bound, a document of any depth or width is read: the tree is built,
 * and then rewritten, on stacks of its own, never by recursion.
 *
 * @param bytes - The document as read from storage.
 * @param options - How to read it: the element depth it is refused past.
 * @returns The tree; a `ReaderRefusal` from decoding, the prolog, an entity reference or the
 *   element depth, or a
 *   `WellFormednessError` whose position is the parser's and whose `afterSubstitution` says whether
 *   a substitution precedes it.
 */
export const readXml = Effect.fn("xml.read")(function* readXml(
  bytes: Uint8Array,
  options: ReadOptions = {},
): Effect.fn.Return<XmlDocument, WellFormednessError | ReaderRefusal> {
  const decoded = yield* decode(bytes);
  const prolog = yield* lexProlog(decoded.text);
  const substituted = yield* substitute(decoded.text, prolog);
  const sentinels = yield* assignSentinels(substituted, prolog);
  const built = yield* parse(substituted, sentinels, options.elementDepth ?? defaultElementDepth);
  const names = new Map([...sentinels].map(([name, sentinel]) => [sentinel, name]));

  return assemble(decoded, prolog, built, names);
});
