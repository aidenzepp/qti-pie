/**
 * Judge a `data-ssml` value against Data-SSML 1.0's JSON Schema (spec reading R7-a): one JSON
 * object whose members are among `break`, `phoneme`, `prosody`, `say-as` and `sub`, each an object
 * of the properties the schema lists for it, each property a string, the required ones present,
 * and the enumerated ones one of the schema's values.
 *
 * The importer asks it of every `data-ssml` a closed kind declares, before any row is built. The
 * database holds the value as text and does not re-prove its form: one pattern for this language
 * needs about 4,400 positions where grizzle admits 4,096 (`docs/grizzle-findings.md`, the
 * pattern-size row), so the check lives here and a ChangeSet that bypasses the importer is the
 * limit R7-a states.
 *
 * The value is read as written, as RFC 8259 reads it, one grammar for the text and the schema's
 * tables for its meaning. A name written twice in one object is admitted (RFC 8259 §4: names
 * "SHOULD be unique") and each of its values is judged, which `JSON.parse` cannot do, since it
 * keeps the last. The module is pure: it imports only the types of the tree it walks.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/datassml/ | IMS Data-SSML 1.0, 3.4 JSON Schema}
 */
import type { Composed } from "#pantry/model/composed.ts";
import type { XdmChild, XdmDocument } from "#pantry/model/xdm.ts";

/**
 * Why a `data-ssml` value is refused: the JSON path of the offending value (`$` for the root and
 * for text that is not JSON, `$.break.strength` for a property) and what to change.
 */
export interface DataSsmlFault {
  readonly detail: string;
  readonly path: string;
}

/**
 * What a property's string may be: any string, an enumerated value, or a normalized string, whose
 * decoded value holds no tab, line feed or carriage return.
 */
type Domain =
  | { readonly kind: "enumeration"; readonly values: readonly string[] }
  | { readonly kind: "normalized" }
  | { readonly kind: "string" };

/**
 * One property of a member: its name, its domain and whether the schema requires it.
 */
interface Property {
  readonly domain: Domain;
  readonly name: string;
  readonly required: boolean;
}

/**
 * The members of a `data-ssml` object and the properties each admits, from the schema (§3.4,
 * "NORMATIVE"): `break` (`strength`, `time`), `phoneme` (`ph`, required, `alphabet`, `type`),
 * `prosody` (`rate`), `say-as` (`interpret-as`, required) and `sub` (`alias`, required). `time` and
 * `rate` are normalized strings in the schema's OAS3 form (Appendix C, and the information model's
 * `RateUnion`), over the prose's percentage.
 */
const members: ReadonlyMap<string, readonly Property[]> = new Map([
  [
    "break",
    [
      {
        domain: {
          kind: "enumeration",
          values: ["none", "x-weak", "weak", "medium", "strong", "x-strong"],
        },
        name: "strength",
        required: false,
      },
      { domain: { kind: "normalized" }, name: "time", required: false },
    ],
  ],
  [
    "phoneme",
    [
      { domain: { kind: "string" }, name: "ph", required: true },
      {
        domain: { kind: "enumeration", values: ["ipa", "x-sampa"] },
        name: "alphabet",
        required: false,
      },
      {
        domain: { kind: "enumeration", values: ["default", "ruby"] },
        name: "type",
        required: false,
      },
    ],
  ],
  ["prosody", [{ domain: { kind: "normalized" }, name: "rate", required: false }]],
  [
    "say-as",
    [
      {
        domain: {
          kind: "enumeration",
          values: ["date", "time", "telephone", "characters", "cardinal", "ordinal"],
        },
        name: "interpret-as",
        required: true,
      },
    ],
  ],
  ["sub", [{ domain: { kind: "string" }, name: "alias", required: true }]],
]);

/**
 * The escapes JSON writes with a single letter (RFC 8259 §7), by that letter.
 */
const letterEscapes: ReadonlyMap<string, string> = new Map([
  ['"', '"'],
  ["\\", "\\"],
  ["/", "/"],
  ["b", "\b"],
  ["f", "\f"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
]);

/**
 * A step of the reader: the value read and the offset just after it, or the refusal.
 */
type Step<T> = { readonly next: number; readonly value: T } | DataSsmlFault;

/**
 * What {@link readPair} reads in place of a name when the object ends: a string no name decodes to
 * can stand for it, since a decoded name is any string, so it is a symbol.
 */
const end = Symbol("end");

/**
 * Whether a step is a refusal.
 */
const isFault = <T>(step: Step<T>): step is DataSsmlFault => "detail" in step;

/**
 * Build the refusal of text that breaks RFC 8259's grammar, or the shape the schema fixes, at an
 * offset. The path is the root where the text is no JSON, because no value has a place until the
 * text has been read.
 */
const brokenAt = (text: string, at: number, expected: string): DataSsmlFault => {
  const found =
    at < text.length ? `found ${JSON.stringify(text[at])}` : "found the end of the value";

  return {
    detail: `The value is not one JSON object: expected ${expected} at offset ${String(at)}, ${found}. Write the value as a JSON object.`,
    path: "$",
  };
};

/**
 * Return the offset of the first character at or after `at` that is not JSON whitespace.
 */
const skipSpace = (text: string, at: number): number => {
  let next = at;
  while (text[next] === " " || text[next] === "\t" || text[next] === "\n" || text[next] === "\r") {
    next += 1;
  }

  return next;
};

/**
 * Read the JSON string whose opening quote is at `start`, decoding its escapes into the string it
 * denotes: a `\u` escape is one UTF-16 code unit, so a lone surrogate or a NUL is held as such.
 */
const readString = (text: string, start: number): Step<string> => {
  const pieces: string[] = [];
  let at = start + 1;
  let from = at;
  while (at < text.length) {
    const unit = text.codePointAt(at) ?? 0;
    if (unit === 0x22) {
      pieces.push(text.slice(from, at));

      return { next: at + 1, value: pieces.join("") };
    }

    if (unit < 0x20) {
      return brokenAt(text, at, "an escaped control character inside the string");
    }

    if (unit === 0x5c) {
      pieces.push(text.slice(from, at));

      const letter = text[at + 1] ?? "";
      const simple = letterEscapes.get(letter);
      const hex = text.slice(at + 2, at + 6);
      if (simple !== undefined) {
        pieces.push(simple);
        at += 2;
      } else if (letter === "u" && /^[0-9A-Fa-f]{4}$/u.test(hex)) {
        pieces.push(String.fromCodePoint(Number.parseInt(hex, 16)));
        at += 6;
      } else {
        return brokenAt(text, at + 1, 'one of " \\ / b f n r t, or u and four hex digits');
      }

      from = at;
    } else {
      at += 1;
    }
  }

  return brokenAt(text, text.length, "the closing quote of the string");
};

/**
 * Where an object's reader stands: just after `{` (`open`), just after a `,` (`comma`), or just
 * after a pair's value (`value`).
 */
type Stand = "comma" | "open" | "value";

/**
 * Read an object's next pair: the closing brace, as `"end"`, where the object may end, or the
 * pair's decoded name with the offset of its value left to the caller.
 */
const readPair = (text: string, from: number, stand: Stand): Step<string | typeof end> => {
  const at = skipSpace(text, from);
  if (text[at] === "}" && stand !== "comma") {
    return { next: at + 1, value: end };
  }

  if (text[at] !== '"') {
    return brokenAt(text, at, stand === "comma" ? "a member name" : "a member name or '}'");
  }

  const name = readString(text, at);
  if (isFault(name)) {
    return name;
  }

  const colon = skipSpace(text, name.next);
  if (text[colon] !== ":") {
    return brokenAt(text, colon, "':'");
  }

  return { next: skipSpace(text, colon + 1), value: name.value };
};

/**
 * Whether a decoded string is in a property's domain, and if not what the domain is.
 */
const outsideDomain = (domain: Domain, value: string): string | undefined => {
  switch (domain.kind) {
    case "enumeration": {
      return domain.values.includes(value)
        ? undefined
        : `${JSON.stringify(value)} is not one of ${domain.values.join(", ")}`;
    }
    case "normalized": {
      return /[\t\n\r]/u.test(value)
        ? "the value holds a tab, a line feed or a carriage return"
        : undefined;
    }
    case "string": {
      return undefined;
    }
    default: {
      return domain satisfies never;
    }
  }
};

/**
 * Read the object of one member whose `{` is at `open`, judging each property against the
 * member's table.
 */
const readMember = (
  text: string,
  open: number,
  member: string,
  properties: readonly Property[],
): Step<null> => {
  const path = `$.${member}`;
  const seen = new Set<string>();
  let from = open + 1;
  let stand: Stand = "open";
  for (;;) {
    const pair = readPair(text, from, stand);
    if (isFault(pair)) {
      return pair;
    }

    if (pair.value === end) {
      const missing = properties.find(({ name, required }) => required && !seen.has(name));

      return missing === undefined
        ? { next: pair.next, value: null }
        : {
            detail: `${member} needs its ${missing.name} property. Add ${JSON.stringify(missing.name)} with a string.`,
            path,
          };
    }

    const property = properties.find(({ name }) => name === pair.value);
    if (property === undefined) {
      return {
        detail: `${member} has no property ${JSON.stringify(pair.value)}. Use ${properties.map(({ name }) => name).join(", ")}.`,
        path: `${path}[${JSON.stringify(pair.value)}]`,
      };
    }

    const at = pair.next;
    const here = `${path}.${property.name}`;
    if (text[at] !== '"') {
      return { detail: `${property.name} is not a string. Write it as a JSON string.`, path: here };
    }

    const value = readString(text, at);
    if (isFault(value)) {
      return value;
    }

    const outside = outsideDomain(property.domain, value.value);
    if (outside !== undefined) {
      return { detail: `${outside}. Change ${property.name}.`, path: here };
    }

    seen.add(property.name);

    const after = skipSpace(text, value.next);
    if (text[after] === "," || text[after] === "}") {
      from = text[after] === "," ? after + 1 : after;
      stand = text[after] === "," ? "comma" : "value";
    } else {
      return brokenAt(text, after, "',' or '}'");
    }
  }
};

/**
 * Judge a `data-ssml` value as written.
 *
 * @param text - The attribute's lexical form.
 * @returns The refusal naming the path of what the schema does not admit and what to change, or
 *   `undefined` when Data-SSML 1.0 admits the value.
 */
export const dataSsmlFaultOf = (text: string): DataSsmlFault | undefined => {
  let from = skipSpace(text, 0);
  if (text[from] !== "{") {
    return brokenAt(text, from, "a JSON object");
  }

  from += 1;
  let stand: Stand = "open";
  for (;;) {
    const pair = readPair(text, from, stand);
    if (isFault(pair)) {
      return pair;
    }

    if (pair.value === end) {
      const tail = skipSpace(text, pair.next);

      return tail === text.length ? undefined : brokenAt(text, tail, "the end of the value");
    }

    const properties = members.get(pair.value);
    if (properties === undefined) {
      return {
        detail: `${JSON.stringify(pair.value)} is not a member Data-SSML knows. Use ${[...members.keys()].join(", ")}.`,
        path: `$[${JSON.stringify(pair.value)}]`,
      };
    }

    if (text[pair.next] !== "{") {
      return {
        detail: `${pair.value} is not an object. Write it as a JSON object of its properties.`,
        path: `$.${pair.value}`,
      };
    }

    const member = readMember(text, pair.next, pair.value, properties);
    if (isFault(member)) {
      return member;
    }

    const after = skipSpace(text, member.next);
    if (text[after] === "," || text[after] === "}") {
      from = text[after] === "," ? after + 1 : after;
      stand = text[after] === "," ? "comma" : "value";
    } else {
      return brokenAt(text, after, "',' or '}'");
    }
  }
};

/**
 * Judge every `data-ssml` a document's closed kinds declare, in document order.
 *
 * An element whose kind does not declare the attribute reads it as an open `data-*` name, which
 * holds any text (spec readings 13 and 90), so only a closed `data-ssml` is judged.
 *
 * @param tree - The document as shred gives it.
 * @returns The first refusal with its element's kind named in the detail, or `undefined` when
 *   every `data-ssml` is admitted.
 */
export const dataSsmlFaultIn = (tree: XdmDocument<Composed>): DataSsmlFault | undefined => {
  const stack: XdmChild<Composed>[] = [tree.root];
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    if (
      node._tag === "text" ||
      node._tag === "ws" ||
      node._tag === "comment" ||
      node._tag === "pi" ||
      node._tag === "entityRef"
    ) {
      continue;
    }

    for (const { lexical, name } of node.attributes) {
      const fault =
        name._tag === "closed" && name.handle === "data-ssml"
          ? dataSsmlFaultOf(lexical)
          : undefined;
      if (fault !== undefined) {
        const where = node._tag === "element" ? `a ${node.kind} element` : "an element";

        return { detail: `On ${where}, ${fault.detail}`, path: fault.path };
      }
    }

    stack.push(...node.children.toReversed());
  }

  return undefined;
};
