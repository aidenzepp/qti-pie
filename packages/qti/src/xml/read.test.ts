import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { SaxesParser } from "saxes";

/**
 * The events one `saxes` parse reported: every text run in order, every attribute value in order,
 * and every error the parser raised instead of throwing.
 */
interface Observed {
  readonly attributes: readonly string[];
  readonly errors: readonly string[];
  readonly texts: readonly string[];
}

/**
 * Parse `document` with a namespace-aware, position-tracking `SaxesParser` whose `ENTITIES` table
 * holds `entities`, and return what the `text` and `attribute` events carried.
 */
const observe = (entities: Readonly<Record<string, string>>, document: string): Observed => {
  const parser = new SaxesParser({ position: true, xmlns: true });
  const attributes: string[] = [];
  const errors: string[] = [];
  const texts: string[] = [];
  Object.assign(parser.ENTITIES, entities);
  parser.on("attribute", (attribute) => attributes.push(attribute.value));
  parser.on("error", (error) => errors.push(error.message));
  parser.on("text", (text) => texts.push(text));
  parser.write(document).close();

  return { attributes, errors, texts };
};

it.effect("saxes appends ENTITIES replacement text unnormalized and unparsed", () =>
  Effect.sync(() => {
    const observed = observe({ e: "<b>1</b>\n" }, '<a x="&e;">&e;</a>');

    assert.deepStrictEqual(observed.errors, []);
    assert.strictEqual(observed.texts.join(""), "<b>1</b>\n");
    assert.deepStrictEqual(observed.attributes, ["<b>1</b>\n"]);
  }),
);
