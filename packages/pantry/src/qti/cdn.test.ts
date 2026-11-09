/**
 * Single-CDN mode's laws (`#pantry/qti/cdn.ts`), with no database: each law a policy states is a
 * check, read as the import's host judge reads it (`#pantry/import/host-judge.ts` `judgedOf`) and
 * evaluated as PostgreSQL evaluates the CHECK it compiles to, over rows drawn for it, against the
 * reading its law states, written here apart from its pattern:
 *
 * - **CDN origin** against HTML's srcset parser, written here from the HTML Standard, and the URL
 *   Standard's leading strip; and every value it admits against the URL Standard's own parser
 *   (Node's `URL`), which must resolve it on the origin;
 * - **CDN data** against the URL Standard's scheme, Node's `URL`'s protocol;
 * - **CDN style** against the texts it names, in any case, and the backslash;
 * - **CDN foreign** against the three foreign kinds and the three open classes it names, over every
 *   kind and every attribute name.
 *
 * Beside them, the declaration's rows against the grammar, the laws' names against the law table,
 * so a refused import names its law and rule and never dies unowned, and the schema built for no
 * policy against the schema this package installs.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, element } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import type { Law } from "@bjornpagen/grizzle";
import { Array as Arr, Duration, Effect, Formatter, Option, Result } from "effect";
import type { CdnPolicy } from "#pantry/db/install.ts";
import { grammar } from "#pantry/grammar/install.ts";
import type { Datum } from "#pantry/host/predicates.ts";
import { judgedOf } from "#pantry/import/host-judge.ts";
import { checkNameOf, lawNames, refusalOfLaws } from "#pantry/import/refusal.ts";
import { cdnLawsByName, governorsOf } from "#pantry/qti/cdn.ts";
import { Qti, qtiSchema } from "#pantry/qti/schema.ts";
import { policyLaws } from "#pantry/test/oracle-laws.ts";
import { lawTable } from "#pantry/vocab/laws.ts";
import { addressLists, fetchedAttributes, fetchedTexts } from "#pantry/vocab/fetched.ts";

/**
 * Take a list a case draws from as a nonempty one, the form `element` draws from.
 *
 * @param values - The list.
 * @param what - What the list holds, for the failure's message.
 * @returns The same list, typed nonempty.
 */
const nonEmpty = <A>(values: readonly A[], what: string): Arr.NonEmptyReadonlyArray<A> =>
  Arr.isReadonlyArrayNonEmpty(values) ? values : assert.fail(`no ${what} to draw from`);

/**
 * The policies every case is judged under: the install's own origin, and one with a port and a
 * hyphen, so a pattern that reads either wrongly is seen.
 */
const policies = [
  { cdn: "https://cdn.edullm.ai/" },
  { cdn: "https://media-cdn.example.test:8443/" },
] as const satisfies readonly CdnPolicy[];

/**
 * The policy a case that needs only one is judged under: the install's own.
 */
const [ownPolicy] = policies;

/**
 * The address a player resolves a relative one against: a document of a package on another host.
 */
const base = "https://player.example.test/package/items/item.xml";

/**
 * Whether an address resolves on an origin, as the URL Standard's parser resolves it against the
 * player's document.
 *
 * @param address - The address as written.
 * @param origin - The origin.
 * @returns Whether it parses and its URL starts with the origin.
 */
const resolvesOn = (address: string, origin: string): boolean =>
  URL.canParse(address, base) && new URL(address, base).href.startsWith(origin);

/**
 * Whether an address uses the `data:` scheme, as the URL Standard's parser reads its scheme.
 *
 * @param address - The address as written.
 * @returns Whether it parses with the scheme `data`.
 */
const isData = (address: string): boolean =>
  URL.canParse(address, base) && new URL(address, base).protocol === "data:";

/**
 * Strip what the URL Standard strips before a URL: its leading C0 controls and spaces.
 *
 * @param address - The address as written.
 * @returns It without them.
 * @see {@link https://url.spec.whatwg.org/#concept-basic-url-parser | URL Standard, the basic URL parser, step 1}
 */
const stripped = (address: string): string => {
  let at = 0;
  while (at < address.length && (address.codePointAt(at) ?? 0) <= 0x20) {
    at += 1;
  }

  return address.slice(at);
};

/**
 * HTML's ASCII whitespace.
 */
const htmlSpace = new Set(["\t", "\n", "\f", "\r", " "]);

/**
 * Find where a run of characters a test holds ends: the first position from `from` whose character
 * the test refuses, or the text's end.
 *
 * @param text - The text.
 * @param from - Where the run starts.
 * @param holds - The test.
 * @returns The run's end.
 */
const runEnd = (text: string, from: number, holds: (character: string) => boolean): number => {
  let at = from;
  while (at < text.length && holds(text.charAt(at))) {
    at += 1;
  }

  return at;
};

/**
 * Whether a character is one HTML's splitting loop skips between candidates: ASCII whitespace or a
 * comma.
 *
 * @param character - The character.
 * @returns Whether the loop skips it.
 */
const betweenCandidates = (character: string): boolean =>
  htmlSpace.has(character) || character === ",";

/**
 * Find where a candidate's descriptors end, as HTML's descriptor tokenizer reads them past its URL:
 * after the first comma outside parentheses, or at the text's end. A whitespace between
 * descriptors and a closed parenthesis change no end.
 *
 * @param text - The `srcset`.
 * @param from - The position after the candidate's URL.
 * @returns The position the splitting loop resumes at.
 */
const descriptorsEnd = (text: string, from: number): number => {
  let inParens = false;
  for (let at = from; at < text.length; at += 1) {
    const character = text.charAt(at);
    if (inParens) {
      inParens = character !== ")";
    } else if (character === ",") {
      return at + 1;
    } else {
      inParens = character === "(";
    }
  }

  return text.length;
};

/**
 * The URL of each image candidate of a `srcset`, as HTML's algorithm collects them: the splitting
 * loop skips whitespace and commas, a URL is the run of non-whitespace that follows, a URL ending
 * in commas loses them and ends its candidate, and any other is followed by its descriptors, read
 * by the descriptor tokenizer up to a comma outside parentheses. Every candidate's URL is listed,
 * those whose descriptors HTML then drops among them, so a policy that holds every URL holds every
 * one HTML fetches.
 *
 * @param srcset - The attribute's value.
 * @returns The candidates' URLs, in order.
 * @see {@link https://html.spec.whatwg.org/multipage/images.html#parsing-a-srcset-attribute | HTML Standard, parsing a srcset attribute}
 */
const candidateUrls = (srcset: string): readonly string[] => {
  const urls: string[] = [];
  let position = runEnd(srcset, 0, betweenCandidates);
  while (position < srcset.length) {
    const end = runEnd(srcset, position, (character) => !htmlSpace.has(character));
    const url = srcset.slice(position, end);
    const commas = url.endsWith(",");
    urls.push(commas ? url.replace(/,+$/u, "") : url);
    position = runEnd(srcset, commas ? end : descriptorsEnd(srcset, end), betweenCandidates);
  }

  return urls;
};

/**
 * The pieces a drawn value is made of: an origin's own text and spellings of it the policy does not
 * write, another host, a relative path, a `data:` scheme in several cases, whitespace HTML and the
 * URL Standard read, a C0 control the URL Standard strips, commas, parentheses and descriptors.
 *
 * @param origin - The policy's origin.
 * @returns The pieces.
 */
const piecesOf = (origin: string) =>
  [
    origin,
    origin.toUpperCase(),
    origin.replace("https:", ""),
    origin.replace("https://", ""),
    origin.slice(0, -1),
    "https://elsewhere.example.test/",
    "data:",
    "DaTa:",
    "da\tta:",
    "image.png",
    "a/",
    "../",
    " ",
    "\t",
    "\n",
    "\u0001",
    ",",
    "(",
    ")",
    " 1x",
    " 2w",
    "&cdn;",
  ] as const;

/**
 * Draw a value from a policy's pieces.
 *
 * @param origin - The policy's origin.
 * @returns The generator.
 */
const valueOf = (origin: string) => array(element(piecesOf(origin)), { max: 7, min: 0 });

/**
 * The laws a policy states, each by its name.
 */
type CdnLawName = keyof typeof policyLaws;

/**
 * A check's verdict over a row: true where it holds, false where it refuses, as a CHECK refuses a
 * row its predicate leaves false or unknown.
 */
type Verdict = (row: Readonly<Record<string, Datum>>) => boolean;

/**
 * Each check read so far, by its policy's origin, its law and its relation.
 */
const readChecks = new Map<string, Verdict>();

/**
 * Read a policy's check of one law over one relation, as the import's host judge reads it, once.
 *
 * @param policy - The policy.
 * @param law - The law's name.
 * @param relation - The relation its check is over.
 * @returns The check's verdict.
 */
const checkOf = (policy: CdnPolicy, law: CdnLawName, relation: string): Verdict => {
  const key = `${policy.cdn} ${law} ${relation}`;
  const known = readChecks.get(key);
  if (known !== undefined) {
    return known;
  }

  const statements = cdnLawsByName(Option.some(policy))[law] ?? [];
  const judged = statements.flatMap((statement) =>
    judgedOf(statement, []).flatMap((read) =>
      read.kind === "check" && read.relation === relation ? [read] : [],
    ),
  );
  const [only] = judged;
  if (only === undefined || judged.length !== 1) {
    return assert.fail(`${law} states ${String(judged.length)} checks over ${relation}`);
  }

  assert.deepStrictEqual(only.unread, [], `${law} over ${relation}: terms the host cannot read`);

  const verdict: Verdict = (row) => only.value(row) === true;
  readChecks.set(key, verdict);

  return verdict;
};

/**
 * One fetched attribute under one of its governors, and how its value holds addresses.
 */
interface FetchedField {
  readonly form: "address" | "candidates";
  readonly governor: string;
  readonly name: string;
}

/**
 * Every fetched attribute under every governor it is fetched under.
 */
const fetchedFields: readonly FetchedField[] = fetchedAttributes.flatMap(({ form, kind, name }) =>
  governorsOf([kind]).map((governor) => ({ form, governor, name })),
);

/**
 * Attributes the player never fetches, which CDN origin leaves free: a link, identifiers written as
 * URIs, an image's text, response processing's template, and a MathML element's link.
 */
const freeFields = [
  { governor: "a", name: "href" },
  { governor: "img", name: "longdesc" },
  { governor: "img", name: "alt" },
  { governor: "qti-portable-custom-interaction", name: "custom-interaction-type-identifier" },
  { governor: "qti-response-processing", name: "template" },
  { governor: "m:mglyph", name: "href" },
] as const;

/**
 * The governors whose text a player fetches, and one whose text it does not.
 */
const fetchedTextGovernors = governorsOf(fetchedTexts);

/**
 * The features CDN origin's search steers by: each form of a fetched field and a fetched text,
 * seen admitted and refused, and a free field and a free text, seen admitted.
 */
const originFeatures = [
  "address admitted",
  "address refused",
  "candidates admitted",
  "candidates refused",
  "text admitted",
  "text refused",
  "free admitted",
] as const;

/**
 * Where a drawn value of CDN origin stands: an attribute, under its governor and name, or an
 * element's text, under its governor; fetched in a form, or free.
 */
type OriginField =
  | {
      readonly _tag: "attribute";
      readonly form: "address" | "candidates" | "free";
      readonly governor: string;
      readonly name: string;
    }
  | { readonly _tag: "text"; readonly form: "address" | "free"; readonly governor: string };

/**
 * One drawn case of CDN origin: a policy, where its value stands, and the value.
 */
interface OriginCase {
  readonly field: OriginField;
  readonly policy: CdnPolicy;
  readonly value: string;
}

/**
 * Judge one value of CDN origin by the readings its law states: a free value is admitted; a fetched
 * address is admitted exactly when it starts with the origin past the URL Standard's leading
 * strip, and a `srcset` exactly when every candidate's URL starts with it.
 *
 * @param origin - The policy's origin.
 * @param form - How the value holds addresses, or free.
 * @param value - The value.
 * @returns The addresses it holds, and whether the law admits it.
 */
const originReading = (origin: string, form: OriginField["form"], value: string) => {
  const addresses = form === "candidates" ? candidateUrls(value) : [stripped(value)];

  return {
    addresses,
    admitted: form === "free" || addresses.every((address) => address.startsWith(origin)),
  };
};

describe("qti/cdn.ts, CDN origin", () => {
  it.effect(
    "admits a fetched value exactly when, past the URL Standard's leading strip, it starts with the origin, and a srcset exactly when every candidate's URL does, as HTML parses it; and each address it admits resolves on the origin",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(originFeatures, { cases: 400, sense: notesOnly }),
            draw: drawn((source): OriginCase => {
              const policy = source.draw(element(policies));
              const where = source.draw(
                element(["attribute", "free", "text", "free text"] as const),
              );
              const value = source.draw(valueOf(policy.cdn)).join("");
              const fields: Readonly<Record<typeof where, () => OriginField>> = {
                attribute: () => ({
                  _tag: "attribute",
                  ...source.draw(element(nonEmpty(fetchedFields, "fetched field"))),
                }),
                free: () => ({
                  _tag: "attribute",
                  ...source.draw(element(freeFields)),
                  form: "free",
                }),
                "free text": () => ({ _tag: "text", form: "free", governor: "qti-value" }),
                text: () => ({
                  _tag: "text",
                  form: "address",
                  governor: source.draw(element(nonEmpty(fetchedTextGovernors, "fetched text"))),
                }),
              };
              const field = fields[where]();

              return { field, policy, value };
            }),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the URL Standard's leading strip and parser (Node's URL), and HTML's srcset parser written from the HTML Standard",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "qti/cdn/origin",
          },
          ({ field, policy, value }, c) =>
            Effect.sync(() => {
              const { addresses, admitted } = originReading(policy.cdn, field.form, value);
              const verdict =
                field._tag === "text"
                  ? checkOf(
                      policy,
                      "CDN origin",
                      "Node",
                    )({
                      governor: field.governor,
                      stringValue: value,
                      version: "3.0.0",
                    })
                  : checkOf(
                      policy,
                      "CDN origin",
                      "Attribute",
                    )({
                      governor: field.governor,
                      lexical: value,
                      name: field.name,
                      version: "3.0.0",
                    });
              const shown = `${Formatter.format(field)} ${JSON.stringify(value)}`;

              assert.strictEqual(verdict, admitted, shown);
              if (field.form === "free") {
                c.note("free admitted");

                return;
              }

              const feature = field._tag === "text" ? "text" : field.form;
              c.note(verdict ? `${feature} admitted` : `${feature} refused`);
              if (verdict) {
                for (const address of addresses) {
                  assert.isTrue(
                    resolvesOn(address, policy.cdn),
                    `${shown}: ${JSON.stringify(address)} resolves off the origin`,
                  );
                }
              }
            }),
        ),
      ),
  );
});

/**
 * Attributes CDN data reads, each with how its value holds addresses: an `xs:anyURI` attribute's
 * value is one address, `xsi:schemaLocation`'s each whitespace-separated token, and any other
 * attribute's none.
 */
const dataFields = [
  { form: "address", governor: "a", name: "href", version: "3.0.0" },
  { form: "address", governor: "img", name: "src", version: "3.0.1" },
  { form: "address", governor: "m:mglyph", name: "src", version: "3.0.0" },
  { form: "address", governor: "qti-response-processing", name: "template", version: "3.0.1" },
  { form: "list", governor: "qti-assessment-item", name: "xsi:schemaLocation", version: "3.0.0" },
  { form: "none", governor: "img", name: "alt", version: "3.0.0" },
  { form: "none", governor: "img", name: "data-*", version: "3.0.1" },
] as const;

/**
 * Element texts CDN data reads: a `qti-file-href`'s and an adaptation's, each an `xs:anyURI`, and
 * a value's, which is none.
 */
const dataTexts = [
  { form: "address", governor: "qti-file-href", version: "3.0.0" },
  { form: "address", governor: "drd:hasAdaptation", version: "3.0.1" },
  { form: "none", governor: "qti-value", version: "3.0.0" },
] as const;

/**
 * The features CDN data's search steers by.
 */
const dataFeatures = [
  "address admitted",
  "address refused",
  "list admitted",
  "list refused",
  "text admitted",
  "text refused",
  "none admitted",
] as const;

/**
 * Judge one value of CDN data by the URL Standard: refused exactly when an address it holds parses
 * with the scheme `data`, the whole value for an `xs:anyURI` and each whitespace-separated token
 * for a list.
 *
 * @param form - How the value holds addresses.
 * @param value - The value.
 * @returns Whether the law admits it.
 */
const dataReading = (form: "address" | "list" | "none", value: string): boolean => {
  if (form === "none") {
    return true;
  }

  const addresses = form === "list" ? value.split(/[\t\n\r ]+/u) : [value];

  return !addresses.some(isData);
};

describe("qti/cdn.ts, CDN data", () => {
  it.effect(
    "refuses an xs:anyURI attribute or text exactly when the URL Standard reads its scheme as data, and an address list exactly when one of its tokens does, and leaves every other value free",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(dataFeatures, { cases: 400, sense: notesOnly }),
            draw: drawn((source) => ({
              field: source.draw(
                element(
                  nonEmpty(
                    [
                      ...dataFields.map((field) => ({ ...field, _tag: "attribute" as const })),
                      ...dataTexts.map((text) => ({ ...text, _tag: "text" as const })),
                    ],
                    "field or text",
                  ),
                ),
              ),
              policy: source.draw(element(policies)),
              value: source
                .draw(
                  array(
                    element([
                      "data:",
                      "DaTa:",
                      "da\nta:",
                      "d\tata:",
                      "data :",
                      "dat",
                      "a:",
                      "x",
                      " ",
                      "\t",
                      "\u0001",
                      "image.png",
                      "https://elsewhere.example.test/",
                    ]),
                    { max: 6, min: 0 },
                  ),
                )
                .join(""),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the URL Standard's scheme (Node's URL protocol)",
            },
            runs: 3000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "qti/cdn/data",
          },
          ({ field, policy, value }, c) =>
            Effect.sync(() => {
              const admitted = dataReading(field.form, value);
              const verdict =
                field._tag === "text"
                  ? checkOf(
                      policy,
                      "CDN data",
                      "Node",
                    )({
                      governor: field.governor,
                      stringValue: value,
                      version: field.version,
                    })
                  : checkOf(
                      policy,
                      "CDN data",
                      "Attribute",
                    )({
                      governor: field.governor,
                      lexical: value,
                      name: field.name,
                      version: field.version,
                    });

              assert.strictEqual(
                verdict,
                admitted,
                `${Formatter.format(field)} ${JSON.stringify(value)}`,
              );
              if (field.form === "none") {
                c.note("none admitted");

                return;
              }

              const feature = field._tag === "text" ? "text" : field.form;
              c.note(verdict ? `${feature} admitted` : `${feature} refused`);
            }),
        ),
      ),
  );
});

describe("qti/cdn.ts, CDN style", () => {
  it.effect(
    "refuses a style attribute exactly when it holds url(, @import, image-set( or src(, in any case, or a backslash, and leaves every other attribute free",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.seconds(10),
            concurrency: 1,
            coverage: required(["style admitted", "style refused", "class admitted"] as const, {
              cases: 200,
              sense: notesOnly,
            }),
            draw: drawn((source) => ({
              name: source.draw(element(["style", "class"] as const)),
              policy: source.draw(element(policies)),
              value: source
                .draw(
                  array(
                    element([
                      "url(",
                      "URL(",
                      "uRl(",
                      "url (",
                      "u",
                      "rl(",
                      "@import",
                      "@IMPORT",
                      "@ import",
                      "@im",
                      "port",
                      "image-set(",
                      "-WebKit-Image-Set(",
                      "image-set (",
                      "src(",
                      "SRC(",
                      "sr",
                      "c(",
                      "\\",
                      "\\75 rl(",
                      "color: red",
                      ";",
                      "x",
                    ]),
                    { max: 5, min: 0 },
                  ),
                )
                .join(""),
            })),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the texts the law names, url(, @import, image-set( and src(, in any case, and the backslash",
            },
            runs: 2000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "qti/cdn/style",
          },
          ({ name, policy, value }, c) =>
            Effect.sync(() => {
              const lowered = value.toLowerCase();
              const fetching = ["url(", "@import", "image-set(", "src(", "\\"];
              const admitted = name !== "style" || !fetching.some((text) => lowered.includes(text));
              const verdict = checkOf(
                policy,
                "CDN style",
                "Attribute",
              )({
                governor: "p",
                lexical: value,
                name,
                version: "3.0.0",
              });

              assert.strictEqual(verdict, admitted, `${name} ${JSON.stringify(value)}`);
              if (name === "class") {
                c.note("class admitted");
              } else {
                c.note(verdict ? "style admitted" : "style refused");
              }
            }),
        ),
      ),
  );
});

describe("qti/cdn.ts, CDN foreign", () => {
  it.effect(
    "refuses a node exactly when it is a foreign element, and an attribute exactly when its name is the foreign, no-namespace or own-namespace class: every kind and every attribute name, exhausted",
    (ctx) => {
      const kinds = grammar.kinds.nodeKind.handles.map((kind) => ({
        _tag: "kind" as const,
        handle: kind,
      }));
      const names = grammar.kinds.attributeName.handles.map((name) => ({
        _tag: "name" as const,
        handle: name,
      }));
      const every = [...kinds, ...names];

      return searched(
        ctx,
        exhaust(
          {
            box: "every NodeKind and every AttributeName handle",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace([
              "kind admitted",
              "kind refused",
              "name admitted",
              "name refused",
            ] as const),
            generator: (source) => source.draw(element(nonEmpty(every, "kind or name"))),
            limit: every.length,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the policy's uninterpretable markup: the three foreign element kinds and the three open attribute classes but data-*",
            },
            suite: "qti/cdn/foreign",
          },
          (handle, c) =>
            Effect.sync(() => {
              const refused =
                handle._tag === "kind"
                  ? ["foreign-element", "no-namespace-element", "own-namespace-element"].includes(
                      handle.handle,
                    )
                  : ["foreign", "no-namespace", "own-namespace"].includes(handle.handle);
              const verdict =
                handle._tag === "kind"
                  ? checkOf(ownPolicy, "CDN foreign", "Node")({ kind: handle.handle })
                  : checkOf(ownPolicy, "CDN foreign", "Attribute")({ name: handle.handle });

              assert.strictEqual(verdict, !refused, handle.handle);
              c.note(`${handle._tag} ${verdict ? "admitted" : "refused"}`);
            }),
        ),
      );
    },
  );
});

describe("qti/cdn.ts, the laws a policy states", () => {
  it("names each law by a row of the law table, each check by its law, and a refusal under any one by the table's rule, so an import refused by one is reported, never unowned", () => {
    for (const policy of policies) {
      const byName = cdnLawsByName(Option.some(policy));

      assert.sameMembers(Object.keys(byName), Object.keys(policyLaws), policy.cdn);
      for (const [name, statements] of Object.entries(byName)) {
        const law = lawNames.find((known) => known === name);

        assert.isDefined(law, `${name}: no law of the table`);
        for (const statement of statements) {
          assert.strictEqual(statement.kind, "check", name);
          if (statement.kind === "check") {
            assert.strictEqual(statement.name, checkNameOf(law), name);

            const refused: Law = {
              kind: "check",
              name: statement.name,
              relation: statement.relation.name,
            };
            const refusal = refusalOfLaws([refused], { kind: "unreported" }, grammar);

            assert.isTrue(
              Result.isSuccess(refusal),
              `${name} over ${statement.relation.name}: unowned`,
            );
            assert.strictEqual(
              Result.isSuccess(refusal) ? refusal.success.rule : undefined,
              lawTable[law].rule,
              name,
            );
          }
        }
      }
    }
  });

  it("builds Qti for no policy as the schema the committed migrations install, and for a policy as one value per origin, its statements every module's then the policy's", () => {
    const own = qtiSchema(Option.none());
    const built = qtiSchema(Option.some(ownPolicy));
    const cdnLaws: readonly unknown[] = Object.values(cdnLawsByName(Option.some(ownPolicy))).flat();
    const ownStatements: readonly unknown[] = own.statements;
    const builtStatements: readonly unknown[] = built.statements;

    assert.deepStrictEqual(cdnLawsByName(Option.none()), {});
    assert.strictEqual(qtiSchema(Option.some({ cdn: ownPolicy.cdn })), built, "one per origin");
    assert.strictEqual(builtStatements.length, ownStatements.length + cdnLaws.length);
    assert.isTrue(
      builtStatements.every(
        (statement, at) =>
          statement ===
          (at < ownStatements.length ? ownStatements[at] : cdnLaws[at - ownStatements.length]),
      ),
      "every module's statements, then the policy's, each the very statement",
    );
    assert.sameOrderedMembers(Object.keys(built.relations), Object.keys(own.relations));
    assert.isTrue(
      Object.entries(built.relations).every(
        ([name, relation]) =>
          Object.getOwnPropertyDescriptor(own.relations, name)?.value === relation,
      ),
      "the same relations",
    );
    assert.notInclude(ownStatements, cdnLaws[0]);
    if (Qti === own) {
      assert.strictEqual(qtiSchema(Option.none()), Qti);
    }
  });
});

describe("vocab/fetched.ts, against the grammar", () => {
  it("declares fetched attributes the grammar admits, fetched texts and address lists of the domains it names, and every media URL the grammar types URLDType as a fetched attribute", () => {
    const admitted = new Set(
      grammar.attributes.admission.rows.map(({ kind, name }) => `${kind} ${name}`),
    );
    const domains = new Map(
      grammar.attributes.valueDomain.rows.map(({ domain, primitive }) => [domain, primitive]),
    );
    const fetched = new Set(fetchedAttributes.map(({ kind, name }) => `${kind} ${name}`));

    for (const { kind, name } of fetchedAttributes) {
      assert.isTrue(admitted.has(`${kind} ${name}`), `${kind} admits no ${name}`);
    }

    for (const kind of fetchedTexts) {
      const texts = grammar.attributes.text.rows.filter((row) => row.kind === kind);

      assert.isNotEmpty(texts, `${kind} has no text`);
      for (const { domain } of texts) {
        assert.strictEqual(domains.get(domain), "anyURI", `${kind}'s text`);
      }
    }

    for (const name of addressLists) {
      const lists = grammar.attributes.admission.rows.filter((row) => row.name === name);

      assert.isNotEmpty(lists, name);
      for (const { domain } of lists) {
        assert.strictEqual(domains.get(domain), "list", name);
      }
    }

    for (const { domain, kind, name } of grammar.attributes.admission.rows) {
      if (domain.startsWith("URLDType")) {
        assert.isTrue(fetched.has(`${kind} ${name}`), `${kind}'s ${name}, a media URL, is fetched`);
      }
    }
  });
});
