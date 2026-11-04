/**
 * The refusal of an absent required attribute.
 */
import { Effect, Option } from "effect";
import { ItemRefusal } from "#qti/import/tree.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The value of an attribute the schema requires.
 *
 * The XSD (or, for `source/@src`, the QTI prose) requires the attribute. An explicit empty value is
 * a value and is returned. An absent attribute is refused before any row under
 * `required-attribute`, because a free-text column (`xsString`, `xsNormalizedString`, `anyUri`)
 * admits the empty string and the database cannot refuse it.
 *
 * @param element - The element that should carry the attribute.
 * @param name - The attribute's name, for the refusal.
 * @param value - What the caller's own reader produced, so each site keeps its whitespace class.
 * @returns The value, the empty string included; fails with {@link ItemRefusal} when absent.
 */
export const requiredAttribute = (
  element: Element,
  name: string,
  value: Option.Option<string>,
): Effect.Effect<string, ItemRefusal> =>
  Option.match(value, {
    onNone: () =>
      Effect.fail(
        new ItemRefusal({
          detail: `<${element.qname}> has no ${name} attribute, which the schema requires. Add ${name}="..." to the element; an empty value is accepted.`,
          rule: "required-attribute",
        }),
      ),
    onSome: Effect.succeed,
  });
