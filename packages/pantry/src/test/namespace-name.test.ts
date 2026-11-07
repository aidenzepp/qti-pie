/**
 * Crust's reader held to Namespaces in XML 1.0's rule for a namespace declaration's value: "The
 * attribute's normalized value MUST be either a URI reference — the namespace name identifying the
 * namespace — or an empty string" (section 3), the empty one undeclaring the default namespace and,
 * for a prefix, breaking No Prefix Undeclaring (section 5). The oracle is the law oracle's own
 * recogniser of RFC 3986 Appendix A (`#pantry/test/uri-reference.ts`), and the normalized value is
 * XML 1.0 section 3.3.3's, worked out here from each character's spelling: a literal space or tab
 * becomes a space, a character reference stays the character it names (spec reading 131).
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Element } from "@qti-pie/crust/tree.ts";
import { isUriReference } from "#pantry/test/uri-reference.ts";

/**
 * The characters a value is drawn from, each as the document spells it and as normalization
 * leaves it: RFC 3986's letters, digits, delimiters and `%`, a space and a tab written as
 * themselves and as character references, a quote, and a letter beyond US-ASCII.
 */
const TOKENS = [
  { normalized: "a", spelled: "a" },
  { normalized: "1", spelled: "1" },
  { normalized: "F", spelled: "F" },
  { normalized: ":", spelled: ":" },
  { normalized: "/", spelled: "/" },
  { normalized: "?", spelled: "?" },
  { normalized: "#", spelled: "#" },
  { normalized: "[", spelled: "[" },
  { normalized: "]", spelled: "]" },
  { normalized: "@", spelled: "@" },
  { normalized: "%", spelled: "%" },
  { normalized: " ", spelled: " " },
  { normalized: " ", spelled: "\t" },
  { normalized: " ", spelled: "&#x20;" },
  { normalized: "\t", spelled: "&#9;" },
  { normalized: '"', spelled: "&quot;" },
  { normalized: "é", spelled: "é" },
] as const;

/**
 * The most characters a value holds.
 */
const LONGEST = 3;

/**
 * The declarations a value is given to: a prefix's, observed on a child it names, and the default
 * namespace's, observed on an unprefixed child.
 */
const DECLARATIONS = ["xmlns:p", "xmlns"] as const;

/**
 * One case: a declaration and its value's characters.
 */
interface Declared {
  readonly declaration: (typeof DECLARATIONS)[number];
  readonly value: readonly (typeof TOKENS)[number][];
}

/**
 * Every case: each declaration, and every value of up to {@link LONGEST} characters.
 */
const declared: Gen<Declared> = (source) => ({
  declaration: source.draw(element(DECLARATIONS)),
  value: source.draw(array(element(TOKENS), { max: LONGEST, min: 0 })),
});

/**
 * The size of {@link declared}'s box: 2 declarations times the values of 0 to 3 of 17 characters.
 */
const DECLARED =
  DECLARATIONS.length *
  Array.from({ length: LONGEST + 1 }, (_, length) => TOKENS.length ** length).reduce(
    (sum, count) => sum + count,
    0,
  );

/**
 * What crust's reader should make of a case, by the oracle: refused, or read with the child in
 * the namespace the value names.
 */
type Verdict = { readonly kind: "refused" } | { readonly kind: "read"; readonly namespace: string };

/**
 * Judge a case by Namespaces in XML 1.0 section 3 and 5 and the law oracle's recogniser.
 *
 * @param cased - The case.
 * @param cased.declaration - The declaration.
 * @param cased.value - The value's characters.
 * @returns The verdict.
 */
const expectedOf = ({ declaration, value }: Declared): Verdict => {
  const normalized = value.map(({ normalized: held }) => held).join("");
  if (normalized === "") {
    return declaration === "xmlns" ? { kind: "read", namespace: "" } : { kind: "refused" };
  }

  return isUriReference(normalized) ? { kind: "read", namespace: normalized } : { kind: "refused" };
};

describe("crust's reader holds a namespace declaration's value to RFC 3986's URI-reference", () => {
  it.effect(
    `for every value of up to ${String(LONGEST)} characters given to a prefix or the default namespace, exhausted: ${String(DECLARED)} documents`,
    (ctx) =>
      // Oracle: the law oracle's recogniser of RFC 3986 Appendix A, a grammar and not a pattern,
      // over the value XML 1.0 section 3.3.3 normalizes. Bound: every value of 0 to 3 of the 17
      // characters, given to `xmlns:p` and to `xmlns`.
      searched(
        ctx,
        exhaust(
          {
            box: "every value of 0 to 3 of 17 characters, given to a prefix and to the default namespace",
            caseHang: Duration.seconds(30),
            coverage: requiredInSpace<"read" | "refused" | (typeof DECLARATIONS)[number]>([
              "read",
              "refused",
              ...DECLARATIONS,
            ]),
            generator: declared,
            limit: DECLARED,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "Namespaces in XML 1.0 sections 3 and 5 over RFC 3986 Appendix A (#pantry/test/uri-reference.ts)",
            },
            suite: "pantry/namespace-name/crust",
          },
          (cased, c) =>
            Effect.gen(function* holdsToTheGrammar() {
              const spelled = cased.value.map(({ spelled: held }) => held).join("");
              const child = cased.declaration === "xmlns" ? "c" : "p:c";
              const text = `<r ${cased.declaration}="${spelled}"><${child}/></r>`;
              const expected = expectedOf(cased);
              c.note(cased.declaration);
              c.note(expected.kind);

              const read = yield* Effect.result(readXml(new TextEncoder().encode(text)));
              const actual: Verdict =
                read._tag === "Failure"
                  ? { kind: "refused" }
                  : {
                      kind: "read",
                      namespace:
                        read.success.root.children.find(
                          (held): held is Element => held.kind === "element",
                        )?.namespace ?? "",
                    };

              assert.deepStrictEqual(actual, expected, text);
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, DECLARED);
          }),
        ),
      ),
    120_000,
  );
});
